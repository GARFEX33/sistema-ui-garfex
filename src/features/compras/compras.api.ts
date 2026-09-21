import { z } from 'zod'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type {
  ConfirmSupplierProductMappingInput,
  CorrectSupplierProductMappingInput,
  PurchaseImportInput,
  PurchaseImportResponse,
  PurchaseLineWorkbenchFilterInput,
  ResolvePurchaseLineInput,
  ResolveSupplierProductMappingConflictInput,
  ReportSupplierProductMappingConflictInput,
  RetireSupplierProductMappingInput,
  SetPurchaseLineResolutionOverrideInput,
} from './compras.types'

type PurchaseRestFetch = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>
type IdRead = { id: string; signal?: AbortSignal }
type UuidRead = { uuid: string; signal?: AbortSignal }
type LineRead = { purchaseId: string; signal?: AbortSignal }
type SupplierWindow = {
  supplierId: string
  limit: number
  offset: number
  signal?: AbortSignal
}
type SkuRead = { supplierId: string; sku: string; signal?: AbortSignal }

const id = z.string()
const decimalIdentifier = z
  .string()
  .regex(/^(?:0|[1-9][0-9]*)$/)
  .max(19)
const decimalRevision = z
  .string()
  .regex(/^(?:0|[1-9][0-9]*)$/)
  .max(20)
const positiveDecimalIdentifier = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .max(19)
const isCalendarDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12) return false

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  return day >= 1 && day <= daysInMonth[month - 1]
}
const calendarDate = z.string().refine(isCalendarDate)
const purchaseSchema = z
  .object({
    id,
    supplierId: id,
    branchId: id.nullable(),
    cfdiUuid: z.string(),
    series: z.string(),
    folio: z.string(),
    issuedAt: z.string(),
    currency: z.string(),
    exchangeRate: z.string().nullable(),
    subtotal: z.string(),
    discount: z.string(),
    taxTransferred: z.string(),
    taxWithheld: z.string(),
    total: z.string(),
    issuerTaxId: z.string(),
    issuerName: z.string(),
    xml: z.object({ hash: z.string(), filename: z.string() }).strict(),
    importedAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict()
const lineSchema = z
  .object({
    id: decimalIdentifier,
    purchaseId: decimalIdentifier,
    lineNumber: z.number().int(),
    description: z.string(),
    supplierSku: z.string(),
    satProductCode: z.string(),
    quantity: z.string(),
    unitCode: z.string(),
    unit: z.string(),
    unitPrice: z.string(),
    amount: z.string(),
    discount: z.string(),
    taxTransferred: z.string(),
    taxWithheld: z.string(),
    taxObject: z.string(),
    supplierProductId: decimalIdentifier.nullable(),
    resolutionRevision: decimalRevision,
    resolutionOverride: z.enum(['NONE', 'NO_APLICA', 'CONFLICTO']),
    effectiveStatus: z.enum([
      'PENDIENTE',
      'VINCULADO',
      'SUSPENDIDO',
      'NO_APLICA',
      'CONFLICTO',
    ]),
    effectiveCause: z.string(),
  })
  .strict()
const purchaseImportResponseSchema = z
  .object({
    purchase: purchaseSchema,
    lines: z.array(lineSchema),
    alreadyExisted: z.boolean(),
  })
  .strict()
const supplierProductSchema = z
  .object({
    id,
    supplierId: id,
    supplierSku: z.string(),
    description: z.string(),
    resourceId: id.nullable(),
    mappingRevision: decimalRevision,
    resourceActive: z.boolean().nullable(),
    mappingState: z.enum([
      'UNRESOLVED',
      'CONFIRMED',
      'SUSPENDED',
      'IDENTITY_CONFLICT',
    ]),
    mappingCause: z.enum([
      'NONE',
      'UNRESOLVED',
      'RESOURCE_INACTIVE',
      'IDENTITY_CONFLICT',
    ]),
    notes: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict()
const supplierProductMappingProjectionSchema = z
  .object({
    id: positiveDecimalIdentifier,
    supplierId: positiveDecimalIdentifier,
    supplierSku: z.string(),
    description: z.string(),
    resourceId: positiveDecimalIdentifier.nullable(),
    mappingRevision: decimalRevision,
    resourceActive: z.boolean().nullable(),
    mappingState: z.enum([
      'UNRESOLVED',
      'CONFIRMED',
      'SUSPENDED',
      'IDENTITY_CONFLICT',
    ]),
    mappingCause: z.enum([
      'NONE',
      'UNRESOLVED',
      'RESOURCE_INACTIVE',
      'IDENTITY_CONFLICT',
    ]),
    notes: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict()
const commercialIdentitySchema = z
  .object({
    supplierProductId: positiveDecimalIdentifier,
    supplierId: positiveDecimalIdentifier,
    commercialSupplierSku: z.string(),
    disposition: z.enum(['CREATED', 'REUSED', 'ALREADY_MAPPED']),
    mappingRevision: decimalRevision,
    resourceId: positiveDecimalIdentifier.nullable(),
  })
  .strict()
const resolvePurchaseLineResponseSchema = z
  .object({
    line: lineSchema,
    supplierProduct: supplierProductMappingProjectionSchema,
    commercialIdentity: commercialIdentitySchema,
  })
  .strict()
const purchaseLineResolutionOverrideRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    override: z.enum(['NONE', 'NO_APLICA', 'CONFLICTO']),
    expectedRevision: decimalRevision,
  })
  .strict()
const resolvePurchaseLineRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    resourceId: positiveDecimalIdentifier,
    expectedSupplierProductId: positiveDecimalIdentifier.nullable(),
    expectedMappingRevision: decimalRevision.nullable(),
    expectedResolutionRevision: decimalRevision,
    commercialSupplierSku: z.string(),
  })
  .strict()
const confirmSupplierProductMappingRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    resourceId: positiveDecimalIdentifier,
    expectedRevision: decimalRevision,
  })
  .strict()
const correctSupplierProductMappingRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    expectedCurrentResourceId: positiveDecimalIdentifier,
    resourceId: positiveDecimalIdentifier,
    expectedRevision: decimalRevision,
  })
  .strict()
const retireSupplierProductMappingRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    expectedCurrentResourceId: positiveDecimalIdentifier,
    expectedRevision: decimalRevision,
  })
  .strict()
const reportSupplierProductMappingConflictRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    expectedCurrentResourceId: positiveDecimalIdentifier,
    expectedRevision: decimalRevision,
  })
  .strict()
const resolveSupplierProductMappingConflictRequestSchema = z
  .object({
    actor: z.string(),
    reason: z.string(),
    expectedCurrentResourceId: positiveDecimalIdentifier,
    resourceId: positiveDecimalIdentifier,
    expectedRevision: decimalRevision,
  })
  .strict()
const purchasePageSchema = z
  .object({
    purchases: z.array(purchaseSchema),
    hasPrevious: z.boolean(),
    hasNext: z.boolean(),
  })
  .strict()
const supplierProductPageSchema = z
  .object({
    products: z.array(supplierProductSchema),
    hasPrevious: z.boolean(),
    hasNext: z.boolean(),
  })
  .strict()
const effectiveStatusSchema = z.enum([
  'PENDIENTE',
  'VINCULADO',
  'SUSPENDIDO',
  'NO_APLICA',
  'CONFLICTO',
])
const resolutionOverrideSchema = z.enum(['NONE', 'NO_APLICA', 'CONFLICTO'])
const purchaseLineWorkbenchRowSchema = z
  .object({
    lineId: decimalIdentifier,
    purchaseId: decimalIdentifier,
    lineNumber: z.number().int(),
    issuedAt: z.string(),
    series: z.string(),
    folio: z.string(),
    cfdiUuid: z.string(),
    supplierId: positiveDecimalIdentifier,
    supplierDisplayName: z.string(),
    description: z.string(),
    supplierSku: z.string(),
    commercialSupplierSku: z.string().nullable(),
    satProductCode: z.string(),
    quantity: z.string(),
    unitCode: z.string(),
    unit: z.string(),
    unitPrice: z.string(),
    amount: z.string(),
    currency: z.string(),
    supplierProductId: decimalIdentifier.nullable(),
    mappingRevision: decimalRevision.nullable(),
    resolutionRevision: decimalRevision,
    resourceId: decimalIdentifier.nullable(),
    resourceIdentity: z.string().nullable(),
    resourceDisplayName: z.string().nullable(),
    resolutionOverride: resolutionOverrideSchema,
    effectiveStatus: effectiveStatusSchema,
    effectiveCause: z.string(),
  })
  .strict()
const purchaseLineWorkbenchPageSchema = z
  .object({
    lines: z.array(purchaseLineWorkbenchRowSchema),
    hasPrevious: z.boolean(),
    hasNext: z.boolean(),
  })
  .strict()
const purchaseLineWorkbenchInputSchema = z
  .object({
    supplierId: positiveDecimalIdentifier.optional(),
    status: effectiveStatusSchema.optional(),
    dateFrom: calendarDate.optional(),
    dateTo: calendarDate.optional(),
    invoice: z.string().optional(),
    supplierSku: z.string().optional(),
    description: z.string().optional(),
    limit: z.number().int().min(1).max(50),
    offset: z.number().int().min(0),
  })
  .strict()
const errorEnvelopeSchema = z
  .object({
    error: z.string(),
    code: z.string().optional(),
    detail: z.string().optional(),
  })
  .strict()

const invalid = (): never => {
  throw new Error('Invalid compras response')
}
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  return result.success ? result.data : invalid()
}
const parseInput = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('Invalid compras input')
  return result.data
}
const errorFrom = (body: unknown, status: number) => {
  const result = errorEnvelopeSchema.safeParse(body)
  const error = result.success ? result.data : undefined
  return Object.assign(new Error(error?.error ?? `HTTP ${status}`), {
    name: 'PurchasesRestError' as const,
    status,
    code: error?.code,
    detail: error?.detail,
  })
}
const readJson = async (
  fetch: PurchaseRestFetch,
  path: string,
  signal?: AbortSignal,
) => {
  const response = await fetch(path, { signal })
  const body = await response.json()
  if (!response.ok) throw errorFrom(body, response.status)
  return body
}
const read = <T>(
  fetch: PurchaseRestFetch,
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
) => readJson(fetch, path, signal).then((body) => parse(schema, body))
const pathId = (value: string) => encodeURIComponent(value)
const pageQuery = (limit: number, offset: number) =>
  `limit=${limit}&offset=${offset}`
const workbenchQuery = (input: PurchaseLineWorkbenchFilterInput) => {
  const result = purchaseLineWorkbenchInputSchema.safeParse({
    supplierId: input.supplierId,
    status: input.status,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    invoice: input.invoice,
    supplierSku: input.supplierSku,
    description: input.description,
    limit: input.limit,
    offset: input.offset,
  })
  if (!result.success) throw new Error('Invalid compras input')

  const query = new URLSearchParams()
  for (const name of [
    'supplierId',
    'status',
    'dateFrom',
    'dateTo',
    'invoice',
    'supplierSku',
    'description',
  ] as const) {
    const value = result.data[name]
    if (value !== undefined) query.set(name, value)
  }
  query.set('limit', String(result.data.limit))
  query.set('offset', String(result.data.offset))
  return query.toString()
}
const readId = <T>(
  fetch: PurchaseRestFetch,
  input: IdRead,
  path: string,
  schema: z.ZodType<T>,
) => read(fetch, `${path}/${pathId(input.id)}`, schema, input.signal)
const readWindow = <T>(
  fetch: PurchaseRestFetch,
  input: SupplierWindow,
  path: string,
  schema: z.ZodType<T>,
) =>
  read(
    fetch,
    `${path}?${pageQuery(input.limit, input.offset)}`,
    schema,
    input.signal,
  )
const postJson = async <T>(
  fetch: PurchaseRestFetch,
  path: string,
  body: Record<string, unknown>,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const responseBody = await response.json()
  if (response.status !== 200) throw errorFrom(responseBody, response.status)
  return parse(schema, responseBody)
}
const importPurchase = async (
  fetch: PurchaseRestFetch,
  actor: string,
  input: PurchaseImportInput,
): Promise<PurchaseImportResponse> => {
  const form = new FormData()
  form.append('file', input.file)
  form.append('actor', actor)
  if (input.branchId !== undefined) form.append('branchId', input.branchId)
  const response = await fetch('/v1/purchases', {
    method: 'POST',
    body: form,
    signal: input.signal,
  })
  const responseBody = await response.json()
  if (response.status !== 201 && response.status !== 200)
    throw errorFrom(responseBody, response.status)
  const parsed = parse(purchaseImportResponseSchema, responseBody)
  return { ...parsed.purchase, alreadyExisted: parsed.alreadyExisted }
}
export function createComprasRestApi(
  fetch: PurchaseRestFetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
) {
  return {
    getPurchase: (input: IdRead) =>
      readId(fetch, input, '/v1/purchases', purchaseSchema),
    getPurchaseByUuid: (input: UuidRead) =>
      read(
        fetch,
        `/v1/purchases/by-uuid/${pathId(input.uuid)}`,
        purchaseSchema,
        input.signal,
      ),
    listPurchaseLines: (input: LineRead) =>
      read(
        fetch,
        `/v1/purchases/${pathId(input.purchaseId)}/lines`,
        z.array(lineSchema),
        input.signal,
      ),
    listPurchaseLineWorkbench: async (
      input: PurchaseLineWorkbenchFilterInput,
    ) =>
      read(
        fetch,
        `/v1/purchase-lines?${workbenchQuery(input)}`,
        purchaseLineWorkbenchPageSchema,
        input.signal,
      ),
    listSupplierPurchases: (input: SupplierWindow) =>
      readWindow(
        fetch,
        input,
        `/v1/suppliers/${pathId(input.supplierId)}/purchases`,
        purchasePageSchema,
      ),
    listSupplierProducts: (input: SupplierWindow) =>
      readWindow(
        fetch,
        input,
        `/v1/suppliers/${pathId(input.supplierId)}/products`,
        supplierProductPageSchema,
      ),
    findSupplierProduct: (input: SkuRead) =>
      read(
        fetch,
        `/v1/suppliers/${pathId(input.supplierId)}/products/find?sku=${pathId(input.sku)}`,
        supplierProductSchema,
        input.signal,
      ),
    getSupplierProduct: (input: IdRead) =>
      readId(fetch, input, '/v1/supplier-products', supplierProductSchema),
    importPurchase: (input: PurchaseImportInput) =>
      withRestActor(
        (actor) => importPurchase(fetch, actor, input),
        actorOptions,
      ),
    resolvePurchaseLine: (input: ResolvePurchaseLineInput) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/purchase-lines/${pathId(input.id)}/resolve`,
            parseInput(resolvePurchaseLineRequestSchema, {
              actor,
              reason: input.reason,
              resourceId: input.resourceId,
              expectedSupplierProductId: input.expectedSupplierProductId,
              expectedMappingRevision: input.expectedMappingRevision,
              expectedResolutionRevision: input.expectedResolutionRevision,
              commercialSupplierSku: input.commercialSupplierSku,
            }),
            resolvePurchaseLineResponseSchema,
            input.signal,
          ),
        actorOptions,
      ),
    setPurchaseLineResolutionOverride: (
      input: SetPurchaseLineResolutionOverrideInput,
    ) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/purchase-lines/${pathId(input.id)}/resolution-override`,
            parseInput(purchaseLineResolutionOverrideRequestSchema, {
              actor,
              reason: input.reason,
              override: input.override,
              expectedRevision: input.expectedRevision,
            }),
            lineSchema,
            input.signal,
          ),
        actorOptions,
      ),
    confirmSupplierProductMapping: (
      input: ConfirmSupplierProductMappingInput,
    ) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/mapping/confirm`,
            parseInput(confirmSupplierProductMappingRequestSchema, {
              actor,
              reason: input.reason,
              resourceId: input.resourceId,
              expectedRevision: input.expectedRevision,
            }),
            supplierProductMappingProjectionSchema,
            input.signal,
          ),
        actorOptions,
      ),
    correctSupplierProductMapping: (
      input: CorrectSupplierProductMappingInput,
    ) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/mapping/correct`,
            parseInput(correctSupplierProductMappingRequestSchema, {
              actor,
              reason: input.reason,
              expectedCurrentResourceId: input.expectedCurrentResourceId,
              resourceId: input.resourceId,
              expectedRevision: input.expectedRevision,
            }),
            supplierProductMappingProjectionSchema,
            input.signal,
          ),
        actorOptions,
      ),
    retireSupplierProductMapping: (input: RetireSupplierProductMappingInput) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/mapping/retire`,
            parseInput(retireSupplierProductMappingRequestSchema, {
              actor,
              reason: input.reason,
              expectedCurrentResourceId: input.expectedCurrentResourceId,
              expectedRevision: input.expectedRevision,
            }),
            supplierProductMappingProjectionSchema,
            input.signal,
          ),
        actorOptions,
      ),
    reportSupplierProductMappingConflict: (
      input: ReportSupplierProductMappingConflictInput,
    ) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/mapping/report-conflict`,
            parseInput(reportSupplierProductMappingConflictRequestSchema, {
              actor,
              reason: input.reason,
              expectedCurrentResourceId: input.expectedCurrentResourceId,
              expectedRevision: input.expectedRevision,
            }),
            supplierProductMappingProjectionSchema,
            input.signal,
          ),
        actorOptions,
      ),
    resolveSupplierProductMappingConflict: (
      input: ResolveSupplierProductMappingConflictInput,
    ) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/mapping/resolve-conflict`,
            parseInput(resolveSupplierProductMappingConflictRequestSchema, {
              actor,
              reason: input.reason,
              expectedCurrentResourceId: input.expectedCurrentResourceId,
              resourceId: input.resourceId,
              expectedRevision: input.expectedRevision,
            }),
            supplierProductMappingProjectionSchema,
            input.signal,
          ),
        actorOptions,
      ),
  }
}

export type ComprasRestApi = ReturnType<typeof createComprasRestApi>

import { z } from 'zod'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type {
  LinkStatus,
  LinkSupplierProductInput,
  PurchaseImportInput,
  PurchaseImportResponse,
  PurchaseLineLinkStatusInput,
  UnlinkSupplierProductInput,
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
const purchaseImportResponseSchema = purchaseSchema
  .extend({ alreadyExisted: z.boolean() })
  .strict()
const linkStatusSchema = z.enum([
  'PENDIENTE',
  'VINCULADO',
  'NO_APLICA',
  'CONFLICTO',
])
const lineSchema = z
  .object({
    id,
    purchaseId: id,
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
    supplierProductId: id.nullable(),
    linkStatus: z.enum(['PENDIENTE', 'VINCULADO', 'NO_APLICA', 'CONFLICTO']),
  })
  .strict()
const supplierProductSchema = z
  .object({
    id,
    supplierId: id,
    supplierSku: z.string(),
    description: z.string(),
    resourceId: id.nullable(),
    notes: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
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
const errorEnvelopeSchema = z
  .object({ error: z.string(), code: z.string(), detail: z.string() })
  .strict()

const invalid = (): never => {
  throw new Error('Invalid compras response')
}
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  return result.success ? result.data : invalid()
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
  return parse(purchaseImportResponseSchema, responseBody)
}
const validLinkStatus = (status: LinkStatus) => {
  if (!linkStatusSchema.safeParse(status).success)
    throw new Error('Invalid compras input')
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
    linkSupplierProduct: (input: LinkSupplierProductInput) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/link`,
            { actor, resourceId: input.resourceId },
            supplierProductSchema,
            input.signal,
          ),
        actorOptions,
      ),
    unlinkSupplierProduct: (input: UnlinkSupplierProductInput) =>
      withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/supplier-products/${pathId(input.id)}/unlink`,
            { actor },
            supplierProductSchema,
            input.signal,
          ),
        actorOptions,
      ),
    setPurchaseLineLinkStatus: async (input: PurchaseLineLinkStatusInput) => {
      validLinkStatus(input.status)
      return withRestActor(
        (actor) =>
          postJson(
            fetch,
            `/v1/purchase-lines/${pathId(input.id)}/link-status`,
            { actor, status: input.status },
            lineSchema,
            input.signal,
          ),
        actorOptions,
      )
    },
  }
}

export type ComprasRestApi = ReturnType<typeof createComprasRestApi>

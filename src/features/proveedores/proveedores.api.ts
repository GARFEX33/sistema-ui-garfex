import { z } from 'zod'
import { ErrorEnvelopeSchema } from '../../shared/catalog/catalogRest.contract'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type {
  Supplier,
  SupplierCFDIPreview,
  SupplierPage,
  SupplierRestCreateInput,
  SupplierRestDetailInput,
  SupplierRestListInput,
  SupplierRestUpdateInput,
} from './proveedores.types'

const bad = (): never => {
  throw new Error('Invalid proveedores response')
}

export interface SupplierRestCFDIPreviewInput {
  file: Blob
  signal?: AbortSignal
}

export interface ProveedoresRestApi {
  listSuppliers: (input: SupplierRestListInput) => Promise<SupplierPage>
  getSupplier: (input: SupplierRestDetailInput) => Promise<Supplier>
  createSupplier: (input: SupplierRestCreateInput) => Promise<Supplier>
  updateSupplier: (input: SupplierRestUpdateInput) => Promise<Supplier>
  previewSupplierFromCfdi: (
    input: SupplierRestCFDIPreviewInput,
  ) => Promise<SupplierCFDIPreview>
}

type SupplierRestFetch = (
  input: string,
  init?: {
    signal?: AbortSignal
    method?: string
    headers?: Record<string, string>
    body?: string | Blob
  },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

const restSupplierSchema = z.object({
  id: z.string(),
  tradeName: z.string(),
  legalName: z.string(),
  taxIdentifier: z.string(),
  website: z.string(),
  notes: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const restSupplierPageSchema = z.object({
  suppliers: z.array(restSupplierSchema),
  hasPrevious: z.boolean(),
  hasNext: z.boolean(),
})

const restSupplierListInputSchema = z.object({
  scope: z.enum(['ALL', 'ACTIVE', 'INACTIVE']),
  text: z.string().optional(),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
})

const restSupplierDetailInputSchema = z.object({
  id: z.string(),
})

const restSupplierFieldsSchema = z.object({
  tradeName: z.string().optional(),
  legalName: z.string().optional(),
  taxIdentifier: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
})

const restSupplierUpdateInputSchema = restSupplierFieldsSchema.extend({
  id: z.string(),
})

const restCFDIPreviewSchema = z.object({
  draft: z.object({
    taxIdentifier: z.string(),
    legalName: z.string(),
    taxRegime: z.string(),
  }),
  existing: restSupplierSchema.nullable(),
})

const restSupplier = (value: unknown): Supplier => {
  const result = restSupplierSchema.safeParse(value)
  if (!result.success) return bad()
  return result.data
}

const restSupplierPage = (value: unknown): SupplierPage => {
  const result = restSupplierPageSchema.safeParse(value)
  if (!result.success) return bad()
  return result.data
}

const restSupplierPath = (id: string) => '/v1/suppliers/' + encodeURIComponent(id)
const restSupplierFromCfdiPreviewPath = '/v1/suppliers/from-cfdi/preview'

const readRestJson = async (
  fetch: SupplierRestFetch,
  path: string,
  signal?: AbortSignal,
): Promise<unknown> => {
  const response = await fetch(path, { signal })
  const body: unknown = await response.json()
  if (response.ok) return body
  const error = ErrorEnvelopeSchema.safeParse(body)
  throw new Error(error.success ? error.data.error : 'HTTP ' + response.status)
}

const writeRestJson = async (
  fetch: SupplierRestFetch,
  path: string,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>,
  expectedStatus: number,
): Promise<unknown> => {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const responseBody: unknown = await response.json()
  if (response.status !== expectedStatus) {
    const error = ErrorEnvelopeSchema.safeParse(responseBody)
    throw new Error(
      error.success ? error.data.error : 'HTTP ' + response.status,
    )
  }
  return responseBody
}

export function createProveedoresRestApi(
  fetch: SupplierRestFetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): ProveedoresRestApi {
  return {
    async listSuppliers(input) {
      const { signal, ...query } = input
      const result = restSupplierListInputSchema.safeParse(query)
      if (!result.success) return bad()
      const params = new URLSearchParams({
        scope: result.data.scope,
        ...(result.data.text === undefined ? {} : { text: result.data.text }),
        limit: String(result.data.limit),
        offset: String(result.data.offset),
      })
      return restSupplierPage(
        await readRestJson(fetch, '/v1/suppliers?' + params, signal),
      )
    },
    async getSupplier(input) {
      const { signal, ...detail } = input
      const result = restSupplierDetailInputSchema.safeParse(detail)
      if (!result.success) return bad()
      return restSupplier(
        await readRestJson(fetch, restSupplierPath(result.data.id), signal),
      )
    },
    async createSupplier(input) {
      const result = restSupplierFieldsSchema.safeParse(input)
      if (!result.success) return bad()
      return withRestActor(async (actor) => {
        return restSupplier(
          await writeRestJson(
            fetch,
            '/v1/suppliers',
            'POST',
            { actor, ...result.data },
            201,
          ),
        )
      }, actorOptions)
    },
    async updateSupplier(input) {
      const result = restSupplierUpdateInputSchema.safeParse(input)
      if (!result.success) return bad()
      const { id, ...fields } = result.data
      return withRestActor(async (actor) => {
        return restSupplier(
          await writeRestJson(
            fetch,
            restSupplierPath(id),
            'PUT',
            { actor, ...fields },
            200,
          ),
        )
      }, actorOptions)
    },
    async previewSupplierFromCfdi({ file, signal }) {
      const response = await fetch(restSupplierFromCfdiPreviewPath, {
        method: 'POST',
        headers: { 'content-type': 'application/xml' },
        body: file,
        signal,
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const error = ErrorEnvelopeSchema.safeParse(body)
        throw new Error(
          error.success ? error.data.error : 'HTTP ' + response.status,
        )
      }
      const result = restCFDIPreviewSchema.safeParse(body)
      if (!result.success) return bad()
      return result.data
    },
  }
}

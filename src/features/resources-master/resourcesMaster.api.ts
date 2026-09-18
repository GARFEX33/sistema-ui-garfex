import { z } from 'zod'
import {
  CatalogPageSchema,
  CatalogValueSchema,
  ErrorEnvelopeSchema,
  type CatalogRecord as RestCatalogRecord,
} from '../../shared/catalog/catalogRest.contract'
import {
  parseEffectiveAttributesResponse,
  validEffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type {
  EffectiveAttributesRequest,
  EffectiveAttributesResponse,
} from '../../shared/catalog/effectiveAttributes.contract'
import type {
  Resource,
  ResourcePage,
  ResourceRestCreateInput,
  ResourceRestDetailInput,
  ResourceRestListInput,
  ResourceHierarchyWindowInput,
  ResourceHierarchyWindowPage,
  ResourceContextClassRestItem,
  ResourceContextFamilyRestInput,
  ResourceContextFamilyRestItem,
  ResourceContextTypeRestInput,
  ResourceContextTypeRestItem,
  ResourceContextUnitRestItem,
} from './resourcesMaster.types'

const bad = (): never => {
  throw new Error('Invalid resources master response')
}

export interface ResourcesMasterRestReadApi {
  listResources: (input: ResourceRestListInput) => Promise<ResourcePage>
  getResourceDetail: (input: ResourceRestDetailInput) => Promise<Resource>
  describeResource: (input: ResourceRestDetailInput) => Promise<string>
  listHierarchyClasses: (
    input: ResourceHierarchyWindowInput,
  ) => Promise<ResourceHierarchyWindowPage<ResourceContextClassRestItem>>
  listHierarchyFamilies: (
    input: ResourceContextFamilyRestInput,
  ) => Promise<ResourceHierarchyWindowPage<ResourceContextFamilyRestItem>>
  listHierarchyTypes: (
    input: ResourceContextTypeRestInput,
  ) => Promise<ResourceHierarchyWindowPage<ResourceContextTypeRestItem>>
  listUnits: (
    input: ResourceHierarchyWindowInput,
  ) => Promise<ResourceHierarchyWindowPage<ResourceContextUnitRestItem>>
  getTypeEffectiveAttributes: (
    input: EffectiveAttributesRequest,
  ) => Promise<EffectiveAttributesResponse>
  createResource: (input: ResourceRestCreateInput) => Promise<Resource>
}

type ResourceRestFetch = (
  input: string,
  init?: {
    signal?: AbortSignal
    method?: string
    headers?: Record<string, string>
    body?: string
  },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

const restResourceSchema = z.object({
  id: z.string(),
  identityV1: z.string(),
  scope: z.object({
    classCode: z.string(),
    familyCode: z.string(),
    typeCode: z.string(),
  }),
  naturalUnit: z.string(),
  active: z.boolean(),
  revision: z.string(),
  attributes: z.array(
    z.object({ code: z.string(), value: CatalogValueSchema }),
  ),
})

const restResourcePageSchema = z.object({
  resources: z.array(restResourceSchema),
  hasPrevious: z.boolean(),
  hasNext: z.boolean(),
})

const restResourceListInputSchema = z.object({
  scope: z.enum(['ALL', 'ACTIVE', 'INACTIVE']),
  text: z.string().optional(),
  classCode: z.string().optional(),
  familyCode: z.string().optional(),
  typeCode: z.string().optional(),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
})

const restResourceDetailInputSchema = z.object({
  classCode: z.string(),
  identityV1: z.string(),
})

const restHierarchyWindowInputSchema = z.object({
  scope: z.enum(['ALL', 'ACTIVE', 'INACTIVE']),
  text: z.string().optional(),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
})

const restFamilyWindowInputSchema = restHierarchyWindowInputSchema.extend({
  classCode: z.string(),
})

const restTypeWindowInputSchema = restFamilyWindowInputSchema.extend({
  familyCode: z.string(),
})

export function parseResourcePage(value: unknown): ResourcePage {
  const result = restResourcePageSchema.safeParse(value)
  if (!result.success) return bad()
  return result.data
}

const restResource = (value: unknown): Resource => {
  const result = restResourceSchema.safeParse(value)
  if (!result.success) return bad()
  return result.data
}

const restPath = (input: ResourceRestDetailInput) => {
  const result = restResourceDetailInputSchema.safeParse(input)
  if (!result.success) return bad()
  return (
    '/v1/resources/' +
    encodeURIComponent(result.data.classCode) +
    '/' +
    encodeURIComponent(result.data.identityV1)
  )
}

const readRestJson = async (
  fetch: ResourceRestFetch,
  path: string,
  signal?: AbortSignal,
): Promise<unknown> => {
  const response = await fetch(path, { signal })
  const body: unknown = await response.json()
  if (response.ok) return body
  const error = ErrorEnvelopeSchema.safeParse(body)
  throw new Error(error.success ? error.data.error : 'HTTP ' + response.status)
}

const restHierarchyBase = (
  record: RestCatalogRecord,
  kind: 'CLASE' | 'FAMILIA' | 'TIPO' | 'UNIDAD',
): ResourceContextClassRestItem => {
  const code = record.values.code
  const name = record.values.name
  if (record.kind !== kind || code?.kind !== 'CODE' || name?.kind !== 'TEXT')
    return bad()
  return {
    id: record.id,
    code: code.value,
    name: name.value,
    active: record.active,
    revision: record.revision,
  }
}

const restContextFamilyItem = (
  record: RestCatalogRecord,
  classCode: string,
): ResourceContextFamilyRestItem => {
  const classReference = record.values.class
  if (
    classReference?.kind !== 'REFERENCE' ||
    classReference.reference.kind !== 'CLASE' ||
    classReference.reference.code !== classCode
  )
    return bad()
  return { ...restHierarchyBase(record, 'FAMILIA'), classCode }
}

const restContextTypeItem = (
  record: RestCatalogRecord,
  input: Pick<ResourceContextTypeRestInput, 'classCode' | 'familyCode'>,
): ResourceContextTypeRestItem => {
  const classReference = record.values.class
  const familyReference = record.values.family
  if (
    familyReference?.kind !== 'REFERENCE' ||
    familyReference.reference.kind !== 'FAMILIA' ||
    familyReference.reference.code !== input.familyCode ||
    classReference?.kind !== 'REFERENCE' ||
    classReference.reference.kind !== 'CLASE' ||
    classReference.reference.code !== input.classCode
  )
    return bad()
  return {
    ...restHierarchyBase(record, 'TIPO'),
    classCode: input.classCode,
    familyCode: input.familyCode,
  }
}

const restUnitItem = (
  record: RestCatalogRecord,
): ResourceContextUnitRestItem => {
  const symbol = record.values.symbol
  const dimension = record.values.dimension
  if (symbol?.kind !== 'TEXT' || dimension?.kind !== 'TEXT') return bad()
  return {
    ...restHierarchyBase(record, 'UNIDAD'),
    symbol: symbol.value,
    dimension: dimension.value,
  }
}

const restHierarchyParams = (input: ResourceHierarchyWindowInput) =>
  new URLSearchParams({
    scope: input.scope,
    ...(input.text === undefined ? {} : { text: input.text }),
    limit: String(input.limit),
    offset: String(input.offset),
  })

const readRestCatalogPage = async (
  fetch: ResourceRestFetch,
  kind: 'CLASE' | 'FAMILIA' | 'TIPO' | 'UNIDAD',
  input: ResourceHierarchyWindowInput,
  filter?: readonly [string, string],
) => {
  const params = restHierarchyParams(input)
  if (filter) params.set(...filter)
  const result = CatalogPageSchema.safeParse(
    await readRestJson(
      fetch,
      '/v1/catalog/' + kind + '?' + params,
      input.signal,
    ),
  )
  if (!result.success) return bad()
  return result.data
}

export function createResourcesMasterRestApi(
  fetch: ResourceRestFetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): ResourcesMasterRestReadApi {
  return {
    async listResources(input) {
      const { signal, ...query } = input
      const result = restResourceListInputSchema.safeParse(query)
      if (!result.success) return bad()
      const params = new URLSearchParams({
        scope: result.data.scope,
        ...(result.data.text === undefined ? {} : { text: result.data.text }),
        ...(result.data.classCode === undefined
          ? {}
          : { classCode: result.data.classCode }),
        ...(result.data.familyCode === undefined
          ? {}
          : { familyCode: result.data.familyCode }),
        ...(result.data.typeCode === undefined
          ? {}
          : { typeCode: result.data.typeCode }),
        limit: String(result.data.limit),
        offset: String(result.data.offset),
      })
      return parseResourcePage(
        await readRestJson(fetch, '/v1/resources?' + params, signal),
      )
    },
    async getResourceDetail(input) {
      return restResource(
        await readRestJson(fetch, restPath(input), input.signal),
      )
    },
    async describeResource(input) {
      const result = z
        .object({ description: z.string() })
        .safeParse(
          await readRestJson(
            fetch,
            restPath(input) + '/describe',
            input.signal,
          ),
        )
      if (!result.success) return bad()
      return result.data.description
    },
    async listHierarchyClasses(input) {
      const { signal, ...window } = input
      const parsed = restHierarchyWindowInputSchema.safeParse(window)
      if (!parsed.success) return bad()
      const page = await readRestCatalogPage(fetch, 'CLASE', {
        ...parsed.data,
        signal,
      })
      return {
        items: page.records.map((record) => restHierarchyBase(record, 'CLASE')),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listHierarchyFamilies(input) {
      const { signal, ...window } = input
      const parsed = restFamilyWindowInputSchema.safeParse(window)
      if (!parsed.success) return bad()
      const page = await readRestCatalogPage(
        fetch,
        'FAMILIA',
        { ...parsed.data, signal },
        ['classCode', parsed.data.classCode],
      )
      return {
        items: page.records.map((record) =>
          restContextFamilyItem(record, parsed.data.classCode),
        ),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listHierarchyTypes(input) {
      const { signal, ...window } = input
      const parsed = restTypeWindowInputSchema.safeParse(window)
      if (!parsed.success) return bad()
      const page = await readRestCatalogPage(
        fetch,
        'TIPO',
        { ...parsed.data, signal },
        ['familyCode', parsed.data.familyCode],
      )
      return {
        items: page.records.map((record) =>
          restContextTypeItem(record, parsed.data),
        ),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listUnits(input) {
      const { signal, ...window } = input
      const parsed = restHierarchyWindowInputSchema.safeParse(window)
      if (!parsed.success) return bad()
      const page = await readRestCatalogPage(fetch, 'UNIDAD', {
        ...parsed.data,
        signal,
      })
      return {
        items: page.records.map((record) => restUnitItem(record)),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async getTypeEffectiveAttributes(input) {
      if (!validEffectiveAttributesRequest(input)) return bad()
      const query = new URLSearchParams({
        classCode: input.classCode,
        familyCode: input.familyCode,
      })
      const body = await readRestJson(
        fetch,
        '/v1/types/' +
          encodeURIComponent(input.typeCode) +
          '/attributes/effective?' +
          query,
        input.signal,
      )
      return parseEffectiveAttributesResponse(body, input)
    },
    async createResource(input) {
      return withRestActor(async (actor) => {
        const response = await fetch('/v1/resources', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            actor,
            scope: input.scope,
            naturalUnit: input.naturalUnit,
            attributes: input.attributes,
          }),
        })
        const body: unknown = await response.json()
        if (response.status !== 201) {
          const error = ErrorEnvelopeSchema.safeParse(body)
          throw new Error(
            error.success ? error.data.error : 'HTTP ' + response.status,
          )
        }
        return restResource(body)
      }, actorOptions)
    },
  }
}

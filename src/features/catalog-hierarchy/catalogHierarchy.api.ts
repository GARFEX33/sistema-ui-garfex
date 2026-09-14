import { ConvexHttpClient } from 'convex/browser'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import {
  CatalogPageSchema,
  ErrorEnvelopeSchema,
  type CatalogRecord as RestCatalogRecord,
} from '../../shared/catalog/catalogRest.contract'
import { makeFunctionReference } from 'convex/server'
import type { FunctionReference } from 'convex/server'
import type {
  CatalogClassCreateInput,
  CatalogClassItem,
  CatalogClassRestCreateInput,
  CatalogClassRestItem,
  CatalogClassWindowInput,
  CatalogClassWindowPage,
  CatalogCreated,
  CatalogFamilyCreateInput,
  CatalogFamilyItem,
  CatalogFamilyRestItem,
  CatalogFamilyWindowInput,
  CatalogFamilyWindowPage,
  CatalogId,
  CatalogListPage,
  CatalogMode,
  CatalogTypeCreateInput,
  CatalogTypeItem,
  CatalogTypeRestItem,
  CatalogTypeWindowInput,
  CatalogTypeWindowPage,
  OpaqueCursor,
} from './catalogHierarchy.types'

export type CatalogListOperation =
  | 'catalogoAdmin/jerarquia:listarClases'
  | 'catalogoAdmin/jerarquia:listarFamilias'
  | 'catalogoAdmin/jerarquia:listarTipos'

export type CatalogCreateOperation =
  | 'catalogoAdmin/jerarquia:crearClase'
  | 'catalogoAdmin/jerarquia:crearFamilia'
  | 'catalogoAdmin/jerarquia:crearTipo'

export type CatalogOperation = CatalogListOperation | CatalogCreateOperation

export interface CatalogTransport {
  invoke: (
    operation: CatalogOperation,
    args: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>
}

export interface CatalogListInput {
  cursor?: OpaqueCursor
  mode?: CatalogMode
  pageSize?: unknown
  parentId?: CatalogId
}

export interface CatalogHierarchyConvexApiOptions {
  url?: string
}

export interface CatalogHierarchyApi {
  listClasses: (
    input?: CatalogListInput,
  ) => Promise<CatalogListPage<CatalogClassItem>>
  listFamilies: (
    input?: CatalogListInput,
  ) => Promise<CatalogListPage<CatalogFamilyItem>>
  listTypes: (
    input?: CatalogListInput,
  ) => Promise<CatalogListPage<CatalogTypeItem>>
  createClass: (
    input: CatalogClassCreateInput,
  ) => Promise<CatalogCreated<CatalogClassItem>>
  createFamily: (
    input: CatalogFamilyCreateInput,
  ) => Promise<CatalogCreated<CatalogFamilyItem>>
  createType: (
    input: CatalogTypeCreateInput,
  ) => Promise<CatalogCreated<CatalogTypeItem>>
}

type CatalogRecord = Record<string, unknown>

const record = (value: unknown): value is CatalogRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const has = (value: CatalogRecord, key: string) => key in value

const bad = (): never => {
  throw new Error('Invalid catalog hierarchy response')
}

const validParent = (parentId: CatalogId | undefined): parentId is CatalogId =>
  parentId !== undefined &&
  parentId !== null &&
  !(typeof parentId === 'string' && parentId.length === 0)

const base = (value: unknown) => {
  if (
    !record(value) ||
    typeof value.activo !== 'boolean' ||
    typeof value.clave !== 'string' ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string') ||
    value.id === undefined ||
    value.id === null ||
    typeof value.nombre !== 'string' ||
    value.revision === undefined ||
    value.revision === null ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string')
  ) {
    return bad()
  }

  const description = value.descripcion
  return {
    activo: value.activo,
    clave: value.clave,
    ...(description === undefined
      ? {}
      : { descripcion: description as string }),
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    id: value.id,
    nombre: value.nombre,
    revision: value.revision,
  }
}

const page = (value: unknown) => {
  if (
    !record(value) ||
    !has(value, 'continuationCursor') ||
    (typeof value.continuationCursor !== 'string' &&
      value.continuationCursor !== null) ||
    typeof value.isExhausted !== 'boolean' ||
    !Array.isArray(value.items)
  ) {
    return bad()
  }

  return {
    continuationCursor: value.continuationCursor,
    isExhausted: value.isExhausted,
    items: value.items as unknown[],
  }
}

export function parseClassesPage(
  value: unknown,
): CatalogListPage<CatalogClassItem> {
  const result = page(value)
  return { ...result, items: result.items.map(base) }
}

export function parseFamiliesPage(
  value: unknown,
  parentId?: CatalogId,
): CatalogListPage<CatalogFamilyItem> {
  const result = page(value)
  return {
    ...result,
    items: result.items.map((item) => {
      const parsed = base(item)
      if (
        !record(item) ||
        item.claseRecursoId === undefined ||
        item.claseRecursoId === null ||
        (parentId !== undefined && !Object.is(item.claseRecursoId, parentId))
      ) {
        return bad()
      }
      return { ...parsed, claseRecursoId: item.claseRecursoId }
    }),
  }
}

const structuredViolation = (
  value: unknown,
): value is Readonly<Record<string, unknown>> => record(value)

export function parseTypesPage(
  value: unknown,
  parentId?: CatalogId,
): CatalogListPage<CatalogTypeItem> {
  const result = page(value)
  return {
    ...result,
    items: result.items.map((item) => {
      const parsed = base(item)
      if (
        !record(item) ||
        typeof item.aggregateStatus !== 'string' ||
        item.familiaRecursoId === undefined ||
        item.familiaRecursoId === null ||
        !Array.isArray(item.violations) ||
        !item.violations.every(structuredViolation) ||
        (parentId !== undefined && !Object.is(item.familiaRecursoId, parentId))
      ) {
        return bad()
      }
      return {
        ...parsed,
        aggregateStatus: item.aggregateStatus,
        familiaRecursoId: item.familiaRecursoId,
        violations: [...item.violations],
      }
    }),
  }
}

const args = (
  input: CatalogListInput = {},
  parentKey?: 'claseRecursoId' | 'familiaRecursoId',
) => {
  const result: Record<string, unknown> = {}
  if (input.cursor !== undefined) result.cursor = input.cursor
  if (input.parentId !== undefined && parentKey === 'claseRecursoId')
    result.claseRecursoId = input.parentId
  if (input.parentId !== undefined && parentKey === 'familiaRecursoId')
    result.familiaRecursoId = input.parentId
  if (input.mode !== undefined) result.modo = input.mode
  if (input.pageSize !== undefined) result.pageSize = input.pageSize
  return result
}

type CatalogQueryReference = FunctionReference<
  'query',
  'public',
  Record<string, unknown>,
  unknown
>
type CatalogCreateReference = FunctionReference<
  'mutation',
  'public',
  Record<string, unknown>,
  unknown
>

const queryReference = (name: CatalogListOperation): CatalogQueryReference =>
  makeFunctionReference<'query', Record<string, unknown>, unknown>(name)

const listClassesReference = queryReference(
  'catalogoAdmin/jerarquia:listarClases',
)
const listFamiliesReference = queryReference(
  'catalogoAdmin/jerarquia:listarFamilias',
)
const listTypesReference = queryReference('catalogoAdmin/jerarquia:listarTipos')
const createClassReference: CatalogCreateReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>('catalogoAdmin/jerarquia:crearClase')
const createFamilyReference: CatalogCreateReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>('catalogoAdmin/jerarquia:crearFamilia')
const createTypeReference: CatalogCreateReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>('catalogoAdmin/jerarquia:crearTipo')

const configuredUrl = (options: CatalogHierarchyConvexApiOptions) =>
  'url' in options ? options.url : import.meta.env.VITE_CONVEX_URL

const validHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.length > 0
    )
  } catch {
    return false
  }
}

const parseCreatedClass = (
  value: unknown,
): CatalogCreated<CatalogClassItem> => {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: base(value.item) }
}

const parseFamilyItem = (
  value: unknown,
  parentId: CatalogId,
): CatalogFamilyItem => {
  const parsed = base(value)
  if (
    !record(value) ||
    value.claseRecursoId === undefined ||
    value.claseRecursoId === null ||
    !Object.is(value.claseRecursoId, parentId)
  ) {
    return bad()
  }
  return { ...parsed, claseRecursoId: value.claseRecursoId }
}

const parseTypeItem = (
  value: unknown,
  parentId: CatalogId,
): CatalogTypeItem => {
  const parsed = base(value)
  if (
    !record(value) ||
    typeof value.aggregateStatus !== 'string' ||
    value.familiaRecursoId === undefined ||
    value.familiaRecursoId === null ||
    !Array.isArray(value.violations) ||
    !value.violations.every(structuredViolation) ||
    !Object.is(value.familiaRecursoId, parentId)
  ) {
    return bad()
  }
  return {
    ...parsed,
    aggregateStatus: value.aggregateStatus,
    familiaRecursoId: value.familiaRecursoId,
    violations: [...value.violations],
  }
}

const parseCreatedFamily = (
  value: unknown,
  parentId: CatalogId,
): CatalogCreated<CatalogFamilyItem> => {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: parseFamilyItem(value.item, parentId) }
}

const parseCreatedType = (
  value: unknown,
  parentId: CatalogId,
): CatalogCreated<CatalogTypeItem> => {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: parseTypeItem(value.item, parentId) }
}

export interface CatalogHierarchyRestApi {
  createClass: (
    input: CatalogClassRestCreateInput,
  ) => Promise<CatalogClassRestItem>
  listClasses: (
    input: CatalogClassWindowInput,
  ) => Promise<CatalogClassWindowPage>
  listFamilies: (
    input: CatalogFamilyWindowInput,
  ) => Promise<CatalogFamilyWindowPage>
  listTypes: (input: CatalogTypeWindowInput) => Promise<CatalogTypeWindowPage>
}

const restClassItem = (record: RestCatalogRecord): CatalogClassRestItem => {
  const code = record.values.code
  const name = record.values.name
  if (record.kind !== 'CLASE' || code?.kind !== 'CODE' || name?.kind !== 'TEXT')
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

const restFamilyItem = (
  record: RestCatalogRecord,
  classCode: string,
): CatalogFamilyRestItem => {
  const code = record.values.code
  const name = record.values.name
  const classReference = record.values.class
  if (
    record.kind !== 'FAMILIA' ||
    code?.kind !== 'CODE' ||
    name?.kind !== 'TEXT' ||
    classReference?.kind !== 'REFERENCE' ||
    classReference.reference.kind !== 'CLASE' ||
    classReference.reference.code !== classCode
  )
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    classCode,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

const restTypeItem = (
  record: RestCatalogRecord,
  input: Pick<CatalogTypeWindowInput, 'classCode' | 'familyCode'>,
): CatalogTypeRestItem => {
  const code = record.values.code
  const name = record.values.name
  const classReference = record.values.class
  const familyReference = record.values.family
  if (
    record.kind !== 'TIPO' ||
    code?.kind !== 'CODE' ||
    name?.kind !== 'TEXT' ||
    familyReference?.kind !== 'REFERENCE' ||
    familyReference.reference.kind !== 'FAMILIA' ||
    familyReference.reference.code !== input.familyCode ||
    (input.classCode !== undefined &&
      (classReference?.kind !== 'REFERENCE' ||
        classReference.reference.kind !== 'CLASE' ||
        classReference.reference.code !== input.classCode))
  )
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    ...(input.classCode === undefined ? {} : { classCode: input.classCode }),
    familyCode: input.familyCode,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

const catalogParams = (input: CatalogClassWindowInput) =>
  new URLSearchParams({
    scope: input.scope,
    ...(input.text === undefined ? {} : { text: input.text }),
    limit: String(input.limit),
    offset: String(input.offset),
  })

async function readCatalogPage(
  fetch: typeof globalThis.fetch,
  kind: 'CLASE' | 'FAMILIA' | 'TIPO',
  input: CatalogClassWindowInput,
  filter?: readonly [string, string],
) {
  const params = catalogParams(input)
  if (filter) params.set(...filter)
  const response = await fetch('/v1/catalog/' + kind + '?' + params, {
    signal: input.signal,
  })
  const body: unknown = await response.json()
  if (!response.ok) {
    const error = ErrorEnvelopeSchema.safeParse(body)
    throw new Error(
      error.success ? error.data.error : 'HTTP ' + response.status,
    )
  }
  return CatalogPageSchema.parse(body)
}

export function createCatalogHierarchyRestApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): CatalogHierarchyRestApi {
  return {
    async createClass(input) {
      return withRestActor(async (actor) => {
        const response = await fetch('/v1/catalog/CLASE', {
          body: JSON.stringify({
            actor,
            values: {
              code: { kind: 'CODE', value: input.code },
              name: { kind: 'TEXT', value: input.name },
              plural: { kind: 'TEXT', value: input.plural },
              slug: { kind: 'TEXT', value: input.slug },
            },
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        })
        const body: unknown = await response.json()
        if (response.status !== 201) {
          const error = ErrorEnvelopeSchema.safeParse(body)
          throw new Error(
            error.success ? error.data.error : 'HTTP ' + response.status,
          )
        }
        return restClassItem(
          CatalogPageSchema.shape.records.element.parse(body),
        )
      }, actorOptions)
    },
    async listClasses(input) {
      const page = await readCatalogPage(fetch, 'CLASE', input)
      return {
        items: page.records.map(restClassItem),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listFamilies(input) {
      const page = await readCatalogPage(fetch, 'FAMILIA', input, [
        'classCode',
        input.classCode,
      ])
      return {
        items: page.records.map((record) =>
          restFamilyItem(record, input.classCode),
        ),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listTypes(input) {
      const page = await readCatalogPage(fetch, 'TIPO', input, [
        'familyCode',
        input.familyCode,
      ])
      return {
        items: page.records.map((record) => restTypeItem(record, input)),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
  }
}

export function createCatalogHierarchyConvexApi(
  options: CatalogHierarchyConvexApiOptions = {},
): CatalogHierarchyApi {
  let client: ConvexHttpClient | undefined
  const transport: CatalogTransport = {
    invoke: async (operation, requestArgs) => {
      const url = configuredUrl(options)
      if (!validHttpUrl(url))
        throw new Error('Catalog hierarchy transport unavailable')
      client ??= new ConvexHttpClient(url)
      switch (operation) {
        case 'catalogoAdmin/jerarquia:listarClases':
          return client.query(listClassesReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:listarFamilias':
          return client.query(listFamiliesReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:listarTipos':
          return client.query(listTypesReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:crearClase':
          return client.mutation(createClassReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:crearFamilia':
          return client.mutation(createFamilyReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:crearTipo':
          return client.mutation(createTypeReference, { ...requestArgs })
      }
    },
  }
  return createCatalogHierarchyApi(transport)
}

export function createCatalogHierarchyApi(
  transport: CatalogTransport,
): CatalogHierarchyApi {
  return {
    async listClasses(input = {}) {
      return parseClassesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarClases',
          args(input),
        ),
      )
    },
    async listFamilies(input = {}) {
      if (!validParent(input.parentId)) return bad()
      return parseFamiliesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarFamilias',
          args(input, 'claseRecursoId'),
        ),
        input.parentId,
      )
    },
    async listTypes(input = {}) {
      if (!validParent(input.parentId)) return bad()
      return parseTypesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarTipos',
          args(input, 'familiaRecursoId'),
        ),
        input.parentId,
      )
    },
    async createClass(input) {
      const requestArgs = Object.freeze({
        clave: input.clave,
        nombre: input.nombre,
        ...(input.descripcion !== undefined && input.descripcion !== ''
          ? { descripcion: input.descripcion }
          : {}),
      })
      return parseCreatedClass(
        await transport.invoke(
          'catalogoAdmin/jerarquia:crearClase',
          requestArgs,
        ),
      )
    },
    async createFamily(input: CatalogFamilyCreateInput) {
      if (!validParent(input.claseRecursoId)) return bad()
      const parentId = input.claseRecursoId
      const requestArgs = Object.freeze({
        claseRecursoId: parentId,
        clave: input.clave,
        nombre: input.nombre,
        ...(input.descripcion !== undefined && input.descripcion !== ''
          ? { descripcion: input.descripcion }
          : {}),
      })
      return parseCreatedFamily(
        await transport.invoke(
          'catalogoAdmin/jerarquia:crearFamilia',
          requestArgs,
        ),
        parentId,
      )
    },
    async createType(input: CatalogTypeCreateInput) {
      if (!validParent(input.familiaRecursoId)) return bad()
      const parentId = input.familiaRecursoId
      const requestArgs = Object.freeze({
        familiaRecursoId: parentId,
        clave: input.clave,
        nombre: input.nombre,
        ...(input.descripcion !== undefined && input.descripcion !== ''
          ? { descripcion: input.descripcion }
          : {}),
      })
      return parseCreatedType(
        await transport.invoke(
          'catalogoAdmin/jerarquia:crearTipo',
          requestArgs,
        ),
        parentId,
      )
    },
  }
}

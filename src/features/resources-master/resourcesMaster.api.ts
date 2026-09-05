import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import type { FunctionReference } from 'convex/server'
import { z } from 'zod'
import type {
  ResourceAttributeAssignment,
  ResourceAttributeAssignmentListInput,
  ResourceAttributeDataType,
  ResourceAttributeDefinition,
  ResourceAttributeDefinitionInput,
  ResourceAttributeOption,
  ResourceAttributeOptionListInput,
  ResourceChangeResult,
  ResourceClassificationStatus,
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextFamilyListInput,
  ResourceContextListInput,
  ResourceContextListPage,
  ResourceContextTypeItem,
  ResourceContextTypeListInput,
  ResourceCreateInput,
  ResourceCreated,
  ResourceDetail,
  ResourceDetailInput,
  ResourceHierarchyRef,
  ResourceId,
  ResourceLifecycleInput,
  ResourceListFilters,
  ResourceListInput,
  ResourceListPage,
  ResourceSearchInput,
  ResourceSummary,
  ResourceUnitDetail,
  ResourceUnitDetailInput,
  ResourceUnitPolicy,
  ResourceUnitPolicyListInput,
  ResourceUnitRef,
  ResourceUpdateInput,
} from './resourcesMaster.types'

export type ResourceListOperation =
  | 'catalogoAdmin/recursos:listarRecursosResumen'
  | 'catalogoAdmin/recursos:buscarRecursosResumen'

export type ResourceDetailOperation =
  'catalogoAdmin/recursos:obtenerDetalleRecurso'

export type ResourceCreateOperation = 'catalogoAdmin/recursos:crearRecurso'

export type ResourceUpdateOperation = 'catalogoAdmin/recursos:actualizarRecurso'

export type ResourceLifecycleOperation =
  | 'catalogoAdmin/recursos:activarRecurso'
  | 'catalogoAdmin/recursos:desactivarRecurso'

export type ResourceContextListOperation =
  | 'catalogoAdmin/jerarquia:listarClases'
  | 'catalogoAdmin/jerarquia:listarFamilias'
  | 'catalogoAdmin/jerarquia:listarTipos'

export type ResourceUnitPolicyListOperation =
  'catalogoAdmin/unidades:listarPoliticasUnidad'

export type ResourceUnitDetailOperation = 'catalogoAdmin/unidades:obtenerUnidad'

export type ResourceAttributeAssignmentListOperation =
  'catalogoAdmin/atributos:listarAsignacionesAtributo'

export type ResourceAttributeDefinitionOperation =
  'catalogoAdmin/atributos:obtenerDefinicionAtributo'

export type ResourceAttributeOptionListOperation =
  'catalogoAdmin/atributos:listarOpcionesAtributo'

export type ResourceOperation =
  | ResourceListOperation
  | ResourceDetailOperation
  | ResourceCreateOperation
  | ResourceUpdateOperation
  | ResourceLifecycleOperation
  | ResourceContextListOperation
  | ResourceUnitPolicyListOperation
  | ResourceUnitDetailOperation
  | ResourceAttributeAssignmentListOperation
  | ResourceAttributeDefinitionOperation
  | ResourceAttributeOptionListOperation

export interface ResourceTransport {
  invoke: (
    operation: ResourceOperation,
    args: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>
}

export interface ResourcesMasterConvexApiOptions {
  url?: string
}

export interface ResourcesMasterApi {
  listResources: (
    input: ResourceListInput,
  ) => Promise<ResourceListPage<ResourceSummary>>
  searchResources: (
    input: ResourceSearchInput,
  ) => Promise<ResourceListPage<ResourceSummary>>
  getResourceDetail: (
    input: ResourceDetailInput,
  ) => Promise<ResourceDetail | null>
  createResource: (input: ResourceCreateInput) => Promise<ResourceCreated>
  updateResource: (input: ResourceUpdateInput) => Promise<ResourceChangeResult>
  activateResource: (
    input: ResourceLifecycleInput,
  ) => Promise<ResourceChangeResult>
  deactivateResource: (
    input: ResourceLifecycleInput,
  ) => Promise<ResourceChangeResult>
  listContextClasses: (
    input?: ResourceContextListInput,
  ) => Promise<ResourceContextListPage<ResourceContextClassItem>>
  listContextFamilies: (
    input: ResourceContextFamilyListInput,
  ) => Promise<ResourceContextListPage<ResourceContextFamilyItem>>
  listContextTypes: (
    input: ResourceContextTypeListInput,
  ) => Promise<ResourceContextListPage<ResourceContextTypeItem>>
  listUnitPolicies: (
    input: ResourceUnitPolicyListInput,
  ) => Promise<ResourceContextListPage<ResourceUnitPolicy>>
  getUnit: (
    input: ResourceUnitDetailInput,
  ) => Promise<ResourceUnitDetail | null>
  listAttributeAssignments: (
    input: ResourceAttributeAssignmentListInput,
  ) => Promise<ResourceContextListPage<ResourceAttributeAssignment>>
  getAttributeDefinition: (
    input: ResourceAttributeDefinitionInput,
  ) => Promise<ResourceAttributeDefinition | null>
  listAttributeOptions: (
    input: ResourceAttributeOptionListInput,
  ) => Promise<ResourceContextListPage<ResourceAttributeOption>>
}

type ResourceRecord = Record<string, unknown>

const record = (value: unknown): value is ResourceRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const has = (value: ResourceRecord, key: string) => key in value

const bad = (): never => {
  throw new Error('Invalid resources master response')
}

const definedId = (value: ResourceId): value is ResourceId =>
  value !== undefined && value !== null

const classificationStatus = (value: unknown): ResourceClassificationStatus => {
  if (
    !record(value) ||
    (value.state !== 'EFFECTIVE' &&
      value.state !== 'INERT' &&
      value.state !== 'BROKEN_REFERENCE') ||
    !Array.isArray(value.reasons) ||
    !value.reasons.every((reason) => typeof reason === 'string')
  ) {
    return bad()
  }
  return { state: value.state, reasons: [...value.reasons] }
}

const resourceSummary = (value: unknown): ResourceSummary => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    typeof value.identificadorTecnico !== 'string' ||
    typeof value.nombre !== 'string' ||
    !definedId(value.tipoRecursoId) ||
    !definedId(value.unidadId) ||
    typeof value.activo !== 'boolean' ||
    typeof value.revision !== 'number' ||
    (has(value, 'organizacionId') &&
      value.organizacionId !== undefined &&
      !definedId(value.organizacionId))
  ) {
    return bad()
  }
  return {
    id: value.id,
    identificadorTecnico: value.identificadorTecnico,
    nombre: value.nombre,
    tipoRecursoId: value.tipoRecursoId,
    unidadId: value.unidadId,
    ...(value.organizacionId === undefined
      ? {}
      : { organizacionId: value.organizacionId }),
    activo: value.activo,
    revision: value.revision,
    classificationStatus: classificationStatus(value.classificationStatus),
  }
}

const hierarchyRef = (value: unknown): ResourceHierarchyRef | null => {
  if (value === null) return null
  if (
    !record(value) ||
    !definedId(value.id) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    typeof value.activo !== 'boolean' ||
    value.revision === undefined ||
    value.revision === null
  ) {
    return bad()
  }
  return {
    id: value.id,
    clave: value.clave,
    nombre: value.nombre,
    activo: value.activo,
    revision: value.revision,
  }
}

const unitRef = (value: unknown): ResourceUnitRef | null => {
  if (value === null) return null
  const base = hierarchyRef(value)
  if (
    base === null ||
    !record(value) ||
    (value.simbolo !== null && typeof value.simbolo !== 'string')
  ) {
    return bad()
  }
  return { ...base, simbolo: value.simbolo }
}

const resourceDetail = (value: unknown): ResourceDetail => {
  const summary = resourceSummary(value)
  if (
    !record(value) ||
    (value.descripcion !== null && typeof value.descripcion !== 'string') ||
    (value.identidadVersion !== null &&
      typeof value.identidadVersion !== 'number') ||
    !record(value.catalogDiagnostics) ||
    !Array.isArray(value.valores) ||
    !value.valores.every(record)
  ) {
    return bad()
  }
  return {
    ...summary,
    descripcion: value.descripcion,
    identidadVersion: value.identidadVersion,
    clase: hierarchyRef(value.clase),
    familia: hierarchyRef(value.familia),
    tipo: hierarchyRef(value.tipo),
    organizacion: hierarchyRef(value.organizacion),
    unidad: unitRef(value.unidad),
    catalogDiagnostics: { ...value.catalogDiagnostics },
    valores: [...value.valores],
  }
}

const contextItemBase = (value: unknown) => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    typeof value.activo !== 'boolean' ||
    value.revision === undefined ||
    value.revision === null ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string')
  ) {
    return bad()
  }
  return {
    id: value.id,
    clave: value.clave,
    nombre: value.nombre,
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
  }
}

const contextClassItem = (value: unknown): ResourceContextClassItem =>
  contextItemBase(value)

const contextFamilyItem = (value: unknown): ResourceContextFamilyItem => {
  const parsed = contextItemBase(value)
  if (!record(value) || !definedId(value.claseRecursoId)) return bad()
  return { ...parsed, claseRecursoId: value.claseRecursoId }
}

const contextTypeItem = (value: unknown): ResourceContextTypeItem => {
  const parsed = contextItemBase(value)
  if (
    !record(value) ||
    !definedId(value.familiaRecursoId) ||
    typeof value.aggregateStatus !== 'string' ||
    !Array.isArray(value.violations) ||
    !value.violations.every(record)
  ) {
    return bad()
  }
  return {
    ...parsed,
    familiaRecursoId: value.familiaRecursoId,
    aggregateStatus: value.aggregateStatus,
    violations: value.violations.map((violation) => ({ ...violation })),
  }
}

const unitPolicyItem = (value: unknown): ResourceUnitPolicy => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    !definedId(value.familiaRecursoId) ||
    (has(value, 'tipoRecursoId') &&
      value.tipoRecursoId !== undefined &&
      !definedId(value.tipoRecursoId)) ||
    !definedId(value.unidadId) ||
    typeof value.principal !== 'boolean' ||
    typeof value.activo !== 'boolean' ||
    typeof value.revision !== 'number' ||
    typeof value.effective !== 'boolean' ||
    typeof value.selected !== 'boolean' ||
    typeof value.shadowed !== 'boolean' ||
    (value.selection !== 'SELECTED' &&
      value.selection !== 'SHADOWED' &&
      value.selection !== 'SUPPRESSED' &&
      value.selection !== 'NONE')
  ) {
    return bad()
  }
  return {
    id: value.id,
    familiaRecursoId: value.familiaRecursoId,
    ...(value.tipoRecursoId === undefined
      ? {}
      : { tipoRecursoId: value.tipoRecursoId }),
    unidadId: value.unidadId,
    principal: value.principal,
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
    selected: value.selected,
    shadowed: value.shadowed,
    selection: value.selection,
  }
}

const contextPage = (value: unknown) => {
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

export function parseContextClassesPage(
  value: unknown,
): ResourceContextListPage<ResourceContextClassItem> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(contextClassItem) }
}

export function parseContextFamiliesPage(
  value: unknown,
): ResourceContextListPage<ResourceContextFamilyItem> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(contextFamilyItem) }
}

export function parseContextTypesPage(
  value: unknown,
): ResourceContextListPage<ResourceContextTypeItem> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(contextTypeItem) }
}

export function parseUnitPoliciesPage(
  value: unknown,
): ResourceContextListPage<ResourceUnitPolicy> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(unitPolicyItem) }
}

const unitDetail = (value: unknown): ResourceUnitDetail => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string') ||
    (has(value, 'simbolo') &&
      value.simbolo !== undefined &&
      typeof value.simbolo !== 'string') ||
    typeof value.activo !== 'boolean' ||
    typeof value.revision !== 'number' ||
    typeof value.effective !== 'boolean'
  ) {
    return bad()
  }
  return {
    id: value.id,
    clave: value.clave,
    nombre: value.nombre,
    ...(value.descripcion === undefined
      ? {}
      : { descripcion: value.descripcion as string }),
    ...(value.simbolo === undefined
      ? {}
      : { simbolo: value.simbolo as string }),
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
  }
}

export function parseUnitDetail(value: unknown): ResourceUnitDetail | null {
  if (value === null) return null
  return unitDetail(value)
}

const attributeApplicabilities = [
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
  'FORBIDDEN',
  'NOT_APPLICABLE',
]

const attributeSelections = ['SELECTED', 'SHADOWED', 'SUPPRESSED', 'NONE']

const attributeDataTypes = ['TEXTO', 'NUMERO', 'BOOLEANO', 'OPCION']

const attributeAssignmentItem = (
  value: unknown,
): ResourceAttributeAssignment => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    !definedId(value.familiaRecursoId) ||
    !definedId(value.definicionAtributoId) ||
    (has(value, 'tipoRecursoId') &&
      value.tipoRecursoId !== undefined &&
      !definedId(value.tipoRecursoId)) ||
    !attributeApplicabilities.includes(value.aplicabilidad as string) ||
    typeof value.participaIdentidad !== 'boolean' ||
    typeof value.orden !== 'number' ||
    typeof value.activo !== 'boolean' ||
    value.revision === undefined ||
    value.revision === null ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string') ||
    !attributeSelections.includes(value.selection as string)
  ) {
    return bad()
  }
  return {
    id: value.id,
    familiaRecursoId: value.familiaRecursoId,
    definicionAtributoId: value.definicionAtributoId,
    ...(value.tipoRecursoId === undefined
      ? {}
      : { tipoRecursoId: value.tipoRecursoId }),
    aplicabilidad:
      value.aplicabilidad as ResourceAttributeAssignment['aplicabilidad'],
    participaIdentidad: value.participaIdentidad,
    orden: value.orden,
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    selection: value.selection as ResourceAttributeAssignment['selection'],
  }
}

export function parseAttributeAssignmentsPage(
  value: unknown,
): ResourceContextListPage<ResourceAttributeAssignment> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(attributeAssignmentItem) }
}

const attributeDefinitionItem = (
  value: unknown,
): ResourceAttributeDefinition => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string') ||
    !attributeDataTypes.includes(value.tipoDato as string) ||
    (has(value, 'unidadId') &&
      value.unidadId !== undefined &&
      !definedId(value.unidadId)) ||
    typeof value.activo !== 'boolean' ||
    value.revision === undefined ||
    value.revision === null ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string')
  ) {
    return bad()
  }
  return {
    id: value.id,
    clave: value.clave,
    nombre: value.nombre,
    ...(value.descripcion === undefined
      ? {}
      : { descripcion: value.descripcion as string }),
    tipoDato: value.tipoDato as ResourceAttributeDataType,
    ...(value.unidadId === undefined ? {} : { unidadId: value.unidadId }),
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
  }
}

export function parseAttributeDefinition(
  value: unknown,
): ResourceAttributeDefinition | null {
  if (value === null) return null
  return attributeDefinitionItem(value)
}

const attributeOptionItem = (value: unknown): ResourceAttributeOption => {
  if (
    !record(value) ||
    !definedId(value.id) ||
    !definedId(value.definicionAtributoId) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string') ||
    typeof value.activo !== 'boolean' ||
    value.revision === undefined ||
    value.revision === null ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string')
  ) {
    return bad()
  }
  return {
    id: value.id,
    definicionAtributoId: value.definicionAtributoId,
    clave: value.clave,
    nombre: value.nombre,
    ...(value.descripcion === undefined
      ? {}
      : { descripcion: value.descripcion as string }),
    activo: value.activo,
    revision: value.revision,
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
  }
}

export function parseAttributeOptionsPage(
  value: unknown,
): ResourceContextListPage<ResourceAttributeOption> {
  const result = contextPage(value)
  return { ...result, items: result.items.map(attributeOptionItem) }
}

const resourceListIdSchema = z.custom<ResourceId>(
  (value) => value !== undefined && value !== null,
)

const resourceListRevisionSchema = z.custom<number>(
  (value) => typeof value === 'number',
)

const resourceListClassificationStatusSchema = z.object({
  state: z.enum(['EFFECTIVE', 'INERT', 'BROKEN_REFERENCE']),
  reasons: z.array(z.string()),
})

const resourceListSummarySchema = z.object({
  id: resourceListIdSchema,
  identificadorTecnico: z.string(),
  nombre: z.string(),
  tipoRecursoId: resourceListIdSchema,
  unidadId: resourceListIdSchema,
  organizacionId: resourceListIdSchema.optional(),
  activo: z.boolean(),
  revision: resourceListRevisionSchema,
  classificationStatus: resourceListClassificationStatusSchema,
})

const resourceListPageSchema = z.object({
  page: z.array(resourceListSummarySchema),
  isDone: z.boolean(),
  continueCursor: z.string(),
})

const resourceListSummary = (
  value: z.infer<typeof resourceListSummarySchema>,
): ResourceSummary => ({
  id: value.id,
  identificadorTecnico: value.identificadorTecnico,
  nombre: value.nombre,
  tipoRecursoId: value.tipoRecursoId,
  unidadId: value.unidadId,
  ...(value.organizacionId === undefined
    ? {}
    : { organizacionId: value.organizacionId }),
  activo: value.activo,
  revision: value.revision,
  classificationStatus: {
    state: value.classificationStatus.state,
    reasons: [...value.classificationStatus.reasons],
  },
})

export function parseResourceListPage(
  value: unknown,
): ResourceListPage<ResourceSummary> {
  const result = resourceListPageSchema.safeParse(value)
  if (!result.success) return bad()
  return {
    page: result.data.page.map(resourceListSummary),
    isDone: result.data.isDone,
    continueCursor: result.data.continueCursor,
  }
}

export function parseResourceDetail(value: unknown): ResourceDetail | null {
  if (value === null) return null
  return resourceDetail(value)
}

export function parseResourceCreated(value: unknown): ResourceCreated {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: resourceSummary(value.item) }
}

export function parseResourceChangeResult(
  value: unknown,
): ResourceChangeResult {
  if (
    !record(value) ||
    typeof value.disposition !== 'string' ||
    value.disposition.length === 0 ||
    !has(value, 'item')
  ) {
    return bad()
  }
  return { disposition: value.disposition, item: resourceSummary(value.item) }
}

const paginationOpts = (input: {
  cursor?: string | null
  pageSize: number
}) => ({
  numItems: input.pageSize,
  cursor: input.cursor ?? null,
})

const listFilterArgs = (filters: ResourceListFilters) => {
  const result: Record<string, unknown> = {}
  if (filters.lifecycle !== undefined) result.lifecycle = filters.lifecycle
  if (filters.tipoRecursoId !== undefined)
    result.tipoRecursoId = filters.tipoRecursoId
  else if (filters.familiaRecursoId !== undefined)
    result.familiaRecursoId = filters.familiaRecursoId
  else if (filters.claseRecursoId !== undefined)
    result.claseRecursoId = filters.claseRecursoId
  if (filters.scope !== undefined) result.scope = filters.scope
  return result
}

const listArgs = (input: ResourceListInput) =>
  Object.freeze({
    paginationOpts: paginationOpts(input),
    ...listFilterArgs(input),
  })

const searchArgs = (input: ResourceSearchInput) =>
  Object.freeze({
    ...listArgs(input),
    searchText: input.searchText,
  })

const contextListArgs = (input: ResourceContextListInput = {}) => {
  const result: Record<string, unknown> = { modo: 'ACTIVE' }
  if (input.cursor !== undefined) result.cursor = input.cursor
  if (input.pageSize !== undefined) result.pageSize = input.pageSize
  return result
}

const contextFamilyArgs = (input: ResourceContextFamilyListInput) =>
  Object.freeze({
    claseRecursoId: input.claseRecursoId,
    ...contextListArgs(input),
  })

const contextTypeArgs = (input: ResourceContextTypeListInput) =>
  Object.freeze({
    familiaRecursoId: input.familiaRecursoId,
    ...contextListArgs(input),
  })

const unitPolicyArgs = (input: ResourceUnitPolicyListInput) =>
  Object.freeze({
    tipoRecursoId: input.tipoRecursoId,
    paraTipoRecursoId: input.tipoRecursoId,
    ...contextListArgs(input),
  })

const attributeAssignmentArgs = (input: ResourceAttributeAssignmentListInput) =>
  Object.freeze({
    tipoRecursoId: input.tipoRecursoId,
    ...contextListArgs(input),
  })

const attributeOptionArgs = (input: ResourceAttributeOptionListInput) =>
  Object.freeze({
    definicionAtributoId: input.definicionAtributoId,
    ...contextListArgs(input),
  })

type ResourceQueryReference = FunctionReference<
  'query',
  'public',
  Record<string, unknown>,
  unknown
>
type ResourceMutationReference = FunctionReference<
  'mutation',
  'public',
  Record<string, unknown>,
  unknown
>

const queryReference = (
  name:
    | ResourceListOperation
    | ResourceDetailOperation
    | ResourceContextListOperation
    | ResourceUnitPolicyListOperation
    | ResourceUnitDetailOperation
    | ResourceAttributeAssignmentListOperation
    | ResourceAttributeDefinitionOperation
    | ResourceAttributeOptionListOperation,
) => makeFunctionReference<'query', Record<string, unknown>, unknown>(name)

const mutationReference = (
  name:
    | ResourceCreateOperation
    | ResourceUpdateOperation
    | ResourceLifecycleOperation,
) => makeFunctionReference<'mutation', Record<string, unknown>, unknown>(name)

const listResourcesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/recursos:listarRecursosResumen',
)
const searchResourcesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/recursos:buscarRecursosResumen',
)
const getDetailReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/recursos:obtenerDetalleRecurso',
)
const createResourceReference: ResourceMutationReference = mutationReference(
  'catalogoAdmin/recursos:crearRecurso',
)
const updateResourceReference: ResourceMutationReference = mutationReference(
  'catalogoAdmin/recursos:actualizarRecurso',
)
const activateResourceReference: ResourceMutationReference = mutationReference(
  'catalogoAdmin/recursos:activarRecurso',
)
const deactivateResourceReference: ResourceMutationReference =
  mutationReference('catalogoAdmin/recursos:desactivarRecurso')
const listContextClassesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/jerarquia:listarClases',
)
const listContextFamiliesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/jerarquia:listarFamilias',
)
const listContextTypesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/jerarquia:listarTipos',
)
const listUnitPoliciesReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/unidades:listarPoliticasUnidad',
)
const getUnitReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/unidades:obtenerUnidad',
)
const listAttributeAssignmentsReference: ResourceQueryReference =
  queryReference('catalogoAdmin/atributos:listarAsignacionesAtributo')
const getAttributeDefinitionReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/atributos:obtenerDefinicionAtributo',
)
const listAttributeOptionsReference: ResourceQueryReference = queryReference(
  'catalogoAdmin/atributos:listarOpcionesAtributo',
)

const configuredUrl = (options: ResourcesMasterConvexApiOptions) =>
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

export function createResourcesMasterConvexApi(
  options: ResourcesMasterConvexApiOptions = {},
): ResourcesMasterApi {
  let client: ConvexHttpClient | undefined
  const transport: ResourceTransport = {
    invoke: async (operation, requestArgs) => {
      const url = configuredUrl(options)
      if (!validHttpUrl(url))
        throw new Error('Resources master transport unavailable')
      client ??= new ConvexHttpClient(url)
      switch (operation) {
        case 'catalogoAdmin/recursos:listarRecursosResumen':
          return client.query(listResourcesReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:buscarRecursosResumen':
          return client.query(searchResourcesReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:obtenerDetalleRecurso':
          return client.query(getDetailReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:crearRecurso':
          return client.mutation(createResourceReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:actualizarRecurso':
          return client.mutation(updateResourceReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:activarRecurso':
          return client.mutation(activateResourceReference, { ...requestArgs })
        case 'catalogoAdmin/recursos:desactivarRecurso':
          return client.mutation(deactivateResourceReference, {
            ...requestArgs,
          })
        case 'catalogoAdmin/jerarquia:listarClases':
          return client.query(listContextClassesReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:listarFamilias':
          return client.query(listContextFamiliesReference, { ...requestArgs })
        case 'catalogoAdmin/jerarquia:listarTipos':
          return client.query(listContextTypesReference, { ...requestArgs })
        case 'catalogoAdmin/unidades:listarPoliticasUnidad':
          return client.query(listUnitPoliciesReference, { ...requestArgs })
        case 'catalogoAdmin/unidades:obtenerUnidad':
          return client.query(getUnitReference, { ...requestArgs })
        case 'catalogoAdmin/atributos:listarAsignacionesAtributo':
          return client.query(listAttributeAssignmentsReference, {
            ...requestArgs,
          })
        case 'catalogoAdmin/atributos:obtenerDefinicionAtributo':
          return client.query(getAttributeDefinitionReference, {
            ...requestArgs,
          })
        case 'catalogoAdmin/atributos:listarOpcionesAtributo':
          return client.query(listAttributeOptionsReference, { ...requestArgs })
      }
    },
  }
  return createResourcesMasterApi(transport)
}

export function createResourcesMasterApi(
  transport: ResourceTransport,
): ResourcesMasterApi {
  return {
    async listResources(input) {
      return parseResourceListPage(
        await transport.invoke(
          'catalogoAdmin/recursos:listarRecursosResumen',
          listArgs(input),
        ),
      )
    },
    async searchResources(input) {
      if (input.searchText.trim().length === 0) return bad()
      return parseResourceListPage(
        await transport.invoke(
          'catalogoAdmin/recursos:buscarRecursosResumen',
          searchArgs(input),
        ),
      )
    },
    async getResourceDetail(input) {
      if (!definedId(input.recursoId)) return bad()
      return parseResourceDetail(
        await transport.invoke('catalogoAdmin/recursos:obtenerDetalleRecurso', {
          recursoId: input.recursoId,
        }),
      )
    },
    async createResource(input) {
      const requestArgs = Object.freeze({
        claseRecursoId: input.claseRecursoId,
        familiaRecursoId: input.familiaRecursoId,
        tipoRecursoId: input.tipoRecursoId,
        unidadId: input.unidadId,
        nombre: input.nombre,
        ...(input.descripcion !== undefined && input.descripcion !== ''
          ? { descripcion: input.descripcion }
          : {}),
        valores: input.valores,
        ownership: input.ownership,
      })
      return parseResourceCreated(
        await transport.invoke(
          'catalogoAdmin/recursos:crearRecurso',
          requestArgs,
        ),
      )
    },
    async updateResource(input) {
      const requestArgs: Record<string, unknown> = {
        recursoId: input.recursoId,
        expectedRevision: input.expectedRevision,
      }
      if (input.unidadId !== undefined) requestArgs.unidadId = input.unidadId
      if (input.nombre !== undefined) requestArgs.nombre = input.nombre
      if (input.descripcion !== undefined)
        requestArgs.descripcion = input.descripcion
      if (input.valores !== undefined) requestArgs.valores = input.valores
      return parseResourceChangeResult(
        await transport.invoke(
          'catalogoAdmin/recursos:actualizarRecurso',
          Object.freeze(requestArgs),
        ),
      )
    },
    async activateResource(input) {
      return parseResourceChangeResult(
        await transport.invoke('catalogoAdmin/recursos:activarRecurso', {
          recursoId: input.recursoId,
          expectedRevision: input.expectedRevision,
        }),
      )
    },
    async deactivateResource(input) {
      return parseResourceChangeResult(
        await transport.invoke('catalogoAdmin/recursos:desactivarRecurso', {
          recursoId: input.recursoId,
          expectedRevision: input.expectedRevision,
        }),
      )
    },
    async listContextClasses(input = {}) {
      return parseContextClassesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarClases',
          contextListArgs(input),
        ),
      )
    },
    async listContextFamilies(input) {
      if (!definedId(input.claseRecursoId)) return bad()
      return parseContextFamiliesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarFamilias',
          contextFamilyArgs(input),
        ),
      )
    },
    async listContextTypes(input) {
      if (!definedId(input.familiaRecursoId)) return bad()
      return parseContextTypesPage(
        await transport.invoke(
          'catalogoAdmin/jerarquia:listarTipos',
          contextTypeArgs(input),
        ),
      )
    },
    async listUnitPolicies(input) {
      if (!definedId(input.tipoRecursoId)) return bad()
      return parseUnitPoliciesPage(
        await transport.invoke(
          'catalogoAdmin/unidades:listarPoliticasUnidad',
          unitPolicyArgs(input),
        ),
      )
    },
    async getUnit(input) {
      if (!definedId(input.unidadId)) return bad()
      return parseUnitDetail(
        await transport.invoke('catalogoAdmin/unidades:obtenerUnidad', {
          unidadId: input.unidadId,
        }),
      )
    },
    async listAttributeAssignments(input) {
      if (!definedId(input.tipoRecursoId)) return bad()
      return parseAttributeAssignmentsPage(
        await transport.invoke(
          'catalogoAdmin/atributos:listarAsignacionesAtributo',
          attributeAssignmentArgs(input),
        ),
      )
    },
    async getAttributeDefinition(input) {
      if (!definedId(input.definicionAtributoId)) return bad()
      return parseAttributeDefinition(
        await transport.invoke(
          'catalogoAdmin/atributos:obtenerDefinicionAtributo',
          { definicionAtributoId: input.definicionAtributoId },
        ),
      )
    },
    async listAttributeOptions(input) {
      if (!definedId(input.definicionAtributoId)) return bad()
      return parseAttributeOptionsPage(
        await transport.invoke(
          'catalogoAdmin/atributos:listarOpcionesAtributo',
          attributeOptionArgs(input),
        ),
      )
    },
  }
}

export type ResourceId = unknown
export type ResourceLifecycle = 'ALL' | 'ACTIVE' | 'INACTIVE'

export type ResourceScope =
  | { kind: 'ALL' }
  | { kind: 'GLOBAL' }
  | { kind: 'ORGANIZATION'; organizacionId: ResourceId }

export type ResourceOwnership =
  | { kind: 'GLOBAL' }
  | { kind: 'ORGANIZATION'; organizacionId: ResourceId }

export interface ResourceClassificationStatus {
  state: 'EFFECTIVE' | 'INERT' | 'BROKEN_REFERENCE'
  reasons: string[]
}

export interface ResourceSummary {
  id: ResourceId
  identificadorTecnico: string
  nombre: string
  tipoRecursoId: ResourceId
  unidadId: ResourceId
  organizacionId?: ResourceId
  activo: boolean
  revision: number
  classificationStatus: ResourceClassificationStatus
}

// Attribute-value editing is out of scope for this slice; kept structurally
// opaque until valoresAtributoRecurso gets its own contract in the UI.
export type ResourceValue = Readonly<Record<string, unknown>>
export type ResourceValueInput = ResourceValue

export interface ResourceHierarchyRef {
  id: ResourceId
  clave: string
  nombre: string
  activo: boolean
  revision: unknown
}

export interface ResourceUnitRef extends ResourceHierarchyRef {
  simbolo: string | null
}

export interface ResourceDetail extends ResourceSummary {
  descripcion: string | null
  identidadVersion: number | null
  clase: ResourceHierarchyRef | null
  familia: ResourceHierarchyRef | null
  tipo: ResourceHierarchyRef | null
  organizacion: ResourceHierarchyRef | null
  unidad: ResourceUnitRef | null
  catalogDiagnostics: Readonly<Record<string, unknown>>
  valores: ResourceValue[]
}

export interface ResourceListPage<T> {
  page: T[]
  isDone: boolean
  continueCursor: string
}

export interface ResourceListFilters {
  lifecycle?: ResourceLifecycle
  claseRecursoId?: ResourceId
  familiaRecursoId?: ResourceId
  tipoRecursoId?: ResourceId
  scope?: ResourceScope
}

export interface ResourceListInput extends ResourceListFilters {
  cursor?: string | null
  pageSize: number
}

export interface ResourceSearchInput extends ResourceListInput {
  searchText: string
}

export interface ResourceDetailInput {
  readonly recursoId: ResourceId
}

export interface ResourceCreateInput {
  readonly claseRecursoId: ResourceId
  readonly familiaRecursoId: ResourceId
  readonly tipoRecursoId: ResourceId
  readonly unidadId: ResourceId
  readonly nombre: string
  readonly descripcion?: string
  readonly valores: ResourceValueInput[]
  readonly ownership: ResourceOwnership
}

export interface ResourceUpdateInput {
  readonly recursoId: ResourceId
  readonly expectedRevision: number
  readonly unidadId?: ResourceId
  readonly nombre?: string
  readonly descripcion?: string
  readonly valores?: ResourceValueInput[]
}

export interface ResourceLifecycleInput {
  readonly recursoId: ResourceId
  readonly expectedRevision: number
}

export interface ResourceCreated {
  readonly disposition: 'CREATED'
  readonly item: ResourceSummary
}

export interface ResourceChangeResult {
  readonly disposition: string
  readonly item: ResourceSummary
}

// Context-selection reads (Clase/Familia/Tipo/Unidad natural) for the
// "Nuevo recurso" wizard. These mirror catalog-hierarchy's own list shapes
// but are read independently — resources-master never imports that feature.
export interface ResourceContextItemBase {
  id: ResourceId
  clave: string
  nombre: string
  activo: boolean
  revision: unknown
  effective: boolean
  effectiveReasons: string[]
}

export type ResourceContextClassItem = ResourceContextItemBase
export type ResourceContextFamilyItem = ResourceContextItemBase & {
  claseRecursoId: ResourceId
}
export type ResourceContextTypeItem = ResourceContextItemBase & {
  familiaRecursoId: ResourceId
  aggregateStatus: string
  violations: Readonly<Record<string, unknown>>[]
}

export interface ResourceContextListPage<T> {
  continuationCursor: string | null
  isExhausted: boolean
  items: T[]
}

export interface ResourceContextListInput {
  cursor?: string | null
  pageSize?: number
}

export interface ResourceContextFamilyListInput
  extends ResourceContextListInput {
  claseRecursoId: ResourceId
}

export interface ResourceContextTypeListInput extends ResourceContextListInput {
  familiaRecursoId: ResourceId
}

export type ResourceUnitPolicySelection =
  | 'SELECTED'
  | 'SHADOWED'
  | 'SUPPRESSED'
  | 'NONE'

export interface ResourceUnitPolicy {
  id: ResourceId
  familiaRecursoId: ResourceId
  tipoRecursoId?: ResourceId
  unidadId: ResourceId
  principal: boolean
  activo: boolean
  revision: number
  effective: boolean
  selected: boolean
  shadowed: boolean
  selection: ResourceUnitPolicySelection
}

export interface ResourceUnitPolicyListInput extends ResourceContextListInput {
  tipoRecursoId: ResourceId
}

export interface ResourceUnitDetail {
  id: ResourceId
  clave: string
  nombre: string
  descripcion?: string
  simbolo?: string
  activo: boolean
  revision: number
  effective: boolean
}

export interface ResourceUnitDetailInput {
  readonly unidadId: ResourceId
}

// Attribute assignment reads (Paso 2 — Atributos dinámicos) for the "Nuevo
// recurso" wizard. Mirrors catalog-hierarchy's own atributos.ts shapes but is
// read independently — resources-master never imports that feature.
export type ResourceAttributeApplicability =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'CONDITIONAL'
  | 'FORBIDDEN'
  | 'NOT_APPLICABLE'

export type ResourceAttributeSelection =
  | 'SELECTED'
  | 'SHADOWED'
  | 'SUPPRESSED'
  | 'NONE'

export interface ResourceAttributeAssignment {
  id: ResourceId
  familiaRecursoId: ResourceId
  definicionAtributoId: ResourceId
  tipoRecursoId?: ResourceId
  aplicabilidad: ResourceAttributeApplicability
  participaIdentidad: boolean
  orden: number
  activo: boolean
  revision: unknown
  effective: boolean
  effectiveReasons: string[]
  selection: ResourceAttributeSelection
}

export interface ResourceAttributeAssignmentListInput
  extends ResourceContextListInput {
  tipoRecursoId: ResourceId
}

export type ResourceAttributeDataType =
  | 'TEXTO'
  | 'NUMERO'
  | 'BOOLEANO'
  | 'OPCION'

export interface ResourceAttributeDefinition {
  id: ResourceId
  clave: string
  nombre: string
  descripcion?: string
  tipoDato: ResourceAttributeDataType
  unidadId?: ResourceId
  activo: boolean
  revision: unknown
  effective: boolean
  effectiveReasons: string[]
}

export interface ResourceAttributeDefinitionInput {
  readonly definicionAtributoId: ResourceId
}

export interface ResourceAttributeOption {
  id: ResourceId
  definicionAtributoId: ResourceId
  clave: string
  nombre: string
  descripcion?: string
  activo: boolean
  revision: unknown
  effective: boolean
  effectiveReasons: string[]
}

export interface ResourceAttributeOptionListInput
  extends ResourceContextListInput {
  definicionAtributoId: ResourceId
}

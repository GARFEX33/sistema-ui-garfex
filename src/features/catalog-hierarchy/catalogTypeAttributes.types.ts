export type OpaqueAttributeId = string
export type OpaqueAttributeRevision = number
export type OpaqueAttributeCursor = string | null

export type AttributeApplicability =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'CONDITIONAL'
  | 'FORBIDDEN'
  | 'NOT_APPLICABLE'

export type AttributeSelection = 'SELECTED' | 'SHADOWED' | 'SUPPRESSED' | 'NONE'

export type AttributeDataType = 'TEXTO' | 'NUMERO' | 'BOOLEANO' | 'OPCION'
export type AttributeMode = 'ALL' | 'ACTIVE' | 'INACTIVE'

export interface TypeAttributeAssignment {
  activo: boolean
  aplicabilidad: AttributeApplicability
  definicionAtributoId: OpaqueAttributeId
  effective: boolean
  effectiveReasons: string[]
  familiaRecursoId: OpaqueAttributeId
  id: OpaqueAttributeId
  orden: number
  participaIdentidad: boolean
  revision: OpaqueAttributeRevision
  selection: AttributeSelection
  tipoRecursoId?: OpaqueAttributeId
}

export interface AttributeDefinition {
  activo: boolean
  clave: string
  descripcion?: string
  effective: boolean
  effectiveReasons: string[]
  id: OpaqueAttributeId
  nombre: string
  revision: OpaqueAttributeRevision
  tipoDato: AttributeDataType
  unidadId?: OpaqueAttributeId
}

export interface TypeAttributePage<T> {
  continuationCursor: OpaqueAttributeCursor
  isExhausted: boolean
  items: T[]
}

export interface AttributeOption {
  activo: boolean
  clave: string
  definicionAtributoId: OpaqueAttributeId
  descripcion?: string
  effective: boolean
  effectiveReasons: string[]
  id: OpaqueAttributeId
  nombre: string
  revision: OpaqueAttributeRevision
}

export interface TypeAttributeAssignmentsInput {
  cursor?: OpaqueAttributeCursor
  mode?: AttributeMode
  pageSize?: number
  tipoRecursoId: OpaqueAttributeId
}

export interface AttributeDefinitionsInput {
  cursor?: OpaqueAttributeCursor
  pageSize?: number
}

export interface CreateTypeAttributeAssignmentInput {
  activo: boolean
  aplicabilidad: AttributeApplicability
  definicionAtributoId: OpaqueAttributeId
  familiaRecursoId: OpaqueAttributeId
  orden: number
  participaIdentidad: boolean
  tipoRecursoId: OpaqueAttributeId
}

export interface CreateAttributeDefinitionInput {
  activo: false
  clave: string
  descripcion?: string
  nombre: string
  tipoDato: AttributeDataType
}

export interface CreatedAttributeDefinition {
  disposition: 'CREATED'
  item: AttributeDefinition
}

export interface CreatedTypeAttributeAssignment {
  disposition: 'CREATED'
  item: TypeAttributeAssignment
}

export interface UpdateTypeAttributeAssignmentInput {
  aplicabilidad?: AttributeApplicability
  atributoRecursoId: OpaqueAttributeId
  expectedRevision: OpaqueAttributeRevision
  orden?: number
  participaIdentidad?: boolean
}

export interface ChangedTypeAttributeAssignment {
  disposition: 'UPDATED' | 'UNCHANGED'
  item: TypeAttributeAssignment
}

export interface AttributeAssignmentLifecycleInput {
  atributoRecursoId: OpaqueAttributeId
  expectedRevision: OpaqueAttributeRevision
}

export interface UpdateAttributeDefinitionInput {
  definicionAtributoId: OpaqueAttributeId
  descripcion?: string
  expectedRevision: OpaqueAttributeRevision
  nombre?: string
  tipoDato?: AttributeDataType
  unidadId?: OpaqueAttributeId | null
}

export interface ChangedAttributeDefinition {
  disposition: 'UPDATED' | 'UNCHANGED'
  item: AttributeDefinition
}

export interface AttributeOptionsInput {
  cursor?: OpaqueAttributeCursor
  definicionAtributoId?: OpaqueAttributeId
  mode: AttributeMode
  pageSize?: number
}

export interface CreateAttributeOptionInput {
  activo: boolean
  clave: string
  definicionAtributoId: OpaqueAttributeId
  descripcion?: string
  nombre: string
}

export interface CreatedAttributeOption {
  disposition: 'CREATED'
  item: AttributeOption
}

export interface UpdateAttributeOptionInput {
  descripcion?: string
  expectedRevision: OpaqueAttributeRevision
  nombre?: string
  opcionAtributoId: OpaqueAttributeId
}

export interface ChangedAttributeOption {
  disposition: 'UPDATED' | 'UNCHANGED'
  item: AttributeOption
}

export interface AttributeOptionLifecycleInput {
  expectedRevision: OpaqueAttributeRevision
  opcionAtributoId: OpaqueAttributeId
}

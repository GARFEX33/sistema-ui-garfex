export interface CatalogHierarchyContext {
  classId?: string
  familyId?: string
  typeId?: string
}

export type CatalogHierarchyLevel = 'families' | 'types'

export interface DependentQuery {
  parentId: string
}

export interface CatalogHierarchyItem {
  id: string
  label: string
  code?: string
}

export interface CatalogHierarchyPresentation {
  classes: CatalogHierarchyItem[]
  families: CatalogHierarchyItem[]
  types: CatalogHierarchyItem[]
  selectedClassId?: string
  selectedFamilyId?: string
  selectedTypeId?: string
}

export type CatalogMode = 'ALL' | 'ACTIVE' | 'INACTIVE'
export type CatalogId = unknown
export type OpaqueCursor = string | null
export type CatalogViolation = Readonly<Record<string, unknown>>

export interface CatalogItemBase {
  activo: boolean
  clave: string
  descripcion?: string
  effective: boolean
  effectiveReasons: string[]
  id: CatalogId
  nombre: string
  revision: unknown
}

export type CatalogClassItem = CatalogItemBase

export interface CatalogClassRestItem {
  activo: boolean
  clave: string
  id: string
  nombre: string
  revision: string
}

export interface CatalogClassRestCreateInput {
  code: string
  name: string
  plural: string
  slug: string
}

export type CatalogHierarchyRestReferenceInput<Kind extends string> = {
  kind: Kind
  code: string
}
export type CatalogHierarchyRestReference<Kind extends string> = {
  kind: Kind
  id: string
  code: string
}
export type CatalogFamilyRestCreateInput = {
  class: CatalogHierarchyRestReferenceInput<'CLASE'>
  code: string
  name: string
}
export type CatalogTypeRestCreateInput = {
  class: CatalogHierarchyRestReferenceInput<'CLASE'>
  family: CatalogHierarchyRestReferenceInput<'FAMILIA'>
  code: string
  name: string
}
type CatalogHierarchyRestCreateOutput<Kind extends string> = {
  kind: Kind
  id: string
  revision: string
  active: true
  code: string
  name: string
}
export type CatalogFamilyRestCreateOutput =
  CatalogHierarchyRestCreateOutput<'FAMILIA'> & {
    class: CatalogHierarchyRestReference<'CLASE'>
  }
export type CatalogTypeRestCreateOutput =
  CatalogHierarchyRestCreateOutput<'TIPO'> & {
    class: CatalogHierarchyRestReference<'CLASE'>
    family: CatalogHierarchyRestReference<'FAMILIA'>
  }

export interface CatalogWindowInput {
  scope: CatalogMode
  text?: string
  limit: number
  offset: number
  signal?: AbortSignal
}

export type CatalogClassWindowInput = CatalogWindowInput

export interface CatalogFamilyWindowInput extends CatalogWindowInput {
  classCode: string
}

export interface CatalogTypeWindowInput extends CatalogWindowInput {
  classCode?: string
  familyCode: string
}

export interface CatalogWindowPage<T> {
  items: T[]
  hasPrevious: boolean
  hasNext: boolean
}

export type CatalogClassWindowPage = CatalogWindowPage<CatalogClassRestItem>

export interface CatalogFamilyRestItem extends CatalogClassRestItem {
  classCode: string
}

export interface CatalogTypeRestItem extends CatalogClassRestItem {
  classCode?: string
  familyCode: string
}

export type CatalogFamilyWindowPage = CatalogWindowPage<CatalogFamilyRestItem>
export type CatalogTypeWindowPage = CatalogWindowPage<CatalogTypeRestItem>
export type CatalogFamilyItem = CatalogItemBase & { claseRecursoId: CatalogId }
export type CatalogTypeItem = CatalogItemBase & {
  aggregateStatus: string
  familiaRecursoId: CatalogId
  violations: CatalogViolation[]
}

export interface CatalogListPage<T> {
  continuationCursor: OpaqueCursor
  isExhausted: boolean
  items: T[]
}

export interface CatalogClassCreateInput {
  readonly clave: string
  readonly nombre: string
  readonly descripcion?: string
}

export interface CatalogFamilyCreateInput {
  readonly claseRecursoId: CatalogId
  readonly clave: string
  readonly nombre: string
  readonly descripcion?: string
}

export interface CatalogTypeCreateInput {
  readonly familiaRecursoId: CatalogId
  readonly clave: string
  readonly nombre: string
  readonly descripcion?: string
}

export interface CatalogCreated<T> {
  readonly disposition: 'CREATED'
  readonly item: T
}

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

export interface CatalogHierarchyContext {
  classId?: string
  familyId?: string
  typeId?: string
}

export type CatalogHierarchyLevel = 'families' | 'types'

export interface DependentQuery {
  parentId: string
}

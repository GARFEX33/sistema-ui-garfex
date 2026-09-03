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

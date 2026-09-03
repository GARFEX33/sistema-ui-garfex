import type { CatalogHierarchyPresentation } from '../../src/features/catalog-hierarchy/catalogHierarchy.types'

export const catalogHierarchyApprovedFixture: CatalogHierarchyPresentation = {
  classes: [{ id: 'materials', label: 'Materiales' }],
  families: [{ id: 'channels', label: 'Canalizaciones' }],
  types: [{ id: 'pipe', label: 'Tubería' }],
  selectedClassId: 'materials',
  selectedFamilyId: 'channels',
  selectedTypeId: 'pipe',
}

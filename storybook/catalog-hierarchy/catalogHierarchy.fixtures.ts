import type { CatalogHierarchyPresentation } from '../../src/features/catalog-hierarchy/catalogHierarchy.types'

export const catalogHierarchyApprovedFixture: CatalogHierarchyPresentation = {
  classes: [{ id: 'materials', label: 'Materiales', code: 'MATERIALES' }],
  families: [
    { id: 'channels', label: 'Canalizaciones', code: 'CANALIZACIONES' },
  ],
  types: [{ id: 'pipe', label: 'Tubería', code: 'TUBERIA' }],
  selectedClassId: 'materials',
  selectedFamilyId: 'channels',
  selectedTypeId: 'pipe',
}

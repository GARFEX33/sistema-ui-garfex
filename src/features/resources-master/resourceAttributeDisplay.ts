import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'

// Extracted from ResourceCreationReview.tsx (see resourcePresentation.ts and
// useResourcePresentationNames.ts for the second consumer that motivated
// pulling this out) so both the creation-review summary and the resources
// list presentation name share one formatting rule.
export function formatCatalogValueText(value: CatalogValue): string {
  switch (value.kind) {
    case 'TEXT':
    case 'CODE':
    case 'INTEGER':
    case 'DECIMAL':
    case 'ENUM':
    case 'CONTROLLED_OPTION':
      return value.value
    case 'BOOLEAN':
      return value.value ? 'Sí' : 'No'
    case 'QUANTITY':
      return `${value.value} ${value.unitCode}`
    case 'REFERENCE':
      return value.reference.code
    case 'STRING_LIST':
      return value.values.join(', ')
    case 'NOT_APPLICABLE':
      return 'No aplica'
  }
}

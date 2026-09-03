import { createFileRoute } from '@tanstack/react-router'
import { CatalogHierarchyEntry } from '../../features/catalog-hierarchy/CatalogHierarchyEntry'

export const Route = createFileRoute('/catalogo')({
  component: CatalogHierarchyEntry,
})

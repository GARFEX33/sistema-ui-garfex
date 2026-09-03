import type {
  CatalogHierarchyContext,
  CatalogHierarchyLevel,
  DependentQuery,
} from './catalogHierarchy.types'

export const createInitialCatalogHierarchyContext =
  (): CatalogHierarchyContext => ({})

export function selectClass(
  _context: CatalogHierarchyContext,
  classId: string,
): CatalogHierarchyContext {
  return { classId, familyId: undefined, typeId: undefined }
}

export function selectFamily(
  context: CatalogHierarchyContext,
  selection: { familyId: string; classId: string },
): CatalogHierarchyContext {
  return context.classId === selection.classId
    ? {
        classId: context.classId,
        familyId: selection.familyId,
        typeId: undefined,
      }
    : context
}

export function selectType(
  context: CatalogHierarchyContext,
  selection: { typeId: string; familyId: string },
): CatalogHierarchyContext {
  return context.familyId === selection.familyId
    ? { ...context, typeId: selection.typeId }
    : context
}

export function getDependentQuery(
  level: CatalogHierarchyLevel,
  context: CatalogHierarchyContext,
): DependentQuery | undefined {
  const parentId = level === 'families' ? context.classId : context.familyId
  return parentId ? { parentId } : undefined
}

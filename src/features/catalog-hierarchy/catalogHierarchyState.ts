import {
  createHierarchySelection,
  getHierarchyParentQuery,
  selectHierarchyChild,
  selectHierarchyRoot,
} from '../../shared/hierarchy/hierarchySelection'
import type {
  CatalogHierarchyContext,
  CatalogHierarchyLevel,
  DependentQuery,
} from './catalogHierarchy.types'

export const createInitialCatalogHierarchyContext =
  (): CatalogHierarchyContext =>
    createHierarchySelection<CatalogHierarchyContext>()

export function selectClass(
  context: CatalogHierarchyContext,
  classId: string,
): CatalogHierarchyContext {
  return selectHierarchyRoot(context, { key: 'classId', value: classId }, [
    'familyId',
    'typeId',
  ])
}

export function selectFamily(
  context: CatalogHierarchyContext,
  selection: { familyId: string; classId: string },
): CatalogHierarchyContext {
  return selectHierarchyChild(
    context,
    { key: 'familyId', value: selection.familyId },
    { key: 'classId', value: selection.classId },
    ['typeId'],
  )
}

export function selectType(
  context: CatalogHierarchyContext,
  selection: { typeId: string; familyId: string },
): CatalogHierarchyContext {
  return selectHierarchyChild(
    context,
    { key: 'typeId', value: selection.typeId },
    { key: 'familyId', value: selection.familyId },
    [],
  )
}

export function getDependentQuery(
  level: CatalogHierarchyLevel,
  context: CatalogHierarchyContext,
): DependentQuery | undefined {
  const parentKey = level === 'families' ? 'classId' : 'familyId'
  return getHierarchyParentQuery(context, parentKey) as
    | DependentQuery
    | undefined
}

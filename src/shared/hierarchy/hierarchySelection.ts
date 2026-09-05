export type HierarchySelection = object
type HierarchyKey<T extends HierarchySelection> = Extract<keyof T, string>

export const createHierarchySelection = <T extends HierarchySelection>(): T =>
  ({}) as T

export const hasHierarchyParent = (parentId: unknown) =>
  parentId !== undefined && parentId !== null && parentId !== ''

export function resetHierarchyDescendants<T extends HierarchySelection>(
  context: T,
  descendants: readonly HierarchyKey<T>[],
): T {
  return {
    ...context,
    ...Object.fromEntries(descendants.map((key) => [key, undefined])),
  } as T
}

export function selectHierarchyRoot<T extends HierarchySelection>(
  context: T,
  selection: { key: HierarchyKey<T>; value: unknown },
  descendants: readonly HierarchyKey<T>[],
): T {
  return resetHierarchyDescendants(
    { ...context, [selection.key]: selection.value } as T,
    descendants,
  )
}

export function selectHierarchyChild<T extends HierarchySelection>(
  context: T,
  selection: { key: HierarchyKey<T>; value: unknown },
  parent: { key: HierarchyKey<T>; value: unknown },
  descendants: readonly HierarchyKey<T>[],
): T {
  if (!Object.is(context[parent.key], parent.value)) return context
  return resetHierarchyDescendants(
    { ...context, [selection.key]: selection.value } as T,
    descendants,
  )
}

export function getHierarchyParentQuery<T extends HierarchySelection>(
  context: T,
  parentKey: HierarchyKey<T>,
): { parentId: unknown } | undefined {
  const parentId = context[parentKey]
  return hasHierarchyParent(parentId) ? { parentId } : undefined
}

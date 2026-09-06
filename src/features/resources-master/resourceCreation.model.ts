import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceId,
} from './resourcesMaster.types'

export type InitialResourceHierarchySnapshot = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
}>

export type NormalizedResourceHierarchyPrefix = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
  depth: 0 | 1 | 2 | 3
}>

export type ResourceHierarchySelection = Readonly<{
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
}>

export type ResourceHierarchyItems = Readonly<{
  classes: readonly ResourceContextClassItem[]
  families: readonly ResourceContextFamilyItem[]
  types: readonly ResourceContextTypeItem[]
}>

export const resourceIdKey = (id: ResourceId) => String(id)

const selectedItem = <T extends { id: ResourceId }>(
  selectedId: ResourceId | undefined,
  items: readonly T[],
): T | null =>
  selectedId === undefined
    ? null
    : (items.find(
        (item) => resourceIdKey(item.id) === resourceIdKey(selectedId),
      ) ?? null)

export const deriveInitialHierarchySnapshot = (
  selection: ResourceHierarchySelection,
  items: ResourceHierarchyItems,
): InitialResourceHierarchySnapshot => ({
  classItem: selectedItem(selection.classId, items.classes),
  familyItem: selectedItem(selection.familyId, items.families),
  typeItem: selectedItem(selection.typeId, items.types),
})

export const createInitialHierarchySnapshotCapture = (
  initialSnapshot: InitialResourceHierarchySnapshot | undefined,
) => {
  let latestSnapshot = initialSnapshot
  let capturedSnapshot: NormalizedResourceHierarchyPrefix | null = null

  return {
    receive(snapshot: InitialResourceHierarchySnapshot | undefined) {
      latestSnapshot = snapshot
    },
    captureOnOpen() {
      capturedSnapshot = normalizeInitialHierarchySnapshot(
        latestSnapshot ?? emptySnapshot,
      )
      return capturedSnapshot
    },
    captured() {
      return capturedSnapshot
    },
  }
}

const emptySnapshot: InitialResourceHierarchySnapshot = {
  classItem: null,
  familyItem: null,
  typeItem: null,
}

export const normalizeInitialHierarchySnapshot = (
  snapshot: InitialResourceHierarchySnapshot,
): NormalizedResourceHierarchyPrefix => {
  if (!snapshot.classItem)
    return { classItem: null, familyItem: null, typeItem: null, depth: 0 }

  if (
    !snapshot.familyItem ||
    resourceIdKey(snapshot.familyItem.claseRecursoId) !==
      resourceIdKey(snapshot.classItem.id)
  ) {
    return {
      classItem: snapshot.classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    }
  }

  if (
    !snapshot.typeItem ||
    resourceIdKey(snapshot.typeItem.familiaRecursoId) !==
      resourceIdKey(snapshot.familyItem.id)
  ) {
    return {
      classItem: snapshot.classItem,
      familyItem: snapshot.familyItem,
      typeItem: null,
      depth: 2,
    }
  }

  return {
    classItem: snapshot.classItem,
    familyItem: snapshot.familyItem,
    typeItem: snapshot.typeItem,
    depth: 3,
  }
}

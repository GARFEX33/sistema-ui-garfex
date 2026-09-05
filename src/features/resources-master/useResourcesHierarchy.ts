import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceId,
} from './resourcesMaster.types'
import {
  createParentGatedListController,
  type ParentGatedListController,
  type ParentGatedListState,
} from '../../shared/hierarchy/parentGatedListController'
import {
  createHierarchySelection,
  selectHierarchyChild,
  selectHierarchyRoot,
} from '../../shared/hierarchy/hierarchySelection'

const PAGE_SIZE = 20

type ResourcesHierarchyOperation = 'classes' | 'families' | 'types'

type ResourcesHierarchySelection = {
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
}

type ResourcesHierarchyItem =
  | ResourceContextClassItem
  | ResourceContextFamilyItem
  | ResourceContextTypeItem

type ResourcesHierarchyController<T extends ResourcesHierarchyItem> =
  ParentGatedListController<T, ResourcesHierarchyOperation>

type ResourcesHierarchyState<T extends ResourcesHierarchyItem> =
  ParentGatedListState<T, ResourcesHierarchyOperation>

function useHierarchySnapshot<T extends ResourcesHierarchyItem>(
  controller: ResourcesHierarchyController<T>,
) {
  const snapshotRef = useRef<ResourcesHierarchyState<T>>(controller.getState())
  const subscribe = (listener: () => void) =>
    controller.subscribe(() => {
      snapshotRef.current = controller.getState()
      listener()
    })

  return useSyncExternalStore(
    subscribe,
    () => snapshotRef.current,
    () => snapshotRef.current,
  )
}

function createResourcesHierarchyControllers(api: ResourcesMasterApi) {
  const classes = createParentGatedListController<
    ResourceContextClassItem,
    ResourcesHierarchyOperation,
    string | null
  >({
    operation: 'classes',
    requiresParent: (operation) => operation !== 'classes',
    adapter: {
      load: ({ cursor }) =>
        api.listContextClasses({ cursor, pageSize: PAGE_SIZE }),
    },
  })
  const families = createParentGatedListController<
    ResourceContextFamilyItem,
    ResourcesHierarchyOperation,
    string | null
  >({
    operation: 'families',
    requiresParent: (operation) => operation !== 'classes',
    adapter: {
      load: ({ parentId, cursor }) =>
        api.listContextFamilies({
          claseRecursoId: parentId,
          cursor,
          pageSize: PAGE_SIZE,
        }),
    },
  })
  const types = createParentGatedListController<
    ResourceContextTypeItem,
    ResourcesHierarchyOperation,
    string | null
  >({
    operation: 'types',
    requiresParent: (operation) => operation !== 'classes',
    adapter: {
      load: ({ parentId, cursor }) =>
        api.listContextTypes({
          familiaRecursoId: parentId,
          cursor,
          pageSize: PAGE_SIZE,
        }),
    },
  })

  return { classes, families, types }
}

export function useResourcesHierarchy(api: ResourcesMasterApi) {
  const [{ classes, families, types }] = useState(() =>
    createResourcesHierarchyControllers(api),
  )
  const [selection, setSelection] = useState<ResourcesHierarchySelection>(() =>
    createHierarchySelection<ResourcesHierarchySelection>(),
  )
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const classesState = useHierarchySnapshot(classes)
  const familiesState = useHierarchySnapshot(families)
  const typesState = useHierarchySnapshot(types)

  useEffect(() => {
    void classes.start()
  }, [classes])

  const selectClass = useCallback(
    (classId: ResourceId) => {
      const next = selectHierarchyRoot(
        selectionRef.current,
        { key: 'classId', value: classId },
        ['familyId', 'typeId'],
      )
      selectionRef.current = next
      setSelection(next)
      families.setContext({ operation: 'families', parentId: classId })
      types.setContext({ operation: 'types' })
      void families.start()
    },
    [families, types],
  )

  const selectFamily = useCallback(
    (familyId: ResourceId) => {
      const classId = selectionRef.current.classId
      const next = selectHierarchyChild(
        selectionRef.current,
        { key: 'familyId', value: familyId },
        { key: 'classId', value: classId },
        ['typeId'],
      )
      if (next === selectionRef.current) return
      selectionRef.current = next
      setSelection(next)
      types.setContext({ operation: 'types', parentId: familyId })
      void types.start()
    },
    [types],
  )

  const selectType = useCallback((typeId: ResourceId) => {
    const familyId = selectionRef.current.familyId
    const next = selectHierarchyChild(
      selectionRef.current,
      { key: 'typeId', value: typeId },
      { key: 'familyId', value: familyId },
      [],
    )
    if (next === selectionRef.current) return
    selectionRef.current = next
    setSelection(next)
  }, [])

  return {
    selection,
    classes: classesState,
    families: familiesState,
    types: typesState,
    selectClass,
    selectFamily,
    selectType,
    retryClasses: () => classes.retry(),
    retryFamilies: () => families.retry(),
    retryTypes: () => types.retry(),
    continueClasses: () => classes.continue(),
    continueFamilies: () => families.continue(),
    continueTypes: () => types.continue(),
  }
}

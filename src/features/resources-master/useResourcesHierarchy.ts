import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type {
  ResourcesMasterApi,
  ResourcesMasterRestReadApi,
} from './resourcesMaster.api'
import type {
  ResourceContextClassItem,
  ResourceContextClassRestItem,
  ResourceContextFamilyItem,
  ResourceContextFamilyRestItem,
  ResourceContextTypeItem,
  ResourceContextTypeRestItem,
  ResourceHierarchyWindowPage,
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

function useLegacyResourcesHierarchy(api: ResourcesMasterApi) {
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

type RestHierarchyItem =
  | ResourceContextClassRestItem
  | ResourceContextFamilyRestItem
  | ResourceContextTypeRestItem

type RestWindowState<T extends RestHierarchyItem> = {
  status: 'waiting-for-parent' | 'loading' | 'ready' | 'empty' | 'error'
  items: T[]
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  error?: unknown
}

const emptyWindow = <T extends RestHierarchyItem>(
  status: RestWindowState<T>['status'] = 'waiting-for-parent',
): RestWindowState<T> => ({
  status,
  items: [],
  offset: 0,
  hasPrevious: false,
  hasNext: false,
})

const restHierarchyApi = (
  api: ResourcesMasterApi | ResourcesMasterRestReadApi,
): api is ResourcesMasterRestReadApi => 'listHierarchyClasses' in api

function useRestResourcesHierarchy(api: ResourcesMasterRestReadApi) {
  const [selection, setSelection] = useState<ResourcesHierarchySelection>(() =>
    createHierarchySelection<ResourcesHierarchySelection>(),
  )
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const [classes, setClasses] = useState<
    RestWindowState<ResourceContextClassRestItem>
  >(() => emptyWindow('loading'))
  const [families, setFamilies] = useState<
    RestWindowState<ResourceContextFamilyRestItem>
  >(() => emptyWindow())
  const [types, setTypes] = useState<
    RestWindowState<ResourceContextTypeRestItem>
  >(() => emptyWindow())
  const classesGeneration = useRef(0)
  const familiesGeneration = useRef(0)
  const typesGeneration = useRef(0)

  const loadClasses = useCallback(
    async (offset = 0) => {
      const generation = ++classesGeneration.current
      setClasses((current) => ({ ...current, status: 'loading', offset }))
      try {
        const page = await api.listHierarchyClasses({
          scope: 'ACTIVE',
          limit: PAGE_SIZE,
          offset,
        })
        if (generation !== classesGeneration.current) return
        setClasses({
          ...page,
          offset,
          status: page.items.length === 0 ? 'empty' : 'ready',
        })
      } catch (error) {
        if (generation === classesGeneration.current)
          setClasses((current) => ({ ...current, status: 'error', error }))
      }
    },
    [api],
  )

  const loadFamilies = useCallback(
    async (classCode: string, offset = 0) => {
      const generation = ++familiesGeneration.current
      setFamilies((current) => ({ ...current, status: 'loading', offset }))
      try {
        const page = await api.listHierarchyFamilies({
          classCode,
          scope: 'ACTIVE',
          limit: PAGE_SIZE,
          offset,
        })
        if (generation !== familiesGeneration.current) return
        setFamilies({
          ...page,
          offset,
          status: page.items.length === 0 ? 'empty' : 'ready',
        })
      } catch (error) {
        if (generation === familiesGeneration.current)
          setFamilies((current) => ({ ...current, status: 'error', error }))
      }
    },
    [api],
  )

  const loadTypes = useCallback(
    async (classCode: string, familyCode: string, offset = 0) => {
      const generation = ++typesGeneration.current
      setTypes((current) => ({ ...current, status: 'loading', offset }))
      try {
        const page = await api.listHierarchyTypes({
          classCode,
          familyCode,
          scope: 'ACTIVE',
          limit: PAGE_SIZE,
          offset,
        })
        if (generation !== typesGeneration.current) return
        setTypes({
          ...page,
          offset,
          status: page.items.length === 0 ? 'empty' : 'ready',
        })
      } catch (error) {
        if (generation === typesGeneration.current)
          setTypes((current) => ({ ...current, status: 'error', error }))
      }
    },
    [api],
  )

  useEffect(() => {
    void loadClasses()
  }, [loadClasses])

  const selectClass = useCallback(
    (classId: ResourceId) => {
      const selected = classes.items.find((item) => item.id === classId)
      if (!selected) return
      const next = selectHierarchyRoot(
        selectionRef.current,
        { key: 'classId', value: classId },
        ['familyId', 'typeId'],
      )
      selectionRef.current = next
      setSelection(next)
      ++familiesGeneration.current
      ++typesGeneration.current
      setFamilies(emptyWindow('loading'))
      setTypes(emptyWindow())
      void loadFamilies(selected.code)
    },
    [classes.items, loadFamilies],
  )

  const selectFamily = useCallback(
    (familyId: ResourceId) => {
      const classId = selectionRef.current.classId
      const selectedClass = classes.items.find((item) => item.id === classId)
      const selectedFamily = families.items.find((item) => item.id === familyId)
      if (!selectedClass || !selectedFamily) return
      const next = selectHierarchyChild(
        selectionRef.current,
        { key: 'familyId', value: familyId },
        { key: 'classId', value: classId },
        ['typeId'],
      )
      if (next === selectionRef.current) return
      selectionRef.current = next
      setSelection(next)
      ++typesGeneration.current
      setTypes(emptyWindow('loading'))
      void loadTypes(selectedClass.code, selectedFamily.code)
    },
    [classes.items, families.items, loadTypes],
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

  const retryClasses = () => void loadClasses(classes.offset)
  const retryFamilies = () => {
    const selected = classes.items.find((item) => item.id === selection.classId)
    if (selected) void loadFamilies(selected.code, families.offset)
  }
  const retryTypes = () => {
    const selectedClass = classes.items.find(
      (item) => item.id === selection.classId,
    )
    const selectedFamily = families.items.find(
      (item) => item.id === selection.familyId,
    )
    if (selectedClass && selectedFamily)
      void loadTypes(selectedClass.code, selectedFamily.code, types.offset)
  }

  const continueClasses = () => {
    if (classes.hasNext && classes.status !== 'loading')
      void loadClasses(classes.offset + PAGE_SIZE)
  }
  const previousClasses = () => {
    if (classes.hasPrevious && classes.status !== 'loading')
      void loadClasses(Math.max(0, classes.offset - PAGE_SIZE))
  }
  const continueFamilies = () => {
    const selected = classes.items.find((item) => item.id === selection.classId)
    if (selected && families.hasNext && families.status !== 'loading')
      void loadFamilies(selected.code, families.offset + PAGE_SIZE)
  }
  const previousFamilies = () => {
    const selected = classes.items.find((item) => item.id === selection.classId)
    if (selected && families.hasPrevious && families.status !== 'loading')
      void loadFamilies(selected.code, Math.max(0, families.offset - PAGE_SIZE))
  }
  const continueTypes = () => {
    const selectedClass = classes.items.find(
      (item) => item.id === selection.classId,
    )
    const selectedFamily = families.items.find(
      (item) => item.id === selection.familyId,
    )
    if (
      selectedClass &&
      selectedFamily &&
      types.hasNext &&
      types.status !== 'loading'
    )
      void loadTypes(
        selectedClass.code,
        selectedFamily.code,
        types.offset + PAGE_SIZE,
      )
  }
  const previousTypes = () => {
    const selectedClass = classes.items.find(
      (item) => item.id === selection.classId,
    )
    const selectedFamily = families.items.find(
      (item) => item.id === selection.familyId,
    )
    if (
      selectedClass &&
      selectedFamily &&
      types.hasPrevious &&
      types.status !== 'loading'
    )
      void loadTypes(
        selectedClass.code,
        selectedFamily.code,
        Math.max(0, types.offset - PAGE_SIZE),
      )
  }

  return {
    selection,
    classes,
    families,
    types,
    selectClass,
    selectFamily,
    selectType,
    retryClasses,
    retryFamilies,
    retryTypes,
    continueClasses,
    previousClasses,
    continueFamilies,
    previousFamilies,
    continueTypes,
    previousTypes,
  }
}

export function useResourcesHierarchy(
  api: ResourcesMasterApi,
): ReturnType<typeof useLegacyResourcesHierarchy>
export function useResourcesHierarchy(
  api: ResourcesMasterRestReadApi,
): ReturnType<typeof useRestResourcesHierarchy>
export function useResourcesHierarchy(
  api: ResourcesMasterApi | ResourcesMasterRestReadApi,
) {
  return restHierarchyApi(api)
    ? useRestResourcesHierarchy(api)
    : useLegacyResourcesHierarchy(api)
}

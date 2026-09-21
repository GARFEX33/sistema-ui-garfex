import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type {
  ResourceContextClassRestItem,
  ResourceContextFamilyRestItem,
  ResourceContextTypeRestItem,
  ResourceId,
} from './resourcesMaster.types'
import {
  createHierarchySelection,
  selectHierarchyChild,
  selectHierarchyRoot,
} from '../../shared/hierarchy/hierarchySelection'

const PAGE_SIZE = 20

// Slice E1: Clase/Familia/Tipo selectors moved to a command-palette style
// (search + bounded internal scroll over the full loaded list, no
// Anterior/Siguiente), so this hook now fetches every page up front instead
// of exposing manual pagination. Catalog-admin hierarchy lists in this ERP
// are not expected to be huge; 200 is a generous bound (10 chained REST
// calls at PAGE_SIZE=20) that protects against an unbounded fetch loop if a
// class/familia/tipo tree ever grows unexpectedly large.
export const HIERARCHY_FETCH_CAP = 200

type ResourcesHierarchySelection = {
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
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

// Chains REST pages internally (offset 0, PAGE_SIZE, 2*PAGE_SIZE, ...) until
// either the server reports no further page or HIERARCHY_FETCH_CAP is hit.
// `hasNext` on the returned result is true only in the capped-with-more-left
// case, so callers can tell "complete list" apart from "truncated at the
// safety cap" without exposing per-page offsets.
async function fetchAllHierarchyPages<T>(
  fetchPage: (
    offset: number,
  ) => Promise<{ items: T[]; hasPrevious: boolean; hasNext: boolean }>,
): Promise<{ items: T[]; hasNext: boolean }> {
  let items: T[] = []
  let offset = 0
  let hasNext = true
  while (hasNext) {
    const page = await fetchPage(offset)
    items = items.concat(page.items)
    hasNext = page.hasNext
    if (page.items.length === 0) break
    if (items.length >= HIERARCHY_FETCH_CAP) return { items, hasNext }
    offset += PAGE_SIZE
  }
  return { items, hasNext: false }
}

export function useResourcesHierarchy(api: ResourcesMasterRestReadApi) {
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

  const loadClasses = useCallback(async () => {
    const generation = ++classesGeneration.current
    setClasses((current) => ({ ...current, status: 'loading', offset: 0 }))
    try {
      const { items, hasNext } = await fetchAllHierarchyPages((offset) =>
        api.listHierarchyClasses({ scope: 'ACTIVE', limit: PAGE_SIZE, offset }),
      )
      if (generation !== classesGeneration.current) return
      setClasses({
        items,
        offset: 0,
        hasPrevious: false,
        hasNext,
        status: items.length === 0 ? 'empty' : 'ready',
      })
    } catch (error) {
      if (generation === classesGeneration.current)
        setClasses((current) => ({ ...current, status: 'error', error }))
    }
  }, [api])

  const loadFamilies = useCallback(
    async (classCode: string) => {
      const generation = ++familiesGeneration.current
      setFamilies((current) => ({ ...current, status: 'loading', offset: 0 }))
      try {
        const { items, hasNext } = await fetchAllHierarchyPages((offset) =>
          api.listHierarchyFamilies({
            classCode,
            scope: 'ACTIVE',
            limit: PAGE_SIZE,
            offset,
          }),
        )
        if (generation !== familiesGeneration.current) return
        setFamilies({
          items,
          offset: 0,
          hasPrevious: false,
          hasNext,
          status: items.length === 0 ? 'empty' : 'ready',
        })
      } catch (error) {
        if (generation === familiesGeneration.current)
          setFamilies((current) => ({ ...current, status: 'error', error }))
      }
    },
    [api],
  )

  const loadTypes = useCallback(
    async (classCode: string, familyCode: string) => {
      const generation = ++typesGeneration.current
      setTypes((current) => ({ ...current, status: 'loading', offset: 0 }))
      try {
        const { items, hasNext } = await fetchAllHierarchyPages((offset) =>
          api.listHierarchyTypes({
            classCode,
            familyCode,
            scope: 'ACTIVE',
            limit: PAGE_SIZE,
            offset,
          }),
        )
        if (generation !== typesGeneration.current) return
        setTypes({
          items,
          offset: 0,
          hasPrevious: false,
          hasNext,
          status: items.length === 0 ? 'empty' : 'ready',
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

  const retryClasses = () => void loadClasses()
  const retryFamilies = () => {
    const selected = classes.items.find((item) => item.id === selection.classId)
    if (selected) void loadFamilies(selected.code)
  }
  const retryTypes = () => {
    const selectedClass = classes.items.find(
      (item) => item.id === selection.classId,
    )
    const selectedFamily = families.items.find(
      (item) => item.id === selection.familyId,
    )
    if (selectedClass && selectedFamily)
      void loadTypes(selectedClass.code, selectedFamily.code)
  }

  // Slice E1: each level now loads its complete window up front (see
  // fetchAllHierarchyPages above), so manual pagination is no longer
  // meaningful for a bounded, search-and-scroll consumer. Slice E2 confirmed
  // (via rg) that `previousClasses/Families/Types` had no remaining
  // consumer once ResourcesMasterScreen.tsx moved off HierarchyNavigator, so
  // they were removed. `continueClasses/Families/Types` stay as documented
  // no-ops because CrearRecursoSurface.tsx's resource-creation wizard still
  // wires them as StagedSearchSelector's `onLoadMore` in its own (unbounded)
  // mode — harmless in the ordinary case since a fully-loaded window is
  // already exhausted, and only a no-op (rather than a real fetch) in the
  // rare case a class/familia/tipo list exceeds HIERARCHY_FETCH_CAP.
  const continueClasses = () => {}
  const continueFamilies = () => {}
  const continueTypes = () => {}

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
    continueFamilies,
    continueTypes,
  }
}

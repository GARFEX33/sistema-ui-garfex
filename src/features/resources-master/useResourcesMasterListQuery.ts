import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type { ResourceId } from './resourcesMaster.types'

export type ResourcesListCriteria = Readonly<{
  searchText: string
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
}>

export type ResourceListQueryStatus =
  | 'initial-loading'
  | 'empty'
  | 'ready'
  | 'initial-error'

type EffectiveFilter = Readonly<{
  level: 'all' | 'class' | 'family' | 'type'
  id: ResourceId | null
  payload: Readonly<Record<string, ResourceId>>
}>

class ResourceListQueryFailure extends Error {
  constructor(readonly automaticRetryAllowed: boolean) {
    super('Resource list request failed')
  }
}

type ActionState = {
  continuation?: Promise<void>
  manualInitialRequests: number
}

const actionStates = new WeakMap<object, ActionState>()

const effectiveFilter = (criteria: ResourcesListCriteria): EffectiveFilter => {
  if (criteria.typeId !== undefined)
    return {
      level: 'type',
      id: criteria.typeId,
      payload: { tipoRecursoId: criteria.typeId },
    }
  if (criteria.familyId !== undefined)
    return {
      level: 'family',
      id: criteria.familyId,
      payload: { familiaRecursoId: criteria.familyId },
    }
  if (criteria.classId !== undefined)
    return {
      level: 'class',
      id: criteria.classId,
      payload: { claseRecursoId: criteria.classId },
    }
  return { level: 'all', id: null, payload: {} }
}

export function useResourcesMasterListQuery(
  api: ResourcesMasterApi,
  criteria: ResourcesListCriteria,
) {
  const queryClient = useQueryClient()
  const activeQueryRef = useRef<object | undefined>(undefined)
  const normalizedSearchText = criteria.searchText.trim()
  const filter = effectiveFilter(criteria)
  const queryKey = [
    'resources-master',
    'list',
    normalizedSearchText,
    filter.level,
    filter.id,
  ] as const
  const stateForKey = () => {
    const cachedQuery = queryClient
      .getQueryCache()
      .find({ queryKey, exact: true })
    if (!cachedQuery) return undefined
    const existing = actionStates.get(cachedQuery)
    if (existing) return { cachedQuery, state: existing }
    const state: ActionState = { manualInitialRequests: 0 }
    actionStates.set(cachedQuery, state)
    return { cachedQuery, state }
  }
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | null | undefined,
    queryFn: async ({ pageParam }) => {
      const input = {
        lifecycle: 'ACTIVE' as const,
        pageSize: 20,
        cursor: pageParam,
        ...filter.payload,
      }
      try {
        return normalizedSearchText
          ? await api.searchResources({
              ...input,
              searchText: normalizedSearchText,
            })
          : await api.listResources(input)
      } catch {
        const state = stateForKey()?.state
        throw new ResourceListQueryFailure(
          pageParam === undefined && !state?.manualInitialRequests,
        )
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    retry: (failureCount, error) =>
      error instanceof ResourceListQueryFailure &&
      error.automaticRetryAllowed &&
      failureCount < 1,
    retryDelay: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
  const activeQuery = stateForKey()?.cachedQuery
  useEffect(() => {
    activeQueryRef.current = activeQuery
    return () => {
      if (activeQueryRef.current === activeQuery)
        activeQueryRef.current = undefined
    }
  }, [activeQuery])
  const pages = query.data?.pages
  const items = useMemo(() => {
    const seen = new Set<ResourceId>()
    return (pages ?? []).flatMap(({ page }) =>
      page.filter((resource) => {
        if (seen.has(resource.id)) return false
        seen.add(resource.id)
        return true
      }),
    )
  }, [pages])
  const isDone = pages?.at(-1)?.isDone ?? false
  const hasPages = !!pages?.length
  const status: ResourceListQueryStatus =
    !hasPages && query.isError
      ? 'initial-error'
      : !hasPages && query.isPending
        ? 'initial-loading'
        : !items.length && isDone
          ? 'empty'
          : 'ready'

  const isActive = () =>
    activeQuery !== undefined && activeQueryRef.current === activeQuery
  const continueActive = (): Promise<void> => {
    if (!isActive() || isDone) return Promise.resolve()
    const entry = stateForKey()
    if (!entry || entry.cachedQuery !== activeQuery) return Promise.resolve()
    if (entry.state.continuation) return entry.state.continuation
    const continuation = query.fetchNextPage().then(
      () => undefined,
      () => undefined,
    )
    entry.state.continuation = continuation
    void continuation.finally(() => {
      if (entry.state.continuation === continuation)
        entry.state.continuation = undefined
    })
    return continuation
  }
  const retry = (): Promise<void> => {
    if (!isActive() || !query.isError) return Promise.resolve()
    if (hasPages) return continueActive()
    const entry = stateForKey()
    if (!entry || entry.cachedQuery !== activeQuery) return Promise.resolve()
    entry.state.manualInitialRequests += 1
    const request = query.refetch().then(
      () => undefined,
      () => undefined,
    )
    void request.finally(() => {
      entry.state.manualInitialRequests -= 1
    })
    return request
  }
  const refetchActive = (): Promise<void> => {
    if (!isActive()) return Promise.resolve()
    const entry = stateForKey()
    if (!entry || entry.cachedQuery !== activeQuery) return Promise.resolve()
    entry.state.manualInitialRequests += 1
    const request = query.refetch().then(
      () => undefined,
      () => undefined,
    )
    void request.finally(() => {
      entry.state.manualInitialRequests -= 1
    })
    return request
  }

  return {
    items,
    status,
    isDone,
    loadMore: continueActive,
    retry,
    refetchActive,
  }
}

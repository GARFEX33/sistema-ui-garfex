import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
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
  const normalizedSearchText = criteria.searchText.trim()
  const filter = effectiveFilter(criteria)
  const queryKey = [
    'resources-master',
    'list',
    normalizedSearchText,
    filter.level,
    filter.id,
  ] as const
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
        throw new ResourceListQueryFailure(pageParam === undefined)
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

  return { items, status, isDone }
}

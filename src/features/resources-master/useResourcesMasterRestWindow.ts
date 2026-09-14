import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type { Resource, ResourceLifecycle } from './resourcesMaster.types'

const DEBOUNCE_MS = 250

export type ResourcesMasterRestWindowCriteria = Readonly<{
  text: string
  scope: ResourceLifecycle
  classCode?: string
  familyCode?: string
  typeCode?: string
  limit: number
}>

type WindowStatus =
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'

function useDebounced<T>(value: T) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value])
  return debounced
}

export function useResourcesMasterRestWindow(
  api: ResourcesMasterRestReadApi,
  criteria: ResourcesMasterRestWindowCriteria,
) {
  const identity = useMemo(
    () => ({ ...criteria, text: criteria.text.trim() }),
    [
      criteria.classCode,
      criteria.familyCode,
      criteria.limit,
      criteria.scope,
      criteria.text,
      criteria.typeCode,
    ],
  )
  const identityKey = JSON.stringify([
    identity.text,
    identity.scope,
    identity.classCode,
    identity.familyCode,
    identity.typeCode,
    identity.limit,
  ])
  const debounced = useDebounced(identity)
  const debouncedKey = JSON.stringify([
    debounced.text,
    debounced.scope,
    debounced.classCode,
    debounced.familyCode,
    debounced.typeCode,
    debounced.limit,
  ])
  const [offset, setOffset] = useState(0)
  useEffect(() => setOffset(0), [identityKey])

  const key = useMemo(
    () =>
      [
        'resources-master',
        'rest-window',
        debounced.text,
        debounced.scope,
        debounced.classCode,
        debounced.familyCode,
        debounced.typeCode,
        debounced.limit,
        offset,
      ] as const,
    [
      debounced.classCode,
      debounced.familyCode,
      debounced.limit,
      debounced.scope,
      debounced.text,
      debounced.typeCode,
      offset,
    ],
  )
  const waiting = identityKey !== debouncedKey
  const query = useQuery({
    queryKey: key,
    enabled: !waiting,
    queryFn: ({ signal }) => api.listResources({ ...debounced, offset, signal }),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
  const token = useMemo(() => Symbol(), [key])
  const active = useRef<symbol | undefined>(undefined)
  useEffect(() => {
    active.current = token
    return () => {
      if (active.current === token) active.current = undefined
    }
  }, [token])
  const isActive = () => active.current === token
  const page = query.data
  const status: WindowStatus =
    waiting || query.isPending
      ? 'initial-loading'
      : query.isError
        ? offset ? 'navigation-error' : 'initial-error'
        : query.isFetching
          ? 'navigating'
          : !page?.resources.length
            ? 'empty'
            : 'ready'
  const navigating = useRef(false)
  useEffect(() => {
    if (!query.isFetching) navigating.current = false
  }, [query.isFetching])
  const navigate = (delta: number, allowed: boolean) => {
    if (!isActive() || !allowed || query.isFetching || navigating.current) return
    navigating.current = true
    setOffset((current) => Math.max(0, current + delta))
  }

  return {
    resources: page?.resources ?? [],
    status,
    offset,
    hasPrevious: page?.hasPrevious ?? false,
    hasNext: page?.hasNext ?? false,
    next: () => navigate(debounced.limit, !!page?.hasNext),
    previous: () => navigate(-debounced.limit, !!page?.hasPrevious),
    retry: () => (isActive() && query.isError ? query.refetch() : Promise.resolve()),
    refetchActive: () => (isActive() ? query.refetch() : Promise.resolve()),
  }
}

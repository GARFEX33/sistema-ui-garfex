import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProveedoresRestApi } from './proveedores.api'
import type { SupplierLifecycle } from './proveedores.types'

const DEBOUNCE_MS = 250

export type ProveedoresRestWindowCriteria = Readonly<{
  text: string
  scope: SupplierLifecycle
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

// Mirrors useResourcesMasterRestWindow's debounce/offset/query-key pattern
// (src/features/resources-master/useResourcesMasterRestWindow.ts), adapted to
// Supplier's flat shape: no class/family/type hierarchy filters, just a text
// search. Unlike resources-master, the Supplier `text` filter has no
// documented backend bug (see odd/tasks/proveedores-master.md), so the
// trimmed, debounced text is sent straight to listSuppliers instead of being
// refined client-side.
export function useProveedoresRestWindow(
  api: ProveedoresRestApi,
  criteria: ProveedoresRestWindowCriteria,
) {
  const identity = useMemo(
    () => ({
      text: criteria.text.trim(),
      scope: criteria.scope,
      limit: criteria.limit,
    }),
    [criteria.limit, criteria.scope, criteria.text],
  )
  const identityKey = JSON.stringify([
    identity.text,
    identity.scope,
    identity.limit,
  ])
  const debounced = useDebounced(identity)
  const debouncedKey = JSON.stringify([
    debounced.text,
    debounced.scope,
    debounced.limit,
  ])
  const [offset, setOffset] = useState(0)
  useEffect(() => setOffset(0), [identityKey])

  const key = useMemo(
    () =>
      [
        'proveedores',
        'rest-window',
        debounced.text,
        debounced.scope,
        debounced.limit,
        offset,
      ] as const,
    [debounced.limit, debounced.scope, debounced.text, offset],
  )
  const waiting = identityKey !== debouncedKey
  const query = useQuery({
    queryKey: key,
    enabled: !waiting,
    queryFn: ({ signal }) =>
      api.listSuppliers({
        text: debounced.text,
        scope: debounced.scope,
        limit: debounced.limit,
        offset,
        signal,
      }),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
  // key is a trigger, not a referenced value: a fresh token per query key
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        ? offset
          ? 'navigation-error'
          : 'initial-error'
        : query.isFetching
          ? 'navigating'
          : !page?.suppliers.length
            ? 'empty'
            : 'ready'
  const navigating = useRef(false)
  useEffect(() => {
    if (!query.isFetching) navigating.current = false
  }, [query.isFetching])
  const navigate = (delta: number, allowed: boolean) => {
    if (!isActive() || !allowed || query.isFetching || navigating.current)
      return
    navigating.current = true
    setOffset((current) => Math.max(0, current + delta))
  }

  return {
    suppliers: page?.suppliers ?? [],
    status,
    offset,
    hasPrevious: page?.hasPrevious ?? false,
    hasNext: page?.hasNext ?? false,
    next: () => navigate(debounced.limit, !!page?.hasNext),
    previous: () => navigate(-debounced.limit, !!page?.hasPrevious),
    retry: () =>
      isActive() && query.isError ? query.refetch() : Promise.resolve(),
    refetchActive: () => (isActive() ? query.refetch() : Promise.resolve()),
  }
}

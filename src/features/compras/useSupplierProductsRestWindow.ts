import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComprasRestApi } from './compras.api'

type WindowStatus =
  | 'disabled'
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'

export function useSupplierProductsRestWindow(
  api: ComprasRestApi,
  supplierId: string | undefined,
  limit: number,
) {
  const identity = `${supplierId ?? ''}:${limit}`
  const previousIdentity = useRef<string | undefined>(undefined)
  const [storedOffset, setStoredOffset] = useState(0)
  const offset = previousIdentity.current === identity ? storedOffset : 0
  useEffect(() => {
    previousIdentity.current = identity
    setStoredOffset(0)
  }, [identity])

  const key = useMemo(
    () =>
      [
        'compras',
        'supplier-products',
        supplierId ?? '',
        limit,
        offset,
      ] as const,
    [limit, offset, supplierId],
  )
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(supplierId),
    queryFn: ({ signal }) =>
      api.listSupplierProducts({
        supplierId: supplierId!,
        limit,
        offset,
        signal,
      }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === supplierId ? previousData : undefined,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
  const token = useMemo(() => Symbol(key.join(':')), [key])
  const active = useRef<symbol | undefined>(undefined)
  useEffect(() => {
    active.current = token
    return () => {
      if (active.current === token) active.current = undefined
    }
  }, [token])
  const isActive = () => active.current === token
  const page = query.data
  const status: WindowStatus = !supplierId
    ? 'disabled'
    : query.isError
      ? offset
        ? 'navigation-error'
        : 'initial-error'
      : query.isFetching
        ? offset
          ? 'navigating'
          : 'initial-loading'
        : !page?.products.length
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
    setStoredOffset((current) => Math.max(0, current + delta))
  }
  const canRefetch = () => isActive() && Boolean(supplierId)

  return {
    rows: page?.products ?? [],
    status,
    offset,
    hasPrevious: page?.hasPrevious ?? false,
    hasNext: page?.hasNext ?? false,
    next: () => navigate(limit, !!page?.hasNext),
    previous: () => navigate(-limit, !!page?.hasPrevious),
    retry: () =>
      canRefetch() && query.isError ? query.refetch() : Promise.resolve(),
    refetchActive: () =>
      canRefetch() ? query.refetch({ throwOnError: true }) : Promise.resolve(),
  }
}

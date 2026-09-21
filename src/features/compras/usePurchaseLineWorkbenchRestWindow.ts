import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComprasRestApi } from './compras.api'
import type {
  PurchaseLineWorkbenchFilterInput,
  PurchaseLineWorkbenchPage,
} from './compras.types'

export type PurchaseLineWorkbenchCriteria = Omit<
  PurchaseLineWorkbenchFilterInput,
  'offset' | 'signal'
>

export type PurchaseLineWorkbenchWindowStatus =
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'

type FilterKey = PurchaseLineWorkbenchCriteria

type WindowState = {
  filterKey: FilterKey
  offset: number
}

type RefetchActiveOptions = {
  throwOnError?: boolean
}

export function usePurchaseLineWorkbenchRestWindow(
  api: ComprasRestApi,
  criteria: PurchaseLineWorkbenchCriteria,
) {
  const filterKey = useMemo<FilterKey>(
    () => ({
      supplierId: criteria.supplierId,
      status: criteria.status,
      dateFrom: criteria.dateFrom,
      dateTo: criteria.dateTo,
      invoice: criteria.invoice,
      supplierSku: criteria.supplierSku,
      description: criteria.description,
      limit: criteria.limit,
    }),
    [
      criteria.dateFrom,
      criteria.dateTo,
      criteria.description,
      criteria.invoice,
      criteria.limit,
      criteria.status,
      criteria.supplierId,
      criteria.supplierSku,
    ],
  )
  const [windowState, setWindowState] = useState<WindowState>(() => ({
    filterKey,
    offset: 0,
  }))
  const isCurrentFilter = windowState.filterKey === filterKey
  const offset = isCurrentFilter ? windowState.offset : 0

  useEffect(() => {
    setWindowState({ filterKey, offset: 0 })
  }, [filterKey])

  const queryKey = useMemo(
    () => ['compras', 'purchase-line-workbench', filterKey, offset] as const,
    [filterKey, offset],
  )
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      api.listPurchaseLineWorkbench({ ...criteria, offset, signal }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === filterKey ? previousData : undefined,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const token = useMemo(() => Symbol(queryKey.join(':')), [queryKey])
  const active = useRef<symbol | undefined>(undefined)
  useEffect(() => {
    active.current = token
    return () => {
      if (active.current === token) active.current = undefined
    }
  }, [token])
  const isActive = () => active.current === token

  const page: PurchaseLineWorkbenchPage | undefined = query.data
  const status: PurchaseLineWorkbenchWindowStatus = query.isError
    ? offset
      ? 'navigation-error'
      : 'initial-error'
    : query.isFetching
      ? offset
        ? 'navigating'
        : 'initial-loading'
      : !page?.lines.length
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
    setWindowState((current) => ({
      filterKey,
      offset: Math.max(
        0,
        (current.filterKey === filterKey ? current.offset : 0) + delta,
      ),
    }))
  }

  const canRefetch = () => isActive()

  return {
    rows: page?.lines ?? [],
    status,
    offset,
    hasPrevious: page?.hasPrevious ?? false,
    hasNext: page?.hasNext ?? false,
    next: () => navigate(criteria.limit, !!page?.hasNext),
    previous: () => navigate(-criteria.limit, !!page?.hasPrevious),
    retry: () =>
      canRefetch() && query.isError ? query.refetch() : Promise.resolve(),
    refetchActive: (options: RefetchActiveOptions = {}) =>
      canRefetch()
        ? query.refetch({ throwOnError: options.throwOnError ?? true })
        : Promise.resolve(),
  }
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePurchaseLineWorkbenchRestWindow } from '../../src/features/compras/usePurchaseLineWorkbenchRestWindow'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import type {
  EffectiveLinkStatus,
  PurchaseLineWorkbenchPage,
  PurchaseLineWorkbenchRow,
} from '../../src/features/compras/compras.types'

type Criteria = Parameters<typeof usePurchaseLineWorkbenchRestWindow>[1]

const row = (lineId: string): PurchaseLineWorkbenchRow =>
  ({ lineId }) as PurchaseLineWorkbenchRow
const page = (
  lineId: string,
  hasPrevious = false,
  hasNext = false,
): PurchaseLineWorkbenchPage => ({
  lines: [row(lineId)],
  hasPrevious,
  hasNext,
})
const api = (listPurchaseLineWorkbench = vi.fn()) =>
  ({ listPurchaseLineWorkbench }) as unknown as ComprasRestApi
const clients: QueryClient[] = []
const renderWindow = (criteria: Criteria, rest: ComprasRestApi) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(queryClient)
  return renderHook(
    ({ currentCriteria }) =>
      usePurchaseLineWorkbenchRestWindow(rest, currentCriteria),
    {
      initialProps: { currentCriteria: criteria },
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    },
  )
}

const baseCriteria: Criteria = {
  supplierId: 'supplier-1',
  status: 'PENDIENTE' as EffectiveLinkStatus,
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
  invoice: 'A-1',
  supplierSku: 'SKU-1',
  description: 'widget',
  limit: 2,
}

afterEach(() => {
  clients.splice(0).forEach((queryClient) => queryClient.clear())
})

describe('usePurchaseLineWorkbenchRestWindow', () => {
  it('loads the initial replacement page and forwards criteria plus Query signal', async () => {
    const list = vi.fn().mockResolvedValue(page('line-1'))
    const mounted = renderWindow(baseCriteria, api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))

    expect(mounted.result.current.rows).toEqual([row('line-1')])
    expect(list).toHaveBeenCalledWith({
      ...baseCriteria,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
  })

  it.each([
    ['supplierId', 'supplier-2'],
    ['status', 'VINCULADO'],
    ['dateFrom', '2025-02-01'],
    ['dateTo', '2025-02-28'],
    ['invoice', 'B-2'],
    ['supplierSku', 'SKU-2'],
    ['description', 'different widget'],
    ['limit', 3],
  ] as const)(
    'resets offset and rows when %s changes',
    async (field, value) => {
      const list = vi
        .fn()
        .mockResolvedValueOnce(page('old-line', false, true))
        .mockResolvedValueOnce(page('old-line-page-2', true, false))
      const mounted = renderWindow(baseCriteria, api(list))
      await waitFor(() => expect(mounted.result.current.status).toBe('ready'))

      mounted.result.current.next()
      await waitFor(() => expect(mounted.result.current.offset).toBe(2))
      list.mockResolvedValueOnce(page(`new-${field}`))

      const nextCriteria = { ...baseCriteria, [field]: value } as Criteria
      mounted.rerender({ currentCriteria: nextCriteria })

      expect(mounted.result.current.offset).toBe(0)
      expect(mounted.result.current.rows).toEqual([])
      await waitFor(() =>
        expect(mounted.result.current.rows).toEqual([row(`new-${field}`)]),
      )
      expect(list).toHaveBeenLastCalledWith({
        ...nextCriteria,
        offset: 0,
        signal: expect.any(AbortSignal),
      })
    },
  )

  it('replaces pages, bounds navigation, and ignores duplicate clicks', async () => {
    let resolveNext!: (value: PurchaseLineWorkbenchPage) => void
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockReturnValueOnce(
        new Promise<PurchaseLineWorkbenchPage>((resolve) => {
          resolveNext = resolve
        }),
      )
    const mounted = renderWindow({ limit: 2 }, api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    mounted.result.current.previous()
    mounted.result.current.next()
    mounted.result.current.next()
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(mounted.result.current.status).toBe('navigating')
    expect(mounted.result.current.rows).toEqual([row('first')])
    expect(mounted.result.current.offset).toBe(2)

    resolveNext(page('second', true, false))
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([row('second')])
    mounted.result.current.next()
    expect(list).toHaveBeenCalledTimes(2)

    mounted.result.current.previous()
    await waitFor(() => expect(mounted.result.current.offset).toBe(0))
    expect(mounted.result.current.rows).toEqual([row('first')])
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('does not publish an out-of-order completion after a filter identity change', async () => {
    let resolveOld!: (value: PurchaseLineWorkbenchPage) => void
    let resolveCurrent!: (value: PurchaseLineWorkbenchPage) => void
    const list = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<PurchaseLineWorkbenchPage>((resolve) => {
          resolveOld = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<PurchaseLineWorkbenchPage>((resolve) => {
          resolveCurrent = resolve
        }),
      )
    const mounted = renderWindow(baseCriteria, api(list))

    await waitFor(() => expect(list).toHaveBeenCalledOnce())
    const oldSignal = list.mock.calls[0]?.[0].signal
    mounted.rerender({
      currentCriteria: { ...baseCriteria, supplierId: 'supplier-2' },
    })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(oldSignal?.aborted).toBe(true)

    resolveOld(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.rows).toEqual([])

    resolveCurrent(page('current'))
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([row('current')]),
    )
  })

  it('reports initial and navigation errors and retries only the active error', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('initial'))
      .mockResolvedValueOnce(page('recovered', false, true))
      .mockRejectedValueOnce(new Error('navigation'))
      .mockResolvedValueOnce(page('navigated'))
    const mounted = renderWindow({ limit: 2 }, api(list))

    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-error'),
    )
    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))

    mounted.result.current.next()
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('navigation-error'),
    )
    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([row('navigated')])
  })

  it('supports authoritative refetch throwOnError semantics', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('before'))
      .mockResolvedValueOnce(page('after'))
      .mockRejectedValueOnce(new Error('authoritative failure'))
      .mockRejectedValueOnce(new Error('soft authoritative failure'))
    const mounted = renderWindow({ limit: 2 }, api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    await mounted.result.current.refetchActive({ throwOnError: true })
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([row('after')]),
    )
    await expect(
      mounted.result.current.refetchActive({ throwOnError: true }),
    ).rejects.toThrow('authoritative failure')
    const result = await mounted.result.current.refetchActive({
      throwOnError: false,
    })
    expect(result.isError).toBe(true)
  })

  it('aborts on unmount and ignores callbacks and late completion', async () => {
    let resolveCurrent!: (value: PurchaseLineWorkbenchPage) => void
    const list = vi.fn().mockReturnValue(
      new Promise<PurchaseLineWorkbenchPage>((resolve) => {
        resolveCurrent = resolve
      }),
    )
    const mounted = renderWindow({ limit: 2 }, api(list))
    await waitFor(() => expect(list).toHaveBeenCalledOnce())
    const signal = list.mock.calls[0]?.[0].signal
    const retry = mounted.result.current.retry
    const refetchActive = mounted.result.current.refetchActive

    mounted.unmount()
    expect(signal?.aborted).toBe(true)
    await retry()
    await refetchActive()
    resolveCurrent(page('late'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(list).toHaveBeenCalledOnce()
  })
})

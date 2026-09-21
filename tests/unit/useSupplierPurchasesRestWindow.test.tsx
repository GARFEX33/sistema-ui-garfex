import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSupplierPurchasesRestWindow } from '../../src/features/compras/useSupplierPurchasesRestWindow'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import type {
  Purchase,
  PurchasePage,
} from '../../src/features/compras/compras.types'

const page = (
  id: string,
  hasPrevious = false,
  hasNext = false,
): PurchasePage => ({
  purchases: [{ id } as Purchase],
  hasPrevious,
  hasNext,
})
const api = (listSupplierPurchases = vi.fn()) =>
  ({ listSupplierPurchases }) as unknown as ComprasRestApi
const clients: QueryClient[] = []
const renderWindow = (
  supplierId: string | undefined,
  rest: ComprasRestApi,
  limit = 20,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(queryClient)
  return renderHook(
    ({ id }) => useSupplierPurchasesRestWindow(rest, id, limit),
    {
      initialProps: { id: supplierId },
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    },
  )
}

afterEach(() => {
  clients.splice(0).forEach((queryClient) => queryClient.clear())
})

describe('useSupplierPurchasesRestWindow', () => {
  it('does not request when supplier is absent, including imperative callbacks', async () => {
    const list = vi.fn()
    const mounted = renderWindow(undefined, api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('disabled'))
    await mounted.result.current.retry()
    await mounted.result.current.refetchActive()

    expect(list).not.toHaveBeenCalled()
  })

  it('reports empty when the active supplier has no purchases', async () => {
    const list = vi.fn().mockResolvedValue({
      purchases: [],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage)
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    expect(mounted.result.current.rows).toEqual([])
    expect(list).toHaveBeenCalledOnce()
  })

  it('reports initial-loading until the supplier page completes', async () => {
    let resolveLoad!: (value: PurchasePage) => void
    const pending = new Promise<PurchasePage>((resolve) => {
      resolveLoad = resolve
    })
    const list = vi.fn().mockReturnValue(pending)
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-loading'),
    )
    resolveLoad(page('loaded'))
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([{ id: 'loaded' }])
  })

  it('reports navigating while a next purchase page is pending', async () => {
    let resolveNext!: (value: PurchasePage) => void
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockReturnValueOnce(
        new Promise<PurchasePage>((resolve) => {
          resolveNext = resolve
        }),
      )
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    mounted.result.current.next()
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))

    expect(mounted.result.current.status).toBe('navigating')
    expect(mounted.result.current.status).not.toBe('initial-loading')
    expect(mounted.result.current.rows).toEqual([{ id: 'first' }])
    expect(mounted.result.current.offset).toBe(20)

    resolveNext(page('next'))
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
  })

  it('keeps the prior purchase rows empty when the supplier changes during navigation', async () => {
    let resolveOldPage!: (value: PurchasePage) => void
    let resolveCurrentPage!: (value: PurchasePage) => void
    const oldPage = new Promise<PurchasePage>((resolve) => {
      resolveOldPage = resolve
    })
    const currentPage = new Promise<PurchasePage>((resolve) => {
      resolveCurrentPage = resolve
    })
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('supplier-1-first', false, true))
      .mockReturnValueOnce(oldPage)
      .mockReturnValueOnce(currentPage)
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    mounted.result.current.next()
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))

    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(3))
    expect(mounted.result.current.status).toBe('initial-loading')
    expect(mounted.result.current.rows).toEqual([])

    resolveCurrentPage(page('supplier-2-first'))
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    resolveOldPage(page('supplier-1-next'))
  })

  it('distinguishes initial and navigation errors and permits active retry/refetch', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('initial'))
      .mockResolvedValueOnce(page('recovered', false, true))
      .mockResolvedValueOnce(page('refetched', false, true))
      .mockRejectedValueOnce(new Error('navigation'))
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-error'),
    )
    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    await mounted.result.current.refetchActive()
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'refetched' }]),
    )
    mounted.result.current.next()
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('navigation-error'),
    )
    expect(list).toHaveBeenCalledTimes(4)
  })

  it('rejects an authoritative reread error and succeeds on retry', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('authoritative'))
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce(page('retried'))
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    await expect(mounted.result.current.refetchActive()).rejects.toThrow(
      'reread failed',
    )
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-error'),
    )

    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([{ id: 'retried' }])
  })

  it('ignores callbacks from a previous supplier lifecycle', async () => {
    let resolveStale!: (value: PurchasePage) => void
    const stale = new Promise<PurchasePage>((resolve) => {
      resolveStale = resolve
    })
    const list = vi
      .fn()
      .mockReturnValueOnce(stale)
      .mockResolvedValueOnce(page('current'))
    const mounted = renderWindow('supplier-1', api(list))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    const staleRetry = mounted.result.current.retry
    const staleRefetch = mounted.result.current.refetchActive

    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'current' }]),
    )
    await staleRetry()
    await staleRefetch()
    expect(list).toHaveBeenCalledTimes(2)
    expect(mounted.result.current.rows).toEqual([{ id: 'current' }])
    resolveStale(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.rows).toEqual([{ id: 'current' }])
  })

  it('aborts the current request and ignores callbacks and completion after unmount', async () => {
    let resolveCurrent!: (value: PurchasePage) => void
    const pending = new Promise<PurchasePage>((resolve) => {
      resolveCurrent = resolve
    })
    const list = vi.fn().mockReturnValue(pending)
    const mounted = renderWindow('supplier-1', api(list))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-loading'),
    )
    const currentSignal = list.mock.calls[0]?.[0].signal
    const currentRetry = mounted.result.current.retry
    const currentRefetch = mounted.result.current.refetchActive
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    mounted.unmount()
    expect(currentSignal?.aborted).toBe(true)
    await currentRetry()
    await currentRefetch()
    expect(list).toHaveBeenCalledOnce()

    resolveCurrent(page('late'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(list).toHaveBeenCalledOnce()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('loads one supplier window and gates next and previous by backend flags', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockResolvedValueOnce(page('next', true, false))
      .mockResolvedValueOnce(page('first', false, true))
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([{ id: 'first' }])
    expect(list).toHaveBeenLastCalledWith({
      supplierId: 'supplier-1',
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
    mounted.result.current.previous()
    expect(list).toHaveBeenCalledTimes(1)
    mounted.result.current.next()
    await waitFor(() => expect(mounted.result.current.offset).toBe(20))
    expect(mounted.result.current.rows).toEqual([{ id: 'next' }])
    mounted.result.current.next()
    expect(list).toHaveBeenCalledTimes(2)
    mounted.result.current.previous()
    await waitFor(() => expect(mounted.result.current.offset).toBe(0))
  })

  it('resets the offset for a changed supplier and never appends another supplier page', async () => {
    const list = vi.fn((input: { supplierId: string; offset: number }) =>
      Promise.resolve(
        page(
          `${input.supplierId}-${input.offset}`,
          input.offset > 0,
          input.offset === 0,
        ),
      ),
    )
    const mounted = renderWindow('supplier-1', api(list))
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    mounted.result.current.next()
    await waitFor(() => expect(mounted.result.current.offset).toBe(20))

    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'supplier-2-0' }]),
    )
    expect(mounted.result.current.offset).toBe(0)
    expect(mounted.result.current.rows).toHaveLength(1)
    expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
      supplierId: 'supplier-2',
      offset: 0,
    })
  })

  it('forwards the Query signal and ignores a stale completion after supplier changes', async () => {
    let resolveStale!: (value: PurchasePage) => void
    const stale = new Promise<PurchasePage>((resolve) => {
      resolveStale = resolve
    })
    const list = vi
      .fn()
      .mockReturnValueOnce(stale)
      .mockResolvedValueOnce(page('current'))
    const mounted = renderWindow('supplier-1', api(list))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    const staleSignal = list.mock.calls[0]?.[0].signal
    expect(staleSignal).toBeInstanceOf(AbortSignal)

    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'current' }]),
    )
    expect(staleSignal?.aborted).toBe(true)
    resolveStale(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.rows).toEqual([{ id: 'current' }])
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSupplierProductsRestWindow } from '../../src/features/compras/useSupplierProductsRestWindow'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import type {
  SupplierProduct,
  SupplierProductPage,
} from '../../src/features/compras/compras.types'

const page = (
  id: string,
  hasPrevious = false,
  hasNext = false,
): SupplierProductPage => ({
  products: [{ id } as SupplierProduct],
  hasPrevious,
  hasNext,
})
const api = (listSupplierProducts = vi.fn()) =>
  ({ listSupplierProducts }) as unknown as ComprasRestApi
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
    ({ id }) => useSupplierProductsRestWindow(rest, id, limit),
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

describe('useSupplierProductsRestWindow', () => {
  it('does not request without a supplier, including retry and refetch', async () => {
    const list = vi.fn()
    const mounted = renderWindow(undefined, api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('disabled'))
    await mounted.result.current.retry()
    await mounted.result.current.refetchActive()

    expect(list).not.toHaveBeenCalled()
  })

  it('reports initial loading, empty, and ready states from the supplier page', async () => {
    let resolveLoad!: (value: SupplierProductPage) => void
    const pending = new Promise<SupplierProductPage>((resolve) => {
      resolveLoad = resolve
    })
    const list = vi.fn().mockReturnValueOnce(pending)
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-loading'),
    )
    resolveLoad({ products: [], hasPrevious: false, hasNext: false })
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    expect(mounted.result.current.rows).toEqual([])

    list.mockResolvedValueOnce(page('ready'))
    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(mounted.result.current.rows).toEqual([{ id: 'ready' }])
  })

  it('reports navigating while a next product page is pending', async () => {
    let resolveNext!: (value: SupplierProductPage) => void
    const list = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockReturnValueOnce(
        new Promise<SupplierProductPage>((resolve) => {
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

  it('keeps the prior product rows empty when the supplier changes during navigation', async () => {
    let resolveOldPage!: (value: SupplierProductPage) => void
    let resolveCurrentPage!: (value: SupplierProductPage) => void
    const oldPage = new Promise<SupplierProductPage>((resolve) => {
      resolveOldPage = resolve
    })
    const currentPage = new Promise<SupplierProductPage>((resolve) => {
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

  it('reports initial and navigation errors and permits active retry/refetch', async () => {
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

  it('gates paging by backend flags, replaces pages, and resets offset by supplier', async () => {
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
    expect(mounted.result.current.rows).toEqual([{ id: 'supplier-1-0' }])
    mounted.result.current.previous()
    expect(list).toHaveBeenCalledTimes(1)
    mounted.result.current.next()
    await waitFor(() => expect(mounted.result.current.offset).toBe(20))
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'supplier-1-20' }]),
    )
    mounted.result.current.next()
    expect(list).toHaveBeenCalledTimes(2)
    mounted.result.current.previous()
    await waitFor(() => expect(mounted.result.current.offset).toBe(0))

    mounted.rerender({ id: 'supplier-2' })
    await waitFor(() =>
      expect(mounted.result.current.rows).toEqual([{ id: 'supplier-2-0' }]),
    )
    expect(mounted.result.current.offset).toBe(0)
    expect(mounted.result.current.rows).toHaveLength(1)
    expect(list.mock.calls.at(-1)?.[0]).toMatchObject({
      supplierId: 'supplier-2',
      limit: 20,
      offset: 0,
    })
  })

  it('forwards the exact Query signal to the explicit supplier request', async () => {
    const list = vi.fn().mockResolvedValue(page('one'))
    const mounted = renderWindow('supplier/one', api(list))

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    const request = list.mock.calls[0]?.[0]
    expect(request).toMatchObject({
      supplierId: 'supplier/one',
      limit: 20,
      offset: 0,
    })
    expect(request?.signal).toBeInstanceOf(AbortSignal)
    expect(list).toHaveBeenCalledOnce()
  })

  it('ignores stale callbacks and completion after supplier change', async () => {
    let resolveStale!: (value: SupplierProductPage) => void
    const stale = new Promise<SupplierProductPage>((resolve) => {
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
    resolveStale(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.rows).toEqual([{ id: 'current' }])
  })

  it('aborts the current request and keeps callbacks safe after isolated unmount', async () => {
    let resolveCurrent!: (value: SupplierProductPage) => void
    const pending = new Promise<SupplierProductPage>((resolve) => {
      resolveCurrent = resolve
    })
    const list = vi.fn().mockReturnValue(pending)
    const mounted = renderWindow('supplier-1', api(list))

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    const signal = list.mock.calls[0]?.[0].signal
    const retry = mounted.result.current.retry
    const refetch = mounted.result.current.refetchActive
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    mounted.unmount()
    expect(signal?.aborted).toBe(true)
    await retry()
    await refetch()
    expect(list).toHaveBeenCalledOnce()
    resolveCurrent(page('late'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(list).toHaveBeenCalledOnce()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

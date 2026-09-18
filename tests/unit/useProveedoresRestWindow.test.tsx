import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProveedoresRestWindow } from '../../src/features/proveedores/useProveedoresRestWindow'
import type { ProveedoresRestApi } from '../../src/features/proveedores/proveedores.api'
import type {
  Supplier,
  SupplierPage,
} from '../../src/features/proveedores/proveedores.types'

const page = (
  id = 'one',
  hasPrevious = false,
  hasNext = false,
): SupplierPage => ({
  suppliers: [
    {
      id,
      tradeName: 'Proveedor ' + id,
      legalName: 'Razon Social ' + id,
      taxIdentifier: '20-00000000-0',
      website: '',
      notes: '',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } satisfies Supplier,
  ],
  hasPrevious,
  hasNext,
})

const api = (listSuppliers = vi.fn().mockResolvedValue(page())) =>
  ({ listSuppliers }) as unknown as ProveedoresRestApi

const clients: QueryClient[] = []
const client = () => {
  const value = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(value)
  return value
}
const renderWindow = (
  supplierApi: ProveedoresRestApi,
  queryClient = client(),
) =>
  renderHook(
    ({ criteria }) => useProveedoresRestWindow(supplierApi, criteria),
    {
      initialProps: {
        criteria: {
          text: '  cable  ',
          scope: 'ACTIVE' as const,
          limit: 20,
        },
      },
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    },
  )

afterEach(() => {
  clients.splice(0).forEach((value) => value.clear())
  vi.useRealTimers()
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
})

describe('useProveedoresRestWindow', () => {
  it('requests one trimmed REST window and replaces it through flag-gated navigation', async () => {
    const listSuppliers = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockResolvedValueOnce(page('next', true))
    const mounted = renderWindow(api(listSuppliers))

    await waitFor(() =>
      expect(mounted.result.current.suppliers).toEqual(page('first').suppliers),
    )
    expect(listSuppliers).toHaveBeenLastCalledWith({
      text: 'cable',
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
    mounted.result.current.next()
    await waitFor(() =>
      expect(listSuppliers).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 20 }),
      ),
    )
    expect(mounted.result.current).toMatchObject({
      suppliers: page('next').suppliers,
      offset: 20,
      hasPrevious: true,
      hasNext: false,
    })
  })

  it('debounces a changed identity, resets offset, and never refetches for focus or reconnect', async () => {
    const listSuppliers = vi.fn().mockResolvedValue(page('window', true, true))
    const mounted = renderWindow(api(listSuppliers))
    await waitFor(() => expect(mounted.result.current.hasNext).toBe(true))
    mounted.result.current.next()
    await waitFor(() => expect(listSuppliers).toHaveBeenCalledTimes(2))
    mounted.rerender({
      criteria: {
        text: ' other ',
        scope: 'INACTIVE',
        limit: 10,
      },
    })
    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
      onlineManager.setOnline(false)
      onlineManager.setOnline(true)
    })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(listSuppliers).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(listSuppliers).toHaveBeenCalledTimes(3))
    expect(listSuppliers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: 'other',
        scope: 'INACTIVE',
        limit: 10,
        offset: 0,
      }),
    )
  })

  it('blocks pending navigation and retries or refetches only the active identity', async () => {
    let resolve!: (value: SupplierPage) => void
    const pending = new Promise<SupplierPage>((done) => {
      resolve = done
    })
    const listSuppliers = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page('first', false, true))
      .mockImplementationOnce(() => pending)
      .mockResolvedValue(page('retry'))
    const mounted = renderWindow(api(listSuppliers))
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-error'),
    )
    expect(listSuppliers).toHaveBeenCalledTimes(1)
    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.hasNext).toBe(true))
    mounted.result.current.next()
    mounted.result.current.next()
    await waitFor(() => expect(listSuppliers).toHaveBeenCalledTimes(3))
    resolve(page('next', true))
    await waitFor(() =>
      expect(mounted.result.current.suppliers).toEqual(page('next').suppliers),
    )
    await mounted.result.current.refetchActive()
    expect(listSuppliers).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 20 }),
    )
  })

  it('drops an old identity response after the debounced current window starts', async () => {
    let resolve!: (value: SupplierPage) => void
    const stale = new Promise<SupplierPage>((done) => {
      resolve = done
    })
    const listSuppliers = vi
      .fn()
      .mockImplementationOnce(() => stale)
      .mockResolvedValueOnce(page('current'))
    const mounted = renderWindow(api(listSuppliers))
    mounted.rerender({
      criteria: {
        text: 'current',
        scope: 'ACTIVE',
        limit: 20,
      },
    })
    await waitFor(() => expect(listSuppliers).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(mounted.result.current.suppliers).toEqual(
        page('current').suppliers,
      ),
    )
    resolve(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.suppliers).toEqual(page('current').suppliers)
  })

  it('keeps data and errors isolated by query-client mounting context', async () => {
    const first = vi.fn().mockResolvedValue(page('first'))
    const second = vi.fn().mockResolvedValue(page('second'))
    const one = renderWindow(api(first))
    const two = renderWindow(api(second))
    await waitFor(() =>
      expect(one.result.current.suppliers).toEqual(page('first').suppliers),
    )
    await waitFor(() =>
      expect(two.result.current.suppliers).toEqual(page('second').suppliers),
    )
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('reports the empty state when the backend page has no suppliers', async () => {
    const listSuppliers = vi
      .fn()
      .mockResolvedValue({ suppliers: [], hasPrevious: false, hasNext: false })
    const mounted = renderWindow(api(listSuppliers))
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    expect(mounted.result.current.suppliers).toEqual([])
  })
})

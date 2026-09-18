import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourcesMasterRestWindow } from '../../src/features/resources-master/useResourcesMasterRestWindow'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  Resource,
  ResourcePage,
} from '../../src/features/resources-master/resourcesMaster.types'

const page = (
  id = 'one',
  hasPrevious = false,
  hasNext = false,
): ResourcePage => ({
  resources: [
    {
      id,
      identityV1: id,
      scope: { classCode: 'CLASS', familyCode: 'FAMILY', typeCode: 'TYPE' },
      naturalUnit: 'unit',
      active: true,
      revision: '1',
      attributes: [],
    } satisfies Resource,
  ],
  hasPrevious,
  hasNext,
})

const api = (listResources = vi.fn().mockResolvedValue(page())) =>
  ({ listResources }) as unknown as ResourcesMasterRestReadApi

const clients: QueryClient[] = []
const client = () => {
  const value = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(value)
  return value
}
const renderWindow = (
  resourceApi: ResourcesMasterRestReadApi,
  queryClient = client(),
) =>
  renderHook(
    ({ criteria }) => useResourcesMasterRestWindow(resourceApi, criteria),
    {
      initialProps: {
        criteria: {
          text: '  cable  ',
          scope: 'ACTIVE' as const,
          classCode: 'CLASS',
          familyCode: 'FAMILY',
          typeCode: 'TYPE',
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

describe('useResourcesMasterRestWindow', () => {
  it('requests one trimmed REST window and replaces it through flag-gated navigation', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValueOnce(page('first', false, true))
      .mockResolvedValueOnce(page('next', true))
    const mounted = renderWindow(api(listResources))

    await waitFor(() =>
      expect(mounted.result.current.resources).toEqual(page('first').resources),
    )
    expect(listResources).toHaveBeenLastCalledWith({
      text: 'cable',
      scope: 'ACTIVE',
      classCode: 'CLASS',
      familyCode: 'FAMILY',
      typeCode: 'TYPE',
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
    mounted.result.current.next()
    await waitFor(() =>
      expect(listResources).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 20 }),
      ),
    )
    expect(mounted.result.current).toMatchObject({
      resources: page('next').resources,
      offset: 20,
      hasPrevious: true,
      hasNext: false,
    })
  })

  it('debounces a changed identity, resets offset, and never refetches for focus or reconnect', async () => {
    const listResources = vi.fn().mockResolvedValue(page('window', true, true))
    const mounted = renderWindow(api(listResources))
    await waitFor(() => expect(mounted.result.current.hasNext).toBe(true))
    mounted.result.current.next()
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    mounted.rerender({
      criteria: {
        text: ' other ',
        scope: 'INACTIVE',
        classCode: 'NEXT',
        familyCode: 'FAMILY',
        typeCode: 'TYPE',
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
    expect(listResources).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(3))
    expect(listResources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: 'other',
        scope: 'INACTIVE',
        classCode: 'NEXT',
        limit: 10,
        offset: 0,
      }),
    )
  })

  it('blocks pending navigation and retries or refetches only the active identity', async () => {
    let resolve!: (value: ResourcePage) => void
    const pending = new Promise<ResourcePage>((done) => {
      resolve = done
    })
    const listResources = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page('first', false, true))
      .mockImplementationOnce(() => pending)
      .mockResolvedValue(page('retry'))
    const mounted = renderWindow(api(listResources))
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('initial-error'),
    )
    expect(listResources).toHaveBeenCalledTimes(1)
    await mounted.result.current.retry()
    await waitFor(() => expect(mounted.result.current.hasNext).toBe(true))
    mounted.result.current.next()
    mounted.result.current.next()
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(3))
    resolve(page('next', true))
    await waitFor(() =>
      expect(mounted.result.current.resources).toEqual(page('next').resources),
    )
    await mounted.result.current.refetchActive()
    expect(listResources).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 20 }),
    )
  })

  it('drops an old identity response after the debounced current window starts', async () => {
    let resolve!: (value: ResourcePage) => void
    const stale = new Promise<ResourcePage>((done) => {
      resolve = done
    })
    const listResources = vi
      .fn()
      .mockImplementationOnce(() => stale)
      .mockResolvedValueOnce(page('current'))
    const mounted = renderWindow(api(listResources))
    mounted.rerender({
      criteria: {
        text: 'current',
        scope: 'ACTIVE',
        classCode: 'CLASS',
        familyCode: 'FAMILY',
        typeCode: 'TYPE',
        limit: 20,
      },
    })
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(mounted.result.current.resources).toEqual(
        page('current').resources,
      ),
    )
    resolve(page('stale'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.result.current.resources).toEqual(page('current').resources)
  })

  it('keeps data and errors isolated by query-client mounting context', async () => {
    const first = vi.fn().mockResolvedValue(page('first'))
    const second = vi.fn().mockResolvedValue(page('second'))
    const one = renderWindow(api(first))
    const two = renderWindow(api(second))
    await waitFor(() =>
      expect(one.result.current.resources).toEqual(page('first').resources),
    )
    await waitFor(() =>
      expect(two.result.current.resources).toEqual(page('second').resources),
    )
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })
})

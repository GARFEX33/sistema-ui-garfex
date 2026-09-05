import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourcesMasterListQuery } from '../../src/features/resources-master/useResourcesMasterListQuery'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceListPage,
  ResourceSummary,
} from '../../src/features/resources-master/resourcesMaster.types'

const item = (id: string, nombre = id): ResourceSummary => ({
  id,
  nombre,
  identificadorTecnico: id,
  tipoRecursoId: 'type',
  unidadId: 'unit',
  activo: true,
  revision: 1,
  classificationStatus: { state: 'EFFECTIVE', reasons: [] },
})

const page = (
  items: ResourceSummary[] = [item('a')],
  continueCursor = 'done',
  isDone = true,
): ResourceListPage<ResourceSummary> => ({
  page: items,
  continueCursor,
  isDone,
})

const api = (overrides: Partial<ResourcesMasterApi> = {}) =>
  ({
    listResources: vi.fn(async () => page()),
    searchResources: vi.fn(async () => page()),
    ...overrides,
  }) as ResourcesMasterApi

const clients: QueryClient[] = []
const renderList = (
  client: QueryClient,
  resourceApi: ResourcesMasterApi,
  criteria: Parameters<typeof useResourcesMasterListQuery>[1] = {
    searchText: '',
  },
) =>
  renderHook(
    ({ activeCriteria }) =>
      useResourcesMasterListQuery(resourceApi, activeCriteria),
    {
      initialProps: { activeCriteria: criteria },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

const controlled = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const newClient = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(client)
  return client
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
})

describe('useResourcesMasterListQuery', () => {
  it('uses the canonical key and matching search payload with the deepest filter', async () => {
    const resourceApi = api()
    const client = newClient()
    renderList(client, resourceApi, {
      searchText: '  cable  ',
      classId: 'class',
      familyId: 'family',
      typeId: 'type',
    })

    await waitFor(() =>
      expect(resourceApi.searchResources).toHaveBeenCalledTimes(1),
    )
    expect(resourceApi.searchResources).toHaveBeenCalledWith({
      lifecycle: 'ACTIVE',
      pageSize: 20,
      cursor: undefined,
      tipoRecursoId: 'type',
      searchText: 'cable',
    })
    expect(
      client.getQueryCache().find({
        queryKey: ['resources-master', 'list', 'cable', 'type', 'type'],
      }),
    ).toBeDefined()
    expect(resourceApi.listResources).not.toHaveBeenCalled()
  })

  it('uses list input, isolated caches, and no Convex transport', async () => {
    const firstApi = api()
    const secondApi = api()
    renderList(newClient(), firstApi)
    renderList(newClient(), secondApi)

    await waitFor(() => expect(firstApi.listResources).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(secondApi.listResources).toHaveBeenCalledTimes(1),
    )
    expect(firstApi.listResources).toHaveBeenCalledWith({
      lifecycle: 'ACTIVE',
      pageSize: 20,
      cursor: undefined,
    })
    expect(
      readFileSync(
        'src/features/resources-master/useResourcesMasterListQuery.ts',
        'utf8',
      ),
    ).not.toMatch(/from ['"]convex(?:\/|['"])/)
  })

  it('retries an initial fetch once and exposes only the semantic error projection', async () => {
    const listResources = vi.fn().mockRejectedValue(new Error('remote detail'))
    const result = renderList(newClient(), api({ listResources }))

    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(result.result.current).toMatchObject({
        items: [],
        status: 'initial-error',
        isDone: false,
      }),
    )
  })

  it('flattens and deduplicates the first page in order while retaining continuation state', async () => {
    const result = renderList(
      newClient(),
      api({
        listResources: vi
          .fn()
          .mockResolvedValue(
            page([item('a'), item('a', 'duplicate'), item('b')], 'next', false),
          ),
      }),
    )

    await waitFor(() =>
      expect(result.result.current).toMatchObject({
        items: [item('a'), item('b')],
        status: 'ready',
        isDone: false,
      }),
    )
  })

  it('confirms empty only from a done page and never refetches on focus, reconnect, or remount', async () => {
    const listResources = vi.fn().mockResolvedValue(page([], 'done', true))
    const client = newClient()
    const mounted = renderList(client, api({ listResources }))

    await waitFor(() =>
      expect(mounted.result.current).toMatchObject({
        items: [],
        status: 'empty',
        isDone: true,
      }),
    )
    try {
      act(() => {
        focusManager.setFocused(false)
        focusManager.setFocused(true)
        onlineManager.setOnline(false)
        onlineManager.setOnline(true)
      })
      mounted.unmount()
      renderList(client, api({ listResources }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(listResources).toHaveBeenCalledTimes(1)
    } finally {
      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
    }
  })

  it('keeps manual initial retries scoped through overlapping key-finally races', async () => {
    const aManual = controlled<ResourceListPage<ResourceSummary>>()
    const bManual = controlled<ResourceListPage<ResourceSummary>>()
    const calls = { a: 0, b: 0 }
    const listResources = vi.fn(({ claseRecursoId }) => {
      const key = claseRecursoId === 'a' ? 'a' : 'b'
      calls[key] += 1
      if (calls[key] < 3) return Promise.reject(new Error(`${key} automatic`))
      return key === 'a' ? aManual.promise : bManual.promise
    })
    const mounted = renderList(newClient(), api({ listResources }), {
      searchText: '',
      classId: 'a',
    })

    await waitFor(() => expect(calls.a).toBe(2))
    const retryA = mounted.result.current.retry()
    await waitFor(() => expect(calls.a).toBe(3))
    mounted.rerender({ activeCriteria: { searchText: '', classId: 'b' } })
    await waitFor(() => expect(calls.b).toBe(2))
    const retryB = mounted.result.current.retry()
    await waitFor(() => expect(calls.b).toBe(3))

    aManual.resolve(page())
    await retryA
    bManual.reject(new Error('b manual'))
    await retryB
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls.b).toBe(3)
  })

  it('makes a captured action inert after unmount', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValue(page([item('first')], 'next', false))
    const mounted = renderList(newClient(), api({ listResources }))

    await waitFor(() => expect(mounted.result.current.isDone).toBe(false))
    const loadMore = mounted.result.current.loadMore
    mounted.unmount()

    await expect(loadMore()).resolves.toBeUndefined()
    expect(listResources).toHaveBeenCalledTimes(1)
  })

  it('activates actions only after their key is committed', async () => {
    const listResources = vi.fn(({ claseRecursoId, cursor }) => {
      const key = claseRecursoId ?? 'all'
      return Promise.resolve(
        cursor === undefined
          ? page([item(`${key}-first`)], 'next', false)
          : page([item(`${key}-next`)]),
      )
    })
    const mounted = renderList(newClient(), api({ listResources }), {
      searchText: '',
      classId: 'a',
    })

    await waitFor(() => expect(mounted.result.current.isDone).toBe(false))
    const loadMoreA = mounted.result.current.loadMore
    mounted.rerender({ activeCriteria: { searchText: '', classId: 'b' } })
    await waitFor(() => expect(mounted.result.current.isDone).toBe(false))

    await expect(loadMoreA()).resolves.toBeUndefined()
    expect(listResources).toHaveBeenCalledTimes(2)
    await expect(mounted.result.current.loadMore()).resolves.toBeUndefined()
    expect(listResources).toHaveBeenLastCalledWith({
      lifecycle: 'ACTIVE',
      pageSize: 20,
      cursor: 'next',
      claseRecursoId: 'b',
    })
  })

  it('does not let an old continuation finally release the active key continuation', async () => {
    const aContinuation = controlled<ResourceListPage<ResourceSummary>>()
    const bContinuation = controlled<ResourceListPage<ResourceSummary>>()
    const listResources = vi.fn(({ claseRecursoId, cursor }) => {
      if (cursor === undefined)
        return Promise.resolve(
          page([item(`${claseRecursoId}-first`)], 'next', false),
        )
      return claseRecursoId === 'a'
        ? aContinuation.promise
        : bContinuation.promise
    })
    const mounted = renderList(newClient(), api({ listResources }), {
      searchText: '',
      classId: 'a',
    })

    await waitFor(() => expect(mounted.result.current.isDone).toBe(false))
    const aLoadMore = mounted.result.current.loadMore()
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    mounted.rerender({ activeCriteria: { searchText: '', classId: 'b' } })
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(3))
    const bLoadMore = mounted.result.current.loadMore()
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(4))

    aContinuation.resolve(page([item('a-next')], 'done', true))
    await aLoadMore
    expect(mounted.result.current.loadMore()).toBe(bLoadMore)
    expect(listResources).toHaveBeenCalledTimes(4)
    bContinuation.resolve(page([item('b-next')], 'done', true))
    await bLoadMore
  })

  it('shares a continuation between observers of the same canonical key', async () => {
    const continuation = controlled<ResourceListPage<ResourceSummary>>()
    const listResources = vi
      .fn()
      .mockResolvedValueOnce(page([item('first')], 'next', false))
      .mockImplementationOnce(() => continuation.promise)
    const client = newClient()
    const first = renderList(client, api({ listResources }))
    const second = renderList(client, api({ listResources }))

    await waitFor(() => expect(first.result.current.isDone).toBe(false))
    const firstLoadMore = first.result.current.loadMore()
    const secondLoadMore = second.result.current.loadMore()
    expect(secondLoadMore).toBe(firstLoadMore)
    expect(listResources).toHaveBeenCalledTimes(2)
    continuation.resolve(page([item('second')]))
    await firstLoadMore
  })

  it('suppresses duplicate continuations, retains pages after failure, and retries its cursor once', async () => {
    const continuation = controlled<ResourceListPage<ResourceSummary>>()
    const listResources = vi
      .fn()
      .mockResolvedValueOnce(page([item('first')], 'next', false))
      .mockRejectedValueOnce(new Error('continuation'))
      .mockImplementationOnce(() => continuation.promise)
    const mounted = renderList(newClient(), api({ listResources }))

    await waitFor(() => expect(mounted.result.current.isDone).toBe(false))
    const first = mounted.result.current.loadMore()
    expect(mounted.result.current.loadMore()).toBe(first)
    await expect(first).resolves.toBeUndefined()
    await waitFor(() =>
      expect(mounted.result.current.items).toEqual([item('first')]),
    )
    const retry = mounted.result.current.retry()
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(3))
    expect(listResources.mock.calls.slice(1)).toEqual([
      [{ lifecycle: 'ACTIVE', pageSize: 20, cursor: 'next' }],
      [{ lifecycle: 'ACTIVE', pageSize: 20, cursor: 'next' }],
    ])
    continuation.resolve(page([item('second')]))
    await expect(retry).resolves.toBeUndefined()
    await waitFor(() =>
      expect(mounted.result.current.items).toEqual([
        item('first'),
        item('second'),
      ]),
    )
  })

  it('returns only semantic void actions and refetches only the mounted observer key', async () => {
    const client = newClient()
    client.setQueryData(['resources-master', 'list', 'other', 'all', null], {
      pages: [page([item('other')])],
      pageParams: [undefined],
    })
    const listResources = vi.fn().mockResolvedValue(page())
    const mounted = renderList(client, api({ listResources }))

    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(1))
    expect(Object.keys(mounted.result.current).sort()).toEqual([
      'isDone',
      'items',
      'loadMore',
      'refetchActive',
      'retry',
      'status',
    ])
    await expect(
      mounted.result.current.refetchActive(),
    ).resolves.toBeUndefined()
    expect(listResources).toHaveBeenCalledTimes(2)
    expect(
      client.getQueryData(['resources-master', 'list', 'other', 'all', null]),
    ).toEqual({ pages: [page([item('other')])], pageParams: [undefined] })
  })
})

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
  renderHook(() => useResourcesMasterListQuery(resourceApi, criteria), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })

const newClient = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(client)
  return client
}

afterEach(() => clients.splice(0).forEach((client) => client.clear()))

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
      expect(result.result.current).toEqual({
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
      expect(result.result.current).toEqual({
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
      expect(mounted.result.current).toEqual({
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
      onlineManager.setOnline(undefined)
    }
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  Resource,
  ResourcePage,
} from '../../src/features/resources-master/resourcesMaster.types'
import { ResourcePicker } from '../../src/features/compras/ResourcePicker'

const resource = (id: string): Resource => ({
  id,
  identityV1: `RAW-${id}`,
  scope: { classCode: 'C', familyCode: 'F', typeCode: 'T' },
  naturalUnit: 'pieza',
  active: true,
  revision: '1',
  attributes: [],
})

const renderPicker = (
  api: ResourcesMasterRestReadApi,
  refreshSignal?: number,
  selected: Resource | null = null,
  onSelect = vi.fn(),
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ResourcePicker
          api={api}
          selected={selected}
          disabled={false}
          onSelect={onSelect}
          refreshSignal={refreshSignal}
        />
      </QueryClientProvider>,
    ),
    queryClient,
  }
}

afterEach(() => vi.restoreAllMocks())

describe('ResourcePicker', () => {
  it('refetches the active current page when explicitly signaled', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValueOnce({
        resources: [resource('resource-1')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
      .mockResolvedValueOnce({
        resources: [resource('resource-1'), resource('resource-2')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
    const api = {
      listResources,
      getTypeEffectiveAttributes: vi.fn().mockResolvedValue({
        typeCode: 'T',
        attributes: [],
      }),
    } as unknown as ResourcesMasterRestReadApi

    const mounted = renderPicker(api, 0)
    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())
    mounted.rerender(
      <QueryClientProvider client={mounted.queryClient}>
        <ResourcePicker
          api={api}
          selected={null}
          disabled={false}
          onSelect={vi.fn()}
          refreshSignal={1}
        />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    expect(listResources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scope: 'ACTIVE',
        limit: 20,
        offset: 0,
      }),
    )
    expect(
      screen.getAllByRole('option', { name: /T Unidad: pieza/ }),
    ).toHaveLength(2)
  })

  it('does not clear a selected resource when it is absent from the refreshed bounded page', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValueOnce({
        resources: [resource('resource-1')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
      .mockResolvedValueOnce({
        resources: [resource('resource-2')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
    const api = {
      listResources,
      getTypeEffectiveAttributes: vi.fn().mockResolvedValue({
        typeCode: 'T',
        attributes: [],
      }),
    } as unknown as ResourcesMasterRestReadApi
    const onSelect = vi.fn()
    const selected = resource('resource-created')
    const mounted = renderPicker(api, 0, selected, onSelect)

    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())
    mounted.rerender(
      <QueryClientProvider client={mounted.queryClient}>
        <ResourcePicker
          api={api}
          selected={selected}
          disabled={false}
          onSelect={onSelect}
          refreshSignal={1}
        />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does not refetch when the optional refresh signal is absent', async () => {
    const listResources = vi.fn().mockResolvedValue({
      resources: [resource('resource-1')],
      hasPrevious: false,
      hasNext: false,
    } satisfies ResourcePage)
    const api = {
      listResources,
      getTypeEffectiveAttributes: vi.fn().mockResolvedValue({
        typeCode: 'T',
        attributes: [],
      }),
    } as unknown as ResourcesMasterRestReadApi

    const mounted = renderPicker(api)
    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())
    mounted.rerender(
      <QueryClientProvider client={mounted.queryClient}>
        <ResourcePicker
          api={api}
          selected={null}
          disabled={false}
          onSelect={vi.fn()}
        />
      </QueryClientProvider>,
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(listResources).toHaveBeenCalledOnce()
  })
})

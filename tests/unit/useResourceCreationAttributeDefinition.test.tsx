import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourceCreationAttributeDefinition } from '../../src/features/resources-master/useResourceCreationAttributeDefinition'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceAttributeDefinition,
  ResourceResolvedCreationAssignment,
} from '../../src/features/resources-master/resourcesMaster.types'

const assignment = (
  id = 'assignment-1',
  definitionId = 'definition-1',
): ResourceResolvedCreationAssignment => ({
  asignacionAtributoId: id,
  definicionAtributoId: definitionId,
  aplicabilidadResuelta: 'REQUIRED',
  participaIdentidad: false,
  orden: 1,
  effectiveReasons: [],
})

const definition = (
  id = 'definition-1',
  overrides: Partial<ResourceAttributeDefinition> = {},
): ResourceAttributeDefinition => ({
  id,
  clave: id,
  nombre: id,
  tipoDato: 'OPCION',
  modoCaptura: 'SELECCION',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  ...overrides,
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const clients: QueryClient[] = []
const renderDriver = (
  current: ResourceResolvedCreationAssignment | null,
  getAttributeDefinition: ResourcesMasterApi['getAttributeDefinition'],
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  const mounted = renderHook(
    ({ assignment: currentAssignment }) =>
      useResourceCreationAttributeDefinition({
        api: { getAttributeDefinition },
        assignment: currentAssignment,
      }),
    {
      initialProps: { assignment: current },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  return { ...mounted, client }
}

afterEach(() => clients.splice(0).forEach((client) => client.clear()))

describe('useResourceCreationAttributeDefinition', () => {
  it('stays idle without an assignment and makes no request', async () => {
    const getAttributeDefinition = vi.fn()
    const mounted = renderDriver(null, getAttributeDefinition)

    await act(async () => {})

    expect(mounted.result.current).toEqual({
      status: 'idle',
      retry: expect.any(Function),
    })
    expect(getAttributeDefinition).not.toHaveBeenCalled()
  })

  it('loads only the current exact definition and exposes selection readiness', async () => {
    const response = deferred<ResourceAttributeDefinition | null>()
    const getAttributeDefinition = vi.fn().mockReturnValue(response.promise)
    const current = assignment()
    const mounted = renderDriver(current, getAttributeDefinition)

    expect(mounted.result.current.status).toBe('loading')
    await waitFor(() =>
      expect(getAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'definition-1',
      }),
    )
    expect(
      mounted.client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toContainEqual([
      'resources-master',
      'creation-attribute-definition',
      'assignment-1',
      'definition-1',
    ])

    await act(async () => response.resolve(definition()))

    await waitFor(() =>
      expect(mounted.result.current).toMatchObject({
        status: 'selection-ready',
        definition: definition(),
      }),
    )
  })

  it.each([
    null,
    definition('other-definition'),
    definition('definition-1', { activo: false }),
    definition('definition-1', { effective: false }),
  ])(
    'fails closed as unavailable for invalid definition data',
    async (result) => {
      const getAttributeDefinition = vi.fn().mockResolvedValue(result)
      const mounted = renderDriver(assignment(), getAttributeDefinition)

      await waitFor(() =>
        expect(mounted.result.current).toEqual({
          status: 'unavailable',
          retry: expect.any(Function),
        }),
      )
    },
  )

  it('exposes LIBRE as unsupported without allowed-value behavior', async () => {
    const libre = definition('definition-1', { modoCaptura: 'LIBRE' })
    const getAttributeDefinition = vi.fn().mockResolvedValue(libre)
    const mounted = renderDriver(assignment(), getAttributeDefinition)

    await waitFor(() =>
      expect(mounted.result.current).toMatchObject({
        status: 'unsupported-free-capture',
        definition: libre,
      }),
    )
  })

  it('retries only a current transport error', async () => {
    const getAttributeDefinition = vi
      .fn()
      .mockRejectedValueOnce(new Error('transport failed'))
      .mockResolvedValueOnce(definition())
    const mounted = renderDriver(assignment(), getAttributeDefinition)

    await waitFor(() => expect(mounted.result.current.status).toBe('error'))
    await act(async () => mounted.result.current.retry())

    await waitFor(() =>
      expect(mounted.result.current.status).toBe('selection-ready'),
    )
    expect(getAttributeDefinition).toHaveBeenCalledTimes(2)
  })

  it('hides a switched assignment immediately and rejects its deferred response', async () => {
    const first = deferred<ResourceAttributeDefinition | null>()
    const second = deferred<ResourceAttributeDefinition | null>()
    const getAttributeDefinition = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const mounted = renderDriver(assignment(), getAttributeDefinition)

    await waitFor(() => expect(getAttributeDefinition).toHaveBeenCalledTimes(1))
    mounted.rerender({ assignment: assignment('assignment-2', 'definition-2') })

    expect(mounted.result.current.status).toBe('loading')
    await waitFor(() => expect(getAttributeDefinition).toHaveBeenCalledTimes(2))
    await act(async () => first.resolve(definition()))
    expect(mounted.result.current.status).toBe('loading')

    const current = definition('definition-2')
    await act(async () => second.resolve(current))
    await waitFor(() =>
      expect(mounted.result.current).toMatchObject({
        status: 'selection-ready',
        definition: current,
      }),
    )
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourceCreationCreate } from '../../src/features/resources-master/useResourceCreationCreate'
import type { CreationState } from '../../src/features/resources-master/resourceCreation.model'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceCreationEvaluation,
  ResourceCreationResult,
} from '../../src/features/resources-master/resourcesMaster.types'

const evaluation = (
  status: ResourceCreationEvaluation['status'] = 'VALID',
) => ({
  status,
  valid: status === 'VALID',
  catalogFingerprint: 'fingerprint',
  nombre: null,
  identificadorTecnico: null,
  asignaciones: [],
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
})

const state = (): CreationState =>
  ({
    stage: { kind: 'review-pending' },
    openGeneration: 1,
    evaluationRequestToken: null,
    evaluationOwnershipIdentity: null,
    draft: {
      hierarchy: {
        classItem: { id: 'class' },
        familyItem: { id: 'family' },
        typeItem: { id: 'type' },
      },
      unitId: 'unit',
      selectionBuckets: {
        active: { assignment: 'value' },
        omitted: new Set(),
        suspended: {},
      },
      authoritativeEvaluation: evaluation(),
      catalogFingerprint: 'fingerprint',
      revision: 1,
    },
  }) as CreationState

const result = (disposition: ResourceCreationResult['disposition']) =>
  disposition === 'CREATED'
    ? {
        disposition,
        item: {
          id: 'resource',
          tipoRecursoId: 'type',
          unidadId: 'unit',
          identificadorTecnico: 'RESOURCE',
          nombre: 'Resource',
          activo: true,
          revision: 1,
          classificationStatus: { state: 'EFFECTIVE', reasons: [] },
        },
      }
    : {
        disposition,
        evaluation: evaluation(
          disposition === 'CATALOG_CHANGED' ? 'VALID' : disposition,
        ),
      }

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const clients: QueryClient[] = []
const renderDriver = (
  initial: CreationState,
  createResourceFromSelections: ResourcesMasterApi['createResourceFromSelections'],
) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  clients.push(client)
  const mounted = renderHook(
    ({ current }) =>
      useResourceCreationCreate({
        api: { createResourceFromSelections },
        ownership: { kind: 'GLOBAL' },
        state: current,
      }),
    {
      initialProps: { current: initial },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  return { ...mounted, client }
}

afterEach(() => clients.splice(0).forEach((client) => client.clear()))

describe('useResourceCreationCreate', () => {
  it('blocks invalid authority without transport', () => {
    const createResourceFromSelections = vi.fn()
    const mounted = renderDriver(
      { ...state(), stage: { kind: 'attributes' } },
      createResourceFromSelections,
    )

    expect(mounted.result.current.create()).toBe(false)
    expect(createResourceFromSelections).not.toHaveBeenCalled()
    expect(mounted.result.current.status).toBe('idle')
  })

  it('single-flights one frozen exact request', async () => {
    const response = deferred<ResourceCreationResult>()
    const createResourceFromSelections = vi.fn(() => response.promise)
    const mounted = renderDriver(state(), createResourceFromSelections)

    act(() => {
      expect(mounted.result.current.create()).toBe(true)
      expect(mounted.result.current.create()).toBe(false)
    })
    await waitFor(() =>
      expect(createResourceFromSelections).toHaveBeenCalledTimes(1),
    )
    expect(createResourceFromSelections).toHaveBeenCalledWith({
      claseRecursoId: 'class',
      familiaRecursoId: 'family',
      tipoRecursoId: 'type',
      unidadId: 'unit',
      expectedCatalogFingerprint: 'fingerprint',
      selecciones: [
        { asignacionAtributoId: 'assignment', valorPermitidoId: 'value' },
      ],
      ownership: { kind: 'GLOBAL' },
    })
    expect(Object.isFrozen(createResourceFromSelections.mock.calls[0][0])).toBe(
      true,
    )

    await act(async () => response.resolve(result('CREATED')))
    await waitFor(() => expect(mounted.result.current.status).toBe('result'))
  })

  it.each(['CREATED', 'CATALOG_CHANGED', 'INCOMPLETE', 'INVALID'] as const)(
    'accepts a current %s result without presenting it',
    async (disposition) => {
      const accepted = result(disposition)
      const createResourceFromSelections = vi.fn().mockResolvedValue(accepted)
      const mounted = renderDriver(state(), createResourceFromSelections)
      const removeQueries = vi.spyOn(mounted.client, 'removeQueries')

      act(() => expect(mounted.result.current.create()).toBe(true))
      await waitFor(() =>
        expect(mounted.result.current).toMatchObject({
          status: 'result',
          result: accepted,
        }),
      )
      expect(mounted.result.current.create()).toBe(false)
      if (disposition === 'CATALOG_CHANGED')
        expect(removeQueries.mock.calls).toEqual([
          [{ queryKey: ['resources-master', 'creation-attribute-definition'] }],
          [{ queryKey: ['resources-master', 'creation-allowed-values'] }],
        ])
      else expect(removeQueries).not.toHaveBeenCalled()
      expect(createResourceFromSelections).toHaveBeenCalledTimes(1)
    },
  )

  it.each(['success', 'error'] as const)(
    'ignores stale %s settlement',
    async (kind) => {
      const response = deferred<ResourceCreationResult>()
      const createResourceFromSelections = vi.fn(() => response.promise)
      const mounted = renderDriver(state(), createResourceFromSelections)
      const removeQueries = vi.spyOn(mounted.client, 'removeQueries')

      act(() => expect(mounted.result.current.create()).toBe(true))
      mounted.rerender({
        current: { ...state(), draft: { ...state().draft, revision: 2 } },
      })
      await act(async () =>
        kind === 'success'
          ? response.resolve(result('CATALOG_CHANGED'))
          : response.reject(new Error('backend secret')),
      )
      await waitFor(() => expect(mounted.result.current.status).toBe('idle'))
      expect(mounted.result.current).not.toHaveProperty('result')
      expect(removeQueries).not.toHaveBeenCalled()
    },
  )

  it('suppresses a stale CREATED settlement before it can become a success result', async () => {
    const response = deferred<ResourceCreationResult>()
    const createResourceFromSelections = vi.fn(() => response.promise)
    const mounted = renderDriver(state(), createResourceFromSelections)

    act(() => expect(mounted.result.current.create()).toBe(true))
    mounted.rerender({
      current: { ...state(), draft: { ...state().draft, revision: 2 } },
    })
    await act(async () => response.resolve(result('CREATED')))

    await waitFor(() => expect(mounted.result.current.status).toBe('idle'))
    expect(mounted.result.current).not.toHaveProperty('result')
    expect(createResourceFromSelections).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'an unknown adapter result',
      new Error('Invalid resources master response'),
    ],
    [
      'a malformed adapter result',
      new Error('Invalid resources master response'),
    ],
    ['a transport rejection', new Error('transport down')],
  ])(
    'fails closed for %s and permits one explicit current retry',
    async (_, failure) => {
      const createResourceFromSelections = vi
        .fn()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(result('CREATED'))
      const mounted = renderDriver(state(), createResourceFromSelections)

      act(() => expect(mounted.result.current.create()).toBe(true))
      await waitFor(() => expect(mounted.result.current.status).toBe('error'))
      expect(mounted.result.current).not.toHaveProperty('result')
      expect(createResourceFromSelections).toHaveBeenCalledTimes(1)
      expect(mounted.client.getMutationCache().getAll()[0].options.retry).toBe(
        false,
      )

      act(() => expect(mounted.result.current.create()).toBe(true))
      await waitFor(() =>
        expect(mounted.result.current).toMatchObject({
          status: 'result',
          result: result('CREATED'),
        }),
      )
      expect(createResourceFromSelections).toHaveBeenCalledTimes(2)
    },
  )

  it('exposes generic current errors and retries only after an explicit invocation', async () => {
    const createResourceFromSelections = vi
      .fn()
      .mockRejectedValueOnce(new Error('backend secret'))
      .mockResolvedValueOnce(result('INVALID'))
    const mounted = renderDriver(state(), createResourceFromSelections)

    act(() => expect(mounted.result.current.create()).toBe(true))
    await waitFor(() => expect(mounted.result.current.status).toBe('error'))
    expect(mounted.result.current).not.toHaveProperty('result')
    expect(createResourceFromSelections).toHaveBeenCalledTimes(1)
    expect(mounted.client.getMutationCache().getAll()[0].options.retry).toBe(
      false,
    )

    act(() => expect(mounted.result.current.create()).toBe(true))
    await waitFor(() => expect(mounted.result.current.status).toBe('result'))
    expect(createResourceFromSelections).toHaveBeenCalledTimes(2)
  })
})

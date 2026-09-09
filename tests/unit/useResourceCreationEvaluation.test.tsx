import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourceCreationEvaluation } from '../../src/features/resources-master/useResourceCreationEvaluation'
import { asResourceCreationEvaluationRequestToken } from '../../src/features/resources-master/resourceCreation.evaluationLease'
import {
  createInitialCreationState,
  resourceCreationReducer,
  type CreationEvent,
  type CreationState,
} from '../../src/features/resources-master/resourceCreation.model'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceCreationEvaluation,
  ResourceCreationEvaluationOwnership,
} from '../../src/features/resources-master/resourcesMaster.types'

const item = (id: string) => ({
  id,
  clave: id,
  nombre: id,
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
})

const evaluation = (
  asignaciones: ResourceCreationEvaluation['asignaciones'] = [],
): ResourceCreationEvaluation => ({
  status: 'INCOMPLETE',
  valid: false,
  catalogFingerprint: 'fingerprint',
  nombre: null,
  identificadorTecnico: null,
  asignaciones,
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
})

const evaluationPrefix = {
  classItem: item('class'),
  familyItem: item('family'),
  typeItem: item('type'),
  depth: 3 as const,
}

const stateWithUnit = () =>
  resourceCreationReducer(
    resourceCreationReducer(createInitialCreationState(), {
      type: 'OPEN',
      prefix: evaluationPrefix,
    }),
    { type: 'CONFIRM_UNIT', unitId: 'unit' },
  )

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const clients: QueryClient[] = []
const renderDriver = (
  initial: CreationState,
  evaluateResourceCreation: ResourcesMasterApi['evaluateResourceCreation'],
  ownership: ResourceCreationEvaluationOwnership | null = { kind: 'GLOBAL' },
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  return renderHook(
    () => {
      const [state, setState] = useState(initial)
      const [allowedValuesByDefinition, setAllowedValuesByDefinition] =
        useState({})
      const driver = useResourceCreationEvaluation({
        api: { evaluateResourceCreation },
        ownership,
        state,
        setState,
        allowedValuesByDefinition,
      })
      return {
        state,
        driver,
        dispatch: (event: CreationEvent) =>
          setState((current) => resourceCreationReducer(current, event)),
        setAllowedValuesByDefinition,
      }
    },
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
}

afterEach(() => clients.splice(0).forEach((client) => client.clear()))

describe('useResourceCreationEvaluation', () => {
  it('does not request without complete context or ownership and clears authority', async () => {
    const evaluateResourceCreation = vi.fn()
    const incomplete = resourceCreationReducer(createInitialCreationState(), {
      type: 'OPEN',
      prefix: {
        classItem: item('class'),
        familyItem: item('family'),
        typeItem: item('type'),
        depth: 3,
      },
    })
    const mounted = renderDriver(
      {
        ...incomplete,
        draft: {
          ...incomplete.draft,
          authoritativeEvaluation: evaluation(),
          catalogFingerprint: 'old-fingerprint',
        },
        evaluationRequestToken: asResourceCreationEvaluationRequestToken('old'),
        evaluationOwnershipIdentity: { kind: 'GLOBAL' },
      },
      evaluateResourceCreation,
      null,
    )

    await act(async () => {})

    expect(mounted.result.current.driver.status).toBe('idle')
    expect(evaluateResourceCreation).not.toHaveBeenCalled()
    expect(mounted.result.current.state.evaluationRequestToken).toBeNull()
    expect(mounted.result.current.state.evaluationOwnershipIdentity).toBeNull()
    expect(
      mounted.result.current.state.draft.authoritativeEvaluation,
    ).toBeNull()
    expect(mounted.result.current.state.draft.catalogFingerprint).toBeNull()
  })

  it('adopts the current request and rejects an old response after a selection change', async () => {
    const first = deferred<ResourceCreationEvaluation>()
    const second = deferred<ResourceCreationEvaluation>()
    const evaluateResourceCreation = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const initial = resourceCreationReducer(createInitialCreationState(), {
      type: 'OPEN',
      prefix: {
        classItem: item('class'),
        familyItem: item('family'),
        typeItem: item('type'),
        depth: 3,
      },
    })
    const mounted = renderDriver(initial, evaluateResourceCreation)

    await act(async () => {})
    expect(evaluateResourceCreation).not.toHaveBeenCalled()
    act(() =>
      mounted.result.current.dispatch({ type: 'CONFIRM_UNIT', unitId: 'unit' }),
    )
    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(1),
    )
    expect(mounted.result.current.driver.status).toBe('loading')
    expect(evaluateResourceCreation).toHaveBeenLastCalledWith({
      claseRecursoId: 'class',
      familiaRecursoId: 'family',
      tipoRecursoId: 'type',
      unidadId: 'unit',
      selecciones: [],
      ownership: { kind: 'GLOBAL' },
    })

    act(() =>
      mounted.result.current.dispatch({
        type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
        assignmentId: 'assignment',
        allowedValueId: 'value',
      }),
    )
    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(2),
    )
    await act(async () => first.resolve(evaluation()))
    expect(
      mounted.result.current.state.draft.authoritativeEvaluation,
    ).toBeNull()

    const current = evaluation([
      {
        asignacionAtributoId: 'assignment',
        definicionAtributoId: 'definition',
        aplicabilidadResuelta: 'OPTIONAL',
        participaIdentidad: false,
        orden: 1,
        effectiveReasons: [],
        selectedValueId: 'value',
      },
    ])
    await act(async () => second.resolve(current))
    await waitFor(() =>
      expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
        current,
      ),
    )
    expect(mounted.result.current.driver.status).toBe('ready')
  })

  it.each(['FORBIDDEN', 'NOT_APPLICABLE'] as const)(
    'suspends active selections when authoritative applicability is %s',
    async (aplicabilidadResuelta) => {
      const forbidden = deferred<ResourceCreationEvaluation>()
      const replacement = deferred<ResourceCreationEvaluation>()
      const evaluateResourceCreation = vi
        .fn()
        .mockReturnValueOnce(forbidden.promise)
        .mockReturnValueOnce(replacement.promise)
      const initial = resourceCreationReducer(stateWithUnit(), {
        type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
        assignmentId: 'assignment',
        allowedValueId: 'value',
      })
      const mounted = renderDriver(initial, evaluateResourceCreation)
      const revision = initial.draft.revision

      await waitFor(() =>
        expect(evaluateResourceCreation).toHaveBeenCalledTimes(1),
      )
      await act(async () =>
        forbidden.resolve(
          evaluation([
            {
              asignacionAtributoId: 'assignment',
              definicionAtributoId: 'definition',
              aplicabilidadResuelta,
              participaIdentidad: false,
              orden: 1,
              effectiveReasons: [],
              selectedValueId: 'value',
            },
          ]),
        ),
      )

      await waitFor(() =>
        expect(evaluateResourceCreation).toHaveBeenCalledTimes(2),
      )
      expect(mounted.result.current.state.draft.revision).toBe(revision + 1)
      expect(
        mounted.result.current.state.draft.authoritativeEvaluation,
      ).toBeNull()
      expect(evaluateResourceCreation.mock.calls[1][0].selecciones).toEqual([])
      expect(
        mounted.result.current.state.draft.selectionBuckets.suspended,
      ).toEqual({ assignment: 'value' })

      const final = evaluation()
      await act(async () => replacement.resolve(final))
      await waitFor(() =>
        expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
          final,
        ),
      )
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(2)
    },
  )

  it('reconciles adopted authority when allowed-value knowledge changes', async () => {
    const forbidden = deferred<ResourceCreationEvaluation>()
    const applicable = deferred<ResourceCreationEvaluation>()
    const restored = deferred<ResourceCreationEvaluation>()
    const evaluateResourceCreation = vi
      .fn()
      .mockReturnValueOnce(forbidden.promise)
      .mockReturnValueOnce(applicable.promise)
      .mockReturnValueOnce(restored.promise)
    const initial = resourceCreationReducer(stateWithUnit(), {
      type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
      assignmentId: 'assignment',
      allowedValueId: 'value',
    })
    const mounted = renderDriver(initial, evaluateResourceCreation)
    const assignment = (aplicabilidadResuelta: 'FORBIDDEN' | 'OPTIONAL') =>
      evaluation([
        {
          asignacionAtributoId: 'assignment',
          definicionAtributoId: 'definition',
          aplicabilidadResuelta,
          participaIdentidad: false,
          orden: 1,
          effectiveReasons: [],
          selectedValueId: 'value',
        },
      ])
    const allowedValue = {
      id: 'value',
      definicionAtributoId: 'definition',
      clave: 'value',
      valor: { kind: 'TEXTO' as const, value: 'value' },
      nombre: 'Value',
      orden: 1,
      activo: true,
      revision: 1,
      effective: true,
      effectiveReasons: [],
    }

    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(1),
    )
    await act(async () => forbidden.resolve(assignment('FORBIDDEN')))
    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(2),
    )
    await act(async () => applicable.resolve(assignment('OPTIONAL')))
    await waitFor(() =>
      expect(
        mounted.result.current.state.draft.authoritativeEvaluation,
      ).toBeTruthy(),
    )
    const revision = mounted.result.current.state.draft.revision

    act(() =>
      mounted.result.current.setAllowedValuesByDefinition({
        definition: { status: 'PARTIAL', values: [] },
      }),
    )
    await act(async () => {})
    expect(mounted.result.current.state.draft.revision).toBe(revision)
    expect(evaluateResourceCreation).toHaveBeenCalledTimes(2)

    act(() =>
      mounted.result.current.setAllowedValuesByDefinition({
        definition: { status: 'EXHAUSTED', values: [] },
      }),
    )
    await act(async () => {})
    expect(
      mounted.result.current.state.draft.selectionBuckets.suspended,
    ).toEqual({
      assignment: 'value',
    })
    expect(evaluateResourceCreation).toHaveBeenCalledTimes(2)

    act(() =>
      mounted.result.current.setAllowedValuesByDefinition({
        definition: { status: 'PARTIAL', values: [allowedValue] },
      }),
    )
    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(3),
    )
    expect(mounted.result.current.state.draft.revision).toBe(revision + 1)
    expect(
      mounted.result.current.state.draft.authoritativeEvaluation,
    ).toBeNull()
    expect(evaluateResourceCreation.mock.calls[2][0].selecciones).toEqual([
      { asignacionAtributoId: 'assignment', valorPermitidoId: 'value' },
    ])

    const backendInvalid = deferred<ResourceCreationEvaluation>()
    const reevaluated = deferred<ResourceCreationEvaluation>()
    const invalidEvaluation = vi
      .fn()
      .mockReturnValueOnce(backendInvalid.promise)
      .mockReturnValueOnce(reevaluated.promise)
    const invalidDriver = renderDriver(initial, invalidEvaluation)
    await waitFor(() => expect(invalidEvaluation).toHaveBeenCalledTimes(1))
    await act(async () =>
      backendInvalid.resolve({
        ...assignment('OPTIONAL'),
        status: 'INVALID',
        seleccionesInvalidas: ['assignment'],
      }),
    )
    await waitFor(() => expect(invalidEvaluation).toHaveBeenCalledTimes(2))
    await act(async () => reevaluated.resolve(assignment('OPTIONAL')))
    await waitFor(() =>
      expect(invalidDriver.result.current.driver.status).toBe('ready'),
    )

    act(() =>
      invalidDriver.result.current.setAllowedValuesByDefinition({
        definition: { status: 'PARTIAL', values: [allowedValue] },
      }),
    )
    await act(async () => {})

    expect(
      invalidDriver.result.current.state.draft.selectionBuckets,
    ).toMatchObject({
      active: {},
      suspended: { assignment: 'value' },
    })
    expect(invalidEvaluation).toHaveBeenCalledTimes(2)
  })

  it('exposes transport rejection and retries one current request before adoption', async () => {
    const accepted = evaluation()
    const retried = deferred<ResourceCreationEvaluation>()
    const evaluateResourceCreation = vi
      .fn()
      .mockRejectedValueOnce(new Error('transport failed'))
      .mockReturnValueOnce(retried.promise)
    const mounted = renderDriver(stateWithUnit(), evaluateResourceCreation)

    await waitFor(() =>
      expect(mounted.result.current.driver.status).toBe('error'),
    )
    expect(
      mounted.result.current.state.draft.authoritativeEvaluation,
    ).toBeNull()
    expect(evaluateResourceCreation).toHaveBeenCalledTimes(1)

    act(() => void mounted.result.current.driver.retry())
    await waitFor(() =>
      expect(mounted.result.current.driver.status).toBe('loading'),
    )
    await act(async () => retried.resolve(accepted))
    await waitFor(() =>
      expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
        accepted,
      ),
    )
    expect(mounted.result.current.driver.status).toBe('ready')
    expect(evaluateResourceCreation).toHaveBeenCalledTimes(2)
  })

  it('reopens identical context with a new request rather than prior-open cache data', async () => {
    const first = deferred<ResourceCreationEvaluation>()
    const second = deferred<ResourceCreationEvaluation>()
    const evaluateResourceCreation = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const mounted = renderDriver(stateWithUnit(), evaluateResourceCreation)
    const priorGeneration = mounted.result.current.state.openGeneration

    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(1),
    )
    const priorOpen = evaluation()
    await act(async () => first.resolve(priorOpen))
    await waitFor(() =>
      expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
        priorOpen,
      ),
    )

    act(() => {
      mounted.result.current.dispatch({
        type: 'OPEN',
        prefix: evaluationPrefix,
      })
      mounted.result.current.dispatch({ type: 'CONFIRM_UNIT', unitId: 'unit' })
    })
    expect(mounted.result.current.state.openGeneration).toBe(
      priorGeneration + 1,
    )
    await waitFor(() =>
      expect(evaluateResourceCreation).toHaveBeenCalledTimes(2),
    )
    expect(evaluateResourceCreation.mock.calls[1][0]).toEqual(
      evaluateResourceCreation.mock.calls[0][0],
    )
    expect(
      mounted.result.current.state.draft.authoritativeEvaluation,
    ).toBeNull()

    const reopened = evaluation()
    await act(async () => second.resolve(reopened))
    await waitFor(() =>
      expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
        reopened,
      ),
    )
  })
})

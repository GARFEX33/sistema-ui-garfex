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
      const driver = useResourceCreationEvaluation({
        api: { evaluateResourceCreation },
        ownership,
        state,
        setState,
      })
      return {
        state,
        driver,
        dispatch: (event: CreationEvent) =>
          setState((current) => resourceCreationReducer(current, event)),
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
  })
})

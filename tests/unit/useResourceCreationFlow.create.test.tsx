import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import type { ResourceCreationEvaluationDriverOptions } from '../../src/features/resources-master/useResourceCreationEvaluation'
import { useResourceCreationFlow } from '../../src/features/resources-master/useResourceCreationFlow'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceCreationEvaluation,
  ResourceCreationResult,
} from '../../src/features/resources-master/resourcesMaster.types'

const create = vi.fn()
const allowedValuesKnowledge = {
  definition: { status: 'EXHAUSTED' as const, values: [] },
}

let evaluationStatus: 'loading' | 'ready' = 'loading'
let shouldAdoptEvaluation = true
let createProjection:
  | { status: 'idle'; create: typeof create }
  | {
      status: 'result'
      result: ResourceCreationResult
      create: typeof create
    } = {
  status: 'idle',
  create,
}

const {
  useResourceCreationCreateSpy,
  useResourceCreationEvaluationSpy,
  useResourceCreationAttributeQueriesSpy,
} = vi.hoisted(() => ({
  useResourceCreationCreateSpy: vi.fn(),
  useResourceCreationEvaluationSpy: vi.fn(),
  useResourceCreationAttributeQueriesSpy: vi.fn(),
}))

vi.mock(
  '../../src/features/resources-master/useResourceCreationCreate',
  () => ({
    useResourceCreationCreate: useResourceCreationCreateSpy,
  }),
)
vi.mock(
  '../../src/features/resources-master/useResourceCreationEvaluation',
  () => ({ useResourceCreationEvaluation: useResourceCreationEvaluationSpy }),
)
vi.mock(
  '../../src/features/resources-master/useResourceCreationAttributeQueries',
  () => ({
    useResourceCreationAttributeQueries: useResourceCreationAttributeQueriesSpy,
  }),
)

const evaluation = (
  status: ResourceCreationEvaluation['status'] = 'VALID',
  catalogFingerprint = 'fingerprint',
): ResourceCreationEvaluation => ({
  status,
  valid: status === 'VALID',
  catalogFingerprint,
  nombre: null,
  identificadorTecnico: null,
  asignaciones: [
    {
      asignacionAtributoId: 'assignment',
      definicionAtributoId: 'definition',
      aplicabilidadResuelta: 'REQUIRED',
      selectedValueId: asAllowedValueId('value'),
    },
  ],
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
})

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
          classificationStatus: { state: 'EFFECTIVE' as const, reasons: [] },
        },
      }
    : {
        disposition,
        evaluation: evaluation(
          disposition === 'CATALOG_CHANGED' ? 'VALID' : disposition,
          disposition === 'CATALOG_CHANGED'
            ? 'fingerprint-next'
            : 'fingerprint',
        ),
      }

const clients: QueryClient[] = []

beforeEach(() => {
  evaluationStatus = 'loading'
  shouldAdoptEvaluation = true
  createProjection = { status: 'idle', create }
  create.mockReset()
  useResourceCreationCreateSpy.mockImplementation((options) =>
    options.state.stage.kind === 'review-pending'
      ? createProjection
      : { status: 'idle', create },
  )
  useResourceCreationAttributeQueriesSpy.mockImplementation(() => ({
    step: { kind: 'complete' },
    definition: { status: 'idle' },
    allowedValues: {},
    allowedValuesKnowledge,
  }))
  useResourceCreationEvaluationSpy.mockImplementation(
    (options: ResourceCreationEvaluationDriverOptions) => {
      const adopted = useRef(false)
      useEffect(() => {
        if (!shouldAdoptEvaluation || adopted.current) return
        adopted.current = true
        options.setState((current) => ({
          ...current,
          stage: { kind: 'review-pending' },
          draft: {
            ...current.draft,
            authoritativeEvaluation: evaluation(),
            catalogFingerprint: 'fingerprint',
            selectionBuckets: {
              active: { assignment: asAllowedValueId('value') },
              omitted: new Set(),
              suspended: {},
            },
          },
        }))
      }, [options])
      return { status: evaluationStatus, retry: () => Promise.resolve() }
    },
  )
})

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  vi.clearAllMocks()
})

const renderFlow = () => {
  const client = new QueryClient()
  clients.push(client)
  const mounted = renderHook(
    () => useResourceCreationFlow({} as ResourcesMasterApi, { kind: 'GLOBAL' }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  return mounted
}

describe('useResourceCreationFlow create disposition authority', () => {
  it('integrates one creation driver and exposes its narrow projection', () => {
    shouldAdoptEvaluation = false
    const { result } = renderFlow()

    expect(useResourceCreationCreateSpy).toHaveBeenCalledTimes(1)
    expect(useResourceCreationCreateSpy).toHaveBeenCalledWith({
      api: {},
      ownership: { kind: 'GLOBAL' },
      state: result.current.state,
    })
    expect(result.current.creation).toEqual({ status: 'idle', create })
  })

  it('leaves a CREATED result exposed without adopting it', async () => {
    const mounted = renderFlow()
    await waitFor(() =>
      expect(mounted.result.current.state.stage).toEqual({
        kind: 'review-pending',
      }),
    )
    const before = mounted.result.current.state
    const created = result('CREATED')
    createProjection = { status: 'result', result: created, create }

    act(() => mounted.rerender())
    await waitFor(() =>
      expect(mounted.result.current.creation).toEqual({
        status: 'result',
        result: created,
        create,
      }),
    )
    expect(mounted.result.current.state).toBe(before)
  })

  it.each(['CATALOG_CHANGED', 'INCOMPLETE', 'INVALID'] as const)(
    'adopts a current %s evaluation and reconciled buckets through the reducer',
    async (disposition) => {
      const mounted = renderFlow()
      await waitFor(() =>
        expect(mounted.result.current.state.stage).toEqual({
          kind: 'review-pending',
        }),
      )
      const revision = mounted.result.current.state.draft.revision
      const returned = result(disposition)
      createProjection = { status: 'result', result: returned, create }

      act(() => mounted.rerender())
      await waitFor(() =>
        expect(mounted.result.current.state.stage).toEqual({
          kind: 'attributes',
        }),
      )
      expect(mounted.result.current.state.draft.revision).toBe(revision + 1)
      expect(mounted.result.current.state.draft.authoritativeEvaluation).toBe(
        returned.evaluation,
      )
      expect(
        mounted.result.current.state.draft.selectionBuckets.active,
      ).toEqual({
        assignment: asAllowedValueId('value'),
      })
      expect(mounted.result.current.state.draft.catalogFingerprint).toBe(
        disposition === 'CATALOG_CHANGED' ? 'fingerprint-next' : 'fingerprint',
      )
    },
  )
})

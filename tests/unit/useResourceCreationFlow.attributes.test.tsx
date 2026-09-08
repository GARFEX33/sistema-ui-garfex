import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import type { ResourceCreationEvaluationDriverOptions } from '../../src/features/resources-master/useResourceCreationEvaluation'
import { useResourceCreationFlow } from '../../src/features/resources-master/useResourceCreationFlow'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { ResourceCreationEvaluation } from '../../src/features/resources-master/resourcesMaster.types'

const allowedValuesKnowledge = {
  definition: { status: 'PARTIAL' as const, values: [] },
}

let adoptedEvaluation: ResourceCreationEvaluation | null = null
let attributeStep: { kind: 'complete' | 'unavailable' } = {
  kind: 'unavailable',
}

type EvaluationDriver = (options: ResourceCreationEvaluationDriverOptions) => {
  status: 'idle'
  retry: () => Promise<void>
}

const {
  useResourceCreationEvaluationSpy,
  useResourceCreationAttributeQueriesSpy,
} = vi.hoisted(() => ({
  useResourceCreationEvaluationSpy: vi.fn<EvaluationDriver>(),
  useResourceCreationAttributeQueriesSpy: vi.fn(),
}))

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
  status: ResourceCreationEvaluation['status'],
): ResourceCreationEvaluation => ({
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

beforeEach(() => {
  adoptedEvaluation = null
  attributeStep = { kind: 'unavailable' }
  useResourceCreationAttributeQueriesSpy.mockImplementation(() => ({
    step: attributeStep,
    definition: { status: 'idle' },
    allowedValues: {},
    allowedValuesKnowledge,
  }))
  useResourceCreationEvaluationSpy.mockImplementation((options) => {
    const adopted = useRef(false)
    useEffect(() => {
      if (adoptedEvaluation === null || adopted.current) return
      adopted.current = true
      options.setState((current) => ({
        ...current,
        stage: { kind: 'attributes' },
        draft: {
          ...current.draft,
          authoritativeEvaluation: adoptedEvaluation,
        },
      }))
    }, [options])
    return { status: 'idle', retry: () => Promise.resolve() }
  })
})

afterEach(() => vi.clearAllMocks())

describe('useResourceCreationFlow attribute authority', () => {
  it('provides current buckets to attribute queries and its knowledge to one evaluation driver', () => {
    const { result } = renderHook(() =>
      useResourceCreationFlow({} as ResourcesMasterApi, { kind: 'GLOBAL' }),
    )

    expect(useResourceCreationAttributeQueriesSpy).toHaveBeenLastCalledWith({
      api: {},
      evaluation: result.current.state.draft.authoritativeEvaluation,
      selectionBuckets: result.current.state.draft.selectionBuckets,
    })
    expect(useResourceCreationEvaluationSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        allowedValuesByDefinition: allowedValuesKnowledge,
      }),
    )
  })

  it('confirms and omits exact allowed-value assignment IDs through the reducer', async () => {
    adoptedEvaluation = evaluation('INCOMPLETE')
    const { result } = renderHook(() =>
      useResourceCreationFlow({} as ResourcesMasterApi, { kind: 'GLOBAL' }),
    )
    await waitFor(() =>
      expect(result.current.state.draft.authoritativeEvaluation).toBe(
        adoptedEvaluation,
      ),
    )

    act(() => result.current.confirmAllowedValue('assignment', 'value'))
    expect(result.current.state.draft.selectionBuckets.active).toEqual({
      assignment: asAllowedValueId('value'),
    })
    expect(result.current.state.draft.authoritativeEvaluation).toBeNull()

    act(() => result.current.omitAllowedValue('assignment'))
    expect(
      result.current.state.draft.selectionBuckets.omitted.has('assignment'),
    ).toBe(true)
  })

  it.each([
    ['VALID', 'review-pending'],
    ['INVALID', 'attributes'],
  ] as const)(
    'completes only when the model accepts a %s authoritative evaluation',
    async (status, stage) => {
      adoptedEvaluation = evaluation(status)
      attributeStep = { kind: 'complete' }
      const { result } = renderHook(() =>
        useResourceCreationFlow({} as ResourcesMasterApi, { kind: 'GLOBAL' }),
      )

      await waitFor(() => expect(result.current.state.stage.kind).toBe(stage))
    },
  )
})

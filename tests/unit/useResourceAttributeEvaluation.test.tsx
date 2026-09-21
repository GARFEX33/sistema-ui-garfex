import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourceAttributeEvaluation } from '../../src/features/resources-master/useResourceAttributeEvaluation'
import type { ResourceAttributeEvaluationApi } from '../../src/features/resources-master/resourceAttributeEvaluation.api'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'
import type { ResourceAttribute } from '../../src/features/resources-master/resourcesMaster.types'

const request = {
  classCode: 'MATERIAL',
  familyCode: 'CABLE',
  typeCode: 'CABLE_CONTROL',
}

const baseline: EffectiveAttribute[] = [
  {
    characteristic: {
      code: 'insulation',
      name: 'Aislamiento',
      valueType: 'CONTROLLED_OPTION',
    },
    effectiveMode: 'REQUIRED',
    identityParticipates: false,
    notApplicable: false,
    position: 0,
    hasPosition: true,
    options: [{ code: 'THW', label: 'THW-LS' }],
    source: { level: 'TYPE', code: 'CABLE_CONTROL' },
    rules: [],
  },
]

const evaluated: EffectiveAttribute[] = [
  {
    ...baseline[0],
    effectiveMode: 'FORBIDDEN',
    notApplicable: true,
  },
]

const confirmed: ResourceAttribute[] = [
  { code: 'insulation', value: { kind: 'CONTROLLED_OPTION', value: 'THW' } },
]

const api = (
  evaluateAttributes: ResourceAttributeEvaluationApi['evaluateAttributes'],
): Pick<ResourceAttributeEvaluationApi, 'evaluateAttributes'> => ({
  evaluateAttributes,
})

describe('useResourceAttributeEvaluation', () => {
  it('stays on the baseline, idle, until at least one attribute is confirmed', () => {
    const evaluateAttributes = vi.fn()
    const { result } = renderHook(() =>
      useResourceAttributeEvaluation(
        api(evaluateAttributes),
        request,
        [],
        baseline,
      ),
    )

    expect(result.current).toEqual({ attributes: baseline, status: 'idle' })
    expect(evaluateAttributes).not.toHaveBeenCalled()
  })

  it("evaluates once a value is confirmed and adopts Core's recomputed attributes", async () => {
    const evaluateAttributes = vi.fn(async () => ({
      typeCode: request.typeCode,
      attributes: evaluated,
    }))
    const { result, rerender } = renderHook(
      ({ values }: { values: ResourceAttribute[] }) =>
        useResourceAttributeEvaluation(
          api(evaluateAttributes),
          request,
          values,
          baseline,
        ),
      { initialProps: { values: [] } },
    )

    rerender({ values: confirmed })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.attributes).toEqual(evaluated)
    expect(evaluateAttributes).toHaveBeenCalledWith({
      ...request,
      values: confirmed,
    })
  })

  it('keeps the last known attributes and reports error on a failed evaluation', async () => {
    const evaluateAttributes = vi.fn(async () => {
      throw new Error('offline')
    })
    const { result, rerender } = renderHook(
      ({ values }: { values: ResourceAttribute[] }) =>
        useResourceAttributeEvaluation(
          api(evaluateAttributes),
          request,
          values,
          baseline,
        ),
      { initialProps: { values: [] } },
    )

    rerender({ values: confirmed })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.attributes).toEqual(baseline)
  })

  it('resets to the new baseline when the request context changes and nothing is confirmed yet', () => {
    const evaluateAttributes = vi.fn()
    const { result, rerender } = renderHook(
      ({ ctx, base }: { ctx: typeof request; base: EffectiveAttribute[] }) =>
        useResourceAttributeEvaluation(api(evaluateAttributes), ctx, [], base),
      { initialProps: { ctx: request, base: baseline } },
    )

    const nextRequest = { ...request, typeCode: 'OTHER' }
    rerender({ ctx: nextRequest, base: evaluated })

    expect(result.current).toEqual({ attributes: evaluated, status: 'idle' })
  })
})

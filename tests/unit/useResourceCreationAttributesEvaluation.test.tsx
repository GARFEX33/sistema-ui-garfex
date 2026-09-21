import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourceCreationAttributesEvaluation } from '../../src/features/resources-master/useResourceCreationAttributesEvaluation'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

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
  { ...baseline[0], effectiveMode: 'REQUIRED' },
]

vi.mock(
  '../../src/features/resources-master/resourceAttributeEvaluation.api',
  () => ({
    createResourceAttributeEvaluationApi: () => ({
      evaluateAttributes: async () => ({
        typeCode: request.typeCode,
        attributes: evaluated,
      }),
    }),
  }),
)

describe('useResourceCreationAttributesEvaluation', () => {
  it('projects confirmed raw form values and calls the evaluation adapter once one is present', async () => {
    const { result, rerender } = renderHook(
      ({ values }: { values: Record<string, unknown> }) =>
        useResourceCreationAttributesEvaluation(request, baseline, values),
      { initialProps: { values: {} } },
    )

    expect(result.current).toEqual({ attributes: baseline, status: 'idle' })

    rerender({ values: { insulation: 'THW' } })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.attributes).toEqual(evaluated)
  })
})

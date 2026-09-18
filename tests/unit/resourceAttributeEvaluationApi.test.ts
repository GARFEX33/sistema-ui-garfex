import { describe, expect, it, vi } from 'vitest'
import { createResourceAttributeEvaluationApi } from '../../src/features/resources-master/resourceAttributeEvaluation.api'
import type { ResourceAttribute } from '../../src/features/resources-master/resourcesMaster.types'

const values: ResourceAttribute[] = [
  { code: 'insulation', value: { kind: 'CONTROLLED_OPTION', value: 'THW' } },
]

const input = {
  classCode: 'MATERIAL & BASE',
  familyCode: 'CONDUCTORES/1',
  typeCode: 'CABLE / 1',
  values,
}

const response = {
  typeCode: input.typeCode,
  attributes: [
    {
      characteristic: {
        code: 'color',
        name: 'Color',
        valueType: 'CONTROLLED_OPTION',
      },
      effectiveMode: 'FORBIDDEN',
      identityParticipates: false,
      notApplicable: true,
      position: 0,
      hasPosition: false,
      options: [],
      source: { level: 'TYPE', code: input.typeCode },
      rules: [],
    },
  ],
}

describe('resource attribute evaluation REST API', () => {
  it('POSTs the encoded contextual endpoint with classCode/familyCode as query params and only { values } as body', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => response })
    const api = createResourceAttributeEvaluationApi(fetch)

    await expect(api.evaluateAttributes(input)).resolves.toEqual(response)
    expect(fetch).toHaveBeenCalledWith(
      '/v1/types/CABLE%20%2F%201/attributes/evaluate?classCode=MATERIAL+%26+BASE&familyCode=CONDUCTORES%2F1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
        signal: undefined,
      },
    )
  })

  it('fails closed before any HTTP call for incomplete context', async () => {
    const fetch = vi.fn()
    const api = createResourceAttributeEvaluationApi(fetch)

    await expect(
      api.evaluateAttributes({ ...input, familyCode: '' }),
    ).rejects.toThrow('Invalid resource attribute evaluation response')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a response for a different typeCode without returning it', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...response, typeCode: 'OTHER' }),
    })
    const api = createResourceAttributeEvaluationApi(fetch)

    // The shared public parser (also used by the GET baseline) owns this
    // rejection and its message; the adapter's own bad() only guards the
    // pre-flight incomplete-context check above.
    await expect(api.evaluateAttributes(input)).rejects.toThrow(
      'Invalid catalog type effective attributes response',
    )
  })

  it('surfaces HTTP, network, and JSON failures without a fallback', async () => {
    const fetch = vi.fn()
    const api = createResourceAttributeEvaluationApi(fetch)

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Rejected' }),
    })
    await expect(api.evaluateAttributes(input)).rejects.toThrow('Rejected')
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.evaluateAttributes(input)).rejects.toThrow('offline')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('JSON')
      },
    })
    await expect(api.evaluateAttributes(input)).rejects.toThrow('JSON')
  })
})

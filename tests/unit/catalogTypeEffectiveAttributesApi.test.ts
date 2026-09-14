import { describe, expect, it, vi } from 'vitest'
import { createCatalogTypeEffectiveAttributesApi } from '../../src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.api'

const input = {
  classCode: 'MATERIAL & BASE',
  familyCode: 'CONDUCTORES/1',
  typeCode: 'CABLE / 1',
}

const response = {
  typeCode: input.typeCode,
  attributes: [
    {
      characteristic: {
        code: 'durable',
        name: 'Durable',
        valueType: 'BOOLEAN',
        dimension: 'logical',
      },
      effectiveMode: 'CONDITIONAL',
      identityParticipates: true,
      notApplicable: false,
      position: 4,
      hasPosition: true,
      optionSetCode: 'CABLE_OPTIONS',
      options: [{ code: 'COPPER', label: 'Copper' }],
      source: { level: 'TYPE', code: input.typeCode },
      rules: [
        {
          attributeCode: 'conductive',
          equals: { kind: 'BOOLEAN', value: true },
          mode: 'FORBIDDEN',
          identityParticipates: false,
          notApplicable: true,
          active: true,
        },
      ],
    },
  ],
}

const clone = <Value>(value: Value): Value => structuredClone(value)

describe('catalog type effective attributes REST API', () => {
  it('requests the encoded contextual endpoint in deterministic order and preserves Core values', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => response })
    const api = createCatalogTypeEffectiveAttributesApi(fetch)

    await expect(api.getEffectiveAttributes(input)).resolves.toEqual(response)
    expect(fetch).toHaveBeenCalledWith(
      '/v1/types/CABLE%20%2F%201/attributes/effective?classCode=MATERIAL+%26+BASE&familyCode=CONDUCTORES%2F1',
      { signal: undefined },
    )
  })

  it('fails closed before HTTP for incomplete context and for an invalid complete response', async () => {
    const fetch = vi.fn()
    const api = createCatalogTypeEffectiveAttributesApi(fetch)

    await expect(
      api.getEffectiveAttributes({ ...input, familyCode: '' }),
    ).rejects.toThrow('Invalid catalog type effective attributes response')
    expect(fetch).not.toHaveBeenCalled()

    const invalid = clone(response)
    invalid.typeCode = 'OTHER'
    fetch.mockResolvedValueOnce({ ok: true, json: async () => invalid })
    await expect(api.getEffectiveAttributes(input)).rejects.toThrow(
      'Invalid catalog type effective attributes response',
    )
  })

  it('rejects every invalid effective field without returning a partial response', async () => {
    const fetch = vi.fn()
    const api = createCatalogTypeEffectiveAttributesApi(fetch)
    const invalidCases: Array<(value: Record<string, unknown>) => void> = [
      (value) => Reflect.set(value.characteristic as object, 'code', ''),
      (value) => Reflect.set(value.characteristic as object, 'name', ''),
      (value) =>
        Reflect.set(value.characteristic as object, 'valueType', 'TEXT'),
      (value) => Reflect.set(value.characteristic as object, 'dimension', null),
      (value) => Reflect.set(value, 'effectiveMode', 'ACTIVE'),
      (value) => Reflect.set(value, 'identityParticipates', 'true'),
      (value) => Reflect.set(value, 'notApplicable', 0),
      (value) => Reflect.set(value, 'position', 1.5),
      (value) => Reflect.set(value, 'hasPosition', 'false'),
      (value) => Reflect.set(value, 'optionSetCode', ''),
      (value) => Reflect.set(value.source as object, 'level', 'CLASS'),
      (value) => Reflect.set(value.source as object, 'code', ''),
      (value) =>
        Reflect.set(value, 'rules', [
          { ...response.attributes[0].rules[0], equals: { kind: 'TEXT' } },
        ]),
    ]

    for (const mutate of invalidCases) {
      const invalid = clone(response) as unknown as {
        typeCode: string
        attributes: Record<string, unknown>[]
      }
      mutate(invalid.attributes[0])
      fetch.mockResolvedValueOnce({ ok: true, json: async () => invalid })
      await expect(api.getEffectiveAttributes(input)).rejects.toThrow(
        'Invalid catalog type effective attributes response',
      )
    }
  })

  it('rejects invalid required options without returning a partial response', async () => {
    const fetch = vi.fn()
    const api = createCatalogTypeEffectiveAttributesApi(fetch)
    const invalidCases: Array<(value: Record<string, unknown>) => void> = [
      (value) => Reflect.deleteProperty(value, 'options'),
      (value) => Reflect.set(value, 'options', null),
      (value) => Reflect.set(value, 'options', {}),
      (value) => Reflect.set(value, 'options', [{ code: 1, label: 'Copper' }]),
      (value) =>
        Reflect.set(value, 'options', [{ code: 'COPPER', label: null }]),
      (value) =>
        Reflect.set(value, 'options', [
          { code: 'COPPER', label: 'Copper', extra: true },
        ]),
      (value) =>
        Reflect.set(value, 'options', [
          { code: 'COPPER', label: 'Copper' },
          { code: 'ALUMINUM', label: 2 },
        ]),
    ]

    for (const mutate of invalidCases) {
      const invalid = clone(response) as unknown as {
        typeCode: string
        attributes: Record<string, unknown>[]
      }
      mutate(invalid.attributes[0])
      fetch.mockResolvedValueOnce({ ok: true, json: async () => invalid })
      await expect(api.getEffectiveAttributes(input)).rejects.toThrow(
        'Invalid catalog type effective attributes response',
      )
    }
  })

  it('accepts Core empty arrays and both documented source levels without evaluating rules', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ typeCode: input.typeCode, attributes: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...response,
          attributes: [
            {
              ...response.attributes[0],
              characteristic: {
                ...response.attributes[0].characteristic,
                valueType: 'CONTROLLED_TEXT',
              },
              hasPosition: false,
              options: [],
              source: { level: 'FAMILY', code: input.familyCode },
            },
          ],
        }),
      })
    const api = createCatalogTypeEffectiveAttributesApi(fetch)

    await expect(api.getEffectiveAttributes(input)).resolves.toEqual({
      typeCode: input.typeCode,
      attributes: [],
    })
    await expect(api.getEffectiveAttributes(input)).resolves.toMatchObject({
      attributes: [
        {
          hasPosition: false,
          source: { level: 'FAMILY', code: input.familyCode },
          effectiveMode: 'CONDITIONAL',
        },
      ],
    })
  })

  it('surfaces HTTP, network, and JSON failures without a fallback', async () => {
    const fetch = vi.fn()
    const api = createCatalogTypeEffectiveAttributesApi(fetch)

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Rejected' }),
    })
    await expect(api.getEffectiveAttributes(input)).rejects.toThrow('Rejected')
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.getEffectiveAttributes(input)).rejects.toThrow('offline')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('JSON')
      },
    })
    await expect(api.getEffectiveAttributes(input)).rejects.toThrow('JSON')
  })
})

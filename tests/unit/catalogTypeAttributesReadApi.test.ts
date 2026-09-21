import { describe, expect, it, vi } from 'vitest'
import { createCatalogTypeAttributesReadApi } from '../../src/features/catalog-hierarchy/catalogTypeAttributesRead.api'

const input = {
  classCode: 'MATERIAL',
  familyCode: 'CONDUCTORES',
  typeCode: 'CABLE / 1',
  offset: 20,
  limit: 10,
}
const reference = (kind: string, code: string) => ({
  kind: 'REFERENCE',
  reference: { kind, id: '1', code },
})
const page = {
  records: [
    {
      kind: 'APLICABILIDAD',
      id: 'app-1',
      revision: 'rev-1',
      active: true,
      values: {
        class: reference('CLASE', input.classCode),
        family: reference('FAMILIA', input.familyCode),
        characteristic: reference('CARACTERISTICA', 'durable'),
        type: reference('TIPO', input.typeCode),
        mode: { kind: 'ENUM', value: 'OPTIONAL' },
      },
      rules: [],
    },
  ],
  hasPrevious: true,
  hasNext: false,
}

describe('catalog type attributes REST API', () => {
  it('uses only the encoded type window query and returns validated REST flags', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => page })
    const api = createCatalogTypeAttributesReadApi(fetch)

    await expect(api.listDirectApplicabilities(input)).resolves.toMatchObject({
      hasPrevious: true,
      hasNext: false,
      records: [{ mode: 'OPTIONAL' }],
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/APLICABILIDAD?typeCode=CABLE+%2F+1&offset=20&limit=10',
      { signal: undefined },
    )
  })

  it('fails closed for invalid input, HTTP, network, and JSON responses', async () => {
    const fetch = vi.fn()
    const api = createCatalogTypeAttributesReadApi(fetch)
    await expect(
      api.listDirectApplicabilities({ ...input, offset: -1 }),
    ).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Rejected' }),
    })
    await expect(api.listDirectApplicabilities(input)).rejects.toThrow(
      'Rejected',
    )
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.listDirectApplicabilities(input)).rejects.toThrow(
      'offline',
    )
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw Error('JSON')
      },
    })
    await expect(api.listDirectApplicabilities(input)).rejects.toThrow('JSON')
  })
})

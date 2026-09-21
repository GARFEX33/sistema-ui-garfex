import { describe, expect, it, vi } from 'vitest'
import { createCatalogHierarchyRestApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const input = {
  class: { kind: 'CLASE' as const, code: 'MAT' },
  code: 'FER',
  name: 'Ferretería',
}
const record = {
  kind: 'FAMILIA',
  id: '0',
  revision: '1',
  active: true,
  values: {
    class: {
      kind: 'REFERENCE',
      reference: { kind: 'CLASE', id: '1', code: 'MAT' },
    },
    code: { kind: 'CODE', value: 'FER' },
    name: { kind: 'TEXT', value: 'Ferretería' },
  },
  rules: [],
}

describe('catalog hierarchy REST creation contract', () => {
  it('fails closed and preserves HTTP error details', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ status: 201, json: async () => record })
    const api = createCatalogHierarchyRestApi(fetch, { actor: 'catalog-user' })
    await expect(api.createFamily({ ...input, code: '' })).rejects.toThrow(
      'Invalid catalog hierarchy create input',
    )
    expect(fetch).not.toHaveBeenCalled()
    await expect(api.createFamily(input)).rejects.toThrow(
      'Invalid catalog hierarchy response',
    )
    const failureApi = createCatalogHierarchyRestApi(
      vi.fn().mockResolvedValue({
        status: 422,
        json: async () => ({
          error: 'bad',
          code: 'INVALID_REFERENCE',
          detail: 'MAT',
        }),
      }),
      { actor: 'catalog-user' },
    )
    await expect(failureApi.createFamily(input)).rejects.toMatchObject({
      name: 'CatalogHierarchyRestError',
      failure: { kind: 'http', status: 422, error: 'bad' },
      code: 'INVALID_REFERENCE',
      detail: 'MAT',
    })
  })
})

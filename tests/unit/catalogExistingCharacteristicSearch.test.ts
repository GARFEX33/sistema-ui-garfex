import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'

const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'CARACTERISTICA',
  id: '4',
  revision: '0',
  active: true,
  values: {
    code: { kind: 'CODE', value: 'DENSITY' },
    name: { kind: 'TEXT', value: 'Densidad' },
    valueType: { kind: 'ENUM', value: 'DECIMAL' },
  },
  rules: [],
  ...overrides,
})

describe('catalog existing characteristic search', () => {
  it('rejects inactive or malformed characteristic selections', async () => {
    for (const current of [
      record({ active: false }),
      record({
        values: {
          ...record().values,
          valueType: { kind: 'TEXT', value: 'DECIMAL' },
        },
      }),
    ]) {
      const fetch = vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              records: [current],
              hasPrevious: false,
              hasNext: false,
            }),
          ),
      ) as unknown as typeof globalThis.fetch

      await expect(
        createCatalogAttributeCreationApi(fetch).searchCharacteristics({
          scope: 'ACTIVE',
          text: 'DENSITY',
          limit: 50,
          offset: 0,
        }),
      ).rejects.toThrow('Invalid catalog characteristic search response')
    }
  })
})

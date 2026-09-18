import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'

const context = { classCode: 'A & B', familyCode: 'FAMILY', typeCode: 'TYPE' }
const record = (kind: string, id: string, code: string, values = {}) => ({
  kind,
  id,
  revision: '0',
  active: true,
  values: { code: { kind: 'CODE', value: code }, ...values },
  rules: [],
})
const responses = [
  {
    records: [record('CLASE', '1', context.classCode)],
    hasPrevious: false,
    hasNext: false,
  },
  {
    records: [
      record('FAMILIA', '2', context.familyCode, {
        class: {
          kind: 'REFERENCE',
          reference: { kind: 'CLASE', id: '1', code: context.classCode },
        },
      }),
    ],
    hasPrevious: false,
    hasNext: false,
  },
  {
    records: [
      record('TIPO', '3', context.typeCode, {
        class: {
          kind: 'REFERENCE',
          reference: { kind: 'CLASE', id: '1', code: context.classCode },
        },
        family: {
          kind: 'REFERENCE',
          reference: { kind: 'FAMILIA', id: '2', code: context.familyCode },
        },
      }),
    ],
    hasPrevious: false,
    hasNext: false,
  },
]

describe('catalog attribute creation API', () => {
  it('uses only the exact public hierarchy list filters', async () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify(responses.shift())),
    ) as unknown as typeof globalThis.fetch
    await createCatalogAttributeCreationApi(fetch).resolveHierarchyReferences(
      context,
    )
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/v1/catalog/CLASE?scope=ALL&text=A+%26+B&limit=50&offset=0',
      '/v1/catalog/FAMILIA?scope=ALL&text=FAMILY&limit=50&offset=0&classCode=A+%26+B',
      '/v1/catalog/TIPO?scope=ALL&text=TYPE&limit=50&offset=0&familyCode=FAMILY',
    ])
  })

  it('does not request an invalid context', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch
    await expect(
      createCatalogAttributeCreationApi(fetch).resolveHierarchyReferences({
        ...context,
        familyCode: '',
      }),
    ).rejects.toThrow('Invalid catalog attribute creation response')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('searches only active characteristics with the documented page query', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            records: [
              record('CARACTERISTICA', '4', 'DENSITY', {
                name: { kind: 'TEXT', value: 'Densidad' },
                valueType: { kind: 'ENUM', value: 'DECIMAL' },
              }),
            ],
            hasPrevious: false,
            hasNext: true,
          }),
        ),
    ) as unknown as typeof globalThis.fetch

    await expect(
      createCatalogAttributeCreationApi(fetch).searchCharacteristics({
        scope: 'ACTIVE',
        text: 'dens',
        limit: 50,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      records: [
        {
          code: 'DENSITY',
          name: 'Densidad',
          valueType: 'DECIMAL',
        },
      ],
      hasNext: true,
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/CARACTERISTICA?scope=ACTIVE&text=dens&limit=50&offset=0',
      { signal: undefined },
    )
  })

  it('accepts documented characteristic values beyond consumed fields and omits blank text', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            records: [
              record('CARACTERISTICA', '4', 'DENSITY', {
                defaultIdentityParticipates: { kind: 'BOOLEAN', value: false },
                dimension: { kind: 'TEXT', value: 'MASS_PER_VOLUME' },
                name: { kind: 'TEXT', value: 'Densidad' },
                valueType: { kind: 'ENUM', value: 'DECIMAL' },
              }),
            ],
            hasPrevious: false,
            hasNext: false,
          }),
        ),
    ) as unknown as typeof globalThis.fetch

    await expect(
      createCatalogAttributeCreationApi(fetch).searchCharacteristics({
        scope: 'ACTIVE',
        text: '   ',
        limit: 50,
        offset: 0,
      }),
    ).resolves.toMatchObject({ records: [{ code: 'DENSITY' }] })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/CARACTERISTICA?scope=ACTIVE&limit=50&offset=0',
      { signal: undefined },
    )
  })
})

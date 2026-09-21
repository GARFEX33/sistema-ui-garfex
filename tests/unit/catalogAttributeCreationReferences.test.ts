import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'

const context = {
  classCode: 'MATERIAL',
  familyCode: 'CONDUCTORES',
  typeCode: 'CABLE',
}
const reference = (kind: string, id: string, code: string) => ({
  kind,
  id,
  code,
})
const catalogRecord = (
  kind: string,
  id: string,
  code: string,
  values: Record<string, unknown> = {},
) => ({
  kind,
  id,
  revision: '0',
  active: true,
  values: { code: { kind: 'CODE', value: code }, ...values },
  rules: [],
})
const pages = () => [
  {
    records: [catalogRecord('CLASE', '1', context.classCode)],
    hasPrevious: false,
    hasNext: false,
  },
  {
    records: [
      catalogRecord('FAMILIA', '2', context.familyCode, {
        class: {
          kind: 'REFERENCE',
          reference: reference('CLASE', '1', context.classCode),
        },
      }),
    ],
    hasPrevious: false,
    hasNext: false,
  },
  {
    records: [
      catalogRecord('TIPO', '3', context.typeCode, {
        class: {
          kind: 'REFERENCE',
          reference: reference('CLASE', '1', context.classCode),
        },
        family: {
          kind: 'REFERENCE',
          reference: reference('FAMILIA', '2', context.familyCode),
        },
      }),
    ],
    hasPrevious: false,
    hasNext: false,
  },
]
const apiFor = (responses = pages()) =>
  createCatalogAttributeCreationApi(
    vi.fn(
      async () => new Response(JSON.stringify(responses.shift())),
    ) as unknown as typeof fetch,
  )

describe('catalog attribute creation canonical references', () => {
  it('returns only the resolved canonical hierarchy triples', async () => {
    await expect(apiFor().resolveHierarchyReferences(context)).resolves.toEqual(
      {
        class: {
          kind: 'REFERENCE',
          reference: reference('CLASE', '1', context.classCode),
        },
        family: {
          kind: 'REFERENCE',
          reference: reference('FAMILIA', '2', context.familyCode),
        },
        type: {
          kind: 'REFERENCE',
          reference: reference('TIPO', '3', context.typeCode),
        },
      },
    )
  })

  it.each([
    [
      'zero exact codes',
      (items: ReturnType<typeof pages>) => (items[0].records = []),
    ],
    [
      'multiple exact codes',
      (items: ReturnType<typeof pages>) =>
        items[0].records.push(catalogRecord('CLASE', '4', context.classCode)),
    ],
    [
      'an unusable id',
      (items: ReturnType<typeof pages>) => (items[0].records[0].id = '0'),
    ],
    [
      'an incomplete page',
      (items: ReturnType<typeof pages>) => (items[1].hasNext = true),
    ],
    [
      'a parent mismatch',
      (items: ReturnType<typeof pages>) =>
        ((
          items[2].records[0].values.family as {
            kind: string
            reference: { kind: string; id: string; code: string }
          }
        ).reference.code = 'OTHER'),
    ],
  ])('fails closed for %s', async (_name, mutate) => {
    const items = pages()
    mutate(items)
    await expect(
      apiFor(items).resolveHierarchyReferences(context),
    ).rejects.toThrow('Invalid catalog attribute creation response')
  })
})

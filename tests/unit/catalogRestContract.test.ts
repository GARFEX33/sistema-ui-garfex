import { describe, expect, it } from 'vitest'
import {
  ApplicabilityRuleSchema,
  CatalogPageSchema,
  CatalogRecordSchema,
  CatalogValueSchema,
  ErrorEnvelopeSchema,
} from '../../src/shared/catalog/catalogRest.contract'

const variants = [
  [
    { kind: 'TEXT', value: 'Material' },
    { kind: 'TEXT', value: 1 },
  ],
  [
    { kind: 'CODE', value: 'MAT' },
    { kind: 'CODE', value: false },
  ],
  [
    { kind: 'BOOLEAN', value: false },
    { kind: 'BOOLEAN', value: 'false' },
  ],
  [
    { kind: 'INTEGER', value: '-12' },
    { kind: 'INTEGER', value: '01' },
  ],
  [
    { kind: 'DECIMAL', value: '-12.5' },
    { kind: 'DECIMAL', value: '1.20' },
  ],
  [
    { kind: 'QUANTITY', value: '2.5', unitCode: 'KG' },
    { kind: 'QUANTITY', value: '2.0', unitCode: 'KG' },
  ],
  [
    { kind: 'REFERENCE', reference: { kind: 'CLASE', id: '-1', code: 'MAT' } },
    { kind: 'REFERENCE', reference: { kind: 'CLASE', id: '01', code: 'MAT' } },
  ],
  [
    { kind: 'ENUM', value: 'ACTIVE' },
    { kind: 'ENUM', value: 1 },
  ],
  [
    { kind: 'STRING_LIST', values: ['a', 'b'] },
    { kind: 'STRING_LIST', values: [1] },
  ],
  [
    { kind: 'CONTROLLED_OPTION', value: 'RED' },
    { kind: 'CONTROLLED_OPTION', value: null },
  ],
  [{ kind: 'NOT_APPLICABLE' }, { kind: 'NOT_APPLICABLE', value: 'nope' }],
] as const

const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'CLASE',
  id: '123',
  revision: 'rev-1',
  active: true,
  values: { code: { kind: 'CODE', value: 'MAT' } },
  rules: [],
  ...overrides,
})

describe('catalog REST contract', () => {
  it('accepts every public CatalogValue variant and rejects its invalid counterpart', () => {
    for (const [valid, invalid] of variants) {
      expect(CatalogValueSchema.safeParse(valid).success).toBe(true)
      expect(CatalogValueSchema.safeParse(invalid).success).toBe(false)
    }
  })

  it('validates complete records, rules, and pages without coercion or defaults', () => {
    const text = { kind: 'TEXT', value: '  preserved  ' } as const
    const rule = {
      attributeCode: 'material',
      equals: text,
      mode: 'REQUIRED',
      identityParticipates: true,
      notApplicable: false,
      active: true,
    }
    const page = CatalogPageSchema.parse({
      records: [record({ values: { label: text }, rules: [rule] })],
      hasPrevious: false,
      hasNext: true,
    })

    expect(page.records[0]).toMatchObject({ id: '123', revision: 'rev-1' })
    expect(page.records[0]?.values.label).toEqual(text)
    expect(ApplicabilityRuleSchema.safeParse(rule).success).toBe(true)
    expect(CatalogRecordSchema.safeParse(record({ id: 123 })).success).toBe(
      false,
    )
    expect(CatalogRecordSchema.safeParse(record({ revision: 1 })).success).toBe(
      false,
    )
    expect(
      CatalogPageSchema.safeParse({ records: [record()], hasNext: true })
        .success,
    ).toBe(false)
  })

  it('validates the documented error envelope and rejects partial contract data', () => {
    expect(ErrorEnvelopeSchema.parse({ error: 'Revision conflict' })).toEqual({
      error: 'Revision conflict',
    })
    expect(ErrorEnvelopeSchema.safeParse({ error: 409 }).success).toBe(false)
    expect(
      CatalogRecordSchema.safeParse(record({ rules: undefined })).success,
    ).toBe(false)
    expect(
      CatalogValueSchema.safeParse({ kind: 'TEXT', value: 'x', extra: true })
        .success,
    ).toBe(false)
  })
})

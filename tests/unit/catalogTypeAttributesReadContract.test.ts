import { describe, expect, it } from 'vitest'
import { parseDirectApplicabilityPage } from '../../src/features/catalog-hierarchy/catalogTypeAttributesRead.api'

const request = {
  classCode: 'MATERIAL',
  familyCode: 'CONDUCTORES',
  typeCode: 'CABLE',
  offset: 0,
  limit: 20,
}
const reference = (kind: string, code: string, id = '1') => ({
  kind: 'REFERENCE',
  reference: { kind, id, code },
})
const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'APLICABILIDAD',
  id: 'app-1',
  revision: 'rev-1',
  active: true,
  values: {
    class: reference('CLASE', 'MATERIAL'),
    family: reference('FAMILIA', 'CONDUCTORES'),
    characteristic: reference('CARACTERISTICA', 'durable', '0'),
    type: reference('TIPO', 'CABLE'),
    mode: { kind: 'ENUM', value: 'REQUIRED' },
  },
  rules: [],
  ...overrides,
})
const page = (records: unknown[] = [record()]) => ({
  records,
  hasPrevious: false,
  hasNext: true,
})

describe('direct applicability REST contract', () => {
  it('maps a full contextual page and preserves rules without evaluating them', () => {
    const rules = [
      {
        attributeCode: 'material',
        equals: { kind: 'CODE', value: 'CU' },
        mode: 'CONDITIONAL',
        identityParticipates: false,
        notApplicable: false,
        active: true,
      },
    ]
    const result = parseDirectApplicabilityPage(
      page([{ ...record(), rules }]),
      request,
    )

    expect(result).toMatchObject({ hasPrevious: false, hasNext: true })
    expect(result.records[0]).toMatchObject({
      id: 'app-1',
      mode: 'REQUIRED',
      characteristic: { kind: 'CARACTERISTICA', id: '0', code: 'durable' },
      type: { kind: 'TIPO', code: 'CABLE' },
    })
    expect(result.records[0]?.rules).toStrictEqual(rules)
  })

  it('accepts every descriptor-confirmed mode and optional optionSet reference', () => {
    for (const mode of ['REQUIRED', 'OPTIONAL', 'CONDITIONAL', 'FORBIDDEN']) {
      expect(
        parseDirectApplicabilityPage(
          page([
            record({
              values: {
                ...record().values,
                mode: { kind: 'ENUM', value: mode },
                optionSet: reference('CONJUNTO_OPCIONES', 'CABLES'),
              },
            }),
          ]),
          request,
        ).records[0]?.mode,
      ).toBe(mode)
    }
  })

  it('rejects an invalid record and never returns a partial page', () => {
    const { type: _type, ...withoutType } = record().values
    const invalid = [
      [record({ kind: 'TIPO' })],
      [record({ id: 1 })],
      [record({ revision: 1 })],
      [record({ rules: [{ attributeCode: 'x', equals: { kind: 'CODE', value: 'x' }, mode: 'REQUIRED', identityParticipates: false, notApplicable: false, active: 'yes' }] })],
      [record({ values: { ...record().values, mode: { kind: 'ENUM', value: 'NO' } } })],
      [record({ values: { ...record().values, class: reference('CLASE', 'OTHER') } })],
      [record({ values: { ...record().values, family: reference('FAMILIA', 'OTHER') } })],
      [record({ values: { ...record().values, characteristic: { kind: 'CODE', value: 'x' } } })],
      [record({ values: withoutType })],
      [record({ values: { ...record().values, type: reference('FAMILIA', 'CABLE') } })],
      [record({ values: { ...record().values, type: reference('TIPO', 'OTHER') } })],
      [record({ values: { ...record().values, optionSet: reference('OPCION', 'x') } })],
      [record({ active: 'yes' })],
      [record({ values: { ...record().values, characteristic: reference('CARACTERISTICA', 'durable', '01') } })],
    ]
    for (const records of invalid)
      expect(() => parseDirectApplicabilityPage(page([record(), ...records]), request)).toThrow()
    expect(() => parseDirectApplicabilityPage({ records: [], hasNext: true }, request)).toThrow()
  })
})

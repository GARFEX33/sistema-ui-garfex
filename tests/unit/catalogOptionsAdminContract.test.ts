import { describe, expect, it } from 'vitest'
import {
  parseCatalogOptionsAdminPage,
  parseCatalogOptionsAdminRecord,
} from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.api'
import { ErrorEnvelopeSchema } from '../../src/shared/catalog/catalogRest.contract'

const input = {
  optionSetCode: 'DEFAULT',
  characteristicCode: 'insulation',
  offset: 0,
  limit: 20,
}
const reference = (kind: string, id: string, code: string) => ({
  kind: 'REFERENCE',
  reference: { kind, id, code },
})
const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'OPCION',
  id: '8',
  revision: '0',
  active: true,
  values: {
    optionSet: reference('CONJUNTO_OPCIONES', '1', input.optionSetCode),
    characteristic: reference('CARACTERISTICA', '3', input.characteristicCode),
    code: { kind: 'CODE', value: 'FIBERGLASS' },
    label: { kind: 'TEXT', value: 'Fiberglass' },
  },
  rules: [],
  ...overrides,
})
const page = (records: unknown[] = [record()]) => ({
  records,
  hasPrevious: false,
  hasNext: true,
})

describe('catalog options admin REST contract', () => {
  it('validates an optional public error detail only when it is a string', () => {
    expect(
      ErrorEnvelopeSchema.parse({
        error: 'validation failed',
        detail: 'Etiqueta duplicada',
      }),
    ).toStrictEqual({
      error: 'validation failed',
      detail: 'Etiqueta duplicada',
    })
    expect(
      ErrorEnvelopeSchema.safeParse({
        error: 'validation failed',
        detail: 422,
      }),
    ).toMatchObject({ success: false })
  })

  it('maps a complete canonical OPCION page without changing its REST flags', () => {
    expect(parseCatalogOptionsAdminPage(page(), input)).toMatchObject({
      records: [
        {
          id: '8',
          revision: '0',
          active: true,
          code: 'FIBERGLASS',
          label: 'Fiberglass',
          rules: [],
          optionSet: { kind: 'CONJUNTO_OPCIONES', id: '1', code: 'DEFAULT' },
          characteristic: {
            kind: 'CARACTERISTICA',
            id: '3',
            code: 'insulation',
          },
        },
      ],
      hasPrevious: false,
      hasNext: true,
    })
  })

  it('rejects malformed descriptor values and rejects the whole page', () => {
    const values = record().values
    const withValue = (key: string, value: unknown) =>
      record({ values: { ...values, [key]: value } })
    const invalid = [
      record({ kind: 'APLICABILIDAD' }),
      record({ id: '0' }),
      record({ id: 8 }),
      record({ revision: '-1' }),
      record({ revision: 1 }),
      record({ active: 'yes' }),
      record({ rules: [{}] }),
      withValue('code', { kind: 'TEXT', value: 'x' }),
      withValue('label', { kind: 'CODE', value: 'x' }),
      withValue('optionSet', reference('OPCION', '1', 'DEFAULT')),
      withValue(
        'characteristic',
        reference('CARACTERISTICA', '0', 'insulation'),
      ),
      withValue('optionSet', reference('CONJUNTO_OPCIONES', '1', 'OTHER')),
      withValue('characteristic', reference('CARACTERISTICA', '3', 'OTHER')),
      withValue('extra', { kind: 'TEXT', value: 'x' }),
    ]
    for (const item of invalid)
      expect(() =>
        parseCatalogOptionsAdminPage(page([record(), item]), input),
      ).toThrow()
  })

  it('accepts only a mutation response that matches its complete intended context', () => {
    const values = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: input.characteristicCode,
      },
      code: 'FIBERGLASS',
      label: 'Fiberglass',
    }
    expect(
      parseCatalogOptionsAdminRecord(record(), { id: '8', values }),
    ).toMatchObject(values)
    for (const invalid of [
      record({ id: '9' }),
      record({
        values: { ...record().values, code: { kind: 'CODE', value: 'OTHER' } },
      }),
      record({
        values: {
          ...record().values,
          optionSet: reference('CONJUNTO_OPCIONES', '2', input.optionSetCode),
        },
      }),
      record({
        values: {
          ...record().values,
          characteristic: reference('CARACTERISTICA', '3', 'OTHER'),
        },
      }),
      record({ active: false }),
    ])
      expect(() =>
        parseCatalogOptionsAdminRecord(invalid, {
          id: '8',
          active: true,
          values,
        }),
      ).toThrow()
  })

  it('accepts an explicit empty page and rejects partial or extra pages', () => {
    const empty = { records: [], hasPrevious: true, hasNext: false }
    expect(parseCatalogOptionsAdminPage(empty, input)).toStrictEqual(empty)
    expect(() => parseCatalogOptionsAdminPage({ records: [] }, input)).toThrow()
    expect(() =>
      parseCatalogOptionsAdminPage({ ...page(), extra: true }, input),
    ).toThrow()
    expect(() =>
      parseCatalogOptionsAdminPage(page([{ ...record(), extra: true }]), input),
    ).toThrow()
  })

  it('rejects invalid REST limits and non-integer offsets before parsing', () => {
    for (const request of [{ limit: 0 }, { offset: 0.5 }])
      expect(() =>
        parseCatalogOptionsAdminPage(page(), { ...input, ...request }),
      ).toThrow()
  })
})

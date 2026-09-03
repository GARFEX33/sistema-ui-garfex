import { describe, expect, it } from 'vitest'
import {
  parseClassesPage,
  parseFamiliesPage,
  parseTypesPage,
} from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const item = (extra: Record<string, unknown> = {}) => ({
  activo: true,
  clave: 'C-1',
  effective: true,
  effectiveReasons: ['inherited'],
  id: { opaque: 'id-1' },
  nombre: 'Clase',
  revision: { opaque: 'rev-1' },
  ...extra,
})

const page = (items: unknown[] = [item()]) => ({
  continuationCursor: 'opaque-next',
  isExhausted: false,
  items,
})

describe('catalog hierarchy read parsers', () => {
  it('preserves opaque class identifiers, revisions, and cursor values', () => {
    const parsed = parseClassesPage(page([item({ descripcion: 'Detalle' })]))

    expect(parsed).toEqual({
      continuationCursor: 'opaque-next',
      isExhausted: false,
      items: [item({ descripcion: 'Detalle' })],
    })
    expect(
      parseClassesPage({
        continuationCursor: null,
        isExhausted: true,
        items: [],
      }).continuationCursor,
    ).toBeNull()
  })

  it('fails closed on malformed envelopes or base items', () => {
    expect(() =>
      parseClassesPage({
        items: [],
        continuationCursor: 'next',
        isExhausted: 1,
      }),
    ).toThrow('Invalid catalog hierarchy response')
    expect(() =>
      parseClassesPage({
        items: [],
        continuationCursor: 12,
        isExhausted: true,
      }),
    ).toThrow('Invalid catalog hierarchy response')
    expect(() =>
      parseClassesPage(page([item({ effectiveReasons: [1] })])),
    ).toThrow('Invalid catalog hierarchy response')
    expect(() => parseClassesPage(page([item({ descripcion: null })]))).toThrow(
      'Invalid catalog hierarchy response',
    )
  })

  it('requires matching parent identities for family pages when supplied', () => {
    const family = item({ claseRecursoId: { opaque: 'class-1' } })

    expect(parseFamiliesPage(page([family]), family.claseRecursoId)).toEqual(
      page([family]),
    )
    expect(() =>
      parseFamiliesPage(page([family]), { opaque: 'class-1' }),
    ).toThrow('Invalid catalog hierarchy response')
    expect(() => parseFamiliesPage(page([item()]))).toThrow(
      'Invalid catalog hierarchy response',
    )
  })

  it('requires Tipo aggregate status, structured violations, and parent equality', () => {
    const type = item({
      aggregateStatus: 'OK',
      familiaRecursoId: 'family-1',
      violations: [{ reason: 'declared boundary' }],
    })

    expect(parseTypesPage(page([type]), 'family-1')).toEqual(page([type]))
    expect(() =>
      parseTypesPage(
        page([
          item({
            aggregateStatus: 'OK',
            familiaRecursoId: 'family-1',
            violations: ['primitive'],
          }),
        ]),
        'family-1',
      ),
    ).toThrow('Invalid catalog hierarchy response')
    expect(() =>
      parseTypesPage(
        page([item({ familiaRecursoId: 'family-1', violations: [] })]),
      ),
    ).toThrow('Invalid catalog hierarchy response')
  })
})

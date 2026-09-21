import { describe, expect, it } from 'vitest'
import { formatCatalogValueText } from '../../src/features/resources-master/resourceAttributeDisplay'
import type { CatalogValue } from '../../src/shared/catalog/catalogRest.contract'

describe('formatCatalogValueText', () => {
  it.each<[CatalogValue, string]>([
    [{ kind: 'TEXT', value: 'rojo' }, 'rojo'],
    [{ kind: 'CODE', value: 'AWG-12' }, 'AWG-12'],
    [{ kind: 'INTEGER', value: '12' }, '12'],
    [{ kind: 'DECIMAL', value: '1.5' }, '1.5'],
    [{ kind: 'ENUM', value: 'ALTO' }, 'ALTO'],
    [{ kind: 'CONTROLLED_OPTION', value: 'ROJO' }, 'ROJO'],
    [{ kind: 'BOOLEAN', value: true }, 'Sí'],
    [{ kind: 'BOOLEAN', value: false }, 'No'],
    [{ kind: 'QUANTITY', value: '2.5', unitCode: 'M' }, '2.5 M'],
    [
      {
        kind: 'REFERENCE',
        reference: { kind: 'UNIDAD', id: '7', code: 'PZA' },
      },
      'PZA',
    ],
    [{ kind: 'STRING_LIST', values: ['a', 'b', 'c'] }, 'a, b, c'],
    [{ kind: 'NOT_APPLICABLE' }, 'No aplica'],
  ])('formats %o as %s', (value, expected) => {
    expect(formatCatalogValueText(value)).toBe(expected)
  })
})

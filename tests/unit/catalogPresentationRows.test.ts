import { describe, expect, it } from 'vitest'
import { derivePresentationRows } from '../../src/features/catalog-hierarchy/catalogPresentationRows'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'
import type { CatalogPresentationListItem } from '../../src/features/catalog-hierarchy/catalogPresentationAdmin.api'

const attribute = (code: string, name: string): EffectiveAttribute => ({
  characteristic: { code, name, valueType: 'CONTROLLED_TEXT' },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'CABLE' },
  rules: [],
})

const presentation = (
  overrides: Partial<CatalogPresentationListItem> & {
    characteristicCode: string
  },
): CatalogPresentationListItem => ({
  id: '1',
  revision: '1',
  active: true,
  position: '0',
  ...overrides,
})

describe('derivePresentationRows', () => {
  it('marks an attribute with an active presentation row as participating, ordered by position', () => {
    const rows = derivePresentationRows(
      [attribute('calibre', 'Calibre'), attribute('color', 'Color')],
      [
        presentation({ characteristicCode: 'calibre', position: '1' }),
        presentation({ characteristicCode: 'color', position: '0' }),
      ],
    )

    expect(rows.participating.map((row) => row.characteristicCode)).toEqual([
      'color',
      'calibre',
    ])
    expect(rows.notParticipating).toEqual([])
  })

  it('marks an attribute with no presentation row, or an inactive one, as not participating', () => {
    const rows = derivePresentationRows(
      [attribute('calibre', 'Calibre'), attribute('nota', 'Nota interna')],
      [presentation({ characteristicCode: 'calibre', active: false })],
    )

    expect(rows.participating).toEqual([])
    expect(rows.notParticipating.map((row) => row.characteristicCode)).toEqual([
      'calibre',
      'nota',
    ])
  })

  it('carries the presentation id/revision/position only for rows that have one', () => {
    const rows = derivePresentationRows(
      [attribute('color', 'Color'), attribute('nota', 'Nota interna')],
      [
        presentation({
          characteristicCode: 'color',
          id: '9',
          revision: '2',
          position: '3',
        }),
      ],
    )

    expect(rows.participating[0]).toEqual({
      characteristicCode: 'color',
      name: 'Color',
      id: '9',
      revision: '2',
      position: '3',
      active: true,
    })
    expect(rows.notParticipating[0]).toEqual({
      characteristicCode: 'nota',
      name: 'Nota interna',
      id: null,
      revision: null,
      position: null,
      active: false,
    })
  })

  it('carries active:false for a not-participating row that already has a real, deactivated PRESENTACION record', () => {
    const rows = derivePresentationRows(
      [attribute('calibre', 'Calibre')],
      [
        presentation({
          characteristicCode: 'calibre',
          id: '2',
          revision: '5',
          active: false,
        }),
      ],
    )

    expect(rows.notParticipating[0]).toEqual({
      characteristicCode: 'calibre',
      name: 'Calibre',
      id: '2',
      revision: '5',
      position: '0',
      active: false,
    })
  })
})

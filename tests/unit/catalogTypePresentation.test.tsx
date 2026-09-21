import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogTypePresentation } from '../../src/features/catalog-hierarchy/CatalogTypePresentation'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

const attribute = (
  overrides: Partial<EffectiveAttribute> & { code: string; name: string },
): EffectiveAttribute => ({
  characteristic: {
    code: overrides.code,
    name: overrides.name,
    valueType: 'CONTROLLED_TEXT',
  },
  effectiveMode: 'REQUIRED',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'CABLE' },
  rules: [],
  ...overrides,
})

describe('CatalogTypePresentation', () => {
  it('shows a waiting message with no Tipo selected', () => {
    render(<CatalogTypePresentation status="waiting-context" attributes={[]} />)

    expect(
      screen.getByText(
        'Seleccioná un Tipo para ver cómo se arma su nombre de presentación.',
      ),
    ).toBeInTheDocument()
  })

  it('lists positioned attributes in position order, regardless of input order, with a name preview', () => {
    const attributes = [
      attribute({
        code: 'calibre',
        name: 'Calibre',
        hasPosition: true,
        position: 1,
      }),
      attribute({
        code: 'aislamiento',
        name: 'Aislamiento',
        hasPosition: true,
        position: 0,
      }),
      attribute({
        code: 'color',
        name: 'Color',
        hasPosition: true,
        position: 2,
      }),
    ]
    render(
      <CatalogTypePresentation
        status="ready"
        attributes={attributes}
        selectedTypeLabel="Cable"
      />,
    )

    const list = screen.getByRole('list', {
      name: 'Atributos que arman el nombre, en orden',
    })
    const names = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(names).toEqual([
      expect.stringContaining('Aislamiento'),
      expect.stringContaining('Calibre'),
      expect.stringContaining('Color'),
    ])
    expect(list.nextElementSibling?.textContent).toBe(
      'Cable Aislamiento Calibre Color',
    )
  })

  it('separates attributes that do not participate in the presentation name', () => {
    const attributes = [
      attribute({
        code: 'color',
        name: 'Color',
        hasPosition: true,
        position: 0,
      }),
      attribute({ code: 'nota', name: 'Nota interna', hasPosition: false }),
    ]
    render(<CatalogTypePresentation status="ready" attributes={attributes} />)

    expect(screen.getByText('No participan del nombre:')).toBeInTheDocument()
    expect(screen.getByText('Nota interna')).toBeInTheDocument()
  })

  it('shows a status message when no attribute participates in the presentation name yet', () => {
    render(
      <CatalogTypePresentation
        status="ready"
        attributes={[attribute({ code: 'nota', name: 'Nota interna' })]}
      />,
    )

    expect(
      screen.getByText(
        'Ningún atributo participa todavía del nombre de presentación.',
      ),
    ).toBeInTheDocument()
  })
})

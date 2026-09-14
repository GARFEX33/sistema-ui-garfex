import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogTypeEffectiveAttributes } from '../../src/features/catalog-hierarchy/CatalogTypeEffectiveAttributes'
import type { CatalogValue } from '../../src/shared/catalog/catalogRest.contract'
import type { EffectiveAttribute } from '../../src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.types'

const rule = (
  attributeCode: string,
  equals: CatalogValue,
): EffectiveAttribute['rules'][number] => ({
  attributeCode,
  equals,
  mode: 'REQUIRED',
  identityParticipates: false,
  notApplicable: false,
  active: true,
})

const rules = [
  rule('TEXT_RULE', { kind: 'TEXT', value: 'Texto visible' }),
  rule('CODE_RULE', { kind: 'CODE', value: 'COPPER' }),
  rule('BOOLEAN_RULE', { kind: 'BOOLEAN', value: true }),
  rule('INTEGER_RULE', { kind: 'INTEGER', value: '12' }),
  rule('DECIMAL_RULE', { kind: 'DECIMAL', value: '12.5' }),
  rule('QUANTITY_RULE', { kind: 'QUANTITY', value: '4.5', unitCode: 'KG' }),
  rule('REFERENCE_RULE', {
    kind: 'REFERENCE',
    reference: { kind: 'Material', id: '42', code: 'CU' },
  }),
  rule('ENUM_RULE', { kind: 'ENUM', value: 'Alta' }),
  rule('STRING_LIST_RULE', { kind: 'STRING_LIST', values: ['Uno', 'Dos'] }),
  rule('CONTROLLED_OPTION_RULE', { kind: 'CONTROLLED_OPTION', value: 'ROJO' }),
  rule('NOT_APPLICABLE_RULE', { kind: 'NOT_APPLICABLE' }),
]

const attributes: readonly EffectiveAttribute[] = [
  {
    characteristic: {
      code: 'COLOR',
      name: 'Color',
      valueType: 'CONTROLLED_OPTION',
      dimension: 'Visual',
    },
    effectiveMode: 'CONDITIONAL',
    identityParticipates: true,
    notApplicable: false,
    position: 9,
    hasPosition: true,
    optionSetCode: 'COLORS',
    options: [
      { code: 'BLUE', label: 'Blue' },
      { code: 'RED', label: 'Red' },
    ],
    source: { level: 'FAMILY', code: 'CABLE' },
    rules,
  },
  {
    characteristic: {
      code: 'VOLTAGE',
      name: 'Voltage',
      valueType: 'DECIMAL',
    },
    effectiveMode: 'OPTIONAL',
    identityParticipates: false,
    notApplicable: true,
    position: 99,
    hasPosition: false,
    options: [],
    source: { level: 'TYPE', code: 'UTP' },
    rules: [],
  },
]

const fallbackFocus = () =>
  document.getElementById('attributes-tab-fallback') as HTMLButtonElement | null

describe('CatalogTypeEffectiveAttributes', () => {
  it('keeps the Core order in a compact primary list and opens readable detail', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button id="attributes-tab-fallback">Atributos</button>
        <CatalogTypeEffectiveAttributes
          status="ready"
          attributes={attributes}
          retry={vi.fn()}
          fallbackFocus={fallbackFocus}
        />
      </>,
    )

    expect(
      screen.getByRole('heading', { name: 'Atributos efectivos del Tipo' }),
    ).toBeVisible()
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveClass('space-y-4')
    expect(
      document.querySelectorAll('[class*="catalog-attribute-"]'),
    ).toHaveLength(0)
    const list = screen.getByRole('list', { name: 'Atributos efectivos' })
    expect(list).toHaveClass('space-y-2')
    const rows = screen.getAllByRole('article')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveClass(
      'rounded-lg',
      'border',
      'border-border',
      'bg-surface-subtle',
      'sm:flex-row',
    )
    expect(rows[0]).toHaveTextContent('Color')
    expect(rows[0]).toHaveTextContent('COLOR · CONTROLLED_OPTION')
    expect(rows[1]).toHaveTextContent('Voltage')
    expect(
      screen.getAllByRole('button', { name: /Ver detalle de/ }),
    ).toHaveLength(2)
    expect(screen.queryByText('Modo efectivo: CONDITIONAL')).toBeNull()
    expect(screen.queryByText('Origen: FAMILY · CABLE')).toBeNull()
    expect(document.querySelector('pre')).toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de Color' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Detalle de Color' })
    expect(dialog).toHaveTextContent('Resumen')
    expect(dialog).toHaveTextContent('Aplicabilidad')
    expect(dialog).toHaveTextContent('Opciones')
    expect(dialog).toHaveTextContent('Reglas')
    expect(dialog).toHaveTextContent('BLUE · Blue')
    for (const value of [
      'TEXT_RULE',
      'Texto visible',
      'CODE_RULE',
      'COPPER',
      'BOOLEAN_RULE',
      'Sí',
      'INTEGER_RULE',
      '12',
      'DECIMAL_RULE',
      '12.5',
      'QUANTITY_RULE',
      '4.5 KG',
      'REFERENCE_RULE',
      'Material · 42 · CU',
      'ENUM_RULE',
      'Alta',
      'STRING_LIST_RULE',
      'Uno',
      'Dos',
      'CONTROLLED_OPTION_RULE',
      'ROJO',
      'NOT_APPLICABLE_RULE',
      'No aplica',
    ]) {
      expect(dialog).toHaveTextContent(value)
    }
    expect(
      screen.getByRole('list', { name: 'Valores de lista' }),
    ).toHaveTextContent('UnoDos')
    expect(dialog.querySelector('pre')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Ver detalle de Color' }),
      ).toHaveFocus(),
    )

    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de Color' }),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes an invalidated detail and focuses the attributes fallback', async () => {
    const user = userEvent.setup()
    const view = render(
      <>
        <button id="attributes-tab-fallback">Atributos</button>
        <CatalogTypeEffectiveAttributes
          status="ready"
          attributes={attributes}
          retry={vi.fn()}
          fallbackFocus={fallbackFocus}
        />
      </>,
    )
    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de Color' }),
    )
    expect(screen.getByRole('dialog')).toBeVisible()

    view.rerender(
      <>
        <button id="attributes-tab-fallback">Atributos</button>
        <CatalogTypeEffectiveAttributes
          status="loading"
          attributes={[]}
          retry={vi.fn()}
          fallbackFocus={fallbackFocus}
        />
      </>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Atributos' })).toHaveFocus()
  })

  it.each([
    ['waiting-context', 'Seleccioná Clase, Familia y Tipo'],
    ['loading', 'Cargando atributos efectivos…'],
    ['empty', 'No hay atributos efectivos para este contexto.'],
  ] as const)('announces the %s state accessibly', (status, message) => {
    render(
      <CatalogTypeEffectiveAttributes
        status={status}
        attributes={[]}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(message)
  })

  it('announces errors and offers an accessible retry without stale rows', async () => {
    const retry = vi.fn()
    const user = userEvent.setup()
    render(
      <CatalogTypeEffectiveAttributes
        status="error"
        attributes={[]}
        retry={retry}
        fallbackFocus={fallbackFocus}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los atributos efectivos.',
    )
    await user.click(
      screen.getByRole('button', { name: 'Reintentar atributos efectivos' }),
    )
    expect(retry).toHaveBeenCalledOnce()
  })
})

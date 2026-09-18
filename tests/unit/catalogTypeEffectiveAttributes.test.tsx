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
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    const rowsAsControls = screen.getAllByRole('button', {
      name: /Ver detalle de/,
    })
    expect(rowsAsControls).toHaveLength(2)
    expect(rowsAsControls[0]).toHaveClass(
      'rounded-lg',
      'border',
      'border-border',
      'bg-surface-subtle',
      'sm:flex-row',
    )
    expect(rowsAsControls[0]).toHaveTextContent('Color')
    expect(rowsAsControls[0]).toHaveTextContent('COLOR · CONTROLLED_OPTION')
    expect(rowsAsControls[1]).toHaveTextContent('Voltage')
    expect(rowsAsControls[0]).toHaveAttribute(
      'data-catalog-level',
      'attributes',
    )
    expect(rowsAsControls[0]).toHaveAttribute(
      'data-spatial-id',
      'catalog.row.attributes.effective.0',
    )
    expect(rowsAsControls[0].querySelectorAll('button')).toHaveLength(0)
    expect(screen.queryByText('Modo efectivo: CONDITIONAL')).toBeNull()
    expect(screen.queryByText('Origen: FAMILY · CABLE')).toBeNull()
    expect(document.querySelector('pre')).toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de Color' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Detalle de Color' })
    const detailTab = screen.getByRole('tab', { name: 'Detalle' })
    const optionsTab = screen.getByRole('tab', { name: 'Opciones' })
    expect(screen.getByRole('tablist')).toHaveAccessibleName(
      'Información y opciones del atributo',
    )
    expect(detailTab).toHaveAttribute('aria-selected', 'true')
    expect(optionsTab).toHaveAttribute('aria-selected', 'false')
    expect(dialog).toHaveClass('overflow-hidden', 'border-border')
    expect(
      screen.getByRole('button', { name: 'Cerrar modal de detalle' }),
    ).toBeVisible()
    expect(
      screen.getByLabelText('Atajos de teclado').querySelectorAll('kbd'),
    ).toHaveLength(7)
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
    detailTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(optionsTab).toHaveFocus()
    expect(detailTab).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(optionsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Resumen')).toBeNull()
    expect(dialog).toHaveTextContent('COLORS')
    expect(dialog).toHaveTextContent('COLOR')
    expect(dialog).toHaveTextContent('Opciones base compartidas')
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

  it('opens the single native row once with Enter and Space and explains unavailable options', async () => {
    const user = userEvent.setup()
    render(
      <CatalogTypeEffectiveAttributes
        status="ready"
        attributes={attributes}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
      />,
    )

    const voltage = screen.getByRole('button', {
      name: 'Ver detalle de Voltage',
    })
    voltage.focus()
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(voltage).toHaveFocus())
    await user.keyboard(' ')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    await user.click(screen.getByRole('tab', { name: 'Opciones' }))
    expect(
      screen.getByText('Administración de opciones no disponible'),
    ).toBeVisible()
    expect(screen.getByText(/no incluye un optionSetCode/i)).toBeVisible()
  })

  it('keeps the same detail open through a retained refresh and replaces it by characteristic code', async () => {
    const user = userEvent.setup()
    const view = render(
      <CatalogTypeEffectiveAttributes
        status="ready"
        attributes={attributes}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de Color' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Detalle de Color' })
    const focusedElement = document.activeElement

    view.rerender(
      <CatalogTypeEffectiveAttributes
        status="loading"
        attributes={attributes}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Detalle de Color' })).toBe(
      dialog,
    )
    expect(document.activeElement).toBe(focusedElement)

    const refreshedAttributes: readonly EffectiveAttribute[] = [
      attributes[1],
      {
        ...attributes[0],
        options: [{ code: 'GREEN', label: 'Green' }],
        rules: [rule('UPDATED_RULE', { kind: 'TEXT', value: 'Updated rule' })],
        source: { level: 'TYPE', code: 'CABLE_UPDATED' },
      },
    ]
    view.rerender(
      <CatalogTypeEffectiveAttributes
        status="ready"
        attributes={refreshedAttributes}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
      />,
    )

    const refreshedDialog = screen.getByRole('dialog', {
      name: 'Detalle de Color',
    })
    expect(refreshedDialog).toBe(dialog)
    expect(document.activeElement).toBe(focusedElement)
    expect(refreshedDialog).toHaveTextContent('GREEN · Green')
    expect(refreshedDialog).toHaveTextContent('TYPE · CABLE_UPDATED')
    expect(refreshedDialog).toHaveTextContent('UPDATED_RULE')
    expect(refreshedDialog).toHaveTextContent('Updated rule')
    expect(refreshedDialog).not.toHaveTextContent('BLUE · Blue')
    expect(refreshedDialog).not.toHaveTextContent('FAMILY · CABLE')
    expect(refreshedDialog).not.toHaveTextContent('TEXT_RULE')
  })

  it('closes a detail only when its characteristic code is absent from a ready response', async () => {
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
    view.rerender(
      <>
        <button id="attributes-tab-fallback">Atributos</button>
        <CatalogTypeEffectiveAttributes
          status="ready"
          attributes={[attributes[1]]}
          retry={vi.fn()}
          fallbackFocus={fallbackFocus}
        />
      </>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Atributos' })).toHaveFocus()
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
          status="error"
          attributes={[]}
          retry={vi.fn()}
          fallbackFocus={fallbackFocus}
        />
      </>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Atributos' })).toHaveFocus()
  })

  it('gates the creation CTA until the complete selected context is available', () => {
    const creation = {
      status: 'idle',
      steps: [],
      draft: null,
      retained: [],
      submit: vi.fn(),
      rereadCore: vi.fn(),
      continuePendingStep: vi.fn(),
    }
    const view = render(
      <CatalogTypeEffectiveAttributes
        status="waiting-context"
        attributes={[]}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
        actorAvailable
        context={{ sessionId: 'screen-1' }}
        creation={creation as never}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Crear atributo' }),
    ).toBeDisabled()

    view.rerender(
      <CatalogTypeEffectiveAttributes
        status="empty"
        attributes={[]}
        retry={vi.fn()}
        fallbackFocus={fallbackFocus}
        actorAvailable
        context={{
          sessionId: 'screen-1',
          classCode: 'MAT',
          familyCode: 'FER',
          typeCode: 'TOR',
        }}
        creation={creation as never}
      />,
    )

    expect(screen.getByRole('button', { name: 'Crear atributo' })).toBeEnabled()
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

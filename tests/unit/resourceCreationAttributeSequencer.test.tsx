import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ResourceCreationAttributeSequencer } from '../../src/features/resources-master/ResourceCreationAttributeSequencer'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

// Mirrors how CrearRecursoSurface actually owns attributeValues: onChange
// updates parent state, which flows back down as the (possibly stale until
// re-render) `values` prop — a fixed `values={{}}` prop would never reflect
// a just-confirmed attribute, unlike real usage.
function Harness({
  attributes,
  onComplete,
  onChangeSpy,
}: {
  attributes: readonly EffectiveAttribute[]
  onComplete: () => void
  onChangeSpy?: (code: string, value: unknown) => void
}) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  return (
    <ResourceCreationAttributeSequencer
      attributes={attributes}
      values={values}
      onChange={(code, value) => {
        onChangeSpy?.(code, value)
        setValues((current) => ({ ...current, [code]: value }))
      }}
      onComplete={onComplete}
    />
  )
}

const attribute = (
  overrides: Partial<EffectiveAttribute> & { code: string },
): EffectiveAttribute => ({
  characteristic: {
    code: overrides.code,
    name: overrides.code,
    valueType: 'CONTROLLED_TEXT',
  },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'TIPO-1' },
  rules: [],
  ...overrides,
})

const insulation = attribute({
  code: 'insulation',
  effectiveMode: 'REQUIRED',
  characteristic: {
    code: 'insulation',
    name: 'Aislamiento',
    valueType: 'CONTROLLED_OPTION',
  },
  options: [
    { code: 'THW', label: 'THW-LS' },
    { code: 'THHW', label: 'THHW' },
  ],
})

const gauge = attribute({
  code: 'gauge',
  effectiveMode: 'REQUIRED',
  characteristic: {
    code: 'gauge',
    name: 'Calibre',
    valueType: 'CONTROLLED_TEXT',
  },
})

const notes = attribute({
  code: 'notes',
  effectiveMode: 'OPTIONAL',
  characteristic: {
    code: 'notes',
    name: 'Notas',
    valueType: 'CONTROLLED_TEXT',
  },
})

const grounded = attribute({
  code: 'grounded',
  effectiveMode: 'REQUIRED',
  characteristic: {
    code: 'grounded',
    name: 'Puesta a tierra',
    valueType: 'BOOLEAN',
  },
})

const weight = attribute({
  code: 'weight',
  effectiveMode: 'OPTIONAL',
  characteristic: { code: 'weight', name: 'Peso', valueType: 'DECIMAL' },
})

describe('ResourceCreationAttributeSequencer', () => {
  it('shows one attribute at a time, autofocused, and advances automatically on confirm', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(
      <Harness
        attributes={[insulation, gauge]}
        onComplete={onComplete}
        onChangeSpy={onChange}
      />,
    )

    const search = screen.getByRole('searchbox', { name: 'Aislamiento *' })
    expect(search).toHaveFocus()
    expect(screen.queryByLabelText('Calibre *')).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'THW-LS' }))

    expect(onChange).toHaveBeenCalledWith('insulation', 'THW')
    expect(screen.getByText('Aislamiento')).toBeInTheDocument()
    expect(screen.getByText('THW-LS')).toBeInTheDocument()
    const gaugeInput = screen.getByLabelText('Calibre *')
    expect(gaugeInput).toHaveFocus()
  })

  it('confirms a free-text attribute with Enter and rejects an invalid number without advancing', async () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(
      <ResourceCreationAttributeSequencer
        attributes={[weight]}
        values={{}}
        onChange={onChange}
        onComplete={onComplete}
      />,
    )

    const input = screen.getByLabelText('Peso')
    fireEvent.change(input, { target: { value: 'not-a-number' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido.')
    expect(onChange).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '12.5' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('weight', '12.5')
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('skips an empty OPTIONAL free-text attribute on Enter without recording a value', () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(
      <ResourceCreationAttributeSequencer
        attributes={[notes, gauge]}
        values={{}}
        onChange={onChange}
        onComplete={onComplete}
      />,
    )

    fireEvent.keyDown(screen.getByLabelText('Notas'), { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Calibre *')).toHaveFocus()
  })

  it('renders a BOOLEAN attribute as a Sí/No choice and records a real boolean', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ResourceCreationAttributeSequencer
        attributes={[grounded]}
        values={{}}
        onChange={onChange}
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('option', { name: 'Sí' }))
    expect(onChange).toHaveBeenCalledWith('grounded', true)
  })

  it('shows the QUANTITY blocked message instead of a field', () => {
    const quantity = attribute({
      code: 'diameter',
      effectiveMode: 'REQUIRED',
      characteristic: {
        code: 'diameter',
        name: 'Diámetro',
        valueType: 'QUANTITY',
      },
    })
    render(
      <ResourceCreationAttributeSequencer
        attributes={[quantity]}
        values={{}}
        onChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(
      screen.getByText(
        'Captura no disponible todavía: falta la unidad de medida (unitCode) en el contrato de este atributo.',
      ),
    ).toBeInTheDocument()
  })

  it('calls onComplete exactly once once every attribute is confirmed or skipped', () => {
    const onComplete = vi.fn()
    render(
      <ResourceCreationAttributeSequencer
        attributes={[notes]}
        values={{}}
        onChange={vi.fn()}
        onComplete={onComplete}
      />,
    )

    fireEvent.keyDown(screen.getByLabelText('Notas'), { key: 'Enter' })
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('stays correct when the attribute list shrinks between renders (e.g. after a Core re-evaluation makes a sibling notApplicable)', async () => {
    const user = userEvent.setup()
    const diameterInches = attribute({
      code: 'diameter_in',
      effectiveMode: 'REQUIRED',
      characteristic: {
        code: 'diameter_in',
        name: 'Diámetro (pulgada)',
        valueType: 'CONTROLLED_OPTION',
      },
      options: [{ code: 'HALF', label: '1/2"' }],
    })
    const diameterMm = attribute({
      code: 'diameter_mm',
      effectiveMode: 'REQUIRED',
      characteristic: {
        code: 'diameter_mm',
        name: 'Diámetro (mm)',
        valueType: 'CONTROLLED_OPTION',
      },
      options: [{ code: 'THIRTEEN', label: '13mm' }],
    })

    function ReevaluatingHarness() {
      const [values, setValues] = useState<Record<string, unknown>>({})
      const [attrs, setAttrs] = useState([diameterInches, diameterMm, gauge])
      return (
        <ResourceCreationAttributeSequencer
          attributes={attrs}
          values={values}
          onChange={(code, value) => {
            setValues((current) => ({ ...current, [code]: value }))
            if (code === 'diameter_in') {
              // Simulates the async POST /evaluate response arriving after
              // confirming one of two mutually-exclusive attributes: the
              // sibling becomes notApplicable and disappears from the list.
              setAttrs([
                diameterInches,
                { ...diameterMm, notApplicable: true },
                gauge,
              ])
            }
          }}
          onComplete={vi.fn()}
        />
      )
    }

    render(<ReevaluatingHarness />)
    await user.click(screen.getByRole('option', { name: '1/2"' }))

    // diameter_mm must never be offered once its sibling is confirmed.
    expect(
      screen.queryByRole('searchbox', { name: /Diámetro \(mm\)/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Calibre *')).toHaveFocus()
  })

  it('steps back one attribute on Escape, but lets Escape bubble on the first attribute', async () => {
    const user = userEvent.setup()
    render(
      <ResourceCreationAttributeSequencer
        attributes={[insulation, gauge]}
        values={{}}
        onChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('option', { name: 'THW-LS' }))
    expect(screen.getByLabelText('Calibre *')).toHaveFocus()

    const notPrevented = fireEvent.keyDown(screen.getByLabelText('Calibre *'), {
      key: 'Escape',
    })
    expect(notPrevented).toBe(false)
    expect(
      await screen.findByRole('searchbox', { name: 'Aislamiento *' }),
    ).toBeInTheDocument()

    const stillBubbles = fireEvent.keyDown(
      screen.getByRole('searchbox', { name: 'Aislamiento *' }),
      { key: 'Escape' },
    )
    expect(stillBubbles).toBe(true)
  })
})

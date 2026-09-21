import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResourceCreationReview } from '../../src/features/resources-master/ResourceCreationReview'
import { buildResourceCreatedMessage } from '../../src/features/resources-master/resourceCreationMessages'
import type { UseResourceCreationSubmit } from '../../src/features/resources-master/useResourceCreationSubmit'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'
import type { Resource } from '../../src/features/resources-master/resourcesMaster.types'

const scope = {
  classCode: 'CLASE-1',
  className: 'Bombas',
  familyCode: 'FAM-1',
  familyName: 'Centrífugas',
  typeCode: 'TIPO-1',
  typeName: 'Bomba centrífuga',
}

const unit = { code: 'PZA', name: 'Pieza', symbol: 'pza' }

const attribute = (
  overrides: Partial<EffectiveAttribute> = {},
): EffectiveAttribute => ({
  characteristic: {
    code: 'color',
    name: 'Color',
    valueType: 'CONTROLLED_TEXT',
  },
  effectiveMode: 'REQUIRED',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'TIPO-1' },
  rules: [],
  ...overrides,
})

const resource: Resource = {
  id: 'resource-1',
  identityV1: 'CLASE-1-FAM-1-TIPO-1-ROJO',
  scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
  naturalUnit: 'PZA',
  active: true,
  revision: 'rev-1',
  attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'rojo' } }],
}

const submitState = (
  overrides: Partial<UseResourceCreationSubmit> = {},
): UseResourceCreationSubmit => ({
  status: 'idle',
  submit: vi.fn(),
  reset: vi.fn(),
  ...overrides,
})

describe('ResourceCreationReview (REST)', () => {
  it('disables creation while a required attribute is missing', () => {
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState()}
        unit={unit}
        values={{}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Crear recurso' })).toBeDisabled()
  })

  it('disables creation when an attribute value is invalid', () => {
    render(
      <ResourceCreationReview
        attributes={[
          attribute({
            characteristic: {
              code: 'espesor',
              name: 'Espesor',
              valueType: 'INTEGER',
            },
          }),
        ]}
        scope={scope}
        submit={submitState()}
        unit={unit}
        values={{ espesor: 'not-a-number' }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Crear recurso' })).toBeDisabled()
  })

  it('enables creation once projectResourceAttributes would return non-null and calls submit with the exact REST input', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ submit })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    const button = screen.getByRole('button', { name: 'Crear recurso' })
    expect(button).toBeEnabled()
    await user.click(button)

    expect(submit).toHaveBeenCalledWith({
      scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
      naturalUnit: 'PZA',
      attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'rojo' } }],
    })
  })

  it('shows the final presentation name, Tipo-prefixed, once every positioned attribute has a valid value', () => {
    render(
      <ResourceCreationReview
        attributes={[
          attribute({
            characteristic: {
              code: 'color',
              name: 'Color',
              valueType: 'CONTROLLED_TEXT',
            },
            hasPosition: true,
            position: 0,
          }),
        ]}
        scope={scope}
        submit={submitState()}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    expect(screen.getByText('Nombre final')).toBeInTheDocument()
    expect(screen.getByText('TIPO-1 rojo')).toBeInTheDocument()
  })

  it('shows no final presentation name while a required attribute is still missing', () => {
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState()}
        unit={unit}
        values={{}}
      />,
    )

    expect(screen.queryByText('Nombre final')).not.toBeInTheDocument()
  })

  it('creates the resource on Enter from anywhere in the review, not only by clicking the button', () => {
    const submit = vi.fn()
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ submit })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    fireEvent.keyDown(screen.getByRole('heading', { level: 2 }), {
      key: 'Enter',
    })

    expect(submit).toHaveBeenCalledOnce()
  })

  it('does not double-submit when Enter is pressed while the button itself is focused', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ submit })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    screen.getByRole('button', { name: 'Crear recurso' }).focus()
    await user.keyboard('{Enter}')

    expect(submit).toHaveBeenCalledOnce()
  })

  it('ignores Enter while a required attribute is missing', () => {
    const submit = vi.fn()
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ submit })}
        unit={unit}
        values={{}}
      />,
    )

    fireEvent.keyDown(screen.getByRole('heading', { level: 2 }), {
      key: 'Enter',
    })

    expect(submit).not.toHaveBeenCalled()
  })

  it('shows a submitting state and disables the button', () => {
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ status: 'submitting' })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Creando…' })).toBeDisabled()
  })

  it('shows a human-readable success message (never the internal identity) and moves focus to the heading', () => {
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({ status: 'success', result: resource })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    const heading = screen.getByRole('heading')
    expect(heading).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      buildResourceCreatedMessage(scope.typeName),
    )
    expect(screen.getByRole('status')).not.toHaveTextContent(
      resource.identityV1,
    )
    expect(screen.queryByRole('button', { name: /crear recurso/i })).toBeNull()
  })

  it('shows the generic error message and a working reset button on error', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(
      <ResourceCreationReview
        attributes={[attribute()]}
        scope={scope}
        submit={submitState({
          status: 'error',
          error: new Error('El código ya existe'),
          reset,
        })}
        unit={unit}
        values={{ color: 'rojo' }}
      />,
    )

    const heading = screen.getByRole('heading')
    expect(heading).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent('El código ya existe')

    await user.click(screen.getByRole('button', { name: /volver/i }))
    expect(reset).toHaveBeenCalledOnce()
  })
})

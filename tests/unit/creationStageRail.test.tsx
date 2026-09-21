import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreationStageRail } from '../../src/features/resources-master/CreationStageRail'

const selections = {
  className: 'Material',
  familyName: 'Áridos',
  typeName: 'Arena',
  unitName: 'Metro cúbico',
}

describe('CreationStageRail', () => {
  it('shows the current pending attribute position as a non-navigable semantic step', () => {
    render(
      <CreationStageRail
        attributeProgress={{ current: 2, total: 3 }}
        currentStage="attributes"
        onNavigate={vi.fn()}
        selections={selections}
      />,
    )

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    const attributes = within(rail).getByText('Atributos · 2 de 3')

    expect(attributes).toHaveAttribute('aria-current', 'step')
    expect(within(rail).queryByRole('button', { name: /Atributos/ })).toBeNull()
    expect(rail.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  })

  it('shows review as a non-navigable pending semantic step', () => {
    render(
      <CreationStageRail
        currentStage="review-pending"
        onNavigate={vi.fn()}
        selections={selections}
      />,
    )

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    const review = within(rail).getByText('Revisión · pendiente')

    expect(review).toHaveAttribute('aria-current', 'step')
    expect(within(rail).queryByRole('button', { name: /Revisión/ })).toBeNull()
    expect(rail.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  })

  it('keeps confirmed context selections reversible', () => {
    const onNavigate = vi.fn()
    render(
      <CreationStageRail
        currentStage="attributes"
        onNavigate={onNavigate}
        selections={selections}
      />,
    )

    expect(screen.getByText('Atributos · pendiente')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Familia Áridos' }))

    expect(onNavigate).toHaveBeenCalledWith('family')
  })

  it('renders a compact vertical checklist with a checkmark per confirmed selection, never a bordered button row', () => {
    render(
      <CreationStageRail
        currentStage="unit"
        onNavigate={vi.fn()}
        selections={selections}
      />,
    )

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    expect(rail.querySelectorAll('button')).toHaveLength(4)
    expect(
      screen.getByRole('button', { name: 'Clase Material' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Familia Áridos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Tipo Arena' }),
    ).toBeInTheDocument()
  })

  it('marks the current unconfirmed stage with › and a later stage with ·', () => {
    render(
      <CreationStageRail
        currentStage="family"
        onNavigate={vi.fn()}
        selections={{
          ...selections,
          familyName: '',
          typeName: '',
          unitName: '',
        }}
      />,
    )

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    const familyRow = within(rail)
      .getByText('Familia · pendiente')
      .closest('[aria-current="step"]')
    expect(familyRow?.textContent).toContain('›')

    const typeRow = screen.getByText('Tipo · pendiente').closest('li')
    expect(typeRow?.textContent).toContain('·')
    expect(typeRow?.querySelector('[aria-current]')).toBeNull()
  })
})

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
    fireEvent.click(screen.getByRole('button', { name: 'Familia: Áridos' }))

    expect(onNavigate).toHaveBeenCalledWith('family')
  })
})

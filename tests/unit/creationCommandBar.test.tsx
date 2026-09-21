import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreationCommandBar } from '../../src/features/resources-master/CreationCommandBar'
import type { CreationRailStage } from '../../src/features/resources-master/CreationStageRail'

const renderCommandBar = (stage: CreationRailStage) => {
  const onPress = vi.fn()
  render(
    <CreationCommandBar stage={stage}>
      <button onClick={onPress} type="button">
        Acción de prueba
      </button>
    </CreationCommandBar>,
  )
  return onPress
}

describe('CreationCommandBar', () => {
  it.each([
    ['class', '↑/↓ mover · Enter seleccionar · Esc cerrar'],
    ['family', '↑/↓ mover · Enter seleccionar · Esc volver'],
    ['type', '↑/↓ mover · Enter seleccionar · Esc volver'],
    ['unit', '↑/↓ mover · Enter seleccionar · Esc volver'],
    ['attributes', '↑/↓ mover · Enter seleccionar · Esc volver'],
    ['review-pending', 'Enter crear recurso · Esc volver'],
    ['contract-pending', 'Esc volver'],
  ] as const)('shows compact %s command copy', (stage, copy) => {
    renderCommandBar(stage)

    expect(
      screen.getByRole('region', { name: 'Comandos disponibles' }),
    ).toHaveTextContent(copy)
  })

  it('displays attribute command copy without handling command keys', () => {
    const onPress = renderCommandBar('attributes')

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    fireEvent.keyDown(document, { key: 'Enter' })

    expect(onPress).not.toHaveBeenCalled()
  })
})

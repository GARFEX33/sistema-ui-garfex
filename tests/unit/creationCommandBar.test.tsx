import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreationCommandBar } from '../../src/features/resources-master/CreationCommandBar'

const renderCommandBar = (
  stage: 'context' | 'contract-pending' | 'attributes' | 'review-pending',
) => {
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
    ['context', 'Esc Cerrar'],
    ['contract-pending', 'Esc / ← Volver'],
    ['attributes', 'Esc / ← Volver · Enter Confirmar'],
    ['review-pending', 'Esc / ← Volver'],
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

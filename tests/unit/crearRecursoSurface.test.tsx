import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

describe('CrearRecursoSurface', () => {
  it('closes the direct contract-pending surface with ArrowLeft and restores focus to Nuevo recurso', async () => {
    const user = userEvent.setup()
    render(
      <KeyboardControllerProvider activeSurface="recursos">
        <CrearRecursoSurface />
      </KeyboardControllerProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    await user.click(trigger)
    const heading = await screen.findByRole('heading', {
      name: 'Contrato pendiente',
    })
    expect(heading).toHaveFocus()

    fireEvent.keyDown(heading, { key: 'ArrowLeft' })

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })
})

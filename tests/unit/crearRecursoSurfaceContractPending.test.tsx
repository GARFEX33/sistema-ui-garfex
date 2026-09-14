import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const renderSurface = () =>
  render(
    <KeyboardControllerProvider activeSurface="recursos">
      <CrearRecursoSurface />
    </KeyboardControllerProvider>,
  )

describe('CrearRecursoSurface contract-pending entry', () => {
  it('opens the accessible pending contract from Nuevo recurso without network calls and restores trigger focus on Volver', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()
    renderSurface()
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    await user.click(trigger)

    const heading = await screen.findByRole('heading', {
      name: 'Contrato pendiente',
    })
    expect(heading).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'permanecerán bloqueados',
    )
    expect(fetchSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Volver' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })

  it('keeps the N command and Escape close behavior local to the keyboard controller without network calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderSurface()
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    fireEvent.keyDown(document, { key: 'n' })

    const heading = await screen.findByRole('heading', {
      name: 'Contrato pendiente',
    })
    expect(heading).toHaveFocus()
    fireEvent.keyDown(heading, { key: 'Escape' })

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

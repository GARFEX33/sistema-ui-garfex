import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../src/app/providers/AppProviders'
import { createAppRouter } from '../../src/app/router'

function renderShell() {
  const history = createMemoryHistory({ initialEntries: ['/bandeja'] })
  return render(<AppProviders router={createAppRouter(history)} />)
}

describe('command entry', () => {
  it('lists the active registered commands with their shortcuts', async () => {
    renderShell()
    await screen.findByRole('heading', { name: 'Bandeja' })
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Buscar o ejecutar comando/ }))
    expect(screen.getByText('Mostrar atajos')).toBeVisible()
    expect(screen.getByRole('button', { name: /Mostrar atajos/ })).toBeVisible()
  })
  it('opens the minimum command layer from its trigger and restores trigger focus on Escape', async () => {
    const user = userEvent.setup()
    renderShell()
    const trigger = await screen.findByRole('button', {
      name: /Buscar o ejecutar comando/,
    })
    await user.click(trigger)
    expect(
      screen.getByRole('dialog', { name: 'Entrada de comandos' }),
    ).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Comando' })).toHaveFocus()
    expect(
      screen.queryByText(/resultados|recientes|ranking|categorías/i),
    ).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('opens from Ctrl/Cmd+K and does not capture Tab', async () => {
    renderShell()
    const navigation = await screen.findByRole('link', { name: 'Bandeja' })
    navigation.focus()
    const preventDefault = vi.spyOn(KeyboardEvent.prototype, 'preventDefault')
    fireEvent.keyDown(navigation, { key: 'Tab' })
    expect(preventDefault).not.toHaveBeenCalled()
    preventDefault.mockRestore()
    fireEvent.keyDown(document, { key: 'k', code: 'KeyK', ctrlKey: true })
    expect(screen.getByRole('textbox', { name: 'Comando' })).toHaveFocus()
  })
})

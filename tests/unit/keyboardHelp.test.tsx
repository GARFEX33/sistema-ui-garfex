import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from '@tanstack/react-router'
import { AppProviders } from '../../src/app/providers/AppProviders'
import { createAppRouter } from '../../src/app/router'

function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] })
  return render(<AppProviders router={createAppRouter(history)} />)
}

describe('keyboard help', () => {
  it('opens from semantic question mark and lists global shortcuts', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })

    fireEvent.keyDown(document, { key: '?', shiftKey: true })

    expect(
      screen.getByRole('dialog', { name: 'Ayuda de teclado' }),
    ).toBeVisible()
    const dialog = screen.getByRole('dialog', { name: 'Ayuda de teclado' })
    expect(within(dialog).getByText('Ctrl/Cmd+K')).toBeVisible()
    expect(within(dialog).getByText('?')).toBeVisible()
    expect(
      within(dialog).queryByRole('heading', { name: 'Catálogo' }),
    ).not.toBeInTheDocument()
  })

  it('opens from semantic question mark without relying on the physical Slash key', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })

    fireEvent.keyDown(document, { key: '?', code: 'KeyQ' })

    expect(
      screen.getByRole('dialog', { name: 'Ayuda de teclado' }),
    ).toBeVisible()
  })

  it('passes Ctrl+N through to the browser instead of opening a catalog command', async () => {
    renderAt('/catalogo')
    await screen.findByRole('heading', { name: 'Catálogo' })
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'n',
      ctrlKey: true,
    })

    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('falls back to the command trigger when the help opener is removed', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    fireEvent.keyDown(document, { key: '?' })
    const dialog = screen.getByRole('dialog', { name: 'Ayuda de teclado' })
    opener.remove()

    fireEvent.keyDown(dialog, { key: 'Escape' })

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /buscar o ejecutar comando/i }),
      ),
    )
    await new Promise<void>((resolve) => window.requestAnimationFrame(resolve))
  })

  it('shows Nueva Clase in catalog and restores the opener on Escape', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'origin'
    document.body.append(opener)
    opener.focus()
    renderAt('/catalogo')
    await screen.findByRole('heading', { name: 'Catálogo' })

    fireEvent.keyDown(document, { key: '?', shiftKey: true })
    const dialog = screen.getByRole('dialog', { name: 'Ayuda de teclado' })
    const catalogSection = within(dialog).getByRole('heading', {
      name: 'Catálogo',
    }).parentElement
    expect(catalogSection).toHaveTextContent('N — Nueva Clase')
    expect(dialog).toHaveFocus()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(opener)
  })
})

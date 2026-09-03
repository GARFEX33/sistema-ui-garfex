import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../src/app/providers/AppProviders'
import { createAppRouter } from '../../src/app/router'

function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] })
  const testRouter = createAppRouter(history)
  return render(<AppProviders router={testRouter} />)
}

describe('runtime shell and operations inbox entry', () => {
  it('redirects the initial location to /bandeja and exposes the workstation shell', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeVisible()
    expect(screen.getByRole('banner')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Bandeja' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('img', { name: 'GARFEX' })).toHaveAttribute(
      'src',
      '/docs/garfex-blanco-negativo.svg',
    )
    expect(
      screen.getByRole('button', { name: /Buscar o ejecutar comando/ }),
    ).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        /23|Administrador|Sincronizado|sin pendientes|sin resultados/i,
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: /detalle|panel/i }),
    ).not.toBeInTheDocument()
  })

  it('renders workstation destinations without product data effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem')
    renderAt('/bandeja')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live]')).not.toBeInTheDocument()
  })

  it('preserves native keys and moves through the local sidebar group', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })
    const [inbox, catalog] = screen.getAllByRole('link')

    inbox.focus()
    for (const event of [
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    ]) {
      inbox.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    for (const modifier of [
      'shiftKey',
      'ctrlKey',
      'metaKey',
      'altKey',
    ] as const) {
      const modified = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        [modifier]: true,
        bubbles: true,
        cancelable: true,
      })
      inbox.dispatchEvent(modified)
      expect(modified.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(inbox)
    }
    const noTarget = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    inbox.dispatchEvent(noTarget)
    expect(noTarget.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(inbox)
    fireEvent.keyDown(inbox, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(catalog)
    fireEvent.keyDown(catalog, { key: 'Home' })
    expect(document.activeElement).toBe(inbox)
    fireEvent.keyDown(inbox, { key: 'End' })
    expect(document.activeElement).toBe(catalog)
    fireEvent.keyDown(catalog, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(inbox)
  })

  it('hands ArrowRight from the sidebar to an opted-in workspace target', async () => {
    renderAt('/catalogo')
    await screen.findByRole('heading', { name: 'Catálogo' })
    const inbox = screen.getByRole('link', { name: 'Catálogo' })
    const command = screen.getByRole('button', { name: 'Nueva Clase' })
    command.setAttribute('data-spatial-id', 'command')
    Object.defineProperty(inbox, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 1 }],
    })
    Object.defineProperty(command, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 1 }],
    })
    vi.spyOn(inbox, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(command, 'getBoundingClientRect').mockReturnValue({
      left: 200,
      top: 0,
      right: 400,
      bottom: 40,
      width: 200,
      height: 40,
      x: 200,
      y: 0,
      toJSON: () => ({}),
    })

    inbox.focus()
    const handoff = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    inbox.dispatchEvent(handoff)
    expect(handoff.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(command)
  })

  it('hands ArrowLeft from an opted-in workspace target to the active route', async () => {
    renderAt('/catalogo')
    await screen.findByRole('heading', { name: 'Catálogo' })
    const catalog = screen.getByRole('link', { name: 'Catálogo' })
    const target = screen.getByRole('button', { name: 'Nueva Clase' })
    target.setAttribute('data-spatial-id', 'create-class')
    Object.defineProperty(catalog, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 1 }],
    })
    Object.defineProperty(target, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 1 }],
    })
    vi.spyOn(catalog, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 200,
      top: 0,
      right: 500,
      bottom: 60,
      width: 300,
      height: 60,
      x: 200,
      y: 0,
      toJSON: () => ({}),
    })

    target.focus()
    const stopAtTarget = (event: KeyboardEvent) => event.preventDefault()
    target.addEventListener('keydown', stopAtTarget)
    fireEvent.keyDown(target, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(target)
    target.removeEventListener('keydown', stopAtTarget)

    const handoff = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    target.dispatchEvent(handoff)
    expect(handoff.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(catalog)
  })

  it('resolves /catalogo inside the shell and marks its destination active', async () => {
    renderAt('/catalogo')
    expect(
      await screen.findByRole('heading', { name: 'Catálogo' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Bandeja' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('region', { name: 'Familias' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('region', { name: 'Tipos' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})

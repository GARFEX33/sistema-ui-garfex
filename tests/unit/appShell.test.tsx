import { render, screen } from '@testing-library/react'
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

  it('renders /bandeja without product data effects or future destinations', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem')
    renderAt('/bandeja')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live]')).not.toBeInTheDocument()
  })
})

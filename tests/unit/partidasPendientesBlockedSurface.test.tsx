import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PartidasPendientesBlockedSurface } from '../../src/features/compras/PartidasPendientesBlockedSurface'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PartidasPendientesBlockedSurface', () => {
  it('communicates the unavailable cross-purchase status list and supplier-history path', () => {
    render(<PartidasPendientesBlockedSurface />)

    const surface = screen.getByRole('status')
    expect(surface).toHaveAttribute('aria-live', 'polite')
    expect(surface).toHaveClass(
      'bg-surface-subtle',
      'text-text-secondary',
      'border-dashed',
      'border-border',
    )
    expect(
      screen.getByRole('heading', {
        name: 'Partidas pendientes entre compras',
        level: 2,
      }),
    ).toBeVisible()
    expect(surface).toHaveTextContent(
      'el backend de Compras no publica hoy un listado transversal de partidas por estado',
    )
    expect(surface).toHaveTextContent(
      'abrí la compra correspondiente desde el historial de su proveedor',
    )
  })

  it('is presentational and never renders fake results or performs network work', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    render(<PartidasPendientesBlockedSurface />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

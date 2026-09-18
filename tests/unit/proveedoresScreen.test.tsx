import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProveedoresScreen } from '../../src/features/proveedores/ProveedoresScreen'

const factory = vi.hoisted(() => vi.fn())
const restWindowHook = vi.hoisted(() => vi.fn())

vi.mock('../../src/features/proveedores/proveedores.api', () => ({
  createProveedoresRestApi: factory,
}))
vi.mock('../../src/features/proveedores/useProveedoresRestWindow', () => ({
  useProveedoresRestWindow: restWindowHook,
}))

const api = { rest: true }

const supplier = (overrides: Record<string, unknown> = {}) => ({
  id: 'supplier-1',
  tradeName: 'Proveedor Uno',
  legalName: 'Proveedor Uno S.A.',
  taxIdentifier: '20-00000000-0',
  website: '',
  notes: '',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const restWindow = (overrides: Record<string, unknown> = {}) => ({
  suppliers: [supplier()],
  status: 'ready',
  hasPrevious: true,
  hasNext: true,
  previous: vi.fn(),
  next: vi.fn(),
  retry: vi.fn(),
  refetchActive: vi.fn(),
  ...overrides,
})

const renderScreen = (ui: ReactElement) => render(ui)

afterEach(() => {
  factory.mockReset()
  restWindowHook.mockReset()
})

describe('ProveedoresScreen REST read wiring', () => {
  it('creates only the REST API and supplies the active REST window with search criteria', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(restWindow())

    renderScreen(<ProveedoresScreen />)

    expect(factory).toHaveBeenCalledOnce()
    expect(restWindowHook).toHaveBeenCalledWith(api, {
      text: '',
      scope: 'ACTIVE',
      limit: 20,
    })
  })

  it('forwards the typed search text as window criteria', async () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(restWindow())

    renderScreen(<ProveedoresScreen />)
    await userEvent.setup().type(screen.getByLabelText('Buscar'), 'acme')

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({ text: 'acme' })
  })

  it('renders the initial loading state', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(
      restWindow({ suppliers: [], status: 'initial-loading' }),
    )

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('renders the empty state when the window has no suppliers', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(
      restWindow({ suppliers: [], status: 'empty' }),
    )

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay proveedores para este filtro.',
    )
  })

  it('renders the initial error state with a retry action', async () => {
    const state = restWindow({ suppliers: [], status: 'initial-error' })
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(state)

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los proveedores.',
    )
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(state.retry).toHaveBeenCalledOnce()
  })

  it('renders the navigation error state distinctly from the initial error state', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(
      restWindow({ suppliers: [], status: 'navigation-error' }),
    )

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar esta página de proveedores.',
    )
  })

  it('uses one replacement REST window with previous and next controls', async () => {
    const state = restWindow()
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(state)

    renderScreen(<ProveedoresScreen />)

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Anterior proveedores' }))
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Siguiente proveedores' }))

    expect(state.previous).toHaveBeenCalledOnce()
    expect(state.next).toHaveBeenCalledOnce()
  })

  it('disables previous/next when the window flags forbid navigation', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(
      restWindow({ hasPrevious: false, hasNext: false }),
    )

    renderScreen(<ProveedoresScreen />)

    expect(
      screen.getByRole('button', { name: 'Anterior proveedores' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Siguiente proveedores' }),
    ).toBeDisabled()
  })

  it('renders each supplier row with tradeName, legalName, taxIdentifier, active state, and spatial-nav markers', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(
      restWindow({
        suppliers: [
          supplier({
            id: 'supplier-9',
            active: false,
            taxIdentifier: '30-1-1',
          }),
        ],
      }),
    )

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByText('Proveedor Uno')).toBeVisible()
    expect(screen.getByText('Proveedor Uno S.A.')).toBeVisible()
    expect(screen.getByText('30-1-1')).toBeVisible()
    expect(screen.getByText('Inactivo')).toBeVisible()
    const row = screen.getByText('Proveedor Uno').closest('tr')
    expect(row).toHaveAttribute('data-spatial-id', 'proveedores.supplier-9')
    expect(row).toHaveAttribute('data-supplier-row')
  })

  it('marks the search input with its spatial-nav id', () => {
    factory.mockReturnValue(api)
    restWindowHook.mockReturnValue(restWindow())

    renderScreen(<ProveedoresScreen />)

    expect(screen.getByLabelText('Buscar')).toHaveAttribute(
      'data-spatial-id',
      'proveedores.search',
    )
  })
})

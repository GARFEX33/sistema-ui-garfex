import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ElegirProveedorStage,
  type ElegirProveedorStageProps,
} from '../../src/features/compras/ElegirProveedorStage'
import type { Supplier } from '../../src/features/proveedores/proveedores.types'

const makeSupplier = (
  id: string,
  tradeName: string,
  legalName: string,
  taxIdentifier: string,
) => ({ id, tradeName, legalName, taxIdentifier }) as Supplier

const suppliers = [
  makeSupplier(
    'supplier-1',
    'Acme Comercial',
    'Acme Comercial S.A.',
    '20-00000000-0',
  ),
  makeSupplier(
    'supplier-2',
    'Beta Industrial',
    'Beta Industrial S.A.',
    '30-00000000-0',
  ),
]

const makeProps = (
  overrides: Partial<ElegirProveedorStageProps> = {},
): ElegirProveedorStageProps => ({
  suppliers,
  status: 'ready',
  hasPrevious: false,
  hasNext: false,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onRetry: vi.fn(),
  onRetryNavigation: vi.fn(),
  onConfirm: vi.fn(),
  ...overrides,
})

const renderStage = (overrides: Partial<ElegirProveedorStageProps> = {}) =>
  render(<ElegirProveedorStage {...makeProps(overrides)} />)

describe('ElegirProveedorStage', () => {
  it('renders every option with fiscal id, accessible names, search, and bounded paging', async () => {
    const user = userEvent.setup()
    renderStage({ hasNext: true })

    const search = screen.getByRole('searchbox', { name: 'Proveedor' })
    expect(search).toHaveFocus()
    expect(
      screen.getByRole('listbox', { name: 'Opciones de Proveedor' }),
    ).toBeVisible()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(screen.getByText(/ID fiscal: 20-00000000-0/)).toBeVisible()
    expect(screen.getByText(/ID fiscal: 30-00000000-0/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Cargar más…' }),
    ).not.toBeInTheDocument()

    await user.type(search, 'beta')
    expect(
      screen.getByRole('option', { name: /Beta Industrial/ }),
    ).toBeVisible()
    expect(
      screen.queryByRole('option', { name: /Acme Comercial/ }),
    ).not.toBeInTheDocument()
  })

  it('maps initial loading, empty, and initial error with retry semantics', async () => {
    const retry = vi.fn()
    const user = userEvent.setup()
    const { rerender } = renderStage({
      status: 'initial-loading',
      onRetry: retry,
    })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando opciones…')
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeDisabled()

    rerender(
      <ElegirProveedorStage
        {...makeProps({ status: 'empty', suppliers: [], onRetry: retry })}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay opciones disponibles.',
    )

    rerender(
      <ElegirProveedorStage
        {...makeProps({
          status: 'initial-error',
          suppliers: [],
          onRetry: retry,
        })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('confirms the selected supplier and exposes explicit replacement navigation calls', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const { rerender } = renderStage({
      hasPrevious: true,
      hasNext: true,
      onConfirm,
      onPrevious,
      onNext,
    })

    await user.click(screen.getByRole('option', { name: /Acme Comercial/ }))
    expect(onConfirm).toHaveBeenCalledWith(suppliers[0])
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(onNext).toHaveBeenCalledOnce()

    rerender(
      <ElegirProveedorStage
        {...makeProps({
          suppliers: [suppliers[1]!],
          hasPrevious: true,
          onPrevious,
          onNext,
        })}
      />,
    )
    expect(
      screen.queryByRole('option', { name: /Acme Comercial/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /Beta Industrial/ }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onPrevious).toHaveBeenCalledOnce()
  })

  it('disables navigation while replacement loads and offers direction-specific retry', async () => {
    const user = userEvent.setup()
    const onRetryNavigation = vi.fn()
    const { rerender } = renderStage({
      hasNext: true,
      onRetryNavigation,
    })
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    rerender(
      <ElegirProveedorStage
        {...makeProps({
          status: 'navigating',
          suppliers,
          hasNext: true,
          onRetryNavigation,
        })}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Cargando opciones…')
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeDisabled()

    rerender(
      <ElegirProveedorStage
        {...makeProps({
          status: 'navigation-error',
          suppliers: [],
          onRetryNavigation,
        })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar la página siguiente.',
    )
    await user.click(
      screen.getByRole('button', { name: 'Reintentar página siguiente' }),
    )
    expect(onRetryNavigation).toHaveBeenCalledOnce()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/folio/i)).not.toBeInTheDocument()
  })
})

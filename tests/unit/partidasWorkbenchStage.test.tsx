import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PartidasWorkbenchFilters } from '../../src/features/compras/PartidasWorkbenchStage'
import { PartidasWorkbenchStage } from '../../src/features/compras/PartidasWorkbenchStage'
import type { PurchaseLineWorkbenchRow } from '../../src/features/compras/compras.types'

const row = (overrides: Partial<PurchaseLineWorkbenchRow> = {}) =>
  ({
    lineId: 'line-1',
    purchaseId: 'purchase-1',
    lineNumber: 1,
    issuedAt: '2026-01-15',
    series: 'A',
    folio: '42',
    cfdiUuid: 'uuid-unique-sat-identity',
    supplierId: 'supplier-1',
    supplierDisplayName: 'Proveedor Uno',
    description: 'Tornillo hexagonal',
    supplierSku: 'XML-SKU-1',
    commercialSupplierSku: null,
    satProductCode: '7318',
    quantity: '3',
    unitCode: 'H87',
    unit: 'Pieza',
    unitPrice: '10.50',
    amount: '31.50',
    currency: 'MXN',
    supplierProductId: 'supplier-product-1',
    mappingRevision: '2',
    resolutionRevision: '3',
    resourceId: 'resource-1',
    resourceIdentity: 'SKU-RESOURCE-1',
    resourceDisplayName: 'Tornillo maestro',
    resolutionOverride: 'NONE',
    effectiveStatus: 'PENDIENTE',
    effectiveCause: 'UNRESOLVED',
    ...overrides,
  }) as PurchaseLineWorkbenchRow

const filters: PartidasWorkbenchFilters = {
  supplierId: '',
  dateFrom: '',
  dateTo: '',
  invoice: '',
  supplierSku: '',
  description: '',
  status: undefined,
}

const props = (
  overrides: Partial<React.ComponentProps<typeof PartidasWorkbenchStage>> = {},
) => ({
  filters,
  supplierOptions: [{ id: 'supplier-1', label: 'Proveedor Uno' }],
  rows: [row()],
  status: 'ready' as const,
  hasPrevious: false,
  hasNext: false,
  onFiltersChange: vi.fn(),
  onResolve: vi.fn(),
  onInspectDocument: vi.fn(),
  onRetry: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  ...overrides,
})

describe('PartidasWorkbenchStage', () => {
  it('renders controlled filters and reports changes without gating the workbench', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<PartidasWorkbenchStage {...props({ onFiltersChange })} />)

    expect(screen.getByRole('combobox', { name: 'Proveedor' })).toHaveValue('')
    expect(screen.getByRole('searchbox', { name: 'Factura' })).toHaveValue('')
    expect(
      screen.getByRole('columnheader', { name: 'Descripción' }),
    ).toBeVisible()

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Proveedor' }),
      'supplier-1',
    )
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...filters,
      supplierId: 'supplier-1',
    })

    fireEvent.change(screen.getByRole('textbox', { name: 'SKU proveedor' }), {
      target: { value: 'ABC' },
    })
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...filters,
      supplierSku: 'ABC',
    })
  })

  it('exposes status quick filters as pressed buttons', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(
      <PartidasWorkbenchStage
        {...props({
          filters: { ...filters, status: 'VINCULADO' },
          onFiltersChange,
        })}
      />,
    )

    expect(screen.getByRole('button', { name: 'VINCULADO' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await user.click(screen.getByRole('button', { name: 'PENDIENTE' }))
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      status: 'PENDIENTE',
    })
    await user.click(screen.getByRole('button', { name: 'Todos' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...filters,
      status: undefined,
    })
  })

  it('renders the approved workbench row and only enables linking for unresolved rows', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    const onInspectDocument = vi.fn()
    const { rerender } = render(
      <PartidasWorkbenchStage {...props({ onResolve, onInspectDocument })} />,
    )

    expect(screen.getByText('2026-01-15')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Inspeccionar documento A-42' }),
    ).toBeVisible()
    expect(
      screen.getByText('CFDI UUID: uuid-unique-sat-identity'),
    ).toBeVisible()
    const dataRow = screen.getAllByRole('row')[1]
    expect(dataRow).toHaveTextContent('Proveedor Uno')
    expect(screen.getByText('XML-SKU-1')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    expect(screen.getByText('Pieza')).toBeVisible()
    expect(screen.getByText('10.50')).toBeVisible()
    expect(screen.getByText('31.50 MXN')).toBeVisible()
    expect(screen.getByText('Tornillo maestro')).toBeVisible()
    expect(screen.getByText('SKU-RESOURCE-1')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Inspeccionar documento A-42' }),
    )
    expect(onInspectDocument).toHaveBeenCalledWith(
      expect.objectContaining({ lineId: 'line-1' }),
    )
    await user.click(screen.getByRole('button', { name: 'Vincular' }))
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ lineId: 'line-1' }),
    )

    rerender(
      <PartidasWorkbenchStage
        {...props({ rows: [row({ resolutionOverride: 'NO_APLICA' })] })}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Vincular' }),
    ).not.toBeInTheDocument()
  })

  it('renders loading, error, empty, navigation and pagination states', () => {
    const onRetry = vi.fn()
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const { rerender } = render(
      <PartidasWorkbenchStage
        {...props({ status: 'initial-loading', onRetry })}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Cargando partidas')

    rerender(
      <PartidasWorkbenchStage
        {...props({ status: 'initial-error', onRetry })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las partidas',
    )
    expect(
      screen.getByRole('button', { name: 'Reintentar partidas' }),
    ).toBeVisible()

    rerender(<PartidasWorkbenchStage {...props({ status: 'empty' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('No hay partidas')

    rerender(
      <PartidasWorkbenchStage
        {...props({
          status: 'navigating',
          hasPrevious: true,
          hasNext: true,
          onPrevious,
          onNext,
        })}
      />,
    )
    expect(screen.getByText('Cargando página…')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()

    rerender(
      <PartidasWorkbenchStage
        {...props({ hasPrevious: true, hasNext: true, onPrevious, onNext })}
      />,
    )
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('shows the resource identity fallback when no display name exists', () => {
    render(
      <PartidasWorkbenchStage
        {...props({ rows: [row({ resourceDisplayName: null })] })}
      />,
    )
    expect(screen.getByText('SKU-RESOURCE-1')).toBeVisible()
  })
})

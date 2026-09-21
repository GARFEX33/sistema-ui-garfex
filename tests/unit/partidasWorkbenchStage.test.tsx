import { fireEvent, render, screen, within } from '@testing-library/react'
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
    issuedAt: '2026-01-15T14:30:00.000Z',
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
  offset: 0,
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
  it('renders primary filters and reports controlled changes without gating the workbench', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<PartidasWorkbenchStage {...props({ onFiltersChange })} />)

    expect(screen.getByRole('heading', { name: 'Partidas' })).toBeVisible()
    expect(
      screen.getByText(
        'Seleccioná una partida para vincularla a un Recurso Maestro.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Proveedor' })).toHaveValue('')
    expect(
      screen.getByRole('searchbox', { name: 'Factura o referencia' }),
    ).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue('')
    expect(screen.getByText('Más filtros')).toBeVisible()
    expect(screen.getByText('›')).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen.queryByRole('textbox', { name: 'SKU proveedor XML' }),
    ).not.toBeVisible()

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Proveedor' }),
      'supplier-1',
    )
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...filters,
      supplierId: 'supplier-1',
    })

    await user.click(screen.getByText('Más filtros'))
    expect(
      screen.getByRole('textbox', { name: 'SKU proveedor XML' }),
    ).toBeVisible()
    fireEvent.change(
      screen.getByRole('textbox', { name: 'SKU proveedor XML' }),
      {
        target: { value: 'ABC' },
      },
    )
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...filters,
      supplierSku: 'ABC',
    })
  })

  it('shows the active secondary count and resets the exact controlled filter shape', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    const activeFilters = {
      supplierId: 'supplier-1',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      invoice: 'A-42',
      supplierSku: 'ABC',
      description: 'Tornillo',
      status: 'VINCULADO' as const,
    }
    const { rerender } = render(
      <PartidasWorkbenchStage
        {...props({ filters: activeFilters, onFiltersChange })}
      />,
    )

    expect(screen.getByText('3 filtros secundarios activos')).toBeVisible()
    const clear = screen.getByRole('button', { name: 'Limpiar filtros' })
    expect(clear).toBeVisible()
    await user.click(clear)
    expect(onFiltersChange).toHaveBeenCalledWith(filters)

    rerender(
      <PartidasWorkbenchStage
        {...props({
          filters: { ...activeFilters, dateTo: '', supplierSku: '' },
          onFiltersChange,
        })}
      />,
    )
    expect(screen.getByText('1 filtro secundario activo')).toBeVisible()
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

    expect(screen.getByRole('button', { name: 'Vinculado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Vinculado' })).toHaveClass(
      'min-h-0',
      'border-transparent',
    )
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Suspendido' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'No aplica' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Conflicto' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Pendiente' }))
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

  it('renders the approved workbench row and exposes the Recurso Maestro action', () => {
    render(<PartidasWorkbenchStage {...props()} />)

    expect(screen.getByText('15/01/2026')).toBeVisible()
    expect(screen.getByTitle('2026-01-15T14:30:00.000Z')).toHaveAttribute(
      'dateTime',
      '2026-01-15T14:30:00.000Z',
    )
    expect(
      screen.getByRole('button', { name: 'Inspeccionar documento A-42' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Inspeccionar documento A-42' }),
    ).not.toHaveClass('border-primary')
    expect(
      screen.getByText('CFDI UUID: uuid-unique-sat-identity'),
    ).toBeVisible()
    const dataRow = screen.getAllByRole('row')[1]
    expect(dataRow).toHaveTextContent('Proveedor Uno')
    expect(screen.getByText('XML SKU: XML-SKU-1')).toBeVisible()
    expect(screen.getByText('SAT 7318')).toBeVisible()
    expect(screen.getByText('3 Pieza')).toBeVisible()
    expect(screen.getByText('Precio unitario: 10.50')).toBeVisible()
    expect(screen.getByText('Total: 31.50 MXN')).toBeVisible()
    expect(screen.getByText('Tornillo maestro')).toBeVisible()
    expect(screen.getByText('Identidad: SKU-RESOURCE-1')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Vincular partida 1 a un Recurso Maestro',
      }),
    ).toHaveTextContent('Vincular')
    expect(
      screen.getByTitle('Vincular partida 1 a un Recurso Maestro'),
    ).toBeVisible()
    expect(dataRow).toHaveAttribute(
      'aria-label',
      'Vincular partida 1 a un Recurso Maestro',
    )
    expect(dataRow).toHaveAttribute('tabindex', '0')
  })

  it('keeps the table bounded with a sticky header and first action column', () => {
    render(<PartidasWorkbenchStage {...props()} />)

    const region = screen.getByRole('table').parentElement
    const dataRow = screen.getAllByRole('row')[1]
    const actionCell = dataRow.querySelector('td')
    expect(region).toBeInstanceOf(HTMLElement)
    expect(region).toHaveClass('min-h-0', 'flex-1', 'overflow-auto')
    expect(region).not.toHaveClass('max-h-96')
    expect(screen.getByRole('columnheader', { name: 'Fecha' })).toHaveClass(
      'sticky',
      'top-0',
      'z-10',
      'bg-surface-subtle',
    )
    expect(screen.getByRole('columnheader', { name: 'Acción' })).toHaveClass(
      'sticky',
      'left-0',
      'top-0',
      'z-20',
      'bg-surface-subtle',
      'border-r',
      'border-border',
    )
    expect(actionCell).not.toBeNull()
    expect(actionCell).toHaveClass(
      'sticky',
      'left-0',
      'z-10',
      'bg-surface',
      'border-r',
      'border-border',
    )
  })

  it('resolves an eligible row from a non-interactive mouse click, Enter, and Space', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    render(<PartidasWorkbenchStage {...props({ onResolve })} />)
    const dataRow = screen.getAllByRole('row')[1]

    await user.click(within(dataRow).getByText('Proveedor Uno'))
    expect(onResolve).toHaveBeenCalledTimes(1)

    dataRow.focus()
    await user.keyboard('{Enter}')
    expect(onResolve).toHaveBeenCalledTimes(2)

    await user.keyboard(' ')
    expect(onResolve).toHaveBeenCalledTimes(3)
  })

  it('prevents page scrolling when Space activates an eligible row', () => {
    const onResolve = vi.fn()
    render(<PartidasWorkbenchStage {...props({ onResolve })} />)
    const dataRow = screen.getAllByRole('row')[1]

    dataRow.focus()
    const wasNotDefault = fireEvent.keyDown(dataRow, {
      key: ' ',
      code: 'Space',
    })

    expect(wasNotDefault).toBe(false)
    expect(onResolve).toHaveBeenCalledTimes(1)
  })

  it('keeps explicit resolver and document actions isolated and exactly once', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    const onInspectDocument = vi.fn()
    render(
      <PartidasWorkbenchStage {...props({ onResolve, onInspectDocument })} />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Vincular partida 1 a un Recurso Maestro',
      }),
    )
    expect(onResolve).toHaveBeenCalledTimes(1)
    expect(onInspectDocument).not.toHaveBeenCalled()

    const documentButton = screen.getByRole('button', {
      name: 'Inspeccionar documento A-42',
    })
    await user.click(documentButton)
    documentButton.focus()
    await user.keyboard('{Enter}')

    expect(onInspectDocument).toHaveBeenCalledTimes(2)
    expect(onResolve).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['VINCULADO', {}],
    ['SUSPENDIDO', {}],
    ['NO_APLICA', {}],
    ['CONFLICTO', {}],
    ['PENDIENTE', { resolutionOverride: 'NO_APLICA' }],
  ] as const)(
    'does not expose resolver triggers for ineligible row %s',
    async (status, overrides) => {
      const user = userEvent.setup()
      const onResolve = vi.fn()
      render(
        <PartidasWorkbenchStage
          {...props({
            rows: [row({ effectiveStatus: status, ...overrides })],
            onResolve,
          })}
        />,
      )
      const dataRow = screen.getAllByRole('row')[1]

      expect(dataRow).not.toHaveAttribute('tabindex', '0')
      expect(
        screen.queryByRole('button', {
          name: 'Vincular partida 1 a un Recurso Maestro',
        }),
      ).not.toBeInTheDocument()

      await user.click(within(dataRow).getByText('Proveedor Uno'))
      fireEvent.keyDown(dataRow, { key: 'Enter' })
      fireEvent.keyDown(dataRow, { key: ' ', code: 'Space' })
      expect(onResolve).not.toHaveBeenCalled()
    },
  )

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
          offset: 20,
          hasPrevious: true,
          hasNext: true,
          onPrevious,
          onNext,
        })}
      />,
    )
    expect(screen.getByText('Cargando página…')).toBeVisible()
    expect(screen.getByRole('navigation')).toHaveTextContent(
      'Mostrando 21–21 · Más resultados disponibles',
    )
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

  it('adds truncation metadata to long hierarchy values', () => {
    render(
      <PartidasWorkbenchStage
        {...props({
          rows: [
            row({
              description: 'Descripción de partida demasiado extensa',
              cfdiUuid: 'uuid-muy-largo-para-la-inspeccion-completa',
              resourceDisplayName: 'Recurso maestro con nombre extenso',
            }),
          ],
        })}
      />,
    )

    expect(
      screen.getByText('Descripción de partida demasiado extensa'),
    ).toHaveClass('truncate')
    expect(
      screen.getByText('Descripción de partida demasiado extensa'),
    ).toHaveAttribute('title', 'Descripción de partida demasiado extensa')
    expect(
      screen.getByTitle('uuid-muy-largo-para-la-inspeccion-completa'),
    ).toHaveClass('truncate')
    expect(
      screen.getByText('Recurso maestro con nombre extenso'),
    ).toHaveAttribute('title', 'Recurso maestro con nombre extenso')
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompraDetalleStage } from '../../src/features/compras/CompraDetalleStage'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import type {
  Purchase,
  PurchaseLine,
  SupplierProduct,
} from '../../src/features/compras/compras.types'

const purchase = {
  id: 'purchase-900',
  supplierId: 'supplier-77',
  branchId: 'branch-9',
  cfdiUuid: 'uuid-900',
  series: 'FAC',
  folio: '000900',
  issuedAt: '2026-09-20T12:34:56.000Z',
  currency: 'MXN',
  exchangeRate: '9876543210.12345678901234567890',
  subtotal: '1234567890.12345678901234567890',
  discount: '0.00000000000000000001',
  taxTransferred: '197530862.41975308641975308642',
  taxWithheld: '0.00000000000000000002',
  total: '1432098765.43209876543209876531',
  issuerTaxId: 'RFC900',
  issuerName: 'Emisor de prueba',
  xml: { filename: 'factura-900.xml', hash: 'sha-900' },
  importedAt: '2026-09-20T13:00:00.000Z',
  createdAt: '2026-09-20T13:15:00.000Z',
  updatedAt: '2026-09-21T08:45:00.000Z',
} satisfies Purchase

const line = (
  number: number,
  status: PurchaseLine['effectiveStatus'] = 'SUSPENDIDO',
  supplierProductId: string | null = 'supplier-product-1',
): PurchaseLine => ({
  id: `line-${number}`,
  purchaseId: purchase.id,
  lineNumber: number,
  description: `Descripción ${number}`,
  supplierSku: `SKU-${number}`,
  satProductCode: `SAT-${number}`,
  quantity: '2.00000000000000000001',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '123456789.12345678901234567890',
  amount: '246913578.24691357802469135780',
  discount: '0.00000000000000000001',
  taxTransferred: '39.50617283950617283950',
  taxWithheld: '0.00000000000000000002',
  taxObject: '02',
  supplierProductId,
  resolutionRevision: '4',
  resolutionOverride: 'NONE',
  effectiveStatus: status,
  effectiveCause: 'RESOURCE_INACTIVE',
})

const supplierProduct = (
  id = 'supplier-product-1',
  resourceId: string | null = 'resource-1',
): SupplierProduct => ({
  id,
  supplierId: purchase.supplierId,
  supplierSku: `SKU-${id}`,
  description: `Producto publicado ${id}`,
  resourceId,
  mappingRevision: '8',
  resourceActive: resourceId !== null,
  mappingState: resourceId === null ? 'UNRESOLVED' : 'SUSPENDED',
  mappingCause: resourceId === null ? 'UNRESOLVED' : 'RESOURCE_INACTIVE',
  notes: 'Nota de inspección',
  createdAt: '2026-09-20',
  updatedAt: '2026-09-21',
})

const apiFor = (overrides: Partial<ComprasRestApi> = {}) =>
  ({
    getPurchase: vi.fn().mockResolvedValue(purchase),
    listPurchaseLines: vi.fn().mockResolvedValue([line(1)]),
    getSupplierProduct: vi
      .fn()
      .mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(supplierProduct(id)),
      ),
    ...overrides,
  }) as unknown as Pick<
    ComprasRestApi,
    'getPurchase' | 'listPurchaseLines' | 'getSupplierProduct'
  >

const renderStage = (
  api: Pick<
    ComprasRestApi,
    'getPurchase' | 'listPurchaseLines' | 'getSupplierProduct'
  >,
  onBack = vi.fn(),
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return {
    onBack,
    ...render(
      <QueryClientProvider client={client}>
        <CompraDetalleStage
          api={api}
          purchaseId={purchase.id}
          onBack={onBack}
        />
      </QueryClientProvider>,
    ),
  }
}

describe('CompraDetalleStage', () => {
  it('reads purchase, lines, and unique supplier products with one detail signal', async () => {
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValue([
        line(1),
        line(2, 'VINCULADO', 'supplier-product-1'),
        line(3, 'PENDIENTE', null),
      ])
    const getSupplierProduct = vi
      .fn()
      .mockImplementation(
        ({ id, signal }: { id: string; signal: AbortSignal }) => {
          expect(signal).toBeInstanceOf(AbortSignal)
          return Promise.resolve(supplierProduct(id))
        },
      )
    renderStage({ getPurchase, listPurchaseLines, getSupplierProduct })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle')
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const signal = getPurchase.mock.calls[0][0].signal
    expect(listPurchaseLines).toHaveBeenCalledWith({
      purchaseId: purchase.id,
      signal,
    })
    expect(getSupplierProduct).toHaveBeenCalledOnce()
    expect(getSupplierProduct).toHaveBeenCalledWith({
      id: 'supplier-product-1',
      signal,
    })
  })

  it('shows immutable document data and authoritative inspection facts without actions', async () => {
    renderStage(apiFor())
    await screen.findByText('Emisor de prueba')

    expect(
      screen.getByRole('region', { name: 'Datos originales de la compra' }),
    ).toHaveTextContent('factura-900.xml')
    expect(screen.getByText('9876543210.12345678901234567890')).toBeVisible()

    const lines = screen.getByRole('region', {
      name: 'Relaciones de partidas',
    })
    expect(lines).toHaveTextContent('ID de partida: line-1')
    expect(lines).toHaveTextContent('Resolución: revisión 4')
    expect(lines).toHaveTextContent('Override: NONE')
    expect(lines).toHaveTextContent('Causa efectiva: RESOURCE_INACTIVE')
    expect(lines).toHaveTextContent(
      'Producto de Proveedor: Producto publicado supplier-product-1',
    )
    expect(lines).toHaveTextContent('SKU publicado: SKU-supplier-product-1')
    expect(lines).toHaveTextContent('Revisión de mapping: 8')
    expect(lines).toHaveTextContent('Estado de mapping: SUSPENDED')
    expect(lines).toHaveTextContent('Causa de mapping: RESOURCE_INACTIVE')
    expect(lines).toHaveTextContent('Recurso Maestro: resource-1')
    expect(lines).toHaveTextContent('Recurso activo: Sí')
    expect(
      screen.getByRole('status', { name: 'Estado: Suspendido' }),
    ).toBeVisible()
    expect(
      screen.getByText('Para resolver una partida, volvé a Partidas.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /Vincular|Desvincular|Marcar/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('shows absent supplier-product and resource facts without inventing a relation', async () => {
    const nullableLine = line(2, 'PENDIENTE', null)
    renderStage(
      apiFor({ listPurchaseLines: vi.fn().mockResolvedValue([nullableLine]) }),
    )
    const relation = await screen.findByRole('region', {
      name: 'Relación de partida 2',
    })

    expect(relation).toHaveTextContent('Sin producto de proveedor')
    expect(relation).toHaveTextContent(
      'No hay mapping ni Recurso Maestro para inspeccionar.',
    )
    expect(
      screen.getByRole('region', { name: 'Relaciones de partidas' }),
    ).toHaveTextContent('Causa efectiva: RESOURCE_INACTIVE')
    expect(
      screen.getByRole('status', { name: 'Estado: Pendiente' }),
    ).toBeVisible()
    expect(
      screen.getByText('Para resolver una partida, volvé a Partidas.'),
    ).toBeVisible()
  })

  it('keeps focus, generic back copy, loading, and error behavior', async () => {
    const onBack = vi.fn()
    const view = renderStage(apiFor(), onBack)
    await screen.findByRole('heading', { name: 'Detalle de compra' })

    expect(
      screen.getByRole('region', { name: 'Detalle de compra' }),
    ).toHaveFocus()
    const back = screen.getByRole('button', { name: 'Volver' })
    expect(back).toBeVisible()
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledOnce()
    expect(
      view.container.querySelectorAll(
        'input, textarea, select, [contenteditable="true"]',
      ),
    ).toHaveLength(0)
  })

  it('renders empty lines and retries a failed document read', async () => {
    const empty = apiFor({ listPurchaseLines: vi.fn().mockResolvedValue([]) })
    renderStage(empty)
    expect(
      await screen.findByText('No hay partidas para esta compra.'),
    ).toBeVisible()

    const getPurchase = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(purchase)
    const listPurchaseLines = vi.fn().mockResolvedValue([])
    renderStage({ getPurchase, listPurchaseLines })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el detalle de la compra.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar detalle' }))
    expect(
      await screen.findByText('No hay partidas para esta compra.'),
    ).toBeVisible()
  })
})

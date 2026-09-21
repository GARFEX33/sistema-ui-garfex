import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CompraDetalleStage } from '../../src/features/compras/CompraDetalleStage'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { Resource } from '../../src/features/resources-master/resourcesMaster.types'
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
  status: PurchaseLine['linkStatus'],
  overrides: Partial<Pick<PurchaseLine, 'supplierProductId'>> = {},
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
  supplierProductId: number === 2 ? null : `supplier-product-${number}`,
  linkStatus: status,
  ...overrides,
})

const rows = [
  line(1, 'VINCULADO'),
  line(2, 'PENDIENTE'),
  line(3, 'CONFLICTO'),
  line(4, 'NO_APLICA'),
]
const resource = (id = 'resource-1'): Resource => ({
  id,
  identityV1: `RESOURCE-${id}`,
  scope: { classCode: 'C', familyCode: 'F', typeCode: 'T' },
  naturalUnit: 'pieza',
  active: true,
  revision: '1',
  attributes: [],
})
const supplierProduct = (
  id: string,
  resourceId: string | null = 'resource-1',
): SupplierProduct => ({
  id,
  supplierId: purchase.supplierId,
  supplierSku: `SKU-${id}`,
  description: `Producto publicado ${id}`,
  resourceId,
  notes: '',
  createdAt: '2026-09-20',
  updatedAt: '2026-09-20',
})
const resourcesApiFor = (
  listResources = vi.fn().mockResolvedValue({
    resources: [resource()],
    hasPrevious: false,
    hasNext: false,
  }),
): ResourcesMasterRestReadApi =>
  ({ listResources }) as unknown as ResourcesMasterRestReadApi
const apiFor = (overrides: Partial<ComprasRestApi> = {}) =>
  ({
    getPurchase: vi.fn().mockResolvedValue(purchase),
    listPurchaseLines: vi.fn().mockResolvedValue(rows),
    getSupplierProduct: vi
      .fn()
      .mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(supplierProduct(id)),
      ),
    linkSupplierProduct: vi.fn().mockResolvedValue({}),
    unlinkSupplierProduct: vi.fn().mockResolvedValue({}),
    setPurchaseLineLinkStatus: vi.fn().mockResolvedValue({}),
    ...overrides,
  }) as unknown as Pick<
    ComprasRestApi,
    | 'getPurchase'
    | 'listPurchaseLines'
    | 'getSupplierProduct'
    | 'linkSupplierProduct'
    | 'unlinkSupplierProduct'
    | 'setPurchaseLineLinkStatus'
  >
const renderStage = (
  api: Pick<
    ComprasRestApi,
    | 'getPurchase'
    | 'listPurchaseLines'
    | 'getSupplierProduct'
    | 'linkSupplierProduct'
    | 'unlinkSupplierProduct'
    | 'setPurchaseLineLinkStatus'
  >,
  resourcesApi?: ResourcesMasterRestReadApi,
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <CompraDetalleStage
        api={api}
        purchaseId={purchase.id}
        onBack={vi.fn()}
        resourcesApi={resourcesApi}
      />
    </QueryClientProvider>,
  )
}

describe('CompraDetalleStage', () => {
  it('reads purchase and lines with the selected id and the same Query signal', async () => {
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi.fn().mockResolvedValue(rows)
    const getSupplierProduct = vi
      .fn()
      .mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(supplierProduct(id)),
      )
    renderStage({ getPurchase, listPurchaseLines, getSupplierProduct })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle')
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const signal = getPurchase.mock.calls[0][0].signal
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(getPurchase).toHaveBeenCalledWith({ id: purchase.id, signal })
    expect(listPurchaseLines).toHaveBeenCalledWith({
      purchaseId: purchase.id,
      signal,
    })
  })

  it('shows immutable document fields, precise strings, separated relations, and all badges', async () => {
    renderStage(apiFor())
    await screen.findByText('Emisor de prueba')
    expect(
      screen.getByRole('region', { name: 'Datos originales de la compra' }),
    ).toHaveTextContent('FAC')
    expect(screen.getByText('000900')).toBeVisible()
    expect(screen.getByText('uuid-900')).toBeVisible()
    expect(screen.getByText('supplier-77')).toBeVisible()
    expect(screen.getByText('RFC900')).toBeVisible()
    expect(screen.getByText('9876543210.12345678901234567890')).toBeVisible()
    expect(screen.getByText('factura-900.xml')).toBeVisible()
    expect(screen.getByText('sha-900')).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Datos originales de partidas' }),
    ).toHaveTextContent('SAT-1')
    expect(
      screen.getByRole('region', { name: 'Relaciones de partidas' }),
    ).toHaveTextContent('supplier-product-1')
    expect(
      screen.getByRole('region', { name: 'Relaciones de partidas' }),
    ).toHaveTextContent('Sin producto de proveedor')
    expect(screen.getAllByRole('status')).toHaveLength(4)
    for (const label of ['Vinculado', 'Pendiente', 'Conflicto', 'No aplica'])
      expect(screen.getByText(label)).toBeVisible()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-1',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-2',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-4',
      }),
    ).not.toBeInTheDocument()
  })

  it('exposes exact immutable technical metadata without editable controls', async () => {
    const view = renderStage(apiFor())
    await screen.findByRole('heading', { name: 'Detalle de compra' })

    const purchaseRegion = screen.getByRole('region', {
      name: 'Datos originales de la compra',
    })
    const purchaseText = within(purchaseRegion)
    expect(
      purchaseText.getByText('ID de compra', { exact: true }),
    ).toBeVisible()
    expect(purchaseText.getByText(purchase.id, { exact: true })).toBeVisible()
    expect(
      purchaseText.getByText('ID del proveedor', { exact: true }),
    ).toBeVisible()
    expect(
      purchaseText.getByText(purchase.supplierId, { exact: true }),
    ).toBeVisible()
    expect(purchaseText.getByText('Creado el', { exact: true })).toBeVisible()
    expect(
      purchaseText.getByText(purchase.createdAt, { exact: true }),
    ).toBeVisible()
    expect(
      purchaseText.getByText('Actualizado el', { exact: true }),
    ).toBeVisible()
    expect(
      purchaseText.getByText(purchase.updatedAt, { exact: true }),
    ).toBeVisible()
    expect(
      purchaseText.getByText(purchase.xml.filename, { exact: true }),
    ).toBeVisible()
    expect(
      purchaseText.getByText(purchase.xml.hash, { exact: true }),
    ).toBeVisible()
    for (const value of [
      purchase.exchangeRate,
      purchase.subtotal,
      purchase.discount,
      purchase.taxTransferred,
      purchase.taxWithheld,
      purchase.total,
    ]) {
      expect(purchaseRegion).toHaveTextContent(value)
    }

    const linesRegion = screen.getByRole('region', {
      name: 'Datos originales de partidas',
    })
    const relationRegion = screen.getByRole('region', {
      name: 'Relaciones de partidas',
    })
    const relationText = within(relationRegion)
    for (const detailLine of rows) {
      expect(
        relationText.getByText(`ID de partida: ${detailLine.id}`, {
          exact: true,
        }),
      ).toBeVisible()
      expect(
        relationText.getAllByText(`ID de compra: ${detailLine.purchaseId}`, {
          exact: true,
        }),
      ).toHaveLength(rows.length)
      for (const value of [
        detailLine.quantity,
        detailLine.unitPrice,
        detailLine.amount,
        detailLine.discount,
        detailLine.taxTransferred,
        detailLine.taxWithheld,
      ]) {
        expect(linesRegion).toHaveTextContent(value)
      }
    }
    expect(
      view.container.querySelectorAll(
        'input, textarea, select, [contenteditable="true"]',
      ),
    ).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('mounts linking only for identified pending or conflicting lines and defers resource reads', async () => {
    const listResources = vi.fn().mockResolvedValue({
      resources: [resource()],
      hasPrevious: false,
      hasNext: false,
    })
    renderStage(
      apiFor({
        listPurchaseLines: vi
          .fn()
          .mockResolvedValue([...rows, line(5, 'PENDIENTE')]),
      }),
      resourcesApiFor(listResources),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })

    expect(listResources).not.toHaveBeenCalled()
    expect(
      screen.getAllByRole('button', {
        name: /Vincular producto de proveedor/,
      }),
    ).toHaveLength(2)
    expect(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-1',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-2',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-4',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-5',
      }),
    ).toBeVisible()

    await userEvent.setup().click(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
      }),
    )
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Proveedor: supplier-77',
    )
    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())
    expect(listResources).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'ACTIVE', limit: 20, offset: 0 }),
    )
  })

  it('sends exact link props and waits for authoritative detail reread before closing', async () => {
    let resolveAuthoritative!: (value: PurchaseLine[]) => void
    const authoritative = new Promise<PurchaseLine[]>((resolve) => {
      resolveAuthoritative = resolve
    })
    const updatedRows = rows.map((item) =>
      item.id === 'line-3' ? line(3, 'VINCULADO') : item,
    )
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce(rows)
      .mockReturnValueOnce(authoritative)
    const linkSupplierProduct = vi.fn().mockResolvedValue({})
    renderStage(
      apiFor({ getPurchase, listPurchaseLines, linkSupplierProduct }),
      resourcesApiFor(),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
      }),
    )
    await user.click(
      await screen.findByText('RESOURCE-resource-1 (ID: resource-1)'),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))

    await waitFor(() =>
      expect(linkSupplierProduct).toHaveBeenCalledWith({
        id: 'supplier-product-3',
        resourceId: 'resource-1',
      }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vinculando…' })).toBeDisabled()
    expect(screen.getByText('Conflicto')).toBeVisible()
    expect(getPurchase).toHaveBeenCalledTimes(2)

    resolveAuthoritative(updatedRows)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole('region', { name: 'Relaciones de partidas' }),
    ).toHaveTextContent('Vinculado')
  })

  it('keeps prior detail data and retries only the reread after link confirmation fails', async () => {
    const initialLine = line(3, 'CONFLICTO')
    const updatedLine = line(3, 'VINCULADO')
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce([initialLine])
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce([updatedLine])
    const confirmed = {
      id: 'supplier-product-3',
      supplierId: 'supplier-77',
      supplierSku: 'SKU-3',
      description: 'Producto confirmado',
      resourceId: 'resource-1',
      notes: '',
      createdAt: '2026-09-20',
      updatedAt: '2026-09-20',
    }
    const linkSupplierProduct = vi.fn().mockResolvedValue(confirmed)
    renderStage(
      apiFor({ listPurchaseLines, linkSupplierProduct }),
      resourcesApiFor(),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
      }),
    )
    await user.click(
      await screen.findByText('RESOURCE-resource-1 (ID: resource-1)'),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))

    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Vínculo confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(screen.getByText('Conflicto')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-3',
        hidden: true,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(3))
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Vinculado')).toBeVisible()
  })

  it.each([
    {
      name: 'null + PENDIENTE',
      line: line(2, 'PENDIENTE'),
      actions: ['Marcar como no aplicable'],
      resolvedText: null,
    },
    {
      name: 'null + CONFLICTO',
      line: line(2, 'CONFLICTO'),
      actions: ['Marcar como no aplicable'],
      resolvedText: null,
    },
    {
      name: 'null + NO_APLICA',
      line: line(2, 'NO_APLICA'),
      actions: [],
      resolvedText: 'No aplica a un recurso maestro',
    },
    {
      name: 'identified + PENDIENTE',
      line: line(1, 'PENDIENTE'),
      actions: [
        'Vincular producto de proveedor supplier-product-1',
        'Marcar como no aplicable',
      ],
      resolvedText: null,
    },
    {
      name: 'identified + CONFLICTO',
      line: line(3, 'CONFLICTO'),
      actions: [
        'Vincular producto de proveedor supplier-product-3',
        'Marcar como no aplicable',
      ],
      resolvedText: null,
    },
    {
      name: 'identified + VINCULADO',
      line: line(1, 'VINCULADO'),
      actions: ['Desvincular producto de proveedor supplier-product-1'],
      resolvedText: null,
    },
    {
      name: 'identified + NO_APLICA',
      line: line(1, 'NO_APLICA'),
      actions: [],
      resolvedText: 'No aplica a un recurso maestro',
    },
    {
      name: 'null + VINCULADO',
      line: line(2, 'VINCULADO'),
      actions: [],
      resolvedText: null,
    },
  ])(
    'mounts only the authorized relationship actions for $name without premature reads or mutations',
    async ({ line: detailLine, actions, resolvedText }) => {
      const listResources = vi.fn().mockResolvedValue({
        resources: [resource()],
        hasPrevious: false,
        hasNext: false,
      })
      const api = apiFor({
        listPurchaseLines: vi.fn().mockResolvedValue([detailLine]),
        linkSupplierProduct: vi.fn().mockResolvedValue({}),
        unlinkSupplierProduct: vi.fn().mockResolvedValue({}),
        setPurchaseLineLinkStatus: vi
          .fn()
          .mockResolvedValue({ ...detailLine, linkStatus: 'NO_APLICA' }),
      })
      renderStage(api, resourcesApiFor(listResources))
      await screen.findByRole('heading', { name: 'Detalle de compra' })

      for (const action of actions)
        expect(screen.getByRole('button', { name: action })).toBeVisible()
      expect(screen.getAllByRole('button')).toHaveLength(actions.length + 1)
      if (resolvedText) expect(screen.getByText(resolvedText)).toBeVisible()
      expect(listResources).not.toHaveBeenCalled()
      expect(api.linkSupplierProduct).not.toHaveBeenCalled()
      expect(api.unlinkSupplierProduct).not.toHaveBeenCalled()
      expect(api.setPurchaseLineLinkStatus).not.toHaveBeenCalled()
      if (detailLine.linkStatus === 'CONFLICTO') {
        expect(
          screen.getByRole('region', { name: 'Relaciones de partidas' }),
        ).not.toHaveTextContent(/causa|detectado|por conflicto/i)
      }
    },
  )

  it.each([
    { status: 'PENDIENTE' as const, allowsNoAplica: true },
    { status: 'CONFLICTO' as const, allowsNoAplica: true },
    { status: 'NO_APLICA' as const, allowsNoAplica: false },
    { status: 'VINCULADO' as const, allowsNoAplica: false },
  ])(
    'explains the missing supplier product for nullable $status without a substitute relation',
    async ({ status, allowsNoAplica }) => {
      const nullableLine = line(2, status, { supplierProductId: null })
      const getSupplierProduct = vi.fn()
      const listResources = vi.fn()
      const api = apiFor({
        listPurchaseLines: vi.fn().mockResolvedValue([nullableLine]),
        getSupplierProduct,
      })
      renderStage(api, resourcesApiFor(listResources))

      const relation = await screen.findByRole('region', {
        name: 'Relación de partida 2',
      })
      expect(relation).toHaveTextContent(
        'No existe una operación publicada para asociar esta partida a un Producto de Proveedor existente.',
      )
      expect(relation).toHaveTextContent(
        'Por eso no está disponible seleccionar ni vincular un Recurso Maestro.',
      )
      expect(relation).not.toHaveTextContent('listado transversal')
      expect(relation).not.toHaveTextContent('Vinculado')
      expect(
        screen.queryByRole('button', {
          name: /Vincular producto de proveedor/,
        }),
      ).not.toBeInTheDocument()
      expect(getSupplierProduct).not.toHaveBeenCalled()
      expect(listResources).not.toHaveBeenCalled()
      expect(api.linkSupplierProduct).not.toHaveBeenCalled()
      expect(api.unlinkSupplierProduct).not.toHaveBeenCalled()
      expect(api.setPurchaseLineLinkStatus).not.toHaveBeenCalled()

      if (allowsNoAplica) {
        expect(
          screen.getByRole('button', { name: 'Marcar como no aplicable' }),
        ).toBeVisible()
      } else {
        expect(
          screen.queryByRole('button', { name: 'Marcar como no aplicable' }),
        ).not.toBeInTheDocument()
      }
    },
  )

  it('sends the exact unlink payload and waits for the authoritative detail reread', async () => {
    let resolveAuthoritative!: (value: PurchaseLine[]) => void
    const authoritative = new Promise<PurchaseLine[]>((resolve) => {
      resolveAuthoritative = resolve
    })
    const initialLine = line(1, 'VINCULADO')
    const updatedLine = line(1, 'PENDIENTE')
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce([initialLine])
      .mockReturnValueOnce(authoritative)
    const unlinkSupplierProduct = vi.fn().mockResolvedValue({})
    renderStage(
      apiFor({ getPurchase, listPurchaseLines, unlinkSupplierProduct }),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: 'Desvincular producto de proveedor supplier-product-1',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )

    await waitFor(() =>
      expect(unlinkSupplierProduct).toHaveBeenCalledWith({
        id: 'supplier-product-1',
      }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Vinculado')).toBeVisible()

    resolveAuthoritative([updatedLine])
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Pendiente')).toBeVisible()
  })

  it('retains the prior unlink detail when reread throws and retries only the reread', async () => {
    const initialLine = line(1, 'VINCULADO')
    const updatedLine = line(1, 'PENDIENTE')
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce([initialLine])
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce([updatedLine])
    const unlinkSupplierProduct = vi.fn().mockResolvedValue({
      id: 'supplier-product-1',
      supplierId: purchase.supplierId,
      supplierSku: 'SKU-1',
      description: 'Producto desvinculado',
      resourceId: null,
      notes: '',
      createdAt: '2026-09-20',
      updatedAt: '2026-09-20',
    })
    renderStage(
      apiFor({ getPurchase, listPurchaseLines, unlinkSupplierProduct }),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: 'Desvincular producto de proveedor supplier-product-1',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )

    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(unlinkSupplierProduct).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Desvinculación confirmada, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(screen.getByText('Vinculado')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Desvincular producto de proveedor supplier-product-1',
        hidden: true,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(3))
    expect(unlinkSupplierProduct).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Pendiente')).toBeVisible()
  })

  it('sends the exact NO_APLICA payload and waits for the authoritative detail reread', async () => {
    let resolveAuthoritative!: (value: PurchaseLine[]) => void
    const authoritative = new Promise<PurchaseLine[]>((resolve) => {
      resolveAuthoritative = resolve
    })
    const initialLine = line(1, 'PENDIENTE')
    const updatedLine = line(1, 'NO_APLICA')
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce([initialLine])
      .mockReturnValueOnce(authoritative)
    const setPurchaseLineLinkStatus = vi.fn().mockResolvedValue(updatedLine)
    renderStage(
      apiFor({ getPurchase, listPurchaseLines, setPurchaseLineLinkStatus }),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Marcar como no aplicable' }),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar marcar como no aplicable',
      }),
    )

    await waitFor(() =>
      expect(setPurchaseLineLinkStatus).toHaveBeenCalledWith({
        id: 'line-1',
        status: 'NO_APLICA',
      }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeVisible()

    resolveAuthoritative([updatedLine])
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('No aplica a un recurso maestro')).toBeVisible()
  })

  it('retains prior NO_APLICA detail and actions when reread throws, then retries only the reread', async () => {
    const initialLine = line(1, 'PENDIENTE')
    const updatedLine = line(1, 'NO_APLICA')
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce([initialLine])
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce([updatedLine])
    const setPurchaseLineLinkStatus = vi.fn().mockResolvedValue(updatedLine)
    renderStage(
      apiFor({ getPurchase, listPurchaseLines, setPurchaseLineLinkStatus }),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Marcar como no aplicable' }),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar marcar como no aplicable',
      }),
    )

    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    expect(setPurchaseLineLinkStatus).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'NO_APLICA confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(screen.getByText('Pendiente')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Marcar como no aplicable',
        hidden: true,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(3))
    expect(setPurchaseLineLinkStatus).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('No aplica a un recurso maestro')).toBeVisible()
  })

  it('reads each unique supplier product once with the detail signal and shows its published relation identity', async () => {
    const detailLines = [
      line(1, 'PENDIENTE', { supplierProductId: 'supplier-product-shared' }),
      line(2, 'PENDIENTE', { supplierProductId: null }),
      line(3, 'CONFLICTO', { supplierProductId: 'supplier-product-shared' }),
      line(4, 'VINCULADO', {
        supplierProductId: 'supplier-product-null-resource',
      }),
    ]
    const getPurchase = vi.fn().mockResolvedValue(purchase)
    const listPurchaseLines = vi.fn().mockResolvedValue(detailLines)
    const getSupplierProduct = vi
      .fn()
      .mockImplementation(
        ({ id, signal }: { id: string; signal: AbortSignal }) =>
          Promise.resolve(
            supplierProduct(
              id,
              id === 'supplier-product-null-resource' ? null : 'resource-42',
            ),
          ).then((value) => {
            expect(signal).toBeInstanceOf(AbortSignal)
            return value
          }),
      )
    renderStage(apiFor({ getPurchase, listPurchaseLines, getSupplierProduct }))

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle')
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    const signal = getPurchase.mock.calls[0][0].signal
    expect(listPurchaseLines).toHaveBeenCalledWith({
      purchaseId: purchase.id,
      signal,
    })
    expect(getSupplierProduct).toHaveBeenCalledTimes(2)
    expect(getSupplierProduct).toHaveBeenNthCalledWith(1, {
      id: 'supplier-product-shared',
      signal,
    })
    expect(getSupplierProduct).toHaveBeenNthCalledWith(2, {
      id: 'supplier-product-null-resource',
      signal,
    })
    expect(
      screen.getAllByRole('region', { name: /Relación de partida/ }),
    ).toHaveLength(4)
    expect(
      screen.getByRole('region', { name: 'Relación de partida 1' }),
    ).toHaveTextContent('SKU-supplier-product-shared')
    expect(
      screen.getByRole('region', { name: 'Relación de partida 1' }),
    ).toHaveTextContent('resource-42')
    expect(
      screen.getByRole('region', { name: 'Relación de partida 4' }),
    ).toHaveTextContent('No hay Recurso Maestro vinculado')
    expect(
      screen.getByRole('region', { name: 'Relaciones de partidas' }),
    ).toHaveTextContent('Sin producto de proveedor')
  })

  it('includes initial supplier product errors in detail loading and retries the complete read', async () => {
    const getSupplierProduct = vi
      .fn()
      .mockRejectedValueOnce(new Error('supplier product unavailable'))
      .mockResolvedValue(supplierProduct('supplier-product-1'))
    const api = apiFor({ getSupplierProduct })
    renderStage(api)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el detalle de la compra.',
    )
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar detalle' }))
    await waitFor(() => expect(getSupplierProduct).toHaveBeenCalledTimes(6))
    expect(
      await screen.findByRole('region', { name: 'Relación de partida 1' }),
    ).toHaveTextContent('Producto publicado supplier-product-1')
  })

  it('rereads all current unique supplier products after a callback and follows product-set changes', async () => {
    const initialLines = [line(1, 'PENDIENTE')]
    const updatedLines = [line(5, 'VINCULADO')]
    const listPurchaseLines = vi
      .fn()
      .mockResolvedValueOnce(initialLines)
      .mockResolvedValueOnce(updatedLines)
    const getSupplierProduct = vi
      .fn()
      .mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(
          supplierProduct(
            id,
            id === 'supplier-product-5' ? 'resource-5' : 'resource-1',
          ),
        ),
      )
    const linkSupplierProduct = vi.fn().mockResolvedValue({})
    renderStage(
      apiFor({ listPurchaseLines, getSupplierProduct, linkSupplierProduct }),
      resourcesApiFor(),
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    await userEvent.setup().click(
      screen.getByRole('button', {
        name: 'Vincular producto de proveedor supplier-product-1',
      }),
    )
    await userEvent
      .setup()
      .click(await screen.findByText('RESOURCE-resource-1 (ID: resource-1)'))
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Confirmar vínculo' }))

    await waitFor(() => expect(listPurchaseLines).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(getSupplierProduct).toHaveBeenCalledTimes(2))
    expect(getSupplierProduct).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'supplier-product-5',
        signal: expect.any(AbortSignal),
      }),
    )
    expect(
      screen.getByRole('region', { name: 'Relación de partida 5' }),
    ).toHaveTextContent('resource-5')
    expect(
      screen.queryByRole('region', { name: 'Relación de partida 1' }),
    ).not.toBeInTheDocument()
  })

  it('renders empty lines and retries an error', async () => {
    const empty = apiFor({ listPurchaseLines: vi.fn().mockResolvedValue([]) })
    renderStage(empty)
    expect(
      await screen.findByText('No hay partidas para esta compra.'),
    ).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    const getPurchase = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(purchase)
    const listPurchaseLines = vi.fn().mockResolvedValue([])
    const getSupplierProduct = vi
      .fn()
      .mockResolvedValue(supplierProduct('unused'))
    renderStage({ getPurchase, listPurchaseLines, getSupplierProduct })
    expect(await screen.findByRole('alert')).toBeVisible()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar detalle' }))
    await waitFor(() => expect(getPurchase).toHaveBeenCalledTimes(2))
  })

  it('focuses the selected detail and calls back without editing controls', async () => {
    const onBack = vi.fn()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <CompraDetalleStage
          api={apiFor()}
          purchaseId={purchase.id}
          onBack={onBack}
        />
      </QueryClientProvider>,
    )
    await screen.findByRole('heading', { name: 'Detalle de compra' })
    expect(
      screen.getByRole('region', { name: 'Detalle de compra' }),
    ).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Volver al historial' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})

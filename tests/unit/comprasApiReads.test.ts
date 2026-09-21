import { describe, expect, it, vi } from 'vitest'
import { createComprasRestApi } from '../../src/features/compras/compras.api'

const purchase = {
  id: '9223372036854775807',
  supplierId: '7',
  branchId: null,
  cfdiUuid: 'uuid-1',
  series: 'A',
  folio: '42',
  issuedAt: '2026-01-02T03:04:05',
  currency: 'MXN',
  exchangeRate: null,
  subtotal: '100.10',
  discount: '0.10',
  taxTransferred: '16.00',
  taxWithheld: '0.00',
  total: '116.00',
  issuerTaxId: 'RFC123',
  issuerName: 'Proveedor',
  xml: { hash: 'abc', filename: 'compra.xml' },
  importedAt: '2026-01-02T03:04:06Z',
  createdAt: '2026-01-02T03:04:06Z',
  updatedAt: '2026-01-02T03:04:06Z',
}
const line = {
  id: '8',
  purchaseId: purchase.id,
  lineNumber: 1,
  description: 'Cable',
  supplierSku: 'SKU-1',
  satProductCode: '12345678',
  quantity: '2.50',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '40.04',
  amount: '100.10',
  discount: '0.10',
  taxTransferred: '16.00',
  taxWithheld: '0.00',
  taxObject: '02',
  supplierProductId: '9',
  resolutionRevision: '0',
  resolutionOverride: 'NONE' as const,
  effectiveStatus: 'PENDIENTE' as const,
  effectiveCause: 'UNRESOLVED',
}
const product = {
  id: '9',
  supplierId: '7',
  supplierSku: 'SKU-1',
  description: 'Cable',
  resourceId: null,
  mappingRevision: '0',
  resourceActive: null,
  mappingState: 'UNRESOLVED' as const,
  mappingCause: 'UNRESOLVED' as const,
  notes: '',
  createdAt: '2026-01-02T03:04:06Z',
  updatedAt: '2026-01-02T03:04:06Z',
}
const workbenchRow = {
  lineId: '9223372036854775807',
  purchaseId: purchase.id,
  lineNumber: 1,
  issuedAt: '2026-01-02T03:04:05',
  series: 'A',
  folio: '42',
  cfdiUuid: 'uuid-1',
  supplierId: '7',
  supplierDisplayName: 'Proveedor',
  description: 'Cable / azul',
  supplierSku: 'SKU/A',
  commercialSupplierSku: null,
  satProductCode: '12345678',
  quantity: '2.50',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '40.04',
  amount: '100.10',
  currency: 'MXN',
  supplierProductId: null,
  mappingRevision: null,
  resolutionRevision: '18446744073709551615',
  resourceId: null,
  resourceIdentity: null,
  resourceDisplayName: null,
  resolutionOverride: 'NONE' as const,
  effectiveStatus: 'SUSPENDIDO' as const,
  effectiveCause: 'SUPPLIER_PRODUCT_SUSPENDED',
}
const workbenchPage = {
  lines: [workbenchRow],
  hasPrevious: true,
  hasNext: false,
}
const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe('compras REST read boundary', () => {
  it('reads every documented purchase and supplier-product endpoint', async () => {
    const signal = new AbortController().signal
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(purchase))
      .mockResolvedValueOnce(response(purchase))
      .mockResolvedValueOnce(response([line]))
      .mockResolvedValueOnce(
        response({ purchases: [purchase], hasPrevious: true, hasNext: false }),
      )
      .mockResolvedValueOnce(
        response({ products: [product], hasPrevious: false, hasNext: true }),
      )
      .mockResolvedValueOnce(response(product))
      .mockResolvedValueOnce(response(product))
    const api = createComprasRestApi(fetch)
    const purchasesWindow = { supplierId: '7', limit: 10, offset: 20, signal }
    const productsWindow = { supplierId: '7', limit: 10, offset: 0, signal }
    await Promise.all([
      api.getPurchase({ id: purchase.id, signal }),
      api.getPurchaseByUuid({ uuid: 'uuid/a', signal }),
      api.listPurchaseLines({ purchaseId: purchase.id, signal }),
      api.listSupplierPurchases(purchasesWindow),
      api.listSupplierProducts(productsWindow),
      api.findSupplierProduct({ supplierId: '7', sku: 'SKU/A', signal }),
      api.getSupplierProduct({ id: '9', signal }),
    ])
    expect(fetch.mock.calls.map(([path]) => path).join('|')).toBe(
      '/v1/purchases/9223372036854775807|/v1/purchases/by-uuid/uuid%2Fa|/v1/purchases/9223372036854775807/lines|/v1/suppliers/7/purchases?limit=10&offset=20|/v1/suppliers/7/products?limit=10&offset=0|/v1/suppliers/7/products/find?sku=SKU%2FA|/v1/supplier-products/9',
    )
    expect(fetch.mock.calls.map(([, init]) => init)).toEqual(
      Array.from({ length: 7 }, () => ({ signal })),
    )
  })
  it('lists the purchase-line workbench with ordered, encoded filters', async () => {
    const signal = new AbortController().signal
    const fetch = vi.fn().mockResolvedValue(response(workbenchPage))
    const api = createComprasRestApi(fetch)

    await expect(
      api.listPurchaseLineWorkbench({
        supplierId: '9223372036854775807',
        status: 'SUSPENDIDO',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        invoice: 'A/42',
        supplierSku: 'SKU/A azul',
        description: 'Cable / azul',
        limit: 50,
        offset: 100,
        signal,
      }),
    ).resolves.toEqual(workbenchPage)

    expect(fetch).toHaveBeenCalledWith(
      '/v1/purchase-lines?supplierId=9223372036854775807&status=SUSPENDIDO&dateFrom=2026-01-01&dateTo=2026-01-31&invoice=A%2F42&supplierSku=SKU%2FA+azul&description=Cable+%2F+azul&limit=50&offset=100',
      { signal },
    )
  })

  it('omits undefined filters while preserving an explicit empty filter', async () => {
    const fetch = vi.fn().mockResolvedValue(response(workbenchPage))
    const api = createComprasRestApi(fetch)

    await api.listPurchaseLineWorkbench({ invoice: '', limit: 1, offset: 0 })

    expect(fetch).toHaveBeenCalledWith(
      '/v1/purchase-lines?invoice=&limit=1&offset=0',
      { signal: undefined },
    )
  })

  it('rejects invalid workbench supplier IDs and dates before fetching', async () => {
    const fetch = vi.fn().mockResolvedValue(response(workbenchPage))
    const api = createComprasRestApi(fetch)
    const invalidInputs = [
      { supplierId: '0' },
      { supplierId: '01' },
      { supplierId: '1a' },
      { supplierId: '1'.repeat(20) },
      { dateFrom: '2023-02-29' },
      { dateFrom: '2024-02-30' },
      { dateTo: '2024-13-01' },
      { dateTo: '2024-00-01' },
      { dateTo: '2024-1-01' },
    ]

    for (const filters of invalidInputs)
      await expect(
        api.listPurchaseLineWorkbench({ ...filters, limit: 1, offset: 0 }),
      ).rejects.toThrow('Invalid compras input')

    expect(fetch).not.toHaveBeenCalled()
  })

  it('accepts valid leap and calendar dates in ordered workbench filters', async () => {
    const fetch = vi.fn().mockResolvedValue(response(workbenchPage))
    const api = createComprasRestApi(fetch)

    await api.listPurchaseLineWorkbench({
      supplierId: '9223372036854775807',
      dateFrom: '2024-02-29',
      dateTo: '2024-03-01',
      limit: 1,
      offset: 0,
    })

    expect(fetch).toHaveBeenCalledWith(
      '/v1/purchase-lines?supplierId=9223372036854775807&dateFrom=2024-02-29&dateTo=2024-03-01&limit=1&offset=0',
      { signal: undefined },
    )
  })

  it('strictly validates workbench rows and bounded pagination input', async () => {
    const fetch = vi.fn().mockResolvedValue(response(workbenchPage))
    const api = createComprasRestApi(fetch)

    await expect(
      api.listPurchaseLineWorkbench({ limit: 0, offset: 0 }),
    ).rejects.toThrow('Invalid compras input')
    await expect(
      api.listPurchaseLineWorkbench({ limit: 51, offset: 0 }),
    ).rejects.toThrow('Invalid compras input')
    await expect(
      api.listPurchaseLineWorkbench({ limit: 1, offset: -1 }),
    ).rejects.toThrow('Invalid compras input')
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(
          response({
            ...workbenchPage,
            lines: [{ ...workbenchRow, unexpected: true }],
          }),
        ),
      ).listPurchaseLineWorkbench({ limit: 1, offset: 0 }),
    ).rejects.toThrow('Invalid compras response')
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(
          response({
            ...workbenchPage,
            lines: [{ ...workbenchRow, amount: 100.1 }],
          }),
        ),
      ).listPurchaseLineWorkbench({ limit: 1, offset: 0 }),
    ).rejects.toThrow('Invalid compras response')
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(
          response({
            ...workbenchPage,
            lines: [{ ...workbenchRow, supplierId: '0' }],
          }),
        ),
      ).listPurchaseLineWorkbench({ limit: 1, offset: 0 }),
    ).rejects.toThrow('Invalid compras response')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects legacy linkStatus and incomplete supplier-product mapping reads', async () => {
    const legacyLine = { ...line, linkStatus: 'PENDIENTE' }
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(response([legacyLine])),
      ).listPurchaseLines({ purchaseId: purchase.id }),
    ).rejects.toThrow('Invalid compras response')

    const incompleteProduct = { ...product }
    delete (incompleteProduct as { mappingRevision?: string }).mappingRevision
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(response(incompleteProduct)),
      ).getSupplierProduct({ id: product.id }),
    ).rejects.toThrow('Invalid compras response')
  })

  it('preserves decimal strings and rejects unknown responses', async () => {
    await expect(
      createComprasRestApi(
        vi.fn().mockResolvedValue(response(purchase)),
      ).getPurchase({ id: purchase.id }),
    ).resolves.toMatchObject({ id: purchase.id, total: '116.00' })
    await expect(
      createComprasRestApi(async () =>
        response({ ...purchase, total: 116 }),
      ).getPurchase({ id: '7' }),
    ).rejects.toThrow('Invalid compras response')
  })

  it('preserves the REST error envelope and HTTP status for failed reads', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        response(
          { error: 'missing', code: 'NOT_FOUND', detail: 'purchase absent' },
          404,
        ),
      )
    await expect(
      createComprasRestApi(fetch).getPurchase({ id: '7' }),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      detail: 'purchase absent',
    })
  })
})

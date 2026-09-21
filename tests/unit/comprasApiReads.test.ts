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
  linkStatus: 'PENDIENTE' as const,
}
const product = {
  id: '9',
  supplierId: '7',
  supplierSku: 'SKU-1',
  description: 'Cable',
  resourceId: null,
  notes: '',
  createdAt: '2026-01-02T03:04:06Z',
  updatedAt: '2026-01-02T03:04:06Z',
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

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
  resourceId: '11',
  notes: '',
  createdAt: '2026-01-02T03:04:06Z',
  updatedAt: '2026-01-02T03:04:06Z',
}
const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})
const importResponse = (alreadyExisted: boolean) => ({
  ...purchase,
  alreadyExisted,
})

describe('compras REST mutation boundary', () => {
  it('imports multipart with actor, optional branch, accepted statuses, and signal', async () => {
    const signal = new AbortController().signal
    const file = new Blob(['<cfdi />'], { type: 'application/xml' })
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(importResponse(false), 201))
      .mockResolvedValueOnce(response(importResponse(true), 200))
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.importPurchase({ file, branchId: '3', signal }),
    ).resolves.toMatchObject({ id: purchase.id, alreadyExisted: false })
    await expect(api.importPurchase({ file, signal })).resolves.toMatchObject({
      id: purchase.id,
      alreadyExisted: true,
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    const [path, init] = fetch.mock.calls[0]
    expect(path).toBe('/v1/purchases')
    expect(init).toMatchObject({ method: 'POST', signal })
    expect(init.headers).toBeUndefined()
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('file')).toBeInstanceOf(Blob)
    expect((init.body as FormData).get('file')).toMatchObject({
      size: file.size,
      type: 'application/xml',
    })
    expect((init.body as FormData).get('actor')).toBe('operator-1')
    expect((init.body as FormData).get('branchId')).toBe('3')
    expect((fetch.mock.calls[1][1].body as FormData).has('branchId')).toBe(
      false,
    )
  })

  it('requires a resolved actor before starting any import mutation', async () => {
    const fetch = vi.fn()
    const api = createComprasRestApi(fetch, { actor: undefined })

    await expect(
      api.importPurchase({ file: new Blob(['xml']) }),
    ).rejects.toMatchObject({ name: 'RestActorConfigurationError' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    [409, 'CONFLICT', 'same UUID has different content'],
    [422, 'VALIDATION', 'invalid CFDI 4.0'],
  ] as const)(
    'preserves structured import error %s',
    async (status, code, detail) => {
      const fetch = vi
        .fn()
        .mockResolvedValue(
          response({ error: 'Import rejected', code, detail }, status),
        )
      const api = createComprasRestApi(fetch, { actor: 'operator-1' })

      await expect(
        api.importPurchase({ file: new Blob(['xml']) }),
      ).rejects.toMatchObject({
        name: 'PurchasesRestError',
        status,
        code,
        detail,
      })
    },
  )

  it('posts link, unlink, and exact link-status values with actor and signals', async () => {
    const signals = [
      new AbortController().signal,
      new AbortController().signal,
      new AbortController().signal,
    ]
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(product))
      .mockResolvedValueOnce(response({ ...product, resourceId: null }))
      .mockResolvedValueOnce(response({ ...line, linkStatus: 'NO_APLICA' }))
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.linkSupplierProduct({
        id: '9',
        resourceId: '11',
        signal: signals[0],
      }),
    ).resolves.toMatchObject({ resourceId: '11' })
    await expect(
      api.unlinkSupplierProduct({ id: '9', signal: signals[1] }),
    ).resolves.toMatchObject({ resourceId: null })
    await expect(
      api.setPurchaseLineLinkStatus({
        id: '8',
        status: 'NO_APLICA',
        signal: signals[2],
      }),
    ).resolves.toMatchObject({ linkStatus: 'NO_APLICA' })

    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      '/v1/supplier-products/9/link',
      '/v1/supplier-products/9/unlink',
      '/v1/purchase-lines/8/link-status',
    ])
    expect(fetch.mock.calls.map(([, init]) => init)).toEqual([
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: 'operator-1', resourceId: '11' }),
        signal: signals[0],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: 'operator-1' }),
        signal: signals[1],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: 'operator-1', status: 'NO_APLICA' }),
        signal: signals[2],
      },
    ])
  })

  it.each(['PENDIENTE', 'VINCULADO', 'NO_APLICA', 'CONFLICTO'] as const)(
    'accepts exact LinkStatus value %s',
    async (status) => {
      const fetch = vi
        .fn()
        .mockResolvedValue(response({ ...line, linkStatus: status }))
      const api = createComprasRestApi(fetch, { actor: 'operator-1' })

      await expect(
        api.setPurchaseLineLinkStatus({ id: '8', status }),
      ).resolves.toMatchObject({
        linkStatus: status,
      })
      expect(JSON.parse(fetch.mock.calls[0][1].body as string)).toEqual({
        actor: 'operator-1',
        status,
      })
    },
  )

  it('rejects every status outside the exact LinkStatus enum before transport', async () => {
    const fetch = vi.fn()
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.setPurchaseLineLinkStatus({ id: '8', status: 'DONE' as never }),
    ).rejects.toThrow('Invalid compras input')
    expect(fetch).not.toHaveBeenCalled()
  })
})

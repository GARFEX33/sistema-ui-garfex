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
  resourceId: '11',
  mappingRevision: '0',
  resourceActive: true,
  mappingState: 'CONFIRMED' as const,
  mappingCause: 'NONE' as const,
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
  purchase,
  lines: [line],
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

  it('rejects legacy linkStatus from imported line responses', async () => {
    const fetch = vi.fn().mockResolvedValue(
      response(
        {
          purchase,
          lines: [{ ...line, linkStatus: 'PENDIENTE' }],
          alreadyExisted: false,
        },
        201,
      ),
    )
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.importPurchase({ file: new Blob(['xml']) }),
    ).rejects.toThrow('Invalid compras response')
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

  it('exposes every frozen mutation endpoint', () => {
    const api = createComprasRestApi(vi.fn(), { actor: 'operator-1' })

    expect(api).toMatchObject({
      resolvePurchaseLine: expect.any(Function),
      setPurchaseLineResolutionOverride: expect.any(Function),
      confirmSupplierProductMapping: expect.any(Function),
      correctSupplierProductMapping: expect.any(Function),
      retireSupplierProductMapping: expect.any(Function),
      reportSupplierProductMappingConflict: expect.any(Function),
      resolveSupplierProductMappingConflict: expect.any(Function),
    })
  })

  it('posts the frozen resolution and mapping mutations with injected actor and signals', async () => {
    const resolvedLine = {
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
      resolutionRevision: '2',
      resolutionOverride: 'NONE' as const,
      effectiveStatus: 'VINCULADO' as const,
      effectiveCause: 'MAPPED',
    }
    const mapping = {
      ...product,
      mappingRevision: '4',
      resourceActive: true,
      mappingState: 'CONFIRMED' as const,
      mappingCause: 'NONE' as const,
    }
    const identity = {
      supplierProductId: '9',
      supplierId: '7',
      commercialSupplierSku: 'SKU-1',
      disposition: 'ALREADY_MAPPED' as const,
      mappingRevision: '4',
      resourceId: '11',
    }
    const signals = Array.from(
      { length: 7 },
      () => new AbortController().signal,
    )
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          line: resolvedLine,
          supplierProduct: mapping,
          commercialIdentity: identity,
        }),
      )
      .mockResolvedValueOnce(response(resolvedLine))
      .mockResolvedValueOnce(response(mapping))
      .mockResolvedValueOnce(response(mapping))
      .mockResolvedValueOnce(response(mapping))
      .mockResolvedValueOnce(response(mapping))
      .mockResolvedValueOnce(response(mapping))
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await api.resolvePurchaseLine({
      id: '8',
      reason: 'use catalog match',
      resourceId: '11',
      expectedSupplierProductId: '9',
      expectedMappingRevision: '4',
      expectedResolutionRevision: '1',
      commercialSupplierSku: '',
      signal: signals[0],
    })
    await api.setPurchaseLineResolutionOverride({
      id: '8',
      reason: 'manual exception',
      override: 'NO_APLICA',
      expectedRevision: '2',
      signal: signals[1],
    })
    await api.confirmSupplierProductMapping({
      id: '9',
      reason: 'confirmed by operator',
      resourceId: '11',
      expectedRevision: '3',
      signal: signals[2],
    })
    await api.correctSupplierProductMapping({
      id: '9',
      reason: 'corrected catalog match',
      expectedCurrentResourceId: '11',
      resourceId: '12',
      expectedRevision: '4',
      signal: signals[3],
    })
    await api.retireSupplierProductMapping({
      id: '9',
      reason: 'retired mapping',
      expectedCurrentResourceId: '12',
      expectedRevision: '5',
      signal: signals[4],
    })
    await api.reportSupplierProductMappingConflict({
      id: '9',
      reason: 'duplicate identity',
      expectedCurrentResourceId: '12',
      expectedRevision: '6',
      signal: signals[5],
    })
    await api.resolveSupplierProductMappingConflict({
      id: '9',
      reason: 'selected canonical identity',
      expectedCurrentResourceId: '12',
      resourceId: '11',
      expectedRevision: '7',
      signal: signals[6],
    })

    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      '/v1/purchase-lines/8/resolve',
      '/v1/purchase-lines/8/resolution-override',
      '/v1/supplier-products/9/mapping/confirm',
      '/v1/supplier-products/9/mapping/correct',
      '/v1/supplier-products/9/mapping/retire',
      '/v1/supplier-products/9/mapping/report-conflict',
      '/v1/supplier-products/9/mapping/resolve-conflict',
    ])
    expect(fetch.mock.calls.map(([, init]) => init)).toEqual([
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'use catalog match',
          resourceId: '11',
          expectedSupplierProductId: '9',
          expectedMappingRevision: '4',
          expectedResolutionRevision: '1',
          commercialSupplierSku: '',
        }),
        signal: signals[0],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'manual exception',
          override: 'NO_APLICA',
          expectedRevision: '2',
        }),
        signal: signals[1],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'confirmed by operator',
          resourceId: '11',
          expectedRevision: '3',
        }),
        signal: signals[2],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'corrected catalog match',
          expectedCurrentResourceId: '11',
          resourceId: '12',
          expectedRevision: '4',
        }),
        signal: signals[3],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'retired mapping',
          expectedCurrentResourceId: '12',
          expectedRevision: '5',
        }),
        signal: signals[4],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'duplicate identity',
          expectedCurrentResourceId: '12',
          expectedRevision: '6',
        }),
        signal: signals[5],
      },
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'operator-1',
          reason: 'selected canonical identity',
          expectedCurrentResourceId: '12',
          resourceId: '11',
          expectedRevision: '7',
        }),
        signal: signals[6],
      },
    ])
  })

  it('preserves explicit null snapshots and never accepts a UI actor', async () => {
    const resolvedLine = {
      ...line,
      supplierProductId: null,
      resolutionRevision: '0',
      resolutionOverride: 'NONE' as const,
      effectiveStatus: 'PENDIENTE' as const,
      effectiveCause: 'UNRESOLVED',
    }
    const productWithMapping = {
      ...product,
      resourceId: null,
      mappingRevision: '0',
      resourceActive: null,
      mappingState: 'UNRESOLVED' as const,
      mappingCause: 'UNRESOLVED' as const,
    }
    const fetch = vi.fn().mockResolvedValue(
      response({
        line: resolvedLine,
        supplierProduct: productWithMapping,
        commercialIdentity: {
          supplierProductId: '9',
          supplierId: '7',
          commercialSupplierSku: 'SKU-NEW',
          disposition: 'CREATED' as const,
          mappingRevision: '0',
          resourceId: null,
        },
      }),
    )
    const api = createComprasRestApi(fetch, { actor: 'injected-actor' })

    await api.resolvePurchaseLine({
      id: '8',
      reason: 'create identity',
      resourceId: '11',
      expectedSupplierProductId: null,
      expectedMappingRevision: null,
      expectedResolutionRevision: '0',
      commercialSupplierSku: 'SKU-NEW',
      actor: 'spoofed-actor',
    } as never)

    expect(JSON.parse(fetch.mock.calls[0][1].body as string)).toEqual({
      actor: 'injected-actor',
      reason: 'create identity',
      resourceId: '11',
      expectedSupplierProductId: null,
      expectedMappingRevision: null,
      expectedResolutionRevision: '0',
      commercialSupplierSku: 'SKU-NEW',
    })
  })

  it.each([
    ['PENDIENTE', 'UNRESOLVED'],
    ['VINCULADO', 'NONE'],
    ['SUSPENDIDO', 'RESOURCE_INACTIVE'],
    ['NO_APLICA', 'IDENTITY_CONFLICT'],
    ['CONFLICTO', 'NONE'],
  ] as const)(
    'accepts frozen PurchaseLine status %s and cause %s',
    async (effectiveStatus, effectiveCause) => {
      const fetch = vi.fn().mockResolvedValue(
        response({
          line: {
            ...line,
            supplierProductId: null,
            resolutionRevision: '0',
            resolutionOverride: 'NONE',
            effectiveStatus,
            effectiveCause,
          },
          supplierProduct: {
            ...product,
            resourceId: null,
            mappingRevision: '0',
            resourceActive: null,
            mappingState: 'UNRESOLVED',
            mappingCause: 'UNRESOLVED',
          },
          commercialIdentity: {
            supplierProductId: '9',
            supplierId: '7',
            commercialSupplierSku: 'SKU-1',
            disposition: 'REUSED',
            mappingRevision: '0',
            resourceId: null,
          },
        }),
      )
      const api = createComprasRestApi(fetch, { actor: 'operator-1' })

      await expect(
        api.resolvePurchaseLine({
          id: '8',
          reason: 'status check',
          resourceId: '11',
          expectedSupplierProductId: null,
          expectedMappingRevision: null,
          expectedResolutionRevision: '0',
          commercialSupplierSku: 'SKU-1',
        }),
      ).resolves.toMatchObject({ line: { effectiveStatus, effectiveCause } })
    },
  )

  it.each([
    { mappingState: 'UNRESOLVED', mappingCause: 'UNRESOLVED' },
    { mappingState: 'CONFIRMED', mappingCause: 'NONE' },
    { mappingState: 'SUSPENDED', mappingCause: 'RESOURCE_INACTIVE' },
    { mappingState: 'IDENTITY_CONFLICT', mappingCause: 'IDENTITY_CONFLICT' },
  ] as const)(
    'accepts frozen SupplierProduct mapping projection %s',
    async (mapping) => {
      const fetch = vi.fn().mockResolvedValue(
        response({
          ...product,
          mappingRevision: '1',
          resourceActive: mapping.mappingState === 'CONFIRMED',
          ...mapping,
        }),
      )
      const api = createComprasRestApi(fetch, { actor: 'operator-1' })

      await expect(
        api.confirmSupplierProductMapping({
          id: '9',
          reason: 'mapping check',
          resourceId: '11',
          expectedRevision: '1',
        }),
      ).resolves.toMatchObject(mapping)
    },
  )

  it('allows every resolution override and commercial identity disposition enum', async () => {
    const resolvedLine = {
      ...line,
      supplierProductId: '9',
      resolutionRevision: '1',
      resolutionOverride: 'NONE' as const,
      effectiveStatus: 'PENDIENTE' as const,
      effectiveCause: 'NONE',
    }
    const mapping = {
      ...product,
      mappingRevision: '1',
      resourceActive: true,
      mappingState: 'CONFIRMED' as const,
      mappingCause: 'NONE' as const,
    }
    const dispositions = ['CREATED', 'REUSED', 'ALREADY_MAPPED'] as const
    const fetch = vi.fn()
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    for (const override of ['NONE', 'NO_APLICA', 'CONFLICTO'] as const) {
      fetch.mockResolvedValueOnce(
        response({ ...resolvedLine, resolutionOverride: override }),
      )
      await expect(
        api.setPurchaseLineResolutionOverride({
          id: '8',
          reason: 'override check',
          override,
          expectedRevision: '1',
        }),
      ).resolves.toMatchObject({ resolutionOverride: override })
    }
    for (const disposition of dispositions) {
      fetch.mockResolvedValueOnce(
        response({
          line: resolvedLine,
          supplierProduct: mapping,
          commercialIdentity: {
            supplierProductId: '9',
            supplierId: '7',
            commercialSupplierSku: 'SKU-1',
            disposition,
            mappingRevision: '1',
            resourceId: '11',
          },
        }),
      )
      await expect(
        api.resolvePurchaseLine({
          id: '8',
          reason: 'disposition check',
          resourceId: '11',
          expectedSupplierProductId: '9',
          expectedMappingRevision: '1',
          expectedResolutionRevision: '1',
          commercialSupplierSku: '',
        }),
      ).resolves.toMatchObject({ commercialIdentity: { disposition } })
    }
  })

  it.each([
    { error: 'Conflict' },
    { error: 'Conflict', code: 'STALE_MAPPING_REVISION' },
    { error: 'Conflict', detail: 'refresh the snapshot' },
  ])('preserves optional structured error fields on 4xx: %s', async (body) => {
    const fetch = vi.fn().mockResolvedValue(response(body, 409))
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.confirmSupplierProductMapping({
        id: '9',
        reason: 'error check',
        resourceId: '11',
        expectedRevision: '1',
      }),
    ).rejects.toMatchObject({
      name: 'PurchasesRestError',
      status: 409,
      code: body.code,
      detail: body.detail,
    })
  })

  it('rejects malformed frozen responses and non-200 success statuses', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({ error: 'created response is not accepted' }, 201),
      )
      .mockResolvedValueOnce(
        response({
          ...product,
          mappingRevision: '1',
          resourceActive: true,
          mappingState: 'INVALID',
          mappingCause: 'NONE',
        }),
      )
    const api = createComprasRestApi(fetch, { actor: 'operator-1' })

    await expect(
      api.confirmSupplierProductMapping({
        id: '9',
        reason: 'status check',
        resourceId: '11',
        expectedRevision: '1',
      }),
    ).rejects.toMatchObject({ status: 201 })
    await expect(
      api.confirmSupplierProductMapping({
        id: '9',
        reason: 'malformed response',
        resourceId: '11',
        expectedRevision: '1',
      }),
    ).rejects.toThrow('Invalid compras response')
  })
})

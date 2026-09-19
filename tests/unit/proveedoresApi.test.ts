import { describe, expect, it, vi } from 'vitest'
import { createProveedoresRestApi } from '../../src/features/proveedores/proveedores.api'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'

const restSupplier = (extra: Record<string, unknown> = {}) => ({
  id: '1',
  tradeName: 'Cables del Norte',
  legalName: 'Cables del Norte S.A. de C.V.',
  taxIdentifier: 'CDN010203ABC',
  website: 'https://cablesdelnorte.example',
  notes: 'Proveedor histórico',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  ...extra,
})

const restPage = (suppliers: unknown[] = [restSupplier()]) => ({
  suppliers,
  hasPrevious: false,
  hasNext: true,
})

const restResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe('proveedores REST read boundary', () => {
  it('reads a strict SupplierPage with every documented query parameter', async () => {
    const fetch = vi.fn(async () => restResponse(restPage()))
    const api = createProveedoresRestApi(fetch)

    await expect(
      api.listSuppliers({
        scope: 'ACTIVE',
        text: 'cables & cobre',
        limit: 20,
        offset: 40,
      }),
    ).resolves.toEqual(restPage())
    expect(fetch).toHaveBeenCalledWith(
      '/v1/suppliers?scope=ACTIVE&text=cables+%26+cobre&limit=20&offset=40',
      { signal: undefined },
    )
  })

  it('omits the optional text parameter when absent', async () => {
    const fetch = vi.fn(async () => restResponse(restPage([])))
    const api = createProveedoresRestApi(fetch)

    await expect(
      api.listSuppliers({ scope: 'ALL', limit: 10, offset: 0 }),
    ).resolves.toEqual(restPage([]))
    expect(fetch).toHaveBeenCalledWith('/v1/suppliers?scope=ALL&limit=10&offset=0', {
      signal: undefined,
    })
  })

  it('rejects a malformed SupplierPage', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse({ suppliers: [{ id: '1' }], hasPrevious: false, hasNext: false }),
    )

    await expect(
      api.listSuppliers({ scope: 'ALL', limit: 10, offset: 0 }),
    ).rejects.toThrow('Invalid proveedores response')
  })

  it('rejects a documented HTTP failure for listSuppliers', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse({ error: 'request rejected' }, 400),
    )

    await expect(
      api.listSuppliers({ scope: 'ALL', limit: 10, offset: 0 }),
    ).rejects.toThrow('request rejected')
  })

  it('reads a single supplier by encoded id', async () => {
    const fetch = vi.fn(async () => restResponse(restSupplier()))
    const api = createProveedoresRestApi(fetch)

    await expect(api.getSupplier({ id: '1' })).resolves.toEqual(restSupplier())
    expect(fetch).toHaveBeenCalledWith('/v1/suppliers/1', { signal: undefined })
  })

  it('rejects a malformed Supplier detail response', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse(restSupplier({ active: 'yes' })),
    )

    await expect(api.getSupplier({ id: '1' })).rejects.toThrow(
      'Invalid proveedores response',
    )
  })

  it('surfaces a documented 404 for getSupplier', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse({ error: 'not found' }, 404),
    )

    await expect(api.getSupplier({ id: '999' })).rejects.toThrow('not found')
  })
})

describe('proveedores REST create boundary', () => {
  const createInput = {
    tradeName: 'Cables del Norte',
    legalName: 'Cables del Norte S.A. de C.V.',
    taxIdentifier: 'CDN010203ABC',
    website: 'https://cablesdelnorte.example',
    notes: 'Proveedor histórico',
  }

  it('creates a Supplier through the documented REST endpoint with the actor-gated body', async () => {
    const fetch = vi.fn(async () => restResponse(restSupplier(), 201))

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).createSupplier(
        createInput,
      ),
    ).resolves.toEqual(restSupplier())
    expect(fetch).toHaveBeenCalledWith('/v1/suppliers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor: 'proveedores-user', ...createInput }),
    })
  })

  it('fails closed without an actor and issues no fetch call', async () => {
    const fetch = vi.fn()

    await expect(
      createProveedoresRestApi(fetch, { actor: '' }).createSupplier(createInput),
    ).rejects.toBeInstanceOf(RestActorConfigurationError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('surfaces the documented ErrorEnvelope message for a non-201 response without retrying', async () => {
    for (const status of [400, 404, 409, 422, 500, 503]) {
      const fetch = vi.fn(async () =>
        restResponse({ error: 'request rejected' }, status),
      )
      await expect(
        createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).createSupplier(
          createInput,
        ),
      ).rejects.toThrow('request rejected')
      expect(fetch).toHaveBeenCalledOnce()
    }
  })

  it('falls back to an HTTP status message when the error body is not a valid envelope', async () => {
    const fetch = vi.fn(async () => restResponse({}, 409))

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).createSupplier(
        createInput,
      ),
    ).rejects.toThrow('HTTP 409')
  })

  it('rejects a 201 response whose body is not a valid Supplier', async () => {
    const fetch = vi.fn(async () =>
      restResponse(restSupplier({ createdAt: null }), 201),
    )

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).createSupplier(
        createInput,
      ),
    ).rejects.toThrow('Invalid proveedores response')
  })
})

describe('proveedores REST update boundary', () => {
  const updateInput = {
    id: '1',
    tradeName: 'Cables del Norte',
    legalName: 'Cables del Norte S.A. de C.V.',
    taxIdentifier: 'CDN010203ABC',
    website: 'https://cablesdelnorte.example',
    notes: '',
  }

  it('replaces a Supplier through PUT with the actor-gated body and no expectedRevision', async () => {
    const fetch = vi.fn(async () => restResponse(restSupplier({ notes: '' })))

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).updateSupplier(
        updateInput,
      ),
    ).resolves.toEqual(restSupplier({ notes: '' }))
    const { id, ...body } = updateInput
    expect(fetch).toHaveBeenCalledWith('/v1/suppliers/' + id, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor: 'proveedores-user', ...body }),
    })
    expect(JSON.parse((fetch.mock.calls[0]?.[1] as { body: string }).body)).not.toHaveProperty(
      'expectedRevision',
    )
  })

  it('fails closed without an actor and issues no fetch call', async () => {
    const fetch = vi.fn()

    await expect(
      createProveedoresRestApi(fetch, { actor: '' }).updateSupplier(updateInput),
    ).rejects.toBeInstanceOf(RestActorConfigurationError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('surfaces the documented ErrorEnvelope message for a non-200 response', async () => {
    const fetch = vi.fn(async () =>
      restResponse({ error: 'request rejected' }, 409),
    )

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).updateSupplier(
        updateInput,
      ),
    ).rejects.toThrow('request rejected')
  })

  it('rejects a 200 response whose body is not a valid Supplier', async () => {
    const fetch = vi.fn(async () => restResponse(restSupplier({ active: null })))

    await expect(
      createProveedoresRestApi(fetch, { actor: 'proveedores-user' }).updateSupplier(
        updateInput,
      ),
    ).rejects.toThrow('Invalid proveedores response')
  })
})

describe('proveedores REST CFDI preview boundary', () => {
  const file = new Blob(['<cfdi/>'], { type: 'application/xml' })

  it('previews a supplier draft from a CFDI XML with no existing match, and no actor is required', async () => {
    const fetch = vi.fn(async () =>
      restResponse({
        draft: {
          taxIdentifier: 'CDN010203ABC',
          legalName: 'Cables del Norte S.A. de C.V.',
          taxRegime: '601',
        },
        existing: null,
      }),
    )
    const api = createProveedoresRestApi(fetch)

    await expect(api.previewSupplierFromCfdi({ file })).resolves.toEqual({
      draft: {
        taxIdentifier: 'CDN010203ABC',
        legalName: 'Cables del Norte S.A. de C.V.',
        taxRegime: '601',
      },
      existing: null,
    })
    expect(fetch).toHaveBeenCalledWith('/v1/suppliers/from-cfdi/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/xml' },
      body: file,
      signal: undefined,
    })
  })

  it('previews a supplier draft that already owns the RFC', async () => {
    const fetch = vi.fn(async () =>
      restResponse({
        draft: {
          taxIdentifier: 'CDN010203ABC',
          legalName: 'Cables del Norte S.A. de C.V.',
          taxRegime: '601',
        },
        existing: restSupplier(),
      }),
    )
    const api = createProveedoresRestApi(fetch)

    await expect(
      api.previewSupplierFromCfdi({ file }),
    ).resolves.toMatchObject({ existing: restSupplier() })
  })

  it('surfaces the documented ErrorEnvelope message for an invalid CFDI', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse({ error: 'NOT_CFDI' }, 422),
    )

    await expect(api.previewSupplierFromCfdi({ file })).rejects.toThrow(
      'NOT_CFDI',
    )
  })

  it('rejects a malformed preview response', async () => {
    const api = createProveedoresRestApi(async () =>
      restResponse({ draft: { taxIdentifier: 'x' }, existing: null }),
    )

    await expect(api.previewSupplierFromCfdi({ file })).rejects.toThrow(
      'Invalid proveedores response',
    )
  })
})

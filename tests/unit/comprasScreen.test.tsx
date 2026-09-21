import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ComprasScreen } from '../../src/features/compras/ComprasScreen'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import type {
  Purchase,
  PurchasePage,
  SupplierProductPage,
} from '../../src/features/compras/compras.types'
import type { ProveedoresRestApi } from '../../src/features/proveedores/proveedores.api'
import type {
  Supplier,
  SupplierPage,
} from '../../src/features/proveedores/proveedores.types'

const supplier = {
  id: 'supplier-1',
  tradeName: 'Acme Comercial',
  legalName: 'Acme Comercial S.A.',
  taxIdentifier: '20-00000000-0',
  website: '',
  notes: '',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} satisfies Supplier

const fallbackSupplier = {
  ...supplier,
  id: 'supplier-2',
  tradeName: '',
  legalName: 'Beta Industrial S.A.',
  taxIdentifier: '30-00000000-0',
} satisfies Supplier

const page = (
  suppliers: Supplier[] = [supplier],
  hasPrevious = false,
  hasNext = false,
): SupplierPage => ({ suppliers, hasPrevious, hasNext })

const makeApi = (
  listSuppliers: ProveedoresRestApi['listSuppliers'],
): ProveedoresRestApi => ({ listSuppliers }) as ProveedoresRestApi

const purchase = {
  id: 'purchase-1',
  supplierId: supplier.id,
  cfdiUuid: 'uuid-1',
  series: 'A',
  folio: '100',
  issuedAt: '2026-09-19T00:00:00Z',
  currency: 'MXN',
  total: '11.60',
} as Purchase

const makePurchasesApi = (
  listSupplierPurchases: ComprasRestApi['listSupplierPurchases'],
  overrides: Partial<ComprasRestApi> = {},
): ComprasRestApi =>
  ({
    listSupplierPurchases,
    listSupplierProducts: vi.fn().mockResolvedValue({
      products: [],
      hasPrevious: false,
      hasNext: false,
    } satisfies SupplierProductPage),
    ...overrides,
  }) as ComprasRestApi

const supplierProduct = (
  id: string,
  supplierId: string,
  description = `Producto ${id}`,
) => ({
  id,
  supplierId,
  supplierSku: `SKU-${id}`,
  description,
  resourceId: null,
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

const renderScreen = (
  api: ProveedoresRestApi,
  comprasApi: ComprasRestApi = makePurchasesApi(
    vi.fn().mockResolvedValue({
      purchases: [],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage),
  ),
  strictMode = false,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const screen = (
    <QueryClientProvider client={queryClient}>
      <ComprasScreen proveedoresApi={api} comprasApi={comprasApi} />
    </QueryClientProvider>
  )
  return render(strictMode ? <StrictMode>{screen}</StrictMode> : screen)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ComprasScreen U3B2 integration', () => {
  it('mounts ElegirProveedorStage with loading state and the public supplier window', async () => {
    let resolve!: (value: SupplierPage) => void
    const listSuppliers = vi.fn(
      () => new Promise<SupplierPage>((done) => (resolve = done)),
    )
    renderScreen(makeApi(listSuppliers))

    expect(screen.getByRole('banner')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Compras', level: 1 }),
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Seleccionar proveedor' }),
    ).toBeVisible()
    expect(screen.getByText('Cargando opciones…')).toBeVisible()
    await waitFor(() => expect(listSuppliers).toHaveBeenCalledOnce())
    expect(listSuppliers).toHaveBeenCalledWith({
      text: '',
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })

    resolve(page([supplier], true, true))
    expect(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeEnabled()
  })

  it('uses the supplier confirmation transition to show context and U4A history', async () => {
    const user = userEvent.setup()
    const listSuppliers = vi.fn().mockResolvedValue(page([fallbackSupplier]))
    const listSupplierPurchases = vi.fn().mockResolvedValue({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage)
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases),
    )

    await user.click(
      await screen.findByRole('option', { name: /Beta Industrial S\.A\./ }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Historial de compras de Beta Industrial S.A.',
        level: 2,
      }),
    ).toBeVisible()
    const context = screen.getByRole('region', {
      name: 'Proveedor confirmado',
    })
    expect(context).toHaveTextContent(/Nombre\s*Beta Industrial S\.A\./)
    expect(context).toHaveTextContent(/Razón social\s*Beta Industrial S\.A\./)
    expect(context).toHaveTextContent(/ID fiscal\s*30-00000000-0/)
    expect(context).toHaveTextContent(/ID interno\s*supplier-2/)
    expect(await screen.findByRole('table')).toHaveTextContent('A-100')
    expect(listSupplierPurchases).toHaveBeenCalledWith({
      supplierId: fallbackSupplier.id,
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
    expect(
      screen.queryByText('Historial global de compras'),
    ).not.toBeInTheDocument()
  })

  it('resets the staged supplier transition when changing supplier', async () => {
    const user = userEvent.setup()
    const listSuppliers = vi
      .fn()
      .mockResolvedValue(page([supplier, fallbackSupplier]))
    renderScreen(makeApi(listSuppliers))

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Cambiar proveedor' }))

    expect(
      await screen.findByRole('searchbox', { name: 'Proveedor' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Elegí un proveedor para consultar su historial de compras.',
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole('region', { name: 'Proveedor confirmado' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('refreshes only the current supplier and clears feedback and selection on change', async () => {
    const user = userEvent.setup()
    const listSuppliers = vi
      .fn()
      .mockResolvedValue(page([supplier, fallbackSupplier]))
    const listSupplierPurchases = vi.fn().mockResolvedValue({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage)
    const importPurchase = vi
      .fn()
      .mockResolvedValueOnce({ ...purchase, alreadyExisted: false })
      .mockResolvedValueOnce({
        ...purchase,
        supplierId: 'supplier-99',
        alreadyExisted: true,
      })
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, { importPurchase }),
      true,
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await screen.findByRole('button', { name: 'Importar compra' })
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    fireEvent.change(screen.getByTestId('purchase-file'), {
      target: {
        files: [
          new File(['<cfdi />'], 'compra.xml', { type: 'application/xml' }),
        ],
      },
    })
    await waitFor(() => expect(importPurchase).toHaveBeenCalledOnce())
    expect(await screen.findByText(/Compra importada/)).toBeVisible()
    await waitFor(() => expect(listSupplierPurchases).toHaveBeenCalledTimes(2))

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar compra A-100' }),
    )
    await user.click(screen.getByRole('button', { name: 'Cambiar proveedor' }))
    expect(screen.queryByText(/Compra importada/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Compra seleccionada/)).not.toBeInTheDocument()
    await user.click(
      await screen.findByRole('option', { name: /Beta Industrial/ }),
    )
    const refreshesBeforeMismatch = listSupplierPurchases.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    fireEvent.change(screen.getByTestId('purchase-file'), {
      target: {
        files: [
          new File(['<cfdi />'], 'otra.xml', { type: 'application/xml' }),
        ],
      },
    })
    await waitFor(() => expect(importPurchase).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByText(/otro proveedor|no se actualizó/i),
    ).toBeVisible()
    expect(listSupplierPurchases).toHaveBeenCalledTimes(refreshesBeforeMismatch)
  })

  it('does not publish success until the current supplier reread succeeds', async () => {
    const user = userEvent.setup()
    const refresh = deferred<PurchasePage>()
    const listSuppliers = vi.fn().mockResolvedValue(page([supplier]))
    const listSupplierPurchases = vi
      .fn()
      .mockResolvedValueOnce({
        purchases: [purchase],
        hasPrevious: false,
        hasNext: false,
      } satisfies PurchasePage)
      .mockImplementationOnce(() => refresh.promise)
      .mockResolvedValueOnce({
        purchases: [purchase],
        hasPrevious: false,
        hasNext: false,
      } satisfies PurchasePage)
    const importPurchase = vi.fn().mockResolvedValue({
      supplierId: supplier.id,
      alreadyExisted: false,
    })
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, { importPurchase }),
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await screen.findByRole('button', { name: 'Importar compra' })
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    fireEvent.change(screen.getByTestId('purchase-file'), {
      target: {
        files: [
          new File(['<cfdi />'], 'compra.xml', { type: 'application/xml' }),
        ],
      },
    })
    await waitFor(() => expect(listSupplierPurchases).toHaveBeenCalledTimes(2))
    expect(
      screen.queryByText(
        'Compra importada. Historial del proveedor actualizado.',
      ),
    ).not.toBeInTheDocument()
    refresh.reject(new Error('refresh failed'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /compra fue importada.*no se pudo actualizar/i,
    )

    refresh.resolve({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    })
    await user.click(
      await screen.findByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(listSupplierPurchases).toHaveBeenCalledTimes(3))
    expect(
      await screen.findByText(
        'Compra importada. Historial del proveedor actualizado.',
      ),
    ).toBeVisible()
    expect(importPurchase).toHaveBeenCalledOnce()
  })

  it.each([
    {
      alreadyExisted: false,
      expectedFeedback:
        'Compra importada. Historial del proveedor actualizado.',
    },
    {
      alreadyExisted: true,
      expectedFeedback:
        'La compra ya estaba registrada. Historial del proveedor actualizado.',
    },
  ])(
    'publishes confirmed import feedback only after the current supplier reread under StrictMode',
    async ({ alreadyExisted, expectedFeedback }) => {
      const user = userEvent.setup()
      const reread = deferred<PurchasePage>()
      const listSuppliers = vi.fn().mockResolvedValue(page([supplier]))
      const listSupplierPurchases = vi
        .fn()
        .mockResolvedValueOnce({
          purchases: [],
          hasPrevious: false,
          hasNext: false,
        } satisfies PurchasePage)
        .mockImplementationOnce(() => reread.promise)
      const importPurchase = vi.fn().mockResolvedValue({
        supplierId: supplier.id,
        alreadyExisted,
      })
      renderScreen(
        makeApi(listSuppliers),
        makePurchasesApi(listSupplierPurchases, { importPurchase }),
        true,
      )

      await user.click(
        await screen.findByRole('option', { name: /Acme Comercial/ }),
      )
      await screen.findByRole('heading', {
        name: 'Historial de compras de Acme Comercial',
      })
      const refreshesBeforeImport = listSupplierPurchases.mock.calls.length
      await user.click(screen.getByRole('button', { name: 'Importar compra' }))
      fireEvent.change(screen.getByTestId('purchase-file'), {
        target: {
          files: [
            new File(['<cfdi />'], 'compra.xml', {
              type: 'application/xml',
            }),
          ],
        },
      })

      await waitFor(() => expect(importPurchase).toHaveBeenCalledTimes(1))
      await waitFor(() =>
        expect(listSupplierPurchases).toHaveBeenCalledTimes(
          refreshesBeforeImport + 1,
        ),
      )
      expect(listSupplierPurchases).toHaveBeenLastCalledWith(
        expect.objectContaining({ supplierId: supplier.id, offset: 0 }),
      )
      expect(screen.queryByText(expectedFeedback)).not.toBeInTheDocument()
      expect(
        screen.getByRole('dialog', { name: 'Importar compra desde XML' }),
      ).toBeVisible()

      reread.resolve({
        purchases: [],
        hasPrevious: false,
        hasNext: false,
      })

      expect(await screen.findByText(expectedFeedback)).toBeVisible()
      expect(
        screen.queryByRole('dialog', { name: 'Importar compra desde XML' }),
      ).not.toBeInTheDocument()
      expect(importPurchase).toHaveBeenCalledTimes(1)
      expect(listSupplierPurchases).toHaveBeenCalledTimes(
        refreshesBeforeImport + 1,
      )
    },
  )

  it('does not publish a stale success when the supplier changes during reread', async () => {
    const user = userEvent.setup()
    const refresh = deferred<PurchasePage>()
    const listSuppliers = vi
      .fn()
      .mockResolvedValue(page([supplier, fallbackSupplier]))
    const listSupplierPurchases = vi
      .fn()
      .mockResolvedValueOnce({
        purchases: [purchase],
        hasPrevious: false,
        hasNext: false,
      } satisfies PurchasePage)
      .mockImplementationOnce(() => refresh.promise)
    const importPurchase = vi.fn().mockResolvedValue({
      supplierId: supplier.id,
      alreadyExisted: true,
    })
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, { importPurchase }),
      true,
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    fireEvent.change(screen.getByTestId('purchase-file'), {
      target: {
        files: [
          new File(['<cfdi />'], 'compra.xml', { type: 'application/xml' }),
        ],
      },
    })
    await waitFor(() => expect(listSupplierPurchases).toHaveBeenCalledTimes(2))
    const changeSupplier = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Cambiar proveedor'),
    )
    expect(changeSupplier).toBeTruthy()
    fireEvent.click(changeSupplier!)
    refresh.resolve({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    })

    expect(
      await screen.findByText(
        /proveedor de la compra no coincide|no se actualizó/i,
      ),
    ).toBeVisible()
    expect(
      screen.queryByText(
        'La compra ya estaba registrada. Historial del proveedor actualizado.',
      ),
    ).not.toBeInTheDocument()
    expect(importPurchase).toHaveBeenCalledOnce()
  })

  it('suppresses stale feedback after unmount during the authoritative reread', async () => {
    const user = userEvent.setup()
    const reread = deferred<PurchasePage>()
    const listSuppliers = vi.fn().mockResolvedValue(page([supplier]))
    const listSupplierPurchases = vi
      .fn()
      .mockResolvedValueOnce({
        purchases: [],
        hasPrevious: false,
        hasNext: false,
      } satisfies PurchasePage)
      .mockImplementationOnce(() => reread.promise)
    const importPurchase = vi.fn().mockResolvedValue({
      supplierId: supplier.id,
      alreadyExisted: false,
    })
    const view = renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, { importPurchase }),
      true,
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    fireEvent.change(screen.getByTestId('purchase-file'), {
      target: {
        files: [
          new File(['<cfdi />'], 'compra.xml', { type: 'application/xml' }),
        ],
      },
    })
    await waitFor(() => expect(importPurchase).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(listSupplierPurchases).toHaveBeenCalledTimes(2))

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    view.unmount()
    reread.resolve({
      purchases: [],
      hasPrevious: false,
      hasNext: false,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(document.body).not.toHaveTextContent('Compra importada.')
    expect(consoleError).not.toHaveBeenCalled()
    expect(importPurchase).toHaveBeenCalledTimes(1)
    expect(listSupplierPurchases).toHaveBeenCalledTimes(2)
  })

  it('mounts detail only after selection, forwards the id, backs to history, and resets on supplier change', async () => {
    const user = userEvent.setup()
    const listSuppliers = vi
      .fn()
      .mockResolvedValue(page([supplier, fallbackSupplier]))
    const listSupplierPurchases = vi.fn().mockResolvedValue({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage)
    const getPurchase = vi.fn().mockResolvedValue({
      ...purchase,
      branchId: null,
      exchangeRate: null,
      subtotal: '1',
      discount: '0',
      taxTransferred: '0',
      taxWithheld: '0',
      issuerTaxId: 'RFC',
      issuerName: 'Acme',
      xml: { filename: 'purchase.xml', hash: 'hash' },
      importedAt: '',
      createdAt: '',
      updatedAt: '',
    })
    const listPurchaseLines = vi.fn().mockResolvedValue([])
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, {
        getPurchase,
        listPurchaseLines,
      }),
    )
    expect(getPurchase).not.toHaveBeenCalled()
    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await screen.findByRole('button', { name: 'Seleccionar compra A-100' })
    expect(getPurchase).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('button', { name: 'Seleccionar compra A-100' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Detalle de compra' }),
    ).toBeVisible()
    expect(getPurchase).toHaveBeenCalledWith({
      id: purchase.id,
      signal: expect.any(AbortSignal),
    })
    expect(listPurchaseLines).toHaveBeenCalledWith({
      purchaseId: purchase.id,
      signal: expect.any(AbortSignal),
    })
    await user.click(
      screen.getByRole('button', { name: 'Volver al historial' }),
    )
    expect(
      screen.getByRole('heading', { name: /Historial de compras/ }),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Seleccionar compra A-100' }),
    )
    await user.click(screen.getByRole('button', { name: 'Cambiar proveedor' }))
    expect(
      await screen.findByRole('searchbox', { name: 'Proveedor' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Detalle de compra' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the supplier page navigation scoped and never requests compras history', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const listSuppliers = vi
      .fn()
      .mockResolvedValueOnce(page([supplier], false, true))
      .mockResolvedValueOnce(page([fallbackSupplier], true, false))
    renderScreen(makeApi(listSuppliers))

    await user.click(
      await screen.findByRole('button', { name: 'Página siguiente' }),
    )
    await waitFor(() =>
      expect(listSuppliers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          scope: 'ACTIVE',
          limit: 20,
          offset: 20,
        }),
      ),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/Historial global/)).not.toBeInTheDocument()
    expect(screen.queryByText(/compras\/v1|purchases/i)).not.toBeInTheDocument()
  })

  it('does not mount product inspection or request products before supplier confirmation', () => {
    const listSupplierProducts = vi.fn()
    renderScreen(
      makeApi(vi.fn().mockResolvedValue(page([supplier]))),
      makePurchasesApi(
        vi.fn().mockResolvedValue({
          purchases: [],
          hasPrevious: false,
          hasNext: false,
        } satisfies PurchasePage),
        { listSupplierProducts },
      ),
    )

    expect(
      screen.queryByRole('region', {
        name: 'Inspección de Productos de Proveedor',
      }),
    ).not.toBeInTheDocument()
    expect(listSupplierProducts).not.toHaveBeenCalled()
  })

  it('mounts one supplier-scoped inspection stage after confirmation without auto-selection or mutation', async () => {
    const user = userEvent.setup()
    const listSupplierProducts = vi.fn().mockResolvedValue({
      products: [supplierProduct('product-1', supplier.id)],
      hasPrevious: false,
      hasNext: false,
    } satisfies SupplierProductPage)
    const linkSupplierProduct = vi.fn()
    const unlinkSupplierProduct = vi.fn()
    const setPurchaseLineLinkStatus = vi.fn()
    const importPurchase = vi.fn()
    renderScreen(
      makeApi(vi.fn().mockResolvedValue(page([supplier]))),
      makePurchasesApi(
        vi.fn().mockResolvedValue({
          purchases: [],
          hasPrevious: false,
          hasNext: false,
        } satisfies PurchasePage),
        {
          listSupplierProducts,
          linkSupplierProduct,
          unlinkSupplierProduct,
          setPurchaseLineLinkStatus,
          importPurchase,
        },
      ),
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )

    const inspection = await screen.findByRole('region', {
      name: 'Inspección de Productos de Proveedor',
    })
    expect(inspection).toHaveTextContent('Proveedor vigente: Acme Comercial')
    expect(
      await screen.findByRole('option', { name: /Producto product-1/ }),
    ).toBeVisible()
    expect(listSupplierProducts).toHaveBeenCalledOnce()
    expect(listSupplierProducts).toHaveBeenCalledWith({
      supplierId: supplier.id,
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
    expect(
      screen.queryByRole('region', {
        name: 'Detalle del Producto de Proveedor seleccionado',
      }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /Producto product-1/ }))
    expect(
      screen.getByRole('region', {
        name: 'Detalle del Producto de Proveedor seleccionado',
      }),
    ).toHaveTextContent('ID del Producto de Proveedor: product-1')
    expect(linkSupplierProduct).not.toHaveBeenCalled()
    expect(unlinkSupplierProduct).not.toHaveBeenCalled()
    expect(setPurchaseLineLinkStatus).not.toHaveBeenCalled()
    expect(importPurchase).not.toHaveBeenCalled()
  })

  it('unmounts inspection on supplier reset and starts a fresh scoped page for a new supplier', async () => {
    const user = userEvent.setup()
    const listSupplierProducts = vi.fn(
      ({
        supplierId,
        offset,
      }: Parameters<ComprasRestApi['listSupplierProducts']>[0]) =>
        Promise.resolve({
          products:
            supplierId === supplier.id
              ? [
                  supplierProduct(
                    offset ? 'product-page-2' : 'product-page-1',
                    supplier.id,
                  ),
                ]
              : [supplierProduct('product-new', fallbackSupplier.id)],
          hasPrevious: supplierId === supplier.id && offset > 0,
          hasNext: supplierId === supplier.id && offset === 0,
        } satisfies SupplierProductPage),
    )
    renderScreen(
      makeApi(vi.fn().mockResolvedValue(page([supplier, fallbackSupplier]))),
      makePurchasesApi(
        vi.fn().mockResolvedValue({
          purchases: [],
          hasPrevious: false,
          hasNext: false,
        } satisfies PurchasePage),
        { listSupplierProducts },
      ),
    )

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    await user.click(
      await screen.findByRole('option', { name: /Producto product-page-1/ }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Página siguiente de productos' }),
    )
    expect(
      await screen.findByRole('option', { name: /Producto product-page-2/ }),
    ).toBeVisible()
    expect(
      screen.queryByRole('region', {
        name: 'Detalle del Producto de Proveedor seleccionado',
      }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cambiar proveedor' }))
    expect(
      screen.queryByRole('region', {
        name: 'Inspección de Productos de Proveedor',
      }),
    ).not.toBeInTheDocument()
    await user.click(
      await screen.findByRole('option', { name: /Beta Industrial/ }),
    )

    expect(
      await screen.findByRole('region', {
        name: 'Inspección de Productos de Proveedor',
      }),
    ).toHaveTextContent('Proveedor vigente: Beta Industrial S.A.')
    expect(
      screen.queryByText('Producto product-page-2'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /Producto product-new/ }),
    ).toBeVisible()
    expect(listSupplierProducts).toHaveBeenLastCalledWith({
      supplierId: fallbackSupplier.id,
      limit: 20,
      offset: 0,
      signal: expect.any(AbortSignal),
    })
  })

  it('keeps the blocked pending surface visible across supplier, history, and detail stages', async () => {
    const user = userEvent.setup()
    const listSuppliers = vi.fn().mockResolvedValue(page([supplier]))
    const listSupplierPurchases = vi.fn().mockResolvedValue({
      purchases: [purchase],
      hasPrevious: false,
      hasNext: false,
    } satisfies PurchasePage)
    const getPurchase = vi.fn().mockResolvedValue({
      ...purchase,
      branchId: null,
      exchangeRate: null,
      subtotal: '1',
      discount: '0',
      taxTransferred: '0',
      taxWithheld: '0',
      issuerTaxId: 'RFC',
      issuerName: 'Acme',
      xml: { filename: 'purchase.xml', hash: 'hash' },
      importedAt: '',
      createdAt: '',
      updatedAt: '',
    })
    const listPurchaseLines = vi.fn().mockResolvedValue([])
    renderScreen(
      makeApi(listSuppliers),
      makePurchasesApi(listSupplierPurchases, {
        getPurchase,
        listPurchaseLines,
      }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Partidas pendientes entre compras',
        level: 2,
      }),
    ).toBeVisible()
    expect(listSupplierPurchases).not.toHaveBeenCalled()

    await user.click(
      await screen.findByRole('option', { name: /Acme Comercial/ }),
    )
    expect(
      screen.getByRole('heading', { name: /Historial de compras/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: 'Partidas pendientes entre compras',
        level: 2,
      }),
    ).toBeVisible()
    expect(listSupplierPurchases).toHaveBeenCalledOnce()
    expect(getPurchase).not.toHaveBeenCalled()
    expect(listPurchaseLines).not.toHaveBeenCalled()

    await user.click(
      await screen.findByRole('button', { name: 'Seleccionar compra A-100' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Detalle de compra' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: 'Partidas pendientes entre compras',
        level: 2,
      }),
    ).toBeVisible()
    expect(getPurchase).toHaveBeenCalledOnce()
    expect(listPurchaseLines).toHaveBeenCalledOnce()
  })
})

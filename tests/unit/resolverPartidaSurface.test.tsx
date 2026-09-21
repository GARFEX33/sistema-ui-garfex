import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  Resource,
  ResourcePage,
} from '../../src/features/resources-master/resourcesMaster.types'
import type {
  PurchaseLineWorkbenchRow,
  ResolvePurchaseLineResponse,
} from '../../src/features/compras/compras.types'

const { createdResourceForTest } = vi.hoisted(() => ({
  createdResourceForTest: { current: null as Resource | null },
}))

vi.mock('../../src/features/resources-master/CrearRecursoSurface', () => ({
  CrearRecursoSurface: ({
    onSuccess,
  }: {
    onSuccess?: (message: string, resource?: Resource) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onSuccess?.(
          'Recurso de tipo "Tuberías" creado.',
          createdResourceForTest.current ?? undefined,
        )
      }
    >
      Nuevo recurso
    </button>
  ),
}))

import { ResolverPartidaSurface } from '../../src/features/compras/ResolverPartidaSurface'

const resource = (id: string): Resource => ({
  id,
  identityV1: `RAW-${id}`,
  scope: { classCode: 'C', familyCode: 'F', typeCode: 'T' },
  naturalUnit: 'pieza',
  active: true,
  revision: '1',
  attributes: [],
})

const row = (
  supplierProductId: string | null = null,
): PurchaseLineWorkbenchRow => ({
  lineId: 'line-7',
  purchaseId: 'purchase-3',
  lineNumber: 2,
  issuedAt: '2026-01-15',
  series: 'A',
  folio: '42',
  cfdiUuid: 'CFDI-UUID-7',
  supplierId: 'supplier-3',
  supplierDisplayName: 'Proveedor ACME',
  description: 'Tornillo hexagonal',
  supplierSku: 'XML-SKU-7',
  commercialSupplierSku: supplierProductId ? 'COMMERCIAL-7' : null,
  satProductCode: '7318',
  quantity: '3',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '10.50',
  amount: '31.50',
  currency: 'MXN',
  supplierProductId,
  mappingRevision: supplierProductId ? '8' : null,
  resolutionRevision: '4',
  resourceId: null,
  resourceIdentity: null,
  resourceDisplayName: null,
  resolutionOverride: 'NONE',
  effectiveStatus: 'PENDIENTE',
  effectiveCause: 'UNRESOLVED',
})

const resolved = {} as ResolvePurchaseLineResponse
const readApi = (
  listResources = vi.fn().mockResolvedValue({
    resources: [resource('resource-1')],
    hasPrevious: false,
    hasNext: false,
  } satisfies ResourcePage),
) =>
  ({
    listResources,
    getTypeEffectiveAttributes: vi.fn().mockResolvedValue({
      typeCode: 'T',
      attributes: [],
    }),
  }) as unknown as ResourcesMasterRestReadApi

const renderSurface = (
  overrides: Partial<React.ComponentProps<typeof ResolverPartidaSurface>> = {},
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const props: React.ComponentProps<typeof ResolverPartidaSurface> = {
    row: row(),
    isOpen: true,
    resourcesApi: readApi(),
    resolvePurchaseLine: vi.fn().mockResolvedValue(resolved),
    onResolved: vi.fn(),
    onRereadRequired: vi.fn(),
    onOpenChange: vi.fn(),
    ...overrides,
  }
  return {
    ...render(
      <QueryClientProvider client={client}>
        <ResolverPartidaSurface {...props} />
      </QueryClientProvider>,
    ),
    props,
  }
}

afterEach(() => {
  createdResourceForTest.current = null
  vi.restoreAllMocks()
})

describe('ResolverPartidaSurface', () => {
  it('renders the immutable workbench context and starts posterior SKU knowledge blank', async () => {
    renderSurface()
    const dialog = await screen.findByRole('dialog')

    expect(dialog).toHaveTextContent('Proveedor ACME')
    expect(dialog).toHaveTextContent('A / 42')
    expect(dialog).toHaveTextContent('CFDI-UUID-7')
    expect(dialog).toHaveTextContent('2026-01-15')
    expect(dialog).toHaveTextContent('Tornillo hexagonal')
    expect(dialog).toHaveTextContent('XML-SKU-7')
    expect(dialog).toHaveTextContent('3 Pieza')
    expect(dialog).toHaveTextContent('10.50')
    expect(dialog).toHaveTextContent('31.50 MXN')
    expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
      '',
    )
  })

  it('returns to the same line after resource creation and refreshes resources without losing resolver state', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValueOnce({
        resources: [resource('resource-1')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
      .mockResolvedValueOnce({
        resources: [resource('resource-1'), resource('resource-2')],
        hasPrevious: false,
        hasNext: false,
      } satisfies ResourcePage)
    renderSurface({ resourcesApi: readApi(listResources) })
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'COMMERCIAL-NEW',
    )
    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Recurso de tipo "Tuberías" creado.',
    )
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
      'COMMERCIAL-NEW',
    )
    expect(
      screen.getByRole('option', { name: /T Unidad: pieza · ID: resource-1/ }),
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('selects the exact created resource even when the refreshed page does not contain it', async () => {
    createdResourceForTest.current = resource('resource-created')
    const listResources = vi.fn().mockResolvedValue({
      resources: [resource('resource-1')],
      hasPrevious: false,
      hasNext: false,
    } satisfies ResourcePage)
    const resolvePurchaseLine = vi.fn().mockResolvedValue(resolved)
    renderSurface({ resourcesApi: readApi(listResources), resolvePurchaseLine })
    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'COMMERCIAL-NEW',
    )
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Recurso de tipo "Tuberías" creado.',
    )
    await waitFor(() => expect(listResources).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
      'COMMERCIAL-NEW',
    )

    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )
    await waitFor(() => expect(resolvePurchaseLine).toHaveBeenCalledOnce())
    expect(resolvePurchaseLine).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 'resource-created' }),
    )
  })

  it('hides resource creation while resolving or after confirmation', async () => {
    let finish!: (value: ResolvePurchaseLineResponse) => void
    const resolvePurchaseLine = vi.fn().mockReturnValue(
      new Promise<ResolvePurchaseLineResponse>((resolve) => {
        finish = resolve
      }),
    )
    renderSurface({ resolvePurchaseLine })
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )
    expect(
      screen.queryByRole('button', { name: 'Nuevo recurso' }),
    ).not.toBeInTheDocument()

    finish(resolved)
  })

  it('sends exact snapshots, selected resource, fixed reason, and explicit posterior SKU', async () => {
    const resolvePurchaseLine = vi.fn().mockResolvedValue(resolved)
    const onResolved = vi.fn().mockResolvedValue(undefined)
    renderSurface({ resolvePurchaseLine, onResolved })
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'COMMERCIAL-NEW',
    )
    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )

    await waitFor(() => expect(resolvePurchaseLine).toHaveBeenCalledOnce())
    expect(resolvePurchaseLine).toHaveBeenCalledWith({
      id: 'line-7',
      reason: 'Resolución manual de partida de compra',
      resourceId: 'resource-1',
      expectedSupplierProductId: null,
      expectedMappingRevision: null,
      expectedResolutionRevision: '4',
      commercialSupplierSku: 'COMMERCIAL-NEW',
    })
    expect(onResolved).toHaveBeenCalledWith(resolved)
  })

  it('hides the posterior SKU and sends an explicit empty value for an existing identity', async () => {
    const resolvePurchaseLine = vi.fn().mockResolvedValue(resolved)
    renderSurface({
      row: row('supplier-product-7'),
      resolvePurchaseLine,
    })
    const user = userEvent.setup()

    expect(
      screen.queryByLabelText(/SKU comercial del proveedor/i),
    ).not.toBeInTheDocument()
    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )

    await waitFor(() => expect(resolvePurchaseLine).toHaveBeenCalledOnce())
    expect(resolvePurchaseLine).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedSupplierProductId: 'supplier-product-7',
        expectedMappingRevision: '8',
        commercialSupplierSku: '',
      }),
    )
  })

  it('requires resource and posterior SKU before confirming', async () => {
    renderSurface()
    const confirm = screen.getByRole('button', {
      name: /Confirmar resolución/i,
    })
    expect(confirm).toBeDisabled()
    const user = userEvent.setup()
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    expect(confirm).toBeDisabled()
    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    expect(confirm).toBeEnabled()
  })

  it.each([
    [
      409,
      undefined,
      'La partida cambió o el resultado no pudo confirmarse. Volvé a leerla antes de intentar nuevamente.',
    ],
    [
      503,
      undefined,
      'La partida cambió o el resultado no pudo confirmarse. Volvé a leerla antes de intentar nuevamente.',
    ],
    [
      undefined,
      undefined,
      'La partida cambió o el resultado no pudo confirmarse. Volvé a leerla antes de intentar nuevamente.',
    ],
    [422, 'KNOWN_RESOURCE_VALIDATION', 'KNOWN_RESOURCE_VALIDATION'],
  ] as const)(
    'keeps the dialog open with truthful failure guidance for %s',
    async (status, code, message) => {
      const onRereadRequired = vi.fn()
      const error = Object.assign(new Error('request rejected'), {
        status,
        code,
      })
      const resolvePurchaseLine = vi.fn().mockRejectedValue(error)
      renderSurface({ resolvePurchaseLine, onRereadRequired })
      const user = userEvent.setup()
      await user.click(
        await screen.findByRole('option', { name: /T Unidad: pieza/ }),
      )
      await user.type(
        screen.getByLabelText(/SKU comercial del proveedor/i),
        'SKU-NEW',
      )
      await user.click(
        screen.getByRole('button', { name: /Confirmar resolución/i }),
      )

      if (status === 422) {
        expect(await screen.findByRole('alert')).toHaveTextContent(message)
        expect(onRereadRequired).not.toHaveBeenCalled()
      } else {
        await waitFor(() => expect(onRereadRequired).toHaveBeenCalledOnce())
        expect(
          screen.getByRole('button', { name: /Confirmar resolución/i }),
        ).toBeDisabled()
      }
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    },
  )

  it('reports confirmed-but-refresh-failed without resubmitting the mutation', async () => {
    const resolvePurchaseLine = vi.fn().mockResolvedValue(resolved)
    const onResolved = vi
      .fn()
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce(undefined)
    const onOpenChange = vi.fn()
    renderSurface({ resolvePurchaseLine, onResolved, onOpenChange })
    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Resolución confirmada, pero no se pudo actualizar el detalle.',
    )
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()
    await user.click(
      screen.getByRole('button', { name: /Reintentar actualización/i }),
    )
    await waitFor(() => expect(onResolved).toHaveBeenCalledTimes(2))
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps confirmation disabled throughout a deferred reread and clears selection only after success', async () => {
    let resolveReread!: () => void
    const onRereadRequired = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveReread = resolve
        }),
    )
    const resolvePurchaseLine = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('conflict'), { status: 409 }))
    renderSurface({ resolvePurchaseLine, onRereadRequired })
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    const confirm = screen.getByRole('button', {
      name: /Confirmar resolución/i,
    })
    await user.click(confirm)

    await screen.findByRole('alert')
    expect(onRereadRequired).toHaveBeenCalledOnce()
    expect(confirm).toBeDisabled()
    expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
      'SKU-NEW',
    )

    resolveReread()
    await waitFor(() =>
      expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
        '',
      ),
    )
    expect(confirm).toBeDisabled()
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()
  })

  it('cannot resubmit after reread failure and retries only the reread', async () => {
    const onRereadRequired = vi
      .fn()
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValueOnce(undefined)
    const resolvePurchaseLine = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('conflict'), { status: 409 }))
    renderSurface({ resolvePurchaseLine, onRereadRequired })
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    await user.click(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo releer la partida.',
    )
    expect(screen.getByRole('button', { name: 'Releer partida' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: /Confirmar resolución/i }),
    ).toBeDisabled()
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Releer partida' }))
    await waitFor(() => expect(onRereadRequired).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.getByLabelText(/SKU comercial del proveedor/i)).toHaveValue(
        '',
      ),
    )
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()
  })

  it('does not duplicate mutation or dismiss while the request is pending', async () => {
    let finish!: (value: ResolvePurchaseLineResponse) => void
    const resolvePurchaseLine = vi.fn().mockReturnValue(
      new Promise<ResolvePurchaseLineResponse>((resolve) => {
        finish = resolve
      }),
    )
    const onOpenChange = vi.fn()
    renderSurface({ resolvePurchaseLine, onOpenChange })
    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('option', { name: /T Unidad: pieza/ }),
    )
    await user.type(
      screen.getByLabelText(/SKU comercial del proveedor/i),
      'SKU-NEW',
    )
    const confirm = screen.getByRole('button', {
      name: /Confirmar resolución/i,
    })
    await user.click(confirm)
    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(resolvePurchaseLine).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(confirm).toBeDisabled()
    finish(resolved)
  })
})

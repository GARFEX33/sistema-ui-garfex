import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  Resource,
  ResourcePage,
} from '../../src/features/resources-master/resourcesMaster.types'
import type { SupplierProductMappingProjection } from '../../src/features/compras/compras.types'
import { VincularPartidaSurface } from '../../src/features/compras/VincularPartidaSurface'

const resource = (
  id: string,
  identityV1 = `IDENTITY-${id}`,
  attributes: Resource['attributes'] = [],
): Resource => ({
  id,
  identityV1,
  scope: { classCode: 'C', familyCode: 'F', typeCode: 'T' },
  naturalUnit: 'pieza',
  active: true,
  revision: '1',
  attributes,
})
const page = (
  resources: Resource[],
  hasPrevious = false,
  hasNext = false,
): ResourcePage => ({ resources, hasPrevious, hasNext })
const product = (
  resourceId: string | null = null,
): SupplierProductMappingProjection => ({
  id: 'supplier-product-7',
  supplierId: 'supplier-3',
  supplierSku: 'SKU-7',
  description: 'Producto existente',
  resourceId,
  mappingRevision: 'mapping-revision-2',
  resourceActive: resourceId !== null,
  mappingState: resourceId === null ? 'SUSPENDED' : 'CONFIRMED',
  mappingCause: resourceId === null ? 'UNRESOLVED' : 'NONE',
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
})
const readApi = (
  listResources = vi.fn(),
  getTypeEffectiveAttributes = vi.fn().mockResolvedValue({
    typeCode: 'T',
    attributes: [],
  }),
) =>
  ({
    listResources,
    getTypeEffectiveAttributes,
  }) as unknown as ResourcesMasterRestReadApi
const renderSurface = (
  listResources = vi.fn().mockResolvedValue(page([resource('r1')])),
  confirmSupplierProductMapping = vi.fn().mockResolvedValue(product('r1')),
  onLinked = vi.fn(),
  strict = false,
  getTypeEffectiveAttributes = vi.fn().mockResolvedValue({
    typeCode: 'T',
    attributes: [],
  }),
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const view = (
    <VincularPartidaSurface
      supplierProductId="supplier-product-7"
      supplierContext="Proveedor ACME"
      mappingRevision="mapping-revision-1"
      resourcesApi={readApi(listResources, getTypeEffectiveAttributes)}
      confirmSupplierProductMapping={confirmSupplierProductMapping}
      onLinked={onLinked}
    />
  )
  return {
    ...render(
      <QueryClientProvider client={client}>
        {strict ? <StrictMode>{view}</StrictMode> : view}
      </QueryClientProvider>,
    ),
    listResources,
    confirmSupplierProductMapping,
    onLinked,
  }
}
const openSurface = async () => {
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', {
      name: /Vincular producto.*supplier-product-7/,
    }),
  )
  return user
}

afterEach(() => vi.restoreAllMocks())

describe('VincularPartidaSurface', () => {
  it('defers ACTIVE/20 reads and identifies the supplier product context', async () => {
    const listResources = vi.fn().mockResolvedValue(page([resource('r1')]))
    renderSurface(listResources)
    expect(listResources).not.toHaveBeenCalled()
    await openSurface()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      within(screen.getByRole('dialog')).getByText(/supplier-product-7/),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/Proveedor: Proveedor ACME/),
    ).toBeInTheDocument()
    await waitFor(() => expect(listResources).toHaveBeenCalledOnce())
    expect(listResources).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'ACTIVE', limit: 20, offset: 0 }),
    )
  })

  it('uses canonical presentation names for every resource and keeps useful metadata accessible', async () => {
    const resources = [
      resource('r1', 'WIRE-RAW-1', [
        { code: 'COLOR', value: { kind: 'TEXT', value: 'Rojo' } },
      ]),
      resource('r2', 'WIRE-RAW-2', [
        { code: 'COLOR', value: { kind: 'TEXT', value: 'Azul' } },
      ]),
    ]
    const getTypeEffectiveAttributes = vi.fn().mockResolvedValue({
      typeCode: 'T',
      attributes: [
        {
          characteristic: {
            code: 'COLOR',
            name: 'Color',
            valueType: 'CONTROLLED_TEXT',
          },
          effectiveMode: 'OPTIONAL',
          identityParticipates: false,
          notApplicable: false,
          position: 0,
          hasPosition: true,
          options: [],
          source: { level: 'TYPE', code: 'T' },
          rules: [],
        },
      ],
    })
    renderSurface(
      vi.fn().mockResolvedValue(page(resources)),
      vi.fn().mockResolvedValue(product('r1')),
      vi.fn(),
      false,
      getTypeEffectiveAttributes,
    )

    await openSurface()

    expect(
      await screen.findByRole('option', {
        name: 'T Rojo Unidad: pieza · ID: r1',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'T Azul Unidad: pieza · ID: r2' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('WIRE-RAW-1')).not.toBeInTheDocument()
    expect(screen.queryByText('WIRE-RAW-2')).not.toBeInTheDocument()
  })

  it('keeps stable metadata while a presentation name is loading', async () => {
    let resolvePresentation!: (value: {
      typeCode: string
      attributes: []
    }) => void
    const getTypeEffectiveAttributes = vi.fn(
      () =>
        new Promise<{ typeCode: string; attributes: [] }>((resolve) => {
          resolvePresentation = resolve
        }),
    )
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1', 'WIRE-RAW')])),
      vi.fn().mockResolvedValue(product('r1')),
      vi.fn(),
      false,
      getTypeEffectiveAttributes,
    )
    const user = await openSurface()

    expect(
      await screen.findByRole('option', {
        name: 'Cargando nombre… Unidad: pieza · ID: r1',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('WIRE-RAW')).not.toBeInTheDocument()

    resolvePresentation({ typeCode: 'T', attributes: [] })
    await waitFor(() =>
      expect(
        screen.getByRole('option', {
          name: 'T Unidad: pieza · ID: r1',
        }),
      ).toBeInTheDocument(),
    )
    await user.click(
      screen.getByRole('option', { name: 'T Unidad: pieza · ID: r1' }),
    )
  })

  it('uses stable metadata when a presentation name request is rejected', async () => {
    const getTypeEffectiveAttributes = vi
      .fn()
      .mockRejectedValue(new Error('presentation unavailable'))
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1', 'WIRE-RAW')])),
      vi.fn().mockResolvedValue(product('r1')),
      vi.fn(),
      false,
      getTypeEffectiveAttributes,
    )
    await openSurface()

    expect(
      await screen.findByRole('option', {
        name: 'Nombre no disponible Unidad: pieza · ID: r1',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('WIRE-RAW')).not.toBeInTheDocument()
  })

  it('prepares an explicit resource choice without matching or creating', async () => {
    const confirmSupplierProductMapping = vi
      .fn()
      .mockResolvedValue(product('r1'))
    const { onLinked } = renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1', 'RES-CABLE')])),
      confirmSupplierProductMapping,
    )
    const user = await openSurface()
    expect(
      await screen.findByRole('option', {
        name: 'T Unidad: pieza · ID: r1',
      }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('option', {
        name: 'T Unidad: pieza · ID: r1',
      }),
    )
    expect(confirmSupplierProductMapping).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Confirmar vínculo' }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: /crear/i }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() =>
      expect(confirmSupplierProductMapping).toHaveBeenCalledOnce(),
    )
    expect(confirmSupplierProductMapping).toHaveBeenCalledWith({
      id: 'supplier-product-7',
      resourceId: 'r1',
      expectedRevision: 'mapping-revision-1',
      reason: 'Vinculación manual de producto de proveedor',
    })
    expect(onLinked).toHaveBeenCalledWith(product('r1'))
  })

  it('communicates loading, empty, and initial errors truthfully with retry', async () => {
    let resolveEmpty!: (value: ResourcePage) => void
    const pending = new Promise<ResourcePage>((resolve) => {
      resolveEmpty = resolve
    })
    const listResources = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page([resource('recovered')]))
    const first = renderSurface(listResources)
    await openSurface()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cargando opciones',
    )
    resolveEmpty(page([]))
    expect(
      await screen.findByText('No hay opciones disponibles.'),
    ).toBeInTheDocument()
    first.unmount()

    renderSurface(listResources)
    const retryUser = await openSurface()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones',
    )
    await retryUser.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('option', {
        name: 'T Unidad: pieza · ID: recovered',
      }),
    ).toBeInTheDocument()
  })

  it('replaces pages, exposes backend flags, and retries navigation errors', async () => {
    const listResources = vi
      .fn()
      .mockResolvedValueOnce(page([resource('first')], false, true))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page([resource('next')], true, false))
    renderSurface(listResources)
    const user = await openSurface()
    expect(
      await screen.findByRole('option', {
        name: 'T Unidad: pieza · ID: first',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'página siguiente',
    )
    await user.click(
      screen.getByRole('button', { name: 'Reintentar página siguiente' }),
    )
    expect(
      await screen.findByRole('option', {
        name: 'T Unidad: pieza · ID: next',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', {
        name: 'T Unidad: pieza · ID: first',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /Cargar más/ }),
    ).not.toBeInTheDocument()
  })

  it('blocks dismiss and duplicate mutation while busy, then reports retryable actor errors', async () => {
    let reject!: (error: Error) => void
    const pending = new Promise<SupplierProductMappingProjection>((_, fail) => {
      reject = fail
    })
    const confirmSupplierProductMapping = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValue(product('r1'))
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      confirmSupplierProductMapping,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/ID: r1/))
    const confirm = screen.getByRole('button', { name: 'Confirmar vínculo' })
    await user.click(confirm)
    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(confirmSupplierProductMapping).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.queryByText(/ID: r1/)).not.toBeInTheDocument()
    reject(new Error('actor missing'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo vincular',
    )
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    await waitFor(() =>
      expect(confirmSupplierProductMapping).toHaveBeenCalledTimes(2),
    )
  })

  it.each([
    [
      'actor configuration',
      new RestActorConfigurationError(),
      'No se puede vincular sin configurar el actor local',
    ],
    [
      'backend conflict',
      Object.assign(new Error('conflict'), { status: 409 }),
      'El backend rechazó el vínculo',
    ],
    [
      'generic backend failure',
      new Error('offline'),
      'No se pudo vincular el producto',
    ],
  ])(
    'keeps the dialog open for a retryable %s error',
    async (_, error, message) => {
      const confirmSupplierProductMapping = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue(product('r1'))
      renderSurface(
        vi.fn().mockResolvedValue(page([resource('r1')])),
        confirmSupplierProductMapping,
      )
      const user = await openSurface()
      await user.click(await screen.findByText(/ID: r1/))
      await user.click(
        screen.getByRole('button', { name: 'Confirmar vínculo' }),
      )
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await user.click(
        screen.getByRole('button', { name: 'Confirmar vínculo' }),
      )
      await waitFor(() =>
        expect(confirmSupplierProductMapping).toHaveBeenCalledTimes(2),
      )
    },
  )

  it('retains confirmed SupplierProduct when detail reread rejects and retries only onLinked', async () => {
    const confirmed = product('r1')
    const onLinked = vi
      .fn()
      .mockRejectedValueOnce(new Error('detail reread failed'))
      .mockResolvedValueOnce(undefined)
    const confirmSupplierProductMapping = vi.fn().mockResolvedValue(confirmed)
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      confirmSupplierProductMapping,
      onLinked,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/ID: r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vínculo confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(confirmSupplierProductMapping).toHaveBeenCalledOnce()
    expect(onLinked).toHaveBeenCalledTimes(1)
    expect(onLinked.mock.calls[0][0]).toBe(confirmed)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(onLinked).toHaveBeenCalledTimes(2))
    expect(onLinked.mock.calls[1][0]).toBe(confirmed)
    expect(confirmSupplierProductMapping).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )

    await user.click(
      screen.getByRole('button', {
        name: /Vincular producto.*supplier-product-7/,
      }),
    )
    await user.click(await screen.findByText(/ID: r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() =>
      expect(confirmSupplierProductMapping).toHaveBeenCalledTimes(2),
    )
    expect(onLinked).toHaveBeenCalledTimes(3)
  })

  it('waits for authoritative onLinked confirmation before closing', async () => {
    let confirm!: () => void
    const confirmation = new Promise<void>((resolve) => {
      confirm = resolve
    })
    const onLinked = vi.fn(() => confirmation)
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      vi.fn().mockResolvedValue(product('r1')),
      onLinked,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/ID: r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() => expect(onLinked).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    confirm()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('restores focus and ignores late completion after StrictMode unmount', async () => {
    let resolve!: (product: SupplierProductMappingProjection) => void
    const pending = new Promise<SupplierProductMappingProjection>(
      (complete) => {
        resolve = complete
      },
    )
    const onLinked = vi.fn()
    const confirmSupplierProductMapping = vi.fn().mockReturnValue(pending)
    const { unmount } = renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      confirmSupplierProductMapping,
      onLinked,
      true,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/ID: r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    expect(confirmSupplierProductMapping).toHaveBeenCalledOnce()
    unmount()
    await act(async () => resolve(product('r1')))
    expect(onLinked).not.toHaveBeenCalled()
  })

  it('supports keyboard focus restoration after a normal dismiss', async () => {
    const user = userEvent.setup()
    renderSurface()
    const trigger = screen.getByRole('button', {
      name: /Vincular producto.*supplier-product-7/,
    })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    fireEvent.blur(trigger)
  })
})

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
import type { SupplierProduct } from '../../src/features/compras/compras.types'
import { VincularPartidaSurface } from '../../src/features/compras/VincularPartidaSurface'

const resource = (id: string, identityV1 = `IDENTITY-${id}`): Resource => ({
  id,
  identityV1,
  scope: { classCode: 'C', familyCode: 'F', typeCode: 'T' },
  naturalUnit: 'pieza',
  active: true,
  revision: '1',
  attributes: [],
})
const page = (
  resources: Resource[],
  hasPrevious = false,
  hasNext = false,
): ResourcePage => ({ resources, hasPrevious, hasNext })
const product = (resourceId: string | null = null): SupplierProduct => ({
  id: 'supplier-product-7',
  supplierId: 'supplier-3',
  supplierSku: 'SKU-7',
  description: 'Producto existente',
  resourceId,
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
})
const readApi = (listResources = vi.fn()) =>
  ({ listResources }) as unknown as ResourcesMasterRestReadApi
const renderSurface = (
  listResources = vi.fn().mockResolvedValue(page([resource('r1')])),
  linkSupplierProduct = vi.fn().mockResolvedValue(product('r1')),
  onLinked = vi.fn(),
  strict = false,
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const view = (
    <VincularPartidaSurface
      supplierProductId="supplier-product-7"
      supplierContext="Proveedor ACME"
      resourcesApi={readApi(listResources)}
      linkSupplierProduct={linkSupplierProduct}
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
    linkSupplierProduct,
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

  it('prepares an explicit resource choice without matching or creating', async () => {
    const linkSupplierProduct = vi.fn().mockResolvedValue(product('r1'))
    const { onLinked } = renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1', 'RES-CABLE')])),
      linkSupplierProduct,
    )
    const user = await openSurface()
    expect(await screen.findByText('RES-CABLE (ID: r1)')).toBeInTheDocument()
    await user.click(screen.getByText('RES-CABLE (ID: r1)'))
    expect(linkSupplierProduct).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Confirmar vínculo' }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: /crear/i }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() => expect(linkSupplierProduct).toHaveBeenCalledOnce())
    expect(linkSupplierProduct).toHaveBeenCalledWith({
      id: 'supplier-product-7',
      resourceId: 'r1',
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
      await screen.findByText('IDENTITY-recovered (ID: recovered)'),
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
      await screen.findByText('IDENTITY-first (ID: first)'),
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
      await screen.findByText('IDENTITY-next (ID: next)'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('IDENTITY-first (ID: first)'),
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
    const pending = new Promise<SupplierProduct>((_, fail) => {
      reject = fail
    })
    const linkSupplierProduct = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValue(product('r1'))
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      linkSupplierProduct,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/IDENTITY-r1/))
    const confirm = screen.getByRole('button', { name: 'Confirmar vínculo' })
    await user.click(confirm)
    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.queryByText('IDENTITY-r1 (ID: r1)')).not.toBeInTheDocument()
    reject(new Error('actor missing'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo vincular',
    )
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    await waitFor(() => expect(linkSupplierProduct).toHaveBeenCalledTimes(2))
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
      const linkSupplierProduct = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue(product('r1'))
      renderSurface(
        vi.fn().mockResolvedValue(page([resource('r1')])),
        linkSupplierProduct,
      )
      const user = await openSurface()
      await user.click(await screen.findByText(/IDENTITY-r1/))
      await user.click(
        screen.getByRole('button', { name: 'Confirmar vínculo' }),
      )
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await user.click(
        screen.getByRole('button', { name: 'Confirmar vínculo' }),
      )
      await waitFor(() => expect(linkSupplierProduct).toHaveBeenCalledTimes(2))
    },
  )

  it('retains confirmed SupplierProduct when detail reread rejects and retries only onLinked', async () => {
    const confirmed = product('r1')
    const onLinked = vi
      .fn()
      .mockRejectedValueOnce(new Error('detail reread failed'))
      .mockResolvedValueOnce(undefined)
    const linkSupplierProduct = vi.fn().mockResolvedValue(confirmed)
    renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      linkSupplierProduct,
      onLinked,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/IDENTITY-r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vínculo confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
    expect(onLinked).toHaveBeenCalledTimes(1)
    expect(onLinked.mock.calls[0][0]).toBe(confirmed)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(onLinked).toHaveBeenCalledTimes(2))
    expect(onLinked.mock.calls[1][0]).toBe(confirmed)
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )

    await user.click(
      screen.getByRole('button', {
        name: /Vincular producto.*supplier-product-7/,
      }),
    )
    await user.click(await screen.findByText('IDENTITY-r1 (ID: r1)'))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() => expect(linkSupplierProduct).toHaveBeenCalledTimes(2))
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
    await user.click(await screen.findByText(/IDENTITY-r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    await waitFor(() => expect(onLinked).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    confirm()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('restores focus and ignores late completion after StrictMode unmount', async () => {
    let resolve!: (product: SupplierProduct) => void
    const pending = new Promise<SupplierProduct>((complete) => {
      resolve = complete
    })
    const onLinked = vi.fn()
    const linkSupplierProduct = vi.fn().mockReturnValue(pending)
    const { unmount } = renderSurface(
      vi.fn().mockResolvedValue(page([resource('r1')])),
      linkSupplierProduct,
      onLinked,
      true,
    )
    const user = await openSurface()
    await user.click(await screen.findByText(/IDENTITY-r1/))
    await user.click(screen.getByRole('button', { name: 'Confirmar vínculo' }))
    expect(linkSupplierProduct).toHaveBeenCalledOnce()
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

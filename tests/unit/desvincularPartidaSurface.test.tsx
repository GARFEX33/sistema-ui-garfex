import { StrictMode } from 'react'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SupplierProductMappingProjection } from '../../src/features/compras/compras.types'
import { DesvincularPartidaSurface } from '../../src/features/compras/DesvincularPartidaSurface'

const updated: SupplierProductMappingProjection = {
  id: 'supplier-product-7',
  supplierId: 'supplier-3',
  supplierSku: 'SKU-7',
  description: 'Producto desvinculado',
  resourceId: null,
  mappingRevision: 'mapping-revision-2',
  resourceActive: null,
  mappingState: 'SUSPENDED',
  mappingCause: 'UNRESOLVED',
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
}

const renderSurface = (
  retireSupplierProductMapping = vi.fn().mockResolvedValue(updated),
  onUnlinked = vi.fn(),
  strict = false,
) => {
  const view = (
    <DesvincularPartidaSurface
      supplierProductId="supplier-product-7"
      currentResourceId="resource-7"
      mappingRevision="mapping-revision-1"
      retireSupplierProductMapping={retireSupplierProductMapping}
      onUnlinked={onUnlinked}
    />
  )
  return {
    ...render(strict ? <StrictMode>{view}</StrictMode> : view),
    retireSupplierProductMapping,
    onUnlinked,
  }
}

const openSurface = async () => {
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', {
      name: 'Desvincular producto de proveedor supplier-product-7',
    }),
  )
  return user
}

afterEach(() => vi.restoreAllMocks())

describe('DesvincularPartidaSurface', () => {
  it('requires explicit confirmation and never calls retirement on open or cancel', async () => {
    const { retireSupplierProductMapping } = renderSurface()
    const user = await openSurface()
    expect(retireSupplierProductMapping).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(retireSupplierProductMapping).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sends the exact id and waits for onUnlinked before closing', async () => {
    let resolveCallback!: () => void
    const callbackDone = new Promise<void>((resolve) => {
      resolveCallback = resolve
    })
    const onUnlinked = vi.fn(() => callbackDone)
    const { retireSupplierProductMapping } = renderSurface(
      vi.fn().mockResolvedValue(updated),
      onUnlinked,
    )
    const user = await openSurface()
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )
    await waitFor(() =>
      expect(retireSupplierProductMapping).toHaveBeenCalledWith({
        id: 'supplier-product-7',
        expectedCurrentResourceId: 'resource-7',
        expectedRevision: 'mapping-revision-1',
        reason: 'Desvinculación manual de producto de proveedor',
      }),
    )
    await waitFor(() => expect(onUnlinked).toHaveBeenCalledWith(updated))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    resolveCallback()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('retains the confirmed result when reread rejects and retries only onUnlinked', async () => {
    const onUnlinked = vi
      .fn()
      .mockRejectedValueOnce(new Error('reread failed'))
      .mockResolvedValue(undefined)
    const retireSupplierProductMapping = vi.fn().mockResolvedValue(updated)
    renderSurface(retireSupplierProductMapping, onUnlinked)
    const user = await openSurface()

    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )
    await waitFor(() => expect(onUnlinked).toHaveBeenCalledWith(updated))
    expect(retireSupplierProductMapping).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Desvinculación confirmada, pero el detalle no se actualizó. Reintenta la lectura.',
    )
    expect(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    ).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Reintentar actualización' }),
    )
    await waitFor(() => expect(onUnlinked).toHaveBeenCalledTimes(2))
    expect(onUnlinked).toHaveBeenLastCalledWith(updated)
    expect(retireSupplierProductMapping).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('blocks dismissal and duplicate confirmation while pending', async () => {
    let resolve!: (value: SupplierProductMappingProjection) => void
    const pending = new Promise<SupplierProductMappingProjection>(
      (complete) => {
        resolve = complete
      },
    )
    const { retireSupplierProductMapping } = renderSurface(
      vi.fn().mockReturnValue(pending),
    )
    const user = await openSurface()
    const confirm = screen.getByRole('button', {
      name: 'Confirmar desvinculación',
    })
    await user.click(confirm)
    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(retireSupplierProductMapping).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    resolve(updated)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it.each([
    [
      'actor configuration',
      new RestActorConfigurationError(),
      'No se puede desvincular sin configurar el actor local.',
    ],
    [
      'backend',
      Object.assign(new Error('conflict'), { status: 409 }),
      'El backend rechazó la desvinculación por conflicto.',
    ],
    [
      'generic',
      new Error('offline'),
      'No se pudo desvincular el producto. Revisa el error y reintenta.',
    ],
  ])('keeps %s errors open and retryable', async (_, error, message) => {
    const retireSupplierProductMapping = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(updated)
    renderSurface(retireSupplierProductMapping)
    const user = await openSurface()
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )
    await waitFor(() =>
      expect(retireSupplierProductMapping).toHaveBeenCalledTimes(2),
    )
  })

  it('restores trigger focus and ignores late completion after StrictMode unmount', async () => {
    let resolve!: (value: SupplierProductMappingProjection) => void
    const pending = new Promise<SupplierProductMappingProjection>(
      (complete) => {
        resolve = complete
      },
    )
    const onUnlinked = vi.fn()
    const { unmount } = renderSurface(
      vi.fn().mockReturnValue(pending),
      onUnlinked,
      true,
    )
    const trigger = screen.getByRole('button', {
      name: 'Desvincular producto de proveedor supplier-product-7',
    })
    const user = userEvent.setup()
    await user.click(trigger)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    await user.click(trigger)
    await user.click(
      screen.getByRole('button', { name: 'Confirmar desvinculación' }),
    )
    unmount()
    await act(async () => resolve(updated))
    expect(onUnlinked).not.toHaveBeenCalled()
  })
})

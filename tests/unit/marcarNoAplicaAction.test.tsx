import { StrictMode } from 'react'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PurchaseLine } from '../../src/features/compras/compras.types'
import { MarcarNoAplicaAction } from '../../src/features/compras/MarcarNoAplicaAction'

const markedLine = (supplierProductId: string | null): PurchaseLine => ({
  id: 'purchase-line-7',
  purchaseId: 'purchase-3',
  lineNumber: 1,
  description: 'Servicio no aplicable',
  supplierSku: 'SKU-7',
  satProductCode: '01010101',
  quantity: '2.000000',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '10.500000',
  amount: '21.000000',
  discount: '0.000000',
  taxTransferred: '3.360000',
  taxWithheld: '0.000000',
  taxObject: '02',
  supplierProductId,
  resolutionRevision: '1',
  resolutionOverride: 'NO_APLICA',
  effectiveStatus: 'NO_APLICA',
  effectiveCause: 'OVERRIDE',
})

const renderAction = (
  setPurchaseLineResolutionOverride = vi
    .fn()
    .mockResolvedValue(markedLine(null)),
  onMarked = vi.fn(),
  supplierProductId?: string | null,
  strict = false,
) => {
  const view = (
    <MarcarNoAplicaAction
      purchaseLineId="purchase-line-7"
      {...(supplierProductId !== undefined ? { supplierProductId } : {})}
      resolutionRevision="resolution-revision-1"
      setPurchaseLineResolutionOverride={setPurchaseLineResolutionOverride}
      onMarked={onMarked}
    />
  )
  return {
    ...render(strict ? <StrictMode>{view}</StrictMode> : view),
    setPurchaseLineResolutionOverride,
    onMarked,
  }
}

const openAction = async () => {
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', { name: 'Marcar como no aplicable' }),
  )
  return user
}

afterEach(() => vi.restoreAllMocks())

describe('MarcarNoAplicaAction', () => {
  it.each([undefined, 'supplier-product-7', null])(
    'requires explicit confirmation and sends only the purchase line id with supplier context %s',
    async (supplierProductId) => {
      const { setPurchaseLineResolutionOverride } = renderAction(
        vi.fn().mockResolvedValue(markedLine(supplierProductId ?? null)),
        vi.fn(),
        supplierProductId,
      )
      const user = await openAction()
      expect(setPurchaseLineResolutionOverride).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(setPurchaseLineResolutionOverride).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    },
  )

  it.each(['supplier-product-7', null])(
    'confirms NO_APLICA independently of supplier product %s and awaits onMarked before closing',
    async (supplierProductId) => {
      let resolveCallback!: () => void
      const callbackDone = new Promise<void>((resolve) => {
        resolveCallback = resolve
      })
      const onMarked = vi.fn(() => callbackDone)
      const { setPurchaseLineResolutionOverride } = renderAction(
        vi.fn().mockResolvedValue(markedLine(supplierProductId)),
        onMarked,
        supplierProductId,
      )
      const user = await openAction()
      await user.click(
        screen.getByRole('button', {
          name: 'Confirmar marcar como no aplicable',
        }),
      )
      await waitFor(() =>
        expect(setPurchaseLineResolutionOverride).toHaveBeenCalledWith({
          id: 'purchase-line-7',
          override: 'NO_APLICA',
          expectedRevision: 'resolution-revision-1',
          reason: 'Marcado manual de partida como no aplicable',
        }),
      )
      await waitFor(() =>
        expect(onMarked).toHaveBeenCalledWith(markedLine(supplierProductId)),
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      resolveCallback()
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      )
    },
  )

  it.each(['supplier-product-7', null])(
    'retains confirmed NO_APLICA for reread retry without repeating the mutation (%s)',
    async (supplierProductId) => {
      const confirmed = markedLine(supplierProductId)
      const setPurchaseLineResolutionOverride = vi
        .fn()
        .mockResolvedValue(confirmed)
      const onMarked = vi
        .fn()
        .mockRejectedValueOnce(new Error('detail reread failed'))
        .mockResolvedValueOnce(undefined)
      renderAction(
        setPurchaseLineResolutionOverride,
        onMarked,
        supplierProductId,
      )
      const user = await openAction()

      await user.click(
        screen.getByRole('button', {
          name: 'Confirmar marcar como no aplicable',
        }),
      )
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'NO_APLICA confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
      )
      expect(setPurchaseLineResolutionOverride).toHaveBeenCalledTimes(1)
      expect(onMarked).toHaveBeenCalledWith(confirmed)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Reintentar actualización' }),
      ).toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: 'Reintentar actualización' }),
      )
      await waitFor(() => expect(onMarked).toHaveBeenCalledTimes(2))
      expect(onMarked).toHaveBeenLastCalledWith(confirmed)
      expect(setPurchaseLineResolutionOverride).toHaveBeenCalledTimes(1)
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      )
      await user.click(
        screen.getByRole('button', { name: 'Marcar como no aplicable' }),
      )
      expect(
        screen.getByRole('button', {
          name: 'Confirmar marcar como no aplicable',
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Reintentar actualización' }),
      ).not.toBeInTheDocument()
    },
  )

  it('blocks dismissal and duplicate confirmation while pending', async () => {
    let resolve!: (value: PurchaseLine) => void
    const pending = new Promise<PurchaseLine>((complete) => {
      resolve = complete
    })
    const { setPurchaseLineResolutionOverride } = renderAction(
      vi.fn().mockReturnValue(pending),
    )
    const user = await openAction()
    const confirm = screen.getByRole('button', {
      name: 'Confirmar marcar como no aplicable',
    })
    await user.click(confirm)
    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(setPurchaseLineResolutionOverride).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    resolve(markedLine(null))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it.each([
    [
      'actor configuration',
      new RestActorConfigurationError(),
      'No se puede marcar como no aplicable sin configurar el actor local.',
    ],
    [
      'backend',
      Object.assign(new Error('conflict'), { status: 409 }),
      'El backend rechazó marcar la partida como no aplicable por conflicto.',
    ],
    [
      'generic',
      new Error('offline'),
      'No se pudo marcar la partida como no aplicable. Revisa el error y reintenta.',
    ],
  ])('keeps %s errors open and retryable', async (_, error, message) => {
    const setPurchaseLineResolutionOverride = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(markedLine(null))
    renderAction(setPurchaseLineResolutionOverride)
    const user = await openAction()
    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar marcar como no aplicable',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar marcar como no aplicable',
      }),
    )
    await waitFor(() =>
      expect(setPurchaseLineResolutionOverride).toHaveBeenCalledTimes(2),
    )
  })

  it('does not change its trigger optimistically and restores focus after cancel', async () => {
    const { setPurchaseLineResolutionOverride } = renderAction()
    const trigger = screen.getByRole('button', {
      name: 'Marcar como no aplicable',
    })
    const user = userEvent.setup()
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('No aplica')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(setPurchaseLineResolutionOverride).not.toHaveBeenCalled()
  })

  it('ignores late completion after StrictMode unmount', async () => {
    let resolve!: (value: PurchaseLine) => void
    const pending = new Promise<PurchaseLine>((complete) => {
      resolve = complete
    })
    const onMarked = vi.fn()
    const { unmount } = renderAction(
      vi.fn().mockReturnValue(pending),
      onMarked,
      null,
      true,
    )
    const user = await openAction()
    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar marcar como no aplicable',
      }),
    )
    unmount()
    await act(async () => resolve(markedLine(null)))
    expect(onMarked).not.toHaveBeenCalled()
  })
})

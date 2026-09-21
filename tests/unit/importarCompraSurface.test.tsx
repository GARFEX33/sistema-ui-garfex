import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'
import type { PurchaseImportResponse } from '../../src/features/compras/compras.types'
import { ImportarCompraSurface } from '../../src/features/compras/ImportarCompraSurface'

const result = (alreadyExisted = false) =>
  ({ supplierId: 'supplier-1', alreadyExisted }) as PurchaseImportResponse
const file = (name = 'compra.xml', type = 'application/xml') =>
  new File(['<cfdi />'], name, { type })
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const renderSurface = (
  importPurchase = vi.fn().mockResolvedValue(result()),
  onImported = vi.fn(),
  strict = false,
) => {
  const surface = (
    <ImportarCompraSurface
      importPurchase={importPurchase}
      onImported={onImported}
    />
  )
  return {
    ...render(strict ? <StrictMode>{surface}</StrictMode> : surface),
    importPurchase,
    onImported,
  }
}
const clickImport = () =>
  userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Importar compra' }))
const waitForClose = () =>
  waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
const choose = (name = 'compra.xml', type = 'application/xml') => {
  fireEvent.change(screen.getByTestId('purchase-file'), {
    target: { files: [file(name, type)] },
  })
}

describe('ImportarCompraSurface', () => {
  it('accepts XML, guards pending work, dismissal, and duplicate submission', async () => {
    const pending = deferred<PurchaseImportResponse>()
    const user = userEvent.setup()
    const { importPurchase } = renderSurface(vi.fn(() => pending.promise))
    await user.click(screen.getByRole('button', { name: 'Importar compra' }))
    expect(screen.getByTestId('purchase-file')).toHaveAttribute(
      'accept',
      '.xml,application/xml,text/xml',
    )
    choose()
    choose()
    expect(importPurchase).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Importando')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    pending.resolve(result())
  })
  it.each([[false], [true]])(
    'survives StrictMode and awaits confirmed result alreadyExisted=%s',
    async (alreadyExisted) => {
      const confirmation = deferred<unknown>()
      const onImported = vi.fn(() => confirmation.promise)
      const { importPurchase } = renderSurface(
        vi.fn().mockResolvedValue(result(alreadyExisted)),
        onImported,
        true,
      )
      await clickImport()
      choose()
      await waitFor(() =>
        expect(onImported).toHaveBeenCalledWith(result(alreadyExisted)),
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      confirmation.resolve(undefined)
      await waitForClose()
      await clickImport()
      choose()
      await waitFor(() => expect(importPurchase).toHaveBeenCalledTimes(2))
    },
  )
  it.each([
    [new RestActorConfigurationError(), 'actor local'],
    [{ status: 409 }, /conflicto/i],
    [{ status: 422 }, 'XML no es válido'],
    [new Error('boom'), 'No se pudo importar la compra.'],
  ])('keeps the dialog open for %s', async (error, text) => {
    const { importPurchase } = renderSurface(vi.fn().mockRejectedValue(error))
    await clickImport()
    choose()
    expect(await screen.findByRole('alert')).toHaveTextContent(text)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(importPurchase).toHaveBeenCalledOnce()
  })
  it.each([
    [false, 'La compra fue importada'],
    [true, 'La compra ya estaba registrada'],
  ])(
    'retains the confirmed result for refresh-only retry alreadyExisted=%s',
    async (alreadyExisted, confirmationText) => {
      const confirmed = result(alreadyExisted)
      const onImported = vi
        .fn()
        .mockRejectedValueOnce(new Error('refresh failed'))
        .mockResolvedValue(undefined)
      const { importPurchase } = renderSurface(
        vi.fn().mockResolvedValue(confirmed),
        onImported,
      )
      await clickImport()
      choose()

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(confirmationText)
      expect(alert).toHaveTextContent(/no se pudo actualizar el historial/i)
      const retry = screen.getByRole('button', {
        name: 'Reintentar actualización',
      })
      fireEvent.click(retry)
      fireEvent.click(retry)

      await waitForClose()
      expect(importPurchase).toHaveBeenCalledOnce()
      expect(onImported).toHaveBeenCalledTimes(2)
      expect(onImported).toHaveBeenNthCalledWith(1, confirmed)
      expect(onImported).toHaveBeenNthCalledWith(2, confirmed)
    },
  )
  it('does not publish stale refresh completion after the surface unmounts', async () => {
    const confirmation = deferred<unknown>()
    const confirmed = result()
    const onImported = vi.fn(() => confirmation.promise)
    const { importPurchase, unmount } = renderSurface(
      vi.fn().mockResolvedValue(confirmed),
      onImported,
    )
    await clickImport()
    choose()
    await waitFor(() => expect(onImported).toHaveBeenCalledWith(confirmed))

    unmount()
    confirmation.resolve(undefined)
    await waitFor(() => expect(importPurchase).toHaveBeenCalledOnce())
    expect(onImported).toHaveBeenCalledOnce()
  })
  it('rejects non-XML files and restores focus after close', async () => {
    const user = userEvent.setup()
    const { importPurchase } = renderSurface()
    const trigger = screen.getByRole('button', { name: 'Importar compra' })
    await user.click(trigger)
    choose('compra.txt', 'text/plain')
    expect(await screen.findByRole('alert')).toHaveTextContent('XML')
    expect(importPurchase).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
  it('ignores completion after unmount', async () => {
    const pending = deferred<PurchaseImportResponse>()
    const importPurchase = vi.fn(() => pending.promise)
    const onImported = vi.fn()
    const { unmount } = renderSurface(importPurchase, onImported, true)
    await clickImport()
    choose()
    expect(importPurchase).toHaveBeenCalledOnce()
    unmount()
    pending.resolve(result())
    await waitFor(() => expect(onImported).not.toHaveBeenCalled())
  })
})

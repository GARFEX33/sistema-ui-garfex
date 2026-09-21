import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import type { SupplierProduct } from './compras.types'

type UnlinkSupplierProduct = (input: { id: string }) => Promise<SupplierProduct>

export interface DesvincularPartidaSurfaceProps {
  supplierProductId: string
  unlinkSupplierProduct: UnlinkSupplierProduct
  onUnlinked: (updatedSupplierProduct: SupplierProduct) => void | Promise<void>
}

const errorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede desvincular sin configurar el actor local.'
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  )
    return 'El backend rechazó la desvinculación por conflicto.'
  return 'No se pudo desvincular el producto. Revisa el error y reintenta.'
}

export function DesvincularPartidaSurface({
  supplierProductId,
  unlinkSupplierProduct,
  onUnlinked,
}: DesvincularPartidaSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmedSupplierProduct, setConfirmedSupplierProduct] =
    useState<SupplierProduct | null>(null)
  const [rereadPending, setRereadPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const mountedRef = useRef(true)
  const busyRef = useRef(false)
  const wasOpen = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  useEffect(() => {
    if (isOpen) wasOpen.current = true
    else if (wasOpen.current) {
      restoreFocusNextFrame(triggerRef.current, [])
      wasOpen.current = false
    }
  }, [isOpen])

  const open = () => {
    if (busyRef.current) return
    setConfirmedSupplierProduct(null)
    setRereadPending(false)
    setError(null)
    setIsOpen(true)
  }
  const close = () => {
    if (busyRef.current) return
    setIsOpen(false)
    setConfirmedSupplierProduct(null)
    setRereadPending(false)
    setError(null)
  }
  const confirm = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const updated =
        confirmedSupplierProduct ??
        (await unlinkSupplierProduct({ id: supplierProductId }))
      if (!mountedRef.current) return
      setConfirmedSupplierProduct(updated)
      try {
        await onUnlinked(updated)
      } catch {
        if (mountedRef.current) {
          setRereadPending(true)
          setError(
            'Desvinculación confirmada, pero el detalle no se actualizó. Reintenta la lectura.',
          )
        }
        return
      }
      if (!mountedRef.current) return
      setIsOpen(false)
      setConfirmedSupplierProduct(null)
      setRereadPending(false)
    } catch (reason) {
      if (mountedRef.current) setError(errorMessage(reason))
    } finally {
      busyRef.current = false
      if (mountedRef.current) setBusy(false)
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        onPress={open}
        isDisabled={busy}
        aria-label={`Desvincular producto de proveedor ${supplierProductId}`}
      >
        Desvincular producto {supplierProductId}
      </Button>
      <Dialog
        isOpen={isOpen}
        isDismissable={!busy}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label={`Desvincular producto de proveedor ${supplierProductId}`}
      >
        <DialogHeading
          title={`Desvincular producto ${supplierProductId}`}
          hint="Esc cerrar"
        />
        <p className="mb-3 text-sm text-text-secondary">
          Esta acción solicitará al backend la desvinculación del producto.
          Confirma sólo si deseas continuar.
        </p>
        {error && (
          <p role="alert" className="mb-3 text-sm text-text-secondary">
            {error}
          </p>
        )}
        <DialogActions>
          <Button variant="outline" onPress={close} isDisabled={busy}>
            Cancelar
          </Button>
          <Button onPress={() => void confirm()} isDisabled={busy}>
            {busy
              ? rereadPending
                ? 'Actualizando detalle…'
                : 'Desvinculando…'
              : confirmedSupplierProduct
                ? 'Reintentar actualización'
                : 'Confirmar desvinculación'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

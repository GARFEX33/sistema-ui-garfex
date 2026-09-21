import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import type { PurchaseLine } from './compras.types'

const overrideReason = 'Marcado manual de partida como no aplicable'

type SetPurchaseLineResolutionOverride = (input: {
  id: string
  override: 'NO_APLICA'
  expectedRevision: string
  reason: string
}) => Promise<PurchaseLine>

export interface MarcarNoAplicaActionProps {
  purchaseLineId: string
  /** Optional context is accepted but never required for this status override. */
  supplierProductId?: string | null
  resolutionRevision: string
  setPurchaseLineResolutionOverride: SetPurchaseLineResolutionOverride
  onMarked: (updatedLine: PurchaseLine) => void | Promise<void>
}

const errorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede marcar como no aplicable sin configurar el actor local.'
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  )
    return 'El backend rechazó marcar la partida como no aplicable por conflicto.'
  return 'No se pudo marcar la partida como no aplicable. Revisa el error y reintenta.'
}

export function MarcarNoAplicaAction({
  purchaseLineId,
  resolutionRevision,
  setPurchaseLineResolutionOverride,
  onMarked,
}: MarcarNoAplicaActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmedLine, setConfirmedLine] = useState<PurchaseLine | null>(null)
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
    setConfirmedLine(null)
    setRereadPending(false)
    setError(null)
    setIsOpen(true)
  }
  const close = () => {
    if (busyRef.current) return
    setIsOpen(false)
    setConfirmedLine(null)
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
        confirmedLine ??
        (await setPurchaseLineResolutionOverride({
          id: purchaseLineId,
          override: 'NO_APLICA',
          expectedRevision: resolutionRevision,
          reason: overrideReason,
        }))
      if (!mountedRef.current) return
      setConfirmedLine(updated)
      try {
        await onMarked(updated)
      } catch {
        if (mountedRef.current) {
          setRereadPending(true)
          setError(
            'NO_APLICA confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
          )
        }
        return
      }
      if (!mountedRef.current) return
      setIsOpen(false)
      setConfirmedLine(null)
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
        aria-label="Marcar como no aplicable"
      >
        Marcar como no aplicable
      </Button>
      <Dialog
        isOpen={isOpen}
        isDismissable={!busy}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label="Marcar partida como no aplicable"
      >
        <DialogHeading
          title="Marcar partida como no aplicable"
          hint="Esc cerrar"
        />
        <p className="mb-3 text-sm text-text-secondary">
          Esta acción marcará la partida como no aplicable a un Recurso Maestro
          después de la confirmación del backend. Confirma sólo si deseas
          continuar.
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
                : 'Marcando como no aplicable…'
              : confirmedLine
                ? 'Reintentar actualización'
                : 'Confirmar marcar como no aplicable'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import type { ResourcesMasterRestReadApi } from '../resources-master/resourcesMaster.api'
import type { Resource } from '../resources-master/resourcesMaster.types'
import { ResourcePicker } from './ResourcePicker'
import type { SupplierProductMappingProjection } from './compras.types'

const mappingReason = 'Vinculación manual de producto de proveedor'

type ConfirmSupplierProductMapping = (input: {
  id: string
  resourceId: string
  expectedRevision: string
  reason: string
}) => Promise<SupplierProductMappingProjection>

export interface VincularPartidaSurfaceProps {
  supplierProductId: string
  supplierContext: string
  mappingRevision: string
  resourcesApi: ResourcesMasterRestReadApi
  confirmSupplierProductMapping: ConfirmSupplierProductMapping
  onLinked: (
    updatedSupplierProduct: SupplierProductMappingProjection,
  ) => void | Promise<void>
}

const errorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede vincular sin configurar el actor local.'
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  )
    return 'El backend rechazó el vínculo por conflicto.'
  return 'No se pudo vincular el producto. Revisa el error y reintenta.'
}

export function VincularPartidaSurface({
  supplierProductId,
  supplierContext,
  mappingRevision,
  resourcesApi,
  confirmSupplierProductMapping,
  onLinked,
}: VincularPartidaSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Resource | null>(null)
  const [confirmedSupplierProduct, setConfirmedSupplierProduct] =
    useState<SupplierProductMappingProjection | null>(null)
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
    setSelected(null)
    setConfirmedSupplierProduct(null)
    setRereadPending(false)
    setError(null)
    setIsOpen(true)
  }
  const close = () => {
    if (busyRef.current) return
    setIsOpen(false)
    setSelected(null)
    setConfirmedSupplierProduct(null)
    setRereadPending(false)
    setError(null)
  }
  const confirm = async () => {
    if ((!selected && !confirmedSupplierProduct) || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const updated =
        confirmedSupplierProduct ??
        (await confirmSupplierProductMapping({
          id: supplierProductId,
          resourceId: selected!.id,
          expectedRevision: mappingRevision,
          reason: mappingReason,
        }))
      if (!mountedRef.current) return
      setConfirmedSupplierProduct(updated)
      try {
        await onLinked(updated)
      } catch {
        if (mountedRef.current) {
          setRereadPending(true)
          setError(
            'Vínculo confirmado, pero el detalle no se actualizó. Reintenta la lectura.',
          )
        }
        return
      }
      if (!mountedRef.current) return
      setIsOpen(false)
      setSelected(null)
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
        aria-label={`Vincular producto de proveedor ${supplierProductId}`}
      >
        Vincular producto {supplierProductId}
      </Button>
      <Dialog
        isOpen={isOpen}
        isDismissable={!busy}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label={`Vincular producto de proveedor ${supplierProductId}`}
      >
        <DialogHeading
          title={`Vincular producto ${supplierProductId}`}
          hint="Esc cerrar"
        />
        <p className="mb-3 text-sm text-text-secondary">
          Proveedor: {supplierContext}. Selecciona un recurso activo; la
          selección no confirma el vínculo.
        </p>
        {error && (
          <p role="alert" className="mb-3 text-sm text-text-secondary">
            {error}
          </p>
        )}
        {isOpen && (
          <ResourcePicker
            api={resourcesApi}
            selected={selected}
            disabled={busy}
            onSelect={setSelected}
          />
        )}
        <DialogActions>
          <Button variant="outline" onPress={close} isDisabled={busy}>
            Cancelar
          </Button>
          <Button
            onPress={() => void confirm()}
            isDisabled={
              busy || (selected === null && !confirmedSupplierProduct)
            }
          >
            {busy
              ? rereadPending
                ? 'Actualizando detalle…'
                : 'Vinculando…'
              : confirmedSupplierProduct
                ? 'Reintentar actualización'
                : 'Confirmar vínculo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

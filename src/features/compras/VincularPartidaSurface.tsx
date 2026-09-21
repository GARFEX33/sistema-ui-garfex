import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { StagedSearchSelector } from '../resources-master/StagedSearchSelector'
import type { ResourcesMasterRestReadApi } from '../resources-master/resourcesMaster.api'
import type { Resource } from '../resources-master/resourcesMaster.types'
import { useResourcesMasterRestWindow } from '../resources-master/useResourcesMasterRestWindow'
import type { SupplierProduct } from './compras.types'

type LinkSupplierProduct = (input: {
  id: string
  resourceId: string
}) => Promise<SupplierProduct>

export interface VincularPartidaSurfaceProps {
  supplierProductId: string
  supplierContext: string
  resourcesApi: ResourcesMasterRestReadApi
  linkSupplierProduct: LinkSupplierProduct
  onLinked: (updatedSupplierProduct: SupplierProduct) => void | Promise<void>
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

function ResourcePicker({
  api,
  selected,
  disabled,
  onSelect,
}: {
  api: ResourcesMasterRestReadApi
  selected: Resource | null
  disabled: boolean
  onSelect: (resource: Resource) => void
}) {
  const window = useResourcesMasterRestWindow(api, {
    text: '',
    scope: 'ACTIVE',
    limit: 20,
  })
  const [direction, setDirection] = useState<'anterior' | 'siguiente'>(
    'siguiente',
  )
  const navigationError = window.status === 'navigation-error'
  const navigating = window.status === 'navigating'
  const showSelector = !disabled && !navigating && !navigationError
  const loadState =
    window.status === 'initial-loading'
      ? { status: 'loading' as const }
      : window.status === 'initial-error'
        ? { status: 'initial-error' as const }
        : window.status === 'empty'
          ? { status: 'empty' as const }
          : { status: 'ready' as const, exhausted: !window.hasNext }
  const move = (side: 'anterior' | 'siguiente') => {
    setDirection(side)
    if (side === 'anterior') window.previous()
    else window.next()
  }

  return (
    <div className="grid gap-3">
      {showSelector && (
        <StagedSearchSelector
          label="Recurso maestro activo"
          autoFocus
          items={window.resources}
          itemKey={(item) => item.id}
          itemName={(item) => `${item.identityV1} (ID: ${item.id})`}
          renderItem={(item) => `${item.identityV1} (ID: ${item.id})`}
          confirmedKey={selected?.id ?? null}
          loadState={loadState}
          maxVisibleRows={20}
          onConfirm={onSelect}
          onLoadMore={() => undefined}
          onRetry={() => void window.retry()}
        />
      )}
      {(navigating || navigationError) && (
        <div
          role={navigationError ? 'alert' : 'status'}
          aria-live="polite"
          className="text-sm text-text-secondary"
        >
          {navigationError
            ? `No se pudo cargar la página ${direction}.`
            : 'Cargando la página solicitada…'}{' '}
          {navigationError && (
            <Button
              variant="outline"
              onPress={() => void window.retry()}
              isDisabled={disabled}
            >
              Reintentar página {direction}
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Paginación de recursos">
        <Button
          variant="outline"
          aria-label="Página anterior"
          isDisabled={disabled || navigating || !window.hasPrevious}
          onPress={() => move('anterior')}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          aria-label="Página siguiente"
          isDisabled={disabled || navigating || !window.hasNext}
          onPress={() => move('siguiente')}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export function VincularPartidaSurface({
  supplierProductId,
  supplierContext,
  resourcesApi,
  linkSupplierProduct,
  onLinked,
}: VincularPartidaSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Resource | null>(null)
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
        (await linkSupplierProduct({
          id: supplierProductId,
          resourceId: selected!.id,
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

import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { CrearRecursoSurface } from '../resources-master/CrearRecursoSurface'
import type { ResourcesMasterRestReadApi } from '../resources-master/resourcesMaster.api'
import type { Resource } from '../resources-master/resourcesMaster.types'
import type {
  PurchaseLineWorkbenchRow,
  ResolvePurchaseLineInput,
  ResolvePurchaseLineResponse,
} from './compras.types'
import { ResourcePicker } from './ResourcePicker'

const resolutionReason = 'Resolución manual de partida de compra'
const rereadGuidance =
  'La partida cambió o el resultado no pudo confirmarse. Volvé a leerla antes de intentar nuevamente.'

type ResolverError = Error & {
  status?: unknown
  code?: unknown
}

const asResolverError = (reason: unknown): ResolverError =>
  reason instanceof Error
    ? (reason as ResolverError)
    : Object.assign(new Error('Unknown resolution result'), { cause: reason })

const errorStatus = (reason: unknown) => {
  const status = asResolverError(reason).status
  return typeof status === 'number' ? status : undefined
}

const errorCode = (reason: unknown) => {
  const code = asResolverError(reason).code
  return typeof code === 'string' && code.length > 0 ? code : undefined
}

const errorMessage = (reason: unknown) => {
  if (reason instanceof RestActorConfigurationError)
    return {
      message: 'No se puede resolver sin configurar el actor local.',
      reread: false,
    }

  const status = errorStatus(reason)
  if (status === 409 || status === undefined || status >= 500)
    return { message: rereadGuidance, reread: true }

  if (status === 422) {
    const code = errorCode(reason)
    return {
      message: code
        ? `La resolución fue rechazada por validación (código: ${code}). Revisá los datos de la partida.`
        : 'La resolución fue rechazada por validación HTTP 422.',
      reread: false,
    }
  }

  return {
    message:
      'No se pudo resolver la partida. Revisá los datos e intentá nuevamente.',
    reread: false,
  }
}

const displayValue = (value: string | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : value

export interface ResolverPartidaSurfaceProps {
  row: PurchaseLineWorkbenchRow | null
  isOpen: boolean
  resourcesApi: ResourcesMasterRestReadApi
  resolvePurchaseLine: (
    input: ResolvePurchaseLineInput,
  ) => Promise<ResolvePurchaseLineResponse>
  onResolved: (response: ResolvePurchaseLineResponse) => void | Promise<void>
  onRereadRequired: () => void | Promise<void>
  onOpenChange: (isOpen: boolean) => void
}

const ImmutableContext = ({ row }: { row: PurchaseLineWorkbenchRow }) => (
  <dl className="mb-4 grid gap-2 rounded-md border border-border bg-surface-subtle p-3 text-sm sm:grid-cols-2">
    <div>
      <dt className="font-bold text-text-primary">Proveedor</dt>
      <dd>{row.supplierDisplayName}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">Serie / folio</dt>
      <dd>{`${displayValue(row.series)} / ${displayValue(row.folio)}`}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">UUID CFDI</dt>
      <dd className="break-all">{row.cfdiUuid}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">Fecha</dt>
      <dd>{row.issuedAt}</dd>
    </div>
    <div className="sm:col-span-2">
      <dt className="font-bold text-text-primary">Descripción</dt>
      <dd>{displayValue(row.description)}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">SKU proveedor (XML)</dt>
      <dd>{displayValue(row.supplierSku)}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">Cantidad / unidad</dt>
      <dd>{`${row.quantity} ${row.unit} (${row.unitCode})`}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">Precio unitario</dt>
      <dd>{row.unitPrice}</dd>
    </div>
    <div>
      <dt className="font-bold text-text-primary">Importe / moneda</dt>
      <dd>{`${row.amount} ${row.currency}`}</dd>
    </div>
  </dl>
)

export function ResolverPartidaSurface({
  row,
  isOpen,
  resourcesApi,
  resolvePurchaseLine,
  onResolved,
  onRereadRequired,
  onOpenChange,
}: ResolverPartidaSurfaceProps) {
  const [selected, setSelected] = useState<Resource | null>(null)
  const [commercialSupplierSku, setCommercialSupplierSku] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] =
    useState<ResolvePurchaseLineResponse | null>(null)
  const [resourceCreationSuccessMessage, setResourceCreationSuccessMessage] =
    useState<string | null>(null)
  const [resourceRefreshSignal, setResourceRefreshSignal] = useState(0)
  const [rereadStatus, setRereadStatus] = useState<
    'none' | 'pending' | 'failed'
  >('none')
  const busyRef = useRef(false)
  const mountedRef = useRef(true)
  const rowKey = row?.lineId ?? null

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setSelected(null)
    setCommercialSupplierSku('')
    setBusy(false)
    setError(null)
    setConfirmed(null)
    setResourceCreationSuccessMessage(null)
    setResourceRefreshSignal(0)
    setRereadStatus('none')
    busyRef.current = false
  }, [isOpen, rowKey])

  const close = () => {
    if (busyRef.current) return
    onOpenChange(false)
  }

  const refreshAfterConfirmation = async (
    response: ResolvePurchaseLineResponse,
  ) => {
    try {
      await onResolved(response)
      if (mountedRef.current) onOpenChange(false)
    } catch {
      if (mountedRef.current) {
        setError(
          'Resolución confirmada, pero no se pudo actualizar el detalle. Volvé a leer la partida.',
        )
      }
    }
  }

  const confirm = async () => {
    if (!row || !selected || busyRef.current || confirmed) return
    const requiresCommercialSku = row.supplierProductId === null
    if (requiresCommercialSku && commercialSupplierSku.trim() === '') return

    const input: ResolvePurchaseLineInput = {
      id: row.lineId,
      reason: resolutionReason,
      resourceId: selected.id,
      expectedSupplierProductId: row.supplierProductId,
      expectedMappingRevision: row.mappingRevision,
      expectedResolutionRevision: row.resolutionRevision,
      commercialSupplierSku: requiresCommercialSku ? commercialSupplierSku : '',
    }

    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const response = await resolvePurchaseLine(input)
      if (!mountedRef.current) return
      setConfirmed(response)
      await refreshAfterConfirmation(response)
    } catch (reason) {
      if (!mountedRef.current) return
      const failure = errorMessage(reason)
      if (failure.reread) {
        setRereadStatus('pending')
        setError(failure.message)
        try {
          await onRereadRequired()
          if (!mountedRef.current) return
          setSelected(null)
          setCommercialSupplierSku('')
          setRereadStatus('none')
          setError(null)
        } catch {
          if (!mountedRef.current) return
          setRereadStatus('failed')
          setError(
            'No se pudo releer la partida. Volvé a intentar la relectura.',
          )
        }
      } else {
        setRereadStatus('none')
        setError(failure.message)
      }
    } finally {
      busyRef.current = false
      if (mountedRef.current) setBusy(false)
    }
  }

  const handleResourceCreated = (message: string, resource?: Resource) => {
    setResourceCreationSuccessMessage(message)
    if (resource) setSelected(resource)
    setResourceRefreshSignal((signal) => signal + 1)
  }

  const reread = async () => {
    if (busyRef.current || confirmed) return
    busyRef.current = true
    setBusy(true)
    setRereadStatus('pending')
    setError(rereadGuidance)
    try {
      await onRereadRequired()
      if (!mountedRef.current) return
      setSelected(null)
      setCommercialSupplierSku('')
      setRereadStatus('none')
      setError(null)
    } catch {
      if (mountedRef.current) {
        setRereadStatus('failed')
        setError('No se pudo releer la partida. Volvé a intentar la relectura.')
      }
    } finally {
      busyRef.current = false
      if (mountedRef.current) setBusy(false)
    }
  }

  const retryRefresh = async () => {
    if (!confirmed || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      await onResolved(confirmed)
      if (mountedRef.current) onOpenChange(false)
    } catch {
      if (mountedRef.current)
        setError(
          'Resolución confirmada, pero no se pudo actualizar el detalle. Volvé a leer la partida.',
        )
    } finally {
      busyRef.current = false
      if (mountedRef.current) setBusy(false)
    }
  }

  const hasRequiredCommercialSku =
    row?.supplierProductId !== null && row?.supplierProductId !== undefined
      ? true
      : commercialSupplierSku.trim() !== ''
  const canConfirm =
    row !== null &&
    selected !== null &&
    hasRequiredCommercialSku &&
    !busy &&
    !confirmed &&
    rereadStatus === 'none'

  return (
    <Dialog
      isOpen={isOpen}
      isDismissable={!busy}
      onOpenChange={(openState) => {
        if (!openState) close()
      }}
      aria-label="Resolver partida de compra"
    >
      <DialogHeading
        title={
          row
            ? `Resolver partida ${row.lineNumber}`
            : 'Resolver partida de compra'
        }
        hint="Esc cerrar"
      />
      {row ? (
        <>
          <p className="mb-3 text-sm text-text-secondary">
            Contexto inmutable de la línea. Seleccioná un recurso activo para
            confirmar la resolución manual.
          </p>
          <ImmutableContext row={row} />
          {row.supplierProductId === null && (
            <Field
              label="SKU comercial del proveedor"
              htmlFor="commercialSupplierSku"
            >
              <input
                id="commercialSupplierSku"
                className={fieldInputClass}
                value={commercialSupplierSku}
                onChange={(event) =>
                  setCommercialSupplierSku(event.target.value)
                }
                required
                aria-required="true"
                aria-describedby="commercialSupplierSku-help"
                disabled={busy || confirmed !== null}
              />
              <p
                id="commercialSupplierSku-help"
                className="m-0 text-sm text-text-secondary"
              >
                Dato comercial posterior: no modifica el SKU informado en el
                XML.
              </p>
            </Field>
          )}
          {error && (
            <p role="alert" className="mb-3 text-sm text-text-secondary">
              {error}
            </p>
          )}
          {resourceCreationSuccessMessage && (
            <p role="status" className="mb-3 text-sm text-text-secondary">
              {resourceCreationSuccessMessage}
            </p>
          )}
          {isOpen && !confirmed && (
            <>
              <ResourcePicker
                api={resourcesApi}
                selected={selected}
                disabled={busy}
                onSelect={setSelected}
                refreshSignal={resourceRefreshSignal}
              />
              {!busy && (
                <CrearRecursoSurface
                  api={resourcesApi}
                  onSuccess={handleResourceCreated}
                />
              )}
            </>
          )}
          {confirmed && error === null && (
            <p role="status" className="mb-3 text-sm text-text-secondary">
              Resolución confirmada. Actualizando el detalle…
            </p>
          )}
          <DialogActions>
            <Button variant="outline" onPress={close} isDisabled={busy}>
              Cancelar
            </Button>
            {confirmed ? (
              <Button onPress={() => void retryRefresh()} isDisabled={busy}>
                {busy ? 'Actualizando detalle…' : 'Reintentar actualización'}
              </Button>
            ) : (
              <>
                {rereadStatus === 'failed' && (
                  <Button onPress={() => void reread()} isDisabled={busy}>
                    Releer partida
                  </Button>
                )}
                <Button onPress={() => void confirm()} isDisabled={!canConfirm}>
                  {busy ? 'Resolviendo…' : 'Confirmar resolución'}
                </Button>
              </>
            )}
          </DialogActions>
        </>
      ) : (
        <DialogActions>
          <Button variant="outline" onPress={close} isDisabled={busy}>
            Cancelar
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

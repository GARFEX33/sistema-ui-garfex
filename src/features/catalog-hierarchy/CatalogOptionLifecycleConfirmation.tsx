import { type FormEvent, type Ref, useId, useState } from 'react'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { Button } from '../../shared/ui/Button'
import type { CatalogOptionAdminRecord } from './catalogOptionsAdmin.types'
import type { CatalogOptionsAdminCommandStatus } from './useCatalogOptionsAdmin'

export type CatalogOptionLifecycleAction =
  | 'deactivate'
  | 'reactivate'
  | 'delete'

export interface CatalogOptionLifecycleIntent {
  id: string
  expectedRevision: string
  action: CatalogOptionLifecycleAction
}

export interface CatalogOptionLifecycleConfirmationProps {
  record: CatalogOptionAdminRecord
  actorAvailable: boolean
  commandStatus: CatalogOptionsAdminCommandStatus
  commandError: Error | null
  mode?: 'delete'
  cancelButtonRef?: Ref<HTMLButtonElement>
  onCancel: () => void
  onConfirm: (intent: CatalogOptionLifecycleIntent) => void | Promise<unknown>
}

const actionFor = (
  record: CatalogOptionAdminRecord,
  mode?: 'delete',
): CatalogOptionLifecycleAction =>
  mode === 'delete' ? 'delete' : record.active ? 'deactivate' : 'reactivate'

const actionLabel = (action: CatalogOptionLifecycleAction) =>
  action === 'delete'
    ? 'Eliminar permanentemente'
    : action === 'deactivate'
      ? 'Desactivar'
      : 'Reactivar'

const pendingLabel = (action: CatalogOptionLifecycleAction) =>
  action === 'delete'
    ? 'Eliminando permanentemente'
    : action === 'deactivate'
      ? 'Desactivando opción'
      : 'Reactivando opción'

const commandMessage = (
  action: CatalogOptionLifecycleAction,
  status: CatalogOptionsAdminCommandStatus,
  error: Error | null,
) => {
  const errorCode = (error as (Error & { code?: unknown }) | null)?.code
  if (action === 'delete') {
    switch (errorCode) {
      case 'IN_USE':
        return 'La opción está en uso por Recursos y no se puede eliminar permanentemente.'
      case 'INVALID_LIFECYCLE':
        return 'La opción debe permanecer inactiva. Actualizá los datos y confirmá nuevamente.'
      case 'CONFLICT':
        return 'La opción cambió de revisión. Actualizá los datos y reconfirmá la eliminación.'
      case 'NOT_FOUND':
        return 'La opción ya no existe. Actualizá los datos antes de continuar.'
      case 'UNAVAILABLE':
        return 'El servicio no está disponible. Reintentá manualmente más tarde.'
      case 'INTERNAL':
        return 'Ocurrió un error del servidor. Reintentá manualmente más tarde.'
      default:
        return error
          ? 'No se pudo eliminar permanentemente. Reintentá manualmente más tarde.'
          : null
    }
  }
  if (status === 'conflict')
    return 'La opción cambió en otra operación. Revisá los datos antes de intentar nuevamente.'
  const code = (error as (Error & { status?: unknown }) | null)?.status
  const label = action === 'deactivate' ? 'desactivar' : 'reactivar'
  if (code === 422) return `No se pudo ${label} la opción. Revisá los datos.`
  if (code === 503)
    return 'El servicio está temporalmente no disponible. Intentá nuevamente más tarde.'
  return error
    ? `No se pudo conectar para ${label} la opción. Intentá nuevamente.`
    : null
}

export function CatalogOptionLifecycleConfirmation({
  record,
  actorAvailable,
  commandStatus,
  commandError,
  mode,
  cancelButtonRef,
  onCancel,
  onConfirm,
}: CatalogOptionLifecycleConfirmationProps) {
  const [submitting, setSubmitting] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const reasonId = useId()
  const confirmationId = useId()
  const confirmationFormId = useId()
  const action = actionFor(record, mode)
  const label = actionLabel(action)
  const pending = submitting || commandStatus === 'pending'
  const codeMatches = action !== 'delete' || confirmationCode === record.code
  const disabledReason = !actorAvailable
    ? 'No se puede confirmar hasta contar con un actor válido.'
    : pending
      ? 'La confirmación está en curso.'
      : !codeMatches
        ? `Escribí exactamente ${record.code} para confirmar.`
        : null
  const error = commandMessage(action, commandStatus, commandError)
  const cancel = () => {
    if (!pending) onCancel()
  }
  const confirm = async () => {
    if (!actorAvailable || pending || !codeMatches) return
    setSubmitting(true)
    try {
      await onConfirm({
        action,
        expectedRevision: record.revision,
        id: record.id,
      })
    } catch {
      // The parent-owned command status and error region report failed commands.
    } finally {
      setSubmitting(false)
    }
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void confirm()
  }

  return (
    <section
      aria-label={
        action === 'delete'
          ? 'Confirmar eliminación permanente de opción'
          : `Confirmar ${action === 'deactivate' ? 'desactivación' : 'reactivación'} de opción`
      }
      className="space-y-4"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.stopPropagation()
        if (pending) {
          event.preventDefault()
          return
        }
        onCancel()
      }}
    >
      <div className="space-y-2">
        <h3 className="m-0 text-sm font-bold text-text-primary">
          {action === 'delete' ? label : `${label} opción`}
        </h3>
        <p className="m-0 text-sm leading-6 text-text-secondary">
          {action === 'delete'
            ? 'Vas a eliminar permanentemente la opción '
            : `Vas a ${action === 'deactivate' ? 'desactivar' : 'reactivar'} la opción `}
          <strong className="text-text-primary">{record.label}</strong> (Código:{' '}
          <strong className="text-text-primary">{record.code}</strong>).
        </p>
      </div>
      <aside
        aria-label="Impacto global de la opción"
        className="rounded-md border border-border-strong bg-surface-subtle p-3 text-sm leading-6 text-text-primary"
        role="note"
      >
        {action === 'delete'
          ? 'Esta eliminación es irreversible y global. Core bloquea la eliminación de opciones usadas por cualquier Recurso.'
          : 'Este cambio afecta globalmente a todos los consumidores de optionSetCode '}
        {action !== 'delete' && record.optionSet.code}
        {action !== 'delete' && ' y characteristicCode '}
        {action !== 'delete' && record.characteristic.code}
        {action !== 'delete' && '.'}
      </aside>
      {action === 'delete' && (
        <form id={confirmationFormId} onSubmit={submit}>
          <Field
            label="Código para confirmar eliminación"
            htmlFor={confirmationId}
          >
            <input
              autoFocus
              className={`${fieldInputClass} focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2`}
              disabled={pending}
              id={confirmationId}
              onChange={(event) => setConfirmationCode(event.target.value)}
              value={confirmationCode}
            />
          </Field>
        </form>
      )}
      {disabledReason && (
        <p
          className="m-0 text-sm leading-6 text-text-secondary"
          id={reasonId}
          role="status"
        >
          {disabledReason}
        </p>
      )}
      {error && (
        <p className="m-0 text-sm leading-6 text-text-primary" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          autoFocus={action !== 'delete'}
          isDisabled={pending}
          onPress={cancel}
          ref={cancelButtonRef}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button
          aria-describedby={disabledReason ? reasonId : undefined}
          form={action === 'delete' ? confirmationFormId : undefined}
          className={
            action === 'delete'
              ? 'border-primary bg-primary text-surface hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2'
              : undefined
          }
          isDisabled={!!disabledReason}
          onPress={action === 'delete' ? undefined : () => void confirm()}
          type={action === 'delete' ? 'submit' : 'button'}
        >
          {pending
            ? pendingLabel(action)
            : action === 'delete'
              ? label
              : `${label} opción`}
        </Button>
      </div>
    </section>
  )
}

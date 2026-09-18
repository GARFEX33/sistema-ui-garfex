import { type FormEvent, useEffect, useId, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { CatalogOptionsAdminHttpError } from './catalogOptionsAdmin.api'
import type {
  CatalogOptionAdminRecord,
  CatalogOptionsAdminCreateInput,
  CatalogOptionsAdminReference,
  CatalogOptionsAdminUpdateInput,
} from './catalogOptionsAdmin.types'
import type { CatalogOptionsAdminCommandStatus } from './useCatalogOptionsAdmin'

export type CatalogOptionCommandDraft =
  | CatalogOptionsAdminCreateInput
  | CatalogOptionsAdminUpdateInput

export type CatalogOptionFormProps = Readonly<{
  optionSet: CatalogOptionsAdminReference<'CONJUNTO_OPCIONES'>
  characteristic: CatalogOptionsAdminReference<'CARACTERISTICA'>
  actorAvailable: boolean
  commandStatus: CatalogOptionsAdminCommandStatus
  commandError: Error | null
  onSubmit: (draft: CatalogOptionCommandDraft) => void | Promise<unknown>
  onCancel: () => void
}> &
  (
    | Readonly<{ mode: 'create' }>
    | Readonly<{ mode: 'edit'; record: CatalogOptionAdminRecord }>
  )

const publicDetail = (error: CatalogOptionsAdminHttpError) => {
  const approved =
    (error.status === 400 && error.message === 'invalid request') ||
    (error.status === 422 && error.message === 'validation failed')
  return approved ? error.detail : undefined
}

const commandMessage = (
  status: CatalogOptionsAdminCommandStatus,
  error: Error | null,
) => {
  if (status === 'conflict')
    return 'La opción cambió en otra operación. Revisá los datos antes de intentar nuevamente.'
  if (error instanceof CatalogOptionsAdminHttpError) {
    const detail = publicDetail(error)
    if (error.status === 400)
      return detail
        ? `El backend rechazó la solicitud: ${detail}.`
        : 'El backend rechazó la solicitud (400). Intentá nuevamente.'
    if (error.status === 404)
      return 'El backend no encontró la opción solicitada (404). Revisá el contexto e intentá nuevamente.'
    if (error.status === 409)
      return 'La opción cambió en otra operación. Revisá los datos antes de intentar nuevamente.'
    if (error.status === 422)
      return detail
        ? `No se pudo guardar: ${detail}.`
        : 'No se pudo guardar: revisá Código y Etiqueta.'
    if (error.status === 500)
      return 'El servidor no pudo procesar la solicitud. Intentá nuevamente más tarde.'
    if (error.status === 503)
      return 'El servicio está temporalmente no disponible. Intentá nuevamente más tarde.'
  }
  return error
    ? 'No se pudo conectar para guardar la opción. Intentá nuevamente.'
    : null
}

export function CatalogOptionForm(props: CatalogOptionFormProps) {
  const record = props.mode === 'edit' ? props.record : undefined
  const reasonId = useId()
  const [code, setCode] = useState(record?.code ?? '')
  const [label, setLabel] = useState(record?.label ?? '')
  const [submitting, setSubmitting] = useState(false)
  const optionSet = record?.optionSet ?? props.optionSet
  const characteristic = record?.characteristic ?? props.characteristic

  useEffect(() => {
    setCode(record?.code ?? '')
    setLabel(record?.label ?? '')
  }, [record?.code, record?.id, record?.label, record?.revision])

  const valid = code.length > 0 && label.length > 0
  const pending = submitting || props.commandStatus === 'pending'
  const disabledReason = !props.actorAvailable
    ? 'No se puede enviar hasta contar con un actor válido.'
    : !valid
      ? 'Completá Código y Etiqueta para enviar la opción.'
      : pending
        ? 'El envío está en curso.'
        : null
  const error = commandMessage(props.commandStatus, props.commandError)
  const submitLabel = pending
    ? props.mode === 'create'
      ? 'Creando opción'
      : 'Guardando cambios'
    : props.mode === 'create'
      ? 'Crear opción'
      : 'Guardar cambios'

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!props.actorAvailable || !valid || pending) return
    const values = { optionSet, characteristic, code, label }
    const draft: CatalogOptionCommandDraft = record
      ? { id: record.id, expectedRevision: record.revision, values }
      : { values }
    setSubmitting(true)
    try {
      await props.onSubmit(draft)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      aria-label={record ? 'Editar opción' : 'Crear opción'}
      onSubmit={submit}
    >
      <div className="space-y-4">
        <section
          aria-label="Contexto inmutable de la opción"
          className="rounded-md border border-border bg-surface-subtle p-3"
        >
          <h3 className="m-0 text-sm font-bold text-text-primary">Contexto</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-text-secondary">
                optionSetCode
              </dt>
              <dd className="m-0 break-words text-text-primary">
                {optionSet.code}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text-secondary">
                characteristicCode
              </dt>
              <dd className="m-0 break-words text-text-primary">
                {characteristic.code}
              </dd>
            </div>
            {record && (
              <>
                <div>
                  <dt className="font-semibold text-text-secondary">ID</dt>
                  <dd className="m-0 text-text-primary">{record.id}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-secondary">
                    Revisión
                  </dt>
                  <dd className="m-0 text-text-primary">{record.revision}</dd>
                </div>
              </>
            )}
          </dl>
        </section>
        <Field htmlFor="catalog-option-code" label="Código">
          <input
            aria-invalid={!code}
            className={fieldInputClass}
            disabled={pending}
            id="catalog-option-code"
            onChange={(event) => setCode(event.target.value)}
            required
            value={code}
          />
        </Field>
        <Field htmlFor="catalog-option-label" label="Etiqueta">
          <input
            aria-invalid={!label}
            className={fieldInputClass}
            disabled={pending}
            id="catalog-option-label"
            onChange={(event) => setLabel(event.target.value)}
            required
            value={label}
          />
        </Field>
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
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onPress={props.onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button
          aria-describedby={disabledReason ? reasonId : undefined}
          isDisabled={!!disabledReason}
          type="submit"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

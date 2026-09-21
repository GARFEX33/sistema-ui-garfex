import { type FormEvent, useId, useLayoutEffect, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogContent } from '../../shared/ui/Dialog'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { ExistingCharacteristicPicker } from './ExistingCharacteristicPicker'
import type {
  CatalogAttributeCreationContext,
  CatalogCharacteristicRecord,
} from './catalogAttributeCreation.types'
import type { CatalogTypeEffectiveAttributesStatus } from './useCatalogTypeEffectiveAttributes'
import type { useCatalogAttributeCreation } from './useCatalogAttributeCreation'

type Context = CatalogAttributeCreationContext & { sessionId?: string }
type Creation = ReturnType<typeof useCatalogAttributeCreation>

export interface CrearAtributoSurfaceProps {
  actorAvailable: boolean
  context: Context
  creation: Creation
  effectiveStatus?: CatalogTypeEffectiveAttributesStatus
  effectiveFresh?: boolean
  effectiveCharacteristicCodes?: readonly string[]
}

const valueTypes = [
  'CONTROLLED_TEXT',
  'CONTROLLED_OPTION',
  'INTEGER',
  'DECIMAL',
  'QUANTITY',
  'BOOLEAN',
] as const
const modes = ['REQUIRED', 'OPTIONAL', 'FORBIDDEN'] as const
const stepLabel = (name: string, origin: 'created' | 'existing' | null) =>
  ({
    applicability: 'APLICABILIDAD',
    characteristic:
      origin === 'existing' ? 'CARACTERÍSTICA REUTILIZADA' : 'CARACTERÍSTICA',
    presentation: 'PRESENTACIÓN',
  })[name] ?? name
const stepStatus = (status: string) =>
  ({
    confirmed: 'Confirmada',
    failed: 'Fallida',
    'not-started': 'Pendiente',
    pending: 'En curso',
    'reconciliation-required': 'Requiere conciliación',
    unconfirmed: 'Sin confirmar',
  })[status] ?? status
export function CrearAtributoSurface({
  actorAvailable,
  context,
  creation,
  effectiveStatus = 'waiting-context',
  effectiveFresh = false,
  effectiveCharacteristicCodes = [],
}: CrearAtributoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<'new' | 'existing'>('new')
  const [selected, setSelected] = useState<CatalogCharacteristicRecord | null>(
    null,
  )
  const [valueType, setValueType] =
    useState<(typeof valueTypes)[number]>('CONTROLLED_TEXT')
  const [mode, setMode] = useState<(typeof modes)[number]>('OPTIONAL')
  const [identityParticipates, setIdentityParticipates] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [position, setPosition] = useState('')
  const [positionError, setPositionError] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [invalidatedPending, setInvalidatedPending] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const positionRef = useRef<HTMLInputElement>(null)
  const wasOpen = useRef(false)
  const openedContextRef = useRef<string | null>(null)
  const previousStatusRef = useRef(creation.status)
  const warningId = useId()
  const triggerReasonId = useId()
  const footerReasonId = useId()
  const contextKey = JSON.stringify([
    context.sessionId ?? '',
    context.classCode ?? '',
    context.familyCode ?? '',
    context.typeCode ?? '',
  ])
  const ready =
    !!context.sessionId &&
    !!context.classCode &&
    !!context.familyCode &&
    !!context.typeCode
  const effectiveAvailable =
    effectiveFresh &&
    (effectiveStatus === 'ready' || effectiveStatus === 'empty')
  const effectiveCodes = new Set(effectiveCharacteristicCodes)
  const contextChanged =
    isOpen &&
    openedContextRef.current !== null &&
    openedContextRef.current !== contextKey
  const pending = creation.status === 'pending'
  const unresolved =
    pending ||
    creation.status === 'partial' ||
    creation.status === 'reconciliation-required'
  const locked = pending || invalidatedPending || contextChanged
  const existingSelectionDisabled =
    locked || !ready || !actorAvailable || !effectiveAvailable || unresolved
  const positionValid = /^[1-9][0-9]*$/.test(position)
  const disabledReason =
    invalidatedPending || contextChanged
      ? 'El contexto cambió durante la creación. El resultado parcial anterior no se puede continuar desde este diálogo.'
      : !ready
        ? 'Seleccioná Clase, Familia y Tipo antes de crear un atributo.'
        : !actorAvailable
          ? 'No se puede crear hasta contar con un actor válido.'
          : source === 'existing' && !effectiveAvailable
            ? 'Esperá atributos efectivos actuales antes de asignar una característica existente.'
            : unresolved
              ? 'La operación anterior sigue sin resolver. Podés releer desde Core, pero no iniciar otra creación o asignación.'
              : source === 'existing' &&
                  selected &&
                  effectiveCodes.has(selected.code)
                ? 'La característica seleccionada ya es efectiva en este Tipo.'
                : source === 'existing' && selected === null
                  ? 'Seleccioná una característica existente activa.'
                  : !positionValid
                    ? 'Indicá una posición entera positiva en este Tipo.'
                    : !confirmed
                      ? 'Confirmá el resumen de pasos antes de continuar.'
                      : null
  const error = creation.steps.find((step) => step.error)?.error
  const canRereadCore =
    !pending &&
    (creation.status === 'partial' ||
      creation.status === 'reconciliation-required')

  useLayoutEffect(() => {
    if (wasOpen.current && !isOpen)
      restoreFocusNextFrame(triggerRef.current, [
        () => document.getElementById('catalog-attributes-tab'),
      ])
    if (!wasOpen.current && isOpen && source === 'new') codeRef.current?.focus()
    wasOpen.current = isOpen
  }, [isOpen, source])

  useLayoutEffect(() => {
    if (isOpen && positionError) positionRef.current?.focus()
  }, [isOpen, positionError])

  useLayoutEffect(() => {
    if (!isOpen || !contextChanged) return
    creation.clearExistingSearch()
    setSelected(null)
    if (previousStatusRef.current === 'pending') {
      setInvalidatedPending(true)
      return
    }
    setIsOpen(false)
  }, [contextChanged, creation, isOpen])

  useLayoutEffect(() => {
    previousStatusRef.current = creation.status
  }, [creation.status])

  const select = (
    label: string,
    name: string,
    value: string,
    update: (value: string) => void,
    items: readonly string[],
  ) => (
    <Field htmlFor={`catalog-attribute-${name}`} label={label}>
      <select
        className={fieldInputClass}
        disabled={locked}
        id={`catalog-attribute-${name}`}
        onChange={(event) => update(event.target.value)}
        value={value}
      >
        {items.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </Field>
  )
  const positionField = (label: string) => (
    <Field htmlFor="catalog-attribute-position" label={label}>
      <input
        aria-describedby={positionError ? 'position-error' : warningId}
        aria-invalid={positionError || undefined}
        className={fieldInputClass}
        disabled={locked}
        id="catalog-attribute-position"
        min={1}
        name="position"
        onChange={(event) => {
          setPosition(event.target.value)
          setPositionError(false)
          setConfirmed(false)
        }}
        onInvalid={() => setPositionError(true)}
        ref={positionRef}
        required
        type="number"
        value={position}
      />
    </Field>
  )
  const close = () => {
    if (locked) return
    creation.clearExistingSearch()
    setSelected(null)
    setIsOpen(false)
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ready || disabledReason || openedContextRef.current !== contextKey)
      return
    const data = new FormData(event.currentTarget)
    const submittedPosition = String(data.get('position') ?? position)
    if (!/^[1-9][0-9]*$/.test(submittedPosition)) {
      setPositionError(true)
      return
    }
    if (source === 'existing') {
      if (!selected || !effectiveAvailable || effectiveCodes.has(selected.code))
        return
      void creation.assignExisting({
        characteristic: selected,
        identityParticipates,
        mode,
        position: submittedPosition,
      })
      return
    }
    const code = String(data.get('code') ?? '')
    const name = String(data.get('name') ?? '')
    if (!code || !name) return
    void creation.submit({
      code,
      identityParticipates,
      mode,
      name,
      position: submittedPosition,
      valueType,
    })
  }

  return (
    <>
      <Button
        aria-describedby={!ready ? triggerReasonId : undefined}
        isDisabled={!ready}
        onPress={() => {
          openedContextRef.current = contextKey
          setInvalidatedPending(false)
          setIsOpen(true)
        }}
        ref={triggerRef}
        type="button"
      >
        Crear atributo
      </Button>
      {!ready && (
        <p className="sr-only" id={triggerReasonId} role="status">
          Seleccioná Clase, Familia y Tipo antes de crear un atributo.
        </p>
      )}
      <Dialog
        aria-label="Crear atributo"
        isDismissable={!locked}
        isOpen={isOpen}
        layout="single-scroll"
        onOpenChange={(open) => !open && close()}
      >
        <header className="mb-4 flex flex-none items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-semibold">Crear atributo</h2>
            <p className="m-0 mt-1 text-xs text-text-secondary">
              Definición global para el catálogo.
            </p>
          </div>
          <Button
            isDisabled={locked}
            onPress={close}
            type="button"
            variant="outline"
          >
            Cerrar <kbd>Esc</kbd>
          </Button>
        </header>
        <DialogContent className="overflow-y-auto pr-1">
          <form
            className="grid gap-5 pb-2"
            id="create-attribute-form"
            onSubmit={submit}
          >
            <section aria-label="Contexto del atributo" className="grid gap-2">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Contexto actual
              </p>
              <p className="m-0 text-sm text-text-primary">
                Clase: {context.classCode} · Familia: {context.familyCode} ·
                Tipo: {context.typeCode}
              </p>
              <aside
                aria-label="Impacto global de la característica"
                className="border-l-2 border-accent bg-surface-subtle px-3 py-2 text-sm text-text-secondary"
                id={warningId}
                role="note"
              >
                {source === 'new'
                  ? 'La característica se crea globalmente y podrá usarse en todas las Familias y Tipos.'
                  : 'La característica existente se reutiliza globalmente; sólo se crearán su aplicabilidad y presentación para este Tipo.'}
              </aside>
            </section>
            <section
              aria-label="Origen de la característica"
              className="grid gap-2"
            >
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Característica global
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  aria-pressed={source === 'new'}
                  isDisabled={locked}
                  onPress={() => {
                    setSource('new')
                    setSelected(null)
                    setConfirmed(false)
                    creation.clearExistingSearch()
                  }}
                  type="button"
                  variant={source === 'new' ? 'accent' : 'outline'}
                >
                  Crear nueva
                </Button>
                <Button
                  aria-pressed={source === 'existing'}
                  isDisabled={locked}
                  onPress={() => {
                    setSource('existing')
                    setSelected(null)
                    setConfirmed(false)
                  }}
                  type="button"
                  variant={source === 'existing' ? 'accent' : 'outline'}
                >
                  Usar existente
                </Button>
              </div>
            </section>
            <section
              aria-labelledby="attribute-data-heading"
              className="grid gap-3"
            >
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Definición primaria
                </p>
                <h3
                  className="m-0 mt-1 text-base font-semibold"
                  id="attribute-data-heading"
                >
                  Datos del atributo
                </h3>
              </div>
              {source === 'new' ? (
                <>
                  <Field htmlFor="catalog-attribute-code" label="Código">
                    <input
                      aria-describedby={warningId}
                      className={fieldInputClass}
                      disabled={locked}
                      id="catalog-attribute-code"
                      name="code"
                      ref={codeRef}
                      required
                      type="text"
                    />
                  </Field>
                  <Field htmlFor="catalog-attribute-name" label="Nombre">
                    <input
                      aria-describedby={warningId}
                      className={fieldInputClass}
                      disabled={locked}
                      id="catalog-attribute-name"
                      name="name"
                      required
                      type="text"
                    />
                  </Field>
                </>
              ) : (
                <ExistingCharacteristicPicker
                  contextKey={contextKey}
                  creation={creation}
                  effectiveCodes={effectiveCodes}
                  isOpen={isOpen}
                  onSelectedChange={(record) => {
                    setSelected(record)
                    setConfirmed(false)
                  }}
                  searchDisabled={locked}
                  selected={selected}
                  selectionDisabled={existingSelectionDisabled}
                />
              )}
              {source === 'new' && positionField('Posición')}
              {positionError && (
                <p
                  className="m-0 text-sm text-primary"
                  id="position-error"
                  role="alert"
                >
                  Indicá una posición entera positiva.
                </p>
              )}
            </section>
            {source === 'existing' ? (
              <section
                aria-label="Configuración de asignación"
                className="grid gap-3 border-t border-border pt-4"
              >
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Configuración para el Tipo
                  </p>
                  <h3 className="m-0 mt-1 text-base font-semibold">
                    Reutilizar característica
                  </h3>
                </div>
                {select(
                  'Modo',
                  'mode',
                  mode,
                  (value) => {
                    setMode(value as (typeof modes)[number])
                    setConfirmed(false)
                  },
                  modes,
                )}
                <label className="flex items-start gap-2 text-sm text-text-primary">
                  <input
                    checked={identityParticipates}
                    disabled={locked}
                    onChange={(event) => {
                      setIdentityParticipates(event.target.checked)
                      setConfirmed(false)
                    }}
                    type="checkbox"
                  />
                  <span>
                    Participa de identidad
                    <span className="block text-text-secondary">
                      Al activarlo, este atributo pasa a formar parte de la
                      identidad del Recurso.
                    </span>
                  </span>
                </label>
                {positionField('Posición en el Tipo')}
              </section>
            ) : (
              <section
                aria-label="Configuración avanzada"
                className="border-t border-border pt-4"
              >
                <Button
                  aria-controls="attribute-advanced-configuration"
                  aria-expanded={advancedOpen}
                  isDisabled={locked}
                  onPress={() => setAdvancedOpen((open) => !open)}
                  type="button"
                  variant="outline"
                >
                  Configuración avanzada
                </Button>
                <p
                  className="m-0 mt-2 text-sm text-text-secondary"
                  role="status"
                >
                  {valueType === 'CONTROLLED_TEXT'
                    ? 'Texto controlado'
                    : valueType}{' '}
                  · {mode === 'OPTIONAL' ? 'Opcional' : mode}
                </p>
                {advancedOpen && (
                  <div
                    className="mt-4 grid gap-3"
                    id="attribute-advanced-configuration"
                  >
                    {select(
                      'Tipo de valor',
                      'value-type',
                      valueType,
                      (value) =>
                        setValueType(value as (typeof valueTypes)[number]),
                      valueTypes,
                    )}
                    {valueType === 'CONTROLLED_OPTION' && (
                      <p className="m-0 text-sm text-text-secondary">
                        <span>
                          No se asigna un conjunto de opciones en esta versión.
                        </span>{' '}
                        Configuralo después.
                      </p>
                    )}
                    {select(
                      'Modo',
                      'mode',
                      mode,
                      (value) => {
                        setMode(value as (typeof modes)[number])
                        setConfirmed(false)
                      },
                      modes,
                    )}
                    <label className="flex items-start gap-2 text-sm text-text-primary">
                      <input
                        checked={identityParticipates}
                        disabled={locked}
                        onChange={(event) => {
                          setIdentityParticipates(event.target.checked)
                          setConfirmed(false)
                        }}
                        type="checkbox"
                      />
                      <span>
                        Participa de identidad
                        <span className="block text-text-secondary">
                          Al activarlo, este atributo pasa a formar parte de la
                          identidad del Recurso.
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </section>
            )}
            <section
              aria-label="Resumen de creación"
              className="grid gap-3 border-t border-border pt-4"
            >
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Revisión
                </p>
                <h3 className="m-0 mt-1 text-base font-semibold">
                  {source === 'new'
                    ? 'Creación en tres pasos'
                    : 'Asignación de característica existente'}
                </h3>
              </div>
              <ol
                aria-label="Estado de los pasos de creación"
                className="m-0 grid gap-1 p-0 text-xs font-semibold text-text-secondary"
              >
                {creation.steps.map((step) => (
                  <li
                    className="list-none border-l-2 border-accent pl-2"
                    key={step.name}
                  >
                    {stepLabel(step.name, creation.characteristicOrigin)}{' '}
                    {stepStatus(step.status)}
                  </li>
                ))}
              </ol>
              <p className="m-0 text-sm text-text-secondary">
                {source === 'new'
                  ? 'Se crearán la característica, su aplicabilidad y su presentación.'
                  : 'La característica seleccionada se reutilizará; se crearán su aplicabilidad y su presentación.'}{' '}
                Los pasos no son atómicos: uno posterior puede requerir
                seguimiento.
              </p>
              {canRereadCore && (
                <div className="grid gap-2">
                  <p className="m-0 text-sm text-text-secondary" role="status">
                    {creation.status === 'partial'
                      ? 'La creación quedó parcialmente aplicada.'
                      : 'La creación requiere conciliación.'}{' '}
                    Releer desde Core actualiza la vista, pero no confirma que
                    la entidad ni su configuración estén presentes.
                  </p>
                  <div>
                    <Button
                      onPress={() => void creation.rereadCore()}
                      type="button"
                      variant="outline"
                    >
                      Releer desde Core
                    </Button>
                  </div>
                </div>
              )}
              <label className="flex items-start gap-2 text-sm text-text-primary">
                <input
                  checked={confirmed}
                  disabled={locked}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  type="checkbox"
                />
                {source === 'new'
                  ? 'Confirmo que la creación tiene tres pasos y no es atómica.'
                  : 'Confirmo que la asignación reutiliza una característica y no es atómica.'}
              </label>
            </section>
            {error && (
              <p className="m-0 text-sm text-primary" role="alert">
                {error.message}
              </p>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <div className="grid gap-1">
            <p className="m-0 text-xs text-text-secondary">
              <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> navegar ·{' '}
              <kbd>Enter</kbd> crear
            </p>
            {disabledReason && (
              <p
                className="m-0 text-sm text-text-secondary"
                id={footerReasonId}
                role="status"
              >
                {disabledReason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              isDisabled={locked}
              onPress={close}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              aria-describedby={disabledReason ? footerReasonId : undefined}
              form="create-attribute-form"
              isDisabled={!!disabledReason}
              type="submit"
            >
              {pending
                ? source === 'new'
                  ? 'Creando atributo'
                  : 'Asignando característica'
                : source === 'new'
                  ? 'Crear atributo'
                  : 'Agregar al Tipo'}
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </>
  )
}

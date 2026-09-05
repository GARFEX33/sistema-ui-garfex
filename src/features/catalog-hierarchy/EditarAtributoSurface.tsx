import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import {
  useKeyboardController,
  type KeyboardActionTarget,
} from '../../shared/keyboard/keyboardControllerContext'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import type { CatalogTypeAttributesApi } from './catalogTypeAttributes.api'
import type {
  AttributeApplicability,
  AttributeDefinition,
  TypeAttributeAssignment,
  UpdateAttributeDefinitionInput,
  UpdateTypeAttributeAssignmentInput,
} from './catalogTypeAttributes.types'

type DefinitionDraft = Readonly<{
  descripcion: string
  nombre: string
}>

type AssignmentDraft = Readonly<{
  aplicabilidad: AttributeApplicability
  orden: number
  participaIdentidad: boolean
}>

export interface EditarAtributoSurfaceProps {
  api: CatalogTypeAttributesApi
  assignment: TypeAttributeAssignment
  definition: AttributeDefinition
  shortcutHint?: string
  onAssignmentChanged?: () => void
  onSuccess?: (message: string) => void
  onUpdated?: (definicionAtributoId: string) => void | Promise<unknown>
  onCommandTargetChange?: (target: KeyboardActionTarget | null) => void
}

const applicability: ReadonlyArray<{
  label: string
  value: AttributeApplicability
}> = [
  { value: 'OPTIONAL', label: 'Opcional' },
  { value: 'REQUIRED', label: 'Obligatorio' },
  { value: 'CONDITIONAL', label: 'Condicional' },
  { value: 'FORBIDDEN', label: 'No permitido' },
  { value: 'NOT_APPLICABLE', label: 'No aplica' },
]

const draftFor = (definition: AttributeDefinition): DefinitionDraft => ({
  descripcion: definition.descripcion ?? '',
  nombre: definition.nombre,
})

const assignmentDraftFor = (
  assignment: TypeAttributeAssignment,
): AssignmentDraft => ({
  aplicabilidad: assignment.aplicabilidad,
  orden: assignment.orden,
  participaIdentidad: assignment.participaIdentidad,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const errorCode = (error: unknown) => {
  const source = isRecord(error) ? error : undefined
  const data = isRecord(source?.data) ? source.data : source
  return typeof data?.code === 'string' ? data.code : ''
}

const updateErrorMessages: Readonly<Record<string, string>> = {
  ADMIN_STALE_REVISION:
    'El atributo fue modificado por otra persona. Recargá e intentá nuevamente.',
  ADMIN_DEPENDENCY_BLOCKED:
    'No se puede cambiar el tipo mientras existan valores, opciones o dependencias activas.',
  ADMIN_AGGREGATE_INCOMPLETE:
    'No se puede completar el cambio: revisá las opciones u otras condiciones requeridas.',
  ADMIN_INVALID_ARGUMENT: 'Revisá los datos del atributo e intentá nuevamente.',
}

const updateErrorMessage = (error: unknown) =>
  updateErrorMessages[errorCode(error)] ??
  'No se pudieron guardar los cambios. Intentá nuevamente.'

const lifecycleErrorMessages: Readonly<Record<string, string>> = {
  ADMIN_STALE_REVISION:
    'El atributo fue modificado por otra persona. Recargá e intentá nuevamente.',
  ADMIN_AGGREGATE_INCOMPLETE:
    'No se puede completar el cambio: revisá las opciones u otras condiciones requeridas.',
}

const lifecycleErrorMessage = (
  error: unknown,
  action: 'activar' | 'desactivar',
) =>
  lifecycleErrorMessages[errorCode(error)] ??
  `No se pudo ${action} la asignación. Intentá nuevamente.`

export function EditarAtributoSurface({
  api,
  assignment,
  definition,
  shortcutHint = 'Enter / E',
  onAssignmentChanged,
  onSuccess,
  onUpdated,
  onCommandTargetChange,
}: EditarAtributoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<DefinitionDraft>(() =>
    draftFor(definition),
  )
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>(() =>
    assignmentDraftFor(assignment),
  )
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const submittingRef = useRef(false)
  const { registerOverlay } = useKeyboardController()
  const initialDraft = draftFor(definition)
  const assignmentInitialDraft = assignmentDraftFor(assignment)
  const definitionHasChanges =
    draft.nombre !== initialDraft.nombre ||
    draft.descripcion !== initialDraft.descripcion
  const assignmentHasChanges =
    assignmentDraft.aplicabilidad !== assignmentInitialDraft.aplicabilidad ||
    assignmentDraft.orden !== assignmentInitialDraft.orden ||
    assignmentDraft.participaIdentidad !==
      assignmentInitialDraft.participaIdentidad
  const hasChanges = definitionHasChanges || assignmentHasChanges
  const validOrden =
    Number.isFinite(assignmentDraft.orden) && assignmentDraft.orden >= 0

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current = opener?.isConnected ? opener : triggerRef.current
      setDraft(draftFor(definition))
      setAssignmentDraft(assignmentDraftFor(assignment))
      setConfirmingDeactivation(false)
      setError(null)
      setIsOpen(true)
    },
    [assignment, definition],
  )
  const definitionUpdateInput = (): UpdateAttributeDefinitionInput => ({
    definicionAtributoId: definition.id,
    expectedRevision: definition.revision,
    ...(draft.nombre === initialDraft.nombre ? {} : { nombre: draft.nombre }),
    ...(draft.descripcion === initialDraft.descripcion
      ? {}
      : { descripcion: draft.descripcion }),
  })
  const assignmentUpdateInput = (): UpdateTypeAttributeAssignmentInput => ({
    atributoRecursoId: assignment.id,
    expectedRevision: assignment.revision,
    ...(assignmentDraft.aplicabilidad === assignmentInitialDraft.aplicabilidad
      ? {}
      : { aplicabilidad: assignmentDraft.aplicabilidad }),
    ...(assignmentDraft.orden === assignmentInitialDraft.orden
      ? {}
      : { orden: assignmentDraft.orden }),
    ...(assignmentDraft.participaIdentidad ===
    assignmentInitialDraft.participaIdentidad
      ? {}
      : { participaIdentidad: assignmentDraft.participaIdentidad }),
  })
  const submit = async () => {
    if (!hasChanges || !validOrden || submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      if (definitionHasChanges) {
        await api.updateAttributeDefinition(
          Object.freeze(definitionUpdateInput()),
        )
        await onUpdated?.(definition.id)
      }
      if (assignmentHasChanges) {
        await api.updateTypeAttributeAssignment(
          Object.freeze(assignmentUpdateInput()),
        )
        onAssignmentChanged?.()
      }
      onSuccess?.(`Atributo “${definition.nombre}” actualizado.`)
      close()
    } catch (cause) {
      setError(updateErrorMessage(cause))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }
  const runLifecycle = async (action: 'activar' | 'desactivar') => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setConfirmingDeactivation(false)
    setError(null)
    try {
      if (action === 'activar')
        await api.activateTypeAttributeAssignment({
          atributoRecursoId: assignment.id,
          expectedRevision: assignment.revision,
        })
      else
        await api.deactivateTypeAttributeAssignment({
          atributoRecursoId: assignment.id,
          expectedRevision: assignment.revision,
        })
      onAssignmentChanged?.()
      onSuccess?.(
        `Atributo “${definition.nombre}” ${action === 'activar' ? 'activado' : 'desactivado'} en este Tipo.`,
      )
    } catch (cause) {
      setError(lifecycleErrorMessage(cause, action))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    triggerRef.current?.setAttribute('title', shortcutHint)
  }, [shortcutHint])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])
  useEffect(() => {
    if (!onCommandTargetChange) return
    onCommandTargetChange({ root: () => triggerRef.current, open })
    return () => onCommandTargetChange(null)
  }, [onCommandTargetChange, open])
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      nameRef.current?.focus()
    } else if (wasOpen.current) {
      restoreFocusNextFrame(openerRef.current, [() => triggerRef.current])
      openerRef.current = null
      wasOpen.current = false
    }
  }, [isOpen])

  return (
    <div className="catalog-edit-attribute-surface">
      <Button
        ref={triggerRef}
        className="catalog-attribute-edit"
        aria-label="Editar atributo"
        onPress={() => open(triggerRef.current)}
      >
        Editar
      </Button>
      <ModalOverlay
        className="catalog-dialog-backdrop"
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={(openState) => !openState && close()}
      >
        <Modal className="catalog-dialog-modal">
          <Dialog
            ref={dialogRef}
            className="catalog-dialog catalog-edit-attribute-dialog"
            aria-label="Editar atributo"
          >
            <form
              className="catalog-dialog-form"
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  close()
                }
              }}
              onSubmit={(event) => {
                event.preventDefault()
                void submit()
              }}
            >
              <header className="catalog-dialog-heading">
                <h2>Editar atributo</h2>
                <span>Esc cerrar</span>
              </header>
              <div className="catalog-dialog-content catalog-edit-attribute-content">
                <p className="catalog-edit-attribute-warning">
                  Este cambio afecta todas las Familias y Tipos que usan esta
                  definición.
                </p>
                <fieldset
                  className="catalog-definition-fields"
                  disabled={isSubmitting}
                >
                  <legend>Definición</legend>
                  <label>
                    Clave
                    <input
                      aria-label="Clave"
                      value={definition.clave}
                      disabled
                    />
                  </label>
                  <label>
                    Nombre
                    <input
                      ref={nameRef}
                      aria-label="Nombre"
                      value={draft.nombre}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setError(null)
                        setDraft((current) => ({
                          ...current,
                          nombre: event.target.value,
                        }))
                      }}
                    />
                  </label>
                  <label>
                    Descripción
                    <textarea
                      aria-label="Descripción"
                      value={draft.descripcion}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setError(null)
                        setDraft((current) => ({
                          ...current,
                          descripcion: event.target.value,
                        }))
                      }}
                    />
                  </label>
                </fieldset>
                <fieldset
                  className="catalog-assignment-fields"
                  disabled={isSubmitting}
                >
                  <legend>Asignación en este Tipo</legend>
                  <label>
                    Aplicabilidad
                    <select
                      aria-label="Aplicabilidad"
                      value={assignmentDraft.aplicabilidad}
                      onChange={(event) => {
                        setError(null)
                        setAssignmentDraft((current) => ({
                          ...current,
                          aplicabilidad: event.target
                            .value as AttributeApplicability,
                        }))
                      }}
                    >
                      {applicability.map(({ label, value }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Orden
                    <input
                      aria-label="Orden"
                      type="number"
                      min="0"
                      value={assignmentDraft.orden}
                      onChange={(event) => {
                        setError(null)
                        setAssignmentDraft((current) => ({
                          ...current,
                          orden: Number(event.target.value),
                        }))
                      }}
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={assignmentDraft.participaIdentidad}
                      onChange={(event) => {
                        setError(null)
                        setAssignmentDraft((current) => ({
                          ...current,
                          participaIdentidad: event.target.checked,
                        }))
                      }}
                    />
                    Participa de identidad
                  </label>
                </fieldset>
                <section
                  className="catalog-assignment-status"
                  aria-label="Estado de la asignación"
                >
                  <span>{assignment.activo ? 'Activo' : 'Inactivo'}</span>
                  {confirmingDeactivation ? (
                    <div
                      className="catalog-assignment-confirmation"
                      role="alertdialog"
                      aria-label="Desactivar asignación"
                      aria-modal="true"
                    >
                      <strong>¿Desactivar este atributo en el Tipo?</strong>
                      <p>
                        Puede afectar recursos, reglas o formularios que
                        dependan de esta asignación.
                      </p>
                      <div>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setConfirmingDeactivation(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void runLifecycle('desactivar')}
                        >
                          Desactivar asignación
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        assignment.activo
                          ? setConfirmingDeactivation(true)
                          : void runLifecycle('activar')
                      }
                    >
                      {assignment.activo
                        ? 'Desactivar asignación'
                        : 'Activar asignación'}
                    </button>
                  )}
                </section>
                <div className="catalog-dialog-error-region" role="alert">
                  <span aria-hidden="true">{error ? '⚠' : ''}</span>
                  <span>{error}</span>
                </div>
              </div>
              <footer className="catalog-dialog-actions">
                <Button type="button" onPress={close} isDisabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isDisabled={!hasChanges || !validOrden || isSubmitting}
                >
                  Guardar cambios
                </Button>
              </footer>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}

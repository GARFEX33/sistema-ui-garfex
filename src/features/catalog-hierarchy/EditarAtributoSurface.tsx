import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import {
  useKeyboardController,
  type KeyboardActionTarget,
} from '../../shared/keyboard/keyboardControllerContext'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import type { CatalogTypeAttributesApi } from './catalogTypeAttributes.api'
import type {
  AttributeDataType,
  AttributeDefinition,
  UpdateAttributeDefinitionInput,
} from './catalogTypeAttributes.types'

type DefinitionDraft = Readonly<{
  descripcion: string
  nombre: string
  tipoDato: AttributeDataType
}>

export interface EditarAtributoSurfaceProps {
  api: CatalogTypeAttributesApi
  definition: AttributeDefinition
  onSuccess?: (message: string) => void
  onUpdated?: (definicionAtributoId: string) => void | Promise<unknown>
  onCommandTargetChange?: (target: KeyboardActionTarget | null) => void
}

const dataTypes: ReadonlyArray<{ label: string; value: AttributeDataType }> = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'NUMERO', label: 'Número' },
  { value: 'BOOLEANO', label: 'Booleano' },
  { value: 'OPCION', label: 'Opción' },
]

const draftFor = (definition: AttributeDefinition): DefinitionDraft => ({
  descripcion: definition.descripcion ?? '',
  nombre: definition.nombre,
  tipoDato: definition.tipoDato,
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
    'La definición fue modificada por otra persona. Recargá e intentá nuevamente.',
  ADMIN_DEPENDENCY_BLOCKED:
    'No se puede cambiar el tipo mientras existan valores, opciones o dependencias activas.',
  ADMIN_INVALID_ARGUMENT: 'Revisá los datos del atributo e intentá nuevamente.',
}

const updateErrorMessage = (error: unknown) =>
  updateErrorMessages[errorCode(error)] ??
  'No se pudieron guardar los cambios. Intentá nuevamente.'

export function EditarAtributoSurface({
  api,
  definition,
  onSuccess,
  onUpdated,
  onCommandTargetChange,
}: EditarAtributoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<DefinitionDraft>(() =>
    draftFor(definition),
  )
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
  const hasChanges =
    draft.nombre !== initialDraft.nombre ||
    draft.descripcion !== initialDraft.descripcion ||
    draft.tipoDato !== initialDraft.tipoDato

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current = opener?.isConnected ? opener : triggerRef.current
      setDraft(draftFor(definition))
      setError(null)
      setIsOpen(true)
    },
    [definition],
  )
  const updateInput = (): UpdateAttributeDefinitionInput => ({
    definicionAtributoId: definition.id,
    expectedRevision: definition.revision,
    ...(draft.nombre === initialDraft.nombre ? {} : { nombre: draft.nombre }),
    ...(draft.descripcion === initialDraft.descripcion
      ? {}
      : { descripcion: draft.descripcion }),
    ...(draft.tipoDato === initialDraft.tipoDato
      ? {}
      : { tipoDato: draft.tipoDato }),
  })
  const submit = async () => {
    if (!hasChanges || submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      await api.updateAttributeDefinition(Object.freeze(updateInput()))
      await onUpdated?.(definition.id)
      onSuccess?.(`Atributo “${definition.nombre}” actualizado.`)
      close()
    } catch (cause) {
      setError(updateErrorMessage(cause))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

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
        Editar atributo <kbd aria-hidden="true">Enter / E</kbd>
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
              <div className="catalog-dialog-content">
                <p className="catalog-edit-attribute-warning">
                  Este cambio afecta todas las Familias y Tipos que usan esta
                  definición.
                </p>
                <div className="catalog-definition-fields">
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
                  <label>
                    Tipo de dato
                    <select
                      aria-label="Tipo de dato"
                      value={draft.tipoDato}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setError(null)
                        setDraft((current) => ({
                          ...current,
                          tipoDato: event.target.value as AttributeDataType,
                        }))
                      }}
                    >
                      {dataTypes.map(({ label, value }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="catalog-dialog-error-region" role="alert">
                  <span aria-hidden="true">{error ? '⚠' : ''}</span>
                  <span>{error}</span>
                </div>
              </div>
              <footer className="catalog-dialog-actions">
                <Button type="button" onPress={close} isDisabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" isDisabled={!hasChanges || isSubmitting}>
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

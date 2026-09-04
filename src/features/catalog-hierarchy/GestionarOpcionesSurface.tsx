import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import {
  useKeyboardController,
  type KeyboardActionTarget,
} from '../../shared/keyboard/keyboardControllerContext'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import type { CatalogTypeAttributesApi } from './catalogTypeAttributes.api'
import type {
  AttributeDefinition,
  AttributeOption,
  TypeAttributePage,
} from './catalogTypeAttributes.types'

type OptionPage = TypeAttributePage<AttributeOption>
type LoadState =
  | 'idle'
  | 'initial-loading'
  | 'ready'
  | 'initial-error'
  | 'loading-more'
  | 'partial-error'
type Draft = Readonly<{
  clave: string
  nombre: string
  descripcion: string
  activo: boolean
}>

export interface GestionarOpcionesSurfaceProps {
  api: CatalogTypeAttributesApi
  definition: AttributeDefinition
  shortcutHint?: string
  onSuccess?: (message: string) => void
  onOptionsChanged?: () => void
  onCommandTargetChange?: (target: KeyboardActionTarget | null) => void
}

const emptyPage: OptionPage = {
  continuationCursor: null,
  isExhausted: false,
  items: [],
}

const emptyDraft: Draft = {
  activo: false,
  clave: '',
  descripcion: '',
  nombre: '',
}

const arrowNavigationSelector = [
  'button',
  'input',
  'textarea',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="textbox"]',
].join(', ')

const isNativeArrowWidget = (element: HTMLElement) =>
  element.tagName.toLowerCase() === 'textarea' ||
  (element.tagName.toLowerCase() === 'input' &&
    element.getAttribute('type') === 'number')

const isVisibleArrowNavigationCandidate = (element: HTMLElement) => {
  if (
    element.matches(':disabled') ||
    element.getAttribute('aria-disabled') === 'true'
  )
    return false
  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    if (
      current.hidden ||
      current.getAttribute('aria-hidden') === 'true' ||
      getComputedStyle(current).display === 'none' ||
      getComputedStyle(current).visibility === 'hidden'
    )
      return false
  }
  return element.tabIndex >= 0
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const duplicateKey = (error: unknown) => {
  const source = isRecord(error) ? error : undefined
  const data = isRecord(source?.data) ? source.data : source
  return data?.code === 'ADMIN_DUPLICATE_KEY'
}

const createErrorMessage = (error: unknown) =>
  duplicateKey(error)
    ? 'Ya existe una opción con esa clave.'
    : 'No se pudo crear la opción. Intentá nuevamente.'

const adminErrorCode = (error: unknown) => {
  const source = isRecord(error) ? error : undefined
  const data = isRecord(source?.data) ? source.data : source
  return typeof data?.code === 'string' ? data.code : undefined
}

const optionErrorMessage = (
  error: unknown,
  action: 'actualizar' | 'activar' | 'desactivar',
) => {
  switch (adminErrorCode(error)) {
    case 'ADMIN_DEPENDENCY_BLOCKED':
      return 'No se puede desactivar esta opción porque está en uso por recursos, reglas o compatibilidad.'
    case 'ADMIN_NOT_FOUND':
      return 'La opción ya no existe. Actualizamos la lista.'
    case 'ADMIN_INVALID_ARGUMENT':
      return 'Los datos de la opción no son válidos. Revisalos e intentá nuevamente.'
    default:
      return `No se pudo ${action} la opción. Intentá nuevamente.`
  }
}

export function GestionarOpcionesSurface({
  api,
  definition,
  shortcutHint = 'O',
  onSuccess,
  onOptionsChanged,
  onCommandTargetChange,
}: GestionarOpcionesSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState<OptionPage>(emptyPage)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingOption, setEditingOption] = useState<AttributeOption | null>(
    null,
  )
  const [confirmingDeactivation, setConfirmingDeactivation] =
    useState<AttributeOption | null>(null)
  const [restoreActionFocus, setRestoreActionFocus] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const claveRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const submittingRef = useRef(false)
  const actionFocusRef = useRef<HTMLButtonElement | null>(null)
  const requestToken = useRef(0)
  const { registerOverlay } = useKeyboardController()

  const close = useCallback(() => setIsOpen(false), [])
  const load = useCallback(
    async (cursor: string | null) => {
      const initial = cursor === null
      const token = ++requestToken.current
      setLoadState(initial ? 'initial-loading' : 'loading-more')
      setError(null)
      try {
        const result = await api.listAttributeOptions({
          definicionAtributoId: definition.id,
          mode: 'ALL',
          pageSize: 50,
          cursor,
        })
        if (requestToken.current !== token) return
        setPage((current) =>
          initial
            ? result
            : {
                continuationCursor: result.continuationCursor,
                isExhausted: result.isExhausted,
                items: [...current.items, ...result.items],
              },
        )
        setLoadState('ready')
      } catch {
        if (requestToken.current !== token) return
        setLoadState(initial ? 'initial-error' : 'partial-error')
      }
    },
    [api, definition.id],
  )

  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current = opener?.isConnected ? opener : triggerRef.current
      setPage(emptyPage)
      setDraft(emptyDraft)
      setEditingOption(null)
      setConfirmingDeactivation(null)
      setError(null)
      setSuccess(null)
      setIsOpen(true)
      void load(null)
    },
    [load],
  )

  const completeSuccess = async (message: string, focusAction = false) => {
    setRestoreActionFocus(focusAction)
    setSuccess(message)
    await load(null)
    onOptionsChanged?.()
    onSuccess?.(message)
  }

  const submit = async () => {
    if (submittingRef.current) return
    if (editingOption) {
      if (!draft.nombre.trim()) {
        setError('Ingresá un nombre para la opción.')
        return
      }
      submittingRef.current = true
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      try {
        const result = await api.updateAttributeOption({
          opcionAtributoId: editingOption.id,
          expectedRevision: editingOption.revision,
          nombre: draft.nombre.trim(),
          descripcion: draft.descripcion.trim(),
        })
        const message =
          result.disposition === 'UNCHANGED'
            ? `Opción “${draft.nombre.trim()}” sin cambios.`
            : `Opción “${draft.nombre.trim()}” actualizada.`
        setDraft(emptyDraft)
        setEditingOption(null)
        await completeSuccess(message, true)
      } catch (cause) {
        if (adminErrorCode(cause) === 'ADMIN_STALE_REVISION') {
          await load(null)
          setError(
            'Esta opción cambió mientras la editabas; actualizamos la lista. Revisá la versión actual e intentá nuevamente.',
          )
        } else setError(optionErrorMessage(cause, 'actualizar'))
      } finally {
        submittingRef.current = false
        setIsSubmitting(false)
      }
      return
    }
    if (!draft.clave.trim() || !draft.nombre.trim()) {
      setError('Ingresá una clave y un nombre para crear la opción.')
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await api.createAttributeOption(
        Object.freeze({
          activo: draft.activo,
          clave: draft.clave.trim(),
          definicionAtributoId: definition.id,
          nombre: draft.nombre.trim(),
          ...(draft.descripcion.trim()
            ? { descripcion: draft.descripcion.trim() }
            : {}),
        }),
      )
      const message = `Opción “${draft.nombre.trim()}” creada.`
      setDraft(emptyDraft)
      await completeSuccess(message)
    } catch (cause) {
      setError(createErrorMessage(cause))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const runLifecycle = async (
    option: AttributeOption,
    action: 'activar' | 'desactivar',
  ) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setConfirmingDeactivation(null)
    setError(null)
    setSuccess(null)
    try {
      const result =
        action === 'activar'
          ? await api.activateAttributeOption({
              opcionAtributoId: option.id,
              expectedRevision: option.revision,
            })
          : await api.deactivateAttributeOption({
              opcionAtributoId: option.id,
              expectedRevision: option.revision,
            })
      const verb = action === 'activar' ? 'activada' : 'desactivada'
      const message =
        result.disposition === 'UNCHANGED'
          ? `Opción “${option.nombre}” sin cambios.`
          : `Opción “${option.nombre}” ${verb}.`
      await completeSuccess(message, true)
    } catch (cause) {
      if (adminErrorCode(cause) === 'ADMIN_STALE_REVISION') {
        await load(null)
        setError(
          'Esta opción cambió mientras la administrabas; actualizamos la lista. Revisá la versión actual e intentá nuevamente.',
        )
      } else {
        if (adminErrorCode(cause) === 'ADMIN_NOT_FOUND') await load(null)
        setError(optionErrorMessage(cause, action))
      }
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
    if (!success || isSubmitting) return
    if (restoreActionFocus) actionFocusRef.current?.focus()
    else claveRef.current?.focus()
  }, [isSubmitting, restoreActionFocus, success])
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      claveRef.current?.focus()
    } else if (wasOpen.current) {
      requestToken.current += 1
      restoreFocusNextFrame(openerRef.current, [() => triggerRef.current])
      openerRef.current = null
      wasOpen.current = false
    }
  }, [isOpen])

  const canContinue = loadState === 'ready' && !page.isExhausted
  const initialLoading = loadState === 'initial-loading'
  const initialError = loadState === 'initial-error'
  const partialError = loadState === 'partial-error'

  return (
    <div className="catalog-manage-options-surface">
      <Button
        ref={triggerRef}
        className="catalog-attribute-edit"
        aria-label="Opciones"
        onPress={() => open(triggerRef.current)}
      >
        Opciones
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
            className="catalog-dialog catalog-manage-options-dialog"
            aria-label={`Opciones de ${definition.nombre}`}
          >
            <form
              className="catalog-dialog-form"
              onSubmit={(event) => {
                event.preventDefault()
                void submit()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  close()
                  return
                }
                if (
                  (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey ||
                  event.nativeEvent.isComposing ||
                  !(event.target instanceof HTMLElement) ||
                  isNativeArrowWidget(event.target)
                )
                  return
                const candidates = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    arrowNavigationSelector,
                  ),
                ).filter(isVisibleArrowNavigationCandidate)
                const currentIndex = candidates.indexOf(event.target)
                if (currentIndex < 0) return
                const nextIndex = Math.max(
                  0,
                  Math.min(
                    candidates.length - 1,
                    currentIndex + (event.key === 'ArrowDown' ? 1 : -1),
                  ),
                )
                event.preventDefault()
                candidates[nextIndex]?.focus()
              }}
            >
              <header className="catalog-dialog-heading">
                <h2>Opciones</h2>
                <span>Esc cerrar</span>
              </header>
              <div className="catalog-dialog-content catalog-manage-options-content">
                <section
                  className="catalog-option-definition-summary"
                  aria-label="Definición global administrable"
                >
                  <p>Definición global administrable</p>
                  <strong>{definition.nombre}</strong>
                  <span>{definition.clave} · Opción</span>
                </section>
                <p className="catalog-manage-options-warning">
                  La clave será inmutable cuando esta opción pueda editarse.
                </p>
                <fieldset
                  className="catalog-option-fields"
                  disabled={isSubmitting}
                >
                  <legend>
                    {editingOption ? 'Editar opción' : 'Crear opción'}
                  </legend>
                  <label>
                    Clave
                    <input
                      ref={editingOption ? undefined : claveRef}
                      aria-label={editingOption ? 'Clave inmutable' : 'Clave'}
                      value={draft.clave}
                      disabled={Boolean(editingOption)}
                      onChange={(event) => {
                        setError(null)
                        setDraft((current) => ({
                          ...current,
                          clave: event.target.value,
                        }))
                      }}
                    />
                  </label>
                  <label>
                    Nombre
                    <input
                      aria-label="Nombre"
                      value={draft.nombre}
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
                      onChange={(event) => {
                        setError(null)
                        setDraft((current) => ({
                          ...current,
                          descripcion: event.target.value,
                        }))
                      }}
                    />
                  </label>
                  {editingOption ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(emptyDraft)
                        setEditingOption(null)
                        actionFocusRef.current?.focus()
                      }}
                    >
                      Cancelar edición
                    </button>
                  ) : (
                    <label className="catalog-option-active">
                      <input
                        type="checkbox"
                        checked={draft.activo}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            activo: event.target.checked,
                          }))
                        }
                      />
                      Crear activa
                    </label>
                  )}
                </fieldset>
                {success && (
                  <p className="catalog-option-success" role="status">
                    {success}
                  </p>
                )}
                <section
                  className="catalog-option-list-region"
                  aria-label="Opciones existentes"
                >
                  <h3>Opciones existentes</h3>
                  {initialLoading && <p role="status">Cargando opciones…</p>}
                  {initialError && (
                    <div role="alert">
                      <p>No se pudieron cargar las opciones.</p>
                      <button type="button" onClick={() => void load(null)}>
                        Reintentar opciones
                      </button>
                    </div>
                  )}
                  {!initialLoading &&
                    !initialError &&
                    !page.items.length &&
                    page.isExhausted && (
                      <p role="status">
                        Esta definición todavía no tiene opciones.
                      </p>
                    )}
                  {!initialLoading &&
                    !initialError &&
                    !page.items.length &&
                    !page.isExhausted && (
                      <p role="status">Aún hay más páginas por consultar.</p>
                    )}
                  {!!page.items.length && (
                    <ul className="catalog-option-list">
                      {page.items.map((option) => (
                        <li key={option.id}>
                          <strong>{option.clave}</strong>
                          <span>{option.nombre}</span>
                          {option.descripcion && <p>{option.descripcion}</p>}
                          <div aria-label={`Estado de ${option.nombre}`}>
                            <span>{option.activo ? 'Activa' : 'Inactiva'}</span>
                            <span>
                              {option.effective ? 'Efectiva' : 'No efectiva'}
                            </span>
                          </div>
                          <div
                            className="catalog-option-actions"
                            aria-label={`Acciones de ${option.nombre}`}
                          >
                            <button
                              type="button"
                              disabled={isSubmitting}
                              aria-label={`Editar ${option.nombre}`}
                              onClick={(event) => {
                                actionFocusRef.current = event.currentTarget
                                setRestoreActionFocus(false)
                                setEditingOption(option)
                                setDraft({
                                  activo: option.activo,
                                  clave: option.clave,
                                  descripcion: option.descripcion ?? '',
                                  nombre: option.nombre,
                                })
                                setError(null)
                                setSuccess(null)
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              aria-label={`${option.activo ? 'Desactivar' : 'Activar'} ${option.nombre}`}
                              onClick={(event) => {
                                actionFocusRef.current = event.currentTarget
                                if (option.activo)
                                  setConfirmingDeactivation(option)
                                else void runLifecycle(option, 'activar')
                              }}
                            >
                              {option.activo ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {loadState === 'loading-more' && (
                    <p role="status">Cargando más opciones…</p>
                  )}
                  {partialError && (
                    <div role="alert">
                      <p>No se pudieron cargar más opciones.</p>
                      <button
                        type="button"
                        onClick={() => void load(page.continuationCursor)}
                      >
                        Reintentar continuación de opciones
                      </button>
                    </div>
                  )}
                  {canContinue && (
                    <button
                      type="button"
                      onClick={() => void load(page.continuationCursor)}
                    >
                      Cargar más opciones
                    </button>
                  )}
                </section>
                {confirmingDeactivation && (
                  <section
                    className="catalog-option-confirmation"
                    role="alertdialog"
                    aria-label="Desactivar opción"
                    aria-modal="true"
                  >
                    <strong>
                      ¿Desactivar “{confirmingDeactivation.nombre}”?
                    </strong>
                    <p>
                      Esta opción puede estar en uso por recursos, reglas o
                      compatibilidad. La desactivación puede bloquearse.
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeactivation(null)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runLifecycle(
                            confirmingDeactivation,
                            'desactivar',
                          )
                        }
                        disabled={isSubmitting}
                      >
                        Desactivar opción
                      </button>
                    </div>
                  </section>
                )}
                <div className="catalog-dialog-error-region" role="alert">
                  <span aria-hidden="true">{error ? '⚠' : ''}</span>
                  <span>{error}</span>
                </div>
              </div>
              <footer className="catalog-dialog-actions">
                <Button type="button" onPress={close} isDisabled={isSubmitting}>
                  Cerrar
                </Button>
                <Button type="submit" isDisabled={isSubmitting}>
                  {editingOption ? 'Guardar edición' : 'Crear opción'}
                </Button>
              </footer>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}

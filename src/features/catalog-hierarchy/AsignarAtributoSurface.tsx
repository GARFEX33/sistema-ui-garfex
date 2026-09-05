import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import type { CatalogTypeAttributesApi } from './catalogTypeAttributes.api'
import type {
  AttributeApplicability,
  AttributeDataType,
  AttributeDefinition,
  CreateTypeAttributeAssignmentInput,
  TypeAttributeAssignment,
} from './catalogTypeAttributes.types'

type Context = Readonly<{ id: string; label: string }>
type DefinitionPage = Readonly<{
  items: AttributeDefinition[]
  continuationCursor: string | null
  isExhausted: boolean
}>
type View = 'chooser' | 'create'
type CreateStep = 1 | 2
type DefinitionDraft = Readonly<{
  clave: string
  nombre: string
  descripcion: string
  tipoDato: AttributeDataType
}>

export interface AsignarAtributoSurfaceProps {
  api: CatalogTypeAttributesApi
  assignments: readonly TypeAttributeAssignment[]
  family: Context
  type: Context
  onCreated?: () => void | Promise<unknown>
  onSuccess?: (message: string) => void
}

const applicability: ReadonlyArray<{
  value: AttributeApplicability
  label: string
}> = [
  { value: 'OPTIONAL', label: 'Opcional' },
  { value: 'REQUIRED', label: 'Obligatorio' },
  { value: 'CONDITIONAL', label: 'Condicional' },
  { value: 'FORBIDDEN', label: 'No permitido' },
  { value: 'NOT_APPLICABLE', label: 'No aplica' },
]
const dataTypes: ReadonlyArray<{
  value: AttributeDataType
  label: string
  example: string
  guidance: string
}> = [
  {
    value: 'OPCION',
    label: 'Valores predefinidos',
    example: 'Ejemplo: Color → Blanco, Negro.',
    guidance:
      'Los valores permitidos se administran después de crear el atributo.',
  },
  {
    value: 'TEXTO',
    label: 'Texto libre',
    example: 'Ejemplo: Observación → Revisar instalación.',
    guidance:
      'Guarda texto sin validarlo como número, opción o respuesta sí/no.',
  },
  {
    value: 'NUMERO',
    label: 'Número',
    example: 'Ejemplo: Peso → 12,5.',
    guidance: 'Valida y guarda un número.',
  },
  {
    value: 'BOOLEANO',
    label: 'Sí / No',
    example: 'Ejemplo: Requiere mantenimiento → Sí.',
    guidance: 'Guarda una respuesta de sí o no.',
  },
]
const emptyDraft: DefinitionDraft = {
  clave: '',
  nombre: '',
  descripcion: '',
  tipoDato: 'OPCION',
}

const arrowNavigationSelector = [
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="listbox"]',
  '[role="option"]',
].join(', ')

const isNativeArrowWidget = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'textarea' ||
    tagName === 'select' ||
    (tagName === 'input' && element.getAttribute('type') === 'number') ||
    !!element.closest('[role="listbox"], [role="option"]')
  )
}

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
const errorCode = (error: unknown) => {
  const structured = isRecord(error) ? error : undefined
  const data = isRecord(structured?.data) ? structured.data : structured
  return data?.code
}
const duplicateKey = (error: unknown) =>
  errorCode(error) === 'ADMIN_DUPLICATE_KEY'
const assignmentErrorMessage = (error: unknown) =>
  duplicateKey(error)
    ? 'Este atributo ya está asignado al Tipo.'
    : 'No se pudo asignar el atributo. Intentá nuevamente.'
const definitionErrorMessage = (error: unknown) =>
  duplicateKey(error)
    ? 'Ya existe un atributo con esa clave.'
    : 'No se pudo crear la definición. Intentá nuevamente.'

export function AsignarAtributoSurface({
  api,
  assignments,
  family,
  type,
  onCreated,
  onSuccess,
}: AsignarAtributoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('chooser')
  const [createStep, setCreateStep] = useState<CreateStep>(1)
  const [isTypeChoiceOpen, setIsTypeChoiceOpen] = useState(false)
  const [page, setPage] = useState<DefinitionPage>({
    continuationCursor: null,
    isExhausted: false,
    items: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AttributeDefinition | null>(null)
  const [draft, setDraft] = useState<DefinitionDraft>(emptyDraft)
  const [createdDefinition, setCreatedDefinition] =
    useState<AttributeDefinition | null>(null)
  const [aplicabilidad, setAplicabilidad] =
    useState<AttributeApplicability>('OPTIONAL')
  const [participaIdentidad, setParticipaIdentidad] = useState(false)
  const [orden, setOrden] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const claveRef = useRef<HTMLInputElement>(null)
  const assignmentRef = useRef<HTMLSelectElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const submittingRef = useRef(false)
  const isOpenRef = useRef(false)
  const { registerCommand, registerOverlay } = useKeyboardController()
  isOpenRef.current = isOpen

  const directIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.tipoRecursoId === type.id)
          .map((assignment) => assignment.definicionAtributoId),
      ),
    [assignments, type.id],
  )
  const maximumOrder = useMemo(
    () => Math.max(0, ...assignments.map((assignment) => assignment.orden)),
    [assignments],
  )
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return page.items
    return page.items.filter(({ clave, nombre }) =>
      `${nombre} ${clave}`.toLocaleLowerCase().includes(query),
    )
  }, [page.items, search])
  const close = useCallback(() => setIsOpen(false), [])
  const load = useCallback(
    async (cursor?: string | null) => {
      setIsLoading(true)
      try {
        const result = await api.listAttributeDefinitions({ cursor })
        setPage((current) =>
          cursor === undefined
            ? result
            : {
                continuationCursor: result.continuationCursor,
                isExhausted: result.isExhausted,
                items: [...current.items, ...result.items],
              },
        )
      } catch {
        setError('No se pudieron cargar los atributos. Intentá nuevamente.')
      } finally {
        setIsLoading(false)
      }
    },
    [api],
  )
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current = opener?.isConnected ? opener : null
      setPage({ continuationCursor: null, isExhausted: false, items: [] })
      setView('chooser')
      setCreateStep(1)
      setIsTypeChoiceOpen(false)
      setSearch('')
      setSelected(null)
      setDraft(emptyDraft)
      setCreatedDefinition(null)
      setAplicabilidad('OPTIONAL')
      setParticipaIdentidad(false)
      setOrden(maximumOrder + 1)
      setError(null)
      setIsOpen(true)
      void load()
    },
    [load, maximumOrder],
  )
  const command = useMemo(
    () => ({
      id: 'catalog.assign-attribute',
      surface: 'catalog' as const,
      key: 'n',
      shortcut: 'N',
      label: 'Asignar atributo',
      group: 'Catálogo',
      scope: 'active-surface' as const,
      root: () => triggerRef.current,
      isAvailable: () =>
        !isOpenRef.current && isValidFocusCandidate(triggerRef.current),
      action: open,
    }),
    [open],
  )
  const existingCanSubmit =
    !!selected &&
    !directIds.has(selected.id) &&
    Number.isFinite(orden) &&
    orden >= 0 &&
    !isSubmitting
  const assignmentInput = (
    definicionAtributoId: string,
  ): CreateTypeAttributeAssignmentInput =>
    Object.freeze({
      activo: false,
      aplicabilidad,
      definicionAtributoId,
      familiaRecursoId: family.id,
      orden,
      participaIdentidad,
      tipoRecursoId: type.id,
    })
  const completeAssignment = async (
    definition: AttributeDefinition,
    createdNow: boolean,
  ) => {
    try {
      await api.createTypeAttributeAssignment(assignmentInput(definition.id))
      await onCreated?.()
      onSuccess?.(
        createdNow
          ? `Atributo “${definition.nombre}” creado y asignado.`
          : `Atributo “${definition.nombre}” asignado.`,
      )
      close()
    } catch (cause) {
      setError(
        createdNow || createdDefinition
          ? 'La definición fue creada, pero no se asignó al Tipo.'
          : assignmentErrorMessage(cause),
      )
      if (!createdNow && !createdDefinition && duplicateKey(cause))
        void Promise.resolve()
          .then(() => onCreated?.())
          .catch(() => undefined)
    }
  }
  const submitExisting = async () => {
    if (!selected || !existingCanSubmit || submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      await completeAssignment(selected, false)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }
  const submitNew = async () => {
    if (submittingRef.current) return
    if (createdDefinition) {
      submittingRef.current = true
      setIsSubmitting(true)
      setError(null)
      try {
        await completeAssignment(createdDefinition, true)
      } finally {
        submittingRef.current = false
        setIsSubmitting(false)
      }
      return
    }
    if (!draft.clave.trim() || !draft.nombre.trim()) {
      setError('Ingresá una clave y un nombre para crear el atributo.')
      return
    }
    if (!Number.isFinite(orden) || orden < 0) {
      setError('Ingresá un orden válido para la asignación.')
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await api.createAttributeDefinition(
        Object.freeze({
          activo: false,
          clave: draft.clave.trim(),
          nombre: draft.nombre.trim(),
          tipoDato: draft.tipoDato,
          ...(draft.descripcion.trim()
            ? { descripcion: draft.descripcion.trim() }
            : {}),
        }),
      )
      setCreatedDefinition(result.item)
      await completeAssignment(result.item, true)
    } catch (cause) {
      setError(definitionErrorMessage(cause))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }
  const continueNew = () => {
    if (!draft.clave.trim() || !draft.nombre.trim()) {
      setError('Ingresá una clave y un nombre para crear el atributo.')
      return
    }
    setError(null)
    setCreateStep(2)
  }
  const submit = () =>
    view === 'create'
      ? createStep === 1
        ? continueNew()
        : submitNew()
      : submitExisting()

  useEffect(() => registerCommand(command), [command, registerCommand])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      if (view === 'create') {
        if (createStep === 1) claveRef.current?.focus()
        else assignmentRef.current?.focus()
      } else searchRef.current?.focus()
    } else if (wasOpen.current) {
      restoreFocusNextFrame(openerRef.current, [() => triggerRef.current])
      openerRef.current = null
      wasOpen.current = false
    }
  }, [createStep, isOpen, view])

  const selectedDataType = dataTypes.find(
    ({ value }) => value === draft.tipoDato,
  )

  const assignmentFields = (
    <fieldset className="catalog-assignment-fields" disabled={isSubmitting}>
      <legend>Configuración de la asignación</legend>
      <label>
        Aplicabilidad
        <select
          ref={assignmentRef}
          aria-label="Aplicabilidad"
          value={aplicabilidad}
          onChange={(event) =>
            setAplicabilidad(event.target.value as AttributeApplicability)
          }
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
          value={orden}
          onChange={(event) => setOrden(Number(event.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={participaIdentidad}
          onChange={(event) => setParticipaIdentidad(event.target.checked)}
        />
        Participa de identidad
      </label>
    </fieldset>
  )

  return (
    <div className="catalog-assign-attribute-surface">
      <Button
        ref={triggerRef}
        className="catalog-create-trigger"
        aria-label="Asignar atributo"
        onPress={() => open(triggerRef.current)}
      >
        <span>Asignar atributo</span>
        <kbd>N</kbd>
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
            className="catalog-dialog catalog-assign-dialog"
            aria-label="Asignar atributo"
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
                <h2>Asignar atributo</h2>
                <span>Esc cerrar</span>
              </header>
              <div className="catalog-dialog-content">
                <div className="catalog-creation-parent">
                  <span>Familia</span>
                  <output data-parent-id={family.id}>{family.label}</output>
                  <span>Tipo</span>
                  <output data-parent-id={type.id}>{type.label}</output>
                </div>
                {view === 'chooser' ? (
                  <>
                    <button
                      className="catalog-create-definition"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setView('create')
                        setError(null)
                      }}
                    >
                      Crear atributo nuevo
                    </button>
                    <label
                      className="catalog-assign-search"
                      htmlFor="assign-attribute-search"
                    >
                      Buscar atributo
                      <input
                        ref={searchRef}
                        id="assign-attribute-search"
                        type="search"
                        role="searchbox"
                        value={search}
                        disabled={isSubmitting}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </label>
                    <div
                      className="catalog-definition-list"
                      aria-label="Definiciones de atributo"
                    >
                      {filtered.map((definition) => {
                        const assigned = directIds.has(definition.id)
                        return (
                          <button
                            key={definition.id}
                            type="button"
                            disabled={assigned || isSubmitting}
                            aria-pressed={selected?.id === definition.id}
                            onClick={() => {
                              setSelected(definition)
                              setError(null)
                            }}
                          >
                            <strong>{definition.nombre}</strong>
                            <span>{definition.clave}</span>
                            {assigned && <em>Ya asignado directamente</em>}
                          </button>
                        )
                      })}
                    </div>
                    {!isLoading && !filtered.length && page.isExhausted && (
                      <p className="catalog-attribute-state">
                        No hay atributos que coincidan.
                      </p>
                    )}
                    {!isLoading && !filtered.length && !page.isExhausted && (
                      <p className="catalog-attribute-state">
                        Aún hay más páginas por consultar.
                      </p>
                    )}
                    {isLoading && (
                      <p className="catalog-attribute-state">
                        Cargando atributos…
                      </p>
                    )}
                    {!isLoading && !page.isExhausted && (
                      <button
                        className="catalog-load-definitions"
                        type="button"
                        onClick={() => void load(page.continuationCursor)}
                      >
                        Cargar más atributos
                      </button>
                    )}
                    {selected && assignmentFields}
                  </>
                ) : (
                  <>
                    <ol
                      className="catalog-create-progress"
                      aria-label="Progreso de creación"
                    >
                      <li aria-current={createStep === 1 ? 'step' : undefined}>
                        1 Definición
                      </li>
                      <li aria-current={createStep === 2 ? 'step' : undefined}>
                        2 Asignación
                      </li>
                    </ol>
                    {createStep === 1 && !createdDefinition && (
                      <button
                        className="catalog-return-to-chooser"
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setView('chooser')
                          setError(null)
                        }}
                      >
                        Volver a atributos existentes
                      </button>
                    )}
                    {createStep === 1 && (
                      <>
                        <div className="catalog-definition-fields">
                          <label>
                            Clave
                            <input
                              ref={claveRef}
                              aria-label="Clave"
                              value={draft.clave}
                              disabled={isSubmitting || !!createdDefinition}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  clave: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label>
                            Nombre
                            <input
                              aria-label="Nombre"
                              value={draft.nombre}
                              disabled={isSubmitting || !!createdDefinition}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  nombre: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label>
                            Descripción
                            <textarea
                              aria-label="Descripción"
                              value={draft.descripcion}
                              disabled={isSubmitting || !!createdDefinition}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  descripcion: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <section
                            className="catalog-definition-type"
                            aria-label="Tipo de dato"
                          >
                            <div>
                              <span>Tipo de dato</span>
                              <strong>{selectedDataType?.label}</strong>
                            </div>
                            <p>{selectedDataType?.example}</p>
                            <p>{selectedDataType?.guidance}</p>
                            <button
                              type="button"
                              disabled={isSubmitting || !!createdDefinition}
                              onClick={() =>
                                setIsTypeChoiceOpen((current) => !current)
                              }
                            >
                              Cambiar tipo
                            </button>
                            {isTypeChoiceOpen && (
                              <label>
                                Elegir tipo de dato
                                <select
                                  aria-label="Tipo de dato"
                                  value={draft.tipoDato}
                                  disabled={isSubmitting || !!createdDefinition}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      tipoDato: event.target
                                        .value as AttributeDataType,
                                    }))
                                  }
                                >
                                  {dataTypes.map(({ label, value }) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </section>
                        </div>
                      </>
                    )}
                    {createStep === 2 && (
                      <>
                        <section
                          className="catalog-definition-summary"
                          aria-label="Resumen de definición"
                        >
                          <h3>Resumen de definición</h3>
                          <dl>
                            <div>
                              <dt>Clave</dt>
                              <dd>{draft.clave.trim()}</dd>
                            </div>
                            <div>
                              <dt>Nombre</dt>
                              <dd>{draft.nombre.trim()}</dd>
                            </div>
                            <div>
                              <dt>Tipo</dt>
                              <dd>
                                {
                                  dataTypes.find(
                                    ({ value }) => value === draft.tipoDato,
                                  )?.label
                                }
                              </dd>
                            </div>
                          </dl>
                        </section>
                        <p className="catalog-definition-guidance">
                          La definición y la asignación se crearán inicialmente
                          inactivas.
                        </p>
                        {assignmentFields}
                      </>
                    )}
                  </>
                )}
                <div className="catalog-dialog-error-region" role="alert">
                  <span aria-hidden="true">{error ? '⚠' : ''}</span>
                  <span>{error}</span>
                </div>
              </div>
              <footer className="catalog-dialog-actions">
                <div className="catalog-dialog-actions-exit">
                  <Button type="button" onPress={close}>
                    Cancelar
                  </Button>
                </div>
                <div className="catalog-dialog-actions-navigation">
                  {view === 'create' && createdDefinition && error ? (
                    <Button
                      type="button"
                      isDisabled={isSubmitting}
                      onPress={() => void submitNew()}
                    >
                      Reintentar asignación
                    </Button>
                  ) : view === 'create' && createStep === 2 ? (
                    <>
                      <Button
                        type="button"
                        isDisabled={isSubmitting}
                        onPress={() => {
                          setCreateStep(1)
                          setError(null)
                        }}
                      >
                        Atrás
                      </Button>
                      <Button type="submit" isDisabled={isSubmitting}>
                        Crear y asignar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      isDisabled={
                        view === 'chooser' ? !existingCanSubmit : isSubmitting
                      }
                    >
                      {view === 'create' ? 'Continuar' : 'Guardar asignación'}
                    </Button>
                  )}
                </div>
              </footer>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}

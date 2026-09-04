import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { AsignarAtributoSurface } from './AsignarAtributoSurface'
import { EditarAtributoSurface } from './EditarAtributoSurface'
import { GestionarOpcionesSurface } from './GestionarOpcionesSurface'
import {
  useKeyboardController,
  type KeyboardActionTarget,
} from '../../shared/keyboard/keyboardControllerContext'
import { CatalogCreateSurface, NuevaClaseSurface } from './NuevaClaseSurface'
import { useAutoClosingMessage } from './useAutoClosingMessage'
import {
  createCatalogHierarchyConvexApi,
  type CatalogHierarchyApi,
} from './catalogHierarchy.api'
import {
  createCatalogTypeAttributesConvexApi,
  type CatalogTypeAttributesApi,
} from './catalogTypeAttributes.api'
import {
  createInitialCatalogHierarchyContext,
  selectClass,
  selectFamily,
  selectType,
} from './catalogHierarchyState'
import {
  createCatalogListSequence,
  type CatalogListController,
  type CatalogListState,
} from './useCatalogList'
import type {
  CatalogClassItem,
  CatalogFamilyItem,
  CatalogHierarchyItem,
  CatalogHierarchyPresentation,
  CatalogTypeItem,
} from './catalogHierarchy.types'
import type {
  AttributeDefinition,
  AttributeOption,
  TypeAttributeAssignment,
  TypeAttributePage,
} from './catalogTypeAttributes.types'
import './catalogHierarchy.css'

type ConnectedLists = {
  classes: CatalogListController<CatalogClassItem>
  families: CatalogListController<CatalogFamilyItem>
  types: CatalogListController<CatalogTypeItem>
}

type DefinitionState =
  | { status: 'loading' }
  | { status: 'ready'; definition: AttributeDefinition }
  | { status: 'missing' }
  | { status: 'error' }

type AttributeActionTargets = Partial<{
  edit: KeyboardActionTarget
  options: KeyboardActionTarget
}>

type OptionPreviewState =
  | { status: 'loading' }
  | { status: 'ready'; page: TypeAttributePage<AttributeOption> }
  | { status: 'error' }

const attributeSelectionLabel = {
  SELECTED: 'Seleccionado',
  SHADOWED: 'En sombra',
  SUPPRESSED: 'Suprimido',
  NONE: 'Sin selección',
} as const

const attributeApplicabilityLabel = {
  REQUIRED: 'Obligatorio',
  OPTIONAL: 'Opcional',
  CONDITIONAL: 'Condicional',
  FORBIDDEN: 'No permitido',
  NOT_APPLICABLE: 'No aplica',
} as const

const attributeDataTypeLabel = {
  TEXTO: 'Texto',
  NUMERO: 'Número',
  BOOLEANO: 'Booleano',
  OPCION: 'Opción',
} as const

const project = (items: readonly { id: unknown; nombre: string }[]) =>
  items.map((item) => ({ id: item.id as string, label: item.nombre }))

function makeAttributeList(
  api: CatalogTypeAttributesApi,
): CatalogListController<TypeAttributeAssignment> {
  return createCatalogListSequence({
    operation: 'attributes',
    adapter: {
      load: ({ cursor, parentId }) =>
        api.listTypeAssignments({
          tipoRecursoId: parentId as string,
          cursor,
          mode: 'ALL',
        }),
    },
  })
}

function makeLists(api: CatalogHierarchyApi): ConnectedLists {
  return {
    classes: createCatalogListSequence({
      operation: 'classes',
      adapter: { load: ({ cursor }) => api.listClasses({ cursor }) },
    }),
    families: createCatalogListSequence({
      operation: 'families',
      adapter: {
        load: ({ cursor, parentId }) => api.listFamilies({ cursor, parentId }),
      },
    }),
    types: createCatalogListSequence({
      operation: 'types',
      adapter: {
        load: ({ cursor, parentId }) => api.listTypes({ cursor, parentId }),
      },
    }),
  }
}

const emptySubscribe = () => () => undefined

function useListSnapshot<T extends { id: unknown }>(
  controller: CatalogListController<T> | null,
) {
  const snapshotRef = useRef<CatalogListState<T> | null>(
    controller?.getState() ?? null,
  )
  const subscribe = (listener: () => void) => {
    if (!controller) return emptySubscribe()
    return controller.subscribe(() => {
      snapshotRef.current = controller.getState()
      listener()
    })
  }
  return useSyncExternalStore(
    subscribe,
    () => snapshotRef.current,
    () => snapshotRef.current,
  )
}

function CatalogRegion({
  label,
  items,
  selectedId,
  waiting,
  state,
  onSelect,
  onContinue,
  onRetry,
  hasChildren = false,
  column,
}: {
  label: string
  items: CatalogHierarchyItem[]
  selectedId?: string
  column: 'classes' | 'families' | 'types'
  waiting?: string
  state?: CatalogListState<{ id: unknown }>
  onSelect?: (id: string) => void
  onContinue?: () => void
  onRetry?: () => void
  hasChildren?: boolean
}) {
  const isWaiting = state?.status === 'waiting-for-parent'
  const isLoading =
    state?.status === 'initial-loading' ||
    (state?.status === 'ready' && !state.isExhausted && !items.length)
  const initialError = state?.status === 'initial-error'
  const partialError = state?.status === 'partial-error'
  return (
    <section className="catalog-region" aria-label={label}>
      <h3>{label.toUpperCase()}</h3>
      <div className="catalog-region-items">
        {items.length ? (
          items.map((item) => (
            <button
              className={`catalog-item${item.id === selectedId ? ' is-selected' : ''}`}
              key={item.id}
              type="button"
              aria-pressed={item.id === selectedId}
              data-spatial-id={`catalog.row.${column}.${item.id}`}
              data-spatial-column={column}
              data-catalog-level={column}
              onClick={() => onSelect?.(item.id)}
            >
              {item.label}
              {hasChildren && (
                <span
                  className="catalog-row-chevron"
                  data-testid="catalog-row-chevron"
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
            </button>
          ))
        ) : isWaiting ? (
          <p className="catalog-region-state">{waiting}</p>
        ) : isLoading ? (
          <p className="catalog-region-state">Cargando…</p>
        ) : initialError ? (
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        ) : (
          <p className="catalog-region-state">Estado vacío confirmado</p>
        )}
        {partialError && (
          <>
            <p className="catalog-region-state">Listado parcial</p>
            <button type="button" onClick={onRetry}>
              Reintentar continuación
            </button>
          </>
        )}
        {state?.status === 'ready' && !state.isExhausted && !!items.length && (
          <button type="button" onClick={onContinue}>
            Cargar más…
          </button>
        )}
      </div>
    </section>
  )
}

const optionCountLabel = (count: number, state: 'activa' | 'inactiva') =>
  `${count} ${state}${count === 1 ? '' : 's'}`

function AttributeOptionPreview({
  definition,
  state,
  onRetry,
}: {
  definition: AttributeDefinition
  state?: OptionPreviewState
  onRetry: () => void
}) {
  if (!state || state.status === 'loading')
    return (
      <section
        className="catalog-option-preview"
        aria-label={`Vista previa de opciones de ${definition.nombre}`}
      >
        <p>Cargando opciones…</p>
      </section>
    )
  if (state.status === 'error')
    return (
      <section
        className="catalog-option-preview"
        aria-label={`Vista previa de opciones de ${definition.nombre}`}
      >
        <p role="alert">No se pudieron cargar las opciones</p>
        <button type="button" onClick={onRetry}>
          Reintentar opciones
        </button>
      </section>
    )

  const active = state.page.items.filter((option) => option.activo)
  const inactive = state.page.items.length - active.length
  const prefix = state.page.isExhausted ? '' : 'Al menos '
  return (
    <section
      className="catalog-option-preview"
      aria-label={`Vista previa de opciones de ${definition.nombre}`}
    >
      {active.length ? (
        <div
          className="catalog-option-preview-chips"
          aria-label={`Opciones activas de ${definition.nombre}`}
        >
          {active.slice(0, 3).map((option) => (
            <span key={option.id}>{option.nombre}</span>
          ))}
        </div>
      ) : (
        <p>Sin opciones activas</p>
      )}
      <p className="catalog-option-preview-counts">
        {prefix}
        {optionCountLabel(active.length, 'activa')} · {prefix.toLowerCase()}
        {optionCountLabel(inactive, 'inactiva')}
        {!state.page.isExhausted && ' (vista parcial)'}
      </p>
    </section>
  )
}

function AttributePanel({
  api,
  selectedTypeId,
  state,
  definitions,
  onContinue,
  onRetry,
  onRetryDefinition,
  onReloadDefinition,
  optionPreviews,
  onRetryOptions,
  onSuccess,
  onActiveAttributeChange,
  onAttributeActionTargetChange,
}: {
  api: CatalogTypeAttributesApi
  selectedTypeId?: string
  state: CatalogListState<TypeAttributeAssignment> | null
  definitions: Readonly<Record<string, DefinitionState>>
  onContinue: () => void
  onRetry: () => void
  onRetryDefinition: (id: string) => void
  onReloadDefinition: (id: string) => void | Promise<unknown>
  optionPreviews: Readonly<Record<string, OptionPreviewState>>
  onRetryOptions: (id: string) => void
  onSuccess: (message: string) => void
  onActiveAttributeChange: (assignmentId: string) => void
  onAttributeActionTargetChange: (
    assignmentId: string,
    action: keyof AttributeActionTargets,
    target: KeyboardActionTarget | null,
  ) => void
}) {
  if (!selectedTypeId)
    return (
      <div
        className="catalog-attribute-panel"
        role="tabpanel"
        id="catalog-attributes-panel"
        aria-labelledby="catalog-attributes-tab"
      >
        <p className="catalog-attribute-state" role="status">
          Seleccioná un Tipo para consultar sus atributos.
        </p>
      </div>
    )

  const items = state?.items ?? []
  const initialLoading = state?.status === 'initial-loading'
  const initialError = state?.status === 'initial-error'
  const partialError = state?.status === 'partial-error'
  const loadingMore = state?.status === 'loading-more'
  const empty = state?.status === 'empty'
  const canContinue = state?.status === 'ready' && !state.isExhausted

  return (
    <div
      className="catalog-attribute-panel"
      role="tabpanel"
      id="catalog-attributes-panel"
      aria-labelledby="catalog-attributes-tab"
    >
      {initialLoading && !items.length && (
        <p className="catalog-attribute-state" role="status">
          Cargando atributos…
        </p>
      )}
      {initialError && (
        <div className="catalog-attribute-state" role="alert">
          <p>No se pudieron cargar los atributos.</p>
          <button type="button" onClick={onRetry}>
            Reintentar atributos
          </button>
        </div>
      )}
      {empty && (
        <p className="catalog-attribute-state" role="status">
          Este Tipo no tiene atributos asignados.
        </p>
      )}
      {items.map((assignment) => {
        const definition = definitions[assignment.definicionAtributoId]
        return (
          <article
            className="catalog-attribute-card"
            key={assignment.id}
            tabIndex={0}
            data-spatial-id={`catalog.row.attributes.${assignment.id}`}
            data-catalog-level="attributes"
            onFocus={() => onActiveAttributeChange(assignment.id)}
            onClick={() => onActiveAttributeChange(assignment.id)}
          >
            {definition?.status === 'ready' ? (
              <>
                <h3>{definition.definition.nombre}</h3>
                <p className="catalog-attribute-definition">
                  {definition.definition.clave} ·{' '}
                  {attributeDataTypeLabel[definition.definition.tipoDato]}
                </p>
                {definition.definition.descripcion && (
                  <p className="catalog-attribute-description">
                    {definition.definition.descripcion}
                  </p>
                )}
                <EditarAtributoSurface
                  api={api}
                  definition={definition.definition}
                  onUpdated={() => onReloadDefinition(definition.definition.id)}
                  onSuccess={onSuccess}
                  onCommandTargetChange={(target) =>
                    onAttributeActionTargetChange(assignment.id, 'edit', target)
                  }
                />
                {definition.definition.tipoDato === 'OPCION' && (
                  <>
                    <AttributeOptionPreview
                      definition={definition.definition}
                      state={optionPreviews[definition.definition.id]}
                      onRetry={() => onRetryOptions(definition.definition.id)}
                    />
                    <GestionarOpcionesSurface
                      onOptionsChanged={() =>
                        onRetryOptions(definition.definition.id)
                      }
                      api={api}
                      definition={definition.definition}
                      onSuccess={onSuccess}
                      onCommandTargetChange={(target) =>
                        onAttributeActionTargetChange(
                          assignment.id,
                          'options',
                          target,
                        )
                      }
                    />
                  </>
                )}
                <span hidden />
              </>
            ) : definition?.status === 'missing' ? (
              <p className="catalog-attribute-definition">
                Definición no disponible.
              </p>
            ) : definition?.status === 'error' ? (
              <div className="catalog-attribute-definition-error" role="status">
                <p>No se pudo cargar la definición.</p>
                <button
                  type="button"
                  onClick={() =>
                    onRetryDefinition(assignment.definicionAtributoId)
                  }
                >
                  Reintentar definición
                </button>
              </div>
            ) : (
              <p className="catalog-attribute-definition" role="status">
                Cargando definición…
              </p>
            )}
            <div
              className="catalog-attribute-badges"
              aria-label="Estado del atributo"
            >
              <span>{assignment.tipoRecursoId ? 'Directo' : 'Heredado'}</span>
              <span>{attributeSelectionLabel[assignment.selection]}</span>
              <span>{assignment.activo ? 'Activo' : 'Inactivo'}</span>
              <span>{assignment.effective ? 'Efectivo' : 'No efectivo'}</span>
              <span>
                {attributeApplicabilityLabel[assignment.aplicabilidad]}
              </span>
              {assignment.participaIdentidad && <span>Parte de identidad</span>}
            </div>
          </article>
        )
      })}
      {partialError && (
        <div className="catalog-attribute-state" role="alert">
          <p>Listado parcial de atributos.</p>
          <button type="button" onClick={onRetry}>
            Reintentar continuación de atributos
          </button>
        </div>
      )}
      {loadingMore && (
        <p className="catalog-attribute-state" role="status">
          Cargando más atributos…
        </p>
      )}
      {canContinue && (
        <button type="button" onClick={onContinue}>
          Cargar más atributos…
        </button>
      )}
      {canContinue && !items.length && (
        <p className="catalog-attribute-state">
          Aún hay más páginas por consultar.
        </p>
      )}
    </div>
  )
}

function AttributeSummaryPanel({
  selectedTypeId,
  state,
  definitions,
  onRetry,
  onShowAll,
}: {
  selectedTypeId?: string
  state: CatalogListState<TypeAttributeAssignment> | null
  definitions: Readonly<Record<string, DefinitionState>>
  onRetry: () => void
  onShowAll: () => void
}) {
  const items = state?.items ?? []
  const initialLoading = !state || state.status === 'initial-loading'
  const initialError = state?.status === 'initial-error'
  const empty = state?.status === 'empty'
  const partial =
    !!state &&
    (!state.isExhausted ||
      state.status === 'loading-more' ||
      state.status === 'partial-error')
  const direct = items.filter((assignment) => assignment.tipoRecursoId).length
  const active = items.filter((assignment) => assignment.activo).length
  const effective = items.filter((assignment) => assignment.effective).length

  return (
    <div
      className="catalog-summary-panel"
      role="tabpanel"
      id="catalog-summary-panel"
      aria-labelledby="catalog-summary-tab"
    >
      <h3>RESUMEN</h3>
      {!selectedTypeId ? (
        <p className="catalog-summary-muted">
          Seleccioná un Tipo para consultar su resumen de atributos.
        </p>
      ) : initialLoading ? (
        <p className="catalog-summary-muted" role="status">
          Cargando resumen de atributos…
        </p>
      ) : initialError ? (
        <div className="catalog-summary-state" role="alert">
          <p>No se pudo cargar el resumen de atributos.</p>
          <button type="button" onClick={onRetry}>
            Reintentar resumen de atributos
          </button>
        </div>
      ) : empty ? (
        <p className="catalog-summary-muted" role="status">
          Este Tipo no tiene atributos asignados.
        </p>
      ) : (
        <>
          <div
            className="catalog-attribute-metrics"
            aria-label="Métricas de atributos"
          >
            <strong>
              {partial
                ? `${items.length} asignaciones cargadas (vista parcial)`
                : `Total: ${items.length} asignaciones`}
            </strong>
            {partial && (
              <p>Los conteos corresponden solo a las páginas cargadas.</p>
            )}
            <p>
              Directas: {direct} · Heredadas: {items.length - direct}
            </p>
            <p>
              Activas: {active} · Inactivas: {items.length - active}
            </p>
            <p>
              Efectivas: {effective} · No efectivas: {items.length - effective}
            </p>
          </div>
          <ol
            className="catalog-attribute-preview"
            aria-label="Vista previa de atributos"
          >
            {items.slice(0, 3).map((assignment) => {
              const definition = definitions[assignment.definicionAtributoId]
              const definitionLabel =
                definition?.status === 'ready'
                  ? definition.definition.nombre
                  : definition?.status === 'loading' || !definition
                    ? 'Cargando definición…'
                    : 'Definición no disponible.'
              return (
                <li key={assignment.id}>
                  <strong>{definitionLabel}</strong>
                  {definition?.status === 'ready' && (
                    <span>
                      {definition.definition.clave} ·{' '}
                      {attributeDataTypeLabel[definition.definition.tipoDato]}
                    </span>
                  )}
                  <span>
                    {assignment.tipoRecursoId ? 'Directo' : 'Heredado'} ·{' '}
                    {assignment.activo ? 'Activo' : 'Inactivo'} ·{' '}
                    {assignment.effective ? 'Efectivo' : 'No efectivo'}
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}
      <button className="catalog-summary-all" type="button" onClick={onShowAll}>
        Ver todos
      </button>
    </div>
  )
}

export function CatalogHierarchyScreen({
  presentation,
  createClass,
  createFamily,
  createType,
}: {
  presentation?: CatalogHierarchyPresentation
  createClass?: CatalogHierarchyApi['createClass']
  createFamily?: CatalogHierarchyApi['createFamily']
  createType?: CatalogHierarchyApi['createType']
}) {
  const [context, setContext] = useState(createInitialCatalogHierarchyContext)
  const [activeAttributeId, setActiveAttributeId] = useState<string | null>(
    null,
  )
  const [successMessage, showSuccess] = useAutoClosingMessage()
  const attributeActionTargets = useRef(
    new Map<string, AttributeActionTargets>(),
  )
  const { registerAction } = useKeyboardController()
  const [api] = useState<CatalogHierarchyApi | null>(() =>
    presentation === undefined ? createCatalogHierarchyConvexApi() : null,
  )
  const [lists] = useState<ConnectedLists | null>(() =>
    api ? makeLists(api) : null,
  )
  const [attributesApi] = useState(createCatalogTypeAttributesConvexApi)
  const [attributeList] = useState(() => makeAttributeList(attributesApi))
  const [activeTab, setActiveTab] = useState<'summary' | 'attributes'>(
    'summary',
  )
  const [definitions, setDefinitions] = useState<
    Record<string, DefinitionState>
  >({})
  const [definitionRetry, setDefinitionRetry] = useState(0)
  const [optionPreviews, setOptionPreviews] = useState<
    Record<string, OptionPreviewState>
  >({})
  const optionPreviewContext = useRef(0)
  const optionPreviewRequests = useRef(new Map<string, number>())
  const definitionToken = useRef(0)
  const screenRef = useRef<HTMLElement>(null)
  const attributesTabRef = useRef<HTMLButtonElement>(null)
  const classState = useListSnapshot(lists?.classes ?? null)
  const familyState = useListSnapshot(lists?.families ?? null)
  const typeState = useListSnapshot(lists?.types ?? null)
  const attributeState = useListSnapshot(attributeList)
  const isStatic = presentation !== undefined
  const classes = isStatic
    ? presentation.classes
    : project(classState?.items ?? [])
  const families = isStatic
    ? presentation.families
    : project(familyState?.items ?? [])
  const types = isStatic ? presentation.types : project(typeState?.items ?? [])
  const selectedClassId = isStatic
    ? presentation.selectedClassId
    : context.classId
  const selectedFamilyId = isStatic
    ? presentation.selectedFamilyId
    : context.familyId
  const selectedTypeId = isStatic ? presentation.selectedTypeId : context.typeId
  const selectedType = types.find((item) => item.id === selectedTypeId)
  const selectedAttributeState =
    attributeState?.parentId === selectedTypeId ? attributeState : null
  const readyOptionDefinitionIds = useMemo(
    () => [
      ...new Set(
        (activeTab === 'attributes'
          ? (selectedAttributeState?.items ?? [])
          : []
        )
          .map((assignment) => definitions[assignment.definicionAtributoId])
          .filter(
            (
              definition,
            ): definition is {
              status: 'ready'
              definition: AttributeDefinition
            } =>
              definition?.status === 'ready' &&
              definition.definition.tipoDato === 'OPCION',
          )
          .map((definition) => definition.definition.id),
      ),
    ],
    [activeTab, definitions, selectedAttributeState],
  )
  const readyOptionDefinitionIdsRef = useRef(new Set<string>())
  readyOptionDefinitionIdsRef.current = new Set(readyOptionDefinitionIds)
  const selectedClass = classes.find((item) => item.id === selectedClassId)
  const selectedFamily = families.find((item) => item.id === selectedFamilyId)
  const selectedPath =
    selectedClass && selectedFamily && selectedType
      ? {
          classLabel: selectedClass.label,
          familyLabel: selectedFamily.label,
          typeLabel: selectedType.label,
        }
      : null
  const creationLevel = selectedFamily
    ? 'type'
    : selectedClass
      ? 'family'
      : 'class'
  const showAssignmentAction =
    activeTab === 'attributes' && !!selectedFamily && !!selectedType
  const activeAssignment = selectedAttributeState?.items.find(
    (assignment) => assignment.id === activeAttributeId,
  )
  const activeDefinitionState = activeAssignment
    ? definitions[activeAssignment.definicionAtributoId]
    : undefined
  const activeAttribute =
    activeTab === 'attributes' && activeDefinitionState?.status === 'ready'
      ? activeDefinitionState.definition
      : null
  const setAttributeActionTarget = useCallback(
    (
      assignmentId: string,
      action: keyof AttributeActionTargets,
      target: KeyboardActionTarget | null,
    ) => {
      const current = attributeActionTargets.current.get(assignmentId) ?? {}
      if (target) {
        attributeActionTargets.current.set(assignmentId, {
          ...current,
          [action]: target,
        })
        return
      }
      const remaining = { ...current }
      delete remaining[action]
      if (Object.keys(remaining).length)
        attributeActionTargets.current.set(assignmentId, remaining)
      else attributeActionTargets.current.delete(assignmentId)
    },
    [],
  )

  useEffect(() => {
    if (!lists) return
    void lists.classes.start()
  }, [lists])

  useEffect(() => setActiveAttributeId(null), [activeTab, selectedTypeId])

  useEffect(() => {
    if (!activeAttribute || !activeAttributeId) return
    const target = (action: keyof AttributeActionTargets) =>
      attributeActionTargets.current.get(activeAttributeId)?.[action]
    const removeEdit = registerAction({
      id: 'catalog.edit-attribute',
      surface: 'catalog',
      key: 'e',
      keys: ['e', 'Enter'],
      shortcut: 'Enter / E',
      label: 'Editar atributo',
      root: () => target('edit')?.root() ?? null,
      isAvailable: () => target('edit') !== undefined,
      canHandle: (event) =>
        event.key !== 'Enter' ||
        document.activeElement?.closest<HTMLElement>(
          '[data-catalog-level="attributes"]',
        )?.dataset.spatialId === `catalog.row.attributes.${activeAttributeId}`,
      run: (opener) => target('edit')?.open(opener),
    })
    const removeOptions =
      activeAttribute.tipoDato === 'OPCION'
        ? registerAction({
            id: 'catalog.manage-options',
            surface: 'catalog',
            key: 'o',
            shortcut: 'O',
            label: 'Opciones',
            root: () => target('options')?.root() ?? null,
            isAvailable: () => target('options') !== undefined,
            run: (opener) => target('options')?.open(opener),
          })
        : undefined
    return () => {
      removeEdit()
      removeOptions?.()
    }
  }, [activeAttribute, activeAttributeId, registerAction])

  useEffect(() => {
    definitionToken.current++
    setDefinitions({})
    if (!selectedTypeId) {
      attributeList.setContext({ operation: 'attributes' })
      return
    }
    attributeList.setContext({
      operation: 'attributes',
      parentId: selectedTypeId,
    })
    void attributeList.start()
  }, [attributeList, selectedTypeId])

  useEffect(() => {
    if (!selectedAttributeState || !selectedTypeId || false) return
    const scopedItems =
      activeTab === 'attributes'
        ? selectedAttributeState.items
        : selectedAttributeState.items.slice(0, 3)
    const ids = [
      ...new Set(scopedItems.map((item) => item.definicionAtributoId)),
    ]
    const pending = ids.filter((id) => definitions[id] === undefined)
    if (!pending.length) return
    const token = definitionToken.current
    setDefinitions((current) => ({
      ...current,
      ...Object.fromEntries(pending.map((id) => [id, { status: 'loading' }])),
    }))
    pending.forEach((id) => {
      void attributesApi
        .getAttributeDefinition(id)
        .then((definition) => {
          if (definitionToken.current !== token) return
          setDefinitions((current) => ({
            ...current,
            [id]: definition
              ? { status: 'ready', definition }
              : { status: 'missing' },
          }))
        })
        .catch(() => {
          if (definitionToken.current !== token) return
          setDefinitions((current) => ({
            ...current,
            [id]: { status: 'error' },
          }))
        })
    })
  }, [
    activeTab,
    selectedAttributeState,
    attributesApi,
    definitionRetry,
    definitions,
    selectedTypeId,
  ])

  useEffect(() => {
    optionPreviewContext.current += 1
    setOptionPreviews({})
  }, [selectedTypeId])

  useEffect(() => {
    if (
      activeTab !== 'attributes' ||
      !selectedTypeId ||
      typeof attributesApi.listAttributeOptions !== 'function'
    )
      return
    const context = optionPreviewContext.current
    const pending = readyOptionDefinitionIds.filter((id) => !optionPreviews[id])
    if (!pending.length) return
    setOptionPreviews((current) => ({
      ...current,
      ...Object.fromEntries(pending.map((id) => [id, { status: 'loading' }])),
    }))
    pending.forEach((id) => {
      const request = (optionPreviewRequests.current.get(id) ?? 0) + 1
      optionPreviewRequests.current.set(id, request)
      void attributesApi
        .listAttributeOptions({
          definicionAtributoId: id,
          mode: 'ALL',
          pageSize: 50,
          cursor: null,
        })
        .then((page) => {
          if (
            optionPreviewContext.current !== context ||
            optionPreviewRequests.current.get(id) !== request ||
            !readyOptionDefinitionIdsRef.current.has(id)
          )
            return
          setOptionPreviews((current) => ({
            ...current,
            [id]: { status: 'ready', page },
          }))
        })
        .catch(() => {
          if (
            optionPreviewContext.current !== context ||
            optionPreviewRequests.current.get(id) !== request ||
            !readyOptionDefinitionIdsRef.current.has(id)
          )
            return
          setOptionPreviews((current) => ({
            ...current,
            [id]: { status: 'error' },
          }))
        })
    })
  }, [
    activeTab,
    attributesApi,
    optionPreviews,
    readyOptionDefinitionIds,
    selectedTypeId,
  ])

  const retryOptionPreview = useCallback((id: string) => {
    optionPreviewRequests.current.set(
      id,
      (optionPreviewRequests.current.get(id) ?? 0) + 1,
    )
    setOptionPreviews((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  useEffect(() => {
    const trigger = screenRef.current?.querySelector<HTMLElement>(
      '.catalog-create-trigger',
    )
    if (!trigger) return
    trigger.dataset.spatialId = `catalog.new-${creationLevel}`
    return () => {
      if (trigger.dataset.spatialId === `catalog.new-${creationLevel}`) {
        delete trigger.dataset.spatialId
      }
    }
  }, [creationLevel])

  const handleClassSelect = (classId: string) => {
    if (!lists) return
    definitionToken.current++
    setDefinitions({})
    attributeList.setContext({ operation: 'attributes' })
    setContext((current) => selectClass(current, classId))
    lists.families.setContext({ operation: 'families', parentId: classId })
    lists.types.setContext({ operation: 'types' })
    void lists.families.start()
  }
  const handleFamilySelect = (familyId: string) => {
    if (!lists || !context.classId) return
    definitionToken.current++
    setDefinitions({})
    attributeList.setContext({ operation: 'attributes' })
    setContext((current) =>
      selectFamily(current, { familyId, classId: current.classId! }),
    )
    lists.types.setContext({ operation: 'types', parentId: familyId })
    void lists.types.start()
  }
  const handleTypeSelect = (typeId: string) => {
    if (!lists || !context.familyId) return
    definitionToken.current++
    setDefinitions({})
    attributeList.setContext({ operation: 'attributes' })
    setContext((current) =>
      selectType(current, { typeId, familyId: current.familyId! }),
    )
  }
  const reloadClasses = () => {
    if (!lists) return Promise.resolve(false)
    lists.classes.setContext({ operation: 'classes' })
    return lists.classes.start()
  }
  const reloadFamilies = (parentId: string) => {
    if (!lists) return Promise.resolve(false)
    lists.families.setContext({ operation: 'families', parentId })
    return lists.families.start()
  }
  const reloadTypes = (parentId: string) => {
    if (!lists) return Promise.resolve(false)
    lists.types.setContext({ operation: 'types', parentId })
    return lists.types.start()
  }
  const reloadTypeAttributes = () => {
    if (!selectedTypeId) return Promise.resolve(false)
    attributeList.setContext({
      operation: 'attributes',
      parentId: selectedTypeId,
    })
    return attributeList.start()
  }
  const retryDefinition = useCallback((id: string) => {
    setDefinitions((current) => {
      const remaining = { ...current }
      delete remaining[id]
      return remaining
    })
    setDefinitionRetry((current) => current + 1)
  }, [])
  const reloadDefinition = useCallback(
    async (id: string) => {
      try {
        const definition = await attributesApi.getAttributeDefinition(id)
        setDefinitions((current) => ({
          ...current,
          [id]: definition
            ? { status: 'ready', definition }
            : { status: 'missing' },
        }))
      } catch {
        setDefinitions((current) => ({ ...current, [id]: { status: 'error' } }))
      }
    },
    [attributesApi],
  )

  return (
    <section
      ref={screenRef}
      className="catalog-hierarchy-screen"
      aria-labelledby="catalog-hierarchy-title"
      data-context-class={context.classId}
    >
      <header className="catalog-hierarchy-header">
        <h1 id="catalog-hierarchy-title" className="catalog-visually-hidden">
          Catálogo
        </h1>
      </header>
      {successMessage && (
        <div className="catalog-success-toast" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}
      <div className="catalog-model-bar" aria-label="Modelo del catálogo">
        <span>MODELO DEL CATÁLOGO</span>
        <strong>Clase&nbsp; → &nbsp;Familia&nbsp; → &nbsp;Tipo</strong>
        {showAssignmentAction && (
          <div data-contextual-action="attributes">
            <AsignarAtributoSurface
              api={attributesApi}
              assignments={selectedAttributeState?.items ?? []}
              family={{ id: selectedFamily!.id, label: selectedFamily!.label }}
              type={{ id: selectedType!.id, label: selectedType!.label }}
              onCreated={reloadTypeAttributes}
              onSuccess={showSuccess}
            />
          </div>
        )}
        {!showAssignmentAction &&
          creationLevel === 'class' &&
          (createClass ?? api?.createClass) && (
            <div data-contextual-action="class">
              <NuevaClaseSurface
                createClass={createClass ?? api?.createClass}
                onCreated={reloadClasses}
                onSuccess={showSuccess}
              />
            </div>
          )}
        {!showAssignmentAction &&
          creationLevel === 'family' &&
          (createFamily ?? api?.createFamily) && (
            <div data-contextual-action="family">
              <CatalogCreateSurface
                level="family"
                parent={{ id: selectedClass!.id, label: selectedClass!.label }}
                createFamily={createFamily ?? api?.createFamily}
                onCreated={() => reloadFamilies(selectedClass!.id)}
                onSuccess={showSuccess}
              />
            </div>
          )}
        {!showAssignmentAction &&
          creationLevel === 'type' &&
          (createType ?? api?.createType) && (
            <div data-contextual-action="type">
              <CatalogCreateSurface
                level="type"
                parent={{
                  id: selectedFamily!.id,
                  label: selectedFamily!.label,
                }}
                createType={createType ?? api?.createType}
                onCreated={() => reloadTypes(selectedFamily!.id)}
                onSuccess={showSuccess}
              />
            </div>
          )}
      </div>
      <div className="catalog-workstation">
        <div className="catalog-browser" aria-label="Estructura del catálogo">
          <h2>ESTRUCTURA DEL CATÁLOGO</h2>
          <div className="catalog-browser-columns">
            <CatalogRegion
              label="Clases"
              column="classes"
              items={classes}
              hasChildren
              selectedId={selectedClassId}
              state={classState ?? undefined}
              onSelect={isStatic ? undefined : handleClassSelect}
              onContinue={
                isStatic ? undefined : () => void lists?.classes.continue()
              }
              onRetry={isStatic ? undefined : () => void lists?.classes.retry()}
            />
            <CatalogRegion
              label="Familias"
              column="families"
              items={families}
              hasChildren
              selectedId={selectedFamilyId}
              state={familyState ?? undefined}
              waiting="En espera de Clase."
              onSelect={isStatic ? undefined : handleFamilySelect}
              onContinue={
                isStatic ? undefined : () => void lists?.families.continue()
              }
              onRetry={
                isStatic ? undefined : () => void lists?.families.retry()
              }
            />
            <CatalogRegion
              label="Tipos"
              column="types"
              items={types}
              selectedId={selectedTypeId}
              state={typeState ?? undefined}
              waiting="En espera de Familia."
              onSelect={isStatic ? undefined : handleTypeSelect}
              onContinue={
                isStatic ? undefined : () => void lists?.types.continue()
              }
              onRetry={isStatic ? undefined : () => void lists?.types.retry()}
            />
          </div>
        </div>
        <div className="catalog-summary" aria-label="Lectura del catálogo">
          <p className="catalog-summary-path">
            {selectedPath
              ? `CLASE / FAMILIA / TIPO · ${selectedPath.classLabel} / ${selectedPath.familyLabel} / ${selectedPath.typeLabel}`
              : 'VISTA DE ESPERA · SIN SELECCIÓN'}
          </p>
          <h2>{selectedPath?.typeLabel ?? 'Sin selección'}</h2>
          <p className="catalog-summary-copy">
            {selectedPath
              ? `Este Tipo pertenece a la Familia ${selectedPath.familyLabel}.\nSu relación padre no puede modificarse.`
              : 'Seleccioná una entidad para ver su lectura nominal.'}
          </p>
          <div className="catalog-summary-divider" />
          <div
            className="catalog-summary-tabs"
            role="tablist"
            aria-label="Detalle del Tipo"
          >
            <button
              id="catalog-summary-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === 'summary'}
              aria-controls="catalog-summary-panel"
              tabIndex={activeTab === 'summary' ? 0 : -1}
              onClick={() => setActiveTab('summary')}
            >
              Resumen
            </button>
            <button
              id="catalog-attributes-tab"
              ref={attributesTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === 'attributes'}
              aria-controls="catalog-attributes-panel"
              tabIndex={activeTab === 'attributes' ? 0 : -1}
              data-spatial-id="catalog.tab.attributes"
              onClick={() => setActiveTab('attributes')}
            >
              Atributos
            </button>
          </div>
          {activeTab === 'summary' ? (
            <>
              <AttributeSummaryPanel
                selectedTypeId={selectedTypeId}
                state={selectedAttributeState}
                definitions={definitions}
                onRetry={() => void attributeList.retry()}
                onShowAll={() => {
                  setActiveTab('attributes')
                  attributesTabRef.current?.focus()
                }}
              />
              <div
                className="catalog-summary-legacy"
                aria-hidden="true"
                id="catalog-summary-panel-legacy"
                aria-labelledby="catalog-summary-tab"
              >
                <h3>RESUMEN</h3>
                <p className="catalog-summary-muted">
                  Consultá los atributos asignados a este Tipo desde la pestaña
                  Atributos.
                </p>
              </div>
            </>
          ) : (
            <AttributePanel
              api={attributesApi}
              selectedTypeId={selectedTypeId}
              state={selectedAttributeState}
              definitions={definitions}
              onContinue={() => void attributeList.continue()}
              onRetry={() => void attributeList.retry()}
              onRetryDefinition={retryDefinition}
              onReloadDefinition={reloadDefinition}
              optionPreviews={optionPreviews}
              onRetryOptions={retryOptionPreview}
              onSuccess={showSuccess}
              onActiveAttributeChange={setActiveAttributeId}
              onAttributeActionTargetChange={setAttributeActionTarget}
            />
          )}
        </div>
      </div>
      <section className="catalog-meaning" aria-label="Regla de jerarquía">
        <p>
          Primero definís una Clase, después una Familia y finalmente un Tipo.
        </p>
        <p>Las relaciones padre permanecen inmutables.</p>
      </section>
    </section>
  )
}

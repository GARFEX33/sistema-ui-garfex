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
  CatalogHierarchyPresentation,
  CatalogTypeItem,
} from './catalogHierarchy.types'
import { HierarchyNavigator } from '../../shared/ui/HierarchyNavigator'
import type {
  AttributeDefinition,
  AttributeOption,
  TypeAttributeAssignment,
  TypeAttributePage,
} from './catalogTypeAttributes.types'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
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

const attributeEffectivenessLabel = {
  SELECTED: 'Efectivo',
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

function attributeExceptionBadges(assignment: TypeAttributeAssignment) {
  const badges: string[] = []
  if (!assignment.tipoRecursoId) badges.push('Heredado')
  if (!assignment.activo) badges.push('Inactivo')
  if (assignment.selection !== 'SELECTED')
    badges.push(attributeEffectivenessLabel[assignment.selection])
  if (assignment.aplicabilidad !== 'OPTIONAL')
    badges.push(attributeApplicabilityLabel[assignment.aplicabilidad])
  if (assignment.participaIdentidad) badges.push('Parte de identidad')
  return badges
}

function optionCountClosedLabel(state: OptionPreviewState | undefined) {
  if (!state || state.status !== 'ready') return null
  const active = state.page.items.filter((option) => option.activo).length
  const suffix = state.page.isExhausted ? '' : '+'
  return `${active}${suffix} ${active === 1 ? 'opción' : 'opciones'}`
}

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
  onAssignmentChanged,
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
  onAssignmentChanged: () => void
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useEffect(() => setExpandedId(null), [selectedTypeId])

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
        const isReady = definition?.status === 'ready'
        const isOption = isReady && definition.definition.tipoDato === 'OPCION'
        const isExpanded = isReady && expandedId === assignment.id
        const exceptions = isReady ? attributeExceptionBadges(assignment) : []
        const optionCount = isOption
          ? optionCountClosedLabel(optionPreviews[definition.definition.id])
          : null
        const toggleExpanded = () =>
          setExpandedId((current) =>
            current === assignment.id ? null : assignment.id,
          )
        return (
          <article
            className="catalog-attribute-row"
            key={assignment.id}
            tabIndex={0}
            data-spatial-id={`catalog.row.attributes.${assignment.id}`}
            data-catalog-level="attributes"
            onFocus={() => onActiveAttributeChange(assignment.id)}
            onClick={() => onActiveAttributeChange(assignment.id)}
          >
            <div className="catalog-attribute-row-header">
              {isReady ? (
                <>
                  <div className="catalog-attribute-row-heading">
                    <span className="catalog-attribute-row-name">
                      {definition.definition.nombre}
                    </span>
                    <span className="catalog-attribute-row-meta">
                      {definition.definition.clave} ·{' '}
                      {attributeDataTypeLabel[definition.definition.tipoDato]}
                    </span>
                    {optionCount && (
                      <span className="catalog-attribute-row-meta">
                        {optionCount}
                      </span>
                    )}
                  </div>
                  <EditarAtributoSurface
                    api={api}
                    assignment={assignment}
                    definition={definition.definition}
                    shortcutHint={isOption ? 'E' : 'Enter / E'}
                    onUpdated={() =>
                      onReloadDefinition(definition.definition.id)
                    }
                    onAssignmentChanged={onAssignmentChanged}
                    onSuccess={onSuccess}
                    onCommandTargetChange={(target) =>
                      onAttributeActionTargetChange(
                        assignment.id,
                        'edit',
                        target,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="catalog-attribute-chevron"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} detalle de ${definition.definition.nombre}`}
                    onClick={toggleExpanded}
                  >
                    <span aria-hidden="true">⌄</span>
                  </button>
                </>
              ) : definition?.status === 'missing' ? (
                <span className="catalog-attribute-row-meta">
                  Definición no disponible.
                </span>
              ) : definition?.status === 'error' ? (
                <div
                  className="catalog-attribute-definition-error"
                  role="status"
                >
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
                <span className="catalog-attribute-row-meta" role="status">
                  Cargando definición…
                </span>
              )}
            </div>
            {isReady && (
              <div
                className="catalog-attribute-row-expanded"
                hidden={!isExpanded}
              >
                {exceptions.length > 0 && (
                  <div
                    className="catalog-attribute-badges"
                    aria-label="Estado del atributo"
                  >
                    {exceptions.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                )}
                {definition.definition.descripcion && (
                  <p className="catalog-attribute-description">
                    {definition.definition.descripcion}
                  </p>
                )}
                {isOption && (
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
                      shortcutHint="Enter / O"
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
              </div>
            )}
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

function summaryStatsLine(items: readonly TypeAttributeAssignment[]) {
  const heredados = items.filter(
    (assignment) => !assignment.tipoRecursoId,
  ).length
  const inactivos = items.filter((assignment) => !assignment.activo).length
  const noEfectivos = items.filter(
    (assignment) => assignment.selection !== 'SELECTED',
  ).length
  const parts = [
    `${items.length} ${items.length === 1 ? 'atributo' : 'atributos'}`,
  ]
  if (heredados)
    parts.push(`${heredados} ${heredados === 1 ? 'heredado' : 'heredados'}`)
  if (inactivos)
    parts.push(`${inactivos} ${inactivos === 1 ? 'inactivo' : 'inactivos'}`)
  if (noEfectivos)
    parts.push(
      `${noEfectivos} ${noEfectivos === 1 ? 'no efectivo' : 'no efectivos'}`,
    )
  return parts.join(' · ')
}

function AttributeSummaryPanel({
  selectedTypeId,
  state,
  definitions,
  onRetry,
  onContinue,
  onShowAll,
}: {
  selectedTypeId?: string
  state: CatalogListState<TypeAttributeAssignment> | null
  definitions: Readonly<Record<string, DefinitionState>>
  onRetry: () => void
  onContinue: () => void
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
  const canContinue = state?.status === 'ready' && !state.isExhausted

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
          <p className="catalog-summary-stats">
            {summaryStatsLine(items)}
            {partial && ' · vista parcial'}
          </p>
          <table className="catalog-summary-table">
            <thead>
              <tr>
                <th scope="col">Atributo</th>
                <th scope="col">Código</th>
                <th scope="col">Tipo</th>
                <th scope="col">Origen</th>
                <th scope="col">Estado</th>
                <th scope="col">Efectividad</th>
              </tr>
            </thead>
            <tbody>
              {items.map((assignment) => {
                const definition = definitions[assignment.definicionAtributoId]
                const ready = definition?.status === 'ready'
                const nombre = ready
                  ? definition.definition.nombre
                  : definition?.status === 'missing' ||
                      definition?.status === 'error'
                    ? 'Definición no disponible.'
                    : 'Cargando…'
                return (
                  <tr key={assignment.id}>
                    <th scope="row">{nombre}</th>
                    <td>{ready ? definition.definition.clave : '—'}</td>
                    <td>
                      {ready
                        ? attributeDataTypeLabel[definition.definition.tipoDato]
                        : '—'}
                    </td>
                    <td>{assignment.tipoRecursoId ? 'Directo' : 'Heredado'}</td>
                    <td>{assignment.activo ? 'Activo' : 'Inactivo'}</td>
                    <td>{attributeEffectivenessLabel[assignment.selection]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {canContinue && (
            <button
              className="catalog-summary-continue"
              type="button"
              onClick={onContinue}
            >
              Cargar más…
            </button>
          )}
        </>
      )}
      {!initialLoading && !initialError && !empty && (
        <button
          className="catalog-summary-all"
          type="button"
          onClick={onShowAll}
        >
          Ver todos en Atributos
        </button>
      )}
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
    const isOption = activeAttribute.tipoDato === 'OPCION'
    const enterCanHandle = (event: KeyboardEvent) =>
      event.key !== 'Enter' ||
      document.activeElement?.closest<HTMLElement>(
        '[data-catalog-level="attributes"]',
      )?.dataset.spatialId === `catalog.row.attributes.${activeAttributeId}`
    const removeEdit = registerAction({
      id: 'catalog.edit-attribute',
      surface: 'catalog',
      key: 'e',
      keys: isOption ? ['e'] : ['e', 'Enter'],
      shortcut: isOption ? 'E' : 'Enter / E',
      label: 'Editar atributo',
      root: () => target('edit')?.root() ?? null,
      isAvailable: () => target('edit') !== undefined,
      canHandle: enterCanHandle,
      run: (opener) => target('edit')?.open(opener),
    })
    const removeOptions = isOption
      ? registerAction({
          id: 'catalog.manage-options',
          surface: 'catalog',
          key: 'o',
          keys: ['o', 'Enter'],
          shortcut: 'Enter / O',
          label: 'Opciones',
          root: () => target('options')?.root() ?? null,
          isAvailable: () => target('options') !== undefined,
          canHandle: enterCanHandle,
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
    if (!selectedAttributeState || !selectedTypeId) return
    const ids = [
      ...new Set(
        selectedAttributeState.items.map((item) => item.definicionAtributoId),
      ),
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
      <PageHeader
        title={
          <h1 id="catalog-hierarchy-title" className="text-lg font-bold">
            Catálogo
          </h1>
        }
        context={
          <div
            className="flex flex-col gap-1 text-text-primary md:flex-row md:items-baseline md:gap-3"
            aria-label="Modelo del catálogo"
          >
            <span className="text-xs font-bold tracking-wider text-text-secondary">
              MODELO DEL CATÁLOGO
            </span>
            <strong className="text-sm">
              Clase&nbsp; → &nbsp;Familia&nbsp; → &nbsp;Tipo
            </strong>
          </div>
        }
        action={
          <>
            {showAssignmentAction && (
              <div data-contextual-action="attributes">
                <AsignarAtributoSurface
                  api={attributesApi}
                  assignments={selectedAttributeState?.items ?? []}
                  family={{
                    id: selectedFamily!.id,
                    label: selectedFamily!.label,
                  }}
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
                    parent={{
                      id: selectedClass!.id,
                      label: selectedClass!.label,
                    }}
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
          </>
        }
      />
      {successMessage && (
        <div className="catalog-success-toast" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}
      <div className="catalog-workstation">
        <WorkCard
          className="catalog-browser"
          density="comfortable"
          aria-labelledby="catalog-browser-title"
        >
          <h2 id="catalog-browser-title">ESTRUCTURA DEL CATÁLOGO</h2>
          <HierarchyNavigator
            className="catalog-browser-columns"
            classNames={{
              region: 'catalog-region',
              items: 'catalog-region-items',
              row: 'catalog-item',
              selectedRow: 'is-selected',
              childIndicator: 'catalog-row-chevron',
              state: 'catalog-region-state',
            }}
            columns={[
              {
                id: 'classes',
                label: 'Clases',
                items: classes,
                hasChildren: true,
                selectedId: selectedClassId,
                state: classState ?? undefined,
                spatial: {
                  id: (item) => `catalog.row.classes.${item.id}`,
                  column: 'classes',
                  metadata: { 'data-catalog-level': 'classes' },
                },
                testIds: { childIndicator: 'catalog-row-chevron' },
                labels: {
                  loading: 'Cargando…',
                  empty: 'Estado vacío confirmado',
                  retry: 'Reintentar',
                  partial: 'Listado parcial',
                  retryContinuation: 'Reintentar continuación',
                  loadMore: 'Cargar más…',
                },
                onSelect: isStatic ? undefined : handleClassSelect,
                onContinue: isStatic
                  ? undefined
                  : () => void lists?.classes.continue(),
                onRetry: isStatic
                  ? undefined
                  : () => void lists?.classes.retry(),
              },
              {
                id: 'families',
                label: 'Familias',
                items: families,
                hasChildren: true,
                selectedId: selectedFamilyId,
                state: familyState ?? undefined,
                waitingLabel: 'En espera de Clase.',
                spatial: {
                  id: (item) => `catalog.row.families.${item.id}`,
                  column: 'families',
                  metadata: { 'data-catalog-level': 'families' },
                },
                testIds: { childIndicator: 'catalog-row-chevron' },
                labels: {
                  loading: 'Cargando…',
                  empty: 'Estado vacío confirmado',
                  retry: 'Reintentar',
                  partial: 'Listado parcial',
                  retryContinuation: 'Reintentar continuación',
                  loadMore: 'Cargar más…',
                },
                onSelect: isStatic ? undefined : handleFamilySelect,
                onContinue: isStatic
                  ? undefined
                  : () => void lists?.families.continue(),
                onRetry: isStatic
                  ? undefined
                  : () => void lists?.families.retry(),
              },
              {
                id: 'types',
                label: 'Tipos',
                items: types,
                selectedId: selectedTypeId,
                state: typeState ?? undefined,
                waitingLabel: 'En espera de Familia.',
                spatial: {
                  id: (item) => `catalog.row.types.${item.id}`,
                  column: 'types',
                  metadata: { 'data-catalog-level': 'types' },
                },
                labels: {
                  loading: 'Cargando…',
                  empty: 'Estado vacío confirmado',
                  retry: 'Reintentar',
                  partial: 'Listado parcial',
                  retryContinuation: 'Reintentar continuación',
                  loadMore: 'Cargar más…',
                },
                onSelect: isStatic ? undefined : handleTypeSelect,
                onContinue: isStatic
                  ? undefined
                  : () => void lists?.types.continue(),
                onRetry: isStatic ? undefined : () => void lists?.types.retry(),
              },
            ]}
          />
        </WorkCard>
        <WorkCard
          className="catalog-summary"
          density="compact"
          aria-label="Lectura del catálogo"
        >
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
            <AttributeSummaryPanel
              selectedTypeId={selectedTypeId}
              state={selectedAttributeState}
              definitions={definitions}
              onRetry={() => void attributeList.retry()}
              onContinue={() => void attributeList.continue()}
              onShowAll={() => {
                setActiveTab('attributes')
                attributesTabRef.current?.focus()
              }}
            />
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
              onAssignmentChanged={() => void reloadTypeAttributes()}
              optionPreviews={optionPreviews}
              onRetryOptions={retryOptionPreview}
              onSuccess={showSuccess}
              onActiveAttributeChange={setActiveAttributeId}
              onAttributeActionTargetChange={setAttributeActionTarget}
            />
          )}
        </WorkCard>
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

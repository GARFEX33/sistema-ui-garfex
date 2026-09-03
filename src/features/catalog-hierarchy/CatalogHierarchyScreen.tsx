import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CatalogCreateSurface, NuevaClaseSurface } from './NuevaClaseSurface'
import { useAutoClosingMessage } from './useAutoClosingMessage'
import {
  createCatalogHierarchyConvexApi,
  type CatalogHierarchyApi,
} from './catalogHierarchy.api'
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
import './catalogHierarchy.css'

type ConnectedLists = {
  classes: CatalogListController<CatalogClassItem>
  families: CatalogListController<CatalogFamilyItem>
  types: CatalogListController<CatalogTypeItem>
}

const project = (items: readonly { id: unknown; nombre: string }[]) =>
  items.map((item) => ({ id: item.id as string, label: item.nombre }))

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
  const [successMessage, showSuccess] = useAutoClosingMessage()
  const [api] = useState<CatalogHierarchyApi | null>(() =>
    presentation === undefined ? createCatalogHierarchyConvexApi() : null,
  )
  const [lists] = useState<ConnectedLists | null>(() =>
    api ? makeLists(api) : null,
  )
  const screenRef = useRef<HTMLElement>(null)
  const classState = useListSnapshot(lists?.classes ?? null)
  const familyState = useListSnapshot(lists?.families ?? null)
  const typeState = useListSnapshot(lists?.types ?? null)
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

  useEffect(() => {
    if (!lists) return
    void lists.classes.start()
  }, [lists])

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
    setContext((current) => selectClass(current, classId))
    lists.families.setContext({ operation: 'families', parentId: classId })
    lists.types.setContext({ operation: 'types' })
    void lists.families.start()
  }
  const handleFamilySelect = (familyId: string) => {
    if (!lists || !context.classId) return
    setContext((current) =>
      selectFamily(current, { familyId, classId: current.classId! }),
    )
    lists.types.setContext({ operation: 'types', parentId: familyId })
    void lists.types.start()
  }
  const handleTypeSelect = (typeId: string) => {
    if (!lists || !context.familyId) return
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
        {creationLevel === 'class' && (createClass ?? api?.createClass) && (
          <div data-contextual-action="class">
            <NuevaClaseSurface
              createClass={createClass ?? api?.createClass}
              onCreated={reloadClasses}
              onSuccess={showSuccess}
            />
          </div>
        )}
        {creationLevel === 'family' && (createFamily ?? api?.createFamily) && (
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
        {creationLevel === 'type' && (createType ?? api?.createType) && (
          <div data-contextual-action="type">
            <CatalogCreateSurface
              level="type"
              parent={{ id: selectedFamily!.id, label: selectedFamily!.label }}
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
          <h3>CAPACIDADES POSTERIORES</h3>
          <p className="catalog-summary-muted">
            Fuera de este cambio de jerarquía base.
          </p>
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

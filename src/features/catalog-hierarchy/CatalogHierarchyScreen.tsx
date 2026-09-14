import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { HierarchyNavigator } from '../../shared/ui/HierarchyNavigator'
import { Button } from '../../shared/ui/Button'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { CatalogCreateSurface, NuevaClaseSurface } from './NuevaClaseSurface'
import { CatalogTypeEffectiveAttributes } from './CatalogTypeEffectiveAttributes'
import {
  createCatalogHierarchyConvexApi,
  createCatalogHierarchyRestApi,
  type CatalogHierarchyApi,
  type CatalogHierarchyRestApi,
} from './catalogHierarchy.api'
import { createCatalogTypeEffectiveAttributesApi } from './catalogTypeEffectiveAttributes.api'
import { useCatalogTypeEffectiveAttributes } from './useCatalogTypeEffectiveAttributes'
import {
  createInitialCatalogHierarchyContext,
  selectClass,
  selectFamily,
  selectType,
} from './catalogHierarchyState'
import {
  createCatalogClassWindow,
  createCatalogDependentWindow,
  type CatalogClassWindowController,
  type CatalogDependentWindowController,
} from './useCatalogList'
import type {
  CatalogFamilyRestItem,
  CatalogHierarchyPresentation,
  CatalogTypeRestItem,
} from './catalogHierarchy.types'
import { useAutoClosingMessage } from './useAutoClosingMessage'
import './catalogHierarchy.css'

type ConnectedLists = {
  families: CatalogDependentWindowController<CatalogFamilyRestItem>
  types: CatalogDependentWindowController<CatalogTypeRestItem>
}

const project = (items: readonly { id: unknown; nombre: string }[]) =>
  items.map((item) => ({ id: item.id as string, label: item.nombre }))

function makeLists(api: CatalogHierarchyRestApi): ConnectedLists {
  return {
    families: createCatalogDependentWindow({
      load: ({ parentCode, ...input }) =>
        api.listFamilies({ ...input, classCode: parentCode }),
    }),
    types: createCatalogDependentWindow({
      load: ({ parentCode, ...input }) =>
        api.listTypes({ ...input, familyCode: parentCode }),
    }),
  }
}

const emptySubscribe = () => () => undefined

function useClassWindowSnapshot(
  controller: CatalogClassWindowController | null,
) {
  const snapshotRef = useRef(controller?.getState() ?? null)
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

function useDependentWindowSnapshot<T>(
  controller: CatalogDependentWindowController<T> | null,
) {
  const snapshotRef = useRef(controller?.getState() ?? null)
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

function AttributeSummaryPanel({
  selectedTypeLabel,
}: {
  selectedTypeLabel?: string
}) {
  return (
    <div
      className="catalog-summary-panel"
      role="tabpanel"
      id="catalog-summary-panel"
      aria-labelledby="catalog-summary-tab"
    >
      <h3>RESUMEN</h3>
      <p className="catalog-summary-muted">
        {selectedTypeLabel
          ? 'Consultá los atributos efectivos del Tipo en la pestaña Atributos.'
          : 'Seleccioná un Tipo para consultar sus atributos efectivos.'}
      </p>
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
  createClass?: CatalogHierarchyRestApi['createClass']
  createFamily?: CatalogHierarchyApi['createFamily']
  createType?: CatalogHierarchyApi['createType']
}) {
  const [context, setContext] = useState(createInitialCatalogHierarchyContext)
  const [successMessage, showSuccess] = useAutoClosingMessage()
  const [api] = useState<CatalogHierarchyApi | null>(() =>
    presentation === undefined ? createCatalogHierarchyConvexApi() : null,
  )
  const [classApi] = useState<CatalogHierarchyRestApi | null>(() =>
    presentation === undefined ? createCatalogHierarchyRestApi() : null,
  )
  const [classList] = useState<CatalogClassWindowController | null>(() =>
    classApi ? createCatalogClassWindow({ load: classApi.listClasses }) : null,
  )
  const [lists] = useState<ConnectedLists | null>(() =>
    classApi ? makeLists(classApi) : null,
  )
  const [effectiveAttributesApi] = useState(
    createCatalogTypeEffectiveAttributesApi,
  )
  const [activeTab, setActiveTab] = useState<'summary' | 'attributes'>(
    'summary',
  )
  const screenRef = useRef<HTMLElement>(null)
  const attributesTabRef = useRef<HTMLButtonElement>(null)
  const classState = useClassWindowSnapshot(classList)
  const familyState = useDependentWindowSnapshot(lists?.families ?? null)
  const typeState = useDependentWindowSnapshot(lists?.types ?? null)
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
  const selectedClass = classes.find((item) => item.id === selectedClassId)
  const selectedFamily = families.find((item) => item.id === selectedFamilyId)
  const selectedType = types.find((item) => item.id === selectedTypeId)
  const selectedClassRecord = classState?.items.find(
    (item) => item.id === selectedClassId,
  )
  const selectedFamilyRecord = familyState?.items.find(
    (item) => item.id === selectedFamilyId,
  )
  const selectedTypeRecord = typeState?.items.find(
    (item) => item.id === selectedTypeId,
  )
  const effectiveAttributes = useCatalogTypeEffectiveAttributes(
    effectiveAttributesApi,
    {
      classCode: selectedClassRecord?.clave,
      familyCode: selectedFamilyRecord?.clave,
      typeCode: selectedTypeRecord?.clave,
    },
  )
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
  const showCreationAction = activeTab !== 'attributes'

  useEffect(() => {
    void classList?.start()
  }, [classList])

  useEffect(() => {
    const trigger = screenRef.current?.querySelector<HTMLElement>(
      '.catalog-create-trigger',
    )
    if (!trigger) return
    trigger.dataset.spatialId = `catalog.new-${creationLevel}`
    return () => {
      if (trigger.dataset.spatialId === `catalog.new-${creationLevel}`)
        delete trigger.dataset.spatialId
    }
  }, [creationLevel])

  const handleClassSelect = (classId: string) => {
    const selectedClassRecord = classState?.items.find(
      (item) => item.id === classId,
    )
    if (!lists || !selectedClassRecord) return
    setContext((current) => selectClass(current, classId))
    lists.families.setContext({ parentCode: selectedClassRecord.clave })
    lists.types.setContext({})
    void lists.families.start()
  }
  const handleFamilySelect = (familyId: string) => {
    const selectedClassRecord = classState?.items.find(
      (item) => item.id === context.classId,
    )
    const selectedFamilyRecord = familyState?.items.find(
      (item) => item.id === familyId,
    )
    if (
      !lists ||
      !context.classId ||
      !selectedClassRecord ||
      !selectedFamilyRecord
    )
      return
    setContext((current) =>
      selectFamily(current, { familyId, classId: current.classId! }),
    )
    lists.types.setContext({
      classCode: selectedClassRecord.clave,
      parentCode: selectedFamilyRecord.clave,
    })
    void lists.types.start()
  }
  const handleTypeSelect = (typeId: string) => {
    if (!lists || !context.familyId) return
    setContext((current) =>
      selectType(current, { typeId, familyId: current.familyId! }),
    )
  }
  const reloadClasses = () => classList?.start() ?? Promise.resolve(false)
  const reloadFamilies = () => {
    if (!lists || !selectedClassRecord) return Promise.resolve(false)
    lists.families.setContext({ parentCode: selectedClassRecord.clave })
    return lists.families.start()
  }
  const reloadTypes = () => {
    if (!lists || !selectedClassRecord || !selectedFamilyRecord)
      return Promise.resolve(false)
    lists.types.setContext({
      classCode: selectedClassRecord.clave,
      parentCode: selectedFamilyRecord.clave,
    })
    return lists.types.start()
  }

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
          showCreationAction ? (
            <>
              {creationLevel === 'class' &&
                (createClass ?? api?.createClass) && (
                  <div data-contextual-action="class">
                    <NuevaClaseSurface
                      createClass={createClass ?? classApi?.createClass}
                      onCreated={reloadClasses}
                      onSuccess={showSuccess}
                    />
                  </div>
                )}
              {creationLevel === 'family' &&
                (createFamily ?? api?.createFamily) && (
                  <div data-contextual-action="family">
                    <CatalogCreateSurface
                      level="family"
                      parent={{
                        id: selectedClass!.id,
                        label: selectedClass!.label,
                      }}
                      createFamily={createFamily ?? api?.createFamily}
                      onCreated={reloadFamilies}
                      onSuccess={showSuccess}
                    />
                  </div>
                )}
              {creationLevel === 'type' && (createType ?? api?.createType) && (
                <div data-contextual-action="type">
                  <CatalogCreateSurface
                    level="type"
                    parent={{
                      id: selectedFamily!.id,
                      label: selectedFamily!.label,
                    }}
                    createType={createType ?? api?.createType}
                    onCreated={reloadTypes}
                    onSuccess={showSuccess}
                  />
                </div>
              )}
            </>
          ) : null
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
                  loadMore: 'Siguiente ventana',
                },
                onSelect: isStatic ? undefined : handleClassSelect,
                onContinue: isStatic ? undefined : () => void classList?.next(),
                onRetry: isStatic ? undefined : () => void classList?.retry(),
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
                  loadMore: 'Siguiente ventana',
                },
                onSelect: isStatic ? undefined : handleFamilySelect,
                onContinue: isStatic
                  ? undefined
                  : () => void lists?.families.next(),
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
                  loadMore: 'Siguiente ventana',
                },
                onSelect: isStatic ? undefined : handleTypeSelect,
                onContinue: isStatic
                  ? undefined
                  : () => void lists?.types.next(),
                onRetry: isStatic ? undefined : () => void lists?.types.retry(),
              },
            ]}
          />
          <section
            className="catalog-region-state"
            aria-label="Alcance REST de Catálogo"
          >
            <p>
              La navegación entre ventanas no garantiza orden ni continuidad.
            </p>
            <p>
              Los atributos efectivos se resuelven por Core en la pestaña
              Atributos.
            </p>
          </section>
          {!isStatic && classState?.hasPrevious && (
            <Button
              variant="outline"
              onPress={() => void classList?.previous()}
            >
              Ventana anterior
            </Button>
          )}
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
            <AttributeSummaryPanel selectedTypeLabel={selectedType?.label} />
          ) : (
            <CatalogTypeEffectiveAttributes
              status={effectiveAttributes.status}
              attributes={effectiveAttributes.attributes}
              retry={effectiveAttributes.retry}
              fallbackFocus={() => attributesTabRef.current}
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

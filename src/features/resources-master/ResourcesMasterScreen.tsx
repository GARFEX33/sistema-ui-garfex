import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createResourcesMasterConvexApi,
  type ResourcesMasterApi,
} from './resourcesMaster.api'
import {
  useResourcesMasterListQuery,
  type ResourcesListCriteria,
} from './useResourcesMasterListQuery'
import { useResourcesHierarchy } from './useResourcesHierarchy'
import type { ResourceId, ResourceSummary } from './resourcesMaster.types'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { isValidFocusCandidate } from '../../shared/keyboard/focusRestoration'
import { CrearRecursoSurface } from './CrearRecursoSurface'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { HierarchyNavigator } from '../../shared/ui/HierarchyNavigator'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'

const diagnosticsLabel: Record<
  ResourceSummary['classificationStatus']['state'],
  string
> = {
  EFFECTIVE: 'Efectivo',
  INERT: 'Inerte',
  BROKEN_REFERENCE: 'Referencia rota',
}

const project = (items: readonly { id: ResourceId; nombre: string }[]) =>
  items.map((item) => ({ id: item.id as string, label: item.nombre }))

export function ResourcesMasterScreen() {
  const [api] = useState<ResourcesMasterApi>(() =>
    createResourcesMasterConvexApi(),
  )
  const { registerCommand } = useKeyboardController()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')
  const searchTextRef = useRef(searchText)
  const hierarchy = useResourcesHierarchy(api)
  const hierarchyFilters = useMemo(() => {
    if (hierarchy.selection.typeId !== undefined)
      return { typeId: hierarchy.selection.typeId }
    if (hierarchy.selection.familyId !== undefined)
      return { familyId: hierarchy.selection.familyId }
    if (hierarchy.selection.classId !== undefined)
      return { classId: hierarchy.selection.classId }
    return {}
  }, [
    hierarchy.selection.classId,
    hierarchy.selection.familyId,
    hierarchy.selection.typeId,
  ])
  const hierarchyFiltersRef = useRef(hierarchyFilters)
  const searchRestartTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hierarchyInitialized = useRef(false)
  const [criteria, setCriteria] = useState<ResourcesListCriteria>({
    searchText: '',
  })
  const { items, status, isDone, loadMore, retry } =
    useResourcesMasterListQuery(api, criteria)

  useEffect(() => {
    searchTextRef.current = searchText
  }, [searchText])

  useEffect(() => {
    hierarchyFiltersRef.current = hierarchyFilters
  }, [hierarchyFilters])

  useEffect(() => {
    const trimmed = searchText.trim()
    const id = setTimeout(
      () => {
        searchRestartTimer.current = null
        setCriteria({
          searchText: trimmed,
          ...hierarchyFiltersRef.current,
        })
      },
      trimmed ? 250 : 0,
    )
    searchRestartTimer.current = id
    return () => {
      clearTimeout(id)
      if (searchRestartTimer.current === id) searchRestartTimer.current = null
    }
  }, [searchText])

  useEffect(() => {
    if (!hierarchyInitialized.current) {
      hierarchyInitialized.current = true
      return
    }
    if (searchRestartTimer.current !== null) {
      clearTimeout(searchRestartTimer.current)
      searchRestartTimer.current = null
    }
    setCriteria({
      searchText: searchTextRef.current.trim(),
      ...hierarchyFilters,
    })
  }, [hierarchyFilters])

  const focusSearchCommand = useMemo(
    () => ({
      id: 'resources.focus-search',
      surface: 'recursos' as const,
      key: 'b',
      shortcut: 'B',
      label: 'Buscar',
      group: 'Recursos maestros',
      scope: 'active-surface' as const,
      root: () => searchInputRef.current,
      isAvailable: () => isValidFocusCandidate(searchInputRef.current),
      action: () => searchInputRef.current?.focus(),
    }),
    [],
  )
  useEffect(
    () => registerCommand(focusSearchCommand),
    [focusSearchCommand, registerCommand],
  )

  const isLoading = status === 'initial-loading'
  const isInitialError = status === 'initial-error'
  const isPartialError = status === 'partial-error'
  const isEmpty = status === 'empty'
  const showLoadMore =
    !isDone &&
    items.length > 0 &&
    (status === 'ready' || status === 'loading-more')

  return (
    <section
      className="w-full text-text-primary"
      aria-labelledby="resources-master-title"
    >
      <PageHeader
        title={
          <h1 id="resources-master-title" className="text-lg font-bold">
            Recursos maestros
          </h1>
        }
        action={<CrearRecursoSurface api={api} onCreated={() => undefined} />}
      />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <WorkCard aria-labelledby="resources-hierarchy-title">
          <h2 id="resources-hierarchy-title" className="sr-only">
            Jerarquía de recursos
          </h2>
          <HierarchyNavigator
            columns={[
              {
                id: 'classes',
                label: 'Clases',
                items: project(hierarchy.classes.items),
                selectedId: hierarchy.selection.classId as string | undefined,
                state: hierarchy.classes,
                onSelect: hierarchy.selectClass,
                onContinue: hierarchy.continueClasses,
                onRetry: hierarchy.retryClasses,
                hasChildren: true,
                spatial: {
                  id: (item) => `resources.class.${item.id}`,
                  column: 'class',
                  metadata: { 'data-spatial-level': 'class' },
                },
                labels: {
                  loading: 'Cargando…',
                  empty: 'No hay clases activas.',
                  retry: 'Reintentar clases',
                  partial: 'No se pudieron cargar más clases.',
                  retryContinuation: 'Reintentar continuación de clases',
                  loadMore: 'Cargar más clases…',
                },
              },
              {
                id: 'families',
                label: 'Familias',
                items: project(hierarchy.families.items),
                selectedId: hierarchy.selection.familyId as string | undefined,
                waitingLabel: 'Seleccioná una Clase.',
                state: hierarchy.families,
                onSelect: hierarchy.selectFamily,
                onContinue: hierarchy.continueFamilies,
                onRetry: hierarchy.retryFamilies,
                hasChildren: true,
                spatial: {
                  id: (item) => `resources.family.${item.id}`,
                  column: 'family',
                  metadata: { 'data-spatial-level': 'family' },
                },
                labels: {
                  loading: 'Cargando…',
                  empty: 'No hay familias activas.',
                  retry: 'Reintentar familias',
                  partial: 'No se pudieron cargar más familias.',
                  retryContinuation: 'Reintentar continuación de familias',
                  loadMore: 'Cargar más familias…',
                },
              },
              {
                id: 'types',
                label: 'Tipos',
                items: project(hierarchy.types.items),
                selectedId: hierarchy.selection.typeId as string | undefined,
                waitingLabel: 'Seleccioná una Familia.',
                state: hierarchy.types,
                onSelect: hierarchy.selectType,
                onContinue: hierarchy.continueTypes,
                onRetry: hierarchy.retryTypes,
                spatial: {
                  id: (item) => `resources.type.${item.id}`,
                  column: 'type',
                  metadata: { 'data-spatial-level': 'type' },
                },
                labels: {
                  loading: 'Cargando…',
                  empty: 'No hay tipos activos.',
                  retry: 'Reintentar tipos',
                  partial: 'No se pudieron cargar más tipos.',
                  retryContinuation: 'Reintentar continuación de tipos',
                  loadMore: 'Cargar más tipos…',
                },
              },
            ]}
          />
        </WorkCard>
        <WorkCard aria-labelledby="resources-list-title">
          <div className="mb-3 w-full max-w-md">
            <Field label="Buscar" htmlFor="resources-search">
              <input
                ref={searchInputRef}
                id="resources-search"
                className={fieldInputClass}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Nombre del recurso"
                data-spatial-id="resources.search"
              />
            </Field>
          </div>
          <h2 id="resources-list-title" className="sr-only">
            Listado de recursos
          </h2>
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-border">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  Código
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  Diagnóstico
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((resource) => (
                <tr
                  key={resource.id as string}
                  className="focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
                  tabIndex={0}
                  data-resource-row
                  data-spatial-id={`resource.${resource.id}`}
                >
                  <td className="border-b border-border px-2 py-3">
                    {resource.nombre}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.identificadorTecnico}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {diagnosticsLabel[resource.classificationStatus.state]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && (
            <p
              className="mt-4 text-sm leading-6 text-text-secondary"
              role="status"
            >
              Cargando…
            </p>
          )}
          {isEmpty && (
            <p
              className="mt-4 text-sm leading-6 text-text-secondary"
              role="status"
            >
              No hay recursos para este filtro.
            </p>
          )}
          {isInitialError && (
            <div
              className="mt-4 space-y-3 text-sm leading-6 text-text-secondary"
              role="alert"
            >
              <p>No se pudieron cargar los recursos.</p>
              <Button
                variant="outline"
                type="button"
                onPress={() => {
                  void retry()
                }}
              >
                Reintentar
              </Button>
            </div>
          )}
          {isPartialError && (
            <div
              className="mt-4 space-y-3 text-sm leading-6 text-text-secondary"
              role="alert"
            >
              <p>No se pudo cargar la página siguiente.</p>
              <Button
                variant="outline"
                type="button"
                onPress={() => {
                  void retry()
                }}
              >
                Reintentar continuación
              </Button>
            </div>
          )}
          {showLoadMore && (
            <Button
              variant="outline"
              type="button"
              className="mt-3"
              isDisabled={status === 'loading-more'}
              onPress={() => {
                void loadMore()
              }}
            >
              Cargar más…
            </Button>
          )}
        </WorkCard>
      </div>
    </section>
  )
}

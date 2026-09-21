import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createResourcesMasterRestApi,
  type ResourcesMasterRestReadApi,
} from './resourcesMaster.api'
import { useResourcesHierarchy } from './useResourcesHierarchy'
import { useResourcesMasterRestWindow } from './useResourcesMasterRestWindow'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { isValidFocusCandidate } from '../../shared/keyboard/focusRestoration'
import { CrearRecursoSurface } from './CrearRecursoSurface'
import {
  StagedSearchSelector,
  type SelectorLoadState,
} from './StagedSearchSelector'
import {
  mapHierarchyWindowToSelectorLoadState,
  type HierarchyWindowState,
} from './resourceCreationWizard.types'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { useAutoClosingMessage } from './useAutoClosingMessage'
import {
  useResourcePresentationNames,
  type ResourcePresentationNameState,
} from './useResourcePresentationNames'
import type { Resource } from './resourcesMaster.types'

// Same id/name projection used by ResourceCreationContextStage.tsx for the
// resource-creation wizard's StagedSearchSelectors over these same REST
// hierarchy item shapes (id/code/name) — mirrored here rather than shared
// across files to keep each StagedSearchSelector caller self-contained.
const hierarchyItemKey = (item: { id: string }) => item.id
const hierarchyItemName = (item: { name: string }) => item.name

// mapHierarchyWindowToSelectorLoadState (resourceCreationWizard.types.ts) is
// reused as-is rather than duplicated (same feature, direct import), but it
// intentionally still maps 'waiting-for-parent' to a generic 'loading' for
// backward compatibility with the resource-creation wizard (out of scope for
// this slice): that wizard only ever renders a context stage once its
// parent is already confirmed, so the distinction never surfaces there, and
// changing the shared function's behavior would risk that untouched screen.
// This screen shows all three columns at once, so 'waiting-for-parent' is a
// real, user-visible state here — this thin wrapper adds the one extra case
// locally instead.
const mapHierarchyColumnLoadState = <T,>(
  window: HierarchyWindowState<T>,
): SelectorLoadState =>
  window.status === 'waiting-for-parent'
    ? { status: 'waiting-for-parent' }
    : mapHierarchyWindowToSelectorLoadState(window)

// StagedSearchSelector's onLoadMore is required by its prop type, but the
// bounded (maxVisibleRows set) mode used below never calls it — the caller
// is expected to have already loaded the complete list up front (Slice E1's
// useResourcesHierarchy does exactly that). A stable no-op keeps the prop
// contract satisfied without pretending pagination exists here.
const noopLoadMore = () => {}

type HierarchyStage = 'class' | 'family' | 'type' | 'done'

const hierarchyStageLabel: Record<Exclude<HierarchyStage, 'done'>, string> = {
  class: 'Clase',
  family: 'Familia',
  type: 'Tipo',
}

// Two-line primary/secondary cell, matching the convention already
// established by EffectiveAttributeRow in CatalogTypeEffectiveAttributes.tsx
// (same functional family: bold text-primary name, muted text-secondary
// detail line) rather than inventing a new visual pattern for this screen.
function ResourcePresentationCell({
  resource,
  presentation,
}: {
  resource: Resource
  presentation: ResourcePresentationNameState | undefined
}) {
  const secondary = [
    resource.scope.classCode,
    resource.scope.familyCode,
    resource.scope.typeCode,
  ].join(' · ')

  return (
    <span className="block min-w-0 space-y-1">
      {presentation === undefined || presentation.status === 'loading' ? (
        <span className="block text-sm text-text-secondary">Cargando…</span>
      ) : presentation.status === 'error' ? (
        <span className="block text-sm font-bold text-text-primary">
          Nombre no disponible
        </span>
      ) : (
        <span className="block break-words text-sm font-bold text-text-primary">
          {presentation.name}
        </span>
      )}
      <span className="block text-xs font-medium tracking-wide text-text-secondary">
        {secondary}
      </span>
    </span>
  )
}

export interface ResourcesMasterScreenProps {
  creationOwnership: ResourceCreationEvaluationOwnership | null
}

// creationOwnership is not yet wired into the resource-creation surface.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ResourcesMasterScreen(_props: ResourcesMasterScreenProps) {
  const [api] = useState<ResourcesMasterRestReadApi>(() =>
    createResourcesMasterRestApi(),
  )
  const { registerCommand } = useKeyboardController()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')
  const [successMessage, showSuccess] = useAutoClosingMessage()
  const hierarchy = useResourcesHierarchy(api)
  const selectedClass = hierarchy.classes.items.find(
    (item) => item.id === hierarchy.selection.classId,
  )
  const selectedFamily = hierarchy.families.items.find(
    (item) => item.id === hierarchy.selection.familyId,
  )
  const selectedType = hierarchy.types.items.find(
    (item) => item.id === hierarchy.selection.typeId,
  )

  // Slice E2: the three columns stay visible simultaneously (no explicit
  // wizard-style stage reducer), so "current stage" is derived straight from
  // the hierarchy selection itself — the same shape CrearRecursoSurface.tsx
  // derives from its own reducer state for its focusStageInput pattern.
  const hierarchyStage: HierarchyStage = !hierarchy.selection.classId
    ? 'class'
    : !hierarchy.selection.familyId
      ? 'family'
      : !hierarchy.selection.typeId
        ? 'type'
        : 'done'
  const hierarchyColumnsRef = useRef<HTMLDivElement>(null)
  const focusStageInput = useCallback(
    (stage: Exclude<HierarchyStage, 'done'>) => {
      hierarchyColumnsRef.current
        ?.querySelector<HTMLInputElement>(
          `input[aria-label="${hierarchyStageLabel[stage]}"]`,
        )
        ?.focus()
    },
    [],
  )
  const previousHierarchyStageRef = useRef(hierarchyStage)
  useEffect(() => {
    if (
      previousHierarchyStageRef.current !== hierarchyStage &&
      hierarchyStage !== 'done'
    ) {
      focusStageInput(hierarchyStage)
    }
    previousHierarchyStageRef.current = hierarchyStage
  }, [hierarchyStage, focusStageInput])

  const criteria = useMemo(
    () => ({
      // Slice D2: the backend's `text` filter matches undocumented fields
      // (confirmed live: it also matches scope/type codes embedded in
      // identityV1), so it is never sent for search — search is refined
      // entirely client-side below, over this hierarchy-filtered window.
      text: '',
      scope: 'ACTIVE' as const,
      ...(selectedClass && { classCode: selectedClass.code }),
      ...(selectedFamily && { familyCode: selectedFamily.code }),
      ...(selectedType && { typeCode: selectedType.code }),
      limit: 20,
    }),
    [selectedClass, selectedFamily, selectedType],
  )
  const {
    resources,
    status,
    hasPrevious,
    hasNext,
    previous,
    next,
    retry,
    refetchActive,
  } = useResourcesMasterRestWindow(api, criteria)
  const presentationNames = useResourcePresentationNames(api, resources)
  const normalizedSearch = searchText.trim().toLowerCase()
  // Slice D2 scope: this only refines the currently-loaded window (the page
  // already fetched by the hierarchy filter) — it does not search across
  // pages. Anterior/Siguiente keep paging the backend's hierarchy-filtered
  // window; this filter applies visually on top of whichever page is shown.
  const visibleResources = useMemo(() => {
    if (normalizedSearch === '') return resources
    return resources.filter((resource) => {
      const presentation = presentationNames[resource.id]
      if (presentation === undefined || presentation.status !== 'ready')
        return false
      const haystack = [
        presentation.name ?? '',
        ...presentation.searchableValues,
      ]
      return haystack.some((text) =>
        text.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [resources, presentationNames, normalizedSearch])

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

  const onResourceCreated = useCallback(
    (message: string) => {
      showSuccess(message)
      void refetchActive()
    },
    [showSuccess, refetchActive],
  )

  const isLoading = status === 'initial-loading'
  const isInitialError = status === 'initial-error'
  const isNavigationError = status === 'navigation-error'
  const isNavigating = status === 'navigating'
  // Covers both a backend-empty window and a search term that leaves no
  // visible resource in the currently-loaded window (Slice D2 client-side
  // refinement never issues a request, so it reuses this same empty state).
  const isEmpty =
    status === 'empty' || (status === 'ready' && visibleResources.length === 0)

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
        action={<CrearRecursoSurface api={api} onSuccess={onResourceCreated} />}
      />
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-30 flex items-center gap-3 rounded-xl border border-success bg-success-subtle px-6 py-4 text-sm font-bold text-success shadow-lg"
        >
          {successMessage}
        </div>
      )}
      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <WorkCard
          aria-labelledby="resources-hierarchy-title"
          className="lg:col-span-3"
        >
          <h2 id="resources-hierarchy-title" className="sr-only">
            Jerarquía de recursos
          </h2>
          <div ref={hierarchyColumnsRef} className="grid gap-4 sm:grid-cols-3">
            <StagedSearchSelector
              label="Clase"
              items={hierarchy.classes.items}
              itemKey={hierarchyItemKey}
              itemName={hierarchyItemName}
              confirmedKey={(hierarchy.selection.classId as string) ?? null}
              loadState={mapHierarchyColumnLoadState(hierarchy.classes)}
              onConfirm={(item) => hierarchy.selectClass(item.id)}
              onLoadMore={noopLoadMore}
              onRetry={hierarchy.retryClasses}
              maxVisibleRows={5}
              spatialId="resources.class"
            />
            <StagedSearchSelector
              label="Familia"
              items={hierarchy.families.items}
              itemKey={hierarchyItemKey}
              itemName={hierarchyItemName}
              confirmedKey={(hierarchy.selection.familyId as string) ?? null}
              loadState={mapHierarchyColumnLoadState(hierarchy.families)}
              onConfirm={(item) => hierarchy.selectFamily(item.id)}
              onLoadMore={noopLoadMore}
              onRetry={hierarchy.retryFamilies}
              maxVisibleRows={5}
              waitingForParentLabel="Seleccioná una Clase primero."
              spatialId="resources.family"
            />
            <StagedSearchSelector
              label="Tipo"
              items={hierarchy.types.items}
              itemKey={hierarchyItemKey}
              itemName={hierarchyItemName}
              confirmedKey={(hierarchy.selection.typeId as string) ?? null}
              loadState={mapHierarchyColumnLoadState(hierarchy.types)}
              onConfirm={(item) => hierarchy.selectType(item.id)}
              onLoadMore={noopLoadMore}
              onRetry={hierarchy.retryTypes}
              maxVisibleRows={5}
              waitingForParentLabel="Seleccioná una Familia primero."
              spatialId="resources.type"
            />
          </div>
        </WorkCard>
        <WorkCard
          aria-labelledby="resources-list-title"
          className="lg:col-span-2"
        >
          <div className="mb-3 w-full max-w-md">
            <Field label="Buscar" htmlFor="resources-search">
              <input
                ref={searchInputRef}
                id="resources-search"
                className={fieldInputClass}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar recursos"
                data-spatial-id="resources.search"
              />
            </Field>
          </div>
          <h2 id="resources-list-title" className="sr-only">
            Listado de recursos
          </h2>
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col />
              <col className="w-36" />
              <col className="w-20" />
            </colgroup>
            <thead className="border-b border-border">
              <tr>
                {['Recurso', 'Unidad natural', 'Activo'].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-text-muted"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleResources.map((resource) => (
                <tr
                  key={resource.id}
                  className="focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
                  tabIndex={0}
                  data-resource-row
                  data-spatial-id={`resource.${resource.id}`}
                >
                  <td className="border-b border-border px-2 py-2.5">
                    <ResourcePresentationCell
                      resource={resource}
                      presentation={presentationNames[resource.id]}
                    />
                  </td>
                  <td className="border-b border-border px-2 py-2.5 text-sm">
                    {resource.naturalUnit}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 text-sm">
                    {resource.active ? 'Activo' : 'Inactivo'}
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
          {(isInitialError || isNavigationError) && (
            <div
              className="mt-4 space-y-3 text-sm leading-6 text-text-secondary"
              role="alert"
            >
              <p>
                {isInitialError
                  ? 'No se pudieron cargar los recursos.'
                  : 'No se pudo cargar esta página de recursos.'}
              </p>
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
          <div className="mt-3 flex gap-3">
            <Button
              variant="outline"
              type="button"
              aria-label="Anterior recursos"
              isDisabled={!hasPrevious || isNavigating}
              onPress={previous}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              type="button"
              aria-label="Siguiente recursos"
              isDisabled={!hasNext || isNavigating}
              onPress={next}
            >
              Siguiente
            </Button>
          </div>
        </WorkCard>
      </div>
    </section>
  )
}

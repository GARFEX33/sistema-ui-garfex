import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createResourcesMasterRestApi,
  type ResourcesMasterRestReadApi,
} from './resourcesMaster.api'
import { useResourcesHierarchy } from './useResourcesHierarchy'
import { useResourcesMasterRestWindow } from './useResourcesMasterRestWindow'
import type {
  ResourceCreationEvaluationOwnership,
  ResourceId,
} from './resourcesMaster.types'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { isValidFocusCandidate } from '../../shared/keyboard/focusRestoration'
import { CrearRecursoSurface } from './CrearRecursoSurface'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import {
  HierarchyNavigator,
  type HierarchyNavigatorListState,
} from '../../shared/ui/HierarchyNavigator'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'

const project = (items: readonly { id: ResourceId; name: string }[]) =>
  items.map((item) => ({ id: item.id as string, label: item.name }))

const navigatorState = (state: {
  status: string
  hasNext: boolean
}): HierarchyNavigatorListState => ({
  status:
    state.status === 'loading'
      ? 'initial-loading'
      : state.status === 'error'
        ? 'initial-error'
        : state.status === 'waiting-for-parent'
          ? 'waiting-for-parent'
          : state.status === 'empty'
            ? 'empty'
            : 'ready',
  isExhausted: !state.hasNext,
})

export interface ResourcesMasterScreenProps {
  creationOwnership: ResourceCreationEvaluationOwnership | null
}

export function ResourcesMasterScreen(_: ResourcesMasterScreenProps) {
  const [api] = useState<ResourcesMasterRestReadApi>(() =>
    createResourcesMasterRestApi(),
  )
  const { registerCommand } = useKeyboardController()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')
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
  const criteria = useMemo(
    () => ({
      text: searchText,
      scope: 'ACTIVE' as const,
      ...(selectedClass && { classCode: selectedClass.code }),
      ...(selectedFamily && { familyCode: selectedFamily.code }),
      ...(selectedType && { typeCode: selectedType.code }),
      limit: 20,
    }),
    [searchText, selectedClass, selectedFamily, selectedType],
  )
  const { resources, status, hasPrevious, hasNext, previous, next, retry } =
    useResourcesMasterRestWindow(api, criteria)

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
  const isNavigationError = status === 'navigation-error'
  const isEmpty = status === 'empty'
  const isNavigating = status === 'navigating'

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
        action={<CrearRecursoSurface />}
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
                state: navigatorState(hierarchy.classes),
                onSelect: hierarchy.selectClass,
                onRetry: hierarchy.retryClasses,
                hasPrevious: hierarchy.classes.hasPrevious,
                hasNext: hierarchy.classes.hasNext,
                onPrevious: hierarchy.previousClasses,
                onNext: hierarchy.continueClasses,
                isNavigationPending: hierarchy.classes.status === 'loading',
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
                },
              },
              {
                id: 'families',
                label: 'Familias',
                items: project(hierarchy.families.items),
                selectedId: hierarchy.selection.familyId as string | undefined,
                waitingLabel: 'Seleccioná una Clase.',
                state: navigatorState(hierarchy.families),
                onSelect: hierarchy.selectFamily,
                onRetry: hierarchy.retryFamilies,
                hasPrevious: hierarchy.families.hasPrevious,
                hasNext: hierarchy.families.hasNext,
                onPrevious: hierarchy.previousFamilies,
                onNext: hierarchy.continueFamilies,
                isNavigationPending: hierarchy.families.status === 'loading',
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
                },
              },
              {
                id: 'types',
                label: 'Tipos',
                items: project(hierarchy.types.items),
                selectedId: hierarchy.selection.typeId as string | undefined,
                waitingLabel: 'Seleccioná una Familia.',
                state: navigatorState(hierarchy.types),
                onSelect: hierarchy.selectType,
                onRetry: hierarchy.retryTypes,
                hasPrevious: hierarchy.types.hasPrevious,
                hasNext: hierarchy.types.hasNext,
                onPrevious: hierarchy.previousTypes,
                onNext: hierarchy.continueTypes,
                isNavigationPending: hierarchy.types.status === 'loading',
                spatial: {
                  id: (item) => `resources.type.${item.id}`,
                  column: 'type',
                  metadata: { 'data-spatial-level': 'type' },
                },
                labels: {
                  loading: 'Cargando…',
                  empty: 'No hay tipos activos.',
                  retry: 'Reintentar tipos',
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
                placeholder="Buscar recursos"
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
                {[
                  'Identidad',
                  'Alcance',
                  'Unidad natural',
                  'Activo',
                  'Revisión',
                  'Atributos',
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-text-muted"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
                  tabIndex={0}
                  data-resource-row
                  data-spatial-id={`resource.${resource.id}`}
                >
                  <td className="border-b border-border px-2 py-3">
                    {resource.identityV1}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.scope.classCode} / {resource.scope.familyCode} /{' '}
                    {resource.scope.typeCode}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.naturalUnit}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.active ? 'Activo' : 'Inactivo'}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.revision}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    {resource.attributes.map((attribute) => (
                      <div key={attribute.code}>
                        {attribute.code}: {JSON.stringify(attribute.value)}
                      </div>
                    ))}
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

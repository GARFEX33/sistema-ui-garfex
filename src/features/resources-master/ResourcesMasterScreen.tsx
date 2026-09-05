import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  createResourcesMasterConvexApi,
  type ResourcesMasterApi,
} from './resourcesMaster.api'
import {
  createResourcesMasterListController,
  type ResourceListController,
  type ResourceListState,
} from './useResourcesMasterList'
import type { ResourceSummary } from './resourcesMaster.types'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { isValidFocusCandidate } from '../../shared/keyboard/focusRestoration'
import { CrearRecursoSurface } from './CrearRecursoSurface'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import './resourcesMaster.css'

const PAGE_SIZE = 20

const diagnosticsLabel: Record<
  ResourceSummary['classificationStatus']['state'],
  string
> = {
  EFFECTIVE: 'Efectivo',
  INERT: 'Inerte',
  BROKEN_REFERENCE: 'Referencia rota',
}

type ResourceFilters = { searchText: string }

const emptySubscribe = () => () => undefined

function useResourceListSnapshot(
  controller: ResourceListController<ResourceSummary> | null,
) {
  const snapshotRef = useRef<ResourceListState<ResourceSummary> | null>(
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

export function ResourcesMasterScreen() {
  const [api] = useState<ResourcesMasterApi>(() =>
    createResourcesMasterConvexApi(),
  )
  const { registerCommand } = useKeyboardController()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')
  const [controller] = useState<ResourceListController<ResourceSummary>>(() =>
    createResourcesMasterListController<ResourceSummary>({
      filters: { searchText: '' },
      adapter: {
        load: ({ filters, cursor }) => {
          const current = filters as ResourceFilters
          return current.searchText
            ? api.searchResources({
                lifecycle: 'ACTIVE',
                searchText: current.searchText,
                cursor,
                pageSize: PAGE_SIZE,
              })
            : api.listResources({
                lifecycle: 'ACTIVE',
                cursor,
                pageSize: PAGE_SIZE,
              })
        },
      },
    }),
  )
  const state = useResourceListSnapshot(controller)

  useEffect(() => {
    const trimmed = searchText.trim()
    const id = setTimeout(
      () => {
        controller.setFilters({ searchText: trimmed })
        controller.start()
      },
      trimmed ? 250 : 0,
    )
    return () => clearTimeout(id)
  }, [searchText, controller])

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

  const items = state?.items ?? []
  const status = state?.status ?? 'initial-loading'
  const isLoading = status === 'initial-loading'
  const isInitialError = status === 'initial-error'
  const isPartialError = status === 'partial-error'
  const isEmpty = status === 'empty'
  const showLoadMore =
    !!state &&
    !state.isDone &&
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
        controls={
          <div className="w-full max-w-md">
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
        }
        action={
          <CrearRecursoSurface api={api} onCreated={() => controller.start()} />
        }
      />
      <WorkCard
        className="mt-3"
        aria-labelledby="resources-list-title"
      >
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
              onPress={() => controller.retry()}
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
              onPress={() => controller.retry()}
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
            onPress={() => controller.continue()}
          >
            Cargar más…
          </Button>
        )}
      </WorkCard>
    </section>
  )
}

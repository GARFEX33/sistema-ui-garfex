import { useMemo, useRef, useState } from 'react'
import {
  createProveedoresRestApi,
  type ProveedoresRestApi,
} from './proveedores.api'
import { useProveedoresRestWindow } from './useProveedoresRestWindow'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'

const LIMIT = 20

// Same header + card + list/table structural pattern as ResourcesMasterScreen
// (src/features/resources-master/ResourcesMasterScreen.tsx), simplified to
// Supplier's flat shape: no Clase/Familia/Tipo hierarchy columns, just a
// single search card. T2 scope is list/search only — creating and editing a
// supplier are separate tasks (T3/T4), so there is no action button yet.
export function ProveedoresScreen() {
  const [api] = useState<ProveedoresRestApi>(() => createProveedoresRestApi())
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')

  const criteria = useMemo(
    () => ({
      text: searchText,
      scope: 'ACTIVE' as const,
      limit: LIMIT,
    }),
    [searchText],
  )
  const { suppliers, status, hasPrevious, hasNext, previous, next, retry } =
    useProveedoresRestWindow(api, criteria)

  const isLoading = status === 'initial-loading'
  const isInitialError = status === 'initial-error'
  const isNavigationError = status === 'navigation-error'
  const isNavigating = status === 'navigating'
  const isEmpty = status === 'empty'

  return (
    <section
      className="w-full text-text-primary"
      aria-labelledby="proveedores-title"
    >
      <PageHeader
        title={
          <h1 id="proveedores-title" className="text-lg font-bold">
            Proveedores
          </h1>
        }
      />
      <div className="mt-3">
        <WorkCard aria-labelledby="proveedores-list-title">
          <div className="mb-3 w-full max-w-md">
            <Field label="Buscar" htmlFor="proveedores-search">
              <input
                ref={searchInputRef}
                id="proveedores-search"
                className={fieldInputClass}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar proveedores..."
                data-spatial-id="proveedores.search"
              />
            </Field>
          </div>
          <h2 id="proveedores-list-title" className="sr-only">
            Listado de proveedores
          </h2>
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col />
              <col className="w-56" />
              <col className="w-20" />
            </colgroup>
            <thead className="border-b border-border">
              <tr>
                {['Proveedor', 'Identificador fiscal', 'Activo'].map(
                  (label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-text-muted"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
                  tabIndex={0}
                  data-supplier-row
                  data-spatial-id={`proveedores.${supplier.id}`}
                >
                  <td className="border-b border-border px-2 py-2.5">
                    <span className="block min-w-0 space-y-1">
                      <span className="block break-words text-sm font-bold text-text-primary">
                        {supplier.tradeName}
                      </span>
                      <span className="block text-xs font-medium tracking-wide text-text-secondary">
                        {supplier.legalName}
                      </span>
                    </span>
                  </td>
                  <td className="border-b border-border px-2 py-2.5 text-sm">
                    {supplier.taxIdentifier}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 text-sm">
                    {supplier.active ? 'Activo' : 'Inactivo'}
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
              No hay proveedores para este filtro.
            </p>
          )}
          {(isInitialError || isNavigationError) && (
            <div
              className="mt-4 space-y-3 text-sm leading-6 text-text-secondary"
              role="alert"
            >
              <p>
                {isInitialError
                  ? 'No se pudieron cargar los proveedores.'
                  : 'No se pudo cargar esta página de proveedores.'}
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
              aria-label="Anterior proveedores"
              isDisabled={!hasPrevious || isNavigating}
              onPress={previous}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              type="button"
              aria-label="Siguiente proveedores"
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

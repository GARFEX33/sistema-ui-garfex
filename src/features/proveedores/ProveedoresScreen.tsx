import { useMemo, useRef, useState } from 'react'
import {
  createProveedoresRestApi,
  type ProveedoresRestApi,
} from './proveedores.api'
import { useProveedoresRestWindow } from './useProveedoresRestWindow'
import { CrearProveedorSurface } from './CrearProveedorSurface'
import { EditarProveedorSurface } from './EditarProveedorSurface'
import { ImportarProveedorSurface } from './ImportarProveedorSurface'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import { useAutoClosingMessage } from '../../shared/ui/useAutoClosingMessage'
import type { Supplier } from './proveedores.types'

const supplierName = (supplier: Supplier) =>
  supplier.tradeName || supplier.legalName || supplier.id

const LIMIT = 20

// Same header + card + list/table structural pattern as ResourcesMasterScreen
// (src/features/resources-master/ResourcesMasterScreen.tsx), simplified to
// Supplier's flat shape: no Clase/Familia/Tipo hierarchy columns, just a
// single search card. T3 added the create trigger as the PageHeader action,
// mirroring ResourcesMasterScreen's `action={<CrearRecursoSurface .../>}`
// wiring. T4 adds a per-row EditarProveedorSurface instance in an "Acciones"
// column — each row's supplier is only known at render time, so the edit
// dialog (unlike creation) lives inside the row instead of the header.
export function ProveedoresScreen() {
  const [api] = useState<ProveedoresRestApi>(() => createProveedoresRestApi())
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchText, setSearchText] = useState('')
  const [successMessage, showSuccess] = useAutoClosingMessage()

  const criteria = useMemo(
    () => ({
      text: searchText,
      scope: 'ACTIVE' as const,
      limit: LIMIT,
    }),
    [searchText],
  )
  const {
    suppliers,
    status,
    hasPrevious,
    hasNext,
    previous,
    next,
    retry,
    refetchActive,
  } = useProveedoresRestWindow(api, criteria)

  const onSupplierCreated = (supplier: Supplier) => {
    showSuccess(`Proveedor "${supplierName(supplier)}" creado.`)
    return refetchActive()
  }
  const onSupplierUpdated = (supplier: Supplier) => {
    showSuccess(`Proveedor "${supplierName(supplier)}" actualizado.`)
    return refetchActive()
  }
  const onSupplierImported = (
    supplier: Supplier,
    mode: 'created' | 'updated',
  ) => {
    const verb = mode === 'created' ? 'creado' : 'actualizado'
    showSuccess(`Proveedor "${supplierName(supplier)}" ${verb}.`)
    return refetchActive()
  }

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
        action={
          <div className="flex gap-2">
            <ImportarProveedorSurface
              previewSupplierFromCfdi={api.previewSupplierFromCfdi}
              createSupplier={api.createSupplier}
              updateSupplier={api.updateSupplier}
              onImported={onSupplierImported}
            />
            <CrearProveedorSurface
              createSupplier={api.createSupplier}
              onCreated={onSupplierCreated}
            />
          </div>
        }
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
              <col className="w-24" />
            </colgroup>
            <thead className="border-b border-border">
              <tr>
                {[
                  'Proveedor',
                  'Identificador fiscal',
                  'Activo',
                  'Acciones',
                ].map((label) => (
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
                  <td className="border-b border-border px-2 py-2.5 text-sm">
                    <EditarProveedorSurface
                      supplier={supplier}
                      updateSupplier={api.updateSupplier}
                      onUpdated={onSupplierUpdated}
                    />
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

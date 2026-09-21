import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type {
  EffectiveLinkStatus,
  PurchaseLineWorkbenchRow,
} from './compras.types'
import { PartidaEstadoBadge } from './PartidaEstadoBadge'
import type { PurchaseLineWorkbenchWindowStatus } from './usePurchaseLineWorkbenchRestWindow'

export interface SupplierOption {
  id: string
  label: string
}

export interface PartidasWorkbenchFilters {
  supplierId: string
  dateFrom: string
  dateTo: string
  invoice: string
  supplierSku: string
  description: string
  status: EffectiveLinkStatus | undefined
}

export interface PartidasWorkbenchStageProps {
  filters: PartidasWorkbenchFilters
  supplierOptions: readonly SupplierOption[]
  rows: readonly PurchaseLineWorkbenchRow[]
  status: PurchaseLineWorkbenchWindowStatus
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  onFiltersChange: (filters: PartidasWorkbenchFilters) => void
  onResolve: (row: PurchaseLineWorkbenchRow) => void
  onInspectDocument: (row: PurchaseLineWorkbenchRow) => void
  onRetry: () => void | Promise<unknown>
  onPrevious: () => void
  onNext: () => void
}

const emptyFilters: PartidasWorkbenchFilters = {
  supplierId: '',
  dateFrom: '',
  dateTo: '',
  invoice: '',
  supplierSku: '',
  description: '',
  status: undefined,
}

const statusFilters: readonly {
  label: string
  value: EffectiveLinkStatus | undefined
}[] = [
  { label: 'Todos', value: undefined },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Vinculado', value: 'VINCULADO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
  { label: 'No aplica', value: 'NO_APLICA' },
  { label: 'Conflicto', value: 'CONFLICTO' },
]

const inputClass = `${fieldInputClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`
const cellClass = 'border-b border-border px-3 py-2 align-top text-sm'
const tableHeaderClass = `${cellClass} sticky top-0 z-10 bg-surface-subtle text-xs font-semibold`
const actionColumnClass = `${cellClass} sticky left-0 z-10 border-r border-border bg-surface`
const actionHeaderClass = `${tableHeaderClass} left-0 z-20 border-r border-border`
const interactiveTargetSelector =
  'button, a, input, select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [role="menuitem"]'

function isEmbeddedInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest(interactiveTargetSelector))
  )
}

function documentReference(row: PurchaseLineWorkbenchRow) {
  return [row.series, row.folio].filter(Boolean).join('-') || 'Documento CFDI'
}

function formatIssuedAt(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function resourceCell(row: PurchaseLineWorkbenchRow) {
  const primary = row.resourceDisplayName ?? row.resourceIdentity
  const metadata =
    row.resourceDisplayName && row.resourceIdentity
      ? row.resourceIdentity
      : null

  return (
    <div className="grid min-w-0 gap-1">
      <span
        className="block max-w-56 truncate"
        title={primary ?? 'Sin recurso vinculado'}
      >
        {primary ?? 'Sin recurso vinculado'}
      </span>
      {metadata && (
        <span
          className="block max-w-56 truncate text-xs text-text-secondary"
          title={metadata}
        >
          Identidad: {metadata}
        </span>
      )}
    </div>
  )
}

function Filters({
  filters,
  supplierOptions,
  onFiltersChange,
}: Pick<
  PartidasWorkbenchStageProps,
  'filters' | 'supplierOptions' | 'onFiltersChange'
>) {
  const change = <K extends keyof PartidasWorkbenchFilters>(
    key: K,
    value: PartidasWorkbenchFilters[K],
  ) => onFiltersChange({ ...filters, [key]: value })
  const secondaryFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.supplierSku,
  ].filter((value) => value.trim()).length
  const hasActiveFilter = Object.entries(filters).some(([key, value]) =>
    key === 'status' ? value !== undefined : String(value).trim() !== '',
  )

  return (
    <section
      aria-labelledby="partidas-workbench-filters"
      className="grid flex-none gap-3"
    >
      <h2 id="partidas-workbench-filters" className="text-sm font-bold">
        Filtros de partidas
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Proveedor" htmlFor="partidas-filter-supplier">
          <select
            id="partidas-filter-supplier"
            className={inputClass}
            value={filters.supplierId}
            onChange={(event) => change('supplierId', event.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {supplierOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Factura o referencia" htmlFor="partidas-filter-invoice">
          <input
            id="partidas-filter-invoice"
            className={inputClass}
            type="search"
            value={filters.invoice}
            onChange={(event) => change('invoice', event.target.value)}
          />
        </Field>
        <Field label="Descripción" htmlFor="partidas-filter-description">
          <input
            id="partidas-filter-description"
            className={inputClass}
            value={filters.description}
            onChange={(event) => change('description', event.target.value)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <details className="min-w-0 flex-1">
          <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span aria-hidden="true" className="text-sm leading-none">
              ›
            </span>
            <span>Más filtros</span>
            {secondaryFilterCount > 0 && (
              <span className="text-xs font-normal text-text-secondary">
                {secondaryFilterCount === 1
                  ? '1 filtro secundario activo'
                  : `${secondaryFilterCount} filtros secundarios activos`}
              </span>
            )}
          </summary>
          <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
            <Field label="Fecha desde" htmlFor="partidas-filter-date-from">
              <input
                id="partidas-filter-date-from"
                className={inputClass}
                type="date"
                value={filters.dateFrom}
                onChange={(event) => change('dateFrom', event.target.value)}
              />
            </Field>
            <Field label="Fecha hasta" htmlFor="partidas-filter-date-to">
              <input
                id="partidas-filter-date-to"
                className={inputClass}
                type="date"
                value={filters.dateTo}
                onChange={(event) => change('dateTo', event.target.value)}
              />
            </Field>
            <Field
              label="SKU proveedor XML"
              htmlFor="partidas-filter-supplier-sku"
            >
              <input
                id="partidas-filter-supplier-sku"
                className={inputClass}
                value={filters.supplierSku}
                onChange={(event) => change('supplierSku', event.target.value)}
              />
            </Field>
          </div>
        </details>
        {hasActiveFilter && (
          <Button
            variant="quiet"
            className="text-text-secondary"
            onPress={() => onFiltersChange(emptyFilters)}
          >
            Limpiar filtros
          </Button>
        )}
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-[11px] font-bold tracking-[0.08em] text-text-primary">
          Estado
        </legend>
        <div
          className="flex flex-wrap gap-1"
          aria-label="Filtrar por estado"
          role="group"
        >
          {statusFilters.map(({ label, value }) => {
            const pressed = filters.status === value
            return (
              <Button
                key={label}
                variant="quiet"
                className={
                  pressed ? 'bg-primary-subtle' : 'text-text-secondary'
                }
                aria-pressed={pressed}
                onPress={() => change('status', value)}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}

function WorkbenchTable({
  rows,
  onResolve,
  onInspectDocument,
}: Pick<
  PartidasWorkbenchStageProps,
  'rows' | 'onResolve' | 'onInspectDocument'
>) {
  return (
    <div
      className="min-h-0 flex-1 overflow-auto"
      role="region"
      aria-label="Partidas de compras"
    >
      <table className="min-w-max w-full border-collapse text-left">
        <thead>
          <tr>
            {[
              'Acción',
              'Fecha',
              'Documento',
              'Proveedor',
              'Partida',
              'Cantidad / unidad',
              'Importe',
              'Recurso Maestro',
              'Estado efectivo',
            ].map((header) => (
              <th
                key={header}
                scope="col"
                className={
                  header === 'Acción' ? actionHeaderClass : tableHeaderClass
                }
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const reference = documentReference(row)
            const canResolve =
              row.effectiveStatus === 'PENDIENTE' &&
              row.resolutionOverride === 'NONE'
            const activateResolver = () => onResolve(row)
            const handleRowClick = (
              event: React.MouseEvent<HTMLTableRowElement>,
            ) => {
              if (isEmbeddedInteractiveTarget(event.target)) return
              activateResolver()
            }
            const handleRowKeyDown = (
              event: React.KeyboardEvent<HTMLTableRowElement>,
            ) => {
              if (
                isEmbeddedInteractiveTarget(event.target) ||
                (event.key !== 'Enter' && event.key !== ' ')
              ) {
                return
              }
              event.preventDefault()
              activateResolver()
            }
            const resolveLabel = `Vincular partida ${row.lineNumber} a un Recurso Maestro`

            return (
              <tr
                key={row.lineId}
                aria-label={canResolve ? resolveLabel : undefined}
                className={
                  canResolve
                    ? 'group cursor-pointer transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-accent'
                    : undefined
                }
                onClick={canResolve ? handleRowClick : undefined}
                onKeyDown={canResolve ? handleRowKeyDown : undefined}
                tabIndex={canResolve ? 0 : undefined}
              >
                <td
                  className={
                    canResolve
                      ? `${actionColumnClass} group-hover:bg-surface-subtle group-focus-visible:bg-surface-subtle`
                      : actionColumnClass
                  }
                >
                  {canResolve && (
                    <span title={resolveLabel}>
                      <Button
                        variant="quiet"
                        aria-label={resolveLabel}
                        data-partidas-resolve-id={row.lineId}
                        onPress={activateResolver}
                      >
                        Vincular
                      </Button>
                    </span>
                  )}
                </td>
                <td className={`${cellClass} tabular-nums`}>
                  <time dateTime={row.issuedAt} title={row.issuedAt}>
                    {formatIssuedAt(row.issuedAt)}
                  </time>
                </td>
                <td className={cellClass}>
                  <div className="grid min-w-0 gap-1">
                    <span title={`Inspeccionar documento ${reference}`}>
                      <Button
                        variant="quiet"
                        className="max-w-40 justify-start truncate text-left"
                        aria-label={`Inspeccionar documento ${reference}`}
                        onPress={() => onInspectDocument(row)}
                      >
                        <span className="truncate">{reference}</span>
                      </Button>
                    </span>
                    <span
                      className="block max-w-56 truncate text-xs text-text-secondary"
                      title={row.cfdiUuid}
                    >
                      CFDI UUID: {row.cfdiUuid}
                    </span>
                  </div>
                </td>
                <td className={cellClass}>
                  <span
                    className="block max-w-48 truncate"
                    title={row.supplierDisplayName}
                  >
                    {row.supplierDisplayName}
                  </span>
                </td>
                <td className={cellClass}>
                  <div className="grid min-w-0 gap-1">
                    <span
                      className="block max-w-64 truncate"
                      title={row.description}
                    >
                      {row.description}
                    </span>
                    <span
                      className="block max-w-56 truncate text-xs text-text-secondary"
                      title={row.supplierSku}
                    >
                      XML SKU: {row.supplierSku}
                    </span>
                    <span className="text-xs text-text-secondary">
                      SAT {row.satProductCode}
                    </span>
                  </div>
                </td>
                <td className={`${cellClass} tabular-nums`}>
                  <div className="grid gap-1">
                    <span>
                      {row.quantity} {row.unit}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Unidad: {row.unitCode}
                    </span>
                  </div>
                </td>
                <td className={`${cellClass} tabular-nums`}>
                  <div className="grid gap-1">
                    <span>
                      Total: {row.amount} {row.currency}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Precio unitario: {row.unitPrice}
                    </span>
                  </div>
                </td>
                <td className={cellClass}>{resourceCell(row)}</td>
                <td className={cellClass}>
                  <PartidaEstadoBadge status={row.effectiveStatus} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({
  offset,
  rowCount,
  hasPrevious,
  hasNext,
  navigating,
  onPrevious,
  onNext,
}: Pick<
  PartidasWorkbenchStageProps,
  'offset' | 'hasPrevious' | 'hasNext' | 'onPrevious' | 'onNext'
> & { rowCount: number; navigating: boolean }) {
  const first = rowCount > 0 ? offset + 1 : 0
  const last = offset + rowCount

  return (
    <nav
      aria-label="Paginación de partidas"
      className="flex flex-none flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
    >
      <div className="text-sm text-text-secondary">
        <span>
          Mostrando {first}–{last}
          {hasNext && (
            <>
              <span aria-hidden="true" className="mx-2">
                {' · '}
              </span>
              <span>Más resultados disponibles</span>
            </>
          )}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          variant="quiet"
          onPress={onPrevious}
          isDisabled={!hasPrevious || navigating}
        >
          Anterior
        </Button>
        <Button
          variant="quiet"
          onPress={onNext}
          isDisabled={!hasNext || navigating}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  )
}

export function PartidasWorkbenchStage({
  filters,
  supplierOptions,
  rows,
  status,
  offset,
  hasPrevious,
  hasNext,
  onFiltersChange,
  onResolve,
  onInspectDocument,
  onRetry,
  onPrevious,
  onNext,
}: PartidasWorkbenchStageProps) {
  const showTable =
    status === 'ready' ||
    status === 'navigating' ||
    status === 'navigation-error'
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <header className="flex-none">
        <h1
          id="partidas-workbench-title"
          data-partidas-workbench-heading
          tabIndex={-1}
          className="text-lg font-bold outline-none"
        >
          Partidas
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Seleccioná una partida para vincularla a un Recurso Maestro.
        </p>
      </header>
      <Filters
        filters={filters}
        supplierOptions={supplierOptions}
        onFiltersChange={onFiltersChange}
      />
      {status === 'initial-loading' && (
        <p role="status" className="text-sm text-text-secondary">
          Cargando partidas…
        </p>
      )}
      {status === 'initial-error' && (
        <div role="alert" className="grid gap-3 text-sm text-text-secondary">
          <p>No se pudieron cargar las partidas.</p>
          <Button variant="quiet" onPress={() => void onRetry()}>
            Reintentar partidas
          </Button>
        </div>
      )}
      {status === 'navigation-error' && (
        <div role="alert" className="grid gap-3 text-sm text-text-secondary">
          <p>No se pudo cambiar de página.</p>
          <Button variant="quiet" onPress={() => void onRetry()}>
            Reintentar página
          </Button>
        </div>
      )}
      {status === 'empty' && (
        <p role="status" className="text-sm text-text-secondary">
          No hay partidas para los filtros seleccionados.
        </p>
      )}
      {status === 'navigating' && (
        <p role="status" className="text-sm text-text-secondary">
          Cargando página…
        </p>
      )}
      {showTable && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <WorkbenchTable
            rows={rows}
            onResolve={onResolve}
            onInspectDocument={onInspectDocument}
          />
          <Pagination
            offset={offset}
            rowCount={rows.length}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            navigating={status === 'navigating'}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </div>
      )}
    </div>
  )
}

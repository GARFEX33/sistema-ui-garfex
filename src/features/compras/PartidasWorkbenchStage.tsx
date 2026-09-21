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
  hasPrevious: boolean
  hasNext: boolean
  onFiltersChange: (filters: PartidasWorkbenchFilters) => void
  onResolve: (row: PurchaseLineWorkbenchRow) => void
  onInspectDocument: (row: PurchaseLineWorkbenchRow) => void
  onRetry: () => void | Promise<unknown>
  onPrevious: () => void
  onNext: () => void
}

const statusFilters: readonly {
  label: string
  value: EffectiveLinkStatus | undefined
}[] = [
  { label: 'Todos', value: undefined },
  { label: 'PENDIENTE', value: 'PENDIENTE' },
  { label: 'VINCULADO', value: 'VINCULADO' },
  { label: 'SUSPENDIDO', value: 'SUSPENDIDO' },
  { label: 'NO_APLICA', value: 'NO_APLICA' },
  { label: 'CONFLICTO', value: 'CONFLICTO' },
]

const inputClass = `${fieldInputClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`
const cellClass = 'border-b border-border px-3 py-2 align-top text-sm'

function documentReference(row: PurchaseLineWorkbenchRow) {
  return [row.series, row.folio].filter(Boolean).join('-') || 'Documento CFDI'
}

function resourceCell(row: PurchaseLineWorkbenchRow) {
  const primary = row.resourceDisplayName ?? row.resourceIdentity
  const metadata =
    row.resourceDisplayName && row.resourceIdentity
      ? row.resourceIdentity
      : null

  return (
    <div className="grid gap-1">
      <span>{primary ?? 'Sin recurso vinculado'}</span>
      {metadata && (
        <span className="text-xs text-text-secondary">
          Identidad: <span>{metadata}</span>
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

  return (
    <section
      aria-labelledby="partidas-workbench-filters"
      className="grid gap-3"
    >
      <h2 id="partidas-workbench-filters" className="text-sm font-bold">
        Filtros de partidas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <Field label="Factura" htmlFor="partidas-filter-invoice">
          <input
            id="partidas-filter-invoice"
            className={inputClass}
            type="search"
            value={filters.invoice}
            onChange={(event) => change('invoice', event.target.value)}
          />
        </Field>
        <Field label="SKU proveedor" htmlFor="partidas-filter-supplier-sku">
          <input
            id="partidas-filter-supplier-sku"
            className={inputClass}
            value={filters.supplierSku}
            onChange={(event) => change('supplierSku', event.target.value)}
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
      <fieldset className="grid gap-2">
        <legend className="text-[11px] font-bold tracking-[0.08em] text-text-primary">
          Estado
        </legend>
        <div
          className="flex flex-wrap gap-2"
          aria-label="Filtrar por estado"
          role="group"
        >
          {statusFilters.map(({ label, value }) => {
            const pressed = filters.status === value
            return (
              <Button
                key={label}
                variant={pressed ? 'accent' : 'outline'}
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
      className="overflow-x-auto"
      role="region"
      aria-label="Partidas de compras"
    >
      <table className="min-w-max w-full border-collapse text-left">
        <thead>
          <tr>
            {[
              'Fecha',
              'Documento',
              'Proveedor',
              'Descripción',
              'SKU XML',
              'Cantidad',
              'Unidad',
              'Precio unitario',
              'Importe',
              'Recurso actual',
              'Estado efectivo',
              'Acción',
            ].map((header) => (
              <th key={header} scope="col" className={cellClass}>
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

            return (
              <tr key={row.lineId}>
                <td className={cellClass}>{row.issuedAt}</td>
                <td className={cellClass}>
                  <div className="grid gap-1">
                    <Button
                      variant="outline"
                      aria-label={`Inspeccionar documento ${reference}`}
                      onPress={() => onInspectDocument(row)}
                    >
                      {reference}
                    </Button>
                    <span className="text-xs text-text-secondary">
                      CFDI UUID: {row.cfdiUuid}
                    </span>
                  </div>
                </td>
                <td className={cellClass}>{row.supplierDisplayName}</td>
                <td className={cellClass}>{row.description}</td>
                <td className={cellClass}>{row.supplierSku}</td>
                <td className={cellClass}>{row.quantity}</td>
                <td className={cellClass}>{row.unit}</td>
                <td className={cellClass}>{row.unitPrice}</td>
                <td className={cellClass}>
                  {row.amount} {row.currency}
                </td>
                <td className={cellClass}>{resourceCell(row)}</td>
                <td className={cellClass}>
                  <PartidaEstadoBadge status={row.effectiveStatus} />
                </td>
                <td className={cellClass}>
                  {canResolve && (
                    <Button
                      variant="accent"
                      data-partidas-resolve-id={row.lineId}
                      onPress={() => onResolve(row)}
                    >
                      Vincular
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PartidasWorkbenchStage({
  filters,
  supplierOptions,
  rows,
  status,
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
    <section aria-labelledby="partidas-workbench-title" className="grid gap-5">
      <h1
        id="partidas-workbench-title"
        data-partidas-workbench-heading
        tabIndex={-1}
        className="text-lg font-bold outline-none"
      >
        Partidas de compras
      </h1>
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
          <Button variant="outline" onPress={() => void onRetry()}>
            Reintentar partidas
          </Button>
        </div>
      )}
      {status === 'navigation-error' && (
        <div role="alert" className="grid gap-3 text-sm text-text-secondary">
          <p>No se pudo cambiar de página.</p>
          <Button variant="outline" onPress={() => void onRetry()}>
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
      {showTable && rows.length > 0 && (
        <WorkbenchTable
          rows={rows}
          onResolve={onResolve}
          onInspectDocument={onInspectDocument}
        />
      )}
      <nav aria-label="Paginación de partidas" className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onPress={onPrevious}
          isDisabled={!hasPrevious || status === 'navigating'}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          onPress={onNext}
          isDisabled={!hasNext || status === 'navigating'}
        >
          Siguiente
        </Button>
      </nav>
    </section>
  )
}

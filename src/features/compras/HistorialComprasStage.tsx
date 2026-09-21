import { Button } from '../../shared/ui/Button'
import type { Purchase } from './compras.types'

export type HistorialComprasStageStatus =
  | 'disabled'
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'

export interface HistorialComprasStageProps {
  supplierName: string
  rows: Purchase[]
  status: HistorialComprasStageStatus
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  onRetry: () => void | Promise<unknown>
  onSelectPurchase: (purchase: Purchase) => void
}

const cellClass = 'border-b border-border px-2 py-2.5 text-sm'
const columns = ['Documento', 'Fecha de emisión', 'Moneda', 'Total', 'Acción']
const formatDecimalForDisplay = (value: string) => {
  const [integerPart, fraction] = value.split('.')
  const sign = integerPart.startsWith('-') ? '-' : ''
  const unsigned = sign ? integerPart.slice(1) : integerPart
  return `${sign}${unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction === undefined ? '' : `.${fraction}`}`
}
const documentLabel = (purchase: Purchase) =>
  purchase.series && purchase.folio
    ? `${purchase.series}-${purchase.folio}`
    : purchase.cfdiUuid
const statusMessages: Partial<Record<HistorialComprasStageStatus, string>> = {
  'initial-loading': 'Cargando compras…',
  navigating: 'Cargando otra página…',
  empty: 'No hay compras para este proveedor.',
}

export function HistorialComprasStage({
  supplierName,
  rows,
  status,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onRetry,
  onSelectPurchase,
}: HistorialComprasStageProps) {
  const isNavigating = status === 'navigating'
  const error = status === 'initial-error' || status === 'navigation-error'
  const pager = [
    {
      aria: 'Página anterior',
      label: 'Anterior',
      enabled: hasPrevious,
      action: onPrevious,
    },
    {
      aria: 'Página siguiente',
      label: 'Siguiente',
      enabled: hasNext,
      action: onNext,
    },
  ]

  return (
    <section aria-labelledby="compras-history-title" className="grid gap-3">
      <div>
        <h2 id="compras-history-title" className="text-base font-bold">
          Historial de compras de {supplierName}
        </h2>
      </div>
      {statusMessages[status] && (
        <p role="status" className="text-sm text-text-secondary">
          {statusMessages[status]}
        </p>
      )}
      {error && (
        <div role="alert" className="grid gap-3 text-sm text-text-secondary">
          <p>
            {status === 'initial-error'
              ? 'No se pudieron cargar las compras.'
              : 'No se pudo cargar esta página de compras.'}
          </p>
          <Button
            variant="outline"
            type="button"
            aria-label="Reintentar compras"
            onPress={() => void onRetry()}
          >
            Reintentar
          </Button>
        </div>
      )}
      {rows.length > 0 && (
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="border-b border-border">
            <tr>
              {columns.map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((purchase) => {
              const label = documentLabel(purchase)
              return (
                <tr key={purchase.id}>
                  <td className={`${cellClass} font-bold`}>{label}</td>
                  <td className={cellClass}>
                    {purchase.issuedAt.slice(0, 10)}
                  </td>
                  <td className={cellClass}>{purchase.currency}</td>
                  <td className={cellClass}>
                    {formatDecimalForDisplay(purchase.total)}
                  </td>
                  <td className={cellClass}>
                    <Button
                      variant="outline"
                      type="button"
                      aria-label={`Seleccionar compra ${label}`}
                      isDisabled={isNavigating}
                      onPress={() => onSelectPurchase(purchase)}
                    >
                      Seleccionar
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <div className="flex gap-3">
        {pager.map(({ aria, label, enabled, action }) => (
          <Button
            key={aria}
            variant="outline"
            type="button"
            aria-label={aria}
            isDisabled={!enabled || isNavigating}
            onPress={action}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  )
}

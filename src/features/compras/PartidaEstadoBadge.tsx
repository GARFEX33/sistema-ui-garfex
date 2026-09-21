import type { LinkStatus } from './compras.types'

export interface PartidaEstadoBadgeProps {
  status: LinkStatus
}

const presentation: Record<LinkStatus, { label: string; className: string }> = {
  PENDIENTE: {
    label: 'Pendiente',
    className: 'bg-warning-subtle text-warning border-warning',
  },
  VINCULADO: {
    label: 'Vinculado',
    className: 'bg-success-subtle text-success border-success',
  },
  NO_APLICA: {
    label: 'No aplica',
    className: 'bg-surface-subtle text-text-secondary border-border',
  },
  CONFLICTO: {
    label: 'Conflicto',
    className: 'bg-primary-subtle text-primary border-primary',
  },
}

export function PartidaEstadoBadge({ status }: PartidaEstadoBadgeProps) {
  const { label, className } = presentation[status]

  return (
    <span
      role="status"
      aria-label={`Estado: ${label}`}
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold leading-5 ${className}`}
    >
      {label}
    </span>
  )
}

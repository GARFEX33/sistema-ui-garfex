import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  context?: ReactNode
  controls?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * Neutral page-level header chrome with a title, one contextual middle region,
 * and an optional action. Screens own the meaning and contents of each region.
 */
export function PageHeader({
  title,
  context,
  controls,
  action,
  className,
}: PageHeaderProps) {
  const center = context ?? controls

  return (
    <header
      className={[
        'grid grid-cols-1 items-end gap-4 rounded-lg border border-border bg-surface px-4 py-3 md:grid-cols-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0 md:justify-self-start">{title}</div>
      <div className="flex w-full justify-center md:justify-self-center">
        {center}
      </div>
      <div className="md:justify-self-end">{action}</div>
    </header>
  )
}

import type { ComponentPropsWithoutRef } from 'react'

export type WorkCardDensity = 'compact' | 'comfortable'

export interface WorkCardProps
  extends Omit<ComponentPropsWithoutRef<'section'>, 'className'> {
  density?: WorkCardDensity
  className?: string
}

const densityClasses: Record<WorkCardDensity, string> = {
  compact: 'p-4',
  comfortable: 'p-5',
}

/**
 * Neutral labeled work surface. Pass an accessible name or labelled-by target
 * from the feature and keep domain structure and sizing local.
 */
export function WorkCard({
  density = 'comfortable',
  className,
  ...props
}: WorkCardProps) {
  return (
    <section
      className={[
        'rounded-lg border border-border bg-surface',
        densityClasses[density],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

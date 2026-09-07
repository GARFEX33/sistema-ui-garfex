import type { ReactNode } from 'react'
import { DialogActions } from '../../shared/ui/Dialog'

type CreationCommandBarProps = {
  stage: 'context' | 'contract-pending'
  children: ReactNode
}

const commandCopy = {
  context: 'Esc Cerrar',
  'contract-pending': 'Esc Volver',
} as const

export function CreationCommandBar({
  stage,
  children,
}: CreationCommandBarProps) {
  return (
    <DialogActions>
      <section
        aria-label="Comandos disponibles"
        className="flex w-full items-center justify-between gap-3"
        role="region"
      >
        <p className="m-0 text-sm text-text-secondary">
          <kbd className="font-semibold text-text-primary">
            {commandCopy[stage]}
          </kbd>
        </p>
        <div className="flex items-center gap-3">{children}</div>
      </section>
    </DialogActions>
  )
}

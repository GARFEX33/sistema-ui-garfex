import type { ReactNode } from 'react'
import { DialogActions } from '../../shared/ui/Dialog'
import type { CreationRailStage } from './CreationStageRail'

type CreationCommandBarProps = {
  stage: CreationRailStage
  children: ReactNode
}

const commandCopy: Record<CreationRailStage, string> = {
  class: '↑/↓ mover · Enter seleccionar · Esc cerrar',
  family: '↑/↓ mover · Enter seleccionar · Esc volver',
  type: '↑/↓ mover · Enter seleccionar · Esc volver',
  unit: '↑/↓ mover · Enter seleccionar · Esc volver',
  attributes: '↑/↓ mover · Enter seleccionar · Esc volver',
  'review-pending': 'Enter crear recurso · Esc volver',
  'contract-pending': 'Esc volver',
}

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

import { Button } from '../../shared/ui/Button'

export type CreationRailStage =
  | 'class'
  | 'family'
  | 'type'
  | 'unit'
  | 'attributes'
  | 'review-pending'
  | 'contract-pending'

type CreationStageRailProps = {
  currentStage: CreationRailStage
  attributeProgress?: Readonly<{
    current: number
    total: number
  }>
  selections: Readonly<{
    className: string
    familyName: string
    typeName: string
    unitName: string
  }>
  onNavigate: (stage: 'class' | 'family' | 'type' | 'unit') => void
}

const stages = [
  ['class', 'Clase', 'className'],
  ['family', 'Familia', 'familyName'],
  ['type', 'Tipo', 'typeName'],
  ['unit', 'Unidad', 'unitName'],
] as const

export function CreationStageRail({
  currentStage,
  attributeProgress,
  selections,
  onNavigate,
}: CreationStageRailProps) {
  return (
    <ol
      aria-label="Etapas de creación"
      className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3"
    >
      {stages.map(([stage, label, selectionKey]) => {
        const value = selections[selectionKey]
        const isCurrent = currentStage === stage

        return (
          <li key={stage}>
            {value ? (
              <Button
                aria-current={isCurrent ? 'step' : undefined}
                className="px-3 text-left text-sm hover:bg-surface-subtle active:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-focus"
                style={{ minHeight: 44 }}
                onPress={() => onNavigate(stage)}
                type="button"
                variant="outline"
              >
                <span aria-hidden="true">{isCurrent ? '●' : '✓'}</span>
                {label}: {value}
              </Button>
            ) : (
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-text-secondary"
              >
                <span aria-hidden="true">{isCurrent ? '●' : '○'}</span>
                {label} · pendiente
              </span>
            )}
          </li>
        )
      })}
      {currentStage === 'attributes' && (
        <li>
          <span
            aria-current="step"
            className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-text-secondary"
          >
            <span aria-hidden="true">●</span>
            {attributeProgress
              ? `Atributos · ${attributeProgress.current} de ${attributeProgress.total}`
              : 'Atributos · pendiente'}
          </span>
        </li>
      )}
      {currentStage === 'review-pending' && (
        <li>
          <span
            aria-current="step"
            className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-text-secondary"
          >
            <span aria-hidden="true">●</span>
            Revisión · pendiente
          </span>
        </li>
      )}
      {currentStage === 'contract-pending' && (
        <li>
          <span
            aria-current="step"
            className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-text-secondary"
          >
            <span aria-hidden="true">●</span>
            Contrato backend pendiente
          </span>
        </li>
      )}
    </ol>
  )
}

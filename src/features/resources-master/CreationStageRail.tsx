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

// Compact CLI-style checklist row: an aria-hidden glyph, then two direct text
// nodes for label and value/status so both the accessible name (which
// excludes the aria-hidden glyph) and plain-text assertions stay legible,
// without any button chrome or border.
const rowClass =
  'grid w-full grid-cols-[1rem_5.5rem_1fr] items-baseline gap-2 rounded px-1 py-0.5 text-left'

export function CreationStageRail({
  currentStage,
  attributeProgress,
  selections,
  onNavigate,
}: CreationStageRailProps) {
  return (
    <ol
      aria-label="Etapas de creación"
      className="mb-4 grid gap-0.5 border-b border-border pb-3 font-mono text-sm"
    >
      {stages.map(([stage, label, selectionKey]) => {
        const value = selections[selectionKey]
        const isCurrent = currentStage === stage

        return (
          <li key={stage}>
            {value ? (
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onNavigate(stage)}
                className={`${rowClass} cursor-pointer text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus`}
              >
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                <span>{label}</span>
                <span className="truncate text-text-primary">{value}</span>
              </button>
            ) : (
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={`${rowClass} text-text-secondary`}
              >
                <span aria-hidden="true">{isCurrent ? '›' : '·'}</span>
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
            className={`${rowClass} text-text-secondary`}
          >
            <span aria-hidden="true">›</span>
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
            className={`${rowClass} text-text-secondary`}
          >
            <span aria-hidden="true">›</span>
            Revisión · pendiente
          </span>
        </li>
      )}
      {currentStage === 'contract-pending' && (
        <li>
          <span
            aria-current="step"
            className={`${rowClass} text-text-secondary`}
          >
            <span aria-hidden="true">›</span>
            Contrato backend pendiente
          </span>
        </li>
      )}
    </ol>
  )
}

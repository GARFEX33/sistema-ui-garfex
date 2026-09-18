import { useEffect, useRef, useState } from 'react'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import {
  decimalPattern,
  integerPattern,
} from './resourceCreation.attributesFormProjection'
import {
  decideAttributeConfirm,
  formatConfirmedAttributeValue,
  renderableSequencerAttributes,
} from './resourceCreationAttributeSequencer.model'
import {
  StagedSearchSelector,
  type SelectorLoadState,
} from './StagedSearchSelector'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'

export interface ResourceCreationAttributeSequencerProps {
  attributes: readonly EffectiveAttribute[]
  values: Record<string, unknown>
  onChange: (code: string, value: unknown) => void
  onComplete: () => void
}

const requiredLabel = (attribute: EffectiveAttribute) =>
  attribute.effectiveMode === 'REQUIRED'
    ? `${attribute.characteristic.name} *`
    : attribute.characteristic.name

const booleanItems = [
  { code: 'true', label: 'Sí' },
  { code: 'false', label: 'No' },
] as const

const readySelectorState: SelectorLoadState = {
  status: 'ready',
  exhausted: true,
}

function QuantityBlocked({ attribute }: { attribute: EffectiveAttribute }) {
  const headingId = `resource-attribute-${attribute.characteristic.code}-heading`
  return (
    <section aria-labelledby={headingId} className="grid gap-1">
      <h3
        id={headingId}
        className="m-0 text-[11px] font-bold tracking-[0.08em] text-text-primary"
      >
        {requiredLabel(attribute)}
      </h3>
      <p className="text-text-secondary" role="status">
        Captura no disponible todavía: falta la unidad de medida (unitCode) en
        el contrato de este atributo.
      </p>
    </section>
  )
}

function CliChoiceField({
  attribute,
  onConfirm,
}: {
  attribute: EffectiveAttribute
  onConfirm: (value: unknown) => void
}) {
  const isBoolean = attribute.characteristic.valueType === 'BOOLEAN'
  const items = isBoolean ? booleanItems : attribute.options
  return (
    <StagedSearchSelector
      autoFocus
      label={requiredLabel(attribute)}
      items={items}
      itemKey={(item) => item.code}
      itemName={(item) => item.label}
      loadState={readySelectorState}
      onConfirm={(item) =>
        onConfirm(isBoolean ? item.code === 'true' : item.code)
      }
      onLoadMore={() => undefined}
      onRetry={() => undefined}
    />
  )
}

function CliTextField({
  attribute,
  initialValue,
  onConfirm,
  onSkip,
}: {
  attribute: EffectiveAttribute
  initialValue: unknown
  onConfirm: (value: unknown) => void
  onSkip: () => void
}) {
  const [text, setText] = useState(
    typeof initialValue === 'string' ? initialValue : '',
  )
  const valueType = attribute.characteristic.valueType
  const pattern =
    valueType === 'INTEGER'
      ? integerPattern
      : valueType === 'DECIMAL'
        ? decimalPattern
        : null
  const invalid = text.length > 0 && pattern !== null && !pattern.test(text)
  const id = `resource-attribute-${attribute.characteristic.code}`
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className="text-[11px] font-bold tracking-[0.08em] text-text-primary"
      >
        {requiredLabel(attribute)}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode={
          valueType === 'INTEGER'
            ? 'numeric'
            : valueType === 'DECIMAL'
              ? 'decimal'
              : undefined
        }
        className={fieldInputClass}
        aria-invalid={invalid}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
          event.preventDefault()
          const decision = decideAttributeConfirm(attribute, text)
          if (decision.kind === 'confirm') onConfirm(text)
          else if (decision.kind === 'skip') onSkip()
        }}
      />
      {invalid && (
        <p className="text-[12px] text-text-secondary" role="alert">
          Formato inválido.
        </p>
      )}
    </div>
  )
}

export function ResourceCreationAttributeSequencer({
  attributes,
  values,
  onChange,
  onComplete,
}: ResourceCreationAttributeSequencerProps) {
  const rendered = renderableSequencerAttributes(attributes)
  // Tracked by attribute code, not position: a confirmed value can trigger a
  // Core re-evaluation (POST /evaluate) that removes a now-inapplicable
  // sibling from `rendered` between renders (e.g. confirming a diameter in
  // inches makes its millimeter equivalent notApplicable). An index into a
  // list that can reshuffle/shrink would drift; "first attribute whose code
  // isn't decided yet" stays correct regardless.
  const [decidedCodes, setDecidedCodes] = useState<readonly string[]>([])
  const confirmedAttributes = rendered.filter((attribute) =>
    decidedCodes.includes(attribute.characteristic.code),
  )
  const pending = rendered.filter(
    (attribute) => !decidedCodes.includes(attribute.characteristic.code),
  )
  const current = pending[0]
  const done = current === undefined

  useEffect(() => {
    if (done) onComplete()
  }, [done, onComplete])

  const confirmCurrent = (value: unknown) => {
    if (!current) return
    onChange(current.characteristic.code, value)
    setDecidedCodes((codes) => [...codes, current.characteristic.code])
  }
  const skipCurrent = () => {
    if (!current) return
    setDecidedCodes((codes) => [...codes, current.characteristic.code])
  }

  return (
    <div
      className="grid gap-4"
      onKeyDown={(event) => {
        if (event.defaultPrevented || event.nativeEvent.isComposing) return
        if (event.key !== 'Escape' || decidedCodes.length === 0) return
        // A previous attribute exists within this sequence: Escape steps
        // back to it instead of leaving the Attributes stage entirely (that
        // fallback — Escape on the first attribute — is handled by
        // CrearRecursoSurface's own wizard-level Escape/BACK handler, which
        // this only reaches when the condition above lets the event bubble).
        event.preventDefault()
        event.stopPropagation()
        setDecidedCodes((codes) => codes.slice(0, -1))
      }}
    >
      <h2 className="m-0 text-sm font-bold text-text-primary">Atributos</h2>
      {confirmedAttributes.length > 0 && (
        <ol className="grid gap-0.5 font-mono text-sm">
          {confirmedAttributes.map((attribute) => (
            <li
              key={attribute.characteristic.code}
              className="grid grid-cols-[1rem_1fr] items-baseline gap-2 text-text-secondary"
            >
              <span aria-hidden="true" className="text-success">
                ✓
              </span>
              <span>
                {attribute.characteristic.name}{' '}
                <span className="text-text-primary">
                  {formatConfirmedAttributeValue(
                    attribute,
                    values[attribute.characteristic.code],
                  )}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {current &&
        (current.characteristic.valueType === 'QUANTITY' ? (
          <QuantityBlocked attribute={current} />
        ) : current.characteristic.valueType === 'CONTROLLED_OPTION' ||
          current.characteristic.valueType === 'BOOLEAN' ? (
          <CliChoiceField
            key={current.characteristic.code}
            attribute={current}
            onConfirm={confirmCurrent}
          />
        ) : (
          <CliTextField
            key={current.characteristic.code}
            attribute={current}
            initialValue={values[current.characteristic.code]}
            onConfirm={confirmCurrent}
            onSkip={skipCurrent}
          />
        ))}
    </div>
  )
}

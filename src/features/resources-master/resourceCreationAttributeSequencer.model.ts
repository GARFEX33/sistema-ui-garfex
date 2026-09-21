import { projectField } from './resourceCreation.attributesFormProjection'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'

export const renderableSequencerAttributes = (
  attributes: readonly EffectiveAttribute[],
): readonly EffectiveAttribute[] =>
  attributes.filter(
    (attribute) =>
      attribute.effectiveMode !== 'FORBIDDEN' && !attribute.notApplicable,
  )

export const formatConfirmedAttributeValue = (
  attribute: EffectiveAttribute,
  value: unknown,
): string => {
  if (attribute.characteristic.valueType === 'BOOLEAN')
    return value === true ? 'Sí' : 'No'
  if (attribute.characteristic.valueType === 'CONTROLLED_OPTION') {
    const option = attribute.options.find(
      (candidate) => candidate.code === value,
    )
    return option?.label ?? String(value ?? '')
  }
  return String(value ?? '')
}

export type AttributeConfirmDecision =
  | { kind: 'confirm'; value: CatalogValue }
  | { kind: 'skip' }
  | { kind: 'blocked' }

// Single source of truth for what Enter does on a free-text attribute field:
// reuses projectField's exact validity rules instead of a second copy, so a
// present valid value confirms and advances, an empty OPTIONAL value skips
// without blocking, and anything invalid or an empty REQUIRED value blocks.
export const decideAttributeConfirm = (
  attribute: EffectiveAttribute,
  raw: unknown,
): AttributeConfirmDecision => {
  const projection = projectField(attribute, raw)
  if (projection.kind === 'present')
    return { kind: 'confirm', value: projection.value }
  if (projection.kind === 'invalid') return { kind: 'blocked' }
  return attribute.effectiveMode === 'REQUIRED'
    ? { kind: 'blocked' }
    : { kind: 'skip' }
}

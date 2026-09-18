import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import type { ResourceAttribute } from './resourcesMaster.types'

export const integerPattern = /^(?:0|-?[1-9][0-9]*)$/
export const decimalPattern =
  /^(?:0|-?(?:[1-9][0-9]*|(?:0|[1-9][0-9]*)\.[0-9]*[1-9]))$/

export type FieldProjection =
  | { kind: 'present'; value: CatalogValue }
  | { kind: 'empty' }
  | { kind: 'invalid' }

export function projectField(
  attribute: EffectiveAttribute,
  raw: unknown,
): FieldProjection {
  switch (attribute.characteristic.valueType) {
    case 'CONTROLLED_OPTION': {
      if (typeof raw !== 'string' || raw.length === 0) return { kind: 'empty' }
      if (!attribute.options.some((option) => option.code === raw))
        return { kind: 'invalid' }
      return {
        kind: 'present',
        value: { kind: 'CONTROLLED_OPTION', value: raw },
      }
    }
    case 'CONTROLLED_TEXT': {
      if (typeof raw !== 'string' || raw.length === 0) return { kind: 'empty' }
      return { kind: 'present', value: { kind: 'TEXT', value: raw } }
    }
    case 'BOOLEAN': {
      if (typeof raw !== 'boolean') return { kind: 'empty' }
      return { kind: 'present', value: { kind: 'BOOLEAN', value: raw } }
    }
    case 'INTEGER': {
      if (typeof raw !== 'string' || raw.length === 0) return { kind: 'empty' }
      if (!integerPattern.test(raw)) return { kind: 'invalid' }
      return { kind: 'present', value: { kind: 'INTEGER', value: raw } }
    }
    case 'DECIMAL': {
      if (typeof raw !== 'string' || raw.length === 0) return { kind: 'empty' }
      if (!decimalPattern.test(raw)) return { kind: 'invalid' }
      return { kind: 'present', value: { kind: 'DECIMAL', value: raw } }
    }
    case 'QUANTITY':
      // No confirmed unitCode source exists for QUANTITY attributes (not
      // `dimension`, not the unrelated Resource-level Unidad-natural list) —
      // this attribute renders as a blocked state and never collects or
      // contributes a raw value.
      return { kind: 'empty' }
  }
}

// Lenient counterpart to projectResourceAttributes: used to build the
// in-progress draft sent to POST /evaluate, so it never fails closed on a
// still-missing REQUIRED attribute (that's expected mid-sequence) — it only
// includes whatever already has a present, valid value.
export function projectConfirmedAttributes(
  attributes: readonly EffectiveAttribute[],
  values: Record<string, unknown>,
): ResourceAttribute[] {
  const result: ResourceAttribute[] = []
  for (const attribute of attributes) {
    const projection = projectField(
      attribute,
      values[attribute.characteristic.code],
    )
    if (projection.kind === 'present')
      result.push({
        code: attribute.characteristic.code,
        value: projection.value,
      })
  }
  return result
}

export function projectResourceAttributes(
  attributes: readonly EffectiveAttribute[],
  values: Record<string, unknown>,
): ResourceAttribute[] | null {
  const result: ResourceAttribute[] = []
  for (const attribute of attributes) {
    if (attribute.effectiveMode === 'FORBIDDEN' || attribute.notApplicable)
      continue
    const projection = projectField(
      attribute,
      values[attribute.characteristic.code],
    )
    if (projection.kind === 'invalid') return null
    if (projection.kind === 'empty') {
      if (attribute.effectiveMode === 'REQUIRED') return null
      continue
    }
    result.push({
      code: attribute.characteristic.code,
      value: projection.value,
    })
  }
  return result
}

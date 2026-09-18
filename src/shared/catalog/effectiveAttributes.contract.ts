import { ApplicabilityRuleSchema } from './catalogRest.contract'
import type { CatalogRecord } from './catalogRest.contract'

export type EffectiveCharacteristicValueType =
  | 'CONTROLLED_OPTION'
  | 'CONTROLLED_TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'QUANTITY'
  | 'BOOLEAN'

export type EffectiveAttributeMode =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'CONDITIONAL'
  | 'FORBIDDEN'

export interface EffectiveAttributesRequest {
  classCode: string
  familyCode: string
  typeCode: string
  signal?: AbortSignal
}

export interface EffectiveCharacteristicDescriptor {
  code: string
  name: string
  valueType: EffectiveCharacteristicValueType
  dimension?: string
}

export interface EffectiveAttributeSource {
  level: 'FAMILY' | 'TYPE'
  code: string
}

export interface EffectiveAttributeOption {
  readonly code: string
  readonly label: string
}

export interface EffectiveAttribute {
  characteristic: EffectiveCharacteristicDescriptor
  effectiveMode: EffectiveAttributeMode
  identityParticipates: boolean
  notApplicable: boolean
  position: number
  hasPosition: boolean
  optionSetCode?: string
  readonly options: readonly EffectiveAttributeOption[]
  source: EffectiveAttributeSource
  rules: CatalogRecord['rules']
}

export interface EffectiveAttributesResponse {
  typeCode: string
  attributes: EffectiveAttribute[]
}

const effectiveModes = new Set([
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
  'FORBIDDEN',
])
const characteristicValueTypes = new Set([
  'CONTROLLED_OPTION',
  'CONTROLLED_TEXT',
  'INTEGER',
  'DECIMAL',
  'QUANTITY',
  'BOOLEAN',
])
const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key)
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): value is Record<string, unknown> =>
  record(value) &&
  required.every((key) => hasOwn(value, key)) &&
  Object.keys(value).every(
    (key) => required.includes(key) || optional.includes(key),
  )

export const validEffectiveAttributesRequest = (
  input: EffectiveAttributesRequest,
) =>
  typeof input.classCode === 'string' &&
  input.classCode.length > 0 &&
  typeof input.familyCode === 'string' &&
  input.familyCode.length > 0 &&
  typeof input.typeCode === 'string' &&
  input.typeCode.length > 0

const option = (value: unknown) =>
  exact(value, ['code', 'label']) &&
  typeof value.code === 'string' &&
  typeof value.label === 'string'

const attribute = (value: unknown): EffectiveAttribute | undefined => {
  if (
    !exact(
      value,
      [
        'characteristic',
        'effectiveMode',
        'identityParticipates',
        'notApplicable',
        'position',
        'hasPosition',
        'options',
        'source',
        'rules',
      ],
      ['optionSetCode'],
    ) ||
    !exact(
      value.characteristic,
      ['code', 'name', 'valueType'],
      ['dimension'],
    ) ||
    typeof value.characteristic.code !== 'string' ||
    value.characteristic.code.length === 0 ||
    typeof value.characteristic.name !== 'string' ||
    value.characteristic.name.length === 0 ||
    typeof value.characteristic.valueType !== 'string' ||
    !characteristicValueTypes.has(value.characteristic.valueType) ||
    (hasOwn(value.characteristic, 'dimension') &&
      typeof value.characteristic.dimension !== 'string') ||
    typeof value.effectiveMode !== 'string' ||
    !effectiveModes.has(value.effectiveMode) ||
    typeof value.identityParticipates !== 'boolean' ||
    typeof value.notApplicable !== 'boolean' ||
    !Number.isInteger(value.position) ||
    typeof value.hasPosition !== 'boolean' ||
    (hasOwn(value, 'optionSetCode') &&
      (typeof value.optionSetCode !== 'string' ||
        value.optionSetCode.length === 0)) ||
    !Array.isArray(value.options) ||
    !value.options.every(option) ||
    !exact(value.source, ['level', 'code']) ||
    (value.source.level !== 'FAMILY' && value.source.level !== 'TYPE') ||
    typeof value.source.code !== 'string' ||
    value.source.code.length === 0 ||
    !Array.isArray(value.rules) ||
    !value.rules.every(
      (rule) => ApplicabilityRuleSchema.safeParse(rule).success,
    )
  )
    return undefined
  return value as unknown as EffectiveAttribute
}

const bad = (): never => {
  throw new Error('Invalid catalog type effective attributes response')
}

export const parseEffectiveAttributesResponse = (
  value: unknown,
  input: EffectiveAttributesRequest,
): EffectiveAttributesResponse => {
  if (
    !validEffectiveAttributesRequest(input) ||
    !exact(value, ['typeCode', 'attributes'])
  )
    return bad()
  if (
    typeof value.typeCode !== 'string' ||
    value.typeCode !== input.typeCode ||
    !Array.isArray(value.attributes)
  )
    return bad()
  const attributes: EffectiveAttribute[] = []
  for (const attributeValue of value.attributes) {
    const parsed = attribute(attributeValue)
    if (parsed === undefined) return bad()
    attributes.push(parsed)
  }
  return { typeCode: value.typeCode, attributes }
}

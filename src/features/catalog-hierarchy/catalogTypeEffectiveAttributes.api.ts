import {
  ApplicabilityRuleSchema,
  ErrorEnvelopeSchema,
} from '../../shared/catalog/catalogRest.contract'
import type {
  CatalogTypeEffectiveAttributesApi,
  EffectiveAttribute,
  EffectiveAttributesRequest,
  EffectiveAttributesResponse,
} from './catalogTypeEffectiveAttributes.types'

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

const validRequest = (input: EffectiveAttributesRequest) =>
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
  if (!validRequest(input) || !exact(value, ['typeCode', 'attributes']))
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

export function createCatalogTypeEffectiveAttributesApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
): CatalogTypeEffectiveAttributesApi {
  return {
    async getEffectiveAttributes(input) {
      if (!validRequest(input)) return bad()
      const query = new URLSearchParams({
        classCode: input.classCode,
        familyCode: input.familyCode,
      })
      const response = await fetch(
        '/v1/types/' +
          encodeURIComponent(input.typeCode) +
          '/attributes/effective?' +
          query,
        { signal: input.signal },
      )
      const body: unknown = await response.json()
      if (!response.ok) {
        const error = ErrorEnvelopeSchema.safeParse(body)
        throw new Error(
          error.success ? error.data.error : 'HTTP ' + response.status,
        )
      }
      return parseEffectiveAttributesResponse(body, input)
    },
  }
}

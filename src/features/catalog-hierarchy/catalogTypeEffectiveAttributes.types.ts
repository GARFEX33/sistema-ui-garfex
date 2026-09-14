import type { CatalogRecord } from '../../shared/catalog/catalogRest.contract'

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

export interface CatalogTypeEffectiveAttributesApi {
  getEffectiveAttributes: (
    input: EffectiveAttributesRequest,
  ) => Promise<EffectiveAttributesResponse>
}

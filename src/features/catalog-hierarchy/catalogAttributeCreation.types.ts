import type { CatalogRecord } from '../../shared/catalog/catalogRest.contract'

export interface CatalogAttributeCreationContext {
  classCode: string
  familyCode: string
  typeCode: string
  signal?: AbortSignal
}

export interface CatalogAttributeCreationReference<Kind extends string> {
  kind: 'REFERENCE'
  reference: { kind: Kind; id: string; code: string }
}

export interface CatalogAttributeCreationReferences {
  class: CatalogAttributeCreationReference<'CLASE'>
  family: CatalogAttributeCreationReference<'FAMILIA'>
  type: CatalogAttributeCreationReference<'TIPO'>
}

export type CatalogCharacteristicValueType =
  | 'CONTROLLED_OPTION'
  | 'INTEGER'
  | 'DECIMAL'
  | 'QUANTITY'
  | 'BOOLEAN'
  | 'CONTROLLED_TEXT'

export interface CatalogCharacteristicCreateInput {
  code: string
  name: string
  valueType: CatalogCharacteristicValueType
}

export interface CatalogCharacteristicRecord {
  kind: 'CARACTERISTICA'
  id: string
  revision: string
  active: boolean
  code: string
  name: string
  valueType: CatalogCharacteristicValueType
  rules: CatalogRecord['rules']
}

export interface CatalogCharacteristicSearchInput {
  scope: 'ACTIVE'
  text: string
  limit: number
  offset: number
  signal?: AbortSignal
}

export interface CatalogCharacteristicSearchPage {
  records: readonly CatalogCharacteristicRecord[]
  hasPrevious: boolean
  hasNext: boolean
}

export type CatalogApplicabilityMode = 'REQUIRED' | 'OPTIONAL' | 'FORBIDDEN'

interface CatalogApplicabilityReferences {
  class: CatalogAttributeCreationReference<'CLASE'>
  family: CatalogAttributeCreationReference<'FAMILIA'>
  type: CatalogAttributeCreationReference<'TIPO'>
  characteristic: CatalogAttributeCreationReference<'CARACTERISTICA'>
}

export interface CatalogApplicabilityCreateInput
  extends CatalogApplicabilityReferences {
  characteristicValueType: CatalogCharacteristicValueType
  mode: CatalogApplicabilityMode
  optionSet?: CatalogAttributeCreationReference<'CONJUNTO_OPCIONES'>
  identityParticipates: boolean
  rules: []
}

export interface CatalogApplicabilityRecord
  extends Omit<CatalogApplicabilityCreateInput, 'characteristicValueType'> {
  kind: 'APLICABILIDAD'
  id: string
  revision: string
  active: boolean
}

export interface CatalogPresentationCreateInput
  extends CatalogApplicabilityReferences {
  position: string
}

export interface CatalogPresentationRecord
  extends CatalogPresentationCreateInput {
  kind: 'PRESENTACION'
  id: string
  revision: string
  active: boolean
  rules: []
}

export interface CatalogAttributeCreationApi {
  resolveHierarchyReferences: (
    input: CatalogAttributeCreationContext,
  ) => Promise<CatalogAttributeCreationReferences>
  searchCharacteristics: (
    input: CatalogCharacteristicSearchInput,
  ) => Promise<CatalogCharacteristicSearchPage>
  createCharacteristic: (
    input: CatalogCharacteristicCreateInput,
  ) => Promise<CatalogCharacteristicRecord>
  createApplicability: (
    input: CatalogApplicabilityCreateInput,
  ) => Promise<CatalogApplicabilityRecord>
  createPresentation: (
    input: CatalogPresentationCreateInput,
  ) => Promise<CatalogPresentationRecord>
}

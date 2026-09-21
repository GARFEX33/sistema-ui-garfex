import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'

export type DirectApplicabilityMode =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'CONDITIONAL'
  | 'FORBIDDEN'

export interface DirectApplicabilityRequest {
  classCode: string
  familyCode: string
  typeCode: string
  offset: number
  limit: number
  signal?: AbortSignal
}

type ReferenceKind =
  | 'CLASE'
  | 'FAMILIA'
  | 'TIPO'
  | 'CARACTERISTICA'
  | 'CONJUNTO_OPCIONES'

export interface DirectApplicabilityReference<Kind extends ReferenceKind> {
  kind: Kind
  id: string
  code: string
}

export interface DirectApplicabilityRecord {
  kind: 'APLICABILIDAD'
  id: string
  revision: string
  active: boolean
  class: DirectApplicabilityReference<'CLASE'>
  family: DirectApplicabilityReference<'FAMILIA'>
  characteristic: DirectApplicabilityReference<'CARACTERISTICA'>
  type: DirectApplicabilityReference<'TIPO'>
  optionSet?: DirectApplicabilityReference<'CONJUNTO_OPCIONES'>
  mode: DirectApplicabilityMode
  rules: {
    attributeCode: string
    equals: CatalogValue
    mode: string
    identityParticipates: boolean
    notApplicable: boolean
    active: boolean
  }[]
  identityParticipates?: boolean
}

export interface DirectApplicabilityPage {
  records: DirectApplicabilityRecord[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface CatalogTypeAttributesReadApi {
  listDirectApplicabilities: (
    input: DirectApplicabilityRequest,
  ) => Promise<DirectApplicabilityPage>
}

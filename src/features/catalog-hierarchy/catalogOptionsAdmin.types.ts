export interface CatalogOptionsAdminRequest {
  optionSetCode: string
  characteristicCode: string
  offset: number
  limit: number
  signal?: AbortSignal
}

export interface CatalogOptionsAdminReference<Kind extends string> {
  kind: Kind
  id: string
  code: string
}

export interface CatalogOptionAdminValues {
  optionSet: CatalogOptionsAdminReference<'CONJUNTO_OPCIONES'>
  characteristic: CatalogOptionsAdminReference<'CARACTERISTICA'>
  code: string
  label: string
}

export interface CatalogOptionAdminRecord extends CatalogOptionAdminValues {
  kind: 'OPCION'
  id: string
  revision: string
  active: boolean
  rules: []
}

export interface CatalogOptionsAdminPage {
  records: CatalogOptionAdminRecord[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface CatalogOptionsAdminReferences {
  optionSet: CatalogOptionsAdminReference<'CONJUNTO_OPCIONES'>
  characteristic: CatalogOptionsAdminReference<'CARACTERISTICA'>
}

export interface CatalogOptionsAdminReferenceRequest {
  optionSetCode: string
  characteristicCode: string
  signal?: AbortSignal
}

export interface CatalogOptionsAdminCreateInput {
  values: CatalogOptionAdminValues
}

export interface CatalogOptionsAdminUpdateInput {
  id: string
  expectedRevision: string
  values: CatalogOptionAdminValues
}

export type CatalogOptionsAdminLifecycleInput = CatalogOptionsAdminUpdateInput

export interface CatalogOptionsAdminDeleteInput {
  id: string
  expectedRevision: string
}

export interface CatalogOptionsAdminApi {
  list: (input: CatalogOptionsAdminRequest) => Promise<CatalogOptionsAdminPage>
  resolveReferences: (
    input: CatalogOptionsAdminReferenceRequest,
  ) => Promise<CatalogOptionsAdminReferences>
  create: (
    input: CatalogOptionsAdminCreateInput,
  ) => Promise<CatalogOptionAdminRecord>
  update: (
    input: CatalogOptionsAdminUpdateInput,
  ) => Promise<CatalogOptionAdminRecord>
  deactivate: (
    input: CatalogOptionsAdminLifecycleInput,
  ) => Promise<CatalogOptionAdminRecord>
  reactivate: (
    input: CatalogOptionsAdminLifecycleInput,
  ) => Promise<CatalogOptionAdminRecord>
  delete?: (input: CatalogOptionsAdminDeleteInput) => Promise<void>
}

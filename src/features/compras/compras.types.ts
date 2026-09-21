export interface PurchaseImportInput {
  file: Blob
  branchId?: string
  signal?: AbortSignal
}

export interface PurchaseImportResponse extends Purchase {
  alreadyExisted: boolean
}

export interface Purchase {
  id: string
  supplierId: string
  branchId: string | null
  cfdiUuid: string
  series: string
  folio: string
  issuedAt: string
  currency: string
  exchangeRate: string | null
  subtotal: string
  discount: string
  taxTransferred: string
  taxWithheld: string
  total: string
  issuerTaxId: string
  issuerName: string
  xml: { hash: string; filename: string }
  importedAt: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseLine {
  id: string
  purchaseId: string
  lineNumber: number
  description: string
  supplierSku: string
  satProductCode: string
  quantity: string
  unitCode: string
  unit: string
  unitPrice: string
  amount: string
  discount: string
  taxTransferred: string
  taxWithheld: string
  taxObject: string
  supplierProductId: string | null
  resolutionRevision: string
  resolutionOverride: ResolutionOverride
  effectiveStatus: EffectiveLinkStatus
  effectiveCause: string
}

/** Compatibility alias for callers that still name the canonical shape V2. */
export type PurchaseLineV2 = PurchaseLine

export type EffectiveLinkStatus =
  | 'PENDIENTE'
  | 'VINCULADO'
  | 'SUSPENDIDO'
  | 'NO_APLICA'
  | 'CONFLICTO'

export type ResolutionOverride = 'NONE' | 'NO_APLICA' | 'CONFLICTO'

export interface PurchaseLineWorkbenchRow {
  lineId: string
  purchaseId: string
  lineNumber: number
  issuedAt: string
  series: string
  folio: string
  cfdiUuid: string
  supplierId: string
  supplierDisplayName: string
  description: string
  supplierSku: string
  commercialSupplierSku: string | null
  satProductCode: string
  quantity: string
  unitCode: string
  unit: string
  unitPrice: string
  amount: string
  currency: string
  supplierProductId: string | null
  mappingRevision: string | null
  resolutionRevision: string
  resourceId: string | null
  resourceIdentity: string | null
  resourceDisplayName: string | null
  resolutionOverride: ResolutionOverride
  effectiveStatus: EffectiveLinkStatus
  effectiveCause: string
}

export interface PurchaseLineWorkbenchPage {
  lines: PurchaseLineWorkbenchRow[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface PurchaseLineWorkbenchFilterInput {
  supplierId?: string
  status?: EffectiveLinkStatus
  dateFrom?: string
  dateTo?: string
  invoice?: string
  supplierSku?: string
  description?: string
  limit: number
  offset: number
  signal?: AbortSignal
}

export interface SupplierProduct {
  id: string
  supplierId: string
  supplierSku: string
  description: string
  resourceId: string | null
  mappingRevision?: string
  resourceActive?: boolean | null
  mappingState?: MappingState
  mappingCause?: MappingCause
  notes: string
  createdAt: string
  updatedAt: string
}

export type MappingState =
  | 'UNRESOLVED'
  | 'CONFIRMED'
  | 'SUSPENDED'
  | 'IDENTITY_CONFLICT'

export type MappingCause =
  | 'NONE'
  | 'UNRESOLVED'
  | 'RESOURCE_INACTIVE'
  | 'IDENTITY_CONFLICT'

/** Transitional enriched SupplierProduct projection returned by mapping mutations. */
export interface SupplierProductMappingProjection extends SupplierProduct {
  mappingRevision: string
  resourceActive: boolean | null
  mappingState: MappingState
  mappingCause: MappingCause
}

export type MappingDisposition = 'CREATED' | 'REUSED' | 'ALREADY_MAPPED'

export interface CommercialIdentity {
  supplierProductId: string
  supplierId: string
  commercialSupplierSku: string
  disposition: MappingDisposition
  mappingRevision: string
  resourceId: string | null
}

export interface ResolvePurchaseLineResponse {
  line: PurchaseLineV2
  supplierProduct: SupplierProductMappingProjection
  commercialIdentity: CommercialIdentity
}

export interface ResolvePurchaseLineInput {
  id: string
  reason: string
  resourceId: string
  expectedSupplierProductId: string | null
  expectedMappingRevision: string | null
  expectedResolutionRevision: string
  commercialSupplierSku: string
  signal?: AbortSignal
}

export interface SetPurchaseLineResolutionOverrideInput {
  id: string
  reason: string
  override: ResolutionOverride
  expectedRevision: string
  signal?: AbortSignal
}

export type PurchaseLineResolutionOverrideInput =
  SetPurchaseLineResolutionOverrideInput

export interface ConfirmSupplierProductMappingInput {
  id: string
  reason: string
  resourceId: string
  expectedRevision: string
  signal?: AbortSignal
}

export interface CorrectSupplierProductMappingInput {
  id: string
  reason: string
  expectedCurrentResourceId: string
  resourceId: string
  expectedRevision: string
  signal?: AbortSignal
}

export interface RetireSupplierProductMappingInput {
  id: string
  reason: string
  expectedCurrentResourceId: string
  expectedRevision: string
  signal?: AbortSignal
}

export interface ReportSupplierProductMappingConflictInput {
  id: string
  reason: string
  expectedCurrentResourceId: string
  expectedRevision: string
  signal?: AbortSignal
}

export interface ResolveSupplierProductMappingConflictInput {
  id: string
  reason: string
  expectedCurrentResourceId: string
  resourceId: string
  expectedRevision: string
  signal?: AbortSignal
}

export interface PurchasePage {
  purchases: Purchase[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface SupplierProductPage {
  products: SupplierProduct[]
  hasPrevious: boolean
  hasNext: boolean
}

export type LinkStatus = 'PENDIENTE' | 'VINCULADO' | 'NO_APLICA' | 'CONFLICTO'

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
  linkStatus: LinkStatus
}

export interface SupplierProduct {
  id: string
  supplierId: string
  supplierSku: string
  description: string
  resourceId: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface LinkSupplierProductInput {
  id: string
  resourceId: string
  signal?: AbortSignal
}

export interface UnlinkSupplierProductInput {
  id: string
  signal?: AbortSignal
}

export interface PurchaseLineLinkStatusInput {
  id: string
  status: LinkStatus
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

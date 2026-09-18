export type SupplierLifecycle = 'ALL' | 'ACTIVE' | 'INACTIVE'

export interface Supplier {
  id: string
  tradeName: string
  legalName: string
  taxIdentifier: string
  website: string
  notes: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierPage {
  suppliers: Supplier[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface SupplierRestListInput {
  scope: SupplierLifecycle
  text?: string
  limit: number
  offset: number
  signal?: AbortSignal
}

export interface SupplierRestDetailInput {
  id: string
  signal?: AbortSignal
}

// SupplierCreateRequest/SupplierUpdateRequest only require `actor`; every
// other field is optional per the OpenAPI contract. `actor` itself is
// resolved separately via withRestActor/resolveRestActor, never passed here.
export interface SupplierRestFields {
  tradeName?: string
  legalName?: string
  taxIdentifier?: string
  website?: string
  notes?: string
}

export type SupplierRestCreateInput = SupplierRestFields

export interface SupplierRestUpdateInput extends SupplierRestFields {
  id: string
}

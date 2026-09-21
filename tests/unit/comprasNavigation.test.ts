import { describe, expect, it } from 'vitest'
import {
  changeComprasSupplier,
  confirmComprasSupplier,
  createComprasNavigation,
  returnToSupplierSelection,
} from '../../src/features/compras/comprasNavigation.model'
import type { Supplier } from '../../src/features/proveedores/proveedores.types'

const supplier = {
  id: 'supplier-1',
  tradeName: 'Acme Comercial',
  legalName: 'Acme Comercial S.A.',
  taxIdentifier: '20-00000000-0',
} as Supplier

describe('compras navigation model', () => {
  it('confirms a supplier as the history context', () => {
    expect(confirmComprasSupplier(createComprasNavigation(), supplier)).toEqual(
      {
        stage: 'historial',
        supplier,
      },
    )
  })

  it('resets supplier context when going back or changing supplier', () => {
    expect(returnToSupplierSelection()).toEqual(createComprasNavigation())
    expect(changeComprasSupplier()).toEqual(createComprasNavigation())
  })
})

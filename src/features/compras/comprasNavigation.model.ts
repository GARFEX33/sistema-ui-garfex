import type { Supplier } from '../proveedores/proveedores.types'

export type ComprasNavigationStage = 'elegir-proveedor' | 'historial'

export interface ComprasNavigation {
  stage: ComprasNavigationStage
  supplier: Supplier | null
}

export const createComprasNavigation = (): ComprasNavigation => ({
  stage: 'elegir-proveedor',
  supplier: null,
})

export const confirmComprasSupplier = (
  _navigation: ComprasNavigation,
  supplier: Supplier,
): ComprasNavigation => ({
  stage: 'historial',
  supplier,
})

export const returnToSupplierSelection = (): ComprasNavigation =>
  createComprasNavigation()

export const changeComprasSupplier = (): ComprasNavigation =>
  createComprasNavigation()

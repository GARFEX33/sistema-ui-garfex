import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { WorkCard } from '../../shared/ui/WorkCard'
import { StagedSearchSelector } from '../resources-master/StagedSearchSelector'
import { createComprasRestApi, type ComprasRestApi } from './compras.api'
import type { SupplierProduct } from './compras.types'
import { useSupplierProductsRestWindow } from './useSupplierProductsRestWindow'
export type SupplierProductsInspectionStatus =
  | 'disabled'
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'
export interface SupplierProductsInspectionWindow {
  rows: readonly SupplierProduct[]
  status: SupplierProductsInspectionStatus
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  next: () => void
  previous: () => void
  retry: () => void | Promise<unknown>
}
type ProductSelection = readonly [
  string,
  string | null,
  number,
  readonly SupplierProduct[],
]
export interface InspeccionarProductoProveedorStageProps {
  supplierId?: string | null
  supplierName?: string
  api?: Pick<ComprasRestApi, 'listSupplierProducts'>
  productsWindow?: SupplierProductsInspectionWindow
  onProductInspected?: (product: SupplierProduct) => void
}
const pageSize = 20
const noSupplierMessage =
  'Seleccioná un proveedor para inspeccionar sus productos.'
const toSelectorLoadState = (
  window: SupplierProductsInspectionWindow,
  hasSupplier: boolean,
) => {
  if (!hasSupplier || window.status === 'disabled')
    return { status: 'waiting-for-parent' as const }
  if (window.status === 'initial-loading' || window.status === 'navigating')
    return { status: 'loading' as const }
  if (window.status === 'initial-error' || window.status === 'navigation-error')
    return { status: 'initial-error' as const }
  return window.status === 'empty'
    ? { status: 'empty' as const }
    : { status: 'ready' as const, exhausted: !window.hasNext }
}
export function InspeccionarProductoProveedorStage({
  supplierId = null,
  supplierName,
  api,
  productsWindow,
  onProductInspected,
}: InspeccionarProductoProveedorStageProps) {
  const [defaultApi] = useState(() => createComprasRestApi())
  const effectiveApi = api ?? defaultApi
  const queryWindow = useSupplierProductsRestWindow(
    effectiveApi as ComprasRestApi,
    productsWindow ? undefined : (supplierId ?? undefined),
    pageSize,
  )
  const window = productsWindow ?? queryWindow
  const hasSupplier = Boolean(supplierId)
  const rows = hasSupplier ? window.rows : []
  const [selection, setSelection] = useState<ProductSelection | null>(null)
  const selectedProductId =
    selection?.[1] === supplierId &&
    selection[2] === window.offset &&
    selection[3] === rows
      ? selection[0]
      : null
  const selectedProduct =
    window.status === 'ready' && selectedProductId
      ? (rows.find((product) => product.id === selectedProductId) ?? null)
      : null
  const selectorLoadState = toSelectorLoadState(window, hasSupplier)
  const isNavigating = window.status === 'navigating'
  return (
    <WorkCard
      role="region"
      aria-labelledby="inspeccionar-producto-proveedor-title"
      className="grid gap-4"
    >
      <h2
        id="inspeccionar-producto-proveedor-title"
        className="text-base font-bold text-text-primary"
      >
        Inspección de Productos de Proveedor
      </h2>
      <p className="text-sm text-text-secondary">
        Proveedor vigente: {supplierName || supplierId || 'sin proveedor'}
      </p>
      <StagedSearchSelector
        key={`${supplierId ?? ''}:${window.offset}`}
        label="Producto de Proveedor"
        items={rows}
        itemKey={(product) => product.id}
        itemName={(product) =>
          `${product.description} ${product.supplierSku} ${product.id}`
        }
        renderItem={(product) => (
          <span className="grid gap-0.5">
            <span className="font-bold">{product.description}</span>
            <span className="text-xs text-text-secondary">
              SKU: {product.supplierSku} · ID: {product.id}
            </span>
          </span>
        )}
        confirmedKey={selectedProductId}
        loadState={selectorLoadState}
        waitingForParentLabel={noSupplierMessage}
        onConfirm={(product) => {
          setSelection([product.id, supplierId, window.offset, rows])
          onProductInspected?.(product)
        }}
        onLoadMore={() => undefined}
        onRetry={() => {
          void window.retry()
        }}
        maxVisibleRows={8}
      />
      {hasSupplier && window.status === 'ready' && (
        <p role="status" className="text-sm text-text-secondary">
          Mostrando {rows.length} productos, registros{' '}
          {rows.length ? window.offset + 1 : 0}–{window.offset + rows.length}.
        </p>
      )}
      {hasSupplier && (window.status === 'ready' || isNavigating) && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            aria-label="Página anterior de productos"
            isDisabled={!window.hasPrevious || isNavigating}
            onPress={window.previous}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            type="button"
            aria-label="Página siguiente de productos"
            isDisabled={!window.hasNext || isNavigating}
            onPress={window.next}
          >
            Siguiente
          </Button>
        </div>
      )}
      {selectedProduct && (
        <div
          role="region"
          aria-label="Detalle del Producto de Proveedor seleccionado"
          className="grid gap-1 rounded-md border border-border bg-surface-subtle p-3 text-sm"
        >
          <h3 className="font-bold text-text-primary">
            Producto inspeccionado
          </h3>
          <p>Descripción: {selectedProduct.description}</p>
          <p>SKU del proveedor: {selectedProduct.supplierSku}</p>
          <p>ID del Producto de Proveedor: {selectedProduct.id}</p>
          <p>supplierId: {selectedProduct.supplierId}</p>
          <p>
            resourceId:{' '}
            {selectedProduct.resourceId ?? 'Sin Recurso Maestro vinculado'}
          </p>
        </div>
      )}
    </WorkCard>
  )
}

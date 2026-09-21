import { useEffect, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import {
  StagedSearchSelector,
  type SelectorLoadState,
} from '../resources-master/StagedSearchSelector'
import type { Supplier } from '../proveedores/proveedores.types'

export type SupplierSelectionStatus =
  | 'initial-loading'
  | 'initial-error'
  | 'navigation-error'
  | 'navigating'
  | 'empty'
  | 'ready'

type NavigationDirection = 'previous' | 'next'

export interface ElegirProveedorStageProps {
  suppliers: readonly Supplier[]
  status: SupplierSelectionStatus
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  onRetry: () => void
  onRetryNavigation: () => void
  onConfirm: (supplier: Supplier) => void
}

const supplierDisplayName = (supplier: Supplier) =>
  supplier.tradeName || supplier.legalName || supplier.id

const supplierSearchName = (supplier: Supplier) =>
  [supplierDisplayName(supplier), supplier.legalName, supplier.taxIdentifier]
    .filter(Boolean)
    .join(' · ')

const supplierSelectorLoadState = (
  status: SupplierSelectionStatus,
  hasNext: boolean,
): SelectorLoadState => {
  switch (status) {
    case 'initial-loading':
    case 'navigating':
      return { status: 'loading' }
    case 'initial-error':
      return { status: 'initial-error' }
    case 'navigation-error':
      return { status: 'ready', exhausted: true }
    case 'empty':
      return { status: 'empty' }
    case 'ready':
      return { status: 'ready', exhausted: !hasNext }
  }
}

function SupplierOption({ supplier }: { supplier: Supplier }) {
  return (
    <span className="block break-words text-sm text-text-primary">
      {supplierDisplayName(supplier)} · ID fiscal: {supplier.taxIdentifier} ·{' '}
      {supplier.legalName || `ID: ${supplier.id}`}
    </span>
  )
}

export function ElegirProveedorStage({
  suppliers,
  status,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onRetry,
  onRetryNavigation,
  onConfirm,
}: ElegirProveedorStageProps) {
  const [navigationDirection, setNavigationDirection] =
    useState<NavigationDirection | null>(null)
  const loading = status === 'initial-loading' || status === 'navigating'

  useEffect(() => {
    if (status === 'ready' || status === 'empty' || status === 'initial-error')
      setNavigationDirection(null)
  }, [status])

  const navigate = (direction: NavigationDirection) => {
    setNavigationDirection(direction)
    if (direction === 'previous') onPrevious()
    else onNext()
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-text-secondary">
        Elegí un proveedor para consultar su historial de compras.
      </p>
      <StagedSearchSelector
        label="Proveedor"
        autoFocus
        items={suppliers}
        itemKey={(supplier) => supplier.id}
        itemName={supplierSearchName}
        renderItem={(supplier) => <SupplierOption supplier={supplier} />}
        loadState={supplierSelectorLoadState(status, hasNext)}
        onConfirm={onConfirm}
        onLoadMore={() => {}}
        onRetry={onRetry}
        maxVisibleRows={8}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onPress={() => navigate('previous')}
          isDisabled={!hasPrevious || loading || status === 'navigation-error'}
        >
          Página anterior
        </Button>
        <Button
          variant="outline"
          onPress={() => navigate('next')}
          isDisabled={!hasNext || loading || status === 'navigation-error'}
        >
          Página siguiente
        </Button>
      </div>
      {status === 'navigation-error' && navigationDirection && (
        <div role="alert" className="text-sm text-text-secondary">
          No se pudo cargar la página{' '}
          {navigationDirection === 'next' ? 'siguiente' : 'anterior'}.{' '}
          <Button variant="outline" onPress={onRetryNavigation}>
            Reintentar página{' '}
            {navigationDirection === 'next' ? 'siguiente' : 'anterior'}
          </Button>
        </div>
      )}
    </div>
  )
}

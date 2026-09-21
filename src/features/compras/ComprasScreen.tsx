import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import {
  createProveedoresRestApi,
  type ProveedoresRestApi,
} from '../proveedores/proveedores.api'
import { useProveedoresRestWindow } from '../proveedores/useProveedoresRestWindow'
import type { Supplier } from '../proveedores/proveedores.types'
import { CompraDetalleStage } from './CompraDetalleStage'
import { ElegirProveedorStage } from './ElegirProveedorStage'
import { createComprasRestApi, type ComprasRestApi } from './compras.api'
import { HistorialComprasStage } from './HistorialComprasStage'
import { ImportarCompraSurface } from './ImportarCompraSurface'
import { InspeccionarProductoProveedorStage } from './InspeccionarProductoProveedorStage'
import { PartidasPendientesBlockedSurface } from './PartidasPendientesBlockedSurface'
import { useSupplierPurchasesRestWindow } from './useSupplierPurchasesRestWindow'
import type { PurchaseImportResponse } from './compras.types'
import {
  changeComprasSupplier,
  confirmComprasSupplier,
  createComprasNavigation,
  type ComprasNavigation,
} from './comprasNavigation.model'

const SUPPLIER_LIMIT = 20

export interface ComprasScreenProps {
  proveedoresApi?: ProveedoresRestApi
  comprasApi?: ComprasRestApi
}

const supplierDisplayName = (supplier: Supplier) =>
  supplier.tradeName || supplier.legalName || supplier.id

const supplierLegalName = (supplier: Supplier) =>
  supplier.legalName || supplierDisplayName(supplier)

export function ComprasScreen({
  proveedoresApi,
  comprasApi,
}: ComprasScreenProps) {
  const [api] = useState<ProveedoresRestApi>(
    () => proveedoresApi ?? createProveedoresRestApi(),
  )
  const [purchasesApi] = useState<ComprasRestApi>(
    () => comprasApi ?? createComprasRestApi(),
  )
  const [navigation, setNavigation] = useState<ComprasNavigation>(() =>
    createComprasNavigation(),
  )
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null,
  )
  const [importFeedback, setImportFeedback] = useState<string | null>(null)
  const criteria = useMemo(
    () => ({
      text: '',
      scope: 'ACTIVE' as const,
      limit: SUPPLIER_LIMIT,
    }),
    [],
  )
  const { suppliers, status, hasPrevious, hasNext, previous, next, retry } =
    useProveedoresRestWindow(api, criteria)

  const confirmedSupplier = navigation.supplier
  const selectingSupplier = navigation.stage === 'elegir-proveedor'
  const screenMountedRef = useRef(true)
  const supplierContextVersion = useRef(0)
  const previousSupplierId = useRef(confirmedSupplier?.id)
  if (previousSupplierId.current !== confirmedSupplier?.id) {
    previousSupplierId.current = confirmedSupplier?.id
    supplierContextVersion.current += 1
  }
  useEffect(() => {
    screenMountedRef.current = true
    return () => {
      screenMountedRef.current = false
    }
  }, [])
  const purchaseWindow = useSupplierPurchasesRestWindow(
    purchasesApi,
    confirmedSupplier?.id,
    20,
  )
  const currentSupplierId = useRef(confirmedSupplier?.id)
  const currentPurchaseWindow = useRef(purchaseWindow)
  currentSupplierId.current = confirmedSupplier?.id
  currentPurchaseWindow.current = purchaseWindow
  const onImported = async (result: PurchaseImportResponse) => {
    const message = result.alreadyExisted
      ? 'La compra ya estaba registrada.'
      : 'Compra importada.'
    const supplierVersionAtStart = supplierContextVersion.current
    if (currentSupplierId.current !== result.supplierId) {
      if (screenMountedRef.current) {
        setImportFeedback(
          `${message} El proveedor de la compra no coincide con el proveedor actual; el historial actual no se actualizó.`,
        )
      }
      return
    }

    await currentPurchaseWindow.current.refetchActive()
    if (!screenMountedRef.current) return
    if (
      supplierVersionAtStart !== supplierContextVersion.current ||
      currentSupplierId.current !== result.supplierId
    ) {
      setImportFeedback(
        `${message} El proveedor de la compra ya no es el actual; el historial actual no se actualizó.`,
      )
      return
    }
    setImportFeedback(`${message} Historial del proveedor actualizado.`)
  }

  return (
    <section
      className="w-full text-text-primary"
      aria-labelledby="compras-title"
    >
      <PageHeader
        title={
          <h1 id="compras-title" className="text-lg font-bold">
            Compras
          </h1>
        }
        action={
          <ImportarCompraSurface
            importPurchase={purchasesApi.importPurchase}
            onImported={onImported}
          />
        }
      />
      {importFeedback && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm text-success"
        >
          {importFeedback}
        </p>
      )}
      <div className="mt-3">
        <WorkCard
          aria-labelledby={
            selectingSupplier
              ? 'compras-select-supplier-title'
              : selectedPurchaseId
                ? 'compra-detail-title'
                : 'compras-history-title'
          }
        >
          {selectingSupplier ? (
            <>
              <h2
                id="compras-select-supplier-title"
                className="mb-3 text-base font-bold"
              >
                Seleccionar proveedor
              </h2>
              <ElegirProveedorStage
                suppliers={suppliers}
                status={status}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onPrevious={previous}
                onNext={next}
                onRetry={() => {
                  void retry()
                }}
                onRetryNavigation={() => {
                  void retry()
                }}
                onConfirm={(supplier) => {
                  setSelectedPurchaseId(null)
                  setImportFeedback(null)
                  setNavigation((current) =>
                    confirmComprasSupplier(current, supplier),
                  )
                }}
              />
            </>
          ) : (
            <>
              <section aria-label="Proveedor confirmado" className="grid gap-3">
                <dl className="grid gap-2 text-sm text-text-secondary">
                  <div>
                    <dt className="font-bold text-text-primary">Nombre</dt>
                    <dd>{supplierDisplayName(confirmedSupplier!)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-text-primary">
                      Razón social
                    </dt>
                    <dd>{supplierLegalName(confirmedSupplier!)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-text-primary">ID fiscal</dt>
                    <dd>{confirmedSupplier!.taxIdentifier}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-text-primary">ID interno</dt>
                    <dd>{confirmedSupplier!.id}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  onPress={() => {
                    setSelectedPurchaseId(null)
                    setImportFeedback(null)
                    setNavigation(() => changeComprasSupplier())
                  }}
                >
                  Cambiar proveedor
                </Button>
              </section>
              <InspeccionarProductoProveedorStage
                supplierId={confirmedSupplier!.id}
                supplierName={supplierDisplayName(confirmedSupplier!)}
                api={purchasesApi}
              />
              {selectedPurchaseId ? (
                <CompraDetalleStage
                  api={purchasesApi}
                  purchaseId={selectedPurchaseId}
                  onBack={() => setSelectedPurchaseId(null)}
                />
              ) : (
                <HistorialComprasStage
                  supplierName={supplierDisplayName(confirmedSupplier!)}
                  rows={purchaseWindow.rows}
                  status={purchaseWindow.status}
                  hasPrevious={purchaseWindow.hasPrevious}
                  hasNext={purchaseWindow.hasNext}
                  onPrevious={purchaseWindow.previous}
                  onNext={purchaseWindow.next}
                  onRetry={purchaseWindow.retry}
                  onSelectPurchase={(purchase) => {
                    setSelectedPurchaseId(purchase.id)
                  }}
                />
              )}
            </>
          )}
        </WorkCard>
      </div>
      <div className="mt-4">
        <PartidasPendientesBlockedSurface />
      </div>
    </section>
  )
}

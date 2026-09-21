import { useEffect, useMemo, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { PageHeader } from '../../shared/ui/PageHeader'
import { WorkCard } from '../../shared/ui/WorkCard'
import {
  createProveedoresRestApi,
  type ProveedoresRestApi,
} from '../proveedores/proveedores.api'
import { useProveedoresRestWindow } from '../proveedores/useProveedoresRestWindow'
import type { Supplier } from '../proveedores/proveedores.types'
import {
  createResourcesMasterRestApi,
  type ResourcesMasterRestReadApi,
} from '../resources-master/resourcesMaster.api'
import { CompraDetalleStage } from './CompraDetalleStage'
import { ElegirProveedorStage } from './ElegirProveedorStage'
import { createComprasRestApi, type ComprasRestApi } from './compras.api'
import { HistorialComprasStage } from './HistorialComprasStage'
import { ImportarCompraSurface } from './ImportarCompraSurface'
import { InspeccionarProductoProveedorStage } from './InspeccionarProductoProveedorStage'
import { PartidasWorkbenchStage } from './PartidasWorkbenchStage'
import { ResolverPartidaSurface } from './ResolverPartidaSurface'
import { useSupplierPurchasesRestWindow } from './useSupplierPurchasesRestWindow'
import {
  type PartidasWorkbenchFilters,
  type SupplierOption,
} from './PartidasWorkbenchStage'
import type {
  PurchaseImportResponse,
  PurchaseLineWorkbenchRow,
} from './compras.types'
import { usePurchaseLineWorkbenchRestWindow } from './usePurchaseLineWorkbenchRestWindow'
import type { PurchaseLineWorkbenchCriteria } from './usePurchaseLineWorkbenchRestWindow'
import {
  changeComprasSupplier,
  confirmComprasSupplier,
  createComprasNavigation,
  type ComprasNavigation,
} from './comprasNavigation.model'

const SUPPLIER_LIMIT = 50
const WORKBENCH_LIMIT = 20

type ComprasPerspective = 'partidas' | 'documentos'
type DetailOrigin = 'partidas' | 'documentos'

const emptyWorkbenchPage = {
  lines: [],
  hasPrevious: false,
  hasNext: false,
}

const initialPartidasFilters: PartidasWorkbenchFilters = {
  supplierId: '',
  dateFrom: '',
  dateTo: '',
  invoice: '',
  supplierSku: '',
  description: '',
  status: undefined,
}

export interface ComprasScreenProps {
  proveedoresApi?: ProveedoresRestApi
  comprasApi?: ComprasRestApi
  resourcesApi?: ResourcesMasterRestReadApi
  initialPerspective?: ComprasPerspective
}

const supplierDisplayName = (supplier: Supplier) =>
  supplier.tradeName || supplier.legalName || supplier.id

const supplierLegalName = (supplier: Supplier) =>
  supplier.legalName || supplierDisplayName(supplier)

function SupplierContext({
  supplier,
  onChange,
}: {
  supplier: Supplier
  onChange: () => void
}) {
  return (
    <section aria-label="Proveedor confirmado" className="grid gap-3">
      <dl className="grid gap-2 text-sm text-text-secondary">
        <div>
          <dt className="font-bold text-text-primary">Nombre</dt>
          <dd>{supplierDisplayName(supplier)}</dd>
        </div>
        <div>
          <dt className="font-bold text-text-primary">Razón social</dt>
          <dd>{supplierLegalName(supplier)}</dd>
        </div>
        <div>
          <dt className="font-bold text-text-primary">ID fiscal</dt>
          <dd>{supplier.taxIdentifier}</dd>
        </div>
        <div>
          <dt className="font-bold text-text-primary">ID interno</dt>
          <dd>{supplier.id}</dd>
        </div>
      </dl>
      <Button variant="outline" onPress={onChange}>
        Cambiar proveedor
      </Button>
    </section>
  )
}

const workbenchCanResolve = (row: PurchaseLineWorkbenchRow) =>
  row.effectiveStatus === 'PENDIENTE' && row.resolutionOverride === 'NONE'

const workbenchCriteria = (
  filters: PartidasWorkbenchFilters,
): PurchaseLineWorkbenchCriteria => ({
  ...(filters.supplierId.trim() && { supplierId: filters.supplierId.trim() }),
  ...(filters.dateFrom.trim() && { dateFrom: filters.dateFrom.trim() }),
  ...(filters.dateTo.trim() && { dateTo: filters.dateTo.trim() }),
  ...(filters.invoice.trim() && { invoice: filters.invoice.trim() }),
  ...(filters.supplierSku.trim() && {
    supplierSku: filters.supplierSku.trim(),
  }),
  ...(filters.description.trim() && {
    description: filters.description.trim(),
  }),
  ...(filters.status ? { status: filters.status } : {}),
  limit: WORKBENCH_LIMIT,
})

export function ComprasScreen({
  proveedoresApi,
  comprasApi,
  resourcesApi,
  initialPerspective = 'partidas',
}: ComprasScreenProps) {
  const [api] = useState<ProveedoresRestApi>(
    () => proveedoresApi ?? createProveedoresRestApi(),
  )
  const [purchasesApi] = useState<ComprasRestApi>(
    () => comprasApi ?? createComprasRestApi(),
  )
  const [defaultResourcesApi] = useState(() => createResourcesMasterRestApi())
  const effectiveResourcesApi = resourcesApi ?? defaultResourcesApi
  const [perspective, setPerspective] =
    useState<ComprasPerspective>(initialPerspective)
  const [navigation, setNavigation] = useState<ComprasNavigation>(() =>
    createComprasNavigation(),
  )
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null,
  )
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [resolverOpen, setResolverOpen] = useState(false)
  const [partidasFilters, setPartidasFilters] = useState(initialPartidasFilters)
  const [importFeedback, setImportFeedback] = useState<string | null>(null)
  const [partidasFeedback, setPartidasFeedback] = useState<string | null>(null)
  const [focusAfterResolve, setFocusAfterResolve] = useState(false)
  const [resolvedLineIdForFocus, setResolvedLineIdForFocus] = useState<
    string | null
  >(null)
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

  const criteriaForWorkbench = useMemo(
    () => workbenchCriteria(partidasFilters),
    [partidasFilters],
  )
  // Older Documentos-only test doubles predate the workbench method. Keep the
  // screen readable with those adapters while production always uses the REST API.
  const workbenchApi = useMemo<ComprasRestApi>(() => {
    if (typeof purchasesApi.listPurchaseLineWorkbench === 'function')
      return purchasesApi
    return {
      ...purchasesApi,
      listPurchaseLineWorkbench: async () => emptyWorkbenchPage,
    }
  }, [purchasesApi])
  const workbench = usePurchaseLineWorkbenchRestWindow(
    workbenchApi,
    criteriaForWorkbench,
  )
  const currentWorkbench = useRef(workbench)
  currentWorkbench.current = workbench

  const supplierOptions = useMemo<readonly SupplierOption[]>(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        label: supplierDisplayName(supplier),
      })),
    [suppliers],
  )

  useEffect(() => {
    if (!focusAfterResolve) return
    const currentIndex = resolvedLineIdForFocus
      ? workbench.rows.findIndex((row) => row.lineId === resolvedLineIdForFocus)
      : -1
    const nextRow = (
      currentIndex >= 0
        ? workbench.rows.slice(currentIndex + 1)
        : workbench.rows
    ).find(workbenchCanResolve)
    restoreFocusNextFrame(null, [
      () =>
        nextRow
          ? (Array.from(
              document.querySelectorAll<HTMLElement>(
                '[data-partidas-resolve-id]',
              ),
            ).find(
              (element) => element.dataset.partidasResolveId === nextRow.lineId,
            ) ?? null)
          : null,
      () =>
        document.querySelector<HTMLElement>(
          '[data-partidas-workbench-heading]',
        ),
    ])
    setFocusAfterResolve(false)
  }, [focusAfterResolve, resolvedLineIdForFocus, workbench.rows])

  const onImported = async (result: PurchaseImportResponse) => {
    const message = result.alreadyExisted
      ? 'La compra ya estaba registrada.'
      : 'Compra importada.'
    const supplierVersionAtStart = supplierContextVersion.current
    const supplierIsRelevant = currentSupplierId.current === result.supplierId

    await currentWorkbench.current.refetchActive({ throwOnError: true })
    if (!screenMountedRef.current) return

    if (!supplierIsRelevant) {
      setImportFeedback(
        currentSupplierId.current === undefined
          ? `${message} Partidas actualizadas.`
          : `${message} El proveedor de la compra no coincide con el proveedor actual; el historial actual no se actualizó.`,
      )
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

  const onResolved = async () => {
    await currentWorkbench.current.refetchActive({ throwOnError: true })
    if (!screenMountedRef.current) return
    setPartidasFeedback('Partida vinculada correctamente.')
    setResolvedLineIdForFocus(selectedLineId)
    setFocusAfterResolve(true)
  }

  const onRereadRequired = async () => {
    await currentWorkbench.current.refetchActive({ throwOnError: true })
  }

  const selectedLine = selectedLineId
    ? (workbench.rows.find((row) => row.lineId === selectedLineId) ?? null)
    : null

  const switchPerspective = (nextPerspective: ComprasPerspective) => {
    setPerspective(nextPerspective)
    setSelectedPurchaseId(null)
    setDetailOrigin(null)
    setResolverOpen(false)
    setSelectedLineId(null)
  }

  const workCardLabel =
    perspective === 'partidas'
      ? 'partidas-workbench-title'
      : selectedPurchaseId
        ? 'compra-detail-title'
        : selectingSupplier
          ? 'compras-select-supplier-title'
          : 'compras-history-title'

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
        controls={
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Perspectiva de Compras"
          >
            <Button
              variant={perspective === 'partidas' ? 'accent' : 'outline'}
              aria-pressed={perspective === 'partidas'}
              onPress={() => switchPerspective('partidas')}
            >
              Partidas
            </Button>
            <Button
              variant={perspective === 'documentos' ? 'accent' : 'outline'}
              aria-pressed={perspective === 'documentos'}
              onPress={() => switchPerspective('documentos')}
            >
              Documentos
            </Button>
          </div>
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
      {partidasFeedback && perspective === 'partidas' && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm text-success"
        >
          {partidasFeedback}
        </p>
      )}
      <div className="mt-3">
        <WorkCard aria-labelledby={workCardLabel}>
          {perspective === 'partidas' ? (
            <PartidasWorkbenchStage
              filters={partidasFilters}
              supplierOptions={supplierOptions}
              rows={workbench.rows}
              status={workbench.status}
              hasPrevious={workbench.hasPrevious}
              hasNext={workbench.hasNext}
              onFiltersChange={setPartidasFilters}
              onResolve={(row) => {
                setSelectedLineId(row.lineId)
                setResolverOpen(true)
              }}
              onInspectDocument={(row) => {
                setDetailOrigin('partidas')
                setSelectedPurchaseId(row.purchaseId)
                setPerspective('documentos')
              }}
              onRetry={() => workbench.retry()}
              onPrevious={workbench.previous}
              onNext={workbench.next}
            />
          ) : selectedPurchaseId ? (
            <>
              {confirmedSupplier && (
                <>
                  <SupplierContext
                    supplier={confirmedSupplier}
                    onChange={() => {
                      setSelectedPurchaseId(null)
                      setImportFeedback(null)
                      setNavigation(() => changeComprasSupplier())
                    }}
                  />
                  <InspeccionarProductoProveedorStage
                    supplierId={confirmedSupplier.id}
                    supplierName={supplierDisplayName(confirmedSupplier)}
                    api={purchasesApi}
                  />
                </>
              )}
              <CompraDetalleStage
                api={purchasesApi}
                resourcesApi={effectiveResourcesApi}
                purchaseId={selectedPurchaseId}
                onBack={() => {
                  const origin = detailOrigin
                  setSelectedPurchaseId(null)
                  setDetailOrigin(null)
                  if (origin === 'partidas') setPerspective('partidas')
                }}
              />
            </>
          ) : selectingSupplier ? (
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
              <SupplierContext
                supplier={confirmedSupplier!}
                onChange={() => {
                  setSelectedPurchaseId(null)
                  setImportFeedback(null)
                  setNavigation(() => changeComprasSupplier())
                }}
              />
              <InspeccionarProductoProveedorStage
                supplierId={confirmedSupplier!.id}
                supplierName={supplierDisplayName(confirmedSupplier!)}
                api={purchasesApi}
              />
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
                  setDetailOrigin('documentos')
                  setSelectedPurchaseId(purchase.id)
                }}
              />
            </>
          )}
        </WorkCard>
      </div>
      <ResolverPartidaSurface
        row={selectedLine}
        isOpen={resolverOpen}
        resourcesApi={effectiveResourcesApi}
        resolvePurchaseLine={purchasesApi.resolvePurchaseLine}
        onResolved={onResolved}
        onRereadRequired={onRereadRequired}
        onOpenChange={(open) => {
          setResolverOpen(open)
          if (!open) setSelectedLineId(null)
        }}
      />
    </section>
  )
}

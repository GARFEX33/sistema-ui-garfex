import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { PartidaEstadoBadge } from './PartidaEstadoBadge'
import {
  createResourcesMasterRestApi,
  type ResourcesMasterRestReadApi,
} from '../resources-master/resourcesMaster.api'
import { DesvincularPartidaSurface } from './DesvincularPartidaSurface'
import { MarcarNoAplicaAction } from './MarcarNoAplicaAction'
import { VincularPartidaSurface } from './VincularPartidaSurface'
import { createComprasRestApi, type ComprasRestApi } from './compras.api'
import type { Purchase, PurchaseLine, SupplierProduct } from './compras.types'

export interface CompraDetalleStageProps {
  api: Pick<
    ComprasRestApi,
    | 'getPurchase'
    | 'listPurchaseLines'
    | 'linkSupplierProduct'
    | 'unlinkSupplierProduct'
    | 'setPurchaseLineLinkStatus'
  > &
    Partial<Pick<ComprasRestApi, 'getSupplierProduct'>>
  purchaseId: string | null
  onBack: () => void
  resourcesApi?: ResourcesMasterRestReadApi
}

type Detail = {
  purchase: Purchase
  lines: PurchaseLine[]
  supplierProducts: Record<string, SupplierProduct>
}
type Cell = ReactNode
type TableRow = { key: string; cells: Cell[] }

const fields = (purchase: Purchase) =>
  [
    ['ID de compra', purchase.id],
    ['ID del proveedor', purchase.supplierId],
    ['Creado el', purchase.createdAt],
    ['Actualizado el', purchase.updatedAt],
    ['Serie', purchase.series],
    ['Folio', purchase.folio],
    ['UUID fiscal', purchase.cfdiUuid],
    ['Fecha de emisión', purchase.issuedAt],
    ['Nombre del emisor', purchase.issuerName],
    ['RFC del emisor', purchase.issuerTaxId],
    ['Moneda', purchase.currency],
    ['Tipo de cambio', purchase.exchangeRate ?? 'Sin tipo de cambio'],
    ['Subtotal', purchase.subtotal],
    ['Descuento', purchase.discount],
    ['Impuestos trasladados', purchase.taxTransferred],
    ['Impuestos retenidos', purchase.taxWithheld],
    ['Total', purchase.total],
    ['ID de sucursal', purchase.branchId ?? 'Sin sucursal'],
    ['Nombre de archivo XML', purchase.xml.filename],
    ['Hash XML', purchase.xml.hash],
    ['Importado el', purchase.importedAt],
  ] as const

const lineHeaders = [
  'Partida',
  'Descripción',
  'SKU proveedor',
  'Código SAT',
  'Cantidad / unidad',
  'Precio unitario',
  'Importe',
  'Descuento',
  'Impuestos trasladados',
  'Impuestos retenidos',
  'Objeto de impuesto',
]
const relationHeaders = [
  'Partida',
  'Metadatos técnicos',
  'Relación comercial',
  'Estado',
]
const cellClass = 'border-b border-border px-2 py-2'

const lineRows = (lines: PurchaseLine[]): TableRow[] =>
  lines.map((line) => ({
    key: line.id,
    cells: [
      line.lineNumber,
      line.description,
      line.supplierSku,
      line.satProductCode,
      `${line.quantity} ${line.unit} (${line.unitCode})`,
      line.unitPrice,
      line.amount,
      line.discount,
      line.taxTransferred,
      line.taxWithheld,
      line.taxObject,
    ],
  }))

const relationRows = (
  lines: PurchaseLine[],
  supplierProducts: Record<string, SupplierProduct>,
  supplierContext: string,
  resourcesApi: ResourcesMasterRestReadApi,
  linkSupplierProduct: ComprasRestApi['linkSupplierProduct'],
  unlinkSupplierProduct: ComprasRestApi['unlinkSupplierProduct'],
  setPurchaseLineLinkStatus: ComprasRestApi['setPurchaseLineLinkStatus'],
  onLineChanged: () => Promise<void>,
): TableRow[] =>
  lines.map((line) => ({
    key: line.id,
    cells: [
      line.lineNumber,
      <div
        aria-label={`Metadatos técnicos de partida ${line.lineNumber}`}
        className="grid gap-1"
      >
        <span>ID de partida: {line.id}</span>
        <span>ID de compra: {line.purchaseId}</span>
      </div>,
      <div className="grid gap-2">
        {line.supplierProductId === null ? (
          <div
            role="region"
            aria-label={`Relación de partida ${line.lineNumber}`}
            className="grid gap-1"
          >
            <span>Sin producto de proveedor</span>
            <p>
              No existe una operación publicada para asociar esta partida a un
              Producto de Proveedor existente. Por eso no está disponible
              seleccionar ni vincular un Recurso Maestro.
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label={`Relación de partida ${line.lineNumber}`}
            className="grid gap-1"
          >
            <span>
              Producto de Proveedor:{' '}
              {supplierProducts[line.supplierProductId]?.description}
            </span>
            <span>
              SKU publicado:{' '}
              {supplierProducts[line.supplierProductId]?.supplierSku}
            </span>
            <span>
              ID publicado: {supplierProducts[line.supplierProductId]?.id}
            </span>
            <span>
              Recurso Maestro:{' '}
              {supplierProducts[line.supplierProductId]?.resourceId ??
                'No hay Recurso Maestro vinculado'}
            </span>
          </div>
        )}
        {line.linkStatus === 'NO_APLICA' && (
          <span>No aplica a un recurso maestro</span>
        )}
        {line.supplierProductId !== null &&
          (line.linkStatus === 'PENDIENTE' ||
            line.linkStatus === 'CONFLICTO') && (
            <>
              <VincularPartidaSurface
                supplierProductId={line.supplierProductId}
                supplierContext={supplierContext}
                resourcesApi={resourcesApi}
                linkSupplierProduct={linkSupplierProduct}
                onLinked={onLineChanged}
              />
              <MarcarNoAplicaAction
                purchaseLineId={line.id}
                supplierProductId={line.supplierProductId}
                setPurchaseLineLinkStatus={setPurchaseLineLinkStatus}
                onMarked={onLineChanged}
              />
            </>
          )}
        {line.supplierProductId === null &&
          (line.linkStatus === 'PENDIENTE' ||
            line.linkStatus === 'CONFLICTO') && (
            <MarcarNoAplicaAction
              purchaseLineId={line.id}
              supplierProductId={line.supplierProductId}
              setPurchaseLineLinkStatus={setPurchaseLineLinkStatus}
              onMarked={onLineChanged}
            />
          )}
        {line.supplierProductId !== null && line.linkStatus === 'VINCULADO' && (
          <DesvincularPartidaSurface
            supplierProductId={line.supplierProductId}
            unlinkSupplierProduct={unlinkSupplierProduct}
            onUnlinked={onLineChanged}
          />
        )}
      </div>,
      <PartidaEstadoBadge status={line.linkStatus} />,
    ],
  }))

function LineTable({
  label,
  headers,
  rows,
}: {
  label: string
  headers: readonly string[]
  rows: readonly TableRow[]
}) {
  return (
    <div role="region" aria-label={label} className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className={cellClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, cells }) => (
            <tr key={key}>
              {cells.map((value, index) => (
                <td key={`${key}-${index}`} className={cellClass}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CompraDetalleStage({
  api,
  purchaseId,
  onBack,
  resourcesApi,
}: CompraDetalleStageProps) {
  const detailRef = useRef<HTMLElement>(null)
  const [defaultResourcesApi] = useState(() => createResourcesMasterRestApi())
  const [defaultComprasApi] = useState(() => createComprasRestApi())
  const effectiveResourcesApi = resourcesApi ?? defaultResourcesApi
  const getSupplierProduct =
    api.getSupplierProduct ?? defaultComprasApi.getSupplierProduct
  const query = useQuery<Detail>({
    queryKey: ['compras', 'purchase-detail', purchaseId],
    enabled: Boolean(purchaseId),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async ({ signal }) => {
      const id = purchaseId!
      const [purchase, lines] = await Promise.all([
        api.getPurchase({ id, signal }),
        api.listPurchaseLines({ purchaseId: id, signal }),
      ])
      const supplierProductIds = [
        ...new Set(
          lines.flatMap((line) =>
            line.supplierProductId === null ? [] : [line.supplierProductId],
          ),
        ),
      ]
      const supplierProducts = Object.fromEntries(
        await Promise.all(
          supplierProductIds.map(
            async (supplierProductId) =>
              [
                supplierProductId,
                await getSupplierProduct({ id: supplierProductId, signal }),
              ] as const,
          ),
        ),
      )
      return { purchase, lines, supplierProducts }
    },
  })

  useEffect(() => {
    if (purchaseId && query.data) detailRef.current?.focus()
  }, [purchaseId, query.data])

  if (!purchaseId) return null
  if (query.isPending) return <p role="status">Cargando detalle de compra…</p>
  if (query.isError && !query.data) {
    return (
      <div role="alert" className="grid gap-3 text-sm text-text-secondary">
        <p>No se pudo cargar el detalle de la compra.</p>
        <Button variant="outline" onPress={() => void query.refetch()}>
          Reintentar detalle
        </Button>
      </div>
    )
  }

  const detail = query.data
  if (!detail) return null
  const refreshDetail = async () => {
    await query.refetch({ throwOnError: true })
  }
  return (
    <section
      ref={detailRef}
      tabIndex={-1}
      aria-labelledby="compra-detail-title"
      className="grid gap-4 outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="compra-detail-title" className="text-base font-bold">
          Detalle de compra
        </h2>
        <Button variant="outline" onPress={onBack}>
          Volver al historial
        </Button>
      </div>
      <section
        aria-label="Datos originales de la compra"
        className="grid gap-3"
      >
        <h3 className="text-sm font-bold">Documento original</h3>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          {fields(detail.purchase).map(([label, value]) => (
            <div key={label}>
              <dt className="font-bold text-text-primary">{label}</dt>
              <dd className="break-words text-text-secondary">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="compra-lines-title" className="grid gap-3">
        <h3 id="compra-lines-title" className="text-sm font-bold">
          Partidas
        </h3>
        {detail.lines.length === 0 ? (
          <p role="status">No hay partidas para esta compra.</p>
        ) : (
          <>
            <LineTable
              label="Datos originales de partidas"
              headers={lineHeaders}
              rows={lineRows(detail.lines)}
            />
            <LineTable
              label="Relaciones de partidas"
              headers={relationHeaders}
              rows={relationRows(
                detail.lines,
                detail.supplierProducts,
                detail.purchase.supplierId,
                effectiveResourcesApi,
                api.linkSupplierProduct,
                api.unlinkSupplierProduct,
                api.setPurchaseLineLinkStatus,
                refreshDetail,
              )}
            />
          </>
        )}
      </section>
    </section>
  )
}

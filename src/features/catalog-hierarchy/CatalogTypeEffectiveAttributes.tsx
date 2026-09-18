import { useCallback, useEffect, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { CrearAtributoSurface } from './CrearAtributoSurface'
import { CatalogTypeEffectiveAttributeDetail } from './CatalogTypeEffectiveAttributeDetail'
import type { CatalogAttributeCreationContext } from './catalogAttributeCreation.types'
import type { CatalogOptionsAdminApi } from './catalogOptionsAdmin.types'
import type { EffectiveAttribute } from './catalogTypeEffectiveAttributes.types'
import type { useCatalogAttributeCreation } from './useCatalogAttributeCreation'
import type { CatalogTypeEffectiveAttributesStatus } from './useCatalogTypeEffectiveAttributes'

const unavailableOptionsApi: CatalogOptionsAdminApi = {
  resolveReferences: async () => {
    throw new Error('Options administration is unavailable')
  },
  list: async () => ({ records: [], hasPrevious: false, hasNext: false }),
  create: async () => {
    throw new Error('Options administration is unavailable')
  },
  update: async () => {
    throw new Error('Options administration is unavailable')
  },
  deactivate: async () => {
    throw new Error('Options administration is unavailable')
  },
  reactivate: async () => {
    throw new Error('Options administration is unavailable')
  },
}

type DetailState = {
  characteristicCode: string
  opener: HTMLElement | null
}

function EffectiveAttributeRow({
  attribute,
  rowIndex,
  onOpenDetail,
}: {
  attribute: EffectiveAttribute
  rowIndex: number
  onOpenDetail: (characteristicCode: string, opener: HTMLElement | null) => void
}) {
  const descriptor = [
    attribute.characteristic.code,
    attribute.characteristic.valueType,
  ].join(' · ')

  const rowRef = useRef<HTMLButtonElement>(null)

  return (
    <li>
      <Button
        aria-label={`Ver detalle de ${attribute.characteristic.name}`}
        className="min-h-16 w-full flex-col items-start justify-between gap-3 rounded-lg border-border bg-surface-subtle px-4 py-3 text-left hover:border-border-strong hover:bg-surface sm:min-h-14 sm:flex-row sm:items-center"
        data-catalog-level="attributes"
        data-spatial-id={`catalog.row.attributes.effective.${rowIndex}`}
        onClick={() =>
          onOpenDetail(attribute.characteristic.code, rowRef.current)
        }
        ref={rowRef}
        variant="outline"
      >
        <span className="min-w-0 space-y-1">
          <span className="block break-words text-sm font-bold text-text-primary">
            {attribute.characteristic.name}
          </span>
          <span className="block text-xs font-medium tracking-wide text-text-secondary">
            {descriptor}
          </span>
        </span>
      </Button>
    </li>
  )
}

export function CatalogTypeEffectiveAttributes({
  status,
  isFresh = false,
  attributes,
  retry,
  fallbackFocus,
  optionsApi,
  context,
  creation,
  actorAvailable,
  refreshEffective,
}: {
  status: CatalogTypeEffectiveAttributesStatus
  isFresh?: boolean
  attributes: readonly EffectiveAttribute[]
  retry: () => void
  fallbackFocus: () => HTMLElement | null
  optionsApi?: CatalogOptionsAdminApi
  context?: Readonly<{
    sessionId?: string
    classCode?: string
    familyCode?: string
    typeCode?: string
  }>
  creation?: ReturnType<typeof useCatalogAttributeCreation>
  actorAvailable?: boolean
  refreshEffective?: (
    snapshot: CatalogAttributeCreationContext,
  ) => Promise<boolean>
}) {
  const [detail, setDetail] = useState<DetailState | null>(null)
  const detailRef = useRef(detail)
  const fallbackFocusRef = useRef(fallbackFocus)
  detailRef.current = detail
  fallbackFocusRef.current = fallbackFocus
  const detailAttribute =
    detail !== null && (status === 'loading' || status === 'ready')
      ? (attributes.find(
          (attribute) =>
            attribute.characteristic.code === detail.characteristicCode,
        ) ?? null)
      : null
  const detailIsCurrent = detailAttribute !== null
  const creationContext = {
    sessionId: context?.sessionId,
    classCode: context?.classCode ?? '',
    familyCode: context?.familyCode ?? '',
    typeCode: context?.typeCode ?? '',
  }

  const closeDetail = useCallback(() => {
    const current = detailRef.current
    if (!current) return
    setDetail(null)
    restoreFocusNextFrame(current.opener, [fallbackFocusRef.current])
  }, [])

  useEffect(() => {
    if (detail !== null && !detailIsCurrent) closeDetail()
  }, [detail, detailIsCurrent, closeDetail])

  return (
    <div
      className="space-y-4"
      role="tabpanel"
      id="catalog-attributes-panel"
      aria-labelledby="catalog-attributes-tab"
    >
      <header className="border-b border-border pb-4">
        <h3 className="m-0 text-lg font-bold tracking-tight text-text-primary">
          Atributos efectivos del Tipo
        </h3>
        <p className="mt-1 text-sm font-semibold text-text-primary">
          Resueltos por Core · Sólo lectura
        </p>
        <p
          className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary"
          id="catalog-effective-read-only-reason"
        >
          La edición y gestión de opciones existentes no están disponibles en
          esta lectura de sólo consulta.
        </p>
        {creation && (
          <div className="mt-4" data-contextual-action="attribute">
            <CrearAtributoSurface
              actorAvailable={actorAvailable ?? false}
              context={creationContext}
              creation={creation}
              effectiveCharacteristicCodes={attributes.map(
                (attribute) => attribute.characteristic.code,
              )}
              effectiveFresh={isFresh}
              effectiveStatus={status}
            />
          </div>
        )}
      </header>
      {status === 'waiting-context' && (
        <p
          className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
          role="status"
        >
          Seleccioná Clase, Familia y Tipo para consultar atributos efectivos.
        </p>
      )}
      {status === 'loading' && (
        <p
          className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
          role="status"
        >
          Cargando atributos efectivos…
        </p>
      )}
      {status === 'empty' && (
        <p
          className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
          role="status"
        >
          No hay atributos efectivos para este contexto.
        </p>
      )}
      {status === 'error' && (
        <div
          className="flex flex-col items-start gap-3 rounded-lg border border-primary bg-primary-subtle px-4 py-3 text-sm text-text-primary sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="m-0">No se pudieron cargar los atributos efectivos.</p>
          <Button variant="outline" onPress={retry}>
            Reintentar atributos efectivos
          </Button>
        </div>
      )}
      {status === 'ready' && (
        <section aria-label="Atributos efectivos">
          <ul
            aria-label="Atributos efectivos"
            className="m-0 list-none space-y-2 p-0"
          >
            {attributes.map((attribute, rowIndex) => (
              <EffectiveAttributeRow
                attribute={attribute}
                key={`${attribute.characteristic.code}-${rowIndex}`}
                onOpenDetail={(characteristicCode, opener) =>
                  setDetail({ characteristicCode, opener })
                }
                rowIndex={rowIndex}
              />
            ))}
          </ul>
        </section>
      )}
      {detailAttribute !== null && (
        <CatalogTypeEffectiveAttributeDetail
          attribute={detailAttribute}
          isOpen={detailIsCurrent}
          context={context ?? {}}
          optionsApi={optionsApi ?? unavailableOptionsApi}
          refreshEffective={refreshEffective ?? (async () => false)}
          onOpenChange={(isOpen) => {
            if (!isOpen) closeDetail()
          }}
        />
      )}
    </div>
  )
}

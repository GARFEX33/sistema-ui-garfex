import { useCallback, useEffect, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { CatalogTypeEffectiveAttributeDetail } from './CatalogTypeEffectiveAttributeDetail'
import type { EffectiveAttribute } from './catalogTypeEffectiveAttributes.types'
import type { CatalogTypeEffectiveAttributesStatus } from './useCatalogTypeEffectiveAttributes'

type DetailState = {
  attribute: EffectiveAttribute
  index: number
  opener: HTMLElement | null
}

function EffectiveAttributeRow({
  attribute,
  rowIndex,
  onOpenDetail,
}: {
  attribute: EffectiveAttribute
  rowIndex: number
  onOpenDetail: (
    attribute: EffectiveAttribute,
    index: number,
    opener: HTMLElement | null,
  ) => void
}) {
  const descriptor = [
    attribute.characteristic.code,
    attribute.characteristic.valueType,
  ].join(' · ')

  return (
    <li>
      <article
        className="flex min-h-16 flex-col gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 sm:min-h-14 sm:flex-row sm:items-center sm:justify-between"
        data-catalog-level="attributes"
        data-spatial-id={`catalog.row.attributes.effective.${rowIndex}`}
        tabIndex={0}
      >
        <div className="min-w-0 space-y-1">
          <span className="block break-words text-sm font-bold text-text-primary">
            {attribute.characteristic.name}
          </span>
          <span className="block text-xs font-medium tracking-wide text-text-secondary">
            {descriptor}
          </span>
        </div>
        <Button
          aria-label={`Ver detalle de ${attribute.characteristic.name}`}
          className="self-start sm:self-auto"
          variant="outline"
          onClick={(event) =>
            onOpenDetail(
              attribute,
              rowIndex,
              event.currentTarget instanceof HTMLElement
                ? event.currentTarget
                : null,
            )
          }
        >
          Ver detalle
        </Button>
      </article>
    </li>
  )
}

export function CatalogTypeEffectiveAttributes({
  status,
  attributes,
  retry,
  fallbackFocus,
}: {
  status: CatalogTypeEffectiveAttributesStatus
  attributes: readonly EffectiveAttribute[]
  retry: () => void
  fallbackFocus: () => HTMLElement | null
}) {
  const [detail, setDetail] = useState<DetailState | null>(null)
  const detailRef = useRef(detail)
  const fallbackFocusRef = useRef(fallbackFocus)
  detailRef.current = detail
  fallbackFocusRef.current = fallbackFocus
  const detailIsCurrent =
    status === 'ready' &&
    detail !== null &&
    attributes[detail.index] === detail.attribute

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
          La asignación, edición y gestión de opciones no están disponibles en
          esta lectura de sólo consulta.
        </p>
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
                onOpenDetail={(nextAttribute, index, opener) =>
                  setDetail({ attribute: nextAttribute, index, opener })
                }
                rowIndex={rowIndex}
              />
            ))}
          </ul>
        </section>
      )}
      {detail !== null && (
        <CatalogTypeEffectiveAttributeDetail
          attribute={detail.attribute}
          isOpen={detailIsCurrent}
          onOpenChange={(isOpen) => {
            if (!isOpen) closeDetail()
          }}
        />
      )}
    </div>
  )
}

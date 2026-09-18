import type { ReactNode } from 'react'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import type { CatalogTypeEffectiveAttributesStatus } from './useCatalogTypeEffectiveAttributes'

export interface CatalogTypePresentationProps {
  status: CatalogTypeEffectiveAttributesStatus
  attributes: readonly EffectiveAttribute[]
  selectedTypeLabel?: string
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      className="catalog-summary-panel"
      role="tabpanel"
      id="catalog-presentation-panel"
      aria-labelledby="catalog-presentation-tab"
    >
      <h3>PRESENTACIÓN</h3>
      {children}
    </div>
  )
}

// Read-only: position/hasPosition here are the exact same values Core
// returns for GET .../attributes/effective, confirmed (2026-09-17, see
// odd/tasks/catalogo-presentacion-tab.md) to mirror the real PRESENTACION
// configuration for this Type. Editing them requires a separate,
// not-yet-confirmed backend capability — this panel only reads.
export function CatalogTypePresentation({
  status,
  attributes,
  selectedTypeLabel,
}: CatalogTypePresentationProps) {
  if (status === 'waiting-context')
    return (
      <Panel>
        <p className="catalog-summary-muted">
          Seleccioná un Tipo para ver cómo se arma su nombre de presentación.
        </p>
      </Panel>
    )

  if (status === 'loading')
    return (
      <Panel>
        <p className="catalog-summary-muted" role="status">
          Cargando presentación…
        </p>
      </Panel>
    )

  if (status === 'error')
    return (
      <Panel>
        <p className="catalog-summary-muted" role="alert">
          No se pudo cargar la presentación.
        </p>
      </Panel>
    )

  const positioned = attributes
    .filter((attribute) => attribute.hasPosition)
    .slice()
    .sort((a, b) => a.position - b.position)
  const notPositioned = attributes.filter((attribute) => !attribute.hasPosition)

  return (
    <Panel>
      {positioned.length === 0 ? (
        <p className="catalog-summary-muted" role="status">
          Ningún atributo participa todavía del nombre de presentación.
        </p>
      ) : (
        <>
          <p className="catalog-summary-muted">
            Así se arma el nombre visible, en este orden:
          </p>
          <ol
            aria-label="Atributos que arman el nombre, en orden"
            className="catalog-attribute-panel"
          >
            {positioned.map((attribute, index) => (
              <li
                key={attribute.characteristic.code}
                className="catalog-attribute-row"
              >
                <span className="catalog-attribute-row-header">
                  <span aria-hidden="true">{index + 1}.</span>
                  <span className="catalog-attribute-row-name">
                    {attribute.characteristic.name}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p>
            {selectedTypeLabel && <strong>{selectedTypeLabel} </strong>}
            {positioned
              .map((attribute) => attribute.characteristic.name)
              .join(' ')}
          </p>
        </>
      )}
      {notPositioned.length > 0 && (
        <div>
          <p className="catalog-summary-muted">No participan del nombre:</p>
          <div className="catalog-attribute-badges">
            {notPositioned.map((attribute) => (
              <span key={attribute.characteristic.code}>
                {attribute.characteristic.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

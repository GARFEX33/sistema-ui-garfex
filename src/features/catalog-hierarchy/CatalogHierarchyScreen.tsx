import type {
  CatalogHierarchyItem,
  CatalogHierarchyPresentation,
} from './catalogHierarchy.types'
import './catalogHierarchy.css'

function CatalogRegion({
  label,
  column,
  items,
  selectedId,
  waiting,
  hasChildren = false,
  disabled = false,
}: {
  label: string
  column: 'classes' | 'families' | 'types'
  items: CatalogHierarchyItem[]
  selectedId?: string
  waiting?: string
  hasChildren?: boolean
  disabled?: boolean
}) {
  return (
    <section
      className="catalog-region"
      aria-label={label}
      aria-disabled={disabled || undefined}
    >
      <h3>{label.toUpperCase()}</h3>
      <div className="catalog-region-items">
        {items.length ? (
          items.map((item) => (
            <button
              className={`catalog-item${item.id === selectedId ? ' is-selected' : ''}`}
              key={item.id}
              type="button"
              aria-pressed={item.id === selectedId}
              data-spatial-id={`catalog.row.${column}.${item.id}`}
              data-spatial-column={column}
              data-catalog-level={column}
            >
              {item.label}
              {hasChildren && (
                <span className="catalog-row-chevron" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          ))
        ) : (
          <p className="catalog-region-state">{waiting ?? 'Sin selección.'}</p>
        )}
      </div>
    </section>
  )
}

export function CatalogHierarchyScreen({
  presentation,
}: {
  presentation?: CatalogHierarchyPresentation
}) {
  const classes = presentation?.classes ?? []
  const families = presentation?.families ?? []
  const types = presentation?.types ?? []
  const selectedClass = classes.find(
    (item) => item.id === presentation?.selectedClassId,
  )
  const selectedFamily = families.find(
    (item) => item.id === presentation?.selectedFamilyId,
  )
  const selectedType = types.find(
    (item) => item.id === presentation?.selectedTypeId,
  )
  const selectedPath =
    selectedClass && selectedFamily && selectedType
      ? {
          classLabel: selectedClass.label,
          familyLabel: selectedFamily.label,
          typeLabel: selectedType.label,
        }
      : null

  return (
    <section
      className="catalog-hierarchy-screen"
      aria-labelledby="catalog-hierarchy-title"
    >
      <header className="catalog-hierarchy-header">
        <h1 id="catalog-hierarchy-title">Catálogo</h1>
      </header>
      <div className="catalog-main">
        <div className="catalog-model-bar" aria-label="Modelo del catálogo">
          <span>MODELO DEL CATÁLOGO</span>
          <strong>Clase&nbsp; → &nbsp;Familia&nbsp; → &nbsp;Tipo</strong>
        </div>
        <div className="catalog-workstation">
          <div className="catalog-browser" aria-label="Estructura del catálogo">
            <h2>ESTRUCTURA DEL CATÁLOGO</h2>
            <div className="catalog-browser-columns">
              <CatalogRegion
                label="Clases"
                column="classes"
                items={classes}
                selectedId={presentation?.selectedClassId}
                hasChildren
              />
              <CatalogRegion
                label="Familias"
                column="families"
                items={families}
                selectedId={presentation?.selectedFamilyId}
                waiting="Seleccioná una Clase."
                hasChildren
                disabled={!selectedClass}
              />
              <CatalogRegion
                label="Tipos"
                column="types"
                items={types}
                selectedId={presentation?.selectedTypeId}
                waiting="Seleccioná una Familia."
                disabled={!selectedFamily}
              />
            </div>
          </div>
          <aside className="catalog-summary" aria-label="Lectura del catálogo">
            <p className="catalog-summary-path">
              {selectedPath
                ? `CLASE / FAMILIA / TIPO · ${selectedPath.classLabel} / ${selectedPath.familyLabel} / ${selectedPath.typeLabel}`
                : 'VISTA DE ESPERA · SIN SELECCIÓN'}
            </p>
            <h2>{selectedType?.label ?? 'Sin selección'}</h2>
            <p className="catalog-summary-copy">
              {selectedPath
                ? `Este Tipo pertenece a la Familia ${selectedPath.familyLabel}.\nSu relación padre no puede modificarse.`
                : 'Seleccioná una entidad para ver su lectura nominal.'}
            </p>
            <div className="catalog-summary-divider" />
            <h3>CAPACIDADES POSTERIORES</h3>
            <p className="catalog-summary-muted">
              Fuera de este cambio de jerarquía base.
            </p>
          </aside>
        </div>
      </div>
      <footer className="catalog-meaning" aria-label="Regla de jerarquía">
        <p>
          Primero definís una Clase, después una Familia y finalmente un Tipo.
        </p>
        <p>Las relaciones padre permanecen inmutables.</p>
      </footer>
    </section>
  )
}

export function CatalogHierarchyScreen() {
  return (
    <section aria-labelledby="catalog-hierarchy-title">
      <h1 id="catalog-hierarchy-title">Catálogo</h1>
      <p>Clase → Familia → Tipo</p>
      <div aria-label="Estructura del catálogo">
        <section aria-label="Clases">
          <h2>Clase</h2>
          <p>Sin selección.</p>
        </section>
        <section aria-label="Familias" aria-disabled="true">
          <h2>Familia</h2>
          <p>Seleccioná una Clase.</p>
        </section>
        <section aria-label="Tipos" aria-disabled="true">
          <h2>Tipo</h2>
          <p>Seleccioná una Familia.</p>
        </section>
      </div>
    </section>
  )
}

import { operationsInboxFixtures as fixture } from './operationsInbox.fixtures'

export function ApprovedPopulatedInbox() {
  return (
    <div className="approved-inbox-frame" data-testid="approved-inbox-frame">
      <p className="sr-only">
        Fixtures de presentación: page04.png es la autoridad visual; no son
        datos reales ni contrato de backend.
      </p>
      <aside className="approved-rail" aria-label="Navegación de evidencia">
        <div className="approved-brand">GARFEX</div>
        <nav aria-label="Áreas de evidencia">
          <span className="approved-nav-active">
            Bandeja <strong>{fixture.pendingCount}</strong>
          </span>
          <span className="approved-nav-inert">Recursos</span>
          <span className="approved-nav-inert">Catálogo</span>
          <span className="approved-nav-inert">Actividad</span>
        </nav>
      </aside>
      <div className="approved-workspace">
        <header className="approved-topbar">
          <span className="approved-command">
            Buscar o ejecutar comando… <kbd>Ctrl/Cmd + K</kbd>
          </span>
          <span className="approved-context">● Activo</span>
        </header>
        <main className="approved-main">
          <p className="approved-eyebrow">{fixture.eyebrow}</p>
          <h1>{fixture.title}</h1>
          <span className="approved-view">{fixture.view}</span>
          <div
            className="approved-indicators"
            aria-label="Indicadores de evidencia"
          >
            {fixture.indicators.map((indicator) => (
              <div className="approved-indicator" key={indicator.label}>
                <span>{indicator.label}</span>
                <strong>{indicator.value}</strong>
              </div>
            ))}
          </div>
          <span className="approved-save-view">Guardar vista</span>
          <div className="approved-filters" aria-label="Filtros de evidencia">
            {fixture.filters.map((filter) => (
              <span key={filter}>{filter}</span>
            ))}
          </div>
          <div className="approved-actions" aria-label="Acciones de evidencia">
            {fixture.actions.map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
          <div className="approved-content-grid">
            <div className="approved-list-heading">{fixture.listHeading}</div>
            <table aria-label={fixture.title}>
              <thead>
                <tr>
                  <th aria-label="Seleccionar" />
                  <th>Tipo</th>
                  <th>Elemento</th>
                  <th>Motivo / Estado</th>
                  <th>Origen</th>
                  <th>Hace</th>
                </tr>
              </thead>
              <tbody>
                {fixture.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td aria-hidden="true">
                      {[0, 3, 4, 6].includes(index) ? '□' : '■'}
                    </td>
                    <td>{row.type}</td>
                    <td>{row.subject}</td>
                    <td>{row.status}</td>
                    <td>{row.origin}</td>
                    <td>{row.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <aside
              className="approved-context-panel"
              aria-label="Panel contextual de evidencia"
            >
              <p>ELEMENTO SELECCIONADO · RECURSO</p>
              <h2>{fixture.contextPanel.heading}</h2>
              {fixture.contextPanel.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </aside>
          </div>
          <footer
            className="approved-shortcuts"
            aria-label="Referencia de atajos"
          >
            {fixture.shortcuts.map((shortcut) => (
              <span key={shortcut}>{shortcut}</span>
            ))}
          </footer>
        </main>
      </div>
    </div>
  )
}

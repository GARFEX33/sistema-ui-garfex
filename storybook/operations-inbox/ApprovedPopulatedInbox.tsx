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
          <span className="approved-nav-active">Bandeja</span>
          <span className="approved-nav-inert">Recursos</span>
          <span className="approved-nav-inert">Catálogo</span>
          <span className="approved-nav-inert">Actividad</span>
        </nav>
      </aside>
      <div className="approved-workspace">
        <header className="approved-topbar">
          <span className="approved-context">Operaciones</span>
          <span className="approved-command">
            Buscar o ejecutar comando… <kbd>Ctrl/Cmd + K</kbd>
          </span>
        </header>
        <main className="approved-main">
          <p className="approved-eyebrow">{fixture.eyebrow}</p>
          <h1>{fixture.title}</h1>
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
            <table aria-label={fixture.title}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Pendiente</th>
                  <th>Origen</th>
                  <th>Antigüedad</th>
                </tr>
              </thead>
              <tbody>
                {fixture.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>{row.subject}</td>
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
              <h2>{fixture.contextPanel.heading}</h2>
              <p>{fixture.contextPanel.detail}</p>
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

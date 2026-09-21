export function PartidasPendientesBlockedSurface() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Partidas pendientes entre compras"
      className="rounded-md border border-dashed border-border bg-surface-subtle p-4 text-text-secondary"
    >
      <h2 className="m-0 text-base font-bold text-text-secondary">
        Partidas pendientes entre compras
      </h2>
      <p className="mb-0 mt-2 text-sm leading-6 text-text-secondary">
        Esta vista todavía no está disponible: el backend de Compras no publica
        hoy un listado transversal de partidas por estado. Para resolver una
        partida pendiente, abrí la compra correspondiente desde el historial de
        su proveedor.
      </p>
    </section>
  )
}

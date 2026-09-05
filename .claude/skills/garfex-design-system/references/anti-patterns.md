# Anti-patrones prohibidos

Si el trabajo planeado coincide con alguno de estos, detenerse y reusar/promover en vez de proceder:

- Copiar componentes entre features.
- Duplicar CSS para el mismo concepto.
- Inventar colores fuera de tokens.
- Repetir HEX arbitrarios.
- Abusar de arbitrary values de Tailwind.
- Crear botones distintos por feature.
- Crear tablas distintas para el mismo patrón.
- Crear paginadores distintos.
- Duplicar PageHeader.
- Duplicar EmptyState.
- Duplicar loaders.
- Crear componentes shared por una única ocurrencia.
- Mover lógica de negocio prematuramente a shared.
- Crear una pantalla visualmente distinta sin una necesidad UX documentada.

## Principio rector

No estamos construyendo páginas independientes. Estamos construyendo un producto GARFEX sobre un Design System compartido. Cada nueva feature debe fortalecer ese sistema en lugar de crear una nueva interpretación visual del producto.

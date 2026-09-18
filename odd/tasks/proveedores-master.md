# Feature: Maestro de Proveedores

## Objetivo

Página y CRUD del Maestro de Proveedores, mismo patrón funcional/visual que Recursos maestros (`src/features/resources-master`).

## Problema / por qué

El backend (`garfex-api`, REST, `/v1`) ya expone el dominio de proveedores. El frontend no tiene ningún feature para administrarlo.

## Decisión de alcance (usuario, 2026-09-18)

El design brief (`docs/erp-first-stage-design-brief.md:43`) excluye explícitamente "flujos completos de compras y proveedores" de esta primera etapa. El usuario confirmó que lo que se construye acá es **solo el maestro de Proveedores** (CRUD de datos maestros — nombre, identificador fiscal, contacto, etc.), análogo a Recursos maestros, **sin** flujos de compra/orden de compra. Es una ampliación acotada de scope, no lo que el brief excluye.

## Contrato de backend (verificado en vivo, `GET http://localhost:8090/openapi.yaml`, caja negra — nunca leer código de `garfex-api`)

- `GET /v1/suppliers` — búsqueda paginada (`scope: ACTIVE|INACTIVE|ALL`, `text`, `limit` ≤50, `offset`) → `SupplierPage { suppliers[], hasPrevious, hasNext }`.
- `POST /v1/suppliers` — crea (`SupplierCreateRequest { actor(required), tradeName, legalName, taxIdentifier, website, notes }`) → `Supplier` (201).
- `GET /v1/suppliers/{id}` — detalle.
- `PUT /v1/suppliers/{id}` — reemplazo completo (`SupplierUpdateRequest`, mismos campos que create; **sin** `expectedRevision` — a diferencia de Resource, Supplier no usa concurrencia optimista).
- `Supplier { id, tradeName, legalName, taxIdentifier, website, notes, active, createdAt, updatedAt }`.
- `GET /v1/suppliers/{id}/branches`, `GET /v1/suppliers/{id}/branches/{branchId}` — solo lectura (`Branch`).
- `GET /v1/suppliers/{id}/contacts`, `GET /v1/suppliers/{id}/contacts/{contactId}` — solo lectura (`Contact`).

**Restricción real, no negociable en esta iteración:** no existe `deactivate`/`reactivate`/`delete` para Supplier (a diferencia de `catalog` y `resources`, que sí los tienen). No existe `POST`/`PUT` para branches/contacts. El CRUD posible es **Crear, Listar/Buscar, Editar** únicamente. No prometer baja lógica ni edición de branches/contacts hasta que el backend la exponga.

## Decisiones de UI (siguiendo `garfex-design-system`)

- Reusar `PageHeader`, `WorkCard`, `Dialog`, `Field`, `Button` de `src/shared/ui/` — no crear equivalentes locales.
- Mismo patrón visual/estructural que `ResourcesMasterScreen` (lista + búsqueda + card) para la lista; mismo patrón de diálogo modal que las creaciones de catálogo (form flat, no wizard — el dominio Supplier no tiene jerarquía) para crear/editar.
- Nuevo link de navegación de nivel superior "Proveedores" en `AppShell`, análogo a "Recursos maestros" (no anidado bajo el placeholder estático "Compras", que sigue fuera de alcance).
- Nueva superficie de teclado (`activeSurface: 'proveedores'`) registrada en el subsistema de teclado (`src/shared/keyboard/`), Tab/Escape/spatial-nav consistentes con las pantallas existentes.

## Cambios de arquitectura deliberados (no workarounds — declarar explícitamente)

- Agregar `src/features/proveedores/proveedores.api.ts` al allowlist de `tests/architecture/restTransportBoundaries.test.ts`.
- `tests/architecture/catalogHierarchyBoundaries.test.ts` fija `expect(shell.match(/<Link/g)).toHaveLength(3)` — subirá a 4 al agregar el link de Proveedores; actualizar el test deliberadamente.
- Revisar si el tipo de unión de `activeSurface` en el subsistema de teclado necesita el nuevo valor `'proveedores'`.

## TDD

Strict TDD activo (`openspec/config.yaml` + system config). RED → GREEN → REFACTOR por tarea. Runner: Vitest (`pnpm exec vitest run <archivo>`).

## Tareas

- [x] **T1 — Tipos + adapter REST** (`proveedores.types.ts`, `proveedores.api.ts`): parseo/validación de `Supplier`/`SupplierPage`, `listSuppliers`, `createSupplier`, `getSupplier`, `updateSupplier`. Allowlist de arquitectura actualizado. Tests unitarios del adapter.
- [x] **T2 — Lista/búsqueda** (`useProveedoresRestWindow.ts`, `ProveedoresScreen.tsx`, `ProveedoresEntry.tsx`): ventana paginada mirror de `useResourcesMasterRestWindow`, búsqueda por texto, `PageHeader`+`WorkCard`, spatial-nav en filas.
- [ ] **T3 — Crear proveedor** (`CrearProveedorSurface.tsx`): diálogo modal, validación mínima, refresco de lista tras crear (cuidado: bug conocido en Recursos fue que la lista no se refrescaba tras crear — verificar invalidación real).
- [ ] **T4 — Editar proveedor** (`EditarProveedorSurface.tsx`): diálogo precargado, `PUT` sin `expectedRevision`.
- [ ] **T5 — Ruteo + navegación + teclado** (`src/app/routes/proveedores.tsx`, `AppShell.tsx`, subsistema de teclado, actualización deliberada de los tests de arquitectura afectados) + smoke e2e.

## Fuera de alcance explícito (no asumir, no implementar)

- Baja/reactivación de proveedores (backend no lo soporta).
- CRUD de branches/contacts (backend es solo lectura para ellos). Vista de solo lectura de branches/contacts queda como trabajo futuro, no parte de estas tareas.
- Cualquier flujo de compras/órdenes de compra.

## Progreso

(se actualiza tarea por tarea con evidencia de tests, typecheck/lint, y commit)

- **T1** (2026-09-18): `proveedores.types.ts` + `proveedores.api.ts` creados (RED→GREEN); `tests/unit/proveedoresApi.test.ts` — 16/16 passed; `tests/architecture/restTransportBoundaries.test.ts` — 5/5 passed tras agregar el adapter al allowlist; `pnpm typecheck` y `pnpm lint` sin errores.
- **T2** (2026-09-18): `useProveedoresRestWindow.ts` (mirror de `useResourcesMasterRestWindow`, texto enviado al backend sin bug documentado a diferencia de Recursos) + `ProveedoresScreen.tsx` (header+card+tabla, sin acción de creación, atributos `data-spatial-id="proveedores.search"` / `data-spatial-id="proveedores.<id>"` / `data-supplier-row` para spatial-nav futura) + `ProveedoresEntry.tsx` creados (RED→GREEN, RED confirmado moviendo temporalmente cada archivo nuevo y viendo fallar el import antes de restaurarlo). `tests/unit/useProveedoresRestWindow.test.tsx` — 6/6 passed; `tests/unit/proveedoresScreen.test.tsx` — 10/10 passed; `tests/unit/proveedoresApi.test.ts` — 16/16 passed (sin tocar T1); `tests/architecture/restTransportBoundaries.test.ts` — 5/5 passed; `pnpm typecheck` y `pnpm lint` sin errores. No se creó ruta ni se tocó `AppShell.tsx`/`src/shared/keyboard/` (T5).

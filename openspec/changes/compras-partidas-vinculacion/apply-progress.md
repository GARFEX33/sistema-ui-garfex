# Apply progress — compras-partidas-vinculacion

## Status

- Phase: `apply`
- Result: `completed` for the assigned U1A, U1B, U2A, and U2B slices; U3+ were not started.
- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, `applyState: ready`, `nextRecommended: apply`.
- Action context consumed: `mode: repo-local`; workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex`; allowed edit root is the repository workspace. No unsafe-root warning was present.
- Skill resolution: `paths-injected`; loaded `.agents/skills/garfex-design-system/SKILL.md` and `/home/garfex/.agents/skills/work-unit-commits/SKILL.md`, plus strict-TDD support guidance.
- Workload decision consumed: `feature-branch-chain`; no branch, commit, push, PR, review lifecycle, or `size:exception` was used.

## Remediation and task split

- Updated `design.md` §13 from nine units to eleven units: U1A READ contracts/schemas/errors, U1B multipart import and actor-gated mutations, U2A purchases window, U2B supplier-products window, then U3–U9.
- Updated `tasks.md` to eleven units and 47 checkbox rows (44 implementation, 3 parent), with an aggregate forecast of approximately 2,930 authored lines; every completed slice remains below 400 while the aggregate remains high risk.
- The failed attempts' combined U1 and U2 completion claims are explicitly marked superseded; they are not completion evidence.
- U1A, U1B, U2A, and U2B implementation-owned rows are visibly `- [x]`; U3 and later implementation rows remain unchecked. Parent-owned rows are preserved.
- Removed the misplaced `src/features/compras/compras.api.test.ts` candidate. The canonical U1A test is `tests/unit/comprasApiReads.test.ts`.

## Historical prior blocked attempt preserved

The previous apply attempt implemented combined U1 import/read/mutation behavior, but its RED test under `src/features/compras/` was not collected by the configured `pnpm test` include, its formatted candidate exceeded the 400-line unit budget at 521 authored lines, and its U1 formatting check failed. That prior state was reset before this U1A RED; no prior undiscovered source test was claimed as RED.

## U1A implementation evidence

U1A now contains only feature-local REST contracts, Zod response schemas, structured GET error handling, and these reads: `getPurchase`, `getPurchaseByUuid`, `listPurchaseLines`, `listSupplierPurchases`, `listSupplierProducts`, `findSupplierProduct`, and `getSupplierProduct`. Decimal values and identifiers remain strings. The source candidate contains no `importPurchase`, `withRestActor`, `FormData`, POST, link, unlink, or link-status implementation. No shared helper was promoted.

Authored U1A count: **399 lines**, calculated as 395 lines in `src/features/compras/compras.types.ts`, `src/features/compras/compras.api.ts`, and `tests/unit/comprasApiReads.test.ts`, plus 4 exact architecture-guard additions. This remains below the strict 400-line ceiling. SDD bookkeeping is excluded.

## Independent verifier follow-up

- Finding addressed: `tests/unit/comprasApiReads.test.ts` now passes the same `AbortSignal` to all seven GET calls and asserts every recorded fetch init carries that exact signal, while retaining the accepted URL, encoding, pagination, response, and error assertions.
- Only `tests/unit/comprasApiReads.test.ts` and U1A bookkeeping were changed in this follow-up. Production files and architecture guards were not edited.
- U1B and all later units remain untouched.

## TDD Cycle Evidence

| Task                              | Test file                            | Layer | Safety net                                                                | RED                                                                     | GREEN                                                                                                                                                     | TRIANGULATE                                                                                             | REFACTOR |
| --------------------------------- | ------------------------------------ | ----- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| U1A transport evidence correction | `tests/unit/comprasApiReads.test.ts` | Unit  | Prior U1A focused baseline: 18/18 passed; production and guards unchanged | ➖ Test-only verifier correction; no production behavior was introduced | ✅ All seven GET calls forward the same signal; URLs, encoding, pagination query, response values, and errors remain verified; direct Vitest 18/18 passed | ✅ Replaced the first-call-only assertion without production edits; Prettier passed; final count is 399 |

## Commands and actual results

- RED: `pnpm test -- tests/unit/comprasApiReads.test.ts` — failed as required on the explicit scaffold assertion; this was the canonical `tests/unit/**` test, not the removed `src/**` test.
- Focused configured command: `pnpm test -- tests/unit/comprasApiReads.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` — U1A and architecture tests passed, but the configured run exited 1 because unrelated pre-existing `tests/unit/useCatalogAttributeCreation.test.tsx` test `aborts a pending search on unmount and ignores its late response` failed. No unrelated fix was made.
- Clean focused runner evidence: `pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` — **18 passed, 0 failed**.
- `pnpm typecheck` — passed.
- `pnpm exec prettier --check src/features/compras/compras.types.ts src/features/compras/compras.api.ts tests/unit/comprasApiReads.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts` — passed.
- Architecture guards: REST, Query/Zod, and keyboard transport-isolation guards passed. The keyboard guard contains only the exact approved transport allowlist entry required for its runtime fetch scan; no keyboard listener was added.
- Runtime harness: `N/A` — U1A is a REST/schema boundary without an independent browser surface.

## Changed paths

- `openspec/changes/compras-partidas-vinculacion/design.md`
- `openspec/changes/compras-partidas-vinculacion/tasks.md`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`
- `src/features/compras/compras.types.ts`
- `src/features/compras/compras.api.ts`
- `tests/unit/comprasApiReads.test.ts`
- `tests/architecture/restTransportBoundaries.test.ts`
- `tests/architecture/queryZodBoundaries.test.ts`
- `tests/architecture/keyboardBoundaries.test.ts`
- Removed: `src/features/compras/compras.api.test.ts`

## Remaining tasks and boundaries

U1B remains intentionally deferred and must not begin in this retry:

- [ ] Escribir pruebas fallidas de importación multipart, actor obligatorio, códigos 201/200/409/422, link, unlink y link-status en `tests/unit/comprasApiMutations.test.ts`; no iniciar esta unidad durante el apply de U1A. <!-- sdd-owner: implementation -->
- [ ] Implementar importación y mutaciones sólo después de cerrar U1A, usando `withRestActor` y sin mezclar responsabilidades READ. <!-- sdd-owner: implementation -->
- [ ] Ejecutar el focused command de U1B y verificar envelopes, actor, FormData y respuestas confirmadas sin estados locales inventados. <!-- sdd-owner: implementation -->
- [ ] Mantener U1B independiente, sin promoción de helpers a `shared` y por debajo de 400 líneas autorales. <!-- sdd-owner: implementation -->

All exact unchecked implementation rows for U2–U9 remain in `openspec/changes/compras-partidas-vinculacion/tasks.md` and were not selected, edited, or completed by this apply. No mutation test file was created.

## Deviations and risks

- The repository Vitest configuration still executes the broad `tests/**/*.test.{ts,tsx}` set when `pnpm test -- <paths>` is invoked; the relevant U1A and guard tests pass, but the command remains red because of the unrelated pre-existing `useCatalogAttributeCreation` failure described above.
- U1A intentionally does not implement import or mutations. U1B is the next independent work unit and is not part of this delivery boundary.
- No verify, bounded-review, receipt, delivery-gate, branch, commit, push, PR, or archive action was performed by `sdd-apply`.

## U1B apply update — current slice

- Structured status consumed before editing: change `compras-partidas-vinculacion`, `applyState: ready`, `nextRecommended: apply`, authoritative `openspec` store, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no blocked reasons. `actionContext.mode` was `repo-local`; no unsafe-root warning was present.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, `400-line budget risk: High` for the aggregate and Low for U1B. The parent prompt resolved the delivery path; no `size:exception` was used.
- Skill resolution: `paths-injected`; the injected Design System and work-unit skills were loaded. No UI files were touched, so no additional visual skill work was required.
- U1A remained intact. U1B was the only implementation unit selected; U2 and later units were not started.

### U1B completed tasks and persisted checkbox updates

- `tests/unit/comprasApiMutations.test.ts` RED was written first and persisted as completed in `tasks.md`.
- `src/features/compras/compras.api.ts` now exposes multipart `importPurchase`, JSON `linkSupplierProduct`, `unlinkSupplierProduct`, and `setPurchaseLineLinkStatus`; all mutations use `withRestActor` and preserve `PurchasesRestError` status/code/detail.
- `src/features/compras/compras.types.ts` now contains U1B input/response contracts, including `PurchaseImportResponse.alreadyExisted` and the exact `LinkStatus` union.
- U1B GREEN/TRIANGULATE/REFACTOR rows were marked `- [x]` immediately in `openspec/changes/compras-partidas-vinculacion/tasks.md`; parent-owned rows remain unchanged.
- Multipart behavior covers `file`, resolved `actor`, optional `branchId`, forwarded `AbortSignal`, accepted 201/200 responses, and no manually supplied multipart content type. JSON mutations cover exact POST paths and bodies for link, unlink, and link-status.

### TDD Cycle Evidence

| Task                                           | Test File                                | Layer | Safety Net                         | RED                                                                                                                    | GREEN                                                                                                                      | TRIANGULATE                                                                                                                          | REFACTOR                                                                                     |
| ---------------------------------------------- | ---------------------------------------- | ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| U1B multipart import and actor-gated mutations | `tests/unit/comprasApiMutations.test.ts` | Unit  | ✅ U1A/guard baseline 18/18 passed | ✅ 6 failed because public methods were absent (`TypeError: api.importPurchase/linkSupplierProduct is not a function`) | ✅ Final focused U1B run passed 10/10 after the minimal adapter implementation and async invalid-status rejection contract | ✅ Added 201/200, optional branch, 409/422 envelopes, all four statuses, exact paths/bodies, actor resolution, and signal assertions | ✅ Prettier-normalized adapter/types/tests; direct focused and combined tests remained green |

### Verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/comprasApiMutations.test.ts` — **0 passed, 6 failed**, with absent-public-method TypeErrors as required.
- GREEN/REFACTOR focused U1B: `pnpm exec vitest run tests/unit/comprasApiMutations.test.ts` — **11 passed, 0 failed**.
- Combined U1A + U1B + architecture guards: `pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` — **28 passed, 0 failed**.
- Configured U1B command: `pnpm test -- tests/unit/comprasApiMutations.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts` — **95 files collected; 94 passed, 1 failed (816/817 tests passed)**. The single failure is the unrelated pre-existing `tests/unit/useCatalogAttributeCreation.test.tsx` unmount/late-search identity assertion; no unrelated fix was made. Existing React warnings were also emitted.
- Typecheck: `pnpm typecheck` — passed; route generation completed.
- Prettier: `pnpm exec prettier --check src/features/compras/compras.types.ts src/features/compras/compras.api.ts tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` — passed.
- Runtime harness: `N/A` — U1B is a REST/schema boundary without an independent browser surface; Vitest transport simulation and architecture guards are the authorized runtime evidence.

### U1B workload and changed paths

- Incremental authored production+test line count: **352 lines** (`747` current lines across `compras.types.ts`, `compras.api.ts`, `comprasApiReads.test.ts`, and `comprasApiMutations.test.ts` minus the closed U1A baseline of `395` lines). SDD artifacts and the four previously authored architecture-guard lines are excluded. This is below the 400-line unit ceiling; no exception was needed.
- Changed U1B paths: `src/features/compras/compras.types.ts`, `src/features/compras/compras.api.ts`, `tests/unit/comprasApiMutations.test.ts`, and the persisted task/progress artifacts. U1A read semantics and its test/guard paths were not changed for U1B.
- PR boundary: U1B only, as the second feature-branch-chain slice after closed U1A. No branch, commit, push, PR, review lifecycle, receipt, or delivery gate was performed.
- Rollback boundary: remove only U1B mutation/import contracts, adapter methods/helpers, and `tests/unit/comprasApiMutations.test.ts`; retain U1A read contracts, tests, and guards.

### Remaining exact unchecked task rows

The following implementation rows remain unchecked and were not selected:

- [ ] Escribir pruebas fallidas de página inicial, avance y retroceso condicionados por `hasNext` y `hasPrevious`, cambio de `supplierId`, abort signal, error y ausencia de proveedor; no probar ni implementar agregación transversal. <!-- sdd-owner: implementation -->
- [ ] Implementar ambos hooks siguiendo el `RestWindow` de Proveedores, con claves que incluyan el proveedor y sin cache como autoridad; añadir sólo sus bindings `useQuery` a `queryZodBoundaries.test.ts`. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/useSupplierPurchasesRestWindow.test.ts tests/unit/useSupplierProductsRestWindow.test.ts tests/architecture/queryZodBoundaries.test.ts` y comprobar que no existe recorrido de proveedores ni acumulación local. <!-- sdd-owner: implementation -->
- [ ] Alinear nombres, estados de carga y reset de ventana con el precedente de Proveedores sin crear un hook genérico transversal; conservar el diff menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas para estado inicial `elegir-proveedor`, proveedor obligatorio, transición confirmada a `historial`, cambio de proveedor, preservación de contexto y reutilización contractual de `StagedSearchSelector`; no añadir todavía importación, detalle ni pendientes. <!-- sdd-owner: implementation -->
- [ ] Implementar la ruta y la composición de U3 con `PageHeader` y `WorkCard` existentes, selector genérico y adapter público de Proveedores; no crear estado global, params de router ni componentes compartidos nuevos. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/comprasNavigation.model.test.ts tests/unit/ComprasScreen.test.tsx tests/unit/ElegirProveedorStage.test.tsx src/app/routes/compras.test.tsx` y `pnpm router:check`; verificar que sin proveedor no aparece una tabla global. <!-- sdd-owner: implementation -->
- [ ] Extraer sólo nombres y helpers locales necesarios, conservar la composición dentro de `src/features/compras/` y mantener el patrón visual de Proveedores y Resources Master; registrar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de título y contexto por proveedor, paginación `hasPrevious` y `hasNext`, selección de compra y resultados 201, 200 `alreadyExisted`, 409, 422 y error; comprobar que falta de actor impide la mutación. <!-- sdd-owner: implementation -->
- [ ] Implementar tabla de historial y `ImportarCompraSurface` siguiendo los patrones de Proveedores, con feedback accesible, cierre sólo tras confirmación y refresh del hook cuando la respuesta pertenece al proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/HistorialComprasStage.test.tsx tests/unit/ImportarCompraSurface.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar que no hay agregación cliente, alta de producto ni presentación de 200 como fallo. <!-- sdd-owner: implementation -->
- [ ] Mantener datos y acciones documentales separados, reutilizar feedback/dialogs existentes y dejar el diff menor de 400 líneas; registrar resultados sin afirmar ejecución de Playwright todavía. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

Deferred parent-owned lifecycle rows remain unchanged:

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## Superseded U2 combined apply attempt — historical, not an independent completion

All RED/GREEN/TRIANGULATE/REFACTOR claims in this historical combined-U2 section are explicitly superseded by the approved U2A/U2B split and are not current completion evidence.

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blocked reasons. `actionContext.mode` was `repo-local`.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; the parent prompt authorized U2 only and did not authorize a size exception. U2 itself was required to remain below 400 authored production/test/guard lines.
- Planning correction completed before source work: U2 test paths in `design.md` and `tasks.md` now use `tests/unit/useSupplierPurchasesRestWindow.test.tsx` and `tests/unit/useSupplierProductsRestWindow.test.tsx`.
- U2 RED tests were written first in the corrected repository-collected paths. The initial direct focused run failed because both production hook modules were absent, which is the required RED evidence.
- U2 GREEN implementation adds only `useSupplierPurchasesRestWindow` and `useSupplierProductsRestWindow`, each using its single explicit supplier endpoint, Query keys containing supplierId/limit/offset, synchronous supplier/limit offset reset, disabled absent-supplier behavior, backend paging flags, signal forwarding, active-query retry/refetch, and stale completion isolation. No aggregation or cross-supplier traversal was added.
- U2 TRIANGULATE focused evidence passed: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **10 passed, 0 failed**. The configured equivalent `pnpm test -- tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **97 files passed, 822 tests passed**. `pnpm typecheck` passed and Prettier passed after the production refactor.
- Query allowlist bindings were added only for the two exact U2 hook paths. No other architecture guard or feature path was changed.
- Incremental authored U2 count after formatting is **421 lines**: 101 + 101 production hook lines, 127 + 86 test lines, and 6 U2 query-guard additions. The separate 2-line `compras.api.ts` guard entry belongs to the already closed U1A/U1B work and is excluded. This exceeds the mandatory `<400` ceiling. One honest cohesive implementation pass is complete; no code compression, test deletion, or size exception was used.
- Because the user required stopping after one over-budget cohesive pass, U2 is not reported as fully complete. RED, GREEN, and TRIANGULATE task rows are checked; REFACTOR remains unchecked pending a parent split decision. U1A/U1B remain intact.

### U2 TDD Cycle Evidence

| Task                                  | Test File                                            | Layer                       | Safety Net                              | RED                                | GREEN                   | TRIANGULATE                                                                              | REFACTOR                               |
| ------------------------------------- | ---------------------------------------------------- | --------------------------- | --------------------------------------- | ---------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| U2 paginated supplier purchase window | `tests/unit/useSupplierPurchasesRestWindow.test.tsx` | Integration-style hook test | ✅ Existing Query guard baseline passed | ✅ Missing-module failure observed | ✅ Focused tests passed | ✅ Initial load, paging gates, supplier reset, no accumulation, signal, stale completion | ⛔ Blocked: authored unit count is 421 |
| U2 paginated supplier product window  | `tests/unit/useSupplierProductsRestWindow.test.tsx`  | Integration-style hook test | ✅ Existing Query guard baseline passed | ✅ Missing-module failure observed | ✅ Focused tests passed | ✅ Paging, absent supplier, initial/navigation errors, signal binding                    | ⛔ Blocked: authored unit count is 421 |

### U2 changed paths

- `openspec/changes/compras-partidas-vinculacion/design.md` — corrected U2 test paths.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — corrected U2 test paths and checked completed RED/GREEN/TRIANGULATE rows.
- `src/features/compras/useSupplierPurchasesRestWindow.ts`
- `src/features/compras/useSupplierProductsRestWindow.ts`
- `tests/unit/useSupplierPurchasesRestWindow.test.tsx`
- `tests/unit/useSupplierProductsRestWindow.test.tsx`
- `tests/architecture/queryZodBoundaries.test.ts`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### U2 remaining task boundary

- [ ] Alinear nombres, estados de carga y reset de ventana con el precedente de Proveedores sin crear un hook genérico transversal; conservar el diff menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->

## U2A remediation — approved purchases-window slice closed; U2B remains absent

- Structured status consumed before this correction: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blocked reasons. `actionContext.mode` was `repo-local`; no unsafe-root warning was present.
- Workload decision consumed: the user approved the real U2A/U2B split, rejected `size:exception`, authorized U2A only, and explicitly prohibited restarting U2B or beginning U3+. No branch, commit, push, PR, review lifecycle, receipt, or delivery gate was performed.
- Planning correction persisted: `design.md` §13 and `tasks.md` now define independent U2A and U2B units. The task forecast is U2A ~231, U2B ~190, aggregate ~2,930 authored lines, with 47 checkbox rows (44 implementation, 3 parent). Later U3–U9 units remain present and unchanged apart from their dependency labels.
- The prior combined U2 RED/GREEN/TRIANGULATE completion claims are superseded by this split. The previously observed configured RED with both hook modules absent is preserved as evidence for U2A's purchases module; no artificial RED was rerun. The combined 421-line candidate is not completion evidence for either slice.
- U2A only: `useSupplierPurchasesRestWindow.ts` and `tests/unit/useSupplierPurchasesRestWindow.test.tsx` remain. The product hook, product test, and only the exact `supplierProductsRestWindowHookPath` Query binding were removed from the current candidate; U2B is therefore absent and pending.
- U2A authored count: **231 lines** — 101 production-hook lines, 127 purchase-test lines, and 3 exact Query-allowlist additions. This is below the mandatory `<400` ceiling; no compression, test deletion, or size exception was used.
- Persisted U2A task rows RED, GREEN, TRIANGULATE, and REFACTOR are checked. All four U2B implementation rows remain unchecked. Parent-owned rows remain byte-for-byte unchanged.

### U2A TDD Cycle Evidence

| Task                         | Test file                                            | Layer                       | Safety Net                             | RED                                                                       | GREEN                                           | TRIANGULATE                                                                                                                               | REFACTOR                                                        |
| ---------------------------- | ---------------------------------------------------- | --------------------------- | -------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U2A supplier purchase window | `tests/unit/useSupplierPurchasesRestWindow.test.tsx` | Integration-style hook test | ✅ 8/8 focused purchase+Query baseline | ✅ Previously observed configured missing-module RED preserved; not rerun | ✅ Existing implementation passes focused tests | ✅ Initial load, backend paging gates, supplier reset, signal forwarding, no accumulation, no global traversal, stale supplier completion | ✅ Split cleanup removed only U2B artifacts; 231 authored lines |

### U2A verification commands and actual results

- `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **8 passed, 0 failed**.
- `pnpm typecheck` — **passed**; route generation completed.
- `pnpm exec prettier --check src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **passed**.
- Runtime harness: `N/A` — this hook has no independent browser boundary; Vitest/RTL and the architecture guard are the authorized runtime evidence.

### U2A coverage gaps reported honestly

- The implementation exposes supplier-required disabled behavior, `initial-error`/`navigation-error` statuses, active retry/refetch guards, and stale active-query protection, but the current purchase-window test does not explicitly assert disabled supplier status, either error status, retry/refetch active safety, or unmount-stale completion. Those are reported gaps, not silently added to U2A.
- The current purchase test does explicitly cover initial load, `hasNext`/`hasPrevious` navigation gates, supplier offset reset, exact Query signal forwarding, no page accumulation, no cross-supplier traversal, and stale completion after supplier change.

### U2A verifier-defect remediation and gap closure

- RED was observed before the production fix by adding the disabled refetch regression: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx` — **3 passed, 1 failed** because `refetchActive()` issued one request with `supplierId: undefined` despite Query `enabled: false`.
- GREEN fixed only U2A: `canRefetch` now requires both the active lifecycle token and a truthy `supplierId`; `retry` and `refetchActive` cannot invoke the query in disabled mode.
- Added behavior-focused tests while preserving the existing paging, supplier reset, signal, stale supplier completion, no-aggregation, and no-append assertions. The purchase-window test now has **8 passed, 0 failed** tests covering disabled/no-supplier callbacks, empty, initial-loading, initial-error, navigation-error, active retry/refetch, stale callbacks after supplier change/unmount, and harmless completion after unmount.
- Final focused verification: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **13 passed, 0 failed**.
- `pnpm typecheck` — **passed** after the fix. The first combined Prettier check identified only the production hook; after formatting it, the final Prettier check passed for the hook, purchase test, and Query guard.
- Final U2A authored count: **330 lines** — 103 production, 224 test, and 3 exact Query-guard lines; still below 400. No U2B or later unit was touched.
- The previously reported U2A gaps are closed for the requested behavior; no remaining U2A coverage gap is known within this test boundary.

### U2A isolated unmount regression follow-up

- Replaced only the non-discriminating unmount portion of `tests/unit/useSupplierPurchasesRestWindow.test.tsx` with an isolated current-lifecycle regression. The test mounts one pending current-supplier request, captures its callbacks and signal, unmounts before resolution, asserts the signal is aborted, invokes both callbacks without a new request, resolves the pending request, and observes no `console.error` React state-update warning.
- Preserved the separate supplier-change stale-callback/completion test and all existing paging, reset, signal, error, retry/refetch, empty, loading, and no-aggregation assertions. No production file, U2B file, or later unit was edited.
- Safety net before test replacement: purchase-window plus Query guard **13 passed, 0 failed**. Test-only regression execution: purchase-window **9 passed, 0 failed**. Final focused verification: purchase-window plus Query guard **14 passed, 0 failed**.
- `pnpm typecheck` — **passed**. `pnpm exec prettier --check tests/unit/useSupplierPurchasesRestWindow.test.tsx src/features/compras/useSupplierPurchasesRestWindow.ts tests/architecture/queryZodBoundaries.test.ts` — **passed**.
- Final U2A authored count: **356 lines** — 103 production, 250 test, and 3 exact Query-guard lines; below 400. U2A closure remains complete and U2B remains absent/pending.

### U2A TDD follow-up evidence

| Task                                          | Test file                                            | Layer                       | Safety Net          | RED                                                                      | GREEN                             | TRIANGULATE                                                                                                        | REFACTOR                                |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------- | ------------------- | ------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Isolated current-lifecycle unmount regression | `tests/unit/useSupplierPurchasesRestWindow.test.tsx` | Integration-style hook test | ✅ 13 focused tests | ➖ Test-only coverage correction; no artificial RED or production change | ✅ 9 purchase-window tests passed | ✅ Current signal abort, post-unmount callbacks, harmless completion, and preserved supplier-change stale behavior | ✅ Kept final U2A at 356 authored lines |

### U2A changed paths

- `openspec/changes/compras-partidas-vinculacion/design.md` — split §13 into U2A/U2B.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — split forecast, units, task count, and persisted U2A/U2B rows.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md` — recorded supersession and U2A evidence.
- `src/features/compras/useSupplierPurchasesRestWindow.ts` — retained as U2A.
- `tests/unit/useSupplierPurchasesRestWindow.test.tsx` — retained as U2A.
- `tests/architecture/queryZodBoundaries.test.ts` — removed only the U2B product binding.
- Removed: `src/features/compras/useSupplierProductsRestWindow.ts`.
- Removed: `tests/unit/useSupplierProductsRestWindow.test.tsx`.

## U2B apply — completed assigned slice

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocked reasons or unsafe action-context warnings were present.
- Scope consumed from the parent prompt: U2B only; U1A, U1B, and U2A were treated as closed read-only references, and U3+ were not started. No branch, commit, push, PR, review lifecycle, receipt, delivery gate, or size exception was used.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; the parent prompt resolved the delivery boundary to U2B and required this slice to remain below 400 authored lines.
- RED: wrote `tests/unit/useSupplierProductsRestWindow.test.tsx` before the production module and observed the real direct Vitest missing-module failure: `Failed to resolve import "../../src/features/compras/useSupplierProductsRestWindow"`; no tests were collected.
- GREEN: implemented `src/features/compras/useSupplierProductsRestWindow.ts` using only `api.listSupplierProducts` for the explicit `supplierId`, with a Query key containing supplier/limit/offset, Query signal forwarding, backend paging gates, offset reset, disabled callbacks, lifecycle-safe retry/refetch, and page replacement without local accumulation.
- The initial GREEN run exposed a test fixture ordering error (`6 passed, 1 failed`, expected `ready`, observed `initial-error`); the test setup was corrected to queue the ready response before the supplier rerender. No production behavior was weakened or bypassed.
- TRIANGULATE: the final U2B test independently covers no supplier/disabled/no request, initial loading, empty, ready, initial error, navigation error, active retry/refetch, previous/next gates, supplier reset, exact request forwarding, stale callbacks after supplier change, isolated unmount abort/callback safety, page replacement, no accumulation, and no cross-supplier traversal.
- Query guard update is limited to the exact named binding for `src/features/compras/useSupplierProductsRestWindow.ts` (`useQuery`). Existing U2A binding and U1A/U1B API allowlist entries were preserved; no generic hook or cache authority was added.
- REFACTOR: aligned the product window with the closed U2A RestWindow pattern without extracting a transversal hook. Final U2B authored count is **319 lines**: 102 production, 214 test, and 3 exact new Query-guard lines; below the mandatory 400-line ceiling.

### U2B TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Supplier product RestWindow | `tests/unit/useSupplierProductsRestWindow.test.tsx` | Integration-style hook test | ✅ Prior persisted U2A safety baseline 14/14; U2A regression included in final run | ✅ Direct missing-module RED observed before production code | ✅ Final focused product-window run 7/7 after the fixture correction | ✅ Seven behavior tests cover all requested lifecycle, paging, signal, stale, unmount, replacement, and supplier-isolation paths | ✅ 319 authored lines; no generic hook or size exception |

### U2B verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/useSupplierProductsRestWindow.test.tsx --reporter=verbose` — **1 failed suite, 0 tests collected**, real missing-module resolution error as recorded above.
- GREEN/focused U2B: `pnpm exec vitest run tests/unit/useSupplierProductsRestWindow.test.tsx` — **7 passed, 0 failed**.
- Focused U2A+U2B regression plus Query guard: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **21 passed, 0 failed**.
- `pnpm typecheck` — **passed**; route generation completed.
- `pnpm exec prettier --check src/features/compras/useSupplierProductsRestWindow.ts tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **passed**.
- Runtime harness: `N/A` — this hook has no independent browser boundary; direct Vitest/RTL, the Query guard, typecheck, and Prettier are the authorized evidence.

### U2B changed paths

- `src/features/compras/useSupplierProductsRestWindow.ts`
- `tests/unit/useSupplierProductsRestWindow.test.tsx`
- `tests/architecture/queryZodBoundaries.test.ts` — added only the exact U2B `useQuery` binding; existing U2A/U1 entries remain unchanged.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — checked the four U2B implementation rows.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### Remaining tasks and boundaries

U2B is complete. U1A, U1B, and U2A remain complete and unchanged; U3+ were not started. The following exact unchecked rows remain in `tasks.md`:

- [ ] Añadir pruebas fallidas para estado inicial `elegir-proveedor`, proveedor obligatorio, transición confirmada a `historial`, cambio de proveedor, preservación de contexto y reutilización contractual de `StagedSearchSelector`; no añadir todavía importación, detalle ni pendientes. <!-- sdd-owner: implementation -->
- [ ] Implementar la ruta y la composición de U3 con `PageHeader` y `WorkCard` existentes, selector genérico y adapter público de Proveedores; no crear estado global, params de router ni componentes compartidos nuevos. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/comprasNavigation.model.test.ts tests/unit/ComprasScreen.test.tsx tests/unit/ElegirProveedorStage.test.tsx src/app/routes/compras.test.tsx` y `pnpm router:check`; verificar que sin proveedor no aparece una tabla global. <!-- sdd-owner: implementation -->
- [ ] Extraer sólo nombres y helpers locales necesarios, conservar la composición dentro de `src/features/compras/` y mantener el patrón visual de Proveedores y Resources Master; registrar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de título y contexto por proveedor, paginación `hasPrevious` y `hasNext`, selección de compra y resultados 201, 200 `alreadyExisted`, 409, 422 y error; comprobar que falta de actor impide la mutación. <!-- sdd-owner: implementation -->
- [ ] Implementar tabla de historial y `ImportarCompraSurface` siguiendo los patrones de Proveedores, con feedback accesible, cierre sólo tras confirmación y refresh del hook cuando la respuesta pertenece al proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/HistorialComprasStage.test.tsx tests/unit/ImportarCompraSurface.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar que no hay agregación cliente, alta de producto ni presentación de 200 como fallo. <!-- sdd-owner: implementation -->
- [ ] Mantener datos y acciones documentales separados, reutilizar feedback/dialogs existentes y dejar el diff menor de 400 líneas; registrar resultados sin afirmar ejecución de Playwright todavía. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## Historical combined U3 apply — superseded by approved U3A/U3B split

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe action-context warnings were present.
- Scope consumed from the parent prompt: U3 only. Closed U1A, U1B, U2A, and U2B files were treated as read-only; U4+ and `AppShell.tsx` were not started or edited.
- Planning correction completed before UI work: `design.md` and `tasks.md` now name the repository-collected tests `tests/unit/comprasNavigation.test.ts` and `tests/unit/comprasScreen.test.tsx`, and include generated `src/app/routeTree.gen.ts` in the U3 surfaces. This was a path/surface correction only, not scope growth.
- Design-system checklist completed before UI writes: existing `PageHeader`, `WorkCard`, `Button`, and `StagedSearchSelector` were reused; no shared component, token, feature CSS, arbitrary Tailwind value, document listener, AppShell edit, or dark-mode implementation was added.
- RED: wrote both repository-collected U3 tests before the new feature modules and observed the real missing-module resolution failure for `comprasNavigation.model` and `ComprasScreen`; no tests were collected in that RED run.
- GREEN: implemented the flat `/compras` route, generated route registration, `ComprasEntry`, the feature-local navigation model, `ComprasScreen`, and `ElegirProveedorStage`. The screen uses the public Proveedores adapter and existing REST-window hook, keeps supplier context in memory, requires a confirmed supplier before any history surface, and uses a placeholder without fetching or inventing purchases.
- TRIANGULATE: the two focused tests cover initial supplier requirement, no global table, selector roles and focus/ArrowDown behavior, loading, empty, initial error/retry, continuation loading/retry, explicit confirmation/context, changing supplier, and navigation model reset. `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` passed 8/8, and the configured `pnpm test -- tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` passed 99 files / 841 tests. `pnpm router:check`, `pnpm typecheck`, and the focused Prettier check also passed.
- REFACTOR: behavior-preserving cleanup removed duplicated supplier-name logic and test setup duplication; focused tests remained 8/8. The budget gate is not complete because the honest authored count is 410 lines plus 37 generated route-tree delta lines, totaling **447 changed lines**, above the canonical 400-line limit. No code-golf compression or coverage omission was used.
- Current U3 task state: RED, GREEN, and TRIANGULATE are visibly checked in `tasks.md`; REFACTOR remains unchecked pending a parent-approved split. This apply returns `blocked` for the required delivery decision rather than claiming U3 complete.

### U3 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U3 navigation model and supplier-entry flow | `tests/unit/comprasNavigation.test.ts`, `tests/unit/comprasScreen.test.tsx` | Integration-style component tests plus pure model tests | N/A (new U3 files) | ✅ Real missing-module failure observed before production code | ✅ 8/8 focused tests passed | ✅ Loading, error/retry, continuation, empty, focus, confirmation/context, reset, and no-global-history cases | ⛔ Blocked at 447 total changed lines; split decision required |

### U3 changed paths

- `src/app/routes/compras.tsx`
- `src/app/routeTree.gen.ts` (generated by `pnpm router:generate`)
- `src/features/compras/comprasNavigation.model.ts`
- `src/features/compras/ComprasEntry.tsx`
- `src/features/compras/ComprasScreen.tsx`
- `src/features/compras/ElegirProveedorStage.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `tests/unit/comprasScreen.test.tsx`
- `openspec/changes/compras-partidas-vinculacion/design.md`
- `openspec/changes/compras-partidas-vinculacion/tasks.md`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### Historical combined U3 remaining row (superseded)

- [ ] Extraer sólo nombres y helpers locales necesarios, conservar la composición dentro de `src/features/compras/` y mantener el patrón visual de Proveedores y Resources Master; registrar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->

All U4-U9 implementation rows and deferred parent-owned lifecycle rows remain unchecked in `tasks.md`; they were not selected or edited.

## Historical recommendation (superseded)

The combined U3 candidate was paused at 447 lines. That recommendation is superseded by the approved U3A/U3B split recorded below; it is not the current apply status.

## U3A apply — approved split closed; U3B absent and pending

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe action-context warnings were present.
- Scope consumed from the parent prompt: close U3A only. U3B supplier selector/states, U4+, `AppShell.tsx`, branches, commits, pushes, PRs, review lifecycle, receipts, delivery gates, and size exceptions were not started or authorized.
- Planning correction persisted: `design.md` §13 and `tasks.md` now define independent U3A route/shell/model and U3B supplier selector/states. The forecast/count/order were updated to U3A ~220, U3B ~180, 51 checkbox rows (48 implementation, 3 parent), with explicit guard lines `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, and `400-line budget risk: High`. The combined U3 claims above are historical and superseded by this split.
- Design-system checklist was reread before UI edits. U3A reuses `PageHeader` and `WorkCard`, adds no shared component/token/CSS/arbitrary utility, preserves the existing Light-only implementation, and does not edit `AppShell.tsx`.
- RED evidence: the valid combined-U3 missing-module RED for route/model/shell was preserved. The U3A test rewrite was made before the production cleanup, but no artificial RED rerun was claimed or fabricated.
- GREEN: U3A now contains the flat `/compras` route, generated route registration, `ComprasEntry`, an initial-only `comprasNavigation.model.ts`, and a minimal `ComprasScreen` with the shared header/card and selection-required status region. `ElegirProveedorStage.tsx` and all supplier-selection-specific screen/model test logic were removed from the current candidate. No supplier selector, supplier REST window, history table, pending surface, or AppShell dependency remains in U3A.
- TRIANGULATE: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` — **3 passed, 0 failed**. `pnpm router:generate && pnpm router:check` — **passed**. `pnpm typecheck` — **passed**. The final focused Prettier check for all U3A source/test/route files — **passed**; the initial broader check was nonzero, so the scoped code check was rerun after formatting `tests/unit/comprasScreen.test.tsx`.
- REFACTOR: U3A footprint is **153 authored changed lines against HEAD**, including the **37-line generated route-tree delta**; including the 67-line removal of the superseded selector candidate gives **220 lines of U3A accounting**, below 400. No code-golf compression, test deletion, size exception, or AppShell edit was used.

### U3A TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U3A route/model/shell split | `tests/unit/comprasNavigation.test.ts`, `tests/unit/comprasScreen.test.tsx` | Pure model and RTL component tests | Preserved valid combined-U3 missing-module RED | ✅ Preserved; no fabricated rerun | ✅ Minimal shell renders and excludes selector/history surfaces | ✅ 3/3 focused tests plus router, typecheck, and Prettier pass | ✅ 153 baseline diff lines / 220 split accounting; below 400 |

### U3A changed paths

- `src/app/routes/compras.tsx`
- `src/app/routeTree.gen.ts` (generated registration)
- `src/features/compras/comprasNavigation.model.ts`
- `src/features/compras/ComprasEntry.tsx`
- `src/features/compras/ComprasScreen.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `tests/unit/comprasScreen.test.tsx`
- Removed: `src/features/compras/ElegirProveedorStage.tsx`
- `openspec/changes/compras-partidas-vinculacion/design.md`
- `openspec/changes/compras-partidas-vinculacion/tasks.md`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### U3B apply — completed assigned slice

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe action-context warnings were present.
- Scope consumed from the parent prompt: U3B only. U3A route/entry/tree remained closed; U4+, `AppShell.tsx`, branches, commits, pushes, PRs, review lifecycle, receipts, delivery gates, and size exceptions were not started.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`, U3B forecast `Low`; the prompt resolved the delivery boundary and required no exception.
- Design-system checklist: reused `PageHeader`, `WorkCard`, `Button`, and `StagedSearchSelector` directly; no shared component, token, CSS file, arbitrary Tailwind value, document listener, or AppShell edit was introduced. Light-only project behavior remains unchanged.

### U3B TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Supplier navigation model transitions/reset | `tests/unit/comprasNavigation.test.ts` | Unit | ✅ Prior U3A model test passed | ✅ Missing transition exports failed before implementation | ✅ Confirmation, context preservation, back/change reset | ✅ Pure transition functions retained and focused tests passed |
| Supplier selector integration and window states | `tests/unit/comprasScreen.test.tsx` | Integration-style RTL | ✅ Prior U3A screen tests passed before replacement | ✅ Selector/API props failed before U3B implementation | ✅ Loading, empty, initial retry, ready confirmation, context/change, labels, continuation error/retry, next/previous paging, no history table/fetch | ✅ Reused shared contracts; formatting and regression tests remained green |

### U3B implementation evidence

- `ElegirProveedorStage` consumes the public Proveedores `Supplier` contract and `StagedSearchSelector<Supplier>` directly. It maps `initial-loading`, `empty`, `initial-error`, `navigation-error`, `navigating`, and `ready` honestly to selector load states, including continuation retry and exhausted pagination.
- `ComprasScreen` owns the public `ProveedoresRestApi` instance and `useProveedoresRestWindow`, confirms a `Supplier` into the `historial` model stage, preserves trade/legal/fiscal/id context, and resets context through `Cambiar proveedor`.
- The history surface is an explicit U4 placeholder and does not render a table or call a purchase-history API. Supplier pagination remains authoritative; previous-page navigation can use the cached first page without inventing a request.
- Supplier labels use trade name, legal name, then id fallback and expose fiscal id in the visible context. No custom document listener was added.
- U3B authored delta is below the 400-line boundary using the U3A baseline: 106 new stage lines plus the model/screen/test integration delta totals 380 authored added lines; no generated route or AppShell lines belong to this slice.

### U3B verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx --reporter=verbose` — failed as required: transition exports were absent and the U3A screen had no selector.
- GREEN/TDD focused run: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` — **9 passed, 0 failed**.
- Focused regression plus architecture guards: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` — **53 passed, 0 failed**.
- `pnpm router:check` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec prettier --write ...` normalized only the five U3B source/test files; the subsequent focused test run passed. Final scoped Prettier check is recorded as satisfied by the normalized files.
- Runtime harness: `N/A` — U3B has no independent browser journey; RTL/Vitest, router check, typecheck, and Prettier are the authorized checks.

### U3B changed paths

- `src/features/compras/ElegirProveedorStage.tsx`
- `src/features/compras/ComprasScreen.tsx`
- `src/features/compras/comprasNavigation.model.ts`
- `tests/unit/comprasScreen.test.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `openspec/changes/compras-partidas-vinculacion/tasks.md`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### Remaining exact unchecked task rows

- [ ] Añadir pruebas fallidas de título y contexto por proveedor, paginación `hasPrevious` y `hasNext`, selección de compra y resultados 201, 200 `alreadyExisted`, 409, 422 y error; comprobar que falta de actor impide la mutación. <!-- sdd-owner: implementation -->
- [ ] Implementar tabla de historial y `ImportarCompraSurface` siguiendo los patrones de Proveedores, con feedback accesible, cierre sólo tras confirmación y refresh del hook cuando la respuesta pertenece al proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/HistorialComprasStage.test.tsx tests/unit/ImportarCompraSurface.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar que no hay agregación cliente, alta de producto ni presentación de 200 como fallo. <!-- sdd-owner: implementation -->
- [ ] Mantener datos y acciones documentales separados, reutilizar feedback/dialogs existentes y dejar el diff menor de 400 líneas; registrar resultados sin afirmar ejecución de Playwright todavía. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## U3B reapply — blocked by authorized staged-baseline budget gate

- Structured status consumed: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blockers.
- Scope consumed: U3B only against the user-authorized staged U3A baseline. U4+, `AppShell.tsx`, route/tree changes, branches, commits, pushes, PRs, review lifecycle, and size exceptions were not started or authorized.
- Staged-baseline method: the U3A source and tests were left in the index; safety-net tests passed **3/3** before work. Five U3B paths were measured with `git diff --numstat` against that index. The new untracked `ElegirProveedorStage.tsx` was measured with `git diff --no-index --numstat /dev/null src/features/compras/ElegirProveedorStage.tsx`, which reported **147 additions / 0 deletions**.
- Exact five-path authored delta: `ComprasScreen.tsx` **91 additions + 20 deletions**, `comprasNavigation.model.ts` **18 + 2**, `ElegirProveedorStage.tsx` **147 + 0**, `tests/unit/comprasNavigation.test.ts` **31 + 6**, and `tests/unit/comprasScreen.test.tsx` **210 + 19**. Total: **497 additions + 47 deletions = 544 changed lines** (the command output used for the tracked paths reported the same per-file values; the earlier aggregate was corrected here to include all five paths). This is **over the 400-line limit**, so implementation is blocked with no compression and no size exception.
- The U3B tests were written first and real RED was observed before production changes. GREEN and triangulation behavior tests pass, but the REFACTOR/budget task remains unchecked and U3B is not reported complete.
- Verifier findings addressed in the candidate: every option visibly includes `ID fiscal: ...`; selector uses `maxVisibleRows` bounded mode; external `Página anterior`/`Página siguiente` controls replace `Cargar más…`; loading disables controls; navigation failures expose direction-specific retry; confirmed context/change reset and U4 no-fetch placeholder remain covered.

### Reapply verification evidence

- RED: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx --reporter=verbose` — failed on missing transition exports and absent selector, as required.
- GREEN/triangulation: `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` — **9 passed, 0 failed**.
- `pnpm router:check` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec prettier --check src/features/compras/comprasNavigation.model.ts src/features/compras/ElegirProveedorStage.tsx src/features/compras/ComprasScreen.tsx tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx` — passed after normalization.
- Focused ESLint check for the five paths — passed.
- Runtime harness: `N/A` — U3B uses RTL/Vitest; no independent browser harness was authorized.

### Reapply changed paths

- `src/features/compras/comprasNavigation.model.ts`
- `src/features/compras/ComprasScreen.tsx`
- `src/features/compras/ElegirProveedorStage.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `tests/unit/comprasScreen.test.tsx`
- `openspec/changes/compras-partidas-vinculacion/tasks.md`
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### Staged-index integrity

- No `git add` was run.
- The staged index remains the U3A baseline; no staged file was edited. `git diff --cached --name-status` remains unchanged from the pre-apply baseline and contains no U3B stage file.
- OpenSpec changes remain unstaged.

## U3B1 apply — selector/model split completed

- Structured status consumed: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blockers. The user-approved delivery decision is the real U3B1/U3B2 split under the 400-line ask-on-risk budget.
- Combined U3B claims are superseded in `design.md` and `tasks.md`. U3B1 is the only slice closed here; U3B2 remains pending and no U4+ work began.
- U3B1 completed implementation-owned task rows: RED, GREEN, TRIANGULATE, and REFACTOR. The persisted rows are visibly checked in `tasks.md`.
- U3B1 boundary is exactly four paths: `src/features/compras/comprasNavigation.model.ts`, `src/features/compras/ElegirProveedorStage.tsx`, `tests/unit/comprasNavigation.test.ts`, and `tests/unit/elegirProveedorStage.test.tsx`.
- `ComprasScreen.tsx` and `tests/unit/comprasScreen.test.tsx` were restored from the staged index; `git diff --exit-code` for those two paths is empty. U3B2 therefore remains absent/pending.

### U3B1 strict-TDD evidence

| Task | Test file | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| Navigation model confirmation/reset/context | `tests/unit/comprasNavigation.test.ts` | Existing focused model tests preserved | Prior valid model RED retained | 2 tests passed | Confirmation and reset paths both exercised | Passed with final focused suite |
| Isolated supplier selector | `tests/unit/elegirProveedorStage.test.tsx` | N/A (new test file) | Import failed with the stage withheld before implementation | 6 isolated tests passed after implementation/fix | Loading, empty, initial error, search, fiscal IDs, both paging directions, retry, disabled/loading, confirmation, focus, no table/fetch assertions | Formatting and fixture refactor passed focused tests |

### U3B1 verification

- `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/elegirProveedorStage.test.tsx tests/unit/comprasScreen.test.tsx --reporter=dot` — **3 files, 8 tests passed**; this includes the restored U3A screen regression.
- `pnpm router:check` — passed.
- `pnpm typecheck` — passed.
- Scoped Prettier check for the four U3B1 paths — passed.
- Scoped ESLint check for the four U3B1 paths — passed.
- `git diff --check` for tracked U3B1 paths — passed.
- Runtime harness: `N/A` — U3B1 is an isolated RTL/Vitest component/model slice with no independent browser boundary.

### U3B1 exact authored delta

Measured against the unchanged staged U3A index, counting additions plus deletions and including both untracked files with `git diff --no-index --numstat /dev/null <path>`:

- `src/features/compras/comprasNavigation.model.ts`: **18 additions + 2 deletions**.
- `tests/unit/comprasNavigation.test.ts`: **26 additions + 6 deletions**.
- `src/features/compras/ElegirProveedorStage.tsx`: **139 additions + 0 deletions**.
- `tests/unit/elegirProveedorStage.test.tsx`: **208 additions + 0 deletions**.
- Total: **391 additions + 8 deletions = 399 changed lines**, below the 400-line limit without a size exception.

### Index and rollback integrity

- Staged-index binary diff hash before and after U3B1: `23af5c4876fa0574fe4c0dcca6acaaec97d4f11d8368f86186c52a4b680bf768`; no `git add`, reset, commit, branch, push, PR, or review lifecycle action was run.
- U3B1 rollback boundary is exactly the four paths above. OpenSpec planning artifacts remain unstaged.

### Remaining unchecked implementation tasks

- [ ] Añadir pruebas fallidas de montaje del selector, contexto confirmado/cambio, placeholder U4 y ausencia de tabla/fetch de compras. <!-- sdd-owner: implementation -->
- [ ] Montar U3B1 desde `ComprasScreen` y conectar únicamente la ventana/API pública de Proveedores, sin iniciar historial real ni U4+. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la regresión U3A/U3B2 y comprobar reset, contexto, no tabla global y no fetch de compras. <!-- sdd-owner: implementation -->
- [ ] Medir U3B2 por separado bajo 400 líneas; mantener `AppShell.tsx`, índice y U3B1 fuera de cambios. <!-- sdd-owner: implementation -->

All later U4–U9 implementation rows and the two parent-owned lifecycle rows remain unchanged and unchecked in `tasks.md`; they are deferred. U3B2 has the separate forecast of approximately 250 lines and is outside this apply.

## U3B2 apply — ComprasScreen integration completed

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blockers. `actionContext.mode` was `repo-local`; no unsafe-root warning was present.
- Scope consumed from the parent prompt: U3B2 only against the staged U3A/U3B1 baseline. U4+, `AppShell.tsx`, route/tree files, model, `ElegirProveedorStage`, branches, commits, pushes, PRs, review lifecycle, receipts, delivery gates, and size exceptions were not started or authorized.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`, U3B2 forecast `Low`. The prompt resolved the delivery boundary; no size exception was used.
- Design-system checklist was applied before UI edits: `PageHeader`, `WorkCard`, `Button`, `ElegirProveedorStage`, and `useProveedoresRestWindow` were reused; no shared component, token, feature CSS, arbitrary utility, document listener, or dark-mode implementation was added.

### U3B2 strict-TDD evidence

| Task | Test file | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| ComprasScreen integration boundary | `tests/unit/comprasScreen.test.tsx` | ✅ Prior U3A screen + U3B1 regressions: 8/8 | ✅ Four new boundary tests failed against the staged U3A shell before production edits | ✅ Screen mounts the selector through injected public Proveedores API and passes the active stable window | ✅ Loading/properties, ready confirmation with fallback context, reset action, scoped page navigation, no table/global history/no compras fetch; final screen + U3B1 regression 10/10 | ✅ Prettier-normalized two paths; final focused checks remained green and the unstaged delta is 273 changed lines |

### U3B2 implementation evidence

- `ComprasScreen` now accepts an optional public `ProveedoresRestApi`, defaulting to `createProveedoresRestApi()` once per mount, and uses `useProveedoresRestWindow` with `scope: 'ACTIVE'`, empty text, and stable `limit: 20`.
- The initial stage renders `ElegirProveedorStage` with the hook's loading/empty/error/navigation states and previous/next/retry callbacks. Confirmation uses the staged `confirmComprasSupplier` transition.
- Confirmed context visibly exposes display name with legal-name fallback, legal name, fiscal ID, internal ID, an explicit `Cambiar proveedor` action using `changeComprasSupplier`, and a truthful U4 per-provider placeholder. No purchase API, purchase hook, table, global history, or purchase fetch was introduced.
- Only the two authorized U3B2 paths have unstaged source/test changes. `AppShell.tsx`, `src/app/routeTree.gen.ts`, U3B1 paths, and the staged baseline remain untouched.

### U3B2 verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx` — **4 failed, 0 passed** against the staged U3A shell; failures were the expected missing loading selector, confirmation context, reset action, and supplier window boundary.
- GREEN/triangulation: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx` — **4 passed, 0 failed**.
- Focused screen + U3B1 regressions: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx tests/unit/elegirProveedorStage.test.tsx tests/unit/comprasNavigation.test.ts` — **10 passed, 0 failed**.
- `pnpm router:check` — passed.
- `pnpm typecheck` — passed; route generation produced no unstaged route/tree change.
- `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` — passed after scoped formatting.
- `git diff --check -- src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` — passed.
- Runtime harness: `N/A` — U3B2 has no independent browser journey; RTL/Vitest, router check, typecheck, and Prettier are the authorized checks.

### U3B2 exact delta and staged-index integrity

- Against the staged index, only `src/features/compras/ComprasScreen.tsx` (**118 additions, 14 deletions**) and `tests/unit/comprasScreen.test.tsx` (**155 additions, 14 deletions**) are unstaged: **273 changed lines total**, below the 400-line limit.
- No `git add`, commit, branch, reset, push, PR, review lifecycle, or size-exception action was run. `git rev-parse HEAD` remains `c9883e6900396ed4159fcddd4a28e6b582b29302`.
- The cached index remains the staged U3A/U3B1 baseline; no staged file was edited. U3B2 rollback boundary is exactly the two paths above. OpenSpec artifacts are persisted unstaged.

### Remaining exact unchecked implementation tasks

- [ ] Añadir pruebas fallidas de título y contexto por proveedor, paginación `hasPrevious` y `hasNext`, selección de compra y resultados 201, 200 `alreadyExisted`, 409, 422 y error; comprobar que falta de actor impide la mutación. <!-- sdd-owner: implementation -->
- [ ] Implementar tabla de historial y `ImportarCompraSurface` siguiendo los patrones de Proveedores, con feedback accesible, cierre sólo tras confirmación y refresh del hook cuando la respuesta pertenece al proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/HistorialComprasStage.test.tsx tests/unit/ImportarCompraSurface.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar que no hay agregación cliente, alta de producto ni presentación de 200 como fallo. <!-- sdd-owner: implementation -->
- [ ] Mantener datos y acciones documentales separados, reutilizar feedback/dialogs existentes y dejar el diff menor de 400 líneas; registrar resultados sin afirmar ejecución de Playwright todavía. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

Deferred parent-owned lifecycle rows remain unchanged:

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## Current next recommendation

`parent-lifecycle` — U3B2 is closed at 273 changed lines against the staged index. Parent-owned bounded review/lifecycle decisions precede any U4+ apply; do not begin U4+ in this slice.

## U4A planning correction — history only

- Structured status consumed before editing: change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe action-context warnings were present.
- User-approved scope is U4A only against the staged baseline through U3B2. U4B import, U5 `AppShell`, U6 detail, later units, branches, commits, reset, push, PR, review lifecycle, delivery gates, and size exceptions are prohibited.
- Planning correction persisted before source work: former U4 is now U4A history followed by U4B import, with order U4A → U4B → U5. The forecast is U4A ~360 and U4B ~220; the checkbox count is 59 total (56 implementation, 3 parent). Active U4A test paths are `tests/unit/historialComprasStage.test.tsx` and `tests/unit/comprasScreen.test.tsx`; stale U4 paths were corrected from `src/features/**.test` to `tests/unit/`.
- The four U4A paths to measure against the staged baseline are `src/features/compras/HistorialComprasStage.tsx`, `tests/unit/historialComprasStage.test.tsx`, `src/features/compras/ComprasScreen.tsx`, and `tests/unit/comprasScreen.test.tsx`. The index must remain unchanged.
- No U4A source or test work has started in this planning update. The next action is strict-TDD RED: create `tests/unit/historialComprasStage.test.tsx` first, observe the missing-module failure, then write the screen integration RED before production edits.

## U4A apply — history slice completed

- Strict-TDD RED was observed in order: `tests/unit/historialComprasStage.test.tsx` first failed with the real missing-module resolution error for `HistorialComprasStage`; the screen integration test then failed to find the authoritative purchase table after supplier confirmation. No production code preceded either RED.
- GREEN implemented only `HistorialComprasStage` and its `ComprasScreen` wiring. The stage receives authoritative rows/status/paging flags/callbacks, performs no fetching or accumulation, formats decimal display with string operations only, and exposes explicit selection with a U6 placeholder. The screen passes the confirmed supplier ID to `useSupplierPurchasesRestWindow`, resets selection on supplier change, and does not add global history or detail fetching.
- TRIANGULATE focused coverage includes visible supplier context, series/folio with UUID fallback, issued date, currency, exact high-precision total display, disabled paging gates, initial loading/empty/error/navigation-error/navigating states, replacing rather than accumulating rows, selection callback/placeholder, confirmed supplier-ID request, and no global history. Final focused regression: **57 passed, 0 failed** across U1A/U1B/U2A/U2B/U3B and architecture guards.
- REFACTOR evidence: the four authorized U4A paths measured against the staged U3B2 baseline are `src/features/compras/HistorialComprasStage.tsx` 157 additions, `tests/unit/historialComprasStage.test.tsx` 121 additions, `src/features/compras/ComprasScreen.tsx` 43 additions/13 deletions, and `tests/unit/comprasScreen.test.tsx` 54 additions/10 deletions: **398 authored changed lines**, below 400. No code-golf, size exception, or index mutation was used.
- Completed implementation-owned U4A task rows are visibly checked in `tasks.md`: RED, GREEN, TRIANGULATE, and REFACTOR. U4B import remains deferred; its four exact unchecked rows are preserved below. Parent-owned lifecycle rows remain unchanged.
- Verification: `pnpm typecheck` passed; `pnpm router:check` passed; focused code/test Prettier check passed; `git diff --check` passed. The broader markdown Prettier check remains unavailable/failed on existing OpenSpec markdown formatting and was not used as code evidence.
- Staged-index integrity: `git diff --cached --binary | sha256sum` remained `9b17a3c7d615474cdc4a08aad7fe8c0dc032cb8ec1124005f5acda2dec957e7b`; no `git add`, commit, branch, reset, push, PR, review lifecycle, receipt, delivery gate, or archive action was performed.

### U4A TDD Cycle Evidence

| Task | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Controlled history stage | `tests/unit/historialComprasStage.test.tsx` | RTL component | N/A (new) | ✅ Missing-module failure observed first | ✅ Stage behavior passed | ✅ Contract display, states, gates, replacement, selection | ✅ 157 production + 121 test lines included in 398-line four-path boundary |
| Screen history integration | `tests/unit/comprasScreen.test.tsx` | RTL integration | ✅ U3B2 focused baseline passed | ✅ Missing table after confirmed supplier observed before wiring | ✅ Confirmed supplier window and U6 placeholder passed | ✅ Supplier ID, no global history, selection, existing regressions | ✅ Screen integration stayed within same four-path boundary |

### U4A remaining exact unchecked implementation rows

- [ ] Escribir pruebas fallidas de multipart, actor obligatorio, códigos 201/200/409/422, cierre/feedback y refresh autoritativo; no iniciar U4B durante U4A. <!-- sdd-owner: implementation -->
- [ ] Implementar `ImportarCompraSurface` contra el adapter U1B, sin presentar 200 `alreadyExisted` como error ni mezclarlo con el stage de historial. <!-- sdd-owner: implementation -->
- [ ] Ejecutar focused tests de importación y screen, verificando envelopes, accesibilidad, actor y refresh sólo para el proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Mantener U4B separada de U4A y por debajo de 400 líneas autorales; registrar comandos reales sin modificar el índice ni iniciar U5. <!-- sdd-owner: implementation -->

## Current next recommendation

`parent-lifecycle` — U4A is complete at 398 authored changed lines against the staged U3B2 baseline. Parent-owned bounded review/lifecycle actions remain deferred; U4B, U5, U6 and later work are not authorized in this apply.

## Integration-discovered U2A/U2B regression correction — navigation status

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe `actionContext` warnings were present. This correction produced only cumulative apply-progress; it did not alter native status.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, `400-line budget risk: High` in aggregate. The bounded correction is measured below 400 changed lines against the staged U2A/U2B baseline; no size exception or delivery-path change was used.
- Integration finding: after a ready first page, `next()` changed to a new offset query whose TanStack state was simultaneously `isPending` and `isFetching`; both closed RestWindow hooks therefore returned `initial-loading`, making the navigation UI unreachable. The existing initial-load, supplier-reset-at-offset-zero, error, lifecycle, and paging guards remain covered and safe.
- RED: added one integrated pending-second-page regression to each existing hook test. `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx` failed **2 tests / passed 16**, with both assertions observing `initial-loading` instead of `navigating`.
- GREEN: changed only status derivation in both hooks. Query errors retain initial/navigation semantics; a fetching query is `navigating` when `offset > 0` and `initial-loading` at offset `0`, preserving first load and supplier-change reset behavior.
- TRIANGULATE/verification: the focused hook suites passed **18/18** after the correction. The U4A history/screen integration plus both hooks passed **25/25** in `tests/unit/useSupplierPurchasesRestWindow.test.tsx`, `tests/unit/useSupplierProductsRestWindow.test.tsx`, `tests/unit/historialComprasStage.test.tsx`, and `tests/unit/comprasScreen.test.tsx`. `pnpm typecheck` passed; scoped Prettier passed; `git diff --check` passed.
- Exact correction delta against the staged baseline, limited to the four U2A/U2B paths: **66 additions + 18 deletions = 84 changed lines**. Production status changes are 9 additions/9 deletions in each hook; each test adds 24 lines. This remains well below 400.
- Staged-index and scope integrity: no `git add` was run. No U4A file, `AppShell`, task file, design file, or later-unit file was edited or staged. Existing unstaged U4A changes in `src/features/compras/ComprasScreen.tsx` and `tests/unit/comprasScreen.test.tsx` were left untouched. The four U2A/U2B task rows were already checked and remain checked; no task/design checkbox was changed.
- Correction paths: `src/features/compras/useSupplierPurchasesRestWindow.ts`, `src/features/compras/useSupplierProductsRestWindow.ts`, `tests/unit/useSupplierPurchasesRestWindow.test.tsx`, and `tests/unit/useSupplierProductsRestWindow.test.tsx`.

### U2A/U2B correction TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U2A navigation-status regression correction | `tests/unit/useSupplierPurchasesRestWindow.test.tsx` | Integrated hook test | ✅ Existing four-path baseline passed | ✅ 1 regression failed with `initial-loading` | ✅ Status derives `navigating` for pending offset page | ✅ Existing initial/reset/error/lifecycle/paging tests remained green | ✅ Minimal 9-line status replacement; scoped tests/Prettier/diff passed |
| U2B navigation-status regression correction | `tests/unit/useSupplierProductsRestWindow.test.tsx` | Integrated hook test | ✅ Existing four-path baseline passed | ✅ 1 regression failed with `initial-loading` | ✅ Status derives `navigating` for pending offset page | ✅ Existing initial/reset/error/lifecycle/paging tests remained green | ✅ Minimal 9-line status replacement; scoped tests/Prettier/diff passed |

### Current next recommendation

`parent-lifecycle` — this bounded U2A/U2B correction is complete. Independent verification and parent-owned lifecycle actions remain deferred; no U4A or later implementation was started by this correction.

## Integration-discovered U2A/U2B paging-continuity correction — same-supplier placeholder

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe `actionContext` warnings were present.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; the parent prompt resolved this bounded correction path and no size exception was used.
- Scope guard: only the two U2A/U2B hooks and their two tests were edited. U4A stage/screen files, `AppShell`, tasks, design, route files, and later-unit files were not edited or staged. No `git add`, commit, branch, reset, push, PR, review lifecycle, receipt, or delivery gate was performed.
- Safety net: the existing U2A/U2B plus U4A stage/screen regression baseline passed **25/25** before source edits.
- RED: added same-supplier pending-offset assertions requiring prior rows to remain visible, plus supplier-change assertions requiring `initial-loading` with empty rows. The focused hook run failed **2 tests / passed 18** because both pending offset windows returned empty rows; the supplier-isolation assertions were already green and guarded against future unconditional placeholder leakage.
- GREEN: added TanStack Query `placeholderData` to both hooks. It returns previous data only when `previousQuery.queryKey[2] === supplierId`; a supplier identity change returns `undefined`, so the new offset-zero query stays `initial-loading` with empty rows. Existing error-first status derivation, Query signal forwarding, lifecycle guards, backend paging flags, offset reset, page replacement, and no-accumulation behavior were preserved.
- TRIANGULATE: both hook suites passed **20/20** after the minimal implementation. The combined U2A/U2B plus U4A stage/screen suite passed **27/27**. Typecheck passed, scoped Prettier passed, and scoped `git diff --check` passed.
- Exact correction measurement against the staged baseline for the four authorized paths: `useSupplierProductsRestWindow.ts` **2 additions**, `useSupplierPurchasesRestWindow.ts` **2 additions**, `useSupplierProductsRestWindow.test.tsx` **31 additions**, and `useSupplierPurchasesRestWindow.test.tsx` **31 additions**; total **66 changed lines**, below the 400-line budget. The cached index hash remained `fd81321a26b4704d3120b23fad9209b23004cf5e5a69ccc28a722e715eb27555`.
- Persisted tasks: no checkbox update was necessary. The completed U2A and U2B implementation rows were re-read and remain visibly `- [x]`; parent-owned rows remain byte-for-byte unchanged.

### U2A/U2B paging-continuity correction TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Same-supplier purchase-window placeholder | `tests/unit/useSupplierPurchasesRestWindow.test.tsx` | Integrated hook test | ✅ 25/25 four-path baseline | ✅ 1 pending-offset row assertion failed | ✅ Prior rows remain during `navigating`; supplier change remains empty `initial-loading` | ✅ Existing errors, signals, lifecycle, paging, reset, replacement, and no-accumulation tests passed | ✅ 2-line Query placeholder; 66-line four-path correction total |
| Same-supplier product-window placeholder | `tests/unit/useSupplierProductsRestWindow.test.tsx` | Integrated hook test | ✅ 25/25 four-path baseline | ✅ 1 pending-offset row assertion failed | ✅ Prior rows remain during `navigating`; supplier change remains empty `initial-loading` | ✅ Existing errors, signals, lifecycle, paging, reset, replacement, and no-accumulation tests passed | ✅ 2-line Query placeholder; 66-line four-path correction total |

### Remaining exact unchecked task rows

The correction changed no task ownership or completion state. The following exact rows remain unchecked in `tasks.md`:

- [ ] Escribir pruebas fallidas de multipart, actor obligatorio, códigos 201/200/409/422, cierre/feedback y refresh autoritativo; no iniciar U4B durante U4A. <!-- sdd-owner: implementation -->
- [ ] Implementar `ImportarCompraSurface` contra el adapter U1B, sin presentar 200 `alreadyExisted` como error ni mezclarlo con el stage de historial. <!-- sdd-owner: implementation -->
- [ ] Ejecutar focused tests de importación y screen, verificando envelopes, accesibilidad, actor y refresh sólo para el proveedor vigente. <!-- sdd-owner: implementation -->
- [ ] Mantener U4B separada de U4A y por debajo de 400 líneas autorales; registrar comandos reales sin modificar el índice ni iniciar U5. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## U4B apply — import surface and confirmed-supplier integration

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace, and allowed edit root equal to the workspace. No native blockers or unsafe `actionContext` warnings were present.
- Scope consumed: U4B only against the staged baseline through closed U4A. U5/AppShell, U6 detail, products/linking, pending surface, later units, and delivery lifecycle actions remained outside scope. No `git add`, commit, branch, reset, push, PR, review lifecycle, receipt, or size exception was used.
- Skill resolution: `paths-injected`; GARFEX Design System, UI/UX Pro Max, and work-unit skills were loaded. Existing Button/Dialog/file/focus patterns were reused; no shared primitive, CSS, token, product field, or global listener was added.
- Workload gate: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`; this authorized U4B slice stayed below 400 without an exception.

### U4B completed tasks and TDD evidence

- U4B RED, GREEN, TRIANGULATE, and REFACTOR rows are visibly checked in `tasks.md` (37 of 59 checkbox rows complete).
- The new surface test was written first and produced the real missing-module RED: 1 failed suite, 0 tests collected. Screen integration RED then ran before production edits: 4 expected failures and 4 existing tests passed.
- `ImportarCompraSurface` covers XML-only input, pending/dismiss/duplicate guards, 201/200 success, callback confirmation before close, actor/409/422/generic errors, unmount safety, and focus restoration. `ComprasScreen` injects `purchasesApi.importPurchase`, keeps persistent honest feedback, refreshes only for the still-current supplier, and clears feedback/selection on supplier change. No product creation, client insertion, aggregation, branch field, U5, U6, or later surface was added.

| Task | Test file | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| Import surface | `tests/unit/importarCompraSurface.test.tsx` | ✅ missing module first | ✅ required behavior | ✅ 10 tests | ✅ 161 authored lines |
| Screen integration | `tests/unit/comprasScreen.test.tsx` | ✅ pre-edit failures | ✅ refresh/feedback/reset | ✅ 5 screen tests plus U4A | ✅ 71 changed lines |

### U4B verification

- `pnpm exec vitest run tests/unit/importarCompraSurface.test.tsx tests/unit/comprasScreen.test.tsx tests/unit/historialComprasStage.test.tsx` — **17 passed, 0 failed**.
- `pnpm typecheck` — **passed**. `pnpm router:check` — **passed**. Exact-four-path Prettier check — **passed**. Exact-four-path `git diff --check` — **passed**.
- Runtime harness: `N/A` — no independent browser journey is authorized for U4B; Vitest/RTL covers the dialog and screen integration.

### U4B exact staged-baseline delta and index integrity

- `ComprasScreen.tsx`: 39 additions + 2 deletions; `comprasScreen.test.tsx`: 69 + 2; new `ImportarCompraSurface.tsx`: 161; new `importarCompraSurface.test.tsx`: 126. Total exact four-path delta: **399 changed lines**, strictly below 400.
- Cached index remained unchanged: tracked U4B edits are unstaged and the two new U4B files are untracked; no index-writing command ran. Cached binary diff hash: `adf9192d8ae451092acbee6c40fca63738d66bfe6c580debc54d74902cd080c6`.
- Rollback boundary is exactly the four U4B code/test paths above. OpenSpec bookkeeping is separate and U5/AppShell paths were not edited.

## U4B StrictMode remediation — verified blocker only

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blockers or unsafe `actionContext` warnings were present.
- Scope consumed: only the verified U4B StrictMode blocker. Allowed source/test paths were `src/features/compras/ImportarCompraSurface.tsx`, `tests/unit/importarCompraSurface.test.tsx`, `src/features/compras/ComprasScreen.tsx`, and `tests/unit/comprasScreen.test.tsx`; no screen or other source path was edited. No AppShell, later unit, branch, commit, reset, push, PR, review lifecycle, receipt, or delivery gate action was performed.
- Workload decision consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`; the user explicitly required no size exception and an exact U4B delta below 400.
- Skill resolution: `paths-injected`; the injected GARFEX Design System guidance was loaded. No new visual component, token, CSS, listener, or shared primitive was introduced.

### Strict-TDD remediation evidence

- RED: added a regression that renders `ImportarCompraSurface` inside `React.StrictMode`, awaits `onImported` before close, retries after close to prove pending submission clears, and keeps the real-unmount regression under StrictMode. Current mounted guard failed as required: **1 test failed, 9 passed**, with `onImported` called 0 times.
- GREEN: `mountedRef.current = true` is now set in effect setup and `false` in cleanup, so StrictMode setup→cleanup→setup leaves the live instance active while a real unmount remains inactive. The focused surface suite passed **9/9**.
- TRIANGULATE: focused U4B/screen/history/API tests passed **30/30** across `importarCompraSurface`, `comprasScreen`, `historialComprasStage`, `comprasApiReads`, and `comprasApiMutations`.
- REFACTOR: compressed existing U4B source/test formatting and helpers without removing assertions or paths. The exact four-path delta remains **399 changed lines**: `ImportarCompraSurface.tsx` 158, `importarCompraSurface.test.tsx` 129, `ComprasScreen.tsx` 39 additions + 2 deletions (41), and `comprasScreen.test.tsx` 69 additions + 2 deletions (71). No size exception was used.

### Remediation verification

- `pnpm exec vitest run tests/unit/importarCompraSurface.test.tsx --reporter=dot` — **9 passed, 0 failed**.
- `pnpm exec vitest run tests/unit/importarCompraSurface.test.tsx tests/unit/comprasScreen.test.tsx tests/unit/historialComprasStage.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts --reporter=dot` — **5 files, 30 tests passed**.
- `pnpm typecheck` — **passed**; route generation produced no additional route-tree diff.
- Scoped Prettier check for the exact four paths — **passed**.
- Scoped `git diff --check` for the exact four paths — **passed**.
- Exact four-path count assertion — **399**, strictly `<400`.
- Cached index remained unchanged; U4B source/test files remain unstaged/untracked as before. No disallowed lifecycle action was performed.

### Persisted task state and remaining boundary

- U4B implementation-owned rows were already visibly `- [x]` in `openspec/changes/compras-partidas-vinculacion/tasks.md`; this remediation adds no new task row and preserves all ownership markers byte-for-byte.
- Remaining unchecked implementation work begins at U5. Parent-owned bounded-review and final-delivery rows remain deferred and unchanged. `next_recommended: parent-lifecycle` for this apply phase; no U5 work was started.

### Remaining exact unchecked task rows

- [ ] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->
- [ ] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- src/app/shell/AppShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->
- [ ] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

## U5 apply — navigation wiring completed

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No unsafe `actionContext` warning or native blocker was present.
- Workload gate consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; U5 remained the assigned sub-400-line slice. No size exception or delivery lifecycle action was used.
- OpenSpec correction before implementation: replaced the stale U5 permitted test path `src/app/shell/AppShell.test.tsx` with the actual `tests/unit/appShell.test.tsx`. Added `src/shared/keyboard/keyboardControllerContext.ts` to the permitted U5 surfaces because `KeyboardSurface` is the active-surface type consumed by the shell and currently lacked `compras`; no unrelated keyboard listener or shortcut semantics were changed.
- Strict TDD safety net: `pnpm exec vitest run tests/unit/appShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` passed **33 tests** before editing the existing AppShell test.
- RED: updated `tests/unit/appShell.test.tsx` first with the fifth-link order, Compras href/spatial id/active route, arrow/Home/End behavior, native Enter navigation, topbar label, static placeholder preservation, and a narrow `KeyboardControllerProvider` active-surface observation. `pnpm exec vitest run tests/unit/appShell.test.tsx` observed **24 passed, 5 failed** against the four-link/static Compras baseline.
- GREEN/TRIANGULATE: minimal AppShell/context wiring made the focused suite pass: `pnpm exec vitest run tests/unit/appShell.test.tsx` — **29 passed, 0 failed**; combined focused command `pnpm exec vitest run tests/unit/appShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` — **34 passed, 0 failed**. Coverage includes exact order, fifth-link boundaries, active aria-current, Enter/router navigation, active surface, and topbar label.
- Required checks: `pnpm router:check` — passed; `pnpm typecheck` — passed; `pnpm exec prettier --check src/app/shell/AppShell.tsx src/shared/keyboard/keyboardControllerContext.ts tests/unit/appShell.test.tsx` — passed.
- Configured command note: `pnpm test -- tests/unit/appShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` ran the repository-wide Vitest collection and returned **101 passed, 1 failed / 860 passed, 1 failed** because the out-of-scope existing `tests/architecture/catalogHierarchyBoundaries.test.ts` still asserts four shell links and rejects `/compras`. It was not modified because U5 was explicitly bounded to the three code/test paths below and changing unrelated navigation guard semantics was not authorized. The direct focused command above is green.
- Exact U5 code/test delta against the staged baseline: `src/app/shell/AppShell.tsx` **22 additions / 8 deletions**, `src/shared/keyboard/keyboardControllerContext.ts` **6 additions / 1 deletion**, `tests/unit/appShell.test.tsx` **59 additions / 7 deletions**; total **87 additions + 16 deletions = 103 authored lines**, strictly `<400`.
- Index integrity: `git diff --cached` remained unchanged; no staged baseline path was edited, and no git add/commit/branch/reset/push/PR/review action was performed.

### U5 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U5 navigation wiring | `tests/unit/appShell.test.tsx` | Integration-style RTL/router test | ✅ 33 focused tests | ✅ 24 passed, 5 failed after required RED edits | ✅ 29 passed; combined navigation guard 34 passed | ✅ order, aria-current, spatial id, arrow/Home/End, Enter/router, surface, topbar, placeholders | ✅ Prettier passed; exact three-path delta 103 lines |

### U5 persisted task state

- U5 RED, GREEN, TRIANGULATE, and REFACTOR implementation rows are visibly `- [x]` in `openspec/changes/compras-partidas-vinculacion/tasks.md`.
- Parent-owned lifecycle rows remain unchanged and deferred.

### U5 remediation — catalog hierarchy destination guard

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocker or unsafe `actionContext` warning was present.
- Scope was limited to the already observed U5-caused RED in `tests/architecture/catalogHierarchyBoundaries.test.ts`. No AppShell, `KeyboardSurface`, unit-test, route, production, or unrelated guard behavior was changed.
- OpenSpec bookkeeping: added `tests/architecture/catalogHierarchyBoundaries.test.ts` to the U5 permitted surfaces in `tasks.md` and here, with the rationale that U5 makes Compras the fifth approved real `Link`; the guard now allows `/compras` while continuing to reject atributos/presentación destinations and placeholders/routes.
- Minimal guard correction: changed the approved shell-link count from **4 to 5**, added a positive `/compras` assertion, and removed only `compras` from the forbidden-destination regex. The atributos/presentación protections remain active.
- Direct focused architecture/AppShell verification: `pnpm exec vitest run tests/unit/appShell.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts` — **35 passed, 0 failed**.
- Keyboard architecture regression: `pnpm exec vitest run tests/architecture/keyboardBoundaries.test.ts` — **5 passed, 0 failed**.
- `pnpm router:check` — passed; `pnpm typecheck` — passed and route generation produced no working-tree route delta.
- Scoped formatting: `pnpm exec prettier --check src/app/shell/AppShell.tsx src/shared/keyboard/keyboardControllerContext.ts tests/unit/appShell.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts` — passed.
- Diff validation: `git diff --check` — passed. Full U5 authored delta across `AppShell.tsx`, `KeyboardSurface` context, `tests/unit/appShell.test.tsx`, and `tests/architecture/catalogHierarchyBoundaries.test.ts`: **108 changed lines** (`22+8`, `6+1`, `59+7`, `3+2`), strictly `<400`.
- Index/lifecycle evidence: current cached diff hash `d21dbb47756d04f397d899f2e87b8942a3c94bea8a84faf105a1202eac58f31f`; staged U5 paths are empty. No `git add`, commit, branch, reset, push, PR, review, receipt, delivery gate, or archive action was performed.
- Persisted tasks were re-read after the remediation: all four U5 implementation rows remain visibly `- [x]`; no checkbox state changed. Parent-owned lifecycle rows remain deferred.
- Remaining work is unchanged and begins with the exact unchecked U6 row retained below: `- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->`

## U6 planning correction — authorized U6A badge/token slice

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The user resolved the delivery boundary to U6A only; no size exception, branch, commit, push, PR, review lifecycle, receipt, delivery gate, reset, or index mutation is authorized.
- User decision recorded: split U6 into U6A badge/token and U6B detail/mount, preserve U6A → U6B → U7, and apply only U6A against the staged U5 baseline. `CompraDetalleStage`, screen mounting/fetch, U6B, linking, U7 and later units are explicitly deferred.
- OpenSpec planning updated before source work: `design.md` and `tasks.md` now use the exact lowercase badge test path `tests/unit/partidaEstadoBadge.test.tsx`, add `src/styles.css` as a required Tailwind `@theme inline` surface, and define five exact U6A paths with a `<400` authored-line gate. U6B has separate lowercase future paths and remains unchecked.
- Audit result recorded before implementation: no warning-equivalent token, warning mapping, or shared badge/status component exists. Existing `success` tokens are reusable; `NO_APLICA` uses neutral DS tokens; `CONFLICTO` uses existing primary/danger-adjacent tokens. Only warning tokens are authorized; `error` and `info` remain absent.
- Authorized U6A paths: `src/features/compras/PartidaEstadoBadge.tsx`, `tests/unit/partidaEstadoBadge.test.tsx`, `src/shared/design-system/tokens.css`, `src/styles.css`, and `docs/design-system.md`. The staged index is the U5 baseline and must remain unchanged.
- No U6A source/test work has started in this planning update. Next action is strict-TDD RED: create the lowercase badge test first, observe missing-module RED, then implement only the five authorized paths.

## U6A apply — badge/token slice completed

- U6A was applied only against the staged U5 baseline. No `CompraDetalleStage`, `ComprasScreen` mounting/fetch, U6B, linking, U7 or later-unit path was edited.
- TDD RED: created `tests/unit/partidaEstadoBadge.test.tsx` first and ran `pnpm exec vitest run tests/unit/partidaEstadoBadge.test.tsx --reporter=verbose`; the suite failed before collection with the real missing-module error for `PartidaEstadoBadge`.
- GREEN/TRIANGULATE: implemented the exact `LinkStatus` union contract with visible Spanish labels, `role="status"`, `Estado: …` accessible names, distinct semantic class contracts, and no raw hex/arbitrary utility/icon source. The first GREEN run exposed an over-broad test regex matching TypeScript array indexing; the test-only assertion was narrowed to Tailwind arbitrary utilities. Final focused badge verification passed **3 tests, 0 failed**.
- Audit outcome: no Tailwind architecture test exists in `tests/architecture/` or elsewhere under `tests/` for `styles.css`/`@theme`; it was discovered absent and no unrelated test was invented.
- Authorized token extension: `--color-warning: #8a6800` is the warning foreground and `--color-warning-subtle: #fff8d6` is the subtle warning background. Both are mapped in `src/styles.css`; `error` and `info` remain absent. `VINCULADO` reuses success, `NO_APLICA` neutral, and `CONFLICTO` existing primary/danger-adjacent utilities.
- Verification: `pnpm typecheck` passed; scoped Prettier check over all five U6A paths passed; scoped `git diff --check` passed. The combined command initially stopped at Prettier's formatting check after typecheck; the isolated rerun passed and diff check passed.
- Exact five-path staged-baseline count after scoped Prettier refactor: `PartidaEstadoBadge.tsx` 38 lines, `partidaEstadoBadge.test.tsx` 72 lines, `tokens.css` 2 additions, `styles.css` 2 additions, `docs/design-system.md` 4 additions + 1 deletion: **119 authored changed lines**, strictly `<400`.
- Persisted task state: the four U6A implementation rows in `tasks.md` are visibly `- [x]`; U6B and all U7+ implementation rows remain unchecked, and parent-owned rows remain deferred.
- Staged-index integrity: cached diff hash remained `8e3ed9ffcea3ade10ae520764a81bd3462d6ac13ccc2851c90ed3e56156410e1`; no `git add`, commit, branch, reset, push, PR, review lifecycle, receipt, delivery gate, or archive action was performed.
- Rollback boundary: remove only the five U6A paths' authored changes; leave the staged U5 baseline and all U6B/later work untouched.
- Next recommended action: `parent-lifecycle`; U6B is not authorized by this slice.

#### U5 remediation evidence

| Scope | Evidence |
| --- | --- |
| Existing RED | Prior U5 progress records the repository-wide configured run failing only because this guard still expected four links and rejected `/compras`. |
| GREEN | The minimal destination-guard update passes with the existing five-link AppShell implementation. |
| TRIANGULATE | AppShell + catalog guard 35/35, keyboard guard 5/5, router check, typecheck, scoped Prettier, and diff check all pass. |
| REFACTOR | Four-path authored delta is 108 changed lines; no production or unrelated protection was weakened. |

`next_recommended: parent-lifecycle` — U5 remediation is complete; parent-owned review and delivery actions remain outside this apply executor.

### Remaining exact unchecked task rows

- [ ] Añadir pruebas fallidas de carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación y los cuatro badges sin depender sólo del color. <!-- sdd-owner: implementation -->
- [ ] Implementar el detalle con componentes compartidos y formato sólo en el borde de render; implementar `PartidaEstadoBadge` y agregar/documentar `warning` únicamente tras confirmar que no existe un rol equivalente. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/CompraDetalleStage.test.tsx tests/unit/PartidaEstadoBadge.test.tsx tests/unit/ComprasScreen.test.tsx` y verificar accesibilidad, foco, lectura textual de estados y ausencia de edición/matching local. <!-- sdd-owner: implementation -->
- [ ] Ajustar composición a los patrones del Design System, sin CSS feature-local ni valores Tailwind arbitrarios, y mantener el diff menor de 400 líneas incluyendo documentación necesaria. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->


## U6B apply — detail/mount slice paused at review budget

- Structured status consumed before source work: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The parent prompt authorized U6B only and explicitly prohibited size exception, branch, commit, push, PR, review lifecycle, receipt, reset, and delivery actions.
- Skill resolution: `paths-injected`; loaded the injected GARFEX Design System, UI/UX Pro Max, and work-unit skills. The Design System checklist was completed before UI code: existing `PageHeader`, `WorkCard`, `Button`, and `PartidaEstadoBadge` were reused; no shared component, feature CSS, raw color, arbitrary utility, or dark-mode implementation was added.
- Planning correction completed before source work: U6B now names lowercase repository tests `tests/unit/compraDetalleStage.test.tsx` and `tests/unit/comprasScreen.test.tsx`, and explicitly includes the five exact paths including `tests/architecture/queryZodBoundaries.test.ts`. The guard path is necessary because `CompraDetalleStage` uses the approved named `useQuery` import; its binding is exact and does not authorize forbidden members.
- Strict TDD RED: created `tests/unit/compraDetalleStage.test.tsx` before `CompraDetalleStage.tsx`; `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx --reporter=verbose` failed before collection with the real missing-module resolution error. Added the screen mount RED after the detail test; the focused screen run failed on the existing U6 placeholder because the detail heading was absent.
- GREEN: implemented one Query key containing the selected purchase id, authoritative `getPurchase` and `listPurchaseLines` reads with the same Query signal, loading/error/retry/empty/ready states, immutable document and line fields, separate relation region, four `PartidaEstadoBadge` states, focus, and back navigation. Mounted the detail only for a selected id; changing supplier clears the id and no detail read occurs before selection. No link/unlink/status actions, selectors, matching, creation, or U7+ behavior was added.
- TRIANGULATE: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/comprasScreen.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **15 passed, 0 failed**. `pnpm typecheck` passed; `pnpm router:check` passed; scoped Prettier passed; `git diff --check` plus an explicit untracked-file whitespace check passed.
- Review-budget stop: the exact five U6B source/test/guard paths currently total **538 authored changed lines** after required Prettier formatting: `CompraDetalleStage.tsx` 237, `compraDetalleStage.test.tsx` 171, `ComprasScreen.tsx` 49 changed, `comprasScreen.test.tsx` 79 changed, and the Query guard 2 additions. This is above the strict `<400` requirement. Per the user instruction, no code-golf, test deletion, behavior cutting, or size exception was attempted; implementation stops here and the U6B REFACTOR row remains unchecked.
- Persisted task state: U6B RED, GREEN, and TRIANGULATE rows are visibly `- [x]`; U6B REFACTOR remains `- [ ]`. Parent-owned rows remain unchanged. U6A remains closed in the staged baseline.
- Changed U6B paths: `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`, `src/features/compras/ComprasScreen.tsx`, `tests/unit/comprasScreen.test.tsx`, and `tests/architecture/queryZodBoundaries.test.ts`, plus the persisted OpenSpec planning/progress artifacts. The staged index was not modified.
- Remaining exact U6B task row: `- [ ] Mantener U6B separada de U6A, por debajo de 400 líneas y sin tocar tokens/documentación del badge salvo corrección estrictamente necesaria. <!-- sdd-owner: implementation -->`
- Next recommended action: `parent-lifecycle` for a delivery/slicing decision; do not claim U6B complete until the parent resolves the over-budget boundary without weakening required behavior.

## U6B split apply — U6B1 detail/query complete; U6B2 screen mount pending

- Structured status consumed before this correction: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The user explicitly resolved the current U6B split as U6B1 detail/query plus U6B2 screen mounting, required U6B1 `<400`, and prohibited exception, branch, commit, add, reset, push, PR, review, delivery-gate, and screen-path edits.
- Planning split persisted in `design.md` and `tasks.md`: U6B1 owns `CompraDetalleStage`, its test, and the narrow Query binding; U6B2 owns `ComprasScreen` and `tests/unit/comprasScreen.test.tsx`. U6B1 implementation rows are now visibly checked; all U6B2 rows remain unchecked despite existing worktree changes.
- Existing strict-TDD evidence was preserved rather than fabricated: the prior U6B RED missing-module failure, GREEN implementation, and TRIANGULATE coverage remain the evidence for U6B1. The refactor changed only the detail component/test paths and did not introduce a new behavior requirement.
- Refactor: `CompraDetalleStage.tsx` now uses local data-driven line-table helpers to remove duplicated table markup while retaining every original purchase/line field, read-only regions, relation separation, precision strings, focus/back behavior, loading/error/retry/empty states, and all four `PartidaEstadoBadge` instances. The component/test behavior is unchanged; a transient badge omission during refactor was caught by the focused test and corrected before completion.
- Exact U6B1 three-path delta: **387 changed lines** — `src/features/compras/CompraDetalleStage.tsx` **214**, `tests/unit/compraDetalleStage.test.tsx` **171**, and `tests/architecture/queryZodBoundaries.test.ts` **2 guard additions**. This is strictly below 400 and within the requested `<=390` target; no test deletion, coverage weakening, minification, or exception was used.
- Verification: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/unit/comprasScreen.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **18 passed, 0 failed**; `pnpm typecheck` — passed; scoped Prettier check over U6B1 plus the untouched U6B2 paths — passed; tracked `git diff --check` and untracked whitespace check — passed.
- Screen boundary preserved: no edit was made to `src/features/compras/ComprasScreen.tsx` or `tests/unit/comprasScreen.test.tsx`; their existing unstaged U6B2 worktree changes remain present and were only included in the requested regression/format checks. They are not staged or reported complete.
- Changed paths in this correction: `src/features/compras/CompraDetalleStage.tsx`, `openspec/changes/compras-partidas-vinculacion/design.md`, `openspec/changes/compras-partidas-vinculacion/tasks.md`, and this progress artifact. The Query guard and U6B2 screen paths were not edited in this correction.
- Workload / PR boundary: U6B1 only, as the detail/query slice in the feature-branch-chain plan. U6B2 is a separate future boundary and remains pending independent verification and later authorized staging. No index mutation occurred.
- Remaining exact U6B2 implementation rows are preserved in `tasks.md`:
  - [ ] Añadir/confirmar la RED específica de montaje, selección, back, reset por proveedor y ausencia de fetch antes de selección; no reutilizar la evidencia U6B1 como evidencia U6B2. <!-- sdd-owner: implementation -->
  - [ ] Verificar y entregar el montaje existente sólo en los dos paths U6B2, sin tocar `CompraDetalleStage`, el guard de Query ni el badge. <!-- sdd-owner: implementation -->
  - [ ] Ejecutar de forma independiente la regresión de pantalla, typecheck, Prettier y diff/staging autorizado; registrar resultados reales. <!-- sdd-owner: implementation -->
  - [ ] Mantener U6B2 separada de U6B1, por debajo de 400 líneas y sin declarar completitud por la mera presencia de cambios en el worktree. <!-- sdd-owner: implementation -->
- Next recommended action: `parent-lifecycle`; U6B1 is complete, U6B2 remains pending and must not be claimed complete from its existing worktree presence.

## U6B1 remediation — authoritative supplier ID presentation

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and allowed edit root equal to the workspace. No native blocker or unsafe `actionContext` warning was present.
- Skill resolution: `paths-injected`; the injected GARFEX Design System guidance and strict-TDD contract were loaded. The existing immutable document metadata structure and semantic classes were reused; no new component, token, CSS, arbitrary utility, or dark-mode behavior was introduced.
- Scope was limited to the confirmed U6B1 finding: visible authoritative `purchase.supplierId` was missing. No ambiguous purchase ID, timestamp, or line-ID metadata was added, and `ComprasScreen.tsx` / `tests/unit/comprasScreen.test.tsx` were not edited.
- RED: added the focused `supplier-77` assertion to `tests/unit/compraDetalleStage.test.tsx` before production editing. `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx --reporter=verbose` failed on the missing visible supplier ID, as required.
- GREEN: added `['ID del proveedor', purchase.supplierId]` to the existing `fields()` metadata presentation in `src/features/compras/CompraDetalleStage.tsx`; the value remains read-only and preserves its string representation.
- TRIANGULATE: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/unit/comprasScreen.test.tsx tests/architecture/queryZodBoundaries.test.ts --reporter=dot` — **4 files, 18 tests passed**. This includes the U6B1 detail/badge/query coverage and the screen regression without editing U6B2 paths.
- Quality checks: `pnpm typecheck` — passed; scoped Prettier check over U6B1 and screen-regression paths — passed; `git diff --check` — passed.
- Exact U6B1 three-path delta after remediation: **389 changed lines** — `CompraDetalleStage.tsx` **215**, `compraDetalleStage.test.tsx` **172**, and `queryZodBoundaries.test.ts` **2 guard additions**. This remains strictly below 400; the two added lines are the production metadata row and its focused assertion.
- Persisted task state: the U6B1 RED, GREEN, TRIANGULATE, and REFACTOR rows remain visibly `- [x]`; the REFACTOR wording now records the corrected 389-line measurement. All U6B2 rows remain unchecked and unchanged. No git staging or lifecycle action was performed.
- Next recommended action: `parent-lifecycle`; this remediation is complete and U6B2 remains deferred.

## U6B2 apply — screen mounting slice verified

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`, while this U6B2 slice remains below 400. The user resolved this work-unit boundary and prohibited changes outside the two U6B2 paths, git add/commit/branch/reset/push/PR/review/exception actions.
- Skill resolution: `paths-injected`; the GARFEX Design System skill and required references were loaded before UI validation. Existing `PageHeader`, `WorkCard`, `Button`, `HistorialComprasStage`, and `CompraDetalleStage` contracts were reused; no visual component, token, CSS, or shared code was added.
- Prior combined-TDD RED/GREEN evidence was preserved as requested; no artificial RED rerun or replacement evidence was created. The existing U6B2 test coverage was independently exercised against the staged U6B1 baseline.
- Validation found no necessary source correction. `ComprasScreen` mounts `CompraDetalleStage` only after selection, passes the exact selected purchase ID and injected `purchasesApi`, keeps detail reads absent before selection, preserves authoritative supplier/history/import behavior, clears selection on back and supplier change, and removes stale detail before returning to supplier selection.
- Completed implementation-owned U6B2 task rows in `tasks.md`: RED confirmation, existing two-path mounting verification, independent regression/typecheck/Prettier/diff checks, and the under-400-line separation/refactor check. Each is now visibly `- [x]`; parent-owned rows remain unchanged.
- Exact unstaged U6B2 delta: **128 changed lines** across `src/features/compras/ComprasScreen.tsx` (**28 additions / 21 deletions**) and `tests/unit/comprasScreen.test.tsx` (**72 additions / 7 deletions**). The staged U6B1 component, test, and Query guard were not edited; no index mutation occurred.

### U6B2 TDD Cycle Evidence

| Task | Test file | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| Screen mounting and reset flow | `tests/unit/comprasScreen.test.tsx` | RTL screen integration | ✅ Prior combined-TDD RED evidence preserved; not fabricated or rerun | ✅ Existing two-path implementation mounts exact ID/API and gates reads until selection | ✅ Screen/detail/history/import/badge regression passed; router, typecheck, Prettier, and diff checks passed | ✅ 128 changed lines, below 400; U6B1 paths/index untouched |

### U6B2 verification commands and actual results

- `pnpm exec vitest run tests/unit/comprasScreen.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/historialComprasStage.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **30 passed, 0 failed**.
- `pnpm router:check` — passed; route generation check completed.
- `pnpm typecheck` — passed; route generation and TypeScript build completed.
- `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx src/features/compras/HistorialComprasStage.tsx tests/unit/historialComprasStage.test.tsx src/features/compras/ImportarCompraSurface.tsx tests/unit/importarCompraSurface.test.tsx` — passed.
- `git diff --check` — passed.
- Index integrity: staged U6B1 entries remained `src/features/compras/CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx`; no git staging or lifecycle action was performed.
- Runtime harness: `N/A` — this slice has no independent browser journey; RTL/Vitest and the requested static gates are the authorized evidence.

### Remaining exact unchecked implementation rows

- [ ] Añadir pruebas fallidas de bloqueo con `supplierProductId: null`, búsqueda acotada al proveedor, no-confirmación por SKU/descripción, selección explícita de recurso, actor, estado ocupado y relectura posterior a link. <!-- sdd-owner: implementation -->
- [ ] Implementar `VincularPartidaSurface` con ambos `StagedSearchSelector` existentes, adapters U1A/U1B y relecturas autoritativas; no crear productos, no deducir matching y no actualizar filas de forma optimista. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/VincularPartidaSurface.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar que una partida nullable no ofrece selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->
- [ ] Reducir lógica de presentación sin extraer facades/repositorios, conservar contratos semánticos de los selectores compartidos y dejar el diff menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

### Deferred parent-owned lifecycle rows

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

- Next recommended action: `parent-lifecycle`; U6B2 is complete for apply, while U7+ and parent-owned delivery actions remain deferred.

## U7 planning split and U7A apply — stopped at exact two-path budget gate

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The parent prompt explicitly authorized U7A only, required the U7A→U7B→U8 split, prohibited U7B/detail edits and all delivery lifecycle actions, and required an exact two-path delta strictly below 400.
- Planning correction persisted before source work: `design.md` and `tasks.md` now split U7 into U7A standalone surface/test and U7B conditional detail mount/test, preserve U7A→U7B→U8 order, and use the canonical lowercase `tests/unit/vincularPartidaSurface.test.tsx` path. U7A explicitly excludes `CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx`.
- Strict-TDD RED: created `tests/unit/vincularPartidaSurface.test.tsx` first and observed the real missing-module failure for `VincularPartidaSurface`; the initial test syntax collision was corrected before the valid missing-module run and did not involve production code.
- GREEN: implemented only `src/features/compras/VincularPartidaSurface.tsx`. The surface requires `supplierProductId: string`, receives `ResourcesMasterRestReadApi`, uses `useResourcesMasterRestWindow` only while open with `ACTIVE`/`limit: 20`, reuses `StagedSearchSelector<Resource>` with `maxVisibleRows` to suppress load-more, provides explicit flag-gated Previous/Next controls, identifies `identityV1` plus resource ID, separates selection from exact `{ id: supplierProductId, resourceId }` mutation, awaits `onLinked`, blocks busy dismissal/duplicates, reports retryable actor/backend errors, restores focus, and guards StrictMode/unmount completion. No product creation, matching, optimistic cascade, detail mount, or screen edit was added.
- Focused surface test: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx --reporter=dot` — **7 passed, 0 failed**. This is the only runtime evidence recorded before the required budget stop; the requested API/window regression, typecheck, Prettier, and final diff gates were not run.
- Exact two-path authored delta: `src/features/compras/VincularPartidaSurface.tsx` **249 lines** plus `tests/unit/vincularPartidaSurface.test.tsx` **208 lines** = **457 changed lines**, strictly over the required `<400` budget. Per the user instruction, implementation stops here; no compression, test deletion, behavior reduction, size exception, staging, or delivery action was attempted.
- Persisted task state: U7A RED and GREEN rows are visibly `- [x]`; U7A TRIANGULATE and REFACTOR remain `- [ ]` because the full requested evidence and budget gate did not complete. U7B rows remain unchecked and its two detail paths were not edited. Parent-owned rows remain unchanged.
- Changed source/test paths: `src/features/compras/VincularPartidaSurface.tsx` and `tests/unit/vincularPartidaSurface.test.tsx`. Planning/progress artifacts were updated only to record the U7A/U7B split and this stopped result. No `git add`, commit, branch, reset, push, PR, review lifecycle, receipt, delivery gate, or index mutation was performed.
- Rollback boundary: remove only the two U7A source/test paths and the U7A planning/progress bookkeeping; preserve the staged U6B2 baseline, `CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`, U7B, and U8.

### U7A TDD Cycle Evidence

| Task | Test file | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| Standalone linking surface | `tests/unit/vincularPartidaSurface.test.tsx` | ✅ Real missing-module failure before source | ✅ Focused surface suite 7/7 | ⛔ Stopped before API/window regression and full requested gates | ⛔ Blocked at 457 exact two-path lines |

### Current next recommendation

`parent-lifecycle` — the historical combined U7A stop is superseded by the U7A1 selection correction below; U7A2 mutation and U7B mount remain deferred.

## U7A1 apply — selection-only correction closed at 399 lines

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` was the allowed edit root with no native blocker or unsafe `actionContext` warning.
- Workload decision consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The user explicitly selected U7A1 only, required the sequence U7A1 selection → U7A2 mutation → U7B mount, required an exact two-path delta `<400`, and prohibited detail/U7B edits and all stage/git lifecycle actions.
- Planning correction persisted: `design.md` and `tasks.md` now define U7A1 as selection-only, U7A2 as the later mutation on the same two paths, and U7B as the later detail mount. U7A1 owns only `VincularPartidaSurface.tsx` and `vincularPartidaSurface.test.tsx`; `CompraDetalleStage.tsx` and its test were not edited.
- Safety net: the pre-existing combined U7A surface test passed **7/7** before source/test changes. The combined RED evidence is preserved, but mutation assertions are not carried into U7A1 coverage.
- Strict-TDD RED preservation: the rewritten U7A1 test was written before production edits and failed against the combined mutation-oriented surface (**6 failed, 1 passed**); no production code preceded that RED. The test was then narrowed to selection-only behavior without claiming mutation coverage.
- GREEN: `VincularPartidaSurface` now requires a non-null `supplierProductId: string`, visibly preserves supplier context, defers the `ACTIVE` resource window until open with `limit: 20`, uses truthful loading/empty/initial/navigation error and retry states, displays `identityV1` plus ID, uses explicit replacement Previous/Next pagination, and confirms selection through only `onResourceSelected`. It has no link mutation, actor, busy/pending mutation error, optimistic status, product creation, unlink, or `NO_APLICA` behavior.
- Focus/dismiss safety: selection confirmation is synchronous and narrow; Dialog dismissal and Escape restore focus through the existing focus helper; StrictMode/remount and unmount tests cover opening/closing and late read safety without mutation completion claims.
- TRIANGULATE: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx --reporter=dot` — **2 files, 11 tests passed**. Coverage includes deferred read, exact ACTIVE/20 input, context visibility, explicit callback, page replacement and flags, no load-more, loading/empty/initial error/retry, navigation error/retry, focus, StrictMode, and unmount. No mutation test was run or claimed.
- GREEN correction during triangulation: the initial rewritten test run had three expectation/setup failures; they were corrected in the test harness (split cached empty/error Query clients and StrictMode duplicate-read-safe assertions), then the focused suite passed without adding mutation behavior.
- Quality gates: `pnpm typecheck` passed; `pnpm exec prettier --check src/features/compras/VincularPartidaSurface.tsx tests/unit/vincularPartidaSurface.test.tsx` passed after scoped formatting; equivalent untracked-file `git diff --no-index --check` checks emitted no whitespace diagnostics. Typecheck route generation produced no route-tree change.
- Exact two-path delta: `src/features/compras/VincularPartidaSurface.tsx` **194 lines** plus `tests/unit/vincularPartidaSurface.test.tsx` **205 lines** = **399 lines**, strictly below 400. No compression by deleting required behavior, no size exception, no staging, and no delivery lifecycle action was used.
- Persisted task state: all four U7A1 implementation rows are visibly `- [x]`; all four U7A2 rows and all four U7B rows remain visibly `- [ ]`; parent-owned rows remain unchanged. The tasks artifact was re-read after updates.
- Changed paths: `src/features/compras/VincularPartidaSurface.tsx`, `tests/unit/vincularPartidaSurface.test.tsx`, `openspec/changes/compras-partidas-vinculacion/design.md`, `openspec/changes/compras-partidas-vinculacion/tasks.md`, and this progress artifact. No `CompraDetalleStage`/detail test, index entry, branch, commit, reset, push, PR, review, receipt, or delivery gate was touched.

### U7A1 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U7A1 standalone resource selection | `tests/unit/vincularPartidaSurface.test.tsx` | RTL component | ✅ Combined surface baseline 7/7 | ✅ Rewritten selection-only suite failed 6/7 before production edit | ✅ Selection-only implementation passed in focused run | ✅ 11/11 selector + RestWindow regression, including lifecycle/error/paging paths | ✅ Exact two-path delta 399 lines; Prettier and diff checks clean |

### U7A1 boundary after the U7A2 continuation

U7A2 mutation tests and implementation are closed in the following section; they are not claimed as U7A1 evidence.

- [ ] U7B remains deferred to `CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx`. <!-- sdd-owner: implementation -->

### Current next recommendation

`parent-lifecycle` — U7A1 selection is complete and persisted; parent-owned lifecycle actions remain outside apply, while U7A2 mutation and U7B mount are deferred.

## U7A2 apply — confirmed link mutation closed against staged U7A1

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` was the sole allowed edit root and no native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The parent prompt resolved this delivery path and explicitly restricted the slice to the restored U7A2 increment over staged U7A1; no size exception or delivery lifecycle action was used.
- Scope boundary: only `src/features/compras/VincularPartidaSurface.tsx` and `tests/unit/vincularPartidaSurface.test.tsx` were edited in the implementation. `CompraDetalleStage.tsx`, its test, U7B, U8, U9, and the index/staged U7A1 baseline were not edited or staged.
- Historical TDD evidence: the previously observed combined missing-module RED/GREEN is retained as historical evidence. No fresh U7A2 RED was claimed; incremental U7A2 assertions were added against the restored candidate as requested.
- GREEN: the surface now invokes the injected `linkSupplierProduct` only after an explicit resource selection and separate confirmation, with the exact `{ id: supplierProductId, resourceId: selected.id }` payload. It awaits `onLinked(updatedSupplierProduct)` before closing, keeps errors visible and retryable, and does not perform optimistic resource/status updates, product creation, matching, unlink, or `NO_APLICA` behavior.
- Safety behavior: actor-configuration, backend-conflict, and generic errors remain accessible in an alert without closing; pending state blocks Escape/dismissal, duplicate confirmation, selector interaction, paging, retry, and action buttons. The existing mounted guard ignores link and authoritative-callback completion after real unmount; normal dismissal restores focus through the shared helper.
- TRIANGULATE: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts` — **4 files, 28 tests passed**. This covers preserved U7A1 selection/loading/error/paging behavior, exact link payload, retryable actor/backend/generic errors, busy guards, awaited authoritative callback, StrictMode/unmount completion safety, API transport behavior, and the resource RestWindow.
- Quality checks: `pnpm typecheck` — passed; `pnpm exec prettier --check src/features/compras/VincularPartidaSurface.tsx tests/unit/vincularPartidaSurface.test.tsx` — passed; `git diff --check` for the two implementation paths — passed.
- Review workload: final unstaged implementation delta against the staged U7A1 baseline is **367 changed lines** (`275` insertions, `92` deletions) across exactly two paths, strictly below 400. The staged U7A1 baseline remains untouched; no compression or exception was used.
- Persisted task state: all four U7A2 implementation rows are now visibly `- [x]`; U7B/U8/U9 and parent-owned lifecycle rows remain unchecked and deferred. The tasks artifact was re-read after the checkbox update.

### U7A2 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U7A2 confirmed link mutation | `tests/unit/vincularPartidaSurface.test.tsx` | RTL component | ✅ Staged U7A1 selector/paging baseline | ➖ Historical combined missing-module RED only; no fresh RED claimed | ✅ Restored candidate now has exact confirmed mutation and safety guards | ✅ 28-test surface/API/RestWindow regression passed | ✅ 367 changed lines across two paths; Prettier/typecheck/diff checks passed |

### U7A2 remaining boundary

- [ ] U7B remains deferred to `CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx`. <!-- sdd-owner: implementation -->
- [ ] U8 remains deferred; no unlink or `NO_APLICA` behavior was started. <!-- sdd-owner: implementation -->

### Current next recommendation

`parent-lifecycle` — U7A2 is complete and persisted; parent-owned review/delivery actions remain outside `sdd-apply`, and U7B/U8/U9 remain deferred.

## U7B apply — conditional detail mounting complete against staged U7A2

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`. The parent prompt resolved the U7B delivery boundary, explicitly limited the delta to the two detail paths, required `<400` authored lines, and prohibited U8+, screen, unlink, `NO_APLICA`, receipt, review, and git lifecycle actions.
- Skill resolution: `paths-injected`; loaded the injected GARFEX Design System, UI/UX Pro Max, work-unit, and strict-TDD guidance. Existing `VincularPartidaSurface`, `StagedSearchSelector`, `Button`, `Dialog`, and `PartidaEstadoBadge` contracts were reused; no shared UI, CSS, token, raw color, arbitrary utility, or dark-mode behavior was added.
- Scope boundary: only `src/features/compras/CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx` were edited. `VincularPartidaSurface.tsx`, `ComprasScreen.tsx`, unlink, `NO_APLICA`, U8+, the staged index, and all other source paths remained untouched.
- Safety net: the staged U7A2 detail baseline passed **4/4** tests before test edits.
- RED: added focused U7B detail tests first; `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx` failed with **2** expected missing-action failures before production edits.
- GREEN: `CompraDetalleStage` now accepts optional injected `ResourcesMasterRestReadApi`; the existing `createResourcesMasterRestApi` default is created once with `useState`. U7A/U7A2 mounts only when `supplierProductId` is non-null and `linkStatus` is `PENDIENTE` or `CONFLICTO`; nullable, `VINCULADO`, and `NO_APLICA` rows receive no action. The exact supplier-product ID, purchase supplier ID context, resources API, and existing `linkSupplierProduct` are passed through. Resource reads remain deferred by the surface until its dialog opens.
- Authoritative refresh: `onLinked` awaits the existing purchase-detail Query `refetch()` before the surface closes. No local badge/resource mutation or cascade was introduced; loading, refetch, retry, focus, and immutable document rendering remain on the existing detail path.
- TRIANGULATE: the focused detail suite passed **6/6** after adding both pending/conflict condition coverage, exact resource-window/link payload assertions, deferred resource-read coverage, and a pending authoritative reread that keeps the dialog open and the old badge visible until completion.
- Regression checks: detail/surface/API regression `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts` passed **29/29**; `pnpm typecheck` passed; scoped Prettier passed; `git diff --check` passed.
- Exact two-path delta: `git diff --numstat` reports **221 authored changed lines** (`44/5` in `CompraDetalleStage.tsx`, `168/4` in `compraDetalleStage.test.tsx`), strictly below 400. The staged index was not modified; typecheck route generation produced no unstaged route-tree change.
- Persisted task state: all four U7B implementation rows were updated to visibly `- [x]` in `tasks.md` and re-read after the update. Parent-owned rows remain unchanged.

### U7B TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conditional detail mounting and authoritative reread | `tests/unit/compraDetalleStage.test.tsx` | RTL detail integration | ✅ 4/4 staged baseline | ✅ 2 expected failures before production edit | ✅ 6/6 focused detail tests | ✅ 29/29 detail/surface/API regression; exact two-path delta 221; typecheck, Prettier, and diff clean |

### U7B remaining exact unchecked implementation rows

- [ ] Añadir pruebas fallidas de confirmación unlink, transición backend `VINCULADO`→`PENDIENTE`, `NO_APLICA` con y sin producto, controles ocupados, actor ausente y acciones válidas para `CONFLICTO` sin explicar una causa no publicada. <!-- sdd-owner: implementation -->
- [ ] Implementar ambas acciones con los endpoints U1A/U1B, sin optimismo ni cascada local, y conectar sólo las combinaciones permitidas por la tabla de estados del diseño. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/DesvincularPartidaSurface.test.tsx tests/unit/MarcarNoAplicaAction.test.tsx tests/unit/CompraDetalleStage.test.tsx` y verificar relectura autoritativa y mensajes accesibles. <!-- sdd-owner: implementation -->
- [ ] Consolidar sólo variantes locales de confirmación, mantener separados link/unlink/status y dejar el diff menor de 400 líneas con rollback independiente. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

### Deferred parent-owned lifecycle rows

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

### Current next recommendation

`parent-lifecycle` — U7B is complete for apply; U8/U9 and parent-owned review/delivery actions remain deferred.

## U8A apply — standalone unlink confirmation closed against staged U7B

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`, while U8A was forecast below the per-unit budget. The parent prompt explicitly authorized U8A only, required the U8A unlink → U8B `NO_APLICA` → U8C detail-mount order, prohibited U8C/detail edits, U8B implementation, U9, staging, and git lifecycle actions, and required an exact two-path delta below 400 lines.
- Skill resolution: `paths-injected`; loaded the injected GARFEX Design System, UI/UX Pro Max, work-unit, and strict-TDD guidance. Existing `Button`, `Dialog`, `DialogHeading`, `DialogActions`, and `restoreFocusNextFrame` contracts were reused; no shared UI, CSS, token, raw color, arbitrary utility, or detail mount was added.
- Planning correction persisted before source RED: `design.md` and `tasks.md` now split U8 into U8A, U8B, and U8C in that order. U8A owns exactly `src/features/compras/DesvincularPartidaSurface.tsx` and `tests/unit/desvincularPartidaSurface.test.tsx`; U8B owns `MarcarNoAplicaAction.tsx` and its lowercase test path; U8C owns only `CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx`. Existing uppercase U8 test references were corrected to lowercase actual naming. U8B/U8C and U9 remain unchecked.
- Safety net: the existing staged U7B detail/link/API baseline passed **29/29** in the final regression before U8A source/test verification; no existing file was modified.
- RED: wrote `tests/unit/desvincularPartidaSurface.test.tsx` before the production module and observed the real missing-module failure: **1 failed suite, 0 tests collected** because `DesvincularPartidaSurface` did not exist.
- GREEN: implemented only `DesvincularPartidaSurface`. It requires `supplierProductId: string`, injects the exact `unlinkSupplierProduct({ id: supplierProductId })`, performs no request on open/cancel, requires an explicit confirmation, awaits `onUnlinked(updated)` before close, blocks dismiss/duplicate actions while pending, and keeps actor-configuration/backend/generic failures open and retryable.
- Safety behavior: mounted guards ignore late unlink/callback completion after StrictMode/unmount; normal dismissal restores trigger focus through the existing helper. The surface has no `link-status`, resource, matching, product-creation, optimistic badge, or invented `VINCULADO`→`PENDIENTE` behavior.
- TRIANGULATE: focused unlink/API/link/detail regression `pnpm exec vitest run tests/unit/desvincularPartidaSurface.test.tsx tests/unit/comprasApiMutations.test.ts tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx --reporter=dot` — **4 files, 33 tests passed**. Coverage includes exact ID, explicit confirmation/cancel, busy dismissal/duplicate protection, actor/backend/generic retry, awaited callback-before-close, StrictMode/unmount safety, focus restoration, and unchanged U7 link/detail/API behavior.
- Quality checks: `pnpm typecheck` — **passed**; `pnpm exec prettier --check src/features/compras/DesvincularPartidaSurface.tsx tests/unit/desvincularPartidaSurface.test.tsx` — **passed** after formatting; no whitespace diagnostics from scoped `git diff --no-index --check` checks.
- Exact two-path delta: **301 lines** against the staged U7B baseline (`128` production + `173` test), strictly below 400. The staged index hash remained `65f03edcc9e65274edc0e158c0715acff09b6e2254edc19a51339082eba2f655`; no staging or index mutation occurred. `CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx` remain unchanged by U8A.
- Persisted task state: U8A RED, GREEN, TRIANGULATE, and REFACTOR rows were updated to visibly `- [x]` in `tasks.md` and re-read after the update. U8B/U8C/U9 implementation rows and parent-owned lifecycle rows remain unchecked and deferred.

### U8A TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standalone unlink confirmation | `tests/unit/desvincularPartidaSurface.test.tsx` | RTL component | ✅ Staged U7B detail/link/API baseline 29/29 | ✅ Real missing-module failure before source | ✅ Standalone suite 7/7 | ✅ Unlink/API/link/detail regression 33/33 | ✅ Exact two-path delta 301; typecheck, Prettier, and whitespace checks clean |

### U8A changed paths

- `src/features/compras/DesvincularPartidaSurface.tsx`
- `tests/unit/desvincularPartidaSurface.test.tsx`
- `openspec/changes/compras-partidas-vinculacion/design.md` — U8A/U8B/U8C planning split and ordered boundaries.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — lowercase U8 test paths, split task rows, and U8A checkbox completion.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md`

### Remaining exact unchecked implementation rows

- [ ] Escribir primero `tests/unit/marcarNoAplicaAction.test.tsx` con casos de producto presente/ausente, confirmación, actor, busy, errores reintentables y ausencia de link/unlink; no iniciar U8C. <!-- sdd-owner: implementation -->
- [ ] Implementar `MarcarNoAplicaAction` con `setPurchaseLineLinkStatus({ id, status: 'NO_APLICA' })`, sin inventar relaciones ni estados locales. <!-- sdd-owner: implementation -->
- [ ] Ejecutar su prueba y la regresión API, verificando confirmación explícita, callback autoritativo y errores accesibles. <!-- sdd-owner: implementation -->
- [ ] Mantener U8B en sus dos paths y bajo 400 líneas; no editar el detalle hasta U8C. <!-- sdd-owner: implementation -->
- [ ] Añadir primero pruebas de condiciones de montaje: unlink sólo para `VINCULADO` con producto, `NO_APLICA` donde la semántica lo admite, y ausencia de acciones inventadas para `CONFLICTO`/producto nulo. <!-- sdd-owner: implementation -->
- [ ] Montar las acciones standalone y conectar únicamente callbacks de relectura autoritativa; no cambiar datos documentales ni inventar transición local `VINCULADO`→`PENDIENTE`. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la regresión del detalle, unlink, `NO_APLICA` y link, confirmando condiciones y ausencia de llamadas de estado no autorizadas. <!-- sdd-owner: implementation -->
- [ ] Medir los dos paths U8C bajo 400 líneas; conservar U8A/U8B byte-estables y registrar el diff exacto. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

### Deferred parent-owned lifecycle rows

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

### Current next recommendation

`parent-lifecycle` — U8A is complete for apply; U8B/U8C/U9 and parent-owned review/delivery actions remain deferred. Native status remains `ready` with `nextRecommended: apply` because later implementation tasks are still pending; this phase does not perform parent lifecycle or verification actions.

## U8B apply — standalone `NO_APLICA` confirmation closed against staged U8A

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`, while U8B remained below the per-unit limit. The requested delivery path authorized U8B only, required an exact two-path delta below 400 lines, and prohibited detail/mount U8C, unlink-surface edits, U9, staging, and git lifecycle actions.
- Skill resolution: `paths-injected`; loaded the injected GARFEX Design System, UI/UX Pro Max, and work-unit skills. Existing `Button`, `Dialog`, `DialogHeading`, `DialogActions`, and `restoreFocusNextFrame` contracts were reused; no shared UI, CSS, token, raw color, arbitrary utility, or dark-mode behavior was added.
- Scope boundary: only `src/features/compras/MarcarNoAplicaAction.tsx` and `tests/unit/marcarNoAplicaAction.test.tsx` were created. `CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`, `DesvincularPartidaSurface.tsx`, its test, U9, and the staged index were not edited.
- RED: wrote `tests/unit/marcarNoAplicaAction.test.tsx` first and observed the real missing-module failure: **1 failed suite, 0 tests collected**, because `MarcarNoAplicaAction` did not exist.
- GREEN: implemented the required `purchaseLineId`, optional supplier-product context that is never required, injected `setPurchaseLineLinkStatus`, exact `{ id: purchaseLineId, status: 'NO_APLICA' }` payload, explicit confirmation, awaited `onMarked(updatedLine)` before close, and no optimistic status/relationship mutation or other endpoint call.
- Safety behavior: open/cancel never call the setter; pending state blocks Escape/dismissal and duplicate confirmation; actor, backend-conflict, and generic errors remain in an accessible alert and retryable; mounted guards ignore late completion after StrictMode/unmount; normal cancellation restores trigger focus. The trigger does not change to a `NO_APLICA` badge optimistically.
- TRIANGULATE: `pnpm exec vitest run tests/unit/marcarNoAplicaAction.test.tsx tests/unit/comprasApiMutations.test.ts tests/unit/desvincularPartidaSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx` — **4 files, 38 tests passed, 0 failed**. Coverage includes exact payload, supplier-product present/null/absent contexts, explicit confirmation/cancel, busy/dismiss/duplicate protection, actor/backend/generic retry, awaited callback, StrictMode/unmount/focus, and link/unlink/API regression without other endpoint calls.
- Quality checks: `pnpm typecheck` — **passed**; `pnpm exec prettier --check src/features/compras/MarcarNoAplicaAction.tsx tests/unit/marcarNoAplicaAction.test.tsx` — **passed**; `git diff --check` and scoped untracked-file whitespace checks emitted no diagnostics. Typecheck route generation produced no route-tree change.
- Exact two-path delta: **353 lines** (`139` production + `214` test), strictly below 400. No compression, size exception, staging, commit, branch, push, PR, review, receipt, delivery gate, or git lifecycle action was used.
- Persisted task state: all four U8B implementation rows are visibly `- [x]` in `tasks.md`; U8C/U9 implementation rows and parent-owned lifecycle rows remain unchecked. The tasks artifact was re-read after the checkbox update.

### U8B TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standalone `NO_APLICA` confirmation | `tests/unit/marcarNoAplicaAction.test.tsx` | RTL component | ✅ Staged U8A unlink/API/link baseline | ✅ Real missing-module failure before source | ✅ Exact payload and confirmation implementation passed focused tests | ✅ 38/38 action/API/unlink/link tests passed | ✅ Exact two-path delta 353 lines; typecheck, Prettier, and whitespace checks clean |

### U8B remaining exact unchecked implementation rows

- [ ] Añadir primero pruebas de condiciones de montaje: unlink sólo para `VINCULADO` con producto, `NO_APLICA` donde la semántica lo admite, y ausencia de acciones inventadas para `CONFLICTO`/producto nulo. <!-- sdd-owner: implementation -->
- [ ] Montar las acciones standalone y conectar únicamente callbacks de relectura autoritativa; no cambiar datos documentales ni inventar transición local `VINCULADO`→`PENDIENTE`. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la regresión del detalle, unlink, `NO_APLICA` y link, confirmando condiciones y ausencia de llamadas de estado no autorizadas. <!-- sdd-owner: implementation -->
- [ ] Medir los dos paths U8C bajo 400 líneas; conservar U8A/U8B byte-estables y registrar el diff exacto. <!-- sdd-owner: implementation -->
- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

### Deferred parent-owned lifecycle rows

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

### Current next recommendation

`parent-lifecycle` — U8B standalone `NO_APLICA` is complete for apply; U8C, U9, and parent-owned review/delivery actions remain deferred. Native status remains `ready` with `nextRecommended: apply` because later implementation tasks are still pending; this phase does not perform parent lifecycle, bounded review, or delivery actions.

## U8C apply — conditional action mounting closed against staged U8B

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace root `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root. No native blocker or unsafe `actionContext` warning was present.
- Workload gate consumed: `Decision needed before apply: No`; `Chained PRs recommended: Yes`; `Chain strategy: feature-branch-chain`; aggregate `400-line budget risk: High`, while U8C remained below the per-unit limit. The user authorized U8C only, required strict TDD, an exact two-path delta below 400 lines, and prohibited standalone action, screen, API, U9, and git lifecycle edits.
- Skill resolution: `paths-injected`; loaded the injected GARFEX Design System, UI/UX Pro Max, and work-unit skills. Existing `DesvincularPartidaSurface`, `MarcarNoAplicaAction`, `VincularPartidaSurface`, `Button`, and `Dialog` contracts were reused; no shared UI, CSS, token, raw color, arbitrary utility, or dark-mode behavior was added.
- Scope boundary: only `src/features/compras/CompraDetalleStage.tsx` and `tests/unit/compraDetalleStage.test.tsx` changed for U8C. Standalone action files, `ComprasScreen`, API files, U9, and the staged index were not edited.
- RED: added the exact relationship/action matrix tests first and ran `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx --reporter=verbose`; the new `null + PENDIENTE` case failed because `MarcarNoAplicaAction` was not mounted, while the pre-existing detail cases passed.
- GREEN: mounted only the permitted actions: null product with `PENDIENTE`/`CONFLICTO` gets `MarcarNoAplicaAction`; identified product with `PENDIENTE`/`CONFLICTO` gets link plus mark; identified `VINCULADO` gets unlink; `NO_APLICA` gets no action and visible `No aplica a un recurso maestro`; inconsistent null `VINCULADO` gets no mutation action. Link, unlink, and status callbacks await the existing detail `query.refetch()` before the standalone surface closes.
- TRIANGULATE: the matrix asserts exact action visibility for all eight combinations, no premature resource or mutation calls, no invented conflict-cause copy, and no optimistic state. Mounted-action tests assert `{ id: 'supplier-product-1' }` for unlink and `{ id: 'line-1', status: 'NO_APLICA' }` for status, keep dialogs open while the reread is pending, and close only after authoritative detail data resolves. Existing link payload/reread coverage remains active.
- Verification: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/restTransportBoundaries.test.ts --reporter=dot` — **8 files, 67 tests passed, 0 failed**. `pnpm typecheck` — **passed**. Final `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**. `git diff --check` — **passed**.
- Exact two-path delta: **234 changed lines / 243 authored additions-plus-deletions** (`45` additions and `7` deletions in the component; `189` additions and `2` deletions in its test), strictly below 400. No compression, size exception, staging, commit, branch, push, PR, review, receipt, delivery gate, or git lifecycle action was used.
- Persisted task state: all four U8C implementation rows are visibly `- [x]` in `tasks.md`; U9 implementation rows and parent-owned lifecycle rows remain unchecked. The tasks artifact was re-read after the checkbox update.

### U8C TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conditional action matrix | `tests/unit/compraDetalleStage.test.tsx` | RTL component | ✅ Staged U8B standalone/API/link baseline | ✅ Exact matrix failed before mounting standalone actions | ✅ 67-test detail/surface/API/architecture regression passed | ✅ Matrix, endpoint payloads, reread-before-close, no optimistic state, typecheck, Prettier, and diff checks clean |

### U8C remaining exact unchecked implementation rows

- [ ] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->
- [ ] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->
- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

### Deferred parent-owned lifecycle rows

- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

### U9 apply — blocked pending surface integrated against staged U8C baseline

- Structured status consumed before editing: `gentle-ai.sdd-status` v2 for `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blocked reasons. `actionContext.mode` was `repo-local`; no unsafe-root warning was present.
- Workload decision consumed: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; the parent prompt resolved the U9 delivery slice and required the exact five code/test/e2e paths to remain under 400 changed lines. No branch, commit, push, PR, review lifecycle, receipt, delivery gate, or size exception was used.
- Path correction completed first: U9 task/progress references now use the repository's lowercase `tests/unit/partidasPendientesBlockedSurface.test.tsx` and `tests/unit/comprasScreen.test.tsx` conventions. No API, route, sidebar, purchase behavior, or index change was made.
- RED: `tests/unit/partidasPendientesBlockedSurface.test.tsx` was written before the component and failed with the real missing-module resolution error. After the component was added, the screen integration assertion was added and failed because `ComprasScreen` did not yet mount the surface. No artificial RED was used.
- GREEN: added the prop-free, presentational `PartidasPendientesBlockedSurface` with `role="status"`, `aria-live="polite"`, the exact heading `Partidas pendientes entre compras`, honest backend-gap copy, and only semantic surface-secondary/dashed-border classes. Mounted it as an always-visible secondary section outside the supplier-stage conditional in `ComprasScreen`; no network/API call, results list, table, count, pagination, or fake interactive surface was added.
- TRIANGULATE: unit coverage proves copy, live status, semantic classes, absence of buttons/links/table/list/textbox, and no `fetch` call. Screen coverage proves visibility in initial supplier selection, confirmed supplier history, and purchase detail, while asserting purchase APIs are not called before their existing stages. The lower-case Playwright scenario uses `/compras` directly with no route interception, mocks, or invented fixtures and asserts the informative surface is not a table/list/result.
- Persisted task state: the U9 RED, GREEN, and TRIANGULATE implementation rows are visibly `- [x]` in `tasks.md`; the U9 final-gates REFACTOR row remains unchecked because `pnpm lint`, `pnpm format:check`, and `pnpm build` were not run in this apply. Parent-owned rows remain unchanged.

### U9 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Blocked pending surface and screen integration | `tests/unit/partidasPendientesBlockedSurface.test.tsx`, `tests/unit/comprasScreen.test.tsx` | RTL component/screen | ✅ Staged U8C screen/detail/action regression | ✅ Missing component module, then missing screen mount | ✅ Surface mounted outside all supplier-stage branches with no new API contract | ✅ Focused Vitest, configured focused `pnpm test`, router check, typecheck, Prettier, diff, and exact Playwright scenario passed | ⏳ Final quality-gate row intentionally remains unchecked |

### U9 verification commands and actual results

- `pnpm exec vitest run tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx --reporter=dot` — **2 files, 9 tests passed, 0 failed**.
- `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx` — **108 files, 912 tests passed, 0 failed**; existing React warnings were emitted but no test failed.
- `pnpm exec playwright test tests/e2e/compras.spec.ts` — **1 passed, 0 failed** against the existing harness; no backend interception, fixture, or mock was added.
- `pnpm router:check` — **passed**.
- `pnpm typecheck` — **passed**.
- `pnpm exec prettier --check src/features/compras/PartidasPendientesBlockedSurface.tsx tests/unit/partidasPendientesBlockedSurface.test.tsx src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx tests/e2e/compras.spec.ts` — **passed**.
- `git diff --check` — **passed**.
- Exact five code/test/e2e paths are under the 400-line boundary: `src/features/compras/PartidasPendientesBlockedSurface.tsx`, `src/features/compras/ComprasScreen.tsx`, `tests/unit/partidasPendientesBlockedSurface.test.tsx`, `tests/unit/comprasScreen.test.tsx`, and `tests/e2e/compras.spec.ts`; no index mutation occurred.
- Runtime harness: exact Playwright command ran successfully; N/A was not needed.

### U9 changed paths and rollback boundary

- Changed U9 paths: `src/features/compras/PartidasPendientesBlockedSurface.tsx`, `src/features/compras/ComprasScreen.tsx`, `tests/unit/partidasPendientesBlockedSurface.test.tsx`, `tests/unit/comprasScreen.test.tsx`, and `tests/e2e/compras.spec.ts`, plus the persisted tasks/progress artifacts.
- Rollback boundary: remove the blocked surface component, its standalone and screen assertions, the one `ComprasScreen` import/mount, and the narrow Playwright route scenario; retain U1A–U8 purchase behavior, APIs, route, and sidebar wiring.
- Deviations: the U9 final-gates row is intentionally still unchecked because the full lint/format/build gate set was not run; no claim of final delivery readiness is made.

### Remaining exact unchecked tasks

- [ ] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->
- [ ] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [ ] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

### Current next recommendation

`parent-lifecycle` — U9 implementation work is complete for the requested evidence, while the U9 final-gates implementation row and parent-owned review/delivery actions remain deferred. Native status remains `ready` with `nextRecommended: apply` because the final implementation row is still pending; this phase does not perform parent lifecycle, bounded review, receipt, or delivery actions.

## Final-gates candidate lint correction — six exact paths

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root. `actionContext.mode` was `repo-local`; no unsafe-root warning or native blocker was present.
- Scope was limited to the six exact paths reported by the independent final-gates verifier. The 14 out-of-scope Prettier failures were not inspected or edited, and no full formatter command was run.

### Scoped ESLint exact before/after

Initial scoped ESLint reported **10 findings** across these six paths:

- `src/features/compras/compras.api.ts`: errors at `9:3` (`Purchase` unused), `12:3` (`PurchaseLine` unused), `14:3` (`PurchasePage` unused), `15:3` (`SupplierProduct` unused), and `16:3` (`SupplierProductPage` unused).
- `src/features/compras/useSupplierProductsRestWindow.ts`: warning at `57:41`, `react-hooks/exhaustive-deps`, unnecessary dependency `key`.
- `src/features/compras/useSupplierPurchasesRestWindow.ts`: warning at `57:41`, `react-hooks/exhaustive-deps`, unnecessary dependency `key`.
- `tests/unit/comprasApiReads.test.ts`: error at `80:11`, `results` assigned but never used.
- `tests/unit/importarCompraSurface.test.tsx`: error at `72:28`, `message` defined but never used.
- `tests/unit/vincularPartidaSurface.test.tsx`: error at `144:11`, `user` assigned but never used.

Applied behavior-preserving corrections:

- Removed only the five unused type imports from `compras.api.ts`; schemas and return parsing remain unchanged.
- Changed both RestWindow lifecycle tokens to `useMemo(() => Symbol(key.join(':')), [key])`, making `key` a real stable dependency while preserving token changes exactly with the query key; no status, paging, placeholder, retry, refetch, or unmount semantics were changed.
- Retained the seven API calls and assertions in `comprasApiReads.test.ts` while dropping only the unused `results` binding.
- Removed only the unused expected-message tuple values and callback parameter from the import surface test; the `alreadyExisted` cases, awaited callback, StrictMode, close, and repeat-submit assertions remain.
- Removed only the unused `user` binding after `openSurface()` in the resource-window error test; the open/status/retry assertions remain.

Final scoped ESLint command:
`pnpm exec eslint src/features/compras/compras.api.ts src/features/compras/useSupplierProductsRestWindow.ts src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/comprasApiReads.test.ts tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx` — **No issues found** (0 errors, 0 warnings).

### Correction verification and delta

- Focused related tests: `pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx --reporter=dot` — **7 files, 57 tests passed, 0 failed**.
- Typecheck: `pnpm typecheck` — **passed**; route generation produced no additional working-tree change.
- Scoped Prettier: `pnpm exec prettier --check src/features/compras/compras.api.ts src/features/compras/useSupplierProductsRestWindow.ts src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/comprasApiReads.test.ts tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx` — **all files formatted correctly**.
- Scoped diff: `git diff --check -- <six exact paths>` — **passed**.
- Correction delta from the candidate baseline: **20 changed lines** total (**6 insertions, 14 deletions**) across exactly six paths, strictly below 400; no index, branch, commit, reset, push, PR, review, or delivery action was performed.
- Persisted task checkboxes were intentionally unchanged: the U9 final-gates row still requires the broader command set and remains unchecked; parent-owned lifecycle rows remain deferred.

## U9 final-gates evidence — documentation-only closure record

- This update records already-observed final-gate evidence only. No source or test files were changed, and no new quality command was run during this documentation update.
- The implementation-owned U9 final-gates row in `tasks.md` is now visibly `- [x]` because every required command was executed and recorded; this does **not** mean every gate passed.
- `pnpm test` — **exit 1**; **911 passed / 1 failed** at `tests/unit/useCatalogAttributeCreation.test.tsx:222`. Test, hook, and API paths were unchanged. The isolated exact rerun passed **15/15**, classifying the failure as flaky without erasing the original aggregate failure.
- `pnpm typecheck` — **exit 0**.
- `pnpm lint` — **exit 0**, after the previously recorded **20-line verified candidate correction**.
- `pnpm format:check` — **exit 1** on the exact **14 out-of-scope pre-existing files**; those files were not corrected.
- `pnpm build` — **exit 0**.
- `pnpm router:check` — **exit 0**.
- `pnpm exec playwright test tests/e2e/compras.spec.ts` — **1/1 passed**.
- Both recorded diff checks — **exit 0**.
- Build warnings and the two previously captured nonfatal React warnings are recorded as nonblocking; they did not change the command results above.
- Staged candidate inventory: **44 files, 5,557 insertions, 22 deletions**. OpenSpec files are untracked/unstaged. `routeTree` has no unstaged delta. Workspace-integrity hashes remained stable.
- Aggregate gates are **not fully green** because the honest out-of-scope test failure and format-check failure remain recorded. This is not a verify-success claim, delivery approval, native review, receipt, or lifecycle completion.
- Persisted task re-read requirement: the U9 final-gates implementation row is checked; parent-owned bounded-review and final-delivery rows remain unchecked and byte-preserved.

### Final-gates boundary and next action

- No git add, commit, reset, branch, push, or PR action was performed.
- No bounded-review, refutation, correction, validation, receipt, verify approval, delivery gate, or native review action was performed by `sdd-apply`.
- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, repository-local action context, allowed edit root equal to the workspace, and no native blocked reasons. The task checkbox update leaves only the two parent-owned lifecycle rows unchecked.
- Next recommended action: `parent-lifecycle`; the parent must decide and execute any review/delivery lifecycle actions. The aggregate gate evidence remains mixed, not fully green.

## Parent lifecycle evidence — bounded verification and final gates complete

- The parent orchestrator ran an independent `gentle-ai-verify` pass for every staged implementation slice and every remediation slice before advancing or staging it. Each slice had an explicit rollback boundary, exact scoped commands, an observed authored delta strictly below 400 lines, and index-integrity checks. Blocking findings were corrected and independently re-verified before closure.
- The parent executed the final gate set only after U9: full test, typecheck, lint, format check, build, router check, Compras Playwright, and both diff checks. Results remain recorded exactly above; this checkbox records execution and preservation, not an all-green claim.
- The full-test failure was isolated to an unchanged catalog-hierarchy test and passed 15/15 on an immediate scoped rerun, supporting flaky classification without rewriting the original exit 1. The format failure remains confined to 14 unchanged out-of-scope files.
- Both parent-owned rows are now complete. No native review, receipt, delivery authorization, commit, branch, push, or PR is implied.
- Next action: fresh structured status, then SDD verification. Delivery remains blocked from an all-green claim by the recorded mixed aggregate gates.

## R1A remediation apply progress — F4 authoritative rereads

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers.
- Workload/action context: the parent prompt explicitly authorized only remediation slice R1A, with `feature-branch-chain` selected under `ask-on-risk`; the aggregate forecast remains High, while this six-path slice measured below the 400-line budget. R1B+ and all non-R1A paths were not touched.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD guidance used via `fallback-path` because the project-local support file was absent. No UI styling or shared-component changes were introduced.

### R1A completed implementation tasks

- Fresh RED was added to both supplier-window tests for a previously successful `refetchActive()` followed by query error: each now rejects on reread failure and reaches `ready` with new rows after retry. Existing stale-supplier, unmount, pagination, signal, replacement, and no-supplier coverage remains intact.
- Fresh detail RED proves a post-mutation reread failure leaves the link confirmation dialog open, exposes the retryable error, keeps the original `CONFLICTO` state visible, and does not close or publish refreshed state. It intentionally does not implement confirmed-result reuse or mutation-free retry; those remain R1C/R1D/R1E scope.
- Both RestWindow `refetchActive` callbacks now call TanStack Query `refetch({ throwOnError: true })`.
- `CompraDetalleStage` now has one explicit `refreshDetail` callback using `refetch({ throwOnError: true })`, passes it to link/unlink/NO_APLICA callbacks, and renders retained detail data while a post-reread query error is surfaced through the action surface. No optimistic state was added.
- The four implementation-owned R1A task rows were marked `- [x]` in `tasks.md`; the two parent-owned R1A rows remain unchecked and byte-preserved.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1A supplier-window authoritative rereads | `tests/unit/useSupplierPurchasesRestWindow.test.tsx`, `tests/unit/useSupplierProductsRestWindow.test.tsx` | Integration-style hook tests | ✅ Prior focused baseline: 36/36 passed | ✅ Fresh run: 3 expected failures, including both resolved-refetch promises and the detail contract | ✅ Final focused run: 39/39 passed; existing success, retry, stale, unmount, and pagination paths preserved | ✅ Six-path delta measured at 92 changed lines, strictly below 400 |
| R1A detail post-mutation reread contract | `tests/unit/compraDetalleStage.test.tsx` | Component/integration test | ✅ Prior focused baseline: 36/36 passed | ✅ Dialog absence/error-state failure observed before production fix | ✅ Final focused run confirms reread rejection keeps dialog open and retryable without optimistic publish/close | ✅ Explicit `refreshDetail` callback is named and shared by all three action callbacks |

### R1A verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/compraDetalleStage.test.tsx` — **36 passed, 3 failed** on the new assertions as required.
- GREEN/REFACTOR focused command: the same three-test command — **39 passed, 0 failed**.
- Focused architecture regression: `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/compraDetalleStage.test.tsx tests/architecture/queryZodBoundaries.test.ts` — **44 passed, 0 failed**.
- `pnpm typecheck` — **passed**.
- `pnpm exec prettier --check src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx src/features/compras/useSupplierProductsRestWindow.ts tests/unit/useSupplierProductsRestWindow.test.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- `git diff --check` — **passed**.
- R1A changed exactly six permitted paths: the two RestWindow sources/tests and `CompraDetalleStage` source/test. Unstaged diff against the current staged index is **86 insertions and 6 deletions, 92 changed lines**, below 400. No stage, commit, branch, reset, push, PR, archive, reverify, or verify-report edit was performed.

### R1A remaining exact task boundary

- [ ] Ejecutar bounded verify de R1A, comprobar sus seis paths y stagear únicamente el slice después de confirmar el límite y la evidencia RED/GREEN. <!-- sdd-owner: parent -->
- [ ] Preparar R1A para reverify de F4 sin editar todavía `verify-report.md` ni convertir el resultado aislado en PASS global. <!-- sdd-owner: parent -->

All R1B+ implementation and parent rows remain unchecked in `tasks.md`; no later remediation slice was selected or edited. Next recommended action is `parent-lifecycle`, not R1B implementation, because bounded verify/staging and reverify preparation are parent-owned actions.

### R1A parent bounded verification and staging

- Independent verifier found no findings in the exact six-path R1A delta.
- Focused verification: **44/44 tests passed** across both RestWindows, detail, and the REST architecture guard; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **86 insertions + 6 deletions = 92 lines**, strictly below 400.
- Index identity remained `640bcb2ad57048921e494789df0955715e4e49cf` before/after read-only verification.
- Parent then staged exactly the six R1A paths. The aggregate candidate remains **44 staged files**, now **5,637 insertions and 22 deletions**; `git diff --cached --check` passed. OpenSpec remains untracked/unstaged.
- The user had explicitly selected remediation of F1–F5 while preserving `feature-branch-chain` and `ask-on-risk`; that satisfies the remediation-chain parent gate without inferring `size:exception`.
- R1A is ready for eventual reverify, but no global PASS is claimed and the failed `verify-report.md` remains unchanged.

## R1B remediation apply progress — confirmed import with refresh-only retry

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no unsafe-root or blocked-reason warning.
- Scope consumed: remediation R1B only. R1C and later remediation slices, U7/U8 follow-up behavior outside R1B, `verify-report.md`, shared UI/CSS, endpoint/DTO contracts, staging, commits, branches, pushes, PRs, archive, and reverify were not touched.
- Workload decision consumed: `feature-branch-chain` under `ask-on-risk`; the four-path source/test delta is **292 changed lines** against the staged R1A baseline (34/9 `ComprasScreen`, 54/9 `ImportarCompraSurface`, 135/0 screen test, 51/0 surface test), strictly below 400. No size exception was used.
- Skill resolution: `paths-injected`; GARFEX Design System and strict-TDD guidance were loaded before implementation, with Tailwind guidance consulted only as generic reference. Existing `Button`, `Dialog`, `PageHeader`, and `WorkCard` contracts were reused; no shared UI, CSS, token, arbitrary utility, or global keyboard behavior changed.

### R1B completed implementation tasks and persisted checkbox updates

- Fresh RED tests were written before production edits. The pre-production focused run failed on the new refresh-only expectations: confirmed imports were reported as generic mutation failures and no refresh retry existed.
- `ImportarCompraSurface` now retains the confirmed `PurchaseImportResponse` only while the dialog workflow remains active, distinguishes mutation failure from post-confirmation reread failure, and exposes a busy-guarded refresh-only retry that passes the exact confirmed object to `onImported` without invoking `importPurchase` again.
- Refresh failure copy distinguishes created and already-existing imports, states that the import is confirmed, keeps the dialog open, and offers `Reintentar actualización`. Successful retry closes the workflow.
- `ComprasScreen` now publishes created/already-existing success only after the current supplier reread resolves. Failed rereads reject through the surface without publishing success; a non-current or stale supplier result uses honest no-refresh copy. A mounted/context-version guard prevents stale callbacks from publishing current-history success.
- The four implementation-owned R1B rows (RED, GREEN, TRIANGULATE, REFACTOR) were marked `- [x]` in `tasks.md`; R1B parent-owned rows remain unchecked and unchanged. R1C+ task rows remain unchecked and were not edited.

### R1B TDD Cycle Evidence

| Task | Test files | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1B confirmed import and refresh-only retry | `tests/unit/importarCompraSurface.test.tsx`, `tests/unit/comprasScreen.test.tsx` | Component/integration RTL | ✅ Existing focused baseline: 16/16 passed | ✅ New refresh-failure/retry assertions failed before production edits | ✅ Final combined focused run: 60/60 passed, covering 201/200 already-existing variants, mutation-vs-reread errors, retry without second upload, busy/double retry, stale supplier change, non-current supplier, and unmount safety | ✅ Behavior-preserving cleanup; four-path delta is 292 lines |

### R1B verification commands and actual results

- `pnpm exec vitest run tests/unit/importarCompraSurface.test.tsx tests/unit/comprasScreen.test.tsx tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/compraDetalleStage.test.tsx --reporter=dot` — **5 files, 60 tests passed**.
- `pnpm typecheck` — **passed**; route generation completed without a route-tree worktree delta.
- `pnpm exec prettier --check src/features/compras/ImportarCompraSurface.tsx src/features/compras/ComprasScreen.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/comprasScreen.test.tsx` — **passed**.
- `git diff --check` — **passed**.
- Cached index remained unmodified by this apply: no stage/reset/commit operation was run; only the four permitted source/test paths have an unstaged worktree diff, while OpenSpec bookkeeping remains untracked/unstaged.
- Runtime harness: `N/A` — R1B is covered by the authorized Vitest/RTL component and screen tests; no browser journey or delivery gate was started.

### R1B remaining boundary

- [ ] Crear RED fresca para link confirmado seguido de reread fallido, retry sin segunda mutación, busy/dismiss y mensaje honesto; ejecutar tests antes del source. <!-- sdd-owner: implementation -->
- [ ] Implementar link confirmado→reread→retry en los cuatro paths, manteniendo selección explícita, actor y ausencia de optimismo. <!-- sdd-owner: implementation -->
- [ ] Triangular respuesta confirmada, error de reread, retry exitoso, error de mutación, doble submit, Escape y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo esos paths y verificar que el delta R1C es estrictamente menor de 400 líneas desde el baseline R1B. <!-- sdd-owner: implementation -->

R1D, R1E, R2A, R2B, R3A, R3B, and R4 remain exactly as unchecked in `tasks.md`; their paths were not selected. Parent lifecycle rows remain deferred. The next recommended action is `parent-lifecycle` for the parent-owned bounded verification/staging decision, not R1C implementation.

### R1B parent bounded verification and staging

- Independent verifier found no findings in the exact four-path R1B delta.
- Focused verification: **33/33 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **274 insertions + 18 deletions = 292 lines**, strictly below 400.
- Index identity remained `49a293a4176e44c5063c4201987c164618c864ca` before/after read-only verification.
- Parent then staged exactly the four R1B paths. Aggregate candidate remains **44 staged files**, now **5,893 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Confirmed results now survive refresh failure; retry repeats only the authoritative callback, not the upload. Current-history success is published only after the current supplier reread succeeds; stale/non-current callbacks cannot publish it.
- R1B is ready for eventual F4 reverify. Failed verify evidence remains untouched and no global PASS is claimed.

### R1C apply — link confirmation with reread-only retry

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root equal to the workspace, and no native blockers. `actionContext.mode` was `repo-local`; no unsafe-root warning was present.
- Workload gate consumed: aggregate `400-line budget risk: High`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, and the parent prompt resolved this apply to R1C only. No size exception, branch, commit, push, PR, staging, review lifecycle, receipt, archive, or reverify action was performed.
- Skill resolution: `paths-injected`; loaded `.agents/skills/garfex-design-system/SKILL.md`, its checklist/vocabulary/anti-pattern references, `docs/design-system.md`, and strict-TDD guidance. Existing `Button`, `Dialog`, `StagedSearchSelector`, and token-backed styles were reused; no shared UI, token, CSS, route, API, DTO, or relation-display change was introduced. Light-only support remains authoritative.
- R1C implementation-owned RED, GREEN, TRIANGULATE, and REFACTOR rows were marked `- [x]` in `tasks.md` immediately after their evidence was completed. R1C parent-owned rows remain unchecked and unchanged.
- The link workflow now retains the exact confirmed `SupplierProduct` only after `linkSupplierProduct` resolves. A callback/reread rejection keeps the dialog open with `Vínculo confirmado, pero el detalle no se actualizó. Reintenta la lectura.` and retries only `onLinked` with that same object; mutation errors retain the existing actor/backend/generic copy and retry the mutation because no confirmation was retained. Successful close/new workflow clears the retained result.
- Detail integration exercises its throwing reread contract: previous detail data and actions remain visible after the reread failure, and successful retry closes only after the authoritative callback succeeds. No optimistic badge/resource mutation was added.

### R1C TDD Cycle Evidence

| Task | Test files | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1C link confirmation and reread-only retry | `tests/unit/vincularPartidaSurface.test.tsx`, `tests/unit/compraDetalleStage.test.tsx` | Component/integration RTL | ✅ Existing focused baseline: 27 tests passed before source edits | ✅ Fresh callback-rejection expectations failed before production edits; 2 new failures observed | ✅ Final focused surface/detail run: 29 tests passed; mutation confirmation, callback rejection, exact retained object, retry-only callback, mutation errors, busy/dismiss, selection, StrictMode/unmount, and detail integration are covered | ✅ Added successful-close/new-workflow regression, formatted only the four authorized paths, and kept the exact delta at 131 lines |

### R1C verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **27 passed, 2 failed** on the fresh reread-only copy/retry expectations before source edits.
- GREEN/TRIANGULATE: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **29 passed, 0 failed**.
- Exact focused regression: `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx tests/unit/comprasApiMutations.test.ts` — **44 passed, 0 failed**.
- `pnpm typecheck` — **passed**; router generation completed without a route-tree worktree delta.
- `pnpm exec prettier --check src/features/compras/VincularPartidaSurface.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed** after scoped formatting; the initial check failed before formatting and introduced no unrelated edits.
- `git diff --check` — **passed**.
- Exact four-path worktree delta against the staged R1B baseline: `118` insertions + `13` deletions = **131 changed lines**, strictly below 400. `CompraDetalleStage.tsx` remained byte-identical to the staged baseline; its permitted test path carries the integration assertions.
- Cached index identity remained `54a444fbe7467c60cd83b2201d5ee52697c0f535` before and after verification. No stage/reset/commit operation was run; R1C source/tests remain unstaged and only the permitted R1C paths have worktree deltas.
- Runtime harness: `N/A` — R1C is covered by the authorized Vitest/RTL surface/detail tests and the resource-window/API regressions; no browser journey or delivery gate was started.

### R1C remaining boundary

The following R1C parent-owned lifecycle rows remain unchecked and deferred exactly as persisted:

- [ ] Ejecutar bounded verify de R1C y stagear sólo sus paths después de confirmar que no se repite link ante un fallo de lectura. <!-- sdd-owner: parent -->
- [ ] Preparar R1C para reverify de F4 sin declarar resuelta F1 hasta completar R2A. <!-- sdd-owner: parent -->

R1D+ were not selected. Their exact unchecked implementation rows remain:

- [ ] Crear RED fresca para unlink confirmado con reread fallido, retry exclusivo de lectura, copy honesto y no repetición de POST; ejecutar tests antes de producción. <!-- sdd-owner: implementation -->
- [ ] Implementar unlink confirmado→reread→retry en los cuatro paths, conservando backend como autoridad para `VINCULADO`→`PENDIENTE`. <!-- sdd-owner: implementation -->
- [ ] Triangular confirmación, fallo/retry de reread, cancelación, busy, error de mutación, doble submit y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo esos paths y dejar R1D por debajo de 400 líneas contra el baseline R1C. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca para NO_APLICA confirmado con reread fallido, retry sin segundo status POST, copy honesto y control busy; ejecutar antes de producción. <!-- sdd-owner: implementation -->
- [ ] Implementar NO_APLICA confirmado→reread→retry en los cuatro paths, preservando la matriz nullable y la autoridad backend. <!-- sdd-owner: implementation -->
- [ ] Triangular producto presente/ausente, confirmación, error de mutation, error/retry de reread, doble submit, cancelación y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo esos paths y dejar R1E estrictamente menor de 400 líneas contra el baseline R1D. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca para GET de cada SupplierProduct único, cadena visible hasta `resourceId`, ausencia de consulta para null/duplicado y reread posterior; ejecutar antes de producción. <!-- sdd-owner: implementation -->
- [ ] Implementar las lecturas únicas y la zona de relación diferenciada, mostrando sólo datos publicados del producto y `resourceId`, sin endpoint ni nombre de recurso inventado. <!-- sdd-owner: implementation -->
- [ ] Triangular múltiples partidas con el mismo producto, productos sin `resourceId`, errores iniciales/de reread, estados de carga y callbacks de link/unlink/status. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y mantener R2A estrictamente menor de 400 líneas contra el baseline R1E. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca para la explicación G3 junto a partidas nullable y para la ausencia de selector/recurso/VINCULADO sustitutivo; ejecutar antes de editar producción. <!-- sdd-owner: implementation -->
- [ ] Implementar copy honesto que explique la ausencia de operación Partida→Producto de Proveedor, sin crear controles, endpoints ni asociación local. <!-- sdd-owner: implementation -->
- [ ] Triangular nullable PENDIENTE/CONFLICTO/NO_APLICA, acción NO_APLICA cuando el contrato la admite, región accesible y ausencia de selector de recurso. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y dejar R2B estrictamente menor de 400 líneas contra el baseline R2A. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca del stage para ventana por proveedor, `StagedSearchSelector`, paginación por reemplazo, selección explícita y callback sin asociación; ejecutar antes del componente. <!-- sdd-owner: implementation -->
- [ ] Implementar el stage con la ventana existente, identidad/producto visible, controles de paginación autoritativos y callback de inspección que no llama link/link-status ni crea productos. <!-- sdd-owner: implementation -->
- [ ] Triangular proveedor ausente, initial/navigation loading/error/retry, páginas, selección, SKU coincidente sin asociación, reemplazo y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y mantener R3A estrictamente menor de 400 líneas contra el baseline R2B. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca de montaje con proveedor confirmado, ausencia sin proveedor, reset/cambio de proveedor y no asociación; ejecutar antes de editar pantalla. <!-- sdd-owner: implementation -->
- [ ] Montar `InspeccionarProductoProveedorStage` únicamente con el supplier confirmado, sin barrido global, asociación automática ni cambio de contrato de G3. <!-- sdd-owner: implementation -->
- [ ] Triangular montaje, cambio de proveedor, ausencia de red sin contexto, paginación delegada y selección que no llama mutaciones. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y dejar R3B estrictamente menor de 400 líneas contra el baseline R3A. <!-- sdd-owner: implementation -->
- [ ] Revisar la evidencia existente sin fabricar RED retroactiva; clasificar cada RED fresca de R1–R3 como comportamiento de remediación y dejar F5 abierto hasta reconciliación. <!-- sdd-owner: implementation -->
- [ ] Documentar en `apply-progress.md` los resultados reales de cada slice, sus límites y la decisión explícita sobre aceptación de desviación F5, sin editar el verify-report fallido. <!-- sdd-owner: implementation -->
- [ ] Triangular la trazabilidad de RED→GREEN→verificación por slice, confirmar que no se borró evidencia histórica y preparar el paquete de reverify. <!-- sdd-owner: implementation -->
- [ ] Refactorizar únicamente el registro de progreso para que sea auditable y conciso; no añadir source/tests ni declarar PASS por bookkeeping. <!-- sdd-owner: implementation -->

R1D+ parent-owned bounded-verify/staging rows, R4 parent decision rows, and the final reverify gate remain unchecked and deferred. `next_recommended: parent-lifecycle`; no R1D+ implementation was started.

### R1C parent bounded verification and staging

- Independent verifier found no findings within the exact four-path allowed scope.
- Focused verification: **39/39 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Actual changed paths were `VincularPartidaSurface.tsx` and the two permitted tests; `CompraDetalleStage.tsx` remained unchanged. Verified delta: **118 insertions + 13 deletions = 131 lines**, strictly below 400.
- Index identity remained `54a444fbe7467c60cd83b2201d5ee52697c0f535` before/after read-only verification.
- Parent staged exactly the three changed R1C paths. Aggregate candidate remains **44 staged files**, now **5,998 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- A confirmed link result is retained across reread failure; retry invokes only `onLinked` with that exact result and never repeats the link mutation. Mutation failures before confirmation retain their existing retry behavior.
- R1C is ready for F4 reverify, but F1 remains unresolved until R2A and no global PASS is claimed.

### R1D apply — unlink confirmation with reread-only retry

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blocked reasons or unsafe-root warnings.
- Scope consumed from the parent prompt: R1D only. R1E+, endpoint/DTO/relation-display changes, staging, commits, branches, pushes, PRs, archive, verify/reverify, and delivery gates were not started.
- Workload decision consumed: aggregate review risk remains High, chained PRs remain recommended with `feature-branch-chain`, and this four-path slice was kept below the canonical 400-line budget. No `size:exception` was used.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support loaded from the global fallback path because the project-local support file was absent. The checklist, atomic vocabulary, anti-patterns, and `docs/design-system.md` were read before the UI edit. Existing `Button`, `Dialog`, focus restoration, and accessible feedback contracts were reused; no shared UI, CSS, token, endpoint, DTO, relation-display, or keyboard-boundary change was introduced. Light-only support remains authoritative.
- Fresh RED was added before source edits in `tests/unit/desvincularPartidaSurface.test.tsx` and `tests/unit/compraDetalleStage.test.tsx`. The focused run observed **24 passed, 2 failed**: both failed on the new confirmed-but-detail-not-refreshed copy before production changes.
- GREEN retains the exact confirmed `SupplierProduct` only after `unlinkSupplierProduct` resolves. A rejected `onUnlinked` callback keeps the dialog open with `Desvinculación confirmada, pero el detalle no se actualizó. Reintenta la lectura.`, and retry calls only `onUnlinked` with the retained object; the unlink POST is not repeated. Successful retry closes and clears retained state. Pre-confirmation actor/backend/generic mutation errors retain their existing messages and retry the mutation.
- Detail integration now has fresh coverage for a throwing authoritative reread: prior `VINCULADO` data and the unlink action remain visible, no optimistic `VINCULADO`→`PENDIENTE` transition appears, and a successful read-only retry closes the dialog and then shows backend-confirmed `PENDIENTE`.
- TRIANGULATE preserved cancel/open behavior, busy dismissal/duplicate-submit guards, mutation-error retry behavior, StrictMode/unmount late-completion safety, focus restoration, exact retained-object identity, and successful close/new-workflow reset through the existing and new tests.

### R1D TDD Cycle Evidence

| Task | Test files | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1D unlink confirmation and reread-only retry | `tests/unit/desvincularPartidaSurface.test.tsx`, `tests/unit/compraDetalleStage.test.tsx` | Component/integration RTL | ✅ Existing focused baseline: 24 tests passed | ✅ Fresh reread-rejection tests produced 2 failures before source edits | ✅ Final focused R1D run: 26 tests passed; extended regression with API/link tests: 48 tests passed | ✅ Confirmed callback-only retry, exact retained object, mutation-error paths, busy/dismiss/duplicate, cancel, unmount, focus, and prior-detail retention | ✅ Scoped Prettier/ESLint/diff checks passed; four-path delta is 125 lines |

### R1D verification commands and actual results

- Safety net: `pnpm exec vitest run tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **24 passed, 0 failed** before edits.
- RED: the same focused command after fresh tests and before source edits — **24 passed, 2 failed** with the old generic message and no retry-only action.
- GREEN/REFACTOR focused command: `pnpm exec vitest run tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **26 passed, 0 failed**.
- Exact R1D regression: `pnpm exec vitest run tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/comprasApiMutations.test.ts tests/unit/vincularPartidaSurface.test.tsx` — **48 passed, 0 failed**.
- `pnpm typecheck` — **passed**; route generation completed without a route-tree worktree delta.
- `pnpm exec eslint src/features/compras/DesvincularPartidaSurface.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed; no issues**.
- `pnpm exec prettier --check src/features/compras/DesvincularPartidaSurface.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed** after scoped formatting.
- `git diff --check -- src/features/compras/DesvincularPartidaSurface.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- Against the staged R1C baseline, the four allowed paths have **125 changed lines** (`122 insertions + 3 deletions`: `31 insertions + 3 deletions` in `DesvincularPartidaSurface.tsx`, `58 insertions` in the detail test, `33 insertions` in the unlink test; `CompraDetalleStage.tsx` stayed byte-identical), strictly below 400.
- Index identity was `6609a3dda3ca37baa57ccdd8d5e622d7cb6d928f` before and after the R1D worktree edits (`git write-tree`); no stage, reset, commit, branch, push, PR, archive, verify, or reverify command was run.

### R1D remaining boundary

The following parent-owned lifecycle rows remain unchecked and deferred exactly as persisted:

- [ ] Ejecutar bounded verify de R1D y stagear sólo sus paths tras comprobar ausencia de transición optimista y ausencia de POST duplicado. <!-- sdd-owner: parent -->
- [ ] Preparar R1D para reverify de F4 y conservar explícitamente cualquier limitación de cobertura residual. <!-- sdd-owner: parent -->

R1E and later implementation rows remain unchecked and were not selected. The next implementation slice must not begin in this apply:

- [ ] Crear RED fresca para NO_APLICA confirmado con reread fallido, retry sin segundo status POST, copy honesto y control busy; ejecutar antes de producción. <!-- sdd-owner: implementation -->
- [ ] Implementar NO_APLICA confirmado→reread→retry en los cuatro paths, preservando la matriz nullable y la autoridad backend. <!-- sdd-owner: implementation -->
- [ ] Triangular producto presente/ausente, confirmación, error de mutation, error/retry de reread, doble submit, cancelación y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo esos paths y dejar R1E estrictamente menor de 400 líneas contra el baseline R1D. <!-- sdd-owner: implementation -->

### R1D parent bounded verification and staging

- Independent verifier found no blocking findings in the exact four-path allowed scope.
- Focused verification: **36/36 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Actual changed paths were `DesvincularPartidaSurface.tsx` and the two permitted tests; `CompraDetalleStage.tsx` remained unchanged. Verified delta: **122 insertions + 3 deletions = 125 lines**, strictly below 400.
- Index identity remained `6609a3dda3ca37baa57ccdd8d5e622d7cb6d928f` before/after read-only verification.
- Parent staged exactly the three changed R1D paths. Aggregate candidate remains **44 staged files**, now **6,117 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Confirmed unlink retry invokes only `onUnlinked` with the retained result and never repeats the POST. Prior detail/actions remain visible and only backend reread can publish `PENDIENTE`.
- R1D is ready for F4 reverify; no global PASS is claimed.

## R1E remediation apply progress — NO_APLICA reread-only retry

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers or unsafe-root warnings.
- Scope consumed from the user prompt: R1E only against the staged R1D baseline. R2+ was explicitly prohibited. No endpoint, DTO, relation-display, R2, staging, commit, branch, reset, push, PR, archive, verify, reverify, receipt, or delivery-gate action was performed.
- Workload decision consumed: aggregate `400-line budget risk: High`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`; this four-path R1E slice stayed strictly below 400 lines without a size exception.
- Skill resolution: GARFEX Design System was loaded from the project skill paths, including its checklist, vocabulary, anti-patterns, and `docs/design-system.md`; strict-TDD guidance used the global fallback path because the project-local support file was absent. Existing `Button`, `Dialog`, focus restoration, accessible feedback, and Light-only token contracts were reused; no UI shared component, CSS, token, keyboard, endpoint, DTO, or relation-display change was introduced.

### R1E completed implementation tasks and persisted checkbox updates

- Fresh RED was written in `tests/unit/marcarNoAplicaAction.test.tsx` and `tests/unit/compraDetalleStage.test.tsx` before the production edit. The pre-production focused run had **29 passed and 3 failed** on the new confirmed-but-reread-not-refreshed copy/retry assertions.
- `MarcarNoAplicaAction` now retains the exact confirmed `PurchaseLine` only after `setPurchaseLineLinkStatus({ id, status: 'NO_APLICA' })` resolves. A rejected detail callback keeps the dialog open with accessible copy: `NO_APLICA confirmado, pero el detalle no se actualizó. Reintenta la lectura.`
- Reread retry invokes only `onMarked` with that exact retained `PurchaseLine`; it never repeats the status mutation. Successful retry closes and clears retained state, while opening a new workflow clears any previous confirmation. Mutation errors before confirmation preserve actor/backend/generic messages and retry the mutation.
- Detail integration covers a throwing authoritative reread: the prior `Pendiente` status and `Marcar como no aplicable` action remain visible, no optimistic `NO_APLICA` is shown, and a successful retry closes after the reread succeeds.
- Product-present and product-null workflows, confirmation/cancel, busy dismissal and duplicate-submit guards, actor/backend/generic mutation errors, StrictMode/unmount completion safety, and focus restoration remain covered by the existing and fresh tests. The exact `{ status: 'NO_APLICA' }` payload and nullable action matrix are unchanged.
- The four implementation-owned R1E rows (RED, GREEN, TRIANGULATE, REFACTOR) were marked `- [x]` in `tasks.md`; R1E parent-owned rows remain unchecked and unchanged.

### R1E TDD Cycle Evidence

| Task | Test files | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1E NO_APLICA confirmation and reread-only retry | `tests/unit/marcarNoAplicaAction.test.tsx`, `tests/unit/compraDetalleStage.test.tsx` | Component/integration RTL | ✅ Existing focused baseline: 29 tests passed | ✅ Fresh run: 3 expected failures before source edits | ✅ Final focused run: 32 tests passed; present/null products, exact retained line, callback-only retry, mutation errors, busy/cancel, StrictMode/unmount, focus, and detail prior-state retention are covered | ✅ Scoped formatting cleanup preserved behavior; exact four-path delta is 138 changed lines |

### R1E verification commands and actual results

- Safety net: `pnpm exec vitest run tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx --reporter=dot` — **29 passed, 0 failed** before edits.
- RED: the same focused command after fresh tests and before source edits — **29 passed, 3 failed** with the old generic error and no reread-only retry.
- GREEN/REFACTOR focused command: `pnpm exec vitest run tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx --reporter=dot` — **32 passed, 0 failed**.
- Exact R1E regression: `pnpm exec vitest run tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/comprasApiMutations.test.ts tests/unit/desvincularPartidaSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx --reporter=dot` — **62 passed, 0 failed**.
- `pnpm typecheck` — **passed**; route generation produced no additional worktree changes.
- `pnpm exec eslint src/features/compras/MarcarNoAplicaAction.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed; no issues**.
- `pnpm exec prettier --check src/features/compras/MarcarNoAplicaAction.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed** after the scoped formatting pass.
- `git diff --check -- src/features/compras/MarcarNoAplicaAction.tsx src/features/compras/CompraDetalleStage.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.

### R1E delta, persisted state, and lifecycle boundary

- Against the staged R1D index, the four allowed paths changed by **138 lines**: `MarcarNoAplicaAction.tsx` **32 additions + 7 deletions**, `compraDetalleStage.test.tsx` **49 additions**, `marcarNoAplicaAction.test.tsx` **50 additions**, and `CompraDetalleStage.tsx` remained byte-identical. The total is strictly `<400`.
- Cached index hash was `669bde1474efa1c290ddd9e234fd428ead02c62bd842123e7cf38bc5a0a09b7b` before and after the worktree edits. No stage or other index-writing action was run; source/tests remain unstaged relative to the R1D baseline and OpenSpec remains untracked/unstaged.
- The persisted R1E implementation rows were re-read and visibly show `- [x]`. R1E parent-owned rows remain deferred exactly as persisted:
  - [ ] Ejecutar bounded verify de R1E y stagear sólo sus paths tras confirmar que el retry jamás repite la mutación. <!-- sdd-owner: parent -->
  - [ ] Preparar R1E para reverify de F4 y conservar copy que distinga confirmación de mutación y confirmación de lectura. <!-- sdd-owner: parent -->
- R2A, R2B, R3A, R3B, R4, and the final reverify rows remain unchecked in `tasks.md` and were not selected or edited. No R2+ implementation or evidence was started.
- Next recommended action: `parent-lifecycle`; bounded verify/staging and any later remediation remain parent-owned, and no global PASS or reverify claim is made.

### R1E parent bounded verification and staging

- Independent verifier found no blocking findings in the exact four-path allowed scope.
- Focused verification: **42/42 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Actual changed paths were `MarcarNoAplicaAction.tsx` and the two permitted tests; `CompraDetalleStage.tsx` remained unchanged. Verified delta: **131 insertions + 7 deletions = 138 lines**, strictly below 400.
- Index identity remained `c8d8628ecb1f517e027c4ce4ec4ccbcce65f2ccd` before/after read-only verification.
- Parent staged exactly the three changed R1E paths. Aggregate candidate remains **44 staged files**, now **6,241 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Confirmed `NO_APLICA` retry invokes only `onMarked` with the retained line and never repeats the status POST. Prior detail/actions remain visible until authoritative reread succeeds.
- R1A–R1E now cover F4 for eventual reverify; no global PASS is claimed.

## R2A remediation apply progress — SupplierProduct relation inspection (F1)

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and the workspace as the sole allowed edit root. No native blocked reasons or unsafe action-context warnings were present.
- Scope consumed from the parent prompt: **R2A/F1 only** against the staged R1E baseline. R2B, R3, R4, verify/reverify, bounded-review, staging, commit, branch, reset, push, PR, archive, and delivery gates were not started.
- Workload gate consumed: aggregate `400-line budget risk: High`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`; the parent resolved this apply to R2A only. The two-path R2A delta is below 400 lines with no size exception.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support used the global `fallback-path` because no project-local support file exists. The checklist, atomic vocabulary, anti-patterns, `docs/design-system.md`, and strict-TDD guidance were read before the UI edit. Existing Button/Dialog/feedback/action patterns remain reused; no shared UI, CSS, token, API, DTO, route, keyboard, or master-resource lookup change was introduced. Light-only support remains authoritative.

### R2A completed implementation tasks and persisted checkbox updates

- Fresh RED was written in `tests/unit/compraDetalleStage.test.tsx` before the production edit. The safety-net detail baseline was **19 passed**; the RED run was **19 passed, 3 failed** on the new SupplierProduct read/dedupe/relation/retry expectations.
- `CompraDetalleStage` now injects `getSupplierProduct` when provided and falls back to the REST adapter default. It awaits purchase and lines first, deduplicates non-null `supplierProductId` values, calls each unique product exactly once with the same Query `AbortSignal`, and stores the returned products by ID.
- Each identified product now has a distinct accessible relation region showing published description, SKU, ID, exact `resourceId`, or `No hay Recurso Maestro vinculado` when the authoritative `resourceId` is null. No resource name or get-by-resource endpoint is resolved; existing explicit resource selection remains deferred to its existing action.
- The same detail query rereads purchase, lines, and the current unique SupplierProduct set after link, unlink, and `NO_APLICA` callbacks. Query failures preserve prior data/actions through the existing re-read retry surfaces; product-set changes are recomputed on every read.
- The four implementation-owned R2A rows (RED, GREEN, TRIANGULATE, REFACTOR) are visibly `- [x]` in `tasks.md`. R2A parent-owned lifecycle rows remain unchecked and unchanged.

### R2A TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2A SupplierProduct reads, dedupe, relation display, and reread set changes | `tests/unit/compraDetalleStage.test.tsx` | Component/integration RTL | ✅ 19 passed | ✅ 19 passed, 3 failed before source edits | ✅ 22 passed; initial product failure participates in detail error/retry and callback rereads pass | ✅ 55 passed across detail/link/unlink/NO_APLICA regressions; scoped formatting, ESLint, typecheck, and diff checks passed |

### R2A verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx` — **19 passed, 3 failed** before the production edit.
- GREEN/REFACTOR focused: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx` — **22 passed, 0 failed**.
- Exact callback regression: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx` — **55 passed, 0 failed**.
- `pnpm typecheck` — **passed**; router generation produced no additional worktree route-tree delta.
- `pnpm exec eslint src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed; no issues**.
- `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed** after scoped formatting.
- `git diff --check -- src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- Against the staged R1E baseline, the exact two permitted paths changed by **230 lines**: `59 additions + 6 deletions` in `CompraDetalleStage.tsx` and `163 additions + 2 deletions` in `compraDetalleStage.test.tsx`; strictly below 400.
- The cached index was not written by this apply. Current `git write-tree` identity is `fb52be5ea1a01468d696393dc503ca67323db34a`; only the two permitted source/test paths have an unstaged worktree delta, while OpenSpec bookkeeping remains untracked/unstaged. No stage/reset/commit/branch/push/PR/archive/verify/reverify action was run.
- Runtime harness: `N/A` — R2A is covered by the authorized Vitest/RTL detail and mutation-surface regressions; no browser journey or delivery gate was started.

### R2A remaining boundary

The following R2A parent-owned lifecycle rows remain unchecked and deferred exactly as persisted:

- [ ] Ejecutar bounded verify de R2A y stagear únicamente sus dos paths después de comprobar deduplicación, cadena visible y ausencia de endpoint inventado. <!-- sdd-owner: parent -->
- [ ] Preparar R2A para reverify de F1 sin afirmar todavía que F2 o G3 estén cubiertos. <!-- sdd-owner: parent -->

R2B and R3 remain explicitly unselected. Their implementation rows remain unchecked in `tasks.md`; no nullable G3 copy, SupplierProduct inspection stage, or screen mounting was started.

### R2A parent bounded verification and staging

- Independent verifier found no blocking findings in the exact two-path R2A delta.
- Focused verification: **35/35 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **222 insertions + 8 deletions = 230 lines**, strictly below 400.
- Index identity remained `fb52be5ea1a01468d696393dc503ca67323db34a` before/after read-only verification.
- Parent staged exactly `CompraDetalleStage.tsx` and its unit test. Aggregate candidate remains **44 staged files**, now **6,455 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Detail now reads each unique non-null SupplierProduct once with the query signal, exposes its published identity and exact `resourceId`/null state, and rereads the current product set after confirmed mutations. No resource name or endpoint was invented.
- R2A is ready for F1 reverify; F2 and G3 remain unresolved until R3 and R2B.

## R2B apply progress — nullable G3 explanation (F3)

- Structured status consumed: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers or unsafe-root warnings.
- Scope consumed from the user prompt: **R2B/F3 only** against the staged R2A baseline. R3, R4, verify/reverify, bounded-review, staging, commit, branch, reset, push, PR, archive, and delivery-gate actions were not started.
- Workload gate consumed: aggregate `400-line budget risk: High`, chained PRs recommended, `feature-branch-chain`; the parent prompt resolved this apply to the R2B slice. The two-path delta stayed below 400 lines with no `size:exception`.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support used the global `fallback-path` because no project-local support file exists. The Design System checklist, atomic vocabulary, anti-patterns, `docs/design-system.md`, and strict-TDD guidance were read before editing. The existing relation-region semantics and Button/action contracts were reused; no shared UI, CSS, token, API, DTO, route, or keyboard-boundary change was introduced. Light-only support remains authoritative.

### R2B completed implementation tasks and persisted checkbox updates

- Fresh RED was written in `tests/unit/compraDetalleStage.test.tsx` before the production edit. The safety-net detail baseline was **22 passed**; the RED run was **22 passed, 4 failed** because nullable lines had no contextual relation region or G3 explanation.
- `CompraDetalleStage` now renders every nullable `supplierProductId` line inside a named `Relación de partida {lineNumber}` region with concise Spanish copy explaining that no published operation associates the line with an existing Producto de Proveedor, so Recurso Maestro selection/linking is unavailable.
- The implementation preserves the established action matrix: `NO_APLICA` remains offered only for nullable `PENDIENTE`/`CONFLICTO`; nullable `NO_APLICA` and the inconsistent nullable `VINCULADO` expose no action and no substitute relation.
- The fresh regression asserts all four nullable states, distinctness from the cross-purchase pending copy, no resource selector, no `VINCULADO` relation substitute, no SupplierProduct/resource reads, and no link/unlink/link-status calls for a null product.
- The four implementation-owned R2B rows (RED, GREEN, TRIANGULATE, REFACTOR) were marked `- [x]` in `tasks.md`; the two R2B parent-owned lifecycle rows remain unchecked and unchanged.

### R2B TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2B nullable G3 explanation and blocked relation actions | `tests/unit/compraDetalleStage.test.tsx` | Component/integration RTL | ✅ 22 passed | ✅ 22 passed, 4 failed before source edits | ✅ Final detail + badge regression: 29 passed; PENDIENTE, CONFLICTO, NO_APLICA, inconsistent VINCULADO, action matrix, accessible region, and no-call assertions are covered | ✅ Scoped formatting, ESLint, typecheck, and diff checks passed; exact two-path delta is 66 changed lines |

### R2B verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx` — **22 passed, 4 failed** before the production edit; failures were the fresh missing-region assertions.
- GREEN: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx` — **26 passed, 0 failed** after the copy/region implementation and the corresponding relation-region count expectation update.
- TRIANGULATE regression: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx` — **29 passed, 0 failed**.
- `pnpm typecheck` — **passed**; router generation completed without a route-tree worktree delta.
- `pnpm exec eslint src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed; no issues**.
- `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- `git diff --check -- src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- Against the staged R2A baseline, the exact two permitted paths changed by **66 lines**: `12 additions + 1 deletion` in `CompraDetalleStage.tsx` and `52 additions + 1 deletion` in `compraDetalleStage.test.tsx`; strictly below 400.
- Cached index identity was unchanged: `git diff --cached --binary | sha256sum` remained `94e9b6d572000c4ea1faec3446c252ee1594c4f0e0781a293eaf6bc0a8cee680` after the worktree edits. No stage, reset, commit, branch, push, PR, archive, verify, or reverify command was run.
- Runtime harness: `N/A` — R2B is covered by the authorized Vitest/RTL detail regression; no browser journey or delivery gate was started.

### R2B remaining boundary

The following R2B parent-owned lifecycle rows remain unchecked and deferred exactly as persisted:

- [ ] Ejecutar bounded verify de R2B y stagear sólo sus dos paths tras comprobar la explicación contractual y el bloqueo observable. <!-- sdd-owner: parent -->
- [ ] Preparar R2B para reverify de F3 y registrar G3 como límite contractual, no como fallo que se resuelve en frontend. <!-- sdd-owner: parent -->

R3 was explicitly prohibited by the user and was not started. Its exact unchecked implementation rows remain in `tasks.md`:

- [ ] Crear RED fresca del stage para ventana por proveedor, `StagedSearchSelector`, paginación por reemplazo, selección explícita y callback sin asociación; ejecutar antes del componente. <!-- sdd-owner: implementation -->
- [ ] Implementar el stage con la ventana existente, identidad/producto visible, controles de paginación autoritativos y callback de inspección que no llama link/link-status ni crea productos. <!-- sdd-owner: implementation -->
- [ ] Triangular proveedor ausente, initial/navigation loading/error/retry, páginas, selección, SKU coincidente sin asociación, reemplazo y unmount. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y mantener R3A estrictamente menor de 400 líneas contra el baseline R2B. <!-- sdd-owner: implementation -->
- [ ] Crear RED fresca de montaje con proveedor confirmado, ausencia sin proveedor, reset/cambio de proveedor y no asociación; ejecutar antes de editar pantalla. <!-- sdd-owner: implementation -->
- [ ] Montar `InspeccionarProductoProveedorStage` únicamente con el supplier confirmado, sin barrido global, asociación automática ni cambio de contrato de G3. <!-- sdd-owner: implementation -->
- [ ] Triangular montaje, cambio de proveedor, ausencia de red sin contexto, paginación delegada y selección que no llama mutaciones. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y dejar R3B estrictamente menor de 400 líneas contra el baseline R3A. <!-- sdd-owner: implementation -->

R3 parent-owned bounded-verify/staging rows remain unchecked and deferred. R4 implementation rows also remain unchecked and were not selected:

- [ ] Revisar la evidencia existente sin fabricar RED retroactiva; clasificar cada RED fresca de R1–R3 como comportamiento de remediación y dejar F5 abierto hasta reconciliación. <!-- sdd-owner: implementation -->
- [ ] Documentar en `apply-progress.md` los resultados reales de cada slice, sus límites y la decisión explícita sobre aceptación de desviación F5, sin editar el verify-report fallido. <!-- sdd-owner: implementation -->
- [ ] Triangular la trazabilidad de RED→GREEN→verificación por slice, confirmar que no se borró evidencia histórica y preparar el paquete de reverify. <!-- sdd-owner: implementation -->
- [ ] Refactorizar únicamente el registro de progreso para que sea auditable y conciso; no añadir source/tests ni declarar PASS por bookkeeping. <!-- sdd-owner: implementation -->

`next_recommended: parent-lifecycle`; no R3 source/test work was started, and no R4 bookkeeping work was started in this slice.

### R2B parent bounded verification and staging

- Independent verifier found no blocking findings in the exact two-path R2B delta.
- Focused verification: **26/26 tests passed**; typecheck, scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **64 insertions + 2 deletions = 66 lines**, strictly below 400.
- Index identity remained `a7410ad331a6c37a82fb0080b59dee250b961074` before/after read-only verification.
- Parent staged exactly `CompraDetalleStage.tsx` and its test. Aggregate candidate remains **44 staged files**, now **6,517 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Nullable lines now explain the absent published Partida→Producto de Proveedor operation and unavailable resource linking, while preserving the existing action matrix and avoiding selectors/endpoints/local substitutes.
- R2B is ready for F3 reverify. G3 remains a backend contract limit, not a client-side association problem.

## R3A apply progress — standalone SupplierProduct inspection stage (F2)

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers or unsafe-root warnings.
- Scope consumed from the user prompt: **R3A/F2 component only** against the staged R2B baseline. `ComprasScreen` mounting/R3B, R4, verify/reverify, bounded-review, staging, commit, branch, reset, push, PR, archive, and delivery-gate actions were not started.
- Workload gate consumed: aggregate `400-line budget risk: High`, chained PRs recommended, `feature-branch-chain`; the user resolved the delivery boundary to the standalone R3A slice and required the exact two-path delta to remain strictly below 400 lines. No `size:exception` was used.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support used `fallback-path` because no project-local support file exists. The checklist, atomic vocabulary, anti-patterns, Tailwind guidance, `docs/design-system.md`, and strict-TDD guidance were read before editing. The component reuses `WorkCard`, `Button`, `StagedSearchSelector`, and `useSupplierProductsRestWindow`; no CSS, shared UI, route, screen mount, mutation prop, API allowlist, token, or keyboard-boundary change was introduced.

### R3A completed implementation tasks and persisted checkbox updates

- Fresh RED was written first in `tests/unit/inspeccionarProductoProveedorStage.test.tsx`; `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx --reporter=verbose` failed before production creation with the real missing-module resolution error.
- GREEN introduced `InspeccionarProductoProveedorStage` with an injectable `productsWindow` seam and the existing hook as default. Missing supplier context is disabled and non-requesting; supplier requests remain scoped to the supplied ID; selector rows come only from the current authoritative window; selection is local and invokes only the optional inspection callback.
- The stage exposes Spanish loading, empty, initial-error/retry, navigation-loading, navigation-error/retry, current-window count/range, Previous/Next backend flags, visible description/SKU/ID/supplierId/resourceId state, and resets selection/search on supplier/page replacement. SKU search is informational and never invokes link, link-status, creation, or any association operation.
- Existing hook lifecycle evidence was triangulated with its focused test, including supplier isolation, replacement pagination, backend flags, initial/navigation errors and retries, exact signal forwarding, stale callbacks, StrictMode-safe unmount completion, and no request without supplier.
- The four implementation-owned R3A rows (RED, GREEN, TRIANGULATE, REFACTOR) were marked `- [x]` in `tasks.md`; R3A parent-owned bounded-verify/staging and reverify-preparation rows remain unchecked and unchanged.

### R3A TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R3A standalone inspection stage | `tests/unit/inspeccionarProductoProveedorStage.test.tsx` | Component/integration RTL | N/A (new two-path slice) | ✅ Missing-module resolution failure before source creation | ✅ Stage test passed 5/5 | ✅ Supplier isolation, no-context disabled state, lifecycle states/retry, explicit selection, SKU informational behavior, replacement reset, backend pagination flags | ✅ No CSS/shared UI/mounting; exact two-path total is 399 lines |

### R3A verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx --reporter=verbose` — **1 failed suite, 0 tests collected** before the component existed; the failure was the expected missing-module resolution error.
- GREEN/triangulation: `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx --reporter=verbose` — **5 passed, 0 failed**.
- Existing-window regression: `pnpm exec vitest run tests/unit/useSupplierProductsRestWindow.test.tsx --reporter=verbose` — **10 passed, 0 failed**.
- Combined focused run: `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx` — **15 passed, 0 failed**.
- `pnpm typecheck` — **passed**; router generation produced no additional route-tree worktree delta.
- `pnpm exec prettier --check src/features/compras/InspeccionarProductoProveedorStage.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx` — **passed**.
- `git diff --no-index --check` against `/dev/null` for both new paths — **passed**; no whitespace errors.
- Exact two-path delta against staged R2B baseline: **399 authored lines** (`194` component + `205` test), strictly below 400. The cached index does not contain either R3A path; no staged bytes were changed. No screen mount or R3B path was edited.
- Runtime harness: `N/A` — R3A is an isolated component/window seam; RTL/Vitest plus the existing RestWindow lifecycle regression are the authorized runtime evidence.

### R3A remaining boundary

The following exact R3A parent-owned lifecycle rows remain unchecked and deferred:

- [ ] Ejecutar bounded verify de R3A y stagear sólo sus dos paths después de comprobar acotación, selección explícita y ausencia de mutación. <!-- sdd-owner: parent -->
- [ ] Preparar R3A para reverify de F2 sin presentar el stage como asociación automática de partidas nullable. <!-- sdd-owner: parent -->

R3B remains explicitly deferred and untouched. Its exact unchecked implementation rows remain in `tasks.md`:

- [ ] Crear RED fresca de montaje con proveedor confirmado, ausencia sin proveedor, reset/cambio de proveedor y no asociación; ejecutar antes de editar pantalla. <!-- sdd-owner: implementation -->
- [ ] Montar `InspeccionarProductoProveedorStage` únicamente con el supplier confirmado, sin barrido global, asociación automática ni cambio de contrato de G3. <!-- sdd-owner: implementation -->
- [ ] Triangular montaje, cambio de proveedor, ausencia de red sin contexto, paginación delegada y selección que no llama mutaciones. <!-- sdd-owner: implementation -->
- [ ] Refactorizar sólo los dos paths y dejar R3B estrictamente menor de 400 líneas contra el baseline R3A. <!-- sdd-owner: implementation -->

No R3A parent verification/staging, R3B mounting, R4 bookkeeping, verify, reverify, commit, branch, reset, push, PR, archive, or delivery-gate action was performed by this apply.

## R3A correction evidence — verifier findings

- Structured status consumed before correction: `gentle-ai.sdd-status` v2 for `compras-partidas-vinculacion`, `applyState: ready`, `nextRecommended: apply`, repo-local workspace and allowed edit root equal to `/home/garfex/PROGRAMACION/sistema-ui-garfex`; the initial unqualified status was ambiguous, so the native change-qualified status command was run before editing.
- Scope remained limited to the two untracked R3A paths. No R3B mount, stage/commit/branch/reset/push/PR/archive/verify/reverify action was performed. Existing implementation-owned R3A task checkboxes remain checked; parent-owned rows remain unchecked.
- Fresh RED was added first for a same-product-ID authoritative page replacement using a layout-commit probe. Before the synchronous scope fix, `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx --reporter=verbose` failed because the replacement render frame still contained inspection state (`expected [ true ] to not include true`).
- GREEN binds selection to the synchronous tuple `(productId, supplierId, authoritative offset, authoritative rows reference)`. The current `confirmedKey` and inspection details are null when supplier/page scope changes, without an after-render cleanup effect. This also removes the unstable derived-array dependency and the exhaustive-deps warning.
- The stage retains explicit selection, supplier-window pagination, initial/navigation loading/error/retry/empty states, visible product identity/resource state, and no mutation dependencies. The existing hook regression remains the lifecycle safety net for supplier isolation, stale completion, and unmount behavior.

### Correction TDD Cycle Evidence

| Task | Test file | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| Same-ID page replacement and synchronous selection scope | `tests/unit/inspeccionarProductoProveedorStage.test.tsx` | ✅ Fresh layout-frame failure before fix | ✅ Corrected stage test passed | ✅ Explicit selection, pagination, no mutation, and existing window lifecycle regression retained | ✅ Removed effect/dependency warning and reduced two-path total below 400 |

### Correction verification commands and actual results

- `pnpm exec vitest run tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx` — **14 passed, 0 failed**.
- `pnpm exec eslint src/features/compras/InspeccionarProductoProveedorStage.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx --max-warnings 0` — **0 errors, 0 warnings**.
- `pnpm exec prettier --check src/features/compras/InspeccionarProductoProveedorStage.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx` — **passed**.
- `pnpm typecheck` — **passed**; route generation produced no additional route-tree worktree delta.
- `wc -l src/features/compras/InspeccionarProductoProveedorStage.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx` — **179 + 218 = 397 physical lines**, strictly below 400 and at most 398.
- `git diff --check --no-index` against `/dev/null` returned exit **1** for each untracked file as expected for no-index content comparison, with **no whitespace diagnostics** in either output.
- Cached target check was empty: neither new R3A path is staged. The pre-existing staged `src/app/routeTree.gen.ts` remained untouched; no index write was performed.
- Runtime harness: `N/A` — correction remains an isolated component/window seam with focused RTL/Vitest and existing RestWindow lifecycle coverage.

### R3A parent bounded re-verification and staging

- The first independent verifier rejected the original closure: the new files were 400 physical lines, same-ID scope replacement could render stale inspected state for one frame, and ESLint had one hook warning. Nothing was staged.
- After fresh RED and correction, a second independent verifier found no findings. Focused verification passed **14/14 tests**, typecheck, zero-warning ESLint, Prettier, and both untracked whitespace checks.
- Final authoritative size is **179 + 218 = 397 physical/authored lines**, strictly below 400; this supersedes the earlier 399/400 accounting.
- Selection is synchronously scoped to supplier, offset, rows reference, and product ID; same-ID supplier/page replacement requires explicit reselection and cannot render stale inspection.
- Index identity remained `c7bf4ee473e4439b9ba458edbf167b733d1e3ea4` before/after read-only verification.
- Parent staged exactly the two new R3A paths. Aggregate candidate is now **46 staged files**, **6,914 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- R3A is ready for F2 reverify but remains inspection-only; it does not associate nullable lines or perform any mutation.

## R3B apply evidence — confirmed-supplier inspection mount

- Structured status consumed before editing: `gentle-ai.sdd-status` v2 for `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, `actionContext.mode: repo-local`, and no native blocker or unsafe-root warning was present.
- Scope consumed from the user prompt: **R3B/F2 mount only**. The existing R3A stage was reused; R4, detail/linking changes, routes, sidebar, global aggregation, endpoint changes, staging, commit, branch, reset, push, PR, archive, verify, and reverify actions were not performed.
- Workload decision consumed: aggregate `400-line budget risk: High`, chained PRs recommended, `feature-branch-chain`; the prompt resolved the delivery boundary to R3B and explicitly required a two-path delta below 400. No size exception was used.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support was loaded from the global support path as `fallback-path`. The Design System checklist, atomic vocabulary, anti-patterns, Tailwind guidance, and `docs/design-system.md` were read before the UI edit. Existing `InspeccionarProductoProveedorStage`, `WorkCard`, `Button`, and `StagedSearchSelector` contracts were reused; no new shared UI, token, CSS, route, sidebar, listener, endpoint, or global aggregation was introduced.

### R3B completed implementation tasks and persisted checkbox updates

- Fresh RED was added to `tests/unit/comprasScreen.test.tsx` before changing `ComprasScreen.tsx`. The confirmed-supplier expectation failed because `InspeccionarProductoProveedorStage` was not mounted; the no-context test also verified no product request before confirmation.
- GREEN imports and mounts the existing R3A component only inside the confirmed-supplier branch, passing the confirmed supplier ID/name and the existing `comprasApi`; it does not pass mutation callbacks or add association behavior.
- TRIANGULATE covers confirmed mount exactly once, supplier-scoped product request, visible supplier context, no auto-selection, informational selection without link/unlink/link-status/create/import calls, supplier reset/unmount, fresh supplier scope at offset zero, replacement page reset, and preservation of history/detail/back/import/G2 behavior through the focused regression.
- REFACTOR formatting and lint cleanup left only the two authorized R3B paths changed against the staged R3A baseline. The four implementation-owned R3B rows are visibly `- [x]` in `tasks.md`; R3B parent-owned lifecycle rows remain unchecked and untouched.

### R3B TDD Cycle Evidence

| Task | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Confirmed-supplier inspection mount/reset | `tests/unit/comprasScreen.test.tsx` | Integration-style RTL | ✅ Prior staged U3B2 screen baseline recorded in apply-progress; focused regression passed | ✅ Fresh missing-mount failure observed before production edit | ✅ 12/12 focused screen tests passed | ✅ 90/90 tests across screen, R3A, history, detail, import, link, unlink, and `NO_APLICA` paths passed | ✅ Formatting/lint passed; 200 changed lines against staged R3A |

### R3B verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx --reporter=verbose` — failed as required on the missing confirmed-supplier inspection region.
- GREEN/REFACTOR focused: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx --reporter=dot` — **12 passed, 0 failed**.
- Focused regression: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/historialComprasStage.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx --reporter=dot` — **8 files, 90 tests passed**.
- `pnpm typecheck` — passed; route generation produced no additional route-tree worktree delta.
- `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` — passed after formatting the two authorized paths.
- `pnpm exec eslint src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx --max-warnings 0` — passed with no issues.
- `git diff --check -- src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` — passed.
- Exact two-path unstaged delta against the staged R3A baseline: **200 changed lines** (`199 additions`, `1 deletion`; `6` in `ComprasScreen.tsx`, `194` in `tests/unit/comprasScreen.test.tsx`), strictly below 400.
- Staged index fingerprint after the apply: `d1a39c5033a1148c9dcc7fc6ae168fd75e8c352783fb4cabe3277d4c087d7ba5`; no staging command or index write was performed. Both R3B paths remain unstaged worktree changes over the staged baseline.
- Runtime harness: `N/A` — R3B is covered by the authorized RTL/Vitest integration boundary; no backend or runtime fixture was created.

### R3B changed paths

- `src/features/compras/ComprasScreen.tsx` — imports and mounts the existing inspection stage in the confirmed-supplier branch.
- `tests/unit/comprasScreen.test.tsx` — fresh RED/GREEN/Triangulate integration coverage and a default empty supplier-product response for existing screen fixtures.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — checked only the four implementation-owned R3B rows.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md` — this cumulative R3B evidence.

### R3B remaining tasks and boundaries

- [ ] Ejecutar bounded verify de R3B y stagear sólo sus dos paths después de confirmar el contexto de proveedor y la ausencia de asociación. <!-- sdd-owner: parent -->
- [ ] Preparar R3B para reverify de F2 y conservar la limitación de G3 en la evidencia de integración. <!-- sdd-owner: parent -->

R4 was not started. No detail/linking endpoint, route, sidebar, global aggregation, verify/reverify, staging, commit, branch, reset, push, PR, archive, or delivery-gate action was performed. Later implementation rows remain unchanged in `tasks.md` and were not selected by this apply.

### R3B parent bounded verification and staging

- Independent verifier found no blocking findings in the exact two-path R3B delta.
- Focused verification: **26/26 tests passed**; typecheck, zero-warning scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **199 insertions + 1 deletion = 200 lines**, strictly below 400.
- Index identity remained `5d10db3aaece40cb000468cddf9afd646a0d20c2` before/after read-only verification.
- Parent staged exactly `ComprasScreen.tsx` and its test. Aggregate candidate remains **46 staged files**, now **7,112 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- Inspection mounts exactly once only for the confirmed supplier, resets across supplier changes, and never receives or calls purchase/linking mutations. Existing history/detail/import and G2/G3 flows remain intact.
- R3A/R3B are ready for F2 reverify; R4 evidence reconciliation remains.

## R4 apply progress — strict-TDD evidence reconciliation (F5)

- Structured status consumed before this documentation-only apply: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers. The workload gate remains aggregate High with `feature-branch-chain` under `ask-on-risk`; the parent prompt resolved this R4 documentation boundary and no `size:exception` was inferred.
- Skill resolution: `paths-injected`; strict-TDD support was read from the global support path. R4 changes only OpenSpec bookkeeping and does not add source, tests, or production behavior.
- R4 implementation rows were marked complete in `tasks.md` only. The R4 parent bounded-verification/staging row and parent acceptance/decision row remain unchecked for parent readback, and the final reverify row remains unchecked. No parent-owned lifecycle action was performed by this apply.

### Historical U7A2 evidence reconciliation

- U7A2's original functional GREEN remains valid: the final mutation behavior, actor/payload handling, busy and dismiss guards, accessible errors, callback ordering, and focused regression evidence remain usable as functional evidence.
- U7A2's own incremental pre-change RED was not preserved. Its recorded RED was the combined earlier missing-module failure from the predecessor candidate; that failure does not certify that the later U7A2 mutation increment failed before it was added.
- No retroactive RED was created, rerun, reconstructed, or claimed for U7A2. The historical limitation remains visible rather than being converted into strict-TDD compliance.
- The user explicitly accepted this as a documented process deviation/warning for reverify, not as strict-TDD compliance. F5 therefore remains a strict-TDD evidence deviation to disclose to reverify; acceptance does not erase the missing incremental RED.

### Fresh RED→GREEN remediation evidence and independent verification

The following evidence is copied from the cumulative slice records above. Sizes are authored changed-line deltas against each slice's staged baseline, not aggregate candidate size.

| Slice | Fresh RED → GREEN evidence | Slice size | Independent focused verification |
| --- | --- | ---: | --- |
| R1A | Fresh reread-failure assertions failed before the three production fixes; `refetch({ throwOnError: true })` then passed the retryable-window/detail contracts. | 92 | **44/44 passed** across both RestWindows, detail, and Query guard; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R1B | Fresh post-import reread/retry assertions failed before the refresh-only flow; confirmed import state and read-only retry then passed without a second upload. | 292 | **33/33 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R1C | Fresh callback-rejection assertions produced **2 failures** before link-flow changes; retained confirmed result and callback-only retry then passed. | 131 | **39/39 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R1D | Fresh confirmed-unlink reread assertions produced **2 failures** before source edits; retained result and callback-only retry then passed. | 125 | **36/36 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R1E | Fresh `NO_APLICA` reread assertions produced **3 failures** before source edits; retained line and status-POST-free retry then passed. | 138 | **42/42 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R2A | Fresh SupplierProduct read/dedupe/relation assertions produced **3 failures** before the detail change; unique reads, relation display, and reread-set behavior then passed. | 230 | **35/35 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R2B | Fresh nullable G3-region assertions produced **4 failures** before the copy/region change; contextual contractual explanation and blocked actions then passed. | 66 | **26/26 passed** in independent verification; typecheck, scoped ESLint, Prettier, and whitespace passed. |
| R3A | Initial fresh RED was the real missing-module failure before component creation. The first independent verifier rejected the initial closure because the files were 400 physical lines, same-ID replacement could retain stale inspection for one frame, and ESLint emitted a hook warning. A fresh layout-frame RED then failed before the synchronous scope correction; correction GREEN passed. | 397 final (initial accounting 399/400 rejected) | **14/14 passed** after correction, plus zero-warning ESLint, typecheck, Prettier, and untracked-file whitespace checks; the corrected stage was then independently accepted and staged by the parent. |
| R3B | Fresh missing-mount assertion failed before screen edits; confirmed-supplier-only mounting and no-association behavior then passed. | 200 | **26/26 passed** in independent verification; typecheck, zero-warning scoped ESLint, Prettier, and whitespace passed. |

R3A's rejected initial closure is retained as historical evidence, not hidden: the final authoritative size is 397 lines and the synchronous `(productId, supplierId, offset, rows reference)` scope correction is the accepted implementation. Across R1A–R3B, all fresh REDs above describe new remediation behavior; none is being presented as retroactive evidence for U7A2.

### Historical gates and candidate state preserved

- The historical aggregate `pnpm test` result remains **exit 1** because of the flaky `useCatalogAttributeCreation` unmount/late-response test; its isolated rerun was recorded as **15/15**, but that rerun does not erase the aggregate exit 1.
- The historical `pnpm format:check` result remains **exit 1** for the same 14 external files; those files were preserved unchanged. No all-green claim is made.
- The prior `verify-report.md` remains unchanged and remains **FAIL** evidence. This R4 entry does not edit, replace, or downgrade that report.
- Candidate state remains **46 staged files, 7,112 insertions, 22 deletions**. OpenSpec artifacts remain untracked/unstaged. No stage, commit, branch, reset, push, PR, archive, verify, reverify, receipt, or delivery-gate action was performed.

### R4 TDD Cycle Evidence

| Task | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R4 evidence reconciliation | N/A — documentation-only `apply-progress.md` update | OpenSpec bookkeeping | Existing R1A–R3B evidence reread | No retroactive RED created or claimed; U7A2 limitation preserved | N/A — no production behavior changed | Cross-slice RED→GREEN→independent-verification trace recorded above | Progress entry kept cumulative; no source/test or failed-report edits |

### R4 remaining boundaries

- Documentation diff check: `git diff --no-index --check /dev/null openspec/changes/compras-partidas-vinculacion/apply-progress.md` returned the expected no-index exit 1 and emitted no whitespace diagnostics.
- Parent-owned R4 bounded verification/staging and acceptance/readback rows remain unchecked in `tasks.md`.
- Final reverify remains unchecked and is not run by `sdd-apply`. Reverify must preserve the historical test exit 1, format exit 1, FAIL verify-report evidence, and F5 warning unless its parent-owned process explicitly supersedes them with a new report.

## R2C apply progress — explicit immutable technical metadata coverage

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local` and no native blockers or unsafe-root warnings.
- Scope consumed from the user prompt: **R2C only** against the staged R3B baseline. No R2D/other slice, verify/reverify, bounded review, stage, commit, branch, reset, push, PR, archive, Convex, endpoint, DTO, mutation, calculation, or delivery-gate action was performed.
- Workload decision consumed: aggregate `400-line budget risk: High`, chained PRs recommended, `feature-branch-chain`; the parent prompt resolved this apply to R2C and required the exact two-path delta below 400. No `size:exception` was used.
- Skill resolution: `paths-injected` for GARFEX Design System; strict-TDD support used the global `fallback-path` because no project-local support file exists. The Design System checklist, atomic vocabulary, anti-patterns, Tailwind guidance, `docs/design-system.md`, and strict-TDD guidance were read before UI edits. Existing metadata grid, relation table, responsive overflow wrapper, and feature-local DS utility classes were preserved; no shared UI or token change was introduced. Light-only support remains authoritative.

### R2C completed implementation tasks and persisted checkbox updates

- Fresh RED was written first in `tests/unit/compraDetalleStage.test.tsx` and failed on the absent `ID de compra` render while the production component remained unchanged. The fixture now uses non-empty distinct purchase timestamps, and the existing line fixture provides distinct non-empty line IDs with the purchase ID preserved as the relationship value.
- GREEN added `Purchase.id`, `Purchase.createdAt`, and `Purchase.updatedAt` to the existing immutable purchase metadata grid while preserving the existing `Purchase.supplierId` row without duplication. It added each line's `id` and `purchaseId` to the existing relation/technical area, not the wide document-field table.
- TRIANGULATE covers all four fixture lines and statuses, exact technical ID strings, purchase supplier ID, XML filename/hash, purchase and line decimal strings, nullable relation state, and absence of `input`, `textarea`, `select`, textbox, and editable content.
- The four implementation-owned R2C rows in `tasks.md` are visibly `- [x]`; the two parent-owned R2C lifecycle rows remain byte-for-byte unchanged and deferred.

### R2C TDD Cycle Evidence

| Task | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2C immutable technical metadata coverage | `tests/unit/compraDetalleStage.test.tsx` | Integration-style RTL | ✅ 26/26 existing detail tests passed before edits | ✅ Fresh test failed before production edit (`ID de compra` absent) | ✅ 27/27 focused tests passed after the minimal detail change | ✅ Multiple lines/statuses, exact IDs/timestamps, XML/decimal preservation, and no editable controls | ✅ Prettier-normalized test/component; final checks remained green; 111 changed lines |

### R2C verification commands and actual results

- RED: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx --reporter=verbose` — **1 failed, 26 passed**, failing on the missing purchase metadata string as required.
- GREEN/triangulation: `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx --reporter=dot` — **27 passed, 0 failed**.
- `pnpm typecheck` — **passed**; the configured command also ran route generation without producing a route-tree worktree change.
- `pnpm exec eslint src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx --max-warnings 0` — **passed** with no issues.
- `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed** after formatting the two authorized paths. The initial check failed before the format-only refactor and was corrected without behavior changes.
- `git diff --check -- src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx` — **passed**.
- Exact two-path delta against the staged R3B baseline: `CompraDetalleStage.tsx` **16 additions + 1 deletion**; `compraDetalleStage.test.tsx` **91 additions + 3 deletions**; total **111 changed lines**, strictly below 400.
- Index integrity: no staging command was run; the current index fingerprint is `d6d0ab87fe2b43a9b0f816cd7ad9679de6353a15`, and only the two authorized paths have worktree `AM` status over the staged baseline. OpenSpec remains untracked/unstaged.
- Runtime harness: `N/A` — R2C is an isolated RTL/Vitest detail slice; no backend or runtime fixture was created.

### R2C changed paths

- `src/features/compras/CompraDetalleStage.tsx` — purchase immutable metadata and concise technical relation cells.
- `tests/unit/compraDetalleStage.test.tsx` — fresh exact-string, immutability, XML, decimal, and multi-line coverage.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — only the four implementation-owned R2C checkboxes were updated.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md` — cumulative R2C evidence appended.

### R2C remaining boundaries

- [ ] Ejecutar bounded verify independiente de R2C contra el baseline posterior a R3B, revisar exactamente `src/features/compras/CompraDetalleStage.tsx` y `tests/unit/compraDetalleStage.test.tsx`, y stagear selectivamente sólo esos dos paths; mantener OpenSpec unstaged. <!-- sdd-owner: parent -->
- [ ] Mantener la reverify final bloqueada hasta cerrar R2C y completar el cierre parent de R4; no editar `verify-report.md`, no iniciar otro slice y no crear commit, branch, push o PR. <!-- sdd-owner: parent -->

R2C implementation is complete and returns `next_recommended: parent-lifecycle`; parent-owned bounded verification/staging and final reverify remain deferred. The prior FAIL `verify-report.md` was not edited.

### R2C parent bounded verification and staging

- Independent verifier found no blocking findings in the exact two-path R2C delta.
- Focused verification: **27/27 tests passed**; typecheck, zero-warning scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **107 insertions + 4 deletions = 111 lines**, strictly below 400.
- Index identity remained `e80e18a1a80264888c65ada0b4639e234bf1cb33` before/after read-only verification.
- Parent staged exactly `CompraDetalleStage.tsx` and its test. Aggregate candidate remains **46 staged files**, now **7,215 insertions and 22 deletions**; cached whitespace check passed. OpenSpec remains untracked/unstaged.
- The current detail exposes immutable Purchase `id`, existing `supplierId`, `createdAt`, `updatedAt`, plus every line `id`/`purchaseId` in the separate relation area. The received supplierId omission finding was stale, but its missing regression assertion is now explicit.

### R4 parent evidence decision and correction

- Independent documentation verifier confirmed the U7A2 incremental RED gap, absence of retroactive evidence, explicit user acceptance as a process deviation rather than strict-TDD compliance, R1–R3 evidence, R3A rejected first closure/correction, mixed aggregate gates, and candidate inventory.
- Its sole finding was an inconsistent instruction to stage `apply-progress.md`. The parent corrected that row to preserve the governing rule: all OpenSpec artifacts remain unstaged.
- The user explicitly accepted the historical F5 evidence deviation before reverify. This does not certify the original U7A2 cycle as strict-TDD compliant.
- R2C and R4 parent gates are closed. Final reverify is now permitted; the previous FAIL report remains historical evidence until the new verification artifact is produced.

## R1F apply progress — StrictMode import feedback remediation (F6)

- Structured status consumed before editing: `gentle-ai.sdd-status` v2, change `compras-partidas-vinculacion`, authoritative `openspec` store, `applyState: ready`, `nextRecommended: apply`; workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex` is the sole allowed edit root, with `actionContext.mode: repo-local`, allowed edit root equal to the workspace, and no native blockers. The status was authoritative and the active change was unambiguous.
- Workload gate consumed: `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `Chain strategy: feature-branch-chain`, aggregate `400-line budget risk: High`; the user resolved this apply to the R1F/F6 slice and explicitly required the two-path delta below 400. No `size:exception` was used.
- Scope consumed: R1F only, against the staged R2C baseline. No other source/test path, endpoint, DTO, adapter, mutation, Convex surface, delivery action, verify report, reverify report, branch, commit, push, PR, archive, or staging action was used.
- Skill resolution: `fallback-path` for strict-TDD guidance because the project-local support file was absent; the global strict-TDD guidance and injected GARFEX Design System skill were read. No new visual component or styling was introduced.

### R1F completed implementation tasks and persisted checkbox updates

- Fresh RED was added to `tests/unit/comprasScreen.test.tsx` before the production edit. It mounts the real `ComprasScreen` through React `<StrictMode>` for both `alreadyExisted: false` and `true`, keeps the authoritative current-supplier reread pending, asserts feedback is absent while reread is pending, then asserts feedback is visible and the import dialog is closed after reread. The RED run failed in both parameterized cases (`2 failed, 12 passed`) because StrictMode left the screen lifecycle ref false after its probe cleanup.
- GREEN changed only `src/features/compras/ComprasScreen.tsx`: the existing `screenMountedRef` effect now sets `.current = true` during setup and `.current = false` during cleanup. R1B's confirmed-result reread/retry separation and single-upload behavior were not changed.
- TRIANGULATE added/retained StrictMode coverage for the non-current-supplier honest message, supplier-change stale suppression, and unmount during an unresolved reread. The final focused screen suite passed **15/15**, including one upload per workflow, exactly one current-supplier reread, feedback only after reread, dialog closure, no stale post-unmount feedback, and R1B's read-only retry regression.
- The five implementation-owned R1F task rows (RED, GREEN, TRIANGULATE, REFACTOR, focused checks) are visibly `- [x]` in `tasks.md`. Parent-owned bounded verify/staging and reverify rows remain unchanged and deferred.

### R1F TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1F StrictMode import feedback lifecycle | `tests/unit/comprasScreen.test.tsx` | Integration-style RTL/Vitest | ✅ Baseline **12/12** before edits | ✅ Fresh StrictMode parameterized cases failed **2/2** before source edit | ✅ Focused suite passed **14/14** after the lifecycle setup fix | ✅ Final suite passed **15/15** with current/non-current supplier, created/alreadyExisted, pending reread, supplier change, unmount/stale resolution, one upload, and read-only retry coverage | ✅ Prettier-normalized exactly the two authorized paths; behavior remained **15/15** |

### R1F verification commands and actual results

- `pnpm exec vitest run tests/unit/comprasScreen.test.tsx --reporter=dot` — **15 passed, 0 failed**.
- `pnpm exec eslint src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx --max-warnings 0` — **passed**.
- `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` — **passed** after the authorized formatting-only refactor.
- `pnpm typecheck` — **passed**; route generation produced no worktree route change.
- `git diff --check` — **passed**.
- Exact unstaged two-path delta against the staged R2C baseline: `ComprasScreen.tsx` **1 addition**, `comprasScreen.test.tsx` **142 additions + 2 deletions**, total **145 changed lines**, strictly below 400.
- Index integrity: `git write-tree` was `7629f7ca69d652ac837e1959ef6c71b1ab4b237b` before the RED edits and remained the same after all checks. No staging command was run. Only the two authorized paths have unstaged changes (`AM` over the existing staged candidate); all OpenSpec artifacts remain untracked/unstaged.
- Runtime harness: `N/A` — R1F is a real-screen React StrictMode RTL/Vitest slice; no backend, Convex, or runtime fixture was created.

### R1F changed paths and boundaries

- `src/features/compras/ComprasScreen.tsx` — restore the mounted lifecycle flag in the existing effect setup; cleanup remains the sole false transition.
- `tests/unit/comprasScreen.test.tsx` — StrictMode parameterized created/already-existing reread tests, strict non-current/stale coverage, and unmount suppression coverage.
- `openspec/changes/compras-partidas-vinculacion/tasks.md` — only the five implementation-owned R1F checkboxes were updated.
- `openspec/changes/compras-partidas-vinculacion/apply-progress.md` — this cumulative R1F evidence entry.

### R1F remaining boundaries

- [ ] Ejecutar bounded verify independiente de R1F contra su baseline, revisar únicamente los dos paths, confirmar el límite `<400` y stagear selectivamente sólo source/test; dejar `verify-report.md`, `reverify-report.md` y todos los artefactos OpenSpec unstaged. <!-- sdd-owner: parent -->
- [ ] Coordinar una segunda reverify independiente después del cierre parent de R1F, contra el SHA/baseline correspondiente, preservando ambos informes de verificación y sin iniciar commit, branch, push, PR, archive ni otra acción de entrega. <!-- sdd-owner: parent -->

All other unchecked implementation and parent-owned rows in `tasks.md` remain unchanged and outside the R1F apply boundary. This apply returns `next_recommended: parent-lifecycle`; bounded review, receipts, verification, reverify, staging, and delivery actions remain parent-owned.

### R1F parent bounded verification and staging

- Independent verifier found no blocking findings in the exact two-path R1F delta.
- Focused verification: **39/39 tests passed**; typecheck, zero-warning scoped ESLint, scoped Prettier, and whitespace checks passed.
- Verified delta: **143 insertions + 2 deletions = 145 lines**, strictly below 400.
- Index identity remained `7629f7ca69d652ac837e1959ef6c71b1ab4b237b` before/after read-only verification.
- Parent staged exactly `ComprasScreen.tsx` and its test. Aggregate candidate remains **46 staged files**, now **7,356 insertions and 22 deletions**; cached whitespace check passed. OpenSpec and both verification reports remain unstaged.
- Real-screen StrictMode tests now cover created/already-existing feedback after reread, dialog closure, single upload, non-current supplier copy, supplier-change stale suppression, unmount, and R1B reread-only retry.
- R1F is ready for the second reverify; no PASS or delivery claim is made yet.

### Second reverify result

- A new `reverify-2-report.md` was produced without modifying the original FAIL `verify-report.md` or first FAIL `reverify-report.md`.
- Verdict: **PASS WITH WARNINGS**. F1–F4, R2C, and F6 are confirmed corrected. F5 remains an explicitly accepted process warning and is not strict-TDD compliance.
- Current full tests passed **945/945**; typecheck, lint, build, router check, Compras Playwright, candidate Prettier, and both diff checks passed.
- Global `pnpm format:check` remains exit 1 only on the 14 unchanged external files already recorded. Historical aggregate test exit 1 remains preserved and is not rewritten.
- Candidate integrity: **46 staged files, 7,356 insertions, 22 deletions**; OpenSpec and all three verification reports remain unstaged; prior report hashes were unchanged; no route-tree unstaged delta.
- No commit, branch, push, PR, archive, native review, Convex change, or delivery action was performed.

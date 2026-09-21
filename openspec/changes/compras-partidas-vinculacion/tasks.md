# Tareas — Compras, partidas y vinculación

Change explícito: `compras-partidas-vinculacion`
Artifact store: `openspec`
Estrategia de ejecución: `auto`
TDD estricto: `pnpm test`
Presupuesto canónico: 400 líneas autorales por unidad
Orden aprobado: U1A → U1B → U2A → U2B → U3A → U3B1 → U3B2 → U4A → U4B → U5 → U6A → U6B1 → U6B2 → U7A1 → U7A2 → U7B → U8A → U8B → U8C → U9
Conteo de tareas: 158 filas con checkbox (129 implementation, 29 parent; 75 filas nuevas de remediación)

## Review Workload Forecast

| Field                   | Value                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | Remediación ~2,550 en 12 slices; acumulado histórico + remediación ~6,950 |
| 400-line budget risk    | High en el agregado; Low por slice de remediación (R1F estrictamente <400) |
| Chained PRs recommended | Yes |
| Suggested split         | R1A → R1B → R1C → R1D → R1E → R2A → R2B → R3A → R3B → R2C → R4 → R1F; nunca fusionar slices |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | feature-branch-chain; preservada desde el verify-report |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

El total de la funcionalidad supera 400 líneas, pero cada unidad es un corte autónomo menor de 400 líneas. El usuario resolvió el gate `ask-on-risk` el 2026-09-19 eligiendo `feature-branch-chain`; no se infiere `size:exception` ni una excepción de tamaño. Esta decisión planifica la entrega, pero no autoriza crear ramas, commits, pushes ni PRs.

## Reglas comunes de ejecución

- Mantener estrictamente el orden U1A→U1B→U2A→U2B→U3A→U3B1→U3B2→U4A→U4B→U5→U6A→U6B1→U6B2→U7A1→U7A2→U7B→U8A→U8B→U8C→U9 y no fusionar unidades.
- Cada unidad debe conservar juntas implementación, pruebas y documentación/guardas directamente necesarias para su comportamiento.
- Ejecutar las fases en orden RED → GREEN → TRIANGULATE → REFACTOR; las casillas son planificadas y permanecen sin marcar hasta la ejecución.
- El backend es la autoridad: no agregar matching, cascadas optimistas, stores globales, persistencia, fixtures runtime ni contratos no publicados.
- Para UI, reutilizar `PageHeader`, `WorkCard`, `Field`, `Button`, dialogs, `StagedSearchSelector` y tokens existentes; no crear componentes equivalentes en `src/shared/ui/`.
- Mantener ids y montos como strings, datos documentales no editables, foco/nombres accesibles y teclado dentro de las fronteras existentes.
- En cada unidad registrar el resultado real del comando enfocado y del runtime harness en el commit/receipt; esta planificación no afirma que se hayan ejecutado.

La antigua U1 GREEN/TRIANGULATE del intento bloqueado queda superseded por U1A/U1B y no constituye evidencia de completitud.

## U1A — Contratos, schemas, errores y lecturas REST

**Objetivo:** establecer únicamente la frontera feature-local de contratos, validación Zod, errores y operaciones READ de Compras. Importación multipart y mutaciones actor-gated pertenecen exclusivamente a U1B.

**Inicio:** el candidato previo de U1 incluye importación y mutaciones y no tiene RED válida bajo el runner configurado.
**Fin:** `compras.types.ts` conserva ids/montos como strings; `compras.api.ts` valida respuestas desconocidas con Zod feature-local y expone sólo `getPurchase`, by UUID si se conserva, líneas, compras por proveedor, productos por proveedor, `findSupplierProduct` y `getSupplierProduct`; conserva status/code/detail en errores.
**Superficies de edición permitidas:**

- `src/features/compras/compras.types.ts`
- `src/features/compras/compras.api.ts`
- `tests/unit/comprasApiReads.test.ts`
- `tests/architecture/restTransportBoundaries.test.ts`
- `tests/architecture/queryZodBoundaries.test.ts`
- `tests/architecture/keyboardBoundaries.test.ts` para la allowlist de transporte aprobada, sin añadir listeners de teclado

**Límite de rollback:** retirar la frontera de lecturas, su prueba y las entradas exactas de allowlist; no tocar importación/mutaciones futuras de U1B, APIs de otras features ni guardas de teclado.

**RED**

- [x] Tras resetear el candidato a un scaffold explícito sin lecturas terminadas, añadir y ejecutar `tests/unit/comprasApiReads.test.ts` con una aserción observable fallida para las lecturas U1A; no reutilizar la prueba descartada bajo `src/**`. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar sólo contratos, schemas Zod, parsing de lecturas y errores de `compras.api.ts`; no añadir `importPurchase`, link, unlink ni link-status. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar el focused command de U1A y verificar respuestas no conocidas, strings decimales/ids, las siete URLs GET con encoding de ID/UUID/SKU, `limit`/`offset`, forwarding exacto de `AbortSignal` y el error envelope `{ error, code, detail }` sin coerciones numéricas ni estados inventados. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Reducir duplicación interna sin promover helpers a `shared`, mantener sólo operaciones READ y dejar U1A por debajo de 400 líneas autorales; registrar el conteo exacto y el resultado enfocado. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm test -- tests/unit/comprasApiReads.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/compras.types.ts src/features/compras/compras.api.ts tests/unit/comprasApiReads.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts`.
**Runtime harness:** N/A — es una frontera REST/schema sin UI independiente; los transportes se simulan en Vitest y las guardas arquitectónicas son el runtime verificable de esta unidad.

## U1B — Importación multipart y mutaciones actor-gated

**Objetivo:** implementar en una unidad futura la importación multipart y las mutaciones publicadas, separadas de la frontera READ de U1A.

**Inicio:** U1A expone contratos, schemas, errores y lecturas; U1B no comienza en este apply.
**Fin:** `importPurchase`, link, unlink y link-status quedan cubiertos por `tests/unit/comprasApiMutations.test.ts`, con actor compartido, FormData sin `content-type` manual, resultados 201/200/409/422 y relectura a cargo de las unidades superiores.
**Superficies de edición permitidas:**

- `src/features/compras/compras.types.ts`
- `src/features/compras/compras.api.ts`
- `tests/unit/comprasApiMutations.test.ts`
- `tests/architecture/restTransportBoundaries.test.ts`
- `tests/architecture/queryZodBoundaries.test.ts`

**Límite de rollback:** retirar únicamente importación, mutaciones, sus pruebas y las entradas de allowlist añadidas para esa conducta; conservar U1A.

**RED**

- [x] Escribir pruebas fallidas de importación multipart, actor obligatorio, códigos 201/200/409/422, link, unlink y link-status en `tests/unit/comprasApiMutations.test.ts`; no iniciar esta unidad durante el apply de U1A. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar importación y mutaciones sólo después de cerrar U1A, usando `withRestActor` y sin mezclar responsabilidades READ. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar el focused command de U1B y verificar envelopes, actor, FormData y respuestas confirmadas sin estados locales inventados. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener U1B independiente, sin promoción de helpers a `shared` y por debajo de 400 líneas autorales. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm test -- tests/unit/comprasApiMutations.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts`.
**Runtime harness:** N/A — frontera REST/schema; queda diferido y no autorizado en este apply.

## U2A — Ventana paginada de compras por proveedor

**Objetivo:** cerrar únicamente la lectura paginada de compras con el patrón `RestWindow`, sin agregar proveedores ni presentar resultados globales.

**Inicio:** U1A y U1B exponen el adapter y tipos; no hay una ventana Query de compras por proveedor cerrada.
**Fin:** `useSupplierPurchasesRestWindow` usa sólo GET `/v1/suppliers/{id}/purchases`, conserva `hasPrevious`/`hasNext`, resetea el offset al cambiar de proveedor y mantiene el estado de consulta activo seguro. U2A no implementa ni reintroduce la ventana de productos de U2B.
**Superficies de edición permitidas:**

- `src/features/compras/useSupplierPurchasesRestWindow.ts`
- `tests/unit/useSupplierPurchasesRestWindow.test.tsx`
- `tests/architecture/queryZodBoundaries.test.ts` sólo para el binding exacto de este hook

**Límite de rollback:** retirar únicamente la ventana de compras, su prueba y su binding de Query; conservar intactos los adapters U1A/U1B, U2B pendiente y cualquier hook de otra feature.

**RED**

- [x] Preservar la evidencia RED real ya observada al ejecutar el runner configurado con el módulo de compras ausente; no rerunear ni fabricar una RED artificial durante esta corrección. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Mantener la implementación de `useSupplierPurchasesRestWindow` contra el único endpoint de compras del proveedor, con clave que incluye proveedor/límite/offset, señal Query, sin acumulación local y con callbacks imperativos bloqueados cuando falta proveedor. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar el focused purchase-window test y la guarda Query; comprobar ausencia de proveedor y estado disabled/empty, initial-loading, initial-error/navigation-error, retry/refetch sólo activos, callbacks stale en cambio/desmontaje, completion posterior al desmontaje, paginación, reset, señal y ausencia de acumulación/consulta global. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Separar U2A de la unidad combinada, retirar sólo U2B y su binding, conservar el patrón de Proveedores y dejar la unidad U2A en 356 líneas autorales de producción+test+guard, por debajo de 400. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts`.
**Runtime harness:** N/A — la ventana no tiene una frontera de navegador autónoma; Vitest/RTL, la guarda Query, typecheck y Prettier son la evidencia autorizada.

## U2B — Ventana paginada de productos de proveedor

**Objetivo:** cerrar como unidad independiente la lectura paginada de productos de proveedor, sin mezclarla con U2A.

**Inicio:** U2A cerrada; la ventana de productos y su prueba están ausentes del candidato y requieren este corte independiente.
**Fin:** la ventana de productos queda implementada, probada y acotada al proveedor vigente; no se inicia U3+ en este apply.
**Superficies de edición permitidas:**

- `src/features/compras/useSupplierProductsRestWindow.ts`
- `tests/unit/useSupplierProductsRestWindow.test.tsx`
- `tests/architecture/queryZodBoundaries.test.ts` sólo para su binding exacto

**Límite de rollback:** independiente de U2A; un apply futuro podrá añadir únicamente este hook, su prueba y su binding sin tocar la ventana de compras.

**RED**

- [x] Escribir la prueba fallida de página inicial, paginación, proveedor ausente, errores, señal y stale completion de productos. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar la ventana de productos limitada al proveedor vigente y añadir sólo su binding Query. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar focused tests y guardas de U2B, comprobando ausencia de agregación transversal y no acumulación local. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Alinear U2B con el patrón RestWindow sin crear un hook genérico transversal y mantenerla por debajo de 400 líneas autorales. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/useSupplierProductsRestWindow.test.tsx tests/architecture/queryZodBoundaries.test.ts`.
**Runtime harness:** N/A — la ventana no tiene una frontera de navegador autónoma; Vitest/RTL y las guardas son la evidencia autorizada.

## U3A — Ruta “/compras”, shell y modelo inicial

**Objetivo:** cerrar únicamente la entrada feature-first y la shell inicial de Compras. U3A no implementa el selector de proveedor, sus estados ni el historial.

**Inicio:** U1A, U1B, U2A y U2B están disponibles; no hay contrato de shell U3A cerrado.
**Fin:** la ruta plana monta `ComprasEntry`; `ComprasScreen` reutiliza `PageHeader` y `WorkCard`, muestra una región inicial que exige contexto de proveedor y no presenta selector, tabla, historial global, pendientes ni dependencia de `AppShell.tsx`; `comprasNavigation.model.ts` conserva sólo el estado inicial.
**Superficies de edición permitidas:**

- `src/app/routes/compras.tsx`
- `src/app/routeTree.gen.ts` (registro generado, actualizado por `pnpm router:generate`)
- `src/features/compras/comprasNavigation.model.ts`
- `src/features/compras/ComprasEntry.tsx`
- `src/features/compras/ComprasScreen.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `tests/unit/comprasScreen.test.tsx`

**Límite de rollback:** retirar sólo la ruta, entry, shell, modelo y pruebas U3A; no eliminar adapters/hooks U1A-U2B, no iniciar U3B y no modificar `AppShell.tsx`.

**RED**

- [x] Preservar la RED válida del intento combinado para ruta/modelo/shell; reescribir las pruebas al contrato U3A sin rerunear ni fabricar evidencia RED. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar la ruta, entry, modelo inicial y shell U3A con `PageHeader` y `WorkCard` existentes; retirar selector, estados y lógica específica de proveedor sin crear componentes compartidos nuevos. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar las pruebas mínimas de navegación/modelo y shell, además de `pnpm router:check`; verificar título, región de selección requerida, ausencia de selector/tabla/historial/pendientes y ausencia de dependencia de `AppShell`. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener U3A por debajo de 400 líneas incluyendo el delta generado de ruta, conservar el patrón visual compartido y dejar U3B ausente. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx`; `pnpm router:check`.
**Runtime harness:** N/A — U3A es una shell sin historial ni navegación de sidebar; RTL y `pnpm router:check` son suficientes para este corte.

## U3B — Combined claims superseded

The previous combined U3B implementation/evidence and its 400-line outcome are historical and superseded. U3B is now split into U3B1 (selector/model) and U3B2 (screen integration). No combined U3B checkbox is authoritative for the split.

## U3B1 — Selector and navigation model (completed)

**Objetivo:** implementar el modelo de confirmación/reset y `ElegirProveedorStage` en modo bounded/no acumulativo, sin montar `ComprasScreen`.

**Inicio:** U3A cerrada y restaurada en el staged baseline; `ComprasScreen.tsx` y `tests/unit/comprasScreen.test.tsx` deben permanecer byte-identical al índice.
**Fin:** el modelo y el stage aislado cubren búsqueda, opciones con fiscal ID visible, estados iniciales, navegación externa explícita, retry, confirmación y foco accesible. U3B2/U4+ permanecen fuera.
**Superficies permitidas:**

- `src/features/compras/comprasNavigation.model.ts`
- `src/features/compras/ElegirProveedorStage.tsx`
- `tests/unit/comprasNavigation.test.ts`
- `tests/unit/elegirProveedorStage.test.tsx`

**RED**

- [x] Escribir/retener RED válida para el modelo y escribir primero la prueba aislada de `ElegirProveedorStage`; observar fallos reales antes de implementar el stage. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar sólo el modelo y `ElegirProveedorStage` bounded, reutilizando `Button`/`StagedSearchSelector` y sin agregar listeners, CSS, tokens o integración de pantalla. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar las pruebas aisladas de U3B1 y cubrir fiscal ID por opción, búsqueda, loading/error/empty, navegación/retry, reemplazo anterior/siguiente, disabled/loading, confirmación, foco y ausencia de compras. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir exactamente los cuatro paths contra el índice staged con `git diff --numstat`; mantener U3B1 por debajo de 400 líneas sin comprimir cobertura ni declarar excepción. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/comprasNavigation.test.ts tests/unit/elegirProveedorStage.test.tsx`.
**Runtime harness:** N/A — U3B1 es una prueba aislada de modelo/componente sin montaje de pantalla.

## U3B2 — ComprasScreen integration (pending)

**Objetivo:** montar U3B1 en `ComprasScreen`, conservar el proveedor confirmado y ofrecer el placeholder U4 sin fetch de compras.

**Inicio:** U3B1 cerrada; U3A screen/test permanecen restaurados y byte-identical al índice.
**Fin:** pendiente; no iniciar durante el apply U3B1. U4+, `AppShell.tsx` y el árbol de rutas permanecen fuera.
**Superficies futuras permitidas:**

- `src/features/compras/ComprasScreen.tsx`
- `tests/unit/comprasScreen.test.tsx`

**RED**

- [x] Añadir pruebas fallidas de montaje del selector, contexto confirmado/cambio, placeholder U4 y ausencia de tabla/fetch de compras. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Montar U3B1 desde `ComprasScreen` y conectar únicamente la ventana/API pública de Proveedores, sin iniciar historial real ni U4+. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar la regresión U3A/U3B2 y comprobar reset, contexto, no tabla global y no fetch de compras. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir U3B2 por separado bajo 400 líneas; mantener `AppShell.tsx`, índice y U3B1 fuera de cambios. <!-- sdd-owner: implementation -->

**Focused commands:** pendiente para el apply U3B2.
**Runtime harness:** pendiente para el apply U3B2.

## U4A — Historial paginado por proveedor

**Objetivo:** montar únicamente la ventana autoritativa de compras del proveedor confirmado. `HistorialComprasStage` es presentacional y recibe filas, estado, flags, navegación, retry y selección por props; no hace fetching propio, no agrega páginas y no consulta un listado global.

**Inicio:** U3B2 conserva el proveedor confirmado y el hook de Proveedores; la ventana de compras ya existe, pero no está montada en pantalla.
**Fin:** la pantalla conecta `useSupplierPurchasesRestWindow` con el `supplierId` confirmado, mantiene visible el contexto del proveedor, muestra la ventana actual con datos contractuales exactos para display y comunica la selección sólo como placeholder de U6; cambiar proveedor desactiva/resetea naturalmente la ventana.
**Superficies de edición permitidas:**

- `src/features/compras/HistorialComprasStage.tsx`
- `tests/unit/historialComprasStage.test.tsx`
- `src/features/compras/ComprasScreen.tsx` únicamente para montar U4A
- `tests/unit/comprasScreen.test.tsx` únicamente para la integración U4A

**Límite de rollback:** retirar el stage y su montaje/pruebas U4A; conservar U3A/U3B1/U3B2, adapters, hooks y el índice staged. No tocar `ImportarCompraSurface`, `AppShell.tsx`, detalle, pendientes ni shared UI.

**RED**

- [x] Escribir primero `tests/unit/historialComprasStage.test.tsx` y observar RED de módulo ausente; añadir después la RED de integración en `tests/unit/comprasScreen.test.tsx` para montaje con proveedor confirmado, hook cerrado y ausencia de historial global. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar `HistorialComprasStage` como componente controlado y montar `useSupplierPurchasesRestWindow` en `ComprasScreen` usando sólo el `supplierId` confirmado; mantener título/contexto accesibles, tabla de ventana, estados y placeholder de selección U6. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar focused tests de stage/screen y cubrir estados inicial/empty/error/navegación, flags y gates de paginación, rows no acumuladas, formato exacto de contrato, callback de selección, placeholder y ausencia de fetch/agregación global. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir exactamente los cuatro paths U4A contra el índice staged hasta U3B2, mantener el delta menor de 400 líneas, reutilizar `PageHeader`/`WorkCard`/`Button` y registrar router/typecheck/Prettier/diff sin tocar el índice. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/historialComprasStage.test.tsx tests/unit/comprasScreen.test.tsx`; `pnpm router:check`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/HistorialComprasStage.tsx tests/unit/historialComprasStage.test.tsx src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx`.
**Runtime harness:** N/A — U4A no tiene jornada de navegador independiente; RTL/Vitest y los gates de router/typecheck/Prettier verifican la integración autorizada.

## U4B — Importación CFDI

**Objetivo:** implementar después de U4A, y sólo entonces, el dialog multipart de importación y sus resultados confirmados.

**Inicio:** U4A cerrada; la pantalla ya muestra historial, pero la importación sigue fuera de alcance.
**Fin:** `ImportarCompraSurface` distingue creación, `alreadyExisted`, conflicto, XML inválido y error contractual, con actor y refresh autoritativo cuando corresponda.
**Superficies de edición permitidas:**

- `src/features/compras/ImportarCompraSurface.tsx`
- `tests/unit/importarCompraSurface.test.tsx`
- `src/features/compras/ComprasScreen.tsx` únicamente para el montaje posterior U4B
- `tests/unit/comprasScreen.test.tsx` únicamente para integración U4B

**Límite de rollback:** retirar sólo importación, su montaje y pruebas; conservar U4A y no adelantar U5.

**RED**

- [x] Escribir pruebas fallidas de multipart, actor obligatorio, códigos 201/200/409/422, cierre/feedback y refresh autoritativo; no iniciar U4B durante U4A. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar `ImportarCompraSurface` contra el adapter U1B, sin presentar 200 `alreadyExisted` como error ni mezclarlo con el stage de historial. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar focused tests de importación y screen, verificando envelopes, accesibilidad, actor y refresh sólo para el proveedor vigente. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener U4B separada de U4A y por debajo de 400 líneas autorales; registrar comandos reales sin modificar el índice ni iniciar U5. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/importarCompraSurface.test.tsx tests/unit/comprasScreen.test.tsx`.
**Runtime harness:** N/A — no existe una jornada de navegador independiente autorizada para esta superficie; Vitest/RTL cubren el diálogo y la integración.

## U5 — Wiring real de navegación en `AppShell`

**Objetivo:** reemplazar únicamente el placeholder de Compras por el `Link` real y mantener índices, superficie activa y título de topbar coherentes.

**Inicio:** Compras existe como ruta/feature, pero `AppShell.tsx` aún muestra un `navigation-static`.
**Fin:** Compras navega a la ruta “/compras”, el índice de Catálogo queda desplazado correctamente, `_surface` admite `compras`, el topbar muestra “Compras” y los demás placeholders permanecen intactos.
**Superficies de edición permitidas:**

- `src/app/shell/AppShell.tsx`
- `tests/unit/appShell.test.tsx`
- `src/shared/keyboard/keyboardControllerContext.ts`
- `tests/architecture/keyboardBoundaries.test.ts` sólo si la prueba existente requiere la exclusión exacta de `compras.api.ts` auditada en U1A/U1B
- `tests/architecture/catalogHierarchyBoundaries.test.ts` para actualizar la guarda de destinos aprobados: U5 convierte Compras en el quinto `Link` real y la guarda debe permitir `/compras` sin dejar de rechazar rutas/placeholders de atributos y presentación

**Límite de rollback:** revertir sólo el bloque de navegación Compras, sus índices, derivación de superficie/título y pruebas U5; no retirar la ruta ni modificar otros enlaces del shell.

**RED**

- [x] Añadir pruebas fallidas del enlace a “/compras”, `data-spatial-id="sidebar.compras"`, índice 4 de Catálogo, superficie activa y etiqueta de topbar; fijar que Configuración y placeholders no cambian. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Reemplazar el `span` estático por el `Link` exacto del diseño, desplazar sólo los índices afectados y añadir la rama `compras` en la unión/superficie/topbar sin reordenar navegación. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar `pnpm test -- tests/unit/appShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` (si aplica) y `pnpm router:check`; verificar foco, Enter/Escape y navegación espacial mediante los mecanismos existentes. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Revisar el diff contra el placeholder original para asegurar que no hay cambios colaterales de shell; conservar el corte menor de 400 líneas y registrar el resultado real. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm test -- tests/unit/appShell.test.tsx tests/architecture/keyboardBoundaries.test.ts` según aplicabilidad; `pnpm router:check`.
**Runtime harness:** N/A — la navegación se valida con RTL, guardas y router check; el journey Playwright integral se reserva para U9 cuando el destino esté completo.

## U6A — Badge/token de estado de partida

**Objetivo:** cerrar únicamente `PartidaEstadoBadge` con la unión exacta `LinkStatus`, texto visible accesible y clases semánticas; autorizar los dos tokens warning necesarios y su mapeo Tailwind.

**Inicio:** staged U5 baseline; no existe el badge ni un equivalente warning autorizado.
**Fin:** el badge cubre los cuatro estados, `PENDIENTE` usa warning, `VINCULADO` reutiliza success, `NO_APLICA` reutiliza neutral y `CONFLICTO` reutiliza primary/danger-adjacent existente. No hay `CompraDetalleStage`, montaje/fetch de pantalla, linking ni U6B.
**Superficies exactas de edición permitidas (cinco paths):**

- `src/features/compras/PartidaEstadoBadge.tsx`
- `tests/unit/partidaEstadoBadge.test.tsx`
- `src/shared/design-system/tokens.css`
- `src/styles.css`
- `docs/design-system.md`

**Límite de rollback:** retirar el badge, su prueba y exclusivamente los dos tokens/mapeos/documentación warning; conservar staged U5 y no tocar `CompraDetalleStage`, `ComprasScreen`, U6B ni unidades posteriores.

**Audit previo:** confirmar y registrar que no existe warning equivalente en tokens, `styles.css` o `src/shared/ui/`; no crear `error` ni `info`.

**RED**

- [x] Crear primero `tests/unit/partidaEstadoBadge.test.tsx` y observar RED real de módulo ausente antes de escribir `PartidaEstadoBadge`; cubrir la unión exacta de cuatro estados, etiquetas visibles, nombre accesible y contratos semánticos. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar sólo `PartidaEstadoBadge` con clases Tailwind semánticas, badge inline compacto, `role="status"`, `aria-label` tipo `Estado: Pendiente`, sin hex/arbitrary values, iconos, CSS local, fetch ni montaje de pantalla; agregar/mapear/documentar sólo warning. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar el focused badge test y el test real de arquitectura Tailwind si existe tras descubrir su nombre exacto; verificar cuatro etiquetas, accesibilidad, clases distintas, token warning y ausencia de raw hex/arbitrary values en el componente. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir exactamente los cinco paths U6A contra el staged U5 baseline y mantenerlos por debajo de 400 líneas; registrar valores/purpose de tokens, `error`/`info` ausentes y no tocar U6B, `CompraDetalleStage`, montaje/fetch, U7 ni linking. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/partidaEstadoBadge.test.tsx` más el test de arquitectura Tailwind real si existe; `pnpm typecheck`; Prettier y diff acotados a los cinco paths.
**Runtime harness:** N/A — U6A es un componente presentacional aislado; RTL/Vitest y la guarda Tailwind, si existe, son la evidencia autorizada.

## U6B1 — Detalle documental y query (completada)

**Objetivo:** cerrar `CompraDetalleStage`, su carga autoritativa de compra/líneas y el binding exacto de Query, sin montar `ComprasScreen` ni iniciar U6B2/U7.

**Inicio:** U6A cerrada y sus cinco paths verificados.
**Fin:** detalle/query implementados, probados y refactorizados a menos de 400 líneas; el montaje de pantalla queda fuera aunque exista un worktree posterior.
**Superficies exactas:** `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx` y `tests/architecture/queryZodBoundaries.test.ts`.

**Límite de rollback:** retirar sólo el detalle, su prueba y su binding exacto de Query; conservar U6A y dejar intactos `ComprasScreen.tsx`/`tests/unit/comprasScreen.test.tsx`.

**RED**

- [x] Preservar la RED real ya observada al crear `tests/unit/compraDetalleStage.test.tsx` antes del módulo; cubrir carga de compra/líneas, campos originales read-only, strings de ids/montos, metadatos XML, separación visual/semántica de relación, los cuatro badges y el binding exacto de `useQuery`. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar `CompraDetalleStage` y su query sólo después de cerrar U6A, con componentes compartidos y formato en el borde de render; no montar la pantalla ni iniciar linking o acciones U7/U8. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar focused detail/badge/query tests y la regresión de pantalla sin modificar sus paths; verificar accesibilidad, foco, strings, campos no editables, precisión, relación separada y ausencia de matching local. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Refactorizar sólo componente/test con helpers de tablas y aserciones existentes preservadas; medir el delta exacto de tres paths en **389 líneas** (215 componente + 172 test + 2 guard tras la remediación del supplierId), estrictamente menor de 400 y sin excepción. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/unit/comprasScreen.test.tsx tests/architecture/queryZodBoundaries.test.ts`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx tests/architecture/queryZodBoundaries.test.ts src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx`; `git diff --check`.
**Runtime harness:** N/A — U6B1 no tiene jornada browser independiente; RTL/Vitest, Query boundary, typecheck, Prettier y diff son la evidencia autorizada.

## U6B2 — Montaje de pantalla (pendiente)

**Objetivo:** verificar y entregar por separado el montaje de `CompraDetalleStage` en `ComprasScreen`, la selección/back/reset de pantalla y su regresión.

**Inicio:** U6B1 cerrada; el worktree ya contiene cambios de `ComprasScreen.tsx` y `tests/unit/comprasScreen.test.tsx`, pero no cuentan como verificados ni staged para U6B2.
**Fin:** pendiente hasta ejecutar su propia RED/GREEN/TRIANGULATE/REFACTOR contra el baseline correcto y completar el staging posterior autorizado por el ciclo de entrega.
**Superficies exactas:** `src/features/compras/ComprasScreen.tsx` y `tests/unit/comprasScreen.test.tsx`.

**Límite de rollback:** independiente de U6B1; no editar ni retirar esos dos paths durante el cierre de U6B1.

**RED**

- [x] Añadir/confirmar la RED específica de montaje, selección, back, reset por proveedor y ausencia de fetch antes de selección; no reutilizar la evidencia U6B1 como evidencia U6B2. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Verificar y entregar el montaje existente sólo en los dos paths U6B2, sin tocar `CompraDetalleStage`, el guard de Query ni el badge. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar de forma independiente la regresión de pantalla, typecheck, Prettier y diff/staging autorizado; registrar resultados reales. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener U6B2 separada de U6B1, por debajo de 400 líneas y sin declarar completitud por la mera presencia de cambios en el worktree. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/comprasScreen.test.tsx`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx`; `git diff --check`.
**Runtime harness:** N/A — U6B2 requiere verificación RTL/Vitest y los gates de staging del ciclo padre; no se afirma completitud en U6B1.

## U7A1 — Selección standalone de recurso

**Objetivo:** implementar sólo el dialog standalone que permite seleccionar explícitamente un Recurso Maestro para un `supplierProductId` ya conocido; no monta la acción en el detalle ni muta relaciones.

**Inicio:** U6B2 muestra relaciones y estados, pero no ofrece una superficie standalone de selección.
**Fin:** el dialog exige `supplierProductId: string` no nulo y lo muestra junto al proveedor, abre lecturas `ACTIVE` sólo mientras está abierto, limita cada ventana a 20, reemplaza páginas mediante Previous/Next según flags autoritativos, muestra `identityV1` + ID sin inferencia/matching y confirma la selección localmente mediante el callback estrecho `onResourceSelected`. No llama link/unlink/link-status, no usa actor ni estados de mutación, no crea productos y no muestra optimismo.
**Superficies exactas de edición permitidas:**

- `src/features/compras/VincularPartidaSurface.tsx`
- `tests/unit/vincularPartidaSurface.test.tsx`

**Límite de rollback:** retirar sólo la selección standalone y su prueba; conservar U6B2 y dejar `CompraDetalleStage`/su prueba byte-for-byte sin cambios.

**RED**

- [x] Crear primero `tests/unit/vincularPartidaSurface.test.tsx` y preservar el RED real de módulo ausente del intento combinado, reescribiendo las aserciones a U7A1: ventana diferida ACTIVE/20, contexto visible, selección explícita, paginación de reemplazo, estados loading/empty/error/retry, StrictMode/unmount y foco; sin reclamar cobertura de mutación. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar sólo `VincularPartidaSurface` con `supplierProductId: string`, `ResourcesMasterRestReadApi` y `onResourceSelected` inyectados; reutilizar `StagedSearchSelector<Resource>` con load-more suprimido, controles Previous/Next explícitos, Dialog/Button y foco existente, sin facades ni matching. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx` y confirmar selección explícita, display truthful `identityV1` + ID, reemplazo de páginas, flags, loading/empty/initial/navigation error/retry, ausencia de acumulación/load-more y lectura sólo al abrir; no ejecutar ni reclamar cobertura de mutación. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir exactamente los dos paths U7A1 contra el staged U6B2 baseline y mantener el delta estrictamente menor de 400 líneas; el resultado es 399 líneas, sin editar `CompraDetalleStage.tsx` ni `tests/unit/compraDetalleStage.test.tsx`. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/VincularPartidaSurface.tsx tests/unit/vincularPartidaSurface.test.tsx`; `git diff --check` equivalente para los dos paths no indexados.
**Runtime harness:** N/A — U7A1 es una superficie aislada; Vitest/RTL y la regresión RestWindow son la evidencia autorizada.

## U7A2 — Mutación confirmada de vínculo (completada)

**Objetivo:** añadir, sobre los mismos dos paths U7A1, exclusivamente la mutación actor-gated de vínculo y su confirmación autoritativa; no montar el dialog en el detalle.

**Inicio:** U7A1 cerrada con una selección explícita observable; no hay prop ni código de mutación en la superficie.
**Fin:** `linkSupplierProduct` queda incorporado sólo en U7A2 con busy/dismiss/unmount/error safety y espera de confirmación estrecha antes de cerrar. U7A2 no adelanta U7B, unlink, `NO_APLICA` ni cambios de detalle.
**Superficies exactas futuras:**

- `src/features/compras/VincularPartidaSurface.tsx`
- `tests/unit/vincularPartidaSurface.test.tsx`

**Límite de rollback:** retirar sólo la mutación y sus aserciones; conservar intacta la selección U7A1 y su regresión de ventana.

**RED**

- [x] Añadir pruebas fallidas de `linkSupplierProduct` exacto con `{ id: supplierProductId, resourceId }`, actor, busy/dismiss/double guard, errores reintentables, unmount y espera de `onLinked` antes del cierre; no editar detalle ni reclamar cobertura U7A1 por estas pruebas. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar la mutación confirmada sólo después de cerrar U7A1, conservando la selección explícita, sin creación, matching, optimismo, unlink, `NO_APLICA` ni montaje en detalle. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar el focused U7A2 con la regresión U7A1 y confirmar respuestas, errores accesibles, actor y cierre sólo después de `onLinked`; no iniciar U7B. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener el mismo límite de dos paths y un delta U7A2 estrictamente menor de 400 líneas sobre U7A1, sin tocar `CompraDetalleStage.tsx` ni su prueba. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/VincularPartidaSurface.tsx tests/unit/vincularPartidaSurface.test.tsx`; `git diff --check`.
**Runtime harness:** N/A — la superficie aislada se verificó con RTL/Vitest; no se creó backend ni fixture runtime.

## U7B — Montaje condicional de vinculación en detalle (completada)

**Objetivo:** montar la superficie U7A1/U7A2 únicamente para partidas cuyo `supplierProductId` ya sea no nulo y conservar bloqueada la resolución para IDs nulos.

**Inicio:** U7A1 y U7A2 cerradas; `CompraDetalleStage` y su prueba parten del baseline U6B2.
**Fin:** el detalle muestra la acción sólo con `supplierProductId: string` y estado `PENDIENTE`/`CONFLICTO`, no ofrece selector ni acción para `null`, `VINCULADO` o `NO_APLICA`, y conserva el contrato de callbacks/relectura posterior.
**Superficies exactas futuras:**

- `src/features/compras/CompraDetalleStage.tsx`
- `tests/unit/compraDetalleStage.test.tsx`

**Límite de rollback:** retirar sólo el montaje condicional y sus aserciones; conservar la selección U7A1, la mutación U7A2 y la presentación U6.

**RED**

- [x] Añadir pruebas fallidas de montaje condicionado: producto identificado muestra la acción U7A1/U7A2; `supplierProductId: null` no muestra selector/recurso ni usa `link-status` como sustituto. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Montar U7A1/U7A2 en `CompraDetalleStage` sólo cuando el `supplierProductId` sea string no nulo; no cambiar campos documentales, queries U6B1/U6B2 ni iniciar U8. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar la prueba de detalle y las regresiones U6B1/U6B2, confirmando las condiciones nullable sin editar superficies fuera de U7B. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir sólo los dos paths U7B, conservar U7A1/U7A2 intactas y mantener el corte menor de 400 líneas. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts`; `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/CompraDetalleStage.tsx tests/unit/compraDetalleStage.test.tsx`; `git diff --check`.
**Runtime harness:** N/A — el detalle y la superficie se verifican con RTL/Vitest; no se creó backend ni fixture runtime.

## U8A — Confirmación standalone de desvinculación

**Objetivo:** implementar únicamente la superficie standalone de unlink contra el baseline U7B staged; U8A no toca `CompraDetalleStage`, `NO_APLICA` ni U9.

**Inicio:** U7B monta la vinculación confirmada para un `supplierProductId` no nulo, pero no expone desvinculación.
**Fin:** `DesvincularPartidaSurface` exige un contexto `supplierProductId: string`, llama al adapter inyectado sólo después de confirmación explícita, espera `onUnlinked(updated)` antes de cerrar y no inventa estados locales. Actor, backend y errores genéricos mantienen el diálogo abierto y reintentable.
**Superficies exactas de edición permitidas:**

- `src/features/compras/DesvincularPartidaSurface.tsx`
- `tests/unit/desvincularPartidaSurface.test.tsx`

**Límite de rollback:** retirar sólo la superficie standalone de unlink, su prueba y este bookkeeping; conservar `CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`, U8B, U8C y U9.

**RED**

- [x] Crear primero `tests/unit/desvincularPartidaSurface.test.tsx` y observar el RED real de módulo ausente; cubrir ID exacto, cancelación/abrir sin llamada, confirmación, errores reintentables, busy/dismiss/duplicate, callback autoritativo, StrictMode/unmount y foco. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar sólo `DesvincularPartidaSurface` con `unlinkSupplierProduct({ id: supplierProductId })`, confirmación explícita, callback `onUnlinked(updated)` awaited y guardas de montaje; no llamar link-status, matching, creación, ni mutar badge/recurso local. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar la regresión enfocada de unlink/API/link y verificar errores de actor, backend y genéricos accesibles, reintento, ausencia de optimismo y cierre posterior a la relectura/callback. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir exactamente los dos paths U8A contra el baseline U7B staged, mantener el delta estrictamente menor de 400 líneas, ejecutar typecheck/Prettier/diff y conservar el índice sin cambios. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/desvincularPartidaSurface.test.tsx tests/unit/comprasApiMutations.test.ts tests/unit/vincularPartidaSurface.test.tsx tests/unit/compraDetalleStage.test.tsx`.
**Quality commands:** `pnpm typecheck`; `pnpm exec prettier --check src/features/compras/DesvincularPartidaSurface.tsx tests/unit/desvincularPartidaSurface.test.tsx`; `git diff --check`.
**Runtime harness:** N/A — la superficie standalone se verifica con RTL/Vitest y regresión del adapter/link; no se crea backend ni fixture runtime.

## U8B — Acción standalone `NO_APLICA`

**Objetivo:** implementar después de cerrar U8A la acción standalone `NO_APLICA` mediante `link-status`; U8B no toca `CompraDetalleStage`, unlink ni U9.

**Superficies exactas futuras:**

- `src/features/compras/MarcarNoAplicaAction.tsx`
- `tests/unit/marcarNoAplicaAction.test.tsx`

**Límite de rollback:** retirar sólo la acción `NO_APLICA` standalone y su prueba; conservar U8A, U7B y el detalle sin montaje U8C.

**RED**

- [x] Escribir primero `tests/unit/marcarNoAplicaAction.test.tsx` con casos de producto presente/ausente, confirmación, actor, busy, errores reintentables y ausencia de link/unlink; no iniciar U8C. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar `MarcarNoAplicaAction` con `setPurchaseLineLinkStatus({ id, status: 'NO_APLICA' })`, sin inventar relaciones ni estados locales. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar su prueba y la regresión API, verificando confirmación explícita, callback autoritativo y errores accesibles. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Mantener U8B en sus dos paths y bajo 400 líneas; no editar el detalle hasta U8C. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/marcarNoAplicaAction.test.tsx tests/unit/comprasApiMutations.test.ts`.

## U8C — Montaje de acciones en detalle

**Objetivo:** montar unlink y `NO_APLICA` en `CompraDetalleStage` únicamente después de cerrar U8A y U8B, respetando la tabla de estados y la relación nullable.

**Superficies exactas futuras:**

- `src/features/compras/CompraDetalleStage.tsx`
- `tests/unit/compraDetalleStage.test.tsx`

**Límite de rollback:** retirar sólo el montaje y sus pruebas U8C; conservar las superficies standalone U8A/U8B y la presentación U6/U7.

**RED**

- [x] Añadir primero pruebas de condiciones de montaje: unlink sólo para `VINCULADO` con producto, `NO_APLICA` donde la semántica lo admite, y ausencia de acciones inventadas para `CONFLICTO`/producto nulo. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Montar las acciones standalone y conectar únicamente callbacks de relectura autoritativa; no cambiar datos documentales ni inventar transición local `VINCULADO`→`PENDIENTE`. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar la regresión del detalle, unlink, `NO_APLICA` y link, confirmando condiciones y ausencia de llamadas de estado no autorizadas. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Medir los dos paths U8C bajo 400 líneas; conservar U8A/U8B byte-estables y registrar el diff exacto. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm exec vitest run tests/unit/compraDetalleStage.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx`.

## U9 — Superficie informativa de pendientes y gates finales

**Objetivo:** integrar la superficie bloqueada de Partidas pendientes y cerrar la verificación completa sin simular una bandeja transversal.

**Inicio:** U1A-U8 están completos y Compras permite resolver partidas desde el historial por proveedor; falta comunicar G2 dentro de la pantalla.
**Fin:** la sección/tab informa la ausencia de endpoint cross-compra, orienta al historial del proveedor y no hace red; todos los gates finales y el Playwright relevante quedan definidos y ejecutados/registrados por quien aplica.
**Superficies de edición permitidas:**

- `src/features/compras/PartidasPendientesBlockedSurface.tsx`
- `tests/unit/partidasPendientesBlockedSurface.test.tsx`
- `src/features/compras/ComprasScreen.tsx` únicamente para integrar la sección/tab
- `tests/unit/comprasScreen.test.tsx` únicamente para esa integración
- `tests/e2e/compras.spec.ts`

**Límite de rollback:** retirar la superficie, integración y pruebas U9; mantener disponible la ruta “/compras”, historial, detalle y acciones U1A-U8 sin presentar pendientes transversales.

**RED**

- [x] Añadir pruebas fallidas de texto informativo, `role="status"`/live region, orientación al historial del proveedor, ausencia de llamadas de red y ausencia de resultados parciales; preparar el escenario Playwright de Compras. <!-- sdd-owner: implementation -->

**GREEN**

- [x] Implementar la superficie puramente presentacional y su tab/sección dentro de `ComprasScreen`, sin ruta/sidebar adicional, barrido de proveedores, paginación falsa ni estado local que aparente completitud. <!-- sdd-owner: implementation -->

**TRIANGULATE**

- [x] Ejecutar `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`, `pnpm exec playwright test tests/e2e/compras.spec.ts` y `pnpm router:check`; comprobar el journey por proveedor, importación, detalle y resolución con backend/harness autorizado. <!-- sdd-owner: implementation -->

**REFACTOR**

- [x] Ejecutar y registrar los gates finales `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm exec playwright test tests/e2e/compras.spec.ts`; corregir sólo dentro de las superficies U1A-U9 y conservar cada corte menor de 400 líneas. <!-- sdd-owner: implementation -->

**Focused commands:** `pnpm test -- tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/comprasScreen.test.tsx`; `pnpm router:check`; `pnpm exec playwright test tests/e2e/compras.spec.ts`.
**Final quality gates:** `pnpm test`; `pnpm typecheck`; `pnpm lint`; `pnpm format:check`; `pnpm build`; `pnpm router:check`; `pnpm exec playwright test tests/e2e/compras.spec.ts`. Los resultados definitivos observados están registrados en `apply-progress.md`; la fila completada acredita ejecución y registro, no que todos los gates hayan pasado.
**Runtime harness:** `pnpm exec playwright test tests/e2e/compras.spec.ts` contra el harness de aplicación/API existente y autorizado; si ese harness no puede suministrar respuestas contractuales deterministas, registrar exactamente `N/A — no existe backend/fixture autorizado para ejecutar el flujo REST de Compras` y conservar las pruebas Vitest/RTL como evidencia, sin crear fixtures runtime.

## Acciones de parent antes y después de apply

- [x] Resolver con una persona responsable la estrategia de cadena antes de aplicar U1: el usuario confirmó `feature-branch-chain` el 2026-09-19, manteniendo `ask-on-risk` y sin declarar `size:exception`; no se autorizó crear ramas, commits, pushes ni PRs. <!-- sdd-owner: parent -->
- [x] Iniciar un bounded review por cada unidad aplicada, verificando diff autoral menor de 400 líneas, rollback independiente, comandos reales y evidencia runtime antes de avanzar a la siguiente unidad. <!-- sdd-owner: parent -->
- [x] Ejecutar el gate de entrega final sólo después de U9 y conservar resultados honestos de todos los comandos, sin convertir una verificación no ejecutada en aprobación. <!-- sdd-owner: parent -->

# Remediación posterior a verify FAIL

**Estado:** plan reabierto, sin aplicar. La entrada de autoridad es `openspec/changes/compras-partidas-vinculacion/verify-report.md` con SHA-256 `dfde59eeb583ede14f6baa2c9dc02b1a96ab7ecf0fc25bd51657fd01e27ca034`. Esta reapertura sólo modifica este `tasks.md`; no modifica source, tests, `verify-report.md`, ramas, commits, staging, push ni PR.

## Diseño acotado de remediación

- Alcance: corregir F1–F4 y reconciliar honestamente F5; no reabrir requisitos ya PASS ni convertir G2/G3 en contratos inventados.
- Orden estricto: R1A → R1B → R1C → R1D → R1E → R2A → R2B → R3A → R3B → R2C → R4 → R1F.
- Cada slice parte del baseline staged vigente, usa exclusivamente sus paths permitidos, abre con RED fresca para el comportamiento nuevo, verifica de forma independiente, queda por debajo de 400 líneas autorales y sólo después permite que el parent stagee sus source/tests exactos; los artefactos OpenSpec permanecen unstaged. No se permite comprimir pruebas, borrar evidencia ni usar `size:exception`.
- R1F remedia exclusivamente F6: el StrictMode real debe conservar feedback de importación creada/ya existente sólo después de la reread autoritativa, sin alterar la lógica de R1B ni ampliar endpoints o superficies.
- R1A debe hacer que las ventanas de compras/productos y la query de detalle rechacen una relectura fallida, en vez de tratar `refetch()` resuelto con `status: error` como éxito.
- R1B–R1E deben releer sólo después de que la mutación confirmada termine; un fallo de relectura conserva un mensaje honesto de confirmación pendiente/reintentable y nunca repite la mutación.
- R2A debe leer cada `SupplierProduct` no nulo una sola vez por `id` único, mostrar `Partida → Producto de Proveedor → resourceId`, y releer la relación. No se resolverá nombre de recurso: no existe endpoint autorizado de recurso por `resourceId`.
- R2B debe explicar junto a `supplierProductId: null` que falta la operación contractual para asociar la partida a un Producto de Proveedor existente; no debe ofrecer selección de recurso ni usar `VINCULADO` como sustituto.
- R3A/R3B deben exponer inspección acotada al proveedor confirmado con la ventana existente y `StagedSearchSelector`, paginación por reemplazo y selección explícita; seleccionar un producto sólo inspecciona y no asocia la partida.
- R4 no fabrica RED retroactiva para U7A2. Sólo registra la evidencia fresca de remediación, conserva la limitación histórica y deja explícito si hace falta aceptación de desviación de evidencia antes de reverify.

## Progreso de remediación

- Remediación registrada: R1A–R3B y las filas de implementación de R4 constan marcadas; el cierre parent de R4 permanece pendiente y R2C añade 4/6 filas marcadas (las dos restantes son parent-owned). R1F queda planificada como el último slice acotado.
- F1–F6 permanecen abiertos hasta que sus slices tengan RED/GREEN/TRIANGULATE/REFACTOR, verificación parent y evidencia de reverify correspondiente.
- La estrategia se conserva como `ask-on-risk` con `feature-branch-chain`; el agregado es High aunque cada slice debe ser Low y estrictamente menor de 400 líneas.
- Gate pendiente: antes de apply, el parent debe confirmar la secuencia encadenada; antes de reverify, debe decidir explícitamente si acepta una desviación de evidencia F5. No se infiere una excepción.

## R1A — Contratos de relectura autoritativa para ventanas y detalle (F4)

**Dependencia:** baseline actual del candidato; no requiere R1B–R1E. **Fin:** `useSupplierPurchasesRestWindow`, `useSupplierProductsRestWindow` y `CompraDetalleStage` distinguen una relectura exitosa de una respuesta de Query con error y exponen rechazo/reintento honesto. **Rollback:** retirar sólo estas tres correcciones y sus pruebas.

**Paths exactos permitidos:** `src/features/compras/useSupplierPurchasesRestWindow.ts`, `tests/unit/useSupplierPurchasesRestWindow.test.tsx`, `src/features/compras/useSupplierProductsRestWindow.ts`, `tests/unit/useSupplierProductsRestWindow.test.tsx`, `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para cada contrato de relectura fallida y para conservar el estado reintentable; ejecutar los tres tests antes de editar producción. <!-- sdd-owner: implementation -->
- [x] Implementar el rechazo/estado de error autoritativo en las dos ventanas y la query de detalle sin mutar datos optimistas ni ampliar otros paths. <!-- sdd-owner: implementation -->
- [x] Triangular de forma independiente relectura exitosa, `status: error` resuelto por TanStack Query, retry y desmontaje; registrar el comando enfocado. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los seis paths, medir el delta contra el baseline staged y dejar R1A estrictamente menor de 400 líneas. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R1A, comprobar sus seis paths y stagear únicamente el slice después de confirmar el límite y la evidencia RED/GREEN. <!-- sdd-owner: parent -->
- [x] Preparar R1A para reverify de F4 sin editar todavía `verify-report.md` ni convertir el resultado aislado en PASS global. <!-- sdd-owner: parent -->

## R1B — Importación confirmada y retry exclusivo de relectura (F4)

**Dependencia:** R1A cerrada. **Fin:** una importación 201/200 confirmada separa confirmación de relectura; el fallo de relectura no publica “historial actualizado”, deja feedback honesto y permite reintentar sólo la lectura. **Rollback:** retirar sólo la conducta de retry y sus aserciones, conservando la confirmación de importación.

**Paths exactos permitidos:** `src/features/compras/ImportarCompraSurface.tsx`, `src/features/compras/ComprasScreen.tsx`, `tests/unit/importarCompraSurface.test.tsx`, `tests/unit/comprasScreen.test.tsx`.

- [x] Crear RED fresca para relectura fallida después de 201/200, retry sin reenvío multipart, copy honesto y cierre sólo tras el contrato definido; ejecutar tests antes de producción. <!-- sdd-owner: implementation -->
- [x] Implementar el flujo confirmado→relectura→retry en los cuatro paths, sin repetir la mutación ni anunciar historial actualizado antes de una relectura exitosa. <!-- sdd-owner: implementation -->
- [x] Triangular 201, 200 `alreadyExisted`, error de relectura, retry exitoso, proveedor no vigente y desmontaje; verificar que no se reenvía el archivo. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los cuatro paths y medir R1B por debajo de 400 líneas contra el baseline resultante de R1A. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R1B y stagear sólo sus cuatro paths después de comprobar confirmación, retry exclusivo de lectura y copy honesto. <!-- sdd-owner: parent -->
- [x] Preparar R1B para reverify de F4 conservando el verify-report fallido sin editarlo y registrando cualquier gate pendiente. <!-- sdd-owner: parent -->

## R1C — Link con confirmación y reread reintentable (F4)

**Dependencia:** R1B cerrada. **Fin:** `linkSupplierProduct` sólo se ejecuta una vez; tras confirmación se relee producto/relación y las partidas afectadas, con retry únicamente de reread y copy honesto ante fallo. **Rollback:** retirar sólo el contrato de reread/retry de link y sus pruebas.

**Paths exactos permitidos:** `src/features/compras/VincularPartidaSurface.tsx`, `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/vincularPartidaSurface.test.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para link confirmado seguido de reread fallido, retry sin segunda mutación, busy/dismiss y mensaje honesto; ejecutar tests antes del source. <!-- sdd-owner: implementation -->
- [x] Implementar link confirmado→reread→retry en los cuatro paths, manteniendo selección explícita, actor y ausencia de optimismo. <!-- sdd-owner: implementation -->
- [x] Triangular respuesta confirmada, error de reread, retry exitoso, error de mutación, doble submit, Escape y unmount. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo esos paths y verificar que el delta R1C es estrictamente menor de 400 líneas desde el baseline R1B. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R1C y stagear sólo sus paths después de confirmar que no se repite link ante un fallo de lectura. <!-- sdd-owner: parent -->
- [x] Preparar R1C para reverify de F4 sin declarar resuelta F1 hasta completar R2A. <!-- sdd-owner: parent -->

## R1D — Unlink con confirmación y reread reintentable (F4)

**Dependencia:** R1C cerrada. **Fin:** `unlinkSupplierProduct` sólo se ejecuta una vez y su estado/cascada se muestra únicamente después de reread exitoso o retry explícito de reread. **Rollback:** retirar sólo la conducta de reread/retry de unlink y sus pruebas.

**Paths exactos permitidos:** `src/features/compras/DesvincularPartidaSurface.tsx`, `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/desvincularPartidaSurface.test.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para unlink confirmado con reread fallido, retry exclusivo de lectura, copy honesto y no repetición de POST; ejecutar tests antes de producción. <!-- sdd-owner: implementation -->
- [x] Implementar unlink confirmado→reread→retry en los cuatro paths, conservando backend como autoridad para `VINCULADO`→`PENDIENTE`. <!-- sdd-owner: implementation -->
- [x] Triangular confirmación, fallo/retry de reread, cancelación, busy, error de mutación, doble submit y unmount. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo esos paths y dejar R1D por debajo de 400 líneas contra el baseline R1C. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R1D y stagear sólo sus paths tras comprobar ausencia de transición optimista y ausencia de POST duplicado. <!-- sdd-owner: parent -->
- [x] Preparar R1D para reverify de F4 y conservar explícitamente cualquier limitación de cobertura residual. <!-- sdd-owner: parent -->

## R1E — NO_APLICA con reread reintentable (F4)

**Dependencia:** R1D cerrada. **Fin:** `setPurchaseLineLinkStatus({ status: 'NO_APLICA' })` sólo se ejecuta una vez; la UI relee después de confirmación, permite reintentar sólo la lectura y comunica que no aplica sin inventar relación. **Rollback:** retirar sólo esta conducta y sus pruebas.

**Paths exactos permitidos:** `src/features/compras/MarcarNoAplicaAction.tsx`, `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/marcarNoAplicaAction.test.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para NO_APLICA confirmado con reread fallido, retry sin segundo status POST, copy honesto y control busy; ejecutar antes de producción. <!-- sdd-owner: implementation -->
- [x] Implementar NO_APLICA confirmado→reread→retry en los cuatro paths, preservando la matriz nullable y la autoridad backend. <!-- sdd-owner: implementation -->
- [x] Triangular producto presente/ausente, confirmación, error de mutation, error/retry de reread, doble submit, cancelación y unmount. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo esos paths y dejar R1E estrictamente menor de 400 líneas contra el baseline R1D. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R1E y stagear sólo sus paths tras confirmar que el retry jamás repite la mutación. <!-- sdd-owner: parent -->
- [x] Preparar R1E para reverify de F4 y conservar copy que distinga confirmación de mutación y confirmación de lectura. <!-- sdd-owner: parent -->

## R2A — Inspección autoritativa de SupplierProducts y cadena visible (F1)

**Dependencia:** R1A–R1E cerradas. **Fin:** el detalle consulta sólo los `supplierProductId` no nulos y únicos, muestra Producto de Proveedor → `resourceId`, y relee esa relación junto con las líneas después de callbacks confirmados. No se inventa nombre de recurso porque no existe endpoint get-by-resource-ID. **Rollback:** retirar sólo lecturas/dedupe/presentación de relación y sus pruebas.

**Paths exactos permitidos:** `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para GET de cada SupplierProduct único, cadena visible hasta `resourceId`, ausencia de consulta para null/duplicado y reread posterior; ejecutar antes de producción. <!-- sdd-owner: implementation -->
- [x] Implementar las lecturas únicas y la zona de relación diferenciada, mostrando sólo datos publicados del producto y `resourceId`, sin endpoint ni nombre de recurso inventado. <!-- sdd-owner: implementation -->
- [x] Triangular múltiples partidas con el mismo producto, productos sin `resourceId`, errores iniciales/de reread, estados de carga y callbacks de link/unlink/status. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los dos paths y mantener R2A estrictamente menor de 400 líneas contra el baseline R1E. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R2A y stagear únicamente sus dos paths después de comprobar deduplicación, cadena visible y ausencia de endpoint inventado. <!-- sdd-owner: parent -->
- [x] Preparar R2A para reverify de F1 sin afirmar todavía que F2 o G3 estén cubiertos. <!-- sdd-owner: parent -->

## R2B — Explicación contractual nullable G3 (F3)

**Dependencia:** R2A cerrada. **Fin:** toda partida con `supplierProductId: null` muestra explicación contractual contextual, conserva sólo las acciones permitidas y nunca aparenta vínculo. **Rollback:** retirar únicamente copy, estado accesible y pruebas de G3.

**Paths exactos permitidos:** `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

- [x] Crear RED fresca para la explicación G3 junto a partidas nullable y para la ausencia de selector/recurso/VINCULADO sustitutivo; ejecutar antes de editar producción. <!-- sdd-owner: implementation -->
- [x] Implementar copy honesto que explique la ausencia de operación Partida→Producto de Proveedor, sin crear controles, endpoints ni asociación local. <!-- sdd-owner: implementation -->
- [x] Triangular nullable PENDIENTE/CONFLICTO/NO_APLICA, acción NO_APLICA cuando el contrato la admite, región accesible y ausencia de selector de recurso. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los dos paths y dejar R2B estrictamente menor de 400 líneas contra el baseline R2A. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R2B y stagear sólo sus dos paths tras comprobar la explicación contractual y el bloqueo observable. <!-- sdd-owner: parent -->
- [x] Preparar R2B para reverify de F3 y registrar G3 como límite contractual, no como fallo que se resuelve en frontend. <!-- sdd-owner: parent -->

## R3A — Stage de inspección de Productos de Proveedor (F2)

**Dependencia:** R2A/R2B cerradas. **Fin:** existe un stage reutilizable que usa `useSupplierProductsRestWindow` acotado al proveedor confirmado y `StagedSearchSelector`/paginación, exige selección explícita y sólo inspecciona; no asocia la partida ni confirma por SKU/descripción. **Rollback:** retirar el stage y su prueba sin tocar el montaje R3B.

**Paths exactos permitidos:** `src/features/compras/InspeccionarProductoProveedorStage.tsx`, `tests/unit/inspeccionarProductoProveedorStage.test.tsx`.

- [x] Crear RED fresca del stage para ventana por proveedor, `StagedSearchSelector`, paginación por reemplazo, selección explícita y callback sin asociación; ejecutar antes del componente. <!-- sdd-owner: implementation -->
- [x] Implementar el stage con la ventana existente, identidad/producto visible, controles de paginación autoritativos y callback de inspección que no llama link/link-status ni crea productos. <!-- sdd-owner: implementation -->
- [x] Triangular proveedor ausente, initial/navigation loading/error/retry, páginas, selección, SKU coincidente sin asociación, reemplazo y unmount. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los dos paths y mantener R3A estrictamente menor de 400 líneas contra el baseline R2B. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R3A y stagear sólo sus dos paths después de comprobar acotación, selección explícita y ausencia de mutación. <!-- sdd-owner: parent -->
- [x] Preparar R3A para reverify de F2 sin presentar el stage como asociación automática de partidas nullable. <!-- sdd-owner: parent -->

## R3B — Montaje para proveedor confirmado (F2)

**Dependencia:** R3A cerrada. **Fin:** `ComprasScreen` monta el stage sólo con proveedor confirmado, conserva el historial acotado y no ofrece recorrido sin contexto. **Rollback:** retirar sólo el montaje y su integración de pantalla.

**Paths exactos permitidos:** `src/features/compras/ComprasScreen.tsx`, `tests/unit/comprasScreen.test.tsx`.

- [x] Crear RED fresca de montaje con proveedor confirmado, ausencia sin proveedor, reset/cambio de proveedor y no asociación; ejecutar antes de editar pantalla. <!-- sdd-owner: implementation -->
- [x] Montar `InspeccionarProductoProveedorStage` únicamente con el supplier confirmado, sin barrido global, asociación automática ni cambio de contrato de G3. <!-- sdd-owner: implementation -->
- [x] Triangular montaje, cambio de proveedor, ausencia de red sin contexto, paginación delegada y selección que no llama mutaciones. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los dos paths y dejar R3B estrictamente menor de 400 líneas contra el baseline R3A. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify de R3B y stagear sólo sus dos paths después de confirmar el contexto de proveedor y la ausencia de asociación. <!-- sdd-owner: parent -->
- [x] Preparar R3B para reverify de F2 y conservar la limitación de G3 en la evidencia de integración. <!-- sdd-owner: parent -->

## R2C — Cobertura explícita de metadatos técnicos inmutables (supplierId stale)

**Dependencia:** R2B, R3A y R3B cerradas. **Fin:** la cobertura fresca demuestra que el detalle hace visibles y no editables `Purchase.id`, `Purchase.supplierId`, `Purchase.createdAt`, `Purchase.updatedAt` y, para cada partida, `PurchaseLine.id` y `PurchaseLine.purchaseId`; conserva los campos documentales/XML y sus representaciones string sin duplicar la UI existente. La omisión reportada de `supplierId` es stale: `CompraDetalleStage.fields` ya renderiza `purchase.supplierId`, pero faltaba una aserción explícita. **Rollback:** retirar únicamente esta cobertura y cualquier ajuste acotado del detalle que sea estrictamente necesario.

**Paths exactos permitidos:** `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx`.

**Límites:** presentar los metadatos técnicos de forma accesible, usando el Design System existente y una zona/columnas técnicas separadas si hace falta para no volver ilegible la tabla documental principal. No agregar inputs, mutaciones, endpoints, DTOs, cálculos, matching, stores ni trabajo de Convex. Mantener el delta autoral de estos dos paths estrictamente menor de 400 líneas.

- [x] Crear y ejecutar RED fresca que aserte explícitamente la visibilidad, no edición y representación string de `Purchase.id`, `Purchase.supplierId`, `Purchase.createdAt` y `Purchase.updatedAt`, además de `PurchaseLine.id` y `PurchaseLine.purchaseId` para **todas** las partidas del fixture; mantener aserciones de campos/XML documentales existentes y no duplicar una UI ya presente. <!-- sdd-owner: implementation -->
- [x] Implementar sólo el ajuste necesario en `CompraDetalleStage.tsx`: conservar `purchase.supplierId` ya renderizado, organizar los metadatos técnicos accesiblemente con primitivas DS existentes si la legibilidad lo requiere y no cambiar campos documentales/XML ni sus strings. <!-- sdd-owner: implementation -->
- [x] Triangular el detalle con múltiples líneas, comprobando cada `id`/`purchaseId`, ausencia de `input`, `select` y `contenteditable`, separación legible de metadatos técnicos frente a la tabla primaria, y ausencia de fetch/endpoint/mutación/DTO/cálculo/Convex nuevo. <!-- sdd-owner: implementation -->
- [x] Ejecutar de forma enfocada la regresión de detalle y los checks de typecheck, lint, format y diff sólo sobre los dos paths; confirmar que la aserción nueva de `supplierId` añade cobertura sin duplicar UI y medir un delta exacto menor de 400 líneas. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify independiente de R2C contra el baseline posterior a R3B, revisar exactamente `src/features/compras/CompraDetalleStage.tsx` y `tests/unit/compraDetalleStage.test.tsx`, y stagear selectivamente sólo esos dos paths; mantener OpenSpec unstaged. <!-- sdd-owner: parent -->
- [x] Mantener la reverify final bloqueada hasta cerrar R2C y completar el cierre parent de R4; no editar `verify-report.md`, no iniciar otro slice y no crear commit, branch, push o PR. <!-- sdd-owner: parent -->

## R4 — Reconciliación honesta de evidencia strict-TDD (F5)

**Dependencia:** R1A–R3B y R2C verificadas. **Fin:** `apply-progress.md` conserva que la RED histórica de U7A2 fue combinada/incompleta, registra sólo RED fresca de R1–R3 y R2C para comportamiento nuevo y declara si la desviación de evidencia F5 necesita aceptación explícita antes de reverify. **Rollback:** retirar únicamente la nueva anotación de remediación en progreso; nunca reescribir `verify-report.md`.

**Path exacto permitido:** `openspec/changes/compras-partidas-vinculacion/apply-progress.md`.

- [x] Revisar la evidencia existente sin fabricar RED retroactiva; clasificar cada RED fresca de R1–R3 como comportamiento de remediación y dejar F5 abierto hasta reconciliación. <!-- sdd-owner: implementation -->
- [x] Documentar en `apply-progress.md` los resultados reales de cada slice, sus límites y la decisión explícita sobre aceptación de desviación F5, sin editar el verify-report fallido. <!-- sdd-owner: implementation -->
- [x] Triangular la trazabilidad de RED→GREEN→verificación por slice, confirmar que no se borró evidencia histórica y preparar el paquete de reverify. <!-- sdd-owner: implementation -->
- [x] Refactorizar únicamente el registro de progreso para que sea auditable y conciso; no añadir source/tests ni declarar PASS por bookkeeping. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify final de R4, comprobar el registro de progreso y mantener todos los artefactos OpenSpec unstaged, sin tocar `verify-report.md` ni source/tests fuera de slices cerradas. <!-- sdd-owner: parent -->
- [x] Decidir y registrar antes de reverify si se acepta explícitamente la desviación F5; si no hay aceptación, mantener F5 como no certificado. <!-- sdd-owner: parent -->

## R1F — Feedback de importación bajo StrictMode real (F6)

**Dependencia:** R1B y los slices previos permanecen cerrados; parte del baseline staged vigente después del cierre parent de R4. **Fin:** `ComprasScreen` vuelve a marcar `screenMountedRef.current = true` al iniciar el efecto y `false` sólo en cleanup, de modo que una pantalla viva bajo React StrictMode publica feedback de compra creada o ya existente únicamente después de completar la reread autoritativa. **Rollback:** retirar sólo el ajuste del efecto y sus aserciones StrictMode en estos dos paths; conservar R1B, sus pruebas y ambos informes de verificación.

**Paths exactos permitidos:** `src/features/compras/ComprasScreen.tsx`, `tests/unit/comprasScreen.test.tsx`.

**Límites explícitos:** no tocar otros archivos fuente o test, Convex, endpoints, DTOs, adapters, mutaciones, delivery actions, `verify-report.md` ni `reverify-report.md`; no debilitar las aserciones de R1B sobre reread, retry exclusivo y ausencia de reenvío multipart. Mantener OpenSpec unstaged.

- [x] Crear RED fresca en `tests/unit/comprasScreen.test.tsx` montando la pantalla real bajo `<React.StrictMode>`; demostrar para respuestas `alreadyExisted: false` y `true` que el feedback no aparece antes de la reread autoritativa y sí aparece después, cubriendo proveedor vigente y proveedor no vigente sin convertir el diagnóstico browser anterior en evidencia de test. <!-- sdd-owner: implementation -->
- [x] Implementar únicamente en `ComprasScreen.tsx` la restauración `screenMountedRef.current = true` en setup del `useEffect` y `screenMountedRef.current = false` en cleanup; conservar intacta la separación de confirmación, reread y retry de R1B. <!-- sdd-owner: implementation -->
- [x] Triangular con focused RTL/Vitest los casos proveedor vigente/no vigente, created/alreadyExisted, reread pendiente, cambio de proveedor durante reread, unmount y resolución stale; confirmar que no se publica feedback tras desmontaje, que no hay mutación duplicada y que R1B conserva retry sólo de lectura. <!-- sdd-owner: implementation -->
- [x] Refactorizar sólo los dos paths y medir un delta autoral estrictamente menor de 400 líneas contra el baseline staged; preservar StrictMode real, no introducir endpoints, Convex, fuentes adicionales ni delivery actions. <!-- sdd-owner: implementation -->
- [x] Ejecutar checks enfocados sobre los dos paths: `pnpm exec vitest run tests/unit/comprasScreen.test.tsx --reporter=dot`, `pnpm exec eslint src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx --max-warnings 0`, `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx`, `pnpm typecheck` y `git diff --check`; registrar resultados sin editar informes previos. <!-- sdd-owner: implementation -->
- [x] Ejecutar bounded verify independiente de R1F contra su baseline, revisar únicamente los dos paths, confirmar el límite `<400` y stagear selectivamente sólo source/test; dejar `verify-report.md`, `reverify-report.md` y todos los artefactos OpenSpec unstaged. <!-- sdd-owner: parent -->
- [x] Coordinar una segunda reverify independiente después del cierre parent de R1F, contra el SHA/baseline correspondiente, preservando ambos informes de verificación y sin iniciar commit, branch, push, PR, archive ni otra acción de entrega. <!-- sdd-owner: parent -->

## Gate de reverify y límites de entrega

- [x] Confirmar antes de apply que la cadena `feature-branch-chain` y la estrategia `ask-on-risk` siguen autorizadas, sin inferir `size:exception`; pausar si el parent no confirma el gate. <!-- sdd-owner: parent -->
- [x] Ejecutar la segunda reverify sólo después de R1F y de su cierre parent, contra el SHA de entrada y el baseline actualizado, sin editar retroactivamente `verify-report.md` ni `reverify-report.md`; publicar cualquier informe nuevo fuera de esta reapertura. <!-- sdd-owner: parent -->

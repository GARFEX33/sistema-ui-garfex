# Plan de implementación — Base jerárquica del Catálogo

Este plan implementa únicamente la capacidad workstation `Clase → Familia → Tipo` dentro de una feature local. Se ejecutará en **cuatro cortes locales secuenciales**: (1) fundamento usable y no mutante con `Nueva Clase`, (2) lectura autoritativa, (3) contratos reales de creación y conexión autorizada de Clase, y (4) creación dependiente de Familia/Tipo más verificación integral workstation. No se modificará ningún archivo `.op`, `recovery/**`, backend, fixture de Bandeja ni contrato de API.

El primer flujo usable es deliberadamente no mutante: `Nueva Clase` es una superficie presentacional local, ejercitable en pruebas unitarias y Storybook sin Convex. La implementación histórica del Corte local 1 quedó simplificada; sus tareas completadas y su evidencia se conservan como registro de ruta, contexto, aislamiento y foco, pero no acreditan fidelidad visual. La remediación visual de este corte queda como checkpoint parcial y congelado: no se reanuda ni se amplía en esta reconciliación. El runtime `/catalogo` permanecerá sin fixtures y Storybook conservará exclusivamente la composición poblada `Materiales → Canalizaciones → Tubería`. La referencia `design-catalog-hierarchy-edit.op`, página `05D Alta · Nueva Clase`, page id `n2417`, root `n2418` y SHA-256 `e121831c829d6a300ee09990d9ca20f0838ee270413a49f63a4d505087bbcc89`, se consultará como autoridad visual sólo de lectura; no se convertirá en React generado ni se editará.

## Review Workload Forecast

Este pronóstico cubre el trabajo restante y separa cada tramo autónomo para conservar `ask-on-risk` sin admitir una excepción de tamaño. La evidencia pública disposable ya cubre Clase, Familia y Tipo; sólo Unit 4 sigue pendiente de una decisión explícita de apply e implementación.

| Field | Value |
|-------|-------|
| Estimated changed lines | Unit 3A API Clase: 120–180; Unit 3B UI/E2E Clase: 220–320; Unit 4A API Familia/Tipo: 160–240; Unit 4B UI/E2E workstation: 260–400; agregado informativo aproximado 760–1.140 |
| 400-line budget risk | High en el agregado; Low/Medium por unidad con límites, verificación y rollback propios |
| Chained PRs recommended | No; el usuario confirmó dos unidades locales secuenciales para Clase, sin ramas ni PRs |
| Suggested split | Unit 3A API Clase → settlement/verificación → Unit 3B UI/E2E Clase → settlement/verificación → Unit 4A API Familia/Tipo → Unit 4B UI/E2E workstation |
| Delivery strategy | ask-on-risk; decisión resuelta para Unit 3A/3B mediante unidades locales separadas |
| Chain strategy | not-applicable |

Decision needed before apply: No para Unit 3A/3B; pendiente antes de Unit 4A/4B
Chained PRs recommended: No
Chain strategy: not-applicable
400-line budget risk: High

Cada unidad tiene inicio, fin, verificación y rollback autónomos; el agregado no es el presupuesto de un solo intento y no se permite una excepción para superarlo. Unit 3A y Unit 3B son exclusivamente de Clase y ya están completas. La UI usa fakes mientras la evidencia disposable separada acredita los permisos públicos; ningún test crea contra la autoridad `3210`. Unit 4A y Unit 4B permanecen pendientes de una decisión explícita de apply. No se autorizan commits, ramas, remotes, publicaciones ni Receipt-Driven Development.

**Siguiente decisión de apply:** autorizar Unit 4A/4B bajo sus límites y TDD fake, o mantener Familia/Tipo diferidos. No mezclar ambos units ni tratar la evidencia `auth:none` como implementación conectada.

## Totales reconciliados

| Bloque | Total | Completadas | Restantes |
|--------|------:|------------:|----------:|
| Implementación Corte 1 histórico + remediación | 17 | 17 | 0 |
| Implementación Corte 2 (2A + 2B + Unit 1 + Unit 2) | 24 | 24 | 0 |
| Implementación Corte 3 (Unit 3A + Unit 3B, sólo Clase) | 8 | 8 | 0 |
| Implementación Corte 4 (Unit 4A + Unit 4B, Familia/Tipo) | 8 | 0 | 8 |
| **Implementación** | **57** | **49** | **8** |
| Acciones parent-owned | 4 | 4 | 0 |
| Registros de evidencia persistidos | 4 | 4 | 0 |
| **Total de checkboxes** | **65** | **57** | **8** |

## Registro de reconciliación

Se conserva el historial completado de Cortes 1–3 y se reconcilia el trabajo pendiente en Unit 4A contratos de Familia/Tipo y Unit 4B composición/verificación workstation. La evidencia disposable satisface la autorización pública de `crearClase`, `crearFamilia` y `crearTipo`; la autoridad `3210` permanece intocable y los tests de creación usan fakes. Se mantienen cuatro cortes locales, el freeze visual, Storybook-only poblado, el aislamiento de Bandeja, los padres inmutables y la exclusión de Recurso.

## Reglas de ejecución

- Cada corte tiene límites explícitos de inicio, fin, verificación y rollback; las pruebas permanecen junto al comportamiento que verifican.
- Dentro de cada corte se ejecuta estrictamente RED → GREEN → TRIANGULATE → REFACTOR. GREEN sólo acredita la unidad implementada: Unit 3 conecta Clase; Unit 4 tiene permisos públicos probados pero permanece pendiente de decisión explícita de apply e implementación, y ninguna evidencia disposable acredita el cierre global.
- `Nueva Clase` en el Corte 1 sólo mantiene un borrador local de presentación y las interacciones aprobadas de la superficie. No llama Convex, no ejecuta mutaciones, no muestra éxito, errores backend ni items persistidos, y no usa fixtures como datos de runtime.
- OpenPencil es autoridad visual aprobada de sólo lectura. Ninguna tarea autoriza modificar `design-catalog-hierarchy-edit.op`, generar React desde el `.op` o trasladar coordenadas como posicionamiento fijo.
- El runtime usa sólo `catalogoAdmin/jerarquia`; los fixtures sólo pueden vivir bajo `storybook/catalog-hierarchy/**` o en pruebas y nunca bajo `src/**`.
- Las respuestas `unknown` se validan antes de llegar a React. No se inventan reglas de texto, orden, unicidad, permisos, errores, copy ni estados visuales.
- La feature no incorpora Recursos, unidades, atributos, reglas, presentación, compatibilidad, publicación, responsive, touch, storage, persistencia, update, activate, deactivate ni una capa Query/global store.
- En cada corte se conservará evidencia de comando enfocado y resultado exacto, comando de runtime o `N/A` con motivo, límite de rollback y archivos incluidos. No se declarará una prueba pasada sin ejecutar su comando.

## Corte local 1 — Frontera de shell, ruta, contexto local y `Nueva Clase` presentacional

**Inicio:** existen `/bandeja`, `AppShell` con un solo destino y la configuración TanStack Router actual. No hay datos de Catálogo, cliente Convex ni superficie `Nueva Clase`.

**Fin histórico del corte:** `/catalogo` convive con `/bandeja`, el destino resuelto queda activo, el contexto local limpia descendientes al cambiar de padre y la ruta ofrece una superficie `Nueva Clase` presentacional y accesible. La superficie permite ejercitar presentación, borrador en memoria, cancelación/cierre y foco, pero no consulta, persiste, crea items ni simula resultados. La fidelidad visual completa no se da por satisfecha hasta cerrar la remediación bounded siguiente.

**Verificación de corte:** `pnpm test -- tests/unit/appShell.test.tsx tests/unit/catalogHierarchyState.test.tsx tests/unit/catalogHierarchyNewClass.test.tsx`, `pnpm test:stories`, `pnpm exec playwright test tests/e2e/catalogHierarchy.workstation.spec.ts` y `pnpm router:check`; runtime conectado: `N/A`, porque este corte no tiene cliente backend ni mutaciones.

**Rollback:** retirar `src/app/routes/catalogo.tsx`, la entrada de `src/app/shell/AppShell.tsx`, `src/features/catalog-hierarchy/**`, `storybook/catalog-hierarchy/CatalogHierarchyNuevaClase.stories.tsx`, sus pruebas y la regeneración de `src/app/routeTree.gen.ts`; `/bandeja` debe conservar su regresión.

### RED

- [x] Ampliar `tests/unit/appShell.test.tsx` y crear `tests/unit/catalogHierarchyState.test.tsx` y `tests/unit/catalogHierarchyNewClass.test.tsx` para demostrar inicialmente en rojo la ruta `/catalogo`, los dos enlaces con `aria-current`, la ausencia de `fetch`/storage/Convex en `/bandeja` y `Nueva Clase`, la limpieza atómica Clase→Familia/Tipo y Familia→Tipo, la prohibición de consultas dependientes sin padre, y una superficie `Nueva Clase` con nombre accesible, edición de borrador local, cancelación/cierre y sin éxito, error backend, item persistido o mutación; ejecutar el comando enfocado y conservar el fallo observado. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implementar la frontera mínima en `src/app/routes/catalogo.tsx`, `src/app/shell/AppShell.tsx`, `src/features/catalog-hierarchy/CatalogHierarchyEntry.tsx`, `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` y `src/features/catalog-hierarchy/catalogHierarchy.types.ts`; regenerar `src/app/routeTree.gen.ts` con `pnpm router:generate`, mantener el contexto sin URL/storage y no añadir cliente, adapter, filas ni fixtures runtime. <!-- sdd-owner: implementation -->
- [x] Implementar `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`, sus estilos feature-locales y `storybook/catalog-hierarchy/CatalogHierarchyNuevaClase.stories.tsx` como superficie presentacional local inicial; cubrir sólo interacción local y accesible aprobada; la fidelidad aprobada queda pendiente de la remediación del Corte local 1, sin importar Storybook desde `src/**`, sin callback de mutación conectado y sin afirmar guardado, error o persistencia. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Completar `tests/e2e/catalogHierarchy.workstation.spec.ts` y `tests/architecture/catalogHierarchyBoundaries.test.ts` para contrastar navegación, convivencia con Bandeja, presencia de `Nueva Clase`, comparación de la implementación contra la referencia sin modificar el `.op`, ausencia de Convex/mutaciones/fixtures runtime y ausencia de destinos futuros; ejecutar `pnpm test`, `pnpm test:stories`, el E2E enfocado y `pnpm router:check`, registrando resultados reales. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Revisar `src/features/catalog-hierarchy/**` y `src/app/shell/AppShell.tsx` para conservar responsabilidades feature-first, no promover helpers a `shared` sin segundo consumidor y mantener `NuevaClaseSurface` separada de cualquier adapter futuro; confirmar con `pnpm test` y `pnpm typecheck` que la extracción no altera `/bandeja`. <!-- sdd-owner: implementation -->

### Registro histórico y límite de aceptación visual

Las cinco tareas `[x]` del Corte local 1 y la evidencia de `openspec/changes/catalog-hierarchy-base/apply-progress.md` se preservan sin reescritura como historial de la entrega inicial: ruta, shell mínimo, contexto local, superficie no mutante, aislamiento y foco. La afirmación previa de que la pantalla era “visualmente fiel” queda corregida: la implementación existente es simplificada y no satisface el frame aprobado. Las tareas siguientes son una remediación explícita del mismo corte, con su propia evidencia RED/GREEN/TRIANGULATE/REFACTOR, sin borrar ni falsificar la evidencia histórica.

### Remediación visual bounded histórica del Corte local 1 — checkpoint parcial congelado

**Dependencia:** las tareas históricas y la evidencia de esta continuación permanecen completadas como registro; el resultado visual no se interpreta como fidelidad final. Este bloque no se reabre ni añade trabajo pendiente en la reconciliación Keyboard First. El gate parent-owned de runtime Convex continúa declarado al final del plan.

**Inicio y fin históricos:** existían la ruta, el shell mínimo, `NuevaClaseSurface` y las pruebas históricas; se conservaron la pantalla, el aislamiento de Storybook, el foco y la regresión de `/bandeja` observados en esa ejecución. El checkpoint actual permanece parcial y congelado, sin normalizar layout, composición, espaciado, tipografía ni estados en reposo.

**Verificación histórica:** los comandos, resultados y desviaciones de esta continuación se conservan en `apply-progress.md`; una futura comparación real con OpenPencil requiere autorización explícita y no se sustituye por tests estructurales. No se añade aquí una nueva afirmación de fidelidad visual ni de runtime conectado.

**Rollback histórico:** retirar únicamente el delta documentado en `apply-progress.md` dentro de `src/app/shell/AppShell.tsx`, `src/features/catalog-hierarchy/**`, `storybook/catalog-hierarchy/**` y sus pruebas/evidencia; conservar las cinco tareas históricas, la ruta, la regresión de `/bandeja` y los artefactos OpenPencil. No mezclar una eventual remediación futura con Cortes 2–4 ni reabrirla sin autorización explícita.

#### RED

- [x] Añadir o ajustar en `tests/e2e/catalogHierarchy.workstation.spec.ts` la prueba visual estructural que falle contra la superficie simplificada actual: viewport exacto 1440×980, shell/header/sidebar, workstation de Catálogo, modal de `Nueva Clase`, geometría relativa, regiones, campos, tipografía, colores, estados de selección y foco; usar como única autoridad comparativa el frame aprobado `design-catalog-hierarchy-edit.op` page/root `n2418`, sin editar el `.op`. <!-- sdd-owner: implementation -->
- [x] Crear o ajustar en `tests/unit/catalogHierarchyNewClass.test.tsx` y `tests/unit/appShell.test.tsx` aserciones RED para la composición completa aprobada, nombres/labels accesibles, foco visible de apertura y cierre, `Escape`/Cancelar, y regresión de navegación activa entre `/catalogo` y `/bandeja`; conservar los fallos observables y no convertir la aprobación visual en una inferencia textual. <!-- sdd-owner: implementation -->
- [x] Añadir en `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts` la prueba RED de que ningún módulo runtime bajo `src/**` importa `storybook/catalog-hierarchy/**` ni usa la composición poblada, y de que `/catalogo` sin backend sólo puede resolver estados vacíos/de espera aprobados sin filas `Materiales`, `Canalizaciones` o `Tubería`. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Corregir `src/app/shell/AppShell.tsx`, `src/app/routes/catalogo.tsx`, `src/features/catalog-hierarchy/CatalogHierarchyEntry.tsx` y `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` para reproducir exactamente la composición aprobada de shell, header, sidebar, fondo de jerarquía y workstation a 1440×980, preservando la convivencia y el comportamiento existente de `/bandeja`; no copiar coordenadas como posicionamiento fijo ni añadir destinos fuera de alcance. <!-- sdd-owner: implementation -->
- [x] Rehacer `src/features/catalog-hierarchy/NuevaClaseSurface.tsx` y `src/features/catalog-hierarchy/catalogHierarchy.css` con la geometría del modal, overlay, campos, labels, controles, tipografía, pesos, colores, bordes, radios, espaciado, estados y foco aprobados para `05D Alta · Nueva Clase`; mantener borrador local no mutante, orden DOM lógico, componentes accesibles y sin inventar copy o feedback de backend. <!-- sdd-owner: implementation -->
- [x] Aislar en `storybook/catalog-hierarchy/catalogHierarchy.fixtures.ts` y `storybook/catalog-hierarchy/CatalogHierarchyApproved.stories.tsx` la composición poblada exacta `Materiales → Canalizaciones → Tubería` para Storybook fiel, y mantener `/catalogo` libre de esos imports/datos: con backend indisponible debe mostrar sólo los estados vacíos/de espera aprobados mientras conserva el mismo shell/layout/superficie `Nueva Clase`. <!-- sdd-owner: implementation -->
- [x] Ajustar `tests/unit/catalogHierarchyNewClass.test.tsx` y la semántica de `src/features/catalog-hierarchy/NuevaClaseSurface.tsx` para cubrir labels visibles, nombres accesibles, foco amarillo GARFEX con indicador rojo, selección diferenciada, `Tab`/`Shift+Tab` nativos, `Escape` y restauración al trigger, incluyendo `prefers-reduced-motion`; no capturar globalmente teclas ni alterar la arbitración de Bandeja. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Ejecutar `pnpm exec playwright test tests/e2e/catalogHierarchy.workstation.spec.ts` a 1440×980 y comparar la captura final de `/catalogo` con el frame aprobado `n2418`, verificando uno por uno shell/header/sidebar, fondo y columnas workstation, modal, campos, tipografía, colores y foco; registrar cada desviación real y corregir sólo dentro de este bloque sin modificar `design-catalog-hierarchy-edit.op`. <!-- sdd-owner: implementation -->
- [x] Ejecutar `pnpm test:stories` sobre `storybook/catalog-hierarchy/CatalogHierarchyApproved.stories.tsx` con la fixture poblada `Materiales → Canalizaciones → Tubería`, comprobando que Storybook conserva la fidelidad visual y que ningún dato poblado aparece en el bundle o recorrido runtime de `/catalogo`; separar la evidencia de fixture de cualquier E2E conectado. <!-- sdd-owner: implementation -->
- [x] Verificar con RTL/Playwright y `tests/architecture/runtimeFixtureIsolation.test.ts` el foco visible, teclado, axe aplicable, estados vacíos/de espera aprobados sin backend y la regresión completa de `/bandeja`; ejecutar también `pnpm test`, `pnpm typecheck`, `pnpm build` y `pnpm router:check`, registrando resultados exactos y cualquier fallo preexistente fuera de las superficies permitidas. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Simplificar el delta visual únicamente después de GREEN, eliminar estilos/markup duplicados de la versión simplificada y conservar la frontera feature-first en `src/features/catalog-hierarchy/**`; confirmar que la composición poblada sólo vive en `storybook/catalog-hierarchy/**`, que no se añadió backend/fallback/storage y que el rollback no toca Bandeja ni OpenPencil. <!-- sdd-owner: implementation -->
- [x] Repetir la matriz de verificación de esta remediación en `tests/e2e/catalogHierarchy.workstation.spec.ts`, `tests/unit/catalogHierarchyNewClass.test.tsx`, `tests/unit/appShell.test.tsx`, `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts`, dejando explícitos los resultados visuales a 1440×980, Storybook poblado, runtime fixture-free, accesibilidad/foco y `/bandeja`; no declarar fiel o listo el Corte local 1 si queda una desviación aprobatoria o el gate runtime parent-owned pendiente impide la afirmación correspondiente. <!-- sdd-owner: implementation -->

## Corte local 2 — Integración de lectura autoritativa y navegación jerárquica

**Dependencia:** Corte 1, 2A y 2B están terminados. La autorización vigente habilita la extensión visible read-only en dos unidades internas: Unit 1 conecta la pantalla existente y Unit 2 aporta E2E/Storybook/guardas y verificación integral. La puerta parent-owned de mutación, permisos y cualquier acción de creación continúa abierta.

**Inicio:** existen ruta, shell, estado local, contratos fake de 2A, transporte real lazy de 2B y markup vigente en `CatalogHierarchyScreen.tsx`; la pantalla todavía no consume las lecturas autoritativas.

**Fin de Unit 1:** `CatalogHierarchyScreen.tsx` usa el API real por defecto en runtime y admite presentación fake sólo por inyección en tests/stories; Clases cargan al montar, Familias/Tipos esperan un padre válido, las selecciones limpian descendientes y la continuación/reintento conserva páginas válidas. No se crean `HierarchyBrowser.tsx` ni `HierarchyReadPanel.tsx`.

**Fin de Unit 2:** la autoridad real vacía queda verificada en E2E a 1440×980 sin fixtures runtime; la jerarquía poblada existe sólo en Storybook/tests; guardas cubren aislamiento, stale/partial, foco y Keyboard First, y la matriz integral reporta resultados reales. No se ejecutan mutaciones ni se reabre el freeze visual.

**Fin de 2A:** la feature tiene contratos frontend testeables para páginas/DTOs `unknown`, mapeo exacto de funciones y argumentos mediante un transporte mínimo inyectado, cursores opacos por secuencia, dedupe, stale guard, descarte por cambio de padre, estados `exhausted`/`waiting-for-parent`/`partial-error` y consumo de Keyboard First con fakes. 2A no monta todavía `HierarchyBrowser`, `HierarchyReadPanel` ni trabajo visual, no ejecuta red y no constituye un quinto corte: es una unidad interna acotada del único Corte local 2.

**Verificación de 2A:** `pnpm test -- tests/unit/catalogHierarchyApi.test.ts tests/unit/useCatalogList.test.ts tests/unit/catalogHierarchyKeyboard.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm verify:runtime-bundle`. No ejecutar `pnpm test:stories` ni Playwright para 2A salvo que una prueba pura lo requiera; la verificación de browser, panel, visual y Storybook queda diferida. Runtime conectado: `N/A`, sin paquete, URL, cliente, red, fixtures runtime ni persistencia. Rollback de 2A: retirar únicamente `src/features/catalog-hierarchy/catalogHierarchy.api.ts`, `src/features/catalog-hierarchy/catalogHierarchy.types.ts`, `src/features/catalog-hierarchy/useCatalogList.ts` y sus pruebas/guardas, conservando el Corte 1.

### 2A — RED

- [x] Crear `tests/unit/catalogHierarchyApi.test.ts` con fallos esperados para parsers de páginas y DTOs recibidos como `unknown`, rechazo de envolventes/items inválidos y páginas con `claseRecursoId`/`familiaRecursoId` cruzados; probar mediante un transporte mínimo inyectado el mapeo 1:1 exacto a `catalogoAdmin/jerarquia:listarClases`, `listarFamilias` y `listarTipos`, enviando sólo cursor opaco, padre y filtros explícitos, sin fabricar `modo`/`pageSize`; no fijar primitivas de ID, revisión o cursor que el gate no haya confirmado. <!-- sdd-owner: implementation -->
- [x] Crear `tests/unit/useCatalogList.test.ts` con fallos esperados para una secuencia local que conserve operación, padre y filtros, reutilice exclusivamente el cursor opaco validado, detenga continuación cuando `isExhausted`, deduplique por `id`, descarte respuestas stale tras cambio de padre, no consulte en `waiting-for-parent`, preserve páginas válidas en `partial-error` y ofrezca continuación/reintento sólo de forma explícita. <!-- sdd-owner: implementation -->
- [x] Crear `tests/unit/catalogHierarchyKeyboard.test.tsx` con fakes únicamente para `KeyboardControllerProvider`, `arbitrateKeyboardEvent`, elegibilidad DOM y `focusSpatialTarget`; demostrar precedencia de edición/IME, respeto de `defaultPrevented`, `Tab`/`Shift+Tab` nativos, `Enter`/`Escape`, geometría física sin índice/DOM/texto/columnas, active/roving sólo representacional, `N` únicamente para `Nueva Clase` visible/habilitada, `?` por `event.key === "?"`, `Ctrl/Cmd+K` exacto y `Ctrl+N` intacto. <!-- sdd-owner: implementation -->

### 2A — GREEN

- [x] Implementar sólo en `src/features/catalog-hierarchy/catalogHierarchy.api.ts` y `src/features/catalog-hierarchy/catalogHierarchy.types.ts` los parsers `unknown`, DTOs internos validados y el transporte mínimo inyectable con nombres/argumentos exactos; no importar `convex`, no tocar `package.json`, `pnpm-lock.yaml` ni configuración de entorno, no llamar red, no importar fixtures runtime, no usar runtime fixtures, storage o persistencia, no usar `any`, REST, `catalogoRecursos/catalogo` ni operaciones administrativas fuera de alcance. <!-- sdd-owner: implementation -->
- [x] Implementar `src/features/catalog-hierarchy/useCatalogList.ts` con estado de secuencia local, cursor opaco, token monotónico, deduplicación por `id`, descarte por operación/padre/token, `waiting-for-parent`, agotamiento y `partial-error` con páginas válidas preservadas; no auto-seleccionar, no consultar sin padre, no ordenar, no prefetch, no reintentar automáticamente ni inferir permisos, causas o negocio. <!-- sdd-owner: implementation -->
- [x] Hacer pasar `tests/unit/catalogHierarchyKeyboard.test.tsx` usando exclusivamente fakes de las primitivas compartidas ya existentes; no añadir listeners globales, handlers locales de `Tab`/`Ctrl+N`, navegación por índice o implementación de navegador/read-panel, y dejar explícitamente diferida cualquier integración visual o de browser. <!-- sdd-owner: implementation -->

### 2A — TRIANGULATE

- [x] Completar en `tests/unit/catalogHierarchyApi.test.ts` y `tests/unit/useCatalogList.test.ts` la matriz de transporte fake y promesas diferidas: páginas sucesivas con el mismo contexto/cursor opaco, duplicados sin reordenamiento, padre cambiado antes de respuesta, página cruzada o inválida, agotamiento, espera sin llamada y fallo de continuación que conserva datos válidos; ejecutar la prueba enfocada de 2A sin conectar Convex ni introducir fixtures de runtime. <!-- sdd-owner: implementation -->
- [x] Reforzar `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts para demostrar que 2A no importa `convex`, no usa red, configuración Convex, storage, persistencia, fixtures runtime, cliente en Bandeja, Query/global store, update/activate/deactivate, Recurso ni listeners que dupliquen Keyboard First; ejecutar el comando enfocado, `pnpm build` y `pnpm verify:runtime-bundle`, registrando que no sustituyen la autorización runtime. <!-- sdd-owner: implementation -->

### 2A — REFACTOR

- [x] Reducir los cambios de `src/features/catalog-hierarchy/catalogHierarchy.api.ts`, `src/features/catalog-hierarchy/catalogHierarchy.types.ts` y `src/features/catalog-hierarchy/useCatalogList.ts` a la frontera feature-first mínima; mantener `classId`/`familyId` sólo como nombres internos y traducirlos exactamente a `claseRecursoId`/`familiaRecursoId`, conservar padres inmutables, cursor opaco, arbitraje compartido, `?` semántico, `Ctrl/Cmd+K` exacto y `Ctrl+N` sin captura. Ejecutar `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y la prueba enfocada; no reabrir el checkpoint visual congelado. <!-- sdd-owner: implementation -->

### Extensión conectada de sólo lectura del Corte local 2 — 2B autorizada, no es un corte adicional

Esta subunidad resuelve únicamente dependencia, configuración y transporte real lazy de lectura. La autorización no satisface ni marca el gate parent-owned: la verificación de mutación no autenticada y cualquier evidencia posterior siguen pendientes. No se monta una pantalla conectada, `HierarchyBrowser` ni `HierarchyReadPanel`; no se ejecutan llamadas de escritura; no se reabre la visual congelada. El transporte sólo puede alcanzar `catalogoAdmin/jerarquia:listarClases`, `listarFamilias` y `listarTipos`, manteniendo el parser `unknown` y la inyección fake de 2A.

**Inicio:** `catalogHierarchy.api.ts`, `catalogHierarchy.types.ts` y `useCatalogList.ts` ya pasan la matriz fake de 2A, pero el frontend no tiene dependencia Convex, configuración efectiva ni cliente real.

**Fin:** `package.json` y `pnpm-lock.yaml` fijan `convex@1.45.0`; `.env.local` aporta localmente `VITE_CONVEX_URL=http://127.0.0.1:3210` sin rastrearse y un ejemplo no secreto rastreado documenta la misma clave; el transporte real se crea sólo al invocar una lectura, traduce exactamente las tres operaciones autorizadas y falla cerrado cuando falta o es inválido el URL, sin sintetizar copy, datos ni una página válida.

**Verificación de 2B:** ejecutar, en orden y registrar resultados reales, `pnpm exec vitest run tests/unit/catalogHierarchyConnectedTransport.test.ts tests/integration/catalogHierarchyConnectedTransport.test.ts tests/unit/catalogHierarchyApi.test.ts tests/unit/useCatalogList.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts`, `pnpm list convex --depth 0`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm verify:runtime-bundle`; para la lectura local conectada ejecutar `VITE_CONVEX_URL=http://127.0.0.1:3210 pnpm exec vitest run tests/integration/catalogHierarchyConnectedTransport.test.ts`. No ejecutar Storybook ni Playwright de pantalla/panel en esta unidad. Si la autoridad local no está disponible, registrar `N/A` con el motivo y no sustituirla con fixture, storage o datos inventados.

**Rollback de 2B:** retirar el transporte/configuración conectados, `tests/unit/catalogHierarchyConnectedTransport.test.ts`, `tests/integration/catalogHierarchyConnectedTransport.test.ts`, la dependencia `convex@1.45.0`, la entrada de ejemplo y el env local, conservando intactos los contratos fake, parsers, hook y pruebas de 2A; no tocar Bandeja ni el checkpoint visual.

### 2B — RED

- [x] Crear `tests/unit/catalogHierarchyConnectedTransport.test.ts` y `tests/integration/catalogHierarchyConnectedTransport.test.ts` con fallos esperados para el factory real: `listarClases`, `listarFamilias` y `listarTipos` deben mapear 1:1 sus nombres y argumentos, reutilizar sólo cursor opaco, padre y filtros explícitos, y pasar por la validación `unknown`; añadir casos de URL ausente o inválido que no construyan cliente, no hagan red, no entreguen página/items fabricados ni copy inventado. <!-- sdd-owner: implementation -->
- [x] Ampliar `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts` con fallos esperados que impidan `convex`/cliente/provider en `src/app/**` o Bandeja, exijan la importación feature-local exclusiva y conserven aislados fixtures, storage, persistencia y cualquier store/provider global; comprobar también que no se monta browser/read-panel desde esta subunidad. <!-- sdd-owner: implementation -->

### 2B — GREEN

- [x] Instalar exactamente `convex@1.45.0` en `package.json` y `pnpm-lock.yaml`, añadir `VITE_CONVEX_URL=http://127.0.0.1:3210` sólo al `.env.local` no rastreado y documentar esa misma variable sin secretos en `.env.example` rastreado; asegurar la exclusión de `.env.local` en `.gitignore` sin exponer credenciales ni alterar otra configuración. <!-- sdd-owner: implementation -->
- [x] Implementar en `src/features/catalog-hierarchy/catalogHierarchy.api.ts` el transporte Convex real lazy y feature-local: usar exclusivamente los tipos/exportaciones entregados por `convex@1.45.0`, sin `any`, shim ni cliente global; crear cliente sólo al invocar una de las tres lecturas, conservar la frontera pura inyectable y traducir exactamente `listarClases`, `listarFamilias` y `listarTipos` sin añadir campos o operaciones no solicitados. URL ausente, no absoluta o no `http(s)` debe detenerse antes de construir cliente o red y propagarse como indisponibilidad técnica sin fabricar copy, datos o una página válida. No montar componentes visibles ni tocar Bandeja, AppShell o providers globales. <!-- sdd-owner: implementation -->

### 2B — TRIANGULATE

- [x] Triangular `tests/unit/catalogHierarchyConnectedTransport.test.ts`, `tests/integration/catalogHierarchyConnectedTransport.test.ts`, `tests/unit/catalogHierarchyApi.test.ts` y `tests/unit/useCatalogList.test.ts` con spies/fakes y autoridad local real: verificar las tres lecturas, argumentos exactos, continuación con cursor validado, parsers `unknown`, URL válida, URL ausente/inválida y ausencia de síntesis; ejecutar la matriz enfocada y la lectura local con `VITE_CONVEX_URL=http://127.0.0.1:3210`, registrando respuesta y cualquier indisponibilidad sin usar datos de sustitución. <!-- sdd-owner: implementation -->
- [x] Ejecutar las guardas de `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts` junto con `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm verify:runtime-bundle`; confirmar que sólo la feature importa el cliente, que `/bandeja` no recibe provider ni transporte por efecto de Catálogo, que no hay browser/read-panel visible y que no se introdujeron operaciones fuera de las tres lecturas autorizadas. <!-- sdd-owner: implementation -->

### 2B — REFACTOR

- [x] Refactorizar sólo la frontera de `src/features/catalog-hierarchy/catalogHierarchy.api.ts` y sus tipos/guardas de 2B para eliminar duplicación de configuración, mantener creación lazy por invocación y conservar el contrato fake de 2A; confirmar tipado efectivo de `convex@1.45.0`, fail-closed sin URL válida, ausencia de datos/copy inventados, aislamiento de Bandeja/global-provider y ausencia de wiring visible. Repetir la matriz de 2B, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm verify:runtime-bundle`, sin avanzar a browser/read-panel ni reabrir el checkpoint visual. <!-- sdd-owner: implementation -->

### Unit 1 — Screen wiring + RTL/unit tests (unidad interna del Corte local 2; objetivo ≤300 líneas authored)

**Inicio:** `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` conserva el markup vigente y 2B ya entrega el API real lazy, los parsers `unknown` y `useCatalogList`; no se crean componentes nuevos de browser o panel.

**Fin:** la Screen existente monta Clases mediante el API real por defecto, sólo solicita Familias con `claseRecursoId` válido y Tipos con `familiaRecursoId` válido, resetea descendientes al cambiar de padre y conserva el orden de entrega sin auto-selección ni sort. Tests/stories pueden inyectar una presentación fake sin que esa ruta se vuelva fuente runtime. La UI expone exclusivamente los estados y copy aprobados: `Cargando…`, `En espera de Clase.`, `En espera de Familia.`, `Estado vacío confirmado`, `Cargar más…`, `Listado parcial`, `Reintentar continuación` y, para el error inicial, `Reintentar`.

**Verificación:** `pnpm exec vitest run tests/unit/catalogHierarchyScreen.test.tsx tests/unit/catalogHierarchyState.test.tsx tests/unit/useCatalogList.test.ts tests/unit/catalogHierarchyApi.test.ts tests/unit/catalogHierarchyKeyboard.test.tsx`; no ejecutar Storybook, Playwright ni mutaciones en esta unidad. Confirmar que el runtime no importa fixtures y que `N` permanece reservado a `Nueva Clase`.

**Rollback:** retirar sólo el wiring adicional de `CatalogHierarchyScreen.tsx` y `tests/unit/catalogHierarchyScreen.test.tsx`/ajustes unitarios de esta unidad; conservar 2A, 2B, la ruta, el shell, el markup previo y la superficie presentacional de `Nueva Clase`.

#### RED

- [x] Crear o ampliar `tests/unit/catalogHierarchyScreen.test.tsx` para fallar antes de producción con un fake de presentación inyectable: carga de Clases al montar; espera de Familias sin `classId` válido y de Tipos sin `familyId` válido; selección explícita con reset atómico de descendientes; ausencia de auto-selección, ordenamiento o consulta cruzada; y contrato de controles para `Cargar más…`, `Reintentar continuación` y `Reintentar`. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Extender únicamente `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` y su markup existente para consumir el API real por defecto en runtime, inyectar presentación fake sólo desde tests/stories, conectar `useCatalogList` para Clases/Familias/Tipos y renderizar exactamente `Cargando…`, `En espera de Clase.`, `En espera de Familia.`, `Estado vacío confirmado`, `Cargar más…`, `Listado parcial`, `Reintentar continuación` y `Reintentar`; no crear `HierarchyBrowser.tsx` ni `HierarchyReadPanel.tsx`, no tocar CSS/layout congelado y no llamar mutaciones. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Completar `tests/unit/catalogHierarchyScreen.test.tsx` con promesas diferidas para verificar cursor/contexto explícitos, páginas válidas preservadas ante `partial-error`, retry sólo explícito, selección que descarta respuestas stale y ausencia de llamadas dependientes sin padre; cubrir también `KeyboardControllerProvider`/arbitraje Keyboard First, Tab nativo, flechas sin listener local por índice/orden DOM y `N` sólo para `Nueva Clase`. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Reducir el cambio a `CatalogHierarchyScreen.tsx` y las pruebas unitarias necesarias, eliminar handlers locales de flechas, índices u orden DOM, conservar el orden de entrega sin auto-selección, mantener padres y descendientes inmutables y repetir la prueba enfocada de Unit 1 con `pnpm typecheck`; dejar intactas la visual congelada, Bandeja, fixtures y todas las filas de mutación/parent-owned. <!-- sdd-owner: implementation -->

### Unit 2 — E2E/Storybook/architecture guards + verificación integral (unidad interna del Corte local 2; objetivo ≤200 líneas authored)

**Inicio:** Unit 1 pasa su matriz RTL/unit y la Screen ya consume el API real por defecto; la autoridad conectada permanece vacía y los datos poblados siguen confinados a `storybook/catalog-hierarchy/**` o tests.

**Fin:** Storybook demuestra únicamente la jerarquía poblada `Materiales → Canalizaciones → Tubería`; E2E usa la autoridad real vacía a 1440×980 sin sembrar datos ni importar fixtures runtime; las guardas cubren fixture/runtime isolation, estados partial/stale, foco y Keyboard First, y la matriz integral reporta resultados reales. No se exponen Recurso, update, activate, deactivate, acciones de creación ni variantes responsive/touch.

**Verificación:** ejecutar `pnpm test:stories`; `VITE_CONVEX_URL=http://127.0.0.1:3210 pnpm exec playwright test tests/e2e/catalogHierarchy.workstation.spec.ts`; `pnpm test -- tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts`; y después `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm verify:runtime-bundle`. Registrar autoridad vacía, captura/foco/teclado y cualquier indisponibilidad sin sustituirla con fixture.

**Rollback:** retirar sólo la story/fixture o guardas y ajustes E2E de esta unidad, conservando la Screen y sus tests de Unit 1; no modificar la autoridad, backend, `.op`, `recovery/**`, Bandeja ni las filas de mutación/parent-owned.

#### RED

- [x] Añadir primero en `tests/e2e/catalogHierarchy.workstation.spec.ts`, `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts` las aserciones que fallen si aparece un fixture poblado en runtime, si la autoridad vacía no conserva `Estado vacío confirmado`/esperas, si se pierde foco o si se instala navegación local por índice/orden DOM; fijar el viewport E2E en 1440×980 y no sembrar mutaciones. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Ajustar sólo `storybook/catalog-hierarchy/**`, `tests/e2e/catalogHierarchy.workstation.spec.ts`, `tests/architecture/catalogHierarchyBoundaries.test.ts` y `tests/architecture/runtimeFixtureIsolation.test.ts` para mantener la story poblada `Materiales → Canalizaciones → Tubería` y validar la autoridad real vacía en `/catalogo`; asegurar que ningún módulo bajo `src/**` importe fixtures, que `N` siga siendo `Nueva Clase` y que la presentación poblada nunca sea runtime. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Triangular `tests/e2e/catalogHierarchy.workstation.spec.ts`, las stories y las guardas con foco visible/restaurable, Tab/Shift+Tab nativos, edición/IME, flechas delegadas a geometría física, `?` semántico, `Ctrl/Cmd+K` exacto, `Ctrl+N` intacto, estados partial/stale y la autoridad vacía a 1440×980; comprobar `axe` aplicable y ausencia de Recurso, mutaciones, layout responsive y datos `Materiales`/`Canalizaciones`/`Tubería` en runtime. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Repetir la matriz integral indicada en Unit 2, separar explícitamente evidencia Storybook/fake de autoridad real y simplificar guardas sin ampliar archivos; confirmar `git diff --check`, rollback limpio de la unidad, aislamiento de Bandeja y que todas las filas de creación y la acción parent-owned de runtime siguen unchecked. <!-- sdd-owner: implementation -->



## Corte local 3 — Creación pública autorizada sólo de `Nueva Clase`

**Dependencia:** Corte 2 terminado para invalidar y releer listas. La evidencia disposable fresca con `ConvexHttpClient` plano y `auth:none` autoriza únicamente `crearClase`: devolvió `CREATED`, item inactivo y `revision:1`; la autoridad `3210` no se modifica. Los contratos, permisos y mutaciones públicas de Familia/Tipo permanecen diferidos al Corte 4.

**Inicio:** el adapter tiene lectura validada; `Nueva Clase` continúa presentacional y `createClass` aún no está conectado.

**Fin:** Unit 3A valida el contrato frontend fake de `createClass`; Unit 3B conecta sólo `Nueva Clase` con sus reglas aprobadas. El diálogo conserva Clave/Nombre sin trim, se habilita con al menos un carácter en cada campo, omite descripción vacía y `activo`, bloquea doble envío, conserva el payload capturado y, ante `CREATED`, relee la primera página de Clases sin inserción, ordenamiento, selección, éxito ni cierre. Los tests de UI/E2E no crean contra `3210`.

**Verificación de corte:** `pnpm test -- tests/unit/catalogHierarchyCreation.test.tsx tests/unit/catalogHierarchyNewClass.test.tsx tests/unit/catalogHierarchyApi.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts` y la matriz de UI/E2E de Unit 3B; la evidencia de permiso es disposable y separada, no una ejecución de tests contra `3210`. Rollback por unidad: Unit 3A retira sólo contrato/tipos/pruebas de `createClass`; Unit 3B retira sólo wiring, estados y pruebas de `NuevaClaseSurface`, conservando lectura y la superficie presentacional previa.

### Corte 3 — unidades RED/GREEN/TRIANGULATE/REFACTOR

### Unit 3A — API contract transport de Clase (objetivo ≤180 líneas authored)

**Inicio:** parsers y transporte de lectura de `catalogHierarchy.api.ts` ya validados.

**Fin:** contrato fake de `createClass` exacto y validado, sin métodos de Familia/Tipo ni conexión visible.

#### RED

- [x] Crear primero en `tests/unit/catalogHierarchyCreation.test.tsx` los casos RED para el transporte inyectado de `createClass`: enviar sólo `clave`, `nombre` y, cuando no esté vacío, `descripcion`; omitir `activo` porque la UI actual no lo controla y omitir descripción vacía; preservar exactamente los valores sin trim/normalización; validar `{ disposition: "CREATED", item }` y rechazar respuestas no válidas. No llamar autoridad `3210`, no probar `createFamily`/`createType` y conservar `N` sólo para Nueva Clase, edición/IME suspendiendo una-tecla/`?` y `Ctrl+N` intacto. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Implementar sólo el método `createClass` y sus tipos/resultados mínimos en `src/features/catalog-hierarchy/catalogHierarchy.api.ts` y `src/features/catalog-hierarchy/catalogHierarchy.types.ts`; traducir 1:1 a `catalogoAdmin/jerarquia:crearClase`, capturar el payload inmutable por solicitud, validar la respuesta `unknown` y no añadir `createFamily`, `createType`, update, activate o deactivate. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Triangular `tests/unit/catalogHierarchyCreation.test.tsx` y `tests/architecture/catalogHierarchyBoundaries.test.ts` con spies/fakes para payload exacto, omisión de opcionales, valores sin mutación, bloqueo de operaciones de Familia/Tipo/Recurso y respuesta `CREATED`; documentar que la evidencia de permiso proviene del disposable `auth:none`, mientras el test permanece sin red y sin creación contra `3210`. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Reducir el contrato de Clase a la frontera feature-first mínima, sin transporte adicional ni síntesis de datos/copy; ejecutar la prueba enfocada de Unit 3A, `pnpm typecheck`, `pnpm lint` y `pnpm format:check`, conservando intactos lectura, Bandeja, fixtures runtime y el diálogo aún no conectado. <!-- sdd-owner: implementation -->

### Unit 3B — UI/E2E de `Nueva Clase` (continuación correctiva ≤400 líneas changed)

**Inicio:** Unit 3A asentada y contrato fake disponible; la superficie existente abre enfocando `Clave` y restaura foco al cancelar.

**Fin:** sólo Nueva Clase queda conectada al `createClass` autorizado. Crear se habilita cuando Clave y Nombre tienen al menos un carácter, no se triman/normalizan/mután, y cada submit produce como máximo una mutación. Tras `CREATED`, espera el refetch de la primera página de Clases, cierra el diálogo, restaura el foco al opener y muestra el toast no bloqueante exacto `Clase “{nombre}” creada.`; la lista sólo se actualiza por refetch, sin inserción, ordenamiento ni selección optimistas. Los errores conservan el borrador, usan únicamente el mapeo estructurado verificado de clave duplicada o el fallback exacto `No se pudo crear la Clase.`, y el área de error estable es accesible. Cancelar/Escape cierran y restauran foco; las flechas siguen el recorrido Keyboard First aprobado sin capturar edición, IME, Tab, Ctrl/Cmd+K ni Ctrl+N; no hay acciones o shortcuts de Familia/Tipo/Recurso.

#### RED

- [x] Añadir primero en `tests/unit/catalogHierarchyCreation.test.tsx`, `tests/unit/catalogHierarchyNewClass.test.tsx` y el escenario controlado de `tests/e2e/catalogHierarchy.workstation.spec.ts` los fallos para habilitación por carácter de Clave/Nombre, captura inmutable, doble-submit bloqueado, omisión de descripción vacía/`activo`, espera del refetch inicial tras `CREATED` antes de cerrar, toast exacto con el nombre, restauración al opener, error estructurado/fallback, preservación del input y región de error estable; usar fake API/UI y no crear contra `3210`. Verificar flechas Clave↔Nombre↔Descripción↔Cancelar, flechas laterales sólo Cancelar↔Crear Clase, edición/IME, `N` sólo para Nueva Clase, `?` semántico, `Ctrl/Cmd+K` exacto, `Ctrl+N` intacto y Tab nativo. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Conectar `src/features/catalog-hierarchy/NuevaClaseSurface.tsx` o el diálogo existente a `createClass` mediante inyección fake en tests/stories y transporte real sólo en runtime autorizado; enviar payload inmutable sin trim, descripción vacía ni `activo`, permitir una sola mutación por submit y bloquear duplicados/replay. Ante `CREATED`, esperar el refetch de Clases desde la primera página, cerrar, restaurar foco al opener y mostrar únicamente el toast no bloqueante `Clase “{nombre}” creada.`, sin inserción, ordenamiento ni selección optimistas. En fallo, conservar la entrada, mapear sólo la clave duplicada estructurada conocida o mostrar exactamente `No se pudo crear la Clase.` en una región estable con alerta accesible. Mantener Cancelar/Escape, foco inicial en `Clave` y Keyboard First compartido. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Triangular con `tests/unit/catalogHierarchyCreation.test.tsx`, `tests/unit/catalogHierarchyNewClass.test.tsx`, `storybook/catalog-hierarchy/CatalogHierarchyNuevaClase.stories.tsx` y `tests/e2e/catalogHierarchy.workstation.spec.ts` usando fakes, no autoridad `3210`: confirmar habilitación/bloqueo, payload inmutable, una mutación por submit, replay bloqueado, espera de refetch, cierre/foco/toast exactos tras `CREATED`, ausencia de inserción/ordenamiento/selección optimistas, mapeo estructurado estrecho, fallback sin texto crudo, región estable, input preservado y teclado/foco aprobado; separar explícitamente esta evidencia de la prueba disposable de permisos. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Eliminar estados y handlers muertos del flujo Clase, conservar teclado compartido y el recorrido local aprobado (Tab nativo; flechas Clave↔Nombre↔Descripción↔Cancelar y Cancelar↔Crear Clase; edición/IME, `N`, `?`, `Ctrl/Cmd+K`, `Ctrl+N` intactos) con foco sólo en diálogo activo; ejecutar la matriz enfocada, stories, `pnpm typecheck`, `pnpm build` y `git diff --check`, sin agregar contratos Familia/Tipo ni llamadas de creación contra `3210`. <!-- sdd-owner: implementation -->

## Corte local 4 — Contratos y conexión diferida de Familia/Tipo, composición workstation

**Dependencia:** Corte 3 terminado y permisos públicos disposable de `crearFamilia` y `crearTipo` verificados con `auth:none`. Los contratos frontend y la conexión siguen sin implementar y requieren una decisión explícita de apply; mientras Unit 4 permanezca diferida, Catálogo no se presenta como operativo completo.

**Inicio:** la navegación y lectura autoritativas existen y Nueva Clase está conectada sólo según Unit 3B; no existen aún contratos ni acciones públicas de creación para Familia/Tipo.

**Fin:** Unit 4A valida y, sólo con autorización, implementa los contratos API de `crearFamilia`/`crearTipo`; Unit 4B conecta sus diálogos y completa la verificación workstation. Familia/Tipo exigen padres explícitos, bloquean payload, conservan padres inmutables y releen la secuencia afectada tras `CREATED`, sin introducir Recurso ni update/activate/deactivate.

**Verificación de corte:** `pnpm test`, `pnpm test:stories`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm verify:runtime-bundle`; creación contra autoridad sólo si parent registra autorización y procedimiento no productivo. Rollback por unidad: 4A retira contratos/tipos de Familia/Tipo; 4B retira diálogo, wiring, stories y E2E, conservando lectura, Bandeja y Nueva Clase.

### Unit 4A — API contract transport de Familia/Tipo (pendiente de decisión explícita de apply)

**Inicio:** Unit 3 terminó; sólo `createClass` tiene contrato autorizado.

**Fin:** contratos fake exactos para `createFamily` y `createType`, con padres explícitos y sin llamadas conectadas; la evidencia pública disposable `auth:none` permanece separada de los tests.

#### RED

- [x] Crear primero en `tests/unit/catalogHierarchyCreation.test.tsx` los casos RED de payload para `crearFamilia` y `crearTipo`: exigir `claseRecursoId` o `familiaRecursoId` explícito, omitir el padre ausente, impedir que `crearTipo` reciba `claseRecursoId`, omitir `activo`/opcionales vacíos según la UI aprobada, preservar valores sin trim/normalización y validar `{ disposition: "CREATED", item }`; usar sólo transporte fake y mantener intacta la ausencia de update/activate/deactivate/Recurso. La cobertura específica del diálogo permanece diferida a Unit 4B y no se crea en Unit 4A. <!-- sdd-owner: implementation -->
- [x] Completar la RED de `tests/unit/catalogHierarchyCreation.test.tsx` y `tests/architecture/catalogHierarchyBoundaries.test.ts` para rechazar Familia/Tipo sin padre válido, congelar el padre capturado por solicitud y conservarlo no editable después de crear; mantener los tests sin llamadas públicas reales, separar la evidencia fake de la verificación disposable `auth:none` ya aprobada y no crear contra la autoridad `3210`. <!-- sdd-owner: implementation -->

#### GREEN

- [x] Sólo después de una decisión explícita de apply posterior a la evidencia pública disposable `auth:none`, implementar `createFamily` y `createType` con inputs/resultados mínimos en `src/features/catalog-hierarchy/catalogHierarchy.api.ts` y `src/features/catalog-hierarchy/catalogHierarchy.types.ts`; traducir 1:1 a `catalogoAdmin/jerarquia:crearFamilia`/`crearTipo`, validar `unknown`, capturar padres inmutables y no añadir update, activate, deactivate, Recurso ni atajos nuevos. <!-- sdd-owner: implementation -->
#### TRIANGULATE

- [x] Triangular la API de Unit 4A con `tests/unit/catalogHierarchyCreation.test.tsx`, `tests/unit/catalogHierarchyApi.test.ts` y `tests/architecture/catalogHierarchyBoundaries.test.ts`: exactitud 1:1 de nombres/argumentos, padres cruzados rechazados, respuesta `CREATED`, valores sin mutación y ausencia de llamadas públicas reales; citar por separado que los permisos públicos de Familia/Tipo se probaron sólo en el disposable `auth:none`. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Mantener Unit 4A en la frontera feature-first mínima, sin abstracción de transporte duplicada ni síntesis de errores/estado; ejecutar sus tests fake, `pnpm typecheck`, `pnpm lint` y `pnpm format:check`, sin desplegar ni crear Familia/Tipo contra `3210`. <!-- sdd-owner: implementation -->

### Unit 4B — UI/E2E workstation de Familia/Tipo (pendiente de decisión explícita de apply)

**Inicio:** Unit 4A asentada y autorización pública específica disponible; Nueva Clase conserva su contrato y comportamiento.

**Fin:** diálogos de Familia/Tipo usan padres no editables y payloads inmutables, bloquean la solicitud, conservan input/foco ante fallo, releen la secuencia afectada tras `CREATED` y completan la matriz workstation, sin `N` para niveles futuros ni controles administrativos excluidos.
#### GREEN

- [x] Sólo con decisión explícita de apply para Familia/Tipo, completar el surface reutilizable interno/exportado en `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`, `catalogHierarchy.css` y el ensamblaje de `CatalogHierarchyScreen.tsx` para ambos niveles con React Aria, labels visibles, padre no editable, payload inmutable, bloqueo de solicitud, input preservado ante fallo y foco restaurable; usar fakes en UI y no crear contra `3210`. <!-- sdd-owner: implementation -->

#### TRIANGULATE

- [x] Triangular Unit 4B en `tests/unit/catalogHierarchyNewClass.test.tsx`, `tests/unit/catalogHierarchyScreen.test.tsx`, `storybook/catalog-hierarchy/**`, `tests/e2e/catalogHierarchy.workstation.spec.ts` y `tests/architecture/catalogHierarchyBoundaries.test.ts` con fakes para teclado/foco/padres cruzados y E2E sólo conectado si la autorización lo permite; cubrir axe, `CREATED` con refetch, fallo neutral, Tab nativo, edición/IME, `N` sólo Nueva Clase, `?`, `Ctrl/Cmd+K`, `Ctrl+N`, ausencia de Recurso y no alterar el checkpoint visual congelado. <!-- sdd-owner: implementation -->

#### REFACTOR

- [x] Eliminar código muerto y estados inventados, repetir `pnpm test`, `pnpm test:stories`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check`, `pnpm verify:runtime-bundle` y `git diff --check`; dejar una matriz que distinga fakes, Storybook, E2E estructural y E2E conectado, sin declarar listo el cambio hasta completar y verificar Unit 4 bajo la decisión explícita de apply. <!-- sdd-owner: implementation -->

## Acciones parent-owned y diferidas — no son trabajo de implementación

Estas puertas deben permanecer separadas de los cambios de código. Ninguna se considera completada por la existencia de este plan.

- [x] Aprobar explícitamente la composición de los formularios de Clase/Familia/Tipo, labels visibles, feedback, cierre, restauración de foco y cualquier copy asociado, contrastando `openspec/changes/catalog-hierarchy-base/design.md` con `design-catalog-hierarchy-edit.op` en modo sólo lectura. Aprobado por el usuario sobre la evidencia visual final guardada con SHA-256 `e121831c829d6a300ee09990d9ca20f0838ee270413a49f63a4d505087bbcc89`; incluye padre no editable, cierre con `Escape`/Cancelar y restauración de foco al disparador. <!-- sdd-owner: parent -->
- [x] Aprobar explícitamente los tratamientos visuales y copy neutral de loading, vacío, continuación, datos parciales, error inicial, error de continuación y fallo de creación; no convertir la aprobación en una inferencia desde `api-contract.md`. Aprobado por el usuario sobre la evidencia visual final: carga sin filas ficticias, espera dependiente, vacío tras agotamiento, datos parciales preservados y reintento explícito con copy neutral. <!-- sdd-owner: parent -->
- [x] Verificar y cerrar los blockers parent-owned de mutación pública: `crearClase`, `crearFamilia` y `crearTipo` quedaron probados con `ConvexHttpClient`, `auth:none` y cero `setAuth` en un Convex `1.45.0` disposable aislado; la cadena inactiva Clase→Familia→Tipo devolvió `CREATED`, padres exactos y DTOs nominales. El entorno y una instancia previa afectada por exposición local de credencial fueron destruidos por completo, 33210/33211 quedaron cerrados y la autoridad `3210` conservó su listener original sin ser consultada ni mutada durante esta verificación. Esta evidencia no es despliegue del producto ni decisión de implementar Unit 4, no autoriza Recurso/lifecycle/update/activate/deactivate y no debe repetirse contra `3210`. <!-- sdd-owner: parent -->
- [x] Decidir antes de apply cómo se manejará el riesgo de superar 400 líneas bajo `ask-on-risk`; ejecutar cuatro cortes locales secuenciales, sin ramas remotas, commits, PRs, publicaciones ni Receipt-Driven Development. <!-- sdd-owner: parent -->

## Evidencia runtime disposable persistida

- [x] Registrar que la verificación funcional usó una copia temporal con Convex `1.45.0`, estado aislado local al cwd, puertos `33210`/`33211`, identidad `anonymous-agent` y autoridad `anonymous-sistema-garfex` mantenida en `3210`; funciones y esquema publicados sólo en el estado disposable, sin credenciales, IDs temporales ni valores de cursor persistidos como datos de producto.
- [x] Registrar lecturas administrativas vacías con `{items:[], continuationCursor:null, isExhausted:true}`; una única cadena autorizada de entidades inactivas Clase→Familia→Tipo devolvió `CREATED`, IDs únicos, relaciones padre exactas, `activo:false`, `revision:1`, coincidencia de `obtener*`, `descripcion` ausente cuando no se envió, `effective:false`, `effectiveReasons:['INACTIVE']`, y en Tipo `aggregateStatus:'NOT_EVALUATED'` y `violations:[]`.
- [x] Registrar la paginación `INACTIVE` con `pageSize:1`: primera página con el sentinel, cursor string y `isExhausted:false`; segunda página del mismo contexto vacía, cursor `null` y agotada. La longitud del cursor no es contrato. Registrar también que las mutaciones administrativas usaron auth administrativa; verificaciones disposable adicionales confirmaron por separado `crearClase`, `crearFamilia` y `crearTipo` públicas con `auth:none`, mientras cualquier creación contra la autoridad `3210` permanece fuera de alcance.
- [x] Registrar la destrucción final de los dos despliegues temporales tras las preocupaciones de credenciales: estado y credenciales destruidos, puertos cerrados, autoridad disponible y hash del worktree frontend sin cambios. No resucitar ni desplegar esos entornos.

**Evidencia pública adicional ya verificada:** en Convex `1.45.0` disposable, un `ConvexHttpClient` plano con `auth:none` ejecutó `crearClase`, `crearFamilia` y `crearTipo`; las tres devolvieron `CREATED`, items inactivos, `revision:1` y padres exactos. Los despliegues fueron destruidos y la autoridad `3210` quedó intacta. Esta evidencia no prueba update, activate, deactivate, Recurso ni un despliegue del producto.

**Totales previos preservados antes de 2B:** 29/44 tareas totales, 26/40 de implementación y 3/4 acciones parent-owned; permanecían 15 unchecked (14 de implementación y 1 parent-owned). Las nueve tareas 2A completadas y todos los checkboxes históricos permanecen sin alterar.

**Totales históricos resultantes tras añadir 2B:** 40/54 checkboxes totales, 33/46 de implementación y 3/4 acciones parent-owned; permanecían 14 unchecked (13 de implementación y 1 parent-owned). Las siete tareas de transporte/configuración estaban completadas y la única tarea visible browser/read-panel estaba unchecked; también seguían diferidas todas las tareas de Cortes 3–4.

**Totales históricos tras completar la extensión visible:** 48/61 checkboxes totales, 41/53 de implementación, 3/4 acciones parent-owned y 4/4 registros de evidencia; permanecían 13 unchecked (12 de implementación y 1 parent-owned). Las ocho tareas de Unit 1 y Unit 2 estaban completas; no eran nuevos cortes ni nuevas entregas.

**Totales autoritativos actuales tras cerrar permisos públicos:** 57/65 checkboxes totales, 49/57 de implementación, 4/4 acciones parent-owned y 4/4 registros de evidencia; permanecen 8 unchecked, todas de implementación Unit 4. Las ocho tareas de Unit 3A/3B están completadas; Unit 4A/4B siguen pendientes de decisión explícita de apply.

**Gate parent-owned:** cerrado. `crearClase`, `crearFamilia` y `crearTipo` se verificaron con `auth:none` en disposable; la autoridad `3210` no se usa para tests de creación. Esta evidencia no implementa Unit 4 ni autoriza operaciones adicionales.

## Criterio de salida del plan

La aplicación sólo puede avanzar por un corte cuando sus RED, GREEN, TRIANGULATE y REFACTOR tengan evidencia real y sus dependencias parent-owned estén satisfechas o el padre haya decidido explícitamente mantener el corte diferido. El Corte 3 entrega únicamente la creación conectada de Clase; la evidencia disposable acredita permisos de Familia/Tipo, pero no su implementación ni el cierre completo del cambio. El resultado completo no incluye Recursos ni altera Bandeja, backend, OpenPencil, recuperación visual o fixtures runtime.

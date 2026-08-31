# Tareas de implementación — bootstrap-operations-inbox

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–1.200 líneas authored; `pnpm-lock.yaml` y `src/app/routeTree.gen.ts` son generados y se cuentan aparte, pero forman parte de la identidad completa del snapshot |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → baseline/tooling; PR 2 → shell/routing; PR 3 → command overlay/keyboard; PR 4 → runtime/fixture isolation; PR 5 → Storybook populated composition; PR 6 → Playwright/accessibility; PR 7 → final quality |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

El cálculo excluye del presupuesto authored las líneas generadas del lockfile y del árbol de rutas, pero exige conservar y verificar ambos en el snapshot completo. No se elige todavía una estrategia de encadenamiento ni una excepción de tamaño: `chain_strategy=deferred` requiere decisión del padre antes de `apply`.

## Guardas de ejecución

- No ejecutar instalaciones, navegadores, builds ni commits al redactar estas tareas; el workspace actual no tiene `package.json`, tooling ni comandos ejecutables.
- Durante `apply`, la instalación inicial requerirá red y una versión exacta de pnpm: se puede usar `pnpm install` para generar el lockfile y después validar un checkout limpio con `pnpm install --frozen-lockfile`. Si la red, el store o los permisos no están disponibles, registrar la comprobación como no disponible.
- La instalación de Chromium para Playwright (`pnpm exec playwright install --with-deps chromium`) puede requerir red, permisos del sistema y dependencias OS; nunca se debe presentar como realizada si está bloqueada.
- `pnpm-lock.yaml` se genera por pnpm, no se edita manualmente. `src/app/routeTree.gen.ts` se genera por TanStack Router, se inspecciona pero no se edita a mano.
- `page04.png`, `design.op`, `docs/garfex-blanco-negativo.svg`, los demás SVG de `docs/` y la documentación de `docs/` son evidencia inmutable. No se crean directorios futuros vacíos, consumidores ficticios ni imports de TanStack Form/Table/Virtual sólo para demostrar instalación.
- Producto y documentación de implementación permanecen en español; identificadores técnicos y nombres de archivo permanecen en inglés.

## Dependencias y secuencia

Cada unidad es un límite de rollback autónomo. Las fases de comportamiento siguen RED → GREEN → TRIANGULATE → REFACTOR y mantienen sus pruebas junto al comportamiento. Una unidad posterior puede corregir una superficie anterior sólo dentro de los archivos enumerados explícitamente en esa unidad y sin ampliar el alcance.

### Unidad 1 — RED de bootstrap y baseline técnico

**Inicio:** workspace greenfield sin manifiesto ni arnés ejecutable.  
**Fin:** manifiesto/configuraciones del baseline declaradas, prueba de contrato de bootstrap pasando después de instalar; no añade comportamiento de producto.  
**Dependencias:** ninguna.  
**Superficies de edición permitidas:** `package.json`, `pnpm-lock.yaml` (generado por pnpm), `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.storybook.json`, `tsr.config.json`, `vitest.config.ts`, `vitest.storybook.config.ts`, `playwright.config.ts`, `eslint.config.js`, `prettier.config.mjs`, `.prettierignore`, `.storybook/main.ts`, `.storybook/preview.ts`, `storybook/styles.css`, `tests/setup.ts`, `tests/config/baseline.test.ts`. No crear aún componentes, rutas de producto, tablas, formularios, virtualización ni fixtures poblados.  
**Prueba enfocada:** `pnpm exec vitest run tests/config/baseline.test.ts`. Antes de instalar dependencias se espera que sea no disponible o falle por ausencia del manifiesto; registrar el resultado real.  
**Evidencia runtime:** `N/A — esta unidad sólo crea tooling y configuración; no existe todavía un shell o una ruta de producto que ejecutar.`  
**Rollback:** retirar únicamente el manifiesto, lockfile generado, configuraciones y arnés de esta lista, sin tocar evidencia congelada.

- [x] **RED:** escribir `tests/config/baseline.test.ts` para fallar ante la ausencia del manifiesto y exigir pnpm exclusivo, React major 19, dependencias obligatorias exactas, scripts contractuales, configuraciones declaradas y resolución aislada de Form/Table/Virtual sin consumidores de producto. <!-- sdd-owner: implementation -->
- [x] **GREEN:** crear `package.json` privado ESM con versiones exactas compatibles y scripts `dev`, `build`, `test`, `test:watch`, `test:stories`, `test:e2e`, `storybook`, `build-storybook`, `lint`, `format`, `format:check`, `typecheck`, `router:generate`, `router:check` y `verify:runtime-bundle`; crear las configuraciones Vite, TypeScript, TanStack Router, Vitest/RTL, Storybook, Playwright, ESLint y Prettier en las superficies permitidas. <!-- sdd-owner: implementation -->
- [x] **GREEN:** generar `pnpm-lock.yaml` con la instalación inicial fijada y verificar después con `pnpm install --frozen-lockfile`; no generar `package-lock.json`, `yarn.lock` ni bun lockfiles. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar `pnpm exec vitest run tests/config/baseline.test.ts`, `pnpm typecheck` y `pnpm lint`; comprobar que la resolución de `@tanstack/react-form`, `@tanstack/react-table` y `@tanstack/react-virtual` sólo acredita instalación y no crea imports ni consumidores ficticios. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** reducir la configuración a los límites de `src/`, `storybook/`, tests y Node; eliminar aliases, wrappers, plugins o configuraciones preventivas no exigidas y dejar documentado el fallback tipográfico `Inter, Arial, sans-serif` sin declarar Nexa/RNS Sanz como disponibles. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `frontend-foundation/spec.md` — Baseline obligatorio administrado con pnpm, Comandos operativos del baseline, Fallback tipográfico temporal divulgado, Límites feature-first y Uso proporcional del stack instalado; `config.yaml` — `strict_tdd`, testing no disponible inicialmente y contratos de scripts.

### Unidad 2 — RED/GREEN del shell y routing runtime

**Inicio:** Unidad 1 verde; no hay UI de producto.  
**Fin:** `/` redirige a `/bandeja`; el runtime muestra sólo shell workstation, identidad GARFEX, navegación persistente, Bandeja activa y región de entrada sin datos ni estados inventados.  
**Dependencias:** Unidad 1.  
**Superficies de edición permitidas:** `src/main.tsx`, `src/app/providers/AppProviders.tsx`, `src/app/router.tsx`, `src/app/routeTree.gen.ts` (sólo generado), `src/app/routes/__root.tsx`, `src/app/routes/index.tsx`, `src/app/routes/bandeja.tsx`, `src/app/shell/AppShell.tsx`, `src/features/operations-inbox/OperationsInboxEntry.tsx`, `src/shared/design-system/GarfexLogoNegative.tsx`, `src/shared/design-system/tokens.css`, `src/styles.css`, `tests/unit/appShell.test.tsx`.  
**Prueba enfocada:** `pnpm exec vitest run tests/unit/appShell.test.tsx`.  
**Evidencia runtime:** `pnpm dev --host 127.0.0.1`; abrir `/` y `/bandeja` en viewport workstation y verificar visualmente identidad, rail, topbar, Bandeja activa, heading y ausencia de filas, métricas, paneles y estados semánticos.  
**Rollback:** retirar las rutas, providers, shell, entrada de Bandeja, tokens, estilos, logo y test enumerados; conservar todo el tooling de la Unidad 1.

- [x] **RED:** escribir `tests/unit/appShell.test.tsx` con memoria de router para `/` → `/bandeja`, roles/nombres del shell, `img` oficial con alt `GARFEX`, único destino de producto Bandeja activa y aserciones de ausencia de registros, contadores, métricas, paneles, `role=status`, `aria-busy`, live regions y consultas/persistencia. <!-- sdd-owner: implementation -->
- [x] **GREEN:** implementar el arranque React 19, `AppProviders`, router y rutas mínimas; generar `src/app/routeTree.gen.ts` mediante `pnpm router:generate` y renderizar `OperationsInboxEntry` sin loader, fetch, storage, store, fixtures ni estado vacío inventado. <!-- sdd-owner: implementation -->
- [x] **GREEN:** implementar `AppShell`, tokens claros y `GarfexLogoNegative` usando por URL `docs/garfex-blanco-negativo.svg`, sin copiar SVG a JSX, recolorear, deformar ni modificar el activo. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar `pnpm exec vitest run tests/unit/appShell.test.tsx`, `pnpm router:check` y el escenario `pnpm dev --host 127.0.0.1` → visitar `/` → confirmar `/bandeja` → inspeccionar accesibilidad del shell; registrar cualquier comando bloqueado por tooling o navegador como no disponible. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** mantener Bandeja-specific en `src/features/operations-inbox`, limitar lo transversal a shell/tokens/logo/routing y eliminar enlaces futuros accionables, datos derivados de `page04.png`, efectos externos y cualquier soporte responsive, tablet, móvil o touch. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `operations-inbox/spec.md` — Ruta y shell reconocibles de Bandeja, Runtime deliberadamente incompleto y veraz, Frontera funcional de Bandeja; `frontend-foundation/spec.md` — Tema claro y activos oficiales, Límites feature-first y Ausencia de infraestructura especulativa; `design.md` — Diseño runtime, estrategia de rutas y tokens.

### Unidad 3 — RED/GREEN del overlay de comandos y arbitraje de teclado

**Inicio:** Unidad 2 verde con shell sin interacción de comandos.  
**Fin:** trigger y `Ctrl/Cmd + K` abren la misma entrada React Aria; foco entra al input, `Escape` cierra sólo el overlay y restaura foco; `Tab` sigue siendo nativo y la precedencia contextual es comprobable.  
**Dependencias:** Unidad 2.  
**Superficies de edición permitidas:** `src/app/shell/AppShell.tsx`, `src/app/shell/CommandEntry.tsx`, `src/shared/keyboard/keyboardArbitration.ts`, `src/shared/keyboard/useGlobalCommandShortcut.ts`, `tests/unit/commandEntry.test.tsx`, `tests/unit/keyboardArbitration.test.ts`. No crear catálogo, ranking, resultados, comandos ejecutables, bus global ni wrapper propio de React Aria.  
**Prueba enfocada:** `pnpm exec vitest run tests/unit/commandEntry.test.tsx tests/unit/keyboardArbitration.test.ts`.  
**Evidencia runtime:** `pnpm dev --host 127.0.0.1`; en `/bandeja`, activar el trigger, comprobar foco en input, pulsar `Escape`, comprobar foco restaurado; repetir con `Ctrl+K`/`Meta+K` y comprobar que `Tab` no es capturado.  
**Rollback:** retirar sólo `CommandEntry`, arbitraje, hook, integración del shell y ambos tests; el shell y routing de la Unidad 2 deben seguir renderizando sin overlay.

- [x] **RED:** escribir tests RTL/user-event y unitarios de arbitraje para apertura por trigger y atajo, autoFocus, contenido mínimo, foco restaurado, un solo `Escape`, `Tab`/`Shift+Tab` sin `preventDefault` y precedencia editable/IME → composite → overlay → feature → global usando eventos consumidos sintéticos, sin composites ficticios de producto. <!-- sdd-owner: implementation -->
- [x] **GREEN:** implementar `CommandEntry` con `Button`, `ModalOverlay`, `Modal`, `Dialog`, `TextField`, `Label` e `Input` directos de React Aria Components; guardar sólo en memoria el opener conectado, limpiar el input al desmontar y mostrar únicamente trigger, título, campo, ayuda neutra y cierre visible. <!-- sdd-owner: implementation -->
- [x] **GREEN:** instalar una sola escucha bubble desde el shell y delegar en `keyboardArbitration.ts`; reconocer sólo `Ctrl/Cmd + K` con modificadores exactos, ignorar IME/editables/defaultPrevented/overlay y dejar `Escape` al modal sin listener global. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar la prueba enfocada y el recorrido manual runtime de esta unidad; verificar también que `/`, `?`, flechas, espacio y Enter no adquieren handlers globales no aprobados. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** conservar `Tab` nativo, foco visible y semántica React Aria; eliminar listeners duplicados, estado persistente, efectos de red y cualquier abstracción transversal sin segundo consumidor aprobado. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `operations-inbox/spec.md` — Disparador visible de comandos, Tabulación nativa y foco visible, Escape contextual y restauración de foco, Precedencia contextual de teclado, Accesibilidad aplicable WCAG 2.2 AA; `design.md` — Entrada mínima de comandos y Arbitraje de teclado.

### Unidad 4 — RED/GREEN de aislamiento runtime/fixtures

**Inicio:** Unidades 1–3 verdes; aún no existe composición poblada.  
**Fin:** existe una frontera auditable que permite fixtures sólo en Storybook, impide imports desde runtime y falla si un build incluye sentinel o rutas de story.  
**Dependencias:** Unidad 3; usa el build Vite ya disponible.  
**Superficies de edición permitidas:** `tests/architecture/runtimeFixtureIsolation.test.ts`, `scripts/verify-runtime-fixtures.mjs`, `tsconfig.app.json`, `tsconfig.storybook.json`, `eslint.config.js`, `storybook/operations-inbox/operationsInbox.fixtures.ts`. No editar `page04.png`, `design.op`, SVG ni introducir proveedor runtime.  
**Prueba enfocada:** `pnpm exec vitest run tests/architecture/runtimeFixtureIsolation.test.ts`.  
**Evidencia runtime:** `pnpm build && pnpm verify:runtime-bundle`; inspeccionar `dist/manifest.json` y chunks para confirmar ausencia de `storybook/`, sentinel y textos exclusivos de fixtures.  
**Rollback:** retirar la prueba arquitectónica, script, reglas de frontera, fixture sentinel y ajustes de proyectos TypeScript; no retirar el runtime de las Unidades 2–3.

- [x] **RED:** escribir `tests/architecture/runtimeFixtureIsolation.test.ts` para exigir que `storybook/` quede fuera de `src/main.tsx`, rutas y providers, prohibir imports de fixtures desde runtime y prohibir consumidores de Form/Table/Virtual en `src/` y `storybook/`; preparar el sentinel sólo como evidencia de prueba. <!-- sdd-owner: implementation -->
- [x] **GREEN:** crear `storybook/operations-inbox/operationsInbox.fixtures.ts` como fuente exclusiva de datos de presentación, ajustar los límites `tsconfig.app.json`/`tsconfig.storybook.json` y añadir en ESLint la prohibición de imports runtime hacia Storybook y de los tres motores sin consumidor aprobado. <!-- sdd-owner: implementation -->
- [x] **GREEN:** implementar `scripts/verify-runtime-fixtures.mjs` para inspeccionar manifest/chunks de `dist/` y devolver código distinto de cero ante cualquier ruta de story o sentinel de fixture; mantener la entrada runtime sólo en `src/main.tsx`. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar `pnpm exec vitest run tests/architecture/runtimeFixtureIsolation.test.ts`, `pnpm build` y `pnpm verify:runtime-bundle`; confirmar que el fixture aislado se puede importar desde el futuro Storybook pero no desde el proyecto app ni desde el bundle runtime. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** eliminar cualquier barrel, alias, provider, fallback de datos o duplicación de fixture que debilite la dirección `storybook → componentes runtime` y no `runtime → storybook`; mantener la separación CSS de `storybook/styles.css`. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `operations-inbox/spec.md` — Composición poblada aprobada sólo en Storybook y pruebas, Aislamiento estricto de fixtures visuales, Verificación de separación Storybook/runtime; `design.md` — Storybook poblado y aislamiento, Imposibilidad estructural de import runtime; `frontend-foundation/spec.md` — Uso proporcional del stack instalado.

### Unidad 5 — RED/GREEN de composición Storybook aprobada

**Inicio:** Unidad 4 verde y fixture aislado disponible.  
**Fin:** Storybook muestra exclusivamente la composición poblada workstation aprobada a 1440×980, rotulada como presentación, sin habilitar capacidades de negocio.  
**Dependencias:** Unidad 4.  
**Superficies de edición permitidas:** `.storybook/main.ts`, `.storybook/preview.ts`, `storybook/styles.css`, `storybook/operations-inbox/ApprovedPopulatedInbox.tsx`, `storybook/operations-inbox/OperationsInboxApproved.stories.tsx`, `storybook/operations-inbox/operationsInbox.fixtures.ts`, `vitest.storybook.config.ts`, `tests/architecture/runtimeFixtureIsolation.test.ts` sólo si la story requiere una aserción de frontera. La story no puede importar TanStack Table/Virtual ni crear consumidores de Form/Table/Virtual.  
**Prueba enfocada:** `pnpm run test:stories`; si el script delega directamente, usar `pnpm exec vitest --config vitest.storybook.config.ts`.  
**Evidencia runtime:** `pnpm storybook -- --host 127.0.0.1 --port 6006`; abrir la story a 1440×980 y comparar lado a lado y mediante overlay al 50 % con `page04.png`, sin modificar ni generar reemplazo de la evidencia aprobada.  
**Rollback:** retirar sólo la story, componente poblado, estilos Storybook y configuración de integración de stories; conservar el sentinel y las puertas de aislamiento de la Unidad 4.

- [x] **RED:** declarar la story y su play test para fallar si faltan el título `Aprobada 1440×980 — fixtures de presentación`, la descripción de autoridad de `page04.png`, la nota accesible de fixtures y las regiones aprobadas del frame. <!-- sdd-owner: implementation -->
- [x] **GREEN:** implementar `ApprovedPopulatedInbox.tsx` y `OperationsInboxApproved.stories.tsx` con fixture local explícito para rail, topbar, indicadores, filtros, acciones, lista, panel contextual y referencia de atajos; mantener labels futuros inertes, acciones sin transiciones de negocio y tabla HTML semántica local. <!-- sdd-owner: implementation -->
- [x] **GREEN:** fijar en `.storybook/preview.ts` viewport 1440×980, fondo claro, `storybook/styles.css` separado y addon/auditoría de accesibilidad según las versiones instaladas; no añadir variantes tablet, móvil, responsive, touch, loading, vacío, error o estados no aprobados. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar `pnpm run test:stories` y la sesión `pnpm storybook -- --host 127.0.0.1 --port 6006`; verificar semántica de la tabla, rotulado de evidencia, fidelidad estructural con `page04.png` y que ninguna acción aparenta ser una capacidad runtime. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** centralizar nombres, métricas y registros únicamente en `operationsInbox.fixtures.ts`, retirar datos duplicados y conservar la story como referencia visual aislada, no como segunda autoridad de diseño ni contrato de backend. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `operations-inbox/spec.md` — Composición poblada aprobada sólo en Storybook y pruebas, Aislamiento estricto de fixtures visuales, Composición exclusivamente workstation; `design.md` — Composición aprobada, Etiquetado de aislamiento y Método de fidelidad; autoridad visual `page04.png`.

### Unidad 6 — RED/GREEN de Playwright workstation y accesibilidad

**Inicio:** Unidades 1–5 verdes; la app runtime y la story ya tienen harnesses separados.  
**Fin:** recorrido navegador real a 1440×980 acredita ruta, teclado, foco, cierre, aislamiento observable y WCAG aplicable sin introducir alcance nuevo.  
**Dependencias:** Unidad 5. Requiere navegador Chromium instalable; si `pnpm exec playwright install --with-deps chromium` no puede ejecutarse por red/permisos/dependencias OS, registrar Playwright/axe como no disponible.  
**Superficies de edición permitidas:** `tests/e2e/operationsInbox.workstation.spec.ts`, `playwright.config.ts`, `src/app/shell/AppShell.tsx`, `src/app/shell/CommandEntry.tsx`, `src/shared/keyboard/keyboardArbitration.ts`, `src/shared/keyboard/useGlobalCommandShortcut.ts`, `src/features/operations-inbox/OperationsInboxEntry.tsx`, `src/shared/design-system/tokens.css`, `src/styles.css`. Sólo se permiten ajustes necesarios para los fallos observados, no nuevas capacidades.  
**Prueba enfocada:** `pnpm exec playwright test tests/e2e/operationsInbox.workstation.spec.ts`.  
**Evidencia runtime:** el mismo comando, con `playwright.config.ts` usando `webServer`, base URL local, viewport exacto 1440×980, trace en primer retry y screenshots sólo ante fallo; cubrir `/`, `/bandeja`, Tab/Shift+Tab, trigger, Ctrl/Cmd+K, Escape, foco restaurado y axe.  
**Rollback:** retirar el spec E2E y sus ajustes exclusivos de harness/foco/contraste de las superficies enumeradas; no revertir correcciones necesarias ya cubiertas por las pruebas unitarias sin aislar primero su fallo.

- [x] **RED:** escribir el recorrido Playwright a 1440×980 y checks axe para ruta/shell, nombres accesibles, landmarks/headings, foco visible, contraste aplicable, ausencia de datos/estados runtime, tabulación nativa, atajo, Escape y restauración de foco; ejecutar sólo después de disponer del navegador y registrar el fallo real. <!-- sdd-owner: implementation -->
- [x] **GREEN:** corregir exclusivamente las superficies permitidas cualquier diferencia de navegador real en semántica, focus-visible, contraste, overlay, precedencia o restauración, sin añadir responsive, datos, loaders, estados ni acciones de negocio. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** ejecutar `pnpm exec playwright test tests/e2e/operationsInbox.workstation.spec.ts` y comparar el resultado con RTL/Vitest; comprobar manualmente el árbol accesible y que axe no sustituye la revisión de orden, contraste y significado. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** dejar el config sin proyectos móvil/tablet, sin handlers de `Tab`, sin Escape global, sin screenshots de éxito ni dependencias del Storybook para el recorrido runtime; documentar cualquier limitación del navegador o del entorno. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `operations-inbox/spec.md` — Cobertura verificable de Bandeja workstation, Accesibilidad aplicable WCAG 2.2 AA, Tabulación nativa y foco visible, Escape contextual; `design.md` — configuración de Playwright, separación runtime/Storybook y límites workstation; `config.yaml` — comandos E2E y reporte veraz.

### Unidad 7 — TRIANGULATE final y puerta de calidad

**Inicio:** Unidades 1–6 completadas o con bloqueos registrados.  
**Fin:** snapshot completo verificable, sin evidencia congelada modificada, sin archivos de lock alternativos y con todos los estados de comandos reportados verazmente.  
**Dependencias:** todas las unidades anteriores.  
**Superficies de edición permitidas:** no se autoriza código nuevo por esta unidad; si una puerta falla, la corrección vuelve a la unidad propietaria y sólo puede tocar sus superficies enumeradas. Los artefactos generados permitidos son `pnpm-lock.yaml`, `src/app/routeTree.gen.ts`, `dist/`, `storybook-static/` y cobertura temporal, sin versionar salidas de build salvo que el repositorio lo exija explícitamente.  
**Prueba enfocada:** `pnpm router:check && pnpm exec vitest run tests/config/baseline.test.ts tests/unit/appShell.test.tsx tests/unit/commandEntry.test.tsx tests/unit/keyboardArbitration.test.ts tests/architecture/runtimeFixtureIsolation.test.ts`.  
**Evidencia runtime:** `pnpm build && pnpm verify:runtime-bundle`; complementar con `pnpm build-storybook` y la revisión de la story a 1440×980.  
**Rollback:** borrar únicamente salidas generadas y devolver cada corrección fallida a su unidad; no revertir ni modificar `page04.png`, `design.op`, SVG o documentación congelada.

- [x] **TRIANGULATE:** ejecutar la batería enfocada y registrar salida/código real de `pnpm test`, `pnpm test:stories`, `pnpm test:e2e`, `pnpm verify:runtime-bundle`, `pnpm build-storybook`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm router:check`. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** verificar con `git diff --exit-code -- page04.png design.op docs/garfex-blanco-negativo.svg docs/garfex-color-positivo.svg docs/garfex-g-blanco-negativo.svg docs/garfex-g-color-positivo.svg docs/garfex-g-negro-positivo.svg docs/garfex-negro-positivo.svg docs/erp-first-stage-design-brief.md docs/manual_identidad_garfex_ai_canonico_v2_digital.md` que ninguna evidencia congelada fue alterada y revisar que no aparezcan lockfiles alternativos. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** corregir sólo en la unidad dueña los fallos encontrados, regenerar lockfile/route tree cuando corresponda y repetir las puertas afectadas; no ocultar deriva generada, warnings de lint, formato pendiente, falta de navegador o comandos no disponibles. <!-- sdd-owner: implementation -->

**Referencias de aceptación:** `frontend-foundation/spec.md` — Verificación estricta y reporte veraz y todos los contratos del baseline; `operations-inbox/spec.md` — Cobertura verificable y separación Storybook/runtime; `config.yaml` — puertas `pnpm test`, `pnpm build`, lint, formato, typecheck y cobertura mínima.

## Verificación local y límites de entrega

Estas acciones no implementan código. La primera bloquea `apply` porque el pronóstico es High y la entrega es `ask-on-risk`; las restantes son comprobaciones locales y de ciclo de vida posteriores a la implementación. Toda verificación se realiza en el workspace mediante diffs, estadísticas, pruebas y evidencia runtime.

- [x] Antes de `apply`, decidir si se mantiene una entrega única o se propone encadenar el trabajo; el usuario autorizó dividir la implementación existente en commits locales por work unit, sin remoto, PRs ni push. <!-- sdd-owner: parent -->
- [x] Después de cada Unidad 1–7, inspeccionar `git diff --stat` y `git diff --name-only` frente a las superficies de edición permitidas enumeradas en esa unidad, incluyendo únicamente `pnpm-lock.yaml` y `src/app/routeTree.gen.ts` cuando la unidad los declara generados. <!-- sdd-owner: implementation -->
- [x] Para cada Unidad 1–7, registrar el resultado real de su prueba enfocada y evidencia runtime, marcar honestamente como no disponible lo bloqueado por instalación, navegador, red o permisos, y confirmar el límite de rollback descrito en su sección `Rollback`. <!-- sdd-owner: implementation -->
- [x] Mantener la secuencia de escritor único: no comenzar una unidad posterior ni editar superficies de otra unidad hasta cerrar la verificación local de la unidad anterior; cualquier corrección vuelve a la unidad propietaria y respeta sus rutas permitidas. <!-- sdd-owner: implementation -->
- [ ] En el cierre local, confirmar el presupuesto authored de 400 líneas, la identidad completa con lockfile y route tree generados, la inmutabilidad de `page04.png`, `design.op`, SVG y documentación congelada, todos los resultados de comandos reportados verazmente y la ausencia de commits, ramas o PRs no autorizados. <!-- sdd-owner: parent -->
- [ ] Cerrar el cambio únicamente con los bloqueos de instalación, navegador, red o permisos documentados y con las brechas de diseño futuras explícitamente fuera de alcance. <!-- sdd-owner: parent -->

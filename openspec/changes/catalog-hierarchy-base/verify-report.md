# Verify report — catalog-hierarchy-base

## Estado

**FAIL — la implementación y la matriz ejecutable conservan evidencia GREEN, pero queda un blocker CRITICAL de Strict TDD histórico.**

La remediación documental resolvió los otros dos defectos del verify fallido `sha256:5d1548...4308`: la tarea checked de Unit 4B ahora referencia tests reales y el checkpoint registra comandos, conteos, salida y orden durable de los RED de Unit 4B1/4B2. No se infirió evidencia ausente. La RED histórica inicial de foundation/ruta/shell sigue sin existir y bloquea un PASS limpio y el archivo.

## Estado estructurado y actionContext

- Cambio activo: `catalog-hierarchy-base`; selección no ambigua.
- Artifact store: `openspec`.
- Apply state observado: `all_done`.
- Action context: `mode=repo-local`; `workspaceRoot` y único `allowedEditRoot`: `/home/garfex/PROGRAMACION/sistema-ui-garfex`; `warnings=[]`.
- Ownership/workspace: los tres artefactos autorizados y todas las rutas de tests reconciliadas pertenecen al workspace permitido.
- Intento nativo ordinal 27 ya estaba activo en revisión `sha256:26abe3...f41a`; esta remediación no adquirió, inició, asentó, finalizó, reseteó ni reencuadró lifecycle.
- Restricción respetada: sólo se escribieron `tasks.md`, `apply-progress.md` y este `verify-report.md`; no se modificaron código, tests, backend, configuración, OpenPencil ni autoridad.

## Blocker exacto

1. **CRITICAL — RED histórica inicial no disponible.** Los registros iniciales de `apply-progress.md` declaran explícitamente que la evidencia RED histórica no estaba disponible para foundation/contexto y frontera de ruta/shell. La RED correctiva posterior de foco no demuestra el RED original de esos comportamientos. Los tests retrospectivos, los GREEN actuales y la evidencia recuperada de Unit 4B tampoco pueden sustituir cronología histórica inexistente.

**Archive readiness:** bloqueado únicamente por este punto. Una excepción retrospectiva no convierte el ciclo incompleto en Strict-TDD PASS.

## Hallazgos remediados

1. **RESOLVED — referencia checked inexistente.** La línea TRIANGULATE de Unit 4B en `tasks.md` reemplazó `tests/unit/catalogHierarchyCreationDialog.test.tsx` por los equivalentes reales `tests/unit/catalogHierarchyNewClass.test.tsx` y `tests/unit/catalogHierarchyScreen.test.tsx`, conservando `[x]`. `tests/unit/catalogHierarchyCreation.test.tsx` queda registrado en `apply-progress.md` como safety net de transporte/payload.
2. **RESOLVED — RED final Unit 4B no auditable.** El checkpoint más reciente de `apply-progress.md` transcribe desde sesiones durables la cronología exacta de Unit 4B1 y Unit 4B2. Unit 4B1 registra dos RED del mismo focused Vitest (**3 failed/16 passed**, luego **2 failed/17 passed**) antes de **19/19** y **41/41** GREEN. Unit 4B2 registra Storybook **1 failed/2 passed**, el E2E Catalog **1 failed/2 passed**, los focused E2E **1/1** fallidos hasta GREEN, arquitectura **2 failed/8 passed** hasta **10/10**, focused **61/61**, y el fallo/corrección de typecheck.

La recuperación incluye la salida durable del toast de éxito de Familia que “intercepts pointer events”, los fallos repetidos `Expected: 0 / Received: 1` al cerrar por Escape y sus posiciones relativas. No se reconstruyeron conteos por inferencia.

## Cobertura de especificación y diseño

La remediación no cambió implementación ni tests. Se conserva la verificación ejecutable independiente del reporte anterior:

| Área | Resultado vigente | Evidencia |
|---|---|---|
| Shell, `/catalogo` y convivencia con Bandeja | PASS funcional | Unit/RTL, router check y Playwright completo previamente verdes |
| Orden Clase → Familia → Tipo y resets | PASS funcional | State/screen tests y rechazo de contexto cruzado |
| Listados, cursores, stale guard, dedupe y estados parciales | PASS funcional | API/useCatalogList/screen/integración |
| Creación, payloads y padres inmutables | PASS funcional | Contratos, RTL y E2E interceptado |
| Refetch-before-close, submit único y errores seguros | PASS funcional | RTL y E2E interceptado |
| Keyboard First y accesibilidad | PASS funcional | Unit/arquitectura/E2E, Storybook y axe |
| Aislamiento runtime y exclusiones | PASS funcional | Guards, build y runtime-bundle previos |
| Strict-TDD histórico inicial | **FAIL documental** | RED original de foundation/ruta/shell ausente |

## Tareas

- Recuento canónico en `tasks.md`: **65 total, 65 `[x]`, 0 `[ ]`**.
- Líneas exactas unchecked `- [ ]` en `tasks.md`: **ninguna**.
- La línea Unit 4B corregida conserva su estado checked.
- Los snapshots unchecked antiguos dentro del registro acumulativo de `apply-progress.md` son historial de planes previos; el checkpoint más reciente los declara superseded y no son el artifact canónico de tareas.

## Strict TDD compliance

| Check | Resultado | Detalle |
|---|---|---|
| `TDD Cycle Evidence` presente | PASS | Existen tablas acumulativas y checkpoint documental Unit 4B |
| Test files referenciados existen | PASS | Los tests Unit 4B canónicos reconciliados existen |
| RED Unit 4B verificable | PASS | Comandos, fallos, conteos y orden recuperados de sesiones durables |
| RED foundation/ruta/shell verificable | **FAIL CRITICAL** | El propio registro histórico declara la evidencia no disponible |
| GREEN actual | PASS con evidencia previa | Focused 141/141; Vitest 162/162; Storybook 3/3; E2E 11/11; no rerun documental |
| TRIANGULATE | PASS funcional | API, UI, teclado, errores, autoridad, Storybook, axe y aislamiento |
| REFACTOR/quality | PASS con evidencia previa | Typecheck, lint, format, build, router, bundle y whitespace verdes |
| Coverage | SKIPPED | No existe herramienta/script de coverage configurado |

### Assertion quality

No se cambiaron tests y no apareció un nuevo defecto CRITICAL de assertion quality. Se conservan los WARNING previamente auditados: selectores de estructura/clases en `tests/unit/catalogHierarchyNewClass.test.tsx` y aserciones CSS directas de color/outline en `tests/e2e/keyboard-first-spatial-navigation.spec.ts`. Sirven al contrato visual, pero permanecen acoplados a detalles CSS.

## Review workload / PR boundary

- Forecast: riesgo agregado High; unidades locales secuenciales; `Chained PRs recommended: No`; `Chain strategy: not-applicable/deferred`.
- Unit 4B1 quedó registrado en 400 líneas efectivas y Unit 4B2 en 312/400 para su slice separado.
- No se usó `size:exception`; no se observó mezcla de slices ni scope creep funcional.
- Esta remediación fue exclusivamente documental y no creó commit, rama, PR, push, publicación, review/RDD ni delivery gate.

## Comandos y validaciones

Por instrucción, **no se rerun la matriz de 176 tests ni ningún test, build, linter, typecheck, Storybook, Playwright o llamada conectada**. La evidencia ejecutable vigente procede del verify anterior y no fue presentada como ejecución nueva:

| Comando previo | Resultado persistido |
|---|---|
| Focused Vitest de cambio | PASS — 141/141 |
| `pnpm test` | PASS — 17 files, 162/162 |
| `pnpm test:stories` | PASS — 3/3 |
| `pnpm exec playwright test tests/e2e/catalogHierarchy.workstation.spec.ts` | PASS — 3/3 |
| `pnpm test:e2e` | PASS — 11/11 |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check`, `pnpm verify:runtime-bundle`, `git diff --check` | PASS |

Validaciones ejecutadas en esta remediación: lectura estática de las sesiones JSONL durables; comprobación de existencia de los tests reconciliados; recuento de checkboxes; búsqueda de la referencia canónica obsoleta; comprobación de scope documental; y auditoría de whitespace. No hubo red ni mutación.

| Comando estático ejecutado | Resultado |
|---|---|
| `python3` sobre `tasks.md` para contar `- [x]`/`- [ ]` y buscar la referencia checked obsoleta | PASS — `checked: 65`, `unchecked: 0`, `obsolete_checked_ref: False` |
| `test -f tests/unit/catalogHierarchyNewClass.test.tsx && test -f tests/unit/catalogHierarchyScreen.test.tsx && test -f tests/unit/catalogHierarchyCreation.test.tsx` | PASS — los tres tests reales existen |
| `grep -nE '^### Unit 4B documentary reconciliation|^#### Unit 4B1 exact chronology|^#### Unit 4B2 exact chronology|initialRouteShellHistoricalRed' openspec/changes/catalog-hierarchy-base/apply-progress.md` | PASS — checkpoint y blocker aparecen en líneas 1273, 1277, 1288 y 1330 |
| `git diff --check -- openspec/changes/catalog-hierarchy-base/tasks.md openspec/changes/catalog-hierarchy-base/apply-progress.md openspec/changes/catalog-hierarchy-base/verify-report.md` | Sin salida; los artefactos son untracked, por lo que se complementó con auditoría Python directa |
| `python3` sobre los tres artefactos para detectar trailing whitespace y final newline ausente | PASS — `no documentary whitespace defects` |
| `git status --short -- openspec/changes/catalog-hierarchy-base/tasks.md openspec/changes/catalog-hierarchy-base/apply-progress.md openspec/changes/catalog-hierarchy-base/verify-report.md` | Los tres artefactos aparecen `??`; no se ejecutó add/commit |

## Resultado y siguiente acción

**Resultado verify: FAILED.** Los defects documentales de Unit 4B quedaron resueltos y la capacidad conserva evidencia ejecutable PASS, pero el blocker histórico inicial permanece CRITICAL. Siguiente recomendación: `maintainer-decision`; no archivar. El maintainer debe mantener el cambio bloqueado o aprobar explícitamente una excepción documental de proceso, entendiendo que esa excepción no equivale a Strict-TDD PASS y que ningún rerun retrospectivo puede crear la RED histórica ausente.

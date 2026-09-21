# Verificación — compras-partidas-vinculacion

## Veredicto: FAIL

La verificación solicitada se completó contra propuesta, spec, diseño, tareas, progreso y candidato staged. Las pruebas existentes pasan, pero el candidato no satisface todos los requisitos: faltan inspección de la relación completa, búsqueda de Productos de Proveedor y explicación contractual de relaciones nulas; además, esperar `refetch()` no confirma una relectura exitosa. Estos hallazgos impiden certificar la corrección completa del candidato, independientemente de los fallos externos de gates.

**No están todos los gates verdes.** El resultado agregado histórico de `pnpm test` sigue siendo **exit 1**, y `pnpm format:check` sigue siendo **exit 1**. La ejecución nueva de tests no sustituye ni borra el resultado anterior.

## Estado estructurado, autoridad y alcance

- Se consumió `gentle-ai.sdd-status` v2 para este change, store `openspec`, `applyState: all_done`, `verify: ready`, `archive: ready`, `nextRecommended: archive`, `blockedReasons: []`.
- `actionContext.mode: repo-local`; workspace y único allowed edit root: `/home/garfex/PROGRAMACION/sistema-ui-garfex`. Todos los paths staged resuelven dentro de esa raíz; no hay ambigüedad de ownership ni de change.
- Esta verificación es un diagnóstico opcional. **La recomendación nativa permanece `archive`**: el FAIL no modifica el estado nativo ni crea un bloqueo de admisión de archive. Archivar registraría los hallazgos reales, no certificaría entrega. No se ejecutó archive.
- Único archivo de trabajo escrito por esta fase: este `verify-report.md`. Sin correcciones de source/tests, staging, commit, creación/cambio de branch, push, PR, native review ni acciones de entrega.
- Se usó CodeGraph antes de la inspección estructural y se leyeron directamente todos los artefactos OpenSpec, incluido el progreso histórico y sus supersesiones.
- `skill_resolution: fallback-path`: skill de fase `/home/garfex/.agents/skills/sdd-verify/SKILL.md`, protocolo compartido y guía global strict-TDD; skill GARFEX del path disponible. El próximo despacho debería inyectar los paths seleccionados.

## Hallazgos que impiden un PASS

### F1 — CRITICAL: no se muestra ni relee la relación Producto de Proveedor → Recurso Maestro

`src/features/compras/CompraDetalleStage.tsx:16-24,90-147,195-208,270-282` sólo recibe operaciones de compra/líneas/mutaciones. La región de relación muestra `supplierProductId`, badge y acciones, pero nunca llama `getSupplierProduct`, nunca resuelve su `resourceId` y nunca presenta el recurso vinculado. Su Query sólo lee compra y líneas; los callbacks posteriores repiten esas dos lecturas.

Incumple el requisito **Inspección y reutilización de relaciones existentes**, escenario **Relación existente visible**, y diseño §9 para `VINCULADO`. También deja incompleta la relectura de relación exigida después de link/unlink. Las pruebas de detalle verifican el ID de producto y el badge, no la cadena completa; por ello pasan pese a esta omisión.

### F2 — CRITICAL: búsqueda/reutilización de Productos de Proveedor no accesible desde la UI

`compras.api.ts:238-253` implementa list/find/get y `useSupplierProductsRestWindow.ts` implementa la ventana acotada, pero ningún componente de Compras monta esa ventana ni llama find/get. `VincularPartidaSurface.tsx:38-132` selecciona únicamente Recursos Maestro para un producto ya identificado.

La búsqueda de **proveedores** en `ElegirProveedorStage` no equivale a buscar **Productos de Proveedor**. El escenario **Búsqueda sin vinculación automática** no tiene recorrido implementado. No se debe resolver este hallazgo inventando una asignación Partida → Producto para IDs nulos: G3 sigue vigente.

### F3 — CRITICAL: relación nullable bloqueada sin la explicación contractual requerida

`CompraDetalleStage.tsx:104,127-136` muestra `Sin producto de proveedor` y, cuando corresponde, `Marcar como no aplicable`. Correctamente no permite seleccionar/vincular recurso ni simula `VINCULADO`, pero no explica que falta la operación contractual para asociar la partida a un producto existente. Esa explicación es un SHALL explícito del requisito **Partidas sin Producto de Proveedor asociado**. La superficie G2 de pendientes explica otro contrato y no sustituye esta información contextual G3.

### F4 — CRITICAL: confirmación autoritativa incompleta ante error de relectura

`ComprasScreen.tsx:78-90` publica `Historial del proveedor actualizado.` **antes** de esperar `refetchActive()`. Ese callback y `CompraDetalleStage.tsx:279-281` esperan `query.refetch()` sin comprobar el resultado ni exigir que rechace errores.

Un probe read-only con la versión instalada de TanStack Query confirmó: `DEFAULT_REFETCH_RESOLVES error ERROR reread failed`. Por defecto, `refetch()` resuelve un resultado con error. Por tanto, una importación confirmada seguida de una lectura fallida puede conservar feedback falso de historial actualizado y cerrar el diálogo. En detalle, la relectura fallida entra en el error general y desmonta las acciones, sin preservar la confirmación pendiente/reintentable del diálogo. No se inventan badges optimistas, pero no se garantiza el contrato de cierre tras relectura exitosa. Las pruebas actuales cubren relectura pendiente y exitosa, no este fallo posterior a una mutación aceptada.

### F5 — CRITICAL: evidencia incremental strict-TDD incompleta para U7A2

`apply-progress.md`, sección **U7A2 apply** y su tabla, declara expresamente que sólo conserva el RED histórico combinado de módulo ausente, que no hubo RED nueva de U7A2 y que las aserciones incrementales se agregaron contra el candidato restaurado. Se preserva esa evidencia histórica sin inventar otra; no demuestra que las aserciones específicas de mutación U7A2 fallaran antes de incorporar ese incremento, como exige su tarea RED marcada completa. No se pide fabricar una RED retroactiva: hace falta reconciliar honestamente la evidencia/limitación. El GREEN actual sí está confirmado.

## Cobertura de requisitos y diseño

| Requisito / dimensión | Resultado y evidencia |
| --- | --- |
| Importación creada/idempotente/rechazada | API y RTL cubren multipart `file`/actor/branch opcional/signal, sin Content-Type manual; 201/200 y `alreadyExisted`, 409/422 y error accesible. Actor se resuelve mediante `withRestActor` antes de transportar. Refresh sólo para proveedor vigente. **Parcial por F4**. |
| Historial acotado a proveedor | PASS: selección explícita antes de compras, contexto comercial/fiscal/interno visible, título por proveedor, offset/limit y flags backend, reset de selección/contexto. Sin tabla global ni barrido. `comprasScreen`, `elegirProveedorStage`, `historialComprasStage`, `comprasNavigation` y ambos RestWindow tests. |
| Ventanas autoritativas | PASS dentro de los casos probados: IDs y paginación en query key, AbortSignal, disable sin proveedor incluso callbacks, replacement sin acumulación, placeholder sólo del mismo proveedor, errores inicial/navegación, retry, callbacks stale/unmount. La ventana de productos está aislada pero no integrada: F2. |
| Detalle documental inmutable / precisión | PASS para campos XML/fiscales/comerciales exigidos: series/folio/UUID/fecha/moneda/cambio/totales/emisor/sucursal/hash/filename/importación y todos los campos XML de partida. No inputs editables. DTOs preservan IDs y decimales string; historia agrupa dígitos con operaciones string y detalle muestra strings exactos. No cálculo binario, descarga XML ni endpoint inventado. |
| Selección/detalle/back | PASS: detalle sólo tras seleccionar compra, ID exacto y mismo signal para compra/líneas, carga/error/retry/empty, foco, back a historial y reset por proveedor. El estado de detalle vive en `selectedPurchaseId`, no en la unión del modelo; variación local sin cambio observable. |
| Cuatro estados perceptibles | PASS: unión exacta, textos Pendiente/Vinculado/Conflicto/No aplica, `role=status`, `Estado: …`, región distinta de XML. Clases exactas del diseño: warning/success/primary/neutral. Sólo dos tokens warning aprobados, mapeados y documentados. |
| Inspección/reutilización de relaciones | FAIL: F1 y F2. La existencia de adapters y tests aislados no acredita el recorrido de producto/recurso. |
| Vinculación confirmada | Payload/selección explícita/busy/actor/error/espera del callback/no optimismo: PASS en RTL/API. Relectura de relación y error posterior: F1/F4. |
| Desvinculación confirmada | Confirmación y payload exacto, no POST al abrir/cancelar, backend decide VINCULADO→PENDIENTE: PASS en RTL/API. Relectura de relación/error posterior: F1/F4. |
| NO_APLICA / CONFLICTO | Matriz implementada y 8 combinaciones probadas; setter sólo envía NO_APLICA en UI, producto opcional, texto explícito no aplicable, sin causa de conflicto inventada. Limitación de relectura: F4. |
| Nullable / G3 | Selección/vínculo bloqueados correctamente, sin sustitución mediante estado; falta explicación: F3. |
| Pendientes transversales / G2 | PASS: superficie siempre visible en las tres etapas, presentacional, status/live polite, explicación y orientación al historial, sin resultados/listas/controles/red propia. RTL y E2E. No ruta/sidebar adicional. |
| REST / arquitectura / no objetivos | PASS por inspección y guardas: siete GET publicados y cuatro operaciones mutantes, URLs codificadas, Zod local, errores con status/code/detail, sin alta de productos, matching, equivalencias, cascadas optimistas, persistencia, fixtures runtime, stores/facades ni endpoints globales inventados. OpenAPI externo no fue revalidado en vivo; se contrastó con el contrato publicado en los artefactos. |
| AppShell / teclado / DS | PASS para wiring solicitado: Link `/compras`, `sidebar.compras`, índice 3 y Catálogo 4, topbar y activeSurface, Enter/arrow/Home/End, placeholders de Configuración preservados. Reutiliza PageHeader/WorkCard/Button/Dialog/StagedSearchSelector; sin listeners globales nuevos ni CSS de feature. RTL no equivale a auditoría visual integral WCAG. |
| Pending/error/StrictMode | Las cuatro superficies bloquean confirmación duplicada/Escape/cancel mientras mutan, esperan callback, muestran errores reintentables y protegen completions tras desmontaje. StrictMode setup restablece mountedRef. Cobertura de error post-mutación incompleta: F4. |

### Matriz observada de acciones

| Producto | Estado | Acciones |
| --- | --- | --- |
| null | PENDIENTE o CONFLICTO | Sólo NO_APLICA |
| null | VINCULADO o NO_APLICA | Ninguna |
| identificado | PENDIENTE o CONFLICTO | Link y NO_APLICA |
| identificado | VINCULADO | Unlink |
| identificado | NO_APLICA | Ninguna; texto no aplicable |

La matriz está probada sin llamadas prematuras. No acredita la inspección del recurso ausente de F1.

## Tareas, workload e integridad

- Escaneo de `tasks.md`: **83/83 checkboxes marcados**, 80 implementation y 3 parent. **No quedan líneas que coincidan con `^\s*- \[ \]`**. Las líneas pendientes en secciones antiguas de apply-progress son historia, no tareas actuales. Completar checkboxes no demuestra requisitos omitidos.
- Inventario comprobado: **44 archivos staged, 5.557 inserciones y 22 eliminaciones**. Son source/tests más documentación/tokens/registro generado autorizados, no literalmente 44 archivos exclusivamente source/test. Hay 21 archivos de pruebas.
- `git diff --exit-code` permanece vacío: los archivos ejecutados coinciden con el índice. OpenSpec continúa **untracked/unstaged**; ningún OpenSpec aparece en `git diff --cached --name-only`. Sin delta unstaged de routeTree.
- HEAD: `c9883e6900396ed4159fcddd4a28e6b582b29302`; branch existente: `experiment/backend-integration`. SHA-256 del índice antes/después de los checks: `2678f44ef43f804dca0f75ec0294f7572899195d407621dbfb5708d7df3987d4`.
- Forecast: riesgo agregado High, estrategia `ask-on-risk`, cadena `feature-branch-chain` registrada como confirmada; sin `size:exception`. No se autoriza entregar todo el agregado como un único PR sub-400.
- Los **cierres aceptados** registrados permanecen <400: U1A 399; U1B 352; U2A 356; U2B 319; U3A 153 de diff/220 con contabilidad de split; U3B1 399; U3B2 273; U4A 398; U4B 399; U5 108; U6A 119; U6B1 389; U6B2 128; U7A1 399; U7A2 367; U7B 221; U8A 301; U8B 353; U8C **243 additions+deletions** (el mismo párrafo también dice 234; se usa la suma explícita 45+7+189+2); U9 registrado <400 en sus cinco paths, sin cifra exacta publicada en esa sección. Correcciones independientes de ventanas: 84 y 66; lint final: 20.
- No sería correcto decir que **todos los intentos** siempre estuvieron <400: el historial conserva intentos combinados sobre presupuesto y sus splits/supersesiones. Tampoco se puede recalcular cada índice intermedio desde el único índice agregado actual. La confirmación histórica de límites se apoya en los conteos y cierre del parent registrados; U9 carece de número exacto independiente en el progreso. Advertencia de trazabilidad, no excepción inferida.
- No se observó ni ejecutó entrega no autorizada. La evidencia histórica declara verificaciones por slice y staging controlado por el parent; no implica commits/PRs ni revisión nativa.

## Comandos ejecutados en esta verificación

### Remediación: comandos exactos del candidato

Todos devolvieron **exit 0**:

```sh
pnpm exec eslint src/features/compras/compras.api.ts src/features/compras/useSupplierProductsRestWindow.ts src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/comprasApiReads.test.ts tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx
pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/useResourcesMasterRestWindow.test.tsx --reporter=dot
pnpm typecheck
pnpm exec prettier --check src/features/compras/compras.api.ts src/features/compras/useSupplierProductsRestWindow.ts src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/comprasApiReads.test.ts tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx
git diff --check -- src/features/compras/compras.api.ts src/features/compras/useSupplierProductsRestWindow.ts src/features/compras/useSupplierPurchasesRestWindow.ts tests/unit/comprasApiReads.test.ts tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx
```

Resultado enfocado: **7 archivos, 57/57 tests**; ESLint 0 errores/0 warnings; Prettier correcto. El diff unstaged vacío no sustituye el control staged: ambos se ejecutaron abajo.

### Gates completos: separar historia de nueva ejecución

| Comando exacto | Agregado final ya registrado en apply-progress | Nueva ejecución verify |
| --- | --- | --- |
| `pnpm test` | **exit 1**, 911 pass/1 fail en `tests/unit/useCatalogAttributeCreation.test.tsx:222`; rerun aislado registrado **15/15** | **exit 0**, 108 archivos, **912/912**; no borra el exit 1 histórico |
| `pnpm typecheck` | exit 0 | exit 0 |
| `pnpm lint` | exit 0 tras corrección de 20 líneas | exit 0 |
| `pnpm format:check` | **exit 1**, 14 archivos externos sin modificar | **exit 1**, mismos 14 archivos |
| `pnpm build` | exit 0 | exit 0, warnings de anotaciones Zod/Rollup y chunk >500 kB |
| `pnpm router:check` | exit 0 | exit 0 |
| `pnpm exec playwright test tests/e2e/compras.spec.ts` | 1/1 pass | exit 0, **1/1 pass** |
| `git diff --check` | exit 0 | exit 0 |
| `git diff --cached --check` | exit 0 | exit 0 |

También: `git diff --cached --name-only -z | xargs -0 pnpm exec prettier --check` — **exit 0**, los 44 paths del candidato están formateados.

Se comprobaron bytes contra HEAD: el test flaky y los 14 archivos con formato fallido están sin cambios. El fallo histórico de tests corresponde a `aborts a pending search on unmount and ignores its late response`; el rerun 15/15 registrado respalda la clasificación flaky, no convierte su ejecución agregada fallida en exit 0. La nueva ejecución conservó los warnings no fatales de React sobre `stopPropagation` y claves de lista en tests externos.

Archivos externos de `format:check`, preservados sin cambios:

```text
src/features/proveedores/ImportarProveedorSurface.tsx
src/features/proveedores/proveedores.api.ts
src/features/resources-master/resourceCreationWizard.types.ts
src/features/resources-master/useResourceCreationSubmit.ts
src/features/resources-master/useResourceCreationUnits.ts
tests/e2e/proveedores.workstation.spec.ts
tests/unit/crearRecursoSurfaceContractPending.test.tsx
tests/unit/importarProveedorSurface.test.tsx
tests/unit/proveedoresApi.test.ts
tests/unit/resourceAttributeDisplay.test.ts
tests/unit/resourceCreationContextStage.test.tsx
tests/unit/useResourceCreationEffectiveAttributes.test.ts
tests/unit/useResourceCreationSubmit.test.ts
tests/unit/useResourceCreationUnits.test.ts
```

Probe read-only de F4, **exit 0** (sin crear test ni modificar archivos):

```sh
node --input-type=module - <<'JS'
import { QueryObserver, QueryClient } from '@tanstack/react-query';
const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
let fail = false;
const observer = new QueryObserver(client,{queryKey:['verify-refetch-contract'],queryFn: async()=>{if(fail) throw new Error('reread failed');return 'confirmed-before-mutation'}});
const stop = observer.subscribe(()=>{});
await observer.refetch(); fail=true;
try { const result = await observer.refetch(); console.log('DEFAULT_REFETCH_RESOLVES',result.status,'ERROR',result.error?.message); } catch(e) { console.log('DEFAULT_REFETCH_REJECTS',e.message); }
stop();client.clear();
JS
```

## Strict TDD y calidad de aserciones

- `strict_tdd: true` confirmado en config/tasks; guía global cargada, sin override local disponible. Existen tablas `TDD Cycle Evidence`, RED históricos y correcciones RED→GREEN, safety nets, triangulación y límites por slice. Los archivos de prueba actuales referenciados existen y se ejecutaron; paths históricos removidos/superseded no se presentan como tests actuales.
- GREEN actual confirmado para todos los tests del candidato. No se fabricaron ni rerunearon RED artificiales. **No se certifica cumplimiento TDD íntegro por F5**; la evidencia original combinada de U7A2 se conserva pero no prueba el orden del incremento posterior.
- Distribución de los 21 archivos changed de prueba: **3 unit/API/model, 15 tests**; **13 RTL/hook/router, 121 tests**; **4 guardas arquitectónicas, 21 tests**; **1 E2E, 1 test**. Total del candidato: **158 tests**; los 157 de Vitest están incluidos en el agregado 912. Los 57 enfocados incluyen además el RestWindow de Resources sin modificar.
- Se inspeccionaron todos los archivos de prueba changed. No se encontraron tautologías ni ghost loops nuevos: los loops relevantes usan casos literales no vacíos o tienen aserciones de cardinalidad independientes. Los asserts de número de llamadas asociados a payload/ausencia de mutación y abort son contratos observables, no se descartaron como mero detalle interno.
- **WARNING de acoplamiento CSS**: `tests/unit/partidaEstadoBadge.test.tsx:48-59` verifica `inline-flex`, `border` y clases; `tests/unit/partidasPendientesBlockedSurface.test.tsx:15-20` verifica clases de presentación. Las clases semánticas del badge son un contrato explícito del diseño, pero las aserciones de layout no acreditan comportamiento. Ambos archivos también contienen asserts funcionales/accesibles; no se cuentan como cobertura conductual sólo por CSS.
- **WARNING de cobertura**: `compraDetalleStage.test.tsx` cubre badges, ID de producto, matriz y relectura exitosa, pero omite F1/F3/F4; no hay integración del escenario F2. Los fixtures parciales/casts permiten que las pruebas pasen sin ofrecer siquiera `getSupplierProduct` al detalle.
- **WARNING de alcance E2E**: el único escenario Playwright sólo visita `/compras` y verifica la superficie G2. No ejecuta selección→importación→detalle→resolución con backend. Ese journey completo no está demostrado en navegador; no se reinterpretó 1/1 como cobertura integral.
- Coverage porcentual omitido: config declara que no hay script dedicado; no se instaló tooling. No se ejecutó Storybook ni auditoría visual/manual completa de contraste/WCAG; accesibilidad acreditada sólo por los roles/foco/teclado probados y la inspección.

## Bloqueos y siguiente recomendación

- **Bloqueos para declarar candidato completo/PASS:** F1–F4 funcionales y F5 de evidencia strict-TDD. Deben exponerse al responsable para remediación autorizada o reconciliación explícita de alcance/evidencia; esta fase no concede permiso de edición.
- **Salud del repositorio:** histórico `pnpm test` exit 1 preservado, formato global exit 1 aún reproducible; los checks scoped verdes no autorizan decir “todos los gates verdes”. No hay permiso para arreglar archivos externos.
- **Bloqueos nativos de archive:** ninguno en el estado suministrado. **`next_recommended: archive`**, preservando FAIL, tareas reales y evidencia mixta; no se ejecuta automáticamente. La decisión sobre remediar antes de archivar o entregar pertenece al usuario/parent, sin iniciar revisión nativa ni delivery.

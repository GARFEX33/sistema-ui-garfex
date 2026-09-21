# Reverify — compras-partidas-vinculacion

## Veredicto: FAIL

La reverify confirma las correcciones funcionales F1–F3, los contratos de relectura/retry de F4 y los metadatos R2C. F5 queda como **WARNING de proceso explícitamente aceptada**, nunca como cumplimiento strict-TDD. Sin embargo, una comprobación adicional en el navegador encontró **F6: falta el feedback de importación creada/ya existente bajo el StrictMode real de la aplicación**. Este incumplimiento observable impide PASS y PASS WITH WARNINGS.

**No están todos los gates verdes:** ahora pasan 942/942 tests, pero `pnpm format:check` continúa en exit 1 sobre 14 archivos externos sin modificar. El agregado histórico de tests exit 1 se conserva; no se sustituye retroactivamente por esta ejecución verde.

## Autoridad, alcance e integridad

- Estado consumido: `gentle-ai.sdd-status` v2; change explícito `compras-partidas-vinculacion`; store `openspec`; `applyState: ready`; `dependencies.verify: ready`; `dependencies.archive: ready`; `nextRecommended: apply`; `blockedReasons: []`.
- `actionContext.mode: repo-local`; workspace y allowed edit root: `/home/garfex/PROGRAMACION/sistema-ui-garfex`. Todos los paths staged resuelven dentro de esa raíz. Ownership y selección del change son inequívocos.
- La verificación opcional está admitida. Se preserva **`next_recommended: apply`**, sin reinterpretar la recomendación nativa ni iniciar otra fase. El FAIL no crea un bloqueo nativo de admisión de archive; tampoco autoriza entregar o archivar.
- Se leyeron directamente propuesta, spec, diseño, tareas, progreso acumulado y supersesiones, configuración y FAIL anterior. CodeGraph se utilizó antes de la inspección estructural.
- `skill_resolution: fallback-path`: skill de fase `/home/garfex/.agents/skills/sdd-verify/SKILL.md`, protocolo compartido, guía global strict-TDD y skill GARFEX disponible. No había override local strict-TDD. El próximo despacho debería inyectar los paths seleccionados.
- Único archivo autoral escrito: **este `reverify-report.md` nuevo**. No se editaron source, tests, tareas, progreso ni el informe anterior; sin staging, commit, branch, push, PR, archive, revisión nativa o subagentes. Los comandos de validación generaron únicamente sus salidas normales ignoradas y logs temporales; no dejaron delta en archivos tracked.

### Identidad comprobada antes y después de los checks

| Evidencia | Resultado |
| --- | --- |
| Candidato staged | **46 archivos, 7.215 inserciones, 22 eliminaciones** |
| Worktree frente al índice | `git diff --exit-code`: exit 0; además, comparación byte por byte de los 46 paths contra `git show :<path>` correcta |
| OpenSpec | Ningún path en el índice; artefactos untracked/unstaged |
| HEAD | `c9883e6900396ed4159fcddd4a28e6b582b29302` |
| Branch existente | `experiment/backend-integration`, sin cambio |
| SHA-256 índice | `be672811498b1f14939546d35f551c00f7a85eb5b7cd1b580ccd3c990912d0f5` |
| SHA-256 routeTree | `e93e74dd6ac33c3829d0d32843969f0d44a0ee4e391b62dc1f817efe2812d3bd` |
| SHA-256 FAIL anterior | **`dfde59eeb583ede14f6baa2c9dc02b1a96ab7ecf0fc25bd51657fd01e27ca034`**, igual al SHA de entrada y al observado inicialmente |

El contenido de `verify-report.md` conserva `## Veredicto: FAIL` y F1–F5 históricos. Su identidad criptográfica no cambió. El árbol generado conserva únicamente el registro aprobado de `/compras`; typecheck/build/router y el servidor de diagnóstico no alteraron sus bytes.

## Hallazgo bloqueante nuevo

### F6 — CRITICAL: StrictMode elimina el feedback de importación confirmada

**Paths:** `src/features/compras/ComprasScreen.tsx:70-80,91-116`; `src/main.tsx:10-12`; cobertura ausente en `tests/unit/comprasScreen.test.tsx:100-119`.

`screenMountedRef` comienza en `true`, pero el efecto sólo escribe `false` durante cleanup. No restablece `true` durante setup. El StrictMode de `src/main.tsx` ejecuta setup→cleanup→setup en desarrollo y deja la pantalla viva con el ref en `false`. En consecuencia, `onImported` omite `setImportFeedback` tanto para el proveedor vigente después de la relectura como para el proveedor no coincidente. El diálogo de importación, cuyo guard sí se restablece, puede cerrarse correctamente sin que la persona reciba el resultado creado/ya existente.

**Reproducción nueva, sin editar source/tests:** Chromium abrió `/compras` mediante Vite y el `src/main.tsx` real. Todas las peticiones `/v1/**` fueron interceptadas en memoria: ninguna mutación llegó a un backend real, no se añadió fixture al runtime ni archivo de prueba. Se confirmó un proveedor y se enviaron dos XML, con respuestas contractuales 201/`alreadyExisted:false` y 200/`alreadyExisted:true`.

```text
{"alreadyExisted":false,"posts":1,"historyReads":2,"successFeedback":0,"dialog":0}
{"alreadyExisted":true,"posts":2,"historyReads":3,"successFeedback":0,"dialog":0}
```

El probe terminó **exit 0 como diagnóstico**, no como test de aceptación aprobado. Ambos uploads y sus relecturas sucedieron, ambos diálogos cerraron, y ninguno mostró su mensaje de éxito. La evidencia demuestra el defecto en el harness de desarrollo con StrictMode; no afirma que el replay ocurra en el bundle de producción.

Incumple **Importación de CFDI con resultados distinguibles**, escenarios creada/idempotente, y deja incompleta la garantía global de feedback honesto de F4. Los tests de pantalla montan `ComprasScreen` sin StrictMode; los tests StrictMode de `ImportarCompraSurface` aislado no cubren el guard de pantalla. No se corrigió el defecto durante esta fase. Requiere remediación autorizada, RED fresca de pantalla bajo StrictMode y reverify independiente.

## Reconciliación F1–F5 y R2C

| Hallazgo | Evaluación actual | Evidencia |
| --- | --- | --- |
| F1: cadena de relación | **Corregido** | `CompraDetalleStage` deduplica con `Set` los IDs no nulos y lee cada SupplierProduct una vez por ejecución de query, con el mismo AbortSignal. La región por partida muestra descripción/SKU/ID publicados y `resourceId` exacto o ausencia explícita. El mismo query relee compra, líneas y el conjunto actual de productos después de las tres acciones. No busca ni inventa nombres de recursos por ID. Tests: lectura/dedupe/null, error inicial/retry y cambio del conjunto después de callback. |
| F2: inspección accesible | **Corregido** | `InspeccionarProductoProveedorStage` utiliza la ventana del proveedor y StagedSearchSelector, selección explícita y paginación por reemplazo. `ComprasScreen` lo monta sólo en la rama de proveedor confirmado. Reset de proveedor/página y reemplazo same-ID invalidan la inspección sin frame stale. La selección sólo inspecciona; no recibe callbacks de mutación/asociación. Tests de stage, hook y screen cubren el recorrido. |
| F3: explicación nullable G3 | **Corregido** | Cada línea null tiene región contextual que explica la operación Partida→Producto de Proveedor no publicada y el bloqueo de recurso. Cuatro estados nullable comprobados; no lookup, selector, link ni sustitución por VINCULADO. G2 no se usa como explicación sustituta. |
| F4: relecturas/retry | **Correcciones R1A–R1E confirmadas; garantía completa de feedback no certificada por F6** | Los dos `refetchActive` y `refreshDetail` usan `refetch({ throwOnError: true })`. Se retienen datos anteriores del detalle si falla una relectura. Import/link/unlink/NO_APLICA conservan sus respuestas confirmadas y el botón de retry repite sólo el callback de lectura, sin upload/POST duplicado. Tests ejecutados cubren rechazo, mensaje, estado anterior y retry exitoso. Los retry ordinarios de carga inicial usan el estado de Query y no se utilizan como confirmación de una mutación. |
| F5: evidencia U7A2 | **WARNING aceptada, no cumplimiento strict-TDD** | R4 y su cierre parent registran aceptación explícita del usuario, reiterada en la solicitud actual. Falta el RED incremental histórico de U7A2; el RED combinado de módulo ausente no lo reemplaza. No se fabricó ni reconstruyó evidencia retroactiva. Las RED frescas de remediación y sus verificaciones independientes son evidencia distinta. |
| R2C: metadatos técnicos | **Corregido/verificado** | Purchase `id`, `supplierId`, `createdAt`, `updatedAt` visibles como strings exactos; cada línea expone `id` y `purchaseId` en la zona técnica separada. El test recorre las cuatro líneas literales, exige todos sus IDs y cuatro apariciones del purchaseId, conserva XML/decimales y verifica ausencia de input/textarea/select/contenteditable/textbox. **La omisión recibida de supplierId era stale para el candidato actual**: ya existía la fila; R2C refuerza su aserción sin duplicarla. |

Las lecturas únicas de F1 se entienden por ejecución autoritativa, no como una promesa de una sola lectura durante toda la vida del componente; posteriores relecturas deben consultar nuevamente los productos.

## Cobertura de requisitos originales y coherencia de diseño

| Requisito / restricción | Resultado y nivel de evidencia |
| --- | --- |
| Importación 201/200/409/422, actor y multipart | API/RTL pasan: actor previo a transporte, FormData sin Content-Type manual, branch/signal opcionales, errores distintos y 200 no tratado como fallo. **FAIL del resultado visible creado/idempotente en StrictMode: F6**. |
| Historial por proveedor | PASS en RTL/hook: selección confirmada, título/contexto, flags backend, supplier/limit/offset en clave, reset y reemplazo; no listado global ni barrido de proveedores. |
| Detalle y XML inmutables | PASS en RTL e inspección: todos los campos documentales disponibles, hash/nombre XML, emisor, proveedor, fechas, moneda, totales, cantidad/unidad/SAT/SKU/precios/impuestos; R2C añade trazabilidad técnica. Sin descarga/visor XML inventado. |
| Precisión | PASS API/RTL: IDs y montos permanecen strings; historial agrupa dígitos mediante operaciones string, detalle muestra valores exactos. Sin aritmética binaria ni cálculo fiscal. |
| Cuatro estados perceptibles | PASS RTL: texto español, nombre `Estado: …`, `role=status`; relación separada del XML. Tokens warning autorizados y documentados, sin depender sólo del color. |
| Relación existente/búsqueda sin asociación | PASS de F1/F2. Inspección acotada a la ventana autoritativa del proveedor, coincidencia textual meramente informativa; sin alta ni matching. No se afirma búsqueda exhaustiva entre todas las páginas. |
| Link | PASS API/RTL: producto identificado, selección explícita de recurso ACTIVE/20, confirmación separada, actor, payload, busy, error, relectura de relación/líneas, retry sin segunda mutación y ningún estado optimista. |
| Unlink | PASS API/RTL: confirmación antes de POST, transición visible sólo por datos reconsultados, retención/retry de lectura y ausencia de POST duplicado. |
| NO_APLICA / CONFLICTO | PASS API/RTL: setter UI sólo envía NO_APLICA; producto presente/null; texto no aplicable; ninguna causa de conflicto inventada. |
| Nullable G3 | PASS de F3: explicación local y acciones limitadas, sin asociación ni override VINCULADO sustitutorio. |
| Pendientes transversales G2 | PASS RTL y E2E: sección siempre visible, informativa y sin red/resultados/paginación falsa/ruta adicional; orienta al historial del proveedor. |
| Navegación, foco, teclado y shell | PASS RTL/router: ruta plana /compras, Link real, `sidebar.compras`, índice 3 y Catálogo 4, topbar/surface, Enter/arrows/Home/End, foco y dialogs compartidos. Configuración y placeholders preservados. |
| REST/arquitectura/no objetivos | PASS inspección y guardas: siete GET y cuatro operaciones mutantes publicadas; Zod y transportes feature-locales; errores status/code/detail; allowlists exactas; sin Convex, stores, persistencia, backend, gateways/facades, matching ni cascadas locales. |
| Design System | Reutiliza PageHeader/WorkCard/Button/Dialog/StagedSearchSelector y tokens. No feature CSS, listener global nuevo ni expansión responsive/mobile. No auditoría visual integral WCAG ni comparación OpenPencil en esta fase. |

### Matriz de acciones observada y probada

| Producto | Estado | Acciones |
| --- | --- | --- |
| null | PENDIENTE / CONFLICTO | Sólo NO_APLICA |
| null | VINCULADO / NO_APLICA | Ninguna |
| identificado | PENDIENTE / CONFLICTO | Link y NO_APLICA |
| identificado | VINCULADO | Unlink |
| identificado | NO_APLICA | Ninguna; texto no aplicable |

El diseño histórico §9 mencionaba resolver nombre por resourceId. La remediación aprobada limita explícitamente esa presentación al resourceId publicado porque no hay lookup autorizado: se verificó ese límite, no se exigió implementar el endpoint inventado. El detalle usa estado local separado del modelo de navegación, sin ampliar rutas o estado global.

## Tareas y review workload

- Escaneo actual: **150/151 checkboxes completos**; **124/124 implementation completos**, 26/27 parent completos. No quedan unchecked implementation tasks. Las listas pendientes de secciones antiguas del progreso son historia, no el estado actual de tasks.
- Única línea pendiente exacta, conservada sin edición porque es parent-owned:

```text
- [ ] Ejecutar reverify final sólo después de R2C y del cierre parent de R4, contra el SHA de entrada y el baseline actualizado, sin editar retroactivamente el verify-report anterior; publicar un informe nuevo o una actualización autorizada fuera de esta reapertura. <!-- sdd-owner: parent -->
```

Esta ejecución aporta el informe solicitado; el parent puede reconciliar su checkbox posteriormente. No se declara completitud global ni readiness de entrega a partir de ese bookkeeping. F6 es el blocker funcional actual; no hay blocker por implementación unchecked ni bloqueo nativo adicional.

Se conserva `ask-on-risk` y la decisión histórica explícita `feature-branch-chain`; no se infiere `size:exception`. El agregado es High y no constituye un único PR autorizado bajo 400 líneas. No se creó cadena de ramas/PRs en esta fase.

| Slice de remediación aceptado | Líneas cambiadas registradas | Verificación independiente registrada |
| --- | ---: | ---: |
| R1A | 92 | 44/44 |
| R1B | 292 | 33/33 |
| R1C | 131 | 39/39 |
| R1D | 125 | 36/36 |
| R1E | 138 | 42/42 |
| R2A | 230 | 35/35 |
| R2B | 66 | 26/26 |
| R3A corregido | **397 = 179 source + 218 test**, recalculado ahora | 14/14 |
| R3B | 200 | 26/26 |
| R2C | 111 | 27/27 |
| R4 | Sólo evidencia OpenSpec, sin delta source/test; anotación acotada <400 líneas | Auditoría documental y aceptación parent |

**Todos los cierres de remediación aceptados están <400.** El intento R3A inicial 399/400 fue rechazado y reemplazado por el cierre corregido 397; no se oculta ni se cuenta como aceptado. Los deltas históricos de otros slices se confirman contra el registro y sus cierres independientes, no se finge reconstruir índices intermedios desde el índice agregado. La limitación histórica de trazabilidad exacta U9 del informe anterior permanece; no se convierte en excepción de tamaño.

## Comandos actuales y resultados

Todos ejecutados desde la raíz del repositorio. Los logs temporales de esta fase usan el prefijo `/tmp/compras-reverify-`.

| Comando exacto | Resultado actual |
| --- | --- |
| `pnpm test` | **exit 0; 109 archivos, 942/942 tests** |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | **exit 1; mismos 14 archivos externos** |
| `pnpm build` | exit 0; warnings Rollup/Zod y chunk >500 kB |
| `pnpm router:check` | exit 0 |
| `pnpm exec playwright test tests/e2e/compras.spec.ts` | exit 0; **1/1**, sólo escenario G2 |
| `git diff --check` | exit 0 |
| `git diff --cached --check` | exit 0 |
| `git diff --exit-code` | exit 0 |
| `git diff --cached --name-only -z \| xargs -0 pnpm exec prettier --check` | exit 0; **46 paths del candidato formateados** |

### Focused regression exacta — exit 0, 21 archivos / 187 tests

```sh
pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx tests/unit/elegirProveedorStage.test.tsx tests/unit/historialComprasStage.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/appShell.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/restTransportBoundaries.test.ts --reporter=dot
```

### Lint scoped adicional — exit 0, cero warnings

```sh
pnpm exec eslint src/features/compras tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/comprasScreen.test.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx --max-warnings 0
```

### Evidencia histórica separada

- Agregado U9 histórico: `pnpm test` **exit 1, 911 pass / 1 fail**, test `aborts a pending search on unmount and ignores its late response` en `tests/unit/useCatalogAttributeCreation.test.tsx:222`; rerun aislado histórico 15/15. El archivo sigue byte-identical a HEAD. Esta fase no repitió ese rerun aislado ni borró el agregado fallido.
- Verify anterior: nueva ejecución 912/912 con exit 0, también preservada como historia.
- Reverify actual: 942/942 con exit 0. No equivale a decir que todos los gates históricos o actuales pasaron.
- `pnpm format:check`: exit 1 histórico **y actual**, sobre los siguientes archivos comprobados byte-identical a HEAD:

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

### Probe F6 — comandos y programa exactos

Se inició `VITE_REST_ACTOR=reverify-probe pnpm exec vite --host 127.0.0.1 --port 4179 --strictPort` en background, con salida en `/tmp/compras-reverify-vite.log`. Se ejecutó el siguiente programa por stdin y después se detuvo el proceso iniciado. La variable actor fue exclusiva del proceso de diagnóstico; no cambió configuración persistente.

```sh
node --input-type=module - <<'JS'
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
 const page = await browser.newPage();
 const supplier = {id:'supplier-probe',tradeName:'Proveedor probe',legalName:'Proveedor probe SA',taxIdentifier:'RFC-PROBE',website:'',notes:'',active:true,createdAt:'2026-01-01',updatedAt:'2026-01-01'};
 const purchase = {id:'purchase-probe',supplierId:supplier.id,branchId:null,cfdiUuid:'uuid-probe',series:'P',folio:'1',issuedAt:'2026-01-01',currency:'MXN',exchangeRate:null,subtotal:'10.00',discount:'0.00',taxTransferred:'0.00',taxWithheld:'0.00',total:'10.00',issuerTaxId:'RFC-PROBE',issuerName:'Proveedor probe',xml:{hash:'probe-hash',filename:'probe.xml'},importedAt:'2026-01-01',createdAt:'2026-01-01',updatedAt:'2026-01-01'};
 let posts=0, reads=0;
 await page.route('**/v1/**', async route => {
  const request=route.request(), path=new URL(request.url()).pathname;
  let body;
  if(path==='/v1/suppliers') body={suppliers:[supplier],hasPrevious:false,hasNext:false};
  else if(path===`/v1/suppliers/${supplier.id}/products`) body={products:[],hasPrevious:false,hasNext:false};
  else if(path===`/v1/suppliers/${supplier.id}/purchases`) {reads++;body={purchases:[purchase],hasPrevious:false,hasNext:false};}
  else if(path==='/v1/purchases' && request.method()==='POST') {posts++;body={...purchase,alreadyExisted:posts===2};}
  else {await route.abort();return;}
  await route.fulfill({status:path==='/v1/purchases' && posts===1?201:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('http://127.0.0.1:4179/compras');
 await page.getByRole('option',{name:/Proveedor probe/}).click();
 await page.getByRole('button',{name:'Seleccionar compra P-1'}).waitFor();
 for(let i=0;i<2;i++) {
  await page.locator('input[type=file]').setInputFiles({name:'probe.xml',mimeType:'application/xml',buffer:Buffer.from('<cfdi/>')});
  await page.waitForFunction(()=>document.querySelector('[role=dialog]')===null);
  await page.waitForTimeout(300);
  console.log(JSON.stringify({alreadyExisted:i===1,posts,historyReads:reads,successFeedback:await page.getByText(i===0?'Compra importada. Historial del proveedor actualizado.':'La compra ya estaba registrada. Historial del proveedor actualizado.',{exact:true}).count(),dialog:await page.getByRole('dialog').count()}));
 }
} finally {await browser.close();}
JS
```

Controles de identidad adicionales ejecutados: `sha256sum .git/index openspec/changes/compras-partidas-vinculacion/verify-report.md src/app/routeTree.gen.ts`, `git diff --cached --shortstat`, `git diff --cached --name-only -- openspec`, `git rev-parse HEAD`, `git branch --show-current`, y `wc -l src/features/compras/InspeccionarProductoProveedorStage.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx`. Una comprobación Python comparó los bytes staged/worktree, los 14 archivos externos y el test flaky contra HEAD, ownership por realpath y los checkboxes; todas sus aserciones pasaron.

## Strict TDD y calidad de aserciones

- Strict TDD sigue activo en config/tasks. Se encontraron tablas `TDD Cycle Evidence` y se contrastaron sus paths actuales con archivos reales y ejecuciones GREEN actuales. Los paths retirados/superseded no se contaron como tests presentes.
- **No se certifica cumplimiento strict-TDD íntegro:** el RED incremental U7A2 falta históricamente. La aceptación explícita lo clasifica como **WARNING de desviación de proceso**, sin inventar RED ni hacer de GREEN prueba del orden histórico.
- R1A–R1E, R2A/R2B, R3A/R3B y R2C tienen RED fresca registrada antes de producción, GREEN y verificación independiente. En particular: R1A 3 fallos; R1C 2; R1D 2; R1E 3; R2A 3; R2B 4; R3A módulo ausente y luego frame stale; R3B montaje ausente; R2C 1 fallo por ID de compra ausente. R1B registra fallos de reread/retry sin cifra exacta inicial. No se adjudican esas RED a U7A2.
- R4 es sólo reconciliación documental: no necesita una RED de producción y no demuestra comportamiento por sí misma.
- Todos los **22 archivos de prueba staged** fueron inspeccionados: 3 unit/API/model (**15 tests**), 14 RTL/hook/router (**151**), 4 arquitectura (**21**) y 1 E2E (**1**). Total candidato: **188 tests**, 187 de Vitest y 1 de Playwright. El probe F6 no se suma a ese total ni se presenta como prueba committed.
- No se encontraron nuevas tautologías, assertions type-only como única evidencia, ni ghost loops sobre colecciones DOM no verificadas. Los loops de metadatos R2C recorren fixtures literales no vacíos; la matriz tiene cardinalidad independiente. Los asserts de llamadas están ligados a payloads, AbortSignal y a la ausencia observable de POST duplicado.

### Advertencias de aserciones y cobertura

| Path | Advertencia |
| --- | --- |
| `tests/unit/partidaEstadoBadge.test.tsx:48-59` | CSS/layout coupling (`inline-flex`, `border`). Las clases semánticas son contrato del diseño; el layout no demuestra comportamiento. Las aserciones accesibles de los cuatro estados sí son útiles. |
| `tests/unit/partidasPendientesBlockedSurface.test.tsx:15-20` | Clases de presentación no sustituyen copy, live region y ausencia de resultados/red, que también se comprueban. |
| `tests/unit/comprasScreen.test.tsx:100-119` | Falta el montaje StrictMode que detectaría F6; GREEN de la superficie aislada no prueba integración con la pantalla real. |
| `tests/e2e/compras.spec.ts` | Sólo prueba G2. No demuestra el journey backend completo de selección→importación→detalle→resolución. El probe nuevo sólo añade diagnóstico de importación con respuestas interceptadas, no validación del backend real. |

Coverage porcentual omitido: no hay herramienta dedicada configurada. Storybook, auditoría visual/manual WCAG completa y OpenAPI externo en vivo no se ejecutaron; los contratos se contrastaron con los artefactos publicados y el adapter. No se instaló tooling ni se alteraron archivos externos.

## Bloqueos y siguiente paso

1. **Blocker funcional para PASS: F6**, feedback creado/idempotente ausente bajo StrictMode. Autorizar una corrección acotada y regresión de pantalla antes de una nueva reverify; esta fase no la implementó.
2. **WARNING de proceso aceptada: F5**, sin cumplimiento strict-TDD retrospectivo.
3. **WARNING de salud global:** formato exit 1 persistente en archivos externos intactos; histórico de test exit 1 preservado. Nunca declarar todos los gates verdes.
4. **Limitaciones:** journey browser integral, auditoría visual/WCAG y trazabilidad de índices intermedios no certificados.

Recomendación nativa preservada: **`apply`**. Sin nuevos blockers nativos ni acciones automáticas de entrega/archive. El reporte FAIL anterior permanece byte-identical y este informe nuevo registra el resultado real del candidato remediado.

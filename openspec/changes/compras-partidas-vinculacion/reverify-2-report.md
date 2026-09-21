# Segunda reverify — compras-partidas-vinculacion

## Veredicto: PASS WITH WARNINGS

F1–F4 y R2C permanecen corregidos; F6 queda remediado por R1F y confirmado con la pantalla real bajo StrictMode, tanto en RTL como repitiendo el diagnóstico Chromium anterior. F5 permanece **WARNING de proceso explícitamente aceptada**, no cumplimiento strict-TDD retrospectivo.

**No están todos los gates verdes.** `pnpm test` actual pasa 945/945, pero `pnpm format:check` sigue en **exit 1** sobre 14 archivos externos byte-identical a HEAD. El histórico agregado de tests exit 1 sigue siendo evidencia válida y no se borra con este GREEN.

Este veredicto describe los comportamientos inspeccionados y ejecutados, no certifica backend real, auditoría visual/WCAG integral ni autorización de entrega.

## Autoridad y permisos

- Estado consumido: `gentle-ai.sdd-status` v2; change inequívoco; `artifactStore: openspec`; apply/verify/archive `ready`; `nextRecommended: apply`; `blockedReasons: []`.
- `actionContext.mode: repo-local`; workspace y allowed root `/home/garfex/PROGRAMACION/sistema-ui-garfex`. Se comprobó por realpath que los 46 paths staged pertenecen a esa raíz y sus bytes ejecutados coinciden con el índice.
- Recomendación nativa preservada: **apply**. No se deriva readiness nueva ni bloqueo nativo de archive desde este diagnóstico opcional.
- Se consultaron directamente propuesta, spec completa, diseño, tareas, progreso inicial y cierres/remediaciones actuales, configuración y ambos informes históricos. La inspección del progreso acumulado fue selectiva, no una reconstrucción de todos los índices históricos.
- CodeGraph se utilizó antes de inspeccionar la estructura. `skill_resolution: fallback-path`: skill sdd-verify, protocolo compartido, GARFEX Design System y guía global strict-TDD; faltaban paths inyectados y override local strict-TDD.
- Único archivo autoral escrito: **reverify-2-report.md**. Se preservan informes anteriores, source/tests, tasks/progress e índice. Sin staging, commit, branch, push, PR, archive, native review ni subagentes. Logs y salidas de herramientas son temporales/ignorados.

## Identidad e integridad

| Control | Resultado |
| --- | --- |
| Candidato staged | **46 archivos, 7.356 inserciones, 22 eliminaciones** |
| Worktree contra índice | `git diff --exit-code`: exit 0; comparación individual de los 46 archivos con `git show :<path>` correcta |
| OpenSpec | Ningún path staged; todos los artefactos permanecen unstaged/untracked |
| Convex | Ningún path del candidato contiene Convex; no cambio de backend/Convex en esta fase |
| routeTree | Sin delta unstaged; SHA-256 `e93e74dd6ac33c3829d0d32843969f0d44a0ee4e391b62dc1f817efe2812d3bd` |
| Índice observado después de checks | SHA-256 `f93a4f55f5d60259ec5cad4aac0dbc8116ba4e6bb618c5c4aa00241647294832` |
| verify-report.md antes/después | SHA-256 **`dfde59eeb583ede14f6baa2c9dc02b1a96ab7ecf0fc25bd51657fd01e27ca034`** |
| reverify-report.md antes/después | SHA-256 **`55693466e89b0e851f60f80959f40c1160c5e88f89cfc2d751def72e639020c4`** |

Ambos informes conservan sus bytes, contenido FAIL y hallazgos históricos. El segundo conserva F6 como defecto del candidato anterior; este informe registra su remediación sin reescribirlo.

R1F pudo contrastarse además con el objeto de baseline disponible `7629f7ca69d652ac837e1959ef6c71b1ab4b237b`: `ComprasScreen.tsx` 1 adición/0 eliminaciones y `comprasScreen.test.tsx` 142 adiciones/2 eliminaciones, **145 líneas**, estrictamente <400.

## F6: evidencia nueva de pantalla y lifecycle

`src/features/compras/ComprasScreen.tsx:77-82` ahora escribe `screenMountedRef.current = true` en setup y `false` en cleanup. El replay setup→cleanup→setup ya no deja una pantalla viva marcada como desmontada. La superficie de importación también conserva su propio setup/cleanup correcto.

`onImported` distingue created/alreadyExisted, no relee un proveedor no coincidente y espera `refetchActive()` antes de publicar historial actualizado. Después de await comprueba montaje, versión de contexto e ID vigente. La superficie conserva el resultado confirmado cuando falla la lectura; el retry repite exclusivamente lectura/callback, no multipart.

La regresión de `tests/unit/comprasScreen.test.tsx` monta **ComprasScreen real**, no un mock de pantalla, dentro de `<StrictMode>`:

- Dos casos parametrizados created/alreadyExisted: una importación, exactamente una relectura del proveedor vigente, feedback ausente y diálogo visible mientras la relectura está pendiente; feedback exacto visible y diálogo cerrado después.
- Proveedor no coincidente: mensaje honesto y ninguna relectura adicional del historial actual.
- Cambio de proveedor durante reread: no publica «Historial del proveedor actualizado» para el contexto anterior; informa la discrepancia.
- Unmount durante reread: termina la promesa sin nuevo upload/lectura ni mensaje visible o console.error.
- R1B conserva fallo de reread y retry exitoso con **un solo upload**.

Limitación de aserción: ausencia de DOM tras unmount y ausencia de console.error no prueban por sí solas que nunca se intente setState; el guard post-await se confirmó también por inspección. El test de cambio de proveedor dispara programáticamente un botón detrás del diálogo: prueba la defensa ante cambio de contexto, no un gesto accesible permitido mientras el modal está abierto.

### Repetición del diagnóstico browser histórico

Se ejecutó el programa exacto preservado en `reverify-report.md`, extraído y enviado por stdin, contra Vite con el `src/main.tsx` real y StrictMode. Todas las rutas `/v1/**` se interceptaron en memoria; no se envió mutación a backend real ni se escribió fixture/test.

```text
{"alreadyExisted":false,"posts":1,"historyReads":2,"successFeedback":1,"dialog":0}
{"alreadyExisted":true,"posts":2,"historyReads":3,"successFeedback":1,"dialog":0}
probe EXIT=0
```

Antes ambos `successFeedback` eran 0; ahora ambos son 1. Los contadores son acumulativos: cada archivo produjo un POST y una relectura. Este probe es diagnóstico, no se suma al número de tests de aceptación; la espera autoritativa pendiente se prueba específicamente en RTL.

## Requisitos originales y remediaciones

| Requisito / hallazgo | Evidencia actual |
| --- | --- |
| Importación distinguible | PASS API/RTL y probe: 201/200, created/alreadyExisted, 409/422, actor previo a transporte, FormData sin Content-Type manual, branch/signal opcionales. F4/F6 corregidos; éxito del historial sólo después de reread. |
| Historial por proveedor | PASS screen/stage/hooks: confirmación obligatoria, contexto/título identificable, limit/offset y flags backend, reset y reemplazo, sin historial global ni barrido. |
| Detalle documental inmutable | PASS detalle/API: campos fiscales, comerciales y XML disponibles; todas las partidas y sus campos originales; IDs/decimales string sin aritmética binaria. Sin edición ni visor/descarga XML inventados. |
| R2C metadatos técnicos | Purchase id/supplierId/createdAt/updatedAt y cada line id/purchaseId visibles; zona técnica separada; fixtures múltiples, strings exactos y ausencia de controles editables. supplierId ya existía: no se duplicó. |
| Cuatro estados perceptibles | PASS badge/detalle: texto y nombre accesible/role, relación separada de XML; warning autorizado, success/primary/neutral reutilizados. No depende sólo de color. |
| F1 relación existente | PASS: `Set` deduplica IDs no nulos por ejecución autoritativa; GET de cada SupplierProduct con signal compartido; descripción/SKU/ID publicados y resourceId exacto o ausencia explícita. El query posterior relee compra, líneas y conjunto actual de productos. Sin lookup/nombre de recurso inventado. |
| F2 inspección/reutilización | PASS stage/screen/hook: ventana acotada al proveedor confirmado, búsqueda informativa sobre esa ventana, selección explícita, paginación por reemplazo; invalidación por proveedor/offset/referencia de filas, incluso reemplazo same-ID. No asociación ni alta por coincidencia. |
| Vinculación | PASS API/superficie/detalle: selección explícita ACTIVE/20, confirmación separada, actor, busy/error, backend como autoridad; reread de relación/partidas y retry sin segundo POST. |
| Desvinculación | PASS API/superficie/detalle: confirma antes de POST; transición sólo por datos reconsultados, retención y retry de lectura sin repetir mutación. |
| NO_APLICA/CONFLICTO | PASS: sólo setter NO_APLICA desde UI, texto no aplicable, matriz nullable preservada, ninguna causa de conflicto ni vínculo inventado. |
| F3 nullable G3 | PASS: región contextual por partida explica la operación Partida→Producto de Proveedor ausente. Null PENDIENTE/CONFLICTO permite sólo NO_APLICA; null VINCULADO/NO_APLICA no permite acciones. Ningún selector de recurso ni sustitución por override VINCULADO. |
| G2 pendientes transversales | PASS RTL y E2E: siempre visible, explicación/orientación al historial, sin lista parcial/red/paginación/ruta nueva. |
| F4 reread y retry | PASS inspección y regresión: ambos RestWindows y detalle usan `refetch({ throwOnError: true })`; detalle retiene datos anteriores ante fallo. Las cuatro superficies distinguen mutación confirmada de lectura fallida y reintentan sólo la lectura. |
| Navegación/teclado/DS | Regresión shell/router/arquitectura pasa: ruta plana, Link real, sidebar.compras, índice de Catálogo ajustado, foco/teclado y diálogos compartidos. Sin nueva infraestructura global. No equivale a auditoría visual/WCAG integral. |
| Fronteras/no objetivos | Adapter contiene los siete GET y cuatro POST publicados en propuesta. Sin endpoints globales, asociación nullable, recursos por ID, cálculo fiscal, matching, persistencia ni Convex nuevos. OpenAPI externo no reconsultado en vivo. |

Las variaciones del diseño histórico ya reconciliadas permanecen: el recurso se presenta por `resourceId` publicado, no un nombre obtenido de endpoint inexistente; detalle vive en estado local separado; los strings monetarios se preservan sin Number/Intl que pierda precisión. No se exige implementar las capacidades futuras G1–G4.

## Tareas y review workload

Escaneo: **156/158 completos; 129/129 implementation y 27/29 parent**. No quedan líneas unchecked de implementación. Las dos pendientes exactas son parent-owned y no se editaron:

```text
- [ ] Coordinar una segunda reverify independiente después del cierre parent de R1F, contra el SHA/baseline correspondiente, preservando ambos informes de verificación y sin iniciar commit, branch, push, PR, archive ni otra acción de entrega. <!-- sdd-owner: parent -->
- [ ] Ejecutar la segunda reverify sólo después de R1F y de su cierre parent, contra el SHA de entrada y el baseline actualizado, sin editar retroactivamente `verify-report.md` ni `reverify-report.md`; publicar cualquier informe nuevo fuera de esta reapertura. <!-- sdd-owner: parent -->
```

Este informe aporta evidencia para su posterior reconciliación por el parent; no declara 158/158 ni inicia archive.

Se conserva `ask-on-risk`, cadena histórica aprobada `feature-branch-chain`, riesgo agregado High y ausencia de `size:exception`. R1F sólo contiene sus dos paths autorizados. El agregado de 7.378 líneas cambiadas no es un PR único autorizado bajo 400.

Los cierres aceptados históricos registran cada slice <400: U1A 399; U1B 352; U2A 356; U2B 319; U3A 153/220 según contabilidad del split; U3B1 399; U3B2 273; U4A 398; U4B 399; U5 108; U6A 119; U6B1 389; U6B2 128; U7A1 399; U7A2 367; U7B 221; U8A 301; U8B 353; U8C 243; U9 registrado <400. Remediaciones: R1A 92, R1B 292, R1C 131, R1D 125, R1E 138, R2A 230, R2B 66, R3A corregido 397, R3B 200, R2C 111, R4 documental acotado y R1F **145 recalculado**.

**Advertencia de trazabilidad preservada:** no se reconstruyeron todos los índices intermedios; U9 carece de cifra exacta independiente en el cierre histórico. La afirmación histórica <400 no se transforma en una medición nueva. Los intentos rechazados sobre presupuesto y R3A inicial 399/400 no se cuentan como cierres aceptados. No se inventa excepción ni autorización de publicación.

## Comandos exactos y resultados actuales

Desde la raíz; logs `/tmp/compras-reverify2-*.log`.

| Comando | Resultado |
| --- | --- |
| `pnpm test` | **exit 0; 109 archivos, 945/945 tests** |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | **exit 1; 14 archivos externos intactos** |
| `pnpm build` | exit 0; warning de chunk >500 kB |
| `pnpm router:check` | exit 0 |
| `pnpm exec playwright test tests/e2e/compras.spec.ts` | exit 0; **1/1**, sólo G2 |
| `pnpm exec vitest run tests/unit/comprasScreen.test.tsx --reporter=dot` | exit 0; **15/15** |
| `pnpm exec eslint src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx --max-warnings 0` | exit 0 |
| `pnpm exec prettier --check src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx` | exit 0 |
| `git diff --cached --name-only -z \| xargs -0 pnpm exec prettier --check` | exit 0; 46 paths |
| `git diff --check` | exit 0 |
| `git diff --cached --check` | exit 0 |
| `git diff --exit-code` | exit 0 |

Focused integral **exit 0, 21 archivos/190 tests**:

```sh
pnpm exec vitest run tests/unit/comprasApiReads.test.ts tests/unit/comprasApiMutations.test.ts tests/unit/useSupplierPurchasesRestWindow.test.tsx tests/unit/useSupplierProductsRestWindow.test.tsx tests/unit/comprasNavigation.test.ts tests/unit/comprasScreen.test.tsx tests/unit/elegirProveedorStage.test.tsx tests/unit/historialComprasStage.test.tsx tests/unit/importarCompraSurface.test.tsx tests/unit/compraDetalleStage.test.tsx tests/unit/partidaEstadoBadge.test.tsx tests/unit/partidasPendientesBlockedSurface.test.tsx tests/unit/inspeccionarProductoProveedorStage.test.tsx tests/unit/vincularPartidaSurface.test.tsx tests/unit/desvincularPartidaSurface.test.tsx tests/unit/marcarNoAplicaAction.test.tsx tests/unit/appShell.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/restTransportBoundaries.test.ts --reporter=dot
```

Probe browser exacto (programa histórico íntegro referenciado por hash arriba):

```sh
VITE_REST_ACTOR=reverify-probe pnpm exec vite --host 127.0.0.1 --port 4179 --strictPort > /tmp/compras-reverify2-vite.log 2>&1 & VITE_PID=$!; sleep 3; python3 - <<'PY'
from pathlib import Path
import subprocess
s=Path('openspec/changes/compras-partidas-vinculacion/reverify-report.md').read_text()
program=s.split("node --input-type=module - <<'JS'\n",1)[1].split('\nJS',1)[0]
r=subprocess.run(['node','--input-type=module','-'],input=program,text=True,capture_output=True)
print(r.stdout,r.stderr, 'probe EXIT='+str(r.returncode))
PY
kill $VITE_PID; wait $VITE_PID 2>/dev/null; true
```

Controles adicionales: `git rev-parse --show-toplevel`; `git status --short`; `git diff --cached --shortstat`; `git diff -- src/app/routeTree.gen.ts`; `git diff --cached --name-only -- convex`; `sha256sum openspec/changes/compras-partidas-vinculacion/{verify-report,reverify-report}.md`; `git diff --stat 7629f7ca69d652ac837e1959ef6c71b1ab4b237b -- src/features/compras/ComprasScreen.tsx tests/unit/comprasScreen.test.tsx`; mismo comando con `--numstat`. Una comprobación Python de bytes/realpaths, hashes y checkboxes terminó exit 0. La búsqueda inicial de paths alternativos de skill/support devolvió exit 2 por paths ausentes; los archivos disponibles se cargaron correctamente y eso no fue un fallo de producto.

### Historia que no se borra

- U9 histórico `pnpm test`: **exit 1, 911 pass/1 fail**, `useCatalogAttributeCreation.test.tsx`, caso unmount/late response; rerun aislado histórico 15/15 no lo reemplaza.
- Verify anterior 912/912 y primera reverify 942/942: resultados históricos separados del actual 945/945.
- Formato global histórico y actual: **exit 1**. Candidato scoped: exit 0. Nunca «todos los gates verdes».

Los 14 archivos actuales de formato se compararon individualmente con HEAD y son idénticos:

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

## Strict TDD y calidad de aserciones

Strict TDD permanece activo. Existen tablas `TDD Cycle Evidence`; R1F referencia el test real ejecutado: safety net 12/12, RED fresca 2 failed/12 passed antes de source, GREEN 14/14 y triangulación 15/15, más cierre independiente 39/39. El baseline disponible permite confirmar el delta mínimo. Los resultados históricos proceden del progreso, no se pretende observar nuevamente su orden ni fabricar una RED retroactiva.

F5 sigue **WARNING aceptada** por ausencia de RED incremental U7A2: no se certifica strict-TDD íntegro. Las RED de remediación son evidencia distinta. No apareció una nueva omisión de evidencia R1F.

La inspección fresca de las aserciones R1F confirma llamadas reales de producción, dos ramas de negocio, promesa pendiente/resuelta, feedback visible, diálogo y no duplicación. No hay tautología, loop vacío ni test sólo de tipos en ese incremento. R2C usa fixtures literales de cuatro líneas y exactitud de strings, no un loop sobre resultados posiblemente vacíos. Las advertencias históricas de acoplamiento CSS en `partidaEstadoBadge.test.tsx` y `partidasPendientesBlockedSurface.test.tsx` permanecen: clases de layout no sustituyen las aserciones accesibles que también existen. El audit fresco no repitió una lectura línea por línea de todos los tests históricos; su auditoría completa anterior se conserva como evidencia separada, y toda la regresión se volvió a ejecutar.

Distribución del candidato: 22 archivos de prueba — 3 unit/API/model, 14 RTL/hook/router, 4 arquitectura, 1 E2E. La regresión actual suma 190 tests Vitest y 1 Playwright. No se calculó coverage porcentual; no hay comando dedicado configurado.

## Riesgos, límites y siguiente paso

- Ningún blocker funcional nuevo encontrado; F6 remediado, F1–F4/R2C confirmados dentro de la evidencia descrita.
- F5: desviación histórica aceptada, nunca cumplimiento retrospectivo.
- Formato global rojo persistente e histórico test exit 1 preservados.
- Trazabilidad histórica de tamaños, especialmente U9, no reconstituida íntegramente.
- No se ejecutaron Storybook, jornada browser completa contra backend real, auditoría visual/OpenPencil, auditoría manual WCAG ni OpenAPI en vivo. El E2E committed sólo cubre G2 y el probe usa respuestas interceptadas.
- Dos checkboxes parent-owned quedan pendientes de reconciliación; ningún implementation unchecked.

**next_recommended: apply**, conforme al estado nativo recibido. Sin archive, entrega ni revisión automática. Este PASS WITH WARNINGS no modifica las autorizaciones humanas pendientes ni los informes históricos.

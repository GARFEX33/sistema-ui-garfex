# Creador de recursos — experiencia CLI keyboard-first

## Objetivo

Rediseñar la interacción y composición visual del modal "Creador de recursos"
(`CrearRecursoSurface.tsx`) para que se sienta como una CLI interactiva /
command palette integrada en la estética GARFEX, manteniendo el flujo
keyboard-first ya existente (↑/↓, escribir-para-filtrar, Enter confirma,
Esc/← vuelve) y reduciendo la dependencia visual de botones grandes.

## Por qué

Pedido explícito del usuario: el modal funciona pero se siente como un
formulario web tradicional. El objetivo de experiencia es
abrir → escribir/↑↓ → Enter → siguiente campo automático → ... → revisión →
Enter → recurso creado, sin necesitar mouse.

## Alcance

Solo `src/features/resources-master/` (CrearRecursoSurface, CreationStageRail,
ResourceCreationAttributesForm/Stage, ResourceCreationReview,
CreationCommandBar) y sus tests. No toca Recursos maestros (pantalla de
listado), ni el subsistema de teclado compartido salvo lectura.

## Restricciones

- ~~El wiring de `POST /evaluate` queda bloqueado~~ — **desbloqueado
  2026-09-17.** El usuario confirmó con cita exacta del OpenAPI embebido en
  garfex-api (`internal/httpapi/openapi.yaml:747-763`): `POST
  /v1/types/{typeCode}/attributes/evaluate` con `classCode`/`familyCode`
  como query params (ambos `required: true` en el schema, aunque el handler
  los lea con `Query().Get()` sin validar; enviarlos siempre), body
  `{ values: ResourceAttribute[] }`, misma respuesta que el GET de atributos
  efectivos. Sin URL pública verificable fuera del binario (se sirve en
  runtime en `{base}/openapi.yaml` y `{base}/docs`), pero la cita del fuente
  ya es evidencia suficiente — no se adivinó nada. Esto habilita la tarea 6.
- No tocar `ResourceCreationAttributesStage.tsx` / `resourceCreation.attributeStep.ts`
  / `resourceCreation.attributeSequence.ts` (pipeline legacy atado al modelo
  de evaluación Convex `ResourceCreationEvaluation`, incompatible con el
  `EffectiveAttribute[]` REST actual). Se construye un secuenciador nuevo y
  liviano sobre los datos REST ya cableados, no se resucita ese pipeline.
- Preservar exactamente el comportamiento ya correcto: auto-foco al abrir y
  al cambiar de stage, Esc/← vuelven de a un paso, Tab sigue funcionando.
- QUANTITY sigue bloqueado (gap separado, no autorizado); no se construye
  captura para ese tipo de valor en este cambio.

## TDD

Modo: **estricto** (`strict_tdd: true` en `openspec/config.yaml`). RED → GREEN
→ REFACTOR por tarea. Runner: `pnpm exec vitest run <archivo>`.

## Tareas

- [x] 1. Rail compacto: reemplazar `CreationStageRail` (fila horizontal de
      botones con borde) por lista vertical compacta `✓/›/·` de dos columnas
      (etiqueta, valor), sin cajas ni bordes extra. Mantiene `onNavigate` y
      accesibilidad (`aria-current`, nombre accesible por fila).
- [x] 2+3. Secuenciador de atributos nuevo (`ResourceCreationAttributeSequencer.tsx`
      + `resourceCreationAttributeSequencer.model.ts`): un atributo a la vez
      sobre `EffectiveAttribute[]`, avance automático al confirmar, Esc
      retrocede un atributo (o burbujea al wizard en el primero). Fusionadas
      tareas 2 y 3: separar "sequencer sin estilo" de "campos CLI" hubiera
      significado construir dos veces el manejo de cada tipo de valor.
      `CONTROLLED_OPTION`/`BOOLEAN` reusan `StagedSearchSelector` (booleano
      como lista sintética Sí/No); `CONTROLLED_TEXT`/`INTEGER`/`DECIMAL` son
      un input de una línea con Enter confirma/avanza y Enter vacío en
      opcional salta sin bloquear. `QUANTITY` sigue bloqueado (gap aparte).
      `ResourceCreationAttributesForm.tsx` (legacy, ya sin uso) eliminado
      junto a su test. Wizard reintegrado: `CrearRecursoSurface.tsx` ya no
      tiene botón "Continuar" en Atributos (el avance es automático).
      Exclusión mutua dinámica (1/2"/13mm) sigue pendiente de la unidad
      "/evaluate" de abajo, ahora desbloqueada.
- [x] 4. Revisión compacta: `<dl>` en grilla + lista con viñetas reemplazados
      por listas de dos columnas (`grid-cols-[7rem_1fr]`, monoespaciado) +
      sección "Nombre final" que reusa `buildResourcePresentationName`
      (construyendo un `Resource` mínimo desde `scope`/`unit`/`projected`).
      Los atributos ahora muestran el nombre legible (`characteristic.name`)
      en vez del código crudo. "Nombre final" no aparece si falta un
      REQUIRED (mismo gate que ya deshabilita "Crear recurso").
- [x] 5. Enter en el paso de revisión crea el recurso (`onKeyDown` en la
      `<section>` de `ResourceCreationReview`, ignora si el foco ya está en
      un `<button>` para no disparar dos veces, y si `!canCreate`).
      `CreationCommandBar` reescrito con el texto de hints exacto pedido,
      distinguiendo `class` (Esc cierra) de `family`/`type`/`unit`/`attributes`
      (Esc vuelve) y `review-pending` (Enter crear recurso · Esc volver); su
      prop `stage` ahora reusa `CreationRailStage` en vez de un union propio
      más grueso, y `CrearRecursoSurface.tsx` le pasa `currentRailStage`
      directo (se eliminó la variable `commandStage` redundante). Botón
      "Crear recurso" pasado a `variant="outline"` — deja de ser protagonista,
      Enter es el camino principal.
- [x] 6. Adapter `resourceAttributeEvaluation.api.ts` (`POST
      /v1/types/{typeCode}/attributes/evaluate?classCode=...&familyCode=...`,
      body `{ values: ResourceAttribute[] }`) reusando el parser público
      compartido con el GET de atributos efectivos; hook que lo llama tras
      cada atributo confirmado en el secuenciador y aplica el
      `effectiveMode`/`notApplicable` devuelto (así 1/2" vs 13mm queda
      resuelto por Core, no localmente); ampliar
      `tests/architecture/restTransportBoundaries.test.ts` a este sexto
      adapter. Sin actor por inferencia, sin alterar el GET, sin evaluar
      `rules` en cliente — corresponde a la tarea 7f de
      `replace-convex-with-rest-backend/tasks.md`, ahora desbloqueada.

## Progreso

- 2026-09-17: documento creado. Comenzando tarea 1.
- 2026-09-17: **Tarea 1 completa.** `CreationStageRail.tsx` reescrito como
  lista vertical compacta (✓/›/·, dos columnas etiqueta/valor, sin bordes ni
  botones grandes). Tests actualizados (`creationStageRail.test.tsx` +2
  casos nuevos; `crearRecursoSurfaceWizard.test.tsx` con las aserciones de
  revisión ahora escopeadas a su `<section>`, porque el rail y la revisión
  ahora muestran el mismo valor confirmado). `pnpm typecheck`/`lint` limpios;
  suite completa: mismos 2 archivos preexistentes sin relación
  (`resourceCreationReview.test.tsx`, `crearRecursoSurface.test.tsx`) ya
  fallando antes de este cambio (confirmado con `git stash -u`).
  Bloqueo de `POST /evaluate` (tarea 7f de replace-convex-with-rest-backend)
  comunicado al usuario para que confirme con backend; no bloquea las
  tareas 2-5.
- 2026-09-17: **Tareas 2+3 completas** (ver detalle arriba).
- 2026-09-17: usuario confirmó la ruta de `POST /evaluate` con cita exacta
  del OpenAPI (`internal/httpapi/openapi.yaml:747-763`). Actualizado
  `gap-reports/G4.md`, `api-contract-evidence.md` y `tasks.md` (Slice B2)
  con la evidencia.
- 2026-09-17: **Tarea 6 completa.** `resourceAttributeEvaluation.api.ts`
  (adapter, comparte `parseEffectiveAttributesResponse` con el GET),
  `useResourceAttributeEvaluation.ts` (re-evalúa tras cada atributo
  confirmado) y `useResourceCreationAttributesEvaluation.ts` (wrapper que
  compone api+proyección de valores en una sola llamada, para no pasar el
  límite de 500 líneas de `resourceCreationBoundaries.test.ts`).
  `resourceCreationAttributeSequencer.model.ts` sumó `projectConfirmedAttributes`
  (proyección tolerante para el borrador de `/evaluate`, nunca falla cerrado
  por un REQUIRED todavía no alcanzado). `ResourceCreationAttributeSequencer.tsx`
  reescrito para rastrear atributos confirmados por **código**, no por índice
  numérico — un índice se habría desalineado si la lista se achica entre
  renders (exactamente lo que pasa cuando `/evaluate` marca un atributo
  hermano como `notApplicable`). `restTransportBoundaries.test.ts` y
  `keyboardBoundaries.test.ts` (que mantiene su propia whitelist duplicada)
  ampliados al sexto adapter. Se encontró y corrigió un bug de staleness en
  el hook (el estado "idle" quedaba congelado con el baseline vacío de la
  primera carga en vez de leerlo fresco en cada render) antes de que llegara
  a producción, vía el test de integración del wizard. `pnpm
  typecheck`/`lint`/`format` limpios; suite completa: mismos 2 archivos
  preexistentes sin relación. Queda pendiente que el usuario nos confirme
  si además quiere reabrir el gate de Unidad natural (G5) — por ahora sigue
  como está, según lo decidido.
- 2026-09-17: **Tarea 4 completa.** `ResourceCreationReview.tsx`
  reescrito a listas de dos columnas monoespaciadas + sección "Nombre
  final" (reusa `buildResourcePresentationName`). Atributos muestran nombre
  legible en vez de código crudo. Tests actualizados
  (`resourceCreationReview.rest.test.tsx` +2 casos nuevos;
  `crearRecursoSurfaceWizard.test.tsx` ajustado a la nueva estructura).
  `pnpm typecheck`/`lint` limpios; suite completa: mismos 2 archivos
  preexistentes sin relación. Nota aparte (fuera de este cambio): usuario
  identificó que no existe una pestaña de "Presentación" en Catálogo para
  editar `hasPosition`/`position` de un atributo ya creado — "Reordenar
  atributos" es un decoy cosmético que no toca la presentación real (ver
  memoria `discovery/gap-no-hay-pesta-a-de-presentaci-n-en-cat-logo`).
  Diferido a después de este cambio.
- 2026-09-17: **Tarea 5 completa — feature cerrada, tareas 1-6 hechas.**
  `pnpm typecheck`/`lint`/`format` limpios en los archivos tocados; suite
  completa: mismos 2 archivos preexistentes sin relación
  (`resourceCreationReview.test.tsx` — legacy, prueba props que ya no existen
  en el componente REST; `crearRecursoSurface.test.tsx` — "Contrato
  pendiente"), ambos confirmados con `git stash -u` como fallas previas a
  esta sesión. El Creador de recursos ahora es keyboard-first de punta a
  punta: abrir → escribir/↑↓ → Enter → siguiente campo automático → ... →
  revisión → Enter → recurso creado, con rail compacto, secuenciador de
  atributos con re-evaluación dinámica contra Core, y revisión compacta.

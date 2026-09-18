# Catálogo — pestaña "Presentación"

## Objetivo

Agregar una tercera pestaña "Presentación" junto a "Resumen"/"Atributos" en
`CatalogHierarchyScreen.tsx`, mostrando qué atributos arman el nombre visible
de un Recurso (`buildResourcePresentationName`) y en qué orden, para el Tipo
seleccionado. Ejemplo objetivo: ver que "Cable THHW 12 AWG Cobre Negro 600V"
se arma con Tipo + [Aislamiento, Calibre, Color, Conductor, Voltaje] en ese
orden.

## Por qué

Pedido explícito del usuario: no había forma de ver, de un vistazo, qué
atributos participan del nombre de presentación y en qué orden. "Reordenar
atributos" (`ReorderAttributesSurface`) es un decoy — su propio texto aclara
que no toca PRESENTACION ni la descripción del Recurso.

## Alcance — fase 1 (esta fase, sin bloqueo de backend)

Solo lectura. Reusa `effectiveAttributes.attributes` que
`CatalogHierarchyScreen.tsx` ya trae para la pestaña Atributos — **cero
llamadas HTTP nuevas**. Evidencia: `tasks.md` confirma que
`GET .../attributes/effective` expone `position`/`hasPosition` idéntico a la
configuración PRESENTACION real (verificado contra `GET
/v1/catalog/PRESENTACION?typeCode=CABLE`).

- [x] 1. Nueva pestaña "Presentación" en el tablist existente
      (`catalog-summary-tabs`), mismo patrón `role="tab"`/`aria-selected`/
      `aria-controls` que Resumen/Atributos. `showCreationAction` ajustado a
      `activeTab === 'summary'` (antes `!== 'attributes'`) para que la CTA de
      creación tampoco aparezca en Presentación.
- [x] 2. Componente `CatalogTypePresentation.tsx`: lista ordenada
      (`<ol aria-label="Atributos que arman el nombre, en orden">`) de los
      atributos con `hasPosition: true` (orden por `position`), cada uno con
      su nombre; atributos sin posición mostrados aparte bajo "No participan
      del nombre:". Estados waiting-context/loading/error con el mismo
      patrón visual que `AttributeSummaryPanel` (clases `catalog-summary-*`
      ya existentes, sin CSS nuevo).
- [x] 3. Preview del patrón de nombre: "{Tipo} {Atributo1} {Atributo2} ...”
      (nombres de característica, no valores — no hay un Recurso concreto
      acá, es la plantilla del Tipo).

## Alcance — fase 2 (bloqueada, requiere confirmación de backend)

Editar `hasPosition`/`position` de un atributo ya asignado (activar/
desactivar participación, reordenar). Pedido explícito del usuario
(2026-09-18): mover el botón "Reordenar atributos" a la pestaña
Presentación y que su modal agregue el toggle "mostrar/no mostrar en la
presentación" — es decir, dejar de ser el orden cosmético de
`catalogAttributeOrder.api.ts` (que su propio texto aclara que NO toca
PRESENTACION) y pasar a editar PRESENTACION real.

**Hallazgo nuevo (2026-09-18):** `api-contract-evidence.md` línea 30-32 ya
documenta un **update genérico por kind** (`actor`, `expectedRevision`,
`values`, con `active`/`rules` opcionales) aplicable a los kinds de la
tabla de descriptors — que incluye `PRESENTACION`. El texto aclara
explícitamente "no se considera ausente", solo que "aún requiere
auditoría" (ruta exacta + confirmación en vivo para este kind puntual, no
solo documentado genéricamente). Esto es mejor de lo que se pensaba
inicialmente — probablemente sí existe capacidad de update, falta
precisar la ruta y verificar en vivo.

**Pregunta consolidada enviada al usuario para backend** (cubre las 4
piezas necesarias para el toggle real, no solo la original de
reordenar):
1. Ruta/método exactos del update genérico para `PRESENTACION` (¿`PUT`
   o `PATCH`? ¿`/v1/catalog/PRESENTACION/{id}`?), confirmado en vivo para
   este kind (no solo documentado genéricamente).
2. Confirmar que `active: false` en ese update es el mecanismo para
   "apagar" la participación de un atributo (coherente con el modelo de
   lifecycle revisionado del dominio — nunca borrar físico).
3. Confirmar que `GET .../attributes/effective` refleja `hasPosition:
   false`/omite el atributo una vez que su PRESENTACION queda `active:
   false` (para que la vista de solo-lectura ya construida en fase 1 siga
   siendo la fuente de verdad).
4. Para "prender" un atributo que ya tiene APLICABILIDAD pero nunca tuvo
   PRESENTACION: confirmar que `POST /v1/catalog/PRESENTACION` standalone
   (las 4 referencias existentes + `position`, sin recrear APLICABILIDAD)
   es válido y no genera conflicto/duplicado.

No arrancar esta fase sin esa confirmación (mismo criterio que `/evaluate`
y G5). El usuario eligió esperar la confirmación completa antes de mover
el botón, para no reubicarlo dos veces ni construir un modal intermedio
descartable.

**Respuesta de backend (2026-09-18), verificada contra el código fuente real
de garfex-api (no contra supuestos):**

1. Ruta confirmada: `PUT /v1/catalog/{kind}/{id}` genérico → para nosotros
   `PUT /v1/catalog/PRESENTACION/{id}`. Body `CatalogUpdateRequest`:
   `{ actor, expectedRevision, active?, values, rules? }` (`rules` opcional
   salvo para APLICABILIDAD). `openapi.yaml:159-189`, `openapi.yaml:944-953`.
2. **Bug real de Core, no una suposición**: `active: false` SÍ se persiste
   en la fila (`setActivePresentationFieldV2`,
   `catalog_admin_repository_v2.go:788-794`), pero `presentationFields()`
   (`resource_presentation.go:49-58`, usado tanto por `Describe()` como por
   `EffectiveAttributesFor`) filtra solo por class/family/type — **nunca
   chequea `field.Active`**. Una PRESENTACION desactivada sigue participando
   del nombre igual que una activa. Hoy es imposible "apagar" un atributo
   de la presentación, aunque el update en sí funcione.
3. Consecuencia directa del punto 2: `GET .../attributes/effective` sigue
   devolviendo `hasPosition: true` con la misma `Position` después de
   desactivar — mismo bug (`resource_effective_attributes.go:79-82`, sin
   chequeo de `Active`).
4. "Prender" un atributo que ya tiene APLICABILIDAD pero nunca tuvo
   PRESENTACION: **confirmado sin conflicto** — PK compuesta
   (`type_id`, `attribute_definition_id`), sin fila previa que choque
   (`catalog_admin_kinds.go:1383-1401`, `000002_resource_master.up.sql:128`).

**Decisión:** se pidió el fix del bug de Core (filtrar por `field.Active`
en `presentationFields()`, con test de regresión) — construir el toggle
"mostrar/no mostrar" contra el comportamiento actual crearía exactamente el
mismo problema que "Reordenar atributos" ya tiene (una UI que promete algo
que el backend no hace). El punto 4 ("prender" un atributo sin
PRESENTACION previa) ya está desbloqueado y no depende del fix.

**2026-09-18 — fix confirmado aplicado. Fase 2 desbloqueada por completo.**
Usuario pidió avanzar con todo junto (reorder real + toggle mostrar/ocultar)
y reemplazar "Reordenar atributos" (decoy cosmético,
`ReorderAttributesSurface.tsx`/`catalogAttributeOrder.api.ts`/
`useCatalogAttributeOrder.ts`, que pega contra `/v1/types/{typeCode}/attributes/order`
— un endpoint completamente distinto y sin relación con PRESENTACION) por
un editor real, movido a la pestaña Presentación.

### Plan fase 2

- [x] 7. `catalogPresentationAdmin.api.ts` nuevo: `listPresentations`
      (`GET /v1/catalog/PRESENTACION?typeCode=...`, mismo patrón que
      `catalogTypeAttributesRead.api.ts` para APLICABILIDAD) +
      `updatePresentation` (`PUT /v1/catalog/PRESENTACION/{id}`,
      `{actor, expectedRevision, active, values}` — `values` siempre
      completo, mismo wire shape que `presentationValues()` en
      `catalogAttributeCreation.api.ts`, sin `rules` (opcional salvo
      APLICABILIDAD)). Reusa `CatalogAttributeCreationApi.createPresentation`
      ya existente para "prender" un atributo sin PRESENTACION previa — no
      duplica la lógica de creación.
- [x] 8. `useCatalogPresentationAdmin.ts`: hook que cruza
      `effectiveAttributes` (todos los atributos asignados al Tipo) con
      `listPresentations` (cuáles ya tienen fila real), expone
      confirmar/alternar participación y reordenar, con conflicto 409 y
      revisión igual que `useCatalogAttributeOrder.ts`.
- [x] 9. `CatalogPresentationEditor.tsx`: modal en la pestaña Presentación
      (reemplaza a `ReorderAttributesSurface`), checkbox "Mostrar en la
      presentación" por atributo + subir/bajar entre los que participan.
- [x] 10. Eliminar `ReorderAttributesSurface.tsx`, `catalogAttributeOrder.api.ts`,
      `useCatalogAttributeOrder.ts` y sus tests; sacar el wiring de
      `attributeOrderApi` de `CatalogHierarchyScreen.tsx`/
      `CatalogTypeEffectiveAttributes.tsx`.
- [x] 11. Ampliar `restTransportBoundaries.test.ts`/`keyboardBoundaries.test.ts`
      al nuevo adapter (y sacar el viejo si estaba en alguna whitelist).

## Restricciones

- No tocar `catalogTypeAttributes.api.ts` (Convex legacy con
  `actualizarAsignacionAtributo`/`orden`) — esa capacidad es del backend
  Convex que se está reemplazando, no una base válida para código nuevo.
- No inventar un endpoint de actualización de PRESENTACION sin evidencia.
- Fase 1 no debe agregar ningún adapter HTTP nuevo ni tocar
  `restTransportBoundaries.test.ts`/`keyboardBoundaries.test.ts` — es
  puramente derivar UI de datos ya disponibles.

## TDD

Modo: **estricto**. RED → GREEN → REFACTOR por tarea.

## Progreso

- 2026-09-17: documento creado. Comenzando fase 1, tarea 1.
- 2026-09-17: **Fase 1 completa (tareas 1-3).** `CatalogTypePresentation.tsx`
  nuevo + wiring en `CatalogHierarchyScreen.tsx` (tercera pestaña, cero
  llamadas HTTP nuevas — reusa `effectiveAttributes` ya traído para
  Atributos). Tests: `catalogTypePresentation.test.tsx` (4 casos) +
  `catalogHierarchyScreen.test.tsx` (+1 caso de integración). `pnpm
  typecheck`/`lint`/`format` limpios; `tests/architecture/*` (incl.
  `restTransportBoundaries`/`keyboardBoundaries`) confirman cero adapters
  nuevos; suite completa: mismos 2 archivos preexistentes sin relación.
  Fase 2 (editar hasPosition/position) queda bloqueada hasta que el usuario
  confirme con backend un endpoint de actualización de PRESENTACION.
- 2026-09-18: **Fase 2 completa (tareas 7-11).** Backend confirmó ruta +
  arregló el bug de Core (`field.Active` ahora sí se chequea en
  `presentationFields()`/`EffectiveAttributesFor`). Construido: adapter
  `catalogPresentationAdmin.api.ts` (list + update reales sobre
  PRESENTACION), `catalogPresentationRows.ts` (deriva
  participante/no-participante cruzando atributos efectivos con filas
  reales), `useCatalogPresentationAdmin.ts` (toggle on/off + reorder,
  cada acción es un commit inmediato — no hay endpoint batch), y
  `CatalogPresentationEditor.tsx` (modal, reemplaza a
  `ReorderAttributesSurface`). Movido a la pestaña Presentación en
  `CatalogHierarchyScreen.tsx` (botón "Editar presentación" antes de la
  vista de solo lectura). Eliminados `ReorderAttributesSurface.tsx`,
  `catalogAttributeOrder.api.ts`, `useCatalogAttributeOrder.ts` y sus 3
  tests (nunca estuvieron commiteados — decoy descartado sin dejar
  rastro). Whitelists de `restTransportBoundaries.test.ts` y
  `keyboardBoundaries.test.ts` actualizadas: sale
  `catalogAttributeOrder.api.ts`, entra `catalogPresentationAdmin.api.ts`.
  Verificación: `pnpm typecheck`/`lint`/`format:check` limpios; suite
  completa (`pnpm exec vitest run`) 945 passed / 16 failed — los 16 son
  los mismos 2 archivos preexistentes documentados en fase 1
  (`crearRecursoSurface.test.tsx` "Contrato pendiente" y
  `resourceCreationReview.test.tsx`, forma de prop legacy), confirmados
  anteriores a esta sesión, sin relación con Presentación.
- 2026-09-18: **Bug reportado por el usuario, corregido.** El modal no
  dejaba activar (marcar como "en la presentación") un atributo que ya
  había tenido una fila PRESENTACION real y fue desactivado antes —
  producía CONFLICT. Causa raíz confirmada leyendo el código:
  `toggleParticipation` en `useCatalogPresentationAdmin.ts` decidía la
  rama por `row.id === null` (crear) vs. `row.id !== null` (actualizar), y
  la rama de actualización mandaba **siempre** `active: false`, sin
  importar si el click venía de la lista "en la presentación" (apagar,
  correcto) o de "fuera de la presentación" con una fila ya existente
  pero inactiva (prender, mandaba `active:false` de nuevo — nunca la
  encendía). RED: nuevo test en `useCatalogPresentationAdmin.test.tsx`
  ("reactivates it, instead of deactivating it again") reproduce
  exactamente el caso y confirmó el bug antes del fix. Fix: `PresentationRow`
  (`catalogPresentationRows.ts`) ahora expone `active: boolean`; el toggle
  calcula `turningOn = !row.active` y manda ese valor real, recalculando
  la posición al final de los participantes cuando se está prendiendo
  (crear o reactivar), igual que antes solo para crear. Tests actualizados
  (`catalogPresentationRows.test.ts` +1 caso, `useCatalogPresentationAdmin.test.tsx`
  +1 caso) y `toEqual` existentes ampliados con el campo `active`. Verificado:
  typecheck/lint/format limpios, suite completa 947 passed / 16 failed
  (mismos 2 archivos preexistentes, sin relación).
- 2026-09-18: **Segundo bug, mismo reporte de usuario ("a los 3 me da
  conflict").** Verificado contra el backend local real (`curl` directo a
  `http://localhost:8090`, sólo HTTP — nunca se leyó/ejecutó nada del
  repo `garfex-api`, respetando el límite de caja negra):
  - `GET /v1/catalog/PRESENTACION?typeCode=CABLE&scope=ALL` para el Tipo
    real que el usuario estaba editando confirma posiciones **1, 2, 3**
    (Aislamiento=1 inactivo id=2 rev=26, Calibre=2 activo id=3,
    Color=3 activo id=1) — NO 0-based ni consecutivas desde 0.
  - Causa raíz: `nextPosition` (usado tanto para crear como para
    reactivar) calculaba `participating.length` como la "próxima
    posición libre". Con 2 participantes activos (Calibre, Color) eso da
    `'2'` — que es exactamente la posición REAL de Calibre. Cualquier
    atributo que el usuario intentara prender (Aislamiento, Material del
    conductor o Voltaje) pedía la misma posición `2` ya ocupada →
    CONFLICT del backend, igual para los tres, tal como se reportó.
  - Fix: nueva función `nextPosition(rows)` en
    `useCatalogPresentationAdmin.ts` que calcula `max(posiciones
    existentes) + 1` en vez de `.length`, garantizando un slot libre
    sin importar gaps por desactivaciones históricas. Aplicado tanto al
    crear (`row.id === null`) como al reactivar (`turningOn` con
    `row.id !== null`).
  - RED: nuevo test "computes the next position from the highest
    existing position..." reproduce exactamente los datos reales
    (posiciones 1/2/3) y confirmó el bug antes del fix.
  - **Hallazgo separado, reportado al usuario, NO corregido acá (es
    backend)**: el mismo `curl` a `GET
    /v1/types/CABLE/attributes/effective` muestra `hasPosition: true,
    position: 1` para Aislamiento pese a que su PRESENTACION real es
    `active:false` — el fix de Core del 2026-09-18 (filtrar por
    `field.Active`) no está teniendo efecto en esta instancia local
    (no desplegado, o revertido, o necesita reinicio). Sólo se
    reporta la evidencia HTTP observada, sin tocar el repo backend.
  - Verificado: typecheck/lint/format limpios, suite completa 948
    passed / 16 failed (mismos 2 preexistentes).
- 2026-09-18: **Tercer bug, mismo reporte de usuario ("al querer subir
  aislamiento me da el fallo de conflict").** Esta vez en `Subir`/`Bajar`
  (moveUp/moveDown), no en el toggle. Causa raíz confirmada con
  reproducción directa contra el backend real (dos `curl PUT` en paralelo,
  replicando exactamente lo que mandaba `swap()`): ambos requests
  devuelven `{"error":"conflict","code":"DUPLICATE"}` con `HTTP 409`. La
  posición es única por Tipo y cada `PUT` se valida y commitea de forma
  independiente — `swap()` mandaba los dos updates con `Promise.all`
  (concurrentes), y cada uno pide la posición que la OTRA fila todavía
  tiene en ese instante → colisión real, no imaginaria.
  Fix verificado en vivo ANTES de tocar código: hice el swap real vía 3
  `PUT` secuenciales (mover la fila actual a una posición libre temporal
  más allá de todas las posiciones en uso, mover la fila destino a la
  posición original de la actual, mover la actual de la temporal a la
  posición original del destino) — los 3 devolvieron `200 OK`. Aplicado
  ese mismo patrón a `swap()` en `useCatalogPresentationAdmin.ts`,
  reutilizando `nextPosition()` (ya existente del hallazgo anterior) para
  calcular la posición temporal. RED: nuevo test "swaps sequentially
  through a free scratch position..." reproduce los datos reales
  (Calibre=2, Color=3, Aislamiento=4) y confirmó el bug (mandaba la
  posición colisionante directo en el primer call) antes del fix.
  Verificado: typecheck/lint/format limpios, suite completa 949 passed /
  16 failed (mismos 2 preexistentes). Estado real del backend confirmado
  tras las pruebas: Calibre(2), Aislamiento(3), Color(4) — el swap que el
  usuario pedía en la UI quedó aplicado correctamente.
- 2026-09-18: **Cuarto bug, mismo reporte ("intente subir de nuevo
  aislamiento y me dio conflict, sigue fallando").** El usuario probo de
  nuevo despues del fix anterior y seguia fallando; verificado que el
  estado real en backend no habia cambiado (mismas revisiones), o sea el
  intento realmente fallaba, no era cache/HMR. Causa raiz nueva,
  confirmada en vivo: `nextPosition()` (tanto para crear/reactivar como
  para el scratch del swap) solo consideraba las filas `participating`
  (activas) al calcular "la posicion libre siguiente". Pero la unicidad
  de `position` en el backend es por Tipo sin importar `active` -- una
  fila inactiva (Material del conductor, id=20, posicion 5) sigue
  ocupando su posicion. Reproducido con `curl PUT` directo: mover
  Aislamiento a la posicion 5 (que Material del conductor ocupa,
  inactivo) devuelve `409 {"error":"conflict","code":"DUPLICATE"}` igual
  que antes; moverlo a posicion 6 (mas alla de TODAS las filas reales,
  activas e inactivas) devuelve `200 OK`. Diagnostico hecho y revertido
  sobre el backend real del usuario antes de tocar codigo.
  Fix: `nextPosition()` ahora recibe la lista completa `presentations`
  (todas las filas PRESENTACION reales del Tipo, activas e inactivas) en
  vez de solo `participating`, en los tres call-sites (crear, reactivar,
  scratch del swap). Tests: nuevo caso "picks the next free position past
  every real record, including an inactive one" (RED confirmado con
  `position:'5'`, colision real reproducida) + ajustado el valor esperado
  de un test existente de reactivacion (ahora `position:'2'` en vez de
  `'1'`, consistente con la nueva regla mas conservadora pero siempre
  correcta). Verificado: typecheck/lint/format limpios, suite completa
  950 passed / 16 failed (mismos 2 preexistentes). Estado real del
  backend confirmado sin cambios indebidos: Calibre(2), Aislamiento(3),
  Color(4), Material del conductor(5, inactivo).
- 2026-09-18: **Quinto bug, distinto a los anteriores** ("ya vi y presenta
  bien en catalogo maestros. solo que paso algo curioso un bug al mover
  uno me apareco este fallo Invalid presentation creation response").
  No es un problema de `position` esta vez. Causa raiz encontrada leyendo
  el codigo fuente (`same()` en `catalogAttributeCreation.api.ts:564-571`):
  el validador de la respuesta de `POST /v1/catalog/PRESENTACION` exige
  que `values.class/family/type/characteristic` de la respuesta coincidan
  EXACTO (incluido el `id`, no solo `code`) contra el `input` que se le
  paso. Este chequeo es intencional -- `tests/unit/catalogAttributeCreationPresentation.test.ts`
  tiene un caso `mismatchedReference` que prueba justamente esto.
  `useCatalogPresentationAdmin.ts` construia esas referencias con su
  propio helper `reference()` que siempre mandaba `id: '0'` (placeholder),
  pero el backend responde con los ids REALES resueltos (confirmado con
  `curl POST` directo: pedis con id='0', la respuesta trae
  `characteristic.id` real, `type.id` real, etc.) -- entonces la
  comparacion `same()` fallaba SIEMPRE para cualquier "prender" un
  atributo que nunca tuvo PRESENTACION. La fila se creaba bien en el
  backend (por eso el usuario veia el resultado correcto en Catalogo
  maestros despues), pero el cliente tiraba el error de todas formas.
  Patron correcto ya establecido en `useCatalogAttributeCreation.ts`:
  resolver primero `resolveHierarchyReferences()` (ids reales de
  clase/familia/tipo) y buscar la caracteristica real via
  `searchCharacteristics()` antes de construir el input de
  `createPresentation`. Aplique el mismo patron en
  `useCatalogPresentationAdmin.ts`, ampliando `creationApi` a
  `Pick<CatalogAttributeCreationApi, 'createPresentation' |
  'resolveHierarchyReferences' | 'searchCharacteristics'>` (antes solo
  `createPresentation`) y eliminando el helper `reference()` con
  placeholder. Verificado en vivo ANTES del fix (POST con id real por
  `curl` contra CABCON/NUMH, Tipo limpio para no ensuciar CABLE) -- 201
  OK con la respuesta echando los ids reales; diagnostico revertido
  (desactivado, nunca borrado fisico). Tests actualizados/agregados en
  `useCatalogPresentationAdmin.test.tsx` y `catalogPresentationEditor.test.tsx`
  (helper `creationApi()` ahora mockea tambien `resolveHierarchyReferences`/
  `searchCharacteristics`). Verificado: typecheck/lint/format limpios,
  suite completa 950 passed / 16 failed (mismos 2 preexistentes; una
  falla adicional de `useCatalogAttributeCreation.test.tsx` en una
  corrida resulto flaky, confirmada pasando en aislamiento y en una
  segunda corrida completa).
- 2026-09-18: **Confirmado por el usuario en el navegador** ("lo que he
  probado ya funciona"): toggle on/off, reactivar un atributo previamente
  desactivado, y Subir/Bajar funcionan sin conflict tras los 5 fixes de
  hoy. Fase 2 y esta feature se dan por cerradas.

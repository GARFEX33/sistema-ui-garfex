# Detalle de diseño — Creador de recursos Keyboard First

[design.md](./design.md) es la autoridad de arquitectura y alcance. Este archivo concreta las transiciones, algoritmos, propiedad de foco, reconciliación, cambios de archivos y pruebas. Ningún tipo ilustrativo de este documento define un DTO backend.

## 1. Snapshot y propiedad local

Se conservan los contratos implementados:

```ts
export type InitialResourceHierarchySnapshot = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
}>

export type NormalizedResourceHierarchyPrefix = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
  depth: 0 | 1 | 2 | 3
}>
```

`ResourcesMasterScreen` deriva el snapshot sólo de selección e items actualmente cargados. `open()` captura el último prop cerrado y conserva exclusivamente el prefijo continuo válido. Un diálogo abierto no se resincroniza con la pantalla.

La surface recibe datos, no `selectClass`, `selectFamily`, `selectType`, criterios de listado ni setters de búsqueda. La selección interna nunca modifica el contexto de Maestro de Recursos. `resourceIdKey` sigue siendo la única normalización de identidad para contratos existentes.

## 2. Máquina de etapas disponible ahora

Se elimina `resource-data`, `review` y el resultado legado. La capacidad actual usa:

```ts
type CreationStage =
  | { kind: 'class' }
  | { kind: 'family' }
  | { kind: 'type' }
  | { kind: 'unit' }
  | { kind: 'contract-pending'; blockedCapability: 'attributes-v1' }
```

El estado local conserva jerarquía, Unidad confirmada, revisión incremental del borrador y dos slots que siempre son nulos antes de backend v1:

```ts
type BackendIndependentCreationDraft = Readonly<{
  hierarchy: InitialResourceHierarchySnapshot
  unit: UnitCandidate | null
  selectionBuckets: SelectionBuckets<never>
  authoritativeEvaluation: null
  catalogFingerprint: null
  revision: number
}>
```

`SelectionBuckets<never>` expresa que la estructura existe pero el runtime actual no puede fabricar selecciones. No representa allowed values ni un request backend.

### Transiciones

| Evento | Efecto atómico | Etapa siguiente |
| --- | --- | --- |
| `OPEN(prefix)` | Reinicia borrador, evaluación y fingerprint; copia el prefijo | primera etapa faltante, o Unidad para depth 3 |
| `CONFIRM_CLASS(item)` | Si cambia ID, invalida Familia, Tipo, Unidad, buckets, evaluación y fingerprint | Familia |
| `CONFIRM_FAMILY(item)` | Si cambia ID, invalida Tipo, Unidad, buckets, evaluación y fingerprint | Tipo |
| `CONFIRM_TYPE(item)` | Si cambia ID, invalida Unidad, buckets, evaluación y fingerprint | Unidad |
| `CONFIRM_UNIT(candidate)` | Guarda candidata hidratada; invalida evaluación y fingerprint incluso si antes fueran nulos | Contrato pendiente |
| `NAVIGATE_TO_CONFIRMED(stage)` | Cambia sólo etapa; no modifica selecciones válidas | etapa solicitada |
| `BACK` | Vuelve según orden determinista | etapa anterior |

Reconfirmar exactamente el mismo ID no borra descendientes, pero confirmar una Unidad distinta sí incrementa `revision` e invalida cualquier evaluación futura. Ninguna carga, filtro, reparación de candidato o preferencia de Unidad emite `CONFIRM_*`.

Orden de vuelta actual:

```text
Contrato pendiente ← Unidad ← Tipo ← Familia ← Clase
```

En Clase, `BACK` no cambia estado. `Escape` decide después si cierra.

## 3. Modelo puro active/suspended por assignment ID

El modelo backend-independent se implementa en un módulo puro genérico. Sus tipos son internos y deliberadamente no describen transporte:

```ts
type AssignmentKey = string

type SelectionBuckets<TSelection> = Readonly<{
  active: Readonly<Record<AssignmentKey, TSelection>>
  suspended: Readonly<Record<AssignmentKey, TSelection>>
  omitted: ReadonlySet<AssignmentKey>
}>
```

Reglas invariantes:

1. La clave se obtiene del **assignment ID**, nunca del índice ni del definition ID.
2. Una clave aparece como máximo en uno de `active` o `suspended`.
3. `omitted` es distinto de “sin respuesta” y no fabrica un valor.
4. Sólo `active` puede proyectarse a una solicitud futura.
5. Cambiar Clase/Familia/Tipo borra los tres buckets; cambiar Unidad conserva los buckets y sólo invalida evaluación/fingerprint, tras lo cual la siguiente evaluación autoritativa reconciliará aplicabilidad.
6. Toda mutación efectiva incrementa `revision` e invalida evaluación/fingerprint en la misma transición.

Operaciones puras disponibles para pruebas, sin simular backend:

- `confirmSelection(key, selection)`: escribe en active, elimina la misma clave de suspended/omitted;
- `omitSelection(key)`: sólo se invoca cuando un hecho autoritativo futuro marque la asignación como omitible; elimina active y registra omitted;
- `suspendSelection(key)`: mueve active a suspended sin alterar el valor;
- `restoreSelection(key)`: mueve suspended a active sólo cuando el caller aporta el hecho autoritativo de que aplica y sigue permitido;
- `keepSuspended(key)`: conserva el valor retenido cuando ya no puede restaurarse;
- `dropAssignments(keys)`: se reserva para invalidación jerárquica, no para interpretar condiciones.

Antes del DTO v1, tests de estas funciones usan valores opacos locales y comandos explícitos; no crean respuestas falsas de `evaluarCreacionDesdeSelecciones`.

## 4. Reconciliación futura tras evaluación autoritativa

La reconciliación no evalúa `CONDITIONAL`. Después de integrar DTOs exactos, un adapter validado convertirá cada respuesta vigente en hechos UI explícitos. El detalle exacto de esos hechos se diseñará a partir del DTO publicado; no se fija aquí un interface TypeScript.

Semántica obligatoria:

1. Descartar la respuesta si no coincide su token de request, contexto jerárquico, Unidad y `draft.revision` capturados.
2. Adoptar status, fingerprint, issues, nombre, identidad y orden de asignaciones únicamente desde esa respuesta.
3. Para cada assignment ID que backend diga que dejó de aplicar, mover active → suspended.
4. Para cada assignment ID que backend diga que volvió a aplicar y cuyo valor retenido backend confirme aún permitido, mover suspended → active.
5. Si vuelve a aplicar pero el valor ya no está permitido, conservarlo suspended y presentar esa asignación como decisión pendiente sin enviarlo como active.
6. No eliminar selecciones suspendidas por reordenamiento ni por una evaluación incompleta.
7. Proyectar futuras requests sólo desde selecciones activas y omisiones que el contrato exacto admita.

La evaluación adoptada es una lease ligada a `draft.revision`. Cualquier selección, omisión, restauración, Unidad o cambio jerárquico la elimina junto con su fingerprint antes de iniciar otra request.

## 5. Secuencia futura de atributos

Cuando backend v1 exista, las etapas adicionales se incorporarán sin alterar la secuencia inicial:

```ts
// Forma local de navegación; no es un DTO.
type BackendEnabledStage =
  | CreationStageWithoutContractPending
  | { kind: 'attribute'; assignmentKey: string }
  | { kind: 'authoritative-review' }
  | { kind: 'result' }
```

El orden procede de las asignaciones resueltas de la evaluación vigente. La navegación almacena `assignmentKey`; el índice se deriva al renderizar para evitar asociar una selección a otra asignación si cambia el orden.

- El rail muestra una sola entrada `Atributos · n de total`.
- `n` es la posición 1-based del assignment ID activo dentro de la secuencia vigente.
- `total` procede exclusivamente de la secuencia autoritativa vigente.
- Si una nueva evaluación cambia la secuencia, se conserva el assignment actual si sigue pendiente; si desaparece, se elige determinísticamente la primera decisión pendiente devuelta por backend.
- Nunca se muestran todas las asignaciones como controles simultáneos.
- Sólo `modoCaptura: SELECCION` ofrece valores permitidos.
- `LIBRE` muestra “Modo no soportado” sin input.
- `DERIVADO` muestra “Fuera de v1” sin valor simulado.
- **Omitir** aparece sólo si el resultado autoritativo/contrato lo permite.
- Una requerida pendiente no puede desembocar en evaluación `VALID`.

No se reutilizan `listAttributeAssignments`, `listAttributeOptions` ni `tipoDato` actuales para fabricar esta secuencia: no aportan `modoCaptura`, valores tipados ni resolución condicional autoritativa.

## 6. Cargas jerárquicas y rechazo stale

Clase, Familia y Tipo usan instancias independientes de `createParentGatedListController` con `PAGE_SIZE = 20`:

- Clase no requiere padre.
- Familia usa `classId` como context key.
- Tipo usa `familyId` como context key.
- Reentrar con el mismo contexto conserva páginas y filtro local.
- Reemplazar padre ejecuta `setContext` antes de cargar y hace stale cualquier promesa previa.
- Se conserva acumulación, orden de primera aparición, dedupe por ID, retry inicial acotado, retry de continuación y cursor explícito.

Una adopción sólo es válida si `{token, contextKey, cursor}` siguen vigentes. Un cursor repetido no exhaustivo es error recuperable, no bucle. El filtro no añade argumentos al adapter ni dispara red.

`useResourceCreationFlow` debe exponer el mismo contrato conceptual para las tres etapas:

```text
items + SelectorLoadState + confirm + continue + retry
```

No se necesita una interfaz pública nueva; cada item mantiene su tipo actual validado por `resourcesMaster.api.ts`.

## 7. Unidad natural desde políticas efectivas

`UnitCandidate` sigue siendo un tipo local compuesto, no un DTO:

```ts
type UnitCandidate = Readonly<{
  unidadId: ResourceId
  clave: string
  nombre: string
  simbolo?: string
  principal: boolean
  selected: boolean
}>
```

El loader dependiente recorre sólo páginas solicitadas explícitamente de políticas para el Tipo vigente:

1. llama al listado existente con Tipo, cursor y page size;
2. conserva políticas activas/efectivas y excluye shadowed/suppressed según los campos actuales;
3. deduplica políticas por policy ID y unidades por `unidadId`;
4. hidrata cada nueva unidad con `getUnit` una sola vez;
5. ofrece únicamente detalle no nulo, activo y efectivo;
6. combina flags repetidos `principal`/`selected` con OR y conserva el primer orden;
7. adopta todo resultado sólo para el token/contexto/cursor vigente.

Una preferencia `principal`, luego `selected`, sólo decide el candidato al que se transfiere foco. Nunca escribe `draft.unit`: Enter o click explícito siguen siendo obligatorios.

Una hidratación rechazada produce error parcial, conserva candidatas resueltas y bloquea confirmación hasta retry de los IDs fallidos. `null`, inactiva o no efectiva se excluye como referencia confirmadamente no elegible. No se muestra un ID como etiqueta inventada.

Si hay cursor, **Cargar más…** amplía explícitamente. Si la página actual está pendiente o tiene hidrataciones fallidas, la confirmación se bloquea. Cambiar Tipo invalida inmediatamente políticas, detalles y candidato anteriores.

## 8. Contrato mecánico de `StagedSearchSelector`

La composición permanece en `resources-master` y usa `Field` para la etiqueta/espaciado del buscador, `SearchField`, `Input`, `ListBox` y `ListBoxItem` de React Aria, y `Button` compartido. `Field` apunta mediante `htmlFor` al `Input`; no se duplica una segunda etiqueta visible.

Props locales:

```ts
type StagedSearchSelectorProps<T> = {
  label: string
  items: readonly T[]
  itemKey: (item: T) => string
  itemName: (item: T) => string
  renderItem?: (item: T) => ReactNode
  confirmedKey?: string | null
  preferredCandidateKey?: string | null
  loadState: SelectorLoadState
  onConfirm: (item: T) => void
  onLoadMore: () => void
  onRetry: () => void
}
```

- El input recibe foco al entrar a Clase, Familia, Tipo o Unidad.
- El filtro es controlado y feature-local. Compara exclusivamente `itemName(item)` con `query.trim()` usando `toLocaleLowerCase('es')` e `includes`; no busca clave, símbolo, ID ni descripción y no elimina diacríticos de forma implícita.
- El texto cercano será «Filtra por nombre entre los elementos cargados». Si el resultado filtrado está vacío pero existe continuación, dirá «No hay coincidencias entre los elementos cargados» y mantendrá **Cargar más…**.
- `activeKey` es una selección provisional del `ListBox`, no el valor confirmado del borrador. Habrá exactamente uno si existen candidatos visibles, o `null` si no existen.
- Al cambiar filtro o items, si `activeKey` sigue visible se conserva. Si desaparece, se asigna el primer visible; si no hay visibles se limpia. Este reajuste nunca llama `onConfirm`.
- `preferredActiveKey` se aplica sólo al primer conjunto listo de una etapa. En Unidad representa la principal o seleccionada efectiva ya hidratada. Sigue siendo provisional y requiere `Enter`.
- `ListBox` usa selección simple controlada para exponer `aria-selected` al candidato provisional. `onSelectionChange` sólo actualiza `activeKey`; `onAction` por `Enter` o click confirma el item visible actual y avanza.
- **Cargar más…** está fuera del conjunto de opciones: es un botón explícito, tabbable y deshabilitado durante `loading-more`. Conserva query, items y candidato activo. Un retry de continuación usa el mismo cursor.
- Loading inicial usa `role="status"`; vacío exhaustivo usa `role="status"`; errores usan `role="alert"` con Button **Reintentar**; error parcial conserva lista y ofrece **Reintentar continuación**.

No se usa `HierarchyNavigator`: la semántica de columnas, selección inmediata y navegación espacial es diferente.

## 5. Propiedad exacta de teclado y foco

| Contexto                    | Propietario                                         | Comportamiento                                                                                                                                                                                                                        |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input del filtro            | React Aria SearchField + handler local del selector | Texto, borrado, caret e IME permanecen nativos. `ArrowDown`/`ArrowUp`, sólo sin composición/modificadores y si no está consumido, transfieren foco al candidato provisional visible; no confirman.                                    |
| Lista de candidatos         | React Aria ListBox                                  | `ArrowUp`/`ArrowDown` cambian foco/candidato; `Enter` dispara `onAction` y confirma; no existe listener de documento.                                                                                                                 |
| Inputs TEXTO/NUMERO y datos | Control local de etapa                              | Edición, caret, selección e IME tienen precedencia. `Enter` avanza sólo en input de una línea, sin composición, tras validación; no se captura en controles multilínea si aparecieran.                                                |
| Selectores OPCION/BOOLEANO  | ListBox React Aria local                            | Flechas mueven candidato y `Enter` confirma. Un opcional mantiene además el Button **Omitir**.                                                                                                                                        |
| `ArrowLeft` de etapa        | Contenedor del flujo, en bubbling                   | Vuelve sólo si `defaultPrevented` es falso, no hay composición/modificadores y el target no es input, textarea, select ni contenteditable. En un input mueve el caret; se vuelve mediante breadcrumb o foco a un control no editable. |
| `Escape`                    | Root local del diálogo                              | Si un control hijo no lo consumió y no hay IME, hace `preventDefault` + `stopPropagation` y cierra una vez. Un popover React Aria puede consumir primero Escape.                                                                      |
| `Tab`/`Shift+Tab`           | Dialog/Modal de React Aria                          | Navegación y contención modal nativas; nunca se interceptan globalmente.                                                                                                                                                              |
| Atajos de AppShell          | KeyboardController existente                        | El overlay registrado impide acciones de fondo; además respeta `defaultPrevented`.                                                                                                                                                    |

Todo handler custom empieza por `event.defaultPrevented || event.nativeEvent.isComposing`. No se capturan flechas o Enter en el root del diálogo. Esto evita que una escritura o cambio de filtro confirme silenciosamente un item.

Al cambiar de etapa, un efecto de foco dependiente de `stage` enfoca el control principal: filtro para selectores, control del atributo, Nombre en Datos, heading `tabIndex={-1}` en Revisión y estado en Resultado. Un error requerido enfoca el mismo control con `aria-invalid` y `aria-describedby`. Las migas son botones con nombre accesible y `aria-current="step"` en la etapa activa.

Al cerrar se conserva `registerOverlay(() => dialogRef.current)` y `restoreFocusNextFrame(openerRef.current, [trigger, sidebar.recursos])`. El opener se captura al abrir por trigger o atajo. No se enfoca `body` ni un nodo desconectado.

## 6. Unidad natural desde políticas efectivas

`UnitCandidate` combina política y detalle sin modificar tipos públicos:

```ts
type UnitCandidate = Readonly<{
  unidadId: ResourceId
  clave: string
  nombre: string
  simbolo?: string
  principal: boolean
  selected: boolean
}>
```

Por cada página pedida explícitamente a `listUnitPolicies({ tipoRecursoId, cursor, pageSize: 20 })`:

1. se aceptan políticas `activo && effective`, no shadowed y cuya `selection` no sea `SHADOWED` ni `SUPPRESSED`;
2. se deduplican políticas por `policy.id` y candidatos por `unidadId`;
3. para cada nuevo `unidadId` se ejecuta `getUnit({ unidadId })` mediante `Promise.allSettled`;
4. sólo se ofrece un detalle no nulo con `activo && effective`;
5. candidatos repetidos conservan orden inicial y combinan `principal`/`selected` con OR; no repiten hidratación;
6. la etiqueta visible incluye `clave — nombre` y el símbolo cuando existe; el filtro sigue usando sólo `nombre`.

Una hidratación rechazada deja la página en error parcial, conserva detalles ya resueltos, muestra retry y bloquea confirmación hasta resolver las fallidas. El retry repite sólo los `unidadId` fallidos del token vigente. Un `null`, una Unidad inactiva o no efectiva representa una referencia no elegible confirmada: se excluye, se informa de forma genérica como opción no disponible y no se reintenta automáticamente. Si al agotar políticas no queda candidato y no hay fallos pendientes, el estado es vacío confirmado y no se puede avanzar.

La existencia de una página siguiente no bloquea confirmar una Unidad ya hidratada y elegible, igual que en los selectores jerárquicos; **Cargar más…** permite ampliar explícitamente. Una página actualmente pendiente o con hidrataciones fallidas sí bloquea. El primer candidato principal hidratado es preferido; si no existe, el primer `selected`; si no, el primero visible. Ninguno se copia a `draft.unit` hasta `Enter`/acción explícita.

Cambiar Tipo invalida políticas, hidrataciones y candidato antes de iniciar el nuevo contexto.

## 7. Resolución y recorrido secuencial de atributos

Las asignaciones deben conocerse completas antes de fijar orden, por lo que su loader obtiene secuencialmente todas las páginas con cursor hasta `isExhausted`; esto no es búsqueda simulada y no introduce interacción de paginación al usuario. Se deduplica por assignment ID y se descartan primero `!effective`, `FORBIDDEN` y `NOT_APPLICABLE`. Las restantes se ordenan por `orden`, con orden de llegada como desempate estable.

Cada definición se hidrata una sola vez. Una definición rechazada, nula, inactiva o no efectiva deja la resolución en error recuperable porque omitirla silenciosamente podría ocultar un atributo requerido. Para `OPCION`, se acumulan todas las páginas activas, se deduplican por option ID y se conservan sólo opciones efectivas. Cualquier fallo de definición/opciones bloquea la secuencia hasta retry. Todas las adopciones comparan el token y Tipo vigentes.

Un estado listo con cero asignaciones aplicables muestra «Este Tipo no tiene atributos aplicables» y permite pasar a Datos del Recurso. No se confunde con una carga incompleta.

Cada atributo genera una etapa:

- `TEXTO`: input de texto;
- `NUMERO`: input number y la conversión actual se difiere al payload;
- `BOOLEANO`: ListBox Sí/No que conserva raw `'true' | 'false'`;
- `OPCION`: ListBox de opciones efectivas que conserva option ID.

Sólo `REQUIRED` bloquea. `OPTIONAL` y `CONDITIONAL` muestran **Omitir**. Omitir registra el ID en `omittedAttributeIds`, borra un valor previo y avanza; nunca crea string vacío ni entrada de payload. Escribir/seleccionar un valor retira la omisión. Volver conserva ambos mapas mientras no cambie el Tipo.

Un OPCION requerido sin opciones efectivas muestra estado vacío y no avanza; uno no requerido puede usar **Omitir** después de que la resolución vacía sea confirmada.

## 8. TDD y verificación

### Seams y pruebas unitarias puras

- `resourceCreation.model.test.ts`: matriz de prefijo 0/1/2/3, padre cruzado/stale, primera etapa, navegación, reset exacto de descendientes, mismo-ID sin reset, preservación al volver, omisión y `draft.revision`.
- `resourceCreation.payload.test.ts`: parity de los cuatro tipos, trims, descripción opcional, ownership, ausencia de omitidos y mismo objeto lógico para review/submit.
- `resourceCreation.loaders.test.ts`: acumulación/dedupe, retry de cursor, cursor repetido, respuesta stale por padre/Tipo, páginas de policies, ranking principal/selected, unidad duplicada, null/inactiva/no efectiva, hydration rejected y retry; assignments/options multipágina y respuesta stale.
- Los tests de loader usarán deferred promises controladas; no dependerán de timers arbitrarios.

### RTL de componentes y flujo

- `StagedSearchSelector.test.tsx`: nombre-only, alcance local, active único, filtro que elimina active sin confirmar, ArrowUp/Down, Enter/onAction, IME, `defaultPrevented`, carga más que conserva query/items, dedupe, empty/error/retry y foco visible observable.
- `crearRecursoSurface.test.tsx`: apertura por trigger/N; snapshot heredado profundo inicia Unidad; prefijos inválidos; breadcrumb; aislamiento respecto de callbacks de pantalla; todas las cascadas; Unidad explícita; atributos uno por uno; required/focus; Omitir; volver/preservar; cambio de Tipo; Datos; review/payload; submit único; known error; success; uncertainty revision lock; Escape una vez y fallback de foco.
- `resourcesMasterScreen.test.tsx`: el mock del diálogo captura el snapshot y prueba presente/ausente/cruzado sin cambiar los criterios de lista.
- `resourcesMasterScreenRefetch.test.tsx`: adapta el mock al nuevo prop y conserva que sólo la query observada se relee tras callback confirmado.

### Browser, axe y arquitectura

- `resourcesMaster.workstation.spec.ts` añade un recorrido real sólo teclado a 1440×980: seleccionar jerarquía del Maestro, abrir con `N`, comprobar inicio en Unidad, confirmar Unidad, recorrer/omitir atributos, llenar Datos, revisar y crear. Comprueba foco tras cada etapa, que el filtro del fondo no cambia y que sólo se repite la request activa.
- Un escenario de selector multipágina comprueba filtro local, **Cargar más…**, dedupe y que Enter confirma el candidato enfocado, no el reemplazado por filtro.
- Un escenario de Escape comprueba una sola clausura, opener elegible y fallback cuando el opener se retira/deshabilita.
- Axe se ejecuta con diálogo abierto al menos en selector y Revisión, además del chequeo existente de pantalla.
- `keyboardBoundaries.test.ts` amplía su inventario/scan a los nuevos archivos y mantiene exactamente un listener global; prohíbe listeners `document/window` en toda la feature.
- `queryZodBoundaries.test.ts`, `catalogHierarchyBoundaries.test.ts` y `runtimeFixtureIsolation.test.ts` corren sin cambios de contrato.
- Un guard `resourceCreationBoundaries.test.ts` verifica que el selector siga en `resources-master`, que los archivos runtime de creación estén bajo 500 líneas y que ninguno importe React Query, Convex, Catálogo o estado global.

Comandos previstos, registrando resultado exacto en cada work unit:

```bash
pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.payload.test.ts
pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts
pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/unit/crearRecursoSurface.test.tsx
pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx
pnpm exec vitest run tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/resourceCreationBoundaries.test.ts
pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Cada slice empieza con una prueba RED del contrato que agrega y termina GREEN con prueba enfocada más el mínimo typecheck/arquitectura aplicable. Tests y comportamiento permanecen en el mismo commit/PR; no se crea un PR separado de «sólo tests» después del código.

## 9. Entrega en feature-branch-chain y presupuesto

Estrategia confirmada: **feature-branch-chain**, tracker draft/no-merge. Límite: menos de 400 líneas cambiadas (`additions + deletions`) por child PR; no hay `size:exception`. Las cifras son presupuestos objetivo con margen, no autorización para excederlos.

```text
feat/keyboard-first-resource-creation (tracker draft/no-merge)
└─ PR 1 snapshot/model (target: tracker)
   └─ PR 2 reducer/navigation
      └─ PR 3 paged dependent loaders
         └─ PR 4 staged selector
            └─ PR 5 hierarchy integration
               └─ PR 6 Natural Unit integration
                  └─ PR 7 sequential attributes + resource data
                     └─ PR 8 review/result/payload + prototype cleanup
                        └─ PR 9 browser/architecture/refetch closure
```

| PR  | Inicio → fin                                                                                                | Presupuesto objetivo | Verificación del slice               | Rollback aislado                              |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------: | ------------------------------------ | --------------------------------------------- |
| 1   | pantalla sin snapshot → contrato derivado/normalizado probado y prop pasivo                                 |              300–360 | model + screen focused tests         | retirar prop/helper                           |
| 2   | navegación implícita → reducer tipado con resets/preservación                                               |              320–380 | reducer tests + typecheck            | retirar reducer, mantener snapshot            |
| 3   | loaders de una página → controladores paginados/stale puros                                                 |              330–390 | loader tests                         | retirar nuevos loaders                        |
| 4   | Select convencional → selector staged local probado, aún en seam controlado                                 |              340–395 | selector RTL + keyboard architecture | retirar componente local                      |
| 5   | Contexto de cuatro selects → Clase/Familia/Tipo por etapas con breadcrumb                                   |              350–395 | surface hierarchy/snapshot tests     | restaurar bloque Contexto del parent          |
| 6   | Unidad preseleccionada → policies paginadas/hidratadas y confirmación explícita                             |              340–390 | unit loader + surface tests          | restaurar unidad del parent sin tocar adapter |
| 7   | atributos simultáneos → atributos uno a uno + Omitir + Datos                                                |              360–395 | attribute/preservation RTL           | revertir presenters/reducer events del slice  |
| 8   | resumen acoplado → review desde payload + success/error/uncertain y eliminación de remanentes del prototipo |              360–395 | payload/result/submit tests          | revertir shell/result del slice               |
| 9   | evidencia parcial → browser/axe, refetch y guards finales                                                   |              250–380 | e2e + architecture + full gates      | retirar sólo pruebas/guards adaptados         |

En apply se hará una sola división honesta adicional si el `git diff --numstat` de un slice llega a 400. Si aun así no cabe, `ask-on-risk` obliga a detenerse y pedir una nueva decisión; no se comprimen pruebas, comentarios o código y no se infiere una excepción. El current boundary de esta fase son sólo los artefactos de diseño; no se crea tracker, rama, commit ni PR.

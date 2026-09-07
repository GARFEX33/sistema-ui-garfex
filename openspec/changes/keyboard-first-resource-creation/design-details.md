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

`confirmedKey` y `candidateKey` son estados distintos. `selectedKeys`, si se usa para semántica de selección, representa sólo `confirmedKey`; mover flechas no cambia `aria-selected`. El candidato se sigue mediante foco React Aria/handlers de item y se representa con contorno/marcador no dependiente sólo de color.

### Filtro y contador

- Query controlada, reiniciada al cambiar de etapa/context key.
- Coincidencia por `itemName`, `trim()`, `toLocaleLowerCase('es')` e `includes`.
- No elimina diacríticos, no busca ID/clave/descripción y no consulta backend.
- El contador anuncia una frase completa, por ejemplo “2 coincidencias entre 20 opciones cargadas”.
- Filtrar o recibir items repara candidato a: candidato aún visible → preferido inicial visible → primer visible → null.
- Reparar candidato nunca llama `onConfirm`.
- Con cero coincidencias y cursor se informa el alcance y se conserva **Cargar más…**.

### Transferencia de foco

| Origen/evento | Resultado |
| --- | --- |
| Search + `ArrowDown` | Foco al candidato visible actual o primero; no confirma |
| Search + `ArrowUp` | Se conserva edición normal; no entra en lista |
| Primer item + `ArrowUp` | `preventDefault`, foco a Search y conserva query |
| Item + `ArrowUp/Down` | React Aria mueve foco/candidato; no confirma |
| Item + tecla imprimible | Foco a Search y añade el carácter a query |
| Item + `Enter` | Confirma exactamente el item enfocado y avanza |
| Filtro/items/página recibida | Repara candidato sin confirmación |
| `Tab`/`Shift+Tab` | Orden tabbable normal; nunca interceptado |

Una tecla imprimible es `key.length === 1`, sin Ctrl/Meta/Alt salvo el caso de AltGraph admitido por el navegador, y fuera de composición IME. Shift puede producir mayúscula/símbolo. Todos los handlers empiezan comprobando `defaultPrevented` e `isComposing`. No se sintetiza texto durante composición.

Loading inicial mantiene foco en búsqueda; loading-more conserva query, items y candidato. Error inicial/partial usa `role=alert` y retry explícito. Vacíos usan `role=status`. El botón de continuación está fuera del listbox.

## 9. Shell, rail y barra de comandos

### `ResourceCreationShell`

Recibe estado y callbacks locales, no API. Renderiza `DialogHeading`, rail, región principal y barra. Sólo la región principal cambia entre etapas. El heading de etapa tiene `tabIndex={-1}` para foco programático cuando no existe búsqueda.

Al cambiar etapa:

- selector → enfoca Search;
- contrato pendiente → enfoca heading/estado;
- futura revisión/resultado → enfoca heading;
- si el elemento queda bajo la barra sticky, usa `scrollIntoView({ block: 'nearest' })` antes/de forma coordinada con foco, sin animación forzada.

### `CreationStageRail`

Es un `<ol>` de botones para etapas confirmadas y una entrada actual con `aria-current="step"`. Etapas futuras no alcanzables son texto/estado, no botones disabled sin explicación. Activar una confirmada sólo navega; confirmar luego una alternativa ejecuta la cascada correspondiente.

Cada item incluye nombre de etapa y valor confirmado, puede envolver texto y tiene caja interactiva mínima de 44 px. Estado actual/confirmado usa indicador de forma o texto además de tokens de color. Durante atributos hay una sola entrada agregada.

### `CreationCommandBar`

Permanece visible pero no tapa foco. Expone únicamente comandos válidos:

- selectores: `↑/↓ Mover`, `Enter Confirmar`, `← Anterior` cuando aplica, `Esc Volver/Cerrar`;
- contrato pendiente: botón **Volver** y ayuda `Esc Volver`; no muestra Crear;
- futura asignación opcional: añade **Omitir** sólo si está autorizado;
- futura revisión VALID: **Crear recurso** sólo con lease/fingerprint vigentes.

Los controles usan `Button`; las ayudas `<kbd>` son texto informativo, no controles. Todos los botones/rail/list items alcanzan 44 CSS px de hit area mediante layout local sin duplicar el chrome de Button.

## 10. Propiedad de teclado y Escape

| Contexto | Propietario | Regla |
| --- | --- | --- |
| Search/List | `StagedSearchSelector` | Flechas, printable y Enter locales |
| `ArrowLeft` | root de `ResourceCreationShell` en bubbling | Vuelve sólo fuera de input/textarea/select/contenteditable y sin IME/modificadores/evento consumido |
| `Escape` | root local después de hijos React Aria | Si no fue consumido: vuelve una etapa; sólo en Clase cierra |
| Popover futuro | React Aria hijo | Consume Escape primero y evita navegación del shell |
| Tab trap | `Dialog`/React Aria | No se intercepta |
| Atajos fondo | `KeyboardController` existente | Overlay registrado bloquea la superficie de fondo |

El handler de Escape hace `preventDefault` y `stopPropagation` una sola vez cuando actúa. En Unidad vuelve a Tipo; en Contrato pendiente vuelve a Unidad. Cerrar se reserva para Escape desde Clase, botón Cancelar/Cerrar o `onOpenChange` permitido.

La restauración conserva `restoreFocusNextFrame(openerRef, [trigger, sidebar.recursos])`; nunca enfoca `body` ni nodos desconectados.

## 11. Estados visibles

| Estado | Presentación/capacidad |
| --- | --- |
| loading inicial | `role=status`, sin confirmación, foco estable en Search |
| loading-more | lista/query/candidato conservados, continuación disabled |
| vacío filtrado | alcance “entre cargadas”; continuación si existe |
| vacío exhaustivo | `role=status`, sin confirmación |
| initial-error | `role=alert`, mensaje genérico y **Reintentar** |
| partial-error | conserva datos, `role=alert`, retry del mismo cursor |
| Unit hydration pending/error | bloquea confirmación hasta resolver/retry |
| contract-pending | heading enfocado, explicación explícita, Volver/Cerrar; sin atributos/review/create |
| future INCOMPLETE | sólo respuesta backend; señala decisión pendiente |
| future INVALID | issues backend accionables; create ausente/disabled |
| future VALID | review backend y create habilitado sólo con fingerprint vigente |
| future create unknown/stale | disposición contractual; nunca éxito inferido |

No se añade token de error especulativo. ARIA, texto e iconografía/forma aportan significado. Los tokens Light y clases Tailwind existentes son la única fuente de color.

## 12. Cambios de archivos

### Disponibles antes de backend v1

| Archivo | Cambio |
| --- | --- |
| `CrearRecursoSurface.tsx` | Reducir a trigger, overlay/open-close y composición; eliminar state/load/submit legado |
| `ResourceCreationShell.tsx` | Nuevo shell feature-local |
| `CreationStageRail.tsx` | Nuevo rail feature-local |
| `CreationCommandBar.tsx` | Nueva barra feature-local |
| `ResourceCreationContractPending.tsx` | Nuevo estado final honesto |
| `StagedSearchSelector.tsx` | Separar confirmado/candidato; transferencias search↔list; contador y hit area |
| `stagedSearchSelector.model.ts` | Helpers puros de filtro/reparación/printable |
| `resourceCreation.model.ts` | Retirar Resource Data/submit; completar Unidad, cascadas y lease nula |
| `resourceCreation.selectionDraft.ts` | Buckets genéricos active/suspended keyed por assignment ID |
| `resourceCreation.loaders.ts` | Conservar controlador base y añadir composición de Unidad |
| `useResourceCreationFlow.ts` | Tres jerarquías + Unidad; final contract-pending |
| `ResourcesMasterScreen.tsx` | Mantener snapshot y seam `onCreated` |
| `resourcesMaster.api.ts` / `.types.ts` | Sin cambio por esta capacidad; contratos legados quedan fuera del Creador |

### Bloqueados

Sólo tras DTOs exactos se decidirán nombres finales de archivos/adapters para definición/modo, valores permitidos, evaluator y create. En ese slice sí se extenderán operaciones, tipos y validadores de transporte con el contrato real. No se reserva ahora una interface vacía que pueda convertirse accidentalmente en API de facto.

`resourcesMaster.css` se elimina sólo cuando no tenga consumidores. Lo nuevo usa composición shared + Tailwind/tokens; no se copia CSS legado.

## 13. Matriz TDD actualizada

### Unitarias puras

- `resourceCreation.model.test.ts`: prefijos 0–3, padre cruzado, etapa inicial, navegación, misma-ID, cascadas exactas, Unidad explícita, invalidación atómica y final pending.
- Eliminar casos de Nombre/Descripción, submit state, uncertain lock y payload.
- `resourceCreation.selectionDraft.test.ts`: exclusión active/suspended, confirm, omit, suspend, restore, keep suspended, assignment ID estable e invalidación por jerarquía.
- `resourceCreation.loaders.test.ts`: acumulación/dedupe/cursor/retry/stale y, para Unidad, policies paginadas, filtros efectivos, hidratación, principal sólo como preferencia, null/inactiva/error parcial.
- Los tests usan deferred promises; no timers arbitrarios.

### RTL

- `StagedSearchSelector.test.tsx`: filtro local, contador, confirmed vs candidate, Down search→list, Up first→search, printable list→search, Enter exacto, click explícito, IME, defaultPrevented, paginación y estados.
- `crearRecursoSurface.test.tsx`: título Creador, apertura trigger/N, snapshot, Clase/Familia/Tipo/Unidad staged, rail interactivo, barra por etapa, ArrowLeft, Escape escalonado, focus restore y Contrato pendiente.
- Eliminar aserciones de preselección de Unidad, atributos por `tipoDato`, Nombre/Descripción, payload y `api.createResource`.
- Añadir aserción negativa: completar Unidad no invoca operaciones de atributos ni creación.
- `resourcesMasterScreen.test.tsx`: snapshot derivado/aislado.
- `resourcesMasterScreenRefetch.test.tsx`: conserva el seam del callback mediante mock de surface, pero la surface real no llama `onCreated` en pending.

### Browser, axe y arquitectura

- Playwright 1440×980: abrir con `N`, completar Clase→Familia→Tipo→Unidad sólo con teclado, verificar contexto persistente y terminar en Contrato pendiente sin requests de atributos/create.
- Escenario multipágina: copy de alcance local, Cargar más, dedupe, Enter sobre candidato enfocado.
- Escape: pending→Unit→Type→Family→Class→close, una transición por pulsación y restauración al opener/fallback.
- Axe con selector y contract-pending abiertos.
- `keyboardBoundaries.test.ts`: exactamente un listener global y ninguno en la feature.
- `resourceCreationBoundaries.test.ts`: componentes permanecen feature-locales, runtime <500 líneas, sin React Query/store/Catálogo y sin uso de `createResource`/`ResourceCreateInput` en archivos del Creador.
- `queryZodBoundaries`, `catalogHierarchyBoundaries` y `runtimeFixtureIsolation` conservan sus contratos.

No se crean dobles de evaluator/create v1 antes de conocer DTOs exactos. Los valores opacos usados para probar el modelo puro no pretenden ser fixtures de transporte.

## 14. Integración backend v1: gate verificable

Antes del primer test de adapter deben estar disponibles:

1. referencias de operación definitivas;
2. requests y responses exactos;
3. discriminantes/nulabilidad de valores tipados y `modoCaptura`;
4. significado y orden de asignaciones resueltas;
5. hechos que permiten decidir suspend/restore/invalid value sin interpretar `CONDITIONAL`;
6. forma de issues, generated name, technical identity y fingerprint;
7. obligación y ubicación de `expectedCatalogFingerprint`;
8. lista completa de disposiciones y errores de create, incluida concurrencia/stale.

Con ese material:

- primero se escriben schemas/parsers y pruebas de transporte;
- después el adapter normaliza hechos para React;
- luego se conecta evaluación con guard `{token, context, revision}`;
- después atributos SELECCION y reconciliación;
- por último review/create y disposiciones;
- cualquier respuesta no validada falla cerrada y nunca habilita Crear.

No se deriva el contrato desde `crearRecurso`, `ResourceCreateInput`, `ResourceAttributeDataType` ni los DTOs actuales de opciones.

## 15. Cadena de entrega y presupuesto

Cada slice empieza RED y termina GREEN, con menos de 400 líneas agregadas + eliminadas:

```text
A  safety wall: Unit → contract-pending; pruebas negativas legacy/create
B  shell + nombre Creador + rail + command bar
C  Family/Type staged + paginación/stale; retirar selects correspondientes
D  Unit policies/detail staged; retirar preselección/loader simple
E  retirar UI/loader legacy de atributos manteniendo pending
F  retirar Resource Data/review/payload/submit legado
G  active/suspended pure model
H  focus transfer, Escape escalonado, a11y y architecture/browser closure
— gate backend v1 —
I  parsers/adapters exactos + evaluation lease
J  atributos SELECCION + reconciliación autoritativa
K  review autoritativa + create fingerprint/disposiciones
L  browser/axe/regresiones backend-enabled
```

Los cortes E y F se separan para que la gran eliminación histórica no falsee el presupuesto. Desde A no queda una ruta productiva alcanzable hacia el comportamiento supersedido. Si cualquier corte llega a 400 A+D tras una división honesta, se detiene y eleva el riesgo; no se reduce evidencia ni se declara excepción implícita.

## 16. Verificación prevista

Los nombres exactos de archivos de tests podrán ajustarse a los existentes, pero las gates son:

```bash
pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.selectionDraft.test.ts
pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts tests/unit/StagedSearchSelector.test.tsx
pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx
pnpm exec vitest run tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/resourceCreationBoundaries.test.ts
pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Durante la capacidad backend-independent, ningún test debe esperar evaluación, nombre generado, atributos o create simulados. Después del gate, esas pruebas se agregan contra parsers y fixtures exactos.

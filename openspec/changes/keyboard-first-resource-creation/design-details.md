# Detalle de diseño — Creación de recursos Keyboard First

[design.md](./design.md) es la autoridad de arquitectura, alcance, invariantes, migración, riesgos y cierre. Este archivo conserva únicamente los contratos mecánicos y de entrega que detallan esa autoridad; no la reemplaza. Ambos artefactos son entradas requeridas para apply.

## 1. Snapshot inicial tipado y propiedad del estado

Se añadirá un contrato feature-local, sin ampliar los DTOs del adapter:

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

`ResourcesMasterScreen` derivará `InitialResourceHierarchySnapshot` con una función pura `deriveInitialHierarchySnapshot(selection, items)`. Cada entrada será el item actualmente cargado cuyo ID coincide con el ID seleccionado; una selección ausente en los items produce `null`. La comparación de IDs usará un único helper feature-local coherente con la superficie actual (`String(id)`), porque `ResourceId` es opaco y los adapters actuales ya usan esa identidad para controles.

El prop será:

```tsx
<CrearRecursoSurface
  api={api}
  initialHierarchySnapshot={initialHierarchySnapshot}
  onCreated={() => void refetchActive()}
/>
```

El prop puede actualizarse mientras el diálogo está cerrado. `open()` captura una copia del último prop y llama a `normalizeInitialHierarchySnapshot`. La normalización pertenece al diálogo y conserva sólo el prefijo continuo:

1. sin `classItem`, profundidad 0;
2. con Clase y sin Familia, o si `familyItem.claseRecursoId` no coincide con `classItem.id`, profundidad 1;
3. con Clase/Familia y sin Tipo, o si `typeItem.familiaRecursoId` no coincide con `familyItem.id`, profundidad 2;
4. sólo si las tres referencias existen y se relacionan, profundidad 3.

No se intenta recuperar un sufijo faltante mediante requests tardíos. La pantalla entrega datos, no setters: el diálogo nunca recibe `selectClass`, `selectFamily`, `selectType`, criterios de lista ni setters de búsqueda. Así se impide por construcción que el borrador cambie el filtro o la consulta del fondo.

El snapshot se toma en cada apertura, incluido **Crear otro**. No se resincroniza un diálogo ya abierto si la pantalla cambia por otra causa.

## 2. Máquina local de etapas

La navegación y el borrador se modelarán con un reducer puro. No se almacenarán en React Query ni en un store global.

```ts
type CreationStage =
  | { kind: 'class' }
  | { kind: 'family' }
  | { kind: 'type' }
  | { kind: 'unit' }
  | { kind: 'attribute'; attributeId: string; index: number }
  | { kind: 'resource-data' }
  | { kind: 'review' }
  | { kind: 'result'; outcome: 'created' | 'uncertain' }

type CreationDraft = {
  hierarchy: {
    classItem: ResourceContextClassItem | null
    familyItem: ResourceContextFamilyItem | null
    typeItem: ResourceContextTypeItem | null
  }
  unit: UnitCandidate | null
  attributes: readonly ResolvedAttribute[]
  attributeValues: Readonly<Record<string, string>>
  omittedAttributeIds: ReadonlySet<string>
  nombre: string
  descripcion: string
  revision: number
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting'; draftRevision: number }
  | { status: 'known-error'; message: string }
  | { status: 'created'; item: ResourceSummary }
  | { status: 'uncertain'; message: string; blockedRevision: number }
```

`OPEN(prefix)` fija el borrador inicial y elige la primera etapa faltante: Clase, Familia, Tipo o Unidad. No hay salto implícito de Unidad a atributos. Cada etapa confirmada se muestra en una ruta navegable.

| Evento                       | Efecto atómico                                                                                                | Siguiente etapa                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `CONFIRM_CLASS(item)`        | Si cambia el ID, limpia Familia, Tipo, Unidad, definiciones, valores y omisiones; conserva Nombre/Descripción | Familia                                                                              |
| `CONFIRM_FAMILY(item)`       | Si cambia el ID, limpia Tipo, Unidad, definiciones, valores y omisiones                                       | Tipo                                                                                 |
| `CONFIRM_TYPE(item)`         | Si cambia el ID, limpia Unidad, definiciones, valores y omisiones e invalida sus cargas                       | Unidad                                                                               |
| `CONFIRM_UNIT(candidate)`    | Guarda sólo una Unidad visible e hidratada                                                                    | espera resolución de atributos y luego primer atributo, o Datos si no hay aplicables |
| `CONFIRM_ATTRIBUTE(id, raw)` | Valida por tipo, guarda el raw compatible, quita la omisión y avanza                                          | siguiente atributo o Datos                                                           |
| `OMIT_ATTRIBUTE(id)`         | Sólo para no `REQUIRED`; elimina cualquier valor, registra la omisión y avanza                                | siguiente atributo o Datos                                                           |
| `CONFIRM_RESOURCE_DATA`      | Valida Nombre con la normalización actual; conserva Descripción opcional                                      | Revisión                                                                             |
| `SUBMIT_*`                   | Controla submit único y resultado                                                                             | Revisión o Resultado                                                                 |

Volver o activar una miga sólo cambia `stage`; no descarta datos. Confirmar nuevamente el mismo ID tampoco resetea descendientes. Sólo reemplazar un ID dispara la cascada. El orden de vuelta es Tipo ← Unidad ← atributos en orden ← Datos ← Revisión; desde Familia se vuelve a Clase y desde Tipo a Familia. En Clase, `ArrowLeft` no cierra: cerrar continúa reservado para `Escape` o Cancelar.

Los atributos se identifican por `String(assignment.id)`, no sólo por índice, para que una respuesta reordenada nunca asocie un valor al campo incorrecto. Cambiar Tipo incrementa la revisión del borrador antes de iniciar nuevas lecturas.

## 3. Cargas paginadas, acumulación y rechazo stale

### Jerarquía

Clase, Familia y Tipo usarán tres instancias independientes del `createParentGatedListController` existente, envueltas por un hook feature-local. No se cambia el controlador compartido. Se conservará `PAGE_SIZE = 20`, cursor explícito, primer retry acotado, items previos durante error de continuación y deduplicación por ID.

- Clase se carga al entrar por primera vez en esa etapa.
- Familia se contextualiza por la Clase confirmada.
- Tipo se contextualiza por la Familia confirmada.
- Reentrar a una etapa con el mismo contexto conserva páginas y filtro local.
- Reemplazar el padre llama primero a `setContext`, lo que invalida el token anterior, vacía sus descendientes y sólo después inicia la página inicial.

### Loader feature-local para resoluciones de Tipo

Unidad y atributos necesitan hidratación y no encajan sin pérdida semántica en el controlador de jerarquía. `resourceCreation.loaders.ts` contendrá un controlador feature-local, probado sin React, con este estado común:

```ts
type DependentLoadState<T> =
  | { status: 'idle'; contextKey: null; items: readonly [] }
  | { status: 'loading'; contextKey: string; items: readonly T[] }
  | {
      status: 'ready'
      contextKey: string
      items: readonly T[]
      cursor: string | null
      exhausted: boolean
    }
  | { status: 'empty'; contextKey: string; items: readonly []; exhausted: true }
  | { status: 'loading-more'; contextKey: string; items: readonly T[] }
  | {
      status: 'initial-error'
      contextKey: string
      items: readonly []
      retry: 'initial'
    }
  | {
      status: 'partial-error'
      contextKey: string
      items: readonly T[]
      retry: 'continuation'
    }
```

Cada `start/continue/retry` captura `{token, contextKey, cursor}`. El resultado se adopta sólo si los tres siguen vigentes. `setContext` incrementa el token aun cuando la promesa anterior no pueda abortarse. La acumulación mantiene el orden de primera aparición y deduplica con una función de identidad inyectada. Un cursor repetido con `isExhausted: false` se trata como error recuperable para evitar bucles.

No se agregan parámetros de búsqueda al adapter. El filtro nunca dispara requests.

## 4. Selector staged feature-local

`StagedSearchSelector.tsx` será una composición local de React Aria `SearchField`, `Input`, `ListBox`, `ListBoxItem` y los `Button` compartidos para retry/continuación. Será genérico sólo dentro de `resources-master`; no se exportará desde `shared/ui`.

Contrato propuesto:

```ts
type StagedSearchSelectorProps<T> = {
  label: string
  items: readonly T[]
  itemKey: (item: T) => string
  itemName: (item: T) => string
  renderItem?: (item: T) => ReactNode
  preferredActiveKey?: string | null
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

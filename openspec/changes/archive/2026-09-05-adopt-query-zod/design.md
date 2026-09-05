# Diseño técnico — Adopción acotada de React Query y Zod

## 1. Estado y objetivo

**Estado:** `designed`

Este diseño implementa exclusivamente el piloto aprobado para la lista y búsqueda paginada de Maestro de recursos:

1. un `QueryClientProvider` transversal mínimo, con un cliente estable por montaje;
2. Zod 4 sólo en el parser de la respuesta de lista de Recursos;
3. un hook `useInfiniteQuery` privado de `resources-master`;
4. wiring de la pantalla sin cambiar debounce, filtro jerárquico efectivo, paginación explícita, errores, creación, teclado, rutas ni visual.

No se implementa código durante esta fase. `@tanstack/react-query@5.102.8` y `zod@4.5.4` ya son dependencias directas exactas; no se modifica el manifiesto ni el lockfile.

## 2. Autoridades y límites

Se aplican, en este orden, la propuesta y los specs de `adopt-query-zod`, la especificación canónica vigente y los deltas activos que no entren en conflicto con el alcance aprobado.

Límites invariables:

- Convex externo conserva autoridad de datos, permisos, validación efectiva y persistencia.
- Sólo `resourcesMaster.api.ts` conoce el transporte Convex de esta feature.
- React Query posee únicamente páginas remotas y sus estados asíncronos en memoria.
- `ResourcesMasterScreen` conserva texto, debounce y foco.
- `useResourcesHierarchy` y los controladores actuales conservan selección y resets Clase→Familia→Tipo.
- `CrearRecursoSurface` conserva borrador, pasos, overlay y submit; no se migra a `useMutation`.
- TanStack Router conserva ruta y URL.
- Keyboard Context, `KeyboardControllerProvider` y `useSyncExternalStore` conservan teclado y snapshots.
- No se toca Catálogo, `src/shared/hierarchy/**`, `src/shared/keyboard/**`, estilos, copy, rutas, OpenPencil, auth, usuarios ni backend.
- No se crea wrapper Query compartido, repositorio, gateway, facade, store global, persistencia, devtools, broadcast, offline, SSR o hydration.

El diseño visual existente se reutiliza sin cambios. No se añaden componentes, tokens, CSS o clases Tailwind.

## 3. Arquitectura resultante

```text
src/app/providers/AppProviders.tsx
  └── QueryClientProvider (cliente propio estable por montaje)
      └── RouterProvider (composición actual intacta)

src/features/resources-master/
  ├── resourcesMaster.api.ts
  │   ├── transporte Convex inyectable existente
  │   ├── parsers manuales existentes para detalle/contexto/mutaciones
  │   └── schemas Zod privados sólo para parseResourceListPage
  ├── useResourcesMasterListQuery.ts   # nuevo, feature-local
  ├── useResourcesMasterList.ts        # controlador anterior conservado
  ├── useResourcesHierarchy.ts         # sin cambios
  ├── CrearRecursoSurface.tsx          # contrato sin cambios
  └── ResourcesMasterScreen.tsx        # criterio local + proyección del hook
```

`useResourcesMasterList.ts` no se elimina en este cambio. Mantenerlo y conservar sus pruebas permite rollback directo y evita mezclar limpieza de infraestructura con la adopción del piloto.

## 4. Provider transversal por montaje

`AppProviders` importará únicamente `QueryClient` y `QueryClientProvider` desde `@tanstack/react-query`, además del Router actual.

Contrato de implementación:

```tsx
export function AppProviders({ router }: { router: AppRouter }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
```

Decisiones:

- `useState` crea una identidad estable durante el montaje y una identidad nueva en otro montaje.
- No se usa singleton de módulo.
- No se pasan `defaultOptions`; cada piloto declara su política.
- No se expone un cliente Convex, API de feature ni estado de dominio desde `app/**`.
- `StrictMode` puede evaluar un initializer descartado durante su comprobación de desarrollo, pero el árbol comprometido recibe un solo cliente estable durante ese montaje.
- No cambia `src/main.tsx`; la posición sigue siendo `StrictMode → AppProviders → RouterProvider`.

## 5. Frontera Zod 4 de la lista

### 5.1 Alcance exacto

Dentro de `resourcesMaster.api.ts` se añadirán schemas privados para:

- `classificationStatus` de un summary de lista;
- `ResourceSummary` de lista;
- `{ page, isDone, continueCursor }`.

`parseResourceListPage(value: unknown)` continúa exportado y conserva su tipo de retorno. Los schemas no se exportan. Los parsers de detalle, creación, cambio, jerarquía, unidades y atributos continúan usando sus helpers manuales actuales.

Esto es deliberado: el helper manual `resourceSummary` también alimenta detalle y mutaciones. Sustituirlo globalmente ampliaría Zod fuera de la respuesta de lista. Por tanto, el schema de summary se proyecta sólo desde `parseResourceListPage`; los consumidores no-lista permanecen byte-semánticamente bajo el parser anterior.

### 5.2 Formas y semántica

Los schemas usarán primitivas no coercitivas de Zod 4:

- `z.object(...)` con su política normal de eliminar claves desconocidas;
- `z.string()`, `z.boolean()` y `z.array(z.string())`;
- `z.enum(['EFFECTIVE', 'INERT', 'BROKEN_REFERENCE'])`;
- un `z.custom<ResourceId>` privado que acepta exactamente valores distintos de `undefined` y `null`, sin convertirlos;
- un `z.custom<number>` con `typeof value === 'number'` para conservar la aceptación numérica exacta del parser anterior, sin hacer más estrictos incidentalmente `NaN` o infinitos en este corte;
- `.optional()` sólo para `organizacionId`, sin default ni transformación de entrada.

No se usa `z.coerce`, `.trim()`, `.default()`, `.catch()`, `.passthrough()` ni refinamientos de negocio.

Después de `safeParse`, una función de proyección construye explícitamente el DTO público:

- conserva las referencias de IDs opacos;
- copia `reasons` y `page` como hacía el parser actual;
- omite `organizacionId` cuando falta o es `undefined` y lo incluye sólo cuando está definido;
- excluye campos extra en envelope, summary y estado de clasificación;
- no infiere ningún valor.

### 5.3 Error genérico

`parseResourceListPage` usará `safeParse`; nunca propagará un `ZodError`. Ante `success: false` llamará al helper existente `bad()`, que mantiene exactamente:

```text
Invalid resources master response
```

El payload, issues de Zod, paths y valores recibidos no se interpolan ni llegan a React. Las funciones parser exportadas siguen siendo el seam de pruebas; las pruebas verifican entrada/salida y error genérico, no internals de Zod.

## 6. Contrato del hook feature-local

Se crea `src/features/resources-master/useResourcesMasterListQuery.ts`. No se promueve a `shared` porque tiene un solo consumidor y conoce los DTOs y operaciones de Recursos.

Entrada conceptual:

```ts
type ResourcesListCriteria = Readonly<{
  searchText: string
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
}>

useResourcesMasterListQuery(api: ResourcesMasterApi, criteria: ResourcesListCriteria)
```

El hook vuelve a aplicar `trim()` sólo para obtener la representación canónica defensiva; no modifica casing ni contenido interno. Deriva exactamente un filtro efectivo, con precedencia `typeId → familyId → classId → all`, y usa esa misma derivación tanto para la key como para los argumentos del adapter. Así no puede divergir la identidad de cache del payload real.

Salida conceptual:

```ts
type ResourceListQueryStatus =
  | 'initial-loading'
  | 'empty'
  | 'ready'
  | 'loading-more'
  | 'partial-error'
  | 'initial-error'

type ResourcesMasterListQueryResult = Readonly<{
  items: ResourceSummary[]
  status: ResourceListQueryStatus
  isDone: boolean
  canLoadMore: boolean
  loadMore: () => Promise<unknown>
  retry: () => Promise<unknown>
  refetchActive: () => Promise<unknown>
}>
```

No expone el error remoto ni su mensaje a la pantalla. La UI sólo consume el estado semántico aprobado.

## 7. Query key exacta

La factoría feature-local devuelve esta tupla:

```ts
[
  'resources-master',
  'list',
  normalizedSearchText,
  effectiveLevel, // 'all' | 'class' | 'family' | 'type'
  effectiveId,    // null para 'all'; ResourceId real en otro caso
] as const
```

Propiedades:

- namespace y operación son estables;
- texto y filtro efectivo diferentes producen caches distintas;
- el ID cruza sin `String(...)`, serialización propia ni tipo Convex inventado;
- no se incluyen `api`, callbacks, cursores, páginas, selección no efectiva ni objetos visuales;
- `lifecycle: 'ACTIVE'` y `pageSize: 20` son constantes del único contrato y no forman parte de la identidad variable;
- el cursor pertenece a `pageParam`, nunca a la key.

Los IDs wire actuales usados por la feature son aptos para el hash determinista de Query. Si una futura evidencia introdujera IDs no hashables o cíclicos, requeriría otro contrato; este cambio no los convierte para anticiparlo.

## 8. Query function y opciones concretas de Query v5

El hook usa `useInfiniteQuery` con `TPageParam = string | null | undefined` y estas opciones locales explícitas:

```ts
{
  queryKey,
  initialPageParam: undefined,
  queryFn,
  getNextPageParam: (lastPage) =>
    lastPage.isDone ? undefined : lastPage.continueCursor,
  retry: retryOnlyFirstInitialFailure,
  retryDelay: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
}
```

No se configuran `placeholderData`, `initialData`, `select`, `maxPages`, `staleTime`, `gcTime`, persistencia ni prefetch.

La query function construye siempre:

```ts
{
  lifecycle: 'ACTIVE',
  pageSize: 20,
  cursor: pageParam,
  ...deepestHierarchyFilter,
}
```

Con texto normalizado no vacío llama a `api.searchResources({ ...input, searchText })`; con texto vacío llama a `api.listResources(input)`. No importa ni recibe un cliente Convex. El adapter sigue validando antes de resolver el DTO.

`refetchOnMount: false` evita que remontar un consumidor con cache vigente añada una lectura automática; una key sin datos sí ejecuta su primera lectura. Foco y reconexión no generan llamadas. La CTA y los refetch explícitos son los únicos disparadores posteriores.

## 9. Política exacta de retry y error técnico

El controlador actual reintenta automáticamente una sola vez la primera página, pero nunca una continuación; los retries manuales realizan una sola llamada. Query v5 aplica `retry` a cualquier fetch de la query, por lo que `retry: 1` sin clasificación ampliaría la continuación. Para conservar el contrato se usa una clase privada del hook:

```ts
class ResourceListQueryFailure extends Error {
  phase: 'initial' | 'continuation'
  automaticRetryAllowed: boolean
}
```

La query function captura cualquier error del adapter y lanza esta marca técnica con mensaje neutro, sin copiar payload o mensaje remoto. `phase` se deriva de `pageParam === undefined`.

La política es:

- primer fallo de página inicial: `failureCount < 1` y `automaticRetryAllowed === true`, por lo que existe exactamente un retry inmediato;
- segundo fallo inicial: termina en `initial-error`;
- fallo de continuación: cero retries automáticos y termina en `partial-error`;
- retry manual inicial o parcial: el wrapper `retry()` activa temporalmente una ref que marca `automaticRetryAllowed: false`, por lo que esa acción hace exactamente una llamada;
- un refetch explícito post-creación conserva el retry acotado de la primera página, y las páginas de continuación de ese refetch no reciben retries automáticos.

La marca es privada y no sustituye el error genérico del parser: llamar directamente a `parseResourceListPage` o al adapter ante una respuesta inválida sigue rechazando con `Invalid resources master response`. La pantalla nunca renderiza `error.message`.

## 10. Proyección de páginas y deduplicación

La proyección se calcula con `useMemo` sobre `query.data?.pages`, no mediante `select`, para conservar intacto `InfiniteData` y la semántica de refetch de Query.

Algoritmo:

1. recorrer páginas en orden de entrega;
2. recorrer `page` en orden;
3. mantener `Set<ResourceId>`;
4. conservar la primera aparición de cada `id` con la misma igualdad de `Set` usada por el controlador actual;
5. no reordenar, fusionar ni elegir una versión “más nueva”.

`isDone` es `lastPage?.isDone ?? false`. `hasNextPage` proviene de `getNextPageParam`. Un resultado vacío sólo es `empty` si existe una página válida, el flatten tiene cero items y la última página confirma `isDone === true`.

Mapeo de estado, en precedencia:

1. sin páginas + error: `initial-error`;
2. sin páginas + pendiente/fetch: `initial-loading`;
3. páginas + `isFetchNextPageError`: `partial-error`;
4. páginas + `isFetchingNextPage`: `loading-more`;
5. cero items + `isDone`: `empty`;
6. resto: `ready`.

Un fallo de continuación deja `query.data.pages` intacto, por lo que filas válidas y deduplicadas permanecen visibles.

## 11. Continuación y deduplicación de acciones

`loadMore` sólo llama `fetchNextPage({ cancelRefetch: false })` cuando el estado es `ready`, `hasNextPage` es verdadero y no hay promesa de continuación en vuelo.

Una ref privada conserva la promesa vigente. Clics repetidos antes del rerender devuelven la misma promesa o no hacen nada; no inician otra llamada. `canLoadMore` es verdadero sólo con items visibles, continuación disponible y estado `ready` o `loading-more`, reproduciendo la visibilidad actual de la CTA. Durante `loading-more`, la CTA sigue visible y deshabilitada.

En `partial-error`, `retry()` vuelve a ejecutar `fetchNextPage({ cancelRefetch: false })` con el mismo `pageParam` calculado desde la última página válida. No se avanza cursor tras un fallo.

## 12. Debounce y criterio atómico de pantalla

La pantalla sustituye el controlador de lista y `useSyncExternalStore` sólo para esta lista. Mantiene `searchText`, `searchInputRef`, API estable, jerarquía y registro de comando actuales.

Para evitar una query intermedia cuando cambia la jerarquía durante un debounce, la pantalla mantiene un único estado local `committedCriteria`:

```ts
{
  searchText: '',
  classId: undefined,
  familyId: undefined,
  typeId: undefined,
}
```

Flujo:

- montar: el hook consulta una vez con criterio inicial; no se necesita timer inicial;
- cambiar input a texto no vacío: programa 250 ms y no cambia la key antes;
- cambiar input a vacío: programa commit a 0 ms, igual que el comportamiento actual;
- cumplirse el timer: captura el texto con `trim()` y la selección jerárquica efectiva más reciente;
- cambiar Clase/Familia/Tipo: cancela cualquier timer pendiente y hace un solo commit inmediato con el texto actual trimeado y la nueva selección completa;
- el hook deriva el filtro más profundo y genera key y payload desde el mismo snapshot.

Se usan refs para el timer, la selección más reciente y los guards de primer efecto, igualando la cancelación actual. No se mueve búsqueda a URL ni cache; sólo el criterio ya comprometido identifica el estado remoto.

## 13. Wiring de UI y errores observables

`ResourcesMasterScreen` proyecta el resultado del hook sobre el mismo JSX:

- `items` alimenta las filas sin cambiar keys, copy, roles o clases;
- `initial-loading`, `empty`, `initial-error`, `partial-error` y `loading-more` activan exactamente las ramas actuales;
- `Reintentar` llama a `list.retry()`;
- `Reintentar continuación` llama a `list.retry()`;
- `Cargar más…` llama a `list.loadMore()` y se deshabilita durante `loading-more`;
- no se añade spinner, región, live announcement, toast ni copy nuevo.

La tabla, `PageHeader`, `WorkCard`, `Field`, `HierarchyNavigator`, `Button`, atributos espaciales y comando `B` permanecen intactos. No se añade listener de teclado ni handler global.

## 14. Refetch activo posterior a creación

`CrearRecursoSurface` conserva `onCreated?: () => void` y su flujo de submit. La pantalla cambia únicamente el callback a:

```ts
onCreated={() => {
  void list.refetchActive()
}}
```

`refetchActive` usa `query.refetch({ cancelRefetch: false })` sobre el observer y key actuales. No llama a `invalidateQueries`, `setQueryData`, `resetQueries`, `removeQueries` ni una key prefijo.

Consecuencias deliberadas de Query v5:

- sólo se refetchea la identidad actualmente observada;
- si la consulta infinita retiene varias páginas, Query vuelve a leer sus páginas de forma secuencial usando los cursores recalculados desde páginas válidas;
- otras búsquedas y filtros cacheados no se invalidan ni refetchean;
- no hay inserción optimista, cambio manual de cache ni inferencia de éxito;
- el refetch empieza sólo después de que `createResource` resolvió y `CrearRecursoSurface` confirmó `CREATED`;
- el callback continúa siendo fire-and-forget como hoy; no traslada el estado de submit a Query.

## 15. Flujo de datos completo

```text
input local / selección local
  → committedCriteria (debounce 250 ms o commit jerárquico inmediato)
  → key ['resources-master', 'list', search, level, id]
  → useInfiniteQuery(pageParam)
  → ResourcesMasterApi.listResources | searchResources
  → resourcesMaster.api.ts
  → Convex externo
  → unknown
  → schema Zod privado de lista
  → DTO ResourceListPage<ResourceSummary>
  → InfiniteData.pages
  → flatten + dedupe por id
  → estado semántico del hook
  → JSX existente
```

Las respuestas tardías de una key anterior sólo pueden poblar la cache de esa key; el observer actual no las proyecta. No se necesita un token stale manual ni se cancela el transporte Convex, cuyo contrato actual no acepta `AbortSignal`.

## 16. Cambios de archivos previstos

| Archivo | Cambio | Límite |
|---|---|---|
| `src/app/providers/AppProviders.tsx` | cliente por montaje y `QueryClientProvider` | sin defaults globales, Convex o dominio |
| `src/features/resources-master/resourcesMaster.api.ts` | schemas Zod privados y `safeParse` sólo en `parseResourceListPage` | parsers no-lista intactos |
| `src/features/resources-master/useResourcesMasterListQuery.ts` | key, query function, retries, flatten, estados y acciones | feature-local, sin Convex ni wrapper shared |
| `src/features/resources-master/ResourcesMasterScreen.tsx` | criterio atómico y consumo del hook | mismo JSX, copy, estilos, jerarquía y teclado |
| `tests/unit/resourcesMasterApi.test.ts` | equivalencia DTO, opcionales, extras e inválidos | sin probar `ZodError` o schemas privados |
| `tests/unit/useResourcesMasterListQuery.test.tsx` | contrato Query aislado | cliente nuevo por caso |
| `tests/unit/resourcesMasterScreen.test.tsx` | wrapper Query y regresión observable | mismos mocks de API |
| `tests/unit/resourcesMasterScreenRefetch.test.tsx` | wiring post-creación aislado | child fake sólo en tests, sin fixture runtime |
| `tests/unit/appProviders.test.tsx` | identidad estable por montaje y Router | sin exponer cliente en API productiva |
| `tests/architecture/queryZodBoundaries.test.ts` | allowlist y prohibiciones del piloto | no relajar guardas de Catálogo |
| `tests/e2e/resourcesMaster.workstation.spec.ts` | foco, no refetch automático, parcial y refetch post-create | HTTP mock sigue siendo evidencia frontend |

No se prevén cambios en `package.json`, `pnpm-lock.yaml`, `src/main.tsx`, rutas, `routeTree.gen.ts`, `CrearRecursoSurface.tsx`, jerarquía, Catálogo, teclado, shared UI, CSS, OpenPencil o Convex.

## 17. Estrategia TDD y arnés

Cada corte sigue **RED → GREEN → TRIANGULATE → REFACTOR** con evidencia real.

### 17.1 Cliente aislado de test

Cada render de hook o pantalla crea:

```ts
new QueryClient({
  defaultOptions: {
    queries: { gcTime: Infinity },
  },
})
```

Y lo monta con `QueryClientProvider`. No se comparte una constante de módulo. `gcTime: Infinity` evita timers de recolección en Vitest; el hook conserva sus opciones productivas explícitas. Al desmontar se llama `queryClient.clear()` cuando el helper no destruya completamente el wrapper.

No se crea un wrapper Query productivo ni un singleton de tests. El helper puede permanecer local al archivo hasta existir un segundo contrato idéntico de tests.

### 17.2 Matriz RED primaria

| Responsabilidad | Prueba RED |
|---|---|
| cliente estable por montaje | rerender conserva identidad; un montaje nuevo obtiene otra; Router continúa renderizando |
| parser Zod equivalente | DTO exacto, IDs opacos sin coerción, opcional ausente, extras eliminados, tres estados y `reasons` strings |
| error de transporte | envelope/item inválido produce sólo `Invalid resources master response`, nunca `ZodError` ni payload |
| key/payload | texto trimeado y filtro más profundo separan cache; API/callback no alteran identidad |
| primera página | `cursor: undefined`, `pageSize: 20`, `ACTIVE` y operación list/search exacta |
| retry inicial | primer fallo reintenta una vez; dos fallos muestran inicial-error; retry manual hace una llamada |
| continuación | sólo CTA, cursor anterior, cero retry automático, botón bloqueado ante doble activación |
| proyección | orden de páginas, primer duplicado retenido, `isDone` final y vacío sólo confirmado |
| error parcial | páginas previas visibles y retry del mismo cursor |
| auto-refetch | `focusManager` y reconexión no aumentan llamadas; remount con mismo cliente usa cache |
| debounce | 249 ms sin búsqueda, 250 ms una búsqueda, vacío a 0 ms |
| jerarquía durante debounce | cancela timer y emite una sola búsqueda con texto actual y filtro más profundo |
| post-create | sólo el observer/key activo refetchea; otra key sembrada no recibe llamada |
| aislamiento | dos clientes con la misma key no comparten datos, errores ni conteos |
| fronteras | Query sólo en provider y hook aprobado; Zod de runtime sólo en adapter aprobado; Catálogo sigue sin Query |

Las pruebas de hook usan `renderHook`, `act`, promesas controladas y `waitFor`; no inspeccionan observers privados. Para foco se usa `focusManager.setFocused(...)` y se restaura el estado global en `finally`. Para doble CTA se retiene una promesa del adapter y se verifica una sola invocación.

### 17.3 Regresión

Se mantienen verdes:

- `resourcesMasterApi.test.ts` completo, incluidos detalle, contexto y mutaciones;
- `useResourcesMasterList.test.ts` mientras el controlador anterior exista;
- `useResourcesHierarchy.test.ts`;
- `crearRecursoSurface.test.tsx`;
- `resourcesMasterScreen.test.tsx`;
- shell, command entry, Router y Keyboard First;
- `catalogHierarchyBoundaries.test.ts` y `keyboardBoundaries.test.ts` sin relajar sus restricciones;
- E2E de Recursos para búsqueda, filtro profundo, continuación, error parcial, teclado y axe.

Verificación prevista para apply/verify, no ejecutada en design:

```text
pnpm test -- tests/unit/resourcesMasterApi.test.ts tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/appProviders.test.tsx tests/architecture/queryZodBoundaries.test.ts
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm verify:runtime-bundle
```

## 18. Guardas arquitectónicas

La nueva guarda debe comprobar al menos:

- una sola composición `QueryClientProvider`, en `AppProviders`;
- ningún `QueryClient` singleton de módulo;
- imports productivos de React Query limitados a `AppProviders.tsx` y `useResourcesMasterListQuery.ts`;
- ausencia de React Query en `catalog-hierarchy`, jerarquía de Recursos, formularios, teclado y Router;
- ausencia de `PersistQueryClientProvider`, persisters, broadcast, devtools, Zustand y Redux;
- ausencia de imports Convex en `src/app/**` y en el hook Query;
- import de Zod limitado al adapter aprobado en este corte;
- ningún wrapper Query bajo `src/shared/**`;
- guardas actuales de operaciones de Catálogo y único listener de teclado intactas.

La allowlist debe nombrar archivos, no directorios completos, para que una expansión futura falle de forma visible.

## 19. Reconciliación posterior con `catalog-hierarchy-base`

Existe un conflicto normativo activo que no debe resolverse por “último archivo aplicado”. El delta `catalog-hierarchy-base/specs/frontend-foundation/spec.md` todavía formula una prohibición absoluta de capa Query, a la vez que autoriza el acceso Convex feature-local de Catálogo. El delta de `adopt-query-zod` autoriza Query sólo para el piloto de lista de Recursos y conserva explícitamente la excepción Convex de Catálogo.

Cuando alguno de los cambios se sincronice o archive, se debe hacer una reconciliación de tres vías entre:

1. `openspec/specs/frontend-foundation/spec.md` vigente;
2. el delta `catalog-hierarchy-base`;
3. el delta `adopt-query-zod`.

El requisito canónico resultante debe conservar simultáneamente:

- la excepción de Catálogo para acceso directo feature-local a las operaciones públicas aprobadas de `catalogoAdmin/jerarquia`;
- la excepción de React Query para estado remoto únicamente en pilotos feature-locales aprobados, siendo este cambio sólo la lista de Recursos;
- la prohibición de Query dentro de Catálogo en el alcance de `catalog-hierarchy-base`;
- las prohibiciones de backend propio, autoridad frontend, persistencia, store global, wrappers preventivos, cliente Convex transversal y demás infraestructura especulativa;
- la regla feature-first y el contrato Keyboard First/visual ya presentes en la spec canónica.

Procedimiento según orden:

- **Si `catalog-hierarchy-base` se sincroniza primero:** aplicar después el delta de `adopt-query-zod` sobre la spec ya autorizada para Catálogo; su texto MODIFIED ya incluye ambas excepciones.
- **Si `adopt-query-zod` se sincroniza primero:** antes de sincronizar `catalog-hierarchy-base`, rebasar su prohibición histórica. Debe pasar de “ninguna capa Query en el sistema” a “ningún uso Query en Catálogo ni fuera de pilotos aprobados”, sin borrar el provider ni el piloto de Recursos.
- **Antes de cerrar cualquiera:** revisar el diff de la spec canónica resultante y ejecutar una prueba arquitectónica que demuestre a la vez “Catálogo conserva su adapter Convex y no usa Query” y “Recursos usa Query sólo en el hook aprobado”.

No se edita el delta de Catálogo en este diseño ni se amplía Catálogo al provider como propietario de datos. El provider transversal puede envolver la ruta sin convertir a Catálogo en consumidor Query. Así ninguna de las dos excepciones se pierde por el orden de merge.

## 20. Rollout, rollback y observabilidad

### Corte 1 — Provider mínimo

Añadir tests RED de identidad/composición, luego provider. Sin consumidor no cambia lecturas.

**Rollback:** retirar wrapper e initializer. No hay cache persistida ni migración.

### Corte 2 — Parser Zod de lista

Añadir matriz RED de equivalencia e inválidos, luego schemas privados y proyección.

**Rollback:** restaurar únicamente `parseResourceListPage` y su helper de envelope manual. Detalle y mutaciones nunca se movieron.

### Corte 3 — Hook Query feature-local

Añadir pruebas RED de key, opciones, retry, páginas, dedupe, errores y aislamiento; luego hook. Todavía no tiene consumidor de pantalla.

**Rollback:** retirar módulo y pruebas; provider puede quedar inerte.

### Corte 4 — Wiring de pantalla

Añadir/ajustar pruebas RED de debounce, filtro, CTA y errores; sustituir sólo la maquinaria de lista en la pantalla.

**Rollback:** volver a `createResourcesMasterListController` y `useSyncExternalStore`; el controlador sigue presente y probado.

### Corte 5 — Refetch y regresión de límites

Añadir prueba RED del callback post-create y de no refetch por foco/otra key; completar arquitectura y E2E.

**Rollback:** restaurar `onCreated={() => controller.start()}` junto con el rollback del corte 4; ninguna creación confirmada se revierte en backend.

No se añaden flags, telemetría o logging de payload. La evidencia son estados UI, conteos de adapter bajo tests y las comprobaciones arquitectónicas.

## 21. Slices de revisión bajo 400 líneas

La implementación debe mantenerse en unidades revisables independientes; si una supera 400 líneas cambiadas, se detiene y se solicita partición antes de continuar.

| Slice | Contenido | Estimación |
|---|---|---:|
| A | tests de provider + `AppProviders` + guarda mínima de infraestructura | 140–210 |
| B | matriz RED del parser + schemas/proyección Zod de lista | 180–260 |
| C | tests del hook + key/query/options/retry/proyección | 300–380 |
| D | wrapper aislado de pantalla + criterio atómico + wiring de estados/CTA | 280–380 |
| E | refetch post-create + foco/reconexión + arquitectura/E2E final | 220–340 |

No se combinan C y D. La limpieza o eliminación del controlador anterior queda para otro cambio, no para rellenar un slice.

## 22. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `retry: 1` también reintenta continuaciones | error técnico marcado por `pageParam`; política sólo para primera página |
| retry manual hace dos llamadas | ref temporal suprime retry automático durante la acción manual |
| doble clic dispara dos `fetchNextPage` | promesa en vuelo + `cancelRefetch: false` + CTA deshabilitada |
| cambio jerárquico durante debounce emite dos keys | `committedCriteria` atómico; el hook no consume selección en vivo |
| Zod altera detalle o mutaciones | schema usado sólo por `parseResourceListPage`; parsers manuales restantes intactos |
| `ZodError` o payload llega a UI | `safeParse → bad()` y salida del hook sin error remoto |
| refetch post-create invalida otras listas | `query.refetch` del observer activo; ninguna operación por prefijo |
| foco/reconexión/remount agrega llamadas | opciones locales `false` y pruebas con `focusManager`/remount |
| cache contamina tests | cliente nuevo por caso, cleanup y sin singleton |
| Query se expande a Catálogo o shared | allowlist exacta y guardas existentes sin relajar |
| merge de specs borra una excepción | reconciliación de tres vías y aserción conjunta antes de archive |
| diff excede presupuesto | slices A–E y gate `ask-on-risk` al acercarse a 400 líneas |

## 23. Criterios de aceptación del diseño

La implementación posterior es conforme sólo si demuestra que:

- el cliente es estable por montaje, distinto entre montajes y no global;
- Router, shell y teclado conservan composición y comportamiento;
- sólo la lista usa Zod y mantiene exactamente DTOs, opcionales, extras ignorados y error genérico;
- el hook usa la key y opciones v5 exactas aquí definidas;
- búsqueda y jerarquía generan un único criterio efectivo con debounce actual;
- primera página, retry acotado, continuación explícita, dedupe y `isDone` conservan comportamiento;
- un error parcial mantiene páginas y cursor válidos;
- foco, reconexión y remount con cache no crean refetch automático;
- una creación confirmada refetchea sólo la consulta activa sin mutación Query ni edición de cache;
- cada test/render puede aislar su QueryClient;
- Catálogo conserva Convex feature-local pero continúa sin Query;
- no cambia visual, copy, rutas, URL, jerarquía, formulario, teclado, backend, auth o usuarios;
- cada slice queda bajo 400 líneas cambiadas y conserva evidencia TDD real.

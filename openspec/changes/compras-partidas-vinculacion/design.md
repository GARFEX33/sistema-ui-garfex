# Diseño técnico — Compras, partidas y vinculación con recursos

## 1. Estado, propósito y resultado

**Estado:** `designed`

Este diseño traduce `proposal.md` (estado `accepted`, con sus 5 decisiones ya resueltas) en una arquitectura frontend implementable, feature-first, consistente con `src/features/proveedores/` y `src/features/resources-master/` como precedentes directos. No reabre ninguna decisión de producto ni contractual: las trata como dadas.

Resultado de este diseño:

1. una nueva capacidad `src/features/compras/` con su propia frontera de adapters, tipos, hooks y componentes;
2. una única ruta `/compras` que orquesta internamente selección de proveedor → historial → detalle → resolución de partidas, siguiendo el mismo patrón de composición-en-una-pantalla que `resources-master` usa para su asistente de creación;
3. wiring real del ítem de navegación "Compras" que ya existe como placeholder estático en `AppShell.tsx`;
4. una superficie bloqueada informativa para "Partidas pendientes" dentro de la misma pantalla, sin ruta ni entrada de sidebar propia;
5. extensión exacta y nombrada de las allowlists de arquitectura (`restTransportBoundaries.test.ts`, `queryZodBoundaries.test.ts`, `keyboardBoundaries.test.ts` si aplica).

## 2. Autoridades y precedencia

| Autoridad                                                                               | Uso en este diseño                                                                                                              | Límite                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `openspec/changes/compras-partidas-vinculacion/proposal.md`                             | Alcance, no objetivos, gaps G1–G4, 5 decisiones confirmadas                                                                     | No define estructura de archivos ni componentes concretos         |
| OpenAPI de `garfex-api` (`internal/httpapi/openapi.yaml`, ya resumido en `proposal.md`) | Contrato REST exacto: rutas, schemas, códigos HTTP                                                                              | No se reinterpreta ni se amplía aquí                              |
| `src/features/proveedores/**`                                                           | Patrón de referencia más cercano: api.ts con Zod + `withRestActor`, RestWindow hook, Surface dialogs, `useAutoClosingMessage`   | Se sigue su forma, no se importa código de dominio entre features |
| `src/features/resources-master/StagedSearchSelector.tsx`                                | Selector de búsqueda por etapas, candidato a reutilización directa para elegir Proveedor y Recurso Maestro                      | Genérico por diseño (`<T>`); no se fork                           |
| `src/app/shell/AppShell.tsx`                                                            | Ya contiene `<span className="navigation-static">Compras</span>` entre Proveedores y Configuración — el punto de inserción real | No se reordena la navegación ni se toca Configuración             |
| `tests/architecture/*Boundaries.test.ts`                                                | Allowlists cerradas que gatean qué archivo puede usar `fetch`, Zod, `useQuery`, teclado local                                   | Se extienden con líneas exactas, nunca con patrones/directorios   |
| `openspec/config.yaml`                                                                  | `strict_tdd: true`, `review_budget_authored_lines: 400`, `chain_strategy: deferred`                                             | Gobierna `tasks.md`, no se redefine aquí                          |

## 3. Alcance funcional e invariantes

Flujo autoritativo (igual que `proposal.md`):

```text
Compra
└── Partida de compra
    └── Producto del proveedor
        └── Recurso maestro GARFEX
```

Invariantes que el diseño debe sostener:

- el historial de compras siempre requiere un proveedor confirmado (decisión #1); nunca se pagina "todos los proveedores" desde el cliente;
- los datos de `Purchase`/`PurchaseLine` originales del XML son de sólo lectura en toda la UI;
- `linkStatus` se decide exclusivamente por respuesta backend; ninguna mutación se refleja de forma optimista — toda acción relee el recurso afectado tras confirmación;
- una partida con `supplierProductId: null` nunca ofrece una acción de vinculación a Recurso Maestro (decisión #3): se muestra, pero su única acción disponible es "Marcar no aplica" vía `link-status`;
- ids se mantienen como `string`; montos se mantienen como `string` decimal en todo el pipeline de datos, sólo se formatean para presentación en el borde de render;
- `unlink` está en alcance (decisión #5) con el mismo patrón de relectura que `link`.

## 4. Arquitectura y estructura de archivos

```text
src/app/routes/
  compras.tsx                       # ruta única, monta ComprasEntry

src/app/routeTree.gen.ts            # registro generado de la ruta /compras

src/app/shell/AppShell.tsx          # wiring del link real (ver §7)

src/features/compras/
  compras.types.ts                  # Purchase, PurchaseLine, SupplierProduct,
                                     # LinkStatus, páginas — 1:1 con OpenAPI
  compras.api.ts                    # adapters REST + schemas Zod + withRestActor
  useSupplierPurchasesRestWindow.ts # RestWindow paginado por proveedor
                                     # (mirror exacto de useProveedoresRestWindow)
  useSupplierProductsRestWindow.ts  # RestWindow paginado de productos de un
                                     # proveedor, para el buscador de reutilización
  comprasNavigation.model.ts        # estado de navegación en memoria:
                                     # 'elegir-proveedor' | 'historial' |
                                     # 'detalle-compra'; sin router params
  ComprasEntry.tsx                  # entrada de feature (mirror ProveedoresEntry)
  ComprasScreen.tsx                 # composición: PageHeader + orquestación
                                     # de las 3 etapas + tab "Pendientes"
  ElegirProveedorStage.tsx          # StagedSearchSelector<Supplier> reutilizado
                                     # tal cual, sin fork (ver §6.1)
  HistorialComprasStage.tsx         # tabla RestWindow de compras del proveedor
                                     # elegido (mirror tabla de ProveedoresScreen)
  ImportarCompraSurface.tsx         # dialog de import CFDI (mirror
                                     # ImportarProveedorSurface, sin flujo update)
  CompraDetalleStage.tsx            # U6B1: cabecera de compra (proveedor, folio,
                                     # UUID, fecha, moneda, totales) + tabla de
                                     # PurchaseLine; no pertenece a U6A
  PartidaEstadoBadge.tsx            # U6A: badge accesible texto+semántica para
                                     # los 4 estados LinkStatus; sin fetch/montaje
  VincularPartidaSurface.tsx        # U7A1 standalone selection dialog:
                                     # known supplierProductId context + explicit
                                     # Resource choice; mutation belongs to U7A2
  DesvincularPartidaSurface.tsx     # confirmación simple → POST unlink
  MarcarNoAplicaAction.tsx          # botón + confirmación → POST link-status
  PartidasPendientesBlockedSurface.tsx # superficie bloqueada informativa (§8)
```

Ningún archivo nuevo va a `src/shared/ui/`: todo lo reutilizable ya existe ahí (`Button`, `Dialog`, `Field`, `PageHeader`, `WorkCard`, `fieldStyles`, `useAutoClosingMessage` se importa de `resources-master` tal como hoy proveedores lo hace — ver nota en §12 sobre promoción futura, no en este change).

## 5. Adapter y tipos (`compras.api.ts`, `compras.types.ts`)

Sigue exactamente la forma de `proveedores.api.ts`: Zod schemas espejo de cada DTO del OpenAPI, funciones `readRestJson`/`writeRestJson` locales (no compartidas — mismo patrón que proveedores, que tampoco las comparte con resources-master), y mutaciones envueltas en `withRestActor`.

```ts
export interface ComprasRestApi {
  importPurchase: (
    input: PurchaseImportInput,
  ) => Promise<PurchaseImportResponse>
  getPurchase: (input: {
    id: string
    signal?: AbortSignal
  }) => Promise<Purchase>
  listPurchaseLines: (input: {
    purchaseId: string
    signal?: AbortSignal
  }) => Promise<PurchaseLine[]>
  listSupplierPurchases: (
    input: SupplierPurchasesListInput,
  ) => Promise<PurchasePage>
  listSupplierProducts: (
    input: SupplierProductsListInput,
  ) => Promise<SupplierProductPage>
  findSupplierProduct: (input: {
    supplierId: string
    sku: string
    signal?: AbortSignal
  }) => Promise<SupplierProduct>
  getSupplierProduct: (input: {
    id: string
    signal?: AbortSignal
  }) => Promise<SupplierProduct>
  linkSupplierProduct: (input: {
    id: string
    resourceId: string
  }) => Promise<SupplierProduct>
  unlinkSupplierProduct: (input: { id: string }) => Promise<SupplierProduct>
  setPurchaseLineLinkStatus: (input: {
    id: string
    status: LinkStatus
  }) => Promise<PurchaseLine>
}
```

`PurchaseImportInput` acepta `{ file: Blob; branchId?: string; signal?: AbortSignal }`; el `actor` se resuelve internamente vía `withRestActor` igual que `createSupplier`. La llamada es `multipart/form-data` construida con `FormData` (patrón nuevo respecto a proveedores, que usa `application/xml` crudo para el preview CFDI — aquí el backend pide multipart explícito con `file`+`actor`+`branchId`, así que se arma `FormData` y se pasa como `body` sin `content-type` manual, dejando que el `fetch` del entorno fije el boundary).

`LinkStatus` se tipa como unión literal `'PENDIENTE' | 'VINCULADO' | 'NO_APLICA' | 'CONFLICTO'`, igual al enum Zod del schema `PurchaseLine`.

Todos los `id`/`purchaseId`/`supplierId`/`resourceId`/`branchId` se validan con `z.string()` (nunca `z.coerce.number()`), preservando el patrón decimal-string del contrato.

## 6. Flujo de pantalla único (`ComprasScreen.tsx`)

`ComprasScreen` no usa rutas con parámetros (no hay precedente de eso en el repo: `bandeja.tsx`, `catalogo.tsx`, `proveedores.tsx`, `recursos.tsx` son todas rutas planas sin `$param`). Sigue el mismo modelo que `resources-master`'s wizard: un estado local en memoria (`comprasNavigation.model.ts`) decide qué etapa se renderiza dentro de una única `WorkCard`.

Etapas:

1. **`elegir-proveedor`** — estado inicial. Renderiza `ElegirProveedorStage`.
2. **`historial`** — una vez confirmado un proveedor, `HistorialComprasStage` pagina `GET /v1/suppliers/{id}/purchases` vía `useSupplierPurchasesRestWindow`. El proveedor elegido queda visible en un breadcrumb/encabezado no editable ("Proveedor: {nombre}" + acción "Cambiar proveedor" que vuelve a `elegir-proveedor`), y el título rotula explícitamente "Historial de compras de {proveedor}" (decisión #1: nunca "Historial de compras" a secas).
3. **`detalle-compra`** — al confirmar una fila de la tabla de historial, `CompraDetalleStage` hace `GET /v1/purchases/{id}` + `GET /v1/purchases/{id}/lines` y muestra cabecera de compra + tabla de partidas con `PartidaEstadoBadge` y acciones condicionadas.

Además, la pantalla tiene una pestaña/sección secundaria **"Partidas pendientes"** (ver §8), visible siempre, no anidada dentro de las 3 etapas anteriores.

Este modelo evita agregar una ruta con parámetro nueva al repo (cambio de mayor superficie arquitectónica) y reutiliza exactamente el patrón ya aprobado en `resources-master` para flujos multi-etapa dentro de un mismo feature.

### 6.1 Selección de proveedor — reutilización directa de `StagedSearchSelector`

`ElegirProveedorStage` instancia `StagedSearchSelector<Supplier>` tal cual existe hoy, sin fork:

- `items`: resultado de `proveedores.api.ts`'s `listSuppliers` con `scope: 'ACTIVE'` (se importa el adapter de `proveedores`, no se duplica lógica — mismo patrón que `resources-master` reutilizaría un maestro ajeno si aplicara);
- `itemKey`: `supplier.id`; `itemName`: el mismo `supplierName` helper que `ProveedoresScreen.tsx` ya define (se extrae a `proveedores.types.ts` o se reimplementa localmente en 2 líneas — decisión trivial de `tasks.md`, no requiere promoción a `shared/ui`);
- `onConfirm`: transiciona `comprasNavigation` a `historial` con el proveedor elegido.

Esto es composición cross-feature vía el adapter público de Proveedores (`ProveedoresRestApi.listSuppliers`), no acceso a su estado interno — coherente con Screaming Architecture y sin mover lógica de dominio a `shared`.

### 6.2 Selección de Recurso Maestro — mismo patrón, evaluado y aceptado

`VincularPartidaSurface` reutiliza `StagedSearchSelector<Resource>` con los datos de `resourcesMaster.api.ts` (`listResources` o el método equivalente ya usado por `resources-master`). U7A1 sólo prepara y confirma una selección explícita mediante el callback estrecho `onResourceSelected`; no llama `linkSupplierProduct`, no hace matching, no crea productos y no refleja estados optimistas. No requiere adaptación del componente: su contrato genérico (`items`, `itemKey`, `itemName`, `onConfirm`, `loadState`) ya cubre este caso sin cambios. No se fork.

## 7. Wiring de navegación en `AppShell.tsx`

`AppShell.tsx` ya declara el placeholder:

```tsx
<span className="navigation-static">Compras</span>
```

entre el `Link` de Proveedores (`sidebarLinks.current[2]`) y el `Link` de Catálogo (`sidebarLinks.current[3]`). El diseño reemplaza ese `<span>` estático por un `Link` real:

```tsx
<Link
  ref={(link) => {
    sidebarLinks.current[3] = link
  }}
  to="/compras"
  data-spatial-id="sidebar.compras"
  onKeyDown={(event) => handleSidebarKeyDown(event, 3)}
  activeProps={{ className: 'navigation-link is-active' }}
  className="navigation-link"
>
  Compras
</Link>
```

y desplaza el índice del `Link` de Catálogo de `3` a `4` (su `ref`/`onKeyDown` cambian en consecuencia). Cambios adicionales exactos y acotados:

- la unión `_surface: 'bandeja' | 'catalog' | 'recursos' | 'proveedores'` (línea ~397) gana `'compras'`;
- la función que deriva `_surface`/`activeSurface` desde `pathname` (líneas ~407–413) gana la rama `pathname === '/compras' ? 'compras' : ...`;
- el `topbar-route` ternario (líneas ~519–526) gana `pathname === '/compras' ? 'Compras' : ...`.

No se toca la sección `CONFIGURACIÓN DEL MODELO` ni ningún otro placeholder estático (`Clases`, `Familias`, `Atributos…`, etc.) — quedan exactamente como están.

## 8. Superficie bloqueada informativa — "Partidas pendientes" (G2)

`PartidasPendientesBlockedSurface` es un componente puramente presentacional, sin llamada a red, montado como sección/tab dentro de `ComprasScreen` (no como ruta ni entrada de sidebar separada, para no inflar la navegación con un destino que hoy no puede cumplir su función). Contrato:

```tsx
export function PartidasPendientesBlockedSurface() {
  return (
    <div role="status" aria-live="polite" className="...">
      <h2>Partidas pendientes entre compras</h2>
      <p>
        Esta vista todavía no está disponible: el backend de Compras no publica
        hoy un listado transversal de partidas por estado. Para resolver una
        partida pendiente, abrí la compra correspondiente desde el historial de
        su proveedor.
      </p>
    </div>
  )
}
```

Usa los mismos tokens semánticos de superficie/texto que el resto del Design System (`bg-surface-subtle`, `text-text-secondary`, `border-dashed border-border` como en el estado `waiting-for-parent` de `StagedSearchSelector`), sin crear tokens nuevos: es visualmente un estado vacío/informativo, no un error.

## 9. Presentación de `PurchaseLine` y acciones condicionadas

`CompraDetalleStage` renderiza, por partida, dos zonas separadas (mandato de `proposal.md`: XML visible siempre, relación en zona diferenciada):

**Zona 1 — datos originales (solo lectura, sin badge de estado mezclado):** `description`, `supplierSku`, `satProductCode`, `quantity`+`unit`, `unitPrice`, `amount`, `discount`, `taxTransferred`, `taxWithheld`, `taxObject`. Montos formateados sólo para display (`Intl.NumberFormat` en el borde de render), nunca reconvertidos a `number` en el adapter.

**Zona 2 — relación y estado:** `PartidaEstadoBadge` (texto + rol semántico, ver §11) y, según `linkStatus` y `supplierProductId`:

| `supplierProductId` | `linkStatus`               | Acciones visibles                                                                                                                                                                                       |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `null`              | `PENDIENTE`                | Sólo "Marcar no aplica" (`MarcarNoAplicaAction` → `link-status: NO_APLICA`). Ninguna acción de vinculación (decisión #3, G3).                                                                           |
| `null`              | `NO_APLICA`                | Ninguna acción (ya resuelta manualmente).                                                                                                                                                               |
| no nulo             | `PENDIENTE`                | "Vincular a recurso" (U7B monta U7A1 selección y U7A2 mutación) y "Marcar no aplica".                                                                                                                      |
| no nulo             | `VINCULADO`                | Muestra el Recurso Maestro vinculado (vía `GET /v1/supplier-products/{id}` para resolver `resourceId` → nombre, usando el adapter de `resources-master`) y "Desvincular" (`DesvincularPartidaSurface`). |
| no nulo             | `CONFLICTO`                | "Vincular a recurso" (U7B monta U7A1/U7A2) y "Marcar no aplica" (ambas via `link-status`/`link` según semántica backend ya publicada); ningún texto adicional inventa la causa del conflicto que el contrato no expone. |
| —                   | `NO_APLICA` (con producto) | Ninguna acción; texto "No aplica a un recurso maestro".                                                                                                                                                 |

Toda acción deshabilita el control mientras la mutación está en curso, relee (`getSupplierProduct`/`listPurchaseLines` según corresponda) tras éxito, y sólo entonces actualiza la fila — nunca optimista.

## 10. Flujo de importación CFDI

`ImportarCompraSurface` sigue el esqueleto de estados de `ImportarProveedorSurface` (`closed | loading | ready | error`), adaptado a un único submit (no hay variante "update" en compras):

- selecciona archivo → `POST /v1/purchases` (multipart, `file` + `actor` + `branchId?`);
- `201`: mensaje "Compra importada" vía `useAutoClosingMessage`, cierra el dialog, y si hay un proveedor ya elegido en `comprasNavigation` con el mismo `supplierId` que trae la respuesta, refresca `useSupplierPurchasesRestWindow`;
- `200` con `alreadyExisted: true`: mensaje distinto ("Esta compra ya estaba registrada"), mismo cierre, sin tratarlo como error;
- `409`: mensaje de conflicto de contenido con el mismo UUID fiscal, el dialog permanece abierto para que la persona pueda revisar/reintentar con otro archivo;
- `422`: mensaje "El archivo no es un CFDI 4.0 válido", mismo patrón que el `error` de `ImportarProveedorSurface`.

El botón de importación vive en el `PageHeader` de `ComprasScreen`, visible en cualquier etapa (igual que `ImportarProveedorSurface`/`CrearProveedorSurface` en el `action` de `PageHeader` de `ProveedoresScreen`).

## 11. Badges de estado accesibles

`PartidaEstadoBadge` es la unidad U6A: acepta exactamente `LinkStatus`, muestra texto en español y combina texto visible con clases semánticas. No hace fetch, no monta `CompraDetalleStage` y no depende del color para comunicar el estado.

| `LinkStatus` | Texto visible | Contrato de clases semánticas |
| ------------ | ------------- | ------------------------------ |
| `VINCULADO`  | "Vinculado"   | `bg-success-subtle text-success border-success` |
| `PENDIENTE`  | "Pendiente"   | `bg-warning-subtle text-warning border-warning` |
| `CONFLICTO`  | "Conflicto"   | `bg-primary-subtle text-primary border-primary` |
| `NO_APLICA`  | "No aplica"   | `bg-surface-subtle text-text-secondary border-border` |

El elemento es un badge inline compacto con `role="status"` y un nombre accesible como `Estado: Pendiente`; el texto visible sigue presente para que la semántica no dependa del color. U6A no agrega iconos, CSS feature-local ni valores arbitrarios. `CONFLICTO` reutiliza los tokens primarios rojo/danger-adjacent existentes porque el audit confirmó que no existe token `error` autorizado.

El audit previo a U6A confirmó que no existe equivalente de warning: `tokens.css` sólo contiene `success` entre los roles de estado, `styles.css` aún no mapea warning y no hay badge/status component compartido equivalente. Por ello se autoriza únicamente `--color-warning` y `--color-warning-subtle`; `error` e `info` permanecen ausentes y no se agregan especulativamente.

## 12. Extensiones exactas a las allowlists de arquitectura

U6A añade `src/styles.css` como superficie necesaria: Tailwind v4 sólo genera `bg-warning-subtle`, `text-warning` y `border-warning` cuando `@theme inline` mapea ambos runtime tokens. No se agregan clases CSS feature-local ni valores arbitrarios.

### `tests/architecture/restTransportBoundaries.test.ts`

Agregar a la constante `allowed` (`Set`):

```ts
'src/features/compras/compras.api.ts',
```

### `tests/architecture/queryZodBoundaries.test.ts`

Agregar, siguiendo el patrón exacto de `proveedoresApiPath`/`proveedoresRestWindowHookPath`:

```ts
const comprasApiPath = 'src/features/compras/compras.api.ts'
const supplierPurchasesRestWindowHookPath =
  'src/features/compras/useSupplierPurchasesRestWindow.ts'
const supplierProductsRestWindowHookPath =
  'src/features/compras/useSupplierProductsRestWindow.ts'
```

y sumarlas: `comprasApiPath` al bloque de rutas con Zod permitido (mismo grupo que `proveedoresApiPath`); ambos hooks `RestWindow` al `queryBindings` Map con `['useQuery']`, igual que `proveedoresRestWindowHookPath`.

### `tests/architecture/keyboardBoundaries.test.ts`

Este change no introduce ningún listener de teclado a nivel de documento nuevo: todas las interacciones (Dialog focus trap, Escape, Enter en formularios, navegación de `StagedSearchSelector`) ya están encapsuladas en componentes compartidos existentes (`Dialog`, `StagedSearchSelector`) que ya pasan esta guarda. Sólo se agrega `Compras` al `data-spatial-id`/sidebar array que la guarda ya recorre genéricamente (la línea 90 de la guarda lista `features/proveedores/proveedores.api.ts` en un contexto de exclusión de teclado por archivo; `tasks.md` debe auditar si `compras.api.ts` necesita la misma exclusión explícita, dado que es un `.api.ts` sin lógica de teclado — previsiblemente sí, por simetría exacta con proveedores).

## 13. Presupuesto de revisión — slices previstos

La antigua U1 se divide en dos unidades independientes para que los contratos de lectura puedan revisarse y entregarse sin mezclar importación ni mutaciones actor-gated. La antigua U2 combinada se divide ahora en U2A (ventana de compras) y U2B (ventana de productos). La antigua U3 combinada queda superseded: U3A cierra únicamente la ruta y shell iniciales, y el antiguo U3B combinado queda superseded por U3B1 y U3B2. U6 se divide en U6A (badge/tokens), U6B1 (detalle/query) y U6B2 (montaje de pantalla); U6A no adelanta fetch ni detalle, U6B1 no monta `ComprasScreen`, y U6B2 no adelanta linking ni U7. U7 se divide en U7A1 (selección standalone), U7A2 (mutación aislada) y U7B (montaje condicional en detalle); U7A1 y U7A2 no tocan `CompraDetalleStage` ni su test. La separación no autoriza una excepción de tamaño.

| Unidad | Contenido | Líneas aprox. |
| ------ | --------- | ------------- |
| U1A | Contratos, schemas Zod, errores y lecturas + `tests/unit/comprasApiReads.test.ts` + guardas exactas | ~396 |
| U1B | Importación multipart y mutaciones actor-gated + `tests/unit/comprasApiMutations.test.ts` + guardas exactas | ~220 |
| U2A | `useSupplierPurchasesRestWindow.ts` + prueba y binding exacto de Query | ~231 |
| U2B | `useSupplierProductsRestWindow.ts` + prueba y binding exacto de Query | ~190 |
| U3A | Ruta `/compras`, delta generado de `routeTree.gen.ts`, `ComprasEntry`, shell mínimo `ComprasScreen`, `comprasNavigation.model.ts`, navegación-model tests y contrato mínimo de screen; sin selector ni lógica/estado de proveedor | ~220 |
| U3B1 | Modelo de confirmación/reset, `ElegirProveedorStage` bounded y `tests/unit/elegirProveedorStage.test.tsx`; sin montaje de `ComprasScreen` | ~300 |
| U3B2 | Montaje de `ComprasScreen`, contexto confirmado/cambio y placeholder U4A; `tests/unit/comprasScreen.test.tsx` | ~250 |
| U4A | `HistorialComprasStage.tsx`, `tests/unit/historialComprasStage.test.tsx` y montaje acotado en `ComprasScreen`/`tests/unit/comprasScreen.test.tsx` | ~360 |
| U4B | `ImportarCompraSurface.tsx` y sus pruebas de importación multipart; montaje posterior en `ComprasScreen` | ~220 |
| U5 | Wiring de `AppShell.tsx` + tests de navegación existentes actualizados | ~120 |
| U6A | `PartidaEstadoBadge`, `tests/unit/partidaEstadoBadge.test.tsx`, `tokens.css`, `styles.css` y documentación; sin detalle/montaje/fetch | ~260 |
| U6B1 | `CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx` y binding exacto de `useQuery`; detalle/query sin montaje de pantalla | ~390 |
| U6B2 | Montaje de `CompraDetalleStage` en `ComprasScreen` y `tests/unit/comprasScreen.test.tsx`; pantalla pendiente de verificación/staging independiente | ~130 |
| U7A1 | `VincularPartidaSurface.tsx` + `tests/unit/vincularPartidaSurface.test.tsx`; selección standalone ACTIVE/20, paginación por reemplazo y callback estrecho, sin mutación | ~399 |
| U7A2 | Los mismos dos paths U7A1; añade exclusivamente la mutación actor-gated y su confirmación, sin montaje en detalle | ~220 |
| U7B | Montaje condicional en `CompraDetalleStage.tsx` + `tests/unit/compraDetalleStage.test.tsx`; sólo después de U7A2 | ~120 |
| U8A | `DesvincularPartidaSurface.tsx` + `tests/unit/desvincularPartidaSurface.test.tsx`; unlink standalone confirmado, sin montaje | ~280 |
| U8B | `MarcarNoAplicaAction.tsx` + `tests/unit/marcarNoAplicaAction.test.tsx`; `NO_APLICA` standalone, sin montaje | ~220 |
| U8C | Montaje condicionado en `CompraDetalleStage.tsx` + `tests/unit/compraDetalleStage.test.tsx`; sólo después de U8A/U8B | ~120 |
| U9 | `PartidasPendientesBlockedSurface` + integración como tab + tests | ~120 |

Cada unidad sigue TDD estricto y debe permanecer por debajo de 400 líneas autorales. La cadena ahora es U1A → U1B → U2A → U2B → U3A → U3B1 → U3B2 → U4A → U4B → U5 → U6A → U6B1 → U6B2 → U7A1 → U7A2 → U7B → U8A → U8B → U8C → U9. U3B1 no monta `ComprasScreen`, U3B2 sólo monta U4A, U4B no inicia hasta cerrar U4A, U6A sólo toca su badge/tokens/documentación autorizados, U6B1 no monta la pantalla, U7A1 sólo selecciona y confirma localmente, U7A2 añade la mutación y U7B sólo monta la acción condicionada después de cerrar U7A2. U8A sólo implementa unlink standalone, U8B sólo implementa `NO_APLICA` standalone y U8C monta ambas acciones después de sus cierres independientes. U6B2 permanece pendiente hasta su verificación y staging independientes. El delta de ruta generado cuenta dentro del límite de U3A.

U6B1 autoriza exactamente tres paths: `src/features/compras/CompraDetalleStage.tsx`, `tests/unit/compraDetalleStage.test.tsx` y `tests/architecture/queryZodBoundaries.test.ts`. La guard de Query es necesaria porque `CompraDetalleStage` usa la importación nombrada aprobada `useQuery`; su binding queda limitado al path exacto del componente y no amplía miembros ni rutas prohibidas. U6B2 autoriza exactamente `src/features/compras/ComprasScreen.tsx` y `tests/unit/comprasScreen.test.tsx`; cualquier worktree existente de esos paths no cuenta como verificado ni staged hasta aplicar su slice independientemente. U7A1 autoriza exactamente `src/features/compras/VincularPartidaSurface.tsx` y `tests/unit/vincularPartidaSurface.test.tsx` para selección; no autoriza `linkSupplierProduct`, actor, errores de mutación, `CompraDetalleStage` ni su test. U7A2 conserva exactamente esos dos paths para añadir sólo la mutación y la confirmación backend. U7B autoriza únicamente los dos paths de detalle para el montaje condicional posterior. U8A autoriza exactamente `src/features/compras/DesvincularPartidaSurface.tsx` y `tests/unit/desvincularPartidaSurface.test.tsx`; U8B autoriza exactamente `src/features/compras/MarcarNoAplicaAction.tsx` y `tests/unit/marcarNoAplicaAction.test.tsx`; U8C autoriza únicamente `src/features/compras/CompraDetalleStage.tsx` y `tests/unit/compraDetalleStage.test.tsx` para montar y probar las acciones.

## 14. Riesgos técnicos y tradeoffs

| Riesgo/tradeoff                                                                          | Decisión                                             | Justificación                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Fork o reutilizar `StagedSearchSelector`?                                               | Reutilizar tal cual, dos veces (proveedor, recurso)  | Su contrato genérico (`<T>`, `items`/`itemKey`/`itemName`/`onConfirm`/`loadState`) ya cubre ambos casos sin cambios; forkear violaría la skill de Design System sin justificación semántica real.                                                                                                                                      |
| ¿Ruta con parámetro (`/compras/$id`) o estado en memoria?                                | Estado en memoria dentro de una sola ruta `/compras` | No hay precedente de rutas param en el repo; `resources-master` ya resuelve un flujo multi-etapa sin ellas. Introducir el primer param-route del repo es una decisión arquitectónica mayor fuera del alcance de este change.                                                                                                           |
| ¿Nueva entrada de sidebar para "Pendientes"?                                             | No — tab/sección dentro de `/compras`                | `AppShell.tsx` sólo reserva un slot "Compras"; una entrada nueva para una vista hoy bloqueada por G2 infla la navegación con un destino que no cumple su función.                                                                                                                                                                      |
| ¿Token `warning` nuevo?                                                                  | Sí, mínimo y documentado                             | El audit de U6A no encontró equivalente; se agregan exactamente `--color-warning: #8a6800` y `--color-warning-subtle: #fff8d6` para atención semántica sin convertirla en error. `error` e `info` permanecen ausentes. |
| ¿Compartir `readRestJson`/`writeRestJson` entre `proveedores.api.ts` y `compras.api.ts`? | No, duplicar localmente                              | Sigue el precedente exacto: `proveedores.api.ts` ya duplica esas funciones en vez de importarlas de `resources-master`; promoverlas a `shared` es una decisión de refactor transversal fuera de este change (ver skill: "promoción sólo con contrato/comportamiento idéntico ya confirmado en 2+ features", que hoy no está evaluado). |

## 15. Decisiones de diseño — confirmadas

El usuario confirmó estas tres decisiones el 2026-09-19; `tasks.md` parte de ellas sin reabrirlas:

1. **Nombre de feature — confirmado:** `src/features/compras/`.
2. **Token `warning` — confirmado:** el usuario autoriza en U6A agregar exactamente `--color-warning: #8a6800` y `--color-warning-subtle: #fff8d6` a `tokens.css`, mapearlos en `src/styles.css` y documentar su propósito; el audit confirma que no existe equivalente y `error`/`info` siguen ausentes.
3. **Orden de unidades — confirmado:** U1A→U1B→U2A→U2B→U3A→U3B1→U3B2→U4A→U4B→U5→U6A→U6B1→U6B2→U7A1→U7A2→U7B→U8A→U8B→U8C→U9 tal como quedó definido en §13; U6A badge/token precede U6B1 detalle/query y U6B2 montaje, U7A1 selección precede U7A2 mutación, U7B monta después de ambos y U8C monta sólo después de U8A/U8B. No se adelantan U8B, U8C ni U9 al slice autorizado.
4. **Slice U6A — confirmado por el usuario en esta sesión:** aplicar únicamente `PartidaEstadoBadge` y sus tokens/documentación contra el staged U5 baseline. No implementar `CompraDetalleStage`, montaje/fetch de pantalla, U6B1, U6B2, U7 ni linking. El audit debe registrar que no existe equivalente warning; `error` e `info` permanecen ausentes.

Con esto, `tasks.md` puede formalizar el plan RED-GREEN-TRIANGULATE-REFACTOR por unidad.

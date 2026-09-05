# Diseño técnico — Base jerárquica del Catálogo

## 1. Estado, propósito y resultado

**Estado:** `designed-with-runtime-gates-and-frozen-visual-checkpoint`

Este diseño convierte la propuesta, el contrato nominal Convex, las especificaciones activas, el plan de tareas, el progreso de aplicación, las autoridades OpenPencil y el contrato Keyboard First ya sincronizado en una arquitectura implementable para la capacidad workstation de Catálogo.

El resultado sigue siendo una sola capacidad de producto en `/catalogo`:

1. acceder a Catálogo sin sustituir ni modificar Bandeja;
2. recorrer y leer exclusivamente `Clase → Familia → Tipo`;
3. crear Clase, Familia dentro de una Clase explícita y Tipo dentro de una Familia explícita;
4. conservar Familia→Clase y Tipo→Familia como relaciones inmutables;
5. operar todos los flujos reales aprobados mediante teclado o mouse, usando la infraestructura Keyboard First compartida;
6. mantener el backend externo como única autoridad de datos, validación efectiva y persistencia.

El diseño no afirma que la capacidad conectada esté terminada. El Corte local 1 dejó una frontera no mutante y un checkpoint visual parcial. La evidencia disposable ya verifica el permiso público de `crearClase`, `crearFamilia` y `crearTipo`; la implementación de Familia/Tipo no ha comenzado y requiere una decisión explícita de apply, además de los gates de conexión restantes.

## 2. Autoridades, precedencia y evidencia conservada

Las decisiones se interpretan con la siguiente precedencia. Una fuente de evidencia no amplía por sí misma el alcance de otra.

| Autoridad | Uso en este diseño | Límite |
|---|---|---|
| `openspec/changes/catalog-hierarchy-base/proposal.md` | Intención de producto, jerarquía, alcance, exclusiones, rollout y gates | No demuestra comportamiento runtime ni copy concreto |
| `openspec/changes/catalog-hierarchy-base/api-contract.md` | Nombres de funciones, argumentos nominales y formas declaradas de respuesta | `function-spec` no demuestra URL, versión cliente, primitivas wire completas, autenticación, permisos, datos, errores ni paginación real |
| `openspec/changes/catalog-hierarchy-base/specs/**` | Requisitos observables de Catálogo y deltas de frontend/Bandeja | No autoriza capacidades fuera del cambio |
| `openspec/specs/keyboard-interaction/spec.md` | Arbitraje, elegibilidad DOM, geometría física, atajos y ciclo de foco permanentes | Catálogo consume este contrato; no lo redefine |
| `openspec/specs/frontend-foundation/spec.md` | Feature-first, calidad estricta y documentación Keyboard First canónica | El delta activo de Catálogo debe reconciliarse sobre esta versión ya sincronizada |
| `docs/erp-first-stage-design-brief.md`, sección 11 | Única documentación canónica de la filosofía Keyboard First | Este documento sólo registra la integración de Catálogo por referencia |
| `openspec/changes/catalog-hierarchy-base/tasks.md` | Cuatro cortes locales, TDD, gates y límites de rollback | Los checkmarks históricos no sustituyen una autorización posterior ni prueban fidelidad visual actual |
| `openspec/changes/catalog-hierarchy-base/apply-progress.md` | Evidencia real del Corte local 1 y sus limitaciones | No acredita lectura o creación Convex conectadas ni cierre global |
| Resumen Engram `sdd/catalog-hierarchy-base/design` | Confirma `/catalogo`, adapter inyectable, parsers, cursores, selección descendente y gates | Es un resumen, no reemplaza este documento durable |

### 2.1 Autoridad OpenPencil aprobada

La evidencia visual aprobada de Catálogo es el documento corregido `design-catalog-hierarchy-edit.op`, registrado con SHA-256 `e121831c829d6a300ee09990d9ca20f0838ee270413a49f63a4d505087bbcc89`. El registro de memoria indica que `design.op` recibió bytes idénticos como futuro destino de guardado; este diseño conserva la referencia de cambio y no presupone que el hash actual haya sido recalculado durante esta fase.

Roots verificados y aprobados relevantes:

| Página | Page id | Root | Autoridad |
|---|---:|---:|---|
| `05A Configuración · Taller del catálogo` | `n1509` | `n1510` | Composición workstation base y jerarquía |
| `05D Alta · Nueva Clase` | `n2417` | `n2418` | Alta de Clase y comparación 1440×980 |
| `05E Alta · Nueva Familia` | `n2486` | `n2487` | Alta de Familia con Clase no editable |
| `05F Alta · Nuevo Tipo` | `n2555` | `n2556` | Alta de Tipo con Familia no editable |
| `05G Estado · Carga y vacío` | `n2624` | `n2625` | Loading, espera dependiente y vacío |
| `05H Estado · Continuación y error` | `n2673` | `n2674` | Continuación, datos parciales, error y reintento |

`design-recovered.op` permanece como evidencia de recuperación, no como diseño funcional final de la jerarquía corregida. La copia read-only `recovery/openpencil-2026-08-30/final/design-catalog-hierarchy-edit-2026-08-31.op` fue registrada como respaldo byte-idéntico. Ninguno de esos archivos se edita, genera React ni se convierte en coordenadas fijas desde este diseño.

## 3. Alcance funcional e invariantes

La jerarquía canónica es:

```text
Clase
└── Familia (claseRecursoId → Clase)
    └── Tipo (familiaRecursoId → Familia)
        └── Recurso (tipoRecursoId → Tipo) [fuera de alcance]
```

Invariantes obligatorias:

- una Familia presentada o creada dentro de una Clase debe usar la `claseRecursoId` explícita de ese contexto;
- un Tipo presentado o creado dentro de una Familia debe usar la `familiaRecursoId` explícita de ese contexto;
- cambiar Clase elimina atómicamente la selección contextual de Familia y Tipo;
- cambiar Familia elimina atómicamente la selección contextual de Tipo;
- Familia→Clase y Tipo→Familia no son editables después de crear;
- el frontend nunca repara, reclasifica ni completa relaciones de dominio por inferencia;
- el backend conserva la autoridad sobre aceptación, validación efectiva y persistencia.

## 4. Exclusiones y no decisiones

Este cambio no contiene ni prepara de forma especulativa:

- Recurso, listado o creación de Recursos, reclasificación Recurso→Tipo ni APIs de Recursos;
- update, activate o deactivate de Clase, Familia o Tipo;
- unidades, atributos, opciones, reglas, presentación, compatibilidad, publicación o snapshots;
- responsive, tablet, móvil, gestos ni interacción específica de touch;
- backend propio, modificación de Convex, persistencia frontend, storage, sincronización local o fallback de datos;
- stores globales, repositorios, casos de uso, gateways, facades, capa Query ni wrappers preventivos;
- reglas de unicidad, normalización, trim, casing, longitudes, límites de `pageSize`, orden, estabilidad del cursor o significado de estados agregados no demostrados;
- mensajes backend crudos, códigos de error, causas, roles, permisos o semántica de ausencia inventados;
- rutas, comandos, atajos, formularios o controles anticipados para capacidades todavía inexistentes.

Los campos `effective`, `effectiveReasons`, `aggregateStatus` y `violations` pueden cruzar el parser cuando su forma wire esté verificada, pero no adquieren semántica ni presentación de producto en este cambio sin evidencia adicional.

## 5. Checkpoint actual y congelamiento visual

El runtime actual conserva un checkpoint parcial de `/catalogo`: shell, ruta, estado jerárquico local y `Nueva Clase` presentacional no mutante. La evidencia histórica del Corte local 1 demuestra ruta, aislamiento, interacción local y foco; no demuestra lectura Convex, creación conectada ni fidelidad visual completa.

Una remediación visual posterior excedió el límite de trabajo y fue detenida; el checkpoint resultante permanece **parcial y congelado**. Por tanto:

- este diseño correctivo no reanuda, completa, normaliza, revierte ni rediseña ese checkpoint;
- los checkmarks históricos de `tasks.md` se conservan como registro, pero no se interpretan como autorización para modificar ahora la visual;
- la reconciliación Keyboard First sólo integra comportamiento y foco perceptible mediante la infraestructura compartida;
- no se alteran layout, composición, espaciado, tipografía, responsive ni estados en reposo;
- no se afirma fidelidad OpenPencil a partir de pruebas estructurales;
- cualquier futura remediación visual requiere autorización explícita y comparación real contra los roots aprobados, especialmente `n2418` a 1440×980;
- no se modifica ningún `.op` ni `recovery/**`.

La regla visual permanente sincronizada permite foco perceptible y conserva el texto superior izquierdo `GARFEX` en `#7C0000`; no autoriza otro rediseño.

## 6. Arquitectura y fronteras de dependencia

La solución permanece feature-first:

```text
src/app/
  routes/catalogo.tsx                # ruta y composición, sin dominio
  shell/AppShell.tsx                 # convivencia Bandeja/Catálogo

src/features/catalog-hierarchy/
  CatalogHierarchyEntry.tsx          # entrada de feature
  CatalogHierarchyScreen.tsx         # composición local
  catalogHierarchyState.ts           # selección y resets descendentes
  catalogHierarchy.types.ts          # modelos internos validados
  catalogHierarchy.api.ts            # adapter 1:1, futuro y gateado
  useCatalogList.ts                   # secuencias de lectura, futuro y gateado
  HierarchyBrowser.tsx                # lectura, futuro y gateado
  HierarchyReadPanel.tsx              # contexto no editable, futuro y gateado
  NuevaClaseSurface.tsx               # superficie local existente
  CatalogCreateDialog.tsx             # Familia/Tipo sólo en corte autorizado
  catalogHierarchy.css                # estilos feature-locales

src/shared/keyboard/**                # arbitraje, elegibilidad, geometría y foco ya transversales
storybook/catalog-hierarchy/**        # fixtures y estados poblados aislados
tests/**                              # unitarias, RTL, arquitectura y navegador
```

Reglas de dependencia:

- `src/features/catalog-hierarchy/**` puede consumir `src/shared/keyboard/**` y el cliente Convex autorizado, pero no Bandeja;
- Bandeja no importa Catálogo, no instancia Convex y no recibe fixtures o contratos de esta feature;
- el shell sólo conoce destinos, composición y primitivas transversales;
- un helper exclusivo de Catálogo permanece en la feature;
- una corrección de teclado sólo se promueve a `shared` cuando corrige el contrato transversal y existe evidencia RED fuera de un fork local;
- Storybook y tests pueden inyectar fakes, pero ningún módulo bajo `src/**` los importa.

## 7. Ruta, composición y propiedad del estado

`src/app/routes/catalogo.tsx` conserva la ruta exacta `/catalogo` y monta `CatalogHierarchyEntry`. `/bandeja` permanece como destino separado dentro de `AppShell`; Catálogo no sustituye ni modifica su capacidad interna.

La URL no almacena todavía selección de Clase, Familia o Tipo. El estado de navegación jerárquica pertenece a la instancia de la feature y no a un store global, storage ni cache persistente. Una futura decisión de deep-link no forma parte de este cambio.

Propiedad local mínima:

```text
CatalogHierarchyScreen
├── selectedClass
├── selectedFamily
├── selectedType
├── list sequence: classes
├── list sequence: families + selected class parent
├── list sequence: types + selected family parent
└── create dialog draft/request snapshot
```

El estado `active` o roving de un composite, si se necesita, es sólo una representación del control activo y de un único punto de tabulación local. No es autoridad de selección espacial ni crea un orden del documento.

## 8. Adapter Convex inyectable

La integración futura se localiza en `catalogHierarchy.api.ts`. El adapter expone métodos internos con nombres técnicos de la feature y traduce cada uno exactamente a una función autorizada de `catalogoAdmin/jerarquia`.

Decisiones del adapter:

- el transporte se inyecta para permitir pruebas contractuales sin red;
- cada método realiza una sola traducción 1:1 y devuelve únicamente un resultado validado;
- el valor recibido del transporte se trata como `unknown`;
- React, hooks y componentes nunca reciben respuestas Convex sin parsear;
- no se usa `any`, REST alternativo, `catalogoRecursos/catalogo` ni fallback local;
- no se construye una abstracción compartida, repositorio o capa Query alrededor de una sola feature;
- URL, versión del paquete, configuración, autenticación y tipo exacto del cliente no se fijan hasta resolver la puerta parent-owned;
- los nombres internos `classId` y `familyId` pueden usarse en estado local, pero la frontera wire traduce exactamente a `claseRecursoId` y `familiaRecursoId`.

La inyección de un fake sólo acredita el contrato frontend; nunca se presenta como evidencia runtime conectada.

## 9. Superficie Convex exacta autorizada

Sólo se permiten estas operaciones públicas.

### 9.1 Clase

- `catalogoAdmin/jerarquia:listarClases({ cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`
- `catalogoAdmin/jerarquia:obtenerClase({ claseRecursoId })`
- `catalogoAdmin/jerarquia:crearClase({ activo?, clave, descripcion?, nombre })`

### 9.2 Familia

- `catalogoAdmin/jerarquia:listarFamilias({ claseRecursoId?, cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`
- `catalogoAdmin/jerarquia:obtenerFamilia({ familiaRecursoId })`
- `catalogoAdmin/jerarquia:crearFamilia({ activo?, claseRecursoId, clave, descripcion?, nombre })`

### 9.3 Tipo

- `catalogoAdmin/jerarquia:listarTipos({ cursor?, familiaRecursoId?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`
- `catalogoAdmin/jerarquia:obtenerTipo({ tipoRecursoId })`
- `catalogoAdmin/jerarquia:crearTipo({ activo?, clave, descripcion?, familiaRecursoId, nombre })`

Las operaciones `obtener*` se usan sólo cuando un comportamiento aprobado necesita lectura individual. No se inventa la semántica de ausencia.

Aunque la superficie administrativa contenga funciones adicionales, el adapter no expone update, activate ni deactivate. La aceptación de IDs de padre opcionales por funciones administrativas de actualización no altera la inmutabilidad de producto y no autoriza su envío.

## 10. Frontera DTO y validación runtime de `unknown`

### 10.1 Páginas de listado

La única envolvente nominal admitida es:

```ts
{
  continuationCursor,
  isExhausted,
  items,
}
```

El cursor cruza la feature como token opaco. No se analiza, concatena, fabrica, persiste ni reutiliza entre secuencias. La evidencia parent-owned fresca, de sólo lectura, verificó contra el backend `convex@1.45.0`, sus declaraciones generadas, la implementación y una respuesta runtime vacía que la entrada opcional `cursor` y la salida `continuationCursor` usan el primitivo `string | null`. El parser conserva esa frontera sin sobreinterpretarla: estabilidad y comportamiento ante cursores inválidos siguen siendo gates no resueltos.

Cada item comparte nominalmente:

- `activo`;
- `clave`;
- `descripcion?`;
- `effective`;
- `effectiveReasons[]`;
- `id`;
- `nombre`;
- `revision`.

Familia añade `claseRecursoId`. Tipo añade `familiaRecursoId`, `aggregateStatus` y `violations`.

El parser por nivel debe:

1. recibir `unknown`;
2. verificar la envolvente y los campos autorizados según la evidencia wire aprobada;
3. verificar el item correspondiente a Clase, Familia o Tipo;
4. rechazar una página completa que no pueda validarse de forma segura;
5. rechazar para la secuencia contextual una Familia cuyo `claseRecursoId` no coincide con el padre solicitado;
6. rechazar para la secuencia contextual un Tipo cuyo `familiaRecursoId` no coincide con el padre solicitado;
7. no coercionar valores, crear defaults, derivar semántica ni mostrar payloads crudos;
8. entregar a React sólo DTOs internos ya validados.

Una página inválida o cruzada no reemplaza páginas válidas previas. Su clasificación técnica y su copy de usuario no se inventan.

### 10.2 Respuestas de creación

La única envolvente nominal aceptada es:

```ts
{
  disposition: "CREATED",
  item,
}
```

El parser valida `disposition` y el item del nivel solicitado. Una respuesta distinta no produce inserción optimista, selección, éxito visual ni entidad local ficticia.

## 11. Flujo de datos de lectura

```text
/catalogo
  → CatalogHierarchyEntry
  → CatalogHierarchyScreen
  → useCatalogList(operation, parent snapshot, injected adapter)
  → catalogHierarchy.api.ts
  → Convex catalogoAdmin/jerarquia:listar*
  → unknown
  → parser de envolvente + parser de item + guard de padre
  → página validada
  → secuencia local de la operación y padre originales
  → render de región / lectura no editable
```

No se solicita Familia sin Clase seleccionada ni Tipo sin Familia seleccionada. La ausencia de padre produce estado de espera, no una llamada con contexto fabricado.

La feature no auto-selecciona el primer item, no encadena consultas dependientes sin una selección explícita y no convierte una lista vacía en una afirmación sobre permisos, causa o negocio.

## 12. Selección Clase→Familia→Tipo y resets

Las transiciones son atómicas:

| Evento | Estado resultante | Efecto de lectura |
|---|---|---|
| Seleccionar Clase `C` | `class=C`, `family=∅`, `type=∅` | inicia una nueva secuencia de Familias para `C`; invalida la anterior y todos sus Tipos |
| Seleccionar Familia `F` que pertenece a `C` | `class=C`, `family=F`, `type=∅` | inicia una nueva secuencia de Tipos para `F`; invalida la anterior |
| Seleccionar Tipo `T` que pertenece a `F` | `class=C`, `family=F`, `type=T` | habilita lectura contextual no editable |
| Intentar seleccionar Familia de otra Clase | sin cambio | no consulta ni presenta descendientes cruzados |
| Intentar seleccionar Tipo de otra Familia | sin cambio | no consulta ni presenta descendientes cruzados |

Cambiar un padre invalida inmediatamente la pertenencia contextual de los descendientes, aunque una respuesta anterior siga en vuelo. El descarte de esa respuesta se resuelve mediante el guard de secuencia de la sección 13.

## 13. Cursores, secuenciación, stale guards y deduplicación

Cada listado posee una secuencia independiente identificada conceptualmente por:

```text
operación exacta + padre explícito, si existe + filtros realmente enviados
```

No existe un cursor global. La propiedad mínima es:

- Clases: cursor de `listarClases` para esa secuencia;
- Familias: cursor de `listarFamilias` para la Clase propietaria;
- Tipos: cursor de `listarTipos` para la Familia propietaria.

Reglas obligatorias:

1. una continuación usa exclusivamente el `continuationCursor` de la página previa validada;
2. conserva la misma operación, padre y filtros enviados;
3. no continúa cuando `isExhausted` es verdadero;
4. no inventa `pageSize`, `modo`, cursor alternativo, orden ni estabilidad;
5. un token monotónico local identifica la secuencia vigente;
6. al cambiar padre, filtros o reiniciar la secuencia, se incrementa el token y se descartan respuestas tardías del token anterior;
7. completar una promesa de transporte no basta para aplicarla: antes se vuelve a comparar operación, padre y token;
8. una respuesta tardía jamás restaura selección ni items del padre anterior;
9. la continuación es explícita; no se introduce prefetch, reintento automático ni backoff sin aprobación;
10. los items se deduplican por el `id` validado dentro de la misma secuencia;
11. ante un duplicado paginado se conserva una sola representación sin reordenar los items ya validados ni inferir cuál versión es “más nueva”;
12. si duplicados con el mismo `id` difieren y no existe semántica aprobada, no se inventa una reconciliación de dominio;
13. la UI conserva el orden de entrega validado sin afirmar que el backend garantice un orden y sin aplicar sort local;
14. un fallo inicial no fabrica items;
15. un fallo de continuación preserva las páginas válidas ya presentadas y mantiene disponible el reintento aprobado;
16. una página inválida, cruzada o stale no borra datos válidos de la secuencia vigente.

El reintento repite la operación fallida del mismo contexto vigente. Si el padre cambió, la acción antigua deja de pertenecer al contexto y no puede reusar su cursor.

## 14. Estados de lista y gates UX aprobados

Los nombres siguientes son estados técnicos internos, no copy nuevo.

| Estado técnico | Condición | Presentación autorizada |
|---|---|---|
| `waiting-for-parent` | Familia sin Clase o Tipo sin Familia | región dependiente estable; no se consulta |
| `initial-loading` | primera solicitud vigente sin items validados | `aria-busy` aplicable, indicador neutral, sin filas ficticias y con foco preservado |
| `empty` | página válida con cero items y `isExhausted === true` | tratamiento vacío aprobado; nunca antes del agotamiento |
| `ready` | existe al menos una página válida y no hay solicitud activa | items validados; ninguna garantía de orden inventada |
| `loading-more` | continuación explícita de una secuencia con items | conserva los items existentes; no agrega placeholders que parezcan datos |
| `partial-error` | falla una continuación después de páginas válidas | conserva datos parciales, no afirma agotamiento y ofrece reintento explícito |
| `initial-error` | falla la primera solicitud sin datos válidos | región estable, mensaje neutral y recuperación explícita |

Los estados aprobados provienen de `n2625` y `n2674`. No clasifican permisos, autenticación, cursor inválido u otras causas no demostradas. No muestran texto técnico o backend crudo.

## 15. Payloads exactos y creación jerárquica

La frontera de creación admite sólo estos payloads:

```text
crearClase:
  { clave, nombre, descripcion?, activo? }

crearFamilia:
  { claseRecursoId, clave, nombre, descripcion?, activo? }

crearTipo:
  { familiaRecursoId, clave, nombre, descripcion?, activo? }
```

Reglas:

- no se envía ningún campo fuera de la firma nominal;
- `activo` y `descripcion` sólo se envían cuando el comportamiento aprobado los proporciona; no se inventa un default;
- los opcionales vacíos no se convierten en valores wire inventados;
- el frontend no aplica trim, casing, normalización, unicidad, longitud ni validación de negocio no demostrada;
- Familia no se crea sin `claseRecursoId` explícita;
- Tipo no se crea sin `familiaRecursoId` explícita;
- `crearTipo` nunca recibe `claseRecursoId`;
- no se infiere ni reutiliza un padre de otra selección o solicitud;
- los campos de padre no aparecen en ninguna actualización porque las actualizaciones están excluidas.

## 16. Captura inmutable y ciclo de solicitud de creación

Al abrir una creación dependiente, el diálogo presenta el contexto de padre aprobado como no editable. Al confirmar:

1. se valida que la acción real siga visible, habilitada y en el nivel autorizado;
2. se captura una instantánea del padre contextual requerido;
3. se construye una sola vez el payload mínimo autorizado;
4. esa instantánea no cambia aunque el estado visual cambie mientras la promesa está en vuelo;
5. se bloquea la confirmación duplicada durante la solicitud;
6. el adapter envía una sola función `crear*` correspondiente;
7. la respuesta `unknown` se valida como `{ disposition: "CREATED", item }`;
8. sólo una respuesta validada invalida la secuencia afectada y solicita de nuevo su primera página;
9. no se inserta, reordena ni selecciona el item de forma optimista;
10. no se inventa posición, auto-selección, auto-cierre o feedback posterior fuera de la autoridad aprobada.

Ante fallo de creación se conserva el input, se restaura el foco conforme al tratamiento aprobado y no se infiere la causa. El copy permanece neutral y no expone el error crudo. Ninguna mutación real se conecta o ejecuta hasta resolver la puerta parent-owned y contar con autorización separada para el procedimiento no productivo.

## 17. Integración Keyboard First por referencia

Catálogo consume, sin duplicar, `openspec/specs/keyboard-interaction/spec.md`, la exigencia permanente de `openspec/specs/frontend-foundation/spec.md` y la sección 11 del brief.

### 17.1 Arbitraje compartido

Todo evento respeta la precedencia:

```text
edición/IME
  → control o composite local
  → overlay activo
  → feature activa
  → atajo global
```

Catálogo reutiliza `KeyboardControllerProvider`, `arbitrateKeyboardEvent` y las primitivas compartidas. No instala otro listener global, no continúa si `defaultPrevented` es verdadero y no ejecuta un nivel posterior cuando un contexto anterior consumió el evento.

### 17.2 Elegibilidad DOM y geometría física

Las flechas sin modificar usan `focusSpatialTarget` y su medición vigente. Sólo participan controles:

- conectados al documento;
- visibles por sí mismos y sus ancestros;
- habilitados;
- operables;
- con rectángulo de área positiva dentro del viewport;
- pertenecientes a la superficie u overlay activo.

La selección usa semiplano físico, proximidad, alineación perpendicular y desempate determinista. No usa índice, texto, idioma, RTL, orden DOM ni orden declarado de columnas. Scroll, layout y portales deben evaluarse con geometría vigente.

### 17.3 Estado activo local representacional

Un composite de Clases, Familias o Tipos puede mantener un item activo y un punto de tabulación local para representar el foco. Ese estado:

- se sincroniza después de un movimiento válido;
- no elige el destino espacial;
- no hace seleccionable un item inelegible;
- no instala un orden roving para el documento;
- no captura `Tab`;
- no convierte labels estáticos o capacidades futuras en controles.

### 17.4 Teclas y comandos exactos

- `Tab` y `Shift+Tab` permanecen nativos entre zonas y pueden entrar o salir del navegador jerárquico sin contención no modal.
- Edición, formularios, autocomplete, `contenteditable`, descendientes editables e IME tienen prioridad y suspenden flechas espaciales y atajos de una tecla.
- `N`/`n` sin modificadores activa únicamente la acción real, visible y habilitada `Nueva Clase` en Catálogo; nunca Nueva Familia, Nuevo Tipo, Recurso o una acción ficticia.
- `?` se detecta semánticamente mediante `event.key === "?"`, incluidos los modificadores necesarios de la distribución activa; no se usa `event.code` ni la posición física de `/`.
- Windows/Linux conserva el `Ctrl+K` exacto y macOS el `Cmd+K` exacto, sin `Shift`, `Alt` ni el modificador de plataforma opuesto.
- `Ctrl+N` queda intacto: Catálogo y GARFEX no lo capturan, cancelan ni reutilizan.
- `Enter` activa sólo el control enfocado cuando expone una acción real.
- `Escape` actúa una sola vez sobre la capa activa de mayor precedencia.

## 18. Foco, diálogos y accesibilidad

Los formularios y regiones aprobados deben tener labels visibles cuando la autoridad los muestra, nombres accesibles, orden DOM lógico, foco perceptible y contraste aplicable a WCAG 2.2 AA.

Ciclo de diálogo:

1. la apertura registra el opener elegible real;
2. el foco entra en el control inicial aprobado del diálogo;
3. sólo el modal o diálogo activo puede contener `Tab`/`Shift+Tab`;
4. el fondo no participa en la navegación espacial mientras el overlay está activo, incluso si el overlay usa portal;
5. Cancelar o `Escape` cierra únicamente la capa superior;
6. al cerrar se elimina la contención;
7. `restoreFocusNextFrame` intenta el opener si sigue conectado, visible, habilitado y operable;
8. si el opener dejó de ser elegible, usa el fallback accesible explícito de la superficie activa;
9. el foco no termina en `body`, un nodo desconectado o el fondo inactivo.

La superficie no modal de Catálogo no crea focus trap. `prefers-reduced-motion` se respeta sin eliminar el indicador de foco.

## 19. Storybook, fixtures y aislamiento de runtime

La única composición poblada autorizada para fixtures es la demostración `Materiales → Canalizaciones → Tubería`, y vive exclusivamente bajo `storybook/catalog-hierarchy/**` o tests.

Reglas de aislamiento:

- ningún archivo bajo `src/**` importa stories, fixtures o fakes;
- `/catalogo` sin backend no muestra esos nombres como datos de producto;
- runtime sólo puede mostrar estados aprobados de espera, loading, vacío, parcial o error según evidencia real;
- una story poblada no acredita conectividad, permisos, datos reales ni mutaciones;
- `tests/unit/**` puede inyectar un fake del adapter sin hacerlo importable por runtime;
- `/bandeja` no instancia cliente Convex, no recibe provider por efecto de Catálogo y no reutiliza fixtures de Catálogo;
- los fixtures históricos de Bandeja permanecen aislados y no definen contratos para Catálogo;
- `pnpm verify:runtime-bundle` y guardas arquitectónicas deben detectar fugas, pero no sustituyen el gate runtime.

## 20. Cambios de archivos previstos

| Superficie | Cambio permitido | Restricción |
|---|---|---|
| `src/app/routes/catalogo.tsx` | conservar entrada `/catalogo` | sin lógica de dominio ni datos |
| `src/app/shell/AppShell.tsx` | conservar destinos reales Bandeja/Catálogo e integración transversal | sin rediseño visual, cliente Convex o acciones futuras |
| `src/app/routeTree.gen.ts` | regeneración mecánica cuando corresponda | no editar como contrato manual |
| `src/features/catalog-hierarchy/catalogHierarchyState.ts` | selección, pertenencia y resets | sin store global ni persistencia |
| `src/features/catalog-hierarchy/catalogHierarchy.api.ts` | adapter inyectable, llamadas 1:1 y parsers | sólo después del gate runtime |
| `src/features/catalog-hierarchy/useCatalogList.ts` | cursor, secuencia, stale guard, dedupe y estados parciales | sin orden, prefetch o retries inventados |
| `src/features/catalog-hierarchy/HierarchyBrowser.tsx` | tres regiones accesibles | sin Recurso ni auto-selección |
| `src/features/catalog-hierarchy/HierarchyReadPanel.tsx` | lectura y padre no editable | sin update/activate/deactivate |
| `src/features/catalog-hierarchy/NuevaClaseSurface.tsx` | conservar checkpoint no mutante; conectar sólo en Corte 3 autorizado | visual parcial congelada hasta decisión explícita |
| `src/features/catalog-hierarchy/CatalogCreateDialog.tsx` | altas Familia/Tipo en Corte 4 | roots aprobados y padres inmutables |
| `src/shared/keyboard/**` | reutilización; corrección transversal demostrada por RED | nunca fork o regla exclusiva de Catálogo |
| `storybook/catalog-hierarchy/**` | fixtures poblados y estados aprobados | nunca importable por runtime |
| `tests/**` | evidencia contractual, interacción, arquitectura y navegador | separar fake, estructural y conectado |

No se prevén cambios backend, migraciones, `.op`, `recovery/**` ni fixtures de Bandeja.

## 21. Cuatro cortes locales y límites de aceptación

La entrega conserva exactamente cuatro cortes locales secuenciales. La remediación bounded histórica pertenece al Corte 1 y no constituye un quinto corte; actualmente está congelada.

### 21.1 Corte local 1 — frontera usable no mutante

Incluye shell, `/catalogo`, contexto local, resets descendentes y `Nueva Clase` presentacional sin Convex. Mantiene runtime sin fixtures y Storybook aislado. La evidencia histórica de foco, Cancelar y `Escape` se conserva, pero el checkpoint visual se considera parcial y no se reabre desde este diseño.

**Rollback:** retirar ruta, entrada de navegación, feature local, story/pruebas del corte y regeneración del route tree; preservar `/bandeja`, OpenPencil y recuperación.

### 21.2 Corte local 2 — lectura autoritativa

Añade adapter inyectable, parsers `unknown`, cursores por operación/padre, tokens monotónicos, stale guards, deduplicación, rechazo de páginas cruzadas, estados aprobados y navegador jerárquico. No conecta nada mientras el gate runtime siga abierto.

**Rollback:** retirar adapter, hook, lector, browser, configuración y pruebas del corte; conservar íntegro el Corte 1.

### 21.3 Corte local 3 — contratos de creación y Clase

Añade pruebas de payload exacto para las tres altas y conecta `Nueva Clase` sólo con versión, URL, wire types, autenticación, permisos, paginación y procedimiento seguro ya verificados y autorizados. No simula éxito si la puerta continúa abierta.

**Rollback:** retirar métodos de creación y wiring de Clase; conservar lectura y superficie presentacional.

### 21.4 Corte local 4 — Familia, Tipo y verificación workstation

Conecta Familia/Tipo con padres explícitos e inmutables, roots aprobados y refetch posterior a `CREATED`. Completa la matriz workstation sin incorporar Recursos ni capacidades administrativas adicionales.

**Rollback:** retirar diálogos y wiring de Familia/Tipo; conservar ruta, lectura y `Nueva Clase` según el corte anterior.

Ningún corte autoriza commits, ramas, PRs, remotes, publicación ni Receipt-Driven Development. El riesgo de superar 400 líneas se gestiona con `ask-on-risk`; no se mezclan cortes para ocultarlo.

## 22. Estrategia de pruebas y evidencia TDD estricta

Cada comportamiento nuevo sigue, en orden, **RED → GREEN → TRIANGULATE → REFACTOR**. No se reconstruye evidencia RED ausente ni se declara una comprobación aprobada sin ejecutar su comando.

### 22.1 Matriz por responsabilidad

| Responsabilidad | Capa primaria | Evidencia requerida |
|---|---|---|
| Resets Clase/Familia/Tipo y rechazo cruzado | unitarias puras | transiciones atómicas y ausencia de consulta sin padre |
| Nombres de funciones, args y payloads | unitarias de adapter con spy | llamada 1:1 y ausencia de campos no autorizados |
| Parsers `unknown` y DTOs | unitarias | aceptación nominal y rechazo de forma/nivel/padre inválidos |
| Cursores y secuencias | unitarias de hook | mismo cursor/operación/padre, agotamiento, stale guard y dedupe |
| Datos parciales y retry | RTL + hook | preservación de items válidos y reintento contextual explícito |
| Tab nativo y estado local representacional | RTL | no `preventDefault` para Tab, entrada/salida del composite |
| Geometría, RTL, scroll y portales | unitarias compartidas + Playwright | rectángulos reales y overlay activo |
| `N`, `?`, Ctrl/Cmd+K y Ctrl+N | arbitraje + RTL + Playwright | precedencia y comandos exactos |
| Diálogos y foco | RTL + Playwright | foco inicial, contención modal, Escape/Cancelar y restauración/fallback |
| Fixtures y Bandeja | arquitectura + runtime bundle + regresión | ninguna fuga a `src/**` ni cliente en Bandeja |
| Visual aprobado | Storybook + Playwright 1440×980 | comparación contra root correspondiente, sin afirmar fidelidad por estructura |
| Exclusiones | arquitectura | sin Recurso, update/activate/deactivate, storage, Query/store o responsive/touch |

### 22.2 Evidencia histórica preservada

`apply-progress.md` registra para la continuación correctiva del Corte 1:

- RED correctiva observada por foco defectuoso al abrir `Nueva Clase`;
- GREEN enfocado de 2/2 tests;
- 21/21 tests en 8 archivos;
- 2/2 stories;
- 2/2 escenarios Playwright a 1440×980 con axe aplicable;
- `router:check`, `typecheck` y `format:check` aprobados;
- `pnpm lint` fallido por 70 errores heredados bajo `recovery/**`, reportados verazmente y fuera de la superficie permitida;
- ningún E2E conectado ni mutación Convex.

La verificación permanente Keyboard First ya fue cerrada y sincronizada en su cambio propio; Catálogo debe agregar cobertura de integración, no volver a inventar el contrato.

## 23. Gates parent-owned y condiciones de conexión

Antes de añadir o ejecutar integración conectada, el padre debe verificar y registrar:

1. versión real compatible del paquete `convex`;
2. URL efectiva y superficie autorizada de `VITE_CONVEX_URL`;
3. tipos primitivos wire completos de IDs, `revision` y DTOs; el primitivo del cursor ya está verificado como `string | null` para la entrada opcional `cursor` y la salida `continuationCursor`, sin evidencia todavía sobre estabilidad o cursores inválidos;
4. compatibilidad del cliente y forma de invocación de funciones;
5. autenticación runtime efectiva;
6. permisos efectivos para cada lectura y creación seleccionada; la prueba pública disposable ya verificó `crearClase`, `crearFamilia` y `crearTipo` con `auth:none`, sin extrapolar esa evidencia a otras operaciones o entornos;
7. paginación real, incluidos continuación y comportamiento observable permitido;
8. entorno no productivo y procedimiento seguro para cualquier mutación;
9. autorización separada para ejecutar una mutación, aunque el código contractual exista;
10. tratamiento de cualquier evidencia nueva sin inventar copy, causas ni reglas.

La verificación disposable completada aporta evidencia runtime acotada, sin cambiar estas condiciones: una copia temporal con Convex `1.45.0` usó estado aislado local al cwd y puertos `33210`/`33211`; las funciones y el esquema se publicaron sólo allí. La ejecución administrativa confirmó lecturas vacías con la envolvente nominal, una cadena autorizada Clase→Familia→Tipo de entidades inactivas creada una sola vez, coincidencia de `obtener*`, relaciones padre, `activo:false`, `revision:1`, omisión de `descripcion` cuando no se envió, estados de efectividad inactiva y paginación real de primera/segunda página en el mismo contexto. También confirmó que la autoridad `3210` permaneció vacía bajo lectura anónima. No se conservan IDs, credenciales ni valores de cursor como datos durables.

La verificación pública adicional, independiente de la lectura administrativa, usó un `ConvexHttpClient` plano contra el endpoint disposable con `auth:none`, cero llamadas `setAuth` y sin inyección de token, clave administrativa, credencial ni header. Ejecutó exactamente `crearClase`, `crearFamilia` y `crearTipo` en una única cadena inactiva y aislada; las tres devolvieron `CREATED`, con relaciones padre exactas, `activo:false`, `revision:1`, y Tipo con `NOT_EVALUATED` y cero violaciones. Esta evidencia cierra la incertidumbre de permiso público para esas tres creaciones sólo en el disposable: no es un despliegue del producto, no configura el paquete frontend ni una URL efectiva, y no verifica el transporte frontend. La implementación de Familia/Tipo sigue sin comenzar y requiere una decisión explícita de apply; la autoridad `3210` no fue consultada ni mutada en esta verificación. El deployment disposable final y la instancia anterior involucrada en el incidente de credenciales fueron destruidos completamente; no se conserva ninguna credencial expuesta, los paths temporales están ausentes y los puertos `33210`/`33211` están cerrados. Verificador independiente y cleanup: PASS.

La evidencia nominal de `function-spec`, un fake unitario, una story o un build no satisface estas puertas. Mientras permanezcan abiertas:

- no se añade una versión supuesta de Convex;
- no se configura una URL inventada;
- no se conecta lectura ni creación de Familia/Tipo;
- no se ejecuta mutación de producto;
- no se sustituye la ausencia con fixtures, storage o no-op engañoso;
- no se presenta Catálogo como capacidad conectada completa.

## 24. Rollout y rollback integral

El rollout es incremental dentro de la misma capacidad, siguiendo los cuatro cortes. Un corte se activa sólo cuando sus dependencias, TDD y gates aplicables tienen evidencia real.

No hay migración ni cambio backend. El rollback frontend puede retirar, por corte, la ruta, navegación, feature y wiring Convex sin tocar datos backend. Siempre preserva:

- `/bandeja` y el shell no relacionado;
- entidades creadas correctamente en backend;
- artefactos OpenPencil y recuperación;
- fixtures de Bandeja;
- especificaciones archivadas y contrato Keyboard First canónico;
- evidencia histórica veraz.

Si una operación conectada resulta incompatible, se retira o deshabilita el wiring afectado. No se reemplaza con persistencia local, datos ficticios, reglas inventadas ni una API alternativa. Un rollback frontend no elimina automáticamente entidades backend; cualquier reversión de negocio requiere un procedimiento confirmado fuera de este cambio.

## 25. Matriz de amenazas de alcance y mitigaciones

| Amenaza | Consecuencia | Mitigación de diseño |
|---|---|---|
| Respuesta tardía de otro padre | descendientes cruzados | token monotónico y comparación operación/padre antes de aplicar |
| Reutilizar cursor entre secuencias | páginas incoherentes | cursor propiedad de operación, padre y filtros originales |
| Página con padre incorrecto | contaminación de contexto | parser/guard rechaza la página y conserva datos válidos |
| Duplicados entre páginas | filas repetidas o reordenadas | dedupe por `id`, una representación y sin sort local |
| Fallo de continuación | pérdida de trabajo visible | preservar páginas válidas, no afirmar agotamiento y retry explícito |
| Respuesta wire inesperada | datos inseguros en React | `unknown` hasta parser; sin coerción ni `any` |
| Alta con padre mutable | ruptura de invariante | snapshot inmutable por solicitud y padre read-only |
| Doble confirmación | mutación duplicada | bloqueo de confirmación mientras la solicitud está activa |
| Inventar posición tras crear | orden falso | sin inserción optimista; invalidar y releer |
| Fuga de fixtures | datos ficticios en runtime | roots separados y guardas de imports/bundle |
| Convex en Bandeja | ampliación accidental | cliente y adapter sólo dentro de la feature Catálogo |
| Fork de teclado local | precedencia y foco incompatibles | reutilizar arbitraje, elegibilidad, geometría y restauración shared |
| Roving como autoridad | navegación por índice/DOM | estado local sólo representacional |
| Trampa de foco no modal | usuario bloqueado | contención exclusiva de diálogo activo |
| Rediseño durante reconciliación | pérdida del checkpoint aprobado/parcial | freeze visual y autorización explícita para retomarlo |
| Expandir a Recurso o administración | scope creep | guardas arquitectónicas y ausencia de rutas/adapter/actions |
| Infraestructura preventiva | doble autoridad y complejidad | adapter directo feature-local; sin Query/store/facade |
| Inferir permisos o errores | UX falsa | gates parent-owned y copy neutral aprobado |
| Mutación sin procedimiento seguro | datos no recuperables | autorización separada y entorno no productivo verificado |

### 25.1 Amenazas operativas no aplicables

Este diseño no clasifica ni ejecuta paths, no automatiza selección Git, no crea commits, no hace push y no ejecuta comandos de PR. Esas superficies son `N/A` para esta fase y no deben usarse para ampliar el alcance.

## 26. Criterio de aceptación del diseño

La implementación posterior es conforme sólo si puede demostrar simultáneamente que:

- `/catalogo` y `/bandeja` conviven como destinos separados;
- la frontera permanece en `src/features/catalog-hierarchy` salvo primitivas transversales reales;
- todas las respuestas Convex entran como `unknown` y se validan antes de React;
- sólo se usan las nueve operaciones read/create seleccionadas de `catalogoAdmin/jerarquia`;
- cursores, secuencias, stale guards, dedupe y datos parciales respetan operación y padre;
- Clase→Familia→Tipo mantiene resets descendentes y rechaza padres cruzados;
- los payloads de creación contienen exactamente los campos autorizados y el padre capturado inmutable;
- loading, waiting, empty, partial y error respetan los roots OpenPencil aprobados sin inventar causas;
- los fixtures poblados existen sólo en Storybook/tests y Bandeja sigue aislada;
- Keyboard First se consume por referencia con Tab nativo, prioridad de edición/IME, geometría física, N real-only, `?` semántico, Ctrl/Cmd+K exacto, Ctrl+N intacto y foco contenido sólo en diálogo;
- el checkpoint visual parcial permanece congelado hasta autorización y no sufre rediseño incidental;
- cada corte conserva evidencia RED, GREEN, TRIANGULATE y REFACTOR real;
- los gates parent-owned se resuelven antes de cualquier conexión o mutación;
- no aparece Recurso, update/activate/deactivate, responsive/mobile/touch ni infraestructura especulativa.

Este criterio no convierte incógnitas en contratos. Toda evidencia runtime nueva debe registrarse en la autoridad correspondiente antes de cambiar parsers, estados, copy, permisos o procedimiento de mutación.

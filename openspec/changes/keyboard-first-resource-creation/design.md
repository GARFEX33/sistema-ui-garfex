# Diseño — Creador de recursos Keyboard First

`skill_resolution: paths-injected`

## Autoridad y lectura

Este archivo fija la arquitectura, el alcance, la migración y el límite de integración de `keyboard-first-resource-creation`. Los contratos mecánicos de estado, loaders, foco, reconciliación y pruebas están en [design-details.md](./design-details.md). Proposal y spec prevalecen si un detalle histórico los contradice.

Esta revisión sustituye expresamente el diseño anterior de **Datos del recurso**, controles libres por tipo de atributo, payload legado y resolución frontend de `CONDITIONAL`.

## Decisión dominante: flujo selection-only en dos capacidades

La arquitectura tendrá una única composición feature-local, **ResourceCreationShell**, pero dos capacidades entregables separadas por una pared contractual:

1. **Capacidad backend-independent disponible ahora:** shell GARFEX, rail, barra de comandos, selector search-list, Clase, Familia, Tipo, Unidad natural, invalidación jerárquica y borrador puro de selecciones activas/suspendidas.
2. **Capacidad backend v1 bloqueada:** atributos dinámicos, evaluación, revisión autoritativa y creación desde selecciones.

Tras confirmar Unidad natural, el bundle actual terminará honestamente en **Contrato pendiente**. No cargará las asignaciones/opciones legadas, no mostrará atributos simulados, no pedirá Nombre o Descripción y no llamará `crearRecurso`. Esta pared es parte del producto actual, no un fallback de error.

Cuando existan los DTOs exactos, la misma shell continuará con evaluaciones autoritativas y una secuencia `Atributos · n de total` keyed por assignment ID. La integración se diseñará contra esos DTOs publicados; este diseño no declara interfaces de transporte provisionales.

## Alcance y compatibilidad con `e52b9b2`

El runtime sigue centrado en `src/features/resources-master` y su composición mínima desde `ResourcesMasterScreen`. Se preservan las costuras compatibles ya implementadas:

- snapshot local derivado y normalizado al abrir;
- `resourceIdKey` y reducer feature-local;
- `createParentGatedListController` para listas jerárquicas;
- `createDependentLoader` como base paginada/stale-safe;
- `StagedSearchSelector` y su modelo de filtro local;
- trigger `N`, `Dialog`, registro de overlay y restauración de foco;
- `onCreated → refetchActive()` como seam futuro, sin invocación mientras no exista creación v1 confirmada.

Se reemplazan, aunque ya tengan pruebas históricas:

- el wizard `Paso 1/2/3` y los `Select` simultáneos;
- la preselección implícita de Unidad;
- los controles TEXTO, NUMERO, BOOLEANO u OPCION construidos desde contratos legados;
- Nombre, Descripción y cualquier otro dato de negocio escrito manualmente;
- `buildValores`, el payload `ResourceCreateInput`, `ownership` y `api.createResource` dentro del Creador;
- errores/disposiciones inferidos desde `crearRecurso`;
- la suposición de que `CONDITIONAL` equivale a opcional u omitible.

`resourcesMaster.api.ts` puede conservar sus operaciones legadas para otros consumidores. El nuevo Creador no las usa como atajo y no las modifica antes del contrato backend v1.

## Arquitectura feature-local

| Límite | Responsabilidad | Promoción |
| --- | --- | --- |
| `CrearRecursoSurface.tsx` | Trigger/atajo, apertura/cierre, captura del opener y composición del diálogo | Permanece feature-local |
| `ResourceCreationShell.tsx` | Layout GARFEX, una decisión dominante, foco por etapa y composición de rail/contenido/barra | Feature-local |
| `CreationStageRail.tsx` | Contexto persistente y regreso a etapas confirmadas; agrupa todos los atributos en una sola entrada | Feature-local |
| `CreationCommandBar.tsx` | Acciones disponibles y ayudas de teclas coherentes con la etapa | Feature-local |
| `StagedSearchSelector.tsx` | SearchField + ListBox, filtro de páginas cargadas, candidato, confirmación y transferencia de foco | Reutilizable sólo dentro de `resources-master` |
| `resourceCreation.model.ts` | Snapshot, reducer, invalidaciones, navegación y evaluación/fingerprint nulos en cada mutación | Feature-local |
| `resourceCreation.selectionDraft.ts` | Modelo puro genérico de selecciones activas/suspendidas por assignment ID | Feature-local; no es un DTO |
| `resourceCreation.loaders.ts` | Cargas dependientes paginadas, dedupe, retry y rechazo stale | Feature-local |
| `useResourceCreationFlow.ts` | Une controladores/loaders con reducer sin guardar el borrador remotamente | Feature-local |
| `ResourceCreationContractPending.tsx` | Fin honesto del recorrido disponible y explicación no accionable de la dependencia | Feature-local |
| `ResourcesMasterScreen.tsx` | Entrega snapshot de sólo lectura y conserva el seam de refetch confirmado | Modificación mínima |

No se reutiliza ni modifica `HierarchyNavigator`: tres columnas con selección inmediata no representan una sola decisión secuencial. Se reutilizan `Dialog`, `Button`, `Field` cuando exista búsqueda, React Aria y tokens semánticos. No se crea un componente `shared/ui` por esta única ocurrencia.

Todos los archivos runtime de creación se mantendrán por debajo de 500 líneas. `CrearRecursoSurface` dejará de ser un segundo shell y quedará como coordinador del trigger/overlay.

## Composición visual y jerarquía

El diálogo se titula **Creador de recursos**; el trigger puede conservar **Nuevo recurso** y `N`. En toda etapa se muestran, en este orden:

1. encabezado GARFEX;
2. `CreationStageRail` compacto;
3. título/pregunta de la única decisión dominante;
4. búsqueda opcional fija sobre su lista;
5. contador honesto de elementos cargados/visibles;
6. estados de carga, vacío, error o contrato pendiente;
7. `CreationCommandBar` persistente.

El rail contiene Clase, Familia, Tipo y Unidad natural. Cuando backend v1 exista añade una sola entrada agregada `Atributos · n de total`; nunca una miga por asignación. Revisión/Resultado aparecen sólo cuando una evaluación real permita llegar a ellas. El contexto jerárquico confirmado continúa visible durante todos los atributos.

Candidato enfocado y selección confirmada no comparten semántica: foco usa contorno y marcador de posición; una selección confirmada usa texto/check y queda reflejada en el rail. Ningún estado depende sólo del color.

## Flujo de datos disponible ahora

```text
ResourcesMasterScreen hierarchy selection + loaded items
        │ deriveInitialHierarchySnapshot (read-only)
        ▼
CrearRecursoSurface.open()
        │ capture + normalize continuous prefix
        ▼
local reducer / useResourceCreationFlow
        ├─ Clase   ─ current paginated hierarchy loader
        ├─ Familia ─ current paginated hierarchy loader, keyed by Clase
        ├─ Tipo    ─ current paginated hierarchy loader, keyed by Familia
        └─ Unidad  ─ effective Type policies pages → getUnit detail
                     (token/context/cursor guarded)
        ▼ explicit Enter/click confirmation
ResourceCreationContractPending
        ├─ no attribute production request
        ├─ no authoritative review
        └─ no create action
```

Cambiar un ancestro invalida descendientes en una sola transición. Cambiar Unidad invalida evaluación y fingerprint aunque ambos sean `null` en la capacidad actual. El snapshot nunca recibe setters de la pantalla, por lo que el filtro y la consulta activa quedan aislados.

La búsqueda sólo filtra candidatos cargados. El contador dirá, por ejemplo, “3 coincidencias entre 20 opciones cargadas”; si existe cursor, **Cargar más…** permanece explícito. Nunca se afirma una búsqueda global.

## Flujo futuro, bloqueado por backend v1

Una vez publicado y aceptado el contrato:

```text
confirmed hierarchy + Unit + active selection IDs
        │
        ▼
evaluarCreacionDesdeSelecciones
        │ response adopted only for current draft revision/request token
        ▼
normalized authoritative facts
        ├─ status INCOMPLETE | VALID | INVALID
        ├─ resolved assignment sequence and applicability
        ├─ allowed-value validity used for reconciliation
        ├─ issues
        ├─ generated name + technical identity
        └─ catalog fingerprint
        │
        ├─ reconcile active/suspended buckets by assignment ID
        ├─ next pending selection → Atributos · n de total
        └─ VALID/INVALID/INCOMPLETE review from response only

VALID current evaluation + required expected fingerprint
        │ active selection IDs only
        ▼
crearRecursoDesdeSelecciones
        │ transactional reevaluation
        ▼
explicit contractual disposition → UI result
```

El frontend no analiza expresiones `CONDITIONAL`, no calcula aplicabilidad, no genera nombre/identidad y no valida valores permitidos por su cuenta. Sólo aplica hechos explícitos ya normalizados desde la evaluación vigente. Cada confirmación, omisión o cambio elimina inmediatamente la evaluación y el fingerprint anteriores antes de iniciar otra evaluación.

## Pared contractual backend

Las responsabilidades están confirmadas, pero se difieren deliberadamente nombres de campos, interfaces TypeScript, schemas, nulabilidad, códigos de error y disposiciones. No se añadirá un “tipo aproximado”, endpoint falso ni mock productivo.

La integración sólo puede comenzar cuando estén disponibles, para cada operación, el request/response exacto y ejemplos contractuales de:

- `obtenerDefinicionAtributo`, incluido `modoCaptura: SELECCION | LIBRE | DERIVADO`;
- `listarValoresPermitidosAtributo`, con identidad seleccionable y valor tipado;
- `evaluarCreacionDesdeSelecciones`, con estados, fingerprint, asignaciones resueltas, incidencias, nombre e identidad;
- `crearRecursoDesdeSelecciones`, con IDs, `expectedCatalogFingerprint`, errores y disposiciones explícitas.

En ese momento se hará una revisión corta de proposal/design si el contrato exige decisiones no previstas. Después se añadirán parsers de transporte antes de React y tests con dobles exactos limitados a pruebas. `crearRecurso` seguirá disponible pero no será llamado por esta capacidad.

## Accesibilidad, foco y movimiento

- Búsqueda es el único control de escritura.
- `ArrowDown` desde búsqueda entra en la lista; `ArrowUp` desde el primer candidato vuelve a búsqueda.
- Una tecla imprimible desde lista enfoca búsqueda e incorpora el carácter, respetando IME y modificadores.
- Flechas sólo cambian candidato; `Enter` confirma explícitamente.
- `ArrowLeft` vuelve sólo fuera de edición; `Escape` vuelve una etapa y cierra únicamente desde Clase.
- `Tab`/`Shift+Tab` y focus trap pertenecen a React Aria/Dialog.
- No se añade listener `document`/`window`; el overlay mantiene inhibidos los atajos del fondo.
- Al cerrar se restaura foco al opener conectado o al fallback accesible existente.
- Rail, opciones y acciones tendrán objetivo interactivo mínimo de 44 CSS px, separaciones suficientes y foco visible con contorno/forma además de color. Se reutiliza `Button`; cualquier ajuste local de caja aumenta su hit area sin recrear su chrome.
- El contenido enfocado no queda oculto por la barra sticky; el shell desplaza el cuerpo antes de enfocar cuando sea necesario.
- No se requiere animación para comprender transiciones. Si se conserva una transición de Dialog o etapa, usará transform/opacity, será interrumpible y quedará anulada con `prefers-reduced-motion`.
- GARFEX Light es el único modo implementado; no se inventan tokens Dark ni colores hex feature-locales.

## Migración desde la implementación actual

1. **Corte de seguridad:** después de Unidad, enrutar a `contract-pending`; creación y atributos legados dejan de ser alcanzables antes de cualquier refactor visual.
2. Extraer `ResourceCreationShell`, `CreationStageRail` y `CreationCommandBar`; renombrar el diálogo y mantener trigger/overlay/foco.
3. Completar Familia y Tipo con el patrón staged y controladores paginados/stale-safe ya usados por Clase; retirar sus `Select` simultáneos.
4. Completar Unidad desde políticas efectivas + detalle, sin preselección ni lista global; retirar el loader de una página.
5. Retirar por regiones el loader/UI de atributos legados, luego Datos/Revisión/submit/payload legado. Cada eliminación mantiene `contract-pending` como único final alcanzable.
6. Introducir y probar el borrador puro active/suspended por assignment ID sin conectarlo a contratos productivos.
7. Cerrar accesibilidad, arquitectura, Playwright y regresiones de aislamiento/refetch.
8. Sólo después de backend v1: adapters exactos, reconciliación autoritativa, atributos SELECCION, revisión y create con fingerprint.

No habrá feature flag, ruta nueva, estado global ni persistencia local. Cada corte TDD debe quedar por debajo de 400 líneas agregadas + eliminadas; si una sustitución honesta no cabe, se divide por región observable y se eleva el riesgo antes de exceder el límite.

## Pruebas y rollout

La capacidad backend-independent termina GREEN con:

- pruebas puras de snapshot, navegación, cascadas, evaluación/fingerprint invalidados y buckets active/suspended;
- pruebas de paginación/dedupe/retry/stale para jerarquía y Unidad;
- RTL del selector para foco search↔list, escritura desde lista, Enter explícito, IME y ausencia de autoselección;
- RTL del shell/rail/barra para una decisión dominante, back/Escape y contrato pendiente;
- pantalla/refetch para snapshot aislado y seam `onCreated` no disparado por el final pendiente;
- guards de un solo listener global, límites de imports y archivos runtime menores de 500 líneas;
- Playwright sólo teclado + axe hasta Unidad y Contrato pendiente.

Los recorridos de atributos/revisión/create se añaden únicamente con fixtures conformes a DTOs backend v1 publicados. El despliegue actual es frontend normal y comunica la dependencia; no simula una capacidad completa.

## Rollback y riesgos

El rollback se hace en orden inverso por cortes feature-locales. No requiere migración de datos. Se preservan la API legada, Catálogo, `refetchActive`, shared UI, Keyboard Controller, rutas y consultas.

| Riesgo | Control |
| --- | --- |
| El código legado vuelve a habilitar creación | Guard arquitectónico: el Creador no referencia `api.createResource` ni construye `ResourceCreateInput` |
| Se inventan DTOs para avanzar | Pared contractual y estado productivo `contract-pending` |
| Una respuesta vieja cambia el contexto | Token + context key + cursor/revision antes de adoptar |
| Candidato se confunde con confirmado | Estado y semántica separados; sólo action/Enter confirma |
| Rail se satura con atributos | Una única entrada `Atributos · n de total` |
| Se pierden selecciones reversibles | Buckets active/suspended keyed por assignment ID y reconciliación sólo desde hechos backend |
| Foco compite con edición o AppShell | Handlers locales con guards, React Aria y cero listeners globales nuevos |
| La extracción crea otro monolito | Límites atómicos feature-locales y guard `<500` líneas runtime |

## Criterio de cierre

El diseño backend-independent queda implementable cuando Clase → Familia → Tipo → Unidad funciona por selección explícita, paginada y stale-safe; el contexto permanece visible; la barra explica comandos; el teclado cumple la transferencia de foco; el final dice Contrato pendiente; y no existe una ruta productiva desde el Creador hacia captura manual, atributos legados, evaluación local o `crearRecurso`.

La integración final continúa bloqueada hasta disponer de DTOs backend v1 exactos y sólo se cierra cuando revisión y creación provienen de evaluación autoritativa vigente con fingerprint obligatorio y disposición explícita.

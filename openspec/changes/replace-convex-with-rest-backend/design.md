# Diseño — REST como única frontera de datos

## Decisión y estado

Migrar los tres adapters existentes a REST, conservar la composición feature-first y bloquear explícitamente los recorridos que el contrato público no permite representar. No reproducir Convex mediante DTOs compatibles, evaluación local ni un runtime dual. Este diseño habilita planificación de tareas, **no apply**: quedan gates de contrato, aceptación del alcance visible y entrega.

- `skill_resolution: paths-injected` para las tres habilidades solicitadas. La habilidad ejecutora SDD no fue inyectada; un intento degradado en la ruta convencional `gentle-pi/skills/sdd-design/SKILL.md` no encontró archivo. Se sigue el contrato de fase del executor, sin descubrir registros adicionales.
- Backend de artefactos: OpenSpec. Único archivo modificado en esta fase: este documento.
- Evidencia: [proposal.md](proposal.md), los cuatro [delta specs](specs/), [api-contract-evidence.md](api-contract-evidence.md), exploración y lectura estática frontend. La propuesta/specs actuales prevalecen sobre los bloqueos históricos de exploración; design sí puede avanzar.
- `.codegraph/` existe; no hay herramienta CodeGraph ni shell para resolver raíz con Git o consultar CLI. Se usó lectura/búsqueda frontend degradada desde el workspace indicado. No se consultó el backend, ni se ejecutaron pruebas o peticiones HTTP.
- Enmienda G1: el contrato público actualizado y las lecturas runtime registradas por el parent confirman `classCode` para Familias y `familyCode` para Tipos. Esta sesión no repitió esas lecturas. Los delta specs actualizados sustituyen la caracterización histórica de filtro ausente en propuesta/exploración; G2 y G3 permanecen pendientes.
- Alcance explícito: `src/features/catalog-hierarchy`, `src/features/resources-master` y límites transversales existentes; no `packages/coding-agent`, backend, producción, proveedores ni recovery.

## 1. Arquitectura mínima y flujo de datos

```text
Screen / Surface → hook o controlador feature-local → API feature-local
                                                       ↓
                                  petición HTTP en adapter aprobado
                                                       ↓
                       /v1/* del mismo origen → proxy Vite → localhost:8090
                                                       ↓
                         HTTP → unknown → validación → mapper explícito
                                                       ↓
                           página/recurso válido o fallo discriminado
                                                       ↓
                         estado remoto → UI / foco de propietario actual
```

Mantener factories inyectables `createCatalogHierarchyRestApi` y `createResourcesMasterRestApi` en sus `*.api.ts`. La propuesta inicial de `createCatalogTypeAttributesRestApi` sobre el adapter legacy queda sustituida, para lectura directa, por `createCatalogTypeAttributesReadApi` en el archivo separado descrito en sección 11. Sustituir el seam `invoke(nombreRPC, args)` por inyección de una función compatible con `fetch`, junto con configuración local de actor. Las pantallas sólo construyen la API; no conocen URLs, headers, schemas ni detalles HTTP. Los tests inyectan respuestas HTTP documentadas; no hay dobles en runtime.

La lista de archivos autorizados para realizar HTTP es cerrada (la sección 12 añade exclusivamente el adapter efectivo de Unidad 7):

1. `src/features/catalog-hierarchy/catalogHierarchy.api.ts`.
2. `src/features/catalog-hierarchy/catalogTypeAttributesRead.api.ts` para la lectura directa incorporada en la enmienda de sección 11; sustituye el destino inicialmente propuesto `catalogTypeAttributes.api.ts`, cuya API efectiva legacy no se reutiliza. No autorizar ambos como rutas alternativas.
3. `src/features/resources-master/resourcesMaster.api.ts`.
4. `src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.api.ts`, sólo para el endpoint efectivo público de Unidad 7; no delega su composición al adapter directo de Unidad 6.

No crear cliente global, repositorio, gateway, fachada, bus, store ni generador de formularios por descriptor. Conservar un pequeño helper privado de petición en cada adapter; la duplicación acotada evita un punto HTTP transversal; la cuarta entrada feature-local efectiva se justifica por el contrato independiente de sección 12. Los schemas puros de catálogo reutilizados pueden vivir en `src/shared/catalog/catalogRest.contract.ts`, exclusivamente para el contrato público que consumen ambas features, sin red, React ni reglas de negocio. Los schemas propios de recursos permanecen en `resourcesMaster.api.ts`. Un tipo compartido puro de fallo en `src/shared/api/restFailure.ts` sólo se justifica por sus tres consumidores; no es un cliente HTTP.

Conservar Query únicamente donde ya fue aprobado. `AppProviders.tsx` mantiene un `QueryClient` lazy por montaje. La lista pasa de `useInfiniteQuery` a `useQuery`; no se extiende Query al catálogo. Selección, debounce, foco, borrador y navegación permanecen en sus propietarios actuales. Los hooks de evaluación/valores permitidos sin contrato se desconectan y retiran con sus consumidores, en vez de recibir respuestas falsas.

## 2. Decisiones ADR y alternativas

| ADR | Decisión | Alternativa descartada / coste aceptado |
| --- | --- | --- |
| 01 — Frontera | Adapters feature-locales, whitelist HTTP exacta y contratos puros compartidos sólo por reutilización real | Cliente REST global o SDK genérico: abstracción innecesaria; se acepta duplicación pequeña del transporte. |
| 02 — Validación | Zod 4 ya instalado para respuestas y payloads; ampliar whitelist sólo a adapters y módulo contractual puro | Parsers permisivos o casting a DTO: filtran datos inválidos. Añadir Zod indiscriminadamente a UI contradice las guardas. |
| 03 — Páginas | Ventanas offset/limit, sin acumulación, cursores ni dedupe | Emular `continueCursor` conservaría una garantía inexistente; se acepta reemplazar «Cargar más…». |
| 04 — Capacidades | Bloqueos feature-locales explícitos, no detección por ensayo de endpoints | Fallback o algoritmos de efectividad/evaluación locales trasladarían autoridad al frontend. |
| 05 — Actor | Configuración local explícita y doble protección UI/adapter | Actor fijo o derivado de usuario/ownership inventaría atribución. No equivale a autenticación. |
| 06 — Entrega | Slices internos verificables, activación final exclusivamente REST | Publicar una mezcla Convex/REST o feature flag de fallback incumpliría el estado final requerido. |
| 07 — UI | Reutilizar chrome, controles, rail y teclado; cambiar sólo campos/páginas/bloqueos necesarios | Rediseño o formulario REST alternativo para sortear el Creador ampliaría alcance y ocultaría la brecha. |

## 3. Contratos y validación

### Lecturas

- `CatalogRecord`: `kind`, `id: string`, `revision: string`, `active: boolean`, mapa `values` tipado y `rules` conforme al esquema público. `CatalogPage`: `records`, `hasPrevious`, `hasNext`.
- `Resource`: `id`, `identityV1`, `revision`, `naturalUnit` como strings; `scope` con los tres códigos; `active`; `attributes` con `code` y `CatalogValue`. `ResourcePage`: `resources` y ambos flags.
- No convertir revisión a número, hacer trim/coerción/default en respuestas ni sustituir campos ausentes. La normalización actual del texto de búsqueda es una decisión de entrada de UI, no un parser de respuesta.
- Mappers por kind extraen sólo campos documentados. `active` no significa `effective`; `identityV1` no es un nombre generado; códigos de scope no son IDs de catálogo. Mantener referencias tipadas, sin reconstruir campos planos Convex.
- Validar la página completa antes de entregarla: un elemento inválido falla la página, sin lista parcial autoritativa. Campos adicionales no consumidos no adquieren semántica; proyectar exclusivamente campos documentados.
- El OpenAPI público completo ya confirma todas las variantes `CatalogValue`, la referencia estricta y `ApplicabilityRule`; implementar esos schemas exactamente, sin inventar discriminante, `targetId`, coerciones ni campos adicionales. `INTEGER`/`DECIMAL`/`QUANTITY` conservan sus strings y patrones públicos; `NOT_APPLICABLE` no lleva valor. Esta evidencia resuelve sólo G7 de wire schemas, no las semánticas pendientes G2/G3/G4/G5/G6/G8. G1 se resuelve separadamente mediante los filtros públicos y evidencia runtime actualizados.

### Operaciones y entrada

| Operación | Integración prevista | Condición para habilitar |
| --- | --- | --- |
| Lista catálogo | `GET /v1/catalog/{kind}` con `scope`, `text`, `limit`, `offset`; FAMILIA añade sólo `classCode`, TIPO añade sólo `familyCode` como filtro jerárquico | Padre seleccionado validado y coincidencia de todas las referencias de la página; CLASE y kinds no relacionados omiten esos filtros. |
| Crear Clase | Create genérico con actor y valores `code`, `name`, `plural`, `slug` | Ruta, status y tipos exactos públicos disponibles; cuatro entradas explícitas, sin autogeneración. |
| Crear Familia/Tipo | Referencias `class`; para Tipo también `family`, más `code`, `name` | Actor, padre validado, payload y feedback contextual respaldados; G1 ya no bloquea estas CTAs. Mantener los gates independientes de la operación, sin exigir efectividad inventada. |
| Atributos/opciones | Kinds `CARACTERISTICA`, `CONJUNTO_OPCIONES`, `OPCION`, `RELACION_OPCIONES` | Auditoría por método actual; no confundir opción CRUD con valor permitido. |
| Aplicabilidad/presentación | `APLICABILIDAD`, `PRESENTACION` | Referencias y campos exigidos completos; `APLICABILIDAD` exige `rules: []` aun sin condición. No resolver reglas. |
| Unidades/políticas | `UNIDAD`, `POLITICA_UNIDAD` | Mostrar datos validados no demuestra elegibilidad ni equivalencia con unidad natural. El Creador no consulta políticas. |
| Lista/búsqueda recursos | `GET /v1/resources`; `scope`, `text`, `classCode`, `familyCode`, `typeCode`, `limit`, `offset` | Códigos reales del dato validado, nunca IDs renombrados. |
| Detalle recurso | `GET /v1/resources/{classCode}/{identityV1}` | La fila aporta ambos valores; codificar segmentos. No inventar GET por `id`. |
| Descripción | Respuesta `{ description: string }` de ruta pública `/describe` | Confirmar ruta completa y parámetros antes de construir URL; no inferir sufijo. |
| Crear recurso | `POST /v1/resources`: actor, scope, naturalUnit, attributes; 201 Resource | Entrada íntegramente respaldada y recorrido aprobado; no habilitado como atajo del Creador bloqueado. |
| Actualizar recurso | `PUT /v1/resources/{id}`: cuerpo equivalente y `expectedRevision` | Revisión string obtenida del recurso vigente y todos los campos respaldados. |
| Lifecycle recurso | POST deactivate/reactivate con actor y expectedRevision; 200 | Usar rutas completas documentadas, no inferirlas del nombre de la operación. |

No enviar descripción legacy de Clase si no consta en descriptor. `NuevaClaseSurface.tsx` debe explicar su retirada y pedir plural/slug con `Field` existente; el impacto visual y altura del diálogo requieren revisión antes de apply. Familia→Clase y Tipo→Familia siguen inmutables; este cambio no habilita edición/reclasificación nueva, E ni Del.

### Configuración local

Proponer `VITE_REST_ACTOR` como nueva entrada frontend no secreta, con override explícito de factory para pruebas. Es válido para configuración local sólo si es string no vacío ni compuesto exclusivamente por whitespace; rechazar en vez de normalizar. No inventar regex/roles ni demostrar validez de negocio: el backend puede rechazarlo. Configuración ausente o inválida produce `configuration` antes de `fetch`; comprobar nuevamente al confirmar, aunque el botón esté deshabilitado. No enviar actor en lecturas, no guardarlo en storage ni registrarlo en logs.

`vite.config.ts` agrega `server.proxy['/v1']` hacia `http://localhost:8090`, sin rewrite: las rutas públicas conservan su prefijo. No proxy de producción ni cambios CORS/backend. Tipar la variable en la declaración Vite existente o un `src/vite-env.d.ts` si hace falta; documentar sólo ejemplo no sensible en la fase autorizada. Esta fase no lee archivos de entorno. Fuera de desarrollo no se presume actor de prueba ni integración operativa: producción necesita decisión independiente.

## 4. Paginación, cache y concurrencia

### Carga dependiente por código (G1 resuelto)

El controlador feature-local conserva la selección validada y obtiene el código de su `values.code` (`CODE.value`), nunca del ID ni del texto visible. Los adapters de Catálogo y del contexto de Recursos implementan el mismo contrato público sin introducir otra frontera HTTP:

| Nivel | Petición jerárquica | Validación contextual antes de React |
| --- | --- | --- |
| Clase | `GET /v1/catalog/CLASE` sin `classCode` ni `familyCode` | Record y descriptor CLASE válidos. |
| Familia | `GET /v1/catalog/FAMILIA?classCode=<código de Clase>` | Cada `values.class` es REFERENCE válida a CLASE y `reference.code` coincide exactamente con el código solicitado. |
| Tipo | `GET /v1/catalog/TIPO?familyCode=<código de Familia>` | Cada `values.family` es REFERENCE válida a FAMILIA y `reference.code` coincide exactamente con el código solicitado; validar también la forma documentada de su referencia `class`. |

Agregar `scope`, `text`, `limit` y `offset` según la ventana; construir query con codificación de valores. FAMILIA no envía `familyCode`; TIPO usa únicamente `familyCode` como filtro jerárquico de este recorrido, aunque la API admita `classCode` para otros usos. No enviar filtros a kinds donde serían ignorados, ni extrapolar esta capacidad a unidades/atributos.

Validar **todos** los records contra el código capturado en la petición, no contra una selección mutable al resolverla. Referencia ausente, mal tipada o código discordante invalida la página completa como `invalid-response`: no filtrar los records discrepantes, corregir referencias, mezclar resultados ni reutilizar una página previa para aparentar éxito. El error permite reintento explícito de esa ventana; no es una nueva brecha G1.

Sin padre válido, no emitir petición dependiente: mostrar espera de selección, no «Contrato pendiente» por filtro ausente. Al cambiar Clase, limpiar selección y datos de Familia/Tipo y poner ambos offsets en cero atómicamente; cargar sólo Familias del nuevo código, sin solicitar Tipos hasta seleccionar una Familia válida. Al cambiar Familia, limpiar Tipo y su ventana, reiniciar su offset y cargar Tipos del nuevo código. Invalidar igualmente el contexto descendiente del Creador sin evaluar reglas locales.

La identidad de cada carga incluye kind, código de padre efectivamente enviado, scope, texto, limit y offset. Mantener generación/contexto para descartar respuestas antiguas incluso si se vuelve al mismo código; cancelar no basta. Un cambio de padre nunca reutiliza datos, errores ni offset del anterior. Aplicar este flujo a Catálogo, `useResourcesHierarchy` y loaders contextuales del Creador; sus etapas posteriores siguen sujetas a G4/G5.

### Ventanas y estado remoto

La lista de recursos conserva límite 20 y debounce local 250 ms. Cada identidad incluye texto normalizado, scope y **todos** los códigos realmente enviados, limit y offset; nunca API/callbacks/objetos UI. Cambio de criterio reinicia offset a cero en la misma transición, elimina selección inválida y descarta respuesta anterior. No enviar brevemente filtro nuevo con offset antiguo.

Avanzar solicita `offset + limit`; retroceder `max(0, offset - limit)`, únicamente si el flag correspondiente lo permite y no hay petición pendiente. Cada ventana reemplaza la anterior, sin flatten, dedupe ni «Cargar más…». `hasNext=false` no demuestra orden estable ni catálogo completo. Para recursos limit es 1..50 y offset >=0; el resumen del catálogo es ambiguo sobre qué parámetro tiene máximo 50: obtener rango público preciso antes de paginar más allá, sin copiar un máximo al otro parámetro.

Estados locales: carga inicial, listo, vacío confirmado de esa ventana, navegando, error inicial, error de navegación y bloqueo contractual. No usar datos de otra identidad como placeholder. En error de navegación puede conservarse la ventana anterior identificada como tal, sin presentarla como respuesta del offset fallido; reintento explícito apunta al offset solicitado. Query usa `retry: false`, sin refetch automático por foco/reconexión/montaje; evita aumentar llamadas o perder el error HTTP original. Requests simultáneos del mismo comando se bloquean.

Pasar `AbortSignal` a fetch cuando exista y comprobar identidad/generación antes de aplicar datos: cancelar no sustituye la protección stale. En catálogo sustituir el consumo del controlador cursor `parentGatedListController` por estado offset feature-local; no convertir offsets en su cursor genérico. Retirar sólo usos legacy que queden sin consumidores; no reescribir otros controladores compartidos por conveniencia.

Tras 201 y DTO válido, `onCreated → refetchActive()` solicita sólo la página/identidad activa, sin inserción optimista, invalidación amplia ni reseteo arbitrario. Si cambió la identidad durante la creación, no reinyectar datos del contexto anterior. Un 409 no actualiza revision automáticamente ni reenvía la mutación: ofrecer releer y revisar. Un resultado stale no cierra un diálogo nuevo ni mueve foco de otra sesión.

**Orden no documentado:** se pueden diseñar ventanas independientes con advertencia de alcance, pero no declarar continuidad exhaustiva. Recorridos cuya selección exige catálogo completo o navegación sin omisiones permanecen bloqueados. La aceptación humana de una UX reducida no crea garantías de orden.

## 5. Modelo de error

Tipo local discriminado: `configuration | contract-gap | http | network | invalid-response`; `http` conserva status y `error: string` sólo si se valida el envelope. El tipo es del frontend, no un nuevo error de negocio REST. No propagar body crudo ni schemas internos a React; mostrar copy seguro y preservar detalle contractual sólo como texto, nunca HTML.

| Fallo | Resultado observable y recuperación |
| --- | --- |
| Actor ausente/inválido | Explicación de configuración local, cero HTTP mutante; corregir configuración, no retry de red. |
| Brecha contractual | Región accesible persistente con causa e impacto; volver/cerrar disponibles; no request exploratoria ni retry que la oculte. |
| 400 | Petición rechazada; no inventar error por campo. Permitir revisar entrada. |
| 404 | No encontrado explícito en la operación; no convertir en lista vacía/null silencioso. |
| 409 | Conflicto sin confirmar éxito; conservar borrador y requerir revisión tras releer. |
| 422 | Rechazo informado; no derivar `INVALID`, `INCOMPLETE` ni reglas locales. |
| 500 / 503 | Fallo servidor/servicio no disponible, recuperación manual; ninguna conmutación de backend. |
| Red en mutación | Resultado no confirmado, no afirmar que no se creó; no reenvío automático. Reconciliar mediante lectura disponible antes de repetir. |
| Referencia de padre discordante | Rechazar página completa como `invalid-response`, sin mostrar ni rescatar records; reintento manual de la ventana contextual. |
| JSON/envelope/DTO inválido | Fallo de contrato; una respuesta 201 inválida no confirma creación en UI ni autoriza repetir automáticamente. |
| HTTP inesperado | Fallo HTTP explícito; no inferir permiso/autenticación o éxito. |

Abort por desmontaje/cambio de contexto se descarta sin anunciar error de la nueva vista. No implementar idempotencia, backoff ni resolución de conflictos sin contrato.

## 6. Brechas → recorridos bloqueados y decisiones humanas

Esta tabla es el registro inicial a reportar al humano. Las brechas son ausencia de evidencia pública suficiente, no afirmación de que el backend carezca internamente de la capacidad. No se inspeccionará para resolverlas.

| ID | Evidencia / falta | Ruta de usuario afectada y estado | Qué permite reanudar |
| --- | --- | --- | --- |
| G1 | **Resuelto:** `classCode`/`familyCode` documentados y lecturas públicas verificadas por el parent | Catálogo y selectores contextuales del Maestro/Creador cargan Familias por Clase y Tipos por Familia; validan referencias y reinician descendientes/offsets. Sin bloqueo UI/CTA por ausencia de filtro. | No requiere cambio backend para estas lecturas. Mantener actor/padre/payload para CTAs y gates G2/G3/G4/G5/G6/G8 independientes. |
| G2 | Orden estable no documentado | Continuación exhaustiva, selección sobre catálogo completo: bloqueo. Ventanas independientes sólo como alcance reducido aprobado, sin garantías. | Contrato público de orden/consistencia para equivalencia; el frontend no puede decidir sus garantías. |
| G3 | **Cerrado sólo para lectura efectiva de atributos por Core**, sección 12 | Pantalla consume effectiveMode/source/rules/posición devueltos; no rederiva herencia ni condicionalidad. Razones/agregados/violaciones/clasificación legacy no documentados siguen no disponibles; active no es effective. | Otras capacidades requieren contrato propio; no extender este cierre al Creador o mutaciones. |
| G4 | **Reclasificado por sección 13:** options baseline y evaluación por valores documentadas; fingerprint/disposiciones de creación aún ausentes | GET alimenta Catálogo; POST separado se integra sólo al retomar Creador. Sin evaluación de reglas local ni creación habilitada por éxito de evaluación. | Confirmar montaje público de /evaluate al cablearlo y retomar flujo explícitamente; fingerprint/incidencias y mutaciones conservan gates propios. |
| G5 | No vínculo probado entre `UNIDAD` y `naturalUnit` string | Selector de unidad natural y confirmación no habilitados por inferir ID, código o símbolo. No política como sustituto. | Especificación pública de representación y uso; la persona solicita aclaración/capacidad backend. |
| G6 | **Lecturas directa y efectiva respaldadas, contratos separados**; sin equivalencia de los 14 métodos legacy | Unidad 6 conserva lectura base; Unidad 7 usa exclusivamente endpoint efectivo (sección 12). Asignar/editar/gestionar opciones y lifecycle siguen deshabilitados; options sólo se presentan desde GET/POST públicos conforme a sección 13. | Enriquecimiento por código sólo administrativo; mutaciones mantienen gates propios. La evaluación POST está documentada pero su wiring queda para reanudación del Creador. |
| G7 | **Resuelto para schemas wire base:** OpenAPI público completo confirma `CatalogRecord`, `CatalogPage`, `Error`, `CatalogValue`, referencias y `ApplicabilityRule` | Los mappers base ya no están bloqueados por ausencia de variantes wire; siguen bloqueados por las semánticas específicas registradas en G2/G3/G4/G5/G6/G8; G1 también está resuelto. | No requiere investigación adicional de schema base; toda decisión de semántica sigue en su gate propio. |
| G8 | Recurso no aporta nombre/ownership/diagnóstico legacy | Columnas/detalle muestran campos REST verdaderos; descripción sólo tras ruta confirmada; no usar identity como nombre generado ni inventar titularidad | Aceptación visible de alcance reducido y/o contrato actualizado para recuperar esos datos. |

Distinguir G2/G4/G5 de un fallo transitorio: «Reintentar» no resuelve una capacidad ausente. G1 ya permite las lecturas contextuales de Clase→Familia→Tipo y sus selecciones en Catálogo, Maestro y Creador; una discrepancia de referencia es error de respuesta, no motivo para restaurar el bloqueo antiguo. No deshabilitar toda la aplicación ni las CTAs contextuales por G1; sólo aplicar los gates restantes pertinentes. El flujo Creador actual no queda habilitado sólo porque exista POST básico. Ninguna reducción silenciosa: presentar esta matriz al humano antes de apply; recuperar equivalencia requiere contrato público suficiente además de su decisión.

## 7. UI, accesibilidad y conflictos concurrentes

Preservar `PageHeader`, `WorkCard`, `Dialog`, `Button`, `Field`, `HierarchyNavigator`, rail y barra de comandos. Reutilizar `ResourceCreationContractPending.tsx` cambiando su prop ligada a ownership por razón contractual explícita; conservar encabezado enfocável y estado anunciado. No promoverlo a shared por similitud visual: catálogo puede comunicar el bloqueo mediante sus regiones existentes.

WCAG 2.2 AA: bloqueo visible por texto, nombre accesible, ayuda asociada a acción deshabilitada, foco manejable y retorno al opener al cerrar. Las acciones no disponibles no capturan N/Enter como si fueran válidas; Escape/volver conservan comportamiento. No añadir listener global ni capturar Tab/Ctrl+N desde adapter. Mantener tokens GARFEX Light; sin CSS nuevo arbitrario, cambio de marca, responsive nuevo ni edición de OpenPencil/recovery.

| Fuente concurrente | Conflicto real | Resolución de planificación, sin editarla |
| --- | --- | --- |
| `catalog-hierarchy-base` | Diseño/guardas Convex, cursores, campos/feedback antiguos; cambios sobre screen, tipos, controller y NuevaClase | Este delta propone transporte/semántica REST; conservar jerarquía inmutable y evidencia visual. Parent debe coordinar ownership de archivos y reconciliar specs antes de sync/archive, no marcar tareas ajenas como hechas. |
| `keyboard-first-resource-creation` | Selection-only, evaluación v1/fingerprint y controladores acumulativos; comparte shell, model, hooks y tests | Conservar shell/teclado; REST no hereda el contrato Convex aceptado allí. Retirar integración incompatible sólo en este alcance aprobado, sin actualizar sus artefactos ni declarar completada esa change. |
| `openspec/config.yaml` histórico | Texto prohíbe Query y limita alcance a jerarquía, pero baseline adopt-query-zod y código ya autorizan usos acotados | No ampliar Query; sustituir sólo usos actuales necesarios. Parent debe reconciliar autoridad canónica en fase posterior, no modificar config aquí. |
| Guardas Query/Zod | Hoy Zod sólo se permite en resourcesMaster.api.ts y se exigen bindings exactos de InfiniteQuery | Cambio deliberado con pruebas negativas antes de ampliar whitelist exacta; jamás permitir Zod/HTTP para todo src. |

Antes de cada slice, releer bytes actuales de archivos compartidos con changes activas y detenerse ante ediciones concurrentes incompatibles. Los artefactos históricos pueden mencionar Convex; la prohibición final se aplica a dependencias/configuración/consumo runtime y pruebas vigentes, no a borrar evidencia histórica.

## 8. Superficies concretas y plan de pruebas

Los nombres nuevos son propuestas de tasks; no se crean en design.

| Slice | Código probable | Pruebas a crear o adaptar |
| --- | --- | --- |
| A — Frontera/config | Tres `*.api.ts`; `src/shared/catalog/catalogRest.contract.ts`, `src/shared/api/restFailure.ts`; `vite.config.ts`, declaración Vite | Nuevos `tests/unit/catalogRestContract.test.ts`, `restActorConfiguration.test.ts`, `restProxyConfiguration.test.ts`; nuevos `tests/architecture/restTransportBoundaries.test.ts`; adaptar `queryZodBoundaries.test.ts`, `catalogHierarchyBoundaries.test.ts`, `runtimeFixtureIsolation.test.ts`. |
| B — Jerarquía REST por código | `catalogHierarchy.types.ts`, `catalogHierarchyState.ts`, `useCatalogList.ts`, `CatalogHierarchyScreen.tsx`, `NuevaClaseSurface.tsx`; consumo de `HierarchyNavigator.tsx` | Adaptar `tests/unit/catalogHierarchyConnectedTransport.test.ts`, `catalogHierarchyCreation.test.tsx`; nuevos tests de filtros por código, omisión en kinds no relacionados, rechazo de página por referencia discordante, reset de descendientes/offset y respuestas stale; regresión de CTAs, teclado y campos requeridos. |
| C — Atributos directos, revisado en sección 11 | Nuevos `catalogTypeAttributesRead.api.ts`, `catalogTypeAttributesRead.types.ts`, `useCatalogTypeAttributesRead.ts`, `CatalogTypeAttributesRead.tsx`; wiring en `CatalogHierarchyScreen.tsx`; desconectar acciones legacy sin migrar sus formularios | Contratos directos, referencias, ventanas/stale y UI sólo lectura; enriquecimiento posterior independiente. Desglose y techos <=400 líneas en sección 11. |
| D — Lecturas recursos | `resourcesMaster.api.ts`, `.types.ts`, `useResourcesMasterListQuery.ts`, `ResourcesMasterScreen.tsx`, `useResourcesHierarchy.ts` con cargas dependientes por código y reset de contexto; retirar `useResourcesMasterList.ts` sólo si sin consumidores | Adaptar `resourcesMasterApi.test.ts`, `useResourcesMasterListQuery.test.tsx`, `useResourcesMasterList.test.ts`, `resourcesMasterScreen.test.tsx`, `resourcesMasterScreenRefetch.test.tsx`, `useResourcesHierarchy.test.ts`. |
| E — Creador/mutaciones | `CrearRecursoSurface.tsx`, shell/context/attributes/review/pending; `useResourceCreationFlow.ts`, `resourceCreation.loaders.ts`, `resourceCreation.dependentLoader.ts`, model y activeUnits: migrar contexto Clase/Familia/Tipo por código, conservar bloqueos posteriores G4/G5; retirar evaluación/allowed-values/leases exclusivamente legacy y usos relacionados | Adaptar `useResourceCreationFlow.*.test.tsx`, `useResourceCreationCreate.test.tsx`, `resourceCreationReview.test.tsx`, `resourceCreation.activeUnits.test.ts`, `resourceCreation.loaders.test.ts`; sustituir tests de evaluación Convex por bloqueos sin llamadas. |
| F — Cierre | `package.json`, `pnpm-lock.yaml`, wiring/env/docs vigentes autorizados; retirar Convex y RPC de todos los consumidores/pruebas | Sustituir `tests/integration/catalogHierarchyConnectedTransport.test.ts`, `activeUnitResourceCreation.connected.test.ts`; revisar `vitest.connected.config.ts` y script conectado; guardas cero consumo Convex, fixtures aislados y teclado. |

TDD posterior obligatorio: **RED → cambio mínimo GREEN → REFACTOR**, `pnpm test` en cada slice; conservar evidencia de fallo inicial, no escribir implementación primero. Casos transversales:

- URLs, query whitelist, segmentos codificados, status exacto, bodies documentados y validación de requests/responses; ID/revision string, rechazo de número y envelope inválido.
- Actor ausente, vacío, whitespace e inválido: cero requests en cada create/update/lifecycle, incluso invocación directa del adapter.
- Cada error HTTP, red, JSON inválido y 201 inválido sin falso éxito ni refetch; dobles envíos y respuestas de contexto viejo.
- Offset/reset/debounce con timers, flags servidor, sin acumulación/dedupe, retry manual y cache aislada por montaje.
- G1 resuelto: requests FAMILIA con sólo classCode y TIPO con sólo familyCode; ningún filtro ignorado en CLASE/UNIDAD; cero request sin padre; un único record discordante rechaza toda la página sin rescatar datos previos. Cambio de Clase resetea Familia/Tipo, cambio de Familia resetea Tipo; respuestas antiguas no repueblan descendientes.
- Brechas pendientes G2/G3/G4/G5/G6/G8 visibles, sin petición no autorizada ni simulación; G7 cubierto por schemas wire y exclusión de políticas en unidad natural.
- Guardas AST contra fetch/globalThis.fetch/window.fetch, alias o transportes alternativos fuera de whitelist; imports dinámicos/reexports de clientes prohibidos; pruebas negativas sin permitir fixtures runtime/storage.
- RTL para foco, mensajes, vuelta/cierre; Playwright en `tests/e2e/resourcesMaster.workstation.spec.ts` y casos existentes de catálogo/creador, axe y regresión visual workstation. Dobles documentados exclusivamente en tests/stories aisladas del bundle.

Al cierre ejecutar y reportar `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm verify:runtime-bundle`, y suites stories/E2E aplicables. Prueba conectada futura: lectura pública desde navegador vía proxy, sin mutaciones de backend implícitas; tests mutantes usan dobles. No se ejecutó ninguno en esta fase.

## 9. Secuencia, presupuesto y rollout/rollback

Dependencias: A precede B/C/D; B implementa ya las lecturas dependientes por código sin esperar otro contrato G1. D adopta ese contrato de carga/validación en el contexto de Recursos; E puede migrar a continuación el contexto jerárquico del Creador sin esperar G4/G5, pero sus etapas de unidad/evaluación/creación requieren resolver sus gates propios. F depende de consumidores migrados **o bloqueados de forma aceptada**. Un slice bloqueado no impide diseñar/testear otro, pero tampoco se cierra declarando equivalencia ficticia.

Forecast cualitativo: alto riesgo de superar 400 líneas por tres adapters grandes, contratos, pantallas y retiro de pruebas. Tasks debe medir añadidas+eliminadas por unidad, incluyendo pruebas y artefactos revisables, y separar churn generado del trabajo autoral sin ocultarlo. A–F son fronteras de revisión, no promesas de <=400 líneas ni una estrategia de cadena elegida. Bajo `ask-on-risk`, el parent debe pedir decisión de entrega antes de apply; `size:exception` requiere consentimiento explícito.

Si el humano elige cadena, subdividir A por contratos/adapter, B por lectura raíz/lecturas dependientes validadas/formulario y D por DTO/query/screen, manteniendo tests junto a cada cambio. Definir entonces dependencias/base de PRs; no crear ramas/PRs aquí. La cadena debe ser de integración no publicable parcialmente o mantener consumidores retirados/bloqueados: ningún corte publicado activa ambos backends. No usar bandera seleccionable de proveedor.

Durante preparación pueden permanecer archivos legacy inactivos en el árbol hasta F, pero no hay fallback ni doble escritura. Un cambio de wiring debe migrar o bloquear todos los consumidores accesibles antes de publicar. La entrega final elimina paquete Convex, entradas pertinentes del lockfile regenerado, imports/clientes/RPC, variables/config vigente, tests conectados legacy y excepciones que lo permitían. Mantener guards que prohíben Convex no es conservar una dependencia de Convex.

Rollout local: aceptar matriz de brechas → confirmar extractos públicos necesarios → aprobar alcance/entrega → TDD de slices → corte REST-only → checks estáticos/suite → smoke de lectura real en navegador vía proxy → revisión de UI y bloqueos. No declarar conectividad por la sola configuración de proxy, ni configurar despliegue productivo.

Rollback previo a publicación: revertir la unidad frontend con sus tests/wiring, sin entregar el estado mixto. Posterior: revertir la entrega frontend completa o retirar esa entrega de servicio; no introducir fallback dentro del bundle. Una versión previa Convex sólo puede restaurarse como versión completa mediante decisión explícita, nunca como compatibilidad automática. No revertir datos backend ni afirmar que revertir frontend deshace escrituras realizadas.

## 10. Salida de diseño y gates para tasks/apply

Diseño listo para tasks con riesgos explícitos. La enmienda de sección 11 concreta C sin reescribir el historial ni habilitar mutaciones de atributos. Antes de apply el parent debe presentar al humano el alcance reducido real y sus etapas, pedir estrategia por riesgo >400 líneas, y resolver los extractos/contratos necesarios para los flujos que se pretenda habilitar. G4/G5 y la garantía de G2 no pueden resolverse mediante una decisión técnica frontend; el humano solicita contrato backend o acepta que sigan bloqueados. No se seleccionó override de modelo ni se lanzó ningún subagente.

## 11. Enmienda — Atributos directos por etapas, sin API efectiva legacy

> Historial de planificación: la sección 12 sustituye el recorrido de pantalla C2/Unidad 7 y sus dependencias. C1/Unidad 6 permanece lower-level; C3 sólo es enriquecimiento administrativo opcional. Las prohibiciones históricas de lectura efectiva aquí no aplican al nuevo endpoint público de Core, pero sí a reconstruirla localmente o reutilizar la API Convex legacy.

### Autoridad y alcance de la actualización

La actualización posterior de evidencia/exploración y los requisitos añadidos de `specs/catalog-hierarchy/spec.md` permiten leer aplicabilidades directas. El parent registró cinco records para `APLICABILIDAD?typeCode=CABLE`; esto no demuestra herencia, efectividad ni orden estable. Esta enmienda refina C y G6, preservando las decisiones anteriores y el historial G1/G7. En caso de contradicción con el inventario inicial de adapters/métodos o agrupación de aplicabilidad/presentación, esta sección define el corte vigente. No modifica tasks, source, tests ni backend; no se repitieron lecturas HTTP.

**ADR 08 — Separar lectura directa de semántica efectiva.** Crear un adapter REST read-only feature-local y DTO directo, en vez de adaptar `TypeAttributeAssignment` o implementar `listTypeAssignments` con defaults de `effective`. El coste es un seam nuevo explícito; evita compatibilidad ficticia y acoplamiento a los 14 métodos legacy. El adapter viejo se desconecta de esta vista y se retira cuando no tenga consumidores; nunca es fallback. La whitelist HTTP sustituye su entrada por el nuevo adapter de lectura, no por un permiso general para archivos `*.api.ts`.

```text
CatalogHierarchyScreen: contexto Clase/Familia/Tipo validado
  → useCatalogTypeAttributesRead: ventana y generación locales
  → CatalogTypeAttributesReadApi.listDirectApplicabilities
  → GET /v1/catalog/APLICABILIDAD?typeCode=…&offset=…&limit=…
  → CatalogPage unknown → schema wire + validación contextual completa
  → DirectApplicabilityPage → CatalogTypeAttributesRead (sólo lectura)
  → [etapa posterior opcional] enriquecimiento exacto de Característica
```

No extender Query al catálogo ni trasladar estado a shared/global. El nuevo `catalogTypeAttributesRead.api.ts` posee HTTP y validación, con fetch inyectable y schemas públicos puros ya autorizados. `catalogTypeAttributesRead.types.ts` sólo declara DTOs; `useCatalogTypeAttributesRead.ts` posee la ventana/estado local; la presentación no importa schemas, transporte ni API legacy.

### C1 — Contrato directo y referencias estrictas

Entrada `DirectApplicabilityRequest`: snapshot de `classCode`, `familyCode`, `typeCode`, `offset`, `limit`. Los dos primeros códigos sirven para validar ancestros; **sólo typeCode** se envía como filtro contextual. No agregar classCode, familyCode, optionSetCode ni parámetros de otros kinds. Sin los tres contextos válidos no enviar petición. Usar la ventana pública, inicialmente offset cero; conservar flags REST sin cursor sintético.

Salida `DirectApplicabilityPage`: `records: DirectApplicabilityRecord[]`, `hasPrevious`, `hasNext`. Cada record conserva `kind: 'APLICABILIDAD'`, `id`/`revision` string, `active`, referencias tipadas `class`, `family`, `characteristic`, opcionales `type`/`optionSet`, `mode`, `rules` y `identityParticipates` sólo si existe. No agregar `effective`, razones, definición resuelta, ownership ni estado evaluado; no convertir `active` en elegibilidad.

Validación indivisible antes de React:

- Envelope y cada record cumplen schemas públicos; kind exactamente APLICABILIDAD, modo descriptor-confirmado y rules validado sin ejecutarlo. Requerir rules incluso vacío; no rellenarlo por defecto.
- `class`, `family`, `characteristic` son valores REFERENCE estrictos: reference.kind exactamente CLASE, FAMILIA, CARACTERISTICA respectivamente; id string conforme al patrón público (incluido `"0"`) y code no vacío. Sin trim, coerción ni resolución por id.
- Comparar class/family.reference.code exactamente con los códigos del snapshot solicitado. Si existe type, validar REFERENCE a TIPO y coincidencia exacta de su código con typeCode. Su ausencia es válida según descriptor: no fabricar referencia ni clasificar el record como heredado.
- Si existe optionSet, validar REFERENCE a CONJUNTO_OPCIONES y su forma/código; conservarla como dato, sin cargar opciones. No validar referencias por igualdad entre ID y código.
- Un único record, kind, campo o referencia inválido/incoherente falla la página entera como `invalid-response`. No rescatar filas válidas, reparar referencias ni entregar datos parciales.

### C2 — Ventana directa, UI y comandos

Reutilizar la sección Atributos, chrome y patrones de Catálogo. Mostrar título/ayuda explícitos «Aplicabilidades directas del Tipo» y «Sólo lectura; no incluye evaluación ni herencia». Filas con código de característica como etiqueta inicial, modo y referencias/campos directos validados. `active` puede mostrarse como estado activo del record, nunca como efectivo. `rules` se conserva sin evaluación; no construir editor ni interpretación de condiciones. Vacío significa «Sin aplicabilidades directas en esta ventana», no ausencia total de atributos del Tipo.

No montar `AsignarAtributoSurface`, `EditarAtributoSurface` ni `GestionarOpcionesSurface` desde esta lectura. Asignar, editar, activar/desactivar, eliminar y gestionar opciones permanecen deshabilitados con motivo visible/accesible, incluso con actor configurado. No exponer métodos mutantes en el nuevo contrato ni reutilizar handlers/atajos legacy. Sólo selección contextual, navegación offset y recuperación son acciones disponibles; N/E/Del no envían comandos de atributos. Preservar los propietarios de teclado, foco visible y rutas restantes sin listeners globales nuevos.

Identidad local: códigos de Clase/Familia/Tipo, offset y limit, más generación de contexto. Cambiar Tipo o cualquier ancestro limpia filas, error, selección de fila y enriquecimientos; reinicia offset a cero **antes** de cargar el nuevo contexto. Sin Tipo, estado de espera sin request. Cambiar ventana reemplaza filas, no acumula/deduplica; avanzar/retroceder sólo por flags recibidos. No prometer exhaustividad, continuidad ni orden estable (G2).

Al iniciar navegación, retirar las filas de la ventana anterior de la vista directa; conservar sólo metadatos necesarios para reintentar la ventana pedida. Evita presentar una página previa como respuesta cuando falla validación. Estados: espera de Tipo, carga, listo, vacío de ventana, error. HTTP/red/parsing usan el modelo de sección 5; un fallo no es vacío ni bloquea otras columnas. Reintento manual del mismo snapshot/offset, sin retry automático; bloquear navegación duplicada mientras está pendiente.

Cancelar con AbortSignal al cambiar contexto/desmontar y verificar generación e identidad al resolver, también para secuencias A→B→A. Respuestas viejas no repueblan filas, cambian flags/error ni mueven foco. Actualizaciones de datos no roban foco; errores se anuncian en la región existente, y el control de reintento permanece accesible. Enriquecimientos posteriores tienen generación propia ligada a la ventana y referencia; nunca actualizan otra fila por posición.

### C3 — Enriquecimiento posterior y opcional, por código exacto

C1/C2 se entregan sin esperar definiciones. En una unidad posterior, el mismo adapter de lectura puede añadir `findCharacteristicDefinition` mediante `GET /v1/catalog/CARACTERISTICA?text=<reference.code>&offset=…&limit=…`, sin detail-by-ref ni filtros de otro kind. Validar cada página y descriptor de CARACTERISTICA. Mantener la referencia original intacta, incluido id `"0"`: las definiciones observadas tienen IDs 1–8 y no se identifica una definición por igualdad con ese id de referencia.

Aceptar enriquecimiento sólo con una única definición válida de kind CARACTERISTICA cuyo `values.code` sea CODE y `value` coincida exactamente con reference.code. No aceptar coincidencias parciales, por nombre/etiqueta, primer resultado ni otro kind. Usar sólo campos descriptor-confirmados de esa definición, sin convertirla en aplicabilidad efectiva ni completar campos ausentes.

La búsqueda es paginada: una coincidencia única en la primera página con hasNext=true no basta. Mantener candidatos pendientes hasta completar el conjunto de ventanas consultable; múltiples coincidencias exactas son ambiguas, no se deduplican para producir unicidad. Para acotar trabajo, diseñar como máximo dos ventanas de hasta 50 resultados por referencia, secuenciales y cancelables; es presupuesto frontend de enriquecimiento, no garantía del backend. Si el límite/rango público no permite completar o continúa hasNext, declarar definición no disponible, sin barrer la colección. Cualquier ajuste de este presupuesto se revisa con el slice, no se usa para afirmar exhaustividad.

G2 sigue abierto: terminar una búsqueda acotada sin ambigüedad permite enriquecimiento opcional del resultado observado, no certifica unicidad global ni estabilidad inter-página. Si el recorrido exige esa garantía, no enriquecer hasta contar con contrato público suficiente. No presentar el nombre como autoridad para identidad o acciones.

Ausencia, ambigüedad, presupuesto incompleto, error HTTP/red/schema o respuesta stale no invalidan la página directa: conservar reference.code como etiqueta y estado visible «Definición no disponible». El error de enriquecimiento tiene recuperación manual independiente; no reconsultar aplicabilidades, habilitar mutaciones ni inventar etiqueta. No guardar cache global o persistente; eliminar resultados auxiliares al cambiar contexto/ventana.

### Bases separadas y capacidades aún bloqueadas

`PRESENTACION?typeCode=…` y `OPCION?optionSetCode=…` están documentadas como lecturas, pero **no se solicitan desde C1/C2/C3**. Requieren bases separadas, validación propia de referencias/descriptor, estado offset independiente y decisión posterior de producto. No ordenar aplicabilidades mediante PRESENTACION ni convertir OPCION en allowed-values. Su existencia no desbloquea `RELACION_OPCIONES`, herencia, evaluación, effective/effectiveReasons, aggregateStatus, violations, razones ni creación evaluada. G3/G4 y la parte mutante/efectiva de G6 permanecen pendientes.

### Slices revisables <=400 líneas, pruebas y entrega

Estas unidades refinan C, no crean tasks ni autorizan cadena/apply. Cada techo incluye código, pruebas y documentación autorales añadidas+eliminadas; son presupuestos de planificación, no mediciones realizadas. Medir antes de apply y detenerse bajo ask-on-risk si se prevé superar el techo: subdividir con aprobación, nunca ocultar churn o entregar sin tests.

| Unidad | Superficie probable y contrato verificable | Techo autoral |
| --- | --- | --- |
| C1a | `catalogTypeAttributesRead.types.ts`, schemas/parser en `catalogTypeAttributesRead.api.ts`; tests nuevos `catalogTypeAttributesReadContract.test.ts` para referencias, opcionales, id0, modos y rechazo completo | 350 |
| C1b | Factory read-only/GET en ese adapter y whitelist exacta; `catalogTypeAttributesReadApi.test.ts` para URL typeCode/offset, error, cero métodos mutantes/legacy | 300 |
| C2a | `useCatalogTypeAttributesRead.ts`; `useCatalogTypeAttributesRead.test.tsx` para reset, flags, retry, doble navegación y stale A→B→A | 350 |
| C2b | `CatalogTypeAttributesRead.tsx` con controles compartidos; `catalogTypeAttributesRead.test.tsx` para filas directas, vacío/error y acciones deshabilitadas sin llamadas auxiliares | 350 |
| C2c | Wiring en `CatalogHierarchyScreen.tsx`, desconexión de superficies/handlers legacy y regresión focalizada de pantalla/teclado | 350 |
| C3a — posterior | Búsqueda textual y matching exacto en adapter read-only; `catalogCharacteristicDefinitionRead.test.ts` para id0, código parcial, duplicados, paginación/budget y fallos | 350 |
| C3b — posterior | Estado auxiliar/etiquetas en hook y vista directos; tests de fallback visible, aislamiento por ventana, stale y retry independiente | 300 |

Dependencias: A/B → C1a → C1b → C2a/C2b → C2c; C3a/C3b sólo después del corte directo aceptado. Bases de presentación/opciones y mutaciones no son dependencias de C2c. Cada unidad sigue RED→GREEN→REFACTOR con `pnpm test` después; incluir asserts negativos de no Convex, no effective API, no opciones/presentación/evaluación y no requests mutantes. No se crearon ni ejecutaron estas pruebas en esta enmienda.

Si se elige entrega encadenada, C1/C2 preparatorios no se publican como mezcla de backends; el wiring activa sólo la lectura REST directa y bloquea acciones legacy. Retirar consumidores legacy huérfanos en una unidad posterior medida <=400, dividiéndola si excede; no condicionar lectura directa a reimplementar sus mutaciones. Rollback de wiring revierte la unidad completa en integración, no añade fallback runtime. C3 puede retirarse dejando códigos directos y aviso de definición no disponible, sin alterar la página autoritativa. Se mantiene el gate de revisión humano, el corte final REST-only y las reglas de rollback generales.

## 12. Enmienda — Unidad 7 consume atributos efectivos de Core

> La sección 13 incorpora `options` obligatorio, distingue baseline GET de evaluación POST posterior y registra la partición seleccionada por mantenimiento tras medir 611 líneas. Prevalece sobre las restricciones históricas de opciones/evaluación y el forecast U7a de esta sección.

### Precedencia y ADR 09

La evidencia pública posterior y el requisito «Atributos efectivos de Tipo como composición de pantalla» sustituyen la propuesta de pantalla directa de sección 11. Conservar Unidad 6 (`catalogTypeAttributesRead.api.ts`, DTO y paginación directa) como capacidad lower-level/administrativa; **no usarla para componer, completar o sustituir la UI efectiva**, ni siquiera ante error. Su enriquecimiento textual por código/id0 queda fuera de Unidad 7. Se preserva el historial; G3/G6 cierran sólo para esta lectura efectiva, no para mutaciones, allowed-values, fingerprint o evaluación interactiva del Creador.

**Decisión:** un contrato REST efectivo independiente, no la API efectiva legacy Convex ni una combinación de APLICABILIDAD/CARACTERISTICA/PRESENTACION/OPCION. Core resuelve herencia, orden y condicionalidad. Coste aceptado: un adapter feature-local adicional y whitelist exacta; beneficio: la pantalla recibe una única respuesta autoritativa, sin lógica de composición backend en frontend.

```text
CatalogHierarchyScreen (snapshot classCode/familyCode/typeCode)
 → useCatalogTypeEffectiveAttributes
 → createCatalogTypeEffectiveAttributesApi / getEffectiveAttributes
 → GET /v1/types/{encodedTypeCode}/attributes/effective
        ?classCode={encodedClassCode}&familyCode={encodedFamilyCode}
 → unknown → schema público completo + typeCode contextual exacto
 → EffectiveAttributesResponse → CatalogTypeEffectiveAttributes
```

`catalogTypeEffectiveAttributes.api.ts` posee transporte inyectable y schemas Zod de esta respuesta; `catalogTypeEffectiveAttributes.types.ts` contiene tipos sin efectos. Reutilizar el schema público compartido de reglas/valores, no duplicarlo como parser permisivo. `useCatalogTypeEffectiveAttributes.ts` posee estado local; `CatalogTypeEffectiveAttributes.tsx` presenta el DTO validado. No ampliar Query ni shared state, ni crear otro HTTP fuera de la whitelist. La pantalla no importa el adapter directo, no invoca enriquecimiento de características ni API legacy para esta composición.

### URL e identidad de lectura

Construir la ruta con `encodeURIComponent(typeCode)` una sola vez por segmento. Codificar query con `URLSearchParams`, insertando **classCode primero y familyCode después**, para una URL determinista con escaping correcto (espacios, `&`, `/`, `?`, `%`, Unicode); nunca concatenar códigos crudos o codificar la URL completa. No enviar `characteristicCode`, typeCode duplicado en query, offset/limit ni filtros de catálogo. El parámetro genérico characteristicCode sólo pertenece a lecturas base que lo documenten, nunca sustituye esta petición.

Entrada: snapshot inmutable de los tres códigos validados; sin contexto completo, cero HTTP. Identidad local: los tres códigos originales más generación de petición, no URL parcialmente escapada, instancia de API ni callbacks. No requiere actor por ser lectura. Este endpoint **no es una CatalogPage**: no fabricar flags, cursor, paginación o acumulación. El orden de la lista efectiva pertenece a Core; G2 sigue sin resolver para las otras listas offset.

### Validación estricta e indivisible del DTO

Aplicar los schemas públicos completos `EffectiveAttributesResponse`, `EffectiveAttribute`, `CharacteristicDescriptor`, `EffectiveAttributeSource`, `ApplicabilityRule` y `CatalogValue`, incluidas sus reglas de propiedades adicionales. Validación sin defaults, trim, coerción, reparación ni inferencia de campos. Campos opcionales no equivalen a nullable: aceptar null sólo donde el schema público lo permita explícitamente; preservarlo como tal. Si falta ese detalle en un extracto, obtener el schema público exacto antes de implementar el campo, sin ampliar la unión por conveniencia.

| Superficie | Contrato de validación y presentación |
| --- | --- |
| Envelope | `typeCode` string exactamente igual al typeCode capturado al solicitar; `attributes` array requerido. Un array vacío válido confirma vacío. No aceptar envelope de catálogo. |
| `characteristic` | Objeto requerido; `code`, `name`, `valueType` strings no vacíos. `dimension` opcional según tipo/nulabilidad públicos. Conservar valores; no resolver por id ni buscar otra definición. No inventar enum más estrecho para valueType si el schema sólo exige string. |
| `effectiveMode` | Sólo `REQUIRED`, `OPTIONAL`, `CONDITIONAL`, `FORBIDDEN`, con comparación exacta. No convertir CONDITIONAL en REQUIRED/OPTIONAL ni evaluar rules. |
| `identityParticipates`, `notApplicable` | Booleanos requeridos; no aceptar strings/números ni inferirlos por modo. |
| `position`, `hasPosition` | position entero según schema público y hasPosition booleano requerido, sin coerción ni mínimo inventado. Validar position aunque hasPosition sea falso si el schema lo requiere; false no permite omitir un campo obligatorio. Conservar el valor wire pero no mostrarlo como posición cuando hasPosition=false. True permite mostrar únicamente la posición recibida. |
| `optionSetCode` | Campo opcional con tipo/nulabilidad exactos públicos; no inventar cadena vacía por ausencia. No dispara lecturas base: las opciones provienen del campo requerido options de esta misma respuesta. |
| `options` | Array requerido en **cada** EffectiveAttribute. Cada elemento es un objeto estricto exactamente `{ code: string, label: string }`, sin propiedades extra, coerción ni defaults. Ausencia, null, no-array, elemento/campo inválido o extra invalida toda la respuesta; `[]` es válido. Preservar valores y orden sin trim, sort ni dedupe. No imponer no-vacío si el schema público sólo exige string. |
| `source` | Objeto requerido: `level` exactamente `FAMILY` o `TYPE`, `code` string no vacío. No convertir source en string libre ni fabricar jerarquía/origen a partir de aplicabilidades base. |
| `rules` | Array requerido, con cada regla validada por el schema público compartido y cada valor anidado por la unión CatalogValue estricta. Preservar reglas y orden, sin ejecutarlas, normalizarlas ni eliminar las inactivas. |

El schema compartido de reglas conserva `attributeCode`, `equals`, `mode`, `identityParticipates`, `notApplicable` y `active`, y todos los dominios exactos declarados por el contrato público vigente. El enum de effectiveMode no debe imponerse automáticamente a otro campo `mode`: cada dominio usa su propio schema público. Las variantes CatalogValue conservan sus strings numéricos/patrones y referencias estrictas; un equals inválido invalida toda la respuesta.

Cualquier mismatch de typeCode, campo requerido ausente, null no admitido, string vacío exigido no vacío, fracción en position, literal de source/modo fuera de dominio o regla/valor inválido falla como `invalid-response` **antes de React**. No rescatar atributos válidos, rellenar descriptor ni reutilizar la respuesta previa. Esta validación describe el contrato esperado, no una implementación ya verificada.

### Presentación: resultado efectivo, no cálculo local

Unidad 7 sustituye el título/ayuda de pantalla directa por «Atributos efectivos del Tipo» y «Resueltos por Core · Sólo lectura». Mostrar characteristic.name/code/valueType y dimension si corresponde; effectiveMode, source, identityParticipates, notApplicable, optionSetCode, options y rules tal como se recibieron. GET es baseline estático sin valores de Recurso: sus opciones no son selecciones ni una evaluación dinámica del borrador. Reutilizar chrome, filas y controles GARFEX; reglas como información, no editor o motor de evaluación.

Respetar exactamente el orden del array devuelto: no ordenar por position, nombre, source o código; no agrupar/deduplicar para reconstruir prioridades. hasPosition=false se presenta sin posición asignada y sin ordinal inventado; la ubicación visual de la fila no se anuncia como prioridad de negocio. hasPosition=true muestra sólo el entero enviado. No derivar origen FAMILY/TYPE por referencias contextuales: presentar source validado.

Asignar, editar, activar/desactivar, eliminar y gestionar opciones siguen deshabilitados con motivo accesible. La vista muestra options del baseline, sin inferir selección o estrecharlas por valores de Recurso. CONDITIONAL no habilita evaluación frontend ni comandos del Creador. El POST público posterior de sección 13 cubre evaluación dinámica sólo cuando se retome ese flujo; no cierra razones/violaciones/clasificación legacy, fingerprint ni mutaciones. Una nueva lectura GET al cambiar selección sigue siendo baseline, no evaluación del borrador.

### Estado, stale y recuperación

Estados feature-locales: `waiting-context`, `loading`, `ready`, `empty`, `error`. Al cambiar Clase, Familia o Tipo, limpiar atómicamente respuesta, selección de fila y error anteriores; invalidar generación y cancelar request pendiente. Si el nuevo contexto está completo, mostrar carga accesible y solicitarlo; si queda incompleto, espera sin request. No mantener filas antiguas como placeholder actual ni confundir espera/carga con vacío.

Cada request captura snapshot y generación. Aceptar éxito o error sólo si ambos siguen vigentes; descartar tardíos incluso en A→B→A, cambio de ancestro con mismo typeCode o desmontaje. AbortSignal reduce trabajo pero no reemplaza el guard stale. finally de un request antiguo no apaga loading de uno nuevo. Reintento explícito genera nueva petición del contexto vigente, limpia resultado/error y bloquea dobles envíos mientras está pendiente; sin retries automáticos ni fallback a Unidad 6/Convex.

Red, HTTP, JSON y schema usan el modelo de sección 5 y dejan error accesible sin resultados obsoletos. `attributes: []` tras validación produce vacío confirmado «No hay atributos efectivos para este contexto»; ningún fallo se traduce en vacío. Mantener foco en controles existentes durante carga/éxito, anunciar estado sin moverlo arbitrariamente y ofrecer reintento operable por teclado. No añadir listeners globales ni persistencia/cache global. Una respuesta efectiva válida no dispara automáticamente ninguna lectura base.

### Unidades de revisión <=400 líneas

Estos cortes sustituyen el wiring C2/Unidad 7 anterior; no modifican tasks ni afirman implementación. Unidad 6 permanece independiente y no se borra ni convierte a efectiva. El enriquecimiento C3 administrativo no es dependencia de Unidad 7.

| Slice de Unidad 7 | Superficies propuestas y verificación TDD posterior | Techo autoral |
| --- | --- | --- |
| U7a — forecast inicial, sustituido | El candidato medido en 611 líneas requiere la partición Unit7a-i / Unit7a-ii seleccionada por mantenimiento y detallada en sección 13; no volver a ejecutarlo como unidad única | Sustituido |
| U7b — hook | `useCatalogTypeEffectiveAttributes.ts`, `useCatalogTypeEffectiveAttributes.test.tsx`: contexto incompleto, reset, A→B→A, cambio de ancestro, finally stale, retry, loading/error/empty | 350 |
| U7c — vista | `CatalogTypeEffectiveAttributes.tsx`, `catalogTypeEffectiveAttributes.test.tsx`: orden Core sin sort, posición ausente/presente, fuente/modo/reglas literales, acciones bloqueadas, accesibilidad | 350 |
| U7d — wiring | `CatalogHierarchyScreen.tsx` y regresión focalizada: sólo endpoint efectivo; ninguna composición desde Unidad 6, enriquecimiento, presentation/options, characteristicCode o Convex | 300 |

Unit7a-i → Unit7a-ii preceden U7b/U7c y ambos preceden U7d. La partición de U7a ya fue seleccionada por mantenimiento tras la medición 611; aplicar sección 13 sin rollback del candidato. Los techos de los demás cortes siguen siendo forecast: medir, no comprimir pruebas y escalar cualquier exceso adicional bajo ask-on-risk. Esa selección no autoriza por sí misma ramas, PRs o publicación.

TDD posterior RED→GREEN→REFACTOR con `pnpm test` por unidad; no se ejecutaron pruebas ni se escribieron source/tests en esta enmienda. El rollout activa la vista efectiva sólo cuando su respuesta y estados están cubiertos; no entregar ambas vistas como fallback. Revertir una entrega fallida por versión/wiring completo, o mantener la vista explícitamente no disponible: nunca sustituir silenciosamente atributos efectivos por records directos. Permanecen las reglas generales de no runtime dual, no backend mutation y aprobación antes de apply.

## 13. Enmienda vigente — Options, baseline GET y evaluación POST separada

### Decisiones y procedencia

El contrato/spec actualizado requiere `EffectiveAttribute.options: { code, label }[]` y documenta `POST /evaluate` con `{ values: ResourceAttribute[] }`, devolviendo el mismo EffectiveAttributesResponse. La evidencia pública del parent distingue GET estático, sin valores de Recurso, de POST evaluado por Core. No se reprodujeron solicitudes ni se inspeccionó backend/candidato source en esta fase. La medición **611 líneas** y la decisión de partición proceden del mantenedor; no se presentan como medición propia.

**ADR 10:** GET alimenta exclusivamente el baseline de Atributos de Catálogo; POST se incorpora mediante adapter separado de Resources Master **más adelante, cuando se retome el Creador**. Compartir parser de respuesta, nunca lógica de evaluación ni estado de pantalla. Las restricciones históricas de lectura de opciones/evaluación se levantan sólo para estos endpoints; Unidad 6 permanece administrativa y no compone ninguna respuesta efectiva.

### Corrección obligatoria del GET actual

Añadir options al tipo EffectiveAttribute y a su parser con el contrato estricto de sección 12. Todos los fixtures de respuesta válidos deberán contenerlo, incluso vacío; no implementar compatibilidad con respuestas sin options ni `options ?? []`. Un solo elemento inválido rechaza la respuesta completa antes de React. GET conserva URL codificada/orden query, validación contextual, fuente, modos, posición/hasPosition, valores/reglas y estrategia stale/error ya diseñadas.

Catálogo muestra las opciones emitidas por Core con sus code/label y orden originales, como información del baseline. No carga OPCION ni reconstruye opciones desde optionSetCode; no las filtra/deduplica, no selecciona por defecto y no dispara POST. `options: []` no significa FORBIDDEN, ausencia de identidad ni NOT_APPLICABLE: esos campos se muestran únicamente según la respuesta de Core. El vacío de pantalla sigue siendo `attributes: []`, no que todos los atributos tengan options vacío.

### POST posterior: seam y parser compartido sin dependencia entre features

Cuando el Creador se reanude, proponer `src/features/resources-master/resourceAttributeEvaluation.api.ts`, factory inyectable `createResourceAttributeEvaluationApi`, método `evaluateAttributes`. Éste es un adapter HTTP feature-local separado, autorizado entonces mediante ampliación **exacta** de whitelist y tests de guardas; no crear permiso genérico de POST ni activarlo desde Catálogo. Su request body es exclusivamente `{ values: ResourceAttribute[] }`; no agregar actor, revisión, fingerprint, defaults de negocio ni flags de disposiciones. POST /evaluate es evaluación, no mutación de catálogo/recursos: la regla fail-closed de actor para mutaciones persiste sin extenderla automáticamente a este endpoint.

Usar la ruta pública de evaluación y sus parámetros exactamente como OpenAPI los defina. Los artefactos suministrados la nombran `POST /evaluate` sin detallar aquí su montaje completo: antes de cablear el adapter confirmar la ruta absoluta y cómo recibe el contexto de Tipo/ancestros mediante contrato público; no asumir concatenación `/attributes/effective/evaluate`, inventar query ni agregar contexto al body. Esta precisión de wiring es gate del slice posterior, no bloqueo del GET actual. Cada segmento/query documentado conserva la política de encoding y orden determinista de sección 12.

En esa etapa, extraer el parser efectivo ya existente a `src/shared/catalog/effectiveAttributes.contract.ts` junto con tipos compartidos necesarios: función pura `parseEffectiveAttributesResponse(unknown, expectedTypeCode)` que retorna el DTO validado o falla completo. Reutilizar desde GET y POST el mismo schema público de reglas y CatalogValue. El módulo compartido no importa fetch/React/Query, no exporta transporte ni almacena estado; se justifica por dos consumidores reales, no por anticipación. Hasta entonces el parser puede permanecer junto al GET del candidato actual, sin refactor innecesario. No importar un adapter de Catálogo desde Resources Master ni mantener dos parsers divergentes. Ajustar whitelist Zod al archivo puro exacto al extraerlo, manteniendo HTTP sólo en adapters aprobados.

### Construcción de valores, no evaluación local

El futuro Creador conserva su borrador como datos de interfaz independientes de la respuesta remota. Construir cada ResourceAttribute con su `code` de característica y `value: CatalogValue`, preservando códigos y valores elegidos sin trim, coerción o conversión de clase numérica. Cuando `characteristic.valueType === 'CONTROLLED_OPTION'`, mapear la selección a `{ kind: 'CONTROLLED_OPTION', value: selectedOptionCode }`. Rechazar antes del envío TEXT, ENUM o CODE para esa característica: es validación wire/representación, no una regla sobre aplicabilidad u opciones permitidas. No usar el label como código ni traducir un valor al primer option disponible.

`NOT_APPLICABLE` usa su variante pública sin value sólo cuando exista una entrada explícita respaldada por el flujo; no derivarla porque effectiveMode sea FORBIDDEN ni sobrescribir automáticamente un valor del borrador. Preservar valores y selecciones locales: no suspender, restaurar, borrar o transformar selecciones mediante rules. El POST es quien entrega modos, notApplicable, identityParticipates y options dinámicos; mostrar esos resultados sin anticiparlos, estrecharlos ni reproducir los casos observados de insulation/color/voltage como reglas frontend.

Validar body y respuesta con sus schemas públicos. Los 400/422 observados para kinds incorrectos siguen siendo errores wire de Core, no una tabla frontend de negocio. Una evaluación válida no confirma creación, no genera fingerprint/disposiciones ni habilita create/update/lifecycle por sí misma. G4 se reclasifica: evaluación por valores respaldada para POST; nombre generado, identidad derivada, fingerprint y disposiciones/incidencias de creación siguen pendientes. G5 y los gates de mutación no cambian.

### Aislamiento de GET/POST y resultados tardíos

GET es identidad de baseline `{ classCode, familyCode, typeCode }`; POST tendrá identidad de contexto **y revisión local del borrador capturado**, además de generación. No usar cache/estado GET para presentar una evaluación del borrador ni sobrescribir el baseline de Catálogo con POST. Compartir sólo DTO/parser.

Al editar valores o cambiar contexto durante una evaluación, invalidar su generación y resultado anterior, cancelar si procede y aceptar únicamente respuesta/error del snapshot vigente. Conservar el borrador editable y sus valores; descartar finally stale y respuestas de revisiones viejas incluso si se vuelve a los mismos códigos. Error/red/schema muestra fallo explícito y recuperación manual, no resultado vacío ni fallback al GET como evaluación exitosa. `attributes: []` es resultado evaluado válido sólo tras parse completo. No reintentar automáticamente ni duplicar POST; definir trigger de evaluación al retomar el flujo, sin añadir polling/debounce automático especulativo. Catálogo no recibe ninguno de esos hooks/comandos ahora.

### Partición seleccionada tras measured611: sin rollback del candidato

La decisión del mantenedor sustituye el forecast inicial de U7a: **continuar con el candidato actual, no revertirlo ni reimplementarlo para simular TDD**. Esta fase sólo registra la estrategia; no mueve archivos, cambia tests ni marca tasks como completadas. La partición es de revisión/integración, no autorización para publicar un parser incompleto.

| Unidad seleccionada | Contenido revisable y dependencias | Techo añadido+eliminado autoral |
| --- | --- | --- |
| Unit7a-i | Tipos efectivos + parser/adapter GET del candidato actual, URL y validación contextual. No incluir POST ni hook/view nuevos. | <=400 |
| Unit7a-ii | Tests del contrato/API, guardas exactas y corrección obligatoria de options en tipos/parser/fixtures del candidato; depende de i. Si conviene para tipado, ubicar toda la corrección de options en i y dejar sus casos/guardas en ii. | <=400 |

La alternativa de ubicar options en i es equivalente **sólo si mantiene dependencias correctas y ambos techos**; no duplicar tipos ni aceptar un DTO viejo para mantener verde un corte. Medir cada unidad por separado incluyendo ajustes de options/guardas, porque el total 611 anterior no garantiza el tamaño tras corrección. No usar la división para ocultar eliminaciones, tests o código autoral. Si una unidad excede 400, subdividir de manera coherente con decisión humana antes de avanzar; no pedir de nuevo la elección ya tomada para i→ii.

Ambas unidades forman el gate mínimo de contrato GET correcto: ninguna se declara entrega operativa aislada ni se cablea la vista antes de aceptar ii. Los tests existentes se conservan en el workspace; separar revisión de producción/tests no significa ejecutar desarrollo sin pruebas. Para corregir options, registrar primero RED con casos de campo ausente, null/no-array, code/label incorrectos, claves extra y elemento inválido entre válidos; después GREEN mínimo y refactor, usando `pnpm test`. No afirmar retrospectivamente que el candidato de 611 siguió TDD si no hay evidencia. Si tests existentes importan piezas repartidas, revisar/validar sobre la pila i+ii o mover juntos los cambios dependientes, nunca prometer que una base incompleta pasa.

Tras i→ii aceptados continúan U7b hook, U7c vista y U7d wiring con sus techos previos <=400. La vista añade options baseline y asserts de ninguna selección implícita/ningún POST/ninguna lectura base. Ninguna de estas unidades incluye el futuro adapter de evaluación. Cuando se retome el Creador: separar contrato compartido+regresión GET, adapter POST+pruebas wire CONTROLLED_OPTION, y hook/wiring evaluado, cada uno medido <=400 y con sus pruebas. El montaje de /evaluate y triggers de evaluación deben estar resueltos antes de ese wiring.

Los rollback generales quedan como política de fallos de entrega futura, no como instrucción de revertir el candidato actual. Se mantiene REST-only, sin fallback Convex/directo, sin mutaciones implícitas, con aprobación de alcance. No se editaron tasks/source/tests ni se ejecutó `pnpm test` en esta enmienda.

## 14. UX aprobada — Lista compacta y detalle en Dialog GARFEX

Esta decisión humana concreta la presentación U7c/U7d: **lista maestra compacta dentro del WorkCard existente y detalle de un atributo en el Dialog compartido GARFEX**. Sustituye cualquier interpretación anterior que desplegara todos los campos técnicos/reglas en cada fila. No cambia contratos, orden Core, baseline GET, validación, acciones mutantes deshabilitadas ni separación del POST futuro. Conserva las secciones anteriores como historial y la partición seleccionada tras measured611, sin rollback del candidato.

### Jerarquía de información

| Superficie | Contenido y prioridad |
| --- | --- |
| Cabecera de sección | Mantener Atributos efectivos del Tipo y aclaración breve de baseline resuelto por Core, sólo lectura. Reutilizar el WorkCard de página; no agregar otro marco equivalente. |
| Fila compacta | `characteristic.name` como información primaria. `code` y `valueType` como texto secundario contenido, con tokens de texto secundario y sin badges/colores protagonistas. Respetar orden del array Core; no convertir la fila en tarjeta técnica extensa. |
| Acción de fila | Button compartido explícito «Ver detalle», con nombre accesible contextual al atributo. No depender de doble click, hover o clic implícito sobre toda la fila; evitar controles interactivos anidados. |
| Detalle | Dialog compartido con título del atributo, secciones legibles y acción «Cerrar». No hay formulario editable, selección de opciones ni comandos mutantes. |

La lista no trunca irreversiblemente la identidad: textos largos pueden envolver y el detalle expone nombre/código completos. Mantener objetivo de área de fila/acción cercano a **44 px** cuando sea compatible con densidad y contrato de componentes; usar escala/utilidades existentes, no `h-[44px]` ni sobreescribir el chrome de Button para alcanzar una cifra exacta. El objetivo no justifica inventar una variante compartida.

### Secciones del diálogo, en este orden

1. **Resumen:** nombre, código, tipo de valor y dimensión si existe. Etiquetar campos, usar tipografía de lectura y conservar valores exactos; no resolver otra definición ni mostrar placeholders de datos inventados.
2. **Aplicabilidad:** modo efectivo, origen (`source.level` y `source.code`), participación en identidad, no aplicable y posición sólo si hasPosition=true. Si es falso, explicar que no hay posición asignada sin mostrar el entero wire como orden. No derivar significado adicional ni alterar el orden Core.
3. **Opciones:** lista read-only de code/label recibidos en options, preservando su orden. Para `[]`, «Sin opciones en el baseline», no «Valor prohibido». optionSetCode, cuando exista, es información auxiliar; no dispara consultas ni habilita selección.
4. **Reglas condicionales:** campos humanos de sólo lectura por regla, conservando orden: atributo (`attributeCode`), comparación recibida (`equals`), modo, participación en identidad, no aplicable y estado activo. Informar «Reglas recibidas de Core; no se evalúan en esta vista». Si no hay reglas, indicarlo sin deducir que el atributo es incondicional.
5. **Cerrar:** Button compartido en DialogActions; sin Guardar/Aplicar/Evaluar.

**Prohibido presentar JSON crudo en `<pre>`**, volcar objetos con JSON.stringify o sustituir el detalle por un inspector técnico. Usar pares etiqueta/valor, listas semánticas y encabezados. El formateador de CatalogValue sólo presenta su representación validada: string literal para TEXT/CODE/ENUM/CONTROLLED_OPTION y números wire, valor y unitCode para QUANTITY, campos kind/id/code para REFERENCE, lista para STRING_LIST, Sí/No para booleanos y etiqueta «No aplicable» para NOT_APPLICABLE. No coercionar, redondear, traducir códigos, inventar value ni ejecutar condiciones. La etiqueta de variante puede acompañar el valor cuando evita ambigüedad; no convierte el dato en resultado de evaluación. Mostrar cadenas como texto escapado, nunca HTML interpretado.

### Checklist del Design System — decisiones registradas

| Ítem | Decisión para implementación posterior |
| --- | --- |
| ¿Existe componente/patrón equivalente? | Sí: Dialog/DialogHeading/DialogContent/DialogActions, Button y WorkCard existentes son las piezas aprobadas. Reutilizar página y chrome; no clonar modal, botón ni tarjeta. |
| ¿Duplicación de componentes/clases? | No prevista: lista/detalle sólo componen piezas compartidas con utilidades de layout. No copiar chrome o bloques grandes de Tailwind de otra feature. |
| ¿CSS innecesario/arbitrary values? | No nuevo CSS ni archivos de estilos. Sin hex, colores o medidas arbitrarias; usar escala Tailwind y contratos existentes. |
| ¿Tokens semánticos? | Sólo tokens GARFEX de fondo/superficie/borde/texto/foco y utilidades existentes. Sin nuevos tokens de estado especulativos. |
| ¿Propiedad feature/shared? | Lista y detalle permanecen en catalog-hierarchy por ser una sola ocurrencia con semántica propia. No crear componente shared ni promover por similitud visual. |
| ¿Light/Dark? | Light es el único modo aprobado y debe conservar legibilidad/contraste. Dark no aplica; no implementarlo para completar el checklist. |
| ¿Hover/active/focus? | Controles conservan hover, active y foco visible del Button/Dialog compartidos. La fila no aparenta ser interactiva si la única acción es Ver detalle; no estados sólo por color. |
| ¿Disabled/loading? | Acciones de negocio siguen deshabilitadas según decisiones previas; carga/error/vacío pertenecen a la sección existente. No abrir detalle sin DTO vigente ni presentar contenido stale durante carga. |
| ¿Responsive? | Dialog conserva su contrato responsive/cap al viewport y scroll accesible; texto/filas de detalle envuelven sin ancho fijo nuevo u overflow horizontal. No habilita un rediseño móvil de la aplicación. |
| ¿Consistencia/variante nueva? | Chrome GARFEX y WorkCard actuales. La reducción de densidad mediante master/detail tiene aprobación UX explícita; no introduce variante visual compartida nueva. |

### Foco, ciclo de vida y estado local

`CatalogTypeEffectiveAttributes.tsx` conserva la lista; un detalle propuesto `CatalogTypeEffectiveAttributeDetail.tsx` permanece feature-local y recibe el atributo validado del snapshot vigente. Apertura/selección de detalle es estado UI local, no Query/store global ni nueva ruta. Abrir no solicita HTTP: toda la información proviene del baseline ya validado.

Capturar el Button «Ver detalle» que abre y delegar a shared Dialog el foco inicial accesible, contención, Escape y restauración al opener. No añadir listener global, trap propio ni atajos de documento. El botón Cerrar usa el mismo mecanismo de cierre. Si el opener desaparece por cambio de contexto, cerrar el detalle e invalidar selección; coordinar el fallback de foco al control contextual persistente mediante la infraestructura existente, sin enfocar un nodo desmontado. No conservar una copia vieja como detalle actual ni seleccionar por índice en una respuesta nueva.

Cambio de Clase/Familia/Tipo, nueva carga que invalida el snapshot o fallo que retira resultados cierra/limpia el detalle. Respuestas tardías no lo reabren ni mueven foco. Carga/error/vacío y reintento conservan los estados de sección 12; sin modal vacío mientras llega una consulta ni salto automático al primer atributo al terminar.

### Impacto en revisión y aceptación futura

U7a-i/ii y U7b no cambian por esta UX. U7c se enfoca en lista compacta + detalle feature-local, con pruebas futuras de orden/secciones, options baseline, reglas legibles sin JSON y acciones sin mutación. U7d verifica wiring, apertura/cierre, Escape, restauración de foco, contexto invalidado, nombres accesibles y viewport. Mantener <=400 líneas autorales por corte incluyendo pruebas; si U7c supera el techo, separar lista y detalle con sus casos dependientes antes de apply bajo ask-on-risk, sin descartar el candidato actual ni quitar cobertura.

Checklist expresa decisiones de diseño, **no verificación visual o accesible ejecutada**. Implementación posterior seguirá TDD con `pnpm test` y regresión focalizada de Dialog/teclado. Esta enmienda modifica sólo design.md; no crea componentes, CSS, tests, specs ni tasks, y no ejecuta pruebas.

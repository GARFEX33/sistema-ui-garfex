# Evidencia acotada — Contrato REST PostgreSQL

## Corrección de procedencia

La primera exploración indicó por error que el parent ya había confirmado `GET /v1/catalog/descriptors`. Esa atribución era prematura. **Después de ese artefacto, el parent ejecutó exitosamente dicha lectura** y proporcionó los resultados detallados registrados aquí.

También después del bloqueo de apply, el parent obtuvo el **documento público completo** `GET http://localhost:8090/openapi.yaml`. La evidencia de schemas añadida en esta versión es contrato público de integración proporcionado por el usuario mediante el parent, no inspección interna del backend. Esta sesión no tiene herramienta de shell/red, por lo que no reprodujo esa lectura, no realizó peticiones mutantes ni probó conectividad de navegador.

## Procedencia de la evidencia

| Fuente | Hecho |
| --- | --- |
| Parent, antes de la corrección | Se compartieron extractos factuales iniciales de `GET /openapi.yaml`. |
| Parent, después de la primera exploración | `GET /v1/catalog/descriptors` respondió exitosamente y se compartieron los descriptors detallados abajo. |
| Parent, después del bloqueo de apply | Obtuvo el documento público completo `GET http://localhost:8090/openapi.yaml`; sus schemas base se registran abajo. |
| Parent, después de un cambio público de API | Inició el servicio exclusivamente mediante el `./run-dev.sh` proporcionado por el usuario y verificó contratos públicos: `GET /healthz`, OpenAPI y las lecturas jerárquicas acotadas registradas abajo. No es inspección de internals del backend. |
| Parent | `GET /v1/catalog/CLASE?scope=ALL&limit=2&offset=0` respondió 200 con `Material` y `Mano de obra`. |
| Esta sesión | Inspección estática de adapters/UI/pruebas Convex; sin replay HTTP ni prueba de navegador. |

## Contrato de catálogo confirmado

### Envolventes y operaciones genéricas

- `CatalogRecord` requerido: `kind`, `id: string`, `revision: string`, `active: boolean`, `values` y `rules`; `values` es un mapa con valores `CatalogValue` y `rules` es un arreglo `ApplicabilityRule`.
- `CatalogPage` requerido: `records: CatalogRecord[]`, `hasPrevious: boolean`, `hasNext: boolean`.
- `Error` requerido: `{ error: string }`.
- El listado de catálogo documenta `scope`, `text`, `limit`, `offset`, `classCode?` y `familyCode?`.
- `classCode` acota `FAMILIA` o `TIPO` a records cuyo padre `CLASE` tiene ese código; se ignora silenciosamente cuando el kind no tiene padre Clase. `familyCode` acota `TIPO` al padre `FAMILIA`; se ignora silenciosamente cuando no hay padre Familia.
- `scope` admite `ALL`, `ACTIVE` o `INACTIVE`; `limit`/`offset` admiten el rango documentado hasta 50.
- Create genérico requiere `actor` y `values`.
- Update genérico requiere `actor`, `expectedRevision` y `values`; `active` y `rules` son opcionales, salvo donde un descriptor concrete otra exigencia.
- Las operaciones CRUD/lifecycle genéricas documentadas existen para los kinds abajo; la equivalencia de sus semánticas UX con Convex aún requiere auditoría, no se considera ausente.
- Los valores confirmados son `code` con `CODE.value` y `name` con `TEXT.value`.

### Schemas wire base completos

`ApplicabilityRule` requiere `attributeCode: string`, `equals: CatalogValue`, `mode: string`, `identityParticipates: boolean`, `notApplicable: boolean` y `active: boolean`.

`CatalogValue` es una unión `oneOf` discriminada por `kind`. Cada objeto variante declara `additionalProperties: false`:

| Variante | Campos requeridos y restricción pública |
| --- | --- |
| `TEXT` | `kind: "TEXT"`, `value: string`. |
| `CODE` | `kind: "CODE"`, `value: string`. |
| `BOOLEAN` | `kind: "BOOLEAN"`, `value: boolean`. |
| `INTEGER` | `kind: "INTEGER"`, `value: string` con patrón `^(?:0|-?[1-9][0-9]*)$`; CRLF excluido. |
| `DECIMAL` | `kind: "DECIMAL"`, `value: string` canónico con patrón `^(?:0|-?(?:[1-9][0-9]*|(?:0|[1-9][0-9]*)\.[0-9]*[1-9]))$`; CRLF excluido. |
| `QUANTITY` | `kind: "QUANTITY"`, `value: string` con el patrón canónico de `DECIMAL`, `unitCode: string`. |
| `REFERENCE` | `kind: "REFERENCE"`, `reference`; el objeto `reference` también es estricto y requiere `kind: string`, `id: string` con el patrón entero de `INTEGER`, y `code: string`. |
| `ENUM` | `kind: "ENUM"`, `value: string`. |
| `STRING_LIST` | `kind: "STRING_LIST"`, `values: string[]`. |
| `CONTROLLED_OPTION` | `kind: "CONTROLLED_OPTION"`, `value: string`. |
| `NOT_APPLICABLE` | `kind: "NOT_APPLICABLE"`; no expone `value`. |

La evidencia completa de schemas wire resolvió G7 y el contrato/runtime público posterior resuelve G1 para listados dependientes por padre. Siguen sin resolverse G2/G3/G4/G5/G6/G8: orden estable, efectividad, evaluación/fingerprint, vínculo unidad natural, equivalencia método a método y campos visibles legacy.

### Descriptors leídos después de la exploración inicial

| Kind | Padre/alcance | Valores requeridos | Valores opcionales o reglas relevantes |
| --- | --- | --- | --- |
| `CLASE` | Sin padre | `code`, `name`, `plural`, `slug` | `order`, `aliases`, `keywords` |
| `FAMILIA` | `parentKind: CLASE`; `parentField: class` | `class` REFERENCE→`CLASE`, `code`, `name` | — |
| `TIPO` | `parentKind: FAMILIA`; `parentField: family`; `scopedBy: [class]` | `class` REFERENCE→`CLASE`, `family` REFERENCE→`FAMILIA`, `code`, `name` | — |
| `CARACTERISTICA` | Sin padre comunicado | `code`, `name`, `valueType` | `valueType`: `CONTROLLED_OPTION`, `INTEGER`, `DECIMAL`, `QUANTITY`, `BOOLEAN` o `CONTROLLED_TEXT`; opcionales `dimension`, `defaultIdentityParticipates` |
| `CONJUNTO_OPCIONES` | Sin padre comunicado | `code`, `name` | — |
| `OPCION` | Sin padre comunicado | `optionSet` REFERENCE→`CONJUNTO_OPCIONES`, `characteristic` REFERENCE→`CARACTERISTICA`, `code`, `label` | — |
| `RELACION_OPCIONES` | Sin padre comunicado | referencias `optionSet`, `fromCharacteristic`, `fromOption`, `toCharacteristic`, `toOption` | — |
| `UNIDAD` | Sin padre comunicado | `code`, `name`, `symbol`, `dimension` | — |
| `POLITICA_UNIDAD` | Sin padre comunicado | referencias `class`, `family`, `unit` | `allowed`, `suggested` booleanos opcionales |
| `APLICABILIDAD` | `parentKind: FAMILIA`; `parentField: family` | referencias `class`, `family`, `characteristic`; `mode` (`REQUIRED`, `OPTIONAL`, `FORBIDDEN`); `rules: []` incluso sin condicionalidad | referencias opcionales `type`, `optionSet`; `identityParticipates` booleano opcional |
| `PRESENTACION` | `parentKind: TIPO`; `parentField: type` | referencias `class`, `family`, `type`, `characteristic`; `position` INTEGER | — |

### 15c `APLICABILIDAD`: public `POST /v1/catalog/{kind}` requires `actor`/`values`, returns `201 CatalogRecord`, and supports canonical `REFERENCE` values, simple `ENUM` modes, explicit `BOOLEAN` identity participation, controlled-option `optionSet`, and top-level `rules: []`.

### 15d `PRESENTACION`: public `POST /v1/catalog/PRESENTACION` requires `actor` and `values` with canonical `REFERENCE` values for `class`, `family`, `type`, and `characteristic`, plus an explicitly supplied `position` as `INTEGER.value` using the public canonical integer pattern. It returns `201 CatalogRecord`; the descriptor declares no default, derived position, or rule payload.

### GA1 extract — 15b `CARACTERISTICA` create

The supplied public OpenAPI documents generic `POST /v1/catalog/{kind}` with `kind` in the path, a strict `CatalogCreateRequest` body requiring only `actor: string` and `values`, and a `201 CatalogRecord` response. `409`, `422`, and `503` use the public `{ error: string }` envelope. The supplied `CARACTERISTICA` descriptor fixes the supported create values to `code` as `CODE.value`, `name` as `TEXT.value`, and `valueType` as `ENUM.value` from exactly `CONTROLLED_OPTION`, `INTEGER`, `DECIMAL`, `QUANTITY`, `BOOLEAN`, or `CONTROLLED_TEXT`.

The descriptor names `dimension` and `defaultIdentityParticipates` as optional but the supplied extract does not establish their `CatalogValue` wire variants. Unit 15b therefore sends neither optional field; it does not infer a value kind, default, or response value for either.

La existencia de descriptors hace que atributos, unidades y políticas sean superficies REST descubribles y documentadas. Aun así, debe auditarse operación por operación si sus resultados/ciclo de vida equivalen a cada UX Convex actual antes de cambiar código.

### Evidencia runtime pública de jerarquía

- `GET /healthz` devolvió `{ status: "ok" }`.
- `GET /v1/catalog/FAMILIA?classCode=MATERIAL&limit=3&offset=0` devolvió 200 con `CONDUCTORES` y `CANALIZACIONES`; ambos records incluyen referencia `class` con código `MATERIAL`; `hasPrevious` y `hasNext` fueron `false`.
- `GET /v1/catalog/TIPO?familyCode=CONDUCTORES&limit=3&offset=0` devolvió 200 con `CABLE`; el record incluye referencias `class` código `MATERIAL` y `family` código `CONDUCTORES`; `hasPrevious` y `hasNext` fueron `false`.

Esta evidencia confirma la relación y filtros públicos G1 para los contextos observados. No confirma orden estable, exhaustividad más allá de las ventanas leídas ni semánticas `effective`.

## Contrato de Recursos confirmado

| Operación | Contrato comunicado por OpenAPI |
| --- | --- |
| `GET /v1/resources` | Query: `scope` (`ACTIVE`/`INACTIVE`/`ALL`), `text`, `classCode`, `familyCode`, `typeCode`, `limit` 1..50 (default 50), `offset` >=0 (default 0). Respuesta `ResourcePage` requerida: `resources`, `hasPrevious`, `hasNext`. |
| Recurso | Requeridos: `id: string`, `identityV1`, `scope: { classCode, familyCode, typeCode }`, `naturalUnit: string`, `active`, `revision: string`, `attributes: [{ code, value: CatalogValue }]`. |
| `POST /v1/resources` | Requiere `actor`, `scope`, `naturalUnit`, `attributes`; responde 201 `Resource`. |
| `PUT /v1/resources/{id}` | Requiere el cuerpo equivalente más `expectedRevision`; responde 200 `Resource`. |
| Lifecycle | `POST` deactivate/reactivate requiere `actor`, `expectedRevision`; responde 200. |
| Lectura identificable | `GET /v1/resources/{classCode}/{identityV1}`. |
| Descripción | La ruta `/describe` devuelve `{ description: string }`. |
| Errores | Cuerpo `{ error: string }`; rutas documentan 400, 404, 409, 422, 503 y 500. |
| Seguridad | No hay `securitySchemes` documentados. `actor` no prueba autenticación ni autorización. |

La búsqueda, CRUD básico, lifecycle y unidades existen en REST documentado; ya no deben marcarse como inexistentes. Quedan sin equivalencia confirmada la evaluación/fingerprint de la creación Convex, los estados `effective`/razones/violaciones y las restantes semánticas específicas de UI.

## Incompatibilidades confirmadas con Convex

| Convex actual | REST confirmado | Decisión de exploración |
| --- | --- | --- |
| `continuationCursor`, `isExhausted`, `items` | `hasPrevious`, `hasNext`, `records`/`resources`, `offset`/`limit` | Sustituir por offset sólo con orden estable y reset de offset comprobados; nunca sintetizar cursores. |
| Campos planos españoles | `values` tipados y descriptors; `code`/`name` confirmados | Construir mappers por descriptor y validar `unknown`; no inferir campos no documentados. |
| IDs/revisiones opacos o numéricos | `id`/`revision` string | Cambiar tipos y concurrencia sin coerción numérica. |
| Filtrado jerárquico de catálogo por RPC padre | `classCode` y `familyCode` públicos con relación comprobada para FAMILIA/TIPO | Sustituir las cargas dependientes por esos query parameters; no enviarlos a kinds donde OpenAPI documenta que se ignoran. |
| `effective`, `effectiveReasons`, `aggregateStatus`, `violations` | No comunicados | Adaptar la UI al backend y no clonar semántica Convex. |
| Evaluación de creación, `catalogFingerprint`, resultados `CATALOG_CHANGED`/`INCOMPLETE`/`INVALID` | No comunicados | Son la principal equivalencia pendiente para el flujo keyboard-first. |

## Conectividad pendiente

La observación parent no encontró `Access-Control-Allow-Origin` para `Origin: http://localhost:5173`. Eso no prueba un fallo de navegador, pero impide afirmar conectividad web. La decisión de CORS/origen/proxy y una prueba en navegador siguen siendo gates técnicos; Vite proxy por sí solo no resuelve una topología de producción.

## Actualización posterior — atributos, aplicabilidad y presentación

### Procedencia y límite

El parent proporcionó los siguientes hechos de contrato público procedentes de `/docs`, OpenAPI, descriptors y GET seguros en vivo. Esta sesión sólo los registra: no repitió HTTP, no accedió al repositorio/backend de servidor, no ejecutó tests y no realizó mutaciones.

### Lecturas públicas verificadas

- El listado paginado de catálogo usa `offset` y devuelve una página; para `APLICABILIDAD` y `PRESENTACION` acepta el filtro `typeCode`, y para `OPCION` acepta `optionSetCode`.
- `GET /v1/catalog/APLICABILIDAD?typeCode=CABLE` devolvió cinco records directos. Es evidencia de lectura directa por Tipo para ese caso observado, no de herencia ni de efectividad.
- Los descriptors aportan los campos exactos aplicables ya enumerados en la tabla de descriptors de este artefacto; en particular, `APLICABILIDAD` usa las referencias `class`, `family`, `characteristic` y opcionalmente `type`/`optionSet`, además de `mode`, `rules: []` e `identityParticipates` opcional; `PRESENTACION` usa `class`, `family`, `type`, `characteristic` y `position`; y `OPCION` usa `optionSet`, `characteristic`, `code` y `label`.
- Las referencias a `CARACTERISTICA` observadas conservan `id: "0"` junto con el código `durable`; ese par de referencia es el dato durable que debe validarse, no un identificador resuelto mediante detail-by-ref. Las lecturas de `CARACTERISTICA` observadas abarcan los IDs `1` a `8`.
- La lectura detail-by-ref mediante `id` no es utilizable para enriquecer esas referencias. Una búsqueda textual, si se emplea, debe validar de forma exacta el código/ref esperado antes de aceptar el resultado; una coincidencia parcial o por etiqueta no prueba identidad.

### Repercusiones de alcance

Las unidades 6–7 dejan de estar bloqueadas para una **lectura directa básica** de los records filtrables y sus referencias documentadas. No se ha confirmado equivalencia para evaluación de herencia/efectividad, razones ni valores permitidos; siguen bloqueadas y no deben derivarse localmente.

La partición propuesta, sin autorización de implementación, es:

1. **Slice 1 — lectura directa:** páginas offset para `APLICABILIDAD`, `PRESENTACION` y `OPCION` mediante los filtros públicos confirmados, mapeando sólo records y referencias directas validadas.
2. **Slice 2 — enriquecimiento de definiciones:** resolver/mostrar definiciones de características únicamente con una identidad exacta validada y sin depender de detail-by-ref por `id`; mantener bloqueadas las semánticas efectivas, razones y allowed values.

Esta evidencia no sustituye los gaps previos ni demuestra equivalencia efectiva con Convex.

## Actualización posterior — atributos efectivos resueltos por Core

### Procedencia y límite

El parent confirmó los siguientes hechos mediante OpenAPI y una lectura pública segura en vivo. Esta sesión sólo registra esa evidencia: no repitió HTTP, no inspeccionó internals del backend y no realizó mutaciones.

### Contrato público confirmado

- OpenAPI documenta el parámetro `characteristicCode` para la superficie de atributos efectivos.
- El descriptor de `APLICABILIDAD` declara que `mode` admite exactamente `REQUIRED`, `OPTIONAL`, `CONDITIONAL` y `FORBIDDEN`.
- `GET /v1/types/{typeCode}/attributes/effective` requiere el parámetro de ruta `typeCode` y los query parameters `classCode` y `familyCode`.
- Su descripción OpenAPI establece que devuelve la herencia, el orden de presentación y la evaluación `CONDITIONAL` resueltos por Core; el cliente nunca debe rederivarlos.
- OpenAPI expone los schemas `EffectiveAttributesResponse`, `EffectiveAttribute`, `CharacteristicDescriptor` y `EffectiveAttributeSource`.
- La respuesta viva para `CABLE` contiene cinco atributos. Los atributos observados incluyen `characteristic`, `effectiveMode`, `identityParticipates`, `notApplicable`, `position`/`hasPosition`, `optionSetCode`, `source: TYPE` y `rules`.

### Reclasificación de gaps

El gap previo de lectura efectiva **G3/G6 queda cerrado sólo para este endpoint de lectura**: el frontend puede consumir el resultado efectivo que Core ya resolvió para el contexto documentado, sin recomponer herencia, orden ni condicionalidad en cliente.

Esto no confirma ni habilita mutaciones de aplicabilidad/presentación, reevaluación impulsada por cambios de contexto, ni los valores de opción permitidos. Esas capacidades siguen siendo gaps separados hasta que un contrato público las documente explícitamente.

## Actualización posterior — baseline y evaluación pública de atributos

### Procedencia y límite

El parent verificó los siguientes hechos mediante OpenAPI y POST público en vivo. Esta sesión sólo los registra: no repitió solicitudes, no inspeccionó internals y no realizó mutaciones de catálogo o recursos.

### Contrato público confirmado

- La descripción de `GET /v1/types/{typeCode}/attributes/effective` precisa que devuelve un baseline estático y no incluye valores de recurso para evaluar; mantiene la resolución de Core y no autoriza derivación en cliente.
- `EffectiveAttribute` requiere `options`, cuyos elementos son `{ code, label }`.
- `POST /evaluate` acepta `{ values: ResourceAttribute[] }` y devuelve la misma respuesta que el endpoint efectivo.
- `CatalogValue` incluye las variantes `CONTROLLED_OPTION` y `NOT_APPLICABLE`, utilizables en los valores de evaluación conforme al contrato.
- En vivo, un POST con `insulation` como `CONTROLLED_OPTION` con valor `DESNUDO` devolvió `color` y `voltage` como `FORBIDDEN`, con `notApplicable: true` e `identityParticipates: false`.
- En esa evaluación, `TEXT` devolvió 422 y `CODE` y `ENUM` devolvieron 400; esos estatus son evidencia observada de validación wire, no reglas que el cliente deba reproducir.

### Reclasificación de gaps

Los gaps de **lectura de valores/opciones permitidos** y de **evaluación por valores** quedan cerrados solamente para los endpoints documentados: el frontend puede presentar `options` emitidas por Core y enviar `ResourceAttribute[]` a `POST /evaluate`, consumiendo su respuesta sin calcular aplicabilidad, prohibiciones, identidad ni validación local.

Las mutaciones de aplicabilidad, presentación, opciones o recursos continúan siendo capacidades separadas. Nada de esta evidencia las confirma ni permite inferirlas.

## Actualización posterior — ruta absoluta y contexto de `POST /evaluate`

### Procedencia y límite

El equipo de backend confirmó estos hechos citando el OpenAPI embebido en `garfex-api` (`internal/httpapi/openapi.yaml:747-763`). No hay URL pública independiente de ese archivo fuera del binario: se sirve en runtime en `{base-de-la-api}/openapi.yaml` (crudo) y `{base-de-la-api}/docs` (Scalar renderizado). Esta sesión no realizó ninguna petición en vivo ni inspeccionó el repositorio `garfex-api`; registra únicamente la cita recibida.

### Contrato público confirmado

- Ruta absoluta: `POST /v1/types/{typeCode}/attributes/evaluate` — única variante documentada, coincide con el código del router.
- `typeCode` viaja en la ruta (`in: path`, `required: true`).
- `classCode` y `familyCode` viajan como query params (`in: query`, `required: true` en el schema), igual que `GET /v1/types/{typeCode}/attributes/effective`.
- Dato de riesgo explícito en el schema, no evidente en el código: aunque `required: true`, el handler los lee con `Query().Get()` sin validar su ausencia — omitirlos evalúa contra un `ResourceScope` vacío en esos campos en lugar de fallar con un 400 claro. El cliente MUST enviarlos siempre.
- Ejemplo confirmado: `POST /v1/types/CABLE_CONTROL/attributes/evaluate?classCode=MATERIALES&familyCode=CABLES` con `Content-Type: application/json` y body `{ "values": [...] }`.
- El body sigue siendo exclusivamente `{ values: ResourceAttribute[] }`, sin `typeCode` duplicado ni otro campo.

### Reclasificación de gaps

Esto cierra la reapertura pendiente de G4/tarea 7f: la ruta absoluta y el mecanismo de contexto de `POST /evaluate` ya están confirmados por contrato público (cita de fuente), no inferidos ni concatenados. El adapter `resourceAttributeEvaluation.api.ts` puede implementarse con esta evidencia exacta. Esto no confirma `catalogFingerprint`, disposiciones `CATALOG_CHANGED`/`INCOMPLETE`/`INVALID`, ni ninguna otra capacidad de creación — esos gaps permanecen separados.

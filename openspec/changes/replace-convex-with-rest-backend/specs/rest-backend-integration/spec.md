# Especificación de Integración REST pública

## Purpose

Conectar los flujos aprobados de Catálogo y Maestro de Recursos exclusivamente al contrato REST público suministrado, sin atribuir al frontend capacidades que el contrato no documenta.

## Requirements

### Requirement: Frontera REST pública y DTOs validados

El frontend MUST consumir únicamente rutas, parámetros, cuerpos y respuestas documentados en `api-contract-evidence.md`. Antes de llegar a React, toda respuesta `unknown` MUST validarse como `CatalogRecord`, `CatalogPage`, `Resource`, `ResourcePage`, valor tipado o error `{ error: string }` según corresponda. `id`, `revision` y `expectedRevision` MUST conservarse como `string`, sin coerción numérica. Los mappers MUST convertir sólo valores tipados documentados (`CODE.value`, `TEXT.value` y referencias documentadas) y campos que el descriptor público del `kind` declare; MUST NOT completar, normalizar ni inferir valores, reglas o relaciones no documentados.

#### Scenario: Un record REST válido conserva identificadores opacos

- GIVEN una respuesta `CatalogRecord` o `Resource` válida con `id` y `revision` de texto
- WHEN el adapter la entrega al flujo de interfaz correspondiente
- THEN los identificadores y revisiones permanecen como `string`
- AND la interfaz recibe sólo el DTO validado y mapeado

#### Scenario: Un DTO o valor tipado inválido no llega a React

- GIVEN una respuesta con un envelope, valor tipado, referencia o campo obligatorio inválido
- WHEN el adapter procesa el payload desconocido
- THEN la operación falla en la frontera REST
- AND no se fabrican defaults, datos locales ni reglas de negocio para continuar

### Requirement: Errores REST y fallos de red observables

El frontend MUST mapear los errores HTTP documentados 400, 404, 409, 422, 500 y 503, y los fallos de red o parsing, a estados explícitos de error recuperable cuando el flujo pueda reintentarse. Si la respuesta contiene `{ error }`, el estado MUST conservar su carácter de error y MUST NOT presentarse como éxito, resultado parcial autoritativo ni validación de negocio. El frontend MUST NOT inventar causas, permisos, reintentos automáticos o resoluciones no documentadas.

#### Scenario: Un conflicto REST no confirma una mutación

- GIVEN una mutación que recibe 409 y un cuerpo `{ error: string }`
- WHEN el adapter informa el resultado a la interfaz
- THEN la interfaz comunica un fallo explícito
- AND no actualiza el estado como si la revisión esperada hubiera sido aceptada

#### Scenario: Una caída de red mantiene un estado honesto

- GIVEN una lectura o mutación cuya petición falla antes de recibir respuesta HTTP
- WHEN la interfaz termina la operación
- THEN presenta el estado de fallo y la recuperación que el flujo ya soporte
- AND no sustituye la respuesta con Convex, fixtures ni persistencia local

### Requirement: Shared base option administration through public REST

After the public G9 resolution and human authorization, the **Opciones** tab MUST administer only shared base `OPCION` records and MUST NOT retain a read-only block for the approved slice. It MUST load the base list exclusively through the documented public REST catalog listing with `scope=ALL` and the current `optionSetCode` plus `characteristicCode` filters. It MUST NOT substitute effective-response options, locally filtered records, Convex, fixtures, or a local evaluator for that list. The list response and every record MUST satisfy the strict public catalog and `OPCION` descriptor schemas before reaching React. An accepted `OPCION` MUST contain only the descriptor-confirmed required values: `optionSet` as a strict `REFERENCE` to `CONJUNTO_OPCIONES`, `characteristic` as a strict `REFERENCE` to `CARACTERISTICA`, `code` as its descriptor-confirmed typed wire value, and `label` as its descriptor-confirmed typed wire value. The two references MUST match the active filter context exactly. For the G9-authorized `DEFAULT` plus `insulation` slice, they MUST be the canonical references `CONJUNTO_OPCIONES`/`"1"`/`DEFAULT` and `CARACTERISTICA`/`"3"`/`insulation`, respectively. Missing, additional where disallowed, malformed, noncanonical, or context-mismatched values MUST fail the response rather than be repaired, inferred, or rendered as authoritative.

The only option mutations the tab MUST expose are create with `POST /v1/catalog/OPCION`, edit with `PUT /v1/catalog/OPCION/{id}`, deactivate with `POST /v1/catalog/OPCION/{id}/deactivate`, and reactivate with `POST /v1/catalog/OPCION/{id}/reactivate`. The tab MUST NOT expose, call, simulate, or offer a permanent `DELETE`. Create and edit forms MUST validate the descriptor-required `optionSet`, `characteristic`, `code`, and `label` values before sending, preserve the user-entered code without trimming, deriving, translating, or fabricating it, and report invalid or rejected code handling as the error for that action rather than silently changing the value. Lifecycle actions MUST require an explicit accessible confirmation that identifies the requested deactivate or reactivate action and shared global scope before HTTP is sent. Every mutation MUST use the existing configurable local `actor` and MUST fail closed before sending HTTP when that actor is missing, blank, or invalid. An update MUST send `expectedRevision` as the documented string without numeric coercion, replacement, or fabrication; all identifiers, revisions, references, and mutation values MUST meet their public operation schema constraints.

The tab MUST show accessible loading, confirmed empty, recoverable error, and explicit retry states for its base-list request. It MUST cancel or invalidate superseded requests and ignore late, aborted, or stale responses, including responses from a different dialog, attribute, option set, characteristic, or retry generation. A mutation MUST NOT optimistically fabricate a business result, revise a base record in-place as authority, or modify the Core effective projection locally. While a create, edit, deactivate, or reactivate mutation is pending, every control that can submit that same action MUST be disabled and MUST prevent a duplicate request. Each failed action, including local form or actor failure and HTTP failure, MUST announce an accessible error associated with that action without presenting success. On a 409 conflict, it MUST preserve an explicit conflict state, refetch the authoritative base list and effective attribute projection, and require the user to act from current data rather than silently retrying or overwriting. After every confirmed create, edit, deactivate, or reactivate, it MUST refetch both the filtered base list and the effective projection; the latter's order and semantics remain authoritative only from Core. Closing a create/edit surface or lifecycle confirmation MUST restore focus to its still-operable opener, or to an explicit accessible **Opciones** fallback if that opener is unavailable. After a confirmed mutation and its authoritative refetch, focus MUST move to the refreshed affected option when it remains available and operable, or otherwise to the explicit accessible **Opciones** fallback.

#### Scenario: The shared base list uses only its public filters

- GIVEN an effective attribute with `optionSetCode` and characteristic code
- WHEN the user opens **Opciones**
- THEN the tab requests only the documented public `OPCION` list with `scope=ALL`, `optionSetCode`, and `characteristicCode` for that current context
- AND it renders only records that pass the strict public catalog and `OPCION` descriptor schemas
- AND it does not use the effective response, Convex, or local evaluation as a substitute list

#### Scenario: G9 records retain canonical references

- GIVEN the G9-authorized `DEFAULT` plus `insulation` option context
- WHEN the public base list returns an `OPCION` record
- THEN the record is accepted only when its `optionSet` reference is `CONJUNTO_OPCIONES`/`"1"`/`DEFAULT` and its `characteristic` reference is `CARACTERISTICA`/`"3"`/`insulation`
- AND a record with a malformed, translated, or mismatched reference is rejected before React

#### Scenario: An option mutation fails closed without an actor

- GIVEN the user attempts to create, edit, deactivate, or reactivate a base option and no valid local actor is configured
- WHEN the mutation is confirmed
- THEN the tab explains that it cannot send the mutation
- AND no mutating HTTP request is made

#### Scenario: An edit preserves string concurrency data

- GIVEN a valid shared base option and its documented current revision string
- WHEN the user confirms an edit
- THEN the update sends that revision as `expectedRevision` without numeric coercion or substitution
- AND the payload contains only values permitted by the public `OPCION` descriptor and update schema

#### Scenario: A conflict recovers from authoritative data

- GIVEN an option mutation receives HTTP 409
- WHEN the tab handles the response
- THEN it shows an explicit conflict rather than a success or optimistic business state
- AND it refetches the filtered base list and Core effective projection without overwriting current data

#### Scenario: A confirmed lifecycle mutation refreshes both authorities

- GIVEN a create, edit, deactivate, or reactivate mutation is confirmed by its documented response
- WHEN the mutation completes
- THEN the tab refetches the filtered base option list and the current effective projection
- AND it preserves Core's returned effective order and semantics without local recomposition

#### Scenario: A stale option request cannot replace the current tab state

- GIVEN a base-list request is pending for one dialog context or retry generation
- WHEN the context changes, the dialog closes, or a newer request begins before that request resolves
- THEN the earlier request is aborted or invalidated when possible
- AND any later result from it is ignored and does not replace the current loading, empty, error, or data state

#### Scenario: Create and edit validate code without fabricating it

- GIVEN the user opens the create or edit form for a shared base option
- WHEN a required descriptor value is absent, malformed, or the code is rejected locally or by the public endpoint
- THEN that action presents an accessible validation or error announcement
- AND it does not trim, derive, translate, replace, or silently submit a different code

#### Scenario: Lifecycle requires explicit confirmation

- GIVEN the user requests to deactivate or reactivate a shared base option
- WHEN the lifecycle confirmation is displayed
- THEN it identifies the requested action and warns that the shared base change can affect all consumers of the option set or characteristic
- AND no lifecycle HTTP request is sent until the user explicitly confirms

#### Scenario: A pending mutation prevents duplicate submission

- GIVEN a create, edit, deactivate, or reactivate request is pending
- WHEN the user encounters controls that can submit that same action
- THEN those controls are disabled
- AND no duplicate mutation request is sent

#### Scenario: Action failures are announced without success

- GIVEN a create, edit, deactivate, or reactivate action fails locally or receives an HTTP error
- WHEN the tab handles the failure
- THEN it announces an accessible error for that specific action
- AND it does not announce success or fabricate a changed option state

#### Scenario: Close and confirmed success restore useful focus

- GIVEN the user opened an option form or lifecycle confirmation from an operable **Opciones** control
- WHEN the surface closes without success
- THEN focus returns to its opener, or to the explicit accessible **Opciones** fallback when the opener is unavailable
- WHEN the mutation succeeds and both authoritative refetches complete
- THEN focus moves to the refreshed affected option when it is operable
- AND otherwise focus moves to the explicit accessible **Opciones** fallback

### Requirement: Public REST protocol for guided global attribute creation

The guided attribute-creation flow MUST use only the documented public generic REST operations for `CARACTERISTICA`, `APLICABILIDAD`, and `PRESENTACION`. It MUST create and fully validate the global `CARACTERISTICA` response before constructing either assignment request. It MUST then use that exact confirmed record to construct one simple `APLICABILIDAD` for the selected Class, Family, and Type and one `PRESENTACION` for that same selected hierarchy and Characteristic. It MUST NOT derive a Characteristic identity from its code, a row index, an effective baseline, or a local substitute.

Every request and response MUST use the exact public `CatalogValue` wire schema for its kind and operation, including the closed variant shape, discriminator, value type, and strict `REFERENCE` form with its documented `kind`, `id`, and `code`. `APLICABILIDAD` MUST transmit its required empty rules collection and one literal mode from `REQUIRED`, `OPTIONAL`, or `FORBIDDEN`; it MUST NOT transmit `CONDITIONAL` or any condition rule. `PRESENTACION` MUST transmit its descriptor-required position and references using their exact documented wire representations. The frontend MUST NOT guess a `CatalogValue` variant from a field name, flatten a reference, coerce or fabricate an id, revision, numeric value, rules collection, position, or any other required value. If the public operation schema does not establish an exact required representation, the affected write MUST fail closed before HTTP as a contract gap.

Each of the three writes MUST require the configurable local actor and MUST fail closed before HTTP when it is missing, blank, or invalid. The flow MUST expose distinct durable step states for not started, pending, confirmed, failed, unconfirmed, and reconciliation-required outcomes of characteristic, applicability, and presentation creation. Public generic REST writes MUST be treated as non-transactional: an earlier confirmed write plus any later failed, conflicted, or unconfirmed outcome MUST remain an explicit partial success. The client MUST NOT claim rollback or atomicity, silently retry, send a compensating mutation, or claim the Type assignment is complete until all three writes are confirmed and reconciled.

After each confirmed write or an unconfirmed write outcome, the current effective projection MUST be refreshed only by the documented Core effective-attributes read for the captured Class, Family, and Type context. The client MUST NOT synthesize that projection from mutation responses, generic catalog lists, a fallback, Convex, local persistence, or local business-rule evaluation. A stale response or one from a different dialog, generation, or hierarchy context MUST be ignored.

#### Scenario: The exact created record supplies assignment references

- GIVEN valid selected Class, Family, and Type context, a valid actor, and exact public wire values for a new characteristic
- WHEN `CARACTERISTICA` creation is confirmed with a valid public `CatalogRecord`
- THEN `APLICABILIDAD` and `PRESENTACION` use the returned Characteristic identity in their exact `REFERENCE` wire values
- AND the client does not derive or replace that identity from code, position, or effective data

#### Scenario: Unsupported or imprecise wire data fails closed

- GIVEN an attribute-creation input lacks the exact public `CatalogValue` representation required by any write
- WHEN the user confirms the guided Dialog
- THEN the affected step reports a contract or configuration failure before HTTP
- AND it does not infer a value variant, reference id, rules collection, or presentation position

#### Scenario: Partial generic writes do not pretend to be atomic

- GIVEN `CARACTERISTICA` creation is confirmed and `APLICABILIDAD` or `PRESENTACION` then fails, conflicts, or has no confirmed HTTP result
- WHEN the flow reconciles the operation
- THEN it preserves explicit step state identifying the confirmed and unresolved writes
- AND it does not roll back, auto-retry, or report the selected Type assignment as complete
- AND it refreshes the effective projection only from Core for the captured context

#### Scenario: A local evaluator cannot replace Core refresh

- GIVEN a guided attribute write has completed or has an unconfirmed result
- WHEN the interface refreshes the affected attribute view
- THEN it reads the effective projection from Core for the captured context
- AND it does not use Convex, a fallback, local business evaluation, or a mutation response as that projection

### Requirement: Paginación REST sin cursor sintético

Los listados REST MUST solicitar páginas mediante `offset` y `limit` dentro del rango documentado, y MUST usar exclusivamente `hasPrevious` y `hasNext` devueltos por `CatalogPage` o `ResourcePage` para habilitar la navegación disponible. Un cambio de texto, alcance o filtro documentado MUST reiniciar el offset de ese listado. El frontend MUST NOT fabricar `continuationCursor`, `isExhausted`, cursores, orden estable, deduplicación inter-página ni resultados omitidos como garantías REST.

#### Scenario: Navegación a la página siguiente documentada

- GIVEN una página REST válida con `hasNext` verdadero y un offset vigente
- WHEN la persona solicita la página siguiente mediante el control existente
- THEN el adapter solicita la siguiente ventana con `offset` y `limit`
- AND la interfaz no emite ni interpreta un cursor sintético

#### Scenario: Orden no documentado bloquea una equivalencia prometida

- GIVEN que el contrato público no documenta un orden estable entre páginas
- WHEN un flujo requiera garantizar ausencia de duplicados, omisiones o una posición estable tras paginar
- THEN el flujo muestra un estado de alcance o bloqueo explícito
- AND la capacidad se reporta al humano sin declarar que REST conserva esa garantía

### Requirement: Desarrollo local y actor de prueba acotados

En desarrollo local, Vite MUST dirigir las peticiones de la aplicación al backend declarado `http://localhost:8090` mediante un proxy de mismo origen. Esta configuración MUST NOT definir ni modificar topología, CORS, autenticación, autorización, variables o despliegue de producción. La conectividad real de navegador MUST verificarse antes de declararla operativa; el proxy no MAY presentarse como evidencia de CORS ni como solución de producción. Las mutaciones REST MUST obtener un `actor` local configurable; si falta, está vacío o no es válido para la configuración, MUST fallar cerradas antes de enviar una petición. El actor MUST NOT presentarse como prueba de autenticación o autorización.

#### Scenario: Desarrollo usa el proxy local

- GIVEN la aplicación iniciada en desarrollo local
- WHEN un adapter REST autorizado construye una petición
- THEN la petición usa la ruta de mismo origen configurada para el proxy hacia `localhost:8090`
- AND no incorpora una configuración de producción

#### Scenario: La conectividad de navegador aún no se presume

- GIVEN que sólo existe la configuración de proxy local
- WHEN no se ha ejecutado una lectura desde el navegador contra el entorno de desarrollo
- THEN el cambio no declara conectividad web verificada
- AND no atribuye al proxy una decisión de CORS o producción

#### Scenario: Falta el actor local

- GIVEN una persona intenta crear, actualizar, desactivar o reactivar y no existe actor local configurado
- WHEN confirma la acción
- THEN la interfaz comunica que la mutación no puede enviarse por falta de actor local
- AND no se emite ninguna petición HTTP mutante

### Requirement: Lecturas jerárquicas REST acotadas por código

La lista REST de `FAMILIA` MUST incluir `classCode` con el código de la Clase contextual seleccionada y MUST NOT incluir `familyCode`. La lista REST de `TIPO` MUST incluir `familyCode` con el código de la Familia contextual seleccionada y MUST NOT incluir filtros de kinds no relacionados. `CLASE` y cualquier kind que no tenga el padre que documenta cada filtro MUST omitir `classCode` y `familyCode`; el frontend MUST NOT enviar parámetros que el contrato indica que serían ignorados. Cada página de `FAMILIA` MUST validar que la referencia `class` de todos sus records coincide con el `classCode` solicitado; cada página de `TIPO` MUST validar que la referencia `family` coincide con el `familyCode` solicitado. Una discrepancia MUST hacer fallar la página completa antes de React, sin mezclar records, corregir referencias ni reutilizar una página previa.

#### Scenario: La lista de Familia se acota por la Clase seleccionada

- GIVEN una Clase contextual con código conocido
- WHEN el adapter solicita la página de `FAMILIA`
- THEN envía únicamente el `classCode` de esa Clase como filtro jerárquico
- AND falla la página si cualquier record no referencia ese código de Clase

#### Scenario: La lista de Tipo se acota por la Familia seleccionada

- GIVEN una Familia contextual con código conocido
- WHEN el adapter solicita la página de `TIPO`
- THEN envía únicamente el `familyCode` de esa Familia como filtro jerárquico
- AND falla la página si cualquier record no referencia ese código de Familia

#### Scenario: Un kind no relacionado no recibe filtros ignorados

- GIVEN una lectura de `CLASE`, `UNIDAD` u otro kind sin el padre documentado para un filtro
- WHEN el adapter construye la URL REST
- THEN omite `classCode` y `familyCode` que no apliquen a ese kind
- AND no depende del comportamiento de ignorar parámetros del backend

### Requirement: Brechas contractuales visibles y bloqueadas

La interfaz MUST distinguir los comportamientos respaldados por el contrato de las brechas no resueltas. El filtro jerárquico por padre queda respaldado únicamente para las listas de `FAMILIA` y `TIPO` acotadas por sus códigos documentados; los atributos efectivos quedan respaldados únicamente para la lectura contextual `GET /v1/types/{typeCode}/attributes/effective` y sus schemas públicos. El orden estable de paginación, `effectiveReasons`, `aggregateStatus`, `violations`, evaluación de creación, `catalogFingerprint` y disposiciones como `CATALOG_CHANGED`, `INCOMPLETE` o `INVALID` MUST tratarse como no documentados fuera de la lectura efectiva explícita y de `POST /evaluate`, que únicamente evalúan atributos y opciones conforme a sus schemas públicos. Para cada flujo afectado, el frontend MUST registrar la operación de usuario, evidencia pública disponible e impacto visible, y MUST presentar un estado de alcance reducido o bloqueo antes que eliminar, simular o aprobar silenciosamente esa funcionalidad. Sólo una decisión humana y contrato público actualizado MAY desbloquearla.

#### Scenario: El flujo necesita evaluación no documentada

- GIVEN un paso keyboard-first que requiere evaluación, fingerprint o diagnóstico previo a crear
- WHEN alcanza ese paso usando únicamente el contrato REST suministrado
- THEN informa que la integración necesaria no está respaldada por el contrato público
- AND no habilita una creación equivalente ni calcula una evaluación local


### Requirement: Conservación de interacción soportada

Todo flujo que REST sí respalde MUST conservar su composición visual, nombres accesibles, foco visible y recorrido de teclado existente conforme a WCAG 2.2 AA y al contrato `keyboard-interaction`. Los adapters REST MUST NOT añadir listeners globales, capturas de `Tab` o `Ctrl+N`, ni cambiar atajos por el transporte. Una brecha contractual MUST comunicar su estado sin degradar los controles, la restauración de foco o la accesibilidad de las acciones restantes.

#### Scenario: Una lectura REST no altera el recorrido de teclado

- GIVEN un listado REST soportado y navegable en la interfaz actual
- WHEN completa carga, vacío o error de red
- THEN los controles disponibles conservan nombre accesible, foco perceptible y recorrido de teclado aplicable
- AND la navegación global y local conserva sus propietarios existentes

### Requirement: Retirada final y total de Convex

Tras migrar o bloquear honestamente todos los consumidores incluidos, el frontend MUST eliminar Convex por completo: dependencias, lockfile asociado, imports, configuración, RPC, clientes, pruebas conectadas y excepciones de arquitectura. El runtime y las pruebas MUST NOT conservar fallback, ruta dual, mock runtime ni sustituto local de Convex. Esta migración MUST NOT extender ni crear UI de proveedores ni capacidades backend nuevas. El rollback posterior MUST ocurrir mediante reversión de la entrega, no mediante dos backends activos.

#### Scenario: La verificación final no encuentra Convex

- GIVEN el cierre de la migración aprobada
- WHEN se ejecutan las guardas de arquitectura y la suite `pnpm test`
- THEN no queda dependencia ni consumo runtime o de pruebas de Convex en el alcance
- AND los flujos incluidos usan REST o muestran su bloqueo contractual explícito

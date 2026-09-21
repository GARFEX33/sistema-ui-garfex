# Delta for Jerarquía del Catálogo

## ADDED Requirements

### Requirement: Core-authoritative attribute rows and detail dialog

With contextual Class, Family, and Type codes, the screen MUST obtain the static attribute baseline only from `GET /v1/types/{encodedTypeCode}/attributes/effective?classCode={encodedClassCode}&familyCode={encodedFamilyCode}`. Core's response MUST remain the sole authority for attribute order, effective semantics, rules, options, and presentation data. The adapter MUST validate the complete public `EffectiveAttributesResponse` and all nested public descriptor schemas before React receives it. It MUST reject the whole response when its `typeCode`, required structure, typed value, or documented literal domain is invalid; it MUST NOT default, correct, derive, locally evaluate, or recompute any effective result.

The primary attribute list MUST preserve the exact order emitted by Core. Each attribute row MUST be exactly one native interactive control that opens its detail Dialog with native `Enter` and `Space` activation. `ArrowUp` and `ArrowDown` on an eligible row MUST only move focus through the existing spatial-navigation contract; they MUST NOT open detail, change the selected attribute, or submit an action. `Enter` MUST open detail only for the focused row. The row MUST retain its existing spatial-navigation identifier and eligibility, so Arrow navigation remains governed by the unchanged `keyboard-interaction` contract. The row MUST NOT contain a nested button or any other nested interactive control; a separate **View detail** button or an inline option-management action is prohibited.

The detail Dialog MUST contain accessible **Detalle** and **Opciones** tabs. Its tab controls MUST implement `tablist`, `tab`, and `tabpanel` semantics with correct accessible names and selection relationships. Within the tablist, `ArrowLeft` and `ArrowRight` MUST move focus between enabled tabs, `Home` MUST move focus to the first enabled tab, `End` MUST move focus to the last enabled tab, and `Enter` MUST select only the focused tab. These local tab keys MUST NOT activate a row, submit a mutation, close the Dialog, or invoke a global shortcut. The Dialog MUST keep focus contained while open, close through **Close** or `Escape`, and restore focus to its opening row when that row remains connected, visible, enabled, and operable; otherwise it MUST restore focus to an explicit accessible attribute-tab fallback.

**Detalle** MUST present the complete data emitted by Core without reordering, omission, or local interpretation. If `hasPosition` is false, neither the row nor the Dialog MUST claim a position. If it is true, the Dialog MAY present only the position returned by Core. Baseline options MUST NOT be represented as Resource selections, and the client MUST NOT narrow, derive, or evaluate them locally.

**Opciones** MUST make authorized shared-base option administration available, and MUST NOT remain read-only, only when the effective attribute includes an `optionSetCode` and its characteristic context. In that eligible context, the tab MUST expose create, edit, deactivate, and reactivate as defined by the public `OPCION` contract; it MUST NOT expose permanent `DELETE`. When no `optionSetCode` exists, the tab MUST instead present an accessible explanatory empty state and MUST expose no option-management mutation. When an option set exists, the tab MUST display a clear warning that base options are shared and that an edit or lifecycle change can affect every consumer of the same option set or characteristic.

When the contextual Class, Family, or Type changes, the screen MUST cancel or otherwise invalidate the previous effective request, clear its former result, and accept only a validated response for the current context. A late or aborted response MUST NOT replace the current context. The current request MUST expose accessible loading, confirmed empty, recoverable error, and explicit retry states without presenting stale attributes as current. The paginated `APLICABILIDAD` adapter MUST NOT compose or substitute this Core-authoritative effective screen.

#### Scenario: A native row opens detail without changing spatial navigation

- GIVEN a valid Core effective response and a focused attribute row with its established spatial identifier
- WHEN the user presses `Enter` or `Space` on that row
- THEN the native row opens its detail Dialog
- AND the row remains the sole interactive control for that attribute and retains its spatial identifier
- AND Arrow navigation remains subject to the existing spatial-navigation contract

#### Scenario: Nested controls are not introduced in an attribute row

- GIVEN the primary attribute list is rendered
- WHEN an assistive technology or keyboard user encounters an attribute row
- THEN the row exposes one native interactive control
- AND it contains neither a nested button nor another nested interactive descendant

#### Scenario: Detail tabs use scoped accessible keyboard behavior

- GIVEN the detail Dialog is open with both tabs enabled
- WHEN the user presses `ArrowLeft`, `ArrowRight`, `Home`, `End`, or `Enter` in its tablist
- THEN focus or selection changes only according to the tablist behavior for **Detalle** and **Opciones**
- AND the key does not reopen the row, submit an option mutation, close the Dialog, or trigger a global command

#### Scenario: Shared scope is visible before administration

- GIVEN an effective attribute with an `optionSetCode`
- WHEN the user opens **Opciones**
- THEN the tab clearly warns that base options are shared across consumers of that option set or characteristic
- AND the warning remains available before the user starts a create, edit, deactivate, or reactivate action

#### Scenario: The authorized tab exposes only supported administration

- GIVEN an effective attribute with an `optionSetCode` and characteristic context
- WHEN the user selects **Opciones**
- THEN the tab exposes create, edit, deactivate, and reactivate for shared base options
- AND it exposes no permanent `DELETE` or read-only block in place of those authorized actions

#### Scenario: A missing option set explains unavailable administration

- GIVEN an effective attribute with no `optionSetCode`
- WHEN the user selects **Opciones**
- THEN the Dialog presents an accessible explanatory empty state
- AND no create, edit, deactivate, or reactivate control is available

#### Scenario: The dialog restores focus safely

- GIVEN a user opens detail from an eligible attribute row
- WHEN the Dialog closes through `Escape` or **Close**
- THEN focus returns to that row when it remains eligible
- AND otherwise focus moves to the explicit accessible attribute-tab fallback

#### Scenario: A context change rejects stale effective data

- GIVEN an effective request is pending for a prior Type context
- WHEN the user changes the Class, Family, or Type context
- THEN the prior request is aborted or invalidated and its result is not presented as current
- AND the current context presents loading, empty, error, or retry state as applicable

### Requirement: Enriquecimiento opcional y exacto de Característica

El adapter lower-level/administrativo de aplicabilidad directa MAY enriquecer una referencia `CARACTERISTICA` mediante una búsqueda textual paginada de `CARACTERISTICA` sólo si valida una identidad exacta. Este enriquecimiento MUST NOT reemplazar ni alterar el DTO del endpoint efectivo de pantalla: el record encontrado MUST ser de kind `CARACTERISTICA` y su valor `code` `CODE.value` MUST coincidir exactamente con el `reference.code` esperado. La referencia original MUST conservar y validar su `kind`, `id` string y `code`; su `id`, incluido `"0"`, MUST NOT usarse para una lectura detail-by-ref ni para aceptar una definición. Una coincidencia parcial, por etiqueta, de kind distinto, sin código exacto o múltiples definiciones exactas MUST considerarse ambigua y no apta para enriquecer.

Si no existe una única definición exacta válida, la interfaz MUST conservar el código de la referencia como etiqueta y MUST comunicar visiblemente que la definición no está disponible. La ausencia o ambigüedad MUST NOT invalidar la página base administrativa, inventar una etiqueta, activar una evaluación ni sustituir la respuesta efectiva de pantalla.

#### Scenario: Una definición exacta enriquece una referencia

- GIVEN una referencia `CARACTERISTICA` válida con código `durable`, incluso si su id es `"0"`
- WHEN una búsqueda textual devuelve exactamente una definición `CARACTERISTICA` cuyo `CODE.value` es `durable`
- THEN la interfaz MAY usar los campos descriptor-confirmados de esa definición para enriquecer la etiqueta
- AND no usa el id de la referencia para una lectura detail-by-ref

#### Scenario: Una definición ausente o ambigua conserva el código

- GIVEN una referencia de Característica válida
- WHEN la búsqueda no devuelve una única definición del kind correcto con el código exacto esperado
- THEN la interfaz presenta el código de la referencia
- AND comunica que la definición no está disponible sin ocultar ni alterar la aplicabilidad directa

### Requirement: Option administration remains separate from effective composition

The direct `APLICABILIDAD` adapter MUST remain limited to applicability records and, optionally, an exact characteristic definition. It MUST NOT load, combine, infer, or locally evaluate `OPCION`, allowed values, inheritance, or `PRESENTACION` to compose the effective screen. The approved `OPCION` administration surface is limited to the **Opciones** tab of an effective attribute Dialog with an `optionSetCode`; it MUST use its own public REST filters and contracts. That approval MUST NOT authorize option administration to alter applicability, presentation, inheritance, effective modes, identity participation, rules, or any other Core-authoritative effective semantics.

#### Scenario: Direct applicability does not compose or mutate option semantics

- GIVEN a valid page of direct applicability records for a Type
- WHEN the interface renders those records
- THEN it does not request options, presentation, allowed values, or evaluation to complete the result
- AND it does not use direct applicability data to enable or recompute shared-option administration

### Requirement: Guided creation of a global attribute for the selected Type

When a valid Class, Family, and Type are selected, **Atributos** MUST offer **Crear atributo** through a guided GARFEX Dialog. The Dialog MUST identify the selected hierarchy context and provide a visible, accessible warning before confirmation and throughout the creation flow that the new `CARACTERISTICA` is global and may affect consumers beyond the selected Type.

A confirmed flow MUST create one new global `CARACTERISTICA`, then assign that exact created characteristic to the selected Type through one simple `APLICABILIDAD` and one `PRESENTACION`. The `APLICABILIDAD` MUST contain the selected Class, Family, Type, and newly created Characteristic references, MUST use exactly one of `REQUIRED`, `OPTIONAL`, or `FORBIDDEN`, and MUST contain the required empty rules collection. The Dialog MUST NOT offer `CONDITIONAL`, a conditional-rule builder, or any local condition evaluation. `PRESENTACION` MUST contain the selected Class, Family, Type, and newly created Characteristic references and all other descriptor-required values. The flow MUST NOT create a Type-local substitute for the global characteristic, infer required values, or assign a different characteristic.

The interface MUST keep explicit, accessible state for each public write step: characteristic creation, applicability creation, presentation creation, and reconciliation. It MUST advance only after the prior response fully validates. Every step MUST fail closed before HTTP without a valid configurable local actor or the exact public request representation. The generic public REST writes are non-transactional: a confirmed earlier step combined with a failed, conflicted, or unconfirmed later step MUST be reported as partial success requiring reconciliation; the interface MUST NOT claim rollback, atomicity, or overall success, and MUST NOT issue a compensating write or permanent deletion. A user MUST explicitly choose any retry or reconciliation action from the recorded step state.

After a write that is confirmed or whose result is unconfirmed, the interface MUST refresh the effective attribute projection only from Core for the captured Class, Family, and Type context. It MUST NOT optimistically insert or compose the attribute, use Convex, a fallback, local persistence, `POST /evaluate`, or a local business-rule evaluator to determine the projection. A stale refresh or a response for another dialog or hierarchy context MUST NOT replace the current projection.

#### Scenario: Guided creation assigns the newly global characteristic to the selected Type

- GIVEN valid selected Class, Family, and Type context, a valid actor, and all descriptor-required values
- WHEN the user confirms **Crear atributo** with mode `REQUIRED`, `OPTIONAL`, or `FORBIDDEN`
- THEN the Dialog creates a new global `CARACTERISTICA` and uses that confirmed characteristic for one simple `APLICABILIDAD` and one `PRESENTACION` for the selected Type
- AND the effective projection is refreshed only from Core after the writes

#### Scenario: Conditional authoring is unavailable

- GIVEN the user opens **Crear atributo**
- WHEN the Dialog presents applicability choices
- THEN it offers only `REQUIRED`, `OPTIONAL`, and `FORBIDDEN`
- AND it exposes neither `CONDITIONAL` nor a conditional-rule builder or local rule evaluation

#### Scenario: A missing actor prevents every creation step

- GIVEN the selected hierarchy context is valid but the local actor is absent, blank, or invalid
- WHEN the user attempts to confirm **Crear atributo**
- THEN the Dialog communicates the configuration failure before the first write
- AND it sends no `CARACTERISTICA`, `APLICABILIDAD`, or `PRESENTACION` request

#### Scenario: Partial success is reconciled without fictitious rollback

- GIVEN `CARACTERISTICA` creation has been confirmed and a later assignment step fails, conflicts, or has an unconfirmed network outcome
- WHEN the Dialog reports the operation
- THEN it identifies the confirmed and unresolved steps as partial success requiring reconciliation
- AND it neither claims atomic completion nor sends a compensating delete or automatic retry
- AND it refreshes the captured context only from Core before a user explicitly retries or reconciles

#### Scenario: Arrow focus does not activate an attribute

- GIVEN an eligible attribute row has focus
- WHEN the user presses `ArrowUp` or `ArrowDown`
- THEN focus moves only according to the existing spatial-navigation contract
- AND no detail Dialog opens or attribute write begins
- WHEN the user presses `Enter`
- THEN the focused row opens its detail Dialog

## MODIFIED Requirements

### Requirement: Jerarquía y lecturas contextuales

El runtime MUST mostrar el orden semántico `Clase → Familia → Tipo` y leer cada nivel únicamente mediante el listado REST público del `kind` correspondiente, con `scope`, `text`, `limit` y `offset` documentados. La lista de `FAMILIA` MUST enviar `classCode` con el código de la Clase contextual seleccionada; la lista de `TIPO` MUST enviar `familyCode` con el código de la Familia contextual seleccionada. Los filtros `classCode` y `familyCode` MUST omitirse para `CLASE` y todo kind sin el padre documentado; el frontend MUST NOT enviarlos por conveniencia ni depender de que el backend los ignore. Los records MUST validarse y mapearse desde `CatalogRecord`; cada record de `FAMILIA` MUST referenciar por `class` el código solicitado y cada record de `TIPO` MUST referenciar por `family` el código solicitado. Una discrepancia MUST hacer fallar la página completa antes de React. Al cambiar la Clase, el sistema MUST limpiar Familia y Tipo, y reiniciar los offsets de Familia y Tipo; al cambiar la Familia, MUST limpiar Tipo y reiniciar su offset. El frontend MUST NOT consultar un nivel dependiente sin padre válido ni presentar una relación hija como confirmada sin esas validaciones. El contrato todavía no documenta orden estable, por lo que la carga contextual MUST NOT prometer continuidad, exhaustividad, deduplicación ni posición estable entre páginas.

(Previously: La jerarquía leía Clases, Familias y Tipos mediante RPC Convex con filtros por padre y cursores.)

#### Scenario: Lectura de Clase con REST documentado

- GIVEN Catálogo activo y una ventana de Clase solicitada
- WHEN el adapter solicita `CLASE` con parámetros REST documentados
- THEN entrega sólo records REST válidos mapeados para Clase
- AND usa `offset` y `limit`, sin cursor Convex

#### Scenario: La Clase seleccionada acota Familias y reinicia descendientes

- GIVEN una Clase contextual con código conocido, una Familia, un Tipo y offsets de descendientes ya cargados
- WHEN la persona selecciona otra Clase
- THEN la siguiente lista de `FAMILIA` envía el `classCode` de la nueva Clase
- AND Familia y Tipo se limpian y sus offsets se reinician

#### Scenario: La Familia seleccionada acota Tipos y reinicia el offset

- GIVEN una Familia contextual con código conocido y un offset de Tipo ya cargado
- WHEN la persona selecciona otra Familia
- THEN la siguiente lista de `TIPO` envía el `familyCode` de la nueva Familia
- AND Tipo se limpia y su offset se reinicia

#### Scenario: Una referencia devuelta que no coincide invalida la página

- GIVEN una página de `FAMILIA` o `TIPO` solicitada con el código de su padre contextual
- WHEN algún record devuelve una referencia de padre con un código distinto
- THEN el adapter falla la página completa antes de React
- AND no muestra, mezcla ni corrige localmente los records recibidos

#### Scenario: La carga jerárquica no declara orden estable

- GIVEN varias páginas de Familia o Tipo solicitadas con su filtro de padre documentado
- WHEN el flujo ofrece navegación paginada
- THEN usa únicamente offset, limit y flags REST devueltos
- AND no promete orden estable, exhaustividad ni ausencia de duplicados entre páginas

### Requirement: Creación contextual limitada

La CTA contextual y las acciones de teclado MUST representar sólo creaciones REST documentadas y respaldadas por el flujo. Crear `CLASE` MUST enviar un `actor` local configurado y los valores requeridos por su descriptor (`code`, `name`, `plural`, `slug`) como valores tipados; Crear `FAMILIA` y `TIPO` MUST enviar los valores requeridos por sus descriptores, incluidas las referencias documentadas `class` y `family` cuando corresponda. `id`, `revision` y `expectedRevision` MUST tratarse como `string`. Sin actor, padre contextual válido o contrato suficiente para el lifecycle y feedback visible, la acción MUST fallar cerrada o quedar bloqueada explícitamente antes de enviar HTTP. E y Del continúan ausentes mientras no exista una capacidad aprobada.

(Previously: Las CTAs creaban Clase, Familia y Tipo mediante tres RPC Convex y sus IDs de padre.)

#### Scenario: Crear Clase con descriptor REST

- GIVEN una persona proporciona los valores requeridos válidos de `CLASE` y existe actor local configurado
- WHEN confirma Nueva Clase
- THEN el adapter envía únicamente el payload REST documentado con `actor` y valores tipados requeridos
- AND la interfaz no autogenera `plural`, `slug` ni otra regla de negocio

#### Scenario: Crear descendiente sin actor o padre

- GIVEN que falta el actor local o el padre contextual explícito requerido
- WHEN la persona intenta crear una Familia o un Tipo
- THEN la interfaz explica el bloqueo antes de enviar la petición
- AND no inventa ni reutiliza una referencia de padre

### Requirement: Frontera

El frontend MUST validar las respuestas REST desconocidas antes de React y MUST NOT introducir backend propio, almacenamiento, fixtures runtime, fallback Convex, cursores sintéticos ni semánticas locales de catálogo. El alcance visible de Catálogo MUST limitarse a los comportamientos REST demostrados para Clase, Familia y Tipo; atributos, opciones, unidades, políticas, aplicabilidad, presentación, estados efectivos, razones, violaciones, actualización y lifecycle sólo MAY integrarse tras una auditoría operación por operación del contrato público y, cuando exista una brecha, una decisión humana explícita.

(Previously: La frontera validaba respuestas Convex y excluía capacidades administrativas no aprobadas.)

#### Scenario: Indicador Convex no se reconstruye

- GIVEN un record o flujo que antes mostraba `effective`, razones, estado agregado o violaciones
- WHEN el contrato REST no documenta esa salida
- THEN Catálogo no calcula ni presenta un equivalente local
- AND comunica el alcance reducido o la brecha conforme al flujo afectado

#### Scenario: Regresión accesible de una acción soportada

- GIVEN una lectura o creación de Catálogo respaldada por REST
- WHEN se prueban sus estados de carga, error o éxito documentado
- THEN conserva los componentes visuales existentes, foco visible y operación de teclado aplicable
- AND no añade capturas globales de teclado por la migración

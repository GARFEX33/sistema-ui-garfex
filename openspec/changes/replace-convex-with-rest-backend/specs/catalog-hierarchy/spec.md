# Delta for Jerarquía del Catálogo

## ADDED Requirements

### Requirement: Atributos efectivos de Tipo como composición de pantalla

Con Clase, Familia y Tipo contextuales seleccionados, la pantalla MUST solicitar `GET /v1/types/{encodedTypeCode}/attributes/effective?classCode={encodedClassCode}&familyCode={encodedFamilyCode}`, donde cada código de ruta o query se codifica para URL. Esta petición MUST ser la única fuente de composición de pantalla para el baseline estático de atributos del Tipo; no contiene valores de Recurso conocidos. Core resuelve sus defaults condicionales en esa respuesta, y la pantalla MUST NOT inventar ni reevaluar valores o reglas. La pantalla MUST NOT consultar Convex, reconstruir la respuesta con lecturas base ni sustituirla por el filtro genérico `characteristicCode`. `characteristicCode` MAY usarse sólo en lecturas base de catálogo donde el contrato lo documente, pero MUST NOT reemplazar, filtrar localmente ni recomponer el endpoint efectivo de pantalla. El adapter MUST validar el `EffectiveAttributesResponse` completo antes de React: su `typeCode` MUST coincidir exactamente con el Tipo contextual; cada `EffectiveAttribute`, `CharacteristicDescriptor`, `EffectiveAttributeSource`, regla y valor anidado MUST satisfacer el schema público exacto y sus campos requeridos, opcionales y nulos. `effectiveMode` MUST ser exactamente `REQUIRED`, `OPTIONAL`, `CONDITIONAL` o `FORBIDDEN`; cada atributo MUST incluir `options` como arreglo de objetos exactos `{ code, label }` con ambos campos string; `source` y todo dominio anidado MUST limitarse a los literales documentados por sus schemas públicos. Cualquier envelope, `typeCode`, campo anidado, regla, valor tipado o literal de dominio inválido MUST hacer fallar la respuesta completa antes de React.

La pestaña Atributos MUST presentar como superficie primaria una lista compacta y pulida, en el mismo orden emitido por Core, con sólo la identidad de cada atributo: su nombre y, únicamente cuando ayude a desambiguar, código o tipo de valor como texto secundario sobrio. Cada fila MUST ofrecer exactamente una acción clara **Ver detalle** y MUST NOT mostrar inline `effectiveMode`, `source`, `identityParticipates`, `notApplicable`, posición, `optionSetCode`, `options` ni `rules`.

**Ver detalle** MUST abrir el Dialog compartido de GARFEX en modo sólo lectura. El Dialog MUST presentar los datos completos emitidos por Core —`effectiveMode`, `source`, `rules`, `identityParticipates`, `notApplicable`, `hasPosition`, posición cuando exista, `optionSetCode` y `options`— sin reordenarlos, resumirlos como cálculo local ni omitirlos por la composición compacta. Las `options` son opciones de baseline, no valores de Recurso seleccionados. Si `hasPosition` es falso, ni la lista ni el Dialog MUST reclamar o inventar una posición u orden para ese atributo; si es verdadero, el Dialog sólo MAY presentar la posición entregada. La interfaz MUST NOT derivar ni estrechar opciones por valores de Recurso; esa evaluación pertenece exclusivamente a `POST /evaluate` cuando el Creador disponga de valores.

El Dialog MUST ser operable por teclado, contener el foco sólo mientras esté activo, cerrarse mediante su control **Cerrar** o `Escape`, y restaurar el foco al control **Ver detalle** que lo abrió cuando éste siga siendo elegible, o al fallback accesible de la pestaña cuando no lo sea. Su contenido MUST adaptarse al viewport disponible sin ocultar sus datos ni convertir la lista primaria en una superficie de detalle editable.

Ante cambio de Clase, Familia o Tipo, la pantalla MUST descartar la respuesta efectiva anterior, restablecer sus estados de carga/error/vacío y aceptar únicamente la respuesta correspondiente al contexto vigente; una respuesta tardía de un contexto anterior MUST descartarse. Mientras la petición vigente está pendiente MUST mostrar un estado de carga diseñado y accesible; un error de red, HTTP, parsing o validación MUST mostrar un estado de error diseñado, explícito y con la recuperación existente, sin conservar resultados obsoletos como actuales; una respuesta válida sin atributos MUST mostrar un estado vacío confirmado y diseñado.

El adapter paginado de `GET /v1/catalog/APLICABILIDAD?typeCode=...` permanece como evidencia y capacidad lower-level/administrativa de Unidad 6, pero MUST NOT ser la ruta de composición de esta pantalla efectiva.

#### Scenario: El contexto seleccionado carga atributos efectivos de Core

- GIVEN una Clase, Familia y Tipo contextuales con códigos validados
- WHEN Catálogo compone la vista de atributos del Tipo
- THEN solicita el endpoint efectivo con el Tipo codificado en ruta y los códigos Clase y Familia codificados en query
- AND no consulta Convex, aplicabilidades base ni `characteristicCode` para sustituir esa respuesta

#### Scenario: Un DTO efectivo incoherente invalida la respuesta completa

- GIVEN una respuesta del endpoint efectivo para un contexto seleccionado
- WHEN su `typeCode` no coincide, falta o invalida un campo anidado, o contiene un `effectiveMode`, source o valor fuera del dominio público
- THEN el adapter falla la respuesta completa antes de React
- AND no presenta atributos parciales ni corrige o evalúa datos localmente

#### Scenario: La lista primaria conserva el orden de Core sin exponer detalle inline

- GIVEN una respuesta efectiva válida con atributos de distintos sources y modos
- WHEN la pestaña Atributos presenta la lista primaria
- THEN conserva el orden emitido por Core y muestra sólo identidad más texto secundario de desambiguación cuando aplique
- AND cada fila ofrece únicamente **Ver detalle**, sin exponer inline modos, sources, reglas, opciones ni posición

#### Scenario: Cambio contextual descarta una respuesta obsoleta

- GIVEN una petición efectiva pendiente para un Tipo contextual anterior
- WHEN la persona cambia Clase, Familia o Tipo antes de que llegue la respuesta
- THEN la pantalla limpia el resultado anterior y muestra el estado de carga del contexto vigente
- AND descarta la respuesta tardía anterior

#### Scenario: Los estados remoto y vacío son explícitos

- GIVEN una petición efectiva para el contexto vigente
- WHEN falla por red, HTTP, parsing o validación
- THEN la pantalla muestra un error accesible y no conserva atributos anteriores como actuales
- WHEN recibe una respuesta válida sin atributos
- THEN muestra un estado vacío confirmado

#### Scenario: El detalle muestra datos completos sin evaluación local

- GIVEN un atributo efectivo válido con `options` de `{ code, label }` y `hasPosition` falso
- WHEN la persona activa **Ver detalle**
- THEN el Dialog muestra las opciones y demás datos de Core en modo sólo lectura
- AND no muestra una posición, valor de Recurso seleccionado ni evaluación dinámica inventados

#### Scenario: El Dialog conserva teclado, cierre y foco

- GIVEN una persona que abre **Ver detalle** desde una fila elegible
- WHEN usa `Escape` o activa **Cerrar**
- THEN el Dialog se cierra y restaura el foco a ese control **Ver detalle**
- AND mientras permanece abierto contiene el foco y mantiene sus datos accesibles en el viewport

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

### Requirement: Bases de opciones y presentación permanecen separadas

El adapter lower-level de lectura directa de `APLICABILIDAD` MUST limitarse a aplicabilidades y, opcionalmente, a la definición exacta de su Característica. Ese adapter MUST NOT cargar, combinar ni inferir `OPCION`, valores permitidos, evaluación, herencia o `PRESENTACION` para completar una vista, ni sustituir el endpoint efectivo de pantalla. `OPCION` y `PRESENTACION` MAY abordarse únicamente como bases de lectura separadas, con sus propios filtros públicos, validación de records y decisión posterior de producto.

#### Scenario: Una aplicabilidad directa no desencadena evaluación ni bases ajenas

- GIVEN una página válida de aplicabilidades directas para un Tipo
- WHEN la interfaz presenta sus filas
- THEN no solicita opciones, presentación, valores permitidos ni una evaluación para completar el resultado
- AND mantiene bloqueadas las semánticas de efectividad, herencia, razones y allowed values

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

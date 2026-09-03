# Especificación de Jerarquía Base del Catálogo

## Purpose

Ofrecer en workstation una capacidad de Catálogo para recorrer, consultar y crear Clase → Familia → Tipo, preservando el contexto jerárquico y las relaciones padre inmutables sin ampliar el producto hacia Recursos ni inventar comportamiento no demostrado.

## Requirements

### Requirement: Acceso workstation y convivencia con Bandeja

El sistema MUST ofrecer Catálogo como destino de la navegación persistente workstation y MUST conservar Bandeja como destino accesible dentro del mismo shell. El sistema MUST identificar como activo el destino resuelto y MUST NOT presentar Catálogo como sustituto de Bandeja.

#### Scenario: Entrada a Catálogo desde el shell

- GIVEN una sesión workstation en el shell GARFEX
- WHEN el usuario activa el destino de Catálogo
- THEN se resuelve la superficie de Catálogo
- AND Catálogo queda identificado como destino activo
- AND Bandeja continúa disponible en la navegación persistente

#### Scenario: Regreso a Bandeja

- GIVEN una sesión workstation en Catálogo
- WHEN el usuario activa el destino de Bandeja
- THEN se resuelve la ruta de Bandeja
- AND la capacidad interna de Bandeja no fue alterada por Catálogo

### Requirement: Contexto jerárquico canónico

El sistema MUST presentar y conservar el contexto en el orden Clase → Familia → Tipo. Una Familia contextual MUST pertenecer a la Clase contextual mediante `claseRecursoId`, y un Tipo contextual MUST pertenecer a la Familia contextual mediante `familiaRecursoId`. El sistema MUST NOT invertir estos niveles ni incorporar Recurso como nivel navegable de este cambio.

#### Scenario: Recorrido de la jerarquía

- GIVEN una Clase que contiene una Familia y una Familia que contiene un Tipo
- WHEN el usuario recorre los niveles disponibles
- THEN el contexto expresa Clase antes de Familia y Familia antes de Tipo
- AND cada nivel dependiente permanece asociado a su padre contextual
- AND no se ofrece Recurso como nivel del recorrido

#### Scenario: Cambio de Clase contextual

- GIVEN una Clase contextual con una Familia y un Tipo contextuales
- WHEN el usuario cambia a otra Clase
- THEN el sistema MUST NOT conservar como contextuales la Familia ni el Tipo de la Clase anterior
- AND cualquier Familia presentada para el nuevo contexto corresponde a la nueva Clase

#### Scenario: Cambio de Familia contextual

- GIVEN una Familia contextual con un Tipo contextual
- WHEN el usuario cambia a otra Familia de la misma Clase
- THEN el sistema MUST NOT conservar como contextual el Tipo de la Familia anterior
- AND cualquier Tipo presentado para el nuevo contexto corresponde a la nueva Familia

### Requirement: Lecturas dependientes filtradas por el padre contextual

El sistema MUST obtener las Familias de una Clase mediante la firma nominal `catalogoAdmin/jerarquia:listarFamilias({ claseRecursoId?, cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`, enviando la `claseRecursoId` del contexto seleccionado. El sistema MUST obtener los Tipos de una Familia mediante la firma nominal `catalogoAdmin/jerarquia:listarTipos({ cursor?, familiaRecursoId?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`, enviando la `familiaRecursoId` del contexto seleccionado. La lectura de Clases MUST usar la firma nominal `catalogoAdmin/jerarquia:listarClases({ cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`.

#### Scenario: Consulta de Familias de una Clase

- GIVEN una Clase contextual con identificador conocido
- WHEN el sistema solicita las Familias para ese contexto
- THEN invoca `catalogoAdmin/jerarquia:listarFamilias`
- AND envía la `claseRecursoId` de la Clase contextual
- AND no presenta como pertenecientes al contexto items cuya `claseRecursoId` sea distinta

#### Scenario: Consulta de Tipos de una Familia

- GIVEN una Familia contextual con identificador conocido
- WHEN el sistema solicita los Tipos para ese contexto
- THEN invoca `catalogoAdmin/jerarquia:listarTipos`
- AND envía la `familiaRecursoId` de la Familia contextual
- AND no presenta como pertenecientes al contexto items cuya `familiaRecursoId` sea distinta

#### Scenario: Consulta del nivel Clase

- GIVEN una sesión en la capacidad de Catálogo
- WHEN el sistema solicita las Clases disponibles
- THEN invoca `catalogoAdmin/jerarquia:listarClases`
- AND no sustituye la respuesta con datos locales o fixtures runtime

### Requirement: Lectura nominal por identificador

Cuando el comportamiento aprobado requiera obtener una entidad individual, el sistema MUST limitarse a `catalogoAdmin/jerarquia:obtenerClase({ claseRecursoId })`, `catalogoAdmin/jerarquia:obtenerFamilia({ familiaRecursoId })` o `catalogoAdmin/jerarquia:obtenerTipo({ tipoRecursoId })`, según el nivel solicitado. El sistema MUST NOT inferir la semántica de ausencia ni un tratamiento visual sin evidencia runtime y aprobación correspondiente.

#### Scenario: Obtención de una entidad conocida

- GIVEN un identificador conocido de Clase, Familia o Tipo
- WHEN el sistema requiere consultar individualmente esa entidad
- THEN usa la operación `obtener*` correspondiente al nivel
- AND envía únicamente el identificador nominal requerido por esa operación

#### Scenario: Ausencia sin semántica demostrada

- GIVEN que la especificación nominal no define qué significa una ausencia en `obtener*`
- WHEN no existe evidencia runtime aprobada para ese caso
- THEN el sistema MUST NOT presentar un mensaje, causa o recuperación inventados
- AND el tratamiento del caso permanece como gate de evidencia no resuelto

### Requirement: Continuación de listados mediante cursores declarados

Para cada listado, el sistema MUST consumir la forma nominal `{ continuationCursor, isExhausted, items }`. Una solicitud de continuación MUST usar exclusivamente el `continuationCursor` devuelto por la página previa como argumento `cursor` de la misma operación y del mismo contexto de filtros. El sistema MUST detener la continuación cuando `isExhausted` sea verdadero y MUST NOT inventar límites de `pageSize`, ordenamiento, estabilidad o recuperación de cursores inválidos.

#### Scenario: Continuación disponible

- GIVEN una página de listado con `isExhausted` igual a falso y un `continuationCursor`
- WHEN el sistema solicita la página siguiente
- THEN invoca la misma operación de listado
- AND envía como `cursor` el `continuationCursor` de la página previa
- AND conserva los filtros contextuales de esa secuencia

#### Scenario: Listado agotado

- GIVEN una página de listado con `isExhausted` igual a verdadero
- WHEN el sistema evalúa si existe continuación
- THEN no solicita otra página para esa secuencia
- AND no fabrica un cursor alternativo

#### Scenario: Comportamiento del cursor aún no demostrado

- GIVEN que no hay evidencia sobre cursores inválidos, estabilidad, orden o límites efectivos de `pageSize`
- WHEN se especifica o presenta la paginación
- THEN esas dimensiones permanecen como gates de evidencia no resueltos
- AND el sistema MUST NOT comunicar garantías inventadas sobre ellas

### Requirement: Creación nominal de Clase

El sistema MUST crear una Clase únicamente mediante `catalogoAdmin/jerarquia:crearClase({ activo?, clave, descripcion?, nombre })`. El resultado nominal aceptado MUST tener la forma `{ disposition: "CREATED", item }`; cualquier feedback o transición posterior requiere evidencia runtime y aprobación visual.

#### Scenario: Envío de una nueva Clase

- GIVEN los argumentos de Clase que el usuario ha proporcionado mediante el comportamiento aprobado
- WHEN el usuario confirma la creación
- THEN el sistema invoca `catalogoAdmin/jerarquia:crearClase`
- AND limita el envío a `activo?`, `clave`, `descripcion?` y `nombre`
- AND no usa persistencia frontend ni una operación administrativa distinta

### Requirement: Creación de Familia dentro de una Clase explícita

El sistema MUST crear una Familia únicamente mediante `catalogoAdmin/jerarquia:crearFamilia({ activo?, claseRecursoId, clave, descripcion?, nombre })`. La creación MUST enviar como `claseRecursoId` el identificador de la Clase contextual explícita y MUST aceptar nominalmente `{ disposition: "CREATED", item }` como forma de respuesta.

#### Scenario: Envío de una nueva Familia

- GIVEN una Clase contextual explícita y los argumentos aprobados para una nueva Familia
- WHEN el usuario confirma la creación de la Familia
- THEN el sistema invoca `catalogoAdmin/jerarquia:crearFamilia`
- AND envía la `claseRecursoId` de la Clase contextual
- AND limita los demás argumentos a `activo?`, `clave`, `descripcion?` y `nombre`

#### Scenario: Familia sin Clase contextual

- GIVEN que no existe una Clase contextual explícita
- WHEN se evalúa la creación de una Familia
- THEN el sistema MUST NOT enviar `catalogoAdmin/jerarquia:crearFamilia`
- AND MUST NOT fabricar, inferir ni reutilizar una `claseRecursoId` de otro contexto

### Requirement: Creación de Tipo dentro de una Familia explícita

El sistema MUST crear un Tipo únicamente mediante `catalogoAdmin/jerarquia:crearTipo({ activo?, clave, descripcion?, familiaRecursoId, nombre })`. La creación MUST enviar como `familiaRecursoId` el identificador de la Familia contextual explícita y MUST aceptar nominalmente `{ disposition: "CREATED", item }` como forma de respuesta.

#### Scenario: Envío de un nuevo Tipo

- GIVEN una Familia contextual explícita y los argumentos aprobados para un nuevo Tipo
- WHEN el usuario confirma la creación del Tipo
- THEN el sistema invoca `catalogoAdmin/jerarquia:crearTipo`
- AND envía la `familiaRecursoId` de la Familia contextual
- AND limita los demás argumentos a `activo?`, `clave`, `descripcion?` y `nombre`

#### Scenario: Tipo sin Familia contextual

- GIVEN que no existe una Familia contextual explícita
- WHEN se evalúa la creación de un Tipo
- THEN el sistema MUST NOT enviar `catalogoAdmin/jerarquia:crearTipo`
- AND MUST NOT fabricar, inferir ni reutilizar una `familiaRecursoId` de otro contexto

### Requirement: Relaciones padre inmutables después de la creación

El sistema MUST tratar Familia→Clase y Tipo→Familia como relaciones inmutables después de crear la entidad. El sistema MUST NOT exponer una acción o campo que cambie esos padres y MUST NOT enviar IDs de padre mediante operaciones de actualización. Las operaciones de actualización, activación y desactivación MUST permanecer fuera de esta capacidad.

#### Scenario: Consulta de una Familia existente

- GIVEN una Familia existente asociada a una Clase
- WHEN el usuario consulta esa Familia
- THEN su Clase puede formar parte del contexto no editable aprobado
- AND no existe un control para reemplazar `claseRecursoId`
- AND no se emite una operación de actualización de la relación

#### Scenario: Consulta de un Tipo existente

- GIVEN un Tipo existente asociado a una Familia
- WHEN el usuario consulta ese Tipo
- THEN su Familia puede formar parte del contexto no editable aprobado
- AND no existe un control para reemplazar `familiaRecursoId`
- AND no se emite una operación de actualización de la relación

### Requirement: Integración de Catálogo subordinada al contrato Keyboard First canónico

Los controles, composites y overlays aprobados de Catálogo MUST ser operables por teclado, MUST tener nombre accesible y foco visible conforme a WCAG 2.2 AA, y MUST consumir sin redefinir ni debilitar la especificación canónica `keyboard-interaction` y la sección 11 del brief. En Catálogo, `Tab` y `Shift+Tab` MUST conservar el recorrido nativo entre zonas; las flechas sin modificar MUST navegar por geometría física entre controles elegibles; la edición y el IME MUST suspender la navegación espacial y los atajos de una sola tecla; `N` MUST activar exactamente la acción contextual real y habilitada `Nueva Clase`, `Nueva Familia` o `Nuevo Tipo`; `?` MUST resolverse globalmente por su carácter semántico; el `Ctrl/Cmd+K` exacto de la plataforma MUST seguir abriendo Command Palette; y `Ctrl+N` MUST permanecer sin captura. La palette, la ayuda y las pistas `kbd` de CTA MUST derivarse del registro de comandos. La contención de foco sólo MAY existir dentro de un modal o diálogo activo, y su cierre MUST restaurar el foco conforme al contrato canónico. `E` y `Del` MUST permanecer ausentes mientras no exista capacidad aprobada de edición o borrado.

Un composite local MAY mantener un único punto de tabulación o estado roving únicamente para representar su item activo. Ese mecanismo MUST permanecer subordinado al arbitraje, la elegibilidad y la geometría física canónicos; MUST NOT elegir destinos por índice, orden DOM, texto u orden declarado de columnas; MUST NOT capturar `Tab`; y MUST NOT instalar un orden roving para el documento. `Enter` MUST activar sólo el control enfocado que exponga una acción real.

#### Scenario: Tabulación nativa entre zonas de Catálogo

- GIVEN Catálogo activo sin modal ni diálogo abierto
- WHEN el usuario presiona `Tab` o `Shift+Tab`
- THEN el navegador conserva el recorrido secuencial nativo entre las zonas mayores
- AND el foco puede entrar y salir del navegador jerárquico sin contención no modal
- AND cada destino enfocado muestra un indicador perceptible

#### Scenario: Flechas físicas subordinan cualquier roving local

- GIVEN el foco en un control elegible del navegador jerárquico y varios controles elegibles alrededor suyo
- WHEN el navegador de Catálogo gestiona una flecha sin modificar
- THEN el destino se determina por la geometría física vigente conforme al contrato canónico
- AND la pertenencia al composite o su estado roving no sustituye semiplano, proximidad y alineación perpendicular por índice, orden DOM, texto u orden declarado de columnas
- AND el movimiento no crea ni enfoca una acción o superficie inexistente

#### Scenario: Edición y composición no reciben interferencia

- GIVEN el foco en un campo, formulario, autocomplete, `contenteditable` o descendiente editable de Catálogo, o una composición IME activa
- WHEN el usuario presiona una flecha, `N`, `n` o una tecla cuyo carácter sea `?`
- THEN Catálogo no mueve el foco espacialmente
- AND no abre una acción Nueva ni la ayuda contextual
- AND preserva la edición, la composición y cualquier consumo anterior del evento

#### Scenario: N activa la creación contextual real

- GIVEN Catálogo activo sin edición, IME ni overlay de mayor precedencia
- AND el registro expone una acción contextual real, visible y habilitada para el nivel vigente
- WHEN el usuario presiona `N` o `n` sin modificadores
- THEN se activa exactamente `Nueva Clase` sin selección, `Nueva Familia` con Clase seleccionada o `Nuevo Tipo` con Familia seleccionada
- AND la misma entrada del registro alimenta la palette, la ayuda y la pista `kbd` de la CTA

#### Scenario: No se anticipan acciones o atajos inexistentes

- GIVEN que Recurso, edición y borrado permanecen fuera del alcance
- WHEN el usuario recorre los controles, presiona `Enter` o consulta los comandos disponibles
- THEN Catálogo no fabrica un atajo, control, comando, ruta, diálogo ni mutación para completar esas capacidades ausentes
- AND `E` y `Del` no se registran ni se muestran
- AND no aparece ninguna acción de Recurso en este cambio

#### Scenario: Ayuda por carácter semántico

- GIVEN Catálogo es una superficie soportada, no editable y sin un contexto anterior que consuma el evento
- WHEN el teclado produce `event.key` igual a `?`, incluidos los modificadores necesarios para la distribución activa
- THEN se abre la ayuda contextual de Catálogo
- AND la ayuda muestra únicamente comandos reales disponibles en el contexto vigente
- AND la detección no depende de `event.code` ni de la posición física de `/`

#### Scenario: Command Palette conserva el atajo exacto de plataforma

- GIVEN que ningún editable, IME, control local, composite, overlay o feature consume el evento antes del atajo global
- WHEN el usuario presiona `Ctrl+K` exacto en Windows o Linux, o `Cmd+K` exacto en macOS
- THEN se abre la Command Palette existente
- AND Catálogo no interpreta como ese atajo variantes con `Shift`, `Alt` o el modificador de plataforma opuesto

#### Scenario: Ctrl+N permanece reservado

- GIVEN cualquier contexto de Catálogo
- WHEN el usuario presiona `Ctrl+N`
- THEN ningún manejador de Catálogo abre Clase, Familia, Tipo, Recurso ni otra acción
- AND GARFEX no captura ni cancela el comportamiento del navegador o sistema

#### Scenario: Contención y restauración exclusivas de diálogo

- GIVEN un modal o diálogo de Catálogo abierto desde un opener conocido
- WHEN el usuario recorre el foco y después presiona `Escape` o completa el cierre de la capa activa
- THEN sólo se cierra o cancela la capa activa de mayor precedencia
- AND el foco MAY permanecer contenido sólo mientras el modal o diálogo siga activo
- AND el cierre elimina la contención y restaura el foco al opener si continúa elegible
- AND si el opener dejó de ser elegible, el foco se mueve al fallback accesible explícito de la superficie activa
- AND una superficie no modal no instala contención equivalente

### Requirement: Runtime sin sustitutos ficticios

El runtime de Catálogo MUST usar exclusivamente la superficie pública Convex `catalogoAdmin/jerarquia` seleccionada para las lecturas y creaciones de esta especificación. El sistema MUST NOT usar `catalogoRecursos/catalogo`, fixtures, datos locales, persistencia frontend ni fallbacks para aparentar disponibilidad o sustituir una respuesta autoritativa.

#### Scenario: Fuente de datos runtime

- GIVEN la capacidad de Catálogo ejecutándose en runtime
- WHEN el sistema consulta o crea una Clase, Familia o Tipo
- THEN la operación pertenece a `catalogoAdmin/jerarquia`
- AND ningún fixture ni dato local actúa como respuesta de producto
- AND no se invoca `catalogoRecursos/catalogo`

### Requirement: Frontera estricta del alcance administrativo

El sistema MUST limitar la capacidad a navegación, lectura y creación de Clase, Familia y Tipo. El sistema MUST NOT ofrecer actualización, activación, desactivación, Recursos, unidades, atributos, reglas, presentación, compatibilidad, publicación, comportamiento responsive ni interacción específica de touch. Los campos `effective`, `effectiveReasons`, `aggregateStatus` y `violations` MUST NOT recibir semántica o presentación inferida sin evidencia aprobada.

#### Scenario: Inspección de capacidades disponibles

- GIVEN la capacidad de Catálogo implementada
- WHEN se inspeccionan sus rutas, acciones y datos presentados
- THEN sólo existen comportamientos de navegación, lectura y creación para Clase, Familia y Tipo
- AND no existe una acción para los no objetivos del cambio
- AND los campos sin semántica demostrada no se convierten en reglas o estados UX inventados

### Requirement: Gates de evidencia runtime y autoridad visual

Los errores, mensajes, permisos efectivos, reglas de nombres o unicidad, estados de carga, vacío, sin resultados, datos parciales, fallos de creación y recuperación MUST permanecer como gates de evidencia no resueltos mientras no exista evidencia runtime y aprobación de producto o visual. `design` y `apply` MUST esperar a que OpenPencil haya sido recuperado, auditado y corregido para expresar Clase → Familia → Tipo.

#### Scenario: Incógnita runtime sin evidencia

- GIVEN una condición runtime cuyo comportamiento no está declarado por el contrato nominal
- WHEN no existe evidencia aprobada para esa condición
- THEN el sistema MUST NOT asignarle un permiso, mensaje, causa, estado visual ni recuperación inventados
- AND la condición permanece registrada como gate no resuelto

#### Scenario: Autoridad visual todavía pendiente

- GIVEN que OpenPencil no ha completado recuperación, auditoría y corrección de la jerarquía
- WHEN se evalúa avanzar a `design` o `apply`
- THEN ninguna de esas fases queda autorizada
- AND la imagen preliminar no se usa como diseño final

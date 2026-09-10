# Especificación de Creación Keyboard First de Recursos

## Purpose

Permitir crear un Recurso maestro mediante un recorrido secuencial utilizable íntegramente con teclado, sin cambiar la autoridad backend, los contratos de creación ni el estado de la pantalla Maestro de Recursos.

## Requirements

### Requirement: Inicio con contexto heredado válido y borrador aislado

Al abrir **Nuevo recurso**, el sistema MUST construir un snapshot local de la selección actual de Maestro de Recursos y MUST heredar únicamente el prefijo continuo válido `Clase → Familia → Tipo`. Una Clase heredada MUST seguir presente entre los elementos actuales; una Familia MUST seguir presente y pertenecer a esa Clase; y un Tipo MUST seguir presente y pertenecer a esa Familia. El diálogo MUST comenzar en la primera etapa no heredada y MUST mantener las etapas heredadas disponibles para corrección. El snapshot y todo el borrador de creación MUST permanecer aislados de la selección, filtro efectivo y consulta activa de la pantalla.

#### Scenario: Se hereda el prefijo válido más profundo

- GIVEN que Maestro de Recursos tiene una Clase, Familia y Tipo aún presentes y relacionados correctamente
- WHEN la persona abre **Nuevo recurso**
- THEN el diálogo considera confirmadas las tres etapas heredadas
- AND inicia en la etapa de Unidad natural
- AND muestra la ruta heredada como navegable

#### Scenario: Se descarta un sufijo ausente, cruzado o stale

- GIVEN una selección de Maestro con una Familia ausente o que no pertenece a la Clase actual, o un Tipo ausente o que no pertenece a la Familia válida
- WHEN la persona abre **Nuevo recurso**
- THEN el diálogo conserva sólo el prefijo válido anterior al dato inválido
- AND inicia en la primera etapa no válida
- AND no adopta un descendiente ni una respuesta tardía de otro padre

#### Scenario: El diálogo no cambia la pantalla de fondo

- GIVEN un filtro jerárquico y una consulta activa en Maestro de Recursos
- WHEN la persona cambia una selección heredada dentro del diálogo o cancela el flujo
- THEN la selección jerárquica, el filtro efectivo y la consulta activa de la pantalla permanecen sin cambios
- AND los cambios pertenecen sólo al borrador local del diálogo

### Requirement: Selector jerárquico secuencial con filtro local y continuación explícita

Clase, Familia y Tipo MUST ser etapas visibles, separadas y confirmables del recorrido. Cada etapa MUST mostrar sólo candidatos pertenecientes al contexto padre vigente y MUST permitir filtrar por nombre visible únicamente entre las páginas ya cargadas. La interfaz MUST comunicar que el filtro es local y MUST ofrecer **Cargar más…** sólo cuando exista continuación; MUST NOT presentar el filtro como búsqueda de todo el backend ni cargar páginas automáticamente para aparentarlo. Los candidatos repetidos entre páginas MUST aparecer una sola vez.

El selector MUST conservar un único candidato activo elegible. Al cambiar el filtro o cargar otra página, si el candidato activo deja de ser visible, el sistema MUST mover el activo a un candidato visible sin confirmar selección alguna. La continuación MUST conservar el padre, el texto de filtro y las páginas válidas ya obtenidas.

#### Scenario: El filtro reduce sólo los candidatos cargados por nombre

- GIVEN la etapa de Familia con páginas cargadas y una continuación disponible
- WHEN la persona escribe texto que coincide con el nombre visible de una Familia cargada
- THEN la lista muestra sólo las Familias cargadas cuyo nombre coincide
- AND comunica que el alcance se limita a los elementos cargados
- AND no solicita una búsqueda backend ni afirma que no existan otras coincidencias

#### Scenario: Cargar más conserva el contexto y deduplica

- GIVEN una etapa jerárquica con texto de filtro, un padre vigente y una continuación disponible
- WHEN la persona activa **Cargar más…**
- THEN el sistema obtiene explícitamente la siguiente página para ese mismo padre
- AND conserva las páginas válidas y el texto de filtro
- AND muestra una sola vez cada candidato aunque su ID aparezca en más de una página

#### Scenario: El candidato activo se reajusta sin selección implícita

- GIVEN una etapa con un candidato activo visible sin confirmar
- WHEN un filtro o una página nueva hace que ese candidato deje de estar visible
- THEN el sistema designa un único candidato visible como activo cuando existe alguno
- AND no confirma ni avanza de etapa hasta una acción explícita de la persona

#### Scenario: Carga jerárquica vacía o fallida

- GIVEN que la carga vigente de una etapa jerárquica está pendiente, no devuelve candidatos o falla
- WHEN el diálogo presenta esa etapa
- THEN comunica respectivamente carga, ausencia confirmada o error de forma accesible
- AND ofrece reintento ante el error
- AND no permite confirmar un candidato inexistente ni avanzar mientras no haya una selección válida

### Requirement: Aplicación exclusiva de respuestas dependientes vigentes

El sistema MUST asociar cada lectura dependiente de Familia, Tipo, Unidad natural o atributos al contexto de Clase, Familia o Tipo que la originó. Sólo MUST aplicar una respuesta si ese contexto continúa vigente al resolverse. Al reemplazar una Clase, el borrador MUST limpiar Familia, Tipo, Unidad natural y atributos; al reemplazar una Familia MUST limpiar Tipo, Unidad natural y atributos; y al reemplazar un Tipo MUST limpiar Unidad natural y atributos antes de permitir continuar.

#### Scenario: Una respuesta anterior no reemplaza el contexto nuevo

- GIVEN que se solicitó una carga para un padre o Tipo anterior
- WHEN la persona cambia el padre o Tipo y después llega la respuesta anterior
- THEN el diálogo descarta esa respuesta
- AND conserva únicamente candidatos y datos pertenecientes al contexto vigente

#### Scenario: Un cambio de padre reinicia sólo los dependientes requeridos

- GIVEN un borrador con Clase, Familia, Tipo, Unidad y valores de atributos confirmados
- WHEN la persona reemplaza la Familia desde la ruta del diálogo
- THEN el sistema conserva la Clase y limpia Tipo, Unidad y atributos
- AND la persona debe confirmar un Tipo y sus datos dependientes antes de revisar o crear

### Requirement: Unidad natural explícita y elegible por Tipo

Después de confirmar un Tipo, el recorrido MUST presentar una etapa explícita de **Unidad natural**. Sus candidatos MUST derivarse exclusivamente de las políticas efectivas del Tipo y MUST hidratarse mediante `obtenerUnidad({ unidadId })` para mostrar su clave, nombre, símbolo cuando exista y estado vigente necesario. El sistema MUST ofrecer sólo unidades elegibles y efectivas para el Tipo; MUST NOT sustituir este conjunto por una lista general de unidades. Una unidad principal o seleccionada efectiva MAY ser el candidato activo inicial, pero la persona MUST confirmarla explícitamente antes de avanzar.

#### Scenario: La unidad confirmada pertenece a las políticas efectivas

- GIVEN un Tipo con políticas efectivas que identifican unidades elegibles
- WHEN la etapa de Unidad natural termina de resolver sus candidatos
- THEN la lista muestra sólo unidades hidratadas de esas políticas que continúan efectivas
- AND la persona debe confirmar una unidad visible para continuar
- AND el borrador conserva el `unidadId` de la unidad confirmada

#### Scenario: La Unidad natural no tiene candidato elegible

- GIVEN un Tipo cuyas políticas efectivas no producen una Unidad natural elegible
- WHEN el diálogo resuelve la etapa de Unidad natural
- THEN comunica una ausencia confirmada de opciones elegibles
- AND no inventa una unidad por defecto ni ofrece unidades ajenas a las políticas
- AND no permite avanzar a atributos

#### Scenario: La resolución de Unidad natural falla o queda invalidada

- GIVEN que la lectura de políticas o la hidratación de una Unidad natural falla, está pendiente o pertenece a un Tipo que fue reemplazado
- WHEN la persona intenta continuar
- THEN el diálogo comunica carga o error y ofrece reintento cuando corresponde
- AND bloquea el avance hasta que la resolución vigente produzca una unidad confirmada
- AND no conserva una unidad del Tipo anterior

### Requirement: Atributos y datos de Recurso se capturan secuencialmente

El sistema MUST resolver las asignaciones efectivas del Tipo, ordenarlas por `orden` y excluir las asignaciones `FORBIDDEN` o `NOT_APPLICABLE`. Cada atributo aplicable MUST presentarse de uno en uno con el control correspondiente a su tipo existente. Un atributo `REQUIRED` sin valor MUST bloquear el avance, mostrar un error asociado al control y enfocar ese control. Todo atributo no requerido MUST ofrecer una acción explícita **Omitir**; omitirlo MUST avanzar sin fabricar un valor ni incluir un valor vacío. El recorrido MUST conservar la captura de nombre, descripción y los demás datos propios del Recurso conforme a su contrato actual.

Al volver sin reemplazar el Tipo, el sistema MUST preservar valores y omisiones ya confirmados. Cambiar el Tipo MUST descartar atómicamente las definiciones, valores y omisiones del Tipo anterior antes de aceptar los del nuevo Tipo. Mientras las asignaciones vigentes estén pendientes, fallen o no produzcan atributos aplicables, el diálogo MUST comunicar respectivamente carga, error recuperable o ausencia confirmada y MUST impedir avanzar a revisión hasta resolver el contexto vigente o completar los datos requeridos.

#### Scenario: Los atributos requeridos bloquean y los opcionales se omiten explícitamente

- GIVEN una secuencia de atributos aplicables que contiene uno `REQUIRED` y uno opcional
- WHEN la persona intenta avanzar sin valor en el requerido
- THEN el diálogo permanece en ese atributo, comunica el error cercano y enfoca el control corregible
- WHEN la persona llega al atributo opcional y activa **Omitir**
- THEN avanza al siguiente dato sin registrar un valor artificial para ese atributo

#### Scenario: Volver conserva el borrador del mismo Tipo

- GIVEN valores y omisiones ya confirmados para el Tipo vigente
- WHEN la persona retrocede y después vuelve a las etapas de atributos sin reemplazar el Tipo
- THEN el diálogo conserva los valores y omisiones previamente introducidos

#### Scenario: Cambiar Tipo descarta atributos dependientes

- GIVEN atributos, valores y omisiones confirmados para un Tipo
- WHEN la persona reemplaza el Tipo desde la ruta
- THEN el diálogo descarta los atributos, valores y omisiones anteriores junto con la Unidad natural
- AND no permite reutilizarlos en el nuevo Tipo

#### Scenario: Las asignaciones de atributos cargan, fallan o están vacías de forma explícita

- GIVEN un Tipo vigente cuya resolución de asignaciones está pendiente, falla o no devuelve atributos aplicables
- WHEN el diálogo llega a la etapa de atributos
- THEN comunica respectivamente carga, error con reintento o que no hay atributos aplicables
- AND no adopta resultados de un Tipo anterior
- AND permite continuar sólo cuando el contexto vigente no tenga datos requeridos pendientes

### Requirement: Revisión fiel y creación con paridad de payload

Antes de crear, el sistema MUST presentar una revisión legible de Clase, Familia, Tipo, Unidad natural, datos propios del Recurso y sólo los valores de atributos efectivamente cargados. La persona MUST poder retroceder para corregir datos y regresar a revisión. **Crear** MUST permanecer inhabilitado mientras falte un requisito, haya una carga dependiente pendiente o el envío esté en curso.

La creación MUST conservar el contrato actual: IDs de Clase, Familia, Tipo y Unidad confirmados; nombre y demás datos existentes sin reinterpretación; el mapeo actual de valores de atributos; y `ownership: { kind: 'GLOBAL' }`. El sistema MUST impedir envíos duplicados. Los atributos opcionales omitidos MUST NOT incluirse en el payload ni mostrarse como valores en la revisión.

#### Scenario: La revisión coincide con el envío previsto

- GIVEN un borrador completo con un atributo opcional omitido
- WHEN la persona llega a revisión
- THEN la revisión muestra el contexto, la Unidad y los datos de Recurso que se enviarán
- AND muestra sólo valores de atributos efectivamente cargados
- AND no presenta el atributo omitido como si tuviera un valor
- WHEN confirma **Crear**
- THEN la solicitud conserva los IDs, datos, mapeo de atributos y ownership del contrato existente

#### Scenario: El envío está en curso o se repite la activación

- GIVEN que la persona ya confirmó **Crear** y el resultado aún está pendiente
- WHEN vuelve a activar la acción de crear
- THEN el diálogo comunica el estado de envío
- AND no emite una segunda solicitud de creación

### Requirement: Resultado de creación y refresco limitado a la consulta activa

El sistema MUST distinguir entre creación confirmada, error administrativo conocido y resultado incierto. Sólo un resultado `CREATED` confirmado MUST comunicar éxito, finalizar el flujo como creación exitosa y solicitar refresco. Un error conocido MUST permanecer recuperable sin declararse éxito. Un resultado incierto MUST informar su incertidumbre y MUST NOT generar éxito optimista ni refresco.

Después de una creación confirmada, el sistema MUST refrescar únicamente la consulta activa de Maestro de Recursos. MUST NOT insertar resultados optimistas, editar manualmente cache ni invalidar de forma amplia consultas de otros filtros o identidades.

#### Scenario: Éxito confirmado actualiza sólo la lista consultada

- GIVEN una creación que responde `CREATED` y una lista activa con una identidad de consulta definida
- WHEN el diálogo procesa el resultado confirmado
- THEN comunica el éxito y solicita releer únicamente esa lista activa
- AND no inserta un Recurso optimista
- AND no invalida listas con otra búsqueda o filtro jerárquico

#### Scenario: Error o resultado incierto no simulan éxito

- GIVEN una solicitud de creación que devuelve un error administrativo conocido o un resultado incierto
- WHEN el diálogo procesa el resultado
- THEN comunica respectivamente el error recuperable o la incertidumbre
- AND no comunica éxito ni solicita el refresco de la lista activa

### Requirement: Recorrido completo por teclado, foco y overlay accesibles

El flujo MUST poder abrirse, completarse, revisarse, enviarse o cerrarse sin mouse, manteniendo el mouse como alternativa. Dentro de cada selector local, `ArrowUp` y `ArrowDown` MUST mover el candidato activo; `Enter` MUST confirmar el candidato visible y avanzar; escribir MUST editar el filtro local cuando la etapa lo tenga; y `ArrowLeft` MUST volver a la etapa anterior o a la ruta confirmada. `Escape` MUST cerrar sólo el diálogo activo una vez. `Tab` y `Shift+Tab` MUST conservar la navegación accesible y la contención modal del diálogo sin una captura global de Tab.

Todo control, candidato activo y error MUST tener nombre accesible, relación semántica con su campo cuando corresponda y foco perceptible compatible con WCAG 2.2 AA. La edición de texto, composición IME, controles locales y eventos ya consumidos MUST tener precedencia sobre los atajos del flujo. El diálogo MUST registrarse como overlay activo, impedir acciones de la pantalla de fondo y, al cerrarse, MUST restaurar el foco al opener elegible o al fallback accesible existente. La interacción local MUST NOT añadir un listener global de documento ni competir con el arbitraje global existente.

#### Scenario: Una persona completa el recorrido sólo con teclado

- GIVEN el diálogo abierto en una etapa seleccionable y datos válidos disponibles
- WHEN la persona usa escritura, flechas, `Enter`, `ArrowLeft`, `Tab` y `Shift+Tab` según cada etapa
- THEN puede confirmar Clase, Familia, Tipo, Unidad, atributos, datos de Recurso, revisión y creación sin usar mouse
- AND `Enter` nunca confirma silenciosamente un candidato alterado por un filtro

#### Scenario: Edición y composición conservan precedencia

- GIVEN el foco en el filtro, un campo de atributo o un dato de Recurso, o una composición IME activa
- WHEN la persona usa teclas de edición o produce un evento consumido por el control local
- THEN el diálogo conserva el comportamiento de edición, composición o control local
- AND no ejecuta navegación o confirmación posterior incompatible

#### Scenario: Escape aísla el overlay y restaura el foco

- GIVEN el diálogo abierto sobre Maestro de Recursos desde un opener que sigue siendo elegible
- WHEN la persona presiona `Escape`
- THEN se cierra sólo el diálogo
- AND no se ejecuta una acción de la pantalla de fondo
- AND el foco vuelve al opener

#### Scenario: El opener ya no es elegible

- GIVEN un diálogo abierto cuyo opener fue retirado, ocultado o deshabilitado
- WHEN la persona cierra el diálogo
- THEN el foco se mueve al fallback accesible existente de Maestro de Recursos
- AND no queda en el fondo inactivo, `body` ni un nodo desconectado

### Requirement: Fronteras de autoridad y alcance preservadas

Esta capacidad MUST limitarse al diálogo y al snapshot local de creación de Maestro de Recursos. El backend externo MUST conservar autoridad sobre datos, elegibilidad, reglas efectivas, validación, permisos y persistencia. El sistema MUST conservar los adapters feature-locales y la validación de transporte antes de React. Esta capacidad MUST NOT cambiar endpoints, DTOs públicos, contratos API, payloads, Catálogo, rutas, URL, dependencias, estado global, infraestructura de consultas ni semánticas existentes de Clase, Familia o Tipo.

#### Scenario: Inspección del alcance de la capacidad

- GIVEN la capacidad de creación Keyboard First terminada
- WHEN se inspeccionan sus contratos, efectos externos y propiedad de estado
- THEN no existe cambio de backend, API pública, DTO, payload, Catálogo, ruta, URL, dependencia ni estado global
- AND la autoridad de elegibilidad y persistencia continúa fuera del frontend
- AND el borrador, el overlay y el foco permanecen como estado local del flujo de creación

# Especificación del Creador de recursos Keyboard First

## Purpose

Permitir que una persona configure un Recurso maestro mediante decisiones secuenciales y sólo por selección, manteniendo al backend como autoridad para las reglas, la evaluación y la creación.

## Requirements

### Requirement: Shell de decisión única dentro de GARFEX Light

El sistema MUST presentar la superficie con el nombre **Creador de recursos** y con una única decisión pendiente como foco dominante. La superficie MUST usar el sistema de diseño GARFEX en modo Light y MUST conservar un rail o breadcrumb interactivo de las etapas confirmadas y una barra de comandos persistente que comunique las acciones válidas de la etapa. El rail MUST permitir volver a una etapa confirmada sin ocultar el contexto jerárquico. La interfaz MUST distinguir candidato activo, selección confirmada, foco y estado de error mediante más de color.

#### Scenario: La shell mantiene orientación durante una decisión

- GIVEN el Creador de recursos abierto en cualquier etapa
- WHEN la persona observa o navega la superficie
- THEN identifica la decisión pendiente como contenido dominante
- AND ve el contexto confirmado en un rail o breadcrumb interactivo
- AND ve una barra de comandos persistente con las acciones disponibles

#### Scenario: El rail permite corregir una decisión confirmada

- GIVEN una Clase, Familia y Tipo confirmados
- WHEN la persona activa Clase o Familia en el rail
- THEN el Creador vuelve a la etapa activada
- AND conserva sólo las selecciones que continúan siendo válidas para esa etapa

### Requirement: Snapshot local e invalidación atómica de descendientes

Al abrir el Creador, el sistema MUST copiar el prefijo continuo válido más profundo de `Clase → Familia → Tipo` desde el contexto actual de Maestro de Recursos a un snapshot local. El snapshot y el borrador MUST NOT modificar el filtro, la selección ni la consulta activa de Maestro de Recursos. Al cambiar una Clase, el sistema MUST invalidar atómicamente Familia, Tipo, Unidad natural, selecciones de asignación, evaluación y `catalogFingerprint`. Al cambiar una Familia, el sistema MUST invalidar atómicamente Tipo, Unidad natural, selecciones de asignación, evaluación y `catalogFingerprint`. Al cambiar un Tipo, el sistema MUST invalidar atómicamente Unidad natural, selecciones de asignación, evaluación y `catalogFingerprint`. Al cambiar Unidad natural, el sistema MUST invalidar atómicamente la evaluación y el `catalogFingerprint` derivados.

#### Scenario: El Creador no altera Maestro de Recursos

- GIVEN Maestro de Recursos tiene un filtro y una consulta activa
- WHEN la persona modifica o cancela selecciones dentro del Creador
- THEN el filtro, la selección y la consulta activa de Maestro de Recursos permanecen sin cambios
- AND los cambios existen sólo en el snapshot local del Creador

#### Scenario: Reemplazar un ancestro elimina todos sus descendientes dependientes

- GIVEN un borrador con Clase, Familia, Tipo, Unidad natural, selecciones de asignación y una evaluación previa
- WHEN la persona confirma una Clase distinta
- THEN Familia, Tipo, Unidad natural y todas las selecciones de asignación quedan invalidadas en la misma transición
- AND la evaluación y su `catalogFingerprint` dejan de estar disponibles en esa misma transición

#### Scenario: Una respuesta dependiente desactualizada no modifica el borrador

- GIVEN una lectura dependiente solicitada para un padre o Tipo anterior
- WHEN la persona cambia ese contexto antes de que llegue la respuesta
- THEN el Creador descarta la respuesta desactualizada
- AND sólo presenta datos que pertenecen al contexto vigente

### Requirement: Jerarquía y Unidad natural con contratos actuales

El sistema MUST presentar Clase, Familia, Tipo y Unidad natural en ese orden como decisiones visibles y confirmables. Cada etapa jerárquica MUST mostrar únicamente candidatos elegibles para el contexto padre vigente. Mientras sólo estén disponibles los contratos actuales, la Unidad natural MUST proceder exclusivamente de las políticas efectivas del Tipo y de las lecturas de unidad disponibles; el sistema MUST NOT ofrecer una lista global de unidades ni una unidad ajena a dichas políticas. La búsqueda jerárquica MUST usar únicamente capacidades soportadas por los contratos actuales y MUST comunicar el alcance limitado cuando sólo filtra páginas cargadas.

#### Scenario: La Unidad natural sólo ofrece unidades elegibles para el Tipo

- GIVEN un Tipo con políticas efectivas que identifican unidades elegibles
- WHEN el Creador presenta la decisión de Unidad natural
- THEN muestra sólo unidades obtenidas desde esas políticas y las lecturas disponibles
- AND exige confirmar explícitamente una unidad antes de continuar

#### Scenario: La búsqueda local no simula una búsqueda global

- GIVEN una etapa jerárquica con varias páginas y sólo algunas ya cargadas
- WHEN la persona escribe en la búsqueda
- THEN la lista filtra únicamente los candidatos cargados que coinciden
- AND el contador comunica el alcance de los datos cargados
- AND el Creador no afirma haber buscado todo el catálogo remoto

### Requirement: Navegación search-list y teclado accesibles

Cuando una etapa admita búsqueda, el sistema MUST proporcionar una búsqueda fija sobre la lista y MUST aceptar escritura únicamente en esa búsqueda. Con el foco en búsqueda, `ArrowDown` MUST mover el foco a la lista. Con el foco en el primer candidato de lista, `ArrowUp` MUST devolver el foco a búsqueda. La escritura imprimible desde la lista MUST reactivar el foco de búsqueda y aportar el texto a su filtro. `ArrowUp` y `ArrowDown` MUST mover sólo el candidato activo; `Enter` MUST ser necesario para confirmar una selección. Filtrar, paginar o recibir datos MUST NOT confirmar un candidato. Fuera de edición de texto, `ArrowLeft` MUST volver a la etapa anterior. `Escape` MUST volver una etapa y MUST cerrar la superficie sólo desde la primera etapa. El sistema MUST preservar la precedencia de composición IME, edición local y eventos con `defaultPrevented`, y MUST conservar la navegación accesible por `Tab` y `Shift+Tab`, la contención del diálogo y la restauración de foco al cerrarlo.

#### Scenario: Buscar, entrar en lista y confirmar son acciones distintas

- GIVEN una etapa con búsqueda y candidatos elegibles
- WHEN la persona escribe una consulta, presiona `ArrowDown` y mueve el candidato activo
- THEN el texto sólo filtra la lista y `ArrowDown` mueve el foco a ella
- AND ninguna de esas acciones confirma una selección
- WHEN la persona presiona `Enter` sobre el candidato activo
- THEN el Creador confirma ese candidato y avanza

#### Scenario: La lista devuelve la escritura a búsqueda

- GIVEN el foco en la lista de una etapa con búsqueda
- WHEN la persona produce una tecla imprimible sin composición IME activa
- THEN el foco vuelve a búsqueda
- AND la tecla aporta texto al filtro de búsqueda

#### Scenario: Los atajos respetan edición, IME y eventos consumidos

- GIVEN el foco en búsqueda o hay una composición IME activa, o el control local consumió el evento
- WHEN la persona usa una tecla de edición o navegación
- THEN el Creador conserva el comportamiento del control o de la composición
- AND no ejecuta un atajo incompatible del flujo

#### Scenario: Retroceso y cierre siguen una jerarquía predecible

- GIVEN el Creador está en una etapa posterior a la primera y el foco no edita texto
- WHEN la persona presiona `ArrowLeft` o `Escape`
- THEN `ArrowLeft` vuelve a la etapa anterior y `Escape` vuelve una etapa
- WHEN la persona presiona `Escape` desde la primera etapa
- THEN se cierra sólo el Creador y el foco vuelve al opener elegible o a su fallback accesible

### Requirement: Atributos sólo por selección y por ID de asignación

La secuencia de atributos MUST identificar cada decisión por su ID de asignación estable, no por posición ni por ID de definición, y MUST rotular la etapa como **Atributos · n de total**. El contexto de Clase, Familia, Tipo y Unidad natural MUST continuar visible durante esa secuencia. Cada valor de negocio MUST confirmarse exclusivamente seleccionando un valor permitido y tipado devuelto por el backend; la escritura de búsqueda MUST NOT convertirse por sí misma en valor seleccionado. V1 MUST admitir sólo `modoCaptura: SELECCION`. Para `LIBRE`, el Creador MUST comunicar que el modo no está soportado y MUST NOT mostrar editor manual. El Creador MUST NOT simular `DERIVADO`, que queda fuera de v1. Una asignación opcional MUST ofrecer **Omitir**; una asignación requerida sin selección MUST impedir un resultado `VALID`. El Creador MUST NOT ofrecer campos para Nombre, Descripción, TEXTO, NUMERO ni ningún otro valor de negocio manual.

#### Scenario: Una asignación SELECCION conserva el valor permitido confirmado

- GIVEN una asignación activa con `modoCaptura: SELECCION` y valores permitidos disponibles
- WHEN la persona filtra, activa y confirma un valor con `Enter`
- THEN el borrador registra la selección bajo el ID de esa asignación
- AND conserva el valor tipado e identidad seleccionable devueltos por backend
- AND el texto de búsqueda no se registra como valor de negocio

#### Scenario: Una asignación opcional puede omitirse

- GIVEN una asignación activa opcional sin selección confirmada
- WHEN la persona activa **Omitir**
- THEN el Creador avanza sin fabricar un valor
- AND la omisión queda distinguida de una selección de valor

#### Scenario: Los modos fuera de v1 no habilitan captura libre

- GIVEN una definición con `modoCaptura: LIBRE` o `modoCaptura: DERIVADO`
- WHEN el Creador llega a esa asignación
- THEN para `LIBRE` comunica que el modo no está soportado y no ofrece editor
- AND para `DERIVADO` comunica que está fuera de v1 y no simula un valor

### Requirement: Borrador reversible para condiciones resueltas por backend

El borrador MUST distinguir selecciones activas de selecciones suspendidas por ID de asignación. Cuando la evaluación autoritativa indique que una asignación deja de aplicar, el Creador MUST mover su selección de activa a suspendida y MUST NOT enviarla como selección activa. Si una evaluación posterior vuelve a habilitar la misma asignación y confirma que el valor aún está permitido, el Creador MUST restaurar esa selección como activa. Si el valor ya no está permitido, el Creador MUST conservarlo como no aplicable y MUST solicitar una nueva decisión cuando corresponda. El frontend MUST NOT evaluar ni interpretar por sí mismo reglas `CONDITIONAL`.

#### Scenario: Una condición suspende y después restaura una selección válida

- GIVEN una selección activa asociada a un ID de asignación
- WHEN una evaluación backend indica que la asignación deja de aplicar
- THEN el borrador conserva el valor como selección suspendida
- AND no lo incluye entre las selecciones activas enviables
- WHEN una evaluación posterior vuelve a aplicar la asignación y confirma que el valor sigue permitido
- THEN el borrador restaura la selección como activa

#### Scenario: Una selección suspendida que ya no es válida exige nueva decisión

- GIVEN una selección suspendida para una asignación que vuelve a aplicar
- WHEN la evaluación backend indica que su valor ya no está permitido
- THEN el Creador no restaura el valor como activo
- AND presenta la asignación como decisión pendiente

### Requirement: Evaluación, revisión y creación autoritativas con backend v1

Cuando estén disponibles los DTOs v1 exactos, sus nulabilidades, errores y disposiciones, el Creador MUST obtener definiciones mediante `obtenerDefinicionAtributo`, valores permitidos mediante `listarValoresPermitidosAtributo`, y evaluación mediante `evaluarCreacionDesdeSelecciones`. La evaluación MUST proceder de backend y MUST devolver exactamente uno de `INCOMPLETE`, `VALID` o `INVALID`, junto con el `catalogFingerprint` y las salidas previstas por el contrato definitivo. La revisión MUST representar fielmente las asignaciones resueltas, incidencias, nombre generado e identidad técnica devueltos por backend; Nombre e identidad técnica MUST NOT ser entradas ni cálculos frontend. `INCOMPLETE` MUST señalar decisiones pendientes, `INVALID` MUST impedir crear y presentar incidencias accionables, y sólo `VALID` MUST habilitar la confirmación final. Cualquier mutación de selección MUST invalidar la evaluación y el `catalogFingerprint` anteriores.

La creación desde el Creador MUST invocar `crearRecursoDesdeSelecciones` únicamente con IDs de selección activos y con `expectedCatalogFingerprint` obligatorio. Esa creación MUST reevaluar las selecciones transaccionalmente contra el catálogo vigente y MUST devolver disposiciones explícitas. La interfaz MUST representar las disposiciones definidas por el contrato real y MUST NOT inferir éxito ni tratar una respuesta incierta o stale como creación confirmada.

#### Scenario: La evaluación gobierna la revisión y la habilitación de creación

- GIVEN DTOs v1 exactos disponibles y un borrador de selecciones activas
- WHEN el Creador invoca `evaluarCreacionDesdeSelecciones`
- THEN presenta el estado `INCOMPLETE`, `VALID` o `INVALID` devuelto por backend
- AND muestra nombre, identidad técnica, incidencias y asignaciones sólo como salidas del contrato
- AND habilita crear sólo para `VALID`

#### Scenario: Cambiar una selección invalida una revisión anterior

- GIVEN una evaluación `VALID` con un `catalogFingerprint`
- WHEN la persona confirma, omite, restaura o cambia una selección
- THEN la evaluación y el `catalogFingerprint` anteriores dejan de ser utilizables en la misma transición
- AND el Creador requiere una nueva evaluación antes de habilitar crear

#### Scenario: Crear exige fingerprint y una disposición confirmada

- GIVEN una evaluación vigente `VALID` con `catalogFingerprint`
- WHEN la persona confirma crear
- THEN el Creador envía sólo IDs de selecciones activas y `expectedCatalogFingerprint`
- AND espera la disposición explícita de `crearRecursoDesdeSelecciones`
- AND comunica éxito sólo si la disposición contractual confirma la creación

### Requirement: Límite explícito antes de contratos backend v1

Antes de que existan los contratos backend v1 exactos, el Creador MUST permitir únicamente la shell, el rail, la barra de comandos, la interacción search-list, las etapas Clase, Familia, Tipo y Unidad natural con contratos actuales, la invalidación jerárquica y el modelo puro de selecciones activas/suspendidas. En ese estado, el Creador MUST comunicar que el contrato está pendiente al alcanzar atributos, evaluación, revisión o creación bloqueados. El frontend MUST NOT inventar endpoints, DTOs, errores, disposiciones, adaptadores productivos ni una evaluación `CONDITIONAL` local. Los dobles de prueba MUST utilizarse sólo después de conocer los DTOs exactos y sólo dentro de pruebas.

#### Scenario: El recorrido se detiene honestamente sin backend v1

- GIVEN que los contratos backend v1 exactos no están disponibles
- WHEN la persona completa Clase, Familia, Tipo y Unidad natural
- THEN el Creador muestra un estado explícito de contrato pendiente antes de atributos o revisión autoritativa
- AND no habilita creación
- AND no presenta datos simulados como respuesta productiva

### Requirement: Autoridad y compatibilidad preservadas

El backend MUST conservar la autoridad sobre elegibilidad, reglas condicionales, validación, nombre, identidad técnica, persistencia y reevaluación transaccional. El método legado `crearRecurso` MUST permanecer disponible y sin cambios, pero el Creador MUST NOT usarlo para el flujo nuevo. Esta capacidad MUST NOT cambiar backend, Catálogo, relaciones o semánticas globales, dependencias, estado global, rutas, URL ni infraestructura transversal. El alcance MUST permanecer feature-local y MUST NOT añadir listeners globales de teclado, push, PR ni cambios de backend.

#### Scenario: Inspección de límites del cambio

- GIVEN la capacidad implementada conforme a esta especificación
- WHEN se inspeccionan sus efectos y contratos
- THEN no existe captura manual de valores de negocio ni uso de `crearRecurso` por el Creador
- AND no existen cambios de backend, Catálogo, dependencias, estado global, rutas ni URL
- AND las reglas condicionales, evaluación y creación continúan bajo autoridad backend

# Especificación de gestión de compras

## Propósito

Permitir importar y consultar compras de un proveedor, revisar sus partidas documentales y resolver, únicamente con operaciones confirmadas por el backend, la relación Producto de Proveedor → Recurso Maestro.

## Requisitos

### Requisito: Importación de CFDI con resultados distinguibles

El sistema MUST permitir enviar un CFDI de compra y comunicar de forma visible y accesible el resultado confirmado de la importación. El sistema SHALL distinguir una compra creada, una compra ya registrada, un conflicto de contenido para el mismo UUID fiscal, un XML inválido y los demás errores contractuales. Una importación ya registrada MUST NOT presentarse como un error. El sistema MUST NOT iniciar una mutación si falta el actor requerido por el contrato compartido.

#### Escenario: Compra creada o previamente registrada

- GIVEN una persona con actor disponible selecciona un CFDI válido
- WHEN la importación es confirmada como creada
- THEN el sistema comunica que la compra fue importada
- AND si el proveedor de la compra coincide con el contexto de historial abierto, actualiza ese historial desde su fuente autoritativa

#### Escenario: Importación idempotente

- GIVEN una persona con actor disponible selecciona un CFDI ya registrado sin diferencias de contenido
- WHEN la importación es confirmada como ya existente
- THEN el sistema comunica que la compra ya estaba registrada
- AND no la comunica como fallo de importación

#### Escenario: Importación rechazada o en conflicto

- GIVEN una persona intenta importar un CFDI
- WHEN el resultado confirmado indica conflicto de contenido o XML inválido
- THEN el sistema muestra un mensaje que diferencia el conflicto fiscal del archivo inválido
- AND permite corregir o seleccionar otro archivo sin afirmar que se creó una compra

### Requisito: Historial de compras acotado a proveedor

El sistema MUST exigir un proveedor seleccionado o recibido como contexto antes de mostrar compras históricas. El título y el contexto visible SHALL identificar al proveedor vigente, y la paginación MUST representar sólo la ventana autoritativa de compras de ese proveedor. El sistema MUST NOT presentar ese historial como listado global ni reconstruirlo recorriendo proveedores desde el cliente.

#### Escenario: Historial con proveedor confirmado

- GIVEN una persona confirma un proveedor
- WHEN abre el historial de compras
- THEN observa el nombre del proveedor y un título que lo identifica como su historial de compras
- AND puede avanzar o retroceder únicamente cuando la página autoritativa lo permite

#### Escenario: Sin contexto de proveedor

- GIVEN una persona entra a Compras sin proveedor preseleccionado
- WHEN solicita consultar el historial
- THEN el sistema solicita elegir un proveedor
- AND no muestra una tabla que sugiera contener compras de todos los proveedores

### Requisito: Detalle documental inmutable de compra y partidas

El sistema MUST permitir abrir una compra del historial y mostrar su contexto documental junto con todas sus partidas. Los datos originales disponibles de la compra y de cada partida MUST permanecer visibles y no editables, incluidos los metadatos XML disponibles (`hash` y nombre de archivo), proveedor, documento, fecha, moneda y totales disponibles; descripción, SKU del proveedor, código SAT, cantidad, unidad, precio, importe, descuento e impuestos disponibles. Los ids y montos MUST conservar la representación de string decimal proporcionada por el contrato; su formato de presentación MUST NOT alterar ese valor.

#### Escenario: Inspección de una compra

- GIVEN una persona selecciona una compra de un historial de proveedor
- WHEN abre su detalle
- THEN observa el proveedor y los datos documentales disponibles de la compra
- AND observa todas las partidas con sus campos originales disponibles en modo no editable
- AND observa el hash y nombre de archivo XML disponibles sin que se ofrezca editar esos datos

### Requisito: Estados de vinculación perceptibles

El sistema MUST mostrar el estado confirmado de cada partida como `VINCULADO`, `PENDIENTE`, `CONFLICTO` o `NO_APLICA`. Cada estado SHALL incluir texto visible y una señal semántica perceptible que no dependa sólo del color. El sistema MUST mostrar la relación comercial y técnica en una zona distinta de los datos XML de la partida.

#### Escenario: Partidas en los cuatro estados

- GIVEN una compra contiene partidas con los cuatro estados de vinculación
- WHEN la persona consulta el detalle
- THEN cada partida muestra el texto de su estado y un indicador semántico correspondiente
- AND la identificación de estado sigue siendo comprensible sin percibir el color

### Requisito: Inspección y reutilización de relaciones existentes

Cuando una partida tenga Producto de Proveedor y éste tenga Recurso Maestro, el sistema MUST mostrar la cadena Partida → Producto de Proveedor → Recurso Maestro. La búsqueda de Productos de Proveedor SHALL limitarse al proveedor de la compra y sólo podrá ayudar a localizar un producto existente; una coincidencia de SKU, descripción, nombre o código SAT MUST NOT confirmar ni crear una relación automáticamente. Este slice MUST NOT ofrecer alta de Productos de Proveedor.

#### Escenario: Relación existente visible

- GIVEN una partida tiene un `supplierProductId` y su Producto de Proveedor está vinculado a un Recurso Maestro
- WHEN la persona inspecciona la zona de relación
- THEN observa el Producto de Proveedor y el Recurso Maestro vinculados
- AND puede distinguir esa relación de los campos originales de la partida

#### Escenario: Búsqueda sin vinculación automática

- GIVEN una persona busca Productos de Proveedor durante la resolución de una partida
- WHEN escribe un SKU o descripción que coincide con un producto existente del proveedor vigente
- THEN el sistema limita los resultados a ese proveedor
- AND no declara la partida vinculada ni modifica su relación sólo por la coincidencia

### Requisito: Vinculación confirmada de Producto de Proveedor con Recurso Maestro

Para una partida que tenga `supplierProductId`, el sistema MUST permitir seleccionar un Recurso Maestro y solicitar la vinculación de su Producto de Proveedor. El sistema SHALL presentar el resultado y cualquier cambio de estado o cascada sólo después de la confirmación y relectura autoritativas. El sistema MUST NOT realizar matching, equivalencias ni cascadas locales, ni mostrar una vinculación como exitosa antes de su confirmación.

#### Escenario: Vinculación de una partida pendiente con producto identificado

- GIVEN una partida `PENDIENTE` tiene un `supplierProductId`
- WHEN la persona confirma la vinculación de su Producto de Proveedor con un Recurso Maestro
- THEN el sistema deshabilita la acción mientras está en curso
- AND tras la confirmación relee la relación y las partidas afectadas
- AND muestra los estados y relaciones confirmados por el backend

### Requisito: Desvinculación confirmada de Producto de Proveedor

Cuando un Producto de Proveedor esté vinculado a un Recurso Maestro, el sistema MUST permitir solicitar su desvinculación. El sistema SHALL reflejar la transición de partidas asociadas, incluido el paso de `VINCULADO` a `PENDIENTE` cuando el backend lo determine, sólo tras confirmación y relectura autoritativas.

#### Escenario: Desvinculación de una relación existente

- GIVEN una partida muestra un Producto de Proveedor vinculado y estado `VINCULADO`
- WHEN la persona confirma la desvinculación
- THEN el sistema no adelanta localmente el estado de la partida
- AND después de la confirmación relee los datos afectados
- AND muestra el estado confirmado, incluido `PENDIENTE` si corresponde

### Requisito: Override de estado conforme a la autoridad backend

El sistema MUST permitir marcar una partida como `NO_APLICA` mediante la operación de estado publicada y mostrar el resultado sólo tras confirmación backend. Para una partida `CONFLICTO`, el sistema SHALL ofrecer únicamente las acciones soportadas por la semántica publicada, sin inventar una causa, una resolución ni una relación a recurso. Una partida `NO_APLICA` MUST comunicar que no aplica a un Recurso Maestro.

#### Escenario: Marcar una partida como no aplicable

- GIVEN una partida puede marcarse como no aplicable
- WHEN la persona confirma la acción
- THEN el sistema espera la confirmación del backend
- AND tras releer muestra el estado `NO_APLICA` y que no aplica a un Recurso Maestro

#### Escenario: Conflicto sin explicación inventada

- GIVEN una partida tiene estado `CONFLICTO`
- WHEN la persona inspecciona sus acciones
- THEN el sistema no atribuye una causa no proporcionada por el contrato
- AND sólo permite las acciones de estado o vinculación confirmadas por el backend

### Requisito: Partidas sin Producto de Proveedor asociado

Cuando `supplierProductId` sea `null`, el sistema MUST mostrar la partida y su estado, pero MUST bloquear la selección de Recurso Maestro y la vinculación de recurso. El sistema SHALL explicar que falta la operación contractual para asociar la partida a un Producto de Proveedor existente. El sistema MUST NOT usar el cambio de `linkStatus` a `VINCULADO` como sustituto de dicha asociación; marcar `NO_APLICA` seguirá disponible únicamente si la semántica publicada lo admite.

#### Escenario: Resolución bloqueada por relación nullable

- GIVEN una partida tiene `supplierProductId: null`
- WHEN la persona inspecciona sus opciones de resolución
- THEN el sistema no ofrece seleccionar un Recurso Maestro ni declarar una vinculación
- AND muestra información sobre la dependencia contractual pendiente
- AND no cambia el estado a `VINCULADO` como sustituto de la relación ausente

### Requisito: Superficie informativa de partidas pendientes transversales bloqueada

El sistema MUST mantener visible una superficie informativa de Partidas pendientes entre compras. Mientras no exista un contrato backend paginado y transversal por estado, esa superficie SHALL explicar la dependencia, orientar a resolver partidas desde el historial de su proveedor y MUST NOT listar resultados parciales ni agregarlos desde el cliente.

#### Escenario: Consulta de pendientes sin contrato transversal

- GIVEN una persona abre la sección Partidas pendientes
- WHEN el contrato transversal por estado no está disponible
- THEN observa un mensaje informativo de que la vista no puede listar partidas entre compras
- AND recibe la orientación de abrir la compra desde el historial de su proveedor
- AND no observa una lista parcial presentada como completa

## Límites y no objetivos

- G1: no hay historial global de compras; el proveedor es obligatorio hasta que exista un contrato publicado para ello.
- G2: no hay listado cross-compra de partidas por estado; no se realizará barrido, paginación ni agregación cliente de proveedores o compras.
- G3: no se asociará una partida con `supplierProductId: null` a un Producto de Proveedor hasta contar con operación contractual específica; tampoco se sustituirá esa relación con un override de estado.
- G4: este slice cubre campos y metadatos XML expuestos, no descarga ni visor del archivo XML crudo.
- Quedan fuera APU, análisis de precios unitarios, comparación, ranking o recomendación de proveedores, políticas automáticas de precio, historial de compras desde Maestro de Recursos, alta de Productos de Proveedor y edición de datos originales.
- Quedan fuera matching, equivalencias, normalización, validación fiscal y cálculo de montos en frontend; persistencia local, caché como autoridad, fixtures runtime, fallback, backend propio, stores globales, repositorios, casos de uso, gateways y facades especulativos.
- Quedan fuera permisos, roles, autenticación, autorización, responsive, tablet, móvil y ajustes touch específicos no aprobados; también cambios no relacionados en Catálogo, Proveedores, Maestro de Recursos, Bandeja, `garfex-api`, OpenAPI y artefactos de recuperación.

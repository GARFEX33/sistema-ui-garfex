# Especificación de Interacción Keyboard First

## Purpose

Establecer la primera integración observable del contrato permanente Keyboard First de GARFEX mediante arbitraje seguro de eventos, navegación espacial física y acciones contextuales, sin fabricar capacidades de producto ni interferir con la edición o los comandos del navegador.

## Requirements

### Requirement: Arbitraje seguro de eventos de teclado

El sistema MUST resolver cada evento según la precedencia edición/IME → control o composite local → overlay activo → feature activa → atajo global. Las flechas espaciales y todos los atajos de una sola tecla MUST permanecer suspendidos cuando el foco esté en un campo de entrada, búsqueda, formulario, editor, autocomplete, `contenteditable` o cualquiera de sus descendientes editables, o mientras exista composición IME. El sistema MUST NOT ejecutar una acción posterior cuando `defaultPrevented` sea verdadero o un contexto anterior haya consumido el evento.

#### Scenario: Escritura y composición sin interferencia

- GIVEN el foco dentro de un editable, editor, autocomplete o descendiente `contenteditable`, o una composición IME activa
- WHEN el usuario presiona una flecha, `N`, `n` o una tecla cuyo carácter sea `?`
- THEN el sistema no mueve el foco espacialmente
- AND no abre Nueva Clase ni la ayuda contextual
- AND conserva el comportamiento de edición o composición del contexto

#### Scenario: Consumo local o evento previamente cancelado

- GIVEN un control, composite u overlay que consume legítimamente una tecla, o un evento con `defaultPrevented` igual a verdadero
- WHEN el mismo evento alcanza un nivel posterior del arbitraje
- THEN ningún nivel posterior ejecuta navegación, acción contextual ni atajo global

#### Scenario: Modificadores no registrados

- GIVEN un contexto no editable y sin composición IME
- WHEN el usuario presiona una flecha o una tecla de acción con `Ctrl`, `Meta` o `Alt` que no corresponde a un atajo registrado explícitamente
- THEN GARFEX no ejecuta la acción de una sola tecla ni la navegación espacial
- AND el comando del navegador, sistema o control local permanece disponible

### Requirement: Selección espacial geométrica y determinista

Ante una flecha no consumida, el sistema MUST elegir únicamente un control elegible situado en el semiplano físico solicitado respecto del control actual. La selección MUST depender de la geometría vigente en el viewport, la proximidad en la dirección pedida y la alineación perpendicular; MUST producir el mismo destino ante la misma entrada y MUST resolver empates mediante un criterio estable explícito que no dependa del texto, del idioma, del orden DOM ni del orden visual declarado por una lista.

#### Scenario: Movimiento en las cuatro direcciones

- GIVEN un control enfocado y varios candidatos elegibles con rectángulos conocidos alrededor suyo
- WHEN el usuario presiona `ArrowUp`, `ArrowDown`, `ArrowLeft` o `ArrowRight`
- THEN el destino pertenece al semiplano físico de la flecha presionada
- AND entre los candidatos direccionales se priorizan proximidad y alineación perpendicular
- AND el foco se mueve a un único mejor candidato

#### Scenario: Geometría física bajo RTL

- GIVEN una superficie con dirección de texto RTL y candidatos visibles a izquierda y derecha físicas
- WHEN el usuario presiona `ArrowRight`
- THEN el foco se mueve hacia un candidato ubicado físicamente a la derecha en el viewport
- AND la dirección del texto no invierte ni sustituye la geometría

#### Scenario: Empate geométrico repetible

- GIVEN dos candidatos con geometría y puntuación direccional equivalentes y una identidad estable para desempate
- WHEN se evalúa repetidamente la misma entrada espacial
- THEN siempre se selecciona el mismo candidato
- AND cambiar el orden DOM o el texto de los candidatos no altera el resultado

#### Scenario: Geometría vigente después de cambios visuales

- GIVEN que un scroll, un portal o un cambio de layout alteró la posición real de los controles
- WHEN se solicita navegación espacial
- THEN la decisión refleja los rectángulos vigentes en el viewport o una invalidación explícita ya aplicada
- AND no usa indefinidamente una medición obsoleta

### Requirement: Elegibilidad limitada al contexto activo

Un candidato espacial MUST estar conectado al documento, visible, habilitado, ser operable, tener un rectángulo de área positiva y pertenecer a la zona o superficie de interacción activa. El sistema MUST excluir controles ocultos por sí mismos o por sus ancestros, deshabilitados, desconectados, decorativos, de área cero o pertenecientes al fondo de un overlay activo. Un control dentro de un overlay presentado mediante portal MAY ser candidato cuando ese overlay sea el contexto activo.

#### Scenario: Exclusión de candidatos inválidos

- GIVEN candidatos ocultos, deshabilitados, desconectados, decorativos o con ancho o alto igual a cero
- WHEN se calcula un movimiento espacial
- THEN ninguno de esos candidatos recibe el foco
- AND la selección se limita a controles elegibles del contexto activo

#### Scenario: Overlay renderizado mediante portal

- GIVEN un overlay activo en un portal y controles visibles detrás de él
- WHEN el usuario navega espacialmente dentro del overlay
- THEN sólo los controles elegibles del overlay activo participan como candidatos
- AND los controles del fondo no reciben el foco

### Requirement: Tabulación nativa por zonas y foco visible

`Tab` y `Shift+Tab` MUST conservar su comportamiento nativo y MUST servir principalmente para avanzar o retroceder entre las zonas mayores del shell. Todo control enfocado MUST mostrar un indicador de foco perceptible y con contraste aplicable a WCAG 2.2 AA. El sistema MUST NOT capturar `Tab` globalmente, instalar un orden roving para todo el documento ni contener el foco fuera de un modal o diálogo activo.

#### Scenario: Recorrido nativo entre zonas

- GIVEN el shell sin un diálogo modal activo
- WHEN el usuario presiona `Tab` o `Shift+Tab`
- THEN el navegador conserva el recorrido secuencial nativo entre controles y zonas mayores
- AND cada destino enfocado muestra foco visible
- AND el foco puede entrar y salir de cada zona sin una trampa global

#### Scenario: Contención exclusiva de un diálogo

- GIVEN un modal o diálogo activo
- WHEN el usuario recorre sus controles con `Tab` y `Shift+Tab`
- THEN el foco MAY permanecer contenido dentro de ese modal o diálogo
- AND cerrar el overlay elimina esa contención
- AND ninguna superficie no modal instala una contención equivalente

### Requirement: Grupo inmediato de navegación lateral

La navegación lateral inmediata MUST incluir únicamente los destinos reales `Bandeja` y `Catálogo`. `ArrowUp` y `ArrowDown` MUST mover el foco al destino elegible anterior o siguiente sin convertir etiquetas estáticas o futuras en controles; `Home` MUST enfocar `Bandeja`, `End` MUST enfocar `Catálogo` y `Enter` MUST activar la ruta real del destino enfocado. `ArrowRight` MUST aplicar el contrato espacial para entrar al mejor control elegible del contenido principal.

#### Scenario: Recorrido vertical de destinos reales

- GIVEN el foco en `Bandeja` o `Catálogo`
- WHEN el usuario presiona `ArrowUp` o `ArrowDown`
- THEN el foco se mueve al destino real anterior o siguiente cuando existe
- AND en un extremo permanece en el destino límite sin envolver el grupo
- AND ninguna etiqueta de Familia, Tipo, Recurso u otra capacidad futura recibe foco

#### Scenario: Inicio, fin y activación

- GIVEN el foco dentro del grupo lateral
- WHEN el usuario presiona `Home`, `End` o `Enter`
- THEN `Home` enfoca `Bandeja`
- AND `End` enfoca `Catálogo`
- AND `Enter` activa únicamente la ruta real del destino enfocado

#### Scenario: Entrada espacial al contenido principal

- GIVEN el foco en un destino lateral y al menos un control elegible en el contenido principal activo
- WHEN el usuario presiona `ArrowRight`
- THEN el foco se mueve al mejor candidato físico a la derecha según el contrato geométrico
- AND no se crea una ruta, acción o control para completar el movimiento

### Requirement: Acción contextual N limitada a Nueva Clase

En esta primera integración, `N` y `n` sin modificadores MUST abrir `Nueva Clase` únicamente cuando la superficie actual de Catálogo exponga esa acción real, habilitada y válida en el contexto vigente. El sistema MUST NOT registrar `N` para Familia, Tipo, Recurso, Bandeja, overlays inactivos ni entidades futuras.

#### Scenario: Nueva Clase disponible

- GIVEN Catálogo es la superficie activa, la acción `Nueva Clase` está visible y habilitada, y no existe edición, IME ni overlay de mayor precedencia
- WHEN el usuario presiona `N` o `n` sin modificadores
- THEN se abre la misma acción real `Nueva Clase` disponible en la superficie
- AND el foco entra en el diálogo o control inicial correspondiente

#### Scenario: Contexto sin acción válida

- GIVEN la superficie activa no ofrece una acción real y habilitada `Nueva Clase`, o el contexto actual corresponde a Familia, Tipo, Recurso o Bandeja
- WHEN el usuario presiona `N` o `n`
- THEN GARFEX no ejecuta una acción Nueva
- AND no presenta comandos, rutas ni formularios sustitutos

### Requirement: Ayuda contextual independiente del layout de teclado

Una pulsación cuyo valor semántico `event.key` sea `?` MUST abrir la ayuda de teclado correspondiente a la superficie soportada activa, siempre que el arbitraje permita el evento. La detección MUST usar el carácter producido y MUST NOT depender de `event.code`, de la posición física de `/` ni de una distribución estadounidense; los modificadores necesarios para producir `?` en la distribución activa MUST NOT impedir por sí solos su reconocimiento.

#### Scenario: Ayuda en una distribución internacional

- GIVEN una superficie soportada, no editable y sin overlay de mayor precedencia
- WHEN la distribución activa produce `event.key` igual a `?`, aunque requiera `Shift` o `AltGraph`
- THEN se abre la ayuda contextual de esa superficie
- AND el contenido identifica sólo los comandos disponibles en el contexto vigente

#### Scenario: Tecla física sin carácter de ayuda

- GIVEN una distribución donde la tecla física asociada a `/` no produce `?`
- WHEN el evento tiene un `event.key` distinto de `?`
- THEN GARFEX no abre la ayuda por asumir una distribución estadounidense

### Requirement: Escape y restauración predecible del foco

`Escape` MUST actuar una sola vez sobre el overlay o contexto activo de mayor precedencia. Al cerrar Command Palette, Nueva Clase o la ayuda contextual, el sistema MUST restaurar el foco al opener cuando éste continúe conectado, visible, habilitado y operable; de lo contrario MUST moverlo a un fallback accesible explícito de la superficie activa. Un solo evento MUST NOT cerrar varias capas ni disparar una acción global adicional.

#### Scenario: Restauración al opener válido

- GIVEN un overlay soportado abierto desde un control que sigue siendo elegible
- WHEN el usuario presiona `Escape`
- THEN se cierra únicamente el overlay superior
- AND el foco regresa al control que lo abrió

#### Scenario: Opener retirado o inválido

- GIVEN un overlay soportado cuyo opener fue retirado, desconectado, ocultado o deshabilitado
- WHEN el overlay se cierra o cancela
- THEN el foco se mueve al fallback accesible explícito de la superficie activa
- AND el foco no se pierde en `body`, en el fondo inactivo ni en un nodo desconectado

### Requirement: Preservación exacta de comandos de plataforma

El atajo global exacto MUST continuar siendo `Ctrl+K` en Windows/Linux y `Cmd+K` en macOS, sin `Shift`, `Alt` ni el modificador de plataforma opuesto, y MUST abrir la Command Palette sólo cuando ningún contexto anterior consuma el evento. GARFEX MUST NOT capturar, cancelar ni reutilizar `Ctrl+N`.

#### Scenario: Command Palette conserva su atajo exacto

- GIVEN un contexto donde ningún editable, IME, control local, composite, overlay o feature consume el evento
- WHEN el usuario presiona el `Ctrl/Cmd+K` exacto de su plataforma
- THEN se abre la Command Palette existente
- AND variantes con modificadores adicionales no se interpretan como ese atajo

#### Scenario: Ctrl+N permanece fuera de GARFEX

- GIVEN cualquier superficie de GARFEX
- WHEN el usuario presiona `Ctrl+N`
- THEN ningún manejador de la aplicación abre Nueva Clase ni otra acción
- AND GARFEX no cancela el comportamiento del navegador o sistema

### Requirement: Evidencia estricta de interacción y arquitectura

Cada comportamiento de esta capacidad MUST desarrollarse con evidencia RED-GREEN-REFACTOR y MUST contar con pruebas enfocadas en la capa que pueda observarlo con fiabilidad. La evidencia MUST incluir pruebas unitarias de arbitraje y geometría; pruebas de interacción de shell, sidebar, acciones y overlays; pruebas de navegador para rectángulos reales, scroll, portales y foco; pruebas de arquitectura para las prohibiciones globales; y regresión visual limitada al foco visible y al cambio de identidad autorizado.

#### Scenario: Matriz verificable del contrato

- GIVEN la implementación de la primera integración Keyboard First
- WHEN se ejecuta su verificación enfocada
- THEN las pruebas unitarias cubren precedencia, edición, IME, modificadores, `defaultPrevented`, las cuatro direcciones, RTL, elegibilidad y empates
- AND las pruebas de interacción cubren tabulación, sidebar, `N`, `?`, `Escape`, Command Palette y restauración o fallback de foco
- AND las pruebas de navegador cubren geometría real, scroll, overlays en portales y foco efectivo
- AND el reporte conserva evidencia RED, GREEN y REFACTOR y comunica verazmente cada resultado

#### Scenario: Guardia arquitectónica y visual

- GIVEN el grafo runtime, los tests arquitectónicos y la referencia visual congelada
- WHEN se inspecciona el alcance del cambio
- THEN no existe captura global de `Tab` o `Ctrl+N`, trampa global de foco, store global, fixture runtime ni acción futura especulativa
- AND la composición visual permanece sin cambios salvo foco visible y el texto superior izquierdo `GARFEX` en `#7C0000`
- AND el checkpoint visual parcial congelado de Catálogo permanece intacto

### Requirement: Frontera sin backend ni acciones futuras

Esta capacidad MUST limitarse a interacción frontend sobre controles y acciones reales ya autorizados. MUST NOT añadir backend, API, persistencia, datos de dominio, rutas, deep links, stores globales, acciones de Nueva Familia, Nuevo Tipo o Recurso, integración de superficies densas o virtualizadas, ni comportamiento responsive, móvil o touch específico.

#### Scenario: Inspección de la frontera del slice

- GIVEN la primera integración Keyboard First terminada
- WHEN se inspeccionan sus rutas, acciones, dependencias y efectos externos
- THEN sólo Bandeja, Catálogo, Nueva Clase, Command Palette y ayuda contextual participan según su contexto real
- AND no existe nueva comunicación backend ni persistencia
- AND no existe comportamiento fabricado para Familia, Tipo, Recurso o superficies futuras

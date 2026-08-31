# Especificación de Entrada Workstation a Bandeja Operativa

## Purpose

Ofrecer una entrada runtime honesta y accesible a la Bandeja operativa GARFEX, mientras la composición poblada aprobada permanece aislada en Storybook y pruebas hasta disponer de backend o de nuevos estados visuales aprobados.

## Requirements

### Requirement: Ruta y shell reconocibles de Bandeja

El sistema MUST registrar una ruta de Bandeja y MUST presentar en la entrada runtime workstation un shell reconocible con identidad GARFEX, navegación persistente, barra superior y Bandeja identificada como el destino activo. TanStack Router MUST resolver esta entrada sin requerir datos de negocio.

#### Scenario: Apertura inicial de la aplicación

- GIVEN una sesión workstation que abre la aplicación
- WHEN se resuelve la entrada inicial
- THEN se presenta la ruta de Bandeja
- AND el usuario reconoce la identidad GARFEX, la navegación, la barra superior y la Bandeja activa
- AND el arranque no depende de backend, persistencia ni registros locales

### Requirement: Runtime deliberadamente incompleto y veraz

La ruta runtime de Bandeja MUST mostrar únicamente el shell, la identificación de Bandeja y su entrada operativa básica. MUST NOT mostrar registros ficticios, contadores, indicadores, métricas, filas, paneles de detalle ni datos derivados de `page04.png`; tampoco MUST representar estados de vacío, carga, error, sin resultados, conectividad o datos parciales.

#### Scenario: Bandeja runtime sin fuente autorizada

- GIVEN que no existe backend integrado ni estado vacío aprobado
- WHEN el usuario abre la ruta de Bandeja
- THEN no se muestra ningún registro, métrica o indicador ficticio
- AND la región operativa no comunica semánticamente estar vacía, cargando, fallida o sin resultados
- AND no se inicia una consulta ni se lee una fuente persistente

#### Scenario: No se inventa comportamiento de dominio

- GIVEN la entrada runtime de Bandeja
- WHEN el usuario recorre sus controles disponibles
- THEN no puede clasificar, asignar, revisar, seleccionar lotes, guardar vistas ni ejecutar acciones de negocio
- AND no se simulan resultados, permisos, auditoría o persistencia

### Requirement: Composición poblada aprobada sólo en Storybook y pruebas

El sistema MUST reproducir la composición poblada workstation de `page04.png` únicamente en Storybook y pruebas visuales o de componente. La historia MUST señalar que sus textos, métricas y registros son fixtures de presentación y que `page04.png` es la autoridad visual.

#### Scenario: Revisión de la historia poblada

- GIVEN Storybook abierto con viewport de 1440×980
- WHEN el revisor abre la historia aprobada de Bandeja
- THEN reconoce el rail, la barra superior con entrada de comandos, el encabezado de Bandeja, los indicadores compactos, filtros, acciones masivas, lista de pendientes, panel contextual y referencia de atajos de `page04.png`
- AND el contenido está rotulado como evidencia de presentación, no como datos reales ni contrato de backend
- AND no aparecen estados o transiciones adicionales

### Requirement: Aislamiento estricto de fixtures visuales

Los fixtures poblados MUST permanecer aislados de los entrypoints, rutas, providers y bundles runtime. Ningún fixture MUST convertirse en proveedor local de producto, fallback de datos ni contrato futuro implícito.

#### Scenario: El build runtime excluye fixtures poblados

- GIVEN los fixtures usados por la historia y sus pruebas
- WHEN se construye y se inspecciona el grafo del bundle runtime
- THEN ningún entrypoint, ruta o provider runtime importa esos fixtures
- AND los nombres, métricas y registros de `page04.png` no están disponibles como datos de producto

### Requirement: Disparador visible de comandos

El shell MUST ofrecer un disparador visible y con nombre accesible para la entrada de comandos, acompañado por la pista `Ctrl/Cmd + K`. El disparador visible y el atajo MUST abrir la misma capa de entrada sin inventar catálogo, ranking, permisos, comandos o resultados.

#### Scenario: Apertura desde el disparador visible

- GIVEN el foco sobre el disparador visible de comandos
- WHEN el usuario lo activa
- THEN se abre la capa de entrada de comandos
- AND el foco se mueve a su campo editable
- AND la capa no presenta catálogo ni resultados inventados

#### Scenario: Apertura con el atajo global

- GIVEN que ningún contexto de mayor precedencia consume el evento
- WHEN el usuario presiona `Ctrl+K` en Windows/Linux o `Cmd+K` en macOS
- THEN se abre la misma capa de entrada de comandos
- AND el foco se mueve a su campo editable

### Requirement: Tabulación nativa y foco visible

El sistema MUST conservar el comportamiento nativo de `Tab` y `Shift+Tab`, MUST mantener un orden de foco lógico y MUST mostrar un indicador de foco visible en cada control enfocado. MUST NOT capturar `Tab` para simular navegación interna.

#### Scenario: Recorrido secuencial por teclado

- GIVEN la ruta de Bandeja con la capa de comandos cerrada
- WHEN el usuario avanza con `Tab` y retrocede con `Shift+Tab`
- THEN el foco sigue el orden lógico del documento
- AND cada destino muestra foco visible
- AND el navegador conserva el movimiento nativo entre controles

### Requirement: Escape contextual y restauración de foco

`Escape` MUST actuar sobre la capa superior que posea el contexto. Al cerrar la capa de comandos, el sistema MUST restaurar el foco al control que la abrió o, si se abrió por atajo global, al elemento que tenía el foco antes de abrirla. Un solo `Escape` MUST NOT cerrar varias capas ni disparar comportamiento global adicional.

#### Scenario: Cierre de comandos abierto desde el disparador

- GIVEN la capa de comandos abierta desde su disparador visible
- WHEN el usuario presiona `Escape`
- THEN se cierra únicamente esa capa
- AND el foco regresa al disparador

#### Scenario: Cierre de comandos abierto por atajo

- GIVEN la capa de comandos abierta mediante `Ctrl/Cmd + K` desde un control del shell
- WHEN el usuario presiona `Escape`
- THEN se cierra únicamente esa capa
- AND el foco regresa al control previamente enfocado cuando éste sigue disponible

### Requirement: Precedencia contextual de teclado

El sistema MUST resolver eventos de teclado en el orden editable/IME → composite → overlay → feature → global. Un nivel posterior MUST actuar sólo cuando ningún nivel anterior haya consumido legítimamente el evento.

#### Scenario: Una composición IME conserva el evento

- GIVEN un campo editable con composición IME activa
- WHEN se produce una tecla que también podría corresponder a un atajo posterior
- THEN el editable o la composición conserva el evento
- AND no se abre ni se cierra una capa global

#### Scenario: Un composite conserva sus teclas

- GIVEN el foco dentro de un composite que posee una tecla de navegación
- WHEN el usuario presiona esa tecla
- THEN responde el composite
- AND no responde el overlay, la feature ni el nivel global

#### Scenario: El overlay tiene precedencia sobre la feature

- GIVEN una capa superior abierta
- WHEN el usuario presiona una tecla contextual como `Escape`
- THEN responde únicamente la capa superior
- AND la feature y el nivel global no ejecutan otra acción

#### Scenario: El atajo global actúa como último recurso

- GIVEN que no hay composición IME activa y ningún editable, composite, overlay o comportamiento de feature consume `Ctrl/Cmd + K`
- WHEN el usuario presiona el atajo
- THEN responde la entrada global de comandos

### Requirement: Accesibilidad aplicable WCAG 2.2 AA

La entrada runtime y la historia aprobada MUST satisfacer las comprobaciones aplicables de WCAG 2.2 AA: nombres accesibles, estructura y orden lógicos, operación por teclado, foco visible, contraste suficiente y estados no comunicados sólo mediante color.

#### Scenario: Revisión accesible de la entrada

- GIVEN la ruta runtime y la historia poblada
- WHEN se revisan con teclado, árbol de accesibilidad y comprobaciones de contraste
- THEN todos los controles disponibles tienen nombre y semántica reconocibles
- AND el orden de lectura y foco es lógico
- AND texto, controles e indicador de foco alcanzan el contraste aplicable
- AND cualquier estado visible dispone de una señal adicional al color

### Requirement: Composición exclusivamente workstation

La única composición aprobada para este cambio MUST ser workstation a 1440×980. El cambio MUST NOT definir ni declarar soporte para tablet, móvil, responsive, recomposición adaptativa, gestos o interacciones específicas de touch, ni para estados visuales adicionales.

#### Scenario: Cobertura visual limitada al viewport aprobado

- GIVEN las historias, pruebas visuales y recorridos end-to-end del cambio
- WHEN se revisan sus viewports y criterios de aceptación
- THEN la composición aprobada usa 1440×980
- AND no existen variantes, snapshots ni afirmaciones de aceptación para tablet, móvil, responsive o touch-specific

### Requirement: Frontera funcional de Bandeja

El cambio MUST exponer Bandeja como único destino de producto implementado. MUST NOT crear rutas, pantallas ni capacidades para Recursos, Catálogo, Actividad, Administración, Configuración, Maestro de recursos o el modelo Familia → Clase → Tipo → Recurso maestro.

#### Scenario: La navegación no amplía el producto

- GIVEN el registro de rutas y las capacidades disponibles
- WHEN se inspeccionan los destinos del primer slice
- THEN Bandeja es el único destino de producto implementado
- AND no existe ruta ni comportamiento funcional para las áreas futuras

### Requirement: Cobertura verificable de Bandeja workstation

El comportamiento de Bandeja MUST contar con pruebas enfocadas de Vitest y React Testing Library para shell, ruta, disparador de comandos, tabulación, precedencia, cierre y restauración de foco; MUST contar con un recorrido Playwright a 1440×980 para la ruta y el camino de teclado; y MUST contar con una historia verificable para la composición poblada aislada.

#### Scenario: Verificación enfocada del camino de teclado

- GIVEN la aplicación y el tooling disponibles
- WHEN se ejecutan las pruebas enfocadas y el recorrido Playwright workstation
- THEN se acredita la apertura de Bandeja
- AND `Tab` mantiene semántica nativa y foco visible
- AND `Ctrl/Cmd + K` abre la entrada cuando corresponde
- AND `Escape` cierra la capa superior y restaura el foco contextualmente

#### Scenario: Verificación de la separación Storybook/runtime

- GIVEN la historia poblada y la aplicación runtime construidas
- WHEN se ejecutan las pruebas de componente, visuales y aislamiento
- THEN Storybook presenta la composición aprobada con fixtures
- AND runtime no presenta ni empaqueta esos fixtures

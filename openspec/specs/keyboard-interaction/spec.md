# Especificación de Interacción Keyboard First

## Requirements

### Requirement: Arbitraje seguro

El orden de precedencia MUST ser edición/IME, consumo local, overlay, feature y atajo global. `Tab` y `Shift+Tab` permanecen nativos. `Ctrl+N` queda reservado al navegador; E y Del no se capturan. La ayuda global se activa por el carácter semántico `event.key === '?'`, sin depender de `event.code` ni de layout.

### Requirement: Registro compartido

El registro de comandos MUST ser la única fuente de los comandos disponibles para Command Palette, ayuda global y las pistas `kbd` de las CTA. `Ctrl/Cmd+K` abre la palette y `?` abre ayuda global.

### Requirement: Creación contextual

En Catálogo, `N` abre la única creación contextual real: Nueva Clase sin selección, Nueva Familia con Clase seleccionada, o Nuevo Tipo con Familia seleccionada. No se registran acciones de Recursos ni atajos E/Del hasta que exista una capacidad implementada y aprobada.

### Requirement: Navegación espacial

Las flechas sin modificadores usan geometría física de candidatos visibles, conectados, operables y habilitados. El orden DOM, el texto y la dirección RTL no sustituyen la geometría. El foco de un overlay se restaura al opener elegible o a un fallback accesible.

# Cadena de entrega: jerarquía del Catálogo

La transferencia final entrega lectura Convex y alta contextual de `Clase → Familia → Tipo`. La jerarquía se expresa siempre con flechas semánticas, y los datos poblados permanecen aislados en Storybook/pruebas.

## Teclado

El registro de comandos es la única fuente de la palette, la ayuda y las pistas `kbd` de CTA. `N` abre la creación contextual real: Clase, Familia o Tipo según la selección. `?` abre ayuda global por `event.key`; `Ctrl/Cmd+K` abre la palette; la navegación por flechas conserva geometría física. E y Del no se registran ni se muestran hasta que se implemente una capacidad aprobada.

## Límite

No se incluye Recursos, actualización, borrado, activación, desactivación, lifecycle, persistencia local ni datos de sustitución runtime.

## Evidencia histórica

La evidencia RED inicial histórica no está disponible. Se conserva como **FAILED / no observada** y no se interpreta ni se reescribe como una ejecución RED. La evidencia correctiva observada en el registro de cambio sigue siendo la única RED histórica declarada.

# Especificación de Jerarquía del Catálogo

## Purpose

Catálogo ofrece lectura Convex y creación contextual de `Clase → Familia → Tipo` dentro del workstation, sin Recursos ni operaciones de actualización, borrado, activación o ciclo de vida.

## Requirements

### Requirement: Jerarquía y lecturas contextuales

El runtime MUST mostrar el orden semántico `Clase → Familia → Tipo`. Debe leer Clases con `catalogoAdmin/jerarquia:listarClases`, Familias con `listarFamilias` y el `claseRecursoId` seleccionado, y Tipos con `listarTipos` y el `familiaRecursoId` seleccionado. Los descendientes se limpian al cambiar su padre y no se consulta un nivel dependiente sin padre válido. Fixtures poblados sólo pertenecen a Storybook o pruebas.

### Requirement: Creación contextual limitada

La CTA contextual y `N` representan exactamente la acción disponible: Nueva Clase sin selección, Nueva Familia tras seleccionar Clase y Nuevo Tipo tras seleccionar Familia. Familia y Tipo muestran su padre inmutable y envían respectivamente `claseRecursoId` o `familiaRecursoId`. Sólo se permiten `crearClase`, `crearFamilia` y `crearTipo`; E y Del están ausentes hasta que exista una capacidad aprobada.

### Requirement: Frontera

El frontend MUST validar respuestas desconocidas antes de React y no debe introducir backend propio, almacenamiento, fixtures runtime, Recursos, update, delete, activate, deactivate ni lifecycle.

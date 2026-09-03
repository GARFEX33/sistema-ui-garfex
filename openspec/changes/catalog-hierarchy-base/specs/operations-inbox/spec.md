# Delta para Entrada Workstation a Bandeja Operativa

## MODIFIED Requirements

### Requirement: Frontera funcional de Bandeja

El sistema MUST conservar Bandeja como una capacidad de producto implementada y MUST permitir que Catálogo coexista como un destino separado dentro del shell. La incorporación de Catálogo MUST NOT ampliar ni modificar las capacidades internas de Bandeja. Bandeja MUST NOT crear rutas, pantallas ni capacidades propias para Recursos, Actividad, Administración, Configuración, Maestro de recursos ni para funciones de Catálogo; la jerarquía Clase → Familia → Tipo pertenece exclusivamente a la nueva capacidad de Catálogo.

(Previously: Bandeja debía ser el único destino de producto implementado y Catálogo estaba prohibido como ruta o capacidad.)

#### Scenario: Catálogo coexiste sin ampliar Bandeja

- GIVEN el registro de rutas y las capacidades disponibles
- WHEN se inspeccionan los destinos del shell y la frontera de Bandeja
- THEN Bandeja y Catálogo existen como destinos separados
- AND Bandeja conserva sus comportamientos previamente aceptados
- AND ninguna responsabilidad de Clase, Familia o Tipo se implementa dentro de Bandeja
- AND no existe una ruta o capacidad de Recursos ni de las demás áreas futuras desde Bandeja

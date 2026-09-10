# Resource Creation Specification

## Purpose

Permitir crear Recursos con cualquier Unidad existente y activa, usando la Unidad confirmada exclusivamente como `Recurso.unidadId` y sin que las políticas de Unidad determinen el catálogo, la evaluación ni la creación.

## Requirements

### Requirement: Catálogo completo de Unidades activas

El Creador de Recursos MUST obtener y mostrar el catálogo completo y paginado de Unidades activas mediante la API pública existente `listarUnidades({ modo: 'ACTIVE' })`, independientemente de la Clase, Familia o Tipo previamente seleccionados. El catálogo MUST conservar su contrato paginado y excluir Unidades inactivas. El Creador MUST NOT solicitar políticas ni detalles individuales de Unidad para construir el catálogo, ni filtrar, ordenar, priorizar o preseleccionar opciones a partir de políticas.

#### Scenario: Unidad activa sin política aparece en el catálogo

- GIVEN una Familia y un Tipo seleccionados y varias Unidades existentes y activas, incluida una Unidad sin política efectiva
- WHEN la persona abre el selector de Unidad
- THEN el selector muestra todas las Unidades activas disponibles en las páginas del catálogo, incluida la Unidad sin política
- AND el orden y la disponibilidad no dependen de políticas de Unidad

#### Scenario: El catálogo recorre varias páginas sin duplicados

- GIVEN que el catálogo activo tiene más de una página
- WHEN la persona carga las páginas necesarias en el selector
- THEN cada Unidad activa aparece como máximo una vez
- AND no se solicitan políticas ni detalles individuales de Unidad para completar la lista

### Requirement: Confirmación explícita y accesible de Unidad

El Creador MUST conservar el recorrido keyboard-first aprobado de Clase a Familia, Tipo, Unidad, evaluación/revisión y creación. La navegación por teclado podrá cambiar la Unidad candidata, pero MUST requerir una acción explícita de confirmación por teclado para establecer la Unidad confirmada que se enviará a evaluación o creación. El foco y su restauración MUST conservar el comportamiento previamente aprobado y el recorrido MUST seguir siendo operable conforme a WCAG 2.2 AA.

#### Scenario: La navegación no confirma implícitamente una Unidad

- GIVEN una Unidad candidata enfocada en el selector y una Unidad confirmada distinta o ausente
- WHEN la persona navega por teclado hasta la candidata sin ejecutar la acción de confirmación
- THEN la Unidad candidata no sustituye la Unidad confirmada
- AND la evaluación y la creación no usan la candidata no confirmada

#### Scenario: Metro Lineal se confirma por teclado

- GIVEN un backend compatible con una Unidad activa llamada “Metro Lineal” que no tiene política efectiva
- WHEN la persona la alcanza en el selector mediante teclado y ejecuta la acción explícita de confirmación
- THEN “Metro Lineal” queda como la Unidad confirmada
- AND el flujo puede continuar a evaluación/revisión y creación sin requerir una política

### Requirement: Compatibilidad backend para Unidad activa

El backend MUST aceptar en evaluación y creación una `unidadId` confirmada que identifique una Unidad existente y activa, aunque no tenga política efectiva. Una Unidad inexistente o inactiva MUST seguir siendo inválida si se suministra directamente. La compatibilidad backend MUST estar desplegada antes de que el frontend habilite el catálogo directo de Unidades activas; los demás controles vigentes de jerarquía, ownership, atributos, valores, reglas e integridad MUST conservarse.

#### Scenario: Una Unidad activa sin política es aceptada

- GIVEN una `unidadId` de “Metro Lineal” existente y activa sin política efectiva
- WHEN el frontend solicita evaluación y posteriormente creación con esa `unidadId` confirmada
- THEN el backend acepta la Unidad por su existencia y estado activo
- AND el frontend completa el recorrido contra el backend real sin depender de una política

#### Scenario: Una Unidad ausente o inactiva es rechazada

- GIVEN una `unidadId` que no existe o corresponde a una Unidad inactiva
- WHEN un cliente solicita directamente evaluación o creación con esa `unidadId`
- THEN el backend rechaza la solicitud
- AND el frontend no ofrece una Unidad inactiva como opción válida

### Requirement: Persistencia exclusiva de la referencia de Unidad

La creación de un Recurso MUST persistir la Unidad confirmada únicamente en `Recurso.unidadId`. La evaluación y la creación MUST NOT requerir ni persistir un identificador de política, ni crear, activar, desactivar, reordenar o modificar políticas de Unidad.

#### Scenario: Crear un Recurso no altera políticas

- GIVEN políticas de Unidad existentes y una Unidad activa confirmada sin política efectiva
- WHEN la persona evalúa y crea un Recurso
- THEN el Recurso creado conserva la Unidad confirmada en `Recurso.unidadId`
- AND las políticas existentes permanecen idénticas
- AND no se crea ninguna política nueva

### Requirement: Independencia de evaluación frente a políticas

La elegibilidad, el orden del catálogo y la huella de una evaluación de creación MUST NOT depender de la existencia, eliminación, sombreado o cambio de principal de una política de Unidad. La huella MUST seguir invalidándose ante cambios relevantes de Unidad, jerarquía, atributos, valores, reglas u ownership.

#### Scenario: Un cambio de política no invalida la evaluación

- GIVEN una evaluación de creación válida para una Unidad existente y activa
- WHEN cambia únicamente una política de Unidad, incluida su creación, eliminación, sombreado o principal
- THEN la evaluación permanece válida respecto de la Unidad confirmada
- AND la huella de evaluación no cambia sólo por ese cambio de política

#### Scenario: Un cambio relevante conserva la invalidación

- GIVEN una evaluación de creación válida para una Unidad existente y activa
- WHEN cambia un dato relevante de Unidad, jerarquía, atributos, valores, reglas u ownership
- THEN la evaluación deja de ser utilizable hasta realizar una evaluación vigente

### Requirement: Robustez del cargador de catálogo activo

El cargador del catálogo activo MUST conservar retry, deduplicación y descarte de respuestas obsoletas al usar páginas de `listarUnidades({ modo: 'ACTIVE' })`. Una respuesta de una apertura o generación obsoleta MUST NOT sustituir ni mezclar el catálogo vigente.

#### Scenario: Una respuesta tardía no reemplaza la lista vigente

- GIVEN una solicitud de catálogo iniciada para una apertura anterior del selector
- WHEN se inicia una apertura o generación posterior y la respuesta anterior llega después
- THEN el selector conserva únicamente los resultados de la apertura o generación vigente
- AND no muestra Unidades duplicadas ni resultados obsoletos

#### Scenario: Un fallo recuperable vuelve a cargar el catálogo activo

- GIVEN que una página del catálogo activo falla de forma recuperable
- WHEN la persona reintenta la carga
- THEN el selector vuelve a solicitar la página mediante `listarUnidades({ modo: 'ACTIVE' })`
- AND incorpora los resultados sin duplicar Unidades ya recibidas

## Scope and Non-Goals

Esta especificación se limita a la fuente de catálogo de Unidad del Creador de Recursos y a la compatibilidad backend necesaria para aceptar una Unidad existente y activa. No SHALL crear ni modificar políticas de Unidad, su CRUD, reglas administrativas o de publicación; crear Unidades desde el Creador; alterar Clase, Familia, Tipo, atributos u ownership; introducir endpoints, esquemas, índices, dependencias, estado global o migraciones; ni definir preferencias o defaults futuros basados en políticas. Tampoco SHALL modificar los artefactos históricos aprobados de `keyboard-first-resource-creation`.

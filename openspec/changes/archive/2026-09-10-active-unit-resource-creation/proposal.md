# Propuesta — Unidades activas para creación de recursos

## Intención

Permitir que una persona seleccione cualquier Unidad existente y activa al crear un Recurso, aunque esa Unidad no tenga una política efectiva asociada a la Familia o al Tipo elegidos.

La Unidad confirmada representa exclusivamente `Recurso.unidadId`. Las políticas de unidad dejan de determinar elegibilidad, orden o preferencia dentro de este flujo y no se crean ni modifican como consecuencia de evaluar o crear un Recurso.

## Problema

El Creador de Recursos obtiene hoy sus candidatos desde políticas de unidad y después hidrata las Unidades referenciadas. Como resultado, una Unidad válida y activa queda oculta cuando no existe una política efectiva para ella. El backend reproduce el mismo supuesto: puede rechazar la evaluación o creación porque la Unidad seleccionada no forma parte de las políticas resueltas, aunque la entidad exista y esté activa.

Esta divergencia convierte metadatos administrativos o de default en una autorización implícita, impide crear Recursos válidos y hace que la disponibilidad mostrada dependa de una configuración que el producto no exige.

## Resultados esperados

- El Creador muestra siempre el catálogo completo de Unidades activas.
- Una Unidad existente y activa puede evaluarse y persistirse como `Recurso.unidadId` sin política efectiva.
- Una Unidad inexistente o inactiva continúa siendo inválida.
- La creación persiste únicamente la referencia de Unidad del Recurso y no crea, activa, desactiva, reordena ni modifica políticas.
- Las políticas permanecen disponibles como metadatos administrativos o de default, pero no filtran ni ordenan las opciones del Creador.
- Los cambios de políticas dejan de invalidar por sí solos una evaluación de creación que ya no depende de ellas.
- La experiencia keyboard-first previamente aprobada se conserva al cambiar la fuente del catálogo.

## Alcance cruzado entre repositorios

### Backend — `/home/garfex/PROGRAMACION/sistema-garfex`

- Aceptar en evaluación y creación cualquier Unidad suministrada que exista y esté activa, sin exigir una política efectiva.
- Retirar las políticas del grafo de evaluación y de la huella de catálogo usada por la creación basada en selecciones.
- Alinear los caminos compatibles de creación, actualización y activación de Recursos para que las violaciones derivadas únicamente de políticas no bloqueen una Unidad activa, conservando las demás validaciones de jerarquía, ownership, atributos e integridad.
- Mantener el CRUD y las reglas administrativas o de publicación de políticas fuera de este cambio.
- Mantener `listarUnidades({ modo: 'ACTIVE' })` como API pública de catálogo; no crear un endpoint, tabla, índice ni migración nuevos.
- Incorporar cobertura que demuestre aceptación sin política, rechazo de Unidades ausentes o inactivas, estabilidad de la huella ante cambios de políticas y ausencia de escrituras sobre políticas.

### Frontend — `/home/garfex/PROGRAMACION/sistema-ui-garfex`

- Consumir el endpoint existente `listarUnidades({ modo: 'ACTIVE' })` desde el adapter local de `resources-master`, incluyendo su contrato paginado y validación de respuesta.
- Sustituir la resolución política → detalle de Unidad por el listado directo de Unidades activas, preservando paginación, deduplicación, retry y descarte de respuestas obsoletas.
- Eliminar del Creador las solicitudes de políticas, la hidratación individual de candidatos y cualquier ranking o selección preferida derivada de políticas.
- Mantener la selección candidato/confirmado, el comportamiento de foco, la navegación por teclado y los componentes compartidos del sistema de diseño.
- Enviar únicamente el `unidadId` confirmado en evaluación y creación.
- Añadir cobertura unitaria y E2E del recorrido completo con una Unidad activa sin política.

### Orden de entrega

1. Implementar, validar y desplegar primero la compatibilidad backend.
2. Cambiar después el adapter y loader frontend a `listarUnidades({ modo: 'ACTIVE' })`.
3. Integrar la experiencia visible y la cobertura E2E sobre un backend ya compatible.

Este orden evita que el frontend ofrezca una Unidad que una versión anterior del backend todavía rechazaría.

## Áreas afectadas

- Evaluación y persistencia de creación de Recursos.
- Validación backend de `unidadId` en los caminos de Recurso relacionados.
- Grafo y fingerprint de evaluación de catálogo.
- Adapter, loader y selector de Unidad del Creador frontend.
- Pruebas de contrato, dominio, integración, UI y E2E en ambos repositorios.
- Secuencia coordinada de despliegue backend → frontend.

## No objetivos

- Crear, migrar, eliminar o modificar políticas de unidad.
- Cambiar el CRUD, las reglas administrativas o las reglas de publicación de políticas.
- Usar políticas para filtrar, priorizar, preseleccionar o reordenar Unidades en este cambio.
- Crear Unidades desde el Creador de Recursos.
- Cambiar la selección o validación de Clase, Familia, Tipo, atributos u ownership.
- Alterar los DTO públicos de evaluación/creación más allá de eliminar la dependencia interna de políticas.
- Añadir una API backend, esquema, índice, dependencia frontend, estado global o migración de datos.
- Cambiar snapshots o catálogos publicados como efecto colateral.
- Reescribir ni modificar el historial completado de `keyboard-first-resource-creation`.
- Definir una futura experiencia de preferencia/default basada en políticas.

## Dependencias y condiciones

- El endpoint existente `listarUnidades({ modo: 'ACTIVE' })` debe conservar su contrato paginado y excluir Unidades inactivas.
- La compatibilidad backend debe estar disponible antes de habilitar el nuevo catálogo frontend.
- El diseño técnico debe desacoplar de los prechecks de Recurso las violaciones exclusivamente derivadas de políticas, incluida la ausencia de evaluación de políticas, sin silenciar otras violaciones del agregado.
- La huella de evaluación debe seguir reaccionando a cambios realmente relevantes de Unidad, jerarquía, atributos, valores, reglas u ownership.
- El selector frontend debe reutilizar los patrones y componentes existentes; no se introduce una variante visual aislada.
- El presupuesto de revisión es de 400 líneas por unidad de trabajo y repositorio. La estrategia es `ask-on-risk`: si una unidad cohesiva lo supera, se requiere una decisión humana posterior antes de apply; esta propuesta no autoriza una cadena ni `size:exception`.

## Riesgos y mitigaciones

| Riesgo | Mitigación propuesta |
| --- | --- |
| El frontend muestra una Unidad que el backend desplegado aún rechaza. | Entregar y desplegar backend antes que frontend. |
| Permanece una dependencia indirecta de políticas en validación, agregado o fingerprint. | Cubrir evaluación, creación y caminos compatibles sin política, además de cambios de política que no alteren la huella. |
| Al retirar bloqueos de política se silencian validaciones no relacionadas. | Ignorar sólo condiciones derivadas de políticas y mantener explícitamente jerarquía, ownership, atributos e integridad restante. |
| Una política tardía, incompleta o fallida vuelve a afectar la lista. | No solicitar políticas desde el Creador ni usarlas como fallback o ranking. |
| La creación muta datos administrativos accidentalmente. | Verificar que sólo se persiste `Recurso.unidadId` y que las filas de políticas permanecen intactas. |
| El cambio de loader degrada navegación, foco o estados obsoletos. | Conservar el selector compartido y cubrir teclado, paginación, retry, deduplicación y respuestas stale. |
| El alcance invade administración/publicación de políticas. | Mantener esas reglas como no objetivo y separar cualquier cambio futuro. |

## Rollback

No se requiere rollback de datos porque no hay migración ni escritura nueva sobre políticas.

- Si falla la integración frontend, revertir el frontend a su fuente anterior mientras se mantiene desplegada la compatibilidad backend; el backend ampliado continúa aceptando los casos previamente válidos.
- Si falla el cambio backend antes de habilitar el frontend, revertir su unidad de entrega sin transformación de datos.
- No desplegar o mantener el frontend nuevo contra un backend revertido que todavía exija políticas.
- Las políticas existentes y los `unidadId` ya persistidos permanecen intactos durante cualquier rollback.

## Criterios de aceptación observables

1. Dadas varias Unidades existentes y activas, el selector de creación muestra el catálogo activo completo aunque ninguna tenga política efectiva para la Familia o el Tipo seleccionados.
2. Una Unidad activa sin política —incluido el caso representativo “Metro Lineal”— puede elegirse con mouse o teclado, confirmarse, evaluarse y completar la creación del Recurso.
3. El Recurso creado conserva la Unidad elegida en `Recurso.unidadId` y no contiene ni requiere un identificador de política.
4. Las políticas existentes son idénticas antes y después de evaluar y crear el Recurso; no aparece ninguna política nueva.
5. Una Unidad inactiva o inexistente no se ofrece como opción válida y el backend continúa rechazándola si se suministra directamente.
6. Crear, eliminar, sombrear o cambiar el principal de una política no cambia por sí solo la elegibilidad, el orden del catálogo ni la huella de una evaluación de creación.
7. La lista soporta más de una página sin duplicados y descarta resultados tardíos de una apertura o generación ya obsoleta.
8. El recorrido keyboard-first Clase → Familia → Tipo → Unidad → evaluación/revisión → creación conserva navegación, confirmación y restauración de foco previamente aprobadas.
9. No se realizan solicitudes de políticas ni solicitudes individuales de detalle de Unidad para construir el catálogo del selector.
10. Los flujos y validaciones no relacionados con políticas mantienen su comportamiento vigente.

## Compatibilidad e historial

Este cambio sucede a `keyboard-first-resource-creation` y amplía su fuente de datos y compatibilidad backend sin alterar sus artefactos, commits o pruebas históricas aprobadas. Las políticas existentes siguen siendo datos válidos de administración/default; únicamente dejan de actuar como filtro, ranking o autorización para seleccionar `Recurso.unidadId` durante la creación.

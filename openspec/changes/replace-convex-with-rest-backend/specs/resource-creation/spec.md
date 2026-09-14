# Delta for Resource Creation

## MODIFIED Requirements

### Requirement: Catálogo completo de Unidades activas

El Creador de Recursos MAY listar `UNIDAD` mediante el listado REST genérico de catálogo con `scope=ACTIVE`, `offset` y `limit` sólo si el mapper puede validar los valores requeridos documentados (`code`, `name`, `symbol`, `dimension`) y el flujo no afirma un orden no documentado. La lista MUST NOT consultar ni derivar elegibilidad desde `POLITICA_UNIDAD`, ni sustituir respuestas con Convex o datos locales. Si la semántica necesaria para usar una Unidad como `naturalUnit` no queda demostrada por el contrato público, el Creador MUST mostrar una brecha bloqueante y reportarla al humano.

(Previously: El Creador obtenía Unidades activas desde la API pública Convex `listarUnidades`.)

#### Scenario: Una Unidad REST documentada puede mostrarse

- GIVEN una página REST válida de `UNIDAD` activa y una semántica de Unidad natural confirmada por contrato público
- WHEN la persona abre el selector de Unidad
- THEN el selector muestra sólo Unidades mapeadas desde valores REST validados
- AND no consulta políticas ni Convex para completar la lista

#### Scenario: Semántica de Unidad natural no demostrada

- GIVEN que el contrato público no demuestra cómo una `UNIDAD` de catálogo satisface `Resource.naturalUnit`
- WHEN la persona alcanza la etapa de Unidad
- THEN el Creador muestra un bloqueo explícito de integración
- AND no habilita una unidad inferida ni una creación sustituta

### Requirement: Borrador reversible para condiciones resueltas por backend

El Creador MUST usar el baseline estático de `GET /v1/types/{typeCode}/attributes/effective` sólo como punto de partida sin valores de Recurso y MUST conservar el borrador de valores como estado de interfaz no autoritativo. Cuando deba obtener aplicabilidad, modos, `notApplicable`, `identityParticipates` u `options` dinámicos para ese borrador, MUST enviar exactamente `{ values: ResourceAttribute[] }` a `POST /evaluate` y validar la respuesta completa contra el mismo schema público de atributos efectivos. El Creador MUST aceptar los modos condicionales, prohibiciones, identidad y opciones estrechadas únicamente como salida de Core; MUST NOT evaluarlos, suspender/restaurar selecciones ni derivar reglas localmente.

Cuando el descriptor de Característica de un atributo requiera una opción controlada, su `ResourceAttribute` MUST mapear la opción seleccionada al `CatalogValue` wire `{ kind: "CONTROLLED_OPTION", value: códigoDeOpción }` conforme al schema público. El Creador MUST rechazar antes de evaluar una representación `TEXT`, `ENUM` o `CODE` para ese atributo controlado; ese rechazo de forma wire MUST NOT sustituirse por inferencia de opciones permitidas ni por una regla de negocio local.

(Previously: El borrador bloqueaba toda evaluación REST y suspendía o restauraba selecciones según evaluaciones Convex.)

#### Scenario: El Creador solicita evaluación dinámica a Core

- GIVEN un baseline efectivo estático y un borrador de valores de Recurso
- WHEN el Creador necesita el resultado dinámico de ese borrador
- THEN envía exclusivamente `{ values: ResourceAttribute[] }` a `POST /evaluate`
- AND presenta sólo los modos, `notApplicable`, identidad y opciones de la respuesta validada de Core

#### Scenario: Una opción controlada usa su wire kind exacto

- GIVEN una Característica cuyo descriptor requiere opción controlada y una opción con código seleccionado
- WHEN el Creador construye su `ResourceAttribute`
- THEN envía el `CatalogValue` con `kind` `CONTROLLED_OPTION` y el código de opción como `value`
- AND rechaza `TEXT`, `ENUM` y `CODE` como representaciones de esa selección

#### Scenario: La condición no se resuelve en cliente

- GIVEN una evaluación dinámica que cambia un atributo a `FORBIDDEN` o `notApplicable`
- WHEN el Creador recibe la respuesta de Core
- THEN actualiza el estado visible sólo conforme a la respuesta validada
- AND no ejecuta reglas locales para anticipar, confirmar o revertir esa condición

### Requirement: Evaluación, revisión y creación autoritativas con el baseline REST disponible

El Creador MUST tratar `POST /evaluate` como evaluación dinámica de atributos, no como mutación ni confirmación de creación. Su respuesta usa el mismo schema efectivo y puede reflejar modos condicionales, `notApplicable`, identidad y `options` estrechadas por Core; el Creador MUST consumirla sin calcular semántica propia. `POST /v1/resources`, `PUT /v1/resources/{id}`, desactivar y reactivar siguen siendo operaciones separadas: una evaluación exitosa MUST NOT enviar, habilitar por sí sola ni confirmar ninguna de esas mutaciones. Una creación sólo MAY usar `POST /v1/resources` cuando su input completo, actor y gate propio estén respaldados; el 201 `Resource` válido continúa siendo su única confirmación.

`catalogFingerprint`, resultados `CATALOG_CHANGED`/`INCOMPLETE`/`INVALID`, nombre generado, identidad técnica derivada e incidencias de creación continúan no documentados. El Creador MUST bloquear y comunicar esos pasos sin calcularlos ni presentarlos como resultado de `POST /evaluate`.

(Previously: La evaluación estaba bloqueada por REST ausente y la creación Convex usaba fingerprint y disposiciones de negocio.)

#### Scenario: La evaluación no muta Recursos

- GIVEN un borrador de atributos enviado correctamente a `POST /evaluate`
- WHEN Core devuelve una respuesta efectiva dinámica válida
- THEN el Creador actualiza sólo la revisión de atributos con esa respuesta
- AND no envía create, update, deactivate ni reactivate

#### Scenario: Crear conserva su gate separado

- GIVEN una evaluación dinámica exitosa y un actor local configurado
- WHEN el flujo alcanza la creación de Recurso
- THEN no considera la evaluación como confirmación ni habilitación suficiente de creación
- AND mantiene bloqueado cualquier paso que requiera fingerprint, disposición o contrato de creación no documentado

#### Scenario: Revisión basada en fingerprint no se simula

- GIVEN que el recorrido keyboard-first llega a un fingerprint, disposición o incidencia de creación
- WHEN el contrato REST no documenta esa salida
- THEN la interfaz muestra un estado bloqueado comprensible y accesible
- AND no lo sustituye con una evaluación local o con la respuesta de `POST /evaluate`

### Requirement: Límite explícito del corte frontend con REST

La migración MUST conservar la shell, rail, barra de comandos, foco, edición y navegación keyboard-first existentes sólo en decisiones y comandos REST demostrados. Los pasos de atributos, evaluación, revisión o creación que requieran contrato ausente MUST permanecer visibles como bloqueados o de integración pendiente, con su impacto reportado al humano; MUST NOT reemplazarse por endpoints, DTOs, errores, evaluaciones o mocks runtime inventados. Los dobles de prueba MUST usar únicamente DTOs REST documentados.

(Previously: El corte se limitaba temporalmente a contratos Convex actuales antes de integrar su baseline v1.)

#### Scenario: El recorrido comunica una brecha sin perder accesibilidad

- GIVEN que una etapa posterior necesita una capacidad REST no documentada
- WHEN la persona llega a la etapa mediante teclado
- THEN encuentra un estado con nombre accesible y foco manejable
- AND puede volver o cerrar el Creador conforme al contrato de teclado existente

### Requirement: Autoridad y compatibilidad preservadas

El backend REST público MUST conservar autoridad sobre persistencia, validación y concurrencia de las operaciones que documenta. El frontend MUST NOT inspeccionar ni modificar internals backend, crear backend propio, retener Convex como compatibilidad, introducir persistencia, store global, ruta nueva o listener global de teclado. Los cambios de visual, foco y atajos MUST limitarse a los necesarios para exponer estados REST soportados o brechas explícitas y conservar WCAG 2.2 AA.

(Previously: La autoridad incluía operaciones Convex de evaluación y el método legado `crearRecurso`.)

#### Scenario: La retirada de Convex no crea una ruta dual

- GIVEN una implementación migrada del Creador
- WHEN se inspeccionan sus dependencias y flujos de error
- THEN no existe llamada, fallback ni mock runtime de Convex
- AND una capacidad REST no documentada permanece bloqueada y reportada, no emulada

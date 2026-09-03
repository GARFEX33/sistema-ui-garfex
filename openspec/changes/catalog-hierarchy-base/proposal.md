# Propuesta — Base jerárquica del catálogo

## Estado

`proposed`

Esta propuesta autoriza la definición funcional de la base de Catálogo para workstation. No autoriza todavía `design` ni `apply`: ambas fases permanecen bloqueadas hasta que la recuperación OpenPencil haya terminado y su resultado haya sido auditado y corregido para expresar `Clase → Familia → Tipo`. El gate nominal de API ya está satisfecho: la superficie pública Convex autoritativa seleccionada es `catalogoAdmin/jerarquia` y su contrato relevante está registrado en `api-contract.md`. Permanecen abiertos los gates de evidencia runtime y aprobación visual.

## Problema

GARFEX necesita una base de gobierno del Catálogo que permita recorrer, consultar y crear los tres niveles que organizan los Recursos: Clases, Familias y Tipos. Hoy el frontend sólo ofrece Bandeja y no dispone de una capacidad de Catálogo ni de integración con la API existente. Además, la referencia visual preliminar conocida representa una jerarquía obsoleta o mezcla capacidades posteriores, por lo que convertirla en autoridad produciría relaciones, selectores y breadcrumbs incorrectos.

Sin una base explícita y coherente, el producto corre el riesgo de:

- presentar la jerarquía en un orden incorrecto;
- permitir cambios de padre que contradigan las invariantes del dominio;
- inventar contratos de transporte, permisos o reglas no confirmadas;
- ampliar el alcance hacia Recursos u otras funciones de gobierno antes de tiempo;
- confundir una imagen preliminar con aprobación visual final.

## Intención y resultado de producto

Incorporar dentro del mismo cambio una capacidad workstation coherente de Catálogo que permita:

1. entrar al Catálogo desde la navegación persistente;
2. recorrer la jerarquía canónica `Clase → Familia → Tipo` manteniendo visible el contexto;
3. consultar los elementos disponibles en cada uno de esos tres niveles;
4. crear una Clase, crear una Familia dentro de una Clase y crear un Tipo dentro de una Familia;
5. conservar como inmutables las relaciones padre de Familia y Tipo después de su creación.

La navegación, lectura y creación forman una sola capacidad de producto. Podrán implementarse en secuencia para reducir riesgo, pero no se redefine este cambio como un producto separado de navegación sin comportamiento de Catálogo.

## Comportamiento de dominio confirmado

La autoridad funcional de esta propuesta es:

```text
Clase
└── Familia (claseRecursoId → Clase)
    └── Tipo (familiaRecursoId → Familia)
        └── Recurso (tipoRecursoId → Tipo) [fuera de alcance]
```

Reglas confirmadas:

- una Familia pertenece a una Clase mediante `Familia.claseRecursoId`;
- un Tipo pertenece a una Familia mediante `Tipo.familiaRecursoId`;
- la relación Familia→Clase es inmutable después de crear la Familia;
- la relación Tipo→Familia es inmutable después de crear el Tipo;
- la creación respeta el orden Clase, Familia dentro de Clase y Tipo dentro de Familia;
- `Recurso.tipoRecursoId` pertenece al modelo canónico, pero Recursos y su reclasificación no forman parte del cambio;
- una futura reclasificación Recurso→Tipo será un flujo controlado y auditable, no una mutación genérica derivada de esta propuesta;
- el backend externo conserva la autoridad sobre datos, relaciones y validación efectiva.

Estas reglas se apoyan en el contrato nominal verificado, pero no presuponen permisos, datos, errores runtime, mensajes ni estados UX no demostrados.

## Contrato de API verificado

La superficie pública Convex autoritativa para este cambio es `catalogoAdmin/jerarquia`. Una ejecución exitosa de `npx convex function-spec` satisfizo el gate de nombres de funciones y validadores. El detalle y la procedencia se conservan en `api-contract.md`.

Operaciones seleccionadas para este alcance:

- Clase: `crearClase({ activo?, clave, descripcion?, nombre })`, `obtenerClase({ claseRecursoId })` y `listarClases({ cursor?, modo?: ALL|ACTIVE|INACTIVE, pageSize? })`;
- Familia: `crearFamilia({ activo?, claseRecursoId, clave, descripcion?, nombre })`, `obtenerFamilia({ familiaRecursoId })` y `listarFamilias({ claseRecursoId?, cursor?, modo?: ALL|ACTIVE|INACTIVE, pageSize? })`;
- Tipo: `crearTipo({ activo?, clave, descripcion?, familiaRecursoId, nombre })`, `obtenerTipo({ tipoRecursoId })` y `listarTipos({ cursor?, familiaRecursoId?, modo?: ALL|ACTIVE|INACTIVE, pageSize? })`.

Los listados devuelven `{ continuationCursor, isExhausted, items }` y las creaciones `{ disposition: "CREATED", item }`. Los items comparten `activo`, `clave`, `descripcion?`, `effective`, `effectiveReasons[]`, `id`, `nombre` y `revision`; Familia añade `claseRecursoId`, y Tipo añade `familiaRecursoId`, `aggregateStatus` y `violations`.

Existen funciones de actualización, activación y desactivación, pero quedan fuera de navegación, lectura y creación. Aunque los validadores administrativos de actualización admitan IDs de padre opcionales, el frontend MUST NOT exponerlos ni enviarlos: Familia→Clase y Tipo→Familia siguen siendo contratos de producto inmutables.

`function-spec` no establece errores o mensajes runtime, permisos efectivos, datos reales ni estados UX. Tampoco autoriza a inventar su semántica. Esas dimensiones permanecen sujetas a evidencia conectada y aprobación de producto/visual.

## Alcance

### Incluido

- entrada de Catálogo en la navegación workstation existente;
- rutas y superficies necesarias para Clases, Familias y Tipos;
- breadcrumbs, selectores o contexto equivalente que expresen exclusivamente `Clase → Familia → Tipo`, según el diseño finalmente aprobado;
- lectura de Clases, Familias de la Clase contextual y Tipos de la Familia contextual;
- creación de Clase;
- creación de Familia dentro de una Clase explícita;
- creación de Tipo dentro de una Familia explícita;
- representación no editable del padre de una Familia o un Tipo ya creados;
- operación por teclado, nombres accesibles, foco visible, orden lógico y contraste aplicable conforme a WCAG 2.2 AA;
- cobertura workstation y evidencia de pruebas proporcional a los comportamientos aprobados;
- integración directa y mínima con `catalogoAdmin/jerarquia`, limitada a las funciones de navegación, lectura y creación registradas en `api-contract.md`, localizada en la feature y sin convertir el frontend en autoridad de dominio.

### Secuenciación dentro del cambio

La entrega podrá avanzar mediante cortes verificables dentro de `catalog-hierarchy-base`:

1. navegación y contexto jerárquico correctos;
2. lectura conectada de los niveles;
3. creación conectada en orden jerárquico e invariantes de padre.

Esta secuencia no habilita datos ficticios en runtime ni permite dar por terminada la capacidad completa sólo con navegación. Ningún corte conectado inventará comportamiento más allá del contrato nominal verificado ni avanzará sobre estados runtime/UX que requieran evidencia o aprobación aún pendiente.

## No objetivos

- implementación, listado, creación, edición o reclasificación de Recursos;
- unidades;
- definiciones, opciones o asignaciones de atributos;
- reglas, presentación, compatibilidad o publicación;
- flujos de auditoría o reclasificación futuros;
- responsive, tablet, móvil, gestos o comportamiento específico de touch;
- estados visuales no aprobados;
- implementación o modificación del backend;
- inferencia de funciones o payloads fuera de `api-contract.md`, así como de errores runtime, mensajes, permisos, reglas de unicidad o ciclo de vida no verificados;
- persistencia frontend, datos ficticios de producto, fallbacks locales o sincronización inventada;
- stores globales, repositorios, casos de uso, gateways, facades o una capa Query especulativa;
- modificación de Bandeja más allá de preservar su convivencia dentro del shell;
- actualización, activación o desactivación de Clase, Familia o Tipo;
- modificación de `design.op`, `design-recovered.op`, `recovery/**` o cualquier evidencia de recuperación OpenPencil.

## Capacidades y deltas de especificación

### Nueva capacidad: `catalog-hierarchy`

Se añadirá una especificación canónica para:

- acceso workstation a Catálogo;
- navegación contextual `Clase → Familia → Tipo`;
- lectura de cada nivel respetando su padre;
- creación jerárquica de Clase, Familia y Tipo;
- inmutabilidad observable de Familia→Clase y Tipo→Familia;
- manejo accesible de los comportamientos y estados que resulten aprobados;
- separación entre reglas de dominio confirmadas, contrato nominal de API verificado e incógnitas runtime/UX.

Los criterios normativos se expresarán en términos observables con escenarios Given/When/Then. Usarán exclusivamente las funciones y formas registradas en `api-contract.md`, sin convertir las incógnitas runtime o visuales en comportamiento inventado.

### Delta: `frontend-foundation`

La prohibición vigente de cliente backend y contrato de endpoint pertenece al primer slice sin integración. Se ajustará de forma acotada para permitir la integración mínima de esta feature con la API autoritativa verificada, manteniendo la prohibición de backend propio, persistencia, autoridad de dominio e infraestructura especulativa.

La organización seguirá siendo feature-first: las responsabilidades de Catálogo permanecerán en su feature y sólo se promoverá una pieza a `shared` cuando exista un segundo consumidor real y la responsabilidad sea transversal.

### Delta: `operations-inbox`

La restricción histórica que declara Bandeja como único destino implementado se actualizará para permitir Catálogo como nuevo destino, sin ampliar ni alterar las capacidades internas de Bandeja. Sus fixtures continuarán aislados de runtime y no se reutilizarán como datos o patrones contractuales de Catálogo.

## Áreas afectadas

- navegación persistente y routing de la aplicación;
- nueva frontera feature-first de Catálogo;
- composición workstation y contexto jerárquico;
- formularios o controles de creación que el diseño aprobado requiera;
- acceso mínimo a la API dentro de la feature;
- pruebas de ruta, navegación, lectura, creación, inmutabilidad y accesibilidad;
- especificaciones canónicas `frontend-foundation` y `operations-inbox` por sus restricciones históricas.

No se prevén migraciones de datos, cambios backend ni modificación de artefactos OpenPencil.

## Dependencias y gates

1. **Contrato nominal de API — satisfecho:** `npx convex function-spec` verificó nombres, validadores y formas declaradas relevantes de la superficie pública `catalogoAdmin/jerarquia`; el resultado seleccionado está registrado en `api-contract.md`.
2. **Evidencia runtime — pendiente:** errores, mensajes, permisos efectivos, datos reales y comportamiento conectado sólo podrán especificarse tras observar evidencia suficiente; no se inferirán desde `function-spec`.
3. **Autoridad visual — pendiente:** finalizar la recuperación OpenPencil, auditarla y corregir cada orden, selector, breadcrumb y dependencia a `Clase → Familia → Tipo`.
4. **Aprobación de estados — pendiente:** loading, vacío, error, sin resultados, datos parciales, falta de permisos y fallo de creación sólo se incorporarán cuando tengan semántica y tratamiento visual aprobados.
5. **Diseño:** permanece bloqueado hasta satisfacer el gate de OpenPencil corregido; la imagen actual es referencia preliminar, no aprobación.
6. **Apply:** permanece bloqueado hasta contar con especificación y diseño aprobados sobre OpenPencil corregido, además de la evidencia runtime necesaria para los comportamientos conectados que se pretendan implementar.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Repetir la jerarquía obsoleta de la imagen | Navegación y relaciones incorrectas | Auditar toda evidencia contra la jerarquía canónica antes de diseño y apply. |
| Convertir la imagen preliminar en aprobación | Estados o composición sin autoridad | Identificarla sólo como referencia y bloquear diseño/apply hasta OpenPencil corregido. |
| Extrapolar `function-spec` a comportamiento runtime | Integración o UX con semántica falsa | Limitar el transporte a `api-contract.md` y exigir evidencia adicional para errores, permisos, datos y mensajes. |
| Habilitar cambio de padre | Ruptura de invariantes de catálogo | Fijar el padre durante creación y mostrarlo como no editable posteriormente. |
| Expandir hacia Recursos u otras áreas | Pérdida de foco y mayor carga de revisión | Aplicar los no objetivos a rutas, componentes, pruebas y contratos. |
| Introducir infraestructura preventiva | Complejidad y doble autoridad | Mantener integración y estado en la feature; abstraer sólo por necesidad demostrada. |
| Estados de fallo no definidos | UX inconsistente o engañosa | Resolverlos con contrato real y aprobación visual antes de implementarlos. |
| Regresión de Bandeja o shell | Deterioro de la capacidad existente | Limitar el cambio compartido a navegación/composición y conservar pruebas de regresión. |

## Rollout y límites de rollback

El rollout será incremental dentro de una única capacidad, con activación sólo de cortes que tengan diseño aprobado, contrato suficiente y pruebas verificadas. La navegación estructural no se presentará como Catálogo operativo si lectura y creación aún no están disponibles, y runtime no usará fixtures para aparentar disponibilidad.

El rollback frontend podrá retirar las rutas, la entrada de navegación, la feature de Catálogo y su integración sin migraciones ni cambios sobre datos backend. Debe preservar Bandeja, el shell no relacionado, las especificaciones archivadas y todos los artefactos OpenPencil. Si una operación conectada resulta incompatible con el contrato real, se retirará o deshabilitará esa integración antes que sustituirla con persistencia local, datos ficticios o reglas inventadas.

No existe rollback backend en este cambio porque no se propone modificarlo. Las entidades creadas correctamente mediante la API no se eliminarán automáticamente como parte de un rollback frontend salvo que exista un procedimiento de negocio confirmado fuera de esta propuesta.

## Dirección de aceptación medible

La especificación y verificación posteriores deberán demostrar, como mínimo:

- la navegación workstation ofrece Catálogo sin romper el acceso a Bandeja;
- toda presentación jerárquica observada usa el orden `Clase → Familia → Tipo`;
- al seleccionar una Clase sólo se solicita o presenta el contexto de sus Familias conforme al contrato real;
- al seleccionar una Familia sólo se solicita o presenta el contexto de sus Tipos conforme al contrato real;
- una Clase puede crearse mediante `catalogoAdmin/jerarquia:crearClase` con sus argumentos verificados;
- una Familia sólo puede crearse mediante `catalogoAdmin/jerarquia:crearFamilia` con una `claseRecursoId` explícita, y el frontend no expone ni envía un cambio de padre posterior;
- un Tipo sólo puede crearse mediante `catalogoAdmin/jerarquia:crearTipo` con una `familiaRecursoId` explícita, y el frontend no expone ni envía un cambio de padre posterior;
- ninguna ruta, acción o dato de Recursos ni de los demás no objetivos aparece como capacidad de este cambio;
- no existen fixtures runtime, persistencia local ni contratos inventados para suplir la API;
- los controles aprobados son operables por teclado, tienen nombre accesible y foco visible, y satisfacen las comprobaciones aplicables de WCAG 2.2 AA;
- las pruebas enfocadas, el recorrido workstation y las puertas de calidad aplicables se reportan con su resultado real siguiendo RED-GREEN-REFACTOR.

Las cantidades, tiempos de respuesta, reglas de nombre, permisos, mensajes concretos y errores runtime no se convierten en criterios hasta observarlos mediante evidencia conectada y, cuando corresponda, aprobar su tratamiento de producto.

## Ronda de preguntas de propuesta

La prepropuesta y la aclaración del usuario resolvieron la ronda necesaria antes de finalizar este artefacto:

1. **¿Cuál es la jerarquía y qué relaciones son inmutables?** `Clase → Familia → Tipo → Recurso`; Familia→Clase y Tipo→Familia son inmutables.
2. **¿Qué resultado debe cubrir este cambio?** Navegación, lectura y creación workstation de Clases, Familias y Tipos como una capacidad coherente.
3. **¿Cómo se resolvió el contrato backend ausente del repositorio?** Se seleccionó la superficie pública Convex `catalogoAdmin/jerarquia` y `npx convex function-spec` verificó sus nombres, validadores y respuestas nominales relevantes, sin exigir acceso al repositorio backend.
4. **¿Qué autoridad tiene la imagen actual?** Referencia visual preliminar para proposal/spec; no autoriza design ni apply.
5. **¿Qué queda fuera aunque esté relacionado?** Recursos y reclasificación, unidades, atributos, reglas, presentación, compatibilidad, publicación, responsive/touch, estados no aprobados e infraestructura especulativa.

No quedan decisiones de producto abiertas que impidan esta propuesta y el gate nominal de API está satisfecho. Sí quedan gates de evidencia runtime y, de forma bloqueante para `design` y `apply`, la recuperación OpenPencil auditada y corregida; no se avanzará honestamente a esas fases hasta resolverlos según corresponda.

# Propuesta — Creación de recursos Keyboard First

## Resumen

Reemplazar la experiencia convencional de creación de Recursos maestros por un recorrido secuencial, compacto y orientado al teclado que pueda completarse sin mouse:

```text
Clase → Familia → Tipo → Unidad natural → atributos uno a uno → revisión → crear
```

El cambio reutiliza los contratos backend y de payload existentes. La autoridad de datos, las reglas efectivas y la persistencia continúan en el backend externo; la propuesta cambia únicamente la interacción frontend del diálogo **Nuevo recurso**.

## Problema y oportunidad

La superficie actual distribuye la creación en un formulario de tres pasos con varios selectores y campos visibles a la vez. Aunque ya conserva parte del foco y de las validaciones, no ofrece el recorrido terminal-first solicitado, no parte del contexto jerárquico ya elegido en Maestro de Recursos y obliga a gestionar varias decisiones simultáneamente.

Esto genera trabajo repetido, aumenta la carga cognitiva y hace menos predecible el flujo para personas que operan principalmente con teclado. También dificulta explicar con honestidad el alcance de las búsquedas jerárquicas, porque las APIs disponibles son paginadas y no proporcionan búsqueda backend para estas etapas.

## Intención y resultado de producto

Al abrir **Nuevo recurso**, la persona debe encontrarse en la primera decisión todavía pendiente, con una sola etapa principal activa y una ruta visible de lo ya confirmado. El flujo debe sentirse como una secuencia de terminal o menú: escribir reduce candidatos, las flechas cambian el candidato activo, `Enter` confirma y avanza, `ArrowLeft` vuelve y `Escape` cierra.

El resultado esperado es una creación más rápida y explicable que:

- reutiliza el contexto válido ya seleccionado en Maestro de Recursos;
- mantiene el borrador completamente aislado de la selección y del filtro de la pantalla;
- hace explícita la elección de Unidad natural antes de los atributos;
- presenta los atributos de uno en uno y permite omitir expresamente los opcionales;
- termina con una revisión fiel de lo que se enviará;
- conserva las mismas reglas, payload, autoridad backend y refresco posterior a creación confirmada.

## Alcance funcional

### 1. Inicio desde contexto heredado, válido y aislado

Al abrir el diálogo, Maestro de Recursos construirá un snapshot del contexto jerárquico disponible. Sólo se heredará el prefijo válido más profundo de `Clase → Familia → Tipo`:

- una Clase debe continuar presente entre los elementos actuales;
- una Familia debe continuar presente y pertenecer a la Clase heredada;
- un Tipo debe continuar presente y pertenecer a la Familia heredada;
- cualquier sufijo stale, ausente o cruzado se descartará sin adoptar respuestas tardías de otro padre.

Las etapas heredadas se consideran confirmadas y se omiten al inicio, de modo que el diálogo comienza en el primer dato faltante. Permanecerán visibles en la ruta o breadcrumb y podrán reabrirse para cambiarse.

El snapshot y todo cambio posterior pertenecen al borrador local del diálogo. Cambiar Clase, Familia o Tipo dentro del diálogo no modificará la selección jerárquica, el filtro efectivo ni la consulta activa de Maestro de Recursos.

Cambiar un padre limpiará atómicamente sus descendientes y datos dependientes:

- cambiar Clase limpia Familia, Tipo, Unidad natural y atributos;
- cambiar Familia limpia Tipo, Unidad natural y atributos;
- cambiar Tipo limpia Unidad natural y atributos.

Volver a una etapa sin reemplazar su valor conservará los datos ya introducidos que sigan siendo válidos.

### 2. Selector jerárquico por etapas

Clase, Familia y Tipo serán etapas separadas y visibles; Tipo no se elimina ni se reinterpreta. Cada etapa mostrará una lista enfocada con un filtro local por **nombre visible únicamente**.

El filtro operará sólo sobre las páginas ya cargadas. La interfaz comunicará ese alcance y mantendrá una acción explícita de continuación, como **Cargar más…**, cuando exista otra página. No afirmará ni sugerirá que se está buscando en todo el backend, no cargará páginas automáticamente para simular una búsqueda global y no añadirá parámetros de búsqueda inexistentes.

La continuación conservará el padre vigente, el texto del filtro y las páginas válidas ya obtenidas. Los IDs repetidos entre páginas se mostrarán una sola vez. Si el filtro o una nueva página elimina al candidato activo de la vista, el foco activo se reajustará a un candidato visible sin confirmar automáticamente ninguna selección.

### 3. Etapa explícita de Unidad natural

Después de confirmar Tipo, el flujo mostrará una etapa propia de **Unidad natural**. Sus candidatos se obtendrán exclusivamente a partir de las políticas efectivas del Tipo mediante `api.catalogoAdmin.unidades.listarPoliticasUnidad` y se hidratarán mediante `api.catalogoAdmin.unidades.obtenerUnidad({ unidadId })` para presentar `clave`, `nombre`, `simbolo` cuando exista y los estados vigentes necesarios.

Sólo se ofrecerán unidades elegibles y efectivas para el Tipo. `listarUnidades`, al ser una consulta paginada de toda la tabla, no sustituirá el filtrado por políticas porque podría ofrecer una unidad activa pero inválida para ese Tipo.

La unidad principal o seleccionada efectiva podrá quedar posicionada como candidato activo inicial. Aun así, la persona deberá confirmar la opción visible con `Enter` antes de avanzar. La etapa preservará el `unidadId` obligatorio del payload actual y no inventará defaults cuando las políticas no produzcan una opción elegible.

Los estados de carga, ausencia de unidades elegibles, error y retry deberán ser explícitos. El flujo no podrá avanzar a atributos mientras la resolución vigente esté incompleta o haya quedado invalidada por un cambio de Tipo.

### 4. Atributos secuenciales

Las asignaciones efectivas del Tipo se resolverán con los contratos actuales, se ordenarán por `orden` y excluirán las marcadas `FORBIDDEN` o `NOT_APPLICABLE`. Cada atributo aplicable ocupará una etapa secuencial y usará un control acorde con su tipo existente —texto, número, booleano u opción— sin alterar su semántica de transporte.

- Un atributo `REQUIRED` sin valor bloqueará el avance, mostrará un error cercano y llevará el foco al control que debe corregirse.
- Un atributo opcional ofrecerá una acción visible **Omitir**.
- Omitir un opcional no generará un valor artificial ni lo incluirá como valor vacío en el payload.
- Volver conservará los valores mientras el Tipo no cambie.
- Cambiar Tipo descartará los valores y definiciones anteriores antes de aceptar los del nuevo contexto.

La captura existente de los datos propios del Recurso, incluidos `nombre` y `descripcion` cuando corresponda al contrato actual, se conservará dentro del recorrido antes de enviar. Esta propuesta no cambia su obligatoriedad, normalización ni semántica de payload.

### 5. Revisión final y creación

La última etapa mostrará una revisión legible y fiel del envío previsto: Clase, Familia, Tipo, Unidad natural, datos del Recurso y atributos efectivamente cargados. Los opcionales omitidos no se presentarán como si tuvieran un valor.

La persona podrá volver mediante el breadcrumb o `ArrowLeft`, corregir una decisión y regresar a revisión. **Crear** permanecerá bloqueado mientras falte un requisito, haya una carga dependiente pendiente o el envío ya esté en curso.

La creación conservará el contrato actual, incluyendo:

- `claseRecursoId`, `familiaRecursoId`, `tipoRecursoId` y `unidadId`;
- `nombre` y los demás campos existentes sin reinterpretarlos;
- el mapeo actual de valores de atributos;
- `ownership: { kind: 'GLOBAL' }`;
- protección contra envíos duplicados;
- distinción entre error administrativo conocido y resultado incierto;
- llamada a `onCreated` sólo después de un resultado `CREATED` confirmado.

Tras una creación confirmada se refrescará únicamente la consulta activa de Maestro de Recursos. No habrá inserción optimista, edición manual de cache ni invalidación amplia de otras búsquedas o filtros.

## Garantías Keyboard First y accesibilidad

El flujo completo deberá poder completarse sin mouse, manteniendo el mouse como alternativa:

- `ArrowUp` y `ArrowDown` mueven el candidato activo dentro del composite local.
- `Enter` confirma la opción visible y avanza; nunca confirma silenciosamente un cambio de filtro.
- `ArrowLeft` vuelve a la etapa anterior dentro del flujo.
- Escribir filtra por nombre en las etapas con lista.
- `Escape` cierra sólo el diálogo activo y no dispara una segunda acción global.
- `Tab` y `Shift+Tab` conservan la navegación accesible del diálogo y su contención modal; no se instala una captura global de Tab.
- La edición de texto, los controles React Aria, `defaultPrevented` y la composición IME conservan precedencia sobre los atajos de la superficie.
- Todo destino enfocado tendrá un indicador perceptible compatible con WCAG 2.2 AA, etiquetas accesibles y errores asociados al campo correspondiente.
- Al cerrar, el foco volverá al opener si sigue siendo elegible; en caso contrario, usará el fallback accesible existente.

La interacción de lista, filtro, popover o combo permanecerá encapsulada localmente mediante React Aria. No se añadirá otro listener de `document`, no se competirán las flechas con `KeyboardController` y el diálogo seguirá registrándose como overlay activo para impedir que AppShell actúe sobre el fondo.

La presentación reutilizará `Dialog`, `Button`, `Field` y las primitivas GARFEX aplicables, además de Tailwind y tokens semánticos del tema Light. El selector staged será feature-local mientras no exista un segundo consumidor con el mismo contrato; no se forzará `HierarchyNavigator`, cuya semántica de tres columnas es distinta.

## Áreas afectadas

### Producto y capacidades

- Diálogo **Nuevo recurso** de Maestro de Recursos.
- Entrega de un snapshot jerárquico inicial desde la pantalla al diálogo.
- Lecturas feature-locales de jerarquía, políticas efectivas de Unidad y atributos ya existentes.
- Contrato de interacción Keyboard First dentro de un overlay.
- Refresco de la lista remota activa después de creación confirmada.

### Superficies de implementación previstas

- `src/features/resources-master/ResourcesMasterScreen.tsx`: derivación y entrega del snapshot válido, sin ceder al diálogo la selección de pantalla.
- `src/features/resources-master/CrearRecursoSurface.tsx`: recorrido por etapas, borrador local, cargas dependientes, revisión, envío y foco.
- Tipos y estilos feature-locales de `resources-master` sólo cuando sean necesarios para ese contrato.
- Pruebas unitarias/RTL de `CrearRecursoSurface` y del snapshot de pantalla; regresiones del refresco activo; recorrido Playwright/axe y guardias arquitectónicas existentes.

Las especificaciones canónicas `keyboard-interaction`, `resources-master-remote-list`, `frontend-foundation` y `catalog-hierarchy` son restricciones de compatibilidad. Esta fase no las modifica.

## Compatibilidad, autoridad y preservación

- El backend externo sigue siendo autoridad sobre datos, elegibilidad, reglas efectivas, validación, permisos y persistencia.
- Se conservan los adapters feature-locales y la validación de transporte antes de React.
- No se altera ningún endpoint, DTO público, contrato Convex, payload ni regla de ownership.
- No se mueve el borrador, overlay, selección o teclado a React Query ni a estado global.
- No se modifica el comportamiento canónico de Clase → Familia → Tipo ni se trata Tipo como un defecto.
- El commit prototipo `7c42860` se considera evidencia revisable de interacción, foco, payload y pruebas existentes. No congela la arquitectura, no sustituye esta propuesta y sus decisiones podrán refactorizarse siempre que se preserve o reemplace la evidencia observable equivalente.

## No objetivos

Este cambio no incluye:

- modificaciones en Catálogo, `catalog-hierarchy-base` ni sus relaciones canónicas;
- backend, Convex, contratos API, payloads, persistencia o nuevas reglas de dominio;
- cambios de dependencias, rutas, URL, estado global o infraestructura Query;
- sincronización de las selecciones hechas en el diálogo hacia Maestro de Recursos;
- búsqueda backend para Clase, Familia, Tipo o Unidad, ni carga automática para aparentarla;
- rediseño de semánticas de Tipo, Unidad o atributos;
- actualización, borrado, lifecycle, permisos nuevos o reclasificación de Recursos;
- una abstracción shared especulativa para el selector staged;
- comportamiento responsive, móvil o touch específico no aprobado;
- cambios en OpenPencil, configuración, Pi/Gentle, remotos, PRs o release.

## Riesgos y mitigaciones

| Riesgo | Mitigación propuesta |
| --- | --- |
| Heredar una Familia o Tipo stale o perteneciente a otro padre | Validar el snapshot contra los items actuales y sus relaciones; heredar sólo el prefijo continuo válido. |
| Aplicar respuestas asíncronas de un contexto anterior | Asociar cada carga con su padre/Tipo y token local; adoptar el resultado sólo si el contexto continúa vigente. |
| Hacer pasar el filtro local por una búsqueda completa | Etiquetar su alcance, filtrar sólo por nombre entre páginas cargadas y mantener paginación explícita. |
| Ofrecer una Unidad activa pero inválida para el Tipo | Derivar candidatos desde políticas efectivas y usar `obtenerUnidad`; no sustituirlas por `listarUnidades`. |
| Perder foco o confirmar el elemento incorrecto tras filtrar/paginar | Mantener un único candidato activo visible, reajustarlo sin selección automática y cubrir vacío, retry y continuación. |
| Interferir con edición, IME o navegación global | Encapsular teclas en composites React Aria, respetar `defaultPrevented` y conservar el único arbitraje global existente. |
| Enviar atributos de un Tipo anterior | Limpiar Unidad y atributos al cambiar Tipo y bloquear revisión/envío hasta resolver el nuevo contexto. |
| Convertir atributos opcionales en obligatorios | Reservar el bloqueo para `REQUIRED` y ofrecer **Omitir** sin fabricar valores. |
| Inferir éxito ante un resultado incierto o refrescar demasiadas listas | Conservar el manejo de resultados actual y ejecutar `onCreated → refetchActive` sólo tras `CREATED`. |
| Crear una experiencia visual aislada | Reutilizar primitivas y tokens GARFEX; mantener la composición especializada dentro de la feature. |
| Exceder el presupuesto de revisión de 400 líneas | En apply, usar la estrategia confirmada de feature-branch-chain y detenerse para confirmación bajo ask-on-risk si un corte cohesivo sigue excediendo el presupuesto. |

## Medidas de éxito

La propuesta se considerará lograda cuando exista evidencia observable de que:

1. Una persona puede abrir, completar y confirmar la creación de un Recurso usando sólo teclado.
2. El diálogo comienza en la primera etapa faltante del prefijo jerárquico válido y permite cambiar cualquier selección heredada sin alterar Maestro de Recursos.
3. Clase, Familia y Tipo filtran sólo por nombre sobre páginas cargadas, y **Cargar más…** amplía resultados sin prometer búsqueda backend.
4. Unidad natural aparece como etapa explícita, ofrece sólo unidades efectivas permitidas por el Tipo y exige confirmación visible antes de avanzar.
5. Los atributos aparecen en orden, los `REQUIRED` bloquean cuando están vacíos y todos los opcionales pueden recorrerse mediante **Omitir**.
6. La revisión coincide con el payload preservado y nunca incluye valores opcionales omitidos ni datos dependientes de un contexto anterior.
7. `Escape`, Tab, IME, foco visible, restauración al opener/fallback y aislamiento del overlay cumplen el contrato Keyboard First y WCAG 2.2 AA aplicable.
8. Una creación confirmada refresca sólo la consulta activa; errores y resultados inciertos no producen éxito optimista.
9. Las regresiones enfocadas de RTL/Vitest, Playwright/axe, arquitectura, typecheck, lint, formato y build reportan resultados veraces y preservan los contratos actuales.
10. Catálogo, backend, payloads, rutas, estado global, dependencias y especificaciones canónicas permanecen sin cambios por esta propuesta.

## Rollback

El rollback es feature-local: restaurar la implementación anterior de `CrearRecursoSurface` y retirar la prop/tipo del snapshot inicial en Maestro de Recursos, junto con las pruebas exclusivas del nuevo recorrido. El adapter, los contratos backend, el payload, la consulta remota y su refresco activo, Catálogo, `catalog-hierarchy-base`, Keyboard Controller y las especificaciones canónicas deben permanecer intactos.

Como no se propone migración, persistencia frontend ni cambio de datos, el rollback no requiere conversión de información ni coordinación con backend.

## Consideración de entrega

El reemplazo de la superficie y su matriz de pruebas probablemente superarán el presupuesto total de 400 líneas. Si se autoriza apply, la estrategia prevista es **feature-branch-chain** con un tracker draft/no-merge y cortes cohesivos:

```text
tracker (draft/no merge)
└─ PR 1: snapshot heredable + selector jerárquico staged + pruebas de cascada/teclado
   └─ PR 2: Unidad natural + atributos + revisión/payload + pruebas de estado/foco
      └─ PR 3: recorrido Playwright/axe + regresiones de refresco y arquitectura
```

Cada prueba permanecerá junto a la unidad que verifica. Si una sola división honesta no mantiene un corte por debajo del presupuesto, se elevará el riesgo bajo `ask-on-risk` en lugar de comprimir código, separar artificialmente sus pruebas o inferir autorización de tamaño.

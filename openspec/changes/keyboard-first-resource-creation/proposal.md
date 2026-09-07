# Propuesta — Creador de recursos Keyboard First y sólo por selección

## Estado de la propuesta

Esta revisión sustituye expresamente las suposiciones anteriores de captura manual de datos del recurso y de atributos con valores libres. El concepto visible para la persona usuaria es **Creador de recursos**. La implementación puede conservar HTML semántico de formulario cuando aporte accesibilidad, pero la experiencia no se presentará ni se comportará como un formulario tradicional.

Las decisiones de producto de esta revisión están confirmadas. No queda una ronda de preguntas abierta antes de design; cualquier cambio posterior en reglas de negocio o contratos backend deberá volver a proposal/design antes de integrarse.

`skill_resolution: paths-injected`

## Resumen

Reorientar la creación de Recursos maestros a una secuencia tipo `ask_user_question` de Pi, integrada visualmente en GARFEX Design System Light:

```text
Clase → Familia → Tipo → Unidad natural → atributos dinámicos uno a uno → revisión/resultado autoritativo
```

En cada momento existe una decisión dominante. La jerarquía y el progreso permanecen visibles, la búsqueda opcional es el único lugar donde se escribe, la selección siempre se confirma con `Enter` y una barra de comandos persistente explica las acciones disponibles.

La creación pasa a ser **sólo por selección**. El frontend no solicitará Nombre, Descripción, TEXTO, NUMERO ni ningún otro valor de negocio manual. El backend resolverá reglas condicionales, nombre e identidad técnica y será la autoridad tanto para la revisión como para la creación.

La integración final depende de contratos backend v1 todavía no implementados. El frontend puede avanzar de forma independiente únicamente en la shell, rail/breadcrumb, barra de comandos, interacción search-list, etapas Clase/Familia/Tipo/Unidad natural con contratos actuales y estado puro de selecciones activas/suspendidas. No inventará endpoints, DTOs ni respuestas de producción para completar el flujo.

## Problema y oportunidad

La propuesta anterior conservaba el patrón mental del formulario existente: campos manuales de Nombre/Descripción y controles libres para atributos TEXTO o NUMERO, seguidos por la construcción frontend del payload legado. Ese enfoque contradice el producto ahora aprobado:

- permite que el frontend capture datos que deben derivarse o validarse desde catálogo;
- obliga a la persona a conocer reglas técnicas y de nomenclatura;
- presenta varias decisiones simultáneas y aumenta la carga cognitiva;
- no puede explicar con autoridad condiciones dinámicas entre asignaciones;
- acopla la UX a `crearRecurso`, aunque el nuevo flujo necesita evaluación previa, fingerprint de catálogo y reevaluación transaccional.

La oportunidad es convertir la creación en una navegación guiada y explicable: elegir opciones válidas, conservar contexto, hacer visibles los efectos condicionales y delegar al backend la interpretación definitiva.

## Intención y resultado de producto

Al abrir **Creador de recursos**, la persona debe llegar a la primera decisión pendiente dentro de una secuencia compacta. Debe poder completar el recorrido sin mouse, entender dónde está y qué decisión domina, revisar el resultado resuelto por backend y crear sin introducir manualmente valores de negocio.

Después del cambio:

- la experiencia se siente como una sucesión de preguntas de selección, no como un formulario multipropósito;
- Clase, Familia, Tipo y Unidad natural forman un contexto visible y reversible;
- los atributos aplicables aparecen uno por uno en una secuencia dinámica identificada por ID de asignación;
- las condiciones pueden suspender selecciones sin destruirlas y restaurarlas cuando vuelvan a aplicar;
- la revisión muestra nombre, identidad técnica, asignaciones e incidencias resueltas por backend;
- la creación se realiza sólo contra el catálogo evaluado y con protección explícita frente a cambios concurrentes.

## Contrato funcional

### 1. Shell Pi-like dentro de GARFEX

La superficie usará las primitivas, tokens semánticos y estados Light de GARFEX. La inspiración en Pi se limita al modelo de interacción y jerarquía de atención; no introduce una estética ajena al sistema.

La composición tendrá:

- una decisión principal claramente dominante;
- un rail o breadcrumb interactivo con contexto jerárquico y etapas confirmadas;
- una búsqueda opcional fija sobre la lista cuando la etapa admita búsqueda;
- un contador de resultados cuyo alcance sea honesto respecto de los datos cargados;
- una lista con candidato activo y selección confirmada visualmente distintas;
- foco fuerte y perceptible sin depender sólo del color;
- una barra de comandos persistente con las acciones válidas de la etapa;
- estados explícitos de carga, vacío, error, retry, ausencia de opciones y resultado.

No se forzará `HierarchyNavigator`: su contrato de tres columnas no representa esta secuencia de una decisión dominante. La composición permanecerá feature-local mientras no exista otro consumidor con el mismo contrato semántico.

### 2. Teclado y foco

El recorrido completo deberá funcionar sin mouse:

- con foco en búsqueda, `ArrowDown` entra en la lista;
- desde el primer elemento, `ArrowUp` devuelve el foco a búsqueda;
- al escribir desde la lista, búsqueda recupera el foco y recibe el texto, respetando composición IME;
- `ArrowUp` y `ArrowDown` mueven el candidato activo sin seleccionar;
- `Enter` confirma explícitamente el candidato y avanza;
- `ArrowLeft` vuelve a la etapa anterior cuando el foco no está editando texto;
- `Escape` vuelve una etapa y sólo cierra la superficie cuando ya está en la primera;
- `Tab` y `Shift+Tab` conservan la navegación accesible y la contención del diálogo;
- filtrar, paginar o recibir datos no confirma automáticamente ningún candidato.

La interacción se encapsulará en el composite local y en React Aria. No se añadirá otro listener global de `document`. Se conservarán `defaultPrevented`, precedencia de edición/IME, registro de overlay y restauración de foco al opener o fallback elegible.

### 3. Jerarquía y Unidad natural

Las etapas iniciales son, en este orden:

```text
Clase → Familia → Tipo → Unidad natural
```

El Creador podrá iniciar desde el prefijo válido más profundo del contexto actual de Maestro de Recursos. Ese contexto se copiará como snapshot local: cambiarlo dentro del Creador no modificará el filtro ni la consulta activa de la pantalla.

Las selecciones descendientes se invalidarán de forma atómica al cambiar un ancestro:

- cambiar Clase invalida Familia, Tipo, Unidad natural, asignaciones y evaluación;
- cambiar Familia invalida Tipo, Unidad natural, asignaciones y evaluación;
- cambiar Tipo invalida Unidad natural, asignaciones y evaluación;
- cambiar Unidad natural invalida cualquier evaluación o fingerprint derivado de la selección anterior.

La Unidad natural seguirá siendo una decisión visible. Mientras se usen los contratos actuales, sus candidatos procederán de las políticas efectivas del Tipo y se hidratarán con la lectura de unidad disponible; no se ofrecerán unidades globales que no sean elegibles para ese Tipo.

La búsqueda jerárquica utilizará sólo las capacidades reales de los contratos actuales. Si sólo puede filtrar páginas cargadas, el contador y la continuación explícita lo comunicarán; la UI no fingirá una búsqueda backend global.

### 4. Atributos dinámicos sólo por selección

Después de Unidad natural, los atributos se recorrerán como una secuencia dinámica cuya identidad estable es el **ID de asignación**, no la posición ni el ID de definición. La etapa se rotulará:

```text
Atributos · n de total
```

El contexto de Clase/Familia/Tipo/Unidad seguirá visible durante toda la secuencia.

Para cada asignación activa:

- el frontend obtiene su definición y `modoCaptura`;
- v1 admite únicamente `SELECCION`;
- los valores permitidos proceden del backend y conservan su valor tipado;
- `Enter` confirma un valor permitido;
- una asignación opcional ofrece **Omitir**;
- una asignación requerida sin selección impide alcanzar un resultado `VALID`;
- `LIBRE` no habilita un editor manual y se tratará como modo no soportado por este alcance;
- `DERIVADO` queda fuera de v1 y no se simulará en frontend.

No existirán campos manuales para Nombre, Descripción, TEXTO, NUMERO u otros valores de negocio. La búsqueda de opciones es la única entrada de texto permitida y nunca se convierte en el valor seleccionado por sí misma.

### 5. Condiciones reversibles: selecciones activas y suspendidas

El borrador local distinguirá explícitamente:

- **selecciones activas**, aplicables bajo la resolución vigente;
- **selecciones suspendidas**, retenidas localmente porque una condición las deshabilitó.

Cuando una nueva selección haga que una asignación deje de aplicar, su valor no se destruirá: pasará a suspendido y no se enviará como selección activa. Si una evaluación posterior vuelve a habilitar esa misma asignación y el valor continúa permitido, se restaurará. Si ya no es válido, permanecerá sin aplicar y la UI solicitará una nueva decisión cuando corresponda.

El frontend no intentará implementar por su cuenta el lenguaje `CONDITIONAL`. El estado reversible es una capacidad pura de borrador; qué asignaciones están resueltas, aplican o presentan incidencias lo determina obligatoriamente `evaluarCreacionDesdeSelecciones`.

### 6. Revisión y resultado autoritativo

Después de las selecciones, el frontend invocará obligatoriamente la evaluación backend. Su resultado será uno de:

- `INCOMPLETE`;
- `VALID`;
- `INVALID`.

La revisión mostrará, según el contrato definitivo, las asignaciones resueltas, incidencias, nombre generado, identidad técnica y `catalogFingerprint`. No reconstruirá esos datos desde reglas frontend.

- `INCOMPLETE` señalará las decisiones que aún deben completarse.
- `INVALID` impedirá crear y presentará las incidencias accionables devueltas.
- Sólo `VALID` habilitará la confirmación final.
- Cualquier cambio de selección invalidará la evaluación y el fingerprint anteriores.

La creación usará `crearRecursoDesdeSelecciones`, enviará IDs de selección y el `expectedCatalogFingerprint` obligatorio. El backend reevaluará transaccionalmente y devolverá disposiciones explícitas. La UI representará esas disposiciones según el contrato real; no inferirá éxito, no inventará nombres de disposición y no convertirá una respuesta incierta o stale en creación confirmada.

Nombre e identidad técnica son salidas backend, nunca entradas frontend.

## Dependencia explícita de backend v1

La integración de atributos, evaluación, revisión y creación queda bloqueada hasta que estén implementados y disponibles los contratos exactos de:

1. `obtenerDefinicionAtributo`, incluyendo `modoCaptura: SELECCION | LIBRE | DERIVADO`;
2. `listarValoresPermitidosAtributo`, con valores tipados e identidad seleccionable;
3. `evaluarCreacionDesdeSelecciones`, obligatorio para resolver `CONDITIONAL` y devolver `INCOMPLETE | VALID | INVALID`, `catalogFingerprint`, asignaciones resueltas, incidencias, nombre e identidad técnica;
4. `crearRecursoDesdeSelecciones`, con IDs de selección, `expectedCatalogFingerprint` obligatorio, reevaluación transaccional y disposiciones explícitas.

Los nombres y responsabilidades están confirmados, pero el frontend necesita los DTOs definitivos, nulabilidad, errores y disposiciones antes de crear adapters o integración. No los deducirá desde el método legado ni desde la UI.

`crearRecurso` permanece disponible y sin cambios en backend. No será eliminado ni modificado por esta iniciativa, pero tampoco se usará como atajo para el nuevo flujo selection-only porque no satisface la evaluación/fingerprint autoritativos.

## Alcance por disponibilidad

### Frontend que puede continuar antes de backend v1

- shell y denominación **Creador de recursos**;
- rail/breadcrumb interactivo y barra de comandos persistente;
- patrón search-list, contador, foco y teclado local;
- etapas Clase, Familia, Tipo y Unidad natural usando contratos actuales;
- invalidación de descendientes al cambiar jerarquía;
- modelo puro y probado de selecciones activas/suspendidas keyed por assignment ID;
- estados explícitos de “contrato pendiente” donde el recorrido aún no pueda continuar.

Este trabajo no incluirá endpoints falsos, mocks conectados al bundle de producción ni una evaluación condicional local presentada como real.

### Trabajo bloqueado por backend v1

- carga productiva de definiciones y valores permitidos de atributos;
- interpretación autoritativa de asignaciones condicionales;
- revisión con nombre, identidad técnica, incidencias y fingerprint reales;
- habilitación de creación;
- integración de `crearRecursoDesdeSelecciones` y sus disposiciones.

Los dobles de prueba podrán representar contratos únicamente después de que los DTOs sean exactos y sólo dentro de pruebas; nunca definirán de facto la API productiva.

## Preservación y compatibilidad

El trabajo histórico completado hasta la etapa Clase en `e52b9b2` se preservará cuando sea compatible con este contrato: shell útil, primitives GARFEX, enfoque keyboard-first, aislamiento feature-local y evidencia de pruebas no deberán desecharse por el mero cambio de planificación.

Lo compatible podrá adaptarse incrementalmente. Queda expresamente supersedido cualquier trabajo o supuesto que:

- capture manualmente Nombre o Descripción;
- ofrezca editores libres para TEXTO, NUMERO u otros valores de negocio;
- construya el payload legado como resultado final del nuevo Creador;
- resuelva `CONDITIONAL` en frontend;
- habilite creación sin evaluación autoritativa y fingerprint esperado.

Se mantienen además:

- backend separado y autoritativo, sin ediciones en este repositorio;
- adapters feature-locales y validación de transporte antes de React;
- estado de borrador local, sin estado global, URL ni cambios de infraestructura Query;
- GARFEX Design System Light, componentes compartidos y tokens semánticos;
- un único límite global de teclado y comportamiento local para el composite;
- TDD y entrega mediante feature-branch-chain;
- cortes cohesivos de menos de 400 líneas agregadas + eliminadas, elevando el riesgo si una división honesta no cabe;
- ausencia de push, PR o release dentro de este cambio.

## Áreas afectadas

### Producto y UX

- diálogo/superficie **Nuevo recurso**, renombrado conceptualmente a **Creador de recursos**;
- navegación jerárquica y selección de Unidad natural;
- secuencia dinámica de atributos;
- revisión, resultado, errores y creación;
- interacción por teclado, foco y comunicación accesible de estado.

### Frontend previsto

- shell y estado feature-local de `resources-master`;
- snapshot inicial y aislamiento respecto de Maestro de Recursos;
- adapters feature-locales sólo cuando existan contratos backend exactos;
- pruebas unitarias del reducer/modelo, RTL del composite y recorridos Playwright/axe;
- regresiones de límites de teclado, transporte y consulta activa.

### Dependencia externa

- implementación backend v1 de definición/modo, valores permitidos tipados, evaluación y creación desde selecciones.

No se propone editar backend desde este repositorio.

## No objetivos

Este cambio no incluye:

- captura manual de Nombre, Descripción o cualquier valor de negocio;
- atributos de modo `LIBRE` ni `DERIVADO` en v1;
- generación frontend de nombre o identidad técnica;
- evaluación frontend de reglas `CONDITIONAL`;
- adivinar DTOs, errores o disposiciones backend;
- endpoints productivos falsos ni adaptación encubierta de `crearRecurso` al flujo nuevo;
- cambios al método backend legado `crearRecurso`;
- edición de Catálogo, relaciones canónicas o semánticas de Tipo;
- nuevas dependencias, estado global, rutas, URL o infraestructura transversal;
- sincronizar las selecciones internas del Creador hacia el filtro de Maestro de Recursos;
- búsqueda backend donde los contratos actuales no la soporten;
- promoción especulativa del selector a `shared`;
- cambios en Pi/Gentle, configuración, remotos, push, PR o release.

## Riesgos y mitigaciones

| Riesgo | Mitigación propuesta |
| --- | --- |
| Integrar contra un backend aún indefinido | Separar el trabajo disponible del bloqueado y no escribir adapters hasta disponer de DTOs exactos. |
| Reintroducir captura libre para desbloquear la UI | Tratar modos no soportados y ausencia de contrato como estados explícitos; no ofrecer fallback manual. |
| Perder valores por cambios condicionales reversibles | Mantener selecciones activas/suspendidas por assignment ID y restaurar sólo valores todavía permitidos. |
| Duplicar o contradecir la lógica `CONDITIONAL` | Delegar aplicabilidad y resolución a la evaluación obligatoria; el frontend sólo conserva borrador reversible. |
| Crear contra un catálogo distinto al revisado | Invalidar evaluación ante cualquier cambio y exigir `expectedCatalogFingerprint`; backend reevalúa transaccionalmente. |
| Confundir candidato enfocado con selección confirmada | Diferenciar ambos estados sin depender sólo del color y exigir `Enter` para seleccionar. |
| Perder orientación durante muchos atributos | Mantener jerarquía visible, etiqueta `Atributos · n de total`, contador y barra de comandos. |
| Interferir con búsqueda, IME o teclado global | Respetar contexto editable/defaultPrevented y encapsular flechas/Enter/Escape en el composite/overlay local. |
| Enviar descendientes de una jerarquía anterior | Invalidar atómicamente descendientes, evaluación y fingerprint al cambiar un ancestro. |
| Descartar trabajo histórico válido | Conservar el trabajo compatible hasta `e52b9b2` y reemplazar sólo las premisas manuales incompatibles. |
| Superar el presupuesto de revisión | Mantener feature-branch-chain y cortes TDD cohesivos menores de 400 A+D; elevar riesgo antes de excederlo. |

## Medidas de éxito

La propuesta se considerará lograda cuando exista evidencia observable de que:

1. La interfaz se identifica como **Creador de recursos** y presenta una sola decisión dominante con rail/breadcrumb, búsqueda fija opcional, contador y barra de comandos persistente.
2. Una persona completa Clase → Familia → Tipo → Unidad natural y las selecciones admitidas usando sólo teclado con las transiciones de foco aprobadas.
3. `Enter` es necesario para seleccionar; foco/candidato/selección se distinguen también sin color y filtrar nunca confirma automáticamente.
4. `ArrowLeft` vuelve cuando no se edita, y `Escape` vuelve hasta la primera etapa y sólo entonces cierra restaurando foco correctamente.
5. No existe ningún control productivo para introducir Nombre, Descripción, TEXTO, NUMERO u otro valor de negocio; búsqueda es la única escritura.
6. Los atributos se identifican por assignment ID, se muestran como `Atributos · n de total` y los opcionales ofrecen **Omitir**.
7. Cambiar jerarquía invalida todos los descendientes y cualquier evaluación/fingerprint dependiente.
8. Una selección deshabilitada por condiciones pasa a suspendida y se restaura si vuelve a aplicar y continúa permitida, sin enviarse mientras esté suspendida.
9. El frontend no habilita revisión/creación autoritativa antes de disponer de los contratos backend v1 exactos y no incorpora endpoints productivos inventados.
10. Con backend v1 disponible, cada revisión procede de `evaluarCreacionDesdeSelecciones`, representa fielmente `INCOMPLETE | VALID | INVALID` y muestra nombre e identidad técnica generados por backend.
11. Sólo un resultado `VALID` puede intentar `crearRecursoDesdeSelecciones`, siempre con `expectedCatalogFingerprint`; una disposición no confirmada jamás se presenta como éxito.
12. El método legado `crearRecurso`, Catálogo, dependencias, estado global, URL y backend permanecen sin cambios.
13. El trabajo compatible hasta `e52b9b2` y sus garantías observables se conserva mediante TDD, sin mezclar implementation con contratos todavía ausentes.

## Rollback

El rollback será feature-local y sin migración de datos:

1. revertir los cortes frontend derivados de esta propuesta en orden inverso;
2. conservar el trabajo histórico compatible hasta la etapa Clase en `e52b9b2` y las primitivas GARFEX compartidas;
3. retirar adapters v1 únicamente si hubieran sido añadidos después de la disponibilidad contractual, sin tocar backend;
4. mantener intactos Catálogo, `crearRecurso`, consultas remotas, Keyboard Controller, rutas, dependencias y estado global.

Mientras backend v1 no esté disponible, el punto seguro de rollback es la última shell/etapa jerárquica compatible, sin simular creación. Después de integrar backend v1, revertir el frontend no requerirá conversión de datos porque no se introduce persistencia local ni se modifica el modelo backend desde este repositorio.

## Consideración de entrega

La implementación continuará con TDD y feature-branch-chain. Cada corte incluirá su evidencia y se mantendrá por debajo de 400 líneas agregadas + eliminadas. Una secuencia orientativa, que design/tasks deberán concretar sin reinterpretar esta propuesta, es:

```text
corte 1: shell/rail/barra + contrato search-list/foco
corte 2: Familia/Tipo/Unidad + invalidación jerárquica
corte 3: modelo puro active/suspended keyed por assignment ID
— dependencia backend v1 —
corte 4: adapters exactos + atributos SELECCION/evaluación
corte 5: revisión autoritativa + creación con fingerprint/disposiciones
corte 6: recorridos integrados Playwright/axe y regresiones
```

Si un corte cohesivo no cabe tras una división honesta, se elevará el riesgo antes de continuar. Esta propuesta no autoriza push, PR ni release.

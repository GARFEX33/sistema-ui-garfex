# Exploración — Unidades activas para creación de recursos

## Estado

- **Change:** `active-unit-resource-creation`.
- **Fase:** exploración coordinada; no se modificó código de producción, contratos publicados, esquema, pruebas ni historial aprobado.
- **Artifact home:** frontend, `sistema-ui-garfex/openspec`.
- **Repositorios inspeccionados:** frontend `/home/garfex/PROGRAMACION/sistema-ui-garfex` y backend `/home/garfex/PROGRAMACION/sistema-garfex`.
- **`skill_resolution`:** `paths-injected`.
- Se cargaron `garfex-design-system`, `ui-ux-pro-max` y `chained-pr`. No se requieren sus pasos de implementación visual en esta fase.
- El backend contiene `.codegraph/`; el executor no dispone de MCP ni CLI de CodeGraph. Se usó inspección dirigida como fallback. No se inicializó ni modificó ningún índice.
- Este es un sucesor de `keyboard-first-resource-creation`; sus commits, artefactos y pruebas históricas aprobadas no se reescriben.

## Decisión de producto que gobierna el cambio

La decisión seleccionada en creación representa exclusivamente `Recurso.unidadId`. El catálogo seleccionable es **toda Unidad existente y activa**, sin depender de que exista, esté seleccionada, sea principal o sea efectiva una `politicaUnidadRecurso` para la Familia o el Tipo. La creación nunca crea, activa, desactiva, reordena ni muta una política.

Las políticas pueden conservarse para administración y como metadatos de preferencia/default, pero no son una autorización de selección, una precondición de evaluación/creación ni parte de la concurrencia de creación.

## Evidencia del defecto

La evidencia confirmada —`obtenerUnidad` devuelve Metro Lineal con `{ id, activo: true, effective: true }`, mientras `listarPoliticasUnidad` por esa unidad devuelve `items: []`— coincide con el flujo actual:

```text
Tipo confirmado
  → listarPoliticasUnidad(familiaRecursoId, paraTipoRecursoId, modo ACTIVE)
  → descartar política no efectiva/suprimida/sombreada
  → obtenerUnidad por cada referencia restante
  → conservar detalle activo/effective
```

Por tanto una Unidad activa sin política no llega al selector aunque sea válida como entidad. El mismo supuesto aparece en las validaciones backend descritas a continuación.

## Backend: superficie actual y cambios necesarios

### API pública de catálogo de Unidades

`convex/catalogoAdmin/unidades.ts` ya expone `listarUnidades({ cursor?, pageSize?, modo?: ALL | ACTIVE | INACTIVE })`. Con `modo: ACTIVE` consulta el índice `porActivoYClaveYAdminSort`, pagina por cursor opaco y proyecta `{ id, clave, nombre, descripcion?, simbolo?, activo, revision, effective }`; `effective` es igual a `activo`. No requiere Familia, Tipo ni política. `obtenerUnidad` entrega la misma proyección por ID.

No hace falta una nueva API, índice, tabla ni migración para listar el catálogo activo.

`listarPoliticasUnidad` y las mutaciones de política deben conservarse como APIs de administración/preferencia. No se deben invocar desde el camino de elegibilidad de creación ni como efecto secundario de crear un Recurso.

### Evaluación selection-only

`convex/catalogoAdmin/recursos.ts` delega tanto `evaluarCreacionDesdeSelecciones` como `crearRecursoDesdeSelecciones` a `cargarCreacionSeleccion` y al mismo evaluador puro `src/catalogoRecursos/dominio/evaluarCreacionSeleccion.ts`.

Actualmente `convex/catalogoAdmin/lib/cargarCreacionSeleccion.ts`:

1. lee Clase, Familia, Tipo y Unidad;
2. lee políticas de Familia y Tipo;
3. ejecuta `resolverUnidadesEfectivas`;
4. define `unitValid` como Unidad activa **y** presente en `effectivePolicies.selected`;
5. añade `politicasUnidadEfectivas` al grafo.

El evaluador transforma `unitValid === false` en `UNIT_INVALID`, por lo que create devuelve `INVALID` después de la reevaluación. Esto contradice el producto incluso aunque la Unidad exista y esté activa.

**Cambio requerido:** `unitValid` debe significar sólo que la Unidad suministrada existe y está activa. El cargador no debe leer, resolver ni devolver políticas para evaluar/crear. La jerarquía y ownership mantienen sus validaciones vigentes.

Además, `src/catalogoRecursos/dominio/huellaCatalogoSeleccion.ts` serializa `politicasUnidadEfectivas` dentro de `catalogFingerprint`. Debe eliminar esa porción del grafo/canonicalización y actualizar la versión/documentación de la huella sólo si el contrato de versionado lo exige. Una mutación de política no puede invalidar una evaluación que ya no depende de políticas; cambios de la Unidad elegida, jerarquía, atributos, valores, reglas u ownership sí conservan su semántica de fingerprint.

### Dominio y camino legado de create/update/activation

`src/catalogoRecursos/dominio/validarRecurso.ts` rechaza actualmente con `UNIDAD_NO_PERMITIDA` cuando `resolverCatalogoEfectivo(snapshot).policies` no contiene la Unidad. `convex/catalogoRecursos/validacionRecurso.ts` construye ese snapshot leyendo políticas y `convex/catalogoAdmin/recursos.ts` usa este validador en `crearRecurso`, `actualizarRecurso` y activación.

**Cambio requerido:** la validación de dominio debe aceptar una Unidad existente y activa sin comprobar `resolved.policies`. El loader del snapshot puede dejar de cargar políticas cuando ya no sean consumidas por validación. `UNIDAD_NO_PERMITIDA` y su mapeo administrativo dejan de ser un resultado alcanzable para estos caminos; una Unidad ausente/inactiva continúa siendo inválida.

Hay una segunda barrera de compatibilidad: `crearRecurso`, actualización y activación también exigen que `cargarAgregado(...).status === VALID`. `cargarAgregado.ts` y `validacionAgregado.ts` declaran `PRINCIPAL_UNIT_COUNT` y `UNIT_INACTIVE` a partir de políticas; eso puede bloquear el camino legado aunque el validador de Unidad ya se haya corregido.

La decisión de producto exige aislar esas violaciones de los prechecks de Resource create/update/activation, o retirar el requisito de principal del agregado cuando la política sea sólo preferencia. La opción más segura a diseñar es conservar las reglas de integridad de administración/publicación de políticas, pero hacer que la validación específica de Recursos ignore únicamente las violaciones derivadas de política (`PRINCIPAL_UNIT_COUNT`, `UNIT_INACTIVE`) y mantenga las demás violaciones de agregado. Debe cubrir explícitamente el estado `NOT_EVALUATED`, para que ausencia de políticas no sea otra forma indirecta de bloqueo. Si producto también pretende permitir activar Tipos/publicar sin principal, eso es un cambio separado de administración/publicación, no debe mezclarse sin una decisión explícita.

### Persistencia y no mutación

Ambos creators persisten `unidadId` al insertar el Recurso (`insertarAgregadoRecurso` para selection-only, `insertarRecursoAdministrativo` para legado). Ninguna de esas funciones necesita escribir `politicasUnidadRecurso`; se debe preservar esta separación. No hay migración de datos: `recursos.unidadId` ya es obligatorio y las políticas existentes siguen válidas como datos administrativos.

### Backend: superficies de prueba

Añadir o ajustar cobertura dirigida en:

- `convex/catalogoAdmin/lib/cargarCreacionSeleccion.test.ts`: Unidad activa sin política carga `unitValid: true`; inactiva/inexistente permanece inválida; no se requiere ni se expone el conjunto de políticas.
- `src/catalogoRecursos/dominio/evaluarCreacionSeleccion.test.ts`: el mismo grafo con Unidad activa es `VALID`/`INCOMPLETE` según atributos, no `UNIT_INVALID`; Unidad inactiva sí produce `UNIT_INVALID`.
- `src/catalogoRecursos/dominio/huellaCatalogoSeleccion.test.ts`: añadir, quitar, sombrear o cambiar principal de una política no altera fingerprint; un cambio de Unidad seleccionada o de sus datos de validez sí conserva el comportamiento esperado.
- `convex/catalogoAdmin/recursos.test.ts`: separar el fixture selection-only de su inserción actual de política y demostrar `evaluar...` y `crear...` con Unidad activa sin política; mantener la prueba de Unidad inactiva; verificar que `crear...` sólo escribe Resource/valores, nunca una política.
- Pruebas de `validarRecurso`/`convex/catalogoRecursos/validacionRecurso` y de los endpoints legado: una Unidad activa sin política permite el contrato legado correspondiente, mientras ausencia/inactividad sigue fallando; agregar casos que prueben que las demás violaciones de agregado no se silencian.
- `convex/catalogoAdmin/unidades.test.ts`: conservar las reglas propias de CRUD de políticas y sumar la garantía pública de `listarUnidades({ modo: "ACTIVE" })`, orden/paginación y exclusión de inactivas si no existe ya una prueba equivalente.
- `contract-tests/catalog-admin-consumer.ts`: el endpoint `listarUnidades` ya está tipado; ampliar el uso con `modo: "ACTIVE"` si se necesita congelar su argumento/proyección para el consumidor.

## Frontend: superficie actual y cambios necesarios

### Adapter y contrato local

`src/features/resources-master/resourcesMaster.api.ts` hoy conoce sólo `listarPoliticasUnidad` y `obtenerUnidad`; `ResourcesMasterApi` no expone `listarUnidades`. `resourcesMaster.types.ts` ya define `ResourceUnitDetail`, cuya forma coincide con la proyección de `listarUnidades`, y `parseUnitDetail` ya valida un item individual.

El adapter debe añadir de modo feature-local:

- la operación query `catalogoAdmin/unidades:listarUnidades`;
- `listUnits({ cursor?, pageSize?, modo: 'ACTIVE' })` en `ResourcesMasterApi`;
- tipo de input/página de Unidad y parser estricto de la envoltura paginada usando `ResourceUnitDetail`;
- referencia Convex y caso de transporte.

No debe añadirse React Query, estado global, endpoint nuevo ni un adapter transversal. Las pruebas del adapter deben comprobar que transmite exactamente `{ cursor, pageSize, modo: 'ACTIVE' }`, acepta páginas válidas y rechaza respuestas malformadas.

### Loader, flujo, ranking y presentación

La cadena actual está en `resourceCreation.loaders.ts` (`createUnitPolicyPageController`, `createUnitCandidateHydrator`), `useResourceCreationFlow.ts` y `ResourceCreationContextStage.tsx`. El controlador conserva `principal`/`selected` desde políticas y el presentador usa esos flags para `preferredActiveKey`.

**Recomendación resuelta: eliminar solicitudes de política del Creador, no usarlas siquiera para ranking en este cambio.** El loader de Unidad debe ser una página dependiente del Creador sólo por ciclo de vida/staleness, no por Familia/Tipo: carga `listUnits({ modo: 'ACTIVE' })`, conserva cursor, deduplica por ID y descarta respuestas pertenecientes a una apertura/generación cerrada. Cada `ResourceUnitDetail` activo/effective es candidato; no hay hidratación N+1 porque la lista ya contiene etiqueta y símbolo.

No se recomienda una solicitud opcional de políticas ahora porque:

1. no satisface una necesidad confirmada de UX y mantiene dos fuentes de disponibilidad;
2. una respuesta incompleta, tardía o fallida podría volver a reintroducir exclusión o estados engañosos;
3. `principal`/`selected` describen resolución de política, no una preferencia global inequívoca del nuevo catálogo.

Si en un cambio futuro se confirma una preferencia de ranking, la solicitud debe ser estrictamente advisory, no bloqueante y no filtrante: la lista activa completa se muestra aunque la política falte/falle, la selección nunca cambia automáticamente y un ranking sólo puede reordenar candidatos ya elegibles. Esa decisión futura necesita definir cuál política aplica y cómo se comunica sin afirmar elegibilidad.

`ResourceCreationContextStage.tsx` debe dejar de calcular `preferredUnitKey`, de pasar `preferredActiveKey` y de presentar el rótulo como una selección autorizada por política. Se debe evaluar en design si el texto de producto deja de ser **Unidad natural** y pasa a **Unidad**, pues el primer nombre conserva una semántica de default que el flujo ya no usa. No se modifica el shell, rail, foco local, navegación search-list ni las garantías keyboard-first aprobadas salvo lo necesario para sustituir la fuente de items.

La elección confirmada continúa despachando únicamente `CONFIRM_UNIT` y el reducer continúa invalidando evaluation/fingerprint. El payload de `useResourceCreationEvaluation` y `useResourceCreationCreate` ya toma `draft.unitId` como `unidadId`; no debe contener policy ID ni una mutación de política.

### Frontend: superficies de prueba

- `tests/unit/resourcesMasterApi.test.ts`: parser, transporte, cursor y modo `ACTIVE` de `listUnits`.
- `tests/unit/resourceCreation.loaders.test.ts`: paginación/dedupe/retry/stale del listado directo, filtrado defensivo de detalle no activo/no efectivo, y ausencia de hidratación `getUnit`/referencias de política.
- `tests/unit/crearRecursoSurface.test.tsx` y/o `tests/unit/useResourceCreationFlow*.test.tsx`: con Tipo válido y políticas vacías, Metro Lineal activa aparece, se confirma con click/Enter y se envía sólo como `unidadId`; ninguna llamada a `listUnitPolicies` ni `getUnit`; página siguiente, retry y cambio de Tipo/apertura descartan estados stale sin borrar el catálogo global.
- `tests/unit/resourceCreation.evaluationRequest.test.ts`, `useResourceCreationEvaluation.test.tsx` y `useResourceCreationCreate.test.tsx`: fixture de Unidad activa sin política llega a evaluate/create; no cambia el DTO selection-only ni la semántica de fingerprint/disposición.
- `tests/e2e/resourcesMaster.workstation.spec.ts`: recorrido de teclado Clase → Familia → Tipo → Unidad activa sin política → evaluación/revisión/create, con una aserción de que la opción permanece visible y no hay mutación de política. Mantener axe y restauración de foco existentes.
- `tests/architecture/resourceCreationBoundaries.test.ts` y `keyboardBoundaries.test.ts`: actualizar sólo los guards que nombran loaders/operaciones retiradas y conservar el límite de listener global único y feature-localidad.

## Riesgos y compatibilidad

| Riesgo | Control requerido |
| --- | --- |
| El frontend muestra una Unidad activa antes de que backend acepte su create. | Entregar y desplegar primero el cambio backend; no habilitar el frontend nuevo contra el backend anterior. |
| Se elimina la política de la lista pero permanece en `unitValid` o fingerprint. | Cubrir evaluación y create sin política, y una mutación de política que no cambie fingerprint. |
| El camino legado sigue bloqueado por `cargarAgregado`. | Pruebas end-to-end de creator legado/actualización/activación y una decisión explícita sobre el filtrado de violaciones policy-only. |
| Se confunde preferencia con elegibilidad. | No solicitar políticas en este change; cualquier ranking futuro es advisory, estable y no bloqueante. |
| Se modifican políticas al confirmar. | Guard de no llamadas a mutaciones de política y comparación de filas antes/después en backend. |
| Se degrada el selector keyboard-first. | Reutilizar `StagedSearchSelector`, conservar candidato versus confirmado y los handlers locales React Aria; no añadir listeners globales. |
| Cambios de fingerprint hacen obsoletas evaluaciones previas innecesariamente. | Excluir políticas del grafo/hash y mantener datos realmente evaluados. |
| Se alteran snapshots/publicación al perseguir el cambio. | Tratar administración/publicación de principal/default como no objetivo, salvo nueva decisión explícita. |

## Alcance, no objetivos y migración

**Incluido:** catálogo completo de Unidades activas para crear, validación server-side de Unidad existente/activa sin política, eliminación de dependencia de política de la evaluación/fingerprint, adapter/lista frontend y cobertura de regresión cruzada.

**No objetivos:** crear/migrar/borrar políticas, cambiar su CRUD o sus reglas de administración, crear Unidades desde el Creador, elegir un principal, alterar catálogo publicado/snapshots, cambiar Clase/Familia/Tipo/atributos/ownership, cambiar las uniones públicas evaluate/create, introducir una nueva API backend, modificar URL/estado global/dependencias o reescribir `keyboard-first-resource-creation`.

No hay migración de datos o esquema prevista. Las políticas existentes se conservan; la compatibilidad exigida es semántica: dejan de ser un filtro para `Recurso.unidadId`. La retirada de `UNIDAD_NO_PERMITIDA` de caminos Resource es una modificación de comportamiento documentada y debe conservar códigos/contratos no relacionados para consumidores administrativos.

## Orden seguro de entrega entre repositorios

1. **Backend primero:** cambiar evaluación selection-only, fingerprint y validación de Resource; resolver explícitamente la barrera de agregado del camino legado; añadir pruebas de Unidad activa sin política, no mutación y compatibilidad. Publicar/desplegar la compatibilidad antes de que un frontend pueda seleccionar todo el catálogo.
2. **Frontend adapter/loader:** añadir `listarUnidades(ACTIVE)` y reemplazar el resolver policy→detail por la página directa, con pruebas de transporte, cursors, retry y stale. No tocar historia aprobada; este cambio modifica únicamente el sucesor.
3. **Frontend integración visible:** conectar el selector a la lista directa, retirar ranking/policy calls, adaptar el rótulo y ampliar RTL/E2E/evaluación-create para la evidencia Metro Lineal sin política.
4. **Compatibilidad observada:** después de ambos despliegues, comprobar que un Recurso creado conserva sólo `unidadId` y que las filas de políticas no cambiaron. Esta es una futura verificación, no fue ejecutada en exploración.

El presupuesto de 400 líneas se aplica por work unit/repo. Backend y frontend son límites de revisión separados, pero la sustitución de loader y la matriz RTL/E2E puede exceder un corte frontend cohesivo. Con `delivery_strategy: ask-on-risk` y sin estrategia de cadena seleccionada, design/tasks deben estimar antes de apply y pedir decisión humana si un work unit supera el presupuesto; no se autoriza `size:exception` ni se selecciona una cadena en esta fase.

## Readiness

- **Propuesta/spec:** lista para redactarse con la decisión ya resuelta de lista directa activa y sin ranking por políticas.
- **Design:** debe concretar el tratamiento de `cargarAgregado` para legacy create/update/activation y confirmar si la etiqueta pasa de “Unidad natural” a “Unidad”.
- **Apply:** bloqueado hasta que backend y frontend tengan slices TDD separados y se resuelva la estimación de presupuesto si supera 400 líneas.
- **Rollback:** revertir primero la integración frontend a la fuente anterior sólo si el backend aún conserva compatibilidad; revertir backend por su slice sin datos que deshacer. No hay migración.

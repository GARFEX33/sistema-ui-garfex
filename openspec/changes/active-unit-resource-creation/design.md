# Diseño técnico — Unidad activa sin política

## Decisión y alcance

El backend validará la existencia y actividad de la Unidad seleccionada, no su pertenencia a una política. El Creador consumirá directamente el catálogo paginado `listarUnidades({ modo: 'ACTIVE' })`. La confirmación seguirá representando únicamente `Recurso.unidadId`.

Implementación coordinada **backend → frontend**, con artefactos exclusivamente en este cambio frontend. No se modifica `packages/coding-agent`: el alcance explícito son `/home/garfex/PROGRAMACION/sistema-garfex` (BE) y `/home/garfex/PROGRAMACION/sistema-ui-garfex` (FE).

Entradas consumidas: [proposal.md](proposal.md), [explore.md](explore.md), [specs/resource-creation/spec.md](specs/resource-creation/spec.md). Este documento no implementa ni verifica el cambio.

### Evidencia y resolución de skills

- Skills inyectados leídos: `garfex-design-system`, `ui-ux-pro-max`, `chained-pr`.
- Se leyó `cognitive-doc-design` desde su ruta disponible como soporte documental requerido. No se necesitan nuevas decisiones de Tailwind ni un nuevo sistema visual.
- `skill_resolution: fallback-path`: los tres skills del padre están resueltos por rutas inyectadas; faltó la ruta del executor `sdd-design`. El intento degradado en `/home/garfex/.pi/agent/npm/node_modules/gentle-pi/skills/sdd-design/SKILL.md` devolvió ENOENT. Se siguió el contrato de fase inyectado; el padre debe inyectar la ruta indexada del executor en la siguiente fase.
- Sin herramienta de ejecución ni MCP CodeGraph, no se pudo ejecutar la resolución Git de raíces ni consultar/inicializar CodeGraph. Se inspeccionaron rutas concretas de ambos proyectos y referencias dirigidas mediante Read/Grep; no se modificaron índices. La evidencia es inspección estática, no ejecución.

## Flujo resultante

```text
Apertura del Creador (generación G)
  → selector Unidad, después del Tipo confirmado
  → listUnits({ modo: ACTIVE, cursor, pageSize: 20 })
  → validar página → filtrar activo/effective → deduplicar por resourceIdKey(id)
  → StagedSearchSelector: candidata local ≠ unidad confirmada
  → CONFIRM_UNIT → draft.unitId → invalidar evaluación anterior
  → evaluarCreacionDesdeSelecciones
      cargarCreacionSeleccion: Unidad existente/activa + jerarquía/ownership/atributos
      evaluarCreacionSeleccion + fingerprint v2 sin políticas
  → crearRecursoDesdeSelecciones: recargar/reevaluar dentro de mutation
      comparar fingerprint → comprobar identidad → insertar Resource/valores
```

No hay solicitud de políticas, hidratación N+1, fallback a políticas, ranking principal ni selección automática de Unidad. La búsqueda sigue siendo local entre páginas cargadas y conserva el aviso visible de ese alcance.

## Backend: selección y concurrencia

| Archivo / símbolo existente | Cambio decidido |
|---|---|
| `convex/catalogoAdmin/lib/cargarCreacionSeleccion.ts::cargarCreacionSeleccion` | Eliminar `familyPolicies`, `typePolicies`, `policyRows`, `policyUnits`, `asPolicy`, `effectivePolicies`, `politicasUnidadEfectivas` y el import de `resolverUnidadesEfectivas`/`PoliticaUnidadEfectiva`. `unitValid = Boolean(unidad?.activo)`, manteniendo lectura de la Unidad suministrada y su `reference(unidad)`. |
| `src/catalogoRecursos/dominio/huellaCatalogoSeleccion.ts::{HuellaGraph, huellaCatalogoSeleccion}` | Retirar `PoliticaUnidadHuella`, propiedad explícita `politicasUnidadEfectivas`, ordenación/canonicalización `policies` y su inclusión en `canonical`. Cambiar dominio hash a `selection-catalog-fingerprint:v2`. |
| `src/catalogoRecursos/dominio/evaluarCreacionSeleccion.ts::{SelectionCatalogGraph, evaluarCreacionSeleccion}` | El grafo hereda la eliminación desde `HuellaGraph`. Mantener `UNIT_INVALID`, jerarquía, ownership, selección de valores, reglas, identidad y resultados `VALID/INCOMPLETE/INVALID`; corregir fixtures, no relajar el evaluador. |
| `convex/catalogoAdmin/recursos.ts::{evaluarCreacionDesdeSelecciones, crearRecursoDesdeSelecciones}` | Conservar delegación al mismo loader/evaluador. Create sigue recargando y comparando `expectedCatalogFingerprint` antes de persistir; no confiar en la lista frontend ni en un resultado previo. |

La huella mantiene las referencias de Clase, Familia, Tipo, Unidad y organización, sus campos semánticos actuales (`id`, `clave`, `nombre`, `activo`), relaciones de jerarquía, asignaciones, valores, opciones y reglas. No se incorpora una revisión agregada que pueda cambiar únicamente por políticas. Se conserva la semántica de cambios realmente evaluados, no se promete invalidación por cualquier campo administrativo irrelevante.

El prefijo interno v2 hace explícita la nueva canonicalización; el contrato externo sigue siendo un string SHA-256 opaco. Una evaluación v1 en vuelo recibirá `CATALOG_CHANGED` una vez y deberá adoptar/confirmar la evaluación vigente mediante el flujo existente. No aceptar fingerprints v1 en un camino alternativo ni mantener dos algoritmos. Cambios posteriores exclusivamente de políticas dejan el hash v2 idéntico.

Unidad inexistente: referencia ausente y `unitValid: false`. Unidad inactiva: referencia presente con `activo: false` y `unitValid: false`. Ambas producen `UNIT_INVALID`; create no inserta, aunque primero pueda devolver `CATALOG_CHANGED` cuando el hash enviado ya no coincide. La desactivación entre evaluar y crear se detecta en la recarga transaccional.

## Backend: compatibilidad legacy sin silenciar el agregado

### Validación directa

En `src/catalogoRecursos/dominio/validarRecurso.ts::validarRecurso`, retirar sólo el retorno `UNIDAD_NO_PERMITIDA` basado en `resolved.policies`. Mantener el guard existente de jerarquía efectiva y `unidad?.activo`, y todos los controles posteriores de atributos, tipos, opciones, obligatoriedad y reglas.

En `convex/catalogoRecursos/validacionRecurso.ts::cargarSnapshot`, retirar la consulta de `politicasUnidadRecurso` y proyectar `politicas: []` para conservar el contrato compartido `CatalogoSnapshot`. `resolverCatalogoEfectivo` puede seguir resolviendo un conjunto vacío sin afectar sus asignaciones/reglas; no se elimina globalmente su soporte de políticas. Los seams `evaluarRecurso`, `validarRecurso`, `validarRecursoAdministrativo` y `construirRecursoValidado` mantienen límites y contratos. El código/mensaje `UNIDAD_NO_PERMITIDA` y `mapResourceValidationFailure` pueden conservar compatibilidad de tipos histórica, pero dejan de ser alcanzables por estos caminos; no sustituirlos por un rechazo equivalente.

### Perfil explícito de agregado Resource

**Elegido:** agregar un perfil interno de validación Resource al loader y al validador puro, con administración como default. No filtrar a ciegas un `LoadedAggregate` ya calculado: hoy hay retornos tempranos y límites de fan-out de políticas que pueden ocultar otros checks.

Contrato propuesto:

```ts
// Nombres nuevos; no cambian DTOs públicos.
type AggregateValidationPurpose = 'ADMINISTRATION' | 'RESOURCE'
// cargarAgregado(ctx, typeId, overrides = {}, purpose = 'ADMINISTRATION')
// validarAgregado(input, purpose = 'ADMINISTRATION')
```

Cambios en `convex/catalogoAdmin/lib/cargarAgregado.ts::cargarAgregado`:

1. Mantener lecturas/validación de Tipo, Familia, Clase, revision positiva, efectividad y overrides. Jerarquía no efectiva sigue devolviendo `NOT_EVALUATED` con `effective: false` y sigue siendo rechazada por Resource.
2. En perfil `RESOURCE`, no consultar políticas de Unidad ni unidades referenciadas por ellas; excluir únicamente esos dos conjuntos del cálculo de límite. Mantener límites y lecturas de presentación canónica, atributos, valores, reglas y compatibilidad de opciones.
3. No ejecutar en perfil Resource el retorno temprano `NOT_EVALUATED` basado en `familyRows/typeRows/presentations/rules/compatibilityPolicies` vacíos. Continuar evaluando presentación y compatibilidad aunque no haya políticas de Unidad.
4. En perfil Resource no resolver `resolverUnidadesEfectivas`; pasar conjunto vacío de principalUnits al validador con el perfil explícito. No fabricar una política principal ni una Unidad activa ficticia.
5. En `src/catalogoRecursos/dominio/validacionAgregado.ts::validarAgregado`, omitir exclusivamente los checks `PRINCIPAL_UNIT_COUNT` y `UNIT_INACTIVE` para ese perfil. Mantener `PRESENTATION_COUNT`, `PRESENTATION_TOKEN_INVALID`, jerarquía, compatibilidad y deferredChecks. Todos los retornos previos de opciones/asignaciones/reglas/límites permanecen activos.
6. Cambiar sólo `crearRecurso` y `validateCurrentResourceAggregate` en `convex/catalogoAdmin/recursos.ts` para pedir `RESOURCE`. El segundo cubre `actualizarRecurso` y `activarRecurso`; preservar optimistic revision, inmutabilidad, ownership, identidad, alias y transiciones de lifecycle.

**Tratamiento preciso de NOT_EVALUATED:** no se convierte genéricamente en VALID. La falta de evaluación causada por el sentinel administrativo se evita reevaluando todos los checks Resource. Un Tipo efectivo sin políticas de Unidad pero con presentación válida y demás integridad válida pasa. Si también carece de presentación, falla con `PRESENTATION_COUNT`, no con una ausencia artificial de evaluación. Una evaluación diferida realmente pendiente sigue bloqueando, al igual que una jerarquía no efectiva.

Matriz de seguridad del perfil Resource:

| Estado | Resultado |
|---|---|
| Unidad suministrada activa, cero políticas de Unidad, resto válido | Aceptar |
| Políticas apuntan a otra Unidad inactiva o no tienen principal, resto válido | No bloquear por esas políticas |
| Unidad suministrada ausente/inactiva | Rechazar desde validación directa |
| Principal inválido junto con presentación inválida | Rechazar presentación; nunca borrar todo `violations` |
| Sin políticas y sin presentación | Rechazar `PRESENTATION_COUNT` tras evaluación real |
| Jerarquía inactiva/rota o revisión inválida | Rechazar |
| Opciones vacías, selección inválida, reglas en conflicto, allowlist vacía o límite no-policy excedido | Rechazar con códigos existentes |

### Loaders que deben conservarse

**Sí existe carga de políticas usada fuera del Creador y no se elimina globalmente.** `cargarAgregado` sigue siendo usado por `convex/catalogoAdmin/jerarquia.ts` en activaciones de Clase/Familia/Tipo y proyecciones administrativas; su perfil default conserva exactamente las reglas administrativas. La llamada de `obtenerDetalleRecurso` a `cargarAgregado` conserva diagnósticos administrativos (pueden seguir mostrando carencias de políticas sin actuar como autorización de selección).

También se conservan `convex/catalogoAdmin/unidades.ts::resolve`, `validateTypePolicy`, `validateFamilyPolicies`, `listarPoliticasUnidad` y el resolver compartido `resolverUnidadesEfectivas`: sirven al CRUD/validación administrativa. El soporte de políticas en `resolverCatalogoEfectivo` no se borra del dominio compartido.

En FE, la búsqueda dirigida de referencias identifica `createUnitPolicyPageController` y `createUnitCandidateHydrator` como consumidos sólo por `useResourceCreationFlow` en producción; esos dos controladores y sus tipos exclusivos sí se retiran una vez desconectados. `ResourcesMasterApi.listUnitPolicies` y `getUnit` pueden permanecer como adapter de compatibilidad probado, **sin llamadas desde creación**; no se exige una limpieza global de APIs en este cambio. Se preserva `resourceCreation.dependentLoader.ts::createDependentLoader`, que se reutiliza para el nuevo catálogo.

## Frontend: contrato y loader

### Adapter feature-local

En `resourcesMaster.types.ts`, agregar `ResourceUnitListInput` con `cursor?: string | null`, `pageSize?: number`, `modo: 'ACTIVE'`; usar `ResourceContextListPage<ResourceUnitDetail>` como retorno (alias nominal opcional, no otro formato).

En `resourcesMaster.api.ts`:

- Añadir `ResourceUnitListOperation = 'catalogoAdmin/unidades:listarUnidades'` a `ResourceOperation`, `queryReference`, referencia Convex y switch de `createResourcesMasterConvexApi`.
- Añadir `ResourcesMasterApi.listUnits` e implementación en `createResourcesMasterApi`. Transmitir sólo `{ modo: 'ACTIVE', cursor?, pageSize? }`, preservando cursor nulo y omitiendo undefined como las listas de contexto. No transmitir Familia/Tipo ni `paginationOpts` (ese es otro contrato).
- Añadir `parseUnitsPage`: validar `items`, `continuationCursor: string | null`, `isExhausted: boolean` y cada item con `unitDetail`, que rechaza null. No usar `contextItemBase`: Unidades no tienen `effectiveReasons`.
- La página malformada falla completa y entra a retry, sin mezclar items parciales. El parser valida tipos/campos requeridos como el adapter existente; no amplía restricciones de otros parsers.

El endpoint backend existente usa `porActivoYClaveYAdminSort`; conservar cursor opaco, orden público y proyección `{ id, clave, nombre, descripcion?, simbolo?, activo, revision, effective }`, donde `effective === activo`. Sin nuevo endpoint, índice, dependencia ni estado global.

### Controlador directo y ciclo de vida

Crear un wrapper pequeño `createActiveUnitPageController` sobre `createDependentLoader<ResourceUnitDetail>` en un archivo feature-local nuevo (`resourceCreation.activeUnits.ts`). El wrapper llama `listUnits(ACTIVE)`, filtra defensivamente `activo && effective` y conserva metadatos de paginación. Proyectar `UnitCandidate` sólo con `unidadId`, `clave`, `nombre`, `simbolo?`; sin `policyId`, `principal`, `selected`.

Contratos de carga:

- Identidad por `resourceIdKey(item.id)`; first-seen estable, sin duplicar ni reordenar por política. Un catálogo actualizado se obtiene en una nueva generación, no mezclando revisiones de aperturas distintas.
- Una solicitud pendiente por generación; `continue` es no-op durante pending o al agotar páginas.
- `setContext` incrementa token y limpia cursor/items. El contextKey representa apertura/generación del catálogo activo, nunca Familia o Tipo.
- `begin` invalida la generación anterior. Carga lazy al llegar por primera vez a Unidad (incluido prefijo con Tipo); siguientes visitas dentro de la misma apertura reutilizan páginas.
- Cambiar Clase/Familia/Tipo conserva las páginas globales, pero el reducer sigue limpiando la selección confirmada/evaluación según sus reglas existentes. No crea una petición ligada al Tipo anterior; una petición global vigente puede completar sin restaurar su draft anterior.
- Cierre/unmount invalida context con null. Vincular cleanup al ciclo de vida real del Creador; si permanece montado cerrado, exponer/invocar cancelación desde su handler de cierre. Reabrir siempre inicia nueva generación.
- Cada respuesta compara token, contextKey y cursor capturados antes de modificar items/error/pending. Un finally antiguo no libera pending de otra generación. Mantener la protección ya presente en `createDependentLoader`.
- Retry inicial solicita cursor null. Retry de continuación conserva páginas y vuelve a solicitar el último cursor fallido; nunca reinicia silenciosamente el catálogo ni hidrata IDs.
- Página vacía no agotada sigue ofreciendo cargar más. Vacío definitivo sólo con `isExhausted` y cero candidatos.
- Cursor repetido no agotado produce error recuperable de continuación, no un loop automático. No llamar `start` repetidamente sobre una sesión ya paginada: para reiniciar, primero `setContext` (el loader actual compara el cursor capturado).

En `useResourceCreationFlow.ts`, sustituir `unitPolicies`, `unitHydrator`, `hydrateUnitPolicies`, `startUnitsForContext` y sus refresh encadenados por el controlador único; mantener refresh antes/después de promises como mecanismo local existente. `continueUnits`/`retryUnits` delegan una vez. `unitSelectorLoadState` en `resourceCreation.selectorState.ts` mapea un solo estado paginado, no política + hidratación.

Confirmar exige que el item siga en la generación vigente y en sus candidatos activos cargados. Permitir seleccionar items retenidos durante `loading-more`/`partial-error`: el fallo de otra página no invalida una Unidad ya cargada. No confirmar con lista inicial vacía/loading/error. La autoridad final sigue siendo BE ante una desactivación posterior.

## Selector, foco y sistema de diseño

Cambiar rótulo **“Unidad natural” → “Unidad”** en `ResourceCreationContextStage.tsx` y textos asociados del recorrido: ya no expresa un default administrativo. Retirar `preferredUnitKey` y la prop `preferredActiveKey` sólo de esta instancia; no eliminar la capacidad genérica de `StagedSearchSelector`.

Reutilizar `StagedSearchSelector`, React Aria `SearchField/ListBox/ListBoxItem`, shared `Button`, shell/rail y handlers de foco existentes. No nuevos componentes compartidos, CSS, tokens, listeners document/globales ni cambio visual aislado. Light-only y estilos de foco vigentes se conservan.

- Flechas/type-to-search actualizan candidata/foco local; sólo click/acción explícita Enter confirma con `CONFIRM_UNIT`.
- `confirmedKey` deriva de `draft.unitId`. Reparar candidata al filtrar o cargar páginas no muta la selección confirmada.
- Foco entrada → lista, regreso desde primera opción y foco post-confirmación mantienen el recorrido aprobado.
- Cargar más conserva candidato y búsqueda; al desaparecer el botón, restaurar foco a cargar más/retry/entrada sólo si se perdió, nunca robar foco al usuario.
- Mantener estados accesibles inicial-loading, empty, initial-error, loading-more y partial-error, mensajes de estado y controles de retry.
- Escape/cierre restaura foco al origen del Creador; la nueva cancelación de red lógica no cambia ese dueño de foco.
- `useResourceCreationEvaluation`/`useResourceCreationCreate` continúan enviando únicamente `draft.unitId` como `unidadId` junto con el resto del DTO vigente. Ningún ID de política.

## Pruebas planificadas (no ejecutadas)

| Superficie | Cobertura necesaria |
|---|---|
| BE `cargarCreacionSeleccion.test.ts` | Unidad activa sin políticas y con políticas ajenas; ausencia/inactividad; spy que rechace consultas a `politicasUnidadRecurso` y lecturas de unidades no seleccionadas; resto del grafo intacto. |
| BE `evaluarCreacionSeleccion.test.ts`, `huellaCatalogoSeleccion.test.ts` | VALID/INCOMPLETE según atributos, UNIT_INVALID; hash v2 determinista; políticas agregadas/borradas/sombreadas/principal cambiado no afectan hash; cambios relevantes de Unidad, jerarquía, ownership, asignaciones, valores, opciones y reglas sí. |
| BE `recursos.test.ts` selection-only | Fixture Metro Lineal sin insertar política; evaluar → mutar sólo políticas → crear con mismo hash; CREATED con unidadId exacto; estado de todas las filas de políticas idéntico antes/después de evaluar/create; desactivación intermedia no inserta; hash v1 → CATALOG_CHANGED. |
| BE dominio `validarRecurso` y adapter `validacionRecurso` | Unidad activa ajena/sin política pasa; ausente/inactiva falla; conservar atributos repetidos, requeridos, prohibidos, tipos/opciones inválidos. |
| BE agregado y endpoints legacy | Tabla de seguridad anterior en create/update/activate; pruebas de mezcla policy-only + violación unrelated; sentinel vacío recalculado; perfiles ADMINISTRATION sin regresiones; fan-out de políticas no afecta Resource y fan-out no-policy sigue rechazando. |
| BE `unidades.test.ts`, `contract-tests/catalog-admin-consumer.ts` | ACTIVE excluye inactivas, orden/paginación y proyección; CRUD/reglas administrativas de políticas siguen vigentes. |
| FE `tests/unit/resourcesMasterApi.test.ts` | Operación query/argumentos exactos, cursor inicial/continuación, parser válido y malformado; nuevos doubles incluyen listUnits. |
| FE loader y selectorState | Varias páginas, duplicados, página filtrada vacía no agotada, error inicial/continuación + retry, cursor repetido, doble click, close/reopen, resultado/error/finally obsoletos, retención de catálogo al cambiar Tipo. |
| FE `crearRecursoSurface` / `useResourceCreationFlow` | Metro Lineal visible sin política, click y Enter, flechas no confirman, payloads unidadId exactos, errores de página no bloquean candidatos válidos, cero llamadas listUnitPolicies/getUnit. |
| FE evaluation/create y arquitectura | Mantener reconcile/ADOPT_CREATE_EVALUATION y fingerprint stale; guards `resourceCreationBoundaries`/`keyboardBoundaries`, sin listener global adicional. |

### E2E real y E2E determinista

Ampliar `tests/e2e/resourcesMaster.workstation.spec.ts` para el recorrido teclado Clase → Familia → Tipo → Unidad “Metro Lineal” sin política → atributos/revisión → creación. Verificar selección explícita, foco, axe y restauración al salir. Interceptar/contabilizar llamadas sólo para demostrar ausencia de políticas/detalles en el Creador; mocks de catálogo sirven para carreras/paginación, **no prueban compatibilidad backend**.

Agregar un escenario de integración con backend compatible real en entorno aislado: provisionar jerarquía/atributos válidos y Unidad activa sin política mediante fixtures autorizados, capturar políticas antes de acciones, crear y leer Resource persistido, comparar unidadId y políticas después. No interceptar evaluate/create en esta prueba. El fixture no debe “arreglar” Metro Lineal agregando una política. Si no hay entorno real disponible, reportar E2E real pendiente y bloquear habilitación FE, no presentar E2E mock como evidencia suficiente.

La comparación de no mutación se delimita alrededor de evaluación/creación, separada de pruebas que mutan políticas deliberadamente. La matriz legacy requiere presentación válida para aislar el bloqueo policy-only; un fixture vacío completo no demuestra aceptación legacy sin controles de presentación.

## Entrega, compatibilidad y rollback

| Combinación | Compatibilidad |
|---|---|
| FE anterior + BE anterior | Comportamiento actual restringido |
| FE anterior + BE nuevo | Compatible; FE ofrece subconjunto. Evaluaciones antiguas requieren refresh v2 |
| FE nuevo + BE nuevo | Objetivo; catálogo activo completo |
| FE nuevo + BE anterior/revertido | No soportado; no habilitar/desplegar |

1. Implementar y validar todos los seams BE; desplegar juntos al entorno objetivo antes de cambiar la fuente FE.
2. Registrar revisión/despliegue BE y evidencia de evaluate/create real sin política. Disponibilidad de `listarUnidades` por sí sola no prueba compatibilidad semántica.
3. Integrar adapter/loader FE y selector; ejecutar las pruebas planificadas y E2E real. No introducir fallback automático a políticas ni un endpoint de capacidad nuevo.
4. Habilitar mediante despliegue FE coordinado; observar la combinación exacta de revisiones. No se establece aquí autorización de publicación/despliegue.

Rollback preferido: revertir primero FE manteniendo BE ampliado. Antes de habilitar FE, un BE defectuoso puede revertirse sin transformación de datos. Después de crear Recursos sin política, un rollback BE completo vuelve a impedir actualizar/activar algunos de ellos: preferir forward-fix o conservar el perfil de compatibilidad. Si es imprescindible revertir BE, retirar primero FE nuevo, comunicar el bloqueo operativo de esos Recursos y obtener decisión operativa; **no crear políticas compensatorias ni cambiar unidadId**.

No hay migración de esquema/datos, índices nuevos, backfill, cambio de ownership, escritura de políticas ni modificación de snapshots/publicaciones. Las filas existentes de políticas y los Recursos permanecen intactos durante el rollback.

### Observabilidad sin nueva infraestructura

Usar logs/telemetría existentes del transporte y Convex, más recibos de prueba/despliegue: contar queries de listado por páginas frente a cero queries policy/detail del Creador; observar latencia/error de listarUnidades, retry, `UNIT_INVALID`, `CATALOG_CHANGED`, errores de agregado y tasa CREATED. No confundir diagnósticos administrativos de política con fallos de creación.

Un pico transitorio de CATALOG_CHANGED al pasar a v2 es esperado; persistencia del pico bajo cambios sólo de políticas indica dependencia residual. Una Unidad activa sin política rechazada, cualquier escritura de política durante creación o pérdida de foco bloquea promoción/activa rollback FE. No se inventan umbrales ni infraestructura: comparar con baseline del entorno y registrar revisión BE/FE, resultado y correlación disponible, sin loggear valores sensibles ni cursores completos.

## Seams de trabajo y presupuesto de revisión

`delivery_strategy: ask-on-risk`; cadena **no seleccionada**, sin ramas/PRs creadas, sin `size:exception` autorizado. Una sola pasada de estimación conceptual; cada unidad incluye pruebas del seam, no se separan tests para ocultar tamaño. Cifras son **A+D** previstas, no medición Git ni autorización de cadena.

| Unidad / repo | Inicio → fin / dependencias | Estimación A+D |
|---|---|---:|
| B1 BE | Loader selection-only + grafo/hash v2 + tests puros y de carga | 240–360 |
| B2 BE | Perfil Resource en cargarAgregado/validarAgregado + matriz de perfiles; default admin intacto | 240–380 |
| B3 BE | Validador legacy/snapshot + wiring create/update/activate + regresiones endpoint; depende B2 | 220–370 |
| B4 BE | Evidencia integrada selection-only/no mutación/fingerprint y catálogo ACTIVE; depende B1–B3 | 180–330 |
| F1 FE | Adapter/types/parser/transporte + fixtures mínimos y tests; sin activar consumo | 180–320 |
| F2 FE | Wrapper directo sobre dependentLoader + tests de estado/carreras; depende F1 | 180–320 |
| F3 FE | Wiring flow/selectorState/rótulo sin borrar aún módulos antiguos + RTL; depende F2 y BE desplegado | 270–390 |
| F4 FE | Retirar controlador policy y tests exclusivos obsoletos; depende F3 | 250–390 |
| F5 FE | Retirar hydrator/tipos policy restantes y sus tests exclusivos; depende F4 | 240–390 |
| F6 FE | E2E teclado y harness real/recibos del contrato; depende F3 y B4 | 180–350 |
| D1 FE | Este design.md como unidad documental repo-local | objetivo <400 |

```text
B1 ─────────┐
B2 → B3 ────┴→ B4 → despliegue BE compatible ─────┐
F1 → F2 ─────────────────────────────────────────┴→ F3 → F4 → F5
                                                   └→ F6 → despliegue FE
```

F4/F5 son retirada de dos módulos conceptuales existentes: el archivo actual `resourceCreation.loaders.ts` supera 450 líneas y su borrado completo, incluso sin additions/tests, excedería 400. Por eso se conserva temporalmente código muerto durante F3 y se retira por controladores, manteniendo imports/types que aún use el segundo hasta F5. No comprimir código ni retirar pruebas útiles para cumplir presupuesto; sustituir únicamente pruebas del comportamiento de políticas ya reemplazado.

Riesgo global de presupuesto **alto** (múltiples repositorios, wiring amplio y eliminación >400). Todos los rangos por seam apuntan a <400, pero tests existentes y harness real pueden superar estimaciones. En tasks, medir/estimar el diff completo de cada unidad y su documentación, mantener <=60 minutos de revisión y pedir decisión humana antes de apply si el corte cohesivo supera 400. La tabla no decide Stacked PRs vs Feature Branch Chain ni autoriza publicar. Inicio/fin, dependencias y fuera de alcance deberán acompañar cada futura unidad de entrega.

## Riesgos residuales y siguiente fase

- El perfil Resource debe atravesar todos los checks unrelated; probar sentinel y errores mixtos es condición de aceptación, no detalle opcional.
- Retirar políticas del hash sin retirar sus lecturas dejaría límites y fallos indirectos; B1 exige ausencia de consultas.
- El catálogo paginado no es un snapshot transaccional duradero: dedupe mantiene UI estable, la recarga backend decide validez final.
- El estado administrativo puede seguir INVALID por políticas aunque un Resource sea válido; esto es intencional y no autoriza relajar administración/publicación.
- El padre debe aportar la ruta real del skill executor y resolver estrategia de entrega si las estimaciones de tasks disparan el gate. No hay pregunta de producto pendiente sobre Unidad, ranking ni rótulo.

**Readiness:** diseño listo para descomponer tasks; implementación, verificación, despliegue, sync y archive no realizados. Mantener inalterados los artefactos históricos de `keyboard-first-resource-creation`.

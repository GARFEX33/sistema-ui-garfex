# Exploración — Creación de recursos Keyboard First

## Estado y resolución

- **Change:** `keyboard-first-resource-creation`
- **Fase:** exploración; no se implementó código ni se ejecutaron pruebas.
- **`skill_resolution`:** `paths-injected`.
- Se leyeron el contexto OpenSpec, el cambio activo `catalog-hierarchy-base`, las habilidades inyectadas y las superficies runtime/pruebas pertinentes.
- El directorio `.codegraph/` existe. No se expuso una herramienta MCP ni CLI de CodeGraph en esta sesión, por lo que, tras comprobarlo, la inspección de archivos fue el fallback degradado.

## Contrato confirmado y límites

La mejora se limita al diálogo de **Nuevo recurso** de Recursos maestros. Sustituye el formulario convencional de tres pasos por una secuencia tipo terminal/menú:

```text
Clase → Familia → Tipo → atributos de uno en uno → revisión → crear
```

Cada nivel jerárquico muestra una lista enfocada y filtro/búsqueda local; `ArrowUp`/`ArrowDown` cambia el candidato, `Enter` confirma y avanza, `ArrowLeft` retrocede, escribir filtra y `Escape` cierra. El recorrido completo debe ser utilizable sin mouse.

Cuando el Maestro ya tiene una selección, el diálogo hereda el contexto válido más profundo y comienza en el primer nivel faltante. La ruta/breadcrumb del diálogo permite volver y cambiar incluso una selección heredada. Los atributos se completan uno por uno; sólo los `REQUIRED` bloquean el avance y la revisión confirma el payload real.

Quedan excluidos backend/Convex, cambios de contratos o payloads, Catálogo y su change activo `catalog-hierarchy-base`, dependencias, URL, estado global, configuración, Git/PR/release. `Tipo` sigue siendo un nivel visible y sus semánticas/API existentes no se corrigen ni rediseñan por este cambio.

## Estado actual comprobado

### Composición y contexto pantalla → diálogo

`src/features/resources-master/ResourcesMasterScreen.tsx` crea una única instancia de `ResourcesMasterApi`, obtiene el contexto visual con `useResourcesHierarchy(api)`, y monta:

```tsx
<CrearRecursoSurface api={api} onCreated={() => void refetchActive()} />
```

Por tanto, el diálogo recibe actualmente sólo `api` y `onCreated`; no recibe `selection`, items seleccionados ni contexto inicial. `onCreated` ya satisface el requisito post-creación: `useResourcesMasterListQuery` vuelve a leer únicamente la consulta activa, sin inserción optimista ni invalidación amplia.

`useResourcesHierarchy.ts` mantiene `classId`, `familyId` y `typeId` locales a la pantalla, carga Clases y habilita Familias/Tipos por padre con `parentGatedListController`. Al cambiar Clase resetea Familia/Tipo; al cambiar Familia resetea Tipo. El controlador compartido descarta respuestas stale por token de contexto, conserva páginas válidas, deduplica IDs y pagina explícitamente. La pantalla convierte esa selección en el filtro efectivo más profundo de la lista de Recursos.

La validez de herencia todavía no es una propiedad expuesta por el hook: el snapshot de creación debe verificar que el ID seleccionado sigue presente en sus items cargados y que `family.claseRecursoId === class.id` y `type.familiaRecursoId === family.id`; ante un corte inválido sólo se hereda el prefijo válido. No se debe adoptar una respuesta tardía ni un descendiente de otro padre.

### Diálogo existente y contratos preservables

`src/features/resources-master/CrearRecursoSurface.tsx` contiene actualmente el formulario completo:

- Estado local de apertura, opener, `step: 1 | 2 | 3`, IDs Clase/Familia/Tipo/Unidad, valores de atributo, Nombre/Descripción y resultado de submit.
- Paso 1: cuatro `Select` React Aria en cascada: Clase, Familia, Tipo y **Unidad natural**; la Unidad se carga desde políticas del Tipo y se preselecciona la principal/seleccionada efectiva.
- Paso 2: resuelve asignaciones efectivas del Tipo, su definición y opciones; ordena por `orden`, excluye `FORBIDDEN`/`NOT_APPLICABLE`, y exige sólo `REQUIRED`.
- Paso 3: captura Nombre/Descripción, presenta resumen y crea mediante `api.createResource`.
- Al cambiar Tipo elimina valores/atributos cargados y notifica; volver sin cambiar contexto conserva el borrador de atributos.
- Evita envío duplicado, distingue un error administrativo conocido de un resultado incierto, y sólo invoca `onCreated` después de `CREATED`.

El adapter `resourcesMaster.api.ts` ya encapsula las lecturas de Clase/Familia/Tipo, políticas de unidad y atributos, así como `crearRecurso`; valida transporte `unknown` antes de React. `ResourceCreateInput` exige `claseRecursoId`, `familiaRecursoId`, `tipoRecursoId`, `unidadId`, `nombre`, `valores` y `ownership`. Se debe conservar la construcción de payload existente, incluido el mapeo actual de tipos de atributo y `ownership: { kind: 'GLOBAL' }`, salvo que una decisión posterior cambie explícitamente ese contrato.

### Shared UI, React Aria y Keyboard First

- `Button`, `Dialog`, `DialogHeading`, `DialogActions`, `Field` y `FieldSeparator` ya son las primitivas visuales compartidas pertinentes. `Dialog` envuelve el modal React Aria; la superficie actual registra su root con `registerOverlay` y usa `restoreFocusNextFrame` para restaurar opener y fallback.
- `HierarchyNavigator` es una presentación de **tres columnas** sin búsqueda ni etapas. No representa el contrato de selector terminal secuencial y no debe forzarse dentro del diálogo.
- El paquete instalado incluye `react-aria-components`; los `Select`/`ListBox`/`Popover` actuales son precedente directo. Un `ComboBox` o composición local de búsqueda + `ListBox` React Aria es la opción a validar para que filtro, flechas y confirmación permanezcan encapsulados por el control local.
- Sólo `KeyboardController.tsx` instala un listener `document` global. La nueva superficie no debe añadir otro. Debe registrar su overlay y permitir que React Aria consuma las teclas del list/combo local; el controlador global ya respeta edición/IME, `defaultPrevented`, overlay activo y `Ctrl+N` reservado.
- `AppShell.tsx` contiene atajos espaciales de la superficie principal de Recursos. El modal se porta fuera de `workspace-main`, pero el diseño debe comprobar en navegador que las flechas locales del selector y de los popovers no burbujean hacia comportamiento de pantalla.
- La familia visual actual es Light y tokenizada. `resourcesMaster.css` contiene estilos locales del selector y progreso; el diálogo nuevo debe consumir los shared components/Tailwind y tokens GARFEX, sin crear una abstracción shared para una sola experiencia especializada.

## Diseño de interacción recomendado

1. Al abrir, `ResourcesMasterScreen` construye un **snapshot inmutable de contexto heredable** desde su selección e items actuales y lo pasa al diálogo. El borrador de creación es local al diálogo: cambiarlo no debe cambiar el filtro/selección del Maestro ni la lista activa.
2. El diálogo normaliza el snapshot al prefijo válido más profundo. Sin selección inicia Clase; con Clase válida inicia Familia; con Familia válida inicia Tipo; con Tipo válida carga el siguiente requisito de creación.
3. Cada etapa de jerarquía mantiene query, cursor, filtro, item activo y selección confirmada del borrador. Su mini-filtro reduce sólo los items cargados; la continuación sigue siendo explícita, conserva padre/filtro y no inventa una búsqueda Convex que no existe.
4. `ArrowUp`/`ArrowDown` mueve el item activo del list/combo local; `Enter` confirma el item y avanza. La entrada de filtro es editable, por lo que edición/IME conserva precedencia. Si se requiere que flechas desde el input transfieran foco al listado, debe ser comportamiento nativo de React Aria o una regla local del composite, nunca un listener global.
5. El breadcrumb muestra etapas ya confirmadas. `ArrowLeft` y la activación explícita de un breadcrumb retroceden; al reemplazar Clase se limpian Familia, Tipo, Unidad y atributos; al reemplazar Familia se limpian Tipo, Unidad y atributos; al reemplazar Tipo se limpian Unidad y atributos. Volver sin reemplazar preserva lo ya escrito.
6. Los atributos se presentan secuencialmente por `orden`, con control específico para TEXTO, NUMERO, BOOLEANO u OPCION. Un opcional puede omitirse; un requerido con valor ausente recibe error cercano y foco. El review muestra sólo valores cargados, contexto y datos finales antes de crear.
7. `Escape` cierra sólo este diálogo y restaura foco al opener elegible o al fallback existente. El modal React Aria conserva su contención de Tab; fuera de él Tab sigue nativo. No se añade captura global de Tab, Enter, Escape ni flechas.

## Riesgos y mitigaciones

| Riesgo | Mitigación de diseño |
| --- | --- |
| Heredar Familia/Tipo cruzado o stale | Construir y validar el snapshot contra items actuales y relaciones padre; descartar el sufijo inválido. |
| Cascadas asíncronas fuera de orden dentro del diálogo | Cada carga debe capturar padre/tipo y token local; aplicar resultado sólo si el snapshot aún coincide. Reutilizar el patrón de `parentGatedListController` cuando encaje, sin mover lógica de dominio a shared. |
| Filtro que aparenta buscar todo el backend | Declarar que filtra items cargados y ofrecer continuación explícita; no agregar parámetro/API de búsqueda. |
| Listas grandes con foco perdido al filtrar/paginar | Mantener un único activo elegible, reajustarlo a un resultado visible y no confirmar automáticamente un cambio de filtro. Probar con lista vacía, continuación y cambio de padre. |
| `Arrow*` interfiere con inputs/IME o AppShell | React Aria/control local consume su interacción; el controlador global conserva su arbitraje. Cubrir con RTL y Playwright sobre diálogo y popover real. |
| Restauración de foco frágil | Conservar opener snapshot, `registerOverlay` y `restoreFocusNextFrame`; probar Escape y opener retirado/deshabilitado. |
| Se pierden valores o se envían valores de otro Tipo | Conservar borrador al retroceder; limpiar Unidad/atributos atómicamente al cambiar su padre; bloquear review/submit mientras la carga vigente no esté lista. |
| Opcionales tratados como obligatorios | Mantener `aplicabilidad === 'REQUIRED'` como único bloqueo; omitir valores vacíos del payload como hoy. |
| Cambio visual aislado o tokens arbitrarios | Usar `Dialog`/`Button`/`Field`, tokens Light y Tailwind; no promover selector staged sin segundo consumidor con el mismo contrato. |
| Regresión del refresco de lista | Mantener `onCreated → refetchActive` sólo tras resultado confirmado y ampliar la prueba de aislamiento de query activa. |

## Archivos probables

| Archivo | Cambio esperado |
| --- | --- |
| `src/features/resources-master/ResourcesMasterScreen.tsx` | Derivar y pasar el snapshot heredable validado, sin trasladar el estado del diálogo a la pantalla. |
| `src/features/resources-master/CrearRecursoSurface.tsx` | Reemplazo principal: máquina de etapas/borrador local, selector terminal, breadcrumbs, atributos uno a uno, revisión, resets y foco. |
| `src/features/resources-master/resourcesMaster.css` | Retirar/adaptar estilos locales que ya no correspondan; no introducir CSS equivalente a componentes shared cuando Tailwind/tokens los cubran. |
| `src/features/resources-master/resourcesMaster.types.ts` | Sólo si hace falta declarar el tipo interno/prop de snapshot; no alterar DTOs ni payload público. |
| `src/features/resources-master/useResourcesHierarchy.ts` | Posible ajuste mínimo sólo si la pantalla necesita exponer selección con referencias validadas; no es obligatorio si la pantalla deriva el snapshot de sus estados actuales. |
| `src/shared/ui/{Button,Dialog,Field}.tsx` | Reuso, no cambio previsto salvo que una necesidad de contrato realmente común aparezca. |
| `src/shared/keyboard/**`, `src/app/shell/AppShell.tsx` | No cambio previsto; son restricciones y superficies de regresión. |
| `tests/unit/crearRecursoSurface.test.tsx` | Revisar/expandir el contrato del prototipo: etapas compactas, validación y foco; añadir herencia, selector local, filtros, flechas/Enter/Left/Escape, cascadas y payload. |
| `tests/unit/resourcesMasterScreen.test.tsx` | Cubrir derivación y entrega del contexto inicial sin alterar filtro/lista del Maestro. |
| `tests/unit/resourcesMasterScreenRefetch.test.tsx` | Conservar y adaptar el callback de creación confirmada si cambia la forma de props. |
| `tests/e2e/resourcesMaster.workstation.spec.ts` | Añadir flujo sin mouse, herencia desde la jerarquía, foco/restauración y refresco de la lista activa a 1440×980; conservar axe. |
| `tests/architecture/{keyboardBoundaries,queryZodBoundaries}.test.ts` | Regresión obligatoria; sólo se modifica si una nueva importación aprobada exige una guardia explícita. |

## Evidencia de pruebas actual

El commit prototipo indicado (`7c42860`) es evidencia existente, no autorización de diseño. El árbol actual ya contiene cobertura de `CrearRecursoSurface` para progreso semántico de tres pasos, primer campo requerido y foco, cascada Clase→Familia→Tipo→Unidad, atributos efectivos/ordenados, limpieza al cambiar Tipo, Escape/restauración, payload, submit único y resultado incierto. Esta cobertura debe conservarse o sustituirse por pruebas equivalentes del nuevo contrato; no debe considerarse cierre del cambio.

La cobertura de `ResourcesMasterScreen` y Playwright ya confirma jerarquía visible, filtro efectivo más profundo, continuación/retry y que `onCreated` refresca sólo la query activa. El nuevo diseño no debe romper esas garantías.

## Decisiones resueltas

1. El alcance es exclusivamente crear Recursos; Catálogo y sus contratos no se editan.
2. Clase, Familia y Tipo son etapas separadas; Tipo permanece visible y requerido.
3. La herencia usa el contexto seleccionado del Maestro, salta etapas ya válidas y sigue siendo reversible dentro del diálogo.
4. La navegación por teclado, el filtro, Escape y revisión final son requisitos de producto, no mejoras opcionales.
5. Backend/Convex, payload, adaptadores feature-locales, React Query de lista y refresco post-creación se preservan.
6. Los componentes compartidos y el único límite global de Keyboard Controller se reutilizan; el comportamiento de lista/combo es local y encapsulado.

## Preguntas genuinamente abiertas antes de design/apply

1. El payload actual exige `unidadId`, pero la secuencia confirmada nombra sólo Clase→Familia→Tipo→atributos→revisión. ¿Unidad natural permanece como etapa/contexto obligatorio, se preselecciona sólo cuando existe una política principal, o la definición de “atributos” pretende incluirla? No debe omitirse ni inventarse un valor.
2. Las API jerárquicas no exponen búsqueda. ¿El mini-filtro debe buscar por `nombre`, por `clave` y `nombre`, y se acepta explícitamente que sólo filtre páginas ya cargadas con «Cargar más» para ampliar resultados?
3. Al modificar un contexto heredado dentro del diálogo, ¿debe quedar aislado del selector/filtro del Maestro (recomendado) o sincronizarse de vuelta a la pantalla? La sincronización no está solicitada y cambiaría el contexto de lista.
4. Al abrir con un Tipo heredado válido, ¿la Unidad se debe resolver antes de atributos como hoy, o hay una política de Unidad ya confirmada que permite avanzar sin una selección visible? La evidencia actual sólo permite la primera alternativa.

## Entrega y review

El cambio probablemente supera 400 líneas por el reemplazo de una superficie de más de mil líneas y la matriz RTL/Playwright. Con `chain_strategy: feature-branch-chain` y `delivery_strategy: ask-on-risk`, se recomienda tratar el riesgo como **alto** y solicitar confirmación antes de apply si la estimación refinada sigue excediendo el presupuesto.

Cortes cohesivos preliminares, sin crear ramas/PRs en esta fase:

```text
tracker (draft/no merge)
└─ PR 1: snapshot heredable + selector jerárquico staged + pruebas de cascada/teclado
   └─ PR 2: Unidad/atributos/revisión/payload + pruebas de estado y foco
      └─ PR 3: recorrido Playwright/axe y regresiones de refresco aislado
```

Cada corte debe llevar sus propias pruebas y permanecer bajo el límite de revisión; si un corte cohesivo no cabe tras una sola división honesta, se debe elevar `size:exception` en vez de comprimir código o separar pruebas de lo que verifican.

## Readiness

- **Propuesta/spec:** procedente después de resolver las cuatro preguntas de producto/contrato anteriores.
- **Design:** puede definir la máquina de etapas y el detalle React Aria una vez que Unidad y semántica del filtro estén confirmadas.
- **Apply:** bloqueado por esas decisiones y por TDD RED antes de cambios runtime.
- **Rollback:** feature-local: revertir `CrearRecursoSurface` y la prop de snapshot, preservando adapter, backend, lista activa, Catálogo y cambios no relacionados.

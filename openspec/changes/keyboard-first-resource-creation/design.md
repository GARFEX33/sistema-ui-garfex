# Diseño — Creación de recursos Keyboard First

## Autoridad y guía de revisión

Este archivo es la autoridad de arquitectura, alcance, invariantes, migración y límites de la propuesta aprobada para `keyboard-first-resource-creation`. Los contratos mecánicos verificables —tipos y transiciones de estado, algoritmos de loader, propiedad de teclado, contratos de componentes, matriz de pruebas y detalle de la cadena— están en [design-details.md](./design-details.md). Ambos artefactos son entradas requeridas para apply.

### Índice de decisiones detalladas

| Decisión                                       | Detalle normativo                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Snapshot inicial tipado y propiedad del estado | [§1](./design-details.md#1-snapshot-inicial-tipado-y-propiedad-del-estado) |
| Máquina local de etapas                        | [§2](./design-details.md#2-máquina-local-de-etapas)                        |
| Cargas paginadas y rechazo stale               | [§3](./design-details.md#3-cargas-paginadas-acumulación-y-rechazo-stale)   |
| Selector staged feature-local                  | [§4](./design-details.md#4-selector-staged-feature-local)                  |
| Propiedad de teclado y foco                    | [§5](./design-details.md#5-propiedad-exacta-de-teclado-y-foco)             |
| Unidad natural desde políticas efectivas       | [§6](./design-details.md#6-unidad-natural-desde-políticas-efectivas)       |
| Resolución secuencial de atributos             | [§7](./design-details.md#7-resolución-y-recorrido-secuencial-de-atributos) |
| Datos, revisión, payload y resultados          | [esta sección](#datos-del-recurso-revisión-payload-y-resultados)           |
| Estados visibles y accesibles                  | [esta sección](#estados-visibles-y-accesibles)                             |

## Estado y alcance

La modificación queda limitada a `src/features/resources-master`, su composición desde `ResourcesMasterScreen` y las pruebas que verifican esa capacidad. No modifica Catálogo, backend/Convex, DTOs o endpoints públicos, dependencias, React Query global, rutas, URL, estado global, `KeyboardController`, AppShell, Pi/Gentle ni contratos de payload.

El árbol actual corresponde al prototipo alcanzado por `7c42860`: `CrearRecursoSurface.tsx` contiene una superficie de más de 1100 líneas con formulario de tres pasos, loaders de una página, payload y manejo de resultados. Se conservará su evidencia observable válida, pero no su forma monolítica ni la preselección implícita de Unidad.

## Evidencia de repositorio que condiciona la arquitectura

- `ResourcesMasterScreen.tsx` posee la selección y los items cargados de Clase, Familia y Tipo mediante `useResourcesHierarchy(api)`; el diálogo recibe hoy sólo `api` y `onCreated`.
- `useResourcesHierarchy.ts` y `parentGatedListController.ts` ya demuestran paginación explícita, acumulación, deduplicación y rechazo por token de respuestas de un padre anterior.
- `resourcesMaster.api.ts` valida transporte antes de React y ya expone todas las operaciones necesarias. Los listados aceptan `cursor` y `pageSize`; las políticas reciben el Tipo tanto como `tipoRecursoId` como `paraTipoRecursoId` a través del adapter existente.
- `ResourceCreateInput` exige Clase, Familia, Tipo, Unidad, Nombre, valores y ownership. El mapeo actual transporta `OPCION` con `opcionAtributoId` y nombre, `BOOLEANO` como boolean, `NUMERO` como number y `TEXTO` como string.
- `Dialog`, `Button` y `Field` son las primitivas visuales compartidas aprobadas. `Dialog` aporta modal y contención de foco React Aria; la superficie registra el overlay y restaura el foco mediante las utilidades existentes.
- `HierarchyNavigator` representa tres columnas y no coincide con un selector secuencial con filtro. No se reutilizará ni se modificará.
- `KeyboardController.tsx` es el único listener global de `keydown` y ya cede ante overlays, edición, IME y `defaultPrevented`.
- `resourcesMasterScreenRefetch.test.tsx` comprueba que `onCreated → refetchActive()` relee sólo la identidad observada. Ese contrato no se reemplaza por invalidación o escritura de cache.
- `crearRecursoSurface.test.tsx` caracteriza payload, validación/foco, reset por Tipo, submit único, error administrativo, incertidumbre y restauración de foco. Las pruebas nuevas sustituyen la semántica de tres pasos por etapas sin perder esas garantías.

## Invariantes de arquitectura

- La pantalla entrega al diálogo un snapshot de sólo lectura; nunca setters de jerarquía, criterios de lista ni setters de búsqueda. Por construcción, el borrador no cambia el filtro ni la consulta del fondo.
- El borrador, la navegación y el submit son locales al diálogo; no pertenecen a React Query ni a un store global.
- La confirmación es explícita: filtrar, enfocar o preferir un candidato no cambia el borrador.
- Toda adopción asíncrona dependiente se protege contra contexto stale; el filtro local nunca agrega parámetros al adapter ni dispara requests.
- Una sola proyección pura construye el payload para review y submit. Tras `CREATED`, y sólo entonces, `onCreated` ejecuta `refetchActive()` para la identidad observada.
- No se agrega listener global de teclado: React Aria, el diálogo y handlers locales guardados preservan IME, edición y `defaultPrevented`.
- La capacidad se divide en seams feature-locales; ningún archivo nuevo supera 500 líneas y el shell queda aproximadamente entre 250 y 350 líneas.

## Límites de componentes y archivos

La superficie final no debe sustituir un archivo de 1100 líneas por otro monolito.

| Archivo                                                     | Responsabilidad                                                                     | Cambio                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/resources-master/ResourcesMasterScreen.tsx`   | Derivar snapshot desde selección/items y conservar `refetchActive`                  | modificación pequeña                                                 |
| `src/features/resources-master/resourceCreation.model.ts`   | tipos locales, normalización, reducer, navegación, validación y payload/review puro | nuevo                                                                |
| `src/features/resources-master/resourceCreation.loaders.ts` | loader dependiente, resolución de políticas/Unidad y atributos paginados            | nuevo                                                                |
| `src/features/resources-master/useResourceCreationFlow.ts`  | instancias de controladores, efectos por etapa/token y comandos al reducer          | nuevo                                                                |
| `src/features/resources-master/StagedSearchSelector.tsx`    | SearchField/ListBox local, filtro, candidato provisional, retry y Cargar más        | nuevo                                                                |
| `src/features/resources-master/ResourceAttributeStage.tsx`  | control tipado de un único atributo y Omitir                                        | nuevo                                                                |
| `src/features/resources-master/ResourceCreationDetails.tsx` | Datos, Review y Result como presentaciones pequeñas sobre contratos tipados         | nuevo                                                                |
| `src/features/resources-master/CrearRecursoSurface.tsx`     | trigger, Dialog, breadcrumb, foco, teclado de etapa y composición                   | reemplazo gradual                                                    |
| `src/features/resources-master/resourcesMaster.css`         | clases del prototipo                                                                | eliminar cuando no queden consumidores; lo nuevo usa Tailwind/tokens |
| `src/shared/ui/*`                                           | primitivas existentes                                                               | reuso, sin cambio previsto                                           |
| `src/shared/keyboard/*`, `src/app/shell/*`                  | arbitraje global                                                                    | sin cambio runtime                                                   |

No se modifica `resourcesMaster.api.ts` ni `resourcesMaster.types.ts` salvo que TypeScript obligue a exportar un alias ya existente; el diseño no requiere ese cambio. Los tipos de snapshot/modelo permanecen fuera de los DTOs públicos.

## Flujo de datos

```text
useResourcesHierarchy selection + loaded items
        │ deriveInitialHierarchySnapshot (screen, read-only)
        ▼
CrearRecursoSurface.open()
        │ normalize valid prefix + OPEN reducer event
        ▼
local CreationDraft/CreationStage
        │
        ├─ hierarchy controllers ── existing ResourcesMasterApi list methods
        ├─ unit loader ──────────── listUnitPolicies pages → getUnit hydration
        └─ attribute resolver ───── assignment pages → definitions → option pages
        │                    (all guarded by context token)
        ▼
Staged selectors / one Attribute / Resource Data
        │ explicit confirm or omit
        ▼
buildResourceCreateInput(draft) ── same projection feeds Review and submit
        │
        ▼
api.createResource
        ├─ CREATED ── result success ── onCreated ── refetchActive only
        ├─ known admin error ────────── review + manual retry
        └─ unknown result ───────────── uncertain; no refresh/no identical retry
```

## Datos del Recurso, revisión, payload y resultados

Datos del Recurso es una etapa propia antes de Revisión. Conserva la semántica actual:

- `nombre.trim()` es obligatorio;
- `descripcion.trim()` vacía se omite;
- no se agregan campos ni normalizaciones.

`buildResourceCreateInput(draft)` será una función pura y será la única fuente tanto del review como de `api.createResource`. El review proyecta ese objeto junto con las etiquetas ya hidratadas; no reconstruye una segunda versión. Los opcionales omitidos o raw vacíos no aparecen.

El payload mantiene exactamente:

```ts
{
  claseRecursoId,
  familiaRecursoId,
  tipoRecursoId,
  unidadId,
  nombre,
  descripcion?,
  valores,
  ownership: { kind: 'GLOBAL' }
}
```

**Crear recurso** está deshabilitado si el borrador no es válido, una carga del Tipo sigue pendiente/fallida, `submit.status === 'submitting'` o una incertidumbre bloquea esa misma revisión. `SUBMIT_STARTED` captura `draft.revision`; activaciones posteriores no vuelven a llamar la API.

- `CREATED`: guarda el resumen, pasa a Resultado exitoso e invoca `onCreated` exactamente una vez.
- error administrativo reconocido: permanece en Revisión, conserva borrador y permite retry manual.
- error no reconocido: pasa a Resultado incierto, no llama `onCreated` y no muestra un retry de la misma escritura. Guarda `blockedRevision`; **Volver** permite corregir, pero Crear permanece bloqueado hasta que una mutación real incremente `draft.revision`. También ofrece **Cerrar y buscar en el listado**.

La pantalla conserva `onCreated={() => void refetchActive()}`. No se insertan recursos optimistas, no se usa `setQueryData`, no se invalida y no se releen otras identidades.

## Estados visibles y accesibles

| Estado           | Presentación y capacidad                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading inicial  | `role=status`, selector/avance deshabilitado, foco permanece en heading o filtro cuando exista                                                       |
| loading-more     | conserva candidatos/filtro/activo; botón de continuación deshabilitado                                                                               |
| vacío filtrado   | explica que sólo se filtraron elementos cargados; permite cargar más si existe cursor                                                                |
| vacío exhaustivo | `role=status`, no hay confirmación; Unidad/required option bloquean; cero atributos permite Datos                                                    |
| initial-error    | `role=alert`, sin detalle privado, retry explícito                                                                                                   |
| partial-error    | conserva datos ya cargados, `role=alert`, retry del mismo cursor; en hidratación de Unidad bloquea confirmación hasta completar                      |
| required-error   | mensaje cercano, `aria-invalid`, `aria-describedby`, foco al control                                                                                 |
| submitting       | acción disabled y estado «Creando recurso…»; cierre puede mantenerse disponible sólo si el contrato actual del Dialog lo permite sin duplicar submit |
| known-error      | alerta recuperable en Revisión, borrador intacto                                                                                                     |
| success          | Resultado con ID, identidad y estado; acciones Crear otro/Cerrar                                                                                     |
| uncertain        | alerta terminal sin éxito/refetch ni retry idéntico; corregir exige cambiar el borrador                                                              |

Se usarán tokens Light existentes y Tailwind. Los estados de error seguirán el precedente de texto secundario + semántica ARIA; no se inventa un color/error token. Candidatos cubren hover, foco visible, provisional activo y disabled con tokens `surface`, `surface-subtle`, `primary-subtle`, `border`, `focus` y texto semántico. No se agregan hex ni componentes shared por una sola ocurrencia. Dark y un rediseño responsive/touch siguen fuera de alcance; el Dialog mantiene su límite de viewport existente.

## Ambigüedades resueltas sin cambiar decisiones de producto

1. **Cero atributos aplicables:** una resolución completa y vacía no es error y permite pasar a Datos; pending o error no permite hacerlo. Esto sigue el escenario aprobado que permite continuar cuando el contexto vigente no tiene requisitos pendientes.
2. **`CONDITIONAL`:** se trata como no requerido para este flujo porque la especificación confirma que sólo `REQUIRED` bloquea y que todo no requerido ofrece **Omitir**. No se inventa evaluación frontend de condiciones.
3. **Filtro y acentos:** el filtro es substring case-insensitive en español sobre `nombre` y conserva diacríticos; no se amplía a clave/símbolo ni backend.
4. **Unidad con más páginas:** una continuación disponible no vuelve inelegible una candidata ya hidratada; una request/hidratación pendiente o fallida sí bloquea. La continuación sigue siendo explícita.
5. **Unidad nula versus fallida:** `null`/inactiva/no efectiva se excluye como referencia confirmadamente no elegible; un rechazo de transporte es recuperable y bloquea hasta retry. Nunca se muestra el ID como Unidad inventada.
6. **Retroceso desde inputs:** `ArrowLeft` conserva edición en inputs. La vuelta con esa tecla opera al enfocar lista, breadcrumb u otro control no editable; Tab/Shift+Tab siguen disponibles. Esto aplica la precedencia IME/edición confirmada.
7. **Resultado incierto:** se permite volver para corregir como en la evidencia del prototipo, pero la misma revisión no puede reenviarse; sólo una mutación del borrador desbloquea una escritura nueva.
8. **Orden de atributos paginados:** se completan todas las páginas antes de mostrar la secuencia, porque mostrar una página y luego insertar un atributo anterior por `orden` rompería preservación y review.

## Estrategia de migración desde `7c42860`

1. Convertir primero el comportamiento vigente que se conserva en pruebas de caracterización: payload, error conocido, incertidumbre, submit único, overlay y restauración.
2. Introducir snapshot/modelo/reducer y loaders como seams puros probados antes de conectarlos. No hacer cherry-pick ni revert total del prototipo.
3. Sustituir en el archivo existente una región observable por vez: Contexto, Unidad, atributos, Datos/Revisión y Resultado. Cada sustitución elimina el estado/JSX antiguo en el mismo work unit; no queda una segunda superficie seleccionable ni un feature flag global.
4. Mantener el adapter, `onCreated`, trigger `N`, Dialog y utilidades de foco durante toda la migración.
5. Retirar las aserciones de «Paso 1/2/3» sólo en el mismo slice que agrega aserciones de ruta/etapa equivalentes.
6. Eliminar `resourcesMaster.css` sólo después de retirar su último class hook y comprobar que no está importado. No mover esos estilos a shared.
7. La cadena debe compilar y pasar sus pruebas enfocadas después de cada child PR. Si una extracción temporal no entrega comportamiento visible, su contrato puro probado constituye el work unit y permanece sólo en la feature.

## Rollback y despliegue

No hay migración de datos, persistencia frontend ni coordinación backend. El despliegue es el bundle frontend normal y no requiere flag.

Rollback final:

1. restaurar la implementación de `CrearRecursoSurface` anterior a la cadena;
2. retirar `initialHierarchySnapshot` y su helper de `ResourcesMasterScreen`;
3. retirar los archivos feature-locales y pruebas exclusivas del recorrido staged;
4. conservar `resourcesMaster.api.ts`, DTOs/payload, `useResourcesMasterListQuery`, `refetchActive`, Catálogo, shared UI, Keyboard Controller y especificaciones canónicas.

En una cadena parcialmente integrada se revierte desde el último child hacia su padre. Cada child tiene el límite de rollback de la tabla de [detalle de cadena](./design-details.md#9-entrega-en-feature-branch-chain-y-presupuesto) y no debe mezclar cambios externos, de modo que no hay que revertir Catálogo ni consultas de Recursos.

## Riesgos residuales y controles

| Riesgo                                                        | Control de diseño                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| IDs opacos comparados de forma inconsistente                  | helper único `resourceIdKey` en model/loader/selector                              |
| Respuesta de Tipo anterior adopta Unidad/atributos            | token + contextKey + cursor en toda adopción, reset antes de request               |
| Filtro parece global                                          | copy explícito, cero parámetros de búsqueda, continuación manual                   |
| Active provisional se confunde con confirmado                 | estado separado, `onSelectionChange` no toca draft, sólo `onAction` confirma       |
| Unidad parcialmente hidratada permite una decisión incompleta | fallos pendientes bloquean; null/no efectiva se excluye explícitamente             |
| Orden de atributos cambia al llegar otra página               | resolver todas las páginas antes de construir etapas                               |
| Resultado incierto se reenvía                                 | `blockedRevision` hasta una mutación real                                          |
| Flechas/Enter compiten con edición o AppShell                 | React Aria local, guards IME/defaultPrevented, overlay, cero listener global nuevo |
| Nuevo monolito                                                | límites de archivo, presenters enfocados y guard arquitectónico                    |
| PR supera 400 líneas por retirar el prototipo                 | sustitución por regiones, medición `additions + deletions`, stop bajo ask-on-risk  |

## Criterio de cierre de diseño

El diseño queda listo para `sdd-tasks`/apply cuando se mantengan estas invariantes: snapshot sólo lectura y normalizado; borrador local; etapas explícitas hasta Resultado; selector local React Aria; paginación/dedupe/stale guard; Unidad desde políticas + detalle; atributos secuenciales con omisión; una sola construcción de payload; refetch activo sólo tras `CREATED`; todos los estados y foco verificables; ningún cambio fuera del alcance confirmado.

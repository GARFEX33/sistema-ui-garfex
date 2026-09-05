# Propuesta — Adopción acotada de React Query y Zod

## Estado

`proposed`

La dirección de producto está confirmada y la exploración del repositorio aporta evidencia suficiente para esta propuesta. No se selecciona investigación externa porque no queda una decisión de producto abierta que la requiera.

`@tanstack/react-query@5.102.8` y `zod@4.5.4` ya están instaladas como dependencias directas exactas y resueltas en `pnpm-lock.yaml`. La instalación es un prerrequisito completado, no trabajo pendiente de este cambio.

## Problema

La lista de Maestro de recursos administra hoy carga, error, paginación, descarte de respuestas obsoletas y deduplicación mediante maquinaria remota manual, mientras su adapter valida respuestas `unknown` con parsers imperativos extensos. Ese enfoque funciona, pero duplica responsabilidades de estado de servidor y hace verbosa la frontera de transporte, aumentando el coste de mantener comportamientos consistentes y de extender su cobertura.

La ausencia de una regla acotada también deja dos riesgos opuestos: continuar replicando controladores manuales para cada lectura remota o adoptar una solución global que absorba estado local, URL, teclado y reglas de dominio que no le pertenecen.

## Intención y resultado de producto

Adoptar gradualmente:

- React Query para cache, carga, error y paginación de estado remoto/de servidor;
- Zod para validar en runtime DTOs recibidos como `unknown` en la frontera de transporte.

El primer resultado observable se limita a la lista y búsqueda paginada de Maestro de recursos. Después del cambio, esa lectura consumirá DTOs validados por Zod y delegará en un hook `useInfiniteQuery` feature-local la propiedad de sus páginas remotas y estados asíncronos, preservando el comportamiento actual de búsqueda, filtros, continuación, errores y datos parciales.

Esta adopción no redefine al frontend como autoridad de datos. Convex externo continúa siendo autoridad de datos, permisos, validación efectiva y persistencia, y permanece accesible sólo mediante los adapters existentes.

## Decisiones de arquitectura confirmadas

- React Query se usa exclusivamente para estado remoto/de servidor autorizado.
- Zod valida respuestas de transporte `unknown`; no sustituye reglas de negocio ni se introduce como validación de formularios en este corte.
- Los componentes conservan borradores, overlays, selección efímera, texto de búsqueda, debounce y foco.
- TanStack Router conserva la propiedad de ruta y estado URL.
- `KeyboardControllerProvider`, su registry y `useSyncExternalStore` conservan la propiedad del teclado.
- No se incorpora Zustand, Redux ni otro store global.
- No se añade backend, cliente Convex transversal, repositorio, gateway, facade ni wrapper Query genérico.
- La cache es sólo de memoria de sesión: no hay persistencia, broadcast, offline support, SSR ni hydration.
- La organización sigue siendo feature-first; el piloto y sus schemas permanecen privados de Maestro de recursos mientras no exista un segundo consumidor con el mismo contrato.

## Alcance

### 1. Provider transversal mínimo

- Incorporar un `QueryClientProvider` en `AppProviders`, conservando el árbol de Router existente.
- Crear un `QueryClient` estable por montaje del provider.
- Mantener el provider libre de imports de Convex y de dominio.
- No añadir singleton de módulo, devtools, persistencia, integración Router-query ni defaults globales que anticipen políticas de reintento o refetch.

### 2. Zod en la respuesta de lista de Recursos

- Sustituir por schemas Zod únicamente la validación de `ResourceSummary`, `classificationStatus` y la envolvente paginada de la lista principal de Recursos.
- Mantener las funciones parser exportadas como seam de prueba y conservar los DTOs públicos actuales.
- Rechazar respuestas inválidas antes de React con el error genérico existente y sin exponer payload crudo.
- Mantener IDs y valores opacos con su semántica actual; no convertirlos a string ni inventar tipos Convex.
- Mantener los tres literales existentes de `classificationStatus.state` y exigir strings en `reasons`.
- Conservar ausencia y opcionalidad sin coerción, trim, defaults ni inferencias de negocio.
- Continuar ignorando campos adicionales que no forman parte del DTO público.

### 3. Piloto `useInfiniteQuery` para lista y búsqueda

- Crear un hook privado de Maestro de recursos basado en `useInfiniteQuery`.
- Hacer que su query function llame exclusivamente al `ResourcesMasterApi` existente y reciba DTOs ya validados, sin conocer Convex.
- Definir una query key estable que incluya el namespace de Recursos, el texto de búsqueda normalizado conforme al comportamiento existente y el filtro jerárquico efectivo más profundo.
- Excluir de la key instancias de API, callbacks y objetos de UI irrelevantes.
- Conservar `initialPageParam`, cursores, `isDone`, flatten y deduplicación de la lista actual.
- Solicitar una página adicional sólo mediante la CTA existente.
- Mantener localmente el input, el debounce de 250 ms, la selección y el foco.
- Fijar en el piloto opciones explícitas que eviten refetch por foco de ventana y que no amplíen silenciosamente el reintento automático observable.
- Preservar copy, accesibilidad y comportamiento de loading, vacío confirmado, error inicial, error parcial, retry y «Cargar más…».
- Conservar páginas válidas visibles cuando falle una continuación.
- Tras una creación exitosa, permitir el refetch explícito de la lista activa sin migrar la creación a `useMutation`, insertar optimistamente ni editar manualmente la cache.

### 4. Evidencia y especificaciones

- Mantener o ampliar pruebas de equivalencia de DTOs y rechazo de envelopes inválidos sin probar internals de Zod.
- Probar el hook y la pantalla con un `QueryClient` aislado por caso para evitar contaminación de cache.
- Conservar las regresiones actuales de lista, búsqueda, filtro profundo, continuación, datos parciales, error, retry, shell, Router y teclado.
- Mantener intactas las guardas arquitectónicas de Catálogo y añadir límites que permitan Query sólo en la superficie aprobada, prohíban persistencia y stores globales, y mantengan Convex fuera de `app/**`.
- Actualizar `frontend-foundation` mediante un delta explícito y estrecho que sustituya la prohibición absoluta de una capa Query por el uso autorizado de React Query para estado remoto feature-local.
- Definir la capacidad observable del piloto de lista de Recursos sin ampliar Catálogo, jerarquía, formularios ni mutaciones.

## Propiedad de estado después del piloto

| Estado | Propietario | Límite |
|---|---|---|
| Páginas remotas de lista/búsqueda de Recursos | React Query bajo una key feature-local | Cache en memoria; no es autoridad de dominio. |
| Selección Clase/Familia/Tipo y resets | `useResourcesHierarchy` y controladores actuales | Permanece local y fuera del piloto Query. |
| Texto de búsqueda, debounce y foco | `ResourcesMasterScreen` | Conserva comportamiento y contrato de teclado. |
| Borrador, paso, overlay y envío de Nuevo recurso | `CrearRecursoSurface` | No se cachea ni migra a `useMutation`. |
| Ruta y estado URL | TanStack Router | Sin loaders, search params ni sincronización nueva. |
| Comandos y snapshots de teclado | Keyboard Context y `useSyncExternalStore` | Sin cambios de listeners ni arbitraje. |
| Datos, permisos, validación efectiva y persistencia | Convex externo | Acceso sólo mediante adapters feature-locales. |

## No objetivos

- Migrar Catálogo o sus atributos a React Query o Zod.
- Migrar la selección jerárquica de Recursos, sus resets o sus páginas dependientes.
- Migrar formularios, borradores, overlays, detalle, unidades, atributos o submit de Nuevo recurso.
- Introducir `useMutation`, optimistic updates, edición manual de cache o invalidación amplia.
- Mover estado local, URL o teclado a React Query.
- Añadir Zustand, Redux, context de datos de dominio u otro store global.
- Añadir persistencia de cache, devtools, broadcast, offline support, SSR, hydration o sincronización en tiempo real.
- Crear backend, modificar Convex o acceder a Convex fuera de los adapters existentes.
- Crear repositorios, casos de uso, gateways, facades, wrappers Query compartidos o una capa de dominio transversal.
- Reescribir todos los parsers del adapter de Recursos.
- Cambiar rutas, layout, copy, estilos visuales, responsive, artefactos OpenPencil o fixtures runtime.
- Modificar autenticación o usuarios.

## Capacidades y deltas de especificación

### Delta: `frontend-foundation`

La restricción histórica que prohíbe toda capa de estado de consultas se ajustará de forma explícita para permitir:

- un único `QueryClientProvider` de infraestructura mínima;
- React Query como propietario de estado remoto/de servidor únicamente en pilotos autorizados y feature-locales;
- cache efímera sin autoridad de dominio ni persistencia.

El delta mantendrá las prohibiciones de stores globales, backend propio, persistencia, autoridad de datos, infraestructura preventiva y abstracciones compartidas sin consumidores reales.

### Capacidad acotada: lista remota de Maestro de recursos

La especificación del cambio definirá en términos observables:

- validación runtime de la respuesta de lista antes de llegar a React;
- búsqueda con el debounce existente;
- filtro por el contexto jerárquico efectivo existente;
- carga inicial, vacío, error inicial, retry, continuación y error parcial;
- conservación de páginas válidas durante fallos de continuación;
- refetch explícito de la lista activa tras una creación confirmada;
- ausencia de refetch por foco y de nuevas llamadas automáticas no autorizadas.

Esta capacidad no autoriza Query para Catálogo, jerarquía, formularios, teclado, URL ni mutaciones.

## Áreas afectadas

Se prevé impacto limitado en:

- `src/app/providers/AppProviders.tsx` para el provider mínimo;
- el adapter privado `resourcesMaster.api.ts` o un módulo schema privado contiguo;
- un nuevo hook privado de lista dentro de `src/features/resources-master/`;
- `ResourcesMasterScreen.tsx` para consumir el piloto sin rediseño;
- pruebas unitarias del adapter, hook, pantalla y composición de providers;
- pruebas E2E y de arquitectura relacionadas con Recursos y sus límites;
- las especificaciones OpenSpec de `frontend-foundation` y de la lista de Maestro de recursos.

No se prevén cambios en `src/main.tsx`, rutas, `routeTree.gen.ts`, `src/shared/keyboard/**`, `src/shared/hierarchy/**`, Catálogo, backend Convex, estilos ni artefactos visuales.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Los defaults de Query cambian cantidad de llamadas o estados observables | Refetch o retry inesperado para el usuario | Configurar explícitamente el piloto, sin política global, y cubrir foco, retry y continuación con pruebas. |
| Zod altera aceptación o proyección del DTO | Datos válidos rechazados o semántica inventada | Migrar sólo el grupo de lista, conservar parsers y DTOs, y probar equivalencia sin coerciones. |
| Un fallo de continuación borra páginas válidas | Pérdida visual de información ya cargada | Mantener páginas cacheadas y representar el error parcial con el comportamiento existente. |
| La query key es inestable por IDs opacos | Cache duplicada, colisiones o lecturas incorrectas | Usar sólo parámetros efectivos y valores reales admitidos, sin incluir API, callbacks ni objetos de UI. |
| Cache compartida contamina pruebas | Falsos positivos o resultados dependientes del orden | Crear un `QueryClient` fresco por render/caso y desactivar retries de test cuando corresponda. |
| Query se convierte en store global | Doble propiedad de selección, teclado, URL o formularios | Limitar normativamente el uso a estado remoto feature-local y reforzarlo con guardas arquitectónicas. |
| El provider introduce Convex en infraestructura transversal | Ruptura de la frontera feature-first | Mantener `AppProviders` limitado a React Query y conservar todo transporte en adapters existentes. |
| El alcance crece hacia Catálogo, jerarquía o mutaciones | Mayor riesgo y carga de revisión | Mantener esos consumidores y guardas sin cambios; exigir cortes y decisiones posteriores independientes. |
| El refetch tras crear diverge del resultado real | Lista desactualizada o autoridad ficticia del cliente | Refetchear sólo después de éxito confirmado y no aplicar optimistic update ni inferir éxito ante resultado incierto. |

## Rollout y rollback

El rollout se divide en tres cortes verificables y reversibles:

1. provider mínimo sin consumidores ni cambio de comportamiento;
2. schemas Zod para la respuesta de lista, conservando el contrato público del adapter;
3. hook `useInfiniteQuery` y wiring exclusivo de lista/búsqueda.

Si el provider causa una regresión de composición, se retira su wrapper y se restaura `AppProviders`; no existen datos persistidos que migrar. Si la validación diverge, se restauran sólo los parsers manuales de lista manteniendo adapter, transporte y DTOs. Si el piloto Query no conserva el comportamiento, se retira el hook y la pantalla vuelve al controlador de lista existente, que permanece disponible y cubierto durante este cambio.

Las dependencias ya instaladas pueden permanecer inertes durante un rollback parcial. Su eventual retirada sería una decisión de limpieza separada del restablecimiento funcional y nunca requiere rollback de datos o backend.

El rollback no toca selección jerárquica, formulario, URL, teclado, Catálogo, Convex ni datos creados correctamente en el backend.

## Criterios de éxito

El cambio es exitoso cuando:

1. `AppProviders` monta un `QueryClientProvider` con un cliente estable por montaje, sin importar Convex ni dominio y sin persistencia o defaults globales especulativos.
2. Las respuestas válidas de la lista de Recursos producen los mismos DTOs públicos mediante Zod que mediante el contrato anterior.
3. Las respuestas inválidas se rechazan antes de React con el error genérico existente, sin exponer payload crudo, coercionar datos ni inventar defaults.
4. La lista y búsqueda de Maestro de recursos usan un hook feature-local `useInfiniteQuery` que llama al adapter existente.
5. La query key distingue correctamente búsqueda y filtro jerárquico efectivo sin incluir instancias de API, callbacks u objetos irrelevantes.
6. El debounce de 250 ms, los filtros efectivos, la CTA de continuación, el flatten, la deduplicación y `isDone` conservan su comportamiento observable.
7. Loading, vacío confirmado, error inicial, retry, error parcial y «Cargar más…» mantienen copy, accesibilidad y comportamiento, y las páginas válidas no desaparecen ante un fallo de continuación.
8. El piloto no hace refetch por foco de ventana ni amplía silenciosamente los reintentos o llamadas automáticas respecto del contrato aprobado.
9. Una creación confirmada puede refrescar la lista activa sin `useMutation`, optimistic updates, edición manual de cache ni invalidación amplia.
10. Selección jerárquica, formularios, borradores, overlays, foco, teclado, URL, Catálogo y backend permanecen bajo sus propietarios actuales.
11. No se incorporan Zustand, Redux, persistencia de cache, backend frontend, cliente Convex transversal ni abstracciones Query compartidas.
12. Las pruebas enfocadas y de regresión aplicables demuestran aislamiento de cache, equivalencia de transporte, comportamiento de lista y preservación de shell, Router, teclado y límites arquitectónicos.
13. No hay cambios visuales, de rutas, responsive, OpenPencil, autenticación o usuarios.

## Ronda de preguntas de propuesta

La ronda quedó resuelta mediante el handoff confirmado antes de redactar esta propuesta:

1. **¿Qué problema justifica el cambio?** La duplicación de maquinaria manual para estado remoto y la verbosidad de los parsers runtime.
2. **¿Qué resultado se busca?** DTOs remotos validados y propiedad de cache, loading, error y paginación en un piloto Query feature-local.
3. **¿Qué entra en el primer corte?** Provider, schemas Zod de la respuesta de lista y `useInfiniteQuery` para lista/búsqueda de Maestro de recursos.
4. **¿Qué propiedad de estado debe preservarse?** Estado local, URL y teclado permanecen en sus mecanismos actuales; Convex externo sigue siendo autoridad mediante adapters.
5. **¿Cuál es el límite de expansión?** No Catálogo, jerarquía, formularios, mutaciones optimistas, persistencia, auth/usuarios, Zustand ni Redux.

No quedan supuestos de producto pendientes para finalizar la propuesta. La investigación permanece no seleccionada porque la evidencia del repositorio es suficiente.

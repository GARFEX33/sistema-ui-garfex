# Exploración — Adopción gradual de React Query y Zod

## Estado y resolución

- **Cambio:** `adopt-query-zod`.
- **Fase:** explore; no se modificó código de runtime ni se ejecutaron comprobaciones.
- **Almacén:** OpenSpec; este archivo es el artefacto persistido de la fase.
- **`skill_resolution`:** `paths-injected`; se leyó `.agents/skills/garfex-design-system/SKILL.md`.
- CodeGraph no estaba disponible entre las herramientas de esta ejecución; se usó una inspección limitada de archivos explícitos como fallback.

## Corrección de gate — evidencia actual

La relectura inicial detectó que otra sesión había descartado las dependencias previamente instaladas mediante `git restore -- package.json pnpm-lock.yaml`. El incidente se diagnosticó de forma separada y se recuperó de manera acotada, sin reset ni restore amplio.

El estado actual verificado declara `@tanstack/react-query@5.102.8` y `zod@4.5.4` como dependencias directas exactas, con el importador raíz de `pnpm-lock.yaml` actualizado. La instalación es un prerrequisito completado; el trabajo pendiente comienza con la integración del provider y los pilotos de Query y Zod.

## Dirección aprobada

La adopción aprobada es estrictamente limitada a:

- `@tanstack/react-query@5.102.8` para estado remoto/de servidor;
- `zod@4.5.4` para validar valores `unknown` en la frontera de transporte;
- ninguna incorporación de Zustand, Redux, persistencia de cache, backend propio ni capa de dominio compartida.

Se preservan como propietarios de estado:

- los componentes para borradores, overlays, selección efímera y controles locales;
- TanStack Router para estado URL actual y cualquier futuro estado URL explícitamente aprobado;
- `KeyboardControllerProvider`, su registry y sus suscripciones con `useSyncExternalStore` para teclado, no para datos remotos;
- Convex externo como autoridad de datos, validación efectiva y persistencia, accedido sólo mediante los adapters feature-locales existentes.

Esta dirección sustituye únicamente la prohibición histórica de una capa Query que todavía aparece en `openspec/specs/frontend-foundation/spec.md` y en artefactos anteriores. Proposal/spec posteriores deben introducir un delta explícito y estrecho; no deben interpretar la excepción como permiso para store global, Query en Catálogo ni abstracciones compartidas.

## Evidencia y arquitectura observada

| Superficie | Hallazgo relevante |
|---|---|
| `package.json` y `pnpm-lock.yaml` | pnpm 11, React 19.1.1 y TanStack Router 1.131.27 están presentes; React Query 5.102.8 y Zod 4.5.4 quedaron declarados como dependencias directas exactas y resueltos por el importador raíz. |
| `src/main.tsx` y `src/app/providers/AppProviders.tsx` | El árbol runtime es `StrictMode → AppProviders → RouterProvider`; `AppProviders` es el único seam transversal mínimo para `QueryClientProvider`. |
| `src/app/router.tsx` y rutas | Router no tiene loaders/query integration. `/recursos` monta la entry feature-local; no es necesario ni deseable alterar URL, route tree o Router para el primer piloto. |
| `src/features/resources-master/resourcesMaster.api.ts` | Adapter Convex feature-local, transporte inyectable y 11 familias de parsers manuales. Todas las respuestas llegan como `unknown` y se validan antes de React, que es el seam correcto para Zod. |
| `ResourcesMasterScreen.tsx` | Mantiene API por instancia, texto de búsqueda, debounce de 250 ms, filtros derivados de la jerarquía y un controlador imperativo de lista con `useSyncExternalStore`. |
| `useResourcesHierarchy.ts` y `shared/hierarchy/parentGatedListController.ts` | La selección Clase→Familia→Tipo, resets de descendientes, cursores, dedupe, descarte stale y estados `waiting-for-parent` son infraestructura existente que no se debe sustituir en el primer corte. |
| `CrearRecursoSurface.tsx` | Contiene borrador, paso de diálogo, carga dependiente y estado de submit local; no es candidato para trasladar a cache global en el piloto inicial. |
| `src/shared/keyboard/**` y `AppShell.tsx` | El teclado tiene un único listener document-level y registry/suscripciones propios. Query no debe añadir listeners, proveedores de teclado, comandos ni estado de navegación espacial. |
| Especificaciones y guardas | `frontend-foundation` aún veta Query; `catalogHierarchyBoundaries.test.ts` veta `useQuery`/`QueryClient` sólo dentro del adapter de Catálogo; `keyboardBoundaries.test.ts` ya prohíbe Zustand/Redux y Convex fuera de adapters aprobados. |

Los adapters `catalogHierarchy.api.ts`, `catalogTypeAttributes.api.ts` y `resourcesMaster.api.ts` usan el mismo patrón: Convex HTTP lazy e inyectable, operación literal 1:1, payload explícito, parser de `unknown` y DTO feature-local. Esta change debe reforzar ese límite, no trasladar Convex a `app/**` ni crear un cliente/transport compartido.

## Menor adopción segura y cortes propuestos

### Corte 1 — Fundación sin cambio de producto

1. Dependencias completadas: `@tanstack/react-query@5.102.8` y `zod@4.5.4` están declaradas exactamente en `dependencies` y resueltas por pnpm.
2. En `AppProviders`, crear un `QueryClient` estable por montaje del proveedor y envolver el `RouterProvider` con `QueryClientProvider`.
3. No crear singleton de módulo, devtools, persistencia, broadcast, integración Router-query, cliente Convex en `app/**` ni defaults globales de reintento/refetch que anticipen una política de producto.

Este corte no cambia ninguna lectura mientras ningún hook Query se monte. Las opciones sensibles de reintento y `refetchOnWindowFocus` deben fijarse explícitamente en cada query piloto, no convertirse en política global por conveniencia.

### Corte 2 — Zod incremental en la frontera del piloto

Reemplazar primero sólo los parsers usados por la lista principal de Recursos maestros:

- `parseResourceListPage`;
- el schema de `ResourceSummary`, incluido `classificationStatus`;
- la envolvente nativa `{ page, isDone, continueCursor }`.

Los schemas deben permanecer en `resourcesMaster.api.ts` o en un módulo privado de esa feature, conservar las funciones parser exportadas como seam de prueba y entregar los mismos DTOs públicos. Deben preservar estas propiedades actuales:

- respuesta inválida rechazada antes de React con el error genérico existente, sin payload crudo;
- `id`, IDs de jerarquía y valores opacos que hoy se modelan como `unknown` no se convierten a string ni se inventan como IDs Convex;
- `classificationStatus.state` sólo admite los tres literales actuales y `reasons` sólo strings;
- campos opcionales conservan semántica de ausencia; no se coerciona, trimea, aplica default ni se infiere negocio;
- los campos extra que el parser actual ignora siguen sin convertirse en API de UI; registros deliberadamente opacos se modelarán explícitamente cuando les toque su corte.

Las páginas de contexto Clase/Familia/Tipo son el siguiente grupo Zod del mismo adapter, porque comparten forma y guardas de padre; unidades, atributos, detalle y respuestas de mutación quedan para cortes posteriores. Catálogo y sus atributos no se migran en este cambio inicial: tienen contratos más extensos y guardas arquitectónicas activas, por lo que mezclarlos con el piloto elevaría innecesariamente el riesgo.

La comprobación contextual de que una Familia responde al `claseRecursoId` pedido o un Tipo al `familiaRecursoId` pedido es una invariante dependiente de la solicitud. Debe permanecer como guard posterior al schema base o como refinamiento parametrizado de la feature; no se puede expresar correctamente como schema global sin contexto.

### Corte 3 — Piloto React Query: lista remota de Recursos maestros

Migrar exclusivamente la lista/búsqueda paginada de `ResourcesMasterScreen` a un hook feature-local basado en `useInfiniteQuery`:

- la query function llama al `ResourcesMasterApi` existente; por ello consume sólo DTOs ya validados por Zod y no conoce Convex;
- el query key debe incluir un namespace estable de Recursos maestros, el texto de búsqueda ya normalizado por el comportamiento existente y el filtro jerárquico efectivo más profundo; no debe incluir la instancia `api`, callbacks ni objetos de UI irrelevantes;
- `initialPageParam`, `getNextPageParam`, flatten/dedupe y `isDone` deben conservar la semántica actual de `ResourceListPage`; una continuación sólo se solicita por la CTA existente;
- la búsqueda mantiene el debounce local de 250 ms; el input, la selección y el foco continúan siendo `useState` local;
- opciones explícitas del piloto deben preservar el contrato observable actual: sin refetch por foco de ventana y sin ampliar silenciosamente el reintento automático existente; la decisión exacta debe probarse antes de fijar `retry`/`retryDelay`;
- loading, vacío confirmado, error inicial, error parcial, retry y «Cargar más…» conservan copy, accesibilidad y comportamiento actual; las páginas válidas no desaparecen ante un fallo de continuación.

El callback exitoso de `CrearRecursoSurface` puede refetchear la query activa de lista sin migrar la mutación a `useMutation`. No se realiza inserción optimista, actualización de cache manual ni invalidación amplia de recursos hasta disponer de un contrato de mutación específico. Esto conserva el tratamiento actual de resultados inciertos y evita presentar al cliente como autoridad.

Durante este corte permanecen sin cambio `useResourcesHierarchy`, `useResourcesMasterList`, `parentGatedListController`, `CrearRecursoSurface`, Catálogo y Keyboard First. El controlador de lista actual puede seguir existiendo junto con sus tests hasta que una migración posterior complete o retire su único consumidor de forma deliberada; no se debe borrar infraestructura probada dentro del mismo diff que introduce la cache.

### Cortes posteriores, fuera del mínimo seguro

1. Migrar las tres lecturas de jerarquía de Recursos maestros a queries dependientes feature-locales, preservando selección local, `enabled` por padre válido, resets atómicos y cursores/páginas parciales.
2. Adoptar Zod por grupos cohesivos: contexto, detalle/unidades, atributos y resultados de mutación de Recursos; después evaluar Catálogo por adapter, con su propia propuesta de impacto.
3. Sólo si un flujo de mutación demuestra necesidad, usar `useMutation` local y definir invalidación exacta por operación/padre. No habilita optimistic updates, persistencia o sincronización en tiempo real.

## Propiedad de estado después del piloto

| Estado | Propietario | Regla |
|---|---|---|
| Páginas remotas de lista/búsqueda de Recursos | React Query, bajo clave feature-local | Cache en memoria de la sesión, sin persistencia ni autoridad de dominio. |
| Selección Clase/Familia/Tipo y reset de descendientes | `useResourcesHierarchy` + controladores actuales | Permanece local; no pasa a Query, URL ni store global. |
| Texto de búsqueda, debounce y foco | `ResourcesMasterScreen` | Permanece local y conserva el contrato de teclado. |
| Borrador, pasos, overlay y envío de Nuevo recurso | `CrearRecursoSurface` | Permanece local; no se cachea ni se normaliza en Query. |
| URL/ruta | TanStack Router | Sin loaders, search params ni sincronización nueva en esta adopción. |
| Registry y snapshots de comandos | Keyboard Context + `useSyncExternalStore` | No se sustituye ni se usa React Query para eventos de teclado. |
| Datos, permisos, validación efectiva y persistencia | Convex externo | Nunca son propiedad del frontend ni de la cache. |

## Seams de migración y superficies previsiblemente modificadas

| Archivo/superficie | Cambio probable | Límite |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | Dependencias directas exactas | Sin paquetes de estado adicionales. |
| `src/app/providers/AppProviders.tsx` | `QueryClientProvider` y cliente estable | Mantener `RouterProvider`; no importar Convex ni dominio. |
| `src/features/resources-master/resourcesMaster.api.ts` | Schemas Zod y sustitución incremental de parsers de lista | Conservar transporte inyectable, operaciones y argumentos exactos. |
| nuevo hook privado en `features/resources-master/` | `useInfiniteQuery` y proyección de páginas de la lista | No promover wrapper a `shared` con un solo consumidor. |
| `ResourcesMasterScreen.tsx` | Consumir hook piloto y conservar UI/estado local | No rediseñar, cambiar teclado ni URL. |
| `tests/unit/resourcesMasterApi.test.ts` | Mantener y extender matriz de envelopes inválidos/DTOs válidos | Probar equivalencia, no internals de Zod. |
| `tests/unit/resourcesMasterScreen.test.tsx` | Wrapper QueryClient fresco, lista/búsqueda/paginación/error | Evitar cache entre casos y mantener mocks del adapter. |
| `tests/unit/appShell.test.tsx`, `tests/unit/commandEntry.test.tsx` | Cubrir el provider añadido indirectamente | Asegurar que shell y Router siguen montando. |
| `tests/e2e/resourcesMaster.workstation.spec.ts` | Regresión de llamadas, filtros, páginas, teclado y axe | Mock HTTP sigue siendo evidencia frontend, no backend. |
| `tests/architecture/*.test.ts` y specs | Guardas y delta normativo para la excepción acotada | Query permitido sólo donde la nueva spec lo autorice; Zustand/Redux continúan prohibidos. |

No deberían cambiar `src/main.tsx`, rutas, `routeTree.gen.ts`, `src/shared/keyboard/**`, `src/shared/hierarchy/**`, AppShell, Convex backend, artefactos OpenPencil, fixtures runtime ni estilos visuales en este piloto.

## Matriz de pruebas disponible

| Capa | Evidencia actual | Necesidad para el cambio |
|---|---|---|
| Adapter/validación | `resourcesMasterApi.test.ts` cubre parsers, argumentos exactos e inválidos | Añadir casos de equivalencia Zod para página/lista inicial; mantener errores genéricos y argumentos 1:1. |
| Controlador local | `useResourcesMasterList.test.ts` cubre retry, cursor, dedupe, stale, partial-error y vacío | Mantenerlo verde mientras el controlador siga; crear pruebas del hook Query para la semántica equivalente del piloto. |
| Jerarquía | `useResourcesHierarchy.test.ts` cubre gating y resets | No modificar en Corte 3; debe continuar como regresión. |
| UI RTL | `resourcesMasterScreen.test.tsx` cubre carga, búsqueda, filtro profundo, continuación, vacío y retry | Envolver cada render con un cliente aislado (`retry: false`, `gcTime` apropiado al test) para evitar contaminación de cache. |
| Formulario | `crearRecursoSurface.test.tsx` cubre selects dependientes, submit y foco | Mantener sin provider Query si no consume hooks Query. |
| Shell/comandos | `appShell.test.tsx`, `commandEntry.test.tsx` | Verificar que `AppProviders` conserva Router y Keyboard. |
| Arquitectura | `runtimeFixtureIsolation`, `keyboardBoundaries`, `catalogHierarchyBoundaries` | Añadir regla positiva de provider único/uso feature-local y negativa de persistencia, Zustand, Redux, Convex en `app/**`. No relajar restricciones de Catálogo por este piloto. |
| Browser | `resourcesMaster.workstation.spec.ts` cubre navegación espacial, HTTP mock, páginas, creación y axe | Repetir contra Query para asegurar una única llamada lógica, filtros exactos, refetch controlado y recorrido de teclado intacto. |

Comandos previstos para verify/apply, no ejecutados en explore: `pnpm test -- tests/unit/resourcesMasterApi.test.ts tests/unit/resourcesMasterScreen.test.tsx tests/unit/useResourcesMasterList.test.ts tests/unit/useResourcesHierarchy.test.ts tests/unit/appShell.test.tsx`, `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm verify:runtime-bundle`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La especificación canónica aún prohíbe Query | Proposal/spec deben modificar la prohibición de modo explícito, limitado a React Query para server state; las guardas sólo se relajan donde corresponda. |
| El retry/refetch por defecto cambia llamadas y estados observables | Declarar opciones por query en el piloto y probar retry, foco de ventana, continuación y stale data antes de cambiar defaults globales. |
| Cache compartida entre tests o rutas oculta fallos | Crear QueryClient nuevo por test/render, limpiar entre casos y no persistir cache. |
| IDs tipados como `unknown` producen claves inestables o coerción | Conservar IDs opacos en DTO/payload; definir y probar la key con los valores reales admitidos antes de serializar o normalizar nada. |
| Migrar lista, jerarquía, wizard y mutaciones a la vez excede el presupuesto | Limitar el primer query hook a la lista/búsqueda; dejar lo demás intacto y en cortes independientes. |
| Zod cambia aceptación/proyección accidentalmente | Migrar por grupo, conservar funciones parser y matriz existente, no usar coerción ni transformar opcionales. |
| Query se convierte en store global o duplica Keyboard Context | Restringirla a datos remotos feature-locales; no cachear drafts, selección, comandos, foco ni URL. |
| Query introduce Convex en `app/**` | El provider sólo importa React Query; los adapters Convex existentes siguen siendo los únicos puntos de transporte. |
| Resultado de creación queda desincronizado | En el piloto conservar refetch explícito después de éxito; no hacer optimistic update ni deducir resultado de error incierto. |
| Scope crece hacia Catálogo | Mantener tests y restricciones de Catálogo intactos; su migración requiere una decisión posterior por adapter. |

## No objetivos explícitos

- No Zustand, Redux, context de datos de dominio, repositorios, facades, gateways ni wrappers Query genéricos.
- No backend, schema Convex, cambio de URL, autenticación, persistencia de cache, SSR, hydration, devtools, broadcast ni offline support.
- No migración de selección local, borradores, forms, overlays, Keyboard Context/useSyncExternalStore o URL state a React Query.
- No uso de Zod para reglas de negocio, normalización de inputs o validación de formularios en este cambio; sólo respuestas de transporte `unknown` por grupos aprobados.
- No reescritura de todos los parsers ni de Catálogo en el primer piloto.
- No cambios visuales, de diseño, responsive, rutas, artefactos OpenPencil, fixtures runtime ni Convex fuera de los adapters existentes.

## Readiness, rollback y recomendación

**Readiness de proposal:** procedente. La dirección, versiones y ausencia de decisiones pendientes están aprobadas; la propuesta debe registrar el delta de `frontend-foundation`, alcance del piloto y exclusiones.

**Readiness de design/apply:** procedente sólo para los tres cortes descritos y con TDD estricto; las dependencias exactas ya están instaladas. La determinación concreta de reintentos debe quedar cubierta por RED antes de fijar opciones del hook. El esfuerzo se debe dividir como fundación, parser Zod y query piloto para mantenerse por debajo del presupuesto de 400 líneas por unidad revisable.

**Rollback:**

- Corte 1: retirar dependencias, lockfile y wrapper de `AppProviders`; no hay datos persistidos.
- Corte 2: restaurar sólo los parsers de lista de Recursos; el adapter, transporte y UI permanecen aislados.
- Corte 3: retirar hook y wiring de lista, volver al controlador existente y sus pruebas; no toca selección, wizard, URL, teclado ni backend.

No se ejecutaron tests, build, lint, formato ni typecheck durante esta exploración.

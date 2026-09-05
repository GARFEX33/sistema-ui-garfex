# Especificación de Lista Remota de Maestro de Recursos

## Purpose

Permitir la lectura y búsqueda paginada de Recursos maestros con estado remoto feature-local, preservando el contrato observable de la pantalla y la autoridad del backend externo.

## Requirements

### Requirement: Validación de transporte equivalente para la lista

El sistema MUST validar como datos de transporte los valores `unknown` de la lista paginada de Recursos antes de que lleguen a React. Las respuestas válidas MUST producir los mismos DTOs públicos de `ResourceSummary`, `classificationStatus` y envolvente paginada que el contrato anterior; las respuestas inválidas MUST fallar con el error genérico existente sin exponer el payload crudo. La validación MUST conservar IDs y valores opacos sin convertirlos a texto, aceptar solamente los tres literales existentes de `classificationStatus.state`, exigir strings en `reasons`, conservar ausencia y opcionalidad, y no aplicar coerción, trim, defaults ni inferencias de negocio. Los campos adicionales ajenos al DTO público MUST continuar ignorándose.

#### Scenario: Una página válida mantiene su DTO público

- GIVEN una respuesta de transporte válida de la lista principal de Recursos
- WHEN el adapter la entrega a la interfaz
- THEN la interfaz recibe el mismo DTO público que recibía antes del cambio
- AND los cursores, `isDone`, IDs opacos y valores opcionales conservan su semántica

#### Scenario: Un envelope inválido no alcanza la interfaz

- GIVEN una respuesta de lista con un envelope o campo de DTO inválido
- WHEN el adapter procesa el valor `unknown`
- THEN la lectura falla antes de React con el error genérico existente
- AND no se expone el payload recibido ni se inventan valores de reemplazo

### Requirement: Identidad y alcance de la lectura remota

El sistema MUST obtener la lista y búsqueda paginada mediante una consulta infinita privada de Maestro de Recursos que use exclusivamente el `ResourcesMasterApi` existente y DTOs ya validados. La identidad de cada consulta MUST incluir un namespace estable de Maestro de Recursos, el texto de búsqueda normalizado conforme al comportamiento actual y el filtro jerárquico efectivo más profundo. La identidad MUST NOT incluir instancias de API, callbacks ni objetos de UI irrelevantes.

#### Scenario: Búsquedas o filtros efectivos distintos no comparten resultados

- GIVEN dos lecturas con texto normalizado o filtro jerárquico efectivo diferente
- WHEN se consultan sus páginas
- THEN sus resultados y estados remotos permanecen separados
- AND cambiar un objeto de UI, callback o instancia de API no crea una identidad de consulta distinta

### Requirement: Búsqueda y paginación conservan el contrato actual

El sistema MUST conservar el texto de búsqueda, su debounce local de 250 ms y el filtro jerárquico efectivo actual. La primera página MUST usar el parámetro inicial actual; una página adicional MUST solicitarse sólo mediante la CTA existente «Cargar más…». La proyección de páginas MUST conservar flatten, cursores, `isDone` y deduplicación actuales, de modo que un Recurso repetido entre páginas se muestre una sola vez.

#### Scenario: La búsqueda espera el debounce antes de leer

- GIVEN una persona que modifica el texto de búsqueda
- WHEN aún no transcurren 250 ms desde el último cambio
- THEN la lectura remota activa no cambia por ese texto intermedio
- WHEN transcurren 250 ms sin otro cambio
- THEN la lista consulta usando el texto normalizado y el filtro jerárquico efectivo actuales

#### Scenario: La continuación conserva páginas y elimina duplicados

- GIVEN una lista con una primera página válida y una continuación disponible
- WHEN la persona activa «Cargar más…»
- THEN se solicita la siguiente página con el cursor correspondiente
- AND los elementos de todas las páginas válidas permanecen visibles una sola vez
- AND no se solicita otra página automáticamente sin la CTA

### Requirement: Estados de lectura, errores y reintentos preservados

El sistema MUST conservar el copy, accesibilidad y comportamiento existentes para carga inicial, vacío confirmado, error inicial, retry, continuación, error parcial y «Cargar más…». Un error inicial MUST permitir el retry existente. Si falla una continuación, el sistema MUST conservar visibles las páginas válidas ya obtenidas y presentar el error parcial con su recuperación existente. La consulta piloto MUST desactivar el refetch por foco de ventana y MUST fijar explícitamente una política de retry que no incremente las llamadas automáticas observables respecto al contrato previo.

#### Scenario: Una falla inicial puede recuperarse

- GIVEN que la primera página falla y no existen páginas válidas
- WHEN la pantalla presenta el error inicial
- THEN conserva su copy y alternativa accesible de retry existentes
- WHEN la persona activa retry
- THEN se vuelve a intentar la lectura conforme a la política explícita del piloto

#### Scenario: Una falla de continuación conserva los resultados previos

- GIVEN que una o más páginas válidas ya están visibles
- WHEN falla la solicitud iniciada por «Cargar más…»
- THEN los resultados válidos y deduplicados permanecen visibles
- AND la pantalla comunica el error parcial y ofrece la recuperación existente
- AND enfocar nuevamente la ventana no provoca un refetch adicional

### Requirement: Refresco posterior a creación confirmada

El sistema MUST permitir refrescar explícitamente la lista activa después de una creación de Recurso confirmada. El refresco MUST NOT migrar la creación a una mutación de React Query, insertar resultados optimistas, editar manualmente la cache ni invalidar de forma amplia otras listas o filtros.

#### Scenario: Una creación confirmada refresca sólo la lista activa

- GIVEN una creación de Recurso confirmada por el flujo existente
- WHEN ese flujo solicita el refresco de la lista activa
- THEN la lista activa vuelve a leerse desde su consulta remota
- AND la interfaz no muestra un Recurso optimista ni infiere éxito ante un resultado incierto
- AND las listas de identidades distintas no se invalidan de forma amplia

### Requirement: Aislamiento de cache y propiedad de estado preservada

Cada montaje o caso de prueba MUST poder usar un `QueryClient` aislado para que resultados, errores y reintentos de una ejecución no contaminen otra. React Query MUST poseer sólo las páginas remotas de lista/búsqueda y sus estados asíncronos en memoria. La selección Clase/Familia/Tipo y sus resets MUST permanecer en sus controladores actuales; el input, debounce y foco MUST permanecer en `ResourcesMasterScreen`; el borrador, pasos, overlay y envío de creación MUST permanecer en `CrearRecursoSurface`; la ruta y URL MUST permanecer en TanStack Router; y los comandos y snapshots de teclado MUST permanecer en su contexto y `useSyncExternalStore` actuales.

#### Scenario: Dos pruebas no comparten resultados remotos

- GIVEN dos renders o casos de prueba independientes de la lista
- WHEN el primer caso deja datos o un error en su cache
- THEN el segundo caso inicia con un cliente de consultas aislado
- AND su resultado no depende del orden ni de la cache del primer caso

#### Scenario: La adopción no desplaza estado local ni otros límites

- GIVEN la pantalla de Maestro de Recursos con el piloto de lectura activo
- WHEN una persona busca, filtra, usa teclado o abre el flujo de creación
- THEN cada estado permanece bajo su propietario existente
- AND no se modifica la ruta, la selección jerárquica, el borrador, el foco ni el contrato de teclado por la cache remota

## Out of Scope

Esta capacidad MUST NOT autorizar cambios en Catálogo, migración de jerarquía, formularios, auth o usuarios, Zustand, Redux, persistencia, cambios visuales, rutas, backend, acceso Convex fuera de adapters feature-locales, ni mutaciones distintas del refresco explícito posterior a una creación confirmada.

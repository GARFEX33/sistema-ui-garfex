# Delta for Lista Remota de Maestro de Recursos

## MODIFIED Requirements

### Requirement: Validación de transporte equivalente para la lista

El sistema MUST validar como transporte `unknown` la respuesta REST `ResourcePage` y cada `Resource` antes de que lleguen a React. Un Recurso válido MUST contener `id: string`, `revision: string`, `identityV1`, `scope` con `classCode`, `familyCode` y `typeCode`, `naturalUnit`, `active` y atributos `{ code, value: CatalogValue }` conforme al contrato público. La validación MUST conservar strings y valores tipados sin coerción, trim, defaults ni inferencias de `classificationStatus`, razones, efectividad o diagnóstico no documentados. Un payload inválido MUST fallar antes de React sin exponerlo ni sustituirlo.

(Previously: La lista preservaba el DTO Convex `ResourceSummary`, `classificationStatus`, cursores e IDs opacos anteriores.)

#### Scenario: Una página REST válida produce recursos validados

- GIVEN una respuesta válida de `GET /v1/resources`
- WHEN el adapter valida la página
- THEN la interfaz recibe recursos con sus campos REST documentados y valores tipados
- AND `id` y `revision` permanecen strings

#### Scenario: Un recurso REST inválido no alcanza la interfaz

- GIVEN una página cuyo recurso omite un campo obligatorio o contiene un atributo tipado inválido
- WHEN el adapter procesa la respuesta
- THEN la lectura falla antes de React
- AND no inventa estado de clasificación ni valores de reemplazo

### Requirement: Identidad y alcance de la lectura remota

El sistema MUST obtener lista y búsqueda desde `GET /v1/resources` con los únicos filtros documentados: `scope`, `text`, `classCode`, `familyCode`, `typeCode`, `limit` y `offset`. La identidad de la lectura MUST incluir el texto normalizado conforme al comportamiento actual y cada filtro REST efectivamente enviado, pero MUST NOT incluir instancias de API, callbacks ni objetos de UI. La interfaz MUST NOT afirmar que un filtro jerárquico, resultado o relación conserva una semántica Convex que el contrato no documenta.

(Previously: La identidad se basaba en una consulta infinita privada y el filtro jerárquico efectivo del contrato anterior.)

#### Scenario: Filtros REST distintos no comparten resultados

- GIVEN dos lecturas con texto, scope o códigos jerárquicos enviados diferentes
- WHEN se solicitan sus páginas
- THEN sus resultados y estados remotos permanecen separados
- AND cambiar un callback u objeto visual no cambia su identidad

### Requirement: Búsqueda y paginación conservan el contrato REST

El sistema MUST conservar el input de búsqueda y su debounce local de 250 ms cuando ese comportamiento ya exista, y MUST reiniciar el offset al cambiar texto o filtro REST. Cada página MUST usar `offset` y `limit` documentados y habilitar avanzar o retroceder sólo según `hasNext` y `hasPrevious`. La lista MUST NOT usar cursor, `isDone`, «Cargar más…» acumulativo, deduplicación ni promesa de orden estable como equivalentes REST. Si la UX actual depende de estabilidad entre páginas, la pantalla MUST presentar el bloqueo contractual antes de prometer esa continuidad.

(Previously: La lista mantenía consulta infinita por cursor, flatten, deduplicación y CTA «Cargar más…».)

#### Scenario: Cambiar la búsqueda reinicia la página

- GIVEN una página REST en un offset mayor que cero
- WHEN la persona cambia el texto y transcurren 250 ms sin otro cambio
- THEN la lectura usa el texto normalizado y offset inicial
- AND no reutiliza un cursor ni páginas del texto anterior

#### Scenario: La falta de orden estable bloquea continuidad equivalente

- GIVEN que la persona requiere recorrer varias páginas sin duplicados u omisiones garantizados
- WHEN el contrato público no documenta un orden estable
- THEN la interfaz no afirma esa garantía ni acumula resultados como si la tuviera
- AND registra la brecha para decisión humana

### Requirement: Estados de lectura, errores y reintentos preservados

El sistema MUST conservar copy, accesibilidad y alternativas de recuperación existentes para carga, vacío confirmado, error inicial y error durante navegación de página, adaptados a los resultados REST realmente recibidos. Un 400, 404, 409, 422, 500, 503, error `{ error }`, fallo de parsing o fallo de red MUST permanecer visible como error y MUST NOT convertirse en un resultado vacío ni éxito aparente. Los reintentos MUST ser explícitos y MUST NOT aumentar llamadas automáticas respecto del comportamiento observable previo.

(Previously: Los estados se definían alrededor de carga incremental Convex y una política de React Query para continuación.)

#### Scenario: Un fallo de red ofrece recuperación honesta

- GIVEN que la lectura inicial falla por red y no hay una página REST válida
- WHEN la pantalla presenta el error
- THEN ofrece la recuperación existente accesible cuando aplique
- AND no presenta una lista vacía como si el backend hubiera confirmado ausencia

### Requirement: Refresco posterior a creación confirmada

El sistema MUST permitir refrescar explícitamente la lectura REST activa sólo después de una creación de Recurso que REST haya confirmado con 201 y un `Resource` válido. El refresco MUST volver a solicitar la página activa sin insertar resultados optimistas, editar una cache como autoridad ni invalidar de forma amplia identidades distintas.

(Previously: El refresco seguía una creación confirmada del flujo Convex existente.)

#### Scenario: Una creación REST confirmada refresca la lectura activa

- GIVEN una creación REST confirmada con 201 y un DTO válido
- WHEN el flujo solicita refrescar la lista activa
- THEN se vuelve a leer únicamente esa identidad REST
- AND no se muestra un Recurso optimista

### Requirement: Aislamiento de cache y propiedad de estado preservada

Cada montaje o prueba MUST aislar las páginas REST, errores y reintentos para evitar contaminación entre ejecuciones. La cache en memoria MAY poseer sólo resultados remotos REST y sus estados asíncronos; selección, foco, búsqueda local, debounce, borradores, ruta, URL y teclado MUST conservar sus propietarios actuales. La migración MUST NOT desplazar esos estados a un store global ni introducir un cliente Convex o fallback.

(Previously: Esta separación se describía para páginas infinitas del adapter Convex.)

#### Scenario: Dos pruebas no comparten una página REST

- GIVEN dos renders independientes de Maestro de Recursos
- WHEN el primero deja datos o un error REST en memoria
- THEN el segundo inicia sin esa cache
- AND su resultado no depende del orden del caso previo

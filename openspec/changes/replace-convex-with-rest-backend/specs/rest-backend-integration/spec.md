# Especificación de Integración REST pública

## Purpose

Conectar los flujos aprobados de Catálogo y Maestro de Recursos exclusivamente al contrato REST público suministrado, sin atribuir al frontend capacidades que el contrato no documenta.

## Requirements

### Requirement: Frontera REST pública y DTOs validados

El frontend MUST consumir únicamente rutas, parámetros, cuerpos y respuestas documentados en `api-contract-evidence.md`. Antes de llegar a React, toda respuesta `unknown` MUST validarse como `CatalogRecord`, `CatalogPage`, `Resource`, `ResourcePage`, valor tipado o error `{ error: string }` según corresponda. `id`, `revision` y `expectedRevision` MUST conservarse como `string`, sin coerción numérica. Los mappers MUST convertir sólo valores tipados documentados (`CODE.value`, `TEXT.value` y referencias documentadas) y campos que el descriptor público del `kind` declare; MUST NOT completar, normalizar ni inferir valores, reglas o relaciones no documentados.

#### Scenario: Un record REST válido conserva identificadores opacos

- GIVEN una respuesta `CatalogRecord` o `Resource` válida con `id` y `revision` de texto
- WHEN el adapter la entrega al flujo de interfaz correspondiente
- THEN los identificadores y revisiones permanecen como `string`
- AND la interfaz recibe sólo el DTO validado y mapeado

#### Scenario: Un DTO o valor tipado inválido no llega a React

- GIVEN una respuesta con un envelope, valor tipado, referencia o campo obligatorio inválido
- WHEN el adapter procesa el payload desconocido
- THEN la operación falla en la frontera REST
- AND no se fabrican defaults, datos locales ni reglas de negocio para continuar

### Requirement: Errores REST y fallos de red observables

El frontend MUST mapear los errores HTTP documentados 400, 404, 409, 422, 500 y 503, y los fallos de red o parsing, a estados explícitos de error recuperable cuando el flujo pueda reintentarse. Si la respuesta contiene `{ error }`, el estado MUST conservar su carácter de error y MUST NOT presentarse como éxito, resultado parcial autoritativo ni validación de negocio. El frontend MUST NOT inventar causas, permisos, reintentos automáticos o resoluciones no documentadas.

#### Scenario: Un conflicto REST no confirma una mutación

- GIVEN una mutación que recibe 409 y un cuerpo `{ error: string }`
- WHEN el adapter informa el resultado a la interfaz
- THEN la interfaz comunica un fallo explícito
- AND no actualiza el estado como si la revisión esperada hubiera sido aceptada

#### Scenario: Una caída de red mantiene un estado honesto

- GIVEN una lectura o mutación cuya petición falla antes de recibir respuesta HTTP
- WHEN la interfaz termina la operación
- THEN presenta el estado de fallo y la recuperación que el flujo ya soporte
- AND no sustituye la respuesta con Convex, fixtures ni persistencia local

### Requirement: Paginación REST sin cursor sintético

Los listados REST MUST solicitar páginas mediante `offset` y `limit` dentro del rango documentado, y MUST usar exclusivamente `hasPrevious` y `hasNext` devueltos por `CatalogPage` o `ResourcePage` para habilitar la navegación disponible. Un cambio de texto, alcance o filtro documentado MUST reiniciar el offset de ese listado. El frontend MUST NOT fabricar `continuationCursor`, `isExhausted`, cursores, orden estable, deduplicación inter-página ni resultados omitidos como garantías REST.

#### Scenario: Navegación a la página siguiente documentada

- GIVEN una página REST válida con `hasNext` verdadero y un offset vigente
- WHEN la persona solicita la página siguiente mediante el control existente
- THEN el adapter solicita la siguiente ventana con `offset` y `limit`
- AND la interfaz no emite ni interpreta un cursor sintético

#### Scenario: Orden no documentado bloquea una equivalencia prometida

- GIVEN que el contrato público no documenta un orden estable entre páginas
- WHEN un flujo requiera garantizar ausencia de duplicados, omisiones o una posición estable tras paginar
- THEN el flujo muestra un estado de alcance o bloqueo explícito
- AND la capacidad se reporta al humano sin declarar que REST conserva esa garantía

### Requirement: Desarrollo local y actor de prueba acotados

En desarrollo local, Vite MUST dirigir las peticiones de la aplicación al backend declarado `http://localhost:8090` mediante un proxy de mismo origen. Esta configuración MUST NOT definir ni modificar topología, CORS, autenticación, autorización, variables o despliegue de producción. La conectividad real de navegador MUST verificarse antes de declararla operativa; el proxy no MAY presentarse como evidencia de CORS ni como solución de producción. Las mutaciones REST MUST obtener un `actor` local configurable; si falta, está vacío o no es válido para la configuración, MUST fallar cerradas antes de enviar una petición. El actor MUST NOT presentarse como prueba de autenticación o autorización.

#### Scenario: Desarrollo usa el proxy local

- GIVEN la aplicación iniciada en desarrollo local
- WHEN un adapter REST autorizado construye una petición
- THEN la petición usa la ruta de mismo origen configurada para el proxy hacia `localhost:8090`
- AND no incorpora una configuración de producción

#### Scenario: La conectividad de navegador aún no se presume

- GIVEN que sólo existe la configuración de proxy local
- WHEN no se ha ejecutado una lectura desde el navegador contra el entorno de desarrollo
- THEN el cambio no declara conectividad web verificada
- AND no atribuye al proxy una decisión de CORS o producción

#### Scenario: Falta el actor local

- GIVEN una persona intenta crear, actualizar, desactivar o reactivar y no existe actor local configurado
- WHEN confirma la acción
- THEN la interfaz comunica que la mutación no puede enviarse por falta de actor local
- AND no se emite ninguna petición HTTP mutante

### Requirement: Lecturas jerárquicas REST acotadas por código

La lista REST de `FAMILIA` MUST incluir `classCode` con el código de la Clase contextual seleccionada y MUST NOT incluir `familyCode`. La lista REST de `TIPO` MUST incluir `familyCode` con el código de la Familia contextual seleccionada y MUST NOT incluir filtros de kinds no relacionados. `CLASE` y cualquier kind que no tenga el padre que documenta cada filtro MUST omitir `classCode` y `familyCode`; el frontend MUST NOT enviar parámetros que el contrato indica que serían ignorados. Cada página de `FAMILIA` MUST validar que la referencia `class` de todos sus records coincide con el `classCode` solicitado; cada página de `TIPO` MUST validar que la referencia `family` coincide con el `familyCode` solicitado. Una discrepancia MUST hacer fallar la página completa antes de React, sin mezclar records, corregir referencias ni reutilizar una página previa.

#### Scenario: La lista de Familia se acota por la Clase seleccionada

- GIVEN una Clase contextual con código conocido
- WHEN el adapter solicita la página de `FAMILIA`
- THEN envía únicamente el `classCode` de esa Clase como filtro jerárquico
- AND falla la página si cualquier record no referencia ese código de Clase

#### Scenario: La lista de Tipo se acota por la Familia seleccionada

- GIVEN una Familia contextual con código conocido
- WHEN el adapter solicita la página de `TIPO`
- THEN envía únicamente el `familyCode` de esa Familia como filtro jerárquico
- AND falla la página si cualquier record no referencia ese código de Familia

#### Scenario: Un kind no relacionado no recibe filtros ignorados

- GIVEN una lectura de `CLASE`, `UNIDAD` u otro kind sin el padre documentado para un filtro
- WHEN el adapter construye la URL REST
- THEN omite `classCode` y `familyCode` que no apliquen a ese kind
- AND no depende del comportamiento de ignorar parámetros del backend

### Requirement: Brechas contractuales visibles y bloqueadas

La interfaz MUST distinguir los comportamientos respaldados por el contrato de las brechas no resueltas. El filtro jerárquico por padre queda respaldado únicamente para las listas de `FAMILIA` y `TIPO` acotadas por sus códigos documentados; los atributos efectivos quedan respaldados únicamente para la lectura contextual `GET /v1/types/{typeCode}/attributes/effective` y sus schemas públicos. El orden estable de paginación, `effectiveReasons`, `aggregateStatus`, `violations`, evaluación de creación, `catalogFingerprint` y disposiciones como `CATALOG_CHANGED`, `INCOMPLETE` o `INVALID` MUST tratarse como no documentados fuera de la lectura efectiva explícita y de `POST /evaluate`, que únicamente evalúan atributos y opciones conforme a sus schemas públicos. Para cada flujo afectado, el frontend MUST registrar la operación de usuario, evidencia pública disponible e impacto visible, y MUST presentar un estado de alcance reducido o bloqueo antes que eliminar, simular o aprobar silenciosamente esa funcionalidad. Sólo una decisión humana y contrato público actualizado MAY desbloquearla.

#### Scenario: El flujo necesita evaluación no documentada

- GIVEN un paso keyboard-first que requiere evaluación, fingerprint o diagnóstico previo a crear
- WHEN alcanza ese paso usando únicamente el contrato REST suministrado
- THEN informa que la integración necesaria no está respaldada por el contrato público
- AND no habilita una creación equivalente ni calcula una evaluación local


### Requirement: Conservación de interacción soportada

Todo flujo que REST sí respalde MUST conservar su composición visual, nombres accesibles, foco visible y recorrido de teclado existente conforme a WCAG 2.2 AA y al contrato `keyboard-interaction`. Los adapters REST MUST NOT añadir listeners globales, capturas de `Tab` o `Ctrl+N`, ni cambiar atajos por el transporte. Una brecha contractual MUST comunicar su estado sin degradar los controles, la restauración de foco o la accesibilidad de las acciones restantes.

#### Scenario: Una lectura REST no altera el recorrido de teclado

- GIVEN un listado REST soportado y navegable en la interfaz actual
- WHEN completa carga, vacío o error de red
- THEN los controles disponibles conservan nombre accesible, foco perceptible y recorrido de teclado aplicable
- AND la navegación global y local conserva sus propietarios existentes

### Requirement: Retirada final y total de Convex

Tras migrar o bloquear honestamente todos los consumidores incluidos, el frontend MUST eliminar Convex por completo: dependencias, lockfile asociado, imports, configuración, RPC, clientes, pruebas conectadas y excepciones de arquitectura. El runtime y las pruebas MUST NOT conservar fallback, ruta dual, mock runtime ni sustituto local de Convex. Esta migración MUST NOT extender ni crear UI de proveedores ni capacidades backend nuevas. El rollback posterior MUST ocurrir mediante reversión de la entrega, no mediante dos backends activos.

#### Scenario: La verificación final no encuentra Convex

- GIVEN el cierre de la migración aprobada
- WHEN se ejecutan las guardas de arquitectura y la suite `pnpm test`
- THEN no queda dependencia ni consumo runtime o de pruebas de Convex en el alcance
- AND los flujos incluidos usan REST o muestran su bloqueo contractual explícito

# Propuesta — Sustituir Convex por el backend REST

## Decisión

Migrar el frontend desde Convex al contrato REST público ya suministrado, adaptando cada flujo a las capacidades reales de la API y retirando Convex por completo, sin fallback. La migración preservará el diseño visual y los recorridos de teclado cuando REST soporte los datos y comandos necesarios; una capacidad ausente se hará visible como brecha para decisión humana, nunca como endpoint, regla o comportamiento inventado en frontend.

Esta propuesta autoriza planificación, no implementación. El alcance y las etapas deberán revisarse con el humano antes de apply.

## Intención y resultado de producto

El cambio busca que catálogo, jerarquía y maestro de recursos consuman el backend REST PostgreSQL como única autoridad de runtime. Para las personas usuarias, la interfaz debe conservar su identidad visual, accesibilidad y eficiencia operativa en los flujos respaldados por el contrato. Cuando Convex ofrecía una semántica más rica que REST, la UI se simplificará o dejará de ofrecer esa acción/estado, de forma explícita y sin presentar cálculos locales como decisiones del backend.

La migración no es una copia literal de RPC Convex: REST usa records tipados, referencias, revisiones `string`, paginación offset/limit y errores HTTP. Los adapters deberán expresar esas diferencias en lugar de ocultarlas mediante emulación.

## Fuente de verdad y límite estricto

- La única frontera de integración es la documentación pública y la evidencia contractual contenida en [api-contract-evidence.md](api-contract-evidence.md).
- [exploration.md](exploration.md) aporta el inventario frontend y las incompatibilidades conocidas.
- **Nunca se inspeccionará el repositorio, código, datos internos o implementación del backend, ni se modificará el backend.**
- No se harán suposiciones sobre endpoints, filtros, autorización, orden, reglas de negocio o payloads que no estén documentados.
- La investigación opcional fue ofrecida y no seleccionada; no forma parte de esta propuesta.

## Alcance

### Incluido

1. Sustituir el transporte Convex de los adapters feature-locales de jerarquía de catálogo, atributos/tipos y maestro de recursos por HTTP REST.
2. Introducir DTOs, validación de respuestas y mappers explícitos para `CatalogRecord`, `CatalogPage`, `Resource`, `ResourcePage`, valores tipados y errores `{ error }`.
3. Reemplazar la paginación por cursor con offset/limit y `hasPrevious`/`hasNext`, sin fabricar cursores y sólo bajo comportamiento respaldado por el contrato.
4. Integrar las operaciones documentadas de catálogo y recursos, auditando cada uso de UI antes de considerarlo equivalente.
5. Configurar el proxy local de Vite hacia `http://localhost:8090` para desarrollo.
6. Incorporar un `actor` de prueba local configurable para mutaciones. Mientras no exista un valor configurado, toda mutación afectada fallará cerrada antes de enviar la petición, con estado comprensible para la persona usuaria.
7. Adaptar u ocultar estados y acciones que dependan exclusivamente de semántica Convex no disponible.
8. Reemplazar las pruebas conectadas y guardas de arquitectura dependientes de Convex por límites REST deliberados.
9. Eliminar finalmente paquete, lockfile asociado, imports, configuración, RPC, pruebas y excepciones de arquitectura de Convex, una vez que los consumidores incluidos tengan cobertura REST aceptada.

### Áreas frontend afectadas

| Área | Cambio previsto |
| --- | --- |
| `src/features/catalog-hierarchy/` | Transporte, parsing, paginación, relaciones y adaptación visible de catálogo. |
| `src/features/resources-master/` | Lista, búsqueda, detalle y mutaciones documentadas; adaptación de semánticas no disponibles. |
| Factories/wiring de pantallas | Construcción de adapters REST en lugar de clientes Convex. |
| Configuración Vite local | Proxy de desarrollo al backend en `localhost:8090`. |
| Configuración de entorno frontend | Entrada configurable para actor local, sin valor inventado ni secreto incorporado. |
| Pruebas y guardas | Frontera HTTP, parsers, errores, regresión UI/teclado y prohibición final de Convex. |
| Dependencias | Retirada de `convex` y actualización coherente del lockfile al cierre. |

## No objetivos

- Desplegar, configurar o definir la topología de producción.
- Modificar CORS, infraestructura, autenticación, autorización o cualquier parte del backend.
- Inspeccionar internals o el repositorio backend para resolver dudas del contrato.
- Inventar endpoints, query params, reglas de negocio, ordenamientos, estados derivados o payloads.
- Crear un fallback Convex, mocks de runtime, persistencia local o un segundo backend.
- Reproducir localmente `effective`, `effectiveReasons`, `aggregateStatus`, `violations`, evaluación de creación, fingerprints o resultados como `CATALOG_CHANGED`.
- Prometer equivalencia de todos los flujos actuales antes de completar la auditoría contractual por operación.
- Rediseñar visualmente las pantallas, alterar recorridos de teclado no afectados o modificar changes/recovery no relacionados.

## Reglas de adaptación

1. **Equivalencia demostrada:** un flujo se conserva cuando sus entradas, salidas, errores y concurrencia tienen respaldo en el contrato público.
2. **Equivalencia parcial:** la UI conserva sólo la parte soportada y comunica claramente cualquier acción o información retirada.
3. **Capacidad ausente:** el flujo no se sustituye silenciosamente; se registra y reporta al humano mediante el proceso de brechas.
4. **Concurrencia:** `id`, `revision` y `expectedRevision` permanecen como `string`; no habrá coerción numérica.
5. **Jerarquía:** no se inventará un filtro por padre. Cualquier carga y relación local deberá estar respaldada por una decisión posterior basada en volumen, rendimiento y UX; si esa decisión no puede tomarse con el contrato suministrado, será una brecha.
6. **Mutaciones:** sin actor local configurado no se enviará ninguna petición mutante. El actor no se presentará como prueba de autenticación o autorización.
7. **Errores:** los estatus y `{ error }` documentados se mapearán a estados explícitos; no se transformarán errores contractuales en éxitos aparentes.
8. **Diseño y teclado:** se reutilizarán contratos visuales y componentes compartidos existentes. Los atajos globales seguirán en la infraestructura de teclado compartida y las interacciones locales accesibles permanecerán encapsuladas.

## Proceso obligatorio para brechas de API

Cuando una etapa necesite una capacidad no documentada:

1. Detener sólo el flujo o slice afectado, sin diseñar una solución backend.
2. Registrar la operación de usuario, contrato esperado, evidencia pública revisada e impacto visible/operativo.
3. Indicar si el flujo puede omitirse de forma explícita sin falsear semántica; no aplicar esa omisión silenciosamente.
4. Reportar la brecha al humano para que **esa persona** decida si solicita la capacidad al equipo backend, reduce alcance o acepta una adaptación visible.
5. Reanudar el flujo únicamente con una decisión humana y, si corresponde, un contrato público actualizado.

Brechas ya conocidas que requieren este tratamiento incluyen el filtrado jerárquico por padre, el orden estable de paginación, estados efectivos/diagnósticos y la evaluación/fingerprint del flujo keyboard-first. Su presencia no implica que se haya elegido todavía cómo alterar cada pantalla.

## Etapas propuestas y verificación

Toda implementación posterior seguirá TDD estricto: primero prueba fallida, luego cambio mínimo y refactor con la suite verde. `pnpm test` será el comando base; cada etapa añadirá pruebas focalizadas antes de ampliar el wiring.

### 1. Frontera REST compartida por adapters

- Definir construcción de URL mediante proxy local, validación de DTOs y normalización de errores documentados.
- Añadir guardas para impedir HTTP fuera de adapters aprobados y para prohibir nuevas dependencias Convex.
- **Pruebas:** URLs/query documentadas, respuestas válidas e inválidas, errores HTTP, revisión `string` y ausencia de llamadas mutantes sin actor.

### 2. Catálogo jerárquico

- Migrar primero lecturas de `CLASE`, `FAMILIA` y `TIPO` con records tipados.
- Resolver formularios contra campos realmente requeridos, incluyendo `plural` y `slug` de `CLASE`, sin autogenerar reglas no acordadas.
- Migrar mutaciones únicamente cuando inputs y lifecycle estén auditados.
- **Pruebas:** mapping por descriptor, referencias, offset/reset, estados vacío/error y recorridos visuales/teclado soportados.
- **Gate:** relación por padre y orden de resultados; reportar brecha si el contrato no basta para una experiencia segura y acotada.

### 3. Atributos, opciones, aplicabilidad y unidades

- Auditar operación por operación los kinds documentados (`CARACTERISTICA`, `CONJUNTO_OPCIONES`, `OPCION`, `RELACION_OPCIONES`, `UNIDAD`, `POLITICA_UNIDAD`, `APLICABILIDAD`, `PRESENTACION`).
- Migrar únicamente contratos equivalentes; retirar o adaptar indicadores Convex no respaldados.
- **Pruebas:** valores tipados, referencias, campos requeridos, lifecycle confirmado, estados parciales y errores.
- **Gate:** cualquier noción de efectividad, razones, violaciones o política derivada no documentada se reporta, no se calcula.

### 4. Recursos de lectura

- Migrar listado, búsqueda, filtros documentados, detalle identificable y descripción.
- Sustituir cursor por offset/limit y `hasPrevious`/`hasNext` sin prometer orden no documentado.
- **Pruebas:** query por códigos, mapping de `ResourcePage`, atributos, unidad natural, navegación de página, búsqueda, vacío/error y regresión de teclado.
- **Gate:** confirmar comportamiento aceptable del orden y paginación antes de dar la lectura por equivalente.

### 5. Recursos mutantes y flujo keyboard-first

- Integrar create, update, deactivate y reactivate con actor configurable y revisión esperada.
- Conservar el flujo keyboard-first sólo en los pasos respaldados por REST; no simular evaluación, fingerprint ni diagnóstico Convex.
- **Pruebas:** fail-closed sin actor, payloads documentados, 409/422/503, revisión, foco, atajos y prevención de dobles envíos.
- **Gate:** presentar al humano el impacto de las capacidades de evaluación ausentes antes de retirar o simplificar pasos visibles.

### 6. Retirada definitiva de Convex

- Eliminar transporte, configuración, imports, dependencia, lockfile relacionado, pruebas conectadas y excepciones Convex.
- Ejecutar regresión de los slices migrados y controles de arquitectura.
- **Pruebas:** `pnpm test`, pruebas focalizadas de UI/teclado y comprobaciones estáticas que confirmen cero dependencia runtime/test de Convex.
- Esta etapa no mantiene fallback; el rollback es de entrega/versionado, no una ruta dual dentro de la aplicación.

Las etapas son límites de revisión y validación, no afirmaciones de que todas las operaciones hayan sido confirmadas. Una etapa puede cerrarse con alcance reducido sólo tras documentar la brecha y obtener decisión humana.

## Criterios de aceptación y éxito

- [ ] Los flujos aceptados consumen exclusivamente rutas y campos presentes en el contrato REST suministrado.
- [ ] No quedan imports, dependencia, variables, RPC, pruebas conectadas ni excepciones de arquitectura de Convex en el alcance vigente.
- [ ] No existe fallback de runtime ni sustitución local de semánticas backend.
- [ ] El proxy Vite local dirige las peticiones frontend de desarrollo a `http://localhost:8090`; no se incluyen cambios de producción.
- [ ] Las mutaciones fallan cerradas y no envían requests cuando falta el actor local configurable.
- [ ] Revisiones e identificadores REST se conservan como `string` y los payloads/respuestas se validan en la frontera.
- [ ] La paginación utiliza offset/limit y flags REST, sin cursores sintéticos.
- [ ] Cada capacidad no documentada tiene reporte de brecha y decisión humana antes de omitir, alterar o bloquear su flujo.
- [ ] El diseño visual, accesibilidad y recorridos de teclado se preservan en todos los flujos declarados como soportados.
- [ ] Los indicadores o acciones exclusivos de Convex no aparecen como resultados calculados por REST.
- [ ] Las pruebas se escriben primero y `pnpm test` pasa para cada etapa cerrada; cualquier verificación adicional queda registrada en la planificación.
- [ ] El humano revisa y aprueba alcance y etapas antes de apply.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación / gate |
| --- | --- | --- |
| Contrato nominalmente similar pero semánticamente distinto | Datos o acciones engañosas | Auditoría por uso y DTO; no declarar equivalencia por nombre. |
| Filtrado jerárquico sin query por padre | Carga excesiva o relaciones incorrectas | No inventar parámetro; elevar decisión según evidencia de volumen/UX. |
| Offset sin orden estable documentado | Duplicados, omisiones o navegación inconsistente | Pruebas y gate contractual; no prometer estabilidad sin evidencia. |
| Actor local ausente o confundido con autenticación | Mutaciones sin atribución válida | Configuración explícita y fail-closed; producción/autorización fuera de alcance. |
| Retirada prematura de Convex | Flujos incompletos durante la transición | Cortes por adapter con pruebas; eliminación definitiva sólo al cierre, sin solución dual entregada. |
| Semánticas Convex reconstruidas en frontend | Divergencia silenciosa de negocio | Prohibición explícita y proceso humano de brechas. |
| Proxy interpretado como solución productiva | Despliegue no funcional o inseguro | Etiquetar proxy como desarrollo local; producción fuera de alcance. |
| Regresión visual o de teclado | Pérdida de productividad y accesibilidad | Reutilizar sistema de diseño y contratos de teclado; regresión focalizada por slice. |
| Cambio transversal superior a 400 líneas | Sobrecarga de revisión | Forecast antes de apply y pausa `ask-on-risk`; cadena/estrategia permanece diferida. |

## Rollback

El rollback será por unidades de entrega/versionado y nunca mediante fallback runtime:

1. Mantener cada etapa en un corte revisable con sus pruebas y cambios de wiring juntos.
2. Si una etapa falla sus criterios antes de entrega, revertir ese corte frontend y mantenerla fuera del alcance aceptado.
3. No retirar Convex del árbol hasta que los consumidores incluidos estén migrados y verificados; una vez entregada la retirada final, cualquier reversión se hará revirtiendo la entrega completa correspondiente, no conservando dos backends activos.
4. Ningún rollback modificará backend, producción, diseño/recovery u otros changes.

## Gate de planificación y entrega

La siguiente fase debe convertir estas etapas en tareas con forecast de líneas y dependencias. Bajo la preferencia `ask-on-risk` y presupuesto de 400 líneas, si el forecast indica riesgo se pausará antes de apply para que el humano elija la estrategia de entrega. La estrategia de cadena continúa diferida y no es un bloqueo de esta propuesta.

Antes de implementar, el parent presentará al humano el alcance y las etapas para revisión, tal como fue acordado.

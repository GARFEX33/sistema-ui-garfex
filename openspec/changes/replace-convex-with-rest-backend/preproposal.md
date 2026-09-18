# Prepropuesta confirmada — Reemplazo de Convex por REST

## Estado del handoff

**Handoff humano confirmado: proposal puede iniciar.** Las respuestas explícitas fijan el límite de producto, integración y entrega necesario para redactar la propuesta sin una nueva entrevista.

No se autoriza implementación todavía. El parent prometió una revisión humana del alcance y las etapas antes de apply.

## Decisiones humanas confirmadas

| Tema | Decisión | Consecuencia para la propuesta |
| --- | --- | --- |
| Semántica visible | Adaptar la UI visible a la semántica REST. | No se clonan cursores, evaluaciones, fingerprints, estados efectivos, razones, violaciones ni otras salidas exclusivas de Convex. |
| Retirada de Convex | Eliminar Convex completamente y sin fallback. | No quedan imports, dependencias, configuración, RPC, pruebas conectadas ni rutas alternativas Convex al finalizar; tampoco se agregan mocks runtime o sustitutos locales. |
| `actor` local | Usar un actor de prueba local configurable; el valor real aún no fue proporcionado. | Las mutaciones deben fallar de forma cerrada y comprensible cuando falte configuración; nunca se inventa una identidad. |
| Navegador local | Configurar un proxy de desarrollo Vite hacia `http://localhost:8090`. | La integración frontend usa una ruta local del mismo origen en desarrollo; no se atribuye a este proxy una solución de despliegue. |
| Producción | El despliegue y la topología de producción quedan fuera de alcance. | No se diseñan ni modifican CORS, reverse proxy, infraestructura, variables o despliegues productivos. |
| Frontera backend | El repositorio y los internals del backend son un límite estricto. | Nunca se inspeccionan ni modifican. La documentación y el contrato públicos ya suministrados son la única frontera de integración. |
| Capacidades ausentes | Toda capacidad requerida que no figure en la API se reporta al humano. | El humano decide y solicita el cambio al equipo backend; frontend no inventa endpoints, reglas ni sustituciones funcionales silenciosas. |
| Investigación opcional | Fue ofrecida y no seleccionada. | No se realiza investigación adicional ni acceso al backend para completar proposal. |
| Entrega | `ask-on-risk`, presupuesto de 400 líneas y estrategia de cadena diferida. | La decisión se toma después del forecast de tareas y antes de apply si existe riesgo; no bloquea proposal. |
| Flujo SDD | Planificación aceptada, con revisión previa a implementación. | Proposal y planificación pueden avanzar, pero apply espera revisión humana de alcance y etapas. |

## Enmienda humana explícita — G9 resuelto y mutaciones restauradas

Esta enmienda sustituye el bloqueo temporal de administración base de `OPCION`. La evidencia pública corregida resuelve G9 y el humano autoriza explícitamente crear, editar, desactivar y reactivar desde **Opciones**.

| Tema | Evidencia o decisión confirmada | Consecuencia para proposal |
| --- | --- | --- |
| Activación de fila | Una fila de atributo enfocada se activa con `Enter` o `Space` nativos. | Abrir el `Dialog` conservando semántica de teclado nativa. |
| Estructura del diálogo | El `Dialog` contiene las pestañas internas **Detalle** y **Opciones**. | **Detalle** conserva la proyección Core read-only; **Opciones** administra registros base compartidos. |
| Evidencia pública de cierre | El GET `OPCION` filtrado por `DEFAULT` + `insulation` devuelve ids `14`–`20`, todos estrictamente positivos, con `characteristic.id=3`, `optionSet.id=1` y `hasNext=false`. | Marcar **G9 resuelto** para la ventana completa verificada, sin filtrar, traducir ni reparar ids o referencias. |
| Autorización humana | Habilitar crear, editar, desactivar y reactivar opciones base compartidas. | Exponer sólo `POST`, `PUT`, deactivate y reactivate documentados, sujetos a validación estricta. |
| Límite de lifecycle | `DELETE` permanente permanece fuera de alcance. | No ofrecer, llamar ni simular borrado destructivo. |
| Actor | Se conserva el actor local configurable. | Toda mutación falla cerrada antes de HTTP si el actor falta, está vacío o es inválido; el actor no prueba permisos. |
| Concurrencia | Revisiones e ids conservan su forma contractual string. | Enviar `expectedRevision` sin coerción; un `409` queda visible y no sobrescribe ni reintenta silenciosamente. |
| Reconciliación | Lista base y proyección efectiva son autoridades distintas. | Tras éxito o `409`, refetch de ambas; cero actualización optimista, recomposición local o aceptación de respuestas stale. |
| Alcance global | `OPCION` es compartida por conjunto o característica. | Mantener antes y durante acciones una advertencia visible y accesible de que el impacto no es local al Tipo. |
| Proyección efectiva | Los datos efectivos permanecen de sólo lectura y Core-authoritative. | Nunca parchear, derivar ni evaluar localmente reglas o resultados efectivos. |
| Frontera backend | REST sigue siendo la única integración runtime y Convex permanece prohibido. | No inventar endpoints, fallback, dual write ni petición exploratoria. |

### Límite de aceptación tras resolver G9

El slice se acepta sólo si la fila abre el `Dialog` con `Enter`/`Space`, **Detalle** y **Opciones** son accesibles, y la pestaña administrativa permite exclusivamente crear, editar, desactivar y reactivar records base válidos. Debe conservar actor fail-closed, concurrencia por `expectedRevision`, conflicto `409` explícito, refetch de lista base más proyección efectiva, protección stale y advertencia global persistente. `DELETE` permanente sigue excluido.

## Invariantes para las siguientes fases

1. Preservar el diseño visual y los recorridos de teclado existentes sólo donde el contrato REST soporte el dato o comando correspondiente.
2. Tratar la migración como una adaptación contractual, no como una copia literal de Convex.
3. Validar respuestas REST como datos no confiables y conservar revisiones, identificadores y referencias según el tipo y las restricciones documentadas por cada operación; el cierre de G9 no autoriza coerción, reparación ni relajación de schemas.
4. No afirmar equivalencia de una operación por similitud nominal: atributos, unidades, políticas, lifecycle y relaciones deben verificarse uso por uso contra la evidencia pública suministrada.
5. Registrar explícitamente cada brecha de API, su impacto visible y el flujo bloqueado; escalarla al humano sin diseñar la solución backend.
6. Aplicar TDD estricto durante una implementación posterior, usando `pnpm test` como comando base de verificación.
7. Preservar cambios no relacionados, configuración existente, código fuente, diseño, recovery y otros changes mientras se redactan los artefactos de planificación.

## Gate siguiente

Proposal debe presentar alcance, no objetivos, riesgos, rollback, criterios de aceptación y etapas acotadas con pruebas. Antes de apply, el humano revisará el alcance y las etapas; después del forecast se aplicará `ask-on-risk` si la estimación supera el presupuesto de 400 líneas.

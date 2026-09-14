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

## Invariantes para las siguientes fases

1. Preservar el diseño visual y los recorridos de teclado existentes sólo donde el contrato REST soporte el dato o comando correspondiente.
2. Tratar la migración como una adaptación contractual, no como una copia literal de Convex.
3. Validar respuestas REST como datos no confiables y conservar revisiones e identificadores como `string`.
4. No afirmar equivalencia de una operación por similitud nominal: atributos, unidades, políticas, lifecycle y relaciones deben verificarse uso por uso contra la evidencia pública suministrada.
5. Registrar explícitamente cada brecha de API, su impacto visible y el flujo bloqueado; escalarla al humano sin diseñar la solución backend.
6. Aplicar TDD estricto durante una implementación posterior, usando `pnpm test` como comando base de verificación.
7. Preservar cambios no relacionados, configuración existente, código fuente, diseño, recovery y otros changes mientras se redactan los artefactos de planificación.

## Gate siguiente

Proposal debe presentar alcance, no objetivos, riesgos, rollback, criterios de aceptación y etapas acotadas con pruebas. Antes de apply, el humano revisará el alcance y las etapas; después del forecast se aplicará `ask-on-risk` si la estimación supera el presupuesto de 400 líneas.

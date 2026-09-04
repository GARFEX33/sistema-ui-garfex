# Mejoras técnicas pendientes

Deuda técnica y oportunidades de eficiencia detectadas durante el desarrollo. No son decisiones de producto (eso vive en `erp-first-stage-design-brief.md` sección 22) — son cosas que funcionan hoy pero conviene atacar cuando haya lugar.

**Regla:** cada vez que se detecte una mejora técnica (eficiencia, deuda, bug menor no urgente) y se decida no atacarla en el momento, se documenta acá antes de seguir. No alcanza con mencionarlo en la conversación — si no queda escrito acá, se pierde.

## Backend (`sistema-garfex`)

- **N+1 al cargar atributos de un Tipo.** Al abrir la pestaña Atributos, el frontend pide `listarAsignacionesAtributo` una vez y después hace **una consulta `obtenerDefinicionAtributo` por cada asignación**, y **una `listarOpcionesAtributo` por cada definición de tipo OPCION**. Con N atributos son hasta `1 + N + N` pedidos en cascada. Se detectó inspeccionando la red real con 4 atributos → 4 `obtenerDefinicionAtributo` + 4 `listarOpcionesAtributo`.
  - Arreglo: un endpoint que acepte una lista de IDs y devuelva definiciones en lote (y opcionalmente opciones agrupadas por definición).
  - No se puede resolver sólo desde el frontend: requiere un endpoint nuevo en `sistema-garfex`.

## Frontend (`sistema-ui-garfex`)

- **Condición de carrera en `restoreFocusNextFrame`** (`src/shared/keyboard/focusRestoration.ts`). Dispara la restauración de foco dos veces: inmediata + una más vía `requestAnimationFrame` en el frame siguiente. Si el usuario interactúa con otra fila/elemento entre el cierre del diálogo y ese segundo disparo tardío, el disparo tardío puede "robar" el foco de vuelta al opener original y reactivar su contexto por error (visto como fila de atributo equivocada quedando "activa" para los atajos E/O/Enter). Es angosto — requiere timing exacto entre cerrar un diálogo y la siguiente interacción — pero real. No se corrigió el mecanismo en sí, sólo se lo evitó en los tests que lo exponían.

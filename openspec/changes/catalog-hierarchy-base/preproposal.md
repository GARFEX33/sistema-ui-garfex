# Prepropuesta — Base jerárquica del catálogo

## Estado

`ready-for-proposal`

La propuesta no debe ejecutarse hasta resolver las decisiones agrupadas de este documento. Research permanece no seleccionado porque esta sesión no tiene grants de evidencia externa y la autoridad funcional ya fue suministrada por el usuario.

## Decisiones confirmadas

- Cambio: `catalog-hierarchy-base`.
- Alcance: Clases, Familias y Tipos; workstation solamente.
- Jerarquía autoritativa: `Clase → Familia → Tipo → Recurso`.
- `Familia.claseRecursoId → Clase`.
- `Tipo.familiaRecursoId → Familia`.
- `Recurso.tipoRecursoId → Tipo`, fuera de implementación en este cambio.
- Familia→Clase y Tipo→Familia son relaciones padre inmutables.
- Recurso→Tipo será reclasificable mediante un flujo futuro controlado y auditable.
- Quedan fuera: Recursos, unidades, definiciones/opciones/asignaciones de atributos, reglas, presentación, compatibilidad, publicación, responsive/tablet/móvil/touch y estados no aprobados.
- No se inventarán endpoints, DTOs, permisos, reglas de nombres/unicidad, errores ni datos.
- OpenPencil recovery pertenece a otro agente; este cambio no modifica `design.op`, `design-recovered.op` ni `recovery/**`.

## Evidencia y readiness

- `explore.md` está completo.
- El frontend y su tooling están disponibles.
- La API backend ya existe y está accesible; no es necesario inspeccionar su repositorio. Sus endpoints, DTOs, errores y permisos se verificarán directamente contra la API antes de implementar integración.
- Las capturas congeladas conocidas contienen la jerarquía UI invertida y no pueden autorizar selectores o breadcrumbs finales.
- La imagen disponible puede usarse como referencia visual preliminar para proposal/spec, no como aprobación final de diseño.
- Readiness visual: pendiente de recuperación y posterior auditoría/corrección OpenPencil.
- Readiness de implementación conectada: condicionada a inspeccionar el contrato expuesto por la API, sin inventarlo.

## Decisiones resueltas

1. Proposal y specs pueden comenzar ahora con la jerarquía y contratos de dominio confirmados.
2. La imagen actual se usa sólo como referencia preliminar; `design` y `apply` esperan recuperación, auditoría y corrección OpenPencil.
3. La API backend existe y está accesible. La integración verificará el contrato directamente contra la API; no se requiere acceso al repositorio backend.

## Gate de propuesta

`sdd-proposal` está autorizado. Cualquier criterio de lectura o alta real debe distinguir el comportamiento de producto confirmado de los detalles de transporte aún no inspeccionados. `design` y `apply` permanecen bloqueados hasta aprobar la evidencia OpenPencil corregida; la integración permanece condicionada a verificar la API real.

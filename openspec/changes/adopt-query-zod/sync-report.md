# Sincronización completada — adopt-query-zod

El cambio verificado `adopt-query-zod` se sincronizó en las especificaciones canónicas sin archivar ni modificar artefactos de implementación. La reconciliación conserva simultáneamente el acceso Convex feature-local aprobado de Catálogo, la prohibición de Query en Catálogo y la autorización acotada de React Query para pilotos remotos feature-locales, cuyo único piloto actual es la lista de Resources Master.

## Resultado

| Campo                      | Valor                                                 |
| -------------------------- | ----------------------------------------------------- |
| Estado                     | `synced`                                              |
| Cambio                     | `adopt-query-zod`                                     |
| Artifact store             | `openspec`                                            |
| Dominios sincronizados     | `frontend-foundation`, `resources-master-remote-list` |
| Siguiente fase recomendada | `sdd-archive`                                         |
| Carpeta del cambio         | Permanece activa; no fue movida a `archive/`          |

## Estado y contexto de acción

- El estado autoritativo recibido identifica exactamente `adopt-query-zod`, con apply `all_done`, verify `all_done`, sync `ready` y archive bloqueado sólo hasta completar sync.
- El progreso informado es 29/29 tareas y 4/4 acciones parent-owned.
- La ejecución es `auto`, con estrategia `ask-on-risk`, cadena `feature-branch-chain` y excepción de tamaño ya autorizada para el commit de formato `b42e4ee`.
- El alcance de edición quedó restringido a archivos OpenSpec del workspace autoritativo `/home/garfex/PROGRAMACION/sistema-ui-garfex`; todos los destinos canónicos están dentro de ese alcance.
- No se detectó un contexto `workspace-planning` ni una selección de cambio ambigua.
- `verify-report.md` existe y declara disposición completa con todas las puertas finales aprobadas; no contiene blockers de verificación sin resolver.
- `openspec/config.yaml` no define `rules.sync` adicionales.

## Archivos canónicos actualizados

| Archivo                                               | Operación                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `openspec/specs/frontend-foundation/spec.md`          | Merge de dos requisitos ADDED y reemplazo completo de un requisito MODIFIED por nombre exacto. |
| `openspec/specs/resources-master-remote-list/spec.md` | Creación de la capacidad canónica mediante copia exacta del spec verificado del cambio.        |

## Requisitos fusionados

### frontend-foundation

**ADDED**

1. `React Query limitado a estado remoto autorizado`
2. `Límite del provider de consultas`

**MODIFIED**

1. `Ausencia de infraestructura y dominio especulativos`

El requisito modificado conserva el acceso feature-local aprobado de Catálogo a la superficie pública verificada `catalogoAdmin/jerarquia`, sin autoridad frontend. Autoriza React Query sólo como cache remota feature-local en pilotos aprobados bajo el provider mínimo, mantiene a Catálogo fuera de Query y conserva las prohibiciones de Zustand, Redux, context global de dominio, persistencia de cache, clientes Convex transversales, wrappers Query genéricos, backend/API propios, repositorios, casos de uso, gateways y facades.

**REMOVED**

- Ninguno.

### resources-master-remote-list

Como no existía spec canónica para el dominio, se incorporó completa la capacidad verificada con estos requisitos:

1. `Validación de transporte equivalente para la lista`
2. `Identidad y alcance de la lectura remota`
3. `Búsqueda y paginación conservan el contrato actual`
4. `Estados de lectura, errores y reintentos preservados`
5. `Refresco posterior a creación confirmada`
6. `Aislamiento de cache y propiedad de estado preservada`

No hubo requisitos MODIFIED ni REMOVED en este dominio.

## Colisiones activas y orden elegido

- `catalog-hierarchy-base` también toca `specs/frontend-foundation/spec.md`.
- El orden elegido y autorizado es sincronizar ahora `adopt-query-zod` y mantener `catalog-hierarchy-base` activo para su ciclo posterior.
- Su delta reconciliado ya expresa ambas excepciones: Catálogo conserva únicamente su acceso Convex feature-local aprobado, Catálogo no usa Query y el único piloto Query actual es la lista de Resources Master.
- Antes de sincronizar `catalog-hierarchy-base`, todavía debe revisarse el diff canónico resultante para confirmar que ese delta actualizado no elimina los dos requisitos ADDED por `adopt-query-zod`.
- No hay otra colisión activa para `resources-master-remote-list`.

## Aprobación destructiva

- No existen deltas `REMOVED` ni `RENAMED`.
- El reemplazo completo del requisito MODIFIED `Ausencia de infraestructura y dominio especulativos` es un bloque amplio. La tarea delegada autorizó explícitamente esta reconciliación y fijó la semántica exacta que debía conservarse.
- No quedan blockers destructivos.

## Validación ejecutada

| Comando o comprobación                                                                                                                                                      | Resultado                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `pnpm exec vitest run tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts`                                                  | PASS — 2 archivos, 9 pruebas.     |
| `pnpm exec prettier --check openspec/specs/frontend-foundation/spec.md openspec/specs/resources-master-remote-list/spec.md openspec/changes/adopt-query-zod/sync-report.md` | PASS.                             |
| `git diff --check`                                                                                                                                                          | PASS — sin errores de whitespace. |
| Comparación byte a byte entre el spec de cambio y el nuevo spec canónico `resources-master-remote-list`                                                                     | PASS.                             |
| Aserciones de unicidad de los tres requisitos fusionados y presencia de las excepciones/prohibiciones de frontend                                                           | PASS.                             |
| Inspección de deltas para `RENAMED Requirements`                                                                                                                            | PASS — ninguno presente.          |

No se ejecutó la suite runtime completa durante sync porque esta fase sólo modificó Markdown canónico; la verificación completa previa permanece registrada como aprobada en `verify-report.md`.

## Riesgos residuales

1. `catalog-hierarchy-base` sigue activo sobre el mismo dominio; su futura sincronización debe respetar el orden y revisar el diff canónico antes de escribir.
2. El bloque narrativo `context` de `openspec/config.yaml` todavía describe la prohibición histórica absoluta de Query; no se modificó porque esta tarea restringió cambios a la sincronización canónica y el archivo no contiene `rules.sync`.
3. La carpeta del cambio continúa activa deliberadamente; el archivo sólo queda listo para `sdd-archive`, que debe ejecutarse como fase separada.

## Próximo paso

Ejecutar `sdd-archive` para `adopt-query-zod` sin volver a aplicar sus deltas canónicos.

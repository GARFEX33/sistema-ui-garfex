# Archive report — adopt-query-zod

## Resultado

**Estado de archivo: pass.** El cambio `adopt-query-zod` queda archivado después de verificar que la implementación, la verificación y la sincronización canónica estaban completas. La carpeta conserva el conjunto íntegro de artefactos OpenSpec y se movió sin volver a aplicar deltas canónicos.

- **Fecha de archivo:** `2026-09-05`
- **Artifact store:** `openspec`
- **Ruta archivada:** `openspec/changes/archive/2026-09-05-adopt-query-zod/`
- **Cambio activo archivado:** `adopt-query-zod`
- **Commit de sincronización canónica:** `93653c3`
- **Corrección del verification envelope:** `145eb2e`

## Estado estructurado y contexto de acción

| Campo                    | Resultado                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Selección activa         | Exacta y no ambigua: `adopt-query-zod`                                                              |
| Dependencia apply        | `all_done`                                                                                          |
| Dependencia verify       | `all_done`                                                                                          |
| Dependencia sync         | `all_done`                                                                                          |
| Estado archive           | `ready` → archivado                                                                                 |
| Tareas de implementación | `29/29` completas                                                                                   |
| Acciones parent-owned    | `4/4` completas                                                                                     |
| Artifact authority       | OpenSpec en el workspace autoritativo                                                               |
| Modo de ejecución        | `auto`; no se detectó `workspace-planning`                                                          |
| Alcance de edición       | Sólo artefactos OpenSpec del proyecto; no se tocaron configuración Pi/Gentle ni tooling de revisión |
| Acciones remotas         | No autorizadas ni ejecutadas: push, PR, remote o release                                            |

El estado de verificación admitido usa `gentle-ai.verify-result/v1`, verdict `pass`, blockers `0`, critical findings `0`, requirements `9/9` y scenarios `13/13`.

## Artefactos leídos y preservados

Se leyeron y se preservan todos los artefactos del cambio:

- `proposal.md`
- `explore.md`
- `design.md`
- `tasks.md`
- `apply-progress.md`
- `verify-report.md`
- `sync-report.md`
- `specs/frontend-foundation/spec.md`
- `specs/resources-master-remote-list/spec.md`
- `archive-report.md`

También se leyó `openspec/config.yaml`; sus reglas de archivo no exigieron acciones adicionales.

## Sincronización canónica

La sincronización ya estaba completa antes de este archivo. No se re-aplicaron ni se modificaron deltas canónicos durante el archivado.

Dominios sincronizados:

- `frontend-foundation`
- `resources-master-remote-list`

Requisitos sincronizados:

- **ADDED:** `React Query limitado a estado remoto autorizado`
- **ADDED:** `Límite del provider de consultas`
- **MODIFIED:** `Ausencia de infraestructura y dominio especulativos`
- **REMOVED:** ninguno

El spec canónico de `resources-master-remote-list` está presente y coincide con el spec del cambio. El spec canónico de `frontend-foundation` conserva la excepción feature-local de Catálogo, la prohibición de Query en Catálogo y la autorización de Query sólo para el piloto remoto de Resources.

No hubo una nueva operación destructiva en esta fase. La aprobación y reconciliación del reemplazo MODIFIED ya constan en `sync-report.md` y `verify-report.md`.

## Cadena de commits y evidencia final

La cadena local registrada en `verify-report.md` es:

`ce1bc82` → `e228ae9` → `69c4805` → `3420ae5` → `edf163f` → `a11b8d0` → `d516dcf` → `2531a17` → `713157c` → `2e21be0` → `5cea30a` → `2080fe0` → `16320b7` → `16ad5b3` → `b42e4ee` → `6721a11` → `93653c3` → `145eb2e`

- `b42e4ee`: excepción de tamaño autorizada por el usuario; 970 líneas cambiadas, sólo formato equivalente.
- `93653c3`: sincronización canónica completa.
- `145eb2e`: corrección/admisión del verification envelope final.

Evidencia final all-green:

- `pnpm test`: `359/359`
- `pnpm typecheck`: pass
- `pnpm lint`: pass, cero warnings
- `pnpm format:check`: pass
- `pnpm build`: pass
- `pnpm verify:runtime-bundle`: pass, 4 archivos
- Resources E2E enfocado: `7/7`

## Tareas y advertencias

No quedan líneas de implementación `- [ ]` en el `tasks.md` persistido del cambio. Las casillas históricas sin marcar que aparecen dentro de la instantánea cronológica de `apply-progress.md` no son tareas actuales y no alteran el gate final.

Advertencias y seguimientos:

1. `catalog-hierarchy-base` sigue activo y comparte el dominio `frontend-foundation`; su colisión normativa fue reconciliada en su delta y no bloquea este archivo.
2. El texto de tareas obsoleto de `catalog-hierarchy-base` conserva seguimiento externo pendiente: prosa de Unit 4A/4B y conteos `65/57/8` que reportan 8 casillas restantes. Ese archivo queda sin modificar y requiere ownership separado.
3. No se modificaron runtime source, tests, dependencias, contenido canónico, configuración del proyecto ni tooling de revisión para archivar este cambio.

## Validaciones de archivo

- Conjunto completo de artefactos preservado bajo la ruta fechada convencional.
- Presencia de specs canónicos confirmada para ambos dominios.
- Ausencia de otro cambio activo con el nombre exacto `adopt-query-zod` confirmada después del movimiento.
- Colisión activa de dominio distinta identificada únicamente como `catalog-hierarchy-base` y documentada arriba.
- Comprobación Prettier acotada de `archive-report.md`, `sync-report.md` y los dos specs canónicos: pass.
- La comprobación histórica de todos los Markdown del cambio reportó diferencias de estilo preexistentes en `proposal.md`, `design.md` y `explore.md`; no se reformatearon para preservar el conjunto de evidencia y evitar cambios no necesarios.
- `git diff --check`: pass.
- No se creó commit de archivo.

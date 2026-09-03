# Exploración — Base de jerarquía del catálogo

## Resolución de habilidades

- `skill_resolution: paths-injected`.
- Se cargó la habilidad solicitada desde `/home/garfex/.pi/agent/git/github.com/Gentleman-Programming/gentle-pi/skills/gentle-ai/SKILL.md`.
- CodeGraph no está disponible en las herramientas de esta ejecución y no existe `.codegraph/` visible; por ello, tras la comprobación inicial, se usó inspección directa de archivos como fallback degradado.

## Resumen ejecutivo

El repositorio ya no es greenfield: contiene la base React/Vite/TypeScript, shell workstation, ruta `/bandeja`, entrada mínima de comandos, Storybook aislado, pruebas Vitest/RTL/Playwright y configuración OpenSpec archivada. No existe todavía una feature de Catálogo ni integración backend. La nueva propuesta debe conservar la arquitectura feature-first y añadir únicamente la base navegable de **Clase → Familia → Tipo**, sin convertir fixtures, capturas o supuestos de contrato en datos de producto.

La autoridad de producto confirmada para esta exploración es:

```text
Clase
└── Familia (claseRecursoId → Clase)
    └── Tipo (familiaRecursoId → Familia)
        └── Recurso (tipoRecursoId → Tipo) [fuera de alcance]
```

Los documentos o snapshots que muestran `Familia → Clase → Tipo` son evidencia UI conocida como obsoleta y no deben guiar la propuesta. La reclassification de Recurso → Tipo queda reservada para un flujo futuro controlado y auditable.

## Evidencia consultada

| Evidencia | Hallazgo | Tratamiento |
|---|---|---|
| `openspec/config.yaml` | Fija el modelo canónico `Clase → Familia → Tipo → Recurso`, la arquitectura feature-first, backend autoritativo y ausencia de API/persistencia/stores/query layer especulativos. | Restricción vigente y autoridad funcional. |
| `openspec/specs/frontend-foundation/spec.md` | Exige límites compartidos mínimos, React/TanStack/React Aria, accesibilidad WCAG 2.2 AA y verificación honesta. | Baseline técnico aplicable. |
| `openspec/specs/operations-inbox/spec.md` | La Bandeja es el único destino ya implementado y sus fixtures permanecen fuera del runtime. | Límite de regresión y patrón de aislamiento. |
| `openspec/changes/archive/2026-08-30-bootstrap-operations-inbox/*` | Describe el árbol real, el shell, las pruebas y las fronteras de la implementación anterior. | Baseline archivado; no ampliar Bandeja. |
| `src/app/*`, `src/features/operations-inbox/*`, `src/shared/*` | La app sólo registra `/` y `/bandeja`; el shell tiene navegación persistente con Bandeja activa; no hay cliente de backend ni dominio de catálogo. | Puntos de extensión reales. |
| `package.json` y `tests/*` | Scripts `test`, `test:e2e`, `build`, `lint`, `format:check`, `typecheck`, Storybook y comprobaciones arquitectónicas ya están declarados. | Tooling disponible en configuración; no se ejecutó. |
| `n2033.png`, `n2082.png`, `n2137.png`, `n2192.png` | Capturas de configuración de catálogo, atributos, presentación y creación de Recursos. Todas visualizan la jerarquía stale `Familia → Clase → Tipo → Recurso`. | Contexto visual congelado; no autoridad de relaciones. |
| `docs/erp-first-stage-design-brief.md` | Define gobierno del catálogo, navegación contextual y el modelo textual también presentado como `Clase → Familia → Tipo → Recurso`; incluye estados y superficies futuras. | Principios y contexto; no habilita estados fuera del alcance aprobado. |
| `docs/manual_identidad_garfex_ai_canonico_v2_digital.md` | Define identidad, tokens claros, contraste, foco, tipografía fallback y reglas de activos. | Autoridad visual transversal. |
| Superficie de recuperación OpenPencil | No fue necesaria para esta exploración y no se inspeccionaron archivos bajo `recovery/**`. | Recovery queda bajo ownership de otro agente y no es autoridad de producto para esta propuesta. |

En esta fase sólo se inspeccionó la evidencia enumerada fuera de `recovery/**`; no se abrieron archivos de recuperación ni artefactos OpenPencil, y no se modificó nada bajo `recovery/**`. La recuperación pertenece a otro agente, no se usa como autoridad de producto y la propuesta no puede depender de una supuesta readiness de diseño recuperado.

## Estado actual de arquitectura

Árbol relevante observado:

```text
src/
├── app/
│   ├── providers/AppProviders.tsx
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── routes/__root.tsx
│   ├── routes/index.tsx
│   ├── routes/bandeja.tsx
│   └── shell/{AppShell,CommandEntry}.tsx
├── features/operations-inbox/OperationsInboxEntry.tsx
└── shared/
    ├── design-system/{GarfexLogoNegative,tokens.css}
    └── keyboard/{keyboardArbitration,useGlobalCommandShortcut}
```

La extensión natural es una feature local `src/features/catalog-hierarchy/` y rutas nuevas bajo `src/app/routes/`, manteniendo en `app/shell` sólo navegación y composición transversal realmente compartida. No hay fundamento para crear `api/`, `domain/`, `entities/`, `repositories/`, `services/`, stores globales, casos de uso, facades o una capa Query.

El route tree es generado por TanStack Router y actualmente sólo contiene `/` y `/bandeja`. Cualquier ruta de Catálogo debe auditarse contra la relación corregida y no debe agregar rutas de Recursos ni pantallas de atributos, unidades, reglas, presentación, compatibilidad o publicación.

## Qué está confirmado y qué falta

### Confirmado

- Alcance limitado a Clases, Familias y Tipos.
- Orden de creación: Clase, luego Familia dentro de Clase, luego Tipo dentro de Familia.
- `Familia.claseRecursoId` referencia Clase.
- `Tipo.familiaRecursoId` referencia Familia.
- Relaciones Familia → Clase y Tipo → Familia inmutables.
- Recursos, su listado/edición/reclasificación y `Recurso.tipoRecursoId` quedan fuera de este cambio.
- La UI debe ser workstation; no se deben declarar responsive, tablet, móvil ni touch.
- Shell, navegación persistente, breadcrumbs y selectores deben expresar Clase → Familia → Tipo.
- La autoridad final de validación y relaciones es el backend externo.
- La identidad visual debe usar tema claro y tokens canónicos; Nexa/RNS Sanz siguen sin verificarse y corresponde fallback documentado.

### Ausente y necesario antes de implementar comportamiento de datos

- Endpoints reales de lectura, creación y selección de Clase, Familia y Tipo.
- DTOs, nombres de campos completos, identificadores, payloads, respuestas y paginación/ordenamiento.
- Errores de validación, conflicto, duplicado, relación inexistente y disponibilidad del backend.
- Permisos/autorización por operación y manejo de acceso denegado.
- Reglas de nombres, unicidad, estado, archivado o activación, si existen.
- Semántica de respuesta después de crear y actualización del contexto de navegación.
- Estados aprobados de loading, vacío, error, sin resultados y creación fallida.
- Diseño OpenPencil visual aprobado después de corregir toda ocurrencia de `Familia → Clase → Tipo`.
- Criterios de auditoría para futuras mutaciones y, especialmente, para cualquier reclasificación de Recursos.

Por tanto, la propuesta está lista para fijar problema, límites, riesgos y preguntas de contrato, pero no para inventar una implementación conectada ni criterios de aceptación de backend.

## Auditoría de snapshots y preparación visual

Las cuatro capturas congeladas son útiles para reconocer la intención de una mesa de configuración, pero presentan la jerarquía stale `Familia → Clase → Tipo → Recurso`. También incluyen capacidades explícitamente fuera de alcance: atributos, opciones, presentación, identidad, unidades, reglas, creación de Recursos, recursos derivados y acciones de guardado.

Conclusión visual: **readiness pendiente**. No existe evidencia visual aprobada y corregida que pueda autorizar pantallas de esta change. Esta fase no abrió archivos bajo `recovery/**` ni artefactos OpenPencil, y no modificó esa superficie; OpenPencil recovery está bajo ownership de otra sesión. La propuesta no puede depender de recovered design readiness y debe exigir una auditoría posterior de selectores, breadcrumbs, encabezados y dependencias antes de diseño/apply.

## Capacidad inicial más pequeña y coherente

Se recomienda separar la entrega en dos umbrales:

1. **Primer slice honesto: navegación/presentación estructural solamente.** Añadir la entrada workstation de Catálogo y una superficie de navegación que nombre Clase, Familia y Tipo en el orden correcto, con breadcrumbs y selección local únicamente si el diseño aprobado lo define. No cargar ni guardar entidades reales, no mostrar fixtures con apariencia productiva y no representar estados no aprobados. Este slice puede avanzar sin contratos de backend sólo si la presentación se mantiene explícitamente no productiva y no comunica datos, permisos o disponibilidad.
2. **Segundo slice condicionado por contratos:** lectura y creación de Clase → Familia → Tipo, con selects dependientes, validación y estados observables, únicamente después de recibir endpoints/DTOs/errores/permisos y aprobación visual corregida. La creación debe respetar el orden y enviar el padre autorizado; la UI no debe permitir editar la relación una vez creada.

No se recomienda implementar creación con mocks, datos locales o endpoints inferidos. Tampoco se recomienda una pantalla poblada basada en `n2033.png`–`n2192.png`, porque esas imágenes mezclan jerarquía stale y capacidades fuera del alcance.

## No objetivos explícitos para la propuesta

- No implementar Recursos, listado/edición/creación/reclasificación de Recursos ni su relación reconfigurable.
- No implementar unidades, atributos, opciones, reglas, presentación, identidad técnica, compatibilidad ni publicación.
- No inventar endpoints, DTOs, payloads, errores, permisos, reglas de unicidad, estados o datos de catálogo.
- No introducir backend, persistencia, stores globales, Query, repositories, use cases, gateways o facades.
- No modificar relaciones padre después de crear Familia o Tipo.
- No convertir snapshots stale en autoridad ni modificar OpenPencil/recovery.
- No diseñar ni declarar responsive, tablet, móvil, touch o estados no aprobados.
- No alterar la Bandeja ni importar sus fixtures a la feature de catálogo.
- No ejecutar tests/builds en esta fase; la implementación futura debe reportar evidencia TDD real.

## Tooling y extensión feature-first

El baseline declara y configura:

- Vitest y React Testing Library para rutas, shell, componentes y teclado.
- Playwright y axe para el recorrido workstation 1440×980.
- Storybook/Vitest para composiciones visuales aisladas.
- TanStack Router con route tree generado.
- ESLint, Prettier, typecheck y build.
- Pruebas arquitectónicas que impiden fixtures de Storybook en runtime y consumidores ficticios de TanStack Form/Table/Virtual.

La futura feature debe seguir el patrón local de `features/operations-inbox`, añadir pruebas enfocadas de navegación/relaciones y dejar los fixtures visuales fuera de `src`. TanStack Form/Table/Virtual sólo deben entrar si una responsabilidad aprobada los necesita directamente; el baseline instalado no obliga a usarlos.

## Riesgos y decisiones para propuesta

| Riesgo | Mitigación |
|---|---|
| Repetir la jerarquía stale de snapshots | Tratar la autoridad corregida como única fuente y auditar cada selector, breadcrumb y dependencia. |
| Inventar contratos por ausencia de backend | Bloquear lectura/creación real hasta recibir endpoints, DTOs, errores y permisos. |
| Confundir presentación con datos | Mantener el primer slice sin entidades ficticias o etiquetar cualquier fixture como evidencia aislada. |
| Permitir relaciones padre mutables por comodidad UI | Hacer Familia y Tipo dependientes del padre al crear y de solo lectura después. |
| Adelantar Recursos por la relación Tipo → Recurso | Excluir Resource de rutas, componentes y pruebas de este cambio. |
| Diseñar estados no aprobados | Registrar loading/vacío/error/sin resultados/permiso como preguntas abiertas, no implementarlos por inferencia. |
| Deriva de OpenPencil durante recuperación concurrente | Mantener write isolation y declarar visual readiness pendiente. |
| Expandir shared infrastructure | Usar rutas y feature local; promover abstracciones sólo con un segundo consumidor aprobado. |

## Recomendación de readiness

- **Propuesta:** procedente, siempre que explicite las brechas y no presente contratos inventados.
- **Spec:** parcialmente procedente para navegación estructural; bloqueada para escenarios de lectura/creación hasta resolver contratos y estados.
- **Design:** bloqueado hasta disponer de evidencia OpenPencil corregida y aprobada.
- **Apply:** no procedente todavía para comportamiento backend; sólo podría autorizarse después de proposal/spec/design y contratos.
- **Visual/design readiness:** pendiente por recuperación concurrente y auditoría de jerarquía.
- **Tests/build:** no ejecutados por instrucción de la fase.

## Límite de rollback recomendado

El primer slice sería reversible retirando rutas, navegación y componentes de `features/catalog-hierarchy/`, sin migraciones ni datos persistidos. Cualquier integración backend posterior debe mantener el límite de rollback por feature y no alterar la Bandeja ni los artefactos OpenPencil.

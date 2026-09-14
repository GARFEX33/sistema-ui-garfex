# Exploración — Reemplazar Convex por backend REST

## Resultado corregido

La migración debe retirar Convex por completo, sin fallback, y preservar la estructura UI cuando exista una equivalencia REST. No es una sustitución mecánica: REST usa records tipados, revisiones `string` y offset/limit, mientras que Convex entrega RPC cursor y semántica más rica. La política propuesta para lo que REST no expone es **adaptar la UI al backend, no clonar ni simular Convex**.

La atribución inicial de `GET /v1/catalog/descriptors` al parent fue prematura. Tras aquella exploración, el parent realizó exitosamente esa lectura y compartió los descriptors y extractos OpenAPI incorporados en [api-contract-evidence.md](api-contract-evidence.md). Este documento ya no presenta Recursos, Unidades, Attributes o CRUD básico como contratos REST ausentes; distingue sus equivalencias por auditar de las semánticas Convex que sí permanecen sin sustituto confirmado.

La prepropuesta queda detenida en [preproposal.md](preproposal.md): **proposal no puede iniciar** hasta que haya confirmación humana de las decisiones de producto/topología pendientes y se haya ofrecido investigación opcional.

## Estado de fase

- **Change:** `replace-convex-with-rest-backend`
- **Fase:** exploración inicial, corregida por gate
- **`skill_resolution`:** `paths-injected`
- Se leyeron las habilidades inyectadas, `openspec/config.yaml`, artefactos activos relevantes, adapters, pantallas y pruebas.
- CodeGraph no está expuesto como MCP ni CLI; se usó inspección directa de archivos como fallback degradado. No se ejecutaron comandos.
- Esta sesión no tiene shell/red: no ejecutó `curl`, no repitió OpenAPI/descriptors y no hizo peticiones mutantes. La evidencia HTTP y OpenAPI procede del parent, quien inició el servicio sólo con el `./run-dev.sh` provisto por el usuario y consultó endpoints públicos; no se afirma inspección de internals.
- No se ejecutaron tests ni build, y no se probó conectividad de navegador.
- Sólo se escribieron artefactos bajo `openspec/changes/replace-convex-with-rest-backend/`. No hubo cambios source/backend/configuración, ni modificaciones a `catalog-hierarchy-base`, `keyboard-first-resource-creation`, diseño o `recovery/**`.

## Alcance y límites confirmados

| Decisión | Estado |
| --- | --- |
| Conservar UI y recorridos existentes | Confirmado, condicionado a que exista un dato/comando REST equivalente. |
| Eliminar Convex completamente | Confirmado; no puede quedar dependencia, import, URL, RPC, prueba conectada ni guarda que lo exija. |
| Sin fallback | Confirmado; no se permiten mocks runtime, persistencia local ni backend alternativo. |
| Backend objetivo | REST PostgreSQL en `http://localhost:8090`; no se modifica en esta change. |
| Semántica Convex sin equivalente | Debe adaptarse/eliminarse de UI, no fabricarse en frontend. |
| Changes y recovery concurrentes | Fuera de alcance y protegidos. |

## Mapa completo de Convex

### Runtime

| Archivo | Contrato UI | Dependencia/operaciones actuales |
| --- | --- | --- |
| `src/features/catalog-hierarchy/catalogHierarchy.api.ts` | Lista y creación de Clase, Familia y Tipo mediante `CatalogHierarchyApi` y seam inyectable. | `ConvexHttpClient`, referencias Convex y `VITE_CONVEX_URL`; 6 RPC: tres listados y tres creaciones de jerarquía. |
| `src/features/catalog-hierarchy/catalogTypeAttributes.api.ts` | Definiciones, asignaciones y opciones de atributos; create/update/lifecycle. | Mismos imports/configuración Convex; 14 RPC de `catalogoAdmin/atributos`. |
| `src/features/resources-master/resourcesMaster.api.ts` | Lista/búsqueda/detalle/CRUD/lifecycle de Recursos; contexto jerárquico, unidades, atributos y evaluación de creación. | Mismos imports/configuración Convex; 19 RPC en Recursos, Jerarquía, Unidades y Atributos. |

Los factories se crean en `CatalogHierarchyScreen.tsx` y `ResourcesMasterScreen.tsx`. Los adapters feature-locales e inyectables son un límite útil que debe mantenerse, pero sus transportes y parsers tienen que sustituirse por HTTP REST y DTOs REST validados.

### Paquete, configuración, pruebas y guardas

| Superficie | Estado actual | Impacto de la migración |
| --- | --- | --- |
| `package.json` y `pnpm-lock.yaml` | `convex@1.45.0` es dependencia directa/bloqueada. | Retirar dependencia y regenerar lockfile al final de una sustitución probada. |
| Entorno | Los adapters leen `VITE_CONVEX_URL`. La lectura directa de `.env.example` fue bloqueada por protección de datos sensibles. | Sustituir por configuración REST sólo tras decidir topología/origen; no asumir clave. |
| Tests conectados | `tests/unit/catalogHierarchyConnectedTransport.test.ts`, `tests/integration/catalogHierarchyConnectedTransport.test.ts` y `tests/integration/activeUnitResourceCreation.connected.test.ts` importan/usaban Convex. | Reemplazar por pruebas REST de frontera y conectividad únicamente cuando entorno/CORS estén decididos. |
| Guardas de arquitectura | `catalogHierarchyBoundaries`, `runtimeFixtureIsolation` y `queryZodBoundaries` exigen/permiten imports Convex explícitos. | Cambiarlas de forma deliberada: REST permitido sólo en adapters feature-locales aprobados y prohibido fuera de ellos; conservar aislamiento de fixtures/storage. |
| `CLAUDE.md` y OpenSpec histórico | Narran Convex como autoridad previa. | No reescribir historia ni changes ajenos; una fase posterior decide documentación vigente. |

El inventario contiene 39 ocurrencias de operación en los tres adapters y 36 nombres RPC únicos, por la duplicación de las tres lecturas jerárquicas entre features.

## Contratos REST y equivalencias

### Catálogo, relaciones, atributos y unidades

Los descriptors ahora confirman los kinds y referencias necesarias para Clase→Familia→Tipo:

```text
CLASE
└─ FAMILIA.class → CLASE
   └─ TIPO.family → FAMILIA (scopedBy class; incluye class → CLASE)
```

`CLASE` requiere además `plural` y `slug`, no sólo código/nombre; esto es una diferencia funcional que proposal debe resolver. Los descriptors también confirman `CARACTERISTICA`, `CONJUNTO_OPCIONES`, `OPCION`, `RELACION_OPCIONES`, `UNIDAD`, `POLITICA_UNIDAD`, `APLICABILIDAD` y `PRESENTACION`, junto con sus refs/valores requeridos. Por ello no se debe afirmar que atributos o unidades sean inexistentes en REST.

La lista de catálogo ahora documenta `classCode?` y `familyCode?`: `classCode` acota FAMILIA/TIPO por el código de su padre Clase y `familyCode` acota TIPO por el código de su padre Familia; para kinds sin ese padre, el parámetro se ignora silenciosamente. El parent comprobó públicamente `FAMILIA?classCode=MATERIAL` (CONDUCTORES y CANALIZACIONES, ambas con referencia Clase MATERIAL) y `TIPO?familyCode=CONDUCTORES` (CABLE, con Clase MATERIAL y Familia CONDUCTORES), en ambos casos con flags `false,false`. **G1 queda resuelto** para esas cargas dependientes; la migración debe usar códigos, no IDs, y no enviar filtros que el kind ignora. Esto no prueba orden estable ni exhaustividad de paginación (G2), ni semánticas de efectividad (G3).

### Recursos

REST sí documenta:

- listado/búsqueda por `scope`, `text`, códigos de Clase/Familia/Tipo y offset/limit;
- `ResourcePage { resources, hasPrevious, hasNext }`;
- lectura por `{classCode}/{identityV1}` y descripción `{ description }`;
- create, update, deactivate y reactivate;
- Resource con `id`, `identityV1`, `scope`, `naturalUnit`, `active`, `revision: string` y `attributes` por código;
- errores `{ error }` con estatus 400, 404, 409, 422, 503 y 500.

Eso cubre CRUD/lifecycle básico, búsqueda y unidades como superficies REST disponibles. Pero no confirma equivalencia directa con la UX Convex de filtros por ID, ownership, policy/selección de unidad, asignaciones efectivas, valores permitidos, diagnóstico de clasificación o creación evaluada.

### Semánticas que no deben clonarse

| Convex/UI actual | Estado REST | Tratamiento obligatorio |
| --- | --- | --- |
| `continuationCursor`, `isExhausted` | REST usa offset/limit y `hasPrevious`/`hasNext` | Sustituir controlador; no sintetizar cursor. Confirmar orden estable y reset de offset. |
| `effective`, `effectiveReasons` | Sin equivalente comunicado | Ocultar/adaptar; no derivar localmente. |
| `aggregateStatus`, `violations`, diagnóstico de clasificación | Sin equivalente comunicado | No mostrar como si el backend lo hubiera calculado. |
| Evaluación `VALID`/`INCOMPLETE`/`INVALID`, fingerprint y `CATALOG_CHANGED` | Sin equivalente comunicado | Bloquea la equivalencia de seguridad del flujo keyboard-first hasta una decisión/producto. |
| IDs/revisiones opacos/números | REST exige strings | Cambiar parsers, tipos y concurrencia sin coerción. |
| Actor en mutaciones | `actor` requerido; sin `securitySchemes` | Confirmar proveniencia antes de mutar; no inferir autenticación. |

## Riesgos y mitigaciones

| Riesgo | Mitigación/gate |
| --- | --- |
| ACAO no observado para `localhost:5173` | Resolver topología CORS/origen/proxy y probar desde navegador. Un proxy Vite aislado no soluciona producción. |
| Paginación offset sin orden estable | Confirmar orden, offset inicial, límites y comportamiento tras mutar; pruebas de deduplicación/contexto. |
| Migrar atributos/unidades por nombre, no por semántica | Auditar CRUD/lifecycle/descriptors contra cada uso actual antes de aplicar. |
| Conservar indicadores Convex con datos locales | Aplicar la política explícita de adaptación, no clonación. |
| Actor no definido | Confirmación humana de fuente/formato/autorización. |
| Retirar Convex antes de la cobertura REST | Mantener cada adapter reversible hasta que sus pruebas de frontera y regresión pasen; sin fallback. |
| Cambio de guardas excesivamente amplio | Permitir HTTP únicamente en adapters feature-locales y mantener prohibición para app/shared/stories. |
| Exceder 400 líneas | Pausar bajo `ask-on-risk` antes de apply para decisión de entrega; no seleccionar cadena ni excepción ahora. |

## Etapas mínimas, no autorizadas todavía

1. **Frontera de Catálogo (lectura):** DTOs descriptors/records, pagination offset, relaciones y pruebas RED de URL/parsers/errores.
2. **Catálogo mutante:** create/update/lifecycle confirmados, actor/revisión y adaptación de UI de semánticas no disponibles.
3. **Atributos y unidades:** auditar mappings de kinds genéricos contra asignaciones/políticas/opciones actuales y migrar sólo las equivalencias verificadas.
4. **Recursos lectura:** listado/búsqueda/detalle por códigos, offset y `ResourcePage`, preservando Query ya autorizada sin emular cursor.
5. **Recursos mutantes/keyboard-first:** create/update/lifecycle REST; resolver la ausencia de evaluación/fingerprint antes de preservar ese flujo.
6. **Eliminación final:** dependencia, lock, config, imports, tests conectados y excepciones Convex; sólo después de la matriz REST, E2E/axe y calidad completa.

No es una recomendación de apply: las etapas describen cortes comprobables cuando el gate humano se cierre.

## Readiness

- **Exploración:** persistida y corregida.
- **Investigación adicional:** opcional, ofrecida pero no seleccionada en `preproposal.md`.
- **Proposal/spec/design/apply:** bloqueados hasta confirmación humana de actor, política visible de semánticas ausentes, topología de navegador y estrategia de entrega por presupuesto.
- **Rollback futuro:** por adapter/slice; Convex sólo se elimina tras sustituir con evidencia cada consumidor, sin fallback.

## Actualización posterior — unidades 6–7 reclasificadas parcialmente

El parent aportó evidencia pública de `/docs`, OpenAPI, descriptors y GET seguros en vivo, registrada íntegramente en [api-contract-evidence.md](api-contract-evidence.md). Esta exploración no reprodujo las lecturas, no accedió a código o repositorio del backend, no ejecutó tests y no hizo mutaciones.

### Hechos nuevos relevantes

- Las páginas offset de catálogo aceptan `typeCode` para `APLICABILIDAD` y `PRESENTACION`, y `optionSetCode` para `OPCION`.
- `GET /v1/catalog/APLICABILIDAD?typeCode=CABLE` devolvió cinco records directos; prueba esa lectura por Tipo observada, no una composición heredada.
- Los descriptors precisan los campos de `APLICABILIDAD`, `PRESENTACION` y `OPCION` ya reflejados en la evidencia: no autorizan campos legacy inferidos.
- La referencia de característica observada conserva `id: "0"` y código `durable`; las características observadas cubren IDs `1` a `8`. Detail-by-ref por `id` no es utilizable, por lo que cualquier búsqueda textual debe validar exactamente el código/ref esperado antes de usar el resultado.

### Reclasificación y corte propuesto

Las unidades 6–7 ya son factibles para una **lectura directa básica** de records públicos y referencias validadas. Esto reemplaza sólo la parte del gate anterior que impedía toda lectura; conserva los gaps y no habilita por sí mismo CRUD/lifecycle ni una equivalencia de UX completa.

1. **Slice 1 — lectura directa:** listas offset de `APLICABILIDAD`, `PRESENTACION` y `OPCION` con `typeCode`/`optionSetCode`, proyectando únicamente campos descriptor-confirmados y refs directas validadas.
2. **Slice 2 — enriquecimiento de definiciones:** enriquecer características sólo con identidad exacta validada, sin confiar en detail-by-ref por `id` ni en coincidencias textuales parciales.

La evaluación efectiva de herencia, sus razones y los valores permitidos continúan bloqueados. No deben simularse, inferirse localmente ni presentarse como equivalentes a Convex.

## Actualización posterior — endpoint efectivo de Tipo

El parent confirmó por OpenAPI y una lectura pública segura que `GET /v1/types/{typeCode}/attributes/effective` requiere `typeCode` como path parameter y `classCode`/`familyCode` como query parameters. OpenAPI documenta también `characteristicCode`, los schemas `EffectiveAttributesResponse`, `EffectiveAttribute`, `CharacteristicDescriptor` y `EffectiveAttributeSource`, y que Core resuelve herencia, orden de presentación y evaluación `CONDITIONAL`; el frontend no debe rederivarlos.

El descriptor de `APLICABILIDAD.mode` admite `REQUIRED`, `OPTIONAL`, `CONDITIONAL` y `FORBIDDEN`. La respuesta viva de `CABLE` devolvió cinco atributos con `characteristic`, `effectiveMode`, `identityParticipates`, `notApplicable`, `position`/`hasPosition`, `optionSetCode`, `source: TYPE` y `rules`.

### Reclasificación acotada

El gap de lectura efectiva G3/G6 queda cerrado **únicamente** para este endpoint: una futura frontera REST puede presentar el resultado efectivo emitido por Core sin composición ni evaluación local. No se autoriza implementación por esta exploración.

Mutaciones, reevaluación disparada por contexto y valores de opción permitidos continúan siendo capacidades distintas y bloqueadas hasta que estén documentadas explícitamente en contrato público. Esta sesión sólo registró evidencia; no hizo mutaciones ni inspeccionó internals.

## Actualización posterior — opciones y evaluación por valores

El parent verificó mediante OpenAPI y POST público en vivo que la descripción de `GET /v1/types/{typeCode}/attributes/effective` lo limita a un baseline estático, sin valores de recurso para evaluar. `EffectiveAttribute` requiere `options: [{ code, label }]`. Core sigue siendo la autoridad: el cliente no puede derivar opciones, modos, prohibiciones ni identidad.

`POST /evaluate` acepta `{ values: ResourceAttribute[] }` y devuelve la misma respuesta del endpoint efectivo. `CatalogValue` incluye `CONTROLLED_OPTION` y `NOT_APPLICABLE`. En la prueba viva, enviar `insulation` como `CONTROLLED_OPTION` con `DESNUDO` produjo `color` y `voltage` `FORBIDDEN`, `notApplicable: true` e `identityParticipates: false`; `TEXT` fue rechazado con 422 y `CODE`/`ENUM` con 400. Los rechazos sólo documentan el comportamiento observado; no deben duplicarse en validación cliente.

### Reclasificación acotada

Los gaps de lectura de opciones permitidas y evaluación con valores quedan cerrados únicamente para los endpoints públicos documentados. Una frontera REST futura puede presentar las `options` de Core y solicitar la evaluación por `POST /evaluate`, consumiendo estrictamente la respuesta del servidor.

Las mutaciones permanecen separadas y sin confirmación por esta evidencia. No se autoriza implementación, ni derivación client-side, por esta exploración.

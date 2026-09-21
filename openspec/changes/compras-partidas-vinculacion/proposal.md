# Propuesta — Compras, partidas y vinculación con recursos

## Estado de la propuesta

`accepted`

Esta propuesta define el alcance funcional y las fronteras contractuales para incorporar Compras al frontend GARFEX. Las cinco decisiones abiertas fueron confirmadas por el usuario el 2026-09-19 (ver última sección). Autoriza continuar hacia `design` y `spec`; no autoriza todavía implementación, cambios backend ni una agregación cliente que sustituya capacidades ausentes de la API.

`skill_resolution: paths-injected`

## Resumen

Incorporar un flujo workstation de Compras que permita importar un CFDI, consultar compras dentro del contexto de un proveedor, abrir sus partidas y resolver su relación con Productos de Proveedor y Recursos Maestro GARFEX.

El flujo autoritativo es:

```text
Compra
└── Partida de compra
    └── Producto del proveedor
        └── Recurso maestro GARFEX
```

La UI conservará visibles y no editables los datos originales disponibles del XML, distinguirá `VINCULADO`, `PENDIENTE`, `CONFLICTO` y `NO_APLICA`, reutilizará Productos de Proveedor existentes y delegará al backend toda validación, matching, equivalencia y transición efectiva.

El contrato actual no ofrece listado global de compras ni listado transversal de partidas pendientes. Por ello, el historial inicialmente soportado será por proveedor y la UI no simulará una bandeja global paginando todos los proveedores. La vista cross-compra de **Partidas pendientes** queda condicionada a un contrato backend adicional.

## Problema y oportunidad

GARFEX recibe información de compra en CFDI, pero el frontend todavía no permite convertir esa evidencia documental en una tarea operativa trazable. Sin esta capacidad, la persona usuaria no puede consultar en un mismo recorrido qué se compró, a quién, en qué documento, a qué precio ni cómo se relaciona con el catálogo técnico.

La ausencia del flujo produce riesgos concretos:

- revisar XML y relaciones mediante herramientas separadas o procedimientos manuales;
- perder contexto entre documento, partida, proveedor, producto comercial y recurso técnico;
- crear vínculos redundantes en vez de reutilizar el conocimiento ya acumulado por proveedor;
- tratar excepciones y conceptos no aplicables sin estados visibles y consistentes;
- duplicar en frontend reglas de matching, validación o equivalencia que pertenecen al backend;
- presentar como global una historia o bandeja que la API actual sólo puede consultar por proveedor o por identificador puntual.

La oportunidad es crear una mesa de trabajo orientada a excepciones: las relaciones conocidas requieren inspección mínima y la atención se concentra en partidas `PENDIENTE` o `CONFLICTO`, siempre con trazabilidad al XML original.

## Intención y resultado de producto

Después del cambio, una persona usuaria podrá:

1. importar un CFDI de compra y comprender si fue creado, ya existía, entró en conflicto o fue rechazado;
2. elegir un proveedor y consultar su historial paginado de compras;
3. abrir una compra y revisar todas sus partidas sin perder el contexto del documento;
4. identificar el estado de cada partida mediante texto y badge semántico, sin depender sólo del color;
5. inspeccionar qué Producto de Proveedor corresponde a la partida y, cuando exista, qué Recurso Maestro tiene vinculado;
6. resolver una partida pendiente vinculando su Producto de Proveedor con un Recurso Maestro;
7. buscar y reutilizar Productos de Proveedor existentes antes de considerar cualquier alta futura;
8. marcar una partida como `NO_APLICA` cuando no corresponde a un recurso maestro;
9. conservar visibles y no editables los datos fiscales, comerciales y de partida recibidos del XML que expone el contrato;
10. reconocer honestamente cuándo una consulta transversal no está disponible por falta de contrato backend.

La experiencia seguirá los principios del brief: teclado como canal principal pero no único, preservación de contexto, trabajo desde excepciones, autoridad backend y separación entre el producto comercial del proveedor y el recurso técnico maestro.

## Contrato de dominio y autoridad

### Relaciones

- una Compra pertenece a un proveedor mediante `supplierId`;
- una Compra contiene Partidas de compra;
- una Partida puede referenciar un Producto de Proveedor mediante `supplierProductId`, actualmente nullable;
- un Producto de Proveedor puede referenciar un Recurso Maestro mediante `resourceId`, actualmente nullable;
- vincular un Producto de Proveedor con un Recurso Maestro puede actualizar en cascada las partidas asociadas de `PENDIENTE` a `VINCULADO`;
- desvincularlo puede actualizar en cascada partidas asociadas de `VINCULADO` a `PENDIENTE`;
- `linkStatus` comunica `PENDIENTE | VINCULADO | NO_APLICA | CONFLICTO` y su transición efectiva sigue siendo responsabilidad del backend.

### Límites de autoridad

- el backend es la única autoridad sobre importación, idempotencia fiscal, validación XML, matching, equivalencias, cascadas y estados efectivos;
- el frontend no deduce un vínculo por coincidencia de SKU, descripción, nombre o código SAT;
- el frontend no convierte montos decimales a aritmética binaria para reconstruir totales: preserva los strings decimales exactos del contrato;
- los ids se preservan como strings decimales y no se coercionan a `number`;
- los datos originales de compra y partida son de sólo lectura;
- una mutación sólo se presenta como exitosa tras respuesta confirmada del backend;
- no se usa actualización optimista para inventar cascadas locales sobre otras partidas.

## Contrato REST verificado

### Importación y consulta de compras

- `POST /v1/purchases`: multipart con `file`, `actor` y `branchId` opcional; `201` para creación, `200` para `alreadyExisted`, `409` cuando un UUID fiscal existente tiene contenido distinto y `422` para XML inválido.
- `GET /v1/purchases/{id}`.
- `GET /v1/purchases/by-uuid/{uuid}`.
- `GET /v1/purchases/{id}/lines`.
- `GET /v1/suppliers/{id}/purchases`: página offset/limit con `purchases`, `hasPrevious` y `hasNext`.

### Productos de Proveedor y vinculación

- `GET /v1/suppliers/{id}/products`: página offset/limit.
- `GET /v1/suppliers/{id}/products/find?sku=...`.
- `GET /v1/supplier-products/{id}`.
- `POST /v1/supplier-products/{id}/link` con `{ actor, resourceId }`.
- `POST /v1/supplier-products/{id}/unlink` con `{ actor }`.
- `POST /v1/purchase-lines/{id}/link-status` con `{ actor, status }` para override manual, incluyendo `NO_APLICA` y resolución de conflicto conforme a la semántica backend.

### Contrato futuro preservado

- `GET /v1/resources/{id}/purchase-history`: historial paginado de precios por Recurso Maestro.

Este change no implementará esa pantalla desde Maestro de Recursos, pero mantendrá separados los DTOs y responsabilidades de Compras para no bloquear una integración futura con ese endpoint.

### Formas de datos relevantes

- `Purchase` conserva identidad, proveedor, sucursal nullable, UUID fiscal, serie/folio, fechas, moneda, tipo de cambio nullable, montos exactos, emisor y metadatos `xml { hash, filename }`.
- `PurchaseLine` conserva número de línea, descripción, SKU de proveedor, código SAT, cantidades, unidad, precios, impuestos, `supplierProductId` nullable y `linkStatus`.
- `SupplierProduct` conserva proveedor, SKU, descripción informativa de último visto, `resourceId` nullable, notas y timestamps.
- los errores conservan `{ error, code, detail }`, con `code` en `INVALID_ARGUMENT | NOT_FOUND | CONFLICT | VALIDATION | INTERNAL`.

Los adapters deberán validar estas formas con Zod en la frontera feature-local y usar el actor REST compartido para mutaciones. Cualquier campo de respuesta no descrito aquí deberá confirmarse contra OpenAPI durante `design/spec`; no se inferirá desde la UI.

## Brechas contractuales explícitas

### G1 — No existe historial global de compras

El contrato sólo permite listar compras mediante `GET /v1/suppliers/{id}/purchases` o consultar una compra puntual por id/UUID. La primera entrega deberá exigir un contexto de proveedor antes de mostrar historial. Podrá llegarse desde Proveedores o mediante una selección explícita, pero no mostrará una supuesta lista global.

Contrato adicional a evaluar por `garfex-api`:

```text
GET /v1/purchases?limit=&offset=&...
→ PurchasePage { purchases, hasPrevious, hasNext }
```

Los filtros y el orden no se especifican en esta propuesta; deberán publicarse explícitamente si se incorpora el endpoint.

### G2 — No existe listado cross-compra de partidas pendientes

No hay endpoint global o paginado para consultar partidas por `linkStatus`. `GET /v1/purchases/{id}/lines` obliga a conocer cada compra y no autoriza recorrer todos los proveedores/compras desde cliente.

La UI no simulará la bandeja descargando o paginando cada proveedor. Una vista operativa real de **Partidas pendientes** requiere un contrato adicional, por ejemplo:

```text
GET /v1/purchase-lines?linkStatus=PENDIENTE&limit=&offset=&...
```

La forma final deberá incluir contexto suficiente de compra y proveedor, paginación estable y los estados/filtros que el backend decida soportar. El precedente `operations-inbox` se revisará en diseño sólo como patrón de navegación transversal; hoy su implementación es una entrada mínima y no define por sí misma tabla, filtros, estado o contrato para esta capacidad.

### G3 — `supplierProductId` nullable sin operación publicada de asignación

El contrato permite buscar Productos de Proveedor existentes y vincular un Producto de Proveedor a un Recurso Maestro, pero no publica una operación que asigne una Partida cuyo `supplierProductId` es `null` a un Producto de Proveedor existente. Vincular el producto al recurso no equivale a asociar esa partida al producto.

La UI sólo podrá completar el flujo de vinculación cuando la partida ya tenga un `supplierProductId`, salvo que `garfex-api` confirme otra semántica o publique una operación específica. No se usará `link-status: VINCULADO` como sustituto de una relación ausente.

### G4 — “XML original visible” no incluye descarga del archivo crudo

El contrato descrito expone metadatos del XML y campos originales de compra/partida, pero no un endpoint para descargar o visualizar el XML crudo. Este change garantizará visibilidad no editable de los datos expuestos; una descarga o visor del archivo original requiere contrato adicional si forma parte de la expectativa de producto.

## Alcance

### Incluido con el contrato actual

- nueva capacidad feature-first de Compras, con `Entry` y `Screen` consistentes con el routing basado en archivos;
- entrada de navegación workstation aprobada para Compras;
- importación multipart de CFDI con actor compartido y `branchId` opcional;
- tratamiento visible y accesible de `201 creado`, `200 ya existente`, `409 conflicto`, `422 XML inválido` y errores contractuales;
- selección o contexto explícito de proveedor antes de listar historial;
- historial paginado de compras de un proveedor, usando `hasPrevious`/`hasNext` sin acumulación o agregación inventada;
- consulta de una compra por id o UUID cuando el recorrido aprobado lo requiera;
- detalle de compra con todas sus partidas;
- información original de compra y partida visible, trazable y no editable;
- badges con texto para `VINCULADO`, `PENDIENTE`, `CONFLICTO` y `NO_APLICA`, respaldados por roles semánticos del Design System y nunca sólo por color;
- detalle de relación Partida → Producto de Proveedor → Recurso Maestro cuando los ids existan;
- búsqueda y selección de Productos de Proveedor existentes dentro del proveedor vigente, sin alta redundante;
- selección de Recurso Maestro reutilizando o componiendo el contrato de `StagedSearchSelector` si la auditoría de diseño confirma que su semántica es compatible;
- vinculación y desvinculación del Producto de Proveedor mediante los endpoints publicados, mostrando las cascadas sólo después de relectura autoritativa;
- override manual de estado únicamente conforme a `link-status`, incluido `NO_APLICA` y el tratamiento backend de `CONFLICTO`;
- teclado, foco, nombres accesibles, mensajes asíncronos y contraste conforme a WCAG 2.2 AA y al contrato canónico de teclado del brief;
- reutilización de `PageHeader`, `WorkCard`, `Field`, `Button`, superficies/dialogs y feedback existentes cuando su contrato semántico aplique;
- actualización explícita de allowlists y guardas arquitectónicas para los adapters Zod/REST, hooks Query y cualquier interacción local de teclado aprobada.

### Condicionado a contrato backend adicional

- historial global de compras sin proveedor previo;
- vista transversal y operativa de **Partidas pendientes** entre compras;
- asociación de una partida con `supplierProductId: null` a un Producto de Proveedor existente;
- descarga o visualización del XML crudo.

Estas capacidades no se implementarán mediante agregación cliente, persistencia local, fixtures runtime ni cambios de estado que aparenten relaciones inexistentes.

## Comportamiento de UX propuesto con la API actual

1. **Entrada a Compras:** ofrece importar CFDI y entrar al historial por proveedor.
2. **Historial:** antes de cargar resultados, exige elegir o recibir un proveedor; la tabla muestra sólo su ventana paginada real.
3. **Detalle:** conserva proveedor y documento visibles mientras se inspeccionan partidas.
4. **Resolución:** una partida muestra primero sus datos XML; después, en una zona diferenciada, la relación comercial/técnica vigente y las acciones permitidas.
5. **Reutilización:** la búsqueda de Producto de Proveedor se limita al proveedor de la compra. La coincidencia por SKU puede ayudar a encontrar, pero no confirma automáticamente ninguna relación.
6. **Vinculación:** con Producto de Proveedor identificado, la persona elige un Recurso Maestro y confirma la mutación; la UI relee los datos afectados antes de reflejar la cascada.
7. **No aplica:** la acción comunica su impacto y actualiza el estado sólo tras confirmación backend.
8. **Pendientes transversales:** no se presentan resultados parciales como si fueran globales. La forma visible de esta ausencia —destino diferido o estado bloqueado informativo— queda como decisión de producto antes de diseño.

## No objetivos

- APU o análisis de precios unitarios;
- comparación avanzada, ranking o recomendación de proveedores;
- política automática de precio para cotizaciones;
- UI del historial de compras/proveedores dentro de un Recurso Maestro;
- creación de reglas de matching, equivalencias, normalización, validación fiscal o cálculo de montos en frontend;
- alta de Productos de Proveedor, porque no forma parte del contrato suministrado;
- edición de datos originales de Compra o Partida;
- descarga/visor de XML crudo sin endpoint publicado;
- listado global de compras o partidas mediante barrido cliente de proveedores;
- persistencia local, caché como autoridad, fixtures runtime, fallback o backend propio;
- stores globales, repositorios, casos de uso, gateways o facades especulativos;
- permisos, roles, autenticación o autorización no presentes en el contrato suministrado;
- responsive, tablet, móvil o touch-specific en este slice, salvo nueva aprobación explícita;
- modificación de `garfex-api`, OpenAPI, OpenPencil o artefactos de recuperación;
- cambios no relacionados en Catálogo, Maestro de Recursos, Proveedores o Bandeja.

## Capacidades y deltas de especificación

### Nueva capacidad: `purchase-management`

La especificación canónica deberá cubrir:

- importación idempotente de CFDI y sus resultados HTTP observables;
- historial de compras limitado por proveedor;
- detalle de compra y partidas;
- presentación inmutable de información documental;
- representación accesible de los cuatro estados de vinculación;
- inspección de Producto de Proveedor y Recurso Maestro;
- vinculación/desvinculación de Producto de Proveedor;
- override manual de estado dentro de la semántica publicada;
- límites observables ante relaciones nullable y contratos ausentes.

### Nueva capacidad futura condicionada: `pending-purchase-lines`

Se documentará como dependencia y no como comportamiento disponible hasta que exista contrato paginado cross-compra. Cuando el backend lo publique, `spec` deberá definir contexto de proveedor/documento, filtros, orden, acciones, estados parciales y preservación de posición sin convertir `operations-inbox` en una plantilla asumida.

### Deltas transversales previsibles

- navegación/shell para el nuevo destino Compras;
- guardas de arquitectura para permitir exclusivamente los nuevos adapters Zod/REST y hooks Query en rutas declaradas;
- contrato de teclado sólo si se aprueban acciones contextuales nuevas; no se añadirán listeners globales fuera de `KeyboardController`;
- Design System para roles semánticos de los cuatro estados, únicamente si los tokens/componentes existentes no cubren la necesidad real y con su documentación correspondiente.

## Áreas afectadas

### Producto y UX

- importación de CFDI;
- historial de compras por proveedor;
- detalle de compra y tabla/lista de partidas;
- resolución de estados y relaciones;
- navegación a una futura bandeja transversal;
- feedback de éxito, idempotencia, conflicto, validación y error.

### Frontend previsto

- nueva frontera bajo `src/features/` para Compras;
- nuevas rutas TanStack Router y entrada de navegación;
- adapters REST y schemas Zod feature-locales;
- hooks Query acotados para ventanas paginadas, detalle y mutaciones;
- composición con Proveedores y Maestro de Recursos mediante contratos existentes, sin mover lógica de dominio a `shared`;
- primitivas existentes de `src/shared/ui/` y tokens de `src/shared/design-system/tokens.css`;
- pruebas focalizadas de adapters, hooks, estados, rutas, teclado, accesibilidad y regresión;
- allowlists de `queryZodBoundaries.test.ts`, `restTransportBoundaries.test.ts` y, sólo si aplica, `keyboardBoundaries.test.ts` y guardas feature-locales nuevas.

La auditoría mínima confirmó que `operations-inbox` es hoy sólo una entrada semántica básica y no una implementación reutilizable de bandeja transversal. También confirmó que las guardas actuales enumeran de forma cerrada los archivos autorizados para `fetch`, Zod, React Query y teclado, por lo que el diseño deberá planear sus extensiones deliberadamente.

## Dependencias y gates

1. **Contrato base de Compras — satisfecho:** los endpoints y schemas enumerados fueron verificados en OpenAPI de `garfex-api`.
2. **Decisión de historial — pendiente de confirmación:** aceptar proveedor obligatorio mientras no exista listado global.
3. **Vista de pendientes — bloqueada por API:** no puede prometerse una lista cross-compra funcional sin endpoint adicional.
4. **Partidas sin Producto de Proveedor — bloqueadas parcialmente:** falta confirmar o ampliar el contrato para asociar una partida nullable a un producto existente.
5. **Alcance de XML original — pendiente de confirmación:** distinguir campos/metadatos visibles de acceso al archivo crudo.
6. **Diseño:** deberá revisar `operations-inbox`, `proveedores` y `StagedSearchSelector` por contrato semántico, no sólo semejanza visual.
7. **Apply:** antes de implementar deberá existir forecast de revisión; con presupuesto de 400 líneas y estrategia `ask-on-risk`, cualquier riesgo de excederlo requiere pausa y decisión humana sobre entrega.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación / gate |
| --- | --- | --- |
| Presentar historial parcial como global | Decisiones operativas basadas en datos incompletos | Exigir proveedor y rotular su contexto; no agregar cliente-side. |
| Simular Partidas pendientes con barridos | Carga no acotada, duplicados y paginación falsa | Bloquear la vista funcional hasta contar con endpoint paginado cross-compra. |
| Vincular una partida nullable sin contrato | Estado `VINCULADO` sin relación comercial real | No usar override como sustituto; elevar G3 a backend/producto. |
| Crear Productos de Proveedor redundantes | Fragmentación del historial comercial | Buscar y reutilizar productos existentes; alta queda fuera de alcance. |
| Reimplementar matching o equivalencias | Divergencia silenciosa respecto del backend | Mostrar sugerencias/datos publicados sin confirmar relaciones automáticamente. |
| Ocultar el XML durante la resolución | Pérdida de trazabilidad y decisiones incorrectas | Mantener los campos originales disponibles y no editables junto a la relación. |
| Interpretar strings decimales como `number` | Pérdida de precisión monetaria o de ids | Validar y conservar strings contractuales; sólo formatear para presentación. |
| Reflejar cascadas de forma optimista | UI inconsistente con otras partidas | Releer el estado autoritativo después de link/unlink/override. |
| Badges dependientes sólo de color | Barrera de accesibilidad y ambigüedad | Combinar texto, semántica y contraste; auditar tokens antes de crear roles nuevos. |
| Copiar `operations-inbox` sin auditarlo | Arquitectura o UX falsa para una bandeja transversal | Revisarlo en diseño como precedente de navegación únicamente. |
| Ampliar allowlists de forma indiscriminada | Debilitamiento de fronteras arquitectónicas | Autorizar rutas exactas y bindings mínimos para cada adapter/hook. |
| Superar 400 líneas de revisión | Sobrecarga y baja verificabilidad | Forecast en tasks y pausa `ask-on-risk` antes de apply. |

## Rollout y rollback

El rollout posterior deberá avanzar por capacidades verificables, no por una fachada global incompleta:

1. frontera REST y resultados de importación;
2. historial por proveedor y detalle de compra;
3. partidas y estado documental de sólo lectura;
4. inspección y vinculación soportada de Producto de Proveedor/Recurso Maestro;
5. override `NO_APLICA` y tratamiento de conflicto;
6. vista transversal sólo después de contar con contrato backend suficiente.

Cada corte seguirá TDD estricto y conservará juntos adapter, comportamiento visible y pruebas. La secuencia exacta pertenece a `design/tasks` y no queda autorizada como implementación por esta propuesta.

El rollback frontend podrá retirar rutas, navegación, feature, adapters y hooks de Compras sin migraciones locales ni cambios backend. No intentará deshacer importaciones o vinculaciones ya aceptadas por la API: esos efectos son datos de negocio autoritativos y requerirían operaciones backend explícitas. Si una integración resulta incompatible, se retirará la acción afectada antes que sustituirla con persistencia, matching o estados locales.

## Medidas de éxito

La especificación y verificación posteriores deberán demostrar, como mínimo:

1. Un CFDI puede enviarse como multipart con actor y sucursal opcional, y la UI distingue creación, idempotencia, conflicto de contenido, XML inválido y error.
2. Ninguna petición mutante sale cuando falta el actor requerido por el contrato compartido.
3. El historial exige un proveedor y pagina exclusivamente con `hasPrevious`/`hasNext`; nunca se presenta como lista global.
4. Una compra puede abrirse y muestra sus partidas con contexto visible de proveedor, documento, fecha, moneda y totales disponibles.
5. Cada partida mantiene visibles y no editables descripción, SKU, código SAT, cantidad, unidad, precio, importe, descuentos e impuestos disponibles.
6. Los cuatro estados se comunican mediante texto y badge perceptible sin depender sólo del color.
7. Cuando existen las relaciones, la UI muestra claramente Partida → Producto de Proveedor → Recurso Maestro.
8. La búsqueda de Producto de Proveedor queda acotada al proveedor vigente y no confirma por sí sola una coincidencia de SKU.
9. Vincular o desvincular usa únicamente los endpoints publicados y refleja la cascada tras relectura backend.
10. `NO_APLICA` y la resolución de `CONFLICTO` usan únicamente `link-status` según su semántica publicada, sin inventar una relación a recurso.
11. Una partida con `supplierProductId: null` no se presenta como resoluble por selección hasta que exista un contrato de asociación confirmado.
12. No existe agregación cliente sobre todos los proveedores ni una bandeja cross-compra que aparente completitud.
13. Montos e ids conservan sus strings contractuales y los adapters rechazan respuestas incompatibles.
14. Los controles son operables por teclado, tienen nombre accesible, foco visible y feedback asíncrono conforme a WCAG 2.2 AA.
15. La implementación reutiliza componentes/tokens existentes o documenta la necesidad semántica de cualquier extensión.
16. Las guardas arquitectónicas mantienen `fetch`, Zod, Query y teclado dentro de allowlists exactas.
17. Catálogo, Proveedores, Maestro de Recursos, Bandeja y el endpoint futuro de historial por recurso permanecen compatibles y sin lógica de negocio duplicada.

## Ronda de preguntas de propuesta y decisiones — resueltas

El usuario confirmó las cinco decisiones abiertas el 2026-09-19. `design/spec` deben partir de estas resoluciones sin reabrirlas:

1. **Historial inicial — confirmado: proveedor obligatorio.** "Historial de compras" exige seleccionar o recibir un proveedor y se rotula explícitamente como historial de ese proveedor. No se simula un listado global mientras G1 siga abierto.
2. **Partidas pendientes — confirmado: superficie bloqueada informativa.** La entrada de navegación a "Partidas pendientes" es visible pero muestra una superficie que explica la dependencia del contrato cross-compra aún no publicado (G2), sin listar resultados parciales ni agregación cliente-side.
3. **Partidas sin producto — confirmado: bloquear resolución y pedir el contrato.** Toda partida con `supplierProductId: null` se muestra pero no es resoluble por selección hasta que `garfex-api` confirme o publique una operación Partida → Producto de Proveedor (G3). No se usa `link-status` como sustituto de esa relación ausente para estas partidas.
4. **XML original — confirmado: alcanza con campos + metadatos.** Mostrar todos los campos originales del XML disponibles en el contrato (`Purchase`, `PurchaseLine`) más `xml.hash`/`xml.filename` satisface este slice. No se requiere descarga/visor del archivo XML crudo (G4 queda documentado como gap futuro, no bloqueante).
5. **Desvinculación — confirmado: `unlink` entra en el primer slice.** La UI expone `POST /v1/supplier-products/{id}/unlink` con su cascada `VINCULADO → PENDIENTE`, releyendo el estado autoritativo tras la mutación, igual que `link`.

Estas decisiones no justifican lógica provisional en frontend. `design/spec` deben mantener G1–G4 como límites observables (con G4 ahora no bloqueante para este slice) y separar las capacidades implementables de las dependientes de evolución de `garfex-api`.

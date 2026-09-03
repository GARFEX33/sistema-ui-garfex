# Contrato de API — Base jerárquica del catálogo

## Estado y procedencia

Este artefacto registra el contrato relevante verificado para `catalog-hierarchy-base`. La fuente autoritativa seleccionada por decisión de producto es la superficie pública Convex `catalogoAdmin/jerarquia`.

La evidencia proviene de una ejecución exitosa de `npx convex function-spec`. Por tanto, este documento confirma nombres de funciones, validadores de argumentos y formas declaradas de respuesta observadas en esa especificación. No confirma comportamiento runtime, permisos efectivos, datos existentes, mensajes de error ni tratamiento UX.

Una investigación parent-owned fresca, sólo de lectura, contrastó el backend `convex@1.45.0`, sus declaraciones generadas, la implementación y una respuesta runtime vacía. Verificó específicamente que la entrada `cursor` es opcional y tiene primitivo `string | null`, y que la salida `continuationCursor` tiene primitivo `string | null`. Ese contraste no verifica paquete o URL frontend, transporte frontend, autenticación fuera de la prueba pública adicional, ni limpieza disposable; tampoco afirma estabilidad del cursor ni comportamiento ante cursores inválidos.

## Superficie seleccionada

Sólo las operaciones públicas de navegación, lectura y creación de Clase, Familia y Tipo forman parte del contrato de este cambio.

### Clase

- `catalogoAdmin/jerarquia:crearClase({ activo?, clave, descripcion?, nombre })`
- `catalogoAdmin/jerarquia:obtenerClase({ claseRecursoId })`
- `catalogoAdmin/jerarquia:listarClases({ cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`

### Familia

- `catalogoAdmin/jerarquia:crearFamilia({ activo?, claseRecursoId, clave, descripcion?, nombre })`
- `catalogoAdmin/jerarquia:obtenerFamilia({ familiaRecursoId })`
- `catalogoAdmin/jerarquia:listarFamilias({ claseRecursoId?, cursor?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`

### Tipo

- `catalogoAdmin/jerarquia:crearTipo({ activo?, clave, descripcion?, familiaRecursoId, nombre })`
- `catalogoAdmin/jerarquia:obtenerTipo({ tipoRecursoId })`
- `catalogoAdmin/jerarquia:listarTipos({ cursor?, familiaRecursoId?, modo?: "ALL" | "ACTIVE" | "INACTIVE", pageSize? })`

## Formas de respuesta verificadas

Las operaciones de listado devuelven:

```ts
{
  continuationCursor,
  isExhausted,
  items,
}
```

Las operaciones de creación devuelven:

```ts
{
  disposition: "CREATED",
  item,
}
```

Los items compartidos de Clase, Familia y Tipo exponen:

- `activo`
- `clave`
- `descripcion?`
- `effective`
- `effectiveReasons[]`
- `id`
- `nombre`
- `revision`

Familia añade:

- `claseRecursoId`

Tipo añade:

- `familiaRecursoId`
- `aggregateStatus`
- `violations`

La evidencia disponible no autoriza a inferir significados adicionales, enumeraciones internas o reglas UX para `effective`, `effectiveReasons`, `aggregateStatus` o `violations`. El primitivo del cursor sí está verificado como `string | null` en la entrada opcional `cursor` y la salida `continuationCursor`; la estabilidad y el comportamiento ante cursor inválido siguen sin demostrarse.

## Restricciones de producto sobre el transporte

Estas restricciones son deliberadamente más estrictas que lo que otras funciones administrativas puedan admitir en sus validadores:

- la jerarquía de producto es `Clase → Familia → Tipo`;
- al crear una Familia, el frontend debe enviar la `claseRecursoId` explícita del contexto;
- al crear un Tipo, el frontend debe enviar la `familiaRecursoId` explícita del contexto;
- Familia→Clase es inmutable después de la creación;
- Tipo→Familia es inmutable después de la creación;
- el frontend no debe exponer ni enviar campos de padre en operaciones de actualización, aunque los validadores administrativos de actualización los acepten como opcionales;
- este cambio sólo puede usar las funciones aquí seleccionadas para navegación, lectura y creación; la existencia de funciones adicionales no amplía su alcance;
- el backend sigue siendo autoridad sobre validación efectiva y persistencia.

## Exclusiones expresas

Quedan fuera de este contrato y de este cambio:

- actualización de Clase, Familia o Tipo;
- activación o desactivación de Clase, Familia o Tipo;
- Recursos y cualquier API de Recursos;
- definiciones, opciones o asignaciones de atributos;
- APIs de snapshot publicado;
- unidades, reglas, presentación, compatibilidad, publicación y reclasificación;
- creación o modificación de funciones Convex;
- persistencia local, fixtures runtime o fallbacks frontend que sustituyan la API.

La presencia de funciones de actualización, activación o desactivación en `catalogoAdmin/jerarquia` está reconocida, pero no autoriza controles, rutas ni llamadas para esas capacidades.

## Incógnitas restantes

`function-spec` no establece y este documento no inventa:

- errores runtime, códigos, clases de fallo o mensajes concretos;
- roles, autenticación o respuestas reales de acceso denegado fuera de las tres creaciones públicas verificadas;
- existencia, volumen, orden real o calidad de los datos;
- reglas de unicidad, normalización o límites de texto no visibles en los validadores registrados;
- límites efectivos de `pageSize`, estabilidad del cursor o comportamiento ante cursores inválidos;
- semántica de ausencia para las operaciones `obtener*`;
- consecuencias observables de padres inexistentes, inactivos o no efectivos;
- comportamiento ante latencia, fallos parciales o concurrencia;
- significado de negocio y presentación de estados agregados, razones o violaciones;
- estados visuales, textos, recuperación, foco o feedback posterior a la creación.

Estas incógnitas permanecen como gates de evidencia runtime y de aprobación de producto/visual. No invalidan el contrato nominal ya verificado, pero impiden especificar mensajes o experiencias concretas sin evidencia adicional.

## Evidencia runtime disposable (persistida)

Una verificación funcional completada usó una copia temporal del backend con Convex `1.45.0`, estado aislado local al cwd y puertos temporales `33210`/`33211`. La identidad de prueba fue `anonymous-agent`; la autoridad disponible en `3210` permaneció `anonymous-sistema-garfex`. Las funciones y el esquema se publicaron únicamente en el estado disposable. Ese entorno, sus credenciales y sus puertos fueron destruidos al finalizar; no es una URL ni un despliegue durable del producto.

La lectura administrativa autenticada devolvió, para Clase, Familia y Tipo vacíos, `{items:[], continuationCursor:null, isExhausted:true}`. En una única cadena autorizada de entidades inactivas Clase→Familia→Tipo, cada creación devolvió `{disposition:'CREATED',item}`, con IDs distintos, relaciones padre exactas, `activo:false` y `revision:1`; `obtener*` coincidió con cada item creado. La forma observada fue: campos comunes de Clase; Familia añade `claseRecursoId`; Tipo añade `familiaRecursoId`, `aggregateStatus` y `violations`. `descripcion` opcional estuvo ausente, no fue `null`; los items inactivos devolvieron `effective:false` y `effectiveReasons:['INACTIVE']`; Tipo devolvió `aggregateStatus:'NOT_EVALUATED'` y `violations:[]`.

Con `modo:'INACTIVE'` y `pageSize:1`, la primera página de cada nivel incluyó el item de prueba, un `continuationCursor` string y `isExhausted:false`; la segunda página en el mismo contexto fue vacía, con cursor `null` y agotada. La longitud del cursor no es parte del contrato. La autoridad en `3210` permaneció vacía bajo lectura anónima.

Una verificación pública adicional, independiente de la lectura administrativa, usó un `ConvexHttpClient` plano contra el endpoint disposable con `auth:none`, cero llamadas `setAuth` y sin inyección de token, clave administrativa, credencial ni header. Ejecutó exactamente `crearClase`, `crearFamilia` y `crearTipo`; las tres devolvieron `CREATED` en una única cadena inactiva y aislada, con relaciones padre exactas, `activo:false`, `revision:1`, y Tipo con `NOT_EVALUATED` y cero violaciones. Esta evidencia verifica el permiso público de esas tres creaciones sólo en el disposable; no es un despliegue del producto, no configura el paquete frontend ni una URL efectiva, y no verifica el transporte frontend. La implementación de Familia/Tipo no ha comenzado y aún requiere una decisión explícita de apply; en esta verificación la autoridad `3210` no fue consultada ni mutada.

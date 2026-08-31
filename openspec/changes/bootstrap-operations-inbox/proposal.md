# Bootstrap de la base operativa y entrada a Bandeja

Este cambio crea el primer slice del frontend GARFEX: una base mínima de aplicación y la entrada workstation a la Bandeja operativa. Es un **bootstrap deliberadamente incompleto**, no una Bandeja lista para producción; el runtime no mostrará registros ficticios ni estados no aprobados.

## Problema

El repositorio es greenfield: no dispone de manifiesto, aplicación, rutas, pruebas ni comandos ejecutables. Tampoco existe todavía un backend integrado ni un diseño aprobado para una Bandeja vacía, en carga o con error. Sin una base mínima no se puede validar de forma incremental el shell, la identidad GARFEX, la accesibilidad ni la entrada al futuro flujo operativo; completar la pantalla con supuestos introduciría datos y reglas de negocio falsos.

## Objetivo

Establecer una base frontend mínima, verificable y reversible que:

- presente el shell GARFEX y una ruta de Bandeja en workstation;
- exponga la entrada de comandos y los fundamentos de foco y teclado;
- documente en Storybook la composición poblada aprobada de `page04.png` mediante fixtures exclusivamente visuales;
- deje explícita la frontera para continuar cuando exista backend o un estado vacío aprobado.

## Alcance

### Baseline técnico instalado y configurado ahora

- Instalar y configurar desde el inicio el stack obligatorio completo: React 19, TypeScript, Vite, TanStack Router, TanStack Form, TanStack Table, TanStack Virtual, React Aria Components, Tailwind CSS, Vitest, React Testing Library, Playwright, Storybook, ESLint, Prettier y pnpm.
- Dejar operativos el manifiesto, las configuraciones y los comandos mínimos del baseline para desarrollo, build, pruebas, Storybook, lint y formato.
- Permitir pruebas de configuración y smoke checks que demuestren que los paquetes del baseline se integran correctamente, sin convertir esa verificación en funcionalidad de producto ni crear consumidores ficticios.

### Uso real en el slice ahora

- Usar TanStack Router para la ruta mínima de Bandeja y React Aria Components para composites u overlays accesibles que tengan una responsabilidad observable en Base + Bandeja.
- Usar TanStack Form, TanStack Table o TanStack Virtual en producto únicamente si el comportamiento aprobado de este slice los requiere directamente; su instalación obligatoria no justifica formularios de negocio de ejemplo, tablas o listas ficticias, ni virtualización sin volumen demostrado.
- No crear wrappers genéricos, adaptadores preventivos, consumidores falsos ni abstracciones especulativas para exhibir dependencias instaladas.

### Runtime

- Arranque mínimo de la aplicación sobre el baseline técnico completo, sin forzar uso funcional de motores que no tengan una responsabilidad real en el slice.
- Tokens visuales GARFEX del tema claro y fallback tipográfico documentado mientras no se verifiquen Nexa y RNS Sanz.
- Shell workstation basado en la evidencia aprobada: navegación persistente, barra superior, identidad GARFEX y Bandeja activa.
- Ruta inicial y entrada a Bandeja, sin registros ficticios y sin fabricar un estado vacío, loading o error.
- Entrada contextual de comandos con apertura mediante `Ctrl/Cmd + K`, cierre de la capa superior mediante `Esc` y restauración de foco cuando corresponda.
- Semántica nativa de `Tab` y arbitraje contextual de teclado en este orden: editable/IME → compuesto → overlay → feature → global.
- Fundamentos de accesibilidad WCAG 2.2 AA aplicables al slice: nombres accesibles, orden lógico, foco visible, contraste y estados no dependientes sólo del color.

### Storybook y verificación visual

- Composición poblada workstation de 1440×980 basada en `page04.png`.
- Fixtures locales, aislados y señalados como evidencia de presentación; no constituyen registros reales ni contrato de backend.
- Sólo estados e interacciones visualmente aprobados, sin convertir Storybook en una segunda autoridad de diseño.

La autoridad visual es `page04.png`. `design.op` aporta únicamente cues compartidos de shell y paleta; las capturas `n2033.png`, `n2082.png`, `n2137.png` y `n2192.png` son contexto futuro y no amplían este alcance. Ningún artefacto OpenPencil o evidencia congelada será modificado.

## No objetivos

- No entregar una Bandeja productiva, conectada o funcional de extremo a extremo.
- No mostrar fixtures poblados en runtime ni inventar estados vacíos, de carga, error, sin resultados o conectividad.
- No implementar backend, API, persistencia, sincronización, permisos, métricas, reglas de dominio ni comportamiento operativo.
- No introducir stores globales, repositorios, casos de uso, gateways, facades ni una capa de estado de consultas.
- No implementar acciones masivas reales, vistas guardadas, ranking o catálogo de comandos, auditoría ni centro de actividad.
- No implementar Maestro de recursos, catálogo, formularios por tipo ni el modelo futuro Familia → Clase → Tipo → Recurso maestro.
- No implementar tablet, móvil, responsive, touch-specific ni estados visuales adicionales.
- No modificar evidencia de diseño ni crear commits.

## Resultado visible para el usuario

En runtime, un usuario workstation podrá abrir la aplicación, reconocer el shell GARFEX, acceder a la ruta de Bandeja y usar la entrada básica de comandos con foco y cierre previsibles. La zona operativa permanecerá intencionalmente incompleta y no simulará datos ni estados de producto.

En Storybook podrá revisarse la composición poblada aprobada como referencia visual aislada. Esta separación evita que datos de demostración parezcan información productiva.

## Impacto arquitectónico

- Se crea el cimiento mínimo del frontend con organización feature-first y Screaming Architecture.
- La Bandeja será el primer límite de feature; la infraestructura compartida se limitará al arranque, routing, tokens y primitivas transversales realmente necesarias.
- El baseline completo quedará instalado y configurado desde este cambio: React 19, TypeScript, Vite, TanStack Router/Form/Table/Virtual, React Aria Components, Tailwind CSS, Vitest, React Testing Library, Playwright, Storybook, ESLint, Prettier y pnpm.
- La instalación no obliga al uso funcional: TanStack Router resolverá la ruta mínima y React Aria Components los composites u overlays accesibles justificados; Form, Table y Virtual sólo participarán en producto si una responsabilidad aprobada de Base + Bandeja los requiere directamente.
- No se crearán wrappers genéricos, consumidores de demostración, formularios de negocio de ejemplo, listas virtualizadas sin volumen ni abstracciones preventivas para demostrar el stack.
- Storybook alojará los fixtures visuales sin crear un proveedor runtime ni anticipar una frontera de datos ficticia.
- El backend externo seguirá siendo la única autoridad futura; este cambio no define endpoints ni contratos.
- El tooling de pruebas se instalará y configurará desde el bootstrap, y el desarrollo seguirá TDD estricto. Las verificaciones de configuración o smoke podrán probar la integración del baseline sin atribuirle comportamiento de producto.

## Riesgos

| Riesgo | Mitigación propuesta |
|---|---|
| Confundir el bootstrap con una Bandeja terminada | Señalar explícitamente la incompletitud del runtime y separar la demo poblada en Storybook. |
| Convertir fixtures visuales en datos de producto | Mantenerlos aislados, etiquetados y fuera de cualquier proveedor runtime. |
| Sobreinterpretar una captura estática | Implementar sólo estados aprobados y registrar las brechas sin resolverlas por inferencia. |
| Sacrificar accesibilidad por fidelidad visual | Tratar foco, semántica, contraste y teclado como restricciones estructurales. |
| Capturar `Tab` o atajos en el contexto incorrecto | Conservar `Tab` nativo y aplicar el arbitraje contextual definido. |
| Confundir instalación obligatoria con uso funcional obligatorio | Instalar y configurar todo el baseline, pero usar en producto sólo motores con responsabilidad observable; verificar el resto mediante configuración o smoke sin wrappers, ejemplos ni consumidores ficticios. |
| Derivar hacia Maestro de recursos o responsive | Mantener `page04.png` como autoridad de Bandeja y excluir expresamente las evidencias futuras. |
| Afirmar verificaciones inexistentes | Reportar como no disponibles los comandos hasta crear e instalar el tooling. |

## Brechas de diseño explícitas

Este cambio no resuelve las siguientes decisiones; requieren backend o nueva aprobación en OpenPencil:

- estado runtime vacío, loading, error, sin resultados, conexión perdida o datos parciales;
- semántica completa de tabla, selección múltiple, panel contextual y acciones masivas;
- catálogo, ranking, permisos y resultados de la paleta de comandos;
- contratos de datos, endpoints, autorización, persistencia y reglas de clasificación;
- tablet, móvil, responsive y comportamiento táctil;
- disponibilidad y licencia de Nexa y RNS Sanz;
- normalización de discrepancias existentes en assets de marca.

Hasta resolverlas, la ruta de Bandeja seguirá siendo una entrada honesta pero incompleta.

## Límite de rollback

El cambio puede revertirse retirando la base de aplicación, la ruta/shell de Bandeja, sus tokens y las historias/fixtures asociados. No habrá migraciones, datos persistidos, contratos de backend ni efectos externos que deshacer. Los documentos, imágenes y artefactos OpenPencil permanecerán intactos antes, durante y después del rollback.

## Criterios de éxito

- El baseline completo está instalado y configurado desde el inicio: React 19, TypeScript, Vite, TanStack Router, TanStack Form, TanStack Table, TanStack Virtual, React Aria Components, Tailwind CSS, Vitest, React Testing Library, Playwright, Storybook, ESLint, Prettier y pnpm.
- Las pruebas de configuración o smoke pueden acreditar la integración del baseline sin convertir paquetes instalados en funcionalidad de producto.
- El uso funcional se limita a responsabilidades reales de Base + Bandeja: TanStack Router para routing, React Aria Components para composites u overlays accesibles justificados y los demás motores sólo cuando el comportamiento aprobado los requiera directamente.
- No existen wrappers genéricos, consumidores falsos, formularios de negocio de ejemplo, listas virtualizadas sin volumen ni abstracciones especulativas creadas para demostrar dependencias.
- El runtime workstation muestra el shell GARFEX y una entrada identificable a Bandeja, pero ningún registro ficticio ni estado no aprobado.
- `Ctrl/Cmd + K` abre la entrada de comandos; `Esc` cierra la capa superior y restaura el foco cuando aplica.
- `Tab` conserva su semántica nativa y los atajos respetan el arbitraje editable/IME → compuesto → overlay → feature → global.
- La UI aplicable cumple los fundamentos verificables de WCAG 2.2 AA, incluyendo foco visible, nombres accesibles y contraste.
- Storybook contiene la composición poblada aprobada con fixtures visuales explícitamente aislados del runtime.
- La implementación visual usa `page04.png` como autoridad de Bandeja y no modifica ninguna evidencia congelada.
- No se introducen backend, persistencia, datos productivos falsos, comportamiento de dominio, responsive ni funcionalidades futuras.
- Toda verificación ejecutada o no disponible se reporta con precisión, sin afirmar comandos que aún no existan.

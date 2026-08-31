# Exploración — Base mínima y Bandeja operativa

## Resumen ejecutivo

El repositorio es un workspace greenfield sin `package.json`, aplicación fuente, pruebas ni comandos ejecutables. El primer slice real debe crear únicamente la base técnica mínima para una composición workstation de 1440×980 y la Bandeja operativa aprobada: shell persistente, tokens GARFEX, una ruta inicial, entrada de paleta de comandos, semántica de foco/teclado y una bandeja poblada con datos locales de presentación. No debe crear backend, persistencia, modelo de dominio operativo ni infraestructura transversal especulativa.

La autoridad visual congelada para esta pantalla es `page04.png`. `design.op` contiene una composición distinta de Maestro de recursos y sólo puede aportar cues de shell/paleta compartidos; no debe reinterpretarse como diseño de Bandeja. `n2033.png`, `n2082.png`, `n2137.png` y `n2192.png` documentan contexto futuro del catálogo, pero no amplían el alcance.

## Evidencia consultada

| Evidencia | Hallazgo aplicable | Autoridad para este cambio |
|---|---|---|
| `openspec/config.yaml` | Fija React 19, TypeScript, Vite, TanStack, React Aria Components, Tailwind, Vitest, RTL, Playwright y Storybook; exige arquitectura feature-first, backend autoritativo y ausencia de stores/repositorios/gateways/query layer. | Restricción técnica principal |
| `page04.png` | Muestra Bandeja operativa workstation 1440×980: rail oscuro, barra superior, pregunta de trabajo, indicadores compactos, filtros, acciones masivas, tabla y panel contextual. | Autoridad visual congelada |
| `design.op` | Muestra shell GARFEX, entrada `Ctrl/Cmd + K`, superficies y una paleta en el contexto de Maestro de recursos. | Cues compartidos solamente |
| `docs/erp-first-stage-design-brief.md` | Define la bandeja como entrada operativa, preservación de contexto, teclado, foco, WCAG 2.2 AA y modelo de estados; también contiene alcance futuro no aprobado para este slice. | Principios UX y accesibilidad |
| `docs/manual_identidad_garfex_ai_canonico_v2_digital.md` | Define tokens de marca, tema claro, contraste, uso restringido del amarillo y tipografías. | Autoridad de identidad y tokens |
| `n2033.png`, `n2082.png`, `n2137.png`, `n2192.png` | Enseñan configuración, atributos, presentación y creación de recursos. | Contexto futuro; fuera de implementación |

## Estado del workspace

- No existe manifiesto de paquetes ni fuente de aplicación.
- No existen pruebas, configuración de Vite/TypeScript, Storybook, ESLint o Prettier.
- No hay comando de test, build o verificación que pueda declararse ejecutable todavía.
- Git está inicializado, pero la configuración prohíbe asumir commits autorizados.
- Los archivos de diseño y documentación son evidencia congelada y deben permanecer intactos.
- No se selecciona la research lane; esta exploración usa exclusivamente evidencia local congelada.

## Lo directamente implementable

### Base y shell

1. Crear el mínimo de arranque React/Vite/TypeScript conforme a `config.yaml`, sin capas de dominio.
2. Definir tokens GARFEX como variables reutilizables de UI: rojo `#7C0000`, amarillo `#F2D031`, fondo claro `#F7F6F3`, superficie `#FFFFFF`, texto primario `#1F1F1D`, texto secundario `#5F5D58`, bordes y foco según el manual.
3. Construir el rail de navegación y la barra superior visibles en `page04.png`, con Bandeja activa y accesos futuros presentados como navegación no implementada o no accionable, según se decida en la especificación.
4. Exponer la identidad `GARFEX` sin alterar los assets de diseño; no inventar un nuevo logo ni deformar proporciones.

### Bandeja operativa workstation

1. Implementar la composición poblada de `page04.png` dentro del límite workstation aprobado.
2. Representar la lista, sus tipos, estados, origen y antigüedad como fixtures locales explícitos de presentación; no tratarlos como registros reales ni como contrato de backend.
3. Implementar selección de fila, selección múltiple, fila enfocada y panel de elemento seleccionado sólo en los estados evidenciados.
4. Mantener visibles las acciones y atajos mostrados: navegar, seleccionar, abrir, buscar, comandos y referencia de atajos. Las acciones que no tienen transición aprobada deben quedar como affordance documentada o no-op claramente delimitado, no como comportamiento de negocio inventado.
5. Implementar la entrada de búsqueda contextual y el disparador `Ctrl/Cmd + K`. La paleta puede tener una capa mínima de entrada/foco y cierre; no se debe inventar un catálogo de comandos, ranking, permisos o búsqueda remota.
6. Aplicar la precedencia de teclado acordada: editable/IME → compuesto → overlay → feature → global. `Esc` debe cerrar la capa superior y restaurar el contexto cuando corresponda.

## Brecha de diseño que debe permanecer documentada

- `page04.png` prueba una composición poblada, no todos sus estados ni transiciones. No autoriza loading, vacío, sin resultados, error, confirmación, éxito parcial, conexión perdida, responsive, touch, tablet o móvil.
- La imagen no prueba la semántica exacta de tabla, foco, selección, anuncio de cambios, navegación por historial ni el comportamiento de acciones masivas.
- La imagen no define un contrato de datos, nombres de endpoints, permisos, persistencia, sincronización ni reglas de clasificación.
- `design.op` contiene una paleta y pantalla de recursos, pero no debe usarse para fabricar estados de Bandeja no congelados.
- Los indicadores y ejemplos de la captura no son métricas de producción. Deben ser fixtures visuales claramente aislados hasta que exista una fuente autorizada.
- El brief menciona adaptación a tablet/móvil y touch, pero la decisión aprobada bloquea su recomposición; requieren nueva aprobación en OpenPencil.
- La disponibilidad/licencia de Nexa y RNS Sanz está abierta. Debe usarse una fallback tipográfica documentada sin presentar una fuente no disponible como garantizada.
- La investigación web permanece sin seleccionar; no se deben resolver estas brechas mediante investigación externa en esta fase.

## Primer slice mínimo recomendado

| Orden | Slice | Criterio de límite |
|---:|---|---|
| 1 | Arranque y tokens | La app inicia con tooling declarado y una única superficie visual; nada de API, store global o modelo de dominio. |
| 2 | Shell y ruta | La ruta inicial renderiza shell, rail, barra de comandos y contenido de Bandeja; la URL y navegación se mantienen simples. |
| 3 | Bandeja estática | La composición workstation coincide con la evidencia y usa fixtures locales de presentación. |
| 4 | Foco y teclado | El orden de foco es lógico y visible; se cubren `Ctrl/Cmd+K`, `/`, `?`, flechas, espacio, Enter y Esc según el estado autorizado. |
| 5 | Interacciones mínimas | Selección, panel contextual y cierre restauran el contexto sin persistencia ni efectos externos. |
| 6 | Verificación | Añadir pruebas unitarias/componentes y accesibilidad; añadir e2e sólo cuando Playwright esté instalado. Reportar honestamente cualquier comando aún no disponible. |

La primera implementación debe preferir componentes locales a una biblioteca de abstracciones propia. React Aria Components debe aportar semántica y comportamiento accesible en controles complejos; TanStack Router puede resolver la ruta mínima y TanStack Table sólo debe incorporarse si la tabla interactiva real lo necesita. TanStack Form/Virtual no justifican entrada en este slice sin formulario o volumen probado. Storybook debe documentar shell, filtros, fila, panel y estados aprobados cuando el tooling exista, sin convertirlo en una segunda fuente visual.

## Restricciones técnicas y de límites

- React Aria: usar roles, foco, teclado, labels y overlays semánticos; no duplicar manualmente patrones accesibles ya resueltos sin necesidad.
- TanStack: seleccionar sólo los paquetes que tengan una necesidad observable en la bandeja; no crear una capa de consulta ni un repositorio para fixtures.
- Pruebas: aplicar TDD estricto cuando exista tooling. RTL/Vitest para componentes y comportamiento de foco; Playwright para el recorrido workstation; axe u otra comprobación equivalente sólo si se incorpora explícitamente y queda disponible.
- Storybook: usarlo como catálogo verificable de componentes aprobados, no para inventar estados de producto.
- API externa: dejar una frontera futura mínima, sin consumidores ficticios. El backend seguirá siendo autoritativo; el slice no simula sincronización ni persistencia.
- Accesibilidad: objetivo WCAG 2.2 AA, foco visible, estados no dependientes sólo del color, tabla semántica, nombres accesibles y anuncios sólo para cambios que realmente se implementen.
- Idioma: producto y artefactos SDD en español; identificadores técnicos posteriores en inglés.

## Riesgos

1. **Sobreinterpretación visual:** convertir una captura estática en un sistema completo de estados produciría comportamiento no aprobado.
2. **Datos ficticios con apariencia real:** los textos de la imagen pueden confundirse con métricas o entidades productivas si no se aíslan como fixtures de presentación.
3. **Deriva entre evidencias:** usar `design.op` como autoridad de Bandeja desviaría la composición hacia Maestro de recursos.
4. **Accesibilidad sacrificada por densidad:** la fidelidad visual no debe eliminar foco, nombres semánticos ni navegación por teclado.
5. **Dependencias prematuras:** incorporar todos los paquetes fijados por el stack sin una necesidad del slice aumenta superficie y mantenimiento.
6. **Contratos inventados:** añadir API, permisos, sincronización o dominio antes de tener consumidores contradice la arquitectura aprobada.
7. **Tooling no disponible:** los comandos pnpm previstos sólo serán verificables después de crear el manifiesto y la configuración correspondiente.

## No objetivos explícitos

- No implementar Maestro de recursos, Catálogo, configuración, creación/edición de recursos ni modelo Familia → Clase → Tipo → Recurso maestro.
- No implementar XML, compras, precios, auditoría, actividad persistente, reglas de compatibilidad ni procesos asíncronos reales.
- No implementar backend, persistencia, stores globales, repositories, use cases, gateways, facades ni query state layer.
- No implementar tablet, móvil, touch-specific recomposition, responsive ni estados visuales no aprobados.
- No inventar métricas, registros, endpoints, permisos, consumidores API o reglas de negocio.
- No modificar `page04.png`, `design.op`, snapshots aprobados ni manuales.
- No hacer investigación web ni crear commits.

## Siguiente paso

Pasar a `propose` en español. La propuesta debe convertir estos límites en problema, alcance, no objetivos, riesgos y criterios de reversión; después deberá solicitarse la especificación de escenarios observables antes de diseñar o implementar.

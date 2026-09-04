# Exploración — Navegación espacial keyboard-first

## Resolución y límites de esta fase

- `skill_resolution: paths-injected`.
- Se cargó `/home/garfex/.pi/agent/git/github.com/Gentleman-Programming/gentle-pi/skills/gentle-ai/SKILL.md` antes de explorar.
- Se comprobó la ausencia visible de `.codegraph/`. CodeGraph no está disponible como herramienta en esta ejecución ni hay shell para inicializarlo; por eso se aplicó un fallback directo y acotado sobre los archivos relevantes.
- No se modificaron archivos de `src`, tests, estilos, documentación existente ni recovery. El worktree tenía cambios visuales parciales preservados deliberadamente; esta exploración no los atribuye ni los altera.
- El único artefacto escrito es este `openspec/changes/keyboard-first-spatial-navigation/explore.md`.

## Resumen ejecutivo

La aplicación ya tiene una base pequeña pero funcional: React 19, TanStack Router, React Aria Components, shell persistente con Bandeja/Catálogo, una entrada de Command Palette mínima, una superficie modal de Nueva Clase y utilidades globales para arbitrar `Ctrl/Cmd+K`. No existe todavía navegación espacial, servicio de foco, atajos contextuales `N`/`?`, ni una política común para suprimir flechas y atajos mientras se edita.

La nueva change debe tratar GARFEX como keyboard-first transversal, pero empezar por un corte pequeño y observable: contrato de zonas Tab/Shift+Tab, navegación espacial geométrica entre controles visibles y habilitados, arbitraje de edición/IME/browser, sidebar Bandeja/Catálogo y foco en overlays. La jerarquía futura no debe reducir las flechas a una sola lista: Clases, Familias y Tipos podrán aportar candidatos al mismo motor espacial cuando exista comportamiento real de selección, pero esa ampliación debe ser una fase posterior y no inventar datos ni navegación de Recursos.

La decisión visual es estricta: el texto `GARFEX` de la esquina superior izquierda debe usar rojo GARFEX (`#7C0000`), sin ningún otro rediseño. Esta exploración no aplica ese cambio.

## Autoridad documental existente

No existe `AGENTS.md` ni `README.md` en la raíz visible. La configuración activa es `openspec/config.yaml`; establece feature-first/Screaming Architecture, WCAG 2.2 AA, React Aria, TDD estricto, ausencia de stores/API/persistencia/Query especulativos y el uso de pnpm. Las especificaciones base vigentes son `openspec/specs/frontend-foundation/spec.md` y `openspec/specs/operations-inbox/spec.md`; los cambios archivados sirven como historial, no como autoridad nueva.

La ubicación canónica para documentar la regla, sin crear documentación duplicada, es `docs/erp-first-stage-design-brief.md`, sección **11. Filosofía centrada en el teclado** y su tabla **Contrato inicial de atajos**. Esa sección ya es la fuente de verdad UX para teclado, aunque hoy describe flechas de forma genérica, no define Tab como cambio primario de zonas, no contiene `N`, y no registra la prohibición de `Ctrl+N`. En una fase de implementación documental se debe actualizar esa sección en lugar de crear `docs/keyboard.md`, otra guía o repetir la regla en un README inexistente. `docs/manual_identidad_garfex_ai_canonico_v2_digital.md` sigue siendo la autoridad de marca/color/foco; no es el lugar para la política de interacción.

`openspec/config.yaml` es la autoridad de restricciones del SDD y puede referenciar la change, pero no debe duplicar el contrato de producto. Las especificaciones o una futura spec de esta change deben expresar escenarios verificables; la regla general permanece documentada en el brief UX.

## Mapa real del runtime

```text
src/app/routes/__root.tsx
  └─ AppShell
      ├─ rail/nav: Link Bandeja, spans estáticos, Link Catálogo
      ├─ topbar: texto GARFEX, ruta, CommandEntry, usuario
      └─ workspace-main / Outlet

src/shared/keyboard/
  ├─ keyboardArbitration.ts       # sólo decide Ctrl/Cmd+K y editable/IME
  └─ useGlobalCommandShortcut.ts  # listener document keydown

src/app/shell/
  ├─ AppShell.tsx                 # shell, sidebar, restoration de Command Palette
  └─ CommandEntry.tsx              # ModalOverlay/Dialog/Input/TextField/Button

src/features/catalog-hierarchy/
  ├─ CatalogHierarchyScreen.tsx   # tres regiones con botones de items
  ├─ NuevaClaseSurface.tsx         # Dialog modal, inputs/textarea, Escape/restauración
  ├─ catalogHierarchyState.ts      # contexto local y limpieza descendente
  └─ catalogHierarchy.css
```

`AppShell` ya conserva el opener de la paleta y restaura foco si el elemento sigue conectado y no está disabled. `CommandEntry` usa `ModalOverlay`, `Modal` y `Dialog`; el input recibe `autoFocus`. `NuevaClaseSurface` hace foco explícito en Nombre al abrir y vuelve al trigger al cerrar. Ambos overlays usan `isDismissable={false}`, por lo que Escape debe seguir siendo un comportamiento deliberado del diálogo, no un listener global paralelo.

La navegación actual mezcla dos links reales con varios `span.navigation-static`; sólo Bandeja y Catálogo son destinos. La política inmediata de sidebar requiere que Bandeja y Catálogo sean los dos controles navegables por ArrowUp/ArrowDown, con Home/End, Enter y foco visible. No se deben convertir los destinos futuros mostrados como texto (Recursos maestros, Compras, Configuración, Clases, Familias, Tipos, etc.) en rutas o acciones de esta change.

Catálogo ya renderiza tres regiones (`Clases`, `Familias`, `Tipos`) y cada item es un `button`, pero hoy no tiene handlers de selección: `aria-pressed` se calcula desde una presentation prop y el estado local sólo contiene contexto inicial. Esto da un punto claro para una futura fase jerárquica, pero el motor espacial no debe asumir que un botón es una lista aislada ni introducir datos runtime.

## Keyboard arbitration actual y gaps

`shouldOpenGlobalCommand` ya rechaza composición/IME (`isComposing`, keyCode 229), targets editables (`input`, `textarea`, `select`, contenteditable y roles textbox/combobox/searchbox), eventos preventDefault, overlay abierto y features que consumieron el evento. Acepta únicamente el modificador exacto de plataforma para `K`, sin Alt/Shift, y hace preventDefault al abrir.

La nueva política necesita una capa de decisión reutilizable, probablemente en `src/shared/keyboard/keyboardArbitration.ts` o en un módulo cercano, que distinga:

- edición real y descendientes de controles de formulario, search, editor, autocomplete y contenteditable;
- composición IME y escritura RTL/LTR;
- overlay/modal activo frente a página normal;
- atajos de una tecla (`N`, `?`) y flechas frente a shortcuts nativos o modificadores;
- `Ctrl/Cmd+K` conservado y `Ctrl+N` explícitamente nunca capturado;
- `defaultPrevented` y consumo local antes de la delegación global.

No se debe ampliar el listener global sin una política de precedencia documentada. Las flechas, `N` y `?` no deben impedir escribir dentro de los contextos editables enumerados por la decisión de producto. La tecla `?` puede requerir `Shift+/` en teclados internacionales; la detección debe usar `event.key === '?'` y no asumir un `code` o layout estadounidense.

## Capacidad React Aria y servicio espacial propuesto

La dependencia disponible es `react-aria-components@1.11.0`. El código ya usa sus primitivas `Button`, `Dialog`, `Input`, `Label`, `Modal`, `ModalOverlay` y `TextField`, que cubren semántica, estados disabled, foco inicial, overlay y restauración de foco para los modales. No hay un servicio de foco ni un hook de geometría existente, y no corresponde incorporar una focus trap global: el aislamiento debe quedar limitado a `Modal`/`Dialog`.

Se recomienda un servicio/hook pequeño, feature-transversal y sin store, sólo si las pruebas demuestran que hay más de un consumidor. Su responsabilidad sería:

1. registrar o descubrir controles candidatos dentro de una zona de navegación;
2. ignorar elementos `disabled`, `aria-disabled="true"`, desconectados, `hidden`, `display:none`, `visibility:hidden`, fuera de un subtree visible o sin rectángulo útil;
3. leer `getBoundingClientRect()` del foco actual y de candidatos;
4. escoger para cada dirección el mejor candidato visible/enabled por semiplano direccional, distancia/proximidad y alineación perpendicular, con determinismo de empate;
5. mover foco sin cambiar `Tab` nativo ni introducir `tabindex` global indiscriminado;
6. invalidar/recalcular ante cambios de DOM, resize o scroll sólo cuando sea necesario.

La primera implementación puede ser una utilidad pura de scoring más un hook de integración; no debe convertirse en un router, store, Query layer o abstracción de widgets. La búsqueda puede usar una lista explícita de refs/candidatos por superficie para evitar que botones decorativos o controles de un modal entren al grafo. La geometría real del viewport, no el orden DOM, es la autoridad para ArrowLeft/Right/Up/Down. El motor debe ser agnóstico de idioma y texto.

React Aria no ofrece por sí sola la política de mejor candidato geométrico para toda la aplicación. `useFocusRing`/roving tabindex y composites pueden ayudar a expresar foco visible y grupos, pero un roving tabindex por lista no satisface la decisión permanente de flechas entre zonas. Por eso se recomienda combinar semántica React Aria para controles/overlays con una utilidad local de geometría, manteniendo el API mínimo.

## Primer slice y fases posteriores

### Slice 1 — shell y contrato global

- Hacer explícitas las zonas principales del shell sin capturar Tab/Shift+Tab; Tab cambia zonas por orden DOM accesible y Shift+Tab vuelve.
- Convertir sólo Bandeja y Catálogo en el grupo inmediato de sidebar: ArrowDown/Up entre ambos, Home primero, End último, Enter abre el foco, `:focus-visible` claro y ArrowRight intenta el mejor control válido del contenido principal.
- Añadir el comportamiento común de Enter/Escape sólo donde exista una acción o capa válida; conservar Escape de diálogos y restauración de opener.
- Implementar `N` contextual para la acción primaria Nueva de la pantalla actual, empezando por Nueva Clase donde esa acción existe; dejar extensible el resolver para Nueva Familia/Nuevo Tipo/futuras entidades sin falsos comandos.
- Implementar `?` para abrir ayuda contextual de teclado, con foco/restauración y trampa sólo si la ayuda es un modal/dialog.
- Conservar `Ctrl/Cmd+K`; no implementar `Ctrl+N` ni reclamarlo como alias.
- Aplicar únicamente el color rojo al texto superior `GARFEX`; no tocar composición, medidas, espaciado, assets o el checkpoint visual restante.

### Slice 2 — superficies existentes y pruebas de geometría

- Conectar el motor a controles interactivos reales de Bandeja, shell, Command Palette, diálogo de Nueva Clase y superficies de Catálogo.
- Verificar que Enter abre/ejecuta el control enfocado y que Escape cancela/cierra o vuelve al contexto válido, sin doble manejo entre listeners.
- Añadir pruebas de elementos ocultos/disabled, scroll, empate de geometría y foco visible/restaurado.

### Futuro — jerarquía y superficies de alto volumen

- Integrar Clases → Familias → Tipos como candidatos espaciales cuando selección, lectura y dependencias estén implementadas de forma real. Flechas no deben quedar restringidas a una columna por accidente.
- Definir navegación de tablas, paneles, formularios complejos, búsqueda/autocomplete, command results y futuras entidades mediante el mismo contrato, sin crear datos ficticios.
- Recursos, jerarquías completas, deep links, virtualización y flujos masivos requieren decisiones y contratos propios; no se agregan para cerrar este primer slice.

## Alcance y límites

Incluido: interacción keyboard-first en el shell y superficies existentes; geometría de controles visibles/enabled; Tab/Shift+Tab de zonas; sidebar inmediato; `N`, `?`, `Ctrl/Cmd+K`; Enter/Escape; foco visible y restauración; supresión en escritura; color rojo del texto GARFEX; tests unitarios, RTL, E2E y arquitectura relacionados.

Fuera de alcance: rediseño visual, responsive/mobile/touch, nuevos destinos de navegación, backend/persistencia, store global, focus trap global, `Ctrl+N`, atajos destructivos, interpretación de permisos, creación de Recursos, cambios de modelo Clase/Familia/Tipo, y conversión de spans futuros del sidebar en funcionalidades.

La regla permanente debe poder extenderse a toda la aplicación, pero cada superficie se incorpora sólo cuando tiene controles y acciones reales. No se debe “simular” keyboard-first con una tabla de shortcuts o fixtures que no existen en runtime.

## Riesgos y mitigaciones

| Riesgo | Mitigación explorada |
|---|---|
| RTL o dirección de escritura | Definir Left/Right según geometría física del viewport, no según idioma; probar `dir="rtl"` y no inferir eje desde texto. |
| Elementos disabled/hidden | Filtrar `disabled`, `aria-disabled`, `hidden`, estilos de invisibilidad, desconexión y rectángulos vacíos; no enfocar candidatos no operables. |
| Scroll y cambios de layout | Medir en el momento de la tecla o invalidar una caché por scroll/resize/MutationObserver acotado; después de focus considerar `scrollIntoView` sólo si no produce saltos visuales. |
| Portals y modales | Excluir candidatos fuera del overlay activo; delegar contención/restauración a React Aria `Modal`/`Dialog`; nunca instalar una trampa document-wide. |
| Escritura y formularios | Resolver editable desde target y ancestros; cubrir input, textarea, select, contenteditable, search/editor/autocomplete, roles equivalentes e IME. |
| Shortcuts nativos del navegador | No capturar Tab; no capturar `Ctrl+N`; respetar modifiers, `defaultPrevented`, composición y eventos del sistema; usar sólo `event.key` para signos traducidos. |
| Teclados internacionales | Probar `?`, `N` mayúscula/minúscula, Meta/Ctrl y layouts donde `code` no coincide con el carácter; evitar `keyCode` salvo la compatibilidad IME ya existente. |
| Rendimiento | Mantener candidatos acotados por zona, evitar listeners por elemento y no recalcular toda la app en cada render; medir sólo al pulsar o cuando cambia layout. |
| Determinismo de tests | Extraer scoring puro con rectángulos sintéticos; RTL/jsdom para arbitraje/foco; Playwright para bounding boxes, scroll y foco real. |
| Estabilidad visual | Congelar el CSS actual salvo el cambio puntual de color requerido; no modificar las superficies de remediación visual parcial ni snapshots/recovery. |
| Foco perdido/restauración | Guardar opener conectado y habilitado; después de cierre, restaurar sólo si sigue válido y aplicar fallback accesible si fue removido. |
| Conflicto entre selección y foco | Mantener señales distintas para focus/selected/active; no usar `aria-pressed` o selección como sustituto de foco visible. |

## Archivos probablemente involucrados

### Implementación futura, aún no modificada

- `src/app/shell/AppShell.tsx`: regiones/zona del shell, sidebar inmediato, ArrowRight al contenido, resolver contextual y color del texto `GARFEX` sólo si el color está declarado allí vía clase.
- `src/app/shell/CommandEntry.tsx`: integración de Enter/Escape y preservación del contrato modal/opener; no eliminar React Aria.
- `src/shared/keyboard/keyboardArbitration.ts`: precedencia global, editable/IME, `N`/`?`, exclusión de `Ctrl+N` y conservación exacta de `Ctrl/Cmd+K`.
- `src/shared/keyboard/useGlobalCommandShortcut.ts`: sólo si la nueva arbitraje requiere exponer contexto; evitar múltiples listeners globales.
- `src/shared/keyboard/` (nuevo módulo pequeño, nombre por decidir): scoring geométrico y hook de candidatos, sujeto a evidencia de segundo consumidor.
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` y `NuevaClaseSurface.tsx`: integración de candidatos/acciones y restauración, sin ampliar datos o cambiar la jerarquía.
- `src/styles.css`: únicamente regla dirigida para foco/zona o color GARFEX, y sólo después de verificar que no reabre el checkpoint visual congelado.
- `src/features/catalog-hierarchy/catalogHierarchy.css`: sólo si el foco de items requiere una regla local; no rediseñar composición.
- `docs/erp-first-stage-design-brief.md`: actualizar la sección 11 existente; no crear documentación paralela.

### Tests y capas

- `tests/unit/keyboardArbitration.test.ts`: RED para edición/IME, flechas, `N`, `?`, `Ctrl/Cmd+K`, `Ctrl+N`, modifiers y `defaultPrevented`.
- Nuevo `tests/unit/spatialNavigation.test.ts`: scoring puro, ejes, alineación, proximidad, empates, disabled/hidden y RTL físico.
- Nuevo `tests/unit/spatialNavigationHook.test.tsx` o equivalente: registro, foco, scroll/invalidación y ausencia de captura de Tab.
- `tests/unit/appShell.test.tsx`: zonas, sidebar keys, ArrowRight, Enter, Home/End, foco visible y ruta activa.
- `tests/unit/commandEntry.test.tsx` y `tests/unit/catalogHierarchyNewClass.test.tsx`: Enter/Escape, supresión en campos, modal trap/restauración y `N` contextual.
- Nuevo test RTL contextual para ayuda `?` y fallback de restauración.
- `tests/e2e/operationsInbox.workstation.spec.ts`: recorrido real de sidebar, zonas, foco y shortcuts sin alterar composición 1440×980.
- `tests/e2e/catalogHierarchy.workstation.spec.ts`: candidatos reales, supresión durante inputs, diálogo y color exacto del texto GARFEX, manteniendo las aserciones geométricas existentes.
- Nuevo E2E o ampliación acotada para `dir="rtl"`, scroll y elementos disabled/hidden si la aplicación puede exponerlos sin fixtures runtime.
- `tests/architecture/catalogHierarchyBoundaries.test.ts` y/o un test de límites de keyboard: prohibir `Ctrl+N`, focus trap global, fixtures runtime y destinos futuros.
- Storybook `storybook/catalog-hierarchy/**` sólo para interacción aislada si aporta evidencia; nunca importar fixtures al runtime.

## Orden TDD recomendado

1. RED de arbitraje y contrato de precedencia, incluyendo la prohibición de `Ctrl+N` y supresión completa en escritura.
2. RED de scoring puro con rectángulos controlados y casos RTL/disabled/oculto.
3. GREEN mínimo del servicio, sin tocar Tab ni instalar trap global.
4. RED/GREEN de sidebar y shell, primero dos destinos existentes.
5. RED/GREEN de `N`, `?`, Enter/Escape y restauración en overlays.
6. Integración de superficies de Catálogo y Nueva Clase, manteniendo selección/jerarquía fuera de inferencias nuevas.
7. E2E de geometría/foco/scroll y regresión visual; después refactor sólo de duplicación demostrada.
8. Ejecutar y reportar honestamente `pnpm test`, `pnpm test:e2e`, `pnpm test:stories`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` y `pnpm router:check` en la fase correspondiente. Esta exploración no ejecutó comandos.

## Criterio de readiness

La exploración es suficiente para proposal/spec/design, pero el motor geométrico debe fijar el scoring y el modelo de zonas antes de apply. El corte inicial es de riesgo moderado: afecta listeners globales, foco y shell, pero puede aislarse sin backend ni migraciones. El cambio visual de `GARFEX` debe ser una aserción puntual, no una puerta para reparar los cambios visuales parciales congelados. Rollback: retirar el servicio/hook, handlers, tests/documentación de esta change y la regla puntual de color; no revertir ni tocar el checkpoint visual preexistente.

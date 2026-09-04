# Diseño técnico — Keyboard First con navegación espacial

## Estado, autoridad y límites

Este diseño implementa la propuesta y los deltas `frontend-foundation` y `keyboard-interaction` de esta change. `skill_resolution: paths-injected`; se cargó el skill indicado antes de trabajar. CodeGraph no estuvo disponible en esta ejecución y no existe shell para inicializarlo, por lo que el análisis estructural usa el `explore.md` ya producido y lecturas directas acotadas de los archivos identificados allí.

El cambio es exclusivamente frontend, sin backend, API, persistencia, rutas, datos de dominio, store global, fixture runtime ni focus trap global. La primera integración cubre shell, Bandeja/Catálogo, Nueva Clase, Command Palette y ayuda contextual. No hace navegables ni accionables Familia, Tipo, Recurso o las etiquetas futuras.

## Decisiones arquitectónicas

1. Habrá un único controlador global de `keydown`, montado por `AppShell`, para `Ctrl/Cmd+K`, `N` y `?`. No capturará `Tab`, flechas, `Enter`, `Escape` ni `Ctrl+N` globalmente.
2. Los composites y overlays conservarán handlers locales. El sidebar manejará sus teclas en su `<nav>`; React Aria será dueño de teclado, contención y dismissal dentro de modales.
3. El arbitraje y el scoring serán funciones puras. Los efectos (`preventDefault`, abrir, cerrar o enfocar) ocurrirán sólo después de que una decisión indique un dueño y la acción siga siendo válida.
4. Un provider React local al shell mantendrá registros imperativos en `useRef`. No será un store de aplicación: no tendrá estado de dominio, persistencia, suscriptores ni acceso fuera del árbol; sólo permitirá resolver callbacks vivos del surface actual y overlays abiertos.
5. Los candidatos espaciales serán opt-in y estarán acotados por una raíz explícita. No habrá búsqueda de todos los focusables del documento ni roving `tabindex` global.
6. La implementación medirá layout en cada pulsación espacial. El primer slice no tendrá caché, observer permanente ni estado de layout que pueda quedar obsoleto.

## Flujo de datos

```text
keydown local
  ├─ editable/IME → el editor o control conserva el evento
  ├─ composite/sidebar → resuelve localmente; si actúa, preventDefault
  └─ overlay React Aria → procesa Enter/Tab/Escape dentro del diálogo

keydown document (bubble; sólo si no fue detenido)
  → arbitrateKeyboardEvent(event, active context)
  → pass | command-palette | contextual-new | contextual-help
  → resolver registro vivo para surface/overlay vigente
  → preventDefault sólo cuando GARFEX ejecutará la intención
  → guardar opener actual
  → ejecutar la acción real

ArrowRight en sidebar
  → arbitraje local
  → rect actual del link
  → candidatos opt-in dentro de workspace-main
  → filtro DOM y límite de overlay
  → scoreSpatialCandidates(rectángulos)
  → revalidar destino → focus({preventScroll:true})
```

## Arbitraje: estados y precedencia exacta

`keyboardArbitration.ts` expondrá decisiones sin efectos. La precedencia observable será la siguiente:

| Orden | Estado/guard | Resultado |
|---|---|---|
| 1 | `isComposing`, `keyCode === 229` o contexto editable | Suspender flechas espaciales y teclas de un carácter; también conservar la supresión actual de Command Palette. |
| 2 | control/composite local, `defaultPrevented` o `localConsumed` | `consumed`; ningún nivel posterior actúa. Un `stopPropagation` local impide naturalmente alcanzar el listener. |
| 3 | overlay/modal activo, incluso portaled | Sólo el overlay superior puede manejar sus `Enter`, `Tab` y `Escape`; el controlador de página no abre `N`, `?` ni Command Palette. El fondo queda inactivo. |
| 4 | feature local activa | Sidebar y futuros composites resuelven sus teclas antes del nivel global y marcan consumo sólo si poseen esa tecla. |
| 5 | intención contextual del surface | Resolver `N` o `?` sólo contra registros reales del surface activo. |
| 6 | atajo global exacto | Resolver `Ctrl+K` en Windows/Linux o `Cmd+K` en macOS. |
| 7 | cualquier otro evento | `pass`; no cancelar comportamiento nativo. |

`Ctrl+N` es además una invariante de no-ownership: la normalización puede reconocerlo para devolver el reason `reserved-browser-command`, pero ningún estado lo consume ni llama `preventDefault`, incluso con overlay. `Cmd+N` y cualquier otra variante modificada no registrada también terminan en `pass` por la regla general de modificadores.

Reglas de teclas y modificadores:

- `Tab` y `Shift+Tab` nunca entran al controlador y conservan orden nativo.
- Flechas, `Home` y `End` locales requieren `!ctrlKey && !metaKey && !altKey && !shiftKey`.
- `N`/`n` permite únicamente Shift cuando éste produce la mayúscula; rechaza Ctrl, Meta y Alt. La regla previa de `Ctrl+N` asegura pass-through explícito.
- `?` se detecta exclusivamente con `event.key === '?'`, nunca con `code`. Se permite Shift y se permite la combinación Ctrl+Alt reportada por el navegador sólo cuando `getModifierState('AltGraph')` sea verdadera. Meta, Ctrl o Alt fuera de AltGraph no abren ayuda.
- Command Palette exige la tecla `k` y exactamente el modificador de plataforma: Meta sin Ctrl en macOS; Ctrl sin Meta fuera de macOS; nunca Shift ni Alt. La plataforma se inyectará a la función pura y el adaptador browser la determinará una vez.
- `Enter` no tendrá acción global. Anchors, Buttons y controles React Aria conservarán activación nativa. En sidebar, Enter sobre los dos links reales navega por semántica nativa.
- `Escape` no tendrá acción global. React Aria cerrará sólo el modal superior mediante su `onOpenChange`; el estado de overlay bloquea cualquier intención posterior del mismo evento.
- Un handler local que ejecuta una tecla llama `preventDefault`; sólo usará `stopPropagation` cuando evitar doble ownership sea necesario. No se inventará una bandera DOM paralela: `localConsumed` existe únicamente para probar o componer el arbitraje puro.

## Detección exacta de contexto editable

`isEditableContext(event, options?)` examinará `event.composedPath()` desde el target hacia afuera y, como fallback, `target` más sus ancestros. Devolverá `true` para:

- cualquier `input`, `textarea` o `select`, incluidos controles de búsqueda y formulario;
- roles `textbox`, `searchbox`, `combobox` y `spinbutton` en el target o un ancestro;
- el primer límite `contenteditable` cuyo valor sea vacío, `true` o `plaintext-only`, y elementos para los que `isContentEditable` sea verdadero;
- un ancestro con `aria-autocomplete` o `data-keyboard-editing="true"`;
- cualquier predicate adicional inyectado al construir el controlador.

Un `contenteditable="false"` explícito corta sólo la herencia de `contenteditable`; no anula un editor/autocomplete marcado mediante rol o `data-keyboard-editing` en un ancestro. Esto evita que widgets internos de un editor vuelvan a activar shortcuts de página.

La extensión segura para editores futuros será un array inmutable `additionalEditablePredicates`, recibido por el provider, o el atributo local `data-keyboard-editing="true"`. No habrá una lista global mutable de selectores. Listbox, grid, tree, menu y otros composites no se declararán “editables”: sus handlers locales consumirán sus teclas según el patrón de precedencia.

## Motor espacial puro

### Contratos

```ts
type SpatialDirection = 'up' | 'down' | 'left' | 'right'
type SpatialRect = { left: number; top: number; right: number; bottom: number }
type SpatialCandidate = { id: string; rect: SpatialRect }
type SpatialResult = { id: string; score: number } | null

scoreSpatialCandidates(
  origin: SpatialRect,
  candidates: readonly SpatialCandidate[],
  direction: SpatialDirection,
): SpatialResult
```

Los ids serán estables, únicos dentro del boundary y no derivados de texto, idioma, índice de array ni posición DOM. La integración usará ids semánticos como `catalog.new-class`. Duplicados se rechazarán en desarrollo/tests y se deduplicarán como inválidos en producción, sin fallback al orden de entrada.

### Fórmula

Para cada rectángulo se calculan centro `cx = (left + right) / 2` y `cy = (top + bottom) / 2`. Un candidato pertenece al semiplano físico sólo si:

- Right: `candidate.cx > origin.cx`
- Left: `candidate.cx < origin.cx`
- Down: `candidate.cy > origin.cy`
- Up: `candidate.cy < origin.cy`

Para Right/Left, el eje primario es X y el perpendicular es Y; para Up/Down se intercambian.

`primaryGap` es la separación de bordes en la dirección pedida, limitada a cero cuando las proyecciones se solapan:

- Right: `max(0, candidate.left - origin.right)`
- Left: `max(0, origin.left - candidate.right)`
- Down: `max(0, candidate.top - origin.bottom)`
- Up: `max(0, origin.top - candidate.bottom)`

`perpendicularGap` es la distancia entre los intervalos perpendiculares, cero si se solapan:

```text
max(0, max(originPerpStart, candidatePerpStart)
       - min(originPerpEnd, candidatePerpEnd))
```

`perpendicularOffset` es la distancia absoluta entre centros sobre ese eje. La puntuación en píxeles CSS será:

```text
score = primaryGap + 2 * perpendicularGap + 0.25 * perpendicularOffset
```

La ponderación penaliza salir del haz alineado sin hacer que la alineación venza siempre a una alternativa físicamente mucho más cercana. Ante igualdad numérica, se compara en este orden: menor `primaryGap`, menor `perpendicularGap`, menor distancia euclídea entre centros y finalmente `id` lexicográfico. Por tanto, orden DOM, texto, `dir` y orden del array no participan. RTL no invierte nada: ArrowRight siempre incrementa X físico del viewport.

### Adaptador DOM y elegibilidad

`focusSpatialTarget({origin, direction, boundaryRoot, activeOverlayRoot, candidates})` será el adaptador con efectos. Sólo admitirá un `HTMLElement` cuando:

- `isConnected` y `ownerDocument` coinciden con el origin;
- está dentro de `boundaryRoot`; si existe `activeOverlayRoot`, tanto origin como candidato deben estar dentro de esa raíz portaled explícita;
- posee id espacial único y es un control opt-in real;
- no coincide con `:disabled`, `disabled`, `aria-disabled="true"`, `hidden`, `aria-hidden="true"`, `inert` ni un ancestro con esos estados hasta el boundary;
- él y sus ancestros hasta el boundary no tienen `display:none`, `visibility:hidden|collapse` u `opacity:0`;
- `getBoundingClientRect()` tiene ancho y alto positivos, `getClientRects()` no está vacío y el rectángulo intersecta el viewport;
- es operable/focusable en ese momento; elementos decorativos o sin acción real nunca se registran.

La raíz de un overlay se pasa explícitamente aunque React Aria la renderice en portal; nunca se infiere por cercanía DOM al shell. Antes de enfocar se repite la comprobación conectada/habilitada. Se usa `focus({preventScroll:true})` y se verifica `document.activeElement`; si falla, la decisión es `focus-failed` y no se enfoca un segundo candidato silenciosamente.

No hay caché: `getBoundingClientRect()` se lee sincrónicamente al manejar la tecla y fuerza geometría vigente después de scroll/layout ya aplicado. Tests que muten layout esperarán un `requestAnimationFrame` antes de la siguiente pulsación. Una futura optimización con caché requerirá una API explícita de invalidación y evidencia de rendimiento; no pertenece a este slice.

## Sidebar y handoff al contenido

`AppShell` conservará únicamente los Links Bandeja y Catálogo. Refs explícitos forman el grupo en ese orden:

- ArrowUp/ArrowDown enfocan anterior/siguiente sin wrap; en extremos conservan el foco y consumen la tecla para impedir scroll accidental.
- Home enfoca Bandeja; End enfoca Catálogo.
- Enter queda en manos del anchor y TanStack Router; no se simula una ruta con `click` global.
- ArrowRight llama al adaptador espacial con el link como origin y `.workspace-main` como boundary. Sólo controles reales marcados con id espacial participan. En Catálogo, el primer candidato real del slice es Nueva Clase; en Bandeja, si no hay candidato, el foco permanece en el link.
- ArrowLeft no recibe comportamiento especial en este slice.

Las etiquetas `navigation-static` no reciben refs, `tabIndex`, roles, handlers ni ids espaciales. Los botones de la jerarquía sin comportamiento real tampoco se registran como candidatos.

## Registro contextual y resolver

`KeyboardControllerProvider` expondrá un registro mínimo:

```ts
type ContextualAction = {
  id: string
  surface: 'catalog'
  key: 'n'
  label: 'Nueva Clase'
  root: () => HTMLElement | null
  isAvailable: () => boolean
  run: (opener: HTMLElement | null) => void
}

registerAction(action: ContextualAction): () => void
registerOverlay(root: () => HTMLElement | null): () => void
```

El registry vive en un `Map` ref del provider y registra/desregistra en layout effects. El resolver exige coincidencia con el surface activo derivado de la ruta, raíz conectada, disponibilidad y ausencia de overlay. En el primer slice el tipo sólo permite el registro concreto `catalog.new-class`; ampliar la unión exige una acción de producto real y sus tests. No existirán entradas para Familia, Tipo, Recurso o Bandeja ni descriptores disabled como placeholders.

`NuevaClaseSurface` registrará su callback `open(opener)` y el trigger real. Tanto click como `N` llaman la misma función; no se duplicará lógica de apertura. El opener pasado por teclado será `document.activeElement` si es un HTMLElement elegible.

## Ayuda contextual y ciclo de foco

`?` resolverá un snapshot de comandos realmente disponibles:

- zona sidebar: ArrowUp/Down, Home, End, Enter y ArrowRight;
- surface Catálogo: `N` sólo si `catalog.new-class` resuelve como disponible;
- comandos comunes disponibles: Tab/Shift+Tab, `?` y Ctrl/Cmd+K;
- Escape sólo se muestra como cierre cuando el contenido describe un overlay soportado.

No se mostrarán `/`, acciones de Familia/Tipo/Recurso, creación persistente ni comandos futuros. Bandeja no mostrará `N`.

`KeyboardHelpDialog` reutilizará `ModalOverlay`, `Modal`, `Dialog` y `Button` de React Aria y las clases visuales existentes de Command Palette. El botón Cerrar recibe foco inicial. React Aria conserva Tab dentro del diálogo y Escape cierra sólo ese modal. Abrir ayuda mientras otro overlay está activo está prohibido por arbitraje.

Cada overlay guardará el opener al abrir y restaurará una vez, después del unmount del portal. La elegibilidad de restauración reutiliza el filtro conectado/visible/habilitado/operable. Fallbacks explícitos:

1. Command Palette: trigger de Command Palette; después, link activo de la ruta.
2. Nueva Clase: trigger Nueva Clase; después, link Catálogo.
3. Ayuda: link activo Bandeja/Catálogo; después, trigger de Command Palette.

La restauración se programa en el siguiente frame para no competir con desmontaje/auto-focus de React Aria. Nunca enfoca `body`, fondo inerte o un nodo desconectado. Un helper compartido pequeño evita tres implementaciones divergentes, pero no instala una trampa.

## Frontera con React Aria

React Aria sigue siendo autoridad para semántica Button/Dialog, portal, aislamiento modal, recorrido Tab y dismissal por Escape. `isDismissable={false}` continúa bloqueando click exterior; no se deshabilita el cierre por teclado. Se eliminará el handler Escape manual anidado de Nueva Clase para evitar que el mismo evento cierre dos capas. El controlador global sólo observa que existe un overlay superior y se abstiene.

El motor espacial no reemplaza `useFocusRing`, `Modal`, `Dialog`, `ModalOverlay`, ni la activación de Button/Link. No añade listeners Tab, sentinels, `aria-hidden` manual al documento ni manipulación global de `tabIndex`.

## Archivos previstos y responsabilidad

### Shared keyboard

- `src/shared/keyboard/keyboardArbitration.ts`: extraer detección editable, intención pura, reasons y exactitud de plataforma; preservar los casos existentes de Command Palette.
- `src/shared/keyboard/spatialNavigation.ts` (nuevo): tipos, fórmula pura, elegibilidad DOM y focus adapter.
- `src/shared/keyboard/KeyboardController.tsx` (nuevo): provider local, único listener document, registros de acciones/overlays y resolver.
- `src/shared/keyboard/focusRestoration.ts` (nuevo sólo si evita duplicación demostrada): revalidación y fallback; de otro modo mantener helper privado en el controller.
- `src/shared/keyboard/useGlobalCommandShortcut.ts`: retirar después de migrar Command Palette al único controller; nunca dejar dos listeners globales activos.

### Shell y features

- `src/app/shell/AppShell.tsx`: provider, refs de links/main/fallback, handlers locales de sidebar, estado de ayuda y color de surface activo.
- `src/app/shell/CommandEntry.tsx`: registrar overlay y usar restauración/fallback compartidos sin cambiar composición.
- `src/app/shell/KeyboardHelpDialog.tsx` (nuevo): diálogo contextual React Aria con contenido resuelto.
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`: marcar raíz Catalog y conservar estructura visual.
- `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`: registrar la única acción `N`, aceptar opener, registrar overlay y quitar doble Escape; conservar markup/clases y `data-approved-frame="n2418"`.
- `src/styles.css`: cambiar exclusivamente `.topbar-brand` a `color: var(--color-primary)` (`#7C0000`) y, si el RED de foco lo exige, ampliar el selector global existente a `textarea:focus-visible`/`select:focus-visible`. No cambiar medidas, spacing, tipografía ni estilos de reposo adicionales.
- `src/features/catalog-hierarchy/catalogHierarchy.css`: no modificar.

### Documentación

- `docs/erp-first-stage-design-brief.md`: reemplazar únicamente la sección 11 y su tabla por el contrato permanente confirmado. Incluir Tab nativo por zonas, flechas físicas, Enter/Escape contextuales, supresión editable/IME, `N`, `?` semántico, Ctrl/Cmd+K exacto, Ctrl+N reservado, modal-only trapping y distinción entre este slice y futuras superficies. Eliminar de la tabla “inicial” comandos no implementados presentados como vigentes; no crear otra guía.

### Tests

- ampliar `tests/unit/keyboardArbitration.test.ts`;
- crear `tests/unit/spatialNavigation.test.ts`;
- ampliar `tests/unit/appShell.test.tsx`;
- ampliar `tests/unit/catalogHierarchyNewClass.test.tsx`;
- crear un test unitario de controller/help/fallback sólo si no cabe de forma legible en los anteriores;
- ampliar E2E workstation existentes sin borrar aserciones geométricas congeladas;
- crear `tests/architecture/keyboardBoundaries.test.ts` o ampliar el guard existente para prohibiciones transversales.

## Estrategia TDD estricta y determinismo

Cada unidad de trabajo comienza con un RED observable, continúa con el GREEN mínimo, triangula casos vecinos y refactoriza sólo con toda la unidad en verde. Se conservará evidencia del fallo previo y del comando exitoso en apply/verify; este diseño no afirma ejecución de tests.

### Vitest puro

- Tabla completa de precedencia y reasons: IME, editable por target/ancestro/composed path, contenteditable, roles, data marker, modifiers, defaultPrevented, localConsumed, overlay, `N`, `?`, Ctrl/Cmd+K y Ctrl+N.
- Rectángulos sintéticos para cuatro direcciones, solape, semiplano, primary/perpendicular gap, fórmula, empate, ids, reordenamiento de array y `dir="rtl"` irrelevante.
- No usar layout de jsdom para demostrar scoring.

### React Testing Library/jsdom

- Listener único, registro/desregistro, surface activo, no placeholders, sidebar Up/Down/Home/End/Enter y Tab no cancelado.
- ArrowRight usa un measurer/rect provider inyectable en test; no depende de los ceros de `getBoundingClientRect` de jsdom.
- `N` abre la misma Nueva Clase, edición suspende shortcuts, `?` abre contenido contextual, overlays bloquean niveles inferiores, Escape cierra una sola capa y restauración elige opener/fallback.
- `preventDefault` se afirma sólo cuando la intención se ejecuta; Ctrl+N debe permanecer `defaultPrevented === false`.

### Playwright/browser real

- Bounding boxes reales y destino físico, incluido `dir="rtl"` sin invertir ArrowRight.
- Scroll seguido de nueva medición, candidato oculto/disabled/zero-area y portal activo excluyendo fondo.
- Tab/Shift+Tab entre zonas, foco visible, focus efectivo y `preventScroll` sin salto inesperado.
- Command Palette, Nueva Clase y ayuda: trap sólo modal, Escape único y restauración/fallback tras retirar o deshabilitar opener.
- Color computado exacto de `.topbar-brand` igual a `rgb(124, 0, 0)`.
- Mantener intactas las coordenadas 1440×980 y el frame `n2418`; cualquier cambio no autorizado falla antes de actualizar snapshots/assertions.

### Arquitectura y calidad

Los guards inspeccionarán que no exista captura global de Tab/flechas/Enter/Escape/Ctrl+N, segundo listener global, focus trap manual, store global, fixture runtime, ruta o acción futura. Verificación final prevista: `pnpm test`, `pnpm test:e2e`, `pnpm test:stories`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check` y `pnpm verify:runtime-bundle`.

## Presupuesto de revisión y unidades acotadas

La capacidad completa no cabe responsablemente en 400 líneas authored incluyendo tests. No se debilita el comportamiento; apply debe avanzar en unidades secuenciales, cada una con forecast propio y máximo aproximado de 400 líneas:

1. **Core puro:** RED/GREEN de arbitraje y scorer, sin integración runtime.
2. **Adaptador y sidebar:** elegibilidad DOM, boundary, grupo de dos links y ArrowRight.
3. **Controller y acciones reales:** listener único, registry, migración de Command Palette y `N`/Nueva Clase.
4. **Overlays y ayuda:** ayuda contextual, precedencia portaled, restauración y fallbacks.
5. **Browser/guard/docs/style:** evidencia real, guards, sección 11 y cambio rojo puntual.

Si el forecast de una unidad supera 400, se divide antes de escribir —por ejemplo, adapter DOM separado de sidebar— y se consulta bajo `ask-on-risk`; no se omiten tests ni reglas para entrar en presupuesto.

## Observabilidad, rollout y rollback

Las funciones puras devolverán un reason estable (`editing`, `composing`, `prevented`, `overlay-active`, `modifier`, `no-action`, `no-candidate`, `moved`, `focus-failed`). Tests y debugging local pueden inyectar un reporter no-op; producción no emitirá teclas, texto, ids de usuario, analytics ni red. La señal runtime observable seguirá siendo `document.activeElement`, overlay abierto y ruta resultante.

Rollout es aditivo y por unidades: primero código puro sin efecto, luego sidebar, luego acciones globales, luego ayuda. No se usa feature flag persistente. En cada integración se conserva el comportamiento anterior hasta que su reemplazo tenga GREEN; el hook viejo de Command Palette se retira en la misma unidad que activa el controller para impedir doble apertura.

Rollback se realiza en orden inverso: desregistrar ayuda y `N`; retirar handlers sidebar y marcadores espaciales; restaurar el hook estrecho anterior de Ctrl/Cmd+K; eliminar scorer/controller sin consumidor; revertir sólo la sección 11 y `.topbar-brand` si producto revierte la regla. No hay migración ni datos que deshacer.

## Protección del checkpoint visual congelado

`catalogHierarchy.css`, archivos `.op`, `design-recovered.op`, `recovery/`, PNGs y evidencia visual preexistente quedan fuera de edición. Los componentes de Catálogo sólo reciben wiring conductual mínimo sin reordenar JSX, cambiar clases, textos visuales aprobados, tamaños o frame. No se ejecutará formateo masivo sobre archivos congelados. Las aserciones geométricas existentes se preservan; no se “actualizan” para aceptar drift. En reposo, la única diferencia visual autorizada es GARFEX rojo; los outlines de foco sólo aparecen en interacción.

## Tradeoffs y alternativas rechazadas

- **Provider local con registros imperativos vs store global:** se elige provider porque conecta callbacks vivos a través de `Outlet`/portals sin estado de dominio. Redux/Zustand/event bus singleton se rechazan por alcance y acoplamiento.
- **Candidatos opt-in vs query global de focusables:** opt-in evita controles decorativos, overlays inactivos y acciones futuras. El query document-wide se rechaza por impredecible y costoso.
- **Medición por pulsación vs caché/observers:** medir por pulsación garantiza scroll/layout vigente con pocos candidatos. ResizeObserver/MutationObserver global y grafo persistente se difieren hasta evidencia de rendimiento.
- **Score ponderado vs DOM order o nearest-center puro:** la fórmula combina avance y alineación. DOM/list order viola geometría y nearest-center puede elegir objetivos fuertemente diagonales.
- **Centros para semiplano vs bordes estrictos:** centros permiten decidir controles cuyas cajas se solapan parcialmente; los gaps de borde aún modelan cercanía. Exigir caja totalmente separada dejaría movimientos válidos sin destino.
- **RTL físico vs dirección lógica:** coordenadas viewport cumplen la regla confirmada; invertir Left/Right por `dir` se rechaza.
- **React Aria modal vs trap manual:** React Aria ya aporta semántica y contención probada. Sentinels/listeners document-wide se rechazan.
- **Enter/Escape locales vs globales:** ownership local evita doble activación/cierre. Un handler global se rechaza por interferencia con controles y capas.
- **Registro sólo de Nueva Clase vs placeholders future-safe:** una unión tipada se amplía cuando exista producto real. Entradas disabled de Familia/Tipo/Recurso se rechazan porque siguen fabricando una API observable.
- **Diálogo de ayuda vs tooltip no modal:** el diálogo ofrece foco, Escape y lectura estable. Al reutilizar React Aria/clases existentes no abre un rediseño.

# Diseño técnico — Bootstrap de la base operativa y entrada a Bandeja

## Decisión ejecutiva

Se construirá una SPA web de una sola aplicación con pnpm, Vite, React 19 y TypeScript. TanStack Router resolverá únicamente `/bandeja`; React Aria Components implementará una entrada mínima de comandos accesible. El runtime mostrará el shell GARFEX, el destino Bandeja y una región operativa deliberadamente sin representación de datos ni de estado. La composición poblada aprobada de `page04.png` vivirá exclusivamente bajo `storybook/`, con fixtures que no pueden ser alcanzados desde el grafo de `src/main.tsx`.

El baseline obligatorio completo quedará instalado, fijado en `package.json` y `pnpm-lock.yaml` y acreditado por configuración o pruebas de resolución. TanStack Form, Table y Virtual no tendrán consumidores en producto, stories ni componentes de demostración. No se añadirán backend, contratos API, stores, Query, persistencia, empaquetado de escritorio, responsive, tema oscuro ni capacidades futuras.

## Autoridad y límites

| Evidencia | Uso en este diseño |
|---|---|
| `page04.png` | Autoridad visual exclusiva para la historia poblada a 1440×980. |
| `design.op` | Sólo confirma dimensiones workstation, shell, barra superior y cue de paleta; su pantalla de Maestro de recursos no se implementa. |
| Manual canónico GARFEX | Autoridad para tokens claros, contraste, tipografía temporal e integridad de marca. |
| Seis SVG de `docs/` | Únicos activos gráficos de marca permitidos; no se modifican ni recolorean. |
| Propuesta, prepropuesta y specs | Autoridad funcional para separación runtime/Storybook, routing, teclado, accesibilidad y no objetivos. |

La única composición aceptada es workstation a 1440×980. No se añaden media queries de recomposición, variantes tablet/móvil, gestos ni criterios touch. El runtime puede mantener un ancho mínimo de workstation y desbordar en viewports menores, pero eso no constituye soporte responsive.

## Arquitectura resultante

### Árbol feature-first mínimo

```text
.
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── storybook/
│   ├── styles.css
│   └── operations-inbox/
│       ├── ApprovedPopulatedInbox.tsx
│       ├── OperationsInboxApproved.stories.tsx
│       └── operationsInbox.fixtures.ts
├── src/
│   ├── main.tsx
│   ├── styles.css
│   ├── app/
│   │   ├── providers/AppProviders.tsx
│   │   ├── router.tsx
│   │   ├── routeTree.gen.ts
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   └── bandeja.tsx
│   │   └── shell/
│   │       ├── AppShell.tsx
│   │       └── CommandEntry.tsx
│   ├── features/
│   │   └── operations-inbox/
│   │       └── OperationsInboxEntry.tsx
│   └── shared/
│       ├── design-system/
│       │   ├── GarfexLogoNegative.tsx
│       │   └── tokens.css
│       └── keyboard/
│           ├── keyboardArbitration.ts
│           └── useGlobalCommandShortcut.ts
├── tests/
│   ├── setup.ts
│   ├── config/baseline.test.ts
│   ├── architecture/runtimeFixtureIsolation.test.ts
│   ├── unit/appShell.test.tsx
│   ├── unit/commandEntry.test.tsx
│   └── e2e/operationsInbox.workstation.spec.ts
├── scripts/
│   └── verify-runtime-fixtures.mjs
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── prettier.config.mjs
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tsconfig.storybook.json
├── tsr.config.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.storybook.config.ts
```

No se crean carpetas vacías para API, domain, entities, hooks, layouts genéricos, stores, services, repositories, queries, adapters o futuras features. Una responsabilidad usada sólo por Bandeja permanece en `features/operations-inbox`; sólo shell, tokens, logo y arbitraje global de teclado son transversales.

### Responsabilidades

| Límite | Responsabilidad |
|---|---|
| `src/main.tsx` | Crear la raíz React y montar `AppProviders`; no conoce rutas concretas ni fixtures. |
| `app/providers` | Componer el `RouterProvider` real. No agrega contextos vacíos. |
| `app/router.tsx` | Crear el router a partir de `routeTree.gen.ts` y declarar tipos del router. |
| `app/routes` | Root shell, redirección `/` → `/bandeja` y ruta única de producto `/bandeja`. |
| `app/shell` | Rail, barra superior, destino Bandeja activo y entrada global de comandos. |
| `features/operations-inbox` | Encabezado y región operativa runtime sin datos ni semántica de estado. |
| `shared/design-system` | Tokens GARFEX y uso inalterado del SVG oficial que sí consume el shell. |
| `shared/keyboard` | Decisión pequeña y comprobable sobre si el atajo global puede actuar. |
| `storybook/operations-inbox` | Réplica poblada y fixtures de evidencia; nunca forma parte de `src`. |

## Bootstrap y reproducibilidad

### Manifiesto y lockfile

`package.json` será privado, declarará ESM (`"type": "module"`), React/React DOM en major 19 y un campo `packageManager` con una versión exacta de pnpm. La versión de Node soportada se documentará y fijará en la superficie de entorno del repositorio; no se usarán rangos flotantes para pnpm. Todas las dependencias tendrán versiones exactas elegidas como un conjunto compatible al implementar y `pnpm-lock.yaml` se versionará.

La instalación reproducible será `pnpm install --frozen-lockfile`. CI y verificación no regenerarán silenciosamente el lockfile. Cualquier actualización del baseline exige cambiar manifiesto y lockfile en el mismo slice y volver a ejecutar toda la puerta de calidad. No se generarán `package-lock.json`, `yarn.lock` ni bun lockfiles.

Dependencias de runtime:

- `react`, `react-dom` en major 19;
- `@tanstack/react-router`;
- `react-aria-components`.

Dependencias de desarrollo/configuración:

- TypeScript, tipos de React, Vite y `@vitejs/plugin-react`;
- `@tanstack/router-plugin` y `@tanstack/router-cli` para rutas generadas;
- `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/react-virtual`;
- Tailwind CSS y su plugin oficial actual para Vite, `@tailwindcss/vite`;
- Vitest, jsdom, React Testing Library, jest-dom y user-event;
- Playwright y `@axe-core/playwright`;
- Storybook con renderer Vite, addon de accesibilidad e integración oficial con Vitest, todos en el mismo major;
- ESLint flat config, `typescript-eslint`, plugins de hooks/refresh/Storybook y compatibilidad con Prettier;
- Prettier y, si la versión fijada es compatible con Tailwind fijado, el plugin oficial de orden de clases.

Las versiones concretas no se adivinan en este documento: se fijarán juntas al crear el lockfile y se aceptarán sólo si `pnpm install --frozen-lockfile`, build, Storybook y pruebas pasan. Esto evita mezclar majors incompatibles de Vite, Vitest y Storybook.

### Scripts contractuales

`package.json` expondrá como mínimo:

| Script | Contrato |
|---|---|
| `dev` | Generar/verificar rutas y arrancar Vite. |
| `build` | Generar rutas, ejecutar TypeScript y producir el build Vite con manifest. |
| `test` | Ejecutar Vitest/RTL en modo finito. |
| `test:watch` | Ejecutar Vitest interactivo. |
| `test:stories` | Ejecutar la integración Storybook/Vitest separada. |
| `test:e2e` | Ejecutar Playwright. |
| `storybook` | Arrancar Storybook. |
| `build-storybook` | Producir Storybook estático. |
| `lint` | ESLint con cero warnings permitidos. |
| `format` / `format:check` | Escribir o comprobar Prettier. |
| `typecheck` | Generar rutas y comprobar los proyectos TypeScript. |
| `router:generate` / `router:check` | Regenerar y detectar deriva de `routeTree.gen.ts`. |
| `verify:runtime-bundle` | Build más inspección de manifest/chunks contra fixtures. |

Los binarios también quedan disponibles en sus formas exigidas: `pnpm exec vitest` y `pnpm exec playwright test`.

### Paquetes instalados sin uso de producto

`@tanstack/react-form`, `@tanstack/react-table` y `@tanstack/react-virtual` permanecerán sin imports en `src/` y `storybook/`. No habrá formulario de ejemplo, wrapper de tabla, lista virtualizada ni proveedor ficticio. Estas librerías no necesitan una configuración runtime propia mientras no exista un consumidor real; su integración se acredita por:

1. declaración exacta en `package.json` y resolución congelada en `pnpm-lock.yaml`;
2. smoke de Node con `import.meta.resolve` dentro de `tests/config/baseline.test.ts`;
3. prueba arquitectónica que rechaza imports de esos tres paquetes desde producto y stories;
4. instalación limpia con `--frozen-lockfile`.

Storybook, Vitest, RTL, Playwright, ESLint y Prettier tampoco son imports de producto: sus consumidores legítimos son exclusivamente sus archivos de configuración, tests y stories. TanStack Router, React Aria Components y Tailwind sí tienen responsabilidades observables en el slice.

## Superficies de configuración

### Vite y Tailwind

`vite.config.ts` registrará, en este orden, el plugin de TanStack Router, el plugin oficial `@tailwindcss/vite` y `@vitejs/plugin-react`. Activará `build.manifest` para la prueba de aislamiento y no añadirá aliases o entradas hacia `storybook/`. No habrá proxy, variables de endpoint, PWA, SSR ni empaquetado Electron/Tauri.

Se usará Tailwind CSS con su enfoque CSS-first compatible con el plugin Vite actual. `src/styles.css` importará Tailwind acotando su detección de clases a `src/`, importará `tokens.css` y mapeará tokens semánticos mediante `@theme inline`; no se creará `tailwind.config.*` sólo por costumbre. `storybook/styles.css` tendrá una entrada Tailwind independiente que escanee `storybook/` y `src/`. Así, las clases exclusivas de stories no inflan el CSS runtime.

`tokens.css` definirá en `:root`:

- `background #F7F6F3`, `surface #FFFFFF`, `surface-subtle #F1F0EC`;
- `text-primary #1F1F1D`, `text-secondary #5F5D58`, `text-muted #6D6A64`;
- `border #D9D6CF`, `border-strong #B8B4AB`;
- `primary #7C0000`, `primary-hover #680000`, `primary-active #540000`, `primary-subtle #F7EAEA`;
- `accent #F2D031`, `on-accent #2B2500`, `focus #8A6800`.

También fijará `color-scheme: light`. No habrá selector dark, clase `.dark`, variante `dark:` ni consulta `prefers-color-scheme` que altere colores. El amarillo no se usará para texto pequeño sobre fondo claro.

La pila temporal será `Inter, Arial, sans-serif`; Inter sólo se declarará si el paquete o archivo de fuente se instala legítimamente. En ausencia del archivo, la pila efectiva empezará en Arial y sistema, sin petición remota. Nexa y RNS Sanz no se declararán como disponibles hasta resolver licencia y archivos.

### TypeScript y rutas

`tsconfig.json` contendrá referencias a `tsconfig.app.json`, `tsconfig.node.json` y `tsconfig.storybook.json`.

- `tsconfig.app.json`: modo estricto, JSX React, tipos Vite; incluye sólo `src/` y excluye stories/tests.
- `tsconfig.node.json`: configuraciones, scripts y tests Node donde corresponda.
- `tsconfig.storybook.json`: incluye `.storybook/`, `storybook/` y los componentes de `src/` que las stories consumen.

No habrá alias Storybook disponible en el proyecto app. Esto hace que una importación accidental de fixtures desde runtime falle por límite de proyecto además de fallar lint y la prueba arquitectónica.

`tsr.config.json` apuntará a `src/app/routes` y generará `src/app/routeTree.gen.ts`. La CLI y el plugin Vite compartirán esa configuración. `routeTree.gen.ts` se versionará para que un checkout limpio pueda ser inspeccionado y typechecked, llevará su cabecera de generado, quedará excluido de edición manual/formatting y se comprobará con `router:check`. Una diferencia después de regenerar es fallo, no un cambio que CI deba ocultar.

Estrategia de rutas:

- `__root.tsx` renderiza `AppShell` y un `Outlet`;
- `index.tsx` sólo redirige `/` a `/bandeja`, sin loader ni consulta;
- `bandeja.tsx` renderiza `OperationsInboxEntry`;
- no se registran rutas de Recursos, Catálogo, Actividad, Administración, Configuración ni Maestro de recursos;
- no se añaden loaders, search schemas de dominio, prefetch de datos ni error/loading components inventados.

### ESLint y Prettier

`eslint.config.js` usará flat config y separará:

- reglas TypeScript/React para `src/`;
- entorno Vitest/Testing Library para `tests/config`, `tests/unit` y arquitectura;
- reglas Storybook sólo para `storybook/**/*.stories.*`;
- entorno Node para configuraciones y scripts;
- `no-restricted-imports` en `src/**/*` para impedir cualquier acceso a `storybook/`, fixtures y los tres TanStack sin consumidor aprobado.

`eslint-config-prettier` resolverá conflictos; ESLint no ejecutará Prettier. `prettier.config.mjs` será dueño del formato y `.prettierignore` excluirá builds, cobertura, lockfile según soporte de pnpm y `routeTree.gen.ts`. Si se usa el plugin de Tailwind, debe pertenecer al mismo pipeline de Prettier y no a ESLint.

### Vitest, RTL, Storybook y Playwright

`vitest.config.ts` será dueño de tests de configuración, arquitectura y componentes. Usará jsdom para RTL, `tests/setup.ts` para `@testing-library/jest-dom/vitest`, restauración de mocks y cleanup. Los tests de configuración/arquitectura declararán entorno Node. Excluirá `tests/e2e`, stories y artefactos generados.

`vitest.storybook.config.ts` contendrá únicamente la integración oficial Storybook/Vitest y apuntará a `.storybook`; no duplicará tests de runtime. `.storybook/main.ts` descubrirá stories sólo bajo `storybook/**/*.stories.tsx`, usará `@storybook/react-vite` y addons de accesibilidad/Vitest del mismo major. `.storybook/preview.ts` importará `storybook/styles.css`, fijará background claro y viewport 1440×980 y habilitará fallos de accesibilidad según soporte de la versión fijada.

`playwright.config.ts` será dueño sólo de `tests/e2e`. Arrancará Vite mediante `webServer`, usará un `baseURL` local, viewport exacto 1440×980, trazas en primer retry y screenshots sólo ante fallo. No definirá proyectos móvil/tablet. El recorrido runtime no dependerá de Storybook. La verificación visual de la story podrá usar un comando/proyecto explícito separado, sin mezclarla con la aceptación runtime.

## Diseño runtime

### Shell y Bandeja

El shell tendrá un rail oscuro de ancho fijo workstation, el SVG oficial completo negativo con nombre accesible `GARFEX`, un único enlace accionable `Bandeja` marcado como actual y una barra superior de 64 px con el disparador visible de comandos. No mostrará contador `23`, identidad `Administrador`, estado `Activo/Sincronizado` ni enlaces futuros, porque serían datos o capacidades no autorizados.

`OperationsInboxEntry` mostrará el eyebrow y `h1` de Bandeja y una región principal identificable. No mostrará filas, métricas, filtros, panel, skeleton, spinner, icono de error, mensaje “sin pendientes”, ilustración ni texto que comunique vacío, loading, error, sin resultados o conectividad. La ausencia de contenido no tendrá `role="status"`, `aria-busy` ni live region. Tampoco iniciará efectos, fetches, lectura de storage o timers.

### Activo oficial

`GarfexLogoNegative.tsx` importará como URL el archivo existente `docs/garfex-blanco-negativo.svg`; no copiará paths SVG a JSX ni usará `dangerouslySetInnerHTML`. El `<img>` preservará su relación intrínseca, usará `object-fit: contain`, tendrá alt `GARFEX` y reservará el área libre del manual. No se aplican filtros, sombras, giros ni recoloreado. Los SVG positivos conservan su rojo interno `#8B0000`; este cambio no los “corrige” a `#7C0000`.

### Entrada mínima de comandos

`CommandEntry` usará primitivas directas de React Aria Components: `Button`, `ModalOverlay`, `Modal`, `Dialog`, `TextField`, `Label` e `Input`. No se crea una biblioteca wrapper. El trigger visible dirá `Buscar o ejecutar comando…`, tendrá nombre accesible y mostrará la pista `Ctrl/Cmd + K`. La capa contiene sólo título, campo editable y ayuda neutra; no contiene resultados, recientes, ranking, categorías, permisos ni comandos ejecutables.

Flujo de apertura/cierre:

1. El botón o el atajo solicitan `open(opener)` al mismo estado controlado.
2. Antes de abrir se guarda una referencia al `document.activeElement` si es un `HTMLElement` conectado.
3. React Aria monta el modal, aísla la capa y mueve el foco al input mediante `autoFocus`.
4. `Tab` y `Shift+Tab` no tienen handler de aplicación; el navegador y la contención accesible de React Aria gobiernan el recorrido.
5. React Aria consume `Escape` para cerrar únicamente el modal superior. No existe listener global de Escape.
6. Tras desmontar, se enfoca el opener guardado si sigue conectado y habilitado; si no, no se fuerza un destino inventado. El valor efímero del input se limpia y nunca se persiste ni envía.

No se habilita cierre por click exterior si la primitiva lo considera una capacidad opt-in no aprobada. La capa incluirá un `Button` visible `Cerrar entrada de comandos` como alternativa de mouse; sólo cierra la capa y restaura foco, sin comportamiento de negocio.

### Arbitraje de teclado

El listener global de `Ctrl/Cmd + K` se instala una sola vez desde el shell, en fase bubble, y delega en `keyboardArbitration.ts`. La decisión sigue este orden:

1. **IME/editable:** si `event.isComposing`, keyCode 229, target editable, `input`, `textarea`, `select`, `contenteditable` o rol editable, no actúa.
2. **Composite:** si un composite de React Aria ya consumió legítimamente el evento (`defaultPrevented`), no actúa.
3. **Overlay:** si la capa está abierta, no reabre ni ejecuta el atajo global; Escape pertenece al modal.
4. **Feature:** un evento consumido por la feature tampoco llega al nivel global.
5. **Global:** sólo entonces, si la tecla es `k`, coincide exactamente el modificador de plataforma y no hay modificadores incompatibles, previene el default y abre la capa.

La utilidad devuelve una decisión comprobable, no un bus de comandos. No captura `/`, `?`, flechas, espacio o Enter porque sus comportamientos de feature no están aprobados en runtime. Las pruebas de precedencia construyen eventos consumidos/editables sin crear composites ficticios de producto.

## Storybook poblado y aislamiento

### Composición aprobada

`ApprovedPopulatedInbox.tsx` reproducirá `page04.png` en un frame fijo de 1440×980: rail de 216 px, topbar de 64 px, encabezado, indicadores, filtros, barra de acciones, lista pendiente, panel contextual y referencia inferior de atajos. Los nombres, métricas y registros se definirán exclusivamente en `operationsInbox.fixtures.ts` y reflejarán la evidencia, no un modelo de dominio.

Los labels de áreas futuras que aparezcan por fidelidad en el rail serán texto inerte y story-only; no son links, rutas ni capacidades runtime. La tabla de la story será HTML semántico local, no TanStack Table. Las acciones de la captura se representarán como texto inerte de evidencia, no como botones habilitados o deshabilitados; así no se inventan transiciones ni estados interactivos.

El aislamiento se etiqueta en tres niveles:

- nombre de story: `Aprobada 1440×980 — fixtures de presentación`;
- descripción Docs: `page04.png es la autoridad; no son datos reales ni contrato de backend`;
- nota accesible dentro del canvas, visualmente oculta para no alterar la comparación, con el mismo aviso.

### Imposibilidad estructural de import runtime

1. Los fixtures están fuera de `src/`.
2. `tsconfig.app.json` no incluye `storybook/` y no ofrece alias hacia él.
3. Vite runtime tiene una sola entrada, `src/main.tsx`, sin plugin/alias Storybook.
4. ESLint prohíbe imports Storybook/fixture desde `src/`.
5. La prueba de arquitectura recorre imports estáticos y dinámicos desde `src/main.tsx` y falla si sale hacia `storybook/`.
6. `verify-runtime-fixtures.mjs` inspecciona el manifest y chunks de `dist/` y falla si encuentra rutas de story o un sentinel exclusivo de fixture.
7. Storybook usa su propia entrada CSS; Tailwind runtime no escanea `storybook/`.

Los componentes runtime pueden ser importados por Storybook; la dirección inversa es ilegal. No habrá barrel raíz que reexporte stories o fixtures.

### Método de fidelidad

La implementación visual se hará con una matriz de medición derivada de `page04.png`, no “a ojo”: coordenadas principales, anchuras, alturas, gaps, jerarquía tipográfica, tokens y densidad se registran durante el slice. Se capturará la story exactamente a 1440×980 con fuentes deterministas y animaciones desactivadas. La revisión seguirá este orden:

1. comparación lado a lado con `page04.png`;
2. overlay al 50 % para detectar desplazamientos estructurales;
3. diff visual para localizar diferencias, sin aceptar automáticamente un umbral alto;
4. revisión manual de semántica/foco para asegurar que la fidelidad no degrade WCAG;
5. creación o actualización del snapshot de implementación sólo después de aprobación explícita.

`design.op` no se usa como referencia de la tabla de Bandeja y no se modifican los artefactos congelados.

## Flujos de datos y eventos

### Runtime

```text
URL / o /bandeja
  → TanStack Router
  → AppShell + OperationsInboxEntry
  → sin loader, fetch, storage, store ni fixture

Button o Ctrl/Cmd+K
  → keyboardArbitration
  → estado local de CommandEntry
  → Modal React Aria
  → texto efímero sólo en memoria
  → Escape/cerrar
  → restauración del foco
```

### Storybook

```text
Storybook entry
  → OperationsInboxApproved.stories.tsx
  → ApprovedPopulatedInbox.tsx
  → operationsInbox.fixtures.ts

src/main.tsx ──X──> storybook/operations-inbox
```

No existe contrato de entidad, endpoint, DTO, caché, provider de datos ni frontera API futura en este cambio.

## Contratos verificables

| Contrato | Prueba principal |
|---|---|
| pnpm y baseline resoluble | manifest/lock/config smoke con entorno Node. |
| React major 19 | inspección de manifest y resolución instalada. |
| `/` entra a `/bandeja` | prueba Router memory history y Playwright. |
| Shell reconocible | RTL por roles/nombres y Playwright. |
| Runtime sin datos/estado inventado | assertions de ausencia y ausencia de efectos. |
| Trigger y atajo abren la misma capa | RTL user-event. |
| Foco entra y se restaura | RTL más Playwright en navegador real. |
| IME/editable/consumido/overlay preceden global | tests unitarios de arbitraje y componente. |
| Tab no se captura | espía de `preventDefault` y recorrido Playwright. |
| Un Escape cierra una capa | RTL y Playwright. |
| Fixtures inaccesibles | test de grafo, lint y verificación post-build. |
| Story aprobada y rotulada | story play test/build Storybook. |
| 1440×980 y fidelidad | captura Playwright + revisión visual. |
| WCAG aplicable | RTL semántico, addon a11y, axe Playwright y revisión manual. |

## Estrategia de pruebas y orden TDD estricto

El arnés mínimo se instala primero; desde el primer test, cada comportamiento sigue RED → GREEN → REFACTOR y se conserva el resultado real de cada comando.

1. **Smoke de configuración:** escribir primero tests fallidos para manifest, pnpm exacto, lockfile, plugins/configs, scripts y resolución de todo el baseline. Hacer verde sólo bootstrap/configuración; no crear UI de ejemplo.
2. **Shell y ruta runtime:** test fallido de `/` → `/bandeja`, logo, navegación única, heading y ausencia de datos/estados; implementar mínimo.
3. **Overlay, teclado y foco:** tests fallidos por trigger, atajo, autoFocus, IME/editable/defaultPrevented/overlay, Tab no capturado, Escape único y restauración; implementar con React Aria.
4. **Aislamiento de fixtures:** crear primero la prueba de frontera fallida/expectativa de ubicación y restricciones; después añadir `storybook/` y el fixture sentinel. Ningún test importa fixtures desde una ruta runtime.
5. **Storybook:** story play test y metadatos primero; después composición 1440×980 y build estático.
6. **Playwright workstation:** recorrido fallido inicial para `/bandeja`, Tab, trigger/atajo, foco y Escape; implementar/ajustar sin ampliar comportamiento.
7. **Accesibilidad:** nombres, landmark/heading, contraste, focus visible, addon a11y y axe; complementar con revisión manual de árbol y teclado.
8. **Puerta final:** `router:check`, pruebas enfocadas, `test`, `test:stories`, `test:e2e`, `verify:runtime-bundle`, `build-storybook`, `build`, `lint`, `format:check` y `typecheck`.

Los tests visuales no sustituyen assertions semánticas. jsdom no acredita por sí solo restauración/focus trap real; Playwright cubre el camino de navegador. Axe no sustituye la revisión manual de contraste, orden y significado.

## Mapa de implementación por archivo

| Archivo | Cambio previsto |
|---|---|
| `package.json`, `pnpm-lock.yaml` | Baseline exacto, scripts y reproducibilidad pnpm. |
| `vite.config.ts` | Router plugin, Tailwind Vite, React y build manifest; sin proxy. |
| `tsr.config.json`, `src/app/routeTree.gen.ts` | Generación de rutas y política de deriva. |
| `tsconfig*.json` | Límites app/node/Storybook y modo estricto. |
| `src/main.tsx`, `src/app/providers/AppProviders.tsx` | Arranque React 19 y RouterProvider real. |
| `src/app/router.tsx`, `src/app/routes/*` | `/`, `/bandeja`, root shell y ninguna ruta futura. |
| `src/app/shell/AppShell.tsx` | Shell workstation honesto y trigger visible. |
| `src/app/shell/CommandEntry.tsx` | Modal mínimo React Aria y ciclo de foco. |
| `src/features/operations-inbox/OperationsInboxEntry.tsx` | Entrada runtime sin registros ni estado semántico inventado. |
| `src/shared/keyboard/*` | Arbitraje y listener global mínimo. |
| `src/shared/design-system/*`, `src/styles.css` | Tokens claros, fallback y logo oficial por URL. |
| `.storybook/*`, `storybook/**/*` | Config aislada, story poblada, fixture y CSS exclusivo. |
| `vitest*.config.ts`, `tests/setup.ts` | Fronteras Vitest/RTL y Storybook. |
| `playwright.config.ts`, `tests/e2e/*` | Camino workstation 1440×980 y axe. |
| `eslint.config.js`, `prettier.config.mjs` | Calidad y restricciones de imports. |
| `tests/config/*`, `tests/architecture/*` | Baseline, paquetes sin consumidores e inaccesibilidad de fixtures. |
| `scripts/verify-runtime-fixtures.mjs` | Evidencia post-build de exclusión del bundle. |

## Trade-offs y alternativas rechazadas

| Decisión | Beneficio | Coste aceptado / alternativa rechazada |
|---|---|---|
| SPA Vite web | Menor superficie y coincide con alcance frontend. | Se rechaza Electron/Tauri y cualquier empaquetado desktop. |
| `/bandeja` sin loader | Entrada honesta y sin contrato inventado. | Runtime queda deliberadamente incompleto. |
| Fixtures fuera de `src` | Frontera importable fácil de auditar. | Story y runtime no comparten una supuesta capa de datos. |
| HTML semántico story-only | Replica la captura sin justificar motores. | TanStack Table/Virtual quedan sin uso hasta necesidad real. |
| React Aria directo | Semántica/foco probados sin biblioteca propia. | Se rechazan wrappers genéricos y modal manual. |
| Estado local del overlay | No introduce autoridad ni store global. | No hay catálogo, historial ni comandos persistentes. |
| Route tree generado y versionado | Typecheck e inspección reproducibles. | Requiere chequeo explícito de deriva. |
| Tailwind CSS-first con entradas separadas | Tooling actual y CSS runtime aislado de stories. | No hay config JS ni theme switching. |
| Sólo logo negativo usado | Activo adecuado al rail sin alterar SVG. | No se copian ni exponen variantes sin consumidor. |
| Viewport fijo workstation | Fidelidad al único diseño aprobado. | No se promete responsive ni touch. |

También se rechazan: backend o mocks de API; Query; stores; providers de fixtures; contratos DTO; persistencia; formularios de ejemplo; recursos/catálogo; tema oscuro; estado vacío diseñado por código; acciones masivas reales; y cualquier normalización de assets de marca.

## Seguridad, privacidad y rendimiento

- El runtime no realiza solicitudes, no recibe datos de negocio, no guarda input y no ejecuta texto de la entrada de comandos.
- No se usa `dangerouslySetInnerHTML`; el SVG se carga como imagen URL y permanece inalterado.
- Los fixtures no contienen secretos y sólo existen en el build de Storybook; aun así se rotulan como ficticios y no se publican como fallback runtime.
- No hay tokens, cookies, localStorage, permisos ni superficie de autenticación que asegurar en este slice.
- La ausencia de Query/store/Form/Table/Virtual en producto reduce JavaScript y evita trabajo en render no justificado.
- El split por ruta de TanStack puede activarse mediante la integración oficial, pero no se crearán chunks artificiales para una sola pantalla. El manifest permitirá vigilar el resultado real.
- La entrada Storybook separada evita que fixture strings y componentes poblados entren al bundle runtime; la prueba post-build convierte esta expectativa en una puerta.
- No se añade fuente remota, analytics, telemetría ni script de terceros.

## Rollout y rollback

El rollout es un bootstrap único sin feature flag porque no existe comportamiento previo ni integración externa. La aceptación ocurre primero en instalación limpia, luego runtime y finalmente Storybook. La story poblada no habilita producto y no debe desplegarse como ruta de la SPA.

Rollback consiste en retirar manifiesto/lockfile, configuraciones, `src/`, `storybook/`, tests y scripts añadidos por este cambio. No hay migraciones, datos persistidos, contratos, flags remotos ni efectos externos. `page04.png`, `design.op`, SVG y documentación de `docs/` permanecen intactos antes y después.

## Criterio para continuar

Una Bandeja productiva sólo puede diseñarse en otro cambio cuando exista un backend/contrato autorizado o un estado runtime aprobado en OpenPencil. Ese cambio decidirá entonces si Table, Virtual, Form o una frontera de datos tienen un consumidor real; este diseño no anticipa esa arquitectura.

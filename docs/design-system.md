# GARFEX Design System

Living documentation for the shared visual system across `garfex-erp-frontend`. The operational rules an LLM must follow before writing UI live in the `garfex-design-system` skill (`.claude/skills/garfex-design-system/SKILL.md`) — this document is the human-readable state of the system: what exists today, what's planned, and how to extend it. Design authority for visual identity itself remains the approved OpenPencil artifacts (`design*.op`, `recovery/`, PNG snapshots) and `docs/manual_identidad_garfex_ai_canonico_v2_digital.md`; this document implements that identity as code.

Status as of 2026-09: **incremental, first real components landed.** Tailwind CSS 4 is installed, wired, and now mapped to the existing runtime tokens via `@theme inline` in `src/styles.css` (so `bg-surface`, `text-primary`, `border-border`, etc. are real utilities — see the note under Tokens below on the resulting names). `Button`, `Dialog`, and `Field` exist under `src/shared/ui/` and are consumed by both `catalog-hierarchy` (`NuevaClaseSurface.tsx`) and `resources-master` (`CrearRecursoSurface.tsx`), which previously diverged visually. `PageHeader` and `WorkCard` now provide the shared structural chrome consumed by Resources Master and Catalog Hierarchy. `AsignarAtributoSurface.tsx`, `EditarAtributoSurface.tsx`, and `GestionarOpcionesSurface.tsx` still use the legacy `catalogHierarchy.css` classes for their dialog frame (`.catalog-dialog-backdrop/-modal/-heading/-actions`, `.catalog-create-trigger`) — they weren't migrated in this pass but are confirmed candidates for the next one (they already share the exact same dialog-frame markup as the migrated surface, just with more complex field layouts inside).

## Principles

- No visually isolated screens. A new screen composes existing shared patterns; it doesn't reinterpret the product visually.
- Screens in the same functional family (e.g. any catalog/model-admin screen) share the same visual and structural pattern unless a documented UX reason says otherwise.
- Tailwind is the styling infrastructure; shared components encapsulate the visual decisions so features never repeat large class blocks or arbitrary values.
- Interface tone: technical, clean, professional, modern, low visual fatigue — neutral surfaces, brand colors used as controlled accents.

## Tokens (current — `src/shared/design-system/tokens.css`)

Light mode only today (`color-scheme: light` — Dark is future work, not implemented):

| Token | Value |
|---|---|
| `--color-background` | `#f7f6f3` |
| `--color-surface` | `#ffffff` |
| `--color-surface-subtle` | `#f1f0ec` |
| `--color-text-primary` | `#1f1f1d` |
| `--color-text-secondary` | `#5f5d58` |
| `--color-text-muted` | `#6d6a64` |
| `--color-border` | `#d9d6cf` |
| `--color-border-strong` | `#b8b4ab` |
| `--color-primary` | `#7c0000` |
| `--color-primary-hover` | `#680000` |
| `--color-primary-active` | `#540000` |
| `--color-primary-subtle` | `#f7eaea` |
| `--color-accent` | `#f2d031` |
| `--color-on-accent` | `#2b2500` |
| `--color-focus` | `#8a6800` |
| `--font-sans` | `Inter, Arial, sans-serif` |

`success` / `warning` / `error` / `info` semantic tokens don't exist yet — add them when a real screen needs them, not speculatively. Other token categories (spacing, radius, shadows, z-index, breakpoints, motion, component sizes) are not centralized yet; see `references/atomic-vocabulary.md` in the skill for the target list.

Tailwind's `@theme inline` mapping generates utilities named after the property + the token key, so some read redundantly (`text-text-secondary`, `border-border`, `border-border-strong`, `bg-surface-subtle`) because the token names already embed a category word. This is a known, accepted Tailwind naming quirk — not a bug, and not worth renaming the underlying tokens (that would ripple through the whole existing CSS).

## Components that exist today

- **`Button`** (`src/shared/ui/Button.tsx`) — wraps react-aria-components' `Button`. Variants: `accent` (default — filled, used for the primary action: "Crear Clase", "Siguiente", the "Nueva Clase"/"Nuevo recurso" triggers) and `outline` (transparent background, primary-colored border/text — used for "Cancelar"/"Volver"). Both share disabled styling. No `size` prop yet — every real usage today is the same size; add one only when a second real size shows up. Renders a real `<kbd>` child styled via an arbitrary `[&_kbd]` selector, matching the trigger buttons' shortcut hint.
- **`Dialog` / `DialogHeading` / `DialogContent` / `DialogActions`** (`src/shared/ui/Dialog.tsx`) — wraps the `ModalOverlay`/`Modal`/`Dialog` react-aria-components frame with the approved backdrop/card/heading/footer chrome (630px width, 30px modal offset, border-primary card, "Esc cerrar" hint). `width` defaults to 630 (the approved value); `height` is optional and unset by default (content sizes naturally, capped at viewport height) — pass it explicitly only for a dialog whose height is pixel-locked by an approved OpenPencil snapshot (e.g. `NuevaClaseSurface` passes `height={440}`).
- **`Field` / `FieldSeparator`** (`src/shared/ui/Field.tsx`) — a label + control row matching the "Clave"/"Nombre"/"Descripción" treatment: uppercase 11px bold label by default, `hideLabel` for a screen-reader-only label (the Clave field at Clase level), `emphasis` for the taller "Nombre"-style row with the accent focus highlight. `fieldInputClass` / `fieldEmphasisInputClass` (`src/shared/ui/fieldStyles.ts`) are the matching input/textarea classes — apply them directly to the `<input>`/`<textarea>` you pass as `Field`'s children.
- **`PageHeader`** (`src/shared/ui/PageHeader.tsx`) — neutral responsive page chrome with `title`, one contextual middle region (`context` or `controls`), and an optional `action`. It owns only layout and surface styling; screens supply their headings, descriptors, search controls, and action semantics. Desktop uses three balanced regions; small viewports stack them in title, middle, action order.
- **`WorkCard`** (`src/shared/ui/WorkCard.tsx`) — a semantic `<section>` work surface. Its `compact` and `comfortable` densities own neutral surface, border, radius, and padding. Features provide the accessible label plus domain content and any domain-required minimum height.

Not yet extracted (still local, hand-rolled CSS): the Select-dropdown trigger chrome (`resources-master`'s `.resources-select-trigger` — no Catálogo equivalent exists to compare against, since Catálogo has no comboboxes), the multi-step wizard progress/field-grid patterns used by `AsignarAtributoSurface`/`GestionarOpcionesSurface`/`EditarAtributoSurface`, and the whole Atoms/Molecules/Organisms/Patterns vocabulary beyond these three.

## Atomic Design vocabulary, Button contract, styling chain

See `.claude/skills/garfex-design-system/references/atomic-vocabulary.md` — kept there so the operational skill and this document don't drift out of sync.

## Shared vs. feature (scope rule)

Global and reused by 2+ features → `src/shared/ui/`. Specific to one feature → stays in the feature. Applies to components AND logic — a shared UI component and its backing state logic can have different scopes (see the pagination example in `atomic-vocabulary.md`). Don't promote on a single occurrence; don't move business logic to shared just because two features look similar.

## Accessibility & responsive

WCAG 2.2 AA remains the project-wide target (`@storybook/addon-a11y`, `@axe-core/playwright`). Shared components must expose real focus, hover, active, and disabled states and must not install their own keyboard handling — see `src/shared/keyboard/` (arrows navigate, Enter confirms, one `document` keydown listener). Responsive behavior for shared components is designed when first built, not retrofitted.

## Light / Dark

Light is the only implemented mode. Dark is acknowledged as a future requirement but has no tokens, no design reference, and no implementation — do not invent Dark values.

## Anti-patterns

See `.claude/skills/garfex-design-system/references/anti-patterns.md`.

## How to add a new shared component

1. Confirm no equivalent exists (checklist in the skill).
2. Build it under `src/shared/ui/<Component>.tsx` using Tailwind utilities, consuming tokens from `tokens.css` (extend Tailwind's theme mapping to those tokens as part of the same change, don't hardcode hex).
3. Cover its interactive states (hover/active/focus/disabled/loading) and keep it compatible with `src/shared/keyboard/`.
4. Document it in this file (name, variants/sizes, when to use it).
5. Update the consuming feature(s) to use it instead of their local markup — never leave both in place.

## How to promote an existing feature-local piece to shared

1. Confirm a second feature genuinely needs the same visual piece (not just something similar-looking).
2. Extract it to `src/shared/ui/`, generalizing only what's actually shared — leave feature-specific business logic behind in the feature.
3. Update every consuming feature to import from `src/shared/ui/` and delete the local duplicate(s).
4. Document it here.

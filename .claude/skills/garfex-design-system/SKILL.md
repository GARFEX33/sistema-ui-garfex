---
name: garfex-design-system
description: "Trigger: UI component, screen, dialog, form, table, styling, CSS, Tailwind, src/features or src/shared/ui work. Enforce GARFEX's shared Design System."
license: Apache-2.0
metadata:
  author: garfex
  version: "1.0"
---

## Activation Contract

Load before writing or editing ANY visual component, screen, or CSS/Tailwind class under `src/features/*` or `src/shared/ui/`. Applies equally to `catalog-hierarchy`, `resources-master`, and every feature built after them.

## Hard Rules

- Never build a visually isolated screen. Before creating any component or style: search `src/shared/ui/` and sibling features for an equivalent. Exists → reuse it verbatim. Feature-coupled but conceptually generic → refactor and promote to `src/shared/ui/`. Used by 2+ features → MUST live in `src/shared/ui/`, never duplicated per feature.
- A screen in the same functional family as an existing one (any catalog/model-admin screen today) MUST keep its visual and structural pattern — header, cards, dialog chrome, spacing, typography — unless a UX reason is documented in `docs/erp-first-stage-design-brief.md` or explicitly agreed with the user.
- Tailwind is the styling layer for anything new. Do not add hand-rolled feature CSS for what a shared component + Tailwind utilities can express. No arbitrary values (`bg-[#7C0000]`, `p-[13px]`, `rounded-[7px]`) when a token in `src/shared/design-system/tokens.css` already covers it.
- Never hardcode a hex color in a feature; consume semantic tokens (`background`, `surface`, `surface-subtle`, `text-primary`, `text-secondary`, `border`, `primary`, `accent`, …). `success`/`warning`/`error`/`info` tokens don't exist yet — add them to `tokens.css` only when a real need appears, not speculatively.
- Shared components (Button, Select, Table, Dialog, PageHeader, EmptyState, …) own their own visual states (hover/active/focus/disabled/loading) and must compose with `src/shared/keyboard/`, never fight it: arrows navigate, Enter confirms, one document keydown listener lives in `KeyboardController.tsx`. A shared component must not install its own key handling.
- Don't promote anything to `src/shared/ui/` on a single occurrence. Don't move feature-specific business logic there just because two features look similar — e.g. a shared `PaginationControls` component is fine, but a list-pagination state controller stays local unless its *rules*, not just its shape, are identical across features.
- This skill always wins over `tailwind-design-system` if both are active: that skill's own token names and its Dark-mode setup never apply here — this skill's tokens (`src/shared/design-system/tokens.css`) and Light-only status are the project's real state. Use `tailwind-design-system` only for generic v4 syntax/pattern reference (CVA variants, compound components, animations, container queries).

## Decision Gates

| Situation | Action |
|---|---|
| Component/pattern already exists anywhere in the app | Reuse it as-is |
| Generic, feature-coupled today, needed elsewhere too | Refactor + promote to `src/shared/ui/` |
| Used only by this one feature | Keep it local to the feature |
| Used by 2+ features | Must live in `src/shared/ui/` |
| New token value needed (color/spacing/radius/etc.) | Add to `tokens.css` only on real repetition, never speculatively |
| `tailwind-design-system` also active for this task | Follow it for v4 syntax only; this skill's tokens/rules always win on conflict |

## Execution Steps

1. Read `references/checklist.md` and answer every item before writing UI code.
2. Read `references/atomic-vocabulary.md` for the Atoms/Molecules/Organisms/Patterns vocabulary, the styling-architecture chain, and the Button/shared-component contract.
3. Check `docs/design-system.md` for the current state: which tokens and shared components actually exist today, and that Light is the only implemented mode (Dark is documented as future work — never invent it).
4. Cross-reference `references/anti-patterns.md`; if the planned work matches one, stop and reuse/promote instead of proceeding.
5. If a genuinely new shared component is needed, build it under `src/shared/ui/` with Tailwind, document it in `docs/design-system.md`, and consume it from the feature — never inline the equivalent Tailwind block locally.

## Output Contract

Before declaring UI work done, confirm: no arbitrary Tailwind values were introduced without a token justification; the screen matches its functional family's existing pattern (or the deviation is documented); any component used by 2+ features lives in `src/shared/ui/`, not duplicated; keyboard behavior still routes through `src/shared/keyboard/`.

## References

- `references/checklist.md` — mandatory pre-implementation checklist.
- `references/anti-patterns.md` — prohibited patterns (blacklist).
- `references/atomic-vocabulary.md` — Atoms/Molecules/Organisms/Patterns vocabulary, styling-architecture chain, Button contract, token categories.
- `docs/design-system.md` — living documentation: principles, tokens, components that exist today, accessibility, responsive, Light/Dark, how to add or promote a component.

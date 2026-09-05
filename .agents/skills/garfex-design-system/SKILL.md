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

- Never build a visually isolated screen. Before creating any component or style, search `src/shared/ui/` and sibling features for an equivalent. If one exists, preserve its contract and reuse it directly or extend it through props/composition. Fork it only when requirements are semantically different, and document that divergence. If a feature-coupled pattern is conceptually generic and another feature needs the same contract and behavior, refactor and promote it to `src/shared/ui/`.
- A screen in the same functional family as an existing one (any catalog/model-admin screen today) MUST keep its visual and structural pattern — header, cards, dialog chrome, spacing, typography — unless a UX reason is documented in `docs/erp-first-stage-design-brief.md` or explicitly agreed with the user.
- Tailwind is the styling layer for anything new. Do not add hand-rolled feature CSS for what a shared component + Tailwind utilities can express. No arbitrary values (`bg-[#7C0000]`, `p-[13px]`, `rounded-[7px]`) when a token in `src/shared/design-system/tokens.css` already covers it.
- Never hardcode a hex color in a feature; consume semantic tokens (`background`, `surface`, `surface-subtle`, `text-primary`, `text-secondary`, `border`, `primary`, `accent`, …). `success`/`warning`/`error`/`info` tokens don't exist yet — add them to `tokens.css` only when a real need appears, not speculatively.
- Shared components (Button, Select, Table, Dialog, PageHeader, EmptyState, …) own their visual states (hover/active/focus/disabled/loading) and must compose with `src/shared/keyboard/`, never fight it. Global/document-level shortcuts and cross-screen navigation belong to the single listener in `KeyboardController.tsx`; accessible local interactions required by a component's contract (for example Dialog focus trapping, Select/Menu navigation, Escape, or Enter) stay encapsulated in that component without adding another document-level listener.
- Don't promote anything to `src/shared/ui/` on a single occurrence. Two visually similar implementations justify promotion only when they share the same semantic contract, behavior, and variation model. Keep feature-specific business logic local; e.g. shared `PaginationControls` presentation is fine, but list-pagination state stays local unless its rules are genuinely identical across features.
- Load `tailwind-design-system` as a supporting skill for generic Tailwind v4 syntax and patterns (CVA variants, compound components, animations, container queries). This skill always wins on conflicts: external token names and Dark-mode setup never apply here; `src/shared/design-system/tokens.css` and the project's Light-only status are authoritative.
- Load `cognitive-doc-design` as a supporting skill whenever creating or editing `docs/design-system.md`, design-system guides, architecture notes, or review-facing documentation. Use it to keep decisions, extension paths, and review checkpoints easy to scan; this skill remains authoritative for GARFEX-specific UI rules and technical truth.

## Decision Gates

| Situation | Action |
|---|---|
| Component/pattern already exists anywhere in the app | Reuse its contract directly or extend it through props/composition |
| Existing pattern cannot satisfy a semantically different requirement | Keep the divergence explicit and document why reuse/composition is unsafe |
| Generic, feature-coupled today, needed elsewhere with the same contract | Refactor + promote to `src/shared/ui/` |
| Used only by this one feature | Keep it local to the feature |
| Used by 2+ features with identical contract and behavior | Must live in `src/shared/ui/` |
| Two features only look similar | Keep them local until their semantic contract and variation model converge |
| New semantic role is required | Add a token to `tokens.css`, even on first use, and document its meaning |
| Value is only a one-off visual preference | Reuse the nearest semantic token; do not create a speculative token |
| A rule cannot be followed safely | Stop, document the exception and rationale, and obtain explicit user agreement before implementation |
| `tailwind-design-system` supports this task | Follow it for generic v4 syntax and patterns only; this skill's tokens/rules always win on conflict |
| Design-system documentation changes | Load `cognitive-doc-design`; preserve this skill and `docs/design-system.md` as the GARFEX-specific source of truth |

## Execution Steps

1. Read `references/checklist.md` and answer every item before writing UI code.
2. Read `references/atomic-vocabulary.md` for the Atoms/Molecules/Organisms/Patterns vocabulary, the styling-architecture chain, and the Button/shared-component contract.
3. Check `docs/design-system.md` for the current state: which tokens and shared components actually exist today, and that Light is the only implemented mode (Dark is documented as future work — never invent it).
4. Load `tailwind-design-system` when generic Tailwind v4 implementation guidance is needed; load `cognitive-doc-design` before writing or restructuring design-system documentation.
5. Cross-reference `references/anti-patterns.md`; if the planned work matches one, stop and reuse/promote instead of proceeding.
6. If a genuinely new shared component is needed, build it under `src/shared/ui/` with Tailwind, document it in `docs/design-system.md`, and consume it from the feature — never inline the equivalent Tailwind block locally.

## Output Contract

Before declaring UI work done, confirm: no arbitrary Tailwind values were introduced without semantic justification; the screen matches its functional family's existing pattern or has an explicitly agreed deviation; shared promotion is based on identical contract and behavior rather than visual similarity alone; global keyboard behavior routes through `src/shared/keyboard/` while accessible local interactions remain encapsulated; every rule exception is documented with its rationale and approval.

## References

- `references/checklist.md` — mandatory pre-implementation checklist.
- `references/anti-patterns.md` — prohibited patterns (blacklist).
- `references/atomic-vocabulary.md` — Atoms/Molecules/Organisms/Patterns vocabulary, styling-architecture chain, Button contract, token categories.
- `docs/design-system.md` — living documentation: principles, tokens, components that exist today, accessibility, responsive, Light/Dark, how to add or promote a component.

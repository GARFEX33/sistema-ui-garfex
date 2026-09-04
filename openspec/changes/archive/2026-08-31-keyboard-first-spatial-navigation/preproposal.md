# Preproposal — Keyboard First spatial navigation

## Product decisions

Status: **confirmed by the user**.

- GARFEX is Keyboard First across the entire application; the mouse is an alternative, never a requirement.
- `Tab` / `Shift+Tab` primarily move between major interface zones.
- `ArrowUp`, `ArrowDown`, `ArrowLeft`, and `ArrowRight` move focus spatially to the most appropriate visible, enabled interactive control using real geometry, proximity, and alignment.
- `Enter` executes or opens the focused control.
- `Escape` returns, cancels, or closes according to context and restores focus predictably.
- Spatial arrows and all single-key shortcuts are completely suspended while the user is writing or interacting with an editable/input context.
- Context-aware `N` opens the primary New action of the current screen: Nueva Clase, Nueva Familia, Nueva Tipo, or the future screen entity.
- `?` opens contextual keyboard help.
- `Ctrl/Cmd+K` remains the global Command Palette shortcut.
- `Ctrl+N` must never be captured.
- Focus traps are limited to dialogs/modals; no application-wide focus trap.
- Immediate sidebar behavior: ArrowUp/ArrowDown between Bandeja and Catálogo, Home/End boundaries, Enter navigation, visible focus, and spatial ArrowRight toward main content.
- The top-left `GARFEX` text becomes GARFEX red; no other visual redesign belongs to this change.
- The permanent documentation authority is the existing keyboard section of `docs/erp-first-stage-design-brief.md`; no duplicate keyboard guide will be created.
- Interaction and architecture tests are required.

## Research selection

External research is **not selected**. Repository evidence and explicit product decisions are sufficient.

## Scope boundary

The first slice establishes arbitration, spatial scoring, shell/sidebar behavior, contextual Nueva Clase, contextual help, Command Palette preservation, editing suppression, focus restoration, permanent documentation, and tests. It does not add backend behavior, routes, future entities, global stores, responsive/touch work, global focus traps, or continue the frozen visual remediation.

## Evidence

- `openspec/changes/keyboard-first-spatial-navigation/explore.md`
- `docs/erp-first-stage-design-brief.md`, section 11
- Existing keyboard modules under `src/shared/keyboard/`
- Existing shell and interaction tests

## Proposal readiness

Ready. Product decisions are explicit, research is unselected, evidence is repository-local, and no unresolved product choice blocks proposal.

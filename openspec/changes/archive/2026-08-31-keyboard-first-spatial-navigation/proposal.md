# Proposal — Keyboard First spatial navigation

## Status

Proposed from the confirmed preproposal and repository exploration. Product decisions are settled; external research is not selected.

## Intent

Establish **Keyboard First** as a permanent, cross-application GARFEX product and architecture rule: every real workflow must be operable without requiring a mouse, while mouse interaction remains supported as an alternative.

This change delivers a bounded first slice of that rule. It introduces shared keyboard-event arbitration, deterministic geometry-based spatial navigation, shell/sidebar behavior, contextual actions and help, focus lifecycle guarantees, canonical documentation, and strict interaction coverage. It does not attempt to integrate every current or future surface at once.

## Business problem and current-state gap

GARFEX currently has accessible controls and isolated keyboard behavior, including the Command Palette and modal focus restoration, but it lacks a coherent application-wide interaction contract. Arrow behavior, single-key commands, editable-field suppression, focus movement between visible controls, and contextual help are not centrally defined. As the application grows, surface-specific handlers would become inconsistent, difficult to explain, and risky for users entering data with keyboards or IMEs.

The immediate shell also exposes Bandeja and Catálogo as real destinations without the keyboard relationships expected of a keyboard-first workstation. Catalog has a real Nueva Clase action, but no safe contextual `N` contract. Existing future labels and hierarchy controls must not be mistaken for implemented product actions.

## Permanent product and architecture rule

The implementation and canonical documentation SHALL preserve these rules across GARFEX:

- The complete application is keyboard operable; a mouse is never required for a real workflow.
- `Tab` and `Shift+Tab` retain native behavior and primarily move between major interface zones. The application SHALL NOT install a document-wide roving tab order or capture Tab globally.
- Unmodified arrow keys move focus spatially among eligible controls using their actual viewport geometry. Directional half-plane, proximity, and perpendicular alignment determine the destination; text, language direction, list order, and DOM order are not substitutes for geometry. Tie-breaking must be deterministic.
- Spatial candidates must be connected, visible, enabled, operable, and within the active interaction context. Hidden, disabled, zero-area, inactive-overlay, and decorative elements are excluded.
- `Enter` executes or opens the focused control when that control has a real action.
- `Escape` closes, cancels, or returns according to the active context and restores focus predictably.
- Spatial arrows and all single-key shortcuts are suspended during editing, text entry, autocomplete/editor interaction, or IME composition. Arbitration must respect `defaultPrevented`, local consumption, modifier keys, and active overlays.
- `N` invokes the current screen's real primary New action only when one exists. This first slice enables Nueva Clase in its valid Catalog context and does not expose placeholder actions for Familia, Tipo, Recurso, or future entities.
- `?` opens contextual keyboard help for the active supported surface. Character detection must not assume a US keyboard layout.
- Exact platform `Ctrl/Cmd+K` remains the global Command Palette shortcut.
- `Ctrl+N` is prohibited from application capture and remains a browser/system command.
- Focus traps are permitted only inside modal/dialog overlays. No application-wide focus trap may be introduced.
- Focus must always have a visible state, and dismissing a modal or contextual overlay must restore the valid opener or an explicit accessible fallback.

These are durable constraints for later surfaces, not temporary shell-specific conventions. New integrations must reuse the arbitration and spatial contract rather than inventing conflicting local shortcuts.

## Current scope — bounded first slice

### 1. Shared arbitration and spatial engine

- Define reusable keyboard arbitration for editable descendants, form/search/editor/autocomplete semantics, contenteditable, IME composition, modifiers, prevented or locally consumed events, and active overlays.
- Preserve the existing exact `Ctrl/Cmd+K` behavior and explicitly prevent GARFEX code from claiming `Ctrl+N`.
- Add a pure geometry-scoring function that selects an eligible candidate from synthetic/current rectangles by direction, proximity, and alignment, with deterministic ties.
- Integrate the pure scorer through a minimal focus-navigation layer without a global store, speculative routing, backend behavior, or document-wide focus trap.
- Keep candidate sets bounded to real controls in an active zone or surface and measure actual layout when navigation occurs or when an explicitly invalidated layout requires it.

### 2. Shell and sidebar

- Treat native `Tab`/`Shift+Tab` order as movement between major shell zones.
- Make only the real sidebar destinations, Bandeja and Catálogo, participate in the immediate sidebar keyboard group.
- Support `ArrowUp`/`ArrowDown` between Bandeja and Catálogo, `Home` to the first destination, `End` to the last destination, and `Enter` to activate the focused destination.
- Support spatial `ArrowRight` from the sidebar toward the best eligible control in main content.
- Provide an unmistakable visible focus state without changing the existing visual composition.
- Do not convert static or future sidebar labels into routes, controls, or commands.

### 3. Contextual actions, help, and overlays

- Enable context-aware `N` for Nueva Clase only where that real action is available and valid.
- Provide contextual `?` keyboard help for supported first-slice contexts, using modal/dialog semantics if presented as an overlay.
- Preserve Command Palette behavior on `Ctrl/Cmd+K`.
- Preserve modal-only focus containment, deliberate Escape behavior, and opener focus restoration for the Command Palette, Nueva Clase, and contextual help.
- Ensure arrows, `N`, and `?` do not run while the user is editing or composing text inside those surfaces.

### 4. Visual and documentation boundary

- Change only the top-left `GARFEX` text to GARFEX red (`#7C0000`).
- Make no other visual, spacing, layout, typography, responsive, or component redesign.
- Do not modify, complete, normalize, revert, or otherwise touch the frozen partial catalog visual-remediation checkpoint.
- Update section 11, **Filosofía centrada en el teclado**, in `docs/erp-first-stage-design-brief.md` as the canonical permanent keyboard contract. Do not create a duplicate keyboard guide.

### 5. Strict interaction and architecture evidence

Implementation must proceed with strict TDD and provide focused evidence at the appropriate layers:

- Unit tests for arbitration precedence, editing/IME suppression, modifiers, `defaultPrevented`, `N`, `?`, preserved `Ctrl/Cmd+K`, and prohibited `Ctrl+N` capture.
- Unit tests for pure geometric scoring, all directions, proximity/alignment, deterministic ties, physical geometry under RTL, and exclusion of hidden, disconnected, zero-area, or disabled candidates.
- Interaction tests for Tab zone traversal, sidebar ArrowUp/ArrowDown/Home/End/Enter/ArrowRight, contextual Nueva Clase, help, Escape, modal-only traps, visible focus, and focus restoration/fallback.
- Browser-level tests where real bounding boxes, scrolling, overlay portals, and focus behavior cannot be proven reliably in a DOM test environment.
- Architecture tests preventing global focus traps, speculative future actions, runtime fixtures, and `Ctrl+N` capture.
- Regression coverage proving the existing visual composition remains unchanged except for the exact top-left GARFEX color.

## Future scope — explicitly deferred

The permanent rule is application-wide, but these integrations are later product slices:

- Real spatial selection/navigation across Clase, Familia, and Tipo once their selection behavior, dependencies, and actions exist.
- Nueva Familia, Nuevo Tipo, Recurso, or other context-aware `N` commands once each screen has a real permitted primary action.
- Recursos navigation, new routes, deep links, or new domain data.
- High-volume tables, virtualized lists, dense panels, complex forms, command-result sets, and other workstation surfaces requiring surface-specific integration with the same shared contract.
- Broader responsive, mobile, and touch interaction work.

Deferral does not exempt later work from Keyboard First; it prevents this slice from fabricating actions, data, or navigation merely to appear complete.

## Affected areas

Expected implementation impact is limited to:

- shared keyboard arbitration and a small pure spatial-navigation module;
- shell/sidebar and existing Command Palette integration;
- existing Catalog and Nueva Clase interaction points;
- contextual keyboard-help presentation;
- narrowly targeted focus and GARFEX text-color styles;
- section 11 of the canonical ERP design brief;
- keyboard, shell, catalog, overlay, browser interaction, visual regression, and architecture tests.

No backend, persistence, API, global state, domain-model, or route expansion is required.

## Non-goals

- Visual redesign or continuation of the frozen catalog remediation.
- Reordering the application with a global roving `tabindex` strategy.
- Capturing Tab, `Ctrl+N`, destructive shortcuts, or browser/system commands.
- Installing a global focus trap or replacing React Aria modal semantics.
- Creating fake New actions, fake routes, runtime fixtures, or placeholder domain behavior.
- Implementing Familia/Tipo/Recurso workflows or high-volume-surface navigation.
- Adding backend behavior, persistence, global stores, query layers, or speculative abstractions.
- Changing selection state to stand in for keyboard focus, or vice versa.
- Creating a second keyboard-policy document.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Global handlers interfere with typing, IME, native shortcuts, or local controls | Centralize precedence; detect editable ancestors and composition; respect modifiers, `defaultPrevented`, and local consumption; explicitly test prohibited `Ctrl+N` capture. |
| Geometry scoring feels unpredictable | Use a pure, documented directional score with deterministic tie-breaking and exhaustive rectangle-based tests; use viewport geometry for physical Left/Right even under RTL. |
| Hidden, disabled, stale, or portal controls receive focus | Filter candidate eligibility at navigation time and restrict candidates to the active surface/overlay. |
| Scroll or layout changes make measurements stale | Measure on interaction or use narrowly scoped invalidation; verify real browser behavior without a permanent whole-app observer. |
| Multiple layers handle the same Enter/Escape event | Define arbitration ownership and overlay precedence; keep dismissal within the active dialog rather than parallel global handlers. |
| Focus is lost after dismissal or opener removal | Restore only a connected, enabled opener and define/test an accessible fallback. |
| Permanent architecture becomes over-engineered for the first slice | Keep scoring pure and integration minimal; add no store, router abstraction, or future-entity registry without a real consumer. |
| The work accidentally changes the visual checkpoint | Constrain styling to focus visibility and the exact top-left GARFEX red; protect existing layout and visual assertions. |
| Help or single-key detection fails on international keyboards | Detect semantic `event.key`, cover `?` and case handling, and avoid US-layout assumptions. |
| Future teams treat this slice as the whole Keyboard First program | Document the permanent rule canonically and list deferred surface integrations explicitly. |

## Rollback

If the first slice causes unacceptable keyboard or focus regressions:

1. Remove the new spatial integration handlers and contextual `N`/`?` registrations from supported surfaces.
2. Remove the shared spatial-navigation integration and pure scorer if no safe consumer remains.
3. Restore the prior narrow Command Palette listener while retaining its existing exact `Ctrl/Cmd+K`, editable, and IME safeguards.
4. Revert only this change's focused documentation and top-left GARFEX color update if product rollback requires it.
5. Remove only tests introduced for the rolled-back behavior.

Rollback must not alter, revert, or absorb the pre-existing frozen catalog visual-remediation checkpoint. No data rollback or migration is needed because this change introduces no persisted data or backend contract.

## Success criteria

The change is successful when all of the following are true:

1. The canonical design brief states Keyboard First as a permanent cross-application GARFEX rule and documents the agreed key contract without a duplicate guide.
2. In non-editing contexts, geometry—not DOM order or text direction—deterministically selects the best eligible spatial target.
3. In editing, autocomplete/editor, form-control, contenteditable, and IME contexts, spatial arrows and single-key shortcuts do not interfere with user input.
4. Bandeja and Catálogo support ArrowUp/ArrowDown, Home/End, Enter, visible focus, and spatial ArrowRight into eligible main content while native Tab/Shift+Tab remains intact.
5. `N` opens Nueva Clase only in the context where the real action exists; no Familia, Tipo, Recurso, or placeholder command is exposed.
6. `?` opens contextual help and closes with predictable focus restoration.
7. Exact `Ctrl/Cmd+K` continues to open the Command Palette, while GARFEX never captures `Ctrl+N`.
8. Focus containment occurs only in modal/dialog contexts, and modal close/cancel restores a valid opener or tested accessible fallback.
9. Hidden, disabled, disconnected, zero-area, and inactive-overlay candidates never receive spatial focus.
10. Strict unit, interaction, browser, architecture, and targeted visual regression tests pass for the new contract.
11. The only intentional visual change is the top-left `GARFEX` text rendered in `#7C0000`; the frozen catalog visual checkpoint and all other composition remain untouched.
12. No backend, route, persisted data, global store, future domain action, or high-volume-surface integration is added.

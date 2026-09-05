# Implementation Tasks — keyboard-first-spatial-navigation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | Approximately 750–1,050 authored lines across implementation, tests, architecture checks, browser coverage, and canonical documentation |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Four sequential local units; PR/chained lifecycle remains unauthorized |
| Delivery strategy | ask-on-risk resolved to four local units |
| Chain strategy | not applicable |

Decision needed before apply: No — user selected four sequential local units
Chained PRs recommended: Yes, but not authorized
Chain strategy: not applicable
400-line budget risk: High

The forecast exceeds the 400-line review budget in aggregate, while each unit below is designed for approximately 150–300 authored lines. `ask-on-risk` requires the parent to decide before apply whether delivery may be split; this plan does not authorize commits, branches, pull requests, remotes, pushes, publishing, or receipt-driven development. Generated browser artifacts are excluded from authored-line estimates but remain part of verification identity.

## Non-negotiable boundaries

- Preserve the frozen `catalog-hierarchy-base` visual checkpoint, including `src/features/catalog-hierarchy/catalogHierarchy.css`, OpenPencil `.op`/`design-recovered.op` files, `recovery/`, PNG evidence, and existing visual assertions.
- Limit visual implementation changes to visible focus treatment when required and the top-left `.topbar-brand` text color `#7C0000`; do not redesign or clean up unrelated JSX, styles, spacing, typography, layout, responsive behavior, or catalog visuals.
- Add no backend, API, persistence, route, global store, runtime fixture, speculative entity action, global focus trap, global Tab capture, or `Ctrl+N` capture.
- Keep each unit independently understandable, testable, and rollbackable. Stop and ask the parent if a unit is likely to exceed 400 authored additions plus deletions.
- Record exact command lines and exact pass/fail evidence for every RED, GREEN, TRIANGULATE, REFACTOR, and final verification step; do not claim a command ran when it did not.

## Unit 1 — Pure arbitration and spatial scorer

**Start:** existing keyboard shortcut behavior and test harness are unchanged.  
**Finish:** pure arbitration and pure geometry scoring are covered and green, with no runtime wiring or DOM side effects.  
**Allowed scope:** `src/shared/keyboard/keyboardArbitration.ts`, `src/shared/keyboard/spatialNavigation.ts`, `tests/unit/keyboardArbitration.test.ts`, and `tests/unit/spatialNavigation.test.ts`.  
**Dependencies:** none.  
**Rollback:** remove only the new pure exports and their focused tests; leave the existing Command Palette integration and all catalog visual files unchanged.

### RED

- [x] Add failing table-driven tests in `tests/unit/keyboardArbitration.test.ts` for precedence `editing/IME → local consumption/defaultPrevented → active overlay → feature → global shortcut`, including input/textarea/select, textbox/searchbox/combobox/spinbutton roles, inherited and `contenteditable`, `data-keyboard-editing`, composed paths, `isComposing`, and `keyCode === 229`. <!-- sdd-owner: implementation -->
- [x] Add failing arbitration cases for modifier rejection, native `Tab`/`Shift+Tab` pass-through, semantic `event.key === '?'` including Shift and valid AltGraph, exact platform `Ctrl/Cmd+K`, contextual `N`/`n`, and explicit reserved-browser-command pass-through for `Ctrl+N`; assert `preventDefault` is not requested for pass-through decisions. <!-- sdd-owner: implementation -->
- [x] Add failing pure scorer cases in `tests/unit/spatialNavigation.test.ts` for Up/Down/Left/Right physical half-planes, primary and perpendicular gaps, alignment weighting, Euclidean tie comparison, lexicographic stable-id ties, overlapping rectangles, and no candidate. <!-- sdd-owner: implementation -->
- [x] Add failing scorer invariants proving candidate-array reordering, text changes, DOM-order proxies, and `dir="rtl"` do not change the result, and proving the same geometry always selects the same id. Run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/spatialNavigation.test.ts`; capture the expected RED failure output before implementation. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the minimal pure arbitration contract in `src/shared/keyboard/keyboardArbitration.ts`, returning stable reasons and ownership decisions without calling `preventDefault`, opening UI, focusing nodes, reading layout, or adding listeners. <!-- sdd-owner: implementation -->
- [x] Implement the documented `SpatialRect`, candidate, direction, score, and deterministic tie-break contract in `src/shared/keyboard/spatialNavigation.ts`; keep it independent of DOM order, language direction, text, and React state. Run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/spatialNavigation.test.ts` and capture GREEN output. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Extend the pure tests with editable descendants and editor markers reached through `composedPath()`, local consumption after an otherwise valid shortcut, every unsupported modifier combination, both platform modes, repeated equal-score evaluations, and candidates supplied in reversed order. <!-- sdd-owner: implementation -->
- [x] Verify the scorer’s physical RTL behavior explicitly: `ArrowRight` selects increasing viewport X and `ArrowLeft` selects decreasing viewport X; do not introduce logical-direction inversion or jsdom layout assumptions. Run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/spatialNavigation.test.ts --reporter=verbose` and retain the exact result. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor only duplicated fixtures, names, and pure helper boundaries while preserving the reason values, formula, tie order, and public behavior; run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/spatialNavigation.test.ts` and `pnpm typecheck`, recording both exact results. <!-- sdd-owner: implementation -->
- [x] Inspect the unit diff for absence of DOM effects, React integration, global listeners, layout caching, future-action registries, and visual-file edits before handing the green unit to Unit 2. <!-- sdd-owner: implementation -->

## Unit 2 — DOM adapter, active boundary, sidebar, ArrowRight, and GARFEX red

**Start:** Unit 1 is green and only pure contracts exist.  
**Finish:** eligible live DOM candidates and the real Bandeja/Catálogo sidebar support local navigation and physical `ArrowRight`, with the only resting visual change being GARFEX red.  
**Allowed scope:** `src/shared/keyboard/spatialNavigation.ts`, `src/app/shell/AppShell.tsx`, `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`, `src/styles.css`, `tests/unit/appShell.test.tsx`, and focused DOM-adapter tests in `tests/unit/spatialNavigation.test.ts`. `src/features/catalog-hierarchy/catalogHierarchy.css` is explicitly out of scope.  
**Dependencies:** Unit 1 GREEN.  
**Rollback:** remove the adapter, spatial markers, sidebar handlers, and exact `.topbar-brand` color change from these files only; preserve the prior shell behavior and never revert or edit the frozen catalog checkpoint.

### RED

- [x] Add failing DOM-adapter tests for connected, same-document, opt-in real controls inside an explicit boundary, and exclusion of hidden, `aria-hidden`, disabled, `aria-disabled`, inert, disconnected, decorative, zero-area, non-intersecting, and ancestor-invalid candidates. Use injected rectangles or explicit measurement seams rather than jsdom’s zero layout. <!-- sdd-owner: implementation -->
- [x] Add failing active-boundary and overlay-root cases proving that candidates outside the boundary or behind an active portaled overlay cannot receive focus, while candidates in the explicitly active root can; assert failed focus does not silently fall through to a second candidate. <!-- sdd-owner: implementation -->
- [x] Add failing `tests/unit/appShell.test.tsx` cases proving the immediate sidebar group contains only Bandeja and Catálogo, static/future labels receive no refs, roles, tab indices, handlers, or spatial ids, and `ArrowUp`/`ArrowDown` move without wrap while `Home`/`End` select the two limits. <!-- sdd-owner: implementation -->
- [x] Add failing sidebar cases for native `Enter` activation, `ArrowRight` handoff to the best measured main-content control, no-candidate focus retention, physical RTL behavior, and `Tab`/`Shift+Tab` remaining uncancelled. Run `pnpm exec vitest run tests/unit/spatialNavigation.test.ts tests/unit/appShell.test.tsx`; capture RED output. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `focusSpatialTarget` and its eligibility checks in `src/shared/keyboard/spatialNavigation.ts`, revalidating the origin and destination immediately before `focus({preventScroll: true})`, measuring current viewport rectangles per request, and honoring the explicit active overlay root. <!-- sdd-owner: implementation -->
- [x] Add the minimal local sidebar refs and handlers in `src/app/shell/AppShell.tsx`, use `.workspace-main` or the explicit active main boundary for `ArrowRight`, preserve native anchor `Enter`, and do not install any document-level handler for arrows or Tab. <!-- sdd-owner: implementation -->
- [x] Mark only the real Catalog surface/main controls in `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` without changing markup composition, classes, dimensions, text, or the `data-approved-frame="n2418"` checkpoint. <!-- sdd-owner: implementation -->
- [x] Change only `.topbar-brand` in `src/styles.css` to the existing primary token resolving to `#7C0000`, adding only the narrowly required visible-focus selector if RED proves it necessary; run `pnpm exec vitest run tests/unit/spatialNavigation.test.ts tests/unit/appShell.test.tsx` and capture GREEN output. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Add neighboring DOM cases for stale measurements after scroll/layout changes, ancestor visibility, `getClientRects()` emptiness, duplicate spatial ids, disabled controls that become enabled, and a focus target removed between scoring and focus; assert no unrelated target is chosen. <!-- sdd-owner: implementation -->
- [x] Exercise sidebar extremes, both directions, Home/End from either real link, native Tab traversal, active/inactive portal roots, and `ArrowRight` under `dir="rtl"`; run `pnpm exec vitest run tests/unit/spatialNavigation.test.ts tests/unit/appShell.test.tsx --reporter=verbose` and retain exact output. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor only test seams and local helper names after all Unit 2 assertions are green; run `pnpm exec vitest run tests/unit/spatialNavigation.test.ts tests/unit/appShell.test.tsx`, `pnpm typecheck`, and `pnpm lint`, recording exact results. <!-- sdd-owner: implementation -->
- [x] Review `git diff --stat` and the changed-file list for this unit; reject any edit to `catalogHierarchy.css`, OpenPencil/recovery/PNG files, unrelated visual rules, global Tab handling, or global focus trapping. <!-- sdd-owner: implementation -->

## Unit 2 correction — ArrowLeft handoff from Nueva Clase to sidebar

**Start:** Unit 2’s existing behavior and completed evidence remain intact; the missing reverse handoff is the only correction.  
**Finish:** the real Nueva Clase trigger can hand off physically left to the best eligible sidebar destination, while editing contexts and active modal boundaries retain ownership; Escape restores the trigger so the next ArrowLeft reaches Catálogo.  
**Allowed scope:** `src/app/shell/AppShell.tsx`, `src/shared/keyboard/spatialNavigation.ts`, `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`, `tests/unit/appShell.test.tsx`, `tests/unit/keyboardArbitration.test.ts`, `tests/unit/spatialNavigation.test.ts`, and the relevant workstation browser regression under `tests/e2e/**workstation*` or `tests/e2e/keyboard-first-spatial-navigation.spec.ts`. No CSS, markup composition, or frozen visual artifact changes.  
**Rollback:** remove only the reverse-handoff wiring and its correction tests; retain all completed Unit 2 behavior and evidence.

### RED

- [x] Add failing unit cases in `tests/unit/appShell.test.tsx` for ArrowLeft from the real Nueva Clase trigger, proving the destination is Catálogo when its current measured rectangle is the best eligible sidebar geometry rather than the DOM/list order. <!-- sdd-owner: implementation -->
- [x] Add failing unit cases in `tests/unit/spatialNavigation.test.ts` and `tests/unit/keyboardArbitration.test.ts` for physical Left scoring under `dir="rtl"`, and for no ArrowLeft interception from `input`, `textarea`, `select`, `contenteditable`, editable descendants, or editing/IME markers. <!-- sdd-owner: implementation -->
- [x] Add failing interaction cases in `tests/unit/catalogHierarchyNewClass.test.tsx` and `tests/unit/appShell.test.tsx` proving an active Nueva Clase modal boundary cannot escape to the sidebar, then one Escape closes only that modal and restores its valid trigger before the following ArrowLeft moves to Catálogo; capture the focused RED command output. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the minimal local ArrowLeft handoff in `src/app/shell/AppShell.tsx` and `src/shared/keyboard/spatialNavigation.ts`, measuring current viewport rectangles and selecting the closest eligible sidebar control through the existing geometry contract; preserve native Tab and avoid any document-level arrow listener. <!-- sdd-owner: implementation -->
- [x] Connect the real opener and modal-boundary state in `src/features/catalog-hierarchy/NuevaClaseSurface.tsx` so editable/IME contexts remain untouched, active modal focus cannot escape, and React Aria Escape restoration returns to the trigger without double handling; run the focused Vitest suite and record GREEN output. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Exercise competing sidebar rectangles, hidden/disabled/disconnected candidates, changed geometry after layout or scroll, equal-score stable ids, and `dir="rtl"` in `tests/unit/appShell.test.tsx` and `tests/unit/spatialNavigation.test.ts`; assert failed focus does not fall through to another sidebar control. <!-- sdd-owner: implementation -->
- [x] Add the real-browser regression in `tests/e2e/keyboard-first-spatial-navigation.spec.ts` or the discovered workstation target for Nueva Clase trigger → physical ArrowLeft → Catálogo, modal isolation, Escape restoration, editable suppression, and RTL geometry; assert visible focus and unchanged approved composition without updating snapshots. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor only correction-local geometry/test seams after the focused unit and browser assertions are green; rerun the focused Vitest command, `pnpm typecheck`, `pnpm lint`, and the relevant Playwright command, recording exact results. <!-- sdd-owner: implementation -->
- [x] Audit `git diff --stat` and `git diff --name-only` to confirm no visual/style, markup-composition, `catalogHierarchy.css`, OpenPencil/recovery/PNG, global-listener, or Unit 3 file was changed; stop before beginning Unit 3. <!-- sdd-owner: implementation -->

## Unit 3 — Contextual N, help, overlay/focus lifecycle, and platform shortcut preservation

**Start:** Unit 2 is green; local sidebar behavior and active boundaries work without a global controller.  
**Finish:** one shell-local controller arbitrates real contextual actions and overlays, Nueva Clase/help lifecycle is predictable, `Ctrl/Cmd+K` is preserved exactly, and `Ctrl+N` passes through.  
**Allowed scope:** `src/shared/keyboard/KeyboardController.tsx`, `src/shared/keyboard/focusRestoration.ts` only if duplication is demonstrated, `src/shared/keyboard/keyboardArbitration.ts`, `src/app/shell/AppShell.tsx`, `src/app/shell/CommandEntry.tsx`, `src/app/shell/KeyboardHelpDialog.tsx`, `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`, `src/shared/keyboard/useGlobalCommandShortcut.ts`, `tests/unit/keyboardArbitration.test.ts`, `tests/unit/appShell.test.tsx`, `tests/unit/catalogHierarchyNewClass.test.tsx`, and a focused controller/help test file if needed.  
**Dependencies:** Unit 1 and Unit 2 GREEN.  
**Rollback:** unregister contextual actions/help and remove the controller migration; restore the prior narrow Command Palette listener with its existing safeguards, removing only tests for behavior rolled back. Do not roll back Unit 2’s sidebar or touch frozen visual files.

### RED

- [x] Add failing controller tests for exactly one shell-local document listener, live register/unregister behavior, active surface resolution, overlay precedence including a portaled root, and no global action when an overlay or local consumer owns the event. <!-- sdd-owner: implementation -->
- [x] Add failing Catalog/New Class tests proving `N`/`n` opens the same real Nueva Clase action as its trigger only on Catalog when visible, enabled, valid, and overlay-free; prove no `N` action exists for Bandeja, Familia, Tipo, Recurso, inactive overlays, or placeholders. <!-- sdd-owner: implementation -->
- [x] Add failing help tests for semantic `event.key === '?'` on Shift and AltGraph international layouts, no `/`-position fallback, contextual command contents, and no opening from editable/IME contexts. <!-- sdd-owner: implementation -->
- [x] Add failing overlay lifecycle tests for Command Palette, Nueva Clase, and help: React Aria modal-only containment, one Escape/one close, opener restoration on the next frame, explicit fallback when opener is removed/hidden/disabled/disconnected, no focus to body/inert background, exact `Ctrl/Cmd+K`, and unmodified `Ctrl+N` with `defaultPrevented === false`. Run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/appShell.test.tsx tests/unit/catalogHierarchyNewClass.test.tsx`; capture RED output. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `KeyboardControllerProvider` with ref-backed registrations and one bubble-phase document listener, delegating pure arbitration first and preventing default only after a live real action is about to execute; never handle global Tab, arrows, Enter, Escape, or Ctrl+N. <!-- sdd-owner: implementation -->
- [x] Migrate `CommandEntry` to the controller without leaving two global listeners, preserve exact platform/modifier rules, and keep React Aria responsible for modal semantics, Tab containment, and Escape dismissal. <!-- sdd-owner: implementation -->
- [x] Register only the typed `catalog.new-class` action from `NuevaClaseSurface.tsx`, route keyboard and trigger opening through the same callback, register active overlay roots, remove the duplicate manual Escape handler, and preserve existing markup/classes and approved frame identity. <!-- sdd-owner: implementation -->
- [x] Implement `KeyboardHelpDialog.tsx` with existing React Aria overlay primitives and contextual snapshots for sidebar/Catalog; add the shared opener-validity/fallback lifecycle with the specified fallback order and next-frame restoration. Run the focused Vitest command and capture GREEN output. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Add cases for `N` while editing, composing, inside autocomplete/contenteditable descendants, or under an active overlay; for `?` with unsupported modifiers; and for `Ctrl+N`, `Cmd+N`, modified `K`, and exact platform-opposite `K`, asserting native behavior remains available. <!-- sdd-owner: implementation -->
- [x] Add cases for opener removal during portal unmount, disabled/hidden opener, fallback removal, nested overlay attempts, Escape propagation, Tab outside a modal, and focus restoration after the next animation frame; run `pnpm exec vitest run tests/unit/keyboardArbitration.test.ts tests/unit/appShell.test.tsx tests/unit/catalogHierarchyNewClass.test.tsx --reporter=verbose` and retain exact output. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor registrations, resolver types, and focus lifecycle helpers only after the complete Unit 3 suite is green; run the focused Vitest command, `pnpm typecheck`, and `pnpm lint`, recording exact results and confirming no second global listener or manual global trap remains. <!-- sdd-owner: implementation -->
- [x] Verify the unit’s changed-file diff contains no future action descriptors, fake routes, backend calls, global store, persistence, runtime fixture, or visual cleanup; retain the rollback boundary above. <!-- sdd-owner: implementation -->

## Unit 4 — Canonical documentation, browser/architecture/visual regression, and complete verification

**Start:** Units 1–3 are green and their focused evidence is recorded.  
**Finish:** real-browser behavior, architecture boundaries, exact visual allowance, canonical section 11, and all configured quality commands are green.  
**Allowed scope:** `docs/erp-first-stage-design-brief.md` section 11 only; `tests/architecture/keyboardBoundaries.test.ts` or the existing architecture-guard file; a dedicated `tests/e2e/keyboard-first-spatial-navigation.spec.ts` and narrowly extended existing workstation E2E targets discovered under `tests/e2e/**workstation*`; existing visual regression target(s) and their generated artifacts only when the test runner requires them. Do not edit frozen catalog visual sources or update snapshots to accept unauthorized drift.  
**Dependencies:** Units 1–3 GREEN; browser dependencies and Chromium available as described by project testing capabilities.  
**Rollback:** remove only Unit 4 documentation, architecture/browser assertions, and approved red-brand visual expectation; restore the prior section 11 text if product rollback is requested. Never revert or absorb `catalog-hierarchy-base` recovery or partial visual-remediation files.

### RED

- [x] Add failing architecture assertions for no global Tab/arrow/Enter/Escape/Ctrl+N capture, no second global keyboard listener, no manual document-wide focus trap, no global store/runtime fixture/backend or speculative Familia/Tipo/Recurso action, and no edits outside the approved source boundaries. <!-- sdd-owner: implementation -->
- [x] Add failing browser assertions in `tests/e2e/keyboard-first-spatial-navigation.spec.ts` for real bounding boxes, physical RTL ArrowRight, scroll-time remeasurement, hidden/disabled/zero-area candidates, portaled overlay isolation, Tab/Shift+Tab, visible focus, one-step Escape, opener fallback, and effective focus. <!-- sdd-owner: implementation -->
- [x] Add failing browser visual assertions for computed `.topbar-brand` `rgb(124, 0, 0)`, unchanged 1440×980 workstation composition, preserved `data-approved-frame="n2418"`, and no resting visual drift beyond the authorized GARFEX red; run `pnpm test:e2e` and the focused architecture command, capturing exact RED evidence. <!-- sdd-owner: implementation -->
- [x] Add a failing canonical-contract check against section 11 of `docs/erp-first-stage-design-brief.md` for the permanent Keyboard First rule, native Tab zones, physical arrows, editing/IME suppression, real-only actions, semantic `?`, exact Ctrl/Cmd+K, reserved Ctrl+N, modal-only containment, focus restoration, and deferred future surfaces. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the real-browser scenarios and architecture guards in the allowed test targets, preserving existing workstation assertions and making no snapshot update unless the sole approved color expectation requires it. Run `pnpm test:e2e` and the exact architecture test command selected from the repository, recording output. <!-- sdd-owner: implementation -->
- [x] Replace only section 11 and its table in `docs/erp-first-stage-design-brief.md` with the permanent canonical contract, explicitly distinguishing this first slice from deferred Familia/Tipo/Recurso and dense-surface integrations; do not create a second keyboard guide. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run the browser matrix at the real workstation viewport, including physical geometry under `dir="rtl"`, post-scroll measurement, portal/background exclusion, focus visibility, modal-only Tab containment, fallback after opener invalidation, international `?`, editing/IME suppression, contextual N only where real, native Enter, and untouched Ctrl+N. <!-- sdd-owner: implementation -->
- [x] Run the full configured verification exactly: `pnpm test`, `pnpm test:e2e`, `pnpm test:stories`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm router:check`, and `pnpm verify:runtime-bundle`; retain each command’s exact exit/result and investigate any failure rather than weakening assertions. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor only test descriptions, shared fixtures, and documentation wording after browser, architecture, and visual checks are green; rerun `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`, recording exact results. <!-- sdd-owner: implementation -->
- [x] Perform the final scope audit with `git diff --stat` and `git diff --name-only`; confirm no frozen `catalog-hierarchy-base` partial visual file, catalog CSS, OpenPencil/recovery artifact, unrelated style, backend, route, store, fixture, commit metadata, branch, remote, PR, publish, or RDD artifact was changed. <!-- sdd-owner: implementation -->

## Parent-only delivery and lifecycle gates

- [x] Before apply crosses the aggregate 400-authored-line threshold, decide whether to continue as four local units or authorize a chained delivery. The user selected four sequential local units; no commits, branches, PRs, remotes, pushes, publishing, RDD, or chain strategy are authorized. <!-- sdd-owner: parent -->
- [x] After apply, start or reuse a bounded review only if the user explicitly enables the applicable review mode; otherwise report ordinary repository verification as `disabled/unmanaged` and do not fabricate approval. Receipt-driven review remained disabled/unmanaged. <!-- sdd-owner: parent -->
- [x] Confirm final lifecycle status without creating commits, branches, pull requests, remotes, pushes, publishing actions, or receipt-driven-development activity that this task does not authorize. No delivery or RDD lifecycle action was performed. <!-- sdd-owner: parent -->

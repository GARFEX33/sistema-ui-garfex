# Tasks — Creación Keyboard First de Recursos

## Review Workload Forecast

| Field                   | Value                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Estimated changed lines | 4,210–5,040 additions + deletions across 15 child PRs                                                        |
| 400-line budget risk    | High                                                                                                         |
| Chained PRs recommended | Yes                                                                                                          |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 → PR 8 → PR 9 → PR 10 → PR 11 → PR 12 → PR 13 → PR 14 → PR 15 |
| Delivery strategy       | ask-on-risk                                                                                                  |
| Chain strategy          | feature-branch-chain                                                                                         |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

## Delivery controls

Apply requires both approved design artifacts: `design.md` (architecture authority) and `design-details.md` (mechanical contracts and chain detail).

Use a **feature-branch-chain** with draft/no-merge tracker branch `feat/keyboard-first-resource-creation`: PR 1 targets the tracker and each later child targets its immediate predecessor. Each child is one cohesive work-unit commit/PR, includes its RED/GREEN evidence, is independently buildable at its finish, and has a hard maximum of **399 A+D**. Before committing, record `git diff --numstat`, the focused command result, the runtime scenario result (or the stated pure-contract `N/A`), and a clean-diff check. If an honest child reaches 400 A+D, stop before apply and request the preflight `ask-on-risk` decision; do not compress code/tests or use a size exception.

`7c42860` remains auditable evidence for payload, focus, overlay, submit, and result semantics. Replace a prototype region only in the child that supplies its observable replacement; do not expose two selectable creation flows or a feature flag. Strict TDD applies to every child: make the named assertion RED, implement the smallest GREEN behavior, then triangulate/refactor and run the child command.

No-go scope for every child: backend/Convex; endpoints; DTOs, public API, and payload contract; Catálogo and `catalog-hierarchy-base`; routes/URL; dependencies; React Query/global state; `KeyboardController`; AppShell; shared staged-selector abstraction; mobile/touch redesign; optimistic insertion/cache-wide refresh; OpenPencil artifacts; and `openspec/config.yaml`. Use existing `Dialog`, `Button`, and `Field`, React Aria local composites, Tailwind, and existing Light semantic tokens only.

## Chain map, boundaries, and arithmetic audit

All children inherit the no-go scope above. “N/A” runtime boundaries are limited to directly tested pure contracts with a named downstream consumer in this chain; they are not empty scaffolding.

| Child | Target; dependency diagram required in PR body               | Start → finish; follow-up                                                                   | Declared A+D |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | -----------: |
| PR 1  | tracker; `tracker (draft/no-merge) → 📍 PR 1`                | no validated snapshot → captured, normalized read-only open seed; PR 2                      |      300–360 |
| PR 2  | PR 1; `tracker → PR 1 → 📍 PR 2`                             | open seed → tested local state machine; PR 3                                                |      290–345 |
| PR 3  | PR 2; `tracker → PR 1 → PR 2 → 📍 PR 3`                      | one-page dependent seam → stale-safe generic paged loader; PR 4                             |      280–330 |
| PR 4  | PR 3; `tracker → PR 1 → PR 2 → PR 3 → 📍 PR 4`               | conventional/select seam → local staged selector with keyboard behavior; PR 5               |      305–360 |
| PR 5  | PR 4; `tracker → PR 1 → PR 2 → PR 3 → PR 4 → 📍 PR 5`        | legacy context → staged Clase selection; PR 6                                               |      290–345 |
| PR 6  | PR 5; `tracker → PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → 📍 PR 6` | Clase stage → Familia/Tipo cascade flow; PR 7                                               |      295–345 |
| PR 7  | PR 6; `… → PR 6 → 📍 PR 7`                                   | generic loader → directly tested Natural Unit policy/hydration resolver; PR 8               |      260–305 |
| PR 8  | PR 7; `… → PR 7 → 📍 PR 8`                                   | resolved candidates → explicit Natural Unit dialog stage; PR 9                              |      290–350 |
| PR 9  | PR 8; `… → PR 8 → 📍 PR 9`                                   | generic loader → directly tested sequential-attribute resolver; PR 10                       |      275–325 |
| PR 10 | PR 9; `… → PR 9 → 📍 PR 10`                                  | resolved attributes → one-at-a-time typed attribute stage; PR 11                            |      335–395 |
| PR 11 | PR 10; `… → PR 10 → 📍 PR 11`                                | attributes complete → Resource data stage with preserved validation; PR 12                  |      280–330 |
| PR 12 | PR 11; `… → PR 11 → 📍 PR 12`                                | assembled draft → directly tested single payload/review projection; PR 13                   |      195–245 |
| PR 13 | PR 12; `… → PR 12 → 📍 PR 13`                                | payload projection → review, single submit, known-error/success behavior; PR 14             |      325–385 |
| PR 14 | PR 13; `… → PR 13 → 📍 PR 14`                                | submit results → uncertainty lock, focus/result completion, prototype-region removal; PR 15 |      275–350 |
| PR 15 | PR 14; `… → PR 14 → 📍 PR 15`                                | focused unit evidence → browser/axe/refetch/architecture closure; end                       |      230–300 |

| Child           | Per-file maximum arithmetic | Sum of maxima | Declared maximum | Audit               |
| --------------- | --------------------------- | ------------: | ---------------: | ------------------- |
| PR 1            | 85 + 45 + 50 + 90 + 90      |           360 |              360 | Fits; ≤399          |
| PR 2            | 155 + 190                   |           345 |              345 | Fits; ≤399          |
| PR 3            | 145 + 185                   |           330 |              330 | Fits; ≤399          |
| PR 4            | 165 + 170 + 25              |           360 |              360 | Fits; ≤399          |
| PR 5            | 115 + 80 + 150              |           345 |              345 | Fits; ≤399          |
| PR 6            | 125 + 75 + 145              |           345 |              345 | Fits; ≤399          |
| PR 7            | 130 + 175                   |           305 |              305 | Fits; ≤399          |
| PR 8            | 70 + 120 + 160              |           350 |              350 | Fits; ≤399          |
| PR 9            | 155 + 170                   |           325 |              325 | Fits; ≤399          |
| PR 10           | 140 + 90 + 165              |           395 |              395 | Fits; ≤399          |
| PR 11           | 95 + 80 + 155               |           330 |              330 | Fits; ≤399          |
| PR 12           | 100 + 145                   |           245 |              245 | Fits; ≤399          |
| PR 13           | 110 + 125 + 150             |           385 |              385 | Fits; ≤399          |
| PR 14           | 85 + 95 + 25 + 145          |           350 |              350 | Fits; ≤399          |
| PR 15           | 100 + 45 + 25 + 85 + 45     |           300 |              300 | Fits; ≤399          |
| **Chain total** | **sum of child ranges**     |     **5,040** |        **5,040** | **4,210–5,040 A+D** |

## Implementation work units

### PR 1 — Validated snapshot captured on dialog open (target: tracker)

**Bounded files:** `src/features/resources-master/resourceCreation.model.ts` (new, 70–85); `src/features/resources-master/ResourcesMasterScreen.tsx` (35–45); `src/features/resources-master/CrearRecursoSurface.tsx` (40–50); `tests/unit/resourceCreation.model.test.ts` (new, 80–90); `tests/unit/resourcesMasterScreen.test.tsx` (75–90). **Total:** 300–360 A+D.

**Review focus:** derive only loaded, continuous Clase→Familia→Tipo prefixes through one opaque-ID helper; capture the latest prop only on open; give the dialog data rather than screen setters. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourcesMasterScreen.test.tsx && pnpm typecheck`. **Runtime scenario:** open at depths 0/1/2/3 and verify the captured seed does not mutate background filters or callbacks. **Rollback:** remove snapshot derivation/capture and its tests, retaining the prototype form and remote list.

- [x] **RED:** Add failing prefix, cross-parent/stale, and capture-on-open assertions in `tests/unit/resourceCreation.model.test.ts` and `tests/unit/resourcesMasterScreen.test.tsx`; record the failing focused command. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add snapshot types, `resourceIdKey`, derivation/normalization helpers in `resourceCreation.model.ts`; derive loaded-item snapshots in `ResourcesMasterScreen.tsx`; and make `CrearRecursoSurface.tsx` capture the read-only `initialHierarchySnapshot` at opening without receiving hierarchy setters. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover all prefix depths and a changed closed-dialog prop versus an unchanged open-dialog seed, run the stated command, and commit the tested snapshot behavior with its consumers. <!-- sdd-owner: implementation -->

### PR 2 — Reducer, navigation, and reset invariants (target: PR 1)

**Bounded files:** `src/features/resources-master/resourceCreation.model.ts` (130–155); `tests/unit/resourceCreation.model.test.ts` (160–190). **Total:** 290–345 A+D.

**Review focus:** typed local state preserves same-ID descendants, atomically clears only changed-parent dependents, and increments revision only on real mutations. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime scenario:** N/A — direct pure reducer matrix; PR 5 consumes it in the dialog after the shared loader/selector seams land. **Rollback:** revert reducer/events/navigation cases only, retaining PR 1’s captured snapshot.

- [ ] **RED:** Extend `tests/unit/resourceCreation.model.test.ts` with failing cases for `OPEN`, first-missing stage, breadcrumb/back navigation, Class/Family/Type cascades, same-ID preservation, omission/value preservation, and revision changes. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement `CreationStage`, `CreationDraft`, submit state, reducer events, validation predicates, and ID-keyed navigation/reset helpers in `resourceCreation.model.ts`, without Query/store ownership. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Add replacement-versus-reconfirmation and return-navigation matrices, run the stated command, and commit the directly tested state contract used by the hierarchy integration. <!-- sdd-owner: implementation -->

### PR 3 — Generic stale-safe dependent paging contract (target: PR 2)

**Bounded files:** `src/features/resources-master/resourceCreation.loaders.ts` (new, 125–145); `tests/unit/resourceCreation.loaders.test.ts` (new, 155–185). **Total:** 280–330 A+D.

**Review focus:** token, context key, and cursor all guard adoption; continuation retains valid pages and first-appearance dedupe; filter text never becomes an API parameter. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime scenario:** N/A — controlled deferred promises directly prove adoption/retry behavior; PRs 5–10 consume this contract after the selector seam lands. **Rollback:** remove only the generic loader and its tests.

- [ ] **RED:** Add deferred-promise failures in `tests/unit/resourceCreation.loaders.test.ts` for initial/continuation/retry states, parent/Tipo stale responses, cursor retry, repeated cursor, dedupe, and context invalidation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement the feature-local dependent loader in `resourceCreation.loaders.ts` with injected identity, token/context/cursor guards, retained partial items, explicit retry state, and no React/global-query dependency. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Exercise out-of-order completions and duplicates across pages, run the stated command, and commit the reusable feature-local contract with its deterministic tests. <!-- sdd-owner: implementation -->

### PR 4 — Feature-local staged selector behavior (target: PR 3)

**Bounded files:** `src/features/resources-master/StagedSearchSelector.tsx` (new, 140–165); `tests/unit/StagedSearchSelector.test.tsx` (new, 145–170); `tests/architecture/keyboardBoundaries.test.ts` (20–25). **Total:** 305–360 A+D.

**Review focus:** local React Aria composite filters loaded names only, maintains one provisional candidate distinct from confirmation, and installs no global listener. **Command:** `pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts && pnpm typecheck`. **Runtime scenario:** RTL keyboard sequence filters, arrows, Enter, IME/defaultPrevented, retry, and continuation. **Rollback:** remove selector and selector-specific guard assertions only; do not alter `HierarchyNavigator`, shared UI, or `KeyboardController`.

- [ ] **RED:** Add failing RTL and architecture assertions for Spanish name-only local filtering, active-key repair without confirmation, arrows/Enter, IME/defaultPrevented precedence, explicit retry/continuation, and no document/window listener. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Create `StagedSearchSelector.tsx` from local React Aria `SearchField`/`ListBox` and shared `Button`, including accessible loading/empty/error copy, controlled query, `Cargar más…`, and provisional `activeKey`; keep it inside `resources-master`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Add filter-removes-active, deduped-page, continuation-preserves-query, and click/Enter parity evidence; run the stated command and commit the selector with its tests. <!-- sdd-owner: implementation -->

### PR 5 — Staged Clase selection integrated vertically (target: PR 4)

**Bounded files:** `src/features/resources-master/CrearRecursoSurface.tsx` (95–115); `src/features/resources-master/useResourceCreationFlow.ts` (new, 65–80); `tests/unit/crearRecursoSurface.test.tsx` (130–150). **Total:** 290–345 A+D.

**Review focus:** the captured seed opens at Clase when missing, Clase pages use the existing parent-gated behavior, and explicit confirmation alters only the local draft. **Command:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/unit/StagedSearchSelector.test.tsx && pnpm typecheck`. **Runtime scenario:** open with no valid prefix, filter/load/confirm Clase by keyboard, and confirm background selection/query remain unchanged. **Rollback:** restore the replaced Clase region and remove the flow wrapper, retaining pure seams.

- [ ] **RED:** Add failing `crearRecursoSurface.test.tsx` cases for depth-zero opening, Clase loading/retry/continuation, explicit Enter confirmation, local draft isolation, and the route breadcrumb. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** In `CrearRecursoSurface.tsx` and `useResourceCreationFlow.ts`, consume the reducer and existing parent-gated Clase controller, render `StagedSearchSelector`, and replace only the legacy Clase region with this single active path. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Verify re-entry preserves Clase pages/filter while no confirm occurs from filtering, run the stated command, and commit the vertical Clase behavior and tests together. <!-- sdd-owner: implementation -->

### PR 6 — Familia and Tipo cascade integration (target: PR 5)

**Bounded files:** `src/features/resources-master/CrearRecursoSurface.tsx` (105–125); `src/features/resources-master/useResourceCreationFlow.ts` (65–75); `tests/unit/crearRecursoSurface.test.tsx` (125–145). **Total:** 295–345 A+D.

**Review focus:** Familia is scoped to confirmed Clase, Tipo to confirmed Familia, breadcrumb changes reset exactly the prescribed descendants, and legacy context controls disappear with their replacement. **Command:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/unit/StagedSearchSelector.test.tsx && pnpm typecheck`. **Runtime scenario:** replace Clase then Familia by keyboard; confirm stale descendant results and background filters cannot leak into the new draft. **Rollback:** restore only Familia/Tipo regions and flow bindings, retaining PR 5 Clase behavior.

- [ ] **RED:** Add failing surface cases for valid deep seeds starting at Unidad, invalid prefixes starting at Familia/Tipo, parent-scoped continuation, breadcrumb replacement, and stale descendant rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Wire Familia and Tipo parent-gated controller instances through `useResourceCreationFlow.ts`, render their staged selectors in `CrearRecursoSurface.tsx`, and remove the corresponding old context controls in the same replacement. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover Class/Family/Type replacement and same-ID reconfirmation through the dialog, run the stated command, and commit one green staged hierarchy path. <!-- sdd-owner: implementation -->

### PR 7 — Natural Unit policy and hydration resolver (target: PR 6)

**Bounded files:** `src/features/resources-master/resourceCreation.loaders.ts` (110–130); `tests/unit/resourceCreation.loaders.test.ts` (150–175). **Total:** 260–305 A+D.

**Review focus:** candidates derive only from effective, non-shadowed policies and hydrated details; principal/selected ranking is provisional; rejected hydration remains retryable. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime scenario:** N/A — direct deferred-promise resolver tests; PR 8 immediately renders and confirms its candidates. **Rollback:** remove only Natural Unit resolver extensions and their tests, retaining generic paging.

- [ ] **RED:** Add failing loader tests for policy filtering/dedupe, `getUnit` hydration, principal/selected ranking, null/inactive/ineffective exclusion, rejected hydration retry, stale Tipo rejection, and confirmed empty eligibility. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Extend `resourceCreation.loaders.ts` with policy paging, unique `Promise.allSettled` hydration, `UnitCandidate`, effective-detail filtering, failure retention, and token-guarded retry without using a general-unit list. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate policies and continuation after a valid candidate preserve first order and block only pending/failed resolution, then run the stated command and commit the tested resolver. <!-- sdd-owner: implementation -->

### PR 8 — Explicit Natural Unit dialog stage (target: PR 7)

**Bounded files:** `src/features/resources-master/useResourceCreationFlow.ts` (55–70); `src/features/resources-master/CrearRecursoSurface.tsx` (100–120); `tests/unit/crearRecursoSurface.test.tsx` (135–160). **Total:** 290–350 A+D.

**Review focus:** the preferred candidate is merely active, Enter explicitly puts a hydrated eligible unit in the draft, and no Unit path uses `listarUnidades`. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts tests/unit/crearRecursoSurface.test.tsx && pnpm typecheck`. **Runtime scenario:** start after confirmed Tipo, inspect preferred active Unit, confirm with Enter, then observe empty/error/retry blocking. **Rollback:** restore only the Unit stage and flow hookup, retaining staged hierarchy.

- [ ] **RED:** Add failing surface tests for Unit-stage entry after Tipo, preferred-active-but-unconfirmed behavior, Enter/click confirmation, empty eligibility, partial error retry, and stale-Type invalidation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Connect the PR 7 resolver in `useResourceCreationFlow.ts` and render an explicit Unit `StagedSearchSelector` in `CrearRecursoSurface.tsx`, dispatching `CONFIRM_UNIT` only from explicit action. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Demonstrate a continuation can coexist with an immediately confirmable hydrated candidate while pending/failed hydration cannot advance, run the stated command, and commit Unit behavior with its tests. <!-- sdd-owner: implementation -->

### PR 9 — Sequential attribute-resolution contract (target: PR 8)

**Bounded files:** `src/features/resources-master/resourceCreation.loaders.ts` (130–155); `tests/unit/resourceCreation.loaders.test.ts` (145–170). **Total:** 275–325 A+D.

**Review focus:** complete assignment pages before stable `orden` ordering; resolve definitions/options under the current Tipo token; incomplete resolution is recoverable rather than silently omitted. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime scenario:** N/A — direct resolver tests cover multi-page and stale async outcomes; PR 10 immediately presents the resolved sequence. **Rollback:** remove only attribute-resolution extensions and their tests.

- [ ] **RED:** Add failing resolver tests for multi-page assignments/options, effective/forbidden/not-applicable filtering, stable ordering, definition/option errors, stale Tipo responses, and zero applicable assignments. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement complete paged assignment/option resolution and definition hydration in `resourceCreation.loaders.ts`, with assignment/option dedupe, stable ordering, retry state, and current-token adoption checks. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover reordered arrivals and a required option with no effective options, run the stated command, and commit the directly tested resolver consumed by the attribute stage. <!-- sdd-owner: implementation -->

### PR 10 — One-at-a-time attribute interaction (target: PR 9)

**Bounded files:** `src/features/resources-master/ResourceAttributeStage.tsx` (new, 115–140); `src/features/resources-master/CrearRecursoSurface.tsx` (75–90); `tests/unit/crearRecursoSurface.test.tsx` (145–165). **Total:** 335–395 A+D.

**Review focus:** every type preserves its existing raw transport semantics; only REQUIRED blocks; optional and conditional values can be genuinely omitted; changing Tipo clears the entire sequence. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime scenario:** keyboard-complete text/number/boolean/option fields, omit a non-required field, go back, and replace Tipo. **Rollback:** remove attribute presenter and its surface region/tests only, retaining Unit and hierarchy behavior.

- [ ] **RED:** Add failing surface cases for per-type controls, required focus/error, optional/conditional **Omitir**, raw-value preservation, backtracking, zero-applicable continuation, and Type replacement clearing prior Unit/attributes. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Create `ResourceAttributeStage.tsx` and compose it from `CrearRecursoSurface.tsx` with the PR 9 resolver and reducer, rendering one attribute at a time and recording values/omissions by assignment ID. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Verify all four value kinds and that omission removes—not empties—a value, run the stated command, and commit the attribute behavior plus its RED/GREEN evidence. <!-- sdd-owner: implementation -->

### PR 11 — Resource data stage (target: PR 10)

**Bounded files:** `src/features/resources-master/ResourceCreationDetails.tsx` (new, 80–95); `src/features/resources-master/CrearRecursoSurface.tsx` (65–80); `tests/unit/crearRecursoSurface.test.tsx` (135–155). **Total:** 280–330 A+D.

**Review focus:** Nombre/Descripción retain current trim and optional semantics in their own stage; Enter is guarded for editable controls; valid data progresses only to the payload seam, not submission. **Command:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime scenario:** keyboard-enter Nombre/Descripción, correct a required name, return to attributes, and preserve both data and focus behavior. **Rollback:** remove the Resource data presenter/stage and its tests, retaining attribute capture.

- [ ] **RED:** Add failing surface tests for required trimmed Nombre, optional trimmed Descripción omission, field-focused error, guarded Enter/IME behavior, and preservation when returning from Resource data. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add the Resource data presentation to `ResourceCreationDetails.tsx` and compose it in `CrearRecursoSurface.tsx` through the reducer’s data-confirmation stage without adding fields or normalizations. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover blank-versus-whitespace values and return navigation from data to attributes, run the stated command, and commit the data-stage behavior and tests together. <!-- sdd-owner: implementation -->

### PR 12 — Single payload and review projection contract (target: PR 11)

**Bounded files:** `src/features/resources-master/resourceCreation.model.ts` (80–100); `tests/unit/resourceCreation.payload.test.ts` (new, 115–145). **Total:** 195–245 A+D.

**Review focus:** one pure `buildResourceCreateInput(draft)` is the sole input to both upcoming review and submission; it keeps exact IDs, ownership, attribute mappings, and omitted-value absence. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.payload.test.ts && pnpm typecheck`. **Runtime scenario:** N/A — direct payload parity tests; PR 13 immediately consumes this object for review and API invocation. **Rollback:** remove the pure payload/review projection and its test, retaining staged data capture.

- [ ] **RED:** Add failing `tests/unit/resourceCreation.payload.test.ts` cases for all attribute mappings, exact hierarchy/Unit IDs, trim semantics, optional description, GLOBAL ownership, and absence of omitted or empty optional values. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement `buildResourceCreateInput(draft)` and the typed review projection in `resourceCreation.model.ts` so both derive from the same object and no second payload mapping exists. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Compare each review projection field against the outgoing contract for text, number, boolean, and option values; run the stated command and commit the tested pure contract. <!-- sdd-owner: implementation -->

### PR 13 — Review, submit, known-error, and confirmed-success behavior (target: PR 12)

**Bounded files:** `src/features/resources-master/ResourceCreationDetails.tsx` (90–110); `src/features/resources-master/CrearRecursoSurface.tsx` (105–125); `tests/unit/crearRecursoSurface.test.tsx` (130–150). **Total:** 325–385 A+D.

**Review focus:** review renders the PR 12 projection, duplicate submit is impossible, known errors preserve a retryable draft, and only `CREATED` calls `onCreated` once. **Command:** `pnpm exec vitest run tests/unit/resourceCreation.payload.test.ts tests/unit/crearRecursoSurface.test.tsx && pnpm typecheck`. **Runtime scenario:** review an omitted optional value, submit once, observe known-error retry and confirmed-success callback. **Rollback:** restore review/submit/result-success region only, retaining all capture stages and payload contract.

- [ ] **RED:** Add failing surface tests for review/payload parity, disabled incomplete/submitting creation, duplicate-submit prevention, known administrative error with manual retry, and `CREATED` invoking `onCreated` exactly once. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render review and success presentation in `ResourceCreationDetails.tsx`; in `CrearRecursoSurface.tsx`, submit only the PR 12 payload, retain known errors in review, and invoke the existing `onCreated={() => void refetchActive()}` path only on confirmed `CREATED`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Assert the displayed review and API argument are equivalent for populated and omitted optional values, run the stated command, and commit submit behavior with its tests. <!-- sdd-owner: implementation -->

### PR 14 — Uncertain outcomes, dialog focus completion, and prototype cleanup (target: PR 13)

**Bounded files:** `src/features/resources-master/ResourceCreationDetails.tsx` (70–85); `src/features/resources-master/CrearRecursoSurface.tsx` (80–95); `src/features/resources-master/resourcesMaster.css` (0–25 deleted only if last consumer); `tests/unit/crearRecursoSurface.test.tsx` (125–145). **Total:** 275–350 A+D.

**Review focus:** uncertain writes do not retry or refresh until a real draft mutation; Escape closes once and restores opener/fallback; the replaced prototype result region and final CSS hooks vanish in this same child. **Command:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx && pnpm typecheck`. **Runtime scenario:** induce unknown result, return and mutate data before retry; then Escape with eligible and ineligible opener. **Rollback:** restore only uncertainty/focus/result region and CSS hooks removed here, retaining confirmed submit behavior.

- [ ] **RED:** Add failing surface tests for uncertain-result messaging, blocked identical replay, mutation-based revision unlock, no `onCreated`, one Escape closure, eligible opener restoration, and fallback focus. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Complete uncertain-result presentation and revision gating in `ResourceCreationDetails.tsx`/`CrearRecursoSurface.tsx`, retain overlay registration/focus restoration, and remove the replaced prototype result region and `resourcesMaster.css` only after its last consumer is gone. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove known-error, success, and uncertain outcomes remain distinct and no duplicate selectable prototype path exists, run the stated command, and commit the completed outcomes with their tests. <!-- sdd-owner: implementation -->

### PR 15 — Browser, axe, refetch, and architecture closure (target: PR 14)

**Bounded files:** `tests/e2e/resourcesMaster.workstation.spec.ts` (80–100); `tests/unit/resourcesMasterScreenRefetch.test.tsx` (35–45); `tests/architecture/keyboardBoundaries.test.ts` (20–25); `tests/architecture/resourceCreationBoundaries.test.ts` (new, 65–85); `tests/architecture/queryZodBoundaries.test.ts`, `tests/architecture/catalogHierarchyBoundaries.test.ts`, and `tests/architecture/runtimeFixtureIsolation.test.ts` (combined, 30–45). **Total:** 230–300 A+D.

**Review focus:** this is closure evidence for behavior already tested in its owning vertical children, not a substitute for missing unit evidence: browser keyboard/focus/axe, active-query-only refetch, and feature boundaries/file limits. **Command:** `pnpm exec vitest run tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts && pnpm typecheck`. **Runtime scenario:** Chromium at 1440×980 completes keyboard-only creation and axe checks selector/review states. **Rollback:** remove only closure tests/guards; do not revert production behavior.

- [ ] **RED:** Add failing browser/refetch/architecture expectations for keyboard-only staged creation, local-filter continuation/dedupe, Escape opener/fallback, axe dialog states, active-query-only refresh, no global listener, feature-local imports, and runtime files below 500 lines. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Update only the named tests and guards to exercise the completed behavior, including `onCreated → refetchActive()` solely after `CREATED`, without broad invalidation, optimistic insertion, or production edits. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the stated browser/architecture command, remove duplicated assertions while retaining distinct end-to-end coverage, and commit the closure evidence with exact results. <!-- sdd-owner: implementation -->

## Final verification and parent-owned lifecycle actions

- [ ] Run the complete final gate after PR 15: `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.payload.test.ts tests/unit/resourceCreation.loaders.test.ts tests/unit/StagedSearchSelector.test.tsx tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`; record exact results and do not report unavailable gates as passed. <!-- sdd-owner: implementation -->

- [ ] Create/reuse the draft/no-merge tracker and feature-branch child chain, confirm immediate-predecessor targets and each `📍` diagram, and stop for ask-on-risk when `git diff --numstat` reaches 400 A+D for a cohesive child. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for every child with its clean diff, focused evidence, runtime result, review focus, rollback boundary, and auditable `7c42860` replacement evidence; keep the tracker unmerged until all children are accepted. <!-- sdd-owner: parent -->
- [ ] After accepted verification, sync this approved change into `openspec/specs/keyboard-first-resource-creation/spec.md`, preserving canonical compatibility specs and leaving `openspec/config.yaml` unchanged. <!-- sdd-owner: parent -->
- [ ] Archive `openspec/changes/keyboard-first-resource-creation/` only through the repository OpenSpec archive workflow after canonical sync, final gates, and lifecycle review; record deviations, unexecuted checks, or follow-ups rather than silently closing. <!-- sdd-owner: parent -->

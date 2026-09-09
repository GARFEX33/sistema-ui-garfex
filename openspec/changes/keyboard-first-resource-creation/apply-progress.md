# Apply Progress — keyboard-first-resource-creation

## Status

- **State:** PR 1 implementation complete; corrective rerun remediates failed evidence revision `sha256:e45fd384188b7719ba96be92379421772d9755b7649429269cca1b2da7a734eb` with native correction token `sha256:48a0efe3fa94cab7c4445d34eb46296917992e92aaa5e8a6555c1587e4251946`.
- **Structured status consumed:** native state `proceed`; proposal/spec/design/tasks done; apply ready; authoritative spec `openspec/changes/keyboard-first-resource-creation/specs/keyboard-first-resource-creation/spec.md`; `artifactStore: openspec`.
- **Action context:** `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex`; all changes are within the parent-provided allowed edit surfaces. No action-context warnings or unsafe edit roots were found.
- **Workload / PR boundary:** feature-branch-chain, PR 1 only (target: tracker). Code/test A+D is 322 (120 new model + 138 new model test + 11 surface + 16 screen + 37 screen test), below 399. No commit, branch, tracker, PR, review, or other parent lifecycle action was attempted.

## Completed implementation tasks and persisted checkbox updates

- [x] RED — persisted PR 1 RED checkbox in `tasks.md`.
- [x] GREEN — persisted PR 1 GREEN checkbox in `tasks.md`.
- [x] TRIANGULATE/REFACTOR — persisted PR 1 TRIANGULATE/REFACTOR checkbox in `tasks.md`.

## Implementation

- Added feature-local snapshot contracts, opaque-ID normalization through `resourceIdKey`, loaded-item derivation, continuous-prefix validation, and a capture seam that takes the latest closed prop only at `captureOnOpen()`.
- `ResourcesMasterScreen` derives the data-only snapshot from its loaded hierarchy items and selection, then passes it to `CrearRecursoSurface` without hierarchy setters, criteria, or search setters.
- `CrearRecursoSurface` receives the optional read-only prop and captures it at open without reseeding it while the dialog remains open; the legacy prototype form and all PR 2 reducer/selector work remain untouched.

## Files changed

- `src/features/resources-master/resourceCreation.model.ts`
- `src/features/resources-master/ResourcesMasterScreen.tsx`
- `src/features/resources-master/CrearRecursoSurface.tsx`
- `tests/unit/resourceCreation.model.test.ts`
- `tests/unit/resourcesMasterScreen.test.tsx`
- `openspec/changes/keyboard-first-resource-creation/tasks.md`
- `openspec/changes/keyboard-first-resource-creation/apply-progress.md`

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 1 RED/GREEN | `resourceCreation.model.test.ts`, `resourcesMasterScreen.test.tsx` | Unit + RTL seam | Screen baseline: 13/13 passed | Model import failed because `resourceCreation.model` was absent; screen prop assertion failed because the prop was absent | Focused run passed 19/19, then typecheck passed | Added depths 0/1/2/3, absent/crossed/stale descendants, changed-closed versus unchanged-open capture, and data-only prop-boundary assertions; focused run passed 20/20 | Corrected parameterized test titles and formatted the model; rerun passed 20/20 plus typecheck |
| Existing prototype regression | `crearRecursoSurface.test.tsx` | RTL | Pre-change baseline was not captured during the prior blocked attempt | N/A — no prototype behavior was changed | Post-change focused regression passed 20/20 | Existing 20-case surface matrix remained green | No behavior refactor needed |

## Verification evidence

- `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx` — passed 13/13 before screen-test edits.
- `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts` — RED failed because the module did not exist.
- `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx` — RED failed because `initialHierarchySnapshot` was not passed.
- `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts` — capture-seam RED failed because `createInitialHierarchySnapshotCapture` did not exist.
- `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourcesMasterScreen.test.tsx && pnpm typecheck` — final focused pass: 2 files, 20 tests passed; typecheck passed.
- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` — passed 20/20.
- Targeted ESLint — passed for all five PR 1 source/test files.
- Targeted Prettier check and `git diff --check` — passed.
- Scope audit — only the seven allowed files above changed; no prohibited API, query, shared UI, keyboard-controller, or global-state files changed.

## Deviations from design

- None. PR 1 deliberately retains the prototype’s three-step UI; its snapshot capture is a passive seam for PR 2 and later integration.
- The prior blocker incorrectly required a root-level spec. The required nested authoritative spec was consumed in this corrective rerun.

## Runtime and rollback

- **Runtime scenario:** N/A for this passive snapshot/model seam; the pure tests exercise all depths and capture isolation, and the RTL screen seam verifies loaded snapshot data is passed without background hierarchy setters. PR 5 will consume the snapshot visibly in the dialog.
- **Rollback boundary:** remove the model seam, screen prop derivation, surface capture ref, and their two focused test additions; retain the existing remote list and prototype form.

## Remaining implementation tasks

The following persisted implementation-owned `- [ ]` lines remain unchanged:
- `- [ ] **RED:** Extend `tests/unit/resourceCreation.model.test.ts` with failing cases for `OPEN`, first-missing stage, breadcrumb/back navigation, Class/Family/Type cascades, same-ID preservation, omission/value preservation, and revision changes. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Implement `CreationStage`, `CreationDraft`, submit state, reducer events, validation predicates, and ID-keyed navigation/reset helpers in `resourceCreation.model.ts`, without Query/store ownership. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Add replacement-versus-reconfirmation and return-navigation matrices, run the stated command, and commit the directly tested state contract used by the hierarchy integration. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add deferred-promise failures in `tests/unit/resourceCreation.loaders.test.ts` for initial/continuation/retry states, parent/Tipo stale responses, cursor retry, repeated cursor, dedupe, and context invalidation. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Implement the feature-local dependent loader in `resourceCreation.loaders.ts` with injected identity, token/context/cursor guards, retained partial items, explicit retry state, and no React/global-query dependency. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Exercise out-of-order completions and duplicates across pages, run the stated command, and commit the reusable feature-local contract with its deterministic tests. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing RTL and architecture assertions for Spanish name-only local filtering, active-key repair without confirmation, arrows/Enter, IME/defaultPrevented precedence, explicit retry/continuation, and no document/window listener. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Create `StagedSearchSelector.tsx` from local React Aria `SearchField`/`ListBox` and shared `Button`, including accessible loading/empty/error copy, controlled query, `Cargar más…`, and provisional `activeKey`; keep it inside `resources-master`. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Add filter-removes-active, deduped-page, continuation-preserves-query, and click/Enter parity evidence; run the stated command and commit the selector with its tests. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing `crearRecursoSurface.test.tsx` cases for depth-zero opening, Clase loading/retry/continuation, explicit Enter confirmation, local draft isolation, and the route breadcrumb. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** In `CrearRecursoSurface.tsx` and `useResourceCreationFlow.ts`, consume the reducer and existing parent-gated Clase controller, render `StagedSearchSelector`, and replace only the legacy Clase region with this single active path. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Verify re-entry preserves Clase pages/filter while no confirm occurs from filtering, run the stated command, and commit the vertical Clase behavior and tests together. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface cases for valid deep seeds starting at Unidad, invalid prefixes starting at Familia/Tipo, parent-scoped continuation, breadcrumb replacement, and stale descendant rejection. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Wire Familia and Tipo parent-gated controller instances through `useResourceCreationFlow.ts`, render their staged selectors in `CrearRecursoSurface.tsx`, and remove the corresponding old context controls in the same replacement. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Cover Class/Family/Type replacement and same-ID reconfirmation through the dialog, run the stated command, and commit one green staged hierarchy path. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing loader tests for policy filtering/dedupe, `getUnit` hydration, principal/selected ranking, null/inactive/ineffective exclusion, rejected hydration retry, stale Tipo rejection, and confirmed empty eligibility. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Extend `resourceCreation.loaders.ts` with policy paging, unique `Promise.allSettled` hydration, `UnitCandidate`, effective-detail filtering, failure retention, and token-guarded retry without using a general-unit list. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate policies and continuation after a valid candidate preserve first order and block only pending/failed resolution, then run the stated command and commit the tested resolver. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface tests for Unit-stage entry after Tipo, preferred-active-but-unconfirmed behavior, Enter/click confirmation, empty eligibility, partial error retry, and stale-Type invalidation. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Connect the PR 7 resolver in `useResourceCreationFlow.ts` and render an explicit Unit `StagedSearchSelector` in `CrearRecursoSurface.tsx`, dispatching `CONFIRM_UNIT` only from explicit action. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Demonstrate a continuation can coexist with an immediately confirmable hydrated candidate while pending/failed hydration cannot advance, run the stated command, and commit Unit behavior with its tests. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing resolver tests for multi-page assignments/options, effective/forbidden/not-applicable filtering, stable ordering, definition/option errors, stale Tipo responses, and zero applicable assignments. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Implement complete paged assignment/option resolution and definition hydration in `resourceCreation.loaders.ts`, with assignment/option dedupe, stable ordering, retry state, and current-token adoption checks. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Cover reordered arrivals and a required option with no effective options, run the stated command, and commit the directly tested resolver consumed by the attribute stage. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface cases for per-type controls, required focus/error, optional/conditional **Omitir**, raw-value preservation, backtracking, zero-applicable continuation, and Type replacement clearing prior Unit/attributes. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Create `ResourceAttributeStage.tsx` and compose it from `CrearRecursoSurface.tsx` with the PR 9 resolver and reducer, rendering one attribute at a time and recording values/omissions by assignment ID. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Verify all four value kinds and that omission removes—not empties—a value, run the stated command, and commit the attribute behavior plus its RED/GREEN evidence. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface tests for required trimmed Nombre, optional trimmed Descripción omission, field-focused error, guarded Enter/IME behavior, and preservation when returning from Resource data. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Add the Resource data presentation to `ResourceCreationDetails.tsx` and compose it in `CrearRecursoSurface.tsx` through the reducer’s data-confirmation stage without adding fields or normalizations. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Cover blank-versus-whitespace values and return navigation from data to attributes, run the stated command, and commit the data-stage behavior and tests together. <!-- sdd-owner: implementation -->`
- Historical legacy payload-builder work is superseded; no payload test path is current.
- `- [ ] **GREEN:** Implement `buildResourceCreateInput(draft)` and the typed review projection in `resourceCreation.model.ts` so both derive from the same object and no second payload mapping exists. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Compare each review projection field against the outgoing contract for text, number, boolean, and option values; run the stated command and commit the tested pure contract. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface tests for review/payload parity, disabled incomplete/submitting creation, duplicate-submit prevention, known administrative error with manual retry, and `CREATED` invoking `onCreated` exactly once. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Render review and success presentation in `ResourceCreationDetails.tsx`; in `CrearRecursoSurface.tsx`, submit only the PR 12 payload, retain known errors in review, and invoke the existing `onCreated={() => void refetchActive()}` path only on confirmed `CREATED`. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Assert the displayed review and API argument are equivalent for populated and omitted optional values, run the stated command, and commit submit behavior with its tests. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing surface tests for uncertain-result messaging, blocked identical replay, mutation-based revision unlock, no `onCreated`, one Escape closure, eligible opener restoration, and fallback focus. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Complete uncertain-result presentation and revision gating in `ResourceCreationDetails.tsx`/`CrearRecursoSurface.tsx`, retain overlay registration/focus restoration, and remove the replaced prototype result region and `resourcesMaster.css` only after its last consumer is gone. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Prove known-error, success, and uncertain outcomes remain distinct and no duplicate selectable prototype path exists, run the stated command, and commit the completed outcomes with their tests. <!-- sdd-owner: implementation -->`
- `- [ ] **RED:** Add failing browser/refetch/architecture expectations for keyboard-only staged creation, local-filter continuation/dedupe, Escape opener/fallback, axe dialog states, active-query-only refresh, no global listener, feature-local imports, and runtime files below 500 lines. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Update only the named tests and guards to exercise the completed behavior, including `onCreated → refetchActive()` solely after `CREATED`, without broad invalidation, optimistic insertion, or production edits. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Run the stated browser/architecture command, remove duplicated assertions while retaining distinct end-to-end coverage, and commit the closure evidence with exact results. <!-- sdd-owner: implementation -->`
- Historical final-gate command superseded; this record lists only existing focused commands actually run.

## Deferred parent-owned lifecycle actions

- Create or reuse the draft/no-merge tracker and child chain, confirm targets and PR diagrams.
- Start bounded review for each child with its review focus, rollback boundary, and evidence.
- Sync the approved change to canonical OpenSpec after accepted verification.
- Archive only through the repository OpenSpec archive workflow.

## Next action

Parent lifecycle should handle PR 1’s chain/review boundary. The next implementation slice is PR 2 only after the parent selects and authorizes it.

---

## PR 2A — Navigation and hierarchy cascade reducer (narrowed corrective apply)

### Status

- **State:** complete for delegated work unit `pr2a-navigation-cascades`; native attempt state consumed: `proceed` with evidence goal “Formatted RED/GREEN creation navigation and hierarchy cascade reducer under 399 review lines.” The parent owns attempt settlement for `sha256:f225997115a3c6cc9536f63b808f857b0c492591423425cfb20d9fb346fd16b8` and remediation receipt handling for `sha256:c5ece35f674e889b4dd290019f89f5ee238f13007513b707d1ff33bbc0f87041`.
- **Structured status consumed:** native `gentle-ai sdd-status keyboard-first-resource-creation` reported `artifactStore: openspec`, proposal/spec/design/tasks/apply-progress present, `applyState: ready`, `nextRecommended: apply`, and no blocked reasons.
- **Action context:** `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex`, with that workspace as the allowed edit root. Both edits are inside the delegated allowed surfaces; no action-context warning was found.
- **Workload / PR boundary:** feature-branch-chain PR 2A only, targeting PR 1. `git diff --numstat` against `HEAD` is 265 A+D (125 model, 140 test), below the hard 399 limit. No commit, branch, PR, review, receipt, loader, or parent lifecycle action was attempted.

### Completed delegated behavior

- Reduced the prior broad candidate to a four-stage typed reducer: `class`, `family`, `type`, and `unit`.
- `OPEN` derives the first missing stage from the normalized prefix at depths 0/1/2/3.
- `BACK` follows `unit → type → family → class` and stays at Class; `NAVIGATE_TO_STAGE` provides explicit breadcrumb stage navigation without draft mutation.
- `CONFIRM_CLASS`, `CONFIRM_FAMILY`, and `CONFIRM_TYPE` preserve descendants and revision for same-ID reconfirmation.
- A changed hierarchy parent atomically clears the minimum Unit and attribute placeholders (`unitId`, `attributeIds`) and increments `revision` exactly once; navigation and same-ID reconfirmation do not increment it.
- Explicitly deferred PR 2B behavior: attribute-value events, omission sets, resource-data/validation predicates, submit states/transitions, and uncertainty revision locking.

### Persisted task checkbox update

- No `tasks.md` checkbox was changed. Each existing PR 2 implementation row is broader than this authorized PR 2A split and explicitly includes deferred PR 2B behavior, so checking any such row would falsely report attribute/omission, validation, or submit work as complete. The task artifact remains byte-for-byte unchanged as directed; no completed delegated behavior lacks a matching narrowed task row.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 2A reducer slice | `tests/unit/resourceCreation.model.test.ts` | Unit | Broad candidate baseline: 20/20 passed | Replaced the broad tests with the narrowed 2A matrix before production edits; focused run failed 4 assertions because `NAVIGATE_TO_STAGE` was absent and the prior broad reducer did not clear the narrowed `unitId`/`attributeIds` placeholders | Replaced broad reducer behavior with the minimum four-stage navigation/cascade contract; focused run passed 18/18 | Matrix covers four OPEN depths, three changed-parent cascades, three same-ID reconfirmations, navigation/back preservation, and real-mutation revision behavior | Prettier formatted both files; the focused test stayed green |

### Verification evidence

- `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts` — final GREEN: 18/18 passed.
- `pnpm typecheck` — passed (`pnpm router:generate && tsc -b`).
- `pnpm exec eslint src/features/resources-master/resourceCreation.model.ts tests/unit/resourceCreation.model.test.ts` — passed.
- `pnpm exec prettier --check src/features/resources-master/resourceCreation.model.ts tests/unit/resourceCreation.model.test.ts` — passed.
- `git diff --check` — passed.
- `git diff --numstat` — 265 A+D against `HEAD`, below 399.

### Files changed

- `src/features/resources-master/resourceCreation.model.ts`
- `tests/unit/resourceCreation.model.test.ts`
- `openspec/changes/keyboard-first-resource-creation/apply-progress.md`

### Deviations and deferred scope

- The existing broad candidate was deliberately reduced rather than compressed. The reducer retains only hierarchy navigation and the minimum dependent placeholders necessary to prove atomic cascades.
- No loaders or PR 2B attribute/omission/resource-data/submit/uncertainty behavior was implemented.

### Remaining implementation tasks

The prior cumulative progress section preserves all remaining implementation-owned unchecked rows. The following exact PR 2 rows remain unchecked because they include deferred PR 2B scope:

- `- [ ] **RED:** Extend \`tests/unit/resourceCreation.model.test.ts\` with failing cases for \`OPEN\`, first-missing stage, breadcrumb/back navigation, Class/Family/Type cascades, same-ID preservation, omission/value preservation, and revision changes. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Implement \`CreationStage\`, \`CreationDraft\`, submit state, reducer events, validation predicates, and ID-keyed navigation/reset helpers in \`resourceCreation.model.ts\`, without Query/store ownership. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Add replacement-versus-reconfirmation and return-navigation matrices, run the stated command, and commit the directly tested state contract used by the hierarchy integration. <!-- sdd-owner: implementation -->`

### Next action

Parent lifecycle should settle the supplied native attempt and maintain the PR 2A boundary. A future separately authorized PR 2B may add only the deferred attribute/omission/resource-data/submit behavior; loaders remain out of scope.

---

## PR 2B — Deferred draft state, validation, and submit contract

- **State / structured status:** completed delegated `pr2b-draft-state`; native state `proceed`, artifact store `openspec`, authoritative nested spec and both design artifacts consumed, apply ready.
- **Action context:** repo-local `/home/garfex/PROGRAMACION/sistema-ui-garfex`; all four parent-authorized edit surfaces only; no unsafe-root warning.
- **Workload / boundary:** feature-branch-chain PR 2B only after accepted `52ad7a1`; final effective PR 2 stays below 399 A+D; no commit, branch, PR, review, receipt, or PR 3 work.
- **Completed task checkboxes:**
  - [x] RED — persisted the original PR 2 RED row after the complete reducer contract was covered.
  - [x] GREEN — persisted the original PR 2 GREEN row after implementation.
  - [x] TRIANGULATE/REFACTOR — persisted the original PR 2 TRIANGULATE/REFACTOR row after focused verification.
- **Behavior:** assignment-ID value map and explicit omissions are reciprocal, real-only revision changes preserve PR 2A navigation/cascades, Nombre trim validity is pure, and typed submit handles idle/submitting/known-error/created/uncertain with uncertainty revision lock.
### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE/REFACTOR |
| --- | --- | --- | --- | --- |
| PR 2B reducer | 18/18 | Five contracts, then uncertain-back failure | 23/23, then 25/25 | Type replacement/preservation; omission refactor green |
- **Verification:** `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts` 25/25 passed; `pnpm typecheck`, targeted ESLint, and targeted Prettier passed.
- **Files:** `resourceCreation.model.ts`, `resourceCreation.model.test.ts`, `tasks.md`, and this progress record.
- **Deviation:** none; no UI, loaders, selectors, payload builder, or runtime surface changed.
- **Remaining:** PR 3 and later implementation-owned rows remain unchecked exactly as retained in `tasks.md`; parent-owned chain/review/sync/archive rows remain byte-for-byte deferred.

---
## PR 3 — Generic stale-safe dependent paging contract
- **State:** complete for `pr3-dependent-loader`; consumed native `proceed`, authoritative nested spec/designs, `artifactStore: openspec`, and repo-local context without warnings.
- **Boundary:** feature-branch-chain PR 3 only (PR 2 → 📍 PR 3 → PR 4); 369 A+D below 399. The delegated apply phase created no commit, branch, PR, review, receipt, or PR 4 work; the parent later committed the accepted slice as `a4106ae`.
- **Completed / persisted:** PR 3 RED, GREEN, and TRIANGULATE/REFACTOR rows are visibly `[x]` in `tasks.md`.
- **Files:** `resourceCreation.loaders.ts`, `resourceCreation.loaders.test.ts`, `tasks.md`, and this cumulative progress record.
- **Behavior:** generic injected-identity paging guards token/context/cursor adoption; retains/dedupes valid pages; explicit retries preserve cursors; repeated cursors are recoverable.
- **Verification:** focused Vitest 5/5, `pnpm typecheck`, targeted ESLint, and targeted Prettier passed; pure-contract runtime scenario N/A.
- **TDD Cycle Evidence:** RED import resolution failed; GREEN 4/4 passed; triangulated empty, dedupe, retry/repeat, and stale deferred contexts; refactor cached identity keys and reran 5/5.
- **Deviation / rollback:** none; remove only the loader and its focused tests to roll back this seam.
- **Remaining exact PR 4 RED:** `- [ ] **RED:** Add failing RTL and architecture assertions for Spanish name-only local filtering, active-key repair without confirmation, arrows/Enter, IME/defaultPrevented precedence, explicit retry/continuation, and no document/window listener. <!-- sdd-owner: implementation -->`
- **Remaining exact PR 4 GREEN:** `- [ ] **GREEN:** Create \`StagedSearchSelector.tsx\` from local React Aria \`SearchField\`/\`ListBox\` and shared \`Button\`, including accessible loading/empty/error copy, controlled query, \`Cargar más…\`, and provisional \`activeKey\`; keep it inside \`resources-master\`. <!-- sdd-owner: implementation -->`
- **Remaining exact PR 4 TRIANGULATE/REFACTOR:** `- [ ] **TRIANGULATE/REFACTOR:** Add filter-removes-active, deduped-page, continuation-preserves-query, and click/Enter parity evidence; run the stated command and commit the selector with its tests. <!-- sdd-owner: implementation -->`
- **Deferred lifecycle:** parent owns chain targeting/review/receipts; parent-owned task rows remain untouched.

---
## PR 4 — staged selector size-guard stop
- **State / status:** blocked; consumed native `proceed`, authoritative nested spec/designs, strict TDD, and repo-local allowed roots without warnings.
- **Workload / boundary:** PR 4 only (`PR 3 → 📍 PR 4 → PR 5`); an honest selector/test/guard attempt measured 412 A+D before progress, exceeding 399.
### TDD Cycle Evidence
| Task | Safety net | RED | GREEN/TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| PR 4 trial | Architecture 4/4 | Missing selector/import | 10/10 + typecheck | Trial removed for size |
- **Persisted completion/files:** none; PR 4 rows remain visibly unchecked and only this progress record changed.
- **Remaining exact rows:**
- `- [ ] **RED:** Add failing RTL and architecture assertions for Spanish name-only local filtering, active-key repair without confirmation, arrows/Enter, IME/defaultPrevented precedence, explicit retry/continuation, and no document/window listener. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Create \`StagedSearchSelector.tsx\` from local React Aria \`SearchField\`/\`ListBox\` and shared \`Button\`, including accessible loading/empty/error copy, controlled query, \`Cargar más…\`, and provisional \`activeKey\`; keep it inside \`resources-master\`. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Add filter-removes-active, deduped-page, continuation-preserves-query, and click/Enter parity evidence; run the stated command and commit the selector with its tests. <!-- sdd-owner: implementation -->`
- **Next:** parent must provide a revised cohesive PR 4 slice or explicit `size:exception`; PR 5 and lifecycle actions remain deferred.

---
## PR 4A — pure staged-selector model (authorized split)
- **State/boundary:** completed `pr4a-selector-model` only; PR 4B React Aria and PR 5 remain out of scope, with PR 4 rows intentionally unchecked.
- **TDD:** RED import failed; GREEN focused Vitest passed 4/4; triangulation covers Spanish case/diacritic/name-only filtering and active repair branches; Prettier refactor rerun stayed green.
- **Behavior:** pure loaded-display-name filtering plus provisional-key retention/repair only; no React, DOM, API, Query, global state, callback, or dedupe behavior was added.
- **Verification:** focused Vitest 4/4, `pnpm typecheck`, `pnpm lint`, targeted Prettier check, and `git diff --check` passed.
- **Files:** `stagedSearchSelector.model.ts`, `stagedSearchSelector.model.test.ts`, and this record; new attempt is 99 lines (90 source/test + 9 progress), below 399.
- **Native handoff:** parent must settle token `sha256:0eed49d7c68fbea8e97e6211a295e29017c9c8fcddab3ea79c94a78f27962ef8` and remediate `sha256:c09d65095738c56a143d86867daff284a4cc0a23a614b4f0494f52ac27d6a1e4`.

---
## PR 4B — React Aria staged selector UI
- **State/status:** complete `pr4b-selector-ui`; native `proceed`, authoritative OpenSpec artifacts, strict TDD, and repo-local allowed roots consumed without warnings.
- **Boundary:** PR4A `3202c95` supplies the reused name-filter/active-repair model; PR4B adds only selector UI/tests/guard, not PR5 integration.
- **Completed/persisted:** the original PR4 RED, GREEN, and TRIANGULATE/REFACTOR rows are visibly `[x]`; PR4A+4B jointly complete PR4.
- **Files:** `StagedSearchSelector.tsx`, `StagedSearchSelector.test.tsx`, keyboard guard, `tasks.md`, and this cumulative record.
- **TDD:** RED import failed; GREEN selector RTL passed; triangulation covered repair, continuation/retry, states, click/Enter, IME/defaultPrevented; Prettier refactor stayed green.
- **Verification:** focused selector/model/keyboard Vitest 13/13 and `pnpm typecheck` passed; targeted ESLint, Prettier, and `git diff --check` passed.
- **Runtime/rollback:** RTL keyboard scenario passed; remove only the selector, its tests, and guard assertion to roll back this seam.
- **Workload:** feature-branch-chain `PR3 → PR4A → 📍 PR4B → PR5`; final numstat remains below 399 A+D, with no commit or parent lifecycle action.
- **Deviation:** none; the selector is feature-local, uses no global listener, API/query/hierarchy ownership, or consumer integration.
- **Remaining:** retained unchecked implementation rows begin at PR5; parent-owned lifecycle rows remain byte-for-byte deferred.

---
## PR 4C — selector keyboard remediation
- **State/status:** complete `pr4c-selector-keyboard-fix`; consumed authoritative OpenSpec `apply: ready`, native `proceed`, strict TDD, repo-local allowed roots, and no action-context warnings.
- **Review correction:** removed the root Enter capture so React Aria `ListBox.onAction` confirms its focused action key, and gated filter arrows to unmodified keys with `preventDefault()` before local focus transfer.
- **TDD Cycle Evidence**
| Task | Safety net | RED | GREEN | TRIANGULATE/REFACTOR |
| PR 4C keyboard | selector/model/keyboard 13/13 | focused option and modified-arrow tests failed | selector 5/5 | both arrow directions plus all modifiers; Prettier stayed green |
- **Verification:** selector/model/keyboard 14/14; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Files/tasks:** changed only `StagedSearchSelector.tsx`, its unit test, and this record; existing PR4 RED/GREEN/TRIANGULATE rows remain visibly `[x]` after focused tests passed.
- **Workload/deviation/remaining:** PR4C only, 91 A+D including this record (<180); no deviation, commit, PR5 work, or parent lifecycle action; exact remaining unchecked rows remain the retained PR5+ lines above.

---
## PR 5 — Staged Clase selection integrated vertically
- **State/status:** complete `pr5-class-stage`; consumed native `proceed` token `sha256:e3a2205f3f7351daf3d3b6c8956a50051dac7a6674322396ef5ad689cf62ea6c`, authoritative nested spec/designs, strict TDD, `apply: ready`, and `artifactStore: openspec`.
- **Action context:** repo-local allowed surfaces only; no edit-root warning.
- **Completed/persisted:** PR5 RED, GREEN, and TRIANGULATE/REFACTOR rows are `[x]` in `tasks.md`.
- **Files:** `CrearRecursoSurface.tsx`, new `useResourceCreationFlow.ts`, `crearRecursoSurface.test.tsx`, tasks, and this record.
- **TDD Cycle Evidence:** safety net 20/20; RED 3 new staged assertions failed; GREEN 23/23 surface tests; triangulation proved filter-no-confirm, continuation, retry, inherited skip, breadcrumb correction, and re-entry query/page preservation; Prettier refactor remained green.
- **Verification:** focused surface/model/selector Vitest 53/53; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Runtime/rollback:** RTL keyboard filter → Cargar más → Enter confirmed only local Clase; remove the flow wrapper and replaced Clase region to roll back.
- **Workload:** feature-branch-chain `PR4 → 📍 PR5 → PR6`; 392 A+D including this record, below 399; no commit, PR, review, receipt, or PR6 work.
- **Deviation/remaining:** none; Familia/Tipo, Unit, attributes, APIs, screen callbacks, globals, and shared/CSS changes remain deferred to their owned slices.

---
## PR 1 — Safety wall: Unidad ends at Contrato pendiente

### Status

- **State:** completed for the parent-authorized PR 1 safety-wall work unit; native attempt state consumed: `proceed`.
- **Structured status consumed:** `gentle-ai.sdd-status@2` reported `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, all required proposal/spec/design/tasks artifacts present, and no blockers.
- **Action context:** `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex`; every edit stayed within the parent-provided allowed surfaces. No action-context warnings occurred.
- **Workload / PR boundary:** authorized `feature-branch-chain`, `tracker → 📍 PR 1`; final authored A+D is 251 (tracked 229 plus 22 new architecture-test lines), below the 399-line hard limit. No commit, branch, PR, review, receipt, backend, shared UI, keyboard-controller, global-state, URL, or dependency action was performed.

### Completed tasks and persisted checkboxes

- [x] PR 1 RED — `tasks.md` updated immediately after RED/GREEN evidence.
- [x] PR 1 GREEN — `tasks.md` updated immediately after the focused suite passed.
- [x] PR 1 TRIANGULATE/REFACTOR — `tasks.md` updated after replacement-unit coverage and formatting rerun.

### Implementation and verification

- Added `CONFIRM_UNIT` to the local reducer; it ends at `{ kind: 'contract-pending', blockedCapability: 'attributes-v1' }`, preserves null evaluation/fingerprint lease fields, preserves same-ID identity, and revises replacement Units.
- Routed the currently reachable Unidad continuation to `Contrato pendiente`; it does not call legacy attribute or create operations, and pending exposes only **Volver**.
- Legacy attribute/review/create source regions remain intentionally unreachable and their stale RTL suites are skipped until their separately budgeted removal slices (PRs 8–9); this PR does not delete those regions.
- `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts` — RED: 2 failed (`Cannot read properties of undefined (reading 'id')`), then GREEN: 27 passed.
- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` — RED: missing `Contrato pendiente`, then GREEN/TRIANGULATE: 10 passed, 13 stale legacy tests skipped.
- `pnpm exec vitest run tests/architecture/resourceCreationBoundaries.test.ts` — initial RED harness failed with `The URL must be of scheme file`; the test-path defect was corrected before the production guard's GREEN run (1 passed).
- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck` — passed: 38 passed, 13 skipped; typecheck passed.
- `pnpm exec prettier --write src/features/resources-master/resourceCreation.model.ts src/features/resources-master/CrearRecursoSurface.tsx tests/architecture/resourceCreationBoundaries.test.ts` followed by the focused suite — passed; `git diff --check` passed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 1 safety wall | `resourceCreation.model.test.ts`, `crearRecursoSurface.test.tsx`, `resourceCreationBoundaries.test.ts` | Unit + RTL + architecture | 48/48 baseline | Reducer threw for unknown `CONFIRM_UNIT`; RTL could not find pending; architecture test initially had a URL-scheme harness defect | 27 model, 10 active RTL, and 1 architecture assertion passed | Same-ID and replacement Units plus explicit non-preferred Unidad both stayed pending without legacy calls | Prettier formatting reran focused tests green |

### Remaining implementation tasks

- `- [ ] **RED:** Add failing RTL assertions for the visible Creador title, one dominant stage heading, no editable business-value control, and pending heading focus after Unit. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Extract \`ResourceCreationShell.tsx\` and \`ResourceCreationContractPending.tsx\`, compose them from \`CrearRecursoSurface.tsx\`, and use existing \`Dialog\`/GARFEX Light primitives without a second shell or global listener. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Cover initial Class and deep-snapshot openings plus pending back navigation, run the focused command, and record the \`N\`-open runtime result. <!-- sdd-owner: implementation -->`
- Parent-owned lifecycle rows remain deferred byte-for-byte.

### Runtime, rollback, and deviation

- **Keyboard runtime result:** focused RTL moved focus to the enabled Unidad confirmation and sent `Enter`; both preferred and explicitly selected non-preferred candidates reached `Contrato pendiente` without an attribute/create request. A browser runtime was not run because this work unit's task prescribes the focused Vitest/typecheck command.
- **Rollback:** revert only the reducer event/lease fields, reachable pending branch, focused tests/guard, and these PR 1 checkbox/evidence updates.
- **Deviation:** the historical legacy regions are made unreachable rather than deleted, preserving the PR 8–9 deletion boundary and the 399-line cap.

---

## PR 2 — Feature-local Creador shell and pending end state

### Status

- **State:** completed for parent-authorized PR 2 only. The native status CLI was unavailable in this checkout (`gentle-ai sdd` is not a supported command), so this apply used the required manual status fallback after directly reading the authoritative OpenSpec proposal, nested spec, design, tasks, prior progress, and `openspec/config.yaml`.
- **Structured status:** `schemaName: spec-driven`; `changeName: keyboard-first-resource-creation`; `artifactStore: openspec`; `changeRoot: openspec/changes/keyboard-first-resource-creation`; proposal/spec/design/tasks/apply-progress are present; pre-apply state was `ready`; action context was `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex` with the parent-provided edit surfaces. No action-context warning occurred.
- **Workload / PR boundary:** authorized feature-branch-chain `tracker → PR 1 → 📍 PR 2`; this work unit is shell/pending only. PR 3 rail/command bar, selector changes, Familia/Tipo/Unidad integration, legacy deletion, backend work, and parent lifecycle are out of scope.

### Completed tasks and persisted checkbox updates

- [x] PR 2 RED — the visible title, a single stage heading, absence of pending business-value inputs, and pending-heading focus assertions were added and failed before production edits.
- [x] PR 2 GREEN — `ResourceCreationShell` and `ResourceCreationContractPending` were extracted and composed through the existing `Dialog` without a second dialog or global listener.
- [x] PR 2 TRIANGULATE/REFACTOR — initial Class and deep-snapshot opens plus pending back navigation were covered; the persisted PR 2 task rows are visibly `[x]`.

### Files changed

- `src/features/resources-master/ResourceCreationShell.tsx`
- `src/features/resources-master/ResourceCreationContractPending.tsx`
- `src/features/resources-master/CrearRecursoSurface.tsx`
- `tests/unit/crearRecursoSurface.test.tsx`
- `openspec/changes/keyboard-first-resource-creation/tasks.md`
- `openspec/changes/keyboard-first-resource-creation/apply-progress.md`

### TDD Cycle Evidence

| Task               | Test file                                 | Layer | Safety net            | RED                                                                               | GREEN                                                 | TRIANGULATE                                                                                                                 | REFACTOR                                                                                                                                             |
| ------------------ | ----------------------------------------- | ----- | --------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR 2 shell/pending | `tests/unit/crearRecursoSurface.test.tsx` | RTL   | 10 passed, 13 skipped | 1 failure: dialog remained named `Nuevo recurso` instead of `Creador de recursos` | 11 passed, 13 skipped after shell/pending composition | Initial Class and deep snapshot openings, pending back navigation, and both enabled/non-preferred Unit paths remain covered | Restored the minimal source slice after Prettier reformatted the pre-existing large surface; focused tests, typecheck, ESLint, and diff check passed |

### Verification and runtime

- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` — RED: 1 failed, 9 passed, 13 skipped; final: 11 passed, 13 skipped.
- `pnpm typecheck` — passed.
- Targeted `pnpm exec eslint` for the two new components, surface, and RTL test — passed.
- Targeted Prettier checks pass for both new components, the surface, and its RTL test; the final source diff is minimal and `git diff --check` passes.
- **Runtime result:** the focused RTL `N` shortcut opens the Creador shell at Class; Unit confirmation focuses `Contrato pendiente`; `Volver` returns to context. Browser runtime was not run in this bounded apply slice.

### Deviations, rollback, and remaining work

- **Deviation:** none. GARFEX Light semantic utilities and existing `Dialog`/`Button` were reused; no dark/game skin, API, shared UI, global listener, or lifecycle action was added.
- **Rollback:** remove the two feature-local components and their composition/test assertions while retaining PR 1's Unit-to-pending safety wall.
- **Remaining implementation work begins:**
  - `- [ ] **RED:** Add failing RTL cases for <ol> rail semantics, aria-current="step", confirmed-stage return, 44px interactive rail targets, and stage-specific command copy that omits Crear in pending. <!-- sdd-owner: implementation -->`
  - `- [ ] **GREEN:** Implement feature-local CreationStageRail.tsx and CreationCommandBar.tsx with semantic tokens, shape/text state cues beyond color, valid Back/Escape guidance, and existing Button chrome. <!-- sdd-owner: implementation -->`
  - `- [ ] **TRIANGULATE/REFACTOR:** Verify rail navigation alone preserves valid selections while a later alternative confirmation triggers the reducer cascade, run the focused command, and record the rail runtime result. <!-- sdd-owner: implementation -->`
- Parent-owned tracker, chain targeting, bounded review, verification, sync, and archive rows remain deferred byte-for-byte.

---

## PR 3 — Interactive stage rail and persistent command bar

### Status

- **State:** completed for the parent-delegated PR 3 work unit only; this run consumed a reconstructed authoritative OpenSpec status because the parent did not include native JSON and the local status CLI is unavailable.
- **Structured status:** `schemaName: spec-driven`; `changeName: keyboard-first-resource-creation`; `artifactStore: openspec`; proposal, nested spec, design, tasks, and prior apply-progress are present; `applyState: ready`; action context is `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex` with the supplied allowed edit surfaces. No unsafe-root warning occurred.
- **Workload / PR boundary:** authorized `auto-chain` / `feature-branch-chain`, `tracker → PR 1 → PR 2 → 📍 PR 3`; no PR 4 selector work, Familia/Tipo migration, Unit resolver/stage, legacy deletion, backend work, commit, push, PR, review, receipt, or release was attempted.

### Completed tasks and persisted checkbox updates

- [x] PR 3 RED — task line 76 is visibly checked in `tasks.md`.
- [x] PR 3 GREEN — task line 77 is visibly checked in `tasks.md`.
- [x] PR 3 TRIANGULATE/REFACTOR — task line 78 is visibly checked in `tasks.md`.

### Implementation

- Added feature-local `CreationStageRail` with a semantic `<ol>`, compact Clase/Familia/Tipo/Unidad labels, focusable confirmed-stage controls, a `min-h-11` (44px) target contract, `aria-current="step"`, and text/shape cues (`✓`, `●`, `○`) independent of color.
- Added a quiet persistent `CreationCommandBar` around the existing `DialogActions` and existing `Button` actions; it reports only `Esc Cerrar` in context or `Esc Volver` at `Contrato pendiente`, and never exposes Crear at the contract wall.
- Composed the rail through `ResourceCreationShell`, removed the duplicate legacy Contexto progress and duplicate Clase breadcrumb, and retained selections on rail return until an explicit alternative Clase confirmation triggers the existing cascade.
- Escape at `Contrato pendiente` now returns to context without allowing the Dialog handler to close it; Escape from context retains the existing close/opener-restoration behavior.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 3 rail/bar | `tests/unit/crearRecursoSurface.test.tsx` | RTL | 11 passed, 13 skipped | New rail case failed: `Unable to find ... role "list" and name "Etapas de creación"` | After minimal rail/bar/shell composition and duplicate-context removal, focused RTL passed 12 passed, 13 skipped; `pnpm typecheck` passed | Rail return then same Clase reconfirmation preserved context; the distinct rail-return then alternative Clase scenario proved Familia/Tipo/Unidad reset only after confirmation, with focused RTL 12 passed, 13 skipped | Targeted Prettier wrote only scoped files; focused RTL remained 12 passed, 13 skipped and typecheck passed |
| PR 3 pending Escape | `tests/unit/crearRecursoSurface.test.tsx` | RTL | Same focused baseline | New pending Escape assertion failed because the dialog closed instead of returning to context | Added local propagation stop and pending-back branch; focused RTL passed 12 passed, 13 skipped | The original context Escape/restoration case remains green while the pending case keeps the dialog open | Included in the targeted Prettier rerun |

### Verification and runtime

- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` — safety net: 11 passed, 13 skipped; RED: 1 failed, 11 passed, 13 skipped; final/refactor: 12 passed, 13 skipped.
- `pnpm typecheck` — passed (`pnpm router:generate && tsc -b`).
- `pnpm exec prettier --write ...` followed by `pnpm exec prettier --check` for the five changed source/test files — passed; `git diff --check` passed.
- **Runtime result:** RTL exercised the keyboard-reachable pending Escape path and rail-return/confirmation behavior; confirmed context stayed visible, focusable rail controls remained present, and the pending bar omitted Crear. Browser runtime was not run for this bounded component slice.

### Files, budget, deviations, and rollback

- **Files:** `CreationStageRail.tsx`, `CreationCommandBar.tsx`, `ResourceCreationShell.tsx`, `CrearRecursoSurface.tsx`, `crearRecursoSurface.test.tsx`, `tasks.md`, and this cumulative progress record.
- **Changed-line count:** `313 A+D` including untracked files (tracked `git diff --numstat`: 198 A+D; untracked rail/bar: 115 added lines), below the hard 399 cap by 86 lines.
- **Deviation:** no design deviation; the 44px rail target is represented by Tailwind `min-h-11` and the RTL target contract. No new shared component, listener, API, backend, URL, state, or selector refinement was added.
- **Rollback:** remove the two feature-local rail/bar files and their shell/surface/test composition only; the PR 1 safety wall, PR 2 shell ownership, dialog overlay, N trigger, and opener restoration remain.

### Remaining implementation tasks

- `- [ ] **RED:** Add failing RTL tests for Spanish loaded-name-only filtering and copy, ArrowDown search→list, ArrowUp first-item→search, printable list→search, Enter on focused item only, IME/defaultPrevented guards, and filter/page candidate repair without confirmation. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Refine \`StagedSearchSelector.tsx\` and its pure model to keep \`candidateKey\` distinct from \`confirmedKey\`, use local React Aria handlers only, announce loading/error/empty state, and leave continuation outside the listbox. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Add click/Enter parity, zero-visible-with-cursor, and continuation-preserves-query cases; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->`
- Parent-owned tracker, chain targeting, bounded review, verification, sync, and archive rows remain byte-for-byte deferred.

---

## PR 3 correction addendum — gatekeeper blockers

- **Structured status:** manual authoritative OpenSpec status consumed for `keyboard-first-resource-creation`: `artifactStore: openspec`, `applyState: ready`, strict TDD, `repo-local` workspace, and only parent-provided edit surfaces; no action-context warnings.
- **Corrections:** suppressed the duplicate DialogHeading Escape hint; pending Back/Escape now restores Unidad as the rail current stage; and rail controls use inline `minHeight: 44` rather than a descriptive marker.
- **TDD Cycle Evidence:** RED added RTL assertions for no duplicate `Esc cerrar`, an inline/computed 44px target, and Escape after a Familia rail override restoring Unidad; the focused run failed on the missing minimum style, then GREEN passed 12 active RTL tests with 13 intentional skips.
- **Verification:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx`, `pnpm typecheck`, targeted ESLint, targeted Prettier, `pnpm format:check`, and `git diff --check` all passed.
- **Persisted tasks:** the three PR 3 implementation checkboxes remain visibly `[x]`; no task-plan content was changed, and parent-owned lifecycle rows remain deferred.
- **Boundary:** auto-chain / feature-branch-chain PR 3 correction only; no backend, API, shared UI, global keyboard, commit, push, PR, or review work was performed.

---

## PR 4 — Search-list candidate, focus, and local-search refinements

- **State / structured status:** completed under authoritative native OpenSpec status: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, no blockers, and strict TDD enabled. The parent-provided action context is `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex`; every changed file is in the allowed surfaces, with no warning.
- **Workload / PR boundary:** authorized `auto-chain` / `feature-branch-chain`, `PR 3 → 📍 PR 4 → PR 5`; no PR 5 hierarchy work or parent lifecycle action was performed. Final total is 268 A+D, including this progress record and task checkbox updates, below the hard 399 limit; no commit was made.
- **Completed / persisted:** PR 4 RED, GREEN, and TRIANGULATE/REFACTOR lines 84–86 are visibly `[x]` in `tasks.md`.
- **Implementation:** `candidateKey` is local and repaired independently of optional `confirmedKey`; `aria-selected` represents only confirmation, while candidate focus and confirmation have separate visible markers. Search is the sole typing target, with Spanish loaded-name-only copy and an honest loaded-result count. Local capture handlers move Search → candidate, first candidate → Search, and printable list keys → Search without global listeners or confirmation. Loading/error/empty announcements and continuation remain outside the ListBox.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 4 selector/model | `tests/unit/StagedSearchSelector.test.tsx` | RTL + pure unit | 10/10 focused selector/architecture baseline | 5 failures: honest Spanish copy, confirmed/candidate separation, first-item ArrowUp, printable transfer, and printable-key model | 8 selector tests passed after the smallest local handler/model changes | Click/Enter parity, filtered/zero-visible continuation, page/query preservation, modified/default-prevented input arrows, IME/command-key recognition, and focused-item Enter are covered | Prettier reformatted the three changed source/test files; focused suite stayed green |

### Verification and runtime

- `pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts && pnpm typecheck` — passed: 13/13 tests and typecheck.
- `pnpm exec eslint src/features/resources-master/StagedSearchSelector.tsx src/features/resources-master/stagedSearchSelector.model.ts tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts` — passed.
- Targeted Prettier check and `git diff --check` — passed.
- **Keyboard runtime result:** RTL exercised Search `ArrowDown`, first-item `ArrowUp`, printable list transfer, focused Enter, click parity, loading/error/retry, zero visible results with `Cargar más…`, and query-preserving continuation; none called `onConfirm` except exact Enter/click.

### Files, deviation, rollback, and remaining work

- **Files:** `src/features/resources-master/StagedSearchSelector.tsx`, `src/features/resources-master/stagedSearchSelector.model.ts`, `tests/unit/StagedSearchSelector.test.tsx`, `openspec/changes/keyboard-first-resource-creation/tasks.md`, and this cumulative record. `keyboardBoundaries.test.ts` was verified but needed no source change because its existing local-listener guard already covered the boundary.
- **Deviation:** none. The feature-local React Aria composite uses GARFEX semantic tokens and no API, backend, query, global-store, shared-UI, or document/window-listener changes.
- **Rollback:** revert this selector/model/test slice and its three task checkboxes; retain PR 1–3 work and the single global keyboard controller.
- **Remaining implementation tasks:** all implementation rows beginning PR 5 remain unchecked; next are `- [ ] **RED:** Add failing surface/model cases for parent-gated pagination, deep valid prefix entry, invalid-prefix fallback, Class/Family replacement cascades, same-ID reconfirmation, and stale descendant response rejection. <!-- sdd-owner: implementation -->`, `- [ ] **GREEN:** Wire independent existing \`createParentGatedListController\` instances through \`useResourceCreationFlow.ts\`, render staged Familia/Tipo selectors, and remove the corresponding simultaneous legacy controls. <!-- sdd-owner: implementation -->`, and `- [ ] **TRIANGULATE/REFACTOR:** Exercise continuation, dedupe, retry, rail return, and local-screen isolation across all three hierarchy stages; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->`. Parent-owned lifecycle rows remain byte-for-byte deferred.

---

## PR 4 correction — selector keyboard findings

- **Status / scope:** manual authoritative OpenSpec status consumed (`artifactStore: openspec`, `applyState: ready`, strict TDD, `repo-local`); the parent-provided five edit surfaces are safe. CodeGraph MCP was unavailable after its initialized-index check, so direct focused reads were used.
- **Boundary / budget:** authorized auto-chain correction for PR 4 only. It adds **84 A+D** to the supplied 268-A+D candidate; the current total is **352 A+D**, below both the 130 correction allowance and 399 hard limit. No task checkbox, commit, PR, review, backend, API, shared-UI, global listener, or PR 5 work occurred.
- **Behavior:** Search `ArrowDown` now focuses the current candidate option (including nonfirst preferred/page-repaired keys), never the ListBox container. Modified/IME/default-prevented first-option `ArrowUp` stays local. AltGraph Ctrl+Alt printable keys are accepted while ordinary command chords remain excluded. Space does not confirm; click and focused Enter parity remain covered. Search labels and loaded-result information are `text-sm`.

### TDD Cycle Evidence

| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 4 correction | selector + keyboard 13/13 | 3 failures: nonfirst candidate focus, modified first-option ArrowUp, and AltGraph printable recognition | Minimal option query/focus, modifier guard, and AltGraph predicate made selector 8/8 green | Added Space non-confirmation and preferred candidate page-arrival repair; Prettier rerun and selector + keyboard suite passed 14/14 |

- **Verification:** `pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts && pnpm typecheck && pnpm lint && pnpm format:check && git diff --check` passed (14/14); final `git diff --numstat` is 352 A+D.
- **Remaining:** no PR 4 implementation rows remain; the exact next unchecked PR 5 rows remain in the previous PR 4 record. Parent-owned lifecycle rows are unchanged.

---
## PR 5B — staged Tipo integration
- **Status:** authoritative OpenSpec `apply: ready`, `next: apply`; strict TDD; repo-local allowed root; no warnings.
- **Boundary:** auto-chain / feature-branch-chain `PR5A → 📍 PR5B → PR6`; no Unit resolver/stage, API, shared/global/URL work, commit, review, or lifecycle action.
- **Completed:** independent parent-gated Tipo controller; staged Tipo only after Familia; legacy parallel Tipo removed; valid deep prefix enters enabled Unidad.
### TDD Cycle Evidence
| Task | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- |
| PR5B Tipo | Deep-prefix Unidad disabled | RTL 16 passed, 13 skipped | Retry, pagination/dedupe, stale Familia, reconfirmation/reset; local Unit loader extracted and rerun green |
- **Verification:** focused surface/model/loader `48 passed, 13 skipped`; `pnpm typecheck`, targeted ESLint, Prettier check, and `git diff --check` passed.
- **Tasks:** PR5 RED/GREEN/TRIANGULATE rows are `[x]`; combined PR5A+5B evidence now covers their stated behavior. Parent-owned rows unchanged.
- **Files:** `useResourceCreationFlow.ts`, `CrearRecursoSurface.tsx`, surface RTL, tasks, and this record.
- **Remaining:** `- [ ] **RED:** Add deferred-promise failures for policy and unit dedupe, effective/non-shadowed filtering, `getUnit` hydration, null/inactive exclusion, partial hydration error/retry, stale Tipo rejection, and explicit continuation. <!-- sdd-owner: implementation -->`
- **Runtime/rollback:** RTL keyboard confirms staged hierarchy and stale rejection; browser N/A. Revert only the Tipo controller/surface/test wiring while retaining PR5A Familia.
- **Budget:** 387 A+D including tasks/progress, under 399; no design deviation.

---
## PR 6A — Unit policy-page state
- **Status/boundary:** authoritative `gentle-ai sdd-status keyboard-first-resource-creation`: OpenSpec `applyState: ready`, strict TDD, repo-local allowed root, no warnings; auto-chain `PR 5 → 📍 PR 6A → PR 6B`.
- **Completed:** Tipo-scoped pages retain eligible first-order policy/unit references, reject stale/repeated cursors, and keep the first unit for a duplicate policy ID while OR-ing later `principal`/`selected`; distinct policy IDs sharing it still dedupe.
- **Tasks/files:** no PR 6 checkbox changed because combined rows include deferred hydration/retry; parent rows untouched. Changed loader, focused test, and this record only.
### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| Duplicate-policy flags | 8/8 | 7/8 after distinct policy flags removed | 8/8 after retained-reference OR | later-unit duplicate plus distinct same-unit ID; no refactor |
- **Verification:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts` 8/8; `pnpm typecheck`, targeted ESLint/Prettier, and `git diff --check` passed; final numstat 384 A+D.
- **Runtime/rollback/deviation:** N/A pure policy state; revert loader/controller and focused tests only; hydration/detail eligibility/error retry/final candidate shape remain PR 6B.
- **Remaining unchecked PR 6 rows:**
- `- [ ] **RED:** Add deferred-promise failures for policy and unit dedupe, effective/non-shadowed filtering, \`getUnit\` hydration, null/inactive exclusion, partial hydration error/retry, stale Tipo rejection, and explicit continuation. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Add the feature-local \`UnitCandidate\` resolver using only current Type-policy pages and \`getUnit\`, token/context/cursor adoption guards, first-order preservation, and principal/selected as focus preference only. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate policies OR-combine preference flags, retained resolved candidates survive a partial error, and repeated non-exhausted cursors fail recoverably; run the focused command. <!-- sdd-owner: implementation -->`

---
## PR 6B — size-guarded correction stop
- **Status/action context:** authoritative OpenSpec artifacts were present; strict TDD and supplied repo-local edit roots were safe, with no warnings.
- **TDD:** RED was exactly 4 failed, 11 passed (15) for flattened candidates, overlapping retry, overlapping same-Tipo start, and policy-reference advancement; GREEN was 13/13 plus `pnpm typecheck` passed.
- **Boundary:** after restoring tasks/prior progress, the honest source/test candidate was 422 A+D, 23 above the hard 399 cap.
- **Rollback/tasks:** all PR 6B source/test edits were reverted; no PR 6 checkbox changed, the three PR 6 rows remain visibly unchecked, and the restored focused baseline is 8/8 passed.
- **Next:** parent needs a cohesive sub-slice or explicit `size:exception`; no commit or lifecycle action occurred.

---
## PR 6B1 — stable Unit detail snapshot
- **Status/action context:** complete for the authorized PR 6B1 slice; manual authoritative OpenSpec status was `ready`, strict TDD and repo-local allowed surfaces were safe, with no warnings.
- **TDD:** 8/8 safety net; RED was 4 failures/8 passes for the absent hydrator; GREEN 12/12 plus typecheck; triangulation covers dedupe/OR flags, partial failures, stale Tipo/cursor snapshots, and confirmed empty; Prettier refactor reran green.
- **Verification:** focused Vitest 12/12, full `pnpm test` 411 passed/13 skipped, typecheck, targeted ESLint/Prettier, and `git diff --check` passed.
- **Files/boundary:** only `resourceCreation.loaders.ts`, its unit test, and this record changed; `getUnit` is the sole injected detail read, no retry API or consumer/UI work was added.
- **Tasks/remaining:** combined PR 6 rows intentionally remain unchecked because policy paging/retry/consumer work is deferred; parent-owned rows remain byte-for-byte deferred.
- [ ] **RED:** Add deferred-promise failures for policy and unit dedupe, effective/non-shadowed filtering, `getUnit` hydration, null/inactive exclusion, partial hydration error/retry, stale Tipo rejection, and explicit continuation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add the feature-local `UnitCandidate` resolver using only current Type-policy pages and `getUnit`, token/context/cursor adoption guards, first-order preservation, and principal/selected as focus preference only. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate policies OR-combine preference flags, retained resolved candidates survive a partial error, and repeated non-exhausted cursors fail recoverably; run the focused command. <!-- sdd-owner: implementation -->

---

## PR 6B2 — failed Unit-detail retry

- **Status:** completed delegated PR 6B2 under native authoritative OpenSpec status `applyState: ready`, `nextRecommended: apply`, strict TDD, and repo-local allowed root; no action-context warnings.
- **Boundary:** `PR 5 → PR 6A → PR 6B1 → 📍 PR 6B2`; retry only, with no UI/hook/API/backend/listarUnidades/PR7 or lifecycle work, commit, push, or PR action.
- **Completed/persisted:** PR 6 RED, GREEN, and TRIANGULATE/REFACTOR checkboxes are now `[x]`; PR6A policy paging, PR6B1 stable hydration, and this retry evidence cover the combined rows.
- **Behavior:** public `retry()` targets only the current failed Unit identities, returns the current same-generation promise during overlap, retains successful candidates, restores retry successes in policy-reference order, and preserves unresolved failed identities for another retry. A superseded Tipo snapshot rejects old adoption and cannot clear the newer pending promise; retry without failures makes no detail call.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 6B2 retry | `tests/unit/resourceCreation.loaders.test.ts` | Unit | 12/12 passed | 3 failures: public `retry` was absent | 15/15 passed after the minimal retry implementation | 16/16 covers repeated failed retry recovery/order, no-failure no-call, and stale Tipo retry retaining newer pending work | Prettier formatted loader/test; focused 16/16 remained green |

- **Verification:** focused `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts` passed 16/16; `pnpm test` passed 415 with 13 skipped; `pnpm typecheck`, targeted ESLint, targeted Prettier, and `git diff --check` passed.
- **Files:** `resourceCreation.loaders.ts`, `resourceCreation.loaders.test.ts`, `tasks.md`, and this record.
- **Runtime:** N/A; this pure deferred-promise loader contract has no browser boundary before PR 7.
- **Rollback:** remove `UnitCandidateHydrator.retry()` and its focused deferred-promise tests; retain PR6A policy paging and PR6B1 snapshot hydration.
- **Deviation:** none.
- **Remaining exact next implementation rows:**
  - `- [ ] **RED:** Add failing surface tests for Unit-stage entry after Tipo, preferred-active-but-unconfirmed behavior, Enter/click confirmation, empty eligibility, partial error retry, and stale-Type invalidation. <!-- sdd-owner: implementation -->`
  - `- [ ] **GREEN:** Connect the PR 7 resolver in \`useResourceCreationFlow.ts\` and render an explicit Unit \`StagedSearchSelector\` in \`CrearRecursoSurface.tsx\`, dispatching \`CONFIRM_UNIT\` only from explicit action. <!-- sdd-owner: implementation -->`
  - `- [ ] **TRIANGULATE/REFACTOR:** Demonstrate a continuation can coexist with an immediately confirmable hydrated candidate while pending/failed hydration cannot advance, run the stated command, and commit Unit behavior with its tests. <!-- sdd-owner: implementation -->`
- **Workload:** 209 A+D (26 progress + 6 task checkboxes + 49 loader + 128 tests), below the hard 399 limit.

---

## PR 7A — Unit hook/controller coordination

- **Status:** consumed authoritative native OpenSpec status: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, strict TDD, and `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`. Parent-supplied allowed surfaces were safe; no action-context warnings.
- **Boundary:** `PR 6B2 → 📍 PR 7A`; flow/hook coordination only. `CrearRecursoSurface.tsx` was not edited, no Unit UI replacement, API/backend/shared/global/URL/dependency change, task-checkbox change, commit, review, or lifecycle action occurred.
- **Implementation:** `useResourceCreationFlow` now owns `createUnitPolicyPageController` and `createUnitCandidateHydrator` using existing `api.listUnitPolicies` and `api.getUnit`. It exposes read-only `units`, selector-compatible `unitLoadState`, `continueUnits`, `retryUnits`, and guarded `confirmUnit`. A deep valid prefix starts Tipo-scoped policy/detail resolution; ancestor/Tipo replacement clears the policy and hydration generations, so stale work cannot attach. `confirmUnit` dispatches `CONFIRM_UNIT` only for an explicitly supplied current hydrated candidate and never auto-confirms/preselects.
- **Files:** `src/features/resources-master/useResourceCreationFlow.ts`; `tests/unit/crearRecursoSurface.test.tsx`; this record.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| PR 7A controller wiring | `tests/unit/crearRecursoSurface.test.tsx` | Hook integration | 16 passed, 13 skipped | New deep-prefix policy-call test failed: `listUnitPolicies` had 0 calls | 17 passed, 13 skipped after hook wiring | Added continuation coexistence plus partial hydration/retry/current-candidate guard; 18 passed, 13 skipped. Prettier refactor reran focused flow/loader tests green. |

- **Verification:** focused surface/loader `34 passed, 13 skipped`; `pnpm test` `417 passed, 13 skipped`; `pnpm typecheck`, targeted ESLint/Prettier, and `git diff --check` passed.
- **Runtime:** N/A — this isolated hook has no visible Unit surface by delegation; focused hook tests cover explicit callback dispatch and stale Tipo rejection.
- **Rollback:** remove the Unit controller/hydrator ownership, exports, and hook tests only; retain PR 6 resolver and the byte-identical Unit surface.
- **Tasks:** PR 7’s combined rows remain visibly unchecked because the delegated PR 7A slice deliberately excludes its required `CrearRecursoSurface.tsx` UI work; parent-owned rows were preserved byte-for-byte.
- **Remaining exact PR 7 rows:**
  - `- [ ] **RED:** Add failing RTL cases for Unit entry after Tipo, preferred-but-unconfirmed candidate, explicit Enter/click, eligible empty state, partial-error retry, and Type-change invalidation. <!-- sdd-owner: implementation -->`
  - `- [ ] **GREEN:** Connect the PR 6 resolver through \`useResourceCreationFlow.ts\`, render the staged Unit selector in \`CrearRecursoSurface.tsx\`, and dispatch \`CONFIRM_UNIT\` only from explicit confirmation. <!-- sdd-owner: implementation -->`
  - `- [ ] **TRIANGULATE/REFACTOR:** Cover load-more with immediately confirmable hydrated candidates versus pending/failed hydration that cannot advance, run the focused command, and record the runtime result. <!-- sdd-owner: implementation -->`
- **Workload:** current diff `385 A + 8 D = 393 A+D`, below the hard 399 PR boundary.

---

## PR 7B — explicit staged Unidad natural decision

- **Boundary:** commits `cf340aa` and `015ac14` jointly complete PR 7; backend, API, attributes, shared UI, and unrestricted Unit listing remain excluded.
- **Behavior:** one staged `Unidad natural` selector consumes current Tipo candidates; preferred flags only focus, explicit Enter/click reaches Contract pending, and rail/pending returns preserve one authoritative stage.
- **TDD:** rail and pending-back regressions failed before reducer-authoritative navigation; final focused surface/loader/model run passed 63 with 13 intentional skips.
- **Verification:** full suite passed 419 with 13 skips; typecheck, targeted ESLint/Prettier, and diff checks passed. PR 7 rows are now `[x]`.
- **Workload:** this evidence-only reconciliation stays below 120 A+D; no runtime source changes.

---

## PR 8B — unreachable attribute reducer and suite cleanup

- **Status:** consumed `gentle-ai.sdd-status@2`: OpenSpec `applyState: ready`, strict TDD, repo-local allowed root, no blockers or action-context warnings.
- **Completed/persisted:** PR 8 RED/GREEN/TRIANGULATE rows are `[x]`; committed PR8A plus this cleanup satisfy the bounded PR8 rows.
- **Files:** model, model/surface/architecture tests, tasks, and this record; no `CrearRecursoSurface`, API/types, or backend edits.
- **Behavior:** removed disconnected attribute stage/draft/events/reset/reducer arms and only skipped Paso 2; retained resource-data/review/create bridge and Paso 3 fixtures/helpers. Class/Family/Type/Unit/pending behavior is unchanged.

### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR8B deletion | 48 passed, 13 skipped | source-boundary assertion failed | 47 passed, 6 skipped | six negative symbols; resource-data-only repeated mutation; Prettier green |

- **Verification:** focused surface/model/loader/architecture 63 passed, 6 skipped; full suite 418 passed, 6 skipped; typecheck, targeted ESLint/Prettier, and diff check passed. Source scan finds removed model symbols only in the guard; Unit RTL reaches pending without legacy requests.
- **Runtime/rollback:** keyboard Unit confirmation reaches `Contrato pendiente`; browser N/A. Restore only this cleanup to roll back.
- **Boundary:** `PR 7 → PR8A → 📍 PR8B → PR9`; no commit, push, PR, review, receipt, or lifecycle action.
- **Remaining:** `- [ ] **RED:** Add failing architecture/surface assertions that Creador source has no legacy payload/create symbols and that completing Unit does not invoke onCreated or any create operation. <!-- sdd-owner: implementation -->`

---

## PR 9A — legacy model protocol deletion

- **Status:** consumed authoritative `gentle-ai.sdd-status@2`: OpenSpec apply ready, artifacts present, repo-local root allowed, and no blockers. Strict TDD applies.
- **Boundary:** PR 9A only (`PR 8 → 📍 PR 9A → PR 9B`); deleted only model protocol and its obsolete model tests. `CrearRecursoSurface.tsx` was inspected but not edited.
- **Behavior:** removed `resource-data`, `review`, and `result` stages; `SubmitState`/`submit`; manual Nombre/Descripción draft data; validation/submit helpers and events; and legacy `backStage`/reducer arms. Hierarchy selection, `unitId`, null evaluation/fingerprint lease, revision/cascades, and pending→unit back remain.
- **Task checkboxes:** none changed: all three persisted PR 9 rows include the deferred surface payload/create cleanup, so marking them would be false completion. Their exact unchecked rows remain authoritative.

### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 9A deletion | model + architecture 27/27 | new model-source negative guard failed on `resource-data` | model + architecture 23/23; typecheck passed | guard covers stages, submit type/events, and helpers; Prettier rerun stayed green |

- **Verification:** model/surface/architecture Vitest 43 passed, 6 skipped; full `pnpm test` 414 passed, 6 skipped; `pnpm typecheck`, targeted ESLint, targeted Prettier, and `git diff --check` passed.
- **Workload / rollback:** source/test A+D is 239 (11 additions, 228 deletions), below 399; restore only the model/test/guard deletion to roll back. No commit, push, PR, review, receipt, or lifecycle action.
- **Surface split result:** `CrearRecursoSurface.tsx` does not import the removed model protocol, and typecheck is green; it does not prevent this green split. Its legacy payload/create code remains for PR 9B.
- **Remaining:** PR 9 RED/GREEN/TRIANGULATE rows remain unchecked for the deferred surface cleanup and close/back/no-create evidence; parent-owned lifecycle rows are deferred unchanged.

---
## PR 9B — surface cleanup budget stop
- **State/status:** blocked before persistence; native status was `apply: ready`, strict TDD and repo-local allowed roots were consumed without warnings.
- **TDD evidence:** safety net 43 passed/6 skipped; RED added a source-negative architecture guard and failed on `api.createResource`; the complete deletion trial made that guard green and focused surface/model/architecture passed 44/6, but was reverted before completion for budget compliance.
- **Budget:** the cohesive source-plus-architecture trial measured exactly **434 A+D** (27 additions, 407 deletions), exceeding the hard 399 limit by 35; no smaller honest PR9B surface slice was authorized.
- **Final verification after reversion:** `pnpm test` 414 passed/6 skipped; `pnpm typecheck`, targeted ESLint, targeted Prettier, and `git diff --check` passed.
- **Tasks/files:** PR 9 rows remain visibly unchecked as directed; only this cumulative progress record changed, and no API/types/screen/E2E/model/backend/shared/global file changed.
- **Required decision:** authorize cohesive PR9B.1/PR9B.2 source boundaries or an explicit `size:exception`; no commit, push, PR, review, receipt, or lifecycle action was performed.

---
## PR 9B1 — dead created-result presentation deletion

- **Status / action context:** consumed authoritative `gentle-ai sdd-status keyboard-first-resource-creation`: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, all required artifacts present, strict TDD active, and no blockers. Parent-provided repo-local edit surfaces were honored; no action-context warning occurred.
- **Boundary:** authorized auto-chain PR9B1 only (`PR 8 → PR 9A → 📍 PR 9B1 → PR 9B2`). This removes only the dead created-result presentation and its exclusive state/imports; review form, `buildValores`, `submit`, `api.createResource`, error/uncertain states, and the unused `onCreated` seam remain buildable. Excluding the inherited 9-line PR9B stop record, this slice is exactly **56 additions + 56 deletions = 112 A+D**, below 399. No Paso 3/E2E test deletion, API/types/model/screen/docs/shared/global/backend change, commit, review, receipt, or lifecycle action occurred.
- **Implementation:** removed the `ResourceSummary` result state/import, `created` submit status, result JSX, and **Crear otro** restart action. Successful dormant submission now returns its retained submit state to `idle` before retaining `onCreated?.()`.
- **Persisted tasks:** no PR 9 checkbox was changed because every aggregate PR 9 implementation row remains incomplete until PR9B2 removes the review/payload/create flow. Parent-owned rows remain byte-for-byte unchanged.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR9B1 created-result deletion | `tests/architecture/resourceCreationBoundaries.test.ts` | Architecture source boundary | 3/3 passed | Added a negative guard; 1/4 failed on `✓ Recurso creado` | 4/4 passed after the bounded deletion; typecheck passed | Guard independently rejects result presentation, restart action, created-status branch, and result setter | Prettier formatted the surface; guard and typecheck remained green |

### Verification

- Focused `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts` — 44 passed, 6 skipped.
- `pnpm test` — 415 passed, 6 skipped.
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` — passed.
- `git diff --check` — passed after this progress update.

### Remaining implementation tasks

- `- [ ] **RED:** Add failing architecture/surface assertions that Creador source has no legacy payload/create symbols and that completing Unit does not invoke onCreated or any create operation. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Delete the bounded legacy review, submit, payload, ownership, and result branches plus their obsolete tests while retaining the onCreated → refetchActive() seam unused by pending. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Verify close/back focus behavior still works after removal, run the focused command, and record the no-create runtime result. <!-- sdd-owner: implementation -->`

- **Rollback:** restore only this result-state/result-JSX/restart-action deletion and its architecture guard; retain Unit→Contrato pendiente and the deferred PR9B2 review/submit code.
## PR 9B2 — legacy review/payload/create surface deletion
- **Status:** manual fallback `spec-driven` status consumed: `artifactStore: openspec`, authoritative nested spec/design/tasks present, `applyState: ready`; strict TDD active.
- **Action context:** repo-local `/home/garfex/PROGRAMACION/sistema-ui-garfex`; only supplied surface/test/progress paths changed; no warnings.
- **Workload / PR boundary:** auto-chain `PR 9B1 → 📍 PR 9B2 → PR 9C`; exact final A+D is 397, below 399; no commit or parent lifecycle action.
- **Completed tasks:** none persisted by explicit PR9C hold; PR9 rows remain unchecked, while the retained `onCreated` prop/interface is not invoked.
- **Files:** `CrearRecursoSurface.tsx`, `resourceCreationBoundaries.test.ts`, and this cumulative record.
- **TDD Cycle Evidence:** safety net 44 passed/6 skipped; RED source guard failed on `api.createResource`; GREEN focused suite 45 passed/6 skipped; triangulation guards manual fields, payload/admin/error/uncertain branches, and review commands; Prettier refactor remained green.
- **Verification:** focused Vitest 45 passed/6 skipped; full `pnpm test` 416 passed/6 skipped; `pnpm typecheck`, targeted ESLint/Prettier, and `git diff --check` passed.
- **Deviations / rollback:** disabled staged `Siguiente` remains for active test compatibility; restore only this deletion/guard slice to roll back.
- **Remaining exact unchecked rows:**
- [ ] **RED:** Add failing architecture/surface assertions that Creador source has no legacy payload/create symbols and that completing Unit does not invoke `onCreated` or any create operation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Delete the bounded legacy review, submit, payload, ownership, and result branches plus their obsolete tests while retaining the `onCreated → refetchActive()` seam unused by pending. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Verify close/back focus behavior still works after removal, run the focused command, and record the no-create runtime result. <!-- sdd-owner: implementation -->

## PR 9C — test-cleanup budget stop

- **Status / action context:** authoritative `gentle-ai.sdd-status@2` consumed: OpenSpec apply ready, strict TDD, repo-local allowed root, and no blockers.
- **RED:** baseline was 25 passed/6 skipped for surface+architecture; temporarily enabling the skipped Paso 3 suite produced 20 passed/6 failed because the removed `Siguiente` path no longer exists. The full Playwright file also exposed the stale old-dialog assertion and the create/refetch scenario as expected failures (5 passed/2 failed).
- **Budget:** deleting the required Paso 3 suite plus its exclusive Unit fixtures/helpers is 334 D + 3 A; deleting the stale create/refetch E2E is 116 D, and preserving the unrelated open/shortcut coverage requires 2 D + 2 A. The required test cleanup therefore reaches 454 A+D before this record, exceeding the hard 399 cap.
- **Persisted tasks:** none changed; all aggregate PR 9 rows remain visibly unchecked until the final cleanup and close/back evidence can be completed within an authorized delivery boundary. Parent-owned rows remain untouched.
- **Required delivery decision:** authorize a cohesive PR9C.1/PR9C.2 split (unit cleanup, then E2E cleanup) or explicitly accept an over-budget exception. No production/API/types/model/screen changes, commit, push, PR, review, receipt, or lifecycle action occurred.

## PR 9C1 — skipped Paso 3 unit-suite deletion

- **Status / action context:** native `gentle-ai.sdd-status@2` consumed: OpenSpec apply ready, strict TDD, repo-local allowed root, no blockers or warnings.
- **Workload / boundary:** authorized auto-chain `PR 9C → 📍 PR 9C1 → PR 9C2`; no E2E, production, API, model, screen, tasks, commit, or lifecycle action.
- **Deletion:** removed the skipped Paso 3 review/create suite and its exclusive `goToStep2`, `goToStep3`, `resourceSummary`, assignment/definition, and option fixtures; retained shared fake API mocks and active pending no-request proof.
- **Tasks:** PR 9 aggregate rows remain visibly unchecked by direction; no persisted task checkbox changed.
- **TDD Cycle Evidence:** safety net surface 20 passed/6 skipped; deletion-only RED is N/A because no replacement behavior test was authorized; GREEN focused surface/model/architecture 45/45; triangulation is the active pending no-request proof; Prettier refactor reran focused green.
- **Verification:** full `pnpm test` 416/416; `pnpm typecheck`, targeted ESLint and Prettier, and `git diff --check` passed; source scan found no skipped Paso 3/helper symbols.
- **Rollback:** restore only this test-suite cleanup; retain active staged hierarchy/Unit/pending tests.

---

## PR 9C2 — stale creation/refetch E2E deletion

- **Status / action context:** authoritative `gentle-ai.sdd-status@2` consumed: OpenSpec `applyState: ready`, strict TDD, repo-local allowed root, no blockers or warnings. Final status remains `apply: ready` with 29/52 implementation tasks complete.
- **Boundary / workload:** authorized auto-chain `PR 9C1 → 📍 PR 9C2`; only the stale E2E creation/refetch path, its exclusive helpers, task checkboxes, and this record changed. Final `git diff --numstat` is **25 A + 138 D = 163 A+D**, below 399. No production/API/model/screen/refetch-seam change, commit, push, PR, review, receipt, or lifecycle action occurred.
- **Completed / persisted:** PR 9 RED, GREEN, and TRIANGULATE/REFACTOR checkboxes are visibly `[x]`; combined PR9A+B1+B2+C1+C2 removes the legacy production model/surface and obsolete tests while retaining the API facade/backend operation and unused `onCreated → refetchActive()` seam.
- **Deletion:** removed the E2E create/refetch scenario, its `matchesResourceCall` and `chooseResourceContext` helpers, all legacy `Siguiente`/`Nombre`/`Crear recurso` expectations and create-triggered refetch mocks. Preserved current open/shortcut coverage, updating its dialog assertion to **Creador de recursos**.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net / RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- | --- |
| PR9C2 deletion | `tests/e2e/resourcesMaster.workstation.spec.ts` | Playwright | Obsolete creation/refetch case timed out at its removed Clase chooser; the initial full file then exposed the old dialog-name assertion | After deletion and the current dialog-name update, the file passed 6/6 | Source scan found no legacy test path or non-API Creador payload/create symbols; existing unit/refetch seam passed; no refactor was needed |

- **Verification:** `pnpm exec vitest run tests/unit tests/architecture` — 35 files, 388 passed; `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts` — 6/6 passed; `pnpm typecheck`, targeted ESLint/Prettier, and `git diff --check` passed. The pre-delete Playwright failure was an expected obsolete-test RED, not an environment failure.
- **Source scan:** no `buildResourceCreateInput`, `ResourceCreateInput`, `.createResource(`, `ownership`, or `ResourceCreationDetails` remains in Creador production files outside API/types; `resourcesMaster.api.ts` and `.types.ts` retain the legacy create facade/operation. `tests/unit/resourcesMasterScreenRefetch.test.tsx` has no diff and passed in the unit suite.
- **Deviation / rollback:** none. Restore only this E2E scenario/helpers and the two current dialog-name assertions to roll back; retain PR9’s production deletions.
- **Remaining implementation tasks:** persisted unchecked work begins unchanged with `- [ ] **RED:** Add failing opaque-value tests for assignment-ID keying, active/suspended exclusivity, confirm, omit, suspend, restore, keep-suspended, active-only projection, hierarchy reset, Unit evaluation invalidation, and revision increments. <!-- sdd-owner: implementation -->`, `- [ ] **GREEN:** Implement generic \`SelectionBuckets<TSelection>\` and pure operations in \`resourceCreation.selectionDraft.ts\`; keep \`SelectionBuckets<never>\` in the current runtime and never introduce a transport DTO or local \`CONDITIONAL\` evaluator. <!-- sdd-owner: implementation -->`, and `- [ ] **TRIANGULATE/REFACTOR:** Prove definition-ID/index collisions cannot merge assignments and that omitted differs from unanswered, then run the focused command and record the pure-contract result. <!-- sdd-owner: implementation -->`; parent-owned lifecycle rows remain byte-for-byte deferred.

---
## PR 10 — Pure active/suspended selection buckets

- **Status / structured status:** complete for the parent-authorized PR 10 work unit. Native `gentle-ai sdd-status keyboard-first-resource-creation` was authoritative: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, required artifacts present, and no blockers.
- **Action context:** `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`; all edits are in the supplied allowlist. No warnings.
- **Boundary:** feature-branch-chain `… → PR 9 → 📍 PR 10 → PR 11`; no commit, PR, review, receipt, runtime UI/API/backend/DTO/evaluator, global state, dependency, or URL changes.
- **Completed / persisted:** PR 10 RED, GREEN, and TRIANGULATE/REFACTOR rows are visibly `[x]` in `tasks.md`.
- **Implementation:** added generic assignment-ID keyed active/suspended/omitted buckets and active-only projection. `CreationDraft` now carries `SelectionBuckets<never>`; hierarchy changes atomically clear buckets, while Unit changes preserve them and invalidate the null lease. Effective bucket replacement increments revision and invalidates the lease.

### TDD Cycle Evidence

| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 10 buckets/model | model 20/20 | selection module import failed; model bucket/reset and revision assertions failed | focused 28/28 | same definition/index assignment IDs stayed distinct; omitted differed from unanswered; Prettier rerun stayed 28/28 |

- **Verification:** focused Vitest 28/28; `pnpm test` 424/424; `pnpm typecheck`; targeted ESLint; targeted Prettier; and `git diff --check` passed.
- **Runtime:** N/A — this is a pure backend-independent contract not yet consumed by runtime attributes.
- **Files:** `resourceCreation.selectionDraft.ts`, `resourceCreation.model.ts`, both focused unit tests, `tasks.md`, and this cumulative record.
- **Deviation / rollback:** none; revert only the pure module, model bucket seam, focused tests, and these task/progress updates.
- **Remaining:** no PR 10 implementation-owned rows remain unchecked. All later retained implementation rows and parent-owned lifecycle rows remain unchanged in `tasks.md`.
- **Workload:** final A+D before correction: 332, below the hard 399-line cap.

---
## PR 10 correction — bucket exclusivity

- **Status / action context:** authoritative `gentle-ai.sdd-status@2` was `apply: ready`; `repo-local` workspace and the supplied edit allowlist were safe, with no warnings.
- **TDD:** safety net 6/6 passed; RED added opaque-`undefined` own-key and suspend→omit tests, which failed 2/8; minimal GREEN passed 8/8; existing normal confirm/omit paths triangulate both fixes; no refactor beyond Prettier was needed.

| Task | Test file | Layer | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- | --- |
| PR 10 correction | `resourceCreation.selectionDraft.test.ts` | Unit | 2 failures / 8 | 8 / 8 passed | existing normal paths; Prettier green |

- **Fix / files:** `confirmSelection` now requires an own active key before identity no-op; `omitSelection` clears suspended state. Changed only the PR 10 pure module, its unit test, and this merged record.
- **Verification:** focused Vitest 8/8; full `pnpm test` 426/426; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Task persistence / remaining:** PR 10 RED, GREEN, and TRIANGULATE/REFACTOR rows remain visibly `[x]`; no task was unchecked. PR 11 is next and remains unchecked.
- **Deviation / rollback:** none; revert only these bucket guard/test changes to restore the prior PR 10 state.
- **Workload / boundary:** PR 10 correction only, no commit or lifecycle action; final candidate is 384 A+D, below 399.

---
## Unit-policy context correction — before PR 11

- **Status / action context:** authoritative `gentle-ai.sdd-status@2` reported `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, all required artifacts present, and no blockers. The repo-local workspace and supplied allowlist were safe; no warnings occurred.
- **Boundary / workload:** corrective Creator/API-adapter input path only; feature-branch-chain correction remains below the 399 A+D limit. No commit, push, PR, review, receipt, backend, styling, unrestricted-list, attribute/evaluation/create, or PR 11 closure work occurred.
- **Implementation:** `ResourceUnitPolicyListInput` and adapter serialization now use exactly `familiaRecursoId`, `paraTipoRecursoId`, `cursor`, and `pageSize` (plus existing `modo`), without direct `tipoRecursoId`. The policy controller now keys requests by explicit Family+Type context, while the flow derives Family from the confirmed hierarchy for deep prefixes and Type confirmation.
- **Task persistence:** no `tasks.md` checkbox was changed as directed; this correction does not complete a task row. Parent-owned lifecycle rows remain untouched.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Effective policy context | `resourcesMasterApi.test.ts`, `resourceCreation.loaders.test.ts`, `crearRecursoSurface.test.tsx` | Unit + flow RTL | 59/59 focused | 6 failures: direct Type serialization, missing controller context method, and mismatched flow arguments | 59/59 focused plus typecheck | Cursor continuation, deep-prefix/confirmed-Type Family use, and same-Type Family replacement reject stale pages | Formatted loader and removed an obsolete hook dependency; focused suite remained 59/59 |

- **Verification:** focused API/loader/flow Vitest 59/59; full `pnpm test` 426/426; `pnpm typecheck`; targeted ESLint; targeted Prettier; and `git diff --check` passed.
- **Files:** `resourcesMaster.types.ts`, `resourcesMaster.api.ts`, `resourceCreation.loaders.ts`, `useResourceCreationFlow.ts`, three focused test files, and this record.
- **Deviation / rollback:** none; revert this adapter/context/test slice to restore the prior direct-Type policy query behavior.

---
## PR 11A — dependent-loader boundary
- **Status:** consumed native OpenSpec `apply: ready`; repo-local allowed root had no warnings.
- **Completed/task artifact:** extracted the generic loader; combined PR 11 rows remain unchecked because browser/closure work is unassigned.
### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE/REFACTOR |
| --- | --- | --- | --- | --- |
| PR 11A boundary | 21/21 focused | Guard failed: loader 649 lines | 22/22 + typecheck | Facade approval and all runtime scans passed |
- **Files:** loader facade, new dependent loader, and architecture guard only.
- **Verification:** focused/full Vitest 22/22 and 427/427; typecheck, targeted ESLint/Prettier, and diff check passed.
- **Deviation:** none; no controller, hydrator, UI, API, or payload semantics changed.
- **Remaining:** the three combined PR 11 closure rows and all parent lifecycle rows remain unchecked/deferred.
- **Workload / rollback:** PR 11A boundary; revert these three files; final diff is 399 A+D including this record.

---
## PR 11B — local hierarchy back navigation and focus restoration
- **Status / action context:** consumed authoritative `gentle-ai.sdd-status@2`: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, and no blockers. Repo-local workspace and parent allowlist were safe without warnings.
- **Boundary / persistence:** source and RTL slice only; PR 11's combined browser/closure task rows remain visibly unchecked, so `tasks.md` was intentionally not changed. Parent-owned lifecycle rows remain untouched.
- **Behavior:** local dialog bubbling handles Escape as `pending → Unidad → Tipo → Familia → Clase → close`, focuses the newly-current selector at every local return, and preserves reducer-authoritative rail navigation without clearing drafts. ArrowLeft has the same non-editing back path only when unmodified, unconsumed, and outside editable content; there is no global listener. Closing from Clase restores the connected trigger or the existing Recursos-sidebar fallback.

### TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 11B local back | 20/20 RTL | 22 tests: 20 passed, 2 failed — after the second Escape the expected Tipo searchbox was absent because the dialog closed; the ArrowLeft guard assertion expected Unidad search focus but the option retained focus | 22/22 focused RTL plus typecheck | Covered each Escape step/focus, editable/defaultPrevented/composing/modified ArrowLeft guards, and disconnected-trigger sidebar fallback; Prettier check stayed green |

- **Verification:** focused RTL 22/22; keyboard/resource-creation architecture 11/11; full `pnpm test` 429/429; `pnpm typecheck`; targeted ESLint and Prettier; `git diff --check` all passed.
- **Files / workload:** `CrearRecursoSurface.tsx`, `crearRecursoSurface.test.tsx`, and this record; source/test A+D is 133 before this concise record, below the 399-line PR boundary. No commit, push, PR, review, receipt, browser fixture, API/backend, styling, dependency, attribute/evaluation/create, or global-listener work occurred.
- **Deviation / rollback:** none; revert the local handler/focus effect and their RTL coverage to restore the prior behavior.

## PR 11C — closure and focus correction
- **Status/action context:** `openspec` authoritative `ready`, strict TDD, repo-local allowlist only, and no warnings; PR11 RED/GREEN/TRIANGULATE rows remain visibly `[x]` after gates.
- **Completed/files:** preserved keyboard/axe closure and corrected only `CrearRecursoSurface.tsx`, `StagedSearchSelector.tsx`, their RTL files, and the existing workstation E2E; no backend, API, style, global listener, or lifecycle change.
- **TDD Cycle Evidence:** safety net 31 RTL passed; RED failed on user-focus stealing and trigger-over-original restoration; GREEN passed 34 RTL; triangulation covered more-page, partial-error, exhaustion, batched readiness, immediate reopen, and valid keyboard opener; Prettier refactor stayed green.
- **Verification:** 60 focused RTL/architecture tests, Playwright 7/7, typecheck, lint, format check, build, and `git diff --check` passed; build had only existing Rollup/Zod comments and >500 kB chunk warnings.
- **Deviation/remaining/workload:** none; PR12–15 exact unchecked backend-gated rows remain unchanged; rollback only these local focus tests/effects; final candidate is below 399 A+D, with no commit or parent action.

---

## Contract acceptance documentation reconciliation

- **State:** complete for the documentation-only contract-acceptance slice; no runtime implementation was performed.
- **Structured status:** reconstructed authoritative OpenSpec status after `gentle-ai sdd status --change keyboard-first-resource-creation --json` was unavailable in this checkout. Proposal, nested spec, design, tasks, and prior progress were present; implementation-owned tasks remain incomplete, so `applyState: ready` and `nextRecommended: apply` remain unchanged.
- **Action context:** `repo-local` at `/home/garfex/PROGRAMACION/sistema-ui-garfex`; the two normative-document edits are within the supplied workspace and documentation scope. No unsafe-root warning occurred.
- **Workload / PR boundary:** delegated documentation-only reconciliation; 110 A+D across proposal and nested spec, below the 399 limit. No commit, branch, PR, review, receipt, code, or test change was attempted.

### Reconciled contract

- Replaced the obsolete unavailable-backend premise with the accepted backend baseline `23e9440c2b832edb8e557134018ea812979c6452` and its four public operations.
- Recorded the exact `modoCaptura: SELECCION | LIBRE` union, selection-only input, absent omissions, hierarchy/Unit IDs, ownership union, published disposition union, and the distinction between Convex transport failures and application return values.
- Removed `DERIVADO` and obsolete backend-unavailability contradictions from the two edited documents.

### Persisted task state and verification

- No implementation-owned task was completed by this documentation-only slice; `tasks.md` was intentionally not modified, and parent-owned rows remain byte-for-byte deferred.
- Exact backend comparison used `_generated/api.d.ts`, `catalogoAdmin/atributos.ts`, `catalogoAdmin/recursos.ts`, `catalogoAdmin/resourceValidators.ts`, and `contract-tests/resource-admin-consumer.ts` at backend commit `23e9440c2b832edb8e557134018ea812979c6452`.
- `pnpm exec prettier --check openspec/changes/keyboard-first-resource-creation/proposal.md openspec/changes/keyboard-first-resource-creation/specs/keyboard-first-resource-creation/spec.md` — passed after scoped formatting.
- `git diff --check` — passed; targeted contradiction grep found zero `DERIVADO` or obsolete backend-unavailability matches.

### Remaining tasks, deviations, and rollback

- Remaining implementation tasks are unchanged, beginning with the persisted PR 12 `- [ ] **RED:** Write failing parser tests from the published exact DTO fixtures for all evaluator statuses, values, issues, fingerprint, and malformed/unknown response rejection. <!-- sdd-owner: implementation -->`.
- **Deviation:** no design or task artifact was edited; the user-requested documentation boundary was retained apart from this mandatory cumulative progress record.
- **Rollback:** revert only the contract wording in `proposal.md` and the nested normative `spec.md`; no runtime behavior or task state changes.

---

## Accepted backend-v1 baseline reconciliation

- **State / structured status:** documentation-only delegated slice complete. Consumed native `gentle-ai.sdd-status@2`: `artifactStore: openspec`, proposal/spec/design/tasks/apply-progress present, `applyState: ready`, `nextRecommended: apply`, no blockers; 35/52 implementation rows complete and 17 remain pending.
- **Action context:** `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`; edits stayed inside the three supplied documentation surfaces. No action-context warning occurred.
- **Workload / boundary:** documentation-only baseline reconciliation below the 399 cap. No code, tests, task checkbox, commit, branch, PR, review, receipt, or backend edit was attempted.

### Completed documentation work

- Re-read accepted backend `23e9440c2b832edb8e557134018ea812979c6452` through CodeGraph: `convex/catalogoAdmin/{atributos.ts,recursos.ts,resourceValidators.ts}` and domain evaluation/assignment-ordering sources.
- Updated only `design.md` and `design-details.md` with four public paths, nullable/optional semantics, paginated allowed values, shared selection input, evaluation/create unions, catalog-only fingerprint, and authoritative reconciliation.
- Removed unsupported `DERIVADO` and corrected “contract unavailable” wording while preserving the frontend-pending boundary.

### Verification and remaining work

- Ran backend commit/source comparison, targeted contradiction grep, `git diff --check`, and `git diff --numstat`; no runtime test applies to documentation-only work. `pnpm exec prettier --check` remains nonzero for these three files, as it also does for their HEAD versions; no broad formatting rewrite was applied.
- No implementation-owned task was completed, so `tasks.md` remains unchanged; persisted PR 12 RED remains `- [ ] **RED:** Write failing parser tests from the published exact DTO fixtures for all evaluator statuses, values, issues, fingerprint, and malformed/unknown response rejection. <!-- sdd-owner: implementation -->`.
- **Deviation / rollback:** no deviation; revert only this section and the two design documents to remove the reconciliation.

---

## Backend-v1 gate acceptance and PR 12 readiness

- **State / structured status:** native `gentle-ai.sdd-status@2` is authoritative for `openspec`: `applyState: ready`, `nextRecommended: apply`, all required artifacts present, and no blockers. It reports 35/52 checked across all ownership rows; exact ownership reconciliation is **35/47 implementation rows complete, 12 unchecked**, plus **0/5 parent rows complete, 5 unchecked**.
- **Action context:** `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`; both edits stayed inside the parent-provided documentation allowlist. No action-context warning occurred.
- **Accepted gate authority:** backend `23e9440c2b832edb8e557134018ea812979c6452`; generated `convex/_generated/api.d.ts`; sources `convex/catalogoAdmin/{atributos.ts,recursos.ts,resourceValidators.ts}`; consumer `contract-tests/resource-admin-consumer.ts`; and the four published `api.catalogoAdmin` operations recorded in `tasks.md`. Ordinary Convex transport failures remain outside a typed application-return union.
- **PR 11 evidence retained:** PR 11C records 60 focused RTL/architecture tests, Playwright 7/7, typecheck, lint, format check, build, and `git diff --check` as passed; no PR 11 evidence was rerun or rewritten by this documentation-only reconciliation.
- **Persisted task state:** no checkbox changed. PR 12–15 remain visibly unchecked implementation work; parent row 185 remains unchecked because the remaining parent action is explicit delivery authorization of PR 12 RED, not a claim that this slice independently verified backend repository cleanliness.
- **Workload / boundary:** documentation-only readiness reconciliation for PR 12–15; no implementation, test, backend, proposal, spec, design, commit, PR, review, or receipt action. Next implementation action: PR 12 RED only.
- **Verification:** `git diff --check`, ownership/checkbox reconciliation, and targeted readiness-token grep passed. `pnpm exec prettier --check` exits 1 for both current and HEAD versions of these two files, so existing format debt was not broadly rewritten; no runtime test applies to this documentation-only slice.
- **Parent authorization:** after independently confirming clean backend authority `23e9440c2b832edb8e557134018ea812979c6452`, the reconciled artifacts, PR 11 closure, and the user-directed local-only continuation, the parent authorized only the PR 12 RED work unit. Push, PR, merge, release, and backend edits remain unauthorized.


---

## PR 12 split — documentation-only replanning

- **State / structured status:** consumed authoritative native `gentle-ai.sdd-status@2`: `artifactStore: openspec`, proposal/spec/design/tasks/apply-progress present, `applyState: ready`, `nextRecommended: apply`, and no blocked reasons.
- **Action context:** `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`; both edits are within the parent-provided allowed surfaces. No unsafe-root warning occurred.
- **Workload / PR boundary:** authorized `auto-chain` / `feature-branch-chain`; PR 12 is honestly split into `PR 12A → PR 12B → PR 12C`, each independently GREEN at 200–390 projected A+D. This documentation-only slice measures 93 A+D, below 399. PR 13 depends on PR 12C; PR 14 exclusively retains create input/result parsing, mutation, and UI; PR 15 remains after PR 14. The existing parent authorization now starts strict PR 12A RED only and explicitly does not authorize a failing branch or commit.
- **Completed tasks / checkbox updates:** none. No source or test changed, no TDD cycle ran, and all new implementation rows remain visibly unchecked; `tasks.md` preserves completed history and parent-owned rows.
- **Files changed:** `openspec/changes/keyboard-first-resource-creation/tasks.md`; `openspec/changes/keyboard-first-resource-creation/apply-progress.md`.
- **Verification:** native status, ownership/count reconciliation, dependency-chain review, and `git diff --check` passed. No runtime test applies to this documentation-only slice. Targeted Prettier check reports existing debt in both current and `HEAD` versions of these two files; no broad formatting rewrite was made.
### TDD Cycle Evidence

| Work unit | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| Documentation-only PR 12 split | N/A — no implementation task started | N/A — no production code | N/A — no test behavior changed | N/A — no code refactor |
- **Deviation / rollback:** no design deviation. Revert only this planning split and progress entry to restore the prior PR 12 plan.

## Remaining implementation tasks

All 18 implementation-owned rows remain unchecked; the exact persisted lines are:

```text
- [ ] **RED:** Add failing exact-fixture tests for nullable definition, optional fields omitted rather than nulled, `modoCaptura: SELECCION | LIBRE`, paginated typed allowed values, and malformed/unknown definition or page rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only definition and allowed-values Zod schemas/parsers plus their `ResourceOperation`, `ResourceTransport`, and `ResourcesMasterApi` query-adapter mappings; do not add evaluator or create behavior. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove optional-field absence, each typed allowed value, pagination continuation, and malformed transport rejection through the focused command; retain no evaluator/create test or production path. <!-- sdd-owner: implementation -->
- [ ] **RED:** Add failing exact-fixture tests for `INCOMPLETE | VALID | INVALID`, `valid` consistency, nullable generated identity, resolved assignments, 13 issue codes, fingerprint, and malformed/unknown evaluation rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only the exact evaluation Zod schema/parser and its `ResourceOperation`, `ResourceTransport`, and `ResourcesMasterApi` query-adapter mapping; do not adopt evaluation into the model or add create behavior. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove each status, absent selected value, unknown disposition/issue rejection, and transport rejection fail closed through the focused command; retain no lease/create/UI path. <!-- sdd-owner: implementation -->
- [ ] **RED:** Add failing lease/model/architecture tests for current-token adoption, stale or out-of-order token rejection, hierarchy/Unidad context mismatch, draft-revision mismatch, and no create path before PR 14. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement the pure feature-local `evaluationLease` and minimum model seam so only a current validated PR 12B evaluation can be adopted and every hierarchy, Unidad, or draft mutation clears the lease/fingerprint. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove replacement Unidad, same revision with old context, malformed-adapter absence, and transport rejection cannot retain a lease or enable review/create; run the focused command and preserve the no-create architecture guard. <!-- sdd-owner: implementation -->
- [ ] **RED:** Write failing tests using only exact DTO fixtures for ordering by assignment ID, `modoCaptura: SELECCION` typed-value confirmation, authorized **Omitir** for `OPTIONAL`, `LIBRE` unsupported, `REQUIRED | OPTIONAL | FORBIDDEN | NOT_APPLICABLE`, active→suspended, valid restore, and invalid retained selection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render one selection-only assignment at a time from validated `aplicabilidadResuelta`/`selectedValueId` facts, label the rail `Atributos · n de total`, and reconcile buckets without parsing or simplifying `CONDITIONAL`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a changed authoritative sequence preserves the current pending assignment when possible and never sends suspended values, then run and record the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** Write failing exact-fixture tests for `INCOMPLETE | VALID | INVALID` rendering, evaluation invalidation on every selection mutation, required `expectedCatalogFingerprint`, active selection IDs only, `CREATED | CATALOG_CHANGED | INCOMPLETE | INVALID`, stale/unknown disposition handling, and confirmed-success-only behavior. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render generated `nombre`, `identificadorTecnico`, assignments, and issues exclusively from validated evaluation output; call `crearRecursoDesdeSelecciones` only with a current `expectedCatalogFingerprint` and represent only published dispositions. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a concurrent, stale, unknown, or transport-rejected response never presents success or calls `onCreated`; run the focused command and record its exact result. <!-- sdd-owner: implementation -->
- [ ] **RED:** Add failing keyboard-only and axe cases for `modoCaptura: SELECCION` allowed-value selection, `OPTIONAL` omission, authoritative `INCOMPLETE | INVALID | VALID` review, fingerprinted create, and non-confirming stale/unknown/transport rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->
```

## Deferred parent-owned lifecycle actions

- Tracker, chain targeting, bounded review, verification, sync, and archive remain parent-owned; their task rows were preserved byte-for-byte.

---

## PR 12A — Definition and allowed-value query contracts

- **Status:** manual structured status produced after parent context omitted native JSON: `artifactStore: openspec`; proposal, nested spec, design, tasks, and prior progress present; pre-apply `ready`; repo-local allowed surfaces only; no warnings. CodeGraph MCP was unavailable after the existing index check, so source reads were used.
- **Boundary:** authorized `auto-chain` / feature-branch-chain `… → PR 11 → 📍 PR 12A`; no evaluator, create, lease, UI, legacy option adapter, backend, dependency, commit, review, or lifecycle work.
- **Completed / persisted:** PR 12A RED, GREEN, and TRIANGULATE/REFACTOR rows are visibly `[x]` in `tasks.md`.
- **Files:** `resourcesMaster.types.ts`, `resourcesMaster.api.ts`, `resourcesMasterApi.test.ts`, tasks, and this progress record.
- **Behavior:** exact Zod definition and allowed-value schemas reject unknown capture modes/kinds, null optionals, malformed fields, and malformed envelopes; the adapter sends only supplied `{ definicionAtributoId, cursor?, pageSize?, modo? }` fields to `catalogoAdmin/atributos:listarValoresPermitidosAtributo` and propagates transport rejection.

### TDD Cycle Evidence

| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 12A contracts | API baseline 23/23 | 3 failures: missing capture mode, parser, and adapter | 26/26 plus typecheck | All four typed variants, optional absence, null/malformed rejection, cursor/page/mode, transport rejection; dead parser imports removed and focused suite remained 31/31 |

- **Verification:** focused API + architecture 31/31; full `pnpm test` 38 files / 435 tests; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Workload / rollback:** current source/test A+D is 330 before this concise progress/tasks update, below 399; rollback removes only these schemas/types/mapping/tests. No compatibility compromise: `ResourceAttributeDefinition.revision` is intentionally tightened from `unknown` to `number` per published contract.
- **Remaining:** the prior “18 unchecked” count is superseded; PR 12B begins with these persisted unchecked rows:
  - `- [ ] **RED:** Add failing exact-fixture tests for \`INCOMPLETE | VALID | INVALID\`, \`valid\` consistency, nullable generated identity, resolved assignments, 13 issue codes, fingerprint, and malformed/unknown evaluation rejection. <!-- sdd-owner: implementation -->`
  - `- [ ] **GREEN:** Add only the exact evaluation Zod schema/parser and its \`ResourceOperation\`, \`ResourceTransport\`, and \`ResourcesMasterApi\` query-adapter mapping; do not adopt evaluation into the model or add create behavior. <!-- sdd-owner: implementation -->`
  - `- [ ] **TRIANGULATE/REFACTOR:** Prove each status, absent selected value, unknown disposition/issue rejection, and transport rejection fail closed through the focused command; retain no lease/create/UI path. <!-- sdd-owner: implementation -->`
---
## PR 12A exact-ID correction
- **Correction:** `attributeContractIdSchema` now accepts only non-empty strings, closing its prior non-string acceptance.
- **TDD:** the focused malformed-ID boundary test RED-failed before the one-line schema GREEN correction; adapter malformed-ID coverage passed.
- **Verification:** focused 27/27; full `pnpm test` 38 files / 436 tests; typecheck, lint, format check, and `git diff --check` passed.
- **Workload:** candidate remains exactly 399 A+D; no task checkbox, commit, review, or lifecycle action changed.
## PR 12B — budget stop
| State | Evidence |
| --- | --- |
| Blocked | Native `openspec` status was `apply: ready`; repo-local allowed roots were safe; strict-TDD safety net passed 32/32; RED failed 3 evaluator parser/adapter assertions; GREEN passed API 30/30 plus typecheck; the exact parser/adapter trial reached 391 source/test A+D before progress and was reverted rather than leave an over-budget, unformatted work unit. |
- **Required decision:** authorize a cohesive PR 12B split before a fresh apply; no checkbox was changed because the aggregate PR 12B rows are not persistably complete.
- `- [ ] **RED:** Add failing exact-fixture tests for \`INCOMPLETE | VALID | INVALID\`, \`valid\` consistency, nullable generated identity, resolved assignments, 13 issue codes, fingerprint, and malformed/unknown evaluation rejection. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Add only the exact evaluation Zod schema/parser and its \`ResourceOperation\`, \`ResourceTransport\`, and \`ResourcesMasterApi\` query-adapter mapping; do not adopt evaluation into the model or add create behavior. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Prove each status, absent selected value, unknown disposition/issue rejection, and transport rejection fail closed through the focused command; retain no lease/create/UI path. <!-- sdd-owner: implementation -->`

---
## PR 12B1 — Exact evaluation response types and parser

- **Status / action context:** consumed authoritative native OpenSpec status `apply: ready`, `nextRecommended: apply`, and repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`; all edits stayed in supplied roots with no warnings.
- **Boundary / workload:** auto-chain feature-branch-chain `… → PR 12A → 📍 PR 12B1 → PR 12B2 → PR 12C`; final work-unit diff is recorded below 399 A+D. No request input, API method, operation, transport, factory mapping, lease, create, or UI was added.
- **Completed / persisted:** the three PR 12B1 implementation rows are visibly `[x]` in `tasks.md`; the new PR 12B2 rows remain unchecked. Parent-owned lifecycle rows were untouched.
- **Files:** `resourcesMaster.types.ts`, `resourcesMaster.api.ts`, `resourcesMasterApi.test.ts`, `tasks.md`, and this cumulative progress record.

### TDD Cycle Evidence

| Task | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| PR 12B1 parser | API/architecture 32/32 | 5 parser tests failed because the export was absent | API 32/32 plus typecheck | All statuses, 13 codes, strict nested/top-level rejection, primitives, nullable identity, and validity relation; Prettier rerun with API/architecture 37/37 |

- **Verification:** focused API/architecture 37/37; `pnpm test` 38 files / 441 tests; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Deviation / rollback:** none; rollback removes only the public response types, parser schemas, and exact fixtures. Runtime is N/A because this is a pure parser.
- **Retained blocker evidence:** the preceding PR 12B aggregate-trial budget-stop record remains intact; B1 is its one authorized cohesive split, while B2 alone owns the deferred query adapter.
- **Remaining:** `- [ ] **RED:** Add failing exact query-adapter invocation and transport-rejection tests. <!-- sdd-owner: implementation -->`; `- [ ] **GREEN:** Add only the published evaluation query input, API method, operation, transport, and factory mapping through the PR 12B1 parser. <!-- sdd-owner: implementation -->`; `- [ ] **TRIANGULATE/REFACTOR:** Prove supplied request fields, malformed response rejection, and transport rejection through the focused command. <!-- sdd-owner: implementation -->`

---

## PR 12B2 — Evaluation query adapter

### Status

- **State:** completed for parent-delegated PR 12B2 only. The local `gentle-ai sdd` command is unavailable, so this run reconstructed the authoritative OpenSpec status after directly reading proposal, nested spec, design, tasks, prior progress, and `openspec/config.yaml`.
- **Structured status:** `schemaName: spec-driven`; `changeName: keyboard-first-resource-creation`; `artifactStore: openspec`; proposal/spec/design/tasks/apply-progress present; pre-apply `applyState: ready`; `nextRecommended: apply`; `actionContext.mode: repo-local`; workspace and allowed edit root `/home/garfex/PROGRAMACION/sistema-ui-garfex`; no warnings.
- **Workload / PR boundary:** authorized `auto-chain` / `feature-branch-chain`, `… → PR 12A → PR 12B1 → 📍 PR 12B2`; final change is below the 399 A+D cap. No commit, branch, PR, review, receipt, UI, model, lease, create, or lifecycle action was performed.

### Completed tasks and persisted checkbox updates

- [x] PR 12B2 RED — persisted the exact invocation and transport-rejection test task.
- [x] PR 12B2 GREEN — persisted the exact request type, query adapter, transport, and Convex factory mapping task.
- [x] PR 12B2 TRIANGULATE/REFACTOR — persisted parser-adoption, malformed-response, request-validation, and transport evidence task.

### Implementation

- Added strict public `ResourceCreationEvaluationInput` request contracts with non-empty string hierarchy/unit IDs, exact selection entries, and exact GLOBAL/ORGANIZATION ownership variants.
- Added `evaluateResourceCreation` through `catalogoAdmin/recursos:evaluarCreacionDesdeSelecciones`, the query FunctionReference, Convex query switch, and existing `parseResourceCreationEvaluation` response parser.
- Strict request validation preserves selection order and duplicates, rejects malformed or extra/manual request fields before transport, and propagates ordinary transport errors unchanged.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 12B2 adapter | `tests/unit/resourcesMasterApi.test.ts` | Unit | 37/37 focused API/architecture tests passed | Exact GLOBAL evaluation call failed because `evaluateResourceCreation` did not exist | Added the strict request schema, adapter, query mapping, and parser adoption; API test passed 33/33 and typecheck passed | Added exact ORGANIZATION call, duplicate/order preservation, malformed response, transport rejection, and zero-transport malformed-input cases; API test passed 36/36 | Prettier formatted the bounded files; focused API/architecture suite passed 41/41 |

### Verification

- `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts tests/architecture/queryZodBoundaries.test.ts` — passed 41/41.
- `pnpm test` — passed 38 files and 445 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` — passed.
- **Runtime:** N/A; this is a pure query-adapter contract consumed by PR 12C.

### Files, deviation, rollback, and remaining work

- **Files:** `resourcesMaster.types.ts`, `resourcesMaster.api.ts`, `resourcesMasterApi.test.ts`, `tasks.md`, and this cumulative progress record.
- **Deviation:** none; no response parser, model, lease, UI, mutation/create, or legacy behavior changed.
- **Rollback:** remove only the evaluation request types, strict request schema, query mapping, adapter method, and matching tests.
- Remaining implementation-owned tasks begin at PR 12C:
  - `- [ ] **RED:** Add failing lease/model/architecture tests for current-token adoption, stale or out-of-order token rejection, hierarchy/Unidad context mismatch, draft-revision mismatch, and no create path before PR 14. <!-- sdd-owner: implementation -->`
  - `- [ ] **GREEN:** Implement the pure feature-local \`evaluationLease\` and minimum model seam so only a current validated PR 12B evaluation can be adopted and every hierarchy, Unidad, or draft mutation clears the lease/fingerprint. <!-- sdd-owner: implementation -->`
  - `- [ ] **TRIANGULATE/REFACTOR:** Prove replacement Unidad, same revision with old context, malformed-adapter absence, and transport rejection cannot retain a lease or enable review/create; run the focused command and preserve the no-create architecture guard. <!-- sdd-owner: implementation -->`
- Parent-owned tracker, chain, review, verification, sync, and archive lines remain deferred byte-for-byte.

---

## PR 12C — Pure stale-safe authoritative evaluation lease

- **Status / action context:** consumed authoritative native `gentle-ai.sdd-status@2`: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, all required artifacts present, no blockers. `repo-local` workspace and allowed root were `/home/garfex/PROGRAMACION/sistema-ui-garfex`; all edits stayed within the delegated surfaces and no warnings occurred.
- **Boundary / workload:** authorized `auto-chain` / `feature-branch-chain`, `… → PR 12A → PR 12B1 → PR 12B2 → 📍 PR 12C`; current work unit is 391 A+D including tests, task checkboxes, and progress, below the hard 399 cap. Pure/model only: no React, API/transport call, create, reconciliation, UI, commit, review, receipt, or lifecycle work was performed.
- **Completed / persisted:** PR 12C RED, GREEN, and TRIANGULATE/REFACTOR rows are visibly `[x]` in `tasks.md`; parent-owned rows remain byte-for-byte deferred.
- **Implementation:** added the immutable `ResourceCreationEvaluationLease` and opaque request-token seam. Capture requires non-empty exact string Class/Family/Type/Unit IDs; incomplete or opaque-ID contexts leave the state/token unchanged, and `resourceIdKey` remains the pure `String` conversion. Adoption accepts only a current token, open generation, revision, and all four identity keys, then atomically stores the parsed evaluation and fingerprint without changing stage, buckets, or revision. `OPEN` increments `openGeneration` and clears state; effective hierarchy/Unit mutations clear the token and the existing draft invalidation clears evaluation/fingerprint.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| PR 12C lease/model | `resourceCreation.evaluationLease.test.ts`, `resourceCreation.model.test.ts`, `resourceCreationBoundaries.test.ts` | Unit + architecture | Initial 28/28; correction 36/36 passed | New lease import and runtime-inventory file both failed resolution; correction RED failed two pure-ID assertions | Focused lease/model/architecture suite passed 35/35, then correction GREEN passed 36/36 and typecheck | Added repeated-OPEN generation proof; current, stale/out-of-order, reopened, hierarchy/Unit, revision, incomplete or opaque-ID contexts, INVALID, and INCOMPLETE cases passed 36/36; Prettier refactor rerun stayed green |

### Verification

- Focused: `pnpm exec vitest run tests/unit/resourceCreation.evaluationLease.test.ts tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts` — 36/36 passed.
- Full: `pnpm test` — 39 files, 453 tests passed; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- **Runtime:** N/A — this is an intentionally pure lease/model seam with no runtime boundary until PR 13/14.
- **Deviation / rollback:** none. Roll back only the lease module, model seam, focused tests, boundary inventory, and these task/progress updates.

### Remaining implementation tasks

- `- [ ] **RED:** Write failing tests using only exact DTO fixtures for ordering by assignment ID, \`modoCaptura: SELECCION\` typed-value confirmation, authorized **Omitir** for \`OPTIONAL\`, \`LIBRE\` unsupported, \`REQUIRED | OPTIONAL | FORBIDDEN | NOT_APPLICABLE\`, active→suspended, valid restore, and invalid retained selection. <!-- sdd-owner: implementation -->`
- `- [ ] **GREEN:** Render one selection-only assignment at a time from validated \`aplicabilidadResuelta\`/\`selectedValueId\` facts, label the rail \`Atributos · n de total\`, and reconcile buckets without parsing or simplifying \`CONDITIONAL\`. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Prove a changed authoritative sequence preserves the current pending assignment when possible and never sends suspended values, then run and record the focused command. <!-- sdd-owner: implementation -->`
- PR 14 and PR 15 implementation rows remain visibly unchecked and are deferred to their chain-owned slices; parent-owned tracker, review, verification, sync, and archive rows remain unchanged.

---

## PR 13 split and ownership-source stop gate — planning documentation

- **Status / action context:** consumed authoritative native `gentle-ai.sdd-status@2`: `artifactStore: openspec`, `applyState: ready`, `nextRecommended: apply`, all required artifacts present, no blockers; `repo-local` workspace and allowed root are `/home/garfex/PROGRAMACION/sistema-ui-garfex`, with no warnings.
- **Completed / persisted:** no implementation task completed and no implementation checkbox changed. The PR 12A/12B1/12B2/12C checkboxes and prior history remain unchanged; this documentation update adds one unchecked parent-owned ownership-source gate.
- **Plan:** replaces monolithic PR 13 with PR 13A pure authoritative sequence/bucket reconciliation, PR 13B reducer-owned selection mutations/invalidation, PR 13C lease-safe driver, and PR 13D one-at-a-time selection UI. PR 13A/13B are ready in the feature-branch chain; PR 13C/13D are unavailable until product identifies the explicit ownership source passed to Creador. No `GLOBAL` default or invented organization ID is permitted.
- **Workload / boundary:** `auto-chain` / `feature-branch-chain`; 20 implementation children total and 6 remaining. PR 13A 220–330, PR 13B 240–360, PR 13C 260–390, and PR 13D 280–390 A+D; PR 14 now depends on PR 13D and PR 15 remains after PR 14. Documentation-only candidate: 94 A+D (79 additions, 15 deletions), below 399.
- **Files changed:** `openspec/changes/keyboard-first-resource-creation/tasks.md`; `openspec/changes/keyboard-first-resource-creation/apply-progress.md`.
- **TDD / verification:** N/A for planning documentation; no production code or tests changed or ran. Pre-edit `pnpm format:check` passed; post-edit formatting, diff, ownership/count, and default-ownership scans are recorded below.
- **Deviation:** none. The parent authorization for PR 12A is preserved and does not authorize PR 13C/13D.
- **Deferred parent lifecycle action:** identify and record the explicit product-owned ownership source before PR 13C/13D; tracker, review, verification, sync, and archive remain parent-owned.

### Remaining implementation tasks

```text
- [ ] **RED:** Add exact-fixture reconciliation tests proving backend assignment order is retained without a local sort; assignment-ID keys prevent definition/index collisions; `FORBIDDEN | NOT_APPLICABLE` moves active → suspended; and active retention requires matching `selectedValueId`. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement pure authoritative sequence/bucket reconciliation: restore suspended only with an active-and-effective allowed-value fact, retain absent/not-yet-exhausted validity as unknown and suspended, preserve `OPTIONAL` omission, and make omitted → `REQUIRED` pending. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover reordered authoritative sequences, exhausted versus non-exhausted allowed-value absence, invalid retained values, and current-pending-assignment retention; run and record the focused command without sending suspended values. <!-- sdd-owner: implementation -->
- [ ] **RED:** Add failing reducer tests for confirm, omit, reconcile, and restore events; effective changes increment revision and clear evaluation, fingerprint, and request token through one seam, while no-ops remain stable. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement reducer-owned confirm/omit/reconcile/restore events using the single invalidation seam; preserve existing hierarchy and Unidad mutation semantics and do not issue evaluation requests from the reducer. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate confirmations, repeated omissions, unchanged reconciliation, valid restoration, hierarchy replacement, and Unidad replacement have the prescribed stable or invalidating result; run and record the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** After the ownership source is explicitly supplied, add failing driver tests for no request before Unit/source, evaluation after Unit or an effective selection mutation, lease-token stale rejection, and transport failure without adopting facts. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add the separate lease-safe evaluation driver hook; capture ownership, context, revision, and token; request only after Unit/mutations; and route validated facts through PR 13A reconciliation without loops. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove out-of-order responses, stale context/revision, transport retry, and reconciliation-caused state changes neither re-adopt stale facts nor create evaluation loops; run and record the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** After the ownership source is explicitly supplied, add failing RTL tests for one assignment at a time, definition and allowed-value paging, `modoCaptura: SELECCION` confirmation, `LIBRE` unsupported presentation, and `Atributos · n de total`. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render only the current authoritative assignment with selection-only allowed values, optional **Omitir**, visible `Atributos · n de total`, and no free-value editor or simultaneous assignment controls. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover required/optional pending transitions, suspended values remaining absent from requests, sequence changes retaining the pending assignment when possible, and terminal pending review before PR 14; run and record the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** Write failing exact-fixture tests for `INCOMPLETE | VALID | INVALID` rendering, evaluation invalidation on every selection mutation, required `expectedCatalogFingerprint`, active selection IDs only, `CREATED | CATALOG_CHANGED | INCOMPLETE | INVALID`, stale/unknown disposition handling, and confirmed-success-only behavior. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render generated `nombre`, `identificadorTecnico`, assignments, and issues exclusively from validated evaluation output; call `crearRecursoDesdeSelecciones` only with a current `expectedCatalogFingerprint` and represent only published dispositions. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a concurrent, stale, unknown, or transport-rejected response never presents success or calls `onCreated`; run the focused command and record its exact result. <!-- sdd-owner: implementation -->
- [ ] **RED:** Add failing keyboard-only and axe cases for `modoCaptura: SELECCION` allowed-value selection, `OPTIONAL` omission, authoritative `INCOMPLETE | INVALID | VALID` review, fingerprinted create, and non-confirming stale/unknown/transport rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->
```

---

## PR 13A — authoritative sequence and bucket reconciliation

- **State:** completed pure work unit; no transport, React, reducer, API, or create path changed.
- **TDD:** RED `pnpm exec vitest run tests/unit/resourceCreation.attributeSequence.test.ts` failed because the new module was absent; GREEN/TRIANGULATE `pnpm exec vitest run tests/unit/resourceCreation.attributeSequence.test.ts tests/unit/resourceCreation.selectionDraft.test.ts && pnpm typecheck` passed 13/13 and typecheck.
- **Behavior:** backend order is filtered to required/optional without sorting; assignment-ID buckets reconcile active/suspended/omitted selections and retain the current pending assignment when still pending. Suspended values are excluded by the existing active-only projection.
- **Files:** `resourceCreation.attributeSequence.ts`, `resourceCreation.selectionDraft.ts`, their unit tests, and these PR 13A task/progress updates.
- **Rollback:** remove the pure reconciliation module, stable omission helper, focused tests, and this PR 13A documentation entry.

---

## PR 13B — reducer selection invalidation

- **State:** completed; confirm, omit, reconciliation, and exact restore are reducer-owned through one authority invalidation seam.
- **TDD:** RED focused suite failed 4 assertions (unknown reducer events and unsafe restore); GREEN/TRIANGULATE passed 48/48, full 461/461, typecheck, and lint.
- **Behavior:** effective changes clear evaluation, fingerprint, and request token and increment once; duplicate, repeated, identical, missing, and mismatched events retain state identity. Hierarchy replacement resets buckets; Unidad replacement preserves them while invalidating authority.
- **Rollback:** remove the PR 13B reducer events, exact restore guard, focused tests, and these task/progress updates.

---

## PR 13C0 — required creation-ownership seam

- **State:** completed; `ResourcesMasterEntry` is the composition host and explicitly supplies `creationOwnership: ResourceCreationEvaluationOwnership | null = null` without changing the route.
- **Behavior:** Screen requires and forwards `creationOwnership`; Creador requires `ownership`. Null ownership blocks continuation with ownership-specific copy, while a present ownership value reports pending evaluation integration. No evaluation request, driver, reconciliation, review, create behavior, `GLOBAL` default, or invented organization ID was added.
- **TDD:** RED `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` failed 1/25 because the old pending copy said the backend-v1 contract was required. GREEN focused surface/screen/refetch/architecture tests passed 47/47; `pnpm typecheck` passed.
- **Tasks:** split PR 13C into completed 13C0 and ready 13C1; the driver is implementable with explicit fixtures but remains runtime-gated while Entry passes null. The forecast is 22 child slices total with 4 remaining. Only the three 13C0 rows and the parent ownership-seam row were checked.
- **Files:** `ResourcesMasterEntry.tsx`, `ResourcesMasterScreen.tsx`, `CrearRecursoSurface.tsx`, `ResourceCreationContractPending.tsx`, focused surface/screen/refetch tests, `tasks.md`, and this progress record.
- **Rollback:** remove only the ownership prop seam, pending-copy distinction, focused tests, and these PR 13C0 documentation updates; retain PRs 13A–13B.

---

## PR 13C1a — ownership-aware evaluation authority and request

- **State:** completed pure work unit; no API call, hook, React, UI, or create path changed.
- **TDD:** RED focused request/lease/model/architecture suite failed on the missing request module and ownership authority assertions; GREEN passed 47/47.
- **Behavior:** exact active-only request projection accepts only complete string context and valid GLOBAL/ORGANIZATION ownership. Leases and state bind normalized ownership identity; a different capture clears evaluation/fingerprint immediately, while a same-ownership retry retains them. Null authority clearing is stable and stale leases cannot adopt.
- **Tasks:** split former PR 13C1 into completed 13C1a and ready 13C1b; PR 13D depends on 13C1b. Forecast is 23 child slices total with 4 remaining; only the three 13C1a rows were checked.
- **Files:** `resourceCreation.evaluationRequest.ts`, lease/model authority seams, focused request/lease tests, runtime inventory, `tasks.md`, and this record.
- **Rollback:** remove the request module and ownership-authority additions only; retain PRs 13A–13C0.

---
## PR 13C1b1a — evaluation hook core
- **State:** completed after the user-authorized split of the formatted 446-A+D trial; this child is bounded below 399 and remediates its failed evidence.
- **TDD:** missing-hook RED; focused core proves null clearing, exact Unit request/current adoption, and old-response rejection after selection revision.
- **Boundary:** unintegrated TanStack Query hook plus query/runtime guards only; reconciliation/retry tests and flow integration remain PR 13C1b1b/13C1b2.

---

## PR 13C1b1b — evaluation reconciliation and retry proof

- **State:** completed characterization slice; production hook required no change.
- **Evidence:** 6/6 hook cases prove FORBIDDEN/NOT_APPLICABLE suspension, one active-free replacement request, stable final adoption, transport error plus explicit retry, and identical-context reopen cache isolation.
- **Boundary:** only focused tests and these task/progress updates; flow integration remains PR 13C1b2.

---

## PR 13C1b2 — flow integration

- **State:** completed. `useResourceCreationFlow` requires nullable ownership, invokes the evaluation driver once unconditionally, and exposes evaluation status/retry without a manual fetch or stage change.
- **Evidence:** strict RED failed for missing status/flow ownership integration; GREEN/TRIANGULATE focused hook, surface, and architecture tests passed 41/41. Explicit GLOBAL/ORGANIZATION and null surface ownership reach the driver; null remains request-blocked.
- **Boundary:** superseded by the bounded PR 13D0–13D5 expansion below.

---

## PR 13D0 — flow selector-state helper boundary

- **State:** completed mechanical extraction; `selectorLoadState`, `unitSelectorLoadState`, and `useControllerState` now live in feature-local `resourceCreation.selectorState.ts`, while the flow imports them unchanged and remains below 440 lines.
- **TDD/evidence:** RED focused selector-state/architecture run failed because the module was absent; GREEN/TRIANGULATE passed 10/10, covering status mapping, Unit precedence, and flow wiring.
- **Replan:** former PR 13D is bounded as 13D0 complete plus 13D1 context extraction, 13D2 definition/value driver, 13D3 reducer stages/Back chain, 13D4 presenter/rail/commands, and 13D5 integration. Seven slices remain including PR 14 and PR 15; forecast 1,960–2,735 A+D across 30 total child slices. Product decisions: `INVALID` with assignments permits correction but blocks completion; `OPTIONAL` `LIBRE` may be omitted; the counter is the current pending position.
- **Rollback:** restore the three helpers to the flow and remove only the selector-state module/proof; no user behavior changed.

---

## PR 13D1 — context-stage extraction

- **State:** completed; `ResourceCreationContextStage` owns only the existing mounted/hidden Clase, Familia, Tipo, and conditional Unidad selectors.
- **TDD/evidence:** RED architecture proof failed with missing component `ENOENT`; GREEN/TRIANGULATE surface plus architecture tests passed 37/37, retaining keyboard/focus, confirmation/preference, label, pagination, retry, and pending-wall wiring.
- **Verification:** `pnpm typecheck` passed; no attribute, review, or create UI was added.
- **Workload/replan:** 243 A+D actual (260–390 planned); forecast is 1,717–2,492 A+D with six slices remaining. Product decisions remain: `INVALID` permits correction but blocks completion; optional `LIBRE` may be omitted; counter is current pending position.
- **Next:** PR 13D2 is ready; rollback removes only the context component, surface wiring, and boundary proof.

---

## PR 13D2a — definition query budget remediation

- **State:** completed after the formatted 520 A+D PR 13D2 candidate failed budget and was auditably reset; allowed-values paging remains PR 13D2b.
- **TDD/evidence:** RED failed on the missing definition hook; GREEN/TRIANGULATE covers null blocking, exact active/effective definitions, LIBRE unsupported status, retry, and stale deferred-response isolation.
- **Behavior:** one TanStack definition query is keyed by assignment and definition IDs, fails closed, and knows neither allowed-values nor paging.
- **Workload:** 31 child slices total, six remaining, forecast 1,660–2,300 A+D; rollback removes only this hook, focused proof, guards, and record.
## PR 13D2b — allowed-values paging driver
- **Complete:** stale-safe selection paging filters/dedupes backend order, fails closed on missing cursors, and supports retry; RED missing-hook import, GREEN focused 6/6. 31 child slices total, five remaining; forecast 1,440–1,950 A+D. Rollback is this driver, proof, inventory, and record.

---

## PR 13D3 — reducer-owned attribute stages

- **Complete:** Unidad enters `attributes`; guarded completion reaches `review-pending` only for a current VALID evaluation with every required/optional assignment resolved.
- **TDD:** focused RED failed 11 assertions; GREEN passed 48/48 for INVALID/INCOMPLETE, missing, suspended, required omission, invalidation, cursor absence, and the full Back chain.
- **Boundary:** UI retains its temporary contract wall until D5; D4 is ready, four slices remain, forecast 1,160–1,555 A+D.

---

## PR 13D4a — attribute chrome

- **Complete:** the rail presents non-navigable `Atributos · n de total` and review-pending markers; command copy now covers attribute/review stages without owning key behavior.
- **TDD:** five RED assertions; GREEN rail/command/surface proof passed 36/36 and full suite 516/516.
- **Boundary:** D4b owns the presenter; four slices remain, forecast 1,140–1,550 A+D.

PR 13D4b complete: isolated current-assignment presenter, selector autofocus, and compact RTL cover selection, pagination/retry, omission, LIBRE, and honest blocking states; RED missing-module failure, GREEN 15/15. D5 is ready; 3 slices remain; forecast D5 300–395 +14 320–395 +15 260–370 = 880–1,160 A+D.

---

## PR 13D5a — current-attribute derivation

- **Complete:** `deriveCurrentAttributeStep` returns unavailable, complete, or the first unresolved assignment with its 1-based backend-order position.
- **TDD:** missing-module RED; focused pure/sequence/architecture suite passed 19/19 and full suite 526/526.
- **Safety:** null or duplicate assignment identity fails closed; suspended/required omission remain unresolved; only resolved VALID completes.
- **Plan:** D5b orchestration, D5c flow, D5d surface, PR14 and PR15 remain; 35 slices total, forecast 1,320–1,850 A+D.

---

## PR 13D5b — attribute query orchestration

- **Complete:** composed current-step definition and selection-only allowed-value drivers; null/unavailable/complete stay idle, LIBRE blocks values, and same-definition assignment changes rekey child knowledge.
- **TDD:** missing-hook RED; GREEN focused orchestration suite passed 4/4; full suite passed 530/530 and typecheck passed.
- **Plan:** D5c is ready; four slices remain, forecast D5c 180–300 + D5d 300–395 + 14 320–395 + 15 260–370 = 1,060–1,460 A+D.

---

## PR 13D5c — flow attribute authority

- **Complete:** flow composes current queries, feeds allowed knowledge into evaluation, exposes exact select/omit actions, and completes only through the reducer guard.
- **TDD:** flow RED failed 3/4; GREEN evaluation/flow/model/surface/architecture proof passed 79/79 and full suite 535/535.
- **Restoration:** new matching knowledge reconciles already-adopted data, restores once, invalidates authority, and triggers one active-only reevaluation; nonmatching knowledge does not loop.
- **Boundary:** surface remains D5d; three slices remain, forecast 880–1,160 A+D.

---

## PR 13D5d1a — base presenter projection

- **Complete:** pure projection maps terminal completion first; evaluation/definition presenter states, exact retry identity, and optional-only LIBRE omission are isolated from allowed-value, bucket, and callback mapping.
- **TDD:** RED missing-module import; GREEN focused projection suite passed 6/6.
- **Replan:** D5d1a complete; D5d1b selection projection and D5d2 surface remain before PR14/15. 37 children total; 4 remain. Forecast: D5d1b 180–300 + D5d2 280–395 + PR14 320–395 + PR15 260–370 = 1,040–1,460 A+D.
- **Budget remediation:** recorded prior 416 A+D overbudget attempt before documentation reset; this base slice remains independently bounded.

---

## PR 13D5d1b — selection presenter projection

- **Complete:** maps structural allowed-value paging, active confirmation, exact callbacks, and optional omission without transport or primitive-value presentation.
- **TDD:** RED failed on the missing projector; GREEN/TRIANGULATE focused view, presenter, and boundary suite passed 27/27.
- **Plan:** D5d2 is ready; 37 children total, 3 remain. Forecast: 860–1,160 A+D.

---

## PR 13D5d2a — reducer-owned Back navigation

- Exposed flow `back()` through the reducer and suppressed immediate automatic review re-entry for the same completed revision; reconfirming a valid Unit clears the suppression.
- RED/GREEN proof covers review → attributes → Unit without draft mutation; focused flow/model tests and typecheck pass.
- Reset: the combined surface candidate reached 497 A+D before docs and was preserved at `/tmp/kfrc-pr13d5d2-overbudget-1788901142`; D5d2 is now three bounded children.

---

## PR 13D5d2b — primary surface adoption

- **Complete:** the surface derives context, rail, commands, attribute progress, and rendering solely from `flow.state.stage`; null ownership retains the pending wall.
- **TDD:** RED could not find `Color`; GREEN surface RTL passed 29/29 with projected `Color` selection advancing to review pending.
- **Boundary:** D5d2c owns keyboard/optional/INVALID triangulation; 39 children total, 3 remain, forecast 680–985 A+D.

---

## PR 13D5d2c — surface transition proof

- **Complete:** optional omission and INVALID correction wait for authoritative VALID review; review Back and local ArrowLeft retain hierarchy.
- **TDD:** review-heading focus RED failed; focused surface/flow/view/model/architecture RTL passed 87/87 after the minimal focus ref/effect.
- **Plan:** PR 14 ready; 39 children total, 2 remain, forecast 580–765 A+D.

---

## PR 14A — exact selection-create adapter

- **Complete:** added distinct v1 selection-create types, strict `CREATED | CATALOG_CHANGED | INCOMPLETE | INVALID` parsing, and the exact `crearRecursoDesdeSelecciones` mutation adapter; legacy `crearRecurso` remains untouched.
- **TDD:** RED focused API test failed because `parseResourceCreationResult` and `createResourceFromSelections` were absent; GREEN and triangulation passed 39/39.
- **Contract proof:** rejects extra keys, blank IDs/fingerprint, explicit optional-organization `undefined`, malformed dispositions, and disposition/status mismatches; preserves duplicate selection order and accepts `CATALOG_CHANGED` with nested `INCOMPLETE`.
- **Replan:** PR 14 is split into 14A adapter, 14B review, 14C mutation wiring, 14D dispositions, and 14E closure; each child remains below 399 A+D.

---

## PR 14B — authoritative review presenter

- **Complete:** feature-local review shows only generated identity, compact assignment counts, and backend issue messages; raw IDs and normalized primitives remain hidden.
- **TDD:** missing-presenter RED; focused presenter/boundary suite passed 24/24 and full suite 565/565.
- **Gate:** create is visible only for complete VALID authority and supports an explicit pending state; PR 14C owns mutation authority.

---

## PR 14C1 — pure create lease
- **Complete:** frozen create authority requires current review, exact VALID evaluation/fingerprint, active-only request, ownership, context, generation, revision, and state identity; focused 22/22 and full 574/574 passed.

---

## PR 14C2 — authority-bound create mutation
- **Complete:** added the single-flight `useMutation` driver, accepting only a current PR 14C1 lease and suppressing stale settlements; no response adoption or presentation changed.
- **Validation:** focused create/architecture suite passed 28/28; full suite passed 585/585; typecheck, lint, and scoped Prettier passed.
- **TDD:** strict TDD was not activated for this delegated continuation; no RED/GREEN claim.
- **Boundary:** PR 14D owns disposition presentation; PR 14E and PR 15 remain.

---

## PR 14D1 — reducer create-evaluation transition

- **Complete:** `ADOPT_CREATE_EVALUATION` accepts only current review-pending VALID authority with an exact nonblank fingerprint, atomically adopts the backend evaluation and pre-reconciled buckets, returns to attributes, and consumes revision authority once.
- **TDD:** RED: 11 new adoption cases failed because the reducer treated the event as a type confirmation; GREEN: focused model suite passed 40/40.
- **Boundary:** PR 14D2 owns flow/catalog dispatch for non-`CREATED` dispositions; PR 14D3 owns the surface outcome. Replan: 46 children total; D2, D3, E, and 15 remain (forecast 600–900 A+D).

---

## PR 14D2a — create flow adoption

- **Complete:** the flow composes one create driver, leaves `CREATED` exposed, and reducer-adopts reconciled non-created evaluations; explicit `CATALOG_CHANGED` clears definition/value caches and ignores stale knowledge.
- **Proof:** focused flow dispositions cover all four results and exact cache prefixes; unrelated flow/surface tests isolate the create driver with an idle mock.
- **Reset:** the combined formatted candidate was 402 A+D and is preserved at `/tmp/kfrc-pr14d2-overbudget-1788909248`; readiness triangulation moved to D2b.

---

## PR 14D2b — evaluation readiness and fresh catalog knowledge proof

- **State / status:** completed only parent-authorized PR 14D2b under native `proceed` continuation token `sha256:dcfdcc2d2337e97fbae4589de454362abe4b98de0744f262b53502d6f0a8a9af`; `gentle-ai.sdd-status@2` reported this change ready in the repo-local allowed root without warnings. No attempt settlement, commit, branch, review, push, PR, or PR 14D3 work was performed.
- **Completed / persisted:** the implementation-owned PR 14D2b task is visibly `[x]` in `tasks.md`. Parent-owned lifecycle rows are unchanged.
- **Proof:** completion stays at attributes while the evaluation driver is `loading`, then advances to review only after it becomes `ready`; a returned `CATALOG_CHANGED` evaluation reconciles with empty knowledge, so a formerly suspended selection remains suspended despite stale exhaustive cached knowledge that would otherwise restore it.
- **Production correction:** none. The supplied dirty RED candidates passed on their first focused execution, demonstrating that PR 14D2a already owns both protections; their first-pass Green result is recorded rather than manufacturing a failure or altering surface behavior.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 14D2b readiness | `useResourceCreationFlow.attributes.test.tsx` | Hook integration | 5 pre-existing tests passed | Dirty candidate passed initially (existing gate) | 6/6 passed | Loading-to-ready transition verifies both blocked and released states | Targeted Prettier unchanged; final focused run green |
| PR 14D2b catalog knowledge | `useResourceCreationFlow.create.test.tsx` | Hook integration | 5 pre-existing tests passed | Dirty candidate passed initially (existing cache reset) | 6/6 passed | Existing non-created disposition matrix plus suspended stale-knowledge case | Targeted Prettier normalized the dirty test; final focused run green |

- **Verification:** focused Vitest passed 12/12; `pnpm typecheck`, targeted ESLint, targeted Prettier check, and `git diff --check` passed. The first targeted Prettier check correctly found the supplied create test unformatted; it was formatted and every focused gate was rerun green.
- **Files:** `tests/unit/useResourceCreationFlow.attributes.test.tsx`, `tests/unit/useResourceCreationFlow.create.test.tsx`, `tasks.md`, and this cumulative record. No permitted production file required a change; no surface outcome or `onCreated` behavior changed.
- **Workload / rollback:** PR 14D2b only (`PR 14D2a → 📍 PR 14D2b → PR 14D3`); final numstat is recorded after this progress update and remains below 399 A+D. Roll back only the two proof additions and this checkbox/evidence record.
- **Remaining implementation tasks:** `- [ ] **PR 14D3:** Published disposition surface outcome with only \`CREATED\` invoking the existing success seam. <!-- sdd-owner: implementation -->`; `- [ ] **PR 14E:** Stale, unknown, and transport-rejection integration proof plus focused review/create closure. <!-- sdd-owner: implementation -->`.
- **Next:** `parent-lifecycle` for attempt settlement; PR 14D3 is the only subsequent implementation slice and remains untouched.

### PR 14D2b metadata reconciliation

- Updated only the Review Workload Forecast and PR 14A–E chain-map summary to record PR 14D2b as complete, three remaining implementation slices (PR 14D3, PR 14E, PR 15), and PR 14D3 targeting PR 14D2b.
- No production, test, scope, checkbox, lifecycle, or surface-outcome behavior changed; prior focused-test/typecheck evidence remains authoritative.

---

## PR 14D3 — published disposition surface outcome

- **State / structured status:** completed only under parent attempt `proceed` token `sha256:a998425c8cd2ca8ca6c9fb0ed54d2d51ed00441c5783a824b5e29b8ff8b2fcf1`; authoritative OpenSpec change `keyboard-first-resource-creation` was apply-ready in the repo-local workspace with no action-context warnings. No attempt settlement, commit, branch, review, push, PR, or PR 14E/15 work was performed.
- **Completed / persisted:** the implementation-owned PR 14D3 checkbox is visibly `[x]` in `tasks.md`; parent-owned lifecycle rows are unchanged.
- **Implementation:** `ResourceCreationReview` presents only the four published create dispositions. `CrearRecursoSurface` composes the existing review/create seam and de-duplicates `onCreated` by current result identity; only `CREATED` invokes it, while `CATALOG_CHANGED`, `INCOMPLETE`, and `INVALID` remain owned by the existing flow/reducer correction adoption.
- **Design-system checklist:** reused feature-local review and shared `Button`/Light semantic tokens; no new component, CSS, arbitrary value, Dark mode, free-value field, global listener, or alternate state authority was added.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 14D3 surface outcome | `tests/unit/crearRecursoSurface.test.tsx`, `tests/unit/resourceCreationReview.test.tsx` | RTL | 42/42 passed | 5 failures: missing result presentation and absent `CREATED` success seam | 50/50 passed | Four published dispositions prove `CREATED` once and all other dispositions zero calls | Extracted pure `resultOutcome`; focused tests remained 50/50 |

- **Verification:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreationReview.test.tsx` — 50/50 passed; `pnpm typecheck` — passed; targeted ESLint and Prettier checks — passed; `git diff --check` — passed.
- **Files:** `CrearRecursoSurface.tsx`, `ResourceCreationReview.tsx`, the two focused RTL tests, `tasks.md`, and this cumulative record.
- **Deviation / rollback:** none. Roll back only review-result presentation, surface seam composition, focused tests, and this evidence; the flow/reducer adoption contract remains intact.
- **Workload / PR boundary:** feature-branch-chain `PR 14D2b → 📍 PR 14D3 → PR 14E`; the forecast, chain marker, and PR 14 dependency diagram now advance to PR 14E / PR 14D3, and `git diff --numstat` is 242 additions + 31 deletions = 273 A+D, below the 399 A+D cap.
- **Remaining implementation task:** `- [ ] **PR 14E:** Stale, unknown, and transport-rejection integration proof plus focused review/create closure. <!-- sdd-owner: implementation -->`
- **Next:** `parent-lifecycle`; PR 14E and PR 15 remain explicitly out of scope.

---

## PR 14E — stale, rejection, and focused create closure

- **State / structured status:** completed only under parent attempt `proceed` token `sha256:d5863c0697a56e6287bcfb3d318fe7ce4390b4198f396ea3fc225d6e64e988d1`; native `gentle-ai.sdd-status@2` was apply-ready for `keyboard-first-resource-creation`, `artifactStore: openspec`, and the repo-local allowed root without warnings or blockers. No attempt settlement, commit, branch, review, push, PR, or PR 15 browser/axe work was performed.
- **Completed / persisted:** the implementation-owned PR 14E checkbox is visibly `[x]` in `tasks.md`. Parent-owned lifecycle rows are unchanged.
- **Proof:** a stale `CREATED` settlement remains invisible as a success result; rejected unknown/malformed adapter results and transport failures enter the existing generic mutation error boundary without an application disposition; an explicit, current retry alone can later expose a valid `CREATED` result. Existing single-flight coverage remains green, so duplicate submissions and result replays remain suppressed.
- **Implementation:** added focused hook-integration proof only in `tests/unit/useResourceCreationCreate.test.tsx`; no production behavior, adapter/parser shape, surface presentation, TanStack ownership, or review correction was needed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR 14E proof closure | `tests/unit/useResourceCreationCreate.test.tsx` | Hook integration | 79/79 focused review/create/flow/architecture tests passed | The new stale-created and three rejection assertions passed on their first run because PR 14C2/D3 already fail closed; no production change was manufactured | Focused hook suite passed 13/13 | Covers stale `CREATED`, unknown adapter rejection, malformed adapter rejection, transport rejection, and one explicit current retry | Targeted Prettier formatting reran the hook suite green (13/13) |

- **Verification:** `pnpm exec vitest run tests/unit/useResourceCreationCreate.test.tsx` — 13/13 passed after proof and formatting; `pnpm exec vitest run tests/unit/useResourceCreationCreate.test.tsx tests/unit/useResourceCreationFlow.create.test.tsx tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreationReview.test.tsx tests/architecture/resourceCreationBoundaries.test.ts` — 83/83 passed; `pnpm typecheck`, targeted ESLint, targeted Prettier check, and `git diff --check` passed.
- **Files:** `tests/unit/useResourceCreationCreate.test.tsx`, `tasks.md`, and this cumulative record.
- **Deviation / rollback:** none. Roll back only the PR 14E proof additions and OpenSpec evidence; retain PR 14C2 mutation protection and PR 14D3 presentation.
- **Workload / PR boundary:** feature-branch-chain `PR 14D3 → 📍 PR 14E → PR 15`; final `git diff --numstat` is 77 additions + 1 deletion = 78 A+D, below the 399 A+D cap.
- **Remaining implementation task:** none in PR 14; PR 15 remains unchecked and is explicitly deferred to its browser/axe closure.
- **Next:** `parent-lifecycle`; return this evidence to the parent for its owned lifecycle and attempt settlement.

### PR 14E metadata reconciliation

- **State / status:** parent reacquired the existing PR 14E attempt with `proceed`; this metadata-only update consumed the apply-ready OpenSpec change in the repo-local allowed root. No production, test, task-checkbox, lifecycle, or PR 15 work was performed.
- **Reconciled metadata:** the forecast now records PR 14A–E complete and one remaining implementation slice (PR 15); the chain map records PR 14A–E complete and advances the current marker/target to `📍 PR 15` / PR 14E; the PR 14 dependency diagram now ends at PR 14E and points to PR 15.
- **Evidence preservation:** prior PR 14E implementation and TDD evidence remain unchanged. This documentation-only reconciliation needs no test rerun.
- **Workload:** final `git diff --numstat` is 88 additions + 5 deletions = 93 A+D, and `git diff --check` passes; the combined work remains below 399 A+D.

---

## PR 15 — backend-enabled browser closure (blocked after RED)

- **State / structured status:** consumed parent authority `gentle-ai.sdd-status@2` for `keyboard-first-resource-creation`: OpenSpec artifacts present, apply ready, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed test/OpenSpec surfaces only, and no action-context warnings. Parent supplied attempt `proceed` token `sha256:d17bda8edd585cb487ad8bbd040f851218eb464a26532b28a83816ee7c4b1d78`; no attempt settlement or lifecycle action was performed.
- **Workload / boundary:** feature-branch-chain PR 15 only. The implementation-complete forecast cannot be reconciled because the browser RED exposes a non-PR15 production ownership gate. No production, fixture, API, query, shared UI, global listener, lifecycle, commit, branch, PR, review, push, sync, or archive edit was made.
- **Completed persisted checkbox:** PR 15 **RED** is visibly `[x]` in `tasks.md`. The RED test exercises keyboard-only Clase → Familia → Tipo → Unidad against the browser backend intercept and then requires the `SELECCION` `Color` searchbox.

### TDD Cycle Evidence

| Task | Test file | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| PR 15 browser closure | `tests/e2e/resourcesMaster.workstation.spec.ts` | Playwright browser | Failed as required: `getByRole('searchbox', { name: 'Color' })` was not found after explicit Unidad confirmation. | Blocked: no production edits are authorized. | Not run: the `OPTIONAL` omission, `INCOMPLETE | INVALID | VALID` review, fingerprinted create, stale/unknown/transport, and axe states are unreachable. | Not run: GREEN is blocked. |

### Blocking evidence

- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep 'RED: reaches the backend-enabled selection stage'` — failed (1 failed) at the required `Color` searchbox after 5 seconds.
- The runtime composition in `src/features/resources-master/ResourcesMasterEntry.tsx` supplies `creationOwnership = null`; this deliberately retains the ownership-specific pending wall, so evaluation, attribute definitions/allowed values, review, and create cannot be reached in the browser.
- This is the explicit product-owned ownership integration seam documented by the completed parent task, not a PR 15 test weakness. Completing browser closure requires an authorized production slice that supplies real non-null `ResourceCreationEvaluationOwnership` to `ResourcesMasterScreen`/`CrearRecursoSurface`.

### Files changed

- `tests/e2e/resourcesMaster.workstation.spec.ts`
- `openspec/changes/keyboard-first-resource-creation/tasks.md`
- `openspec/changes/keyboard-first-resource-creation/apply-progress.md`

### Remaining implementation-owned task lines

- `- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->`
- `- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->`
- Historical final-gate command superseded; this record lists only existing focused commands actually run.

### Verification not run

The focused Vitest architecture/unit suite, full Playwright journey/axe closure, typecheck, lint, format check, build, and final gate have not been run because strict TDD forbids progressing past this failing RED without an authorized production GREEN fix. They are not reported as passed. `git diff --check` passed; `git diff --numstat` is 63 additions + 1 deletion = 64 A+D, below 399.

### Next action

Return the RED evidence to the parent. An authorized ownership-integration production slice must resolve the runtime `null` ownership wall before PR 15 can honestly continue; PR 15 must then add exact published DTO intercept fixtures and finish GREEN/TRIANGULATE within its 399 A+D boundary.

---

## PR15 global ownership remediation — narrower successor

- **State / structured status:** parent-selected `keyboard-first-resource-creation`, native apply-ready OpenSpec/repo-local context, allowed surfaces only, no action-context warnings; `proceed` token `sha256:2e204e404cb2b8284ced697d937a6003d2809f7616fc1fbce0dfd51f22e508f0`. This remediates the ownership seam exposed by failed revision `sha256:76ea2e1f869c9eef04fdd159e023f979e893f6f67f8a2c509f7ca09ca80b56c0`; no settlement, receipt, commit, branch, review, push, or PR action was performed.
- **Workload / PR boundary:** feature-branch-chain successor `pr15-global-ownership-remediation` only. The retained PR15 RED/evidence remains unchanged; this adds only Entry composition plus architecture proof and stays below the cumulative 399 A+D ceiling.
- **Implementation:** `ResourcesMasterEntry` now explicitly supplies typed `ResourceCreationEvaluationOwnership` `{ kind: 'GLOBAL' }` and forwards it unchanged through the existing `ResourcesMasterScreen` prop seam. No organization/session/config authority or deeper Screen/Creador default was added.
- **Persisted task checkboxes:** unchanged by direction. PR15 RED remains visibly `[x]`; PR15 GREEN, TRIANGULATE/REFACTOR, and the final gate remain visibly `[ ]`.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GLOBAL Entry composition | `tests/architecture/resourceCreationBoundaries.test.ts` | Architecture | 14/14 passed | New Entry proof failed because the source typed `creationOwnership` as `null` | 15/15 passed after the minimum typed GLOBAL composition | Skipped: this is a single structural constant with one authorized output | No refactor needed; scoped Prettier check stayed green |
| Preserved PR15 browser RED | `tests/e2e/resourcesMaster.workstation.spec.ts` | Playwright | Existing RED failed at absent `Color` searchbox | Still blocked: runtime now reaches `Atributos · pendiente`, but the retained intercept returns no evaluation/definition/allowed-value DTOs and shows the evaluation transport alert instead of Color | Not run | Not run |

### Verification

- `pnpm exec vitest run tests/architecture/resourceCreationBoundaries.test.ts` — RED: 1 failed / 14 passed; GREEN: 15/15 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep "backend-enabled selection stage"` — still failed at `Color`; its page snapshot proves the GLOBAL-owned path reaches the attributes stage before the missing, intentionally deferred exact DTO fixtures.
- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks for Entry, architecture proof, and retained browser RED — passed. A wider Prettier check including retained OpenSpec artifacts failed on pre-existing formatting in `tasks.md` and `apply-progress.md`; it was not rewritten because that would exceed this successor's narrow evidence scope.
- `git diff --check` — passed; `git diff --numstat` is 113 additions + 2 deletions = 115 A+D, below 399.

### Blocking boundary and remaining tasks

- The requested `Color` `SELECCION` GREEN result cannot be produced without adding exact evaluation, definition, and allowed-value browser intercept fixtures, which this narrower successor explicitly forbids. The next fixture-owning PR15 scope must supply those published DTOs; this successor must not fabricate them.
- Remaining persisted lines are unchanged: `- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->`; `- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->`; and the final-gate line above.
- **Rollback:** revert only the Entry GLOBAL constant and its architecture proof; retain the original PR15 RED/evidence untouched.

---

## PR15 exact browser fixtures — partial closure, blocked on INVALID correction

- **Status / context:** consumed parent `gentle-ai.sdd-status/v2`: `keyboard-first-resource-creation`, OpenSpec apply-ready, repo-local allowed root, no warnings; PR15 after PR14E under `feature-branch-chain`.
- **Completed / persisted:** PR15 GREEN is visibly `[x]`; the historical RED row now states that no broad failing browser test is retained.
- **Files:** `tests/e2e/resourcesMaster.workstation.spec.ts`, `tasks.md`, and this cumulative record only; inherited Entry/architecture edits are untouched.
- **Green evidence:** exact test-only intercept DTOs drive keyboard Clase→Familia→Tipo→Unidad→`modoCaptura: SELECCION` Color, optional **Omitir**, `INCOMPLETE→VALID` review, exact `expectedCatalogFingerprint`, and only `CREATED` success; axe passes for attribute and review dialogs.

### TDD Cycle Evidence

| Task | RED | GREEN | TRIANGULATE/REFACTOR |
| --- | --- | --- | --- |
| PR15 fixtures/journey | Historical RED is not retained | Playwright journey 1/1, full file 7/7 | Blocked: an exact `INVALID` selection fixture causes repeated evaluation-loading instead of correction. |

- **Commands:** initial full Playwright safety net 6 passed/1 obsolete-wall failed; focused journey 1/1 passed; full Playwright 7/7 passed; architecture 15/15, typecheck, targeted ESLint, Prettier check, and `git diff --check` passed.
- **Blocker:** an allowed selected value returned as `INVALID` with `seleccionesInvalidas` is suspended then immediately restored from loaded allowed-values knowledge, rearming evaluation indefinitely. No production edit is authorized; no failing browser test is retained.
- **Remaining:** `- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->`
- **Boundary:** no commit, branch, PR, review, receipt, verify/sync/archive, or production edit; rollback removes only the test fixtures/journey and this record.

---
## PR15 invalid-selection-reconfirmation
- **Status:** explicit `keyboard-first-resource-creation`; OpenSpec apply-ready, strict TDD, repo-local allowed root, no warnings.
- **Implementation:** backend-invalid assignment IDs persist in buckets, block automatic allowed-value restoration, and clear only on explicit confirm/omit.
- **Files:** `resourceCreation.selectionDraft.ts`, `resourceCreation.attributeSequence.ts`, focused unit tests, `tasks.md`, and this record.
- **Completed:** PR15 TRIANGULATE/REFACTOR is visibly `[x]`; parent lifecycle rows remain deferred unchanged.
- **Workload:** feature-branch-chain PR15 successor; 88 source/test A+D + 2 checkbox A+D + 14 record A+D = 104 additional A+D (≤110).
| Task | RED | GREEN | TRIANGULATE/REFACTOR |
| --- | --- | --- | --- |
| Invalid selection | hook failure: allowed knowledge restored invalid value and made a third request | minimal provenance suspended it | ordinary suspension still restores; confirm/omit clear provenance |
- **Verification:** focused Vitest 20/20 and typecheck passed; Playwright workstation journey passed 7/7.
- **Deviation:** none; no UI, fixture, or lifecycle edit.
- Historical final-gate command superseded; this record lists only existing focused commands actually run.

---

## PR15 final regression reconciliation

- **Status / action context:** parent explicitly selected `keyboard-first-resource-creation`; strict TDD, OpenSpec artifacts, `repo-local`, and the four allowed edit surfaces were consumed. The prior native ambiguity was superseded only by that selection. No action-context warning, production edit, lifecycle action, commit, branch, review, receipt, verify, sync, or archive action occurred.
- **Boundary / files:** `auto-chain` / `feature-branch-chain`, PR15 remediation after invalid-selection successor; changed only `tests/unit/resourcesMasterScreen.test.tsx`, `tests/e2e/resourcesMaster.workstation.spec.ts`, `tasks.md`, and this record.
- **Completed / persisted:** corrected the Entry expectation to typed `{ kind: 'GLOBAL' }`; reconciled implementation-owned task wording; and re-read the PR15 TRIANGULATE/REFACTOR row as visibly `[x]` only after the browser evidence below passed. Parent-owned rows remain byte-for-byte unchanged.
- **Browser contracts:** a parameterized exact DTO fixture now proves `INVALID` correction/reconfirmation; stale `CREATED`, unknown disposition, and transport rejection cannot render **Recurso creado** or refetch the active list. The positive journey uses real Tab traversal (search → option → **Omitir**, review → **Crear recurso**) rather than programmatic focus.

### TDD Cycle Evidence

| Task | Safety net / RED | GREEN / TRIANGULATE / REFACTOR |
| --- | --- | --- |
| GLOBAL ownership expectation | Unit baseline failed 1/15 at obsolete null ownership | Test-only correction passed 15/15; existing forwarding guard stays coherent |
| Browser correction/outcomes | Browser safety net 7/7; first new case exposed one-Tab traversal and an incomplete invalid fixture | Exact `seleccionesInvalidas` plus two Tabs passed correction 1/1; stale/unknown/transport passed 3/3; Prettier refactor kept full browser file green 11/11 |

### Verification

- `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx` — initial RED 1 failed / 14 passed; final 15/15 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts` — safety net 7/7; final 11/11 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep 'requires keyboard correction'` — RED twice, then GREEN 1/1 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep 'stale CREATED|unknown disposition|transport rejection'` — TRIANGULATE 3/3 passed.
- `pnpm exec prettier --write tests/e2e/resourcesMaster.workstation.spec.ts tests/unit/resourcesMasterScreen.test.tsx`, `pnpm exec prettier --check tests/e2e/resourcesMaster.workstation.spec.ts tests/unit/resourcesMasterScreen.test.tsx`, and final `git diff --check` — passed.
- The nonexistent payload test and stale final-gate command were removed from this record; they were not run. Parent owns typecheck, lint, format-check, build, and full-gate execution.

- **Deviation / rollback:** no production behavior changed; exact published test DTOs were reused. Roll back only the two test files and this artifact reconciliation.
- **Remaining implementation-owned tasks:** none; deferred parent lifecycle actions remain unchanged.

---

## PR15 keyboard fixture stability

- **State / structured status:** parent explicitly selected `keyboard-first-resource-creation` and bounded `pr15-keyboard-fixture-stability`; strict TDD, OpenSpec artifacts, repo-local workspace, and the two supplied edit surfaces were consumed. The earlier native status was selection-ambiguous, but the parent selection supersedes only that ambiguity. No unsafe action-context warning occurred.
- **Root cause:** `reachReadyReview` emitted two consecutive real `Tab` presses after only the `Acabado` searchbox-focus assertion. It did not prove that the asynchronously rendered `Mate` option was ready or that the first Tab had reached it, so a delayed focus transition could make the second event be observed before the expected intermediate traversal.
- **Fix:** retained genuine keyboard-only interaction and added readiness/transition assertions: `Mate` must be visible, the first real Tab must focus it, and the second real Tab must focus **Omitir**. No `.focus()`, timer, retry loop, or product-code change was introduced, so a broken tab order still fails visibly.
- **Task checkboxes:** no task artifact was edited because all implementation-owned PR15 rows are already visibly `[x]` and `tasks.md` is outside this bounded work unit's allowed surfaces; parent-owned rows remain untouched.
- **Files changed:** `tests/e2e/resourcesMaster.workstation.spec.ts`; this cumulative progress record.
- **Workload / PR boundary:** `pr15-keyboard-fixture-stability` only; 4 test-line additions plus this evidence, below the parent-authorized 120 A+D cap. No production, commit, review, settle, delivery, or lifecycle action was performed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keyboard fixture stability | `tests/e2e/resourcesMaster.workstation.spec.ts` | Playwright E2E | Full file: 11/11; focused transport rejection: 12/12 repeats pre-change | Parent's second full-gate failure identified the unobserved intermediate Tab transition; it did not reproduce locally across 12 serial repeats | Focused transport rejection: 20/20 serial repeats passed after the explicit first-Tab focus assertion | Full Playwright file: 11/11; both unknown-disposition and transport-rejection outcomes use the shared traversal | No production refactor needed; scoped Prettier and `git diff --check` passed |

### Verification

- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep 'transport rejection' --repeat-each=12 --workers=1` — pre-change safety net: 12/12 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --workers=1` — pre-change safety net: 11/11 passed; post-change full file: 11/11 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --grep 'transport rejection' --repeat-each=20 --workers=1` — post-change focused stability: 20/20 passed.
- `pnpm exec prettier --check tests/e2e/resourcesMaster.workstation.spec.ts` and `git diff --check` — passed.

- **Deviation / risks:** local reproduction did not fail, so the diagnosis is limited to the missing observable readiness boundary rather than a confirmed product accessibility defect. The strengthened helper now exposes any true search → option → omit tab-order regression; parent still owns broader gates and lifecycle actions.

---

## Final independent verification — current state

- **Current state:** PR15 implementation is complete. Older blocked, status, and count sections above are historical work-unit records, not current state.
- **Verification:** `pnpm test` passed 616/616 across 56 files; Playwright passed 11/11; typecheck, lint, format, build, and diff-check passed.
- **Build annotations:** two Zod/Rollup annotation warnings and the 727.91 kB chunk warning were reported; they did not fail the build. The generated tracked route tree was unchanged.
- **Delivery workload:** the dirty aggregate at verification time was 729 A+D across multiple bounded work units awaiting parent delivery/review handling; it is not one under-399 A+D candidate.

---

## PR15 deterministic create-loading

- **State / status:** completed parent-authorized `pr15-deterministic-create-loading`; explicit `keyboard-first-resource-creation` selection superseded only the prior native change-selection ambiguity. Strict TDD and repo-local allowed surfaces were consumed; no action-context warning occurred.
- **Fix:** the unknown-disposition and transport-rejection fixtures now defer create settlement, prove **Creando…** while pending, release the exact non-success response, wait for loading to clear, then retain the stable no-success/no-refetch assertions. No production code or timeout changed.
- **Tasks / boundary:** PR15 corrective test-only slice; all implementation-owned PR15 rows were re-read as `[x]`, so no task checkbox changed. Parent-owned lifecycle rows remain untouched.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net / RED | GREEN / TRIANGULATE / REFACTOR |
| --- | --- | --- | --- | --- |
| Deterministic non-success loading | `tests/e2e/resourcesMaster.workstation.spec.ts` | Playwright E2E | Pre-change immediate fixture settlement made `Creando…` observationally racy; 10 repeats per outcome passed but did not establish a pending boundary. | Deferred responses passed 20 repeats per outcome; a 5-repeat post-format rerun and the full file passed. |

### Verification

- Pre-change focused cases: 10 repeats each, 20/20 passed; source inspection established the immediate-settlement race.
- Post-change focused cases: 20 repeats each, 40/40 passed; post-format rerun: 5 repeats each, 10/10 passed.
- `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts --workers=1` — 11/11 passed.
- Scoped Prettier and `git diff --check` passed.

- **Files / workload:** `tests/e2e/resourcesMaster.workstation.spec.ts` and this record only; this corrective patch is 45 A+D, below the 120 A+D cap.
- **Residual risk:** this controls mocked-route settlement only; it does not change or prove live backend latency behavior. Rollback removes the deferred test helper and this evidence.

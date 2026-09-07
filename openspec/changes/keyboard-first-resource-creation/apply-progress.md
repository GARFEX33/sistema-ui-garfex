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
- `- [ ] **RED:** Add failing `tests/unit/resourceCreation.payload.test.ts` cases for all attribute mappings, exact hierarchy/Unit IDs, trim semantics, optional description, GLOBAL ownership, and absence of omitted or empty optional values. <!-- sdd-owner: implementation -->`
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
- `- [ ] Run the complete final gate after PR 15: `pnpm exec vitest run tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.payload.test.ts tests/unit/resourceCreation.loaders.test.ts tests/unit/StagedSearchSelector.test.tsx tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/keyboardBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`; record exact results and do not report unavailable gates as passed. <!-- sdd-owner: implementation -->`

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

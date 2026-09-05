# Apply progress — adopt-query-zod

## Status

- **Date:** 2026-09-24
- **Executors:** SDD apply for Slice A; bounded project workers for B through C2.
- **Change / current branch:** `adopt-query-zod` / `feat/adopt-query-zod-05-query-actions`.
- **Current state:** A, B, C1, and C2 completed; D is the next pending work unit.
- **Native attempt authority:** Slice A settled as complete; no Pi or Gentle tooling is modified by later project-only work.
- **Structured status:** OpenSpec remains the artifact authority; `tasks.md` is the current task source of truth.
- **Action-context warning:** None; every edit remained within the parent-authorized project surfaces.
- **Delivery boundary:** feature-branch chain `A → B → C1 → C2 → D → E`; every completed unit remains below 400 changed lines.

## Completed implementation tasks and persisted evidence

The following Slice A implementation-owned rows are visibly marked `- [x]` in `tasks.md`:

1. **RED:** Added failing Router composition/Query context and infrastructure-boundary tests.
2. **GREEN:** Added a per-mount lazy `QueryClient` and `QueryClientProvider` around the existing `RouterProvider`.
3. **TRIANGULATE:** Added rerender-versus-remount identity and source-level singleton/duplicate-provider guard cases.
4. **REFACTOR:** Kept the smallest explicit provider composition and focused tests; reran tests and typecheck.

Parent-owned lifecycle rows were left byte-for-byte unchanged and deferred: the post-E spec reconciliation and bounded-review receipt work.

## TDD Cycle Evidence

| Task          | Test file(s)                                                                        | Layer                    | Safety net                                                  | RED                                                                                            | GREEN                                                                | TRIANGULATE                                                                                          | REFACTOR                                                                                                |
| ------------- | ----------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A RED         | `tests/unit/appProviders.test.tsx`, `tests/architecture/queryZodBoundaries.test.ts` | Component + architecture | `pnpm test -- tests/unit/appShell.test.tsx`: 335/335 passed | Added first; focused command failed with missing Query context and missing React Query import. | N/A                                                                  | N/A                                                                                                  | N/A                                                                                                     |
| A GREEN       | Same focused tests                                                                  | Component + architecture | Existing provider behavior covered by the 335/335 baseline  | Existing RED retained.                                                                         | Focused command: 337/337 passed after the lazy provider composition. | N/A                                                                                                  | N/A                                                                                                     |
| A TRIANGULATE | Same focused tests                                                                  | Component + architecture | Green result: 337/337                                       | Existing RED retained.                                                                         | Existing GREEN retained.                                             | Added independent-remount identity and singleton/duplication cases; focused command: 338/338 passed. | N/A                                                                                                     |
| A REFACTOR    | Same focused tests                                                                  | Component + architecture | Triangulation result: 338/338                               | Existing RED retained.                                                                         | Existing GREEN retained.                                             | Existing triangulation retained.                                                                     | No further reduction was safe or useful; focused command: 338/338 passed and `pnpm typecheck` exited 0. |

**Test summary:** 3 tests written (2 component, 1 architecture); final test run reported 30 test files and 338 tests passing. Approval tests: none; pure functions created: none.

## Files changed

- `src/app/providers/AppProviders.tsx`
- `tests/unit/appProviders.test.tsx`
- `tests/architecture/queryZodBoundaries.test.ts`
- `openspec/changes/adopt-query-zod/tasks.md`
- `openspec/changes/adopt-query-zod/apply-progress.md`

No dependency manifest or lockfile was changed.

## Verification evidence

| Command                                                                                             | Exact terminal result                                                                           |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test -- tests/unit/appShell.test.tsx`                                                         | Exit 0 — `Test Files 28 passed (28)`; `Tests 335 passed (335)`.                                 |
| `pnpm test -- tests/unit/appProviders.test.tsx tests/architecture/queryZodBoundaries.test.ts` (RED) | Exit 1 — `Test Files 2 failed                                                                   | 28 passed (30)`; `Tests 2 failed | 335 passed (337)`; failures were `No QueryClient set, use QueryClientProvider to set one`and absent`from '@tanstack/react-query'`. |
| Same focused command (GREEN)                                                                        | Exit 0 — `Test Files 30 passed (30)`; `Tests 337 passed (337)`.                                 |
| Same focused command (TRIANGULATE)                                                                  | Exit 0 — `Test Files 30 passed (30)`; `Tests 338 passed (338)`.                                 |
| Same focused command (REFACTOR)                                                                     | Exit 0 — `Test Files 30 passed (30)`; `Tests 338 passed (338)`.                                 |
| `pnpm typecheck`                                                                                    | Exit 0 — `$ pnpm router:generate && tsc -b`; `$ tsr generate`; `Generated route tree in 107ms`. |
| `git diff --check`                                                                                  | Exit 0; no output.                                                                              |

Runtime harness: N/A — this provider-only unit has no standalone user flow, and Router composition is covered by the component test.

## Design conformance and rollback

- The provider creates a `QueryClient` only through `useState(() => new QueryClient())`, so identity is stable for a mounted provider and distinct after remount.
- `RouterProvider` remains in its existing position inside `AppProviders`; the provider imports no Convex, feature, or domain API.
- No defaults, singleton, devtools, persistence, broadcast, Router-Query integration, or feature consumer was added.
- **Rollback boundary:** remove the `QueryClientProvider` wrapper and lazy initializer from `AppProviders`, then remove the two Slice A test files and restore the four Slice A task boxes. No persistent cache, backend state, or data migration exists.

## Workload and risks

- Measured authored additions plus deletions: **185** (179 additions, 6 deletions), below the 400-line budget.
- No design deviation occurred.
- Risks are limited to an inert session-memory Query provider before consumers arrive; the new tests guard Router composition, per-mount identity, one provider location, and the `src/app/**` Convex boundary.

## Historical pending-task snapshot after Slice A

The checklist below records the state immediately after Slice A and is superseded by the current `tasks.md` plus the later Slice B/C1 evidence in this file. It is retained only as chronological apply evidence; it is not the current completion state.

- [ ] **RED:** Extend `tests/unit/resourcesMasterApi.test.ts` with failing list-only equivalence cases for opaque IDs, `organizacionId` absent/present, all three classification states, string-only reasons, ignored extra envelope/item/status fields, and invalid envelope/item/status values that expose exactly `Invalid resources master response` rather than payload or `ZodError`. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** In `src/features/resources-master/resourcesMaster.api.ts`, add private Zod 4 schemas and an explicit projection used only by exported `parseResourceListPage`; retain its public return type and `bad()` seam, preserve references/copies and optionality, and do not change detail, context, creation, mutation, or transport parsers. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Add boundary values to `tests/unit/resourcesMasterApi.test.ts` proving no coercion, trim, default, business inference, or conversion of opaque IDs occurs, including the current acceptance semantics for numeric `revision` and rejection of `null` IDs or non-string cursors. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Keep Zod schema symbols private and simplify only the list-parser projection in `src/features/resources-master/resourcesMaster.api.ts`; rerun the focused API command to confirm non-list parser coverage remains green. <!-- sdd-owner: implementation -->
- [ ] **RED:** Create failing contract tests in `tests/unit/useResourcesMasterListQuery.test.tsx` using a fresh `QueryClient` and local `QueryClientProvider` per case for key identity, trimmed search, deepest effective hierarchy filter, list-versus-search payload, initial cursor, explicit query options, isolated caches, and no Convex import. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Create `src/features/resources-master/useResourcesMasterListQuery.ts` as a private-feature hook that calls only `ResourcesMasterApi`, derives the exact `['resources-master', 'list', normalizedSearchText, effectiveLevel, effectiveId]` key and matching payload, and configures `useInfiniteQuery` with the approved initial page param, CTA-driven continuation, focus/reconnect/remount policy, and no shared wrapper. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Add failing-then-passing cases in `tests/unit/useResourcesMasterListQuery.test.tsx` for exactly one automatic initial retry, zero automatic continuation retries, one-call manual retry, duplicate-CTA suppression, cursor reuse after partial failure, page-order flatten/dedupe, confirmed-empty semantics, retained valid pages, and no focus/reconnect/remount refetch; restore any global `focusManager` state in `finally`. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Encapsulate the private technical failure marker, in-flight continuation promise, semantic status mapping, and `useMemo` projection in `src/features/resources-master/useResourcesMasterListQuery.ts` without exposing remote error messages or Query internals; clear locally created test clients and rerun the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** Adapt `tests/unit/resourcesMasterScreen.test.tsx` to mount a fresh isolated `QueryClient` and add failing observable regressions for one initial read, 249/250 ms search debounce, empty-input 0 ms commit, hierarchy change cancelling a pending debounce, deepest-filter payload, unchanged copy/roles/CTA states, deduped continuation, and visible rows after partial error. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Update `src/features/resources-master/ResourcesMasterScreen.tsx` to retain local input, focus, API identity, hierarchy selection, command registration, JSX, copy, classes, and accessibility while replacing only list-controller projection with `useResourcesMasterListQuery.ts`; use atomic committed criteria so the hook sees one consistent search-plus-hierarchy snapshot. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Extend `tests/unit/resourcesMasterScreen.test.tsx` to cover repeated load-more activation while pending, `Reintentar` and `Reintentar continuación` routing to the semantic hook actions, confirmed empty state only after a valid done page, and preservation of keyboard/search focus behavior without a new document listener. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Remove only superseded list-controller wiring from `src/features/resources-master/ResourcesMasterScreen.tsx`; keep `src/features/resources-master/useResourcesMasterList.ts` and its existing tests as the rollback seam, avoid visual/Tailwind/shared-UI changes, and rerun the focused command. <!-- sdd-owner: implementation -->
- [ ] **RED:** Create failing `tests/unit/resourcesMasterScreenRefetch.test.tsx` cases proving a confirmed `CrearRecursoSurface` completion refetches only the currently observed key, never uses `useMutation`, cache writes, prefix invalidation, or refreshes a seeded different key; add expected focus/reconnect call-count cases to the focused query/screen tests. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Change only the `onCreated` callback in `src/features/resources-master/ResourcesMasterScreen.tsx` to fire-and-forget `refetchActive()` from the active list hook after the existing creation flow confirms success; do not edit `CrearRecursoSurface.tsx`, migrate submit state, or add optimistic/cache-edit behavior. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Create `tests/architecture/queryZodBoundaries.test.ts` assertions with file-level allowlists: React Query only in `src/app/providers/AppProviders.tsx` and `src/features/resources-master/useResourcesMasterListQuery.ts`; Zod only in `src/features/resources-master/resourcesMaster.api.ts`; no Query in Catálogo, hierarchy, forms, keyboard, Router, or `src/shared/**`; and no persistence, persister, broadcast, devtools, Zustand, Redux, shared wrapper, or Convex imports in `src/app/**`/the hook. Extend `tests/e2e/resourcesMaster.workstation.spec.ts` for no focus refetch, partial-error retention/retry, and active-list-only post-create refresh while preserving axe and keyboard paths. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Consolidate only duplicated test setup within their existing test files, preserve a fresh QueryClient per render/case, run the focused unit/architecture command and focused E2E command, then run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `pnpm verify:runtime-bundle`. <!-- sdd-owner: implementation -->

## Slice A correction / reverification

- Strengthened the path-based architecture guard for the sole provider and `QueryClient` construction, AppProviders import/default policy, and bare or subpath Convex imports under `src/app/**`.
- Reverified with `pnpm test -- tests/architecture/queryZodBoundaries.test.ts` (exit 0; 30 files, 338 tests) and `pnpm typecheck` (exit 0).
- After formatting all five Slice A files, tracked and untracked Slice A changes total **246 authored lines** (226 additions, 20 deletions), below the 400-line budget.

## Slice B — list transport

- **Work unit:** Slice B only; Slice C was not started.
- **RED:** Added the list-only contract matrix before the Zod implementation. `pnpm test -- tests/unit/resourcesMasterApi.test.ts` exited 0 with 30 files / 340 tests because the replaced manual parser was already behavior-equivalent. A black-box RED failure would have required changing the preserved contract, so no failure is claimed.
- **GREEN:** Added private Zod 4 schemas and an explicit list-only projection behind `parseResourceListPage`; its public return type and `bad()` generic error seam remain unchanged. The focused command exited 0 with 30 files / 340 tests.
- **TRIANGULATE:** Added null optional-ID, missing revision, non-string cursor, opaque ID, ignored-extra, no-coercion/no-trim/no-default, and `NaN`/infinite numeric-revision cases. The focused command exited 0 with 30 files / 340 tests.
- **REFACTOR:** Kept schemas private and the projection local to the list parser; Prettier made only test formatting changes. No non-list parser was changed.

### Slice B verification and rollback

- `pnpm typecheck` exited 0 (`pnpm router:generate && tsc -b`; route tree generated in 122ms with no generated-file diff).
- Targeted ESLint, Prettier check, and `git diff --check` exited 0.
- **Rollback boundary:** restore only the manual list-envelope/list-summary path in `src/features/resources-master/resourcesMaster.api.ts` and the Slice B tests/checklist/evidence. Detail, context, creation, mutation, transport, UI, and backend remain independent.
- **Count:** 244 authored lines (220 additions, 24 deletions), below the 400-line limit.
- **Commit verdict:** no commit created (delegated scope); this is one reviewable list-transport work unit.

## Slice C scope split review

- **Review finding:** The original combined Slice C put `manualRetry` and the in-flight `continuation` promise in hook-instance refs rather than state scoped to the active query key. A criteria/key change while either action was in flight could let key A suppress, clear, or alter retry behavior for key B. This is a high-severity cross-key race, not a safe near-budget patch.
- **Decision:** One honest split replaces the combined Slice C. C1 is the feature-local query identity/read model below; C2 is a separate pending work unit for public actions and concurrency. C1 exposes no action, Query observer result, or private error.
- **Revised chain:** `A → B → C1 → C2 → D → E`; D and E now depend on C2. No branch, commit, or PR was created by this delegated work.

## Slice C1 — feature-local query identity and read model

- **Work unit:** C1 only; C2 and Slice D were not started.
- **RED:** The original module-creation RED was observed before implementation: `pnpm exec vitest run tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` exited 1 because the hook module did not exist. The C1 core contract was retained through the scope split.
- **GREEN:** C1 keeps the canonical key, normalized search, deepest filter, exact list/search payload, initial `undefined` cursor, next-page derivation, initial automatic retry, isolated cache behavior, and explicit no-focus/reconnect/remount policy.
- **TRIANGULATE:** C1 tests cover one automatic initial retry, ordered first-page flatten/dedupe, retained continuation state, confirmed-empty/status projection, isolated clients, and focus/reconnect/remount call counts. Public actions, manual-retry state, in-flight continuation state, and their tests were removed for C2.
- **REFACTOR:** The private failure marker and `useMemo` projection remain local. The public C1 result is exactly `items`, `status`, and `isDone`; it contains no raw observer result or private error.

### Slice C1 verification and rollback

- **Focused validation:** `pnpm test -- tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` exited 0: 31 files / 345 tests passed (the Vitest configuration ran the full suite while including both focused files).
- **Formatting and static validation:** targeted `pnpm exec prettier --write` for the four C1 files, `pnpm typecheck`, and `git diff --check` exited 0. `pnpm lint` and repository-wide `pnpm format:check` exit 1 only for pre-existing files outside C1; no out-of-scope file was changed.
- **Rollback boundary:** remove only the current `useResourcesMasterListQuery.ts`, its focused C1 test, and the C1 task/progress evidence. Provider A and transport B remain inert and independent; C2 actions/concurrency and all screen code are absent.
- **Count:** 382 authored lines (362 additions, 20 deletions), below the 400-line limit.
- **Commit verdict:** C1 is commit-ready based on its focused tests, targeted lint/format checks, typecheck and diff check. Repository-wide lint/format failures are pre-existing and outside this work unit; they remain documented without blocking this scoped verdict.

## Historical Slice C2 — actions and concurrency

- **Status:** Completed; D was not started. This evidence is chronological: RED predates C2 implementation, and the review correction/final validation follows the original GREEN/TRIANGULATE/REFACTOR record.
- **RED:** Added controlled-promise hook cases before implementation. `pnpm test -- tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` exited 1: 31 files, 345 passed / 4 failed; the C2 failures included `mounted.result.current.loadMore is not a function` and unmet action-race expectations.
- **GREEN:** Added only `loadMore`, `retry`, and `refetchActive`, each returning a semantic `Promise<void>`. The hook stores continuation/manual-initial markers in a `WeakMap` keyed by React Query's cached canonical query object, so stale key-A callbacks/finally handlers cannot mutate key B.
- **TRIANGULATE:** Controlled A/B criteria races prove manual-retry and continuation finally-order isolation; duplicate continuation sharing, failed-cursor reuse, retained valid pages, void action results, mounted-key-only refetch, one automatic initial retry, and zero automatic continuation retries are covered.
- **REFACTOR:** Prettier retained feature-local bookkeeping and the C1 read projection; test cleanup clears local clients, restores the focus override with `focusManager.setFocused(undefined)`, and retains the online baseline.

### Slice C2 verification and rollback

- Final focused review-correction command: `pnpm exec vitest run tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` exited 0 — 2 files / 35 tests passed. This direct Vitest invocation replaces the script form that ran the whole suite.
- Targeted `pnpm exec eslint src/features/resources-master/useResourcesMasterListQuery.ts tests/unit/useResourcesMasterListQuery.test.tsx`, targeted `pnpm exec prettier --check src/features/resources-master/useResourcesMasterListQuery.ts tests/unit/useResourcesMasterListQuery.test.tsx`, `pnpm typecheck`, and `git diff --check` each exited 0.
- Runtime harness: N/A — D remains the first screen consumer; controlled adapter sequencing covers this feature-local hook boundary.
- **Rollback boundary:** remove C2 actions/bookkeeping and their C2 tests, then restore the C1 three-field return shape and four C2 task boxes. Provider A and transport B remain independent; no UI, cache writes, dependency, backend, or migration change exists.
- **Count:** 348 authored lines (326 additions, 22 deletions), below the 400-line budget.
- **Review focus:** key identity from `QueryCache.find({ exact: true })`, stale-action guards, continuation promise sharing/finally cleanup, and manual-initial retry marker lifetime.
- **Commit verdict:** commit-ready as one C2 work unit; no commit created in delegated scope.

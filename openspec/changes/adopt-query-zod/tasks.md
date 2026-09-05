# Tareas — Adopción acotada de React Query y Zod

## Review Workload Forecast

| Field                   | Value                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Estimated changed lines | 1,120–1,570 total; each review slice is estimated below 400                                  |
| 400-line budget risk    | High                                                                                         |
| Chained PRs recommended | Yes                                                                                          |
| Suggested split         | PR 1 (A) → PR 2 (B) → PR 3 (C1) → PR 4 (C2) → PR 5 (D) → PR 6 (E1a) → PR 7 (E1b) → PR 8 (E2) |
| Delivery strategy       | ask-on-risk                                                                                  |
| Chain strategy          | feature-branch-chain                                                                         |

Decision needed before apply: No — resolved by the user
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The aggregate forecast exceeds the 400-line review budget even though every autonomous slice is bounded below it. Before apply, the parent must choose the chain strategy or explicitly authorize an alternative under `ask-on-risk`; do not combine C1 and C2, or C2 and D. Stop and escalate before starting a slice whose measured or updated estimate reaches 400 authored additions plus deletions.

**Verified prerequisite:** `@tanstack/react-query@5.102.8` and `zod@4.5.4` are direct exact dependencies resolved in `package.json` and `pnpm-lock.yaml`; installation is complete and neither file is changed by this work.

## Slice plan and boundaries

| Slice                                                | Estimate | Depends on            | Start → finish boundary                                                                                                | Rollback boundary                                                                                                                                         |
| ---------------------------------------------------- | -------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — provider                                         |  140–210 | Verified prerequisite | No Query provider → stable per-mount provider with no consumers                                                        | Remove the `AppProviders` wrapper/initializer and its tests; no persistent data exists.                                                                   |
| B — list transport                                   |  180–260 | Verified prerequisite | Manual list parser → Zod-backed `parseResourceListPage` with identical public DTO                                      | Restore only the manual list-envelope/list-summary path in `resourcesMaster.api.ts`; leave non-list parsers untouched.                                    |
| C1 — query identity and read model                   |  220–320 | A, B                  | No hook → isolated `useInfiniteQuery` identity/read projection without screen consumer                                 | Remove `useResourcesMasterListQuery.ts` and its focused C1 tests; A may remain inert.                                                                     |
| C2 — query actions and concurrency                   |  260–360 | C1                    | C1 read model → key-scoped semantic actions and continuation/retry concurrency                                         | Restore the C1 read-model return shape and remove only C2 action/concurrency code and tests.                                                              |
| D — screen migration                                 |  280–380 | C2                    | Manual list controller wired to screen → Query hook projects onto unchanged JSX                                        | Restore `createResourcesMasterListController` and `useSyncExternalStore` wiring in `ResourcesMasterScreen.tsx`; retain the existing controller and tests. |
| E1a — active-observer post-create refetch            |   80–140 | C2, D                 | No confirmed-create refresh → refetch only the active observed list key with one focused unit test                     | Remove only the screen callback, E1a refetch test, and E1a evidence; confirmed backend creations are not reverted.                                        |
| E1b — explicit-import architecture guardrails        |  260–380 | E1a                   | HEAD architecture guard → explicit Query/Zod/Convex import governance plus provider/hook strict AST boundary coverage. | Restore the architecture guard and E1b evidence; E1a post-create behavior remains independently reviewable.                                               |
| E2 — browser regression and lifecycle reconciliation |  180–280 | E1b                   | E1b guardrails → focused browser regression, final repository verification, and parent reconciliation/review receipts  | Remove only E2 E2E/verification evidence after deciding the parent lifecycle disposition; E1a/E1b remain independently reviewable.                        |

## A — Provider transversal mínimo (140–210 lines)

**Focused verification:** `pnpm test -- tests/unit/appProviders.test.tsx tests/architecture/queryZodBoundaries.test.ts` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR run `pnpm typecheck`. **Runtime harness:** N/A — this provider-only slice has no standalone user flow; Router composition is asserted by the focused component test.

- [x] **RED:** Add failing cases in `tests/unit/appProviders.test.tsx` for Router composition, one `QueryClient` identity across rerenders of one `AppProviders` mount, and a distinct identity after a new mount; add the initial allowlist assertions in `tests/architecture/queryZodBoundaries.test.ts` for the sole provider location and no Convex import under `src/app/**`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `src/app/providers/AppProviders.tsx` to create `QueryClient` with a `useState` lazy initializer and wrap the existing `RouterProvider` in `QueryClientProvider`; import no feature, Convex API, domain API, singleton, devtools, persistence, or global defaults. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Extend `tests/unit/appProviders.test.tsx` to prove an independent remount receives a new client while the Router still renders, and extend `tests/architecture/queryZodBoundaries.test.ts` to reject module-level `QueryClient` construction and provider duplication. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Reduce `src/app/providers/AppProviders.tsx` and the two focused tests to the smallest explicit per-mount composition while preserving the passing identity, Router, and import-boundary assertions; rerun the focused command and `pnpm typecheck`. <!-- sdd-owner: implementation -->

## B — Frontera Zod de la lista (180–260 lines)

**Focused verification:** `pnpm test -- tests/unit/resourcesMasterApi.test.ts` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR rerun that command and `pnpm typecheck`. **Runtime harness:** N/A — this is a transport-boundary-only slice; observable UI coverage belongs to D, E1a, E1b, and E2.

- [x] **RED:** Extend `tests/unit/resourcesMasterApi.test.ts` with failing list-only equivalence cases for opaque IDs, `organizacionId` absent/present, all three classification states, string-only reasons, ignored extra envelope/item/status fields, and invalid envelope/item/status values that expose exactly `Invalid resources master response` rather than payload or `ZodError`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** In `src/features/resources-master/resourcesMaster.api.ts`, add private Zod 4 schemas and an explicit projection used only by exported `parseResourceListPage`; retain its public return type and `bad()` seam, preserve references/copies and optionality, and do not change detail, context, creation, mutation, or transport parsers. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Add boundary values to `tests/unit/resourcesMasterApi.test.ts` proving no coercion, trim, default, business inference, or conversion of opaque IDs occurs, including the current acceptance semantics for numeric `revision` and rejection of `null` IDs or non-string cursors. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Keep Zod schema symbols private and simplify only the list-parser projection in `src/features/resources-master/resourcesMaster.api.ts`; rerun the focused API command to confirm non-list parser coverage remains green. <!-- sdd-owner: implementation -->

## C1 — Hook `useInfiniteQuery`: identidad y modelo de lectura (220–320 lines)

**Focused verification:** `pnpm test -- tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` (focused command must exit 0); after the focused run, execute lint, Prettier check, `pnpm typecheck`, and `git diff --check`. **Runtime harness:** N/A — the hook deliberately has no screen consumer until D; isolated adapter calls and the public read model are covered in the hook test.

- [x] **RED:** Added the failing hook-contract cases with a fresh `QueryClient` and local `QueryClientProvider` per case for key identity, trimmed search, deepest effective hierarchy filter, list-versus-search payload, initial cursor, isolated caches, and no Convex import. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Added `src/features/resources-master/useResourcesMasterListQuery.ts` as a feature-local hook that calls only `ResourcesMasterApi`, derives the exact `['resources-master', 'list', normalizedSearchText, effectiveLevel, effectiveId]` key and matching payload, and configures `useInfiniteQuery` with the approved initial page parameter, next-page derivation, initial automatic retry, and no focus/reconnect/remount refetch. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Covered exactly one automatic initial retry, ordered first-page flatten/dedupe, retained continuation state, confirmed-empty semantics, semantic initial-error projection without a private error, and no focus/reconnect/remount refetch; global focus/online state is restored in `finally`. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Kept the technical failure marker and `useMemo` projection private; C1 exposes only `items`, `status`, and `isDone`, not Query observer results, errors, or actions. <!-- sdd-owner: implementation -->

## C2 — Hook `useInfiniteQuery`: acciones y concurrencia (260–360 lines)

**Focused verification:** `pnpm test -- tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/resourcesMasterApi.test.ts` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR rerun the focused command and `pnpm typecheck`. **Runtime harness:** N/A — D remains the first screen consumer; adapter call sequencing and semantic action promises are covered in isolation.

- [x] **RED:** Add failing hook cases for key-scoped manual retry and continuation state, cross-key races, duplicate CTA suppression, cursor reuse after partial failure, partial-error recovery with retained pages, semantic void action promises, and observer-local refetch. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add public `loadMore`, `retry`, and `refetchActive` semantic actions without exposing Query observer results or private errors; keep C1 key, payload, initial page parameter, next-page derivation, and read projection unchanged. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Prove a key change cannot inherit or clear another key's manual-retry/continuation state; prove repeated CTA activation shares one continuation, retries reuse the failed cursor, partial errors retain valid pages, action promises resolve `void`, and refetch targets only the mounted observer key. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Encapsulate per-key action/concurrency bookkeeping and preserve C1's private failure marker and `useMemo` read model; clear locally created test clients and rerun the focused command. <!-- sdd-owner: implementation -->

## D — Criterio atómico y wiring de pantalla (280–380 lines)

**Focused verification:** `pnpm test -- tests/unit/resourcesMasterScreen.test.tsx tests/unit/useResourcesMasterListQuery.test.tsx` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR rerun the focused command and `pnpm typecheck`. **Runtime harness:** N/A — the workstation browser regression is intentionally deferred to E2, while the component flow is covered in this slice.

- [x] **RED:** Adapted `tests/unit/resourcesMasterScreen.test.tsx` to mount a fresh isolated `QueryClient`; the focused screen+hook command failed before migration because the expected canonical query was absent. Existing observable regressions cover one initial read, 249/250 ms search debounce, empty-input 0 ms commit, hierarchy change cancelling a pending debounce, deepest-filter payload, unchanged copy/roles/CTA states, deduped continuation, and visible rows after partial error. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Updated `src/features/resources-master/ResourcesMasterScreen.tsx` to retain local input, API identity, hierarchy selection, command registration, JSX, copy, classes, and accessibility while replacing only list-controller projection with `useResourcesMasterListQuery.ts`; atomic committed criteria give the hook one consistent search-plus-hierarchy snapshot. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Screen cases cover repeated load-more activation while pending, `Reintentar` and `Reintentar continuación` routing to semantic hook actions, confirmed empty only after a valid done page, deduped retained rows through partial-error retry, and the existing keyboard spatial search contract without a new document listener. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Removed only superseded list-controller wiring from `src/features/resources-master/ResourcesMasterScreen.tsx`; `src/features/resources-master/useResourcesMasterList.ts` and its existing tests remain the rollback seam. No visual/Tailwind/shared-UI changes were made; reran focused validation. <!-- sdd-owner: implementation -->

## E1a — Refresco post-creación del observador activo (80–140 lines)

**Focused verification:** `pnpm exec vitest run tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/useResourcesMasterListQuery.test.tsx` must exit 0. **Runtime harness:** N/A — browser regression is E2.

- [x] **RED:** Added a failing post-create unit case: the active observed key did not refetch after the confirmed callback (1 failed, expected 2 calls but received 1). <!-- sdd-owner: implementation -->
- [x] **GREEN:** Changed only `ResourcesMasterScreen` to fire-and-forget `refetchActive()` from `onCreated`; `CrearRecursoSurface`, mutations, cache writes, optimistic updates, and invalidation remain untouched. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** The focused unit test seeds a different exact key and proves it remains idle and unchanged after confirmed creation. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Kept the semantic callback and fresh-`QueryClient` test harness minimal; no architecture guardrail change belongs to E1a. <!-- sdd-owner: implementation -->

## E1b — Guardrails de arquitectura de importaciones explícitas (260–380 lines)

**Status:** Completed only after the focused architecture and E1a regression commands pass; E2 remains pending.

**Focused verification:** Run `pnpm exec vitest run tests/architecture/queryZodBoundaries.test.ts`; run the E1a refetch/screen/hook command as a regression. **Runtime harness:** N/A — browser regression is E2.

- [x] **RED:** Add architecture fixtures for protected-package namespace/default/aliased imports, dynamic import, `require`, import-equals, re-export, Zod/Convex subpaths, and provider shape violations. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Enforce explicit static named imports for protected runtime Query/Zod/Convex consumption: approved files have exact binding sets, and `AppProviders` has one array-bound zero-argument lazy `QueryClient` used by its sole provider. The hook rejects unapproved Query bindings and direct forbidden cache/action member names. TypeScript-only import types remain allowed because compilation erases them; this is runtime import governance, not whole-program dataflow analysis. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Prove string/template dynamic and require syntax, discarded constructors, and unrelated provider clients are rejected; comments, strings, and similarly named unrelated packages do not false-positive. Retain integration-wrapper and exact root/subpath coverage. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Keep local AST syntax checks and explicit allowlists in the architecture test; do not add alias propagation/dataflow logic, and rerun the focused architecture plus E1a regression commands. <!-- sdd-owner: implementation -->

## E2 — Regresión de navegador y reconciliación de ciclo de vida (180–280 lines)

**Focused verification:** After E1b, `pnpm test:e2e -- tests/e2e/resourcesMaster.workstation.spec.ts` must exit 0 for no-focus-refetch, partial-error retention/retry, active-list-only post-create refresh, Keyboard First paths, and axe. Then run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `pnpm verify:runtime-bundle`.

- [x] Extend the focused E2E regression with the window-targeted visible `visibilitychange` listener check and operation/key-specific active-only create refresh counts; do not weaken axe, continuation, or Keyboard First coverage. <!-- sdd-owner: implementation -->
- [ ] Record final repository-wide verification, review receipts, rollback disposition, and parent three-way spec reconciliation before archive/sync. <!-- sdd-owner: parent -->

## Parent-owned delivery and lifecycle gates

- [x] Before apply, choose and record the delivery chain strategy for the estimated 1,120–1,570-line total. The user selected `feature-branch-chain`; A, B, C1, C2, D, E1a, E1b, and E2 remain separate review units so no combined A+B diff can exceed the 400-line budget. <!-- sdd-owner: parent -->
- [x] After slice E2 and before synchronizing or archiving either change, perform the required three-way reconciliation of `openspec/specs/frontend-foundation/spec.md`, `openspec/changes/catalog-hierarchy-base/specs/frontend-foundation/spec.md`, and `openspec/changes/adopt-query-zod/specs/frontend-foundation/spec.md`; retain both the Catálogo feature-local Convex exception and the Resources-only feature-local Query exception, keep Query prohibited in Catálogo, and record the merge-order resolution. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for each completed A, B, C1, C2, D, E1a, E1b, and E2 slice, checking its measured additions plus deletions against the 400-line budget, its focused command result, its runtime scenario result, and its stated rollback boundary before accepting the next slice. <!-- sdd-owner: parent -->

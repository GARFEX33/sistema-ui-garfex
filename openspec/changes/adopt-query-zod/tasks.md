# Tareas — Adopción acotada de React Query y Zod

## Review Workload Forecast

| Field                   | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| Estimated changed lines | 1,120–1,570 total; each review slice is estimated below 400       |
| 400-line budget risk    | High                                                              |
| Chained PRs recommended | Yes                                                               |
| Suggested split         | PR 1 (A) → PR 2 (B) → PR 3 (C1) → PR 4 (C2) → PR 5 (D) → PR 6 (E) |
| Delivery strategy       | ask-on-risk                                                       |
| Chain strategy          | feature-branch-chain                                              |

Decision needed before apply: No — resolved by the user
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The aggregate forecast exceeds the 400-line review budget even though every autonomous slice is bounded below it. Before apply, the parent must choose the chain strategy or explicitly authorize an alternative under `ask-on-risk`; do not combine C1 and C2, or C2 and D. Stop and escalate before starting a slice whose measured or updated estimate reaches 400 authored additions plus deletions.

**Verified prerequisite:** `@tanstack/react-query@5.102.8` and `zod@4.5.4` are direct exact dependencies resolved in `package.json` and `pnpm-lock.yaml`; installation is complete and neither file is changed by this work.

## Slice plan and boundaries

| Slice                               | Estimate | Depends on            | Start → finish boundary                                                                             | Rollback boundary                                                                                                                                              |
| ----------------------------------- | -------: | --------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — provider                        |  140–210 | Verified prerequisite | No Query provider → stable per-mount provider with no consumers                                     | Remove the `AppProviders` wrapper/initializer and its tests; no persistent data exists.                                                                        |
| B — list transport                  |  180–260 | Verified prerequisite | Manual list parser → Zod-backed `parseResourceListPage` with identical public DTO                   | Restore only the manual list-envelope/list-summary path in `resourcesMaster.api.ts`; leave non-list parsers untouched.                                         |
| C1 — query identity and read model  |  220–320 | A, B                  | No hook → isolated `useInfiniteQuery` identity/read projection without screen consumer              | Remove `useResourcesMasterListQuery.ts` and its focused C1 tests; A may remain inert.                                                                          |
| C2 — query actions and concurrency  |  260–360 | C1                    | C1 read model → key-scoped semantic actions and continuation/retry concurrency                      | Restore the C1 read-model return shape and remove only C2 action/concurrency code and tests.                                                                   |
| D — screen migration                |  280–380 | C2                    | Manual list controller wired to screen → Query hook projects onto unchanged JSX                     | Restore `createResourcesMasterListController` and `useSyncExternalStore` wiring in `ResourcesMasterScreen.tsx`; retain the existing controller and tests.      |
| E — explicit refresh and guardrails |  220–340 | C2, D                 | No Query refresh/allowlist evidence → active-list refresh and complete boundary/regression evidence | Restore the `CrearRecursoSurface` callback to the previous controller start path and remove only E tests/guards; confirmed backend creations are not reverted. |

## A — Provider transversal mínimo (140–210 lines)

**Focused verification:** `pnpm test -- tests/unit/appProviders.test.tsx tests/architecture/queryZodBoundaries.test.ts` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR run `pnpm typecheck`. **Runtime harness:** N/A — this provider-only slice has no standalone user flow; Router composition is asserted by the focused component test.

- [x] **RED:** Add failing cases in `tests/unit/appProviders.test.tsx` for Router composition, one `QueryClient` identity across rerenders of one `AppProviders` mount, and a distinct identity after a new mount; add the initial allowlist assertions in `tests/architecture/queryZodBoundaries.test.ts` for the sole provider location and no Convex import under `src/app/**`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `src/app/providers/AppProviders.tsx` to create `QueryClient` with a `useState` lazy initializer and wrap the existing `RouterProvider` in `QueryClientProvider`; import no feature, Convex API, domain API, singleton, devtools, persistence, or global defaults. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Extend `tests/unit/appProviders.test.tsx` to prove an independent remount receives a new client while the Router still renders, and extend `tests/architecture/queryZodBoundaries.test.ts` to reject module-level `QueryClient` construction and provider duplication. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Reduce `src/app/providers/AppProviders.tsx` and the two focused tests to the smallest explicit per-mount composition while preserving the passing identity, Router, and import-boundary assertions; rerun the focused command and `pnpm typecheck`. <!-- sdd-owner: implementation -->

## B — Frontera Zod de la lista (180–260 lines)

**Focused verification:** `pnpm test -- tests/unit/resourcesMasterApi.test.ts` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR rerun that command and `pnpm typecheck`. **Runtime harness:** N/A — this is a transport-boundary-only slice; observable UI coverage belongs to D and E.

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

**Focused verification:** `pnpm test -- tests/unit/resourcesMasterScreen.test.tsx tests/unit/useResourcesMasterListQuery.test.tsx` (RED is expected to fail before GREEN; GREEN/TRIANGULATE/REFACTOR must exit 0); after REFACTOR rerun the focused command and `pnpm typecheck`. **Runtime harness:** N/A — the workstation browser regression is intentionally deferred to E, while the component flow is covered in this slice.

- [ ] **RED:** Adapt `tests/unit/resourcesMasterScreen.test.tsx` to mount a fresh isolated `QueryClient` and add failing observable regressions for one initial read, 249/250 ms search debounce, empty-input 0 ms commit, hierarchy change cancelling a pending debounce, deepest-filter payload, unchanged copy/roles/CTA states, deduped continuation, and visible rows after partial error. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Update `src/features/resources-master/ResourcesMasterScreen.tsx` to retain local input, focus, API identity, hierarchy selection, command registration, JSX, copy, classes, and accessibility while replacing only list-controller projection with `useResourcesMasterListQuery.ts`; use atomic committed criteria so the hook sees one consistent search-plus-hierarchy snapshot. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Extend `tests/unit/resourcesMasterScreen.test.tsx` to cover repeated load-more activation while pending, `Reintentar` and `Reintentar continuación` routing to the semantic hook actions, confirmed empty state only after a valid done page, and preservation of keyboard/search focus behavior without a new document listener. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Remove only superseded list-controller wiring from `src/features/resources-master/ResourcesMasterScreen.tsx`; keep `src/features/resources-master/useResourcesMasterList.ts` and its existing tests as the rollback seam, avoid visual/Tailwind/shared-UI changes, and rerun the focused command. <!-- sdd-owner: implementation -->

## E — Refresco activo, límites y regresión (220–340 lines)

**Focused verification:** `pnpm test -- tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/architecture/queryZodBoundaries.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` (RED is expected to fail before GREEN; final run must exit 0). **Runtime harness:** `pnpm test:e2e -- tests/e2e/resourcesMaster.workstation.spec.ts` must exit 0 while exercising no-focus-refetch, retained rows after continuation failure/retry, active-list-only post-create refresh, Keyboard First paths, and axe.

- [ ] **RED:** Create failing `tests/unit/resourcesMasterScreenRefetch.test.tsx` cases proving a confirmed `CrearRecursoSurface` completion refetches only the currently observed key, never uses `useMutation`, cache writes, prefix invalidation, or refreshes a seeded different key; add expected focus/reconnect call-count cases to the focused query/screen tests. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Change only the `onCreated` callback in `src/features/resources-master/ResourcesMasterScreen.tsx` to fire-and-forget `refetchActive()` from the active list hook after the existing creation flow confirms success; do not edit `CrearRecursoSurface.tsx`, migrate submit state, or add optimistic/cache-edit behavior. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Create `tests/architecture/queryZodBoundaries.test.ts` assertions with file-level allowlists: React Query only in `src/app/providers/AppProviders.tsx` and `src/features/resources-master/useResourcesMasterListQuery.ts`; Zod only in `src/features/resources-master/resourcesMaster.api.ts`; no Query in Catálogo, hierarchy, forms, keyboard, Router, or `src/shared/**`; and no persistence, persister, broadcast, devtools, Zustand, Redux, shared wrapper, or Convex imports in `src/app/**`/the hook. Extend `tests/e2e/resourcesMaster.workstation.spec.ts` for no focus refetch, partial-error retention/retry, and active-list-only post-create refresh while preserving axe and keyboard paths. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Consolidate only duplicated test setup within their existing test files, preserve a fresh QueryClient per render/case, run the focused unit/architecture command and focused E2E command, then run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `pnpm verify:runtime-bundle`. <!-- sdd-owner: implementation -->

## Parent-owned delivery and lifecycle gates

- [x] Before apply, choose and record the delivery chain strategy for the estimated 1,120–1,570-line total. The user selected `feature-branch-chain`; A, B, C1, C2, D and E remain separate review units so no combined A+B diff can exceed the 400-line budget. <!-- sdd-owner: parent -->
- [ ] After slice E and before synchronizing or archiving either change, perform the required three-way reconciliation of `openspec/specs/frontend-foundation/spec.md`, `openspec/changes/catalog-hierarchy-base/specs/frontend-foundation/spec.md`, and `openspec/changes/adopt-query-zod/specs/frontend-foundation/spec.md`; retain both the Catálogo feature-local Convex exception and the Resources-only feature-local Query exception, keep Query prohibited in Catálogo, and record the merge-order resolution. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for each completed A, B, C1, C2, D and E slice, checking its measured additions plus deletions against the 400-line budget, its focused command result, its runtime scenario result, and its stated rollback boundary before accepting the next slice. <!-- sdd-owner: parent -->

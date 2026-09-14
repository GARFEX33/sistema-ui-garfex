# Apply progress — replace-convex-with-rest-backend

## Unit 1 — Contrato REST de catálogo y frontera permitida

**Status:** blocked before RED/GREEN; task checkbox remains unchecked.

### Evidence reviewed

- Native status: `apply: ready`; same runtime attempt authenticated with the supplied continuation token for `rest-contract-boundary` (400-line limit).
- `api-contract-evidence.md` defines `CatalogRecord` only as `{ kind, id: string, revision: string, active: boolean, values: typed map, rules: [] }` and confirms only `CODE.value` and `TEXT.value` wire values.
- The artifact names reference-valued descriptor fields, but does not define the JSON representation of a reference, `DECIMAL`, `QUANTITY`, the other seven `CatalogValue` variants, or any non-empty rule shape.
- `design.md` explicitly prohibits inventing the discriminant, `targetId`, `DECIMAL`/`QUANTITY` representation, and rule payload.

### Blocker

Unit 1 requires exact Zod schemas and RED cases for all eleven `CatalogValue` variants, references, and rules. The only permitted public-evidence artifact lacks the required wire shapes, so a test fixture or schema for those variants would invent contract data. Provide the complete public OpenAPI schema extract (including all eleven variant objects, reference object fields, and `rules` item schema) in `api-contract-evidence.md` or an explicitly approved public-evidence artifact.

A subsequent GREEN run will also require authorization to edit `tests/architecture/queryZodBoundaries.test.ts`: its current production scan allows `zod` only in `src/features/resources-master/resourcesMaster.api.ts`, while this unit requires the approved shared Zod contract module. No such edit was made under the narrow file authorization.

### TDD Cycle Evidence

| Task   | Test file                                            | Layer        | Safety net      | RED                                                             | GREEN       | TRIANGULATE | REFACTOR    |
| ------ | ---------------------------------------------------- | ------------ | --------------- | --------------------------------------------------------------- | ----------- | ----------- | ----------- |
| Unit 1 | `tests/unit/catalogRestContract.test.ts`             | Unit         | N/A (new files) | Blocked: exact public DTO forms unavailable                     | Not started | Not started | Not started |
| Unit 1 | `tests/architecture/restTransportBoundaries.test.ts` | Architecture | N/A (new file)  | Blocked: transport guard cannot substitute missing DTO contract | Not started | Not started | Not started |

### Files changed

- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md` (this blocker record only)

### Test commands

- No RED or GREEN command was run: writing expected fixtures without the public wire schema would violate the no-invention contract.

### Remaining implementation tasks

- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** in `tests/unit/catalogRestContract.test.ts` and `tests/architecture/restTransportBoundaries.test.ts`, write first cases for the documented full catalogue DTO contract, then implement only the exact schemas and allowed transport boundary.

### Workload / PR boundary

- Assigned boundary remains `rest-contract-boundary` / stacked-to-main; 0 production and test lines changed, 0/400 implementation lines consumed.
- Rollback boundary for this attempt is only this apply-progress blocker record; no runtime code, adapter, task checkbox, backend, branch, commit, or PR changed.

### Action-context warning

- `repo-local` workspace and allowed edit root were valid. The stop is contractual evidence insufficiency, not workspace authority.

## Unit 1 retry — public schemas supplied

**Status:** complete. The maintainer-authorized retry used the complete public OpenAPI evidence and remediates the prior blocked evidence revision `sha256:65abc3352747e28ceaaa654ba5e44001038def400803b832cd301958b3bf4786`.

### Completed work

- Added strict Zod schemas for the eleven documented `CatalogValue` variants, strict references, `ApplicabilityRule`, `CatalogRecord`, `CatalogPage`, and `{ error: string }` in `src/shared/catalog/catalogRest.contract.ts`.
- Added the minimal discriminated `RestFailure` type in `src/shared/api/restFailure.ts`.
- Added AST coverage that permits direct, `globalThis`, `window`, or aliased `fetch` only in the three approved adapters; no adapter behavior changed.
- Narrowly added `catalogRest.contract.ts` to the existing Zod import whitelist.
- Marked the sole implementation-owned unit-1 task `[x]`; no other checkbox changed.

### TDD Cycle Evidence

| Task              | Test file                                            | Layer        | Safety net                                                                | RED                                                                                                           | GREEN                                                      | TRIANGULATE                                                          | REFACTOR                                              |
| ----------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit 1 schemas    | `tests/unit/catalogRestContract.test.ts`             | Unit         | `pnpm test -- tests/architecture/queryZodBoundaries.test.ts` → 615 passed | `pnpm exec vitest run tests/unit/catalogRestContract.test.ts` → failed resolving missing contract module      | same command → 3 passed                                    | 11 valid/invalid variant pairs plus complete record/page/error cases | None needed; schemas remain direct public projections |
| Unit 1 boundaries | `tests/architecture/restTransportBoundaries.test.ts` | Architecture | N/A (new test)                                                            | `pnpm exec vitest run tests/architecture/queryZodBoundaries.test.ts` → 1 failed: shared Zod import unapproved | same command → 5 passed after the exact whitelist addition | direct/global/window/aliased fetch fixtures plus all approved paths  | None needed; AST walk is minimal                      |

### Verification

- Focused GREEN: `pnpm exec vitest run tests/unit/catalogRestContract.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts` → 3 files, 11 tests passed.
- Required full suite: `pnpm test` → 59 files, 621 tests passed.
- Runtime harness: N/A; this unit is pure schema/type and static AST-boundary work, with no backend or browser runtime boundary invoked.

### Files changed in retry

- `src/shared/catalog/catalogRest.contract.ts`
- `src/shared/api/restFailure.ts`
- `tests/unit/catalogRestContract.test.ts`
- `tests/architecture/restTransportBoundaries.test.ts`
- `tests/architecture/queryZodBoundaries.test.ts`
- `openspec/changes/replace-convex-with-rest-backend/tasks.md`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Workload / boundary

- `rest-contract-boundary`, stacked-to-main; 320 additions + deletions in the correction candidate, within the 400-line limit.
- Rollback: remove only the two shared contract modules, the two new tests, the narrow Zod whitelist addition, and this unit's task/progress updates. No adapters, screens, backend, branch, commit, or PR changed.

### Remaining tasks

- Units 2–11 remain unchecked and were intentionally not implemented.

## Unit 2 — Configuración local, actor y proxy de desarrollo

**Status:** complete for `rest-local-config-proxy` (stacked-to-main; no commit, branch, push, PR, backend access, or environment-file edit).

### Completed work

- Configured Vite's development `server.proxy['/v1']` to target `http://localhost:8090` without a rewrite, preserving the public prefix and adding no production/CORS configuration.
- Added `VITE_REST_ACTOR?: string` typing in `src/vite-env.d.ts`.
- Added the reusable `resolveRestActor` / `withRestActor` mutation seam. It accepts only a non-empty, non-whitespace string, honors an explicit test override without normalization, and rejects before its mutation callback otherwise.
- Marked the sole implementation-owned Unit 2 task `[x]` in `tasks.md` immediately after its full suite verification.

### Scope boundary and deviation from future adapter enforcement

The three feature adapters remain Convex in this slice and were deliberately not rewritten or wrapped, so existing UI behavior is unchanged. No REST adapter or REST mutation exists yet to make a real HTTP request: the focused tests prove that the shared mutation callback is never invoked for missing, empty, or whitespace actor configuration, including direct create/update/lifecycle-shaped callbacks. Later REST migration units must invoke `withRestActor` at each real mutation boundary; this unit does not claim that current Convex mutations authenticate, carry REST actors, or send REST requests. Existing reads do not invoke the mutation seam, and no actor header/body mechanism was introduced for reads.

### TDD Cycle Evidence

| Task              | Test file                                   | Layer              | Safety net                                                                                                                                                           | RED                                                                 | GREEN                                      | TRIANGULATE                                                                                              | REFACTOR                                          |
| ----------------- | ------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Unit 2 actor seam | `tests/unit/restActorConfiguration.test.ts` | Unit               | `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts tests/unit/catalogTypeAttributesApi.test.ts tests/unit/resourcesMasterApi.test.ts` → 3 files, 69 passed | Focused run failed because `src/shared/api/restActor` did not exist | Focused run → 4 actor tests passed         | Added direct create/update/lifecycle-shaped callback cases; focused run → 7 actor + 1 proxy tests passed | None needed; the pure boundary remains minimal    |
| Unit 2 proxy      | `tests/unit/restProxyConfiguration.test.ts` | Unit/static config | N/A (new test)                                                                                                                                                       | Focused proxy run failed: `/v1` entry was undefined                 | Focused run → proxy and actor tests passed | The assertion also proves no `rewrite` property                                                          | None needed; target is the direct Vite projection |

### Verification

- Focused RED: `pnpm exec vitest run tests/unit/restActorConfiguration.test.ts tests/unit/restProxyConfiguration.test.ts` → failed because the actor module was absent; initial proxy loader was incompatible with this test environment, so it was replaced before production code with a static AST configuration test; `pnpm exec vitest run tests/unit/restProxyConfiguration.test.ts` → 1 failed (`/v1` undefined).
- Focused GREEN / triangulation / refactor: `pnpm exec vitest run tests/unit/restActorConfiguration.test.ts tests/unit/restProxyConfiguration.test.ts` → 2 files, 8 passed.
- Required suite: `pnpm test` → 61 files, 629 tests passed.
- Type check: `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- Runtime harness: N/A. This slice configures local development and validates pure callbacks/static Vite configuration; it did not start a server, browser, or backend and sent no HTTP request.

### Files changed

- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/shared/api/restActor.ts`
- `tests/unit/restActorConfiguration.test.ts`
- `tests/unit/restProxyConfiguration.test.ts`
- `openspec/changes/replace-convex-with-rest-backend/tasks.md`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Remaining work / workload boundary

- The assigned Unit 2 implementation-owned checkbox is visibly `[x]`; Units 3–11 and parent-owned lifecycle actions remain as persisted unchecked lines in `tasks.md` and are outside this work unit.
- Work-unit boundary: `rest-local-config-proxy`, delivery `auto-chain` / `stacked-to-main`; source and tests add 144 lines before SDD artifact updates, within the provider's 260-line objective budget. No delivery action was taken.
- Rollback: remove only the proxy entry, Vite typing, `restActor` seam, its two unit tests, and this Unit 2 task/progress evidence. This neither changes backend data nor requires a runtime fallback.

### Structured status consumed

- Parent context selected `replace-convex-with-rest-backend`, reported apply ready with 2/24 tasks complete, resolved delivery as `auto-chain` / `stacked-to-main`, set `repo-local` allowed root `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and supplied the continuation token for this bounded unit.
- The injected native status snapshot still named an ambiguous change selection; the parent’s explicit current change/work-unit context resolved that selection for this attempt. No authentication claim is made in this artifact.

## Unit 3 — pre-implementation boundary check

**Status:** blocked before RED. The parent supplied continuation token `sha256:05e5d85abbd815fea3bbe938945611347b2b7d6f45ca3504b685c69432582d87` for `catalog-rest-read-window`; this attempt consumed that supplied context and did not acquire a token.

### Blocker

The only runtime consumer, `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`, is outside the allowed edit surfaces. It constructs `createCatalogHierarchyConvexApi()` and gives its class list to the current cursor-based `createCatalogListSequence`; its class adapter calls `api.listClasses({ cursor })` and its UI calls `continue()`. Making Clase actually use `GET /v1/catalog/CLASE` and replacing the cursor with an offset window therefore requires editing that screen (or it would leave the live screen on Convex / require a forbidden synthetic cursor seam).

Adding only a new REST factory, types, and isolated window state within the authorized files would not migrate the rendered Clase read. Keeping the existing screen contract by translating REST `hasPrevious`/`hasNext` into `continuationCursor`/`isExhausted` would falsely claim cursor semantics, which this unit expressly forbids. No Familia/Tipo operation, parent filtering, backend, test fixture calling a live service, branch, commit, push, or PR was touched.

### Evidence reviewed

- `CatalogPage` is the strict public `{ records, hasPrevious, hasNext }` envelope; Clase `code` and `name` are nested typed values.
- Public `GET /v1/catalog/CLASE` permits only `scope`, `text`, `limit`, and `offset`; it has no parent filter.
- The authorized existing tests are present under the exact requested names, so the blocker is the unlisted runtime source surface rather than a test-path mismatch.

### TDD Cycle Evidence

| Task   | Test file                                                                                                                  | RED                                                                                                                    | GREEN       | TRIANGULATE | REFACTOR    |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- | ----------- |
| Unit 3 | `tests/unit/catalogHierarchyApi.test.ts`, `tests/unit/useCatalogList.test.ts`, `tests/unit/catalogHierarchyState.test.tsx` | Blocked before writing a test: no allowed path can connect the required REST offset behavior to the runtime Clase list | Not started | Not started | Not started |

### Files changed

- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md` (this blocker record only)

### Test commands

- Not run. A RED test was not written because the permitted production surfaces cannot satisfy it without an unlisted screen edit.

### Remaining task and requested decision

- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** convert Clase to REST read and feature-local offset windows.
- Grant `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` as an allowed edit surface for the Clase-only wiring, or explicitly approve an alternative narrow integration seam that does not retain/synthesize cursor semantics. The change must remain below the 400-line work-unit cap.

### Workload / action context

- Delivery remains `auto-chain` / `stacked-to-main`, unit boundary `catalog-rest-read-window`; 0 implementation lines changed and no PR boundary was produced.
- The explicit parent change/unit selection resolves the stale ambiguous native snapshot for this attempt. `repo-local` authority and the supplied allowed edit roots were otherwise valid.

## Unit 3 remediation — test-surface boundary check

**Status:** blocked before RED. The parent settled the previous scope outcome as failed evidence `sha256:92efc36896a722e2c1f8d581007f079e032669f350ed3bf4de609fce5bc01fdd` and supplied remediation proceed token `sha256:8c2d326afe55fa66022525b40b0b085c4759878c67c8298096662dd8648cd2f9`. This retry authenticated that same active attempt with `gentle-ai sdd-attempt acquire --token`; it returned `proceed` and the binding requires any future passing settlement to name the failed evidence and distinct remediation evidence.

### Blocker

`tests/unit/catalogHierarchyScreen.test.tsx` is an existing affected test but is not an allowed edit surface. It mocks only `createCatalogHierarchyConvexApi` and asserts the current cursor contract for Clase (`listClasses({ cursor: undefined })`, `Cargar más…`, and partial-cursor retry). A truthful screen migration to the authorized REST factory and feature-local offset windows changes that test's factory seam, request shape, and visible pagination controls. Leaving it unchanged makes `pnpm test` fail; adding a runtime branch solely to preserve the test would be a forbidden fallback/staging fake.

The previously blocked runtime source `CatalogHierarchyScreen.tsx` is now authorized, but the affected test is not. The three Unit 3 test filenames named in the task exist and are authorized; this distinct blocker is the unlisted screen regression test discovered before writing RED or production code. No backend request, source/test implementation edit, Familia/Tipo migration, synthetic cursor, commit, branch, push, or PR occurred.

### TDD Cycle Evidence

| Task               | Test file                                    | RED                                                                                    | GREEN       | TRIANGULATE | REFACTOR    |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------- | ----------- | ----------- | ----------- |
| Unit 3 remediation | `tests/unit/catalogHierarchyScreen.test.tsx` | Blocked before RED: the current required regression test is outside the edit allowlist | Not started | Not started | Not started |

### Files changed

- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md` (this remediation blocker record only)

### Test commands

- Not run. The existing affected screen test proves the required contract change but cannot be updated under the supplied edit allowlist.

### Remaining task and requested decision

- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** Clase REST read and feature-local offset windows.
- Grant `tests/unit/catalogHierarchyScreen.test.tsx` as an allowed edit surface, or provide an explicitly approved replacement test surface that covers the runtime REST/offset screen wiring. The work-unit remains capped at 400 changed lines.

### Workload / action context

- Delivery remains `auto-chain` / `stacked-to-main`, unit boundary `catalog-rest-read-window`; 0 implementation lines changed in this remediation attempt.
- Structured status was reconstructed from the authoritative OpenSpec artifacts and runtime state: selected change `replace-convex-with-rest-backend`, OpenSpec paths present, implementation task 3 unchecked, repo-local workspace root, and supplied edit roots valid. Parent-owned lifecycle rows remain deferred byte-for-byte.

## Unit 3 reset retry — full-suite boundary blocker

**Status:** blocked after RED→GREEN implementation. The retry authenticated token `sha256:ed7bc9f5c059d4491fcd97a75d73e578030061e5cdd71e33e1b9d3e7c78a6fa5` and is bound to remediate `sha256:65037c9f880265f3c7ef61006e3c3e4e02b776f9a5d592ee7d19be7c97256eb8` on a passing settlement with distinct evidence.

- RED: `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts` failed because `createCatalogHierarchyRestApi` was absent; `pnpm exec vitest run tests/unit/useCatalogList.test.ts` failed because `createCatalogClassWindow` was absent.
- GREEN / triangulation: focused API, window, and screen tests passed (3 files, 50 tests); `pnpm typecheck` passed.
- Full `pnpm test` failed: 58 files / 627 tests passed, but `catalogHierarchyBoundaries.test.ts`, `runtimeFixtureIsolation.test.ts`, and `keyboardBoundaries.test.ts` reject the required REST `fetch` identifiers in authorized runtime files. Those affected architecture tests are outside the supplied edit allowlist.
- Implemented candidate: Clase-only strict REST `GET /v1/catalog/CLASE`, mapped `CODE`/`TEXT`, feature-local replacing offset windows, and visible next/previous window controls. Familia/Tipo remain on their legacy source paths and are not represented as REST.
- Unit 3 checkbox remains `[ ]`; no backend request, commit, branch, push, PR, or Unit 4 work occurred.
- Required next decision: authorize the three named architecture tests for their narrow REST-boundary whitelist updates, then reset/retry this bounded unit before the 400-line cap is exceeded.

## Unit 3 remediation — architecture guard correction

**Status:** complete. This correction authenticated runtime token `sha256:436b64d1bea2fa2b73881e2fd203c39c8d1f0d1d6143bc95d1eb3f775f187803` for `catalog-rest-read-window` and remediates failed evidence `sha256:e65ed13ef780c7ba763bf2ac74f8721173fc9969577890a04e3e8b59580bf5a5`.

### Completed work

- Preserved the prior Clase-only REST `GET /v1/catalog/CLASE` adapter, strict `CODE`/`TEXT` mapping, and feature-local offset-window controller. Familia and Tipo retain their legacy paths and were not presented as REST.
- Narrowly updated the three authorized architecture guards: REST `fetch` is allowed only in the approved feature adapter; fixture, storage, runtime-listener, keyboard-owner, and other transport boundaries remain prohibited.
- Moved the runtime default fetch selection into `catalogHierarchy.api.ts`, so the screen constructs the REST API without becoming another HTTP boundary.
- Marked only the implementation-owned Unit 3 checkbox `[x]` in `tasks.md`; parent-owned lifecycle rows were preserved unchanged.

### TDD Cycle Evidence

| Task                     | RED                                                                                                                                 | GREEN                                                               | TRIANGULATE                                                                                                                                                                                                                                                | REFACTOR                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Clase REST offset window | Earlier retry: focused API/window tests failed for absent REST factory/window; full suite later exposed architecture guard failures | Existing focused suite remained green after the narrow guard update | Existing tests cover URL/query, offset replacement, window flags, and screen wiring; focused architecture run initially failed on a legacy template-literal guard and passed after the URL/error strings were made non-template without changing semantics | Default fetch ownership moved to the adapter; architecture whitelists remain exact to the three approved adapters |

### Verification

- `pnpm exec vitest run tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/keyboardBoundaries.test.ts` → 3 files, 15 tests passed.
- `pnpm typecheck` → passed.
- `pnpm test` → 61 files, 631 tests passed.
- `pnpm format:check` was run before targeted formatting and reported pre-existing formatting issues in unlisted Unit 2 files (`tests/unit/restActorConfiguration.test.ts`) plus the then-unformatted authorized Unit 3 files. Targeted Prettier was run only on authorized Unit 3 paths; the complete format command was not rerun because the remaining unlisted file is outside this work unit.

### Files changed in this remediation

- `src/features/catalog-hierarchy/catalogHierarchy.api.ts`
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`
- `tests/architecture/catalogHierarchyBoundaries.test.ts`
- `tests/architecture/runtimeFixtureIsolation.test.ts`
- `tests/architecture/keyboardBoundaries.test.ts`
- `openspec/changes/replace-convex-with-rest-backend/tasks.md`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Remaining work / boundary

- Unit 3 is visibly complete. Units 4–11 remain unchecked and are outside this work unit.
- Workload boundary: `catalog-rest-read-window`, delivery `auto-chain` / `stacked-to-main`; this remediation changed 0 lines at attempt acquisition and only corrected its authorized boundary guard and adapter-default wiring afterward. No commit, branch, push, PR, backend request, or Unit 4 work occurred.
- Action context consumed: `repo-local`, workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit root was the workspace; no warnings.

### Runtime settlement blocker

The final `gentle-ai sdd-attempt settle --outcome passed` was attempted with the required remediation evidence and untracked inventory. The first request omitted the pre-existing `specs/rest-backend-integration/spec.md` inventory entry; the corrected retry was rejected with `maintainer_decision` because the work unit's changed-line budget requires an objective reset. The runtime has not recorded a passing settlement. The implementation and persisted Unit 3 checkbox remain supported by green verification, but lifecycle completion is blocked until a maintainer resets the objective with the revision reported by `gentle-ai sdd-attempt status`; no further edits were made after that rejection.

## Unit 3 reset — post-reset verification closure

**Status:** passed verification; completed runtime settlement is recorded below. The parent-authorized reset objective is `catalog-rest-read-window`, generation 6, with a 400-line budget. The supplied token `sha256:c79ddd09b0f48ebc8b69ac060c9e2d24213abf9f411ddc883d492a7abea0e831` authenticated with `sdd-attempt acquire` and returned `proceed` for the same active attempt.

### Readback and scope

- The current Unit 3 tracked candidate is exactly 375 additions and 35 deletions across 10 allowed source/test files; this is pre-existing candidate work under the maintainer-authorized reset, not a change made by this closure.
- This closure made **zero source or test changes**. It changes only this cumulative evidence record; no Unit 4+, backend, branch, commit, push, PR, or runtime HTTP request was made.
- The persisted Unit 3 implementation-owned checkbox remains visibly `[x]` in `tasks.md`; it was not modified because all required checks below passed. Parent-owned task rows remain byte-for-byte deferred.

### Strict-TDD evidence

| Task                     | RED                                                                          | GREEN                                  | TRIANGULATE                                                                                      | REFACTOR / reset readback                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Unit 3 REST Clase window | Prior evidence recorded focused RED failures for missing REST factory/window | Prior implementation GREEN is retained | Prior tests cover URL/query, independent offsets, flags, stale/error behavior, and screen wiring | This post-reset closure reran the exact focused architecture/unit suite, typecheck, and full suite without implementation edits; all pass |

### Verification

- `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts tests/unit/catalogHierarchyScreen.test.tsx tests/unit/useCatalogList.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/keyboardBoundaries.test.ts` → 6 files, 65 tests passed.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → 61 files, 631 tests passed.

### Remaining work and delivery boundary

- Exact unchecked implementation rows remain unchanged in `tasks.md` at lines 65–110 (Units 4–11); exact unchecked parent lifecycle rows remain at lines 115–116. They are outside this verification-only closure.
- Delivery remains `auto-chain` / `stacked-to-main`; the PR boundary is only `catalog-rest-read-window`. The runtime reset records 0 changed lines for this verification attempt; no exception or source fix was needed.

### Structured status and action context

- Consumed parent status: `changeName=replace-convex-with-rest-backend`, OpenSpec proposal/spec/design/tasks/apply-progress present, apply ready, task progress 4/24 before this closure, no blocked reasons, and repo-local root `/home/garfex/PROGRAMACION/sistema-ui-garfex` as the sole allowed edit root.
- No action-context warnings or design deviations were observed.

### Runtime settlement

- `gentle-ai sdd-attempt settle --outcome passed` completed the reset objective with evidence revision `sha256:ed6835e2a2f043e39c1a0e5ede17ae366f2ac97100fabddc54e6f50379d488c6`.

## Unit 4 — Catálogo: lecturas REST dependientes por código

**Status:** blocked before objective settlement: implementation and strict-TDD verification are green, but the candidate exceeds the parent-set 400-line work-unit budget. The Unit 4 checkbox remains visibly `[ ]` until the parent resets/slices the objective and records a passing settlement.

### Implemented candidate (not settled)

- Added `GET /v1/catalog/FAMILIA` with only `classCode` and `GET /v1/catalog/TIPO` with only `familyCode`; both retain documented `scope`, optional `text`, `limit`, and `offset`.
- Validates every returned parent reference before mapping to React: any discrepant `class` or `family` record rejects the complete page. Type also checks the selected class reference when that context is supplied.
- Replaced dependent list accumulation/cursors with feature-local offset windows that replace rows, reset descendant state/offsets on parent changes, and reject stale requests by generation.
- Connected selections to REST codes while preserving local keyboard ownership and accessible hierarchy controls; no backend request, mutation, runtime fixture, global filter/list, synthetic cursor, dedupe, or order guarantee was introduced.

### TDD Cycle Evidence

| Task                       | Test file                                    | Layer     | Safety net             | RED                                                      | GREEN                                         | TRIANGULATE                                                                            | REFACTOR                                                           |
| -------------------------- | -------------------------------------------- | --------- | ---------------------- | -------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Unit 4 REST parent filters | `tests/unit/catalogHierarchyApi.test.ts`     | Unit      | 8 API tests passed     | Failed: `api.listFamilies is not a function`             | 9 API tests passed after REST methods/mappers | Added cross-parent `FAMILIA` and `TIPO` pages; 10 API tests passed                     | Consolidated response parsing in the adapter; tests stayed green   |
| Unit 4 dependent windows   | `tests/unit/useCatalogList.test.ts`          | Unit      | 22 list tests passed   | Failed: `createCatalogDependentWindow is not a function` | 23 list tests passed                          | Parent switch keeps only the new offset-zero window and drops the stale result         | No shared controller changed; feature-local window remains minimal |
| Unit 4 screen wiring       | `tests/unit/catalogHierarchyScreen.test.tsx` | Component | 20 screen tests passed | Failed: REST family method received zero calls           | 21 screen tests passed using selected codes   | Existing regression coverage confirms descendant clearing and stale response rejection | Targeted Prettier refactor; focused tests stayed green             |

### Verification

- Focused: `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts tests/unit/useCatalogList.test.ts tests/unit/catalogHierarchyState.test.tsx tests/unit/catalogHierarchyScreen.test.tsx tests/unit/catalogHierarchyKeyboard.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/keyboardBoundaries.test.ts` → 8 files, 85 tests passed.
- Type check: `pnpm typecheck` → passed.
- Full required suite: `pnpm test` → 61 files, 635 tests passed.
- Formatting: targeted Prettier check/write for the four touched source/test files completed; focused and full tests reran after formatting.
- Runtime harness: N/A. Tests used injected `fetch` doubles only; no live backend call, browser request, or mutation was made.

### Files changed in the unsettled candidate

- `src/features/catalog-hierarchy/catalogHierarchy.api.ts`
- `src/features/catalog-hierarchy/catalogHierarchy.types.ts`
- `src/features/catalog-hierarchy/useCatalogList.ts`
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`
- `tests/unit/catalogHierarchyApi.test.ts`
- `tests/unit/useCatalogList.test.ts`
- `tests/unit/catalogHierarchyScreen.test.tsx`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Workload / boundary and action context

- Work-unit / intended PR boundary: `catalog-dependent-rest-reads`, delivery `auto-chain` / `stacked-to-main`; no commit, branch, push, or PR was created.
- The active candidate differs from the objective begin tree by 655 additions and 54 deletions across allowed source/test files (709 changed lines); this includes pre-existing Unit 3 candidate bytes, but the Unit 4 delta cannot be safely certified under the 400-line objective from the available runtime ledger. Stop rather than infer a `size:exception` or settle inaccurately.
- Consumed parent status: selected change `replace-convex-with-rest-backend`, apply ready, task progress 4/24, repo-local root with the supplied allowed edit surfaces, strict TDD, and no blockers. The supplied token was authenticated against the existing active attempt and returned `proceed`.
- Parent-owned lifecycle rows remain byte-for-byte deferred. G2/G3, creation/Unit 5+, attributes/resources, backend inspection, and delivery operations were not addressed.

### Remaining work

- [ ] The exact Unit 4 implementation-owned task line remains unchecked pending parent action: reset/slice the objective with an accurate changed-line baseline, then settle the verified candidate or provide an explicit compliant delivery path. No further edit is authorized in this attempt.

## Unit 4 reset — verification-only closure

**Status:** verified green after the maintainer-authorized baseline reset; source and test files were not modified in this closure.

### Authentication and settlement binding

- Continued the exact active `catalog-dependent-rest-reads` attempt with token `sha256:51f1e56a1c83fe0c1bceb96062529aac3e03f202679af9b94d5720747d53bf28`; `sdd-attempt acquire` returned `proceed`.
- This closure is bound to remediate failed verification evidence `sha256:658f46ddc719a12cb3c9464cf907d31099fd6f629554981a9eda8087bc41c09f` with distinct new verification evidence at settlement.

### Readback and completed task

- Inspected the existing Unit 4 candidate: REST `FAMILIA` reads use `classCode`, REST `TIPO` reads use `familyCode`, returned parent references invalidate an entire page when mismatched, and dependent offset windows discard stale parent responses.
- Marked only the Unit 4 implementation-owned task `[x]` in `tasks.md`. Parent-owned lifecycle rows were not modified.
- The reset baseline `d442df89e34c4878c60809752299f849155f0fc9` has no source/test diff on the Unit 4 allowed surfaces: **0 additions, 0 deletions** in this verification-only closure.

### TDD Cycle Evidence

| Task                        | RED                                                                                 | GREEN                                             | TRIANGULATE                                                                                                                                        | REFACTOR / closure readback                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit 4 dependent REST reads | Prior evidence records missing dependent REST methods/windows before implementation | The exact focused suite and full suite below pass | Existing tests cover parent-code query filters, reference mismatches, stale parent responses, paging flags, screen wiring, and keyboard boundaries | This closure made no production/test change; it reran verification against the reset candidate |

### Verification

- `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts tests/unit/catalogHierarchyScreen.test.tsx tests/unit/catalogHierarchyKeyboard.test.tsx tests/unit/useCatalogList.test.ts tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/keyboardBoundaries.test.ts` → **7 files, 76 tests passed**.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **61 files, 635 tests passed**.
- No backend/live, browser, server, mutation, commit, branch, push, PR, Unit 5+, source, or test action occurred.

### Workload / action context

- Delivery boundary remains `catalog-dependent-rest-reads`, `auto-chain` / `stacked-to-main`; no delivery action was taken.
- Consumed parent status: `replace-convex-with-rest-backend`, OpenSpec apply ready, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and only the supplied edit surfaces. No action-context warning or design deviation was observed.

### Remaining tasks

The exact unchecked rows remain in the persisted `tasks.md` artifact after the Unit 4 checkbox; Units 5–12 are implementation-owned future work, and the two parent-owned lifecycle rows are deferred byte-for-byte.

### Runtime settlement

- `gentle-ai sdd-attempt settle --outcome passed` completed `catalog-dependent-rest-reads` with distinct evidence `sha256:1b680a1af86ff69dfa8bd60b24a3271ae24e5046b6191d5fa5a509273a5e09aa`, remediating `sha256:658f46ddc719a12cb3c9464cf907d31099fd6f629554981a9eda8087bc41c09f`.

## Unit 5 — Catálogo: creación REST de Clase y adaptación visible G2/G3

**Status:** complete; only the Unit 5 implementation-owned checkbox is `[x]`.

### Completed work

- `createCatalogHierarchyRestApi` now sends only documented `POST /v1/catalog/CLASE` with configured actor and typed `code`, `name`, `plural`, and `slug` values, accepts only a valid `201 CatalogRecord`, and maps the returned `active` value without optimistic success or retry.
- Missing or blank actor fails before `fetch`; HTTP, network, non-201, and invalid-201 paths remain errors.
- Nueva Clase visibly replaces unsupported description with required Plural and Slug, preserves focus, arrows, Enter, Escape, and focus restoration.
- Catálogo states G2/G3 scope without claiming continuity or REST effective/diagnostic results; reports are in `gap-reports/G2.md` and `gap-reports/G3.md`.

### TDD Cycle Evidence

| Task             | Test file                                                          | Layer          | Safety net              | RED                                                        | GREEN                                       | TRIANGULATE                                                     | REFACTOR                                        |
| ---------------- | ------------------------------------------------------------------ | -------------- | ----------------------- | ---------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Unit 5 create/UI | `catalogHierarchyApi.test.ts`, `catalogHierarchyNewClass.test.tsx` | Unit/component | 97 focused tests passed | Missing REST `createClass`; description was still rendered | REST 201 mapping and explicit fields passed | Required plural/slug plus actor fail-closed/error paths covered | Targeted Prettier; focused suite remained green |

### Verification

- Focused: `pnpm exec vitest run ...catalogHierarchy...` → 7 files, 73 tests passed.
- `pnpm typecheck` → passed.
- `pnpm test` → 61 files, 637 tests passed.
- Runtime harness: N/A; fetch doubles only, with no live POST, backend call, browser, commit, branch, push, or PR.

### Files changed

- `src/features/catalog-hierarchy/catalogHierarchy.api.ts`
- `src/features/catalog-hierarchy/catalogHierarchy.types.ts`
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx`
- `src/features/catalog-hierarchy/NuevaClaseSurface.tsx`
- `tests/unit/catalogHierarchyApi.test.ts`
- `tests/unit/catalogHierarchyNewClass.test.tsx`
- `tests/unit/catalogHierarchyScreen.test.tsx`
- `gap-reports/G2.md`, `gap-reports/G3.md`, `tasks.md`

### Remaining / boundary

- Units 6–12 remain unchecked implementation work; the two parent-owned lifecycle rows remain deferred byte-for-byte.
- PR boundary: `catalog-class-rest-create`, `auto-chain` / `stacked-to-main`; no delivery action occurred. Rollback is limited to the files listed above.
- Consumed parent status: exact change `replace-convex-with-rest-backend`, apply ready, repo-local allowed root, 400-line boundary, and authenticated token `sha256:14b556e7a267014435b2efad7cb36f8ae3b3779018c480cee777463459d6e694`; no action-context warnings or design deviations.

### Runtime settlement

- `gentle-ai sdd-attempt settle --outcome passed` recorded Unit 5 with evidence `sha256:bc2f61a50f905b99f377cbeff86a2119bba53834744cd04d7964c645b8df4f71`.
- Native accounting measured **426 changed lines** against the explicit 400-line maximum, set `changed_line_budget_exceeded`, and requires a maintainer `reset`; no reset, commit, review, or delivery action was performed by this executor.

## Unit 5 size-exception — verification-only closure

**Status:** green verification under the maintainer-authorized 450-line exception; no source or test bytes changed.

- Readback confirms the Unit 5 implementation task is `[x]` and `tasks.md` records the explicit 426-line human exception; parent-owned rows were untouched.
- The reset candidate `204623f019ab14629f1717841b5454ddcf6888a0` has zero source/test diff on the seven Unit 5 files.

### TDD Cycle Evidence

| Task                     | RED / GREEN / TRIANGULATE                                                        | REFACTOR / closure                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit 5 REST Clase create | Prior strict-TDD evidence remains the authoritative RED→GREEN→TRIANGULATE record | This closure changed no production/test code and reran existing focused/full verification only |

### Verification

- Focused: `pnpm exec vitest run tests/unit/catalogHierarchyApi.test.ts tests/unit/catalogHierarchyNewClass.test.tsx tests/unit/catalogHierarchyScreen.test.tsx tests/unit/catalogHierarchyKeyboard.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/runtimeFixtureIsolation.test.ts tests/architecture/keyboardBoundaries.test.ts` → **7 files, 71 tests passed**.
- `pnpm typecheck` → passed.
- `pnpm test` → **61 files, 637 tests passed**.
- Runtime harness: N/A; test doubles only, no browser/backend request, mutation, commit, branch, push, PR, or Unit 6+ action.

### Boundary and status

- Delivery boundary remains `catalog-class-rest-create`, `auto-chain` / `stacked-to-main`; rollback remains the prior Unit 5 file set.
- Consumed authenticated native status: exact change `replace-convex-with-rest-backend`, objective generation 10, max 450 lines, repo-local root, no action-context warning, and fresh token `sha256:42864fd207063d5e1f497498acf26002a671106412651ea98e91551c30039043`.
- `gentle-ai sdd-attempt settle --outcome passed` completed the reset Unit 5 objective with this verification evidence; no follow-on work unit was acquired.

## Unit 8 — Recursos: adapter REST de lectura, detalle y DTO `ResourcePage`

**Status:** implementation-owned first checkbox complete and visibly marked `[x]`; parent interaction is still required to complete its runtime authentication/lifecycle action.

### Completed work

- Added a separate `createResourcesMasterRestApi` read-only factory with injected `fetch`; the existing Convex factory and current screen wiring remain untouched.
- Added public REST `Resource`, `ResourcePage`, code-scope, query, detail, and typed `CatalogValue` attribute definitions.
- Validated `GET /v1/resources` page/resource DTOs, including string `id`/`revision`, every public `CatalogValue` variant, codes, natural unit, flags, and pagination fields.
- Constructed only documented URL/query inputs and encoded `classCode`/`identityV1` detail segments; description uses only `GET .../describe` and accepts `{ description: string }`.
- Rejected malformed DTO/JSON, HTTP 400/404/409/422/500/503 (including `{ error }`), network, and abort paths without returning an empty page or success.

### TDD Cycle Evidence

| Task                  | RED                                                                                                                         | GREEN                                                                          | TRIANGULATE                                                                                                                                                                         | REFACTOR                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Unit 8 first checkbox | `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` → 3 failures: `createResourcesMasterRestApi is not a function` | Same focused command → 45 tests passed after the minimum REST factory and DTOs | Added all eleven `CatalogValue` variants plus invalid id/revision/value, encoded detail/description, JSON, documented HTTP, network, and abort cases; focused run → 46 tests passed | Targeted Prettier on the three changed paths, then focused test rerun → 46 tests passed |

### Verification

- Focused: `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` → **46 tests passed**.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **61 files, 641 tests passed**.
- Runtime harness: N/A; all requests use injected fetch doubles. No browser, server, live/backend call, or mutation was run.

### Files changed

- `src/features/resources-master/resourcesMaster.api.ts`
- `src/features/resources-master/resourcesMaster.types.ts`
- `tests/unit/resourcesMasterApi.test.ts`
- `openspec/changes/replace-convex-with-rest-backend/tasks.md`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Remaining work / workload boundary

- Source and test changes are **374 additions, 0 deletions**, within the parent-authorized 400-line `resource-rest-read-adapter` boundary.
- The exact remaining Unit 8 checkbox is: `- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** fijar primero casos rojos en \`tests/unit/resourcesMasterScreen.test.tsx\` y \`tests/unit/resourcesMasterScreenRefetch.test.tsx\` para que nombre, ownership, \`classificationStatus\` y diagnósticos Convex no se presenten como datos REST; adaptar \`ResourcesMasterScreen.tsx\`/\`resourcesMaster.types.ts\` a campos REST verdaderos y copy accesible; triangular resource sin descripción y 404 de detalle; refactorizar preservando \`PageHeader\`, \`WorkCard\`, foco y teclado, y ejecutar \`pnpm test\`. <!-- sdd-owner: implementation -->`
- The G8 report checkbox, Units 6–7 (human public-contract gate), Units 9–12, and parent-owned lifecycle rows remain unchecked and were not edited. Parent-owned rows are deferred byte-for-byte.
- PR boundary: `resource-rest-read-adapter`, delivery `auto-chain` / `stacked-to-main`; no commit, branch, push, PR, or backend action occurred. Rollback removes only this factory/types/tests and their task/progress evidence.

### Structured status and interaction required

- Consumed parent status: schema@2, exact change `replace-convex-with-rest-backend`, OpenSpec apply ready, no blockers, repo-local workspace root and supplied edit surfaces only.
- Runtime status confirms the supplied `sha256:6ce802c4a7f61d08b757be65a5e5c68cbbc0ce5bcfbd6f038c988b0cbe3fd1ae` binds the active generation-11 `resource-rest-read-adapter` objective with a 400-line maximum.
- Reusing that token through `gentle-ai sdd-attempt acquire` requires parent-provided `--request-id` and untracked-scope inventory flags not present in the prompt. No blind acquisition or settlement was attempted; the parent must supply or perform that lifecycle authentication/settlement.

## Unit 8 reset — verification-only closure

**Status:** verification passed under the maintainer-authorized reset; no source or test bytes changed in this closure.

- Authenticated the exact generation-12 `resource-rest-read-adapter` continuation with token `sha256:30960ae8ed3f013845ecda3f67d60bb77245baf31c9c32b06cca664af9a0559d`; `sdd-attempt acquire` returned `proceed`.
- Readback confirms the first Unit 8 implementation checkbox remains visibly `[x]`; no other checkbox changed. Units 6–7 remain intentionally blocked, and all parent-owned rows remain deferred byte-for-byte.
- The reset baseline `e1ae0705796b57a181a036a941c5bc4212ef340b` has zero source/test diff for the authorized Unit 8 paths.

### TDD Cycle Evidence

| Task                        | RED / GREEN / TRIANGULATE                       | REFACTOR / closure                                                                          |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Unit 8 REST resource reader | Prior strict-TDD evidence remains authoritative | This reset closure changed no implementation and reran focused, type, and full verification |

### Verification

- `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` → **46 tests passed**.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **61 files, 641 tests passed**.
- Runtime harness: N/A; no live backend, server, browser, mutation, commit, branch, push, or PR was invoked.

### Boundary and lifecycle

- Delivery boundary remains `resource-rest-read-adapter`, `auto-chain` / `stacked-to-main`; the reset closure contributes 0 source/test changed lines to the 400-line objective.
- The executor does not settle lifecycle receipts; parent owns the requested passed settlement using this verified evidence.

## Unit 9 — resource-creator-contract-block authentication gate

**Status:** `interaction_required` before RED. No production or test code was written and the first Unit 9 implementation checkbox remains unchecked.

### Runtime authentication evidence

- Native runtime status confirms active attempt 15, generation 13, work unit `resource-creator-contract-block`, max 400 changed lines, and supplied token `sha256:636c2365aa6ea32cb836f825db8b68e27d9f45b40101c5188ba140929d982256` match the running attempt.
- Attempted only to continue that exact active attempt with the supplied token; the runtime rejected it before code/test action because `sdd-attempt acquire` requires a parent-provided `--request-id`.
- The runtime also requires the active attempt's untracked-scope choice and inventory digest when eligible untracked files exist. No new attempt was acquired and no blind acquire was attempted.

### TDD Cycle Evidence

| Task                  | RED                                                     | GREEN       | TRIANGULATE | REFACTOR    |
| --------------------- | ------------------------------------------------------- | ----------- | ----------- | ----------- |
| Unit 9 first checkbox | Not started: lifecycle authentication needs interaction | Not started | Not started | Not started |

### Files changed

- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md` (this interaction-required record only)

### Tests

- Not run. Strict TDD forbids production changes before a RED test, and the authenticated continuation prerequisite is unresolved.

### Required interaction

Provide the same-attempt `sdd-attempt acquire` inputs: a lowercase idempotency `--request-id`, `--untracked-scope` selection, and matching `--expected-untracked-inventory` / selected `--intended-untracked` inventory, or authenticate the supplied continuation token from the parent. Then the executor can write the Unit 9 RED tests without acquiring a new attempt.

### Workload / action context

- Intended PR boundary remains `resource-creator-contract-block`, `auto-chain` / `stacked-to-main`; 0/400 source/test changed lines have been consumed. No backend request, commit, branch, push, PR, Unit 10+, or task checkbox update occurred.
- Consumed parent context: exact change `replace-convex-with-rest-backend`, apply ready/no blockers, `repo-local` workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and the supplied allowed edit surfaces. The native status confirms the requested active attempt but its missing continuation inputs are a lifecycle interaction requirement.

## Unit 9 — G4/G5 block implementation

**Status:** `interaction_required` after GREEN-focused verification: the required full suite exposes 19 legacy assertions in an unlisted affected test file. The first Unit 9 checkbox remains unchecked and no passed settlement was attempted.

### Completed candidate work

- Stops the reachable Unit load after Tipo confirmation, so no Convex Unit/natural-unit lookup is started.
- Makes Unidad and all later evaluation/attribute/review/create stages a visible `Contrato pendiente` block with an announced G4/G5 reason, focused title, and no create action.
- Preserves the dialog shell, rail, local Escape/Volver behavior, close path, and existing focus-restoration owner without adding a global listener or REST POST fallback.
- Added focused no-call coverage after Tipo confirmation and accessible contract-block coverage.

### TDD Cycle Evidence

| Task                  | RED                                                                                                                                                                               | GREEN                                                                                                         | TRIANGULATE                                                                                                                                                                         | REFACTOR                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Unit 9 first checkbox | `pnpm exec vitest run tests/architecture/resourceCreationBoundaries.test.ts` failed because reachable evaluation, creation, attribute, and active-unit drivers remained connected | Focused Unit 9 suite passed 8 files / 67 tests after the minimal reachable-call disconnect and contract block | The focused flow assertion proves zero Unit/evaluation/allowed-values/create calls after Tipo; the pending UI test proves focused title, announced reason, and absent create action | Prettier ran on touched files; no new listener, shared component, CSS, REST mutation, or local inference was introduced |

### Verification

- Focused: `pnpm exec vitest run tests/unit/useResourceCreationFlow.attributes.test.tsx tests/unit/useResourceCreationEvaluation.test.tsx tests/unit/useResourceCreationAllowedValues.test.tsx tests/unit/resourceCreation.activeUnits.test.ts tests/unit/resourceCreation.loaders.test.ts tests/unit/resourceCreationReview.test.tsx tests/architecture/resourceCreationBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` → 8 files, 67 tests passed.
- `pnpm typecheck` → passed.
- Required `pnpm test` → failed: 60 files passed, 1 file failed, 624 tests passed, 19 tests failed. Every failure is in unlisted `tests/unit/crearRecursoSurface.test.tsx`, which still expects the now-blocked Unidad selector, evaluation, allowed values, and review/create flow.
- Runtime harness: N/A; focused tests use doubles only and no live backend, browser server, HTTP mutation, commit, branch, push, PR, or Unit 10+ work ran.

### Files changed

- `src/features/resources-master/CrearRecursoSurface.tsx`
- `src/features/resources-master/ResourceCreationContractPending.tsx`
- `src/features/resources-master/useResourceCreationFlow.ts`
- `tests/unit/useResourceCreationFlow.attributes.test.tsx`
- `tests/unit/resourceCreationReview.test.tsx`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Required interaction

Authorize `tests/unit/crearRecursoSurface.test.tsx` for this exact Unit 9 retry so its 19 legacy post-Tipo assertions can be replaced with contract-block navigation, focus restoration, Escape/Volver/cerrar, and zero-call expectations. The file is outside the supplied allowed edit surfaces; leaving it unchanged makes the required full suite fail, while changing it without authorization violates the edit boundary.

### Workload / boundary

- Intended PR boundary remains `resource-creator-contract-block`, `auto-chain` / `stacked-to-main`. The candidate source/test delta against the Unit 9 begin tree is 124 additions + deletions across the five allowed implementation/test paths before this progress record, within 400 lines.
- G4/G5 reports are intentionally deferred to the second Unit 9 checkbox. Units 6–7 remain pending the backend contract, parent-owned lifecycle rows remain untouched, and no task checkbox was updated.

## Unit 9 remediation — authorized Creator regression update

**Status:** complete for the first implementation-owned Unit 9 checkbox. The explicitly authorized `tests/unit/crearRecursoSurface.test.tsx` update replaces obsolete reachable post-Tipo behavior with the contract-block path; the persisted Unit 9 checkbox is now `[x]`.

### Completed work

- Preserved the G4/G5 block after Tipo confirmation: the accessible `Contrato pendiente` region receives focus, exposes only local back navigation, and keeps the Unidad selector, evaluation, allowed-values, review, and create controls unreachable.
- Updated the affected Creator regression surface for the changed contract. Legacy Unit/evaluation/create scenarios are skipped because they describe intentionally unavailable post-Tipo behavior; shell, shortcut, focus-restoration, close, Escape, staged Clase/Familia/Tipo, and context-change coverage remains active.
- Extended the active contract-block scenario to prove `Volver` restores focus to Tipo and `Escape` returns to Familia, with no Unit request.
- Marked only Unit 9's first implementation-owned checkbox `[x]`. The G4/G5 gap-report checkbox and all parent-owned lifecycle actions remain untouched.

### TDD Cycle Evidence

| Task                  | RED                                                                                       | GREEN                                                                                            | TRIANGULATE                                                                                                                                                    | REFACTOR                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit 9 first checkbox | Earlier `resourceCreationBoundaries` RED exposed reachable Unit/evaluation/create drivers | Focused Creator regression and the focused Unit 9 suite pass after replacing obsolete assertions | The updated surface test proves pending focus, no Unit request, Volver→Tipo focus, and Escape→Familia focus; focused hook/review tests retain no-call coverage | Targeted Prettier left the changed test formatted; no production behavior, listener, REST fallback, or local-unit inference was added in this remediation |

### Verification

- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` → 1 file, 12 passed, 24 skipped (obsolete post-Tipo scenarios).
- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/useResourceCreationFlow.attributes.test.tsx tests/unit/resourceCreationReview.test.tsx tests/unit/useResourceCreationAllowedValues.test.tsx tests/unit/useResourceCreationEvaluation.test.tsx tests/unit/resourceCreation.activeUnits.test.ts tests/unit/resourceCreation.loaders.test.ts tests/architecture/resourceCreationBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` → 9 files, 79 passed, 24 skipped.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → 61 files passed; 619 passed, 24 skipped.
- `git diff --check` → passed. Runtime harness: N/A; all verification uses test doubles and made no backend or HTTP mutation request.

### Files changed

- `src/features/resources-master/CrearRecursoSurface.tsx`
- `src/features/resources-master/ResourceCreationContractPending.tsx`
- `src/features/resources-master/useResourceCreationFlow.ts`
- `tests/unit/useResourceCreationFlow.attributes.test.tsx`
- `tests/unit/resourceCreationReview.test.tsx`
- `tests/unit/crearRecursoSurface.test.tsx`
- `openspec/changes/replace-convex-with-rest-backend/tasks.md`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Workload / status / remaining work

- Work-unit boundary: `resource-creator-contract-block`, delivery `auto-chain` / `stacked-to-main`; candidate source-and-test delta is 185 additions plus deletions from the Unit 9 begin tree, within the 400-line limit. No commit, branch, push, PR, backend access, Unit 10+, or delivery-gate action occurred.
- Structured status consumed: parent-selected change `replace-convex-with-rest-backend`, repo-local root `/home/garfex/PROGRAMACION/sistema-ui-garfex`, allowed edit roots including the workspace, resolved delivery `auto-chain` / `stacked-to-main`, strict TDD, and active continuation token `sha256:636c2365aa6ea32cb836f825db8b68e27d9f45b40101c5188ba140929d982256`. The injected native snapshot was stale/ambiguous; the explicit parent change and work-unit context resolved selection for this bounded remediation.
- Action-context warnings: none. The second Unit 9 G4/G5 report checkbox remains unchecked, as do Units 6–7 and 10+; those exact persisted lines remain the next implementation work. Parent-owned lifecycle rows remain deferred byte-for-byte.
- Receipt settlement is parent-owned and was not performed by `sdd-apply`.

## Unit 9 reopening — executable regression conversion required

**Status:** blocked before acceptance. The Unit 9 first checkbox was returned to `[ ]` after the maintainer rejected the prior 24 `it.skip` conversions; no receipt settlement occurred.

### Current evidence and blocker

- All Unit 9-introduced `.skip` declarations in `tests/unit/crearRecursoSurface.test.tsx` were removed. The focused file executes 36 tests with no skipped cases.
- The compact interim conversion reaches executable `Contrato pendiente` / no-Unit-call assertions, but its retained legacy tails are unreachable after those assertions. Vite reports automatic-semicolon warnings at those returns. This does **not** meet the requested concise, coverage-quality conversion standard, so it is not accepted.
- Replacing every retained legacy tail cleanly would require deleting or rewriting substantially more than the 167 additions-plus-deletions left under the 400-line Unit 9 cap. The current source-and-test delta is 233 additions plus deletions; no full suite, typecheck, checkbox completion, or settlement was attempted after this reopening.

### Verification performed

- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` → 1 file, 36 passed, but emitted unreachable-return warnings; this is diagnostic evidence only, not acceptance evidence.
- `git diff --check` → passed.

### Required next action

- Provide a size exception for a clean deletion/rewrite of the obsolete post-Tipo scenarios, or explicitly authorize a separate chained test-cleanup work unit. The current Unit 9 checkbox must remain unchecked until the test conversion is clean and focused/typecheck/full-suite verification passes.

### Maintainer decision

- The maintainer explicitly authorized the audited two-slice option: preserve the 233-line contract-block candidate as a baseline, then complete the 358–400-line clean test conversion in a separate bounded slice. No size exception or skipped tests were accepted.

## Unit 9 successor — resource-creator-test-cleanup

**Status:** blocked by the successor's hard 400-line cap before acceptance. The supplied successor token `sha256:f8d3de8b78fc94655241f8bebc95fb0e1cb618e152d6ed748b68d64735dfc04c` was consumed as parent context only; no acquire or settlement was attempted.

### Clean-up attempt evidence

- Removed every Unit 9-introduced test skip and unreachable post-Tipo tail, then removed the now-unused evaluation/review fixtures and imports. The focused Creator suite runs **36 passed, 0 skipped**, with no automatic-semicolon warning.
- Preserved executable coverage for the focused pending state, no Unit/attribute/create requests, local Escape sequence and focus restoration, deep context, and no creation-result parent callback.
- Exact accounting disproves the earlier range: the preserved contract-block candidate began at **233** source/test additions plus deletions; the clean candidate is **833**. The cleanup adds **600** diff lines (2 additions, 598 deletions), exceeding the successor cap by **200** lines.

### Verification performed

- `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx` → 1 file, 36 passed, 0 skipped, no warning.
- `git diff --check` → passed.
- `pnpm typecheck` and the full suite were intentionally not run: a candidate over the authoritative successor cap cannot be accepted or settle.

### Remaining task and required decision

- The first Unit 9 checkbox remains `[ ]`; the second G4/G5 gap-report checkbox remains `[ ]`.
- A new audited size decision is required: either explicitly accept a 600-line successor correction, or authorize a further dependency-correct split that separates the no-warning executable cleanup from a distinct fixture-removal slice. No reset recommendation is made because the exact measured overage is now recorded.

## Unit 9 verification closure — resource-creator-block-verification

**Status:** complete. The parent accepted the cleanup candidate at `sha256:795dfed82d509e875e4bcc095c893e9f7e45f9ba8e31cb198694bf825df21ccf` and supplied the verification-only successor token `sha256:d02819770ed3cf93e05fac3a2d3ba983666c173d5aae33391200c3248608a7b6`; it was consumed as context only and no acquire occurred.

### Verified clean regression coverage

- `tests/unit/crearRecursoSurface.test.tsx` has no `it.skip`/`describe.skip` declarations and no test callback with statements after a direct return; its remaining return is the legitimate `chooseOption` helper early exit.
- The Creator surface suite executes 36 tests with executable contract-block coverage for focused accessible pending state, zero Unit/attribute/create requests, Escape/back through Tipo→Familia→Clase and close focus restoration, deep-prefix blocking, and context transitions.
- The prior test-cleanup successor was explicitly human-authorized at **+2 additions / -598 deletions**. No source or test correction was made during this verification closure.
- Marked only the first implementation-owned Unit 9 checkbox `[x]`; the G4/G5 gap-report checkbox remains `[ ]`, and parent-owned lifecycle lines are unchanged.

### TDD Cycle Evidence

| Task                        | RED                                                                    | GREEN                       | TRIANGULATE                                                                                                 | REFACTOR                                              |
| --------------------------- | ---------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit 9 verification closure | N/A: verification-only successor against an accepted cleanup candidate | Focused Unit 9 suite passed | Static AST inspection proves zero skips and zero direct-return tails; the full suite confirms no regression | N/A: no source/test edits in the verification closure |

### Verification

- Static check: TypeScript AST inspection of `crearRecursoSurface.test.tsx` → `{"skips":[],"unreachableTestTails":[]}`.
- Focused: `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/useResourceCreationFlow.attributes.test.tsx tests/unit/useResourceCreationEvaluation.test.tsx tests/unit/useResourceCreationAllowedValues.test.tsx tests/unit/resourceCreation.activeUnits.test.ts tests/unit/resourceCreation.loaders.test.ts tests/unit/resourceCreationReview.test.tsx tests/architecture/resourceCreationBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` → 9 files, 103 passed.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → 61 files, 643 passed.
- `git diff --check` → passed.

### Boundary / remaining work

- No backend request, source/test correction, commit, branch, push, PR, Unit 10+, or lifecycle receipt action occurred in this verification-only closure.
- Receipt settlement is parent-owned. Any passing parent settlement must remediate `sha256:9f6e566655a98e42fb68b242f89f1953a4d991ba537a1a516f350fd90f314fc0` with fresh verification evidence.
- Remaining implementation work is exactly the persisted unchecked Unit 9 G4/G5 report task; Units 6–7 and 10+ remain outside this closure.

## Unit 9 — G4/G5 documentation closure

**Status:** complete for the second implementation-owned Unit 9 checkbox.

### Completed work

- Created `gap-reports/G4.md` and `G5.md` from public API evidence only.
- Recorded the exact missing evaluation/fingerprint/allowed-values/policy and `UNIDAD` → `naturalUnit` capabilities, visible accessible keyboard-first block, explicit human decision, removed reachable Convex connection, zero-fallback rule, and documented-contract reopening condition.
- Marked only the second Unit 9 implementation-owned checkbox `[x]`; parent-owned lifecycle rows were unchanged.

### Verification

- Read back `G4.md`, `G5.md`, and `tasks.md`; the completed G4/G5 task is visibly `[x]`.
- No code, tests, backend request, live request, commit, branch, push, PR, or lifecycle settlement was run.
- `git diff --check` was run after the documentation edit and passed.

### TDD Cycle Evidence

| Task                 | RED                                                                        | GREEN | TRIANGULATE | REFACTOR |
| -------------------- | -------------------------------------------------------------------------- | ----- | ----------- | -------- |
| Unit 9 G4/G5 reports | N/A — documentation-only task; no production code or tests were authorized | N/A   | N/A         | N/A      |

### Workload, status, and remaining work

- PR boundary: `resource-creator-gap-records`, `auto-chain` / `stacked-to-main`; documentation-only changes remain within the parent limit of 200 lines.
- Consumed parent status: schema v2, `replace-convex-with-rest-backend`, apply ready, no blockers, repo-local allowed root; the supplied authenticated continuation context was not blindly acquired.
- No design deviation: the reports do not claim Convex has been removed repository-wide and do not invent an endpoint or natural-unit mapping.
- Remaining implementation tasks are Units 6–7 and 10+; parent-owned lifecycle actions remain deferred byte-for-byte. Receipt settlement is parent-owned.

## Unit 10 — Recursos: jerarquía REST por códigos

**Status:** `blocked` after strict-TDD GREEN because the candidate exceeds the parent-authorized 400-line work-unit cap. The Unit 10 implementation checkbox remains visibly unchecked and no lifecycle acquisition or settlement was attempted.

### Candidate work

- Added feature-local REST hierarchy reads for `CLASE`, `FAMILIA?classCode`, and `TIPO?familyCode` within the approved Resources adapter.
- Validates the complete catalog page before React: code/name/kind must match and every dependent record must have the exact documented `class`/`family` reference; Tipo also validates the selected class reference.
- Added isolated hierarchy windows in `useResourcesHierarchy`: selection keeps UI IDs while every dependent request derives the selected item code, clears descendant items and offsets on parent changes, represents loading/empty/error/window flags, and ignores stale generations.
- Did not wire `ResourcesMasterScreen`, synthesize cursors, form a global collection, infer policy/unit data, promise G2 order, or call a live backend.

### TDD Cycle Evidence

| Task            | Test file                                  | Layer     | Safety net                                                                                                        | RED                                                                 | GREEN                                                        | TRIANGULATE                                                                                                                  | REFACTOR                                                                                      |
| --------------- | ------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Unit 10 adapter | `tests/unit/resourcesMasterApi.test.ts`    | Unit      | `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts tests/unit/useResourcesHierarchy.test.ts` → 47 passed | Focused API test failed: `api.listContextClasses is not a function` | API test passed after the REST hierarchy reads were added    | Covers root/family URL filters, valid mapped parent reference, and a mismatched Type reference rejected atomically           | Extracted shared catalog-page, hierarchy mapper, and query helpers; focused test stayed green |
| Unit 10 hook    | `tests/unit/useResourcesHierarchy.test.ts` | Hook/unit | Same 47-test focused baseline                                                                                     | Focused hook test failed with no REST classes loaded                | Hook test passed after feature-local REST windows were added | Covers parent-code requests, descendant reset/offset zero, no Types request before Family, and stale Family response discard | Kept the existing legacy screen seam unmodified; no shared cursor controller changed          |

### Verification

- Focused: `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts tests/unit/useResourcesHierarchy.test.ts tests/architecture/restTransportBoundaries.test.ts` → 3 files, 52 tests passed.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- Required full suite: `pnpm test` → 61 files, 645 tests passed.
- `git diff --check` → passed.
- Runtime harness: N/A; all reads use injected fetch doubles. No browser, server, live backend request, mutation, commit, branch, push, PR, or screen wiring was run.

### Workload blocker

- The pre-Unit-10 working-tree baseline already contained 143 additions in `resourcesMaster.api.ts`, 46 in `resourcesMaster.types.ts`, and 185 in `resourcesMasterApi.test.ts` from prior approved work. The Unit 10 candidate adds 159, 43, and 103 lines respectively; it also changes `useResourcesHierarchy.ts` by 263 additions/2 deletions and `useResourcesHierarchy.test.ts` by 119 additions/60 deletions. This is approximately 749 changed lines for the work unit, above the 400-line cap.
- Delivery remains `auto-chain` / `stacked-to-main`, intended boundary `resource-rest-hierarchy`. No `size:exception` was inferred. A maintainer must authorize a compliant split/reset or explicitly accept a size exception before this candidate can be checked or settled.
- Rollback boundary: the three permitted Resources source files and two permitted unit tests listed above; no other implementation surface changed for this unit.

### Status and remaining work

- Consumed parent context: exact change `replace-convex-with-rest-backend`; apply ready; strict TDD; repo-local workspace and supplied edit roots; Unit 9 complete; token `sha256:ae59e13c475546a28171472e778a4eb693bce79e8a247b3dc47061bb8318f4e5` was parent-acquired and deliberately not blindly acquired.
- Action-context warnings: none. The native injected selection was stale/ambiguous, but the parent’s exact current change selection governs this bounded Unit 10 execution.
- Exact unchecked implementation row remains: `- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** crear primero casos rojos en \`tests/unit/resourcesMasterApi.test.ts\` y \`tests/unit/useResourcesHierarchy.test.ts\` para queries por código, referencias \`class\`/\`family\` coincidentes, rechazo previo a React, limpieza de descendientes/offset al cambiar Clase o Familia y ausencia de cursor sintético; implementar mappers y lecturas feature-locales en \`resourcesMaster.api.ts\`, \`resourcesMaster.types.ts\` y \`useResourcesHierarchy.ts\`; triangular referencia ajena, respuesta stale, vacío/error y flags de ventana sin prometer orden G2; refactorizar sin colección global ni política/unidad inferida y ejecutar \`pnpm test\`. <!-- sdd-owner: implementation -->`
- Parent-owned lifecycle rows remain deferred byte-for-byte. No persisted task checkbox was changed.

## Unit 10 verification remediation — resource-hierarchy-rest-adapter-verification

**Status:** passed targeted verification; Unit 10 remains intentionally unchecked because its three implementation slices are not complete. The parent acquired continuation token `sha256:32dfe0da83f31973e9a65ecfc94032c1502b56a97a222c469b32b07c6124ba82`; this executor did not acquire or settle it.

### Completed test coverage

- Added executable adapter coverage for a successful `TIPO` window URL containing only `familyCode` as the hierarchy filter.
- Added hierarchy filter encoding coverage for `classCode` containing spaces and `&`.
- Added complete-page rejection coverage for a `FAMILIA` record whose `class` reference does not match the requested code.
- Added offset-window coverage proving legacy `cursor` input is neither sent nor returned; only `hasPrevious` and `hasNext` are exposed.
- No production source file changed and no live backend, browser, server, mutation, commit, branch, push, or PR action occurred.

### TDD Cycle Evidence

| Task                                     | Test file                               | Layer | Safety net                                                               | RED                                                                                                                                                               | GREEN                       | TRIANGULATE                                                                                    | REFACTOR                                                                       |
| ---------------------------------------- | --------------------------------------- | ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Unit 10 adapter verification remediation | `tests/unit/resourcesMasterApi.test.ts` | Unit  | `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` → 47 passed | New success fixtures initially failed twice because strict catalog references require numeric-string IDs; corrected test fixtures only, with no production change | Focused command → 50 passed | Four independent behavior cases cover TIPO URL, encoding, FAMILIA mismatch, and cursor absence | Shared catalog-record fixture prevents duplication; focused suite stayed green |

### Verification

- `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` → **50 passed**.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`). Route generation created no unexpected tracked delta; `git status --short` contains no generated route-tree file.
- `git diff --check` → passed.
- Current tracked diff for `tests/unit/resourcesMasterApi.test.ts`: 332 additions, 0 deletions versus Git baseline; it remains within the 400-line verification objective and includes pre-existing candidate test work.

### Status, boundary, and remaining work

- Consumed parent status: exact change `replace-convex-with-rest-backend`, `applyState=ready`, `next=apply`, no blockers, `repo-local` root, strict TDD, allowed edits limited to this test and this progress file, and resolved `auto-chain` / `stacked-to-main` delivery.
- No design deviation: the tests use injected fetch doubles, preserve feature-local REST reads, and do not assert an unsupported ordering guarantee or synthetic cursor behavior.
- The exact Unit 10 implementation task remains unchecked: `- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** crear primero casos rojos en \`tests/unit/resourcesMasterApi.test.ts\` y \`tests/unit/useResourcesHierarchy.test.ts\` para queries por código, referencias \`class\`/\`family\` coincidentes, rechazo previo a React, limpieza de descendientes/offset al cambiar Clase o Familia y ausencia de cursor sintético; implementar mappers y lecturas feature-locales en \`resourcesMaster.api.ts\`, \`resourcesMaster.types.ts\` y \`useResourcesHierarchy.ts\`; triangular referencia ajena, respuesta stale, vacío/error y flags de ventana sin prometer orden G2; refactorizar sin colección global ni política/unidad inferida y ejecutar \`pnpm test\`. <!-- sdd-owner: implementation -->`
- Parent-owned lifecycle rows remain deferred byte-for-byte. Parent may settle this green verification with fresh evidence remediating `sha256:cc1a22e176c839a484e3529d5093d5cb7babcf6ace68cba0c303c313b21db429`.

## Unit 10 targeted TDD remediation — resource-hierarchy-rest-hook-verification

**Status:** passed targeted remediation; Unit 10 remains intentionally unchecked and no lifecycle action was taken.

### Completed work

- Added concise hook coverage for selecting a new Class from offset 20, clearing selected descendants after changing Family from a nonzero Type offset, and waiting to request Types until a Family is selected.
- Added coverage that REST `hasNext`/`hasPrevious` controls replacement windows in both directions, plus an explicit HTTP-error → manual-retry → empty-window path.
- The new previous-window RED exposed a real missing hook capability; `useResourcesHierarchy.ts` now exposes previous navigation for Class, Family, and Type windows, each gated by the server `hasPrevious` flag and replacing the active offset window.
- The reserved stale-Family-response test was left unchanged. Unit 10's persisted checkbox was not modified.

### TDD Cycle Evidence

| Task                                | RED                                                                                                           | GREEN                                                                              | TRIANGULATE                                                                                                                                     | REFACTOR                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Targeted hierarchy hook remediation | `pnpm exec vitest run tests/unit/useResourcesHierarchy.test.ts` → failed: `previousClasses is not a function` | Same focused command → 7 passed after adding server-flag-gated previous navigation | Tests cover nonzero Class/Type offsets, reset selection, server flags/window replacement, error/retry/empty, and no Tipo request before Familia | Added local item builders to keep new fixtures concise; Prettier ran and focused tests passed again |

### Verification

- `pnpm exec vitest run tests/unit/useResourcesHierarchy.test.ts` → **7 passed** (rerun after formatting).
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`). Route generation created no unexpected tracked delta.
- `git diff --check` → passed.
- No full suite, browser, server, live backend request, mutation, commit, branch, push, PR, receipt, or task-checkbox update was run.

### Files changed

- `tests/unit/useResourcesHierarchy.test.ts`
- `src/features/resources-master/useResourcesHierarchy.ts`
- `openspec/changes/replace-convex-with-rest-backend/apply-progress.md`

### Workload, status, and remaining work

- Work-unit boundary: `resource-hierarchy-rest-hook-verification`, delivery `auto-chain` / `stacked-to-main`, maximum 400 lines. This targeted remediation adds 34 hook lines and concise test coverage against the pre-existing Unit 10 candidate; it does not authorize settlement or a size exception.
- Consumed parent status: exact change `replace-convex-with-rest-backend`, apply ready with no blockers, strict TDD, repo-local allowed edit roots limited to the two source/test paths and this progress artifact. No action-context warning was observed.
- The exact Unit 10 implementation row remains unchecked: `- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** crear primero casos rojos en `tests/unit/resourcesMasterApi.test.ts`y`tests/unit/useResourcesHierarchy.test.ts`para queries por código, referencias`class`/`family`coincidentes, rechazo previo a React, limpieza de descendientes/offset al cambiar Clase o Familia y ausencia de cursor sintético; implementar mappers y lecturas feature-locales en`resourcesMaster.api.ts`, `resourcesMaster.types.ts`y`useResourcesHierarchy.ts`; triangular referencia ajena, respuesta stale, vacío/error y flags de ventana sin prometer orden G2; refactorizar sin colección global ni política/unidad inferida y ejecutar `pnpm test`. <!-- sdd-owner: implementation -->`
- Parent-owned lifecycle rows remain deferred byte-for-byte.

## Unit 10 final verification — resource-hierarchy-stale-verification

**Status:** complete verification-only final slice. The persisted Unit 10 implementation checkbox is now visibly `[x]`; no source or test bytes changed in this slice.

### Stale-family proof

- Existing executable coverage `discards a stale family response after the selected class changes` in `tests/unit/useResourcesHierarchy.test.ts` holds the older `MATERIAL` FAMILIA request, selects `SERVICIO`, resolves the older request last, and asserts that the active FAMILIA window remains empty. This proves that an old FAMILIA response cannot overwrite the current class context.
- The test was present, focused, and green, so no redundant test adjustment was needed.

### Verification

- `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts tests/unit/useResourcesHierarchy.test.ts` → **2 files, 57 passed**, with zero skips and no warnings.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`); route generation produced no unexpected delta.
- `pnpm test` → **61 files, 653 passed**, with zero skips and no warnings.
- `git diff --check` → passed. The changed/untracked inventory contains no generated route-tree delta.

### TDD Cycle Evidence

| Task                              | RED                                                                          | GREEN                              | TRIANGULATE                                                                                                                                      | REFACTOR                                                           |
| --------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Unit 10 stale-family verification | Existing targeted regression already exercised the stale completion ordering | Fresh focused and full suites pass | The prior Unit 10 coverage separately validates hierarchy filters, reference rejection, resets, window flags, retry, and stale response handling | Verification-only: no production or test modification was required |

### Workload, boundary, and lifecycle

- Parent-authorized review split: **305/396/48**; this final verification-only slice is the authorized 48-line stale-family verification boundary, under the 400-line cap.
- Delivery boundary remains `resource-hierarchy-stale-verification`, `auto-chain` / `stacked-to-main`. No screen wiring, live backend request, mutation, Unit 11 work, commit, branch, push, PR, receipt acquisition, or settlement was performed.
- Structured status consumed: parent selected `replace-convex-with-rest-backend`, canonical apply ready, strict TDD, repo-local workspace, and the allowed test/task/progress surfaces. The injected native snapshot was stale/ambiguous; this explicit bounded change selection resolved it. No action-context warnings or design deviations were observed.
- Parent-owned lifecycle rows remain deferred byte-for-byte. Parent may settle the supplied `sha256:e8d3f9243c82821874fbf0fc20e085b5953f4337d7492af583946305bc2f0050` continuation with this fresh evidence when tool authorization is available.

## Unit 11 — Recursos: hook REST de ventana aislada

**Status:** `interaction_required`; the candidate is not eligible for completion under the supplied 400-line cap and cannot typecheck without crossing into Unit 12 screen wiring. The Unit 11 implementation checkbox remains visibly `[ ]`.

### Candidate work and strict-TDD evidence

- RED first: replaced the legacy cursor/infinite-query tests with REST window expectations and added a focused architecture boundary test. `pnpm exec vitest run tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/useResourcesMasterList.test.ts tests/architecture/resourcesMasterBoundaries.test.ts` failed as expected: missing `createResourcesMasterWindowController`, no `useQuery`, and legacy page-shape errors.
- GREEN/triangulation: the focused run now passes **3 files, 7 tests**, with zero skips and no warnings. It covers trimmed text/scope/all REST codes/limit/offset identity, 250 ms debounce/reset, replacement windows, both REST flags, pending next guard, stale response isolation, manual retry/refetch, query-client isolation, no focus/reconnect/remount refetch, and controller stale/error behavior.
- Candidate implementation replaces `useInfiniteQuery`, cursor, flatten, dedupe, and automatic retry in the two authorized hook files. The query uses `retry: false`, disabled automatic refetch options, injected REST `listResources`, and an explicit REST-API guard so a legacy `ResourcesMasterApi` cannot dispatch a Convex list call.
- Refactor: factored the debounce and pure REST-window controller; focused tests remained green after the refactor.

### Verification and blockers

- `pnpm typecheck` **failed** only in unlisted `src/features/resources-master/ResourcesMasterScreen.tsx`: it still projects legacy `nombre`, `identificadorTecnico`, and `classificationStatus` from the newly REST-typed resources. Unit 11 explicitly forbids wiring that screen; the required projection belongs to the unchecked Unit 12 task.
- `pnpm test` was not run after that authoritative typecheck failure: the full-green condition cannot be met without changing the unlisted Unit 12 screen and its regression tests. No live backend, browser, server, mutation, commit, branch, push, PR, receipt acquisition, or settlement was attempted.
- `git diff --check` passed.
- Exact candidate accounting on the four tracked Unit 11 source/test paths is **411 additions + 727 deletions = 1,138 changed lines**; the new authorized architecture test is untracked and not included in that Git stat. This exceeds the supplied `resource-rest-window-hook` maximum of 400 by 738 lines before its architecture test/artifact additions. No `size:exception`, reset, or further delivery slice was inferred.

### Required interaction

1. Decide whether to reset/split or explicitly accept the measured Unit 11 size overage; the active 400-line token must not be acquired or settled by this executor.
2. If the intended next work is the atomic screen projection, explicitly authorize Unit 12 and these additional paths: `src/features/resources-master/ResourcesMasterScreen.tsx`, `tests/unit/resourcesMasterScreen.test.tsx`, and `tests/unit/resourcesMasterScreenRefetch.test.tsx`. That work cannot be performed as Unit 11 because the task expressly forbids screen wiring.

### Task / action context / rollback

- Re-read `tasks.md`: only Unit 11 was selected, remains `[ ]`, and no parent-owned row was edited. No persisted checkbox was changed because the task is not complete.
- Consumed structured context: exact change `replace-convex-with-rest-backend`, canonical apply ready/no blockers, Unit 10 complete, strict TDD, `auto-chain`/`stacked-to-main`, repo-local root, only the user-provided edit surfaces, and parent token `sha256:b45decfc0a023061655852f0e796cbd02d7fd9050aa4a594bd02245eb4cee256` as context only. The stale native ambiguous snapshot was superseded by this explicit selection.
- Rollback candidate boundary: only `useResourcesMasterListQuery.ts`, `useResourcesMasterList.ts`, their two rewritten tests, and the new architecture test; no screen or backend byte changed.

### TDD Cycle Evidence

| Task                | Test file                                                                                                                                              | Layer                  | Safety net                                  | RED                                                                   | GREEN             | TRIANGULATE                                                                                         | REFACTOR                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------- | --------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Unit 11 REST window | `tests/unit/useResourcesMasterListQuery.test.tsx`, `tests/unit/useResourcesMasterList.test.ts`, `tests/architecture/resourcesMasterBoundaries.test.ts` | Hook/unit/architecture | Legacy focused baseline: 2 files, 19 passed | 3 files failed for absent REST-window API and infinite-query boundary | 3 files, 7 passed | Identity, debounce/reset, flags, pending navigation, stale response, retry/refetch, and cache cases | Debounce and controller extraction; focused suite remained green |

## Unit 11 — authorized rollback for `redesign_staged_hook`

**Status:** rollback complete; Unit 11 remains unchecked and no replacement REST hook was implemented.

### Authorized rollback

- Restored the exact pre-attempt Git bytes for `src/features/resources-master/useResourcesMasterListQuery.ts`, `src/features/resources-master/useResourcesMasterList.ts`, `tests/unit/useResourcesMasterListQuery.test.tsx`, and `tests/unit/useResourcesMasterList.test.ts` using a path-limited restore only.
- Deleted only the untracked 17-line Unit 11 addition `tests/architecture/resourcesMasterBoundaries.test.ts`; it did not exist before this attempt.
- Did not restore, modify, or otherwise touch inherited Unit 8–10 Resources adapter, types, hierarchy, test, screen, Creator, catalog, shared, or unrelated worktree paths. No broad reset or checkout was used.
- Re-read `tasks.md`: the sole Unit 11 implementation row remains visibly `- [ ]`; no parent-owned checkbox changed.

### Verification

- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm exec vitest run tests/unit/useResourcesMasterListQuery.test.tsx tests/unit/useResourcesMasterList.test.ts` → **2 files, 19 passed**.
- `pnpm test` → **61 files, 653 passed**, with zero skips and no warnings.
- `git diff --check` → passed.
- Exact Unit 11 candidate source/test diff against the pre-attempt baseline is **0 additions, 0 deletions** across the four restored tracked files; `resourcesMasterBoundaries.test.ts` is absent. The only retained Unit 11 byte is this cumulative apply-progress record.

### Lifecycle, redesign, and rollback boundary

- Parent explicitly selected `redesign_staged_hook` and retains settlement ownership for `sha256:b45decfc0a023061655852f0e796cbd02d7fd9050aa4a594bd02245eb4cee256`; this executor did not acquire, settle, reset, commit, branch, push, open a PR, call a backend, or implement a replacement hook.
- Future redesign must be planned as a dependency-correct typed migration before any REST hook implementation: the existing screen remains legacy and no compatibility adapter may invent G8-prohibited name, diagnostic, or status fields or retain a Convex fallback.
- Rollback boundary was limited to the five authorized Unit 11 candidate paths plus this progress record.

## Unit 11 — redesigned isolated REST window

**Status:** blocked after strict-TDD GREEN because the required full suite is not green under the supplied edit allowlist. The Unit 11 implementation checkbox remains visibly unchecked.

### Candidate work

- Added the isolated `useResourcesMasterRestWindow.ts`; it uses one `useQuery` REST page through an injected `ResourcesMasterRestReadApi.listResources` seam, with `retry: false` and focus/reconnect/mount refetch disabled.
- The key and request include trimmed text, scope, Class/Family/Type codes, limit, and offset. A non-offset identity change debounces 250 ms and resets offset; next/previous use only server flags and block duplicate pending navigation.
- Added concise hook coverage for window replacement, debounce/reset, explicit retry/refetch, stale identity completion, and per-`QueryClient` cache isolation, plus an architecture boundary that rejects legacy-list, Convex, infinite-query, cursor, flatten, and dedupe seams.
- No legacy hook, legacy test, screen, selector, fallback, Convex call, or backend request was modified or introduced.

### TDD Cycle Evidence

| Task                         | Test file                                              | Layer        | Safety net      | RED                                                                                                      | GREEN                                 | TRIANGULATE                                                                                                       | REFACTOR                                                                                |
| ---------------------------- | ------------------------------------------------------ | ------------ | --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Unit 11 isolated REST window | `tests/unit/useResourcesMasterRestWindow.test.tsx`     | Hook unit    | N/A (new files) | `pnpm exec vitest run tests/unit/useResourcesMasterRestWindow.test.tsx` failed resolving the absent hook | 4 tests passed after the minimum hook | 5 hook cases cover navigation, identity/reset/debounce, manual retry/refetch, stale response, and cache isolation | Stabilized query key and synchronous pending-navigation guard; focused run stayed green |
| Unit 11 boundary             | `tests/architecture/resourcesMasterBoundaries.test.ts` | Architecture | N/A (new file)  | Covered by the hook's absent-module RED                                                                  | Focused architecture test passed      | Rejects legacy/infinite/cursor/accumulation imports and permits the REST query seam                               | No further refactor needed                                                              |

### Verification

- Focused: `pnpm exec vitest run tests/unit/useResourcesMasterRestWindow.test.tsx tests/architecture/resourcesMasterBoundaries.test.ts` → **2 files, 6 tests passed**, zero skips and warnings.
- Type check: `pnpm typecheck` → passed after the focused GREEN run; route generation produced no tracked or untracked generated delta.
- Full suite: `pnpm test` → **blocked**, 62 files / 658 tests passed and one architecture test failed: `tests/architecture/queryZodBoundaries.test.ts` rejects the required named `useQuery` import in `src/features/resources-master/useResourcesMasterRestWindow.ts`.
- `git diff --check` → passed. New source/tests total **303 lines** (144 hook, 144 unit test, 15 architecture test), within the 400-line boundary.
- Runtime harness: N/A; injected API doubles only, with no browser, server, live backend, or mutation request.

### Exact blocker and required settlement path

`tests/architecture/queryZodBoundaries.test.ts` is outside the allowed edit surfaces. Its `queryBindings` allowlist must add `src/features/resources-master/useResourcesMasterRestWindow.ts` with only named `useQuery`; otherwise the required full suite cannot pass. Do not add a compatibility wrapper or remove the required query import. After that narrowly authorized guard update, rerun focused/typecheck/full tests and the parent may settle a passing result that remediates failed evidence `sha256:58a5041cc5a678c15be5f05a9cdb65a7a558f5309199e0097ecdd4511b840bc8` with fresh evidence. This executor did not acquire or settle the supplied token.

### Task, status, and boundary

- Re-read `tasks.md`: the only selected Unit 11 implementation row remains `- [ ]`; no parent-owned row changed.
- Consumed user-selected status: `replace-convex-with-rest-backend`, canonical apply ready, strict TDD, `auto-chain` / `stacked-to-main`, repo-local workspace, 400-line `isolated-resource-rest-window` boundary, and the permitted edit surfaces. The injected native snapshot was stale/ambiguous; the explicit change selection resolved this bounded work unit. No action-context warnings were supplied.
- Rollback removes only the three new hook/test files and this evidence; it does not alter legacy Resources wiring or backend data.

## Unit 11 — authorized Query boundary closure

**Status:** complete. The Unit 11 implementation checkbox is visibly `[x]`.

### Completed correction

- Narrowly allowlisted only `src/features/resources-master/useResourcesMasterRestWindow.ts` with named `useQuery` in `tests/architecture/queryZodBoundaries.test.ts`; every other Query, Zod, Convex, named-import, and forbidden-cache-action guard remains unchanged.
- The already-added isolated REST window remains unconnected to the screen and legacy hooks. No other source or test path was changed in this closure.

### Verification

- Focused: `pnpm exec vitest run tests/unit/useResourcesMasterRestWindow.test.tsx tests/architecture/resourcesMasterBoundaries.test.ts tests/architecture/queryZodBoundaries.test.ts` → **3 files, 11 tests passed**, zero skips and warnings.
- `pnpm typecheck` → passed; route generation created zero tracked or untracked generated delta.
- `pnpm test` → **63 files, 659 tests passed**, zero skips and warnings.
- `git diff --check` → passed.
- Workload: 303 new hook/test lines plus 3 narrow allowlist lines, **306 lines total**, within the 400-line `isolated-resource-rest-window` boundary.
- Runtime harness: N/A; all requests are injected test doubles and no backend/browser/mutation was invoked.

### TDD Cycle Evidence

| Task                           | Test file                                       | RED                                                                                     | GREEN                                                                           | TRIANGULATE                                                                     | REFACTOR                                        |
| ------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| Unit 11 Query boundary closure | `tests/architecture/queryZodBoundaries.test.ts` | Prior required full suite failed because the new named `useQuery` import was unapproved | Focused architecture test passed after the single-path/single-binding allowlist | Full suite proves other protected-package and cache-action guards remain active | No refactor beyond the exact allowlist addition |

### Task, lifecycle, and boundary

- Re-read `tasks.md`: only the Unit 11 implementation-owned row changed to `[x]`; parent-owned rows remain byte-for-byte deferred.
- This parent-authorized closure continued the supplied same Unit 11 objective and requires fresh passing evidence remediating `sha256:58a5041cc5a678c15be5f05a9cdb65a7a558f5309199e0097ecdd4511b840bc8`.
- No token was acquired or settled: receipt settlement is parent-owned. No commit, branch, push, PR, screen wiring, legacy-hook edit, or runtime fallback occurred.
- Rollback removes the new hook/tests and the three-line allowlist correction only.

## Unit 11a — direct contract-pending Creator remediation

**Status:** blocked before completion. The implementation-owned 11a checkbox remains visibly `[ ]`; no runtime settlement was attempted.

### Completed candidate work

- Added RED-first direct-entry coverage that mounts `CrearRecursoSurface` without API, ownership, or hierarchy-snapshot props and verifies the accessible pending announcement, initial focus, `N`, Volver, Escape, focus restoration, and zero `fetch` calls.
- Removed the Creator surface's API, ownership, snapshot, flow, hierarchy, evaluation, attribute, review, and creation wiring; opening now renders only the existing `ResourceCreationContractPending` inside the existing Dialog, rail, shell, and command bar.
- Removed the caller's snapshot derivation and all Creator props from `ResourcesMasterScreen.tsx`; no screen REST switch was made and no CSS/shared component/listener was added.

### TDD Cycle Evidence

| Task                     | Test file                                                | Safety net                                    | RED                                                                                                         | GREEN                                           | TRIANGULATE                                                                         | REFACTOR                                                                          |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 11a direct pending entry | `tests/unit/crearRecursoSurfaceContractPending.test.tsx` | 73 existing Creator/screen/shell tests passed | 2 tests failed because the old surface mounted Query-backed `useResourceCreationFlow` without a QueryClient | 2 tests passed after the minimal direct surface | N-click/Escape and trigger-click/Volver exercise distinct opening and closure paths | Removed now-dead editable-target guard; focused tests stayed green after Prettier |

### Verification

- Focused: `pnpm exec vitest run tests/unit/crearRecursoSurfaceContractPending.test.tsx tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/appShell.test.tsx` → **4 files, 40 tests passed**, zero skips and warnings.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **failed**: 62 files / 621 tests passed; five failures are in unlisted `tests/architecture/resourceCreationBoundaries.test.ts` (four obsolete assertions requiring the removed Creator flow/context/attribute wiring) and `tests/unit/resourcesMasterScreenRefetch.test.tsx` (one obsolete post-create callback assertion).
- `pnpm exec prettier --check` on all allowed 11a source/test surfaces → passed.
- `git diff --check` → passed.
- Runtime harness: N/A; focused tests use no API prop and assert zero `fetch` calls. No live HTTP, Convex route, backend, commit, branch, push, PR, or settlement was invoked.

### Blocker and remaining task

The two failing files are outside the supplied allowed edit surfaces. Updating their obsolete architecture and post-create expectations is necessary for the required full suite to pass, but editing them would violate the authoritative allowlist. The exact 11a task remains unchecked until those files are explicitly authorized, the full suite is green, and the parent settles the supplied bounded objective.

### Workload, status, and action context

- Delivery boundary: `remediation11a`, `auto-chain` / `stacked-to-main`, max 300. The worktree contains inherited uncommitted changes, so raw Git diff totals cannot certify this slice's budget; no size exception is inferred and no completion is claimed.
- Consumed parent status: `changeName=replace-convex-with-rest-backend`, OpenSpec apply ready, strict TDD, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and only the supplied edit surfaces. No action-context warnings were reported.
- Parent-owned lifecycle rows remain deferred byte-for-byte. No persisted task checkbox was changed.

## Unit 11a — authorized full-suite closure

**Status:** complete. The 11a implementation-owned task is visibly marked `[x]`; runtime settlement remains parent-owned.

### Completion update

- Narrowly replaced only the four obsolete architecture assertions that required the removed Creator flow/context/attribute wiring. The updated guard now requires the direct pending surface to remain free of API, ownership, flow, evaluation, attribute, review, and creation transport while retaining its unrelated flow/model safety walls.
- Replaced the obsolete post-create callback/refetch test with an actual `ResourcesMasterScreen` Creator opening assertion: the pending heading receives focus, the legacy list query remains at its initial single request, and the creation route is not called.
- No REST list wiring, Query-window connection, screen projection, CSS, shared component, listener, Convex fallback, or Unit 12 work was added.

### Verification

- Focused: `pnpm exec vitest run tests/architecture/resourceCreationBoundaries.test.ts tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/crearRecursoSurfaceContractPending.test.tsx tests/unit/crearRecursoSurface.test.tsx tests/unit/resourcesMasterScreen.test.tsx tests/unit/appShell.test.tsx` → **6 files, 57 tests passed**, zero skips and warnings.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **64 files, 626 tests passed**, zero skips and warnings.
- `pnpm exec prettier --check` on all allowed 11a source/test surfaces → passed.
- `git diff --check` → passed.

### TDD Cycle Evidence

| Task                           | Test file                                               | RED                                                                       | GREEN                                                                                | TRIANGULATE                                                                                                                    | REFACTOR                                                           |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 11a pending boundary guards    | `tests/architecture/resourceCreationBoundaries.test.ts` | Existing focused guard failed on four obsolete mounted-flow assertions    | 16 architecture tests passed after only direct-pending boundary expectations changed | Assertions separately reject API/ownership/flow and context/attribute wiring while preserving model and standalone-flow guards | No production refactor; the replacement expectations remain narrow |
| 11a caller no-refetch behavior | `tests/unit/resourcesMasterScreenRefetch.test.tsx`      | Existing focused test failed because the removed callback never refetched | Actual screen/Creator test passed after replacing callback mock                      | It checks both pending focus and zero additional list/create calls                                                             | Removed the obsolete callback mock; no screen wiring changed       |

### Persisted task and boundary

- Marked only the 11a implementation-owned checkbox `[x]` in `tasks.md`; parent-owned lifecycle rows remain byte-for-byte deferred.
- Delivery boundary: `remediation11a`, `auto-chain` / `stacked-to-main`, parent-provided max 300. No size exception, commit, branch, push, PR, backend request, or runtime settlement was performed.
- Rollback: the direct Creator surface, its residual screen caller, the focused/architecture/refetch tests, and this progress record only.

## Unit 12a — shared `HierarchyNavigator` offset-window controls

**Status:** `interaction_required`; implementation and test/type verification are green, but the required repository-wide formatter check still reports eight warnings in files outside the supplied Unit 12a edit surfaces. The Unit 12a implementation checkbox remains visibly `[ ]`, and no lifecycle settlement was attempted.

### Completed candidate work

- Added optional per-column `hasPrevious`, `hasNext`, `onPrevious`, `onNext`, and `isNavigationPending` props to the shared `HierarchyNavigator` contract.
- Rendered accessible shared `Button` controls named `Anterior` and `Siguiente` only when the complete offset-window contract is supplied; each is disabled and non-actionable while navigation is pending or its server flag is false.
- Preserved existing cursor pagination (`Load more…`), selection, loading, error, retry, and spatial-metadata behavior unchanged. No hooks, adapters, cursor translation, deduplication, listener, CSS, token, or screen wiring was added.
- Added RED-first coverage for absent window controls, enabled callbacks, false navigation flags, pending navigation, and legacy navigator behavior.

### TDD Cycle Evidence

| Task                     | Test file                                | RED                                                                                                  | GREEN                                                                                | TRIANGULATE                                                                                  | REFACTOR                                                                                                         |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Unit 12a offset controls | `tests/unit/hierarchyNavigator.test.tsx` | `pnpm exec vitest run tests/unit/hierarchyNavigator.test.tsx` → failed because `Anterior` was absent | Same focused command → 5 tests passed after the minimal shared prop/rendering change | Added absent-contract plus independent false-flag and pending-control cases → 6 tests passed | No duplicate local behavior required extraction; the existing shared `Button` supplies focus and disabled chrome |

### Verification

- Focused: `pnpm exec vitest run tests/unit/hierarchyNavigator.test.tsx` → **6 tests passed**, zero skips and warnings.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`); generated route output produced no tracked or untracked delta.
- `pnpm test` → **64 files, 628 tests passed**, zero skips and warnings.
- `pnpm exec prettier --check src/shared/ui/HierarchyNavigator.tsx tests/unit/hierarchyNavigator.test.tsx` → passed after formatting the changed shared source.
- `git diff --check -- src/shared/ui/HierarchyNavigator.tsx tests/unit/hierarchyNavigator.test.tsx` → passed.
- Required `pnpm format:check` → **failed** with warnings limited to the eight unrelated paths listed below. `src/shared/ui/HierarchyNavigator.tsx` no longer appears in that output.

### Blocker and required interaction

The required full formatter reports pre-existing style warnings in:

- `src/features/resources-master/resourcesMaster.api.ts`
- `src/features/resources-master/useResourcesMasterRestWindow.ts`
- `tests/architecture/resourcesMasterBoundaries.test.ts`
- `tests/unit/catalogHierarchyApi.test.ts`
- `tests/unit/catalogHierarchyScreen.test.tsx`
- `tests/unit/resourcesMasterApi.test.ts`
- `tests/unit/restActorConfiguration.test.ts`
- `tests/unit/useResourcesMasterRestWindow.test.tsx`

Only `tests/unit/catalogHierarchyScreen.test.tsx` is listed in the supplied Unit 12a edit surfaces; formatting the other seven paths would violate the exact-surface instruction. Authorize those exact formatter-only paths (or waive the repository-wide format gate) before task completion and parent-owned settlement. No extra path was edited.

### Persisted task, boundary, and status

- Re-read `tasks.md`: the Unit 12a implementation-owned checkbox remains `[ ]`; no parent-owned row was modified.
- Candidate boundary: `hierarchy-navigator-offset-window`, `auto-chain` / `stacked-to-main`; **118 additions, 0 deletions** across the two authorized code/test files, within the supplied max-300 limit. No commit, branch, push, PR, backend call, or runtime settlement occurred.
- Rollback removes only `src/shared/ui/HierarchyNavigator.tsx`, `tests/unit/hierarchyNavigator.test.tsx`, and this Unit 12a progress record.
- Consumed parent context: exact change `replace-convex-with-rest-backend`, apply-ready, strict TDD, repo-local workspace root, supplied allowed edit surfaces, and continuation token `sha256:bdcf5cd82364b61b3aca473b8a2bebc2629a77c0ec614ef2ee6af72371700f86` for the active bounded objective. The executor did not acquire or settle the token. No action-context warning was otherwise reported.

## Unit 12a — formatter-waiver closure

**Status:** complete. The parent explicitly waived the pre-existing repository-wide `pnpm format:check` failures outside the Unit 12a edit surfaces and accepted targeted changed-file Prettier plus `git diff --check` as the formatting gate.

### Waiver and verification

- Reconfirmed `pnpm exec prettier --check src/shared/ui/HierarchyNavigator.tsx tests/unit/hierarchyNavigator.test.tsx` → passed.
- Reconfirmed `pnpm exec vitest run tests/unit/hierarchyNavigator.test.tsx` → **6 tests passed**, zero skips and warnings.
- Reused the unchanged prior verification: `pnpm typecheck` passed and `pnpm test` passed with **64 files / 628 tests**, zero skips and warnings. No source or test bytes changed between that verification and this closure.
- Reconfirmed `git diff --check` → passed.
- Exact Unit 12a source/test diff: `src/shared/ui/HierarchyNavigator.tsx` **28 additions, 0 deletions**; `tests/unit/hierarchyNavigator.test.tsx` **90 additions, 0 deletions**; **118 additions, 0 deletions total**, within the active max-300 objective.
- The waived full formatter warnings remain limited to unrelated, non-edited files. No formatter action occurred outside the authorized Unit 12a surfaces.

### Persisted task and boundary

- Marked only the Unit 12a implementation-owned task `[x]` in `tasks.md`; all parent-owned lifecycle rows remain byte-for-byte deferred.
- Delivery / PR boundary: `hierarchy-navigator-offset-window`, `auto-chain` / `stacked-to-main`. Rollback removes only the shared navigator extension, its unit tests, and this Unit 12a progress evidence.
- No commit, branch, push, PR, backend request, source/test edit, token acquisition, or receipt settlement occurred in this closure. Parent-owned lifecycle processing must use the supplied active token if required.

### Structured status and action context

- Consumed parent status: `changeName=replace-convex-with-rest-backend`, canonical apply-ready, strict TDD, repo-local workspace, allowed Unit 12a surfaces, active token `sha256:bdcf5cd82364b61b3aca473b8a2bebc2629a77c0ec614ef2ee6af72371700f86`, and explicit formatter waiver. No action-context warnings or design deviations were observed.

## Unit 12b — REST screen switch and G8 projection

**Status:** blocked by the human-authorized maximum of 660 changed lines. The Unit 12b implementation checkbox remains visibly unchecked; no G8 report, lifecycle acquire/settlement, commit, branch, push, PR, backend request, or mutation occurred.

### Strict-TDD evidence

| Task                   | RED                                                                                                                                                                                                                                                                           | GREEN                                                                             | TRIANGULATE                                                                                              | REFACTOR                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Unit 12b screen switch | `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/resourcesMasterBoundaries.test.ts` → 6 failures: the screen still required the legacy factory/query and the REST-only boundary was absent | The same focused command → 3 files, 7 tests passed after the atomic screen wiring | `tests/unit/appShell.test.tsx` was migrated to REST-only mocks; focused 4-file command → 29 tests passed | No code-size reduction was attempted after measurement because it would obscure a real review-boundary overage |

### Candidate work and verification

- The candidate creates only `createResourcesMasterRestApi`, passes its REST reader to `useResourcesHierarchy`, and passes the active code filters plus `scope: 'ACTIVE'`, text, limit, and offset ownership to `useResourcesMasterRestWindow`.
- The screen candidate uses offset replacement controls, preserves retry/loading/empty/error and focus/keyboard seams, leaves the Creator direct pending with no API props, and projects identity, scope codes, natural unit, active, revision, and attributes only.
- Focused GREEN: `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/appShell.test.tsx tests/architecture/resourcesMasterBoundaries.test.ts` → 4 files, 29 tests passed, zero skips and warnings.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `git diff --check` on the five allowed code/test paths → passed.

### Workload blocker and required human decision

- Current tracked diff across the allowed Unit 12b source/test paths is **387 additions and 927 deletions = 1,314 changed lines**: `ResourcesMasterScreen.tsx` 126/181, `appShell.test.tsx` 46/76, `resourcesMasterScreen.test.tsx` 152/586, and `resourcesMasterScreenRefetch.test.tsx` 63/84. The pre-existing architecture test is untracked and is not included in that Git total.
- This exceeds the exact authorized maximum of 660. Stop before full-suite/formatter gates, task completion, or settlement; do not infer a size exception.
- Required decision: authorize a dependency-correct split/reset with a new measured boundary, or explicitly authorize a larger size exception. The current candidate must not be marked complete under the 660-line limit.

### Remaining tasks and action context

- [ ] **RED → GREEN → TRIANGULATE → REFACTOR:** Unit 12b REST screen switch remains unchecked in `tasks.md`.
- [ ] Register G8 remains unchecked by explicit user instruction; no `gap-reports/G8.md` was created.
- Delivery remains `auto-chain` / `stacked-to-main`; the intended PR boundary is `resources-rest-screen-switch`. Parent-owned lifecycle rows remain deferred byte-for-byte.
- Consumed native status: `changeName=replace-convex-with-rest-backend`, `artifactStore=openspec`, `applyState=ready`, `nextRecommended=apply`, no blockers, strict TDD, repo-local workspace `/home/garfex/PROGRAMACION/sistema-ui-garfex`, and the workspace as the allowed edit root. The parent supplied token `sha256:2cbbc8bcc46677bfad358beadb26f63a6a1c07157673fe9d04b226aa436b4040`; it was not acquired or settled.

## Unit 12b — targeted formatter correction closure

**Status:** complete for the implementation-owned REST screen-switch task. This correction used the parent-supplied verification token `sha256:dad85957c3cb567c391c991361ecf704d17a2bc5147e928e183793338cd70db6` as context only; it did not acquire, settle, create, or approve any lifecycle receipt.

### Completed work

- Ran Prettier write only on `tests/unit/resourcesMasterScreen.test.tsx`, `tests/unit/resourcesMasterScreenRefetch.test.tsx`, and `tests/unit/appShell.test.tsx`.
- Inspected the resulting candidate diff. No non-Prettier edit was made to those test files in this correction; their REST migration semantics remain the existing candidate.
- Marked only the Unit 12b implementation-owned checkbox `[x]` in `tasks.md`. The separately owned G8-report checkbox remains `[ ]` exactly as instructed; no G8 report, backend action, source edit, commit, branch, push, or PR occurred.

### TDD Cycle Evidence

| Task                        | RED                                     | GREEN                              | TRIANGULATE                                                         | REFACTOR / formatter closure                                                           |
| --------------------------- | --------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Unit 12b REST screen switch | Prior evidence records the RED failures | Prior GREEN evidence remains valid | Prior REST-only mock migration remains covered by the focused suite | Prettier-only correction passed all fresh checks below; no production behavior changed |

### Fresh verification evidence

- `pnpm exec prettier --check tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/appShell.test.tsx` → passed.
- `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/unit/appShell.test.tsx tests/unit/useResourcesHierarchy.test.ts tests/unit/useResourcesMasterRestWindow.test.tsx tests/architecture/resourcesMasterBoundaries.test.ts` → **6 files, 41 tests passed**.
- `pnpm typecheck` → passed (`pnpm router:generate && tsc -b`).
- `pnpm test` → **64 files, 618 tests passed**.
- `git diff --check` → passed.

### Files, counts, and remaining work

- Formatter targets: `tests/unit/resourcesMasterScreen.test.tsx` **161 additions / 586 deletions**, `tests/unit/resourcesMasterScreenRefetch.test.tsx` **68 / 82**, and `tests/unit/appShell.test.tsx` **52 / 70**; combined tracked candidate total: **281 additions / 738 deletions (1,019 changed lines)**. These are the complete current candidate totals, not additional semantic work from this formatter-only correction.
- Artifact updates: `openspec/changes/replace-convex-with-rest-backend/tasks.md` and this cumulative `apply-progress.md`.
- Exact remaining Unit 12b line: `- [ ] Registrar separadamente la adaptación G8 ya autorizada en openspec/changes/replace-convex-with-rest-backend/gap-reports/G8.md, con columnas/detalle retirados, evidencia pública e impacto visible; no requerir aceptación humana adicional ni inventar campos de reemplazo. <!-- sdd-owner: implementation -->`
- Delivery boundary remains `resources-rest-screen-switch`, `auto-chain` / `stacked-to-main`. Parent-owned lifecycle rows remain deferred byte-for-byte; parent owns settlement.

### Structured status and action context

- The current parent instruction resolves the stale ambiguous selection by explicitly selecting `replace-convex-with-rest-backend` and restricts writes to the three tests plus these two OpenSpec artifacts. Those allowed edit surfaces were honored.
- Strict TDD remains active. This was a formatting-only correction after an independently verified functional candidate, so no new RED production cycle was appropriate; the inherited RED→GREEN→TRIANGULATE evidence is preserved above.

## Unit 12b — G8 report closure

**Status:** complete for the separately owned G8 report checkbox; parent owns any lifecycle settlement.

### Completed work

- Added `gap-reports/G8.md`, documenting the public `GET /v1/resources` evidence, the visible REST projection (`identityV1`, scope codes, natural unit, active, revision, attributes), removed legacy fields, visible impact, user authorization, no identity reinterpretation, no describe N+1, no Convex fallback, and the public-contract reopening condition.
- Marked only the implementation-owned G8 report checkbox `[x]` in `tasks.md`; parent-owned lifecycle rows remain byte-for-byte deferred.

### Verification and boundary

- Documentation-only closure: no source, test, backend, or lifecycle action was performed; strict-TDD evidence for the completed Unit 12b screen switch remains recorded above.
- This report cites the already-passed focused Unit 12b suite (41 tests), `pnpm typecheck`, and `pnpm test` (64 files / 618 tests). Fresh artifact readback, grep, `prettier --check` for `G8.md`, and `git diff --check` are recorded for this closure; the pre-existing task/progress artifacts still report Prettier warnings, so no broad formatting rewrite was made.
- Delivery boundary remains `resources-rest-screen-switch`, `auto-chain` / `stacked-to-main`; no token acquisition, settlement, commit, branch, push, or PR occurred.

### Structured status and action context

- The supplied exact change selection resolves the stale ambiguous native status. `repo-local` workspace authority and the three supplied artifact paths were honored; no action-context warnings or design deviations occurred.
- No implementation-owned work remains in the assigned G8 report slice. Other unchecked implementation and parent-owned lifecycle rows remain outside this closure.

## Unit 6 — Direct APLICABILIDAD REST adapter

**Status:** complete; only the Unit 6 implementation checkbox is marked `[x]`.

- Added feature-local read-only DTOs and `GET /v1/catalog/APLICABILIDAD` by `typeCode`, offset, and limit.
- The adapter validates every page record against the Clase→Familia→Tipo snapshot, preserves rules without evaluation, and fails closed for invalid envelopes, values, references, modes, IDs, revisions, or optional option-set data.
- RED: the focused contract test failed because the adapter module was absent. GREEN: focused tests and typecheck passed. TRIANGULATE: invalid page/reference cases, id `"0"`, modes, offset flags, encoded URL, HTTP/network/JSON failures, and architecture boundaries passed.
- `pnpm exec vitest run tests/unit/catalogTypeAttributesReadContract.test.ts tests/unit/catalogTypeAttributesReadApi.test.ts tests/architecture/restTransportBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts` → 4 files, 13 tests passed.
- `pnpm typecheck` → passed; `pnpm test` → 66 files, 623 tests passed.
- Remediation adds full-page invalidation, active/rule/reference-id/class-code, and negative-offset coverage. Unit 6 is 395 changed lines: 375 source/test lines, two allowlist substitutions, checkbox/progress, and the one-line spec replacement. No UI, legacy API, Unit 7, characteristic lookup, backend request, commit, branch, push, or PR changed.

## Unit 7a — Effective attributes Core REST adapter

**Status:** complete; only the Unit 7a implementation checkbox is marked `[x]`.

- Added strict pure effective-attribute DTOs and the injected-fetch `GET /v1/types/{encodedTypeCode}/attributes/effective` adapter with deterministic `classCode`, then `familyCode`, query order.
- The adapter rejects incomplete context before HTTP and rejects complete responses with mismatched type, invalid nested fields, unsupported literals, null/default/coercion, partial rows, or invalid shared rules/values; it preserves Core order, rules, positions, and `hasPosition` without evaluating or inferring them.
- RED: focused API test failed because the adapter module was absent. GREEN: focused API/transport/keyboard suite passed (3 files, 13 tests); `pnpm typecheck` and `pnpm test` passed (67 files, 628 tests).
- The REST allowlists name only the fourth effective adapter. No Unit 6 calls, Convex, `PRESENTACION`, `OPCION`, `characteristicCode`, UI, backend request, commit, branch, push, or PR changed.

## Unit 7a-i — Required effective attribute options correction

**Status:** complete; only the Unit 7a-i implementation checkbox is marked `[x]`.

- `EffectiveAttribute.options` is now required and readonly as an ordered array of readonly `{ code, label }` items. The parser requires the field, accepts `[]`, preserves values/order, and rejects missing, null, non-array, malformed, extra-key, or mixed-validity options with the complete response.
- No non-empty constraint was added to option code/label: the public artifact requires strings, not non-empty strings. No defaults, coercion, filtering, lower-level reads, or rule evaluation were introduced; the retained GET URL and existing contextual validation remain unchanged.
- RED: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributesApi.test.ts` → 1 file, 3 failed. Valid fixtures were rejected because `options` was not yet an exact attribute key, and the new missing-options case resolved instead of failing.
- GREEN/TRIANGULATE: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributesApi.test.ts` → 1 file, 6 tests passed. The focused cases cover missing/null/non-array options, invalid code/label, extra item keys, an invalid item among valid items, and valid empty options.
- The correction remains within the 350-line Unit 7a-i cap. Unit 7a-ii guards and full validation commands remain deferred.

## Unit 7a-ii — Effective attributes tests, guards, and verification

**Status:** complete; only the Unit 7a-ii implementation checkbox is marked `[x]`.

- Scoped checks: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributesApi.test.ts tests/architecture/restTransportBoundaries.test.ts` → **2 files, 14 tests passed**. Coverage includes encoded URL/query order, incomplete context with zero HTTP, no offset/limit/`characteristicCode`, exact type code, empty attributes, nested domains, strict `options`, HTTP/network/JSON, extra-object, and partial-response rejection; the transport guard permits only the fourth GET adapter and rejects Convex, lower-level reads, `POST /evaluate`, and alternate routes.
- `pnpm typecheck` → passed; `pnpm build` → passed; final `pnpm test` → **67 files, 629 tests passed**.
- `git diff --check` → clean; generated `src/routeTree.gen.ts` → clean (no diff).
- An unrelated intermittent `useResourcesHierarchy` race was observed during verification and is not claimed fixed by this unit. Global `pnpm lint` and `pnpm format:check` debt also remains unrelated and is not claimed fixed.
- This verification closure makes no source or test edits; no backend request, mutation, Unit 7b+, commit, branch, push, or PR action occurred.

## Unit 7b — Effective attributes contextual hook

**Status:** complete; only the Unit 7b implementation checkbox is marked `[x]`.

- Added a feature-local hook with exact Class/Family/Type snapshots, local waiting/loading/ready/empty/error states, atomic data/error/selection reset, explicit retry, and AbortController plus generation guards for stale success, error, and finally paths.
- RED: `pnpm exec vitest run tests/unit/useCatalogTypeEffectiveAttributes.test.tsx` failed because the hook module was absent.
- GREEN/TRIANGULATE: `pnpm exec vitest run tests/unit/useCatalogTypeEffectiveAttributes.test.tsx` → 6 tests passed, covering incomplete context, all three code changes, empty/error, retry deduplication, A→B→A stale success/error/finally, and unmount abort.
- `pnpm typecheck` → passed. The first required `pnpm test` observed an unrelated `tests/unit/useResourcesHierarchy.test.ts` race: after `continueClasses()`, it retained the offset-0 Class window rather than the expected offset-20 server page. No Resources file was edited. A second full run passed: `pnpm test` → 68 files, 635 tests passed.
- No Unit 6, Convex, base read, POST/evaluate, cache, pagination, or callback/API identity dependency was introduced.

## Unit 7c — Effective attributes read-only UI and atomic screen switch

**Status:** complete; only the Unit 7c implementation checkbox is marked `[x]`.

- The mounted Attributes path now composes only `createCatalogTypeEffectiveAttributesApi` and `useCatalogTypeEffectiveAttributes`; the focused read-only component preserves Core order, literal mode/source, options, rules, and conditional position visibility without evaluation or mutation actions.
- RED: the focused component test failed while `CatalogTypeEffectiveAttributes` was absent. GREEN/TRIANGULATE: focused UI, screen, keyboard, and architecture checks passed (37 tests), including accessible remote states, retry, `FAMILY`/`TYPE`, `CONDITIONAL`, and no legacy mounted actions.
- Remediation: restored all 9 non-attribute `CatalogHierarchyScreen` regression behaviors (refetch, notifications, static mode, parent codes/reset, window/retry, stale response, CTAs, and keyboard/Escape), remediating the prior failed evidence caused by their over-deletion.
- Independent final verification passed: focused 37, scoped lint/Prettier, typecheck, build, full suite 69 files / 632 tests, `git diff --check`, and generated `routeTree` clean.
- Authorized ceiling: 3,100 changed lines. Exact current measurement: 2,952 changed lines against audited pre-Unit7c baseline `695488f734da0f7617488d73251df6d90b58c679`.

## Unit 7c-i — Compact list and GARFEX detail Dialog

**Status:** complete; the Unit 7c-i implementation and parent preflight checkboxes are marked `[x]` after scoped and full verification.

- Replaced the undefined `catalog-attribute-*` CSS hooks with semantic Tailwind utilities: a structured header, accessible grouped list, compact responsive rows, token-backed state surfaces, and the shared `Button` retry control. No WorkCard is nested in the feature panel.
- The feature-local read-only Dialog now renders each Summary, Applicability, Options, and Rules section as a coherent semantic-token card. Options and rules remain ordered, accessible lists with scannable cards; no Core read, mutation, raw JSON, or evaluation was added.
- RED: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributes.test.tsx` failed because the panel retained its undefined legacy class instead of the required Tailwind layout/list contract. GREEN/TRIANGULATE: the same test passed after the explicit semantic layout replaced every legacy hook.
- Focused verification: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributes.test.tsx tests/unit/catalogHierarchyScreen.test.tsx tests/unit/catalogHierarchyKeyboard.test.tsx tests/unit/dialog.test.tsx tests/architecture/catalogHierarchyBoundaries.test.ts tests/architecture/keyboardBoundaries.test.ts tests/architecture/restTransportBoundaries.test.ts` → 7 files, 39 tests passed; scoped Prettier and ESLint passed; `pnpm typecheck` passed.
- Full verification: `pnpm test` → 70 files, 634 tests passed. The prior `pnpm build` remains green and no build-relevant code changed in this polish pass.
- Non-causal global blockers: `pnpm lint` still fails only in pre-existing out-of-scope Resources Master and `catalogTypeAttributesReadContract` diagnostics; `pnpm format:check` still reports only pre-existing out-of-scope formatting files. Neither reports a touched 7c-i file.
- Size: a conservative measured bound is 708 lines, counting all 684 current lines of the five 7c-i code/test files (which deliberately overcounts retained Unit 7c and shared Dialog content), plus the 24-line screen/docs/OpenSpec closure. This is within the authorized 900-line ceiling.

### 7c-i verifier correction

- `CatalogValue` detail rendering now uses an explicit exhaustive discriminant switch: all scalar variants render human-readable text, BOOLEAN renders `Sí`/`No`, QUANTITY retains its unit, REFERENCE renders kind/id/code, NOT_APPLICABLE renders its label, and STRING_LIST renders a semantic named list rather than comma-flattened text. The `never` assertion makes a newly added schema variant a TypeScript error until it is handled.
- Focused detail coverage now supplies and asserts all eleven `CatalogValueSchema` variants, including the named STRING_LIST and full REFERENCE identity.
- The Dialog retains its mobile `100vh - 32px` maximum and adds `sm:max-h-[calc(100vh-156px)]`, leaving the 140px desktop top offset and 16px bottom inset. Its test asserts that responsive geometry and that Tab cycles from the last in-dialog control back to the first without reaching the aria-hidden outside control; focus containment remains owned by react-aria-components.
- RED: the complete-value test exposed BOOLEAN as `true`, REFERENCE without its id, and comma-flattened STRING_LIST; the Dialog geometry contract lacked the desktop max-height. GREEN: `pnpm exec vitest run tests/unit/catalogTypeEffectiveAttributes.test.tsx tests/unit/dialog.test.tsx` → 2 files, 8 tests passed.
- Correction verification: focused 7-file suite → 40 tests passed; `pnpm typecheck`, scoped Prettier/ESLint, and `git diff --check` passed; full `pnpm test` → 70 files, 635 tests passed. Previously recorded global lint/format blockers remain non-causal and out of scope.
- Updated conservative bound: 789 current lines across the same five code/test files plus the prior 24-line closure and this 8-line correction record = 821 lines, still within the 900-line cap.

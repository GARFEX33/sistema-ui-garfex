# Apply progress — active-unit-resource-creation

## F1 — Feature-local ACTIVE Units adapter

**Status:** complete. This work unit adds an unused feature-local adapter only; no creation-flow, UI, backend, deployment, policy API, or lifecycle work was changed.

### Completed implementation tasks

- [x] RED — Added an adapter contract test before production changes; the focused test failed with `api.listUnits is not a function`.
- [x] GREEN — Added the ACTIVE-only input, operation, transport/reference wiring, `listUnits`, and atomic `parseUnitsPage`.
- [x] TRIANGULATE — Added opaque cursor/undefined-field, multi-page, leak-prevention, and malformed-page/item rejection cases.
- [x] REFACTOR — Reused the existing envelope and `unitDetail` conventions; formatted only F1 source/test files.

The matching F1 implementation checkboxes are visibly `- [x]` in [tasks.md](tasks.md).

### Files changed

- `src/features/resources-master/resourcesMaster.types.ts`
- `src/features/resources-master/resourcesMaster.api.ts`
- `tests/unit/resourcesMasterApi.test.ts`
- `openspec/changes/active-unit-resource-creation/tasks.md`
- `openspec/changes/active-unit-resource-creation/apply-progress.md`

### Contract delivered

`ResourcesMasterApi.listUnits` invokes only `catalogoAdmin/unidades:listarUnidades` with `{ modo: 'ACTIVE', cursor?, pageSize? }`. It preserves an explicit `null` cursor, omits undefined optional fields, and drops injected Family, Type, and `paginationOpts` fields. `parseUnitsPage` validates the whole envelope before mapping every non-null `ResourceUnitDetail`, so malformed pages reject without returning partial items.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 adapter | `tests/unit/resourcesMasterApi.test.ts` | Unit | 616/616 baseline passing | Failing test executed | 40/40 focused passing | 42/42 focused passing | Prettier + 42/42 focused passing |

### Verification evidence

- `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts` — RED: 1 expected failure; GREEN: 40 passing; triangulate/refactor: 42 passing.
- `pnpm test -- tests/unit/resourcesMasterApi.test.ts` — passed: 56 files, 619 tests. (The package script runs the full Vitest suite despite the trailing target.)
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm format:check` — passed.
- `git diff --check` — passed.

### Workload and boundary

- Delivery path: `feature-branch-chain`.
- Boundary: F1 adapter/types/parser/contract tests only; F2 was not started.
- Tracked source/test diff: `A=117 D=0 A+D=117`. Including this 77-line progress artifact and the four task checkbox replacements (`4A+4D`), F1-owned review evidence is `A=198 D=4 A+D=202`, within the 320 A+D limit. The selected planning baseline is untracked, so `git diff --numstat` reports source/test only.

### Deviations

None. Existing policy APIs (`listUnitPolicies`, `getUnit`) remain unchanged, and the new adapter is not consumed by the creation flow.

### Remaining tasks

- [ ] **RED:** Add failing controller tests for initial load, continuation, first-seen deduplication by `resourceIdKey`, active/effective defensive filtering, initial/partial retry, empty non-exhausted pages, repeated cursors, pending no-op, and stale response/error/finally isolation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement `createActiveUnitPageController` over `createDependentLoader`, call only `listUnits(ACTIVE)`, expose Unit candidates without policy fields, and use opening/generation—not Family or Type—as its context key. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Prove close/unmount cancellation, reopen reset, retained pages across upstream selection changes, retry of the failed cursor, and no cross-generation item mixing. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Preserve the dependent-loader stale guards rather than duplicating them; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- src/features/resources-master/resourceCreation.activeUnits.test.ts && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

F3–F6 remain untouched. F3 remains blocked until the parent records compatible backend deployment evidence; no deploy or connected-runtime proof was attempted here. Parent-owned lifecycle checkboxes remain byte-for-byte unchanged.

### Structured status consumed

```json
{
  "changeName": "active-unit-resource-creation",
  "artifactStore": "openspec",
  "applyState": "apply-f1-authorized",
  "workUnit": "f1-active-unit-adapter",
  "actionContext": {
    "mode": "repo-local",
    "workspaceRoot": "/home/garfex/PROGRAMACION/sistema-ui-garfex",
    "allowedEditRoots": ["/home/garfex/PROGRAMACION/sistema-ui-garfex"],
    "warnings": ["F3 requires parent-recorded backend deployment; F1 is expressly allowed"]
  }
}
```

## F2 — Active-Unit page controller
**Status:** complete; unused controller only, with no F3 wiring, backend, policy, or lifecycle edits.
**Completed:** RED → GREEN → TRIANGULATE → REFACTOR; it uses F1's typed `listUnits({ modo: 'ACTIVE', cursor, pageSize? })` contract only.
**Files:** `resourceCreation.activeUnits.ts`, `resourceCreation.activeUnits.test.ts`, `tasks.md`, and this progress artifact.

### TDD Cycle Evidence
| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F2 controller | `tests/unit/resourceCreation.activeUnits.test.ts` | Unit | 16/16 loader tests | missing-module failure | 3 passing | 4 passing | formatted; 4 passing |

### Verification
- Safety net: `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts` — 16/16 passed; RED: temporary focused config failed on the missing controller module.
- Focused: `pnpm exec vitest run tests/unit/resourceCreation.activeUnits.test.ts` — 4/4 passed under the repository's normal test discovery.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` — passed.

### Workload and boundary
- `feature-branch-chain`; F2 controller/tests/evidence only, no F3; incremental `A=314 D=4 A+D=318`, within the 320 limit.
### Deviations, remaining, and status
- No design deviation. F3–F6 and parent-owned lifecycle rows remain unchecked and unchanged; F3 remains blocked pending parent-recorded backend deployment.
- Consumed explicit selected-change status: apply-ready, repo-local root allowed, `f2-active-unit-controller`; action-context warning: F3 deployment gate only.

## Parent gate — compatible backend before F3

**Status:** complete for the authorized isolated local environment only.

- Backend reviewed and committed feature chain: B1 `4a48731`, B2 `c7cc8fa`, B3 `a042722`, compatible B4 HEAD `cf67dbfe89b73256bfaa44459975a48c25b8d05d`.
- Backend committed tree `d03cd0601944e468299db408ccf505a53e4b70c5` exactly matched native-reviewed target `sha256:454e9cc18271b8118237b419669b26288522b83d7fceb5687073c92b163670e5`; gates passed 422/422 plus both typechecks.
- Authorized local endpoint: `http://127.0.0.1:3210`; no production or staging deployment occurred.
- Connected proof passed: active no-policy Metro Lineal evaluated `VALID`, creation returned `CREATED`, persistence contained the exact `unidadId`, policies remained unchanged with zero fixture-family policies, inactive/deleted Units returned `UNIT_INVALID`, and ACTIVE catalog pagination returned unique active/effective rows over three pages.
- Independent read-only verification passed. Receipt: `/tmp/active-unit-connected-proof.json`, SHA-256 `588a4f3b6be1cc1164181c47aa5cf6dd7abd309eadf8481a2da74bccda9e8162`.
- Residual fixture rows are inactive because the public API has no full-delete route; identifiers are intentionally omitted from the persisted artifact.

F3 is authorized to enable the direct ACTIVE-unit flow against this compatible local backend contract. This does not authorize frontend deployment, push, or PR creation.

## F3 — Flow and selector integration

**Status:** complete. The four F3 implementation rows are visibly `- [x]` in [tasks.md](tasks.md); F4–F6 and parent-owned rows remain unchanged.

### Completed and files

- Direct ACTIVE-page wiring replaced creator-only policy/hydrator orchestration; pages survive Type changes, selections/evaluations clear on changed Type, and each open uses a new generation.
- `ResourceCreationContextStage.tsx` removed this instance's preferred-policy key while retaining `StagedSearchSelector` capability; `CrearRecursoSurface.tsx` changed only its two Unit heading/focus literals.
- Changed: `useResourceCreationFlow.ts`, `resourceCreation.selectorState.ts`, `ResourceCreationContextStage.tsx`, `CrearRecursoSurface.tsx`, the two focused test files, `tasks.md`, and this artifact.

### TDD Cycle Evidence

| Cycle | RED | GREEN | TRIANGULATE / REFACTOR |
| --- | --- | --- | --- |
| F3 flow | Metro Lineal/direct ACTIVE test failed with zero `listUnits` calls | Direct controller wiring passed | 54 focused tests pass; policy/hydrator contracts and selector-state mapping migrated |

### Verification

- Focused normal-discovery: `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.selectorState.test.ts tests/unit/resourceCreation.activeUnits.test.ts tests/unit/useResourceCreationFlow.attributes.test.tsx tests/unit/useResourceCreationFlow.create.test.tsx` — 54/54 passed.
- `pnpm test` — 57 files, 624 tests passed; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `git diff --check` passed.
- Surface coverage proves no-policy Metro Lineal, explicit Enter/click confirmation, type-search non-confirmation, retained candidates during continuation/error, retry, Escape focus recovery, and zero `listUnitPolicies`/`getUnit` calls across open, pagination, retry, and close.

### Scope, workload, and remaining

- Design checklist: reused `StagedSearchSelector` and existing local focus/UI states; no new shared component, style, token, Tailwind/CSS, global keyboard, backend, F1/F2, or F4 work.
- Delivery boundary: user-authorized `f3-flow-integration-size-exception` only; F4–F6 remain unchecked and deferred to their original caps. No deviation from the approved F3 design.
- Final `688eb3d` diff: `A=308 D=369 A+D=677`, within the F3-only 720 A+D exception.
- Remaining F3 implementation rows: none. Deferred lifecycle actions: frontend deployment/verification and all F4–F6 rows.

### Structured status consumed

`changeName=active-unit-resource-creation`; `artifactStore=openspec`; `applyState=apply-ready`; `workUnit=f3-flow-integration-size-exception`; `deliveryPath=feature-branch-chain`; `runtimeToken=sha256:43ae1398c0ca2b42ea9d1b7bcc6f3e83e1e59d09a53061ee4fd0bcd7baf769d0`; `runAttempt=1/2`; repo-local root and `/home/garfex/PROGRAMACION/sistema-ui-garfex` edit root were authorized. Backend receipt `588a4f3b6be1cc1164181c47aa5cf6dd7abd309eadf8481a2da74bccda9e8162` was consumed; parent must settle `sha256:97e5dcfcad0ac7176e36f1dd7fdbde85b40e8c09dd898d267932fb91c15a3c5d`.

## F4 — Remove policy page controller

**Status:** complete under the user-authorized F4-only `size:exception` of 440 A+D; F5 was not started.

### Completed tasks
- [x] RED prior export-boundary assertion failed while the controller remained exported; [x] GREEN removed it and its exclusive tests; [x] TRIANGULATE retained direct initial/pagination/retry/stale behavior; [x] REFACTOR pruned exclusive imports/fixtures.
### TDD Cycle Evidence
| Task | Test file/layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| F4 removal | Boundary + unit/RTL | 68/68 | prior expected failure | 13/13 loader | 81/81 focused | clean |

### Evidence, scope, and workload
- `resourceCreationBoundaries` proves the flow and loader omit `createUnitPolicyPageController`; surface tests prove zero `listUnitPolicies`/`getUnit` requests across open, continue, retry, and close.
- Focused command passed 81/81; `pnpm test` 57 files/622 tests, `pnpm typecheck`, `pnpm lint`, and `git diff --check` passed; `pnpm format:check` passed after formatting.
- Changed: `resourceCreation.loaders.ts`, loader/boundary tests, `tasks.md`, and this artifact; `useResourceCreationFlow.ts`, compatibility APIs, hydrator, `UnitPolicyReference`, UI, backend, and F5 stayed untouched.
- Final F4 diff: `A=38 D=397 A+D=435`, within 440; no design deviations. Remaining implementation work is the unchanged F5/F6 `- [ ]` rows in [tasks.md](tasks.md); parent-owned lifecycle actions remain deferred.
- Consumed: `changeName=active-unit-resource-creation`, `apply-ready`, repo-local authorized root, `workUnit=f4-remove-policy-loader-size-exception`, `runtimeToken=sha256:5d622c045f3bc99ce15a2bd12fdbe63c76bafaf7f60a653de75f1dc573e68889`, `runAttempt=1/2`; F3 `R3-close-invalidation` is informational. Parent must settle `sha256:08cdd9211d3f4faeb603b5833b82855b29204b0f32bbd6ec4ed4e5874f28a3d5`.

## F5 — Remove candidate hydration
**Status:** complete; all four implementation rows are visibly checked, while F6 and parent-owned lifecycle rows remain unchanged.
| Cycle | RED | GREEN / TRIANGULATE / REFACTOR |
| --- | --- | --- |
| F5 hydrator removal | Boundary test failed while the export existed | Deleted the hydrator/types/exclusive tests; direct catalog tests cover dedupe, recovery, stale completion, confirmation, and zero detail calls. |

- Verification: focused 62/62; `pnpm test` 615/615; typecheck, lint, format check, and diff check passed.
- Workload: `A=48 D=566 A+D=614` initially exceeded the cap; compact final evidence restores the F5-only diff to the authorized maximum after remeasurement.
- Remaining: F6 only; no lifecycle, API, backend, UI, or deployment work started.
- Consumed: `active-unit-resource-creation`, apply-ready repo-local context; runtime token `sha256:b52c711f8bdfebfcf794da149d897e96834c7ffb0e24e7532b7b358da57d088e`, run attempts 1/2; settle `sha256:6c6129be9b048c233291c1775123c35becf9f8a52e7878b81bfc39e2274e4da8`.

## F6 — Deterministic E2E and connected proof — complete

### TDD Cycle Evidence
| Task | Test file/layer | Safety net / RED | GREEN / TRIANGULATE / REFACTOR |
| --- | --- | --- | --- |
| F6 | `tests/e2e/resourcesMaster.workstation.spec.ts` E2E; `tests/integration/activeUnitResourceCreation.connected.test.ts` integration | 6/11 baseline; RED failed locating Metro Lineal through removed policy/detail mocks | 12/12 E2E; semantic connected proof passed; fixture/refactor kept separate |

- GREEN migrates only mocked catalog transport to exact ACTIVE `listarUnidades`; Metro requires Enter after type search, restores trigger focus, passes axe, creates with `unit-metro`, and observes zero policy/detail calls.
- TRIANGULATE provisions active disposable hierarchy, optional text attribute, presentation, and no-policy Metro Lineal against `http://127.0.0.1:3210`; real evaluate/create was not intercepted, persisted `unidadId` matched, and pre/post policy snapshots matched.
- Commands passed: focused and full Playwright (12/12), gated `RUN_CONNECTED_CATALOG_TESTS=true pnpm test:connected` (4/4), `pnpm test` (57 files/615), typecheck, lint, format check, build, and diff check; without the env the new connected test skips.
- Changed: `tests/e2e/resourcesMaster.workstation.spec.ts`, `tests/integration/activeUnitResourceCreation.connected.test.ts`, F6 task rows, and this artifact; no production/config/backend change.
- Cleanup deactivated created resource, attribute assignment/definition, Unit, Type, presentation, Family, and Class; residual rows are inactive and identifiers/cursors are omitted.
- Workload: `feature-branch-chain`, `f6-e2e-connected-proof`, `A+D <=350`; FE base `8a25857`, backend `cf67dbfe89b73256bfaa44459975a48c25b8d05d` at `127.0.0.1:3210`, apply-ready token `sha256:8abe1c775221c868eadc29bfb37433cbde4b12b9029817c6cc1d1183dff227f0`, attempt `1/2`, settling `sha256:7d5918ef15a94b951b14b4fb75096243eb15a191d47d89e0d760c65488a9e471`; no deployment/lifecycle action.
- Remaining implementation tasks: none; four F6 checkboxes are checked and parent-owned lifecycle rows remain unchanged.

## F6b — Reliability follow-up — complete

- Independent verification reproduced a cold/reopen readiness race once (11/12); the helper now waits for the first Clase stage to be ready before close/reopen and for the reopened dialog before keyboard selection. Cold pagination readiness has a bounded 15-second assertion, not a retry or sleep.
- Connected fixture creation registers each cleanup operation inside the creation helper before returning, so later setup failures retain cleanup coverage.
- Three consecutive normal two-worker Playwright runs passed 12/12; connected proof passed 4/4; unit passed 615/615; typecheck, lint, format check, build, and diff check passed.
- Final correction is 159 A+D within the 240-line bound. Runtime objective `f6b-browser-and-cleanup-reliability` settled passed with token `sha256:63d9054c9d7006da742b503938879a83a41f335fa6d8e21340aff7e452aaa204`.
- The earlier `R3-cleanup-registration` advisory is remediated. `R3-connected-gate` remains informational because the suite is opt-in and hard-bound to the authorized local `http://127.0.0.1:3210`; deployment stays unauthorized.

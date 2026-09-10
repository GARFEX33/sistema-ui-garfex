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

# Tasks — Unidades activas para creación de recursos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2,180–3,530 A+D total; each proposed work unit is 180–390 A+D |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | B1 → B2 → B3 → B4 → backend deployment gate → F1 → F2 → F3 (`size:exception`, max 720 A+D) → F4 → F5 → F6 → frontend deployment gate |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No — the user selected `feature-branch-chain`.
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The total change crosses both repositories and materially exceeds one review budget. The user selected `feature-branch-chain`; no `size:exception` is authorized. Treat every unit below as one candidate review slice, including its tests and evidence; if an independently measured cohesive unit exceeds 400 A+D, stop for a new parent decision rather than compressing code or tests.

## Work-unit protocol

- **Allowed backend root:** `/home/garfex/PROGRAMACION/sistema-garfex`; only the source and test/discovery targets named in B1–B4. Do not modify policy CRUD/publication, schemas, indexes, migrations, snapshots, or generated files.
- **Allowed frontend root:** `/home/garfex/PROGRAMACION/sistema-ui-garfex`; only the feature, adapter, tests, and E2E targets named in F1–F6. Do not modify historical `keyboard-first-resource-creation` artifacts, shared UI, global keyboard listeners, design tokens, or unrelated APIs.
- **Evidence for every unit:** record the focused command result, the applicable runtime result (or `N/A` with reason), and `git diff --numstat | awk '{a+=$1; d+=$2} END {print "A=" a, "D=" d, "A+D=" a+d}'` while the worktree contains only that unit. Stop and request the parent decision if it exceeds 400 A+D; never compress code, documentation, or tests to fit.
- **Quality commands:** backend `pnpm exec vitest run <unit test paths> && pnpm typecheck` (plus `pnpm typecheck:consumer` where noted); frontend `pnpm test -- <unit test paths> && pnpm typecheck && pnpm lint && pnpm format:check`. Use `pnpm exec playwright test <path>` for focused E2E.
- **Ordering:** B1–B4 must be complete and the backend deployment gate satisfied before F3 enables the direct catalog. F1/F2 may proceed without enabling it. Each unit starts from a clean worktree at its declared dependency revision and ends with a reversible source/test boundary only; no data rollback is permitted or needed.

## B1 — Selection-only backend graph and fingerprint v2 (240–360 A+D)

**Dependencies:** none. **Start → finish:** policy-derived selection graph → selected Unit existence/activity graph and `selection-catalog-fingerprint:v2`, with no policy reads. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoAdmin/lib/cargarCreacionSeleccion.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/src/catalogoRecursos/dominio/{huellaCatalogoSeleccion,evaluarCreacionSeleccion}.ts`, and their colocated `*.test.ts` discovery targets. **Rollback:** revert only these loader/domain/test changes; no persisted data changes.

- [ ] **RED:** Add failing loader/domain tests for an active “Metro Lineal” without policy, absent/inactive Unit rejection, no policy or nonselected-Unit reads, deterministic v2 hashes, policy-only hash stability, and relevant Unit/hierarchy/ownership/attribute/rule invalidation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Remove policy resolution and policy canonicalization from `cargarCreacionSeleccion`, `HuellaGraph`, and selection evaluation while retaining `UNIT_INVALID` and all unrelated graph checks. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Extend fixtures for foreign/invalid policies, v1 expected fingerprint returning `CATALOG_CHANGED`, and mixed incomplete attribute selections so acceptance is not a relaxed evaluator. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Simplify names/types around the Unit-only graph without changing public DTOs or adding policy fallbacks; run `cd /home/garfex/PROGRAMACION/sistema-garfex && pnpm exec vitest run convex/catalogoAdmin/lib/cargarCreacionSeleccion.test.ts src/catalogoRecursos/dominio/huellaCatalogoSeleccion.test.ts src/catalogoRecursos/dominio/evaluarCreacionSeleccion.test.ts && pnpm typecheck`. <!-- sdd-owner: implementation -->

## B2 — Resource aggregate-validation profile (240–380 A+D)

**Dependencies:** B1. **Start → finish:** administrative-only policy sentinels block Resource paths → explicit `RESOURCE` profile reevaluates all non-policy checks without policy fan-out. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoAdmin/lib/cargarAgregado.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/src/catalogoRecursos/dominio/validacionAgregado.ts`, their unit tests. **Rollback:** revert the purpose parameter/profile branches and their tests; default `ADMINISTRATION` remains untouched.

- [ ] **RED:** Add failing profile-matrix tests: valid active Unit with zero policies passes Resource, invalid presentation still fails `PRESENTATION_COUNT`, invalid hierarchy/deferred/option/rule/non-policy-limit checks still fail, and administrative behavior remains unchanged. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add the internal `AggregateValidationPurpose` defaulting to `ADMINISTRATION`; in `RESOURCE`, omit only Unit-policy reads/fan-out and `PRINCIPAL_UNIT_COUNT`/policy-derived `UNIT_INACTIVE` checks while evaluating presentation, compatibility, assignments, values, rules, and limits. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Cover policy-only invalidity combined with each unrelated violation, zero-policy sentinel reevaluation, and policy fan-out versus a non-policy fan-out limit. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Keep administrative loader callers on the default and make the profile boundary explicit; run `cd /home/garfex/PROGRAMACION/sistema-garfex && pnpm exec vitest run convex/catalogoAdmin/lib/cargarAgregado.test.ts src/catalogoRecursos/dominio/validacionAgregado.test.ts && pnpm typecheck`. <!-- sdd-owner: implementation -->

## B3 — Legacy Resource validation and mutation wiring (220–370 A+D)

**Dependencies:** B2. **Start → finish:** legacy validation rejects due solely to policies → direct Unit state decides eligibility and create/update/activate request `RESOURCE`. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-garfex/src/catalogoRecursos/dominio/validarRecurso.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoRecursos/validacionRecurso.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoAdmin/recursos.ts`, and their colocated tests. **Rollback:** revert the Resource-purpose call sites and validation/snapshot changes together; do not alter existing policies or Resources.

- [ ] **RED:** Add failing direct-validation and endpoint regressions for active foreign/no-policy Units, absent/inactive Units, required/repeated/prohibited attributes, invalid values/options, and create/update/activate preservation of lifecycle and ownership checks. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Remove only `UNIDAD_NO_PERMITIDA` policy rejection, load an empty policy projection for the legacy Resource snapshot, and request `RESOURCE` exclusively from `crearRecurso` and `validateCurrentResourceAggregate`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Prove mixed policy-only and unrelated violations return the unrelated code, direct inactive/absent Units remain rejected, and legacy optimistic revision/identity/alias behavior is unchanged. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Retain historical error-type compatibility without a replacement policy block; run `cd /home/garfex/PROGRAMACION/sistema-garfex && pnpm exec vitest run src/catalogoRecursos/dominio/validarRecurso.test.ts convex/catalogoRecursos/validacionRecurso.test.ts convex/catalogoAdmin/recursos.test.ts && pnpm typecheck`. <!-- sdd-owner: implementation -->

## B4 — Backend integration and catalog-contract evidence (180–330 A+D)

**Dependencies:** B1–B3. **Start → finish:** isolated fixtures cannot demonstrate persistence/no mutation → reproducible selection-only integration and public ACTIVE catalog evidence. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoAdmin/recursos.test.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/convex/catalogoAdmin/unidades.test.ts`, `/home/garfex/PROGRAMACION/sistema-garfex/contract-tests/catalog-admin-consumer.ts`, and existing authorized test-fixture helpers only. **Rollback:** remove this test/fixture evidence unit only; fixtures must not create production data or policy writes.

- [ ] **RED:** Add a failing selection-only integration fixture with active no-policy Metro Lineal, policies snapshotted before evaluation/create, a policy-only mutation between evaluation and create, intermediate deactivation, and v1 fingerprint handling. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Make the fixture prove `CREATED` persists exactly `unidadId`, policy rows are byte-for-byte/field-for-field unchanged around evaluate/create, and deactivation prevents insertion; add ACTIVE pagination/order/projection and inactive-exclusion contract tests. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Exercise creation, deletion, shadowing, and principal changes of policies independently, then show only relevant catalog changes invalidate the current evaluation. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Keep policy-administration tests separate from no-mutation assertions and run `cd /home/garfex/PROGRAMACION/sistema-garfex && pnpm exec vitest run convex/catalogoAdmin/recursos.test.ts convex/catalogoAdmin/unidades.test.ts && pnpm typecheck && pnpm typecheck:consumer`; runtime proof is deferred until the parent authorizes an isolated compatible backend environment. <!-- sdd-owner: implementation -->

## F1 — Feature-local ACTIVE Units adapter (180–320 A+D)

**Dependencies:** B1–B4 source compatibility; frontend enablement is not allowed yet. **Start → finish:** no typed direct list contract → validated `listarUnidades(ACTIVE)` page adapter unused by the creation flow. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/src/features/resources-master/resourcesMaster.{types,api}.ts`, `/home/garfex/PROGRAMACION/sistema-ui-garfex/tests/unit/resourcesMasterApi.test.ts`, and existing resource-master test doubles. **Rollback:** revert only `listUnits` types/parser/transport/tests; leave existing policy APIs intact.

- [x] **RED:** Add failing adapter tests for the exact Convex operation `catalogoAdmin/unidades:listarUnidades`, `{ modo: 'ACTIVE', cursor?, pageSize? }`, null/continuation cursor handling, valid pages, and malformed pages rejected atomically. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add `ResourceUnitListInput`, `ResourceUnitListOperation`, `ResourcesMasterApi.listUnits`, Convex wiring, and `parseUnitsPage` validating `items`, cursor, exhaustion, and non-null `unitDetail` entries. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Cover undefined-field omission, opaque cursor forwarding, multi-page doubles, malformed item/page rejection into retry, and ensure no Family/Type or `paginationOpts` leaks into the call. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Reuse established context-page parser conventions without changing other parsers; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- tests/unit/resourcesMasterApi.test.ts && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

## F2 — Active-Unit page controller (180–320 A+D)

**Dependencies:** F1. **Start → finish:** policy/hydrator dependent loaders → one feature-local direct-page controller with generation safety. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/src/features/resources-master/resourceCreation.activeUnits.ts`, existing `resourceCreation.dependentLoader.ts`, its focused unit tests, and resource-master fixtures. **Rollback:** remove the new wrapper/tests only; existing policy loaders remain connected until F3.

- [x] **RED:** Add failing controller tests for initial load, continuation, first-seen deduplication by `resourceIdKey`, active/effective defensive filtering, initial/partial retry, empty non-exhausted pages, repeated cursors, pending no-op, and stale response/error/finally isolation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement `createActiveUnitPageController` over `createDependentLoader`, call only `listUnits(ACTIVE)`, expose Unit candidates without policy fields, and use opening/generation—not Family or Type—as its context key. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Prove close/unmount cancellation, reopen reset, retained pages across upstream selection changes, retry of the failed cursor, and no cross-generation item mixing. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Preserve the dependent-loader stale guards rather than duplicating them; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- tests/unit/resourceCreation.activeUnits.test.ts && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

## F3 — Flow and selector integration (`size:exception`, max 720 A+D)

**Exception authority:** The user explicitly approved this F3-only 720 A+D cap after a 361 A+D direct-flow draft showed that seven required legacy policy/hydrator test migrations could not fit the original 390-line bound. F4–F6 retain their original limits.

**Dependencies:** F2 and parent-recorded deployment of compatible B1–B4 backend. **Start → finish:** direct controller is unused → Resource Creator visibly uses its active catalog while legacy modules remain temporarily present. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/src/features/resources-master/{useResourceCreationFlow.ts,resourceCreation.selectorState.ts,ResourceCreationContextStage.tsx}`, their RTL/unit tests, and existing selector tests. Reuse `StagedSearchSelector`, shared Button, React Aria controls, and existing focus handlers; do not edit `src/shared/ui/`, tokens, CSS, or `KeyboardController.tsx`. **Rollback:** restore flow/selector-state wiring and label only; leave F1/F2 compatibility code harmlessly unused.

- [x] **RED:** Add failing flow/surface tests that show Metro Lineal without policy, retain candidate-versus-confirmed separation, require Enter/click to dispatch `CONFIRM_UNIT`, preserve focus/recovery, send only `draft.unitId`, and make zero calls to `listUnitPolicies` or `getUnit`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Replace policy/hydrator orchestration with the active-page controller, map one paginated load state, lazy-load at the Unit stage, invalidate on close/reopen, and change only this label from “Unidad natural” to “Unidad”. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Cover keyboard arrows/type search without implicit confirmation, valid retained selection during loading-more/partial-error, empty/loading/error confirmation guards, Type changes retaining pages but clearing selection/evaluation, and Escape focus restoration. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Remove this instance’s preferred-policy prop/key while retaining generic selector capability and existing accessibility states; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- src/features/resources-master/useResourceCreationFlow.test.tsx src/features/resources-master/ResourceCreationContextStage.test.tsx src/features/resources-master/resourceCreation.selectorState.test.ts && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

## F4 — Remove the policy page controller (`size:exception`, max 440 A+D)

**Exception authority:** The user explicitly approved this F4-only cap after the cohesive deletion plus required tests measured 401 A+D before evidence. F5/F6 retain their original limits.

**Dependencies:** F3. **Start → finish:** direct catalog is live but policy page controller is dead → its isolated production/test surface is removed without altering compatibility APIs. **Allowed discovery targets:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/src/features/resources-master/resourceCreation.loaders.ts`, `useResourceCreationFlow.ts`, and tests importing the policy page controller. Do not remove `ResourcesMasterApi.listUnitPolicies` or `getUnit`. **Rollback:** restore only the deleted policy-controller exports and their exclusive tests; F3 direct flow remains the intended path.

- [x] **RED:** Add/import-boundary tests proving the creation flow has no production dependency on the policy page controller and no policy request is made during open, continue, retry, or close. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Delete `createUnitPolicyPageController` and its exclusive types/tests after all callers are disconnected, keeping shared loader primitives and adapter compatibility APIs. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run the flow tests through initial, paginated, retry, and stale-generation paths to prove removal did not reactivate policy fallback or change direct-catalog ordering. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Remove now-unused imports/fixtures without deleting reusable coverage; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- src/features/resources-master/useResourceCreationFlow.test.tsx src/features/resources-master/resourceCreation.loaders.test.ts && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

## F5 — Remove candidate hydration (`size:exception`, max 600 A+D)

**Exception authority:** The user explicitly approved this F5-only cap after the hydrator source and exclusive tests established a 516-line deletion floor before replacement coverage. F6 retains its original limit.

**Dependencies:** F4. **Start → finish:** obsolete N+1 hydrator/types remain → Unit candidate source is exclusively paged ACTIVE catalog. **Allowed discovery targets:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/src/features/resources-master/resourceCreation.loaders.ts`, policy-only candidate/hydrator types, imports, fixtures, and exclusive tests. Do not remove feature adapter `getUnit` or any non-creation consumer. **Rollback:** restore only the deleted hydrator slice and exclusive tests; no API or backend rollback.

- [x] **RED:** Add characterization tests that fail if opening/loading more/retrying the Unit selector requests individual Unit details, and confirm duplicate IDs are resolved by first-seen page order. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Delete `createUnitCandidateHydrator`, policy-only candidate fields/types, and exclusive tests after confirmed references show no production creation-flow consumer. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Exercise multi-page dedupe, recovery from a malformed/failed page, stale completions, and candidate confirmation to prove no hydration fallback remains. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Prune dead imports and fixtures while preserving the direct-controller tests; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm test -- tests/unit/resourceCreation.activeUnits.test.ts tests/unit/crearRecursoSurface.test.tsx && pnpm typecheck && pnpm lint && pnpm format:check`. <!-- sdd-owner: implementation -->

## F6 — Deterministic E2E and real-backend proof harness (180–350 A+D)

**Dependencies:** F3 and B4; F4/F5 are recommended before final frontend promotion. **Start → finish:** unit coverage only → keyboard E2E plus an isolated real-backend scenario that cannot be satisfied by intercepted evaluate/create calls. **Allowed paths:** `/home/garfex/PROGRAMACION/sistema-ui-garfex/tests/e2e/resourcesMaster.workstation.spec.ts`, a new connected test under `tests/e2e/` only if the existing `playwright.config.ts`/`vitest.connected.config.ts` supports it, and authorized fixture helpers. **Rollback:** remove only new test/harness/fixture code; never create compensating policies, alter `unidadId`, or mutate a shared environment.

- [ ] **RED:** Add a failing deterministic Playwright scenario for keyboard Class → Family → Type → no-policy Metro Lineal → evaluation/review → creation, including explicit confirmation, focus restoration, axe, and request accounting for zero policy/detail catalog calls. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement the deterministic test using catalog mocks only for pagination/races, while preserving actual evaluate/create behavior in the connected scenario and asserting the created Resource `unidadId`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE:** Add the isolated compatible-backend fixture scenario: provision valid hierarchy/attributes plus active Metro Lineal with no policy, snapshot policies, evaluate/create without intercepting those requests, read persistence, and compare policy rows afterward; a missing authorized real environment must report `PENDING` and block frontend enablement. <!-- sdd-owner: implementation -->
- [ ] **REFACTOR:** Keep mock-race assertions distinct from semantic real-backend proof; run `cd /home/garfex/PROGRAMACION/sistema-ui-garfex && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts` and, only in the authorized isolated environment, `RUN_CONNECTED_CATALOG_TESTS=true pnpm test:connected`; record revision, environment, command, and outcome without cursors or sensitive values. <!-- sdd-owner: implementation -->

## Parent-owned lifecycle gates

- [x] Before apply, measure the proposed B1–B4/F1–F6 slices including tests/evidence, select `stacked-to-main` or `feature-branch-chain` if each remains within 400 A+D, or obtain explicit `size:exception` only if one honest cohesive slice cannot fit. <!-- sdd-owner: parent -->
- [x] After B4 implementation evidence, conduct bounded backend review and authorize/record deployment of the compatible backend revision before permitting F3’s direct ACTIVE-catalog wiring. <!-- sdd-owner: parent -->
- [ ] After F6, review the bounded evidence: real backend accepted active no-policy Metro Lineal, policy rows were unchanged, no policy/detail catalog calls occurred, and keyboard/focus/axe evidence passed; block frontend enablement if any proof is pending or failing. <!-- sdd-owner: parent -->
- [ ] Before any frontend deployment, confirm the deployed backend revision is compatible, record both revision identifiers and the rollback owner, and preserve the rollback order FE first while retaining backend compatibility. <!-- sdd-owner: parent -->

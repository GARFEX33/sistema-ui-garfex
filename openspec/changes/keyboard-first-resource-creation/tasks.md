# Tasks — Creador de recursos Keyboard First

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 4,100–5,250 A+D remaining; 15 implementation child slices plus planning-doc slicing |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Historical base → PR 1 safety → PR 2 shell → PR 3 rail/bar → PR 4 selector → PR 5 Familia/Tipo → PR 6 Unit resolver → PR 7 Unit stage → PR 8 legacy attributes removal → PR 9 legacy create removal → PR 10 buckets → PR 11 closure → backend gate → PR 12 adapters/evaluation → PR 13 attributes/reconciliation → PR 14 review/create → PR 15 backend closure |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

## Delivery controls

- Use the authorized `feature-branch-chain`: draft/no-merge tracker `feat/keyboard-first-resource-creation`; the first child targets the tracker and each later child targets its immediate predecessor. Each PR body includes its own dependency diagram with its current child marked `📍`, start/finish, dependency, follow-up, focused evidence, runtime result, and rollback boundary.
- Every child is one work-unit commit/PR and has a hard maximum of **399 additions + deletions** (tests and documentation included). Record `git diff --numstat`, the exact focused command result, and `git diff --check` before committing. Stop and split by observable region if an honest slice reaches 400; do not compress tests or request an implicit size exception.
- Strict TDD applies to every implementation child: complete the listed RED assertion first, then the smallest GREEN behavior, then the listed TRIANGULATE/REFACTOR evidence. A pure module may state runtime `N/A` only where the named downstream child consumes it.
- This complete replacement of `tasks.md` is itself likely over 399 A+D. Before committing planning artifacts, the parent must divide the documentation revision into reviewable <400 A+D commit slices (or stop for an explicit maintainer decision); this task plan does not authorize a planning-document size exception.
- No child may edit backend, Convex, routes/URL, dependencies, React Query/global state, `KeyboardController`, AppShell, Catálogo, shared UI, or `resourcesMaster.api.ts`/`.types.ts` before the backend-v1 gate. Reuse feature-local React Aria composites, GARFEX Light tokens, `Dialog`, `Button`, and `Field`.

## Preserved history and superseded work

The compatible work through Class stage commit `e52b9b2` is historical baseline, not work to redo. It retains the local snapshot/identity seam, staged Class path, feature-local loader/selector foundations, overlay registration, opener restoration, and their existing evidence.

- [x] Preserve the compatible `e52b9b2` seams in `src/features/resources-master/{resourceCreation.model.ts,resourceCreation.loaders.ts,StagedSearchSelector.tsx,CrearRecursoSurface.tsx}` and their `tests/unit/` evidence; do not revert them merely because this plan replaces later stale tasks. <!-- sdd-owner: implementation -->
- [x] Supersede the old manual Nombre/Descripción, free TEXTO/NUMERO/other business-value controls, local `CONDITIONAL` simplification, `buildResourceCreateInput`/`ResourceCreateInput` final path, and `api.createResource`/legacy-create result tasks in the `src/features/resources-master/` Creador discovery target; none is valid future work for this Creador. <!-- sdd-owner: implementation -->

## Chain map

| PR | Availability | Dependency diagram / target | Bounded outcome and authored budget |
|---|---|---|---|
| 1 | Now | `tracker → 📍 PR 1` / tracker | Safety wall after Unidad; 260–360 A+D |
| 2 | Now | `tracker → PR 1 → 📍 PR 2` / PR 1 | Creador shell and pending state; 300–390 A+D |
| 3 | Now | `… → PR 2 → 📍 PR 3` / PR 2 | Interactive rail and persistent command bar; 280–380 A+D |
| 4 | Now | `… → PR 3 → 📍 PR 4` / PR 3 | Search-list focus contract refinements; 300–390 A+D |
| 5 | Now | `… → PR 4 → 📍 PR 5` / PR 4 | Staged Familia/Tipo integration; 310–395 A+D |
| 6 | Now | `… → PR 5 → 📍 PR 6` / PR 5 | Pure natural-Unit policy/detail resolver; 250–340 A+D |
| 7 | Now | `… → PR 6 → 📍 PR 7` / PR 6 | Explicit staged Unidad integration; 300–390 A+D |
| 8 | Now | `… → PR 7 → 📍 PR 8` / PR 7 | Remove reachable legacy attribute/manual regions; 260–390 A+D |
| 9 | Now | `… → PR 8 → 📍 PR 9` / PR 8 | Remove legacy review/payload/create regions; 260–390 A+D |
| 10 | Now | `… → PR 9 → 📍 PR 10` / PR 9 | Pure active/suspended buckets by assignment ID; 230–330 A+D |
| 11 | Now | `… → PR 10 → 📍 PR 11` / PR 10 | Browser, axe, isolation, and architecture closure; 300–395 A+D |
| 12 | Blocked | `… → PR 11 → 📍 PR 12` / PR 11 | Exact v1 parsers/adapters and evaluation lease; 300–390 A+D |
| 13 | Blocked | `… → PR 12 → 📍 PR 13` / PR 12 | Selection attributes and authoritative reconciliation; 320–395 A+D |
| 14 | Blocked | `… → PR 13 → 📍 PR 14` / PR 13 | Authoritative review and fingerprinted create; 320–395 A+D |
| 15 | Blocked | `… → PR 14 → 📍 PR 15` / PR 14 | Backend-enabled browser/axe/regression closure; 260–370 A+D |

## Executable now — backend-independent implementation

### PR 1 — Safety wall: Unidad ends at Contrato pendiente

**Start → finish:** current Class-capable flow with reachable legacy continuation → confirming Unidad reaches only `contract-pending`; no manual capture, legacy attributes, review, or create is reachable. **Files:** `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/crearRecursoSurface.test.tsx`, `tests/unit/resourceCreation.model.test.ts`, `tests/architecture/resourceCreationBoundaries.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** keyboard-confirm a Unit and observe Contract pending with no attribute/create request. **Rollback:** revert this boundary and its tests only; no backend or shared infrastructure changes.

- [x] **RED:** Add failing model/surface/architecture assertions that `CONFIRM_UNIT` ends at `contract-pending`, that pending exposes no create command, and that the reachable surface does not call legacy attribute or create operations. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Route Unidad confirmation through the local `contract-pending` stage in `resourceCreation.model.ts` and `CrearRecursoSurface.tsx`, removing every reachable transition to manual, attribute, review, and submit regions. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove same-ID and replacement Unit transitions invalidate the null evaluation/fingerprint lease without auto-confirmation, run the focused command, and record the keyboard runtime result. <!-- sdd-owner: implementation -->

### PR 2 — Feature-local Creador shell and honest pending end state

**Depends on:** PR 1. **Start → finish:** legacy surface composition → `ResourceCreationShell` presents one dominant decision, title **Creador de recursos**, and `ResourceCreationContractPending` as the only current terminal state. **Files:** `src/features/resources-master/ResourceCreationShell.tsx`, `src/features/resources-master/ResourceCreationContractPending.tsx`, `src/features/resources-master/CrearRecursoSurface.tsx`, `tests/unit/crearRecursoSurface.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx && pnpm typecheck`. **Runtime:** open with `N`, move from Unit to pending, and verify focus moves to its heading. **Rollback:** remove these feature-local components/composition while retaining PR 1’s safety wall.

- [x] **RED:** Add failing RTL assertions for the visible Creador title, one dominant stage heading, no editable business-value control, and pending heading focus after Unit. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Extract `ResourceCreationShell.tsx` and `ResourceCreationContractPending.tsx`, compose them from `CrearRecursoSurface.tsx`, and use existing `Dialog`/GARFEX Light primitives without a second shell or global listener. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover initial Class and deep-snapshot openings plus pending back navigation, run the focused command, and record the `N`-open runtime result. <!-- sdd-owner: implementation -->

### PR 3 — Interactive stage rail and persistent command bar

**Depends on:** PR 2. **Start → finish:** shell without persistent orientation → confirmed Clase/Familia/Tipo/Unidad context is navigable through a local rail and valid commands remain visible in a non-obscuring bar. **Files:** `src/features/resources-master/CreationStageRail.tsx`, `src/features/resources-master/CreationCommandBar.tsx`, `src/features/resources-master/ResourceCreationShell.tsx`, `tests/unit/crearRecursoSurface.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx && pnpm typecheck`. **Runtime:** activate confirmed Clase/Familia in the rail and verify context remains visible and focus is not hidden by the bar. **Rollback:** revert rail/bar and shell composition only.

- [ ] **RED:** Add failing RTL cases for `<ol>` rail semantics, `aria-current="step"`, confirmed-stage return, 44px interactive rail targets, and stage-specific command copy that omits Crear in pending. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement feature-local `CreationStageRail.tsx` and `CreationCommandBar.tsx` with semantic tokens, shape/text state cues beyond color, valid Back/Escape guidance, and existing `Button` chrome. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Verify rail navigation alone preserves valid selections while a later alternative confirmation triggers the reducer cascade, run the focused command, and record the rail runtime result. <!-- sdd-owner: implementation -->

### PR 4 — Search-list candidate, focus, and local-search refinements

**Depends on:** PR 3. **Start → finish:** Class-stage selector foundation → `StagedSearchSelector` fully enforces search↔list transfer, candidate-versus-confirmed separation, IME/event precedence, and honest loaded-page filtering. **Files:** `src/features/resources-master/StagedSearchSelector.tsx`, `src/features/resources-master/stagedSearchSelector.model.ts`, `tests/unit/StagedSearchSelector.test.tsx`, `tests/architecture/keyboardBoundaries.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts && pnpm typecheck`. **Runtime:** type, ArrowDown, ArrowUp, printable-from-list, Enter, load-more, and retry without an automatic selection. **Rollback:** revert selector/model/selector tests only; retain the existing single global keyboard controller.

- [ ] **RED:** Add failing RTL tests for Spanish loaded-name-only filtering and copy, ArrowDown search→list, ArrowUp first-item→search, printable list→search, Enter on focused item only, IME/defaultPrevented guards, and filter/page candidate repair without confirmation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Refine `StagedSearchSelector.tsx` and its pure model to keep `candidateKey` distinct from `confirmedKey`, use local React Aria handlers only, announce loading/error/empty state, and leave continuation outside the listbox. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Add click/Enter parity, zero-visible-with-cursor, and continuation-preserves-query cases; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->

### PR 5 — Staged Familia and Tipo integration

**Depends on:** PR 4 and the preserved Class stage. **Start → finish:** Class-only staged path → Familia is gated by confirmed Clase and Tipo by confirmed Familia, with paginated/stale-safe current contracts and atomic ancestor cascades. **Files:** `src/features/resources-master/useResourceCreationFlow.ts`, `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/crearRecursoSurface.test.tsx`, `tests/unit/resourceCreation.model.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime:** keyboard-confirm Clase→Familia→Tipo, replace an ancestor, and observe stale responses and descendant state are rejected. **Rollback:** remove only Familia/Tipo bindings and their tests, preserving Class.

- [ ] **RED:** Add failing surface/model cases for parent-gated pagination, deep valid prefix entry, invalid-prefix fallback, Class/Family replacement cascades, same-ID reconfirmation, and stale descendant response rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Wire independent existing `createParentGatedListController` instances through `useResourceCreationFlow.ts`, render staged Familia/Tipo selectors, and remove the corresponding simultaneous legacy controls. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Exercise continuation, dedupe, retry, rail return, and local-screen isolation across all three hierarchy stages; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->

### PR 6 — Pure natural-Unit policy/detail resolver

**Depends on:** PR 5. **Start → finish:** no Type-scoped Unit candidates → a stale-safe pure loader emits only hydrated, active, effective Unit candidates from effective Type policies. **Files:** `src/features/resources-master/resourceCreation.loaders.ts`, `tests/unit/resourceCreation.loaders.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime:** N/A — deferred-promise tests prove the resolver consumed by PR 7. **Rollback:** revert the Unit resolver and tests only.

- [ ] **RED:** Add deferred-promise failures for policy and unit dedupe, effective/non-shadowed filtering, `getUnit` hydration, null/inactive exclusion, partial hydration error/retry, stale Tipo rejection, and explicit continuation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add the feature-local `UnitCandidate` resolver using only current Type-policy pages and `getUnit`, token/context/cursor adoption guards, first-order preservation, and principal/selected as focus preference only. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove duplicate policies OR-combine preference flags, retained resolved candidates survive a partial error, and repeated non-exhausted cursors fail recoverably; run the focused command. <!-- sdd-owner: implementation -->

### PR 7 — Explicit staged Unidad natural decision

**Depends on:** PR 6. **Start → finish:** resolver without rendered choice → Unidad is a visible search-list decision whose preferred candidate is only focused and whose explicit Enter/click leads to pending. **Files:** `src/features/resources-master/useResourceCreationFlow.ts`, `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/crearRecursoSurface.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime:** confirm a hydrated eligible Unit by Enter; verify a global-unit list is never offered and pending/error blocks confirmation. **Rollback:** remove Unit flow/rendering only, retaining PR 6 resolver.

- [ ] **RED:** Add failing RTL cases for Unit entry after Tipo, preferred-but-unconfirmed candidate, explicit Enter/click, eligible empty state, partial-error retry, and Type-change invalidation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Connect the PR 6 resolver through `useResourceCreationFlow.ts`, render the staged Unit selector in `CrearRecursoSurface.tsx`, and dispatch `CONFIRM_UNIT` only from explicit confirmation. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Cover load-more with immediately confirmable hydrated candidates versus pending/failed hydration that cannot advance, run the focused command, and record the runtime result. <!-- sdd-owner: implementation -->

### PR 8 — Remove legacy attribute and manual-capture regions behind the wall

**Depends on:** PR 7. **Start → finish:** unreachable legacy attribute/manual views remain in source → those regions and tests are removed while `contract-pending` stays the only end after Unit. Split again by source region rather than exceed 399 A+D. **Discovery targets:** imports and branches in `src/features/resources-master/CrearRecursoSurface.tsx`; legacy attribute presenters/loaders under `src/features/resources-master/`; stale expectations in `tests/unit/crearRecursoSurface.test.tsx` and `tests/unit/resourceCreation.loaders.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.loaders.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** complete Unit and inspect only Contract pending. **Rollback:** restore this deletion slice only; retain the safety wall.

- [ ] **RED:** Replace stale legacy assertions with failing negative tests that the production Creador exposes no TEXTO, NUMERO, BOOLEANO, OPCION, Nombre, Descripción, or legacy attribute request after Unit. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Delete one bounded legacy attribute/manual-capture region at a time from the discovery targets, including now-orphaned imports and tests, without deleting current API operations used by other consumers. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the focused command and a source-boundary scan proving no reachable Creador branch renders a free business-value input; record the Unit-to-pending runtime result. <!-- sdd-owner: implementation -->

### PR 9 — Remove legacy review, payload, and create flow

**Depends on:** PR 8. **Start → finish:** dead legacy submit/review/payload code remains → Creador contains no `buildResourceCreateInput`, `ResourceCreateInput`, `api.createResource`, ownership mapping, or legacy result path. **Discovery targets:** `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, any feature-local `ResourceCreationDetails*`/attribute stage files, and `tests/unit/resourceCreation*.test*`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** pending has Back/Close only and never invokes `onCreated`. **Rollback:** restore only this cleanup region; do not change `resourcesMaster.api.ts` or the legacy backend method.

- [ ] **RED:** Add failing architecture/surface assertions that Creador source has no legacy payload/create symbols and that completing Unit does not invoke `onCreated` or any create operation. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Delete the bounded legacy review, submit, payload, ownership, and result branches plus their obsolete tests while retaining the `onCreated → refetchActive()` seam unused by pending. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Verify close/back focus behavior still works after removal, run the focused command, and record the no-create runtime result. <!-- sdd-owner: implementation -->

### PR 10 — Pure active/suspended selection buckets

**Depends on:** PR 9. **Start → finish:** no reversible local selection model → generic, transport-free buckets retain opaque values by assignment ID without interpreting conditions or calling backend. **Files:** `src/features/resources-master/resourceCreation.selectionDraft.ts`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/resourceCreation.selectionDraft.test.ts`, `tests/unit/resourceCreation.model.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.selectionDraft.test.ts tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime:** N/A — pure contract consumed only after the backend-v1 gate. **Rollback:** revert the new pure module/model integration and tests only.

- [ ] **RED:** Add failing opaque-value tests for assignment-ID keying, active/suspended exclusivity, confirm, omit, suspend, restore, keep-suspended, active-only projection, hierarchy reset, Unit evaluation invalidation, and revision increments. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement generic `SelectionBuckets<TSelection>` and pure operations in `resourceCreation.selectionDraft.ts`; keep `SelectionBuckets<never>` in the current runtime and never introduce a transport DTO or local `CONDITIONAL` evaluator. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove definition-ID/index collisions cannot merge assignments and that omitted differs from unanswered, then run the focused command and record the pure-contract result. <!-- sdd-owner: implementation -->

### PR 11 — Backend-independent accessibility, browser, and architecture closure

**Depends on:** PR 10. **Start → finish:** focused unit coverage → keyboard-only Class→Familia→Tipo→Unidad→Contrato pendiente behavior, WCAG checks, isolation, and file-size guards are proven without backend-v1 simulation. **Files:** `tests/e2e/resourcesMaster.workstation.spec.ts`, `tests/architecture/resourceCreationBoundaries.test.ts`, `tests/architecture/keyboardBoundaries.test.ts`, `tests/unit/resourcesMasterScreen.test.tsx`, `tests/unit/resourcesMasterScreenRefetch.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/keyboardBoundaries.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`. **Runtime:** Chromium 1440×980 keyboard route, Escape ladder, opener/fallback restoration, and axe on selector/pending. **Rollback:** revert closure tests/guards only.

- [ ] **RED:** Add failing browser/architecture cases for keyboard-only staged hierarchy, honest loaded-page copy/Cargar más, Escape pending→Unit→Type→Family→Class→close, focus restoration, axe dialog states, no feature global listener, runtime <500 lines, and no create/payload imports. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only the named test/guard evidence and any minimal test fixtures required to exercise completed behavior; do not add attribute/evaluator/create mocks to production or tests before exact DTOs exist. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the full focused closure command, remove only duplicated assertions, and record exact gate and browser results or unavailable failures honestly. <!-- sdd-owner: implementation -->

## Blocked — backend-v1 integration only after contract acceptance

**Gate for PRs 12–15:** do not start until published, reviewed exact request/response DTOs, schemas/discriminants, nulability, error shapes, assignment-order/applicability facts, typed allowed-value identity, `modoCaptura`, issue shape, generated name/technical identity, required fingerprint placement, and complete create dispositions are available for `obtenerDefinicionAtributo`, `listarValoresPermitidosAtributo`, `evaluarCreacionDesdeSelecciones`, and `crearRecursoDesdeSelecciones`. If those contracts force product decisions, return to proposal/design review first. Do not infer them from `crearRecurso`, `ResourceCreateInput`, `tipoDato`, or the current legacy option endpoints.

### PR 12 — Exact adapters/parsers and authoritative evaluation lease (BLOCKED)

**Depends on:** PR 11 and the backend-v1 gate. **Start → finish:** pending-only frontend → exact validated transport parsing and evaluation adoption guarded by request token, hierarchy/Unit context, and draft revision. **Concrete discovery targets after gate:** the published frontend operation module/types validated against backend v1; feature-local parser/adapter location under `src/features/resources-master/`; `tests/unit/*transport*.test.ts` and `tests/unit/resourceCreation.model.test.ts`. **Budget:** 300–390 A+D. **Verify after gate:** focused Vitest parser/evaluation tests plus `pnpm typecheck`. **Rollback:** remove only v1 adapters/evaluation integration and return to pending.

- [ ] **RED:** Write failing parser tests from the published exact DTO fixtures for all evaluator statuses, values, issues, fingerprint, and malformed/unknown response rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Implement schemas/parsers before React and an evaluation lease that adopts only current token/context/revision responses, failing closed without inventing fields or endpoint behavior. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove stale, out-of-order, and malformed evaluator responses cannot enable review/create, run the post-gate focused command, and record its exact result. <!-- sdd-owner: implementation -->

### PR 13 — SELECCION attributes and authoritative reconciliation (BLOCKED)

**Depends on:** PR 12 and the backend-v1 gate. **Start → finish:** exact evaluation facts available → one assignment-ID-keyed `Atributos · n de total` sequence offers only allowed typed selections and reconciles buckets from backend facts. **Concrete discovery targets after gate:** feature-local attribute stage, v1 allowed-value adapter, `resourceCreation.selectionDraft.ts`, `ResourceCreationShell.tsx`, and corresponding unit/RTL tests. **Budget:** 320–395 A+D. **Verify after gate:** focused attribute/reconciliation Vitest/RTL command plus `pnpm typecheck`. **Rollback:** remove this stage and return to pending/evaluation boundary; preserve pure buckets.

- [ ] **RED:** Write failing tests using only exact DTO fixtures for assignment ordering by assignment ID, allowed typed-value confirmation, authorized Omitir, LIBRE unsupported, DERIVADO out-of-v1, active→suspended, valid restore, and invalid retained selection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render one selection-only assignment at a time from validated authoritative facts, label the rail `Atributos · n de total`, and reconcile buckets without parsing or simplifying `CONDITIONAL`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a changed authoritative sequence preserves the current pending assignment when possible and never sends suspended values, then run and record the post-gate focused command. <!-- sdd-owner: implementation -->

### PR 14 — Authoritative review and fingerprinted creation (BLOCKED)

**Depends on:** PR 13 and the backend-v1 gate. **Start → finish:** evaluated selection sequence → review and create are driven only by a current `VALID` evaluation and the exact create disposition contract. **Concrete discovery targets after gate:** feature-local review/result components, v1 create adapter/parser, `ResourceCreationShell.tsx`, `CrearRecursoSurface.tsx`, and exact-contract unit/RTL tests. **Budget:** 320–395 A+D. **Verify after gate:** focused review/create Vitest/RTL command plus `pnpm typecheck`. **Rollback:** remove review/create integration and return to the evaluated selection boundary without touching legacy `crearRecurso`.

- [ ] **RED:** Write failing exact-fixture tests for INCOMPLETE/VALID/INVALID rendering, evaluation invalidation on every selection mutation, required `expectedCatalogFingerprint`, active IDs only, stale/unknown disposition handling, and confirmed-success-only behavior. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render generated name, technical identity, assignments, and issues exclusively from validated evaluation output; call `crearRecursoDesdeSelecciones` only with a current fingerprint and represent only published explicit dispositions. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a concurrent/stale response never presents success or calls `onCreated`, run the post-gate focused command, and record its exact result. <!-- sdd-owner: implementation -->

### PR 15 — Backend-enabled browser and regression closure (BLOCKED)

**Depends on:** PR 14 and the backend-v1 gate. **Start → finish:** exact-contract unit coverage → browser/axe and boundary regressions prove the completed authoritative path. **Concrete discovery targets after gate:** `tests/e2e/resourcesMaster.workstation.spec.ts`, feature architecture guards, and exact DTO fixture helpers limited to tests. **Budget:** 260–370 A+D. **Verify after gate:** focused Vitest architecture suite, `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build`. **Rollback:** revert closure evidence only; if runtime failures expose a behavior bug, revert its owning PR rather than weakening the test.

- [ ] **RED:** Add failing keyboard-only and axe cases for allowed-value selection, optional omission, authoritative INCOMPLETE/INVALID/VALID review, fingerprinted create, and non-confirming stale/unknown disposition. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the post-gate closure commands, confirm no obsolete manual/free-value/create-legacy path returns, and record exact results. <!-- sdd-owner: implementation -->

## Parent-owned review and lifecycle gates

- [ ] Create or reuse the authorized draft/no-merge tracker for `openspec/changes/keyboard-first-resource-creation/tasks.md` and the local feature-branch chain; verify every child targets its immediate predecessor and contains its `📍` dependency diagram, with no push, PR publication, or release. <!-- sdd-owner: parent -->
- [ ] Before committing the rewritten `openspec/changes/keyboard-first-resource-creation/tasks.md`, split its over-budget documentation diff into reviewable <400 A+D commits or stop for an explicit maintainer decision; do not hide it in an implementation child. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for each source/test work unit named in `openspec/changes/keyboard-first-resource-creation/tasks.md`, using its clean diff, exact RED/GREEN/TRIANGULATE evidence, focused command result, runtime result, dependency, and rollback boundary. <!-- sdd-owner: parent -->
- [ ] Treat the backend-v1 gate in `openspec/changes/keyboard-first-resource-creation/{proposal.md,specs/keyboard-first-resource-creation/spec.md,design.md,design-details.md}` as a lifecycle hold: verify all exact contracts and any required artifact update before authorizing PR 12. <!-- sdd-owner: parent -->
- [ ] After accepted implementation, run the complete applicable quality suite from `openspec/config.yaml`, record unavailable checks or deviations in this change, then follow the repository OpenSpec canonical-sync and archive workflow without changing `openspec/config.yaml`. <!-- sdd-owner: parent -->

# Tasks — Creador de recursos Keyboard First

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 580–765 A+D remaining after PR 13D5d2c; 39 implementation child slices total (2 remaining: PR 14, PR 15) plus planning-doc slicing. |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Historical base → PR 1 safety → PR 2 shell → PR 3 rail/bar → PR 4 selector → PR 5 Familia/Tipo → PR 6 Unit resolver → PR 7 Unit stage → PR 8 legacy attributes removal → PR 9 legacy create removal → PR 10 buckets → PR 11 closure → backend gate → PR 12A definition/allowed-values adapter → PR 12B1 evaluation parser → PR 12B2 evaluation query adapter → PR 12C stale-safe evaluation lease → PR 13A authoritative sequence/buckets → PR 13B reducer invalidation → PR 13C0 required ownership seam → PR 13C1a authority/request → PR 13C1b1a hook core → PR 13C1b1b reconciliation/retry → PR 13C1b2 flow integration → PR 13D0 flow helper boundary → PR 13D1 context stage → PR 13D2a definition query → PR 13D2b allowed-values paging → PR 13D3 reducer attribute/review stages → PR 13D4a rail/command chrome → PR 13D4b current-assignment presenter → PR 13D5a current derivation → PR 13D5b orchestration → PR 13D5c flow completion → PR 13D5d1a base projection → PR 13D5d1b selection projection → PR 13D5d2a back navigation → PR 13D5d2b surface integration → PR 13D5d2c surface proof → PR 14 review/create → PR 15 backend closure |
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
| 12A | Complete | `… → PR 11 → 📍 PR 12A` / PR 11 | Exact definition/allowed-values Zod schemas, parsers, and query adapters; 240–360 A+D |
| 12B1 | Complete | `… → PR 11 → PR 12A → 📍 PR 12B1` / PR 12A | Exact evaluation response types and Zod parser; 250–390 A+D |
| 12B2 | Complete | `… → PR 12A → PR 12B1 → 📍 PR 12B2` / PR 12B1 | Evaluation query-adapter mapping only; 120–220 A+D |
| 12C | Complete | `… → PR 12A → PR 12B1 → PR 12B2 → 📍 PR 12C` / PR 12B2 | Pure stale-safe evaluation lease and model/architecture proof; 200–320 A+D |
| 13A | Complete | `… → PR 12C → 📍 PR 13A` / PR 12C | Pure authoritative sequence/bucket reconciliation; 220–330 A+D |
| 13B | Complete | `… → PR 13A → 📍 PR 13B` / PR 13A | Reducer-owned selection mutations and one invalidation seam; 240–360 A+D |
| 13C0 | Complete | `… → PR 13A → PR 13B → 📍 PR 13C0` / PR 13B | Required product-owned ownership seam and honest pending copy; 150–240 A+D |
| 13C1a | Complete | `… → PR 13B → PR 13C0 → 📍 PR 13C1a` / PR 13C0 | Pure ownership-aware authority and exact request projection; 200–320 A+D |
| 13C1b1a | Complete | `… → PR 13C1a → 📍 PR 13C1b1a` / PR 13C1a | Query hook core and stale rejection; 240–360 A+D |
| 13C1b1b | Complete | `… → PR 13C1b1a → 📍 PR 13C1b1b` / PR 13C1b1a | Reconciliation-loop and retry proof; 80–140 A+D |
| 13C1b2 | Complete | `… → PR 13C1b1b → 📍 PR 13C1b2` / PR 13C1b1b | Flow integration; null ownership remains request-blocked; 100–180 A+D |
| 13D0 | Complete | `… → PR 13C1b2 → 📍 PR 13D0` / PR 13C1b2 | Flow selector-state/helper extraction only; no user behavior; 322 A+D actual |
| 13D1 | Complete | `… → PR 13C1b2 → PR 13D0 → 📍 PR 13D1` / PR 13D0 | Context-stage extraction from surface; 260–390 A+D |
| 13D2a | Complete | `… → PR 13D0 → PR 13D1 → 📍 PR 13D2a` / PR 13D1 | Current assignment definition query only; 220–350 A+D |
| 13D2b | Complete | `… → PR 13D1 → PR 13D2a → 📍 PR 13D2b` / PR 13D2a | Allowed-values paging only; 220–350 A+D |
| 13D3 | Complete | `… → PR 13D2a → PR 13D2b → 📍 PR 13D3` / PR 13D2b | Reducer-owned attributes/review-pending stages and complete BACK chain; 280–395 A+D |
| 13D4a | Complete | `… → PR 13D2b → PR 13D3 → 📍 PR 13D4a` / PR 13D3 | Attribute/review rail and command chrome only; under 399 A+D |
| 13D4b | Complete | `… → PR 13D3 → PR 13D4a → 📍 PR 13D4b` / PR 13D4a | Current-assignment presenter, unconnected from surface/query knowledge; 260–390 A+D |
| 13D5a | Complete | `… → PR 13D3 → PR 13D4a → PR 13D4b → 📍 PR 13D5a` / PR 13D4b | Pure current-attribute derivation from authoritative evaluation and buckets; under 399 A+D |
| 13D5b | Complete | `… → PR 13D4b → PR 13D5a → 📍 PR 13D5b` / PR 13D5a | Attribute orchestration hook; 260–390 A+D |
| 13D5c | Complete | `… → PR 13D5a → PR 13D5b → 📍 PR 13D5c` / PR 13D5b | Flow actions and authoritative completion; 180–300 A+D |
| 13D5d1a | Complete | `… → PR 13D5c → 📍 PR 13D5d1a` / PR 13D5c | Base pure presenter projection; 180–300 A+D |
| 13D5d1b | Complete | `… → PR 13D5d1a → 📍 PR 13D5d1b` / PR 13D5d1a | Selection projection with allowed values/buckets/callbacks; 180–300 A+D |
| 13D5d2a | Complete | `… → PR 13D5d1b → 📍 PR 13D5d2a` / PR 13D5d1b | Reducer-owned Back exposure and review re-entry guard; under 100 A+D |
| 13D5d2b | Complete | `… → PR 13D5d2a → 📍 PR 13D5d2b` / PR 13D5d2a | Primary surface authority/render adoption; under 399 A+D |
| 13D5d2c | Complete | `… → PR 13D5d2b → 📍 PR 13D5d2c` / PR 13D5d2b | Surface keyboard and transition triangulation; 100–220 A+D |
| 14 | Ready / unstarted | `… → PR 13D5d2c → 📍 PR 14` / PR 13D5d2c | Authoritative review plus create input/result parser, mutation, and UI; 320–395 A+D |
| 15 | Ready after PR 14 / unstarted | `… → PR 13D5d2c → PR 14 → 📍 PR 15` / PR 14 | Backend-enabled browser/axe/regression closure; 260–370 A+D |

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

- [x] **RED:** Add failing RTL cases for `<ol>` rail semantics, `aria-current="step"`, confirmed-stage return, 44px interactive rail targets, and stage-specific command copy that omits Crear in pending. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement feature-local `CreationStageRail.tsx` and `CreationCommandBar.tsx` with semantic tokens, shape/text state cues beyond color, valid Back/Escape guidance, and existing `Button` chrome. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Verify rail navigation alone preserves valid selections while a later alternative confirmation triggers the reducer cascade, run the focused command, and record the rail runtime result. <!-- sdd-owner: implementation -->

### PR 4 — Search-list candidate, focus, and local-search refinements

**Depends on:** PR 3. **Start → finish:** Class-stage selector foundation → `StagedSearchSelector` fully enforces search↔list transfer, candidate-versus-confirmed separation, IME/event precedence, and honest loaded-page filtering. **Files:** `src/features/resources-master/StagedSearchSelector.tsx`, `src/features/resources-master/stagedSearchSelector.model.ts`, `tests/unit/StagedSearchSelector.test.tsx`, `tests/architecture/keyboardBoundaries.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/StagedSearchSelector.test.tsx tests/architecture/keyboardBoundaries.test.ts && pnpm typecheck`. **Runtime:** type, ArrowDown, ArrowUp, printable-from-list, Enter, load-more, and retry without an automatic selection. **Rollback:** revert selector/model/selector tests only; retain the existing single global keyboard controller.

- [x] **RED:** Add failing RTL tests for Spanish loaded-name-only filtering and copy, ArrowDown search→list, ArrowUp first-item→search, printable list→search, Enter on focused item only, IME/defaultPrevented guards, and filter/page candidate repair without confirmation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Refine `StagedSearchSelector.tsx` and its pure model to keep `candidateKey` distinct from `confirmedKey`, use local React Aria handlers only, announce loading/error/empty state, and leave continuation outside the listbox. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Add click/Enter parity, zero-visible-with-cursor, and continuation-preserves-query cases; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->

### PR 5 — Staged Familia and Tipo integration

**Depends on:** PR 4 and the preserved Class stage. **Start → finish:** Class-only staged path → Familia is gated by confirmed Clase and Tipo by confirmed Familia, with paginated/stale-safe current contracts and atomic ancestor cascades. **Files:** `src/features/resources-master/useResourceCreationFlow.ts`, `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/crearRecursoSurface.test.tsx`, `tests/unit/resourceCreation.model.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime:** keyboard-confirm Clase→Familia→Tipo, replace an ancestor, and observe stale responses and descendant state are rejected. **Rollback:** remove only Familia/Tipo bindings and their tests, preserving Class.

- [x] **RED:** Add failing surface/model cases for parent-gated pagination, deep valid prefix entry, invalid-prefix fallback, Class/Family replacement cascades, same-ID reconfirmation, and stale descendant response rejection. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Wire independent existing `createParentGatedListController` instances through `useResourceCreationFlow.ts`, render staged Familia/Tipo selectors, and remove the corresponding simultaneous legacy controls. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Exercise continuation, dedupe, retry, rail return, and local-screen isolation across all three hierarchy stages; run the focused command and record the keyboard runtime result. <!-- sdd-owner: implementation -->

### PR 6 — Pure natural-Unit policy/detail resolver

**Depends on:** PR 5. **Start → finish:** no Type-scoped Unit candidates → a stale-safe pure loader emits only hydrated, active, effective Unit candidates from effective Type policies. **Files:** `src/features/resources-master/resourceCreation.loaders.ts`, `tests/unit/resourceCreation.loaders.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts && pnpm typecheck`. **Runtime:** N/A — deferred-promise tests prove the resolver consumed by PR 7. **Rollback:** revert the Unit resolver and tests only.

- [x] **RED:** Add deferred-promise failures for policy and unit dedupe, effective/non-shadowed filtering, `getUnit` hydration, null/inactive exclusion, partial hydration error/retry, stale Tipo rejection, and explicit continuation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add the feature-local `UnitCandidate` resolver using only current Type-policy pages and `getUnit`, token/context/cursor adoption guards, first-order preservation, and principal/selected as focus preference only. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove duplicate policies OR-combine preference flags, retained resolved candidates survive a partial error, and repeated non-exhausted cursors fail recoverably; run the focused command. <!-- sdd-owner: implementation -->

### PR 7 — Explicit staged Unidad natural decision

**Depends on:** PR 6. **Start → finish:** resolver without rendered choice → Unidad is a visible search-list decision whose preferred candidate is only focused and whose explicit Enter/click leads to pending. **Files:** `src/features/resources-master/useResourceCreationFlow.ts`, `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/crearRecursoSurface.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.loaders.test.ts tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime:** confirm a hydrated eligible Unit by Enter; verify a global-unit list is never offered and pending/error blocks confirmation. **Rollback:** remove Unit flow/rendering only, retaining PR 6 resolver.

- [x] **RED:** Add failing RTL cases for Unit entry after Tipo, preferred-but-unconfirmed candidate, explicit Enter/click, eligible empty state, partial-error retry, and Type-change invalidation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Connect the PR 6 resolver through `useResourceCreationFlow.ts`, render the staged Unit selector in `CrearRecursoSurface.tsx`, and dispatch `CONFIRM_UNIT` only from explicit confirmation. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover load-more with immediately confirmable hydrated candidates versus pending/failed hydration that cannot advance, run the focused command, and record the runtime result. <!-- sdd-owner: implementation -->

### PR 8 — Remove legacy attribute and manual-capture regions behind the wall

**Depends on:** PR 7. **Start → finish:** unreachable legacy attribute/manual views remain in source → those regions and tests are removed while `contract-pending` stays the only end after Unit. Split again by source region rather than exceed 399 A+D. **Discovery targets:** imports and branches in `src/features/resources-master/CrearRecursoSurface.tsx`; legacy attribute presenters/loaders under `src/features/resources-master/`; stale expectations in `tests/unit/crearRecursoSurface.test.tsx` and `tests/unit/resourceCreation.loaders.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.loaders.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** complete Unit and inspect only Contract pending. **Rollback:** restore this deletion slice only; retain the safety wall.

- [x] **RED:** Replace stale legacy assertions with failing negative tests that the production Creador exposes no TEXTO, NUMERO, BOOLEANO, OPCION, Nombre, Descripción, or legacy attribute request after Unit. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Delete one bounded legacy attribute/manual-capture region at a time from the discovery targets, including now-orphaned imports and tests, without deleting current API operations used by other consumers. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Run the focused command and a source-boundary scan proving no reachable Creador branch renders a free business-value input; record the Unit-to-pending runtime result. <!-- sdd-owner: implementation -->

### PR 9 — Remove legacy review, payload, and create flow

**Depends on:** PR 8. **Start → finish:** dead legacy submit/review/payload code remains → Creador contains no `buildResourceCreateInput`, `ResourceCreateInput`, `api.createResource`, ownership mapping, or legacy result path. **Discovery targets:** `src/features/resources-master/CrearRecursoSurface.tsx`, `src/features/resources-master/resourceCreation.model.ts`, any feature-local `ResourceCreationDetails*`/attribute stage files, and `tests/unit/resourceCreation*.test*`. **Verify:** `pnpm exec vitest run tests/unit/crearRecursoSurface.test.tsx tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** pending has Back/Close only and never invokes `onCreated`. **Rollback:** restore only this cleanup region; do not change `resourcesMaster.api.ts` or the legacy backend method.

- [x] **RED:** Add failing architecture/surface assertions that Creador source has no legacy payload/create symbols and that completing Unit does not invoke `onCreated` or any create operation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Delete the bounded legacy review, submit, payload, ownership, and result branches plus their obsolete tests while retaining the `onCreated → refetchActive()` seam unused by pending. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Verify close/back focus behavior still works after removal, run the focused command, and record the no-create runtime result. <!-- sdd-owner: implementation -->

### PR 10 — Pure active/suspended selection buckets

**Depends on:** PR 9. **Start → finish:** no reversible local selection model → generic, transport-free buckets retain opaque values by assignment ID without interpreting conditions or calling backend. **Files:** `src/features/resources-master/resourceCreation.selectionDraft.ts`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/resourceCreation.selectionDraft.test.ts`, `tests/unit/resourceCreation.model.test.ts`. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.selectionDraft.test.ts tests/unit/resourceCreation.model.test.ts && pnpm typecheck`. **Runtime:** N/A — pure contract consumed only after the backend-v1 gate. **Rollback:** revert the new pure module/model integration and tests only.

- [x] **RED:** Add failing opaque-value tests for assignment-ID keying, active/suspended exclusivity, confirm, omit, suspend, restore, keep-suspended, active-only projection, hierarchy reset, Unit evaluation invalidation, and revision increments. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement generic `SelectionBuckets<TSelection>` and pure operations in `resourceCreation.selectionDraft.ts`; keep `SelectionBuckets<never>` in the current runtime and never introduce a transport DTO or local `CONDITIONAL` evaluator. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove definition-ID/index collisions cannot merge assignments and that omitted differs from unanswered, then run the focused command and record the pure-contract result. <!-- sdd-owner: implementation -->

### PR 11 — Backend-independent accessibility, browser, and architecture closure

**Depends on:** PR 10. **Start → finish:** focused unit coverage → keyboard-only Class→Familia→Tipo→Unidad→Contrato pendiente behavior, WCAG checks, isolation, and file-size guards are proven without backend-v1 simulation. **Files:** `tests/e2e/resourcesMaster.workstation.spec.ts`, `tests/architecture/resourceCreationBoundaries.test.ts`, `tests/architecture/keyboardBoundaries.test.ts`, `tests/unit/resourcesMasterScreen.test.tsx`, `tests/unit/resourcesMasterScreenRefetch.test.tsx`. **Verify:** `pnpm exec vitest run tests/unit/resourcesMasterScreen.test.tsx tests/unit/resourcesMasterScreenRefetch.test.tsx tests/architecture/keyboardBoundaries.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`. **Runtime:** Chromium 1440×980 keyboard route, Escape ladder, opener/fallback restoration, and axe on selector/pending. **Rollback:** revert closure tests/guards only.

- [x] **RED:** Add failing browser/architecture cases for keyboard-only staged hierarchy, honest loaded-page copy/Cargar más, Escape pending→Unit→Type→Family→Class→close, focus restoration, axe dialog states, no feature global listener, runtime <500 lines, and no create/payload imports. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add only the named test/guard evidence and any minimal test fixtures required to exercise completed behavior; do not add attribute/evaluator/create mocks to production or tests before exact DTOs exist. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Run the full focused closure command, remove only duplicated assertions, and record exact gate and browser results or unavailable failures honestly. <!-- sdd-owner: implementation -->

## Ready — frontend-v1 integration from accepted contract authority

**Accepted authority for PRs 12A, 12B, 12C, and 13–15:** backend commit `23e9440c2b832edb8e557134018ea812979c6452`; generated reference `convex/_generated/api.d.ts`; sources `convex/catalogoAdmin/{atributos.ts,recursos.ts,resourceValidators.ts}`; and consumer reference `contract-tests/resource-admin-consumer.ts`. The four public operations are `api.catalogoAdmin.atributos.obtenerDefinicionAtributo`, `api.catalogoAdmin.atributos.listarValoresPermitidosAtributo`, `api.catalogoAdmin.recursos.evaluarCreacionDesdeSelecciones`, and `api.catalogoAdmin.recursos.crearRecursoDesdeSelecciones`. Parse the published DTOs and only their explicit application dispositions; ordinary Convex transport failures are not a typed application-return union. Do not infer from `crearRecurso`, `ResourceCreateInput`, `tipoDato`, or legacy option endpoints.

### PR 12A — Exact definition and allowed-values schemas, parsers, and query adapters

**Depends on:** PR 11. **Dependency diagram:** `… → PR 11 → 📍 PR 12A`. **Start → finish:** pending-only frontend with no v1 definition/value boundary → exact Zod-validated definition and allowed-values query results are available behind feature-local adapters. **Concrete frontend targets:** `src/features/resources-master/resourcesMaster.types.ts`, `src/features/resources-master/resourcesMaster.api.ts`, and `tests/unit/resourcesMasterApi.test.ts`. **Budget:** 240–360 A+D. **Verify:** `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts && pnpm typecheck`. **Runtime:** N/A — pure parser/query-adapter contract consumed by PR 13. **Rollback:** remove only these definition/allowed-values schemas, parsers, adapter mappings, and tests. **Out of scope:** evaluation, create input/result parsing, mutation calls, and UI; do not add create in PR 12A.

- [x] **RED:** Add failing exact-fixture tests for nullable definition, optional fields omitted rather than nulled, `modoCaptura: SELECCION | LIBRE`, paginated typed allowed values, and malformed/unknown definition or page rejection. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add only definition and allowed-values Zod schemas/parsers plus their `ResourceOperation`, `ResourceTransport`, and `ResourcesMasterApi` query-adapter mappings; do not add evaluator or create behavior. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove optional-field absence, each typed allowed value, pagination continuation, and malformed transport rejection through the focused command; retain no evaluator/create test or production path. <!-- sdd-owner: implementation -->

### PR 12B1 — Exact evaluation response types and parser

**Depends on:** PR 12A. **Dependency diagram:** `… → PR 11 → PR 12A → 📍 PR 12B1`. **Start → finish:** validated definition/value boundary → exact evaluated-creation response types and parser are available without any request input, API method, operation, transport, factory, lease, model, create, or UI adoption. **Targets:** `resourcesMaster.types.ts`, `resourcesMaster.api.ts`, `resourcesMasterApi.test.ts`. **Budget:** 250–390 A+D. **Verify:** `pnpm exec vitest run tests/unit/resourcesMasterApi.test.ts && pnpm typecheck`. **Runtime:** N/A — pure parser consumed by PR 12B2. **Rollback:** remove only response types/parser/tests.

- [x] **RED:** Add failing exact-fixture tests for `INCOMPLETE | VALID | INVALID`, `valid` consistency, nullable generated identity, resolved assignments, 13 issue codes, fingerprint, and malformed/unknown evaluation rejection. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add only public exact evaluation response types and the Zod parser; do not add request input, API method, operation, transport, factory, lease, create, or UI behavior. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove each status, absent selected value, unknown issue/nested/top-level rejection, normalized primitives, and `valid`/status consistency fail closed through the focused command. <!-- sdd-owner: implementation -->

### PR 12B2 — Evaluation query adapter

**Depends on:** PR 12B1. **Dependency diagram:** `… → PR 12A → PR 12B1 → 📍 PR 12B2`. **Start → finish:** validated evaluation parser → the query input, API method, `ResourceOperation`, `ResourceTransport`, and factory mapping are added without lease/model/create/UI adoption. **Budget:** 120–220 A+D. **Rollback:** remove only query-adapter mapping/tests.

- [x] **RED:** Add failing exact query-adapter invocation and transport-rejection tests. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add only the published evaluation query input, API method, operation, transport, and factory mapping through the PR 12B1 parser. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove supplied request fields, malformed response rejection, and transport rejection through the focused command. <!-- sdd-owner: implementation -->

### PR 12C — Pure stale-safe authoritative evaluation lease

**Depends on:** PR 12B2. **Dependency diagram:** `… → PR 11 → PR 12A → PR 12B1 → PR 12B2 → 📍 PR 12C`. **Start → finish:** parsed evaluation facts without local adoption → a feature-local lease accepts only current token, hierarchy/Unidad context, and draft revision, clearing stale facts before any future review. **Concrete frontend targets:** new `src/features/resources-master/resourceCreation.evaluationLease.ts`, `src/features/resources-master/resourceCreation.model.ts`, `tests/unit/resourceCreation.evaluationLease.test.ts`, `tests/unit/resourceCreation.model.test.ts`, and `tests/architecture/resourceCreationBoundaries.test.ts`. **Budget:** 200–320 A+D. **Verify:** `pnpm exec vitest run tests/unit/evaluationLease.test.ts tests/unit/resourceCreation.model.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** N/A — pure lease consumed by PR 13/14. **Rollback:** remove only the lease module, model seam, tests, and architecture guard. **Out of scope:** create input/result parsing, mutation calls, review/create UI, and any create operation; do not add create in PR 12C.

- [x] **RED:** Add failing lease/model/architecture tests for current-token adoption, stale or out-of-order token rejection, hierarchy/Unidad context mismatch, draft-revision mismatch, and no create path before PR 14. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement the pure feature-local `evaluationLease` and minimum model seam so only a current validated PR 12B evaluation can be adopted and every hierarchy, Unidad, or draft mutation clears the lease/fingerprint. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove replacement Unidad, same revision with old context, malformed-adapter absence, and transport rejection cannot retain a lease or enable review/create; run the focused command and preserve the no-create architecture guard. <!-- sdd-owner: implementation -->

### PR 13A — Pure authoritative sequence and bucket reconciliation

**Depends on:** PR 12C. **Dependency diagram:** `… → PR 12C → 📍 PR 13A`. **Start → finish:** current validated evaluation facts and pure buckets → a transport-free reconciliation result preserves backend assignment order without local sorting and keys every bucket/sequence entry by assignment ID. **Concrete targets:** `resourceCreation.selectionDraft.ts`, a feature-local reconciliation module, and unit tests only. **Budget:** 220–330 A+D. **Verify:** focused reconciliation Vitest command plus `pnpm typecheck`. **Runtime:** N/A — PR 13C1 consumes this pure contract. **Rollback:** remove only the reconciliation module, bucket changes, and tests.

- [x] **RED:** Add exact-fixture reconciliation tests proving backend assignment order is retained without a local sort; assignment-ID keys prevent definition/index collisions; `FORBIDDEN | NOT_APPLICABLE` moves active → suspended; and active retention requires matching `selectedValueId`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement pure authoritative sequence/bucket reconciliation: restore suspended only with an active-and-effective allowed-value fact, retain absent/not-yet-exhausted validity as unknown and suspended, preserve `OPTIONAL` omission, and make omitted → `REQUIRED` pending. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover reordered authoritative sequences, exhausted versus non-exhausted allowed-value absence, invalid retained values, and current-pending-assignment retention; run and record the focused command without sending suspended values. <!-- sdd-owner: implementation -->

### PR 13B — Reducer-owned selection mutations and invalidation

**Depends on:** PR 13A. **Dependency diagram:** `… → PR 12C → PR 13A → 📍 PR 13B`. **Start → finish:** pure reconciliation result → the creation reducer owns confirm, omit, reconcile, and restore mutations through one invalidation seam. **Concrete targets:** `resourceCreation.model.ts`, `resourceCreation.selectionDraft.ts`, and unit tests. **Budget:** 240–360 A+D. **Verify:** focused model/selection Vitest command plus `pnpm typecheck`. **Runtime:** N/A — PR 13C1 consumes the reducer state. **Rollback:** remove only these reducer events, seam, and tests; retain PR 13A's pure contract.

- [x] **RED:** Add failing reducer tests for confirm, omit, reconcile, and restore events; effective changes increment revision and clear evaluation, fingerprint, and request token through one seam, while no-ops remain stable. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement reducer-owned confirm/omit/reconcile/restore events using the single invalidation seam; preserve existing hierarchy and Unidad mutation semantics and do not issue evaluation requests from the reducer. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove duplicate confirmations, repeated omissions, unchanged reconciliation, valid restoration, hierarchy replacement, and Unidad replacement have the prescribed stable or invalidating result; run and record the focused command. <!-- sdd-owner: implementation -->

### PR 13C0 — Required creation-ownership seam

**Depends on:** PR 13B. **Dependency diagram:** `… → PR 13A → PR 13B → 📍 PR 13C0`. **Start → finish:** Creador has no product-owned ownership input → the Entry composition host explicitly supplies `creationOwnership: ResourceCreationEvaluationOwnership | null`, Screen forwards it, and Creador requires `ownership`. `null` blocks with ownership-specific copy; a present value reports pending evaluation integration. **Out of scope:** no evaluation request, driver, reconciliation, review, or create behavior. Never default `GLOBAL` or invent an organization ID. **Concrete targets:** Entry, Screen, Creador, pending copy, focused surface/screen/architecture tests. **Budget:** 150–240 A+D. **Verify:** focused ownership-seam Vitest command plus `pnpm typecheck`. **Rollback:** remove only the prop seam, pending copy, tests, and this documentation update.

- [x] **RED:** Add failing focused tests for explicit null ownership at Entry, required Screen/Creador propagation, and distinct null-versus-present pending copy without backend-missing language. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Require `creationOwnership` through Entry → Screen and `ownership` at Creador; pass explicit null only at the composition host and add no evaluation behavior. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove null blocks while an explicit present ownership remains integration-pending, retain no `GLOBAL` default, and run the focused suite. <!-- sdd-owner: implementation -->

### PR 13C1a — Ownership-aware evaluation authority and request

**Depends on:** PR 13C0. **Dependency diagram:** `… → PR 13B → PR 13C0 → 📍 PR 13C1a`. **Start → finish:** nullable ownership seam and stale-safe lease → pure exact request projection and ownership-bound evaluation authority, without React, API calls, or UI. **Concrete targets:** feature-local request/lease/model modules and focused unit/architecture tests. **Budget:** 200–320 A+D. **Verify:** focused request/lease/model/architecture Vitest command plus `pnpm typecheck`. **Rollback:** remove only the request module and ownership-authority additions; retain PRs 13A–13C0.

- [x] **RED:** Add failing pure request/lease/model tests for exact GLOBAL/ORGANIZATION projection, invalid ownership/context rejection, ownership-bound capture/adoption, and authority clearing. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Project active selections only and bind lease/state authority to a normalized ownership identity that invalidates a different ownership immediately. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove opaque IDs are never stringified, stale/null ownership responses are rejected, same-ownership retries retain authority, reducer mutations/OPEN clear it, and runtime inventory includes the request module. <!-- sdd-owner: implementation -->

### PR 13C1b1a — Evaluation hook core

**Depends on:** PR 13C1a. **Dependency diagram:** `… → PR 13C1a → 📍 PR 13C1b1a`. **Start → finish:** pure authority → unintegrated TanStack Query hook with two-phase lease arming, null clearing, current adoption, and stale-key guards. **Budget:** 240–360 A+D.

- [x] **RED:** Add a failing hook import and null/current request fixtures. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement the formatted query hook without flow/UI integration. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Reject an old response after a selection revision and include open generation/revision in the query key. <!-- sdd-owner: implementation -->

### PR 13C1b1b — Reconciliation and retry proof

**Depends on:** PR 13C1b1a. Add focused reconciliation-loop, transport-error, explicit retry, and reopened-cache tests without changing production behavior. **Budget:** 80–140 A+D.

- [x] **RED:** Add failing reconciliation/retry/cache-isolation cases. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Prove current hook behavior; change production only for a demonstrated defect. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Run focused/full verification and record exact results. <!-- sdd-owner: implementation -->

### PR 13C1b2 — Flow integration

**Depends on:** PR 13C1b1b. Integrate the hook into `useResourceCreationFlow`, pass required nullable ownership, and expose status/retry; null remains request-blocked. **Budget:** 100–180 A+D.

- [x] **RED:** Prove explicit ownership evaluates after Unidad while null does not. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Integrate without another stage authority or manual fetch state. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove reopen/ownership/revision lifecycle remains stale-safe. <!-- sdd-owner: implementation -->

### PR 13D0 — Flow selector-state helper boundary

**Depends on:** PR 13C1b2. **Dependency diagram:** `… → PR 13C1b1b → PR 13C1b2 → 📍 PR 13D0`. **Start → finish:** flow-local selector/load-state helpers → one feature-local module imported by the flow, with exact behavior and public flow API preserved. **Concrete targets:** `useResourceCreationFlow.ts`, `resourceCreation.selectorState.ts`, and focused unit/architecture proof. **Budget:** 322 A+D actual. **Verify:** focused selector-state/architecture Vitest command plus `pnpm typecheck`. **Runtime:** N/A — mechanical boundary with no user-visible behavior. **Rollback:** restore the three helpers to the flow and remove only the local module/proof.

- [x] **RED:** Added failing selector-state import and architecture boundary proof; both failed because the feature-local module did not exist. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Extracted `selectorLoadState`, `unitSelectorLoadState`, and `useControllerState` unchanged into `resourceCreation.selectorState.ts`; the flow imports and uses them. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Covered parent-gated status mapping, Unit hydration/policy precedence, and flow-module wiring; focused proof passed. <!-- sdd-owner: implementation -->

### PR 13D1 — Context-stage extraction from surface

**Depends on:** PR 13D0. **Dependency diagram:** `… → PR 13C1b2 → PR 13D0 → 📍 PR 13D1`. **Runtime gate:** Entry still supplies null ownership, so production remains on the ownership-specific pending state until product integration supplies it. **Start → finish:** monolithic surface context branches → feature-local context-stage composition with no attribute behavior enabled. **Budget:** 260–390 A+D. **Verify:** focused surface RTL/Vitest command plus `pnpm typecheck`. **Rollback:** remove only the extracted context-stage composition and tests.

- [x] **RED:** Add failing architecture proof that hierarchy/Unidad context retains its current keyboard behavior through the extracted boundary. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Extract only the existing context-stage surface composition; do not render an attribute assignment, free-value editor, review, or create control. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover Class/Family/Type/Unit return and pending-wall behavior through the extracted component; run and record the focused command. <!-- sdd-owner: implementation -->

### PR 13D2a — Attribute definition query driver

**Depends on:** PR 13D1. **Dependency diagram:** `… → PR 13D0 → PR 13D1 → 📍 PR 13D2a`. **Start → finish:** parsed definition adapter unused by the flow → stale-safe feature-local current-assignment definition query without rendering, reducer adoption, or allowed-value knowledge. **Budget:** 220–350 A+D. **Verify:** `pnpm exec vitest run tests/unit/useResourceCreationAttributeDefinition.test.tsx tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** N/A — consumed by PR 13D5. **Rollback:** remove only the driver and its focused proof.

- [x] **RED:** Added failing unit proof for null blocking, exact current loading, unavailable definition data, LIBRE, retry, and stale assignment isolation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Drive only published `getAttributeDefinition` queries with current-assignment guards; no allowed-values, create, or free-value path. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Proved null/mismatch/inactive/ineffective rejection, LIBRE unsupported presentation, transport retry, and deferred stale rejection; run the focused command. <!-- sdd-owner: implementation -->

### PR 13D2b — Allowed-values paging driver

**Depends on:** PR 13D2a. **Dependency diagram:** `… → PR 13D1 → PR 13D2a → 📍 PR 13D2b`. **Start → finish:** current definition query → stale-safe allowed-values continuation and retry paging, without rendering or reducer-stage adoption. **Budget:** 220–350 A+D. **Verify:** focused driver/unit Vitest command plus `pnpm typecheck`. **Runtime:** N/A — consumed by PR 13D5. **Rollback:** remove only allowed-values paging and its focused proof.

- [x] **RED:** Add failing unit proof for current definition allowed-value continuation and retry paging. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Drive only published allowed-values queries with current-definition guards; do not issue a create request or add a free-value path. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove stale definition rejection, paging, and transport retry; run and record the focused command. <!-- sdd-owner: implementation -->

### PR 13D3 — Reducer-owned attribute and review-pending stages

**Depends on:** PR 13D2b. **Dependency diagram:** `… → PR 13D2a → PR 13D2b → 📍 PR 13D3`. **Start → finish:** selection buckets without attribute-stage navigation → reducer-owned attribute/review-pending stages with the complete Back chain. **Budget:** 280–395 A+D. **Verify:** focused model/selection Vitest command plus `pnpm typecheck`. **Runtime:** N/A — consumed by PR 13D5. **Rollback:** remove only the stage events/navigation and their proof.

- [x] **RED:** Add failing reducer cases for required and optional pending transitions, omission, sequence reconciliation, and Back from review pending through attributes to Unidad. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add only reducer-owned stage transitions and the complete Back chain; preserve suspended selections outside evaluation requests and do not add create behavior. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove `INVALID` with assignments permits correction but blocks completion, while the reducer retains no assignment cursor. <!-- sdd-owner: implementation -->

### PR 13D4a — Attribute/review rail and command chrome

**Depends on:** PR 13D3. **Dependency diagram:** `… → PR 13D2b → PR 13D3 → 📍 PR 13D4a`. **Start → finish:** reducer stages without chrome → feature-local attribute/review rail markers and command copy, with no surface, presenter, query, flow, or model integration. **Budget:** under 399 A+D. **Verify:** `pnpm exec vitest run tests/unit/creationStageRail.test.tsx tests/unit/creationCommandBar.test.tsx tests/unit/crearRecursoSurface.test.tsx` plus `pnpm typecheck`. **Rollback:** remove only rail/command chrome and focused tests.

- [x] **RED:** Added focused rail/bar assertions for the exact attribute counter, non-navigable attribute/review markers, reversible context selections, compact command copy, and no command-key action behavior; they failed before chrome support existed. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Extended only `CreationStageRail` and `CreationCommandBar`: `Atributos · n de total` uses the current pending position and total, review is a pending marker, and `onNavigate` remains context-only. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Verified the optional progress fallback through the unchanged surface regression and all focused rail/bar tests; no presenter, handler, or global key path was added. <!-- sdd-owner: implementation -->

### PR 13D4b — Current-assignment presenter

**Depends on:** PR 13D4a. **Dependency diagram:** `… → PR 13D3 → PR 13D4a → 📍 PR 13D4b`. **Start → finish:** reducer stages plus chrome → feature-local keyboard-first current-assignment presenter, unconnected from surface/query knowledge. **Budget:** 260–390 A+D. **Verify:** focused attribute RTL/Vitest command plus `pnpm typecheck`. **Rollback:** remove only this presenter and its tests.

- [x] **RED:** With an explicit non-null ownership fixture, add failing RTL tests for one assignment at a time, `modoCaptura: SELECCION` confirmation, `LIBRE` unsupported presentation, and optional **Omitir**. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Render only the current authoritative assignment with no free-value editor or simultaneous assignment controls. **Product decision:** `OPTIONAL` `LIBRE` may be omitted. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Cover presenter commands and unsupported `LIBRE` presentation without adding an input; run and record the focused command. <!-- sdd-owner: implementation -->

### PR 13D5a — Pure current-attribute derivation

**Depends on:** PR 13D4b. **Dependency diagram:** `… → PR 13D3 → PR 13D4a → PR 13D4b → 📍 PR 13D5a`. **Start → finish:** authoritative evaluation/buckets without a cursor → a pure discriminated `unavailable | complete | current` result that preserves backend sequence order and assignment identity. **Budget:** under 399 A+D. **Verify:** `pnpm exec vitest run tests/unit/resourceCreation.attributeStep.test.ts tests/unit/resourceCreation.attributeSequence.test.ts tests/architecture/resourceCreationBoundaries.test.ts && pnpm typecheck`. **Runtime:** N/A — pure contract consumed by PR 13D5b. **Rollback:** remove only the derivation module, focused proof, and this replan; retain PRs 13A–13D4b.

- [x] **RED:** Added failing pure-module tests; the focused run failed because `resourceCreation.attributeStep` did not exist. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Derive current from only authoritative evaluation status/applicability and active/omitted/suspended buckets; preserve `deriveAttributeSequence` order, fail closed for null or duplicate applicable assignment IDs, and never call an API or inspect allowed values/issues. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Proved same-definition assignments remain distinct, suspended never resolves, `INVALID | INCOMPLETE` unresolved assignments remain correctable, and only resolved `VALID` returns complete. <!-- sdd-owner: implementation -->

### PR 13D5b — Attribute orchestration hook

**Depends on:** PR 13D5a. **Dependency diagram:** `… → PR 13D4b → PR 13D5a → 📍 PR 13D5b`. **Runtime gate:** Entry still supplies null ownership, so production remains on the ownership-specific pending state until product integration supplies it. **Start → finish:** isolated definition/allowed-value drivers and current derivation → one stale-safe hook composes them for the current authoritative assignment without surface rendering or reducer dispatch. **Budget:** 260–390 A+D. **Verify:** focused hook/attribute-step Vitest command plus `pnpm typecheck`. **Rollback:** remove only hook composition and its proof; retain PRs 13A–13D5a.

- [x] **RED:** Add failing hook tests for null/unavailable/current/complete derivation, current-definition isolation, allowed-value continuation, and stale assignment rejection. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Compose only the current authoritative assignment's definition and selection-only allowed-value paging behind a feature-local hook; do not dispatch, render, evaluate conditions, or create. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove retries, sequence replacement, unavailable facts, and suspended selections cannot leak stale definition/value knowledge; run the focused command. <!-- sdd-owner: implementation -->

### PR 13D5c — Flow actions and authoritative completion

**Depends on:** PR 13D5b. **Dependency diagram:** `… → PR 13D5a → PR 13D5b → 📍 PR 13D5c`. **Start → finish:** composed attribute authority without flow actions → flow projects the current result, reducer-owned select/omit actions, and terminal completion without surface rendering changes. **Budget:** 180–300 A+D. **Verify:** focused flow/model/attribute-step Vitest command plus `pnpm typecheck`. **Rollback:** remove only flow action/completion adoption and its proof; retain PRs 13A–13D5b.

- [x] **RED:** Add failing flow tests for active selection, optional omission, `INVALID | INCOMPLETE` correction, suspended values absent from requests, and `VALID` completion. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Expose reducer-owned selection actions and permit completion only from the `complete` derivation result; do not add a reducer cursor, create behavior, or surface rendering. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE/REFACTOR:** Prove reordered sequences retain the first unresolved assignment where possible and non-VALID all-resolved evaluations do not complete; run the focused command. <!-- sdd-owner: implementation -->

### PR 13D5d replan — base projection, selection projection, and surface

- [x] **PR 13D5d1a:** Base pure presenter projection maps evaluation, current-step, definition, and optional omission authority without allowed-value/bucket/callback mapping.
- [x] **PR 13D5d1b:** Add selection projection for allowed values, buckets, and callbacks; 180–300 A+D.
- [x] **PR 13D5d2a:** Expose reducer-owned Back and guard deliberate return from review against immediate automatic re-entry.
- [x] **PR 13D5d2b:** Adopt flow-owned stages and render the projected current presenter; under 399 A+D.
- [x] **PR 13D5d2c:** Triangulate keyboard transitions, optional omission, `INVALID` correction, and terminal pending review; 100–220 A+D.

### PR 14 — Authoritative review and fingerprinted creation

**Depends on:** PR 13D5d. **Dependency diagram:** `… → PR 13D5c → PR 13D5d → 📍 PR 14`. **Start → finish:** evaluated selection sequence → review and create are driven only by a current `VALID` evaluation and the published `CREATED | CATALOG_CHANGED | INCOMPLETE | INVALID` disposition union. **Concrete targets:** `resourcesMaster.types.ts` and `resourcesMaster.api.ts` for the exact create input/result parser and mutation adapter; feature-local review/result components, `ResourceCreationShell.tsx`, `CrearRecursoSurface.tsx`, and exact-contract unit/RTL tests. PR 14 exclusively owns the create parser, mutation, and UI. **Budget:** 320–395 A+D. **Verify:** focused review/create Vitest/RTL command plus `pnpm typecheck`. **Rollback:** remove review/create integration and return to the evaluated selection boundary without touching legacy `crearRecurso`.

- [ ] **RED:** Write failing exact-fixture tests for `INCOMPLETE | VALID | INVALID` rendering, evaluation invalidation on every selection mutation, required `expectedCatalogFingerprint`, active selection IDs only, `CREATED | CATALOG_CHANGED | INCOMPLETE | INVALID`, stale/unknown disposition handling, and confirmed-success-only behavior. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Render generated `nombre`, `identificadorTecnico`, assignments, and issues exclusively from validated evaluation output; call `crearRecursoDesdeSelecciones` only with a current `expectedCatalogFingerprint` and represent only published dispositions. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Prove a concurrent, stale, unknown, or transport-rejected response never presents success or calls `onCreated`; run the focused command and record its exact result. <!-- sdd-owner: implementation -->

### PR 15 — Backend-enabled browser and regression closure

**Depends on:** PR 14. **Start → finish:** exact-contract unit coverage → browser/axe and boundary regressions prove `modoCaptura: SELECCION`, `OPTIONAL` omission, authoritative `INCOMPLETE | VALID | INVALID` review, and `expectedCatalogFingerprint` creation with only `CREATED` success. **Concrete targets:** `tests/e2e/resourcesMaster.workstation.spec.ts`, feature architecture guards, and exact DTO fixture helpers limited to tests. **Budget:** 260–370 A+D. **Verify:** focused Vitest architecture suite, `pnpm exec playwright test tests/e2e/resourcesMaster.workstation.spec.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build`. **Rollback:** revert closure evidence only; if runtime failures expose a behavior bug, revert its owning PR rather than weakening the test.

- [ ] **RED:** Add failing keyboard-only and axe cases for `modoCaptura: SELECCION` allowed-value selection, `OPTIONAL` omission, authoritative `INCOMPLETE | INVALID | VALID` review, fingerprinted create, and non-confirming stale/unknown/transport rejection. <!-- sdd-owner: implementation -->
- [ ] **GREEN:** Add only exact-contract test fixtures and regression assertions; keep browser intercepts conformant to published DTOs and never make them a production API substitute. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE/REFACTOR:** Run the closure commands, confirm no obsolete manual/free-value/legacy-create path returns, and record exact results. <!-- sdd-owner: implementation -->

## Parent-owned review and lifecycle gates

- [ ] Create or reuse the authorized draft/no-merge tracker for `openspec/changes/keyboard-first-resource-creation/tasks.md` and the local feature-branch chain; verify every child targets its immediate predecessor and contains its `📍` dependency diagram, with no push, PR publication, or release. <!-- sdd-owner: parent -->
- [ ] Before committing the rewritten `openspec/changes/keyboard-first-resource-creation/tasks.md`, split its over-budget documentation diff into reviewable <400 A+D commits or stop for an explicit maintainer decision; do not hide it in an implementation child. <!-- sdd-owner: parent -->
- [x] Identify and record the explicit product-owned ownership seam passed to Creador for evaluation/create: `ResourcesMasterEntry` explicitly supplies `null`, so runtime requests remain blocked until product integration supplies a non-null value; PR 13C1b and PR 13D may be implemented with explicit fixtures, but neither may default `GLOBAL` or invent an organization ID. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for each source/test work unit named in `openspec/changes/keyboard-first-resource-creation/tasks.md`, using its clean diff, exact RED/GREEN/TRIANGULATE evidence, focused command result, runtime result, dependency, and rollback boundary. <!-- sdd-owner: parent -->
- [x] Authorize starting the strict PR 12A RED work unit against the accepted backend-v1 authority in `openspec/changes/keyboard-first-resource-creation/{proposal.md,specs/keyboard-first-resource-creation/spec.md,design.md,design-details.md}` after confirming backend `23e9440c2b832edb8e557134018ea812979c6452`, the reconciled artifacts, and the local-only delivery boundary; this does not authorize a failing branch or any commit. <!-- sdd-owner: parent -->
- [ ] After accepted implementation, run the complete applicable quality suite from `openspec/config.yaml`, record unavailable checks or deviations in this change, then follow the repository OpenSpec canonical-sync and archive workflow without changing `openspec/config.yaml`. <!-- sdd-owner: parent -->

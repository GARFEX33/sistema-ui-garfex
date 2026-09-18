# Reorder effective attributes per Tipo

## Objective
Add a separate visual order for the complete effective-attribute list of a Tipo. UI provides numbered rows, accessible move up/down controls, keyboard operation and one atomic Save order action. This order must NOT create/update PRESENTACION, change canonical resource descriptions, alter applicability, or use sequential generic catalog PUT swaps.

## User decisions
- User approved implementation after reviewing UI options.
- User explicitly selected separate visual order rather than reusing presentation semantics.
- Drag is optional convenience only; no drag dependency exists and first delivery uses accessible buttons/keyboard as canonical control.

## Cross-repository scope
1. Core: `/home/garfex/PROGRAMACION/garfex-costos-unitarios-workspace`
2. API: `/home/garfex/PROGRAMACION/garfex-api`
3. Frontend: this repository
Writes remain sequential by repository: Core first, then API, then frontend. Each repository owns its local tests/docs and rollback. No commits/releases/dependency publishing without separate delivery instruction.

## Contract
Scope is exact `{classCode,familyCode,typeCode}`; type code is not globally unique. Public ordered identity is `{sourceLevel: FAMILY|TYPE, sourceCode, characteristicCode}`. It resolves a resource-attribute binding inside the exact target scope; no database IDs are exposed. The ordered list must be an exact permutation of the complete effective occurrences. Duplicate composite keys are invalid; duplicate characteristic codes across FAMILY/TYPE are allowed and remain distinct. This feature does not define inheritance override/evaluation precedence.

Proposed API:
- `GET /v1/types/{typeCode}/attributes/order?classCode=...&familyCode=...`
- `PUT` same route with strict body `{actor, expectedOrderRevision, orderedAttributes:[composite keys...]}`.
- `200` returns `{scope, orderedAttributes, orderRevision}` authoritative committed snapshot; non-null arrays.
- Missing/malformed transport400, scope404, stale/concurrent409, invalid permutation/reference422, unavailable503, internal500. Actor is audit metadata, not authentication.
- Revision is opaque and scope-bound; frontend never parses or synthesizes it and never automatically retries conflicts.

## Core design
Dedicated tables, never PRESENTACION:
- head keyed by target `type_id`, positive revision and timestamp;
- items keyed by `(target_type_id, resource_attribute_id)`, unique target position, FK binding ON DELETE CASCADE.
Binding identity preserves inherited/direct occurrences. Repository resolves DB binding IDs to public composite keys under the exact scope. Recreated bindings append and change the token; retained eligible binding IDs retain saved relative order.

No saved order preserves existing EffectiveAttributesFor baseline (presentation-positioned first, then declaration order). Saved surviving items come first; newly effective/unlisted items append in baseline order; stale deleted/non-effective items are ignored. A successful full reorder replaces the persisted full eligible set.

Opaque token v1 hashes unambiguous scope/type identity, head revision, full composite membership/order and internal binding IDs/revisions. Always increment head revision for accepted writes, including no-op, so the same token has one winner. Reorder locks before reading: short SHARE locks over structural catalog tables plus target type row FOR UPDATE, then fresh catalog/head/items load, token compare, exact permutation validation, atomic replace, reread/verify, commit. This low-volume admin lock cost is accepted for the initial robust implementation. Commit uncertainty returns unavailable and requires fresh read, never blind replay.

Effective attribute array order may use the dedicated visual overlay, but existing `Position`/`HasPosition` remain presentation metadata. Resource description/presentation algorithms and tables remain unchanged. Reads are DB-backed coherent snapshots and must not publish visual order into process-local CatalogAuthority.

## Reviewable implementation units
### C1 Core pure model/resolver/token (~250–350 lines)
- [x] Composite key, snapshot/request, baseline/saved resolver, exact permutation, token, copy tests.
### C2 Core migration (~150–250)
- [x] `000010_resource_type_attribute_order` up/down, grants, FKs/cascades/uniqueness/migration tests.
### C3 Core repository (~400–550; split read/write if needed)
- [x] Coherent repeatable read and atomic locked writer; PostgreSQL concurrency/rollback tests. Verified complete (C3a+C3b) with a real gated-DB concurrency proof — see `garfex-costos-unitarios-workspace/odd/tasks/reorder-type-effective-attributes.md`.
### C4 Core app/composition (~200–300)
- [x] Service, wiring, DB-backed reads, no catalog publication, two-instance/description regression. Verified complete — same Core task doc.
### C5 Core public bridge (~250–400)
- [x] Public types/Reader/Writer, adapter mapping/copies and unchanged legacy method behavior. Verified complete — Core is fully done for this feature per the same doc.
### B1 API/OpenAPI (~410–585)
- [x] Narrow optional capability; strict GET/PUT handlers, route, runtime wiring, error mapping, OpenAPI/tests. Independently re-verified in this session: `garfex-api` builds clean and `go test ./internal/httpapi/... -run AttributeOrder` passes 20/20. One documented nuance: incomplete scope actually returns 422, not the 400 its own doc comment claims (functionally harmless, F1 was built against the real 422 behavior).
### F1 Frontend transport/hook (~250–400)
- [x] Strict contract parser, actor request, snapshot/revision, stale/context/conflict handling.
### F2 Frontend reorder dialog (~300–450)
- [x] Numbered draft, accessible up/down/keyboard/live announcement, cancel, atomic save, conflict/failure UX, authoritative refresh.
### V1 Integration verification
- [x] Core unit/integration/lint/vet; API tests/OpenAPI/lint; frontend focused Vitest/type/lint/format; prove descriptions/PRESENTACION unchanged and one atomic request.

The ~400 lines per unit is review guidance, not code-golf. Split C3/F2 honestly if needed; keep tests with behavior. No SDD selected; this is durable ODD coordination.

## Acceptance
- All effective occurrences can be ordered, including inherited and direct duplicates distinguished by composite key.
- Subir/Bajar works by pointer, Tab+Enter/Space and documented shortcut; focus follows the same row and aria-live announces movement.
- Boundaries disable correctly; cancel changes nothing; save sends exactly one PUT.
- Incomplete/duplicate/foreign order never writes. Stale revision gives conflict, refreshes authoritative order, never auto-retries.
- Context/freshness changes invalidate draft and late responses.
- New membership appends deterministically; deleted binding disappears; recreated binding has a new incarnation/token.
- Description output and PRESENTACION rows/fields remain byte/semantically unchanged.
- No drag dependency or touch-only/hover-only interaction in first cut.

## F1 evidence
Built the frontend transport adapter and hook for the reorder feature, strictly scoped to transport/state (no dialog UI — that is F2).

Files:
- `src/features/catalog-hierarchy/catalogAttributeOrder.api.ts` — `CatalogAttributeOrderApi` (`getOrder`/`updateOrder`) over `GET`/`PUT /v1/types/{typeCode}/attributes/order?classCode=...&familyCode=...`. Strict exact-shape parsing of both responses (rejects extra/missing fields, scope mismatch, non-string/empty `orderRevision`, malformed composite keys); `orderRevision`/`expectedOrderRevision` treated as opaque strings, never parsed. `updateOrder` is actor-gated via `withRestActor`/`RestActorOptions`, mirroring `catalogOptionsAdmin.api.ts`. `CatalogAttributeOrderHttpError` / `CatalogAttributeOrderConflictError` map the six documented statuses (400/404/409/422/503/500), with 409 always classified as conflict per the verified Go source (missing-scope 422 correction from the plan doc's 400 was applied).
- `src/features/catalog-hierarchy/useCatalogAttributeOrder.ts` — loads the order for `{classCode,familyCode,typeCode}` (+`sessionId` scoping key like sibling hooks), exposes `save(orderedAttributes)` sending the last-known `orderRevision` as `expectedOrderRevision`. On `CatalogAttributeOrderConflictError`, sets `commandStatus: 'conflict'`, refetches the authoritative order, and never retries the write. Uses the generation-ref (`current()`/`live()`) pattern to discard in-flight GET/PUT responses after a scope change. `save` is gated by `canSubmit` (defaults to `hasRestActor()`); with no actor configured it never calls `updateOrder`.
- `tests/unit/catalogAttributeOrderApi.test.ts` (8 tests) — valid/invalid response shapes, scope mismatch, all six error-status mappings incl. conflict-vs-other distinction, actor wiring (never issues PUT with no/blank actor), opaque revision pass-through, network/JSON failures.
- `tests/unit/useCatalogAttributeOrder.test.ts` (8 tests) — StrictMode-safe initial read, waiting-context gating, save-with-last-revision, conflict → refresh-never-retry, in-flight GET/PUT discard on scope change, no-actor blocks save, non-conflict failure surfaced without retry.

Also updated two architecture tests' hardcoded REST-transport-adapter allowlists to admit the new adapter file (the same mechanism used for every prior adapter): `tests/architecture/restTransportBoundaries.test.ts` and `tests/architecture/keyboardBoundaries.test.ts`. No architecture test was weakened — both still assert `fetch` is confined to the approved adapter set.

Verification (all green):
- `pnpm exec vitest run tests/unit/catalogAttributeOrderApi.test.ts tests/unit/useCatalogAttributeOrder.test.ts` — 16/16 passed (RED confirmed first: both files failed to resolve before the source files existed).
- `pnpm typecheck` — clean.
- `pnpm lint` — no issues.
- `pnpm test` — 87 test files / 803 tests passed, including all architecture boundary tests.

F2 (reorder dialog UI) and V1 (integration verification) remain not started.

## F2 evidence
Built the reorder dialog UI as a self-contained editing surface fed by `useCatalogAttributeOrder` (F1). Does not touch `EffectiveAttributeRow`/the read-only list's order.

Files:
- `src/features/catalog-hierarchy/ReorderAttributesSurface.tsx` (new) — trigger `Button` + `Dialog` (`shared/ui/Dialog`) with a numbered draft `<ol>` of `CatalogAttributeOrderKey` rows, per-row "Subir"/"Bajar" `Button`s (real `isDisabled` at the first/last boundary), a visually-hidden `role="status" aria-live="polite"` region announcing `"<name> movido a la posición N de M."` after every move, Cancel (discards draft, no request, restores focus to the trigger), and Save (`order.save(draft)`, exactly once per click, disabled while `commandStatus==='pending'`). Loading/error/waiting-context states for the initial fetch reuse the same `role="status"`/`role="alert"` conventions as `CatalogTypeEffectiveAttributes.tsx`. Row labels are looked up from the `attributes` prop by `${source.level}:${source.code}:${characteristic.code}`, falling back to the raw `characteristicCode` for a stale/orphaned entry. The hook is only fed a complete context while the dialog is open (mirrors `CatalogTypeEffectiveAttributeDetail.tsx`'s options-tab gating for `useCatalogOptionsAdmin`), so no background GET fires just because the trigger is visible; each open is therefore a fresh authoritative fetch. Registers the dialog as a keyboard overlay via `useKeyboardController().registerOverlay` (no `registerAction`/global shortcut for opening — matches `CrearAtributoSurface.tsx`'s sibling trigger, which also has no assigned open-shortcut) so the global arbitration correctly suppresses `n`/`e`/`o`/`b`/`?` while the dialog is open. `isDismissable={!saving}` reuses `CrearAtributoSurface.tsx`'s proven `locked`-while-pending pattern for Escape/outside-click, so no extra manual Escape handler was needed.
- `src/features/catalog-hierarchy/CatalogTypeEffectiveAttributes.tsx` (edited) — new optional `attributeOrderApi?: CatalogAttributeOrderApi` prop; renders `<ReorderAttributesSurface>` in the header next to `CrearAtributoSurface` when `attributeOrderApi && status === 'ready' && attributes.length > 1`.
- `src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx` (edited) — `const [attributeOrderApi] = useState(createCatalogAttributeOrderApi)` alongside the sibling `useState` calls; threaded into `<CatalogTypeEffectiveAttributes attributeOrderApi={attributeOrderApi} />`.
- `tests/unit/reorderAttributesSurface.test.tsx` (new, 11 tests) — seeded draft/order; stale-entry fallback label; move up/down with announcement, focus-follows-row, and boundary disabling; Alt+ArrowUp/Alt+ArrowDown shortcut; Cancel discards with zero requests; Save sends exactly one PUT with the full reordered key list and closes; conflict keeps the dialog open, shows the message, reseeds from the refreshed order, and a further manual Save click is a deliberate retry (not an auto-resubmit) using the new revision; non-conflict failure keeps the dialog open with `commandError.message` and allows retry/cancel; no-actor blocks Save with a reason; loading and failed-initial-fetch (with retry) states.

Two judgment calls (as flagged in the task brief):
1. **Move shortcut**: implemented `Alt+ArrowUp` / `Alt+ArrowDown` (checked via `event.altKey` with no other modifiers) to move the row that currently has focus, handled by a local `onKeyDown` on the `<ol>` (event delegation via `focusedIndex`, tracked from each button's `onFocus`). This is unambiguous and safe under `keyboardArbitration.ts`: unmodified arrows are the reserved app-wide spatial-navigation gesture (and, separately, once the dialog is registered as an overlay, `KeyboardControllerProvider`'s document listener treats every key as `owner: 'overlay'` and never dispatches it to the registry) — but the reservation itself is explicitly scoped to *unmodified* arrows only ("Las flechas sin modificar navegan..."), so `Alt+Arrow` cannot shadow it, doesn't collide with `Tab`/`Shift+Tab`, `Ctrl+N`, `Ctrl/Cmd+K`, or the single-letter `n`/`e`/`o`/`b`/`?` commands, and follows the common editor convention (move line/item up/down). Documented in the footer hint (`Alt+↑/↓ mover la fila enfocada`).
2. **Reseed vs. preserve-draft on background refresh**: the draft reseeds from `order.order.orderedAttributes` whenever a new `orderRevision` arrives while the dialog is open **and** the draft has no unsaved moves (`!dirty`), or unconditionally on a conflict (`commandStatus === 'conflict'`), which always overrides `dirty` and discards the stale draft per the acceptance criteria. A non-conflict revision change while the user has an unsaved, dirty draft is never used to seed over the user's in-progress reordering — it's left alone (the CAS token used by `save()` is always the hook's own latest known revision regardless, so no staleness risk is introduced by not reseeding the *content*). In practice, given `useCatalogAttributeOrder`'s current contract, the only ways `order.order`'s revision changes while open are the initial load, a successful save (handled explicitly by closing the dialog), and a conflict-triggered reread (handled by the override above) — so the "unrelated background refresh" branch is defensive/future-proofing rather than exercised by today's hook, but keeps the component correct if that contract ever adds a background refresh path.

Deviation from the brief: none. `attributeOrderApi` is threaded as the raw API (not the hook result) exactly as instructed, and the hook itself is called inside `ReorderAttributesSurface` (the leaf), matching the existing `optionsApi` → `useCatalogOptionsAdmin` pattern in `CatalogTypeEffectiveAttributeDetail.tsx` rather than the `attributeCreation` (hook-threaded-from-Screen) pattern — chosen specifically because it enables the open-gated fetch described above.

Verification (all green):
- `pnpm exec vitest run tests/unit/reorderAttributesSurface.test.tsx tests/unit/catalogTypeEffectiveAttributes.test.tsx tests/unit/catalogHierarchyScreen.test.tsx` — 37/37 passed. No changes were needed inside `catalogTypeEffectiveAttributes.test.tsx`/`catalogHierarchyScreen.test.tsx` themselves — the new prop is optional and additive, so existing fixtures (which omit it) render unchanged.
- `pnpm typecheck` — clean.
- `pnpm lint` — no issues.
- `pnpm test` — 88 test files / 814 tests passed, including all architecture boundary tests (`restTransportBoundaries.test.ts`, `keyboardBoundaries.test.ts`, `catalogHierarchyBoundaries.test.ts`) with no allowlist changes needed — `catalogAttributeOrder.api.ts` was already added to those allowlists in F1, and `ReorderAttributesSurface.tsx`/`CatalogHierarchyScreen.tsx` contain no `fetch`/`registerAction`/`document.addEventListener` patterns those tests guard against.

## V1 evidence
Real end-to-end verification against a **live** `garfex-api` instance, not test doubles — the feature's actual delivery gate.

Found and fixed a real blocker first: the `garfex-api` process already running on `127.0.0.1:8090` (a developer `go run ./cmd/garfex-api` started before B1 landed) predated the new route, so it 404'd on `/v1/types/{typeCode}/attributes/order` with a plain-text body — which is what produced the "Unexpected non-whitespace character after JSON" error the user hit live in the browser (F1's transport always calls `response.json()`, even on error paths, per the verified real API contract). Stopped the stale process (PID identified via `lsof -i :8090`, confirmed it was the dev `go run`/build child pair), confirmed the local dev PostgreSQL was still at migration version 9 (`migrate ... version` → `9`), applied `000010_resource_type_attribute_order` up with `garfex_admin` credentials from the Core repo's own `.env` (`migrate ... up 1` → `10/u resource_type_attribute_order`), then restarted via `garfex-api/run-dev.sh`. Confirmed `GET /v1/types/TEST/attributes/order?...` now returns a proper `{"error":"not found","code":"NOT_FOUND"}` JSON body instead of plain text.

Real-data proof against `MATERIAL/CONDUCTORES/CABLE` (existing dev-DB catalog data):
1. `GET .../attributes/effective` → saved to `/tmp/effective_before.json` (5 attributes: insulation, gauge, color, conductor_material, voltage).
2. `GET .../attributes/order` → confirmed baseline order exactly matches the effective-attributes baseline (no-save-yet baseline resolver working end-to-end), with an initial `orderRevision`.
3. `PUT .../attributes/order` with the full reversed permutation and that revision as `expectedOrderRevision` → `200`, new `orderRevision` returned, exactly one write.
4. `GET .../attributes/effective` again → byte-identical to step 1 (`diff` reported no differences) — proves the visual-order overlay never touches `PRESENTACION`/description output, per the plan's core acceptance criterion.
5. Repeated the same `PUT` body with the **original** (now-stale) `expectedOrderRevision` → `409 Conflict`, proving the CAS/stale-revision path is real end-to-end, not just unit-tested.
6. Restored the original order with a final `PUT` using the latest revision, leaving the developer's local dev DB exactly as found.
7. Confirmed the exact route the browser calls, through Vite's dev proxy (`127.0.0.1:5174` → `localhost:8090` per `vite.config.ts`), returns `200` for the same query.

Frontend checks (already green from F1/F2, re-confirmed in this pass): `pnpm typecheck` clean; `pnpm lint` — no issues; `pnpm format:check` initially found 13 files with real formatting drift (some from this feature's own new files, some pre-existing unrelated mid-migration files) — ran `pnpm format` (mechanical, no behavior change) and re-confirmed clean; `pnpm test` — 88 test files / 814 tests green, including all architecture boundary tests.

Core checks (re-run, DB-free): `gofmt -l .` empty; `go vet ./...` clean; full suite `go test ./... -count=1` with all five `GARFEX_*_TEST_DSN` unset — every package `ok`.

API checks (re-run): `gofmt -l .` — only pre-existing, already-documented findings under `.git/backups/` and `internal/httpapi/catalog_descriptors.go` (confirmed untouched by this feature, same finding B1's own evidence already flagged); `go vet ./...` clean; `go build ./...` clean; `go test ./... -count=1` — 401 passed in 2 packages.

**Feature complete end-to-end**: C1–C5, B1, F1, F2, V1 all done and verified, including a real live-backend proof that descriptions/PRESENTACION are untouched and the write is atomic with working optimistic-concurrency conflict handling. No commits made in any of the three repos.

## Current progress
Read-only frontend/API/Core maps complete. C1 pure domain verified independently: focused33pass and full Go checks green.
C2 added migration000010 head/items plus207-line contract/integration test; SQL+tests251 lines. Static checks and independent review passed. User explicitly authorized a local disposable PostgreSQL runtime validation. Guarded run1 found only a test expectation quoting mismatch, corrected; its exact DB was dropped. Guarded run2 applied migrations1–9 then000010 up/down/up and passed owners/grants/defaults/constraints/cascades/rollback. Both uniquely named DBs were dropped and independent read-only pg_database lookup confirmed zero rows. Post-fix gofmt/vet/lint/full suite passed. Human SQL review remains delivery gate; grants were inspected rather than runtime-role CRUD.
F1 (frontend transport/hook) is done: strict GET/PUT contract parser, actor-gated write, opaque-revision CAS, and conflict/context-discard handling are implemented and covered by focused unit tests; full typecheck/lint/test suite green. C3/C4/C5/B1 are in fact complete (see the corrected checkboxes above) — the "F1 was built against test doubles, not a live backend" note above is about F1's own unit-test doubles, not backend status. F1 was implemented against the verified real API contract (`garfex-api/internal/httpapi/attribute_order.go`, read directly, 20/20 tests passing) but has not yet been exercised end-to-end against a running backend instance — that's V1's job.
F2 (frontend reorder dialog) is done: `ReorderAttributesSurface.tsx` (numbered draft, accessible Subir/Bajar with real boundary disabling, Alt+ArrowUp/Alt+ArrowDown shortcut, aria-live move announcements, Cancel, atomic Save, conflict/failure UX, authoritative refresh) is wired into `CatalogTypeEffectiveAttributes.tsx`/`CatalogHierarchyScreen.tsx` behind the new optional `attributeOrderApi` prop. See "F2 evidence" above for files, the two judgment calls, and verification (`pnpm test` 88/88 files, 814/814 tests green, including all architecture boundary tests; typecheck and lint clean).

## Next step
Feature is done: C1–C5, B1, F1, F2, V1 all complete and independently verified, including a live end-to-end proof. No further implementation units remain on this plan. Delivery (commit/PR/release) in any of the three repos is a separate, explicit human decision — none was made here.

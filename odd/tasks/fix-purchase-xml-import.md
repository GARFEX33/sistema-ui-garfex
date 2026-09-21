# Fix purchase XML import

## Goal

Make the purchase XML import accept the backend's documented response envelope and keep the existing UI callback contract.

## Scope

- `tests/unit/comprasApiMutations.test.ts`
- `src/features/compras/compras.api.ts`

## Tasks

- [x] Add a regression test for the real `{ purchase, lines, alreadyExisted }` response envelope.
- [x] Update the import response parser to validate the envelope and return the existing flattened `PurchaseImportResponse` contract.
- [x] Run focused verification and quality checks.
- [x] Diagnose the still-failing live environment.
- [x] Restart the stale local backend with the current purchase routes and verify the proxy contract.
- [x] Capture the real failed import from backend logs.
- [x] Apply the pending database migrations for backend v0.4.0 after explicit authorization, restart the API, and verify.

### TDD evidence

- RED: `pnpm test -- tests/unit/comprasApiMutations.test.ts` failed against the old parser (1 failing test).
- GREEN: `pnpm exec vitest run tests/unit/comprasApiMutations.test.ts` passed (11/11).
- TRIANGULATE: an imported line with an invalid `linkStatus` is rejected by the envelope parser.

### Verification

- `pnpm exec vitest run tests/unit/comprasApiMutations.test.ts tests/unit/importarCompraSurface.test.tsx` — PASS (23/23).
- `pnpm exec tsc -b --pretty false` — PASS.
- `pnpm exec eslint src/features/compras/compras.api.ts tests/unit/comprasApiMutations.test.ts --max-warnings 0` — PASS.
- `pnpm exec prettier --check src/features/compras/compras.api.ts tests/unit/comprasApiMutations.test.ts` — PASS.
- `git diff --check` — PASS.

## Evidence

- Root cause: `garfex-api/internal/httpapi/purchase_import.go` returns `{ purchase, lines, alreadyExisted }`, while the frontend parser expected purchase fields at the response root.
- Live incident: the backend process on `127.0.0.1:8090` started on 2026-09-18, before the current `garfex-api` purchase routes; its served OpenAPI had no purchase paths and `GET /v1/purchases` returned 404 instead of the current handler's 405.
- The current backend compiles with `GOWORK=off` against its declared `garfex-costos-unitarios v0.4.0`; the active sibling workspace currently has an incompatible in-progress API. The backend was restarted with `GOWORK=off`.
- Runtime verification: direct `:8090/v1/purchases` and the actual GARFEX Vite proxy on `:5174/v1/purchases` returned `405 Allow: POST`; live OpenAPI published the purchase import/read routes. Port `5173` belongs to an unrelated SvelteKit application, not GARFEX ERP.
- Real import evidence: five attempts reached the backend and returned `500 INTERNAL` with `purchase master operation failed`.
- Database evidence before repair: `schema_migrations` was at `10:false`; `purchases`, `purchase_lines`, and `supplier_products` did not exist. Backend v0.4.0 includes migrations 11 (purchase schema) and 12 (resource-code uniqueness). The missing migration 11 was the direct cause of the 500.
- Authorized repair: applied official v0.4.0 migrations 11 and 12 with `garfex_admin`; resulting state is `12:false` and all three purchase tables exist.
- Runtime repair: `garfex-api-dev.service` is active under the user systemd manager with `GOWORK=off`; direct `:8090` and GARFEX proxy `:5174` both advertise `Allow: POST` for `/v1/purchases`.
- Independent read-only verification passed. A real POST was intentionally not replayed because it may create domain records; the user can now retry the intended XML.
- Delivery: included in frontend implementation commit `5ee8027` on branch `feat/purchase-lines-workbench-ui`.

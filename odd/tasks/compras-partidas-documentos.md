# Compras: Partidas and Documentos perspectives

## Goal

Restructure the Compras landing screen around two top-level perspectives:

1. **Partidas** — a cross-document workbench for reviewing and resolving purchase lines.
2. **Documentos** — invoice/CFDI history and full purchase inspection.

Document inspection must remain available without being a mandatory step for line resolution.

## Product requirements

### Partidas

The workbench table must show:

- purchase date;
- invoice folio and/or CFDI reference;
- supplier;
- description;
- supplier SKU;
- SAT product code when useful;
- quantity and unit;
- unit price;
- amount;
- Resource Maestro;
- status.

Server-authoritative filters are required for:

- supplier;
- status;
- date range;
- invoice/CFDI reference;
- SKU;
- description.

Statuses are quick filters, not separate tabs. Each pending row exposes one explicit `Vincular` action. Linking happens in a resolution dialog without leaving the workbench.

### Manual resolution dialog

The dialog is the focused decision surface for one purchase line. It shows:

- supplier;
- invoice/folio and CFDI UUID;
- purchase date;
- description;
- supplier SKU;
- quantity and unit;
- unit price;
- amount.

It then provides the existing manual Resource Maestro search/selection flow and one explicit confirmation. After a successful link and authoritative reread, focus returns to the workbench and advances to the next unresolved line when available.

If no Resource Maestro exists, the dialog launches the normal Resource Master creation flow; Compras does not create a reduced or special resource. Successful creation returns the exact new Resource to the originating purchase line, keeps the posterior commercial SKU, selects the Resource, and refreshes the active Resource list before confirmation.

No suggestions, AI, inferred matching, automatic linking, or ranking are part of the current design. The durable interaction seam is manual: `see line → link → select or create Resource → confirm → next line`.

### Documentos

Documentos retains invoice/CFDI history and full purchase inspection. It is not the required path for resolving a line.

## Implemented frontend state

- `ComprasScreen` opens in Partidas and keeps Documentos as an optional supplier-scoped inspection perspective.
- `PartidasWorkbenchStage` renders the cross-document table, server-side filters, status shortcuts, pagination, and explicit pending-line actions.
- `CompraDetalleStage` is a read-only authoritative document inspection surface; line resolution stays in the Partidas workbench.
- `usePurchaseLineWorkbenchRestWindow` provides filter-keyed replacement pagination with abort and stale-result safety.
- The frontend does not aggregate suppliers, purchases, and lines client-side, avoiding incomplete pagination and unbounded N+1 requests.

## Frozen backend/API contract

The Partidas workbench uses the paginated cross-document contract published by `garfex-api` commit `c38eba6`.

### Required row fields

- `lineId`
- `purchaseId`
- `issuedAt`
- `series`
- `folio`
- `cfdiUuid`
- `supplierId`
- `supplierDisplayName`
- `description`
- `supplierSku`
- `satProductCode`
- `quantity`
- `unitCode`
- `unit`
- `unitPrice`
- `amount`
- `currency`
- `supplierProductId` (nullable)
- `resourceId` (nullable)
- Resource Maestro display identity/name (nullable)
- authoritative/effective line status
- status cause when the backend distinguishes effective from stored status

### Required query capabilities

- supplier filter;
- status filter;
- date-from/date-to filters;
- invoice/CFDI text filter;
- SKU filter;
- description filter;
- bounded pagination (`limit`/`offset` with `hasPrevious`/`hasNext`, or an equivalent cursor contract);
- deterministic ordering, preferably newest purchase date first with a stable tie-breaker.

### Coordinated contract decision

The backend owner completed a read-only review and proposed:

- `GET /v1/purchase-lines` with `limit`, `offset`, `supplierId`, `status`, `dateFrom`, `dateTo`, `invoice`, `supplierSku`, and `description`;
- response `{ lines, hasPrevious, hasNext }` ordered by `issuedAt DESC, lineId DESC`;
- `status` filters `effectiveStatus`, including `SUSPENDIDO`;
- each row returns stored `resolutionOverride`, derived `effectiveStatus`, `effectiveCause`, `supplierProductId`, nullable mapping/resource fields, `mappingRevision`, and human-readable supplier/resource display names;
- `cfdiUuid` is the unique uppercase SAT document identity; series/folio remain the human-facing document reference;
- supplier display falls back `tradeName → legalName → tax identifier/id`;
- each row exposes `resourceIdentity` plus `resourceDisplayName`; Core resolves them set-based from the existing Resource with fallback `display_name → identity_key`, without a new column or N+1. This is not the enriched Describe contract. UI renders `resourceDisplayName` as primary and `resourceIdentity` only as metadata/fallback;
- after link/unlink/override mutations, the frontend rereads the same filtered page rather than patching one row because one SupplierProduct mapping may affect multiple lines.

### Line-based linking decision

The user chose to make every pending line linkable through an explicit line-based backend mutation rather than leaving nullable-identity rows blocked.

The corrected backend-owned facade is `POST /v1/purchase-lines/{lineId}/resolve`. The UI action remains labeled `Vincular`, but `resolve` avoids implying a second `PurchaseLine → Resource` authority.

- `PurchaseLine.supplierSku` is immutable evidence from the XML and remains empty when the XML had no SKU.
- The workbench row distinguishes `supplierSku` (XML evidence) from nullable `commercialSupplierSku` (the associated SupplierProduct identity).
- The request always requires `actor` and `resourceId`, plus optimistic snapshot fields `expectedSupplierProductId` and `expectedMappingRevision`.
- For an existing SupplierProduct, the request omits `commercialSupplierSku` and confirms the existing mapping without silently reidentifying it.
- For `supplierProductId: null`, the operator may supply a real, stable, nonblank `commercialSupplierSku` as posterior knowledge. The backend derives the supplier from the purchase, creates or reuses `(supplierId, commercialSupplierSku)`, associates the line to that SupplierProduct, and confirms its mapping atomically.
- If no stable commercial identity exists, the mutation is not called and the line remains `PENDIENTE`; direct line-to-Resource resolution is a separate future use case.
- The HTTP handler delegates one transactional Purchase Core command such as `ResolvePurchaseLine`; it must reuse `SupplierProduct.ConfirmMapping` and its audit semantics rather than duplicating mapping rules or directly writing mapping columns.
- The only Resource authority remains `SupplierProduct.CurrentMapping`; PurchaseLine stores only `supplier_product_id`.
- Explicit 404/422/409 codes cover missing/inactive resources, required or forbidden commercial SKU, stale line/mapping state, target conflicts, and integrity contradictions.
- `/resolve` accepts only `resolutionOverride: NONE` with `effectiveStatus: PENDIENTE`; any other observed state returns 409 without mutation. Clearing an override and resolving are two explicit operations: frontend clears override, rereads authoritatively, and only then offers/calls resolve.
- For a line without SupplierProduct, expected id/revision are null; Core locks any SupplierProduct found by `commercialSupplierSku` and uses its current revision internally.
- After success, conflict, timeout, or ambiguous commit, the frontend rereads authoritatively and never retries blindly.

This mutation is frozen in the backend-owned OpenAPI contract. The frontend consumes it without modifying or operating backend code, services, migrations, or databases.

### Legacy endpoint replacement decision

The new Core removed the legacy commands behind `/supplier-products/{id}/link`, `/supplier-products/{id}/unlink`, and `/purchase-lines/{id}/link-status`. Product chose a clean replacement rather than adapting those paths with hidden new semantics.

- Backend/Core must publish the complete new endpoint set for line resolution, mapping confirm/correction, mapping retirement, and valid line overrides, with explicit revisions/preconditions and errors.
- Core publishes the safe resolution-override slice with append-only audit (`actor`, `reason`, server-owned origin/timestamp), optimistic `resolutionRevision`, and explicit stale machine codes. Each workbench row returns the revision, and both override and `/resolve` require it.
- OpenAPI must identify the legacy paths as retired/replaced; no silent compatibility adapters.
- Cutover is coordinated: new contracts and tests become ready first, frontend migrates every consumer second, and only then is legacy removal complete.
- Deployment must avoid a window where new Core/API is incompatible while the current frontend still calls legacy endpoints.

## Immediate frontend slice: readable Resource presentation

The link dialog currently renders `Resource.identityV1`, an internal wire-format identity, as the selectable label. Presentation belongs to the UI: reuse the existing canonical resource-presentation resolver and show a human-readable name as the primary label, with only useful stable metadata as secondary context. Do not add or request a persisted database presentation column for this fix.

### Immediate-slice tasks

- [x] Add regression coverage proving the link dialog does not expose raw `identityV1` as the primary presentation.
- [x] Reuse the existing resource presentation-name contract in `VincularPartidaSurface`.
- [x] Run focused and structural verification.

Verification: the modal/detail/screen matrix passed 57/57; TypeScript, targeted ESLint, targeted Prettier, and `git diff --check` passed. Ready/loading/error presentations retain useful unit/ID metadata without exposing raw `identityV1`.

## Tasks

- [x] Map the existing frontend workflow, reusable actions, tests, and API boundaries.
- [x] Document the minimum backend/API contract required by the Partidas workbench.
- [x] Obtain coordinator/backend-owner confirmation of the read contract proposal.
- [x] Resolve the product decision for pending lines with nullable `supplierProductId`.
- [x] After contract confirmation, plan the frontend implementation slices and review workload.
- [x] Backend-owned slice: publish the cross-line read, line resolve, mapping and override contracts. Integration target: `garfex-api` branch `feat/purchase-lines-workbench-api`, behavior commit `c38eba6`, authoritative `internal/httpapi/openapi.yaml`.
- [x] Frontend slice 1A: add exact strict types/Zod schemas plus GET workbench and all replacement mutation adapters; remove legacy adapter methods after consumers migrate.
- [x] Frontend slice 1B: add a filter-keyed, abort-safe, replacement-paginated Partidas window and focused tests.
- [x] Frontend slice 2A: build the Partidas toolbar, quick status filters, responsive table, row document context, Resource presentation, and explicit actions against injected data.
- [x] Frontend slice 2B: replace the supplier-first landing with Partidas by default while retaining Documentos as optional inspection, import feedback, and authoritative refresh.
- [x] Frontend slice 3A: adapt the manual resolution dialog to full workbench-line context and `/resolve`, including required posterior commercial SKU only when identity is absent.
- [x] Frontend slice 3B: migrate mapping retire/correct/conflict and audited resolution override consumers; remove all legacy API calls after tests prove no consumer remains.
- [x] Frontend slice 3C: implement authoritative reread, ambiguous/stale handling, and focus/advance to the next unresolved line.
- [x] Frontend slice 4: reuse the normal Resource Master create-and-return flow and select the exact created Resource.
- [x] Verify accessibility, responsive table behavior, keyboard/focus continuity, error/reread semantics, architecture guards, full quality gates, and independent review.

Final verification: 113/113 test files and 986/986 tests passed; TypeScript, ESLint, Prettier, production build, architecture boundaries, retired-endpoint grep, independent verification, and `git diff --check` passed.

## Delivery evidence

- Branch: `feat/purchase-lines-workbench-ui`
- Implementation commit: `5ee8027` (`feat(compras): add purchase line workbench`)
- Runtime harness: `pnpm build` passed; the browser-facing behavior is covered by the complete unit/integration suite because no live backend mutation was safe to replay as part of delivery.
- Rollback boundary: revert `5ee8027` to remove the frontend workbench/API migration without modifying backend repositories or data.

## Scope boundary

This frontend task may inspect backend contracts read-only but must not edit backend repositories, apply migrations, operate backend services, or modify backend databases. Backend work must be owned by the coordinator/backend maintainer.

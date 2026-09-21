# Compras: operational Partidas workbench redesign

## Goal

Turn Compras > Partidas into a mature low-fatigue operational workbench: select an eligible purchase line and open its Recurso Maestro resolution directly, scan dense purchase information quickly, and keep filters, results, and pagination inside the available browser viewport.

## Interaction decision

- A pending row with `resolutionOverride: NONE` is directly actionable.
- Clicking the row outside an embedded control opens `ResolverPartidaSurface`.
- Keyboard focus plus Enter or Space opens the same resolver.
- A visible `Vincular` control remains near the start of the row as a discoverable explicit action.
- The document reference remains a separate secondary action and must not also open the resolver.
- The table is a bounded scroll region so twenty results do not stretch the whole page; vertical and horizontal scrolling stay inside it.
- The header and first action column remain visible while scrolling, keeping `Vincular a Recurso Maestro` available in the initial viewport.
- Non-eligible rows remain inspection-only and do not pretend to be selectable.

## Visual review findings

The 1440×900 rendered screen showed excessive border repetition, a form-like six-field filter block, large competing status buttons, document references styled like inputs, a dominant repeated yellow row action, and a table whose fixed `max-h-96` did not adapt to the viewport. The horizontal scrollbar and pagination were not part of a coherent DataGrid footer.

## Design direction

- Keep GARFEX neutral surfaces and typography; use red for disciplined action hierarchy and yellow only for the selected perspective/status accent.
- Collapse secondary filters behind a compact disclosure while keeping supplier, invoice/reference, description, and status immediately scannable.
- Present statuses as compact segmented chips, not full-size outline buttons.
- Use a quiet compact row action plus direct row activation; render document, UUID, Resource, and status as read-only information rather than controls.
- Build a viewport-filling flex chain from the Compras shell to the DataGrid, with one internal two-axis table scroll region, sticky header/first action column, and pagination outside that scroll.
- Truncate long descriptions visually; the resolver/document inspection remain full-detail paths and accessible labels preserve complete text.
- Show an honest visible-range summary from offset and current page size; do not invent a total absent from the API.

## Tasks

- [x] Complete direct mouse and keyboard activation for eligible rows.
- [x] Redesign filter hierarchy, compact status segmentation, row action hierarchy, document presentation, and DataGrid density.
- [x] Implement the dynamic viewport flex chain without rigid heights or arbitrary viewport calculations.
- [x] Keep the table header/action column persistent and pagination visible outside the internal scroll region.
- [x] Add visible-range pagination context and accessible long-text handling.
- [x] Update unit, architecture/layout, and Playwright coverage.
- [x] Capture before/after visual evidence and run full independent verification.
- [ ] Create the local work-unit commit and record its identity.

## Verification evidence

- Visual review captured the original and redesigned 1440×900 screens.
- Runtime geometry at 1440×720, 900, and 1080 proved document height equals viewport height while the table region grows from 138px to 498px and owns both overflow axes.
- With 40 mocked rows and advanced filters expanded at 1440×900: table client/scroll size `1130×218 / 1531×3113`; vertical/horizontal scroll reached `180/180`; sticky header/action deltas remained `0`; pagination remained visible at viewport coordinate 859.
- `pnpm test` — PASS, 113 files / 999 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and `git diff --check` — PASS.
- `pnpm exec playwright test tests/e2e/compras.spec.ts` — PASS, 2/2.
- Axe on `/compras` — PASS, 0 violations.
- The unrelated full Playwright baseline remains red; representative failures reproduced identically from clean HEAD and are not candidate-caused.

## Scope boundary

Frontend only. No backend, Core, database, migration, or API-contract changes.

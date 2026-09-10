# Pre-proposal state — keyboard-first-resource-creation

## Status

Product decisions are confirmed. `sdd-proposal` may start with this handoff and must not reopen the interview.

## Confirmed interaction contract

- Use a staged terminal-like selector: Class → Family → Type → Natural Unit → attributes one-by-one → review/create.
- Up/Down moves, Enter selects and advances, Left returns, typing filters, Escape closes.
- Inherit the deepest valid Resources Master hierarchy context, skip completed stages, and allow changing inherited selections through the breadcrumb.
- Each hierarchy mini-search filters by display name only among the pages already loaded. Pagination remains explicit; the UI must not imply a backend-wide search.
- Changes made inside the dialog remain isolated from the Resources Master screen selection.
- Attributes are traversed one by one. Required attributes block advancement when empty; optional attributes expose an explicit `Omitir` action.
- Preserve backend authority, payload semantics, active-query-only refresh, Dialog focus restoration, local React Aria keyboard handling, shared GARFEX components, and Light tokens.
- Types currently works; Type/API semantics are not a defect in this change.
- No Catalog, dependency, global state, URL, Pi/Gentle, remote, PR, or release changes.

## Natural Unit decision

The backend contract is available at `api.catalogoAdmin.unidades`:

- `listarPoliticasUnidad` selects the effective units valid for the chosen Type.
- `obtenerUnidad({ unidadId })` hydrates each eligible unit with `clave`, `nombre`, optional `simbolo`, lifecycle state, revision, and effective state.
- `listarUnidades` is a paginated table-wide query, but it must not replace Type policy filtering in this creation flow because doing so could offer an active unit that is invalid for the selected Type.

Therefore Natural Unit is an explicit keyboard stage backed by effective Type policies plus `obtenerUnidad`. It shows only eligible/effective units and preserves the current required `unidadId` payload. The UI may auto-position the principal/selected eligible unit as the active candidate, but Enter still confirms the visible choice before advancing.

## Research

External research is unselected. The decision is product-specific, repository evidence and the supplied backend contracts are sufficient, and this runtime declares no external evidence grants.

## Proposal gate

Ready. Product decisions are confirmed and evidence references are repository-local or user-supplied backend contracts.

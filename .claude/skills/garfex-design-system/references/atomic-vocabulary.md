# Atomic Design vocabulary, styling architecture, and component contracts

Use this as shared vocabulary and as the contract new shared components must satisfy. Do not implement the full taxonomy speculatively — build a piece only when a real repetition or a real screen needs it, per the skill's Decision Gates.

## Styling architecture chain

```
GARFEX Design System
        ↓
Design Tokens (src/shared/design-system/tokens.css)
        ↓
Tailwind Theme / CSS Variables
        ↓
Shared UI Components (src/shared/ui/)
        ↓
Shared Patterns (page-level compositions)
        ↓
Features (src/features/*)
```

A feature should not know hex values or repeat a large Tailwind class block — it composes shared components and, at most, layout-only utility classes.

## Atomic Design vocabulary

- **Atoms**: Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Label, Badge, Tag, Tooltip, Spinner, Divider, Icon.
- **Molecules**: SearchField, FormField, FilterField, PaginationControls, StatusBadge, ActionMenu, ConfirmAction, TableCellActions.
- **Organisms**: PageHeader, DataToolbar, DataTable, FilterBar, EmptyState, ErrorState, LoadingState, FormSection, DetailSection.
- **Patterns**: MasterDataPage, ListPage, FormPage, DetailPage, SettingsPage.

Not every piece here exists under `src/shared/ui/` yet — see `docs/design-system.md` for the current list. Building this taxonomy out is a separate, later implementation effort; this file only fixes the naming so future work doesn't reinvent it under different names.

## Button contract (reference shape for the future shared component)

```tsx
<Button variant="primary" size="md">Guardar</Button>
```

- Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `accent`.
- Sizes: `sm`, `md`, `lg`.
- The component itself owns height, padding, radius, typography, icon spacing, hover, active, focus, disabled, and loading — never re-derived per feature. No feature defines its own `<button className="...">` chrome.
- Same philosophy applies to inputs, selects, tables, pagination, dialogs, badges, tooltips, empty states, and loaders once each is built.

## Scope rule example (component vs. logic)

A UI component and the logic behind it can have different scopes even when they look related:

- `PaginationControls` (the buttons/page-indicator UI) → shared, once 2+ features need it.
- The pagination **state controller** (e.g. `resources-master`'s list-pagination hook) → stays local to its feature as long as its rules (not just its shape) are feature-specific. Don't merge it into shared just because it resembles another feature's controller.

## Token categories to centralize progressively

Extract a new token only when a real repetition or design intent appears — never all at once speculatively:

`colors`, `typography`, `spacing`, `radius`, `borders`, `shadows`, `z-index`, `breakpoints`, `motion`, `component sizes`.

See `docs/design-system.md` for the exact current list and mode support.

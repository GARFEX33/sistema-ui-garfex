// Human-readable success copy built from the resolved Tipo name — never
// from `Resource.identityV1`, which is an internal wire-format string
// (e.g. `v1|8:MATERIAL...`) never meant for display. Shared between
// ResourceCreationReview's own inline success branch and
// CrearRecursoSurface's onSuccess/toast message so both stay in sync.
// Kept in its own module (rather than alongside the component) so
// react-refresh/only-export-components stays satisfied.
export const buildResourceCreatedMessage = (typeName: string): string =>
  `Recurso de tipo "${typeName}" creado.`

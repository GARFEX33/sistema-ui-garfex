export type StagedSelectorItem = Readonly<{
  key: string
  displayName: string
}>

export const normalizeStagedSelectorQuery = (query: string) =>
  query.trim().toLocaleLowerCase('es')

export const deriveVisibleStagedSelectorItems = <T extends StagedSelectorItem>(
  loadedItems: readonly T[],
  query: string,
): T[] => {
  const normalizedQuery = normalizeStagedSelectorQuery(query)
  if (!normalizedQuery) return [...loadedItems]

  return loadedItems.filter((item) =>
    item.displayName.toLocaleLowerCase('es').includes(normalizedQuery),
  )
}

export type StagedSelectorKeyEvent = Pick<
  KeyboardEvent,
  'altKey' | 'ctrlKey' | 'getModifierState' | 'isComposing' | 'key' | 'metaKey'
>

export const isPrintableStagedSelectorKey = (
  event: StagedSelectorKeyEvent,
): boolean =>
  event.key.length === 1 &&
  !event.isComposing &&
  !event.metaKey &&
  (event.getModifierState('AltGraph') || (!event.ctrlKey && !event.altKey))

export const repairCandidateKey = <T extends StagedSelectorItem>(
  visibleItems: readonly T[],
  activeKey: string | null,
  preferredActiveKey: string | null,
): string | null => {
  if (visibleItems.some((item) => item.key === activeKey)) return activeKey
  if (visibleItems.some((item) => item.key === preferredActiveKey))
    return preferredActiveKey
  return visibleItems[0]?.key ?? null
}

export const repairProvisionalActiveKey = repairCandidateKey

// Approximate visual budget for one StagedSearchSelector row (the `px-3
// py-1.5 text-sm` ListBoxItem plus its 1px border — Slice E3 tightened this
// from `py-2` for a denser command-palette feel, which only shrinks each
// row, so the row counts below still comfortably fit) together with the
// `gap-1` spacing ListBox puts between items. Command-palette mode only needs
// "roughly N rows, then scroll" — not pixel-perfect precision — so instead
// of computing an arbitrary `h-[...]` value (which Tailwind's static
// scanner also can't pick up from a runtime-built string), this maps each
// supported row count to the closest *standard*, statically-written
// Tailwind height utility. Fixed (`h-*`), not capped (`max-h-*`): several
// bounded columns are meant to render side by side (e.g. Clase/Familia/Tipo
// in ResourcesMasterScreen) and must stay the same height regardless of how
// many results each one currently has, or they visually desync.
const BOUNDED_HEIGHT_CLASS_BY_ROWS: Readonly<Record<number, string>> = {
  1: 'h-10',
  2: 'h-20',
  3: 'h-32',
  4: 'h-44',
  5: 'h-52',
  6: 'h-64',
  7: 'h-72',
  8: 'h-80',
}

const MIN_BOUNDED_ROWS = 1
const MAX_BOUNDED_ROWS = 8

export const stagedSelectorBoundedHeightClass = (
  maxVisibleRows: number,
): string => {
  const rows = Math.min(
    MAX_BOUNDED_ROWS,
    Math.max(MIN_BOUNDED_ROWS, Math.round(maxVisibleRows)),
  )
  return BOUNDED_HEIGHT_CLASS_BY_ROWS[rows]!
}

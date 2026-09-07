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

export interface KeyboardArbitrationContext {
  overlayOpen?: boolean
  featureConsumed?: boolean
}

export function shouldOpenGlobalCommand(
  event: KeyboardEvent,
  context: KeyboardArbitrationContext = {},
): boolean {
  if (
    event.isComposing ||
    event.keyCode === 229 ||
    isEditableTarget(event.target)
  )
    return false
  if (event.defaultPrevented || context.overlayOpen || context.featureConsumed)
    return false

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
  const hasExactPlatformModifier = isMac
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey
  const hasUnsupportedModifier = event.altKey || event.shiftKey
  if (
    event.key.toLowerCase() !== 'k' ||
    !hasExactPlatformModifier ||
    hasUnsupportedModifier
  )
    return false

  event.preventDefault()
  return true
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (
    target.matches(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]',
    )
  )
    return true
  return (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]',
    ) !== null
  )
}

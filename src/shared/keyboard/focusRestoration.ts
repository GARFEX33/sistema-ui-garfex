type FocusCandidate = () => HTMLElement | null

export function isValidFocusCandidate(element: HTMLElement | null) {
  if (!element || !element.isConnected || element.hidden || element.inert)
    return false
  if (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true'
  )
    return false
  const style = getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

export function restoreFocusNextFrame(
  opener: HTMLElement | null,
  fallbacks: readonly FocusCandidate[] = [],
) {
  const restore = () => {
    const target = [() => opener, ...fallbacks]
      .map((candidate) => candidate())
      .find(isValidFocusCandidate)
    target?.focus({ preventScroll: true })
  }
  restore()
  if (typeof window.requestAnimationFrame === 'function')
    window.requestAnimationFrame(restore)
  else window.setTimeout(restore, 0)
}

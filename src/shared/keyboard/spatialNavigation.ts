export type SpatialDirection = 'up' | 'down' | 'left' | 'right'
export interface SpatialRect {
  left: number
  top: number
  right: number
  bottom: number
}
export interface SpatialCandidate {
  id: string
  rect: SpatialRect
}
export interface SpatialResult {
  id: string
  score: number
}
type Scored = SpatialResult & {
  primary: number
  perpendicular: number
  distance: number
}

export function scoreSpatialCandidates(
  origin: SpatialRect,
  candidates: readonly SpatialCandidate[],
  direction: SpatialDirection,
): SpatialResult | null {
  if (!valid(origin)) return null
  const counts = new Map<string, number>()
  candidates.forEach(({ id }) => counts.set(id, (counts.get(id) ?? 0) + 1))
  let best: Scored | null = null
  for (const item of candidates) {
    if (counts.get(item.id) !== 1 || !valid(item.rect)) continue
    const next = score(origin, item, direction)
    if (next && (!best || better(next, best))) best = next
  }
  return best && { id: best.id, score: best.score }
}
function score(
  origin: SpatialRect,
  item: SpatialCandidate,
  direction: SpatialDirection,
): Scored | null {
  const a = center(origin),
    b = center(item.rect),
    horizontal = direction === 'left' || direction === 'right'
  const forward = direction === 'right' || direction === 'down',
    primaryCenter = horizontal ? b.x : b.y,
    originCenter = horizontal ? a.x : a.y
  if (forward ? primaryCenter <= originCenter : primaryCenter >= originCenter)
    return null
  const primary =
    direction === 'right'
      ? Math.max(0, item.rect.left - origin.right)
      : direction === 'left'
        ? Math.max(0, origin.left - item.rect.right)
        : direction === 'down'
          ? Math.max(0, item.rect.top - origin.bottom)
          : Math.max(0, origin.top - item.rect.bottom)
  const first = horizontal
    ? [origin.top, origin.bottom]
    : [origin.left, origin.right]
  const second = horizontal
    ? [item.rect.top, item.rect.bottom]
    : [item.rect.left, item.rect.right]
  const perpendicular = Math.max(
    0,
    Math.max(first[0], second[0]) - Math.min(first[1], second[1]),
  )
  const offset = horizontal ? Math.abs(b.y - a.y) : Math.abs(b.x - a.x)
  const distance = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  return {
    id: item.id,
    score: primary + 2 * perpendicular + 0.25 * offset,
    primary,
    perpendicular,
    distance,
  }
}
function better(a: Scored, b: Scored): boolean {
  for (const [left, right] of [
    [a.score, b.score],
    [a.primary, b.primary],
    [a.perpendicular, b.perpendicular],
    [a.distance, b.distance],
  ])
    if (left !== right) return left < right
  return a.id < b.id
}
function center(rect: SpatialRect) {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 }
}
function valid(rect: SpatialRect) {
  return (
    [rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite) &&
    rect.right > rect.left &&
    rect.bottom > rect.top
  )
}

export type SpatialMeasure = (element: HTMLElement) => SpatialRect | null
export type SpatialFocusStatus = 'moved' | 'no-candidate' | 'focus-failed'
export interface SpatialFocusResult {
  status: SpatialFocusStatus
  id?: string
}
export interface FocusSpatialTargetOptions {
  origin: HTMLElement
  direction: SpatialDirection
  boundaryRoot: HTMLElement
  activeOverlayRoot?: HTMLElement | null
  candidates?: readonly HTMLElement[]
  candidateFilter?: (element: HTMLElement) => boolean
  onMoved?: (target: HTMLElement) => void
  measure?: SpatialMeasure
  viewport?: SpatialRect
}

const spatialId = (element: HTMLElement) =>
  element.getAttribute('data-spatial-id')?.trim() ?? ''
const contains = (root: HTMLElement, element: HTMLElement) =>
  root === element || root.contains(element)

function invalidAncestor(element: HTMLElement, boundary: HTMLElement) {
  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    if (
      current.hidden ||
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert') ||
      current.getAttribute('aria-disabled') === 'true'
    )
      return true
    if (current instanceof HTMLButtonElement && current.disabled) return true
    if (current.hasAttribute('disabled')) return true
    const style = getComputedStyle(current)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0'
    )
      return true
    if (current === boundary) break
  }
  return false
}

function operable(element: HTMLElement) {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  )
    return !element.disabled
  if (element instanceof HTMLAnchorElement) return element.hasAttribute('href')
  const role = element.getAttribute('role')
  return (
    role !== null &&
    [
      'button',
      'link',
      'checkbox',
      'radio',
      'switch',
      'tab',
      'menuitem',
      'option',
    ].includes(role) &&
    element.tabIndex >= 0
  )
}

function defaultMeasure(element: HTMLElement): SpatialRect | null {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  }
}

function eligible(
  element: HTMLElement,
  boundary: HTMLElement,
  viewport: SpatialRect,
  measure: SpatialMeasure,
  requireBoundary: boolean,
) {
  if (
    !(element instanceof HTMLElement) ||
    !element.isConnected ||
    element.ownerDocument !== boundary.ownerDocument
  )
    return null
  if (
    !spatialId(element) ||
    (requireBoundary && !contains(boundary, element)) ||
    invalidAncestor(element, boundary) ||
    !operable(element)
  )
    return null
  if (element.getClientRects().length === 0) return null
  const rect = measure(element)
  if (
    !rect ||
    !valid(rect) ||
    rect.right <= viewport.left ||
    rect.left >= viewport.right ||
    rect.bottom <= viewport.top ||
    rect.top >= viewport.bottom
  )
    return null
  return rect
}

export function focusSpatialTarget({
  origin,
  direction,
  boundaryRoot,
  activeOverlayRoot = null,
  candidates,
  candidateFilter,
  onMoved,
  measure = defaultMeasure,
  viewport,
}: FocusSpatialTargetOptions): SpatialFocusResult {
  const view = viewport ?? {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  }
  const originRect = eligible(origin, boundaryRoot, view, measure, false)
  if (
    !originRect ||
    (activeOverlayRoot && !contains(activeOverlayRoot, origin))
  )
    return { status: 'no-candidate' }
  const pool = (
    candidates ?? [
      ...(activeOverlayRoot ?? boundaryRoot).querySelectorAll<HTMLElement>(
        '[data-spatial-id]',
      ),
    ]
  ).filter((element) => !candidateFilter || candidateFilter(element))
  const counts = new Map<string, number>()
  for (const element of pool) {
    const id = spatialId(element)
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const validCandidates: SpatialCandidate[] = []
  const elements = new Map<string, HTMLElement>()
  const candidateBoundary = activeOverlayRoot ?? boundaryRoot
  for (const element of pool) {
    const id = spatialId(element)
    if (
      !id ||
      counts.get(id) !== 1 ||
      (activeOverlayRoot
        ? !contains(activeOverlayRoot, element)
        : !contains(boundaryRoot, element))
    )
      continue
    const rect = eligible(element, candidateBoundary, view, measure, true)
    if (rect) {
      validCandidates.push({ id, rect })
      elements.set(id, element)
    }
  }
  const selected = scoreSpatialCandidates(
    originRect,
    validCandidates,
    direction,
  )
  if (!selected) return { status: 'no-candidate' }
  const target = elements.get(selected.id)
  if (
    !target ||
    !eligible(origin, boundaryRoot, view, measure, false) ||
    (activeOverlayRoot && !contains(activeOverlayRoot, origin)) ||
    !eligible(target, candidateBoundary, view, measure, true)
  )
    return { status: 'focus-failed', id: selected.id }
  target.focus({ preventScroll: true })
  if (document.activeElement !== target)
    return { status: 'focus-failed', id: selected.id }
  onMoved?.(target)
  return { status: 'moved', id: selected.id }
}

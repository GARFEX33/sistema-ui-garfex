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
  for (const { id } of candidates) counts.set(id, (counts.get(id) ?? 0) + 1)

  let best: Scored | null = null
  for (const item of candidates) {
    if (counts.get(item.id) !== 1 || !valid(item.rect)) continue
    const scored = score(origin, item, direction)
    if (scored && (!best || better(scored, best))) best = scored
  }
  return best && { id: best.id, score: best.score }
}

function score(
  origin: SpatialRect,
  item: SpatialCandidate,
  direction: SpatialDirection,
): Scored | null {
  const a = center(origin)
  const b = center(item.rect)
  const horizontal = direction === 'left' || direction === 'right'
  const forward = direction === 'right' || direction === 'down'
  const primaryCenter = horizontal ? b.x : b.y
  const originCenter = horizontal ? a.x : a.y
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
  const originPerpendicular = horizontal
    ? [origin.top, origin.bottom]
    : [origin.left, origin.right]
  const candidatePerpendicular = horizontal
    ? [item.rect.top, item.rect.bottom]
    : [item.rect.left, item.rect.right]
  const perpendicular = Math.max(
    0,
    Math.max(originPerpendicular[0], candidatePerpendicular[0]) -
      Math.min(originPerpendicular[1], candidatePerpendicular[1]),
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
  ]) {
    if (left !== right) return left < right
  }
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

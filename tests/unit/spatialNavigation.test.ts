import { describe, expect, it, vi } from 'vitest'
import {
  focusSpatialTarget,
  scoreSpatialCandidates,
  type SpatialCandidate,
  type SpatialRect,
} from '../../src/shared/keyboard/spatialNavigation'
const origin: SpatialRect = { left: 0, top: 0, right: 10, bottom: 10 }
const candidate = (id: string, rect: SpatialRect): SpatialCandidate => ({
  id,
  rect,
})
describe('pure spatial navigation scorer', () => {
  it.each([
    ['up', 'above', { left: 2, top: -30, right: 8, bottom: -20 }],
    ['down', 'below', { left: 2, top: 20, right: 8, bottom: 30 }],
    ['left', 'left', { left: -30, top: 2, right: -20, bottom: 8 }],
    ['right', 'right', { left: 20, top: 2, right: 30, bottom: 8 }],
  ] as const)('selects the physical %s half-plane', (direction, id, rect) =>
    expect(
      scoreSpatialCandidates(origin, [candidate(id, rect)], direction),
    ).toMatchObject({ id }),
  )
  it('rejects the wrong half-plane and no candidate', () =>
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('same', { left: 2, top: 2, right: 8, bottom: 8 }),
          candidate('wrong', { left: -20, top: 2, right: -10, bottom: 8 }),
        ],
        'right',
      ),
    ).toBeNull())
  it('uses primary/perpendicular gaps and alignment weighting', () =>
    expect(
      scoreSpatialCandidates(
        origin,
        [candidate('measured', { left: 20, top: 15, right: 30, bottom: 25 })],
        'right',
      ),
    ).toEqual({ id: 'measured', score: 23.75 }))
  it('prefers aligned proximity over a distant perpendicular alternative', () =>
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('aligned', { left: 20, top: 2, right: 30, bottom: 8 }),
          candidate('diagonal', { left: 11, top: 100, right: 21, bottom: 110 }),
        ],
        'right',
      )?.id,
    ).toBe('aligned'))
  it('uses Euclidean and lexicographic stable-id ties, independent of order', () => {
    const equal = [
      candidate('z', { left: 20, top: -5, right: 30, bottom: 5 }),
      candidate('a', { left: 20, top: 5, right: 30, bottom: 15 }),
    ]
    expect(scoreSpatialCandidates(origin, equal, 'right')?.id).toBe('a')
    expect(
      scoreSpatialCandidates(origin, [...equal].reverse(), 'right')?.id,
    ).toBe('a')
  })
  it('chooses Euclidean distance before lexical id when scores tie', () => {
    const nearer = candidate('z', { left: 20, top: 0, right: 30, bottom: 10 })
    const farther = candidate('a', { left: 20, top: 0, right: 50, bottom: 10 })
    expect(scoreSpatialCandidates(origin, [farther, nearer], 'right')?.id).toBe(
      'z',
    )
  })
  it('allows overlapping directional rectangles and excludes duplicate ids', () => {
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('overlap', { left: 5, top: 2, right: 15, bottom: 8 }),
          candidate('far', { left: 30, top: 2, right: 40, bottom: 8 }),
        ],
        'right',
      )?.id,
    ).toBe('overlap')
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('dup', { left: 20, top: 0, right: 30, bottom: 10 }),
          candidate('dup', { left: 40, top: 0, right: 50, bottom: 10 }),
        ],
        'right',
      ),
    ).toBeNull()
  })
  it('ignores text, DOM-order proxies, array order, and RTL metadata', () => {
    const options = [
      {
        ...candidate('right', { left: 20, top: 0, right: 30, bottom: 10 }),
        text: 'zeta',
        domIndex: 9,
        dir: 'rtl',
      },
      {
        ...candidate('far', { left: 50, top: 0, right: 60, bottom: 10 }),
        text: 'alpha',
        domIndex: 0,
        dir: 'rtl',
      },
    ]
    expect(scoreSpatialCandidates(origin, options, 'right')).toEqual(
      scoreSpatialCandidates(origin, [...options].reverse(), 'right'),
    )
    expect(scoreSpatialCandidates(origin, options, 'right')?.id).toBe('right')
  })
  it('keeps right and left physical under RTL and repeats equal geometry deterministically', () => {
    const rtl = [
      {
        ...candidate('physical-left', {
          left: -30,
          top: 0,
          right: -20,
          bottom: 10,
        }),
        dir: 'rtl',
      },
      {
        ...candidate('physical-right', {
          left: 20,
          top: 0,
          right: 30,
          bottom: 10,
        }),
        dir: 'rtl',
      },
    ]
    expect(scoreSpatialCandidates(origin, rtl, 'right')?.id).toBe(
      'physical-right',
    )
    expect(scoreSpatialCandidates(origin, rtl, 'left')?.id).toBe(
      'physical-left',
    )
    const equal = [
      candidate('stable-b', { left: 20, top: 0, right: 30, bottom: 10 }),
      candidate('stable-a', { left: 20, top: 0, right: 30, bottom: 10 }),
    ]
    expect(
      Array.from(
        { length: 5 },
        () => scoreSpatialCandidates(origin, equal, 'right')?.id,
      ),
    ).toEqual(Array(5).fill('stable-a'))
  })
})

it('keeps DOM Left physical under RTL', () => {
  expect(
    scoreSpatialCandidates(
      origin,
      [candidate('left', { left: -20, top: 0, right: -10, bottom: 10 })],
      'left',
    )?.id,
  ).toBe('left')
})

describe('DOM spatial adapter', () => {
  const rects = new WeakMap<HTMLElement, SpatialRect>()
  const measure = (element: HTMLElement) => rects.get(element) ?? null
  const mount = (html: string) => {
    const boundary = document.createElement('main')
    boundary.innerHTML = html
    document.body.append(boundary)
    return boundary
  }
  const setRect = (element: HTMLElement, rect: SpatialRect) =>
    rects.set(element, rect)

  it('focuses only connected, opted-in, measurable controls in the boundary', () => {
    const boundary = mount(
      '<button data-spatial-id="near">Near</button><button data-spatial-id="far">Far</button>',
    )
    const [near, far] = [
      ...boundary.querySelectorAll('button'),
    ] as HTMLElement[]
    const origin = document.createElement('button')
    origin.dataset.spatialId = 'origin'
    boundary.prepend(origin)
    setRect(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    setRect(near, { left: 20, top: 0, right: 30, bottom: 10 })
    setRect(far, { left: 80, top: 0, right: 90, bottom: 10 })
    for (const element of [origin, near, far])
      vi.spyOn(element, 'getClientRects').mockReturnValue([
        element.getBoundingClientRect(),
      ])
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [far, near],
        measure,
      }),
    ).toEqual({ status: 'moved', id: 'near' })
    expect(document.activeElement).toBe(near)
  })

  it.each([
    ['hidden', '<button data-spatial-id="bad" hidden>Bad</button>'],
    [
      'aria-hidden',
      '<button data-spatial-id="bad" aria-hidden="true">Bad</button>',
    ],
    ['disabled', '<button data-spatial-id="bad" disabled>Bad</button>'],
    [
      'aria-disabled',
      '<button data-spatial-id="bad" aria-disabled="true">Bad</button>',
    ],
    ['inert', '<button data-spatial-id="bad" inert>Bad</button>'],
    ['decorative', '<span data-spatial-id="bad">Bad</span>'],
  ])('excludes %s candidates', (_name, markup) => {
    const boundary = mount(
      `<button data-spatial-id="origin">Origin</button>${markup}`,
    )
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const bad = boundary.querySelector('[data-spatial-id="bad"]') as HTMLElement
    setRect(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    setRect(bad, { left: 20, top: 0, right: 30, bottom: 10 })
    vi.spyOn(origin, 'getClientRects').mockReturnValue([
      origin.getBoundingClientRect(),
    ])
    vi.spyOn(bad, 'getClientRects').mockReturnValue([
      bad.getBoundingClientRect(),
    ])
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [bad],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
    expect(document.activeElement).not.toBe(bad)
  })

  it('rejects foreign-document candidates and inactive portaled candidates', () => {
    const boundary = mount('<button data-spatial-id="origin">Origin</button>')
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const foreignDocument =
      document.implementation.createHTMLDocument('foreign')
    const foreign = foreignDocument.createElement('button')
    foreign.dataset.spatialId = 'foreign'
    foreignDocument.body.append(foreign)
    const portal = document.createElement('button')
    portal.dataset.spatialId = 'portal'
    document.body.append(portal)
    setRect(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    setRect(foreign, { left: 20, top: 0, right: 30, bottom: 10 })
    setRect(portal, { left: 20, top: 0, right: 30, bottom: 10 })
    vi.spyOn(origin, 'getClientRects').mockReturnValue([{} as DOMRect])
    vi.spyOn(foreign, 'getClientRects').mockReturnValue([{} as DOMRect])
    vi.spyOn(portal, 'getClientRects').mockReturnValue([{} as DOMRect])
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [foreign, portal],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
  })

  it('excludes zero-area, disconnected, non-intersecting, and invalid ancestors', () => {
    const boundary = mount(
      '<div aria-hidden="true"><button data-spatial-id="ancestor">Ancestor</button></div><button data-spatial-id="zero">Zero</button><button data-spatial-id="outside">Outside</button>',
    )
    const origin = document.createElement('button')
    origin.dataset.spatialId = 'origin'
    boundary.prepend(origin)
    const ancestor = boundary.querySelector(
      '[data-spatial-id="ancestor"]',
    ) as HTMLElement
    const zero = boundary.querySelector(
      '[data-spatial-id="zero"]',
    ) as HTMLElement
    const outside = boundary.querySelector(
      '[data-spatial-id="outside"]',
    ) as HTMLElement
    const detached = document.createElement('button')
    detached.dataset.spatialId = 'detached'
    for (const element of [origin, ancestor, zero, outside, detached])
      vi.spyOn(element, 'getClientRects').mockReturnValue([
        { left: 0, top: 0, right: 10, bottom: 10 } as DOMRect,
      ])
    setRect(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    setRect(ancestor, { left: 20, top: 0, right: 30, bottom: 10 })
    setRect(zero, { left: 20, top: 0, right: 20, bottom: 10 })
    setRect(outside, { left: 200, top: 0, right: 210, bottom: 10 })
    setRect(detached, { left: 20, top: 0, right: 30, bottom: 10 })
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [ancestor, zero, outside, detached],
        measure,
        viewport: { left: 0, top: 0, right: 100, bottom: 100 },
      }),
    ).toEqual({ status: 'no-candidate' })
  })

  it('restricts candidates to an active portaled overlay and does not fall through after focus failure', () => {
    const boundary = mount(
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id="background">Background</button>',
    )
    const overlay = document.createElement('div')
    overlay.dataset.overlay = 'active'
    const target = document.createElement('button')
    target.dataset.spatialId = 'target'
    overlay.append(target)
    document.body.append(overlay)
    const fallback = document.createElement('button')
    fallback.dataset.spatialId = 'fallback'
    overlay.append(fallback)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const background = boundary.querySelector(
      '[data-spatial-id="background"]',
    ) as HTMLElement
    setRect(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    setRect(background, { left: 20, top: 0, right: 30, bottom: 10 })
    setRect(target, { left: 20, top: 0, right: 30, bottom: 10 })
    setRect(fallback, { left: 80, top: 0, right: 90, bottom: 10 })
    for (const element of [origin, background, target, fallback])
      vi.spyOn(element, 'getClientRects').mockReturnValue([
        { left: 0, top: 0, right: 10, bottom: 10 } as DOMRect,
      ])
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        activeOverlayRoot: overlay,
        candidates: [background, target],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
    const overlayOrigin = document.createElement('button')
    overlayOrigin.dataset.spatialId = 'overlay-origin'
    overlay.prepend(overlayOrigin)
    setRect(overlayOrigin, { left: 0, top: 0, right: 10, bottom: 10 })
    vi.spyOn(overlayOrigin, 'getClientRects').mockReturnValue([
      { left: 0, top: 0, right: 10, bottom: 10 } as DOMRect,
    ])
    const successfulFocus = vi.spyOn(target, 'focus')
    expect(
      focusSpatialTarget({
        origin: overlayOrigin,
        direction: 'right',
        boundaryRoot: boundary,
        activeOverlayRoot: overlay,
        candidates: [target],
        measure,
      }),
    ).toEqual({ status: 'moved', id: 'target' })
    expect(successfulFocus).toHaveBeenCalledWith({ preventScroll: true })
    successfulFocus.mockRestore()
    const focus = vi
      .spyOn(target, 'focus')
      .mockImplementation(() => target.remove())
    const fallbackFocus = vi.spyOn(fallback, 'focus')
    expect(
      focusSpatialTarget({
        origin: overlayOrigin,
        direction: 'right',
        boundaryRoot: boundary,
        activeOverlayRoot: overlay,
        candidates: [target, fallback],
        measure,
      }),
    ).toEqual({ status: 'focus-failed', id: 'target' })
    expect(focus).toHaveBeenCalledTimes(1)
    expect(fallbackFocus).not.toHaveBeenCalled()
  })
})

describe('DOM adapter triangulation', () => {
  const rect = (
    left: number,
    top = 0,
    right = left + 10,
    bottom = 10,
  ): SpatialRect => ({ left, top, right, bottom })
  const setup = (candidateMarkup: string) => {
    const boundary = document.createElement('main')
    boundary.innerHTML = `<button data-spatial-id="origin">Origin</button>${candidateMarkup}`
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const elements = [
      ...boundary.querySelectorAll<HTMLElement>('[data-spatial-id]'),
    ]
    const rects = new WeakMap<HTMLElement, SpatialRect>([[origin, rect(0)]])
    for (const element of elements.slice(1)) rects.set(element, rect(20))
    for (const element of elements)
      vi.spyOn(element, 'getClientRects').mockReturnValue([
        { left: 0, top: 0, right: 10, bottom: 10 } as DOMRect,
      ])
    return {
      boundary,
      origin,
      elements,
      measure: (element: HTMLElement) => rects.get(element) ?? null,
      rects,
    }
  }

  it('remeasures changed geometry and excludes empty client rects, duplicate ids, and hidden ancestors', () => {
    const { boundary, origin, elements, measure, rects } = setup(
      '<button data-spatial-id="duplicate">One</button><button data-spatial-id="duplicate">Two</button><button data-spatial-id="empty">Empty</button><div style="display: none"><button data-spatial-id="hidden-ancestor">Hidden</button></div><button data-spatial-id="moving">Moving</button>',
    )
    const empty = elements.find(
      (element) => element.dataset.spatialId === 'empty',
    )!
    const hidden = elements.find(
      (element) => element.dataset.spatialId === 'hidden-ancestor',
    )!
    const moving = elements.find(
      (element) => element.dataset.spatialId === 'moving',
    )!
    vi.spyOn(empty, 'getClientRects').mockReturnValue([])
    rects.set(moving, rect(80))
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: elements.slice(1),
        measure,
        viewport: { left: 0, top: 0, right: 40, bottom: 100 },
      }),
    ).toEqual({ status: 'no-candidate' })
    rects.set(moving, rect(20))
    const result = focusSpatialTarget({
      origin,
      direction: 'right',
      boundaryRoot: boundary,
      candidates: [moving],
      measure,
    })
    expect(result).toEqual({ status: 'moved', id: 'moving' })
    expect(document.activeElement).toBe(moving)
    expect(hidden).not.toHaveFocus()
  })

  it('revalidates a control that becomes enabled before the next request', () => {
    const { boundary, origin, elements, measure } = setup(
      '<button data-spatial-id="toggle" disabled>Toggle</button>',
    )
    const toggle = elements[1] as HTMLButtonElement
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [toggle],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
    toggle.disabled = false
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [toggle],
        measure,
      }),
    ).toEqual({ status: 'moved', id: 'toggle' })
  })
})

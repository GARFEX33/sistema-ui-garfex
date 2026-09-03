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

  it('rejects candidates in the wrong half-plane', () => {
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('same', { left: 2, top: 2, right: 8, bottom: 8 }),
          candidate('wrong', { left: -20, top: 2, right: -10, bottom: 8 }),
        ],
        'right',
      ),
    ).toBeNull()
  })

  it('returns primary gap + 2*perpendicular gap + .25*center offset', () => {
    expect(
      scoreSpatialCandidates(
        origin,
        [candidate('measured', { left: 20, top: 15, right: 30, bottom: 25 })],
        'right',
      ),
    ).toEqual({ id: 'measured', score: 23.75 })
  })

  it('prefers alignment and permits perpendicular overlap', () => {
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('aligned', { left: 20, top: 2, right: 30, bottom: 8 }),
          candidate('diagonal', { left: 11, top: 100, right: 21, bottom: 110 }),
        ],
        'right',
      )?.id,
    ).toBe('aligned')
    expect(
      scoreSpatialCandidates(
        origin,
        [candidate('overlap', { left: 5, top: 2, right: 15, bottom: 8 })],
        'right',
      )?.id,
    ).toBe('overlap')
  })

  it('rejects invalid origin and skips invalid or zero-area candidates', () => {
    const invalid = { left: 0, top: 0, right: Number.NaN, bottom: 10 }
    expect(
      scoreSpatialCandidates(
        invalid,
        [candidate('x', { left: 20, top: 0, right: 30, bottom: 10 })],
        'right',
      ),
    ).toBeNull()
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('nan', {
            left: 20,
            top: 0,
            right: Number.POSITIVE_INFINITY,
            bottom: 10,
          }),
          candidate('zero', { left: 20, top: 0, right: 20, bottom: 10 }),
          candidate('valid', { left: 30, top: 0, right: 40, bottom: 10 }),
        ],
        'right',
      )?.id,
    ).toBe('valid')
  })

  it('excludes every candidate with a duplicate id', () => {
    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('dup', { left: 20, top: 0, right: 30, bottom: 10 }),
          candidate('dup', { left: 40, top: 0, right: 50, bottom: 10 }),
          candidate('unique', { left: 60, top: 0, right: 70, bottom: 10 }),
        ],
        'right',
      )?.id,
    ).toBe('unique')
  })

  it('breaks ties by total, primary, perpendicular, distance, then id', () => {
    const equal = [
      candidate('z', { left: 20, top: -5, right: 30, bottom: 5 }),
      candidate('a', { left: 20, top: 5, right: 30, bottom: 15 }),
    ]
    expect(scoreSpatialCandidates(origin, equal, 'right')?.id).toBe('a')
    expect(
      scoreSpatialCandidates(origin, [...equal].reverse(), 'right')?.id,
    ).toBe('a')

    expect(
      scoreSpatialCandidates(
        origin,
        [
          candidate('a', { left: 20, top: 0, right: 50, bottom: 10 }),
          candidate('z', { left: 20, top: 0, right: 30, bottom: 10 }),
        ],
        'right',
      )?.id,
    ).toBe('z')
  })

  it('uses physical directions independently of RTL-like metadata and order', () => {
    const options = [
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
    expect(scoreSpatialCandidates(origin, options, 'right')?.id).toBe(
      'physical-right',
    )
    expect(
      scoreSpatialCandidates(origin, [...options].reverse(), 'left')?.id,
    ).toBe('physical-left')
  })
})

describe('DOM spatial adapter', () => {
  const rects = new WeakMap<HTMLElement, SpatialRect>()
  const measure = (element: HTMLElement) => rects.get(element) ?? null
  const prepare = (element: HTMLElement, rect: SpatialRect) => {
    rects.set(element, rect)
    vi.spyOn(element, 'getClientRects').mockReturnValue([{} as DOMRect])
  }

  it('focuses an eligible measured control and excludes non-operable targets', () => {
    const boundary = document.createElement('main')
    boundary.innerHTML =
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id="near">Near</button><span data-spatial-id="text">Text</span>'
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const near = boundary.querySelector(
      '[data-spatial-id="near"]',
    ) as HTMLElement
    const text = boundary.querySelector(
      '[data-spatial-id="text"]',
    ) as HTMLElement
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(near, { left: 20, top: 0, right: 30, bottom: 10 })
    prepare(text, { left: 11, top: 0, right: 12, bottom: 10 })
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [text, near],
        measure,
      }),
    ).toEqual({ status: 'moved', id: 'near' })
    const outsider = document.createElement('button')
    outsider.dataset.spatialId = 'outsider'
    document.body.append(outsider)
    prepare(outsider, { left: 0, top: 0, right: 10, bottom: 10 })
    expect(
      focusSpatialTarget({
        origin: outsider,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [near],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
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
  ])('excludes %s targets', (_name, markup) => {
    const boundary = document.createElement('main')
    boundary.innerHTML = `<button data-spatial-id="origin">Origin</button>${markup}`
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const bad = boundary.querySelector('[data-spatial-id="bad"]') as HTMLElement
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(bad, { left: 20, top: 0, right: 30, bottom: 10 })
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [bad],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
  })

  it('excludes duplicate, zero-area, disconnected, viewport-outside, and foreign targets', () => {
    const boundary = document.createElement('main')
    boundary.innerHTML =
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id="dup">One</button><button data-spatial-id="dup">Two</button><button data-spatial-id="zero">Zero</button><button data-spatial-id="outside">Outside</button>'
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const all = [...boundary.querySelectorAll<HTMLElement>('[data-spatial-id]')]
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    all
      .slice(1)
      .forEach((element) =>
        prepare(element, { left: 20, top: 0, right: 30, bottom: 10 }),
      )
    rects.set(all[3], { left: 20, top: 0, right: 20, bottom: 10 })
    rects.set(all[4], { left: 200, top: 0, right: 210, bottom: 10 })
    const detached = document.createElement('button')
    detached.dataset.spatialId = 'detached'
    prepare(detached, { left: 20, top: 0, right: 30, bottom: 10 })
    const foreignDocument = document.implementation.createHTMLDocument()
    const foreign = foreignDocument.createElement('button')
    foreign.dataset.spatialId = 'foreign'
    foreignDocument.body.append(foreign)
    prepare(foreign, { left: 20, top: 0, right: 30, bottom: 10 })
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [...all.slice(1), detached, foreign],
        measure,
        viewport: { left: 0, top: 0, right: 100, bottom: 100 },
      }),
    ).toEqual({ status: 'no-candidate' })
  })

  it('treats trimmed duplicate DOM ids and empty client geometry as ineligible', () => {
    const boundary = document.createElement('main')
    boundary.innerHTML =
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id=" duplicate ">One</button><button data-spatial-id="duplicate">Two</button><button data-spatial-id="empty">Empty</button><button data-spatial-id="valid">Valid</button>'
    document.body.append(boundary)
    const [origin, firstDuplicate, secondDuplicate, empty, valid] = [
      ...boundary.querySelectorAll<HTMLElement>('[data-spatial-id]'),
    ]
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(firstDuplicate, { left: 20, top: 0, right: 30, bottom: 10 })
    prepare(secondDuplicate, { left: 40, top: 0, right: 50, bottom: 10 })
    rects.set(empty, { left: 60, top: 0, right: 70, bottom: 10 })
    prepare(valid, { left: 80, top: 0, right: 90, bottom: 10 })

    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [firstDuplicate, secondDuplicate, empty, valid],
        measure,
      }),
    ).toEqual({ status: 'moved', id: 'valid' })
  })

  it.each([
    ['hidden', 'hidden'],
    ['aria-hidden', 'aria-hidden="true"'],
    ['inert', 'inert'],
  ])('excludes targets hidden by an ancestor (%s)', (_name, attribute) => {
    const boundary = document.createElement('main')
    boundary.innerHTML = `<button data-spatial-id="origin">Origin</button><div ${attribute}><button data-spatial-id="hidden-child">Hidden child</button></div>`
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const hiddenChild = boundary.querySelector(
      '[data-spatial-id="hidden-child"]',
    ) as HTMLElement
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(hiddenChild, { left: 20, top: 0, right: 30, bottom: 10 })

    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [hiddenChild],
        measure,
      }),
    ).toEqual({ status: 'no-candidate' })
  })

  it('remeasures the selected target before focus and rejects newly invalid geometry', () => {
    const boundary = document.createElement('main')
    boundary.innerHTML =
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id="target">Target</button>'
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const target = boundary.querySelector(
      '[data-spatial-id="target"]',
    ) as HTMLElement
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(target, { left: 20, top: 0, right: 30, bottom: 10 })
    let targetMeasurements = 0
    const remeasuringMeasure = vi.fn((element: HTMLElement) => {
      if (element !== target) return measure(element)
      targetMeasurements += 1
      return targetMeasurements === 1
        ? measure(element)
        : { left: 20, top: 0, right: 20, bottom: 10 }
    })
    const focus = vi.spyOn(target, 'focus')

    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [target],
        measure: remeasuringMeasure,
      }),
    ).toEqual({ status: 'focus-failed', id: 'target' })
    expect(targetMeasurements).toBe(2)
    expect(focus).not.toHaveBeenCalled()
  })

  it('uses the active portaled overlay and does not fall through after focus failure', () => {
    const boundary = document.createElement('main')
    document.body.append(boundary)
    const overlay = document.createElement('div')
    const origin = document.createElement('button')
    origin.dataset.spatialId = 'origin'
    const target = document.createElement('button')
    target.dataset.spatialId = 'target'
    const fallback = document.createElement('button')
    fallback.dataset.spatialId = 'fallback'
    overlay.append(origin, target, fallback)
    document.body.append(overlay)
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(target, { left: 20, top: 0, right: 30, bottom: 10 })
    prepare(fallback, { left: 80, top: 0, right: 90, bottom: 10 })
    const focus = vi
      .spyOn(target, 'focus')
      .mockImplementation(() => target.remove())
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        activeOverlayRoot: overlay,
        candidates: [target, fallback],
        measure,
      }),
    ).toEqual({ status: 'focus-failed', id: 'target' })
    expect(focus).toHaveBeenCalledTimes(1)
    expect(fallback).not.toHaveFocus()
  })

  it('revalidates the selected target immediately before focus', () => {
    const boundary = document.createElement('main')
    boundary.innerHTML =
      '<button data-spatial-id="origin">Origin</button><button data-spatial-id="target">Target</button>'
    document.body.append(boundary)
    const origin = boundary.querySelector(
      '[data-spatial-id="origin"]',
    ) as HTMLElement
    const target = boundary.querySelector(
      '[data-spatial-id="target"]',
    ) as HTMLButtonElement
    prepare(origin, { left: 0, top: 0, right: 10, bottom: 10 })
    prepare(target, { left: 20, top: 0, right: 30, bottom: 10 })
    const changingMeasure = vi.fn((element: HTMLElement) => {
      if (element === target) target.disabled = true
      return measure(element)
    })
    const focus = vi.spyOn(target, 'focus')
    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: boundary,
        candidates: [target],
        measure: changingMeasure,
      }),
    ).toEqual({ status: 'focus-failed', id: 'target' })
    expect(focus).not.toHaveBeenCalled()
  })
})

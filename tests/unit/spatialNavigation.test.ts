import { describe, expect, it } from 'vitest'
import {
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

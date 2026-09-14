import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const restWindowSource = readFileSync(
  'src/features/resources-master/useResourcesMasterRestWindow.ts',
  'utf8',
)
const screenSource = readFileSync(
  'src/features/resources-master/ResourcesMasterScreen.tsx',
  'utf8',
)

describe('resources master REST boundaries', () => {
  it('uses one REST query window without legacy list, Convex, or accumulation seams', () => {
    expect(restWindowSource).toMatch(/useQuery/)
    expect(restWindowSource).toMatch(/ResourcesMasterRestReadApi/)
    expect(restWindowSource).not.toMatch(
      /useResourcesMasterList(?:Query)?|convex|useInfiniteQuery|loadMore|flatMap|dedup|cursor/i,
    )
  })

  it('keeps the rendered screen on the REST-only list and projection boundary', () => {
    expect(screenSource).toMatch(/createResourcesMasterRestApi/)
    expect(screenSource).toMatch(/useResourcesMasterRestWindow/)
    expect(screenSource).not.toMatch(
      /createResourcesMasterConvexApi|useResourcesMasterList(?:Query)?|ResourceSummary|classificationStatus|identificadorTecnico|diagnosticsLabel/,
    )
  })
})

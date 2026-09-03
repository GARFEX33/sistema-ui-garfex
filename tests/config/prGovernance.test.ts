import { describe, expect, it } from 'vitest'
import {
  findApprovedIssue,
  hasExactlyOneTypeLabel,
  paginateConnection,
  parseClosingIssueNumbers,
  resolveIssueReferences,
} from '../../scripts/validate-pr-governance.mjs'

const sameRepo = 'garfex/sistema-ui-garfex'
const approved = (
  number: number,
  repository = sameRepo,
  labels = ['status:approved'],
) => ({
  number,
  repository: { nameWithOwner: repository },
  labels: { nodes: labels.map((name) => ({ name })) },
})

describe('issue #33 PR governance helpers', () => {
  it('keeps canonical approved same-repo references authoritative', () => {
    const canonical = [approved(33)]

    expect(
      resolveIssueReferences({
        canonicalReferences: canonical,
        body: 'Closes #99',
        baseRef: 'main',
      }),
    ).toBe(canonical)
  })

  it('does not use body fallback on the default base', () => {
    expect(
      resolveIssueReferences({
        canonicalReferences: [],
        body: 'Closes #33',
        baseRef: 'main',
      }),
    ).toEqual([])
  })

  it('uses body fallback only for an empty canonical set and non-default base', () => {
    expect(
      resolveIssueReferences({
        canonicalReferences: [],
        body: 'fixes #33',
        baseRef: 'release/1.2',
      }).map((issue) => issue.number),
    ).toEqual([33])
    expect(
      resolveIssueReferences({
        canonicalReferences: [approved(33)],
        body: 'Closes #99',
        baseRef: 'release/1.2',
      }).map((issue) => issue.number),
    ).toEqual([33])
  })

  it.each(['Closes #33', 'FIXES #7', 'resolves #101'])(
    'accepts one strict same-repo closing directive: %s',
    (body) => expect(parseClosingIssueNumbers(body)).toHaveLength(1),
  )

  it('keeps a real standalone directive despite a later inline-code example', () => {
    expect(
      parseClosingIssueNumbers(
        'Closes #2\n\n- [ ] Document the example `Closes #2`',
      ),
    ).toEqual([2])
  })

  it.each([
    'Closes #33 and Fixes #34',
    'Closes octo/repo#33',
    'Closes #33x',
    'Closes #33.bad',
    'Closes #33,#34',
    'See issue #33',
    '<!-- Closes #33 -->',
    '<!--\nCloses #33',
    '~~~\nCloses #33\n~~~',
    '    Closes #33',
    'This PR never fixes #33',
    'Closes #2147483648',
    'Closes #999999999999999999999999999999999999',
    '```\nCloses #33\n```',
    '`Closes #33`',
  ])('rejects non-canonical closing examples: %s', (body) => {
    expect(parseClosingIssueNumbers(body)).toEqual([])
  })

  it('selects only an approved issue in the same repository', () => {
    expect(
      findApprovedIssue([approved(12, 'other/repo'), approved(33)], sameRepo)
        ?.number,
    ).toBe(33)
    expect(
      findApprovedIssue([approved(12, sameRepo, ['status:pending'])], sameRepo),
    ).toBeUndefined()
  })

  it('requires exactly one type:* label', () => {
    expect(hasExactlyOneTypeLabel(['type:bug', 'status:approved'])).toBe(true)
    expect(hasExactlyOneTypeLabel(['type:bug', 'type:feature'])).toBe(false)
    expect(hasExactlyOneTypeLabel(['status:approved'])).toBe(false)
  })

  it('preserves paginated nodes and rejects a missing next cursor', async () => {
    const fetchPage = async (cursor: string | null) =>
      cursor === null
        ? {
            nodes: [approved(33)],
            pageInfo: { hasNextPage: true, endCursor: 'next' },
          }
        : {
            nodes: [approved(34)],
            pageInfo: { hasNextPage: false, endCursor: null },
          }

    await expect(paginateConnection(fetchPage)).resolves.toEqual([
      approved(33),
      approved(34),
    ])
    await expect(
      paginateConnection(async () => ({
        nodes: [approved(33)],
        pageInfo: { hasNextPage: true, endCursor: null },
      })),
    ).rejects.toThrow(/cursor/i)
  })
})

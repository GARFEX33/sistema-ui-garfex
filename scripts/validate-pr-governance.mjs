const closingDirective = /\b(?:closes|fixes|resolves)\b/i
const standaloneClosingDirective =
  /^[ ]{0,3}(?:closes|fixes|resolves)[ \t]+#([0-9]{1,10})[.!?]?[ \t]*$/i
const fenceStart = /^[ ]{0,3}(`{3,}|~{3,})/
const fenceEnd = /^[ ]{0,3}(`{3,}|~{3,})[ \t]*$/
const inlineCode = /(`+)[^\r\n]*?\1|(~+)[^\r\n]*?\2/g
const htmlComment = /<!--[\s\S]*?(?:-->|$)/g
const graphqlIntMax = 2147483647

function maskCodeAndComments(body) {
  const withoutComments = body.replace(htmlComment, (comment) =>
    comment.replace(/[^\r\n]/g, ' '),
  )
  const lines = withoutComments.split(/(\r?\n)/)
  let fence
  for (let index = 0; index < lines.length; index += 2) {
    const line = lines[index]
    if (fence) {
      lines[index] = line.replace(/[^\r]/g, ' ')
      const closing = line.match(fenceEnd)
      if (
        closing &&
        closing[1][0] === fence[0] &&
        closing[1].length >= fence.length
      )
        fence = undefined
      continue
    }
    const opening = line.match(fenceStart)
    if (opening) {
      fence = opening[1]
      lines[index] = line.replace(/[^\r]/g, ' ')
      continue
    }
    lines[index] = line.replace(inlineCode, (code) =>
      code.replace(/[^\r]/g, ' '),
    )
  }
  return lines.join('')
}

export function parseClosingIssueNumbers(body = '') {
  if (typeof body !== 'string') return []

  const matches = []
  for (const line of maskCodeAndComments(body).split(/\r?\n/)) {
    if (!closingDirective.test(line)) continue
    const match = line.match(standaloneClosingDirective)
    if (!match) return []
    const number = Number(match[1])
    if (number < 1 || number > graphqlIntMax) return []
    matches.push(number)
  }
  return matches.length === 1 ? matches : []
}

export function resolveIssueReferences({
  canonicalReferences = [],
  body = '',
  baseRef,
  defaultBranch = 'main',
}) {
  if (canonicalReferences.length > 0 || baseRef === defaultBranch)
    return canonicalReferences
  return parseClosingIssueNumbers(body).map((number) => ({ number }))
}

export function findApprovedIssue(references = [], repositoryName) {
  const expectedRepository = String(repositoryName).toLowerCase()
  return references.find(
    (issue) =>
      issue?.repository?.nameWithOwner?.toLowerCase() === expectedRepository &&
      issue.labels?.nodes?.some((label) => label?.name === 'status:approved'),
  )
}

export function hasExactlyOneTypeLabel(labels = []) {
  return labels.filter((label) => label.startsWith('type:')).length === 1
}

export async function paginateConnection(fetchPage) {
  const nodes = []
  let cursor = null
  do {
    const page = await fetchPage(cursor)
    nodes.push(...(page.nodes ?? []).filter(Boolean))
    if (page.pageInfo?.hasNextPage && !page.pageInfo.endCursor) {
      throw new Error(
        'Connection pagination requires an endCursor when hasNextPage is true.',
      )
    }
    cursor = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null
  } while (cursor)
  return nodes
}

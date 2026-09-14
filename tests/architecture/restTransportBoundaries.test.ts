import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const allowed = new Set([
  'src/features/catalog-hierarchy/catalogHierarchy.api.ts',
  'src/features/catalog-hierarchy/catalogTypeAttributesRead.api.ts',
  'src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.api.ts',
  'src/features/resources-master/resourcesMaster.api.ts',
])

const walk = (node: ts.Node, visit: (node: ts.Node) => void) => {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

const fetchTarget = (node: ts.Expression) =>
  ts.isIdentifier(node) && node.text === 'fetch'
    ? true
    : ts.isPropertyAccessExpression(node) &&
      node.name.text === 'fetch' &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === 'globalThis' ||
        node.expression.text === 'window')

const analyze = (file: string, input: string) => {
  const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true)
  const aliases = new Set<string>()
  walk(source, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      fetchTarget(node.initializer)
    )
      aliases.add(node.name.text)
  })
  const calls: string[] = []
  walk(source, (node) => {
    if (!ts.isCallExpression(node)) return
    const direct = fetchTarget(node.expression)
    const alias =
      ts.isIdentifier(node.expression) && aliases.has(node.expression.text)
    if ((direct || alias) && !allowed.has(file)) calls.push(file)
  })
  return calls
}

const productionIssues = () =>
  readdirSync(join(root, 'src'), { recursive: true })
    .filter(
      (file): file is string =>
        typeof file === 'string' && /\.tsx?$/.test(file),
    )
    .flatMap((file) => {
      const path = join('src', file)
      return analyze(path, readFileSync(join(root, path), 'utf8'))
    })

describe('REST transport boundaries', () => {
  it('keeps production fetch calls inside the four approved adapters', () => {
    expect(productionIssues()).toEqual([])
  })

  it('allows direct fetch only in the approved adapter paths', () => {
    for (const file of allowed)
      expect(analyze(file, "fetch('/v1/catalog')")).toEqual([])
  })

  it('keeps the effective attributes adapter GET-only and isolated from optional bases', () => {
    const effective = readFileSync(
      join(
        root,
        'src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.api.ts',
      ),
      'utf8',
    )
    expect(effective).toMatch(/getEffectiveAttributes/)
    expect(effective).not.toMatch(
      /\b(?:POST|evaluate|characteristicCode|PRESENTACION|OPCION)\b/,
    )
  })

  it('rejects direct, global, window, and aliased fetch outside the adapters', () => {
    const file = 'src/shared/api/not-allowed.ts'
    expect(analyze(file, "fetch('/v1')")).toEqual([file])
    expect(analyze(file, "globalThis.fetch('/v1')")).toEqual([file])
    expect(analyze(file, "window.fetch('/v1')")).toEqual([file])
    expect(
      analyze(file, "const request = globalThis.fetch; request('/v1')"),
    ).toEqual([file])
  })
})

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const sourceFiles = readdirSync(join(root, 'src'), { recursive: true })
  .filter(
    (file): file is string => typeof file === 'string' && /\.tsx?$/.test(file),
  )
  .map((file) => join('src', file))
  .sort()
const read = (file: string) => readFileSync(join(root, file), 'utf8')
const providerPath = 'src/app/providers/AppProviders.tsx'
const hookPath = 'src/features/resources-master/useResourcesMasterListQuery.ts'
const apiPath = 'src/features/resources-master/resourcesMaster.api.ts'
const queryBindings = new Map([
  [providerPath, ['QueryClient', 'QueryClientProvider']],
  [hookPath, ['useInfiniteQuery', 'useQueryClient']],
])
const convexFiles = new Set([
  apiPath,
  'src/features/catalog-hierarchy/catalogHierarchy.api.ts',
  'src/features/catalog-hierarchy/catalogTypeAttributes.api.ts',
])
const forbiddenHookMembers = new Set([
  'clear',
  'invalidateQueries',
  'removeQueries',
  'resetQueries',
  'setQueriesData',
  'setQueryData',
  'refetchQueries',
])

const text = (node: ts.Node | undefined) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined
const isPackage = (module: string, name: string) =>
  module === name || module.startsWith(`${name}/`)
const isQueryModule = (module: string) =>
  isPackage(module, '@tanstack/react-query')
const protectedPackage = (module: string) =>
  isQueryModule(module) ||
  ['zod', 'convex'].some((name) => isPackage(module, name))
const isApprovedFile = (file: string, module: string) =>
  (isQueryModule(module) && queryBindings.has(file)) ||
  (isPackage(module, 'zod') && file === apiPath) ||
  (isPackage(module, 'convex') && convexFiles.has(file))
const property = (node: ts.Node) => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  if (ts.isElementAccessExpression(node)) return text(node.argumentExpression)
  return undefined
}
const walk = (node: ts.Node, visit: (node: ts.Node) => void) => {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}
const namedImport = (node: ts.ImportDeclaration) => {
  const clause = node.importClause
  if (!clause || clause.name || !ts.isNamedImports(clause.namedBindings))
    return false
  return clause.namedBindings.elements.every((binding) => !binding.propertyName)
}
const jsxAttribute =
  (name: string) =>
  (attribute: ts.JsxAttributeLike): attribute is ts.JsxAttribute =>
    ts.isJsxAttribute(attribute) && attribute.name.text === name
const appProvidersShape = (source: ts.SourceFile) => {
  const functions = source.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === 'AppProviders',
  )
  const appProviders = functions[0]
  if (!appProviders || !appProviders.body || functions.length !== 1)
    return false

  const isInsideAppProviders = (node: ts.Node) =>
    node.pos >= appProviders.body.pos && node.end <= appProviders.body.end
  const constructors: ts.NewExpression[] = []
  const allProviders: ts.JsxOpeningLikeElement[] = []
  const providers: ts.JsxOpeningLikeElement[] = []
  const stateBindings: { name: string; client: ts.NewExpression }[] = []
  walk(source, (node) => {
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'QueryClient'
    )
      constructors.push(node)
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === 'QueryClientProvider'
    ) {
      allProviders.push(node)
      if (isInsideAppProviders(node)) providers.push(node)
    }
    if (
      !isInsideAppProviders(node) ||
      !ts.isVariableDeclaration(node) ||
      !ts.isArrayBindingPattern(node.name)
    )
      return

    const initializer = node.initializer
    const stateBinding = node.name.elements[0]
    if (
      stateBinding &&
      ts.isBindingElement(stateBinding) &&
      ts.isIdentifier(stateBinding.name) &&
      initializer &&
      ts.isCallExpression(initializer) &&
      ts.isIdentifier(initializer.expression) &&
      initializer.expression.text === 'useState' &&
      initializer.arguments.length === 1 &&
      ts.isArrowFunction(initializer.arguments[0]) &&
      initializer.arguments[0].parameters.length === 0 &&
      ts.isNewExpression(initializer.arguments[0].body) &&
      ts.isIdentifier(initializer.arguments[0].body.expression) &&
      initializer.arguments[0].body.expression.text === 'QueryClient' &&
      !initializer.arguments[0].body.arguments?.length
    )
      stateBindings.push({
        name: stateBinding.name.text,
        client: initializer.arguments[0].body,
      })
  })

  const clientAttributes = providers[0]?.attributes.properties.filter(
    jsxAttribute('client'),
  )
  const client = clientAttributes?.[0]?.initializer
  return (
    constructors.length === 1 &&
    allProviders.length === 1 &&
    !allProviders.some((provider) =>
      provider.attributes.properties.some(jsxAttribute('defaultOptions')),
    ) &&
    stateBindings.length === 1 &&
    providers.length === 1 &&
    constructors[0] === stateBindings[0]?.client &&
    clientAttributes?.length === 1 &&
    !!client &&
    ts.isJsxExpression(client) &&
    !!client.expression &&
    ts.isIdentifier(client.expression) &&
    client.expression.text === stateBindings[0]?.name
  )
}
const integrationModule = (module: string) =>
  /(persist|persister|broadcast|devtools|zustand|redux)/.test(
    module.toLowerCase(),
  ) ||
  (module.includes('shared/') && module.includes('query'))

const analyze = (file: string, input: string) => {
  const source = ts.createSourceFile(
    file,
    input,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const issues: string[] = []
  const importedQueryBindings: string[] = []
  const providerShape = file === providerPath && appProvidersShape(source)

  const rejectProtected = (module: string, syntax: string) => {
    if (!protectedPackage(module)) return
    if (!isApprovedFile(file, module))
      issues.push(`Protected package is not allowed in ${file}: ${module}`)
    if (syntax !== 'named import')
      issues.push(`Protected package requires a named import: ${module}`)
  }

  walk(source, (node) => {
    if (ts.isImportDeclaration(node)) {
      const module = text(node.moduleSpecifier)
      if (!module) return
      rejectProtected(
        module,
        namedImport(node) ? 'named import' : 'other import',
      )
      const bindings = node.importClause?.namedBindings
      if (isQueryModule(module) && bindings && ts.isNamedImports(bindings))
        importedQueryBindings.push(
          ...bindings.elements.map((binding) => binding.name.text),
        )
      if (integrationModule(module))
        issues.push(`Query integration is forbidden: ${module}`)
      return
    }
    if (ts.isExportDeclaration(node)) {
      const module = text(node.moduleSpecifier)
      if (module && protectedPackage(module))
        issues.push(`Protected packages cannot be re-exported: ${module}`)
      return
    }
    if (ts.isImportEqualsDeclaration(node)) {
      const reference = node.moduleReference
      const module = ts.isExternalModuleReference(reference)
        ? text(reference.expression)
        : undefined
      if (module && protectedPackage(module))
        issues.push(`Protected package requires a named import: ${module}`)
      return
    }
    if (ts.isCallExpression(node)) {
      const module = text(node.arguments[0])
      const isDynamic = node.expression.kind === ts.SyntaxKind.ImportKeyword
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === 'require'
      if (module && (isDynamic || isRequire)) {
        rejectProtected(module, 'dynamic import')
        if (integrationModule(module))
          issues.push(`Query integration is forbidden: ${module}`)
      }
      if (
        file === hookPath &&
        forbiddenHookMembers.has(property(node.expression) ?? '')
      )
        issues.push(
          `Forbidden Query cache/action member in hook: ${property(node.expression)}`,
        )
      return
    }
  })

  const expectedBindings = queryBindings.get(file)
  if (
    expectedBindings &&
    [...importedQueryBindings].sort().join(',') !==
      [...expectedBindings].sort().join(',')
  )
    issues.push(
      `Query bindings must be exactly: ${expectedBindings.join(', ')}`,
    )
  if (file === providerPath && !providerShape)
    issues.push('AppProviders must have one provider and one lazy QueryClient')
  return { issues }
}

const productionIssues = () =>
  sourceFiles.flatMap((file) => analyze(file, read(file)).issues)

describe('Query, Zod, and Convex architecture boundaries', () => {
  it('keeps protected packages on explicit approved static import boundaries', () => {
    expect(productionIssues()).toEqual([])
  })

  it('rejects protected-package syntax that bypasses explicit named imports', () => {
    const namedImportIssue = (module: string) =>
      `Protected package requires a named import: ${module}`
    const fixtures = [
      [
        providerPath,
        `import * as Query from '@tanstack/react-query'`,
        namedImportIssue('@tanstack/react-query'),
      ],
      [
        providerPath,
        `import Query from '@tanstack/react-query/subpath'`,
        namedImportIssue('@tanstack/react-query/subpath'),
      ],
      [
        providerPath,
        `import { useQuery as query } from '@tanstack/react-query'`,
        namedImportIssue('@tanstack/react-query'),
      ],
      [apiPath, 'import(`zod/v4`)', namedImportIssue('zod/v4')],
      [
        apiPath,
        'require(`convex/browser`)',
        namedImportIssue('convex/browser'),
      ],
      [
        apiPath,
        `import Convex = require('convex/browser')`,
        namedImportIssue('convex/browser'),
      ],
      [
        apiPath,
        `export { z } from 'zod'`,
        'Protected packages cannot be re-exported: zod',
      ],
    ] as const

    for (const [file, fixture, issue] of fixtures)
      expect(analyze(file, fixture).issues).toContain(issue)
  })

  it('rejects each provider-shape predicate independently', () => {
    const providerIssue =
      'AppProviders must have one provider and one lazy QueryClient'
    const providerFixture = (
      setup = 'const [client] = useState(() => new QueryClient())',
      render = '<QueryClientProvider client={client} />',
      after = '',
    ) => `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
      export function AppProviders() {
        ${setup}
        return ${render}
      }
      ${after}`
    const fixtures = [
      [
        'provider outside AppProviders',
        providerFixture(
          undefined,
          'null',
          '<QueryClientProvider client={client} />',
        ),
      ],
      [
        'client prop is not the lazy state binding',
        providerFixture(
          undefined,
          '<QueryClientProvider client={otherClient} />',
        ),
      ],
      [
        'lazy initializer does not directly return the constructor',
        providerFixture(
          'const [client] = useState(() => { return new QueryClient() })',
        ),
      ],
      [
        'constructor has arguments',
        providerFixture('const [client] = useState(() => new QueryClient({}))'),
      ],
      [
        'duplicate provider',
        providerFixture(
          undefined,
          '<><QueryClientProvider client={client} /><QueryClientProvider client={client} /></>',
        ),
      ],
    ] as const

    for (const [, fixture] of fixtures)
      expect(analyze(providerPath, fixture).issues).toEqual([providerIssue])
  })

  it('enforces the approved Query bindings and hook cache-action boundary', () => {
    const hook = analyze(
      hookPath,
      `import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
       const cache = { invalidateQueries() {}, refetchQueries() {} }
       cache.invalidateQueries(); cache.refetchQueries()`,
    )

    expect(hook.issues).toEqual([
      'Forbidden Query cache/action member in hook: invalidateQueries',
      'Forbidden Query cache/action member in hook: refetchQueries',
      'Query bindings must be exactly: useInfiniteQuery, useQueryClient',
    ])
  })

  it('does not match protected-package text in comments, strings, or unrelated packages', () => {
    const fixture = `// import * as Query from '@tanstack/react-query'
      const note = "require('zod') and import('convex/browser')"
      import { useQuery } from '@tanstack/react-queryish'
      import { z } from 'zodiac'
      import { ConvexHttpClient } from 'convexity'
      void note`

    expect(analyze('src/shared/fixture.ts', fixture).issues).toEqual([])
  })
})

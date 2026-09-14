import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const configPath = resolve(process.cwd(), 'vite.config.ts')

const objectProperty = (object: ts.ObjectLiteralExpression, name: string) =>
  object.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) && property.name.text === name) ||
        (ts.isStringLiteral(property.name) && property.name.text === name)),
  )

const proxyEntry = () => {
  const source = ts.createSourceFile(
    configPath,
    readFileSync(configPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const exportedConfig = source.statements.find(
    (statement): statement is ts.ExportAssignment =>
      ts.isExportAssignment(statement),
  )
  if (!exportedConfig || !ts.isCallExpression(exportedConfig.expression)) return
  const config = exportedConfig.expression.arguments[0]
  if (!config || !ts.isObjectLiteralExpression(config)) return
  const server = objectProperty(config, 'server')?.initializer
  if (!server || !ts.isObjectLiteralExpression(server)) return
  const proxy = objectProperty(server, 'proxy')?.initializer
  if (!proxy || !ts.isObjectLiteralExpression(proxy)) return
  const entry = objectProperty(proxy, '/v1')?.initializer
  return entry && ts.isObjectLiteralExpression(entry) ? entry : undefined
}

describe('REST development proxy configuration', () => {
  it('forwards the public /v1 prefix to the local REST backend without rewriting it', () => {
    const entry = proxyEntry()

    expect(entry).toBeDefined()
    expect(objectProperty(entry!, 'target')?.initializer.getText()).toBe(
      "'http://localhost:8090'",
    )
    expect(objectProperty(entry!, 'rewrite')).toBeUndefined()
  })
})

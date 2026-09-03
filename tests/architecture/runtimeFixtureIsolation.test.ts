import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(entry.name)
        ? [path]
        : []
  })
}

describe('runtime and presentation fixture boundary', () => {
  it('keeps runtime source independent from Storybook and presentation engines', () => {
    const files = sourceFiles(resolve(root, 'src'))
    expect(files.length).toBeGreaterThan(0)
    const runtimeSource = files
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(runtimeSource).not.toMatch(/storybook\//)
    expect(runtimeSource).not.toMatch(/operationsInbox\.fixtures/)
    expect(runtimeSource).not.toMatch(
      /@tanstack\/(react-form|react-table|react-virtual)/,
    )
    expect(readFileSync(resolve(root, 'src/main.tsx'), 'utf8')).not.toMatch(
      /storybook/,
    )
  })

  it('keeps the presentation source outside the app project boundary', () => {
    expect(
      existsSync(
        resolve(root, 'storybook/operations-inbox/operationsInbox.fixtures.ts'),
      ),
    ).toBe(true)
    const appConfig = readFileSync(resolve(root, 'tsconfig.app.json'), 'utf8')
    expect(appConfig).toMatch(/"include": \["src"\]/)
    expect(
      readFileSync(
        resolve(root, 'scripts/verify-runtime-fixtures.mjs'),
        'utf8',
      ),
    ).toContain('manifest')
  })

  it('does not introduce optional TanStack consumers in stories', () => {
    const stories = sourceFiles(resolve(root, 'storybook'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(stories).not.toMatch(
      /@tanstack\/(react-form|react-table|react-virtual)/,
    )
  })

  it('keeps the Catalog runtime free of populated presentation fixtures', () => {
    const catalog = readFileSync(
      resolve(
        root,
        'src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx',
      ),
      'utf8',
    )
    expect(catalog).not.toMatch(
      /storybook|Materiales|Canalizaciones|Tubería|fetch|storage/i,
    )
  })

  it('keeps the Catalog adapter feature-local and free of runtime fixtures', () => {
    const adapter = readFileSync(
      resolve(root, 'src/features/catalog-hierarchy/catalogHierarchy.api.ts'),
      'utf8',
    )
    expect(adapter).toContain("from 'convex/browser'")
    expect(adapter).toContain("from 'convex/server'")
    const mutationRoutes = [
      ...adapter.matchAll(
        /(['"])(catalogoAdmin\/jerarquia:(?:crearClase|crearFamilia|crearTipo))\1/g,
      ),
    ].map(([, , route]) => route)
    expect(new Set(mutationRoutes)).toEqual(
      new Set([
        'catalogoAdmin/jerarquia:crearClase',
        'catalogoAdmin/jerarquia:crearFamilia',
        'catalogoAdmin/jerarquia:crearTipo',
      ]),
    )
    expect(adapter).toMatch(/\bclient\.mutation\s*\(/)
    expect(adapter).not.toMatch(
      /`[^`]*catalogoAdmin\/jerarquia|String\.(?:fromCharCode|fromCodePoint)|decodeURIComponent|(?:client|operation)\s*\[\s*['"`]/,
    )
    expect(adapter).not.toMatch(/\\u[0-9a-fA-F]{4}/)
    expect(adapter).not.toMatch(
      /storybook|fetch|localStorage|sessionStorage|addEventListener|\b(?:update|activate|deactivate|activar|desactivar|actualizar)\b|\bRecurso\b|catalogoRecursos|\bfixtures?\b/i,
    )
  })

  it('keeps Convex out of app, Bandeja, providers, stories, and visible wiring', () => {
    const appFiles = sourceFiles(resolve(root, 'src/app'))
    const appSource = appFiles
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    const stories = sourceFiles(resolve(root, 'storybook'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(appSource).not.toMatch(/from ['"]convex\//)
    expect(appSource).not.toMatch(/HierarchyBrowser|HierarchyReadPanel/)
    expect(stories).not.toMatch(/from ['"]convex\//)
    expect(
      readFileSync(
        resolve(
          root,
          'src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx',
        ),
        'utf8',
      ),
    ).not.toMatch(
      /HierarchyBrowser|HierarchyReadPanel|KeyboardControllerProvider|createContext|addEventListener|onKeyDown|event\.code|(?:selected|active)Index|roving/i,
    )
  })
})

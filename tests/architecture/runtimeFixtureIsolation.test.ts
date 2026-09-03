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

  it('keeps populated Catalog presentation data out of runtime source', () => {
    const screen = readFileSync(
      resolve(
        root,
        'src/features/catalog-hierarchy/CatalogHierarchyScreen.tsx',
      ),
      'utf8',
    )
    expect(screen).not.toMatch(
      /storybook|Materiales|Canalizaciones|Tubería|fetch|storage/i,
    )
    expect(
      readFileSync(
        resolve(
          root,
          'storybook/catalog-hierarchy/catalogHierarchy.fixtures.ts',
        ),
        'utf8',
      ),
    ).toContain('Materiales')
  })
})

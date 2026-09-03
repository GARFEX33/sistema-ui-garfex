import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src/features/catalog-hierarchy')
const source = readdirSync(root)
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .map((file) => readFileSync(join(root, file), 'utf8'))
  .join('\n')
const shell = readFileSync(
  join(process.cwd(), 'src/app/shell/AppShell.tsx'),
  'utf8',
)
const routes = readFileSync(
  join(process.cwd(), 'src/app/routeTree.gen.ts'),
  'utf8',
)

describe('catalog hierarchy boundaries', () => {
  it('keeps the feature local, non-mutating and fixture-free', () => {
    const transport = readFileSync(
      join(root, 'catalogHierarchy.api.ts'),
      'utf8',
    )
    expect(transport).toContain("from 'convex/browser'")
    expect(transport).toContain("from 'convex/server'")
    const allowedOperations = [
      'catalogoAdmin/jerarquia:listarClases',
      'catalogoAdmin/jerarquia:listarFamilias',
      'catalogoAdmin/jerarquia:listarTipos',
      'catalogoAdmin/jerarquia:crearClase',
      'catalogoAdmin/jerarquia:crearFamilia',
      'catalogoAdmin/jerarquia:crearTipo',
    ]
    const operations = [
      ...transport.matchAll(/['"](catalogoAdmin\/jerarquia:[A-Za-z]+)['"]/g),
    ].map(([, operation]) => operation)
    expect(new Set(operations)).toEqual(new Set(allowedOperations))
    const mutationRoutes = [
      ...transport.matchAll(
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
    expect(transport).not.toMatch(
      /`[^`]*catalogoAdmin\/jerarquia|String\.(?:fromCharCode|fromCodePoint)|decodeURIComponent|(?:client|operation)\s*\[\s*['"`]/,
    )
    expect(transport).toContain("'catalogoAdmin/jerarquia:listarClases'")
    expect(transport).toContain("'catalogoAdmin/jerarquia:listarFamilias'")
    expect(transport).toContain("'catalogoAdmin/jerarquia:listarTipos'")
    expect(transport).toContain("'catalogoAdmin/jerarquia:crearClase'")
    expect(transport).toContain("'catalogoAdmin/jerarquia:crearFamilia'")
    expect(transport).toContain("'catalogoAdmin/jerarquia:crearTipo'")
    expect(transport).toMatch(
      /interface CatalogHierarchyApi[\s\S]*createFamily:/,
    )
    expect(transport).toMatch(/interface CatalogHierarchyApi[\s\S]*createType:/)
    expect(transport).toMatch(/async createFamily\(/)
    expect(transport).toMatch(/async createType\(/)
    expect(transport).not.toMatch(/\\u[0-9a-fA-F]{4}/)
    expect(transport).not.toMatch(
      /['"][^'"]*['"]\s*\+\s*['"]|['"]catalogoAdmin\/jerarquia['"]\s*\+/,
    )
    expect(transport).not.toMatch(/\[key in|async\s*\[|familyMethod|typeMethod/)
    expect(transport).not.toMatch(
      /\b(?:client|queryReferences|mutationReferences)\s*\[/,
    )
    expect(transport).not.toMatch(/\[[A-Za-z_$][A-Za-z0-9_$]*\]/)
    expect(transport.match(/\bclient\.mutation\s*\(/g) ?? []).toHaveLength(3)
    expect(transport).toMatch(/client\.mutation\(createClassReference/)
    expect(transport).toMatch(/client\.mutation\(createFamilyReference/)
    expect(transport).toMatch(/client\.mutation\(createTypeReference/)
    expect(transport.match(/\bclient\.action\s*\(/g) ?? []).toHaveLength(0)
    expect(transport).not.toMatch(/\blifecycle\b/i)
    expect(transport).not.toMatch(
      /\b(?:update|activate|deactivate|activar|desactivar|actualizar)\b/i,
    )
    expect(transport).not.toMatch(/\bRecurso\b/)
    expect(transport).not.toMatch(
      /\bfetch\b|localStorage|sessionStorage|catalogoRecursos|storybook\/catalog-hierarchy|\bfixtures?\b|design(?:-recovered)?\.op\b/i,
    )
    expect(source).not.toMatch(/Materiales|Canalizaciones|Tubería/)
  })

  it('keeps the populated approved composition outside runtime', () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          'storybook/catalog-hierarchy/catalogHierarchy.fixtures.ts',
        ),
      ),
    ).toBe(true)
    expect(
      existsSync(
        join(
          process.cwd(),
          'storybook/catalog-hierarchy/CatalogHierarchyApproved.stories.tsx',
        ),
      ),
    ).toBe(true)
    const runtimeFiles = readdirSync(join(process.cwd(), 'src'), {
      recursive: true,
    })
      .filter(
        (file): file is string =>
          typeof file === 'string' && /\.(ts|tsx)$/.test(file),
      )
      .map((file) => readFileSync(join(process.cwd(), 'src', file), 'utf8'))
      .join('\n')
    expect(runtimeFiles).not.toMatch(
      /storybook\/catalog-hierarchy|Materiales|Canalizaciones|Tubería/,
    )
  })

  it('keeps runtime free of speculative infrastructure and duplicate listeners', () => {
    const transport = readFileSync(
      join(root, 'catalogHierarchy.api.ts'),
      'utf8',
    )
    const appSource = readdirSync(join(process.cwd(), 'src/app'), {
      recursive: true,
    })
      .filter(
        (file): file is string =>
          typeof file === 'string' && /\.(ts|tsx)$/.test(file),
      )
      .map((file) => readFileSync(join(process.cwd(), 'src/app', file), 'utf8'))
      .join('\n')
    expect(appSource).not.toMatch(/from ['"]convex\//)
    expect(transport).not.toMatch(
      /\buseQuery\b|\bQueryClient\b|global.?store|\bBandeja\b|\bRecurso\b|\b(update|activate|deactivate)\s*\(|addEventListener|onkeydown|Ctrl\+N/i,
    )
    expect(transport).toMatch(
      /catalogoAdmin\/jerarquia:crearClase|client\.mutation\s*\(/,
    )
    const screen = readFileSync(
      join(root, 'CatalogHierarchyScreen.tsx'),
      'utf8',
    )
    expect(screen).not.toMatch(
      /HierarchyBrowser|HierarchyReadPanel|KeyboardControllerProvider|createContext|addEventListener|onKeyDown|event\.code|(?:selected|active)Index|roving/i,
    )
    expect(source).not.toMatch(/\b(?:Recurso|update|activate|deactivate)\b/i)
    expect(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).toMatch(
      /"convex": "1\.45\.0"/,
    )
  })

  it('keeps only approved destinations', () => {
    expect(shell.match(/<Link/g)).toHaveLength(2)
    expect(shell).not.toMatch(
      /to="\/(recursos|compras|atributos|presentaci[oó]n)/i,
    )
    expect(routes).not.toMatch(/recursos|atributos|presentaci[oó]n/i)
  })
})

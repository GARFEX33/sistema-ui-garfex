import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src/features/catalog-hierarchy')
const source = readdirSync(root)
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .map((file) => readFileSync(join(root, file), 'utf8'))
  .join('\n')
// OPCION is the one approved exception to deactivate/reactivate-only lifecycle:
// an option never referenced by a Recurso may be hard-deleted, gated server-side.
const sourceWithoutOptionsAdmin = readdirSync(root)
  .filter(
    (file) =>
      /\.(ts|tsx|css)$/.test(file) && file !== 'catalogOptionsAdmin.api.ts',
  )
  .map((file) => readFileSync(join(root, file), 'utf8'))
  .join('\n')
const optionsAdminSource = readFileSync(
  join(root, 'catalogOptionsAdmin.api.ts'),
  'utf8',
)
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
    expect(transport).not.toMatch(/convex/i)
    expect(transport).toMatch(/'\/v1\/catalog\/CLASE'/)
    expect(transport).toMatch(/'\/v1\/catalog\/'\s*\+\s*kind/)
    expect(transport).toMatch(/'FAMILIA'/)
    expect(transport).toMatch(/'TIPO'/)
    expect(transport).not.toMatch(
      /`[^`]*\/v1\/catalog|String\.(?:fromCharCode|fromCodePoint)|decodeURIComponent/,
    )
    expect(transport).toMatch(
      /interface CatalogHierarchyRestApi[\s\S]*createFamily:/,
    )
    expect(transport).toMatch(
      /interface CatalogHierarchyRestApi[\s\S]*createType:/,
    )
    expect(transport).toMatch(/async createFamily\(/)
    expect(transport).toMatch(/async createType\(/)
    expect(transport).not.toMatch(/\\u[0-9a-fA-F]{4}/)
    expect(transport).not.toMatch(/\[key in|async\s*\[|familyMethod|typeMethod/)
    // Excludes chained TS indexed-access types (e.g. Record['values'][string]),
    // which are compile-time only and not the dynamic runtime access this guards against.
    expect(transport).not.toMatch(/(?<!\])\[[A-Za-z_$][A-Za-z0-9_$]*\]/)
    expect(transport).not.toMatch(/\blifecycle\b/i)
    expect(transport).not.toMatch(/\bRecurso\b/)
    expect(transport).not.toMatch(
      /localStorage|sessionStorage|catalogoRecursos|storybook\/catalog-hierarchy|\bfixtures?\b|design(?:-recovered)?\.op\b/i,
    )
    expect(transport).toMatch(
      /export function createCatalogHierarchyRestApi\([\s\S]*fetch/,
    )
    expect(source).not.toMatch(/Materiales|Canalizaciones|Tubería/)
    const creationApi = readFileSync(
      join(root, 'catalogAttributeCreation.api.ts'),
      'utf8',
    )
    expect(creationApi).toMatch(/resolveHierarchyReferences/)
    expect(creationApi).toMatch(/createCharacteristic/)
    expect(creationApi).toMatch(/createApplicability/)
    expect(creationApi).toMatch(/createPresentation/)
    const creationPosts = [
      ...creationApi.matchAll(
        /fetch\(\s*'\/v1\/catalog\/(CARACTERISTICA|APLICABILIDAD|PRESENTACION)'\s*,\s*{\s*method:\s*'POST'/g,
      ),
    ].map(([, kind]) => kind)
    expect(creationPosts).toEqual([
      'CARACTERISTICA',
      'APLICABILIDAD',
      'PRESENTACION',
    ])
    expect(creationApi).toMatch(/method: 'POST'/)
    expect(creationApi).not.toMatch(/\b(?:PUT|DELETE|Convex|retry|fallback)\b/)
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

  it('keeps runtime free of speculative infrastructure, DELETE, and duplicate listeners', () => {
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
    expect(transport).toMatch(/async createClass\(/)
    const screen = readFileSync(
      join(root, 'CatalogHierarchyScreen.tsx'),
      'utf8',
    )
    expect(screen).not.toMatch(
      /HierarchyBrowser|HierarchyReadPanel|KeyboardControllerProvider|createContext|addEventListener|onKeyDown|event\.code|(?:selected|active)Index|roving/i,
    )
    expect(sourceWithoutOptionsAdmin).not.toMatch(/method:\s*['"]DELETE['"]/)
    expect(
      optionsAdminSource.match(/method:\s*['"]DELETE['"]/g) ?? [],
    ).toHaveLength(1)
    expect(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ).not.toMatch(/"convex":/)
  })

  it('keeps only approved destinations and read-only visual authority', () => {
    expect(shell.match(/<Link/g)).toHaveLength(5)
    expect(shell).toMatch(/to="\/compras"/)
    expect(shell).not.toMatch(/to="\/(atributos|presentaci[oó]n)/i)
    expect(routes).not.toMatch(/atributos|presentaci[oó]n/i)
    expect(
      readFileSync(
        join(process.cwd(), 'design-catalog-hierarchy-edit.op'),
        'utf8',
      ),
    ).toContain('05A Configuración · Taller del catálogo')
  })

  it('mounts only the Core-effective read-only attributes path', () => {
    const screen = readFileSync(
      join(root, 'CatalogHierarchyScreen.tsx'),
      'utf8',
    )
    const panel = readFileSync(
      join(root, 'CatalogTypeEffectiveAttributes.tsx'),
      'utf8',
    )
    expect(screen).toMatch(
      /createCatalogTypeEffectiveAttributesApi|useCatalogTypeEffectiveAttributes|CatalogTypeEffectiveAttributes/,
    )
    expect(screen).not.toMatch(
      /catalogTypeAttributes|AsignarAtributoSurface|EditarAtributoSurface|GestionarOpcionesSurface|registerAction/,
    )
    expect(panel).not.toMatch(/\b(?:fetch|evaluate|PRESENTACION)\b/)
  })

  it('keeps guided attribute creation in the local screen-to-panel seam', () => {
    const screen = readFileSync(
      join(root, 'CatalogHierarchyScreen.tsx'),
      'utf8',
    )
    const panel = readFileSync(
      join(root, 'CatalogTypeEffectiveAttributes.tsx'),
      'utf8',
    )
    const creationApi = readFileSync(
      join(root, 'catalogAttributeCreation.api.ts'),
      'utf8',
    )

    expect(screen).toMatch(
      /createCatalogAttributeCreationApi|useCatalogAttributeCreation|hasRestActor/,
    )
    expect(screen).not.toMatch(/\b(?:fetch|evaluate|setAttributes)\b/)
    expect(panel).toMatch(/CrearAtributoSurface/)
    expect(panel).not.toMatch(/\b(?:fetch|evaluate|PRESENTACION)\b/)
    expect(creationApi).toMatch(/withRestActor/)
  })
})

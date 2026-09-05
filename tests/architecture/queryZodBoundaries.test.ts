import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')
const sourceFiles = readdirSync(join(root, 'src'), { recursive: true })
  .filter(
    (file): file is string =>
      typeof file === 'string' && /\.(ts|tsx)$/.test(file),
  )
  .map((file) => join('src', file))
  .sort()
const filesMatching = (pattern: RegExp, files = sourceFiles) =>
  files.filter((file) => pattern.test(read(file)))
const occurrencesMatching = (pattern: RegExp, files = sourceFiles) =>
  files.flatMap((file) => [...read(file).matchAll(pattern)].map(() => file))
const importSpecifiers = (source: string) =>
  [
    ...source.matchAll(
      /^[ \t]*import(?:\s+type)?(?:\s+(?!['"])[\s\S]*?\s+from)?\s*['"]([^'"]+)['"][ \t]*;?/gm,
    ),
  ].map(([, module]) => module)

describe('Query and Zod architecture boundaries', () => {
  it('confines Query setup to AppProviders and excludes Convex from app', () => {
    const providerPath = 'src/app/providers/AppProviders.tsx'
    const provider = read(providerPath)
    const providerImports = importSpecifiers(provider)

    expect(occurrencesMatching(/<QueryClientProvider\b/g)).toEqual([
      providerPath,
    ])
    expect(occurrencesMatching(/\bnew\s+QueryClient\s*\(/g)).toEqual([
      providerPath,
    ])
    expect(providerImports).toEqual([
      'react',
      '@tanstack/react-query',
      '@tanstack/react-router',
      '../router',
    ])
    expect(provider).not.toMatch(/\bdefaultOptions\b/)
    expect(
      filesMatching(
        /\b(?:import|export)\s+(?:type\s+)?(?:[^'"\n]*?\s+from\s+)?['"]convex(?:\/[^'"]*)?['"]|\bimport\s*\(\s*['"]convex(?:\/[^'"]*)?['"]|\brequire\s*\(\s*['"]convex(?:\/[^'"]*)?['"]/,
        sourceFiles.filter((file) => file.startsWith('src/app/')),
      ),
    ).toEqual([])
  })
})

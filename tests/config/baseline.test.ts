import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
const packagePath = resolve(root, 'package.json')
const requiredDependencies = [
  'react',
  'react-dom',
  '@tanstack/react-router',
  '@tanstack/router-plugin',
  '@tanstack/router-cli',
  '@tanstack/react-form',
  '@tanstack/react-table',
  '@tanstack/react-virtual',
  'react-aria-components',
  'tailwindcss',
  '@tailwindcss/vite',
  'typescript',
  'vite',
  'vitest',
  '@testing-library/react',
  '@testing-library/jest-dom',
  '@testing-library/user-event',
  'playwright',
  '@axe-core/playwright',
  'storybook',
  '@storybook/react-vite',
  '@storybook/addon-a11y',
  '@storybook/addon-vitest',
  'eslint',
  'typescript-eslint',
  'prettier',
] as const

const scripts = [
  'dev',
  'build',
  'test',
  'test:watch',
  'test:stories',
  'test:e2e',
  'storybook',
  'build-storybook',
  'lint',
  'format',
  'format:check',
  'typecheck',
  'router:generate',
  'router:check',
  'verify:runtime-bundle',
] as const

describe('frontend baseline contract', () => {
  it('requires a private pnpm-managed ESM manifest with exact dependencies', () => {
    expect(existsSync(packagePath)).toBe(true)
    const manifest = JSON.parse(readFileSync(packagePath, 'utf8')) as {
      private?: boolean
      type?: string
      packageManager?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
    expect(manifest.private).toBe(true)
    expect(manifest.type).toBe('module')
    expect(manifest.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/)
    expect(manifest.packageManager).not.toMatch(/[~^*|>< ]/)
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    }
    for (const dependency of requiredDependencies) {
      expect(dependencies[dependency], dependency).toMatch(/^\d+\.\d+\.\d+$/)
    }
    expect(dependencies.react).toMatch(/^19\./)
    for (const script of scripts)
      expect(manifest.scripts?.[script], script).toBeTruthy()
  })

  it('requires the declared project boundaries and baseline configs', () => {
    for (const file of [
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'tsconfig.storybook.json',
      'tsr.config.json',
      'vitest.config.ts',
      'vitest.storybook.config.ts',
      'playwright.config.ts',
      'eslint.config.js',
      'prettier.config.mjs',
      '.storybook/main.ts',
      '.storybook/preview.ts',
      'tests/setup.ts',
    ])
      expect(existsSync(resolve(root, file)), file).toBe(true)
  })

  it('keeps product consumers absent for optional TanStack engines', () => {
    const sourceRoots = [resolve(root, 'src'), resolve(root, 'storybook')]
    for (const sourceRoot of sourceRoots) {
      if (!existsSync(sourceRoot)) continue
      expect(readSourceFiles(sourceRoot).join('\n')).not.toMatch(
        /@tanstack\/(react-form|react-table|react-virtual)/,
      )
    }
  })
})

function readSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return readSourceFiles(path)
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)
      ? [readFileSync(path, 'utf8')]
      : []
  })
}

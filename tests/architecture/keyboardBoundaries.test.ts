import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const keyboardFiles = [
  'src/shared/keyboard/KeyboardController.tsx',
  'src/shared/keyboard/keyboardArbitration.ts',
  'src/shared/keyboard/useGlobalCommandShortcut.ts',
  'src/app/shell/AppShell.tsx',
  'src/app/shell/CommandEntry.tsx',
  'src/app/shell/KeyboardHelpDialog.tsx',
  'src/features/catalog-hierarchy/NuevaClaseSurface.tsx',
]
const read = (file: string) => readFileSync(join(root, file), 'utf8')
const source = keyboardFiles.map(read).join('\n')

// prettier-ignore

describe('Keyboard First architecture boundaries', () => {
  it('keeps section 11 as the only canonical contract', () => {
    const brief = readFileSync(
      join(root, 'docs/erp-first-stage-design-brief.md'),
      'utf8',
    )
    const section = brief.match(
      /## 11\. Filosofía centrada en el teclado([\s\S]*?)(?=\n## 12\.)/,
    )?.[1]
    expect(section).toContain('regla permanente')
    expect(section).toContain('Tab')
    expect(section).toContain('Shift+Tab')
    expect(section).toContain('geometría física')
    expect(section).toContain('edición')
    expect(section).toContain('IME')
    expect(section).toContain('Nueva Clase')
    expect(section).toContain('Familia')
    expect(section).toContain('semántico')
    expect(section).toContain('Ctrl/Cmd + K')
    expect(section).toContain('Ctrl+N')
    expect(section).toContain('modal')
    expect(section).toContain('restaur')
    expect(section).toContain('diferid')
    const docNames = readdirSync(join(root, 'docs')).filter((name) =>
      /tecl|keyboard/i.test(name),
    )
    expect(docNames).toEqual([])
  })

  it('has exactly one shell-local document keyboard listener', () => {
    expect(
      keyboardFiles.filter((file) => /addEventListener\(['"]keydown/.test(read(file))),
    ).toEqual(['src/shared/keyboard/KeyboardController.tsx'])
    expect((source.match(/addEventListener\(['"]keydown/g) ?? []).length).toBe(1)
    expect(source).not.toMatch(/(?:window|document)\.onkeydown/)
  })

  it('does not capture prohibited global keys or install a document trap', () => {
    const controller = read('src/shared/keyboard/KeyboardController.tsx')
    expect(controller).not.toMatch(/event\.key\s*===\s*['"](?:Tab|Arrow(?:Up|Down|Left|Right)|Enter|Escape)['"]/) 
    expect(controller).not.toMatch(/Ctrl\+N|Control\+N|focus[- ]?trap|FocusTrap|sentinel/i)
    expect(source).not.toMatch(/document\.querySelectorAll\(['"][^'"]*focus/i)
    expect(source).not.toMatch(/tabIndex\s*=\s*-?1[\s\S]{0,120}(?:document|window)/i)
  })

  it('keeps runtime free of global stores, fixtures, backend, and future actions', () => {
    const runtimeFiles = readdirSync(join(root, 'src'), { recursive: true })
      .filter(
        (file): file is string =>
          typeof file === 'string' && /\.(ts|tsx)$/.test(file),
      )
    const runtime = runtimeFiles
      .map((file) => readFileSync(join(root, 'src', file), 'utf8'))
      .join('\n')
    const approvedConvexTransportAdapters = new Set([
      'features/catalog-hierarchy/catalogHierarchy.api.ts',
      'features/catalog-hierarchy/catalogTypeAttributes.api.ts',
    ])
    const runtimeWithoutApprovedConvexTransportAdapters = runtimeFiles
      .filter((file) => !approvedConvexTransportAdapters.has(file))
      .map((file) => readFileSync(join(root, 'src', file), 'utf8'))
      .join('\n')
    expect(runtime).not.toMatch(
      /(?:localStorage|sessionStorage|\bfetch\s*\(|storybook|runtimeFixture|fixture)/i,
    )
    expect(runtimeWithoutApprovedConvexTransportAdapters).not.toMatch(
      /\bconvex\b/i,
    )
    expect(runtime).not.toMatch(/(?:catalog\.new-recurso|new-recurso|Nueva\s+Recurso)/i)
    const keyboardContext = read('src/shared/keyboard/keyboardControllerContext.ts')
        expect(keyboardContext).toMatch(
          /ContextualActionId\s*=\s*[\s\S]*'catalog\.new-class'[\s\S]*'catalog\.new-family'[\s\S]*'catalog\.new-type'[\s\S]*'catalog\.edit-attribute'[\s\S]*'catalog\.manage-options'/,
        )
        expect(keyboardContext).not.toMatch(/ContextualActionId\s*=\s*string/)
        expect(runtime).not.toMatch(/(?:createStore|configureStore|zustand|redux)/i)
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
const keyboardRuntimeFiles = [
  'src/shared/keyboard/KeyboardController.tsx',
  'src/shared/keyboard/keyboardArbitration.ts',
  'src/shared/keyboard/keyboardCommandRegistry.ts',
  'src/shared/keyboard/keyboardControllerContext.ts',
  'src/shared/keyboard/spatialNavigation.ts',
  'src/shared/keyboard/focusRestoration.ts',
  'src/app/shell/AppShell.tsx',
  'src/app/shell/CommandEntry.tsx',
  'src/app/shell/KeyboardHelpDialog.tsx',
] as const

function runtimeSource(path: (typeof keyboardRuntimeFiles)[number]) {
  return readFileSync(resolve(root, path), 'utf8')
}

const keyboardRuntimeSource = keyboardRuntimeFiles.map(runtimeSource).join('\n')

describe('keyboard runtime boundaries', () => {
  it('keeps exactly one shell-local document keydown listener', () => {
    const controller = runtimeSource(
      'src/shared/keyboard/KeyboardController.tsx',
    )
    const listeners = keyboardRuntimeSource.match(
      /document\.addEventListener\(\s*['"]keydown['"]/g,
    )

    expect(listeners).toHaveLength(1)
    expect(controller).toMatch(
      /document\.addEventListener\(\s*['"]keydown['"]\s*,\s*handleKeyDown\)/,
    )
    expect(controller).toMatch(
      /document\.removeEventListener\(\s*['"]keydown['"]\s*,\s*handleKeyDown\)/,
    )
  })

  it('limits keyboard runtime dependencies and rejects global keyboard traps', () => {
    expect(keyboardRuntimeSource).not.toMatch(
      /from\s+['"][^'"]*(?:storybook|operationsInbox\.fixtures|@tanstack\/(?:react-form|react-table|react-virtual))[^'"]*['"]/,
    )
    expect(keyboardRuntimeSource).not.toMatch(
      /(?:window|document)\.onkey(?:down|up|press)\s*=/,
    )
    expect(keyboardRuntimeSource).not.toMatch(
      /(?:window|globalThis)\.addEventListener\(\s*['"]key(?:down|up|press)['"]/,
    )
  })
})

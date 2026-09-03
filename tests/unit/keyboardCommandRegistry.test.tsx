import { describe, expect, it } from 'vitest'
import { createKeyboardCommandRegistry } from '../../src/shared/keyboard/keyboardCommandRegistry'

describe('keyboard command registry', () => {
  it('publishes active commands and removes only its own registration', () => {
    const registry = createKeyboardCommandRegistry()
    const root = document.createElement('button')
    const command = {
      id: 'catalog.new-class',
      key: 'n',
      shortcut: 'N',
      label: 'Nueva Clase',
      group: 'Catálogo',
      scope: 'active-surface' as const,
      surface: 'catalog' as const,
      root: () => root,
      isAvailable: () => true,
      action: () => undefined,
    }
    const remove = registry.register(command)
    expect(registry.getSnapshot()).toEqual([command])
    const replacement = { ...command, action: () => undefined }
    const removeReplacement = registry.register(replacement)
    remove()
    expect(registry.getSnapshot()).toEqual([replacement])
    removeReplacement()
    expect(registry.getSnapshot()).toEqual([])
  })
})

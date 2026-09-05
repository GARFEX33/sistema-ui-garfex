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

  it('resolves registered shortcut aliases within the active surface', () => {
    const registry = createKeyboardCommandRegistry()
    const root = document.createElement('button')
    const command = {
      id: 'catalog.edit-attribute',
      key: 'e',
      keys: ['e', 'Enter'],
      shortcut: 'Enter / E',
      label: 'Editar atributo',
      group: 'Catálogo',
      scope: 'active-surface' as const,
      surface: 'catalog' as const,
      root: () => root,
      isAvailable: () => true,
      action: () => undefined,
    }
    registry.register(command)

    expect(registry.resolve('e', 'catalog')).toBe(command)
    expect(registry.resolve('Enter', 'catalog')).toBe(command)
    expect(registry.resolve('e', 'bandeja')).toBeUndefined()
  })
})

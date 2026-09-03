import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
import { useKeyboardController } from '../../src/shared/keyboard/keyboardControllerContext'
import { createKeyboardCommandRegistry } from '../../src/shared/keyboard/keyboardCommandRegistry'
import { restoreFocusNextFrame } from '../../src/shared/keyboard/focusRestoration'
import { useGlobalCommandShortcut } from '../../src/shared/keyboard/useGlobalCommandShortcut'

const command = (id: string, action = vi.fn()) => ({
  id,
  key: 'x',
  shortcut: 'X',
  label: id,
  group: 'test',
  scope: 'global' as const,
  root: () => document.body,
  isAvailable: () => true,
  action,
})

describe('keyboard controller core', () => {
  it('keeps replacement registration identity-safe and publishes snapshots', () => {
    const registry = createKeyboardCommandRegistry()
    const first = command('same')
    const replacement = command('same')
    const listener = vi.fn()
    registry.subscribe(listener)
    const removeFirst = registry.register(first)
    registry.register(replacement)
    removeFirst()
    expect(registry.getSnapshot()).toEqual([replacement])
    expect(listener).toHaveBeenCalledTimes(2)

    const catalog = {
      ...command('catalog'),
      key: 'n',
      scope: 'active-surface' as const,
      surface: 'catalog' as const,
    }
    registry.register(catalog)
    expect(registry.resolve('n', 'catalog')).toBe(catalog)
    expect(registry.resolve('n', 'bandeja')).toBeUndefined()
  })

  it('dispatches the palette from one live provider listener and gives overlays precedence', () => {
    const open = vi.fn()
    const addSpy = vi.spyOn(document, 'addEventListener')
    function Consumer() {
      const { registerOverlay } = useKeyboardController()
      return (
        <button
          onClick={() => registerOverlay(() => screen.queryByRole('dialog'))}
        >
          overlay
        </button>
      )
    }
    const { unmount } = render(
      <KeyboardControllerProvider
        activeSurface="bandeja"
        onCommandPalette={open}
      >
        <Consumer />
      </KeyboardControllerProvider>,
    )
    expect(
      addSpy.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(1)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(open).toHaveBeenCalledTimes(1)
    expect(
      addSpy.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(1)
    const overlayButton = screen.getByRole('button', { name: 'overlay' })
    fireEvent.click(overlayButton)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(open).toHaveBeenCalledTimes(1)
    dialog.remove()
    addSpy.mockRestore()
    unmount()
  })

  it('accepts the compatibility shortcut hook without adding a listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    function Consumer() {
      useGlobalCommandShortcut(vi.fn(), false)
      return null
    }
    const { unmount } = render(<Consumer />)
    expect(
      addSpy.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(0)
    unmount()
    addSpy.mockRestore()
  })

  it('restores focus immediately or to a valid fallback', () => {
    const opener = document.createElement('button')
    const fallback = document.createElement('button')
    fallback.textContent = 'fallback'
    fallback.disabled = true
    document.body.append(opener, fallback)
    opener.focus()
    opener.remove()
    restoreFocusNextFrame(opener, [() => fallback, () => document.body])
    expect(document.activeElement).toBe(document.body)
  })
})

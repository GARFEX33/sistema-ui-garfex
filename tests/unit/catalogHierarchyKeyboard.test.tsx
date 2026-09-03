import { fireEvent, render } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
import { useKeyboardController } from '../../src/shared/keyboard/keyboardControllerContext'
import { arbitrateKeyboardEvent } from '../../src/shared/keyboard/keyboardArbitration'
import { focusSpatialTarget } from '../../src/shared/keyboard/spatialNavigation'

function Action({
  id = 'catalog.new-class',
  available = true,
  run,
}: {
  id?: 'catalog.new-class' | 'catalog.new-family' | 'catalog.new-type'
  available?: boolean
  run: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const { registerAction } = useKeyboardController()

  useEffect(
    () =>
      registerAction({
        id,
        surface: 'catalog',
        key: 'n',
        label: 'Nueva Clase',
        root: () => ref.current,
        isAvailable: () => available,
        run,
      }),
    [available, registerAction, run],
  )
  return <button ref={ref}>Nueva Clase</button>
}

function renderKeyboard(run = vi.fn(), available = true) {
  return render(
    <KeyboardControllerProvider
      activeSurface="catalog"
      onCommandPalette={vi.fn()}
      onHelp={vi.fn()}
    >
      <Action run={run} available={available} />
    </KeyboardControllerProvider>,
  )
}

describe('Catalogo Keyboard First integration', () => {
  it('uses the real enabled Nueva Clase action for N only', () => {
    const run = vi.fn()
    const view = renderKeyboard(run)
    const button = document.querySelector('button')!

    fireEvent.keyDown(button, { key: 'n' })
    expect(run).toHaveBeenCalledTimes(1)
    view.unmount()

    renderKeyboard(run, false)
    fireEvent.keyDown(document.querySelector('button')!, { key: 'n' })
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('cleans up the previous contextual action when the mounted surface changes', () => {
    const oldRun = vi.fn()
    const nextRun = vi.fn()
    const view = renderKeyboard(oldRun)
    view.rerender(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={vi.fn()}
        onHelp={vi.fn()}
      >
        <Action id="catalog.new-family" run={nextRun} />
      </KeyboardControllerProvider>,
    )
    fireEvent.keyDown(document, { key: 'n' })
    expect(oldRun).not.toHaveBeenCalled()
    expect(nextRun).toHaveBeenCalledTimes(1)
  })

  it('gives editing, IME and defaultPrevented precedence', () => {
    const input = document.createElement('input')
    document.body.append(input)
    const editing = new KeyboardEvent('keydown', { key: 'n', bubbles: true })
    Object.defineProperty(editing, 'target', { value: input })

    expect(arbitrateKeyboardEvent(editing).owner).toBe('editing')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'n', isComposing: true }),
      ).owner,
    ).toBe('editing')
    const prevented = new KeyboardEvent('keydown', {
      key: 'n',
      cancelable: true,
    })
    prevented.preventDefault()
    expect(arbitrateKeyboardEvent(prevented).reason).toBe('prevented')
    input.remove()
  })

  it('keeps Tab/Enter/Escape native and arrows physical', () => {
    const root = document.createElement('div')
    const origin = document.createElement('button')
    const target = document.createElement('button')
    origin.dataset.spatialId = 'origin'
    target.dataset.spatialId = 'target'
    root.append(origin, target)
    document.body.append(root)
    const rects = new Map([
      [origin, { left: 0, top: 0, right: 10, bottom: 10 }],
      [target, { left: 20, top: 0, right: 30, bottom: 10 }],
    ])
    vi.spyOn(origin, 'getClientRects').mockReturnValue({
      length: 1,
    } as DOMRectList)
    vi.spyOn(target, 'getClientRects').mockReturnValue({
      length: 1,
    } as DOMRectList)
    origin.focus()

    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: root,
        candidates: [target],
        measure: (node) => rects.get(node) ?? null,
      }).status,
    ).toBe('moved')
    expect(
      arbitrateKeyboardEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
        .reason,
    ).toBe('tab-pass-through')
    expect(
      arbitrateKeyboardEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
        .preventDefault,
    ).toBe(false)
    expect(
      arbitrateKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        .preventDefault,
    ).toBe(false)
    root.remove()
  })

  it('keeps forward and reverse Tab native and recognizes the exact Mac shortcut', () => {
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
      ).reason,
    ).toBe('tab-pass-through')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
        { platform: 'mac' },
      ).action,
    ).toBe('command-palette')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
        { platform: 'mac' },
      ).action,
    ).not.toBe('command-palette')
  })

  it('uses visibility and physical geometry rather than representational ordering', () => {
    const root = document.createElement('div')
    const origin = document.createElement('button')
    const hidden = document.createElement('button')
    const disabled = document.createElement('button')
    const outside = document.createElement('button')
    const physical = document.createElement('button')
    const activeButFar = document.createElement('button')
    root.append(origin, hidden, disabled, outside, physical, activeButFar)
    document.body.append(root)
    origin.dataset.spatialId = 'origin'
    hidden.dataset.spatialId = 'hidden-first'
    disabled.dataset.spatialId = 'disabled'
    outside.dataset.spatialId = 'outside'
    physical.dataset.spatialId = 'physical-target'
    activeButFar.dataset.spatialId = 'active-text-column'
    activeButFar.dataset.active = 'true'
    activeButFar.dataset.column = 'first'
    hidden.hidden = true
    disabled.disabled = true
    const rects = new Map([
      [origin, { left: 0, top: 0, right: 10, bottom: 10 }],
      [hidden, { left: 12, top: 0, right: 22, bottom: 10 }],
      [disabled, { left: 14, top: 0, right: 24, bottom: 10 }],
      [outside, { left: 200, top: 0, right: 210, bottom: 10 }],
      [physical, { left: 20, top: 0, right: 30, bottom: 10 }],
      [activeButFar, { left: 80, top: 0, right: 90, bottom: 10 }],
    ])
    for (const element of [
      origin,
      hidden,
      disabled,
      outside,
      physical,
      activeButFar,
    ]) {
      vi.spyOn(element, 'getClientRects').mockReturnValue({
        length: 1,
      } as DOMRectList)
    }
    origin.focus()

    expect(
      focusSpatialTarget({
        origin,
        direction: 'right',
        boundaryRoot: root,
        candidates: [hidden, disabled, outside, activeButFar, physical],
        measure: (node) => rects.get(node) ?? null,
        viewport: { left: 0, top: 0, right: 100, bottom: 100 },
      }),
    ).toMatchObject({ status: 'moved', id: 'physical-target' })
    expect(document.activeElement).toBe(physical)
    root.remove()
  })

  it('uses semantic help and exact shortcuts, leaving Ctrl+N reserved', () => {
    expect(
      arbitrateKeyboardEvent(new KeyboardEvent('keydown', { key: '?' })).action,
    ).toBe('contextual-help')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: '/', shiftKey: true }),
      ).action,
    ).not.toBe('contextual-help')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
      ).action,
    ).toBe('command-palette')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          shiftKey: true,
        }),
      ).action,
    ).not.toBe('command-palette')
    expect(
      arbitrateKeyboardEvent(
        new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }),
      ).reason,
    ).toBe('reserved-browser-command')
  })
})

import { describe, expect, it } from 'vitest'
import {
  arbitrateKeyboardEvent,
  shouldOpenGlobalCommand,
} from '../../src/shared/keyboard/keyboardArbitration'
function keyEvent(
  init: KeyboardEventInit & {
    target?: EventTarget | null
    keyCode?: number
    altGraph?: boolean
  } = {},
) {
  const { target, keyCode, altGraph, ...rest } = init
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    cancelable: true,
    ...rest,
  })
  if (target !== undefined)
    Object.defineProperty(event, 'target', {
      configurable: true,
      value: target,
    })
  if (keyCode !== undefined)
    Object.defineProperty(event, 'keyCode', {
      configurable: true,
      value: keyCode,
    })
  if (altGraph !== undefined)
    Object.defineProperty(event, 'getModifierState', {
      configurable: true,
      value: (name: string) => name === 'AltGraph' && altGraph,
    })
  return event
}
const editingNodes = [
  'input',
  'textarea',
  'select',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="combobox"]',
  '[role="spinbutton"]',
]
describe('global command keyboard arbitration', () => {
  it.each(editingNodes)('suspends shortcuts for %s', (selector) => {
    const node = selector.startsWith('[')
      ? Object.assign(document.createElement('div'), {
          role: selector.slice(7, -2),
        })
      : document.createElement(selector)
    document.body.append(node)
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'n', target: node })),
    ).toMatchObject({
      owner: 'editing',
      reason: 'editing',
      preventDefault: false,
    })
    node.remove()
  })
  it('detects editable descendants, composed paths, and data markers', () => {
    const editor = document.createElement('div'),
      child = document.createElement('span')
    editor.setAttribute('contenteditable', 'plaintext-only')
    editor.dataset.keyboardEditing = 'true'
    editor.append(child)
    document.body.append(editor)
    const event = keyEvent({ key: '?', target: child })
    Object.defineProperty(event, 'composedPath', {
      value: () => [child, editor, document.body, document],
    })
    expect(arbitrateKeyboardEvent(event).reason).toBe('editing')
    editor.remove()
  })
  it('allows a false contenteditable boundary and blocks its marker', () => {
    const editor = document.createElement('div'),
      boundary = document.createElement('div'),
      button = document.createElement('button')
    editor.setAttribute('contenteditable', 'true')
    boundary.setAttribute('contenteditable', 'false')
    boundary.append(button)
    editor.append(boundary)
    document.body.append(editor)
    expect(
      arbitrateKeyboardEvent(
        keyEvent({ key: 'n', ctrlKey: false, target: button }),
      ).reason,
    ).toBe('contextual-new')
    boundary.dataset.keyboardEditing = 'true'
    expect(
      arbitrateKeyboardEvent(
        keyEvent({ key: 'n', ctrlKey: false, target: button }),
      ).reason,
    ).toBe('editing')
    editor.remove()
  })
  it('gives composition and IME keyCode precedence', () => {
    expect(arbitrateKeyboardEvent(keyEvent({ isComposing: true })).reason).toBe(
      'composing',
    )
    expect(arbitrateKeyboardEvent(keyEvent({ keyCode: 229 })).reason).toBe(
      'composing',
    )
  })
  it.each(['input', 'textarea', 'select'])(
    'does not claim physical Left from %s',
    (tag) => {
      const target = document.createElement(tag)
      document.body.append(target)
      expect(
        arbitrateKeyboardEvent(
          keyEvent({ key: 'ArrowLeft', ctrlKey: false, target }),
        ).reason,
      ).toBe('editing')
      target.remove()
    },
  )
  it.each([
    [{ localConsumed: true }, 'local', 'consumed'],
    [{ featureConsumed: true }, 'local', 'consumed'],
    [{ overlayOpen: true }, 'overlay', 'overlay-active'],
  ])('keeps later levels from owning %j', (context, owner, reason) =>
    expect(arbitrateKeyboardEvent(keyEvent(), context)).toMatchObject({
      owner,
      reason,
    }),
  )
  it('places an active overlay above feature consumption', () =>
    expect(
      arbitrateKeyboardEvent(keyEvent(), {
        featureConsumed: true,
        overlayOpen: true,
      }),
    ).toMatchObject({ owner: 'overlay', reason: 'overlay-active' }))
  it('respects prevented and locally consumed valid shortcuts', () => {
    const event = keyEvent()
    event.preventDefault()
    expect(arbitrateKeyboardEvent(event)).toMatchObject({
      owner: 'local',
      reason: 'prevented',
      preventDefault: false,
    })
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'k' }), { localConsumed: true }),
    ).toMatchObject({ owner: 'local', reason: 'consumed', action: null })
  })
  it('rejects modifiers without requesting prevention', () => {
    const cases: [KeyboardEventInit & { altGraph?: boolean }, string][] = [
      [{ key: 'ArrowRight', shiftKey: true }, 'modifier'],
      [{ key: 'ArrowLeft', ctrlKey: true }, 'modifier'],
      [{ key: 'n', altKey: true }, 'modifier'],
      [{ key: 'N', metaKey: true }, 'modifier'],
      [{ key: '?', ctrlKey: true }, 'modifier'],
      [{ key: '?', altKey: true }, 'modifier'],
      [{ key: '?', ctrlKey: true, altKey: true, altGraph: false }, 'modifier'],
      [{ key: 'k', ctrlKey: true, shiftKey: true }, 'modifier'],
      [{ key: 'k', ctrlKey: true, altKey: true }, 'modifier'],
      [{ key: 'k', ctrlKey: true, metaKey: true }, 'modifier'],
    ]
    for (const [init, reason] of cases)
      expect(arbitrateKeyboardEvent(keyEvent(init))).toMatchObject({
        reason,
        preventDefault: false,
      })
  })
  it('passes Tab and recognizes semantic help, not physical slash', () => {
    expect(arbitrateKeyboardEvent(keyEvent({ key: 'Tab' })).reason).toBe(
      'tab-pass-through',
    )
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'Tab', shiftKey: true })).reason,
    ).toBe('tab-pass-through')
    for (const init of [
      { key: '?', ctrlKey: false },
      { key: '?', ctrlKey: false, shiftKey: true },
      { key: '?', ctrlKey: true, altKey: true, altGraph: true },
    ])
      expect(arbitrateKeyboardEvent(keyEvent(init)).action).toBe(
        'contextual-help',
      )
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: '/', shiftKey: true })).reason,
    ).toBe('no-action')
  })
  it('recognizes N and keeps Ctrl+N reserved', () => {
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'n', ctrlKey: false })).action,
    ).toBe('contextual-new')
    expect(
      arbitrateKeyboardEvent(
        keyEvent({ key: 'N', ctrlKey: false, shiftKey: true }),
      ).action,
    ).toBe('contextual-new')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'n', ctrlKey: true })),
    ).toMatchObject({
      owner: 'browser',
      reason: 'reserved-browser-command',
      preventDefault: false,
    })
    expect(
      arbitrateKeyboardEvent(
        keyEvent({ key: 'n', ctrlKey: true, shiftKey: true }),
      ).reason,
    ).toBe('reserved-browser-command')
  })
  it('recognizes unmodified attribute action shortcuts without claiming modified keys', () => {
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'e', ctrlKey: false })).action,
    ).toBe('contextual-edit')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'Enter', ctrlKey: false })).action,
    ).toBe('contextual-edit')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'o', ctrlKey: false })).action,
    ).toBe('contextual-options')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'b', ctrlKey: false })).action,
    ).toBe('contextual-search')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'e', ctrlKey: true })).reason,
    ).toBe('modifier')
    expect(
      arbitrateKeyboardEvent(keyEvent({ key: 'b', ctrlKey: true })).reason,
    ).toBe('modifier')
  })
  it('preserves exact platform Ctrl/Cmd+K without side effects', () => {
    const windows = keyEvent({ key: 'k', ctrlKey: true })
    expect(shouldOpenGlobalCommand(windows, { platform: 'other' })).toBe(true)
    expect(windows.defaultPrevented).toBe(false)
    expect(
      shouldOpenGlobalCommand(
        keyEvent({ key: 'k', metaKey: true, ctrlKey: false }),
        { platform: 'mac' },
      ),
    ).toBe(true)
    for (const init of [
      { key: 'k', ctrlKey: true, metaKey: true },
      { key: 'k', ctrlKey: true, shiftKey: true },
      { key: 'k', ctrlKey: true, altKey: true },
    ])
      expect(
        shouldOpenGlobalCommand(keyEvent(init), { platform: 'other' }),
      ).toBe(false)
  })
})

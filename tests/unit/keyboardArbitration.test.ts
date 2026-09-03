import { describe, expect, it } from 'vitest'
import {
  arbitrateKeyboardEvent,
  shouldOpenGlobalCommand,
} from '../../src/shared/keyboard/keyboardArbitration'

function keyEvent(
  init: KeyboardEventInit & {
    target?: EventTarget | null
    keyCode?: number
    composedPath?: () => EventTarget[]
  } = {},
) {
  const { target, keyCode, composedPath, ...eventInit } = init
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    cancelable: true,
    ...eventInit,
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
  if (composedPath)
    Object.defineProperty(event, 'composedPath', {
      configurable: true,
      value: composedPath,
    })
  return event
}

describe('global command keyboard arbitration', () => {
  it('returns a pure command-palette decision without preventing the event', () => {
    const event = keyEvent()
    expect(arbitrateKeyboardEvent(event, { platform: 'other' })).toEqual({
      action: 'command-palette',
      owner: 'command-palette',
      reason: 'command-palette',
      preventDefault: false,
    })
    expect(event.defaultPrevented).toBe(false)
  })

  it('gives editable and IME contexts precedence', () => {
    const input = document.createElement('input')
    const falseBoundary = document.createElement('div')
    falseBoundary.contentEditable = 'false'
    falseBoundary.append(input)
    document.body.append(falseBoundary)
    expect(arbitrateKeyboardEvent(keyEvent({ target: input }))).toMatchObject({
      action: null,
      owner: 'editing',
      reason: 'editing',
    })
    expect(
      arbitrateKeyboardEvent(keyEvent({ ctrlKey: false, isComposing: true }))
        .reason,
    ).toBe('composing')
    expect(
      arbitrateKeyboardEvent(keyEvent({ ctrlKey: false, keyCode: 229 })).reason,
    ).toBe('composing')
    for (const key of ['n', 'ArrowLeft']) {
      expect(
        arbitrateKeyboardEvent(
          keyEvent({ key, ctrlKey: false, target: input }),
        ),
      ).toMatchObject({ action: null, reason: 'editing' })
    }
    falseBoundary.remove()
  })

  it('recognizes roles, markers, descendants and false contenteditable boundaries', () => {
    for (const role of ['textbox', 'searchbox', 'combobox', 'spinbutton']) {
      const element = document.createElement('div')
      element.setAttribute('role', role)
      expect(arbitrateKeyboardEvent(keyEvent({ target: element })).reason).toBe(
        'editing',
      )
    }
    const marked = document.createElement('div')
    marked.dataset.keyboardEditing = 'true'
    expect(arbitrateKeyboardEvent(keyEvent({ target: marked })).reason).toBe(
      'editing',
    )
    marked.dataset.keyboardEditing = 'false'
    expect(arbitrateKeyboardEvent(keyEvent({ target: marked })).reason).toBe(
      'command-palette',
    )

    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'plaintext-only')
    const child = document.createElement('span')
    editable.append(child)
    expect(arbitrateKeyboardEvent(keyEvent({ target: child })).reason).toBe(
      'editing',
    )

    const outerEditor = document.createElement('div')
    outerEditor.contentEditable = 'true'
    const boundary = document.createElement('div')
    boundary.contentEditable = 'false'
    const nested = document.createElement('span')
    boundary.append(nested)
    outerEditor.append(boundary)
    document.body.append(outerEditor)
    expect(
      arbitrateKeyboardEvent(
        keyEvent({ key: 'n', ctrlKey: false, target: nested }),
      ).reason,
    ).toBe('keyboard-command')
    outerEditor.remove()
  })

  it('recognizes editable composed-path entries', () => {
    const input = document.createElement('input')
    const event = keyEvent({
      target: null,
      composedPath: () => [input, document],
    })
    expect(arbitrateKeyboardEvent(event).reason).toBe('editing')
  })

  it('reports arbitration precedence and platform modifiers', () => {
    const consumed = keyEvent()
    consumed.preventDefault()
    expect(arbitrateKeyboardEvent(consumed).reason).toBe('prevented')
    expect(
      arbitrateKeyboardEvent(keyEvent(), { featureConsumed: true }).reason,
    ).toBe('consumed')
    expect(
      arbitrateKeyboardEvent(keyEvent(), { overlayOpen: true }).reason,
    ).toBe('overlay')
    expect(arbitrateKeyboardEvent(keyEvent({ key: 'x' })).reason).toBe('none')
    expect(
      arbitrateKeyboardEvent(keyEvent({ ctrlKey: false, metaKey: true }), {
        platform: 'mac',
      }).action,
    ).toBe('command-palette')
    expect(
      arbitrateKeyboardEvent(keyEvent({ ctrlKey: true, metaKey: true })).reason,
    ).toBe('modifier')
    expect(arbitrateKeyboardEvent(keyEvent({ key: 'Enter' })).reason).toBe(
      'none',
    )
    for (const event of [
      keyEvent({ key: 'n', ctrlKey: true }),
      keyEvent({ key: 'ArrowRight', metaKey: true, ctrlKey: false }),
    ]) {
      expect(arbitrateKeyboardEvent(event).action).toBeNull()
      expect(event.defaultPrevented).toBe(false)
    }
  })

  it('keeps the compatibility wrapper boolean and prevents only accepted commands', () => {
    const accepted = keyEvent()
    expect(shouldOpenGlobalCommand(accepted)).toBe(true)
    expect(accepted.defaultPrevented).toBe(true)
    const rejected = keyEvent({ key: 'x' })
    expect(shouldOpenGlobalCommand(rejected)).toBe(false)
    expect(rejected.defaultPrevented).toBe(false)
  })
})

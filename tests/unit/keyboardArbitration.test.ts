import { describe, expect, it } from 'vitest'
import { shouldOpenGlobalCommand } from '../../src/shared/keyboard/keyboardArbitration'

function keyEvent(
  init: KeyboardEventInit & {
    target?: EventTarget | null
    keyCode?: number
  } = {},
) {
  const { target, keyCode, ...eventInit } = init
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    cancelable: true,
    ...eventInit,
  })
  if (target)
    Object.defineProperty(event, 'target', {
      configurable: true,
      value: target,
    })
  if (keyCode)
    Object.defineProperty(event, 'keyCode', {
      configurable: true,
      value: keyCode,
    })
  return event
}

describe('global command keyboard arbitration', () => {
  it('gives editable and IME contexts precedence', () => {
    const input = document.createElement('input')
    document.body.append(input)
    expect(shouldOpenGlobalCommand(keyEvent({ target: input }))).toBe(false)
    expect(shouldOpenGlobalCommand(keyEvent({ isComposing: true }))).toBe(false)
    expect(shouldOpenGlobalCommand(keyEvent({ keyCode: 229 }))).toBe(false)
    input.remove()
  })

  it('gives consumed composites and overlays precedence', () => {
    const consumed = keyEvent()
    consumed.preventDefault()
    expect(shouldOpenGlobalCommand(consumed)).toBe(false)
    expect(shouldOpenGlobalCommand(keyEvent(), { overlayOpen: true })).toBe(
      false,
    )
    expect(shouldOpenGlobalCommand(keyEvent(), { featureConsumed: true })).toBe(
      false,
    )
  })

  it('opens only for the exact platform modifier and key', () => {
    expect(
      shouldOpenGlobalCommand(
        keyEvent({
          ctrlKey: true,
          metaKey: false,
          altKey: false,
          shiftKey: false,
        }),
      ),
    ).toBe(true)
    expect(
      shouldOpenGlobalCommand(keyEvent({ ctrlKey: true, shiftKey: true })),
    ).toBe(false)
    expect(
      shouldOpenGlobalCommand(keyEvent({ key: 'Enter', ctrlKey: true })),
    ).toBe(false)
    expect(
      shouldOpenGlobalCommand(
        keyEvent({ key: 'k', ctrlKey: true, altKey: true }),
      ),
    ).toBe(false)
  })
})

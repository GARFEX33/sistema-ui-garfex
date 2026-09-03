export type KeyboardArbitrationAction = 'command-palette' | null
export type KeyboardArbitrationOwner =
  | 'command-palette'
  | 'editing'
  | 'ime'
  | 'prevented'
  | 'consumed'
  | 'overlay'
  | 'modifier'
  | 'none'
export type KeyboardArbitrationReason =
  | 'editing'
  | 'composing'
  | 'prevented'
  | 'consumed'
  | 'overlay'
  | 'modifier'
  | 'command-palette'
  | 'none'

export interface KeyboardArbitrationDecision {
  action: KeyboardArbitrationAction
  owner: KeyboardArbitrationOwner
  reason: KeyboardArbitrationReason
  preventDefault: false
}

export interface KeyboardArbitrationContext {
  overlayOpen?: boolean
  featureConsumed?: boolean
  platform?: 'mac' | 'other'
}

type KeyboardNoActionReason =
  | 'editing'
  | 'prevented'
  | 'consumed'
  | 'overlay'
  | 'modifier'
  | 'none'

function noAction(reason: KeyboardNoActionReason): KeyboardArbitrationDecision {
  return { action: null, owner: reason, reason, preventDefault: false }
}

export function arbitrateKeyboardEvent(
  event: KeyboardEvent,
  context: KeyboardArbitrationContext = {},
): KeyboardArbitrationDecision {
  if (event.isComposing || event.keyCode === 229)
    return {
      action: null,
      owner: 'ime',
      reason: 'composing',
      preventDefault: false,
    }
  if (isEditableContext(event)) return noAction('editing')
  if (event.defaultPrevented) return noAction('prevented')
  if (context.featureConsumed) return noAction('consumed')
  if (context.overlayOpen) return noAction('overlay')

  const platform =
    context.platform ??
    (/Mac|iPhone|iPad/.test(
      typeof navigator === 'undefined' ? '' : navigator.platform,
    )
      ? 'mac'
      : 'other')
  const hasExactPlatformModifier =
    platform === 'mac'
      ? event.metaKey && !event.ctrlKey
      : event.ctrlKey && !event.metaKey
  const hasUnsupportedModifier = event.altKey || event.shiftKey

  if (event.key.toLowerCase() !== 'k') return noAction('none')
  if (!hasExactPlatformModifier || hasUnsupportedModifier)
    return noAction('modifier')
  return {
    action: 'command-palette',
    owner: 'command-palette',
    reason: 'command-palette',
    preventDefault: false,
  }
}

export function shouldOpenGlobalCommand(
  event: KeyboardEvent,
  context: KeyboardArbitrationContext = {},
): boolean {
  const decision = arbitrateKeyboardEvent(event, context)
  if (decision.action !== 'command-palette') return false
  event.preventDefault()
  return true
}

function isEditableContext(event: KeyboardEvent): boolean {
  let contentEditableBlocked = false
  for (const candidate of eventPath(event)) {
    if (!(candidate instanceof Element)) continue
    const tag = candidate.tagName.toLowerCase()
    const role = candidate.getAttribute('role')?.toLowerCase()
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      role === 'textbox' ||
      role === 'searchbox' ||
      role === 'combobox' ||
      role === 'spinbutton' ||
      candidate.hasAttribute('aria-autocomplete') ||
      candidate.getAttribute('data-keyboard-editing') === 'true'
    )
      return true

    const contentEditable = candidate.getAttribute('contenteditable')
    if (contentEditable?.toLowerCase() === 'false')
      contentEditableBlocked = true
    if (
      !contentEditableBlocked &&
      (contentEditable === '' ||
        contentEditable?.toLowerCase() === 'true' ||
        contentEditable?.toLowerCase() === 'plaintext-only' ||
        (candidate instanceof HTMLElement && candidate.isContentEditable))
    )
      return true
  }
  return false
}

function eventPath(event: KeyboardEvent): EventTarget[] {
  const composed = event.composedPath?.()
  if (composed?.length) return composed
  const path: EventTarget[] = []
  let current = event.target
  while (current) {
    path.push(current)
    current = current instanceof Node ? current.parentNode : null
  }
  return path
}

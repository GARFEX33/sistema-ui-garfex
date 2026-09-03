export type KeyboardPlatform = 'mac' | 'other'
export type KeyboardAction =
  | 'command-palette'
  | 'contextual-new'
  | 'contextual-help'
  | 'spatial-navigation'
  | null
export type KeyboardOwner =
  | 'editing'
  | 'local'
  | 'overlay'
  | 'browser'
  | 'global'
  | 'none'
export type KeyboardReason =
  | 'editing'
  | 'composing'
  | 'prevented'
  | 'consumed'
  | 'overlay-active'
  | 'modifier'
  | 'tab-pass-through'
  | 'reserved-browser-command'
  | 'command-palette'
  | 'contextual-new'
  | 'contextual-help'
  | 'no-action'
export interface KeyboardArbitrationDecision {
  owner: KeyboardOwner
  reason: KeyboardReason
  action: KeyboardAction
  preventDefault: false
}
export type EditablePredicate = (element: Element) => boolean
export interface EditableContextOptions {
  additionalEditablePredicates?: readonly EditablePredicate[]
}
export interface KeyboardArbitrationContext extends EditableContextOptions {
  overlayOpen?: boolean
  activeOverlay?: boolean
  featureConsumed?: boolean
  localConsumed?: boolean
  platform?: KeyboardPlatform
}

const editableRoles = new Set([
  'textbox',
  'searchbox',
  'combobox',
  'spinbutton',
])
const decision = (
  owner: KeyboardOwner,
  reason: KeyboardReason,
  action: KeyboardAction = null,
): KeyboardArbitrationDecision => ({
  owner,
  reason,
  action,
  preventDefault: false,
})

export function arbitrateKeyboardEvent(
  event: KeyboardEvent,
  context: KeyboardArbitrationContext = {},
): KeyboardArbitrationDecision {
  if (event.isComposing || event.keyCode === 229)
    return decision('editing', 'composing')
  if (isEditableContext(event, context)) return decision('editing', 'editing')
  if (event.defaultPrevented) return decision('local', 'prevented')
  if (context.localConsumed) return decision('local', 'consumed')
  const key = event.key,
    lowerKey = key.toLowerCase()
  if (key === 'Tab') return decision('none', 'tab-pass-through')
  if (lowerKey === 'n' && event.ctrlKey && !event.metaKey && !event.altKey)
    return decision('browser', 'reserved-browser-command')
  if (context.overlayOpen || context.activeOverlay)
    return decision('overlay', 'overlay-active')
  if (context.featureConsumed) return decision('local', 'consumed')
  if (lowerKey === 'k') {
    const mac = (context.platform ?? detectPlatform()) === 'mac'
    const exact = mac
      ? event.metaKey && !event.ctrlKey
      : event.ctrlKey && !event.metaKey
    if (exact && !event.shiftKey && !event.altKey)
      return decision('global', 'command-palette', 'command-palette')
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return decision('none', 'modifier')
  }
  if (lowerKey === 'n') {
    if (!event.ctrlKey && !event.metaKey && !event.altKey)
      return decision('global', 'contextual-new', 'contextual-new')
    return decision('none', 'modifier')
  }
  if (key === '?') {
    const altGraph = event.getModifierState?.('AltGraph') ?? false
    const valid =
      !event.metaKey &&
      ((!event.ctrlKey && !event.altKey) ||
        (event.ctrlKey && event.altKey && altGraph))
    return valid
      ? decision('global', 'contextual-help', 'contextual-help')
      : decision('none', 'modifier')
  }
  if (/^Arrow(?:Up|Down|Left|Right)$/.test(key)) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return decision('none', 'modifier')
    return decision('none', 'no-action', 'spatial-navigation')
  }
  return decision('none', 'no-action')
}

export function shouldOpenGlobalCommand(
  event: KeyboardEvent,
  context: KeyboardArbitrationContext = {},
): boolean {
  return arbitrateKeyboardEvent(event, context).action === 'command-palette'
}

export function isEditableContext(
  event: KeyboardEvent,
  options: EditableContextOptions = {},
): boolean {
  let blocked = false
  for (const item of eventPath(event)) {
    if (!(item instanceof Element)) continue
    if (
      options.additionalEditablePredicates?.some((predicate) => predicate(item))
    )
      return true
    const tag = item.tagName.toLowerCase(),
      role = item.getAttribute('role')?.toLowerCase()
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (role !== undefined && editableRoles.has(role))
    )
      return true
    if (
      item.hasAttribute('aria-autocomplete') ||
      item.getAttribute('data-keyboard-editing') === 'true'
    )
      return true
    const editable = item.getAttribute('contenteditable')
    if (editable === 'false') blocked = true
    if (
      !blocked &&
      (editable === '' ||
        editable === 'true' ||
        editable === 'plaintext-only' ||
        (item instanceof HTMLElement && item.isContentEditable))
    )
      return true
  }
  return false
}

function eventPath(event: KeyboardEvent): EventTarget[] {
  if (typeof event.composedPath === 'function') {
    const path = event.composedPath()
    if (path.length) return path
  }
  const path: EventTarget[] = []
  let current = event.target
  while (current) {
    path.push(current)
    current =
      typeof Node !== 'undefined' && current instanceof Node
        ? current.parentNode
        : null
  }
  return path
}
function detectPlatform(): KeyboardPlatform {
  return typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform)
    ? 'mac'
    : 'other'
}

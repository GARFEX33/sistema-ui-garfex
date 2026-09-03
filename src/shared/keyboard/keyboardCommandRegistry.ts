export type KeyboardSurface = 'bandeja' | 'catalog'
export type KeyboardCommandScope = 'global' | 'active-surface'

export type KeyboardCommand = Readonly<{
  id: string
  key: string
  shortcut: string
  label: string
  group: string
  scope: KeyboardCommandScope
  surface?: KeyboardSurface
  root: () => HTMLElement | null
  isAvailable: () => boolean
  action: (opener: HTMLElement | null) => void
}>

export type KeyboardCommandSnapshot = readonly KeyboardCommand[]

export function createKeyboardCommandRegistry() {
  const commands = new Map<string, KeyboardCommand>()
  const listeners = new Set<() => void>()
  let snapshot: KeyboardCommandSnapshot = []
  const publish = () => {
    snapshot = [...commands.values()]
    listeners.forEach((listener) => listener())
  }
  return {
    register(command: KeyboardCommand) {
      commands.set(command.id, command)
      publish()
      return () => {
        if (commands.get(command.id) === command) {
          commands.delete(command.id)
          publish()
        }
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    resolve(key: string, surface: KeyboardSurface) {
      const normalized = key.toLowerCase()
      return snapshot.find(
        (command) =>
          command.key.toLowerCase() === normalized &&
          (command.scope === 'global' || command.surface === surface) &&
          command.root() !== null &&
          command.isAvailable(),
      )
    },
  }
}

export type KeyboardCommandRegistry = ReturnType<
  typeof createKeyboardCommandRegistry
>

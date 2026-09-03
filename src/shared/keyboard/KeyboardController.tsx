import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  KeyboardControllerContext,
  type ContextualAction,
  type ControllerContextValue,
  type KeyboardSurface,
} from './keyboardControllerContext'
import {
  createKeyboardCommandRegistry,
  type KeyboardCommand,
} from './keyboardCommandRegistry'
import {
  arbitrateKeyboardEvent,
  type KeyboardPlatform,
} from './keyboardArbitration'

type KeyboardControllerProps = {
  activeSurface: KeyboardSurface
  onCommandPalette: (opener: HTMLElement | null) => void
  onHelp: (surface: KeyboardSurface, opener: HTMLElement | null) => void
  platform?: KeyboardPlatform
  children: ReactNode
}

export function KeyboardControllerProvider({
  activeSurface,
  onCommandPalette,
  onHelp,
  platform,
  children,
}: KeyboardControllerProps) {
  const stateRef = useRef({
    activeSurface,
    onCommandPalette,
    onHelp,
    platform,
    registry: createKeyboardCommandRegistry(),
    overlays: new Set<() => HTMLElement | null>(),
  })
  stateRef.current.activeSurface = activeSurface
  stateRef.current.onCommandPalette = onCommandPalette
  stateRef.current.onHelp = onHelp
  stateRef.current.platform = platform

  const context = useMemo<ControllerContextValue>(() => {
    const state = stateRef.current
    return {
      registerCommand: (command: KeyboardCommand) =>
        state.registry.register(command),
      registerAction: (action: ContextualAction) =>
        state.registry.register({
          id: action.id,
          key: action.key,
          shortcut: action.key.toUpperCase(),
          label: action.label,
          group: 'Catálogo',
          scope: 'active-surface',
          surface: action.surface,
          root: action.root,
          isAvailable: action.isAvailable,
          action: action.run,
        }),
      registerOverlay: (root) => {
        state.overlays.add(root)
        return () => state.overlays.delete(root)
      },
      subscribeCommands: state.registry.subscribe,
      getCommandsSnapshot: state.registry.getSnapshot,
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current
      const overlayOpen = [...state.overlays].some((root) => root() !== null)
      const arbitration = arbitrateKeyboardEvent(event, {
        activeOverlay: overlayOpen,
        platform: state.platform,
      })
      if (arbitration.owner !== 'global' || !arbitration.action) return
      const opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      const id =
        arbitration.action === 'command-palette'
          ? 'global.command-palette'
          : arbitration.action === 'contextual-help'
            ? 'global.contextual-help'
            : undefined
      const command = id
        ? state.registry.getSnapshot().find((candidate) => candidate.id === id)
        : state.registry.resolve('n', state.activeSurface)
      if (!command) return
      event.preventDefault()
      command.action(opener)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const state = stateRef.current
    const removePalette = state.registry.register({
      id: 'global.command-palette',
      key: 'k',
      shortcut: 'Ctrl/Cmd+K',
      label: 'Buscar o ejecutar comando',
      group: 'Global',
      scope: 'global',
      root: () => document.body,
      isAvailable: () => true,
      action: (opener) => state.onCommandPalette(opener),
    })
    const removeHelp = state.registry.register({
      id: 'global.contextual-help',
      key: '?',
      shortcut: '?',
      label: 'Mostrar atajos',
      group: 'Global',
      scope: 'global',
      root: () => document.body,
      isAvailable: () => true,
      action: (opener) => state.onHelp(state.activeSurface, opener),
    })
    return () => {
      removePalette()
      removeHelp()
    }
  }, [])

  return (
    <KeyboardControllerContext.Provider value={context}>
      {children}
    </KeyboardControllerContext.Provider>
  )
}

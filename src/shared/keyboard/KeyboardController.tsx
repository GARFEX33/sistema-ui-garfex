import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  KeyboardControllerContext,
  type KeyboardSurface,
} from './keyboardControllerContext'
import { createKeyboardCommandRegistry } from './keyboardCommandRegistry'
import { arbitrateKeyboardEvent } from './keyboardArbitration'

type KeyboardControllerProps = {
  activeSurface: KeyboardSurface
  onCommandPalette: (opener: HTMLElement | null) => void
  platform?: 'mac' | 'other'
  children: ReactNode
}

export function KeyboardControllerProvider({
  activeSurface,
  onCommandPalette,
  platform,
  children,
}: KeyboardControllerProps) {
  const stateRef = useRef({
    activeSurface,
    onCommandPalette,
    platform,
    registry: createKeyboardCommandRegistry(),
    overlays: new Set<() => HTMLElement | null>(),
  })
  stateRef.current.activeSurface = activeSurface
  stateRef.current.onCommandPalette = onCommandPalette
  stateRef.current.platform = platform

  const context = useMemo(() => {
    const state = stateRef.current
    return {
      registerCommand: (
        command: Parameters<typeof state.registry.register>[0],
      ) => state.registry.register(command),
      registerOverlay: (root: () => HTMLElement | null) => {
        state.overlays.add(root)
        return () => state.overlays.delete(root)
      },
      subscribeCommands: state.registry.subscribe,
      getCommandsSnapshot: state.registry.getSnapshot,
    }
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
    const handleKeyDown = (event: KeyboardEvent) => {
      const overlayOpen = [...state.overlays].some((root) => root() !== null)
      const decision = arbitrateKeyboardEvent(event, {
        overlayOpen,
        platform: state.platform,
      })
      if (decision.action !== 'command-palette') return
      const command = state.registry.resolve('k', state.activeSurface)
      if (!command) return
      event.preventDefault()
      command.action(
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
      )
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      removePalette()
    }
  }, [])

  return (
    <KeyboardControllerContext.Provider value={context}>
      {children}
    </KeyboardControllerContext.Provider>
  )
}

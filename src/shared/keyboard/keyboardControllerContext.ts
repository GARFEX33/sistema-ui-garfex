import { createContext, useContext, useSyncExternalStore } from 'react'
import type {
  KeyboardCommand,
  KeyboardCommandRegistry,
  KeyboardSurface,
} from './keyboardCommandRegistry'

export type { KeyboardCommand, KeyboardSurface }

export type ControllerContextValue = {
  registerCommand: (command: KeyboardCommand) => () => void
  registerOverlay: (root: () => HTMLElement | null) => () => void
  subscribeCommands: (listener: () => void) => () => void
  getCommandsSnapshot: () => readonly KeyboardCommand[]
}

export const KeyboardControllerContext =
  createContext<ControllerContextValue | null>(null)

const emptySnapshot: readonly KeyboardCommand[] = []
const noop = () => undefined

export function useKeyboardController(): ControllerContextValue {
  const context = useContext(KeyboardControllerContext)
  if (context) return context
  return {
    registerCommand: () => noop,
    registerOverlay: () => noop,
    subscribeCommands: () => noop,
    getCommandsSnapshot: () => emptySnapshot,
  }
}

export function useKeyboardCommands() {
  const context = useContext(KeyboardControllerContext)
  return useSyncExternalStore(
    context?.subscribeCommands ?? (() => noop),
    context?.getCommandsSnapshot ?? (() => emptySnapshot),
    () => emptySnapshot,
  )
}

export type { KeyboardCommandRegistry }

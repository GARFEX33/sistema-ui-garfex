import { createContext, useContext, useSyncExternalStore } from 'react'
import type { KeyboardCommand } from './keyboardCommandRegistry'

export type KeyboardSurface = 'bandeja' | 'catalog'

export type ContextualActionId =
  | 'catalog.new-class'
  | 'catalog.new-family'
  | 'catalog.new-type'

export type ContextualAction = {
  id: ContextualActionId
  surface: KeyboardSurface
  key: string
  label: string
  root: () => HTMLElement | null
  isAvailable: () => boolean
  run: (opener: HTMLElement | null) => void
}

export type ControllerContextValue = {
  registerCommand: (command: KeyboardCommand) => () => void
  registerAction: (action: ContextualAction) => () => void
  registerOverlay: (root: () => HTMLElement | null) => () => void
  subscribeCommands: (listener: () => void) => () => void
  getCommandsSnapshot: () => readonly KeyboardCommand[]
}

export const KeyboardControllerContext =
  createContext<ControllerContextValue | null>(null)

const emptySnapshot: readonly KeyboardCommand[] = []
const noop = () => undefined

export function useKeyboardController() {
  const context = useContext(KeyboardControllerContext)
  if (!context) {
    return {
      registerCommand: (command: KeyboardCommand) => {
        void command
        return noop
      },
      registerAction: (action: ContextualAction) => {
        void action
        return noop
      },
      registerOverlay: (root: () => HTMLElement | null) => {
        void root
        return noop
      },
      subscribeCommands: (listener: () => void) => {
        void listener
        return noop
      },
      getCommandsSnapshot: () => emptySnapshot,
    }
  }
  return context
}

export function useKeyboardCommands() {
  const context = useContext(KeyboardControllerContext)
  return useSyncExternalStore(
    context?.subscribeCommands ?? (() => noop),
    context?.getCommandsSnapshot ?? (() => emptySnapshot),
    () => emptySnapshot,
  )
}

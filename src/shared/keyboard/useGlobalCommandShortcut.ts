import { useEffect } from 'react'
import { shouldOpenGlobalCommand } from './keyboardArbitration'

export function useGlobalCommandShortcut(
  onOpen: (opener: HTMLElement | null) => void,
  overlayOpen: boolean,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldOpenGlobalCommand(event, { overlayOpen })) return
      onOpen(
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
      )
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpen, overlayOpen])
}

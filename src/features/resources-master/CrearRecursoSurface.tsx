import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { CreationStageRail } from './CreationStageRail'
import { CreationCommandBar } from './CreationCommandBar'
import { ResourceCreationContractPending } from './ResourceCreationContractPending'
import { ResourceCreationShell } from './ResourceCreationShell'

export function CrearRecursoSurface() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const { registerAction, registerOverlay } = useKeyboardController()

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current =
        opener?.isConnected &&
        opener !== document.body &&
        opener !== document.documentElement
          ? opener
          : null
      setIsOpen(true)
    },
    [],
  )

  const action = useMemo(
    () => ({
      id: 'resources.new-resource' as const,
      surface: 'recursos' as const,
      key: 'n',
      label: 'Nuevo recurso',
      root: () => triggerRef.current,
      isAvailable: () =>
        !isOpenRef.current && isValidFocusCandidate(triggerRef.current),
      run: open,
    }),
    [open],
  )

  useEffect(() => registerAction(action), [action, registerAction])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])

  useEffect(() => {
    let delayedRestore: number | null = null
    if (isOpen) {
      wasOpen.current = true
    } else if (wasOpen.current) {
      const opener = openerRef.current
      const fallbacks = [
        () => triggerRef.current,
        () =>
          document.querySelector<HTMLElement>(
            '[data-spatial-id="sidebar.recursos"]',
          ),
      ]
      const restoreFocus = () => restoreFocusNextFrame(opener, fallbacks)
      restoreFocus()
      delayedRestore = window.setTimeout(() => {
        if (!isOpenRef.current) restoreFocus()
      }, 50)
      openerRef.current = null
      wasOpen.current = false
    }
    return () => {
      if (delayedRestore !== null) window.clearTimeout(delayedRestore)
    }
  }, [isOpen])

  return (
    <div className="resources-create-surface">
      <Button
        ref={triggerRef}
        aria-label="Nuevo recurso"
        onPress={() => open(triggerRef.current)}
      >
        <span>Nuevo recurso</span>
        <kbd>N</kbd>
      </Button>

      <Dialog
        ref={dialogRef}
        isOpen={isOpen}
        onOpenChange={(openState) => !openState && close()}
        aria-label="Creador de recursos"
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          onKeyDown={(event) => {
            if (event.defaultPrevented || event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              close()
              return
            }
            if (
              event.key === 'ArrowLeft' &&
              !event.ctrlKey &&
              !event.altKey &&
              !event.metaKey &&
              !event.shiftKey
            ) {
              event.preventDefault()
              event.stopPropagation()
              close()
            }
          }}
        >
          <ResourceCreationShell
            rail={
              <CreationStageRail
                currentStage="contract-pending"
                onNavigate={() => undefined}
                selections={{
                  className: '',
                  familyName: '',
                  typeName: '',
                  unitName: '',
                }}
              />
            }
          />
          <div className="resources-dialog-content">
            <ResourceCreationContractPending />
          </div>
          <CreationCommandBar stage="contract-pending">
            <Button variant="outline" onPress={close} type="button">
              Volver
            </Button>
          </CreationCommandBar>
        </div>
      </Dialog>
    </div>
  )
}

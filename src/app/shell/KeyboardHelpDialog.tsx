import { useEffect, useRef } from 'react'
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import {
  useKeyboardCommands,
  useKeyboardController,
  type KeyboardSurface,
} from '../../shared/keyboard/keyboardControllerContext'

type KeyboardHelpDialogProps = {
  isOpen: boolean
  surface: KeyboardSurface
  onClose: () => void
}

const conventions = [
  { key: 'Tab / Shift+Tab', label: 'Recorrer zonas' },
  { key: 'Esc', label: 'Volver / cerrar' },
  { key: '↑ ↓', label: 'Navegar destinos' },
  { key: '← →', label: 'Entrar o volver entre zonas' },
  { key: 'Enter', label: 'Activar el destino enfocado' },
]

export function KeyboardHelpDialog({
  isOpen,
  surface,
  onClose,
}: KeyboardHelpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { registerOverlay } = useKeyboardController()
  const registered = useKeyboardCommands()
  const commands = registered.filter(
    (command) =>
      (command.scope === 'global' || command.surface === surface) &&
      command.root() !== null &&
      command.isAvailable(),
  )
  const global = commands.filter((command) => command.scope === 'global')
  const contextual = commands.filter((command) => command.scope !== 'global')

  useEffect(
    () => registerOverlay(() => (isOpen ? dialogRef.current : null)),
    [isOpen, registerOverlay],
  )
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  return (
    <ModalOverlay
      className="command-overlay"
      isOpen={isOpen}
      isDismissable={false}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <Modal className="command-modal">
        <Dialog
          ref={dialogRef}
          className="command-dialog"
          aria-label="Ayuda de teclado"
        >
          <h2>Ayuda de teclado</h2>
          <ul className="keyboard-help-list">
            {global.map((command) => (
              <li key={command.id}>
                <span>
                  {command.shortcut} — {command.label}
                </span>
                <kbd aria-hidden="true">{command.shortcut}</kbd>
              </li>
            ))}
            {conventions.map((command) => (
              <li key={command.key}>
                <span>
                  {command.key} — {command.label}
                </span>
                <kbd aria-hidden="true">{command.key}</kbd>
              </li>
            ))}
            {contextual.length > 0 && (
              <li className="keyboard-help-group" aria-hidden="true">
                {surface === 'catalog' ? 'Catálogo' : 'Contexto actual'}
              </li>
            )}
            {contextual.map((command) => (
              <li key={command.id}>
                <span>
                  {command.shortcut} — {command.label}
                </span>
                <kbd aria-hidden="true">{command.shortcut}</kbd>
              </li>
            ))}
          </ul>
          <Button className="command-close" onPress={onClose}>
            Cerrar ayuda
          </Button>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

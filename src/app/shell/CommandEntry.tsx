import { useEffect, useRef, useState } from 'react'
import {
  useKeyboardCommands,
  useKeyboardController,
  type KeyboardSurface,
} from '../../shared/keyboard/keyboardControllerContext'
import {
  Button,
  Dialog,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from 'react-aria-components'

interface CommandEntryProps {
  isOpen: boolean
  onOpen: (opener: HTMLElement | null) => void
  onClose: () => void
  surface?: KeyboardSurface
}

export function CommandEntry({
  isOpen,
  onOpen,
  onClose,
  surface = 'bandeja',
}: CommandEntryProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const { registerOverlay } = useKeyboardController()
  const registered = useKeyboardCommands()
  const paletteCommand = registered.find(
    (command) => command.id === 'global.command-palette',
  )
  const commands = registered.filter(
    (command) =>
      command.id !== 'global.command-palette' &&
      (command.scope === 'global' || command.surface === surface) &&
      command.root() !== null &&
      command.isAvailable(),
  )

  useEffect(
    () => registerOverlay(() => (isOpen ? dialogRef.current : null)),
    [isOpen, registerOverlay],
  )

  useEffect(() => {
    if (!isOpen) setValue('')
  }, [isOpen])

  return (
    <>
      <Button
        ref={triggerRef}
        className="command-trigger"
        onPress={() => onOpen(triggerRef.current)}
      >
        <span>Buscar o ejecutar comando…</span>
        <kbd>{paletteCommand?.shortcut}</kbd>
      </Button>
      <ModalOverlay
        className="command-overlay"
        isOpen={isOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose()
        }}
        isDismissable={false}
      >
        <Modal className="command-modal">
          <Dialog
            ref={dialogRef}
            aria-label="Entrada de comandos"
            className="command-dialog"
          >
            <h2>Entrada de comandos</h2>
            <TextField
              value={value}
              onChange={setValue}
              className="command-field"
            >
              <Label>Comando</Label>
              <Input autoFocus placeholder="Escribe una intención" />
            </TextField>
            <p className="command-help">
              La entrada de comandos está disponible para tu contexto actual.
            </p>
            <ul className="command-list" aria-label="Comandos disponibles">
              {commands.map((command) => (
                <li key={command.id}>
                  <Button
                    className="command-option"
                    onPress={() => {
                      onClose()
                      command.action(triggerRef.current)
                    }}
                  >
                    <span>{command.label}</span>
                    <kbd>{command.shortcut}</kbd>
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="command-close" onPress={onClose}>
              Cerrar entrada de comandos
            </Button>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
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
}

export function CommandEntry({ isOpen, onOpen, onClose }: CommandEntryProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [value, setValue] = useState('')

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
        <kbd>Ctrl/Cmd + K</kbd>
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
          <Dialog aria-label="Entrada de comandos" className="command-dialog">
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
            <Button className="command-close" onPress={onClose}>
              Cerrar entrada de comandos
            </Button>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}

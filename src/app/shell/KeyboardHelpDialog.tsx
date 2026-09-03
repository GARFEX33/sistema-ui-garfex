import { useEffect, useRef } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'

export function KeyboardHelpDialog({
  isOpen,
  activeSurface,
  onOpen,
  onClose,
}: {
  isOpen: boolean
  activeSurface: 'bandeja' | 'catalog'
  onOpen: (opener: HTMLElement | null) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { registerCommand, registerOverlay } = useKeyboardController()

  useEffect(
    () =>
      registerCommand({
        id: 'global.keyboard-help',
        key: '?',
        shortcut: '?',
        label: 'Ayuda de teclado',
        group: 'Global',
        scope: 'global',
        root: () => (isOpen ? dialogRef.current : document.body),
        isAvailable: () => true,
        action: onOpen,
      }),
    [isOpen, onOpen, registerCommand],
  )
  useEffect(
    () => registerOverlay(() => (isOpen ? dialogRef.current : null)),
    [isOpen, registerOverlay],
  )
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="keyboard-help-backdrop">
      <div
        ref={dialogRef}
        className="keyboard-help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <h2 id="keyboard-help-title">Ayuda de teclado</h2>
        <section aria-labelledby="keyboard-help-global">
          <h3 id="keyboard-help-global">Global</h3>
          <p>
            <kbd>Ctrl/Cmd+K</kbd> — Buscar o ejecutar comando
          </p>
          <p>
            <kbd>?</kbd> — Ayuda de teclado
          </p>
        </section>
        {activeSurface === 'catalog' && (
          <section aria-labelledby="keyboard-help-catalog">
            <h3 id="keyboard-help-catalog">Catálogo</h3>
            <p>
              <kbd>N</kbd> — Nueva Clase
            </p>
          </section>
        )}
        <button type="button" onClick={onClose}>
          Cerrar ayuda de teclado
        </button>
      </div>
    </div>
  )
}

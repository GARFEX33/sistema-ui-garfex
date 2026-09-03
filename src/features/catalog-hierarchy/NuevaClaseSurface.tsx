import { useCallback, useEffect, useRef, useState } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import './catalogHierarchy.css'

type Draft = { clave: string; nombre: string; descripcion: string }
const emptyDraft = (): Draft => ({ clave: '', nombre: '', descripcion: '' })

export function NuevaClaseSurface() {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const { registerCommand, registerOverlay } = useKeyboardController()
  const open = useCallback((opener: HTMLElement | null) => {
    openerRef.current = opener?.isConnected ? opener : null
    setDraft(emptyDraft())
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])
  const setField = (field: keyof Draft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  useEffect(
    () =>
      registerCommand({
        id: 'catalog.new-class',
        key: 'n',
        shortcut: 'N',
        label: 'Nueva Clase',
        group: 'Catálogo',
        scope: 'active-surface',
        surface: 'catalog',
        root: () => triggerRef.current,
        isAvailable: () => true,
        action: open,
      }),
    [open, registerCommand],
  )
  useEffect(
    () => registerOverlay(() => (isOpen ? dialogRef.current : null)),
    [isOpen, registerOverlay],
  )
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    restoreFocusNextFrame(openerRef.current, [() => triggerRef.current])
    openerRef.current = null
    wasOpenRef.current = false
  }, [isOpen])

  return (
    <div className="catalog-create-surface">
      <button
        ref={triggerRef}
        className="catalog-create-trigger"
        type="button"
        onClick={(event) => open(event.currentTarget)}
      >
        Nueva Clase
      </button>
      {isOpen && (
        <div className="catalog-dialog-backdrop">
          <div ref={dialogRef} className="catalog-dialog-modal">
            <div
              className="catalog-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="nueva-clase-title"
            >
              <form className="catalog-dialog-form">
                <header className="catalog-dialog-heading">
                  <h2 id="nueva-clase-title">Nueva Clase</h2>
                </header>
                <div className="catalog-dialog-content">
                  <div className="catalog-dialog-fields">
                    <div className="catalog-field-row">
                      <label htmlFor="nueva-clase-clave">Clave</label>
                      <input
                        id="nueva-clase-clave"
                        value={draft.clave}
                        onChange={(event) =>
                          setField('clave', event.target.value)
                        }
                      />
                    </div>
                    <div className="catalog-field-row">
                      <label htmlFor="nueva-clase-nombre">Nombre</label>
                      <input
                        id="nueva-clase-nombre"
                        value={draft.nombre}
                        onChange={(event) =>
                          setField('nombre', event.target.value)
                        }
                      />
                    </div>
                    <div className="catalog-field-row">
                      <label htmlFor="nueva-clase-descripcion">
                        Descripción
                      </label>
                      <textarea
                        id="nueva-clase-descripcion"
                        value={draft.descripcion}
                        onChange={(event) =>
                          setField('descripcion', event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <footer className="catalog-dialog-actions">
                  <button type="button" onClick={close}>
                    Cancelar
                  </button>
                  <button type="button" disabled>
                    Crear Clase
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

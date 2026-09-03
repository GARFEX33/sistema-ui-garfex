import { useState } from 'react'
import './catalogHierarchy.css'

type Draft = {
  clave: string
  nombre: string
  descripcion: string
}

const emptyDraft = (): Draft => ({ clave: '', nombre: '', descripcion: '' })

export function NuevaClaseSurface() {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  const setField = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const open = () => {
    setDraft(emptyDraft())
    setIsOpen(true)
  }

  return (
    <div className="catalog-create-surface">
      <button className="catalog-create-trigger" type="button" onClick={open}>
        Nueva Clase
      </button>
      {isOpen && (
        <div className="catalog-dialog-backdrop">
          <div className="catalog-dialog-modal">
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
                  <button type="button" onClick={() => setIsOpen(false)}>
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

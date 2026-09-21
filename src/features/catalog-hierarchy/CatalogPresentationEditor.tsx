import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogContent } from '../../shared/ui/Dialog'
import { useCatalogPresentationAdmin } from './useCatalogPresentationAdmin'
import type { CatalogPresentationAdminApi } from './catalogPresentationAdmin.api'
import type { CatalogAttributeCreationApi } from './catalogAttributeCreation.types'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'

export interface CatalogPresentationEditorProps {
  presentationApi: CatalogPresentationAdminApi
  creationApi: Pick<
    CatalogAttributeCreationApi,
    | 'createPresentation'
    | 'resolveHierarchyReferences'
    | 'searchCharacteristics'
  >
  context: Readonly<{
    sessionId?: string
    classCode?: string
    familyCode?: string
    typeCode?: string
  }>
  attributes: readonly EffectiveAttribute[]
  actorAvailable: boolean
}

// Replaces the retired ReorderAttributesSurface/catalogAttributeOrder.api.ts
// decoy (its own copy admitted it never touched PRESENTACION). Every toggle
// or reorder here commits immediately against the real PRESENTACION rows
// that build a Resource's presentation name — there is no batch "save the
// whole order" endpoint, so there is no draft/dirty state to manage.
export function CatalogPresentationEditor({
  presentationApi,
  creationApi,
  context,
  attributes,
  actorAvailable,
}: CatalogPresentationEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const { registerOverlay } = useKeyboardController()

  const admin = useCatalogPresentationAdmin({
    presentationApi,
    creationApi,
    context: isOpen ? context : {},
    attributes,
    canSubmit: () => actorAvailable,
  })
  const pending = admin.commandStatus === 'pending'

  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])
  useLayoutEffect(() => {
    if (wasOpen.current && !isOpen)
      restoreFocusNextFrame(triggerRef.current, [])
    wasOpen.current = isOpen
  }, [isOpen])

  const close = () => {
    if (!pending) setIsOpen(false)
  }
  const blockedReason =
    admin.status === 'ready' && !admin.canSave
      ? 'No se puede guardar hasta contar con un actor válido.'
      : null

  return (
    <>
      <Button
        onPress={() => setIsOpen(true)}
        ref={triggerRef}
        type="button"
        variant="outline"
      >
        Editar presentación
      </Button>
      <Dialog
        aria-label="Editar presentación"
        isDismissable={!pending}
        isOpen={isOpen}
        onOpenChange={(openState) => !openState && close()}
        ref={dialogRef}
      >
        <header className="mb-4 flex flex-none items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-semibold">Editar presentación</h2>
            <p className="m-0 mt-1 text-xs text-text-secondary">
              Elegí qué atributos arman el nombre visible del Recurso y en qué
              orden.
            </p>
          </div>
          <Button
            isDisabled={pending}
            onPress={close}
            type="button"
            variant="outline"
          >
            Cerrar <kbd>Esc</kbd>
          </Button>
        </header>
        <DialogContent className="overflow-y-auto pr-1">
          {admin.status === 'waiting-context' && (
            <p
              className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
              role="status"
            >
              Seleccioná Clase, Familia y Tipo para editar la presentación.
            </p>
          )}
          {admin.status === 'loading' && (
            <p
              className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
              role="status"
            >
              Cargando presentación…
            </p>
          )}
          {admin.status === 'error' && (
            <div
              className="flex flex-col items-start gap-3 rounded-lg border border-primary bg-primary-subtle px-4 py-3 text-sm text-text-primary"
              role="alert"
            >
              <p className="m-0">No se pudo cargar la presentación.</p>
              <Button onPress={admin.retry} type="button" variant="outline">
                Reintentar
              </Button>
            </div>
          )}
          {admin.status === 'ready' && admin.rows && (
            <div className="grid gap-4">
              {admin.commandStatus === 'error' && admin.commandError && (
                <div
                  className="rounded-lg border border-primary bg-primary-subtle px-4 py-3 text-sm text-text-primary"
                  role="alert"
                >
                  {admin.commandError.message}
                </div>
              )}
              <section aria-label="Atributos en la presentación">
                <h3 className="m-0 mb-2 text-sm font-semibold">
                  En la presentación
                </h3>
                {admin.rows.participating.length === 0 ? (
                  <p className="m-0 text-sm text-text-secondary">
                    Ningún atributo participa todavía.
                  </p>
                ) : (
                  <ol
                    aria-label="Orden de atributos en la presentación"
                    className="m-0 list-none space-y-2 p-0"
                  >
                    {admin.rows.participating.map((row, index) => (
                      <li
                        key={row.characteristicCode}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                          <input
                            checked
                            disabled={pending}
                            onChange={() => void admin.toggleParticipation(row)}
                            type="checkbox"
                          />
                          {row.name}
                        </label>
                        <span className="flex items-center gap-2">
                          <Button
                            aria-label={`Subir ${row.name}`}
                            isDisabled={pending || index === 0}
                            onPress={() =>
                              void admin.moveUp(row.characteristicCode)
                            }
                            type="button"
                            variant="outline"
                          >
                            Subir
                          </Button>
                          <Button
                            aria-label={`Bajar ${row.name}`}
                            isDisabled={
                              pending ||
                              index === admin.rows!.participating.length - 1
                            }
                            onPress={() =>
                              void admin.moveDown(row.characteristicCode)
                            }
                            type="button"
                            variant="outline"
                          >
                            Bajar
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <section aria-label="Atributos fuera de la presentación">
                <h3 className="m-0 mb-2 text-sm font-semibold">
                  Fuera de la presentación
                </h3>
                {admin.rows.notParticipating.length === 0 ? (
                  <p className="m-0 text-sm text-text-secondary">
                    Todos los atributos participan.
                  </p>
                ) : (
                  <ul
                    aria-label="Atributos fuera de la presentación"
                    className="m-0 list-none space-y-2 p-0"
                  >
                    {admin.rows.notParticipating.map((row) => (
                      <li
                        key={row.characteristicCode}
                        className="rounded-lg border border-border bg-surface-subtle px-4 py-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                          <input
                            checked={false}
                            disabled={pending}
                            onChange={() => void admin.toggleParticipation(row)}
                            type="checkbox"
                          />
                          {row.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {blockedReason && (
            <p className="m-0 text-sm text-text-secondary" role="status">
              {blockedReason}
            </p>
          )}
          <Button
            isDisabled={pending}
            onPress={close}
            type="button"
            variant="outline"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

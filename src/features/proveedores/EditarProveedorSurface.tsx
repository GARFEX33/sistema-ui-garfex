import { useEffect, useId, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field, FieldSeparator } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type { Supplier, SupplierRestUpdateInput } from './proveedores.types'

type Draft = {
  tradeName: string
  legalName: string
  taxIdentifier: string
  website: string
  notes: string
}

const toDraft = (supplier: Supplier): Draft => ({
  tradeName: supplier.tradeName,
  legalName: supplier.legalName,
  taxIdentifier: supplier.taxIdentifier,
  website: supplier.website,
  notes: supplier.notes,
})

export interface EditarProveedorSurfaceProps {
  /** The current row's record — read at open time to pre-fill the form. */
  supplier: Supplier
  updateSupplier: (input: SupplierRestUpdateInput) => Promise<Supplier>
  /** Called with the updated supplier, before the dialog closes — the caller
   * wires this to the list window's refetch so the edited row actually shows
   * the new values without a manual reload. */
  onUpdated?: (supplier: Supplier) => void | Promise<unknown>
}

const genericFailureMessage = 'No se pudo actualizar el proveedor.'

const updateErrorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede actualizar el proveedor sin configurar el actor local.'
  return genericFailureMessage
}

// Mirrors CrearProveedorSurface's flat dialog pattern (Dialog + isDismissable
// + Escape via react-aria + restoreFocusNextFrame), pre-filling the draft
// from the supplier record instead of starting empty, and calling
// updateSupplier instead of createSupplier. Per the backend contract
// (odd/tasks/proveedores-master.md), PUT /v1/suppliers/{id} has no
// expectedRevision — unlike Resource, Supplier does not use optimistic
// concurrency, so this surface never sends or tracks a revision token.
export function EditarProveedorSurface({
  supplier,
  updateSupplier,
  onUpdated,
}: EditarProveedorSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(supplier))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tradeNameRef = useRef<HTMLInputElement>(null)
  const wasOpen = useRef(false)
  const mountedRef = useRef(true)
  const tradeNameId = useId()
  const legalNameId = useId()
  const taxIdentifierId = useId()
  const websiteId = useId()
  const notesId = useId()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      tradeNameRef.current?.focus()
    } else if (wasOpen.current) {
      restoreFocusNextFrame(triggerRef.current, [])
      wasOpen.current = false
    }
  }, [isOpen])

  const setField = (field: keyof Draft, value: string) => {
    setErrorMessage(null)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const trimmed: Draft = {
    tradeName: draft.tradeName.trim(),
    legalName: draft.legalName.trim(),
    taxIdentifier: draft.taxIdentifier.trim(),
    website: draft.website.trim(),
    notes: draft.notes.trim(),
  }
  // Same client-side guard as CrearProveedorSurface: keep at least a trade
  // name or legal name so the list stays identifiable, without inventing a
  // backend validation rule that does not exist.
  const canSubmit =
    !isSubmitting &&
    (trimmed.tradeName.length > 0 || trimmed.legalName.length > 0)

  const open = () => {
    setDraft(toDraft(supplier))
    setErrorMessage(null)
    setIsOpen(true)
  }
  const close = () => {
    if (!isSubmitting) setIsOpen(false)
  }

  const submit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const updated = await updateSupplier({ id: supplier.id, ...trimmed })
      if (!mountedRef.current) return
      await onUpdated?.(updated)
      if (!mountedRef.current) return
      setIsOpen(false)
    } catch (error) {
      if (mountedRef.current) setErrorMessage(updateErrorMessage(error))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const displayName = supplier.tradeName || supplier.legalName || supplier.id

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onPress={open}
        aria-label={`Editar ${displayName}`}
      >
        Editar
      </Button>
      <Dialog
        isOpen={isOpen}
        isDismissable={!isSubmitting}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label="Editar proveedor"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeading title="Editar proveedor" />
          <div className="grid gap-1">
            <Field label="Nombre comercial" htmlFor={tradeNameId}>
              <input
                ref={tradeNameRef}
                id={tradeNameId}
                className={fieldInputClass}
                value={draft.tradeName}
                disabled={isSubmitting}
                onChange={(event) => setField('tradeName', event.target.value)}
              />
            </Field>
            <FieldSeparator />
            <Field label="Razón social" htmlFor={legalNameId}>
              <input
                id={legalNameId}
                className={fieldInputClass}
                value={draft.legalName}
                disabled={isSubmitting}
                onChange={(event) => setField('legalName', event.target.value)}
              />
            </Field>
            <FieldSeparator />
            <Field label="Identificador fiscal" htmlFor={taxIdentifierId}>
              <input
                id={taxIdentifierId}
                className={fieldInputClass}
                value={draft.taxIdentifier}
                disabled={isSubmitting}
                onChange={(event) =>
                  setField('taxIdentifier', event.target.value)
                }
              />
            </Field>
            <FieldSeparator />
            <Field label="Sitio web" htmlFor={websiteId}>
              <input
                id={websiteId}
                type="url"
                className={fieldInputClass}
                value={draft.website}
                disabled={isSubmitting}
                onChange={(event) => setField('website', event.target.value)}
              />
            </Field>
            <FieldSeparator />
            <Field label="Notas" htmlFor={notesId}>
              <textarea
                id={notesId}
                rows={3}
                className={fieldInputClass}
                value={draft.notes}
                disabled={isSubmitting}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </Field>
          </div>
          {errorMessage && (
            <p className="mt-2 text-sm text-primary" role="alert">
              {errorMessage}
            </p>
          )}
          <DialogActions>
            <Button
              variant="outline"
              type="button"
              onPress={close}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isDisabled={!canSubmit}>
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}

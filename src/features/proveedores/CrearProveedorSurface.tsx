import { useEffect, useId, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field, FieldSeparator } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type { Supplier, SupplierRestCreateInput } from './proveedores.types'

type Draft = {
  tradeName: string
  legalName: string
  taxIdentifier: string
  website: string
  notes: string
}

const emptyDraft = (): Draft => ({
  tradeName: '',
  legalName: '',
  taxIdentifier: '',
  website: '',
  notes: '',
})

export interface CrearProveedorSurfaceProps {
  createSupplier: (input: SupplierRestCreateInput) => Promise<Supplier>
  /** Called after a successful creation, before the dialog closes — the
   * caller wires this to the list window's refetch so the new supplier
   * actually appears without a manual reload. */
  onCreated?: () => void | Promise<unknown>
}

const genericFailureMessage = 'No se pudo crear el proveedor.'

const creationErrorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede crear el proveedor sin configurar el actor local.'
  return genericFailureMessage
}

// Mirrors the flat create-dialog pattern from catalog-hierarchy's
// NuevaClaseSurface/CrearAtributoSurface (Dialog + isDismissable + Escape
// via react-aria + restoreFocusNextFrame), adapted to Supplier's flat shape.
// `createSupplier` (proveedores.api.ts) already resolves the REST actor
// internally via withRestActor/resolveRestActor, so this surface never reads
// or invents an actor — it only surfaces RestActorConfigurationError if the
// adapter rejects with it.
export function CrearProveedorSurface({
  createSupplier,
  onCreated,
}: CrearProveedorSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
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
  // Every Supplier field but `actor` is optional per the OpenAPI contract.
  // The list identifies a supplier by tradeName (primary) and legalName
  // (secondary), so requiring at least one of the two client-side keeps the
  // list from filling with unidentifiable rows, without inventing a backend
  // validation rule that does not exist.
  const canSubmit =
    !isSubmitting &&
    (trimmed.tradeName.length > 0 || trimmed.legalName.length > 0)

  const open = () => {
    setDraft(emptyDraft())
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
      await createSupplier({ ...trimmed })
      if (!mountedRef.current) return
      await onCreated?.()
      if (!mountedRef.current) return
      setIsOpen(false)
    } catch (error) {
      if (mountedRef.current) setErrorMessage(creationErrorMessage(error))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button ref={triggerRef} type="button" onPress={open}>
        Nuevo proveedor
      </Button>
      <Dialog
        isOpen={isOpen}
        isDismissable={!isSubmitting}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label="Nuevo proveedor"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeading title="Nuevo proveedor" />
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
              {isSubmitting ? 'Creando…' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}

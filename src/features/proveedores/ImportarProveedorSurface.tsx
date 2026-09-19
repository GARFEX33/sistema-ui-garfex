import { useEffect, useId, useRef, useState } from 'react'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field, FieldSeparator } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type {
  Supplier,
  SupplierCFDIPreview,
  SupplierRestCreateInput,
  SupplierRestUpdateInput,
} from './proveedores.types'
import type { SupplierRestCFDIPreviewInput } from './proveedores.api'

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

const draftFromPreview = (preview: SupplierCFDIPreview): Draft => ({
  ...emptyDraft(),
  legalName: preview.draft.legalName,
  taxIdentifier: preview.draft.taxIdentifier,
})

type Status = 'closed' | 'loading' | 'ready' | 'error'

export interface ImportarProveedorSurfaceProps {
  previewSupplierFromCfdi: (
    input: SupplierRestCFDIPreviewInput,
  ) => Promise<SupplierCFDIPreview>
  createSupplier: (input: SupplierRestCreateInput) => Promise<Supplier>
  updateSupplier: (input: SupplierRestUpdateInput) => Promise<Supplier>
  /** Called with the resulting supplier and whether it was created or an
   * existing RFC match was updated, before the dialog closes — wired to the
   * list window's refetch so the result appears without a manual reload. */
  onImported?: (
    supplier: Supplier,
    mode: 'created' | 'updated',
  ) => void | Promise<unknown>
}

const previewErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message
  return 'No se pudo leer el archivo XML.'
}

const genericFailureMessage = 'No se pudo guardar el proveedor.'

const submitErrorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede guardar el proveedor sin configurar el actor local.'
  return genericFailureMessage
}

const displayName = (supplier: Supplier) =>
  supplier.tradeName || supplier.legalName || supplier.id

// Consumes POST /v1/suppliers/from-cfdi/preview: reads a CFDI 4.0 XML and
// returns the Emisor draft plus the supplier that already owns that RFC, if
// any. Mirrors CrearProveedorSurface's Dialog/isDismissable/Escape/
// restoreFocusNextFrame pattern; the extra 'loading'/'error' statuses cover
// the file-read round trip before the create/update form can render.
export function ImportarProveedorSurface({
  previewSupplierFromCfdi,
  createSupplier,
  updateSupplier,
  onImported,
}: ImportarProveedorSurfaceProps) {
  const [status, setStatus] = useState<Status>('closed')
  const [preview, setPreview] = useState<SupplierCFDIPreview | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    if (status !== 'closed') {
      wasOpen.current = true
      if (status === 'ready' && !preview?.existing) tradeNameRef.current?.focus()
    } else if (wasOpen.current) {
      restoreFocusNextFrame(triggerRef.current, [])
      wasOpen.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const setField = (field: keyof Draft, value: string) => {
    setErrorMessage(null)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const close = () => {
    if (isSubmitting) return
    setStatus('closed')
    setPreview(null)
  }

  const pickFile = () => fileInputRef.current?.click()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setStatus('loading')
    setErrorMessage(null)
    setPreview(null)
    try {
      const result = await previewSupplierFromCfdi({ file })
      if (!mountedRef.current) return
      setPreview(result)
      setDraft(draftFromPreview(result))
      setStatus('ready')
    } catch (error) {
      if (!mountedRef.current) return
      setErrorMessage(previewErrorMessage(error))
      setStatus('error')
    }
  }

  const trimmed: Draft = {
    tradeName: draft.tradeName.trim(),
    legalName: draft.legalName.trim(),
    taxIdentifier: draft.taxIdentifier.trim(),
    website: draft.website.trim(),
    notes: draft.notes.trim(),
  }
  const canCreate =
    !isSubmitting &&
    (trimmed.tradeName.length > 0 || trimmed.legalName.length > 0)

  const submitCreate = async () => {
    if (!canCreate) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await createSupplier({ ...trimmed })
      if (!mountedRef.current) return
      await onImported?.(created, 'created')
      if (!mountedRef.current) return
      setStatus('closed')
      setPreview(null)
    } catch (error) {
      if (mountedRef.current) setErrorMessage(submitErrorMessage(error))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const submitUpdate = async () => {
    if (!preview?.existing || isSubmitting) return
    const existing = preview.existing
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const updated = await updateSupplier({
        id: existing.id,
        tradeName: existing.tradeName,
        legalName: preview.draft.legalName,
        taxIdentifier: preview.draft.taxIdentifier,
        website: existing.website,
        notes: existing.notes,
      })
      if (!mountedRef.current) return
      await onImported?.(updated, 'updated')
      if (!mountedRef.current) return
      setStatus('closed')
      setPreview(null)
    } catch (error) {
      if (mountedRef.current) setErrorMessage(submitErrorMessage(error))
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button ref={triggerRef} type="button" variant="outline" onPress={pickFile}>
        Importar desde XML
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,application/xml,text/xml"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          void handleFileChange(event)
        }}
      />
      <Dialog
        isOpen={status !== 'closed'}
        isDismissable={!isSubmitting}
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
        aria-label="Importar proveedor desde XML"
      >
        <DialogHeading title="Importar proveedor desde XML" />
        {status === 'loading' && (
          <p className="text-sm leading-6 text-text-secondary" role="status">
            Leyendo el archivo…
          </p>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm leading-6 text-text-secondary" role="alert">
              {errorMessage}
            </p>
            <DialogActions>
              <Button variant="outline" type="button" onPress={close}>
                Cerrar
              </Button>
              <Button type="button" onPress={pickFile}>
                Elegir otro archivo
              </Button>
            </DialogActions>
          </>
        )}
        {status === 'ready' && preview?.existing && (
          <>
            <p className="text-sm leading-6 text-text-secondary" role="status">
              Ya existe un proveedor con este identificador fiscal:{' '}
              <strong className="text-text-primary">
                {displayName(preview.existing)}
              </strong>
              . Se actualizará la razón social e identificador fiscal con los
              datos del XML.
            </p>
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
              <Button
                type="button"
                isDisabled={isSubmitting}
                onPress={() => {
                  void submitUpdate()
                }}
              >
                {isSubmitting ? 'Actualizando…' : 'Actualizar proveedor'}
              </Button>
            </DialogActions>
          </>
        )}
        {status === 'ready' && !preview?.existing && (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void submitCreate()
            }}
          >
            <p className="mb-2 text-sm leading-6 text-text-secondary" role="status">
              No existe un proveedor con este identificador fiscal. Confirmá
              los datos para crearlo.
            </p>
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
              <Button type="submit" isDisabled={!canCreate}>
                {isSubmitting ? 'Creando…' : 'Crear proveedor'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  )
}

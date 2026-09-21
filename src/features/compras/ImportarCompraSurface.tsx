import { useEffect, useRef, useState } from 'react'
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import type {
  PurchaseImportInput,
  PurchaseImportResponse,
} from './compras.types'
type SurfaceStatus = 'closed' | 'loading' | 'error' | 'refresh-error'
export interface ImportarCompraSurfaceProps {
  importPurchase: (
    input: PurchaseImportInput,
  ) => Promise<PurchaseImportResponse>
  onImported?: (result: PurchaseImportResponse) => void | Promise<unknown>
}
const errorStatus = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: unknown }).status
    : undefined
const importErrorMessage = (error: unknown) => {
  if (error instanceof RestActorConfigurationError)
    return 'No se puede importar la compra sin configurar el actor local.'
  if (errorStatus(error) === 409)
    return 'Conflicto: el UUID fiscal ya existe con contenido diferente.'
  if (errorStatus(error) === 422)
    return 'El XML no es válido para importar una compra.'
  return 'No se pudo importar la compra.'
}
const refreshErrorMessage = (result: PurchaseImportResponse) =>
  result.alreadyExisted
    ? 'La compra ya estaba registrada, pero no se pudo actualizar el historial. La importación está confirmada; podés reintentar la actualización.'
    : 'La compra fue importada, pero no se pudo actualizar el historial. La importación está confirmada; podés reintentar la actualización.'

const isXmlFile = (file: File) =>
  file.name.toLowerCase().endsWith('.xml') ||
  file.type === 'application/xml' ||
  file.type === 'text/xml'

export function ImportarCompraSurface({
  importPurchase,
  onImported,
}: ImportarCompraSurfaceProps) {
  const [status, setStatus] = useState<SurfaceStatus>('closed')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmedResult, setConfirmedResult] =
    useState<PurchaseImportResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)
  const submittingRef = useRef(false)
  const wasOpen = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (status !== 'closed') wasOpen.current = true
    else if (wasOpen.current) {
      restoreFocusNextFrame(triggerRef.current, [])
      wasOpen.current = false
    }
  }, [status])

  const close = () => {
    if (submittingRef.current) return
    setStatus('closed')
    setErrorMessage(null)
    setConfirmedResult(null)
  }

  const finishConfirmedImport = async (result: PurchaseImportResponse) => {
    try {
      await onImported?.(result)
      if (!mountedRef.current) return
      setConfirmedResult(null)
      setStatus('closed')
    } catch {
      if (mountedRef.current) {
        setErrorMessage(refreshErrorMessage(result))
        setStatus('refresh-error')
      }
    }
  }

  const retryConfirmedImport = async () => {
    const result = confirmedResult
    if (!result || submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatus('loading')
    try {
      await finishConfirmedImport(result)
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || submittingRef.current) return
    if (!isXmlFile(file)) {
      setErrorMessage('Seleccioná un archivo XML válido.')
      setStatus('error')
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatus('loading')
    try {
      const result = await importPurchase({ file })
      if (!mountedRef.current) return
      setConfirmedResult(result)
      await finishConfirmedImport(result)
    } catch (error) {
      if (mountedRef.current) {
        setConfirmedResult(null)
        setErrorMessage(importErrorMessage(error))
        setStatus('error')
      }
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        isDisabled={isSubmitting}
        onPress={() => inputRef.current?.click()}
      >
        Importar compra
      </Button>
      <input
        ref={inputRef}
        data-testid="purchase-file"
        type="file"
        accept=".xml,application/xml,text/xml"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        disabled={isSubmitting}
        onChange={(event) => void handleFile(event)}
      />
      <Dialog
        isOpen={status !== 'closed'}
        isDismissable={!isSubmitting}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        aria-label="Importar compra desde XML"
      >
        <DialogHeading title="Importar compra desde XML" />
        {status === 'loading' && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-text-secondary"
          >
            {confirmedResult ? 'Actualizando historial…' : 'Importando compra…'}
          </p>
        )}
        {(status === 'error' || status === 'refresh-error') && (
          <>
            <p role="alert" className="text-sm leading-6 text-text-secondary">
              {errorMessage}
            </p>
            <DialogActions>
              <Button variant="outline" type="button" onPress={close}>
                Cerrar
              </Button>
              {status === 'refresh-error' ? (
                <Button
                  type="button"
                  onPress={() => void retryConfirmedImport()}
                >
                  Reintentar actualización
                </Button>
              ) : (
                <Button type="button" onPress={() => inputRef.current?.click()}>
                  Elegir otro archivo
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

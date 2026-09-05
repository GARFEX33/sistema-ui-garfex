import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field, FieldSeparator } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type {
  CatalogClassCreateInput,
  CatalogClassItem,
  CatalogCreated,
  CatalogFamilyCreateInput,
  CatalogFamilyItem,
  CatalogTypeCreateInput,
  CatalogTypeItem,
} from './catalogHierarchy.types'
import { useAutoClosingMessage } from './useAutoClosingMessage'

type NewDraft = { key: string; name: string; description: string }
type ParentContext = Readonly<{ id: string; label: string }>
type CreateClass = (
  input: CatalogClassCreateInput,
) => Promise<CatalogCreated<CatalogClassItem>>
type CreateFamily = (
  input: CatalogFamilyCreateInput,
) => Promise<CatalogCreated<CatalogFamilyItem>>
type CreateType = (
  input: CatalogTypeCreateInput,
) => Promise<CatalogCreated<CatalogTypeItem>>
type OnCreated = () => void | Promise<unknown>
type OnSuccess = (message: string) => void
type StructuredError = { code?: unknown; data?: unknown }
type CreateSnapshot = Readonly<NewDraft & { parent: ParentContext | null }>

export type CatalogCreateLevel = 'class' | 'family' | 'type'

export interface CatalogCreateSurfaceProps {
  level: CatalogCreateLevel
  parent?: ParentContext
  createClass?: CreateClass
  createFamily?: CreateFamily
  createType?: CreateType
  onCreated?: OnCreated
  onSuccess?: OnSuccess
}

export interface NuevaClaseSurfaceProps {
  createClass?: CreateClass
  onCreated?: OnCreated
  onSuccess?: OnSuccess
}

const emptyDraft = (): NewDraft => ({ key: '', name: '', description: '' })
const draftIdentity = (draft: NewDraft) =>
  JSON.stringify([draft.key, draft.name, draft.description])
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const names = { class: 'Clase', family: 'Familia', type: 'Tipo' } as const
const copyFor = (level: CatalogCreateLevel) => {
  const noun = names[level]
  return {
    title: `${level === 'type' ? 'Nuevo' : 'Nueva'} ${noun}`,
    action: `Crear ${noun}`,
    parentLabel:
      level === 'family' ? 'Clase' : level === 'type' ? 'Familia' : undefined,
    noun,
    failure: `No se pudo crear ${level === 'type' ? 'el' : 'la'} ${noun}.`,
  }
}

const payloadFor = (level: CatalogCreateLevel, snapshot: CreateSnapshot) => {
  const fields = {
    clave: snapshot.key,
    nombre: snapshot.name,
    ...(snapshot.description === ''
      ? {}
      : { descripcion: snapshot.description }),
  }
  if (level === 'class') return fields
  if (!snapshot.parent) return null
  return level === 'family'
    ? { claseRecursoId: snapshot.parent.id, ...fields }
    : { familiaRecursoId: snapshot.parent.id, ...fields }
}

const createRequest = (
  level: CatalogCreateLevel,
  snapshot: CreateSnapshot,
  createClass?: CreateClass,
  createFamily?: CreateFamily,
  createType?: CreateType,
) => {
  const payload = payloadFor(level, snapshot)
  if (!payload) return
  if (level === 'class')
    return createClass?.(Object.freeze(payload as CatalogClassCreateInput))
  if (level === 'family')
    return createFamily?.(Object.freeze(payload as CatalogFamilyCreateInput))
  return createType?.(Object.freeze(payload as CatalogTypeCreateInput))
}

const creationErrorMessage = (
  error: unknown,
  key: string,
  level: CatalogCreateLevel,
) => {
  if (level !== 'class') return copyFor(level).failure
  const structured = isRecord(error) ? (error as StructuredError) : undefined
  const data = isRecord(structured?.data) ? structured.data : structured
  return data?.code === 'DUPLICATE_CLASS_KEY'
    ? `Ya existe una Clase con la Clave “${key}”.`
    : copyFor(level).failure
}

export function CatalogCreateSurface({
  level,
  parent,
  createClass,
  createFamily,
  createType,
  onCreated,
  onSuccess,
}: CatalogCreateSurfaceProps) {
  const copy = copyFor(level)
  const [localSuccessMessage, showLocalSuccess] = useAutoClosingMessage()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [visibleParent, setVisibleParent] = useState<ParentContext | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const keyRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const parentRef = useRef<ParentContext | null>(null)
  const wasOpen = useRef(false)
  const submittingRef = useRef(false)
  const completedDraftRef = useRef<string | null>(null)
  const isOpenRef = useRef(isOpen)
  const { registerCommand, registerOverlay } = useKeyboardController()
  isOpenRef.current = isOpen

  const setField = (field: keyof NewDraft, value: string) => {
    completedDraftRef.current = null
    setErrorMessage(null)
    setDraft((current) => ({ ...current, [field]: value }))
  }
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      const capturedParent = parent
        ? Object.freeze({ id: parent.id, label: parent.label })
        : null
      parentRef.current = capturedParent
      setVisibleParent(capturedParent)
      openerRef.current = opener?.isConnected ? opener : null
      completedDraftRef.current = null
      setErrorMessage(null)
      setDraft(emptyDraft())
      setIsOpen(true)
    },
    [parent],
  )
  const command = useMemo(
    () => ({
      id: `catalog.new-${level}`,
      surface: 'catalog' as const,
      key: 'n',
      shortcut: 'N',
      label: copy.title,
      group: 'Catálogo',
      scope: 'active-surface' as const,
      root: () => triggerRef.current,
      isAvailable: () =>
        !isOpenRef.current && isValidFocusCandidate(triggerRef.current),
      action: open,
    }),
    [copy.title, level, open],
  )
  const canSubmit =
    (level === 'class'
      ? !!createClass
      : level === 'family'
        ? !!createFamily
        : !!createType) &&
    (level === 'class' || !!parentRef.current) &&
    draft.key.length > 0 &&
    draft.name.length > 0 &&
    !isSubmitting &&
    completedDraftRef.current !== draftIdentity(draft)

  const submit = async () => {
    if (!canSubmit || submittingRef.current) return
    const snapshot = Object.freeze({
      key: draft.key,
      name: draft.name,
      description: draft.description,
      parent: parentRef.current,
    })
    const draftKey = draftIdentity(draft)
    submittingRef.current = true
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await createRequest(
        level,
        snapshot,
        createClass,
        createFamily,
        createType,
      )
      if (!result) return
      if (result.disposition !== 'CREATED')
        throw new Error('Invalid catalog hierarchy response')
      completedDraftRef.current = draftKey
      await onCreated?.()
      const successMessage = `${copy.noun} “${snapshot.name}” ${level === 'type' ? 'creado' : 'creada'}.`
      if (onSuccess) onSuccess(successMessage)
      else showLocalSuccess(successMessage)
      close()
    } catch (error) {
      setErrorMessage(creationErrorMessage(error, snapshot.key, level))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      close()
      return
    }
    if (
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return
    if (target === cancelRef.current && event.key === 'ArrowUp') {
      event.preventDefault()
      descriptionRef.current?.focus()
      return
    }
    const fields = [keyRef.current, nameRef.current, descriptionRef.current]
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const index = fields.indexOf(
        target as HTMLInputElement | HTMLTextAreaElement,
      )
      if (index < 0) return
      if (target instanceof HTMLTextAreaElement) {
        const selectionStart = target.selectionStart
        const selectionEnd = target.selectionEnd
        const collapsed = selectionStart === selectionEnd
        if (!collapsed) return
        if (event.key === 'ArrowUp' && selectionStart !== 0) return
        if (event.key === 'ArrowDown' && selectionEnd !== target.value.length)
          return
      }
      const nextIndex = index + (event.key === 'ArrowUp' ? -1 : 1)
      const next = fields[nextIndex]
      if (!next) {
        if (event.key === 'ArrowDown' && index === fields.length - 1)
          cancelRef.current?.focus()
        return
      }
      event.preventDefault()
      next.focus()
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const submitButton = submitRef.current
    if (target === cancelRef.current && event.key === 'ArrowRight') {
      if (submitButton && !submitButton.disabled) {
        event.preventDefault()
        submitButton.focus()
      }
    } else if (target === submitButton && event.key === 'ArrowLeft') {
      event.preventDefault()
      cancelRef.current?.focus()
    }
  }

  useEffect(() => registerCommand(command), [command, registerCommand])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      keyRef.current?.focus()
    } else if (wasOpen.current) {
      restoreFocusNextFrame(openerRef.current, [
        () => triggerRef.current,
        () => document.querySelector<HTMLElement>('.navigation-catalog-link'),
      ])
      openerRef.current = null
      wasOpen.current = false
    }
  }, [isOpen])

  const keyId = `new-${level}-key`
  const nameId = `new-${level}-name`
  const descriptionId = `new-${level}-description`
  return (
    <div className="catalog-create-surface">
      <Button
        ref={triggerRef}
        data-spatial-id={command.id}
        aria-label={copy.title}
        onPress={() => open(triggerRef.current)}
      >
        <span>{copy.title}</span>
        <kbd>{command.shortcut}</kbd>
      </Button>

      <Dialog
        ref={dialogRef}
        isOpen={isOpen}
        height={440}
        onOpenChange={(openState) => !openState && close()}
        data-approved-frame={
          level === 'class' ? 'n2418' : level === 'family' ? 'n2487' : 'n2556'
        }
        aria-label={copy.title}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              close()
            }
          }}
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeading title={copy.title} />
          <div className="catalog-dialog-content">
            {visibleParent && copy.parentLabel && (
              <div className="catalog-creation-parent">
                <span>{copy.parentLabel}</span>
                <output
                  data-testid="creation-parent"
                  data-parent-id={visibleParent.id}
                >
                  {visibleParent.label}
                </output>
              </div>
            )}
            <div className="catalog-dialog-fields">
              <Field label="Clave" htmlFor={keyId} hideLabel={level === 'class'}>
                <input
                  ref={keyRef}
                  onKeyDown={handleDialogKeyDown}
                  id={keyId}
                  placeholder="Clave"
                  className={fieldInputClass}
                  value={draft.key}
                  disabled={isSubmitting}
                  onChange={(event) => setField('key', event.target.value)}
                />
              </Field>
              <FieldSeparator />
              <Field label="NOMBRE" htmlFor={nameId} emphasis>
                <input
                  ref={nameRef}
                  onKeyDown={handleDialogKeyDown}
                  id={nameId}
                  aria-label="Nombre"
                  className={fieldInputClass}
                  value={draft.name}
                  disabled={isSubmitting}
                  onChange={(event) => setField('name', event.target.value)}
                />
              </Field>
              <FieldSeparator />
              <Field label="DESCRIPCIÓN" htmlFor={descriptionId}>
                <textarea
                  ref={descriptionRef}
                  onKeyDown={handleDialogKeyDown}
                  id={descriptionId}
                  aria-label="Descripción"
                  className={`${fieldInputClass} h-[60px] resize-none`}
                  value={draft.description}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setField('description', event.target.value)
                  }
                />
              </Field>
              <FieldSeparator />
            </div>
            <div className="catalog-dialog-error-region" role="alert">
              <span aria-hidden="true">{errorMessage ? '⚠' : ''}</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <DialogActions>
            <Button
              ref={cancelRef}
              variant="outline"
              onKeyDown={handleDialogKeyDown}
              onPress={close}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              ref={submitRef}
              onKeyDown={handleDialogKeyDown}
              isDisabled={!canSubmit}
              type="submit"
            >
              {copy.action}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {!onSuccess && localSuccessMessage && (
        <div className="catalog-success-toast" role="status" aria-live="polite">
          {localSuccessMessage}
        </div>
      )}
    </div>
  )
}

export function NuevaClaseSurface({
  createClass,
  onCreated,
  onSuccess,
}: NuevaClaseSurfaceProps) {
  return (
    <CatalogCreateSurface
      level="class"
      createClass={createClass}
      onCreated={onCreated}
      onSuccess={onSuccess}
    />
  )
}

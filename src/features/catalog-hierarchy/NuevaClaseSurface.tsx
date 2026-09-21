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
import { RestActorConfigurationError } from '../../shared/api/restActor'
import { CatalogHierarchyRestError } from './catalogHierarchy.api'
import type {
  CatalogClassRestCreateInput,
  CatalogClassRestItem,
  CatalogFamilyRestCreateInput,
  CatalogFamilyRestCreateOutput,
  CatalogTypeRestCreateInput,
  CatalogTypeRestCreateOutput,
} from './catalogHierarchy.types'
import { useAutoClosingMessage } from './useAutoClosingMessage'

type NewDraft = {
  key: string
  name: string
  plural: string
  slug: string
}
type ParentContext = Readonly<{
  classCode: string
  classLabel: string
  familyCode?: string
  familyLabel?: string
  contextVersion?: number
}>
type CreateClass = (
  input: CatalogClassRestCreateInput,
) => Promise<CatalogClassRestItem>
type CreateFamily = (
  input: CatalogFamilyRestCreateInput,
) => Promise<CatalogFamilyRestCreateOutput>
type CreateType = (
  input: CatalogTypeRestCreateInput,
) => Promise<CatalogTypeRestCreateOutput>
type OnCreated = () => void | Promise<boolean | void>
type OnSuccess = (message: string) => void
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
  actorAvailable?: boolean
}

export interface NuevaClaseSurfaceProps {
  createClass?: CreateClass
  onCreated?: OnCreated
  onSuccess?: OnSuccess
  actorAvailable?: boolean
}

const emptyDraft = (): NewDraft => ({
  key: '',
  name: '',
  plural: '',
  slug: '',
})
const draftIdentity = (draft: NewDraft) => JSON.stringify(draft)
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

const validParent = (level: CatalogCreateLevel, parent: ParentContext | null) =>
  level === 'class' ||
  (parent !== null &&
    parent.classCode.length > 0 &&
    (level === 'family' ||
      (typeof parent.familyCode === 'string' && parent.familyCode.length > 0)))

const sameParent = (
  level: CatalogCreateLevel,
  captured: ParentContext | null,
  current: ParentContext | undefined,
) =>
  validParent(level, captured) &&
  validParent(level, current ?? null) &&
  captured?.classCode === current?.classCode &&
  captured?.contextVersion === current?.contextVersion &&
  (level === 'family' || captured?.familyCode === current?.familyCode)

const payloadFor = (level: CatalogCreateLevel, snapshot: CreateSnapshot) => {
  if (level === 'class')
    return {
      code: snapshot.key,
      name: snapshot.name,
      plural: snapshot.plural,
      slug: snapshot.slug,
    }
  const parent = snapshot.parent
  if (!parent || !validParent(level, parent)) return null
  if (level === 'family')
    return {
      class: { kind: 'CLASE' as const, code: parent.classCode },
      code: snapshot.key,
      name: snapshot.name,
    }
  return {
    class: { kind: 'CLASE' as const, code: parent.classCode },
    family: { kind: 'FAMILIA' as const, code: parent.familyCode! },
    code: snapshot.key,
    name: snapshot.name,
  }
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
    return createClass?.(Object.freeze(payload as CatalogClassRestCreateInput))
  if (level === 'family')
    return createFamily?.(
      Object.freeze(payload as CatalogFamilyRestCreateInput),
    )
  return createType?.(Object.freeze(payload as CatalogTypeRestCreateInput))
}

const creationErrorMessage = (error: unknown, level: CatalogCreateLevel) => {
  if (error instanceof RestActorConfigurationError)
    return `No se puede crear ${level === 'type' ? 'el' : 'la'} ${copyFor(level).noun} sin configurar el actor local.`
  if (
    error instanceof CatalogHierarchyRestError &&
    error.failure.kind === 'http'
  )
    return copyFor(level).failure
  return copyFor(level).failure
}

export function CatalogCreateSurface({
  level,
  parent,
  createClass,
  createFamily,
  createType,
  onCreated,
  onSuccess,
  actorAvailable = true,
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
  const pluralRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const parentRef = useRef<ParentContext | null>(null)
  const currentParentRef = useRef(parent)
  const mountedRef = useRef(true)
  const wasOpen = useRef(false)
  const submittingRef = useRef(false)
  const submissionTokenRef = useRef<symbol | null>(null)
  const completedDraftRef = useRef<string | null>(null)
  const isOpenRef = useRef(isOpen)
  const hierarchyContextKey = JSON.stringify([
    parent?.classCode,
    parent?.familyCode,
    parent?.contextVersion,
  ])
  const contextKeyRef = useRef(hierarchyContextKey)
  const generationRef = useRef(0)
  const openGenerationRef = useRef(0)
  const { registerCommand, registerOverlay } = useKeyboardController()
  isOpenRef.current = isOpen
  currentParentRef.current = parent

  const setField = (field: keyof NewDraft, value: string) => {
    completedDraftRef.current = null
    setErrorMessage(null)
    setDraft((current) => ({ ...current, [field]: value }))
  }
  const close = useCallback(() => {
    if (!submittingRef.current) setIsOpen(false)
  }, [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      const capturedParent = parent
        ? Object.freeze({
            classCode: parent.classCode,
            classLabel: parent.classLabel,
            ...(parent.familyCode === undefined
              ? {}
              : { familyCode: parent.familyCode }),
            ...(parent.familyLabel === undefined
              ? {}
              : { familyLabel: parent.familyLabel }),
            ...(parent.contextVersion === undefined
              ? {}
              : { contextVersion: parent.contextVersion }),
          })
        : null
      generationRef.current += 1
      openGenerationRef.current = generationRef.current
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
    actorAvailable &&
    (level === 'class'
      ? !!createClass
      : level === 'family'
        ? !!createFamily
        : !!createType) &&
    validParent(level, parentRef.current) &&
    draft.key.length > 0 &&
    draft.name.length > 0 &&
    (level !== 'class' || (draft.plural.length > 0 && draft.slug.length > 0)) &&
    !isSubmitting &&
    completedDraftRef.current !== draftIdentity(draft)

  const submit = async () => {
    if (!canSubmit || submittingRef.current) return
    const snapshot = Object.freeze({
      key: draft.key,
      name: draft.name,
      plural: draft.plural,
      slug: draft.slug,
      parent: parentRef.current,
    })
    const draftKey = draftIdentity(draft)
    const submissionGeneration = openGenerationRef.current
    const isCurrentSubmission = () =>
      mountedRef.current &&
      submissionGeneration === generationRef.current &&
      sameParent(level, snapshot.parent, currentParentRef.current)
    if (!isCurrentSubmission()) {
      setErrorMessage(creationErrorMessage(new Error('stale context'), level))
      return
    }
    const submissionToken = Symbol('catalog-submission')
    submissionTokenRef.current = submissionToken
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
      if (!result) throw new Error('Invalid catalog hierarchy response')
      if (!isCurrentSubmission()) return
      if ((await onCreated?.()) === false)
        throw new Error('Authoritative list refresh failed')
      if (!isCurrentSubmission()) return
      completedDraftRef.current = draftKey
      const successMessage = `${copy.noun} “${snapshot.name}” ${level === 'type' ? 'creado' : 'creada'}.`
      if (onSuccess) onSuccess(successMessage)
      else showLocalSuccess(successMessage)
      setIsOpen(false)
    } catch (error) {
      if (isCurrentSubmission())
        setErrorMessage(creationErrorMessage(error, level))
    } finally {
      if (submissionTokenRef.current === submissionToken) {
        submissionTokenRef.current = null
        submittingRef.current = false
        if (mountedRef.current) setIsSubmitting(false)
      }
    }
  }

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.stopPropagation()
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
    const fields =
      level === 'class'
        ? [keyRef.current, nameRef.current, pluralRef.current, slugRef.current]
        : [keyRef.current, nameRef.current]
    if (target === cancelRef.current && event.key === 'ArrowUp') {
      event.preventDefault()
      fields.at(-1)?.focus()
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const index = fields.indexOf(target as HTMLInputElement)
      if (index < 0) return
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

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  useEffect(() => {
    if (contextKeyRef.current !== hierarchyContextKey) {
      contextKeyRef.current = hierarchyContextKey
      generationRef.current += 1
    }
  }, [hierarchyContextKey])
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
  const pluralId = `new-${level}-plural`
  const slugId = `new-${level}-slug`
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
        onOpenChange={(openState) => {
          if (!openState) close()
        }}
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
              event.stopPropagation()
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
              <div
                className="catalog-creation-parent"
                data-testid="creation-parent"
                data-parent-code={visibleParent.classCode}
              >
                <span>Clase</span>
                <output data-parent-code={visibleParent.classCode}>
                  {visibleParent.classLabel}
                </output>
                {level === 'type' && visibleParent.familyLabel && (
                  <>
                    <span>Familia</span>
                    <output data-parent-code={visibleParent.familyCode}>
                      {visibleParent.familyLabel}
                    </output>
                  </>
                )}
              </div>
            )}
            <div className="catalog-dialog-fields">
              <Field
                label="Clave"
                htmlFor={keyId}
                hideLabel={level === 'class'}
              >
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
              {level === 'class' ? (
                <>
                  <Field label="PLURAL" htmlFor={pluralId}>
                    <input
                      ref={pluralRef}
                      onKeyDown={handleDialogKeyDown}
                      id={pluralId}
                      aria-label="Plural"
                      className={fieldInputClass}
                      value={draft.plural}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setField('plural', event.target.value)
                      }
                    />
                  </Field>
                  <FieldSeparator />
                  <Field label="SLUG" htmlFor={slugId}>
                    <input
                      ref={slugRef}
                      onKeyDown={handleDialogKeyDown}
                      id={slugId}
                      aria-label="Slug"
                      className={fieldInputClass}
                      value={draft.slug}
                      disabled={isSubmitting}
                      onChange={(event) => setField('slug', event.target.value)}
                    />
                  </Field>
                  <FieldSeparator />
                </>
              ) : null}
            </div>
            <div className="catalog-dialog-error-region" role="alert">
              <span aria-hidden="true">
                {errorMessage || actorAvailable ? '' : '⚠'}
              </span>
              <span>
                {errorMessage ??
                  (actorAvailable
                    ? null
                    : `No se puede crear ${level === 'type' ? 'el' : 'la'} ${copy.noun} sin configurar el actor local.`)}
              </span>
            </div>
          </div>
          <DialogActions>
            <Button
              ref={cancelRef}
              variant="outline"
              onKeyDown={handleDialogKeyDown}
              onPress={close}
              isDisabled={isSubmitting}
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
  actorAvailable,
}: NuevaClaseSurfaceProps) {
  return (
    <CatalogCreateSurface
      level="class"
      createClass={createClass}
      onCreated={onCreated}
      onSuccess={onSuccess}
      actorAvailable={actorAvailable}
    />
  )
}

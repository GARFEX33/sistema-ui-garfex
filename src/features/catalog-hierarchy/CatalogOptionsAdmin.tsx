import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { WorkCard } from '../../shared/ui/WorkCard'
import {
  CatalogOptionForm,
  type CatalogOptionCommandDraft,
} from './CatalogOptionForm'
import {
  CatalogOptionLifecycleConfirmation,
  type CatalogOptionLifecycleIntent,
} from './CatalogOptionLifecycleConfirmation'
import type {
  CatalogOptionAdminRecord,
  CatalogOptionsAdminCreateInput,
  CatalogOptionsAdminReference,
  CatalogOptionsAdminReferences,
  CatalogOptionsAdminUpdateInput,
} from './catalogOptionsAdmin.types'
import type {
  CatalogOptionsAdminCommandStatus,
  CatalogOptionsAdminStatus,
} from './useCatalogOptionsAdmin'

type Surface =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; record: CatalogOptionAdminRecord }
  | { kind: 'lifecycle'; record: CatalogOptionAdminRecord }
  | { kind: 'delete'; record: CatalogOptionAdminRecord }

export type CatalogOptionsAdminProps = Readonly<{
  optionSetCode?: string
  characteristicCode: string
  status: CatalogOptionsAdminStatus
  records: readonly CatalogOptionAdminRecord[]
  error: Error | null
  offset: number
  limit: number
  hasPrevious: boolean
  hasNext: boolean
  actorAvailable: boolean
  commandStatus: CatalogOptionsAdminCommandStatus
  commandError: Error | null
  references: CatalogOptionsAdminReferences | null
  referenceStatus: 'waiting-context' | 'loading' | 'ready' | 'error'
  referenceError: Error | null
  retryReferences: () => void
  retry: () => void
  previous: () => void
  next: () => void
  create: (input: CatalogOptionsAdminCreateInput) => Promise<unknown>
  update: (input: CatalogOptionsAdminUpdateInput) => Promise<unknown>
  deactivate: (input: CatalogOptionsAdminUpdateInput) => Promise<unknown>
  reactivate: (input: CatalogOptionsAdminUpdateInput) => Promise<unknown>
  deleteAvailable?: boolean
  delete?: (input: { id: string; expectedRevision: string }) => Promise<unknown>
}>

const globalWarning = (optionSetCode: string, characteristicCode: string) => (
  <aside
    aria-label="Advertencia de alcance global"
    className="mt-4 rounded-md border border-border-strong bg-surface-subtle p-3 text-sm leading-6 text-text-primary"
    role="note"
  >
    Advertencia: los cambios afectan globalmente a todos los consumidores de
    optionSetCode {optionSetCode} y characteristicCode {characteristicCode}.
  </aside>
)

function OptionRow({
  record,
  pending,
  onEdit,
  onLifecycle,
  onDelete,
  canDelete,
  cardRef,
  tabIndex,
  onFocus,
}: {
  record: CatalogOptionAdminRecord
  pending: boolean
  onEdit: () => void
  onLifecycle: () => void
  onDelete: () => void
  canDelete: boolean
  cardRef: (node: HTMLButtonElement | null) => void
  tabIndex: 0 | -1
  onFocus: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const menuItems = useRef<Array<HTMLButtonElement | null>>([])
  const action = record.active ? 'Desactivar' : 'Reactivar'
  const menuItemCount = canDelete ? 3 : 2
  const closeMenu = () => {
    setMenuOpen(false)
    requestAnimationFrame(() => menuTrigger.current?.focus())
  }
  const focusMenuItem = (index: number) => menuItems.current[index]?.focus()
  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      return
    }
    const currentIndex = menuItems.current.findIndex(
      (item) => item === document.activeElement,
    )
    const nextIndex =
      event.key === 'ArrowDown'
        ? currentIndex === -1
          ? 0
          : (currentIndex + 1) % menuItemCount
        : event.key === 'ArrowUp'
          ? currentIndex <= 0
            ? menuItemCount - 1
            : currentIndex - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? menuItemCount - 1
              : null
    if (nextIndex === null) {
      if (event.key === 'j' || event.key === 'k' || event.key === 'n')
        event.stopPropagation()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    focusMenuItem(nextIndex)
  }

  useEffect(() => {
    if (menuOpen) focusMenuItem(0)
  }, [menuOpen])

  return (
    <li className="flex items-start gap-2 rounded-lg border border-border bg-surface p-2">
      <Button
        aria-label={`Editar opción ${record.label}`}
        className="flex min-h-0 flex-1 items-start justify-between border-border bg-surface px-3 py-2 text-left text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
        excludeFromTabOrder={tabIndex === -1}
        isDisabled={pending}
        onFocus={onFocus}
        onPress={onEdit}
        ref={cardRef}
        type="button"
        variant="outline"
      >
        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold">
            {record.label}
          </span>
          <span className="block break-words text-xs text-text-secondary">
            Código: {record.code}
          </span>
        </span>
        <span className="rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
          {record.active ? 'Activa' : 'Inactiva'}
        </span>
      </Button>
      <div className="relative flex-none">
        <Button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Acciones para ${record.label}`}
          className="min-h-0 border-border px-2 py-1 text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          isDisabled={pending}
          onKeyDown={(event) => {
            if (menuOpen && event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              closeMenu()
            }
          }}
          onPress={() => setMenuOpen((open) => !open)}
          ref={menuTrigger}
          type="button"
          variant="outline"
        >
          ⋮
        </Button>
        {menuOpen && (
          <div
            aria-label={`Acciones de ${record.label}`}
            className="absolute right-0 top-full z-10 mt-1 flex min-w-32 flex-col gap-1 rounded-md border border-border bg-surface p-1 shadow-lg"
            onKeyDown={onMenuKeyDown}
            role="menu"
          >
            <button
              className="cursor-pointer rounded px-2 py-1 text-left text-sm font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
              onClick={onEdit}
              ref={(node) => {
                menuItems.current[0] = node
              }}
              role="menuitem"
              type="button"
            >
              Editar
            </button>
            <button
              className="cursor-pointer rounded px-2 py-1 text-left text-sm font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
              onClick={onLifecycle}
              ref={(node) => {
                menuItems.current[1] = node
              }}
              role="menuitem"
              type="button"
            >
              {action}
            </button>
            {canDelete && (
              <button
                className="cursor-pointer rounded px-2 py-1 text-left text-sm font-semibold text-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                onClick={onDelete}
                ref={(node) => {
                  menuItems.current[2] = node
                }}
                role="menuitem"
                type="button"
              >
                Eliminar permanentemente
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function CatalogOptionsAdmin({
  optionSetCode,
  characteristicCode,
  status,
  records,
  error,
  offset,
  limit,
  hasPrevious,
  hasNext,
  actorAvailable,
  commandStatus,
  commandError,
  retry,
  previous,
  next,
  create,
  update,
  deactivate,
  reactivate,
  deleteAvailable,
  delete: remove,
  references,
  referenceStatus,
  referenceError,
  retryReferences,
}: CatalogOptionsAdminProps) {
  const [surface, setSurface] = useState<Surface>({ kind: 'list' })
  const [focusedCardId, setFocusedCardId] = useState<string | null>(
    records[0]?.id ?? null,
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const createRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<string | 'create' | null>(null)
  const lifecycleCancel = useRef<HTMLButtonElement>(null)
  const pending = commandStatus === 'pending'
  const record = records[0]
  const optionSet = references?.optionSet ?? record?.optionSet
  const characteristic = references?.characteristic ?? record?.characteristic
  const canCreate =
    referenceStatus === 'ready' && !!optionSet && !!characteristic && !pending
  const restoreList = () => {
    setSurface({ kind: 'list' })
    requestAnimationFrame(() => {
      const target =
        returnFocus.current === 'create'
          ? createRef.current
          : returnFocus.current
            ? cardRefs.current.get(returnFocus.current)
            : null
      ;(
        target ??
        (createRef.current?.disabled ? null : createRef.current) ??
        rootRef.current?.querySelector<HTMLButtonElement>(
          'button:not(:disabled)',
        )
      )?.focus()
    })
  }
  const startCreate = () => {
    if (!canCreate) return
    returnFocus.current = 'create'
    setSurface({ kind: 'create' })
  }
  const openEdit = (item: CatalogOptionAdminRecord) => {
    returnFocus.current = item.id
    setSurface({ kind: 'edit', record: item })
  }
  const openLifecycle = (item: CatalogOptionAdminRecord) => {
    returnFocus.current = item.id
    setSurface({ kind: 'lifecycle', record: item })
  }
  const openDelete = (item: CatalogOptionAdminRecord) => {
    if (!deleteAvailable || !remove || item.active) return
    returnFocus.current = item.id
    setSurface({ kind: 'delete', record: item })
  }
  const refreshedDeleteRecord = (item: CatalogOptionAdminRecord) =>
    records.find((candidate) => candidate.id === item.id) ?? item
  const isEditingTarget = (target: EventTarget | null) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  const onLocalKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.nativeEvent.isComposing
    )
      return
    if (event.key === 'Escape' && surface.kind !== 'list') {
      event.stopPropagation()
      if (pending) {
        event.preventDefault()
        return
      }
      restoreList()
      return
    }
    if (isEditingTarget(event.target)) return
    if (event.key === 'n') {
      event.stopPropagation()
      if (surface.kind === 'list') {
        event.preventDefault()
        startCreate()
      }
      return
    }
    if (surface.kind !== 'list') return
    const card = Array.from(cardRefs.current.values()).find(
      (node) => node === event.target,
    )
    if (event.key === 'Enter' && card) {
      event.stopPropagation()
      return
    }
    const direction =
      event.key === 'ArrowDown' || event.key === 'j'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'k'
          ? -1
          : 0
    if (!direction || records.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const currentIndex = records.findIndex(
      (item) => cardRefs.current.get(item.id) === document.activeElement,
    )
    const nextIndex =
      currentIndex === -1
        ? direction > 0
          ? 0
          : records.length - 1
        : (currentIndex + direction + records.length) % records.length
    const nextId = records[nextIndex].id
    setFocusedCardId(nextId)
    cardRefs.current.get(nextId)?.focus()
  }
  useEffect(() => {
    if (surface.kind !== 'list' || records.length === 0) return
    if (!records.some((item) => item.id === focusedCardId))
      setFocusedCardId(records[0].id)
  }, [focusedCardId, records, surface.kind])

  useEffect(() => {
    if (surface.kind !== 'create' && surface.kind !== 'edit') return
    requestAnimationFrame(() =>
      rootRef.current?.querySelector<HTMLInputElement>('input')?.focus(),
    )
  }, [surface])

  const runForm = async (draft: CatalogOptionCommandDraft) => {
    const result = 'id' in draft ? await update(draft) : await create(draft)
    if (result !== false) restoreList()
  }
  const runDelete = async (intent: CatalogOptionLifecycleIntent) => {
    if (surface.kind !== 'delete' || intent.action !== 'delete' || !remove)
      return
    const result = await remove({
      id: intent.id,
      expectedRevision: intent.expectedRevision,
    })
    if (result !== false) restoreList()
  }
  const runLifecycle = async (intent: CatalogOptionLifecycleIntent) => {
    const values = {
      optionSet:
        surface.kind === 'lifecycle' ? surface.record.optionSet : optionSet,
      characteristic:
        surface.kind === 'lifecycle'
          ? surface.record.characteristic
          : characteristic,
      code: surface.kind === 'lifecycle' ? surface.record.code : '',
      label: surface.kind === 'lifecycle' ? surface.record.label : '',
    }
    if (!values.optionSet || !values.characteristic) return
    const input: CatalogOptionsAdminUpdateInput = {
      id: intent.id,
      expectedRevision: intent.expectedRevision,
      values: values as {
        optionSet: CatalogOptionsAdminReference<'CONJUNTO_OPCIONES'>
        characteristic: CatalogOptionsAdminReference<'CARACTERISTICA'>
        code: string
        label: string
      },
    }
    const result =
      intent.action === 'deactivate'
        ? await deactivate(input)
        : await reactivate(input)
    if (result !== false) restoreList()
    else
      requestAnimationFrame(() =>
        requestAnimationFrame(() => lifecycleCancel.current?.focus()),
      )
  }

  if (!optionSetCode) {
    return (
      <WorkCard aria-labelledby="catalog-options-unavailable" density="compact">
        <h3
          id="catalog-options-unavailable"
          className="m-0 text-sm font-bold text-text-primary"
        >
          Administración de opciones no disponible
        </h3>
        <p className="mb-0 mt-3 text-sm leading-6 text-text-secondary">
          Este atributo no incluye un optionSetCode, por lo que no hay opciones
          base compartidas para mostrar.
        </p>
      </WorkCard>
    )
  }

  return (
    <WorkCard aria-labelledby="catalog-options-title" density="compact">
      <div onKeyDown={onLocalKeyDown} ref={rootRef}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3
              id="catalog-options-title"
              className="m-0 text-sm font-bold text-text-primary"
            >
              Opciones base compartidas
            </h3>
            <p className="mb-0 mt-1 text-sm text-text-secondary">
              Ventana pública de opciones para este conjunto y característica.
            </p>
          </div>
          <dl className="m-0 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-text-secondary">
                optionSetCode
              </dt>
              <dd className="m-0 break-words text-text-primary">
                {optionSetCode}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text-secondary">
                characteristicCode
              </dt>
              <dd className="m-0 break-words text-text-primary">
                {characteristicCode}
              </dd>
            </div>
          </dl>
        </div>
        {globalWarning(optionSetCode, characteristicCode)}
        <div className="mt-4">
          {surface.kind === 'create' && optionSet && characteristic ? (
            <CatalogOptionForm
              actorAvailable={actorAvailable}
              characteristic={characteristic}
              commandError={commandError}
              commandStatus={commandStatus}
              mode="create"
              onCancel={restoreList}
              onSubmit={runForm}
              optionSet={optionSet}
            />
          ) : surface.kind === 'edit' ? (
            <CatalogOptionForm
              actorAvailable={actorAvailable}
              characteristic={surface.record.characteristic}
              commandError={commandError}
              commandStatus={commandStatus}
              mode="edit"
              onCancel={restoreList}
              onSubmit={runForm}
              optionSet={surface.record.optionSet}
              record={surface.record}
            />
          ) : surface.kind === 'lifecycle' ? (
            <CatalogOptionLifecycleConfirmation
              actorAvailable={actorAvailable}
              commandError={commandError}
              commandStatus={commandStatus}
              cancelButtonRef={lifecycleCancel}
              onCancel={restoreList}
              onConfirm={runLifecycle}
              record={surface.record}
            />
          ) : surface.kind === 'delete' ? (
            <CatalogOptionLifecycleConfirmation
              actorAvailable={actorAvailable}
              commandError={commandError}
              commandStatus={commandStatus}
              key={`${surface.record.id}:${refreshedDeleteRecord(surface.record).revision}`}
              mode="delete"
              onCancel={restoreList}
              onConfirm={runDelete}
              record={refreshedDeleteRecord(surface.record)}
            />
          ) : status === 'ready' || status === 'empty' ? (
            <>
              {status === 'empty' && (
                <p
                  className="m-0 text-sm leading-6 text-text-secondary"
                  role="status"
                >
                  No hay opciones base compartidas en esta ventana.
                </p>
              )}
              {referenceStatus === 'error' && (
                <div className="mb-3 space-y-2" role="alert">
                  <p className="m-0 text-sm leading-6 text-text-primary">
                    No se pudo confirmar el contexto canónico de opciones.
                  </p>
                  {referenceError && (
                    <p className="m-0 text-sm text-text-secondary">
                      {referenceError.message}
                    </p>
                  )}
                  <Button
                    onPress={retryReferences}
                    type="button"
                    variant="outline"
                  >
                    Reintentar contexto canónico
                  </Button>
                </div>
              )}
              <div className="mb-3">
                <Button
                  className="border-primary bg-primary text-surface hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                  isDisabled={!canCreate}
                  onPress={startCreate}
                  ref={createRef}
                  type="button"
                >
                  Nueva opción
                </Button>
              </div>
              <ol
                aria-label="Opciones compartidas"
                className="m-0 list-none space-y-2 p-0"
              >
                {records.map((item) => (
                  <OptionRow
                    cardRef={(node) => {
                      if (node) cardRefs.current.set(item.id, node)
                      else cardRefs.current.delete(item.id)
                    }}
                    key={item.id}
                    pending={pending}
                    record={item}
                    canDelete={!!deleteAvailable && !!remove && !item.active}
                    onDelete={() => openDelete(item)}
                    onEdit={() => openEdit(item)}
                    onFocus={() => setFocusedCardId(item.id)}
                    onLifecycle={() => openLifecycle(item)}
                    tabIndex={focusedCardId === item.id ? 0 : -1}
                  />
                ))}
              </ol>
            </>
          ) : status === 'error' ? (
            <div className="space-y-3" role="alert">
              <p className="m-0 text-sm leading-6 text-text-primary">
                No se pudieron cargar las opciones compartidas.
              </p>
              {error && (
                <p className="m-0 text-sm text-text-secondary">
                  {error.message}
                </p>
              )}
              <Button
                aria-label="Reintentar opciones compartidas"
                onPress={retry}
                variant="outline"
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <p
              className="m-0 text-sm leading-6 text-text-secondary"
              role="status"
            >
              {status === 'loading'
                ? 'Cargando opciones compartidas…'
                : 'Esperando el contexto completo de opciones compartidas.'}
            </p>
          )}
        </div>
        {surface.kind === 'list' &&
          (status === 'ready' || status === 'empty') && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="m-0 text-sm text-text-secondary">
                Desplazamiento {offset} · Límite {limit}
              </p>
              <p className="mb-0 mt-1 text-sm leading-6 text-text-secondary">
                El orden entre ventanas no está garantizado.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  aria-label="Opciones anteriores"
                  isDisabled={!hasPrevious || pending}
                  onPress={previous}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  aria-label="Siguientes opciones"
                  isDisabled={!hasNext || pending}
                  onPress={next}
                  variant="outline"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
      </div>
    </WorkCard>
  )
}

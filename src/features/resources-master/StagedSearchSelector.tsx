import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Input,
  Label,
  ListBox,
  ListBoxItem,
  SearchField,
} from 'react-aria-components'
import { Button } from '../../shared/ui/Button'
import {
  deriveVisibleStagedSelectorItems,
  isPrintableStagedSelectorKey,
  repairCandidateKey,
  stagedSelectorBoundedHeightClass,
} from './stagedSearchSelector.model'

export type SelectorLoadState =
  | { status: 'loading' }
  | { status: 'ready'; exhausted: boolean }
  | { status: 'loading-more' }
  | { status: 'empty' }
  | { status: 'initial-error' }
  | { status: 'partial-error' }
  // Slice E2: a level whose parent hasn't been confirmed yet (e.g. Familia
  // before a Clase is selected). Distinct from 'empty' (which means the
  // parent WAS confirmed but has zero children) so the caller can show a
  // "select the parent first" message instead of "no options available".
  | { status: 'waiting-for-parent' }

type StagedSearchSelectorProps<T> = {
  label: string
  autoFocus?: boolean
  items: readonly T[]
  itemKey: (item: T) => string
  itemName: (item: T) => string
  renderItem?: (item: T) => ReactNode
  preferredActiveKey?: string | null
  confirmedKey?: string | null
  loadState: SelectorLoadState
  onConfirm: (item: T) => void
  onLoadMore: () => void
  onRetry: () => void
  // Additive, command-palette mode: when set, the list is capped to roughly
  // this many rows with an internal scrollbar instead of growing to fit
  // every item (see stagedSelectorBoundedHeightClass). This is also the
  // signal that the caller already loaded the complete list up front, so
  // "Cargar más…"/partial-error continuation affordances (which assume
  // server-side paging) no longer make sense and are hidden. Omitted, the
  // component behaves exactly as before (used by the resource-creation
  // wizard's accumulate-and-page StagedSearchSelector today).
  maxVisibleRows?: number
  // Message shown for loadState.status === 'waiting-for-parent'. Optional
  // because most callers (e.g. the resource-creation wizard) never reach
  // that status — each stage is only rendered once its parent is already
  // confirmed — so a generic fallback covers them.
  waitingForParentLabel?: string
  // Additive: when set, applied as `data-spatial-id` on the search input so
  // AppShell's cross-region arrow-key navigation can land focus on this
  // column from outside the component (see AppShell.tsx's resources.class/
  // family/type hop). Omitted, no attribute is rendered — the
  // resource-creation wizard's usage is unaffected.
  spatialId?: string
}

export function StagedSearchSelector<T>({
  label,
  autoFocus = false,
  items,
  itemKey,
  itemName,
  renderItem = itemName,
  preferredActiveKey = null,
  confirmedKey = null,
  loadState,
  onConfirm,
  onLoadMore,
  onRetry,
  maxVisibleRows,
  waitingForParentLabel,
  spatialId,
}: StagedSearchSelectorProps<T>) {
  const bounded = maxVisibleRows !== undefined
  const [query, setQuery] = useState('')
  const [candidateKey, setCandidateKey] = useState<string | null>(null)
  const preferredApplied = useRef(false)
  const restoreLoadMoreFocus = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listBoxRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLButtonElement>(null)
  const retryContinuationRef = useRef<HTMLButtonElement>(null)
  const visibleItems = useMemo(
    () =>
      deriveVisibleStagedSelectorItems(
        items.map((item) => ({
          key: itemKey(item),
          displayName: itemName(item),
          item,
        })),
        query,
      ),
    [itemKey, itemName, items, query],
  )

  useEffect(() => {
    const preferredKey = preferredApplied.current ? null : preferredActiveKey
    const repaired = repairCandidateKey(
      visibleItems,
      candidateKey,
      preferredKey,
    )
    if (repaired !== candidateKey) setCandidateKey(repaired)
    if (visibleItems.length) preferredApplied.current = true
  }, [candidateKey, preferredActiveKey, visibleItems])

  const canLoadMore =
    !bounded && loadState.status === 'ready' && !loadState.exhausted
  const filteredEmpty = !visibleItems.length && items.length > 0
  // Bounded columns (e.g. the Clase/Familia/Tipo grid in
  // ResourcesMasterScreen) render side by side and must keep an identical
  // height no matter what each one is currently showing, so every one-line
  // status text that would otherwise render below the list is folded into
  // this same fixed-height slot instead of stacking extra height onto just
  // one column.
  const boundedMessage: {
    role: 'status' | 'alert'
    text: string
    showRetry?: boolean
  } | null = !bounded
    ? null
    : loadState.status === 'initial-error'
      ? {
          role: 'alert',
          text: 'No se pudieron cargar las opciones.',
          showRetry: true,
        }
      : filteredEmpty
        ? { role: 'status', text: 'Sin resultados.' }
        : loadState.status === 'empty' && !items.length
          ? { role: 'status', text: 'No hay opciones disponibles.' }
          : null

  useEffect(() => {
    if (!restoreLoadMoreFocus.current || loadState.status === 'loading-more')
      return
    restoreLoadMoreFocus.current = false
    const restoreFocus = () => {
      const activeElement = document.activeElement
      const focusWasLost =
        activeElement === document.body ||
        activeElement === document.documentElement
      if (!focusWasLost) return
      if (canLoadMore) loadMoreRef.current?.focus()
      else if (loadState.status === 'partial-error')
        retryContinuationRef.current?.focus()
      else inputRef.current?.focus()
    }
    const frame = window.requestAnimationFrame(restoreFocus)
    return () => window.cancelAnimationFrame(frame)
  }, [canLoadMore, items, loadState.status])
  const focusCandidate = () => {
    const key = candidateKey ?? visibleItems[0]?.key
    Array.from(
      listBoxRef.current?.querySelectorAll<HTMLElement>('[data-key]') ?? [],
    )
      .find((option) => option.dataset.key === key)
      ?.focus()
  }

  return (
    <section
      aria-label={`${label}: selección por etapas`}
      className="grid gap-2"
    >
      <SearchField value={query} onChange={setQuery} className="grid gap-1">
        <Label className="text-sm font-bold tracking-[0.08em] text-text-primary">
          {label}
        </Label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-muted"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M16.5 16.5 12.9 12.9" strokeLinecap="round" />
          </svg>
          <Input
            ref={inputRef}
            aria-label={label}
            autoFocus={autoFocus}
            data-spatial-id={spatialId}
            placeholder={`Buscar ${label.toLocaleLowerCase('es')}...`}
            className="min-h-9 w-full rounded-md border border-border bg-surface py-2 pr-3 pl-8 text-sm text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/40"
            onKeyDown={(event) => {
              if (
                event.defaultPrevented ||
                event.nativeEvent.isComposing ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey ||
                event.shiftKey ||
                event.key !== 'ArrowDown'
              )
                return
              event.preventDefault()
              focusCandidate()
            }}
          />
        </div>
      </SearchField>

      {loadState.status === 'loading' ? (
        <p
          role="status"
          className={
            bounded
              ? `${stagedSelectorBoundedHeightClass(maxVisibleRows!)} flex items-center justify-center text-center text-sm text-text-secondary`
              : 'text-sm text-text-secondary'
          }
        >
          Cargando opciones…
        </p>
      ) : loadState.status === 'waiting-for-parent' ? (
        <div
          role="status"
          className={`flex items-center justify-center rounded-md border border-dashed border-border bg-surface-subtle/60 px-3 text-center text-sm text-text-muted ${
            maxVisibleRows !== undefined
              ? stagedSelectorBoundedHeightClass(maxVisibleRows)
              : 'py-6'
          }`}
        >
          {waitingForParentLabel ?? 'Seleccioná un elemento superior primero.'}
        </div>
      ) : boundedMessage ? (
        <div
          role={boundedMessage.role}
          className={`${stagedSelectorBoundedHeightClass(maxVisibleRows!)} flex flex-col items-center justify-center gap-2 text-center text-sm text-text-secondary`}
        >
          <span>{boundedMessage.text}</span>
          {boundedMessage.showRetry && (
            <Button variant="outline" onPress={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            maxVisibleRows !== undefined
              ? `${stagedSelectorBoundedHeightClass(maxVisibleRows)} scrollbar-hidden overflow-y-auto pr-1`
              : undefined
          }
          onFocusCapture={(event) => {
            const key = (event.target as HTMLElement)
              .closest('[data-key]')
              ?.getAttribute('data-key')
            if (key) setCandidateKey(key)
          }}
          onKeyDownCapture={(event) => {
            if (event.defaultPrevented || event.nativeEvent.isComposing) return
            const key = (event.target as HTMLElement)
              .closest('[data-key]')
              ?.getAttribute('data-key')
            if (
              event.key === 'ArrowUp' &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              !event.shiftKey &&
              key === visibleItems[0]?.key
            ) {
              event.preventDefault()
              inputRef.current?.focus()
              return
            }
            if (key && isPrintableStagedSelectorKey(event.nativeEvent)) {
              event.preventDefault()
              setQuery((current) => current + event.key)
              inputRef.current?.focus()
            }
          }}
        >
          <ListBox
            ref={listBoxRef}
            aria-label={`Opciones de ${label}`}
            items={visibleItems}
            selectionMode="single"
            selectedKeys={confirmedKey === null ? [] : [confirmedKey]}
            className="grid gap-1"
          >
            {(item) => (
              <ListBoxItem
                id={item.key}
                textValue={item.displayName}
                onPress={() => onConfirm(item.item)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-transparent px-3 py-1.5 text-sm text-text-primary outline-none transition-colors hover:bg-surface-subtle focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/40 data-[selected]:border-primary/30 data-[selected]:bg-primary-subtle"
              >
                <span className="truncate">{renderItem(item.item)}</span>
                {confirmedKey === item.key && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-bold text-primary"
                  >
                    ✓
                  </span>
                )}
              </ListBoxItem>
            )}
          </ListBox>
        </div>
      )}

      {!bounded && filteredEmpty && (
        <p role="status" className="text-sm text-text-secondary">
          Sin resultados.
        </p>
      )}
      {!bounded && loadState.status === 'empty' && !items.length && (
        <p role="status" className="text-sm text-text-secondary">
          No hay opciones disponibles.
        </p>
      )}
      {!bounded && loadState.status === 'initial-error' && (
        <p role="alert" className="text-sm text-text-secondary">
          No se pudieron cargar las opciones.{' '}
          <Button variant="outline" onPress={onRetry}>
            Reintentar
          </Button>
        </p>
      )}
      {!bounded && loadState.status === 'partial-error' && (
        <p role="alert" className="text-sm text-text-secondary">
          No se pudo cargar la continuación.{' '}
          <Button
            ref={retryContinuationRef}
            variant="outline"
            onPress={onRetry}
          >
            Reintentar continuación
          </Button>
        </p>
      )}
      {canLoadMore && (
        <Button
          ref={loadMoreRef}
          variant="outline"
          onPress={() => {
            restoreLoadMoreFocus.current = true
            onLoadMore()
          }}
        >
          Cargar más…
        </Button>
      )}
      {!bounded && loadState.status === 'loading-more' && (
        <Button variant="outline" isDisabled>
          Cargar más…
        </Button>
      )}
    </section>
  )
}

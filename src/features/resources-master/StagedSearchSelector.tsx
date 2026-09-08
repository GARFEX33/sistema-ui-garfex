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
} from './stagedSearchSelector.model'

export type SelectorLoadState =
  | { status: 'loading' }
  | { status: 'ready'; exhausted: boolean }
  | { status: 'loading-more' }
  | { status: 'empty' }
  | { status: 'initial-error' }
  | { status: 'partial-error' }

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
}: StagedSearchSelectorProps<T>) {
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

  const canLoadMore = loadState.status === 'ready' && !loadState.exhausted
  const filteredEmpty = !visibleItems.length && items.length > 0

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
      className="grid gap-3"
    >
      <SearchField value={query} onChange={setQuery} className="grid gap-1">
        <Label className="text-sm font-bold tracking-[0.08em] text-text-primary">
          {label}
        </Label>
        <Input
          ref={inputRef}
          aria-label={label}
          autoFocus={autoFocus}
          className="min-h-9 rounded border border-border bg-surface px-3 text-text-primary outline-none focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-focus"
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
      </SearchField>
      <p className="text-sm text-text-secondary">
        Busca solo entre las opciones cargadas
      </p>
      {items.length > 0 && (
        <p aria-live="polite" className="text-sm text-text-secondary">
          {query
            ? `${visibleItems.length} ${visibleItems.length === 1 ? 'coincidencia' : 'coincidencias'} entre ${items.length} opciones cargadas.`
            : `${items.length} opciones cargadas; búsqueda local por nombre.`}
        </p>
      )}

      {loadState.status === 'loading' ? (
        <p role="status" className="text-sm text-text-secondary">
          Cargando opciones…
        </p>
      ) : (
        <div
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
                className="cursor-pointer rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none hover:bg-surface-subtle focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-focus selected:border-primary selected:bg-primary-subtle"
              >
                <span className="flex items-center gap-2">
                  {candidateKey === item.key && (
                    <span aria-hidden="true">›</span>
                  )}
                  {renderItem(item.item)}
                  {confirmedKey === item.key && (
                    <span aria-hidden="true">✓</span>
                  )}
                </span>
              </ListBoxItem>
            )}
          </ListBox>
        </div>
      )}

      {filteredEmpty && (
        <p role="status" className="text-sm text-text-secondary">
          No hay coincidencias entre los elementos cargados.
        </p>
      )}
      {loadState.status === 'empty' && !items.length && (
        <p role="status" className="text-sm text-text-secondary">
          No hay opciones disponibles.
        </p>
      )}
      {loadState.status === 'initial-error' && (
        <p role="alert" className="text-sm text-text-secondary">
          No se pudieron cargar las opciones.{' '}
          <Button variant="outline" onPress={onRetry}>
            Reintentar
          </Button>
        </p>
      )}
      {loadState.status === 'partial-error' && (
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
      {loadState.status === 'loading-more' && (
        <Button variant="outline" isDisabled>
          Cargar más…
        </Button>
      )}
    </section>
  )
}

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
  repairProvisionalActiveKey,
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
  items: readonly T[]
  itemKey: (item: T) => string
  itemName: (item: T) => string
  renderItem?: (item: T) => ReactNode
  preferredActiveKey?: string | null
  loadState: SelectorLoadState
  onConfirm: (item: T) => void
  onLoadMore: () => void
  onRetry: () => void
}

export function StagedSearchSelector<T>({
  label,
  items,
  itemKey,
  itemName,
  renderItem = itemName,
  preferredActiveKey = null,
  loadState,
  onConfirm,
  onLoadMore,
  onRetry,
}: StagedSearchSelectorProps<T>) {
  const [query, setQuery] = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const preferredApplied = useRef(false)
  const listBoxRef = useRef<HTMLDivElement>(null)
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
    const repaired = repairProvisionalActiveKey(
      visibleItems,
      activeKey,
      preferredKey,
    )
    if (repaired !== activeKey) setActiveKey(repaired)
    if (visibleItems.length) preferredApplied.current = true
  }, [activeKey, preferredActiveKey, visibleItems])

  const canLoadMore = loadState.status === 'ready' && !loadState.exhausted
  const filteredEmpty = !visibleItems.length && items.length > 0

  return (
    <section
      aria-label={`${label}: selección por etapas`}
      className="grid gap-3"
      onKeyDownCapture={(event) => {
        if (
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.key !== 'Enter' ||
          (event.target as HTMLElement).getAttribute('role') !== 'option'
        )
          return
        const selected = visibleItems.find((item) => item.key === activeKey)
        if (selected) {
          event.preventDefault()
          onConfirm(selected.item)
        }
      }}
    >
      <SearchField value={query} onChange={setQuery} className="grid gap-1">
        <Label className="text-[11px] font-bold tracking-[0.08em] text-text-primary">
          {label}
        </Label>
        <Input
          aria-label={label}
          className="min-h-9 rounded border border-border bg-surface px-3 text-text-primary outline-none focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-focus"
          onKeyDown={(event) => {
            if (
              event.defaultPrevented ||
              event.nativeEvent.isComposing ||
              !['ArrowDown', 'ArrowUp'].includes(event.key)
            )
              return
            listBoxRef.current?.focus()
          }}
        />
      </SearchField>
      <p className="text-[11px] text-text-secondary">
        Filtra por nombre entre los elementos cargados
      </p>

      {loadState.status === 'loading' ? (
        <p role="status" className="text-sm text-text-secondary">
          Cargando opciones…
        </p>
      ) : (
        <ListBox
          ref={listBoxRef}
          aria-label={`Opciones de ${label}`}
          items={visibleItems}
          selectionMode="single"
          selectedKeys={activeKey === null ? [] : [activeKey]}
          onSelectionChange={(keys) => {
            const key = keys === 'all' ? null : (Array.from(keys)[0] ?? null)
            setActiveKey(key === null ? null : String(key))
          }}
          onAction={(key) => {
            const selected = visibleItems.find(
              (item) => item.key === String(key),
            )
            if (selected) onConfirm(selected.item)
          }}
          className="grid gap-1"
        >
          {(item) => (
            <ListBoxItem
              id={item.key}
              textValue={item.displayName}
              onPress={() => onConfirm(item.item)}
              className="cursor-pointer rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none hover:bg-surface-subtle focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-focus selected:border-primary selected:bg-primary-subtle"
            >
              {renderItem(item.item)}
            </ListBoxItem>
          )}
        </ListBox>
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
          <Button variant="outline" onPress={onRetry}>
            Reintentar continuación
          </Button>
        </p>
      )}
      {canLoadMore && (
        <Button variant="outline" onPress={onLoadMore}>
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

import { useEffect, useRef, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Field } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type { CatalogCharacteristicRecord } from './catalogAttributeCreation.types'
import type { useCatalogAttributeCreation } from './useCatalogAttributeCreation'

type Creation = ReturnType<typeof useCatalogAttributeCreation>

export function ExistingCharacteristicPicker({
  creation,
  contextKey,
  isOpen,
  searchDisabled,
  selectionDisabled,
  selected,
  effectiveCodes,
  onSelectedChange,
}: {
  creation: Creation
  contextKey: string
  isOpen: boolean
  searchDisabled: boolean
  selectionDisabled: boolean
  selected: CatalogCharacteristicRecord | null
  effectiveCodes: ReadonlySet<string>
  onSelectedChange: (value: CatalogCharacteristicRecord | null) => void
}) {
  const [text, setText] = useState('')
  const search = creation.existingSearch
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialContextRef = useRef<string | null>(null)
  const selectionChangeRef = useRef(onSelectedChange)
  const searchCommandsRef = useRef({
    clear: creation.clearExistingSearch,
    search: creation.searchExisting,
  })
  selectionChangeRef.current = onSelectedChange
  searchCommandsRef.current = {
    clear: creation.clearExistingSearch,
    search: creation.searchExisting,
  }
  const clearTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
  }
  const searchForText = (value = text) => {
    clearTimer()
    if (searchDisabled) return
    const query = value.trim()
    if (!selectionDisabled) onSelectedChange(null)
    void creation.searchExisting({ text: query, limit: 50, offset: 0 })
  }
  const scheduleSearch = (value: string) => {
    clearTimer()
    if (searchDisabled) return
    timerRef.current = setTimeout(() => searchForText(value), 250)
  }

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = null
      initialContextRef.current = null
      setText('')
      selectionChangeRef.current(null)
      searchCommandsRef.current.clear()
      return
    }
    if (searchDisabled || initialContextRef.current === contextKey) return
    initialContextRef.current = contextKey
    setText('')
    selectionChangeRef.current(null)
    inputRef.current?.focus()
    void searchCommandsRef.current.search({ text: '', limit: 50, offset: 0 })
  }, [contextKey, isOpen, searchDisabled])

  useEffect(() => () => clearTimer(), [])
  const page = search.page
  const move = (offset: number) => {
    if (!search.input || searchDisabled) return
    if (!selectionDisabled) onSelectedChange(null)
    void creation.searchExisting({ ...search.input, offset })
  }

  return (
    <section aria-label="Usar característica existente" className="grid gap-3">
      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Definición existente
        </p>
        <h3 className="m-0 mt-1 text-base font-semibold">
          Buscar característica global
        </h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row" role="search">
        <div className="min-w-0 flex-1">
          <Field
            htmlFor="catalog-existing-characteristic-search"
            label="Buscar característica existente"
          >
            <input
              className={fieldInputClass}
              disabled={searchDisabled}
              id="catalog-existing-characteristic-search"
              ref={inputRef}
              onChange={(event) => {
                const value = event.target.value
                setText(value)
                if (!selectionDisabled) onSelectedChange(null)
                creation.clearExistingSearch()
                scheduleSearch(value)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.nativeEvent.isComposing)
                  return
                event.preventDefault()
                searchForText()
              }}
              role="searchbox"
              type="search"
              value={text}
            />
          </Field>
        </div>
      </div>
      {selected && (
        <p
          aria-live="polite"
          className="m-0 text-sm text-text-secondary"
          role="status"
        >
          Seleccionada: {selected.name} · {selected.code} · {selected.valueType}
        </p>
      )}
      {search.status === 'loading' && (
        <p className="m-0 text-sm text-text-secondary" role="status">
          Buscando características existentes…
        </p>
      )}
      {search.status === 'error' && (
        <p className="m-0 text-sm text-primary" role="alert">
          {search.error?.message ?? 'No se pudieron buscar características.'}
        </p>
      )}
      {search.status === 'ready' && page && (
        <>
          {page.records.length === 0 ? (
            <p className="m-0 text-sm text-text-secondary" role="status">
              No hay características activas para esa búsqueda.
            </p>
          ) : (
            <ul
              aria-label="Resultados de características existentes"
              className="m-0 grid max-h-56 list-none gap-2 overflow-y-auto p-0 pr-1"
            >
              {page.records.map((record) => {
                const alreadyEffective = effectiveCodes.has(record.code)
                const disabled = selectionDisabled || alreadyEffective
                return (
                  <li key={record.id}>
                    <Button
                      aria-pressed={selected?.id === record.id}
                      className={
                        selected?.id === record.id
                          ? 'border-primary bg-primary-subtle text-text-primary'
                          : undefined
                      }
                      isDisabled={disabled}
                      onPress={() => onSelectedChange(record)}
                      type="button"
                      variant="outline"
                    >
                      <span className="text-left">
                        <span className="block">
                          {record.name}
                          {selected?.id === record.id && (
                            <span className="ml-2 text-xs font-semibold text-primary">
                              Seleccionada
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {record.code} · {record.valueType}
                          {alreadyEffective
                            ? ' · Ya efectivo en este Tipo'
                            : ''}
                        </span>
                      </span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              isDisabled={!page.hasPrevious || searchDisabled}
              onPress={() =>
                move(
                  Math.max(
                    0,
                    (search.input?.offset ?? 0) - (search.input?.limit ?? 50),
                  ),
                )
              }
              type="button"
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              isDisabled={!page.hasNext || searchDisabled}
              onPress={() =>
                move((search.input?.offset ?? 0) + (search.input?.limit ?? 50))
              }
              type="button"
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

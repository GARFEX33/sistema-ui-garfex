import type { CatalogListPage, OpaqueCursor } from './catalogHierarchy.types'

export type CatalogListOperation = 'classes' | 'families' | 'types'

export interface CatalogListRequest {
  operation: CatalogListOperation
  parentId?: unknown
  filters: Readonly<Record<string, unknown>>
  cursor: OpaqueCursor | undefined
}

export interface CatalogListAdapter<T extends { id: unknown }> {
  load: (request: CatalogListRequest) => Promise<CatalogListPage<T>>
}

export interface CatalogListState<T extends { id: unknown }> {
  operation: CatalogListOperation
  parentId?: unknown
  filters: Readonly<Record<string, unknown>>
  items: T[]
  isExhausted: boolean
  isWaitingForParent: boolean
}

export interface CatalogListController<T extends { id: unknown }> {
  getState: () => CatalogListState<T>
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  subscribe: (listener: () => void) => () => void
}

const requiresParent = (operation: CatalogListOperation) =>
  operation !== 'classes'

const hasParent = (operation: CatalogListOperation, parentId: unknown) =>
  !requiresParent(operation) ||
  (parentId !== undefined && parentId !== null && parentId !== '')

const snapshotFilters = (filters?: Readonly<Record<string, unknown>>) =>
  Object.freeze({ ...(filters ?? {}) })

export function createCatalogListSequence<T extends { id: unknown }>(options: {
  operation: CatalogListOperation
  parentId?: unknown
  filters?: Readonly<Record<string, unknown>>
  adapter: CatalogListAdapter<T>
}): CatalogListController<T> {
  const context = {
    operation: options.operation,
    parentId: options.parentId,
    filters: snapshotFilters(options.filters),
  }
  const waitingForParent = !hasParent(context.operation, context.parentId)
  const listeners = new Set<() => void>()
  let cursor: OpaqueCursor | undefined
  let isLoading = false
  let hasStarted = false
  let state: CatalogListState<T> = {
    ...context,
    items: [],
    isExhausted: false,
    isWaitingForParent: waitingForParent,
  }

  const emit = () => listeners.forEach((listener) => listener())
  const setState = (next: CatalogListState<T>) => {
    state = next
    emit()
  }
  const appendFirstOccurrences = (items: T[], pageItems: T[]) => {
    const seen = new Set(items.map((item) => item.id))
    const result = [...items]

    pageItems.forEach((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    })

    return result
  }
  const load = async (
    nextCursor: OpaqueCursor | undefined,
    append: boolean,
  ) => {
    if (isLoading || waitingForParent) return false

    isLoading = true
    try {
      const page = await options.adapter.load({
        ...context,
        cursor: nextCursor,
      })
      setState({
        ...state,
        items: append
          ? appendFirstOccurrences(state.items, page.items)
          : appendFirstOccurrences([], page.items),
        isExhausted: page.isExhausted,
      })
      cursor = page.continuationCursor
      return true
    } finally {
      isLoading = false
    }
  }

  return {
    getState: () => ({ ...state, items: [...state.items] }),
    start: () => {
      if (isLoading || waitingForParent) return Promise.resolve(false)

      cursor = undefined
      hasStarted = true
      setState({ ...state, items: [], isExhausted: false })
      return load(undefined, false)
    },
    continue: () =>
      !hasStarted || isLoading || waitingForParent || state.isExhausted
        ? Promise.resolve(false)
        : load(cursor, true),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const useCatalogList = createCatalogListSequence

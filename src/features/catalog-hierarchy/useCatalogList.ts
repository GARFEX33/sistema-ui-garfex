import type { CatalogListPage, OpaqueCursor } from './catalogHierarchy.types'

export type CatalogListOperation = 'classes' | 'families' | 'types'
export type CatalogListStatus =
  | 'waiting-for-parent'
  | 'initial-loading'
  | 'empty'
  | 'ready'
  | 'loading-more'
  | 'partial-error'
  | 'initial-error'

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
  status: CatalogListStatus
  isExhausted: boolean
  error?: unknown
}

export interface CatalogListController<T extends { id: unknown }> {
  getState: () => CatalogListState<T>
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
  setContext: (context: {
    operation: CatalogListOperation
    parentId?: unknown
    filters?: Readonly<Record<string, unknown>>
  }) => void
  subscribe: (listener: () => void) => () => void
}

const needsParent = (operation: CatalogListOperation) => operation !== 'classes'
const readyForParent = (operation: CatalogListOperation, parentId: unknown) =>
  !needsParent(operation) ||
  (parentId !== undefined && parentId !== null && parentId !== '')
const snapshotFilters = (filters?: Readonly<Record<string, unknown>>) =>
  Object.freeze({ ...(filters ?? {}) })

export function createCatalogListSequence<T extends { id: unknown }>(options: {
  operation: CatalogListOperation
  parentId?: unknown
  filters?: Readonly<Record<string, unknown>>
  adapter: CatalogListAdapter<T>
}): CatalogListController<T> {
  let context = {
    operation: options.operation,
    parentId: options.parentId,
    filters: snapshotFilters(options.filters),
  }
  let token = 0
  let pending = false
  let cursor: OpaqueCursor | undefined
  let state: CatalogListState<T> = {
    ...context,
    items: [],
    status: readyForParent(context.operation, context.parentId)
      ? 'ready'
      : 'waiting-for-parent',
    isExhausted: false,
  }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const setState = (next: CatalogListState<T>) => {
    state = next
    emit()
  }
  const current = (id: number, snapshot: typeof context) =>
    id === token &&
    context.operation === snapshot.operation &&
    Object.is(context.parentId, snapshot.parentId) &&
    context.filters === snapshot.filters

  const load = async (
    nextCursor: OpaqueCursor | undefined,
    more: boolean,
    allowAutomaticInitialRetry = false,
  ) => {
    if (pending || !readyForParent(context.operation, context.parentId))
      return false
    const id = token
    const snapshot = context
    pending = true
    setState({
      ...state,
      ...snapshot,
      status: more ? 'loading-more' : 'initial-loading',
      error: undefined,
    })
    try {
      const page = await options.adapter.load({
        ...snapshot,
        cursor: nextCursor,
      })
      if (!current(id, snapshot)) return false
      const seen = new Set(state.items.map((item) => item.id))
      const items = [...state.items]
      page.items.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          items.push(item)
        }
      })
      cursor = page.continuationCursor
      setState({
        ...state,
        ...snapshot,
        items,
        isExhausted: page.isExhausted,
        status: page.isExhausted && !items.length ? 'empty' : 'ready',
        error: undefined,
      })
      return true
    } catch (error) {
      if (!current(id, snapshot)) return false
      if (allowAutomaticInitialRetry && !more) {
        pending = false
        return load(nextCursor, false)
      }
      setState({
        ...state,
        ...snapshot,
        status: more ? 'partial-error' : 'initial-error',
        error,
      })
      return false
    } finally {
      if (id === token) pending = false
    }
  }

  return {
    getState: () => ({ ...state, items: [...state.items] }),
    start: () => {
      if (pending || !readyForParent(context.operation, context.parentId))
        return Promise.resolve(false)
      token++
      cursor = undefined
      setState({ ...state, items: [], isExhausted: false, error: undefined })
      return load(undefined, false, true)
    },
    continue: () =>
      state.status === 'ready' && !state.isExhausted
        ? load(cursor, true)
        : Promise.resolve(false),
    retry: () =>
      ['initial-error', 'partial-error'].includes(state.status)
        ? load(cursor, state.status === 'partial-error')
        : Promise.resolve(false),
    setContext: ({ operation, parentId, filters = {} }) => {
      token++
      pending = false
      cursor = undefined
      context = {
        operation,
        parentId,
        filters: snapshotFilters(filters),
      }
      setState({
        ...context,
        items: [],
        status: readyForParent(operation, parentId)
          ? 'ready'
          : 'waiting-for-parent',
        isExhausted: false,
      })
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const useCatalogList = createCatalogListSequence

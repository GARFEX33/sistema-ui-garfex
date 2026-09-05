import { hasHierarchyParent } from './hierarchySelection'

export type ParentGatedListStatus =
  | 'waiting-for-parent'
  | 'initial-loading'
  | 'empty'
  | 'ready'
  | 'loading-more'
  | 'partial-error'
  | 'initial-error'

export interface ParentGatedListPage<T, TCursor> {
  continuationCursor: TCursor | undefined
  isExhausted: boolean
  items: T[]
}

export interface ParentGatedListRequest<TOperation, TCursor> {
  operation: TOperation
  parentId?: unknown
  filters: Readonly<Record<string, unknown>>
  cursor: TCursor | undefined
}

export interface ParentGatedListAdapter<T, TOperation, TCursor> {
  load: (
    request: ParentGatedListRequest<TOperation, TCursor>,
  ) => Promise<ParentGatedListPage<T, TCursor>>
}

export interface ParentGatedListState<T, TOperation> {
  operation: TOperation
  parentId?: unknown
  filters: Readonly<Record<string, unknown>>
  items: T[]
  status: ParentGatedListStatus
  isExhausted: boolean
  error?: unknown
}

export interface ParentGatedListController<T, TOperation> {
  getState: () => ParentGatedListState<T, TOperation>
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
  setContext: (context: {
    operation: TOperation
    parentId?: unknown
    filters?: Readonly<Record<string, unknown>>
  }) => void
  subscribe: (listener: () => void) => () => void
}

const snapshotFilters = (filters?: Readonly<Record<string, unknown>>) =>
  Object.freeze({ ...(filters ?? {}) })

export function createParentGatedListController<
  T extends { id: unknown },
  TOperation,
  TCursor,
>(options: {
  operation: TOperation
  parentId?: unknown
  filters?: Readonly<Record<string, unknown>>
  adapter: ParentGatedListAdapter<T, TOperation, TCursor>
  requiresParent: (operation: TOperation) => boolean
}): ParentGatedListController<T, TOperation> {
  let context = {
    operation: options.operation,
    parentId: options.parentId,
    filters: snapshotFilters(options.filters),
  }
  let token = 0
  let pending = false
  let cursor: TCursor | undefined
  let state: ParentGatedListState<T, TOperation> = {
    ...context,
    items: [],
    status:
      !options.requiresParent(context.operation) ||
      hasHierarchyParent(context.parentId)
        ? 'ready'
        : 'waiting-for-parent',
    isExhausted: false,
  }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const setState = (next: ParentGatedListState<T, TOperation>) => {
    state = next
    emit()
  }
  const readyForParent = () =>
    !options.requiresParent(context.operation) ||
    hasHierarchyParent(context.parentId)
  const current = (id: number, snapshot: typeof context) =>
    id === token &&
    context.operation === snapshot.operation &&
    Object.is(context.parentId, snapshot.parentId) &&
    context.filters === snapshot.filters

  const load = async (
    nextCursor: TCursor | undefined,
    more: boolean,
    allowAutomaticInitialRetry = false,
  ): Promise<boolean> => {
    if (pending || !readyForParent()) return false
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
      if (pending || !readyForParent()) return Promise.resolve(false)
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
      state.status === 'initial-error' || state.status === 'partial-error'
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
        status:
          !options.requiresParent(operation) || hasHierarchyParent(parentId)
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

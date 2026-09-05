import type { ResourceListPage } from './resourcesMaster.types'

export type ResourceListStatus =
  | 'initial-loading'
  | 'empty'
  | 'ready'
  | 'loading-more'
  | 'partial-error'
  | 'initial-error'

export interface ResourceListRequest {
  filters: Readonly<Record<string, unknown>>
  cursor: string | null | undefined
}

export interface ResourceListAdapter<T extends { id: unknown }> {
  load: (request: ResourceListRequest) => Promise<ResourceListPage<T>>
}

export interface ResourceListState<T extends { id: unknown }> {
  filters: Readonly<Record<string, unknown>>
  items: T[]
  status: ResourceListStatus
  isDone: boolean
  error?: unknown
}

export interface ResourceListController<T extends { id: unknown }> {
  getState: () => ResourceListState<T>
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
  setFilters: (filters?: Readonly<Record<string, unknown>>) => void
  subscribe: (listener: () => void) => () => void
}

const snapshotFilters = (filters?: Readonly<Record<string, unknown>>) =>
  Object.freeze({ ...(filters ?? {}) })

export function createResourcesMasterListController<
  T extends { id: unknown },
>(options: {
  filters?: Readonly<Record<string, unknown>>
  adapter: ResourceListAdapter<T>
}): ResourceListController<T> {
  let filters = snapshotFilters(options.filters)
  let token = 0
  let pending = false
  let cursor: string | null | undefined
  let state: ResourceListState<T> = {
    filters,
    items: [],
    status: 'ready',
    isDone: false,
  }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const setState = (next: ResourceListState<T>) => {
    state = next
    emit()
  }
  const current = (id: number, snapshot: typeof filters) =>
    id === token && filters === snapshot

  const load = async (
    nextCursor: string | null | undefined,
    more: boolean,
    allowAutomaticInitialRetry = false,
  ) => {
    if (pending) return false
    const id = token
    const snapshot = filters
    pending = true
    setState({
      ...state,
      filters: snapshot,
      status: more ? 'loading-more' : 'initial-loading',
      error: undefined,
    })
    try {
      const result = await options.adapter.load({
        filters: snapshot,
        cursor: nextCursor,
      })
      if (!current(id, snapshot)) return false
      const seen = new Set(state.items.map((item) => item.id))
      const items = [...state.items]
      result.page.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          items.push(item)
        }
      })
      cursor = result.continueCursor
      setState({
        ...state,
        filters: snapshot,
        items,
        isDone: result.isDone,
        status: result.isDone && !items.length ? 'empty' : 'ready',
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
        filters: snapshot,
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
      if (pending) return Promise.resolve(false)
      token++
      cursor = undefined
      setState({ ...state, items: [], isDone: false, error: undefined })
      return load(undefined, false, true)
    },
    continue: () =>
      state.status === 'ready' && !state.isDone
        ? load(cursor, true)
        : Promise.resolve(false),
    retry: () =>
      ['initial-error', 'partial-error'].includes(state.status)
        ? load(cursor, state.status === 'partial-error')
        : Promise.resolve(false),
    setFilters: (nextFilters) => {
      token++
      pending = false
      cursor = undefined
      filters = snapshotFilters(nextFilters)
      setState({
        filters,
        items: [],
        status: 'ready',
        isDone: false,
      })
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const useResourcesMasterList = createResourcesMasterListController

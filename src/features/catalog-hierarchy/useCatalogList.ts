import {
  createParentGatedListController,
  type ParentGatedListAdapter,
  type ParentGatedListController,
  type ParentGatedListPage,
  type ParentGatedListRequest,
  type ParentGatedListState,
  type ParentGatedListStatus,
} from '../../shared/hierarchy/parentGatedListController'
import type {
  CatalogClassRestItem,
  CatalogClassWindowInput,
  CatalogClassWindowPage,
  CatalogListPage,
  CatalogMode,
  CatalogWindowInput,
  CatalogWindowPage,
  OpaqueCursor,
} from './catalogHierarchy.types'

export type CatalogListOperation =
  | 'classes'
  | 'families'
  | 'types'
  | 'attributes'
export type CatalogListStatus = ParentGatedListStatus

export type CatalogListRequest = ParentGatedListRequest<
  CatalogListOperation,
  OpaqueCursor
>

export interface CatalogListAdapter<T extends { id: unknown }>
  extends ParentGatedListAdapter<T, CatalogListOperation, OpaqueCursor> {
  load: (request: CatalogListRequest) => Promise<CatalogListPage<T>>
}

export type CatalogListState<T extends { id: unknown }> = ParentGatedListState<
  T,
  CatalogListOperation
>

export interface CatalogListController<T extends { id: unknown }>
  extends ParentGatedListController<T, CatalogListOperation> {
  getState: () => CatalogListState<T>
}

const needsParent = (operation: CatalogListOperation) => operation !== 'classes'

export function createCatalogListSequence<T extends { id: unknown }>(options: {
  operation: CatalogListOperation
  parentId?: unknown
  filters?: Readonly<Record<string, unknown>>
  adapter: CatalogListAdapter<T>
}): CatalogListController<T> {
  return createParentGatedListController({
    ...options,
    requiresParent: needsParent,
  })
}

export const useCatalogList = createCatalogListSequence

export interface CatalogClassWindowState {
  items: CatalogClassRestItem[]
  scope: CatalogMode
  text?: string
  limit: number
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  status: ParentGatedListStatus
  isExhausted: boolean
}

export interface CatalogClassWindowController {
  getState: () => CatalogClassWindowState
  subscribe: (listener: () => void) => () => void
  start: () => Promise<boolean>
  next: () => Promise<boolean>
  previous: () => Promise<boolean>
  retry: () => Promise<boolean>
  setQuery: (query: Pick<CatalogClassWindowInput, 'scope' | 'text'>) => void
}

export function createCatalogClassWindow(options: {
  load: (input: CatalogClassWindowInput) => Promise<CatalogClassWindowPage>
  limit?: number
}): CatalogClassWindowController {
  const listeners = new Set<() => void>()
  let generation = 0
  let state: CatalogClassWindowState = {
    items: [],
    scope: 'ALL',
    limit: options.limit ?? 20,
    offset: 0,
    hasPrevious: false,
    hasNext: false,
    status: 'ready',
    isExhausted: true,
  }
  const emit = () => listeners.forEach((listener) => listener())
  const load = async (offset: number) => {
    const request = ++generation
    state = {
      ...state,
      offset,
      status: state.items.length ? 'loading-more' : 'initial-loading',
    }
    emit()
    try {
      const page = await options.load({
        scope: state.scope,
        ...(state.text === undefined ? {} : { text: state.text }),
        limit: state.limit,
        offset,
      })
      if (request !== generation) return false
      state = {
        ...state,
        items: page.items,
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
        isExhausted: !page.hasNext,
        status: page.items.length ? 'ready' : 'empty',
      }
      emit()
      return true
    } catch {
      if (request !== generation) return false
      state = {
        ...state,
        status: state.items.length ? 'partial-error' : 'initial-error',
      }
      emit()
      return false
    }
  }
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => load(0),
    next: () =>
      state.hasNext ? load(state.offset + state.limit) : Promise.resolve(false),
    previous: () =>
      state.hasPrevious
        ? load(Math.max(0, state.offset - state.limit))
        : Promise.resolve(false),
    retry: () => load(state.offset),
    setQuery: (query) => {
      generation++
      state = {
        ...state,
        items: [],
        scope: query.scope,
        ...(query.text === undefined ? {} : { text: query.text }),
        offset: 0,
        hasPrevious: false,
        hasNext: false,
        isExhausted: true,
        status: 'ready',
      }
      emit()
    },
  }
}

export interface CatalogDependentWindowState<T> {
  items: T[]
  parentCode?: string
  classCode?: string
  scope: CatalogMode
  text?: string
  limit: number
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  status: ParentGatedListStatus
  isExhausted: boolean
}

export interface CatalogDependentWindowController<T> {
  getState: () => CatalogDependentWindowState<T>
  subscribe: (listener: () => void) => () => void
  start: () => Promise<boolean>
  next: () => Promise<boolean>
  previous: () => Promise<boolean>
  retry: () => Promise<boolean>
  setContext: (context: {
    parentCode?: string
    classCode?: string
    scope?: CatalogMode
    text?: string
  }) => void
}

export function createCatalogDependentWindow<T>(options: {
  load: (
    input: CatalogWindowInput & { parentCode: string; classCode?: string },
  ) => Promise<CatalogWindowPage<T>>
  limit?: number
}): CatalogDependentWindowController<T> {
  const listeners = new Set<() => void>()
  let generation = 0
  let state: CatalogDependentWindowState<T> = {
    items: [],
    scope: 'ALL',
    limit: options.limit ?? 20,
    offset: 0,
    hasPrevious: false,
    hasNext: false,
    status: 'waiting-for-parent',
    isExhausted: true,
  }
  const emit = () => listeners.forEach((listener) => listener())
  const hasParent = () =>
    typeof state.parentCode === 'string' && state.parentCode !== ''
  const load = async (offset: number) => {
    const parentCode = state.parentCode
    if (!hasParent() || parentCode === undefined) return false
    const request = ++generation
    state = {
      ...state,
      offset,
      status: state.items.length ? 'loading-more' : 'initial-loading',
    }
    emit()
    try {
      const page = await options.load({
        parentCode,
        ...(state.classCode === undefined
          ? {}
          : { classCode: state.classCode }),
        scope: state.scope,
        ...(state.text === undefined ? {} : { text: state.text }),
        limit: state.limit,
        offset,
      })
      if (request !== generation) return false
      state = {
        ...state,
        items: page.items,
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
        isExhausted: !page.hasNext,
        status: page.items.length ? 'ready' : 'empty',
      }
      emit()
      return true
    } catch {
      if (request !== generation) return false
      state = {
        ...state,
        status: state.items.length ? 'partial-error' : 'initial-error',
      }
      emit()
      return false
    }
  }
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => load(0),
    next: () =>
      state.hasNext ? load(state.offset + state.limit) : Promise.resolve(false),
    previous: () =>
      state.hasPrevious
        ? load(Math.max(0, state.offset - state.limit))
        : Promise.resolve(false),
    retry: () => load(state.offset),
    setContext: ({ parentCode, classCode, scope = 'ALL', text }) => {
      generation++
      state = {
        items: [],
        ...(parentCode === undefined ? {} : { parentCode }),
        ...(classCode === undefined ? {} : { classCode }),
        scope,
        ...(text === undefined ? {} : { text }),
        limit: state.limit,
        offset: 0,
        hasPrevious: false,
        hasNext: false,
        status:
          typeof parentCode === 'string' && parentCode !== ''
            ? 'ready'
            : 'waiting-for-parent',
        isExhausted: true,
      }
      emit()
    },
  }
}

export type { ParentGatedListPage }

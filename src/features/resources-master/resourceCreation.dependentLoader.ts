export type DependentPage<T> = Readonly<{
  items: readonly T[]
  continuationCursor: string | null
  isExhausted: boolean
}>

export type DependentLoadState<T> =
  | { status: 'idle'; contextKey: null; items: readonly [] }
  | { status: 'loading'; contextKey: string; items: readonly T[] }
  | {
      status: 'ready'
      contextKey: string
      items: readonly T[]
      cursor: string | null
      exhausted: boolean
    }
  | { status: 'empty'; contextKey: string; items: readonly []; exhausted: true }
  | { status: 'loading-more'; contextKey: string; items: readonly T[] }
  | {
      status: 'initial-error'
      contextKey: string
      items: readonly []
      retry: 'initial'
      error: unknown
    }
  | {
      status: 'partial-error'
      contextKey: string
      items: readonly T[]
      retry: 'continuation'
      error: unknown
    }

export type DependentLoader<T> = Readonly<{
  getState: () => DependentLoadState<T>
  setContext: (contextKey: string | null) => void
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
}>

export function createDependentLoader<T>(options: {
  identity: (item: T) => string
  load: (request: {
    contextKey: string
    cursor: string | null
  }) => Promise<DependentPage<T>>
}): DependentLoader<T> {
  let contextKey: string | null = null
  let token = 0
  let cursor: string | null = null
  let pending = false
  let state: DependentLoadState<T> = {
    status: 'idle',
    contextKey: null,
    items: [],
  }

  const isCurrent = (
    requestToken: number,
    requestContext: string,
    requestCursor: string | null,
  ) =>
    token === requestToken &&
    contextKey === requestContext &&
    cursor === requestCursor

  const appendUnique = (items: readonly T[], additions: readonly T[]) => {
    const seen = new Set(items.map(options.identity))
    return additions.reduce<T[]>(
      (result, item) => {
        const key = options.identity(item)
        if (!seen.has(key)) {
          seen.add(key)
          result.push(item)
        }
        return result
      },
      [...items],
    )
  }

  const request = async (
    requestCursor: string | null,
    continuation: boolean,
  ) => {
    if (pending || !contextKey) return false
    const requestToken = token
    const requestContext = contextKey
    pending = true
    state = {
      status: continuation ? 'loading-more' : 'loading',
      contextKey: requestContext,
      items: continuation ? state.items : [],
    }

    try {
      const result = await options.load({
        contextKey: requestContext,
        cursor: requestCursor,
      })
      if (!isCurrent(requestToken, requestContext, requestCursor)) return false
      const items = appendUnique(state.items, result.items)
      if (!result.isExhausted && result.continuationCursor === requestCursor) {
        state = {
          status: 'partial-error',
          contextKey: requestContext,
          items,
          retry: 'continuation',
          error: new Error('Repeated continuation cursor'),
        }
        return false
      }
      cursor = result.continuationCursor
      state =
        result.isExhausted && !items.length
          ? {
              status: 'empty',
              contextKey: requestContext,
              items: [],
              exhausted: true,
            }
          : {
              status: 'ready',
              contextKey: requestContext,
              items,
              cursor,
              exhausted: result.isExhausted,
            }
      return true
    } catch (error) {
      if (!isCurrent(requestToken, requestContext, requestCursor)) return false
      state = continuation
        ? {
            status: 'partial-error',
            contextKey: requestContext,
            items: state.items,
            retry: 'continuation',
            error,
          }
        : {
            status: 'initial-error',
            contextKey: requestContext,
            items: [],
            retry: 'initial',
            error,
          }
      return false
    } finally {
      if (token === requestToken) pending = false
    }
  }

  return {
    getState: () => state,
    setContext: (nextContext) => {
      token++
      contextKey = nextContext
      cursor = null
      pending = false
      state = { status: 'idle', contextKey: null, items: [] }
    },
    start: () => request(null, false),
    continue: () =>
      state.status === 'ready' && !state.exhausted
        ? request(cursor, true)
        : Promise.resolve(false),
    retry: () =>
      state.status === 'initial-error'
        ? request(null, false)
        : state.status === 'partial-error'
          ? request(cursor, true)
          : Promise.resolve(false),
  }
}

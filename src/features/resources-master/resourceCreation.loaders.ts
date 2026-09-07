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

import type { ResourceId, ResourceUnitPolicy } from './resourcesMaster.types'

export type UnitPolicyReference = Readonly<{
  policyId: ResourceId
  unidadId: ResourceId
  principal: boolean
  selected: boolean
}>

export type UnitPolicyPageState =
  | {
      status: 'idle'
      tipoId: ResourceId | null
      references: readonly UnitPolicyReference[]
    }
  | {
      status: 'loading' | 'loading-more'
      tipoId: ResourceId
      references: readonly UnitPolicyReference[]
    }
  | {
      status: 'ready'
      tipoId: ResourceId
      references: readonly UnitPolicyReference[]
      cursor: string | null
      exhausted: boolean
    }
  | {
      status: 'empty'
      tipoId: ResourceId
      references: readonly []
      exhausted: true
    }
  | {
      status: 'initial-error' | 'partial-error'
      tipoId: ResourceId
      references: readonly UnitPolicyReference[]
      retry: 'initial' | 'continuation'
      error: unknown
    }

export type UnitPolicyPageController = Readonly<{
  getState: () => UnitPolicyPageState
  setTipo: (tipoId: ResourceId | null) => void
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
}>

const isEligibleUnitPolicy = (policy: ResourceUnitPolicy) =>
  policy.activo &&
  policy.effective &&
  !policy.shadowed &&
  policy.selection !== 'SHADOWED' &&
  policy.selection !== 'SUPPRESSED'

export function createUnitPolicyPageController(options: {
  identity: (id: ResourceId) => string
  loadPolicies: (request: {
    tipoRecursoId: ResourceId
    cursor: string | null
  }) => Promise<DependentPage<ResourceUnitPolicy>>
}): UnitPolicyPageController {
  let tipoId: ResourceId | null = null
  let contextKey: string | null = null
  let cursor: string | null = null
  let token = 0
  let pending = false
  let policyIndexes = new Map<string, number>()
  let referenceIndexes = new Map<string, number>()
  let state: UnitPolicyPageState = {
    status: 'idle',
    tipoId: null,
    references: [],
  }

  const isCurrent = (
    requestToken: number,
    requestContext: string,
    requestCursor: string | null,
  ) =>
    token === requestToken &&
    contextKey === requestContext &&
    cursor === requestCursor

  const appendReferences = (policies: readonly ResourceUnitPolicy[]) => {
    const references = [...state.references]
    for (const policy of policies) {
      if (!isEligibleUnitPolicy(policy)) continue
      const policyKey = options.identity(policy.id)
      const knownPolicyIndex = policyIndexes.get(policyKey)
      if (knownPolicyIndex !== undefined) {
        const known = references[knownPolicyIndex]!
        references[knownPolicyIndex] = {
          ...known,
          principal: known.principal || policy.principal,
          selected: known.selected || policy.selected,
        }
        continue
      }

      const unitKey = options.identity(policy.unidadId)
      const knownIndex = referenceIndexes.get(unitKey)
      if (knownIndex === undefined) {
        const nextIndex = references.length
        referenceIndexes.set(unitKey, nextIndex)
        policyIndexes.set(policyKey, nextIndex)
        references.push({
          policyId: policy.id,
          unidadId: policy.unidadId,
          principal: policy.principal,
          selected: policy.selected,
        })
      } else {
        policyIndexes.set(policyKey, knownIndex)
        const known = references[knownIndex]!
        references[knownIndex] = {
          ...known,
          principal: known.principal || policy.principal,
          selected: known.selected || policy.selected,
        }
      }
    }
    return references
  }

  const request = async (
    requestCursor: string | null,
    continuation: boolean,
  ) => {
    if (pending || tipoId === null || contextKey === null) return false
    const requestToken = token
    const requestTipoId = tipoId
    const requestContext = contextKey
    pending = true
    if (!continuation) {
      policyIndexes = new Map()
      referenceIndexes = new Map()
    }
    state = {
      status: continuation ? 'loading-more' : 'loading',
      tipoId: requestTipoId,
      references: continuation ? state.references : [],
    }

    try {
      const page = await options.loadPolicies({
        tipoRecursoId: requestTipoId,
        cursor: requestCursor,
      })
      if (!isCurrent(requestToken, requestContext, requestCursor)) return false
      const references = appendReferences(page.items)
      if (!page.isExhausted && page.continuationCursor === requestCursor) {
        state = {
          status: 'partial-error',
          tipoId: requestTipoId,
          references,
          retry: 'continuation',
          error: new Error('Repeated continuation cursor'),
        }
        return false
      }
      cursor = page.continuationCursor
      state =
        page.isExhausted && references.length === 0
          ? {
              status: 'empty',
              tipoId: requestTipoId,
              references: [],
              exhausted: true,
            }
          : {
              status: 'ready',
              tipoId: requestTipoId,
              references,
              cursor,
              exhausted: page.isExhausted,
            }
      return true
    } catch (error) {
      if (!isCurrent(requestToken, requestContext, requestCursor)) return false
      state = {
        status: continuation ? 'partial-error' : 'initial-error',
        tipoId: requestTipoId,
        references: state.references,
        retry: continuation ? 'continuation' : 'initial',
        error,
      }
      return false
    } finally {
      if (token === requestToken) pending = false
    }
  }

  return {
    getState: () => state,
    setTipo: (nextTipoId) => {
      token++
      tipoId = nextTipoId
      contextKey = nextTipoId === null ? null : options.identity(nextTipoId)
      cursor = null
      pending = false
      policyIndexes = new Map()
      referenceIndexes = new Map()
      state = { status: 'idle', tipoId: nextTipoId, references: [] }
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

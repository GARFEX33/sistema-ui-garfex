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

import type {
  ResourceId,
  ResourceUnitDetail,
  ResourceUnitPolicy,
} from './resourcesMaster.types'

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

export type UnitCandidate = Readonly<{
  unidadId: ResourceId
  clave: string
  nombre: string
  simbolo?: string
  principal: boolean
  selected: boolean
}>

export type UnitCandidateHydrationSnapshot = Readonly<{
  tipoId: ResourceId
  cursor: string | null
  references: readonly UnitPolicyReference[]
}>

export type UnitCandidateHydrationState = Readonly<{
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'partial-error'
  tipoId: ResourceId | null
  snapshotSignature: string | null
  generation: number
  candidates: readonly UnitCandidate[]
  failedUnitIds: readonly ResourceId[]
}>

export type UnitCandidateHydrator = Readonly<{
  getState: () => UnitCandidateHydrationState
  setSnapshot: (snapshot: UnitCandidateHydrationSnapshot | null) => void
  start: () => Promise<boolean>
  retry: () => Promise<boolean>
}>

type CapturedUnitCandidateSnapshot = Readonly<{
  tipoId: ResourceId
  signature: string
  generation: number
  references: readonly UnitPolicyReference[]
}>

const uniqueUnitPolicyReferences = (
  references: readonly UnitPolicyReference[],
  identity: (id: ResourceId) => string,
) => {
  const indexes = new Map<string, number>()
  return references.reduce<UnitPolicyReference[]>((result, reference) => {
    const key = identity(reference.unidadId)
    const index = indexes.get(key)
    if (index === undefined) {
      indexes.set(key, result.length)
      result.push(reference)
      return result
    }
    const known = result[index]!
    result[index] = {
      ...known,
      principal: known.principal || reference.principal,
      selected: known.selected || reference.selected,
    }
    return result
  }, [])
}

const unitPolicyReferenceSignature = (
  snapshot: UnitCandidateHydrationSnapshot,
  identity: (id: ResourceId) => string,
) =>
  JSON.stringify({
    tipoId: identity(snapshot.tipoId),
    cursor: snapshot.cursor,
    references: snapshot.references.map((reference) => ({
      policyId: identity(reference.policyId),
      unidadId: identity(reference.unidadId),
      principal: reference.principal,
      selected: reference.selected,
    })),
  })

const isEligibleUnitDetail = (
  detail: ResourceUnitDetail | null,
): detail is ResourceUnitDetail =>
  detail !== null && detail.activo && detail.effective

export function createUnitCandidateHydrator(options: {
  identity: (id: ResourceId) => string
  getUnit: (input: {
    unidadId: ResourceId
  }) => Promise<ResourceUnitDetail | null>
}): UnitCandidateHydrator {
  let generation = 0
  let snapshot: CapturedUnitCandidateSnapshot | null = null
  let pending: Promise<boolean> | null = null
  let pendingGeneration: number | null = null
  let state: UnitCandidateHydrationState = {
    status: 'idle',
    tipoId: null,
    snapshotSignature: null,
    generation,
    candidates: [],
    failedUnitIds: [],
  }

  const isCurrent = (request: CapturedUnitCandidateSnapshot) =>
    snapshot?.generation === request.generation &&
    snapshot.signature === request.signature

  const hydrate = async (
    request: CapturedUnitCandidateSnapshot,
    references: readonly UnitPolicyReference[],
    retainedCandidates: readonly UnitCandidate[],
  ) => {
    state = {
      status: 'loading',
      tipoId: request.tipoId,
      snapshotSignature: request.signature,
      generation: request.generation,
      candidates: retainedCandidates,
      failedUnitIds: references.map((reference) => reference.unidadId),
    }
    try {
      const details = await Promise.allSettled(
        references.map((reference) =>
          options.getUnit({ unidadId: reference.unidadId }),
        ),
      )
      if (!isCurrent(request)) return false

      const candidatesByUnitId = new Map(
        retainedCandidates.map((candidate) => [
          options.identity(candidate.unidadId),
          candidate,
        ]),
      )
      const failedUnitIds: ResourceId[] = []
      details.forEach((result, index) => {
        const reference = references[index]!
        if (result.status === 'rejected') {
          failedUnitIds.push(reference.unidadId)
          return
        }
        if (!isEligibleUnitDetail(result.value)) return
        candidatesByUnitId.set(options.identity(reference.unidadId), {
          unidadId: result.value.id,
          clave: result.value.clave,
          nombre: result.value.nombre,
          ...(result.value.simbolo === undefined
            ? {}
            : { simbolo: result.value.simbolo }),
          principal: reference.principal,
          selected: reference.selected,
        })
      })
      const candidates = request.references.flatMap((reference) => {
        const candidate = candidatesByUnitId.get(
          options.identity(reference.unidadId),
        )
        return candidate === undefined ? [] : [candidate]
      })
      state = {
        status: failedUnitIds.length
          ? 'partial-error'
          : candidates.length
            ? 'ready'
            : 'empty',
        tipoId: request.tipoId,
        snapshotSignature: request.signature,
        generation: request.generation,
        candidates,
        failedUnitIds,
      }
      return failedUnitIds.length === 0
    } finally {
      if (pendingGeneration === request.generation) {
        pending = null
        pendingGeneration = null
      }
    }
  }

  return {
    getState: () => state,
    setSnapshot: (nextSnapshot) => {
      generation++
      snapshot =
        nextSnapshot === null
          ? null
          : {
              tipoId: nextSnapshot.tipoId,
              signature: unitPolicyReferenceSignature(
                nextSnapshot,
                options.identity,
              ),
              generation,
              references: uniqueUnitPolicyReferences(
                nextSnapshot.references,
                options.identity,
              ),
            }
      state = {
        status: 'idle',
        tipoId: snapshot?.tipoId ?? null,
        snapshotSignature: snapshot?.signature ?? null,
        generation,
        candidates: [],
        failedUnitIds: [],
      }
    },
    start: () => {
      if (snapshot === null) return Promise.resolve(false)
      if (pending !== null && pendingGeneration === snapshot.generation)
        return pending
      const request = snapshot
      const requestPromise = hydrate(request, request.references, [])
      pending = requestPromise
      pendingGeneration = request.generation
      return requestPromise
    },
    retry: () => {
      if (snapshot === null) return Promise.resolve(false)
      if (pending !== null && pendingGeneration === snapshot.generation)
        return pending
      if (state.status !== 'partial-error' || state.failedUnitIds.length === 0)
        return Promise.resolve(false)
      const failedUnitKeys = new Set(state.failedUnitIds.map(options.identity))
      const references = snapshot.references.filter((reference) =>
        failedUnitKeys.has(options.identity(reference.unidadId)),
      )
      if (references.length === 0) return Promise.resolve(false)
      const request = snapshot
      const requestPromise = hydrate(request, references, state.candidates)
      pending = requestPromise
      pendingGeneration = request.generation
      return requestPromise
    },
  }
}

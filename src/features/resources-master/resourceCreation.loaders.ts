export {
  createDependentLoader,
  type DependentLoader,
  type DependentLoadState,
  type DependentPage,
} from './resourceCreation.dependentLoader'

import type { ResourceId, ResourceUnitDetail } from './resourcesMaster.types'

export type UnitPolicyReference = Readonly<{
  policyId: ResourceId
  unidadId: ResourceId
  principal: boolean
  selected: boolean
}>

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

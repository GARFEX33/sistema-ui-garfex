import type { CreationState } from './resourceCreation.model'
import type {
  ResourceCreationEvaluation,
  ResourceCreationEvaluationOwnership,
} from './resourcesMaster.types'

declare const requestTokenBrand: unique symbol

export type ResourceCreationEvaluationRequestToken = string & {
  readonly [requestTokenBrand]: 'ResourceCreationEvaluationRequestToken'
}

export type ResourceCreationEvaluationOwnershipIdentity =
  | Readonly<{ kind: 'GLOBAL' }>
  | Readonly<{ kind: 'ORGANIZATION'; organizacionId: string }>

export type ResourceCreationEvaluationLease = Readonly<{
  requestToken: ResourceCreationEvaluationRequestToken
  ownershipIdentity: ResourceCreationEvaluationOwnershipIdentity
  openGeneration: number
  revision: number
  classKey: string
  familyKey: string
  typeKey: string
  unitKey: string
}>

export const asResourceCreationEvaluationRequestToken = (value: string) =>
  value as ResourceCreationEvaluationRequestToken

export const normalizeResourceCreationEvaluationOwnership = (
  ownership: ResourceCreationEvaluationOwnership | null,
): ResourceCreationEvaluationOwnershipIdentity | null => {
  if (!ownership || typeof ownership !== 'object') return null
  if (ownership.kind === 'GLOBAL') return Object.freeze({ kind: 'GLOBAL' })
  if (
    ownership.kind === 'ORGANIZATION' &&
    typeof ownership.organizacionId === 'string' &&
    ownership.organizacionId.length > 0
  )
    return Object.freeze({
      kind: 'ORGANIZATION',
      organizacionId: ownership.organizacionId,
    })
  return null
}

const sameOwnership = (
  left: ResourceCreationEvaluationOwnershipIdentity | null,
  right: ResourceCreationEvaluationOwnershipIdentity | null,
) =>
  left?.kind === right?.kind &&
  (left?.kind !== 'ORGANIZATION' ||
    right?.kind !== 'ORGANIZATION' ||
    left.organizacionId === right.organizacionId)

const identityKey = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null

const currentIdentity = (state: CreationState) => {
  const { hierarchy, unitId } = state.draft
  if (!hierarchy.classItem || !hierarchy.familyItem || !hierarchy.typeItem)
    return null

  const classKey = identityKey(hierarchy.classItem.id)
  const familyKey = identityKey(hierarchy.familyItem.id)
  const typeKey = identityKey(hierarchy.typeItem.id)
  const unitKey = identityKey(unitId)
  if (!classKey || !familyKey || !typeKey || !unitKey) return null

  return { classKey, familyKey, typeKey, unitKey }
}

export const captureResourceCreationEvaluationLease = (
  state: CreationState,
  requestToken: ResourceCreationEvaluationRequestToken,
  ownership: ResourceCreationEvaluationOwnership | null,
): Readonly<{
  state: CreationState
  lease: ResourceCreationEvaluationLease | null
}> => {
  const identity = currentIdentity(state)
  const ownershipIdentity =
    normalizeResourceCreationEvaluationOwnership(ownership)
  if (!identity || !ownershipIdentity) return { state, lease: null }

  const ownershipChanged = !sameOwnership(
    state.evaluationOwnershipIdentity,
    ownershipIdentity,
  )
  const currentState =
    state.evaluationRequestToken === requestToken && !ownershipChanged
      ? state
      : {
          ...state,
          draft: ownershipChanged
            ? {
                ...state.draft,
                authoritativeEvaluation: null,
                catalogFingerprint: null,
              }
            : state.draft,
          evaluationRequestToken: requestToken,
          evaluationOwnershipIdentity: ownershipIdentity,
        }
  return {
    state: currentState,
    lease: Object.freeze({
      requestToken,
      ownershipIdentity,
      openGeneration: state.openGeneration,
      revision: state.draft.revision,
      ...identity,
    }),
  }
}

export const adoptResourceCreationEvaluation = (
  state: CreationState,
  lease: ResourceCreationEvaluationLease | null,
  evaluation: ResourceCreationEvaluation,
): CreationState => {
  const identity = currentIdentity(state)
  if (
    !lease ||
    !identity ||
    !sameOwnership(
      state.evaluationOwnershipIdentity,
      lease.ownershipIdentity,
    ) ||
    state.evaluationRequestToken !== lease.requestToken ||
    state.openGeneration !== lease.openGeneration ||
    state.draft.revision !== lease.revision ||
    identity.classKey !== lease.classKey ||
    identity.familyKey !== lease.familyKey ||
    identity.typeKey !== lease.typeKey ||
    identity.unitKey !== lease.unitKey
  )
    return state

  return {
    ...state,
    draft: {
      ...state.draft,
      authoritativeEvaluation: evaluation,
      catalogFingerprint: evaluation.catalogFingerprint,
    },
  }
}

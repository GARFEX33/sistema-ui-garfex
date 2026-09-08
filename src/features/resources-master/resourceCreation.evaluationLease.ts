import type { CreationState } from './resourceCreation.model'
import type { ResourceCreationEvaluation } from './resourcesMaster.types'

declare const requestTokenBrand: unique symbol

export type ResourceCreationEvaluationRequestToken = string & {
  readonly [requestTokenBrand]: 'ResourceCreationEvaluationRequestToken'
}

export type ResourceCreationEvaluationLease = Readonly<{
  requestToken: ResourceCreationEvaluationRequestToken
  openGeneration: number
  revision: number
  classKey: string
  familyKey: string
  typeKey: string
  unitKey: string
}>

export const asResourceCreationEvaluationRequestToken = (value: string) =>
  value as ResourceCreationEvaluationRequestToken

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
): Readonly<{
  state: CreationState
  lease: ResourceCreationEvaluationLease | null
}> => {
  const identity = currentIdentity(state)
  if (!identity) return { state, lease: null }

  const currentState =
    state.evaluationRequestToken === requestToken
      ? state
      : { ...state, evaluationRequestToken: requestToken }
  return {
    state: currentState,
    lease: Object.freeze({
      requestToken,
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

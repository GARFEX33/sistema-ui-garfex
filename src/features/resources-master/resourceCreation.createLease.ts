import type { CreationState } from './resourceCreation.model'
import {
  normalizeResourceCreationEvaluationOwnership,
  type ResourceCreationEvaluationOwnershipIdentity,
} from './resourceCreation.evaluationLease'
import { buildResourceCreationEvaluationRequest } from './resourceCreation.evaluationRequest'
import type {
  ResourceCreateFromSelectionsInput,
  ResourceCreationEvaluation,
  ResourceCreationEvaluationOwnership,
} from './resourcesMaster.types'

declare const createTokenBrand: unique symbol

export type ResourceCreationCreateToken = string & {
  readonly [createTokenBrand]: 'ResourceCreationCreateToken'
}

export type ResourceCreationCreateLease = Readonly<{
  createToken: ResourceCreationCreateToken
  stateIdentity: CreationState
  evaluation: ResourceCreationEvaluation
  ownershipIdentity: ResourceCreationEvaluationOwnershipIdentity
  openGeneration: number
  revision: number
  classKey: string
  familyKey: string
  typeKey: string
  unitKey: string
  catalogFingerprint: string
}>

export const asResourceCreationCreateToken = (value: string) =>
  value as ResourceCreationCreateToken

const exactNonblankString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

const currentContext = (state: CreationState) => {
  const { hierarchy, unitId } = state.draft
  const classKey = exactNonblankString(hierarchy.classItem?.id)
  const familyKey = exactNonblankString(hierarchy.familyItem?.id)
  const typeKey = exactNonblankString(hierarchy.typeItem?.id)
  const unitKey = exactNonblankString(unitId)

  return classKey && familyKey && typeKey && unitKey
    ? { classKey, familyKey, typeKey, unitKey }
    : null
}

const sameOwnership = (
  left: ResourceCreationEvaluationOwnershipIdentity | null,
  right: ResourceCreationEvaluationOwnershipIdentity | null,
) =>
  left?.kind === right?.kind &&
  (left?.kind !== 'ORGANIZATION' ||
    right?.kind !== 'ORGANIZATION' ||
    left.organizacionId === right.organizacionId)

const currentEvaluation = (state: CreationState) => {
  const evaluation = state.draft.authoritativeEvaluation
  const fingerprint = exactNonblankString(state.draft.catalogFingerprint)

  return evaluation?.status === 'VALID' &&
    evaluation.valid === true &&
    fingerprint !== null &&
    evaluation.catalogFingerprint === fingerprint
    ? { evaluation, fingerprint }
    : null
}

export const captureResourceCreationCreateLease = (
  state: CreationState,
  ownership: ResourceCreationEvaluationOwnership | null,
  createToken: ResourceCreationCreateToken,
) => {
  if (state.stage.kind !== 'review-pending') return null

  const context = currentContext(state)
  const evaluation = currentEvaluation(state)
  const ownershipIdentity =
    normalizeResourceCreationEvaluationOwnership(ownership)
  const evaluationRequest = buildResourceCreationEvaluationRequest(
    state,
    ownership,
  )
  if (!context || !evaluation || !ownershipIdentity || !evaluationRequest)
    return null

  const request: ResourceCreateFromSelectionsInput = Object.freeze({
    claseRecursoId: evaluationRequest.claseRecursoId,
    familiaRecursoId: evaluationRequest.familiaRecursoId,
    tipoRecursoId: evaluationRequest.tipoRecursoId,
    unidadId: evaluationRequest.unidadId,
    expectedCatalogFingerprint: evaluation.fingerprint,
    selecciones: Array.from(evaluationRequest.selecciones),
    ownership: evaluationRequest.ownership,
  })
  const lease = Object.freeze({
    createToken,
    stateIdentity: state,
    evaluation: evaluation.evaluation,
    ownershipIdentity,
    openGeneration: state.openGeneration,
    revision: state.draft.revision,
    ...context,
    catalogFingerprint: evaluation.fingerprint,
  })

  return Object.freeze({ request, lease })
}

export const isResourceCreationCreateLeaseCurrent = (
  state: CreationState,
  ownership: ResourceCreationEvaluationOwnership | null,
  lease: ResourceCreationCreateLease | null,
) => {
  const context = currentContext(state)
  const evaluation = currentEvaluation(state)
  const ownershipIdentity =
    normalizeResourceCreationEvaluationOwnership(ownership)

  return (
    lease !== null &&
    state === lease.stateIdentity &&
    state.stage.kind === 'review-pending' &&
    evaluation?.evaluation === lease.evaluation &&
    evaluation.fingerprint === lease.catalogFingerprint &&
    sameOwnership(ownershipIdentity, lease.ownershipIdentity) &&
    state.openGeneration === lease.openGeneration &&
    state.draft.revision === lease.revision &&
    context?.classKey === lease.classKey &&
    context?.familyKey === lease.familyKey &&
    context?.typeKey === lease.typeKey &&
    context?.unitKey === lease.unitKey
  )
}

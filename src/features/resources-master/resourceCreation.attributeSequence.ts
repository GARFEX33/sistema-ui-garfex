import type {
  ResourceAllowedAttributeValueItem,
  ResourceCreationEvaluation,
  ResourceResolvedCreationAssignment,
} from './resourcesMaster.types'
import {
  clearSelectionOmission,
  confirmSelection,
  suspendSelection,
  type AssignmentKey,
  type SelectionBuckets,
} from './resourceCreation.selectionDraft'

declare const allowedValueIdBrand: unique symbol

export type AllowedValueId = string & {
  readonly [allowedValueIdBrand]: 'AllowedValueId'
}

export type AllowedValuesKnowledge = Readonly<
  Record<
    string,
    Readonly<{
      status: 'PARTIAL' | 'EXHAUSTED'
      values: readonly ResourceAllowedAttributeValueItem[]
    }>
  >
>

export type AttributeSequenceReconciliation = Readonly<{
  sequence: readonly ResourceResolvedCreationAssignment[]
  selectionBuckets: SelectionBuckets<AllowedValueId>
  suspendedAllowedValueStatus: Readonly<
    Record<AssignmentKey, 'UNKNOWN' | 'NOT_ALLOWED'>
  >
  pendingAssignmentId: AssignmentKey | null
}>

export const asAllowedValueId = (value: string) => value as AllowedValueId

export const deriveAttributeSequence = (
  assignments: readonly ResourceResolvedCreationAssignment[],
) =>
  assignments.filter(
    ({ aplicabilidadResuelta }) =>
      aplicabilidadResuelta === 'REQUIRED' ||
      aplicabilidadResuelta === 'OPTIONAL',
  )

const hasKey = <TSelection>(
  selections: Readonly<Record<AssignmentKey, TSelection>>,
  key: AssignmentKey,
) => Object.hasOwn(selections, key)

const allowedValueStatus = (
  value: AllowedValueId,
  definitionId: string,
  allowedValuesByDefinition: AllowedValuesKnowledge,
): true | 'UNKNOWN' | 'NOT_ALLOWED' => {
  const knowledge = allowedValuesByDefinition[definitionId]
  if (
    knowledge?.values.some(
      (candidate) =>
        candidate.activo &&
        candidate.effective &&
        candidate.definicionAtributoId === definitionId &&
        candidate.id === value,
    )
  )
    return true
  return knowledge?.status === 'EXHAUSTED' ? 'NOT_ALLOWED' : 'UNKNOWN'
}

const isApplicable = (assignment: ResourceResolvedCreationAssignment) =>
  assignment.aplicabilidadResuelta === 'REQUIRED' ||
  assignment.aplicabilidadResuelta === 'OPTIONAL'

const isPending = (
  assignment: ResourceResolvedCreationAssignment,
  buckets: SelectionBuckets<AllowedValueId>,
) =>
  !hasKey(buckets.active, assignment.asignacionAtributoId) &&
  !(
    assignment.aplicabilidadResuelta === 'OPTIONAL' &&
    buckets.omitted.has(assignment.asignacionAtributoId)
  )

export const reconcileAttributeSequence = (
  evaluation: Pick<
    ResourceCreationEvaluation,
    'asignaciones' | 'seleccionesInvalidas'
  >,
  buckets: SelectionBuckets<AllowedValueId>,
  allowedValuesByDefinition: AllowedValuesKnowledge,
  pendingAssignmentId: AssignmentKey | null,
): AttributeSequenceReconciliation => {
  const invalidAssignments = new Set(evaluation.seleccionesInvalidas)
  const suspendedAllowedValueStatus: Record<
    AssignmentKey,
    'UNKNOWN' | 'NOT_ALLOWED'
  > = {}
  const assignmentIds = new Set<string>()
  let selectionBuckets = buckets

  for (const assignment of evaluation.asignaciones) {
    const key = assignment.asignacionAtributoId
    assignmentIds.add(key)
    if (!isApplicable(assignment)) {
      selectionBuckets = suspendSelection(selectionBuckets, key)
      continue
    }

    if (hasKey(selectionBuckets.active, key)) {
      const selection = selectionBuckets.active[key]
      selectionBuckets =
        assignment.selectedValueId === selection && !invalidAssignments.has(key)
          ? confirmSelection(selectionBuckets, key, selection)
          : suspendSelection(selectionBuckets, key)
    } else if (hasKey(selectionBuckets.suspended, key)) {
      const status = allowedValueStatus(
        selectionBuckets.suspended[key],
        assignment.definicionAtributoId,
        allowedValuesByDefinition,
      )
      if (status === true)
        selectionBuckets = confirmSelection(
          selectionBuckets,
          key,
          selectionBuckets.suspended[key],
        )
      else suspendedAllowedValueStatus[key] = status
    }

    if (assignment.aplicabilidadResuelta === 'REQUIRED')
      selectionBuckets = clearSelectionOmission(selectionBuckets, key)
  }

  for (const key of Object.keys(selectionBuckets.active))
    if (!assignmentIds.has(key))
      selectionBuckets = suspendSelection(selectionBuckets, key)

  const sequence = deriveAttributeSequence(evaluation.asignaciones)
  const pending = sequence.filter((assignment) =>
    isPending(assignment, selectionBuckets),
  )
  return {
    sequence,
    selectionBuckets,
    suspendedAllowedValueStatus,
    pendingAssignmentId:
      pendingAssignmentId !== null &&
      pending.some(
        (assignment) => assignment.asignacionAtributoId === pendingAssignmentId,
      )
        ? pendingAssignmentId
        : (pending[0]?.asignacionAtributoId ?? null),
  }
}

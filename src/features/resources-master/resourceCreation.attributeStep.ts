import {
  deriveAttributeSequence,
  type AllowedValueId,
} from './resourceCreation.attributeSequence'
import type { SelectionBuckets } from './resourceCreation.selectionDraft'
import type {
  ResourceCreationEvaluation,
  ResourceResolvedCreationAssignment,
} from './resourcesMaster.types'

export type AttributeStep =
  | Readonly<{ kind: 'unavailable' }>
  | Readonly<{ kind: 'complete' }>
  | Readonly<{
      kind: 'current'
      assignment: ResourceResolvedCreationAssignment
      position: number
      total: number
    }>

const hasKey = <TSelection>(
  selections: Readonly<Record<string, TSelection>>,
  key: string,
) => Object.hasOwn(selections, key)

const isResolved = (
  assignment: ResourceResolvedCreationAssignment,
  buckets: SelectionBuckets<AllowedValueId>,
) => {
  const key = assignment.asignacionAtributoId
  if (hasKey(buckets.suspended, key)) return false
  if (hasKey(buckets.active, key)) return true
  return (
    assignment.aplicabilidadResuelta === 'OPTIONAL' && buckets.omitted.has(key)
  )
}

export const deriveCurrentAttributeStep = (
  evaluation: ResourceCreationEvaluation | null,
  buckets: SelectionBuckets<AllowedValueId>,
): AttributeStep => {
  if (evaluation === null) return { kind: 'unavailable' }

  const sequence = deriveAttributeSequence(evaluation.asignaciones)
  const assignmentIds = new Set<string>()
  for (const assignment of sequence) {
    if (assignmentIds.has(assignment.asignacionAtributoId))
      return { kind: 'unavailable' }
    assignmentIds.add(assignment.asignacionAtributoId)
  }

  const currentIndex = sequence.findIndex(
    (assignment) => !isResolved(assignment, buckets),
  )
  if (currentIndex !== -1)
    return {
      kind: 'current',
      assignment: sequence[currentIndex],
      position: currentIndex + 1,
      total: sequence.length,
    }

  return evaluation.status === 'VALID'
    ? { kind: 'complete' }
    : { kind: 'unavailable' }
}

import type { CreationState } from './resourceCreation.model'
import {
  normalizeResourceCreationEvaluationOwnership,
  type ResourceCreationEvaluationOwnershipIdentity,
} from './resourceCreation.evaluationLease'
import type { ResourceCreationEvaluationInput } from './resourcesMaster.types'

const exactId = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null

const requestOwnership = (
  ownership: ResourceCreationEvaluationOwnershipIdentity,
): ResourceCreationEvaluationInput['ownership'] => ownership

export const buildResourceCreationEvaluationRequest = (
  state: CreationState,
  ownership: ResourceCreationEvaluationInput['ownership'] | null,
): ResourceCreationEvaluationInput | null => {
  const { hierarchy, selectionBuckets, unitId } = state.draft
  const classId = exactId(hierarchy.classItem?.id)
  const familyId = exactId(hierarchy.familyItem?.id)
  const typeId = exactId(hierarchy.typeItem?.id)
  const unitIdKey = exactId(unitId)
  const ownershipIdentity =
    normalizeResourceCreationEvaluationOwnership(ownership)
  if (!classId || !familyId || !typeId || !unitIdKey || !ownershipIdentity)
    return null

  const selecciones: Array<
    ResourceCreationEvaluationInput['selecciones'][number]
  > = []
  for (const [asignacionAtributoId, value] of Object.entries(
    selectionBuckets.active,
  )) {
    const valorPermitidoId = exactId(value)
    if (!exactId(asignacionAtributoId) || !valorPermitidoId) return null
    selecciones.push({ asignacionAtributoId, valorPermitidoId })
  }

  return {
    claseRecursoId: classId,
    familiaRecursoId: familyId,
    tipoRecursoId: typeId,
    unidadId: unitIdKey,
    selecciones,
    ownership: requestOwnership(ownershipIdentity),
  }
}

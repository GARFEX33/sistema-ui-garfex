import type {
  AllowedValueId,
  AllowedValuesKnowledge,
} from './resourceCreation.attributeSequence'
import {
  deriveCurrentAttributeStep,
  type AttributeStep,
} from './resourceCreation.attributeStep'
import type { SelectionBuckets } from './resourceCreation.selectionDraft'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type { ResourceCreationEvaluation } from './resourcesMaster.types'
import {
  useResourceCreationAttributeDefinition,
  type ResourceCreationAttributeDefinitionStatus,
} from './useResourceCreationAttributeDefinition'
import { useResourceCreationAllowedValues } from './useResourceCreationAllowedValues'

export type ResourceCreationAttributeQueriesOptions = Readonly<{
  api: Pick<
    ResourcesMasterApi,
    'getAttributeDefinition' | 'listAllowedAttributeValues'
  >
  evaluation: ResourceCreationEvaluation | null
  selectionBuckets: SelectionBuckets<AllowedValueId>
}>

export type ResourceCreationAttributeQueries = Readonly<{
  step: AttributeStep
  definition: ResourceCreationAttributeDefinitionStatus
  allowedValues: ReturnType<typeof useResourceCreationAllowedValues>
  allowedValuesKnowledge: AllowedValuesKnowledge
}>

export function useResourceCreationAttributeQueries({
  api,
  evaluation,
  selectionBuckets,
}: ResourceCreationAttributeQueriesOptions): ResourceCreationAttributeQueries {
  const step = deriveCurrentAttributeStep(evaluation, selectionBuckets)
  const assignment = step.kind === 'current' ? step.assignment : null
  const definition = useResourceCreationAttributeDefinition({ api, assignment })
  const allowedValues = useResourceCreationAllowedValues({
    api,
    assignment,
    definition:
      definition.status === 'selection-ready' ? definition.definition : null,
  })

  return {
    step,
    definition,
    allowedValues,
    allowedValuesKnowledge: allowedValues.knowledge,
  }
}

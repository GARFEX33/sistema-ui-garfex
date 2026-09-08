import type {
  ResourceCreationAttributeAssignmentView,
  ResourceCreationAttributeDefinitionView,
  ResourceCreationAttributesStageView,
} from './ResourceCreationAttributesStage'
import type { AttributeStep } from './resourceCreation.attributeStep'
import type { ResourceAttributeDefinition } from './resourcesMaster.types'

type ResourceCreationAttributeDefinitionDriver =
  | Readonly<{ status: 'idle'; retry: () => void }>
  | Readonly<{ status: 'loading'; retry: () => void }>
  | Readonly<{ status: 'error'; retry: () => void }>
  | Readonly<{ status: 'unavailable'; retry: () => void }>
  | Readonly<{
      status: 'unsupported-free-capture'
      definition: ResourceAttributeDefinition
      retry: () => void
    }>
  | Readonly<{
      status: 'selection-ready'
      definition: ResourceAttributeDefinition
      retry: () => void
    }>

export type ResourceCreationAttributeViewInput = Readonly<{
  evaluation: Readonly<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    retry: () => void
  }>
  step: AttributeStep
  definition: ResourceCreationAttributeDefinitionDriver
  onOmit: () => void
}>

export type ResourceCreationAttributeViewResult =
  | Readonly<{ kind: 'complete' }>
  | Readonly<{
      kind: 'presenter'
      view: ResourceCreationAttributesStageView
    }>
  | Readonly<{
      kind: 'selection-context'
      assignment: ResourceCreationAttributeAssignmentView
      authoritativeAssignment: Extract<
        AttributeStep,
        { kind: 'current' }
      >['assignment']
      definition: ResourceCreationAttributeDefinitionView
    }>

const assignmentView = (
  step: Extract<AttributeStep, { kind: 'current' }>,
): ResourceCreationAttributeAssignmentView => ({
  current: step.position,
  total: step.total,
  applicability:
    step.assignment.aplicabilidadResuelta === 'OPTIONAL'
      ? 'OPTIONAL'
      : 'REQUIRED',
})

const definitionView = (
  definition: ResourceAttributeDefinition,
): ResourceCreationAttributeDefinitionView => ({
  name: definition.nombre,
  ...(definition.descripcion === undefined
    ? {}
    : { description: definition.descripcion }),
})

export const projectResourceCreationAttributeView = ({
  evaluation,
  step,
  definition,
  onOmit,
}: ResourceCreationAttributeViewInput): ResourceCreationAttributeViewResult => {
  if (step.kind === 'complete') return { kind: 'complete' }

  if (step.kind === 'unavailable') {
    if (evaluation.status === 'idle' || evaluation.status === 'loading')
      return { kind: 'presenter', view: { status: 'evaluation-loading' } }
    if (evaluation.status === 'error')
      return {
        kind: 'presenter',
        view: { status: 'evaluation-error', onRetry: evaluation.retry },
      }
    return { kind: 'presenter', view: { status: 'evaluation-unavailable' } }
  }

  const assignment = assignmentView(step)
  if (definition.status === 'loading')
    return {
      kind: 'presenter',
      view: {
        status: 'definition-loading',
        assignment,
        onRetry: definition.retry,
      },
    }
  if (definition.status === 'error')
    return {
      kind: 'presenter',
      view: {
        status: 'definition-error',
        assignment,
        onRetry: definition.retry,
      },
    }
  if (definition.status === 'idle' || definition.status === 'unavailable')
    return {
      kind: 'presenter',
      view: { status: 'definition-unavailable', assignment },
    }

  const projectedDefinition = definitionView(definition.definition)
  if (definition.status === 'unsupported-free-capture')
    return {
      kind: 'presenter',
      view: {
        status: 'unsupported-free-capture',
        assignment,
        definition: projectedDefinition,
        ...(step.assignment.aplicabilidadResuelta === 'OPTIONAL'
          ? { onOmit }
          : {}),
      },
    }

  return {
    kind: 'selection-context',
    assignment,
    authoritativeAssignment: step.assignment,
    definition: projectedDefinition,
  }
}

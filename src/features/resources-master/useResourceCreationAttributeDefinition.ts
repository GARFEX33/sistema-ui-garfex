import { useQuery } from '@tanstack/react-query'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type {
  ResourceAttributeDefinition,
  ResourceResolvedCreationAssignment,
} from './resourcesMaster.types'

export type ResourceCreationAttributeDefinitionStatus =
  | {
      status: 'idle'
      retry: () => Promise<void>
    }
  | {
      status: 'loading'
      retry: () => Promise<void>
    }
  | {
      status: 'error'
      retry: () => Promise<void>
    }
  | {
      status: 'unavailable'
      retry: () => Promise<void>
    }
  | {
      status: 'unsupported-free-capture'
      definition: ResourceAttributeDefinition
      retry: () => Promise<void>
    }
  | {
      status: 'selection-ready'
      definition: ResourceAttributeDefinition
      retry: () => Promise<void>
    }

export type ResourceCreationAttributeDefinitionOptions = Readonly<{
  api: Pick<ResourcesMasterApi, 'getAttributeDefinition'>
  assignment: ResourceResolvedCreationAssignment | null
}>

const usableDefinition = (
  definition: ResourceAttributeDefinition | null | undefined,
  assignment: ResourceResolvedCreationAssignment,
): definition is ResourceAttributeDefinition =>
  definition !== null &&
  definition !== undefined &&
  definition.id === assignment.definicionAtributoId &&
  definition.activo &&
  definition.effective

export function useResourceCreationAttributeDefinition({
  api,
  assignment,
}: ResourceCreationAttributeDefinitionOptions): ResourceCreationAttributeDefinitionStatus {
  const query = useQuery({
    queryKey: [
      'resources-master',
      'creation-attribute-definition',
      assignment?.asignacionAtributoId ?? 'disabled',
      assignment?.definicionAtributoId ?? 'disabled',
    ],
    enabled: assignment !== null,
    queryFn: () =>
      api.getAttributeDefinition({
        definicionAtributoId: assignment!.definicionAtributoId,
      }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const retry = () =>
    assignment === null || !query.isError
      ? Promise.resolve()
      : query.refetch().then(
          () => undefined,
          () => undefined,
        )

  if (assignment === null) return { status: 'idle', retry }
  if (query.isError) return { status: 'error', retry }
  if (!usableDefinition(query.data, assignment))
    return query.data === undefined
      ? { status: 'loading', retry }
      : { status: 'unavailable', retry }
  if (query.data.modoCaptura === 'LIBRE')
    return { status: 'unsupported-free-capture', definition: query.data, retry }
  return { status: 'selection-ready', definition: query.data, retry }
}

import { useInfiniteQuery } from '@tanstack/react-query'
import type { AllowedValuesKnowledge } from './resourceCreation.attributeSequence'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type {
  ResourceAttributeDefinition,
  ResourceId,
  ResourceResolvedCreationAssignment,
} from './resourcesMaster.types'
export type ResourceCreationAllowedValuesOptions = Readonly<{
  api: Pick<ResourcesMasterApi, 'listAllowedAttributeValues'>
  assignment: ResourceResolvedCreationAssignment | null
  definition: ResourceAttributeDefinition | null
}>
const usableSelection = (
  assignment: ResourceResolvedCreationAssignment | null,
  definition: ResourceAttributeDefinition | null,
) =>
  assignment !== null &&
  definition !== null &&
  assignment.definicionAtributoId === definition.id &&
  definition.activo &&
  definition.effective &&
  definition.modoCaptura === 'SELECCION'
const settle = (request: Promise<unknown>) =>
  request.then(
    () => undefined,
    () => undefined,
  )
export function useResourceCreationAllowedValues({
  api,
  assignment,
  definition,
}: ResourceCreationAllowedValuesOptions) {
  const enabled = usableSelection(assignment, definition)
  const query = useInfiniteQuery({
    queryKey: [
      'resources-master',
      'creation-allowed-values',
      assignment?.asignacionAtributoId ?? 'disabled',
      assignment?.definicionAtributoId ?? 'disabled',
      definition?.id ?? 'disabled',
    ],
    enabled,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const page = await api.listAllowedAttributeValues({
        definicionAtributoId: definition!.id,
        cursor: pageParam,
        pageSize: 20,
        modo: 'ACTIVE',
      })
      if (!page.isExhausted && page.continuationCursor === null)
        throw new Error(
          'Allowed attribute values continuation cursor is missing',
        )
      return page
    },
    getNextPageParam: (page) =>
      page.isExhausted ? undefined : page.continuationCursor,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const pages = query.data?.pages ?? []
  const values = (() => {
    const seen = new Set<ResourceId>()
    return !enabled || definition === null
      ? []
      : pages.flatMap(({ items }) =>
          items.filter((item) => {
            if (
              item.definicionAtributoId !== definition.id ||
              !item.activo ||
              !item.effective ||
              seen.has(item.id)
            )
              return false
            seen.add(item.id)
            return true
          }),
        )
  })()
  const knowledge: AllowedValuesKnowledge =
    !enabled || assignment === null || definition === null || pages.length === 0
      ? {}
      : {
          [assignment.definicionAtributoId]: {
            status: pages.at(-1)?.isExhausted ? 'EXHAUSTED' : 'PARTIAL',
            values,
          },
        }
  const status = !enabled
    ? 'idle'
    : query.isError
      ? 'error'
      : query.isPending
        ? 'loading'
        : 'ready'
  const hasNextPage = enabled && query.hasNextPage === true
  const isFetchingNextPage = enabled && query.isFetchingNextPage
  const continuePage = () =>
    !enabled || !hasNextPage || query.isFetchingNextPage || query.isError
      ? Promise.resolve()
      : settle(query.fetchNextPage())
  const retry = () =>
    !enabled || !query.isError
      ? Promise.resolve()
      : settle(pages.length ? query.fetchNextPage() : query.refetch())
  return {
    status,
    values,
    knowledge,
    hasNextPage,
    isFetchingNextPage,
    continue: continuePage,
    retry,
  }
}

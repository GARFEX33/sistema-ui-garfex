import { resourceIdKey } from './resourceCreation.model'
import {
  createDependentLoader,
  type DependentLoadState,
} from './resourceCreation.dependentLoader'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type { ResourceId, ResourceUnitDetail } from './resourcesMaster.types'

export type UnitCandidate = Readonly<{
  unidadId: ResourceId
  clave: string
  nombre: string
  simbolo?: string
}>

export type ActiveUnitPageState = Omit<
  DependentLoadState<UnitCandidate>,
  'items'
> & { candidates: readonly UnitCandidate[] }

export type ActiveUnitPageController = Readonly<{
  getState: () => ActiveUnitPageState
  open: (openingKey: string) => void
  close: () => void
  start: () => Promise<boolean>
  continue: () => Promise<boolean>
  retry: () => Promise<boolean>
}>

export function createActiveUnitPageController(options: {
  api: Pick<ResourcesMasterApi, 'listUnits'>
  pageSize?: number
}): ActiveUnitPageController {
  let openingKey: string | null = null
  const loader = createDependentLoader<ResourceUnitDetail>({
    identity: (item) => resourceIdKey(item.id),
    load: async ({ cursor }) => {
      const page = await options.api.listUnits({
        modo: 'ACTIVE',
        cursor,
        ...(options.pageSize === undefined
          ? {}
          : { pageSize: options.pageSize }),
      })
      return {
        items: page.items.filter((item) => item.activo && item.effective),
        continuationCursor: page.continuationCursor,
        isExhausted: page.isExhausted,
      }
    },
  })

  const getState = (): ActiveUnitPageState => {
    const { items, ...state } = loader.getState()
    return {
      ...state,
      candidates: items.map(({ id, clave, nombre, simbolo }) => ({
        unidadId: id,
        clave,
        nombre,
        ...(simbolo === undefined ? {} : { simbolo }),
      })),
    } as ActiveUnitPageState
  }

  return {
    getState,
    open: (nextOpeningKey) => {
      if (openingKey === nextOpeningKey) return
      openingKey = nextOpeningKey
      loader.setContext(nextOpeningKey)
    },
    close: () => {
      if (openingKey === null) return
      openingKey = null
      loader.setContext(null)
    },
    start: loader.start,
    continue: loader.continue,
    retry: loader.retry,
  }
}

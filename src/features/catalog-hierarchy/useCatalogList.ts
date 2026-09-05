import {
  createParentGatedListController,
  type ParentGatedListAdapter,
  type ParentGatedListController,
  type ParentGatedListPage,
  type ParentGatedListRequest,
  type ParentGatedListState,
  type ParentGatedListStatus,
} from '../../shared/hierarchy/parentGatedListController'
import type { CatalogListPage, OpaqueCursor } from './catalogHierarchy.types'

export type CatalogListOperation =
  | 'classes'
  | 'families'
  | 'types'
  | 'attributes'
export type CatalogListStatus = ParentGatedListStatus

export type CatalogListRequest = ParentGatedListRequest<
  CatalogListOperation,
  OpaqueCursor
>

export interface CatalogListAdapter<T extends { id: unknown }>
  extends ParentGatedListAdapter<T, CatalogListOperation, OpaqueCursor> {
  load: (request: CatalogListRequest) => Promise<CatalogListPage<T>>
}

export type CatalogListState<T extends { id: unknown }> = ParentGatedListState<
  T,
  CatalogListOperation
>

export interface CatalogListController<T extends { id: unknown }>
  extends ParentGatedListController<T, CatalogListOperation> {
  getState: () => CatalogListState<T>
}

const needsParent = (operation: CatalogListOperation) => operation !== 'classes'

export function createCatalogListSequence<T extends { id: unknown }>(options: {
  operation: CatalogListOperation
  parentId?: unknown
  filters?: Readonly<Record<string, unknown>>
  adapter: CatalogListAdapter<T>
}): CatalogListController<T> {
  return createParentGatedListController({
    ...options,
    requiresParent: needsParent,
  })
}

export const useCatalogList = createCatalogListSequence

export type { ParentGatedListPage }

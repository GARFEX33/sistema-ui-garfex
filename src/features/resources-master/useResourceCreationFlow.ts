import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import {
  createParentGatedListController,
  type ParentGatedListController,
  type ParentGatedListState,
} from '../../shared/hierarchy/parentGatedListController'
import type { SelectorLoadState } from './StagedSearchSelector'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import {
  createInitialCreationState,
  resourceCreationReducer,
  resourceIdKey,
  type NormalizedResourceHierarchyPrefix,
} from './resourceCreation.model'
import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceId,
} from './resourcesMaster.types'

const PAGE_SIZE = 20

const selectorLoadState = <T extends { id: unknown }, TOperation>(
  state: ParentGatedListState<T, TOperation>,
): SelectorLoadState => {
  switch (state.status) {
    case 'initial-loading':
      return { status: 'loading' }
    case 'loading-more':
      return { status: 'loading-more' }
    case 'empty':
      return { status: 'empty' }
    case 'initial-error':
      return { status: 'initial-error' }
    case 'partial-error':
      return { status: 'partial-error' }
    default:
      return { status: 'ready', exhausted: state.isExhausted }
  }
}

const useControllerState = <T extends { id: unknown }, TOperation>(
  controller: ParentGatedListController<T, TOperation>,
) => {
  const snapshotRef = useRef(controller.getState())
  const subscribe = useCallback(
    (listener: () => void) =>
      controller.subscribe(() => {
        snapshotRef.current = controller.getState()
        listener()
      }),
    [controller],
  )
  return useSyncExternalStore(
    subscribe,
    () => snapshotRef.current,
    () => snapshotRef.current,
  )
}

const sameId = (left: unknown, right: ResourceId) =>
  left !== undefined && resourceIdKey(left) === resourceIdKey(right)

export function useResourceCreationFlow(api: ResourcesMasterApi) {
  const [state, dispatch] = useState(createInitialCreationState)
  const [classes] = useState(() =>
    createParentGatedListController<
      ResourceContextClassItem,
      'classes',
      string | null
    >({
      operation: 'classes',
      requiresParent: () => false,
      adapter: {
        load: ({ cursor }) =>
          api.listContextClasses({ cursor, pageSize: PAGE_SIZE }),
      },
    }),
  )
  const [families] = useState(() =>
    createParentGatedListController<
      ResourceContextFamilyItem,
      'families',
      string | null
    >({
      operation: 'families',
      requiresParent: () => true,
      adapter: {
        load: ({ parentId, cursor }) =>
          api.listContextFamilies({
            claseRecursoId: parentId,
            cursor,
            pageSize: PAGE_SIZE,
          }),
      },
    }),
  )
  const classState = useControllerState(classes)
  const familyState = useControllerState(families)

  const begin = useCallback(
    (prefix: NormalizedResourceHierarchyPrefix) => {
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'OPEN', prefix }),
      )
      if (prefix.depth === 0) void classes.start()
      if (prefix.classItem) {
        const current = families.getState()
        if (!sameId(current.parentId, prefix.classItem.id)) {
          families.setContext({
            operation: 'families',
            parentId: prefix.classItem.id,
          })
          void families.start()
        } else if (current.items.length === 0) {
          void families.start()
        }
      }
    },
    [classes, families],
  )
  const enterClass = useCallback(() => {
    dispatch((current) =>
      resourceCreationReducer(current, {
        type: 'NAVIGATE_TO_STAGE',
        stage: { kind: 'class' },
      }),
    )
    if (classes.getState().items.length === 0) void classes.start()
  }, [classes])
  const enterFamily = useCallback(() => {
    dispatch((current) =>
      resourceCreationReducer(current, {
        type: 'NAVIGATE_TO_STAGE',
        stage: { kind: 'family' },
      }),
    )
    if (families.getState().items.length === 0) void families.start()
  }, [families])
  const confirmClass = useCallback(
    (item: ResourceContextClassItem) => {
      const changed = !sameId(state.draft.hierarchy.classItem?.id, item.id)
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'CONFIRM_CLASS', item }),
      )
      if (!changed) return
      families.setContext({ operation: 'families', parentId: item.id })
      void families.start()
    },
    [families, state.draft.hierarchy.classItem?.id],
  )
  const confirmFamily = useCallback((item: ResourceContextFamilyItem) => {
    dispatch((current) =>
      resourceCreationReducer(current, { type: 'CONFIRM_FAMILY', item }),
    )
  }, [])

  return {
    state,
    begin,
    enterClass,
    enterFamily,
    confirmClass,
    confirmFamily,
    classes: classState.items,
    classLoadState: selectorLoadState(classState),
    continueClasses: () => classes.continue(),
    retryClasses: () => classes.retry(),
    families: familyState.items,
    familyLoadState: selectorLoadState(familyState),
    continueFamilies: () => families.continue(),
    retryFamilies: () => families.retry(),
    classKey: resourceIdKey,
  }
}

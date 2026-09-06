import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import {
  createParentGatedListController,
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
import type { ResourceContextClassItem } from './resourcesMaster.types'

const PAGE_SIZE = 20

type ClassListState = ParentGatedListState<ResourceContextClassItem, 'classes'>

const selectorLoadState = (state: ClassListState): SelectorLoadState => {
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
  const snapshotRef = useRef<ClassListState>(classes.getState())
  const subscribe = useCallback(
    (listener: () => void) =>
      classes.subscribe(() => {
        snapshotRef.current = classes.getState()
        listener()
      }),
    [classes],
  )
  const classState = useSyncExternalStore(
    subscribe,
    () => snapshotRef.current,
    () => snapshotRef.current,
  )

  const begin = useCallback(
    (prefix: NormalizedResourceHierarchyPrefix) => {
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'OPEN', prefix }),
      )
      if (prefix.depth === 0) void classes.start()
    },
    [classes],
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
  const confirmClass = useCallback((item: ResourceContextClassItem) => {
    dispatch((current) =>
      resourceCreationReducer(current, { type: 'CONFIRM_CLASS', item }),
    )
  }, [])

  return {
    state,
    begin,
    enterClass,
    confirmClass,
    classes: classState.items,
    classLoadState: selectorLoadState(classState),
    continueClasses: () => classes.continue(),
    retryClasses: () => classes.retry(),
    classKey: resourceIdKey,
  }
}

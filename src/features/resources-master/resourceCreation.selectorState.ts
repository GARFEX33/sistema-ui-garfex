import { useCallback, useRef, useSyncExternalStore } from 'react'
import {
  type ParentGatedListController,
  type ParentGatedListState,
} from '../../shared/hierarchy/parentGatedListController'
import type { SelectorLoadState } from './StagedSearchSelector'
import type {
  UnitCandidateHydrationState,
  UnitPolicyPageState,
} from './resourceCreation.loaders'

export const selectorLoadState = <T extends { id: unknown }, TOperation>(
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

export const useControllerState = <T extends { id: unknown }, TOperation>(
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

export const unitSelectorLoadState = (
  policyState: UnitPolicyPageState,
  hydrationState: UnitCandidateHydrationState,
): SelectorLoadState => {
  if (hydrationState.status === 'partial-error')
    return { status: 'partial-error' }
  if (hydrationState.status === 'loading') return { status: 'loading' }
  if (policyState.status === 'loading') return { status: 'loading' }
  if (policyState.status === 'loading-more') return { status: 'loading-more' }
  if (policyState.status === 'initial-error') return { status: 'initial-error' }
  if (policyState.status === 'partial-error') return { status: 'partial-error' }
  if (hydrationState.status === 'empty')
    return policyState.status === 'ready' && !policyState.exhausted
      ? { status: 'ready', exhausted: false }
      : { status: 'empty' }
  if (policyState.status === 'ready')
    return { status: 'ready', exhausted: policyState.exhausted }
  return { status: 'loading' }
}

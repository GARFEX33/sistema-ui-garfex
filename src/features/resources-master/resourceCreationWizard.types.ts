import type { SelectorLoadState } from './StagedSearchSelector'
import type { WizardSelection, WizardStage } from './resourceCreationWizard.model'
import type {
  ResourceContextClassRestItem,
  ResourceContextFamilyRestItem,
  ResourceContextTypeRestItem,
  ResourceContextUnitRestItem,
} from './resourcesMaster.types'

export type HierarchyWindowState<T> = {
  status: 'waiting-for-parent' | 'loading' | 'ready' | 'empty' | 'error'
  items: T[]
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  error?: unknown
}

export type WizardLevelView<T> = {
  state: HierarchyWindowState<T>
  onLoadMore: () => void
  onRetry: () => void
}

export type WizardHierarchyView = {
  stage: Extract<WizardStage, 'class' | 'family' | 'type' | 'unit'>
  selection: WizardSelection
  classes: WizardLevelView<ResourceContextClassRestItem>
  families: WizardLevelView<ResourceContextFamilyRestItem>
  types: WizardLevelView<ResourceContextTypeRestItem>
  units: WizardLevelView<ResourceContextUnitRestItem>
}

// Maps a REST offset-window level (useResourcesHierarchy.ts /
// useResourceCreationUnits.ts shape) to StagedSearchSelector's
// cursor/accumulate SelectorLoadState.
export function mapHierarchyWindowToSelectorLoadState<T>(
  window: HierarchyWindowState<T>,
): SelectorLoadState {
  switch (window.status) {
    case 'empty':
      return { status: 'empty' }
    case 'ready':
      return { status: 'ready', exhausted: !window.hasNext }
    case 'error':
      return window.offset === 0
        ? { status: 'initial-error' }
        : { status: 'partial-error' }
    case 'loading':
      return window.offset === 0
        ? { status: 'loading' }
        : { status: 'loading-more' }
    default:
      return { status: 'loading' }
  }
}

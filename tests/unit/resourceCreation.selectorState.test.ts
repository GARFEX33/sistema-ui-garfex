import { describe, expect, it } from 'vitest'
import {
  selectorLoadState,
  unitSelectorLoadState,
} from '../../src/features/resources-master/resourceCreation.selectorState'
import type { ParentGatedListState } from '../../src/shared/hierarchy/parentGatedListController'
import type {
  UnitCandidateHydrationState,
  UnitPolicyPageState,
} from '../../src/features/resources-master/resourceCreation.loaders'

const selectorState = (
  status: ParentGatedListState<{ id: string }, 'classes'>['status'],
  isExhausted = false,
): ParentGatedListState<{ id: string }, 'classes'> => ({
  operation: 'classes',
  filters: {},
  items: [],
  status,
  isExhausted,
})

const hydrationState = (
  status: UnitCandidateHydrationState['status'],
): UnitCandidateHydrationState => ({
  status,
  tipoId: 'type-1',
  snapshotSignature: 'snapshot',
  generation: 1,
  candidates: [],
  failedUnitIds: [],
})

describe('resource creation selector state', () => {
  it('maps each parent-gated list loading outcome without changing exhaustion', () => {
    expect(selectorLoadState(selectorState('initial-loading'))).toEqual({
      status: 'loading',
    })
    expect(selectorLoadState(selectorState('loading-more'))).toEqual({
      status: 'loading-more',
    })
    expect(selectorLoadState(selectorState('empty'))).toEqual({
      status: 'empty',
    })
    expect(selectorLoadState(selectorState('initial-error'))).toEqual({
      status: 'initial-error',
    })
    expect(selectorLoadState(selectorState('partial-error'))).toEqual({
      status: 'partial-error',
    })
    expect(selectorLoadState(selectorState('ready', true))).toEqual({
      status: 'ready',
      exhausted: true,
    })
  })

  it('keeps hydration errors dominant and distinguishes a pending page from exhausted empty units', () => {
    const readyWithMore: UnitPolicyPageState = {
      status: 'ready',
      tipoId: 'type-1',
      references: [],
      cursor: 'next',
      exhausted: false,
    }
    const readyExhausted: UnitPolicyPageState = {
      ...readyWithMore,
      cursor: null,
      exhausted: true,
    }

    expect(
      unitSelectorLoadState(readyWithMore, hydrationState('partial-error')),
    ).toEqual({ status: 'partial-error' })
    expect(
      unitSelectorLoadState(readyWithMore, hydrationState('empty')),
    ).toEqual({
      status: 'ready',
      exhausted: false,
    })
    expect(
      unitSelectorLoadState(readyExhausted, hydrationState('empty')),
    ).toEqual({ status: 'empty' })
  })
})

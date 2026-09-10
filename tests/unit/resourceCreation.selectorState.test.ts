import { describe, expect, it } from 'vitest'
import {
  selectorLoadState,
  unitSelectorLoadState,
} from '../../src/features/resources-master/resourceCreation.selectorState'
import type { ActiveUnitPageState } from '../../src/features/resources-master/resourceCreation.activeUnits'
import type { ParentGatedListState } from '../../src/shared/hierarchy/parentGatedListController'

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

const unitState = (state: ActiveUnitPageState): ActiveUnitPageState => state

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

  it('maps one ACTIVE Unit page state through loading, errors, pagination, and empty', () => {
    expect(
      unitSelectorLoadState(
        unitState({ status: 'idle', contextKey: null, candidates: [] }),
      ),
    ).toEqual({ status: 'loading' })
    expect(
      unitSelectorLoadState(
        unitState({
          status: 'loading-more',
          contextKey: 'open',
          candidates: [],
        }),
      ),
    ).toEqual({ status: 'loading-more' })
    expect(
      unitSelectorLoadState(
        unitState({
          status: 'partial-error',
          contextKey: 'open',
          candidates: [],
          retry: 'continuation',
          error: new Error('offline'),
        }),
      ),
    ).toEqual({ status: 'partial-error' })
    expect(
      unitSelectorLoadState(
        unitState({
          status: 'ready',
          contextKey: 'open',
          candidates: [],
          cursor: null,
          exhausted: false,
        }),
      ),
    ).toEqual({ status: 'ready', exhausted: false })
    expect(
      unitSelectorLoadState(
        unitState({
          status: 'empty',
          contextKey: 'open',
          candidates: [],
          exhausted: true,
        }),
      ),
    ).toEqual({ status: 'empty' })
  })
})

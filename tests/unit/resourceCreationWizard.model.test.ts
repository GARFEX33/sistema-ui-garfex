import { describe, expect, it } from 'vitest'
import {
  createInitialWizardState,
  resourceCreationWizardReducer as reduce,
  type WizardState,
} from '../../src/features/resources-master/resourceCreationWizard.model'

describe('resourceCreationWizardReducer', () => {
  it('advances class -> family -> type -> unit -> attributes -> review', () => {
    let state = createInitialWizardState()
    expect(state.stage).toBe('class')

    state = reduce(state, { type: 'CONFIRM_CLASS', classId: 'class-1' })
    expect(state).toEqual({
      stage: 'family',
      selection: {
        classId: 'class-1',
        familyId: null,
        typeId: null,
        unitId: null,
      },
    })

    state = reduce(state, { type: 'CONFIRM_FAMILY', familyId: 'family-1' })
    expect(state.stage).toBe('type')
    expect(state.selection.familyId).toBe('family-1')

    state = reduce(state, { type: 'CONFIRM_TYPE', typeId: 'type-1' })
    expect(state.stage).toBe('unit')
    expect(state.selection.typeId).toBe('type-1')

    state = reduce(state, { type: 'CONFIRM_UNIT', unitId: 'unit-1' })
    expect(state.stage).toBe('attributes')
    expect(state.selection.unitId).toBe('unit-1')

    state = reduce(state, { type: 'CONFIRM_ATTRIBUTES' })
    expect(state.stage).toBe('review')
  })

  it('does not skip stages: CONFIRM_TYPE is ignored while at the class stage', () => {
    const state = createInitialWizardState()
    const next = reduce(state, { type: 'CONFIRM_TYPE', typeId: 'type-1' })
    expect(next).toBe(state)
  })

  it('does not advance past attributes without CONFIRM_ATTRIBUTES', () => {
    const state: WizardState = {
      stage: 'attributes',
      selection: {
        classId: 'class-1',
        familyId: 'family-1',
        typeId: 'type-1',
        unitId: 'unit-1',
      },
    }
    expect(reduce(state, { type: 'BACK' }).stage).toBe('unit')
  })

  it('BACK goes to the previous stage without clearing the confirmed selection', () => {
    let state = createInitialWizardState()
    state = reduce(state, { type: 'CONFIRM_CLASS', classId: 'class-1' })
    state = reduce(state, { type: 'CONFIRM_FAMILY', familyId: 'family-1' })
    state = reduce(state, { type: 'CONFIRM_TYPE', typeId: 'type-1' })
    state = reduce(state, { type: 'CONFIRM_UNIT', unitId: 'unit-1' })

    state = reduce(state, { type: 'BACK' })
    expect(state.stage).toBe('unit')
    expect(state.selection.unitId).toBe('unit-1')

    state = reduce(state, { type: 'BACK' })
    state = reduce(state, { type: 'BACK' })
    expect(state.stage).toBe('family')
    expect(state.selection).toEqual({
      classId: 'class-1',
      familyId: 'family-1',
      typeId: 'type-1',
      unitId: 'unit-1',
    })

    state = reduce(state, {
      type: 'CONFIRM_FAMILY',
      familyId: 'family-1',
    })
    expect(state.stage).toBe('type')
    expect(state.selection.typeId).toBe('type-1')
  })

  it('BACK at the first stage is a no-op', () => {
    const state = createInitialWizardState()
    expect(reduce(state, { type: 'BACK' })).toBe(state)
  })

  it('confirming a different parent clears downstream selections', () => {
    let state = createInitialWizardState()
    state = reduce(state, { type: 'CONFIRM_CLASS', classId: 'class-1' })
    state = reduce(state, { type: 'CONFIRM_FAMILY', familyId: 'family-1' })
    state = reduce(state, { type: 'BACK' })
    state = reduce(state, { type: 'BACK' })

    state = reduce(state, { type: 'CONFIRM_CLASS', classId: 'class-2' })
    expect(state.selection).toEqual({
      classId: 'class-2',
      familyId: null,
      typeId: null,
      unitId: null,
    })
  })
})

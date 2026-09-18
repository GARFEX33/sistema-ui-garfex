// Stage progression for the REST resource-creation wizard. Deliberately
// small: unlike the legacy resourceCreation.model.ts this holds no
// selectionBuckets/evaluation/fingerprint machinery — attributes/review
// payload shapes belong to Slice C2b/C2c.

export type WizardStage =
  | 'class'
  | 'family'
  | 'type'
  | 'unit'
  | 'attributes'
  | 'review'

export type WizardSelection = Readonly<{
  classId: string | null
  familyId: string | null
  typeId: string | null
  unitId: string | null
}>

export type WizardState = Readonly<{
  stage: WizardStage
  selection: WizardSelection
}>

export type WizardEvent =
  | { type: 'CONFIRM_CLASS'; classId: string }
  | { type: 'CONFIRM_FAMILY'; familyId: string }
  | { type: 'CONFIRM_TYPE'; typeId: string }
  | { type: 'CONFIRM_UNIT'; unitId: string }
  | { type: 'CONFIRM_ATTRIBUTES' }
  | { type: 'BACK' }

export const createInitialWizardState = (): WizardState => ({
  stage: 'class',
  selection: { classId: null, familyId: null, typeId: null, unitId: null },
})

const backStage = (stage: WizardStage): WizardStage => {
  switch (stage) {
    case 'review':
      return 'attributes'
    case 'attributes':
      return 'unit'
    case 'unit':
      return 'type'
    case 'type':
      return 'family'
    case 'family':
      return 'class'
    default:
      return stage
  }
}

export const resourceCreationWizardReducer = (
  state: WizardState,
  event: WizardEvent,
): WizardState => {
  if (event.type === 'BACK') {
    const stage = backStage(state.stage)
    return stage === state.stage ? state : { ...state, stage }
  }

  if (event.type === 'CONFIRM_CLASS') {
    if (state.stage !== 'class') return state
    const changed = state.selection.classId !== event.classId
    return {
      stage: 'family',
      selection: changed
        ? {
            classId: event.classId,
            familyId: null,
            typeId: null,
            unitId: null,
          }
        : state.selection,
    }
  }

  if (event.type === 'CONFIRM_FAMILY') {
    if (state.stage !== 'family') return state
    const changed = state.selection.familyId !== event.familyId
    return {
      stage: 'type',
      selection: changed
        ? {
            ...state.selection,
            familyId: event.familyId,
            typeId: null,
            unitId: null,
          }
        : state.selection,
    }
  }

  if (event.type === 'CONFIRM_TYPE') {
    if (state.stage !== 'type') return state
    const changed = state.selection.typeId !== event.typeId
    return {
      stage: 'unit',
      selection: changed
        ? { ...state.selection, typeId: event.typeId, unitId: null }
        : state.selection,
    }
  }

  if (event.type === 'CONFIRM_UNIT') {
    if (state.stage !== 'unit') return state
    return {
      stage: 'attributes',
      selection: { ...state.selection, unitId: event.unitId },
    }
  }

  if (state.stage !== 'attributes') return state
  return { ...state, stage: 'review' }
}

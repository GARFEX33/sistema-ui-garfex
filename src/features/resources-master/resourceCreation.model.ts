import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceCreationEvaluation,
  ResourceId,
} from './resourcesMaster.types'
import type {
  ResourceCreationEvaluationOwnershipIdentity,
  ResourceCreationEvaluationRequestToken,
} from './resourceCreation.evaluationLease'
import type { AllowedValueId } from './resourceCreation.attributeSequence'
import {
  confirmSelection,
  createSelectionBuckets,
  omitSelection,
  restoreSelection,
  type AssignmentKey,
  type SelectionBuckets,
} from './resourceCreation.selectionDraft'

export type InitialResourceHierarchySnapshot = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
}>

export type NormalizedResourceHierarchyPrefix = Readonly<{
  classItem: ResourceContextClassItem | null
  familyItem: ResourceContextFamilyItem | null
  typeItem: ResourceContextTypeItem | null
  depth: 0 | 1 | 2 | 3
}>

export type ResourceHierarchySelection = Readonly<{
  classId?: ResourceId
  familyId?: ResourceId
  typeId?: ResourceId
}>

export type ResourceHierarchyItems = Readonly<{
  classes: readonly ResourceContextClassItem[]
  families: readonly ResourceContextFamilyItem[]
  types: readonly ResourceContextTypeItem[]
}>

export const resourceIdKey = (id: ResourceId) => String(id)

const selectedItem = <T extends { id: ResourceId }>(
  selectedId: ResourceId | undefined,
  items: readonly T[],
): T | null =>
  selectedId === undefined
    ? null
    : (items.find(
        (item) => resourceIdKey(item.id) === resourceIdKey(selectedId),
      ) ?? null)

export const deriveInitialHierarchySnapshot = (
  selection: ResourceHierarchySelection,
  items: ResourceHierarchyItems,
): InitialResourceHierarchySnapshot => ({
  classItem: selectedItem(selection.classId, items.classes),
  familyItem: selectedItem(selection.familyId, items.families),
  typeItem: selectedItem(selection.typeId, items.types),
})

export const createInitialHierarchySnapshotCapture = (
  initialSnapshot: InitialResourceHierarchySnapshot | undefined,
) => {
  let latestSnapshot = initialSnapshot
  let capturedSnapshot: NormalizedResourceHierarchyPrefix | null = null

  return {
    receive(snapshot: InitialResourceHierarchySnapshot | undefined) {
      latestSnapshot = snapshot
    },
    captureOnOpen() {
      capturedSnapshot = normalizeInitialHierarchySnapshot(
        latestSnapshot ?? emptySnapshot,
      )
      return capturedSnapshot
    },
    captured() {
      return capturedSnapshot
    },
  }
}

const emptySnapshot: InitialResourceHierarchySnapshot = {
  classItem: null,
  familyItem: null,
  typeItem: null,
}

export const normalizeInitialHierarchySnapshot = (
  snapshot: InitialResourceHierarchySnapshot,
): NormalizedResourceHierarchyPrefix => {
  if (!snapshot.classItem)
    return { classItem: null, familyItem: null, typeItem: null, depth: 0 }

  if (
    !snapshot.familyItem ||
    resourceIdKey(snapshot.familyItem.claseRecursoId) !==
      resourceIdKey(snapshot.classItem.id)
  ) {
    return {
      classItem: snapshot.classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    }
  }

  if (
    !snapshot.typeItem ||
    resourceIdKey(snapshot.typeItem.familiaRecursoId) !==
      resourceIdKey(snapshot.familyItem.id)
  ) {
    return {
      classItem: snapshot.classItem,
      familyItem: snapshot.familyItem,
      typeItem: null,
      depth: 2,
    }
  }

  return {
    classItem: snapshot.classItem,
    familyItem: snapshot.familyItem,
    typeItem: snapshot.typeItem,
    depth: 3,
  }
}

export type CreationStage =
  | { kind: 'class' }
  | { kind: 'family' }
  | { kind: 'type' }
  | { kind: 'unit' }
  | { kind: 'attributes' }
  | { kind: 'review-pending' }

export type CreationNavigationStage =
  | { kind: 'class' }
  | { kind: 'family' }
  | { kind: 'type' }
  | { kind: 'unit' }
  | { kind: 'attributes' }

export type CreationDraft = Readonly<{
  hierarchy: InitialResourceHierarchySnapshot
  unitId: ResourceId | null
  selectionBuckets: SelectionBuckets<AllowedValueId>
  authoritativeEvaluation: ResourceCreationEvaluation | null
  catalogFingerprint: string | null
  revision: number
}>

export type CreationState = Readonly<{
  draft: CreationDraft
  stage: CreationStage
  openGeneration: number
  evaluationRequestToken: ResourceCreationEvaluationRequestToken | null
  evaluationOwnershipIdentity: ResourceCreationEvaluationOwnershipIdentity | null
}>

export type CreationEvent =
  | { type: 'OPEN'; prefix: NormalizedResourceHierarchyPrefix }
  | { type: 'CONFIRM_CLASS'; item: ResourceContextClassItem }
  | { type: 'CONFIRM_FAMILY'; item: ResourceContextFamilyItem }
  | { type: 'CONFIRM_TYPE'; item: ResourceContextTypeItem }
  | { type: 'CONFIRM_UNIT'; unitId: ResourceId }
  | {
      type: 'CONFIRM_ALLOWED_VALUE_SELECTION'
      assignmentId: AssignmentKey
      allowedValueId: AllowedValueId
    }
  | { type: 'OMIT_ALLOWED_VALUE_ASSIGNMENT'; assignmentId: AssignmentKey }
  | {
      type: 'RECONCILE_ALLOWED_VALUE_SELECTIONS'
      selectionBuckets: SelectionBuckets<AllowedValueId>
    }
  | {
      type: 'RESTORE_ALLOWED_VALUE_SELECTION'
      assignmentId: AssignmentKey
      allowedValueId: AllowedValueId
    }
  | {
      type: 'ADOPT_CREATE_EVALUATION'
      expectedCatalogFingerprint: string
      evaluation: ResourceCreationEvaluation
      selectionBuckets: SelectionBuckets<AllowedValueId>
    }
  | { type: 'COMPLETE_ATTRIBUTES' }
  | { type: 'NAVIGATE_TO_STAGE'; stage: CreationNavigationStage }
  | { type: 'BACK' }

const emptyDraft = (): CreationDraft => ({
  hierarchy: emptySnapshot,
  unitId: null,
  selectionBuckets: createSelectionBuckets<AllowedValueId>(),
  authoritativeEvaluation: null,
  catalogFingerprint: null,
  revision: 0,
})

export const createInitialCreationState = (): CreationState => ({
  draft: emptyDraft(),
  stage: { kind: 'class' },
  openGeneration: 0,
  evaluationRequestToken: null,
  evaluationOwnershipIdentity: null,
})

const firstMissingStage = (
  prefix: NormalizedResourceHierarchyPrefix,
): CreationStage => {
  if (prefix.depth === 0) return { kind: 'class' }
  if (prefix.depth === 1) return { kind: 'family' }
  if (prefix.depth === 2) return { kind: 'type' }
  return { kind: 'unit' }
}

const hierarchyFromPrefix = (
  prefix: NormalizedResourceHierarchyPrefix,
): InitialResourceHierarchySnapshot => ({
  classItem: prefix.classItem,
  familyItem: prefix.familyItem,
  typeItem: prefix.typeItem,
})

export const clearResourceCreationEvaluationAuthority = (
  state: CreationState,
): CreationState =>
  state.evaluationRequestToken === null &&
  state.evaluationOwnershipIdentity === null &&
  state.draft.authoritativeEvaluation === null &&
  state.draft.catalogFingerprint === null
    ? state
    : {
        ...state,
        draft: {
          ...state.draft,
          authoritativeEvaluation: null,
          catalogFingerprint: null,
        },
        evaluationRequestToken: null,
        evaluationOwnershipIdentity: null,
      }

const invalidateDraft = (
  state: CreationState,
  draft: CreationDraft,
): CreationState =>
  draft === state.draft
    ? state
    : {
        ...state,
        draft: {
          ...draft,
          authoritativeEvaluation: null,
          catalogFingerprint: null,
          revision: state.draft.revision + 1,
        },
        evaluationRequestToken: null,
        evaluationOwnershipIdentity: null,
      }

export const replaceSelectionBuckets = (
  state: CreationState,
  selectionBuckets: SelectionBuckets<AllowedValueId>,
): CreationState =>
  selectionBuckets === state.draft.selectionBuckets
    ? state
    : invalidateDraft(state, { ...state.draft, selectionBuckets })

const clearDependentPlaceholders = (
  state: CreationState,
  hierarchy: InitialResourceHierarchySnapshot,
): CreationState => {
  const invalidated = replaceSelectionBuckets(
    state,
    createSelectionBuckets<AllowedValueId>(),
  )

  return {
    ...invalidated,
    draft: { ...invalidated.draft, hierarchy, unitId: null },
  }
}

const hasSameId = (
  current: { id: ResourceId } | null,
  next: { id: ResourceId },
) => current !== null && resourceIdKey(current.id) === resourceIdKey(next.id)

const hasSelection = <TSelection>(
  selections: Readonly<Record<AssignmentKey, TSelection>>,
  assignmentId: AssignmentKey,
) => Object.prototype.hasOwnProperty.call(selections, assignmentId)

export const isResourceCreationCompletionAuthoritative = (
  evaluation: ResourceCreationEvaluation | null,
  selectionBuckets: SelectionBuckets<AllowedValueId>,
) => {
  if (evaluation?.status !== 'VALID' || !evaluation.valid) return false

  return evaluation.asignaciones.every((assignment) => {
    if (
      assignment.aplicabilidadResuelta !== 'REQUIRED' &&
      assignment.aplicabilidadResuelta !== 'OPTIONAL'
    )
      return true

    if (hasSelection(selectionBuckets.active, assignment.asignacionAtributoId))
      return true

    return (
      assignment.aplicabilidadResuelta === 'OPTIONAL' &&
      selectionBuckets.omitted.has(assignment.asignacionAtributoId)
    )
  })
}

const backStage = (stage: CreationStage): CreationStage => {
  if (stage.kind === 'review-pending') return { kind: 'attributes' }
  if (stage.kind === 'attributes') return { kind: 'unit' }
  if (stage.kind === 'unit') return { kind: 'type' }
  if (stage.kind === 'type') return { kind: 'family' }
  if (stage.kind === 'family') return { kind: 'class' }
  return stage
}

export const resourceCreationReducer = (
  state: CreationState,
  event: CreationEvent,
): CreationState => {
  const { draft } = state

  if (event.type === 'OPEN')
    return {
      draft: { ...emptyDraft(), hierarchy: hierarchyFromPrefix(event.prefix) },
      stage: firstMissingStage(event.prefix),
      openGeneration: state.openGeneration + 1,
      evaluationRequestToken: null,
      evaluationOwnershipIdentity: null,
    }

  if (event.type === 'NAVIGATE_TO_STAGE')
    return { ...state, stage: event.stage }
  if (event.type === 'BACK') return { ...state, stage: backStage(state.stage) }
  if (event.type === 'COMPLETE_ATTRIBUTES')
    return state.stage.kind === 'attributes' &&
      isResourceCreationCompletionAuthoritative(
        draft.authoritativeEvaluation,
        draft.selectionBuckets,
      )
      ? { ...state, stage: { kind: 'review-pending' } }
      : state

  if (event.type === 'ADOPT_CREATE_EVALUATION') {
    const currentEvaluation = draft.authoritativeEvaluation
    const currentFingerprint = draft.catalogFingerprint
    if (
      state.stage.kind !== 'review-pending' ||
      currentEvaluation?.status !== 'VALID' ||
      !currentEvaluation.valid ||
      !currentFingerprint ||
      currentFingerprint.trim().length === 0 ||
      currentFingerprint !== event.expectedCatalogFingerprint ||
      currentEvaluation.catalogFingerprint !== event.expectedCatalogFingerprint
    )
      return state

    return {
      ...state,
      draft: {
        ...draft,
        selectionBuckets: event.selectionBuckets,
        authoritativeEvaluation: event.evaluation,
        catalogFingerprint: event.evaluation.catalogFingerprint,
        revision: draft.revision + 1,
      },
      stage: { kind: 'attributes' },
    }
  }

  if (event.type === 'CONFIRM_CLASS') {
    const nextState = hasSameId(draft.hierarchy.classItem, event.item)
      ? state
      : clearDependentPlaceholders(state, {
          classItem: event.item,
          familyItem: null,
          typeItem: null,
        })
    return { ...nextState, stage: { kind: 'family' } }
  }

  if (event.type === 'CONFIRM_UNIT') {
    const nextState =
      draft.unitId !== null &&
      resourceIdKey(draft.unitId) === resourceIdKey(event.unitId)
        ? state
        : invalidateDraft(state, { ...draft, unitId: event.unitId })
    return { ...nextState, stage: { kind: 'attributes' } }
  }

  if (event.type === 'CONFIRM_ALLOWED_VALUE_SELECTION')
    return replaceSelectionBuckets(
      state,
      confirmSelection(
        draft.selectionBuckets,
        event.assignmentId,
        event.allowedValueId,
      ),
    )

  if (event.type === 'OMIT_ALLOWED_VALUE_ASSIGNMENT')
    return replaceSelectionBuckets(
      state,
      omitSelection(draft.selectionBuckets, event.assignmentId),
    )

  if (event.type === 'RECONCILE_ALLOWED_VALUE_SELECTIONS')
    return replaceSelectionBuckets(state, event.selectionBuckets)

  if (event.type === 'RESTORE_ALLOWED_VALUE_SELECTION')
    return replaceSelectionBuckets(
      state,
      restoreSelection(
        draft.selectionBuckets,
        event.assignmentId,
        event.allowedValueId,
      ),
    )

  if (event.type === 'CONFIRM_FAMILY') {
    const nextState = hasSameId(draft.hierarchy.familyItem, event.item)
      ? state
      : clearDependentPlaceholders(state, {
          ...draft.hierarchy,
          familyItem: event.item,
          typeItem: null,
        })
    return { ...nextState, stage: { kind: 'type' } }
  }

  const nextState = hasSameId(draft.hierarchy.typeItem, event.item)
    ? state
    : clearDependentPlaceholders(state, {
        ...draft.hierarchy,
        typeItem: event.item,
      })
  return { ...nextState, stage: { kind: 'unit' } }
}

import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceId,
  ResourceSummary,
} from './resourcesMaster.types'

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
  | { kind: 'contract-pending'; blockedCapability: 'attributes-v1' }
  | { kind: 'attribute'; attributeId: string; index: number }
  | { kind: 'resource-data' }
  | { kind: 'review' }
  | { kind: 'result'; outcome: 'created' | 'uncertain' }

export type CreationDraft = Readonly<{
  hierarchy: InitialResourceHierarchySnapshot
  unitId: ResourceId | null
  attributeIds: readonly ResourceId[]
  attributeValues: Readonly<Record<string, string>>
  omittedAttributeIds: ReadonlySet<string>
  authoritativeEvaluation: null
  catalogFingerprint: null
  nombre: string
  descripcion: string
  revision: number
}>

export type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting'; draftRevision: number }
  | { status: 'known-error'; message: string }
  | { status: 'created'; item: ResourceSummary }
  | { status: 'uncertain'; message: string; blockedRevision: number }

export type CreationState = Readonly<{
  draft: CreationDraft
  stage: CreationStage
  submit: SubmitState
}>

export type CreationEvent =
  | { type: 'OPEN'; prefix: NormalizedResourceHierarchyPrefix }
  | { type: 'CONFIRM_CLASS'; item: ResourceContextClassItem }
  | { type: 'CONFIRM_FAMILY'; item: ResourceContextFamilyItem }
  | { type: 'CONFIRM_TYPE'; item: ResourceContextTypeItem }
  | { type: 'CONFIRM_UNIT'; unitId: ResourceId }
  | { type: 'SET_ATTRIBUTE_VALUE'; attributeId: string; value: string }
  | { type: 'OMIT_ATTRIBUTE'; attributeId: string }
  | { type: 'SET_RESOURCE_DATA'; nombre: string; descripcion: string }
  | { type: 'CONFIRM_RESOURCE_DATA' }
  | { type: 'SUBMIT_STARTED' }
  | { type: 'SUBMIT_KNOWN_ERROR'; message: string }
  | { type: 'SUBMIT_CREATED'; item: ResourceSummary }
  | { type: 'SUBMIT_UNCERTAIN'; message: string }
  | { type: 'NAVIGATE_TO_STAGE'; stage: CreationStage }
  | { type: 'BACK' }

const emptyDraft = (): CreationDraft => ({
  hierarchy: emptySnapshot,
  unitId: null,
  attributeIds: [],
  attributeValues: {},
  omittedAttributeIds: new Set(),
  authoritativeEvaluation: null,
  catalogFingerprint: null,
  nombre: '',
  descripcion: '',
  revision: 0,
})

export const createInitialCreationState = (): CreationState => ({
  draft: emptyDraft(),
  stage: { kind: 'class' },
  submit: { status: 'idle' },
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

const clearDependentPlaceholders = (
  draft: CreationDraft,
  hierarchy: InitialResourceHierarchySnapshot,
): CreationDraft => ({
  ...draft,
  hierarchy,
  unitId: null,
  attributeIds: [],
  attributeValues: {},
  omittedAttributeIds: new Set(),
  revision: draft.revision + 1,
})

const hasSameId = (
  current: { id: ResourceId } | null,
  next: { id: ResourceId },
) => current !== null && resourceIdKey(current.id) === resourceIdKey(next.id)

const backStage = (stage: CreationStage): CreationStage => {
  if (stage.kind === 'family') return { kind: 'class' }
  if (stage.kind === 'type') return { kind: 'family' }
  if (stage.kind === 'unit') return { kind: 'type' }
  if (stage.kind === 'contract-pending') return { kind: 'unit' }
  if (stage.kind === 'resource-data') return { kind: 'unit' }
  if (stage.kind === 'review') return { kind: 'resource-data' }
  if (stage.kind === 'result' && stage.outcome === 'uncertain')
    return { kind: 'review' }
  return stage
}

export const isResourceDataValid = (draft: CreationDraft) =>
  draft.nombre.trim().length > 0

export const canSubmitResourceCreation = (state: CreationState) => {
  if (!isResourceDataValid(state.draft) || state.submit.status === 'submitting')
    return false
  if (state.submit.status === 'created') return false
  return (
    state.submit.status !== 'uncertain' ||
    state.draft.revision > state.submit.blockedRevision
  )
}

const withDraft = (
  state: CreationState,
  draft: CreationDraft,
): CreationState => (draft === state.draft ? state : { ...state, draft })

const setAttributeValue = (
  draft: CreationDraft,
  attributeId: string,
  value: string,
): CreationDraft => {
  const wasOmitted = draft.omittedAttributeIds.has(attributeId)
  if (draft.attributeValues[attributeId] === value && !wasOmitted) return draft

  const omittedAttributeIds = new Set(draft.omittedAttributeIds)
  omittedAttributeIds.delete(attributeId)
  return {
    ...draft,
    attributeValues: { ...draft.attributeValues, [attributeId]: value },
    omittedAttributeIds,
    revision: draft.revision + 1,
  }
}

const omitAttribute = (
  draft: CreationDraft,
  attributeId: string,
): CreationDraft => {
  const hasValue = attributeId in draft.attributeValues
  if (!hasValue && draft.omittedAttributeIds.has(attributeId)) return draft

  const attributeValues = { ...draft.attributeValues }
  delete attributeValues[attributeId]
  return {
    ...draft,
    attributeValues,
    omittedAttributeIds: new Set([...draft.omittedAttributeIds, attributeId]),
    revision: draft.revision + 1,
  }
}

const setResourceData = (
  draft: CreationDraft,
  nombre: string,
  descripcion: string,
): CreationDraft =>
  draft.nombre === nombre && draft.descripcion === descripcion
    ? draft
    : { ...draft, nombre, descripcion, revision: draft.revision + 1 }

export const resourceCreationReducer = (
  state: CreationState,
  event: CreationEvent,
): CreationState => {
  const { draft } = state

  if (event.type === 'OPEN')
    return {
      draft: { ...emptyDraft(), hierarchy: hierarchyFromPrefix(event.prefix) },
      stage: firstMissingStage(event.prefix),
      submit: { status: 'idle' },
    }

  if (event.type === 'NAVIGATE_TO_STAGE')
    return { ...state, stage: event.stage }
  if (event.type === 'BACK') return { ...state, stage: backStage(state.stage) }
  if (event.type === 'SET_ATTRIBUTE_VALUE')
    return withDraft(
      state,
      setAttributeValue(draft, event.attributeId, event.value),
    )
  if (event.type === 'OMIT_ATTRIBUTE')
    return withDraft(state, omitAttribute(draft, event.attributeId))
  if (event.type === 'SET_RESOURCE_DATA')
    return withDraft(
      state,
      setResourceData(draft, event.nombre, event.descripcion),
    )
  if (event.type === 'CONFIRM_RESOURCE_DATA')
    return isResourceDataValid(draft)
      ? { ...state, stage: { kind: 'review' } }
      : state
  if (event.type === 'SUBMIT_STARTED')
    return canSubmitResourceCreation(state)
      ? {
          ...state,
          submit: { status: 'submitting', draftRevision: draft.revision },
        }
      : state
  if (event.type === 'SUBMIT_KNOWN_ERROR')
    return state.submit.status === 'submitting'
      ? { ...state, submit: { status: 'known-error', message: event.message } }
      : state
  if (event.type === 'SUBMIT_CREATED')
    return state.submit.status === 'submitting'
      ? {
          ...state,
          stage: { kind: 'result', outcome: 'created' },
          submit: { status: 'created', item: event.item },
        }
      : state
  if (event.type === 'SUBMIT_UNCERTAIN')
    return state.submit.status === 'submitting'
      ? {
          ...state,
          stage: { kind: 'result', outcome: 'uncertain' },
          submit: {
            status: 'uncertain',
            message: event.message,
            blockedRevision: state.submit.draftRevision,
          },
        }
      : state

  if (event.type === 'CONFIRM_CLASS') {
    const nextDraft = hasSameId(draft.hierarchy.classItem, event.item)
      ? draft
      : clearDependentPlaceholders(draft, {
          classItem: event.item,
          familyItem: null,
          typeItem: null,
        })
    return { ...state, draft: nextDraft, stage: { kind: 'family' } }
  }

  if (event.type === 'CONFIRM_UNIT') {
    const nextDraft =
      draft.unitId !== null &&
      resourceIdKey(draft.unitId) === resourceIdKey(event.unitId)
        ? draft
        : {
            ...draft,
            unitId: event.unitId,
            authoritativeEvaluation: null,
            catalogFingerprint: null,
            revision: draft.revision + 1,
          }
    return {
      ...state,
      draft: nextDraft,
      stage: { kind: 'contract-pending', blockedCapability: 'attributes-v1' },
    }
  }

  if (event.type === 'CONFIRM_FAMILY') {
    const nextDraft = hasSameId(draft.hierarchy.familyItem, event.item)
      ? draft
      : clearDependentPlaceholders(draft, {
          ...draft.hierarchy,
          familyItem: event.item,
          typeItem: null,
        })
    return { ...state, draft: nextDraft, stage: { kind: 'type' } }
  }

  const nextDraft = hasSameId(draft.hierarchy.typeItem, event.item)
    ? draft
    : clearDependentPlaceholders(draft, {
        ...draft.hierarchy,
        typeItem: event.item,
      })
  return { ...state, draft: nextDraft, stage: { kind: 'unit' } }
}

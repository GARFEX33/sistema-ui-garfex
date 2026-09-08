import { describe, expect, it } from 'vitest'
import {
  createInitialCreationState,
  createInitialHierarchySnapshotCapture,
  deriveInitialHierarchySnapshot,
  normalizeInitialHierarchySnapshot,
  resourceCreationReducer,
  resourceIdKey,
} from '../../src/features/resources-master/resourceCreation.model'

const classItem = {
  id: 'class-1',
  clave: 'MATERIAL',
  nombre: 'Material',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}

const familyItem = {
  id: 'family-1',
  claseRecursoId: 'class-1',
  clave: 'CABLE',
  nombre: 'Cable',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}

const typeItem = {
  id: 'type-1',
  familiaRecursoId: 'family-1',
  clave: 'UTP',
  nombre: 'UTP',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  aggregateStatus: 'CLEAN',
  violations: [],
}

const items = {
  classes: [classItem],
  families: [familyItem],
  types: [typeItem],
}

describe('resource creation hierarchy snapshots', () => {
  it('derives only loaded selected items and normalizes the complete prefix', () => {
    const snapshot = deriveInitialHierarchySnapshot(
      { classId: 'class-1', familyId: 'family-1', typeId: 'type-1' },
      items,
    )

    expect(resourceIdKey({ opaque: 'id' })).toBe('[object Object]')
    expect(normalizeInitialHierarchySnapshot(snapshot)).toEqual({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })
  })

  it.each([
    [0, {}],
    [1, { classId: 'class-1' }],
    [2, { classId: 'class-1', familyId: 'family-1' }],
  ] as const)(
    'preserves depth %i only when every selected item is still loaded',
    (depth, selection) => {
      const snapshot = deriveInitialHierarchySnapshot(selection, items)

      expect(normalizeInitialHierarchySnapshot(snapshot).depth).toBe(depth)
    },
  )

  it('captures the latest closed snapshot once and does not reseed an open draft', () => {
    const capture = createInitialHierarchySnapshotCapture({
      classItem,
      familyItem: null,
      typeItem: null,
    })
    capture.receive({ classItem, familyItem, typeItem })

    expect(capture.captureOnOpen()).toMatchObject({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })

    capture.receive({ classItem: null, familyItem: null, typeItem: null })
    expect(capture.captured()).toMatchObject({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })
    expect(capture.captureOnOpen()).toMatchObject({ depth: 0 })
  })

  it('drops absent, cross-parent, and stale descendants instead of recovering them', () => {
    const absent = deriveInitialHierarchySnapshot(
      { classId: 'class-1', familyId: 'missing', typeId: 'type-1' },
      items,
    )
    const crossed = normalizeInitialHierarchySnapshot({
      classItem,
      familyItem: { ...familyItem, claseRecursoId: 'other-class' },
      typeItem,
    })
    const stale = normalizeInitialHierarchySnapshot({
      classItem,
      familyItem,
      typeItem: { ...typeItem, familiaRecursoId: 'other-family' },
    })

    expect(normalizeInitialHierarchySnapshot(absent)).toEqual({
      classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    })
    expect(crossed).toMatchObject({
      classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    })
    expect(stale).toMatchObject({
      classItem,
      familyItem,
      typeItem: null,
      depth: 2,
    })
  })
})

const open = (
  prefix = normalizeInitialHierarchySnapshot({
    classItem,
    familyItem,
    typeItem,
  }),
) =>
  resourceCreationReducer(createInitialCreationState(), {
    type: 'OPEN',
    prefix,
  })

const populatedDraft = () => {
  const state = open()

  return {
    ...state,
    draft: {
      ...state.draft,
      unitId: 'unit-1',
      revision: 4,
    },
  }
}

describe('resource creation navigation and hierarchy cascades', () => {
  it.each([
    [{ classItem: null, familyItem: null, typeItem: null }, 'class'],
    [{ classItem, familyItem: null, typeItem: null }, 'family'],
    [{ classItem, familyItem, typeItem: null }, 'type'],
    [{ classItem, familyItem, typeItem }, 'unit'],
  ] as const)('opens at the first missing %s stage', (snapshot, stage) => {
    expect(open(normalizeInitialHierarchySnapshot(snapshot)).stage).toEqual({
      kind: stage,
    })
  })

  it('moves through breadcrumb and back navigation without mutating the draft', () => {
    const before = populatedDraft()
    let state = resourceCreationReducer(before, { type: 'BACK' })

    expect(state.stage).toEqual({ kind: 'type' })
    expect(state.draft).toBe(before.draft)

    state = resourceCreationReducer(state, {
      type: 'NAVIGATE_TO_STAGE',
      stage: { kind: 'family' },
    })
    expect(state.stage).toEqual({ kind: 'family' })
    expect(state.draft).toBe(before.draft)

    state = resourceCreationReducer(state, { type: 'BACK' })
    expect(state.stage).toEqual({ kind: 'class' })
    expect(resourceCreationReducer(state, { type: 'BACK' }).stage).toEqual({
      kind: 'class',
    })
  })

  it.each([
    [
      'Class',
      { type: 'CONFIRM_CLASS', item: { ...classItem, id: 'class-2' } },
      {
        classItem: { ...classItem, id: 'class-2' },
        familyItem: null,
        typeItem: null,
      },
      'family',
    ],
    [
      'Family',
      { type: 'CONFIRM_FAMILY', item: { ...familyItem, id: 'family-2' } },
      {
        classItem,
        familyItem: { ...familyItem, id: 'family-2' },
        typeItem: null,
      },
      'type',
    ],
    [
      'Type',
      { type: 'CONFIRM_TYPE', item: { ...typeItem, id: 'type-2' } },
      { classItem, familyItem, typeItem: { ...typeItem, id: 'type-2' } },
      'unit',
    ],
  ] as const)(
    'replacing %s atomically clears its Unit placeholder',
    (_, event, hierarchy, stage) => {
      const before = populatedDraft()
      const state = resourceCreationReducer(before, event)

      expect(state).toMatchObject({
        stage: { kind: stage },
        draft: {
          hierarchy,
          unitId: null,
          revision: before.draft.revision + 1,
        },
      })
    },
  )

  it.each([
    { type: 'CONFIRM_CLASS', item: classItem },
    { type: 'CONFIRM_FAMILY', item: familyItem },
    { type: 'CONFIRM_TYPE', item: typeItem },
  ] as const)('preserves descendants when %s is reconfirmed by ID', (event) => {
    const before = populatedDraft()
    const state = resourceCreationReducer(before, event)

    expect(state.draft).toBe(before.draft)
    expect(state.draft.revision).toBe(4)
  })

  it('increments revision only for a changed hierarchy parent', () => {
    const opened = open()
    const navigated = resourceCreationReducer(opened, {
      type: 'NAVIGATE_TO_STAGE',
      stage: { kind: 'type' },
    })
    const reconfirmed = resourceCreationReducer(navigated, {
      type: 'CONFIRM_TYPE',
      item: typeItem,
    })
    const replaced = resourceCreationReducer(reconfirmed, {
      type: 'CONFIRM_TYPE',
      item: { ...typeItem, id: 'type-2' },
    })

    expect(opened.draft.revision).toBe(0)
    expect(navigated.draft.revision).toBe(0)
    expect(reconfirmed.draft.revision).toBe(0)
    expect(replaced.draft.revision).toBe(1)
  })
})

it('increments the open generation for every OPEN without mutating the new draft revision', () => {
  const first = open()
  const reopened = resourceCreationReducer(first, {
    type: 'OPEN',
    prefix: normalizeInitialHierarchySnapshot({
      classItem,
      familyItem,
      typeItem,
    }),
  })

  expect(first).toMatchObject({ openGeneration: 1, draft: { revision: 0 } })
  expect(reopened).toMatchObject({ openGeneration: 2, draft: { revision: 0 } })
})

describe('resource creation contract-pending safety wall', () => {
  it('ends an explicit Unit confirmation at contract-pending with no lease', () => {
    const state = resourceCreationReducer(open(), {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-1',
    })

    expect(state.stage).toEqual({
      kind: 'contract-pending',
      blockedCapability: 'attributes-v1',
    })
    expect(state.draft).toMatchObject({
      unitId: 'unit-1',
      authoritativeEvaluation: null,
      catalogFingerprint: null,
    })
  })

  it('keeps same-ID Unit confirmation non-mutating and revises a replacement', () => {
    const first = resourceCreationReducer(open(), {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-1',
    })
    const same = resourceCreationReducer(first, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-1',
    })
    const replacement = resourceCreationReducer(same, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-2',
    })

    expect(same.draft).toBe(first.draft)
    expect(same.draft).toMatchObject({
      authoritativeEvaluation: null,
      catalogFingerprint: null,
    })
    expect(replacement.draft).toMatchObject({
      unitId: 'unit-2',
      authoritativeEvaluation: null,
      catalogFingerprint: null,
      revision: first.draft.revision + 1,
    })
    expect(replacement.stage).toEqual({
      kind: 'contract-pending',
      blockedCapability: 'attributes-v1',
    })
  })

  it('clears every selection bucket with hierarchy changes and preserves them for a Unit change', () => {
    const buckets = {
      active: { 'assignment-active': undefined as never },
      suspended: { 'assignment-suspended': undefined as never },
      omitted: new Set(['assignment-omitted']),
    }
    const before = {
      ...populatedDraft(),
      draft: {
        ...populatedDraft().draft,
        selectionBuckets: buckets,
      },
    }
    const hierarchyChanged = resourceCreationReducer(before, {
      type: 'CONFIRM_CLASS',
      item: { ...classItem, id: 'class-2' },
    })
    const unitChanged = resourceCreationReducer(before, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-2',
    })

    expect(hierarchyChanged.draft).toMatchObject({
      selectionBuckets: { active: {}, suspended: {}, omitted: new Set() },
      authoritativeEvaluation: null,
      catalogFingerprint: null,
      revision: before.draft.revision + 1,
    })
    expect(unitChanged.draft.selectionBuckets).toBe(buckets)
    expect(unitChanged.draft.revision).toBe(before.draft.revision + 1)
  })
})

import { describe, expect, it } from 'vitest'
import {
  createInitialCreationState,
  createInitialHierarchySnapshotCapture,
  deriveInitialHierarchySnapshot,
  normalizeInitialHierarchySnapshot,
  resourceCreationReducer,
  resourceIdKey,
} from '../../src/features/resources-master/resourceCreation.model'
import type { ResourceCreationEvaluation } from '../../src/features/resources-master/resourcesMaster.types'

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

const evaluation = (
  assignments: ResourceCreationEvaluation['asignaciones'],
  overrides: Partial<ResourceCreationEvaluation> = {},
): ResourceCreationEvaluation => ({
  status: 'VALID',
  valid: true,
  catalogFingerprint: 'catalog-1',
  nombre: null,
  identificadorTecnico: null,
  asignaciones: assignments,
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
  ...overrides,
})

const assignment = (
  asignacionAtributoId: string,
  aplicabilidadResuelta: 'REQUIRED' | 'OPTIONAL' = 'REQUIRED',
) => ({
  asignacionAtributoId,
  definicionAtributoId: `${asignacionAtributoId}-definition`,
  aplicabilidadResuelta,
  participaIdentidad: false,
  orden: 0,
  effectiveReasons: [],
})

const attributes = () =>
  resourceCreationReducer(open(), { type: 'CONFIRM_UNIT', unitId: 'unit-1' })

const withEvaluation = (
  state: ReturnType<typeof attributes>,
  authoritativeEvaluation: ResourceCreationEvaluation,
  selectionBuckets = state.draft.selectionBuckets,
) => ({
  ...state,
  draft: {
    ...state.draft,
    selectionBuckets,
    authoritativeEvaluation,
    catalogFingerprint: authoritativeEvaluation.catalogFingerprint,
  },
})

describe('resource creation attribute and review-pending stages', () => {
  it('enters attributes after explicit Unit confirmation with no cursor state', () => {
    const state = attributes()

    expect(state.stage).toEqual({ kind: 'attributes' })
    expect(state.draft).toMatchObject({
      unitId: 'unit-1',
      authoritativeEvaluation: null,
      catalogFingerprint: null,
    })
    expect(state).not.toHaveProperty('assignmentCursor')
    expect(state.draft).not.toHaveProperty('assignmentCursor')
  })

  it('enters review-pending only for a VALID evaluation with every required selection and optional omission resolved', () => {
    const state = withEvaluation(
      attributes(),
      evaluation([assignment('required'), assignment('optional', 'OPTIONAL')]),
      {
        active: { required: 'value-required' },
        suspended: {},
        omitted: new Set(['optional']),
      },
    )

    expect(
      resourceCreationReducer(state, { type: 'COMPLETE_ATTRIBUTES' }).stage,
    ).toEqual({ kind: 'review-pending' })
  })

  it.each([
    [
      'INVALID evaluations with assignments',
      evaluation([assignment('required')], { status: 'INVALID', valid: false }),
      {
        active: { required: 'value-required' },
        suspended: {},
        omitted: new Set(),
      },
    ],
    [
      'INCOMPLETE evaluations',
      evaluation([assignment('required')], {
        status: 'INCOMPLETE',
        valid: false,
      }),
      {
        active: { required: 'value-required' },
        suspended: {},
        omitted: new Set(),
      },
    ],
    [
      'missing required selections',
      evaluation([assignment('required')]),
      { active: {}, suspended: {}, omitted: new Set() },
    ],
    [
      'suspended selections',
      evaluation([assignment('required')]),
      {
        active: {},
        suspended: { required: 'value-required' },
        omitted: new Set(),
      },
    ],
    [
      'required omissions',
      evaluation([assignment('required')]),
      { active: {}, suspended: {}, omitted: new Set(['required']) },
    ],
  ])(
    'keeps %s in attributes',
    (_, authoritativeEvaluation, selectionBuckets) => {
      const state = withEvaluation(
        attributes(),
        authoritativeEvaluation,
        selectionBuckets,
      )

      expect(
        resourceCreationReducer(state, { type: 'COMPLETE_ATTRIBUTES' }),
      ).toBe(state)
    },
  )

  it('clears authority on a selection mutation so completion stays blocked until reevaluation', () => {
    const state = withEvaluation(
      attributes(),
      evaluation([assignment('required')]),
      { active: { required: 'value-old' }, suspended: {}, omitted: new Set() },
    )
    const changed = resourceCreationReducer(state, {
      type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
      assignmentId: 'required',
      allowedValueId: 'value-new',
    })

    expect(changed.draft.authoritativeEvaluation).toBeNull()
    expect(changed.draft.catalogFingerprint).toBeNull()
    expect(
      resourceCreationReducer(changed, { type: 'COMPLETE_ATTRIBUTES' }),
    ).toBe(changed)
  })

  it('backs from review-pending through attributes to Class without changing the draft identity', () => {
    const review = resourceCreationReducer(
      withEvaluation(attributes(), evaluation([assignment('required')]), {
        active: { required: 'value-required' },
        suspended: {},
        omitted: new Set(),
      }),
      { type: 'COMPLETE_ATTRIBUTES' },
    )
    const draft = review.draft
    const stages = ['attributes', 'unit', 'type', 'family', 'class']

    stages.reduce((state, kind) => {
      const next = resourceCreationReducer(state, { type: 'BACK' })
      expect(next.stage).toEqual({ kind })
      expect(next.draft).toBe(draft)
      return next
    }, review)
  })

  it('preserves selection buckets for a changed Unit while it returns to attributes', () => {
    const buckets = {
      active: { 'assignment-active': 'value-active' },
      suspended: { 'assignment-suspended': 'value-suspended' },
      omitted: new Set(['assignment-omitted']),
    }
    const before = {
      ...populatedDraft(),
      draft: { ...populatedDraft().draft, selectionBuckets: buckets },
    }
    const unitChanged = resourceCreationReducer(before, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-2',
    })

    expect(unitChanged.draft.selectionBuckets).toBe(buckets)
    expect(unitChanged.draft.revision).toBe(before.draft.revision + 1)
    expect(unitChanged.stage).toEqual({ kind: 'attributes' })
  })
})

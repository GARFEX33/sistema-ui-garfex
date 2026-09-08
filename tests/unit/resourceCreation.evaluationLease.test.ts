import { describe, expect, it } from 'vitest'
import {
  adoptResourceCreationEvaluation,
  captureResourceCreationEvaluationLease,
  asResourceCreationEvaluationRequestToken,
} from '../../src/features/resources-master/resourceCreation.evaluationLease'
import {
  createInitialCreationState,
  normalizeInitialHierarchySnapshot,
  resourceCreationReducer,
} from '../../src/features/resources-master/resourceCreation.model'
import type { ResourceCreationEvaluation } from '../../src/features/resources-master/resourcesMaster.types'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import {
  confirmSelection,
  createSelectionBuckets,
  omitSelection,
  suspendSelection,
} from '../../src/features/resources-master/resourceCreation.selectionDraft'

const classId = 'class-1'
const classItem = {
  id: classId,
  clave: 'CLASS',
  nombre: 'Class',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}
const familyItem = {
  id: 'family-1',
  claseRecursoId: classId,
  clave: 'FAMILY',
  nombre: 'Family',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}
const typeItem = {
  id: 'type-1',
  familiaRecursoId: 'family-1',
  clave: 'TYPE',
  nombre: 'Type',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  aggregateStatus: 'CLEAN',
  violations: [],
}
const evaluation = (
  status: ResourceCreationEvaluation['status'] = 'VALID',
) => ({
  status,
  valid: status === 'VALID',
  catalogFingerprint: `fingerprint-${status}`,
  nombre: null,
  identificadorTecnico: null,
  asignaciones: [],
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
})
const open = () =>
  resourceCreationReducer(createInitialCreationState(), {
    type: 'OPEN',
    prefix: normalizeInitialHierarchySnapshot({
      classItem,
      familyItem,
      typeItem,
    }),
  })
const withUnit = () =>
  resourceCreationReducer(open(), { type: 'CONFIRM_UNIT', unitId: 'unit-1' })
const capture = (state = withUnit(), value = 'request-1') =>
  captureResourceCreationEvaluationLease(
    state,
    asResourceCreationEvaluationRequestToken(value),
  )
const adoptedState = (selectionBuckets = createSelectionBuckets()) => {
  const state = withUnit()
  const captured = capture({
    ...state,
    draft: { ...state.draft, selectionBuckets },
  })

  return adoptResourceCreationEvaluation(
    captured.state,
    captured.lease,
    evaluation(),
  )
}
const expectInvalidated = (
  before: ReturnType<typeof adoptedState>,
  next: typeof before,
) => {
  expect(next.draft.revision).toBe(before.draft.revision + 1)
  expect(next.draft.authoritativeEvaluation).toBeNull()
  expect(next.draft.catalogFingerprint).toBeNull()
  expect(next.evaluationRequestToken).toBeNull()
}

describe('resource creation evaluation lease', () => {
  it('captures and atomically adopts a current parsed evaluation without altering draft revision, stage, or buckets', () => {
    const state = withUnit()
    const captured = capture(state)
    const adopted = adoptResourceCreationEvaluation(
      captured.state,
      captured.lease,
      evaluation(),
    )

    expect(captured.lease).toMatchObject({
      requestToken: asResourceCreationEvaluationRequestToken('request-1'),
      openGeneration: state.openGeneration,
      revision: state.draft.revision,
      classKey: 'class-1',
      familyKey: 'family-1',
      typeKey: 'type-1',
      unitKey: 'unit-1',
    })
    expect(adopted).toMatchObject({
      stage: state.stage,
      draft: {
        ...state.draft,
        authoritativeEvaluation: evaluation(),
        catalogFingerprint: 'fingerprint-VALID',
      },
    })
    expect(adopted.draft.revision).toBe(state.draft.revision)
    expect(adopted.draft.selectionBuckets).toBe(state.draft.selectionBuckets)
  })

  it('rejects stale, out-of-order, reopened, and revision-mismatched leases by identity', () => {
    const state = withUnit()
    const first = capture(state, 'first')
    const second = capture(first.state, 'second')
    const reopened = resourceCreationReducer(second.state, {
      type: 'OPEN',
      prefix: normalizeInitialHierarchySnapshot({
        classItem,
        familyItem,
        typeItem,
      }),
    })
    const revised = resourceCreationReducer(second.state, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-2',
    })

    expect(
      adoptResourceCreationEvaluation(second.state, first.lease, evaluation()),
    ).toBe(second.state)
    expect(
      adoptResourceCreationEvaluation(reopened, second.lease, evaluation()),
    ).toBe(reopened)
    expect(
      adoptResourceCreationEvaluation(revised, second.lease, evaluation()),
    ).toBe(revised)
  })

  it.each([
    [
      'same-revision string class context',
      {
        type: 'CONFIRM_CLASS',
        item: { ...classItem, id: 'class-2' },
      },
    ],
    [
      'family',
      { type: 'CONFIRM_FAMILY', item: { ...familyItem, id: 'family-2' } },
    ],
    ['type', { type: 'CONFIRM_TYPE', item: { ...typeItem, id: 'type-2' } }],
    ['unit', { type: 'CONFIRM_UNIT', unitId: 'unit-2' }],
  ] as const)('rejects a lease after a changed %s identity', (_, event) => {
    const state = withUnit()
    const captured = capture(state)
    const changed =
      event.type === 'CONFIRM_CLASS'
        ? {
            ...captured.state,
            draft: {
              ...captured.state.draft,
              hierarchy: {
                ...captured.state.draft.hierarchy,
                classItem: event.item,
              },
            },
          }
        : resourceCreationReducer(captured.state, event)

    expect(
      adoptResourceCreationEvaluation(changed, captured.lease, evaluation()),
    ).toBe(changed)
  })

  it('invalidates adopted authority for every effective selection event', () => {
    const value = asAllowedValueId('allowed-value-1')
    const active = confirmSelection(
      createSelectionBuckets(),
      'assignment-1',
      value,
    )
    const reconciled = confirmSelection(
      createSelectionBuckets(),
      'assignment-2',
      value,
    )
    const transitions = [
      [
        adoptedState(),
        {
          type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
          assignmentId: 'assignment-1',
          allowedValueId: value,
        },
      ],
      [
        adoptedState(),
        { type: 'OMIT_ALLOWED_VALUE_ASSIGNMENT', assignmentId: 'assignment-1' },
      ],
      [
        adoptedState(),
        {
          type: 'RECONCILE_ALLOWED_VALUE_SELECTIONS',
          selectionBuckets: reconciled,
        },
      ],
      [
        adoptedState(suspendSelection(active, 'assignment-1')),
        {
          type: 'RESTORE_ALLOWED_VALUE_SELECTION',
          assignmentId: 'assignment-1',
          allowedValueId: value,
        },
      ],
    ] as const

    transitions.forEach(([before, event]) => {
      const next = resourceCreationReducer(before, event)

      expectInvalidated(before, next)
      expect(next.stage).toBe(before.stage)
      expect(next.openGeneration).toBe(before.openGeneration)
    })
  })

  it('keeps no-op selection events and adopted authority by state identity', () => {
    const value = asAllowedValueId('allowed-value-1')
    const active = confirmSelection(
      createSelectionBuckets(),
      'assignment-1',
      value,
    )
    const omitted = omitSelection(createSelectionBuckets(), 'assignment-1')
    const suspended = suspendSelection(active, 'assignment-1')
    const sameBuckets = createSelectionBuckets()
    const transitions = [
      [
        adoptedState(active),
        {
          type: 'CONFIRM_ALLOWED_VALUE_SELECTION',
          assignmentId: 'assignment-1',
          allowedValueId: value,
        },
      ],
      [
        adoptedState(omitted),
        { type: 'OMIT_ALLOWED_VALUE_ASSIGNMENT', assignmentId: 'assignment-1' },
      ],
      [
        adoptedState(sameBuckets),
        {
          type: 'RECONCILE_ALLOWED_VALUE_SELECTIONS',
          selectionBuckets: sameBuckets,
        },
      ],
      [
        adoptedState(suspended),
        {
          type: 'RESTORE_ALLOWED_VALUE_SELECTION',
          assignmentId: 'assignment-1',
          allowedValueId: asAllowedValueId('other'),
        },
      ],
      [
        adoptedState(suspended),
        {
          type: 'RESTORE_ALLOWED_VALUE_SELECTION',
          assignmentId: 'missing',
          allowedValueId: value,
        },
      ],
    ] as const

    transitions.forEach(([before, event]) => {
      expect(resourceCreationReducer(before, event)).toBe(before)
    })
  })

  it('resets buckets for hierarchy replacement and preserves them for Unit replacement', () => {
    const buckets = confirmSelection(
      createSelectionBuckets(),
      'assignment-1',
      asAllowedValueId('allowed-value-1'),
    )
    const hierarchyBefore = adoptedState(buckets)
    const unitBefore = adoptedState(buckets)
    const hierarchyChanged = resourceCreationReducer(hierarchyBefore, {
      type: 'CONFIRM_CLASS',
      item: { ...classItem, id: 'class-2' },
    })
    const unitChanged = resourceCreationReducer(unitBefore, {
      type: 'CONFIRM_UNIT',
      unitId: 'unit-2',
    })

    expect(hierarchyChanged.draft.selectionBuckets).toEqual(
      createSelectionBuckets(),
    )
    expect(unitChanged.draft.selectionBuckets).toBe(buckets)
    expectInvalidated(hierarchyBefore, hierarchyChanged)
    expectInvalidated(unitBefore, unitChanged)
  })

  it('rejects an old lease after authoritative reconciliation changes buckets', () => {
    const captured = capture()
    const changed = resourceCreationReducer(captured.state, {
      type: 'RECONCILE_ALLOWED_VALUE_SELECTIONS',
      selectionBuckets: confirmSelection(
        createSelectionBuckets(),
        'assignment-1',
        asAllowedValueId('allowed-value-1'),
      ),
    })

    expect(
      adoptResourceCreationEvaluation(changed, captured.lease, evaluation()),
    ).toBe(changed)
  })

  it('does not capture incomplete or opaque-ID context and adopts parsed INVALID and INCOMPLETE evaluations', () => {
    const incomplete = createInitialCreationState()
    const opaqueContext = resourceCreationReducer(open(), {
      type: 'CONFIRM_UNIT',
      unitId: { toString: () => 'unit-1' },
    })
    const unusable = captureResourceCreationEvaluationLease(
      incomplete,
      asResourceCreationEvaluationRequestToken('missing-context'),
    )
    const opaque = capture(opaqueContext, 'opaque-context')
    const invalid = capture(withUnit(), 'invalid')
    const incompleteResult = capture(withUnit(), 'incomplete')

    expect(unusable).toEqual({ state: incomplete, lease: null })
    expect(opaque).toEqual({ state: opaqueContext, lease: null })
    expect(opaque.state.evaluationRequestToken).toBeNull()
    expect(
      adoptResourceCreationEvaluation(
        invalid.state,
        invalid.lease,
        evaluation('INVALID'),
      ).draft,
    ).toMatchObject({
      authoritativeEvaluation: evaluation('INVALID'),
      catalogFingerprint: 'fingerprint-INVALID',
    })
    expect(
      adoptResourceCreationEvaluation(
        incompleteResult.state,
        incompleteResult.lease,
        evaluation('INCOMPLETE'),
      ).draft,
    ).toMatchObject({
      authoritativeEvaluation: evaluation('INCOMPLETE'),
      catalogFingerprint: 'fingerprint-INCOMPLETE',
    })
  })
})

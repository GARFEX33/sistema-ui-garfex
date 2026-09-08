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

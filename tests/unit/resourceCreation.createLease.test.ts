import { describe, expect, it } from 'vitest'
import {
  asResourceCreationCreateToken,
  captureResourceCreationCreateLease,
  isResourceCreationCreateLeaseCurrent,
} from '../../src/features/resources-master/resourceCreation.createLease'
import {
  createInitialCreationState,
  normalizeInitialHierarchySnapshot,
  resourceCreationReducer,
} from '../../src/features/resources-master/resourceCreation.model'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import {
  confirmSelection,
  createSelectionBuckets,
  omitSelection,
  suspendSelection,
} from '../../src/features/resources-master/resourceCreation.selectionDraft'

const ownership = {
  kind: 'ORGANIZATION',
  organizacionId: 'organization-1',
} as const
const classItem = { id: 'class-1' }
const familyItem = { id: 'family-1', claseRecursoId: 'class-1' }
const typeItem = { id: 'type-1', familiaRecursoId: 'family-1' }

const evaluation = (fingerprint = 'catalog-v1') => ({
  status: 'VALID' as const,
  valid: true,
  catalogFingerprint: fingerprint,
  nombre: 'Ignored name',
  identificadorTecnico: 'ignored-id',
  asignaciones: [],
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [{ valor: 'ignored' }],
  issues: [],
})

const readyState = () => {
  const opened = resourceCreationReducer(createInitialCreationState(), {
    type: 'OPEN',
    prefix: normalizeInitialHierarchySnapshot({
      classItem,
      familyItem,
      typeItem,
    }),
  })
  const withUnit = resourceCreationReducer(opened, {
    type: 'CONFIRM_UNIT',
    unitId: 'unit-1',
  })
  const authoritativeEvaluation = evaluation()

  return {
    ...withUnit,
    stage: { kind: 'review-pending' } as const,
    draft: {
      ...withUnit.draft,
      authoritativeEvaluation,
      catalogFingerprint: authoritativeEvaluation.catalogFingerprint,
      selectionBuckets: omitSelection(
        suspendSelection(
          confirmSelection(
            confirmSelection(
              createSelectionBuckets(),
              'assignment-2',
              asAllowedValueId('value-2'),
            ),
            'assignment-1',
            asAllowedValueId('value-1'),
          ),
          'assignment-3',
        ),
        'assignment-4',
      ),
    },
  }
}

describe('resource creation create lease', () => {
  it('captures a frozen active-only fingerprinted request in insertion order', () => {
    const state = readyState()
    const captured = captureResourceCreationCreateLease(
      state,
      ownership,
      asResourceCreationCreateToken('create-1'),
    )

    expect(captured).toMatchObject({
      lease: {
        createToken: asResourceCreationCreateToken('create-1'),
        ownershipIdentity: ownership,
        catalogFingerprint: 'catalog-v1',
      },
    })
    expect(captured!.request).toEqual({
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      expectedCatalogFingerprint: 'catalog-v1',
      selecciones: [
        { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'value-2' },
        { asignacionAtributoId: 'assignment-1', valorPermitidoId: 'value-1' },
      ],
      ownership,
    })
    expect(Object.isFrozen(captured!.request)).toBe(true)
    expect(Object.isFrozen(captured!.lease)).toBe(true)
  })

  it.each([
    [
      'attributes stage',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        stage: { kind: 'attributes' } as const,
      }),
    ],
    [
      'invalid evaluation',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        draft: {
          ...state.draft,
          authoritativeEvaluation: {
            ...state.draft.authoritativeEvaluation!,
            status: 'INVALID' as const,
            valid: false,
          },
        },
      }),
    ],
    [
      'invalid valid flag',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        draft: {
          ...state.draft,
          authoritativeEvaluation: {
            ...state.draft.authoritativeEvaluation!,
            valid: false,
          },
        },
      }),
    ],
    [
      'mismatched fingerprint',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        draft: { ...state.draft, catalogFingerprint: 'catalog-v2' },
      }),
    ],
    [
      'blank fingerprint',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        draft: {
          ...state.draft,
          catalogFingerprint: '   ',
          authoritativeEvaluation: evaluation('   '),
        },
      }),
    ],
    ['missing ownership', (state: ReturnType<typeof readyState>) => state],
    ['blank organization', (state: ReturnType<typeof readyState>) => state],
    [
      'blank hierarchy id',
      (state: ReturnType<typeof readyState>) => ({
        ...state,
        draft: {
          ...state.draft,
          hierarchy: { ...state.draft.hierarchy, classItem: { id: ' ' } },
        },
      }),
    ],
  ])('rejects %s', (_, change) => {
    expect(
      captureResourceCreationCreateLease(
        change(readyState()),
        _ === 'missing ownership'
          ? null
          : _ === 'blank organization'
            ? { kind: 'ORGANIZATION', organizacionId: ' ' }
            : ownership,
        asResourceCreationCreateToken('create-1'),
      ),
    ).toBeNull()
  })

  it('rejects every stale state, ownership, context, revision, generation, evaluation, or fingerprint change', () => {
    const state = readyState()
    const captured = captureResourceCreationCreateLease(
      state,
      ownership,
      asResourceCreationCreateToken('create-1'),
    )
    const changes = [
      { ...state },
      { ...state, openGeneration: state.openGeneration + 1 },
      {
        ...state,
        draft: { ...state.draft, revision: state.draft.revision + 1 },
      },
      { ...state, draft: { ...state.draft, catalogFingerprint: 'catalog-v2' } },
      {
        ...state,
        draft: { ...state.draft, authoritativeEvaluation: evaluation() },
      },
      {
        ...state,
        draft: {
          ...state.draft,
          hierarchy: { ...state.draft.hierarchy, typeItem: { id: 'type-2' } },
        },
      },
      { ...state, stage: { kind: 'attributes' } as const },
    ]

    expect(
      isResourceCreationCreateLeaseCurrent(state, ownership, captured!.lease),
    ).toBe(true)
    changes.forEach((changed) =>
      expect(
        isResourceCreationCreateLeaseCurrent(
          changed,
          ownership,
          captured!.lease,
        ),
      ).toBe(false),
    )
    expect(
      isResourceCreationCreateLeaseCurrent(
        state,
        { kind: 'GLOBAL' },
        captured!.lease,
      ),
    ).toBe(false)
  })
})

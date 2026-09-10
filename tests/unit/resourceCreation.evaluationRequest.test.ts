import { describe, expect, it } from 'vitest'
import { buildResourceCreationEvaluationRequest } from '../../src/features/resources-master/resourceCreation.evaluationRequest'
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

const classItem = { id: 'class-1' }
const familyItem = { id: 'family-1', claseRecursoId: 'class-1' }
const typeItem = { id: 'type-1', familiaRecursoId: 'family-1' }
const global = { kind: 'GLOBAL' } as const
const organization = {
  kind: 'ORGANIZATION',
  organizacionId: 'organization-1',
} as const

const readyState = () =>
  resourceCreationReducer(
    resourceCreationReducer(createInitialCreationState(), {
      type: 'OPEN',
      prefix: normalizeInitialHierarchySnapshot({
        classItem,
        familyItem,
        typeItem,
      }),
    }),
    { type: 'CONFIRM_UNIT', unitId: 'unit-1' },
  )

describe('resource creation evaluation request', () => {
  it('projects exact GLOBAL and ORGANIZATION inputs in active insertion order only', () => {
    const active = confirmSelection(
      confirmSelection(
        createSelectionBuckets(),
        'assignment-2',
        asAllowedValueId('value-2'),
      ),
      'assignment-1',
      asAllowedValueId('value-1'),
    )
    const state = {
      ...readyState(),
      draft: {
        ...readyState().draft,
        selectionBuckets: omitSelection(
          suspendSelection(
            confirmSelection(
              active,
              'assignment-3',
              asAllowedValueId('value-3'),
            ),
            'assignment-3',
          ),
          'assignment-4',
        ),
      },
    }

    expect(buildResourceCreationEvaluationRequest(state, global)).toEqual({
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      selecciones: [
        { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'value-2' },
        { asignacionAtributoId: 'assignment-1', valorPermitidoId: 'value-1' },
      ],
      ownership: global,
    })
    expect(
      buildResourceCreationEvaluationRequest(state, organization),
    ).toMatchObject({
      ownership: organization,
    })
  })

  it.each([
    ['null ownership', null],
    ['empty organization ID', { kind: 'ORGANIZATION', organizacionId: '' }],
    [
      'opaque organization ID',
      { kind: 'ORGANIZATION', organizacionId: { id: 'org' } },
    ],
    ['unknown ownership', { kind: 'TEAM', organizacionId: 'org-1' }],
  ])('rejects %s without coercing opaque values', (_, ownership) => {
    expect(
      buildResourceCreationEvaluationRequest(readyState(), ownership as never),
    ).toBeNull()
  })

  it('rejects incomplete or opaque context and active opaque selections', () => {
    const incomplete = createInitialCreationState()
    const opaqueUnit = {
      ...readyState(),
      draft: {
        ...readyState().draft,
        unitId: { toString: () => 'unit-1' },
      },
    }
    const opaqueSelection = {
      ...readyState(),
      draft: {
        ...readyState().draft,
        selectionBuckets: confirmSelection(
          createSelectionBuckets(),
          'assignment-1',
          { toString: () => 'value-1' } as never,
        ),
      },
    }

    expect(
      buildResourceCreationEvaluationRequest(incomplete, global),
    ).toBeNull()
    expect(
      buildResourceCreationEvaluationRequest(opaqueUnit, global),
    ).toBeNull()
    expect(
      buildResourceCreationEvaluationRequest(opaqueSelection, global),
    ).toBeNull()
  })
})

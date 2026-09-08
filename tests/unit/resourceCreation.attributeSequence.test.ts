import { describe, expect, it } from 'vitest'
import {
  asAllowedValueId,
  deriveAttributeSequence,
  reconcileAttributeSequence,
  type AllowedValuesKnowledge,
} from '../../src/features/resources-master/resourceCreation.attributeSequence'
import {
  confirmSelection,
  createSelectionBuckets,
  omitSelection,
  projectActiveSelections,
  suspendSelection,
} from '../../src/features/resources-master/resourceCreation.selectionDraft'
import type { ResourceResolvedCreationAssignment } from '../../src/features/resources-master/resourcesMaster.types'

const assignment = (
  asignacionAtributoId: string,
  definicionAtributoId: string,
  aplicabilidadResuelta: ResourceResolvedCreationAssignment['aplicabilidadResuelta'],
  selectedValueId?: string,
): ResourceResolvedCreationAssignment => ({
  asignacionAtributoId,
  definicionAtributoId,
  aplicabilidadResuelta,
  participaIdentidad: false,
  orden: 0,
  effectiveReasons: [],
  ...(selectedValueId === undefined ? {} : { selectedValueId }),
})

const knowledge = (
  status: 'PARTIAL' | 'EXHAUSTED',
  ...values: Array<{ id: string; activo: boolean; effective: boolean }>
): AllowedValuesKnowledge => ({
  definition: {
    status,
    values: values.map((value) => ({
      ...value,
      definicionAtributoId: 'definition',
      clave: value.id,
      valor: { kind: 'TEXTO', value: value.id },
      nombre: value.id,
      orden: 0,
      revision: 1,
      effectiveReasons: [],
    })),
  },
})

describe('resource creation authoritative attribute sequence', () => {
  it('keeps backend order without sorting orden and retains same-definition assignments distinctly', () => {
    const assignments = [
      { ...assignment('second', 'definition', 'OPTIONAL'), orden: 99 },
      { ...assignment('first', 'definition', 'REQUIRED'), orden: 1 },
      { ...assignment('forbidden', 'definition', 'FORBIDDEN'), orden: 0 },
    ]

    expect(
      deriveAttributeSequence(assignments).map(
        (item) => item.asignacionAtributoId,
      ),
    ).toEqual(['second', 'first'])
  })

  it('suspends forbidden, not-applicable, mismatched, invalid, and absent active selections', () => {
    const buckets = ['forbidden', 'na', 'mismatch', 'invalid', 'absent'].reduce(
      (current, key) => confirmSelection(current, key, asAllowedValueId(key)),
      createSelectionBuckets<ReturnType<typeof asAllowedValueId>>(),
    )
    const result = reconcileAttributeSequence(
      {
        asignaciones: [
          assignment('forbidden', 'definition', 'FORBIDDEN'),
          assignment('na', 'definition', 'NOT_APPLICABLE'),
          assignment('mismatch', 'definition', 'REQUIRED', 'other'),
          assignment('invalid', 'definition', 'OPTIONAL', 'invalid'),
        ],
        seleccionesInvalidas: ['invalid'],
      },
      buckets,
      {},
      null,
    )

    expect(result.selectionBuckets.active).toEqual({})
    expect(result.selectionBuckets.suspended).toEqual({
      forbidden: asAllowedValueId('forbidden'),
      na: asAllowedValueId('na'),
      mismatch: asAllowedValueId('mismatch'),
      invalid: asAllowedValueId('invalid'),
      absent: asAllowedValueId('absent'),
    })
  })

  it('retains only selected active values and restores suspended values with active effective facts', () => {
    const active = confirmSelection(
      createSelectionBuckets<ReturnType<typeof asAllowedValueId>>(),
      'active',
      asAllowedValueId('retained'),
    )
    const suspended = suspendSelection(
      confirmSelection(active, 'restore', asAllowedValueId('restored')),
      'restore',
    )
    const result = reconcileAttributeSequence(
      {
        asignaciones: [
          assignment('active', 'definition', 'REQUIRED', 'retained'),
          assignment('restore', 'definition', 'REQUIRED'),
        ],
        seleccionesInvalidas: [],
      },
      suspended,
      knowledge('PARTIAL', { id: 'restored', activo: true, effective: true }),
      null,
    )

    expect(projectActiveSelections(result.selectionBuckets)).toEqual({
      active: asAllowedValueId('retained'),
      restore: asAllowedValueId('restored'),
    })
  })

  it('keeps unknown or exhausted-absent suspended values and reconciles omissions and pending selection', () => {
    const omitted = omitSelection(
      omitSelection(
        createSelectionBuckets<ReturnType<typeof asAllowedValueId>>(),
        'optional',
      ),
      'required',
    )
    const suspended = suspendSelection(
      confirmSelection(omitted, 'partial', asAllowedValueId('unknown')),
      'partial',
    )
    const result = reconcileAttributeSequence(
      {
        asignaciones: [
          assignment('optional', 'definition', 'OPTIONAL'),
          assignment('first', 'definition', 'REQUIRED'),
          assignment('required', 'definition', 'REQUIRED'),
          assignment('partial', 'missing', 'REQUIRED'),
          assignment('exhausted', 'exhausted', 'REQUIRED'),
        ],
        seleccionesInvalidas: [],
      },
      suspendSelection(
        confirmSelection(
          suspended,
          'exhausted',
          asAllowedValueId('not-allowed'),
        ),
        'exhausted',
      ),
      {
        ...knowledge('PARTIAL'),
        exhausted: { status: 'EXHAUSTED', values: [] },
      },
      'required',
    )

    expect(result.selectionBuckets.omitted).toEqual(new Set(['optional']))
    expect(result.selectionBuckets.suspended).toMatchObject({
      partial: asAllowedValueId('unknown'),
      exhausted: asAllowedValueId('not-allowed'),
    })
    expect(result.suspendedAllowedValueStatus).toEqual({
      partial: 'UNKNOWN',
      exhausted: 'NOT_ALLOWED',
    })
    expect(result.pendingAssignmentId).toBe('required')
    expect(
      reconcileAttributeSequence(
        {
          asignaciones: [
            assignment('optional', 'definition', 'OPTIONAL'),
            assignment('first', 'definition', 'REQUIRED'),
            assignment('required', 'definition', 'REQUIRED'),
          ],
          seleccionesInvalidas: [],
        },
        result.selectionBuckets,
        {},
        'optional',
      ).pendingAssignmentId,
    ).toBe('first')
  })
})

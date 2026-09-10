import { describe, expect, it } from 'vitest'
import {
  asAllowedValueId,
  type AllowedValueId,
} from '../../src/features/resources-master/resourceCreation.attributeSequence'
import {
  createSelectionBuckets,
  type SelectionBuckets,
} from '../../src/features/resources-master/resourceCreation.selectionDraft'
import {
  deriveCurrentAttributeStep,
  type AttributeStep,
} from '../../src/features/resources-master/resourceCreation.attributeStep'
import type {
  ResourceCreationEvaluation,
  ResourceResolvedCreationAssignment,
} from '../../src/features/resources-master/resourcesMaster.types'

const assignment = (
  asignacionAtributoId: string,
  definicionAtributoId: string,
  aplicabilidadResuelta: ResourceResolvedCreationAssignment['aplicabilidadResuelta'],
): ResourceResolvedCreationAssignment => ({
  asignacionAtributoId,
  definicionAtributoId,
  aplicabilidadResuelta,
  participaIdentidad: false,
  orden: 0,
  effectiveReasons: [],
})

const evaluation = (
  status: ResourceCreationEvaluation['status'],
  asignaciones: ResourceResolvedCreationAssignment[],
): ResourceCreationEvaluation => ({
  status,
  valid: status === 'VALID',
  catalogFingerprint: 'fingerprint',
  nombre: null,
  identificadorTecnico: null,
  asignaciones,
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [],
  issues: [],
})

const buckets = (
  active: Record<string, AllowedValueId> = {},
  omitted: readonly string[] = [],
  suspended: Record<string, AllowedValueId> = {},
): SelectionBuckets<AllowedValueId> => ({
  ...createSelectionBuckets<AllowedValueId>(),
  active,
  omitted: new Set(omitted),
  suspended,
})

describe('deriveCurrentAttributeStep', () => {
  it('returns the first unresolved applicable assignment in backend order with its exact position and total', () => {
    const result = deriveCurrentAttributeStep(
      evaluation('INCOMPLETE', [
        { ...assignment('optional', 'shared', 'OPTIONAL'), orden: 99 },
        { ...assignment('required', 'shared', 'REQUIRED'), orden: 1 },
      ]),
      buckets({}, ['optional']),
    )

    expect(result).toMatchObject({
      kind: 'current',
      assignment: { asignacionAtributoId: 'required' },
      position: 2,
      total: 2,
    } satisfies Partial<Extract<AttributeStep, { kind: 'current' }>>)
  })

  it('treats only active selections and optional omissions as resolved', () => {
    expect(
      deriveCurrentAttributeStep(
        evaluation('INCOMPLETE', [
          assignment('required', 'definition', 'REQUIRED'),
          assignment('optional', 'definition', 'OPTIONAL'),
        ]),
        buckets({ required: asAllowedValueId('selected') }, ['optional'], {
          ignored: asAllowedValueId('suspended'),
        }),
      ),
    ).toEqual({ kind: 'unavailable' })

    expect(
      deriveCurrentAttributeStep(
        evaluation('INVALID', [
          assignment('suspended', 'definition', 'REQUIRED'),
        ]),
        buckets({ suspended: asAllowedValueId('active-value') }, [], {
          suspended: asAllowedValueId('suspended-value'),
        }),
      ),
    ).toMatchObject({ kind: 'current', position: 1, total: 1 })
  })

  it('completes only a VALID evaluation after all applicable assignments resolve', () => {
    const completeBuckets = buckets(
      { required: asAllowedValueId('selected') },
      ['optional'],
    )
    const assignments = [
      assignment('required', 'definition', 'REQUIRED'),
      assignment('optional', 'definition', 'OPTIONAL'),
    ]

    expect(
      deriveCurrentAttributeStep(
        evaluation('VALID', assignments),
        completeBuckets,
      ),
    ).toEqual({
      kind: 'complete',
    })
    expect(
      deriveCurrentAttributeStep(
        evaluation('INVALID', assignments),
        completeBuckets,
      ),
    ).toEqual({ kind: 'unavailable' })
  })

  it('fails closed for missing authority, duplicate assignment identity, and non-VALID zero-applicable evaluations', () => {
    expect(deriveCurrentAttributeStep(null, createSelectionBuckets())).toEqual({
      kind: 'unavailable',
    })
    expect(
      deriveCurrentAttributeStep(
        evaluation('VALID', [
          assignment('duplicate', 'one', 'REQUIRED'),
          assignment('duplicate', 'two', 'OPTIONAL'),
        ]),
        createSelectionBuckets(),
      ),
    ).toEqual({ kind: 'unavailable' })
    expect(
      deriveCurrentAttributeStep(
        evaluation('INCOMPLETE', [
          assignment('forbidden', 'definition', 'FORBIDDEN'),
        ]),
        createSelectionBuckets(),
      ),
    ).toEqual({ kind: 'unavailable' })
  })
})

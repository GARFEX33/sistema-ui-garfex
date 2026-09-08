import { describe, expect, it, vi } from 'vitest'
import { projectResourceCreationAttributeView } from '../../src/features/resources-master/resourceCreation.attributeView'
import type { AttributeStep } from '../../src/features/resources-master/resourceCreation.attributeStep'
import type {
  ResourceAttributeDefinition,
  ResourceResolvedCreationAssignment,
} from '../../src/features/resources-master/resourcesMaster.types'

const assignment: ResourceResolvedCreationAssignment = {
  asignacionAtributoId: 'assignment-2',
  definicionAtributoId: 'definition-1',
  aplicabilidadResuelta: 'OPTIONAL',
  participaIdentidad: false,
  orden: 2,
  effectiveReasons: [],
}

const definition: ResourceAttributeDefinition = {
  id: 'definition-1',
  clave: 'COLOR',
  nombre: 'Color',
  descripcion: 'Color de referencia.',
  tipoDato: 'OPCION',
  modoCaptura: 'SELECCION',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}

const current: AttributeStep = {
  kind: 'current',
  assignment,
  position: 2,
  total: 3,
}

const project = (
  overrides: Partial<
    Parameters<typeof projectResourceCreationAttributeView>[0]
  > = {},
) =>
  projectResourceCreationAttributeView({
    evaluation: { status: 'ready', retry: vi.fn() },
    step: current,
    definition: { status: 'selection-ready', definition, retry: vi.fn() },
    onOmit: vi.fn(),
    ...overrides,
  })

describe('projectResourceCreationAttributeView', () => {
  it('gives terminal completion precedence over every driver state', () => {
    expect(
      project({
        evaluation: { status: 'error', retry: vi.fn() },
        step: { kind: 'complete' },
        definition: { status: 'error', retry: vi.fn() },
      }),
    ).toEqual({ kind: 'complete' })
  })

  it('maps unavailable steps through the exact evaluation state and retry', () => {
    for (const status of ['idle', 'loading'] as const)
      expect(
        project({
          evaluation: { status, retry: vi.fn() },
          step: { kind: 'unavailable' },
        }),
      ).toEqual({
        kind: 'presenter',
        view: { status: 'evaluation-loading' },
      })

    const retry = vi.fn()
    expect(
      project({
        evaluation: { status: 'error', retry },
        step: { kind: 'unavailable' },
      }),
    ).toEqual({
      kind: 'presenter',
      view: { status: 'evaluation-error', onRetry: retry },
    })
    expect(
      project({
        evaluation: { status: 'ready', retry: vi.fn() },
        step: { kind: 'unavailable' },
      }),
    ).toEqual({
      kind: 'presenter',
      view: { status: 'evaluation-unavailable' },
    })
  })

  it('maps current definition states with exact assignment progress and definition copy', () => {
    const expectedAssignment = {
      current: 2,
      total: 3,
      applicability: 'OPTIONAL' as const,
    }
    const retry = vi.fn()

    expect(project({ definition: { status: 'loading', retry } })).toEqual({
      kind: 'presenter',
      view: {
        status: 'definition-loading',
        assignment: expectedAssignment,
        onRetry: retry,
      },
    })
    expect(project({ definition: { status: 'error', retry } })).toEqual({
      kind: 'presenter',
      view: {
        status: 'definition-error',
        assignment: expectedAssignment,
        onRetry: retry,
      },
    })
    expect(project({ definition: { status: 'unavailable', retry } })).toEqual({
      kind: 'presenter',
      view: {
        status: 'definition-unavailable',
        assignment: expectedAssignment,
      },
    })
  })

  it('presents LIBRE without an omit callback for required assignments', () => {
    const onOmit = vi.fn()
    expect(
      project({
        step: {
          kind: 'current',
          assignment: { ...assignment, aplicabilidadResuelta: 'REQUIRED' },
          position: 2,
          total: 3,
        },
        definition: {
          status: 'unsupported-free-capture',
          definition: { ...definition, modoCaptura: 'LIBRE' },
          retry: vi.fn(),
        },
        onOmit,
      }),
    ).toEqual({
      kind: 'presenter',
      view: {
        status: 'unsupported-free-capture',
        assignment: { current: 2, total: 3, applicability: 'REQUIRED' },
        definition: { name: 'Color', description: 'Color de referencia.' },
      },
    })
  })

  it('presents LIBRE with omission only when optional', () => {
    const onOmit = vi.fn()
    expect(
      project({
        definition: {
          status: 'unsupported-free-capture',
          definition: { ...definition, modoCaptura: 'LIBRE' },
          retry: vi.fn(),
        },
        onOmit,
      }),
    ).toEqual({
      kind: 'presenter',
      view: {
        status: 'unsupported-free-capture',
        assignment: { current: 2, total: 3, applicability: 'OPTIONAL' },
        definition: { name: 'Color', description: 'Color de referencia.' },
        onOmit,
      },
    })
  })

  it('returns the authoritative selection context unchanged from value mapping', () => {
    expect(project()).toEqual({
      kind: 'selection-context',
      assignment: { current: 2, total: 3, applicability: 'OPTIONAL' },
      authoritativeAssignment: assignment,
      definition: { name: 'Color', description: 'Color de referencia.' },
    })
  })
})

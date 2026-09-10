import { describe, expect, it, vi } from 'vitest'
import {
  projectResourceCreationAttributeSelectionView,
  projectResourceCreationAttributeView,
  type ResourceCreationAttributeSelectionContext,
} from '../../src/features/resources-master/resourceCreation.attributeView'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import { createSelectionBuckets } from '../../src/features/resources-master/resourceCreation.selectionDraft'
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

const selectionContext: ResourceCreationAttributeSelectionContext = {
  kind: 'selection-context',
  assignment: { current: 2, total: 3, applicability: 'OPTIONAL' },
  authoritativeAssignment: assignment,
  definition: { name: 'Color', description: 'Color de referencia.' },
}

const allowedValue = (id: unknown, nombre: string) => ({
  id,
  definicionAtributoId: 'definition-1',
  clave: 'RED',
  valor: { kind: 'OPCION' as const, opcionAtributoId: 'option-red' },
  nombre,
  orden: 1,
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
})

const projectSelection = (
  overrides: Partial<
    Parameters<typeof projectResourceCreationAttributeSelectionView>[0]
  > = {},
) =>
  projectResourceCreationAttributeSelectionView({
    selectionContext,
    allowed: {
      status: 'ready',
      values: [allowedValue(7, 'Rojo')],
      hasNextPage: true,
      isFetchingNextPage: false,
      continue: vi.fn(),
      retry: vi.fn(),
    },
    selectionBuckets: createSelectionBuckets(),
    onConfirmAllowedValue: vi.fn(),
    onOmit: vi.fn(),
    ...overrides,
  })

describe('projectResourceCreationAttributeSelectionView', () => {
  it('maps paging and retained-value errors to exact selector states', () => {
    const states = [
      ['idle', false, false, [], { status: 'loading' }],
      ['loading', false, false, [], { status: 'loading' }],
      ['ready', true, true, [], { status: 'loading-more' }],
      ['ready', true, false, [], { status: 'ready', exhausted: false }],
      [
        'ready',
        false,
        false,
        [allowedValue(7, 'Rojo')],
        { status: 'ready', exhausted: true },
      ],
      ['error', false, false, [], { status: 'initial-error' }],
      [
        'error',
        false,
        false,
        [allowedValue(7, 'Rojo')],
        { status: 'partial-error' },
      ],
    ] as const

    states.forEach(
      ([status, hasNextPage, isFetchingNextPage, values, loadState]) =>
        expect(
          projectSelection({
            allowed: {
              status,
              values,
              hasNextPage,
              isFetchingNextPage,
              continue: vi.fn(),
              retry: vi.fn(),
            },
          }).loadState,
        ).toEqual(loadState),
    )
  })

  it('maps only allowed IDs and names, then confirms the current exact IDs', () => {
    const onConfirmAllowedValue = vi.fn()
    const onLoadMore = vi.fn()
    const onRetry = vi.fn()
    const view = projectSelection({
      allowed: {
        status: 'ready',
        values: [allowedValue(7, 'Rojo')],
        hasNextPage: true,
        isFetchingNextPage: false,
        continue: onLoadMore,
        retry: onRetry,
      },
      onConfirmAllowedValue,
    })

    expect(view.values).toEqual([{ key: '7', displayName: 'Rojo' }])
    expect(view.onLoadMore).toBe(onLoadMore)
    expect(view.onRetry).toBe(onRetry)
    view.onConfirm(view.values[0])
    view.onConfirm({ key: 'unknown', displayName: 'Desconocido' })
    view.onLoadMore()
    view.onRetry()
    expect(onConfirmAllowedValue).toHaveBeenCalledExactlyOnceWith(
      'assignment-2',
      '7',
    )
    expect(onLoadMore).toHaveBeenCalledOnce()
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('exposes only the current own active confirmation, never suspended or omitted', () => {
    const active = projectSelection({
      selectionBuckets: {
        active: { 'assignment-2': asAllowedValueId('7') },
        suspended: {},
        omitted: new Set(),
      },
    })
    const suspended = projectSelection({
      selectionBuckets: {
        active: {},
        suspended: { 'assignment-2': asAllowedValueId('7') },
        omitted: new Set(),
      },
    })
    const omitted = projectSelection({
      selectionBuckets: {
        active: {},
        suspended: {},
        omitted: new Set(['assignment-2']),
      },
    })
    const inherited = projectSelection({
      selectionBuckets: {
        active: Object.create({ 'assignment-2': asAllowedValueId('7') }),
        suspended: {},
        omitted: new Set(),
      },
    })

    expect(active.confirmedKey).toBe('7')
    expect(suspended.confirmedKey).toBeNull()
    expect(omitted.confirmedKey).toBeNull()
    expect(inherited.confirmedKey).toBeNull()
  })

  it('closes omission over the current ID only when optional', () => {
    const onOmit = vi.fn()
    const optional = projectSelection({ onOmit })
    optional.onOmit?.()
    const required = projectSelection({
      selectionContext: {
        ...selectionContext,
        assignment: {
          ...selectionContext.assignment,
          applicability: 'REQUIRED',
        },
        authoritativeAssignment: {
          ...assignment,
          aplicabilidadResuelta: 'REQUIRED',
        },
      },
    })

    expect(onOmit).toHaveBeenCalledExactlyOnceWith('assignment-2')
    expect(required.onOmit).toBeUndefined()
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { asAllowedValueId } from '../../src/features/resources-master/resourceCreation.attributeSequence'
import { createSelectionBuckets } from '../../src/features/resources-master/resourceCreation.selectionDraft'
import { useResourceCreationAttributeQueries } from '../../src/features/resources-master/useResourceCreationAttributeQueries'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceAllowedAttributeValueItem,
  ResourceAttributeDefinition,
  ResourceContextListPage,
  ResourceCreationEvaluation,
  ResourceResolvedCreationAssignment,
} from '../../src/features/resources-master/resourcesMaster.types'

const assignment = (
  id: string,
  definitionId = 'definition',
): ResourceResolvedCreationAssignment => ({
  asignacionAtributoId: id,
  definicionAtributoId: definitionId,
  aplicabilidadResuelta: 'REQUIRED',
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
const definition = (
  id = 'definition',
  overrides: Partial<ResourceAttributeDefinition> = {},
): ResourceAttributeDefinition => ({
  id,
  clave: id,
  nombre: id,
  tipoDato: 'OPCION',
  modoCaptura: 'SELECCION',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  ...overrides,
})
const value = (id: string, definitionId = 'definition') =>
  ({
    id,
    definicionAtributoId: definitionId,
    clave: id,
    valor: { kind: 'TEXTO', value: id },
    nombre: id,
    orden: 0,
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
  }) satisfies ResourceAllowedAttributeValueItem
const page = (
  items = [value('one')],
  continuationCursor: string | null = null,
  isExhausted = true,
): ResourceContextListPage<ResourceAllowedAttributeValueItem> => ({
  items,
  continuationCursor,
  isExhausted,
})
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}
const clients: QueryClient[] = []
const renderQueries = (
  api: Pick<
    ResourcesMasterApi,
    'getAttributeDefinition' | 'listAllowedAttributeValues'
  >,
  currentEvaluation: ResourceCreationEvaluation | null,
  buckets = createSelectionBuckets(),
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  return renderHook(
    (props) => useResourceCreationAttributeQueries({ api, ...props }),
    {
      initialProps: {
        evaluation: currentEvaluation,
        selectionBuckets: buckets,
      },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
}
afterEach(() => clients.splice(0).forEach((client) => client.clear()))

describe('useResourceCreationAttributeQueries', () => {
  it('keeps null, unavailable, and complete authority query-idle', async () => {
    const api = {
      getAttributeDefinition: vi.fn(),
      listAllowedAttributeValues: vi.fn(),
    }
    const mounted = renderQueries(api, null)

    for (const props of [
      { evaluation: null, selectionBuckets: createSelectionBuckets() },
      {
        evaluation: evaluation('INCOMPLETE', []),
        selectionBuckets: createSelectionBuckets(),
      },
      {
        evaluation: evaluation('VALID', [assignment('done')]),
        selectionBuckets: {
          ...createSelectionBuckets(),
          active: { done: asAllowedValueId('selected') },
        },
      },
    ]) {
      mounted.rerender(props)
      expect(mounted.result.current.step.kind).not.toBe('current')
      expect(mounted.result.current.definition.status).toBe('idle')
      expect(mounted.result.current.allowedValues.status).toBe('idle')
      expect(mounted.result.current.allowedValuesKnowledge).toEqual({})
    }
    expect(api.getAttributeDefinition).not.toHaveBeenCalled()
    expect(api.listAllowedAttributeValues).not.toHaveBeenCalled()
  })

  it('loads the backend-order correction assignment and exact selection pair', async () => {
    const api = {
      getAttributeDefinition: vi.fn().mockResolvedValue(definition()),
      listAllowedAttributeValues: vi.fn().mockResolvedValue(page()),
    }
    const mounted = renderQueries(
      api,
      evaluation('INVALID', [assignment('first'), assignment('second')]),
    )

    expect(mounted.result.current.step).toMatchObject({
      kind: 'current',
      assignment: { asignacionAtributoId: 'first' },
      position: 1,
      total: 2,
    })
    await waitFor(() =>
      expect(api.getAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'definition',
      }),
    )
    await waitFor(() =>
      expect(api.listAllowedAttributeValues).toHaveBeenCalledWith({
        definicionAtributoId: 'definition',
        cursor: null,
        pageSize: 20,
        modo: 'ACTIVE',
      }),
    )
  })

  it('exposes LIBRE definition state without listing values', async () => {
    const api = {
      getAttributeDefinition: vi
        .fn()
        .mockResolvedValue(definition('definition', { modoCaptura: 'LIBRE' })),
      listAllowedAttributeValues: vi.fn(),
    }
    const mounted = renderQueries(
      api,
      evaluation('INCOMPLETE', [assignment('current')]),
    )

    await waitFor(() =>
      expect(mounted.result.current.definition.status).toBe(
        'unsupported-free-capture',
      ),
    )
    expect(mounted.result.current.allowedValues.status).toBe('idle')
    expect(mounted.result.current.allowedValuesKnowledge).toEqual({})
    expect(api.listAllowedAttributeValues).not.toHaveBeenCalled()
  })

  it('returns current-definition knowledge across continuation and rekeys same-definition assignments', async () => {
    const fresh =
      deferred<ResourceContextListPage<ResourceAllowedAttributeValueItem>>()
    const api = {
      getAttributeDefinition: vi.fn().mockResolvedValue(definition()),
      listAllowedAttributeValues: vi
        .fn()
        .mockResolvedValueOnce(page([value('one')], 'next', false))
        .mockResolvedValueOnce(page([value('two')]))
        .mockReturnValueOnce(fresh.promise),
    }
    const current = evaluation('INCOMPLETE', [
      assignment('first'),
      assignment('second'),
    ])
    const mounted = renderQueries(api, current)

    await waitFor(() =>
      expect(mounted.result.current.allowedValues.hasNextPage).toBe(true),
    )
    expect(mounted.result.current.allowedValuesKnowledge).toEqual({
      definition: { status: 'PARTIAL', values: [value('one')] },
    })
    await act(async () => mounted.result.current.allowedValues.continue())
    await waitFor(() =>
      expect(mounted.result.current.allowedValuesKnowledge).toEqual({
        definition: {
          status: 'EXHAUSTED',
          values: [value('one'), value('two')],
        },
      }),
    )

    mounted.rerender({
      evaluation: current,
      selectionBuckets: {
        ...createSelectionBuckets(),
        active: { first: asAllowedValueId('selected') },
      },
    })
    expect(mounted.result.current.step).toMatchObject({
      kind: 'current',
      assignment: { asignacionAtributoId: 'second' },
    })
    await waitFor(() =>
      expect(api.listAllowedAttributeValues).toHaveBeenCalledTimes(3),
    )
    expect(mounted.result.current.allowedValuesKnowledge).toEqual({})
    await act(async () => fresh.resolve(page([value('fresh')])))
    await waitFor(() =>
      expect(mounted.result.current.allowedValuesKnowledge).toEqual({
        definition: { status: 'EXHAUSTED', values: [value('fresh')] },
      }),
    )
  })
})

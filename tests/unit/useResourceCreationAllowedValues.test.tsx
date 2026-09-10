import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResourceCreationAllowedValues } from '../../src/features/resources-master/useResourceCreationAllowedValues'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type {
  ResourceAllowedAttributeValueItem,
  ResourceAttributeDefinition,
  ResourceContextListPage,
  ResourceResolvedCreationAssignment,
} from '../../src/features/resources-master/resourcesMaster.types'
type Api = Pick<ResourcesMasterApi, 'listAllowedAttributeValues'>
type Page = ResourceContextListPage<ResourceAllowedAttributeValueItem>
const assignment = (definicionAtributoId = 'definition') =>
  ({
    asignacionAtributoId: 'assignment',
    definicionAtributoId,
    aplicabilidadResuelta: 'REQUIRED',
    participaIdentidad: false,
    orden: 1,
    effectiveReasons: [],
  }) satisfies ResourceResolvedCreationAssignment
const definition = (
  id = 'definition',
  overrides: Partial<ResourceAttributeDefinition> = {},
) =>
  ({
    id,
    clave: id,
    nombre: id,
    tipoDato: 'TEXTO',
    modoCaptura: 'SELECCION',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    ...overrides,
  }) satisfies ResourceAttributeDefinition
const value = (
  id: string,
  definicionAtributoId = 'definition',
  overrides: Partial<ResourceAllowedAttributeValueItem> = {},
) =>
  ({
    id,
    definicionAtributoId,
    clave: id,
    valor: { kind: 'TEXTO', value: id },
    nombre: id,
    orden: 1,
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    ...overrides,
  }) satisfies ResourceAllowedAttributeValueItem
const page = (
  items = [value('a')],
  continuationCursor: string | null = null,
  isExhausted = true,
): Page => ({
  items,
  continuationCursor,
  isExhausted,
})
const api = (listAllowedAttributeValues = vi.fn(async () => page())) =>
  ({ listAllowedAttributeValues }) as Api
const request = (cursor: string | null) => ({
  definicionAtributoId: 'definition',
  cursor,
  pageSize: 20,
  modo: 'ACTIVE' as const,
})
const knowledge = (
  definitionId: string,
  status: 'PARTIAL' | 'EXHAUSTED',
  values: ResourceAllowedAttributeValueItem[],
) => ({ [definitionId]: { status, values } })
const clients: QueryClient[] = []
const renderAllowedValues = (
  resourceApi: Api,
  currentAssignment: ResourceResolvedCreationAssignment | null = assignment(),
  currentDefinition: ResourceAttributeDefinition | null = definition(),
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(client)
  return renderHook(
    (props) => useResourceCreationAllowedValues({ api: resourceApi, ...props }),
    {
      initialProps: {
        assignment: currentAssignment,
        definition: currentDefinition,
      },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
}
const ids = (items: readonly ResourceAllowedAttributeValueItem[]) =>
  items.map((item) => item.id)
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
})
describe('useResourceCreationAllowedValues', () => {
  it('is idle without an exact usable selection pair', async () => {
    const list = vi.fn(async () => page())
    const mounted = renderAllowedValues(api(list), null, null)
    const invalid = [
      [null, null],
      [assignment(), null],
      [assignment('other'), definition()],
      [assignment(), definition('definition', { activo: false })],
      [assignment(), definition('definition', { effective: false })],
      [assignment(), definition('definition', { modoCaptura: 'LIBRE' })],
    ] as const
    for (const [currentAssignment, currentDefinition] of invalid) {
      mounted.rerender({
        assignment: currentAssignment,
        definition: currentDefinition,
      })
      expect(mounted.result.current.status).toBe('idle')
      await expect(mounted.result.current.continue()).resolves.toBeUndefined()
      await expect(mounted.result.current.retry()).resolves.toBeUndefined()
    }
    expect(list).not.toHaveBeenCalled()
  })
  it('requests the exact initial page with partial current-definition knowledge', async () => {
    const first = deferred<Page>()
    const list = vi.fn(() => first.promise)
    const mounted = renderAllowedValues(api(list))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    expect(list).toHaveBeenCalledWith(request(null))
    expect(mounted.result.current.status).toBe('loading')
    expect(mounted.result.current.knowledge).toEqual({})
    first.resolve(page([value('a')], 'next', false))
    await waitFor(() => expect(mounted.result.current.hasNextPage).toBe(true))
    expect(mounted.result.current.knowledge).toEqual(
      knowledge('definition', 'PARTIAL', [value('a')]),
    )
  })
  it('continues, filters/dedupes in backend order, and exhausts knowledge', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(
        page(
          [
            value('a'),
            value('inactive', 'definition', { activo: false }),
            value('foreign', 'other'),
          ],
          'next',
          false,
        ),
      )
      .mockResolvedValueOnce(
        page([
          value('ineffective', 'definition', { effective: false }),
          value('a'),
          value('b'),
        ]),
      )
    const mounted = renderAllowedValues(api(list))
    await waitFor(() => expect(mounted.result.current.hasNextPage).toBe(true))
    await mounted.result.current.continue()
    expect(list.mock.calls.map(([input]) => input)).toEqual([
      request(null),
      request('next'),
    ])
    await waitFor(() =>
      expect(ids(mounted.result.current.values)).toEqual(['a', 'b']),
    )
    expect(mounted.result.current.knowledge).toEqual(
      knowledge('definition', 'EXHAUSTED', [value('a'), value('b')]),
    )
    expect(mounted.result.current.hasNextPage).toBe(false)
  })
  it('fails closed for a missing cursor and retries it', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(page([value('invalid')], null, false))
      .mockResolvedValueOnce(page([value('recovered')]))
    const mounted = renderAllowedValues(api(list))
    await waitFor(() => expect(mounted.result.current.status).toBe('error'))
    expect(mounted.result.current.values).toEqual([])
    await mounted.result.current.retry()
    await waitFor(() =>
      expect(ids(mounted.result.current.values)).toEqual(['recovered']),
    )
  })
  it('retries initial and failed continuation requests while retaining pages', async () => {
    const initial = vi
      .fn()
      .mockRejectedValueOnce(new Error('initial'))
      .mockResolvedValueOnce(page([value('recovered')]))
    const initialMounted = renderAllowedValues(api(initial))
    await waitFor(() =>
      expect(initialMounted.result.current.status).toBe('error'),
    )
    await initialMounted.result.current.retry()
    await waitFor(() =>
      expect(ids(initialMounted.result.current.values)).toEqual(['recovered']),
    )
    const list = vi
      .fn()
      .mockResolvedValueOnce(page([value('first')], 'next', false))
      .mockRejectedValueOnce(new Error('next'))
      .mockResolvedValueOnce(page([value('second')]))
    const mounted = renderAllowedValues(api(list))
    await waitFor(() => expect(mounted.result.current.hasNextPage).toBe(true))
    await mounted.result.current.continue()
    await waitFor(() => expect(mounted.result.current.status).toBe('error'))
    expect(ids(mounted.result.current.values)).toEqual(['first'])
    await mounted.result.current.retry()
    await waitFor(() =>
      expect(ids(mounted.result.current.values)).toEqual(['first', 'second']),
    )
    expect(list.mock.calls.slice(1).map(([input]) => input.cursor)).toEqual([
      'next',
      'next',
    ])
  })
  it('hides old pages during a deferred stale definition switch', async () => {
    const stale = deferred<Page>()
    const fresh = deferred<Page>()
    const list = vi.fn(({ definicionAtributoId }) =>
      definicionAtributoId === 'old' ? stale.promise : fresh.promise,
    )
    const mounted = renderAllowedValues(
      api(list),
      assignment('old'),
      definition('old'),
    )
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
    mounted.rerender({
      assignment: assignment('new'),
      definition: definition('new'),
    })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(mounted.result.current.status).toBe('loading')
    stale.resolve(page([value('stale', 'old')]))
    await act(async () => undefined)
    expect(mounted.result.current.values).toEqual([])
    fresh.resolve(page([value('fresh', 'new')]))
    await waitFor(() =>
      expect(ids(mounted.result.current.values)).toEqual(['fresh']),
    )
  })
})

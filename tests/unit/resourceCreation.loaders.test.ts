import { describe, expect, it, vi } from 'vitest'
import {
  createDependentLoader,
  createUnitCandidateHydrator,
  createUnitPolicyPageController,
} from '../../src/features/resources-master/resourceCreation.loaders'
import type {
  ResourceUnitDetail,
  ResourceUnitPolicy,
} from '../../src/features/resources-master/resourcesMaster.types'

type Item = { id: string; name: string }
type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const policy = (
  id: string,
  unidadId: string,
  overrides: Partial<ResourceUnitPolicy> = {},
): ResourceUnitPolicy => ({
  id,
  familiaRecursoId: 'family-a',
  tipoRecursoId: 'type-a',
  unidadId,
  principal: false,
  activo: true,
  revision: 1,
  effective: true,
  selected: false,
  shadowed: false,
  selection: 'NONE',
  ...overrides,
})

const policyPage = (
  items: ResourceUnitPolicy[],
  continuationCursor: string | null,
  isExhausted = false,
) => ({ items, continuationCursor, isExhausted })

const unitDetail = (
  id: string,
  overrides: Partial<ResourceUnitDetail> = {},
): ResourceUnitDetail => ({
  id,
  clave: `U-${id}`,
  nombre: `Unidad ${id}`,
  simbolo: 'u',
  activo: true,
  revision: 1,
  effective: true,
  ...overrides,
})

const policySetup = () => {
  const requests: Deferred<ReturnType<typeof policyPage>>[] = []
  const loadPolicies = vi.fn(() => {
    const request = deferred<ReturnType<typeof policyPage>>()
    requests.push(request)
    return request.promise
  })
  return {
    loadPolicies,
    requests,
    controller: createUnitPolicyPageController({
      identity: (value) => String(value),
      loadPolicies,
    }),
  }
}

const page = (
  items: Item[],
  continuationCursor: string | null,
  isExhausted = false,
) => ({ items, continuationCursor, isExhausted })

const setup = () => {
  const requests: Deferred<ReturnType<typeof page>>[] = []
  const load = vi.fn(() => {
    const request = deferred<ReturnType<typeof page>>()
    requests.push(request)
    return request.promise
  })
  return {
    load,
    requests,
    loader: createDependentLoader<Item>({ identity: (item) => item.id, load }),
  }
}

describe('dependent loader', () => {
  it('loads an initial page and retries its exact context after an initial error', async () => {
    const { loader, load, requests } = setup()
    loader.setContext('class-a')

    const first = loader.start()
    expect(loader.getState()).toMatchObject({
      status: 'loading',
      contextKey: 'class-a',
    })
    expect(load).toHaveBeenLastCalledWith({
      contextKey: 'class-a',
      cursor: null,
    })
    requests[0]!.reject(new Error('offline'))
    expect(await first).toBe(false)
    expect(loader.getState()).toMatchObject({
      status: 'initial-error',
      retry: 'initial',
    })

    const retry = loader.retry()
    expect(load).toHaveBeenLastCalledWith({
      contextKey: 'class-a',
      cursor: null,
    })
    requests[1]!.resolve(page([{ id: 'a', name: 'A' }], 'next'))
    expect(await retry).toBe(true)
    expect(loader.getState()).toMatchObject({
      status: 'ready',
      items: [{ id: 'a' }],
    })
  })

  it('reports an exhausted initial page with no candidates as empty', async () => {
    const { loader, requests } = setup()
    loader.setContext('class-empty')
    const initial = loader.start()
    requests[0]!.resolve(page([], null, true))

    expect(await initial).toBe(true)
    expect(loader.getState()).toEqual({
      status: 'empty',
      contextKey: 'class-empty',
      items: [],
      exhausted: true,
    })
  })

  it('retains first appearances and retries the failed continuation with its captured cursor', async () => {
    const { loader, load, requests } = setup()
    loader.setContext('family-a')
    const first = loader.start()
    requests[0]!.resolve(page([{ id: 'a', name: 'first' }], 'next'))
    await first

    const more = loader.continue()
    expect(load).toHaveBeenLastCalledWith({
      contextKey: 'family-a',
      cursor: 'next',
    })
    requests[1]!.reject(new Error('offline'))
    expect(await more).toBe(false)
    expect(loader.getState()).toMatchObject({
      status: 'partial-error',
      items: [{ id: 'a' }],
    })

    const retry = loader.retry()
    expect(load).toHaveBeenLastCalledWith({
      contextKey: 'family-a',
      cursor: 'next',
    })
    requests[2]!.resolve(
      page(
        [
          { id: 'a', name: 'later' },
          { id: 'b', name: 'B' },
        ],
        null,
        true,
      ),
    )
    expect(await retry).toBe(true)
    expect(loader.getState()).toMatchObject({
      status: 'ready',
      exhausted: true,
      items: [
        { id: 'a', name: 'first' },
        { id: 'b', name: 'B' },
      ],
    })
  })

  it('rejects repeated non-exhausted cursors as recoverable continuation errors', async () => {
    const { loader, requests } = setup()
    loader.setContext('type-a')
    const first = loader.start()
    requests[0]!.resolve(page([{ id: 'a', name: 'A' }], 'loop'))
    await first

    const more = loader.continue()
    requests[1]!.resolve(page([{ id: 'b', name: 'B' }], 'loop'))
    expect(await more).toBe(false)
    expect(loader.getState()).toMatchObject({
      status: 'partial-error',
      retry: 'continuation',
      items: [{ id: 'a' }, { id: 'b' }],
    })
  })

  it('invalidates out-of-order parent and Tipo responses when their context changes', async () => {
    const { loader, requests } = setup()
    loader.setContext('parent-a')
    const staleParent = loader.start()
    loader.setContext('parent-b')
    const currentParent = loader.start()
    requests[1]!.resolve(page([{ id: 'b', name: 'B' }], 'tipo-a'))
    await currentParent

    const staleTipo = loader.continue()
    loader.setContext('parent-c')
    requests[0]!.resolve(page([{ id: 'a', name: 'A' }], null, true))
    requests[2]!.resolve(page([{ id: 'stale', name: 'stale' }], null, true))
    expect(await staleParent).toBe(false)
    expect(await staleTipo).toBe(false)
    expect(loader.getState()).toEqual({
      status: 'idle',
      contextKey: null,
      items: [],
    })
  })
})

describe('Unit policy page controller', () => {
  it('requests Tipo-scoped pages and retains ordered eligible unit references', async () => {
    const { controller, loadPolicies, requests } = policySetup()
    controller.setTipo('type-a')

    const first = controller.start()
    expect(loadPolicies).toHaveBeenLastCalledWith({
      tipoRecursoId: 'type-a',
      cursor: null,
    })
    requests[0]!.resolve(
      policyPage(
        [
          policy('p-inactive', 'u-ignored', { activo: false }),
          policy('p-shadowed', 'u-ignored', { shadowed: true }),
          policy('p-ineffective', 'u-ignored', { effective: false }),
          policy('p-first', 'u-a'),
          policy('p-second', 'u-b', { selected: true }),
        ],
        'next',
      ),
    )
    expect(await first).toBe(true)

    const more = controller.continue()
    expect(loadPolicies).toHaveBeenLastCalledWith({
      tipoRecursoId: 'type-a',
      cursor: 'next',
    })
    requests[1]!.resolve(
      policyPage(
        [
          policy('p-first', 'u-later', { principal: true, selected: true }),
          policy('p-third', 'u-a'),
          policy('p-suppressed', 'u-c', { selection: 'SUPPRESSED' }),
        ],
        null,
        true,
      ),
    )
    expect(await more).toBe(true)
    expect(controller.getState()).toMatchObject({
      status: 'ready',
      exhausted: true,
      references: [
        {
          policyId: 'p-first',
          unidadId: 'u-a',
          principal: true,
          selected: true,
        },
        {
          policyId: 'p-second',
          unidadId: 'u-b',
          principal: false,
          selected: true,
        },
      ],
    })
  })

  it('rejects stale Tipo pages without replacing the current ordered references', async () => {
    const { controller, requests } = policySetup()
    controller.setTipo('type-a')
    const stale = controller.start()
    controller.setTipo('type-b')
    const current = controller.start()
    requests[1]!.resolve(policyPage([policy('p-b', 'u-b')], null, true))
    await current
    requests[0]!.resolve(policyPage([policy('p-a', 'u-a')], null, true))

    expect(await stale).toBe(false)
    expect(controller.getState()).toMatchObject({
      status: 'ready',
      tipoId: 'type-b',
      references: [{ policyId: 'p-b', unidadId: 'u-b' }],
    })
  })

  it('keeps collected references when a non-exhausted cursor repeats', async () => {
    const { controller, requests } = policySetup()
    controller.setTipo('type-a')
    const first = controller.start()
    requests[0]!.resolve(policyPage([policy('p-a', 'u-a')], 'loop'))
    await first

    const more = controller.continue()
    requests[1]!.resolve(policyPage([policy('p-b', 'u-b')], 'loop'))
    expect(await more).toBe(false)
    expect(controller.getState()).toMatchObject({
      status: 'partial-error',
      retry: 'continuation',
      references: [
        { policyId: 'p-a', unidadId: 'u-a' },
        { policyId: 'p-b', unidadId: 'u-b' },
      ],
    })
  })
})

describe('Unit candidate hydration', () => {
  const setup = () => {
    const requests: Deferred<ResourceUnitDetail | null>[] = []
    const getUnit = vi.fn(() => {
      const request = deferred<ResourceUnitDetail | null>()
      requests.push(request)
      return request.promise
    })
    return {
      getUnit,
      requests,
      hydrator: createUnitCandidateHydrator({
        identity: (value) => String(value),
        getUnit,
      }),
    }
  }

  it('hydrates one unique ordered policy snapshot into flat eligible candidates', async () => {
    const { hydrator, getUnit, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: 'next',
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: true },
        { policyId: 'p-b', unidadId: 'u-a', principal: true, selected: false },
        { policyId: 'p-c', unidadId: 'u-b', principal: false, selected: false },
        { policyId: 'p-d', unidadId: 'u-c', principal: false, selected: false },
      ],
    })

    const first = hydrator.start()
    expect(hydrator.start()).toBe(first)
    expect(getUnit).toHaveBeenCalledTimes(3)
    expect(getUnit).toHaveBeenNthCalledWith(1, { unidadId: 'u-a' })
    expect(getUnit).toHaveBeenNthCalledWith(2, { unidadId: 'u-b' })
    expect(getUnit).toHaveBeenNthCalledWith(3, { unidadId: 'u-c' })
    requests[0]!.resolve(unitDetail('u-a'))
    requests[1]!.resolve(unitDetail('u-b', { activo: false }))
    requests[2]!.resolve(null)

    expect(await first).toBe(true)
    const state = hydrator.getState()
    expect(state.status).toBe('ready')
    expect(state.candidates).toEqual([
      {
        unidadId: 'u-a',
        clave: 'U-u-a',
        nombre: 'Unidad u-a',
        simbolo: 'u',
        principal: true,
        selected: true,
      },
    ])
    expect(state.failedUnitIds).toEqual([])
  })

  it('retains resolved candidates and exposes ordered failed identities', async () => {
    const { hydrator, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
        { policyId: 'p-b', unidadId: 'u-b', principal: false, selected: false },
        { policyId: 'p-c', unidadId: 'u-c', principal: false, selected: false },
      ],
    })

    const result = hydrator.start()
    requests[0]!.resolve(unitDetail('u-a'))
    requests[1]!.reject(new Error('offline'))
    requests[2]!.reject(new Error('timeout'))

    expect(await result).toBe(false)
    expect(hydrator.getState()).toMatchObject({
      status: 'partial-error',
      candidates: [expect.objectContaining({ unidadId: 'u-a' })],
      failedUnitIds: ['u-b', 'u-c'],
    })
  })

  it('rejects superseded Tipo or policy snapshots and hydrates the latest generation', async () => {
    const { hydrator, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: 'cursor-a',
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
      ],
    })
    const stale = hydrator.start()
    const previous = hydrator.getState()
    hydrator.setSnapshot({
      tipoId: 'type-b',
      cursor: 'cursor-b',
      references: [
        { policyId: 'p-b', unidadId: 'u-b', principal: false, selected: true },
      ],
    })
    const current = hydrator.start()
    expect(hydrator.getState()).toMatchObject({
      status: 'loading',
      tipoId: 'type-b',
    })
    expect(hydrator.getState().generation).toBeGreaterThan(previous.generation)
    expect(hydrator.getState().snapshotSignature).not.toBe(
      previous.snapshotSignature,
    )

    requests[0]!.resolve(unitDetail('u-a'))
    requests[1]!.resolve(unitDetail('u-b'))

    expect(await stale).toBe(false)
    expect(await current).toBe(true)
    expect(hydrator.getState()).toMatchObject({
      status: 'ready',
      tipoId: 'type-b',
      candidates: [
        expect.objectContaining({ unidadId: 'u-b', selected: true }),
      ],
    })
  })

  it('reports confirmed empty eligibility after all details resolve null or inactive', async () => {
    const { hydrator, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-empty',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
        { policyId: 'p-b', unidadId: 'u-b', principal: false, selected: false },
      ],
    })
    const result = hydrator.start()
    requests[0]!.resolve(null)
    requests[1]!.resolve(unitDetail('u-b', { activo: false }))

    expect(await result).toBe(true)
    expect(hydrator.getState()).toMatchObject({
      status: 'empty',
      tipoId: 'type-empty',
      candidates: [],
      failedUnitIds: [],
    })
  })

  it('retries only failed identities once and restores them in policy order', async () => {
    const { hydrator, getUnit, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
        { policyId: 'p-b', unidadId: 'u-b', principal: true, selected: false },
        { policyId: 'p-c', unidadId: 'u-c', principal: false, selected: true },
      ],
    })
    const first = hydrator.start()
    requests[0]!.resolve(unitDetail('u-a'))
    requests[1]!.reject(new Error('offline'))
    requests[2]!.reject(new Error('timeout'))
    expect(await first).toBe(false)

    const retry = hydrator.retry()
    expect(hydrator.retry()).toBe(retry)
    expect(getUnit).toHaveBeenCalledTimes(5)
    expect(getUnit).toHaveBeenNthCalledWith(4, { unidadId: 'u-b' })
    expect(getUnit).toHaveBeenNthCalledWith(5, { unidadId: 'u-c' })
    requests[3]!.resolve(unitDetail('u-b'))
    requests[4]!.resolve(unitDetail('u-c'))

    expect(await retry).toBe(true)
    expect(hydrator.getState()).toMatchObject({
      status: 'ready',
      candidates: [
        expect.objectContaining({ unidadId: 'u-a' }),
        expect.objectContaining({ unidadId: 'u-b', principal: true }),
        expect.objectContaining({ unidadId: 'u-c', selected: true }),
      ],
      failedUnitIds: [],
    })
  })

  it('keeps a failed retry recoverable until its ordered candidate resolves', async () => {
    const { hydrator, getUnit, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
        { policyId: 'p-b', unidadId: 'u-b', principal: false, selected: false },
        { policyId: 'p-c', unidadId: 'u-c', principal: false, selected: false },
      ],
    })
    const first = hydrator.start()
    requests[0]!.resolve(unitDetail('u-a'))
    requests[1]!.reject(new Error('offline'))
    requests[2]!.reject(new Error('timeout'))
    await first

    const firstRetry = hydrator.retry()
    requests[3]!.resolve(unitDetail('u-b'))
    requests[4]!.reject(new Error('still offline'))
    expect(await firstRetry).toBe(false)
    expect(hydrator.getState()).toMatchObject({
      status: 'partial-error',
      candidates: [
        expect.objectContaining({ unidadId: 'u-a' }),
        expect.objectContaining({ unidadId: 'u-b' }),
      ],
      failedUnitIds: ['u-c'],
    })

    const finalRetry = hydrator.retry()
    expect(getUnit).toHaveBeenLastCalledWith({ unidadId: 'u-c' })
    requests[5]!.resolve(unitDetail('u-c'))
    expect(await finalRetry).toBe(true)
    expect(
      hydrator.getState().candidates.map(({ unidadId }) => unidadId),
    ).toEqual(['u-a', 'u-b', 'u-c'])
  })

  it('does not call details when retry has no failed identities', async () => {
    const { hydrator, getUnit, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
      ],
    })
    const first = hydrator.start()
    requests[0]!.resolve(unitDetail('u-a'))
    expect(await first).toBe(true)

    expect(await hydrator.retry()).toBe(false)
    expect(getUnit).toHaveBeenCalledTimes(1)
  })

  it('rejects a stale retry without clearing a newer pending snapshot', async () => {
    const { hydrator, requests } = setup()
    hydrator.setSnapshot({
      tipoId: 'type-a',
      cursor: null,
      references: [
        { policyId: 'p-a', unidadId: 'u-a', principal: false, selected: false },
      ],
    })
    const first = hydrator.start()
    requests[0]!.reject(new Error('offline'))
    await first

    const staleRetry = hydrator.retry()
    hydrator.setSnapshot({
      tipoId: 'type-b',
      cursor: null,
      references: [
        { policyId: 'p-b', unidadId: 'u-b', principal: false, selected: true },
      ],
    })
    const current = hydrator.start()
    requests[1]!.resolve(unitDetail('u-a'))

    expect(await staleRetry).toBe(false)
    expect(hydrator.start()).toBe(current)
    requests[2]!.resolve(unitDetail('u-b'))
    expect(await current).toBe(true)
    expect(hydrator.getState()).toMatchObject({
      status: 'ready',
      tipoId: 'type-b',
      candidates: [expect.objectContaining({ unidadId: 'u-b' })],
    })
  })
})

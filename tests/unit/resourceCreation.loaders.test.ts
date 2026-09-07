import { describe, expect, it, vi } from 'vitest'
import {
  createDependentLoader,
  createUnitPolicyPageController,
} from '../../src/features/resources-master/resourceCreation.loaders'
import type { ResourceUnitPolicy } from '../../src/features/resources-master/resourcesMaster.types'

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

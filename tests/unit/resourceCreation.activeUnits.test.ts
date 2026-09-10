import { describe, expect, it, vi } from 'vitest'
import { createActiveUnitPageController } from '../../src/features/resources-master/resourceCreation.activeUnits'
import type { ResourceUnitDetail } from '../../src/features/resources-master/resourcesMaster.types'

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

const unit = (
  id: string,
  overrides: Partial<ResourceUnitDetail> = {},
): ResourceUnitDetail => ({
  id,
  clave: `U-${id}`,
  nombre: `Unidad ${id}`,
  simbolo: 'u',
  activo: true,
  effective: true,
  revision: 1,
  ...overrides,
})

const page = (
  items: ResourceUnitDetail[],
  continuationCursor: string | null,
  isExhausted = false,
) => ({ items, continuationCursor, isExhausted })

const setup = (pageSize?: number) => {
  const requests: Deferred<ReturnType<typeof page>>[] = []
  const listUnits = vi.fn(() => {
    const request = deferred<ReturnType<typeof page>>()
    requests.push(request)
    return request.promise
  })
  return {
    api: { listUnits },
    controller: createActiveUnitPageController({
      api: { listUnits },
      ...(pageSize === undefined ? {} : { pageSize }),
    }),
    listUnits,
    requests,
  }
}

describe('active Unit page controller', () => {
  it('loads only ACTIVE Units, filters defensively, deduplicates first-seen pages, and retains an opening across Family or Type changes', async () => {
    const { controller, listUnits, requests } = setup(20)
    controller.open('opening-1')
    const first = controller.start()
    expect(listUnits).toHaveBeenLastCalledWith({
      modo: 'ACTIVE',
      cursor: null,
      pageSize: 20,
    })
    expect(await controller.continue()).toBe(false)
    requests[0]!.resolve(
      page(
        [
          unit('a'),
          unit('inactive', { activo: false }),
          unit('ineffective', { effective: false }),
          unit('b'),
        ],
        'next',
      ),
    )
    expect(await first).toBe(true)
    const initialState = controller.getState()
    expect(initialState.status).toBe('ready')
    expect(initialState.candidates).toEqual([
      { unidadId: 'a', clave: 'U-a', nombre: 'Unidad a', simbolo: 'u' },
      { unidadId: 'b', clave: 'U-b', nombre: 'Unidad b', simbolo: 'u' },
    ])

    controller.open('opening-1')
    expect(controller.getState()).toMatchObject({
      status: 'ready',
      candidates: [{ unidadId: 'a' }, { unidadId: 'b' }],
    })
    const more = controller.continue()
    expect(listUnits).toHaveBeenLastCalledWith({
      modo: 'ACTIVE',
      cursor: 'next',
      pageSize: 20,
    })
    requests[1]!.resolve(
      page([unit('a', { nombre: 'Later' }), unit('c')], null, true),
    )
    expect(await more).toBe(true)
    expect(controller.getState()).toMatchObject({
      exhausted: true,
      candidates: [
        { unidadId: 'a', nombre: 'Unidad a' },
        { unidadId: 'b' },
        { unidadId: 'c' },
      ],
    })
  })

  it('retries the exact failed cursor, keeps empty non-exhausted pages loadable, and stops repeated cursors', async () => {
    const { controller, listUnits, requests } = setup(20)
    controller.open('opening-1')
    const initial = controller.start()
    requests[0]!.reject(new Error('offline'))
    expect(await initial).toBe(false)
    const initialRetry = controller.retry()
    expect(listUnits).toHaveBeenLastCalledWith({
      modo: 'ACTIVE',
      cursor: null,
      pageSize: 20,
    })
    requests[1]!.resolve(page([unit('a')], 'next'))
    await initialRetry

    const failedMore = controller.continue()
    requests[2]!.reject(new Error('offline'))
    expect(await failedMore).toBe(false)
    const partialRetry = controller.retry()
    expect(listUnits).toHaveBeenLastCalledWith({
      modo: 'ACTIVE',
      cursor: 'next',
      pageSize: 20,
    })
    requests[3]!.resolve(page([], 'later'))
    expect(await partialRetry).toBe(true)
    const afterEmpty = controller.continue()
    expect(listUnits).toHaveBeenLastCalledWith({
      modo: 'ACTIVE',
      cursor: 'later',
      pageSize: 20,
    })
    requests[4]!.resolve(page([unit('b')], 'later'))
    expect(await afterEmpty).toBe(false)
    expect(controller.getState()).toMatchObject({
      status: 'partial-error',
      retry: 'continuation',
      candidates: [{ unidadId: 'a' }, { unidadId: 'b' }],
    })
  })

  it('leaves optional page size absent and reaches empty only after an exhausted page', async () => {
    const { controller, listUnits, requests } = setup()
    expect(await controller.start()).toBe(false)
    expect(listUnits).not.toHaveBeenCalled()
    controller.open('empty')
    const initial = controller.start()
    expect(listUnits).toHaveBeenLastCalledWith({ modo: 'ACTIVE', cursor: null })
    requests[0]!.resolve(page([], null, true))
    expect(await initial).toBe(true)
    expect(controller.getState()).toEqual({
      status: 'empty',
      contextKey: 'empty',
      candidates: [],
      exhausted: true,
    })
  })

  it('isolates stale success, error, and finally work, then cancels and resets on reopen without mixing generations', async () => {
    const { controller, requests } = setup(20)
    controller.open('old')
    const old = controller.start()
    controller.open('current')
    const current = controller.start()
    requests[0]!.resolve(page([unit('old')], null, true))
    expect(await old).toBe(false)
    expect(await controller.start()).toBe(false)

    controller.open('newer')
    const newer = controller.start()
    requests[1]!.reject(new Error('stale'))
    expect(await current).toBe(false)
    expect(await controller.start()).toBe(false)
    requests[2]!.resolve(page([unit('newer')], null, true))
    expect(await newer).toBe(true)
    expect(controller.getState()).toMatchObject({
      candidates: [{ unidadId: 'newer' }],
    })

    controller.close()
    expect(controller.getState()).toEqual({
      status: 'idle',
      contextKey: null,
      candidates: [],
    })
    controller.open('reopened')
    const reopened = controller.start()
    requests[3]!.resolve(page([unit('reopened')], null, true))
    await reopened
    expect(controller.getState()).toMatchObject({
      candidates: [{ unidadId: 'reopened' }],
    })
  })
})

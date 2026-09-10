import { describe, expect, it, vi } from 'vitest'
import { createDependentLoader } from '../../src/features/resources-master/resourceCreation.loaders'

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

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  useCatalogTypeEffectiveAttributes,
  type CatalogTypeEffectiveAttributesContext,
} from '../../src/features/catalog-hierarchy/useCatalogTypeEffectiveAttributes'
import type {
  CatalogTypeEffectiveAttributesApi,
  EffectiveAttribute,
  EffectiveAttributesResponse,
} from '../../src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.types'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}
const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
const context = (overrides: CatalogTypeEffectiveAttributesContext = {}) => ({
  classCode: 'class-a',
  familyCode: 'family-a',
  typeCode: 'type-a',
  ...overrides,
})
const attribute = (code: string, option: string) =>
  ({
    characteristic: { code },
    options: [{ code: option, label: option }],
  }) as EffectiveAttribute
const response = (typeCode = 'type-a', attributes: EffectiveAttribute[] = []) =>
  ({ typeCode, attributes }) satisfies EffectiveAttributesResponse
const api = (getEffectiveAttributes = vi.fn()) =>
  ({ getEffectiveAttributes }) as CatalogTypeEffectiveAttributesApi
const renderDriver = (
  value: CatalogTypeEffectiveAttributesContext,
  injectedApi: CatalogTypeEffectiveAttributesApi,
) =>
  renderHook(
    ({ value, api }) => useCatalogTypeEffectiveAttributes(api, value),
    {
      initialProps: { value, api: injectedApi },
    },
  )
const calls = (fn: ReturnType<typeof vi.fn>, count: number) =>
  waitFor(() => expect(fn).toHaveBeenCalledTimes(count))

describe('useCatalogTypeEffectiveAttributes', () => {
  it('waits for complete context, captures exact codes, and preserves Core order', async () => {
    const ordered = [attribute('first', 'one'), attribute('second', 'two')]
    const get = vi.fn().mockResolvedValue(response('type-a', ordered))
    const currentApi = api(get)
    const mounted = renderDriver({ classCode: 'class-a' }, currentApi)
    expect(mounted.result.current).toMatchObject({
      status: 'waiting-context',
      attributes: [],
      selectedAttributeCode: null,
    })
    expect(get).not.toHaveBeenCalled()

    mounted.rerender({ value: context(), api: currentApi })
    expect(mounted.result.current).toMatchObject({
      status: 'loading',
      attributes: [],
    })
    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    expect(get).toHaveBeenCalledWith({
      ...context(),
      signal: expect.any(AbortSignal),
    })
    expect(mounted.result.current.attributes).toBe(ordered)
  })

  it.each([
    ['classCode', 'class-b'],
    ['familyCode', 'family-b'],
    ['typeCode', 'type-b'],
  ] as const)(
    'atomically clears data, error, and selection for changed %s',
    async (code, value) => {
      const first = deferred<EffectiveAttributesResponse>()
      const second = deferred<EffectiveAttributesResponse>()
      const get = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
      const currentApi = api(get)
      const mounted = renderDriver(context(), currentApi)
      await calls(get, 1)
      await act(async () =>
        first.resolve(response('type-a', [attribute('a', 'a')])),
      )
      await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
      act(() => mounted.result.current.selectAttribute('attribute-a'))

      mounted.rerender({ value: context({ [code]: value }), api: currentApi })
      expect(mounted.result.current).toMatchObject({
        status: 'loading',
        attributes: [],
        error: null,
        selectedAttributeCode: null,
      })
      await calls(get, 2)
      await act(async () => second.reject(new Error('offline')))
      await waitFor(() => expect(mounted.result.current.status).toBe('error'))
      expect(mounted.result.current.attributes).toEqual([])
    },
  )

  it('confirms empty, retries only the current error, and blocks duplicate sends', async () => {
    const first = deferred<EffectiveAttributesResponse>()
    const second = deferred<EffectiveAttributesResponse>()
    const third = deferred<EffectiveAttributesResponse>()
    const get = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const currentApi = api(get)
    const mounted = renderDriver(context(), currentApi)
    await act(async () => first.resolve(response()))
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    act(() => mounted.result.current.retry())
    expect(get).toHaveBeenCalledTimes(1)

    const value = context({ familyCode: 'family-b' })
    mounted.rerender({ value, api: currentApi })
    await calls(get, 2)
    await act(async () => second.reject(new Error('offline')))
    await waitFor(() => expect(mounted.result.current.status).toBe('error'))
    const latestApi = api(vi.fn().mockReturnValue(third.promise))
    mounted.rerender({ value, api: latestApi })
    expect(latestApi.getEffectiveAttributes).not.toHaveBeenCalled()
    act(() => {
      mounted.result.current.retry()
      mounted.result.current.retry()
    })
    await calls(latestApi.getEffectiveAttributes, 1)
    expect(latestApi.getEffectiveAttributes).toHaveBeenCalledWith({
      ...value,
      signal: expect.any(AbortSignal),
    })
    await act(async () => third.resolve(response()))
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
  })

  it('rejects stale A-B-A work and cannot commit after unmount', async () => {
    const first = deferred<EffectiveAttributesResponse>()
    const second = deferred<EffectiveAttributesResponse>()
    const third = deferred<EffectiveAttributesResponse>()
    const get = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise)
    const currentApi = api(get)
    const mounted = renderDriver(context(), currentApi)
    await calls(get, 1)
    mounted.rerender({
      value: context({ typeCode: 'type-b' }),
      api: currentApi,
    })
    await calls(get, 2)
    mounted.rerender({ value: context(), api: currentApi })
    await calls(get, 3)
    expect(get.mock.calls[0]?.[0].signal.aborted).toBe(true)
    expect(get.mock.calls[1]?.[0].signal.aborted).toBe(true)
    await act(() => {
      first.resolve(response())
      second.reject(new Error('stale'))
    })
    expect(mounted.result.current).toMatchObject({
      status: 'loading',
      attributes: [],
    })

    const beforeUnmount = mounted.result.current
    mounted.unmount()
    expect(get.mock.calls[2]?.[0].signal.aborted).toBe(true)
    await act(() =>
      third.resolve(response('type-a', [attribute('current', 'current')])),
    )
    expect(mounted.result.current).toBe(beforeUnmount)
  })
})

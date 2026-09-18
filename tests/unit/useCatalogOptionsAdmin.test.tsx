import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CatalogOptionsAdminConflictError,
  CatalogOptionsAdminHttpError,
} from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.api'
import {
  useCatalogOptionsAdmin,
  type CatalogOptionsAdminContext,
} from '../../src/features/catalog-hierarchy/useCatalogOptionsAdmin'
import type {
  CatalogOptionsAdminApi,
  CatalogOptionsAdminPage,
} from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.types'

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
const page = (
  records = [],
  flags: Pick<CatalogOptionsAdminPage, 'hasPrevious' | 'hasNext'> = {
    hasPrevious: false,
    hasNext: false,
  },
): CatalogOptionsAdminPage => ({ records, ...flags })
const optionContext = (overrides: CatalogOptionsAdminContext = {}) => ({
  sessionId: 'dialog-1',
  classCode: 'class-a',
  familyCode: 'family-a',
  typeCode: 'type-a',
  optionSetCode: 'DEFAULT',
  characteristicCode: 'insulation',
  ...overrides,
})
const driver = (
  api: CatalogOptionsAdminApi,
  refresh = vi.fn(),
  value = optionContext(),
) =>
  renderHook(({ value }) => useCatalogOptionsAdmin(api, value, refresh), {
    initialProps: { value },
  })
const calls = (fn: ReturnType<typeof vi.fn>, count: number) =>
  waitFor(() => expect(fn).toHaveBeenCalledTimes(count))

describe('useCatalogOptionsAdmin', () => {
  it('survives StrictMode effect replay for the initial read and command reconciliation', async () => {
    const list = vi.fn().mockResolvedValue(page())
    const refresh = vi.fn()
    const mounted = renderHook(
      () =>
        useCatalogOptionsAdmin(
          { list, create: vi.fn().mockResolvedValue({}) } as never,
          optionContext(),
          refresh,
        ),
      { wrapper: StrictMode },
    )
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    const initialReads = list.mock.calls.length
    await act(async () =>
      mounted.result.current.create({ values: {} } as never),
    )
    expect(list).toHaveBeenCalledTimes(initialReads + 1)
    expect(refresh).toHaveBeenCalledOnce()
    expect(mounted.result.current.commandStatus).toBe('idle')
  })

  it('clears a changed session and rejects an A-B-A stale command', async () => {
    const create = deferred<never>()
    const commandApi = vi.fn(() => create.promise)
    const list = vi.fn().mockResolvedValue(page())
    const refresh = vi.fn()
    const mounted = driver({ list, create: commandApi } as never, refresh)
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    let command!: Promise<void>
    act(() => {
      command = mounted.result.current.create({ values: {} } as never)
    })
    expect(mounted.result.current.commandStatus).toBe('pending')
    mounted.rerender({ value: optionContext({ typeCode: 'type-b' }) })
    await calls(list, 2)
    expect(mounted.result.current).toMatchObject({
      commandStatus: 'idle',
      draft: null,
    })
    mounted.rerender({ value: optionContext() })
    await calls(list, 3)
    await act(async () => create.resolve({} as never))
    await command
    expect(list).toHaveBeenCalledTimes(3)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('keeps a success pending through base reconciliation and triggers effective refresh once', async () => {
    const base = deferred<CatalogOptionsAdminPage>()
    const effective = { promise: Promise.resolve(true) }
    const list = vi
      .fn()
      .mockResolvedValueOnce(page())
      .mockReturnValueOnce(base.promise)
    const refresh = vi.fn(() => effective.promise)
    const commandApi = vi.fn().mockResolvedValue({})
    const mounted = driver({ list, create: commandApi } as never, refresh)
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    let command!: Promise<void>
    act(() => {
      command = mounted.result.current.create({ values: {} } as never)
      void mounted.result.current.create({ values: {} } as never)
    })
    expect(mounted.result.current.commandStatus).toBe('pending')
    expect(commandApi).toHaveBeenCalledOnce()
    await calls(list, 2)
    expect(mounted.result.current.commandStatus).toBe('pending')
    await act(async () => base.resolve(page()))
    await waitFor(() =>
      expect(mounted.result.current.commandStatus).toBe('idle'),
    )
    expect(refresh).toHaveBeenCalledOnce()
    await command
  })

  it('deletes through the authoritative run without optimistic removal', async () => {
    const original = page([{ id: '8' } as never])
    const base = deferred<CatalogOptionsAdminPage>()
    const list = vi
      .fn()
      .mockResolvedValueOnce(original)
      .mockReturnValueOnce(base.promise)
    const refresh = vi.fn().mockResolvedValue(true)
    const remove = vi.fn().mockResolvedValue(undefined)
    const mounted = driver({ list, delete: remove } as never, refresh)
    const input = { id: '8', expectedRevision: '1' }

    await waitFor(() => expect(mounted.result.current.status).toBe('ready'))
    let command!: Promise<boolean | undefined>
    act(() => {
      command = mounted.result.current.delete(input)
    })
    await calls(list, 2)
    expect(mounted.result.current.status).toBe('loading')
    expect(mounted.result.current.commandStatus).toBe('pending')
    await act(async () => base.resolve(page()))
    await expect(command).resolves.toBe(true)
    expect(remove).toHaveBeenCalledWith(input)
    expect(refresh).toHaveBeenCalledOnce()
    expect(mounted.result.current.commandStatus).toBe('idle')
  })

  it('retains a 409 draft but does not unlock conflict before reconciliation', async () => {
    const base = deferred<CatalogOptionsAdminPage>()
    const list = vi
      .fn()
      .mockResolvedValueOnce(page())
      .mockReturnValueOnce(base.promise)
    const input = { id: '8', expectedRevision: '1' }
    const refresh = vi.fn().mockResolvedValue(true)
    const mounted = driver(
      {
        list,
        delete: vi
          .fn()
          .mockRejectedValue(new CatalogOptionsAdminConflictError('conflict')),
      } as never,
      refresh,
    )
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    let command!: Promise<boolean | undefined>
    act(() => {
      command = mounted.result.current.delete(input)
    })
    await calls(list, 2)
    expect(mounted.result.current).toMatchObject({
      commandStatus: 'pending',
      draft: input,
    })
    await act(async () => base.resolve(page()))
    await expect(command).resolves.toBe(false)
    expect(refresh).toHaveBeenCalledOnce()
    expect(mounted.result.current.commandStatus).toBe('conflict')
  })

  it('reports a failed base refresh and unconfirmed network command without fake success', async () => {
    const input = { values: {} } as never
    const failedList = vi
      .fn()
      .mockResolvedValueOnce(page())
      .mockRejectedValueOnce(new Error('base'))
    const failed = driver(
      { list: failedList, create: vi.fn().mockResolvedValue({}) } as never,
      vi.fn(),
    )
    await waitFor(() => expect(failed.result.current.status).toBe('empty'))
    await act(async () => failed.result.current.create(input))
    expect(failed.result.current.commandStatus).toBe('error')
    const list = vi.fn().mockResolvedValue(page())
    const refresh = vi.fn()
    const network = driver(
      {
        list,
        delete: vi
          .fn()
          .mockRejectedValue(
            new CatalogOptionsAdminHttpError(
              409,
              'in use',
              undefined,
              'IN_USE',
            ),
          ),
      } as never,
      refresh,
    )
    await waitFor(() => expect(network.result.current.status).toBe('empty'))
    await act(async () =>
      network.result.current.delete({ id: '8', expectedRevision: '1' }),
    )
    expect(network.result.current.commandStatus).toBe('error')
    expect(network.result.current.commandError).toMatchObject({
      code: 'IN_USE',
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not reconcile or commit a command after unmount', async () => {
    const create = deferred<never>()
    const list = vi.fn().mockResolvedValue(page())
    const refresh = vi.fn()
    const mounted = driver(
      { list, create: vi.fn(() => create.promise) } as never,
      refresh,
    )
    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    const command = mounted.result.current.create({ values: {} } as never)
    mounted.unmount()
    await act(async () => create.resolve({} as never))
    await command
    expect(list).toHaveBeenCalledOnce()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('loads canonical references while an empty list remains ready for creation', async () => {
    const references = deferred<{
      optionSet: { kind: 'CONJUNTO_OPCIONES'; id: string; code: string }
      characteristic: { kind: 'CARACTERISTICA'; id: string; code: string }
    }>()
    const resolveReferences = vi.fn(() => references.promise)
    const mounted = driver({
      list: vi.fn().mockResolvedValue(page()),
      resolveReferences,
    } as never)

    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    expect(mounted.result.current.referenceStatus).toBe('loading')
    expect(resolveReferences).toHaveBeenCalledWith(
      expect.objectContaining({
        optionSetCode: 'DEFAULT',
        characteristicCode: 'insulation',
        signal: expect.any(AbortSignal),
      }),
    )
    await act(async () =>
      references.resolve({
        optionSet: { kind: 'CONJUNTO_OPCIONES', id: '1', code: 'DEFAULT' },
        characteristic: { kind: 'CARACTERISTICA', id: '3', code: 'insulation' },
      }),
    )
    await waitFor(() =>
      expect(mounted.result.current.referenceStatus).toBe('ready'),
    )
    expect(mounted.result.current.references).toMatchObject({
      optionSet: { code: 'DEFAULT' },
      characteristic: { code: 'insulation' },
    })
  })

  it('keeps a pending canonical lookup current while paginating the same context', async () => {
    const references = deferred<{
      optionSet: { kind: 'CONJUNTO_OPCIONES'; id: string; code: string }
      characteristic: { kind: 'CARACTERISTICA'; id: string; code: string }
    }>()
    const resolveReferences = vi.fn(() => references.promise)
    const mounted = driver({
      list: vi
        .fn()
        .mockResolvedValue(page([], { hasPrevious: false, hasNext: true })),
      resolveReferences,
    } as never)

    await waitFor(() => expect(mounted.result.current.status).toBe('empty'))
    expect(mounted.result.current.referenceStatus).toBe('loading')
    act(() => mounted.result.current.next())
    await waitFor(() => expect(mounted.result.current.offset).toBe(20))
    await act(async () =>
      references.resolve({
        optionSet: { kind: 'CONJUNTO_OPCIONES', id: '1', code: 'DEFAULT' },
        characteristic: {
          kind: 'CARACTERISTICA',
          id: '3',
          code: 'insulation',
        },
      }),
    )

    await waitFor(() =>
      expect(mounted.result.current.referenceStatus).toBe('ready'),
    )
  })

  it('retries lookup errors and discards aborted stale A-B-A canonical references', async () => {
    const firstA = deferred<never>()
    const b = deferred<never>()
    const secondA = deferred<never>()
    const recovered = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: 'DEFAULT',
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: 'insulation',
      },
    }
    const resolveReferences = vi
      .fn()
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(b.promise)
      .mockReturnValueOnce(secondA.promise)
      .mockResolvedValueOnce(recovered)
    const mounted = driver({
      list: vi.fn().mockResolvedValue(page()),
      resolveReferences,
    } as never)

    await calls(resolveReferences, 1)
    const firstSignal = resolveReferences.mock.calls[0][0].signal as AbortSignal
    mounted.rerender({ value: optionContext({ typeCode: 'type-b' }) })
    await calls(resolveReferences, 2)
    expect(firstSignal.aborted).toBe(true)
    mounted.rerender({ value: optionContext() })
    await calls(resolveReferences, 3)
    await act(async () => {
      firstA.resolve(recovered as never)
      b.resolve(recovered as never)
      secondA.reject(new Error('lookup unavailable'))
    })
    await waitFor(() =>
      expect(mounted.result.current.referenceStatus).toBe('error'),
    )
    expect(mounted.result.current.references).toBeNull()
    act(() => mounted.result.current.retryReferences())
    await calls(resolveReferences, 4)
    await waitFor(() =>
      expect(mounted.result.current.referenceStatus).toBe('ready'),
    )
    expect(mounted.result.current.references).toEqual(recovered)
  })
})

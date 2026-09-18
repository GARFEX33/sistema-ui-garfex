import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogAttributeCreationRestError } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'
import { useCatalogAttributeCreation } from '../../src/features/catalog-hierarchy/useCatalogAttributeCreation'
// prettier-ignore
const context = (typeCode = 'type-a') => ({ sessionId: 's', classCode: 'class-a', familyCode: 'family-a', typeCode })
// prettier-ignore
const reference = (kind: string, id: string, code: string) => ({ kind: 'REFERENCE', reference: { kind, id, code } }) as never
// prettier-ignore
const refs = { class: reference('CLASE', '1', 'class-a'), family: reference('FAMILIA', '2', 'family-a'), type: reference('TIPO', '3', 'type-a') }
// prettier-ignore
const characteristic = { kind: 'CARACTERISTICA', id: '4', revision: '0', active: true, code: 'material', name: 'Material', valueType: 'CONTROLLED_TEXT', rules: [] } as never
// prettier-ignore
const draft = { code: 'material', name: 'Material', valueType: 'CONTROLLED_TEXT' as const, mode: 'REQUIRED' as const, identityParticipates: false, position: '1' }
type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }
const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
// prettier-ignore
const api = (overrides: object = {}) => ({ resolveHierarchyReferences: vi.fn().mockResolvedValue(refs), createCharacteristic: vi.fn().mockResolvedValue(characteristic), createApplicability: vi.fn().mockResolvedValue({}), createPresentation: vi.fn().mockResolvedValue({}), ...overrides }) as never
// prettier-ignore
const render = (value = context(), injectedApi = api(), refresh = vi.fn().mockResolvedValue(true), canSubmit = () => true) => renderHook(({ value, api, refresh, canSubmit }) => useCatalogAttributeCreation({ api, context: value, refreshEffective: refresh, canSubmit }), { initialProps: { value, api: injectedApi, refresh, canSubmit } })
// prettier-ignore
describe('useCatalogAttributeCreation', () => {
  it('serializes confirmed writes behind Core refreshes', async () => {
    const refresh = vi.fn().mockResolvedValue(true), currentApi = api(), mounted = render(context(), currentApi, refresh)
    await act(async () => expect(await mounted.result.current.submit(draft)).toBe(true))
    await waitFor(() => expect([mounted.result.current.status, refresh.mock.calls.length]).toEqual(['completed', 3]))
  })
  it('allows a new flow only after the preceding operation is completed', async () => {
    const currentApi = api(), mounted = render(context(), currentApi)
    await act(async () => expect(await mounted.result.current.submit(draft)).toBe(true))
    await waitFor(() => expect(mounted.result.current.status).toBe('completed'))
    await act(async () => expect(await mounted.result.current.submit(draft)).toBe(true))
    await waitFor(() => expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(2))
  })
  it('blocks duplicate submit and preserves a definite HTTP failure', async () => {
    const error = new CatalogAttributeCreationRestError({ kind: 'http', status: 409 }), currentApi = api({ createCharacteristic: vi.fn().mockRejectedValue(error) }), mounted = render(context(), currentApi)
    await act(async () => { expect(await mounted.result.current.submit(draft)).toBe(true); expect(await mounted.result.current.submit(draft)).toBe(false) })
    await waitFor(() => expect(mounted.result.current.status).toBe('partial'))
    expect([mounted.result.current.draft, mounted.result.current.steps[0]]).toMatchObject([draft, { status: 'failed', error }])
  })
  it('requires reconciliation for unknown network writes without a later POST', async () => {
    const error = new CatalogAttributeCreationRestError({ kind: 'network', message: 'offline' }), currentApi = api({ createCharacteristic: vi.fn().mockRejectedValue(error) }), mounted = render(context(), currentApi)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(mounted.result.current.status).toBe('reconciliation-required'))
    expect(currentApi.createApplicability).not.toHaveBeenCalled()
  })
  it('retains stale A-B-A work and blocks a replay in the original context', async () => {
    const created = deferred<typeof characteristic>(), refresh = vi.fn().mockResolvedValue(true), currentApi = api({ createCharacteristic: vi.fn().mockReturnValue(created.promise) }), mounted = render(context(), currentApi, refresh)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(1))
    mounted.rerender({ value: context('type-b'), api: currentApi, refresh, canSubmit: () => true })
    mounted.rerender({ value: context(), api: currentApi, refresh, canSubmit: () => true })
    await act(async () => created.resolve(characteristic))
    mounted.rerender({ value: context(), api: currentApi, refresh, canSubmit: () => true })
    await waitFor(() =>
      expect(mounted.result.current.retained[0]?.steps[0]?.status).toBe(
        'confirmed',
      ),
    )
    expect(mounted.result.current.retained[0]?.status).toBe('partial')
    expect(currentApi.createApplicability).not.toHaveBeenCalled()
    await act(async () => expect(await mounted.result.current.submit(draft)).toBe(false))
    expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(1)
  })
  it('stops Core refresh and later POSTs when closed during a write', async () => {
    const created = deferred<typeof characteristic>(), refresh = vi.fn().mockResolvedValue(true), currentApi = api({ createCharacteristic: vi.fn().mockReturnValue(created.promise) }), mounted = render(context(), currentApi, refresh)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(1))
    const beforeClose = mounted.result.current
    mounted.unmount()
    await act(async () => created.resolve(characteristic))
    expect(mounted.result.current).toBe(beforeClose)
    for (const command of [refresh, currentApi.createApplicability, currentApi.createPresentation])
      expect(command).not.toHaveBeenCalled()
  })
  it('fails closed when the actor is lost before the next POST', async () => {
    const refreshed = deferred<boolean>(), refresh = vi.fn().mockReturnValue(refreshed.promise), currentApi = api(), mounted = render(context(), currentApi, refresh)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    mounted.rerender({ value: context(), api: currentApi, refresh, canSubmit: () => false })
    await act(async () => refreshed.resolve(true))
    await waitFor(() => expect(mounted.result.current.status).toBe('partial'))
    expect([mounted.result.current.steps[0], mounted.result.current.steps[1]]).toMatchObject([{ status: 'confirmed' }, { status: 'failed' }])
    expect(currentApi.createApplicability).not.toHaveBeenCalled()
  })
  it('keeps an invalid 201 unconfirmed after an explicit successful Core reread', async () => {
    const error = new CatalogAttributeCreationRestError({ kind: 'invalid-response', message: 'bad 201' }), currentApi = api({ createCharacteristic: vi.fn().mockRejectedValue(error) }), mounted = render(context(), currentApi)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(mounted.result.current.status).toBe('reconciliation-required'))
    await act(async () => expect(await mounted.result.current.rereadCore()).toBe(true))
    await waitFor(() => expect([mounted.result.current.status, mounted.result.current.steps[0]?.status]).toEqual(['partial', 'unconfirmed']))
    expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(1)
    expect(currentApi.createApplicability).not.toHaveBeenCalled()
  })
  it('recovers only confirmed partial progress after a failed Core refresh', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(true), currentApi = api({ createApplicability: vi.fn().mockRejectedValue(new CatalogAttributeCreationRestError({ kind: 'http', status: 409 })) }), mounted = render(context(), currentApi, refresh)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(mounted.result.current.status).toBe('reconciliation-required'))
    expect(mounted.result.current.steps[0]).toMatchObject({ status: 'reconciliation-required', record: characteristic })
    await act(async () => expect(await mounted.result.current.rereadCore()).toBe(true))
    expect([mounted.result.current.status, mounted.result.current.steps[0], mounted.result.current.steps[1]]).toMatchObject(['partial', { status: 'confirmed', record: characteristic }, { status: 'not-started' }])
    expect(currentApi.createApplicability).not.toHaveBeenCalled()
  })
  it('preserves a definite partial failure after a successful manual reread', async () => {
    const error = new CatalogAttributeCreationRestError({ kind: 'http', status: 409 }), currentApi = api({ createApplicability: vi.fn().mockRejectedValue(error) }), mounted = render(context(), currentApi)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() => expect(mounted.result.current.status).toBe('partial'))
    await act(async () => expect(await mounted.result.current.rereadCore()).toBe(true))
    expect([mounted.result.current.status, mounted.result.current.steps[0], mounted.result.current.steps[1]]).toMatchObject(['partial', { status: 'confirmed', record: characteristic }, { status: 'failed', error }])
  })
  it('refuses create/reuse replays while an uncertain or partial ledger is unresolved', async () => {
    const network = new CatalogAttributeCreationRestError({
      kind: 'network',
      message: 'offline',
    })
    const currentApi = api({
      createCharacteristic: vi.fn().mockRejectedValue(network),
    })
    const mounted = render(context(), currentApi)
    await act(async () => mounted.result.current.submit(draft))
    await waitFor(() =>
      expect(mounted.result.current.status).toBe('reconciliation-required'),
    )
    await act(async () => {
      expect(await mounted.result.current.submit(draft)).toBe(false)
      expect(
        await mounted.result.current.assignExisting({
          characteristic,
          identityParticipates: false,
          mode: 'REQUIRED',
          position: '2',
        }),
      ).toBe(false)
    })
    expect(currentApi.createCharacteristic).toHaveBeenCalledTimes(1)
    expect(currentApi.createApplicability).not.toHaveBeenCalled()

    const partialApi = api({
      createApplicability: vi.fn().mockRejectedValue(
        new CatalogAttributeCreationRestError({ kind: 'http', status: 409 }),
      ),
    })
    const partial = render(context(), partialApi)
    await act(async () => partial.result.current.submit(draft))
    await waitFor(() => expect(partial.result.current.status).toBe('partial'))
    const ledger = partial.result.current.steps
    await act(async () => {
      expect(await partial.result.current.submit(draft)).toBe(false)
      expect(
        await partial.result.current.assignExisting({
          characteristic,
          identityParticipates: false,
          mode: 'REQUIRED',
          position: '2',
        }),
      ).toBe(false)
    })
    expect(partial.result.current.steps).toEqual(ledger)
    expect(partialApi.createCharacteristic).toHaveBeenCalledTimes(1)
    expect(partialApi.createApplicability).toHaveBeenCalledTimes(1)
  })

  it('keeps UI command identities stable across a same-context rerender', () => {
    const mounted = render(), commands = mounted.result.current
    mounted.rerender({ value: context(), api: api(), refresh: vi.fn().mockResolvedValue(true), canSubmit: () => true })
    expect([mounted.result.current.submit, mounted.result.current.rereadCore, mounted.result.current.continuePendingStep]).toEqual([commands.submit, commands.rereadCore, commands.continuePendingStep])
  })

  it('does not restore completed or late search results across A-B-A and session swaps', async () => {
    const completed = deferred<{ records: readonly typeof characteristic[]; hasPrevious: boolean; hasNext: boolean }>()
    const late = deferred<{ records: readonly typeof characteristic[]; hasPrevious: boolean; hasNext: boolean }>()
    const currentApi = api({
      searchCharacteristics: vi
        .fn()
        .mockReturnValueOnce(completed.promise)
        .mockReturnValueOnce(late.promise),
    })
    const mounted = render(context(), currentApi)

    void mounted.result.current.searchExisting({ text: 'first', limit: 50, offset: 0 })
    await waitFor(() => expect(currentApi.searchCharacteristics).toHaveBeenCalledTimes(1))
    await act(async () =>
      completed.resolve({ records: [characteristic], hasPrevious: false, hasNext: false }),
    )
    await waitFor(() =>
      expect(mounted.result.current.existingSearch.status).toBe('ready'),
    )
    mounted.rerender({ value: context('type-b'), api: currentApi, refresh: vi.fn().mockResolvedValue(true), canSubmit: () => true })
    mounted.rerender({ value: context(), api: currentApi, refresh: vi.fn().mockResolvedValue(true), canSubmit: () => true })
    expect(mounted.result.current.existingSearch.status).toBe('idle')

    void mounted.result.current.searchExisting({ text: 'late', limit: 50, offset: 0 })
    await waitFor(() => expect(currentApi.searchCharacteristics).toHaveBeenCalledTimes(2))
    mounted.rerender({ value: { ...context('type-b'), sessionId: 'next' }, api: currentApi, refresh: vi.fn().mockResolvedValue(true), canSubmit: () => true })
    mounted.rerender({ value: { ...context(), sessionId: 'next' }, api: currentApi, refresh: vi.fn().mockResolvedValue(true), canSubmit: () => true })
    await act(async () =>
      late.resolve({ records: [characteristic], hasPrevious: false, hasNext: false }),
    )
    expect(mounted.result.current.existingSearch.status).toBe('idle')
    expect(mounted.result.current.existingSearch.page).toBeNull()
  })

  it('aborts a pending search on unmount and ignores its late response', async () => {
    const pending = deferred<{ records: readonly typeof characteristic[]; hasPrevious: boolean; hasNext: boolean }>()
    const currentApi = api({ searchCharacteristics: vi.fn().mockReturnValue(pending.promise) })
    const mounted = render(context(), currentApi)
    void mounted.result.current.searchExisting({ text: 'late', limit: 50, offset: 0 })
    await waitFor(() => expect(currentApi.searchCharacteristics).toHaveBeenCalledTimes(1))
    const signal = currentApi.searchCharacteristics.mock.calls[0]?.[0].signal as AbortSignal
    const beforeUnmount = mounted.result.current
    mounted.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () =>
      pending.resolve({ records: [characteristic], hasPrevious: false, hasNext: false }),
    )
    expect(mounted.result.current).toBe(beforeUnmount)
  })

  it('reuses a selected characteristic without posting a second characteristic', async () => {
    const refresh = vi.fn().mockResolvedValue(true)
    const currentApi = api()
    const mounted = render(context(), currentApi, refresh)
    const selected = {
      ...characteristic,
      code: 'DENSITY',
      name: 'Densidad',
      valueType: 'DECIMAL' as const,
    }

    await act(async () =>
      expect(
        await mounted.result.current.assignExisting({
          characteristic: selected,
          identityParticipates: true,
          mode: 'REQUIRED',
          position: '2',
        }),
      ).toBe(true),
    )

    await waitFor(() => expect(mounted.result.current.status).toBe('completed'))
    expect(currentApi.createCharacteristic).not.toHaveBeenCalled()
    expect(currentApi.createApplicability).toHaveBeenCalledWith(
      expect.objectContaining({
        characteristic: reference('CARACTERISTICA', selected.id, 'DENSITY'),
        characteristicValueType: 'DECIMAL',
      }),
    )
    expect(currentApi.createPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        characteristic: reference('CARACTERISTICA', selected.id, 'DENSITY'),
        position: '2',
      }),
    )
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})

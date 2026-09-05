import { describe, expect, it, vi } from 'vitest'
import { createResourcesMasterListController } from '../../src/features/resources-master/useResourcesMasterList'
import type { ResourceListPage } from '../../src/features/resources-master/resourcesMaster.types'

type Row = { id: string; nombre: string }

const page = (items: Row[], continueCursor: string, isDone = false): ResourceListPage<Row> => ({
  page: items,
  isDone,
  continueCursor,
})

const adapter = (load: (request: unknown) => Promise<ResourceListPage<Row>>) => ({ load })

describe('resources master list controller', () => {
  it('keeps filters and cursor across explicit continuation', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', nombre: 'A' }], 'next'))
      .mockResolvedValueOnce(page([{ id: 'b', nombre: 'B' }], 'done', true))
    const controller = createResourcesMasterListController({
      filters: { lifecycle: 'ACTIVE' },
      adapter: adapter(load),
    })

    await controller.start()
    await controller.continue()

    expect(load.mock.calls).toEqual([
      [{ filters: { lifecycle: 'ACTIVE' }, cursor: undefined }],
      [{ filters: { lifecycle: 'ACTIVE' }, cursor: 'next' }],
    ])
    expect(controller.getState()).toMatchObject({
      items: [{ id: 'a' }, { id: 'b' }],
      status: 'ready',
      isDone: true,
    })
  })

  it('retries a rejected initial page exactly once before succeeding', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(page([{ id: 'a', nombre: 'A' }], 'done', true))
    const controller = createResourcesMasterListController({ adapter: adapter(load) })

    expect(await controller.start()).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
    expect(controller.getState()).toMatchObject({ status: 'ready', isDone: true })
  })

  it('keeps initial-error after the bounded retry and exposes manual retry', async () => {
    const load = vi.fn().mockRejectedValue(new Error('transport'))
    const controller = createResourcesMasterListController({ adapter: adapter(load) })

    expect(await controller.start()).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
    expect(controller.getState().status).toBe('initial-error')

    expect(await controller.retry()).toBe(false)
    expect(load).toHaveBeenCalledTimes(3)
    expect(controller.getState().status).toBe('initial-error')
  })

  it('deduplicates items in delivery order and stops when done', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', nombre: 'first' }], 'next'))
      .mockResolvedValueOnce(page([{ id: 'a', nombre: 'second' }, { id: 'b', nombre: 'B' }], 'ignored', true))
    const controller = createResourcesMasterListController({ adapter: adapter(load) })

    await controller.start()
    await controller.continue()
    await controller.continue()

    expect(load).toHaveBeenCalledTimes(2)
    expect(controller.getState().items).toEqual([
      { id: 'a', nombre: 'first' },
      { id: 'b', nombre: 'B' },
    ])
  })

  it('discards a stale response after filters change mid-flight', async () => {
    let resolve!: (value: ResourceListPage<Row>) => void
    const load = vi.fn(() => new Promise<ResourceListPage<Row>>((done) => { resolve = done }))
    const controller = createResourcesMasterListController({
      filters: { lifecycle: 'ACTIVE' },
      adapter: adapter(load),
    })

    const pending = controller.start()
    controller.setFilters({ lifecycle: 'INACTIVE' })
    resolve(page([{ id: 'stale', nombre: 'stale' }], 'x', true))
    await pending

    expect(controller.getState()).toMatchObject({
      items: [],
      filters: { lifecycle: 'INACTIVE' },
      status: 'ready',
    })
  })

  it('preserves valid pages and retries continuation only explicitly', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', nombre: 'A' }], 'next'))
      .mockRejectedValueOnce(new Error('transport'))
      .mockResolvedValueOnce(page([{ id: 'b', nombre: 'B' }], 'done', true))
    const controller = createResourcesMasterListController({ adapter: adapter(load) })

    await controller.start()
    await controller.continue()
    expect(controller.getState()).toMatchObject({
      status: 'partial-error',
      items: [{ id: 'a' }],
      isDone: false,
    })

    await controller.retry()
    expect(controller.getState().items).toEqual([
      { id: 'a', nombre: 'A' },
      { id: 'b', nombre: 'B' },
    ])
  })

  it('reports empty when the first page is already done with no items', async () => {
    const load = vi.fn().mockResolvedValueOnce(page([], 'done', true))
    const controller = createResourcesMasterListController({ adapter: adapter(load) })

    await controller.start()
    expect(controller.getState().status).toBe('empty')
  })
})

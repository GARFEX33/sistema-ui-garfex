import { describe, expect, it, vi } from 'vitest'
import {
  createCatalogListSequence,
  type CatalogListPage,
} from '../../src/features/catalog-hierarchy/useCatalogList'
import { createParentGatedListController } from '../../src/shared/hierarchy/parentGatedListController'

type Row = { id: string; label: string }

const page = (
  items: Row[],
  cursor: string | null,
  isExhausted = false,
): CatalogListPage<Row> => ({ items, continuationCursor: cursor, isExhausted })

const adapter = (
  load: (request: unknown) => Promise<CatalogListPage<Row>>,
) => ({
  load,
})

describe('catalog list sequence', () => {
  it('exposes the shared parent-gated controller contract without feature vocabulary', async () => {
    const load = vi
      .fn()
      .mockResolvedValue(page([{ id: 'a', label: 'A' }], null, true))
    const sequence = createParentGatedListController({
      operation: 'dependent',
      parentId: 'parent-a',
      adapter: adapter(load),
      requiresParent: (operation) => operation === 'dependent',
    })

    expect(await sequence.start()).toBe(true)
    expect(load).toHaveBeenCalledWith({
      operation: 'dependent',
      parentId: 'parent-a',
      filters: {},
      cursor: undefined,
    })
    expect(sequence.getState()).toMatchObject({
      items: [{ id: 'a' }],
      status: 'ready',
      isExhausted: true,
    })
  })

  it('keeps context and opaque cursor across explicit continuation', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', label: 'A' }], 'next'))
      .mockResolvedValueOnce(page([{ id: 'b', label: 'B' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'families',
      parentId: 'class-1',
      filters: { mode: 'ACTIVE' },
      adapter: adapter(load),
    })

    await sequence.start()
    await sequence.continue()

    expect(load.mock.calls).toEqual([
      [
        {
          operation: 'families',
          parentId: 'class-1',
          filters: { mode: 'ACTIVE' },
          cursor: undefined,
        },
      ],
      [
        {
          operation: 'families',
          parentId: 'class-1',
          filters: { mode: 'ACTIVE' },
          cursor: 'next',
        },
      ],
    ])
    expect(sequence.getState()).toMatchObject({
      items: [{ id: 'a' }, { id: 'b' }],
      status: 'ready',
      isExhausted: true,
    })
  })

  it('snapshots filters before a pending request can observe caller mutation', async () => {
    let resolve!: (value: CatalogListPage<Row>) => void
    const load = vi.fn(
      () =>
        new Promise<CatalogListPage<Row>>((done) => {
          resolve = done
        }),
    )
    const filters = { mode: 'ACTIVE' }
    const sequence = createCatalogListSequence({
      operation: 'classes',
      filters,
      adapter: adapter(load),
    })

    const pending = sequence.start()
    filters.mode = 'INACTIVE'

    expect(load.mock.calls[0]?.[0]).toMatchObject({
      filters: { mode: 'ACTIVE' },
    })
    resolve(page([{ id: 'a', label: 'A' }], null, true))
    await pending
    expect(sequence.getState().filters).toEqual({ mode: 'ACTIVE' })
  })

  it('retries a rejected initial page exactly once before succeeding', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(page([{ id: 'a', label: 'A' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'classes',
      adapter: adapter(load),
    })

    expect(await sequence.start()).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
    expect(load.mock.calls[0]?.[0].cursor).toBeUndefined()
    expect(load.mock.calls[1]?.[0].cursor).toBeUndefined()
    expect(sequence.getState()).toMatchObject({
      status: 'ready',
      items: [{ id: 'a', label: 'A' }],
      isExhausted: true,
    })
  })

  it('retries a dependent initial page with its parent and filters intact', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(page([{ id: 'f', label: 'Family' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'families',
      parentId: 'class-1',
      filters: { mode: 'ACTIVE' },
      adapter: adapter(load),
    })

    expect(await sequence.start()).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
    expect(load.mock.calls[1]?.[0]).toEqual({
      operation: 'families',
      parentId: 'class-1',
      filters: { mode: 'ACTIVE' },
      cursor: undefined,
    })
    expect(sequence.getState()).toMatchObject({
      parentId: 'class-1',
      status: 'ready',
      items: [{ id: 'f', label: 'Family' }],
    })
  })

  it('keeps initial-error after the bounded retry and exposes manual retry', async () => {
    const load = vi.fn().mockRejectedValue(new Error('transport'))
    const sequence = createCatalogListSequence({
      operation: 'classes',
      adapter: adapter(load),
    })

    expect(await sequence.start()).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
    expect(sequence.getState().status).toBe('initial-error')

    expect(await sequence.retry()).toBe(false)
    expect(load).toHaveBeenCalledTimes(3)
    expect(sequence.getState().status).toBe('initial-error')
  })

  it('deduplicates in delivery order and stops when exhausted', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', label: 'first' }], 'next'))
      .mockResolvedValueOnce(
        page(
          [
            { id: 'a', label: 'second' },
            { id: 'b', label: 'B' },
          ],
          'ignored',
          true,
        ),
      )
    const sequence = createCatalogListSequence({
      operation: 'classes',
      adapter: adapter(load),
    })

    await sequence.start()
    await sequence.continue()
    await sequence.continue()

    expect(load).toHaveBeenCalledTimes(2)
    expect(sequence.getState().items).toEqual([
      { id: 'a', label: 'first' },
      { id: 'b', label: 'B' },
    ])
  })

  it('continues after a nonexhausted empty attributes page', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([], 'next'))
      .mockResolvedValueOnce(page([{ id: 'a', label: 'A' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'attributes',
      parentId: 'type-1',
      adapter: adapter(load),
    })

    await sequence.start()
    expect(sequence.getState()).toMatchObject({
      status: 'ready',
      items: [],
      isExhausted: false,
    })
    await sequence.continue()

    expect(sequence.getState()).toMatchObject({
      status: 'ready',
      items: [{ id: 'a', label: 'A' }],
      isExhausted: true,
    })
  })

  it.each([
    ['families', 'undefined', undefined],
    ['families', 'null', null],
    ['families', 'empty string', ''],
    ['types', 'undefined', undefined],
    ['types', 'null', null],
    ['types', 'empty string', ''],
    ['attributes', 'undefined', undefined],
    ['attributes', 'null', null],
    ['attributes', 'empty string', ''],
  ] as const)(
    'waits for a dependent %s parent when it is %s without calling',
    async (operation, _label, parentId) => {
      const load = vi.fn()
      const sequence = createCatalogListSequence({
        operation,
        parentId,
        adapter: adapter(load),
      })

      expect(sequence.getState().status).toBe('waiting-for-parent')
      expect(await sequence.start()).toBe(false)
      expect(await sequence.continue()).toBe(false)
      expect(await sequence.retry()).toBe(false)
      expect(load).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['zero', 0],
    ['false', false],
  ])('treats a %s dependent parent as valid', async (_label, parentId) => {
    const load = vi
      .fn()
      .mockResolvedValue(page([{ id: 'a', label: 'A' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'families',
      parentId,
      adapter: adapter(load),
    })

    expect(sequence.getState().status).toBe('ready')
    expect(await sequence.start()).toBe(true)
    expect(load).toHaveBeenCalledWith({
      operation: 'families',
      parentId,
      filters: {},
      cursor: undefined,
    })
  })

  it('discards stale responses after parent change', async () => {
    let resolve!: (value: CatalogListPage<Row>) => void
    const load = vi.fn(
      () =>
        new Promise<CatalogListPage<Row>>((done) => {
          resolve = done
        }),
    )
    const sequence = createCatalogListSequence({
      operation: 'families',
      parentId: 'old',
      adapter: adapter(load),
    })

    const pending = sequence.start()
    sequence.setContext({ operation: 'families', parentId: 'new' })
    resolve(page([{ id: 'old', label: 'old' }], null, true))
    await pending

    expect(sequence.getState()).toMatchObject({
      items: [],
      parentId: 'new',
      status: 'ready',
    })
  })

  it('preserves valid pages and retries continuation only explicitly', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', label: 'A' }], 'next'))
      .mockRejectedValueOnce(new Error('transport'))
      .mockResolvedValueOnce(page([{ id: 'b', label: 'B' }], null, true))
    const sequence = createCatalogListSequence({
      operation: 'classes',
      adapter: adapter(load),
    })

    await sequence.start()
    await sequence.continue()
    expect(sequence.getState()).toMatchObject({
      status: 'partial-error',
      items: [{ id: 'a' }],
      isExhausted: false,
    })
    expect(load).toHaveBeenCalledTimes(2)

    await sequence.retry()
    expect(sequence.getState().items).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ])
  })
})

import { describe, expect, it, vi } from 'vitest'
import { createCatalogListSequence } from '../../src/features/catalog-hierarchy/useCatalogList'
import type { CatalogListPage } from '../../src/features/catalog-hierarchy/catalogHierarchy.types'

type Row = { id: string; label: string }

const page = (
  items: Row[],
  continuationCursor: string | null,
  isExhausted = false,
): CatalogListPage<Row> => ({ items, continuationCursor, isExhausted })

describe('catalog list sequence', () => {
  it('maps snapshotted context and preserves an opaque continuation cursor', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', label: 'A' }], 'opaque:next'))
      .mockResolvedValueOnce(page([{ id: 'b', label: 'B' }], null, true))
    const filters = { mode: 'ACTIVE' }
    const sequence = createCatalogListSequence({
      operation: 'families',
      parentId: 'class-1',
      filters,
      adapter: { load },
    })

    filters.mode = 'INACTIVE'
    await sequence.start()
    await sequence.continue()

    expect(load).toHaveBeenNthCalledWith(1, {
      operation: 'families',
      parentId: 'class-1',
      filters: { mode: 'ACTIVE' },
      cursor: undefined,
    })
    expect(load).toHaveBeenNthCalledWith(2, {
      operation: 'families',
      parentId: 'class-1',
      filters: { mode: 'ACTIVE' },
      cursor: 'opaque:next',
    })
  })

  it.each([
    ['families', undefined],
    ['families', null],
    ['families', ''],
    ['types', undefined],
    ['types', null],
    ['types', ''],
  ] as const)(
    'keeps %s waiting when its parent is unavailable',
    async (operation, parentId) => {
      const load = vi.fn()
      const sequence = createCatalogListSequence({
        operation,
        parentId,
        adapter: { load },
      })

      expect(sequence.getState().isWaitingForParent).toBe(true)
      expect(await sequence.start()).toBe(false)
      expect(await sequence.continue()).toBe(false)
      expect(load).not.toHaveBeenCalled()
    },
  )

  it('keeps class requests ungated, appends first item occurrences, and stops at exhaustion', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a', label: 'first' }], 'next'))
      .mockResolvedValueOnce(
        page(
          [
            { id: 'a', label: 'duplicate' },
            { id: 'b', label: 'B' },
          ],
          'ignored',
          true,
        ),
      )
    const sequence = createCatalogListSequence({
      operation: 'classes',
      adapter: { load },
    })
    const subscriber = vi.fn()
    const unsubscribe = sequence.subscribe(subscriber)

    expect(await sequence.start()).toBe(true)
    expect(await sequence.continue()).toBe(true)
    expect(await sequence.continue()).toBe(false)
    unsubscribe()

    expect(load).toHaveBeenCalledTimes(2)
    expect(sequence.getState()).toMatchObject({
      items: [
        { id: 'a', label: 'first' },
        { id: 'b', label: 'B' },
      ],
      isExhausted: true,
      isWaitingForParent: false,
    })
    expect(subscriber).toHaveBeenCalled()
  })
})

import { getFunctionName } from 'convex/server'
import { describe, expect, it, vi } from 'vitest'
import { createCatalogHierarchyConvexApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const state = vi.hoisted(() => ({
  constructed: [] as string[],
  queries: [] as Array<{
    name: string
    args: Readonly<Record<string, unknown>>
  }>,
  response: {
    continuationCursor: null,
    isExhausted: true,
    items: [],
  } as unknown,
}))

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    constructor(url: string) {
      state.constructed.push(url)
    }

    query(reference: unknown, args: Readonly<Record<string, unknown>>) {
      const name =
        typeof reference === 'object' && reference !== null
          ? getFunctionName(reference as Parameters<typeof getFunctionName>[0])
          : 'unknown'
      state.queries.push({ name, args })
      return Promise.resolve(state.response)
    }
  },
}))

const reset = () => {
  state.constructed.length = 0
  state.queries.length = 0
  state.response = { continuationCursor: null, isExhausted: true, items: [] }
}

describe('connected catalog hierarchy transport', () => {
  it('constructs lazily and maps only the three authorized reads with explicit args', async () => {
    reset()
    const api = createCatalogHierarchyConvexApi({
      url: 'http://127.0.0.1:3210',
    })

    expect(state.constructed).toEqual([])
    await api.listClasses({ mode: 'ACTIVE' })
    await api.listFamilies({ parentId: 'class-1' })
    await api.listTypes({
      parentId: 'family-1',
      cursor: 'opaque-cursor',
      mode: 'INACTIVE',
      pageSize: 7,
    })

    expect(state.constructed).toEqual(['http://127.0.0.1:3210'])
    expect(state.queries).toEqual([
      {
        name: 'catalogoAdmin/jerarquia:listarClases',
        args: { modo: 'ACTIVE' },
      },
      {
        name: 'catalogoAdmin/jerarquia:listarFamilias',
        args: { claseRecursoId: 'class-1' },
      },
      {
        name: 'catalogoAdmin/jerarquia:listarTipos',
        args: {
          cursor: 'opaque-cursor',
          familiaRecursoId: 'family-1',
          modo: 'INACTIVE',
          pageSize: 7,
        },
      },
    ])
  })

  it.each([undefined, '', '/relative', 'ftp://127.0.0.1:3210'])(
    'fails closed for URL %s before client construction or network',
    async (url) => {
      reset()
      const api = createCatalogHierarchyConvexApi({ url })

      await expect(api.listClasses()).rejects.toThrow()
      expect(state.constructed).toEqual([])
      expect(state.queries).toEqual([])
    },
  )

  it('propagates the unknown parser boundary without synthesizing a page or items', async () => {
    reset()
    state.response = { unexpected: 'payload' }
    const api = createCatalogHierarchyConvexApi({
      url: 'https://example.test',
    })

    await expect(api.listClasses()).rejects.toThrow()
    expect(state.queries).toHaveLength(1)
  })
})

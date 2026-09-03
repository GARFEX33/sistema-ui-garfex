import { describe, expect, it } from 'vitest'
import { createCatalogHierarchyConvexApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const describeConnected =
  process.env.RUN_CONNECTED_CATALOG_TESTS === 'true' ? describe : describe.skip

describeConnected(
  'authority 3210 catalog hierarchy reads (set RUN_CONNECTED_CATALOG_TESTS=true to run)',
  () => {
    it('observes a valid anonymous classes page without synthesis', async () => {
      const api = createCatalogHierarchyConvexApi({
        url: 'http://127.0.0.1:3210',
      })

      const result = await api.listClasses()

      expect(result).toEqual(
        expect.objectContaining({
          items: expect.any(Array),
          isExhausted: expect.any(Boolean),
        }),
      )
      expect(
        result.continuationCursor === null ||
          typeof result.continuationCursor === 'string',
      ).toBe(true)
      expect(
        result.items.every(
          (item) =>
            typeof item.id !== 'undefined' &&
            typeof item.nombre === 'string' &&
            typeof item.clave === 'string',
        ),
      ).toBe(true)
    })

    it('does not synthesize families when the authority rejects an unverified parent id', async () => {
      const api = createCatalogHierarchyConvexApi({
        url: 'http://127.0.0.1:3210',
      })

      await expect(
        api.listFamilies({ parentId: 'unverified-parent-id' }),
      ).rejects.toThrow('ArgumentValidationError')
    })

    it('does not synthesize types when the authority rejects an unverified parent id', async () => {
      const api = createCatalogHierarchyConvexApi({
        url: 'http://127.0.0.1:3210',
      })

      await expect(
        api.listTypes({ parentId: 'unverified-parent-id' }),
      ).rejects.toThrow('ArgumentValidationError')
    })
  },
)

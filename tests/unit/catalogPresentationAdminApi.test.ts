import { describe, expect, it, vi } from 'vitest'
import {
  CatalogPresentationConflictError,
  createCatalogPresentationAdminApi,
} from '../../src/features/catalog-hierarchy/catalogPresentationAdmin.api'

const input = {
  classCode: 'MATERIAL',
  familyCode: 'CABLE',
  typeCode: 'CABLE_CONTROL',
}

const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'PRESENTACION',
  id: '7',
  revision: '3',
  active: true,
  values: {
    class: {
      kind: 'REFERENCE',
      reference: { kind: 'CLASE', id: '1', code: 'MATERIAL' },
    },
    family: {
      kind: 'REFERENCE',
      reference: { kind: 'FAMILIA', id: '2', code: 'CABLE' },
    },
    type: {
      kind: 'REFERENCE',
      reference: { kind: 'TIPO', id: '3', code: 'CABLE_CONTROL' },
    },
    characteristic: {
      kind: 'REFERENCE',
      reference: { kind: 'CARACTERISTICA', id: '4', code: 'insulation' },
    },
    position: { kind: 'INTEGER', value: '0' },
  },
  rules: [],
  ...overrides,
})

describe('catalog presentation admin REST API', () => {
  describe('listPresentations', () => {
    it('lists presentations scoped by typeCode with the exact context and query', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [record()],
          hasPrevious: false,
          hasNext: false,
        }),
      })
      const api = createCatalogPresentationAdminApi(fetch)

      await expect(
        api.listPresentations({ ...input, offset: 0, limit: 50 }),
      ).resolves.toEqual({
        records: [
          {
            id: '7',
            revision: '3',
            active: true,
            characteristicCode: 'insulation',
            position: '0',
          },
        ],
        hasPrevious: false,
        hasNext: false,
      })
      expect(fetch).toHaveBeenCalledWith(
        '/v1/catalog/PRESENTACION?typeCode=CABLE_CONTROL&scope=ALL&offset=0&limit=50',
        { signal: undefined },
      )
    })

    it('rejects a record whose context does not match the request', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [
            record({
              values: {
                ...record().values,
                type: {
                  kind: 'REFERENCE',
                  reference: { kind: 'TIPO', id: '9', code: 'OTHER' },
                },
              },
            }),
          ],
          hasPrevious: false,
          hasNext: false,
        }),
      })
      const api = createCatalogPresentationAdminApi(fetch)

      await expect(
        api.listPresentations({ ...input, offset: 0, limit: 50 }),
      ).rejects.toThrow('Invalid catalog presentation response')
    })

    it('fails closed before HTTP for an incomplete context', async () => {
      const fetch = vi.fn()
      const api = createCatalogPresentationAdminApi(fetch)

      await expect(
        api.listPresentations({ ...input, typeCode: '', offset: 0, limit: 50 }),
      ).rejects.toThrow('Invalid catalog presentation response')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('surfaces HTTP failures without a fallback', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })
      const api = createCatalogPresentationAdminApi(fetch)

      await expect(
        api.listPresentations({ ...input, offset: 0, limit: 50 }),
      ).rejects.toThrow('Not found')
    })
  })

  describe('updatePresentation', () => {
    const updateInput = {
      id: '7',
      expectedRevision: '3',
      active: false,
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'CABLE_CONTROL',
      characteristicCode: 'insulation',
      position: '0',
    }

    it('PUTs the exact id/body and returns the updated item', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => record({ id: '7', revision: '4', active: false }),
      })
      const api = createCatalogPresentationAdminApi(fetch, {
        actor: 'catalog-admin',
      })

      await expect(api.updatePresentation(updateInput)).resolves.toEqual({
        id: '7',
        revision: '4',
        active: false,
        characteristicCode: 'insulation',
        position: '0',
      })
      expect(fetch).toHaveBeenCalledWith('/v1/catalog/PRESENTACION/7', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actor: 'catalog-admin',
          expectedRevision: '3',
          active: false,
          values: {
            class: {
              kind: 'REFERENCE',
              reference: { kind: 'CLASE', id: '0', code: 'MATERIAL' },
            },
            family: {
              kind: 'REFERENCE',
              reference: { kind: 'FAMILIA', id: '0', code: 'CABLE' },
            },
            type: {
              kind: 'REFERENCE',
              reference: { kind: 'TIPO', id: '0', code: 'CABLE_CONTROL' },
            },
            characteristic: {
              kind: 'REFERENCE',
              reference: {
                kind: 'CARACTERISTICA',
                id: '0',
                code: 'insulation',
              },
            },
            position: { kind: 'INTEGER', value: '0' },
          },
        }),
      })
    })

    it('surfaces a 409 conflict distinctly', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Revision mismatch', code: 'CONFLICT' }),
      })
      const api = createCatalogPresentationAdminApi(fetch, {
        actor: 'catalog-admin',
      })

      await expect(api.updatePresentation(updateInput)).rejects.toThrow(
        CatalogPresentationConflictError,
      )
      await expect(api.updatePresentation(updateInput)).rejects.toThrow(
        'Revision mismatch',
      )
    })
  })
})

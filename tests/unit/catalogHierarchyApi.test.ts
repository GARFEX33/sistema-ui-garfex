import { describe, expect, it, vi } from 'vitest'
import { createCatalogHierarchyRestApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

describe('catalog hierarchy API boundary', () => {
  it('reads Clase through the documented REST window and maps only strict values', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          {
            kind: 'CLASE',
            id: 'class-1',
            revision: 'rev-1',
            active: true,
            values: {
              code: { kind: 'CODE', value: 'MAT' },
              name: { kind: 'TEXT', value: 'Material' },
            },
            rules: [],
          },
        ],
        hasPrevious: false,
        hasNext: true,
      }),
    })
    const api = createCatalogHierarchyRestApi(fetch)

    await expect(
      api.listClasses({ scope: 'ACTIVE', text: 'mat', limit: 20, offset: 40 }),
    ).resolves.toEqual({
      items: [
        {
          activo: true,
          clave: 'MAT',
          id: 'class-1',
          nombre: 'Material',
          revision: 'rev-1',
        },
      ],
      hasNext: true,
      hasPrevious: false,
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/CLASE?scope=ACTIVE&text=mat&limit=20&offset=40',
      { signal: undefined },
    )
  })

  it('reads REST-dependent pages by parent code before mapping them', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              kind: 'FAMILIA',
              id: 'family-1',
              revision: 'rev-family-1',
              active: true,
              values: {
                code: { kind: 'CODE', value: 'FER' },
                name: { kind: 'TEXT', value: 'Ferretería' },
                class: {
                  kind: 'REFERENCE',
                  reference: { kind: 'CLASE', id: '1', code: 'MAT' },
                },
              },
              rules: [],
            },
          ],
          hasPrevious: false,
          hasNext: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              kind: 'TIPO',
              id: 'type-1',
              revision: 'rev-type-1',
              active: true,
              values: {
                code: { kind: 'CODE', value: 'TOR' },
                name: { kind: 'TEXT', value: 'Tornillo' },
                class: {
                  kind: 'REFERENCE',
                  reference: { kind: 'CLASE', id: '1', code: 'MAT' },
                },
                family: {
                  kind: 'REFERENCE',
                  reference: { kind: 'FAMILIA', id: '2', code: 'FER' },
                },
              },
              rules: [],
            },
          ],
          hasPrevious: true,
          hasNext: false,
        }),
      })
    const api = createCatalogHierarchyRestApi(fetch)

    await expect(
      api.listFamilies({
        classCode: 'MAT',
        scope: 'ACTIVE',
        text: 'fer',
        limit: 20,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      items: [{ clave: 'FER', classCode: 'MAT', id: 'family-1' }],
      hasNext: true,
      hasPrevious: false,
    })
    await expect(
      api.listTypes({
        classCode: 'MAT',
        familyCode: 'FER',
        scope: 'ACTIVE',
        limit: 20,
        offset: 20,
      }),
    ).resolves.toMatchObject({
      items: [
        { clave: 'TOR', classCode: 'MAT', familyCode: 'FER', id: 'type-1' },
      ],
      hasNext: false,
      hasPrevious: true,
    })
    expect(fetch.mock.calls).toEqual([
      [
        '/v1/catalog/FAMILIA?scope=ACTIVE&text=fer&limit=20&offset=0&classCode=MAT',
        { signal: undefined },
      ],
      [
        '/v1/catalog/TIPO?scope=ACTIVE&limit=20&offset=20&familyCode=FER',
        { signal: undefined },
      ],
    ])
  })

  it('rejects an entire dependent REST page when any reference crosses its parent', async () => {
    const record = (
      kind: 'FAMILIA' | 'TIPO',
      values: Record<string, unknown>,
    ) => ({
      kind,
      id: kind === 'FAMILIA' ? 'family-1' : 'type-1',
      revision: 'rev-1',
      active: true,
      values: {
        code: { kind: 'CODE', value: kind === 'FAMILIA' ? 'FER' : 'TOR' },
        name: { kind: 'TEXT', value: kind === 'FAMILIA' ? 'Familia' : 'Tipo' },
        ...values,
      },
      rules: [],
    })
    const reference = (kind: string, code: string) => ({
      kind: 'REFERENCE',
      reference: { kind, id: '1', code },
    })
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            record('FAMILIA', { class: reference('CLASE', 'MAT') }),
            record('FAMILIA', { class: reference('CLASE', 'AJENA') }),
          ],
          hasPrevious: false,
          hasNext: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            record('TIPO', {
              class: reference('CLASE', 'MAT'),
              family: reference('FAMILIA', 'FER'),
            }),
            record('TIPO', {
              class: reference('CLASE', 'MAT'),
              family: reference('FAMILIA', 'AJENA'),
            }),
          ],
          hasPrevious: false,
          hasNext: false,
        }),
      })
    const api = createCatalogHierarchyRestApi(fetch)

    await expect(
      api.listFamilies({
        classCode: 'MAT',
        scope: 'ALL',
        limit: 20,
        offset: 0,
      }),
    ).rejects.toThrow('Invalid catalog hierarchy response')
    await expect(
      api.listTypes({
        classCode: 'MAT',
        familyCode: 'FER',
        scope: 'ALL',
        limit: 20,
        offset: 0,
      }),
    ).rejects.toThrow('Invalid catalog hierarchy response')
  })

  it('creates Clase through the documented REST endpoint with actor and typed required values', async () => {
    const fetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({
        kind: 'CLASE',
        id: 'class-1',
        revision: 'rev-1',
        active: true,
        values: {
          code: { kind: 'CODE', value: 'MAT' },
          name: { kind: 'TEXT', value: 'Material' },
          plural: { kind: 'TEXT', value: 'Materiales' },
          slug: { kind: 'TEXT', value: 'material' },
        },
        rules: [],
      }),
    })

    await expect(
      createCatalogHierarchyRestApi(fetch, {
        actor: 'catalog-user',
      }).createClass({
        code: 'MAT',
        name: 'Material',
        plural: 'Materiales',
        slug: 'material',
      }),
    ).resolves.toEqual({
      activo: true,
      clave: 'MAT',
      id: 'class-1',
      nombre: 'Material',
      revision: 'rev-1',
    })
    expect(fetch).toHaveBeenCalledWith('/v1/catalog/CLASE', {
      body: JSON.stringify({
        actor: 'catalog-user',
        values: {
          code: { kind: 'CODE', value: 'MAT' },
          name: { kind: 'TEXT', value: 'Material' },
          plural: { kind: 'TEXT', value: 'Materiales' },
          slug: { kind: 'TEXT', value: 'material' },
        },
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  })

  it('creates Family and Type through REST with snapshotted natural-code references', async () => {
    const reference = (kind: string, id: string, code: string) => ({
      kind: 'REFERENCE',
      reference: { kind, id, code },
    })
    const response = (
      kind: 'FAMILIA' | 'TIPO',
      id: string,
      values: Record<string, unknown>,
    ) => ({
      status: 201,
      json: async () => ({
        kind,
        id,
        revision: '1',
        active: true,
        values,
        rules: [],
      }),
    })
    const classReference = reference('CLASE', '1', 'MAT')
    const familyReference = reference('FAMILIA', '2', 'FER')
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response('FAMILIA', '2', {
          class: classReference,
          code: { kind: 'CODE', value: 'FER' },
          name: { kind: 'TEXT', value: 'Ferretería' },
        }),
      )
      .mockResolvedValueOnce(
        response('TIPO', '3', {
          class: classReference,
          family: familyReference,
          code: { kind: 'CODE', value: 'TOR' },
          name: { kind: 'TEXT', value: 'Tornillo' },
        }),
      )
    const api = createCatalogHierarchyRestApi(fetch, { actor: 'catalog-user' })
    await expect(
      api.createFamily({
        class: { kind: 'CLASE', code: 'MAT' },
        code: 'FER',
        name: 'Ferretería',
      }),
    ).resolves.toMatchObject({ id: '2', class: { id: '1' } })
    await expect(
      api.createType({
        class: { kind: 'CLASE', code: 'MAT' },
        family: { kind: 'FAMILIA', code: 'FER' },
        code: 'TOR',
        name: 'Tornillo',
      }),
    ).resolves.toMatchObject({ id: '3', family: { id: '2' } })
    const requests = fetch.mock.calls.map(([path, init]) => [
      path,
      JSON.parse((init as RequestInit).body as string),
    ])
    expect(requests).toEqual([
      [
        '/v1/catalog/FAMILIA',
        {
          actor: 'catalog-user',
          active: true,
          values: {
            class: reference('CLASE', '0', 'MAT'),
            code: { kind: 'CODE', value: 'FER' },
            name: { kind: 'TEXT', value: 'Ferretería' },
          },
        },
      ],
      [
        '/v1/catalog/TIPO',
        {
          actor: 'catalog-user',
          active: true,
          values: {
            class: reference('CLASE', '0', 'MAT'),
            family: reference('FAMILIA', '0', 'FER'),
            code: { kind: 'CODE', value: 'TOR' },
            name: { kind: 'TEXT', value: 'Tornillo' },
          },
        },
      ],
    ])
  })
})

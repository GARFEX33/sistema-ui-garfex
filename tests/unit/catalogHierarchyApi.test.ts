import { describe, expect, it, vi } from 'vitest'
import {
  createCatalogHierarchyApi,
  parseClassesPage,
  parseFamiliesPage,
  parseTypesPage,
} from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const item = (extra: Record<string, unknown> = {}) => ({
  activo: true,
  clave: 'C-1',
  effective: true,
  effectiveReasons: [],
  id: 'id-1',
  nombre: 'Clase',
  revision: 'rev-1',
  ...extra,
})

const page = (items: unknown[] = [item()]) => ({
  continuationCursor: 'opaque-next',
  isExhausted: false,
  items,
})

describe('catalog hierarchy API boundary', () => {
  it('parses unknown pages and rejects invalid envelopes and items', () => {
    expect(parseClassesPage(page()).items[0]?.id).toBe('id-1')
    expect(() => parseClassesPage({ items: [], isExhausted: false })).toThrow()
    expect(() => parseClassesPage(page([{ ...item(), nombre: 42 }]))).toThrow()
    expect(() =>
      parseTypesPage(page([item({ aggregateStatus: 'OK', violations: [] })])),
    ).toThrow()
  })

  it('validates level parents and rejects crossed pages', () => {
    const family = item({ claseRecursoId: 'class-1' })
    const type = item({
      aggregateStatus: 'OK',
      violations: [],
      familiaRecursoId: 'family-1',
    })

    expect(parseFamiliesPage(page([family]), 'class-1').items[0]).toMatchObject(
      {
        claseRecursoId: 'class-1',
      },
    )
    expect(parseTypesPage(page([type]), 'family-1').items[0]).toMatchObject({
      familiaRecursoId: 'family-1',
    })
    expect(() => parseFamiliesPage(page([family]), 'class-2')).toThrow()
    expect(() => parseTypesPage(page([type]), 'family-2')).toThrow()
  })

  it('requires exact page cursors and structured Tipo violations', () => {
    expect(
      parseClassesPage({
        continuationCursor: null,
        isExhausted: true,
        items: [],
      }).continuationCursor,
    ).toBeNull()
    expect(() =>
      parseClassesPage({
        continuationCursor: 12,
        isExhausted: true,
        items: [],
      }),
    ).toThrow()
    expect(() =>
      parseClassesPage({
        continuationCursor: {},
        isExhausted: true,
        items: [],
      }),
    ).toThrow()

    const violations = [{ reason: 'declared boundary' }]
    expect(
      parseTypesPage(
        page([
          item({
            aggregateStatus: 'OK',
            familiaRecursoId: 'family-1',
            violations,
          }),
        ]),
        'family-1',
      ).items[0]?.violations,
    ).toEqual(violations)
    expect(() =>
      parseTypesPage(
        page([
          item({
            aggregateStatus: 'OK',
            familiaRecursoId: 'family-1',
            violations: ['invented primitive'],
          }),
        ]),
        'family-1',
      ),
    ).toThrow()
  })

  it('rejects missing or empty dependent parents before transport', async () => {
    const invoke = vi.fn()
    const api = createCatalogHierarchyApi({ invoke })

    await expect(api.listFamilies()).rejects.toThrow()
    await expect(api.listFamilies({ parentId: '' })).rejects.toThrow()
    await expect(api.listFamilies({ parentId: null })).rejects.toThrow()
    await expect(api.listTypes({ parentId: '' })).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('rejects a crossed transport page in the contextual API', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(page([item({ claseRecursoId: 'different-class' })]))
    const api = createCatalogHierarchyApi({ invoke })

    await expect(api.listFamilies({ parentId: 'class-1' })).rejects.toThrow()
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:listarFamilias',
      { claseRecursoId: 'class-1' },
    )
  })

  it('maps exact operations and only sends explicit args', async () => {
    const invoke = vi.fn()
    invoke.mockResolvedValueOnce(page())
    invoke.mockResolvedValueOnce(page([item({ claseRecursoId: 'class-1' })]))
    invoke.mockResolvedValueOnce(
      page([
        item({
          aggregateStatus: 'OK',
          familiaRecursoId: 'family-1',
          violations: [],
        }),
      ]),
    )
    const api = createCatalogHierarchyApi({ invoke })

    await api.listClasses({ mode: 'ACTIVE' })
    await api.listFamilies({ parentId: 'class-1' })
    await api.listTypes({
      parentId: 'family-1',
      cursor: 'opaque-cursor',
      pageSize: 20,
    })

    expect(invoke.mock.calls).toEqual([
      ['catalogoAdmin/jerarquia:listarClases', { modo: 'ACTIVE' }],
      ['catalogoAdmin/jerarquia:listarFamilias', { claseRecursoId: 'class-1' }],
      [
        'catalogoAdmin/jerarquia:listarTipos',
        {
          cursor: 'opaque-cursor',
          familiaRecursoId: 'family-1',
          pageSize: 20,
        },
      ],
    ])
  })

  it('maps create operations 1:1 with explicit dependent parents', async () => {
    const invoke = vi.fn()
    invoke.mockResolvedValueOnce({
      disposition: 'CREATED',
      item: item({ claseRecursoId: 'class-1' }),
    })
    invoke.mockResolvedValueOnce({
      disposition: 'CREATED',
      item: item({
        aggregateStatus: 'OK',
        familiaRecursoId: 'family-1',
        violations: [],
      }),
    })
    const api = createCatalogHierarchyApi({ invoke })

    await api.createFamily({
      claseRecursoId: 'class-1',
      clave: 'FA-01',
      nombre: 'Familia',
    })
    await api.createType({
      familiaRecursoId: 'family-1',
      clave: 'TY-01',
      nombre: 'Tipo',
    })

    expect(invoke.mock.calls).toEqual([
      [
        'catalogoAdmin/jerarquia:crearFamilia',
        { claseRecursoId: 'class-1', clave: 'FA-01', nombre: 'Familia' },
      ],
      [
        'catalogoAdmin/jerarquia:crearTipo',
        { familiaRecursoId: 'family-1', clave: 'TY-01', nombre: 'Tipo' },
      ],
    ])
  })
})

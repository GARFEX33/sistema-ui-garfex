import { describe, expect, it, vi } from 'vitest'
import { createCatalogHierarchyApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'

const classItem = (extra: Record<string, unknown> = {}) => ({
  activo: false,
  clave: ' CL-01 ',
  effective: false,
  effectiveReasons: ['INACTIVE'],
  id: 'class-1',
  nombre: ' Clase exacta ',
  revision: 1,
  ...extra,
})

const familyItem = (extra: Record<string, unknown> = {}) =>
  classItem({ claseRecursoId: 'class-1', id: 'family-1', ...extra })

const typeItem = (extra: Record<string, unknown> = {}) =>
  classItem({
    aggregateStatus: 'NOT_EVALUATED',
    familiaRecursoId: 'family-1',
    id: 'type-1',
    violations: [],
    ...extra,
  })

describe('catalog hierarchy class creation contract', () => {
  it('sends one exact createClass operation with non-empty description and validates CREATED', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: classItem(),
    })
    const api = createCatalogHierarchyApi({ invoke })

    const result = await api.createClass({
      clave: ' CL-01 ',
      nombre: ' Clase exacta ',
      descripcion: ' descripción exacta ',
    })

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:crearClase',
      Object.freeze({
        clave: ' CL-01 ',
        nombre: ' Clase exacta ',
        descripcion: ' descripción exacta ',
      }),
    )
    expect(result).toEqual({ disposition: 'CREATED', item: classItem() })
  })

  it('omits empty description and inactive while preserving values before async invocation', async () => {
    let resolve!: (value: unknown) => void
    const pending = new Promise<unknown>((res) => {
      resolve = res
    })
    let captured: Readonly<Record<string, unknown>> | undefined
    const invoke = vi.fn(
      (_operation, args: Readonly<Record<string, unknown>>) => {
        captured = args
        return pending
      },
    )
    const input = {
      clave: '\tCL-02  ',
      nombre: ' Nombre  exacto ',
      descripcion: '',
      activo: true,
    }
    const resultPromise = createCatalogHierarchyApi({ invoke }).createClass(
      input,
    )

    input.clave = 'mutated'
    input.nombre = 'mutated'
    input.descripcion = 'mutated'

    expect(captured).toEqual({
      clave: '\tCL-02  ',
      nombre: ' Nombre  exacto ',
    })
    expect(captured && Object.isFrozen(captured)).toBe(true)

    resolve({ disposition: 'CREATED', item: classItem() })
    await expect(resultPromise).resolves.toEqual({
      disposition: 'CREATED',
      item: classItem(),
    })
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:crearClase',
      captured,
    )
  })

  it.each([
    { disposition: 'OK', item: classItem() },
    { disposition: 'CREATED' },
    { disposition: 'CREATED', item: classItem({ nombre: 42 }) },
  ])('rejects an invalid nominal response: %j', async (response) => {
    const invoke = vi.fn().mockResolvedValue(response)
    const api = createCatalogHierarchyApi({ invoke })

    await expect(
      api.createClass({ clave: 'CL-03', nombre: 'Nombre' }),
    ).rejects.toThrow('Invalid catalog hierarchy response')
  })

  it('creates a Family with its explicit Class parent and exact payload', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: familyItem({ clave: ' FA-01 ', nombre: ' Familia exacta ' }),
    })
    const api = createCatalogHierarchyApi({ invoke })

    const result = await api.createFamily({
      claseRecursoId: 'class-1',
      clave: ' FA-01 ',
      nombre: ' Familia exacta ',
      descripcion: ' descripción exacta ',
      activo: true,
    })

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:crearFamilia',
      Object.freeze({
        claseRecursoId: 'class-1',
        clave: ' FA-01 ',
        nombre: ' Familia exacta ',
        descripcion: ' descripción exacta ',
      }),
    )
    expect(result).toEqual({
      disposition: 'CREATED',
      item: familyItem({ clave: ' FA-01 ', nombre: ' Familia exacta ' }),
    })
  })

  it('creates a Type with its explicit Family parent and never sends Class', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: typeItem({ clave: ' TY-01 ', nombre: ' Tipo exacto ' }),
    })
    const api = createCatalogHierarchyApi({ invoke })
    const input = {
      familiaRecursoId: 'family-1',
      clave: ' TY-01 ',
      nombre: ' Tipo exacto ',
      descripcion: '',
      claseRecursoId: 'class-should-not-cross',
      activo: true,
    }

    const result = await api.createType(input)

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:crearTipo',
      Object.freeze({
        familiaRecursoId: 'family-1',
        clave: ' TY-01 ',
        nombre: ' Tipo exacto ',
      }),
    )
    expect(result).toEqual({
      disposition: 'CREATED',
      item: typeItem({ clave: ' TY-01 ', nombre: ' Tipo exacto ' }),
    })
  })

  it('snapshots dependent parents and values before async transport observes mutation', async () => {
    let resolve!: (value: unknown) => void
    const pending = new Promise<unknown>((res) => {
      resolve = res
    })
    let captured: Readonly<Record<string, unknown>> | undefined
    const invoke = vi.fn(
      (_operation, args: Readonly<Record<string, unknown>>) => {
        captured = args
        return pending
      },
    )
    const input = {
      claseRecursoId: 'class-2',
      clave: '\tFA-02  ',
      nombre: ' Familia  exacta ',
      descripcion: '',
    }
    const resultPromise = createCatalogHierarchyApi({ invoke }).createFamily(
      input,
    )

    input.claseRecursoId = 'mutated-parent'
    input.clave = 'mutated'
    input.nombre = 'mutated'
    input.descripcion = 'mutated'

    expect(captured).toEqual({
      claseRecursoId: 'class-2',
      clave: '\tFA-02  ',
      nombre: ' Familia  exacta ',
    })
    expect(captured && Object.isFrozen(captured)).toBe(true)

    resolve({
      disposition: 'CREATED',
      item: familyItem({ claseRecursoId: 'class-2' }),
    })
    await expect(resultPromise).resolves.toMatchObject({
      disposition: 'CREATED',
    })
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it.each([
    { disposition: 'OK', item: familyItem() },
    { disposition: 'CREATED' },
    {
      disposition: 'CREATED',
      item: familyItem({ claseRecursoId: 'other-class' }),
    },
    { disposition: 'CREATED', item: familyItem({ nombre: 42 }) },
  ])('strictly rejects an invalid Family result: %j', async (response) => {
    const invoke = vi.fn().mockResolvedValue(response)
    const api = createCatalogHierarchyApi({ invoke })

    await expect(
      api.createFamily({
        claseRecursoId: 'class-1',
        clave: 'FA-01',
        nombre: 'Familia',
      }),
    ).rejects.toThrow('Invalid catalog hierarchy response')
  })

  it.each([
    { disposition: 'OK', item: typeItem() },
    { disposition: 'CREATED' },
    {
      disposition: 'CREATED',
      item: typeItem({ familiaRecursoId: 'other-family' }),
    },
    { disposition: 'CREATED', item: typeItem({ violations: ['invalid'] }) },
  ])('strictly rejects an invalid Type result: %j', async (response) => {
    const invoke = vi.fn().mockResolvedValue(response)
    const api = createCatalogHierarchyApi({ invoke })

    await expect(
      api.createType({
        familiaRecursoId: 'family-1',
        clave: 'TY-01',
        nombre: 'Tipo',
      }),
    ).rejects.toThrow('Invalid catalog hierarchy response')
  })

  it.each([
    [
      'createFamily',
      { claseRecursoId: undefined, clave: 'FA-01', nombre: 'Familia' },
    ],
    [
      'createFamily',
      { claseRecursoId: null, clave: 'FA-01', nombre: 'Familia' },
    ],
    ['createFamily', { claseRecursoId: '', clave: 'FA-01', nombre: 'Familia' }],
    [
      'createType',
      { familiaRecursoId: undefined, clave: 'TY-01', nombre: 'Tipo' },
    ],
    ['createType', { familiaRecursoId: null, clave: 'TY-01', nombre: 'Tipo' }],
    ['createType', { familiaRecursoId: '', clave: 'TY-01', nombre: 'Tipo' }],
  ] as const)(
    'rejects %s without an explicit valid parent before transport',
    async (method, input) => {
      const invoke = vi.fn()
      const api = createCatalogHierarchyApi({ invoke })

      await expect(api[method](input)).rejects.toThrow()
      expect(invoke).not.toHaveBeenCalled()
    },
  )
})

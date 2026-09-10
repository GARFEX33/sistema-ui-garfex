import { describe, expect, it, vi } from 'vitest'
import {
  createResourcesMasterApi,
  parseAllowedAttributeValuesPage,
  parseAttributeDefinition,
  parseAttributeAssignmentsPage,
  parseAttributeOptionsPage,
  parseContextClassesPage,
  parseContextFamiliesPage,
  parseContextTypesPage,
  parseResourceChangeResult,
  parseResourceCreated,
  parseResourceCreationEvaluation,
  parseResourceCreationResult,
  parseResourceDetail,
  parseResourceListPage,
  parseUnitPoliciesPage,
  parseUnitsPage,
} from '../../src/features/resources-master/resourcesMaster.api'

const summary = (extra: Record<string, unknown> = {}) => ({
  id: 'resource-1',
  identificadorTecnico: 'REC-000001',
  nombre: 'Cable UTP',
  tipoRecursoId: 'type-1',
  unidadId: 'unit-1',
  activo: true,
  revision: 1,
  classificationStatus: { state: 'EFFECTIVE', reasons: [] },
  ...extra,
})

const nativePage = (
  items: unknown[] = [summary()],
  overrides: Record<string, unknown> = {},
) => ({
  page: items,
  isDone: false,
  continueCursor: 'opaque-next',
  ...overrides,
})

const expectGenericListError = (value: unknown) => {
  const payloadMarker = 'private-list-payload-marker'
  let thrown: unknown
  try {
    parseResourceListPage(value)
  } catch (error) {
    thrown = error
  }
  expect(thrown).toMatchObject({
    name: 'Error',
    message: 'Invalid resources master response',
  })
  expect(thrown).not.toMatchObject({ name: 'ZodError' })
  expect((thrown as Error).message).not.toContain(payloadMarker)
}

describe('resources master API boundary', () => {
  it('parses a valid list page and rejects malformed envelopes', () => {
    expect(parseResourceListPage(nativePage()).page[0]?.id).toBe('resource-1')
    expect(() =>
      parseResourceListPage({ isDone: false, continueCursor: 'x' }),
    ).toThrow()
    expect(() => parseResourceListPage(nativePage([{}]))).toThrow()
    expect(() =>
      parseResourceListPage({ page: [], isDone: false, continueCursor: null }),
    ).toThrow()
  })

  it('rejects a resource summary missing required fields', () => {
    expect(() =>
      parseResourceListPage(nativePage([summary({ activo: undefined })])),
    ).toThrow()
    expect(() =>
      parseResourceListPage(nativePage([summary({ revision: '1' })])),
    ).toThrow()
    expect(() =>
      parseResourceListPage(
        nativePage([
          summary({ classificationStatus: { state: 'WRONG', reasons: [] } }),
        ]),
      ),
    ).toThrow()
    expect(() =>
      parseResourceListPage(nativePage([summary({ tipoRecursoId: null })])),
    ).toThrow()
  })

  it('preserves opaque IDs, optional organization IDs, and every classification state', () => {
    const opaqueId = { resource: 'opaque' }
    const opaqueOrganizationId = ['organization', 1]
    const reasons = ['declared inactive']
    const items = [
      summary({
        id: opaqueId,
        tipoRecursoId: 7,
        unidadId: false,
        classificationStatus: { state: 'EFFECTIVE', reasons: [] },
        ignoredItemField: 'ignored',
      }),
      summary({
        organizacionId: opaqueOrganizationId,
        classificationStatus: { state: 'INERT', reasons },
      }),
      summary({
        classificationStatus: {
          state: 'BROKEN_REFERENCE',
          reasons: [],
          ignoredStatusField: 'ignored',
        },
      }),
    ]

    const result = parseResourceListPage(
      nativePage(items, { ignoredEnvelopeField: 'ignored' }),
    )

    expect(result).toEqual({
      page: [
        {
          id: opaqueId,
          identificadorTecnico: 'REC-000001',
          nombre: 'Cable UTP',
          tipoRecursoId: 7,
          unidadId: false,
          activo: true,
          revision: 1,
          classificationStatus: { state: 'EFFECTIVE', reasons: [] },
        },
        {
          id: 'resource-1',
          identificadorTecnico: 'REC-000001',
          nombre: 'Cable UTP',
          tipoRecursoId: 'type-1',
          unidadId: 'unit-1',
          organizacionId: opaqueOrganizationId,
          activo: true,
          revision: 1,
          classificationStatus: { state: 'INERT', reasons },
        },
        {
          id: 'resource-1',
          identificadorTecnico: 'REC-000001',
          nombre: 'Cable UTP',
          tipoRecursoId: 'type-1',
          unidadId: 'unit-1',
          activo: true,
          revision: 1,
          classificationStatus: { state: 'BROKEN_REFERENCE', reasons: [] },
        },
      ],
      isDone: false,
      continueCursor: 'opaque-next',
    })
    expect(result.page).not.toBe(items)
    expect(result.page[1]?.classificationStatus.reasons).not.toBe(reasons)
  })

  it('rejects invalid list envelopes, items, statuses, and reasons generically', () => {
    const payloadMarker = 'private-list-payload-marker'
    for (const value of [
      { isDone: false, continueCursor: 'next' },
      nativePage([], { page: 'not-an-array' }),
      nativePage([], { isDone: 'false' }),
      nativePage([], { continueCursor: null }),
      nativePage([], { continueCursor: 1 }),
      nativePage([{}]),
      nativePage([summary({ id: null })]),
      nativePage([summary({ tipoRecursoId: null })]),
      nativePage([summary({ organizacionId: null })]),
      nativePage([
        summary({ classificationStatus: { state: 'UNKNOWN', reasons: [] } }),
      ]),
      nativePage([
        summary({ classificationStatus: { state: 'EFFECTIVE', reasons: [1] } }),
      ]),
      nativePage([summary({ classificationStatus: payloadMarker })]),
    ]) {
      expectGenericListError(value)
    }
  })

  it('does not coerce, trim, default, infer, or narrow numeric list values', () => {
    const opaqueId = { nested: ['id'] }
    const result = parseResourceListPage(
      nativePage([
        summary({
          id: opaqueId,
          identificadorTecnico: '  REC-000001  ',
          nombre: '  Cable UTP  ',
          organizacionId: undefined,
          revision: Number.NaN,
          classificationStatus: { state: 'INERT', reasons: [] },
        }),
        summary({ revision: Infinity }),
      ]),
    )

    expect(result.page[0]).toMatchObject({
      id: opaqueId,
      identificadorTecnico: '  REC-000001  ',
      nombre: '  Cable UTP  ',
      classificationStatus: { state: 'INERT', reasons: [] },
    })
    expect(result.page[0]).not.toHaveProperty('organizacionId')
    expect(result.page[0]?.revision).toBeNaN()
    expect(result.page[1]?.revision).toBe(Infinity)

    for (const item of [
      summary({ identificadorTecnico: 1 }),
      summary({ activo: 'true' }),
      summary({ revision: '1' }),
      summary({ revision: undefined }),
      summary({ activo: undefined }),
    ]) {
      expectGenericListError(nativePage([item]))
    }
  })

  it('passes through detail null and validates a populated detail', () => {
    expect(parseResourceDetail(null)).toBeNull()
    const detail = {
      ...summary(),
      descripcion: null,
      identidadVersion: null,
      clase: null,
      familia: null,
      tipo: null,
      organizacion: null,
      unidad: null,
      catalogDiagnostics: {},
      valores: [],
    }
    expect(parseResourceDetail(detail)).toMatchObject({ id: 'resource-1' })
    expect(() => parseResourceDetail({ ...detail, valores: 'nope' })).toThrow()
  })

  it('validates created and generic change-result envelopes', () => {
    expect(
      parseResourceCreated({ disposition: 'CREATED', item: summary() }).item.id,
    ).toBe('resource-1')
    expect(() =>
      parseResourceCreated({ disposition: 'OTHER', item: summary() }),
    ).toThrow()
    expect(
      parseResourceChangeResult({ disposition: 'UPDATED', item: summary() })
        .disposition,
    ).toBe('UPDATED')
    expect(() =>
      parseResourceChangeResult({ disposition: '', item: summary() }),
    ).toThrow()
  })

  it('lists resources translating pageSize/cursor into native paginationOpts', async () => {
    const invoke = vi.fn().mockResolvedValue(nativePage())
    const api = createResourcesMasterApi({ invoke })

    await api.listResources({ pageSize: 20 })
    await api.listResources({
      pageSize: 20,
      cursor: 'prev-cursor',
      lifecycle: 'ACTIVE',
      tipoRecursoId: 'type-1',
    })

    expect(invoke.mock.calls).toEqual([
      [
        'catalogoAdmin/recursos:listarRecursosResumen',
        { paginationOpts: { numItems: 20, cursor: null } },
      ],
      [
        'catalogoAdmin/recursos:listarRecursosResumen',
        {
          paginationOpts: { numItems: 20, cursor: 'prev-cursor' },
          lifecycle: 'ACTIVE',
          tipoRecursoId: 'type-1',
        },
      ],
    ])
  })

  it('serializes exactly the deepest hierarchy filter before pagination for list and search', async () => {
    const invoke = vi.fn().mockResolvedValue(nativePage())
    const api = createResourcesMasterApi({ invoke })
    const hierarchy = {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
    }

    await api.listResources({
      pageSize: 20,
      lifecycle: 'ACTIVE',
      claseRecursoId: 'class-1',
    })
    await api.listResources({
      pageSize: 20,
      lifecycle: 'ACTIVE',
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
    })
    await api.listResources({ pageSize: 20, lifecycle: 'ACTIVE', ...hierarchy })
    await api.searchResources({
      pageSize: 20,
      lifecycle: 'ACTIVE',
      searchText: 'cable',
      ...hierarchy,
    })

    expect(invoke.mock.calls).toEqual([
      [
        'catalogoAdmin/recursos:listarRecursosResumen',
        {
          paginationOpts: { numItems: 20, cursor: null },
          lifecycle: 'ACTIVE',
          claseRecursoId: 'class-1',
        },
      ],
      [
        'catalogoAdmin/recursos:listarRecursosResumen',
        {
          paginationOpts: { numItems: 20, cursor: null },
          lifecycle: 'ACTIVE',
          familiaRecursoId: 'family-1',
        },
      ],
      [
        'catalogoAdmin/recursos:listarRecursosResumen',
        {
          paginationOpts: { numItems: 20, cursor: null },
          lifecycle: 'ACTIVE',
          tipoRecursoId: 'type-1',
        },
      ],
      [
        'catalogoAdmin/recursos:buscarRecursosResumen',
        {
          paginationOpts: { numItems: 20, cursor: null },
          lifecycle: 'ACTIVE',
          tipoRecursoId: 'type-1',
          searchText: 'cable',
        },
      ],
    ])
  })

  it('rejects an empty search text before calling transport', async () => {
    const invoke = vi.fn()
    const api = createResourcesMasterApi({ invoke })

    await expect(
      api.searchResources({ pageSize: 10, searchText: '   ' }),
    ).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('sends search args with searchText alongside pagination', async () => {
    const invoke = vi.fn().mockResolvedValue(nativePage())
    const api = createResourcesMasterApi({ invoke })

    await api.searchResources({ pageSize: 10, searchText: 'cable' })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/recursos:buscarRecursosResumen',
      {
        paginationOpts: { numItems: 10, cursor: null },
        searchText: 'cable',
      },
    )
  })

  it('rejects a missing resourceId before calling transport for detail', async () => {
    const invoke = vi.fn()
    const api = createResourcesMasterApi({ invoke })

    await expect(
      api.getResourceDetail({ recursoId: undefined }),
    ).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('creates a resource sending every required field and the ownership envelope', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ disposition: 'CREATED', item: summary() })
    const api = createResourcesMasterApi({ invoke })

    await api.createResource({
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      nombre: 'Cable UTP',
      valores: [],
      ownership: { kind: 'GLOBAL' },
    })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/recursos:crearRecurso', {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      nombre: 'Cable UTP',
      valores: [],
      ownership: { kind: 'GLOBAL' },
    })
  })

  it('updates a resource sending only editable fields, never immutable ones', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ disposition: 'UPDATED', item: summary() })
    const api = createResourcesMasterApi({ invoke })

    await api.updateResource({
      recursoId: 'resource-1',
      expectedRevision: 1,
      nombre: 'Cable UTP cat6',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/recursos:actualizarRecurso',
      {
        recursoId: 'resource-1',
        expectedRevision: 1,
        nombre: 'Cable UTP cat6',
      },
    )
  })

  it('activates and deactivates sending only recursoId and expectedRevision', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ disposition: 'ACTIVATED', item: summary() })
    const api = createResourcesMasterApi({ invoke })

    await api.activateResource({ recursoId: 'resource-1', expectedRevision: 2 })
    await api.deactivateResource({
      recursoId: 'resource-1',
      expectedRevision: 2,
    })

    expect(invoke.mock.calls).toEqual([
      [
        'catalogoAdmin/recursos:activarRecurso',
        { recursoId: 'resource-1', expectedRevision: 2 },
      ],
      [
        'catalogoAdmin/recursos:desactivarRecurso',
        { recursoId: 'resource-1', expectedRevision: 2 },
      ],
    ])
  })

  const contextItem = (extra: Record<string, unknown> = {}) => ({
    id: 'class-1',
    clave: 'MATERIAL',
    nombre: 'Material',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    ...extra,
  })

  const contextPage = (
    items: unknown[] = [contextItem()],
    overrides: Record<string, unknown> = {},
  ) => ({
    items,
    continuationCursor: null,
    isExhausted: true,
    ...overrides,
  })

  it('lists context classes filtered to ACTIVE, rejecting malformed items', async () => {
    const invoke = vi.fn().mockResolvedValue(contextPage())
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listContextClasses({ pageSize: 20 })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:listarClases',
      {
        modo: 'ACTIVE',
        pageSize: 20,
      },
    )
    expect(result.items[0]?.id).toBe('class-1')
    expect(() => parseContextClassesPage(contextPage([{}]))).toThrow()
    expect(parseContextClassesPage(contextPage()).items[0]?.effective).toBe(
      true,
    )
  })

  it('lists context families under a class, rejecting a missing claseRecursoId', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(
        contextPage([
          contextItem({ id: 'family-1', claseRecursoId: 'class-1' }),
        ]),
      )
    const api = createResourcesMasterApi({ invoke })

    await api.listContextFamilies({ claseRecursoId: 'class-1' })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/jerarquia:listarFamilias',
      {
        claseRecursoId: 'class-1',
        modo: 'ACTIVE',
      },
    )
    expect(() =>
      parseContextFamiliesPage(contextPage([contextItem({ id: 'family-1' })])),
    ).toThrow()
    await expect(
      api.listContextFamilies({ claseRecursoId: undefined as never }),
    ).rejects.toThrow()
  })

  it('lists context types under a family, rejecting a missing familiaRecursoId', async () => {
    const invoke = vi.fn().mockResolvedValue(
      contextPage([
        contextItem({
          id: 'type-1',
          familiaRecursoId: 'family-1',
          aggregateStatus: 'CLEAN',
          violations: [],
        }),
      ]),
    )
    const api = createResourcesMasterApi({ invoke })

    await api.listContextTypes({ familiaRecursoId: 'family-1' })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/jerarquia:listarTipos', {
      familiaRecursoId: 'family-1',
      modo: 'ACTIVE',
    })
    expect(() =>
      parseContextTypesPage(
        contextPage([
          contextItem({ id: 'type-1', familiaRecursoId: 'family-1' }),
        ]),
      ),
    ).toThrow()
    await expect(
      api.listContextTypes({ familiaRecursoId: undefined as never }),
    ).rejects.toThrow()
  })

  const policyItem = (extra: Record<string, unknown> = {}) => ({
    id: 'policy-1',
    familiaRecursoId: 'family-1',
    tipoRecursoId: 'type-1',
    unidadId: 'unit-1',
    principal: true,
    activo: true,
    revision: 1,
    effective: true,
    selected: true,
    shadowed: false,
    selection: 'SELECTED',
    ...extra,
  })

  it('lists effective unit policies with the Family and para-Type context only', async () => {
    const invoke = vi.fn().mockResolvedValue(contextPage([policyItem()]))
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listUnitPolicies({
      familiaRecursoId: 'family-1',
      paraTipoRecursoId: 'type-1',
      cursor: 'next-policies',
      pageSize: 20,
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/unidades:listarPoliticasUnidad',
      {
        familiaRecursoId: 'family-1',
        paraTipoRecursoId: 'type-1',
        cursor: 'next-policies',
        pageSize: 20,
        modo: 'ACTIVE',
      },
    )
    expect(invoke.mock.calls[0]?.[1]).not.toHaveProperty('tipoRecursoId')
    expect(result.items[0]).toMatchObject({
      unidadId: 'unit-1',
      principal: true,
    })
    expect(() =>
      parseUnitPoliciesPage(contextPage([policyItem({ selection: 'WRONG' })])),
    ).toThrow()
    await expect(
      api.listUnitPolicies({
        familiaRecursoId: undefined as never,
        paraTipoRecursoId: 'type-1',
      }),
    ).rejects.toThrow()
  })

  const unitDetail = (extra: Record<string, unknown> = {}) => ({
    id: 'unit-1',
    clave: 'M3',
    nombre: 'Metro cúbico',
    simbolo: 'm³',
    activo: true,
    revision: 1,
    effective: true,
    ...extra,
  })

  const unitsPage = (
    items: unknown[] = [unitDetail()],
    overrides: Record<string, unknown> = {},
  ) => ({
    items,
    continuationCursor: null,
    isExhausted: true,
    ...overrides,
  })

  it('lists active Units through the exact paginated query', async () => {
    const invoke = vi.fn().mockResolvedValue(unitsPage())
    const api = createResourcesMasterApi({ invoke })

    await expect(
      api.listUnits({ modo: 'ACTIVE', cursor: null, pageSize: 20 }),
    ).resolves.toEqual(unitsPage())

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/unidades:listarUnidades',
      { modo: 'ACTIVE', cursor: null, pageSize: 20 },
    )
    expect(parseUnitsPage(unitsPage()).items[0]).toMatchObject({
      id: 'unit-1',
      nombre: 'Metro cúbico',
    })
  })

  it('forwards opaque cursors and omits undefined fields without context or pagination leaks', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce(
        unitsPage([unitDetail()], {
          continuationCursor: 'opaque-next',
          isExhausted: false,
        }),
      )
      .mockResolvedValueOnce(unitsPage([unitDetail({ id: 'unit-2' })]))
    const api = createResourcesMasterApi({ invoke })

    await api.listUnits({ modo: 'ACTIVE' })
    await api.listUnits({
      modo: 'ACTIVE',
      cursor: 'opaque-next',
      pageSize: 10,
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      paginationOpts: { cursor: 'wrong', numItems: 1 },
    } as never)

    expect(invoke.mock.calls).toEqual([
      ['catalogoAdmin/unidades:listarUnidades', { modo: 'ACTIVE' }],
      [
        'catalogoAdmin/unidades:listarUnidades',
        { modo: 'ACTIVE', cursor: 'opaque-next', pageSize: 10 },
      ],
    ])
  })

  it('rejects malformed Unit pages atomically for loader retry', async () => {
    const malformed = unitsPage([unitDetail(), null])
    const invoke = vi.fn().mockResolvedValue(malformed)
    const api = createResourcesMasterApi({ invoke })

    expect(() => parseUnitsPage(malformed)).toThrow(
      'Invalid resources master response',
    )
    expect(() =>
      parseUnitsPage(unitsPage([], { continuationCursor: undefined })),
    ).toThrow('Invalid resources master response')
    await expect(api.listUnits({ modo: 'ACTIVE' })).rejects.toThrow(
      'Invalid resources master response',
    )
  })

  it('resolves a unit by id for display, rejecting malformed responses', async () => {
    const invoke = vi.fn().mockResolvedValue(unitDetail())
    const api = createResourcesMasterApi({ invoke })

    const result = await api.getUnit({ unidadId: 'unit-1' })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/unidades:obtenerUnidad',
      {
        unidadId: 'unit-1',
      },
    )
    expect(result).toMatchObject({ nombre: 'Metro cúbico', simbolo: 'm³' })

    invoke.mockResolvedValueOnce(null)
    expect(await api.getUnit({ unidadId: 'unit-1' })).toBeNull()

    invoke.mockResolvedValueOnce(unitDetail({ nombre: undefined }))
    await expect(api.getUnit({ unidadId: 'unit-1' })).rejects.toThrow()
    await expect(
      api.getUnit({ unidadId: undefined as never }),
    ).rejects.toThrow()
  })

  const attributeAssignment = (extra: Record<string, unknown> = {}) => ({
    id: 'atributo-recurso-1',
    familiaRecursoId: 'family-1',
    definicionAtributoId: 'definicion-1',
    tipoRecursoId: 'type-1',
    aplicabilidad: 'REQUIRED',
    participaIdentidad: false,
    orden: 1,
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    selection: 'SELECTED',
    ...extra,
  })

  it('lists attribute assignments for a type, rejecting malformed items and a missing tipoRecursoId', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(contextPage([attributeAssignment()]))
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listAttributeAssignments({
      tipoRecursoId: 'type-1',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:listarAsignacionesAtributo',
      { tipoRecursoId: 'type-1', modo: 'ACTIVE' },
    )
    expect(result.items[0]).toMatchObject({
      id: 'atributo-recurso-1',
      aplicabilidad: 'REQUIRED',
    })
    expect(() =>
      parseAttributeAssignmentsPage(
        contextPage([attributeAssignment({ aplicabilidad: 'WRONG' })]),
      ),
    ).toThrow()
    await expect(
      api.listAttributeAssignments({ tipoRecursoId: undefined as never }),
    ).rejects.toThrow()
  })

  const attributeDefinition = (extra: Record<string, unknown> = {}) => ({
    id: 'definicion-1',
    clave: 'GRANULOMETRIA',
    nombre: 'Granulometría',
    tipoDato: 'OPCION',
    modoCaptura: 'SELECCION',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    ...extra,
  })

  it('resolves an attribute definition by id, rejecting an unknown tipoDato', async () => {
    const invoke = vi.fn().mockResolvedValue(attributeDefinition())
    const api = createResourcesMasterApi({ invoke })

    const result = await api.getAttributeDefinition({
      definicionAtributoId: 'definicion-1',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:obtenerDefinicionAtributo',
      { definicionAtributoId: 'definicion-1' },
    )
    expect(result).toMatchObject({
      nombre: 'Granulometría',
      tipoDato: 'OPCION',
    })

    invoke.mockResolvedValueOnce(null)
    expect(
      await api.getAttributeDefinition({
        definicionAtributoId: 'definicion-1',
      }),
    ).toBeNull()

    invoke.mockResolvedValueOnce(attributeDefinition({ tipoDato: 'WRONG' }))
    await expect(
      api.getAttributeDefinition({ definicionAtributoId: 'definicion-1' }),
    ).rejects.toThrow()
    invoke.mockResolvedValueOnce(attributeDefinition({ id: false }))
    await expect(
      api.getAttributeDefinition({ definicionAtributoId: 'definicion-1' }),
    ).rejects.toThrow('Invalid resources master response')
    await expect(
      api.getAttributeDefinition({ definicionAtributoId: undefined as never }),
    ).rejects.toThrow()
  })

  const attributeOption = (extra: Record<string, unknown> = {}) => ({
    id: 'opcion-1',
    definicionAtributoId: 'definicion-1',
    clave: 'FINA',
    nombre: 'Fina',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
    ...extra,
  })

  it('lists attribute options for a definition, always sending modo ACTIVE', async () => {
    const invoke = vi.fn().mockResolvedValue(contextPage([attributeOption()]))
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listAttributeOptions({
      definicionAtributoId: 'definicion-1',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:listarOpcionesAtributo',
      { definicionAtributoId: 'definicion-1', modo: 'ACTIVE' },
    )
    expect(result.items[0]).toMatchObject({ nombre: 'Fina' })
    expect(() =>
      parseAttributeOptionsPage(
        contextPage([attributeOption({ nombre: undefined })]),
      ),
    ).toThrow()
    await expect(
      api.listAttributeOptions({ definicionAtributoId: undefined as never }),
    ).rejects.toThrow()
  })

  const attributeDefinitionV1 = (extra: Record<string, unknown> = {}) => ({
    id: 'definition-1',
    clave: 'COLOR',
    nombre: 'Color',
    tipoDato: 'OPCION',
    modoCaptura: 'SELECCION',
    activo: true,
    revision: 7,
    effective: true,
    effectiveReasons: ['ACTIVE'],
    ...extra,
  })

  const allowedValue = (extra: Record<string, unknown> = {}) => ({
    id: 'allowed-1',
    definicionAtributoId: 'definition-1',
    clave: 'ROJO',
    nombre: 'Rojo',
    orden: 4,
    activo: true,
    revision: 8,
    effective: true,
    effectiveReasons: ['ACTIVE'],
    valor: { kind: 'TEXTO', value: 'rojo' },
    ...extra,
  })

  const allowedValuesPage = (
    items: unknown[] = [allowedValue()],
    extra: Record<string, unknown> = {},
  ) => ({
    items,
    continuationCursor: 'next-page',
    isExhausted: false,
    ...extra,
  })

  it('parses only the published nullable attribute definition contract', () => {
    expect(parseAttributeDefinition(null)).toBeNull()
    expect(parseAttributeDefinition(attributeDefinitionV1())).toEqual(
      attributeDefinitionV1(),
    )
    expect(
      parseAttributeDefinition(
        attributeDefinitionV1({
          modoCaptura: 'LIBRE',
          descripcion: 'Sólo catálogo',
          unidadId: 'unit-1',
        }),
      ),
    ).toEqual(
      attributeDefinitionV1({
        modoCaptura: 'LIBRE',
        descripcion: 'Sólo catálogo',
        unidadId: 'unit-1',
      }),
    )

    for (const malformed of [
      attributeDefinitionV1({ modoCaptura: 'UNKNOWN' }),
      attributeDefinitionV1({ descripcion: null }),
      attributeDefinitionV1({ unidadId: null }),
      attributeDefinitionV1({ revision: '7' }),
      attributeDefinitionV1({ effectiveReasons: [false] }),
    ])
      expect(() => parseAttributeDefinition(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('rejects non-string IDs and unknown keys at every v1 boundary', () => {
    for (const malformed of [
      attributeDefinitionV1({ id: 7 }),
      attributeDefinitionV1({ unknownDefinitionKey: true }),
    ])
      expect(() => parseAttributeDefinition(malformed)).toThrow(
        'Invalid resources master response',
      )

    for (const malformed of [
      allowedValuesPage([], { unknownPageKey: true }),
      allowedValuesPage([allowedValue({ id: false })]),
      allowedValuesPage([allowedValue({ definicionAtributoId: {} })]),
      allowedValuesPage([
        allowedValue({
          valor: { kind: 'OPCION', opcionAtributoId: true },
        }),
      ]),
      allowedValuesPage([
        allowedValue({
          valor: { kind: 'TEXTO', value: 'rojo', opcionAtributoId: 'option-1' },
        }),
      ]),
      allowedValuesPage([allowedValue({ unknownItemKey: true })]),
    ])
      expect(() => parseAllowedAttributeValuesPage(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('parses exact typed allowed-value pages and rejects malformed variants', () => {
    const variants = [
      allowedValue({ valor: { kind: 'TEXTO', value: 'rojo' } }),
      allowedValue({ id: 'allowed-2', valor: { kind: 'NUMERO', value: 2.5 } }),
      allowedValue({
        id: 'allowed-3',
        valor: { kind: 'BOOLEANO', value: false },
      }),
      allowedValue({
        id: 'allowed-4',
        valor: { kind: 'OPCION', opcionAtributoId: 'option-1' },
      }),
    ]
    expect(
      parseAllowedAttributeValuesPage(allowedValuesPage(variants)),
    ).toEqual(allowedValuesPage(variants))

    for (const malformed of [
      allowedValuesPage([], { continuationCursor: 1 }),
      allowedValuesPage([], { isExhausted: 'false' }),
      allowedValuesPage([allowedValue({ descripcion: null })]),
      allowedValuesPage([
        allowedValue({ valor: { kind: 'UNKNOWN', value: 'x' } }),
      ]),
      allowedValuesPage([allowedValue({ valor: { kind: 'TEXTO' } })]),
      allowedValuesPage([
        allowedValue({ valor: { kind: 'NUMERO', value: '2' } }),
      ]),
      allowedValuesPage([
        allowedValue({ valor: { kind: 'BOOLEANO', value: null } }),
      ]),
      allowedValuesPage([
        allowedValue({
          valor: { kind: 'OPCION', value: 'red', opcionAtributoId: 'option-1' },
        }),
      ]),
      allowedValuesPage([allowedValue({ orden: '4' })]),
      allowedValuesPage([allowedValue({ effectiveReasons: 'ACTIVE' })]),
    ])
      expect(() => parseAllowedAttributeValuesPage(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('lists allowed attribute values with only supplied published arguments', async () => {
    const invoke = vi.fn().mockResolvedValue(allowedValuesPage())
    const api = createResourcesMasterApi({ invoke })

    await expect(
      api.listAllowedAttributeValues({ definicionAtributoId: 'definition-1' }),
    ).resolves.toEqual(allowedValuesPage())
    await api.listAllowedAttributeValues({
      definicionAtributoId: 'definition-1',
      cursor: null,
      pageSize: 25,
      modo: 'INACTIVE',
    })

    expect(invoke.mock.calls).toEqual([
      [
        'catalogoAdmin/atributos:listarValoresPermitidosAtributo',
        { definicionAtributoId: 'definition-1' },
      ],
      [
        'catalogoAdmin/atributos:listarValoresPermitidosAtributo',
        {
          definicionAtributoId: 'definition-1',
          cursor: null,
          pageSize: 25,
          modo: 'INACTIVE',
        },
      ],
    ])

    invoke.mockRejectedValueOnce(new Error('transport down'))
    await expect(
      api.listAllowedAttributeValues({ definicionAtributoId: 'definition-1' }),
    ).rejects.toThrow('transport down')
    await expect(
      api.listAllowedAttributeValues({
        definicionAtributoId: undefined as never,
      }),
    ).rejects.toThrow('Invalid resources master response')
  })

  const evaluationAssignment = (extra: Record<string, unknown> = {}) => ({
    asignacionAtributoId: 'assignment-1',
    definicionAtributoId: 'definition-1',
    aplicabilidadResuelta: 'REQUIRED',
    participaIdentidad: true,
    orden: 1,
    effectiveReasons: ['TYPE_OVERRIDE'],
    ...extra,
  })
  const normalizedValue = (extra: Record<string, unknown> = {}) => ({
    atributoRecursoId: 'assignment-1',
    valor: 'rojo',
    ...extra,
  })
  const evaluationIssue = (extra: Record<string, unknown> = {}) => ({
    code: 'HIERARCHY_INVALID',
    message: 'La jerarquía no es válida.',
    asignacionAtributoId: 'assignment-1',
    ...extra,
  })
  const evaluation = (extra: Record<string, unknown> = {}) => ({
    status: 'VALID',
    valid: true,
    catalogFingerprint: 'catalog-v1',
    nombre: 'Cable rojo',
    identificadorTecnico: 'CABLE-ROJO',
    asignaciones: [evaluationAssignment({ selectedValueId: 'allowed-1' })],
    faltantesRequeridos: [],
    seleccionesInvalidas: [],
    valoresNormalizados: [normalizedValue()],
    issues: [evaluationIssue()],
    ...extra,
  })

  it('parses exact evaluation fixtures for each published status', () => {
    expect(parseResourceCreationEvaluation(evaluation())).toEqual(evaluation())
    expect(
      parseResourceCreationEvaluation(
        evaluation({
          status: 'INCOMPLETE',
          valid: false,
          nombre: null,
          identificadorTecnico: null,
          asignaciones: [
            evaluationAssignment({ aplicabilidadResuelta: 'OPTIONAL' }),
          ],
        }),
      ),
    ).toMatchObject({ status: 'INCOMPLETE', valid: false, nombre: null })
    expect(
      parseResourceCreationEvaluation(
        evaluation({
          status: 'INVALID',
          valid: false,
          asignaciones: [
            evaluationAssignment({ aplicabilidadResuelta: 'NOT_APPLICABLE' }),
          ],
        }),
      ),
    ).toMatchObject({ status: 'INVALID', valid: false })
  })

  it('fails closed for inconsistent status validity and malformed top-level fields', () => {
    for (const malformed of [
      evaluation({ valid: false }),
      evaluation({ status: 'INCOMPLETE', valid: true }),
      evaluation({ catalogFingerprint: 1 }),
      evaluation({ nombre: undefined }),
      evaluation({ identificadorTecnico: undefined }),
      evaluation({ unknownTopLevelKey: true }),
    ])
      expect(() => parseResourceCreationEvaluation(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('requires strict resolved assignments with only published applicability', () => {
    expect(
      parseResourceCreationEvaluation(
        evaluation({
          asignaciones: [
            evaluationAssignment({ aplicabilidadResuelta: 'FORBIDDEN' }),
          ],
        }),
      ).asignaciones[0],
    ).toEqual(evaluationAssignment({ aplicabilidadResuelta: 'FORBIDDEN' }))
    for (const malformed of [
      evaluationAssignment({ asignacionAtributoId: '' }),
      evaluationAssignment({ definicionAtributoId: 1 }),
      evaluationAssignment({ aplicabilidadResuelta: 'CONDITIONAL' }),
      evaluationAssignment({ participaIdentidad: 'true' }),
      evaluationAssignment({ orden: '1' }),
      evaluationAssignment({ effectiveReasons: [false] }),
      evaluationAssignment({ selectedValueId: '' }),
      evaluationAssignment({ unknownAssignmentKey: true }),
    ])
      expect(() =>
        parseResourceCreationEvaluation(
          evaluation({ asignaciones: [malformed] }),
        ),
      ).toThrow('Invalid resources master response')
  })

  it('requires string identifier arrays and normalized primitive values only', () => {
    expect(
      parseResourceCreationEvaluation(
        evaluation({
          faltantesRequeridos: ['assignment-2'],
          seleccionesInvalidas: ['assignment-3'],
          valoresNormalizados: [
            normalizedValue({ valor: 2 }),
            normalizedValue({
              atributoRecursoId: 'assignment-2',
              valor: false,
            }),
            normalizedValue({
              atributoRecursoId: 'assignment-3',
              valor: 'azul',
              opcionAtributoId: 'option-1',
            }),
          ],
        }),
      ).valoresNormalizados,
    ).toHaveLength(3)
    for (const malformed of [
      evaluation({ faltantesRequeridos: [1] }),
      evaluation({ seleccionesInvalidas: [''] }),
      evaluation({ valoresNormalizados: [normalizedValue({ valor: null })] }),
      evaluation({ valoresNormalizados: [normalizedValue({ valor: {} })] }),
      evaluation({
        valoresNormalizados: [
          normalizedValue({ valorPermitidoId: 'allowed-1' }),
        ],
      }),
      evaluation({
        valoresNormalizados: [normalizedValue({ opcionAtributoId: null })],
      }),
    ])
      expect(() => parseResourceCreationEvaluation(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('accepts exactly the published issue codes and strict issue fields', () => {
    const codes = [
      'HIERARCHY_INVALID',
      'UNIT_INVALID',
      'OWNERSHIP_INVALID',
      'ASSIGNMENT_UNKNOWN',
      'ASSIGNMENT_DUPLICATE',
      'ALLOWED_VALUE_UNKNOWN',
      'ALLOWED_VALUE_FOREIGN',
      'ALLOWED_VALUE_INACTIVE',
      'SELECTION_NON_EFFECTIVE',
      'SELECTION_FORBIDDEN',
      'SELECTION_NOT_APPLICABLE',
      'UNSUPPORTED_FREE_CAPTURE',
      'IDENTITY_CONFLICT',
    ]
    expect(
      parseResourceCreationEvaluation(
        evaluation({
          issues: codes.map((code) => evaluationIssue({ code })),
        }),
      ).issues.map((issue) => issue.code),
    ).toEqual(codes)
    for (const malformed of [
      evaluationIssue({ code: 'UNKNOWN' }),
      evaluationIssue({ message: 1 }),
      evaluationIssue({ asignacionAtributoId: '' }),
      evaluationIssue({ unknownIssueKey: true }),
    ])
      expect(() =>
        parseResourceCreationEvaluation(evaluation({ issues: [malformed] })),
      ).toThrow('Invalid resources master response')
  })

  it('evaluates creation through the exact published query and adopts its parsed response', async () => {
    const invoke = vi.fn().mockResolvedValue(evaluation())
    const api = createResourcesMasterApi({ invoke })
    const input = {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      selecciones: [
        { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'allowed-2' },
        { asignacionAtributoId: 'assignment-1', valorPermitidoId: 'allowed-1' },
        { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'allowed-2' },
      ],
      ownership: { kind: 'GLOBAL' as const },
    }

    await expect(api.evaluateResourceCreation(input)).resolves.toEqual(
      evaluation(),
    )
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/recursos:evaluarCreacionDesdeSelecciones',
      input,
    )
  })

  it('serializes ORGANIZATION ownership exactly while preserving selection order and duplicates', async () => {
    const invoke = vi.fn().mockResolvedValue(evaluation())
    const api = createResourcesMasterApi({ invoke })
    const input = {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      selecciones: [
        { asignacionAtributoId: 'assignment-3', valorPermitidoId: 'allowed-3' },
        { asignacionAtributoId: 'assignment-3', valorPermitidoId: 'allowed-3' },
      ],
      ownership: {
        kind: 'ORGANIZATION' as const,
        organizacionId: 'organization-1',
      },
    }

    await api.evaluateResourceCreation(input)

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/recursos:evaluarCreacionDesdeSelecciones',
      input,
    )
  })

  it('fails closed before transport for malformed evaluation requests', async () => {
    const invoke = vi.fn()
    const api = createResourcesMasterApi({ invoke })
    const base = {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      selecciones: [
        { asignacionAtributoId: 'assignment-1', valorPermitidoId: 'allowed-1' },
      ],
      ownership: { kind: 'GLOBAL' },
    }

    for (const invalid of [
      { ...base, claseRecursoId: '' },
      { ...base, familiaRecursoId: 1 },
      {
        ...base,
        selecciones: [
          { asignacionAtributoId: '', valorPermitidoId: 'allowed-1' },
        ],
      },
      {
        ...base,
        selecciones: [
          {
            asignacionAtributoId: 'assignment-1',
            valorPermitidoId: 'allowed-1',
            manual: true,
          },
        ],
      },
      {
        ...base,
        ownership: { kind: 'GLOBAL', organizacionId: 'organization-1' },
      },
      { ...base, ownership: { kind: 'ORGANIZATION' } },
      {
        ...base,
        nombre: 'manual',
        descripcion: 'manual',
        omision: 'assignment-1',
      },
    ])
      await expect(
        api.evaluateResourceCreation(invalid as never),
      ).rejects.toThrow('Invalid resources master response')

    expect(invoke).not.toHaveBeenCalled()
  })

  const selectionCreateInput = (extra: Record<string, unknown> = {}) => ({
    claseRecursoId: 'class-1',
    familiaRecursoId: 'family-1',
    tipoRecursoId: 'type-1',
    unidadId: 'unit-1',
    expectedCatalogFingerprint: 'catalog-v1',
    selecciones: [
      { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'allowed-2' },
      { asignacionAtributoId: 'assignment-1', valorPermitidoId: 'allowed-1' },
      { asignacionAtributoId: 'assignment-2', valorPermitidoId: 'allowed-2' },
    ],
    ownership: { kind: 'GLOBAL' as const },
    ...extra,
  })
  const createdItem = (extra: Record<string, unknown> = {}) => ({
    id: 'resource-1',
    tipoRecursoId: 'type-1',
    unidadId: 'unit-1',
    identificadorTecnico: 'CABLE-ROJO',
    nombre: 'Cable rojo',
    activo: true,
    revision: 1,
    classificationStatus: { state: 'EFFECTIVE' as const, reasons: [] },
    ...extra,
  })

  it('parses only the exact published selection-creation result union', () => {
    expect(
      parseResourceCreationResult({
        disposition: 'CREATED',
        item: createdItem(),
      }),
    ).toEqual({ disposition: 'CREATED', item: createdItem() })
    expect(
      parseResourceCreationResult({
        disposition: 'CREATED',
        item: createdItem({ organizacionId: 'organization-1' }),
      }),
    ).toEqual({
      disposition: 'CREATED',
      item: createdItem({ organizacionId: 'organization-1' }),
    })
    expect(
      parseResourceCreationResult({
        disposition: 'CATALOG_CHANGED',
        evaluation: evaluation({ status: 'INCOMPLETE', valid: false }),
      }),
    ).toMatchObject({
      disposition: 'CATALOG_CHANGED',
      evaluation: { status: 'INCOMPLETE' },
    })
    expect(
      parseResourceCreationResult({
        disposition: 'INCOMPLETE',
        evaluation: evaluation({ status: 'INCOMPLETE', valid: false }),
      }),
    ).toMatchObject({
      disposition: 'INCOMPLETE',
      evaluation: { status: 'INCOMPLETE' },
    })
    expect(
      parseResourceCreationResult({
        disposition: 'INVALID',
        evaluation: evaluation({ status: 'INVALID', valid: false }),
      }),
    ).toMatchObject({
      disposition: 'INVALID',
      evaluation: { status: 'INVALID' },
    })
  })

  it('fails closed for extra, incomplete, or inconsistent selection-creation results', () => {
    for (const malformed of [
      { disposition: 'CREATED', item: createdItem({ id: '' }) },
      { disposition: 'CREATED', item: createdItem({ id: '   ' }) },
      { disposition: 'CREATED', item: createdItem({ tipoRecursoId: '' }) },
      { disposition: 'CREATED', item: createdItem({ unidadId: '' }) },
      { disposition: 'CREATED', item: createdItem({ organizacionId: '' }) },
      { disposition: 'CREATED', item: createdItem({ unknownKey: true }) },
      {
        disposition: 'CREATED',
        item: createdItem({ organizacionId: undefined }),
      },
      {
        disposition: 'CATALOG_CHANGED',
        evaluation: evaluation({ status: 'VALID', valid: true }),
        item: createdItem(),
      },
      {
        disposition: 'CATALOG_CHANGED',
        evaluation: evaluation({ catalogFingerprint: '' }),
      },
      {
        disposition: 'CATALOG_CHANGED',
        evaluation: evaluation({ catalogFingerprint: '   ' }),
      },
      {
        disposition: 'INCOMPLETE',
        evaluation: evaluation({ status: 'INVALID', valid: false }),
      },
      {
        disposition: 'INVALID',
        evaluation: evaluation({ status: 'INCOMPLETE', valid: false }),
      },
      { disposition: 'UNKNOWN', evaluation: evaluation() },
    ])
      expect(() => parseResourceCreationResult(malformed)).toThrow(
        'Invalid resources master response',
      )
  })

  it('maps the v1 selection-create mutation exactly and rejects malformed input before transport', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ disposition: 'CREATED', item: createdItem() })
    const api = createResourcesMasterApi({ invoke })
    const input = selectionCreateInput()

    await expect(api.createResourceFromSelections(input)).resolves.toEqual({
      disposition: 'CREATED',
      item: createdItem(),
    })
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/recursos:crearRecursoDesdeSelecciones',
      input,
    )

    for (const invalid of [
      selectionCreateInput({ claseRecursoId: '' }),
      selectionCreateInput({ expectedCatalogFingerprint: '' }),
      selectionCreateInput({ expectedCatalogFingerprint: '   ' }),
      selectionCreateInput({ unknownKey: true }),
      selectionCreateInput({
        selecciones: [
          { asignacionAtributoId: '', valorPermitidoId: 'allowed-1' },
        ],
      }),
    ])
      await expect(
        api.createResourceFromSelections(invalid as never),
      ).rejects.toThrow('Invalid resources master response')
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed evaluation responses and propagates transport failures', async () => {
    const invoke = vi.fn().mockResolvedValue(evaluation({ unknownKey: true }))
    const api = createResourcesMasterApi({ invoke })
    const input = {
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      selecciones: [],
      ownership: { kind: 'GLOBAL' as const },
    }

    await expect(api.evaluateResourceCreation(input)).rejects.toThrow(
      'Invalid resources master response',
    )
    invoke.mockRejectedValueOnce(new Error('transport down'))
    await expect(api.evaluateResourceCreation(input)).rejects.toThrow(
      'transport down',
    )
  })
})

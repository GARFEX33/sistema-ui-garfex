import { describe, expect, it, vi } from 'vitest'
import {
  createResourcesMasterApi,
  parseAttributeAssignmentsPage,
  parseAttributeOptionsPage,
  parseContextClassesPage,
  parseContextFamiliesPage,
  parseContextTypesPage,
  parseResourceChangeResult,
  parseResourceCreated,
  parseResourceDetail,
  parseResourceListPage,
  parseUnitPoliciesPage,
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

const nativePage = (items: unknown[] = [summary()], overrides: Record<string, unknown> = {}) => ({
  page: items,
  isDone: false,
  continueCursor: 'opaque-next',
  ...overrides,
})

describe('resources master API boundary', () => {
  it('parses a valid list page and rejects malformed envelopes', () => {
    expect(parseResourceListPage(nativePage()).page[0]?.id).toBe('resource-1')
    expect(() => parseResourceListPage({ isDone: false, continueCursor: 'x' })).toThrow()
    expect(() => parseResourceListPage(nativePage([{}]))).toThrow()
    expect(() =>
      parseResourceListPage({ page: [], isDone: false, continueCursor: null }),
    ).toThrow()
  })

  it('rejects a resource summary missing required fields', () => {
    expect(() => parseResourceListPage(nativePage([summary({ activo: undefined })]))).toThrow()
    expect(() => parseResourceListPage(nativePage([summary({ revision: '1' })]))).toThrow()
    expect(() =>
      parseResourceListPage(nativePage([summary({ classificationStatus: { state: 'WRONG', reasons: [] } })])),
    ).toThrow()
    expect(() => parseResourceListPage(nativePage([summary({ tipoRecursoId: null })]))).toThrow()
  })

  it('accepts an optional organizacionId when present and valid', () => {
    const result = parseResourceListPage(nativePage([summary({ organizacionId: 'org-1' })]))
    expect(result.page[0]).toMatchObject({ organizacionId: 'org-1' })
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
    expect(parseResourceCreated({ disposition: 'CREATED', item: summary() }).item.id).toBe('resource-1')
    expect(() => parseResourceCreated({ disposition: 'OTHER', item: summary() })).toThrow()
    expect(parseResourceChangeResult({ disposition: 'UPDATED', item: summary() }).disposition).toBe('UPDATED')
    expect(() => parseResourceChangeResult({ disposition: '', item: summary() })).toThrow()
  })

  it('lists resources translating pageSize/cursor into native paginationOpts', async () => {
    const invoke = vi.fn().mockResolvedValue(nativePage())
    const api = createResourcesMasterApi({ invoke })

    await api.listResources({ pageSize: 20 })
    await api.listResources({ pageSize: 20, cursor: 'prev-cursor', lifecycle: 'ACTIVE', tipoRecursoId: 'type-1' })

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

  it('rejects an empty search text before calling transport', async () => {
    const invoke = vi.fn()
    const api = createResourcesMasterApi({ invoke })

    await expect(api.searchResources({ pageSize: 10, searchText: '   ' })).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('sends search args with searchText alongside pagination', async () => {
    const invoke = vi.fn().mockResolvedValue(nativePage())
    const api = createResourcesMasterApi({ invoke })

    await api.searchResources({ pageSize: 10, searchText: 'cable' })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/recursos:buscarRecursosResumen', {
      paginationOpts: { numItems: 10, cursor: null },
      searchText: 'cable',
    })
  })

  it('rejects a missing resourceId before calling transport for detail', async () => {
    const invoke = vi.fn()
    const api = createResourcesMasterApi({ invoke })

    await expect(api.getResourceDetail({ recursoId: undefined })).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('creates a resource sending every required field and the ownership envelope', async () => {
    const invoke = vi.fn().mockResolvedValue({ disposition: 'CREATED', item: summary() })
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
    const invoke = vi.fn().mockResolvedValue({ disposition: 'UPDATED', item: summary() })
    const api = createResourcesMasterApi({ invoke })

    await api.updateResource({
      recursoId: 'resource-1',
      expectedRevision: 1,
      nombre: 'Cable UTP cat6',
    })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/recursos:actualizarRecurso', {
      recursoId: 'resource-1',
      expectedRevision: 1,
      nombre: 'Cable UTP cat6',
    })
  })

  it('activates and deactivates sending only recursoId and expectedRevision', async () => {
    const invoke = vi.fn().mockResolvedValue({ disposition: 'ACTIVATED', item: summary() })
    const api = createResourcesMasterApi({ invoke })

    await api.activateResource({ recursoId: 'resource-1', expectedRevision: 2 })
    await api.deactivateResource({ recursoId: 'resource-1', expectedRevision: 2 })

    expect(invoke.mock.calls).toEqual([
      ['catalogoAdmin/recursos:activarRecurso', { recursoId: 'resource-1', expectedRevision: 2 }],
      ['catalogoAdmin/recursos:desactivarRecurso', { recursoId: 'resource-1', expectedRevision: 2 }],
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

  const contextPage = (items: unknown[] = [contextItem()], overrides: Record<string, unknown> = {}) => ({
    items,
    continuationCursor: null,
    isExhausted: true,
    ...overrides,
  })

  it('lists context classes filtered to ACTIVE, rejecting malformed items', async () => {
    const invoke = vi.fn().mockResolvedValue(contextPage())
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listContextClasses({ pageSize: 20 })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/jerarquia:listarClases', {
      modo: 'ACTIVE',
      pageSize: 20,
    })
    expect(result.items[0]?.id).toBe('class-1')
    expect(() => parseContextClassesPage(contextPage([{}]))).toThrow()
    expect(parseContextClassesPage(contextPage()).items[0]?.effective).toBe(true)
  })

  it('lists context families under a class, rejecting a missing claseRecursoId', async () => {
    const invoke = vi.fn().mockResolvedValue(
      contextPage([contextItem({ id: 'family-1', claseRecursoId: 'class-1' })]),
    )
    const api = createResourcesMasterApi({ invoke })

    await api.listContextFamilies({ claseRecursoId: 'class-1' })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/jerarquia:listarFamilias', {
      claseRecursoId: 'class-1',
      modo: 'ACTIVE',
    })
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
        contextPage([contextItem({ id: 'type-1', familiaRecursoId: 'family-1' })]),
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

  it('lists unit policies for a type, resolving through paraTipoRecursoId', async () => {
    const invoke = vi.fn().mockResolvedValue(contextPage([policyItem()]))
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listUnitPolicies({ tipoRecursoId: 'type-1' })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/unidades:listarPoliticasUnidad', {
      tipoRecursoId: 'type-1',
      paraTipoRecursoId: 'type-1',
      modo: 'ACTIVE',
    })
    expect(result.items[0]).toMatchObject({ unidadId: 'unit-1', principal: true })
    expect(() =>
      parseUnitPoliciesPage(contextPage([policyItem({ selection: 'WRONG' })])),
    ).toThrow()
    await expect(
      api.listUnitPolicies({ tipoRecursoId: undefined as never }),
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

  it('resolves a unit by id for display, rejecting malformed responses', async () => {
    const invoke = vi.fn().mockResolvedValue(unitDetail())
    const api = createResourcesMasterApi({ invoke })

    const result = await api.getUnit({ unidadId: 'unit-1' })

    expect(invoke).toHaveBeenCalledWith('catalogoAdmin/unidades:obtenerUnidad', {
      unidadId: 'unit-1',
    })
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
    const invoke = vi.fn().mockResolvedValue(contextPage([attributeAssignment()]))
    const api = createResourcesMasterApi({ invoke })

    const result = await api.listAttributeAssignments({ tipoRecursoId: 'type-1' })

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
    expect(result).toMatchObject({ nombre: 'Granulometría', tipoDato: 'OPCION' })

    invoke.mockResolvedValueOnce(null)
    expect(
      await api.getAttributeDefinition({ definicionAtributoId: 'definicion-1' }),
    ).toBeNull()

    invoke.mockResolvedValueOnce(attributeDefinition({ tipoDato: 'WRONG' }))
    await expect(
      api.getAttributeDefinition({ definicionAtributoId: 'definicion-1' }),
    ).rejects.toThrow()
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
      parseAttributeOptionsPage(contextPage([attributeOption({ nombre: undefined })])),
    ).toThrow()
    await expect(
      api.listAttributeOptions({ definicionAtributoId: undefined as never }),
    ).rejects.toThrow()
  })
})

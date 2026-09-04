import { describe, expect, it, vi } from 'vitest'
import {
  createCatalogTypeAttributesApi,
  createCatalogTypeAttributesConvexApi,
  parseAttributeDefinition,
  parseAttributeDefinitionsPage,
  parseAttributeOptionsPage,
  parseAttributeOption,
  parseChangedAttributeDefinition,
  parseChangedAttributeOption,
  parseCreatedAttributeDefinition,
  parseCreatedAttributeOption,
  parseCreatedTypeAttributeAssignment,
  parseTypeAttributeAssignmentsPage,
} from '../../src/features/catalog-hierarchy/catalogTypeAttributes.api'

const assignment = (extra: Record<string, unknown> = {}) => ({
  activo: true,
  aplicabilidad: 'OPTIONAL',
  definicionAtributoId: 'definition-1',
  effective: true,
  effectiveReasons: [],
  familiaRecursoId: 'family-1',
  id: 'assignment-1',
  orden: 1,
  participaIdentidad: false,
  revision: 1,
  selection: 'SELECTED',
  ...extra,
})

const page = (items: unknown[] = [assignment()]) => ({
  continuationCursor: 'opaque-next',
  isExhausted: false,
  items,
})

const definition = (extra: Record<string, unknown> = {}) => ({
  activo: true,
  clave: 'MATERIAL',
  effective: true,
  effectiveReasons: [],
  id: 'definition-1',
  nombre: 'Material',
  revision: 1,
  tipoDato: 'TEXTO',
  ...extra,
})

describe('catalog Type attributes API boundary', () => {
  it('maps Type-scoped assignment arguments to the exact operation', async () => {
    const invoke = vi.fn().mockResolvedValue(page())
    const api = createCatalogTypeAttributesApi({ invoke })

    await api.listTypeAssignments({
      cursor: 'opaque-cursor',
      mode: 'ACTIVE',
      pageSize: 20,
      tipoRecursoId: 'type-1',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:listarAsignacionesAtributo',
      {
        cursor: 'opaque-cursor',
        modo: 'ACTIVE',
        pageSize: 20,
        tipoRecursoId: 'type-1',
      },
    )
  })

  it('preserves inherited assignments and authoritative empty-page cursors', () => {
    const result = parseTypeAttributeAssignmentsPage(
      page([
        assignment({
          effective: false,
          effectiveReasons: ['SHADOWED'],
          selection: 'SHADOWED',
        }),
      ]),
    )
    const empty = parseTypeAttributeAssignmentsPage(page([]))

    expect(result.items[0]).toMatchObject({
      familiaRecursoId: 'family-1',
      selection: 'SHADOWED',
    })
    expect(result.items[0]).not.toHaveProperty('tipoRecursoId')
    expect(empty).toEqual({
      continuationCursor: 'opaque-next',
      isExhausted: false,
      items: [],
    })
  })

  it('lists every definition page with the explicit ALL mode and opaque cursor', async () => {
    const invoke = vi.fn().mockResolvedValue(page([definition()]))
    const api = createCatalogTypeAttributesApi({ invoke })

    await api.listAttributeDefinitions({
      cursor: 'definition-cursor',
      pageSize: 25,
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:listarDefinicionesAtributo',
      { cursor: 'definition-cursor', modo: 'ALL', pageSize: 25 },
    )
  })

  it('creates an inactive Type assignment with its required exact arguments', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: assignment({ tipoRecursoId: 'type-1' }),
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await api.createTypeAttributeAssignment({
      activo: false,
      aplicabilidad: 'OPTIONAL',
      definicionAtributoId: 'definition-1',
      familiaRecursoId: 'family-1',
      orden: 4,
      participaIdentidad: false,
      tipoRecursoId: 'type-1',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:crearAsignacionAtributo',
      {
        activo: false,
        aplicabilidad: 'OPTIONAL',
        definicionAtributoId: 'definition-1',
        familiaRecursoId: 'family-1',
        orden: 4,
        participaIdentidad: false,
        tipoRecursoId: 'type-1',
      },
    )
  })

  it('creates an inactive attribute definition through the exact mutation and omits an absent description', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: definition({ activo: false }),
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await api.createAttributeDefinition({
      activo: false,
      clave: 'PESO',
      nombre: 'Peso',
      tipoDato: 'NUMERO',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:crearDefinicionAtributo',
      { activo: false, clave: 'PESO', nombre: 'Peso', tipoDato: 'NUMERO' },
    )
  })

  it('rejects malformed definition pages and non-CREATED mutation results', () => {
    expect(() =>
      parseAttributeDefinitionsPage(page([definition({ nombre: 1 })])),
    ).toThrow()
    expect(() =>
      parseCreatedAttributeDefinition({ disposition: 'EXISTS' }),
    ).toThrow()
    expect(() =>
      parseCreatedAttributeDefinition({ disposition: 'CREATED' }),
    ).toThrow()
    expect(() =>
      parseCreatedTypeAttributeAssignment({ disposition: 'EXISTS' }),
    ).toThrow()
    expect(() =>
      parseCreatedTypeAttributeAssignment({ disposition: 'CREATED' }),
    ).toThrow()
  })

  it('looks up definitions and preserves a valid null response', async () => {
    const invoke = vi.fn().mockResolvedValue(null)
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(api.getAttributeDefinition('definition-1')).resolves.toBeNull()
    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:obtenerDefinicionAtributo',
      { definicionAtributoId: 'definition-1' },
    )
  })

  it('rejects an invalid Convex URL before attempting transport construction', async () => {
    const api = createCatalogTypeAttributesConvexApi({ url: 'not-a-url' })

    await expect(
      api.listTypeAssignments({ tipoRecursoId: 'type-1' }),
    ).rejects.toThrow('Catalog Type attributes transport unavailable')
  })

  it('rejects malformed input, envelopes, and items before exposing them', async () => {
    const invoke = vi.fn().mockResolvedValue(page())
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(
      api.listTypeAssignments({ tipoRecursoId: '' }),
    ).rejects.toThrow()
    await expect(
      api.listTypeAssignments({ tipoRecursoId: null }),
    ).rejects.toThrow()
    expect(invoke).not.toHaveBeenCalled()
    expect(() =>
      parseTypeAttributeAssignmentsPage({ items: [], isExhausted: false }),
    ).toThrow()
    expect(() =>
      parseTypeAttributeAssignmentsPage(
        page([assignment({ selection: 'UNKNOWN' })]),
      ),
    ).toThrow()
    expect(() =>
      parseAttributeDefinition(definition({ tipoDato: 'UNKNOWN' })),
    ).toThrow()
  })

  it('rejects malformed Convex ID inputs before invoking transport', async () => {
    const invoke = vi.fn().mockResolvedValue(page())
    const api = createCatalogTypeAttributesApi({ invoke })
    const malformedIds = ['', 0, true, {}]

    for (const id of malformedIds) {
      await expect(
        api.listTypeAssignments({ tipoRecursoId: id }),
      ).rejects.toThrow()
      await expect(api.getAttributeDefinition(id)).rejects.toThrow()
    }

    expect(invoke).not.toHaveBeenCalled()
  })

  it('rejects malformed Convex IDs and revisions in parsed responses', () => {
    const malformedIds = ['', 0, true, {}]
    const assignmentIdFields = [
      'id',
      'familiaRecursoId',
      'definicionAtributoId',
      'tipoRecursoId',
    ]
    const malformedRevisions = [0, -1, 1.5, Number.NaN, Infinity, '1', true, {}]

    for (const id of malformedIds) {
      for (const field of assignmentIdFields) {
        expect(() =>
          parseTypeAttributeAssignmentsPage(
            page([assignment({ [field]: id })]),
          ),
        ).toThrow()
      }
      expect(() => parseAttributeDefinition(definition({ id }))).toThrow()
      expect(() =>
        parseAttributeDefinition(definition({ unidadId: id })),
      ).toThrow()
    }

    for (const revision of malformedRevisions) {
      expect(() =>
        parseTypeAttributeAssignmentsPage(page([assignment({ revision })])),
      ).toThrow()
      expect(() => parseAttributeDefinition(definition({ revision }))).toThrow()
    }
  })

  it('updates editable definition fields while preserving the immutable key and unit null semantics', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'UNCHANGED',
      item: definition({ activo: false }),
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(
      api.updateAttributeDefinition({
        definicionAtributoId: 'definition-1',
        expectedRevision: 3,
        nombre: 'Peso neto',
        tipoDato: 'NUMERO',
        unidadId: null,
      }),
    ).resolves.toMatchObject({ disposition: 'UNCHANGED' })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:actualizarDefinicionAtributo',
      {
        definicionAtributoId: 'definition-1',
        expectedRevision: 3,
        nombre: 'Peso neto',
        tipoDato: 'NUMERO',
        unidadId: null,
      },
    )
  })

  it('lists option pages with caller-selected lifecycle mode and preserves pagination', async () => {
    const invoke = vi.fn().mockResolvedValue({
      continuationCursor: 'next-options',
      isExhausted: false,
      items: [
        {
          activo: false,
          clave: 'ROJO',
          definicionAtributoId: 'definition-1',
          effective: false,
          effectiveReasons: ['INACTIVE'],
          id: 'option-1',
          nombre: 'Rojo',
          revision: 2,
        },
      ],
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(
      api.listAttributeOptions({
        cursor: 'options-cursor',
        definicionAtributoId: 'definition-1',
        mode: 'ALL',
        pageSize: 10,
      }),
    ).resolves.toEqual({
      continuationCursor: 'next-options',
      isExhausted: false,
      items: [expect.objectContaining({ id: 'option-1', revision: 2 })],
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:listarOpcionesAtributo',
      {
        cursor: 'options-cursor',
        definicionAtributoId: 'definition-1',
        modo: 'ALL',
        pageSize: 10,
      },
    )
  })

  it('creates options with explicit lifecycle and omits absent descriptions', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: {
        activo: false,
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        effective: false,
        effectiveReasons: ['INACTIVE'],
        id: 'option-1',
        nombre: 'Rojo',
        revision: 1,
      },
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await api.createAttributeOption({
      activo: false,
      clave: 'ROJO',
      definicionAtributoId: 'definition-1',
      nombre: 'Rojo',
    })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:crearOpcionAtributo',
      {
        activo: false,
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        nombre: 'Rojo',
      },
    )
  })

  it('updates only mutable option fields and parses change dispositions', async () => {
    const invoke = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: {
        activo: true,
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        descripcion: 'Color rojo',
        effective: true,
        effectiveReasons: [],
        id: 'option-1',
        nombre: 'Rojo intenso',
        revision: 3,
      },
    })
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(
      api.updateAttributeOption({
        descripcion: 'Color rojo',
        expectedRevision: 2,
        nombre: 'Rojo intenso',
        opcionAtributoId: 'option-1',
      }),
    ).resolves.toMatchObject({ disposition: 'UPDATED' })

    expect(invoke).toHaveBeenCalledWith(
      'catalogoAdmin/atributos:actualizarOpcionAtributo',
      {
        descripcion: 'Color rojo',
        expectedRevision: 2,
        nombre: 'Rojo intenso',
        opcionAtributoId: 'option-1',
      },
    )
  })

  it('uses exact option lifecycle operations and preserves their dispositions', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        disposition: 'UNCHANGED',
        item: {
          activo: true,
          clave: 'ROJO',
          definicionAtributoId: 'definition-1',
          effective: true,
          effectiveReasons: [],
          id: 'option-1',
          nombre: 'Rojo',
          revision: 3,
        },
      })
      .mockResolvedValueOnce({
        disposition: 'UPDATED',
        item: {
          activo: false,
          clave: 'ROJO',
          definicionAtributoId: 'definition-1',
          effective: false,
          effectiveReasons: ['INACTIVE'],
          id: 'option-1',
          nombre: 'Rojo',
          revision: 4,
        },
      })
    const api = createCatalogTypeAttributesApi({ invoke })

    await expect(
      api.activateAttributeOption({
        expectedRevision: 3,
        opcionAtributoId: 'option-1',
      }),
    ).resolves.toMatchObject({ disposition: 'UNCHANGED' })
    await expect(
      api.deactivateAttributeOption({
        expectedRevision: 3,
        opcionAtributoId: 'option-1',
      }),
    ).resolves.toMatchObject({ disposition: 'UPDATED' })

    expect(invoke).toHaveBeenNthCalledWith(
      1,
      'catalogoAdmin/atributos:activarOpcionAtributo',
      { expectedRevision: 3, opcionAtributoId: 'option-1' },
    )
    expect(invoke).toHaveBeenNthCalledWith(
      2,
      'catalogoAdmin/atributos:desactivarOpcionAtributo',
      { expectedRevision: 3, opcionAtributoId: 'option-1' },
    )
  })

  it('rejects malformed option inputs, pages, items, revisions, and dispositions', async () => {
    const invoke = vi.fn().mockResolvedValue(page())
    const api = createCatalogTypeAttributesApi({ invoke })
    const malformedIds = ['', 0, true, {}]
    const malformedRevisions = [0, -1, 1.5, Number.NaN, Infinity, '1', true, {}]

    for (const id of malformedIds) {
      await expect(
        api.listAttributeOptions({ definicionAtributoId: id, mode: 'ALL' }),
      ).rejects.toThrow()
      await expect(
        api.createAttributeOption({
          activo: false,
          clave: 'ROJO',
          definicionAtributoId: id,
          nombre: 'Rojo',
        }),
      ).rejects.toThrow()
      expect(() => parseAttributeOption({ id })).toThrow()
    }
    for (const revision of malformedRevisions) {
      await expect(
        api.updateAttributeOption({
          expectedRevision: revision,
          opcionAtributoId: 'option-1',
        }),
      ).rejects.toThrow()
      await expect(
        api.updateAttributeDefinition({
          definicionAtributoId: 'definition-1',
          expectedRevision: revision,
        }),
      ).rejects.toThrow()
    }

    await expect(
      api.listAttributeOptions({ mode: 'UNKNOWN' }),
    ).rejects.toThrow()
    await expect(
      api.createAttributeOption({
        activo: 'false',
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        nombre: 'Rojo',
      }),
    ).rejects.toThrow()
    expect(() =>
      parseAttributeOptionsPage({
        continuationCursor: null,
        isExhausted: false,
        items: [{ id: 'option-1', revision: 1 }],
      }),
    ).toThrow()
    expect(() =>
      parseAttributeOption({
        activo: true,
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        effective: true,
        effectiveReasons: [],
        id: 'option-1',
        nombre: 'Rojo',
        revision: 1,
        unexpected: 'accepted by parser but not a contract field',
      }),
    ).not.toThrow()
    expect(() =>
      parseAttributeOption({
        activo: true,
        clave: 'ROJO',
        definicionAtributoId: 'definition-1',
        effective: true,
        effectiveReasons: [],
        id: 'option-1',
        nombre: 'Rojo',
        revision: 1,
        descripcion: null,
      }),
    ).toThrow()
    expect(() =>
      parseChangedAttributeDefinition({
        disposition: 'CREATED',
        item: definition(),
      }),
    ).toThrow()
    expect(() =>
      parseChangedAttributeOption({ disposition: 'CREATED' }),
    ).toThrow()
    expect(() =>
      parseCreatedAttributeOption({ disposition: 'UPDATED' }),
    ).toThrow()
    expect(invoke).not.toHaveBeenCalled()
  })
})

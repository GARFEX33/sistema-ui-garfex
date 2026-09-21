import { describe, expect, it, vi } from 'vitest'
import { createResourcesMasterRestApi } from '../../src/features/resources-master/resourcesMaster.api'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'

const restResource = (extra: Record<string, unknown> = {}) => ({
  id: 'resource-1',
  identityV1: 'CABLE/001',
  scope: {
    classCode: 'MATERIAL',
    familyCode: 'CONDUCTORES',
    typeCode: 'CABLE',
  },
  naturalUnit: 'M',
  active: true,
  revision: '7',
  attributes: [
    { code: 'COLOR', value: { kind: 'TEXT', value: 'rojo' } },
    { code: 'PESO', value: { kind: 'QUANTITY', value: '1.5', unitCode: 'KG' } },
  ],
  ...extra,
})

const restPage = (resources: unknown[] = [restResource()]) => ({
  resources,
  hasPrevious: false,
  hasNext: true,
})

const restResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const catalogRecord = (
  kind: 'CLASE' | 'FAMILIA' | 'TIPO' | 'UNIDAD',
  values: Record<string, unknown>,
) => ({
  kind,
  id: kind + '-1',
  revision: '7',
  active: true,
  values,
  rules: [],
})

describe('resources master REST read boundary', () => {
  it('reads a strict ResourcePage with every documented query parameter', async () => {
    const fetch = vi.fn(async () => restResponse(restPage()))
    const api = createResourcesMasterRestApi(fetch)

    await expect(
      api.listResources({
        scope: 'ACTIVE',
        text: 'cable & cobre',
        classCode: 'MATERIAL',
        familyCode: 'CONDUCTORES',
        typeCode: 'CABLE',
        limit: 20,
        offset: 40,
      }),
    ).resolves.toMatchObject({
      resources: [
        {
          id: 'resource-1',
          identityV1: 'CABLE/001',
          revision: '7',
          attributes: [
            { code: 'COLOR', value: { kind: 'TEXT', value: 'rojo' } },
            {
              code: 'PESO',
              value: { kind: 'QUANTITY', value: '1.5', unitCode: 'KG' },
            },
          ],
        },
      ],
      hasPrevious: false,
      hasNext: true,
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/resources?scope=ACTIVE&text=cable+%26+cobre&classCode=MATERIAL&familyCode=CONDUCTORES&typeCode=CABLE&limit=20&offset=40',
      { signal: undefined },
    )
  })

  it('reads TIPO with only its familyCode hierarchy filter', async () => {
    const fetch = vi.fn(async () =>
      restResponse({
        records: [
          catalogRecord('TIPO', {
            code: { kind: 'CODE', value: 'UTP' },
            name: { kind: 'TEXT', value: 'UTP' },
            family: {
              kind: 'REFERENCE',
              reference: { kind: 'FAMILIA', id: '2', code: 'CABLE' },
            },
            class: {
              kind: 'REFERENCE',
              reference: { kind: 'CLASE', id: '1', code: 'MATERIAL' },
            },
          }),
        ],
        hasPrevious: false,
        hasNext: true,
      }),
    )

    await expect(
      createResourcesMasterRestApi(fetch).listHierarchyTypes({
        classCode: 'MATERIAL',
        familyCode: 'CABLE',
        scope: 'ACTIVE',
        limit: 20,
        offset: 0,
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'TIPO-1',
          code: 'UTP',
          name: 'UTP',
          active: true,
          revision: '7',
          classCode: 'MATERIAL',
          familyCode: 'CABLE',
        },
      ],
      hasPrevious: false,
      hasNext: true,
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/TIPO?scope=ACTIVE&limit=20&offset=0&familyCode=CABLE',
      { signal: undefined },
    )
  })

  it('encodes special characters in a hierarchy filter', async () => {
    const classCode = 'MATERIAL & ACERO'
    const fetch = vi.fn(async () =>
      restResponse({
        records: [
          catalogRecord('FAMILIA', {
            code: { kind: 'CODE', value: 'PERFILES' },
            name: { kind: 'TEXT', value: 'Perfiles' },
            class: {
              kind: 'REFERENCE',
              reference: { kind: 'CLASE', id: '1', code: classCode },
            },
          }),
        ],
        hasPrevious: false,
        hasNext: false,
      }),
    )

    await expect(
      createResourcesMasterRestApi(fetch).listHierarchyFamilies({
        classCode,
        scope: 'ACTIVE',
        limit: 20,
        offset: 0,
      }),
    ).resolves.toMatchObject({ items: [{ classCode }] })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/FAMILIA?scope=ACTIVE&limit=20&offset=0&classCode=MATERIAL+%26+ACERO',
      { signal: undefined },
    )
  })

  it('rejects a FAMILIA page with a mismatched class reference', async () => {
    const api = createResourcesMasterRestApi(async () =>
      restResponse({
        records: [
          catalogRecord('FAMILIA', {
            code: { kind: 'CODE', value: 'CABLE' },
            name: { kind: 'TEXT', value: 'Cable' },
            class: {
              kind: 'REFERENCE',
              reference: { kind: 'CLASE', id: '1', code: 'OTHER' },
            },
          }),
        ],
        hasPrevious: false,
        hasNext: false,
      }),
    )

    await expect(
      api.listHierarchyFamilies({
        classCode: 'MATERIAL',
        scope: 'ACTIVE',
        limit: 20,
        offset: 0,
      }),
    ).rejects.toThrow('Invalid resources master response')
  })

  it('uses REST window flags without accepting or returning cursor semantics', async () => {
    const fetch = vi.fn(async () =>
      restResponse({
        records: [],
        hasPrevious: true,
        hasNext: false,
      }),
    )

    await expect(
      createResourcesMasterRestApi(fetch).listHierarchyClasses({
        scope: 'ACTIVE',
        limit: 20,
        offset: 20,
        cursor: 'legacy-cursor',
      } as never),
    ).resolves.toEqual({ items: [], hasPrevious: true, hasNext: false })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/CLASE?scope=ACTIVE&limit=20&offset=20',
      { signal: undefined },
    )
  })

  it('reads UNIDAD with symbol and dimension and passes through window pagination', async () => {
    const fetch = vi.fn(async () =>
      restResponse({
        records: [
          catalogRecord('UNIDAD', {
            code: { kind: 'CODE', value: 'M' },
            name: { kind: 'TEXT', value: 'Metro' },
            symbol: { kind: 'TEXT', value: 'M' },
            dimension: { kind: 'TEXT', value: 'LENGTH' },
          }),
        ],
        hasPrevious: true,
        hasNext: false,
      }),
    )

    await expect(
      createResourcesMasterRestApi(fetch).listUnits({
        scope: 'ACTIVE',
        text: 'metro',
        limit: 20,
        offset: 20,
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'UNIDAD-1',
          code: 'M',
          name: 'Metro',
          active: true,
          revision: '7',
          symbol: 'M',
          dimension: 'LENGTH',
        },
      ],
      hasPrevious: true,
      hasNext: false,
    })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/UNIDAD?scope=ACTIVE&text=metro&limit=20&offset=20',
      { signal: undefined },
    )
  })

  it('rejects a UNIDAD page whose record kind is not UNIDAD', async () => {
    const api = createResourcesMasterRestApi(async () =>
      restResponse({
        records: [
          catalogRecord('CLASE', {
            code: { kind: 'CODE', value: 'M' },
            name: { kind: 'TEXT', value: 'Metro' },
            symbol: { kind: 'TEXT', value: 'M' },
            dimension: { kind: 'TEXT', value: 'LENGTH' },
          }),
        ],
        hasPrevious: false,
        hasNext: false,
      }),
    )

    await expect(
      api.listUnits({ scope: 'ACTIVE', limit: 20, offset: 0 }),
    ).rejects.toThrow('Invalid resources master response')
  })

  it.each(['code', 'name', 'symbol', 'dimension'] as const)(
    'rejects a UNIDAD record missing %s',
    async (missingField) => {
      const values: Record<string, unknown> = {
        code: { kind: 'CODE', value: 'M' },
        name: { kind: 'TEXT', value: 'Metro' },
        symbol: { kind: 'TEXT', value: 'M' },
        dimension: { kind: 'TEXT', value: 'LENGTH' },
      }
      delete values[missingField]
      const api = createResourcesMasterRestApi(async () =>
        restResponse({
          records: [catalogRecord('UNIDAD', values)],
          hasPrevious: false,
          hasNext: false,
        }),
      )

      await expect(
        api.listUnits({ scope: 'ACTIVE', limit: 20, offset: 0 }),
      ).rejects.toThrow('Invalid resources master response')
    },
  )

  it('rejects a UNIDAD record whose symbol is not a TEXT CatalogValue', async () => {
    const api = createResourcesMasterRestApi(async () =>
      restResponse({
        records: [
          catalogRecord('UNIDAD', {
            code: { kind: 'CODE', value: 'M' },
            name: { kind: 'TEXT', value: 'Metro' },
            symbol: { kind: 'CODE', value: 'M' },
            dimension: { kind: 'TEXT', value: 'LENGTH' },
          }),
        ],
        hasPrevious: false,
        hasNext: false,
      }),
    )

    await expect(
      api.listUnits({ scope: 'ACTIVE', limit: 20, offset: 0 }),
    ).rejects.toThrow('Invalid resources master response')
  })

  it('rejects a UNIDAD record whose dimension is not a TEXT CatalogValue', async () => {
    const api = createResourcesMasterRestApi(async () =>
      restResponse({
        records: [
          catalogRecord('UNIDAD', {
            code: { kind: 'CODE', value: 'M' },
            name: { kind: 'TEXT', value: 'Metro' },
            symbol: { kind: 'TEXT', value: 'M' },
            dimension: { kind: 'CODE', value: 'LENGTH' },
          }),
        ],
        hasPrevious: false,
        hasNext: false,
      }),
    )

    await expect(
      api.listUnits({ scope: 'ACTIVE', limit: 20, offset: 0 }),
    ).rejects.toThrow('Invalid resources master response')
  })

  it('accepts every CatalogValue variant and refuses invalid string fields', async () => {
    const values = [
      { kind: 'TEXT', value: 'text' },
      { kind: 'CODE', value: 'CODE' },
      { kind: 'BOOLEAN', value: false },
      { kind: 'INTEGER', value: '-2' },
      { kind: 'DECIMAL', value: '1.5' },
      { kind: 'QUANTITY', value: '1.5', unitCode: 'KG' },
      {
        kind: 'REFERENCE',
        reference: { kind: 'CLASE', id: '1', code: 'MATERIAL' },
      },
      { kind: 'ENUM', value: 'enum' },
      { kind: 'STRING_LIST', values: ['one'] },
      { kind: 'CONTROLLED_OPTION', value: 'option' },
      { kind: 'NOT_APPLICABLE' },
    ]
    const api = createResourcesMasterRestApi(async () =>
      restResponse(
        restPage([
          restResource({
            attributes: values.map((value, index) => ({
              code: 'ATTRIBUTE_' + index,
              value,
            })),
          }),
        ]),
      ),
    )

    const page = await api.listResources({
      scope: 'ALL',
      limit: 20,
      offset: 0,
    })
    expect(page.resources[0]?.attributes.map(({ value }) => value)).toEqual(
      values,
    )
    const invalid = createResourcesMasterRestApi(async () =>
      restResponse(
        restPage([
          restResource({
            id: 1,
            attributes: [
              { code: 'COLOR', value: { kind: 'NOT_APPLICABLE', value: 'x' } },
            ],
          }),
        ]),
      ),
    )
    await expect(
      invalid.listResources({ scope: 'ALL', limit: 20, offset: 0 }),
    ).rejects.toThrow('Invalid resources master response')
  })

  it('encodes detail segments and reads only the confirmed description route', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(restResponse(restResource()))
      .mockResolvedValueOnce(
        restResponse({ description: 'Cable para interior' }),
      )
    const api = createResourcesMasterRestApi(fetch)
    const input = { classCode: 'MATERIAL/ES', identityV1: 'CABLE/ 001' }

    await expect(api.getResourceDetail(input)).resolves.toMatchObject({
      identityV1: 'CABLE/001',
      revision: '7',
    })
    await expect(api.describeResource(input)).resolves.toBe(
      'Cable para interior',
    )
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/v1/resources/MATERIAL%2FES/CABLE%2F%20001',
      '/v1/resources/MATERIAL%2FES/CABLE%2F%20001/describe',
    ])
  })

  it('rejects invalid JSON/DTO, documented HTTP failures, network, and aborts without an empty result', async () => {
    const input = { scope: 'ALL' as const, limit: 20, offset: 0 }
    const invalidDto = createResourcesMasterRestApi(async () =>
      restResponse(restPage([restResource({ revision: 7 })])),
    )
    await expect(invalidDto.listResources(input)).rejects.toThrow(
      'Invalid resources master response',
    )

    for (const status of [400, 404, 409, 422, 500, 503]) {
      const api = createResourcesMasterRestApi(async () =>
        restResponse({ error: 'request rejected' }, status),
      )
      await expect(api.listResources(input)).rejects.toThrow('request rejected')
    }

    const invalidJson = createResourcesMasterRestApi(async () => ({
      ok: true,
      status: 200,
      json: async () => Promise.reject(new SyntaxError('invalid JSON')),
    }))
    await expect(invalidJson.listResources(input)).rejects.toThrow(
      'invalid JSON',
    )
    const network = createResourcesMasterRestApi(async () => {
      throw new TypeError('network unavailable')
    })
    await expect(network.listResources(input)).rejects.toThrow(
      'network unavailable',
    )
    const aborted = createResourcesMasterRestApi(async () => {
      throw new DOMException('aborted', 'AbortError')
    })
    await expect(aborted.listResources(input)).rejects.toThrow('aborted')
  })

  const effectiveAttributesInput = {
    classCode: 'MATERIAL & BASE',
    familyCode: 'CONDUCTORES/1',
    typeCode: 'CABLE / 1',
  }

  const effectiveAttributesResponse = {
    typeCode: effectiveAttributesInput.typeCode,
    attributes: [
      {
        characteristic: {
          code: 'durable',
          name: 'Durable',
          valueType: 'BOOLEAN',
          dimension: 'logical',
        },
        effectiveMode: 'CONDITIONAL',
        identityParticipates: true,
        notApplicable: false,
        position: 4,
        hasPosition: true,
        optionSetCode: 'CABLE_OPTIONS',
        options: [{ code: 'COPPER', label: 'Copper' }],
        source: { level: 'TYPE', code: effectiveAttributesInput.typeCode },
        rules: [
          {
            attributeCode: 'conductive',
            equals: { kind: 'BOOLEAN', value: true },
            mode: 'FORBIDDEN',
            identityParticipates: false,
            notApplicable: true,
            active: true,
          },
        ],
      },
    ],
  }

  it('requests the encoded type effective attributes endpoint sharing the catalog parser', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(restResponse(effectiveAttributesResponse))
    const api = createResourcesMasterRestApi(fetch)

    await expect(
      api.getTypeEffectiveAttributes(effectiveAttributesInput),
    ).resolves.toEqual(effectiveAttributesResponse)
    expect(fetch).toHaveBeenCalledWith(
      '/v1/types/CABLE%20%2F%201/attributes/effective?classCode=MATERIAL+%26+BASE&familyCode=CONDUCTORES%2F1',
      { signal: undefined },
    )
  })

  it('fails closed before HTTP for incomplete context and rejects a mismatched or malformed response', async () => {
    const fetch = vi.fn()
    const api = createResourcesMasterRestApi(fetch)

    await expect(
      api.getTypeEffectiveAttributes({
        ...effectiveAttributesInput,
        familyCode: '',
      }),
    ).rejects.toThrow('Invalid resources master response')
    expect(fetch).not.toHaveBeenCalled()

    fetch.mockResolvedValueOnce(
      restResponse({ ...effectiveAttributesResponse, typeCode: 'OTHER' }),
    )
    await expect(
      api.getTypeEffectiveAttributes(effectiveAttributesInput),
    ).rejects.toThrow('Invalid catalog type effective attributes response')

    fetch.mockResolvedValueOnce(
      restResponse({
        typeCode: effectiveAttributesInput.typeCode,
        attributes: [
          { ...effectiveAttributesResponse.attributes[0], options: null },
        ],
      }),
    )
    await expect(
      api.getTypeEffectiveAttributes(effectiveAttributesInput),
    ).rejects.toThrow('Invalid catalog type effective attributes response')

    fetch.mockResolvedValueOnce(restResponse({ error: 'Rejected' }, 422))
    await expect(
      api.getTypeEffectiveAttributes(effectiveAttributesInput),
    ).rejects.toThrow('Rejected')
  })
})

describe('resources master REST create boundary', () => {
  const createInput = {
    scope: {
      classCode: 'MATERIAL',
      familyCode: 'CONDUCTORES',
      typeCode: 'CABLE',
    },
    naturalUnit: 'M',
    attributes: [{ code: 'COLOR', value: { kind: 'TEXT', value: 'rojo' } }],
  }

  it('creates a Resource through the documented REST endpoint with the actor-gated body', async () => {
    const fetch = vi.fn(async () => restResponse(restResource(), 201))

    await expect(
      createResourcesMasterRestApi(fetch, {
        actor: 'resources-user',
      }).createResource(createInput),
    ).resolves.toEqual(restResource())
    expect(fetch).toHaveBeenCalledWith('/v1/resources', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor: 'resources-user',
        scope: createInput.scope,
        naturalUnit: createInput.naturalUnit,
        attributes: createInput.attributes,
      }),
    })
  })

  it('fails closed without an actor and issues no fetch call', async () => {
    const fetch = vi.fn()

    await expect(
      createResourcesMasterRestApi(fetch, { actor: '' }).createResource(
        createInput,
      ),
    ).rejects.toBeInstanceOf(RestActorConfigurationError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('surfaces the documented ErrorEnvelope message for a non-201 response without retrying', async () => {
    for (const status of [400, 404, 409, 422, 500, 503]) {
      const fetch = vi.fn(async () =>
        restResponse({ error: 'request rejected' }, status),
      )
      await expect(
        createResourcesMasterRestApi(fetch, {
          actor: 'resources-user',
        }).createResource(createInput),
      ).rejects.toThrow('request rejected')
      expect(fetch).toHaveBeenCalledOnce()
    }
  })

  it('falls back to an HTTP status message when the error body is not a valid envelope', async () => {
    const fetch = vi.fn(async () => restResponse({}, 409))

    await expect(
      createResourcesMasterRestApi(fetch, {
        actor: 'resources-user',
      }).createResource(createInput),
    ).rejects.toThrow('HTTP 409')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('rejects a 201 response whose body is not a valid Resource', async () => {
    const fetch = vi.fn(async () =>
      restResponse(restResource({ revision: 7 }), 201),
    )

    await expect(
      createResourcesMasterRestApi(fetch, {
        actor: 'resources-user',
      }).createResource(createInput),
    ).rejects.toThrow('Invalid resources master response')
  })
})

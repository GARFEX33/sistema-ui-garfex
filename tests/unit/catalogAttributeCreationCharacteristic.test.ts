import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'

const input = {
  code: 'INSULATION',
  name: 'Insulation',
  valueType: 'CONTROLLED_OPTION',
} as const

const values = (valueType = input.valueType) => ({
  code: { kind: 'CODE', value: input.code },
  name: { kind: 'TEXT', value: input.name },
  valueType: { kind: 'ENUM', value: valueType },
})
const created = (overrides: Record<string, unknown> = {}) => ({
  kind: 'CARACTERISTICA',
  id: '4',
  revision: '0',
  active: true,
  values: values(),
  rules: [],
  ...overrides,
})
const response = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 201 })

const api = (fetch: typeof globalThis.fetch) =>
  createCatalogAttributeCreationApi(fetch, { actor: 'catalog-admin' })

const rejected = (kind: string, status?: number) =>
  expect.objectContaining({
    failure: expect.objectContaining({
      kind,
      ...(status === undefined ? {} : { status }),
    }),
  })

describe('catalog attribute characteristic creation API', () => {
  it('posts only the documented characteristic fields and returns the confirmed record', async () => {
    const fetch = vi.fn(async () =>
      response(created()),
    ) as unknown as typeof globalThis.fetch

    await expect(api(fetch).createCharacteristic(input)).resolves.toEqual({
      kind: 'CARACTERISTICA',
      id: '4',
      revision: '0',
      active: true,
      code: input.code,
      name: input.name,
      valueType: input.valueType,
      rules: [],
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/v1/catalog/CARACTERISTICA', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor: 'catalog-admin',
        active: true,
        values: {
          code: { kind: 'CODE', value: input.code },
          name: { kind: 'TEXT', value: input.name },
          valueType: { kind: 'ENUM', value: input.valueType },
        },
      }),
    })
  })

  it.each([
    'CONTROLLED_OPTION',
    'INTEGER',
    'DECIMAL',
    'QUANTITY',
    'BOOLEAN',
    'CONTROLLED_TEXT',
  ] as const)('accepts only documented valueType %s', async (valueType) => {
    const fetch = vi.fn(async () =>
      response(created({ values: values(valueType) })),
    ) as unknown as typeof globalThis.fetch

    await expect(
      api(fetch).createCharacteristic({ ...input, valueType }),
    ).resolves.toMatchObject({ valueType })
  })

  it('fails closed before fetch for an invalid actor or valueType', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch
    for (const actor of [undefined, '', '   ']) {
      await expect(
        createCatalogAttributeCreationApi(fetch, {
          actor,
        }).createCharacteristic(input),
      ).rejects.toEqual(rejected('configuration'))
    }
    await expect(
      api(fetch).createCharacteristic({ ...input, valueType: 'TEXT' }),
    ).rejects.toEqual(rejected('contract-gap'))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves validated HTTP error fields without retry', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: 'duplicate',
            code: 'DUPLICATE',
            detail: 'Characteristic code already exists',
          }),
          { status: 409 },
        ),
    ) as unknown as typeof globalThis.fetch

    await expect(api(fetch).createCharacteristic(input)).rejects.toMatchObject({
      failure: {
        kind: 'http',
        status: 409,
        error: 'duplicate',
        code: 'DUPLICATE',
        detail: 'Characteristic code already exists',
      },
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('returns shared failures for network, invalid JSON, and invalid 201 schemas without retry', async () => {
    const network = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof globalThis.fetch
    const invalidJson = vi.fn(async () => ({
      status: 201,
      json: async () => {
        throw new SyntaxError('bad json')
      },
    })) as unknown as typeof globalThis.fetch
    const invalidSchema = vi.fn(
      async () =>
        new Response(JSON.stringify(created({ id: '0' })), { status: 201 }),
    ) as unknown as typeof globalThis.fetch

    await expect(api(network).createCharacteristic(input)).rejects.toEqual(
      rejected('network'),
    )
    await expect(api(invalidJson).createCharacteristic(input)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(
      api(invalidSchema).createCharacteristic(input),
    ).rejects.toEqual(rejected('invalid-response'))
    expect(network).toHaveBeenCalledTimes(1)
    expect(invalidJson).toHaveBeenCalledTimes(1)
    expect(invalidSchema).toHaveBeenCalledTimes(1)
  })

  it('rejects non-echoed fields and invalid confirmed record state', async () => {
    const malformed = [
      created({ kind: 'OPCION' }),
      created({ revision: '-1' }),
      created({ active: 'yes' }),
      created({ active: false }),
      created({ rules: [{}] }),
      created({ values: values('INTEGER') }),
    ]
    for (const body of malformed) {
      const fetch = vi.fn(
        async () => new Response(JSON.stringify(body), { status: 201 }),
      ) as unknown as typeof globalThis.fetch
      await expect(api(fetch).createCharacteristic(input)).rejects.toEqual(
        rejected('invalid-response'),
      )
    }
  })
})

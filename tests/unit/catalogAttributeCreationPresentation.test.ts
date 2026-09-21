import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'
import type { CatalogPresentationCreateInput } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.types'

const reference = (kind: string, id: string, code: string) => ({
  kind: 'REFERENCE' as const,
  reference: { kind, id, code },
})
const input = (
  overrides: Record<string, unknown> = {},
): CatalogPresentationCreateInput =>
  ({
    class: reference('CLASE', '1', 'MATERIAL'),
    family: reference('FAMILIA', '2', 'CONDUCTORES'),
    type: reference('TIPO', '3', 'CABLE'),
    characteristic: reference('CARACTERISTICA', '4', 'INSULATION'),
    position: '1',
    ...overrides,
  }) as CatalogPresentationCreateInput
const values = (current = input()) => ({
  class: current.class,
  family: current.family,
  type: current.type,
  characteristic: current.characteristic,
  position: { kind: 'INTEGER', value: current.position },
})
const wireReference = (value: ReturnType<typeof reference>) => ({
  kind: 'REFERENCE' as const,
  reference: { ...value.reference, id: '0' },
})
const wireValues = (current = input()) => ({
  class: wireReference(current.class),
  family: wireReference(current.family),
  type: wireReference(current.type),
  characteristic: wireReference(current.characteristic),
  position: { kind: 'INTEGER', value: current.position },
})
const created = (
  current = input(),
  overrides: Record<string, unknown> = {},
) => ({
  kind: 'PRESENTACION',
  id: '6',
  revision: '0',
  active: true,
  values: values(current),
  rules: [],
  ...overrides,
})
const response = (body: unknown, status = 201) =>
  new Response(JSON.stringify(body), { status })
const api = (fetch: typeof globalThis.fetch) =>
  createCatalogAttributeCreationApi(fetch, { actor: 'catalog-admin' })
const rejected = (kind: string, status?: number) =>
  expect.objectContaining({
    failure: expect.objectContaining({
      kind,
      ...(status === undefined ? {} : { status }),
    }),
  })

describe('catalog presentation creation API', () => {
  it('posts one explicit canonical position and returns the strictly echoed record', async () => {
    const current = input({ position: '12' })
    const fetch = vi.fn(async () =>
      response(created(current)),
    ) as unknown as typeof globalThis.fetch

    await expect(api(fetch).createPresentation(current)).resolves.toEqual({
      kind: 'PRESENTACION',
      id: '6',
      revision: '0',
      active: true,
      ...current,
      rules: [],
    })
    expect(fetch).toHaveBeenCalledWith('/v1/catalog/PRESENTACION', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor: 'catalog-admin',
        active: true,
        values: wireValues(current),
      }),
    })
  })

  it('fails closed before fetch for an invalid actor, position, or canonical reference', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch
    for (const actor of [undefined, '', '   '])
      await expect(
        createCatalogAttributeCreationApi(fetch, { actor }).createPresentation(
          input(),
        ),
      ).rejects.toEqual(rejected('configuration'))
    for (const invalid of [
      input({ position: '0' }),
      input({ position: '01' }),
      input({ position: '1.0' }),
      input({ position: '-1' }),
      input({ position: 1 }),
      input({ position: undefined }),
      input({ type: reference('FAMILIA', '3', 'CABLE') }),
    ])
      await expect(api(fetch).createPresentation(invalid)).rejects.toEqual(
        rejected('contract-gap'),
      )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns RestFailure without retry and rejects non-echoed 201 records', async () => {
    const current = input()
    const http = vi.fn(async () =>
      response(
        {
          error: 'conflict',
          code: 'CONFLICT',
          detail: 'Presentation already exists',
        },
        409,
      ),
    ) as unknown as typeof globalThis.fetch
    const network = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof globalThis.fetch
    const invalidJson = vi.fn(async () => ({
      status: 201,
      json: async () => {
        throw new SyntaxError('bad json')
      },
    })) as unknown as typeof globalThis.fetch
    const invalid = vi.fn(async () =>
      response(
        created(current, {
          values: {
            ...values(current),
            position: { kind: 'INTEGER', value: '2' },
          },
        }),
      ),
    ) as unknown as typeof globalThis.fetch
    const inactive = vi.fn(async () =>
      response(created(current, { active: false })),
    ) as unknown as typeof globalThis.fetch
    const mismatchedReference = vi.fn(async () =>
      response(
        created(current, {
          values: {
            ...values(current),
            characteristic: wireReference(current.characteristic),
          },
        }),
      ),
    ) as unknown as typeof globalThis.fetch

    await expect(api(http).createPresentation(current)).rejects.toMatchObject({
      failure: {
        kind: 'http',
        status: 409,
        error: 'conflict',
        code: 'CONFLICT',
        detail: 'Presentation already exists',
      },
    })
    await expect(api(network).createPresentation(current)).rejects.toEqual(
      rejected('network'),
    )
    await expect(api(invalidJson).createPresentation(current)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(api(invalid).createPresentation(current)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(api(inactive).createPresentation(current)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(
      api(mismatchedReference).createPresentation(current),
    ).rejects.toEqual(rejected('invalid-response'))
    expect(http).toHaveBeenCalledTimes(1)
    expect(network).toHaveBeenCalledTimes(1)
    expect(invalidJson).toHaveBeenCalledTimes(1)
    expect(invalid).toHaveBeenCalledTimes(1)
    expect(inactive).toHaveBeenCalledTimes(1)
    expect(mismatchedReference).toHaveBeenCalledTimes(1)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { createCatalogAttributeCreationApi } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.api'
import type { CatalogApplicabilityCreateInput } from '../../src/features/catalog-hierarchy/catalogAttributeCreation.types'
const reference = (kind: string, id: string, code: string) => ({
  kind: 'REFERENCE' as const,
  reference: { kind, id, code },
})
const input = (
  overrides: Record<string, unknown> = {},
): CatalogApplicabilityCreateInput =>
  ({
    class: reference('CLASE', '1', 'MATERIAL'),
    family: reference('FAMILIA', '2', 'CONDUCTORES'),
    type: reference('TIPO', '3', 'CABLE'),
    characteristic: reference('CARACTERISTICA', '4', 'INSULATION'),
    characteristicValueType: 'CONTROLLED_OPTION',
    mode: 'REQUIRED',
    optionSet: reference('CONJUNTO_OPCIONES', '5', 'INSULATION_OPTIONS'),
    identityParticipates: true,
    rules: [],
    ...overrides,
  }) as CatalogApplicabilityCreateInput
const values = (current = input()) => ({
  class: current.class,
  family: current.family,
  type: current.type,
  characteristic: current.characteristic,
  mode: { kind: 'ENUM', value: current.mode },
  ...(current.optionSet === undefined ? {} : { optionSet: current.optionSet }),
  identityParticipates: {
    kind: 'BOOLEAN',
    value: current.identityParticipates,
  },
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
  mode: { kind: 'ENUM', value: current.mode },
  ...(current.optionSet === undefined
    ? {}
    : { optionSet: wireReference(current.optionSet) }),
  identityParticipates: {
    kind: 'BOOLEAN',
    value: current.identityParticipates,
  },
})
const created = (
  current = input(),
  overrides: Record<string, unknown> = {},
) => ({
  kind: 'APLICABILIDAD',
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
describe('catalog applicability creation API', () => {
  it('posts one documented simple applicability and returns its confirmed record', async () => {
    const current = input()
    const fetch = vi.fn(async () =>
      response(created(current)),
    ) as unknown as typeof globalThis.fetch
    const { characteristicValueType, ...expected } = current
    expect(characteristicValueType).toBe('CONTROLLED_OPTION')
    await expect(api(fetch).createApplicability(current)).resolves.toEqual({
      kind: 'APLICABILIDAD',
      id: '6',
      revision: '0',
      active: true,
      ...expected,
    })
    expect(fetch).toHaveBeenCalledWith('/v1/catalog/APLICABILIDAD', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor: 'catalog-admin',
        active: true,
        values: wireValues(current),
        rules: [],
      }),
    })
  })
  it.each(['REQUIRED', 'OPTIONAL', 'FORBIDDEN'] as const)(
    'accepts documented simple mode %s',
    async (mode) => {
      const current = input({ mode, optionSet: undefined })
      delete current.optionSet
      const fetch = vi.fn(async () =>
        response(created(current)),
      ) as unknown as typeof globalThis.fetch
      const result = await api(fetch).createApplicability(current)
      expect(result).toMatchObject({ mode })
      expect(result).not.toHaveProperty('optionSet')
    },
  )
  it('fails closed before fetch for invalid actor, rules, modes, references, or option sets', async () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch
    for (const actor of [undefined, '', '   '])
      await expect(
        createCatalogAttributeCreationApi(fetch, { actor }).createApplicability(
          input(),
        ),
      ).rejects.toEqual(rejected('configuration'))
    for (const invalid of [
      input({ mode: 'CONDITIONAL' }),
      input({ rules: [{}] }),
      input({ class: reference('FAMILIA', '1', 'MATERIAL') }),
      input({ characteristicValueType: 'INTEGER' }),
    ])
      await expect(api(fetch).createApplicability(invalid)).rejects.toEqual(
        rejected('contract-gap'),
      )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('returns shared failures without retry and rejects a non-echoed 201 record', async () => {
    const current = input()
    const http = vi.fn(async () =>
      response(
        {
          error: 'conflict',
          code: 'CONFLICT',
          detail: 'Applicability already exists',
        },
        409,
      ),
    ) as unknown as typeof globalThis.fetch
    const network = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof globalThis.fetch
    const invalid = vi.fn(async () =>
      response(created(current, { rules: [{}] })),
    ) as unknown as typeof globalThis.fetch
    const inactive = vi.fn(async () =>
      response(created(current, { active: false })),
    ) as unknown as typeof globalThis.fetch
    const nonCanonicalReference = vi.fn(async () =>
      response(
        created(current, {
          values: { ...values(current), class: wireReference(current.class) },
        }),
      ),
    ) as unknown as typeof globalThis.fetch
    await expect(api(http).createApplicability(current)).rejects.toMatchObject({
      failure: {
        kind: 'http',
        status: 409,
        error: 'conflict',
        code: 'CONFLICT',
        detail: 'Applicability already exists',
      },
    })
    await expect(api(network).createApplicability(current)).rejects.toEqual(
      rejected('network'),
    )
    await expect(api(invalid).createApplicability(current)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(api(inactive).createApplicability(current)).rejects.toEqual(
      rejected('invalid-response'),
    )
    await expect(
      api(nonCanonicalReference).createApplicability(current),
    ).rejects.toEqual(rejected('invalid-response'))
    expect(http).toHaveBeenCalledTimes(1)
    expect(network).toHaveBeenCalledTimes(1)
    expect(invalid).toHaveBeenCalledTimes(1)
    expect(inactive).toHaveBeenCalledTimes(1)
    expect(nonCanonicalReference).toHaveBeenCalledTimes(1)
  })
})

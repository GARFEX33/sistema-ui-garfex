import { describe, expect, it, vi } from 'vitest'
import { createCatalogOptionsAdminApi } from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.api'

const input = {
  optionSetCode: 'DEFAULT / A',
  characteristicCode: 'insulation & core',
  offset: 20,
  limit: 10,
}
const reference = (kind: string, id: string, code: string) => ({
  kind: 'REFERENCE',
  reference: { kind, id, code },
})
const page = {
  records: [
    {
      kind: 'OPCION',
      id: '8',
      revision: '1',
      active: false,
      values: {
        optionSet: reference('CONJUNTO_OPCIONES', '1', input.optionSetCode),
        characteristic: reference(
          'CARACTERISTICA',
          '3',
          input.characteristicCode,
        ),
        code: { kind: 'CODE', value: 'FIBERGLASS' },
        label: { kind: 'TEXT', value: 'Fiberglass' },
      },
      rules: [],
    },
  ],
  hasPrevious: true,
  hasNext: false,
}

describe('catalog options admin REST API', () => {
  it('uses only the encoded documented option window query and forwards AbortSignal', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => page })
    const signal = new AbortController().signal
    await expect(
      createCatalogOptionsAdminApi(fetch).list({ ...input, signal }),
    ).resolves.toMatchObject({ hasPrevious: true, hasNext: false })
    expect(fetch).toHaveBeenCalledWith(
      '/v1/catalog/OPCION?scope=ALL&optionSetCode=DEFAULT+%2F+A&characteristicCode=insulation+%26+core&limit=10&offset=20',
      { signal },
    )
  })

  it('resolves only exact canonical references from complete, non-continuing public pages', async () => {
    const referencePage = (kind: string, id: string, code: string) => ({
      records: [
        {
          kind,
          id,
          revision: '0',
          active: true,
          values: { code: { kind: 'CODE', value: code } },
          rules: [],
        },
      ],
      hasPrevious: false,
      hasNext: false,
    })
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          referencePage('CONJUNTO_OPCIONES', '1', input.optionSetCode),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          referencePage('CARACTERISTICA', '3', input.characteristicCode),
      })
    await expect(
      createCatalogOptionsAdminApi(fetch).resolveReferences(input),
    ).resolves.toEqual({
      optionSet: {
        kind: 'CONJUNTO_OPCIONES',
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA',
        id: '3',
        code: input.characteristicCode,
      },
    })
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.signal])).toEqual([
      [
        '/v1/catalog/CONJUNTO_OPCIONES?scope=ALL&text=DEFAULT+%2F+A&limit=50&offset=0',
        undefined,
      ],
      [
        '/v1/catalog/CARACTERISTICA?scope=ALL&text=insulation+%26+core&limit=50&offset=0',
        undefined,
      ],
    ])
  })

  it('fails before fetch without both codes or a valid REST window', async () => {
    const fetch = vi.fn()
    await expect(
      createCatalogOptionsAdminApi(fetch).list({ ...input, optionSetCode: '' }),
    ).rejects.toThrow()
    await expect(
      createCatalogOptionsAdminApi(fetch).list({ ...input, offset: -1 }),
    ).rejects.toThrow()
    await expect(
      createCatalogOptionsAdminApi(fetch).list({ ...input, limit: 0 }),
    ).rejects.toThrow()
    await expect(
      createCatalogOptionsAdminApi(fetch).list({ ...input, offset: 0.5 }),
    ).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('normalizes create and update references while preserving canonical responses', async () => {
    const values = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: input.characteristicCode,
      },
      code: 'FIBERGLASS',
      label: 'Fiberglass',
    }
    const command = { id: '8', expectedRevision: '1', values }
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 201, json: async () => page.records[0] })
      .mockResolvedValueOnce({ status: 200, json: async () => page.records[0] })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ ...page.records[0], active: false }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ ...page.records[0], active: true }),
      })
    const api = createCatalogOptionsAdminApi(fetch, { actor: 'catalog-admin' })
    await expect(api.create({ values })).resolves.toMatchObject({ id: '8' })
    await expect(api.update(command)).resolves.toMatchObject({ id: '8' })
    await expect(api.deactivate(command)).resolves.toMatchObject({
      active: false,
    })
    await expect(api.reactivate(command)).resolves.toMatchObject({
      active: true,
    })
    expect(values).toMatchObject({
      optionSet: { id: '1', code: input.optionSetCode },
      characteristic: { id: '3', code: input.characteristicCode },
    })
    expect(
      fetch.mock.calls.map(([url, init]) => [
        url,
        init?.method,
        JSON.parse(init?.body as string),
      ]),
    ).toStrictEqual([
      [
        '/v1/catalog/OPCION',
        'POST',
        {
          actor: 'catalog-admin',
          active: true,
          values: {
            optionSet: reference('CONJUNTO_OPCIONES', '0', input.optionSetCode),
            characteristic: reference(
              'CARACTERISTICA',
              '0',
              input.characteristicCode,
            ),
            code: { kind: 'CODE', value: 'FIBERGLASS' },
            label: { kind: 'TEXT', value: 'Fiberglass' },
          },
        },
      ],
      [
        '/v1/catalog/OPCION/8',
        'PUT',
        {
          actor: 'catalog-admin',
          expectedRevision: '1',
          values: {
            optionSet: reference('CONJUNTO_OPCIONES', '0', input.optionSetCode),
            characteristic: reference(
              'CARACTERISTICA',
              '0',
              input.characteristicCode,
            ),
            code: { kind: 'CODE', value: 'FIBERGLASS' },
            label: { kind: 'TEXT', value: 'Fiberglass' },
          },
        },
      ],
      [
        '/v1/catalog/OPCION/8/deactivate',
        'POST',
        { actor: 'catalog-admin', expectedRevision: '1' },
      ],
      [
        '/v1/catalog/OPCION/8/reactivate',
        'POST',
        { actor: 'catalog-admin', expectedRevision: '1' },
      ],
    ])
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(
      false,
    )
  })

  it('deletes with the exact 204 REST contract without reading a success body', async () => {
    const json = vi.fn()
    const fetch = vi.fn().mockResolvedValue({ status: 204, json })
    const api = createCatalogOptionsAdminApi(fetch, { actor: 'catalog-admin' })

    await expect(
      api.delete({ id: '8', expectedRevision: '1' }),
    ).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('/v1/catalog/OPCION/8', {
      body: JSON.stringify({ actor: 'catalog-admin', expectedRevision: '1' }),
      headers: { 'content-type': 'application/json' },
      method: 'DELETE',
    })
    expect(json).not.toHaveBeenCalled()
  })

  it('fails closed before fetch for invalid actors, identifiers, revisions, or mutation values', async () => {
    const values = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: input.characteristicCode,
      },
      code: 'FIBERGLASS',
      label: 'Fiberglass',
    }
    const fetch = vi.fn()
    for (const actor of [undefined, '', ' ']) {
      const noActor = createCatalogOptionsAdminApi(fetch, { actor })
      await expect(noActor.create({ values })).rejects.toThrow()
      await expect(
        noActor.delete({ id: '8', expectedRevision: '1' }),
      ).rejects.toThrow()
    }
    const api = createCatalogOptionsAdminApi(fetch, { actor: 'catalog-admin' })
    await expect(
      api.update({ id: '0', expectedRevision: '1', values }),
    ).rejects.toThrow()
    await expect(
      api.update({ id: 8, expectedRevision: 1, values } as never),
    ).rejects.toThrow()
    await expect(
      api.delete({ id: '0', expectedRevision: '1' }),
    ).rejects.toThrow()
    await expect(
      api.delete({ id: '8', expectedRevision: '-1' }),
    ).rejects.toThrow()
    await expect(
      api.create({
        values: { ...values, optionSet: { ...values.optionSet, id: '0' } },
      }),
    ).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps conflicts distinct and propagates validation, availability, network, and JSON failures without retry', async () => {
    const values = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: input.characteristicCode,
      },
      code: 'FIBERGLASS',
      label: 'Fiberglass',
    }
    const command = { id: '8', expectedRevision: '1', values }
    const fetch = vi.fn()
    const api = createCatalogOptionsAdminApi(fetch, { actor: 'catalog-admin' })
    fetch.mockResolvedValueOnce({
      status: 409,
      json: async () => ({ error: 'stale', code: 'CONFLICT' }),
    })
    await expect(api.update(command)).rejects.toMatchObject({
      name: 'CatalogOptionsAdminConflictError',
      status: 409,
      code: 'CONFLICT',
    })
    fetch.mockResolvedValueOnce({
      status: 409,
      json: async () => ({ error: 'still in use', code: 'IN_USE' }),
    })
    await expect(
      api.delete({ id: '8', expectedRevision: '1' }),
    ).rejects.toMatchObject({
      name: 'CatalogOptionsAdminHttpError',
      status: 409,
      code: 'IN_USE',
    })
    fetch.mockResolvedValueOnce({
      status: 422,
      json: async () => ({ error: 'invalid', code: 'VALIDATION' }),
    })
    await expect(api.create({ values })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION',
    })
    fetch.mockResolvedValueOnce({
      status: 503,
      json: async () => ({ error: 'down' }),
    })
    await expect(api.reactivate(command)).rejects.toMatchObject({ status: 503 })
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.deactivate(command)).rejects.toThrow('offline')
    fetch.mockResolvedValueOnce({
      status: 201,
      json: async () => ({ kind: 'OPCION' }),
    })
    await expect(api.create({ values })).rejects.toThrow(
      'Invalid catalog options admin response',
    )
    fetch.mockResolvedValueOnce({
      status: 201,
      json: async () => {
        throw new Error('JSON')
      },
    })
    await expect(api.create({ values })).rejects.toThrow('JSON')
    expect(fetch).toHaveBeenCalledTimes(7)
  })

  it('retains detail only for the two public error-envelope combinations', async () => {
    const values = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES' as const,
        id: '1',
        code: input.optionSetCode,
      },
      characteristic: {
        kind: 'CARACTERISTICA' as const,
        id: '3',
        code: input.characteristicCode,
      },
      code: 'FIBERGLASS',
      label: 'Fiberglass',
    }
    const fetch = vi.fn()
    const api = createCatalogOptionsAdminApi(fetch, { actor: 'catalog-admin' })
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({
        error: 'invalid request',
        detail: 'Código duplicado',
      }),
    })
    await expect(api.create({ values })).rejects.toMatchObject({
      status: 400,
      message: 'invalid request',
      detail: 'Código duplicado',
    })
    fetch.mockResolvedValueOnce({
      status: 404,
      json: async () => ({ error: 'not found', detail: 'private identifier' }),
    })
    await expect(api.create({ values })).rejects.toMatchObject({
      status: 404,
      message: 'not found',
      detail: undefined,
    })
  })

  it('normalizes HTTP envelopes, HTTP status, network, and JSON failures without fallback', async () => {
    const fetch = vi.fn()
    const api = createCatalogOptionsAdminApi(fetch)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Rejected' }),
    })
    await expect(api.list(input)).rejects.toThrow('Rejected')
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ problem: 'down' }),
    })
    await expect(api.list(input)).rejects.toThrow('HTTP 503')
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.list(input)).rejects.toThrow('offline')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('JSON')
      },
    })
    await expect(api.list(input)).rejects.toThrow('JSON')
  })
})

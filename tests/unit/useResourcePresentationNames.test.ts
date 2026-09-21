import { StrictMode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourcePresentationNames } from '../../src/features/resources-master/useResourcePresentationNames'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { Resource } from '../../src/features/resources-master/resourcesMaster.types'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

const attribute = (
  overrides: Partial<EffectiveAttribute> & { code: string },
): EffectiveAttribute => ({
  characteristic: {
    code: overrides.code,
    name: overrides.code,
    valueType: 'CONTROLLED_TEXT',
  },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: true,
  options: [],
  source: { level: 'TYPE', code: 'TIPO-1' },
  rules: [],
  ...overrides,
})

const resource = (overrides: Partial<Resource> & { id: string }): Resource => ({
  identityV1: `identity-${overrides.id}`,
  scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
  naturalUnit: 'PZA',
  active: true,
  revision: 'rev-1',
  attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'Rojo' } }],
  ...overrides,
})

const attributesApi = (
  getTypeEffectiveAttributes: ResourcesMasterRestReadApi['getTypeEffectiveAttributes'],
): Pick<ResourcesMasterRestReadApi, 'getTypeEffectiveAttributes'> => ({
  getTypeEffectiveAttributes,
})

describe('useResourcePresentationNames', () => {
  it('fetches once per distinct Tipo even when several resources share it', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [attribute({ code: 'color', position: 0 })],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [
      resource({ id: 'r1' }),
      resource({ id: 'r2' }),
      resource({ id: 'r3' }),
    ]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    await waitFor(() => expect(result.current.r1.status).toBe('ready'))
    expect(result.current.r2.status).toBe('ready')
    expect(result.current.r3.status).toBe('ready')
    expect(getTypeEffectiveAttributes).toHaveBeenCalledTimes(1)
  })

  it('reports loading then ready per resource with a resolved name', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [attribute({ code: 'color', position: 0 })],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [resource({ id: 'r1' })]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    expect(result.current.r1.status).toBe('loading')
    await waitFor(() => expect(result.current.r1.status).toBe('ready'))
    expect(result.current.r1.name).toBe('TIPO-1 Rojo')
  })

  it('survives StrictMode effect replay instead of getting stuck on loading', async () => {
    const getTypeEffectiveAttributes = vi.fn().mockResolvedValue({
      typeCode: 'TIPO-1',
      attributes: [attribute({ code: 'color', position: 0 })],
    })
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [resource({ id: 'r1' })]

    const { result } = renderHook(
      () => useResourcePresentationNames(api, resources),
      { wrapper: StrictMode },
    )

    await waitFor(() => expect(result.current.r1.status).toBe('ready'))
    expect(result.current.r1.name).toBe('TIPO-1 Rojo')
  })

  it('does not refetch an already-resolved Tipo for an overlapping resource set', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [attribute({ code: 'color', position: 0 })],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const first = [resource({ id: 'r1' })]

    const { result, rerender } = renderHook(
      ({ resources }: { resources: Resource[] }) =>
        useResourcePresentationNames(api, resources),
      { initialProps: { resources: first } },
    )

    await waitFor(() => expect(result.current.r1.status).toBe('ready'))

    const second = [resource({ id: 'r1' }), resource({ id: 'r2' })]
    rerender({ resources: second })

    await waitFor(() => expect(result.current.r2.status).toBe('ready'))
    expect(getTypeEffectiveAttributes).toHaveBeenCalledTimes(1)
  })

  it('exposes searchableValues resolving every attribute the resource holds, not only positioned ones', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [
        attribute({ code: 'color', position: 0, hasPosition: true }),
      ],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [
      resource({
        id: 'r1',
        attributes: [
          { code: 'color', value: { kind: 'TEXT', value: 'Rojo' } },
          { code: 'peso', value: { kind: 'DECIMAL', value: '1.5' } },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    await waitFor(() => expect(result.current.r1.status).toBe('ready'))
    expect(result.current.r1.searchableValues).toEqual(['Rojo', '1.5'])
  })

  it('resolves a CONTROLLED_OPTION value in searchableValues to its label, not its raw code', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [
        attribute({
          code: 'color',
          position: 0,
          hasPosition: true,
          options: [{ code: 'RED', label: 'Rojo intenso' }],
        }),
      ],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [
      resource({
        id: 'r1',
        attributes: [
          { code: 'color', value: { kind: 'CONTROLLED_OPTION', value: 'RED' } },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    await waitFor(() => expect(result.current.r1.status).toBe('ready'))
    expect(result.current.r1.searchableValues).toEqual(['Rojo intenso'])
  })

  it('reports an empty searchableValues array while loading and on error', async () => {
    const error = new Error('HTTP 500')
    const getTypeEffectiveAttributes = vi.fn(async () => {
      throw error
    })
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [resource({ id: 'r1' })]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    expect(result.current.r1.searchableValues).toEqual([])
    await waitFor(() => expect(result.current.r1.status).toBe('error'))
    expect(result.current.r1.searchableValues).toEqual([])
  })

  it('an error for one Tipo does not block resources of another Tipo from resolving', async () => {
    const error = new Error('HTTP 500')
    const getTypeEffectiveAttributes = vi.fn(
      async (input: { typeCode: string }) => {
        if (input.typeCode === 'TIPO-FAIL') throw error
        return {
          typeCode: input.typeCode,
          attributes: [attribute({ code: 'color', position: 0 })],
        }
      },
    )
    const api = attributesApi(getTypeEffectiveAttributes)
    const resources = [
      resource({
        id: 'r1',
        scope: {
          classCode: 'CLASE-1',
          familyCode: 'FAM-1',
          typeCode: 'TIPO-FAIL',
        },
      }),
      resource({
        id: 'r2',
        scope: {
          classCode: 'CLASE-1',
          familyCode: 'FAM-1',
          typeCode: 'TIPO-OK',
        },
      }),
    ]

    const { result } = renderHook(() =>
      useResourcePresentationNames(api, resources),
    )

    await waitFor(() => expect(result.current.r1.status).toBe('error'))
    await waitFor(() => expect(result.current.r2.status).toBe('ready'))
    expect(result.current.r1.error).toBe(error)
    expect(result.current.r2.name).toBe('TIPO-OK Rojo')
  })
})

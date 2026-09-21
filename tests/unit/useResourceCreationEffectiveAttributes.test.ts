import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourceCreationEffectiveAttributes } from '../../src/features/resources-master/useResourceCreationEffectiveAttributes'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

const attribute = (code: string): EffectiveAttribute => ({
  characteristic: { code, name: code, valueType: 'CONTROLLED_TEXT' },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'TIPO-1' },
  rules: [],
})

const attributesApi = (
  getTypeEffectiveAttributes: ResourcesMasterRestReadApi['getTypeEffectiveAttributes'],
): Pick<ResourcesMasterRestReadApi, 'getTypeEffectiveAttributes'> => ({
  getTypeEffectiveAttributes,
})

describe('useResourceCreationEffectiveAttributes', () => {
  it('stays idle and never fetches when the request is null', async () => {
    const getTypeEffectiveAttributes = vi.fn()
    const api = attributesApi(getTypeEffectiveAttributes)
    const { result } = renderHook(() =>
      useResourceCreationEffectiveAttributes(api, null),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.attributes).toEqual([])
    expect(getTypeEffectiveAttributes).not.toHaveBeenCalled()
  })

  it('fetches once for a concrete request and becomes ready', async () => {
    const getTypeEffectiveAttributes = vi.fn(async () => ({
      typeCode: 'TIPO-1',
      attributes: [attribute('color')],
    }))
    const api = attributesApi(getTypeEffectiveAttributes)
    const request = {
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'TIPO-1',
    }
    const { result } = renderHook(() =>
      useResourceCreationEffectiveAttributes(api, request),
    )

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.attributes).toEqual([attribute('color')])
    expect(getTypeEffectiveAttributes).toHaveBeenCalledTimes(1)
    expect(getTypeEffectiveAttributes).toHaveBeenCalledWith(request)

    // No polling/auto-retry: staying mounted with the same request never
    // triggers a second fetch.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(getTypeEffectiveAttributes).toHaveBeenCalledTimes(1)
  })

  it('exposes an error status with a working manual retry', async () => {
    const error = new Error('HTTP 503')
    const getTypeEffectiveAttributes = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ typeCode: 'TIPO-1', attributes: [] })
    const api = attributesApi(getTypeEffectiveAttributes)
    const request = {
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'TIPO-1',
    }
    const { result } = renderHook(() =>
      useResourceCreationEffectiveAttributes(api, request),
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe(error)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(getTypeEffectiveAttributes).toHaveBeenCalledTimes(2)
  })

  it('discards a stale response after the request changes mid-flight', async () => {
    let resolveFirst:
      | ((value: {
          typeCode: string
          attributes: EffectiveAttribute[]
        }) => void)
      | undefined
    const getTypeEffectiveAttributes = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce({
        typeCode: 'TIPO-2',
        attributes: [attribute('voltaje')],
      })
    const api = attributesApi(getTypeEffectiveAttributes)
    const firstRequest = {
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'TIPO-1',
    }
    const secondRequest = {
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'TIPO-2',
    }
    const { result, rerender } = renderHook(
      ({ request }) => useResourceCreationEffectiveAttributes(api, request),
      { initialProps: { request: firstRequest } },
    )

    rerender({ request: secondRequest })
    await waitFor(() =>
      expect(getTypeEffectiveAttributes).toHaveBeenLastCalledWith(
        secondRequest,
      ),
    )

    await act(async () => {
      resolveFirst?.({ typeCode: 'TIPO-1', attributes: [attribute('color')] })
    })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.attributes).toEqual([attribute('voltaje')])
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourceCreationUnits } from '../../src/features/resources-master/useResourceCreationUnits'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'

const windowPage = (items: unknown[], hasNext = false) => ({
  items,
  hasPrevious: false,
  hasNext,
})

const unitItem = (id: string, code: string) => ({
  id,
  code,
  name: code,
  active: true,
  revision: id,
  symbol: 'u',
  dimension: 'LONGITUD',
})

const unitsApi = (
  listUnits: ResourcesMasterRestReadApi['listUnits'],
): ResourcesMasterRestReadApi =>
  ({
    listResources: vi.fn(),
    getResourceDetail: vi.fn(),
    describeResource: vi.fn(),
    listHierarchyClasses: vi.fn(),
    listHierarchyFamilies: vi.fn(),
    listHierarchyTypes: vi.fn(),
    listUnits,
  }) as unknown as ResourcesMasterRestReadApi

describe('useResourceCreationUnits', () => {
  it('loads the UNIDAD window on mount without a parent gate', async () => {
    const listUnits = vi.fn(async () => windowPage([unitItem('unit-1', 'M')]))
    const api = unitsApi(listUnits)
    const { result } = renderHook(() => useResourceCreationUnits(api))

    await waitFor(() => expect(result.current.units.status).toBe('ready'))
    expect(listUnits).toHaveBeenCalledWith({
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
    })
    expect(result.current.units.items).toEqual([unitItem('unit-1', 'M')])
  })

  it('paginates forward and backward using server navigation flags', async () => {
    const listUnits = vi
      .fn()
      .mockResolvedValueOnce(windowPage([unitItem('unit-1', 'M')], true))
      .mockResolvedValueOnce(windowPage([unitItem('unit-2', 'KG')]))
    const api = unitsApi(listUnits)
    const { result } = renderHook(() => useResourceCreationUnits(api))

    await waitFor(() => expect(result.current.units.items).toHaveLength(1))
    act(() => result.current.continueUnits())
    await waitFor(() => expect(result.current.units.offset).toBe(20))
    expect(listUnits).toHaveBeenLastCalledWith({
      scope: 'ACTIVE',
      limit: 20,
      offset: 20,
    })

    act(() => result.current.previousUnits())
    expect(listUnits).toHaveBeenCalledTimes(2)
  })

  it('exposes an error window with a manual retry', async () => {
    const error = new Error('HTTP 503')
    const listUnits = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(windowPage([]))
    const api = unitsApi(listUnits)
    const { result } = renderHook(() => useResourceCreationUnits(api))

    await waitFor(() => expect(result.current.units.status).toBe('error'))
    expect(result.current.units.error).toBe(error)

    act(() => result.current.retryUnits())
    await waitFor(() => expect(result.current.units.status).toBe('empty'))
    expect(listUnits).toHaveBeenCalledTimes(2)
  })
})

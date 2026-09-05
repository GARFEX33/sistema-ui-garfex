import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourcesHierarchy } from '../../src/features/resources-master/useResourcesHierarchy'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'

const page = <T>(
  items: T[],
  isExhausted = true,
  continuationCursor: string | null = null,
) => ({
  items,
  isExhausted,
  continuationCursor,
})

const contextItem = (id: string, nombre: string) => ({
  id,
  clave: id.toUpperCase(),
  nombre,
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
})

const fakeApi = (
  overrides: Partial<ResourcesMasterApi> = {},
): ResourcesMasterApi =>
  ({
    listContextClasses: vi.fn(async () =>
      page([contextItem('class-1', 'Material')], false, 'classes-2'),
    ),
    listContextFamilies: vi.fn(async () =>
      page([
        { ...contextItem('family-1', 'Cable'), claseRecursoId: 'class-1' },
      ]),
    ),
    listContextTypes: vi.fn(async () =>
      page([
        {
          ...contextItem('type-1', 'UTP'),
          familiaRecursoId: 'family-1',
          aggregateStatus: 'CLEAN',
          violations: [],
        },
      ]),
    ),
    ...overrides,
  }) as ResourcesMasterApi

describe('useResourcesHierarchy', () => {
  it('pages ACTIVE classes and gates descendants while clearing stale selections', async () => {
    const api = fakeApi({
      listContextClasses: vi
        .fn()
        .mockResolvedValueOnce(
          page([contextItem('class-1', 'Material')], false, 'classes-2'),
        )
        .mockResolvedValueOnce(page([contextItem('class-2', 'Servicio')])),
    })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(1))
    expect(api.listContextClasses).toHaveBeenCalledWith({ pageSize: 20 })

    await act(async () => {
      await result.current.continueClasses()
    })
    expect(result.current.classes.items.map((item) => item.id)).toEqual([
      'class-1',
      'class-2',
    ])

    await act(async () => {
      result.current.selectClass('class-1')
    })
    await waitFor(() => expect(result.current.families.items).toHaveLength(1))
    expect(api.listContextFamilies).toHaveBeenCalledWith({
      claseRecursoId: 'class-1',
      pageSize: 20,
    })

    await act(async () => {
      result.current.selectFamily('family-1')
    })
    await waitFor(() => expect(result.current.types.items).toHaveLength(1))
    expect(result.current.selection).toEqual({
      classId: 'class-1',
      familyId: 'family-1',
    })

    await act(async () => {
      result.current.selectType('type-1')
      result.current.selectClass('class-2')
    })
    expect(result.current.selection).toEqual({ classId: 'class-2' })
    expect(result.current.types.status).toBe('waiting-for-parent')
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  HIERARCHY_FETCH_CAP,
  useResourcesHierarchy,
} from '../../src/features/resources-master/useResourcesHierarchy'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'

const PAGE_SIZE = 20

const windowPage = <T>(items: T[], hasNext = false) => ({
  items,
  hasPrevious: false,
  hasNext,
})

const classItem = (id: string, code: string) => ({
  id,
  code,
  name: code,
  active: true,
  revision: id,
})

const familyItem = (id: string, code: string, classCode = 'MATERIAL') => ({
  ...classItem(id, code),
  classCode,
})

const typeItem = (id: string, code: string, familyCode = 'CABLE') => ({
  ...familyItem(id, code),
  familyCode,
})

const hierarchyApi = (
  overrides: Partial<ResourcesMasterRestReadApi> = {},
): ResourcesMasterRestReadApi =>
  ({
    listResources: vi.fn(),
    getResourceDetail: vi.fn(),
    describeResource: vi.fn(),
    listHierarchyClasses: vi.fn(async () =>
      windowPage([
        {
          id: 'class-1',
          code: 'MATERIAL',
          name: 'Material',
          active: true,
          revision: '1',
        },
        {
          id: 'class-2',
          code: 'SERVICIO',
          name: 'Servicio',
          active: true,
          revision: '2',
        },
      ]),
    ),
    listHierarchyFamilies: vi.fn(async ({ classCode }) =>
      windowPage(
        classCode === 'MATERIAL'
          ? [
              {
                id: 'family-1',
                code: 'CABLE',
                name: 'Cable',
                classCode: 'MATERIAL',
                active: true,
                revision: '3',
              },
            ]
          : [],
      ),
    ),
    listHierarchyTypes: vi.fn(async () =>
      windowPage([
        {
          id: 'type-1',
          code: 'UTP',
          name: 'UTP',
          classCode: 'MATERIAL',
          familyCode: 'CABLE',
          active: true,
          revision: '4',
        },
      ]),
    ),
    ...overrides,
  }) as ResourcesMasterRestReadApi

describe('useResourcesHierarchy', () => {
  it('loads dependent REST windows by selected codes and resets descendants', async () => {
    const api = hierarchyApi()
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))
    expect(api.listHierarchyClasses).toHaveBeenCalledWith({
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
    })

    await act(async () => {
      result.current.selectClass('class-1')
    })
    await waitFor(() => expect(result.current.families.items).toHaveLength(1))
    expect(api.listHierarchyFamilies).toHaveBeenCalledWith({
      classCode: 'MATERIAL',
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
    })
    expect(api.listHierarchyTypes).not.toHaveBeenCalled()

    await act(async () => {
      result.current.selectFamily('family-1')
    })
    await waitFor(() => expect(result.current.types.items).toHaveLength(1))
    expect(api.listHierarchyTypes).toHaveBeenCalledWith({
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      scope: 'ACTIVE',
      limit: 20,
      offset: 0,
    })

    await act(async () => {
      result.current.selectClass('class-2')
    })
    expect(result.current.selection).toEqual({ classId: 'class-2' })
    expect(result.current.families.items).toEqual([])
    expect(result.current.types.items).toEqual([])
    expect(result.current.families.offset).toBe(0)
    expect(result.current.types.offset).toBe(0)
  })

  it('clears the selected type and its window when the family changes', async () => {
    const api = hierarchyApi({
      listHierarchyFamilies: vi.fn(async () =>
        windowPage([
          familyItem('family-1', 'CABLE'),
          familyItem('family-2', 'FIBRA'),
        ]),
      ),
      listHierarchyTypes: vi
        .fn()
        .mockResolvedValueOnce(windowPage([typeItem('type-1', 'UTP')]))
        .mockResolvedValueOnce(windowPage([typeItem('type-2', 'FTP')])),
    })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))
    act(() => result.current.selectClass('class-1'))
    await waitFor(() => expect(result.current.families.items).toHaveLength(2))
    act(() => result.current.selectFamily('family-1'))
    await waitFor(() => expect(result.current.types.items).toHaveLength(1))
    act(() => result.current.selectType('type-1'))

    act(() => result.current.selectFamily('family-2'))
    expect(result.current.selection).toEqual({
      classId: 'class-1',
      familyId: 'family-2',
    })
    expect(result.current.types).toMatchObject({ items: [], offset: 0 })
    await waitFor(() => expect(result.current.types.items).toHaveLength(1))
    expect(result.current.types.items[0]?.id).toBe('type-2')
  })

  it('auto-continues fetching classes internally until the server reports no further page', async () => {
    const api = hierarchyApi({
      listHierarchyClasses: vi
        .fn()
        .mockResolvedValueOnce(
          windowPage(
            [
              classItem('class-1', 'MATERIAL'),
              classItem('class-2', 'SERVICIO'),
            ],
            true,
          ),
        )
        .mockResolvedValueOnce(
          windowPage([classItem('class-3', 'HERRAMIENTA')]),
        ),
    })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(3))
    expect(result.current.classes.hasNext).toBe(false)
    expect(api.listHierarchyClasses).toHaveBeenNthCalledWith(1, {
      scope: 'ACTIVE',
      limit: PAGE_SIZE,
      offset: 0,
    })
    expect(api.listHierarchyClasses).toHaveBeenNthCalledWith(2, {
      scope: 'ACTIVE',
      limit: PAGE_SIZE,
      offset: PAGE_SIZE,
    })
    expect(result.current.classes.items.map((item) => item.code)).toEqual([
      'MATERIAL',
      'SERVICIO',
      'HERRAMIENTA',
    ])
  })

  it('stops auto-continuing once the safety cap is reached, even if the server keeps reporting hasNext', async () => {
    const alwaysMorePage = vi.fn(async () =>
      windowPage(
        Array.from({ length: PAGE_SIZE }, (_, index) =>
          classItem(`class-${index}`, `CODE-${index}`),
        ),
        true,
      ),
    )
    const api = hierarchyApi({ listHierarchyClasses: alwaysMorePage })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.status).toBe('ready'))
    expect(result.current.classes.items).toHaveLength(HIERARCHY_FETCH_CAP)
    // Capped while the server still had more: hasNext stays true so the
    // hook honestly reports the list is not exhaustive.
    expect(result.current.classes.hasNext).toBe(true)
    expect(alwaysMorePage).toHaveBeenCalledTimes(
      HIERARCHY_FETCH_CAP / PAGE_SIZE,
    )
  })

  it('keeps continueClasses/Families/Types as harmless no-ops (still wired by CrearRecursoSurface.tsx)', async () => {
    const api = hierarchyApi()
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))
    const callsBefore = (api.listHierarchyClasses as ReturnType<typeof vi.fn>)
      .mock.calls.length

    act(() => result.current.continueClasses())
    act(() => result.current.continueFamilies())
    act(() => result.current.continueTypes())

    expect(api.listHierarchyClasses).toHaveBeenCalledTimes(callsBefore)
    expect(result.current.classes.items).toHaveLength(2)
  })

  it('no longer exposes previousClasses/Families/Types (Slice E2 removed their only consumer)', async () => {
    const api = hierarchyApi()
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))

    expect(result.current).not.toHaveProperty('previousClasses')
    expect(result.current).not.toHaveProperty('previousFamilies')
    expect(result.current).not.toHaveProperty('previousTypes')
  })

  it('exposes empty and error windows with a manual retry', async () => {
    const error = new Error('HTTP 503')
    const api = hierarchyApi({
      listHierarchyClasses: vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(windowPage([])),
    })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.status).toBe('error'))
    expect(result.current.classes.error).toBe(error)

    act(() => result.current.retryClasses())
    await waitFor(() => expect(result.current.classes.status).toBe('empty'))
    expect(api.listHierarchyClasses).toHaveBeenCalledTimes(2)
    expect(api.listHierarchyClasses).toHaveBeenLastCalledWith({
      scope: 'ACTIVE',
      limit: PAGE_SIZE,
      offset: 0,
    })
  })

  it('does not request types before a family is selected', async () => {
    const api = hierarchyApi()
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))
    act(() => result.current.selectClass('class-1'))
    await waitFor(() => expect(result.current.families.items).toHaveLength(1))
    expect(api.listHierarchyTypes).not.toHaveBeenCalled()
  })

  it('discards a stale family response after the selected class changes', async () => {
    let resolveFirstFamily:
      | ((value: ReturnType<typeof windowPage>) => void)
      | undefined
    const api = hierarchyApi({
      listHierarchyFamilies: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirstFamily = resolve
            }),
        )
        .mockResolvedValueOnce(windowPage([])),
    })
    const { result } = renderHook(() => useResourcesHierarchy(api))

    await waitFor(() => expect(result.current.classes.items).toHaveLength(2))
    act(() => result.current.selectClass('class-1'))
    act(() => result.current.selectClass('class-2'))
    await waitFor(() =>
      expect(api.listHierarchyFamilies).toHaveBeenLastCalledWith({
        classCode: 'SERVICIO',
        scope: 'ACTIVE',
        limit: PAGE_SIZE,
        offset: 0,
      }),
    )

    await act(async () => {
      resolveFirstFamily?.(
        windowPage([
          {
            id: 'family-1',
            code: 'CABLE',
            name: 'Cable',
            classCode: 'MATERIAL',
            active: true,
            revision: '3',
          },
        ]),
      )
    })
    expect(result.current.families.items).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import {
  createInitialCatalogHierarchyContext,
  getDependentQuery,
  selectClass,
  selectFamily,
  selectType,
} from '../../src/features/catalog-hierarchy/catalogHierarchyState'
import {
  getHierarchyParentQuery,
  resetHierarchyDescendants,
  selectHierarchyChild,
} from '../../src/shared/hierarchy/hierarchySelection'

const context = { classId: 'class-a', familyId: 'family-a', typeId: 'type-a' }

// prettier-ignore
describe('catalog hierarchy local context', () => {
  it('exposes shared descendant reset and parent-validated selection helpers', () => {
    const current = { rootId: 'root-a', branchId: 'branch-a', leafId: 'leaf-a' }
    expect(resetHierarchyDescendants(current, ['branchId', 'leafId'])).toEqual({
      rootId: 'root-a',
      branchId: undefined,
      leafId: undefined,
    })
    expect(
      selectHierarchyChild(
        current,
        { key: 'branchId', value: 'branch-b' },
        { key: 'rootId', value: 'root-b' },
        ['leafId'],
      ),
    ).toBe(current)
  })

  it.each([
    ['undefined', undefined, undefined],
    ['null', null, undefined],
    ['empty string', '', undefined],
    ['zero', 0, { parentId: 0 }],
    ['false', false, { parentId: false }],
  ])(
    'treats %s as a parent value with the shared validity semantics',
    (_label, parentId, expected) => {
      expect(getHierarchyParentQuery({ parentId }, 'parentId')).toEqual(expected)
    },
  )

  it('clears descendants when class or family changes', () => {
    expect(selectClass(context, 'class-b')).toEqual({ classId: 'class-b', familyId: undefined, typeId: undefined })
    expect(selectFamily(context, { familyId: 'family-b', classId: 'class-a' })).toEqual({ classId: 'class-a', familyId: 'family-b', typeId: undefined })
    expect(selectFamily(context, { familyId: 'family-b', classId: 'class-b' })).toBe(context)
  })
  it('rejects a type from a different family', () => {
    expect(selectType(context, { typeId: 'type-b', familyId: 'family-b' })).toBe(context)
    expect(selectType(context, { typeId: 'type-b', familyId: 'family-a' })).toEqual({ ...context, typeId: 'type-b' })
  })
  it('gates dependent queries on their parent', () => {
    expect(getDependentQuery('families', createInitialCatalogHierarchyContext())).toBeUndefined()
    expect(getDependentQuery('types', {})).toBeUndefined()
    expect(getDependentQuery('families', { classId: 'class-a' })).toEqual({ parentId: 'class-a' })
    expect(getDependentQuery('types', { familyId: 'family-a' })).toEqual({ parentId: 'family-a' })
  })
})

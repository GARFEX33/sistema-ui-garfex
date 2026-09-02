import { describe, expect, it } from 'vitest'
import {
  createInitialCatalogHierarchyContext,
  getDependentQuery,
  selectClass,
  selectFamily,
  selectType,
} from '../../src/features/catalog-hierarchy/catalogHierarchyState'

const context = {
  classId: 'class-a',
  familyId: 'family-a',
  typeId: 'type-a',
}

describe('catalog hierarchy local context', () => {
  it('clears descendants when class or family changes', () => {
    expect(selectClass(context, 'class-b')).toEqual({
      classId: 'class-b',
      familyId: undefined,
      typeId: undefined,
    })
    expect(
      selectFamily(context, {
        familyId: 'family-b',
        classId: 'class-a',
      }),
    ).toEqual({
      classId: 'class-a',
      familyId: 'family-b',
      typeId: undefined,
    })
  })

  it('rejects selections whose parent does not match', () => {
    expect(
      selectFamily(context, {
        familyId: 'family-b',
        classId: 'class-b',
      }),
    ).toBe(context)
    expect(
      selectType(context, { typeId: 'type-b', familyId: 'family-b' }),
    ).toBe(context)
    expect(
      selectType(context, { typeId: 'type-b', familyId: 'family-a' }),
    ).toEqual({ ...context, typeId: 'type-b' })
  })

  it('gates dependent queries on their parent', () => {
    expect(
      getDependentQuery('families', createInitialCatalogHierarchyContext()),
    ).toBeUndefined()
    expect(getDependentQuery('types', {})).toBeUndefined()
    expect(getDependentQuery('families', { classId: 'class-a' })).toEqual({
      parentId: 'class-a',
    })
    expect(getDependentQuery('types', { familyId: 'family-a' })).toEqual({
      parentId: 'family-a',
    })
  })
})

import { describe, expect, it } from 'vitest'
import {
  createInitialHierarchySnapshotCapture,
  deriveInitialHierarchySnapshot,
  normalizeInitialHierarchySnapshot,
  resourceIdKey,
} from '../../src/features/resources-master/resourceCreation.model'

const classItem = {
  id: 'class-1',
  clave: 'MATERIAL',
  nombre: 'Material',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}

const familyItem = {
  id: 'family-1',
  claseRecursoId: 'class-1',
  clave: 'CABLE',
  nombre: 'Cable',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
}

const typeItem = {
  id: 'type-1',
  familiaRecursoId: 'family-1',
  clave: 'UTP',
  nombre: 'UTP',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  aggregateStatus: 'CLEAN',
  violations: [],
}

const items = {
  classes: [classItem],
  families: [familyItem],
  types: [typeItem],
}

describe('resource creation hierarchy snapshots', () => {
  it('derives only loaded selected items and normalizes the complete prefix', () => {
    const snapshot = deriveInitialHierarchySnapshot(
      { classId: 'class-1', familyId: 'family-1', typeId: 'type-1' },
      items,
    )

    expect(resourceIdKey({ opaque: 'id' })).toBe('[object Object]')
    expect(normalizeInitialHierarchySnapshot(snapshot)).toEqual({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })
  })

  it.each([
    [0, {}],
    [1, { classId: 'class-1' }],
    [2, { classId: 'class-1', familyId: 'family-1' }],
  ] as const)(
    'preserves depth %i only when every selected item is still loaded',
    (depth, selection) => {
      const snapshot = deriveInitialHierarchySnapshot(selection, items)

      expect(normalizeInitialHierarchySnapshot(snapshot).depth).toBe(depth)
    },
  )

  it('captures the latest closed snapshot once and does not reseed an open draft', () => {
    const capture = createInitialHierarchySnapshotCapture({
      classItem,
      familyItem: null,
      typeItem: null,
    })
    capture.receive({ classItem, familyItem, typeItem })

    expect(capture.captureOnOpen()).toMatchObject({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })

    capture.receive({ classItem: null, familyItem: null, typeItem: null })
    expect(capture.captured()).toMatchObject({
      classItem,
      familyItem,
      typeItem,
      depth: 3,
    })
    expect(capture.captureOnOpen()).toMatchObject({ depth: 0 })
  })

  it('drops absent, cross-parent, and stale descendants instead of recovering them', () => {
    const absent = deriveInitialHierarchySnapshot(
      { classId: 'class-1', familyId: 'missing', typeId: 'type-1' },
      items,
    )
    const crossed = normalizeInitialHierarchySnapshot({
      classItem,
      familyItem: { ...familyItem, claseRecursoId: 'other-class' },
      typeItem,
    })
    const stale = normalizeInitialHierarchySnapshot({
      classItem,
      familyItem,
      typeItem: { ...typeItem, familiaRecursoId: 'other-family' },
    })

    expect(normalizeInitialHierarchySnapshot(absent)).toEqual({
      classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    })
    expect(crossed).toMatchObject({
      classItem,
      familyItem: null,
      typeItem: null,
      depth: 1,
    })
    expect(stale).toMatchObject({
      classItem,
      familyItem,
      typeItem: null,
      depth: 2,
    })
  })
})

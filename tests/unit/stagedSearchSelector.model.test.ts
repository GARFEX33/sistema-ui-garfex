import { describe, expect, it } from 'vitest'
import {
  deriveVisibleStagedSelectorItems,
  normalizeStagedSelectorQuery,
  repairProvisionalActiveKey,
  type StagedSelectorItem,
} from '../../src/features/resources-master/stagedSearchSelector.model'

type Item = StagedSelectorItem & {
  id: string
  description: string
}

const loadedItems: readonly Item[] = [
  {
    key: 'tree',
    id: 'catalog-tree',
    displayName: 'Árbol',
    description: 'Roble centenario',
  },
  {
    key: 'cable',
    id: 'hidden-name',
    displayName: 'Cable UTP',
    description: 'Árbol de red',
  },
]

describe('staged selector model', () => {
  it('normalizes Spanish queries and filters only already loaded display names', () => {
    expect(normalizeStagedSelectorQuery('  ÑANDÚ  ')).toBe('ñandú')
    expect(deriveVisibleStagedSelectorItems(loadedItems, ' ÁR ')).toEqual([
      loadedItems[0],
    ])
    expect(deriveVisibleStagedSelectorItems(loadedItems, 'arbol')).toEqual([])
  })

  it('does not match keys, IDs, descriptions, or unloaded candidates', () => {
    expect(deriveVisibleStagedSelectorItems(loadedItems, 'catalog')).toEqual([])
    expect(deriveVisibleStagedSelectorItems(loadedItems, 'hidden')).toEqual([])
    expect(deriveVisibleStagedSelectorItems(loadedItems, 'roble')).toEqual([])
    expect(deriveVisibleStagedSelectorItems(loadedItems, 'futura')).toEqual([])
  })

  it('retains a visible active key without confirming anything', () => {
    expect(repairProvisionalActiveKey(loadedItems, 'cable', 'tree')).toBe(
      'cable',
    )
  })

  it('repairs a missing active key to the visible preferred key, then first, or null', () => {
    expect(repairProvisionalActiveKey(loadedItems, 'missing', 'cable')).toBe(
      'cable',
    )
    expect(repairProvisionalActiveKey(loadedItems, 'missing', 'missing')).toBe(
      'tree',
    )
    expect(repairProvisionalActiveKey([], 'tree', 'cable')).toBeNull()
  })
})

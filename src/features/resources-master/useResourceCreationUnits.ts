import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type { ResourceContextUnitRestItem } from './resourcesMaster.types'

const PAGE_SIZE = 20

export type UnitsWindowState = {
  status: 'waiting-for-parent' | 'loading' | 'ready' | 'empty' | 'error'
  items: ResourceContextUnitRestItem[]
  offset: number
  hasPrevious: boolean
  hasNext: boolean
  error?: unknown
}

const emptyWindow = (
  status: UnitsWindowState['status'] = 'loading',
): UnitsWindowState => ({
  status,
  items: [],
  offset: 0,
  hasPrevious: false,
  hasNext: false,
})

// Mirrors the parentless `classes` level of useResourcesHierarchy.ts, but
// for the single UNIDAD list backing the wizard's "Unidad" stage.
export function useResourceCreationUnits(api: ResourcesMasterRestReadApi) {
  const [units, setUnits] = useState<UnitsWindowState>(() =>
    emptyWindow('loading'),
  )
  const generation = useRef(0)

  const loadUnits = useCallback(
    async (offset = 0) => {
      const current = ++generation.current
      setUnits((state) => ({ ...state, status: 'loading', offset }))
      try {
        const page = await api.listUnits({
          scope: 'ACTIVE',
          limit: PAGE_SIZE,
          offset,
        })
        if (current !== generation.current) return
        setUnits({
          ...page,
          offset,
          status: page.items.length === 0 ? 'empty' : 'ready',
        })
      } catch (error) {
        if (current === generation.current)
          setUnits((state) => ({ ...state, status: 'error', error }))
      }
    },
    [api],
  )

  useEffect(() => {
    void loadUnits()
  }, [loadUnits])

  const retryUnits = () => void loadUnits(units.offset)
  const continueUnits = () => {
    if (units.hasNext && units.status !== 'loading')
      void loadUnits(units.offset + PAGE_SIZE)
  }
  const previousUnits = () => {
    if (units.hasPrevious && units.status !== 'loading')
      void loadUnits(Math.max(0, units.offset - PAGE_SIZE))
  }

  return { units, retryUnits, continueUnits, previousUnits }
}

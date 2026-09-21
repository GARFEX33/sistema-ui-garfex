import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type {
  EffectiveAttribute,
  EffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'

export type EffectiveAttributesFetchStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'

export interface ResourceCreationEffectiveAttributesState {
  status: EffectiveAttributesFetchStatus
  attributes: EffectiveAttribute[]
  error?: unknown
}

const idleState: ResourceCreationEffectiveAttributesState = {
  status: 'idle',
  attributes: [],
}

const loadingState: ResourceCreationEffectiveAttributesState = {
  status: 'loading',
  attributes: [],
}

// Mirrors useResourceCreationUnits.ts's generation-guarded async effect, but
// gated on an optional request (Tipo not yet confirmed => idle, no fetch) and
// fetched exactly once per request, no polling/live re-evaluation.
export function useResourceCreationEffectiveAttributes(
  api: Pick<ResourcesMasterRestReadApi, 'getTypeEffectiveAttributes'>,
  request: EffectiveAttributesRequest | null,
) {
  const [state, setState] = useState<ResourceCreationEffectiveAttributesState>(
    () => (request === null ? idleState : loadingState),
  )
  const generation = useRef(0)

  const load = useCallback(
    async (current: EffectiveAttributesRequest) => {
      const gen = ++generation.current
      setState(loadingState)
      try {
        const response = await api.getTypeEffectiveAttributes(current)
        if (gen !== generation.current) return
        setState({ status: 'ready', attributes: response.attributes })
      } catch (error) {
        if (gen === generation.current)
          setState({ status: 'error', attributes: [], error })
      }
    },
    [api],
  )

  useEffect(() => {
    if (request === null) {
      ++generation.current
      setState(idleState)
      return
    }
    void load(request)
  }, [request, load])

  const retry = () => {
    if (request !== null) void load(request)
  }

  return { ...state, retry }
}

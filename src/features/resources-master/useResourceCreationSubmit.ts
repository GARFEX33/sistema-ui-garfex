import { useCallback, useState } from 'react'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type { Resource, ResourceRestCreateInput } from './resourcesMaster.types'

export type ResourceCreationSubmitStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error'

export interface ResourceCreationSubmitState {
  status: ResourceCreationSubmitStatus
  result?: Resource
  error?: unknown
}

export interface UseResourceCreationSubmit extends ResourceCreationSubmitState {
  submit: (input: ResourceRestCreateInput) => Promise<void>
  reset: () => void
}

const idle: ResourceCreationSubmitState = { status: 'idle' }

// Thin REST submission wrapper (Slice C2c). Exactly one createResource call
// per submit() — no retry, no optimistic update, no CATALOG_CHANGED-style
// reconciliation (see gap-reports/G4.md). The caller decides when submit()
// is safe to invoke (e.g. disabling the trigger while status is
// 'submitting'); this hook does not single-flight on its own.
export function useResourceCreationSubmit(
  api: Pick<ResourcesMasterRestReadApi, 'createResource'>,
): UseResourceCreationSubmit {
  const [state, setState] = useState<ResourceCreationSubmitState>(idle)

  const submit = useCallback(
    async (input: ResourceRestCreateInput) => {
      setState({ status: 'submitting' })
      try {
        const result = await api.createResource(input)
        setState({ status: 'success', result })
      } catch (error) {
        setState({ status: 'error', error })
      }
    },
    [api],
  )

  const reset = useCallback(() => setState(idle), [])

  return { ...state, submit, reset }
}

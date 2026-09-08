import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  asResourceCreationCreateToken,
  captureResourceCreationCreateLease,
  isResourceCreationCreateLeaseCurrent,
  type ResourceCreationCreateLease,
} from './resourceCreation.createLease'
import type { CreationState } from './resourceCreation.model'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type {
  ResourceCreationEvaluationOwnership,
  ResourceCreationResult,
} from './resourcesMaster.types'

type Projection =
  | { status: 'idle' }
  | { status: 'loading'; lease: ResourceCreationCreateLease }
  | {
      status: 'result'
      lease: ResourceCreationCreateLease
      result: ResourceCreationResult
    }
  | { status: 'error'; lease: ResourceCreationCreateLease }

export type ResourceCreationCreateDriverOptions = Readonly<{
  api: Pick<ResourcesMasterApi, 'createResourceFromSelections'>
  ownership: ResourceCreationEvaluationOwnership | null
  state: CreationState
}>

const idle: Projection = { status: 'idle' }

export function useResourceCreationCreate({
  api,
  ownership,
  state,
}: ResourceCreationCreateDriverOptions) {
  const authority = useRef({ ownership, state })
  authority.current = { ownership, state }
  const nextToken = useRef(0)
  const activeToken = useRef<ResourceCreationCreateLease['createToken'] | null>(
    null,
  )
  const inFlight = useRef(false)
  const [projection, setProjection] = useState<Projection>(idle)
  const mutation = useMutation({
    mutationFn: ({
      request,
    }: NonNullable<ReturnType<typeof captureResourceCreationCreateLease>>) =>
      api.createResourceFromSelections(request),
    retry: false,
  })
  const leaseIsCurrent = (lease: ResourceCreationCreateLease) =>
    activeToken.current === lease.createToken &&
    isResourceCreationCreateLeaseCurrent(
      authority.current.state,
      authority.current.ownership,
      lease,
    )

  useEffect(() => {
    if (projection.status === 'idle' || leaseIsCurrent(projection.lease)) return
    if (activeToken.current === projection.lease.createToken)
      activeToken.current = null
    setProjection(idle)
  }, [projection, state, ownership])

  const isCurrent =
    projection.status === 'idle' || leaseIsCurrent(projection.lease)
  const visible = isCurrent ? projection : idle

  return {
    status: visible.status,
    ...(visible.status === 'result' ? { result: visible.result } : {}),
    create: () => {
      if (inFlight.current || visible.status === 'result') return false
      const current = authority.current
      const captured = captureResourceCreationCreateLease(
        current.state,
        current.ownership,
        asResourceCreationCreateToken(`create-${nextToken.current++}`),
      )
      if (!captured) return false

      inFlight.current = true
      activeToken.current = captured.lease.createToken
      setProjection({ status: 'loading', lease: captured.lease })
      mutation.mutate(captured, {
        onSuccess: (result) => {
          inFlight.current = false
          if (leaseIsCurrent(captured.lease))
            setProjection({ status: 'result', lease: captured.lease, result })
          else if (activeToken.current === captured.lease.createToken)
            activeToken.current = null
        },
        onError: () => {
          inFlight.current = false
          if (leaseIsCurrent(captured.lease))
            setProjection({ status: 'error', lease: captured.lease })
          else if (activeToken.current === captured.lease.createToken)
            activeToken.current = null
        },
      })
      return true
    },
  }
}

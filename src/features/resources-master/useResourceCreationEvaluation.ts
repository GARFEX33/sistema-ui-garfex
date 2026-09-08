import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import {
  reconcileAttributeSequence,
  type AllowedValuesKnowledge,
} from './resourceCreation.attributeSequence'
import {
  adoptResourceCreationEvaluation,
  asResourceCreationEvaluationRequestToken,
  captureResourceCreationEvaluationLease,
} from './resourceCreation.evaluationLease'
import { buildResourceCreationEvaluationRequest } from './resourceCreation.evaluationRequest'
import {
  clearResourceCreationEvaluationAuthority,
  resourceCreationReducer,
  type CreationState,
} from './resourceCreation.model'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'

type SetCreationState = (
  update: (current: CreationState) => CreationState,
) => void

export type ResourceCreationEvaluationDriverStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'

export type ResourceCreationEvaluationDriverOptions = Readonly<{
  api: Pick<ResourcesMasterApi, 'evaluateResourceCreation'>
  ownership: ResourceCreationEvaluationOwnership | null
  state: CreationState
  setState: SetCreationState
  allowedValuesByDefinition?: AllowedValuesKnowledge
}>

const emptyAllowedValues: AllowedValuesKnowledge = {}

const armKey = (
  state: CreationState,
  request: ReturnType<typeof buildResourceCreationEvaluationRequest>,
) =>
  request === null
    ? null
    : `${state.openGeneration}:${state.draft.revision}:${JSON.stringify(request)}`

export function useResourceCreationEvaluation({
  api,
  ownership,
  state,
  setState,
  allowedValuesByDefinition = emptyAllowedValues,
}: ResourceCreationEvaluationDriverOptions) {
  const nextToken = useRef(0)
  const request = useMemo(
    () => buildResourceCreationEvaluationRequest(state, ownership),
    [ownership, state],
  )
  const currentArmKey = armKey(state, request)
  const activeLease = useMemo(() => {
    if (request === null || state.evaluationRequestToken === null) return null
    const captured = captureResourceCreationEvaluationLease(
      state,
      state.evaluationRequestToken,
      ownership,
    )
    return captured.state === state ? captured.lease : null
  }, [ownership, request, state])
  const needsClear =
    currentArmKey === null &&
    (state.evaluationRequestToken !== null ||
      state.evaluationOwnershipIdentity !== null ||
      state.draft.authoritativeEvaluation !== null ||
      state.draft.catalogFingerprint !== null)

  useEffect(() => {
    if (currentArmKey === null) {
      if (needsClear) setState(clearResourceCreationEvaluationAuthority)
      return
    }
    setState((current) => {
      const currentRequest = buildResourceCreationEvaluationRequest(
        current,
        ownership,
      )
      if (armKey(current, currentRequest) !== currentArmKey) return current
      if (current.evaluationRequestToken !== null) {
        const captured = captureResourceCreationEvaluationLease(
          current,
          current.evaluationRequestToken,
          ownership,
        )
        if (captured.state === current) return current
      }
      return captureResourceCreationEvaluationLease(
        current,
        asResourceCreationEvaluationRequestToken(
          `evaluation-${nextToken.current++}`,
        ),
        ownership,
      ).state
    })
  }, [currentArmKey, needsClear, ownership, setState])

  const query = useQuery({
    queryKey: [
      'resources-master',
      'creation-evaluation',
      currentArmKey ?? 'disabled',
    ],
    enabled: activeLease !== null,
    queryFn: () => api.evaluateResourceCreation(request!),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (activeLease === null || query.data === undefined) return
    setState((current) => {
      const adopted =
        current.draft.authoritativeEvaluation === query.data
          ? current
          : adoptResourceCreationEvaluation(current, activeLease, query.data)
      if (
        adopted === current &&
        current.draft.authoritativeEvaluation !== query.data
      )
        return current
      const reconciliation = reconcileAttributeSequence(
        query.data,
        adopted.draft.selectionBuckets,
        allowedValuesByDefinition,
        null,
      )
      return reconciliation.selectionBuckets === adopted.draft.selectionBuckets
        ? adopted
        : resourceCreationReducer(adopted, {
            type: 'RECONCILE_ALLOWED_VALUE_SELECTIONS',
            selectionBuckets: reconciliation.selectionBuckets,
          })
    })
  }, [activeLease, allowedValuesByDefinition, query.data, setState])

  const status: ResourceCreationEvaluationDriverStatus =
    request === null
      ? 'idle'
      : activeLease !== null && query.isError
        ? 'error'
        : activeLease === null ||
            query.isFetching ||
            query.data === undefined ||
            state.draft.authoritativeEvaluation !== query.data
          ? 'loading'
          : 'ready'

  return {
    status,
    retry: () =>
      activeLease === null || !query.isError
        ? Promise.resolve()
        : query.refetch().then(
            () => undefined,
            () => undefined,
          ),
  }
}

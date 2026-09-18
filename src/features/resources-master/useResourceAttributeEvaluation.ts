import { useEffect, useRef, useState } from 'react'
import type { ResourceAttributeEvaluationApi } from './resourceAttributeEvaluation.api'
import type {
  EffectiveAttribute,
  EffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'
import type { ResourceAttribute } from './resourcesMaster.types'

export type ResourceAttributeEvaluationState = {
  attributes: readonly EffectiveAttribute[]
  status: 'idle' | 'loading' | 'ready' | 'error'
}

// Re-evaluates applicability against Core (POST /evaluate) whenever the
// draft gains a confirmed attribute, so a rule like "1/2 pulgada and 13mm
// are the same measurement, pick one" — expressed server-side as one
// attribute becoming FORBIDDEN/notApplicable once its sibling has a value —
// is respected instead of silently ignored. Stays on the static GET
// baseline, idle, until the first attribute is confirmed: evaluating with
// no values would just echo the baseline back.
export function useResourceAttributeEvaluation(
  api: Pick<ResourceAttributeEvaluationApi, 'evaluateAttributes'>,
  request: EffectiveAttributesRequest | null,
  confirmedValues: readonly ResourceAttribute[],
  baseline: readonly EffectiveAttribute[],
): ResourceAttributeEvaluationState {
  // Only the evaluated result (once at least one attribute is confirmed)
  // lives in state. The idle case — nothing confirmed yet — deliberately
  // falls straight through to whatever `baseline` is on THIS render, rather
  // than a value captured by an effect: `baseline` itself changes (from `[]`
  // while the GET baseline is still loading, to the resolved list once
  // ready) without `request`'s identity changing, so an effect keyed only
  // on request/values would miss that transition and get stuck on `[]`.
  const [evaluated, setEvaluated] = useState<
    readonly EffectiveAttribute[] | null
  >(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  )
  const generation = useRef(0)
  const valuesKey = JSON.stringify(confirmedValues)

  useEffect(() => {
    if (request === null || confirmedValues.length === 0) {
      generation.current += 1
      setEvaluated(null)
      setStatus('idle')
      return
    }
    const gen = ++generation.current
    setStatus('loading')
    void api
      .evaluateAttributes({ ...request, values: confirmedValues })
      .then((response) => {
        if (gen !== generation.current) return
        setEvaluated(response.attributes)
        setStatus('ready')
      })
      .catch(() => {
        if (gen !== generation.current) return
        setStatus('error')
      })
    // valuesKey is the real dependency for re-running this effect on a new
    // confirmed value; confirmedValues is read fresh from the closure at
    // call time (same pattern as useResourcesMasterRestWindow's token-keyed
    // effect).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.classCode, request?.familyCode, request?.typeCode, valuesKey])

  return { attributes: evaluated ?? baseline, status }
}

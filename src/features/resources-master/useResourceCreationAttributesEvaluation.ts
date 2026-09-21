import { useMemo, useState } from 'react'
import { createResourceAttributeEvaluationApi } from './resourceAttributeEvaluation.api'
import { projectConfirmedAttributes } from './resourceCreation.attributesFormProjection'
import {
  useResourceAttributeEvaluation,
  type ResourceAttributeEvaluationState,
} from './useResourceAttributeEvaluation'
import type {
  EffectiveAttribute,
  EffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'

// Thin composition wrapper so CrearRecursoSurface.tsx only owns a single
// call site: builds the REST evaluation adapter once, derives the
// in-progress draft POST /evaluate needs from the wizard's raw form values,
// and re-evaluates applicability against Core once an attribute is
// confirmed (e.g. a diameter captured as either 1/2" or 13mm, never both).
export function useResourceCreationAttributesEvaluation(
  request: EffectiveAttributesRequest | null,
  baseline: readonly EffectiveAttribute[],
  values: Record<string, unknown>,
): ResourceAttributeEvaluationState {
  const [api] = useState(() => createResourceAttributeEvaluationApi())
  const confirmedValues = useMemo(
    () => projectConfirmedAttributes(baseline, values),
    [baseline, values],
  )
  return useResourceAttributeEvaluation(api, request, confirmedValues, baseline)
}

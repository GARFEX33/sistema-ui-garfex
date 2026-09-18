import { ErrorEnvelopeSchema } from '../../shared/catalog/catalogRest.contract'
import {
  parseEffectiveAttributesResponse,
  validEffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'
import type { EffectiveAttributesResponse } from '../../shared/catalog/effectiveAttributes.contract'
import type { ResourceAttribute } from './resourcesMaster.types'

export interface ResourceAttributeEvaluationRequest {
  classCode: string
  familyCode: string
  typeCode: string
  values: readonly ResourceAttribute[]
  signal?: AbortSignal
}

export interface ResourceAttributeEvaluationApi {
  evaluateAttributes: (
    input: ResourceAttributeEvaluationRequest,
  ) => Promise<EffectiveAttributesResponse>
}

const bad = (): never => {
  throw new Error('Invalid resource attribute evaluation response')
}

// Confirmed 2026-09-17 (see gap-reports/G4.md and api-contract-evidence.md,
// citing internal/httpapi/openapi.yaml:747-763): POST
// /v1/types/{typeCode}/attributes/evaluate, classCode/familyCode as query
// params (required in the schema — always send them, the handler does not
// 400 on their absence, it evaluates against an empty ResourceScope
// instead), body exclusively { values: ResourceAttribute[] }, same response
// schema as the GET baseline — reuses the same public parser, no local
// evaluation.
export function createResourceAttributeEvaluationApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
): ResourceAttributeEvaluationApi {
  return {
    async evaluateAttributes(input) {
      if (!validEffectiveAttributesRequest(input)) return bad()
      const query = new URLSearchParams({
        classCode: input.classCode,
        familyCode: input.familyCode,
      })
      const response = await fetch(
        '/v1/types/' +
          encodeURIComponent(input.typeCode) +
          '/attributes/evaluate?' +
          query,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: input.values }),
          signal: input.signal,
        },
      )
      const body: unknown = await response.json()
      if (!response.ok) {
        const error = ErrorEnvelopeSchema.safeParse(body)
        throw new Error(
          error.success ? error.data.error : 'HTTP ' + response.status,
        )
      }
      return parseEffectiveAttributesResponse(body, input)
    },
  }
}

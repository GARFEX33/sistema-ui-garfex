import { ErrorEnvelopeSchema } from '../../shared/catalog/catalogRest.contract'
import {
  parseEffectiveAttributesResponse,
  validEffectiveAttributesRequest,
} from '../../shared/catalog/effectiveAttributes.contract'
import type { CatalogTypeEffectiveAttributesApi } from './catalogTypeEffectiveAttributes.types'

export { parseEffectiveAttributesResponse } from '../../shared/catalog/effectiveAttributes.contract'

const bad = (): never => {
  throw new Error('Invalid catalog type effective attributes response')
}

export function createCatalogTypeEffectiveAttributesApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
): CatalogTypeEffectiveAttributesApi {
  return {
    async getEffectiveAttributes(input) {
      if (!validEffectiveAttributesRequest(input)) return bad()
      const query = new URLSearchParams({
        classCode: input.classCode,
        familyCode: input.familyCode,
      })
      const response = await fetch(
        '/v1/types/' +
          encodeURIComponent(input.typeCode) +
          '/attributes/effective?' +
          query,
        { signal: input.signal },
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

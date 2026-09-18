export type {
  EffectiveCharacteristicValueType,
  EffectiveAttributeMode,
  EffectiveAttributesRequest,
  EffectiveCharacteristicDescriptor,
  EffectiveAttributeSource,
  EffectiveAttributeOption,
  EffectiveAttribute,
  EffectiveAttributesResponse,
} from '../../shared/catalog/effectiveAttributes.contract'
import type {
  EffectiveAttributesRequest,
  EffectiveAttributesResponse,
} from '../../shared/catalog/effectiveAttributes.contract'

export interface CatalogTypeEffectiveAttributesApi {
  getEffectiveAttributes: (
    input: EffectiveAttributesRequest,
  ) => Promise<EffectiveAttributesResponse>
}

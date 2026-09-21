import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import { formatCatalogValueText } from './resourceAttributeDisplay'
import type { Resource } from './resourcesMaster.types'

const resolveSegmentText = (
  attribute: EffectiveAttribute,
  value: CatalogValue,
): string => {
  if (value.kind !== 'CONTROLLED_OPTION') return formatCatalogValueText(value)
  const option = attribute.options.find(
    (candidate) => candidate.code === value.value,
  )
  // Should not normally happen (options come from the same catalog config
  // that produced the resource's value), but fall back to the raw code
  // rather than throwing and blanking the whole presentation name.
  return option?.label ?? value.value
}

export function buildResourcePresentationName(
  attributes: readonly EffectiveAttribute[],
  resource: Resource,
): string {
  const positioned = attributes
    .filter((attribute) => attribute.hasPosition)
    .slice()
    .sort((a, b) => a.position - b.position)

  // The Tipo always leads the presentation name — a Recurso is identified by
  // its Tipo first, then refined by its positioned characteristics (e.g.
  // "CABLE THW-LS 14 AWG NEGRO"), never by the characteristics alone.
  const segments: string[] = [resource.scope.typeCode]
  for (const attribute of positioned) {
    const match = resource.attributes.find(
      (candidate) => candidate.code === attribute.characteristic.code,
    )
    if (match === undefined) continue
    segments.push(resolveSegmentText(attribute, match.value))
  }

  return segments.join(' ')
}

// Slice D2 (search refinement): resolves every attribute the resource holds
// to its display text, not only the positioned subset used for the
// presentation name, so the client-side search filter can match against any
// value the resource shows. Reuses the exact same resolveSegmentText (and,
// through it, formatCatalogValueText) resolution as
// buildResourcePresentationName instead of forking a second copy.
export function resolveAttributeDisplayValues(
  attributes: readonly EffectiveAttribute[],
  resource: Resource,
): string[] {
  return resource.attributes.map((resourceAttribute) => {
    const effective = attributes.find(
      (attribute) => attribute.characteristic.code === resourceAttribute.code,
    )
    return effective
      ? resolveSegmentText(effective, resourceAttribute.value)
      : formatCatalogValueText(resourceAttribute.value)
  })
}

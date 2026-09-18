import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import type { CatalogPresentationListItem } from './catalogPresentationAdmin.api'

export type PresentationRow = Readonly<{
  characteristicCode: string
  name: string
  id: string | null
  revision: string | null
  position: string | null
  active: boolean
}>

export type PresentationRows = Readonly<{
  participating: readonly PresentationRow[]
  notParticipating: readonly PresentationRow[]
}>

// Cross-references every attribute assigned to the Type (from the Atributos
// tab's already-fetched effective attributes) with its real PRESENTACION
// row, if any. An attribute participates in the presentation name only when
// it has a row AND that row is active — matches how Core actually resolves
// the name (see the Active-filtering fix confirmed 2026-09-18).
export const derivePresentationRows = (
  attributes: readonly EffectiveAttribute[],
  presentations: readonly CatalogPresentationListItem[],
): PresentationRows => {
  const byCode = new Map(
    presentations.map((presentation) => [
      presentation.characteristicCode,
      presentation,
    ]),
  )
  const participating: PresentationRow[] = []
  const notParticipating: PresentationRow[] = []
  for (const attribute of attributes) {
    const code = attribute.characteristic.code
    const presentation = byCode.get(code)
    const row: PresentationRow = {
      characteristicCode: code,
      name: attribute.characteristic.name,
      id: presentation?.id ?? null,
      revision: presentation?.revision ?? null,
      position: presentation?.position ?? null,
      active: presentation?.active ?? false,
    }
    if (presentation?.active) participating.push(row)
    else notParticipating.push(row)
  }
  participating.sort((a, b) => Number(a.position) - Number(b.position))
  return { participating, notParticipating }
}

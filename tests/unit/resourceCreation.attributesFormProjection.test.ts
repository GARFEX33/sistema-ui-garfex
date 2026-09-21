import { describe, expect, it } from 'vitest'
import { projectConfirmedAttributes } from '../../src/features/resources-master/resourceCreation.attributesFormProjection'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

const attribute = (
  overrides: Partial<EffectiveAttribute> & { code: string },
): EffectiveAttribute => ({
  characteristic: {
    code: overrides.code,
    name: overrides.code,
    valueType: 'CONTROLLED_TEXT',
  },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: 'TIPO-1' },
  rules: [],
  ...overrides,
})

describe('projectConfirmedAttributes', () => {
  it('includes only attributes with a present, valid value', () => {
    const attributes = [
      attribute({ code: 'a', effectiveMode: 'REQUIRED' }),
      attribute({ code: 'b', effectiveMode: 'REQUIRED' }),
      attribute({
        code: 'c',
        characteristic: { code: 'c', name: 'c', valueType: 'INTEGER' },
      }),
    ]
    const values = { a: 'confirmed', c: 'not-a-number' }

    expect(projectConfirmedAttributes(attributes, values)).toEqual([
      { code: 'a', value: { kind: 'TEXT', value: 'confirmed' } },
    ])
  })

  it('never fails closed on a missing REQUIRED attribute, unlike projectResourceAttributes', () => {
    const attributes = [
      attribute({ code: 'required', effectiveMode: 'REQUIRED' }),
    ]
    expect(projectConfirmedAttributes(attributes, {})).toEqual([])
  })

  it('returns an empty array when nothing has been confirmed yet', () => {
    expect(projectConfirmedAttributes([attribute({ code: 'a' })], {})).toEqual(
      [],
    )
  })
})

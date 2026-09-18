import { describe, expect, it } from 'vitest'
import {
  decideAttributeConfirm,
  formatConfirmedAttributeValue,
  renderableSequencerAttributes,
} from '../../src/features/resources-master/resourceCreationAttributeSequencer.model'
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

describe('renderableSequencerAttributes', () => {
  it('drops FORBIDDEN and notApplicable attributes, keeps the rest in order', () => {
    const attributes = [
      attribute({ code: 'a', effectiveMode: 'REQUIRED' }),
      attribute({ code: 'b', effectiveMode: 'FORBIDDEN' }),
      attribute({ code: 'c', effectiveMode: 'OPTIONAL', notApplicable: true }),
      attribute({ code: 'd', effectiveMode: 'CONDITIONAL' }),
    ]

    expect(
      renderableSequencerAttributes(attributes).map(
        (a) => a.characteristic.code,
      ),
    ).toEqual(['a', 'd'])
  })
})

describe('formatConfirmedAttributeValue', () => {
  it('renders BOOLEAN as Sí/No', () => {
    const bool = attribute({
      code: 'b',
      characteristic: { code: 'b', name: 'b', valueType: 'BOOLEAN' },
    })
    expect(formatConfirmedAttributeValue(bool, true)).toBe('Sí')
    expect(formatConfirmedAttributeValue(bool, false)).toBe('No')
  })

  it('resolves CONTROLLED_OPTION to its option label, falling back to the raw code', () => {
    const option = attribute({
      code: 'insulation',
      characteristic: {
        code: 'insulation',
        name: 'Aislamiento',
        valueType: 'CONTROLLED_OPTION',
      },
      options: [{ code: 'THW', label: 'THW-LS' }],
    })
    expect(formatConfirmedAttributeValue(option, 'THW')).toBe('THW-LS')
    expect(formatConfirmedAttributeValue(option, 'DESCONOCIDO')).toBe(
      'DESCONOCIDO',
    )
  })

  it('renders TEXT/INTEGER/DECIMAL as the raw value', () => {
    const text = attribute({ code: 't' })
    expect(formatConfirmedAttributeValue(text, '12 AWG')).toBe('12 AWG')
  })
})

describe('decideAttributeConfirm', () => {
  it('confirms a present, valid value', () => {
    const text = attribute({ code: 't', effectiveMode: 'REQUIRED' })
    expect(decideAttributeConfirm(text, 'hola')).toEqual({
      kind: 'confirm',
      value: { kind: 'TEXT', value: 'hola' },
    })
  })

  it('skips an empty OPTIONAL attribute instead of blocking', () => {
    const text = attribute({ code: 't', effectiveMode: 'OPTIONAL' })
    expect(decideAttributeConfirm(text, '')).toEqual({ kind: 'skip' })
  })

  it('blocks an empty REQUIRED attribute', () => {
    const text = attribute({ code: 't', effectiveMode: 'REQUIRED' })
    expect(decideAttributeConfirm(text, '')).toEqual({ kind: 'blocked' })
  })

  it('blocks an invalid value regardless of applicability', () => {
    const integer = attribute({
      code: 'i',
      effectiveMode: 'OPTIONAL',
      characteristic: { code: 'i', name: 'i', valueType: 'INTEGER' },
    })
    expect(decideAttributeConfirm(integer, 'not-a-number')).toEqual({
      kind: 'blocked',
    })
  })
})

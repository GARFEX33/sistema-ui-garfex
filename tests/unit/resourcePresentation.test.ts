import { describe, expect, it } from 'vitest'
import { buildResourcePresentationName } from '../../src/features/resources-master/resourcePresentation'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'
import type { Resource } from '../../src/features/resources-master/resourcesMaster.types'

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

const resource = (overrides: Partial<Resource> = {}): Resource => ({
  id: 'resource-1',
  identityV1: 'CLASE-FAM-TIPO-X',
  scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
  naturalUnit: 'PZA',
  active: true,
  revision: 'rev-1',
  attributes: [],
  ...overrides,
})

describe('buildResourcePresentationName', () => {
  it('prepends the Tipo (scope.typeCode) as the first segment, ahead of positioned attributes', () => {
    const attributes = [
      attribute({ code: 'calibre', hasPosition: true, position: 1 }),
      attribute({ code: 'color', hasPosition: true, position: 0 }),
    ]
    const target = resource({
      scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'CABLE' },
      attributes: [
        { code: 'calibre', value: { kind: 'TEXT', value: '12AWG' } },
        { code: 'color', value: { kind: 'TEXT', value: 'Rojo' } },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'CABLE Rojo 12AWG',
    )
  })

  it('orders segments by position ascending, regardless of input order', () => {
    const attributes = [
      attribute({ code: 'calibre', hasPosition: true, position: 1 }),
      attribute({ code: 'color', hasPosition: true, position: 0 }),
    ]
    const target = resource({
      attributes: [
        { code: 'calibre', value: { kind: 'TEXT', value: '12AWG' } },
        { code: 'color', value: { kind: 'TEXT', value: 'Rojo' } },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 Rojo 12AWG',
    )
  })

  it('skips attributes without hasPosition', () => {
    const attributes = [
      attribute({ code: 'color', hasPosition: true, position: 0 }),
      attribute({ code: 'internalNote', hasPosition: false, position: 5 }),
    ]
    const target = resource({
      attributes: [
        { code: 'color', value: { kind: 'TEXT', value: 'Rojo' } },
        { code: 'internalNote', value: { kind: 'TEXT', value: 'secreto' } },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 Rojo',
    )
  })

  it('resolves CONTROLLED_OPTION values via the options label, not the raw code', () => {
    const attributes = [
      attribute({
        code: 'color',
        hasPosition: true,
        position: 0,
        characteristic: {
          code: 'color',
          name: 'Color',
          valueType: 'CONTROLLED_OPTION',
        },
        options: [
          { code: 'ROJ', label: 'Rojo intenso' },
          { code: 'AZU', label: 'Azul marino' },
        ],
      }),
    ]
    const target = resource({
      attributes: [
        { code: 'color', value: { kind: 'CONTROLLED_OPTION', value: 'ROJ' } },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 Rojo intenso',
    )
  })

  it('falls back to the raw code when a CONTROLLED_OPTION value has no matching option', () => {
    const attributes = [
      attribute({
        code: 'color',
        hasPosition: true,
        position: 0,
        options: [{ code: 'ROJ', label: 'Rojo intenso' }],
      }),
    ]
    const target = resource({
      attributes: [
        {
          code: 'color',
          value: { kind: 'CONTROLLED_OPTION', value: 'DESCONOCIDO' },
        },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 DESCONOCIDO',
    )
  })

  it('formats non-CONTROLLED_OPTION kinds via the shared display helper', () => {
    const attributes = [
      attribute({ code: 'longitud', hasPosition: true, position: 0 }),
    ]
    const target = resource({
      attributes: [
        {
          code: 'longitud',
          value: { kind: 'QUANTITY', value: '2.5', unitCode: 'M' },
        },
      ],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 2.5 M',
    )
  })

  it('omits a positioned characteristic when the resource has no value for it', () => {
    const attributes = [
      attribute({ code: 'color', hasPosition: true, position: 0 }),
      attribute({ code: 'calibre', hasPosition: true, position: 1 }),
    ]
    const target = resource({
      attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'Rojo' } }],
    })

    expect(buildResourcePresentationName(attributes, target)).toBe(
      'TIPO-1 Rojo',
    )
  })

  it('falls back to a non-empty, non-throwing value when no attribute has hasPosition', () => {
    const attributes = [attribute({ code: 'color', hasPosition: false })]
    const target = resource({
      attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'Rojo' } }],
      scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'CABLE' },
    })

    const result = buildResourcePresentationName(attributes, target)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toBe('CABLE')
  })

  it('falls back when the resource has none of the positioned attributes values', () => {
    const attributes = [
      attribute({ code: 'color', hasPosition: true, position: 0 }),
    ]
    const target = resource({
      attributes: [],
      scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'CABLE' },
    })

    expect(buildResourcePresentationName(attributes, target)).toBe('CABLE')
  })
})

import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCatalogPresentationAdmin } from '../../src/features/catalog-hierarchy/useCatalogPresentationAdmin'
import type { CatalogPresentationAdminApi } from '../../src/features/catalog-hierarchy/catalogPresentationAdmin.api'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

const context = {
  classCode: 'MATERIAL',
  familyCode: 'CABLE',
  typeCode: 'CABLE_CONTROL',
}

const attribute = (code: string, name: string): EffectiveAttribute => ({
  characteristic: { code, name, valueType: 'CONTROLLED_TEXT' },
  effectiveMode: 'OPTIONAL',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [],
  source: { level: 'TYPE', code: context.typeCode },
  rules: [],
})
const attributes = [
  attribute('color', 'Color'),
  attribute('calibre', 'Calibre'),
]

const presentationApi = (
  overrides: Partial<CatalogPresentationAdminApi> = {},
): CatalogPresentationAdminApi => ({
  listPresentations: vi.fn(async () => ({
    records: [
      {
        id: '1',
        revision: '1',
        active: true,
        characteristicCode: 'color',
        position: '0',
      },
    ],
    hasPrevious: false,
    hasNext: false,
  })),
  updatePresentation: vi.fn(),
  ...overrides,
})

const creationApi = (
  overrides: Partial<{
    createPresentation: (input: unknown) => Promise<unknown>
    resolveHierarchyReferences: (input: unknown) => Promise<unknown>
    searchCharacteristics: (input: { text: string }) => Promise<unknown>
  }> = {},
) => ({
  createPresentation: vi.fn(async () => ({})),
  resolveHierarchyReferences: vi.fn(async () => ({
    class: {
      kind: 'REFERENCE',
      reference: { kind: 'CLASE', id: '1', code: context.classCode },
    },
    family: {
      kind: 'REFERENCE',
      reference: { kind: 'FAMILIA', id: '2', code: context.familyCode },
    },
    type: {
      kind: 'REFERENCE',
      reference: { kind: 'TIPO', id: '3', code: context.typeCode },
    },
  })),
  searchCharacteristics: vi.fn(async (input: { text: string }) => ({
    records: [
      {
        kind: 'CARACTERISTICA',
        id: '4',
        revision: '1',
        active: true,
        code: input.text,
        name: input.text,
        valueType: 'CONTROLLED_TEXT',
        rules: [],
      },
    ],
    hasPrevious: false,
    hasNext: false,
  })),
  ...overrides,
})

describe('useCatalogPresentationAdmin', () => {
  it('stays waiting-context with no Tipo selected', () => {
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi(),
        creationApi: creationApi(),
        context: {},
        attributes: [],
      }),
    )

    expect(result.current.status).toBe('waiting-context')
  })

  it('loads and derives participating/not-participating rows', async () => {
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi(),
        creationApi: creationApi(),
        context,
        attributes,
      }),
    )

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.rows?.participating).toEqual([
      {
        characteristicCode: 'color',
        name: 'Color',
        id: '1',
        revision: '1',
        position: '0',
        active: true,
      },
    ])
    expect(result.current.rows?.notParticipating).toEqual([
      {
        characteristicCode: 'calibre',
        name: 'Calibre',
        id: null,
        revision: null,
        position: null,
        active: false,
      },
    ])
  })

  it('turning on an attribute with no presentation row creates one at the next position, then refetches', async () => {
    const createPresentation = vi.fn(async () => ({}))
    const listPresentations = vi
      .fn()
      .mockResolvedValueOnce({
        records: [
          {
            id: '1',
            revision: '1',
            active: true,
            characteristicCode: 'color',
            position: '0',
          },
        ],
        hasPrevious: false,
        hasNext: false,
      })
      .mockResolvedValueOnce({
        records: [
          {
            id: '1',
            revision: '1',
            active: true,
            characteristicCode: 'color',
            position: '0',
          },
          {
            id: '2',
            revision: '1',
            active: true,
            characteristicCode: 'calibre',
            position: '1',
          },
        ],
        hasPrevious: false,
        hasNext: false,
      })
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({ listPresentations }),
        creationApi: creationApi({ createPresentation }),
        context,
        attributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const calibre = result.current.rows!.notParticipating[0]!
    await result.current.toggleParticipation(calibre)

    expect(createPresentation).toHaveBeenCalledWith({
      class: {
        kind: 'REFERENCE',
        reference: { kind: 'CLASE', id: '1', code: 'MATERIAL' },
      },
      family: {
        kind: 'REFERENCE',
        reference: { kind: 'FAMILIA', id: '2', code: 'CABLE' },
      },
      type: {
        kind: 'REFERENCE',
        reference: { kind: 'TIPO', id: '3', code: 'CABLE_CONTROL' },
      },
      characteristic: {
        kind: 'REFERENCE',
        reference: { kind: 'CARACTERISTICA', id: '4', code: 'calibre' },
      },
      position: '1',
    })
    await waitFor(() =>
      expect(
        result.current.rows?.participating.map((r) => r.characteristicCode),
      ).toEqual(['color', 'calibre']),
    )
  })

  it('computes the next position from the highest existing position, not from the participating count, when positions are not a compact 0-based sequence', async () => {
    const threeAttributes = [
      attribute('insulation', 'Aislamiento'),
      attribute('gauge', 'Calibre'),
      attribute('color', 'Color'),
    ]
    const updatePresentation = vi.fn(async () => ({}))
    const listPresentations = vi.fn(async () => ({
      records: [
        {
          id: '2',
          revision: '26',
          active: false,
          characteristicCode: 'insulation',
          position: '1',
        },
        {
          id: '3',
          revision: '1',
          active: true,
          characteristicCode: 'gauge',
          position: '2',
        },
        {
          id: '1',
          revision: '1',
          active: true,
          characteristicCode: 'color',
          position: '3',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    }))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({
          listPresentations,
          updatePresentation,
        }),
        creationApi: creationApi(),
        context,
        attributes: threeAttributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const insulation = result.current.rows!.notParticipating[0]!
    expect(insulation.characteristicCode).toBe('insulation')
    await result.current.toggleParticipation(insulation)

    expect(updatePresentation).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', active: true, position: '4' }),
    )
  })

  it('turning on an attribute with an existing but inactive presentation row reactivates it, instead of deactivating it again', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const listPresentations = vi.fn(async () => ({
      records: [
        {
          id: '1',
          revision: '1',
          active: true,
          characteristicCode: 'color',
          position: '0',
        },
        {
          id: '2',
          revision: '5',
          active: false,
          characteristicCode: 'calibre',
          position: '1',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    }))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({
          listPresentations,
          updatePresentation,
        }),
        creationApi: creationApi(),
        context,
        attributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const calibre = result.current.rows!.notParticipating[0]!
    expect(calibre.id).toBe('2')
    await result.current.toggleParticipation(calibre)

    expect(updatePresentation).toHaveBeenCalledWith({
      id: '2',
      expectedRevision: '5',
      active: true,
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'CABLE_CONTROL',
      characteristicCode: 'calibre',
      position: '2',
    })
  })

  it('turning off a participating attribute updates it with active:false, then refetches', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({ updatePresentation }),
        creationApi: creationApi(),
        context,
        attributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const color = result.current.rows!.participating[0]!
    await result.current.toggleParticipation(color)

    expect(updatePresentation).toHaveBeenCalledWith({
      id: '1',
      expectedRevision: '1',
      active: false,
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'CABLE_CONTROL',
      characteristicCode: 'color',
      position: '0',
    })
  })

  it('moveUp/moveDown swap positions between adjacent participating rows via two updates', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const listPresentations = vi.fn(async () => ({
      records: [
        {
          id: '1',
          revision: '1',
          active: true,
          characteristicCode: 'color',
          position: '0',
        },
        {
          id: '2',
          revision: '1',
          active: true,
          characteristicCode: 'calibre',
          position: '1',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    }))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({
          listPresentations,
          updatePresentation,
        }),
        creationApi: creationApi(),
        context,
        attributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await result.current.moveDown('color')

    expect(updatePresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        characteristicCode: 'color',
        position: '1',
      }),
    )
    expect(updatePresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2',
        characteristicCode: 'calibre',
        position: '0',
      }),
    )
  })

  it('swaps sequentially through a free scratch position, never sending two updates that momentarily target the same live position', async () => {
    const threeAttributes = [
      attribute('gauge', 'Calibre'),
      attribute('color', 'Color'),
      attribute('insulation', 'Aislamiento'),
    ]
    const updatePresentation = vi
      .fn()
      .mockResolvedValueOnce({
        id: '2',
        revision: '28',
        active: true,
        characteristicCode: 'insulation',
        position: '999',
      })
      .mockResolvedValueOnce({
        id: '1',
        revision: '2',
        active: true,
        characteristicCode: 'color',
        position: '4',
      })
      .mockResolvedValueOnce({
        id: '2',
        revision: '29',
        active: true,
        characteristicCode: 'insulation',
        position: '3',
      })
    const listPresentations = vi.fn(async () => ({
      records: [
        {
          id: '3',
          revision: '1',
          active: true,
          characteristicCode: 'gauge',
          position: '2',
        },
        {
          id: '1',
          revision: '1',
          active: true,
          characteristicCode: 'color',
          position: '3',
        },
        {
          id: '2',
          revision: '27',
          active: true,
          characteristicCode: 'insulation',
          position: '4',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    }))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({
          listPresentations,
          updatePresentation,
        }),
        creationApi: creationApi(),
        context,
        attributes: threeAttributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await result.current.moveUp('insulation')

    expect(updatePresentation).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: '2',
        expectedRevision: '27',
        position: '5',
      }),
    )
    expect(updatePresentation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: '1',
        expectedRevision: '1',
        position: '4',
      }),
    )
    expect(updatePresentation).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        id: '2',
        expectedRevision: '28',
        position: '3',
      }),
    )
  })

  it('picks the next free position past every real record, including an inactive one, not just the active/participating ones', async () => {
    const fourAttributes = [
      attribute('gauge', 'Calibre'),
      attribute('insulation', 'Aislamiento'),
      attribute('color', 'Color'),
      attribute('conductor_material', 'Material del conductor'),
    ]
    const updatePresentation = vi.fn(async () => ({}))
    const listPresentations = vi.fn(async () => ({
      records: [
        {
          id: '3',
          revision: '1',
          active: true,
          characteristicCode: 'gauge',
          position: '2',
        },
        {
          id: '2',
          revision: '31',
          active: true,
          characteristicCode: 'insulation',
          position: '3',
        },
        {
          id: '1',
          revision: '2',
          active: true,
          characteristicCode: 'color',
          position: '4',
        },
        {
          id: '20',
          revision: '4',
          active: false,
          characteristicCode: 'conductor_material',
          position: '5',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    }))
    const { result } = renderHook(() =>
      useCatalogPresentationAdmin({
        presentationApi: presentationApi({
          listPresentations,
          updatePresentation,
        }),
        creationApi: creationApi(),
        context,
        attributes: fourAttributes,
      }),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const conductorMaterial = result.current.rows!.notParticipating[0]!
    expect(conductorMaterial.characteristicCode).toBe('conductor_material')
    await result.current.toggleParticipation(conductorMaterial)

    expect(updatePresentation).toHaveBeenCalledWith(
      expect.objectContaining({ id: '20', active: true, position: '6' }),
    )
  })
})

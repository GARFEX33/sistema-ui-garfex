import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogPresentationEditor } from '../../src/features/catalog-hierarchy/CatalogPresentationEditor'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
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
  updatePresentation: vi.fn(async () => ({})),
  ...overrides,
})

const creationApi = (
  overrides: Partial<{
    createPresentation: (input: unknown) => Promise<unknown>
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

const renderEditor = (
  props: Partial<Parameters<typeof CatalogPresentationEditor>[0]> = {},
) =>
  render(
    <KeyboardControllerProvider activeSurface="catalog">
      <CatalogPresentationEditor
        presentationApi={presentationApi()}
        creationApi={creationApi()}
        context={context}
        attributes={attributes}
        actorAvailable
        {...props}
      />
    </KeyboardControllerProvider>,
  )

describe('CatalogPresentationEditor', () => {
  it('opens the dialog and shows participating/not-participating attributes', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(
      screen.getByRole('button', { name: 'Editar presentación' }),
    )
    await screen.findByRole('dialog', { name: 'Editar presentación' })

    const inOrder = screen.getByRole('list', {
      name: 'Orden de atributos en la presentación',
    })
    expect(inOrder).toHaveTextContent('Color')
    const outside = screen.getByRole('list', {
      name: 'Atributos fuera de la presentación',
    })
    expect(outside).toHaveTextContent('Calibre')
  })

  it('toggles a not-participating attribute on', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const createPresentation = vi.fn(async () => ({}))
    const user = userEvent.setup()
    renderEditor({
      presentationApi: presentationApi({ updatePresentation }),
      creationApi: creationApi({ createPresentation }),
    })

    await user.click(
      screen.getByRole('button', { name: 'Editar presentación' }),
    )
    await screen.findByRole('dialog', { name: 'Editar presentación' })
    await user.click(screen.getByRole('checkbox', { name: 'Calibre' }))

    await waitFor(() => expect(createPresentation).toHaveBeenCalledOnce())
  })

  it('toggles a participating attribute off', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const user = userEvent.setup()
    renderEditor({ presentationApi: presentationApi({ updatePresentation }) })

    await user.click(
      screen.getByRole('button', { name: 'Editar presentación' }),
    )
    await screen.findByRole('dialog', { name: 'Editar presentación' })
    await user.click(screen.getByRole('checkbox', { name: 'Color' }))

    await waitFor(() =>
      expect(updatePresentation).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', active: false }),
      ),
    )
  })

  it('reorders participating attributes with Subir/Bajar', async () => {
    const updatePresentation = vi.fn(async () => ({}))
    const user = userEvent.setup()
    renderEditor({
      presentationApi: presentationApi({
        listPresentations: vi.fn(async () => ({
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
        })),
        updatePresentation,
      }),
    })

    await user.click(
      screen.getByRole('button', { name: 'Editar presentación' }),
    )
    await screen.findByRole('dialog', { name: 'Editar presentación' })
    await user.click(screen.getByRole('button', { name: 'Bajar Color' }))

    await waitFor(() =>
      expect(updatePresentation).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', position: '1' }),
      ),
    )
  })

  it('shows a blocked reason when no actor is available', async () => {
    const user = userEvent.setup()
    renderEditor({ actorAvailable: false })

    await user.click(
      screen.getByRole('button', { name: 'Editar presentación' }),
    )
    await screen.findByRole('dialog', { name: 'Editar presentación' })
    await user.click(screen.getByRole('checkbox', { name: 'Calibre' }))

    expect(
      await screen.findByText(
        'No se puede guardar hasta contar con un actor válido.',
      ),
    ).toBeInTheDocument()
  })
})

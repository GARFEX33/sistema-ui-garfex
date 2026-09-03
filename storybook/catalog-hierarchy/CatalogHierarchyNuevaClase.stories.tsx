import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { NuevaClaseSurface } from '../../src/features/catalog-hierarchy/NuevaClaseSurface'

const meta = {
  title: 'Catálogo/Alta local/Nueva Clase',
  component: NuevaClaseSurface,
  parameters: {
    viewport: { defaultViewport: 'workstation' },
    docs: {
      description: {
        component:
          'Superficie local de presentación contrastada con la referencia OpenPencil aprobada; no crea ni persiste datos.',
      },
    },
  },
} satisfies Meta<typeof NuevaClaseSurface>

export default meta
type Story = StoryObj<typeof meta>
const fakeCreateClass = async () => {
  throw new Error('Storybook fake: createClass is not executed')
}

export const Approved: Story = {
  name: 'Nueva Clase — borrador local',
  args: { createClass: fakeCreateClass },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.getByRole('button', { name: 'Nueva Clase' }).click()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Nueva Clase',
    })
    expect(dialog).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Clave' })).toBeVisible()
    expect(
      within(dialog).getByRole('textbox', { name: 'Nombre' }),
    ).toBeVisible()
    expect(
      within(dialog).getByRole('textbox', { name: 'Descripción' }),
    ).toBeVisible()
    expect(
      within(dialog).getByRole('button', { name: 'Crear Clase' }),
    ).toBeDisabled()
  },
}

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
          'Superficie local de presentación para Nueva Clase; no crea ni persiste datos.',
      },
    },
  },
} satisfies Meta<typeof NuevaClaseSurface>

export default meta
type Story = StoryObj<typeof meta>

export const Approved: Story = {
  name: 'Nueva Clase — borrador local',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.getByRole('button', { name: 'Nueva Clase' }).click()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Nueva Clase',
    })
    expect(dialog).toBeVisible()
    expect(
      Array.from(dialog.querySelectorAll('label')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['Clave', 'Nombre', 'Descripción'])
    expect(
      Array.from(dialog.querySelectorAll('footer button')).map(
        (button) => button.textContent,
      ),
    ).toEqual(['Cancelar', 'Crear Clase'])
    expect(
      within(dialog).getByRole('button', { name: 'Crear Clase' }),
    ).toBeDisabled()
  },
}

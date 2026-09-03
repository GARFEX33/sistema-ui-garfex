import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { CatalogHierarchyScreen } from '../../src/features/catalog-hierarchy/CatalogHierarchyScreen'
import { catalogHierarchyApprovedFixture } from './catalogHierarchy.fixtures'

const meta = {
  title: 'Catálogo/Composición aprobada',
  component: CatalogHierarchyScreen,
  parameters: {
    viewport: { defaultViewport: 'workstation' },
    docs: {
      description: {
        component:
          'Composición poblada de presentación: Materiales → Canalizaciones → Tubería. No representa datos de runtime.',
      },
    },
  },
} satisfies Meta<typeof CatalogHierarchyScreen>

export default meta
type Story = StoryObj<typeof meta>
const fakeCreateClass = async () => {
  throw new Error('Storybook fake: createClass is not executed')
}
const fakeCreateFamily = async () => {
  throw new Error('Storybook fake: createFamily is not executed')
}
const fakeCreateType = async () => {
  throw new Error('Storybook fake: createType is not executed')
}

export const Approved: Story = {
  name: '1440×980 — Materiales → Canalizaciones → Tubería',
  args: {
    presentation: catalogHierarchyApprovedFixture,
    createClass: fakeCreateClass,
    createFamily: fakeCreateFamily,
    createType: fakeCreateType,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [regionName, label] of [
      ['Clases', 'Materiales'],
      ['Familias', 'Canalizaciones'],
      ['Tipos', 'Tubería'],
    ]) {
      const region = within(canvas.getByRole('region', { name: regionName }))
      expect(region.getAllByRole('button').length).toBe(1)
      expect(region.getByRole('button', { name: label })).toBeVisible()
    }
    expect(canvas.getByRole('heading', { name: 'Tubería' })).toBeVisible()
    expect(
      canvas.queryByRole('button', { name: 'Nueva Clase' }),
    ).not.toBeInTheDocument()
    expect(
      canvas.queryByRole('button', { name: 'Nueva Familia' }),
    ).not.toBeInTheDocument()
    const typeTrigger = canvas.getByRole('button', { name: 'Nuevo Tipo' })
    expect(typeTrigger).toBeVisible()
    expect(
      canvas.getAllByRole('button', {
        name: /Nuevo Tipo|Nueva Clase|Nueva Familia/,
      }),
    ).toHaveLength(1)
    await typeTrigger.click()
    const typeDialog = within(document.body).getByRole('dialog', {
      name: 'Nuevo Tipo',
    })
    expect(within(typeDialog).getByTestId('creation-parent')).toHaveTextContent(
      'Canalizaciones',
    )
    expect(
      within(typeDialog).queryByRole('textbox', { name: 'Familia' }),
    ).not.toBeInTheDocument()
  },
}

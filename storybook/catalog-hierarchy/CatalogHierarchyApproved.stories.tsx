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

export const Approved: Story = {
  name: '1440×980 — Materiales → Canalizaciones → Tubería',
  args: { presentation: catalogHierarchyApprovedFixture },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [regionName, label] of [
      ['Clases', 'Materiales'],
      ['Familias', 'Canalizaciones'],
      ['Tipos', 'Tubería'],
    ]) {
      const region = within(canvas.getByRole('region', { name: regionName }))
      expect(region.getByRole('button', { name: label })).toBeVisible()
    }
    expect(canvas.getByRole('heading', { name: 'Tubería' })).toBeVisible()
    expect(
      canvas.getByText('Las relaciones padre permanecen inmutables.'),
    ).toBeVisible()
  },
}

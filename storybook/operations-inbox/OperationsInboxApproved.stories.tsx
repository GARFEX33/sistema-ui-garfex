import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ApprovedPopulatedInbox } from './ApprovedPopulatedInbox'

const meta = {
  title: 'Bandeja operativa/Composición aprobada',
  component: ApprovedPopulatedInbox,
  parameters: {
    viewport: { defaultViewport: 'workstation' },
    docs: {
      description: {
        component:
          'page04.png es la autoridad visual; los textos, métricas y registros son fixtures de presentación, no datos reales ni contrato de backend.',
      },
    },
  },
} satisfies Meta<typeof ApprovedPopulatedInbox>

export default meta
type Story = StoryObj<typeof meta>

export const Approved: Story = {
  name: 'Aprobada 1440×980 — fixtures de presentación',
  render: () => <ApprovedPopulatedInbox />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(
      canvas.getByRole('heading', { name: 'Pendientes de operación' }),
    ).toBeVisible()
    expect(
      canvas.getByRole('table', { name: 'Pendientes de operación' }),
    ).toBeVisible()
    expect(
      canvas.getByText(
        'Fixtures de presentación: page04.png es la autoridad visual; no son datos reales ni contrato de backend.',
      ),
    ).toBeInTheDocument()
    expect(
      canvas.getByRole('complementary', {
        name: 'Panel contextual de evidencia',
      }),
    ).toBeVisible()
  },
}

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
      canvas.getByRole('heading', {
        name: '¿Qué trabajo necesitás resolver ahora?',
      }),
    ).toBeVisible()
    const indicators = canvas.getByLabelText('Indicadores de evidencia')
    expect(indicators.children).toHaveLength(4)
    // prettier-ignore
    for (const text of ['18 sin clasificar', '7 atributos faltantes', '4 unidades incompatibles', '6 duplicados candidatos']) expect(within(indicators).getByText(text)).toBeVisible()
    const table = canvas.getByRole('table', {
      name: '¿Qué trabajo necesitás resolver ahora?',
    })
    const rows = table.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(8)
    // prettier-ignore
    const expectedRows = ['Recurso Cable THW-LS 2.5 mm² Unidad incompatible Importación 12 min', 'Recurso Perfil galvanizado 40x40 Sin clasificar Carga manual 18 min', 'Atributo Tornillo M8 x 40 7 atributos faltantes Catálogo 24 min', 'Unidad Placa OSB 18 mm Unidad incompatible Importación 31 min', 'Duplicado Codo PVC 90° Ø110 Duplicado candidato Proveedor 42 min', 'Catálogo Familia Conductores Regla pendiente Administración 1 h', 'Permiso Rol Compras · Laura Revisión requerida Actividad 2 h', 'Recurso Arena fina lavada Sin clasificar Carga manual 3 h']
    expect(
      [...rows].map((row) =>
        [...row.querySelectorAll('td')]
          .slice(1)
          .map((cell) => cell.textContent?.trim())
          .join(' '),
      ),
    ).toEqual(expectedRows)
    // prettier-ignore
    for (const text of ['Vista: Mis pendientes', 'TRABAJO PENDIENTE · 23', '5 seleccionados', 'Buscar o ejecutar comando…', 'Estado ▼', 'Tipo ▼', 'Prioridad ▼', 'Responsable ▼', 'Guardar vista', 'Clasificar', 'Asignar', 'Marcar revisado', 'Más…', '↑ ↓ navegar', 'Espacio seleccionar', 'Enter abrir', '/ buscar', 'Ctrl/Cmd+K comandos', '? atajos']) expect(canvas.getByText(text)).toBeVisible()
    const panel = within(
      canvas.getByRole('complementary', {
        name: 'Panel contextual de evidencia',
      }),
    )
    expect(
      panel.getByRole('heading', { name: 'Cable THW-LS 2.5 mm²' }),
    ).toBeVisible()
    // prettier-ignore
    for (const text of ['ELEMENTO SELECCIONADO · RECURSO', 'Unidad incompatible', 'Qué requiere atención', 'La unidad “m” no coincide con la regla de la familia. Revisá la equivalencia antes de publicar.', 'Clasificación', 'Conductores / Cables', 'Unidad actual', 'm', 'Origen', 'Importación · ERP legado', 'Sugerencia', 'metro lineal (ml)', 'Aplicar sugerencia', 'Comparar candidatos', 'Ver actividad y auditoría →', 'Última modificación: Laura · hace 12 min', 'Regla CAT-004 · revisión pendiente']) expect(panel.getByText(text)).toBeVisible()
    expect(
      canvas.getByText(
        'Fixtures de presentación: page04.png es la autoridad visual; no son datos reales ni contrato de backend.',
      ),
    ).toBeInTheDocument()
  },
}

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Purchase } from '../../src/features/compras/compras.types'
import {
  HistorialComprasStage,
  type HistorialComprasStageProps,
} from '../../src/features/compras/HistorialComprasStage'

const purchase = (overrides: Partial<Purchase> = {}): Purchase =>
  ({
    id: 'purchase-1',
    cfdiUuid: 'uuid-1',
    series: 'A',
    folio: '100',
    issuedAt: '2026-09-19T00:00:00Z',
    currency: 'MXN',
    total: '9007199254740993.1234',
    ...overrides,
  }) as Purchase

const baseProps = (): HistorialComprasStageProps => ({
  supplierName: 'Acme Comercial',
  rows: [purchase()],
  status: 'ready',
  hasPrevious: false,
  hasNext: false,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onRetry: vi.fn(),
  onSelectPurchase: vi.fn(),
})
const view = (overrides: Partial<HistorialComprasStageProps> = {}) => (
  <HistorialComprasStage {...baseProps()} {...overrides} />
)
const renderStage = (overrides: Partial<HistorialComprasStageProps> = {}) =>
  render(view(overrides))

describe('HistorialComprasStage', () => {
  it('shows supplier context, exact display data, and replaces rather than accumulates rows', () => {
    const { rerender } = renderStage()
    expect(
      screen.getByRole('heading', {
        name: 'Historial de compras de Acme Comercial',
        level: 2,
      }),
    ).toBeVisible()
    expect(screen.getByText('A-100')).toBeVisible()
    expect(screen.getByText('2026-09-19')).toBeVisible()
    expect(screen.getByText('MXN')).toBeVisible()
    expect(screen.getByText('9,007,199,254,740,993.1234')).toBeVisible()

    const nextPurchase = purchase({
      id: 'purchase-2',
      series: '',
      folio: '',
      cfdiUuid: 'uuid-fallback',
      total: '0.0000000000000001',
    })
    rerender(view({ rows: [nextPurchase] }))
    expect(screen.getByRole('table')).toHaveTextContent('uuid-fallback')
    expect(screen.queryByText('A-100')).not.toBeInTheDocument()
    expect(screen.getByText('0.0000000000000001')).toBeVisible()
  })

  it('communicates loading, empty, initial/navigation errors, and navigating', () => {
    const retry = vi.fn()
    const { rerender } = renderStage()
    const cases = [
      ['initial-loading', 'status', 'Cargando compras…'],
      ['empty', 'status', 'No hay compras'],
      ['initial-error', 'alert', 'No se pudieron cargar las compras.'],
      [
        'navigation-error',
        'alert',
        'No se pudo cargar esta página de compras.',
      ],
    ] as const
    for (const [status, role, text] of cases) {
      rerender(view({ status, rows: [], onRetry: retry }))
      expect(screen.getByRole(role)).toHaveTextContent(text)
    }
    expect(
      screen.getByRole('button', { name: 'Reintentar compras' }),
    ).toBeEnabled()
    rerender(
      view({
        status: 'navigating',
        rows: [],
        hasPrevious: true,
        hasNext: true,
      }),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando otra página…',
    )
    expect(screen.getByLabelText('Página anterior')).toBeDisabled()
    expect(screen.getByLabelText('Página siguiente')).toBeDisabled()
  })

  it('gates paging and reports explicit purchase selection', async () => {
    const user = userEvent.setup()
    const previous = vi.fn()
    const next = vi.fn()
    const select = vi.fn()
    renderStage({
      hasNext: true,
      onPrevious: previous,
      onNext: next,
      onSelectPurchase: select,
    })
    expect(screen.getByLabelText('Página anterior')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(next).toHaveBeenCalledOnce()
    expect(previous).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('button', { name: 'Seleccionar compra A-100' }),
    )
    expect(select).toHaveBeenCalledWith(purchase())
  })
})

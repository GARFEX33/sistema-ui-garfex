import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResourceCreationAttributesStage } from '../../src/features/resources-master/ResourceCreationAttributesStage'

const assignment = (applicability: 'REQUIRED' | 'OPTIONAL' = 'OPTIONAL') => ({
  applicability,
  current: 2,
  total: 3,
})

const definition = {
  description: 'Color de referencia para la clasificación.',
  name: 'Color',
}

const values = [
  { key: 'allowed-red', displayName: 'Rojo' },
  { key: 'allowed-green', displayName: 'Verde' },
]

const selection = (overrides = {}) => ({
  status: 'selection-ready' as const,
  assignment: assignment(),
  definition,
  values,
  loadState: { status: 'ready' as const, exhausted: false },
  confirmedKey: 'allowed-red',
  onConfirm: vi.fn(),
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  onOmit: vi.fn(),
  ...overrides,
})

describe('ResourceCreationAttributesStage', () => {
  it('presents exactly the current selection and confirms its keyboard candidate', async () => {
    const user = userEvent.setup()
    const view = selection()
    render(<ResourceCreationAttributesStage view={view} />)

    expect(screen.getByText('Atributos · 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Color' })).toBeInTheDocument()
    expect(screen.getByText(definition.description)).toBeInTheDocument()
    expect(screen.getByText('Opcional')).toBeInTheDocument()
    expect(screen.getAllByRole('listbox')).toHaveLength(1)
    expect(screen.getByRole('searchbox', { name: 'Color' })).toHaveFocus()

    await user.type(screen.getByRole('searchbox', { name: 'Color' }), 'verde')
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Color' }), {
      key: 'ArrowDown',
    })
    await user.keyboard('{Enter}')

    expect(view.onConfirm).toHaveBeenCalledWith(values[1])
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('forwards allowed-value pagination and retry callbacks', async () => {
    const user = userEvent.setup()
    const view = selection({
      loadState: { status: 'initial-error' },
      values: [],
    })
    render(<ResourceCreationAttributesStage view={view} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(view.onRetry).toHaveBeenCalledOnce()

    const paged = selection()
    render(<ResourceCreationAttributesStage view={paged} />)
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    expect(paged.onLoadMore).toHaveBeenCalledOnce()
  })

  it('allows omission only for optional selection assignments', async () => {
    const user = userEvent.setup()
    const optional = selection()
    const { rerender } = render(
      <ResourceCreationAttributesStage view={optional} />,
    )

    await user.click(screen.getByRole('button', { name: 'Omitir' }))
    expect(optional.onOmit).toHaveBeenCalledOnce()

    rerender(
      <ResourceCreationAttributesStage
        view={selection({ assignment: assignment('REQUIRED') })}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Omitir' }),
    ).not.toBeInTheDocument()
  })

  it('keeps LIBRE unsupported without a primitive editor and permits optional omission', async () => {
    const user = userEvent.setup()
    const onOmit = vi.fn()
    render(
      <ResourceCreationAttributesStage
        view={{
          status: 'unsupported-free-capture',
          assignment: assignment(),
          definition,
          onOmit,
        }}
      />,
    )

    expect(screen.getByText(/captura libre/i)).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Omitir' }))
    expect(onOmit).toHaveBeenCalledOnce()
  })

  it('keeps loading and unavailable states honest, and retries errors only', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    const { rerender } = render(
      <ResourceCreationAttributesStage
        view={{ status: 'evaluation-loading' }}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Evaluando los atributos',
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    rerender(
      <ResourceCreationAttributesStage
        view={{
          status: 'definition-error',
          assignment: assignment(),
          onRetry: retry,
        }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar')
    expect(
      screen.queryByRole('button', { name: 'Omitir' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()

    rerender(
      <ResourceCreationAttributesStage
        view={{ status: 'evaluation-unavailable' }}
      />,
    )
    expect(screen.getByText(/evaluación o la secuencia/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

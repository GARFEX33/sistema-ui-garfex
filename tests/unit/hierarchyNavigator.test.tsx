import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HierarchyNavigator } from '../../src/shared/ui/HierarchyNavigator'

const columns = () => [
  {
    id: 'first',
    label: 'First',
    items: [{ id: 'one', label: 'One' }],
    selectedId: 'one',
    hasChildren: true,
    spatial: {
      id: (item: { id: string }) => `tree.first.${item.id}`,
      column: 'first',
      metadata: { 'data-test-level': 'first' },
    },
  },
  {
    id: 'second',
    label: 'Second',
    items: [],
    waitingLabel: 'Waiting for first.',
    state: { status: 'waiting-for-parent', isExhausted: false },
  },
  {
    id: 'third',
    label: 'Third',
    items: [],
    state: { status: 'initial-loading', isExhausted: false },
  },
]

describe('HierarchyNavigator', () => {
  it('renders accessible generic regions with selected rows and supplied spatial metadata', () => {
    render(<HierarchyNavigator columns={columns()} />)

    const first = screen.getByRole('region', { name: 'First' })
    const row = screen.getByRole('button', { name: 'One' })
    expect(first).toContainElement(row)
    expect(row).toHaveAttribute('aria-pressed', 'true')
    expect(row).toHaveAttribute('data-spatial-id', 'tree.first.one')
    expect(row).toHaveAttribute('data-spatial-column', 'first')
    expect(row).toHaveAttribute('data-test-level', 'first')
    expect(screen.getByText('Waiting for first.')).toBeVisible()
    expect(screen.getByText('Loading…')).toBeVisible()
  })

  it('keeps retry and pagination controls local to their supplied callbacks', () => {
    const retry = vi.fn()
    const continueList = vi.fn()
    const select = vi.fn()
    render(
      <HierarchyNavigator
        columns={[
          {
            id: 'first',
            label: 'First',
            items: [{ id: 'one', label: 'One' }],
            onSelect: select,
            onContinue: continueList,
            state: { status: 'ready', isExhausted: false },
          },
          {
            id: 'second',
            label: 'Second',
            items: [],
            onRetry: retry,
            state: { status: 'initial-error', isExhausted: false },
          },
          {
            id: 'third',
            label: 'Third',
            items: [{ id: 'three', label: 'Three' }],
            onRetry: retry,
            state: { status: 'partial-error', isExhausted: false },
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'One' }))
    fireEvent.click(screen.getByRole('button', { name: 'Load more…' }))
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    fireEvent.click(screen.getByRole('button', { name: 'Retry continuation' }))
    expect(select).toHaveBeenCalledWith('one')
    expect(continueList).toHaveBeenCalledTimes(1)
    expect(retry).toHaveBeenCalledTimes(2)
  })

  it('keeps offset-window controls absent when their contract is not supplied', () => {
    render(<HierarchyNavigator columns={columns()} />)

    expect(
      screen.queryByRole('button', { name: 'Anterior' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Siguiente' }),
    ).not.toBeInTheDocument()
  })

  it('renders supplied offset-window controls accessibly and disables non-actionable navigation', () => {
    const previous = vi.fn()
    const next = vi.fn()
    const windowColumns = (window: {
      hasPrevious: boolean
      hasNext: boolean
      onPrevious: () => void
      onNext: () => void
      isNavigationPending: boolean
    }) => [
      {
        id: 'first',
        label: 'First',
        items: [{ id: 'one', label: 'One' }],
        ...window,
      },
      { id: 'second', label: 'Second', items: [] },
      { id: 'third', label: 'Third', items: [] },
    ]
    const view = render(
      <HierarchyNavigator
        columns={windowColumns({
          hasPrevious: true,
          hasNext: true,
          onPrevious: previous,
          onNext: next,
          isNavigationPending: false,
        })}
      />,
    )

    const anterior = screen.getByRole('button', { name: 'Anterior' })
    const siguiente = screen.getByRole('button', { name: 'Siguiente' })
    expect(anterior).toBeEnabled()
    expect(siguiente).toBeEnabled()
    fireEvent.click(anterior)
    fireEvent.click(siguiente)
    expect(previous).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)

    view.rerender(
      <HierarchyNavigator
        columns={windowColumns({
          hasPrevious: false,
          hasNext: true,
          onPrevious: previous,
          onNext: next,
          isNavigationPending: false,
        })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(previous).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)

    view.rerender(
      <HierarchyNavigator
        columns={windowColumns({
          hasPrevious: true,
          hasNext: true,
          onPrevious: previous,
          onNext: next,
          isNavigationPending: true,
        })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(previous).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('keeps a ready, nonexhausted empty page operable instead of rendering it as loading', () => {
    const continueList = vi.fn()
    render(
      <HierarchyNavigator
        columns={[
          {
            id: 'first',
            label: 'First',
            items: [],
            onContinue: continueList,
            state: { status: 'ready', isExhausted: false },
          },
          { id: 'second', label: 'Second', items: [] },
          { id: 'third', label: 'Third', items: [] },
        ]}
      />,
    )

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load more…' }))
    expect(continueList).toHaveBeenCalledTimes(1)
  })

  it('distinguishes a confirmed empty list from loading and error states', () => {
    render(
      <HierarchyNavigator
        columns={[
          {
            id: 'first',
            label: 'First',
            items: [],
            state: { status: 'empty', isExhausted: true },
          },
          { id: 'second', label: 'Second', items: [] },
          { id: 'third', label: 'Third', items: [] },
        ]}
      />,
    )

    expect(screen.getAllByText('Confirmed empty state')).toHaveLength(3)
  })
})

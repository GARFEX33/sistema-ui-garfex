import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  StagedSearchSelector,
  type SelectorLoadState,
} from '../../src/features/resources-master/StagedSearchSelector'

type Item = { id: string; nombre: string }
type FixtureProps = {
  items?: readonly Item[]
  loadState?: SelectorLoadState
  preferredActiveKey?: string | null
  onConfirm?: (item: Item) => void
  onLoadMore?: () => void
  onRetry?: () => void
}

const items: readonly Item[] = [
  { id: 'tree', nombre: 'Árbol' },
  { id: 'cable', nombre: 'Cable UTP' },
]
const ready: SelectorLoadState = { status: 'ready', exhausted: false }

const Selector = ({
  items: selectorItems = items,
  loadState = ready,
  onConfirm = vi.fn(),
  onLoadMore = vi.fn(),
  onRetry = vi.fn(),
  ...props
}: FixtureProps) => (
  <StagedSearchSelector
    label="Clase"
    items={selectorItems}
    itemKey={(item) => item.id}
    itemName={(item) => item.nombre}
    loadState={loadState}
    onConfirm={onConfirm}
    onLoadMore={onLoadMore}
    onRetry={onRetry}
    {...props}
  />
)

describe('StagedSearchSelector', () => {
  it('filters loaded Spanish names and repairs the active option without confirmation', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Selector preferredActiveKey="cable" onConfirm={onConfirm} />)

    expect(
      screen.getByText('Filtra por nombre entre los elementos cargados'),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cable UTP' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.type(screen.getByRole('searchbox', { name: 'Clase' }), 'árb')

    expect(screen.getByRole('option', { name: 'Árbol' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.queryByRole('option', { name: 'Cable UTP' }),
    ).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirms an active option through Enter and a clicked option exactly once', async () => {
    const user = userEvent.setup()
    const keyboardConfirm = vi.fn()
    render(<Selector onConfirm={keyboardConfirm} />)
    const tree = screen.getByRole('option', { name: 'Árbol' })
    await waitFor(() => expect(tree).toHaveAttribute('aria-selected', 'true'))
    tree.focus()
    await user.keyboard('{Enter}')
    expect(keyboardConfirm).toHaveBeenCalledWith(items[0])

    const clickConfirm = vi.fn()
    render(<Selector onConfirm={clickConfirm} />)
    await user.click(screen.getAllByRole('option', { name: 'Cable UTP' })[1]!)
    expect(clickConfirm).toHaveBeenCalledOnce()
    expect(clickConfirm).toHaveBeenCalledWith(items[1])
  })

  it('preserves query/items for continuation and exposes loading, empty, and retry states', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    const onRetry = vi.fn()
    const selector = (loadState: SelectorLoadState, selectorItems = items) => (
      <Selector
        items={selectorItems}
        loadState={loadState}
        onLoadMore={onLoadMore}
        onRetry={onRetry}
      />
    )
    const { rerender } = render(selector(ready))
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    await user.type(input, 'sin coincidencia')
    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay coincidencias entre los elementos cargados.',
    )
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
    await user.clear(input)
    await user.type(input, 'cable')

    rerender(selector({ status: 'loading-more' }))
    expect(screen.getByRole('button', { name: 'Cargar más…' })).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Cable UTP' }),
    ).toBeInTheDocument()
    rerender(selector({ status: 'partial-error' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar la continuación.',
    )
    await user.click(
      screen.getByRole('button', { name: 'Reintentar continuación' }),
    )

    rerender(selector({ status: 'initial-error' }, []))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(2)
    rerender(selector({ status: 'loading' }, []))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando opciones…')
    rerender(selector({ status: 'empty' }, []))
    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay opciones disponibles.',
    )
  })

  it('confirms exactly the option focused by list arrows, not its initial active option', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Selector preferredActiveKey="cable" onConfirm={onConfirm} />)
    const tree = screen.getByRole('option', { name: 'Árbol' })
    const cable = screen.getByRole('option', { name: 'Cable UTP' })

    await waitFor(() => expect(cable).toHaveAttribute('aria-selected', 'true'))
    screen.getByRole('listbox').focus()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' })
    expect(tree).toHaveFocus()
    fireEvent.keyDown(tree, { key: 'ArrowDown' })
    expect(cable).toHaveFocus()
    fireEvent.keyDown(cable, { key: 'ArrowUp' })
    expect(tree).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledWith(items[0])
  })

  it('keeps modified filter arrows local and transfers only unmodified arrows', async () => {
    render(<Selector preferredActiveKey="cable" />)
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    const cable = screen.getByRole('option', { name: 'Cable UTP' })

    await waitFor(() => expect(cable).toHaveAttribute('aria-selected', 'true'))
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown', ctrlKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowUp', altKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowDown', metaKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    expect(input).toHaveFocus()
    expect(cable).toHaveAttribute('aria-selected', 'true')

    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false)
    expect(cable).toHaveFocus()
    input.focus()
    expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(false)
    expect(cable).toHaveFocus()

    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true })
    expect(input).toHaveFocus()
    const prevented = createEvent.keyDown(input, { key: 'ArrowDown' })
    prevented.preventDefault()
    fireEvent(input, prevented)
    expect(input).toHaveFocus()
  })
})

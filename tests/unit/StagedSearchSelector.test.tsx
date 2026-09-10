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
import { isPrintableStagedSelectorKey } from '../../src/features/resources-master/stagedSearchSelector.model'

type Item = { id: string; nombre: string }
type FixtureProps = {
  items?: readonly Item[]
  loadState?: SelectorLoadState
  preferredActiveKey?: string | null
  confirmedKey?: string | null
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
      screen.getByText('Busca solo entre las opciones cargadas'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2 opciones cargadas; búsqueda local por nombre.'),
    ).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Clase' }), 'árb')

    expect(
      screen.getByText('1 coincidencia entre 2 opciones cargadas.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Cable UTP' }),
    ).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('keeps the candidate separate from the confirmed option until exact Enter or click confirmation', async () => {
    const user = userEvent.setup()
    const keyboardConfirm = vi.fn()
    render(
      <Selector
        confirmedKey="tree"
        preferredActiveKey="cable"
        onConfirm={keyboardConfirm}
      />,
    )
    const tree = screen.getByRole('option', { name: 'Árbol' })
    const cable = screen.getByRole('option', { name: 'Cable UTP' })

    expect(tree).toHaveAttribute('aria-selected', 'true')
    expect(cable).toHaveAttribute('aria-selected', 'false')
    tree.focus()
    await user.keyboard(' ')
    expect(keyboardConfirm).not.toHaveBeenCalled()
    cable.focus()
    await user.keyboard('{Enter}')
    expect(keyboardConfirm).toHaveBeenCalledWith(items[1])

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

  it('consumes continuation focus in every terminal state without stealing a user-selected focus target', async () => {
    const onLoadMore = vi.fn()
    const selector = (
      loadState: SelectorLoadState,
      selectorItems: readonly Item[] = items,
    ) => (
      <Selector
        items={selectorItems}
        loadState={loadState}
        onLoadMore={onLoadMore}
      />
    )
    const { rerender } = render(selector(ready))
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    const tree = screen.getByRole('option', { name: 'Árbol' })

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más…' }))
    rerender(selector({ status: 'loading-more' }))
    rerender(selector(ready))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cargar más…' })).toHaveFocus(),
    )

    const batchedLoadMore = screen.getByRole('button', {
      name: 'Cargar más…',
    })
    batchedLoadMore.focus()
    fireEvent.click(batchedLoadMore)
    document.body.tabIndex = -1
    document.body.focus()
    rerender(selector(ready, [...items, { id: 'pipe', nombre: 'Tubería' }]))
    document.body.removeAttribute('tabindex')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cargar más…' })).toHaveFocus(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más…' }))
    rerender(selector({ status: 'loading-more' }))
    tree.focus()
    rerender(selector(ready))
    expect(tree).toHaveFocus()

    const loadMore = screen.getByRole('button', { name: 'Cargar más…' })
    loadMore.focus()
    fireEvent.click(loadMore)
    rerender(selector({ status: 'loading-more' }))
    rerender(selector({ status: 'partial-error' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reintentar continuación' }),
      ).toHaveFocus(),
    )

    rerender(selector(ready))
    const finalPageLoadMore = screen.getByRole('button', {
      name: 'Cargar más…',
    })
    finalPageLoadMore.focus()
    fireEvent.click(finalPageLoadMore)
    rerender(selector({ status: 'loading-more' }))
    rerender(selector({ status: 'ready', exhausted: true }))
    await waitFor(() => expect(input).toHaveFocus())

    rerender(selector(ready))
    expect(input).toHaveFocus()
    expect(onLoadMore).toHaveBeenCalledTimes(5)
  })

  it('confirms exactly the option focused by list arrows, not its initial active option', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Selector preferredActiveKey="cable" onConfirm={onConfirm} />)
    const tree = screen.getByRole('option', { name: 'Árbol' })
    const cable = screen.getByRole('option', { name: 'Cable UTP' })

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

  it('transfers focus between Search and the current candidate without confirmation', () => {
    render(<Selector preferredActiveKey="cable" />)
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    const tree = screen.getByRole('option', { name: 'Árbol' })
    const cable = screen.getByRole('option', { name: 'Cable UTP' })

    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(cable).toHaveFocus()
    expect(tree).not.toHaveFocus()
    tree.focus()
    fireEvent.keyDown(tree, { key: 'ArrowUp' })
    expect(input).toHaveFocus()
  })

  it('repairs the candidate when its preferred option arrives on a new page', () => {
    const { rerender } = render(
      <Selector
        items={[]}
        loadState={{ status: 'loading' }}
        preferredActiveKey="cable"
      />,
    )

    rerender(<Selector preferredActiveKey="cable" />)
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(screen.getByRole('option', { name: 'Cable UTP' })).toHaveFocus()
  })

  it('returns printable list keys to Search', () => {
    render(<Selector preferredActiveKey="tree" />)
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    const tree = screen.getByRole('option', { name: 'Árbol' })

    tree.focus()
    fireEvent.keyDown(tree, { key: 'c' })
    expect(input).toHaveFocus()
    expect(input).toHaveValue('c')
  })

  it('keeps modified filter arrows local and transfers only unmodified arrows', async () => {
    render(<Selector preferredActiveKey="cable" />)
    const input = screen.getByRole('searchbox', { name: 'Clase' })
    const tree = screen.getByRole('option', { name: 'Árbol' })

    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown', ctrlKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowUp', altKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowDown', metaKey: true })
    expect(input).toHaveFocus()
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    expect(input).toHaveFocus()
    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(true)
    expect(input).toHaveFocus()
    expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(false)
    expect(screen.getByRole('option', { name: 'Cable UTP' })).toHaveFocus()

    tree.focus()
    fireEvent.keyDown(tree, { key: 'ArrowUp', ctrlKey: true })
    expect(tree).toHaveFocus()
    fireEvent.keyDown(tree, { key: 'ArrowUp', metaKey: true })
    expect(tree).toHaveFocus()
    fireEvent.keyDown(tree, { key: 'ArrowUp', altKey: true })
    expect(tree).toHaveFocus()
    fireEvent.keyDown(tree, { key: 'ArrowUp', shiftKey: true })
    expect(tree).toHaveFocus()
    fireEvent.keyDown(tree, { key: 'ArrowUp', isComposing: true })
    expect(tree).toHaveFocus()
    const preventedListArrow = createEvent.keyDown(tree, { key: 'ArrowUp' })
    preventedListArrow.preventDefault()
    fireEvent(tree, preventedListArrow)
    expect(tree).toHaveFocus()

    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true })
    expect(input).toHaveFocus()
    const prevented = createEvent.keyDown(input, { key: 'ArrowDown' })
    prevented.preventDefault()
    fireEvent(input, prevented)
    expect(input).toHaveFocus()
  })

  it('recognizes printable list keys without treating IME or command chords as text', () => {
    expect(
      isPrintableStagedSelectorKey({
        key: 'ñ',
        isComposing: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        getModifierState: () => false,
      }),
    ).toBe(true)
    expect(
      isPrintableStagedSelectorKey({
        key: 'a',
        isComposing: true,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        getModifierState: () => false,
      }),
    ).toBe(false)
    expect(
      isPrintableStagedSelectorKey({
        key: '@',
        isComposing: false,
        ctrlKey: true,
        metaKey: false,
        altKey: true,
        getModifierState: (modifier) => modifier === 'AltGraph',
      }),
    ).toBe(true)
    expect(
      isPrintableStagedSelectorKey({
        key: 'c',
        isComposing: false,
        ctrlKey: true,
        metaKey: false,
        altKey: true,
        getModifierState: () => false,
      }),
    ).toBe(false)
  })
})

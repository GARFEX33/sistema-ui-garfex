import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogHierarchyScreen } from '../../src/features/catalog-hierarchy/CatalogHierarchyScreen'
import type { CatalogHierarchyApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const page = (
  items: object[],
  exhausted = true,
  cursor: string | null = null,
) => ({ items, isExhausted: exhausted, continuationCursor: cursor })
const item = (id: string, nombre: string, extra = {}) => ({
  id,
  nombre,
  ...extra,
})
const button = (name: string) => screen.getByRole('button', { name })
const expectAbsent = (...names: string[]) =>
  names.forEach((name) =>
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument(),
  )
const api = (overrides: Partial<CatalogHierarchyApi> = {}) =>
  ({
    listClasses: vi.fn(async () =>
      page([item('b', 'Beta'), item('a', 'Alpha')]),
    ),
    listFamilies: vi.fn(async ({ parentId }: { parentId?: string }) =>
      page([item('family-a', 'Familia A', { claseRecursoId: parentId })]),
    ),
    listTypes: vi.fn(async ({ parentId }: { parentId?: string }) =>
      page([item('type-a', 'Tipo A', { familiaRecursoId: parentId })]),
    ),
    ...overrides,
  }) as CatalogHierarchyApi

const factory = vi.hoisted(() => vi.fn())
vi.mock(
  '../../src/features/catalog-hierarchy/catalogHierarchy.api',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    >('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    return { ...actual, createCatalogHierarchyConvexApi: factory }
  },
)

describe('CatalogHierarchyScreen connected read wiring', () => {
  it('refetches Classes from the first page after CREATED without closing or selecting', async () => {
    const connected = api({
      listClasses: vi
        .fn()
        .mockResolvedValueOnce(page([item('old', 'Clase anterior')]))
        .mockResolvedValueOnce(page([item('new', 'Clase releída')])),
    })
    const createClass = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: item('created', 'Clase creada'),
    })
    factory.mockReturnValue(connected)
    const user = userEvent.setup()
    render(<CatalogHierarchyScreen createClass={createClass} />)
    await waitFor(() => expect(button('Clase anterior')).toBeVisible())
    await user.click(button('Nueva Clase'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Nueva')
    await user.click(button('Crear Clase'))
    await waitFor(() => expect(connected.listClasses).toHaveBeenCalledTimes(2))
    expect(connected.listClasses).toHaveBeenNthCalledWith(2, {
      cursor: undefined,
    })
    await waitFor(() => expect(screen.getByText('Clase releída')).toBeVisible())
    expect(
      screen.queryByRole('button', { name: 'Clase creada' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Nueva Clase' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Clase “Nueva” creada.',
    )
  })
  it('shows one contextual success notification after explicit parent selection', async () => {
    const user = userEvent.setup()
    const connected = api({
      listClasses: vi
        .fn()
        .mockResolvedValue(page([item('class-1', 'Clase padre')])),
      listFamilies: vi
        .fn()
        .mockResolvedValue(page([item('family-1', 'Familia padre')])),
      listTypes: vi
        .fn()
        .mockResolvedValue(page([item('type-1', 'Tipo padre')])),
      createClass: vi
        .fn()
        .mockResolvedValue({ disposition: 'CREATED', item: {} }),
      createFamily: vi
        .fn()
        .mockResolvedValue({ disposition: 'CREATED', item: {} }),
      createType: vi
        .fn()
        .mockResolvedValue({ disposition: 'CREATED', item: {} }),
    })
    factory.mockReturnValue(connected)
    render(<CatalogHierarchyScreen />)

    await waitFor(() => expect(button('Nueva Clase')).toBeVisible())
    await user.click(button('Nueva Clase'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Clase nueva',
    )
    await user.click(button('Crear Clase'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Clase “Clase nueva” creada.',
      ),
    )

    await user.click(button('Clase padre'))
    await waitFor(() => expect(button('Nueva Familia')).toBeVisible())
    expectAbsent('Nueva Clase', 'Nuevo Tipo')
    await user.click(button('Nueva Familia'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'FA')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Familia nueva',
    )
    await user.click(button('Crear Familia'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Familia “Familia nueva” creada.',
      ),
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)

    await user.click(button('Familia padre'))
    await waitFor(() => expect(button('Nuevo Tipo')).toBeVisible())
    expectAbsent('Nueva Clase', 'Nueva Familia')
    await user.click(button('Nuevo Tipo'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'TY')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Tipo nuevo',
    )
    await user.click(button('Crear Tipo'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Tipo “Tipo nuevo” creado.',
      ),
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('loads Classes once and bypasses the API for static presentation', async () => {
    const connected = api()
    factory.mockReturnValue(connected)
    const view = render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(connected.listClasses).toHaveBeenCalledTimes(1))
    view.unmount()
    factory.mockClear()
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'static', label: 'Presentación' }],
          families: [],
          types: [],
        }}
      />,
    )
    expect(factory).not.toHaveBeenCalled()
    expect(button('Presentación')).toBeVisible()
  })

  it('waits for parents, selects explicitly, and resets without sorting or auto-selection', async () => {
    const connected = api()
    factory.mockReturnValue(connected)
    render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(button('Beta')).toBeVisible())
    expect(screen.getByText('En espera de Clase.')).toBeVisible()
    expect(screen.getByText('En espera de Familia.')).toBeVisible()
    expect(connected.listFamilies).not.toHaveBeenCalled()
    expect(connected.listTypes).not.toHaveBeenCalled()
    expect(button('Beta')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button('Beta'))
    await waitFor(() =>
      expect(connected.listFamilies).toHaveBeenCalledWith({ parentId: 'b' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Familia A' }))
    await waitFor(() =>
      expect(connected.listTypes).toHaveBeenCalledWith({
        parentId: 'family-a',
      }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Tipo A' }))
    expect(screen.getByRole('heading', { name: 'Tipo A' })).toBeVisible()
    fireEvent.click(button('Alpha'))
    expect(
      screen.queryByRole('button', { name: 'Familia A' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Tipo A' }),
    ).not.toBeInTheDocument()
    expect(connected.listFamilies).toHaveBeenCalledWith({ parentId: 'a' })
    expect(connected.listTypes).toHaveBeenCalledTimes(1)
  })

  it('preserves partial rows and exposes explicit continuation and initial retry', async () => {
    const first = api({
      listClasses: vi
        .fn()
        .mockResolvedValueOnce(
          page([item('first', 'Primero')], false, 'opaque'),
        )
        .mockRejectedValueOnce(new Error('continuation'))
        .mockResolvedValueOnce(page([item('second', 'Segundo')])),
    })
    factory.mockReturnValue(first)
    const view = render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(button('Cargar más…')).toBeVisible())
    fireEvent.click(button('Cargar más…'))
    await waitFor(() => expect(button('Reintentar continuación')).toBeVisible())
    expect(button('Primero')).toBeVisible()
    expect(screen.getByText('Listado parcial')).toBeVisible()
    fireEvent.click(button('Reintentar continuación'))
    await waitFor(() => expect(button('Segundo')).toBeVisible())
    view.unmount()

    const failing = api({
      listClasses: vi.fn().mockRejectedValue(new Error('unavailable')),
    })
    factory.mockReturnValue(failing)
    render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(button('Reintentar')).toBeVisible())
    failing.listClasses.mockResolvedValueOnce(page([item('ok', 'Recuperada')]))
    fireEvent.click(button('Reintentar'))
    await waitFor(() => expect(button('Recuperada')).toBeVisible())
  })

  it('drops stale responses, keeps keyboard controls native, and hides raw errors', async () => {
    let resolveA!: (value: ReturnType<typeof page>) => void
    const stale = new Promise<ReturnType<typeof page>>(
      (resolve) => (resolveA = resolve),
    )
    const connected = api({
      listFamilies: vi.fn(({ parentId }: { parentId?: string }) =>
        parentId === 'a'
          ? stale
          : Promise.resolve(page([item('family-b', 'Familia B')])),
      ),
    })
    factory.mockReturnValue(connected)
    render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(button('Alpha')).toBeVisible())
    fireEvent.click(button('Alpha'))
    fireEvent.click(button('Beta'))
    await waitFor(() => expect(button('Familia B')).toBeVisible())
    resolveA(page([item('family-a', 'Familia A')]))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Familia A' }),
      ).not.toBeInTheDocument(),
    )
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    button('Beta').dispatchEvent(arrow)
    expect(arrow.defaultPrevented).toBe(false)
    expect(document.body.textContent).not.toMatch(/Error|unavailable|initial/)
  })

  it('renders one contextual creation action and non-focusable hierarchy chevrons', async () => {
    const connected = api({
      listClasses: vi
        .fn()
        .mockResolvedValue(page([item('class-1', 'Clase 1')])),
      listFamilies: vi
        .fn()
        .mockResolvedValue(page([item('family-1', 'Familia 1')])),
      listTypes: vi.fn().mockResolvedValue(page([item('type-1', 'Tipo 1')])),
      createClass: vi.fn(),
      createFamily: vi.fn(),
      createType: vi.fn(),
    })
    factory.mockReturnValue(connected)
    render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(button('Clase 1')).toBeVisible())
    expect(button('Nueva Clase')).toBeVisible()
    expectAbsent('Nueva Familia', 'Nuevo Tipo')
    const modelBar = screen.getByLabelText('Modelo del catálogo')
    expect(modelBar).toContainElement(button('Nueva Clase'))
    expect(
      document.querySelector('.catalog-hierarchy-header'),
    ).not.toContainElement(button('Nueva Clase'))
    expect(screen.getAllByTestId('catalog-row-chevron')).toHaveLength(1)
    expect(screen.getByTestId('catalog-row-chevron')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    fireEvent.click(button('Clase 1'))
    await waitFor(() => expect(button('Familia 1')).toBeVisible())
    expect(button('Nueva Familia')).toBeVisible()
    expectAbsent('Nueva Clase', 'Nuevo Tipo')
    fireEvent.click(button('Familia 1'))
    await waitFor(() => expect(button('Tipo 1')).toBeVisible())
    expect(button('Nuevo Tipo')).toBeVisible()
    expectAbsent('Nueva Clase', 'Nueva Familia')
  })

  it('uses N to invoke the visible contextual creation action', async () => {
    const connected = api({
      listClasses: vi
        .fn()
        .mockResolvedValue(page([item('class-1', 'Clase 1')])),
      listFamilies: vi
        .fn()
        .mockResolvedValue(page([item('family-1', 'Familia 1')])),
      listTypes: vi.fn().mockResolvedValue(page([item('type-1', 'Tipo 1')])),
      createClass: vi.fn(),
      createFamily: vi.fn(),
      createType: vi.fn(),
    })
    factory.mockReturnValue(connected)
    render(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={vi.fn()}
        onHelp={vi.fn()}
      >
        <CatalogHierarchyScreen />
      </KeyboardControllerProvider>,
    )
    await waitFor(() => expect(button('Clase 1')).toBeVisible())
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Nueva Clase' }), {
      key: 'Escape',
    })
    fireEvent.click(button('Clase 1'))
    await waitFor(() => expect(button('Nueva Familia')).toBeVisible())
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.getByRole('dialog', { name: 'Nueva Familia' })).toBeVisible()
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Nueva Familia' }), {
      key: 'Escape',
    })
    fireEvent.click(button('Familia 1'))
    await waitFor(() => expect(button('Nuevo Tipo')).toBeVisible())
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.getByRole('dialog', { name: 'Nuevo Tipo' })).toBeVisible()
  })
})

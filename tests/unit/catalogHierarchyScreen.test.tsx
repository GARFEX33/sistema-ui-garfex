import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogHierarchyScreen } from '../../src/features/catalog-hierarchy/CatalogHierarchyScreen'
import type { CatalogHierarchyApi } from '../../src/features/catalog-hierarchy/catalogHierarchy.api'
import type { CatalogTypeAttributesApi } from '../../src/features/catalog-hierarchy/catalogTypeAttributes.api'
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
const flushFocusRestoration = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
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
const attributeFactory = vi.hoisted(() => vi.fn())
vi.mock(
  '../../src/features/catalog-hierarchy/catalogHierarchy.api',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    >('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    return { ...actual, createCatalogHierarchyConvexApi: factory }
  },
)

vi.mock(
  '../../src/features/catalog-hierarchy/catalogTypeAttributes.api',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../src/features/catalog-hierarchy/catalogTypeAttributes.api')
    >('../../src/features/catalog-hierarchy/catalogTypeAttributes.api')
    return { ...actual, createCatalogTypeAttributesConvexApi: attributeFactory }
  },
)

describe('CatalogHierarchyScreen connected read wiring', () => {
  it('waits for an explicit Type before loading attributes', async () => {
    const user = userEvent.setup()
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi.fn(),
      getAttributeDefinition: vi.fn(),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{ classes: [], families: [], types: [] }}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Atributos' }))

    expect(
      screen.getByText('Seleccioná un Tipo para consultar sus atributos.'),
    ).toBeVisible()
    expect(attributes.listTypeAssignments).not.toHaveBeenCalled()
  })

  it('eagerly loads the selected Type summary before the Attributes tab is active', async () => {
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi.fn().mockResolvedValue(page([])),
      getAttributeDefinition: vi.fn(),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    await waitFor(() =>
      expect(attributes.listTypeAssignments).toHaveBeenCalledWith({
        tipoRecursoId: 'type-a',
        cursor: undefined,
        mode: 'ALL',
      }),
    )
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByText('Este Tipo no tiene atributos asignados.'),
    ).toBeVisible()
  })

  it('retries a friendly summary error and only confirms an exhausted empty result', async () => {
    const user = userEvent.setup()
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi
        .fn()
        .mockRejectedValueOnce(new Error('private transport detail'))
        .mockRejectedValueOnce(new Error('private transport detail'))
        .mockResolvedValueOnce(page([])),
      getAttributeDefinition: vi.fn(),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el resumen de atributos.',
    )
    expect(document.body.textContent).not.toContain('private transport detail')
    await user.click(button('Reintentar resumen de atributos'))
    expect(
      await screen.findByText('Este Tipo no tiene atributos asignados.'),
    ).toBeVisible()
  })

  it('summarizes only loaded pages as a compact table without capping rows', async () => {
    const assignments = ['a', 'b', 'c', 'd'].map((id, index) => ({
      id: `assignment-${id}`,
      definicionAtributoId: `definition-${id}`,
      tipoRecursoId: index % 2 ? undefined : 'type-a',
      activo: index % 2 === 0,
      effective: index < 2,
      selection: 'SELECTED' as const,
      aplicabilidad: 'OPTIONAL' as const,
      participaIdentidad: false,
      orden: index + 1,
      revision: 1,
      familiaRecursoId: 'family-a',
      effectiveReasons: [],
    }))
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi
        .fn()
        .mockResolvedValue(page(assignments, false, 'next')),
      getAttributeDefinition: vi.fn(async (id) =>
        id === 'definition-b'
          ? null
          : {
              id,
              nombre: `Nombre ${id.at(-1)}`,
              clave: id.toUpperCase(),
              tipoDato: 'TEXTO' as const,
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
      ),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    expect(
      await screen.findByText(
        '4 atributos · 2 heredados · 2 inactivos · vista parcial',
      ),
    ).toBeVisible()
    const table = screen.getByRole('table')
    expect(await screen.findByText('Nombre d')).toBeVisible()
    expect(table).toHaveTextContent('Nombre a')
    expect(table).toHaveTextContent('Definición no disponible.')
    expect(table).toHaveTextContent('Nombre c')
    expect(screen.getAllByRole('row')).toHaveLength(5)
  })

  it('lists all Type attribute assignments with resolved definition and state badges', async () => {
    const user = userEvent.setup()
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi
        .fn()
        .mockResolvedValueOnce(
          page(
            [
              {
                id: 'assignment-direct',
                definicionAtributoId: 'definition-a',
                tipoRecursoId: 'type-a',
                activo: true,
                effective: true,
                selection: 'SELECTED',
                aplicabilidad: 'REQUIRED',
                participaIdentidad: true,
                orden: 1,
                revision: 1,
                familiaRecursoId: 'family-a',
                effectiveReasons: [],
              },
            ],
            false,
            'next',
          ),
        )
        .mockResolvedValueOnce(
          page([
            {
              id: 'assignment-inherited',
              definicionAtributoId: 'definition-b',
              activo: false,
              effective: false,
              selection: 'SUPPRESSED',
              aplicabilidad: 'OPTIONAL',
              participaIdentidad: false,
              orden: 2,
              revision: 1,
              familiaRecursoId: 'family-a',
              effectiveReasons: [],
            },
          ]),
        ),
      getAttributeDefinition: vi.fn(async (id) =>
        id === 'definition-a'
          ? {
              id,
              nombre: 'Código comercial',
              clave: 'CODIGO',
              tipoDato: 'TEXTO',
              descripcion: 'Identificador visible.',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            }
          : {
              id,
              nombre: 'Peso',
              clave: 'PESO',
              tipoDato: 'NUMERO',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
      ),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Atributos' }))

    await waitFor(() =>
      expect(attributes.listTypeAssignments).toHaveBeenCalledWith({
        tipoRecursoId: 'type-a',
        cursor: undefined,
        mode: 'ALL',
      }),
    )
    expect(await screen.findByText('Código comercial')).toBeVisible()
    await user.click(
      screen.getByRole('button', {
        name: 'Mostrar detalle de Código comercial',
      }),
    )
    expect(screen.getByText('Obligatorio')).toBeVisible()
    expect(screen.getByText('Parte de identidad')).toBeVisible()
    expect(screen.queryByText('Heredado')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cargar más atributos…' }),
    ).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Cargar más atributos…' }),
    )

    expect(await screen.findByText('Peso')).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Mostrar detalle de Peso' }),
    )
    expect(screen.getByText('Heredado')).toBeVisible()
    expect(screen.getByText('Inactivo')).toBeVisible()
    expect(screen.getByText('Suprimido')).toBeVisible()
  })

  it('exposes stable, focusable spatial metadata for read-only attribute rows', async () => {
    const user = userEvent.setup()
    const attributes: CatalogTypeAttributesApi = {
      listTypeAssignments: vi.fn().mockResolvedValue(
        page([
          {
            id: 'assignment-a',
            definicionAtributoId: 'definition-a',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'REQUIRED',
            participaIdentidad: false,
            orden: 1,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
        ]),
      ),
      getAttributeDefinition: vi.fn().mockResolvedValue({
        id: 'definition-a',
        nombre: 'Código comercial',
        clave: 'CODIGO',
        tipoDato: 'TEXTO',
        activo: true,
        effective: true,
        effectiveReasons: [],
        revision: 1,
      }),
    }
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Atributos' }))

    const row = (await screen.findByText('Código comercial')).closest('article')
    expect(row).toHaveAttribute('data-catalog-level', 'attributes')
    expect(row).toHaveAttribute(
      'data-spatial-id',
      'catalog.row.attributes.assignment-a',
    )
    expect(row).toHaveAttribute('tabindex', '0')
  })

  it('uses Enter for the primary action (Opciones when OPCION, else edit) and E always edits', async () => {
    const user = userEvent.setup()
    const attributes = {
      listTypeAssignments: vi.fn().mockResolvedValue(
        page([
          {
            id: 'assignment-option',
            definicionAtributoId: 'definition-option',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 1,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
          {
            id: 'assignment-text',
            definicionAtributoId: 'definition-text',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 2,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
        ]),
      ),
      getAttributeDefinition: vi.fn(async (id) => ({
        id,
        nombre: id === 'definition-option' ? 'Color' : 'Descripción',
        clave: id === 'definition-option' ? 'COLOR' : 'DESCRIPCION',
        tipoDato: id === 'definition-option' ? 'OPCION' : 'TEXTO',
        activo: true,
        effective: true,
        effectiveReasons: [],
        revision: 1,
      })),
      listAttributeOptions: vi.fn().mockResolvedValue(page([])),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    render(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={vi.fn()}
        onHelp={vi.fn()}
      >
        <CatalogHierarchyScreen
          presentation={{
            classes: [{ id: 'class-a', label: 'Clase A' }],
            families: [{ id: 'family-a', label: 'Familia A' }],
            types: [{ id: 'type-a', label: 'Tipo A' }],
            selectedClassId: 'class-a',
            selectedFamilyId: 'family-a',
            selectedTypeId: 'type-a',
          }}
        />
      </KeyboardControllerProvider>,
    )
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    const optionRow = (await screen.findByText('Color')).closest('article')!
    const textRow = screen.getByText('Descripción').closest('article')!

    optionRow.focus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('dialog', { name: 'Opciones de Color' }),
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(optionRow).toHaveFocus())
    await flushFocusRestoration()

    optionRow.focus()
    await user.keyboard('e')
    expect(
      screen.getByRole('dialog', { name: 'Editar atributo' }),
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(optionRow).toHaveFocus())
    await flushFocusRestoration()

    optionRow.focus()
    await user.keyboard('o')
    expect(
      screen.getByRole('dialog', { name: 'Opciones de Color' }),
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(optionRow).toHaveFocus())
    await flushFocusRestoration()

    textRow.focus()
    await user.keyboard('o')
    expect(
      screen.queryByRole('dialog', { name: /Opciones de/ }),
    ).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('dialog', { name: 'Editar atributo' }),
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(textRow).toHaveFocus())
    await flushFocusRestoration()

    textRow.focus()
    await user.keyboard('e')
    expect(
      screen.getByRole('dialog', { name: 'Editar atributo' }),
    ).toBeVisible()
  })

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

  it('switches the visible action and N command to attribute assignment only on the active Attributes tab', async () => {
    const user = userEvent.setup()
    const attributes = {
      listTypeAssignments: vi.fn().mockResolvedValue(page([])),
      getAttributeDefinition: vi.fn(),
      listAttributeDefinitions: vi.fn().mockResolvedValue(
        page([
          {
            id: 'definition-a',
            nombre: 'Material',
            clave: 'MATERIAL',
            tipoDato: 'TEXTO',
            activo: true,
            effective: true,
            effectiveReasons: [],
            revision: 1,
          },
        ]),
      ),
      createTypeAttributeAssignment: vi
        .fn()
        .mockResolvedValue({ disposition: 'CREATED' }),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    render(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={vi.fn()}
        onHelp={vi.fn()}
      >
        <CatalogHierarchyScreen
          presentation={{
            classes: [{ id: 'class-a', label: 'Clase A' }],
            families: [{ id: 'family-a', label: 'Familia A' }],
            types: [{ id: 'type-a', label: 'Tipo A' }],
            selectedClassId: 'class-a',
            selectedFamilyId: 'family-a',
            selectedTypeId: 'type-a',
          }}
          createType={vi.fn()}
        />
      </KeyboardControllerProvider>,
    )

    expect(button('Nuevo Tipo')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    expect(
      await screen.findByRole('button', { name: 'Asignar atributo' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Nuevo Tipo' }),
    ).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'n' })
    expect(
      screen.getByRole('dialog', { name: 'Asignar atributo' }),
    ).toBeVisible()
    await user.click(await screen.findByRole('button', { name: /Material/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar asignación' }))
    await waitFor(() =>
      expect(attributes.listTypeAssignments).toHaveBeenCalledTimes(2),
    )
    expect(attributes.listTypeAssignments).toHaveBeenNthCalledWith(2, {
      cursor: undefined,
      mode: 'ALL',
      tipoRecursoId: 'type-a',
    })
  })

  it('edits only loaded global definitions and refreshes the Attributes card after an unchanged update', async () => {
    const user = userEvent.setup()
    const color = {
      id: 'definition-color',
      nombre: 'Color',
      clave: 'ACR',
      tipoDato: 'OPCION' as const,
      activo: false,
      effective: false,
      effectiveReasons: ['INACTIVE'],
      revision: 1,
    }
    let releaseDefinition!: (value: typeof color) => void
    const firstDefinition = new Promise<typeof color>((resolve) => {
      releaseDefinition = resolve
    })
    const attributes = {
      listTypeAssignments: vi.fn().mockResolvedValue(
        page([
          {
            id: 'assignment-color',
            definicionAtributoId: 'definition-color',
            tipoRecursoId: 'type-a',
            activo: false,
            effective: false,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 1,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: ['INACTIVE'],
          },
        ]),
      ),
      getAttributeDefinition: vi
        .fn()
        .mockReturnValueOnce(firstDefinition)
        .mockResolvedValueOnce(color),
      updateAttributeDefinition: vi.fn().mockResolvedValue({
        disposition: 'UNCHANGED',
        item: color,
      }),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    await waitFor(() =>
      expect(attributes.getAttributeDefinition).toHaveBeenCalledTimes(1),
    )
    expect(
      screen.queryByRole('button', { name: 'Editar atributo' }),
    ).not.toBeInTheDocument()
    releaseDefinition(color)
    const trigger = await screen.findByRole('button', {
      name: 'Editar atributo',
    })
    await user.click(trigger)
    await user.clear(screen.getByRole('textbox', { name: 'Nombre' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Color comercial',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(attributes.updateAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'definition-color',
        expectedRevision: 1,
        nombre: 'Color comercial',
      }),
    )
    await waitFor(() =>
      expect(attributes.getAttributeDefinition).toHaveBeenCalledTimes(2),
    )
    expect(await screen.findByText('ACR · Opción')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Atributo “Color” actualizado.',
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('shows loading, safe retry errors, and an exhausted no-active option preview', async () => {
    const user = userEvent.setup()
    let rejectOptions!: (cause: Error) => void
    const attributes = {
      listTypeAssignments: vi.fn().mockResolvedValue(
        page([
          {
            id: 'assignment-color',
            definicionAtributoId: 'definition-color',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 1,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
        ]),
      ),
      getAttributeDefinition: vi.fn().mockResolvedValue({
        id: 'definition-color',
        nombre: 'Color',
        clave: 'COLOR',
        tipoDato: 'OPCION',
        activo: true,
        effective: true,
        effectiveReasons: [],
        revision: 1,
      }),
      listAttributeOptions: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              rejectOptions = reject
            }),
        )
        .mockResolvedValueOnce(
          page([
            {
              id: 'gray',
              definicionAtributoId: 'definition-color',
              clave: 'GRIS',
              nombre: 'Gris',
              activo: false,
              effective: false,
              effectiveReasons: ['INACTIVE'],
              revision: 1,
            },
          ]),
        ),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Mostrar detalle de Color',
      }),
    )
    const preview = await screen.findByRole('region', {
      name: 'Vista previa de opciones de Color',
    })
    expect(preview).toHaveTextContent('Cargando opciones…')
    rejectOptions(new Error('private transport detail'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones',
    )
    expect(document.body.textContent).not.toContain('private transport detail')
    await user.click(
      screen.getByRole('button', { name: 'Reintentar opciones' }),
    )
    expect(await screen.findByText('Sin opciones activas')).toBeVisible()
    expect(preview).toHaveTextContent('0 activas · 1 inactiva')
  })

  it('discards a stale option preview after the selected Type changes', async () => {
    const user = userEvent.setup()
    let resolveOptions!: (value: ReturnType<typeof page>) => void
    const staleOptions = new Promise<ReturnType<typeof page>>((resolve) => {
      resolveOptions = resolve
    })
    const attributes = {
      listTypeAssignments: vi.fn(({ tipoRecursoId }) =>
        Promise.resolve(
          page(
            tipoRecursoId === 'type-a'
              ? [
                  {
                    id: 'assignment-color',
                    definicionAtributoId: 'definition-color',
                    tipoRecursoId: 'type-a',
                    activo: true,
                    effective: true,
                    selection: 'SELECTED',
                    aplicabilidad: 'OPTIONAL',
                    participaIdentidad: false,
                    orden: 1,
                    revision: 1,
                    familiaRecursoId: 'family-a',
                    effectiveReasons: [],
                  },
                ]
              : [],
          ),
        ),
      ),
      getAttributeDefinition: vi.fn().mockResolvedValue({
        id: 'definition-color',
        nombre: 'Color',
        clave: 'COLOR',
        tipoDato: 'OPCION',
        activo: true,
        effective: true,
        effectiveReasons: [],
        revision: 1,
      }),
      listAttributeOptions: vi.fn().mockReturnValue(staleOptions),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    const presentation = (selectedTypeId: string) => ({
      classes: [{ id: 'class-a', label: 'Clase A' }],
      families: [{ id: 'family-a', label: 'Familia A' }],
      types: [
        { id: 'type-a', label: 'Tipo A' },
        { id: 'type-b', label: 'Tipo B' },
      ],
      selectedClassId: 'class-a',
      selectedFamilyId: 'family-a',
      selectedTypeId,
    })
    const view = render(
      <CatalogHierarchyScreen presentation={presentation('type-a')} />,
    )
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    await waitFor(() =>
      expect(attributes.listAttributeOptions).toHaveBeenCalledTimes(1),
    )
    view.rerender(
      <CatalogHierarchyScreen presentation={presentation('type-b')} />,
    )
    await waitFor(() =>
      expect(attributes.listTypeAssignments).toHaveBeenCalledWith({
        tipoRecursoId: 'type-b',
        cursor: undefined,
        mode: 'ALL',
      }),
    )
    resolveOptions(
      page([
        {
          id: 'white',
          definicionAtributoId: 'definition-color',
          clave: 'BLANCO',
          nombre: 'Blanco',
          activo: true,
          effective: true,
          effectiveReasons: [],
          revision: 1,
        },
      ]),
    )
    await waitFor(() =>
      expect(screen.queryByText('Color')).not.toBeInTheDocument(),
    )
    expect(screen.queryByText('Blanco')).not.toBeInTheDocument()
  })

  it('previews each ready OPCION definition once with active chips and authoritative partial counts', async () => {
    const user = userEvent.setup()
    const attributes = {
      listTypeAssignments: vi.fn().mockResolvedValue(
        page([
          {
            id: 'assignment-color-direct',
            definicionAtributoId: 'definition-color',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 1,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
          {
            id: 'assignment-color-inherited',
            definicionAtributoId: 'definition-color',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 2,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
          {
            id: 'assignment-text',
            definicionAtributoId: 'definition-text',
            tipoRecursoId: 'type-a',
            activo: true,
            effective: true,
            selection: 'SELECTED',
            aplicabilidad: 'OPTIONAL',
            participaIdentidad: false,
            orden: 3,
            revision: 1,
            familiaRecursoId: 'family-a',
            effectiveReasons: [],
          },
        ]),
      ),
      getAttributeDefinition: vi.fn(async (id) => ({
        id,
        nombre: id === 'definition-color' ? 'Color' : 'Descripción',
        clave: id === 'definition-color' ? 'COLOR' : 'DESCRIPCION',
        tipoDato: id === 'definition-color' ? 'OPCION' : 'TEXTO',
        activo: true,
        effective: true,
        effectiveReasons: [],
        revision: 1,
      })),
      listAttributeOptions: vi.fn().mockResolvedValue(
        page(
          [
            {
              id: 'white',
              definicionAtributoId: 'definition-color',
              clave: 'BLANCO',
              nombre: 'Blanco',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
            {
              id: 'black',
              definicionAtributoId: 'definition-color',
              clave: 'NEGRO',
              nombre: 'Negro',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
            {
              id: 'red',
              definicionAtributoId: 'definition-color',
              clave: 'ROJO',
              nombre: 'Rojo',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
            {
              id: 'blue',
              definicionAtributoId: 'definition-color',
              clave: 'AZUL',
              nombre: 'Azul',
              activo: true,
              effective: true,
              effectiveReasons: [],
              revision: 1,
            },
            {
              id: 'inactive',
              definicionAtributoId: 'definition-color',
              clave: 'GRIS',
              nombre: 'Gris',
              activo: false,
              effective: false,
              effectiveReasons: ['INACTIVE'],
              revision: 1,
            },
          ],
          false,
          'next',
        ),
      ),
    } as unknown as CatalogTypeAttributesApi
    attributeFactory.mockReturnValue(attributes)
    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'class-a', label: 'Clase A' }],
          families: [{ id: 'family-a', label: 'Familia A' }],
          types: [{ id: 'type-a', label: 'Tipo A' }],
          selectedClassId: 'class-a',
          selectedFamilyId: 'family-a',
          selectedTypeId: 'type-a',
        }}
      />,
    )
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))
    await waitFor(() =>
      expect(attributes.listAttributeOptions).toHaveBeenCalledTimes(1),
    )
    expect(attributes.listAttributeOptions).toHaveBeenCalledWith({
      definicionAtributoId: 'definition-color',
      mode: 'ALL',
      pageSize: 50,
      cursor: null,
    })
    const [firstChevron, secondChevron] = await waitFor(() => {
      const buttons = screen.getAllByRole('button', {
        name: 'Mostrar detalle de Color',
      })
      expect(buttons).toHaveLength(2)
      return buttons
    })

    await user.click(firstChevron)
    const [preview] = await screen.findAllByRole('region', {
      name: 'Vista previa de opciones de Color',
    })
    expect(preview).toHaveTextContent('Blanco')
    expect(preview).toHaveTextContent('Negro')
    expect(preview).toHaveTextContent('Rojo')
    expect(preview).not.toHaveTextContent('Azul')
    expect(preview).not.toHaveTextContent('Gris')
    expect(preview).toHaveTextContent(
      'Al menos 4 activas · al menos 1 inactiva',
    )
    expect(preview.querySelectorAll('[tabindex]')).toHaveLength(0)

    await user.click(secondChevron)
    const [secondPreview] = await screen.findAllByRole('region', {
      name: 'Vista previa de opciones de Color',
    })
    expect(secondPreview).toHaveTextContent('Blanco')
    expect(attributes.listAttributeOptions).toHaveBeenCalledTimes(1)
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

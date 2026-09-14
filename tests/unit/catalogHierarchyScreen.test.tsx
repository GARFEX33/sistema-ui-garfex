import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogHierarchyScreen } from '../../src/features/catalog-hierarchy/CatalogHierarchyScreen'
import type {
  CatalogHierarchyApi,
  CatalogHierarchyRestApi,
} from '../../src/features/catalog-hierarchy/catalogHierarchy.api'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const hierarchyFactory = vi.hoisted(() => vi.fn())
const restFactory = vi.hoisted(() => vi.fn())
const effectiveAttributesFactory = vi.hoisted(() => vi.fn())
const effectiveAttributesHook = vi.hoisted(() => vi.fn())

vi.mock(
  '../../src/features/catalog-hierarchy/catalogHierarchy.api',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    >('../../src/features/catalog-hierarchy/catalogHierarchy.api')
    return {
      ...actual,
      createCatalogHierarchyConvexApi: hierarchyFactory,
      createCatalogHierarchyRestApi: restFactory,
    }
  },
)
vi.mock(
  '../../src/features/catalog-hierarchy/catalogTypeEffectiveAttributes.api',
  () => ({
    createCatalogTypeEffectiveAttributesApi: effectiveAttributesFactory,
  }),
)
vi.mock(
  '../../src/features/catalog-hierarchy/useCatalogTypeEffectiveAttributes',
  () => ({ useCatalogTypeEffectiveAttributes: effectiveAttributesHook }),
)

const item = (id: string, clave: string, nombre: string) => ({
  activo: true,
  clave,
  id,
  nombre,
  revision: '1',
})
const page = <T,>(items: T[], hasNext = false, hasPrevious = false) => ({
  items,
  hasNext,
  hasPrevious,
})
const button = (name: string) => screen.getByRole('button', { name })
const expectAbsent = (...names: string[]) =>
  names.forEach((name) =>
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument(),
  )

const effectiveAttributes = [
  {
    characteristic: {
      code: 'COLOR',
      name: 'Color',
      valueType: 'CONTROLLED_OPTION' as const,
    },
    effectiveMode: 'REQUIRED' as const,
    identityParticipates: false,
    notApplicable: false,
    position: 1,
    hasPosition: true,
    options: [],
    source: { level: 'TYPE' as const, code: 'TOR' },
    rules: [],
  },
]

const rest = (
  overrides: Partial<CatalogHierarchyRestApi> = {},
): CatalogHierarchyRestApi => ({
  createClass: vi.fn(),
  listClasses: vi
    .fn()
    .mockResolvedValue(page([item('class-1', 'MAT', 'Material')])),
  listFamilies: vi
    .fn()
    .mockResolvedValue(
      page([{ ...item('family-1', 'FER', 'Ferretería'), classCode: 'MAT' }]),
    ),
  listTypes: vi.fn().mockResolvedValue(
    page([
      {
        ...item('type-1', 'TOR', 'Tornillo'),
        classCode: 'MAT',
        familyCode: 'FER',
      },
    ]),
  ),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  hierarchyFactory.mockReturnValue({} as CatalogHierarchyApi)
  restFactory.mockReturnValue(rest())
  effectiveAttributesFactory.mockReturnValue({})
  effectiveAttributesHook.mockReturnValue({
    status: 'ready',
    attributes: effectiveAttributes,
    retry: vi.fn(),
  })
})

async function selectConnectedType() {
  const user = userEvent.setup()
  render(<CatalogHierarchyScreen />)
  await user.click(await screen.findByRole('button', { name: 'Material' }))
  await user.click(await screen.findByRole('button', { name: 'Ferretería' }))
  await user.click(await screen.findByRole('button', { name: 'Tornillo' }))
  return user
}

describe('CatalogHierarchyScreen effective attributes wiring', () => {
  it('passes the selected REST codes only to the effective attributes hook', async () => {
    const user = await selectConnectedType()

    await waitFor(() =>
      expect(effectiveAttributesHook).toHaveBeenLastCalledWith(
        {},
        { classCode: 'MAT', familyCode: 'FER', typeCode: 'TOR' },
      ),
    )
    await user.click(screen.getByRole('tab', { name: 'Atributos' }))

    expect(effectiveAttributesFactory).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('heading', { name: 'Atributos efectivos del Tipo' }),
    ).toBeVisible()
    expect(screen.getByText('Color')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Asignar atributo' }),
    ).toBeNull()
  })

  it('preserves tabs and leaves attribute mutations unavailable to keyboard actions', async () => {
    const user = userEvent.setup()
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

    const attributesTab = screen.getByRole('tab', { name: 'Atributos' })
    await user.click(attributesTab)
    expect(attributesTab).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('neo')
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.keyboard('{Escape}')
    expect(attributesTab).toHaveFocus()
  })
})

describe('CatalogHierarchyScreen retained hierarchy regressions', () => {
  it('refetches the active Classes window after a created class without selecting it', async () => {
    const listClasses = vi
      .fn()
      .mockResolvedValueOnce(page([item('old', 'OLD', 'Clase anterior')]))
      .mockResolvedValueOnce(page([item('new', 'NEW', 'Clase releída')]))
    restFactory.mockReturnValue(rest({ listClasses }))
    const createClass = vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: item('created', 'NEW', 'Clase creada'),
    })
    const user = userEvent.setup()
    render(<CatalogHierarchyScreen createClass={createClass} />)

    await screen.findByRole('button', { name: 'Clase anterior' })
    await user.click(button('Nueva Clase'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Nueva')
    await user.type(screen.getByRole('textbox', { name: 'Plural' }), 'Nuevas')
    await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'nueva')
    await user.click(button('Crear Clase'))

    await waitFor(() => expect(listClasses).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByRole('button', { name: 'Clase releída' }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Clase creada' })).toBeNull()
    expect(screen.queryByRole('dialog', { name: 'Nueva Clase' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Clase “Nueva” creada.',
    )
  })

  it('keeps one contextual creation CTA and notification across class, family, and type', async () => {
    const createClass = vi
      .fn()
      .mockResolvedValue({ disposition: 'CREATED', item: {} })
    const createFamily = vi
      .fn()
      .mockResolvedValue({ disposition: 'CREATED', item: {} })
    const createType = vi
      .fn()
      .mockResolvedValue({ disposition: 'CREATED', item: {} })
    const user = userEvent.setup()
    render(
      <CatalogHierarchyScreen
        createClass={createClass}
        createFamily={createFamily}
        createType={createType}
      />,
    )

    expect(button('Nueva Clase')).toBeVisible()
    await user.click(button('Nueva Clase'))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Clase nueva',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Plural' }),
      'Clases nuevas',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Slug' }),
      'clase-nueva',
    )
    await user.click(button('Crear Clase'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Clase “Clase nueva” creada.',
      ),
    )

    await user.click(await screen.findByRole('button', { name: 'Material' }))
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

    await user.click(await screen.findByRole('button', { name: 'Ferretería' }))
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

  it('loads Classes once and bypasses hierarchy APIs for static presentation', async () => {
    const classApi = rest()
    restFactory.mockReturnValue(classApi)
    const view = render(<CatalogHierarchyScreen />)
    await waitFor(() => expect(classApi.listClasses).toHaveBeenCalledTimes(1))
    view.unmount()
    restFactory.mockClear()
    hierarchyFactory.mockClear()

    render(
      <CatalogHierarchyScreen
        presentation={{
          classes: [{ id: 'static', label: 'Presentación' }],
          families: [],
          types: [],
        }}
      />,
    )
    expect(restFactory).not.toHaveBeenCalled()
    expect(hierarchyFactory).not.toHaveBeenCalled()
    expect(button('Presentación')).toBeVisible()
  })

  it('uses selected parent codes for REST descendants and resets children explicitly', async () => {
    const api = rest({
      listClasses: vi
        .fn()
        .mockResolvedValue(
          page([item('a', 'A', 'Alpha'), item('b', 'B', 'Beta')]),
        ),
      listFamilies: vi.fn(({ classCode }) =>
        Promise.resolve(
          page([
            {
              ...item(
                `family-${classCode}`,
                `F-${classCode}`,
                `Familia ${classCode}`,
              ),
              classCode,
            },
          ]),
        ),
      ),
      listTypes: vi.fn(({ familyCode }) =>
        Promise.resolve(
          page([
            {
              ...item(
                `type-${familyCode}`,
                `T-${familyCode}`,
                `Tipo ${familyCode}`,
              ),
              familyCode,
            },
          ]),
        ),
      ),
    })
    restFactory.mockReturnValue(api)
    const user = userEvent.setup()
    render(<CatalogHierarchyScreen />)

    await user.click(await screen.findByRole('button', { name: 'Alpha' }))
    await waitFor(() =>
      expect(api.listFamilies).toHaveBeenLastCalledWith({
        classCode: 'A',
        limit: 20,
        offset: 0,
        scope: 'ALL',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'Familia A' }))
    await waitFor(() =>
      expect(api.listTypes).toHaveBeenLastCalledWith({
        classCode: 'A',
        familyCode: 'F-A',
        limit: 20,
        offset: 0,
        scope: 'ALL',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'Tipo F-A' }))
    expect(screen.getByRole('heading', { name: 'Tipo F-A' })).toBeVisible()

    await user.click(button('Beta'))
    await waitFor(() => expect(button('Familia B')).toBeVisible())
    expect(screen.queryByRole('button', { name: 'Tipo F-A' })).toBeNull()
    expect(screen.getByText('En espera de Familia.')).toBeVisible()
  })

  it('replaces the Classes window from server flags and retains retry controls', async () => {
    const listClasses = vi.fn(({ offset }: { offset: number }) => {
      if (offset === 0)
        return Promise.resolve(page([item('first', 'FIRST', 'Primero')], true))
      if (offset === 20)
        return Promise.resolve(
          page([item('second', 'SECOND', 'Segundo')], false, true),
        )
      return Promise.resolve(page([item('first', 'FIRST', 'Primero')], true))
    })
    restFactory.mockReturnValue(rest({ listClasses }))
    const user = userEvent.setup()
    render(<CatalogHierarchyScreen />)

    await user.click(
      await screen.findByRole('button', { name: 'Siguiente ventana' }),
    )
    expect(await screen.findByRole('button', { name: 'Segundo' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Primero' })).toBeNull()
    await user.click(button('Ventana anterior'))
    expect(await screen.findByRole('button', { name: 'Primero' })).toBeVisible()
  })

  it('keeps the initial Class retry available after a failed REST window', async () => {
    const listClasses = vi
      .fn()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce(
        page([item('recovered', 'RECOVERED', 'Recuperada')]),
      )
    restFactory.mockReturnValue(rest({ listClasses }))
    const user = userEvent.setup()
    render(<CatalogHierarchyScreen />)

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('button', { name: 'Recuperada' }),
    ).toBeVisible()
    expect(listClasses).toHaveBeenCalledTimes(2)
  })

  it('drops stale dependent responses and leaves native arrows unclaimed', async () => {
    let resolveAlpha!: (value: ReturnType<typeof page>) => void
    const alpha = new Promise<ReturnType<typeof page>>((resolve) => {
      resolveAlpha = resolve
    })
    const api = rest({
      listClasses: vi
        .fn()
        .mockResolvedValue(
          page([item('a', 'A', 'Alpha'), item('b', 'B', 'Beta')]),
        ),
      listFamilies: vi.fn(({ classCode }) =>
        classCode === 'A'
          ? alpha
          : Promise.resolve(
              page([
                { ...item('family-b', 'FB', 'Familia B'), classCode: 'B' },
              ]),
            ),
      ),
    })
    restFactory.mockReturnValue(api)
    render(<CatalogHierarchyScreen />)

    await waitFor(() => expect(button('Alpha')).toBeVisible())
    fireEvent.click(button('Alpha'))
    fireEvent.click(button('Beta'))
    await waitFor(() => expect(button('Familia B')).toBeVisible())
    resolveAlpha(
      page([{ ...item('family-a', 'FA', 'Familia A'), classCode: 'A' }]),
    )
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Familia A' })).toBeNull(),
    )
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    button('Beta').dispatchEvent(arrow)
    expect(arrow.defaultPrevented).toBe(false)
  })

  it('keeps contextual CTA chrome and hierarchy chevrons while changing selection level', async () => {
    const user = userEvent.setup()
    render(
      <CatalogHierarchyScreen
        createClass={vi.fn()}
        createFamily={vi.fn()}
        createType={vi.fn()}
      />,
    )

    await screen.findByRole('button', { name: 'Material' })
    expect(button('Nueva Clase')).toBeVisible()
    expect(screen.getByLabelText('Modelo del catálogo')).toBeVisible()
    expect(screen.getByTestId('catalog-row-chevron')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    await user.click(button('Material'))
    await waitFor(() => expect(button('Nueva Familia')).toBeVisible())
    await user.click(await screen.findByRole('button', { name: 'Ferretería' }))
    await waitFor(() => expect(button('Nuevo Tipo')).toBeVisible())
  })

  it('uses N for each visible hierarchy creation action and preserves Escape closing', async () => {
    const user = userEvent.setup()
    render(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={vi.fn()}
        onHelp={vi.fn()}
      >
        <CatalogHierarchyScreen
          createClass={vi.fn()}
          createFamily={vi.fn()}
          createType={vi.fn()}
        />
      </KeyboardControllerProvider>,
    )

    await screen.findByRole('button', { name: 'Material' })
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
    await user.keyboard('{Escape}')
    await user.click(button('Material'))
    await waitFor(() => expect(button('Nueva Familia')).toBeVisible())
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: 'Nueva Familia' })).toBeVisible()
    await user.keyboard('{Escape}')
    await user.click(await screen.findByRole('button', { name: 'Ferretería' }))
    await waitFor(() => expect(button('Nuevo Tipo')).toBeVisible())
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: 'Nuevo Tipo' })).toBeVisible()
  })
})

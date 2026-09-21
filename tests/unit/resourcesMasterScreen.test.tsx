import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResourcesMasterScreen } from '../../src/features/resources-master/ResourcesMasterScreen'

const factory = vi.hoisted(() => vi.fn())
const hierarchyHook = vi.hoisted(() => vi.fn())
const restWindowHook = vi.hoisted(() => vi.fn())
const presentationNamesHook = vi.hoisted(() => vi.fn())
const creationSurfaceProps = vi.hoisted(() => vi.fn())

vi.mock('../../src/features/resources-master/resourcesMaster.api', () => ({
  createResourcesMasterRestApi: factory,
}))
vi.mock('../../src/features/resources-master/useResourcesHierarchy', () => ({
  useResourcesHierarchy: hierarchyHook,
}))
vi.mock(
  '../../src/features/resources-master/useResourcesMasterRestWindow',
  () => ({
    useResourcesMasterRestWindow: restWindowHook,
  }),
)
vi.mock(
  '../../src/features/resources-master/useResourcePresentationNames',
  () => ({
    useResourcePresentationNames: presentationNamesHook,
  }),
)
vi.mock('../../src/features/resources-master/CrearRecursoSurface', () => ({
  CrearRecursoSurface: (props: { onSuccess?: (message: string) => void }) => {
    creationSurfaceProps(props)
    return (
      <button
        type="button"
        onClick={() => props.onSuccess?.('Recurso de tipo "Tuberías" creado.')}
      >
        Nuevo recurso
      </button>
    )
  },
}))

const api = { rest: true }
const windowState = {
  status: 'ready' as const,
  items: [] as unknown[],
  offset: 0,
  hasPrevious: false,
  hasNext: false,
}

type HierarchySelection = {
  classId?: string
  familyId?: string
  typeId?: string
}

const hierarchy = (
  selection: HierarchySelection = {},
  overrides: {
    classes?: readonly { id: string; code: string; name: string }[]
    families?: readonly { id: string; code: string; name: string }[]
    types?: readonly { id: string; code: string; name: string }[]
    classesStatus?: 'ready' | 'waiting-for-parent' | 'empty' | 'error'
    familiesStatus?: 'ready' | 'waiting-for-parent' | 'empty' | 'error'
    typesStatus?: 'ready' | 'waiting-for-parent' | 'empty' | 'error'
  } = {},
) => ({
  selection,
  classes: {
    ...windowState,
    status: overrides.classesStatus ?? 'ready',
    items: overrides.classes ?? [
      {
        id: 'class-1',
        code: 'MATERIAL',
        name: 'Material',
        active: true,
        revision: '1',
      },
    ],
  },
  families: {
    ...windowState,
    status: overrides.familiesStatus ?? 'ready',
    items: overrides.families ?? [
      {
        id: 'family-1',
        code: 'CABLE',
        name: 'Cable',
        classCode: 'MATERIAL',
        active: true,
        revision: '2',
      },
    ],
  },
  types: {
    ...windowState,
    status: overrides.typesStatus ?? 'ready',
    items: overrides.types ?? [
      {
        id: 'type-1',
        code: 'UTP',
        name: 'UTP',
        classCode: 'MATERIAL',
        familyCode: 'CABLE',
        active: true,
        revision: '3',
      },
    ],
  },
  selectClass: vi.fn(),
  selectFamily: vi.fn(),
  selectType: vi.fn(),
  retryClasses: vi.fn(),
  retryFamilies: vi.fn(),
  retryTypes: vi.fn(),
})

const resource = (overrides: Record<string, unknown> = {}) => ({
  id: 'resource-1',
  identityV1: 'MATERIAL-CABLE-UTP-001',
  scope: { classCode: 'MATERIAL', familyCode: 'CABLE', typeCode: 'UTP' },
  naturalUnit: 'm',
  active: true,
  revision: '7',
  attributes: [{ code: 'COLOR', value: { kind: 'TEXT', value: 'Negro' } }],
  ...overrides,
})

const restWindow = (overrides: Record<string, unknown> = {}) => ({
  resources: [resource()],
  status: 'ready',
  hasPrevious: true,
  hasNext: true,
  previous: vi.fn(),
  next: vi.fn(),
  retry: vi.fn(),
  refetchActive: vi.fn(),
  ...overrides,
})

const renderScreen = (ui: ReactElement) => render(ui)

afterEach(() => {
  factory.mockReset()
  hierarchyHook.mockReset()
  restWindowHook.mockReset()
  presentationNamesHook.mockReset()
  creationSurfaceProps.mockReset()
})

describe('ResourcesMasterScreen REST read wiring', () => {
  it('creates only the REST API and supplies the active REST window with hierarchy codes, never sending search text', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(factory).toHaveBeenCalledOnce()
    expect(hierarchyHook).toHaveBeenCalledWith(api)
    expect(restWindowHook).toHaveBeenCalledWith(api, {
      text: '',
      scope: 'ACTIVE',
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'UTP',
      limit: 20,
    })
  })

  it('uses one replacement REST window with previous and next controls', async () => {
    const state = restWindow()
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(state)
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Anterior recursos' }))
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Siguiente recursos' }))

    expect(state.previous).toHaveBeenCalledOnce()
    expect(state.next).toHaveBeenCalledOnce()
  })

  it('preserves loading, empty, error, retry, and the direct pending Creator', async () => {
    const state = restWindow({ resources: [], status: 'initial-error' })
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(state)
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los recursos.',
    )
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(state.retry).toHaveBeenCalledOnce()
    expect(creationSurfaceProps).toHaveBeenLastCalledWith({
      api,
      onSuccess: expect.any(Function),
    })
  })

  it('wires CrearRecursoSurface.onSuccess to a toast built with useAutoClosingMessage', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Nuevo recurso' }))

    const toast = await screen.findByRole('status')
    expect(toast).toHaveTextContent('Recurso de tipo "Tuberías" creado.')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  it('refetches the active REST window when a resource is created, so it shows up without a manual reload', async () => {
    const state = restWindow()
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(state)
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Nuevo recurso' }))

    expect(state.refetchActive).toHaveBeenCalledOnce()
  })
})

describe('ResourcesMasterScreen presentation name row (Slice D2)', () => {
  it('shows the resolved presentation name and Clase · Familia · Tipo secondary line, never identityV1 or raw JSON', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({
      'resource-1': {
        status: 'ready',
        name: 'Cable UTP Negro',
        searchableValues: ['Negro'],
      },
    })

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('Cable UTP Negro')).toBeVisible()
    expect(screen.getByText('MATERIAL · CABLE · UTP')).toBeVisible()
    expect(screen.getByText('m')).toBeVisible()
    expect(screen.queryByText('MATERIAL-CABLE-UTP-001')).not.toBeInTheDocument()
    expect(screen.queryByText(/"kind":"TEXT"/)).not.toBeInTheDocument()
    expect(screen.queryByText(/COLOR:/)).not.toBeInTheDocument()
  })

  it('shows a muted loading placeholder for a row while its presentation name resolves, never identityV1', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({
      'resource-1': { status: 'loading', searchableValues: [] },
    })

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('Cargando…')).toBeVisible()
    expect(screen.queryByText('MATERIAL-CABLE-UTP-001')).not.toBeInTheDocument()
  })

  it('shows a neutral fallback for a row whose presentation name failed to resolve, never identityV1', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({
      'resource-1': {
        status: 'error',
        error: new Error('boom'),
        searchableValues: [],
      },
    })

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('Nombre no disponible')).toBeVisible()
    expect(screen.queryByText('MATERIAL-CABLE-UTP-001')).not.toBeInTheDocument()
  })
})

describe('ResourcesMasterScreen search refinement (Slice D2)', () => {
  const twoResources = () => [
    resource({
      id: 'resource-1',
      attributes: [{ code: 'COLOR', value: { kind: 'TEXT', value: 'Negro' } }],
    }),
    resource({
      id: 'resource-2',
      identityV1: 'MATERIAL-CABLE-UTP-002',
      attributes: [{ code: 'DIAMETRO', value: { kind: 'TEXT', value: '2mm' } }],
    }),
  ]

  const presentations = () => ({
    'resource-1': {
      status: 'ready' as const,
      name: 'Cable UTP Negro',
      searchableValues: ['Negro'],
    },
    'resource-2': {
      status: 'ready' as const,
      name: 'Cable UTP Blanco',
      searchableValues: ['2mm'],
    },
  })

  it('filters to the resource whose presentation name matches the typed search text', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow({ resources: twoResources() }))
    presentationNamesHook.mockReturnValue(presentations())

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    await userEvent.setup().type(screen.getByLabelText('Buscar'), 'negro')

    expect(screen.getByText('Cable UTP Negro')).toBeVisible()
    expect(screen.queryByText('Cable UTP Blanco')).not.toBeInTheDocument()
  })

  it('filters to the resource whose attribute value matches, even when absent from its presentation name', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow({ resources: twoResources() }))
    presentationNamesHook.mockReturnValue(presentations())

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    await userEvent.setup().type(screen.getByLabelText('Buscar'), '2mm')

    expect(screen.getByText('Cable UTP Blanco')).toBeVisible()
    expect(screen.queryByText('Cable UTP Negro')).not.toBeInTheDocument()
  })

  it('shows the existing empty state when the search term matches no visible resource', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow({ resources: twoResources() }))
    presentationNamesHook.mockReturnValue(presentations())

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    await userEvent
      .setup()
      .type(screen.getByLabelText('Buscar'), 'no-existe-nada')

    expect(screen.getByText('No hay recursos para este filtro.')).toBeVisible()
    expect(screen.queryByText('Cable UTP Negro')).not.toBeInTheDocument()
    expect(screen.queryByText('Cable UTP Blanco')).not.toBeInTheDocument()
  })

  it('never sends the typed search text to the backend window criteria', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow({ resources: twoResources() }))
    presentationNamesHook.mockReturnValue(presentations())

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    await userEvent.setup().type(screen.getByLabelText('Buscar'), 'negro')

    for (const call of restWindowHook.mock.calls) {
      expect(call[1]).toMatchObject({ text: '' })
    }
  })
})

describe('ResourcesMasterScreen hierarchical/cumulative filter (Slice D3)', () => {
  it('sends only classCode when just a Class is selected', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy({ classId: 'class-1' }))
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({ classCode: 'MATERIAL' })
    expect(criteria).not.toHaveProperty('familyCode')
    expect(criteria).not.toHaveProperty('typeCode')
  })

  it('adds familyCode alongside classCode when a Family is also selected', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
    })
    expect(criteria).not.toHaveProperty('typeCode')
  })

  it('adds typeCode alongside classCode and familyCode when a Type is also selected', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'UTP',
    })
  })

  it('drops familyCode and typeCode once the hierarchy selection reports only a Class again (Class change resets descendants)', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    const { rerender } = renderScreen(
      <ResourcesMasterScreen creationOwnership={null} />,
    )
    hierarchyHook.mockReturnValue(hierarchy({ classId: 'class-1' }))
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({ classCode: 'MATERIAL' })
    expect(criteria).not.toHaveProperty('familyCode')
    expect(criteria).not.toHaveProperty('typeCode')
  })

  it('drops only typeCode once the hierarchy selection reports Class+Family again (Family change resets only Type)', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    const { rerender } = renderScreen(
      <ResourcesMasterScreen creationOwnership={null} />,
    )
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1' }),
    )
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
    })
    expect(criteria).not.toHaveProperty('typeCode')
  })

  it('renders Familias items depending on the selected Class and Tipos items depending on the selected Family', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy(
        { classId: 'class-1' },
        {
          families: [
            {
              id: 'family-9',
              code: 'TUBO',
              name: 'Tubería',
              classCode: 'MATERIAL',
              active: true,
              revision: '2',
            },
          ],
          types: [
            {
              id: 'type-9',
              code: 'PVC',
              name: 'PVC',
              classCode: 'MATERIAL',
              familyCode: 'TUBO',
              active: true,
              revision: '3',
            },
          ],
        },
      ),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('Tubería')).toBeVisible()
    expect(screen.getByText('PVC')).toBeVisible()
  })

  it('invokes hierarchy.selectClass and hierarchy.selectFamily with the clicked item id', async () => {
    factory.mockReturnValue(api)
    const state = hierarchy({ classId: 'class-1' })
    hierarchyHook.mockReturnValue(state)
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    const user = userEvent.setup()
    await user.click(screen.getByText('Material'))
    await user.click(screen.getByText('Cable'))

    expect(state.selectClass).toHaveBeenCalledWith('class-1')
    expect(state.selectFamily).toHaveBeenCalledWith('family-1')
  })
})

describe('ResourcesMasterScreen hierarchy columns (Slice E2 — StagedSearchSelector)', () => {
  it('completes a fully keyboard-only Clase→Familia→Tipo chain, auto-focusing the next column each time', async () => {
    factory.mockReturnValue(api)
    const classState = hierarchy()
    hierarchyHook.mockReturnValue(classState)
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    const { rerender } = renderScreen(
      <ResourcesMasterScreen creationOwnership={null} />,
    )
    const user = userEvent.setup()

    const claseInput = screen.getByRole('searchbox', { name: 'Clase' })
    await user.click(claseInput)
    await user.type(claseInput, 'mat')
    fireEvent.keyDown(claseInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'Material' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(classState.selectClass).toHaveBeenCalledWith('class-1')

    const familyState = hierarchy({ classId: 'class-1' })
    hierarchyHook.mockReturnValue(familyState)
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    const familiaInput = screen.getByRole('searchbox', { name: 'Familia' })
    expect(familiaInput).toHaveFocus()
    await user.type(familiaInput, 'cab')
    fireEvent.keyDown(familiaInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'Cable' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(familyState.selectFamily).toHaveBeenCalledWith('family-1')

    const typeState = hierarchy({ classId: 'class-1', familyId: 'family-1' })
    hierarchyHook.mockReturnValue(typeState)
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    const tipoInput = screen.getByRole('searchbox', { name: 'Tipo' })
    expect(tipoInput).toHaveFocus()
    await user.type(tipoInput, 'utp')
    fireEvent.keyDown(tipoInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'UTP' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(typeState.selectType).toHaveBeenCalledWith('type-1')

    hierarchyHook.mockReturnValue(
      hierarchy({
        classId: 'class-1',
        familyId: 'family-1',
        typeId: 'type-1',
      }),
    )
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    const criteria = restWindowHook.mock.calls.at(-1)?.[1]
    expect(criteria).toMatchObject({
      classCode: 'MATERIAL',
      familyCode: 'CABLE',
      typeCode: 'UTP',
    })
  })

  it('shows a parent-specific waiting message for Familia and Tipo before their parent is selected', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy(
        {},
        {
          familiesStatus: 'waiting-for-parent',
          typesStatus: 'waiting-for-parent',
          families: [],
          types: [],
        },
      ),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('Seleccioná una Clase primero.')).toBeVisible()
    expect(screen.getByText('Seleccioná una Familia primero.')).toBeVisible()
  })

  it('resets Tipo back to the waiting state once hierarchy reports the Class changed (Familia reloads fresh, Tipo waits on the new Familia)', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(
      hierarchy({ classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }),
    )
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    const { rerender } = renderScreen(
      <ResourcesMasterScreen creationOwnership={null} />,
    )
    // Realistic post-Class-change shape (matches useResourcesHierarchy.ts):
    // Familia reloads to a fresh 'ready' window for the new Class — it is
    // never 'waiting-for-parent' once a Class is selected — while Tipo goes
    // back to waiting since no Familia is selected yet either.
    hierarchyHook.mockReturnValue(
      hierarchy(
        { classId: 'class-1' },
        { typesStatus: 'waiting-for-parent', types: [] },
      ),
    )
    rerender(<ResourcesMasterScreen creationOwnership={null} />)

    expect(
      screen.queryByText('Seleccioná una Clase primero.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Seleccioná una Familia primero.')).toBeVisible()
    expect(screen.getByRole('searchbox', { name: 'Familia' })).toHaveFocus()
  })

  it('shows the no-coincidences state for a column whose typed term matches nothing loaded', async () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)
    await userEvent
      .setup()
      .type(screen.getByRole('searchbox', { name: 'Clase' }), 'no-existe')

    expect(screen.getByText('Sin resultados.')).toBeVisible()
  })

  it('renders zero Anterior/Siguiente/Cargar más for the hierarchy columns (resource-list pagination is unrelated and stays)', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(restWindow())
    presentationNamesHook.mockReturnValue({})

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(
      screen.queryByRole('button', { name: 'Anterior' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Siguiente' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cargar más…' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Anterior recursos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Siguiente recursos' }),
    ).toBeInTheDocument()
  })
})

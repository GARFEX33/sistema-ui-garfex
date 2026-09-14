import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResourcesMasterScreen } from '../../src/features/resources-master/ResourcesMasterScreen'

const factory = vi.hoisted(() => vi.fn())
const hierarchyHook = vi.hoisted(() => vi.fn())
const restWindowHook = vi.hoisted(() => vi.fn())
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
vi.mock('../../src/features/resources-master/CrearRecursoSurface', () => ({
  CrearRecursoSurface: (props: unknown) => {
    creationSurfaceProps(props)
    return <button type="button">Nuevo recurso</button>
  },
}))

const api = { rest: true }
const windowState = {
  status: 'ready',
  items: [],
  offset: 0,
  hasPrevious: false,
  hasNext: false,
}

const hierarchy = (selected = false) => ({
  selection: selected
    ? { classId: 'class-1', familyId: 'family-1', typeId: 'type-1' }
    : {},
  classes: {
    ...windowState,
    items: [
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
    items: [
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
    items: [
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
  previousClasses: vi.fn(),
  previousFamilies: vi.fn(),
  previousTypes: vi.fn(),
  continueClasses: vi.fn(),
  continueFamilies: vi.fn(),
  continueTypes: vi.fn(),
})

const resource = {
  id: 'resource-1',
  identityV1: 'MATERIAL-CABLE-UTP-001',
  scope: { classCode: 'MATERIAL', familyCode: 'CABLE', typeCode: 'UTP' },
  naturalUnit: 'm',
  active: true,
  revision: '7',
  attributes: [{ code: 'COLOR', value: { kind: 'TEXT', value: 'Negro' } }],
}

const restWindow = (overrides: Record<string, unknown> = {}) => ({
  resources: [resource],
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
  creationSurfaceProps.mockReset()
})

describe('ResourcesMasterScreen REST read wiring', () => {
  it('creates only the REST API and supplies the active REST window with hierarchy codes', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy(true))
    restWindowHook.mockReturnValue(restWindow())

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

  it('renders only the documented REST resource projection', () => {
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy(true))
    restWindowHook.mockReturnValue(restWindow())

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByText('MATERIAL-CABLE-UTP-001')).toBeVisible()
    expect(screen.getByText('MATERIAL / CABLE / UTP')).toBeVisible()
    expect(screen.getByText('m')).toBeVisible()
    expect(screen.getAllByText('Activo')).toHaveLength(2)
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText(/COLOR:/)).toBeVisible()
    expect(screen.queryByText('Nombre')).not.toBeInTheDocument()
    expect(screen.queryByText('Código')).not.toBeInTheDocument()
    expect(screen.queryByText('Diagnóstico')).not.toBeInTheDocument()
  })

  it('uses one replacement REST window with previous and next controls', async () => {
    const state = restWindow()
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy())
    restWindowHook.mockReturnValue(state)

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

    renderScreen(<ResourcesMasterScreen creationOwnership={null} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los recursos.',
    )
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(state.retry).toHaveBeenCalledOnce()
    expect(creationSurfaceProps).toHaveBeenLastCalledWith({})
  })
})

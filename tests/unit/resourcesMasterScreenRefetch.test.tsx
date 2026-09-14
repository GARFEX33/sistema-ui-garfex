import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResourcesMasterScreen } from '../../src/features/resources-master/ResourcesMasterScreen'

const factory = vi.hoisted(() => vi.fn())
const hierarchyHook = vi.hoisted(() => vi.fn())
const restWindowHook = vi.hoisted(() => vi.fn())

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
  CrearRecursoSurface: () => <button type="button">Nuevo recurso</button>,
}))

const api = { rest: true }
const hierarchy = {
  selection: {},
  classes: { status: 'empty', items: [], hasPrevious: false, hasNext: false },
  families: {
    status: 'waiting-for-parent',
    items: [],
    hasPrevious: false,
    hasNext: false,
  },
  types: {
    status: 'waiting-for-parent',
    items: [],
    hasPrevious: false,
    hasNext: false,
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
}

afterEach(() => {
  factory.mockReset()
  hierarchyHook.mockReset()
  restWindowHook.mockReset()
})

describe('ResourcesMasterScreen REST refresh boundary', () => {
  it('retries only the current REST identity and does not refetch for the blocked Creator', async () => {
    const retry = vi.fn()
    const refetchActive = vi.fn()
    factory.mockReturnValue(api)
    hierarchyHook.mockReturnValue(hierarchy)
    restWindowHook.mockReturnValue({
      resources: [],
      status: 'initial-error',
      hasPrevious: false,
      hasNext: false,
      previous: vi.fn(),
      next: vi.fn(),
      retry,
      refetchActive,
    })

    render(<ResourcesMasterScreen creationOwnership={null} />)

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Nuevo recurso' }))

    expect(retry).toHaveBeenCalledOnce()
    expect(refetchActive).not.toHaveBeenCalled()
  })
})

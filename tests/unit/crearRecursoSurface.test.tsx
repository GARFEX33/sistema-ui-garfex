import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import { ResourceCreationContractPending } from '../../src/features/resources-master/ResourceCreationContractPending'
import type { ResourceCreationEvaluationDriverOptions } from '../../src/features/resources-master/useResourceCreationEvaluation'
import { useResourceCreationFlow } from '../../src/features/resources-master/useResourceCreationFlow'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { ResourceCreationEvaluationOwnership } from '../../src/features/resources-master/resourcesMaster.types'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

type IdleEvaluationDriver = (
  options: ResourceCreationEvaluationDriverOptions,
) => {
  status: 'idle'
  retry: () => Promise<void>
}

const { useResourceCreationEvaluationSpy } = vi.hoisted(() => ({
  useResourceCreationEvaluationSpy: vi.fn<IdleEvaluationDriver>(() => ({
    status: 'idle',
    retry: () => Promise.resolve(),
  })),
}))

vi.mock(
  '../../src/features/resources-master/useResourceCreationEvaluation',
  () => ({
    useResourceCreationEvaluation: useResourceCreationEvaluationSpy,
  }),
)
vi.mock(
  '../../src/features/resources-master/useResourceCreationAttributeQueries',
  () => ({
    useResourceCreationAttributeQueries: () => ({
      step: { kind: 'unavailable' },
      definition: { status: 'idle' },
      allowedValues: {},
      allowedValuesKnowledge: {},
    }),
  }),
)

beforeEach(() => {
  useResourceCreationEvaluationSpy.mockClear()
  // react-aria-components' Popover positioning reads layout APIs jsdom does
  // not implement; a no-op is enough since we never assert real geometry.
  global.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const classItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'class-1',
  clave: 'MATERIAL',
  nombre: 'Material',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  ...overrides,
})
const familyItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'family-1',
  clave: 'ARIDOS',
  nombre: 'Áridos',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  claseRecursoId: 'class-1',
  ...overrides,
})
const typeItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'type-1',
  clave: 'ARENA',
  nombre: 'Arena',
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  familiaRecursoId: 'family-1',
  aggregateStatus: 'CLEAN',
  violations: [],
  ...overrides,
})
const unitPolicy = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'policy-1',
  familiaRecursoId: 'family-1',
  tipoRecursoId: 'type-1',
  unidadId: 'M3',
  principal: true,
  activo: true,
  revision: 1,
  effective: true,
  selected: true,
  shadowed: false,
  selection: 'SELECTED',
  ...overrides,
})

const unitNames: Record<string, { nombre: string; simbolo: string }> = {
  M3: { nombre: 'Metro cúbico', simbolo: 'm³' },
  KG: { nombre: 'Kilogramo', simbolo: 'kg' },
}

function fakeApi(
  overrides: Partial<ResourcesMasterApi> = {},
): ResourcesMasterApi {
  return {
    listResources: vi.fn(),
    searchResources: vi.fn(),
    getResourceDetail: vi.fn(),
    createResource: vi.fn(),
    updateResource: vi.fn(),
    activateResource: vi.fn(),
    deactivateResource: vi.fn(),
    listContextClasses: vi.fn(async () => ({
      items: [classItem()],
      continuationCursor: null,
      isExhausted: true,
    })),
    listContextFamilies: vi.fn(async () => ({
      items: [familyItem()],
      continuationCursor: null,
      isExhausted: true,
    })),
    listContextTypes: vi.fn(async () => ({
      items: [typeItem()],
      continuationCursor: null,
      isExhausted: true,
    })),
    listUnitPolicies: vi.fn(async () => ({
      items: [unitPolicy()],
      continuationCursor: null,
      isExhausted: true,
    })),
    getUnit: vi.fn(async ({ unidadId }: { unidadId: unknown }) => {
      const match = unitNames[String(unidadId)]
      return match
        ? {
            id: unidadId,
            clave: String(unidadId),
            nombre: match.nombre,
            simbolo: match.simbolo,
            activo: true,
            revision: 1,
            effective: true,
          }
        : null
    }),
    listAttributeAssignments: vi.fn(),
    getAttributeDefinition: vi.fn(),
    listAttributeOptions: vi.fn(),
    ...overrides,
  } as ResourcesMasterApi
}

it('resolves only the current Tipo policy candidates and confirms Unidad explicitly', async () => {
  let resolveOldPolicies!: (value: {
    items: ReturnType<typeof unitPolicy>[]
    continuationCursor: null
    isExhausted: boolean
  }) => void
  let resolveMorePolicies!: (value: {
    items: ReturnType<typeof unitPolicy>[]
    continuationCursor: null
    isExhausted: boolean
  }) => void
  const api = fakeApi({
    listUnitPolicies: vi.fn(({ paraTipoRecursoId, cursor }) =>
      paraTipoRecursoId === 'type-1'
        ? new Promise((resolve) => {
            resolveOldPolicies = resolve
          })
        : cursor === null
          ? Promise.resolve({
              items: [
                unitPolicy({
                  id: 'policy-kg',
                  unidadId: 'KG',
                  principal: false,
                  selected: true,
                }),
              ],
              continuationCursor: 'more-units',
              isExhausted: false,
            })
          : new Promise((resolve) => {
              resolveMorePolicies = resolve
            }),
    ),
  })
  const { result } = renderHook(() => useResourceCreationFlow(api, null))

  act(() =>
    result.current.begin({
      classItem: classItem(),
      familyItem: familyItem(),
      typeItem: typeItem(),
      depth: 3,
    }),
  )
  await waitFor(() =>
    expect(api.listUnitPolicies).toHaveBeenCalledWith({
      familiaRecursoId: 'family-1',
      paraTipoRecursoId: 'type-1',
      cursor: null,
      pageSize: 20,
    }),
  )

  act(() =>
    result.current.confirmType(
      typeItem({ id: 'type-2', familiaRecursoId: 'stale-family' }),
    ),
  )
  await waitFor(() =>
    expect(api.listUnitPolicies).toHaveBeenCalledWith({
      familiaRecursoId: 'family-1',
      paraTipoRecursoId: 'type-2',
      cursor: null,
      pageSize: 20,
    }),
  )
  await waitFor(() =>
    expect(result.current.units.map((unit) => unit.unidadId)).toEqual(['KG']),
  )
  expect(result.current.state.draft.unitId).toBeNull()

  act(() => void result.current.continueUnits())
  await waitFor(() =>
    expect(result.current.unitLoadState).toEqual({ status: 'loading-more' }),
  )
  expect(result.current.units.map((unit) => unit.unidadId)).toEqual(['KG'])
  resolveMorePolicies({
    items: [unitPolicy({ id: 'policy-m3', unidadId: 'M3' })],
    continuationCursor: null,
    isExhausted: true,
  })
  await waitFor(() =>
    expect(result.current.units.map((unit) => unit.unidadId)).toEqual([
      'KG',
      'M3',
    ]),
  )

  resolveOldPolicies({
    items: [unitPolicy({ unidadId: 'M3' })],
    continuationCursor: null,
    isExhausted: true,
  })
  await waitFor(() =>
    expect(result.current.units.map((unit) => unit.unidadId)).toEqual([
      'KG',
      'M3',
    ]),
  )

  await act(async () => result.current.confirmUnit(result.current.units[0]!))
  expect(result.current.state.draft.unitId).toBe('KG')
  expect(result.current.state.stage).toEqual({ kind: 'attributes' })
})

it('keeps resolved Unidad candidates retryable without implicitly confirming one', async () => {
  const api = fakeApi({
    listUnitPolicies: vi.fn(async () => ({
      items: [
        unitPolicy({ unidadId: 'M3' }),
        unitPolicy({ id: 'policy-kg', unidadId: 'KG' }),
      ],
      continuationCursor: null,
      isExhausted: true,
    })),
    getUnit: vi
      .fn()
      .mockResolvedValueOnce({
        id: 'M3',
        clave: 'M3',
        nombre: 'Metro cúbico',
        simbolo: 'm³',
        activo: true,
        revision: 1,
        effective: true,
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        id: 'KG',
        clave: 'KG',
        nombre: 'Kilogramo',
        simbolo: 'kg',
        activo: true,
        revision: 1,
        effective: true,
      }),
  })
  const { result } = renderHook(() => useResourceCreationFlow(api, null))

  act(() =>
    result.current.begin({
      classItem: classItem(),
      familyItem: familyItem(),
      typeItem: typeItem(),
      depth: 3,
    }),
  )
  await waitFor(() =>
    expect(result.current.unitLoadState).toEqual({ status: 'partial-error' }),
  )
  expect(result.current.units.map((unit) => unit.unidadId)).toEqual(['M3'])

  act(() => result.current.confirmUnit(result.current.units[0]!))
  expect(result.current.state.draft.unitId).toBeNull()
  expect(result.current.state.stage).toEqual({ kind: 'unit' })

  await act(async () => result.current.retryUnits())
  expect(result.current.units.map((unit) => unit.unidadId)).toEqual([
    'M3',
    'KG',
  ])
  expect(result.current.unitLoadState).toEqual({
    status: 'ready',
    exhausted: true,
  })
})

const renderSurface = (
  api: ResourcesMasterApi,
  props?: Omit<
    ComponentProps<typeof CrearRecursoSurface>,
    'api' | 'ownership'
  > & { ownership?: ResourceCreationEvaluationOwnership | null },
) =>
  render(
    <KeyboardControllerProvider activeSurface="recursos">
      <CrearRecursoSurface api={api} ownership={null} {...props} />
    </KeyboardControllerProvider>,
  )

const chooseOption = async (
  user: ReturnType<typeof userEvent.setup>,
  fieldLabel: string,
  optionName: string,
) => {
  const filter = screen.queryByRole('searchbox', { name: fieldLabel })
  if (filter) {
    await user.click(await screen.findByRole('option', { name: optionName }))
    return
  }
  if (fieldLabel === 'Clase')
    await user.click(screen.getByRole('button', { name: /^Clase:/ }))
  const trigger = screen.getByLabelText(fieldLabel)
  await user.click(trigger)
  const listbox = await screen.findByRole('listbox')
  await user.click(within(listbox).getByRole('option', { name: optionName }))
}

describe('CrearRecursoSurface — Paso 1 (Contexto)', () => {
  it('distinguishes a missing creation ownership from pending evaluation integration', () => {
    const { rerender } = render(
      <ResourceCreationContractPending ownership={null} />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No se puede continuar hasta que el contexto actual defina la titularidad del recurso.',
    )
    expect(screen.getByRole('status')).not.toHaveTextContent(/backend/i)

    const ownership: ResourceCreationEvaluationOwnership = { kind: 'GLOBAL' }
    rerender(<ResourceCreationContractPending ownership={ownership} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'La integración de evaluación de creación todavía está pendiente.',
    )
    expect(screen.getByRole('status')).not.toHaveTextContent(/backend/i)
  })

  it.each([
    ['GLOBAL', { kind: 'GLOBAL' }],
    [
      'ORGANIZATION',
      { kind: 'ORGANIZATION', organizacionId: 'organization-1' },
    ],
    ['null', null],
  ] as const)(
    'forwards explicit %s ownership into the evaluation flow',
    (_kind, ownership) => {
      renderSurface(fakeApi(), { ownership })

      expect(useResourceCreationEvaluationSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ ownership }),
      )
    },
  )

  it('opens with the N shortcut on the recursos surface and loads Clases', async () => {
    const api = fakeApi()
    renderSurface(api, { ownership: null })
    fireEvent.keyDown(document, { key: 'n' })
    expect(
      screen.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
    await waitFor(() =>
      expect(api.listContextClasses).toHaveBeenCalledWith({
        cursor: undefined,
        pageSize: 20,
      }),
    )
  })

  it('does not register the shortcut outside the recursos surface', () => {
    render(
      <KeyboardControllerProvider activeSurface="catalog">
        <CrearRecursoSurface api={fakeApi()} ownership={null} />
      </KeyboardControllerProvider>,
    )
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stops at Contrato pendiente with only Volver and no reachable legacy controls or requests', async () => {
    const api = fakeApi()
    const onCreated = vi.fn()
    const user = userEvent.setup()
    renderSurface(api, { ownership: null, onCreated })
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    expect(
      screen.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Creador de recursos' }),
    ).toBeVisible()
    await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())

    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    const confirmUnit = await screen.findByRole('option', {
      name: 'Metro cúbico (m³)',
    })
    confirmUnit.focus()
    await user.keyboard('{Enter}')

    const pendingHeading = await screen.findByRole('heading', {
      name: 'Contrato pendiente',
    })
    expect(pendingHeading).toHaveFocus()
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toEqual(['Creador de recursos', 'Contrato pendiente'])
    expect(api.listAttributeAssignments).not.toHaveBeenCalled()
    expect(api.getAttributeDefinition).not.toHaveBeenCalled()
    expect(api.listAttributeOptions).not.toHaveBeenCalled()
    expect(api.createResource).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Descripción')).not.toBeInTheDocument()
    expect(screen.queryByText('TEXTO')).not.toBeInTheDocument()
    expect(screen.queryByText('NUMERO')).not.toBeInTheDocument()
    expect(screen.queryByText('BOOLEANO')).not.toBeInTheDocument()
    expect(screen.queryByText('OPCION')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Crear recurso' }),
    ).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Comandos disponibles' }))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Volver'])
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(
      screen.queryByRole('heading', { name: 'Contrato pendiente' }),
    ).not.toBeInTheDocument()
    const unitSearch = screen.getByRole('searchbox', {
      name: 'Unidad natural',
    })
    expect(unitSearch).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull()
    expect(screen.queryByRole('searchbox', { name: 'Tipo' })).toBeNull()
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  })

  it('keeps the shell title for initial and deep snapshot openings', async () => {
    const initial = renderSurface(fakeApi(), { ownership: null })
    fireEvent.keyDown(document, { key: 'n' })
    expect(
      screen.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
    expect(screen.getByRole('searchbox', { name: 'Clase' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Elegí una Clase' }),
    ).toBeVisible()
    initial.unmount()

    renderSurface(fakeApi(), {
      initialHierarchySnapshot: {
        classItem: classItem(),
        familyItem: familyItem(),
        typeItem: typeItem(),
      },
    })
    fireEvent.keyDown(document, { key: 'n' })
    expect(
      screen.getByRole('heading', { name: 'Creador de recursos' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Elegí una Unidad natural' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('searchbox', { name: 'Clase' }),
    ).not.toBeInTheDocument()
  })

  it('keeps a semantic stage rail and stage-specific commands while returning to a confirmed stage', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    const classStage = within(rail).getByRole('button', {
      name: 'Clase: Material',
    })
    expect(classStage).toHaveStyle({ minHeight: '44px' })
    expect(getComputedStyle(classStage).minHeight).toBe('44px')
    expect(screen.queryByText('Esc cerrar')).not.toBeInTheDocument()
    expect(within(rail).getByText('Familia: Áridos')).toBeVisible()
    expect(within(rail).getByText('Tipo: Arena')).toBeVisible()
    expect(within(rail).getByText('Unidad · pendiente')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(
      screen.getByRole('region', { name: 'Comandos disponibles' }),
    ).toHaveTextContent('Esc Cerrar')

    await user.click(classStage)
    expect(screen.getByRole('searchbox', { name: 'Clase' })).toBeVisible()
    expect(
      within(rail).getByRole('button', { name: 'Clase: Material' }),
    ).toBeVisible()
    await user.click(screen.getByRole('option', { name: 'Material' }))

    await user.click(
      within(rail).getByRole('button', { name: 'Familia: Áridos' }),
    )
    expect(screen.getByRole('searchbox', { name: 'Familia' })).toBeVisible()
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    await user.click(
      await screen.findByRole('option', { name: 'Metro cúbico (m³)' }),
    )
    await screen.findByRole('heading', { name: 'Contrato pendiente' })
    expect(
      within(
        screen.getByRole('region', { name: 'Comandos disponibles' }),
      ).queryByText('Crear'),
    ).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('heading', { name: 'Contrato pendiente' }),
    ).not.toBeInTheDocument()
    expect(
      within(rail).getByRole('button', { name: 'Unidad: Metro cúbico' }),
    ).toHaveAttribute('aria-current', 'step')
    expect(
      screen.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
    await user.click(within(rail).getByRole('button', { name: 'Tipo: Arena' }))
    expect(screen.getByRole('searchbox', { name: 'Tipo' })).toBeVisible()
    await user.click(
      within(rail).getByRole('button', { name: 'Unidad: Metro cúbico' }),
    )
    const unitSearch = await screen.findByRole('searchbox', {
      name: 'Unidad natural',
    })
    expect(unitSearch).toHaveFocus()
    expect(screen.queryByRole('searchbox', { name: 'Tipo' })).toBeNull()
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  })

  it('cascades Clase -> Familia -> Tipo -> Unidad natural, preselecting the principal unit', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())

    await chooseOption(user, 'Clase', 'Material')
    await waitFor(() =>
      expect(api.listContextFamilies).toHaveBeenCalledWith({
        claseRecursoId: 'class-1',
        cursor: undefined,
        pageSize: 20,
      }),
    )

    await chooseOption(user, 'Familia', 'Áridos')
    await waitFor(() =>
      expect(api.listContextTypes).toHaveBeenCalledWith({
        familiaRecursoId: 'family-1',
        cursor: undefined,
        pageSize: 20,
      }),
    )

    await chooseOption(user, 'Tipo', 'Arena')
    await waitFor(() =>
      expect(api.listUnitPolicies).toHaveBeenCalledWith({
        familiaRecursoId: 'family-1',
        paraTipoRecursoId: 'type-1',
        cursor: null,
        pageSize: 20,
      }),
    )

    expect(
      await screen.findByRole('searchbox', { name: 'Unidad natural' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Siguiente' }),
    ).not.toBeInTheDocument()
  })

  it('renders Unidad natural as an unconfirmed staged decision until Enter explicitly confirms it', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')

    const unitSearch = await screen.findByRole('searchbox', {
      name: 'Unidad natural',
    })
    const preferredUnit = screen.getByRole('option', {
      name: 'Metro cúbico (m³)',
    })
    expect(preferredUnit).toHaveAttribute('aria-selected', 'false')
    expect(
      screen.queryByRole('button', { name: 'Siguiente' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('— principal')).not.toBeInTheDocument()

    await user.click(unitSearch)
    await user.keyboard('{ArrowDown}{Enter}')

    expect(
      await screen.findByRole('heading', { name: 'Contrato pendiente' }),
    ).toBeVisible()
    expect(api.listAttributeAssignments).not.toHaveBeenCalled()
  })

  it('keeps a hydrated Unidad selectable while Cargar más waits for the next policy page', async () => {
    let resolveMore!: (page: {
      items: ReturnType<typeof unitPolicy>[]
      continuationCursor: null
      isExhausted: boolean
    }) => void
    const api = fakeApi({
      listUnitPolicies: vi.fn(({ cursor }) =>
        cursor === null
          ? Promise.resolve({
              items: [unitPolicy({ unidadId: 'KG', principal: false })],
              continuationCursor: 'more-units',
              isExhausted: false,
            })
          : new Promise((resolve) => {
              resolveMore = resolve
            }),
      ),
    })
    const user = userEvent.setup()
    renderSurface(api)
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')

    const kilogramo = await screen.findByRole('option', {
      name: 'Kilogramo (kg)',
    })
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    expect(screen.getByRole('button', { name: 'Cargar más…' })).toBeDisabled()
    expect(kilogramo).toBeVisible()
    await user.click(kilogramo)

    expect(
      await screen.findByRole('heading', { name: 'Contrato pendiente' }),
    ).toBeVisible()
    resolveMore({ items: [], continuationCursor: null, isExhausted: true })
  })

  it('requires an explicit non-preferred Unidad choice before showing Contrato pendiente', async () => {
    const api = fakeApi({
      listUnitPolicies: vi.fn(async () => ({
        items: [
          unitPolicy({ unidadId: 'KG', principal: false, selected: false }),
          unitPolicy({ unidadId: 'TON', effective: false }),
        ],
        continuationCursor: null,
        isExhausted: true,
      })),
    })
    const user = userEvent.setup()
    renderSurface(api)
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')

    await waitFor(() => expect(api.listUnitPolicies).toHaveBeenCalled())
    const listbox = await screen.findByRole('listbox', {
      name: 'Opciones de Unidad natural',
    })
    expect(
      within(listbox).queryByRole('option', { name: /Tonelada|TON/ }),
    ).not.toBeInTheDocument()
    const kilogramo = within(listbox).getByRole('option', {
      name: /Kilogramo/,
    })
    expect(kilogramo).toBeVisible()
    await user.click(kilogramo)

    expect(await screen.findByText('Contrato pendiente')).toBeVisible()
    expect(api.listAttributeAssignments).not.toHaveBeenCalled()
    expect(api.createResource).not.toHaveBeenCalled()
  })

  it('resets Familia, Tipo and Unidad natural only after a rail return confirms another Clase', async () => {
    const api = fakeApi({
      listContextClasses: vi.fn(async () => ({
        items: [classItem(), classItem({ id: 'class-2', nombre: 'Otro' })],
        continuationCursor: null,
        isExhausted: true,
      })),
    })
    const user = userEvent.setup()
    renderSurface(api)
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    expect(
      await screen.findByRole('option', { name: 'Metro cúbico (m³)' }),
    ).toBeVisible()

    const rail = screen.getByRole('list', { name: 'Etapas de creación' })
    await user.click(
      within(rail).getByRole('button', { name: 'Clase: Material' }),
    )
    expect(screen.getByRole('searchbox', { name: 'Clase' })).toBeVisible()
    await user.click(screen.getByRole('option', { name: 'Otro' }))

    expect(
      await screen.findByRole('searchbox', { name: 'Familia' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /Tipo/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('searchbox', { name: 'Unidad natural' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('backs one Escape stage at a time and focuses each current selector before closing', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })
    await user.click(trigger)
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    await user.click(
      await screen.findByRole('option', { name: 'Metro cúbico (m³)' }),
    )
    await screen.findByRole('heading', { name: 'Contrato pendiente' })

    for (const label of ['Unidad natural', 'Tipo', 'Familia', 'Clase']) {
      await user.keyboard('{Escape}')
      const search = await screen.findByRole('searchbox', { name: label })
      expect(search).toHaveFocus()
    }

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(trigger).toHaveFocus()
  })

  it('uses ArrowLeft only for unmodified, unconsumed, non-editable local back navigation', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    const search = await screen.findByRole('searchbox', {
      name: 'Unidad natural',
    })
    const option = screen.getByRole('option', {
      name: 'Metro cúbico (m³)',
    })

    search.focus()
    await user.keyboard('{ArrowLeft}')
    expect(search).toHaveFocus()
    option.focus()
    fireEvent.keyDown(option, { key: 'ArrowLeft', ctrlKey: true })
    fireEvent.keyDown(option, { key: 'ArrowLeft', isComposing: true })
    option.addEventListener('keydown', (event) => event.preventDefault(), {
      once: true,
    })
    fireEvent.keyDown(option, { key: 'ArrowLeft' })
    expect(
      screen.getByRole('searchbox', { name: 'Unidad natural' }),
    ).toBeVisible()

    option.focus()
    await user.keyboard('{ArrowLeft}')
    expect(await screen.findByRole('searchbox', { name: 'Tipo' })).toHaveFocus()
  })

  it('restores a valid keyboard opener before the trigger fallback', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    const originalOpener = document.createElement('button')
    originalOpener.textContent = 'Abrir creador desde contexto'
    document.body.append(originalOpener)
    originalOpener.focus()

    fireEvent.keyDown(document, { key: 'n' })
    await screen.findByRole('dialog', { name: 'Creador de recursos' })
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise((resolve) => window.setTimeout(resolve, 60))

    expect(originalOpener).toHaveFocus()
    originalOpener.remove()
  })

  it('cancels delayed close restoration when the dialog immediately reopens', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await user.click(trigger)
    const classSearch = await screen.findByRole('searchbox', {
      name: 'Clase',
    })
    await new Promise((resolve) => window.setTimeout(resolve, 60))

    expect(screen.getByRole('dialog')).toBeVisible()
    expect(classSearch).toHaveFocus()
  })

  it('falls back to the Recursos sidebar when the trigger is disconnected before Class Escape closes', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })
    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Creador de recursos' })
    const fallback = document.createElement('button')
    fallback.dataset.spatialId = 'sidebar.recursos'
    document.body.append(fallback)
    trigger.remove()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(fallback).toHaveFocus()
    fallback.remove()
  })
})

describe('CrearRecursoSurface — Clase staged', () => {
  it('opens a depth-zero draft at Clase, filters loaded pages, continues, and confirms only by Enter', async () => {
    const listContextClasses = vi
      .fn()
      .mockResolvedValueOnce({
        items: [classItem(), classItem({ id: 'class-2', nombre: 'Servicio' })],
        continuationCursor: 'next-classes',
        isExhausted: false,
      })
      .mockResolvedValueOnce({
        items: [classItem(), classItem({ id: 'class-3', nombre: 'Equipo' })],
        continuationCursor: null,
        isExhausted: true,
      })
    const onCreated = vi.fn()
    const api = fakeApi({ listContextClasses })
    const user = userEvent.setup()
    renderSurface(api, { onCreated })

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    const filter = await screen.findByRole('searchbox', { name: 'Clase' })
    await user.type(filter, 'equipo')
    expect(screen.queryByText('Equipo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(onCreated).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    const equipo = await screen.findByRole('option', { name: 'Equipo' })
    equipo.focus()
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(api.listContextFamilies).toHaveBeenCalledWith({
        claseRecursoId: 'class-3',
        cursor: undefined,
        pageSize: 20,
      }),
    )
    const breadcrumb = screen.getByRole('button', { name: /Clase: Equipo/ })
    expect(breadcrumb).toBeVisible()
    await user.click(breadcrumb)
    expect(screen.getByRole('searchbox', { name: 'Clase' })).toHaveValue(
      'equipo',
    )
    expect(screen.getByRole('option', { name: 'Equipo' })).toBeVisible()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('gates a paginated Familia decision by the confirmed Clase without a legacy selector', async () => {
    const api = fakeApi({
      listContextFamilies: vi
        .fn()
        .mockResolvedValueOnce({
          items: [familyItem()],
          continuationCursor: 'more-families',
          isExhausted: false,
        })
        .mockResolvedValueOnce({
          items: [
            familyItem({
              id: 'family-2',
              nombre: 'Grava',
              clave: 'GRAVA',
            }),
          ],
          continuationCursor: null,
          isExhausted: true,
        }),
      listContextTypes: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          items: [typeItem({ familiaRecursoId: 'family-2' })],
          continuationCursor: 'more-types',
          isExhausted: false,
        })
        .mockResolvedValueOnce({
          items: [
            typeItem({ familiaRecursoId: 'family-2' }),
            typeItem({
              id: 'type-2',
              nombre: 'Mortero',
              familiaRecursoId: 'family-2',
            }),
          ],
          continuationCursor: null,
          isExhausted: true,
        }),
    })
    const user = userEvent.setup()
    renderSurface(api)

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')

    const filter = await screen.findByRole('searchbox', { name: 'Familia' })
    expect(api.listContextFamilies).toHaveBeenCalledWith({
      claseRecursoId: 'class-1',
      cursor: undefined,
      pageSize: 20,
    })
    expect(
      screen.queryByRole('button', { name: 'Familia' }),
    ).not.toBeInTheDocument()

    await user.type(filter, 'grava')
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    const grava = await screen.findByRole('option', { name: 'Grava' })
    grava.focus()
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(api.listContextTypes).toHaveBeenCalledWith({
        familiaRecursoId: 'family-2',
        cursor: undefined,
        pageSize: 20,
      }),
    )
    expect(screen.getByRole('searchbox', { name: 'Tipo' })).toBeVisible()
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('option', { name: 'Arena' })
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    expect(await screen.findByRole('option', { name: 'Mortero' })).toBeVisible()
    expect(screen.getAllByRole('option', { name: 'Arena' })).toHaveLength(1)
  })

  it('rejects a stale Tipo page after confirming an alternative Familia', async () => {
    let resolveOldTypes!: (page: {
      items: ReturnType<typeof typeItem>[]
      continuationCursor: null
      isExhausted: boolean
    }) => void
    const api = fakeApi({
      listContextFamilies: vi.fn(async () => ({
        items: [familyItem(), familyItem({ id: 'family-2', nombre: 'Grava' })],
        continuationCursor: null,
        isExhausted: true,
      })),
      listContextTypes: vi.fn(({ familiaRecursoId }) =>
        familiaRecursoId === 'family-1'
          ? new Promise((resolve) => {
              resolveOldTypes = resolve
            })
          : Promise.resolve({
              items: [
                typeItem({
                  id: 'type-2',
                  nombre: 'Mortero',
                  familiaRecursoId: 'family-2',
                }),
              ],
              continuationCursor: null,
              isExhausted: true,
            }),
      ),
    })
    const user = userEvent.setup()
    renderSurface(api)

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await user.click(screen.getByRole('button', { name: 'Familia: Áridos' }))
    await chooseOption(user, 'Familia', 'Grava')
    expect(await screen.findByRole('option', { name: 'Mortero' })).toBeVisible()

    resolveOldTypes({
      items: [typeItem({ familiaRecursoId: 'family-1' })],
      continuationCursor: null,
      isExhausted: true,
    })
    await waitFor(() =>
      expect(
        screen.queryByRole('option', { name: 'Arena' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('preserves Tipo on Familia reconfirmation and clears Unidad after an alternative Tipo', async () => {
    const api = fakeApi({
      listContextTypes: vi.fn(async () => ({
        items: [typeItem(), typeItem({ id: 'type-2', nombre: 'Mortero' })],
        continuationCursor: null,
        isExhausted: true,
      })),
      listUnitPolicies: vi.fn(async ({ tipoRecursoId }) => ({
        items: tipoRecursoId === 'type-1' ? [unitPolicy()] : [],
        continuationCursor: null,
        isExhausted: true,
      })),
    })
    const user = userEvent.setup()
    renderSurface(api)

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await chooseOption(user, 'Clase', 'Material')
    await chooseOption(user, 'Familia', 'Áridos')
    await chooseOption(user, 'Tipo', 'Arena')
    await screen.findByRole('searchbox', { name: 'Unidad natural' })

    await user.click(screen.getByRole('button', { name: 'Familia: Áridos' }))
    await chooseOption(user, 'Familia', 'Áridos')
    expect(await screen.findByRole('searchbox', { name: 'Tipo' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Tipo: Arena' })).toBeVisible()
    await chooseOption(user, 'Tipo', 'Arena')
    expect(
      await screen.findByRole('searchbox', { name: 'Unidad natural' }),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Tipo: Arena' }))
    await user.click(screen.getByRole('option', { name: 'Mortero' }))
    expect(
      await screen.findByRole('searchbox', { name: 'Unidad natural' }),
    ).toBeVisible()
    expect(screen.getByText('No hay opciones disponibles.')).toBeVisible()
  })

  it('opens a valid deep prefix at Unidad and falls back to Tipo for an invalid Tipo', async () => {
    const user = userEvent.setup()
    const validApi = fakeApi()
    const valid = renderSurface(validApi, {
      initialHierarchySnapshot: {
        classItem: classItem(),
        familyItem: familyItem(),
        typeItem: typeItem(),
      },
    })

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    const unit = await screen.findByRole('searchbox', {
      name: 'Unidad natural',
    })
    expect(unit).toBeVisible()
    expect(validApi.listUnitPolicies).toHaveBeenCalledWith({
      familiaRecursoId: 'family-1',
      paraTipoRecursoId: 'type-1',
      cursor: null,
      pageSize: 20,
    })
    expect(
      screen.queryByRole('searchbox', { name: 'Tipo' }),
    ).not.toBeInTheDocument()
    valid.unmount()

    renderSurface(fakeApi(), {
      initialHierarchySnapshot: {
        classItem: classItem(),
        familyItem: familyItem(),
        typeItem: typeItem({ familiaRecursoId: 'other-family' }),
      },
    })
    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    expect(await screen.findByRole('searchbox', { name: 'Tipo' })).toBeVisible()
    expect(
      screen.queryByRole('searchbox', { name: 'Unidad natural' }),
    ).not.toBeInTheDocument()
  })

  it('exposes Clase retry after the parent-gated initial retry is exhausted', async () => {
    const api = fakeApi({
      listContextClasses: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          items: [classItem()],
          continuationCursor: null,
          isExhausted: true,
        }),
    })
    const user = userEvent.setup()
    renderSurface(api)

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('option', { name: 'Material' }),
    ).toBeVisible()
  })

  it('skips staged Clase for an inherited Class and makes it locally correctable from the breadcrumb', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api, {
      initialHierarchySnapshot: {
        classItem: classItem(),
        familyItem: null,
        typeItem: null,
      },
    })

    await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
    expect(
      screen.queryByRole('searchbox', { name: 'Clase' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Clase: Material/ }),
    ).toBeVisible()
    await waitFor(() =>
      expect(api.listContextFamilies).toHaveBeenCalledWith({
        claseRecursoId: 'class-1',
        cursor: undefined,
        pageSize: 20,
      }),
    )
    expect(api.listContextClasses).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Clase: Material/ }))
    expect(await screen.findByRole('searchbox', { name: 'Clase' })).toHaveValue(
      '',
    )
  })
})

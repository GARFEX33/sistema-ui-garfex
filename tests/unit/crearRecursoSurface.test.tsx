import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

beforeEach(() => {
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

const assignment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'attr-default',
  familiaRecursoId: 'family-1',
  definicionAtributoId: 'def-default',
  tipoRecursoId: 'type-1',
  aplicabilidad: 'OPTIONAL',
  participaIdentidad: false,
  orden: 1,
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
  selection: 'SELECTED',
  ...overrides,
})

const definitionsById: Record<string, Record<string, unknown>> = {
  'def-opcion': {
    id: 'def-opcion',
    clave: 'GRANULOMETRIA',
    nombre: 'Granulometría',
    tipoDato: 'OPCION',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
  },
  'def-texto': {
    id: 'def-texto',
    clave: 'OBSERVACIONES',
    nombre: 'Observaciones',
    tipoDato: 'TEXTO',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
  },
  'def-numero': {
    id: 'def-numero',
    clave: 'DENSIDAD',
    nombre: 'Densidad',
    tipoDato: 'NUMERO',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
  },
  'def-bool': {
    id: 'def-bool',
    clave: 'LAVADA',
    nombre: 'Lavada',
    tipoDato: 'BOOLEANO',
    activo: true,
    revision: 1,
    effective: true,
    effectiveReasons: [],
  },
}

const defaultAssignments = [
  assignment({ id: 'attr-texto', definicionAtributoId: 'def-texto', orden: 1 }),
  assignment({
    id: 'attr-opcion',
    definicionAtributoId: 'def-opcion',
    orden: 2,
    aplicabilidad: 'REQUIRED',
  }),
  assignment({
    id: 'attr-numero',
    definicionAtributoId: 'def-numero',
    orden: 3,
  }),
  assignment({ id: 'attr-bool', definicionAtributoId: 'def-bool', orden: 4 }),
  assignment({
    id: 'attr-hidden',
    definicionAtributoId: 'def-hidden',
    orden: 0,
    effective: false,
  }),
]

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
    listAttributeAssignments: vi.fn(async () => ({
      items: defaultAssignments,
      continuationCursor: null,
      isExhausted: true,
    })),
    getAttributeDefinition: vi.fn(
      async ({ definicionAtributoId }: { definicionAtributoId: unknown }) =>
        definitionsById[String(definicionAtributoId)] ?? null,
    ),
    listAttributeOptions: vi.fn(async () => ({
      items: [
        {
          id: 'opt-fina',
          definicionAtributoId: 'def-opcion',
          clave: 'FINA',
          nombre: 'Fina',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
        },
        {
          id: 'opt-gruesa',
          definicionAtributoId: 'def-opcion',
          clave: 'GRUESA',
          nombre: 'Gruesa',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
        },
      ],
      continuationCursor: null,
      isExhausted: true,
    })),
    ...overrides,
  } as ResourcesMasterApi
}

const renderSurface = (
  api: ResourcesMasterApi,
  props: Omit<ComponentProps<typeof CrearRecursoSurface>, 'api'> = {},
) =>
  render(
    <KeyboardControllerProvider activeSurface="recursos">
      <CrearRecursoSurface api={api} {...props} />
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

const goToStep2 = async (
  user: ReturnType<typeof userEvent.setup>,
  api: ResourcesMasterApi,
) => {
  await user.click(screen.getByRole('button', { name: 'Nuevo recurso' }))
  await waitFor(() => expect(api.listContextClasses).toHaveBeenCalled())
  await chooseOption(user, 'Clase', 'Material')
  await chooseOption(user, 'Familia', 'Áridos')
  await chooseOption(user, 'Tipo', 'Arena')
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled(),
  )
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() =>
    expect(api.listAttributeAssignments).toHaveBeenCalledWith({
      tipoRecursoId: 'type-1',
    }),
  )
}

describe('CrearRecursoSurface — Paso 1 (Contexto)', () => {
  it('opens with the N shortcut on the recursos surface and loads Clases', async () => {
    const api = fakeApi()
    renderSurface(api)
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
        <CrearRecursoSurface api={fakeApi()} />
      </KeyboardControllerProvider>,
    )
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stops at Contrato pendiente after confirming Unidad without legacy calls', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
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
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled(),
    )
    const confirmUnit = screen.getByRole('button', { name: 'Siguiente' })
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
    expect(api.createResource).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Crear recurso' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(
      screen.queryByRole('heading', { name: 'Contrato pendiente' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeVisible()
  })

  it('keeps the shell title for initial and deep snapshot openings', async () => {
    const initial = renderSurface(fakeApi())
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
      screen.getByRole('heading', { name: 'Completá el contexto' }),
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
    expect(within(rail).getByText('Unidad: Metro cúbico')).toHaveAttribute(
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
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
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
        tipoRecursoId: 'type-1',
      }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Unidad natural/ }),
      ).toHaveTextContent('Metro cúbico (m³)'),
    )
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
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
    const unitTrigger = screen.getByRole('button', { name: /Unidad natural/ })
    await user.click(unitTrigger)
    const listbox = await screen.findByRole('listbox')
    expect(
      within(listbox).queryByRole('option', { name: /Tonelada|TON/ }),
    ).not.toBeInTheDocument()
    const kilogramo = within(listbox).getByRole('option', {
      name: /Kilogramo/,
    })
    expect(kilogramo).toBeVisible()
    await user.click(kilogramo)
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

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
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Unidad natural/ }),
      ).toHaveTextContent('Metro cúbico (m³)'),
    )

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
      screen.queryByRole('button', { name: /Unidad natural/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    renderSurface(fakeApi())
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })
    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Creador de recursos' })
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(trigger).toHaveFocus()
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
    await screen.findByRole('button', { name: /Unidad natural/ })

    await user.click(screen.getByRole('button', { name: 'Familia: Áridos' }))
    await chooseOption(user, 'Familia', 'Áridos')
    expect(await screen.findByRole('searchbox', { name: 'Tipo' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Tipo: Arena' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: /Unidad: Metro cúbico/ }),
    ).toBeVisible()

    await user.click(screen.getByRole('option', { name: 'Mortero' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Unidad natural/ }),
      ).toHaveTextContent('Elegir Unidad natural…'),
    )
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
    const unit = await screen.findByRole('button', { name: /Unidad natural/ })
    await waitFor(() => expect(unit).toBeEnabled())
    expect(validApi.listUnitPolicies).toHaveBeenCalledWith({
      tipoRecursoId: 'type-1',
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
      screen.queryByRole('button', { name: /Unidad natural/ }),
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

describe.skip('CrearRecursoSurface — Paso 2 (Atributos dinámicos)', () => {
  it('resolves definitions per effective assignment, ordered, skipping non-effective ones', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)

    await waitFor(() =>
      expect(api.getAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'def-texto',
      }),
    )
    expect(api.getAttributeDefinition).not.toHaveBeenCalledWith({
      definicionAtributoId: 'def-hidden',
    })

    const textInput = await screen.findByLabelText('Observaciones')
    const optionTrigger = screen.getByRole('button', {
      name: /Granulometría \*/,
    })
    const numberInput = screen.getByLabelText('Densidad')
    const booleanTrigger = screen.getByRole('button', { name: /Lavada/ })

    expect(optionTrigger).toHaveAccessibleName(/Granulometría \*/)
    expect(numberInput).toHaveAccessibleName('Densidad')
    expect(numberInput).not.toHaveAccessibleName(/\*/)
    expect(booleanTrigger).toHaveAccessibleName(/Lavada/)
    expect(booleanTrigger).not.toHaveAccessibleName(/\*/)
    expect(textInput.compareDocumentPosition(optionTrigger)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(optionTrigger.compareDocumentPosition(numberInput)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(numberInput.compareDocumentPosition(booleanTrigger)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('renders a Select with the active options for OPCION attributes', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)
    await screen.findByText('Granulometría *')

    await chooseOption(user, 'Granulometría', 'Fina')
    expect(
      screen.getByRole('button', { name: /Granulometría/ }),
    ).toHaveTextContent('Fina')
  })

  it('renders a Sí/No Select for BOOLEANO attributes', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)
    await screen.findByText('Lavada')

    await chooseOption(user, 'Lavada', 'Sí')
    expect(screen.getByRole('button', { name: /Lavada/ })).toHaveTextContent(
      'Sí',
    )
  })

  it('renders plain text/number inputs for TEXTO/NUMERO attributes', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)

    const textInput = await screen.findByLabelText('Observaciones')
    const numberInput = screen.getByLabelText('Densidad')
    expect(textInput).toHaveAttribute('type', 'text')
    expect(numberInput).toHaveAttribute('type', 'number')

    await user.type(textInput, 'Lote de prueba')
    await user.type(numberInput, '1600')
    expect(textInput).toHaveValue('Lote de prueba')
    expect(numberInput).toHaveValue(1600)
  })

  it('validates and focuses only the first missing REQUIRED attribute on Paso 2', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)
    await screen.findByText('Observaciones')

    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(next).toBeEnabled()
    await user.click(next)

    const attributeTrigger = screen.getByRole('button', {
      name: /Granulometría/,
    })
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Seleccioná Granulometría.')
    expect(attributeTrigger).toHaveAttribute('aria-invalid', 'true')
    expect(attributeTrigger).toHaveAttribute('aria-describedby', error.id)
    expect(attributeTrigger).toHaveFocus()
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()

    await chooseOption(user, 'Granulometría', 'Fina')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(attributeTrigger).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('preserves Paso 2 values across Volver / Siguiente without refetching lost state', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)

    const textInput = await screen.findByLabelText('Observaciones')
    await user.type(textInput, 'Lote A')
    await chooseOption(user, 'Granulometría', 'Fina')

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    await screen.findByRole('button', { name: /Clase/ })
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    await screen.findByText('Observaciones')
    expect(screen.getByLabelText('Observaciones')).toHaveValue('Lote A')
    expect(
      screen.getByRole('button', { name: /Granulometría/ }),
    ).toHaveTextContent('Fina')
  })

  it('clears Paso 2 progress and notifies when Tipo changes after values were entered', async () => {
    const api = fakeApi({
      listContextTypes: vi.fn(async () => ({
        items: [
          {
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
          },
          {
            id: 'type-2',
            clave: 'GRAVA',
            nombre: 'Grava',
            activo: true,
            revision: 1,
            effective: true,
            effectiveReasons: [],
            familiaRecursoId: 'family-1',
            aggregateStatus: 'CLEAN',
            violations: [],
          },
        ],
        continuationCursor: null,
        isExhausted: true,
      })),
    })
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)

    const textInput = await screen.findByLabelText('Observaciones')
    await user.type(textInput, 'Lote A')

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    await screen.findByRole('button', { name: /Clase/ })
    await chooseOption(user, 'Tipo', 'Grava')

    expect(
      screen.getByText('Se limpiaron los atributos por cambio de Tipo'),
    ).toBeVisible()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled(),
    )
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByLabelText('Observaciones')).toHaveValue('')
  })
})

const resourceSummary = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'resource-1',
  identificadorTecnico: 'REC-000001',
  nombre: 'Arena fina',
  tipoRecursoId: 'type-1',
  unidadId: 'M3',
  activo: true,
  revision: 1,
  classificationStatus: { state: 'EFFECTIVE', reasons: [] },
  ...overrides,
})

const goToStep3 = async (
  user: ReturnType<typeof userEvent.setup>,
  api: ResourcesMasterApi,
) => {
  await goToStep2(user, api)
  await screen.findByText('Observaciones')
  await chooseOption(user, 'Granulometría', 'Fina')
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  await screen.findByLabelText('Nombre')
}

describe.skip('CrearRecursoSurface — Paso 3 (Revisión y confirmación)', () => {
  it('shows a read-only summary of the chosen context and loaded attribute values', async () => {
    const api = fakeApi()
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep3(user, api)

    expect(screen.getByText('Material')).toBeVisible()
    expect(screen.getByText('Áridos')).toBeVisible()
    expect(screen.getByText('Arena')).toBeVisible()
    expect(screen.getByText('Metro cúbico (m³)')).toBeVisible()
    expect(screen.getByText(/Granulometría: Fina/)).toBeVisible()
  })

  it('validates Nombre before creation and submits the full mapped payload after correction', async () => {
    const createResource = vi.fn(async () => ({
      disposition: 'CREATED' as const,
      item: resourceSummary(),
    }))
    const api = fakeApi({ createResource })
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep2(user, api)
    await screen.findByText('Observaciones')
    await chooseOption(user, 'Granulometría', 'Fina')
    await user.type(screen.getByLabelText('Densidad'), '1600')
    await chooseOption(user, 'Lavada', 'Sí')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByLabelText('Nombre')

    const create = screen.getByRole('button', { name: 'Crear recurso' })
    expect(create).toBeEnabled()
    await user.click(create)

    const nombre = screen.getByLabelText('Nombre')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Ingresá un Nombre.')
    expect(nombre).toHaveAttribute('aria-invalid', 'true')
    expect(nombre).toHaveAttribute('aria-describedby', error.id)
    expect(nombre).toHaveFocus()
    expect(createResource).not.toHaveBeenCalled()

    await user.type(nombre, 'Arena fina')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(nombre).not.toHaveAttribute('aria-invalid', 'true')
    await user.type(screen.getByLabelText('Descripción'), 'Lote de prueba')

    expect(screen.getByRole('button', { name: 'Crear recurso' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    await waitFor(() => expect(createResource).toHaveBeenCalledTimes(1))
    const payload = createResource.mock.calls[0][0]
    expect(payload).toMatchObject({
      claseRecursoId: 'class-1',
      familiaRecursoId: 'family-1',
      tipoRecursoId: 'type-1',
      unidadId: 'M3',
      nombre: 'Arena fina',
      descripcion: 'Lote de prueba',
      ownership: { kind: 'GLOBAL' },
    })
    expect(payload.valores).toEqual(
      expect.arrayContaining([
        {
          atributoRecursoId: 'attr-opcion',
          valor: 'Fina',
          opcionAtributoId: 'opt-fina',
        },
        { atributoRecursoId: 'attr-numero', valor: 1600 },
        { atributoRecursoId: 'attr-bool', valor: true },
      ]),
    )
    expect(payload.valores).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atributoRecursoId: 'attr-texto' }),
      ]),
    )

    expect(await screen.findByText('✓ Recurso creado')).toBeVisible()
    expect(screen.getByText('REC-000001')).toBeVisible()
  })

  it('calls onCreated after a successful submit, and Crear otro resets the wizard', async () => {
    const onCreated = vi.fn()
    const createResource = vi.fn(async () => ({
      disposition: 'CREATED' as const,
      item: resourceSummary(),
    }))
    const api = fakeApi({ createResource })
    const user = userEvent.setup()
    render(
      <KeyboardControllerProvider activeSurface="recursos">
        <CrearRecursoSurface api={api} onCreated={onCreated} />
      </KeyboardControllerProvider>,
    )
    await goToStep3(user, api)
    await user.type(screen.getByLabelText('Nombre'), 'Arena fina')
    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: 'Crear otro' }))
    expect(screen.getByRole('searchbox', { name: 'Clase' })).toBeVisible()
  })

  it('blocks a second submit while the first one is still in flight', async () => {
    let resolveCreate: (value: {
      disposition: 'CREATED'
      item: ReturnType<typeof resourceSummary>
    }) => void
    const createResource = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        }),
    )
    const api = fakeApi({ createResource })
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep3(user, api)
    await user.type(screen.getByLabelText('Nombre'), 'Arena fina')

    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))
    expect(screen.getByRole('button', { name: 'Crear recurso' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))
    expect(createResource).toHaveBeenCalledTimes(1)

    resolveCreate!({ disposition: 'CREATED', item: resourceSummary() })
    await screen.findByText('✓ Recurso creado')
  })

  it('shows a structured message for a recognized admin error code, keeping all data for a manual retry', async () => {
    const createResource = vi.fn(async () => {
      throw { data: { code: 'ADMIN_DUPLICATE_KEY' } }
    })
    const api = fakeApi({ createResource })
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep3(user, api)
    await user.type(screen.getByLabelText('Nombre'), 'Arena fina')
    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    expect(
      await screen.findByText(/Ya existe un recurso con esta combinación/),
    ).toBeVisible()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Arena fina')
    expect(screen.getByRole('button', { name: 'Crear recurso' })).toBeEnabled()
  })

  it('treats an error without a recognized admin code as an uncertain result, with no auto-retry', async () => {
    const createResource = vi.fn(async () => {
      throw new Error('network timeout')
    })
    const api = fakeApi({ createResource })
    const user = userEvent.setup()
    renderSurface(api)
    await goToStep3(user, api)
    await user.type(screen.getByLabelText('Nombre'), 'Arena fina')
    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    expect(
      await screen.findByText(/No pudimos confirmar si el recurso se creó/),
    ).toBeVisible()
    expect(document.body.textContent).not.toContain('network timeout')
    expect(createResource).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('button', { name: 'Reintentar' }),
    ).not.toBeInTheDocument()
    // The exact action that would resubmit the identical payload must be gone
    // entirely — not just renamed — since the write may have already landed.
    expect(
      screen.queryByRole('button', { name: 'Crear recurso' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cerrar y buscar en el listado' }),
    ).toBeEnabled()
  })
})

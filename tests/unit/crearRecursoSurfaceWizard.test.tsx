import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'
import type { Resource } from '../../src/features/resources-master/resourcesMaster.types'
import type { EffectiveAttribute } from '../../src/shared/catalog/effectiveAttributes.contract'

// The wizard confirms an attribute in these tests, which now also triggers
// a POST /evaluate re-check (see useResourceAttributeEvaluation). Stubbed
// to echo the same attributes straight back, so it never touches real
// fetch and never changes what this suite already asserts.
vi.mock(
  '../../src/features/resources-master/resourceAttributeEvaluation.api',
  () => ({
    createResourceAttributeEvaluationApi: () => ({
      evaluateAttributes: async (input: {
        typeCode: string
        classCode: string
        familyCode: string
      }) => ({
        typeCode: input.typeCode,
        attributes: [
          {
            characteristic: {
              code: 'color',
              name: 'Color',
              valueType: 'CONTROLLED_OPTION',
            },
            effectiveMode: 'REQUIRED',
            identityParticipates: false,
            notApplicable: false,
            position: 0,
            hasPosition: false,
            options: [{ code: 'ROJO', label: 'Rojo' }],
            source: { level: 'TYPE', code: 'TUBERIA' },
            rules: [],
          },
        ],
      }),
    }),
  }),
)

const classItem = {
  id: 'class-1',
  code: 'MATERIAL',
  name: 'Materiales',
  active: true,
  revision: '1',
}
const familyItem = {
  ...classItem,
  id: 'family-1',
  code: 'CABLE',
  name: 'Canalizaciones',
  classCode: 'MATERIAL',
}
const typeItem = {
  ...familyItem,
  id: 'type-1',
  code: 'TUBERIA',
  name: 'Tuberías',
  familyCode: 'CABLE',
}
const unitItem = {
  id: 'unit-1',
  code: 'U',
  name: 'Unidad',
  active: true,
  revision: '1',
  symbol: 'u',
  dimension: 'CANTIDAD',
}

const colorAttribute: EffectiveAttribute = {
  characteristic: {
    code: 'color',
    name: 'Color',
    valueType: 'CONTROLLED_OPTION',
  },
  effectiveMode: 'REQUIRED',
  identityParticipates: false,
  notApplicable: false,
  position: 0,
  hasPosition: false,
  options: [{ code: 'ROJO', label: 'Rojo' }],
  source: { level: 'TYPE', code: 'TUBERIA' },
  rules: [],
}

const createdResource: Resource = {
  id: 'resource-1',
  identityV1: 'MATERIAL-CABLE-TUBERIA-0001',
  scope: { classCode: 'MATERIAL', familyCode: 'CABLE', typeCode: 'TUBERIA' },
  naturalUnit: 'U',
  active: true,
  revision: '1',
  attributes: [
    { code: 'color', value: { kind: 'CONTROLLED_OPTION', value: 'ROJO' } },
  ],
}

const buildApi = (
  overrides: Partial<ResourcesMasterRestReadApi> = {},
): ResourcesMasterRestReadApi => ({
  listResources: vi.fn(),
  getResourceDetail: vi.fn(),
  describeResource: vi.fn(),
  listHierarchyClasses: vi.fn(async () => ({
    items: [classItem],
    hasPrevious: false,
    hasNext: false,
  })),
  listHierarchyFamilies: vi.fn(async () => ({
    items: [familyItem],
    hasPrevious: false,
    hasNext: false,
  })),
  listHierarchyTypes: vi.fn(async () => ({
    items: [typeItem],
    hasPrevious: false,
    hasNext: false,
  })),
  listUnits: vi.fn(async () => ({
    items: [unitItem],
    hasPrevious: false,
    hasNext: false,
  })),
  getTypeEffectiveAttributes: vi.fn(async () => ({
    typeCode: 'TUBERIA',
    attributes: [colorAttribute],
  })),
  createResource: vi.fn(async () => createdResource),
  ...overrides,
})

const renderSurface = (
  api: ResourcesMasterRestReadApi,
  onSuccess?: (message: string) => void,
) =>
  render(
    <KeyboardControllerProvider activeSurface="recursos">
      <CrearRecursoSurface api={api} onSuccess={onSuccess} />
    </KeyboardControllerProvider>,
  )

const openWizard = async (
  api: ResourcesMasterRestReadApi,
  onSuccess?: (message: string) => void,
) => {
  const user = userEvent.setup()
  renderSurface(api, onSuccess)
  const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })
  await user.click(trigger)
  await screen.findByRole('dialog', { name: 'Creador de recursos' })
  return { user, trigger }
}

const advanceContextStage = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  optionName: string,
) => {
  const search = await screen.findByRole('searchbox', { name: label })
  expect(search).toHaveFocus()
  await user.click(screen.getByRole('option', { name: optionName }))
}

const reachReview = async (user: ReturnType<typeof userEvent.setup>) => {
  await advanceContextStage(user, 'Clase', 'Materiales')
  await advanceContextStage(user, 'Familia', 'Canalizaciones')
  await advanceContextStage(user, 'Tipo', 'Tuberías')
  await advanceContextStage(user, 'Unidad', 'Unidad (u)')

  await screen.findByRole('searchbox', { name: 'Color *' })
  await user.click(screen.getByRole('option', { name: 'Rojo' }))
  await screen.findByRole('heading', { name: 'Revisión de creación' })
}

describe('CrearRecursoSurface wizard', () => {
  it('completes the happy path from Clase through review, creates the resource, closes the dialog and reports a readable success message', async () => {
    const api = buildApi()
    const onSuccess = vi.fn()
    const { user, trigger } = await openWizard(api, onSuccess)

    await reachReview(user)

    // The compact rail (task 1 of the CLI redesign) also shows the confirmed
    // Clase/Familia/Tipo/Unidad values as its own status lines, so these
    // review-content assertions are scoped to the review section itself.
    const review = screen
      .getByRole('heading', { name: 'Revisión de creación' })
      .closest('section')!
    expect(within(review).getByText('Materiales')).toBeInTheDocument()
    expect(within(review).getByText('Canalizaciones')).toBeInTheDocument()
    expect(within(review).getByText('Tuberías')).toBeInTheDocument()
    expect(within(review).getByText('Unidad (u)')).toBeInTheDocument()
    expect(within(review).getByText('Color')).toBeInTheDocument()
    expect(within(review).getByText('ROJO')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    // Established pattern (see NuevaClaseSurface.tsx): a successful create
    // reports onSuccess and closes the dialog immediately, rather than
    // leaving it open on an inline "created" message.
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
    expect(api.createResource).toHaveBeenCalledTimes(1)
    expect(api.createResource).toHaveBeenCalledWith({
      scope: {
        classCode: 'MATERIAL',
        familyCode: 'CABLE',
        typeCode: 'TUBERIA',
      },
      naturalUnit: 'U',
      attributes: [
        { code: 'color', value: { kind: 'CONTROLLED_OPTION', value: 'ROJO' } },
      ],
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    const [message] = onSuccess.mock.calls[0] as [string]
    expect(message).toContain('Tuberías')
    expect(message).not.toContain(createdResource.identityV1)
    expect(message).not.toMatch(/identityV1|v1\|/i)
  })

  it('shows the generic error message on a failed create with a working Volver a intentar', async () => {
    const api = buildApi({
      createResource: vi.fn(async () => {
        throw new Error('')
      }),
    })
    const { user } = await openWizard(api)
    await reachReview(user)

    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))

    const errorHeading = await screen.findByRole('heading', {
      name: 'No se pudo crear el recurso',
    })
    expect(errorHeading).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo crear el recurso.',
    )

    await user.click(screen.getByRole('button', { name: 'Volver a intentar' }))
    await screen.findByRole('heading', { name: 'Revisión de creación' })
  })

  it('moves back with Escape from a non-editable focus target and closes with Escape from the first stage', async () => {
    const api = buildApi()
    const { user, trigger } = await openWizard(api)

    // ArrowLeft on the first (class) stage, from a focused non-editable
    // option, is a no-op: still the first stage, nothing to move back to.
    await user.keyboard('{ArrowDown}')
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'ArrowLeft',
    })
    expect(
      await screen.findByRole('searchbox', { name: 'Clase' }),
    ).toBeInTheDocument()

    await advanceContextStage(user, 'Clase', 'Materiales')
    const familySearch = await screen.findByRole('searchbox', {
      name: 'Familia',
    })
    expect(familySearch).toHaveFocus()

    // ArrowLeft from a focused (non-editable) option moves back one stage.
    await user.keyboard('{ArrowDown}')
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'ArrowLeft',
    })
    expect(
      await screen.findByRole('searchbox', { name: 'Clase' }),
    ).toHaveFocus()

    // Escape while focused in the (editable) search input still moves back
    // one stage when not on the first stage.
    await advanceContextStage(user, 'Clase', 'Materiales')
    const familySearchAgain = await screen.findByRole('searchbox', {
      name: 'Familia',
    })
    fireEvent.keyDown(familySearchAgain, { key: 'Escape' })
    expect(
      await screen.findByRole('searchbox', { name: 'Clase' }),
    ).toHaveFocus()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Escape on the first stage closes and restores trigger focus.
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Clase' }), {
      key: 'Escape',
    })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })

  it('resets to a clean class stage when reopened after a partial selection', async () => {
    const api = buildApi()
    const { user, trigger } = await openWizard(api)

    await advanceContextStage(user, 'Clase', 'Materiales')
    await screen.findByRole('searchbox', { name: 'Familia' })

    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Familia' }), {
      key: 'Escape',
    })
    fireEvent.keyDown(await screen.findByRole('searchbox', { name: 'Clase' }), {
      key: 'Escape',
    })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Creador de recursos' })
    const search = await screen.findByRole('searchbox', { name: 'Clase' })
    expect(search).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: 'Elegí una Clase' }),
    ).toBeInTheDocument()
    expect(api.listHierarchyClasses).toHaveBeenCalledTimes(2)
  })
})

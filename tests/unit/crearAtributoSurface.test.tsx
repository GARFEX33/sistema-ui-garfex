import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CrearAtributoSurface } from '../../src/features/catalog-hierarchy/CrearAtributoSurface'

const context = {
  classCode: 'MATERIAL',
  familyCode: 'AISLANTES',
  sessionId: 'catalog-session',
  typeCode: 'LANA',
}
const existingCharacteristic = {
  active: true,
  code: 'DENSITY',
  id: '4',
  kind: 'CARACTERISTICA',
  name: 'Densidad',
  revision: '0',
  rules: [],
  valueType: 'DECIMAL',
}
const existingSearch = (records = [existingCharacteristic]) => ({
  error: null,
  generation: 1,
  input: { text: 'dens', limit: 50, offset: 0 },
  key: 'existing',
  page: { hasNext: false, hasPrevious: false, records },
  status: 'ready',
})
const controller = (overrides = {}) =>
  ({
    assignExisting: vi.fn().mockResolvedValue(true),
    characteristicOrigin: null,
    clearExistingSearch: vi.fn(),
    continuePendingStep: vi.fn(),
    draft: null,
    existingSearch: {
      error: null,
      generation: 0,
      input: null,
      key: null,
      page: null,
      status: 'idle',
    },
    rereadCore: vi.fn(),
    retained: [],
    searchExisting: vi.fn().mockResolvedValue(true),
    status: 'idle',
    steps: [
      { name: 'characteristic', status: 'not-started' },
      { name: 'applicability', status: 'not-started' },
      { name: 'presentation', status: 'not-started' },
    ],
    submit: vi.fn().mockResolvedValue(true),
    ...overrides,
  }) as never
const surface = (
  creation = controller(),
  actorAvailable = true,
  value = context,
  effectiveStatus: 'ready' | 'empty' | 'loading' | 'waiting-context' = 'ready',
  effectiveFresh = true,
  effectiveCharacteristicCodes: readonly string[] = [],
) => (
  <CrearAtributoSurface
    actorAvailable={actorAvailable}
    context={value}
    creation={creation}
    effectiveCharacteristicCodes={effectiveCharacteristicCodes}
    effectiveFresh={effectiveFresh}
    effectiveStatus={effectiveStatus}
  />
)

const openAdvanced = async (user: ReturnType<typeof userEvent.setup>) => {
  const advanced = screen.getByRole('button', {
    name: 'Configuración avanzada',
  })
  advanced.focus()
  await user.keyboard('{Enter}')
  return advanced
}

describe('CrearAtributoSurface', () => {
  it('gates incomplete context and restores focus after Escape', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      surface(controller(), true, { ...context, typeCode: '' }),
    )
    expect(
      screen.getByRole('button', { name: 'Crear atributo' }),
    ).toBeDisabled()
    rerender(surface())
    const trigger = screen.getByRole('button', { name: 'Crear atributo' })
    await user.click(trigger)
    expect(
      screen.getByRole('region', { name: 'Contexto del atributo' }),
    ).toHaveTextContent(/MATERIAL.*AISLANTES.*LANA/)
    expect(
      screen.getByRole('note', { name: 'Impacto global de la característica' }),
    ).toHaveTextContent('todas las Familias y Tipos')
    expect(screen.getByRole('textbox', { name: 'Código' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('shows required position with Advanced collapsed and preserves default advanced values', async () => {
    const user = userEvent.setup()
    render(surface())
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    const advanced = screen.getByRole('button', {
      name: 'Configuración avanzada',
    })
    expect(advanced).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('spinbutton', { name: 'Posición' })).toBeVisible()
    expect(
      screen.queryByRole('combobox', { name: 'Tipo de valor' }),
    ).not.toBeInTheDocument()
    await openAdvanced(user)
    expect(advanced).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('combobox', { name: 'Tipo de valor' })).toHaveValue(
      'CONTROLLED_TEXT',
    )
    expect(screen.getByRole('combobox', { name: 'Modo' })).toHaveValue(
      'OPTIONAL',
    )
    expect(screen.getAllByRole('checkbox')[0]?.parentElement).toHaveTextContent(
      'Al activarlo, este atributo pasa a formar parte de la identidad del Recurso.',
    )
  })

  it('focuses required position when submission has no order', async () => {
    const user = userEvent.setup(),
      creation = controller()
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.type(screen.getByRole('textbox', { name: 'Código' }), 'WEIGHT')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Peso')
    await user.click(screen.getByRole('checkbox', { name: /no es atómica/ }))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    expect(
      screen.getByText('Indicá una posición entera positiva en este Tipo.'),
    ).toBeVisible()
    expect(creation.submit).not.toHaveBeenCalled()
  })

  it('submits the exact draft and retains the explicit option follow-up', async () => {
    const user = userEvent.setup(),
      creation = controller()
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.type(screen.getByRole('textbox', { name: 'Código' }), 'DENSITY')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Densidad')
    await openAdvanced(user)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo de valor' }),
      'CONTROLLED_OPTION',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Modo' }),
      'REQUIRED',
    )
    await user.type(screen.getByRole('spinbutton', { name: 'Posición' }), '4')
    expect(
      screen.queryByRole('option', { name: 'CONDITIONAL' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/regla/i)).not.toBeInTheDocument()
    expect(
      screen.getByText('No se asigna un conjunto de opciones en esta versión.'),
    ).toBeVisible()
    await user.click(screen.getByRole('checkbox', { name: /no es atómica/ }))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    expect(creation.submit).toHaveBeenCalledWith({
      code: 'DENSITY',
      identityParticipates: false,
      mode: 'REQUIRED',
      name: 'Densidad',
      position: '4',
      valueType: 'CONTROLLED_OPTION',
    })
  })

  it('invalidates changed context safely and retains in-flight partial state', async () => {
    const user = userEvent.setup()
    const { rerender } = render(surface())
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    rerender(surface(controller(), true, { ...context, typeCode: 'OTRO' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear atributo' })).toHaveFocus()
    rerender(surface(controller({ status: 'pending' })))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    rerender(
      surface(controller({ status: 'idle' }), true, {
        ...context,
        typeCode: 'OTRO',
      }),
    )
    expect(screen.getByText(/resultado parcial/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('keeps trigger and footer reasons uniquely described during context invalidation', async () => {
    const user = userEvent.setup()
    const { rerender } = render(surface(controller({ status: 'pending' })))
    const trigger = screen.getByRole('button', { name: 'Crear atributo' })
    await user.click(trigger)
    rerender(
      surface(controller({ status: 'idle' }), true, {
        ...context,
        typeCode: '',
      }),
    )

    const action = screen.getByRole('button', { name: 'Crear atributo' })
    const triggerReasonId = trigger.getAttribute('aria-describedby')
    const footerReasonId = action.getAttribute('aria-describedby')
    expect(screen.getByRole('dialog', { name: 'Crear atributo' })).toBeVisible()
    expect(triggerReasonId).toBeTruthy()
    expect(footerReasonId).toBeTruthy()
    expect(triggerReasonId).not.toBe(footerReasonId)
    expect(document.getElementById(triggerReasonId ?? '')).toHaveTextContent(
      'Seleccioná Clase, Familia y Tipo antes de crear un atributo.',
    )
    expect(document.getElementById(footerReasonId ?? '')).toHaveTextContent(
      'El contexto cambió durante la creación.',
    )
  })

  it('blocks a new confirmation while a prior ledger needs reconciliation', async () => {
    const user = userEvent.setup()
    render(surface(controller({ status: 'reconciliation-required' })))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    expect(
      screen.getByRole('button', { name: 'Crear atributo' }),
    ).toBeDisabled()
    expect(
      screen.getByText(/operación anterior sigue sin resolver/),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Releer desde Core' }),
    ).toBeVisible()
  })

  it('shows ordered partial-step status and offers only a safe Core reread', async () => {
    const user = userEvent.setup()
    const creation = controller({
      status: 'partial',
      steps: [
        { name: 'characteristic', status: 'confirmed' },
        {
          error: new Error('La aplicabilidad no pudo confirmarse.'),
          name: 'applicability',
          status: 'failed',
        },
        { name: 'presentation', status: 'not-started' },
      ],
    })
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    expect(
      screen.getByRole('list', { name: 'Estado de los pasos de creación' }),
    ).toHaveTextContent(
      /CARACTERÍSTICA Confirmada.*APLICABILIDAD Fallida.*PRESENTACIÓN Pendiente/,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La aplicabilidad no pudo confirmarse.',
    )
    expect(screen.getByText(/quedó parcialmente aplicada/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Releer desde Core' }))
    expect(creation.rereadCore).toHaveBeenCalledOnce()
  })

  it('offers an accessible existing-characteristic path beside creation', async () => {
    const user = userEvent.setup(),
      creation = controller()
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))

    expect(
      screen.getByRole('searchbox', {
        name: 'Buscar característica existente',
      }),
    ).toHaveFocus()
    expect(screen.getByRole('combobox', { name: 'Modo' })).toBeVisible()
    expect(
      screen.getByRole('checkbox', { name: /Participa de identidad/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('spinbutton', { name: 'Posición en el Tipo' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Configuración avanzada' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Código' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Buscar' })).toBeNull()
    expect(creation.searchExisting).toHaveBeenCalledWith({
      text: '',
      limit: 50,
      offset: 0,
    })
  })

  it('resets existing-assignment confirmation for every changed configuration input', async () => {
    const user = userEvent.setup()
    const creation = controller({
      existingSearch: {
        error: null,
        generation: 1,
        input: { text: 'dens', limit: 50, offset: 0 },
        key: 'existing',
        page: {
          hasNext: false,
          hasPrevious: false,
          records: [existingCharacteristic],
        },
        status: 'ready',
      },
    })
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    const confirmation = screen.getByRole('checkbox', {
      name: /asignación reutiliza/,
    })
    const confirm = async () => {
      await user.click(confirmation)
      expect(confirmation).toBeChecked()
    }

    await user.click(screen.getByRole('button', { name: /Densidad/ }))
    await user.type(
      screen.getByRole('spinbutton', { name: 'Posición en el Tipo' }),
      '2',
    )
    await confirm()
    await user.click(screen.getByRole('button', { name: /Densidad/ }))
    expect(confirmation).not.toBeChecked()

    await confirm()
    await user.type(
      screen.getByRole('spinbutton', { name: 'Posición en el Tipo' }),
      '3',
    )
    expect(confirmation).not.toBeChecked()
    await confirm()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Modo' }),
      'REQUIRED',
    )
    expect(confirmation).not.toBeChecked()
    await confirm()
    await user.click(
      screen.getByRole('checkbox', { name: /Participa de identidad/ }),
    )
    expect(confirmation).not.toBeChecked()
    await confirm()
    await user.click(screen.getByRole('button', { name: 'Crear nueva' }))
    expect(
      screen.getByRole('checkbox', { name: /creación tiene tres pasos/ }),
    ).not.toBeChecked()
  })

  it('blocks global assignment eligibility while preserving inspection search', async () => {
    const user = userEvent.setup()
    const cases = [
      {
        actorAvailable: false,
        creation: controller({ existingSearch: existingSearch() }),
        effectiveFresh: true,
        reason: 'No se puede crear hasta contar con un actor válido.',
      },
      {
        actorAvailable: true,
        creation: controller({ existingSearch: existingSearch() }),
        effectiveFresh: false,
        reason:
          'Esperá atributos efectivos actuales antes de asignar una característica existente.',
      },
      {
        actorAvailable: true,
        creation: controller({
          existingSearch: existingSearch(),
          status: 'partial',
        }),
        effectiveFresh: true,
        reason:
          'La operación anterior sigue sin resolver. Podés releer desde Core, pero no iniciar otra creación o asignación.',
      },
    ]

    for (const testCase of cases) {
      const view = render(
        surface(
          testCase.creation,
          testCase.actorAvailable,
          context,
          'ready',
          testCase.effectiveFresh,
        ),
      )
      await user.click(view.getByRole('button', { name: 'Crear atributo' }))
      await user.click(view.getByRole('button', { name: 'Usar existente' }))
      expect(view.getByText(testCase.reason)).toBeVisible()
      expect(view.getByRole('button', { name: /Densidad/ })).toBeDisabled()
      expect(
        view.getByRole('searchbox', {
          name: 'Buscar característica existente',
        }),
      ).toBeEnabled()
      expect(
        view.getByRole('button', { name: 'Agregar al Tipo' }),
      ).toBeDisabled()
      expect(testCase.creation.assignExisting).not.toHaveBeenCalled()
      view.unmount()
    }
  })

  it('loads initially and debounces live filtering from the accessible search input', async () => {
    const user = userEvent.setup()
    const creation = controller()
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    expect(creation.searchExisting).toHaveBeenCalledWith({
      text: '',
      limit: 50,
      offset: 0,
    })
    creation.searchExisting.mockClear()
    vi.useFakeTimers()
    try {
      fireEvent.change(
        screen.getByRole('searchbox', {
          name: 'Buscar característica existente',
        }),
        { target: { value: ' dens ' } },
      )
      act(() => vi.advanceTimersByTime(249))
      expect(creation.searchExisting).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(1))
      expect(creation.searchExisting).toHaveBeenCalledWith({
        text: 'dens',
        limit: 50,
        offset: 0,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('paginates with the hook-committed query rather than the input draft', async () => {
    const user = userEvent.setup()
    const creation = controller({
      existingSearch: {
        error: null,
        contextGeneration: 0,
        generation: 1,
        input: { text: 'dens', limit: 50, offset: 0 },
        key: JSON.stringify([
          'catalog-session',
          'MATERIAL',
          'AISLANTES',
          'LANA',
        ]),
        page: { records: [], hasPrevious: false, hasNext: true },
        status: 'ready',
      },
    })
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    creation.searchExisting.mockClear()
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(creation.searchExisting).toHaveBeenCalledWith({
      text: 'dens',
      limit: 50,
      offset: 50,
    })
  })

  it('uses Enter in existing search exactly once without assigning the selected record', async () => {
    const user = userEvent.setup()
    const selected = {
      kind: 'CARACTERISTICA',
      id: '4',
      revision: '0',
      active: true,
      code: 'DENSITY',
      name: 'Densidad',
      valueType: 'DECIMAL',
      rules: [],
    }
    const creation = controller({
      existingSearch: {
        error: null,
        contextGeneration: 0,
        generation: 1,
        input: { text: 'dens', limit: 50, offset: 0 },
        key: JSON.stringify([
          'catalog-session',
          'MATERIAL',
          'AISLANTES',
          'LANA',
        ]),
        page: { records: [selected], hasPrevious: false, hasNext: false },
        status: 'ready',
      },
    })
    render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    creation.searchExisting.mockClear()
    const result = screen.getByRole('button', { name: /Densidad/ })
    result.focus()
    await user.keyboard('{Enter}')
    expect(result).toHaveAttribute('aria-pressed', 'true')
    expect(result).toHaveTextContent('Seleccionada')
    expect(
      screen.getByText('Seleccionada: Densidad · DENSITY · DECIMAL'),
    ).toBeVisible()
    await user.click(
      screen.getByRole('checkbox', { name: /asignación reutiliza/ }),
    )
    await user.type(
      screen.getByRole('searchbox', {
        name: 'Buscar característica existente',
      }),
      'density{Enter}',
    )
    expect(creation.searchExisting).toHaveBeenCalledTimes(1)
    expect(creation.searchExisting).toHaveBeenCalledWith({
      text: 'density',
      limit: 50,
      offset: 0,
    })
    expect(creation.assignExisting).not.toHaveBeenCalled()
  })

  it('blocks retained effective projections until freshness is restored', async () => {
    const user = userEvent.setup()
    const selected = {
      kind: 'CARACTERISTICA',
      id: '4',
      revision: '0',
      active: true,
      code: 'DENSITY',
      name: 'Densidad',
      valueType: 'DECIMAL',
      rules: [],
    }
    const creation = controller({
      existingSearch: {
        error: null,
        contextGeneration: 0,
        generation: 1,
        input: { text: 'dens', limit: 50, offset: 0 },
        key: JSON.stringify([
          'catalog-session',
          'MATERIAL',
          'AISLANTES',
          'LANA',
        ]),
        page: { records: [selected], hasPrevious: false, hasNext: false },
        status: 'ready',
      },
    })
    render(surface(creation, true, context, 'ready', false))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    expect(screen.getByRole('button', { name: /Densidad/ })).toBeDisabled()
    expect(
      screen.getByText(
        'Esperá atributos efectivos actuales antes de asignar una característica existente.',
      ),
    ).toBeVisible()
    const search = screen.getByRole('searchbox', {
      name: 'Buscar característica existente',
    })
    expect(search).toBeEnabled()
    creation.searchExisting.mockClear()
    await user.type(search, 'density{Enter}')
    expect(creation.searchExisting).toHaveBeenCalledWith({
      text: 'density',
      limit: 50,
      offset: 0,
    })
    expect(
      screen.getByRole('button', { name: 'Agregar al Tipo' }),
    ).toBeDisabled()
    expect(creation.assignExisting).not.toHaveBeenCalled()
  })

  it('reuses an active search selection with immutable value type and blocks an effective duplicate', async () => {
    const user = userEvent.setup()
    const selected = {
      kind: 'CARACTERISTICA',
      id: '4',
      revision: '0',
      active: true,
      code: 'DENSITY',
      name: 'Densidad',
      valueType: 'DECIMAL',
      rules: [],
    }
    const alternative = {
      ...selected,
      code: 'WEIGHT',
      id: '5',
      name: 'Peso',
    }
    const creation = controller({
      existingSearch: {
        error: null,
        generation: 1,
        input: { text: 'dens', limit: 50, offset: 0 },
        key: JSON.stringify([
          'catalog-session',
          'MATERIAL',
          'AISLANTES',
          'LANA',
        ]),
        page: {
          records: [selected, alternative],
          hasPrevious: false,
          hasNext: false,
        },
        status: 'ready',
      },
    })
    const first = render(surface(creation))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.click(screen.getByRole('button', { name: 'Usar existente' }))
    expect(screen.getByRole('button', { name: /Densidad/ })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /Densidad/ }))
    await user.type(
      screen.getByRole('spinbutton', { name: 'Posición en el Tipo' }),
      '2',
    )
    await user.click(
      screen.getByRole('checkbox', { name: /asignación reutiliza/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Agregar al Tipo' }))
    expect(creation.assignExisting).toHaveBeenCalledOnce()
    expect(creation.assignExisting).toHaveBeenCalledWith({
      characteristic: selected,
      identityParticipates: false,
      mode: 'OPTIONAL',
      position: '2',
    })
    first.rerender(surface(creation, true, context, 'ready', true, ['DENSITY']))
    expect(
      screen.getByText(
        'La característica seleccionada ya es efectiva en este Tipo.',
      ),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Agregar al Tipo' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: /Densidad/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Peso/ })).toBeEnabled()
    expect(creation.assignExisting).toHaveBeenCalledOnce()
  })

  it('preserves draft and fails closed for actor, errors, and pending Escape', async () => {
    const user = userEvent.setup()
    const failed = controller({
      status: 'partial',
      steps: [{ error: new Error('La aplicabilidad no pudo confirmarse.') }],
    })
    const { rerender } = render(surface(failed, false))
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }))
    await user.type(screen.getByRole('textbox', { name: 'Código' }), 'WEIGHT')
    expect(screen.getByText(/actor válido/)).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La aplicabilidad no pudo confirmarse.',
    )
    rerender(surface(controller({ status: 'pending' })))
    expect(screen.getByRole('textbox', { name: 'Código' })).toHaveValue(
      'WEIGHT',
    )
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Releer desde Core' }),
    ).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Crear atributo' })).toBeVisible()
  })
})

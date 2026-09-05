import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AsignarAtributoSurface } from '../../src/features/catalog-hierarchy/AsignarAtributoSurface'
import type { CatalogTypeAttributesApi } from '../../src/features/catalog-hierarchy/catalogTypeAttributes.api'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const definition = (id: string, nombre: string, clave: string) => ({
  activo: true,
  clave,
  effective: true,
  effectiveReasons: [],
  id,
  nombre,
  revision: 1,
  tipoDato: 'TEXTO' as const,
})
const assignment = (
  id: string,
  definitionId: string,
  direct = true,
  orden = 1,
) => ({
  activo: true,
  aplicabilidad: 'OPTIONAL' as const,
  definicionAtributoId: definitionId,
  effective: true,
  effectiveReasons: [],
  familiaRecursoId: 'family-1',
  id,
  orden,
  participaIdentidad: false,
  revision: 1,
  selection: 'SELECTED' as const,
  ...(direct ? { tipoRecursoId: 'type-1' } : {}),
})
const page = <T,>(
  items: T[],
  isExhausted = true,
  continuationCursor: string | null = null,
) => ({
  continuationCursor,
  isExhausted,
  items,
})

describe('Asignar atributo surface', () => {
  it('filters local definition pages, preserves inherited eligibility, and configures inactive defaults', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi
        .fn()
        .mockResolvedValueOnce(
          page(
            [
              definition('direct', 'Material', 'MATERIAL'),
              definition('inherited', 'Peso', 'PESO'),
            ],
            false,
            'next',
          ),
        )
        .mockResolvedValueOnce(page([definition('second', 'Color', 'COLOR')])),
      createTypeAttributeAssignment: vi.fn(),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[
          assignment('direct-assignment', 'direct'),
          assignment('inherited-assignment', 'inherited', false, 4),
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    expect(
      screen.getByRole('dialog', { name: 'Asignar atributo' }),
    ).toBeVisible()
    expect(screen.getByText('Familia A')).toBeVisible()
    expect(screen.getByText('Tipo A')).toBeVisible()
    expect(await screen.findByText('Material')).toBeVisible()
    expect(screen.getByRole('button', { name: /Material/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Peso/ })).toBeEnabled()

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar atributo' }),
      'pes',
    )
    expect(screen.queryByText('Material')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Peso/ }))
    expect(screen.getByRole('combobox', { name: 'Aplicabilidad' })).toHaveValue(
      'OPTIONAL',
    )
    expect(screen.getByRole('spinbutton', { name: 'Orden' })).toHaveValue(5)
    expect(
      screen.getByRole('checkbox', { name: 'Participa de identidad' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('button', { name: 'Guardar asignación' }),
    ).toBeEnabled()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Cargar más atributos' }),
    )
    expect(await screen.findByText('Color')).toBeVisible()
  })

  it('maps nested ADMIN_DUPLICATE_KEY to an assignment conflict, refreshes safely, and closes after retry', async () => {
    const user = userEvent.setup()
    let resolve!: () => void
    const refresh = new Promise<void>((done) => {
      resolve = done
    })
    let rejectDuplicate!: (cause: unknown) => void
    const duplicate = new Promise<never>((_, reject) => {
      rejectDuplicate = reject
    })
    const create = vi
      .fn()
      .mockReturnValueOnce(duplicate)
      .mockResolvedValueOnce({
        disposition: 'CREATED',
        item: assignment('created', 'definition-1'),
      })
    const onCreated = vi.fn(() => refresh)
    const api = {
      listAttributeDefinitions: vi
        .fn()
        .mockResolvedValue(
          page([definition('definition-1', 'Material', 'MATERIAL')]),
        ),
      createTypeAttributeAssignment: create,
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
        onCreated={onCreated}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Asignar atributo' })
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: /Material/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar asignación' }))
    await user.click(screen.getByRole('button', { name: 'Guardar asignación' }))
    expect(create).toHaveBeenCalledTimes(1)
    rejectDuplicate({ data: { code: 'ADMIN_DUPLICATE_KEY' } })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este atributo ya está asignado al Tipo.',
      ),
    )
    expect(onCreated).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Guardar asignación' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2))
    expect(create).toHaveBeenCalledTimes(2)
    expect(create).toHaveBeenLastCalledWith({
      activo: false,
      aplicabilidad: 'OPTIONAL',
      definicionAtributoId: 'definition-1',
      familiaRecursoId: 'family-1',
      orden: 1,
      participaIdentidad: false,
      tipoRecursoId: 'type-1',
    })
    expect(screen.getByRole('dialog')).toBeVisible()
    resolve()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise<void>((done) => requestAnimationFrame(() => done()))
    expect(trigger).toHaveFocus()
  })

  it('keeps the selected form for a stable friendly retry after an unstructured error', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi
        .fn()
        .mockResolvedValue(
          page([definition('definition-1', 'Material', 'MATERIAL')]),
        ),
      createTypeAttributeAssignment: vi
        .fn()
        .mockRejectedValue(new Error('transport secret /token')),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    await user.click(await screen.findByRole('button', { name: /Material/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar asignación' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo asignar el atributo. Intentá nuevamente.',
      ),
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('/token')
    expect(screen.getByRole('button', { name: /Material/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('moves a new definition through two steps without persisting its preserved draft', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi.fn().mockResolvedValue(page([])),
      createAttributeDefinition: vi.fn(),
      createTypeAttributeAssignment: vi.fn(),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Crear atributo nuevo' }),
    )
    expect(screen.getByText('1 Definición')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('2 Asignación')).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue('')
    expect(screen.getByText('Valores predefinidos')).toBeVisible()
    expect(screen.getByText('Ejemplo: Color → Blanco, Negro.')).toBeVisible()
    expect(
      screen.getByText(
        'Los valores permitidos se administran después de crear el atributo.',
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole('combobox', { name: 'Tipo de dato' }),
    ).not.toBeInTheDocument()
    const changeType = screen.getByRole('button', { name: 'Cambiar tipo' })
    expect(changeType).toBeVisible()
    expect(
      screen
        .getAllByRole('button')
        .slice(-3)
        .map((button) => button.textContent),
    ).toEqual(['Cambiar tipo', 'Cancelar', 'Continuar'])

    await user.click(changeType)
    const tipoDato = screen.getByRole('combobox', { name: 'Tipo de dato' })
    expect(tipoDato).toHaveValue('OPCION')
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Valores predefinidos', 'Texto libre', 'Número', 'Sí / No'])
    await user.selectOptions(tipoDato, 'TEXTO')
    expect(
      screen.getByText('Ejemplo: Observación → Revisar instalación.'),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Guarda texto sin validarlo como número, opción o respuesta sí/no.',
      ),
    ).toBeVisible()
    await user.selectOptions(tipoDato, 'BOOLEANO')
    expect(
      screen.getByText('Ejemplo: Requiere mantenimiento → Sí.'),
    ).toBeVisible()
    expect(screen.getByText('Guarda una respuesta de sí o no.')).toBeVisible()
    await user.selectOptions(tipoDato, 'NUMERO')
    expect(screen.getByText('Ejemplo: Peso → 12,5.')).toBeVisible()
    expect(screen.getByText('Valida y guarda un número.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingresá una clave y un nombre para crear el atributo.',
    )
    expect(api.createAttributeDefinition).not.toHaveBeenCalled()

    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'PESO')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Peso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('2 Asignación')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('1 Definición')).not.toHaveAttribute('aria-current')
    expect(screen.getByText('Resumen de definición')).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Resumen de definición' }),
    ).toHaveTextContent('Número')
    expect(
      screen.getByText(
        'La definición y la asignación se crearán inicialmente inactivas.',
      ),
    ).toBeVisible()
    expect(
      screen.getByRole('combobox', { name: 'Aplicabilidad' }),
    ).toHaveFocus()
    expect(api.createAttributeDefinition).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Crear y asignar' }),
    ).toBeVisible()
    expect(
      screen
        .getAllByRole('button')
        .slice(-3)
        .map((button) => button.textContent),
    ).toEqual(['Cancelar', 'Atrás', 'Crear y asignar'])

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('PESO')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Peso')
    expect(screen.getByRole('combobox', { name: 'Tipo de dato' })).toHaveValue(
      'NUMERO',
    )
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveFocus()
    await user.click(
      screen.getByRole('button', { name: 'Volver a atributos existentes' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('')
    expect(api.createAttributeDefinition).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Crear atributo nuevo' }),
    )
    expect(screen.getByText('Valores predefinidos')).toBeVisible()
    expect(
      screen.queryByRole('combobox', { name: 'Tipo de dato' }),
    ).not.toBeInTheDocument()
  })

  it('maps direct ADMIN_DUPLICATE_KEY to a definition conflict without assigning the preserved draft', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi.fn().mockResolvedValue(page([])),
      createAttributeDefinition: vi
        .fn()
        .mockRejectedValue({ code: 'ADMIN_DUPLICATE_KEY' }),
      createTypeAttributeAssignment: vi.fn(),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Crear atributo nuevo' }),
    )
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'PESO')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Peso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Crear y asignar' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ya existe un atributo con esa clave.',
      ),
    )
    expect(
      screen.getByRole('region', { name: 'Resumen de definición' }),
    ).toHaveTextContent('PESO')
    expect(api.createTypeAttributeAssignment).not.toHaveBeenCalled()
  })

  it('creates once, then retries only the failed assignment before refreshing and restoring focus', async () => {
    const user = userEvent.setup()
    let resolveDefinition!: (value: {
      disposition: 'CREATED'
      item: ReturnType<typeof definition>
    }) => void
    const creation = new Promise<{
      disposition: 'CREATED'
      item: ReturnType<typeof definition>
    }>((resolve) => {
      resolveDefinition = resolve
    })
    const createDefinition = vi.fn().mockReturnValue(creation)
    const createAssignment = vi
      .fn()
      .mockRejectedValueOnce(new Error('assignment unavailable'))
      .mockResolvedValueOnce({
        disposition: 'CREATED',
        item: assignment('assigned', 'definition-new'),
      })
    const onCreated = vi.fn()
    const onSuccess = vi.fn()
    const api = {
      listAttributeDefinitions: vi.fn().mockResolvedValue(page([])),
      createAttributeDefinition: createDefinition,
      createTypeAttributeAssignment: createAssignment,
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
        onCreated={onCreated}
        onSuccess={onSuccess}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Asignar atributo' })

    await user.click(trigger)
    await user.click(
      screen.getByRole('button', { name: 'Crear atributo nuevo' }),
    )
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'PESO')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Peso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Crear y asignar' }))
    await user.click(screen.getByRole('button', { name: 'Crear y asignar' }))
    expect(createDefinition).toHaveBeenCalledTimes(1)
    resolveDefinition({
      disposition: 'CREATED',
      item: definition('definition-new', 'Peso', 'PESO'),
    })

    await waitFor(() =>
      expect(createAssignment).toHaveBeenCalledWith({
        activo: false,
        aplicabilidad: 'OPTIONAL',
        definicionAtributoId: 'definition-new',
        familiaRecursoId: 'family-1',
        orden: 1,
        participaIdentidad: false,
        tipoRecursoId: 'type-1',
      }),
    )
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'La definición fue creada, pero no se asignó al Tipo.',
      ),
    )
    expect(
      screen.queryByRole('button', { name: 'Volver a atributos existentes' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Atrás' }),
    ).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole('button')
        .slice(-2)
        .map((button) => button.textContent),
    ).toEqual(['Cancelar', 'Reintentar asignación'])

    await user.click(
      screen.getByRole('button', { name: 'Reintentar asignación' }),
    )
    await waitFor(() => expect(createAssignment).toHaveBeenCalledTimes(2))
    expect(createDefinition).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    await new Promise<void>((done) => requestAnimationFrame(() => done()))
    expect(trigger).toHaveFocus()
    expect(onSuccess).toHaveBeenCalledWith('Atributo “Peso” creado y asignado.')
  })

  it('moves through chooser controls in DOM order, skips direct assignments, clamps, and keeps Escape closing', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi
        .fn()
        .mockResolvedValue(
          page(
            [
              definition('direct', 'Material', 'MATERIAL'),
              definition('peso', 'Peso', 'PESO'),
              definition('color', 'Color', 'COLOR'),
            ],
            false,
            'next',
          ),
        ),
      createTypeAttributeAssignment: vi.fn(),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[assignment('direct-assignment', 'direct')]}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Asignar atributo' })
    await user.click(trigger)
    const search = screen.getByRole('searchbox', { name: 'Buscar atributo' })
    const create = screen.getByRole('button', { name: 'Crear atributo nuevo' })
    const peso = await screen.findByRole('button', { name: /Peso/ })
    const color = screen.getByRole('button', { name: /Color/ })
    const loadMore = screen.getByRole('button', {
      name: 'Cargar más atributos',
    })

    expect(search).toHaveFocus()
    fireEvent.keyDown(search, { key: 'ArrowUp' })
    expect(create).toHaveFocus()
    fireEvent.keyDown(create, { key: 'ArrowUp' })
    expect(create).toHaveFocus()
    fireEvent.keyDown(create, { key: 'ArrowDown' })
    expect(search).toHaveFocus()
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(peso).toHaveFocus()
    fireEvent.keyDown(peso, { key: 'ArrowDown' })
    expect(color).toHaveFocus()

    await user.click(color)
    fireEvent.keyDown(color, { key: 'ArrowDown' })
    expect(loadMore).toHaveFocus()
    fireEvent.keyDown(loadMore, { key: 'ArrowDown' })
    expect(
      screen.getByRole('combobox', { name: 'Aplicabilidad' }),
    ).toHaveFocus()

    const identity = screen.getByRole('checkbox', {
      name: 'Participa de identidad',
    })
    identity.focus()
    fireEvent.keyDown(identity, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cancelar' }), {
      key: 'ArrowDown',
    })
    const submit = screen.getByRole('button', { name: 'Guardar asignación' })
    expect(submit).toHaveFocus()
    fireEvent.keyDown(submit, { key: 'ArrowDown' })
    expect(submit).toHaveFocus()

    fireEvent.keyDown(submit, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await new Promise<void>((done) => requestAnimationFrame(() => done()))
    expect(trigger).toHaveFocus()
  })

  it('moves through the create form while preserving native Arrow keys for excluded widgets', async () => {
    const user = userEvent.setup()
    const api = {
      listAttributeDefinitions: vi.fn().mockResolvedValue(page([])),
      createAttributeDefinition: vi.fn(),
      createTypeAttributeAssignment: vi.fn(),
    } as unknown as CatalogTypeAttributesApi
    render(
      <AsignarAtributoSurface
        api={api}
        family={{ id: 'family-1', label: 'Familia A' }}
        type={{ id: 'type-1', label: 'Tipo A' }}
        assignments={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Asignar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Crear atributo nuevo' }),
    )
    const clave = screen.getByRole('textbox', { name: 'Clave' })
    const nombre = screen.getByRole('textbox', { name: 'Nombre' })
    const descripcion = screen.getByRole('textbox', { name: 'Descripción' })
    const changeType = screen.getByRole('button', { name: 'Cambiar tipo' })

    expect(clave).toHaveFocus()
    expect(fireEvent.keyDown(clave, { key: 'ArrowDown', shiftKey: true })).toBe(
      true,
    )
    expect(clave).toHaveFocus()
    expect(
      fireEvent.keyDown(clave, { key: 'ArrowDown', isComposing: true }),
    ).toBe(true)
    expect(clave).toHaveFocus()
    fireEvent.keyDown(clave, { key: 'ArrowDown' })
    expect(nombre).toHaveFocus()

    nombre.setAttribute('role', 'listbox')
    expect(fireEvent.keyDown(nombre, { key: 'ArrowDown' })).toBe(true)
    expect(nombre).toHaveFocus()
    nombre.removeAttribute('role')
    fireEvent.keyDown(nombre, { key: 'ArrowDown' })
    expect(descripcion).toHaveFocus()
    expect(fireEvent.keyDown(descripcion, { key: 'ArrowDown' })).toBe(true)
    expect(descripcion).toHaveFocus()
    changeType.focus()
    fireEvent.keyDown(changeType, { key: 'ArrowUp' })
    expect(descripcion).toHaveFocus()

    changeType.focus()
    await user.keyboard(' ')
    fireEvent.keyDown(changeType, { key: 'ArrowDown' })
    const tipoDato = screen.getByRole('combobox', { name: 'Tipo de dato' })
    expect(tipoDato).toHaveFocus()
    expect(fireEvent.keyDown(tipoDato, { key: 'ArrowDown' })).toBe(true)
    expect(tipoDato).toHaveFocus()
    changeType.focus()
    await user.keyboard('{Enter}')
    expect(
      screen.queryByRole('combobox', { name: 'Tipo de dato' }),
    ).not.toBeInTheDocument()
    await user.keyboard(' ')

    await user.type(clave, 'PESO')
    await user.type(nombre, 'Peso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    const aplicabilidad = screen.getByRole('combobox', {
      name: 'Aplicabilidad',
    })
    const orden = screen.getByRole('spinbutton', { name: 'Orden' })
    const identidad = screen.getByRole('checkbox', {
      name: 'Participa de identidad',
    })
    expect(aplicabilidad).toHaveFocus()
    orden.focus()
    expect(fireEvent.keyDown(orden, { key: 'ArrowDown' })).toBe(true)
    expect(orden).toHaveFocus()

    identidad.focus()
    fireEvent.keyDown(identidad, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cancelar' }), {
      key: 'ArrowDown',
    })
    expect(screen.getByRole('button', { name: 'Atrás' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Atrás' }), {
      key: 'ArrowDown',
    })
    expect(
      screen.getByRole('button', { name: 'Crear y asignar' }),
    ).toHaveFocus()
  })

  it('opens through its registered N command', () => {
    render(
      <KeyboardControllerProvider activeSurface="catalog">
        <AsignarAtributoSurface
          api={{} as CatalogTypeAttributesApi}
          family={{ id: 'family-1', label: 'Familia A' }}
          type={{ id: 'type-1', label: 'Tipo A' }}
          assignments={[]}
        />
      </KeyboardControllerProvider>,
    )
    fireEvent.keyDown(document, { key: 'n' })
    expect(
      screen.getByRole('dialog', { name: 'Asignar atributo' }),
    ).toBeVisible()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GestionarOpcionesSurface } from '../../src/features/catalog-hierarchy/GestionarOpcionesSurface'
import type { CatalogTypeAttributesApi } from '../../src/features/catalog-hierarchy/catalogTypeAttributes.api'
import type {
  AttributeDefinition,
  AttributeOption,
} from '../../src/features/catalog-hierarchy/catalogTypeAttributes.types'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const definition: AttributeDefinition = {
  activo: false,
  clave: 'ACR',
  effective: false,
  effectiveReasons: ['INACTIVE'],
  id: 'definition-color',
  nombre: 'Color',
  revision: 1,
  tipoDato: 'OPCION',
}

const option = (
  id: string,
  clave: string,
  nombre: string,
): AttributeOption => ({
  activo: id === 'black',
  clave,
  definicionAtributoId: definition.id,
  ...(id === 'white' ? { descripcion: 'Claro.' } : {}),
  effective: id === 'black',
  effectiveReasons: id === 'black' ? [] : ['INACTIVE'],
  id,
  nombre,
  revision: 1,
})

const page = (
  items: AttributeOption[],
  isExhausted = true,
  continuationCursor: string | null = null,
) => ({ items, isExhausted, continuationCursor })

const renderSurface = (
  overrides: Partial<CatalogTypeAttributesApi> = {},
  callbacks: { onOptionsChanged?: () => void } = {},
) => {
  const api = {
    listAttributeOptions: vi
      .fn()
      .mockResolvedValue(
        page([option('white', 'BLANCO', 'Blanco')], false, 'next'),
      ),
    createAttributeOption: vi.fn().mockResolvedValue({
      disposition: 'CREATED',
      item: option('black', 'NEGRO', 'Negro'),
    }),
    ...overrides,
  } as unknown as CatalogTypeAttributesApi
  const view = render(
    <KeyboardControllerProvider
      activeSurface="catalog"
      onCommandPalette={vi.fn()}
      onHelp={vi.fn()}
    >
      <GestionarOpcionesSurface
        api={api}
        definition={definition}
        {...callbacks}
      />
    </KeyboardControllerProvider>,
  )
  return { api, ...view }
}

describe('GestionarOpcionesSurface', () => {
  it('notifies the parent exactly once after a successful option mutation', async () => {
    const user = userEvent.setup()
    const onOptionsChanged = vi.fn()
    const { api } = renderSurface(
      { listAttributeOptions: vi.fn().mockResolvedValue(page([])) },
      { onOptionsChanged },
    )
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'NEGRO')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Negro')
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))
    await waitFor(() => expect(onOptionsChanged).toHaveBeenCalledTimes(1))
    expect(api.listAttributeOptions).toHaveBeenCalledTimes(2)
  })

  it('lists all options from the explicit first page and stable continuation cursor', async () => {
    const user = userEvent.setup()
    const { api } = renderSurface({
      listAttributeOptions: vi
        .fn()
        .mockResolvedValueOnce(
          page([option('white', 'BLANCO', 'Blanco')], false, 'next'),
        )
        .mockResolvedValueOnce(page([option('black', 'NEGRO', 'Negro')])),
    })

    const trigger = screen.getByRole('button', { name: 'Opciones' })
    expect(trigger.querySelector('kbd')).toHaveTextContent('O')
    await user.click(trigger)

    expect(
      await screen.findByRole('dialog', { name: 'Opciones de Color' }),
    ).toBeVisible()
    expect(api.listAttributeOptions).toHaveBeenCalledWith({
      definicionAtributoId: 'definition-color',
      mode: 'ALL',
      pageSize: 50,
      cursor: null,
    })
    expect(screen.getByText('BLANCO')).toBeVisible()
    expect(screen.getByText('Claro.')).toBeVisible()
    expect(screen.getByText('Inactiva')).toBeVisible()
    expect(screen.getByText('No efectiva')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Cargar más opciones' }),
    )

    expect(api.listAttributeOptions).toHaveBeenLastCalledWith({
      definicionAtributoId: 'definition-color',
      mode: 'ALL',
      pageSize: 50,
      cursor: 'next',
    })
    expect(await screen.findByText('NEGRO')).toBeVisible()
    expect(screen.getByText('Activa')).toBeVisible()
    expect(screen.getByText('Efectiva')).toBeVisible()
  })

  it('creates inactive and active options, refreshes the first page, and keeps the manager open for consecutive additions', async () => {
    const user = userEvent.setup()
    const first = page([option('white', 'BLANCO', 'Blanco')])
    const refreshed = page([
      option('white', 'BLANCO', 'Blanco'),
      option('black', 'NEGRO', 'Negro'),
    ])
    const { api } = renderSurface({
      listAttributeOptions: vi
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(refreshed)
        .mockResolvedValue(refreshed),
    })

    const trigger = screen.getByRole('button', { name: 'Opciones' })
    await user.click(trigger)
    await screen.findByText('BLANCO')
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), ' NEGRO ')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), ' Negro ')
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))

    await waitFor(() =>
      expect(api.createAttributeOption).toHaveBeenCalledWith({
        definicionAtributoId: 'definition-color',
        clave: 'NEGRO',
        nombre: 'Negro',
        activo: false,
      }),
    )
    await waitFor(() =>
      expect(api.listAttributeOptions).toHaveBeenLastCalledWith({
        definicionAtributoId: 'definition-color',
        mode: 'ALL',
        pageSize: 50,
        cursor: null,
      }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Opciones de Color' }),
    ).toBeVisible()
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveFocus(),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Opción “Negro” creada.',
    )

    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'ROJO')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Rojo')
    await user.click(screen.getByRole('checkbox', { name: 'Crear activa' }))
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))
    await waitFor(() =>
      expect(api.createAttributeOption).toHaveBeenLastCalledWith({
        definicionAtributoId: 'definition-color',
        clave: 'ROJO',
        nombre: 'Rojo',
        activo: true,
      }),
    )

    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('keeps native textarea navigation, moves between form controls, and reports friendly validation errors', async () => {
    const user = userEvent.setup()
    const duplicate = { data: { code: 'ADMIN_DUPLICATE_KEY' } }
    const { api } = renderSurface({
      createAttributeOption: vi
        .fn()
        .mockRejectedValueOnce(duplicate)
        .mockRejectedValueOnce(new Error('secret backend error')),
    })
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    const clave = screen.getByRole('textbox', { name: 'Clave' })
    const nombre = screen.getByRole('textbox', { name: 'Nombre' })
    const descripcion = screen.getByRole('textbox', { name: 'Descripción' })
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingresá una clave y un nombre',
    )

    await user.type(clave, 'BLANCO')
    fireEvent.keyDown(clave, { key: 'ArrowDown' })
    expect(nombre).toHaveFocus()
    await user.type(nombre, 'Blanco')
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ya existe una opción con esa clave.',
      ),
    )

    descripcion.focus()
    fireEvent.keyDown(descripcion, { key: 'ArrowDown' })
    expect(descripcion).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo crear la opción. Intentá nuevamente.',
      ),
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'secret backend error',
    )
    expect(api.createAttributeOption).toHaveBeenCalledTimes(2)
  })

  it('edits only nombre and descripcion with the current revision, preserving the immutable clave and handling unchanged results', async () => {
    const user = userEvent.setup()
    const original = option('white', 'BLANCO', 'Blanco')
    const unchanged = { ...original, descripcion: 'Claro.' }
    const { api } = renderSurface({
      listAttributeOptions: vi.fn().mockResolvedValue(page([original])),
      updateAttributeOption: vi
        .fn()
        .mockResolvedValue({ disposition: 'UNCHANGED', item: unchanged }),
    })
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await screen.findByText('BLANCO')
    await user.click(screen.getByRole('button', { name: 'Editar Blanco' }))
    const clave = screen.getByRole('textbox', { name: 'Clave inmutable' })
    expect(clave).toHaveValue('BLANCO')
    expect(clave).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /Eliminar/ }),
    ).not.toBeInTheDocument()
    const nombre = screen.getByRole('textbox', { name: 'Nombre' })
    const descripcion = screen.getByRole('textbox', { name: 'Descripción' })
    await user.clear(nombre)
    await user.type(nombre, ' Blanco cálido ')
    await user.clear(descripcion)
    await user.type(descripcion, ' Claro y cálido. ')
    await user.click(screen.getByRole('button', { name: 'Guardar edición' }))
    await waitFor(() =>
      expect(api.updateAttributeOption).toHaveBeenCalledWith({
        opcionAtributoId: 'white',
        expectedRevision: 1,
        nombre: 'Blanco cálido',
        descripcion: 'Claro y cálido.',
      }),
    )
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Opción “Blanco cálido” sin cambios.',
      ),
    )
    expect(screen.getByRole('button', { name: 'Editar Blanco' })).toHaveFocus()
  })

  it('resets the shared draft after successful edits and cancellations while preserving failed edits for retry', async () => {
    const user = userEvent.setup()
    const original = option('white', 'BLANCO', 'Blanco')
    const { api } = renderSurface({
      listAttributeOptions: vi.fn().mockResolvedValue(page([original])),
      updateAttributeOption: vi
        .fn()
        .mockResolvedValueOnce({ disposition: 'UPDATED', item: original })
        .mockRejectedValueOnce(new Error('update unavailable')),
    })

    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await screen.findByText('BLANCO')
    await user.click(screen.getByRole('button', { name: 'Editar Blanco' }))
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue(
      'Blanco',
    )
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue(
      'Claro.',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Nombre' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Blanco cálido',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar edición' }))

    await waitFor(() =>
      expect(api.updateAttributeOption).toHaveBeenCalledTimes(1),
    )
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Opción “Blanco cálido” actualizada.',
      ),
    )
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue('')
    expect(
      screen.getByRole('checkbox', { name: 'Crear activa' }),
    ).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Editar Blanco' }))
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue(
      'Blanco',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Nombre' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Blanco para reintentar',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar edición' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo actualizar la opción. Intentá nuevamente.',
      ),
    )
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue(
      'Blanco para reintentar',
    )
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue(
      'Claro.',
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar edición' }))
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue('')
    expect(
      screen.getByRole('checkbox', { name: 'Crear activa' }),
    ).not.toBeChecked()
  })

  it('confirms deactivation, uses exact lifecycle revisions, and prevents duplicate actions while pending', async () => {
    const user = userEvent.setup()
    let release!: (value: {
      disposition: 'UPDATED'
      item: AttributeOption
    }) => void
    const pending = new Promise<{
      disposition: 'UPDATED'
      item: AttributeOption
    }>((resolve) => {
      release = resolve
    })
    const active = option('black', 'NEGRO', 'Negro')
    const { api } = renderSurface({
      listAttributeOptions: vi.fn().mockResolvedValue(page([active])),
      deactivateAttributeOption: vi.fn().mockReturnValue(pending),
    })
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await screen.findByText('NEGRO')
    await user.click(screen.getByRole('button', { name: 'Desactivar Negro' }))
    const confirmation = screen.getByRole('alertdialog', {
      name: 'Desactivar opción',
    })
    expect(confirmation).toHaveTextContent(
      'puede estar en uso por recursos, reglas o compatibilidad',
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.deactivateAttributeOption).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Desactivar Negro' }))
    await user.click(screen.getByRole('button', { name: 'Desactivar opción' }))
    expect(api.deactivateAttributeOption).toHaveBeenCalledTimes(1)
    expect(api.deactivateAttributeOption).toHaveBeenCalledWith({
      opcionAtributoId: 'black',
      expectedRevision: 1,
    })
    release({
      disposition: 'UPDATED',
      item: {
        ...active,
        activo: false,
        effective: false,
        effectiveReasons: ['INACTIVE'],
        revision: 2,
      },
    })
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Opción “Negro” desactivada.',
      ),
    )
    expect(
      screen.getByRole('button', { name: 'Desactivar Negro' }),
    ).toHaveFocus()
  })

  it('refreshes stale options and gives safe lifecycle error messages without leaking backend text', async () => {
    const user = userEvent.setup()
    const inactive = option('white', 'BLANCO', 'Blanco')
    const listAttributeOptions = vi.fn().mockResolvedValue(page([inactive]))
    const { api } = renderSurface({
      listAttributeOptions,
      activateAttributeOption: vi
        .fn()
        .mockRejectedValueOnce({ data: { code: 'ADMIN_STALE_REVISION' } })
        .mockRejectedValueOnce({ code: 'ADMIN_NOT_FOUND' })
        .mockRejectedValueOnce({ data: { code: 'ADMIN_INVALID_ARGUMENT' } })
        .mockRejectedValueOnce(new Error('secret backend error')),
    })
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await screen.findByText('BLANCO')
    for (const message of [
      'actualizamos la lista',
      'ya no existe',
      'no son válidos',
      'No se pudo activar la opción',
    ]) {
      await user.click(screen.getByRole('button', { name: 'Activar Blanco' }))
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(message),
      )
    }
    expect(api.activateAttributeOption).toHaveBeenNthCalledWith(1, {
      opcionAtributoId: 'white',
      expectedRevision: 1,
    })
    expect(listAttributeOptions).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'secret backend error',
    )
  })

  it('explains blocked deactivation safely and keeps the manager open', async () => {
    const user = userEvent.setup()
    const active = option('black', 'NEGRO', 'Negro')
    const { api } = renderSurface({
      listAttributeOptions: vi.fn().mockResolvedValue(page([active])),
      deactivateAttributeOption: vi
        .fn()
        .mockRejectedValue({ data: { code: 'ADMIN_DEPENDENCY_BLOCKED' } }),
    })
    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    await screen.findByText('NEGRO')
    await user.click(screen.getByRole('button', { name: 'Desactivar Negro' }))
    await user.click(screen.getByRole('button', { name: 'Desactivar opción' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'en uso por recursos, reglas o compatibilidad',
      ),
    )
    expect(
      screen.getByRole('dialog', { name: 'Opciones de Color' }),
    ).toBeVisible()
    expect(api.deactivateAttributeOption).toHaveBeenCalledWith({
      opcionAtributoId: 'black',
      expectedRevision: 1,
    })
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditarAtributoSurface } from '../../src/features/catalog-hierarchy/EditarAtributoSurface'
import type { CatalogTypeAttributesApi } from '../../src/features/catalog-hierarchy/catalogTypeAttributes.api'

const definition = (overrides = {}) => ({
  activo: false,
  clave: 'ACR',
  descripcion: 'Color de referencia',
  effective: false,
  effectiveReasons: ['INACTIVE'],
  id: 'definition-color',
  nombre: 'Color',
  revision: 1,
  tipoDato: 'OPCION' as const,
  ...overrides,
})

const assignment = (overrides = {}) => ({
  activo: true,
  aplicabilidad: 'OPTIONAL' as const,
  definicionAtributoId: 'definition-color',
  effective: true,
  effectiveReasons: [],
  familiaRecursoId: 'family-1',
  id: 'assignment-color',
  orden: 3,
  participaIdentidad: false,
  revision: 2,
  selection: 'SELECTED' as const,
  tipoRecursoId: 'type-1',
  ...overrides,
})

const api = (overrides: Partial<CatalogTypeAttributesApi> = {}) =>
  ({
    updateAttributeDefinition: vi.fn(),
    updateTypeAttributeAssignment: vi.fn(),
    activateTypeAttributeAssignment: vi.fn(),
    deactivateTypeAttributeAssignment: vi.fn(),
    ...overrides,
  }) as unknown as CatalogTypeAttributesApi

describe('Editar atributo surface', () => {
  it('shows the global warning, immutable key, and all editable definition and assignment fields', async () => {
    const user = userEvent.setup()
    render(
      <EditarAtributoSurface
        api={api()}
        definition={definition()}
        assignment={assignment()}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Editar atributo' })
    await waitFor(() => expect(trigger).toHaveAttribute('title', 'Enter / E'))
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Editar atributo' })
    expect(dialog).toHaveTextContent(
      'Este cambio afecta todas las Familias y Tipos que usan esta definición.',
    )
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('ACR')
    expect(screen.getByRole('textbox', { name: 'Clave' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Color')
    expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue(
      'Color de referencia',
    )
    expect(
      screen.queryByRole('combobox', { name: 'Tipo de dato' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Aplicabilidad' })).toHaveValue(
      'OPTIONAL',
    )
    expect(screen.getByRole('spinbutton', { name: 'Orden' })).toHaveValue(3)
    expect(
      screen.getByRole('checkbox', { name: 'Participa de identidad' }),
    ).not.toBeChecked()
    expect(screen.getByText('Activo')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Desactivar asignación' }),
    ).toBeVisible()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('submits only changed definition fields with the current revision, including safe description clearing', async () => {
    const user = userEvent.setup()
    const updateAttributeDefinition = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: definition({ descripcion: undefined }),
    })
    const onUpdated = vi.fn()
    render(
      <EditarAtributoSurface
        api={api({ updateAttributeDefinition })}
        definition={definition()}
        assignment={assignment()}
        onUpdated={onUpdated}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
    await user.clear(screen.getByRole('textbox', { name: 'Descripción' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(updateAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'definition-color',
        expectedRevision: 1,
        descripcion: '',
      }),
    )
    expect(onUpdated).toHaveBeenCalledWith('definition-color')
  })

  it('submits only changed assignment fields and notifies the parent to refresh', async () => {
    const user = userEvent.setup()
    const updateTypeAttributeAssignment = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: assignment({ aplicabilidad: 'REQUIRED', orden: 9, revision: 3 }),
    })
    const onAssignmentChanged = vi.fn()
    render(
      <EditarAtributoSurface
        api={api({ updateTypeAttributeAssignment })}
        definition={definition()}
        assignment={assignment()}
        onAssignmentChanged={onAssignmentChanged}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Aplicabilidad' }),
      'REQUIRED',
    )
    const orden = screen.getByRole('spinbutton', { name: 'Orden' })
    await user.clear(orden)
    await user.type(orden, '9')
    await user.click(
      screen.getByRole('checkbox', { name: 'Participa de identidad' }),
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(updateTypeAttributeAssignment).toHaveBeenCalledWith({
        atributoRecursoId: 'assignment-color',
        expectedRevision: 2,
        aplicabilidad: 'REQUIRED',
        orden: 9,
        participaIdentidad: true,
      }),
    )
    expect(onAssignmentChanged).toHaveBeenCalled()
  })

  it('submits both definition and assignment changes together in one save', async () => {
    const user = userEvent.setup()
    const updateAttributeDefinition = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: definition({ nombre: 'Color comercial' }),
    })
    const updateTypeAttributeAssignment = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: assignment({ orden: 5 }),
    })
    render(
      <EditarAtributoSurface
        api={api({ updateAttributeDefinition, updateTypeAttributeAssignment })}
        definition={definition()}
        assignment={assignment()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
    await user.clear(screen.getByRole('textbox', { name: 'Nombre' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Color comercial',
    )
    const orden = screen.getByRole('spinbutton', { name: 'Orden' })
    await user.clear(orden)
    await user.type(orden, '5')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateAttributeDefinition).toHaveBeenCalled())
    expect(updateTypeAttributeAssignment).toHaveBeenCalledWith({
      atributoRecursoId: 'assignment-color',
      expectedRevision: 2,
      orden: 5,
    })
  })

  it('activates directly and deactivates only after explicit confirmation', async () => {
    const user = userEvent.setup()
    const deactivateTypeAttributeAssignment = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: assignment({ activo: false, revision: 3 }),
    })
    const onAssignmentChanged = vi.fn()
    render(
      <EditarAtributoSurface
        api={api({ deactivateTypeAttributeAssignment })}
        definition={definition()}
        assignment={assignment()}
        onAssignmentChanged={onAssignmentChanged}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
    await user.click(
      screen.getByRole('button', { name: 'Desactivar asignación' }),
    )
    expect(
      screen.getByRole('alertdialog', { name: 'Desactivar asignación' }),
    ).toBeVisible()
    expect(deactivateTypeAttributeAssignment).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Desactivar asignación' }),
    )

    await waitFor(() =>
      expect(deactivateTypeAttributeAssignment).toHaveBeenCalledWith({
        atributoRecursoId: 'assignment-color',
        expectedRevision: 2,
      }),
    )
    expect(onAssignmentChanged).toHaveBeenCalled()
  })

  it.each([
    [
      'nested stale revision',
      { data: { code: 'ADMIN_STALE_REVISION', message: 'raw server failure' } },
      'El atributo fue modificado por otra persona. Recargá e intentá nuevamente.',
    ],
    [
      'direct dependency block',
      { code: 'ADMIN_DEPENDENCY_BLOCKED', message: 'raw server failure' },
      'No se puede cambiar el tipo mientras existan valores, opciones o dependencias activas.',
    ],
    [
      'nested invalid argument',
      {
        data: { code: 'ADMIN_INVALID_ARGUMENT', message: 'raw server failure' },
      },
      'Revisá los datos del atributo e intentá nuevamente.',
    ],
    [
      'unrecognized error',
      { data: { code: 'unrecognized', message: 'raw server failure' } },
      'No se pudieron guardar los cambios. Intentá nuevamente.',
    ],
  ])(
    'keeps the draft and hides raw %s update errors',
    async (_, cause, message) => {
      const user = userEvent.setup()
      let reject!: (cause: unknown) => void
      const pending = new Promise<never>((_, fail) => {
        reject = fail
      })
      const updateAttributeDefinition = vi.fn().mockReturnValue(pending)
      render(
        <EditarAtributoSurface
          api={api({ updateAttributeDefinition })}
          definition={definition()}
          assignment={assignment()}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
      await user.clear(screen.getByRole('textbox', { name: 'Nombre' }))
      await user.type(
        screen.getByRole('textbox', { name: 'Nombre' }),
        'Color comercial',
      )
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      expect(updateAttributeDefinition).toHaveBeenCalledTimes(1)
      reject(cause)

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(message),
      )
      expect(screen.getByRole('alert')).not.toHaveTextContent(
        'raw server failure',
      )
      expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue(
        'Color comercial',
      )
      expect(
        screen.getByRole('button', { name: 'Guardar cambios' }),
      ).toBeEnabled()
    },
  )
})

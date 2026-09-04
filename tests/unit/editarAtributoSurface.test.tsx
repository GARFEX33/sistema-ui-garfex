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
  tipoDato: 'TEXTO' as const,
  ...overrides,
})

const api = (updateAttributeDefinition = vi.fn()) =>
  ({ updateAttributeDefinition }) as unknown as CatalogTypeAttributesApi

describe('Editar atributo surface', () => {
  it('shows the global warning, immutable key, and all editable definition fields', async () => {
    const user = userEvent.setup()
    render(<EditarAtributoSurface api={api()} definition={definition()} />)

    const trigger = screen.getByRole('button', { name: 'Editar atributo' })
    expect(trigger.querySelector('kbd')).toHaveTextContent('Enter / E')
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
    expect(screen.getByRole('combobox', { name: 'Tipo de dato' })).toHaveValue(
      'TEXTO',
    )
    expect(
      screen.getByRole('combobox', { name: 'Tipo de dato' }),
    ).toHaveTextContent('TextoNúmeroBooleanoOpción')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('submits only changed editable fields with the current revision, including safe description clearing', async () => {
    const user = userEvent.setup()
    const updateAttributeDefinition = vi.fn().mockResolvedValue({
      disposition: 'UPDATED',
      item: definition({ descripcion: undefined, tipoDato: 'OPCION' }),
    })
    const onUpdated = vi.fn()
    render(
      <EditarAtributoSurface
        api={api(updateAttributeDefinition)}
        definition={definition()}
        onUpdated={onUpdated}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar atributo' }))
    await user.clear(screen.getByRole('textbox', { name: 'Descripción' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo de dato' }),
      'OPCION',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(updateAttributeDefinition).toHaveBeenCalledWith({
        definicionAtributoId: 'definition-color',
        expectedRevision: 1,
        descripcion: '',
        tipoDato: 'OPCION',
      }),
    )
    expect(onUpdated).toHaveBeenCalledWith('definition-color')
  })

  it.each([
    [
      'nested stale revision',
      { data: { code: 'ADMIN_STALE_REVISION', message: 'raw server failure' } },
      'La definición fue modificada por otra persona. Recargá e intentá nuevamente.',
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
          api={api(updateAttributeDefinition)}
          definition={definition()}
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

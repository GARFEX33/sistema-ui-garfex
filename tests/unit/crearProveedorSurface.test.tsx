import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CrearProveedorSurface } from '../../src/features/proveedores/CrearProveedorSurface'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Nuevo proveedor' }))
}

describe('CrearProveedorSurface', () => {
  it('renders the supplier fields', async () => {
    const user = userEvent.setup()
    render(<CrearProveedorSurface createSupplier={vi.fn()} />)
    await openDialog(user)

    expect(screen.getByLabelText('Nombre comercial')).toBeVisible()
    expect(screen.getByLabelText('Razón social')).toBeVisible()
    expect(screen.getByLabelText('Identificador fiscal')).toBeVisible()
    expect(screen.getByLabelText('Sitio web')).toBeVisible()
    expect(screen.getByLabelText('Notas')).toBeVisible()
  })

  it('disables submit until at least a trade name or legal name is entered', async () => {
    const user = userEvent.setup()
    render(<CrearProveedorSurface createSupplier={vi.fn()} />)
    await openDialog(user)

    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled()
    await user.type(screen.getByLabelText('Nombre comercial'), 'Acme')
    expect(screen.getByRole('button', { name: 'Crear' })).toBeEnabled()
  })

  it('submits trimmed fields, refreshes the list, and closes on success', async () => {
    const user = userEvent.setup()
    const createSupplier = vi.fn().mockResolvedValue({ id: 's1' })
    const onCreated = vi.fn().mockResolvedValue(undefined)
    render(
      <CrearProveedorSurface
        createSupplier={createSupplier}
        onCreated={onCreated}
      />,
    )
    await openDialog(user)
    await user.type(screen.getByLabelText('Nombre comercial'), '  Acme  ')
    await user.type(screen.getByLabelText('Identificador fiscal'), '20-1-1')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(createSupplier).toHaveBeenCalledWith({
        tradeName: 'Acme',
        legalName: '',
        taxIdentifier: '20-1-1',
        website: '',
        notes: '',
      }),
    )
    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('shows an error and keeps the dialog open when creation fails', async () => {
    const user = userEvent.setup()
    const createSupplier = vi.fn().mockRejectedValue(new Error('boom'))
    render(<CrearProveedorSurface createSupplier={createSupplier} />)
    await openDialog(user)
    await user.type(screen.getByLabelText('Nombre comercial'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo crear el proveedor.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows a configuration-specific error when the actor is not configured', async () => {
    const user = userEvent.setup()
    const createSupplier = vi
      .fn()
      .mockRejectedValue(new RestActorConfigurationError())
    render(<CrearProveedorSurface createSupplier={createSupplier} />)
    await openDialog(user)
    await user.type(screen.getByLabelText('Nombre comercial'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede crear el proveedor sin configurar el actor local.',
    )
  })

  it('cancel closes without submitting and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    const createSupplier = vi.fn()
    render(<CrearProveedorSurface createSupplier={createSupplier} />)
    const trigger = screen.getByRole('button', { name: 'Nuevo proveedor' })
    await user.click(trigger)
    await user.type(screen.getByLabelText('Nombre comercial'), 'Acme')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(createSupplier).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })

  it('Escape closes without submitting and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    const createSupplier = vi.fn()
    render(<CrearProveedorSurface createSupplier={createSupplier} />)
    const trigger = screen.getByRole('button', { name: 'Nuevo proveedor' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(createSupplier).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })
})

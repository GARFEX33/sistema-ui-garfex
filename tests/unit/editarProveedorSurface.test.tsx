import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditarProveedorSurface } from '../../src/features/proveedores/EditarProveedorSurface'
import { RestActorConfigurationError } from '../../src/shared/api/restActor'
import type { Supplier } from '../../src/features/proveedores/proveedores.types'

const supplier = (overrides: Partial<Supplier> = {}): Supplier => ({
  id: 'supplier-1',
  tradeName: 'Acme',
  legalName: 'Acme S.A.',
  taxIdentifier: '20-1-1',
  website: 'https://acme.test',
  notes: 'Cliente frecuente',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Editar Acme' }))
}

describe('EditarProveedorSurface', () => {
  it('opens pre-filled with the selected supplier current values', async () => {
    const user = userEvent.setup()
    render(
      <EditarProveedorSurface supplier={supplier()} updateSupplier={vi.fn()} />,
    )
    await openDialog(user)

    expect(screen.getByLabelText('Nombre comercial')).toHaveValue('Acme')
    expect(screen.getByLabelText('Razón social')).toHaveValue('Acme S.A.')
    expect(screen.getByLabelText('Identificador fiscal')).toHaveValue('20-1-1')
    expect(screen.getByLabelText('Sitio web')).toHaveValue('https://acme.test')
    expect(screen.getByLabelText('Notas')).toHaveValue('Cliente frecuente')
  })

  it('submits the edited fields with the supplier id, refreshes the list, and closes on success', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi.fn().mockResolvedValue(supplier())
    const onUpdated = vi.fn().mockResolvedValue(undefined)
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
        onUpdated={onUpdated}
      />,
    )
    await openDialog(user)
    const tradeNameInput = screen.getByLabelText('Nombre comercial')
    await user.clear(tradeNameInput)
    await user.type(tradeNameInput, '  Acme Renovado  ')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(updateSupplier).toHaveBeenCalledWith({
        id: 'supplier-1',
        tradeName: 'Acme Renovado',
        legalName: 'Acme S.A.',
        taxIdentifier: '20-1-1',
        website: 'https://acme.test',
        notes: 'Cliente frecuente',
      }),
    )
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('does not include an expectedRevision or concurrency token in the update call', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi.fn().mockResolvedValue(supplier())
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
      />,
    )
    await openDialog(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(updateSupplier).toHaveBeenCalledOnce())
    const call = updateSupplier.mock.calls[0][0]
    expect(call).not.toHaveProperty('expectedRevision')
    expect(call).not.toHaveProperty('revision')
  })

  it('shows an error and keeps the dialog open when the update fails', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi.fn().mockRejectedValue(new Error('boom'))
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
      />,
    )
    await openDialog(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo actualizar el proveedor.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows a configuration-specific error when the actor is not configured', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi
      .fn()
      .mockRejectedValue(new RestActorConfigurationError())
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
      />,
    )
    await openDialog(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede actualizar el proveedor sin configurar el actor local.',
    )
  })

  it('cancel closes without submitting and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi.fn()
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Editar Acme' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(updateSupplier).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })

  it('Escape closes without submitting and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    const updateSupplier = vi.fn()
    render(
      <EditarProveedorSurface
        supplier={supplier()}
        updateSupplier={updateSupplier}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Editar Acme' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(updateSupplier).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })
})

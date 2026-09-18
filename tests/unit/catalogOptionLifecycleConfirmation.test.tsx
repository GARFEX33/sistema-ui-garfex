import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogOptionLifecycleConfirmation } from '../../src/features/catalog-hierarchy/CatalogOptionLifecycleConfirmation'

const record = {
  kind: 'OPCION' as const,
  id: '8',
  revision: '3',
  active: true,
  optionSet: { kind: 'CONJUNTO_OPCIONES' as const, id: '10', code: 'COLORS' },
  characteristic: { kind: 'CARACTERISTICA' as const, id: '20', code: 'COLOR' },
  code: 'BLUE',
  label: 'Azul',
  rules: [] as [],
}

const props = () => ({
  actorAvailable: true,
  commandError: null,
  commandStatus: 'idle' as const,
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
  record,
})

describe('CatalogOptionLifecycleConfirmation', () => {
  it('names the record and global impact, focuses Cancel, and emits only the lifecycle intent after confirmation', async () => {
    const user = userEvent.setup()
    const view = props()
    const cancelButtonRef = createRef<HTMLButtonElement>()
    render(
      <CatalogOptionLifecycleConfirmation
        {...view}
        cancelButtonRef={cancelButtonRef}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Desactivar opción' }),
    ).toBeVisible()
    expect(screen.getByText('Azul')).toBeVisible()
    expect(screen.getByText('BLUE')).toBeVisible()
    expect(screen.getByRole('note')).toHaveTextContent('COLORS')
    expect(screen.getByRole('note')).toHaveTextContent('COLOR')
    expect(cancelButtonRef.current).toHaveFocus()
    expect(view.onConfirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Desactivar opción' }))

    expect(view.onConfirm).toHaveBeenCalledWith({
      action: 'deactivate',
      expectedRevision: '3',
      id: '8',
    })
  })

  it('uses the inverse action for inactive records and fails closed without an actor', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionLifecycleConfirmation
        {...view}
        actorAvailable={false}
        record={{ ...record, active: false }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Reactivar opción' }),
    ).toBeVisible()
    const confirm = screen.getByRole('button', { name: 'Reactivar opción' })
    expect(confirm).toBeDisabled()
    expect(
      document.getElementById(confirm.getAttribute('aria-describedby') ?? ''),
    ).toHaveTextContent('actor válido')

    await user.click(confirm)
    expect(view.onConfirm).not.toHaveBeenCalled()
  })

  it('announces conflict and command failures, disables cancellation while pending, and delegates Cancel and Escape to the parent', async () => {
    const user = userEvent.setup()
    const view = props()
    const { rerender } = render(
      <CatalogOptionLifecycleConfirmation {...view} commandStatus="conflict" />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'cambió en otra operación',
    )
    rerender(
      <CatalogOptionLifecycleConfirmation
        {...view}
        commandError={Object.assign(new Error('Unprocessable'), {
          status: 422,
        })}
        commandStatus="error"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo desactivar')
    rerender(
      <CatalogOptionLifecycleConfirmation
        {...view}
        commandError={Object.assign(new Error('Unavailable'), { status: 503 })}
        commandStatus="error"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'temporalmente no disponible',
    )
    rerender(
      <CatalogOptionLifecycleConfirmation
        {...view}
        commandError={new Error('Network failed')}
        commandStatus="error"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar')
    rerender(
      <CatalogOptionLifecycleConfirmation {...view} commandStatus="pending" />,
    )
    expect(
      screen.getByRole('button', { name: 'Desactivando opción' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    fireEvent.keyDown(
      screen.getByLabelText('Confirmar desactivación de opción'),
      {
        key: 'Escape',
      },
    )
    expect(view.onCancel).not.toHaveBeenCalled()

    rerender(<CatalogOptionLifecycleConfirmation {...view} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.keyDown(
      screen.getByLabelText('Confirmar desactivación de opción'),
      {
        key: 'Escape',
      },
    )
    expect(view.onCancel).toHaveBeenCalledTimes(2)
  })

  it('emits the exact reactivate intent after confirming an inactive option', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionLifecycleConfirmation
        {...view}
        record={{ ...record, active: false }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reactivar opción' }))

    expect(view.onConfirm).toHaveBeenCalledWith({
      action: 'reactivate',
      expectedRevision: '3',
      id: '8',
    })
  })

  it('locks duplicate reactivation click and Enter after the parent reports pending', async () => {
    const user = userEvent.setup()
    const view = props()
    const inactiveRecord = { ...record, active: false }
    const { rerender } = render(
      <CatalogOptionLifecycleConfirmation {...view} record={inactiveRecord} />,
    )

    const confirm = screen.getByRole('button', { name: 'Reactivar opción' })
    await user.click(confirm)
    expect(view.onConfirm).toHaveBeenCalledTimes(1)

    rerender(
      <CatalogOptionLifecycleConfirmation
        {...view}
        commandStatus="pending"
        record={inactiveRecord}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Reactivando opción' }))
    await user.keyboard('{Enter}')

    expect(view.onConfirm).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['IN_USE', 'está en uso por Recursos y no se puede eliminar'],
    ['INVALID_LIFECYCLE', 'debe permanecer inactiva'],
    ['CONFLICT', 'cambió de revisión'],
    ['NOT_FOUND', 'ya no existe'],
    ['UNAVAILABLE', 'no está disponible'],
    ['INTERNAL', 'error del servidor'],
    ['UNKNOWN', 'No se pudo eliminar permanentemente'],
  ])(
    'maps delete error code %s without relying on its message',
    (code, message) => {
      const view = props()
      render(
        <CatalogOptionLifecycleConfirmation
          {...(view as never)}
          commandError={Object.assign(
            new Error('Unrelated transport message'),
            {
              code,
            },
          )}
          commandStatus="error"
          mode="delete"
          record={{ ...record, active: false }}
        />,
      )

      expect(screen.getByRole('alert')).toHaveTextContent(message)
    },
  )

  it('requires the exact code and consumes Escape while permanent deletion is pending', async () => {
    const user = userEvent.setup()
    const view = props()
    const { rerender } = render(
      <CatalogOptionLifecycleConfirmation
        {...(view as never)}
        mode="delete"
        record={{ ...record, active: false }}
      />,
    )

    const input = screen.getByLabelText('Código para confirmar eliminación')
    expect(input).toHaveFocus()
    const remove = screen.getByRole('button', {
      name: 'Eliminar permanentemente',
    })
    expect(remove).toBeDisabled()
    const form = input.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    expect(view.onConfirm).not.toHaveBeenCalled()
    await user.type(input, 'blue')
    expect(remove).toBeDisabled()
    fireEvent.submit(form!)
    expect(view.onConfirm).not.toHaveBeenCalled()
    await user.clear(input)
    await user.type(input, 'BLUE')
    expect(remove).toBeEnabled()
    await user.click(remove)
    expect(view.onConfirm).toHaveBeenCalledWith({
      action: 'delete',
      expectedRevision: '3',
      id: '8',
    })

    rerender(
      <CatalogOptionLifecycleConfirmation
        {...(view as never)}
        commandStatus="pending"
        mode="delete"
        record={{ ...record, active: false }}
      />,
    )
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    screen
      .getByRole('region', {
        name: 'Confirmar eliminación permanente de opción',
      })
      .dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(true)
    expect(view.onCancel).not.toHaveBeenCalled()
  })

  it('fails closed for permanent deletion without an actor even with the exact code', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionLifecycleConfirmation
        {...(view as never)}
        actorAvailable={false}
        mode="delete"
        record={{ ...record, active: false }}
      />,
    )

    const input = screen.getByLabelText('Código para confirmar eliminación')
    await user.type(input, 'BLUE')
    fireEvent.submit(input.closest('form')!)

    expect(view.onConfirm).not.toHaveBeenCalled()
  })
})

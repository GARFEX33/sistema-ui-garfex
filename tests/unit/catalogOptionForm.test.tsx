import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogOptionForm } from '../../src/features/catalog-hierarchy/CatalogOptionForm'
import { CatalogOptionsAdminHttpError } from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.api'

const context = {
  optionSet: { kind: 'CONJUNTO_OPCIONES' as const, id: '10', code: 'COLORS' },
  characteristic: { kind: 'CARACTERISTICA' as const, id: '20', code: 'COLOR' },
}
const props = () => ({
  ...context,
  actorAvailable: true,
  commandError: null,
  commandStatus: 'idle' as const,
  onCancel: vi.fn(),
  onSubmit: vi.fn(),
})

describe('CatalogOptionForm', () => {
  it('does not render detail from an unapproved error-envelope combination', () => {
    const view = props()
    render(
      <CatalogOptionForm
        {...view}
        commandError={Object.assign(
          new CatalogOptionsAdminHttpError(404, 'not found'),
          { detail: 'private identifier' },
        )}
        commandStatus="error"
        mode="create"
      />,
    )

    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'private identifier',
    )
  })

  it('creates an exact command draft and keeps canonical context immutable', async () => {
    const user = userEvent.setup()
    const view = props()
    render(<CatalogOptionForm {...view} mode="create" />)

    expect(screen.getByText('COLORS')).toBeVisible()
    expect(screen.getByText('COLOR')).toBeVisible()
    await user.type(screen.getByLabelText('Código'), ' RED ')
    await user.type(screen.getByLabelText('Etiqueta'), ' Rojo ')
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))

    expect(view.onSubmit).toHaveBeenCalledWith({
      values: { ...context, code: ' RED ', label: ' Rojo ' },
    })
  })

  it('prefills edit values and emits the current id and revision', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionForm
        {...view}
        mode="edit"
        record={{
          kind: 'OPCION',
          id: '8',
          revision: '3',
          active: true,
          ...context,
          code: 'BLUE',
          label: 'Azul',
          rules: [],
        }}
      />,
    )

    expect(screen.getByText('8')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    await user.clear(screen.getByLabelText('Etiqueta'))
    await user.type(screen.getByLabelText('Etiqueta'), 'Azul intenso')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(view.onSubmit).toHaveBeenCalledWith({
      id: '8',
      expectedRevision: '3',
      values: { ...context, code: 'BLUE', label: 'Azul intenso' },
    })
  })

  it('explains disabled actor, invalid input, pending, and command failures', () => {
    const view = props()
    const { rerender } = render(
      <CatalogOptionForm {...view} actorAvailable={false} mode="create" />,
    )
    expect(screen.getByRole('button', { name: 'Crear opción' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('actor válido')

    rerender(<CatalogOptionForm {...view} mode="create" />)
    expect(screen.getByRole('status')).toHaveTextContent('Código y Etiqueta')
    rerender(
      <CatalogOptionForm {...view} commandStatus="pending" mode="create" />,
    )
    expect(
      screen.getByRole('button', { name: 'Creando opción' }),
    ).toBeDisabled()
    rerender(
      <CatalogOptionForm
        {...view}
        commandError={new CatalogOptionsAdminHttpError(422, 'Unprocessable')}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'revisá Código y Etiqueta',
    )
  })

  it('presents only the contract-approved 400 and 422 details as Spanish rejections', () => {
    const view = props()
    const { rerender } = render(
      <CatalogOptionForm
        {...view}
        commandError={Object.assign(
          new CatalogOptionsAdminHttpError(400, 'invalid request'),
          { detail: 'Código duplicado' },
        )}
        commandStatus="error"
        mode="create"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El backend rechazó la solicitud: Código duplicado.',
    )
    rerender(
      <CatalogOptionForm
        {...view}
        commandError={Object.assign(
          new CatalogOptionsAdminHttpError(422, 'validation failed'),
          { detail: 'Etiqueta duplicada' },
        )}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo guardar: Etiqueta duplicada.',
    )
  })

  it('explains typed HTTP 500 errors as server failures', () => {
    const view = props()
    render(
      <CatalogOptionForm
        {...view}
        commandError={new CatalogOptionsAdminHttpError(500, 'internal error')}
        commandStatus="error"
        mode="create"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El servidor no pudo procesar la solicitud.',
    )
  })

  it('keeps the disabled reason rendered when a command error is also shown', () => {
    const view = props()
    render(
      <CatalogOptionForm
        {...view}
        actorAvailable={false}
        commandError={new CatalogOptionsAdminHttpError(422, 'Unprocessable')}
        commandStatus="error"
        mode="create"
      />,
    )

    const submit = screen.getByRole('button', { name: 'Crear opción' })
    const reasonId = submit.getAttribute('aria-describedby')
    expect(document.getElementById(reasonId ?? '')).toHaveTextContent(
      'actor válido',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'revisá Código y Etiqueta',
    )
  })

  it('announces known HTTP statuses while keeping unknown errors fail-closed', async () => {
    const user = userEvent.setup()
    const view = props()
    const { rerender } = render(
      <CatalogOptionForm
        {...view}
        commandError={Object.assign(
          new CatalogOptionsAdminHttpError(404, 'not found'),
          { detail: 'private identifier' },
        )}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El backend no encontró la opción solicitada (404).',
    )
    rerender(
      <CatalogOptionForm
        {...view}
        commandError={new CatalogOptionsAdminHttpError(409, 'conflict')}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'cambió en otra operación',
    )
    rerender(
      <CatalogOptionForm
        {...view}
        commandError={new CatalogOptionsAdminHttpError(503, 'Unavailable')}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'temporalmente no disponible',
    )
    rerender(
      <CatalogOptionForm
        {...view}
        commandError={Object.assign(new Error('private-network-marker'), {
          status: 400,
        })}
        commandStatus="error"
        mode="create"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar')
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'private-network-marker',
    )
    rerender(
      <CatalogOptionForm {...view} commandStatus="conflict" mode="create" />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'cambió en otra operación',
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(view.onCancel).toHaveBeenCalledOnce()
  })
})

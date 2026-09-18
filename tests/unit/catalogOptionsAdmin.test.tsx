import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogOptionsAdmin } from '../../src/features/catalog-hierarchy/CatalogOptionsAdmin'
import type { CatalogOptionAdminRecord } from '../../src/features/catalog-hierarchy/catalogOptionsAdmin.types'

const records: readonly CatalogOptionAdminRecord[] = [
  {
    kind: 'OPCION',
    id: '1',
    revision: '0',
    active: true,
    optionSet: { kind: 'CONJUNTO_OPCIONES', id: '10', code: 'COLORS' },
    characteristic: { kind: 'CARACTERISTICA', id: '20', code: 'COLOR' },
    code: 'RED',
    label: 'Rojo',
    rules: [],
  },
  {
    kind: 'OPCION',
    id: '2',
    revision: '1',
    active: false,
    optionSet: { kind: 'CONJUNTO_OPCIONES', id: '10', code: 'COLORS' },
    characteristic: { kind: 'CARACTERISTICA', id: '20', code: 'COLOR' },
    code: 'BLUE',
    label: 'Azul',
    rules: [],
  },
]

const props = () => ({
  optionSetCode: 'COLORS',
  characteristicCode: 'COLOR',
  status: 'ready' as const,
  records,
  error: null,
  references: records[0]
    ? {
        optionSet: records[0].optionSet,
        characteristic: records[0].characteristic,
      }
    : null,
  referenceStatus: 'ready' as const,
  referenceError: null,
  retryReferences: vi.fn(),
  actorAvailable: true,
  commandStatus: 'idle' as const,
  commandError: null,
  create: vi.fn().mockResolvedValue(true),
  update: vi.fn().mockResolvedValue(true),
  deactivate: vi.fn().mockResolvedValue(true),
  reactivate: vi.fn().mockResolvedValue(true),
  offset: 20,
  limit: 20,
  hasPrevious: true,
  hasNext: true,
  retry: vi.fn(),
  previous: vi.fn(),
  next: vi.fn(),
})

describe('CatalogOptionsAdmin', () => {
  it('shows the persistent global-scope warning and active/inactive records in received order', () => {
    render(<CatalogOptionsAdmin {...props()} />)

    expect(
      screen.getByRole('note', { name: 'Advertencia de alcance global' }),
    ).toHaveTextContent(
      'afectan globalmente a todos los consumidores de optionSetCode COLORS y characteristicCode COLOR',
    )
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('RojoCódigo: REDActiva')
    expect(rows[1]).toHaveTextContent('AzulCódigo: BLUEInactiva')
    expect(screen.getByText('Código: RED')).toBeVisible()
    expect(screen.getByText('Rojo')).toBeVisible()
    expect(screen.getByText('Activa')).toBeVisible()
    expect(screen.getByText('Código: BLUE')).toBeVisible()
    expect(screen.getByText('Azul')).toBeVisible()
    expect(screen.getByText('Inactiva')).toBeVisible()
    expect(
      screen.getByText(/El orden entre ventanas no está garantizado/),
    ).toBeVisible()
  })

  it('uses compact option cards with an action menu and local keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<CatalogOptionsAdmin {...props()} />)

    const cards = screen.getAllByRole('button', { name: /Editar opción/ })
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute('tabindex', '0')
    expect(cards[1]).toHaveAttribute('tabindex', '-1')
    expect(screen.getByText('Activa')).toHaveClass('rounded-full')
    expect(screen.getByText('Inactiva')).toHaveClass('rounded-full')

    cards[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(cards[1]).toHaveFocus()
    expect(cards[1]).toHaveAttribute('tabindex', '0')
    expect(cards[0]).toHaveAttribute('tabindex', '-1')
    await user.keyboard('k')
    expect(cards[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('form', { name: 'Editar opción' })).toBeVisible()
    await waitFor(() => expect(screen.getByLabelText('Código')).toHaveFocus())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('form', { name: 'Editar opción' })).toBeNull()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Editar opción Rojo' }),
      ).toHaveFocus(),
    )

    await user.click(screen.getByRole('button', { name: 'Acciones para Rojo' }))
    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Desactivar' })).toBeVisible()
  })

  it('keeps menu focus and keyboard navigation local to the action menu', async () => {
    const user = userEvent.setup()
    render(<CatalogOptionsAdmin {...props()} />)

    const trigger = screen.getByRole('button', { name: 'Acciones para Rojo' })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())

    await user.click(trigger)
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(menuItems[1]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(menuItems[0]).toHaveFocus()
    await user.keyboard('{End}')
    expect(menuItems[1]).toHaveFocus()
    expect(
      screen.getByRole('button', { name: 'Editar opción Rojo' }),
    ).toHaveAttribute('tabindex', '0')
    expect(
      screen.getByRole('button', { name: 'Editar opción Azul' }),
    ).toHaveAttribute('tabindex', '-1')
    await user.tab()
    expect(
      screen.getByRole('button', { name: 'Acciones para Azul' }),
    ).toHaveFocus()
    await user.tab({ shift: true })
    expect(menuItems[1]).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('does not consume modified or composing local shortcuts', () => {
    render(<CatalogOptionsAdmin {...props()} />)

    const card = screen.getByRole('button', { name: 'Editar opción Rojo' })
    fireEvent.keyDown(card, { key: 'n', ctrlKey: true })
    fireEvent.keyDown(card, { key: 'n', metaKey: true })
    fireEvent.keyDown(card, { key: 'n', altKey: true })
    fireEvent.keyDown(card, { key: 'n', isComposing: true })

    expect(screen.queryByRole('form', { name: 'Crear opción' })).toBeNull()
  })

  it('uses the real pagination flags and keeps keyboard activation native', async () => {
    const user = userEvent.setup()
    const view = props()
    render(<CatalogOptionsAdmin {...view} />)

    const previous = screen.getByRole('button', { name: 'Opciones anteriores' })
    const next = screen.getByRole('button', { name: 'Siguientes opciones' })
    expect(previous).toBeEnabled()
    expect(next).toBeEnabled()
    expect(screen.getByText('Desplazamiento 20 · Límite 20')).toBeVisible()

    previous.focus()
    await user.keyboard('{Enter}')
    await user.tab()
    await user.keyboard(' ')

    expect(view.previous).toHaveBeenCalledOnce()
    expect(view.next).toHaveBeenCalledOnce()
    expect(next).toHaveFocus()
  })

  it('disables pagination from the real flags without invoking either command', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionsAdmin {...view} hasPrevious={false} hasNext={false} />,
    )

    const previous = screen.getByRole('button', { name: 'Opciones anteriores' })
    const next = screen.getByRole('button', { name: 'Siguientes opciones' })
    expect(previous).toBeDisabled()
    expect(next).toBeDisabled()

    await user.click(previous)
    await user.click(next)
    expect(view.previous).not.toHaveBeenCalled()
    expect(view.next).not.toHaveBeenCalled()
  })

  it.each([
    [
      'waiting-context',
      'Esperando el contexto completo de opciones compartidas.',
    ],
    ['loading', 'Cargando opciones compartidas…'],
    ['empty', 'No hay opciones base compartidas en esta ventana.'],
  ] as const)('announces the %s state', (status, message) => {
    render(<CatalogOptionsAdmin {...props()} status={status} records={[]} />)

    expect(screen.getByRole('status')).toHaveTextContent(message)
    expect(
      screen.getByRole('note', { name: 'Advertencia de alcance global' }),
    ).toBeVisible()
  })

  it('keeps creation ready when the confirmed list is empty and references are canonical', async () => {
    const user = userEvent.setup()
    render(<CatalogOptionsAdmin {...props()} status="empty" records={[]} />)

    const create = screen.getByRole('button', { name: 'Nueva opción' })
    expect(create).toBeEnabled()
    await user.click(create)
    expect(screen.getByRole('form', { name: 'Crear opción' })).toBeVisible()
  })

  it('uses resolved canonical references instead of page records when creating', async () => {
    const user = userEvent.setup()
    const view = props()
    view.references = {
      optionSet: {
        kind: 'CONJUNTO_OPCIONES',
        id: 'canonical-set',
        code: 'COLORS',
      },
      characteristic: {
        kind: 'CARACTERISTICA',
        id: 'canonical-characteristic',
        code: 'COLOR',
      },
    }
    render(<CatalogOptionsAdmin {...view} />)

    await user.click(screen.getByRole('button', { name: 'Nueva opción' }))
    await user.type(screen.getByLabelText('Código'), 'GREEN')
    await user.type(screen.getByLabelText('Etiqueta'), 'Verde')
    await user.click(screen.getByRole('button', { name: 'Crear opción' }))

    expect(view.create).toHaveBeenCalledWith({
      values: {
        optionSet: view.references.optionSet,
        characteristic: view.references.characteristic,
        code: 'GREEN',
        label: 'Verde',
      },
    })
  })

  it.each(['ready', 'loading', 'empty', 'error'] as const)(
    'keeps the global warning visible while %s',
    (status) => {
      render(
        <CatalogOptionsAdmin
          {...props()}
          status={status}
          records={status === 'ready' ? records : []}
          error={status === 'error' ? new Error('Network unavailable') : null}
        />,
      )

      expect(
        screen.getByRole('note', { name: 'Advertencia de alcance global' }),
      ).toHaveTextContent('optionSetCode COLORS y characteristicCode COLOR')
    },
  )

  it('announces an error and retries through the shared Button', async () => {
    const user = userEvent.setup()
    const view = props()
    render(
      <CatalogOptionsAdmin
        {...view}
        status="error"
        records={[]}
        error={new Error('Network unavailable')}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones compartidas.',
    )
    expect(
      screen.getByRole('note', { name: 'Advertencia de alcance global' }),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Reintentar opciones compartidas' }),
    )
    expect(view.retry).toHaveBeenCalledOnce()
  })

  it('explains an absent option set without controls or a request seam', () => {
    const view = props()
    render(
      <CatalogOptionsAdmin
        {...view}
        optionSetCode={undefined}
        status="error"
        hasPrevious
        hasNext
      />,
    )

    expect(
      screen.getByText('Administración de opciones no disponible'),
    ).toBeVisible()
    expect(screen.getByText(/no incluye un optionSetCode/i)).toBeVisible()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('offers permanent deletion only for inactive options with a delete API', async () => {
    const user = userEvent.setup()
    const view = {
      ...props(),
      delete: vi.fn().mockResolvedValue(true),
      deleteAvailable: true,
    }
    render(<CatalogOptionsAdmin {...(view as never)} />)

    await user.click(screen.getByRole('button', { name: 'Acciones para Rojo' }))
    expect(
      screen.queryByRole('menuitem', { name: 'Eliminar permanentemente' }),
    ).toBeNull()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Acciones para Azul' }))
    await user.click(
      screen.getByRole('menuitem', { name: 'Eliminar permanentemente' }),
    )

    expect(
      screen.getByRole('region', {
        name: 'Confirmar eliminación permanente de opción',
      }),
    ).toBeVisible()
    const confirmation = screen.getByLabelText(
      'Código para confirmar eliminación',
    )
    expect(confirmation).toHaveFocus()
    const remove = screen.getByRole('button', {
      name: 'Eliminar permanentemente',
    })
    expect(remove).toBeDisabled()

    await user.type(confirmation, 'blue')
    expect(remove).toBeDisabled()
    await user.clear(confirmation)
    await user.type(confirmation, 'BLUE')
    expect(remove).toBeEnabled()
    await user.click(remove)

    expect(view.delete).toHaveBeenCalledWith({ id: '2', expectedRevision: '1' })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Editar opción Azul' }),
      ).toHaveFocus(),
    )
  })

  it('keeps the dynamic third menu item in local keyboard navigation', async () => {
    const user = userEvent.setup()
    const view = {
      ...props(),
      delete: vi.fn(),
      deleteAvailable: true,
    }
    render(<CatalogOptionsAdmin {...(view as never)} />)

    await user.click(screen.getByRole('button', { name: 'Acciones para Azul' }))
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(3)
    await waitFor(() => expect(items[0]).toHaveFocus())
    await user.keyboard('{End}')
    expect(items[2]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[0]).toHaveFocus()
  })
})

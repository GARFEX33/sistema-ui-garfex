import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NuevaClaseSurface } from '../../src/features/catalog-hierarchy/NuevaClaseSurface'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

describe('Nueva Clase static dialog', () => {
  it('opens from the catalog N shortcut using the same dialog', async () => {
    const user = userEvent.setup()
    render(
      <KeyboardControllerProvider
        activeSurface="catalog"
        onCommandPalette={() => {}}
      >
        <NuevaClaseSurface />
      </KeyboardControllerProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
    trigger.focus()
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(trigger).toHaveFocus()
  })

  it('opens the approved fields and actions in order without a mutation contract', async () => {
    const user = userEvent.setup()
    render(<NuevaClaseSurface />)

    await user.click(screen.getByRole('button', { name: 'Nueva Clase' }))

    const dialog = screen.getByRole('dialog', { name: 'Nueva Clase' })
    expect(dialog).toBeVisible()
    expect(
      Array.from(dialog.querySelector('form')!.children).map(
        (child) => child.tagName,
      ),
    ).toEqual(['HEADER', 'DIV', 'FOOTER'])
    expect(
      Array.from(dialog.querySelectorAll('label')).map(
        (label) => label.textContent,
      ),
    ).toEqual(['Clave', 'Nombre', 'Descripción'])
    expect(
      Array.from(dialog.querySelectorAll('footer button')).map(
        (button) => button.textContent,
      ),
    ).toEqual(['Cancelar', 'Crear Clase'])
    expect(screen.getByRole('button', { name: 'Crear Clase' })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL-01')
    await user.type(
      screen.getByRole('textbox', { name: 'Nombre' }),
      'Materiales',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Descripción' }),
      'Descripción local',
    )
    expect(screen.getByRole('button', { name: 'Crear Clase' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

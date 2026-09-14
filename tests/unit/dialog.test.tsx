import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '../../src/shared/ui/Dialog'

describe('Dialog responsive contract', () => {
  it('keeps the desktop width while constraining the modal within a padded viewport', () => {
    render(
      <Dialog
        isOpen
        isDismissable
        onOpenChange={vi.fn()}
        aria-label="Responsive dialog"
      >
        Contenido
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Responsive dialog' })
    const modal = dialog.parentElement!
    const overlay = modal.parentElement!
    expect(modal).toHaveClass('w-full', 'max-w-full')
    expect(modal).not.toHaveStyle({ marginLeft: '30px' })
    expect(overlay).toHaveClass('px-4', 'sm:px-0')
    expect(dialog).toHaveClass(
      'max-h-[calc(100vh-32px)]',
      'sm:max-h-[calc(100vh-156px)]',
      'overflow-y-auto',
    )
  })

  it('keeps Tab focus inside the open dialog', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button>Outside control</button>
        <Dialog
          isOpen
          isDismissable
          onOpenChange={vi.fn()}
          aria-label="Focus dialog"
        >
          <button autoFocus>First control</button>
          <button>Last control</button>
        </Dialog>
      </>,
    )

    const first = screen.getByRole('button', { name: 'First control' })
    const last = screen.getByRole('button', { name: 'Last control' })
    const outside = screen.getByText('Outside control')
    expect(first).toHaveFocus()

    await user.tab()
    expect(last).toHaveFocus()
    await user.tab()
    expect(first).toHaveFocus()
    expect(outside).not.toHaveFocus()
  })
})

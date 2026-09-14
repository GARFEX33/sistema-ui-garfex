import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  CatalogCreateSurface,
  NuevaClaseSurface,
} from '../../src/features/catalog-hierarchy/NuevaClaseSurface'
import type {
  CatalogClassRestItem,
  CatalogCreated,
  CatalogFamilyItem,
} from '../../src/features/catalog-hierarchy/catalogHierarchy.types'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'

const created = (): CatalogClassRestItem => ({
  activo: false,
  clave: 'CL-01',
  id: 'class-1',
  nombre: 'Clase 1',
  revision: '1',
})
const fakeCreate = () => vi.fn().mockResolvedValue(created())
const openDialog = async (
  createClass = fakeCreate(),
  onCreated?: () => void | Promise<void>,
) => {
  const user = userEvent.setup()
  render(<NuevaClaseSurface createClass={createClass} onCreated={onCreated} />)
  const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
  await user.click(trigger)
  return { user, trigger, createClass }
}
const openDependent = async (
  props: React.ComponentProps<typeof CatalogCreateSurface>,
) => {
  const user = userEvent.setup()
  render(<CatalogCreateSurface {...props} />)
  const title = props.level === 'family' ? 'Nueva Familia' : 'Nuevo Tipo'
  await user.click(screen.getByRole('button', { name: title }))
  return user
}
const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  action: string,
  key: string,
  name: string,
) => {
  await user.type(screen.getByRole('textbox', { name: 'Clave' }), key)
  await user.type(screen.getByRole('textbox', { name: 'Nombre' }), name)
  await user.click(screen.getByRole('button', { name: action }))
}
const fillClassFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: 'Plural' }), 'Clases')
  await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'clase')
}
const expectParent = (label: string, id: string) => {
  expect(screen.getByText(label)).toBeVisible()
  expect(screen.getByTestId('creation-parent')).toHaveAttribute(
    'data-parent-id',
    id,
  )
}

// prettier-ignore
describe('Nueva Clase creation flow', () => {
  it('requires explicit plural and slug instead of the unsupported description', async () => {
    const { user, createClass } = await openDialog()
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'MAT')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Material')
    expect(screen.queryByRole('textbox', { name: 'Descripción' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear Clase' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Plural' }), 'Materiales')
    await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'material')
    await user.click(screen.getByRole('button', { name: 'Crear Clase' }))
    expect(createClass).toHaveBeenCalledWith({
      code: 'MAT',
      name: 'Material',
      plural: 'Materiales',
      slug: 'material',
    })
  })
      it('shows the contextual N shortcut as semantic kbd content', () => {
        render(<NuevaClaseSurface createClass={fakeCreate()} />)
        const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
        expect(trigger.querySelector('kbd')).toHaveTextContent('N')
      })
  it('keeps the form header, content, and footer as semantic direct children', async () => {
    await openDialog()
    const dialog = screen.getByRole('dialog', { name: 'Nueva Clase' })
    const form = dialog.querySelector('form')
    expect(form).not.toBeNull()
    expect(Array.from(form!.children).map((child) => child.tagName)).toEqual([
      'HEADER',
      'DIV',
      'FOOTER',
    ])
    const content = form!.children[1]
    expect(content.querySelector('.catalog-dialog-fields')).not.toBeNull()
    expect(content.querySelector('[role="alert"]')).not.toBeNull()
    const footer = form!.querySelector('footer')
    expect(footer).not.toBeNull()
    expect(
      Array.from(footer!.querySelectorAll('button')).map(
        (button) => button.textContent,
      ),
    ).toEqual(['Cancelar', 'Crear Clase'])
  })

  it('opens on Clave and enables only after one character in each required field', async () => {
    const { user } = await openDialog()
    const key = screen.getByRole('textbox', { name: 'Clave' })
    const name = screen.getByRole('textbox', { name: 'Nombre' })
    const submit = screen.getByRole('button', { name: 'Crear Clase' })
    expect(key).toHaveFocus(); expect(submit).toBeDisabled()
    await user.type(key, ' '); expect(submit).toBeDisabled()
    await user.type(name, 'N'); expect(submit).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Plural' }), 'Ns')
    await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'n')
    expect(submit).toBeEnabled()
  })

  it('captures an immutable exact payload and blocks duplicate submit while pending', async () => {
    let resolve!: (value: CatalogClassRestItem) => void
    const pending = new Promise<CatalogClassRestItem>((res) => { resolve = res })
    const createClass = vi.fn().mockReturnValue(pending)
    const { user, trigger } = await openDialog(createClass)
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), ' K ')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), ' Nombre ')
    await user.type(screen.getByRole('textbox', { name: 'Plural' }), ' Plurales ')
    await user.type(screen.getByRole('textbox', { name: 'Slug' }), ' plural ')
    const submit = screen.getByRole('button', { name: 'Crear Clase' })
    await user.click(submit); await user.click(submit)
    expect(createClass).toHaveBeenCalledTimes(1)
    const payload = createClass.mock.calls[0][0]
    expect(payload).toEqual({
      code: ' K ',
      name: ' Nombre ',
      plural: ' Plurales ',
      slug: ' plural ',
    })
    expect(Object.isFrozen(payload)).toBe(true)
    resolve(created())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()))
    expect(trigger).toHaveFocus()
  })

  it('waits for the first-page refetch before closing and shows the exact success toast', async () => {
    let releaseRefetch!: () => void
    const refetch = new Promise<void>((resolve) => { releaseRefetch = resolve })
    const onCreated = vi.fn(() => refetch)
    const { user, trigger } = await openDialog(fakeCreate(), onCreated)
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), ' Nueva ')
    await fillClassFields(user)
    await user.click(screen.getByRole('button', { name: 'Crear Clase' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    releaseRefetch()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('Clase “ Nueva ” creada.')
    await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()))
    expect(trigger).toHaveFocus()
  })

  it('autocloses the success toast after four seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      render(<NuevaClaseSurface createClass={fakeCreate()} />)
      const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
      fireEvent.keyDown(trigger, { key: 'Enter' })
      fireEvent.keyUp(trigger, { key: 'Enter' })
      fireEvent.change(screen.getByRole('textbox', { name: 'Clave' }), {
        target: { value: 'CL' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
        target: { value: 'Nueva' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Plural' }), {
        target: { value: 'Nuevas' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Slug' }), {
        target: { value: 'nueva' },
      })
      fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByRole('status')).toHaveTextContent('Clase “Nueva” creada.')
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3999)
      })
      expect(screen.getByRole('status')).toBeInTheDocument()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('restarts the toast timer for a replacement and clears it on unmount', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const view = render(<NuevaClaseSurface createClass={fakeCreate()} />)
      const create = async (key: string, name: string) => {
        const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
        fireEvent.keyDown(trigger, { key: 'Enter' })
        fireEvent.keyUp(trigger, { key: 'Enter' })
        fireEvent.change(screen.getByRole('textbox', { name: 'Clave' }), {
          target: { value: key },
        })
        fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), {
          target: { value: name },
        })
        fireEvent.change(screen.getByRole('textbox', { name: 'Plural' }), {
          target: { value: 'Clases' },
        })
        fireEvent.change(screen.getByRole('textbox', { name: 'Slug' }), {
          target: { value: 'clase' },
        })
        fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
        await act(async () => {
          await Promise.resolve()
          await Promise.resolve()
        })
      }

      await create('CL-1', 'Primera')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000)
      })
      await create('CL-2', 'Reemplazo')
      expect(screen.getByRole('status')).toHaveTextContent(
        'Clase “Reemplazo” creada.',
      )
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      expect(screen.getByRole('status')).toBeInTheDocument()
      await act(async () => {
        view.unmount()
      })
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('maps only the structured duplicate key error and preserves the draft', async () => {
    const createClass = vi.fn().mockRejectedValue({
      code: 'DUPLICATE_CLASS_KEY',
      clave: 'CL',
      detail: 'must not be exposed',
    })
    const { user } = await openDialog(createClass)
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Nombre')
    await fillClassFields(user)
    await user.click(screen.getByRole('button', { name: 'Crear Clase' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la Clase.'))
    expect(screen.getByRole('alert')).not.toHaveTextContent('must not be exposed')
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('CL')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Nombre')
  })

  it('keeps the duplicate mapping narrow for structured non-duplicate errors', async () => {
    const createClass = vi.fn().mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'path /token must not be exposed',
    })
    const { user } = await openDialog(createClass)
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Nombre')
    await fillClassFields(user)
    await user.click(screen.getByRole('button', { name: 'Crear Clase' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la Clase.'))
    expect(screen.getByRole('alert')).not.toHaveTextContent('/token')
  })

  it('uses the exact fallback for unknown errors and keeps the stable alert region', async () => {
    const createClass = vi.fn().mockRejectedValue(new Error('secret backend cause /id/token'))
    const { user } = await openDialog(createClass)
    await user.type(screen.getByRole('textbox', { name: 'Clave' }), 'CL')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Nombre')
    await fillClassFields(user)
    expect(screen.getByRole('alert')).toHaveTextContent('')
    await user.click(screen.getByRole('button', { name: 'Crear Clase' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la Clase.'))
    expect(screen.getByRole('alert')).not.toHaveTextContent('secret backend cause')
    expect(screen.getByRole('alert')).not.toHaveTextContent('/id/token')
  })

  it('moves with approved arrows while preserving native selection and composition', async () => {
    const { user } = await openDialog()
    const key = screen.getByRole('textbox', { name: 'Clave' })
    const name = screen.getByRole('textbox', { name: 'Nombre' })
    const plural = screen.getByRole('textbox', { name: 'Plural' })
    const slug = screen.getByRole('textbox', { name: 'Slug' })
    const cancel = screen.getByRole('button', { name: 'Cancelar' })
    const submit = screen.getByRole('button', { name: 'Crear Clase' })
    await user.type(key, 'K'); await user.type(name, 'N')
    await user.type(plural, 'Ks'); await user.type(slug, 'k')
    key.focus()
    await user.keyboard('{ArrowDown}'); expect(name).toHaveFocus()
    await user.keyboard('{ArrowDown}'); expect(plural).toHaveFocus()
    await user.keyboard('{ArrowDown}'); expect(slug).toHaveFocus()
    await user.keyboard('{ArrowDown}'); expect(cancel).toHaveFocus()
    await user.keyboard('{ArrowRight}'); expect(submit).toHaveFocus()
    await user.keyboard('{ArrowLeft}'); expect(cancel).toHaveFocus()
    await user.keyboard('{ArrowUp}'); expect(slug).toHaveFocus()
    fireEvent.keyDown(slug, { key: 'ArrowDown', isComposing: true })
    expect(slug).toHaveFocus()
    fireEvent.keyDown(key, { key: 'n', ctrlKey: true })
    fireEvent.keyDown(key, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
  })

  it('restores the trigger after Cancelar or Escape and keeps keyboard ownership shared', async () => {
    const { user, trigger } = await openDialog()
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(trigger).toHaveFocus()
    await user.click(trigger); await user.keyboard('{Escape}')
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(trigger).toHaveFocus()
  })

  it('opens from the real contextual N action only on Catalog', () => {
    render(<KeyboardControllerProvider activeSurface="catalog"><NuevaClaseSurface createClass={fakeCreate()} /></KeyboardControllerProvider>)
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.getByRole('dialog', { name: 'Nueva Clase' })).toBeVisible()
  })

  it('does not register Nueva Clase outside the Catalog surface', () => {
    render(<KeyboardControllerProvider activeSurface="bandeja"><NuevaClaseSurface createClass={fakeCreate()} /></KeyboardControllerProvider>)
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.queryByRole('dialog', { name: 'Nueva Clase' })).not.toBeInTheDocument()
  })

  it('supports a Family creation surface with an immutable visible Class parent', async () => {
    let release!: (value: CatalogCreated<CatalogFamilyItem>) => void
    const pending = new Promise<CatalogCreated<CatalogFamilyItem>>((resolve) => (release = resolve))
    const createFamily = vi.fn().mockReturnValue(pending)
    const onCreated = vi.fn().mockResolvedValue(undefined)
    const user = await openDependent({
      level: 'family', parent: { id: 'class-1', label: 'Clase padre' },
      createFamily, onCreated,
    })
    expect(screen.getByRole('dialog', { name: 'Nueva Familia' })).toBeVisible()
    expectParent('Clase padre', 'class-1')
    expect(screen.queryByRole('textbox', { name: 'Clase' })).not.toBeInTheDocument()
    await fillAndSubmit(user, 'Crear Familia', ' FA ', ' Familia ')
    await user.click(screen.getByRole('button', { name: 'Crear Familia' }))
    expect(createFamily).toHaveBeenCalledTimes(1)
    expect(createFamily).toHaveBeenCalledWith({ claseRecursoId: 'class-1', clave: ' FA ', nombre: ' Familia ' })
    expect(Object.isFrozen(createFamily.mock.calls[0][0])).toBe(true)
    expect(screen.getByRole('dialog', { name: 'Nueva Familia' })).toBeVisible()
    release({ disposition: 'CREATED', item: { id: 'family-1', nombre: 'Familia creada' } } as CatalogCreated<CatalogFamilyItem>)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onCreated).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Familia “ Familia ” creada.')
  })

  it('supports a Type creation surface with an immutable visible Family parent and neutral failure', async () => {
    const createType = vi.fn().mockRejectedValue(new Error('backend secret'))
    const user = await openDependent({
      level: 'type', parent: { id: 'family-1', label: 'Familia padre' }, createType,
    })
    expect(screen.getByRole('dialog', { name: 'Nuevo Tipo' })).toBeVisible()
    expectParent('Familia padre', 'family-1')
    await fillAndSubmit(user, 'Crear Tipo', 'TY', 'Tipo')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear el Tipo.'))
    expect(createType).toHaveBeenCalledWith({ familiaRecursoId: 'family-1', clave: 'TY', nombre: 'Tipo' })
    expect(Object.isFrozen(createType.mock.calls[0][0])).toBe(true)
    expect(screen.getByRole('dialog', { name: 'Nuevo Tipo' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Clave' })).toHaveValue('TY')
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Tipo')
    expect(screen.getByRole('alert')).not.toHaveTextContent('backend secret')
  })
})

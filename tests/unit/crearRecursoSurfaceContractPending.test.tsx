import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CrearRecursoSurface } from '../../src/features/resources-master/CrearRecursoSurface'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'

// The contract this file guards: the surface never issues a request before
// "Nuevo recurso" is triggered. Slice C2d replaced the contract-pending
// placeholder with the real REST wizard (see crearRecursoSurfaceWizard.test.tsx
// for its happy path), so every hook here is gated behind the Dialog's own
// mount/unmount (ModalOverlay renders nothing while closed) rather than a
// static blocked screen — this test proves that gate still holds.
const createPendingApi = (): ResourcesMasterRestReadApi => ({
  listResources: vi.fn(() => new Promise(() => undefined)),
  getResourceDetail: vi.fn(() => new Promise(() => undefined)),
  describeResource: vi.fn(() => new Promise(() => undefined)),
  listHierarchyClasses: vi.fn(() => new Promise(() => undefined)),
  listHierarchyFamilies: vi.fn(() => new Promise(() => undefined)),
  listHierarchyTypes: vi.fn(() => new Promise(() => undefined)),
  listUnits: vi.fn(() => new Promise(() => undefined)),
  getTypeEffectiveAttributes: vi.fn(() => new Promise(() => undefined)),
  createResource: vi.fn(() => new Promise(() => undefined)),
})

const renderSurface = (api: ResourcesMasterRestReadApi) =>
  render(
    <KeyboardControllerProvider activeSurface="recursos">
      <CrearRecursoSurface api={api} />
    </KeyboardControllerProvider>,
  )

describe('CrearRecursoSurface mount contract', () => {
  it('opens the wizard from Nuevo recurso with zero network calls beforehand and restores trigger focus on Cancelar', async () => {
    const api = createPendingApi()
    const user = userEvent.setup()
    renderSurface(api)
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    expect(api.listHierarchyClasses).not.toHaveBeenCalled()
    expect(api.listUnits).not.toHaveBeenCalled()
    expect(api.createResource).not.toHaveBeenCalled()

    await user.click(trigger)

    await screen.findByRole('dialog', { name: 'Creador de recursos' })
    expect(await screen.findByRole('searchbox', { name: 'Clase' })).toHaveFocus()
    expect(api.listHierarchyClasses).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })

  it('keeps the N command and Escape close behavior local to the keyboard controller without network calls beforehand', async () => {
    const api = createPendingApi()
    renderSurface(api)
    const trigger = screen.getByRole('button', { name: 'Nuevo recurso' })

    expect(api.listHierarchyClasses).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'n' })

    const dialog = await screen.findByRole('dialog', {
      name: 'Creador de recursos',
    })
    fireEvent.keyDown(dialog, { key: 'Escape' })

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })
})

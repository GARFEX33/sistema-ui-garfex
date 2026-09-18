import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { useEffect, useRef } from 'react'
import { AppProviders } from '../../src/app/providers/AppProviders'
import { createAppRouter } from '../../src/app/router'
import { KeyboardControllerProvider } from '../../src/shared/keyboard/KeyboardController'
import { useKeyboardController } from '../../src/shared/keyboard/keyboardControllerContext'
import type { ResourcesMasterRestReadApi } from '../../src/features/resources-master/resourcesMaster.api'

const resourcesMasterApiFactory = vi.hoisted(() => vi.fn())
vi.mock('../../src/features/resources-master/resourcesMaster.api', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/features/resources-master/resourcesMaster.api')
  >('../../src/features/resources-master/resourcesMaster.api')
  return {
    ...actual,
    createResourcesMasterRestApi: resourcesMasterApiFactory,
  }
})

const resource = (id: string, identityV1: string, label: string) => ({
  id,
  identityV1,
  scope: { classCode: 'MATERIAL', familyCode: 'CABLE', typeCode: 'UTP' },
  naturalUnit: 'm',
  active: true,
  revision: '1',
  attributes: [{ code: 'ETIQUETA', value: { kind: 'TEXT', value: label } }],
})

function stubResourcesMasterApi() {
  const api = {
    listResources: vi.fn(async () => ({
      resources: [
        resource('r1', 'MATERIAL-CABLE-UTP-001', 'Uno'),
        resource('r2', 'MATERIAL-CABLE-UTP-002', 'Dos'),
      ],
      hasPrevious: false,
      hasNext: false,
    })),
    getResourceDetail: vi.fn(),
    describeResource: vi.fn(),
    getTypeEffectiveAttributes: vi.fn(async () => ({
      typeCode: 'UTP',
      attributes: [
        {
          characteristic: {
            code: 'ETIQUETA',
            name: 'Etiqueta',
            valueType: 'CONTROLLED_TEXT',
          },
          effectiveMode: 'OPTIONAL',
          identityParticipates: false,
          notApplicable: false,
          position: 0,
          hasPosition: true,
          options: [],
          source: { level: 'TYPE', code: 'UTP' },
          rules: [],
        },
      ],
    })),
    listHierarchyClasses: vi.fn(async () => ({
      items: [
        {
          id: 'class-1',
          code: 'MATERIAL',
          name: 'Material',
          active: true,
          revision: '1',
        },
        {
          id: 'class-2',
          code: 'SERVICIO',
          name: 'Servicio',
          active: true,
          revision: '2',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    })),
    listHierarchyFamilies: vi.fn(async () => ({
      items: [
        {
          id: 'family-1',
          code: 'CABLE',
          name: 'Cable',
          classCode: 'MATERIAL',
          active: true,
          revision: '3',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    })),
    listHierarchyTypes: vi.fn(async () => ({
      items: [
        {
          id: 'type-1',
          code: 'UTP',
          name: 'UTP',
          classCode: 'MATERIAL',
          familyCode: 'CABLE',
          active: true,
          revision: '4',
        },
      ],
      hasPrevious: false,
      hasNext: false,
    })),
  } as ResourcesMasterRestReadApi
  resourcesMasterApiFactory.mockReturnValue(api)
  return api
}

function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] })
  const testRouter = createAppRouter(history)
  return render(<AppProviders router={testRouter} />)
}

describe('runtime shell and operations inbox entry', () => {
  it('redirects the initial location to /bandeja and exposes the workstation shell', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeVisible()
    expect(screen.getByRole('banner')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Bandeja' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('img', { name: 'GARFEX' })).toHaveAttribute(
      'src',
      '/docs/garfex-blanco-negativo.svg',
    )
    expect(
      screen.getByRole('button', { name: /Buscar o ejecutar comando/ }),
    ).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/23|Sincronizado|sin pendientes|sin resultados/i),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: /detalle|panel/i }),
    ).not.toBeInTheDocument()
  })

  it('renders both workstation destinations without product data effects or future destinations', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem')
    renderAt('/bandeja')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live]')).not.toBeInTheDocument()
  })

  it('resolves /catalogo and marks only the resolved destination as active', async () => {
    renderAt('/catalogo')
    expect(
      await screen.findByRole('heading', { name: 'Catálogo' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Bandeja' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByText('ESPACIOS DE TRABAJO')).toBeVisible()
    expect(screen.getByText('CONFIGURACIÓN DEL MODELO')).toBeVisible()
    expect(screen.getByText('Configuración / Catálogo')).toBeVisible()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
  })
})

describe('sidebar keyboard navigation', () => {
  it('keeps only the three real links in the immediate group and handles local navigation', async () => {
    renderAt('/bandeja')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    const resources = screen.getByRole('link', { name: 'Recursos maestros' })
    const catalog = screen.getByRole('link', { name: 'Catálogo' })
    expect(screen.getAllByRole('link')).toHaveLength(3)
    inbox.focus()
    fireEvent.keyDown(inbox, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(resources)
    fireEvent.keyDown(resources, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(catalog)
    fireEvent.keyDown(catalog, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(catalog)
    fireEvent.keyDown(catalog, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(resources)
    fireEvent.keyDown(resources, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(inbox)
    fireEvent.keyDown(catalog, { key: 'Home' })
    expect(document.activeElement).toBe(inbox)
    fireEvent.keyDown(inbox, { key: 'End' })
    expect(document.activeElement).toBe(catalog)
    expect(screen.getByText('Familias')).not.toHaveAttribute('data-spatial-id')
  })

  it('does not cancel native Enter or Tab traversal and keeps focus on ArrowRight without a target', async () => {
    renderAt('/bandeja')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    inbox.focus()
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    inbox.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(false)
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    inbox.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)
    const reverseTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    inbox.dispatchEvent(reverseTab)
    expect(reverseTab.defaultPrevented).toBe(false)
    fireEvent.keyDown(inbox, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inbox)
  })
})

describe('sidebar triangulation', () => {
  it('activates the real route through native Enter', async () => {
    renderAt('/catalogo')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    inbox.focus()
    await userEvent.setup().keyboard('{Enter}')
    expect(
      await screen.findByRole('heading', { name: 'Bandeja' }),
    ).toBeVisible()
  })

  it('anchors ArrowLeft at the current route before scoring sidebar geometry', async () => {
    renderAt('/catalogo')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    const catalog = screen.getByRole('link', { name: 'Catálogo' })
    const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
    const rects = new Map<HTMLElement, DOMRect>([
      [trigger, { left: 360, top: 76, right: 520, bottom: 116 } as DOMRect],
      [catalog, { left: 24, top: 564, right: 224, bottom: 604 } as DOMRect],
      [inbox, { left: 24, top: 108, right: 224, bottom: 148 } as DOMRect],
    ])
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function () {
        return (
          rects.get(this) ??
          ({ left: 0, top: 0, right: 0, bottom: 0 } as DOMRect)
        )
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(
      function () {
        return rects.has(this) ? [rects.get(this)!] : []
      },
    )
    const user = userEvent.setup()
    await user.click(trigger)
    const key = screen.getByRole('textbox', { name: 'Clave' })
    fireEvent.keyDown(key, { key: 'ArrowLeft' })
    expect(key).toHaveFocus()
    await user.keyboard('{Escape}')
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(trigger).toHaveFocus()
    fireEvent.keyDown(trigger, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(catalog)
    vi.restoreAllMocks()
  })

  it('keeps the two-link group at both vertical extremes and marks only real catalog controls', async () => {
    renderAt('/catalogo')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    const catalog = screen.getByRole('link', { name: 'Catálogo' })
    inbox.focus()
    fireEvent.keyDown(inbox, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(inbox)
    catalog.focus()
    fireEvent.keyDown(catalog, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(catalog)
    expect(screen.getByRole('button', { name: 'Nueva Clase' })).toHaveAttribute(
      'data-spatial-id',
      'catalog.new-class',
    )
    expect(screen.getAllByText(/^(Familias|Tipos)$/)).toHaveLength(2)
    expect(
      document.querySelectorAll('.navigation-static[data-spatial-id]'),
    ).toHaveLength(0)
    expect(
      document.querySelectorAll(
        '.navigation-static[tabindex], .navigation-static[role]',
      ),
    ).toHaveLength(0)
  })

  it('scopes catalog opt-in marking to its rendered screen', async () => {
    const query = vi.spyOn(document, 'querySelector')
    renderAt('/catalogo')
    await screen.findByRole('button', { name: 'Nueva Clase' })
    expect(query).not.toHaveBeenCalledWith(
      '.catalog-hierarchy-screen .catalog-create-trigger',
    )
    query.mockRestore()
  })

  it('hands ArrowRight to the best measured real main control without RTL inversion', async () => {
    renderAt('/catalogo')
    const catalog = await screen.findByRole('link', { name: 'Catálogo' })
    const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
    const rects = new Map<HTMLElement, DOMRect>([
      [catalog, { left: 0, top: 0, right: 10, bottom: 10 } as DOMRect],
      [trigger, { left: 20, top: 0, right: 30, bottom: 10 } as DOMRect],
    ])
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        return (
          rects.get(this) ??
          ({ left: 0, top: 0, right: 0, bottom: 0 } as DOMRect)
        )
      })
    const clientSpy = vi
      .spyOn(HTMLElement.prototype, 'getClientRects')
      .mockImplementation(function () {
        return rects.has(this) ? [rects.get(this)!] : []
      })
    catalog.setAttribute('dir', 'rtl')
    catalog.focus()
    fireEvent.keyDown(catalog, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(catalog)
    expect(rectSpy).not.toHaveBeenCalled()
    clientSpy.mockRestore()
    rectSpy.mockRestore()
  })
})

describe('resources maestros keyboard navigation', () => {
  // Slice E2 replaced the three HierarchyNavigator button columns with
  // StagedSearchSelector (search + arrow + Enter, auto-focus advancing to
  // the next column) — a deliberate, approved divergence from the
  // arrow-hopping grid HierarchyNavigator still gives Catálogo. This test
  // exercises the real (unmocked) useResourcesHierarchy + REST stub end to
  // end: type-ahead search, arrow-highlight, Enter-confirm, and the
  // automatic focus jump to the next column, three times in a row, ending
  // with the resource list actually filtered by the confirmed scope.
  //
  // Slice E2b: AppShell.tsx's cross-region ArrowLeft/Right wiring now lands
  // on each StagedSearchSelector's search input directly
  // (`data-spatial-id="resources.class"|"resources.family"|"resources.type"`,
  // additive `spatialId` prop) instead of the old
  // `data-spatial-level`/`aria-pressed` button-grid lookup, which no longer
  // matches this component's DOM. ArrowUp/Down are left untouched so
  // StagedSearchSelector's own in-list arrow handling (exercised above)
  // keeps working; only entering/leaving a column from outside it changed.
  // See the chain test below.
  it('confirms Clase→Familia→Tipo purely via search+arrow+Enter, auto-focusing the next column each time', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByRole('link', { name: 'Recursos maestros' })
    const user = userEvent.setup()

    const claseInput = screen.getByRole('searchbox', { name: 'Clase' })
    await user.click(claseInput)
    await user.type(claseInput, 'mat')
    fireEvent.keyDown(claseInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'Material' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const familiaInput = screen.getByRole('searchbox', { name: 'Familia' })
    expect(familiaInput).toHaveFocus()
    await screen.findByRole('option', { name: 'Cable' })
    await user.type(familiaInput, 'cab')
    fireEvent.keyDown(familiaInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'Cable' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const tipoInput = screen.getByRole('searchbox', { name: 'Tipo' })
    expect(tipoInput).toHaveFocus()
    await screen.findByRole('option', { name: 'UTP' })
    await user.type(tipoInput, 'utp')
    fireEvent.keyDown(tipoInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'UTP' })).toHaveFocus()
    await user.keyboard('{Enter}')

    await screen.findByText('UTP Uno')
    expect(screen.getByText('UTP Dos')).toBeVisible()

    fireEvent.keyDown(document, { key: 'b' })
    expect(screen.getByPlaceholderText('Buscar recursos')).toHaveFocus()
  })

  it('enters the hierarchy from the sidebar and hops Clase→Familia→Tipo→search with ArrowRight', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')

    const recursosLink = screen.getByRole('link', {
      name: 'Recursos maestros',
    })
    recursosLink.focus()
    fireEvent.keyDown(recursosLink, { key: 'ArrowRight' })
    const claseInput = screen.getByRole('searchbox', { name: 'Clase' })
    expect(claseInput).toHaveFocus()

    fireEvent.keyDown(claseInput, { key: 'ArrowRight' })
    const familiaInput = screen.getByRole('searchbox', { name: 'Familia' })
    expect(familiaInput).toHaveFocus()

    fireEvent.keyDown(familiaInput, { key: 'ArrowRight' })
    const tipoInput = screen.getByRole('searchbox', { name: 'Tipo' })
    expect(tipoInput).toHaveFocus()

    fireEvent.keyDown(tipoInput, { key: 'ArrowRight' })
    expect(screen.getByPlaceholderText('Buscar recursos')).toHaveFocus()
  })

  it('hops back Tipo→Familia→Clase→sidebar with ArrowLeft', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')

    const recursosLink = screen.getByRole('link', {
      name: 'Recursos maestros',
    })
    const claseInput = screen.getByRole('searchbox', { name: 'Clase' })
    const familiaInput = screen.getByRole('searchbox', { name: 'Familia' })
    const tipoInput = screen.getByRole('searchbox', { name: 'Tipo' })

    fireEvent.keyDown(tipoInput, { key: 'ArrowLeft' })
    expect(familiaInput).toHaveFocus()

    fireEvent.keyDown(familiaInput, { key: 'ArrowLeft' })
    expect(claseInput).toHaveFocus()

    fireEvent.keyDown(claseInput, { key: 'ArrowLeft' })
    expect(recursosLink).toHaveFocus()
  })

  it('sends ArrowLeft/Escape from the resource search box or a result row back to the Tipo column', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')

    const search = screen.getByPlaceholderText('Buscar recursos')
    const tipoInput = screen.getByRole('searchbox', { name: 'Tipo' })

    fireEvent.keyDown(search, { key: 'ArrowLeft' })
    expect(tipoInput).toHaveFocus()

    const firstRow = document.querySelector(
      '[data-resource-row]',
    ) as HTMLElement
    fireEvent.keyDown(firstRow, { key: 'Escape' })
    expect(tipoInput).toHaveFocus()
  })

  it('leaves typing, in-list arrow highlighting, and Enter-confirm inside a column untouched by the new hop wiring', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')
    const user = userEvent.setup()

    const claseInput = screen.getByRole('searchbox', { name: 'Clase' })
    await user.click(claseInput)
    await user.type(claseInput, 'mat')
    fireEvent.keyDown(claseInput, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: 'Material' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('searchbox', { name: 'Familia' })).toHaveFocus()
  })

  it('does not capture Resources spatial keys while the search input is composing', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')
    const search = screen.getByPlaceholderText('Buscar recursos')
    search.focus()
    fireEvent.keyDown(search, { key: 'ArrowDown', isComposing: true })
    expect(search).toHaveFocus()
  })

  it('jumps to the search box with B from anywhere on the screen', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')
    const search = screen.getByPlaceholderText('Buscar recursos')
    const firstRow = document.querySelector(
      '[data-resource-row]',
    ) as HTMLElement
    firstRow.focus()
    fireEvent.keyDown(document, { key: 'b' })
    expect(document.activeElement).toBe(search)
  })

  it('does not steal B from an unrelated editing context', async () => {
    stubResourcesMasterApi()
    renderAt('/recursos')
    await screen.findByText('UTP Uno')
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'b' })
    expect(document.activeElement).toBe(input)
    input.remove()
  })

  it('does not fire B outside the recursos surface', async () => {
    renderAt('/bandeja')
    const inbox = await screen.findByRole('link', { name: 'Bandeja' })
    inbox.focus()
    fireEvent.keyDown(document, { key: 'b' })
    expect(document.activeElement).toBe(inbox)
  })
})

describe('unit 2 discovery surfaces (RED)', () => {
  it('exposes a help button beside the command trigger and opens the same help', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })
    const command = screen.getByRole('button', {
      name: /Buscar o ejecutar comando/,
    })
    const help = screen.getByRole('button', { name: 'Atajos de teclado' })
    expect(command.parentElement).toBe(help.parentElement)
    expect(command.nextElementSibling).toBe(help)
    expect(help).toHaveTextContent('Atajos')
    expect(help.querySelector('kbd')).toHaveTextContent('?')
    await userEvent.setup().click(help)
    expect(screen.getByRole('dialog', { name: /Ayuda/i })).toBeVisible()
  })
})

describe('shell keyboard controller', () => {
  it('uses one live shell listener and unregisters stale actions', () => {
    const listenerSpy = vi.spyOn(document, 'addEventListener')
    function Fixture({ enabled }: { enabled: boolean }) {
      const { registerAction } = useKeyboardController()
      useEffect(() => {
        if (!enabled) return
        return registerAction({
          id: 'catalog.new-class',
          surface: 'catalog',
          key: 'n',
          label: 'Nueva Clase',
          root: () => document.body,
          isAvailable: () => true,
          run: () => document.body.setAttribute('data-ran', 'true'),
        })
      }, [enabled, registerAction])
      return null
    }
    const { rerender } = render(
      <KeyboardControllerProvider activeSurface="catalog">
        <Fixture enabled />
      </KeyboardControllerProvider>,
    )
    expect(
      listenerSpy.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(1)
    fireEvent.keyDown(document, { key: 'n' })
    expect(document.body).toHaveAttribute('data-ran', 'true')
    document.body.removeAttribute('data-ran')
    rerender(
      <KeyboardControllerProvider activeSurface="catalog">
        <Fixture enabled={false} />
      </KeyboardControllerProvider>,
    )
    fireEvent.keyDown(document, { key: 'n' })
    expect(document.body).not.toHaveAttribute('data-ran')
    listenerSpy.mockRestore()
  })

  it('blocks contextual actions from an active portaled overlay', () => {
    const run = vi.fn()
    function Fixture() {
      const { registerAction, registerOverlay } = useKeyboardController()
      const portalRoot = useRef<HTMLDivElement>(null)
      useEffect(() => {
        const removeAction = registerAction({
          id: 'catalog.new-class',
          surface: 'catalog',
          key: 'n',
          label: 'Nueva Clase',
          root: () => document.body,
          isAvailable: () => true,
          run,
        })
        const removeOverlay = registerOverlay(() => portalRoot.current)
        return () => {
          removeAction()
          removeOverlay()
        }
      }, [registerAction, registerOverlay])
      return <div ref={portalRoot} data-portal-root />
    }
    render(
      <KeyboardControllerProvider activeSurface="catalog">
        <Fixture />
      </KeyboardControllerProvider>,
    )
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    expect(run).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('gives overlays precedence, keeps Ctrl+N native, and opens contextual help', async () => {
    renderAt('/catalogo')
    const trigger = await screen.findByRole('button', { name: 'Nueva Clase' })
    fireEvent.keyDown(document, { key: 'n' })
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toBeVisible()
    fireEvent.keyDown(document, { key: '?' })
    expect(
      screen.queryByRole('dialog', { name: /Ayuda/i }),
    ).not.toBeInTheDocument()
    await userEvent.setup().keyboard('{Escape}')
    fireEvent.keyDown(document, { key: '?' })
    expect(screen.getByRole('dialog', { name: /Ayuda/i })).toBeVisible()
    expect(screen.getByText('N — Nueva Clase')).toBeVisible()
    expect(trigger).not.toHaveFocus()
    const ctrlN = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(ctrlN)
    expect(ctrlN.defaultPrevented).toBe(false)
    expect(screen.getByRole('dialog', { name: /Ayuda/i })).toBeVisible()
  })

  it('restores to the active route when the opener is removed', async () => {
    renderAt('/catalogo')
    const catalog = await screen.findByRole('link', { name: 'Catálogo' })
    const trigger = screen.getByRole('button', { name: 'Nueva Clase' })
    await userEvent.setup().click(trigger)
    trigger.remove()
    await userEvent.setup().keyboard('{Escape}')
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(catalog).toHaveFocus()
  })

  it('opens help from semantic international question marks', async () => {
    renderAt('/bandeja')
    await screen.findByRole('heading', { name: 'Bandeja' })
    fireEvent.keyDown(document, { key: '?', shiftKey: true })
    expect(screen.getByRole('dialog', { name: /Ayuda/i })).toBeVisible()
  })

  it('does not open single-key actions from editable or IME contexts', () => {
    renderAt('/catalogo')
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'n' })
    fireEvent.keyDown(input, { key: '?' })
    fireEvent.keyDown(input, { key: 'n', isComposing: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    input.remove()
  })
})

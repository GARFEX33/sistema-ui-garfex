import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { GarfexLogoNegative } from '../../shared/design-system/GarfexLogoNegative'
import { KeyboardControllerProvider } from '../../shared/keyboard/KeyboardController'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { CommandEntry } from './CommandEntry'
import { KeyboardHelpDialog } from './KeyboardHelpDialog'
import { useKeyboardCommands } from '../../shared/keyboard/keyboardControllerContext'
import { focusSpatialTarget } from '../../shared/keyboard/spatialNavigation'

function GlobalHelpTrigger() {
  const command = useKeyboardCommands().find(
    (candidate) => candidate.id === 'global.contextual-help',
  )
  return (
    <button
      type="button"
      className="help-trigger"
      aria-label="Atajos de teclado"
      title="Atajos de teclado"
      onClick={(event) => command?.action(event.currentTarget)}
    >
      <span>Atajos</span>
      <kbd aria-hidden="true">{command?.shortcut}</kbd>
    </button>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)
  const helpOpenerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const helpWasOpenRef = useRef(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const sidebarLinks = useRef<Array<HTMLAnchorElement | null>>([])
  const appShellRef = useRef<HTMLDivElement | null>(null)
  const workspaceMainRef = useRef<HTMLElement | null>(null)

  const handleSidebarKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
        return
      const links = sidebarLinks.current.filter(
        (link): link is HTMLAnchorElement => link !== null,
      )
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        links[event.key === 'Home' ? 0 : links.length - 1]?.focus()
        return
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const result = focusSpatialTarget({
          origin: event.currentTarget,
          direction: event.key === 'ArrowUp' ? 'up' : 'down',
          boundaryRoot: appShellRef.current ?? event.currentTarget,
          candidates: links,
        })
        if (result.status === 'moved') event.preventDefault()
        return
      }
      if (event.key !== 'ArrowRight') return
      event.preventDefault()
      const boundaryRoot = workspaceMainRef.current
      if (!boundaryRoot) return
      if (event.currentTarget.dataset.spatialId === 'sidebar.catalogo') {
        focusSpatialTarget({
          origin: event.currentTarget,
          direction: 'right',
          boundaryRoot,
          candidateFilter: (candidate) =>
            candidate.dataset.catalogLevel === 'classes',
          onMoved: (target) => target.click(),
        })
        return
      }
      focusSpatialTarget({
        origin: event.currentTarget,
        direction: 'right',
        boundaryRoot,
      })
    },
    [],
  )

  const handleMainKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        !/^Arrow(?:Up|Down|Left|Right)$/.test(event.key)
      )
        return
      const target = event.target
      const boundaryRoot = workspaceMainRef.current
      if (!(target instanceof HTMLElement) || !boundaryRoot) return
      const row = target.closest<HTMLElement>('[data-catalog-level]')
      if (!row) {
        if (
          event.key !== 'ArrowLeft' ||
          target.dataset.spatialId !== 'catalog.new-class'
        )
          return
        event.preventDefault()
        const links = sidebarLinks.current.filter(
          (link): link is HTMLAnchorElement => link !== null,
        )
        const activeRoute = links.find(
          (link) => link.getAttribute('aria-current') === 'page',
        )
        focusSpatialTarget({
          origin: target,
          direction: 'left',
          boundaryRoot: appShellRef.current ?? boundaryRoot,
          candidates: activeRoute ? [activeRoute] : links,
        })
        return
      }
      event.preventDefault()
      const level = row.dataset.catalogLevel!
      const activateHierarchyTarget = (candidate: HTMLElement) =>
        candidate.click()
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        focusSpatialTarget({
          origin: row,
          direction: event.key === 'ArrowUp' ? 'up' : 'down',
          boundaryRoot,
          candidateFilter: (candidate) =>
            candidate.dataset.catalogLevel === level,
          onMoved: activateHierarchyTarget,
        })
        return
      }
      if (event.key === 'ArrowRight') {
        const child =
          level === 'classes'
            ? 'families'
            : level === 'families'
              ? 'types'
              : null
        if (child)
          focusSpatialTarget({
            origin: row,
            direction: 'right',
            boundaryRoot,
            candidateFilter: (candidate) =>
              candidate.dataset.catalogLevel === child,
            onMoved: activateHierarchyTarget,
          })
        return
      }
      if (level === 'classes') {
        const links = sidebarLinks.current.filter(
          (link): link is HTMLAnchorElement => link !== null,
        )
        const activeRoute = links.find(
          (link) => link.getAttribute('aria-current') === 'page',
        )
        focusSpatialTarget({
          origin: row,
          direction: 'left',
          boundaryRoot: appShellRef.current ?? boundaryRoot,
          candidates: activeRoute ? [activeRoute] : links,
        })
        return
      }
      const parentLevel = level === 'types' ? 'families' : 'classes'
      focusSpatialTarget({
        origin: row,
        direction: 'left',
        boundaryRoot,
        candidateFilter: (candidate) =>
          candidate.dataset.catalogLevel === parentLevel &&
          candidate.getAttribute('aria-pressed') === 'true',
        onMoved: activateHierarchyTarget,
      })
    },
    [],
  )

  const openCommand = useCallback((opener: HTMLElement | null) => {
    openerRef.current = opener?.isConnected ? opener : null
    setCommandOpen(true)
  }, [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openHelp = useCallback(
    (_surface: 'bandeja' | 'catalog', opener: HTMLElement | null) => {
      helpOpenerRef.current = opener?.isConnected ? opener : null
      setHelpOpen(true)
    },
    [],
  )
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const activeSurface = pathname === '/catalogo' ? 'catalog' : 'bandeja'

  useEffect(() => {
    if (commandOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    restoreFocusNextFrame(openerRef.current, [
      () => document.querySelector<HTMLElement>('.command-trigger'),
      () => document.querySelector<HTMLElement>('[aria-current="page"]'),
    ])
    openerRef.current = null
    wasOpenRef.current = false
  }, [commandOpen])

  useEffect(() => {
    if (helpOpen) {
      helpWasOpenRef.current = true
      return
    }
    if (!helpWasOpenRef.current) return
    restoreFocusNextFrame(helpOpenerRef.current, [
      () => document.querySelector<HTMLElement>('[aria-current="page"]'),
      () => document.querySelector<HTMLElement>('.command-trigger'),
    ])
    helpOpenerRef.current = null
    helpWasOpenRef.current = false
  }, [helpOpen])

  return (
    <KeyboardControllerProvider
      activeSurface={activeSurface}
      onCommandPalette={openCommand}
      onHelp={openHelp}
    >
      <div ref={appShellRef} className="app-shell">
        <aside className="app-rail">
          <div className="brand-lockup">
            <GarfexLogoNegative />
          </div>
          <nav aria-label="Navegación principal" className="primary-navigation">
            <p className="navigation-section-label">ESPACIOS DE TRABAJO</p>
            <Link
              ref={(link) => {
                sidebarLinks.current[0] = link
              }}
              to="/bandeja"
              data-spatial-id="sidebar.bandeja"
              onKeyDown={handleSidebarKeyDown}
              activeProps={{ className: 'navigation-link is-active' }}
              className="navigation-link"
            >
              Bandeja
            </Link>
            <span className="navigation-static">Recursos maestros</span>
            <span className="navigation-static">Compras</span>
            <span className="navigation-static is-current">Configuración</span>
            <p className="navigation-section-label model-navigation-label">
              CONFIGURACIÓN DEL MODELO
            </p>
            <span className="navigation-static">Clases</span>
            <span className="navigation-static">Familias</span>
            <span className="navigation-static is-current">Tipos</span>
            <span className="navigation-static">Atributos…</span>
            <span className="navigation-static">Presentación…</span>
            <Link
              ref={(link) => {
                sidebarLinks.current[1] = link
              }}
              to="/catalogo"
              data-spatial-id="sidebar.catalogo"
              onKeyDown={handleSidebarKeyDown}
              activeProps={{ className: 'navigation-link is-active' }}
              className="navigation-link navigation-catalog-link"
            >
              Catálogo
            </Link>
          </nav>
        </aside>
        <div className="app-workspace">
          <header className="topbar">
            <span className="topbar-brand">GARFEX</span>
            <span className="topbar-route">
              {pathname === '/catalogo'
                ? 'Configuración / Catálogo'
                : 'Entrada operativa / Bandeja'}
            </span>
            <div className="topbar-actions">
              <CommandEntry
                surface={activeSurface}
                isOpen={commandOpen}
                onOpen={openCommand}
                onClose={closeCommand}
              />
              <GlobalHelpTrigger />
            </div>
            <KeyboardHelpDialog
              isOpen={helpOpen}
              surface={activeSurface}
              onClose={closeHelp}
            />
          </header>
          <main
            ref={workspaceMainRef}
            className="workspace-main"
            onKeyDown={handleMainKeyDown}
          >
            {children}
          </main>
        </div>
      </div>
    </KeyboardControllerProvider>
  )
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { GarfexLogoNegative } from '../../shared/design-system/GarfexLogoNegative'
import { KeyboardControllerProvider } from '../../shared/keyboard/KeyboardController'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { CommandEntry } from './CommandEntry'
import { KeyboardHelpDialog } from './KeyboardHelpDialog'
import { useKeyboardCommands } from '../../shared/keyboard/keyboardControllerContext'
import { focusSpatialTarget } from '../../shared/keyboard/spatialNavigation'

function focusRow(candidate: HTMLElement | null) {
  candidate?.focus({ preventScroll: true })
  candidate?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

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
    (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
        return
      const links = sidebarLinks.current.filter(
        (link): link is HTMLAnchorElement => link !== null,
      )
      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
        event.preventDefault()
        const nextIndex =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? links.length - 1
              : index + (event.key === 'ArrowDown' ? 1 : -1)
        links[nextIndex]?.focus()
        return
      }
      if (event.key !== 'ArrowRight') return
      event.preventDefault()
      const boundaryRoot = workspaceMainRef.current
      if (!boundaryRoot) return
      if (event.currentTarget.dataset.spatialId === 'sidebar.catalogo') {
        const firstClass = boundaryRoot.querySelector<HTMLElement>(
          '[data-catalog-level="classes"][data-spatial-id]',
        )
        focusRow(firstClass)
        firstClass?.click()
        return
      }
      if (event.currentTarget.dataset.spatialId === 'sidebar.recursos') {
        const firstClass = boundaryRoot.querySelector<HTMLElement>(
          '[data-spatial-level="class"][data-spatial-id]',
        )
        focusRow(firstClass)
        firstClass?.click()
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
        event.nativeEvent.isComposing ||
        event.nativeEvent.keyCode === 229 ||
        !/^(?:Arrow(?:Up|Down|Left|Right)|Escape)$/.test(event.key)
      )
        return
      const target = event.target
      const boundaryRoot = workspaceMainRef.current
      if (!(target instanceof HTMLElement) || !boundaryRoot) return
      const focusDeepestResourcesHierarchy = () => {
        for (const level of ['type', 'family', 'class']) {
          const selected = boundaryRoot.querySelector<HTMLElement>(
            `[data-spatial-level="${level}"][aria-pressed="true"]`,
          )
          if (selected) {
            focusRow(selected)
            return
          }
        }
      }
      if (target.dataset.spatialId === 'resources.search') {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          focusRow(
            boundaryRoot.querySelector<HTMLElement>(
              '[data-resource-row][data-spatial-id]',
            ),
          )
          return
        }
        if (event.key === 'ArrowLeft' || event.key === 'Escape') {
          event.preventDefault()
          focusDeepestResourcesHierarchy()
        }
        return
      }
      if (target.getAttribute('role') === 'tab') {
        if (
          event.key === 'ArrowDown' &&
          target.dataset.spatialId === 'catalog.tab.attributes'
        ) {
          event.preventDefault()
          focusRow(
            boundaryRoot.querySelector<HTMLElement>(
              '[data-catalog-level="attributes"][data-spatial-id]',
            ),
          )
          return
        }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const tabs = [
          ...boundaryRoot.querySelectorAll<HTMLElement>('[role="tab"]'),
        ]
        const index = tabs.indexOf(target)
        if (event.key === 'ArrowLeft' && index === 0) {
          focusRow(
            boundaryRoot.querySelector<HTMLElement>(
              '[data-catalog-level="types"][aria-pressed="true"]',
            ),
          )
          return
        }
        const nextIndex = Math.max(
          0,
          Math.min(
            tabs.length - 1,
            index + (event.key === 'ArrowRight' ? 1 : -1),
          ),
        )
        const nextTab = tabs[nextIndex]
        if (nextTab && nextTab !== target) {
          focusRow(nextTab)
          nextTab.click()
        }
        return
      }
      const resourceRow = target.closest<HTMLElement>('[data-resource-row]')
      if (resourceRow) {
        event.preventDefault()
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          const rows = [
            ...boundaryRoot.querySelectorAll<HTMLElement>(
              '[data-resource-row]',
            ),
          ]
          const index = rows.indexOf(resourceRow)
          if (event.key === 'ArrowUp' && index === 0) {
            focusRow(
              document.querySelector<HTMLElement>(
                '[data-spatial-id="resources.search"]',
              ),
            )
            return
          }
          const next = Math.max(
            0,
            Math.min(
              rows.length - 1,
              index + (event.key === 'ArrowDown' ? 1 : -1),
            ),
          )
          focusRow(rows[next] ?? null)
          return
        }
        if (event.key === 'ArrowLeft' || event.key === 'Escape') {
          focusDeepestResourcesHierarchy()
        }
        return
      }
      const resourcesHierarchyRow = target.closest<HTMLElement>(
        '[data-spatial-level]',
      )
      if (resourcesHierarchyRow) {
        event.preventDefault()
        const level = resourcesHierarchyRow.dataset.spatialLevel!
        const move = (candidate: HTMLElement | null) => {
          focusRow(candidate)
          candidate?.click()
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          const rows = [
            ...boundaryRoot.querySelectorAll<HTMLElement>(
              `[data-spatial-level="${level}"]`,
            ),
          ]
          const index = rows.indexOf(resourcesHierarchyRow)
          move(
            rows[
              Math.max(
                0,
                Math.min(
                  rows.length - 1,
                  index + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              )
            ] ?? null,
          )
          return
        }
        if (event.key === 'ArrowRight') {
          if (level === 'type') {
            focusRow(
              boundaryRoot.querySelector<HTMLElement>(
                '[data-spatial-id="resources.search"]',
              ),
            )
            return
          }
          const child = level === 'class' ? 'family' : 'type'
          move(
            boundaryRoot.querySelector<HTMLElement>(
              `[data-spatial-level="${child}"][data-spatial-id]`,
            ),
          )
          return
        }
        if (event.key === 'ArrowLeft') {
          if (level === 'class') {
            focusRow(
              document.querySelector<HTMLElement>(
                '[data-spatial-id="sidebar.recursos"]',
              ),
            )
            return
          }
          const parent = level === 'type' ? 'family' : 'class'
          focusRow(
            boundaryRoot.querySelector<HTMLElement>(
              `[data-spatial-level="${parent}"][aria-pressed="true"]`,
            ),
          )
        }
        return
      }
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
      const move = (candidate: HTMLElement | null) => {
        focusRow(candidate)
        candidate?.click()
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const rows = [
          ...boundaryRoot.querySelectorAll<HTMLElement>(
            `[data-catalog-level="${level}"]`,
          ),
        ]
        const index = rows.indexOf(row)
        if (level === 'attributes' && event.key === 'ArrowUp' && index === 0) {
          focusRow(
            boundaryRoot.querySelector<HTMLElement>(
              '[data-spatial-id="catalog.tab.attributes"]',
            ),
          )
          return
        }
        const next = Math.max(
          0,
          Math.min(
            rows.length - 1,
            index + (event.key === 'ArrowDown' ? 1 : -1),
          ),
        )
        move(rows[next] ?? null)
        return
      }
      if (event.key === 'ArrowRight') {
        if (level === 'types') {
          move(boundaryRoot.querySelector<HTMLElement>('#catalog-summary-tab'))
          return
        }
        const child =
          level === 'classes'
            ? 'families'
            : level === 'families'
              ? 'types'
              : null
        if (child)
          move(
            boundaryRoot.querySelector<HTMLElement>(
              `[data-catalog-level="${child}"][data-spatial-id]`,
            ),
          )
        return
      }
      if (level === 'attributes') {
        move(
          boundaryRoot.querySelector<HTMLElement>(
            '[data-catalog-level="types"][aria-pressed="true"]',
          ),
        )
      } else if (level === 'types') {
        move(
          boundaryRoot.querySelector<HTMLElement>(
            '[data-catalog-level="families"][aria-pressed="true"]',
          ),
        )
      } else if (level === 'families') {
        move(
          boundaryRoot.querySelector<HTMLElement>(
            '[data-catalog-level="classes"][aria-pressed="true"]',
          ),
        )
      } else {
        focusRow(
          document.querySelector<HTMLElement>(
            '[data-spatial-id="sidebar.catalogo"]',
          ),
        )
      }
    },
    [],
  )

  const openCommand = useCallback((opener: HTMLElement | null) => {
    openerRef.current = opener?.isConnected ? opener : null
    setCommandOpen(true)
  }, [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openHelp = useCallback(
    (
      _surface: 'bandeja' | 'catalog' | 'recursos',
      opener: HTMLElement | null,
    ) => {
      helpOpenerRef.current = opener?.isConnected ? opener : null
      setHelpOpen(true)
    },
    [],
  )
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const activeSurface =
    pathname === '/catalogo'
      ? 'catalog'
      : pathname === '/recursos'
        ? 'recursos'
        : 'bandeja'

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
              onKeyDown={(event) => handleSidebarKeyDown(event, 0)}
              activeProps={{ className: 'navigation-link is-active' }}
              className="navigation-link"
            >
              Bandeja
            </Link>
            <Link
              ref={(link) => {
                sidebarLinks.current[1] = link
              }}
              to="/recursos"
              data-spatial-id="sidebar.recursos"
              onKeyDown={(event) => handleSidebarKeyDown(event, 1)}
              activeProps={{ className: 'navigation-link is-active' }}
              className="navigation-link"
            >
              Recursos maestros
            </Link>
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
                sidebarLinks.current[2] = link
              }}
              to="/catalogo"
              data-spatial-id="sidebar.catalogo"
              onKeyDown={(event) => handleSidebarKeyDown(event, 2)}
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
                : pathname === '/recursos'
                  ? 'Recursos maestros'
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

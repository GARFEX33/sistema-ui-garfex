import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { GarfexLogoNegative } from '../../shared/design-system/GarfexLogoNegative'
import { KeyboardControllerProvider } from '../../shared/keyboard/KeyboardController'
import { restoreFocusNextFrame } from '../../shared/keyboard/focusRestoration'
import { focusSpatialTarget } from '../../shared/keyboard/spatialNavigation'
import { CommandEntry } from './CommandEntry'
import { KeyboardHelpDialog } from './KeyboardHelpDialog'

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

  const openCommand = useCallback((opener: HTMLElement | null) => {
    openerRef.current = opener?.isConnected ? opener : null
    setCommandOpen(true)
  }, [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openHelp = useCallback((opener: HTMLElement | null) => {
    helpOpenerRef.current = opener?.isConnected ? opener : null
    setHelpOpen(true)
  }, [])
  const closeHelp = useCallback(() => setHelpOpen(false), [])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return
    const origin = event.target
    if (!(origin instanceof HTMLElement)) return
    const shell = event.currentTarget
    const navigation = shell.querySelector<HTMLElement>('.primary-navigation')
    const workspace = shell.querySelector<HTMLElement>('.workspace-main')
    if (!navigation || !workspace) return
    const sidebarLinks = [
      ...navigation.querySelectorAll<HTMLAnchorElement>('a[href]'),
    ]
    const sidebarIndex = sidebarLinks.indexOf(origin as HTMLAnchorElement)
    if (sidebarIndex !== -1) {
      if (event.key === 'Home' || event.key === 'End') {
        const target =
          sidebarLinks[event.key === 'Home' ? 0 : sidebarLinks.length - 1]
        if (target && target !== origin) {
          event.preventDefault()
          target.focus()
        }
        return
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const target =
          sidebarLinks[sidebarIndex + (event.key === 'ArrowDown' ? 1 : -1)]
        if (target) {
          event.preventDefault()
          target.focus()
        }
        return
      }
      if (event.key === 'ArrowRight') {
        const result = focusSpatialTarget({
          origin,
          direction: 'right',
          boundaryRoot: shell,
          candidates: [
            ...workspace.querySelectorAll<HTMLElement>('[data-spatial-id]'),
          ],
        })
        if (result.status === 'moved') event.preventDefault()
      }
      return
    }
    if (event.key !== 'ArrowLeft' || !origin.hasAttribute('data-spatial-id'))
      return
    const activeRoute = navigation.querySelector<HTMLElement>(
      '[aria-current="page"]',
    )
    if (!activeRoute) return
    const result = focusSpatialTarget({
      origin,
      direction: 'left',
      boundaryRoot: shell,
      candidates: [activeRoute],
    })
    if (result.status === 'moved') event.preventDefault()
  }, [])

  useEffect(() => {
    if (commandOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    restoreFocusNextFrame(openerRef.current, [
      () => document.querySelector<HTMLElement>('.command-trigger'),
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
      () => document.querySelector<HTMLElement>('.command-trigger'),
      () => document.body,
    ])
    helpOpenerRef.current = null
    helpWasOpenRef.current = false
  }, [helpOpen])

  const shell = (
    <div className="app-shell" onKeyDown={handleKeyDown}>
      <aside className="app-rail">
        <div className="brand-lockup">
          <GarfexLogoNegative />
        </div>
        <nav aria-label="Navegación principal" className="primary-navigation">
          <Link
            to="/bandeja"
            activeProps={{ className: 'navigation-link is-active' }}
            className="navigation-link"
            data-spatial-id="sidebar.bandeja"
          >
            Bandeja
          </Link>
          <Link
            to="/catalogo"
            activeProps={{ className: 'navigation-link is-active' }}
            className="navigation-link"
            data-spatial-id="sidebar.catalogo"
          >
            Catálogo
          </Link>
        </nav>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <CommandEntry
            isOpen={commandOpen}
            onOpen={openCommand}
            onClose={closeCommand}
          />
        </header>
        <main className="workspace-main">{children}</main>
        <KeyboardHelpDialog
          isOpen={helpOpen}
          activeSurface={pathname === '/catalogo' ? 'catalog' : 'bandeja'}
          onOpen={openHelp}
          onClose={closeHelp}
        />
      </div>
    </div>
  )
  return (
    <KeyboardControllerProvider
      activeSurface={pathname === '/catalogo' ? 'catalog' : 'bandeja'}
      onCommandPalette={openCommand}
    >
      {shell}
    </KeyboardControllerProvider>
  )
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { GarfexLogoNegative } from '../../shared/design-system/GarfexLogoNegative'
import { useGlobalCommandShortcut } from '../../shared/keyboard/useGlobalCommandShortcut'
import { CommandEntry } from './CommandEntry'

export function AppShell({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  const openCommand = useCallback((opener: HTMLElement | null) => {
    openerRef.current = opener?.isConnected ? opener : null
    setCommandOpen(true)
  }, [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])

  useGlobalCommandShortcut(openCommand, commandOpen)

  useEffect(() => {
    if (commandOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    const opener = openerRef.current
    if (opener?.isConnected && !opener.hasAttribute('disabled')) opener.focus()
    openerRef.current = null
    wasOpenRef.current = false
  }, [commandOpen])

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div className="brand-lockup">
          <GarfexLogoNegative />
        </div>
        <nav aria-label="Navegación principal" className="primary-navigation">
          <Link
            to="/bandeja"
            activeProps={{ className: 'navigation-link is-active' }}
            className="navigation-link"
          >
            Bandeja
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
      </div>
    </div>
  )
}

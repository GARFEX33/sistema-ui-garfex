import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EffectiveLinkStatus } from '../../src/features/compras/compras.types'
import { PartidaEstadoBadge } from '../../src/features/compras/PartidaEstadoBadge'

const statuses = [
  'PENDIENTE',
  'VINCULADO',
  'SUSPENDIDO',
  'NO_APLICA',
  'CONFLICTO',
] as const satisfies readonly EffectiveLinkStatus[]

const expected = {
  PENDIENTE: {
    label: 'Pendiente',
    classes: ['bg-warning-subtle', 'text-warning', 'border-warning'],
  },
  VINCULADO: {
    label: 'Vinculado',
    classes: ['bg-success-subtle', 'text-success', 'border-success'],
  },
  SUSPENDIDO: {
    label: 'Suspendido',
    classes: ['bg-warning-subtle', 'text-warning', 'border-warning'],
  },
  NO_APLICA: {
    label: 'No aplica',
    classes: ['bg-surface-subtle', 'text-text-secondary', 'border-border'],
  },
  CONFLICTO: {
    label: 'Conflicto',
    classes: ['bg-primary-subtle', 'text-primary', 'border-primary'],
  },
} satisfies Record<EffectiveLinkStatus, { label: string; classes: string[] }>

describe('PartidaEstadoBadge', () => {
  it('accepts the exact EffectiveLinkStatus union and exposes visible Spanish labels', () => {
    for (const status of statuses) {
      const { unmount } = render(<PartidaEstadoBadge status={status} />)
      const badge = screen.getByRole('status', {
        name: `Estado: ${expected[status].label}`,
      })

      expect(badge).toBeVisible()
      expect(badge).toHaveTextContent(expected[status].label)
      unmount()
    }
  })

  it('uses distinct semantic class contracts for every state', () => {
    for (const status of statuses) {
      const { unmount } = render(<PartidaEstadoBadge status={status} />)
      const badge = screen.getByRole('status')

      expect(badge.className).toContain('inline-flex')
      expect(badge.className).toContain('border')
      for (const className of expected[status].classes) {
        expect(badge).toHaveClass(className)
      }
      unmount()
    }
  })

  it('keeps presentation semantic without raw colors or arbitrary utilities', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/compras/PartidaEstadoBadge.tsx'),
      'utf8',
    )

    expect(source).not.toMatch(/#[0-9a-f]{3,8}/i)
    expect(source).not.toMatch(/(?:bg|text|border)-\[[^\]]+\]/)
    expect(source).not.toMatch(/(?:Icon|svg|lucide)/i)
  })
})

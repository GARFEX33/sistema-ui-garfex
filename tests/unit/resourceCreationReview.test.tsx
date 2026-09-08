import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResourceCreationReview } from '../../src/features/resources-master/ResourceCreationReview'
import type { ResourceCreationEvaluation } from '../../src/features/resources-master/resourcesMaster.types'

const evaluation = (
  overrides: Partial<ResourceCreationEvaluation> = {},
): ResourceCreationEvaluation => ({
  status: 'VALID',
  valid: true,
  catalogFingerprint: 'catalog-fingerprint',
  nombre: 'Bomba centrífuga',
  identificadorTecnico: 'BOM-CTR-001',
  asignaciones: [
    {
      asignacionAtributoId: 'assignment-private-id',
      definicionAtributoId: 'definition-private-id',
      aplicabilidadResuelta: 'REQUIRED',
      participaIdentidad: true,
      orden: 1,
      selectedValueId: 'allowed-value-private-id',
      effectiveReasons: [],
    },
    {
      asignacionAtributoId: 'second-assignment-private-id',
      definicionAtributoId: 'second-definition-private-id',
      aplicabilidadResuelta: 'OPTIONAL',
      participaIdentidad: false,
      orden: 2,
      effectiveReasons: [],
    },
  ],
  faltantesRequeridos: [],
  seleccionesInvalidas: [],
  valoresNormalizados: [
    {
      atributoRecursoId: 'normalized-private-id',
      valor: 42,
      opcionAtributoId: 'option-private-id',
    },
  ],
  issues: [
    { code: 'IDENTITY_CONFLICT', message: 'La identidad entra en conflicto.' },
  ],
  ...overrides,
})

describe('ResourceCreationReview', () => {
  it.each([
    ['unavailable', null],
    ['invalid', evaluation({ status: 'INVALID', valid: false })],
    ['incomplete', evaluation({ status: 'INCOMPLETE', valid: false })],
    ['valid status with false validity', evaluation({ valid: false })],
    ['null name', evaluation({ nombre: null })],
    ['null technical identifier', evaluation({ identificadorTecnico: null })],
    ['blank name', evaluation({ nombre: '   ' })],
    ['blank technical identifier', evaluation({ identificadorTecnico: '\t' })],
    ['blank fingerprint', evaluation({ catalogFingerprint: '  ' })],
  ] as const)('fails closed when evaluation is %s', (_, value) => {
    render(<ResourceCreationReview evaluation={value} onCreate={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /crear recurso/i })).toBeNull()
  })

  it('presents backend identity, compact assignment count, and issue messages only', () => {
    render(
      <ResourceCreationReview evaluation={evaluation()} onCreate={vi.fn()} />,
    )

    expect(
      screen.getByRole('heading', { name: 'Revisión de creación' }),
    ).toHaveFocus()
    expect(screen.getByText('Bomba centrífuga')).toBeInTheDocument()
    expect(screen.getByText('BOM-CTR-001')).toBeInTheDocument()
    expect(screen.getByText('2 asignaciones resueltas')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La identidad entra en conflicto.',
    )
    expect(screen.queryByText(/assignment-private-id/)).toBeNull()
    expect(screen.queryByText(/definition-private-id/)).toBeNull()
    expect(screen.queryByText(/allowed-value-private-id/)).toBeNull()
    expect(screen.queryByText(/option-private-id/)).toBeNull()
    expect(screen.queryByText('42')).toBeNull()
  })

  it('calls the supplied callback and respects disabled creation states', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const { rerender } = render(
      <ResourceCreationReview evaluation={evaluation()} onCreate={onCreate} />,
    )

    await user.click(screen.getByRole('button', { name: 'Crear recurso' }))
    expect(onCreate).toHaveBeenCalledOnce()

    rerender(
      <ResourceCreationReview
        disabled
        evaluation={evaluation()}
        isCreating
        onCreate={onCreate}
      />,
    )
    expect(screen.getByRole('button', { name: 'Creando…' })).toBeDisabled()
  })
})

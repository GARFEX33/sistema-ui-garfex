import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResourceCreationContextStage } from '../../src/features/resources-master/ResourceCreationContextStage'
import type { WizardHierarchyView } from '../../src/features/resources-master/resourceCreationWizard.types'

const level = (
  overrides: Partial<WizardHierarchyView['classes']['state']> = {},
) => ({
  state: {
    status: 'ready' as const,
    items: [],
    offset: 0,
    hasPrevious: false,
    hasNext: false,
    ...overrides,
  },
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
})

const buildView = (
  overrides: Partial<WizardHierarchyView> = {},
): WizardHierarchyView => ({
  stage: 'class',
  selection: { classId: null, familyId: null, typeId: null, unitId: null },
  classes: level({
    items: [
      {
        id: 'class-1',
        code: 'MAT',
        name: 'Material',
        active: true,
        revision: '1',
      },
    ],
  }),
  families: level({ status: 'waiting-for-parent' }),
  types: level({ status: 'waiting-for-parent' }),
  units: level({ status: 'waiting-for-parent' }),
  ...overrides,
})

const noop = vi.fn()

const renderStage = (view: WizardHierarchyView) =>
  render(
    <ResourceCreationContextStage
      view={view}
      onConfirmClass={noop}
      onConfirmFamily={noop}
      onConfirmType={noop}
      onConfirmUnit={noop}
    />,
  )

describe('ResourceCreationContextStage', () => {
  it('shows only the current stage selector, keeping downstream waiting-for-parent stages hidden and non-visible', () => {
    renderStage(buildView({ stage: 'class' }))

    expect(
      screen.getByRole('region', { name: 'Clase: selección por etapas' }),
    ).toBeVisible()
    for (const name of ['Familia', 'Tipo', 'Unidad'])
      expect(
        screen.getByRole('region', {
          name: `${name}: selección por etapas`,
          hidden: true,
        }),
      ).not.toBeVisible()

    const loadingTexts = screen.queryAllByText('Cargando opciones…')
    expect(loadingTexts.length).toBeGreaterThan(0)
    loadingTexts.forEach((node) => expect(node).not.toBeVisible())
  })

  it('wires onLoadMore to the current level and shows its confirmed key', () => {
    const familyLevel = level({
      items: [
        {
          id: 'family-1',
          code: 'CABLE',
          name: 'Cable',
          active: true,
          revision: '1',
          classCode: 'MAT',
        },
      ],
      hasNext: true,
    })
    renderStage(
      buildView({
        stage: 'family',
        families: familyLevel,
        selection: {
          classId: 'class-1',
          familyId: 'family-1',
          typeId: null,
          unitId: null,
        },
      }),
    )

    expect(
      screen.getByRole('option', { name: /Cable/, selected: true }),
    ).toBeInTheDocument()
    screen.getByRole('button', { name: 'Cargar más…' }).click()
    expect(familyLevel.onLoadMore).toHaveBeenCalledTimes(1)
  })
})

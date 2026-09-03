import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogHierarchyScreen } from '../../src/features/catalog-hierarchy/CatalogHierarchyScreen'

const presentation = {
  classes: [{ id: 'materials', label: 'Materiales' }],
  families: [{ id: 'channels', label: 'Canalizaciones' }],
  types: [{ id: 'pipe', label: 'Tubería' }],
  selectedClassId: 'materials',
  selectedFamilyId: 'channels',
  selectedTypeId: 'pipe',
}

describe('CatalogHierarchyScreen presentation', () => {
  it('renders a populated three-region workstation and summary from props', () => {
    const { container } = render(
      <CatalogHierarchyScreen presentation={presentation} />,
    )

    const header = container.querySelector('.catalog-hierarchy-header')
    const content = container.querySelector('.catalog-main')
    const footer = container.querySelector('.catalog-meaning')
    expect(header).toBeVisible()
    expect(content).toBeVisible()
    expect(footer).toBeVisible()
    expect(screen.getByRole('region', { name: 'Clases' })).toHaveTextContent(
      'Materiales',
    )
    expect(screen.getByRole('region', { name: 'Familias' })).toHaveTextContent(
      'Canalizaciones',
    )
    expect(screen.getByRole('region', { name: 'Tipos' })).toHaveTextContent(
      'Tubería',
    )
    expect(screen.getByRole('heading', { name: 'Tubería' })).toBeVisible()
    expect(footer).toHaveTextContent(
      'Las relaciones padre permanecen inmutables.',
    )
    expect(container.querySelectorAll('.catalog-row-chevron')).toHaveLength(2)

    expect(header!.compareDocumentPosition(content!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(content!.compareDocumentPosition(footer!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('renders an empty waiting state without presentation data', () => {
    render(<CatalogHierarchyScreen />)

    expect(screen.getByRole('region', { name: 'Clases' })).toHaveTextContent(
      'Sin selección.',
    )
    expect(screen.getByRole('region', { name: 'Familias' }))
      .toHaveTextContent('Seleccioná una Clase.')
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('region', { name: 'Tipos' }))
      .toHaveTextContent('Seleccioná una Familia.')
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('heading', { name: 'Sin selección' })).toBeVisible()
  })
})

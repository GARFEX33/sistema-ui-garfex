import { expect, test } from '@playwright/test'

test.describe('Compras blocked pending surface', () => {
  test('renders the informative pending surface without a cross-purchase result list', async ({
    page,
  }) => {
    await page.goto('/compras')

    await expect(page).toHaveURL(/\/compras$/)
    await expect(
      page.getByRole('heading', {
        name: 'Partidas pendientes entre compras',
        level: 2,
      }),
    ).toBeVisible()

    const surface = page.getByRole('status', {
      name: 'Partidas pendientes entre compras',
    })
    await expect(surface).toBeVisible()
    await expect(surface).toContainText(
      'no publica hoy un listado transversal de partidas por estado',
    )
    await expect(surface).toContainText(
      'abrí la compra correspondiente desde el historial de su proveedor',
    )
    await expect(surface.getByRole('table')).toHaveCount(0)
    await expect(surface.getByRole('button')).toHaveCount(0)
    await expect(surface.getByRole('link')).toHaveCount(0)
  })
})

import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function mockEmptySuppliers(page: import('@playwright/test').Page) {
  await page.route('**/v1/suppliers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        suppliers: [],
        hasPrevious: false,
        hasNext: false,
      }),
    })
  })
}

test.describe('Proveedores workstation 1440×980', () => {
  test('reaches the Proveedores master list from the sidebar', async ({
    page,
  }) => {
    await mockEmptySuppliers(page)
    await page.goto('/')
    await expect(page).toHaveURL(/\/bandeja$/)

    await page.getByRole('link', { name: 'Proveedores' }).click()
    await expect(page).toHaveURL(/\/proveedores$/)
    await expect(
      page.getByRole('heading', { name: 'Proveedores', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Proveedores' }),
    ).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('searchbox', { name: 'Buscar' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(
      page.getByText('No hay proveedores para este filtro.'),
    ).toBeVisible()
  })

  test('passes applicable axe checks without adding responsive variants', async ({
    page,
  }) => {
    await mockEmptySuppliers(page)
    await page.goto('/proveedores')
    await expect(
      page.getByText('No hay proveedores para este filtro.'),
    ).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})

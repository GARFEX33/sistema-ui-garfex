import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Recursos maestros workstation 1440×980', () => {
  test('traverses the resource list with sidebar and arrow keys', async ({
    page,
  }) => {
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    const summary = (id: string, nombre: string) => ({
      id,
      identificadorTecnico: `REC-${id}`,
      nombre,
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      activo: true,
      revision: 1,
      classificationStatus: { state: 'EFFECTIVE', reasons: [] },
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const { path } = route.request().postDataJSON() as { path: string }
      const value = path.endsWith(':listarRecursosResumen')
        ? {
            page: [summary('r1', 'Cable UTP'), summary('r2', 'Motor 1/2 HP')],
            isDone: true,
            continueCursor: '',
          }
        : { page: [], isDone: true, continueCursor: '' }
      await route.fulfill(response(value))
    })

    await page.goto('/recursos')
    const sidebarResources = page.getByRole('link', {
      name: 'Recursos maestros',
    })
    const search = page.getByPlaceholder('Nombre del recurso')
    const firstRow = page.locator('[data-resource-row]').first()
    const secondRow = page.locator('[data-resource-row]').nth(1)

    await expect(
      page.getByRole('heading', { name: 'Recursos maestros' }),
    ).toBeVisible()
    await expect(firstRow).toContainText('Cable UTP')
    await expect(secondRow).toContainText('Motor 1/2 HP')

    await sidebarResources.focus()
    await page.keyboard.press('ArrowRight')
    await expect(firstRow).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(secondRow).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(secondRow).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(firstRow).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(search).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(firstRow).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(sidebarResources).toBeFocused()
  })

  test('passes axe at the approved workstation viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 })
    await page.goto('/recursos')
    await expect(
      page.getByRole('heading', { name: 'Recursos maestros' }),
    ).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
})

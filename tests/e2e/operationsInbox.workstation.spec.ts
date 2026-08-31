import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Bandeja workstation 1440×980', () => {
  test('exposes the honest runtime shell and route', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/bandeja$/)
    await expect(page.getByRole('heading', { name: 'Bandeja' })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeVisible()
    await expect(page.getByRole('img', { name: 'GARFEX' })).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expect(page.locator('[aria-live]')).toHaveCount(0)
    await expect(
      page.getByText(/23|Administrador|Sincronizado|sin pendientes/i),
    ).toHaveCount(0)
  })

  test('keeps native tab order and restores focus around commands', async ({
    page,
  }) => {
    await page.goto('/bandeja')
    const trigger = page.getByRole('button', {
      name: /Buscar o ejecutar comando/,
    })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('dialog', { name: 'Entrada de comandos' }),
    ).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Comando' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.keyboard.press('ControlOrMeta+KeyK')
    await expect(page.getByRole('textbox', { name: 'Comando' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('passes applicable axe checks without adding responsive variants', async ({
    page,
  }) => {
    await page.goto('/bandeja')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
    expect(
      await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      })),
    ).toEqual({ width: 1440, height: 980 })
  })
})

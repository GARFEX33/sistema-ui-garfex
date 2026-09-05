import { expect, test } from '@playwright/test'

test.describe('Keyboard First workstation contract at 1440×980', () => {
  test('keeps real geometry, physical RTL movement, and the approved resting frame', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 980 })
    await page.goto('/catalogo')
    await expect(
      page.evaluate(() => [innerWidth, innerHeight]),
    ).resolves.toEqual([1440, 980])
    await expect(page.locator('.topbar-brand')).toHaveCSS(
      'color',
      'rgb(124, 0, 0)',
    )
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const geometry = async (selector: string) =>
      page.locator(selector).boundingBox()
    await expect(await geometry('.topbar')).toMatchObject({
      x: 0,
      y: 0,
      width: 1440,
      height: 56,
    })
    await expect(await geometry('.catalog-browser')).toMatchObject({
      x: 244,
      y: 180,
      width: 520,
      height: 550,
    })
    await expect(
      page.getByRole('button', { name: 'Nueva Clase' }),
    ).toHaveAttribute('data-spatial-id', 'catalog.new-class')
    const triggerBox = await page
      .getByRole('button', { name: 'Nueva Clase' })
      .boundingBox()
    expect(triggerBox?.width).toBeGreaterThan(0)
    expect(triggerBox?.height).toBeGreaterThan(0)

    const bandeja = page.getByRole('link', { name: 'Bandeja' })
    await bandeja.focus()
    await page.locator('.workspace-main').evaluate((element) => {
      element.setAttribute('dir', 'rtl')
    })
    const originBox = await bandeja.boundingBox()
    expect(originBox?.x).toBeLessThan(triggerBox?.x ?? 0)
    await page.keyboard.press('ArrowRight')
    await expect(
      page.getByRole('button', { name: 'Nueva Clase' }),
    ).toBeFocused()
    await expect(page.getByRole('button', { name: 'Nueva Clase' })).toHaveCSS(
      'outline-width',
      '3px',
    )

    await page.evaluate(() => window.scrollTo(0, 32))
    await bandeja.focus()
    await page.keyboard.press('ArrowRight')
    await expect(
      page.getByRole('button', { name: 'Nueva Clase' }),
    ).toBeFocused()
    expect(await page.locator('[data-spatial-id]').count()).toBeGreaterThan(3)
    await expect(page.locator('[data-spatial-id][hidden]')).toHaveCount(0)
    await expect(
      page.locator('[data-spatial-id][aria-disabled="true"]'),
    ).toHaveCount(0)
    await expect(
      page.locator('[data-spatial-id]').evaluateAll((elements) =>
        elements.every((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        }),
      ),
    ).resolves.toBe(true)
  })

  test('preserves native tabs and isolates a portaled modal', async ({
    page,
  }) => {
    await page.goto('/catalogo')
    const trigger = page.getByRole('button', { name: 'Nueva Clase' })
    await trigger.focus()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Nueva Clase' }),
    ).not.toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(trigger).toBeFocused()

    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Nueva Clase' })
    const key = page.getByRole('textbox', { name: 'Clave' })
    const name = page.getByRole('textbox', { name: 'Nombre' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('data-approved-frame', 'n2418')
    await expect(
      page.getByRole('button', { name: 'Crear Clase' }),
    ).toBeDisabled()
    await expect(
      page.getByRole('button', { name: 'Crear Clase' }),
    ).not.toHaveAttribute('data-spatial-id')
    await expect(key).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(name).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('?')
    await expect(name).toBeFocused()
    await expect(
      page.getByRole('dialog', { name: 'Ayuda de teclado' }),
    ).toHaveCount(0)
    await page.evaluate(() => {
      const field = document.querySelector<HTMLInputElement>('#new-class-name')
      if (!field) return
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'n',
      })
      Object.defineProperties(event, {
        isComposing: { value: true },
        keyCode: { value: 229 },
      })
      field.dispatchEvent(event)
    })
    await expect(name).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('textbox', { name: 'Descripción' }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(name).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('does not expose N on Bandeja', async ({ page }) => {
    await page.goto('/bandeja')
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('uses semantic help and N only for the real Catalog action', async ({
    page,
  }) => {
    await page.goto('/catalogo')
    await page.evaluate(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: '?',
          shiftKey: true,
        }),
      )
    })
    const help = page.getByRole('dialog', { name: 'Ayuda de teclado' })
    await expect(help).toBeVisible()
    await expect(help).toContainText('N — Nueva Clase')
    await expect(help).toContainText('Tab / Shift+Tab')
    await page.keyboard.press('Escape')

    const trigger = page.getByRole('button', { name: 'Nueva Clase' })
    await trigger.click()
    const field = page.getByRole('textbox', { name: 'Nombre' })
    await field.fill('N')
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog', { name: 'Nueva Clase' })).toHaveCount(
      1,
    )
    await page.keyboard.press('Escape')
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        key: '?',
        ctrlKey: true,
        altKey: true,
      })
      Object.defineProperty(event, 'getModifierState', {
        value: (modifier: string) => modifier === 'AltGraph',
      })
      document.dispatchEvent(event)
    })
    await expect(
      page.getByRole('dialog', { name: 'Ayuda de teclado' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await page.evaluate(() => {
      window.addEventListener(
        'keydown',
        (event) => {
          if (event.key.toLowerCase() === 'n' && event.ctrlKey) {
            ;(
              window as Window & { __ctrlNPrevented?: boolean }
            ).__ctrlNPrevented = event.defaultPrevented
          }
        },
        { once: true },
      )
    })
    await page.keyboard.press('Control+n')
    await expect(
      page.evaluate(
        () =>
          (window as Window & { __ctrlNPrevented?: boolean })
            .__ctrlNPrevented ?? false,
      ),
    ).resolves.toBe(false)
  })

  test('falls back to Catálogo when the Nueva Clase opener disappears', async ({
    page,
  }) => {
    await page.goto('/catalogo')
    const trigger = page.getByRole('button', { name: 'Nueva Clase' })
    await trigger.click()
    await page.evaluate(() => {
      document
        .querySelector<HTMLElement>('button[aria-label="Nueva Clase"]')
        ?.remove()
    })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Catálogo' })).toBeFocused()
  })
})

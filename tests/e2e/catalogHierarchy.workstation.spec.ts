import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Catálogo workstation 1440×980', () => {
  test('matches the approved workstation composition without runtime fixtures', async ({
    page,
  }) => {
    const authorityRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('127.0.0.1:3210'))
        authorityRequests.push(request.url())
    })
    await page.setViewportSize({ width: 1440, height: 980 })
    await page.goto('/catalogo')
    const geometry = async (selector: string) =>
      page.locator(selector).boundingBox()
    await expect(await geometry('.topbar')).toMatchObject({
      x: 0,
      y: 0,
      width: 1440,
      height: 56,
    })
    await expect(await geometry('.app-rail')).toMatchObject({
      x: 0,
      y: 0,
      width: 220,
    })
    await expect(await geometry('.catalog-model-bar')).toMatchObject({
      x: 232,
      y: 116,
      width: 1196,
      height: 52,
    })
    await expect(await geometry('.catalog-browser')).toMatchObject({
      x: 244,
      y: 180,
      width: 520,
      height: 550,
    })
    await expect(await geometry('.catalog-summary')).toMatchObject({
      x: 786,
      y: 180,
      width: 630,
      height: 550,
    })
    await expect(await geometry('.catalog-meaning')).toMatchObject({
      x: 244,
      y: 748,
      width: 1172,
      height: 132,
    })
    await expect(page.getByText('Configuración / Catálogo')).toBeVisible()
    const classesRegion = page.getByRole('region', { name: 'Clases' })
    const classRows = classesRegion.locator('.catalog-item')
    const classEmpty = classesRegion.getByText('Estado vacío confirmado')
    const classRetry = classesRegion.getByRole('button', {
      name: 'Reintentar',
      exact: true,
    })
    await expect
      .poll(
        async () =>
          (await classRows.count()) +
          (await classEmpty.count()) +
          (await classRetry.count()),
      )
      .toBeGreaterThan(0)
    await expect(classRetry).toHaveCount(0)
    const classRowCount = await classRows.count()
    const classEmptyCount = await classEmpty.count()
    expect(classRowCount > 0 || classEmptyCount > 0).toBe(true)
    if (classRowCount > 0) {
      expect(
        (await classRows.allTextContents()).every((label) => label.trim()),
      ).toBe(true)
    }
    await expect(page.getByText('En espera de Clase.')).toBeVisible()
    await expect(page.getByText('En espera de Familia.')).toBeVisible()
    await expect.poll(() => authorityRequests.length).toBeGreaterThan(0)
    expect(
      authorityRequests.every((url) => url.includes('127.0.0.1:3210')),
    ).toBe(true)
    await expect(page.locator('[data-index], [aria-posinset]')).toHaveCount(0)
    await expect(page).toHaveURL(/\/catalogo$/)
    await expect(page).toHaveURL(/\/catalogo$/)
    await expect(
      page.getByRole('heading', { name: 'Catálogo', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link')).toHaveCount(2)
    await expect(page.getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(
      page.getByRole('link', { name: 'Bandeja' }),
    ).not.toHaveAttribute('aria-current', 'page')
    for (const name of ['Clases', 'Familias', 'Tipos']) {
      await expect(page.getByRole('region', { name })).toBeVisible()
    }
    await expect(page.getByRole('link')).toHaveCount(2)

    const trigger = page.getByRole('button', { name: 'Nueva Clase' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Nueva Clase' })
    await expect(dialog).toBeVisible()
    const dialogBox = await dialog.boundingBox()
    const cancelBox = await page
      .getByRole('button', { name: 'Cancelar' })
      .boundingBox()
    const createBox = await page
      .getByRole('button', { name: 'Crear Clase' })
      .boundingBox()
    await expect(dialogBox).toMatchObject({
      x: 420,
      y: 140,
      width: 630,
      height: 440,
    })
    if (!dialogBox || !cancelBox || !createBox)
      throw new Error('Dialog and action geometry must be measurable')
    for (const actionBox of [cancelBox, createBox]) {
      expect(actionBox.x).toBeGreaterThan(dialogBox.x)
      expect(actionBox.y).toBeGreaterThan(dialogBox.y)
      expect(actionBox.x + actionBox.width).toBeLessThan(
        dialogBox.x + dialogBox.width,
      )
      expect(actionBox.y + actionBox.height).toBeLessThan(
        dialogBox.y + dialogBox.height,
      )
    }
    expect(Math.abs(cancelBox.y - createBox.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(cancelBox.height - createBox.height)).toBeLessThanOrEqual(1)
    await expect(dialog).toHaveAttribute('data-approved-frame', 'n2418')
    for (const name of ['Clave', 'Nombre', 'Descripción']) {
      await expect(page.getByRole('textbox', { name })).toBeVisible()
    }
    const keyField = page.getByRole('textbox', { name: 'Clave' })
    const nameField = page.getByRole('textbox', { name: 'Nombre' })
    await expect(keyField).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(nameField).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(keyField).toBeFocused()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(keyField).toHaveCSS('transition-duration', '0s')
    await expect(
      page.getByRole('button', { name: 'Crear Clase' }),
    ).toBeDisabled()
    await keyField.fill('CL')
    await nameField.fill('Materiales')
    await expect(nameField).toHaveValue('Materiales')
    await expect(
      page.getByRole('button', { name: 'Crear Clase' }),
    ).toBeEnabled()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('exercises contextual Family and Type creation through local interception', async ({
    page,
  }) => {
    const calls: Array<{ path: string; args: Record<string, unknown> }> = []
    let familyListCalls = 0
    let releaseMutation!: () => void
    let releaseRefetch!: () => void
    const mutationGate = new Promise<void>((resolve) => {
      releaseMutation = resolve
    })
    const refetchGate = new Promise<void>((resolve) => {
      releaseRefetch = resolve
    })
    const baseItem = (id: string, nombre: string) => ({
      activo: false,
      clave: id,
      effective: false,
      effectiveReasons: ['INACTIVE'],
      id,
      nombre,
      revision: 1,
    })
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const body = route.request().postDataJSON() as {
        path: string
        args?: [Record<string, unknown>]
      }
      const args = body.args?.[0] ?? {}
      if (body.path.endsWith(':crearFamilia')) {
        calls.push({ path: body.path, args })
        await mutationGate
        await route.fulfill(
          response({
            disposition: 'CREATED',
            item: {
              ...baseItem('family-1', 'Canalizaciones'),
              claseRecursoId: 'class-1',
            },
          }),
        )
        return
      }
      if (body.path.endsWith(':crearTipo')) {
        calls.push({ path: body.path, args })
        await route.fulfill(
          response({ status: 'error', errorMessage: 'secret server text' }),
        )
        return
      }
      const value = body.path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [baseItem('class-1', 'Materiales')],
          }
        : body.path.endsWith(':listarFamilias')
          ? {
              continuationCursor: null,
              isExhausted: true,
              items: [
                {
                  ...baseItem('family-1', 'Canalizaciones'),
                  claseRecursoId: 'class-1',
                },
              ],
            }
          : {
              continuationCursor: null,
              isExhausted: true,
              items: [
                {
                  ...baseItem('type-1', 'Tubería'),
                  aggregateStatus: 'NOT_EVALUATED',
                  familiaRecursoId: 'family-1',
                  violations: [],
                },
              ],
            }
      if (body.path.endsWith(':listarFamilias')) {
        familyListCalls += 1
        if (familyListCalls > 1) await refetchGate
      }
      await route.fulfill(response(value))
    })
    await page.goto('/catalogo')
    await page.getByRole('button', { name: 'Materiales' }).click()
    const familyTrigger = page.getByRole('button', { name: 'Nueva Familia' })
    await familyTrigger.click()
    const familyDialog = page.getByRole('dialog', { name: 'Nueva Familia' })
    await expect(familyDialog).toBeVisible()
    await expect(page.getByTestId('creation-parent')).toHaveAttribute(
      'data-parent-id',
      'class-1',
    )
    expect(
      await familyDialog.getByRole('textbox', { name: 'Clase' }).count(),
    ).toBe(0)
    await familyDialog.getByRole('textbox', { name: 'Clave' }).fill(' FA ')
    await familyDialog
      .getByRole('textbox', { name: 'Nombre' })
      .fill(' Familia ')
    const familySubmit = familyDialog.getByRole('button', {
      name: 'Crear Familia',
    })
    await familySubmit.click()
    await expect
      .poll(
        () =>
          calls.filter((call) => call.path.endsWith(':crearFamilia')).length,
      )
      .toBe(1)
    expect(calls[0]).toEqual({
      path: 'catalogoAdmin/jerarquia:crearFamilia',
      args: { claseRecursoId: 'class-1', clave: ' FA ', nombre: ' Familia ' },
    })
    await expect(familyDialog).toBeVisible()
    releaseMutation()
    await expect(familyDialog).toBeVisible()
    releaseRefetch()
    await expect(familyDialog).not.toBeVisible()
    await expect(familyTrigger).toBeFocused()
    await expect(page.getByRole('status')).toHaveText(
      'Familia “ Familia ” creada.',
    )
    await page.getByRole('button', { name: 'Canalizaciones' }).click()
    const typeTrigger = page.getByRole('button', { name: 'Nuevo Tipo' })
    await typeTrigger.click()
    const typeDialog = page.getByRole('dialog', { name: 'Nuevo Tipo' })
    await expect(typeDialog).toBeVisible()
    await expect(page.getByTestId('creation-parent')).toHaveAttribute(
      'data-parent-id',
      'family-1',
    )
    expect(
      await typeDialog.getByRole('textbox', { name: 'Familia' }).count(),
    ).toBe(0)
    const typeKey = typeDialog.getByRole('textbox', { name: 'Clave' })
    const typeName = typeDialog.getByRole('textbox', { name: 'Nombre' })
    const typeDescription = typeDialog.getByRole('textbox', {
      name: 'Descripción',
    })
    await typeKey.fill(' TY ')
    await typeName.fill(' Tipo ')
    await typeKey.focus()
    await typeKey.dispatchEvent('keydown', {
      key: 'ArrowDown',
      isComposing: true,
    })
    await expect(typeKey).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(typeName).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(typeKey).toBeFocused()
    await typeDescription.focus()
    await page.keyboard.press('ArrowDown')
    await expect(
      typeDialog.getByRole('button', { name: 'Cancelar' }),
    ).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(typeDescription).toBeFocused()
    await typeDialog.getByRole('button', { name: 'Crear Tipo' }).click()
    await expect(typeDialog.getByRole('alert')).toContainText(
      'No se pudo crear el Tipo.',
    )
    await expect(typeDialog.getByRole('alert')).not.toHaveText(
      'secret server text',
    )
    await expect(typeKey).toHaveValue(' TY ')
    expect(
      calls.filter((call) => call.path.endsWith(':crearTipo')),
    ).toHaveLength(1)
    await typeDialog.getByRole('button', { name: 'Cancelar' }).focus()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(typeTrigger).toBeFocused()
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog', { name: 'Nuevo Tipo' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+n')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.keyboard.press('Control+k')
    await expect(
      page.getByRole('dialog', { name: 'Entrada de comandos' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await page.keyboard.press('?')
    await expect(
      page.getByRole('dialog', { name: 'Ayuda de teclado' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('opens the active contextual create command from the palette', async ({
    page,
  }) => {
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const { path } = route.request().postDataJSON() as { path: string }
      const value = path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [
              {
                activo: true,
                clave: 'class-1',
                effective: true,
                effectiveReasons: [],
                id: 'class-1',
                nombre: 'Materiales',
                revision: 1,
              },
            ],
          }
        : { continuationCursor: null, isExhausted: true, items: [] }
      await route.fulfill(response(value))
    })

    await page.goto('/catalogo')
    const classRow = page.getByRole('button', { name: 'Materiales' })
    await expect(classRow).toBeVisible()
    await classRow.click()
    await expect(
      page.getByRole('button', { name: 'Nueva Familia' }),
    ).toBeVisible()

    await page.keyboard.press('Control+k')
    const palette = page.getByRole('dialog', { name: 'Entrada de comandos' })
    await expect(palette).toBeVisible()
    await palette.getByRole('button', { name: 'Nueva Familia' }).click()

    await expect(palette).toHaveCount(0)
    const familyDialog = page.getByRole('dialog', { name: 'Nueva Familia' })
    await expect(familyDialog).toBeVisible()
    await expect(page.getByTestId('creation-parent')).toHaveAttribute(
      'data-parent-id',
      'class-1',
    )
    await expect(
      familyDialog.getByRole('textbox', { name: 'Clave' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
  })

  test('traverses the live hierarchy with sidebar and arrow keys', async ({
    page,
  }) => {
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    const item = (id: string, nombre: string) => ({
      activo: true,
      clave: id,
      effective: true,
      effectiveReasons: [],
      id,
      nombre,
      revision: 1,
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const { path } = route.request().postDataJSON() as { path: string }
      const value = path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [item('class-1', 'Materiales'), item('class-2', 'Equipos')],
          }
        : path.endsWith(':listarFamilias')
          ? {
              continuationCursor: null,
              isExhausted: true,
              items: [
                {
                  ...item('family-1', 'Canalizaciones'),
                  claseRecursoId: 'class-1',
                },
              ],
            }
          : {
              continuationCursor: null,
              isExhausted: true,
              items: [
                {
                  ...item('type-1', 'Tuberías'),
                  aggregateStatus: 'NOT_EVALUATED',
                  familiaRecursoId: 'family-1',
                  violations: [],
                },
              ],
            }
      await route.fulfill(response(value))
    })

    await page.goto('/catalogo')
    const sidebarCatalog = page.getByRole('link', { name: 'Catálogo' })
    const firstClass = page.getByRole('button', { name: 'Materiales' })
    const secondClass = page.getByRole('button', { name: 'Equipos' })
    await expect(firstClass).toBeVisible()
    await sidebarCatalog.focus()
    await page.keyboard.press('ArrowRight')
    await expect(firstClass).toBeFocused()
    await expect(firstClass).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', { name: 'Nueva Familia' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nueva Clase' })).toHaveCount(
      0,
    )

    await page.keyboard.press('ArrowUp')
    await expect(firstClass).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(secondClass).toBeFocused()
    await expect(secondClass).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('ArrowDown')
    await expect(secondClass).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(firstClass).toBeFocused()
    await expect(firstClass).toHaveAttribute('aria-pressed', 'true')

    const firstFamily = page.getByRole('button', { name: 'Canalizaciones' })
    const firstType = page.getByRole('button', { name: 'Tuberías' })
    await expect(firstFamily).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(firstFamily).toBeFocused()
    await expect(firstFamily).toHaveAttribute('aria-pressed', 'true')
    await expect(firstType).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(firstType).toBeFocused()
    await expect(firstType).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(firstType).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(firstFamily).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(firstClass).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(sidebarCatalog).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(firstClass).toBeFocused()
    await page.keyboard.press('n')
    await expect(
      page.getByRole('dialog', { name: 'Nueva Familia' }),
    ).toBeVisible()
  })

  test('keeps ArrowRight on a selected class when its child list is empty', async ({
    page,
  }) => {
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const { path } = route.request().postDataJSON() as { path: string }
      const value = path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [
              {
                activo: true,
                clave: 'class-1',
                effective: true,
                effectiveReasons: [],
                id: 'class-1',
                nombre: 'Materiales',
                revision: 1,
              },
            ],
          }
        : { continuationCursor: null, isExhausted: true, items: [] }
      await route.fulfill(response(value))
    })

    await page.goto('/catalogo')
    const sidebarCatalog = page.getByRole('link', { name: 'Catálogo' })
    const firstClass = page.getByRole('button', { name: 'Materiales' })
    await expect(firstClass).toBeVisible()
    await sidebarCatalog.focus()
    await page.keyboard.press('ArrowRight')
    await expect(firstClass).toBeFocused()
    await expect(page.getByText('Estado vacío confirmado')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(firstClass).toBeFocused()
    await expect(firstClass).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', { name: 'Nueva Familia' }),
    ).toBeVisible()
  })

  test('passes axe at the approved workstation viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 })
    await page.goto('/catalogo')
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    expect(await page.evaluate(() => [innerWidth, innerHeight])).toEqual([
      1440, 980,
    ])
  })
})

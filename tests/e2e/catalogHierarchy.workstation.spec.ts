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
    const catalogHeader = page.locator('.catalog-hierarchy-screen > header')
    const model = page.getByLabel('Modelo del catálogo')
    await expect(await catalogHeader.boundingBox()).toMatchObject({
      x: 244,
      y: 76,
      width: 1172,
      height: 66,
    })
    await expect(model).toContainText('MODELO DEL CATÁLOGO')
    await expect(model).toContainText('Clase → Familia → Tipo')
    const headerBox = await catalogHeader.boundingBox()
    const modelBox = await model.boundingBox()
    if (!headerBox || !modelBox)
      throw new Error('Catalog header and model context must be measurable')
    expect(modelBox.x).toBeGreaterThan(headerBox.x)
    expect(modelBox.x + modelBox.width).toBeLessThan(
      headerBox.x + headerBox.width,
    )
    expect(modelBox.y).toBeGreaterThanOrEqual(headerBox.y)
    expect(modelBox.y + modelBox.height).toBeLessThanOrEqual(
      headerBox.y + headerBox.height,
    )
    await expect(await geometry('.catalog-browser')).toMatchObject({
      x: 244,
      y: 154,
      width: 520,
      height: 550,
    })
    await expect(await geometry('.catalog-summary')).toMatchObject({
      x: 786,
      y: 154,
      width: 630,
      height: 550,
    })
    await expect(await geometry('.catalog-meaning')).toMatchObject({
      x: 244,
      y: 722,
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
    await expect(page.getByRole('link')).toHaveCount(3)
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
    await expect(page.getByRole('link')).toHaveCount(3)

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
    let releaseAttributeList!: () => void
    const attributeListGate = new Promise<void>((resolve) => {
      releaseAttributeList = resolve
    })
    await page.route('http://127.0.0.1:3210/**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ status: 204 })
        return
      }
      const { path } = route.request().postDataJSON() as { path: string }
      if (path.endsWith(':listarAsignacionesAtributo')) await attributeListGate
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
          : path.endsWith(':listarAsignacionesAtributo')
            ? {
                continuationCursor: null,
                isExhausted: true,
                items: [
                  {
                    id: 'assignment-1',
                    definicionAtributoId: 'definition-1',
                    tipoRecursoId: 'type-1',
                    activo: true,
                    effective: true,
                    effectiveReasons: [],
                    selection: 'SELECTED',
                    aplicabilidad: 'REQUIRED',
                    participaIdentidad: false,
                    orden: 1,
                    revision: 1,
                    familiaRecursoId: 'family-1',
                  },
                ],
              }
            : path.endsWith(':obtenerDefinicionAtributo')
              ? {
                  id: 'definition-1',
                  nombre: 'Presión nominal',
                  clave: 'PRESION',
                  tipoDato: 'NUMERO',
                  activo: true,
                  effective: true,
                  effectiveReasons: [],
                  revision: 1,
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
    const summaryTab = page.getByRole('tab', { name: 'Resumen' })
    const attributesTab = page.getByRole('tab', { name: 'Atributos' })
    const firstAttribute = page.locator(
      '[data-spatial-id="catalog.row.attributes.assignment-1"]',
    )
    await page.keyboard.press('ArrowRight')
    await expect(summaryTab).toBeFocused()
    await expect(summaryTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Cargando resumen de atributos…')).toBeVisible()
    await attributesTab.click()
    await expect(attributesTab).toBeFocused()
    await expect(attributesTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Cargando atributos…')).toBeVisible()
    releaseAttributeList()
    await expect(firstAttribute).toHaveAttribute(
      'data-catalog-level',
      'attributes',
    )
    await expect(firstAttribute).toHaveAttribute('tabindex', '0')
    await expect(attributesTab).toHaveAttribute('tabindex', '0')
    await expect(summaryTab).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('ArrowRight')
    await expect(attributesTab).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(firstAttribute).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(attributesTab).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(summaryTab).toBeFocused()
    await expect(summaryTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('table')).toContainText('Presión nominal')
    await expect(summaryTab).toHaveAttribute('tabindex', '0')
    await expect(attributesTab).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('ArrowLeft')
    await expect(firstType).toBeFocused()
    await expect(firstType).toHaveAttribute('aria-pressed', 'true')
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

  test('covers contextual attribute assignment, definition creation, and safe retry', async ({
    page,
  }) => {
    const calls: Array<{ path: string; args: Record<string, unknown> }> = []
    let assignmentListCalls = 0
    let newAssignmentAttempts = 0
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
    const definition = (
      id: string,
      nombre: string,
      clave: string,
      tipoDato = 'TEXTO',
    ) => ({
      activo: false,
      clave,
      effective: false,
      effectiveReasons: ['INACTIVE'],
      id,
      nombre,
      revision: 1,
      tipoDato,
    })
    const assignment = (id: string, definitionId: string, orden: number) => ({
      activo: false,
      aplicabilidad: 'OPTIONAL',
      definicionAtributoId: definitionId,
      effective: false,
      effectiveReasons: ['INACTIVE'],
      familiaRecursoId: 'family-1',
      id,
      orden,
      participaIdentidad: false,
      revision: 1,
      selection: 'SELECTED',
      tipoRecursoId: 'type-1',
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
      if (body.path.endsWith(':crearDefinicionAtributo')) {
        calls.push({ path: body.path, args })
        await route.fulfill(
          response({
            disposition: 'CREATED',
            item: definition(
              'definition-new',
              'Peso nominal',
              'PESO',
              'NUMERO',
            ),
          }),
        )
        return
      }
      if (body.path.endsWith(':crearAsignacionAtributo')) {
        calls.push({ path: body.path, args })
        const isNew = args.definicionAtributoId === 'definition-new'
        if (isNew) newAssignmentAttempts += 1
        await route.fulfill(
          response(
            isNew && newAssignmentAttempts === 1
              ? { status: 'error', errorMessage: 'assignment unavailable' }
              : {
                  disposition: 'CREATED',
                  item: assignment(
                    isNew ? 'assignment-new' : 'assignment-existing',
                    args.definicionAtributoId as string,
                    isNew ? 6 : 5,
                  ),
                },
          ),
        )
        return
      }
      if (body.path.endsWith(':listarAsignacionesAtributo'))
        assignmentListCalls += 1
      const value = body.path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [item('class-1', 'Materiales')],
          }
        : body.path.endsWith(':listarFamilias')
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
          : body.path.endsWith(':listarTipos')
            ? {
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
            : body.path.endsWith(':listarDefinicionesAtributo')
              ? {
                  continuationCursor: null,
                  isExhausted: true,
                  items: [definition('definition-existing', 'Peso', 'PESO')],
                }
              : body.path.endsWith(':listarAsignacionesAtributo')
                ? {
                    continuationCursor: null,
                    isExhausted: true,
                    items:
                      assignmentListCalls === 1
                        ? [
                            assignment(
                              'assignment-prior',
                              'definition-prior',
                              4,
                            ),
                          ]
                        : assignmentListCalls === 2
                          ? [
                              assignment(
                                'assignment-existing',
                                'definition-existing',
                                5,
                              ),
                            ]
                          : [assignment('assignment-new', 'definition-new', 6)],
                  }
                : body.path.endsWith(':obtenerDefinicionAtributo')
                  ? args.definicionAtributoId === 'definition-new'
                    ? definition(
                        'definition-new',
                        'Peso nominal',
                        'PESO',
                        'NUMERO',
                      )
                    : definition(
                        args.definicionAtributoId as string,
                        'Peso',
                        'PESO',
                      )
                  : null
      await route.fulfill(response(value))
    })

    await page.goto('/catalogo')
    await page.getByRole('button', { name: 'Materiales' }).click()
    await page.getByRole('button', { name: 'Canalizaciones' }).click()
    await page.getByRole('button', { name: 'Tuberías' }).click()
    await page.getByRole('tab', { name: 'Resumen' }).click()
    await page.getByRole('tab', { name: 'Atributos' }).click()
    const trigger = page.getByRole('button', { name: 'Asignar atributo' })
    await expect(trigger).toBeVisible()
    await page.keyboard.press('n')

    const dialog = page.getByRole('dialog', { name: 'Asignar atributo' })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('searchbox', { name: 'Buscar atributo' }),
    ).toBeFocused()
    await expect(
      dialog.getByText('Canalizaciones', { exact: true }),
    ).toBeVisible()
    await expect(dialog.getByText('Tuberías', { exact: true })).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Familia' })).toHaveCount(
      0,
    )
    await expect(dialog.getByRole('textbox', { name: 'Tipo' })).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'Nuevo Tipo' })).toHaveCount(
      0,
    )
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Atributos' })).toBeFocused()

    await trigger.click()
    await dialog.getByRole('button', { name: /Peso/ }).click()
    await dialog.getByRole('button', { name: 'Guardar asignación' }).click()
    await expect.poll(() => calls.length).toBe(1)
    expect(calls[0]).toEqual({
      path: 'catalogoAdmin/atributos:crearAsignacionAtributo',
      args: {
        activo: false,
        aplicabilidad: 'OPTIONAL',
        definicionAtributoId: 'definition-existing',
        familiaRecursoId: 'family-1',
        orden: 5,
        participaIdentidad: false,
        tipoRecursoId: 'type-1',
      },
    })
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => assignmentListCalls).toBe(2)
    await expect(page.getByRole('status')).toHaveText(
      'Atributo “Peso” asignado.',
    )

    await trigger.click()
    await dialog.getByRole('button', { name: 'Crear atributo nuevo' }).click()
    await dialog.getByRole('textbox', { name: 'Clave' }).fill(' PESO ')
    await dialog.getByRole('textbox', { name: 'Nombre' }).fill(' Peso nominal ')
    await dialog.getByRole('button', { name: 'Cambiar tipo' }).click()
    await dialog
      .getByRole('combobox', { name: 'Tipo de dato' })
      .selectOption('NUMERO')
    await dialog.getByRole('button', { name: 'Continuar' }).click()
    await expect(dialog.getByText('2 Asignación')).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(dialog.getByText('Resumen de definición')).toBeVisible()
    expect(calls).toHaveLength(1)
    await dialog.getByRole('button', { name: 'Crear y asignar' }).click()
    await expect.poll(() => calls.length).toBe(3)
    expect(calls.slice(1)).toEqual([
      {
        path: 'catalogoAdmin/atributos:crearDefinicionAtributo',
        args: {
          activo: false,
          clave: 'PESO',
          nombre: 'Peso nominal',
          tipoDato: 'NUMERO',
        },
      },
      {
        path: 'catalogoAdmin/atributos:crearAsignacionAtributo',
        args: {
          activo: false,
          aplicabilidad: 'OPTIONAL',
          definicionAtributoId: 'definition-new',
          familiaRecursoId: 'family-1',
          orden: 6,
          participaIdentidad: false,
          tipoRecursoId: 'type-1',
        },
      },
    ])
    await expect(dialog.getByRole('alert')).toContainText(
      'La definición fue creada, pero no se asignó al Tipo.',
    )
    await dialog.getByRole('button', { name: 'Reintentar asignación' }).click()
    await expect.poll(() => calls.length).toBe(4)
    expect(calls[3]).toEqual({
      path: 'catalogoAdmin/atributos:crearAsignacionAtributo',
      args: {
        activo: false,
        aplicabilidad: 'OPTIONAL',
        definicionAtributoId: 'definition-new',
        familiaRecursoId: 'family-1',
        orden: 6,
        participaIdentidad: false,
        tipoRecursoId: 'type-1',
      },
    })
    expect(
      calls.filter((call) => call.path.endsWith(':crearDefinicionAtributo')),
    ).toHaveLength(1)
    expect(
      calls.filter((call) => call.path.endsWith(':crearAsignacionAtributo')),
    ).toHaveLength(3)
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => assignmentListCalls).toBe(3)
    await expect(page.getByRole('status')).toHaveText(
      'Atributo “Peso nominal” creado y asignado.',
    )
  })

  test('manages an OPCION attribute administrative options', async ({
    page,
  }) => {
    const calls: Array<{ path: string; args: Record<string, unknown> }> = []
    let deactivationAttempts = 0
    const options: Array<Record<string, unknown>> = []
    const response = (value: unknown) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'success', value }),
    })
    const error = (code: string) => ({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        errorData: { code },
        errorMessage: 'secret dependency detail',
        status: 'error',
      }),
    })
    const item = (id: string, nombre: string) => ({
      activo: false,
      clave: id,
      effective: false,
      effectiveReasons: ['INACTIVE'],
      id,
      nombre,
      revision: 1,
    })
    const color = () => ({
      activo: false,
      clave: 'ACR',
      effective: false,
      effectiveReasons: ['INACTIVE'],
      id: 'definition-color',
      nombre: 'Color',
      revision: 1,
      tipoDato: 'OPCION',
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
      if (body.path.endsWith(':listarOpcionesAtributo')) {
        await route.fulfill(
          response({
            continuationCursor: null,
            isExhausted: true,
            items: options,
          }),
        )
        return
      }
      if (body.path.endsWith(':crearOpcionAtributo')) {
        calls.push({ path: body.path, args })
        const created = {
          activo: args.activo,
          clave: args.clave,
          definicionAtributoId: 'definition-color',
          effective: args.activo,
          effectiveReasons: args.activo ? [] : ['INACTIVE'],
          id: `option-${options.length + 1}`,
          nombre: args.nombre,
          revision: 1,
          ...(args.descripcion ? { descripcion: args.descripcion } : {}),
        }
        options.push(created)
        await route.fulfill(response({ disposition: 'CREATED', item: created }))
        return
      }
      if (body.path.endsWith(':actualizarOpcionAtributo')) {
        calls.push({ path: body.path, args })
        const index = options.findIndex(
          (option) => option.id === args.opcionAtributoId,
        )
        const updated = {
          ...options[index],
          descripcion: args.descripcion,
          nombre: args.nombre,
          revision: 2,
        }
        options[index] = updated
        await route.fulfill(response({ disposition: 'UPDATED', item: updated }))
        return
      }
      if (body.path.endsWith(':activarOpcionAtributo')) {
        calls.push({ path: body.path, args })
        const index = options.findIndex(
          (option) => option.id === args.opcionAtributoId,
        )
        const activated = {
          ...options[index],
          activo: true,
          effective: true,
          effectiveReasons: [],
          revision: 3,
        }
        options[index] = activated
        await route.fulfill(
          response({ disposition: 'UPDATED', item: activated }),
        )
        return
      }
      if (body.path.endsWith(':desactivarOpcionAtributo')) {
        calls.push({ path: body.path, args })
        deactivationAttempts += 1
        if (deactivationAttempts === 1) {
          await route.fulfill(error('ADMIN_DEPENDENCY_BLOCKED'))
          return
        }
        const index = options.findIndex(
          (option) => option.id === args.opcionAtributoId,
        )
        const deactivated = {
          ...options[index],
          activo: false,
          effective: false,
          effectiveReasons: ['INACTIVE'],
          revision: 2,
        }
        options[index] = deactivated
        await route.fulfill(
          response({ disposition: 'UPDATED', item: deactivated }),
        )
        return
      }
      const value = body.path.endsWith(':listarClases')
        ? {
            continuationCursor: null,
            isExhausted: true,
            items: [item('class-1', 'Materiales')],
          }
        : body.path.endsWith(':listarFamilias')
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
          : body.path.endsWith(':listarTipos')
            ? {
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
            : body.path.endsWith(':listarAsignacionesAtributo')
              ? {
                  continuationCursor: null,
                  isExhausted: true,
                  items: [
                    {
                      activo: false,
                      aplicabilidad: 'OPTIONAL',
                      definicionAtributoId: 'definition-color',
                      effective: false,
                      effectiveReasons: ['INACTIVE'],
                      familiaRecursoId: 'family-1',
                      id: 'assignment-color',
                      orden: 1,
                      participaIdentidad: false,
                      revision: 1,
                      selection: 'SELECTED',
                      tipoRecursoId: 'type-1',
                    },
                  ],
                }
              : body.path.endsWith(':obtenerDefinicionAtributo')
                ? color()
                : null
      await route.fulfill(response(value))
    })

    await page.goto('/catalogo')
    await page.getByRole('button', { name: 'Materiales' }).click()
    await page.getByRole('button', { name: 'Canalizaciones' }).click()
    await page.getByRole('button', { name: 'Tuberías' }).click()
    await page.getByRole('tab', { name: 'Atributos' }).click()
    await expect(page.getByRole('button', { name: 'Opciones' })).toHaveCount(0)
    await expect(page.getByText('ACR · Opción')).toBeVisible()
    await page.getByRole('button', { name: 'Mostrar detalle de Color' }).click()
    const optionsTrigger = page.getByRole('button', { name: 'Opciones' })
    await expect(optionsTrigger).toBeVisible()
    await optionsTrigger.click()
    const optionsDialog = page.getByRole('dialog', {
      name: 'Opciones de Color',
    })
    await optionsDialog.getByRole('textbox', { name: 'Clave' }).fill('BLANCO')
    await optionsDialog.getByRole('textbox', { name: 'Nombre' }).fill('Blanco')
    await optionsDialog.getByRole('button', { name: 'Crear opción' }).click()
    await expect(
      optionsDialog.getByText('BLANCO', { exact: true }),
    ).toBeVisible()
    await optionsDialog.getByRole('textbox', { name: 'Clave' }).fill('NEGRO')
    await optionsDialog.getByRole('textbox', { name: 'Nombre' }).fill('Negro')
    await optionsDialog.getByRole('checkbox', { name: 'Crear activa' }).check()
    await optionsDialog.getByRole('button', { name: 'Crear opción' }).click()
    await expect(
      optionsDialog.getByText('NEGRO', { exact: true }),
    ).toBeVisible()
    expect(calls).toEqual([
      {
        path: 'catalogoAdmin/atributos:crearOpcionAtributo',
        args: {
          activo: false,
          clave: 'BLANCO',
          definicionAtributoId: 'definition-color',
          nombre: 'Blanco',
        },
      },
      {
        path: 'catalogoAdmin/atributos:crearOpcionAtributo',
        args: {
          activo: true,
          clave: 'NEGRO',
          definicionAtributoId: 'definition-color',
          nombre: 'Negro',
        },
      },
    ])

    await optionsDialog.getByRole('button', { name: 'Editar Blanco' }).click()
    await optionsDialog
      .getByRole('textbox', { name: 'Nombre' })
      .fill('Blanco cálido')
    await optionsDialog
      .getByRole('textbox', { name: 'Descripción' })
      .fill('Tono claro y cálido.')
    await optionsDialog.getByRole('button', { name: 'Guardar edición' }).click()
    await expect.poll(() => calls.length).toBe(3)
    expect(calls[2]).toEqual({
      path: 'catalogoAdmin/atributos:actualizarOpcionAtributo',
      args: {
        descripcion: 'Tono claro y cálido.',
        expectedRevision: 1,
        nombre: 'Blanco cálido',
        opcionAtributoId: 'option-1',
      },
    })
    const refreshedOption = optionsDialog
      .getByRole('button', { name: 'Editar Blanco cálido' })
      .locator('xpath=ancestor::li')
    await expect(refreshedOption).toContainText('Tono claro y cálido.')
    await expect(
      optionsDialog.getByRole('textbox', { name: 'Clave' }),
    ).toHaveValue('')
    await expect(
      optionsDialog.getByRole('textbox', { name: 'Nombre' }),
    ).toHaveValue('')
    await expect(
      optionsDialog.getByRole('textbox', { name: 'Descripción' }),
    ).toHaveValue('')
    await expect(
      optionsDialog.getByRole('checkbox', { name: 'Crear activa' }),
    ).not.toBeChecked()

    await optionsDialog
      .getByRole('button', { name: 'Activar Blanco cálido' })
      .click()
    await expect.poll(() => calls.length).toBe(4)
    expect(calls[3]).toEqual({
      path: 'catalogoAdmin/atributos:activarOpcionAtributo',
      args: { expectedRevision: 2, opcionAtributoId: 'option-1' },
    })
    await expect(
      optionsDialog.getByLabel('Estado de Blanco cálido'),
    ).toHaveText('ActivaEfectiva')
    const optionPreview = page.locator('.catalog-option-preview').first()
    await expect(optionPreview).toContainText('Blanco cálido')
    await expect(optionPreview).toContainText('Negro')
    await expect(optionPreview).toContainText('2 activas · 0 inactivas')

    await optionsDialog
      .getByRole('button', { name: 'Desactivar Negro' })
      .click()
    const confirmation = optionsDialog.getByRole('alertdialog', {
      name: 'Desactivar opción',
    })
    await expect(confirmation).toBeVisible()
    await confirmation
      .getByRole('button', { name: 'Desactivar opción' })
      .click()
    await expect(optionsDialog.getByRole('alert')).toContainText(
      'No se puede desactivar esta opción porque está en uso por recursos, reglas o compatibilidad.',
    )
    await expect(optionsDialog.getByRole('alert')).not.toContainText(
      'secret dependency detail',
    )

    await optionsDialog
      .getByRole('button', { name: 'Desactivar Negro' })
      .click()
    await optionsDialog
      .getByRole('alertdialog', { name: 'Desactivar opción' })
      .getByRole('button', { name: 'Desactivar opción' })
      .click()
    await expect.poll(() => calls.length).toBe(6)
    expect(calls.slice(4)).toEqual([
      {
        path: 'catalogoAdmin/atributos:desactivarOpcionAtributo',
        args: { expectedRevision: 1, opcionAtributoId: 'option-2' },
      },
      {
        path: 'catalogoAdmin/atributos:desactivarOpcionAtributo',
        args: { expectedRevision: 1, opcionAtributoId: 'option-2' },
      },
    ])
    await expect(optionsDialog.getByLabel('Estado de Negro')).toHaveText(
      'InactivaNo efectiva',
    )
    await expect(optionPreview).toContainText('1 activa · 1 inactiva')
    await expect(optionsDialog).toBeVisible()
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

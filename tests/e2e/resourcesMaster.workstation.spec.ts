import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

type RequestCall = { path: string; args: Record<string, unknown> }
type ResourceResponse =
  | { status: number; body?: string; contentType?: string }
  | undefined

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

const hierarchyItem = (id: string, nombre: string) => ({
  id,
  clave: id,
  nombre,
  activo: true,
  revision: 1,
  effective: true,
  effectiveReasons: [],
})

async function mockResources(
  page: Page,
  resourceResponse: (call: RequestCall) => ResourceResponse,
) {
  const calls: RequestCall[] = []
  await page.route('http://127.0.0.1:3210/**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({ status: 204 })
      return
    }
    const body = route.request().postDataJSON() as {
      path: string
      args?: [Record<string, unknown>]
    }
    const call = { path: body.path, args: body.args?.[0] ?? {} }
    calls.push(call)
    if (call.path.endsWith(':listarClases')) {
      await route.fulfill(
        response({
          continuationCursor: null,
          isExhausted: true,
          items: [hierarchyItem('class-1', 'Materiales')],
        }),
      )
      return
    }
    if (call.path.endsWith(':listarFamilias')) {
      await route.fulfill(
        response({
          continuationCursor: null,
          isExhausted: true,
          items: [
            {
              ...hierarchyItem('family-1', 'Canalizaciones'),
              claseRecursoId: 'class-1',
            },
          ],
        }),
      )
      return
    }
    if (call.path.endsWith(':listarTipos')) {
      await route.fulfill(
        response({
          continuationCursor: null,
          isExhausted: true,
          items: [
            {
              ...hierarchyItem('type-1', 'Tuberías'),
              aggregateStatus: 'CLEAN',
              familiaRecursoId: 'family-1',
              violations: [],
            },
          ],
        }),
      )
      return
    }
    const result = resourceResponse(call)
    await route.fulfill(
      result ??
        response({
          page: [summary('r1', 'Cable UTP')],
          isDone: true,
          continueCursor: '',
        }),
    )
  })
  return calls
}

const resourceRequestArgs = ({
  cursor,
  pageSize,
  ...filters
}: Record<string, unknown>) => ({
  paginationOpts: { cursor: cursor ?? null, numItems: pageSize },
  ...filters,
})

const resourceListCall = (args: Record<string, unknown>) => ({
  path: 'catalogoAdmin/recursos:listarRecursosResumen',
  args: resourceRequestArgs(args),
})

const resourceSearchCall = (args: Record<string, unknown>) => ({
  path: 'catalogoAdmin/recursos:buscarRecursosResumen',
  args: resourceRequestArgs(args),
})

const matchesResourceCall = (call: RequestCall, expected: RequestCall) =>
  call.path === expected.path &&
  Object.keys(call.args).length === Object.keys(expected.args).length &&
  Object.entries(expected.args).every(
    ([key, value]) => JSON.stringify(call.args[key]) === JSON.stringify(value),
  )

const listCalls = (calls: readonly RequestCall[]) =>
  calls.filter(({ path }) => path.endsWith(':listarRecursosResumen'))

async function chooseResourceContext(
  page: Page,
  label: string,
  option: string,
) {
  await page.getByRole('button', { name: new RegExp(label) }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('Recursos maestros workstation 1440×980', () => {
  test('lists all resources, scopes hierarchy filters and search, and keeps the spatial paths connected', async ({
    page,
  }) => {
    const calls = await mockResources(page, ({ path, args }) => {
      const typeId = args.tipoRecursoId
      if (path.endsWith(':buscarRecursosResumen'))
        return response({
          page: [summary('r-search', 'Tubería industrial')],
          isDone: true,
          continueCursor: '',
        })
      return response({
        page: [
          summary(
            typeId === 'type-1' ? 'r-type' : 'r-all',
            typeId === 'type-1' ? 'Tubería PVC' : 'Cable UTP',
          ),
        ],
        isDone: true,
        continueCursor: '',
      })
    })

    await page.goto('/recursos')
    const sidebarResources = page.getByRole('link', {
      name: 'Recursos maestros',
    })
    const classes = page.getByRole('button', { name: 'Materiales' })
    const families = page.getByRole('button', { name: 'Canalizaciones' })
    const types = page.getByRole('button', { name: 'Tuberías' })
    const search = page.getByRole('searchbox', { name: 'Buscar' })

    await expect(
      page.getByRole('heading', { name: 'Recursos maestros' }),
    ).toBeVisible()
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    await expect
      .poll(() => calls)
      .toContainEqual(
        resourceListCall({
          lifecycle: 'ACTIVE',
          cursor: undefined,
          pageSize: 20,
        }),
      )

    await sidebarResources.focus()
    await page.keyboard.press('ArrowRight')
    await expect(classes).toBeFocused()
    await expect(classes).toHaveAttribute('aria-pressed', 'true')
    await expect(families).toBeVisible()
    await expect
      .poll(() => calls)
      .toContainEqual(
        resourceListCall({
          lifecycle: 'ACTIVE',
          claseRecursoId: 'class-1',
          cursor: undefined,
          pageSize: 20,
        }),
      )

    await page.keyboard.press('ArrowRight')
    await expect(families).toBeFocused()
    await expect(families).toHaveAttribute('aria-pressed', 'true')
    await expect(types).toBeVisible()
    await expect
      .poll(() => calls)
      .toContainEqual(
        resourceListCall({
          lifecycle: 'ACTIVE',
          familiaRecursoId: 'family-1',
          cursor: undefined,
          pageSize: 20,
        }),
      )

    await page.keyboard.press('ArrowRight')
    await expect(types).toBeFocused()
    await expect(types).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-resource-row]')).toContainText(
      'Tubería PVC',
    )
    await expect
      .poll(() => calls)
      .toContainEqual(
        resourceListCall({
          lifecycle: 'ACTIVE',
          tipoRecursoId: 'type-1',
          cursor: undefined,
          pageSize: 20,
        }),
      )

    await page.keyboard.press('ArrowRight')
    await expect(search).toBeFocused()
    await search.fill('Tubería')
    await expect(page.locator('[data-resource-row]')).toContainText(
      'Tubería industrial',
    )
    await expect
      .poll(() => calls)
      .toContainEqual(
        resourceSearchCall({
          lifecycle: 'ACTIVE',
          tipoRecursoId: 'type-1',
          searchText: 'Tubería',
          cursor: undefined,
          pageSize: 20,
        }),
      )

    await page.keyboard.press('ArrowDown')
    const firstRow = page.locator('[data-resource-row]').first()
    await expect(firstRow).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(types).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(families).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(classes).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(sidebarResources).toBeFocused()

    await firstRow.focus()
    await page.keyboard.press('b')
    await expect(search).toBeFocused()
  })

  test('does not refetch the active list when its visibility listener fires while visible', async ({
    page,
  }) => {
    const calls = await mockResources(page, () => undefined)

    await page.goto('/recursos')
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    expect(listCalls(calls)).toHaveLength(1)

    await page.evaluate(() => {
      if (document.visibilityState !== 'visible')
        throw new Error('The browser document must be visible for this check')
      window.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForTimeout(300)

    expect(listCalls(calls)).toHaveLength(1)
  })

  test('opens the existing resource creation action from its trigger and shortcut', async ({
    page,
  }) => {
    await mockResources(page, () => undefined)
    await page.goto('/recursos')
    const trigger = page.getByRole('button', { name: 'Nuevo recurso' })

    await trigger.click()
    await expect(
      page.getByRole('dialog', { name: 'Nuevo recurso' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()

    await page.keyboard.press('n')
    await expect(
      page.getByRole('dialog', { name: 'Nuevo recurso' }),
    ).toBeVisible()
  })

  test('keeps loaded rows through continuation failure and retry', async ({
    page,
  }) => {
    let continuationAttempts = 0
    const calls = await mockResources(page, ({ path, args }) => {
      if (!path.endsWith(':listarRecursosResumen')) return undefined
      const pagination = args.paginationOpts as { cursor: string | null }
      if (pagination.cursor === null)
        return response({
          page: [summary('r1', 'Cable UTP')],
          isDone: false,
          continueCursor: 'cursor-2',
        })
      continuationAttempts += 1
      if (continuationAttempts === 1)
        return {
          status: 500,
          body: 'temporary failure',
          contentType: 'text/plain',
        }
      return response({
        page: [summary('r2', 'Motor 1/2 HP')],
        isDone: true,
        continueCursor: '',
      })
    })

    await page.goto('/recursos')
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    await page.getByRole('button', { name: 'Cargar más…' }).click()
    await expect(page.getByRole('alert')).toContainText(
      'No se pudo cargar la página siguiente.',
    )
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    await page.getByRole('button', { name: 'Reintentar continuación' }).click()
    await expect(page.getByRole('row', { name: /Motor 1\/2 HP/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Cable UTP/ })).toBeVisible()
    expect(continuationAttempts).toBe(2)
    expect(
      listCalls(calls).filter(
        ({ args }) =>
          (args.paginationOpts as { cursor: string | null }).cursor ===
          'cursor-2',
      ),
    ).toHaveLength(2)
  })

  test('refetches only the active list key after a confirmed resource creation', async ({
    page,
  }) => {
    const activeListRequest = resourceListCall({
      lifecycle: 'ACTIVE',
      cursor: undefined,
      pageSize: 20,
    })
    const inactiveSearchRequest = resourceSearchCall({
      lifecycle: 'ACTIVE',
      searchText: 'inactiva',
      cursor: undefined,
      pageSize: 20,
    })
    const activeListRequests: RequestCall[] = []
    const inactiveSearchRequests: RequestCall[] = []
    let creationConfirmed = false
    const calls = await mockResources(page, (call) => {
      if (matchesResourceCall(call, activeListRequest)) {
        activeListRequests.push(call)
        return response({
          page: [
            creationConfirmed
              ? summary('r-created', 'Motor creado')
              : summary('r1', 'Cable UTP'),
          ],
          isDone: true,
          continueCursor: '',
        })
      }
      if (matchesResourceCall(call, inactiveSearchRequest)) {
        inactiveSearchRequests.push(call)
        return response({
          page: [summary('r-inactive', 'Resultado inactivo')],
          isDone: true,
          continueCursor: '',
        })
      }
      if (call.path.endsWith(':listarPoliticasUnidad'))
        return response({
          continuationCursor: null,
          isExhausted: true,
          items: [
            {
              id: 'policy-1',
              familiaRecursoId: 'family-1',
              tipoRecursoId: 'type-1',
              unidadId: 'unit-1',
              principal: true,
              activo: true,
              revision: 1,
              effective: true,
              selected: true,
              shadowed: false,
              selection: 'SELECTED',
            },
          ],
        })
      if (call.path.endsWith(':obtenerUnidad'))
        return response({
          id: 'unit-1',
          clave: 'UN',
          nombre: 'Unidad',
          simbolo: 'u',
          activo: true,
          revision: 1,
          effective: true,
        })
      if (call.path.endsWith(':listarAsignacionesAtributo'))
        return response({
          continuationCursor: null,
          isExhausted: true,
          items: [],
        })
      if (call.path.endsWith(':crearRecurso')) {
        creationConfirmed = true
        return response({
          disposition: 'CREATED',
          item: summary('r-created', 'Motor creado'),
        })
      }
      return undefined
    })

    await page.goto('/recursos')
    const search = page.getByRole('searchbox', { name: 'Buscar' })
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    await search.fill('inactiva')
    await expect.poll(() => inactiveSearchRequests).toHaveLength(1)
    await expect(page.locator('[data-resource-row]')).toContainText(
      'Resultado inactivo',
    )
    await search.fill('')
    await expect(page.locator('[data-resource-row]')).toContainText('Cable UTP')
    await page.getByRole('button', { name: 'Nuevo recurso' }).click()
    await chooseResourceContext(page, 'Clase', 'Materiales')
    await chooseResourceContext(page, 'Familia', 'Canalizaciones')
    await chooseResourceContext(page, 'Tipo', 'Tuberías')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.getByLabel('Nombre').fill('Motor creado')
    const activeCountBeforeCreate = activeListRequests.length
    const inactiveCountBeforeCreate = inactiveSearchRequests.length
    await page.getByRole('button', { name: 'Crear recurso' }).click()

    await expect(page.getByText('✓ Recurso creado')).toBeVisible()
    await expect
      .poll(() => activeListRequests.length)
      .toBe(activeCountBeforeCreate + 1)
    await expect(page.locator('[data-resource-row]')).toContainText(
      'Motor creado',
    )
    expect(inactiveSearchRequests).toHaveLength(inactiveCountBeforeCreate)
    expect(listCalls(calls)).toContainEqual(activeListRequest)
    expect(calls).toContainEqual(inactiveSearchRequest)
  })

  test('confirms an empty resource filter without guessing', async ({
    page,
  }) => {
    await mockResources(page, ({ path }) => {
      if (!path.endsWith(':listarRecursosResumen')) return undefined
      return response({ page: [], isDone: true, continueCursor: '' })
    })
    await page.goto('/recursos')
    await expect(page.getByRole('status')).toHaveText(
      'No hay recursos para este filtro.',
    )
  })

  test('passes axe at the approved workstation viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 })
    await mockResources(page, () => undefined)
    await page.goto('/recursos')
    await expect(
      page.getByRole('heading', { name: 'Recursos maestros' }),
    ).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
})

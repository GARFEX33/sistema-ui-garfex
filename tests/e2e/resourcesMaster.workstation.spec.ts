import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

type RequestCall = { path: string; args: Record<string, unknown> }
type ResourceResponse =
  | { status: number; body?: string; contentType?: string }
  | undefined

type CreationFixture = Readonly<{
  createResponse?: (
    attempt: number,
  ) => ResourceResponse | Promise<ResourceResponse>
}>

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
  creationFixture?: CreationFixture,
) {
  const calls: RequestCall[] = []
  const hasCreationFixture = creationFixture !== undefined
  let createAttempts = 0
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
      const firstPage =
        !hasCreationFixture || call.args.cursor !== 'class-page-2'
      await route.fulfill(
        response({
          continuationCursor: hasCreationFixture
            ? firstPage
              ? 'class-page-2'
              : 'class-page-3'
            : null,
          isExhausted: !hasCreationFixture,
          items: firstPage
            ? [hierarchyItem('class-1', 'Materiales')]
            : [hierarchyItem('class-2', 'Equipos')],
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
    if (hasCreationFixture && call.path.endsWith(':listarPoliticasUnidad')) {
      expect(call.args).toEqual({
        familiaRecursoId: 'family-1',
        paraTipoRecursoId: 'type-1',
        cursor: null,
        pageSize: 20,
        modo: 'ACTIVE',
      })
      await route.fulfill(
        response({
          continuationCursor: null,
          isExhausted: true,
          items: [
            {
              id: 'inherited-unit-policy',
              familiaRecursoId: 'family-1',
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
        }),
      )
      return
    }
    if (hasCreationFixture && call.path.endsWith(':obtenerUnidad')) {
      expect(call.args).toEqual({ unidadId: 'unit-1' })
      await route.fulfill(
        response({
          id: 'unit-1',
          clave: 'UN',
          nombre: 'Unidad',
          simbolo: 'u',
          activo: true,
          revision: 1,
          effective: true,
        }),
      )
      return
    }
    if (
      hasCreationFixture &&
      call.path.endsWith(':obtenerDefinicionAtributo')
    ) {
      const color = call.args.definicionAtributoId === 'definition-color'
      expect(call.args).toEqual({
        definicionAtributoId: color ? 'definition-color' : 'definition-finish',
      })
      await route.fulfill(
        response({
          id: color ? 'definition-color' : 'definition-finish',
          clave: color ? 'COLOR' : 'ACABADO',
          nombre: color ? 'Color' : 'Acabado',
          tipoDato: 'TEXTO',
          modoCaptura: 'SELECCION',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
        }),
      )
      return
    }
    if (
      hasCreationFixture &&
      call.path.endsWith(':listarValoresPermitidosAtributo')
    ) {
      const color = call.args.definicionAtributoId === 'definition-color'
      expect(call.args).toEqual({
        definicionAtributoId: color ? 'definition-color' : 'definition-finish',
        cursor: null,
        pageSize: 20,
        modo: 'ACTIVE',
      })
      await route.fulfill(
        response({
          items: [
            {
              id: color ? 'value-red' : 'value-matte',
              definicionAtributoId: color
                ? 'definition-color'
                : 'definition-finish',
              clave: color ? 'ROJO' : 'MATE',
              valor: { kind: 'TEXTO', value: color ? 'Rojo' : 'Mate' },
              nombre: color ? 'Rojo' : 'Mate',
              orden: 1,
              activo: true,
              revision: 1,
              effective: true,
              effectiveReasons: [],
            },
          ],
          continuationCursor: null,
          isExhausted: true,
        }),
      )
      return
    }
    if (
      hasCreationFixture &&
      call.path.endsWith(':evaluarCreacionDesdeSelecciones')
    ) {
      const selections = call.args.selecciones as Array<{
        asignacionAtributoId: string
        valorPermitidoId: string
      }>
      const colorSelected = selections.some(
        ({ asignacionAtributoId, valorPermitidoId }) =>
          asignacionAtributoId === 'assignment-color' &&
          valorPermitidoId === 'value-red',
      )
      expect(call.args).toEqual({
        claseRecursoId: 'class-1',
        familiaRecursoId: 'family-1',
        tipoRecursoId: 'type-1',
        unidadId: 'unit-1',
        selecciones: colorSelected
          ? [
              {
                asignacionAtributoId: 'assignment-color',
                valorPermitidoId: 'value-red',
              },
            ]
          : [],
        ownership: { kind: 'GLOBAL' },
      })
      await route.fulfill(
        response(
          creationEvaluation(
            colorSelected ? 'VALID' : 'INCOMPLETE',
            colorSelected,
          ),
        ),
      )
      return
    }
    if (
      hasCreationFixture &&
      call.path.endsWith(':crearRecursoDesdeSelecciones')
    ) {
      expect(call.args).toEqual({
        claseRecursoId: 'class-1',
        familiaRecursoId: 'family-1',
        tipoRecursoId: 'type-1',
        unidadId: 'unit-1',
        expectedCatalogFingerprint: 'catalog-v1',
        selecciones: [
          {
            asignacionAtributoId: 'assignment-color',
            valorPermitidoId: 'value-red',
          },
        ],
        ownership: { kind: 'GLOBAL' },
      })
      await route.fulfill(
        (await creationFixture?.createResponse?.(createAttempts++)) ??
          response({
            disposition: 'CREATED',
            item: summary('resource-created', 'Tubería roja'),
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

const listCalls = (calls: readonly RequestCall[]) =>
  calls.filter(({ path }) => path.endsWith(':listarRecursosResumen'))

const creationEvaluation = (
  status: 'INCOMPLETE' | 'VALID' | 'INVALID',
  colorSelected: boolean,
  invalidSelection = false,
) => ({
  status,
  valid: status === 'VALID',
  catalogFingerprint: 'catalog-v1',
  nombre: colorSelected ? 'Tubería roja' : null,
  identificadorTecnico: colorSelected ? 'TUB-ROJA' : null,
  asignaciones: [
    {
      asignacionAtributoId: 'assignment-color',
      definicionAtributoId: 'definition-color',
      aplicabilidadResuelta: 'REQUIRED',
      participaIdentidad: true,
      orden: 1,
      effectiveReasons: [],
      ...(colorSelected ? { selectedValueId: 'value-red' } : {}),
    },
    {
      asignacionAtributoId: 'assignment-finish',
      definicionAtributoId: 'definition-finish',
      aplicabilidadResuelta: 'OPTIONAL',
      participaIdentidad: false,
      orden: 2,
      effectiveReasons: [],
    },
  ],
  faltantesRequeridos: colorSelected ? [] : ['assignment-color'],
  seleccionesInvalidas: invalidSelection ? ['assignment-color'] : [],
  valoresNormalizados: colorSelected
    ? [{ atributoRecursoId: 'color', valor: 'Rojo' }]
    : [],
  issues:
    status === 'VALID'
      ? []
      : [
          {
            code: 'HIERARCHY_INVALID',
            message: 'Selecciona un color permitido.',
            asignacionAtributoId: 'assignment-color',
          },
        ],
})

const completeCreationContext = async (page: Page) => {
  await page.keyboard.press('n')

  for (const [label, option] of [
    ['Clase', 'Materiales'],
    ['Familia', 'Canalizaciones'],
    ['Tipo', 'Tuberías'],
    ['Unidad natural', 'Unidad (u)'],
  ] as const) {
    const search = page.getByRole('searchbox', { name: label })
    await expect(search).toBeFocused()
    await expect(page.getByRole('option', { name: option })).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  }

  return page.getByRole('searchbox', { name: 'Color' })
}

const reachReadyReview = async (
  page: Page,
  beforeColorConfirmation?: () => Promise<void>,
) => {
  const colorSearch = await completeCreationContext(page)
  await expect(colorSearch).toBeFocused()
  await beforeColorConfirmation?.()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  const finishSearch = page.getByRole('searchbox', { name: 'Acabado' })
  const finishOption = page.getByRole('option', { name: 'Mate' })
  const omit = page.getByRole('button', { name: 'Omitir' })
  await expect(finishSearch).toBeFocused()
  await expect(finishOption).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(finishOption).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(omit).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(
    page.getByRole('heading', { name: 'Revisión de creación' }),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Crear recurso' }),
  ).toBeFocused()
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
      page.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()

    await page.keyboard.press('n')
    await expect(
      page.getByRole('dialog', { name: 'Creador de recursos' }),
    ).toBeVisible()
  })

  test('completes the selection-only creation journey against exact published DTO fixtures', async ({
    page,
  }) => {
    const calls = await mockResources(page, () => undefined, {})
    await page.goto('/recursos')
    await reachReadyReview(page, async () => {
      await expect(
        page.getByRole('heading', { name: 'Atributos · 1 de 2', exact: true }),
      ).toBeVisible()
      await expect(page.getByText('Obligatorio')).toBeVisible()
      await expect(page.getByRole('option', { name: 'Rojo' })).toBeVisible()
      expect(
        (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
          .violations,
      ).toEqual([])
    })
    await expect(
      page.getByText('La evaluación está lista para crear el recurso.'),
    ).toBeVisible()
    await expect(page.getByText('Tubería roja')).toBeVisible()
    await expect(page.getByText('TUB-ROJA')).toBeVisible()
    expect(
      (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
        .violations,
    ).toEqual([])

    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('heading', { name: 'Recurso creado' }),
    ).toBeFocused()
    await expect(
      page.getByText('El recurso Tubería roja fue creado.'),
    ).toBeVisible()
    expect(calls.map(({ path }) => path)).toContain(
      'catalogoAdmin/recursos:evaluarCreacionDesdeSelecciones',
    )
    expect(calls.map(({ path }) => path)).toContain(
      'catalogoAdmin/recursos:crearRecursoDesdeSelecciones',
    )
    expect(calls.map(({ path }) => path)).not.toContain(
      'catalogoAdmin/recursos:crearRecurso',
    )
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

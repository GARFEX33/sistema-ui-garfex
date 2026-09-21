import { expect, test } from '@playwright/test'

const largeWorkbenchRows = Array.from({ length: 40 }, (_, index) => ({
  lineId: String(index + 1),
  purchaseId: String(index + 1),
  lineNumber: index + 1,
  issuedAt: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T14:30:00.000Z`,
  series: 'A',
  folio: String(1000 + index),
  cfdiUuid: `uuid-${index + 1}-with-enough-metadata-to-keep-the-document-cell-readable`,
  supplierId: '1',
  supplierDisplayName: 'Proveedor de prueba para el workbench',
  description:
    'Descripción larga de una partida de prueba para verificar la contención del resultado',
  supplierSku: `XML-SKU-${index + 1}`,
  commercialSupplierSku: null,
  satProductCode: '7318',
  quantity: '3',
  unitCode: 'H87',
  unit: 'Pieza',
  unitPrice: '10.50',
  amount: '31.50',
  currency: 'MXN',
  supplierProductId: null,
  mappingRevision: null,
  resolutionRevision: '1',
  resourceId: null,
  resourceIdentity: null,
  resourceDisplayName: null,
  resolutionOverride: 'NONE',
  effectiveStatus: index % 2 ? 'VINCULADO' : 'PENDIENTE',
  effectiveCause: index % 2 ? 'RESOLVED' : 'UNRESOLVED',
}))

test.describe('Compras Partidas workbench', () => {
  test('renders the workbench structure and supports read-only navigation', async ({
    page,
  }) => {
    await page.goto('/compras')

    await expect(page).toHaveURL(/\/compras$/)
    await expect(
      page.getByRole('heading', { name: 'Partidas', level: 1 }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Seleccioná una partida para vincularla a un Recurso Maestro.',
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('group', { name: 'Perspectiva de Compras' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Partidas' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('region', { name: 'Filtros de partidas' }),
    ).toBeVisible()
    await expect(
      page.getByRole('combobox', { name: 'Proveedor' }),
    ).toBeVisible()
    await expect(
      page.getByRole('searchbox', { name: 'Factura o referencia' }),
    ).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: 'Descripción' }),
    ).toBeVisible()

    await page.getByText('Más filtros').click()
    await expect(
      page.getByRole('textbox', { name: 'SKU proveedor XML' }),
    ).toBeVisible()
    await expect(page.getByLabel('Filtrar por estado')).toBeVisible()
    await page.getByRole('button', { name: 'Vinculado' }).click()
    await expect(
      page.getByRole('button', { name: 'Vinculado' }),
    ).toHaveAttribute('aria-pressed', 'true')

    const documentAction = page.getByRole('button', {
      name: /Inspeccionar documento/,
    })
    if (await documentAction.count()) {
      await documentAction.first().click()
      await expect(
        page.getByRole('button', { name: 'Documentos' }),
      ).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Partidas' }).click()
      await expect(
        page.getByRole('heading', { name: 'Partidas', level: 1 }),
      ).toBeVisible()
    }

    await expect(
      page.getByRole('heading', { name: 'Partidas pendientes entre compras' }),
    ).toHaveCount(0)
  })

  test('contains a large result set inside the 1440px workbench viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 980 })
    await page.route(/\/v1\/purchase-lines\?/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lines: largeWorkbenchRows,
          hasPrevious: false,
          hasNext: true,
        }),
      })
    })
    await page.goto('/compras')

    const tableRegion = page.getByRole('region', {
      name: 'Partidas de compras',
    })
    await expect(tableRegion.locator('tbody tr')).toHaveCount(40)
    await expect(page.getByText('Mostrando 1–40')).toBeVisible()
    await expect(page.getByText('Más resultados disponibles')).toBeVisible()

    const viewportMetrics = await page.evaluate(() => ({
      innerHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      workbenchHeight: document
        .querySelector('.compras-screen--partidas')
        ?.getBoundingClientRect().height,
    }))
    expect(viewportMetrics.documentHeight).toBeLessThanOrEqual(
      viewportMetrics.innerHeight,
    )
    expect(viewportMetrics.bodyHeight).toBeLessThanOrEqual(
      viewportMetrics.innerHeight,
    )
    expect(viewportMetrics.workbenchHeight).toBeLessThanOrEqual(
      viewportMetrics.innerHeight,
    )

    const overflowMetrics = await tableRegion.evaluate((element) => ({
      vertical: element.scrollHeight > element.clientHeight,
      horizontal: element.scrollWidth > element.clientWidth,
    }))
    expect(overflowMetrics).toEqual({ vertical: true, horizontal: true })

    await tableRegion.evaluate((element) => {
      element.scrollTop = 160
      element.scrollLeft = 160
    })
    await expect
      .poll(() =>
        tableRegion.evaluate((element) => [
          element.scrollTop,
          element.scrollLeft,
        ]),
      )
      .toEqual([160, 160])

    const regionTop = await tableRegion.evaluate(
      (element) => element.getBoundingClientRect().top,
    )
    const headerTop = await page
      .getByRole('columnheader', { name: 'Fecha' })
      .evaluate((element) => element.getBoundingClientRect().top)
    expect(Math.abs(headerTop - regionTop)).toBeLessThan(3)

    const pagination = page.getByRole('navigation', {
      name: 'Paginación de partidas',
    })
    await expect(pagination).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const region = document.querySelector(
            '[role="region"][aria-label="Partidas de compras"]',
          )
          const nav = document.querySelector(
            'nav[aria-label="Paginación de partidas"]',
          )
          return Boolean(region && nav && !region.contains(nav))
        }),
      )
      .toBe(true)
  })
})

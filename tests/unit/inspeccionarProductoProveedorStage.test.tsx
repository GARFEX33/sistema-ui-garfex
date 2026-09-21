import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComprasRestApi } from '../../src/features/compras/compras.api'
import { InspeccionarProductoProveedorStage } from '../../src/features/compras/InspeccionarProductoProveedorStage'
import type { SupplierProduct } from '../../src/features/compras/compras.types'
const product = (id: string, supplierId = 'supplier-1'): SupplierProduct => ({
  id,
  supplierId,
  supplierSku: `SKU-${id}`,
  description: `Producto ${id}`,
  resourceId: id === 'one' ? 'resource-1' : null,
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
})
type StageProps = React.ComponentProps<
  typeof InspeccionarProductoProveedorStage
>
type WindowOverrides = Partial<NonNullable<StageProps['productsWindow']>>
const inspectionWindow = (
  rows: SupplierProduct[],
  overrides: WindowOverrides = {},
) => ({
  rows,
  status: 'ready' as const,
  offset: 0,
  hasPrevious: false,
  hasNext: false,
  next: vi.fn(),
  previous: vi.fn(),
  retry: vi.fn(),
  ...overrides,
})
const LayoutProbe = ({
  children,
  onLayout,
}: {
  children: ReactNode
  onLayout: (value: boolean) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    onLayout(
      Boolean(
        ref.current?.querySelector(
          '[aria-label="Detalle del Producto de Proveedor seleccionado"]',
        ),
      ),
    )
  }, [children, onLayout])
  return <div ref={ref}>{children}</div>
}
const wrap = (
  node: ReactNode,
  client: QueryClient,
  onLayout?: (value: boolean) => void,
) => (
  <QueryClientProvider client={client}>
    {onLayout ? <LayoutProbe onLayout={onLayout}>{node}</LayoutProbe> : node}
  </QueryClientProvider>
)
const renderStage = (
  props: Partial<StageProps> = {},
  onLayout?: (value: boolean) => void,
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const view = render(
    wrap(<InspeccionarProductoProveedorStage {...props} />, client, onLayout),
  )
  return { ...view, client }
}
const rerenderStage = (
  view: ReturnType<typeof renderStage>,
  props: Partial<StageProps>,
  onLayout?: (value: boolean) => void,
) => {
  view.rerender(
    wrap(
      <InspeccionarProductoProveedorStage {...props} />,
      view.client,
      onLayout,
    ),
  )
}
afterEach(() => vi.restoreAllMocks())
describe('InspeccionarProductoProveedorStage', () => {
  it('does not request without supplier context and explains the disabled inspection', () => {
    const list = vi.fn()
    renderStage({
      api: { listSupplierProducts: list } as unknown as ComprasRestApi,
    })
    expect(list).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Seleccioná un proveedor para inspeccionar sus productos.',
      ),
    ).toBeInTheDocument()
  })
  it('represents initial loading, empty, error, and retry states', async () => {
    const retry = vi.fn()
    const view = renderStage({
      supplierId: 'supplier-1',
      productsWindow: inspectionWindow([], {
        status: 'initial-loading',
        retry,
      }),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando opciones')
    rerenderStage(view, {
      supplierId: 'supplier-1',
      productsWindow: inspectionWindow([], { status: 'empty' }),
    })
    expect(screen.getByRole('status')).toHaveTextContent('No hay opciones')
    rerenderStage(view, {
      supplierId: 'supplier-1',
      productsWindow: inspectionWindow([], { status: 'initial-error', retry }),
    })
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()
  })
  it('requires explicit selection, exposes pages, and resets same-ID replacement synchronously', async () => {
    const first = product('one'),
      second = product('two'),
      replacement = { ...second, description: 'Producto reemplazo' }
    const next = vi.fn(),
      link = vi.fn(),
      inspected = vi.fn(),
      frames: boolean[] = []
    const view = renderStage(
      {
        supplierId: 'supplier-1',
        productsWindow: inspectionWindow([first], {
          hasNext: true,
          next,
        }),
        api: { listSupplierProducts: link } as unknown as ComprasRestApi,
        onProductInspected: inspected,
      },
      (value) => frames.push(value),
    )
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('searchbox', { name: 'Producto de Proveedor' }),
      'SKU-one',
    )
    expect(inspected).not.toHaveBeenCalled()
    await user.click(screen.getByText('Producto one'))
    expect(inspected).toHaveBeenCalledWith(first)
    expect(link).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('button', { name: 'Página siguiente de productos' }),
    )
    rerenderStage(
      view,
      {
        supplierId: 'supplier-1',
        productsWindow: inspectionWindow([second], {
          offset: 20,
          hasPrevious: true,
        }),
        onProductInspected: inspected,
      },
      (value) => frames.push(value),
    )
    expect(await screen.findByText('Producto two')).toBeInTheDocument()
    await user.click(screen.getByText('Producto two'))
    const beforeReplacement = frames.length
    rerenderStage(
      view,
      {
        supplierId: 'supplier-1',
        productsWindow: inspectionWindow([replacement], {
          offset: 20,
          hasPrevious: true,
        }),
        onProductInspected: inspected,
      },
      (value) => frames.push(value),
    )
    expect(frames.slice(beforeReplacement)).not.toContain(true)
    expect(
      screen.getByText('Mostrando 1 productos, registros 21–21.'),
    ).toBeInTheDocument()
  })
  it('represents navigation loading, error, and retry without retaining prior rows', async () => {
    const retry = vi.fn()
    const view = renderStage({
      supplierId: 'supplier-1',
      productsWindow: inspectionWindow([product('one')], {
        status: 'navigating',
        hasNext: true,
        retry,
      }),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando opciones')
    rerenderStage(view, {
      supplierId: 'supplier-1',
      productsWindow: inspectionWindow([product('one')], {
        status: 'navigation-error',
        retry,
      }),
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las opciones',
    )
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})

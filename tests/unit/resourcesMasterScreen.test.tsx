import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render as baseRender,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResourcesMasterScreen } from '../../src/features/resources-master/ResourcesMasterScreen'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'

const summary = (
  id: string,
  nombre: string,
  overrides: Partial<Record<string, unknown>> = {},
) => ({
  id,
  identificadorTecnico: `REC-${id}`,
  nombre,
  tipoRecursoId: 'tipo-1',
  unidadId: 'unidad-1',
  activo: true,
  revision: 1,
  classificationStatus: { state: 'EFFECTIVE' as const, reasons: [] },
  ...overrides,
})

const page = (items: object[], isDone = true, continueCursor = '') => ({
  page: items,
  isDone,
  continueCursor,
})

const fakeApi = (
  overrides: Partial<ResourcesMasterApi> = {},
): ResourcesMasterApi =>
  ({
    listResources: vi.fn(async () => page([summary('r1', 'Cable UTP')])),
    searchResources: vi.fn(async () => page([])),
    getResourceDetail: vi.fn(async () => null),
    createResource: vi.fn(),
    updateResource: vi.fn(),
    activateResource: vi.fn(),
    deactivateResource: vi.fn(),
    listContextClasses: vi.fn(async () => ({
      items: [
        {
          id: 'class-1',
          clave: 'MATERIAL',
          nombre: 'Material',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
        },
      ],
      continuationCursor: null,
      isExhausted: true,
    })),
    listContextFamilies: vi.fn(async () => ({
      items: [
        {
          id: 'family-1',
          claseRecursoId: 'class-1',
          clave: 'CABLE',
          nombre: 'Cable',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
        },
      ],
      continuationCursor: null,
      isExhausted: true,
    })),
    listContextTypes: vi.fn(async () => ({
      items: [
        {
          id: 'type-1',
          familiaRecursoId: 'family-1',
          clave: 'UTP',
          nombre: 'UTP',
          activo: true,
          revision: 1,
          effective: true,
          effectiveReasons: [],
          aggregateStatus: 'CLEAN',
          violations: [],
        },
      ],
      continuationCursor: null,
      isExhausted: true,
    })),
    ...overrides,
  }) as ResourcesMasterApi

const factory = vi.hoisted(() => vi.fn())
const screenSource = readFileSync(
  join(
    process.cwd(),
    'src/features/resources-master/ResourcesMasterScreen.tsx',
  ),
  'utf8',
)
const screenAst = ts.createSourceFile(
  'ResourcesMasterScreen.tsx',
  screenSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
)

const reactEffectBindings = new Set<string>()
const reactNamespaces = new Set<string>()
for (const statement of screenAst.statements) {
  if (
    !ts.isImportDeclaration(statement) ||
    !ts.isStringLiteral(statement.moduleSpecifier) ||
    statement.moduleSpecifier.text !== 'react'
  ) {
    continue
  }
  const importClause = statement.importClause
  if (importClause?.name) reactNamespaces.add(importClause.name.text)
  const bindings = importClause?.namedBindings
  if (bindings && ts.isNamespaceImport(bindings)) {
    reactNamespaces.add(bindings.name.text)
  }
  if (!bindings || !ts.isNamedImports(bindings)) continue
  for (const element of bindings.elements) {
    if ((element.propertyName?.text ?? element.name.text) === 'useEffect') {
      reactEffectBindings.add(element.name.text)
    }
  }
}

const isReactEffectCall = (node: ts.CallExpression) =>
  (ts.isIdentifier(node.expression) &&
    reactEffectBindings.has(node.expression.text)) ||
  (ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'useEffect' &&
    ts.isIdentifier(node.expression.expression) &&
    reactNamespaces.has(node.expression.expression.text))

const isInside = (node: ts.Node, ancestor: ts.Node) => {
  for (
    let current: ts.Node | undefined = node.parent;
    current;
    current = current.parent
  ) {
    if (current === ancestor) return true
  }
  return false
}

const clients: QueryClient[] = []

const render = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(client)
  return {
    ...baseRender(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    ),
    client,
  }
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
})

vi.mock('../../src/features/resources-master/resourcesMaster.api', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/features/resources-master/resourcesMaster.api')
  >('../../src/features/resources-master/resourcesMaster.api')
  return { ...actual, createResourcesMasterConvexApi: factory }
})

describe('ResourcesMasterScreen connected read wiring', () => {
  it('synchronizes latest criteria refs only from committed effects', () => {
    expect(screenAst.parseDiagnostics).toEqual([])
    const effectCallbacks = new Set<ts.FunctionLikeDeclaration>()
    const assignments: ts.BinaryExpression[] = []
    const latestValues = new Map([
      ['searchTextRef', 'searchText'],
      ['hierarchyFiltersRef', 'hierarchyFilters'],
    ])

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && isReactEffectCall(node)) {
        const [callback] = node.arguments
        if (callback && ts.isFunctionLike(callback))
          effectCallbacks.add(callback)
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        ts.isIdentifier(node.left.expression) &&
        node.left.name.text === 'current' &&
        latestValues.has(node.left.expression.text)
      ) {
        assignments.push(node)
      }
      ts.forEachChild(node, visit)
    }
    visit(screenAst)

    for (const [refName, latestValue] of latestValues) {
      const refAssignments = assignments.filter(
        (assignment) =>
          ts.isIdentifier(assignment.left.expression) &&
          assignment.left.expression.text === refName,
      )
      expect(refAssignments).toHaveLength(1)
      const [assignment] = refAssignments
      expect(ts.isIdentifier(assignment.right)).toBe(true)
      if (!ts.isIdentifier(assignment.right)) continue
      expect(assignment.right.text).toBe(latestValue)
      expect(
        [...effectCallbacks].some((callback) => isInside(assignment, callback)),
      ).toBe(true)
    }
  })

  it('lists resources on mount through an isolated Query client', async () => {
    const api = fakeApi()
    factory.mockReturnValue(api)
    const { client } = render(<ResourcesMasterScreen />)

    expect(await screen.findByText('Cable UTP')).toBeVisible()
    expect(api.listResources).toHaveBeenCalledWith({
      lifecycle: 'ACTIVE',
      cursor: undefined,
      pageSize: 20,
    })
    expect(
      client.getQueryCache().find({
        queryKey: ['resources-master', 'list', '', 'all', null],
        exact: true,
      }),
    ).toBeDefined()
  })

  it('never offers a status selector — the list is always active-only', async () => {
    const api = fakeApi()
    factory.mockReturnValue(api)
    render(<ResourcesMasterScreen />)

    await screen.findByText('Cable UTP')
    expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument()
  })

  it('separates the labeled list work card from the resource controls', async () => {
    const api = fakeApi()
    factory.mockReturnValue(api)
    render(<ResourcesMasterScreen />)

    const workCard = await screen.findByRole('region', {
      name: 'Listado de recursos',
    })
    expect(workCard).toContainElement(screen.getByRole('table'))
    expect(workCard).toHaveClass('rounded-lg', 'border-border', 'bg-surface')
    const pageHeader = screen
      .getByRole('heading', { name: 'Recursos maestros' })
      .closest('header')
    expect(pageHeader).toHaveClass('md:grid-cols-3')
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveAttribute(
      'data-spatial-id',
      'resources.search',
    )
  })

  it('searches by name instead of listing once text is entered', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const api = fakeApi({
        searchResources: vi.fn(async () =>
          page([summary('r2', 'Motor 1/2 HP')]),
        ),
      })
      factory.mockReturnValue(api)
      render(<ResourcesMasterScreen />)
      await act(async () => {
        await Promise.resolve()
      })

      fireEvent.change(screen.getByLabelText('Buscar'), {
        target: { value: 'Motor' },
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })

      expect(api.searchResources).toHaveBeenCalledWith({
        lifecycle: 'ACTIVE',
        searchText: 'Motor',
        cursor: undefined,
        pageSize: 20,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('starts mount once, debounces non-empty search once, and clears immediately', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const api = fakeApi()
      factory.mockReturnValue(api)
      render(<ResourcesMasterScreen />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(api.listResources).toHaveBeenCalledTimes(1)

      fireEvent.change(screen.getByLabelText('Buscar'), {
        target: { value: ' Motor ' },
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(249)
      })
      expect(api.searchResources).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(api.searchResources).toHaveBeenCalledTimes(1)
      expect(api.searchResources).toHaveBeenLastCalledWith({
        lifecycle: 'ACTIVE',
        searchText: 'Motor',
        cursor: undefined,
        pageSize: 20,
      })

      fireEvent.change(screen.getByLabelText('Buscar'), {
        target: { value: '' },
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(api.listResources).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('restarts once with the deepest hierarchy filter and cancels a pending search', async () => {
    const api = fakeApi()
    factory.mockReturnValue(api)
    render(<ResourcesMasterScreen />)

    await screen.findByRole('button', { name: 'Material' })
    await waitFor(() => expect(api.listResources).toHaveBeenCalledTimes(1))

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.change(screen.getByLabelText('Buscar'), {
        target: { value: ' Motor ' },
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(api.searchResources).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Material' }))
      await act(async () => {
        await Promise.resolve()
      })
      expect(api.searchResources).toHaveBeenCalledTimes(1)
      expect(api.searchResources).toHaveBeenLastCalledWith({
        lifecycle: 'ACTIVE',
        claseRecursoId: 'class-1',
        searchText: 'Motor',
        cursor: undefined,
        pageSize: 20,
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(150)
      })
      expect(api.searchResources).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies the selected class as the one server filter to list and search', async () => {
    const api = fakeApi({
      searchResources: vi.fn(async () =>
        page([summary('r2', 'Cable industrial')]),
      ),
    })
    factory.mockReturnValue(api)
    render(<ResourcesMasterScreen />)

    await screen.findByText('Material')
    fireEvent.click(screen.getByRole('button', { name: 'Material' }))
    await waitFor(() =>
      expect(api.listResources).toHaveBeenLastCalledWith({
        lifecycle: 'ACTIVE',
        claseRecursoId: 'class-1',
        cursor: undefined,
        pageSize: 20,
      }),
    )

    expect(await screen.findByText('Cable')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Cable' }))
    expect(await screen.findByText('UTP')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'UTP' }))
    await waitFor(() =>
      expect(api.listResources).toHaveBeenLastCalledWith({
        lifecycle: 'ACTIVE',
        tipoRecursoId: 'type-1',
        cursor: undefined,
        pageSize: 20,
      }),
    )

    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'Cable' },
    })
    await waitFor(() =>
      expect(api.searchResources).toHaveBeenCalledWith({
        lifecycle: 'ACTIVE',
        tipoRecursoId: 'type-1',
        searchText: 'Cable',
        cursor: undefined,
        pageSize: 20,
      }),
    )
  })

  it('loads the next page on demand without dropping the first page', async () => {
    const api = fakeApi({
      listResources: vi
        .fn()
        .mockResolvedValueOnce(
          page([summary('r1', 'Cable UTP')], false, 'cursor-2'),
        )
        .mockResolvedValueOnce(page([summary('r2', 'Motor 1/2 HP')], true)),
    })
    factory.mockReturnValue(api)
    const user = userEvent.setup()
    render(<ResourcesMasterScreen />)

    await screen.findByText('Cable UTP')
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))

    expect(await screen.findByText('Motor 1/2 HP')).toBeVisible()
    expect(screen.getByText('Cable UTP')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Cargar más…' }),
    ).not.toBeInTheDocument()
  })

  it('disables continuation while the next page is loading', async () => {
    let resolveContinuation:
      | ((value: ReturnType<typeof page>) => void)
      | undefined
    const continuation = new Promise<ReturnType<typeof page>>((resolve) => {
      resolveContinuation = resolve
    })
    const api = fakeApi({
      listResources: vi
        .fn()
        .mockResolvedValueOnce(
          page([summary('r1', 'Cable UTP')], false, 'cursor-2'),
        )
        .mockImplementationOnce(() => continuation),
    })
    factory.mockReturnValue(api)
    const user = userEvent.setup()
    render(<ResourcesMasterScreen />)

    await screen.findByText('Cable UTP')
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Cargar más…' }),
      ).toBeDisabled(),
    )

    await act(async () => {
      resolveContinuation?.(page([summary('r2', 'Motor 1/2 HP')]))
      await continuation
    })
  })

  it('retains deduped rows through a partial error and retries its cursor', async () => {
    const api = fakeApi({
      listResources: vi
        .fn()
        .mockResolvedValueOnce(
          page([summary('r1', 'Cable UTP')], false, 'cursor-2'),
        )
        .mockRejectedValueOnce(new Error('private continuation detail'))
        .mockResolvedValueOnce(
          page(
            [summary('r1', 'Cable UTP'), summary('r2', 'Motor 1/2 HP')],
            true,
          ),
        ),
    })
    factory.mockReturnValue(api)
    const user = userEvent.setup()
    render(<ResourcesMasterScreen />)

    expect(await screen.findByText('Cable UTP')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cargar más…' }))
    expect(
      await screen.findByText('No se pudo cargar la página siguiente.'),
    ).toBeVisible()
    expect(screen.getByText('Cable UTP')).toBeVisible()
    expect(document.body.textContent).not.toContain(
      'private continuation detail',
    )

    await user.click(
      screen.getByRole('button', { name: 'Reintentar continuación' }),
    )
    expect(await screen.findByText('Motor 1/2 HP')).toBeVisible()
    expect(screen.getAllByText('Cable UTP')).toHaveLength(1)
    expect(api.listResources.mock.calls.slice(1)).toEqual([
      [{ lifecycle: 'ACTIVE', pageSize: 20, cursor: 'cursor-2' }],
      [{ lifecycle: 'ACTIVE', pageSize: 20, cursor: 'cursor-2' }],
    ])
  })

  it('confirms an exhausted empty result instead of guessing', async () => {
    const api = fakeApi({ listResources: vi.fn(async () => page([])) })
    factory.mockReturnValue(api)
    render(<ResourcesMasterScreen />)

    expect(
      await screen.findByText('No hay recursos para este filtro.'),
    ).toBeVisible()
  })

  it('surfaces a retry action after the initial load keeps failing', async () => {
    const api = fakeApi({
      listResources: vi
        .fn()
        .mockRejectedValueOnce(new Error('private transport detail'))
        .mockRejectedValueOnce(new Error('private transport detail'))
        .mockResolvedValueOnce(page([summary('r1', 'Cable UTP')])),
    })
    factory.mockReturnValue(api)
    const user = userEvent.setup()
    render(<ResourcesMasterScreen />)

    expect(
      await screen.findByText('No se pudieron cargar los recursos.'),
    ).toBeVisible()
    expect(document.body.textContent).not.toContain('private transport detail')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Cable UTP')).toBeVisible()
  })
})

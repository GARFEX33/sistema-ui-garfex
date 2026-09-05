import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResourcesMasterScreen } from '../../src/features/resources-master/ResourcesMasterScreen'
import type { ResourcesMasterApi } from '../../src/features/resources-master/resourcesMaster.api'

const factory = vi.hoisted(() => vi.fn())

vi.mock('../../src/features/resources-master/resourcesMaster.api', () => ({
  createResourcesMasterConvexApi: factory,
}))

vi.mock('../../src/features/resources-master/CrearRecursoSurface', () => ({
  CrearRecursoSurface: ({ onCreated }: { onCreated?: () => void }) => (
    <button type="button" onClick={onCreated}>
      Confirmar creación
    </button>
  ),
}))

const page = (nombre: string) => ({
  page: [
    {
      id: nombre,
      identificadorTecnico: `REC-${nombre}`,
      nombre,
      tipoRecursoId: 'type-1',
      unidadId: 'unit-1',
      activo: true,
      revision: 1,
      classificationStatus: { state: 'EFFECTIVE' as const, reasons: [] },
    },
  ],
  isDone: true,
  continueCursor: '',
})

const api = (): ResourcesMasterApi =>
  ({
    listResources: vi.fn(async () => page('Recurso activo')),
    searchResources: vi.fn(async () => page('Búsqueda activa')),
    listContextClasses: vi.fn(async () => ({
      items: [],
      continuationCursor: null,
      isExhausted: true,
    })),
    listContextFamilies: vi.fn(),
    listContextTypes: vi.fn(),
  }) as ResourcesMasterApi

const clients: QueryClient[] = []
const renderScreen = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  clients.push(client)
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  }
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  factory.mockReset()
})

describe('ResourcesMasterScreen post-create refresh', () => {
  it('refetches only the active observed query after confirmed creation', async () => {
    const resourceApi = api()
    factory.mockReturnValue(resourceApi)
    const { client } = renderScreen(<ResourcesMasterScreen />)
    const differentKey = [
      'resources-master',
      'list',
      'other',
      'all',
      null,
    ] as const
    const differentData = {
      pages: [page('Otro recurso')],
      pageParams: [undefined],
    }
    client.setQueryData(differentKey, differentData)

    expect(await screen.findByText('Recurso activo')).toBeVisible()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Confirmar creación' }))

    await waitFor(() =>
      expect(resourceApi.listResources).toHaveBeenCalledTimes(2),
    )
    const differentQuery = client.getQueryCache().find({
      queryKey: differentKey,
      exact: true,
    })
    expect(differentQuery?.state.data).toBe(differentData)
    expect(differentQuery?.state.fetchStatus).toBe('idle')
  })
})

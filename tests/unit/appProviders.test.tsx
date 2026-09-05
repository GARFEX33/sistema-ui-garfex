import { render, screen } from '@testing-library/react'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../src/app/providers/AppProviders'

const routerProvider = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  RouterProvider: ({ router }: { router: unknown }) => {
    const queryClient = useQueryClient()
    routerProvider(router, queryClient)
    return <output data-testid="router-composition">Router available</output>
  },
}))

const router = {} as Parameters<typeof AppProviders>[0]['router']

describe('AppProviders', () => {
  beforeEach(() => {
    routerProvider.mockClear()
  })

  it('keeps Router composition inside the Query client provider', () => {
    render(<AppProviders router={router} />)

    expect(screen.getByTestId('router-composition')).toHaveTextContent(
      'Router available',
    )
    expect(routerProvider).toHaveBeenLastCalledWith(
      router,
      expect.any(QueryClient),
    )
  })

  it('keeps one client through rerenders and creates another for a new mount', () => {
    const firstMount = render(<AppProviders router={router} />)
    const firstClient = routerProvider.mock.lastCall?.[1]

    firstMount.rerender(<AppProviders router={router} />)
    expect(screen.getByTestId('router-composition')).toHaveTextContent(
      'Router available',
    )
    expect(routerProvider.mock.lastCall?.[1]).toBe(firstClient)

    firstMount.unmount()
    render(<AppProviders router={router} />)
    expect(routerProvider.mock.lastCall?.[1]).not.toBe(firstClient)
  })
})

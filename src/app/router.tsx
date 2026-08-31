import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

type RouterHistory = NonNullable<Parameters<typeof createRouter>[0]['history']>

export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

import type { createAppRouter } from '../router'
import { RouterProvider } from '@tanstack/react-router'

type AppRouter = ReturnType<typeof createAppRouter>

export function AppProviders({ router }: { router: AppRouter }) {
  return <RouterProvider router={router} />
}

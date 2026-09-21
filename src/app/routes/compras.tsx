import { createFileRoute } from '@tanstack/react-router'
import { ComprasEntry } from '../../features/compras/ComprasEntry'

export const Route = createFileRoute('/compras')({
  component: ComprasEntry,
})

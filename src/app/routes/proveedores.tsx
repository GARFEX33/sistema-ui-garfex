import { createFileRoute } from '@tanstack/react-router'
import { ProveedoresEntry } from '../../features/proveedores/ProveedoresEntry'

export const Route = createFileRoute('/proveedores')({
  component: ProveedoresEntry,
})

import { createFileRoute } from '@tanstack/react-router'
import { OperationsInboxEntry } from '../../features/operations-inbox/OperationsInboxEntry'

export const Route = createFileRoute('/bandeja')({
  component: OperationsInboxEntry,
})

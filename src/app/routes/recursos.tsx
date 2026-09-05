import { createFileRoute } from '@tanstack/react-router'
import { ResourcesMasterEntry } from '../../features/resources-master/ResourcesMasterEntry'

export const Route = createFileRoute('/recursos')({
  component: ResourcesMasterEntry,
})

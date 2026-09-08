import { ResourcesMasterScreen } from './ResourcesMasterScreen'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'

export function ResourcesMasterEntry() {
  const creationOwnership: ResourceCreationEvaluationOwnership | null = null

  return <ResourcesMasterScreen creationOwnership={creationOwnership} />
}

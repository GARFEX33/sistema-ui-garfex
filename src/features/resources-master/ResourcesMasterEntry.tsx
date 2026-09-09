import { ResourcesMasterScreen } from './ResourcesMasterScreen'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'

export function ResourcesMasterEntry() {
  const creationOwnership: ResourceCreationEvaluationOwnership = {
    kind: 'GLOBAL',
  }

  return <ResourcesMasterScreen creationOwnership={creationOwnership} />
}

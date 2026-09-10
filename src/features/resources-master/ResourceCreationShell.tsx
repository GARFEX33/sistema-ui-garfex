import type { ReactNode } from 'react'
import { DialogHeading } from '../../shared/ui/Dialog'

export function ResourceCreationShell({
  rail,
  stageHeading,
}: {
  rail: ReactNode
  stageHeading?: string
}) {
  return (
    <>
      <DialogHeading title="Creador de recursos" hint="" />
      {rail}
      {stageHeading && <h3 className="mb-4 mt-0 text-lg">{stageHeading}</h3>}
    </>
  )
}

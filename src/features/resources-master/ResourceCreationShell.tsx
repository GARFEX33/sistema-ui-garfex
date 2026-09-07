import { DialogHeading } from '../../shared/ui/Dialog'

export function ResourceCreationShell({
  stageHeading,
}: {
  stageHeading?: string
}) {
  return (
    <>
      <DialogHeading title="Creador de recursos" />
      {stageHeading && <h3 className="mb-4 mt-0 text-lg">{stageHeading}</h3>}
    </>
  )
}

import { StagedSearchSelector } from './StagedSearchSelector'
import { mapHierarchyWindowToSelectorLoadState } from './resourceCreationWizard.types'
import type { WizardHierarchyView } from './resourceCreationWizard.types'
import type {
  ResourceContextClassRestItem,
  ResourceContextFamilyRestItem,
  ResourceContextTypeRestItem,
  ResourceContextUnitRestItem,
} from './resourcesMaster.types'

type ResourceCreationContextStageProps = {
  view: WizardHierarchyView
  onConfirmClass: (item: ResourceContextClassRestItem) => void
  onConfirmFamily: (item: ResourceContextFamilyRestItem) => void
  onConfirmType: (item: ResourceContextTypeRestItem) => void
  onConfirmUnit: (item: ResourceContextUnitRestItem) => void
}

const hierarchyKey = (item: { id: string }) => item.id
const hierarchyName = (item: { name: string }) => item.name
const unitLabel = (unit: ResourceContextUnitRestItem) =>
  unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name

export function ResourceCreationContextStage({
  view,
  onConfirmClass,
  onConfirmFamily,
  onConfirmType,
  onConfirmUnit,
}: ResourceCreationContextStageProps) {
  return (
    <>
      <div hidden={view.stage !== 'class'}>
        <StagedSearchSelector
          label="Clase"
          items={view.classes.state.items}
          itemKey={hierarchyKey}
          itemName={hierarchyName}
          confirmedKey={view.selection.classId}
          loadState={mapHierarchyWindowToSelectorLoadState(view.classes.state)}
          onConfirm={onConfirmClass}
          onLoadMore={view.classes.onLoadMore}
          onRetry={view.classes.onRetry}
        />
      </div>
      <div hidden={view.stage !== 'family'}>
        <StagedSearchSelector
          label="Familia"
          items={view.families.state.items}
          itemKey={hierarchyKey}
          itemName={hierarchyName}
          confirmedKey={view.selection.familyId}
          loadState={mapHierarchyWindowToSelectorLoadState(view.families.state)}
          onConfirm={onConfirmFamily}
          onLoadMore={view.families.onLoadMore}
          onRetry={view.families.onRetry}
        />
      </div>
      <div hidden={view.stage !== 'type'}>
        <StagedSearchSelector
          label="Tipo"
          items={view.types.state.items}
          itemKey={hierarchyKey}
          itemName={hierarchyName}
          confirmedKey={view.selection.typeId}
          loadState={mapHierarchyWindowToSelectorLoadState(view.types.state)}
          onConfirm={onConfirmType}
          onLoadMore={view.types.onLoadMore}
          onRetry={view.types.onRetry}
        />
      </div>
      <div hidden={view.stage !== 'unit'}>
        <StagedSearchSelector
          label="Unidad"
          items={view.units.state.items}
          itemKey={hierarchyKey}
          itemName={unitLabel}
          renderItem={unitLabel}
          confirmedKey={view.selection.unitId}
          loadState={mapHierarchyWindowToSelectorLoadState(view.units.state)}
          onConfirm={onConfirmUnit}
          onLoadMore={view.units.onLoadMore}
          onRetry={view.units.onRetry}
        />
      </div>
    </>
  )
}

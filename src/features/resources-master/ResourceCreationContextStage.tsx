import { StagedSearchSelector } from './StagedSearchSelector'
import type { useResourceCreationFlow } from './useResourceCreationFlow'

type ResourceCreationFlow = ReturnType<typeof useResourceCreationFlow>

type ResourceCreationContextStageProps = {
  flow: ResourceCreationFlow
  onConfirmClass: (item: ResourceCreationFlow['classes'][number]) => void
  onConfirmFamily: (item: ResourceCreationFlow['families'][number]) => void
  onConfirmType: (item: ResourceCreationFlow['types'][number]) => void
  onConfirmUnit: (item: ResourceCreationFlow['units'][number]) => void
}

const unitLabel = (unit: { nombre: string; simbolo?: string }) =>
  unit.simbolo ? `${unit.nombre} (${unit.simbolo})` : unit.nombre

export function ResourceCreationContextStage({
  flow,
  onConfirmClass,
  onConfirmFamily,
  onConfirmType,
  onConfirmUnit,
}: ResourceCreationContextStageProps) {
  const showUnitSelector = flow.state.stage.kind === 'unit'

  return (
    <>
      <div hidden={flow.state.stage.kind !== 'class'}>
        <StagedSearchSelector
          label="Clase"
          items={flow.classes}
          itemKey={(item) => flow.classKey(item.id)}
          itemName={(item) => item.nombre}
          loadState={flow.classLoadState}
          onConfirm={onConfirmClass}
          onLoadMore={() => void flow.continueClasses()}
          onRetry={() => void flow.retryClasses()}
        />
      </div>
      <div hidden={flow.state.stage.kind !== 'family'}>
        <StagedSearchSelector
          label="Familia"
          items={flow.families}
          itemKey={(item) => flow.classKey(item.id)}
          itemName={(item) => item.nombre}
          confirmedKey={
            flow.state.draft.hierarchy.familyItem
              ? flow.classKey(flow.state.draft.hierarchy.familyItem.id)
              : null
          }
          loadState={flow.familyLoadState}
          onConfirm={onConfirmFamily}
          onLoadMore={() => void flow.continueFamilies()}
          onRetry={() => void flow.retryFamilies()}
        />
      </div>

      <div hidden={flow.state.stage.kind !== 'type'}>
        <StagedSearchSelector
          label="Tipo"
          items={flow.types}
          itemKey={(item) => flow.classKey(item.id)}
          itemName={(item) => item.nombre}
          confirmedKey={
            flow.state.draft.hierarchy.typeItem
              ? flow.classKey(flow.state.draft.hierarchy.typeItem.id)
              : null
          }
          loadState={flow.typeLoadState}
          onConfirm={onConfirmType}
          onLoadMore={() => void flow.continueTypes()}
          onRetry={() => void flow.retryTypes()}
        />
      </div>

      {showUnitSelector && (
        <StagedSearchSelector
          label="Unidad"
          items={flow.units}
          itemKey={(item) => flow.classKey(item.unidadId)}
          itemName={unitLabel}
          renderItem={unitLabel}
          confirmedKey={
            flow.state.draft.unitId === null
              ? null
              : flow.classKey(flow.state.draft.unitId)
          }
          loadState={flow.unitLoadState}
          onConfirm={onConfirmUnit}
          onLoadMore={() => void flow.continueUnits()}
          onRetry={() => void flow.retryUnits()}
        />
      )}
    </>
  )
}

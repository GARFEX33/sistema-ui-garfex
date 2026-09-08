import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { CreationStageRail, type CreationRailStage } from './CreationStageRail'
import { CreationCommandBar } from './CreationCommandBar'
import { ResourceCreationContractPending } from './ResourceCreationContractPending'
import { ResourceCreationShell } from './ResourceCreationShell'
import { StagedSearchSelector } from './StagedSearchSelector'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import {
  createInitialHierarchySnapshotCapture,
  type InitialResourceHierarchySnapshot,
} from './resourceCreation.model'
import { useResourceCreationFlow } from './useResourceCreationFlow'
import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceCreationEvaluationOwnership,
  ResourceId,
} from './resourcesMaster.types'

const unitLabel = (unit: { nombre: string; simbolo?: string }) =>
  unit.simbolo ? `${unit.nombre} (${unit.simbolo})` : unit.nombre

export interface CrearRecursoSurfaceProps {
  api: ResourcesMasterApi
  ownership: ResourceCreationEvaluationOwnership | null
  initialHierarchySnapshot?: InitialResourceHierarchySnapshot
  onCreated?: () => void
}

const key = (id: ResourceId) => String(id)

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable], [role="textbox"]',
    ),
  )

export function CrearRecursoSurface({
  api,
  ownership,
  initialHierarchySnapshot,
}: CrearRecursoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initialHierarchySnapshotCaptureRef = useRef(
    createInitialHierarchySnapshotCapture(initialHierarchySnapshot),
  )
  initialHierarchySnapshotCaptureRef.current.receive(initialHierarchySnapshot)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const { registerAction, registerOverlay } = useKeyboardController()

  const [step, setStep] = useState<1 | 'contract-pending'>(1)
  const [railStageOverride, setRailStageOverride] = useState<Exclude<
    CreationRailStage,
    'contract-pending'
  > | null>(null)
  const [classId, setClassId] = useState<ResourceId | null>(null)
  const [familyId, setFamilyId] = useState<ResourceId | null>(null)
  const [typeId, setTypeId] = useState<ResourceId | null>(null)
  const flow = useResourceCreationFlow(api)
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current =
        opener?.isConnected &&
        opener !== document.body &&
        opener !== document.documentElement
          ? opener
          : null
      const prefix = initialHierarchySnapshotCaptureRef.current.captureOnOpen()
      flow.begin(prefix)
      setStep(1)
      setRailStageOverride(null)
      setClassId(prefix.classItem?.id ?? null)
      setFamilyId(prefix.familyItem?.id ?? null)
      setTypeId(null)
      if (prefix.typeItem) setTypeId(prefix.typeItem.id)
      setIsOpen(true)
    },
    [flow],
  )

  const action = useMemo(
    () => ({
      id: 'resources.new-resource' as const,
      surface: 'recursos' as const,
      key: 'n',
      label: 'Nuevo recurso',
      root: () => triggerRef.current,
      isAvailable: () =>
        !isOpenRef.current && isValidFocusCandidate(triggerRef.current),
      run: open,
    }),
    [open],
  )

  useEffect(() => registerAction(action), [action, registerAction])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])

  useEffect(() => {
    if (!isOpen || step !== 1) return
    const labelByStage = {
      class: 'Clase',
      family: 'Familia',
      type: 'Tipo',
      unit: 'Unidad natural',
    }
    const label =
      flow.state.stage.kind === 'contract-pending'
        ? null
        : labelByStage[flow.state.stage.kind]
    if (!label) return
    dialogRef.current
      ?.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)
      ?.focus()
  }, [flow.state.stage.kind, isOpen, step])

  useEffect(() => {
    let delayedRestore: number | null = null
    if (isOpen) {
      wasOpen.current = true
    } else if (wasOpen.current) {
      const opener = openerRef.current
      const fallbacks = [
        () => triggerRef.current,
        () =>
          document.querySelector<HTMLElement>(
            '[data-spatial-id="sidebar.recursos"]',
          ),
      ]
      const restoreFocus = () => restoreFocusNextFrame(opener, fallbacks)
      restoreFocus()
      delayedRestore = window.setTimeout(() => {
        if (!isOpenRef.current) restoreFocus()
      }, 50)
      openerRef.current = null
      wasOpen.current = false
    }
    return () => {
      if (delayedRestore !== null) window.clearTimeout(delayedRestore)
    }
  }, [isOpen])

  const selectClass = (item: ResourceContextClassItem) => {
    const id = item.id
    flow.confirmClass(item)
    setRailStageOverride(null)
    if (classId !== null && key(classId) === key(id)) return
    setClassId(id)
    setFamilyId(null)
    setTypeId(null)
  }

  const selectFamily = (item: ResourceContextFamilyItem) => {
    flow.confirmFamily(item)
    setRailStageOverride(null)
    if (familyId !== null && key(familyId) === key(item.id)) return
    setFamilyId(item.id)
    setTypeId(null)
  }

  const selectType = (item: ResourceContextTypeItem) => {
    const id = item.id
    flow.confirmType(item)
    setRailStageOverride(null)
    if (typeId !== null && key(typeId) === key(id)) return
    setTypeId(id)
  }

  const returnToUnit = () => {
    const typeItem = flow.state.draft.hierarchy.typeItem
    if (typeItem) flow.confirmType(typeItem)
  }

  const backToContext = () => {
    setRailStageOverride(null)
    returnToUnit()
    setStep(1)
  }

  const selectedClassName = flow.state.draft.hierarchy.classItem?.nombre ?? ''
  const selectedFamilyName = flow.state.draft.hierarchy.familyItem?.nombre ?? ''
  const selectedTypeName = flow.state.draft.hierarchy.typeItem?.nombre ?? ''
  const selectedUnit = flow.units.find(
    (unit) =>
      flow.state.draft.unitId !== null &&
      key(unit.unidadId) === key(flow.state.draft.unitId),
  )
  const preferredUnitKey =
    flow.units.find((unit) => unit.principal)?.unidadId ??
    flow.units.find((unit) => unit.selected)?.unidadId ??
    null
  const showUnitSelector = step === 1 && flow.state.stage.kind === 'unit'
  const confirmUnit = (candidate: (typeof flow.units)[number]) => {
    if (
      flow.unitLoadState.status !== 'ready' &&
      flow.unitLoadState.status !== 'loading-more'
    )
      return
    flow.confirmUnit(candidate)
    setStep('contract-pending')
  }
  const currentRailStage: CreationRailStage =
    step === 'contract-pending'
      ? 'contract-pending'
      : (railStageOverride ??
        (classId === null
          ? 'class'
          : familyId === null
            ? 'family'
            : typeId === null
              ? 'type'
              : 'unit'))
  const navigateRailStage = (
    stage: Exclude<CreationRailStage, 'contract-pending'>,
  ) => {
    if (stage === 'class') {
      setRailStageOverride(stage)
      flow.enterClass()
      return
    }
    if (stage === 'family') {
      setRailStageOverride(stage)
      flow.enterFamily()
      return
    }
    if (stage === 'type') {
      setRailStageOverride(stage)
      flow.enterType()
      return
    }
    setRailStageOverride(null)
    returnToUnit()
  }

  const moveBack = () => {
    if (step === 'contract-pending') {
      backToContext()
      return true
    }
    if (flow.state.stage.kind === 'unit') {
      navigateRailStage('type')
      return true
    }
    if (flow.state.stage.kind === 'type') {
      navigateRailStage('family')
      return true
    }
    if (flow.state.stage.kind === 'family') {
      navigateRailStage('class')
      return true
    }
    return false
  }

  return (
    <div className="resources-create-surface">
      <Button
        ref={triggerRef}
        aria-label="Nuevo recurso"
        onPress={() => open(triggerRef.current)}
      >
        <span>Nuevo recurso</span>
        <kbd>N</kbd>
      </Button>

      <Dialog
        ref={dialogRef}
        isOpen={isOpen}
        onOpenChange={(openState) => !openState && close()}
        aria-label="Creador de recursos"
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.defaultPrevented || event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              if (!moveBack()) close()
              return
            }
            if (
              event.key !== 'ArrowLeft' ||
              event.ctrlKey ||
              event.altKey ||
              event.metaKey ||
              event.shiftKey ||
              isEditableTarget(event.target)
            )
              return
            if (moveBack()) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        >
          <ResourceCreationShell
            rail={
              <CreationStageRail
                currentStage={currentRailStage}
                onNavigate={navigateRailStage}
                selections={{
                  className: selectedClassName,
                  familyName: selectedFamilyName,
                  typeName: selectedTypeName,
                  unitName: selectedUnit?.nombre ?? '',
                }}
              />
            }
            stageHeading={
              step === 1
                ? showUnitSelector
                  ? 'Elegí una Unidad natural'
                  : flow.state.stage.kind === 'class'
                    ? 'Elegí una Clase'
                    : 'Completá el contexto'
                : undefined
            }
          />
          <div className="resources-dialog-content">
            {step === 1 && (
              <>
                <div hidden={flow.state.stage.kind !== 'class'}>
                  <StagedSearchSelector
                    label="Clase"
                    items={flow.classes}
                    itemKey={(item) => flow.classKey(item.id)}
                    itemName={(item) => item.nombre}
                    loadState={flow.classLoadState}
                    onConfirm={selectClass}
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
                        ? flow.classKey(
                            flow.state.draft.hierarchy.familyItem.id,
                          )
                        : null
                    }
                    loadState={flow.familyLoadState}
                    onConfirm={selectFamily}
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
                    onConfirm={selectType}
                    onLoadMore={() => void flow.continueTypes()}
                    onRetry={() => void flow.retryTypes()}
                  />
                </div>

                {showUnitSelector && (
                  <StagedSearchSelector
                    label="Unidad natural"
                    items={flow.units}
                    itemKey={(item) => flow.classKey(item.unidadId)}
                    itemName={unitLabel}
                    renderItem={unitLabel}
                    confirmedKey={
                      flow.state.draft.unitId === null
                        ? null
                        : flow.classKey(flow.state.draft.unitId)
                    }
                    preferredActiveKey={
                      preferredUnitKey === null
                        ? null
                        : flow.classKey(preferredUnitKey)
                    }
                    loadState={flow.unitLoadState}
                    onConfirm={confirmUnit}
                    onLoadMore={() => void flow.continueUnits()}
                    onRetry={() => void flow.retryUnits()}
                  />
                )}
              </>
            )}

            {step === 'contract-pending' && (
              <ResourceCreationContractPending ownership={ownership} />
            )}
          </div>
          <CreationCommandBar
            stage={step === 'contract-pending' ? 'contract-pending' : 'context'}
          >
            {step === 1 && (
              <>
                <Button variant="outline" onPress={close} type="button">
                  Cancelar
                </Button>
                {flow.state.stage.kind !== 'unit' && (
                  <Button type="button" isDisabled>
                    Siguiente
                  </Button>
                )}
              </>
            )}
            {step === 'contract-pending' && (
              <Button variant="outline" onPress={backToContext} type="button">
                Volver
              </Button>
            )}
          </CreationCommandBar>
        </div>
      </Dialog>
    </div>
  )
}

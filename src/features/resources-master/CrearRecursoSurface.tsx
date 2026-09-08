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
import { ResourceCreationAttributesStage } from './ResourceCreationAttributesStage'
import { ResourceCreationContextStage } from './ResourceCreationContextStage'
import { ResourceCreationContractPending } from './ResourceCreationContractPending'
import { ResourceCreationShell } from './ResourceCreationShell'
import {
  projectResourceCreationAttributeSelectionView,
  projectResourceCreationAttributeView,
  type ResourceCreationAttributeSelectionViewInput,
} from './resourceCreation.attributeView'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import {
  createInitialHierarchySnapshotCapture,
  type InitialResourceHierarchySnapshot,
} from './resourceCreation.model'
import { useResourceCreationFlow } from './useResourceCreationFlow'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'

export interface CrearRecursoSurfaceProps {
  api: ResourcesMasterApi
  ownership: ResourceCreationEvaluationOwnership | null
  initialHierarchySnapshot?: InitialResourceHierarchySnapshot
  onCreated?: () => void
}

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
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const { registerAction, registerOverlay } = useKeyboardController()

  const flow = useResourceCreationFlow(api, ownership)
  const stageKind = flow.state.stage.kind
  const isContextStage =
    stageKind === 'class' ||
    stageKind === 'family' ||
    stageKind === 'type' ||
    stageKind === 'unit'
  const isContractPending =
    ownership === null &&
    (stageKind === 'attributes' || stageKind === 'review-pending')
  const attributeStageView = useMemo(() => {
    if (stageKind !== 'attributes') return null
    const projected = projectResourceCreationAttributeView({
      evaluation: flow.evaluation,
      step: flow.attributes.step,
      definition: flow.attributes.definition,
      onOmit: () => {
        if (flow.attributes.step.kind === 'current')
          flow.omitAllowedValue(
            flow.attributes.step.assignment.asignacionAtributoId,
          )
      },
    })
    if (projected.kind === 'complete') return null
    if (projected.kind === 'presenter') return projected.view
    return projectResourceCreationAttributeSelectionView({
      selectionContext: projected,
      allowed: flow.attributes
        .allowedValues as ResourceCreationAttributeSelectionViewInput['allowed'],
      selectionBuckets: flow.state.draft.selectionBuckets,
      onConfirmAllowedValue: flow.confirmAllowedValue,
      onOmit: flow.omitAllowedValue,
    })
  }, [flow, stageKind])
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current =
        opener?.isConnected &&
        opener !== document.body &&
        opener !== document.documentElement
          ? opener
          : null
      flow.begin(initialHierarchySnapshotCaptureRef.current.captureOnOpen())
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
    if (!isOpen || !isContextStage) return
    const labelByStage = {
      class: 'Clase',
      family: 'Familia',
      type: 'Tipo',
      unit: 'Unidad natural',
    }
    dialogRef.current
      ?.querySelector<HTMLInputElement>(
        `input[aria-label="${labelByStage[stageKind]}"]`,
      )
      ?.focus()
  }, [isContextStage, isOpen, stageKind])

  useEffect(() => {
    if (isOpen && stageKind === 'review-pending')
      reviewHeadingRef.current?.focus()
  }, [isOpen, stageKind])

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

  const returnToUnit = () => {
    const typeItem = flow.state.draft.hierarchy.typeItem
    if (typeItem) flow.confirmType(typeItem)
  }

  const navigateRailStage = (stage: 'class' | 'family' | 'type' | 'unit') => {
    if (stage === 'class') return flow.enterClass()
    if (stage === 'family') return flow.enterFamily()
    if (stage === 'type') return flow.enterType()
    return returnToUnit()
  }
  const moveBack = () => {
    if (stageKind === 'class') return false
    flow.back()
    return true
  }
  const selectedUnit = flow.units.find(
    (unit) =>
      flow.state.draft.unitId !== null &&
      String(unit.unidadId) === String(flow.state.draft.unitId),
  )
  const attributeProgress =
    stageKind === 'attributes' && flow.attributes.step.kind === 'current'
      ? {
          current: flow.attributes.step.position,
          total: flow.attributes.step.total,
        }
      : undefined
  const currentRailStage: CreationRailStage = isContractPending
    ? 'contract-pending'
    : stageKind
  const commandStage = isContractPending
    ? 'contract-pending'
    : isContextStage
      ? 'context'
      : stageKind

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
                attributeProgress={attributeProgress}
                onNavigate={navigateRailStage}
                selections={{
                  className: flow.state.draft.hierarchy.classItem?.nombre ?? '',
                  familyName:
                    flow.state.draft.hierarchy.familyItem?.nombre ?? '',
                  typeName: flow.state.draft.hierarchy.typeItem?.nombre ?? '',
                  unitName: selectedUnit?.nombre ?? '',
                }}
              />
            }
            stageHeading={
              isContextStage
                ? stageKind === 'unit'
                  ? 'Elegí una Unidad natural'
                  : stageKind === 'class'
                    ? 'Elegí una Clase'
                    : 'Completá el contexto'
                : undefined
            }
          />
          <div className="resources-dialog-content">
            {isContextStage && (
              <ResourceCreationContextStage
                flow={flow}
                onConfirmClass={flow.confirmClass}
                onConfirmFamily={flow.confirmFamily}
                onConfirmType={flow.confirmType}
                onConfirmUnit={flow.confirmUnit}
              />
            )}
            {isContractPending && (
              <ResourceCreationContractPending ownership={null} />
            )}
            {stageKind === 'attributes' &&
              !isContractPending &&
              attributeStageView && (
                <ResourceCreationAttributesStage view={attributeStageView} />
              )}
            {stageKind === 'review-pending' && !isContractPending && (
              <section aria-labelledby="resource-review-pending-heading">
                <h2
                  ref={reviewHeadingRef}
                  className="m-0 text-lg"
                  id="resource-review-pending-heading"
                  tabIndex={-1}
                >
                  Revisión pendiente
                </h2>
                <p className="mt-2 text-text-secondary" role="status">
                  La revisión de creación estará disponible próximamente.
                </p>
              </section>
            )}
          </div>
          <CreationCommandBar stage={commandStage}>
            {isContextStage ? (
              <>
                <Button variant="outline" onPress={close} type="button">
                  Cancelar
                </Button>
                {stageKind !== 'unit' && (
                  <Button type="button" isDisabled>
                    Siguiente
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" onPress={moveBack} type="button">
                Volver
              </Button>
            )}
          </CreationCommandBar>
        </div>
      </Dialog>
    </div>
  )
}

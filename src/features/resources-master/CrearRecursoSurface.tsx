import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog } from '../../shared/ui/Dialog'
import { CreationStageRail, type CreationRailStage } from './CreationStageRail'
import { CreationCommandBar } from './CreationCommandBar'
import { ResourceCreationAttributeSequencer } from './ResourceCreationAttributeSequencer'
import { ResourceCreationContextStage } from './ResourceCreationContextStage'
import { ResourceCreationReview } from './ResourceCreationReview'
import { buildResourceCreatedMessage } from './resourceCreationMessages'
import { ResourceCreationShell } from './ResourceCreationShell'
import {
  createInitialWizardState,
  resourceCreationWizardReducer,
} from './resourceCreationWizard.model'
import type { WizardStage } from './resourceCreationWizard.model'
import type { WizardHierarchyView } from './resourceCreationWizard.types'
import { useResourcesHierarchy } from './useResourcesHierarchy'
import { useResourceCreationUnits } from './useResourceCreationUnits'
import { useResourceCreationEffectiveAttributes } from './useResourceCreationEffectiveAttributes'
import { useResourceCreationAttributesEvaluation } from './useResourceCreationAttributesEvaluation'
import { useResourceCreationSubmit } from './useResourceCreationSubmit'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type {
  ResourceContextClassRestItem,
  ResourceContextFamilyRestItem,
  ResourceContextTypeRestItem,
  ResourceContextUnitRestItem,
} from './resourcesMaster.types'
import type { EffectiveAttributesRequest } from '../../shared/catalog/effectiveAttributes.contract'

export interface CrearRecursoSurfaceProps {
  api: ResourcesMasterRestReadApi
  onSuccess?: (message: string) => void
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable], [role="textbox"]',
    ),
  )

const isContextStage = (
  stage: WizardStage,
): stage is 'class' | 'family' | 'type' | 'unit' =>
  stage === 'class' ||
  stage === 'family' ||
  stage === 'type' ||
  stage === 'unit'

const wizardStageOrder: readonly WizardStage[] = [
  'class',
  'family',
  'type',
  'unit',
  'attributes',
  'review',
]

const labelByContextStage = {
  class: 'Clase',
  family: 'Familia',
  type: 'Tipo',
  unit: 'Unidad',
} as const

const unitLabel = (unit: ResourceContextUnitRestItem) =>
  unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name

function ResourceCreationWizardDialog({
  api,
  close,
  onSuccess,
}: {
  api: ResourcesMasterRestReadApi
  close: () => void
  onSuccess?: (message: string) => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const successHandledRef = useRef(false)
  const [state, dispatch] = useReducer(
    resourceCreationWizardReducer,
    undefined,
    createInitialWizardState,
  )
  const [attributeValues, setAttributeValues] = useState<
    Record<string, unknown>
  >({})
  const hierarchy = useResourcesHierarchy(api)
  const unitsState = useResourceCreationUnits(api)
  const submit = useResourceCreationSubmit(api)

  const selectedClass = hierarchy.classes.items.find(
    (item) => item.id === state.selection.classId,
  )
  const selectedFamily = hierarchy.families.items.find(
    (item) => item.id === state.selection.familyId,
  )
  const selectedType = hierarchy.types.items.find(
    (item) => item.id === state.selection.typeId,
  )
  const selectedUnit = unitsState.units.items.find(
    (item) => item.id === state.selection.unitId,
  )

  useEffect(() => {
    setAttributeValues({})
  }, [state.selection.typeId])

  const effectiveAttributesRequest: EffectiveAttributesRequest | null =
    useMemo(() => {
      if (state.stage !== 'attributes' && state.stage !== 'review') return null
      if (!selectedClass || !selectedFamily || !selectedType) return null
      return {
        classCode: selectedClass.code,
        familyCode: selectedFamily.code,
        typeCode: selectedType.code,
      }
    }, [state.stage, selectedClass, selectedFamily, selectedType])

  const effectiveAttributes = useResourceCreationEffectiveAttributes(
    api,
    effectiveAttributesRequest,
  )
  // Re-evaluates applicability against Core once an attribute is confirmed,
  // so a backend rule pairing two equivalent attributes (e.g. a diameter
  // captured as either 1/2" or 13mm, never both) is respected instead of
  // silently letting the sequencer offer both.
  const attributeEvaluation = useResourceCreationAttributesEvaluation(
    effectiveAttributesRequest,
    effectiveAttributes.attributes,
    attributeValues,
  )

  const focusStageInput = useCallback((stage: WizardStage) => {
    if (!isContextStage(stage)) return
    contentRef.current
      ?.querySelector<HTMLInputElement>(
        `input[aria-label="${labelByContextStage[stage]}"]`,
      )
      ?.focus()
  }, [])

  useEffect(() => {
    focusStageInput(state.stage)
  }, [state.stage, focusStageInput])

  const moveBack = () => {
    if (state.stage === 'class') return false
    dispatch({ type: 'BACK' })
    return true
  }

  const navigateRailStage = (stage: 'class' | 'family' | 'type' | 'unit') => {
    const currentIndex = wizardStageOrder.indexOf(state.stage)
    const targetIndex = wizardStageOrder.indexOf(stage)
    if (
      currentIndex === -1 ||
      targetIndex === -1 ||
      targetIndex >= currentIndex
    )
      return
    for (let step = currentIndex; step > targetIndex; step -= 1)
      dispatch({ type: 'BACK' })
  }

  const onConfirmClass = (item: ResourceContextClassRestItem) => {
    hierarchy.selectClass(item.id)
    dispatch({ type: 'CONFIRM_CLASS', classId: item.id })
  }
  const onConfirmFamily = (item: ResourceContextFamilyRestItem) => {
    hierarchy.selectFamily(item.id)
    dispatch({ type: 'CONFIRM_FAMILY', familyId: item.id })
  }
  const onConfirmType = (item: ResourceContextTypeRestItem) => {
    hierarchy.selectType(item.id)
    dispatch({ type: 'CONFIRM_TYPE', typeId: item.id })
  }
  const onConfirmUnit = (item: ResourceContextUnitRestItem) => {
    dispatch({ type: 'CONFIRM_UNIT', unitId: item.id })
  }
  const onAttributeChange = (code: string, value: unknown) =>
    setAttributeValues((current) => ({ ...current, [code]: value }))

  const scope = useMemo(
    () =>
      selectedClass && selectedFamily && selectedType
        ? {
            classCode: selectedClass.code,
            className: selectedClass.name,
            familyCode: selectedFamily.code,
            familyName: selectedFamily.name,
            typeCode: selectedType.code,
            typeName: selectedType.name,
          }
        : null,
    [selectedClass, selectedFamily, selectedType],
  )
  const unit = selectedUnit
    ? {
        code: selectedUnit.code,
        name: selectedUnit.name,
        symbol: selectedUnit.symbol,
      }
    : null

  // Established pattern (see NuevaClaseSurface.tsx's submit()): report the
  // human-readable success message to the parent screen and close the
  // dialog together, once, as soon as the create request succeeds. The ref
  // guard makes the "once" explicit regardless of how many times this
  // effect re-runs while submit.status stays 'success'.
  useEffect(() => {
    if (submit.status !== 'success' || successHandledRef.current) return
    successHandledRef.current = true
    if (scope) onSuccess?.(buildResourceCreatedMessage(scope.typeName))
    close()
  }, [submit.status, scope, onSuccess, close])

  const currentRailStage: CreationRailStage =
    state.stage === 'review' ? 'review-pending' : state.stage
  const stageHeading = isContextStage(state.stage)
    ? state.stage === 'unit'
      ? 'Elegí una Unidad'
      : state.stage === 'class'
        ? 'Elegí una Clase'
        : 'Completá el contexto'
    : undefined

  return (
    <div
      ref={contentRef}
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(event) => {
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
          return
        }
        // No-op on the first stage: the state didn't change, so the
        // stage-change effect above won't refire. A keyboard user who
        // arrowed into the option list still expects ArrowLeft to return
        // them to the search input rather than stranding focus on the
        // option.
        if (isContextStage(state.stage)) {
          event.preventDefault()
          focusStageInput(state.stage)
        }
      }}
    >
      <ResourceCreationShell
        rail={
          <CreationStageRail
            currentStage={currentRailStage}
            onNavigate={navigateRailStage}
            selections={{
              className: selectedClass?.name ?? '',
              familyName: selectedFamily?.name ?? '',
              typeName: selectedType?.name ?? '',
              unitName: selectedUnit ? unitLabel(selectedUnit) : '',
            }}
          />
        }
        stageHeading={stageHeading}
      />
      <div className="resources-dialog-content">
        {isContextStage(state.stage) &&
          (() => {
            const view: WizardHierarchyView = {
              stage: state.stage,
              selection: state.selection,
              classes: {
                state: hierarchy.classes,
                onLoadMore: hierarchy.continueClasses,
                onRetry: hierarchy.retryClasses,
              },
              families: {
                state: hierarchy.families,
                onLoadMore: hierarchy.continueFamilies,
                onRetry: hierarchy.retryFamilies,
              },
              types: {
                state: hierarchy.types,
                onLoadMore: hierarchy.continueTypes,
                onRetry: hierarchy.retryTypes,
              },
              units: {
                state: unitsState.units,
                onLoadMore: unitsState.continueUnits,
                onRetry: unitsState.retryUnits,
              },
            }
            return (
              <ResourceCreationContextStage
                view={view}
                onConfirmClass={onConfirmClass}
                onConfirmFamily={onConfirmFamily}
                onConfirmType={onConfirmType}
                onConfirmUnit={onConfirmUnit}
              />
            )
          })()}
        {state.stage === 'attributes' && (
          <>
            {effectiveAttributes.status === 'loading' && (
              <p role="status" className="text-sm text-text-secondary">
                Cargando atributos…
              </p>
            )}
            {effectiveAttributes.status === 'error' && (
              <div role="alert" className="text-sm text-text-secondary">
                <p className="m-0">No se pudieron cargar los atributos.</p>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onPress={effectiveAttributes.retry}
                    type="button"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
            {effectiveAttributes.status === 'ready' && (
              <ResourceCreationAttributeSequencer
                attributes={attributeEvaluation.attributes}
                values={attributeValues}
                onChange={onAttributeChange}
                onComplete={() => dispatch({ type: 'CONFIRM_ATTRIBUTES' })}
              />
            )}
          </>
        )}
        {state.stage === 'review' &&
          scope &&
          unit &&
          effectiveAttributes.status === 'ready' && (
            <ResourceCreationReview
              scope={scope}
              unit={unit}
              attributes={attributeEvaluation.attributes}
              values={attributeValues}
              submit={submit}
            />
          )}
      </div>
      <CreationCommandBar stage={currentRailStage}>
        {isContextStage(state.stage) ? (
          <Button variant="outline" onPress={close} type="button">
            Cancelar
          </Button>
        ) : (
          <Button variant="outline" onPress={moveBack} type="button">
            Volver
          </Button>
        )}
      </CreationCommandBar>
    </div>
  )
}

export function CrearRecursoSurface({
  api,
  onSuccess,
}: CrearRecursoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const { registerAction, registerOverlay } = useKeyboardController()

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(
    (opener: HTMLElement | null = triggerRef.current) => {
      openerRef.current =
        opener?.isConnected &&
        opener !== document.body &&
        opener !== document.documentElement
          ? opener
          : null
      setIsOpen(true)
    },
    [],
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
        <ResourceCreationWizardDialog
          api={api}
          close={close}
          onSuccess={onSuccess}
        />
      </Dialog>
    </div>
  )
}

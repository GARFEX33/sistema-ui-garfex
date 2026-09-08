import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import {
  createParentGatedListController,
  type ParentGatedListController,
  type ParentGatedListState,
} from '../../shared/hierarchy/parentGatedListController'
import type { SelectorLoadState } from './StagedSearchSelector'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import { useResourceCreationEvaluation } from './useResourceCreationEvaluation'
import {
  createUnitCandidateHydrator,
  createUnitPolicyPageController,
  type UnitCandidate,
  type UnitPolicyContext,
  type UnitCandidateHydrationState,
  type UnitPolicyPageState,
} from './resourceCreation.loaders'
import {
  createInitialCreationState,
  resourceCreationReducer,
  resourceIdKey,
  type NormalizedResourceHierarchyPrefix,
} from './resourceCreation.model'
import type {
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceCreationEvaluationOwnership,
  ResourceId,
} from './resourcesMaster.types'

const PAGE_SIZE = 20

const selectorLoadState = <T extends { id: unknown }, TOperation>(
  state: ParentGatedListState<T, TOperation>,
): SelectorLoadState => {
  switch (state.status) {
    case 'initial-loading':
      return { status: 'loading' }
    case 'loading-more':
      return { status: 'loading-more' }
    case 'empty':
      return { status: 'empty' }
    case 'initial-error':
      return { status: 'initial-error' }
    case 'partial-error':
      return { status: 'partial-error' }
    default:
      return { status: 'ready', exhausted: state.isExhausted }
  }
}

const useControllerState = <T extends { id: unknown }, TOperation>(
  controller: ParentGatedListController<T, TOperation>,
) => {
  const snapshotRef = useRef(controller.getState())
  const subscribe = useCallback(
    (listener: () => void) =>
      controller.subscribe(() => {
        snapshotRef.current = controller.getState()
        listener()
      }),
    [controller],
  )
  return useSyncExternalStore(
    subscribe,
    () => snapshotRef.current,
    () => snapshotRef.current,
  )
}

const sameId = (left: unknown, right: ResourceId) =>
  left !== undefined && resourceIdKey(left) === resourceIdKey(right)

const unitSelectorLoadState = (
  policyState: UnitPolicyPageState,
  hydrationState: UnitCandidateHydrationState,
): SelectorLoadState => {
  if (hydrationState.status === 'partial-error')
    return { status: 'partial-error' }
  if (hydrationState.status === 'loading') return { status: 'loading' }
  if (policyState.status === 'loading') return { status: 'loading' }
  if (policyState.status === 'loading-more') return { status: 'loading-more' }
  if (policyState.status === 'initial-error') return { status: 'initial-error' }
  if (policyState.status === 'partial-error') return { status: 'partial-error' }
  if (hydrationState.status === 'empty')
    return policyState.status === 'ready' && !policyState.exhausted
      ? { status: 'ready', exhausted: false }
      : { status: 'empty' }
  if (policyState.status === 'ready')
    return { status: 'ready', exhausted: policyState.exhausted }
  return { status: 'loading' }
}

export function useResourceCreationFlow(
  api: ResourcesMasterApi,
  ownership: ResourceCreationEvaluationOwnership | null,
) {
  const [state, dispatch] = useState(createInitialCreationState)
  const setState = dispatch
  const evaluation = useResourceCreationEvaluation({
    api,
    ownership,
    state,
    setState,
  })
  const [classes] = useState(() =>
    createParentGatedListController<
      ResourceContextClassItem,
      'classes',
      string | null
    >({
      operation: 'classes',
      requiresParent: () => false,
      adapter: {
        load: ({ cursor }) =>
          api.listContextClasses({ cursor, pageSize: PAGE_SIZE }),
      },
    }),
  )
  const [families] = useState(() =>
    createParentGatedListController<
      ResourceContextFamilyItem,
      'families',
      string | null
    >({
      operation: 'families',
      requiresParent: () => true,
      adapter: {
        load: ({ parentId, cursor }) =>
          api.listContextFamilies({
            claseRecursoId: parentId,
            cursor,
            pageSize: PAGE_SIZE,
          }),
      },
    }),
  )
  const [types] = useState(() =>
    createParentGatedListController<
      ResourceContextTypeItem,
      'types',
      string | null
    >({
      operation: 'types',
      requiresParent: () => true,
      adapter: {
        load: ({ parentId, cursor }) =>
          api.listContextTypes({
            familiaRecursoId: parentId,
            cursor,
            pageSize: PAGE_SIZE,
          }),
      },
    }),
  )
  const [unitPolicies] = useState(() =>
    createUnitPolicyPageController({
      identity: resourceIdKey,
      loadPolicies: ({ familiaRecursoId, paraTipoRecursoId, cursor }) =>
        api.listUnitPolicies({
          familiaRecursoId,
          paraTipoRecursoId,
          cursor,
          pageSize: PAGE_SIZE,
        }),
    }),
  )
  const [unitHydrator] = useState(() =>
    createUnitCandidateHydrator({
      identity: resourceIdKey,
      getUnit: api.getUnit,
    }),
  )
  const [, refreshUnits] = useState(0)
  const classState = useControllerState(classes)
  const familyState = useControllerState(families)
  const typeState = useControllerState(types)
  const refreshUnitState = useCallback(
    () => refreshUnits((version) => version + 1),
    [],
  )
  const hydrateUnitPolicies = useCallback(
    async (tipoId: ResourceId) => {
      const policyState = unitPolicies.getState()
      if (
        !sameId(policyState.tipoId, tipoId) ||
        (policyState.status !== 'ready' && policyState.status !== 'empty')
      )
        return false
      unitHydrator.setSnapshot({
        tipoId,
        cursor: policyState.status === 'ready' ? policyState.cursor : null,
        references: policyState.references,
      })
      refreshUnitState()
      const hydration = unitHydrator.start()
      refreshUnitState()
      const hydrated = await hydration
      refreshUnitState()
      return hydrated
    },
    [refreshUnitState, unitHydrator, unitPolicies],
  )
  const startUnitsForContext = useCallback(
    async (context: UnitPolicyContext) => {
      unitPolicies.setContext(context)
      const request = unitPolicies.start()
      refreshUnitState()
      const loaded = await request
      refreshUnitState()
      if (
        !loaded ||
        !sameId(unitPolicies.getState().tipoId, context.paraTipoRecursoId)
      )
        return false
      return hydrateUnitPolicies(context.paraTipoRecursoId)
    },
    [hydrateUnitPolicies, refreshUnitState, unitPolicies],
  )

  const begin = useCallback(
    (prefix: NormalizedResourceHierarchyPrefix) => {
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'OPEN', prefix }),
      )
      if (prefix.depth === 0) void classes.start()
      if (prefix.classItem) {
        const current = families.getState()
        if (!sameId(current.parentId, prefix.classItem.id)) {
          families.setContext({
            operation: 'families',
            parentId: prefix.classItem.id,
          })
          void families.start()
        } else if (current.items.length === 0) {
          void families.start()
        }
      }
      if (prefix.familyItem) {
        types.setContext({ operation: 'types', parentId: prefix.familyItem.id })
        void types.start()
      }
      unitPolicies.setContext(null)
      unitHydrator.setSnapshot(null)
      refreshUnitState()
      if (prefix.familyItem && prefix.typeItem)
        void startUnitsForContext({
          familiaRecursoId: prefix.familyItem.id,
          paraTipoRecursoId: prefix.typeItem.id,
        })
    },
    [
      classes,
      families,
      refreshUnitState,
      startUnitsForContext,
      types,
      unitHydrator,
      unitPolicies,
    ],
  )
  const enterClass = useCallback(() => {
    dispatch((current) =>
      resourceCreationReducer(current, {
        type: 'NAVIGATE_TO_STAGE',
        stage: { kind: 'class' },
      }),
    )
    if (classes.getState().items.length === 0) void classes.start()
  }, [classes])
  const enterFamily = useCallback(() => {
    dispatch((current) =>
      resourceCreationReducer(current, {
        type: 'NAVIGATE_TO_STAGE',
        stage: { kind: 'family' },
      }),
    )
    if (families.getState().items.length === 0) void families.start()
  }, [families])
  const confirmClass = useCallback(
    (item: ResourceContextClassItem) => {
      const changed = !sameId(state.draft.hierarchy.classItem?.id, item.id)
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'CONFIRM_CLASS', item }),
      )
      if (!changed) return
      families.setContext({ operation: 'families', parentId: item.id })
      unitPolicies.setContext(null)
      unitHydrator.setSnapshot(null)
      refreshUnitState()
      void families.start()
    },
    [
      families,
      refreshUnitState,
      state.draft.hierarchy.classItem?.id,
      unitHydrator,
      unitPolicies,
    ],
  )
  const enterType = useCallback(() => {
    dispatch((current) =>
      resourceCreationReducer(current, {
        type: 'NAVIGATE_TO_STAGE',
        stage: { kind: 'type' },
      }),
    )
    if (types.getState().items.length === 0) void types.start()
  }, [types])
  const confirmFamily = useCallback(
    (item: ResourceContextFamilyItem) => {
      const changed = !sameId(state.draft.hierarchy.familyItem?.id, item.id)
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'CONFIRM_FAMILY', item }),
      )
      if (!changed) return
      types.setContext({ operation: 'types', parentId: item.id })
      unitPolicies.setContext(null)
      unitHydrator.setSnapshot(null)
      refreshUnitState()
      void types.start()
    },
    [
      refreshUnitState,
      state.draft.hierarchy.familyItem?.id,
      types,
      unitHydrator,
      unitPolicies,
    ],
  )
  const confirmType = useCallback(
    (item: ResourceContextTypeItem) => {
      const changed = !sameId(state.draft.hierarchy.typeItem?.id, item.id)
      dispatch((current) =>
        resourceCreationReducer(current, { type: 'CONFIRM_TYPE', item }),
      )
      if (!changed) return
      const familyId = state.draft.hierarchy.familyItem?.id
      if (familyId === undefined || familyId === null) return
      unitHydrator.setSnapshot(null)
      refreshUnitState()
      void startUnitsForContext({
        familiaRecursoId: familyId,
        paraTipoRecursoId: item.id,
      })
    },
    [
      refreshUnitState,
      startUnitsForContext,
      state.draft.hierarchy.familyItem?.id,
      state.draft.hierarchy.typeItem?.id,
      unitHydrator,
    ],
  )
  const continueUnits = useCallback(async () => {
    const policyState = unitPolicies.getState()
    const tipoId = policyState.tipoId
    if (tipoId === null) return false
    const request = unitPolicies.continue()
    refreshUnitState()
    const loaded = await request
    refreshUnitState()
    if (!loaded || !sameId(unitPolicies.getState().tipoId, tipoId)) return false
    return hydrateUnitPolicies(tipoId)
  }, [hydrateUnitPolicies, refreshUnitState, unitPolicies])
  const retryUnits = useCallback(async () => {
    if (unitHydrator.getState().status === 'partial-error') {
      const request = unitHydrator.retry()
      refreshUnitState()
      const retried = await request
      refreshUnitState()
      return retried
    }
    const policyState = unitPolicies.getState()
    const tipoId = policyState.tipoId
    if (tipoId === null) return false
    const request = unitPolicies.retry()
    refreshUnitState()
    const retried = await request
    refreshUnitState()
    if (!retried || !sameId(unitPolicies.getState().tipoId, tipoId))
      return false
    return hydrateUnitPolicies(tipoId)
  }, [hydrateUnitPolicies, refreshUnitState, unitHydrator, unitPolicies])
  const confirmUnit = useCallback(
    (candidate: UnitCandidate) => {
      const hydrationState = unitHydrator.getState()
      if (
        hydrationState.status !== 'ready' ||
        !hydrationState.candidates.some((item) =>
          sameId(item.unidadId, candidate.unidadId),
        )
      )
        return
      dispatch((current) =>
        resourceCreationReducer(current, {
          type: 'CONFIRM_UNIT',
          unitId: candidate.unidadId,
        }),
      )
    },
    [unitHydrator],
  )
  const unitPolicyState = unitPolicies.getState()
  const unitHydrationState = unitHydrator.getState()

  return {
    state,
    evaluation: {
      status: evaluation.status,
      retry: evaluation.retry,
    },
    begin,
    enterClass,
    enterFamily,
    enterType,
    confirmClass,
    confirmFamily,
    confirmType,
    classes: classState.items,
    classLoadState: selectorLoadState(classState),
    continueClasses: () => classes.continue(),
    retryClasses: () => classes.retry(),
    families: familyState.items,
    familyLoadState: selectorLoadState(familyState),
    continueFamilies: () => families.continue(),
    retryFamilies: () => families.retry(),
    types: typeState.items,
    typeLoadState: selectorLoadState(typeState),
    continueTypes: () => types.continue(),
    retryTypes: () => types.retry(),
    units: unitHydrationState.candidates,
    unitLoadState: unitSelectorLoadState(unitPolicyState, unitHydrationState),
    continueUnits,
    retryUnits,
    confirmUnit,
    classKey: resourceIdKey,
  }
}

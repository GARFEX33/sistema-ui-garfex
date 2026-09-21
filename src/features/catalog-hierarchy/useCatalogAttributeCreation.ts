import { useCallback, useEffect, useRef, useState } from 'react'
import { CatalogAttributeCreationRestError } from './catalogAttributeCreation.api'
import type {
  CatalogApplicabilityCreateInput,
  CatalogApplicabilityRecord,
  CatalogAttributeCreationApi,
  CatalogAttributeCreationContext,
  CatalogAttributeCreationReferences,
  CatalogCharacteristicCreateInput,
  CatalogCharacteristicRecord,
  CatalogCharacteristicSearchInput,
  CatalogCharacteristicSearchPage,
  CatalogPresentationRecord,
} from './catalogAttributeCreation.types'

type Context = CatalogAttributeCreationContext & { sessionId?: string }
type Snapshot = CatalogAttributeCreationContext & { sessionId: string }
type Draft = CatalogCharacteristicCreateInput & {
  mode: 'REQUIRED' | 'OPTIONAL' | 'FORBIDDEN'
  identityParticipates: boolean
  position: string
}
type Step = Readonly<{
  name: (typeof names)[number]
  status:
    | 'not-started'
    | 'pending'
    | 'confirmed'
    | 'failed'
    | 'unconfirmed'
    | 'reconciliation-required'
  record?:
    | CatalogCharacteristicRecord
    | CatalogApplicabilityRecord
    | CatalogPresentationRecord
  error?: Error
}>
type Operation = Readonly<{
  key: string
  generation: number
  snapshot: Snapshot
  draft: Draft
  characteristicOrigin: 'created' | 'existing'
  steps: readonly Step[]
  references?: CatalogAttributeCreationReferences
  status: 'pending' | 'partial' | 'reconciliation-required' | 'completed'
}>
type ExistingDraft = Omit<Draft, 'code' | 'name' | 'valueType'> & {
  characteristic: CatalogCharacteristicRecord
}
type ExistingSearch = Readonly<{
  key: string | null
  contextGeneration: number
  generation: number
  status: 'idle' | 'loading' | 'ready' | 'error'
  input: Omit<CatalogCharacteristicSearchInput, 'scope' | 'signal'> | null
  page: CatalogCharacteristicSearchPage | null
  error: Error | null
}>
type Options = Readonly<{
  api: CatalogAttributeCreationApi
  context: Context
  refreshEffective: (
    snapshot: CatalogAttributeCreationContext,
  ) => Promise<boolean>
  canSubmit?: () => boolean
}>

const names = ['characteristic', 'applicability', 'presentation'] as const
const initialSteps = (): readonly Step[] =>
  names.map((name) => ({ name, status: 'not-started' }))
const valid = (value: Context): value is Snapshot =>
  typeof value.sessionId === 'string' &&
  value.sessionId.length > 0 &&
  typeof value.classCode === 'string' &&
  value.classCode.length > 0 &&
  typeof value.familyCode === 'string' &&
  value.familyCode.length > 0 &&
  typeof value.typeCode === 'string' &&
  value.typeCode.length > 0
const failure = (error: unknown) =>
  error instanceof Error ? error : new Error('Request failed')
const uncertain = (error: unknown) =>
  !(error instanceof CatalogAttributeCreationRestError) ||
  error.failure.kind === 'network' ||
  error.failure.kind === 'invalid-response'
const emptyExistingSearch = (): ExistingSearch => ({
  key: null,
  contextGeneration: 0,
  generation: 0,
  status: 'idle',
  input: null,
  page: null,
  error: null,
})
const validExistingCharacteristic = (
  value: CatalogCharacteristicRecord,
): value is CatalogCharacteristicRecord =>
  value.kind === 'CARACTERISTICA' &&
  value.active &&
  value.id.length > 0 &&
  value.code.length > 0 &&
  value.name.length > 0 &&
  valueTypes.has(value.valueType)
const valueTypes = new Set([
  'CONTROLLED_OPTION',
  'INTEGER',
  'DECIMAL',
  'QUANTITY',
  'BOOLEAN',
  'CONTROLLED_TEXT',
])

export function useCatalogAttributeCreation({
  api,
  context,
  refreshEffective,
  canSubmit = () => true,
}: Options) {
  const key = valid(context)
    ? JSON.stringify([
        context.sessionId,
        context.classCode,
        context.familyCode,
        context.typeCode,
      ])
    : null
  const apiRef = useRef(api)
  const refreshRef = useRef(refreshEffective)
  const actorRef = useRef(canSubmit)
  const contextRef = useRef(context)
  apiRef.current = api
  refreshRef.current = refreshEffective
  actorRef.current = canSubmit
  contextRef.current = context
  const operationRef = useRef<Operation | null>(null)
  const retainedRef = useRef<readonly Operation[]>([])
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchGenerationRef = useRef(0)
  const [existingSearch, setExistingSearch] =
    useState<ExistingSearch>(emptyExistingSearch)
  const retain = (operation: Operation) => {
    const partial: Operation =
      operation.status === 'pending'
        ? { ...operation, status: 'partial' }
        : operation
    retainedRef.current = [
      ...retainedRef.current.filter((item) => item.key !== partial.key),
      partial,
    ]
  }
  const currentRef = useRef({ key, generation: 0 })
  if (currentRef.current.key !== key) {
    const running = operationRef.current
    if (
      running !== null &&
      running.key === currentRef.current.key &&
      running.generation === currentRef.current.generation
    )
      retain(running)
    operationRef.current = null
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    searchGenerationRef.current += 1
    currentRef.current = { key, generation: currentRef.current.generation + 1 }
  }
  const mounted = useRef(true)
  const [operation, setOperation] = useState<Operation | null>(null)
  useEffect(
    () => () => {
      mounted.current = false
      searchAbortRef.current?.abort()
      searchAbortRef.current = null
      searchGenerationRef.current += 1
    },
    [],
  )
  useEffect(() => {
    mounted.current = true
  }, [])
  const live = (operation: Operation) =>
    mounted.current &&
    currentRef.current.key === operation.key &&
    currentRef.current.generation === operation.generation
  const active = (operation: Operation) =>
    live(operation) && operationRef.current === operation
  const unresolved = (operation: Operation | null | undefined) =>
    operation?.status === 'pending' ||
    operation?.status === 'partial' ||
    operation?.status === 'reconciliation-required'
  const hasUnresolvedLedger = (operationKey: string) =>
    unresolved(operationRef.current) ||
    retainedRef.current.some(
      (operation) => operation.key === operationKey && unresolved(operation),
    )
  const commit = (next: Operation) => {
    if (live(next)) {
      operationRef.current = next
      setOperation(next)
    } else if (!retainedRef.current.includes(next)) retain(next)
    return next
  }
  const update = (
    operation: Operation,
    index: number,
    status: Step['status'],
    error?: Error,
    record?: Step['record'],
    nextStatus: Operation['status'] = operation.status,
  ) =>
    commit({
      ...operation,
      status: nextStatus,
      steps: operation.steps.map((step, current) =>
        current === index
          ? {
              ...step,
              status,
              ...(error ? { error } : {}),
              ...(record ? { record } : {}),
            }
          : step,
      ),
    })
  const refresh = async (
    operation: Operation,
    index: number,
    uncertainWrite = false,
  ) => {
    let refreshed = false
    try {
      refreshed = await refreshRef.current({
        classCode: operation.snapshot.classCode,
        familyCode: operation.snapshot.familyCode,
        typeCode: operation.snapshot.typeCode,
      })
    } catch {
      refreshed = false
    }
    if (!active(operation)) return operation
    if (!refreshed)
      return update(
        operation,
        index,
        'reconciliation-required',
        undefined,
        undefined,
        'reconciliation-required',
      )
    if (uncertainWrite)
      return commit({ ...operation, status: 'reconciliation-required' })
    return operation
  }
  const execute = async (
    start: number,
    current: Operation,
  ): Promise<boolean> => {
    let operation = current
    if (operation.references === undefined) {
      if (operation.steps[0]?.status === 'not-started')
        operation = update(operation, 0, 'pending')
      try {
        const references = await apiRef.current.resolveHierarchyReferences(
          operation.snapshot,
        )
        operation = commit({ ...operation, references })
        if (!active(operation)) return false
      } catch (error) {
        update(operation, 0, 'failed', failure(error), undefined, 'partial')
        return false
      }
    }
    const references = operation.references
    if (references === undefined) return false
    for (let index = start; index < names.length; index += 1) {
      if (!active(operation)) return false
      if (!actorRef.current()) {
        update(
          operation,
          index,
          'failed',
          new Error('A local REST actor is required'),
          undefined,
          'partial',
        )
        return false
      }
      operation = update(operation, index, 'pending')
      try {
        if (index === 0) {
          const record = await apiRef.current.createCharacteristic(
            operation.draft,
          )
          operation = update(operation, index, 'confirmed', undefined, record)
        } else {
          const characteristic = operation.steps[0]
            .record as CatalogCharacteristicRecord
          const input = {
            ...references,
            characteristic: {
              kind: 'REFERENCE' as const,
              reference: {
                kind: 'CARACTERISTICA' as const,
                id: characteristic.id,
                code: characteristic.code,
              },
            },
          }
          if (index === 1)
            operation = update(
              operation,
              index,
              'confirmed',
              undefined,
              await apiRef.current.createApplicability({
                ...input,
                characteristicValueType: operation.draft.valueType,
                mode: operation.draft.mode,
                identityParticipates: operation.draft.identityParticipates,
                rules: [],
              } as CatalogApplicabilityCreateInput),
            )
          else
            operation = update(
              operation,
              index,
              'confirmed',
              undefined,
              await apiRef.current.createPresentation({
                ...input,
                position: operation.draft.position,
              }),
            )
        }
      } catch (error) {
        const known = failure(error)
        if (!uncertain(error)) {
          update(operation, index, 'failed', known, undefined, 'partial')
          return false
        }
        operation = update(
          operation,
          index,
          'unconfirmed',
          known,
          undefined,
          'reconciliation-required',
        )
        await refresh(operation, index, true)
        return false
      }
      if (!active(operation)) return false
      operation = await refresh(operation, index)
      if (operation.status === 'reconciliation-required' || !active(operation))
        return false
    }
    commit({ ...operation, status: 'completed' })
    return true
  }
  const executeRef = useRef(execute)
  executeRef.current = execute
  const clearExistingSearch = useCallback(() => {
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    searchGenerationRef.current += 1
    setExistingSearch(emptyExistingSearch())
  }, [])
  const searchExisting = useCallback(
    async (
      input: Omit<CatalogCharacteristicSearchInput, 'scope' | 'signal'>,
    ) => {
      const snapshot = valid(contextRef.current) ? contextRef.current : null
      if (snapshot === null) return false
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller
      const generation = searchGenerationRef.current + 1
      searchGenerationRef.current = generation
      const searchKey = currentRef.current.key
      const contextGeneration = currentRef.current.generation
      setExistingSearch({
        key: searchKey,
        contextGeneration,
        generation,
        status: 'loading',
        input,
        page: null,
        error: null,
      })
      try {
        const page = await apiRef.current.searchCharacteristics({
          ...input,
          scope: 'ACTIVE',
          signal: controller.signal,
        })
        if (
          controller.signal.aborted ||
          searchGenerationRef.current !== generation ||
          !mounted.current ||
          currentRef.current.key !== searchKey ||
          currentRef.current.generation !== contextGeneration
        )
          return false
        setExistingSearch({
          key: searchKey,
          contextGeneration,
          generation,
          status: 'ready',
          input,
          page,
          error: null,
        })
        return true
      } catch (error) {
        if (
          controller.signal.aborted ||
          searchGenerationRef.current !== generation ||
          !mounted.current ||
          currentRef.current.key !== searchKey ||
          currentRef.current.generation !== contextGeneration
        )
          return false
        setExistingSearch({
          key: searchKey,
          contextGeneration,
          generation,
          status: 'error',
          input,
          page: null,
          error: failure(error),
        })
        return false
      }
      // Commands intentionally read current refs while retaining stable UI identities.
    },
    [],
  )
  const submit = useCallback(async (draft: Draft) => {
    const snapshot = valid(contextRef.current) ? contextRef.current : null
    if (
      snapshot === null ||
      hasUnresolvedLedger(
        JSON.stringify([
          snapshot.sessionId,
          snapshot.classCode,
          snapshot.familyCode,
          snapshot.typeCode,
        ]),
      )
    )
      return false
    if (!actorRef.current()) return false
    const operation: Operation = {
      key: JSON.stringify([
        snapshot.sessionId,
        snapshot.classCode,
        snapshot.familyCode,
        snapshot.typeCode,
      ]),
      generation: currentRef.current.generation,
      snapshot,
      draft,
      characteristicOrigin: 'created',
      steps: initialSteps(),
      status: 'pending',
    }
    commit(operation)
    void executeRef.current(0, operation)
    return true
    // Commands intentionally read current refs while retaining stable UI identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const assignExisting = useCallback(async (draft: ExistingDraft) => {
    const snapshot = valid(contextRef.current) ? contextRef.current : null
    if (
      snapshot === null ||
      hasUnresolvedLedger(
        JSON.stringify([
          snapshot.sessionId,
          snapshot.classCode,
          snapshot.familyCode,
          snapshot.typeCode,
        ]),
      ) ||
      !actorRef.current() ||
      !validExistingCharacteristic(draft.characteristic)
    )
      return false
    const characteristic = draft.characteristic
    const operation: Operation = {
      key: JSON.stringify([
        snapshot.sessionId,
        snapshot.classCode,
        snapshot.familyCode,
        snapshot.typeCode,
      ]),
      generation: currentRef.current.generation,
      snapshot,
      draft: {
        code: characteristic.code,
        name: characteristic.name,
        valueType: characteristic.valueType,
        mode: draft.mode,
        identityParticipates: draft.identityParticipates,
        position: draft.position,
      },
      characteristicOrigin: 'existing',
      steps: [
        { name: 'characteristic', status: 'confirmed', record: characteristic },
        { name: 'applicability', status: 'not-started' },
        { name: 'presentation', status: 'not-started' },
      ],
      status: 'pending',
    }
    commit(operation)
    void executeRef.current(1, operation)
    return true
    // Commands intentionally read current refs while retaining stable UI identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const rereadCore = useCallback(async () => {
    const current = operationRef.current
    if (current === null || !active(current)) return false
    let refreshed = false
    try {
      refreshed = await refreshRef.current({
        classCode: current.snapshot.classCode,
        familyCode: current.snapshot.familyCode,
        typeCode: current.snapshot.typeCode,
      })
    } catch {
      refreshed = false
    }
    if (!active(current)) return false
    if (!refreshed) {
      update(
        current,
        -1,
        'reconciliation-required',
        undefined,
        undefined,
        'reconciliation-required',
      )
      return false
    }
    const restored = commit({
      ...current,
      steps: current.steps.map((step) =>
        step.status === 'reconciliation-required' && step.record
          ? { ...step, status: 'confirmed' }
          : step,
      ),
    })
    if (!active(restored)) return false
    commit({
      ...restored,
      status: restored.steps.every((step) => step.status === 'confirmed')
        ? 'completed'
        : 'partial',
    })
    return true
    // Commands intentionally read current refs while retaining stable UI identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const continuePendingStep = useCallback(async () => {
    const current = operationRef.current
    if (current === null || !active(current) || current.status === 'pending')
      return false
    const index = current.steps.findIndex((step) => step.status !== 'confirmed')
    if (
      index < 0 ||
      current.steps[index]?.status !== 'not-started' ||
      !current.steps
        .slice(0, index)
        .every((step) => step.status === 'confirmed')
    )
      return false
    void executeRef.current(index, commit({ ...current, status: 'pending' }))
    return true
    // Commands intentionally read current refs while retaining stable UI identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const visible =
    operation !== null &&
    operation.key === key &&
    operation.generation === currentRef.current.generation
      ? operation
      : null
  const visibleSearch =
    existingSearch.key === key &&
    existingSearch.contextGeneration === currentRef.current.generation
      ? existingSearch
      : emptyExistingSearch()
  return {
    status: visible?.status ?? 'idle',
    steps: visible?.steps ?? initialSteps(),
    draft: visible?.draft ?? null,
    characteristicOrigin: visible?.characteristicOrigin ?? null,
    retained: retainedRef.current,
    existingSearch: visibleSearch,
    submit,
    assignExisting,
    searchExisting,
    clearExistingSearch,
    rereadCore,
    continuePendingStep,
  }
}

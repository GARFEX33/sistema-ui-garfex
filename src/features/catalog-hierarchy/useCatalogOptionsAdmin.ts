import { useCallback, useEffect, useRef, useState } from 'react'
import { CatalogOptionsAdminConflictError } from './catalogOptionsAdmin.api'
import type {
  CatalogOptionsAdminApi,
  CatalogOptionsAdminCreateInput,
  CatalogOptionsAdminDeleteInput,
  CatalogOptionsAdminPage,
  CatalogOptionsAdminReferences,
  CatalogOptionsAdminUpdateInput,
} from './catalogOptionsAdmin.types'

export type CatalogOptionsAdminStatus =
  | 'waiting-context'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
export type CatalogOptionsAdminCommandStatus =
  | 'idle'
  | 'pending'
  | 'error'
  | 'conflict'
export type CatalogOptionsAdminContext = Readonly<{
  sessionId?: string
  classCode?: string
  familyCode?: string
  typeCode?: string
  optionSetCode?: string
  characteristicCode?: string
}>
export type CatalogOptionsAdminSnapshot = Readonly<{
  sessionId: string
  classCode: string
  familyCode: string
  typeCode: string
  optionSetCode: string
  characteristicCode: string
  scope: 'ALL'
  offset: number
  limit: number
}>
type State = Readonly<{
  key: string | null
  status: CatalogOptionsAdminStatus
  page: CatalogOptionsAdminPage
  error: Error | null
}>
type Request = Readonly<{
  key: string
  controller: AbortController
}>
type Current = Readonly<{
  key: string | null
  snapshot: CatalogOptionsAdminSnapshot | null
  generation: number
}>
type ReferenceCurrent = Readonly<{
  key: string | null
  optionSetCode: string
  characteristicCode: string
  generation: number
}>

const emptyPage: CatalogOptionsAdminPage = {
  records: [],
  hasPrevious: false,
  hasNext: false,
}
const waiting: State = {
  key: null,
  status: 'waiting-context',
  page: emptyPage,
  error: null,
}
const code = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0
const errorOf = (value: unknown) =>
  value instanceof Error ? value : new Error('Request failed')
const keyOf = (...value: (string | undefined)[]) => JSON.stringify(value)
const snapshotOf = (
  context: CatalogOptionsAdminContext,
  offset: number,
): CatalogOptionsAdminSnapshot | null =>
  code(context.sessionId) &&
  code(context.classCode) &&
  code(context.familyCode) &&
  code(context.typeCode) &&
  code(context.optionSetCode) &&
  code(context.characteristicCode)
    ? {
        sessionId: context.sessionId,
        classCode: context.classCode,
        familyCode: context.familyCode,
        typeCode: context.typeCode,
        optionSetCode: context.optionSetCode,
        characteristicCode: context.characteristicCode,
        scope: 'ALL',
        offset,
        limit: 20,
      }
    : null

export function useCatalogOptionsAdmin(
  api: CatalogOptionsAdminApi,
  context: CatalogOptionsAdminContext,
  refreshEffective: (snapshot: CatalogOptionsAdminSnapshot) => Promise<boolean>,
) {
  const {
    sessionId,
    classCode,
    familyCode,
    typeCode,
    optionSetCode,
    characteristicCode,
  } = context
  const contextKey = keyOf(
    sessionId,
    classCode,
    familyCode,
    typeCode,
    optionSetCode,
    characteristicCode,
  )
  const [pageState, setPageState] = useState({ key: contextKey, offset: 0 })
  const offset = pageState.key === contextKey ? pageState.offset : 0
  const snapshot = snapshotOf(
    {
      sessionId,
      classCode,
      familyCode,
      typeCode,
      optionSetCode,
      characteristicCode,
    },
    offset,
  )
  const key = snapshot === null ? null : JSON.stringify(snapshot)
  const referenceKey = snapshot === null ? null : contextKey
  const apiRef = useRef(api)
  const refreshRef = useRef(refreshEffective)
  apiRef.current = api
  refreshRef.current = refreshEffective
  const currentRef = useRef<Current>({ key, snapshot, generation: 0 })
  currentRef.current =
    currentRef.current.key === key
      ? { ...currentRef.current, snapshot }
      : { key, snapshot, generation: currentRef.current.generation + 1 }
  const referenceCurrentRef = useRef<ReferenceCurrent>({
    key: referenceKey,
    optionSetCode: optionSetCode ?? '',
    characteristicCode: characteristicCode ?? '',
    generation: 0,
  })
  referenceCurrentRef.current =
    referenceCurrentRef.current.key === referenceKey
      ? referenceCurrentRef.current
      : {
          key: referenceKey,
          optionSetCode: optionSetCode ?? '',
          characteristicCode: characteristicCode ?? '',
          generation: referenceCurrentRef.current.generation + 1,
        }
  const [state, setState] = useState<State>(waiting)
  const stateRef = useRef(state)
  const [attempt, setAttempt] = useState(0)
  const [referenceAttempt, setReferenceAttempt] = useState(0)
  const referenceAbort = useRef<AbortController | undefined>(undefined)
  const [references, setReferences] =
    useState<CatalogOptionsAdminReferences | null>(null)
  const [referenceStatus, setReferenceStatus] = useState<
    'waiting-context' | 'loading' | 'ready' | 'error'
  >('waiting-context')
  const [referenceError, setReferenceError] = useState<Error | null>(null)
  const requestRef = useRef<Request | undefined>(undefined)
  const mountedRef = useRef(true)
  const clearedGeneration = useRef<number | undefined>(undefined)
  const [commandStatus, setCommandStatus] =
    useState<CatalogOptionsAdminCommandStatus>('idle')
  const commandRef = useRef<CatalogOptionsAdminCommandStatus>('idle')
  const setCommand = (status: CatalogOptionsAdminCommandStatus) => {
    commandRef.current = status
    setCommandStatus(status)
  }
  const [commandError, setCommandError] = useState<Error | null>(null)
  const [draft, setDraft] = useState<
    | CatalogOptionsAdminCreateInput
    | CatalogOptionsAdminUpdateInput
    | CatalogOptionsAdminDeleteInput
    | null
  >(null)
  const commit = useCallback((next: State) => {
    stateRef.current = next
    setState(next)
  }, [])
  const current = (captured: Current) =>
    mountedRef.current &&
    currentRef.current.generation === captured.generation &&
    currentRef.current.key === captured.key
  const referenceCurrent = (captured: ReferenceCurrent) =>
    mountedRef.current &&
    referenceCurrentRef.current.generation === captured.generation &&
    referenceCurrentRef.current.key === captured.key
  const read = useCallback(
    async (value: CatalogOptionsAdminSnapshot, generation: number) => {
      const request = {
        key: JSON.stringify(value),
        controller: new AbortController(),
      }
      const captured: Current = {
        key: request.key,
        snapshot: value,
        generation,
      }
      requestRef.current?.controller.abort()
      requestRef.current = request
      commit({
        key: request.key,
        status: 'loading',
        page: emptyPage,
        error: null,
      })
      const live = () =>
        current(captured) &&
        requestRef.current === request &&
        !request.controller.signal.aborted
      try {
        const page = await apiRef.current.list({
          optionSetCode: value.optionSetCode,
          characteristicCode: value.characteristicCode,
          offset: value.offset,
          limit: value.limit,
          signal: request.controller.signal,
        })
        if (!live()) return false
        commit({
          key: request.key,
          status: page.records.length === 0 ? 'empty' : 'ready',
          page,
          error: null,
        })
        return true
      } catch (error) {
        if (!live()) return false
        commit({
          key: request.key,
          status: 'error',
          page: emptyPage,
          error: errorOf(error),
        })
        return false
      } finally {
        if (live()) requestRef.current = undefined
      }
    },
    [commit],
  )
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  useEffect(() => {
    setPageState({ key: contextKey, offset: 0 })
  }, [contextKey])
  useEffect(() => {
    const captured = referenceCurrentRef.current
    referenceAbort.current?.abort()
    if (captured.key === null) {
      setReferences(null)
      setReferenceError(null)
      setReferenceStatus('waiting-context')
      return
    }
    const controller = new AbortController()
    referenceAbort.current = controller
    setReferences(null)
    setReferenceError(null)
    setReferenceStatus('loading')
    const resolveReferences = apiRef.current.resolveReferences
    if (!resolveReferences) return () => controller.abort()
    void resolveReferences({
      optionSetCode: captured.optionSetCode,
      characteristicCode: captured.characteristicCode,
      signal: controller.signal,
    })
      .then((next) => {
        if (!referenceCurrent(captured) || controller.signal.aborted) return
        setReferences(next)
        setReferenceStatus('ready')
      })
      .catch((error: unknown) => {
        if (!referenceCurrent(captured) || controller.signal.aborted) return
        setReferenceError(errorOf(error))
        setReferenceStatus('error')
      })
    return () => controller.abort()
  }, [contextKey, referenceAttempt])
  useEffect(() => {
    const active = currentRef.current
    if (active.snapshot === null || key === null) {
      requestRef.current?.controller.abort()
      requestRef.current = undefined
      commit(waiting)
    } else {
      void read(active.snapshot, active.generation)
    }
    if (clearedGeneration.current !== active.generation) {
      clearedGeneration.current = active.generation
      setCommand('idle')
      setCommandError(null)
      setDraft(null)
    }
    return () => requestRef.current?.controller.abort()
  }, [attempt, commit, key, read])
  const retry = useCallback(() => {
    if (stateRef.current.status === 'error' && requestRef.current === undefined)
      setAttempt((value) => value + 1)
  }, [])
  const changePage = useCallback(
    (next: number) => {
      if (requestRef.current === undefined && next >= 0)
        setPageState({ key: contextKey, offset: next })
    },
    [contextKey],
  )
  const run = useCallback(
    async (
      input:
        | CatalogOptionsAdminCreateInput
        | CatalogOptionsAdminUpdateInput
        | CatalogOptionsAdminDeleteInput,
      execute: () => Promise<unknown>,
    ) => {
      const captured = currentRef.current
      if (captured.snapshot === null || commandRef.current === 'pending')
        return false
      setCommand('pending')
      setCommandError(null)
      setDraft(null)
      try {
        await execute()
        if (!current(captured)) return
        const baseCurrent = await read(captured.snapshot, captured.generation)
        if (!current(captured)) return
        const effectiveCurrent = await refreshRef.current(captured.snapshot)
        if (!current(captured)) return
        if (!baseCurrent || effectiveCurrent === false) {
          setCommand('error')
          setCommandError(new Error('Base refresh failed'))
          setDraft(input)
          return
        }
        setCommand('idle')
        return true
      } catch (error) {
        if (!current(captured)) return
        if (error instanceof CatalogOptionsAdminConflictError) {
          setCommandError(error)
          setDraft(input)
          await read(captured.snapshot, captured.generation)
          if (!current(captured)) return
          await refreshRef.current(captured.snapshot)
          if (current(captured)) setCommand('conflict')
          return false
        }
        setCommand('error')
        setCommandError(errorOf(error))
        setDraft(input)
        return false
      }
    },
    [read],
  )
  const currentState = state.key === key
  const page = currentState ? state.page : emptyPage
  return {
    status: currentState
      ? state.status
      : key === null
        ? 'waiting-context'
        : 'loading',
    records: page.records,
    error: currentState ? state.error : null,
    offset,
    hasPrevious: page.hasPrevious,
    hasNext: page.hasNext,
    retry,
    references,
    referenceStatus,
    referenceError,
    retryReferences: () => {
      if (referenceStatus === 'error') setReferenceAttempt((value) => value + 1)
    },
    previous: () => {
      if (page.hasPrevious) changePage(Math.max(0, offset - 20))
    },
    next: () => {
      if (page.hasNext) changePage(offset + 20)
    },
    commandStatus,
    commandError,
    draft,
    create: (input: CatalogOptionsAdminCreateInput) =>
      run(input, () => apiRef.current.create(input)),
    update: (input: CatalogOptionsAdminUpdateInput) =>
      run(input, () => apiRef.current.update(input)),
    deactivate: (input: CatalogOptionsAdminUpdateInput) =>
      run(input, () => apiRef.current.deactivate(input)),
    reactivate: (input: CatalogOptionsAdminUpdateInput) =>
      run(input, () => apiRef.current.reactivate(input)),
    delete: (input: CatalogOptionsAdminDeleteInput) => {
      const remove = apiRef.current.delete
      return remove ? run(input, () => remove(input)) : Promise.resolve(false)
    },
  }
}

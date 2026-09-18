import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CatalogTypeEffectiveAttributesApi,
  EffectiveAttribute,
} from './catalogTypeEffectiveAttributes.types'

export type CatalogTypeEffectiveAttributesStatus =
  | 'waiting-context'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'

export type CatalogTypeEffectiveAttributesContext = Readonly<{
  classCode?: string
  familyCode?: string
  typeCode?: string
}>

type Snapshot = Readonly<{
  classCode: string
  familyCode: string
  typeCode: string
}>

type State = Readonly<{
  key: string | null
  status: CatalogTypeEffectiveAttributesStatus
  attributes: readonly EffectiveAttribute[]
  error: Error | null
  isFresh: boolean
}>

type Request = Readonly<{
  key: string
  generation: number
  controller: AbortController
}>

type Refresh = Readonly<{
  key: string
  resolve: (result: boolean) => void
}>

const waiting: State = {
  key: null,
  status: 'waiting-context',
  attributes: [],
  error: null,
  isFresh: false,
}

const code = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const snapshotOf = (
  classCode?: string,
  familyCode?: string,
  typeCode?: string,
): Snapshot | null =>
  code(classCode) && code(familyCode) && code(typeCode)
    ? { classCode, familyCode, typeCode }
    : null

const keyOf = (snapshot: Snapshot) =>
  JSON.stringify([snapshot.classCode, snapshot.familyCode, snapshot.typeCode])

export function useCatalogTypeEffectiveAttributes(
  api: CatalogTypeEffectiveAttributesApi,
  context: CatalogTypeEffectiveAttributesContext,
) {
  const { classCode, familyCode, typeCode } = context
  const snapshot = useMemo(
    () => snapshotOf(classCode, familyCode, typeCode),
    [classCode, familyCode, typeCode],
  )
  const key = snapshot === null ? null : keyOf(snapshot)
  const apiRef = useRef(api)
  apiRef.current = api
  const currentRef = useRef({ key, snapshot })
  currentRef.current = { key, snapshot }
  const [state, setState] = useState<State>(waiting)
  const stateRef = useRef(state)
  const [selected, setSelected] = useState<string | null>(null)
  const generation = useRef(0)
  const inFlight = useRef<Request | undefined>(undefined)
  const refreshRef = useRef<Refresh | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)
  const commit = useCallback((next: State) => {
    stateRef.current = next
    setState(next)
  }, [])

  useEffect(() => {
    const requestGeneration = ++generation.current
    if (snapshot === null || key === null) {
      inFlight.current?.controller.abort()
      inFlight.current = undefined
      refreshRef.current?.resolve(false)
      refreshRef.current = undefined
      commit(waiting)
      setSelected(null)
      return
    }

    const controller = new AbortController()
    const request = { key, generation: requestGeneration, controller }
    const refresh = refreshRef.current
    const retainProjection =
      refresh?.key === key &&
      stateRef.current.key === key &&
      (stateRef.current.status === 'ready' ||
        stateRef.current.status === 'empty')
    const settleRefresh = (result: boolean) => {
      if (refreshRef.current !== refresh || refresh === undefined) return
      refreshRef.current = undefined
      refresh.resolve(result)
    }
    inFlight.current?.controller.abort()
    inFlight.current = request
    if (!retainProjection) {
      commit({
        key,
        status: 'loading',
        attributes: [],
        error: null,
        isFresh: false,
      })
      setSelected(null)
    } else commit({ ...stateRef.current, isFresh: false })
    const isCurrent = () =>
      currentRef.current.key === key &&
      generation.current === requestGeneration &&
      inFlight.current === request &&
      !controller.signal.aborted

    void apiRef.current
      .getEffectiveAttributes({ ...snapshot, signal: controller.signal })
      .then((response) => {
        if (!isCurrent()) {
          settleRefresh(false)
          return
        }
        commit({
          key,
          status: response.attributes.length === 0 ? 'empty' : 'ready',
          attributes: response.attributes,
          error: null,
          isFresh: true,
        })
        settleRefresh(true)
      })
      .catch((error: unknown) => {
        if (!isCurrent()) {
          settleRefresh(false)
          return
        }
        if (!retainProjection) {
          commit({
            key,
            status: 'error',
            attributes: [],
            error: error instanceof Error ? error : new Error('Request failed'),
            isFresh: false,
          })
        }
        settleRefresh(false)
      })
      .finally(() => {
        if (isCurrent()) inFlight.current = undefined
      })

    return () => {
      controller.abort()
      settleRefresh(false)
    }
  }, [attempt, commit, key, snapshot])

  const retry = useCallback(() => {
    const current = currentRef.current
    if (
      current.key === null ||
      inFlight.current !== undefined ||
      stateRef.current.key !== current.key ||
      stateRef.current.status !== 'error'
    )
      return
    commit({
      key: current.key,
      status: 'loading',
      attributes: [],
      error: null,
      isFresh: false,
    })
    setSelected(null)
    setAttempt((value) => value + 1)
  }, [commit])

  const refresh = useCallback((): Promise<boolean> => {
    const current = currentRef.current
    if (
      current.key === null ||
      inFlight.current !== undefined ||
      stateRef.current.key !== current.key ||
      (stateRef.current.status !== 'ready' &&
        stateRef.current.status !== 'empty')
    )
      return Promise.resolve(false)
    return new Promise((resolve) => {
      refreshRef.current?.resolve(false)
      refreshRef.current = { key: current.key!, resolve }
      setAttempt((value) => value + 1)
    })
  }, [])

  const selectAttribute = useCallback((code: string | null) => {
    const current = currentRef.current
    if (
      current.key === null ||
      stateRef.current.key !== current.key ||
      (stateRef.current.status !== 'ready' &&
        stateRef.current.status !== 'empty')
    )
      return
    setSelected(code)
  }, [])

  const current = state.key === key
  return {
    status: current
      ? state.status
      : key === null
        ? 'waiting-context'
        : 'loading',
    attributes: current ? state.attributes : [],
    error: current ? state.error : null,
    isFresh: current && state.isFresh,
    selectedAttributeCode: current ? selected : null,
    selectAttribute,
    retry,
    refresh,
  }
}

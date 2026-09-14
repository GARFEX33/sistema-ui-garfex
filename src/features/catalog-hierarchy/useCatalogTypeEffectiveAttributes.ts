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
}>
type Request = Readonly<{
  key: string
  generation: number
  controller: AbortController
}>
const waiting: State = {
  key: null,
  status: 'waiting-context',
  attributes: [],
  error: null,
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
      commit(waiting)
      setSelected(null)
      return
    }
    const controller = new AbortController()
    const request = { key, generation: requestGeneration, controller }
    inFlight.current?.controller.abort()
    inFlight.current = request
    commit({ key, status: 'loading', attributes: [], error: null })
    setSelected(null)
    const isCurrent = () =>
      currentRef.current.key === key &&
      generation.current === requestGeneration &&
      inFlight.current === request &&
      !controller.signal.aborted
    void apiRef.current
      .getEffectiveAttributes({ ...snapshot, signal: controller.signal })
      .then((response) => {
        if (!isCurrent()) return
        commit({
          key,
          status: response.attributes.length === 0 ? 'empty' : 'ready',
          attributes: response.attributes,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return
        commit({
          key,
          status: 'error',
          attributes: [],
          error: error instanceof Error ? error : new Error('Request failed'),
        })
      })
      .finally(() => {
        if (isCurrent()) inFlight.current = undefined
      })

    return () => controller.abort()
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
    commit({ key: current.key, status: 'loading', attributes: [], error: null })
    setSelected(null)
    setAttempt((value) => value + 1)
  }, [commit])
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
    selectedAttributeCode: current ? selected : null,
    selectAttribute,
    retry,
  }
}

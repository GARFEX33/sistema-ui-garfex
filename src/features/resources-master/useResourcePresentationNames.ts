import { useEffect, useRef, useState } from 'react'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import {
  buildResourcePresentationName,
  resolveAttributeDisplayValues,
} from './resourcePresentation'
import type { ResourcesMasterRestReadApi } from './resourcesMaster.api'
import type { Resource } from './resourcesMaster.types'

export type ResourcePresentationNameStatus = 'loading' | 'ready' | 'error'

export interface ResourcePresentationNameState {
  status: ResourcePresentationNameStatus
  name?: string
  // Slice D2: every attribute value the resource holds, resolved to display
  // text the same way the presentation name resolves its positioned subset
  // (CONTROLLED_OPTION -> label, else formatCatalogValueText). Additive to
  // the hook's existing contract — always present, empty while
  // loading/error since nothing has been resolved yet.
  searchableValues: readonly string[]
  error?: unknown
}

type TypeKey = string

const typeKeyOf = (scope: {
  classCode: string
  familyCode: string
  typeCode: string
}): TypeKey => `${scope.classCode} ${scope.familyCode} ${scope.typeCode}`

interface TypeCacheEntry {
  status: 'loading' | 'ready' | 'error'
  attributes?: EffectiveAttribute[]
  error?: unknown
}

// Mirrors the generation-guarded fetch pattern in
// useResourceCreationEffectiveAttributes.ts / useResourceCreationUnits.ts,
// but keyed per distinct Tipo (classCode/familyCode/typeCode) instead of a
// single active request: a Tipo's effective attributes never change for the
// lifetime of this hook instance, so once resolved they are cached in a ref
// that survives re-renders/re-invocations with an overlapping `resources`
// set (e.g. paginating back to an already-seen Tipo never re-fetches it).
export function useResourcePresentationNames(
  api: Pick<ResourcesMasterRestReadApi, 'getTypeEffectiveAttributes'>,
  resources: readonly Resource[],
): Record<string, ResourcePresentationNameState> {
  const cache = useRef(new Map<TypeKey, TypeCacheEntry>())
  const unmounted = useRef(false)
  const [, setVersion] = useState(0)

  // Guard against setting state after unmount. Must reset to `false` on
  // setup, not only flip to `true` on cleanup: React 18 StrictMode replays
  // effects (mount -> cleanup -> mount) once in development, and without
  // this reset the cleanup's `true` from that synthetic unmount would
  // never be undone, permanently discarding every later fetch resolution
  // and leaving every cache entry stuck at `loading`.
  useEffect(() => {
    unmounted.current = false
    return () => {
      unmounted.current = true
    }
  }, [])

  useEffect(() => {
    for (const resource of resources) {
      const key = typeKeyOf(resource.scope)
      if (cache.current.has(key)) continue
      cache.current.set(key, { status: 'loading' })
      void api
        .getTypeEffectiveAttributes({
          classCode: resource.scope.classCode,
          familyCode: resource.scope.familyCode,
          typeCode: resource.scope.typeCode,
        })
        .then((response) => {
          if (unmounted.current) return
          cache.current.set(key, {
            status: 'ready',
            attributes: response.attributes,
          })
          setVersion((value) => value + 1)
        })
        .catch((error: unknown) => {
          if (unmounted.current) return
          cache.current.set(key, { status: 'error', error })
          setVersion((value) => value + 1)
        })
    }
  }, [api, resources])

  const result: Record<string, ResourcePresentationNameState> = {}
  for (const resource of resources) {
    const key = typeKeyOf(resource.scope)
    const entry = cache.current.get(key)
    if (entry === undefined || entry.status === 'loading') {
      result[resource.id] = { status: 'loading', searchableValues: [] }
      continue
    }
    if (entry.status === 'error') {
      result[resource.id] = {
        status: 'error',
        error: entry.error,
        searchableValues: [],
      }
      continue
    }
    result[resource.id] = {
      status: 'ready',
      name: buildResourcePresentationName(entry.attributes ?? [], resource),
      searchableValues: resolveAttributeDisplayValues(
        entry.attributes ?? [],
        resource,
      ),
    }
  }
  return result
}

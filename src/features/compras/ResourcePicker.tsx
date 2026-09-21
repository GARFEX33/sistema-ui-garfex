import { useEffect, useRef, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { StagedSearchSelector } from '../resources-master/StagedSearchSelector'
import type { ResourcesMasterRestReadApi } from '../resources-master/resourcesMaster.api'
import type { Resource } from '../resources-master/resourcesMaster.types'
import {
  useResourcePresentationNames,
  type ResourcePresentationNameState,
} from '../resources-master/useResourcePresentationNames'
import { useResourcesMasterRestWindow } from '../resources-master/useResourcesMasterRestWindow'

export interface ResourcePickerProps {
  api: ResourcesMasterRestReadApi
  selected: Resource | null
  disabled: boolean
  onSelect: (resource: Resource | null) => void
  refreshSignal?: number
}

const resourcePresentationPrimary = (
  presentation: ResourcePresentationNameState | undefined,
) => {
  if (presentation?.status === 'ready')
    return presentation.name ?? 'Nombre no disponible'
  if (presentation?.status === 'error') return 'Nombre no disponible'
  return 'Cargando nombre…'
}

const resourcePresentationLabel = (
  resource: Resource,
  presentation: ResourcePresentationNameState | undefined,
) =>
  `${resourcePresentationPrimary(presentation)} — Unidad: ${resource.naturalUnit} · ID: ${resource.id}`

export function ResourcePicker({
  api,
  selected,
  disabled,
  onSelect,
  refreshSignal,
}: ResourcePickerProps) {
  const window = useResourcesMasterRestWindow(api, {
    text: '',
    scope: 'ACTIVE',
    limit: 20,
  })
  const presentationNames = useResourcePresentationNames(api, window.resources)
  const [direction, setDirection] = useState<'anterior' | 'siguiente'>(
    'siguiente',
  )
  const { refetchActive } = window
  const previousRefreshSignal = useRef<number | undefined>(refreshSignal)
  useEffect(() => {
    if (refreshSignal === undefined) {
      previousRefreshSignal.current = undefined
      return
    }
    if (
      previousRefreshSignal.current === undefined ||
      previousRefreshSignal.current === refreshSignal
    ) {
      previousRefreshSignal.current = refreshSignal
      return
    }
    previousRefreshSignal.current = refreshSignal
    void refetchActive().catch(() => undefined)
  }, [refreshSignal, refetchActive])
  const navigationError = window.status === 'navigation-error'
  const navigating = window.status === 'navigating'
  const showSelector = !disabled && !navigating && !navigationError
  const loadState =
    window.status === 'initial-loading'
      ? { status: 'loading' as const }
      : window.status === 'initial-error'
        ? { status: 'initial-error' as const }
        : window.status === 'empty'
          ? { status: 'empty' as const }
          : { status: 'ready' as const, exhausted: !window.hasNext }
  const move = (side: 'anterior' | 'siguiente') => {
    setDirection(side)
    if (side === 'anterior') window.previous()
    else window.next()
  }

  return (
    <div className="grid gap-3">
      {showSelector && (
        <StagedSearchSelector
          label="Recurso maestro activo"
          autoFocus
          items={window.resources}
          itemKey={(item) => item.id}
          itemName={(item) =>
            resourcePresentationLabel(item, presentationNames[item.id])
          }
          renderItem={(item) => {
            const presentation = presentationNames[item.id]
            return (
              <span className="grid min-w-0 text-left">
                <span className="block break-words font-bold text-text-primary">
                  {resourcePresentationPrimary(presentation)}
                </span>
                <span className="block text-xs text-text-secondary">
                  {`Unidad: ${item.naturalUnit} · ID: ${item.id}`}
                </span>
              </span>
            )
          }}
          confirmedKey={selected?.id ?? null}
          loadState={loadState}
          maxVisibleRows={20}
          onConfirm={onSelect}
          onLoadMore={() => undefined}
          onRetry={() => void window.retry()}
        />
      )}
      {(navigating || navigationError) && (
        <div
          role={navigationError ? 'alert' : 'status'}
          aria-live="polite"
          className="text-sm text-text-secondary"
        >
          {navigationError
            ? `No se pudo cargar la página ${direction}.`
            : 'Cargando la página solicitada…'}{' '}
          {navigationError && (
            <Button
              variant="outline"
              onPress={() => void window.retry()}
              isDisabled={disabled}
            >
              Reintentar página {direction}
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Paginación de recursos">
        <Button
          variant="outline"
          aria-label="Página anterior"
          isDisabled={disabled || navigating || !window.hasPrevious}
          onPress={() => move('anterior')}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          aria-label="Página siguiente"
          isDisabled={disabled || navigating || !window.hasNext}
          onPress={() => move('siguiente')}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

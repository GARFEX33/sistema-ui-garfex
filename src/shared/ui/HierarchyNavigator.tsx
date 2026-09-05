import type { ReactNode } from 'react'
import type { ParentGatedListStatus } from '../hierarchy/parentGatedListController'

export interface HierarchyNavigatorItem {
  id: string
  label: ReactNode
}

export interface HierarchyNavigatorListState {
  status: ParentGatedListStatus
  isExhausted: boolean
}

export interface HierarchyNavigatorSpatialMetadata {
  id: (item: HierarchyNavigatorItem) => string
  column?: string
  metadata?: Readonly<Record<string, string | undefined>>
}

export interface HierarchyNavigatorClassNames {
  root?: string
  column?: string
  region?: string
  heading?: string
  items?: string
  row?: string
  selectedRow?: string
  childIndicator?: string
  state?: string
}

export interface HierarchyNavigatorLabels {
  loading?: string
  empty?: string
  retry?: string
  partial?: string
  retryContinuation?: string
  loadMore?: string
}

export interface HierarchyNavigatorColumn {
  id: string
  label: string
  items: readonly HierarchyNavigatorItem[]
  selectedId?: string
  waitingLabel?: string
  state?: HierarchyNavigatorListState
  onSelect?: (id: string) => void
  onContinue?: () => void
  onRetry?: () => void
  hasChildren?: boolean
  spatial?: HierarchyNavigatorSpatialMetadata
  labels?: HierarchyNavigatorLabels
  testIds?: { childIndicator?: string }
}

export interface HierarchyNavigatorProps {
  columns: readonly [
    HierarchyNavigatorColumn,
    HierarchyNavigatorColumn,
    HierarchyNavigatorColumn,
  ]
  className?: string
  classNames?: HierarchyNavigatorClassNames
}

const join = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ')

const defaults = {
  root: 'grid grid-cols-3 gap-3.5',
  column: 'min-w-0',
  region: 'min-w-0',
  heading: 'm-0 mb-4.5 text-xs font-bold tracking-wider',
  items: 'grid content-start gap-2',
  row: 'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-transparent bg-transparent px-2.5 py-2.5 text-left text-sm text-text-primary transition-colors duration-100 ease-in-out',
  selectedRow: 'border-accent bg-primary-subtle',
  childIndicator:
    'pointer-events-none text-xl leading-none text-text-secondary',
  state: 'm-0 text-sm leading-6 text-text-secondary',
} satisfies Required<HierarchyNavigatorClassNames>

const defaultLabels = {
  loading: 'Loading…',
  empty: 'Confirmed empty state',
  retry: 'Retry',
  partial: 'Partial list',
  retryContinuation: 'Retry continuation',
  loadMore: 'Load more…',
} satisfies Required<HierarchyNavigatorLabels>

function HierarchyNavigatorRegion({
  column,
  classNames,
}: {
  column: HierarchyNavigatorColumn
  classNames?: HierarchyNavigatorClassNames
}) {
  const labels = { ...defaultLabels, ...column.labels }
  const isWaiting = column.state?.status === 'waiting-for-parent'
  const isLoading =
    column.state?.status === 'initial-loading' ||
    column.state?.status === 'loading-more'
  const initialError = column.state?.status === 'initial-error'
  const partialError = column.state?.status === 'partial-error'
  const classes = { ...defaults, ...classNames }

  return (
    <section className={classes.region} aria-label={column.label}>
      <h3 className={classes.heading}>{column.label.toUpperCase()}</h3>
      <div className={classes.items}>
        {column.items.length ? (
          column.items.map((item) => {
            const selected = item.id === column.selectedId
            return (
              <button
                className={join(classes.row, selected && classes.selectedRow)}
                key={item.id}
                type="button"
                aria-pressed={selected}
                data-spatial-id={column.spatial?.id(item)}
                data-spatial-column={column.spatial?.column}
                {...column.spatial?.metadata}
                onClick={() => column.onSelect?.(item.id)}
              >
                {item.label}
                {column.hasChildren && (
                  <span
                    className={classes.childIndicator}
                    data-testid={column.testIds?.childIndicator}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                )}
              </button>
            )
          })
        ) : isWaiting ? (
          <p className={classes.state}>{column.waitingLabel}</p>
        ) : isLoading ? (
          <p className={classes.state}>{labels.loading}</p>
        ) : initialError ? (
          <button type="button" onClick={column.onRetry}>
            {labels.retry}
          </button>
        ) : (
          <p className={classes.state}>{labels.empty}</p>
        )}
        {partialError && (
          <>
            <p className={classes.state}>{labels.partial}</p>
            <button type="button" onClick={column.onRetry}>
              {labels.retryContinuation}
            </button>
          </>
        )}
        {column.state?.status === 'ready' && !column.state.isExhausted && (
          <button type="button" onClick={column.onContinue}>
            {labels.loadMore}
          </button>
        )}
      </div>
    </section>
  )
}

export function HierarchyNavigator({
  columns,
  className,
  classNames,
}: HierarchyNavigatorProps) {
  const classes = { ...defaults, ...classNames }
  return (
    <div className={join(classes.root, className)}>
      {columns.map((column) => (
        <div className={classes.column} key={column.id}>
          <HierarchyNavigatorRegion column={column} classNames={classNames} />
        </div>
      ))}
    </div>
  )
}

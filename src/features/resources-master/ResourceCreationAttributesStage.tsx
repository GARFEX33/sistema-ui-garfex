import { Button } from '../../shared/ui/Button'
import {
  StagedSearchSelector,
  type SelectorLoadState,
} from './StagedSearchSelector'

export type ResourceCreationAttributeAssignmentView = Readonly<{
  current: number
  total: number
  applicability: 'REQUIRED' | 'OPTIONAL'
}>

export type ResourceCreationAttributeDefinitionView = Readonly<{
  name: string
  description?: string
}>

export type ResourceCreationAllowedValueView = Readonly<{
  key: string
  displayName: string
}>

type CurrentAssignmentView = Readonly<{
  assignment: ResourceCreationAttributeAssignmentView
}>

type RetryableCurrentAssignmentView = CurrentAssignmentView &
  Readonly<{
    onRetry: () => void
  }>

export type ResourceCreationAttributesStageView =
  | Readonly<{ status: 'evaluation-loading' }>
  | Readonly<{ status: 'evaluation-error'; onRetry: () => void }>
  | Readonly<{ status: 'evaluation-unavailable' }>
  | (RetryableCurrentAssignmentView &
      Readonly<{ status: 'definition-loading' }>)
  | (RetryableCurrentAssignmentView & Readonly<{ status: 'definition-error' }>)
  | (CurrentAssignmentView & Readonly<{ status: 'definition-unavailable' }>)
  | (CurrentAssignmentView &
      Readonly<{
        status: 'unsupported-free-capture'
        definition: ResourceCreationAttributeDefinitionView
        onOmit?: () => void
      }>)
  | (RetryableCurrentAssignmentView &
      Readonly<{
        status: 'selection-ready'
        definition: ResourceCreationAttributeDefinitionView
        values: readonly ResourceCreationAllowedValueView[]
        loadState: SelectorLoadState
        confirmedKey: string | null
        onConfirm: (value: ResourceCreationAllowedValueView) => void
        onLoadMore: () => void
        onOmit?: () => void
      }>)

export type ResourceCreationAttributesStageProps = Readonly<{
  view: ResourceCreationAttributesStageView
}>

const AssignmentHeader = ({
  assignment,
  definition,
}: CurrentAssignmentView &
  Readonly<{ definition?: ResourceCreationAttributeDefinitionView }>) => (
  <header className="grid gap-1">
    <h2 className="text-sm font-bold text-text-primary">
      Atributos · {assignment.current} de {assignment.total}
    </h2>
    {definition && (
      <>
        <h3 className="text-sm font-semibold text-text-primary">
          {definition.name}
        </h3>
        {definition.description && (
          <p className="text-sm text-text-secondary">
            {definition.description}
          </p>
        )}
      </>
    )}
    <p className="text-sm font-semibold text-text-secondary">
      {assignment.applicability === 'REQUIRED' ? 'Obligatorio' : 'Opcional'}
    </p>
  </header>
)

const OmitButton = ({
  assignment,
  onOmit,
}: CurrentAssignmentView & Readonly<{ onOmit?: () => void }>) =>
  assignment.applicability === 'OPTIONAL' && onOmit ? (
    <Button type="button" variant="outline" onPress={onOmit}>
      Omitir
    </Button>
  ) : null

export function ResourceCreationAttributesStage({
  view,
}: ResourceCreationAttributesStageProps) {
  if (view.status === 'evaluation-loading')
    return <p role="status">Evaluando los atributos…</p>
  if (view.status === 'evaluation-unavailable')
    return (
      <p role="status">
        La evaluación o la secuencia de atributos no está disponible.
      </p>
    )
  if (view.status === 'evaluation-error')
    return (
      <p role="alert">
        No se pudo evaluar la secuencia de atributos.{' '}
        <Button type="button" variant="outline" onPress={view.onRetry}>
          Reintentar
        </Button>
      </p>
    )

  if (view.status === 'definition-loading')
    return (
      <section aria-label="Etapa de atributos" className="grid gap-3">
        <AssignmentHeader assignment={view.assignment} />
        <p role="status">Cargando definición del atributo…</p>
      </section>
    )

  if (view.status === 'definition-unavailable')
    return (
      <section aria-label="Etapa de atributos" className="grid gap-3">
        <AssignmentHeader assignment={view.assignment} />
        <p role="status">La definición del atributo no está disponible.</p>
      </section>
    )

  if (view.status === 'definition-error')
    return (
      <section aria-label="Etapa de atributos" className="grid gap-3">
        <AssignmentHeader assignment={view.assignment} />
        <p role="alert">
          No se pudo cargar la definición del atributo.{' '}
          <Button type="button" variant="outline" onPress={view.onRetry}>
            Reintentar
          </Button>
        </p>
      </section>
    )

  if (view.status === 'unsupported-free-capture')
    return (
      <section aria-label="Etapa de atributos" className="grid gap-3">
        <AssignmentHeader
          assignment={view.assignment}
          definition={view.definition}
        />
        <p role="status">
          La captura libre de este atributo aún no está disponible.
        </p>
        <OmitButton assignment={view.assignment} onOmit={view.onOmit} />
      </section>
    )

  return (
    <section aria-label="Etapa de atributos" className="grid gap-3">
      <AssignmentHeader
        assignment={view.assignment}
        definition={view.definition}
      />
      <StagedSearchSelector
        autoFocus
        label={view.definition.name}
        items={view.values}
        itemKey={(value) => value.key}
        itemName={(value) => value.displayName}
        confirmedKey={view.confirmedKey}
        loadState={view.loadState}
        onConfirm={view.onConfirm}
        onLoadMore={view.onLoadMore}
        onRetry={view.onRetry}
      />
      <OmitButton assignment={view.assignment} onOmit={view.onOmit} />
    </section>
  )
}

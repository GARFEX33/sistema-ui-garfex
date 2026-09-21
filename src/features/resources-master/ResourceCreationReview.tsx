import { useEffect, useRef } from 'react'
import { Button } from '../../shared/ui/Button'
import { formatCatalogValueText } from './resourceAttributeDisplay'
import { projectResourceAttributes } from './resourceCreation.attributesFormProjection'
import { buildResourceCreatedMessage } from './resourceCreationMessages'
import { buildResourcePresentationName } from './resourcePresentation'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'
import type { ResourceRestCreateInput } from './resourcesMaster.types'
import type { UseResourceCreationSubmit } from './useResourceCreationSubmit'

const summaryRowClass = 'grid grid-cols-[7rem_1fr] items-baseline gap-2'

export interface ResourceCreationReviewScope {
  classCode: string
  className: string
  familyCode: string
  familyName: string
  typeCode: string
  typeName: string
}

export interface ResourceCreationReviewUnit {
  code: string
  name: string
  symbol: string
}

export interface ResourceCreationReviewProps {
  scope: ResourceCreationReviewScope
  unit: ResourceCreationReviewUnit
  attributes: readonly EffectiveAttribute[]
  values: Record<string, unknown>
  submit: UseResourceCreationSubmit
}

const genericErrorMessage = 'No se pudo crear el recurso.'

const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim().length > 0
    ? error.message
    : genericErrorMessage

export function ResourceCreationReview({
  scope,
  unit,
  attributes,
  values,
  submit,
}: ResourceCreationReviewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [submit.status])

  if (submit.status === 'success' && submit.result) {
    return (
      <section aria-labelledby="resource-creation-review-heading">
        <h2
          className="m-0 text-lg"
          id="resource-creation-review-heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Recurso creado
        </h2>
        <p className="mt-2 text-text-secondary" role="status">
          {buildResourceCreatedMessage(scope.typeName)}
        </p>
      </section>
    )
  }

  if (submit.status === 'error') {
    return (
      <section aria-labelledby="resource-creation-review-heading">
        <h2
          className="m-0 text-lg"
          id="resource-creation-review-heading"
          ref={headingRef}
          tabIndex={-1}
        >
          No se pudo crear el recurso
        </h2>
        <p className="mt-2 text-text-secondary" role="alert">
          {errorMessage(submit.error)}
        </p>
        <div className="mt-4">
          <Button onPress={submit.reset} type="button" variant="outline">
            Volver a intentar
          </Button>
        </div>
      </section>
    )
  }

  const projected = projectResourceAttributes(attributes, values)
  const canCreate = projected !== null && submit.status !== 'submitting'
  const presentationName =
    projected !== null
      ? buildResourcePresentationName(attributes, {
          id: '',
          identityV1: '',
          scope: {
            classCode: scope.classCode,
            familyCode: scope.familyCode,
            typeCode: scope.typeCode,
          },
          naturalUnit: unit.code,
          active: true,
          revision: '',
          attributes: projected,
        })
      : null

  const handleCreate = () => {
    if (projected === null) return
    const input: ResourceRestCreateInput = {
      scope: {
        classCode: scope.classCode,
        familyCode: scope.familyCode,
        typeCode: scope.typeCode,
      },
      naturalUnit: unit.code,
      attributes: projected,
    }
    void submit.submit(input)
  }

  return (
    <section
      aria-labelledby="resource-creation-review-heading"
      className="grid gap-4"
      onKeyDown={(event) => {
        if (
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.key !== 'Enter' ||
          event.target instanceof HTMLButtonElement ||
          !canCreate
        )
          return
        event.preventDefault()
        handleCreate()
      }}
    >
      <h2
        className="m-0 text-lg"
        id="resource-creation-review-heading"
        ref={headingRef}
        tabIndex={-1}
      >
        Revisión de creación
      </h2>
      <dl className="m-0 grid gap-0.5 font-mono text-sm">
        <div className={summaryRowClass}>
          <dt className="text-text-secondary">Clase</dt>
          <dd className="m-0 text-text-primary">{scope.className}</dd>
        </div>
        <div className={summaryRowClass}>
          <dt className="text-text-secondary">Familia</dt>
          <dd className="m-0 text-text-primary">{scope.familyName}</dd>
        </div>
        <div className={summaryRowClass}>
          <dt className="text-text-secondary">Tipo</dt>
          <dd className="m-0 text-text-primary">{scope.typeName}</dd>
        </div>
        <div className={summaryRowClass}>
          <dt className="text-text-secondary">Unidad</dt>
          <dd className="m-0 text-text-primary">{`${unit.name} (${unit.symbol})`}</dd>
        </div>
      </dl>
      {projected !== null && projected.length > 0 && (
        <div className="grid gap-1">
          <h3 className="m-0 text-sm font-bold text-text-primary">Atributos</h3>
          <dl className="m-0 grid gap-0.5 font-mono text-sm">
            {projected.map((attribute) => {
              const definition = attributes.find(
                (candidate) => candidate.characteristic.code === attribute.code,
              )
              return (
                <div key={attribute.code} className={summaryRowClass}>
                  <dt className="text-text-secondary">
                    {definition?.characteristic.name ?? attribute.code}
                  </dt>
                  <dd className="m-0 text-text-primary">
                    {formatCatalogValueText(attribute.value)}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      )}
      {presentationName && (
        <div className="grid gap-1">
          <h3 className="m-0 text-sm font-bold text-text-primary">
            Nombre final
          </h3>
          <p className="m-0 font-mono text-sm text-text-primary">
            {presentationName}
          </p>
        </div>
      )}
      <div>
        {/* Secondary, mouse/accessibility affordance: Enter (wired above)
            is the primary, keyboard-first way to create the resource. */}
        <Button
          isDisabled={!canCreate}
          onPress={handleCreate}
          type="button"
          variant="outline"
        >
          {submit.status === 'submitting' ? 'Creando…' : 'Crear recurso'}
        </Button>
      </div>
    </section>
  )
}

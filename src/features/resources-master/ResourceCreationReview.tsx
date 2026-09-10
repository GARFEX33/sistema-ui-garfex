import { useEffect, useRef } from 'react'
import { Button } from '../../shared/ui/Button'
import type {
  ResourceCreationEvaluation,
  ResourceCreationResult,
} from './resourcesMaster.types'

export interface ResourceCreationReviewProps {
  evaluation: ResourceCreationEvaluation | null
  onCreate: () => void
  disabled?: boolean
  isCreating?: boolean
  result?: ResourceCreationResult
}

const statusCopy = {
  INCOMPLETE: 'La evaluación todavía está incompleta.',
  INVALID: 'La evaluación detectó inconsistencias.',
  VALID: 'La evaluación está lista para crear el recurso.',
} as const

const hasAuthorityText = (value: string | null) =>
  typeof value === 'string' && value.trim().length > 0

const resultOutcome = (result: ResourceCreationResult) => {
  switch (result.disposition) {
    case 'CREATED':
      return {
        heading: 'Recurso creado',
        message: `El recurso ${result.item.nombre} fue creado.`,
      }
    case 'CATALOG_CHANGED':
      return {
        heading: 'Catálogo actualizado',
        message: 'El catálogo cambió antes de crear el recurso.',
      }
    case 'INCOMPLETE':
      return {
        heading: 'Creación incompleta',
        message: 'La creación requiere correcciones antes de continuar.',
      }
    case 'INVALID':
      return {
        heading: 'Creación inválida',
        message: 'La creación requiere correcciones antes de continuar.',
      }
  }
}

export function ResourceCreationReview({
  evaluation,
  onCreate,
  disabled = false,
  isCreating = false,
  result,
}: ResourceCreationReviewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [result])

  if (result) {
    const outcome = resultOutcome(result)

    return (
      <section aria-labelledby="resource-creation-review-heading">
        <h2
          className="m-0 text-lg"
          id="resource-creation-review-heading"
          ref={headingRef}
          tabIndex={-1}
        >
          {outcome.heading}
        </h2>
        <p className="mt-2 text-text-secondary" role="status">
          {outcome.message}
        </p>
      </section>
    )
  }

  if (!evaluation) {
    return (
      <section aria-labelledby="resource-creation-review-heading">
        <h2
          className="m-0 text-lg"
          id="resource-creation-review-heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Revisión de creación
        </h2>
        <p className="mt-2 text-text-secondary" role="status">
          La evaluación de creación no está disponible.
        </p>
      </section>
    )
  }

  const canCreate =
    evaluation.status === 'VALID' &&
    evaluation.valid &&
    hasAuthorityText(evaluation.catalogFingerprint) &&
    hasAuthorityText(evaluation.nombre) &&
    hasAuthorityText(evaluation.identificadorTecnico)

  return (
    <section aria-labelledby="resource-creation-review-heading">
      <h2
        className="m-0 text-lg"
        id="resource-creation-review-heading"
        ref={headingRef}
        tabIndex={-1}
      >
        Revisión de creación
      </h2>
      <p className="mt-2 text-text-secondary" role="status">
        {statusCopy[evaluation.status]}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-text-secondary">
            Nombre generado
          </dt>
          <dd className="m-0 text-primary">{evaluation.nombre}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-text-secondary">
            Identificador técnico
          </dt>
          <dd className="m-0 text-primary">
            {evaluation.identificadorTecnico}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-text-secondary">
            Asignaciones
          </dt>
          <dd className="m-0 text-primary">
            {evaluation.asignaciones.length} asignaciones resueltas
          </dd>
        </div>
      </dl>
      {evaluation.issues.length > 0 && (
        <section
          aria-label="Incidencias de la evaluación"
          className="mt-4"
          role="alert"
        >
          <p className="m-0 font-semibold text-primary">Incidencias</p>
          <ul className="mb-0 mt-2 list-disc pl-5 text-text-secondary">
            {evaluation.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </section>
      )}
      {canCreate && (
        <div className="mt-4">
          <Button
            isDisabled={disabled || isCreating}
            onPress={onCreate}
            type="button"
          >
            {isCreating ? 'Creando…' : 'Crear recurso'}
          </Button>
        </div>
      )}
    </section>
  )
}

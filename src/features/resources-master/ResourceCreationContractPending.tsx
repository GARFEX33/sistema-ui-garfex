import { useEffect, useRef } from 'react'
import type { ResourceCreationEvaluationOwnership } from './resourcesMaster.types'

export interface ResourceCreationContractPendingProps {
  ownership: ResourceCreationEvaluationOwnership | null
}

export function ResourceCreationContractPending({
  ownership,
}: ResourceCreationContractPendingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    heading?.scrollIntoView?.({ block: 'nearest' })
    heading?.focus()
  }, [])

  return (
    <section aria-labelledby="resource-contract-pending-heading">
      <h2
        className="m-0 text-lg"
        id="resource-contract-pending-heading"
        ref={headingRef}
        tabIndex={-1}
      >
        Contrato pendiente
      </h2>
      <p className="mt-2 text-text-secondary" role="status">
        {ownership === null
          ? 'No se puede continuar hasta que el contexto actual defina la titularidad del recurso.'
          : 'La integración de evaluación de creación todavía está pendiente.'}
      </p>
    </section>
  )
}

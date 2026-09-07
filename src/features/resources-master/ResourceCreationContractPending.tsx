import { useEffect, useRef } from 'react'

export function ResourceCreationContractPending() {
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
        La continuación requiere el contrato backend v1 para atributos y
        creación.
      </p>
    </section>
  )
}

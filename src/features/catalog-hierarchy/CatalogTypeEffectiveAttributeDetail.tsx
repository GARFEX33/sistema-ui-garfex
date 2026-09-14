import type { ReactNode } from 'react'
import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'
import { Button } from '../../shared/ui/Button'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeading,
} from '../../shared/ui/Dialog'
import type { EffectiveAttribute } from './catalogTypeEffectiveAttributes.types'

const booleanLabel = (value: boolean) => (value ? 'Sí' : 'No')

const assertNever = (value: never): never => {
  throw new Error(`Unsupported CatalogValue: ${value}`)
}

const valueContent = (value: CatalogValue): ReactNode => {
  switch (value.kind) {
    case 'TEXT':
    case 'CODE':
    case 'INTEGER':
    case 'DECIMAL':
    case 'ENUM':
    case 'CONTROLLED_OPTION':
      return value.value
    case 'BOOLEAN':
      return booleanLabel(value.value)
    case 'QUANTITY':
      return `${value.value} ${value.unitCode}`
    case 'REFERENCE':
      return `${value.reference.kind} · ${value.reference.id} · ${value.reference.code}`
    case 'STRING_LIST':
      return (
        <ul
          aria-label="Valores de lista"
          className="m-0 list-disc space-y-1 pl-5"
        >
          {value.values.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )
    case 'NOT_APPLICABLE':
      return 'No aplica'
    default:
      return assertNever(value)
  }
}

function DetailSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-lg border border-border bg-surface-subtle p-4"
    >
      <h3 id={id} className="m-0 text-sm font-bold text-text-primary">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Pair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-text-secondary">
        {label}
      </dt>
      <dd className="m-0 break-words text-sm text-text-primary">{value}</dd>
    </div>
  )
}

export function CatalogTypeEffectiveAttributeDetail({
  attribute,
  isOpen,
  onOpenChange,
}: {
  attribute: EffectiveAttribute
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const { characteristic, source } = attribute

  return (
    <Dialog
      aria-label={`Detalle de ${characteristic.name}`}
      isOpen={isOpen}
      isDismissable
      onOpenChange={onOpenChange}
    >
      <DialogHeading title={`Detalle de ${characteristic.name}`} />
      <DialogContent>
        <div className="space-y-4">
          <DetailSection id="effective-detail-summary" title="Resumen">
            <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <Pair label="Característica" value={characteristic.name} />
              <Pair label="Código" value={characteristic.code} />
              <Pair label="Tipo de valor" value={characteristic.valueType} />
              {characteristic.dimension && (
                <Pair label="Dimensión" value={characteristic.dimension} />
              )}
              {attribute.hasPosition && (
                <Pair label="Posición" value={String(attribute.position)} />
              )}
            </dl>
          </DetailSection>
          <DetailSection
            id="effective-detail-applicability"
            title="Aplicabilidad"
          >
            <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <Pair label="Modo efectivo" value={attribute.effectiveMode} />
              <Pair label="Origen" value={`${source.level} · ${source.code}`} />
              <Pair
                label="Participa en identidad"
                value={booleanLabel(attribute.identityParticipates)}
              />
              <Pair
                label="No aplica"
                value={booleanLabel(attribute.notApplicable)}
              />
              {attribute.optionSetCode && (
                <Pair
                  label="Conjunto de opciones"
                  value={attribute.optionSetCode}
                />
              )}
            </dl>
          </DetailSection>
          <DetailSection id="effective-detail-options" title="Opciones">
            {attribute.options.length > 0 ? (
              <ul className="mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
                {attribute.options.map((option, index) => (
                  <li
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                    key={`${option.code}-${index}`}
                  >
                    <span className="font-semibold">{option.code}</span>
                    <span className="text-text-secondary">
                      {' '}
                      · {option.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-0 mt-3 text-sm text-text-secondary">
                Sin opciones de Core para este baseline.
              </p>
            )}
          </DetailSection>
          <DetailSection id="effective-detail-rules" title="Reglas">
            {attribute.rules.length > 0 ? (
              <ol className="mt-3 list-none space-y-2 p-0">
                {attribute.rules.map((rule, index) => (
                  <li
                    className="rounded-md border border-border bg-surface p-3"
                    key={`${rule.attributeCode}-${index}`}
                  >
                    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                      <Pair label="Característica" value={rule.attributeCode} />
                      <Pair label="Valor" value={valueContent(rule.equals)} />
                      <Pair label="Modo" value={rule.mode} />
                      <Pair
                        label="Participa en identidad"
                        value={booleanLabel(rule.identityParticipates)}
                      />
                      <Pair
                        label="No aplica"
                        value={booleanLabel(rule.notApplicable)}
                      />
                      <Pair label="Activa" value={booleanLabel(rule.active)} />
                    </dl>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mb-0 mt-3 text-sm text-text-secondary">
                Sin reglas.
              </p>
            )}
          </DetailSection>
        </div>
      </DialogContent>
      <DialogActions>
        <span className="text-xs text-text-secondary">Sólo lectura</span>
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          Cerrar detalle
        </Button>
      </DialogActions>
    </Dialog>
  )
}

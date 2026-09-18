import {
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react'
import type { CatalogValue } from '../../shared/catalog/catalogRest.contract'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogContent } from '../../shared/ui/Dialog'
import { hasRestActor } from '../../shared/api/restActor'
import { CatalogOptionsAdmin } from './CatalogOptionsAdmin'
import type { CatalogOptionsAdminApi } from './catalogOptionsAdmin.types'
import type { CatalogOptionsAdminSnapshot } from './useCatalogOptionsAdmin'
import type { EffectiveAttribute } from './catalogTypeEffectiveAttributes.types'
import { useCatalogOptionsAdmin } from './useCatalogOptionsAdmin'

type DetailTab = 'detail' | 'options'

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
  optionsApi,
  context,
  refreshEffective,
}: {
  attribute: EffectiveAttribute
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  optionsApi: CatalogOptionsAdminApi
  context: Readonly<{
    classCode?: string
    familyCode?: string
    typeCode?: string
  }>
  refreshEffective: (snapshot: CatalogOptionsAdminSnapshot) => Promise<boolean>
}) {
  const { characteristic, source } = attribute
  const ids = useId()
  const [selectedTab, setSelectedTab] = useState<DetailTab>('detail')
  const [focusedTab, setFocusedTab] = useState<DetailTab>('detail')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const tabs: readonly DetailTab[] = ['detail', 'options']
  const options = useCatalogOptionsAdmin(
    optionsApi,
    {
      sessionId: ids,
      classCode: selectedTab === 'options' ? context.classCode : undefined,
      familyCode: selectedTab === 'options' ? context.familyCode : undefined,
      typeCode: selectedTab === 'options' ? context.typeCode : undefined,
      optionSetCode:
        selectedTab === 'options' ? attribute.optionSetCode : undefined,
      characteristicCode:
        selectedTab === 'options' && attribute.optionSetCode
          ? characteristic.code
          : undefined,
    },
    refreshEffective,
  )
  const tabId = (tab: DetailTab) => `effective-attribute-${ids}-${tab}-tab`
  const panelId = (tab: DetailTab) => `effective-attribute-${ids}-${tab}-panel`

  const onTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined
    if (event.key === 'ArrowLeft')
      nextIndex = (index + tabs.length - 1) % tabs.length
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      setSelectedTab(tabs[index])
      return
    }
    if (nextIndex === undefined) return
    event.preventDefault()
    event.stopPropagation()
    const nextTab = tabs[nextIndex]
    setFocusedTab(nextTab)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <Dialog
      aria-label={`Detalle de ${characteristic.name}`}
      className="border-border shadow-lg"
      isOpen={isOpen}
      isDismissable
      layout="single-scroll"
      onOpenChange={onOpenChange}
    >
      <header className="flex flex-none items-center justify-between gap-4 border-b border-border pb-3">
        <h2 className="m-0 text-lg font-bold text-text-primary">
          {`Detalle de ${characteristic.name}`}
        </h2>
        <Button
          aria-label="Cerrar modal de detalle"
          className="min-h-0 border-border px-2 py-1 text-text-secondary hover:bg-surface-subtle"
          onPress={() => onOpenChange(false)}
          type="button"
          variant="outline"
        >
          ×
        </Button>
      </header>
      <DialogContent className="overflow-y-auto scroll-py-4">
        <div
          aria-label="Información y opciones del atributo"
          className="sticky top-0 z-10 mb-4 flex gap-1 border-b border-border bg-surface py-3"
          role="tablist"
        >
          {tabs.map((tab, index) => (
            <button
              aria-controls={panelId(tab)}
              aria-selected={selectedTab === tab}
              className={[
                'min-w-24 cursor-pointer rounded-md border-b-2 border-transparent px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2',
                selectedTab === tab
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
              ].join(' ')}
              id={tabId(tab)}
              key={tab}
              onClick={() => setSelectedTab(tab)}
              onFocus={() => setFocusedTab(tab)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              role="tab"
              tabIndex={focusedTab === tab ? 0 : -1}
              type="button"
            >
              {tab === 'detail' ? 'Detalle' : 'Opciones'}
            </button>
          ))}
        </div>
        {selectedTab === 'detail' ? (
          <div
            aria-labelledby={tabId('detail')}
            className="space-y-4"
            id={panelId('detail')}
            role="tabpanel"
          >
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
                <Pair
                  label="Origen"
                  value={`${source.level} · ${source.code}`}
                />
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
                        <Pair
                          label="Característica"
                          value={rule.attributeCode}
                        />
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
                        <Pair
                          label="Activa"
                          value={booleanLabel(rule.active)}
                        />
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
        ) : (
          <section
            aria-labelledby={tabId('options')}
            id={panelId('options')}
            role="tabpanel"
          >
            <CatalogOptionsAdmin
              actorAvailable={hasRestActor()}
              characteristicCode={characteristic.code}
              commandError={options.commandError}
              referenceError={options.referenceError}
              references={options.references}
              referenceStatus={options.referenceStatus}
              retryReferences={options.retryReferences}
              commandStatus={options.commandStatus}
              create={options.create}
              deactivate={options.deactivate}
              delete={options.delete}
              deleteAvailable={!!optionsApi.delete}
              error={options.error}
              hasNext={options.hasNext}
              hasPrevious={options.hasPrevious}
              limit={20}
              next={options.next}
              offset={options.offset}
              optionSetCode={attribute.optionSetCode}
              previous={options.previous}
              reactivate={options.reactivate}
              records={options.records}
              retry={options.retry}
              status={options.status}
              update={options.update}
            />
          </section>
        )}
      </DialogContent>
      <DialogActions>
        <aside
          aria-label="Atajos de teclado"
          className="flex flex-wrap items-center gap-1 text-xs text-text-secondary"
        >
          <span className="mr-1">Atajos:</span>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            ↑
          </kbd>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            ↓
          </kbd>
          <span>/</span>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            j
          </kbd>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            k
          </kbd>
          <span>navegar</span>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            Enter
          </kbd>
          <span>editar o abrir</span>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            n
          </kbd>
          <span>nueva</span>
          <kbd className="rounded border border-border bg-surface-subtle px-1 py-0.5 font-sans">
            Esc
          </kbd>
          <span>cerrar</span>
        </aside>
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          Cerrar detalle
        </Button>
      </DialogActions>
    </Dialog>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button as SelectTriggerButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components'
import { useKeyboardController } from '../../shared/keyboard/keyboardControllerContext'
import {
  isValidFocusCandidate,
  restoreFocusNextFrame,
} from '../../shared/keyboard/focusRestoration'
import { Button } from '../../shared/ui/Button'
import { Dialog, DialogActions, DialogHeading } from '../../shared/ui/Dialog'
import { Field, FieldSeparator } from '../../shared/ui/Field'
import { fieldInputClass } from '../../shared/ui/fieldStyles'
import type { ResourcesMasterApi } from './resourcesMaster.api'
import { useAutoClosingMessage } from './useAutoClosingMessage'
import type {
  ResourceAttributeApplicability,
  ResourceAttributeDataType,
  ResourceAttributeOption,
  ResourceContextClassItem,
  ResourceContextFamilyItem,
  ResourceContextTypeItem,
  ResourceId,
  ResourceSummary,
  ResourceUnitPolicy,
} from './resourcesMaster.types'

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  ADMIN_DUPLICATE_KEY:
    'Ya existe un recurso con esta combinación. Buscalo en el listado antes de crear uno nuevo.',
  ADMIN_INVALID_REFERENCE:
    'El catálogo cambió mientras completabas el formulario. Volvé al Paso 1 y elegí de nuevo.',
  ADMIN_INVALID_STATE:
    'No se pudo crear el recurso: los datos no cumplen las reglas del catálogo. Revisá el formulario.',
  ADMIN_INVALID_ARGUMENT:
    'No se pudo crear el recurso: hay un dato inválido. Revisá el formulario.',
  ADMIN_AGGREGATE_INCOMPLETE:
    'No se pudo crear el recurso: falta completar información del catálogo. Revisá el formulario.',
  ADMIN_DEPENDENCY_BLOCKED:
    'No se pudo crear el recurso: una dependencia lo impide. Revisá el formulario.',
  ADMIN_CONFLICT:
    'No se pudo crear el recurso: hay un conflicto con datos existentes. Revisá el formulario.',
  ADMIN_PUBLICATION_INVALID:
    'No se pudo crear el recurso: la publicación no es válida. Revisá el formulario.',
  ADMIN_NOT_FOUND:
    'No se pudo crear el recurso: no se encontró una referencia necesaria. Revisá el formulario.',
  ADMIN_IMMUTABLE_FIELD:
    'No se pudo crear el recurso: un campo no puede modificarse. Revisá el formulario.',
  ADMIN_STALE_REVISION:
    'No se pudo crear el recurso: los datos cambiaron. Revisá el formulario.',
}

const UNCERTAIN_MESSAGE =
  'No pudimos confirmar si el recurso se creó. No lo vuelvas a intentar con los mismos datos — buscá primero si ya aparece en el listado.'

const extractAdminCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined
  const data = (error as { data?: unknown }).data
  if (typeof data !== 'object' || data === null) return undefined
  const code = (data as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

type SubmitStatus = 'idle' | 'submitting' | 'created' | 'error' | 'uncertain'

type UnitOption = ResourceUnitPolicy & { nombre: string; simbolo?: string }

const unitLabel = (unit: UnitOption) =>
  unit.simbolo ? `${unit.nombre} (${unit.simbolo})` : unit.nombre

type AttributeField = {
  atributoRecursoId: ResourceId
  nombre: string
  tipoDato: ResourceAttributeDataType
  aplicabilidad: ResourceAttributeApplicability
  orden: number
  options: ResourceAttributeOption[]
}

export interface CrearRecursoSurfaceProps {
  api: ResourcesMasterApi
  onCreated?: () => void
}

type LevelState<T> = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: T[]
}

const idleLevel = <T,>(): LevelState<T> => ({ status: 'idle', items: [] })

function useLevel<T>() {
  const [state, setState] = useState<LevelState<T>>(idleLevel)
  const load = useCallback(async (fetcher: () => Promise<{ items: T[] }>) => {
    setState({ status: 'loading', items: [] })
    try {
      const page = await fetcher()
      setState({ status: 'ready', items: page.items })
    } catch {
      setState({ status: 'error', items: [] })
    }
  }, [])
  const clear = useCallback(() => setState(idleLevel), [])
  return [state, load, clear] as const
}

const key = (id: ResourceId) => String(id)

export function CrearRecursoSurface({ api, onCreated }: CrearRecursoSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const { registerAction, registerOverlay } = useKeyboardController()
  const [message, showMessage] = useAutoClosingMessage()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [classId, setClassId] = useState<ResourceId | null>(null)
  const [familyId, setFamilyId] = useState<ResourceId | null>(null)
  const [typeId, setTypeId] = useState<ResourceId | null>(null)
  const [unitId, setUnitId] = useState<ResourceId | null>(null)
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [created, setCreated] = useState<ResourceSummary | null>(null)

  const [classes, loadClasses] = useLevel<ResourceContextClassItem>()
  const [families, loadFamilies, clearFamilies] =
    useLevel<ResourceContextFamilyItem>()
  const [types, loadTypes, clearTypes] = useLevel<ResourceContextTypeItem>()
  const [units, loadUnits, clearUnits] = useLevel<UnitOption>()
  const [attributes, loadAttributes, clearAttributes] =
    useLevel<AttributeField>()

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback((opener: HTMLElement | null = triggerRef.current) => {
    openerRef.current = opener?.isConnected ? opener : null
    setStep(1)
    setClassId(null)
    setFamilyId(null)
    setTypeId(null)
    setUnitId(null)
    setAttributeValues({})
    setNombre('')
    setDescripcion('')
    setSubmitStatus('idle')
    setSubmitError(null)
    setCreated(null)
    clearFamilies()
    clearTypes()
    clearUnits()
    clearAttributes()
    setIsOpen(true)
  }, [clearFamilies, clearTypes, clearUnits, clearAttributes])

  const action = useMemo(
    () => ({
      id: 'resources.new-resource' as const,
      surface: 'recursos' as const,
      key: 'n',
      label: 'Nuevo recurso',
      root: () => triggerRef.current,
      isAvailable: () =>
        !isOpenRef.current && isValidFocusCandidate(triggerRef.current),
      run: open,
    }),
    [open],
  )

  useEffect(() => registerAction(action), [action, registerAction])
  useEffect(() => registerOverlay(() => dialogRef.current), [registerOverlay])

  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true
      void loadClasses(() => api.listContextClasses({}))
    } else if (wasOpen.current) {
      restoreFocusNextFrame(openerRef.current, [
        () => triggerRef.current,
        () => document.querySelector<HTMLElement>('[data-spatial-id="sidebar.recursos"]'),
      ])
      openerRef.current = null
      wasOpen.current = false
    }
    // loadClasses is stable (useCallback with no deps); api is expected to be
    // stable for the lifetime of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const resetAttributesIfNeeded = () => {
    const hadProgress =
      attributes.items.length > 0 || Object.keys(attributeValues).length > 0
    clearAttributes()
    setAttributeValues({})
    if (hadProgress) showMessage('Se limpiaron los atributos por cambio de Tipo')
  }

  const selectClass = (id: ResourceId) => {
    setClassId(id)
    setFamilyId(null)
    setTypeId(null)
    setUnitId(null)
    clearTypes()
    clearUnits()
    resetAttributesIfNeeded()
    void loadFamilies(() => api.listContextFamilies({ claseRecursoId: id }))
  }

  const selectFamily = (id: ResourceId) => {
    setFamilyId(id)
    setTypeId(null)
    setUnitId(null)
    clearUnits()
    resetAttributesIfNeeded()
    void loadTypes(() => api.listContextTypes({ familiaRecursoId: id }))
  }

  const selectType = (id: ResourceId) => {
    setTypeId(id)
    setUnitId(null)
    resetAttributesIfNeeded()
    void loadUnits(async () => {
      const page = await api.listUnitPolicies({ tipoRecursoId: id })
      const effective = page.items.filter((item) => item.effective)
      const withNames = await Promise.all(
        effective.map(async (item) => {
          const unit = await api.getUnit({ unidadId: item.unidadId })
          return { ...item, nombre: unit?.nombre ?? key(item.unidadId), simbolo: unit?.simbolo }
        }),
      )
      const preselected =
        withNames.find((item) => item.principal) ??
        withNames.find((item) => item.selected) ??
        null
      if (preselected) setUnitId(preselected.unidadId)
      return { items: withNames }
    })
  }

  const canGoNext =
    classId !== null && familyId !== null && typeId !== null && unitId !== null

  const loadStep2 = (forTypeId: ResourceId) =>
    loadAttributes(async () => {
      const page = await api.listAttributeAssignments({ tipoRecursoId: forTypeId })
      const effective = page.items.filter(
        (item) =>
          item.effective &&
          item.aplicabilidad !== 'FORBIDDEN' &&
          item.aplicabilidad !== 'NOT_APPLICABLE',
      )
      const resolved = await Promise.all(
        effective.map(async (assignment) => {
          const definition = await api.getAttributeDefinition({
            definicionAtributoId: assignment.definicionAtributoId,
          })
          if (!definition) return null
          let options: ResourceAttributeOption[] = []
          if (definition.tipoDato === 'OPCION') {
            const optionsPage = await api.listAttributeOptions({
              definicionAtributoId: assignment.definicionAtributoId,
            })
            options = optionsPage.items.filter((option) => option.effective)
          }
          const field: AttributeField = {
            atributoRecursoId: assignment.id,
            nombre: definition.nombre,
            tipoDato: definition.tipoDato,
            aplicabilidad: assignment.aplicabilidad,
            orden: assignment.orden,
            options,
          }
          return field
        }),
      )
      const fields = resolved
        .filter((field): field is AttributeField => field !== null)
        .sort((left, right) => left.orden - right.orden)
      return { items: fields }
    })

  const goToAttributes = () => {
    if (!canGoNext || typeId === null) return
    setStep(2)
    void loadStep2(typeId)
  }

  const backToContext = () => setStep(1)

  const setAttributeValue = (atributoRecursoId: ResourceId, value: string) => {
    setAttributeValues((current) => ({
      ...current,
      [key(atributoRecursoId)]: value,
    }))
  }

  const attributesComplete =
    attributes.status === 'ready' &&
    attributes.items
      .filter((field) => field.aplicabilidad === 'REQUIRED')
      .every((field) => {
        const value = attributeValues[key(field.atributoRecursoId)]
        return value !== undefined && value !== ''
      })

  const goToReview = () => {
    if (!attributesComplete) return
    setStep(3)
  }

  const backToAttributes = () => setStep(2)

  const selectedClassName = classes.items.find((c) => key(c.id) === key(classId))?.nombre ?? ''
  const selectedFamilyName = families.items.find((f) => key(f.id) === key(familyId))?.nombre ?? ''
  const selectedTypeName = types.items.find((t) => key(t.id) === key(typeId))?.nombre ?? ''
  const selectedUnit = units.items.find((u) => key(u.unidadId) === key(unitId))

  const attributeSummaryValue = (field: AttributeField): string => {
    const raw = attributeValues[key(field.atributoRecursoId)]
    if (raw === undefined || raw === '') return ''
    if (field.tipoDato === 'OPCION')
      return field.options.find((o) => key(o.id) === raw)?.nombre ?? raw
    if (field.tipoDato === 'BOOLEANO') return raw === 'true' ? 'Sí' : 'No'
    return raw
  }

  const buildValores = () => {
    const result: Record<string, unknown>[] = []
    for (const field of attributes.items) {
      const raw = attributeValues[key(field.atributoRecursoId)]
      if (raw === undefined || raw === '') continue
      if (field.tipoDato === 'OPCION') {
        const option = field.options.find((o) => key(o.id) === raw)
        if (!option) continue
        result.push({
          atributoRecursoId: field.atributoRecursoId,
          valor: option.nombre,
          opcionAtributoId: option.id,
        })
      } else if (field.tipoDato === 'BOOLEANO') {
        result.push({ atributoRecursoId: field.atributoRecursoId, valor: raw === 'true' })
      } else if (field.tipoDato === 'NUMERO') {
        result.push({ atributoRecursoId: field.atributoRecursoId, valor: Number(raw) })
      } else {
        result.push({ atributoRecursoId: field.atributoRecursoId, valor: raw })
      }
    }
    return result
  }

  const submit = async () => {
    if (
      submitStatus === 'submitting' ||
      nombre.trim() === '' ||
      classId === null ||
      familyId === null ||
      typeId === null ||
      unitId === null
    )
      return
    setSubmitStatus('submitting')
    setSubmitError(null)
    try {
      const result = await api.createResource({
        claseRecursoId: classId,
        familiaRecursoId: familyId,
        tipoRecursoId: typeId,
        unidadId: unitId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() === '' ? undefined : descripcion.trim(),
        valores: buildValores(),
        ownership: { kind: 'GLOBAL' },
      })
      setCreated(result.item)
      setSubmitStatus('created')
      onCreated?.()
    } catch (error) {
      const code = extractAdminCode(error)
      if (code && code in ADMIN_ERROR_MESSAGES) {
        setSubmitError(ADMIN_ERROR_MESSAGES[code])
        setSubmitStatus('error')
      } else {
        setSubmitError(UNCERTAIN_MESSAGE)
        setSubmitStatus('uncertain')
      }
    }
  }

  return (
    <div className="resources-create-surface">
      <Button ref={triggerRef} aria-label="Nuevo recurso" onPress={() => open(triggerRef.current)}>
        <span>Nuevo recurso</span>
        <kbd>N</kbd>
      </Button>

      <Dialog
        ref={dialogRef}
        isOpen={isOpen}
        onOpenChange={(openState) => !openState && close()}
        aria-label="Nuevo recurso"
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              close()
            }
          }}
        >
            <DialogHeading title="Nuevo recurso" />
            <div className="resources-dialog-content">
              <p className="resources-dialog-step">
                {step === 1
                  ? 'Paso 1 de 3 — Contexto'
                  : step === 2
                    ? 'Paso 2 de 3 — Atributos'
                    : submitStatus === 'created'
                      ? 'Recurso creado'
                      : 'Paso 3 de 3 — Revisión'}
              </p>
              {message && (
                <p role="status" className="resources-dialog-notice">
                  {message}
                </p>
              )}

              {step === 1 && (
              <>
              <div className="resources-context-field">
                <Select
                  aria-label="Clase"
                  placeholder="Elegir Clase…"
                  isDisabled={classes.status === 'loading'}
                  selectedKey={classId === null ? null : key(classId)}
                  onSelectionChange={(id) => {
                    const item = classes.items.find((c) => key(c.id) === id)
                    if (item) selectClass(item.id)
                  }}
                >
                  <Label>Clase</Label>
                  <SelectTriggerButton className="resources-select-trigger">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </SelectTriggerButton>
                  <Popover>
                    <ListBox items={classes.items}>
                      {(item) => (
                        <ListBoxItem id={key(item.id)} textValue={item.nombre}>
                          {item.nombre}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                </Select>
                {classes.status === 'error' && (
                  <p role="alert" className="resources-context-error">
                    No se pudieron cargar las Clases.{' '}
                    <button
                      type="button"
                      onClick={() => void loadClasses(() => api.listContextClasses({}))}
                    >
                      Reintentar
                    </button>
                  </p>
                )}
              </div>

              <div className="resources-context-field">
                <Select
                  aria-label="Familia"
                  placeholder="Elegir Familia…"
                  isDisabled={classId === null || families.status === 'loading'}
                  selectedKey={familyId === null ? null : key(familyId)}
                  onSelectionChange={(id) => {
                    const item = families.items.find((f) => key(f.id) === id)
                    if (item) selectFamily(item.id)
                  }}
                >
                  <Label>Familia</Label>
                  <SelectTriggerButton className="resources-select-trigger">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </SelectTriggerButton>
                  <Popover>
                    <ListBox items={families.items}>
                      {(item) => (
                        <ListBoxItem id={key(item.id)} textValue={item.nombre}>
                          {item.nombre}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                </Select>
                {families.status === 'error' && (
                  <p role="alert" className="resources-context-error">
                    No se pudieron cargar las Familias.{' '}
                    <button
                      type="button"
                      onClick={() =>
                        classId !== null &&
                        void loadFamilies(() =>
                          api.listContextFamilies({ claseRecursoId: classId }),
                        )
                      }
                    >
                      Reintentar
                    </button>
                  </p>
                )}
              </div>

              <div className="resources-context-field">
                <Select
                  aria-label="Tipo"
                  placeholder="Elegir Tipo…"
                  isDisabled={familyId === null || types.status === 'loading'}
                  selectedKey={typeId === null ? null : key(typeId)}
                  onSelectionChange={(id) => {
                    const item = types.items.find((t) => key(t.id) === id)
                    if (item) selectType(item.id)
                  }}
                >
                  <Label>Tipo</Label>
                  <SelectTriggerButton className="resources-select-trigger">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </SelectTriggerButton>
                  <Popover>
                    <ListBox items={types.items}>
                      {(item) => (
                        <ListBoxItem id={key(item.id)} textValue={item.nombre}>
                          {item.nombre}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                </Select>
                {types.status === 'error' && (
                  <p role="alert" className="resources-context-error">
                    No se pudieron cargar los Tipos.{' '}
                    <button
                      type="button"
                      onClick={() =>
                        familyId !== null &&
                        void loadTypes(() =>
                          api.listContextTypes({ familiaRecursoId: familyId }),
                        )
                      }
                    >
                      Reintentar
                    </button>
                  </p>
                )}
              </div>

              <div className="resources-context-field">
                <Select
                  aria-label="Unidad natural"
                  placeholder="Elegir Unidad natural…"
                  isDisabled={typeId === null || units.status === 'loading'}
                  selectedKey={unitId === null ? null : key(unitId)}
                  onSelectionChange={(id) => {
                    const item = units.items.find((u) => key(u.unidadId) === id)
                    if (item) setUnitId(item.unidadId)
                  }}
                >
                  <Label>Unidad natural</Label>
                  <SelectTriggerButton className="resources-select-trigger">
                    <SelectValue />
                    <span aria-hidden="true">▾</span>
                  </SelectTriggerButton>
                  <Popover>
                    <ListBox items={units.items}>
                      {(item) => (
                        <ListBoxItem
                          id={key(item.unidadId)}
                          textValue={unitLabel(item)}
                        >
                          {unitLabel(item)}
                          {item.principal ? ' — principal' : ''}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                </Select>
                {units.status === 'error' && (
                  <p role="alert" className="resources-context-error">
                    No se pudo cargar la Unidad natural.{' '}
                    <button
                      type="button"
                      onClick={() => typeId !== null && selectType(typeId)}
                    >
                      Reintentar
                    </button>
                  </p>
                )}
              </div>
              </>
              )}

              {step === 2 && (
              <>
              {attributes.status === 'loading' && (
                <p className="resources-context-error" role="status">
                  Cargando atributos…
                </p>
              )}
              {attributes.status === 'error' && (
                <p role="alert" className="resources-context-error">
                  No se pudieron cargar los atributos.{' '}
                  <button
                    type="button"
                    onClick={() => typeId !== null && void loadStep2(typeId)}
                  >
                    Reintentar
                  </button>
                </p>
              )}
              {attributes.status === 'ready' && attributes.items.length === 0 && (
                <p className="resources-context-error" role="status">
                  Este Tipo no tiene atributos configurados.
                </p>
              )}
              {attributes.items.map((field) => {
                const fieldKey = key(field.atributoRecursoId)
                const required = field.aplicabilidad === 'REQUIRED'
                const label = required ? `${field.nombre} *` : field.nombre
                const value = attributeValues[fieldKey] ?? ''
                return (
                  <div className="resources-context-field" key={fieldKey}>
                    {field.tipoDato === 'OPCION' && (
                      <Select
                        aria-label={label}
                        placeholder="Elegir…"
                        isRequired={required}
                        selectedKey={value === '' ? null : value}
                        onSelectionChange={(id) =>
                          setAttributeValue(field.atributoRecursoId, String(id))
                        }
                      >
                        <Label>{label}</Label>
                        <SelectTriggerButton className="resources-select-trigger">
                          <SelectValue />
                          <span aria-hidden="true">▾</span>
                        </SelectTriggerButton>
                        <Popover>
                          <ListBox items={field.options}>
                            {(option) => (
                              <ListBoxItem
                                id={key(option.id)}
                                textValue={option.nombre}
                              >
                                {option.nombre}
                              </ListBoxItem>
                            )}
                          </ListBox>
                        </Popover>
                      </Select>
                    )}
                    {field.tipoDato === 'BOOLEANO' && (
                      <Select
                        aria-label={label}
                        placeholder="Elegir…"
                        isRequired={required}
                        selectedKey={value === '' ? null : value}
                        onSelectionChange={(id) =>
                          setAttributeValue(field.atributoRecursoId, String(id))
                        }
                      >
                        <Label>{label}</Label>
                        <SelectTriggerButton className="resources-select-trigger">
                          <SelectValue />
                          <span aria-hidden="true">▾</span>
                        </SelectTriggerButton>
                        <Popover>
                          <ListBox>
                            <ListBoxItem id="true" textValue="Sí">
                              Sí
                            </ListBoxItem>
                            <ListBoxItem id="false" textValue="No">
                              No
                            </ListBoxItem>
                          </ListBox>
                        </Popover>
                      </Select>
                    )}
                    {field.tipoDato === 'TEXTO' && (
                      <Field label={label} htmlFor={`attr-${fieldKey}`}>
                        <input
                          id={`attr-${fieldKey}`}
                          type="text"
                          className={fieldInputClass}
                          required={required}
                          value={value}
                          onChange={(event) =>
                            setAttributeValue(
                              field.atributoRecursoId,
                              event.target.value,
                            )
                          }
                        />
                      </Field>
                    )}
                    {field.tipoDato === 'NUMERO' && (
                      <Field label={label} htmlFor={`attr-${fieldKey}`}>
                        <input
                          id={`attr-${fieldKey}`}
                          type="number"
                          className={fieldInputClass}
                          required={required}
                          value={value}
                          onChange={(event) =>
                            setAttributeValue(
                              field.atributoRecursoId,
                              event.target.value,
                            )
                          }
                        />
                      </Field>
                    )}
                  </div>
                )
              })}
              </>
              )}

              {step === 3 && submitStatus === 'created' && created && (
                <div className="resources-context-field">
                  <p role="status">✓ Recurso creado</p>
                  <dl>
                    <div>
                      <dt>ID</dt>
                      <dd>{String(created.id)}</dd>
                    </div>
                    <div>
                      <dt>Identidad</dt>
                      <dd>{created.identificadorTecnico}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>{created.activo ? 'Activo' : 'Inactivo'}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {step === 3 && submitStatus !== 'created' && (
                <>
                  <Field label="Nombre" htmlFor="resource-nombre">
                    <input
                      id="resource-nombre"
                      type="text"
                      className={fieldInputClass}
                      value={nombre}
                      disabled={submitStatus === 'submitting'}
                      onChange={(event) => setNombre(event.target.value)}
                    />
                  </Field>
                  <Field label="Descripción" htmlFor="resource-descripcion">
                    <input
                      id="resource-descripcion"
                      type="text"
                      className={fieldInputClass}
                      value={descripcion}
                      disabled={submitStatus === 'submitting'}
                      onChange={(event) => setDescripcion(event.target.value)}
                    />
                  </Field>
                  <FieldSeparator />
                  <dl className="resources-context-field">
                    <div>
                      <dt>Clase</dt>
                      <dd>{selectedClassName}</dd>
                    </div>
                    <div>
                      <dt>Familia</dt>
                      <dd>{selectedFamilyName}</dd>
                    </div>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{selectedTypeName}</dd>
                    </div>
                    <div>
                      <dt>Unidad natural</dt>
                      <dd>{selectedUnit ? unitLabel(selectedUnit) : ''}</dd>
                    </div>
                  </dl>
                  {attributes.items.some((field) => attributeSummaryValue(field) !== '') && (
                    <ul className="resources-context-field">
                      {attributes.items.map((field) => {
                        const value = attributeSummaryValue(field)
                        if (value === '') return null
                        return (
                          <li key={key(field.atributoRecursoId)}>
                            {field.nombre}: {value}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {(submitStatus === 'error' || submitStatus === 'uncertain') && submitError && (
                    <p role="alert" className="resources-context-error">
                      {submitError}
                    </p>
                  )}
                </>
              )}
            </div>
            <DialogActions>
              {step === 1 && (
                <>
                  <Button variant="outline" onPress={close} type="button">
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    isDisabled={!canGoNext}
                    onPress={goToAttributes}
                  >
                    Siguiente
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <Button variant="outline" onPress={backToContext} type="button">
                    Volver
                  </Button>
                  <Button type="button" isDisabled={!attributesComplete} onPress={goToReview}>
                    Siguiente
                  </Button>
                </>
              )}
              {step === 3 &&
                submitStatus !== 'created' &&
                submitStatus !== 'uncertain' && (
                <>
                  <Button
                    variant="outline"
                    onPress={backToAttributes}
                    type="button"
                    isDisabled={submitStatus === 'submitting'}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    isDisabled={nombre.trim() === '' || submitStatus === 'submitting'}
                    onPress={() => void submit()}
                  >
                    Crear recurso
                  </Button>
                </>
              )}
              {step === 3 && submitStatus === 'uncertain' && (
                <>
                  <Button variant="outline" onPress={backToAttributes} type="button">
                    Volver
                  </Button>
                  <Button type="button" onPress={close}>
                    Cerrar y buscar en el listado
                  </Button>
                </>
              )}
              {step === 3 && submitStatus === 'created' && (
                <>
                  <Button variant="outline" onPress={() => open()} type="button">
                    Crear otro
                  </Button>
                  <Button type="button" onPress={close}>
                    Cerrar
                  </Button>
                </>
              )}
            </DialogActions>
        </div>
      </Dialog>
    </div>
  )
}

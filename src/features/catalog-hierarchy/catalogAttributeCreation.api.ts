import {
  CatalogPageSchema,
  CatalogRecordSchema,
  CatalogValueSchema,
  ErrorEnvelopeSchema,
  type CatalogRecord,
  type CatalogValue,
} from '../../shared/catalog/catalogRest.contract'
import {
  RestActorConfigurationError,
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type { RestFailure } from '../../shared/api/restFailure'
import type {
  CatalogApplicabilityCreateInput,
  CatalogApplicabilityMode,
  CatalogApplicabilityRecord,
  CatalogAttributeCreationApi,
  CatalogAttributeCreationContext,
  CatalogAttributeCreationReference,
  CatalogCharacteristicCreateInput,
  CatalogCharacteristicRecord,
  CatalogCharacteristicSearchInput,
  CatalogCharacteristicSearchPage,
  CatalogCharacteristicValueType,
  CatalogPresentationCreateInput,
  CatalogPresentationRecord,
} from './catalogAttributeCreation.types'

const positive = (value: string) => /^[1-9][0-9]*$/.test(value)
const unsigned = (value: string) => /^(?:0|[1-9][0-9]*)$/.test(value)
const bad = (): never => {
  throw new Error('Invalid catalog attribute creation response')
}

export class CatalogAttributeCreationRestError extends Error {
  constructor(readonly failure: RestFailure) {
    super(
      failure.kind === 'http'
        ? (failure.error ?? 'HTTP ' + failure.status)
        : failure.message,
    )
    this.name = 'CatalogAttributeCreationRestError'
  }
}

const fail = (failure: RestFailure): never => {
  throw new CatalogAttributeCreationRestError(failure)
}
const invalidResponse = (): never =>
  fail({
    kind: 'invalid-response',
    message: 'Invalid characteristic creation response',
  })
const invalidApplicabilityResponse = (): never =>
  fail({
    kind: 'invalid-response',
    message: 'Invalid applicability creation response',
  })
const invalidPresentationResponse = (): never =>
  fail({
    kind: 'invalid-response',
    message: 'Invalid presentation creation response',
  })

const exact = (value: unknown, keys: readonly string[]) =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  keys.every((key) => Object.hasOwn(value, key)) &&
  Object.keys(value).every((key) => keys.includes(key))

const valueTypes = new Set<CatalogCharacteristicValueType>([
  'CONTROLLED_OPTION',
  'INTEGER',
  'DECIMAL',
  'QUANTITY',
  'BOOLEAN',
  'CONTROLLED_TEXT',
])

const validCharacteristicInput = (
  input: CatalogCharacteristicCreateInput,
): input is CatalogCharacteristicCreateInput =>
  typeof input.code === 'string' &&
  typeof input.name === 'string' &&
  typeof input.valueType === 'string' &&
  valueTypes.has(input.valueType as CatalogCharacteristicValueType)

const characteristicValues = (input: CatalogCharacteristicCreateInput) => ({
  code: { kind: 'CODE' as const, value: input.code },
  name: { kind: 'TEXT' as const, value: input.name },
  valueType: { kind: 'ENUM' as const, value: input.valueType },
})

const characteristic = (
  raw: unknown,
  input: CatalogCharacteristicCreateInput,
): CatalogCharacteristicRecord => {
  if (!exact(raw, ['kind', 'id', 'revision', 'active', 'values', 'rules']))
    return invalidResponse()
  const rawValues = (raw as { values: unknown }).values
  const parsed = CatalogRecordSchema.safeParse(raw)
  if (!parsed.success || !exact(rawValues, ['code', 'name', 'valueType']))
    return invalidResponse()
  const { code, name, valueType } = parsed.data.values
  if (
    parsed.data.kind !== 'CARACTERISTICA' ||
    !parsed.data.active ||
    !positive(parsed.data.id) ||
    !unsigned(parsed.data.revision) ||
    code?.kind !== 'CODE' ||
    code.value !== input.code ||
    name?.kind !== 'TEXT' ||
    name.value !== input.name ||
    valueType?.kind !== 'ENUM' ||
    valueType.value !== input.valueType
  )
    return invalidResponse()
  return {
    kind: 'CARACTERISTICA',
    id: parsed.data.id,
    revision: parsed.data.revision,
    active: parsed.data.active,
    code: code.value,
    name: name.value,
    valueType: input.valueType,
    rules: parsed.data.rules,
  }
}

const applicabilityModes = new Set<CatalogApplicabilityMode>([
  'REQUIRED',
  'OPTIONAL',
  'FORBIDDEN',
])
const applicabilityInputKeys = [
  'class',
  'family',
  'type',
  'characteristic',
  'characteristicValueType',
  'mode',
  'identityParticipates',
  'rules',
]

const validReference = <Kind extends string>(
  value: unknown,
  kind: Kind,
): value is CatalogAttributeCreationReference<Kind> => {
  const parsed = CatalogValueSchema.safeParse(value)
  return (
    parsed.success &&
    parsed.data.kind === 'REFERENCE' &&
    parsed.data.reference.kind === kind &&
    positive(parsed.data.reference.id) &&
    parsed.data.reference.code.length > 0
  )
}

const validApplicabilityInput = (
  input: CatalogApplicabilityCreateInput,
): input is CatalogApplicabilityCreateInput =>
  (exact(input, applicabilityInputKeys) ||
    exact(input, [...applicabilityInputKeys, 'optionSet'])) &&
  validReference(input.class, 'CLASE') &&
  validReference(input.family, 'FAMILIA') &&
  validReference(input.type, 'TIPO') &&
  validReference(input.characteristic, 'CARACTERISTICA') &&
  valueTypes.has(input.characteristicValueType) &&
  applicabilityModes.has(input.mode as CatalogApplicabilityMode) &&
  typeof input.identityParticipates === 'boolean' &&
  Array.isArray(input.rules) &&
  input.rules.length === 0 &&
  (input.optionSet === undefined ||
    (input.characteristicValueType === 'CONTROLLED_OPTION' &&
      validReference(input.optionSet, 'CONJUNTO_OPCIONES')))

const validPresentationReference = <Kind extends string>(
  value: unknown,
  kind: Kind,
): value is CatalogAttributeCreationReference<Kind> => {
  const parsed = CatalogValueSchema.safeParse(value)
  return (
    parsed.success &&
    parsed.data.kind === 'REFERENCE' &&
    parsed.data.reference.kind === kind &&
    unsigned(parsed.data.reference.id) &&
    parsed.data.reference.code.length > 0
  )
}

const validPresentationInput = (
  input: CatalogPresentationCreateInput,
): input is CatalogPresentationCreateInput =>
  exact(input, ['class', 'family', 'type', 'characteristic', 'position']) &&
  validPresentationReference(input.class, 'CLASE') &&
  validPresentationReference(input.family, 'FAMILIA') &&
  validPresentationReference(input.type, 'TIPO') &&
  validPresentationReference(input.characteristic, 'CARACTERISTICA') &&
  typeof input.position === 'string' &&
  positive(input.position)

const wireReference = <Kind extends string>(
  value: CatalogAttributeCreationReference<Kind>,
) => ({
  kind: 'REFERENCE' as const,
  reference: {
    kind: value.reference.kind,
    id: '0',
    code: value.reference.code,
  },
})

const applicabilityValues = (input: CatalogApplicabilityCreateInput) => ({
  class: wireReference(input.class),
  family: wireReference(input.family),
  type: wireReference(input.type),
  characteristic: wireReference(input.characteristic),
  mode: { kind: 'ENUM' as const, value: input.mode },
  ...(input.optionSet === undefined
    ? {}
    : { optionSet: wireReference(input.optionSet) }),
  identityParticipates: {
    kind: 'BOOLEAN' as const,
    value: input.identityParticipates,
  },
})

const applicability = (
  raw: unknown,
  input: CatalogApplicabilityCreateInput,
): CatalogApplicabilityRecord => {
  if (!exact(raw, ['kind', 'id', 'revision', 'active', 'values', 'rules']))
    return invalidApplicabilityResponse()
  const rawValues = (raw as { values: unknown }).values
  const parsed = CatalogRecordSchema.safeParse(raw)
  const valueKeys = [
    'class',
    'family',
    'type',
    'characteristic',
    'mode',
    'identityParticipates',
    ...(input.optionSet === undefined ? [] : ['optionSet']),
  ]
  if (!parsed.success || !exact(rawValues, valueKeys))
    return invalidApplicabilityResponse()
  const values = parsed.data.values
  const { characteristicValueType, optionSet, ...result } = input
  void characteristicValueType
  if (
    parsed.data.kind !== 'APLICABILIDAD' ||
    !parsed.data.active ||
    !positive(parsed.data.id) ||
    !unsigned(parsed.data.revision) ||
    !same(values.class, input.class) ||
    !same(values.family, input.family) ||
    !same(values.type, input.type) ||
    !same(values.characteristic, input.characteristic) ||
    values.mode?.kind !== 'ENUM' ||
    values.mode.value !== input.mode ||
    values.identityParticipates?.kind !== 'BOOLEAN' ||
    values.identityParticipates.value !== input.identityParticipates ||
    (optionSet === undefined
      ? values.optionSet !== undefined
      : !same(values.optionSet, optionSet)) ||
    parsed.data.rules.length !== 0
  )
    return invalidApplicabilityResponse()
  return {
    kind: 'APLICABILIDAD',
    id: parsed.data.id,
    revision: parsed.data.revision,
    active: parsed.data.active,
    ...result,
    ...(optionSet === undefined ? {} : { optionSet }),
    rules: [],
  }
}

const networkMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Network request failed'

const httpFailure = (status: number, body: unknown): RestFailure => {
  const envelope = ErrorEnvelopeSchema.safeParse(body)
  return {
    kind: 'http',
    status,
    ...(envelope.success
      ? {
          error: envelope.data.error,
          ...(envelope.data.code === undefined
            ? {}
            : { code: envelope.data.code }),
          ...(envelope.data.detail === undefined
            ? {}
            : { detail: envelope.data.detail }),
        }
      : {}),
  }
}

async function createCharacteristic(
  fetch: typeof globalThis.fetch,
  actor: string,
  input: CatalogCharacteristicCreateInput,
): Promise<CatalogCharacteristicRecord> {
  if (!validCharacteristicInput(input))
    return fail({
      kind: 'contract-gap',
      message: 'Invalid characteristic request',
    })
  let response: Response
  try {
    response = await fetch('/v1/catalog/CARACTERISTICA', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor,
        active: true,
        values: characteristicValues(input),
      }),
    })
  } catch (error) {
    return fail({ kind: 'network', message: networkMessage(error) })
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return fail({ kind: 'invalid-response', message: 'Invalid JSON response' })
  }
  if (response.status !== 201) return fail(httpFailure(response.status, body))
  return characteristic(body, input)
}

async function createApplicability(
  fetch: typeof globalThis.fetch,
  actor: string,
  input: CatalogApplicabilityCreateInput,
): Promise<CatalogApplicabilityRecord> {
  if (!validApplicabilityInput(input))
    return fail({
      kind: 'contract-gap',
      message: 'Invalid applicability request',
    })
  let response: Response
  try {
    response = await fetch('/v1/catalog/APLICABILIDAD', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor,
        active: true,
        values: applicabilityValues(input),
        rules: [],
      }),
    })
  } catch (error) {
    return fail({ kind: 'network', message: networkMessage(error) })
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return fail({ kind: 'invalid-response', message: 'Invalid JSON response' })
  }
  if (response.status !== 201) return fail(httpFailure(response.status, body))
  return applicability(body, input)
}

const presentationValues = (input: CatalogPresentationCreateInput) => ({
  class: wireReference(input.class),
  family: wireReference(input.family),
  type: wireReference(input.type),
  characteristic: wireReference(input.characteristic),
  position: { kind: 'INTEGER' as const, value: input.position },
})

const presentation = (
  raw: unknown,
  input: CatalogPresentationCreateInput,
): CatalogPresentationRecord => {
  if (!exact(raw, ['kind', 'id', 'revision', 'active', 'values', 'rules']))
    return invalidPresentationResponse()
  const rawValues = (raw as { values: unknown }).values
  const parsed = CatalogRecordSchema.safeParse(raw)
  if (
    !parsed.success ||
    !exact(rawValues, ['class', 'family', 'type', 'characteristic', 'position'])
  )
    return invalidPresentationResponse()
  const values = parsed.data.values
  if (
    parsed.data.kind !== 'PRESENTACION' ||
    !parsed.data.active ||
    !positive(parsed.data.id) ||
    !unsigned(parsed.data.revision) ||
    !same(values.class, input.class) ||
    !same(values.family, input.family) ||
    !same(values.type, input.type) ||
    !same(values.characteristic, input.characteristic) ||
    values.position?.kind !== 'INTEGER' ||
    values.position.value !== input.position ||
    parsed.data.rules.length !== 0
  )
    return invalidPresentationResponse()
  return {
    kind: 'PRESENTACION',
    id: parsed.data.id,
    revision: parsed.data.revision,
    active: parsed.data.active,
    ...input,
    rules: [],
  }
}

async function createPresentation(
  fetch: typeof globalThis.fetch,
  actor: string,
  input: CatalogPresentationCreateInput,
): Promise<CatalogPresentationRecord> {
  if (!validPresentationInput(input))
    return fail({
      kind: 'contract-gap',
      message: 'Invalid presentation request',
    })
  let response: Response
  try {
    response = await fetch('/v1/catalog/PRESENTACION', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actor,
        active: true,
        values: presentationValues(input),
      }),
    })
  } catch (error) {
    return fail({ kind: 'network', message: networkMessage(error) })
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return fail({ kind: 'invalid-response', message: 'Invalid JSON response' })
  }
  if (response.status !== 201) return fail(httpFailure(response.status, body))
  return presentation(body, input)
}

const invalidSearchResponse = (): never => {
  throw new Error('Invalid catalog characteristic search response')
}

const validSearchInput = (
  input: CatalogCharacteristicSearchInput,
): input is CatalogCharacteristicSearchInput =>
  input.scope === 'ACTIVE' &&
  typeof input.text === 'string' &&
  Number.isInteger(input.limit) &&
  input.limit >= 1 &&
  input.limit <= 50 &&
  Number.isInteger(input.offset) &&
  input.offset >= 0

const searchedCharacteristic = (raw: unknown): CatalogCharacteristicRecord => {
  if (!exact(raw, ['kind', 'id', 'revision', 'active', 'values', 'rules']))
    return invalidSearchResponse()
  const rawValues = (raw as { values: unknown }).values
  const parsed = CatalogRecordSchema.safeParse(raw)
  if (!parsed.success || typeof rawValues !== 'object' || rawValues === null)
    return invalidSearchResponse()
  const { code, name, valueType } = parsed.data.values
  if (
    parsed.data.kind !== 'CARACTERISTICA' ||
    !parsed.data.active ||
    !positive(parsed.data.id) ||
    !unsigned(parsed.data.revision) ||
    code?.kind !== 'CODE' ||
    code.value.length === 0 ||
    name?.kind !== 'TEXT' ||
    name.value.length === 0 ||
    valueType?.kind !== 'ENUM' ||
    !valueTypes.has(valueType.value as CatalogCharacteristicValueType)
  )
    return invalidSearchResponse()
  return {
    kind: 'CARACTERISTICA',
    id: parsed.data.id,
    revision: parsed.data.revision,
    active: true,
    code: code.value,
    name: name.value,
    valueType: valueType.value as CatalogCharacteristicValueType,
    rules: parsed.data.rules,
  }
}

export const parseCatalogCharacteristicSearchPage = (
  value: unknown,
  input: CatalogCharacteristicSearchInput,
): CatalogCharacteristicSearchPage => {
  if (!validSearchInput(input)) return invalidSearchResponse()
  const page = CatalogPageSchema.safeParse(value)
  if (!page.success) return invalidSearchResponse()
  return {
    records: page.data.records.map(searchedCharacteristic),
    hasPrevious: page.data.hasPrevious,
    hasNext: page.data.hasNext,
  }
}

async function searchCharacteristics(
  fetch: typeof globalThis.fetch,
  input: CatalogCharacteristicSearchInput,
): Promise<CatalogCharacteristicSearchPage> {
  if (!validSearchInput(input)) return invalidSearchResponse()
  const query = new URLSearchParams({ scope: input.scope })
  const text = input.text.trim()
  if (text) query.set('text', text)
  query.set('limit', String(input.limit))
  query.set('offset', String(input.offset))
  const response = await fetch('/v1/catalog/CARACTERISTICA?' + query, {
    signal: input.signal,
  })
  const body: unknown = await response.json()
  if (!response.ok) {
    const error = ErrorEnvelopeSchema.safeParse(body)
    throw new Error(
      error.success ? error.data.error : 'HTTP ' + response.status,
    )
  }
  return parseCatalogCharacteristicSearchPage(body, input)
}

const validContext = (input: CatalogAttributeCreationContext) =>
  typeof input.classCode === 'string' &&
  input.classCode.length > 0 &&
  typeof input.familyCode === 'string' &&
  input.familyCode.length > 0 &&
  typeof input.typeCode === 'string' &&
  input.typeCode.length > 0

const canonical = <Kind extends 'CLASE' | 'FAMILIA' | 'TIPO'>(
  record: CatalogRecord,
  kind: Kind,
  code: string,
): CatalogAttributeCreationReference<Kind> => {
  const descriptor = record.values.code
  if (
    record.kind !== kind ||
    !positive(record.id) ||
    descriptor?.kind !== 'CODE' ||
    descriptor.value !== code
  )
    return bad()
  return { kind: 'REFERENCE', reference: { kind, id: record.id, code } }
}

const same = (
  value: CatalogValue | undefined,
  expected: CatalogAttributeCreationReference<string>,
) =>
  value?.kind === 'REFERENCE' &&
  value.reference.kind === expected.reference.kind &&
  value.reference.id === expected.reference.id &&
  value.reference.code === expected.reference.code

async function resolve<Kind extends 'CLASE' | 'FAMILIA' | 'TIPO'>(
  fetch: typeof globalThis.fetch,
  input: CatalogAttributeCreationContext,
  kind: Kind,
  code: string,
  filter?: readonly [string, string],
  parents: readonly [string, CatalogAttributeCreationReference<string>][] = [],
): Promise<CatalogAttributeCreationReference<Kind>> {
  const query = new URLSearchParams({
    scope: 'ALL',
    text: code,
    limit: '50',
    offset: '0',
  })
  if (filter) query.set(...filter)
  const response = await fetch('/v1/catalog/' + kind + '?' + query, {
    signal: input.signal,
  })
  const body: unknown = await response.json()
  if (!response.ok) return bad()
  const page = CatalogPageSchema.safeParse(body)
  if (!page.success || page.data.hasPrevious || page.data.hasNext) return bad()
  const matches = page.data.records.filter((record) => {
    const descriptor = record.values.code
    return (
      record.kind === kind &&
      descriptor?.kind === 'CODE' &&
      descriptor.value === code
    )
  })
  if (matches.length !== 1) return bad()
  const result = canonical(matches[0], kind, code)
  if (
    !parents.every(([field, expected]) =>
      same(matches[0].values[field], expected),
    )
  )
    return bad()
  return result
}

export function createCatalogAttributeCreationApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): CatalogAttributeCreationApi {
  return {
    async searchCharacteristics(input) {
      return searchCharacteristics(fetch, input)
    },
    async resolveHierarchyReferences(input) {
      if (!validContext(input)) return bad()
      const classReference = await resolve(
        fetch,
        input,
        'CLASE',
        input.classCode,
      )
      const familyReference = await resolve(
        fetch,
        input,
        'FAMILIA',
        input.familyCode,
        ['classCode', input.classCode],
        [['class', classReference]],
      )
      const typeReference = await resolve(
        fetch,
        input,
        'TIPO',
        input.typeCode,
        ['familyCode', input.familyCode],
        [
          ['class', classReference],
          ['family', familyReference],
        ],
      )
      return {
        class: classReference,
        family: familyReference,
        type: typeReference,
      }
    },
    async createCharacteristic(input) {
      try {
        return await withRestActor(
          (actor) => createCharacteristic(fetch, actor, input),
          actorOptions,
        )
      } catch (error) {
        if (error instanceof RestActorConfigurationError)
          return fail({ kind: 'configuration', message: error.message })
        throw error
      }
    },
    async createApplicability(input) {
      try {
        return await withRestActor(
          (actor) => createApplicability(fetch, actor, input),
          actorOptions,
        )
      } catch (error) {
        if (error instanceof RestActorConfigurationError)
          return fail({ kind: 'configuration', message: error.message })
        throw error
      }
    },
    async createPresentation(input) {
      try {
        return await withRestActor(
          (actor) => createPresentation(fetch, actor, input),
          actorOptions,
        )
      } catch (error) {
        if (error instanceof RestActorConfigurationError)
          return fail({ kind: 'configuration', message: error.message })
        throw error
      }
    },
  }
}

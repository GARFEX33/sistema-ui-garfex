import {
  CatalogPageSchema,
  CatalogRecordSchema,
  ErrorEnvelopeSchema,
  type CatalogErrorCode,
  type CatalogRecord,
  type CatalogValue,
} from '../../shared/catalog/catalogRest.contract'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import type {
  CatalogOptionAdminRecord,
  CatalogOptionAdminValues,
  CatalogOptionsAdminApi,
  CatalogOptionsAdminDeleteInput,
  CatalogOptionsAdminLifecycleInput,
  CatalogOptionsAdminPage,
  CatalogOptionsAdminReference,
  CatalogOptionsAdminReferences,
  CatalogOptionsAdminReferenceRequest,
  CatalogOptionsAdminRequest,
  CatalogOptionsAdminUpdateInput,
} from './catalogOptionsAdmin.types'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (value: unknown, keys: readonly string[]) =>
  record(value) &&
  keys.every((key) => Object.hasOwn(value, key)) &&
  Object.keys(value).every((key) => keys.includes(key))
const positive = (value: string) => /^[1-9][0-9]*$/.test(value)
const unsigned = (value: string) => /^(?:0|[1-9][0-9]*)$/.test(value)
const bad = (): never => {
  throw new Error('Invalid catalog options admin response')
}
const validRequest = (input: CatalogOptionsAdminRequest) =>
  typeof input.optionSetCode === 'string' &&
  input.optionSetCode.length > 0 &&
  typeof input.characteristicCode === 'string' &&
  input.characteristicCode.length > 0 &&
  Number.isInteger(input.offset) &&
  input.offset >= 0 &&
  Number.isInteger(input.limit) &&
  input.limit >= 1 &&
  input.limit <= 50

const validReferenceRequest = (input: CatalogOptionsAdminReferenceRequest) =>
  typeof input.optionSetCode === 'string' &&
  input.optionSetCode.length > 0 &&
  typeof input.characteristicCode === 'string' &&
  input.characteristicCode.length > 0

const resolvePageReference = <
  Kind extends 'CONJUNTO_OPCIONES' | 'CARACTERISTICA',
>(
  value: unknown,
  kind: Kind,
  code: string,
): CatalogOptionsAdminReference<Kind> => {
  if (!exact(value, ['records', 'hasPrevious', 'hasNext']) || !record(value))
    return bad()
  const page = CatalogPageSchema.safeParse(value)
  if (!page.success || page.data.hasNext) return bad()
  const matches = page.data.records.filter((item) => {
    const descriptor = item.values.code
    return (
      item.kind === kind &&
      positive(item.id) &&
      descriptor?.kind === 'CODE' &&
      descriptor.value === code
    )
  })
  if (matches.length !== 1) return bad()
  return { kind, id: matches[0].id, code }
}

const validReference = (
  value: unknown,
  kind: 'CONJUNTO_OPCIONES' | 'CARACTERISTICA',
): value is CatalogOptionsAdminReference<typeof kind> => {
  if (!exact(value, ['kind', 'id', 'code']) || !record(value)) return false
  return (
    value.kind === kind &&
    typeof value.id === 'string' &&
    positive(value.id) &&
    typeof value.code === 'string'
  )
}

const validValues = (value: unknown): value is CatalogOptionAdminValues => {
  if (
    !exact(value, ['optionSet', 'characteristic', 'code', 'label']) ||
    !record(value)
  )
    return false
  return (
    validReference(value.optionSet, 'CONJUNTO_OPCIONES') &&
    validReference(value.characteristic, 'CARACTERISTICA') &&
    typeof value.code === 'string' &&
    typeof value.label === 'string'
  )
}

const reference = <Kind extends 'CONJUNTO_OPCIONES' | 'CARACTERISTICA'>(
  value: CatalogValue | undefined,
  expected: CatalogOptionsAdminReference<Kind>,
): CatalogOptionsAdminReference<Kind> => {
  if (
    value?.kind !== 'REFERENCE' ||
    value.reference.kind !== expected.kind ||
    !positive(value.reference.id) ||
    value.reference.id !== expected.id ||
    value.reference.code !== expected.code
  )
    return bad()
  return value.reference as CatalogOptionsAdminReference<Kind>
}

interface OptionContext {
  values: CatalogOptionAdminValues
  id?: string
  active?: boolean
}

const option = (
  raw: unknown,
  value: CatalogRecord,
  context: OptionContext,
): CatalogOptionAdminRecord => {
  if (
    !exact(raw, ['kind', 'id', 'revision', 'active', 'values', 'rules']) ||
    !record(raw) ||
    !exact(raw.values, ['optionSet', 'characteristic', 'code', 'label']) ||
    value.kind !== 'OPCION' ||
    !positive(value.id) ||
    !unsigned(value.revision) ||
    value.rules.length !== 0 ||
    value.values.code?.kind !== 'CODE' ||
    value.values.code.value !== context.values.code ||
    value.values.label?.kind !== 'TEXT' ||
    value.values.label.value !== context.values.label ||
    (context.id !== undefined && value.id !== context.id) ||
    (context.active !== undefined && value.active !== context.active)
  )
    return bad()
  return {
    kind: 'OPCION',
    id: value.id,
    revision: value.revision,
    active: value.active,
    optionSet: reference(value.values.optionSet, context.values.optionSet),
    characteristic: reference(
      value.values.characteristic,
      context.values.characteristic,
    ),
    code: value.values.code.value,
    label: value.values.label.value,
    rules: [],
  }
}

export const parseCatalogOptionsAdminRecord = (
  value: unknown,
  context: OptionContext,
): CatalogOptionAdminRecord => {
  if (
    !validValues(context.values) ||
    (context.id !== undefined && !positive(context.id))
  )
    return bad()
  const parsed = CatalogRecordSchema.safeParse(value)
  if (!parsed.success) return bad()
  return option(value, parsed.data, context)
}

export const parseCatalogOptionsAdminPage = (
  value: unknown,
  input: CatalogOptionsAdminRequest,
): CatalogOptionsAdminPage => {
  if (
    !validRequest(input) ||
    !exact(value, ['records', 'hasPrevious', 'hasNext'])
  )
    return bad()
  if (!record(value) || !Array.isArray(value.records)) return bad()
  const records = value.records
  const page = CatalogPageSchema.safeParse(value)
  if (!page.success) return bad()
  return {
    records: page.data.records.map((item, index) =>
      option(records[index], item, {
        values: {
          optionSet: {
            kind: 'CONJUNTO_OPCIONES',
            id:
              item.values.optionSet?.kind === 'REFERENCE'
                ? item.values.optionSet.reference.id
                : '',
            code: input.optionSetCode,
          },
          characteristic: {
            kind: 'CARACTERISTICA',
            id:
              item.values.characteristic?.kind === 'REFERENCE'
                ? item.values.characteristic.reference.id
                : '',
            code: input.characteristicCode,
          },
          code: item.values.code?.kind === 'CODE' ? item.values.code.value : '',
          label:
            item.values.label?.kind === 'TEXT' ? item.values.label.value : '',
        },
      }),
    ),
    hasPrevious: page.data.hasPrevious,
    hasNext: page.data.hasNext,
  }
}

export class CatalogOptionsAdminHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: string,
    readonly code?: CatalogErrorCode,
  ) {
    super(message)
    this.name = 'CatalogOptionsAdminHttpError'
  }
}

export class CatalogOptionsAdminConflictError extends CatalogOptionsAdminHttpError {
  constructor(
    statusOrMessage: number | string,
    message?: string,
    detail?: string,
  ) {
    super(
      typeof statusOrMessage === 'number' ? statusOrMessage : 409,
      typeof statusOrMessage === 'string' ? statusOrMessage : (message ?? ''),
      detail,
      'CONFLICT',
    )
    this.name = 'CatalogOptionsAdminConflictError'
  }
}

const publicErrorDetail = (
  status: number,
  error: ReturnType<typeof ErrorEnvelopeSchema.safeParse>,
) => {
  if (!error.success) return undefined
  const approved =
    (status === 400 && error.data.error === 'invalid request') ||
    (status === 422 && error.data.error === 'validation failed')
  return approved ? error.data.detail : undefined
}

const httpError = (status: number, body: unknown): never => {
  const error = ErrorEnvelopeSchema.safeParse(body)
  const message = error.success ? error.data.error : 'HTTP ' + status
  const detail = publicErrorDetail(status, error)
  if (error.success && error.data.code === 'CONFLICT')
    throw new CatalogOptionsAdminConflictError(status, message, detail)
  throw new CatalogOptionsAdminHttpError(
    status,
    message,
    detail,
    error.success ? error.data.code : undefined,
  )
}

const mutationValues = (values: CatalogOptionAdminValues) => ({
  optionSet: {
    kind: 'REFERENCE',
    reference: { ...values.optionSet, id: '0' },
  },
  characteristic: {
    kind: 'REFERENCE',
    reference: { ...values.characteristic, id: '0' },
  },
  code: { kind: 'CODE', value: values.code },
  label: { kind: 'TEXT', value: values.label },
})

async function mutate(
  fetch: typeof globalThis.fetch,
  url: string,
  method: 'POST' | 'PUT',
  status: 200 | 201,
  body: Record<string, unknown>,
  context: OptionContext,
): Promise<CatalogOptionAdminRecord> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method,
  })
  const responseBody: unknown = await response.json()
  if (response.status !== status)
    return httpError(response.status, responseBody)
  return parseCatalogOptionsAdminRecord(responseBody, context)
}

const validUpdate = (
  input: CatalogOptionsAdminUpdateInput,
): input is CatalogOptionsAdminUpdateInput =>
  typeof input.id === 'string' &&
  positive(input.id) &&
  typeof input.expectedRevision === 'string' &&
  unsigned(input.expectedRevision) &&
  validValues(input.values)

const validDelete = (
  input: CatalogOptionsAdminDeleteInput,
): input is CatalogOptionsAdminDeleteInput =>
  typeof input.id === 'string' &&
  positive(input.id) &&
  typeof input.expectedRevision === 'string' &&
  unsigned(input.expectedRevision)

export function createCatalogOptionsAdminApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): CatalogOptionsAdminApi {
  return {
    async resolveReferences(input) {
      if (!validReferenceRequest(input)) return bad()
      const resolve = async <
        Kind extends 'CONJUNTO_OPCIONES' | 'CARACTERISTICA',
      >(
        kind: Kind,
        code: string,
      ) => {
        const query = new URLSearchParams({
          scope: 'ALL',
          text: code,
          limit: '50',
          offset: '0',
        })
        const response = await fetch('/v1/catalog/' + kind + '?' + query, {
          signal: input.signal,
        })
        const body: unknown = await response.json()
        if (!response.ok) httpError(response.status, body)
        return resolvePageReference(body, kind, code)
      }
      const [optionSet, characteristic] = await Promise.all([
        resolve('CONJUNTO_OPCIONES', input.optionSetCode),
        resolve('CARACTERISTICA', input.characteristicCode),
      ])
      return {
        optionSet,
        characteristic,
      } satisfies CatalogOptionsAdminReferences
    },
    async list(input) {
      if (!validRequest(input)) return bad()
      const query = new URLSearchParams({
        scope: 'ALL',
        optionSetCode: input.optionSetCode,
        characteristicCode: input.characteristicCode,
        limit: String(input.limit),
        offset: String(input.offset),
      })
      const response = await fetch('/v1/catalog/OPCION?' + query, {
        signal: input.signal,
      })
      const body: unknown = await response.json()
      if (!response.ok) httpError(response.status, body)
      return parseCatalogOptionsAdminPage(body, input)
    },
    async create(input) {
      return withRestActor(async (actor) => {
        if (!validValues(input.values)) return bad()
        return mutate(
          fetch,
          '/v1/catalog/OPCION',
          'POST',
          201,
          { actor, active: true, values: mutationValues(input.values) },
          { values: input.values },
        )
      }, actorOptions)
    },
    async update(input) {
      return withRestActor(async (actor) => {
        if (!validUpdate(input)) return bad()
        return mutate(
          fetch,
          '/v1/catalog/OPCION/' + encodeURIComponent(input.id),
          'PUT',
          200,
          {
            actor,
            expectedRevision: input.expectedRevision,
            values: mutationValues(input.values),
          },
          { id: input.id, values: input.values },
        )
      }, actorOptions)
    },
    async delete(input) {
      return withRestActor(async (actor) => {
        if (!validDelete(input)) return bad()
        const response = await fetch(
          '/v1/catalog/OPCION/' + encodeURIComponent(input.id),
          {
            body: JSON.stringify({
              actor,
              expectedRevision: input.expectedRevision,
            }),
            headers: { 'content-type': 'application/json' },
            method: 'DELETE',
          },
        )
        if (response.status === 204) return
        return httpError(response.status, await response.json())
      }, actorOptions)
    },
    async deactivate(input) {
      return lifecycle(fetch, actorOptions, input, 'deactivate', false)
    },
    async reactivate(input) {
      return lifecycle(fetch, actorOptions, input, 'reactivate', true)
    },
  }
}

function lifecycle(
  fetch: typeof globalThis.fetch,
  actorOptions: RestActorOptions,
  input: CatalogOptionsAdminLifecycleInput,
  action: 'deactivate' | 'reactivate',
  active: boolean,
) {
  return withRestActor(async (actor) => {
    if (!validUpdate(input)) return bad()
    return mutate(
      fetch,
      '/v1/catalog/OPCION/' + encodeURIComponent(input.id) + '/' + action,
      'POST',
      200,
      { actor, expectedRevision: input.expectedRevision },
      { id: input.id, active, values: input.values },
    )
  }, actorOptions)
}

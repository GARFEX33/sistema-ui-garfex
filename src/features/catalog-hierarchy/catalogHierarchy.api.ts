import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'
import {
  CatalogPageSchema,
  CatalogRecordSchema,
  ErrorEnvelopeSchema,
  type CatalogErrorCode,
  type CatalogRecord as RestCatalogRecord,
} from '../../shared/catalog/catalogRest.contract'
import type { RestFailure } from '../../shared/api/restFailure'
import type {
  CatalogClassRestCreateInput,
  CatalogClassRestItem,
  CatalogFamilyRestCreateInput,
  CatalogFamilyRestCreateOutput,
  CatalogHierarchyRestReference,
  CatalogHierarchyRestReferenceInput,
  CatalogClassWindowInput,
  CatalogClassWindowPage,
  CatalogFamilyRestItem,
  CatalogFamilyWindowInput,
  CatalogFamilyWindowPage,
  CatalogTypeRestCreateInput,
  CatalogTypeRestCreateOutput,
  CatalogTypeRestItem,
  CatalogTypeWindowInput,
  CatalogTypeWindowPage,
} from './catalogHierarchy.types'

type CatalogRecord = Record<string, unknown>

const record = (value: unknown): value is CatalogRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const bad = (): never => {
  throw new Error('Invalid catalog hierarchy response')
}

export interface CatalogHierarchyRestApi {
  createClass: (
    input: CatalogClassRestCreateInput,
  ) => Promise<CatalogClassRestItem>
  createFamily: (
    input: CatalogFamilyRestCreateInput,
  ) => Promise<CatalogFamilyRestCreateOutput>
  createType: (
    input: CatalogTypeRestCreateInput,
  ) => Promise<CatalogTypeRestCreateOutput>
  listClasses: (
    input: CatalogClassWindowInput,
  ) => Promise<CatalogClassWindowPage>
  listFamilies: (
    input: CatalogFamilyWindowInput,
  ) => Promise<CatalogFamilyWindowPage>
  listTypes: (input: CatalogTypeWindowInput) => Promise<CatalogTypeWindowPage>
}

const restClassItem = (record: RestCatalogRecord): CatalogClassRestItem => {
  const code = record.values.code
  const name = record.values.name
  if (record.kind !== 'CLASE' || code?.kind !== 'CODE' || name?.kind !== 'TEXT')
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

const restFamilyItem = (
  record: RestCatalogRecord,
  classCode: string,
): CatalogFamilyRestItem => {
  const code = record.values.code
  const name = record.values.name
  const classReference = record.values.class
  if (
    record.kind !== 'FAMILIA' ||
    code?.kind !== 'CODE' ||
    name?.kind !== 'TEXT' ||
    classReference?.kind !== 'REFERENCE' ||
    classReference.reference.kind !== 'CLASE' ||
    classReference.reference.code !== classCode
  )
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    classCode,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

const restTypeItem = (
  record: RestCatalogRecord,
  input: Pick<CatalogTypeWindowInput, 'classCode' | 'familyCode'>,
): CatalogTypeRestItem => {
  const code = record.values.code
  const name = record.values.name
  const classReference = record.values.class
  const familyReference = record.values.family
  if (
    record.kind !== 'TIPO' ||
    code?.kind !== 'CODE' ||
    name?.kind !== 'TEXT' ||
    familyReference?.kind !== 'REFERENCE' ||
    familyReference.reference.kind !== 'FAMILIA' ||
    familyReference.reference.code !== input.familyCode ||
    (input.classCode !== undefined &&
      (classReference?.kind !== 'REFERENCE' ||
        classReference.reference.kind !== 'CLASE' ||
        classReference.reference.code !== input.classCode))
  )
    return bad()
  return {
    activo: record.active,
    clave: code.value,
    ...(input.classCode === undefined ? {} : { classCode: input.classCode }),
    familyCode: input.familyCode,
    id: record.id,
    nombre: name.value,
    revision: record.revision,
  }
}

export class CatalogHierarchyRestError extends Error {
  constructor(
    readonly failure: RestFailure,
    readonly code?: CatalogErrorCode,
    readonly detail?: string,
  ) {
    super(
      failure.kind === 'http'
        ? (failure.error ?? 'HTTP ' + failure.status)
        : failure.message,
    )
    this.name = 'CatalogHierarchyRestError'
  }
}

const exact = (
  value: unknown,
  keys: readonly string[],
): value is CatalogRecord =>
  record(value) &&
  keys.every((key) => Object.hasOwn(value, key)) &&
  Object.keys(value).every((key) => keys.includes(key))
const positive = (value: string) => /^[1-9][0-9]*$/.test(value)
const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const validReferenceInput = <Kind extends 'CLASE' | 'FAMILIA'>(
  value: unknown,
  kind: Kind,
): value is CatalogHierarchyRestReferenceInput<Kind> =>
  exact(value, ['kind', 'code']) && value.kind === kind && nonEmpty(value.code)

const validFamilyCreateInput = (input: CatalogFamilyRestCreateInput) =>
  exact(input, ['class', 'code', 'name']) &&
  validReferenceInput(input.class, 'CLASE') &&
  nonEmpty(input.code) &&
  nonEmpty(input.name)
const validTypeCreateInput = (input: CatalogTypeRestCreateInput) =>
  exact(input, ['class', 'family', 'code', 'name']) &&
  validReferenceInput(input.class, 'CLASE') &&
  validReferenceInput(input.family, 'FAMILIA') &&
  nonEmpty(input.code) &&
  nonEmpty(input.name)

const reference = <Kind extends 'CLASE' | 'FAMILIA'>(
  value: RestCatalogRecord['values'][string] | undefined,
  kind: Kind,
  code: string,
): CatalogHierarchyRestReference<Kind> => {
  if (
    value?.kind !== 'REFERENCE' ||
    value.reference.kind !== kind ||
    !positive(value.reference.id) ||
    value.reference.code !== code
  )
    return bad()
  return { kind, id: value.reference.id, code }
}

const createdRecord = (
  body: unknown,
  kind: 'FAMILIA' | 'TIPO',
  valueKeys: readonly string[],
) => {
  if (
    !exact(body, ['kind', 'id', 'revision', 'active', 'values', 'rules']) ||
    !exact(body.values, valueKeys)
  )
    return bad()
  const parsed = CatalogRecordSchema.safeParse(body)
  if (
    !parsed.success ||
    parsed.data.kind !== kind ||
    !positive(parsed.data.id) ||
    !positive(parsed.data.revision) ||
    parsed.data.active !== true
  )
    return bad()
  const code = parsed.data.values.code
  const name = parsed.data.values.name
  if (code?.kind !== 'CODE' || name?.kind !== 'TEXT') return bad()
  return { record: parsed.data, code: code.value, name: name.value }
}

const parseCreatedFamilyRest = (
  body: unknown,
  classCode: string,
): CatalogFamilyRestCreateOutput => {
  const created = createdRecord(body, 'FAMILIA', ['class', 'code', 'name'])
  return {
    active: true,
    class: reference(created.record.values.class, 'CLASE', classCode),
    code: created.code,
    id: created.record.id,
    kind: 'FAMILIA',
    name: created.name,
    revision: created.record.revision,
  }
}

const parseCreatedTypeRest = (
  body: unknown,
  classCode: string,
  familyCode: string,
): CatalogTypeRestCreateOutput => {
  const created = createdRecord(body, 'TIPO', [
    'class',
    'family',
    'code',
    'name',
  ])
  return {
    active: true,
    class: reference(created.record.values.class, 'CLASE', classCode),
    code: created.code,
    family: reference(created.record.values.family, 'FAMILIA', familyCode),
    id: created.record.id,
    kind: 'TIPO',
    name: created.name,
    revision: created.record.revision,
  }
}

const httpFailure = (status: number, body: unknown): never => {
  const error = ErrorEnvelopeSchema.safeParse(body)
  const data = error.success ? error.data : undefined
  throw new CatalogHierarchyRestError(
    {
      kind: 'http',
      status,
      ...(data?.error === undefined ? {} : { error: data.error }),
    },
    data?.code,
    data?.detail,
  )
}

async function createRestRecord<T>(
  fetch: typeof globalThis.fetch,
  kind: 'FAMILIA' | 'TIPO',
  values: Record<string, unknown>,
  parse: (body: unknown) => T,
  actorOptions: RestActorOptions,
) {
  return withRestActor(async (actor) => {
    const response = await fetch('/v1/catalog/' + kind, {
      body: JSON.stringify({ actor, active: true, values }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    const body: unknown = await response.json()
    if (response.status !== 201) return httpFailure(response.status, body)
    return parse(body)
  }, actorOptions)
}

const catalogParams = (input: CatalogClassWindowInput) =>
  new URLSearchParams({
    scope: input.scope,
    ...(input.text === undefined ? {} : { text: input.text }),
    limit: String(input.limit),
    offset: String(input.offset),
  })

async function readCatalogPage(
  fetch: typeof globalThis.fetch,
  kind: 'CLASE' | 'FAMILIA' | 'TIPO',
  input: CatalogClassWindowInput,
  filter?: readonly [string, string],
) {
  const params = catalogParams(input)
  if (filter) params.set(...filter)
  const response = await fetch('/v1/catalog/' + kind + '?' + params, {
    signal: input.signal,
  })
  const body: unknown = await response.json()
  if (!response.ok) {
    const error = ErrorEnvelopeSchema.safeParse(body)
    throw new Error(
      error.success ? error.data.error : 'HTTP ' + response.status,
    )
  }
  return CatalogPageSchema.parse(body)
}

export function createCatalogHierarchyRestApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): CatalogHierarchyRestApi {
  return {
    async createClass(input) {
      return withRestActor(async (actor) => {
        const response = await fetch('/v1/catalog/CLASE', {
          body: JSON.stringify({
            actor,
            values: {
              code: { kind: 'CODE', value: input.code },
              name: { kind: 'TEXT', value: input.name },
              plural: { kind: 'TEXT', value: input.plural },
              slug: { kind: 'TEXT', value: input.slug },
            },
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        })
        const body: unknown = await response.json()
        if (response.status !== 201) {
          const error = ErrorEnvelopeSchema.safeParse(body)
          throw new Error(
            error.success ? error.data.error : 'HTTP ' + response.status,
          )
        }
        return restClassItem(
          CatalogPageSchema.shape.records.element.parse(body),
        )
      }, actorOptions)
    },
    async createFamily(input) {
      if (!validFamilyCreateInput(input))
        throw new Error('Invalid catalog hierarchy create input')
      const { class: parent, code, name } = input
      const classCode = parent.code
      return createRestRecord(
        fetch,
        'FAMILIA',
        {
          class: {
            kind: 'REFERENCE',
            reference: { kind: 'CLASE', id: '0', code: classCode },
          },
          code: { kind: 'CODE', value: code },
          name: { kind: 'TEXT', value: name },
        },
        (body) => parseCreatedFamilyRest(body, classCode),
        actorOptions,
      )
    },
    async createType(input) {
      if (!validTypeCreateInput(input))
        throw new Error('Invalid catalog hierarchy create input')
      const { class: classParent, family: familyParent, code, name } = input
      const classCode = classParent.code
      const familyCode = familyParent.code
      return createRestRecord(
        fetch,
        'TIPO',
        {
          class: {
            kind: 'REFERENCE',
            reference: { kind: 'CLASE', id: '0', code: classCode },
          },
          family: {
            kind: 'REFERENCE',
            reference: { kind: 'FAMILIA', id: '0', code: familyCode },
          },
          code: { kind: 'CODE', value: code },
          name: { kind: 'TEXT', value: name },
        },
        (body) => parseCreatedTypeRest(body, classCode, familyCode),
        actorOptions,
      )
    },
    async listClasses(input) {
      const page = await readCatalogPage(fetch, 'CLASE', input)
      return {
        items: page.records.map(restClassItem),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listFamilies(input) {
      const page = await readCatalogPage(fetch, 'FAMILIA', input, [
        'classCode',
        input.classCode,
      ])
      return {
        items: page.records.map((record) =>
          restFamilyItem(record, input.classCode),
        ),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
    async listTypes(input) {
      const page = await readCatalogPage(fetch, 'TIPO', input, [
        'familyCode',
        input.familyCode,
      ])
      return {
        items: page.records.map((record) => restTypeItem(record, input)),
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      }
    },
  }
}

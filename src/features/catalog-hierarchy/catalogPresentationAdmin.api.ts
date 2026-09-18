import {
  CatalogPageSchema,
  ErrorEnvelopeSchema,
  type CatalogErrorCode,
  type CatalogRecord,
  type CatalogValue,
} from '../../shared/catalog/catalogRest.contract'
import {
  withRestActor,
  type RestActorOptions,
} from '../../shared/api/restActor'

export interface CatalogPresentationListInput {
  classCode: string
  familyCode: string
  typeCode: string
  offset: number
  limit: number
  signal?: AbortSignal
}

export interface CatalogPresentationListItem {
  id: string
  revision: string
  active: boolean
  characteristicCode: string
  position: string
}

export interface CatalogPresentationListPage {
  records: readonly CatalogPresentationListItem[]
  hasPrevious: boolean
  hasNext: boolean
}

export interface CatalogPresentationUpdateInput {
  id: string
  expectedRevision: string
  active: boolean
  classCode: string
  familyCode: string
  typeCode: string
  characteristicCode: string
  position: string
}

export interface CatalogPresentationAdminApi {
  listPresentations: (
    input: CatalogPresentationListInput,
  ) => Promise<CatalogPresentationListPage>
  updatePresentation: (
    input: CatalogPresentationUpdateInput,
  ) => Promise<CatalogPresentationListItem>
}

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const bad = (): never => {
  throw new Error('Invalid catalog presentation response')
}

const validListInput = (input: CatalogPresentationListInput) =>
  nonEmpty(input.classCode) &&
  nonEmpty(input.familyCode) &&
  nonEmpty(input.typeCode) &&
  Number.isInteger(input.offset) &&
  input.offset >= 0 &&
  Number.isInteger(input.limit) &&
  input.limit >= 1

const validUpdateInput = (input: CatalogPresentationUpdateInput) =>
  nonEmpty(input.id) &&
  nonEmpty(input.expectedRevision) &&
  nonEmpty(input.classCode) &&
  nonEmpty(input.familyCode) &&
  nonEmpty(input.typeCode) &&
  nonEmpty(input.characteristicCode) &&
  nonEmpty(input.position)

type ReferenceKind = 'CLASE' | 'FAMILIA' | 'TIPO' | 'CARACTERISTICA'
const reference = (value: CatalogValue | undefined, kind: ReferenceKind) => {
  if (
    value?.kind !== 'REFERENCE' ||
    value.reference.kind !== kind ||
    value.reference.code.length === 0
  )
    return bad()
  return value.reference
}

const item = (
  value: CatalogRecord,
  input: Pick<
    CatalogPresentationListInput,
    'classCode' | 'familyCode' | 'typeCode'
  >,
): CatalogPresentationListItem => {
  const classReference = reference(value.values.class, 'CLASE')
  const family = reference(value.values.family, 'FAMILIA')
  const type = reference(value.values.type, 'TIPO')
  const characteristic = reference(
    value.values.characteristic,
    'CARACTERISTICA',
  )
  const position = value.values.position
  if (
    value.kind !== 'PRESENTACION' ||
    classReference.code !== input.classCode ||
    family.code !== input.familyCode ||
    type.code !== input.typeCode ||
    position?.kind !== 'INTEGER'
  )
    return bad()
  return {
    id: value.id,
    revision: value.revision,
    active: value.active,
    characteristicCode: characteristic.code,
    position: position.value,
  }
}

export class CatalogPresentationHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: string,
    readonly code?: CatalogErrorCode,
  ) {
    super(message)
    this.name = 'CatalogPresentationHttpError'
  }
}

export class CatalogPresentationConflictError extends CatalogPresentationHttpError {
  constructor(message: string, detail?: string) {
    super(409, message, detail, 'CONFLICT')
    this.name = 'CatalogPresentationConflictError'
  }
}

const httpError = (status: number, body: unknown): never => {
  const envelope = ErrorEnvelopeSchema.safeParse(body)
  const message = envelope.success ? envelope.data.error : 'HTTP ' + status
  const detail = envelope.success ? envelope.data.detail : undefined
  if (status === 409)
    throw new CatalogPresentationConflictError(message, detail)
  throw new CatalogPresentationHttpError(
    status,
    message,
    detail,
    envelope.success ? envelope.data.code : undefined,
  )
}

const presentationValues = (input: {
  classCode: string
  familyCode: string
  typeCode: string
  characteristicCode: string
  position: string
}) => ({
  class: {
    kind: 'REFERENCE' as const,
    reference: { kind: 'CLASE' as const, id: '0', code: input.classCode },
  },
  family: {
    kind: 'REFERENCE' as const,
    reference: { kind: 'FAMILIA' as const, id: '0', code: input.familyCode },
  },
  type: {
    kind: 'REFERENCE' as const,
    reference: { kind: 'TIPO' as const, id: '0', code: input.typeCode },
  },
  characteristic: {
    kind: 'REFERENCE' as const,
    reference: {
      kind: 'CARACTERISTICA' as const,
      id: '0',
      code: input.characteristicCode,
    },
  },
  position: { kind: 'INTEGER' as const, value: input.position },
})

// Reads and edits real PRESENTACION records (what actually builds a
// Resource's presentation name — confirmed 2026-09-18 against garfex-api
// source, see odd/tasks/catalogo-presentacion-tab.md). Distinct from the
// retired catalogAttributeOrder.api.ts, which hit an unrelated
// /v1/types/{typeCode}/attributes/order endpoint and never touched
// PRESENTACION at all. Creating a presentation for an attribute that
// never had one reuses the existing
// CatalogAttributeCreationApi.createPresentation instead of duplicating
// that logic here.
export function createCatalogPresentationAdminApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
  actorOptions: RestActorOptions = {},
): CatalogPresentationAdminApi {
  return {
    async listPresentations(input) {
      if (!validListInput(input)) return bad()
      const query = new URLSearchParams({
        typeCode: input.typeCode,
        scope: 'ALL',
        offset: String(input.offset),
        limit: String(input.limit),
      })
      const response = await fetch('/v1/catalog/PRESENTACION?' + query, {
        signal: input.signal,
      })
      const body: unknown = await response.json()
      if (!response.ok) return httpError(response.status, body)
      const page = CatalogPageSchema.safeParse(body)
      if (!page.success) return bad()
      return {
        records: page.data.records.map((record) => item(record, input)),
        hasPrevious: page.data.hasPrevious,
        hasNext: page.data.hasNext,
      }
    },
    async updatePresentation(input) {
      return withRestActor(async (actor) => {
        if (!validUpdateInput(input)) return bad()
        const response = await fetch('/v1/catalog/PRESENTACION/' + input.id, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            actor,
            expectedRevision: input.expectedRevision,
            active: input.active,
            values: presentationValues(input),
          }),
        })
        const body: unknown = await response.json()
        if (!response.ok) return httpError(response.status, body)
        return item(body as CatalogRecord, input)
      }, actorOptions)
    },
  }
}

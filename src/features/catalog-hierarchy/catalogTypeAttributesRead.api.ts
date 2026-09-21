import {
  CatalogPageSchema,
  ErrorEnvelopeSchema,
  type CatalogRecord,
  type CatalogValue,
} from '../../shared/catalog/catalogRest.contract'
import type {
  CatalogTypeAttributesReadApi,
  DirectApplicabilityMode,
  DirectApplicabilityPage,
  DirectApplicabilityRecord,
  DirectApplicabilityReference,
  DirectApplicabilityRequest,
} from './catalogTypeAttributesRead.types'

const modes = new Set<DirectApplicabilityMode>([
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
  'FORBIDDEN',
])
const bad = (): never => {
  throw new Error('Invalid catalog type attributes response')
}
const validRequest = (input: DirectApplicabilityRequest) =>
  typeof input.classCode === 'string' &&
  input.classCode.length > 0 &&
  typeof input.familyCode === 'string' &&
  input.familyCode.length > 0 &&
  typeof input.typeCode === 'string' &&
  input.typeCode.length > 0 &&
  Number.isInteger(input.offset) &&
  input.offset >= 0 &&
  Number.isInteger(input.limit) &&
  input.limit >= 1 &&
  input.limit <= 50

type ReferenceKind =
  | 'CLASE'
  | 'FAMILIA'
  | 'TIPO'
  | 'CARACTERISTICA'
  | 'CONJUNTO_OPCIONES'
const reference = <Kind extends ReferenceKind>(
  value: CatalogValue | undefined,
  kind: Kind,
): DirectApplicabilityReference<Kind> => {
  if (
    value?.kind !== 'REFERENCE' ||
    value.reference.kind !== kind ||
    value.reference.code.length === 0
  )
    return bad()
  return value.reference as DirectApplicabilityReference<Kind>
}

const record = (
  value: CatalogRecord,
  input: DirectApplicabilityRequest,
): DirectApplicabilityRecord => {
  const classReference = reference(value.values.class, 'CLASE')
  const family = reference(value.values.family, 'FAMILIA')
  const characteristic = reference(
    value.values.characteristic,
    'CARACTERISTICA',
  )
  const type = reference(value.values.type, 'TIPO')
  const optionSet =
    value.values.optionSet === undefined
      ? undefined
      : reference(value.values.optionSet, 'CONJUNTO_OPCIONES')
  const mode = value.values.mode
  const identityParticipates = value.values.identityParticipates
  if (
    value.kind !== 'APLICABILIDAD' ||
    classReference.code !== input.classCode ||
    family.code !== input.familyCode ||
    type.code !== input.typeCode ||
    mode?.kind !== 'ENUM' ||
    !modes.has(mode.value as DirectApplicabilityMode) ||
    (identityParticipates !== undefined &&
      identityParticipates.kind !== 'BOOLEAN')
  )
    return bad()
  return {
    kind: 'APLICABILIDAD',
    id: value.id,
    revision: value.revision,
    active: value.active,
    class: classReference,
    family,
    characteristic,
    type,
    ...(optionSet === undefined ? {} : { optionSet }),
    mode: mode.value as DirectApplicabilityMode,
    rules: value.rules,
    ...(identityParticipates === undefined
      ? {}
      : { identityParticipates: identityParticipates.value }),
  }
}

export const parseDirectApplicabilityPage = (
  value: unknown,
  input: DirectApplicabilityRequest,
): DirectApplicabilityPage => {
  if (!validRequest(input)) return bad()
  const page = CatalogPageSchema.safeParse(value)
  if (!page.success) return bad()
  return {
    records: page.data.records.map((item) => record(item, input)),
    hasPrevious: page.data.hasPrevious,
    hasNext: page.data.hasNext,
  }
}

export function createCatalogTypeAttributesReadApi(
  fetch: typeof globalThis.fetch = globalThis.fetch,
): CatalogTypeAttributesReadApi {
  return {
    async listDirectApplicabilities(input) {
      if (!validRequest(input)) return bad()
      const query = new URLSearchParams({
        typeCode: input.typeCode,
        offset: String(input.offset),
        limit: String(input.limit),
      })
      const response = await fetch('/v1/catalog/APLICABILIDAD?' + query, {
        signal: input.signal,
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const error = ErrorEnvelopeSchema.safeParse(body)
        throw new Error(
          error.success ? error.data.error : 'HTTP ' + response.status,
        )
      }
      return parseDirectApplicabilityPage(body, input)
    },
  }
}

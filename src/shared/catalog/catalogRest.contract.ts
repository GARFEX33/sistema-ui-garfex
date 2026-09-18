import { z } from 'zod'

const integer = /^(?:0|-?[1-9][0-9]*)$/
const decimal = /^(?:0|-?(?:[1-9][0-9]*|(?:0|[1-9][0-9]*)\.[0-9]*[1-9]))$/

export const CatalogReferenceSchema = z
  .object({ kind: z.string(), id: z.string().regex(integer), code: z.string() })
  .strict()

export const CatalogValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('TEXT'), value: z.string() }).strict(),
  z.object({ kind: z.literal('CODE'), value: z.string() }).strict(),
  z.object({ kind: z.literal('BOOLEAN'), value: z.boolean() }).strict(),
  z
    .object({ kind: z.literal('INTEGER'), value: z.string().regex(integer) })
    .strict(),
  z
    .object({ kind: z.literal('DECIMAL'), value: z.string().regex(decimal) })
    .strict(),
  z
    .object({
      kind: z.literal('QUANTITY'),
      value: z.string().regex(decimal),
      unitCode: z.string(),
    })
    .strict(),
  z
    .object({ kind: z.literal('REFERENCE'), reference: CatalogReferenceSchema })
    .strict(),
  z.object({ kind: z.literal('ENUM'), value: z.string() }).strict(),
  z
    .object({ kind: z.literal('STRING_LIST'), values: z.array(z.string()) })
    .strict(),
  z
    .object({ kind: z.literal('CONTROLLED_OPTION'), value: z.string() })
    .strict(),
  z.object({ kind: z.literal('NOT_APPLICABLE') }).strict(),
])

export const ApplicabilityRuleSchema = z.object({
  attributeCode: z.string(),
  equals: CatalogValueSchema,
  mode: z.string(),
  identityParticipates: z.boolean(),
  notApplicable: z.boolean(),
  active: z.boolean(),
})

export const CatalogRecordSchema = z.object({
  kind: z.string(),
  id: z.string(),
  revision: z.string(),
  active: z.boolean(),
  values: z.record(z.string(), CatalogValueSchema),
  rules: z.array(ApplicabilityRuleSchema),
})

export const CatalogPageSchema = z.object({
  records: z.array(CatalogRecordSchema),
  hasPrevious: z.boolean(),
  hasNext: z.boolean(),
})

export const ErrorCodeSchema = z.enum([
  'INVALID_ARGUMENT',
  'NOT_FOUND',
  'DUPLICATE',
  'INVALID_REFERENCE',
  'VALIDATION',
  'INTEGRITY',
  'IDENTITY_CONFLICT',
  'INVALID_LIFECYCLE',
  'REACTIVATION_IMPOSSIBLE',
  'INVALID_CATALOG',
  'IN_USE',
  'IMMUTABLE_CODE',
  'CONFLICT',
  'UNAVAILABLE',
  'INTERNAL',
])

export const ErrorEnvelopeSchema = z.object({
  error: z.string(),
  code: ErrorCodeSchema.optional(),
  detail: z.string().optional(),
})

export type CatalogErrorCode = z.infer<typeof ErrorCodeSchema>
export type CatalogValue = z.infer<typeof CatalogValueSchema>
export type CatalogRecord = z.infer<typeof CatalogRecordSchema>
export type CatalogPage = z.infer<typeof CatalogPageSchema>

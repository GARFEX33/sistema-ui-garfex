import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import type { FunctionReference } from 'convex/server'
import type {
  AttributeAssignmentLifecycleInput,
  AttributeDataType,
  AttributeDefinition,
  AttributeDefinitionsInput,
  AttributeOption,
  AttributeOptionLifecycleInput,
  AttributeOptionsInput,
  ChangedAttributeDefinition,
  ChangedAttributeOption,
  ChangedTypeAttributeAssignment,
  CreatedAttributeDefinition,
  CreatedAttributeOption,
  CreatedTypeAttributeAssignment,
  CreateAttributeDefinitionInput,
  CreateAttributeOptionInput,
  CreateTypeAttributeAssignmentInput,
  OpaqueAttributeId,
  OpaqueAttributeRevision,
  TypeAttributeAssignment,
  TypeAttributeAssignmentsInput,
  TypeAttributePage,
  UpdateAttributeDefinitionInput,
  UpdateAttributeOptionInput,
  UpdateTypeAttributeAssignmentInput,
} from './catalogTypeAttributes.types'

export type CatalogTypeAttributesOperation =
  | 'catalogoAdmin/atributos:listarAsignacionesAtributo'
  | 'catalogoAdmin/atributos:listarDefinicionesAtributo'
  | 'catalogoAdmin/atributos:obtenerDefinicionAtributo'
  | 'catalogoAdmin/atributos:crearDefinicionAtributo'
  | 'catalogoAdmin/atributos:crearAsignacionAtributo'
  | 'catalogoAdmin/atributos:actualizarAsignacionAtributo'
  | 'catalogoAdmin/atributos:activarAsignacionAtributo'
  | 'catalogoAdmin/atributos:desactivarAsignacionAtributo'
  | 'catalogoAdmin/atributos:actualizarDefinicionAtributo'
  | 'catalogoAdmin/atributos:listarOpcionesAtributo'
  | 'catalogoAdmin/atributos:crearOpcionAtributo'
  | 'catalogoAdmin/atributos:actualizarOpcionAtributo'
  | 'catalogoAdmin/atributos:activarOpcionAtributo'
  | 'catalogoAdmin/atributos:desactivarOpcionAtributo'

export interface CatalogTypeAttributesTransport {
  invoke: (
    operation: CatalogTypeAttributesOperation,
    args: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>
}

export interface CatalogTypeAttributesConvexApiOptions {
  url?: string
}

export interface CatalogTypeAttributesApi {
  listTypeAssignments: (
    input: TypeAttributeAssignmentsInput,
  ) => Promise<TypeAttributePage<TypeAttributeAssignment>>
  getAttributeDefinition: (
    definicionAtributoId: OpaqueAttributeId,
  ) => Promise<AttributeDefinition | null>
  listAttributeDefinitions: (
    input?: AttributeDefinitionsInput,
  ) => Promise<TypeAttributePage<AttributeDefinition>>
  createAttributeDefinition: (
    input: CreateAttributeDefinitionInput,
  ) => Promise<CreatedAttributeDefinition>
  createTypeAttributeAssignment: (
    input: CreateTypeAttributeAssignmentInput,
  ) => Promise<CreatedTypeAttributeAssignment>
  updateTypeAttributeAssignment: (
    input: UpdateTypeAttributeAssignmentInput,
  ) => Promise<ChangedTypeAttributeAssignment>
  activateTypeAttributeAssignment: (
    input: AttributeAssignmentLifecycleInput,
  ) => Promise<ChangedTypeAttributeAssignment>
  deactivateTypeAttributeAssignment: (
    input: AttributeAssignmentLifecycleInput,
  ) => Promise<ChangedTypeAttributeAssignment>
  updateAttributeDefinition: (
    input: UpdateAttributeDefinitionInput,
  ) => Promise<ChangedAttributeDefinition>
  listAttributeOptions: (
    input: AttributeOptionsInput,
  ) => Promise<TypeAttributePage<AttributeOption>>
  createAttributeOption: (
    input: CreateAttributeOptionInput,
  ) => Promise<CreatedAttributeOption>
  updateAttributeOption: (
    input: UpdateAttributeOptionInput,
  ) => Promise<ChangedAttributeOption>
  activateAttributeOption: (
    input: AttributeOptionLifecycleInput,
  ) => Promise<ChangedAttributeOption>
  deactivateAttributeOption: (
    input: AttributeOptionLifecycleInput,
  ) => Promise<ChangedAttributeOption>
}

type CatalogRecord = Record<string, unknown>

type CatalogTypeAttributesQueryReference = FunctionReference<
  'query',
  'public',
  Record<string, unknown>,
  unknown
>
type CatalogTypeAttributesMutationReference = FunctionReference<
  'mutation',
  'public',
  Record<string, unknown>,
  unknown
>

const applicability = [
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
  'FORBIDDEN',
  'NOT_APPLICABLE',
] as const
const selections = ['SELECTED', 'SHADOWED', 'SUPPRESSED', 'NONE'] as const
const dataTypes = ['TEXTO', 'NUMERO', 'BOOLEANO', 'OPCION'] as const
const modes = ['ALL', 'ACTIVE', 'INACTIVE'] as const

const record = (value: unknown): value is CatalogRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const has = (value: CatalogRecord, key: string) => key in value

const bad = (): never => {
  throw new Error('Invalid catalog Type attributes response')
}

const validOpaqueId = (value: unknown): value is OpaqueAttributeId =>
  typeof value === 'string' && value.length > 0

const validRevision = (value: unknown): value is OpaqueAttributeRevision =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value > 0

const isOneOf = <T extends readonly string[]>(
  value: unknown,
  values: T,
): value is T[number] => typeof value === 'string' && values.includes(value)

const validReasons = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((reason) => typeof reason === 'string')

const page = (value: unknown) => {
  if (
    !record(value) ||
    !has(value, 'continuationCursor') ||
    (typeof value.continuationCursor !== 'string' &&
      value.continuationCursor !== null) ||
    typeof value.isExhausted !== 'boolean' ||
    !Array.isArray(value.items)
  ) {
    return bad()
  }

  return {
    continuationCursor: value.continuationCursor,
    isExhausted: value.isExhausted,
    items: value.items as unknown[],
  }
}

const assignment = (value: unknown): TypeAttributeAssignment => {
  if (
    !record(value) ||
    !validOpaqueId(value.id) ||
    !validOpaqueId(value.familiaRecursoId) ||
    !validOpaqueId(value.definicionAtributoId) ||
    !isOneOf(value.aplicabilidad, applicability) ||
    typeof value.participaIdentidad !== 'boolean' ||
    typeof value.orden !== 'number' ||
    !Number.isFinite(value.orden) ||
    typeof value.activo !== 'boolean' ||
    !validRevision(value.revision) ||
    typeof value.effective !== 'boolean' ||
    !validReasons(value.effectiveReasons) ||
    !isOneOf(value.selection, selections) ||
    (has(value, 'tipoRecursoId') &&
      value.tipoRecursoId !== undefined &&
      !validOpaqueId(value.tipoRecursoId))
  ) {
    return bad()
  }

  return {
    activo: value.activo,
    aplicabilidad: value.aplicabilidad,
    definicionAtributoId: value.definicionAtributoId,
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    familiaRecursoId: value.familiaRecursoId,
    id: value.id,
    orden: value.orden,
    participaIdentidad: value.participaIdentidad,
    revision: value.revision,
    selection: value.selection,
    ...(value.tipoRecursoId === undefined
      ? {}
      : { tipoRecursoId: value.tipoRecursoId as string }),
  }
}

export function parseTypeAttributeAssignmentsPage(
  value: unknown,
): TypeAttributePage<TypeAttributeAssignment> {
  const result = page(value)
  return { ...result, items: result.items.map(assignment) }
}

export function parseAttributeDefinitionsPage(
  value: unknown,
): TypeAttributePage<AttributeDefinition> {
  const result = page(value)
  return { ...result, items: result.items.map(parseAttributeDefinition) }
}

export function parseCreatedAttributeDefinition(
  value: unknown,
): CreatedAttributeDefinition {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: parseAttributeDefinition(value.item) }
}

export function parseCreatedTypeAttributeAssignment(
  value: unknown,
): CreatedTypeAttributeAssignment {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: assignment(value.item) }
}

export function parseChangedTypeAttributeAssignment(
  value: unknown,
): ChangedTypeAttributeAssignment {
  if (
    !record(value) ||
    (value.disposition !== 'UPDATED' && value.disposition !== 'UNCHANGED') ||
    !has(value, 'item')
  ) {
    return bad()
  }
  return { disposition: value.disposition, item: assignment(value.item) }
}

export function parseChangedAttributeDefinition(
  value: unknown,
): ChangedAttributeDefinition {
  if (
    !record(value) ||
    (value.disposition !== 'UPDATED' && value.disposition !== 'UNCHANGED') ||
    !has(value, 'item')
  ) {
    return bad()
  }
  return {
    disposition: value.disposition,
    item: parseAttributeDefinition(value.item),
  }
}

export function parseAttributeOption(value: unknown): AttributeOption {
  if (
    !record(value) ||
    !validOpaqueId(value.id) ||
    !validOpaqueId(value.definicionAtributoId) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string') ||
    typeof value.activo !== 'boolean' ||
    !validRevision(value.revision) ||
    typeof value.effective !== 'boolean' ||
    !validReasons(value.effectiveReasons)
  ) {
    return bad()
  }

  return {
    activo: value.activo,
    clave: value.clave,
    definicionAtributoId: value.definicionAtributoId,
    ...(value.descripcion === undefined
      ? {}
      : { descripcion: value.descripcion as string }),
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    id: value.id,
    nombre: value.nombre,
    revision: value.revision,
  }
}

export function parseAttributeOptionsPage(
  value: unknown,
): TypeAttributePage<AttributeOption> {
  const result = page(value)
  return { ...result, items: result.items.map(parseAttributeOption) }
}

export function parseCreatedAttributeOption(
  value: unknown,
): CreatedAttributeOption {
  if (!record(value) || value.disposition !== 'CREATED' || !has(value, 'item'))
    return bad()
  return { disposition: 'CREATED', item: parseAttributeOption(value.item) }
}

export function parseChangedAttributeOption(
  value: unknown,
): ChangedAttributeOption {
  if (
    !record(value) ||
    (value.disposition !== 'UPDATED' && value.disposition !== 'UNCHANGED') ||
    !has(value, 'item')
  ) {
    return bad()
  }
  return {
    disposition: value.disposition,
    item: parseAttributeOption(value.item),
  }
}

export function parseAttributeDefinition(value: unknown): AttributeDefinition {
  if (
    !record(value) ||
    !validOpaqueId(value.id) ||
    typeof value.clave !== 'string' ||
    typeof value.nombre !== 'string' ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string') ||
    !isOneOf(value.tipoDato, dataTypes) ||
    (has(value, 'unidadId') &&
      value.unidadId !== undefined &&
      !validOpaqueId(value.unidadId)) ||
    typeof value.activo !== 'boolean' ||
    !validRevision(value.revision) ||
    typeof value.effective !== 'boolean' ||
    !validReasons(value.effectiveReasons)
  ) {
    return bad()
  }

  return {
    activo: value.activo,
    clave: value.clave,
    ...(value.descripcion === undefined
      ? {}
      : { descripcion: value.descripcion as string }),
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    id: value.id,
    nombre: value.nombre,
    revision: value.revision,
    tipoDato: value.tipoDato as AttributeDataType,
    ...(value.unidadId === undefined
      ? {}
      : { unidadId: value.unidadId as string }),
  }
}

const assignmentArgs = (input: TypeAttributeAssignmentsInput) => {
  if (
    !validOpaqueId(input.tipoRecursoId) ||
    (input.cursor !== undefined &&
      typeof input.cursor !== 'string' &&
      input.cursor !== null) ||
    (input.mode !== undefined && !isOneOf(input.mode, modes)) ||
    (input.pageSize !== undefined &&
      (typeof input.pageSize !== 'number' || !Number.isFinite(input.pageSize)))
  ) {
    return bad()
  }

  return Object.freeze({
    tipoRecursoId: input.tipoRecursoId,
    ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
    ...(input.mode === undefined ? {} : { modo: input.mode }),
    ...(input.pageSize === undefined ? {} : { pageSize: input.pageSize }),
  })
}

const definitionsArgs = (input: AttributeDefinitionsInput = {}) => {
  if (
    (input.cursor !== undefined &&
      typeof input.cursor !== 'string' &&
      input.cursor !== null) ||
    (input.pageSize !== undefined &&
      (typeof input.pageSize !== 'number' || !Number.isFinite(input.pageSize)))
  ) {
    return bad()
  }
  return Object.freeze({
    modo: 'ALL' as const,
    ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
    ...(input.pageSize === undefined ? {} : { pageSize: input.pageSize }),
  })
}

const createDefinitionArgs = (input: CreateAttributeDefinitionInput) => {
  if (
    input.activo !== false ||
    typeof input.clave !== 'string' ||
    typeof input.nombre !== 'string' ||
    !isOneOf(input.tipoDato, dataTypes) ||
    (input.descripcion !== undefined && typeof input.descripcion !== 'string')
  ) {
    return bad()
  }
  return Object.freeze({
    activo: false,
    clave: input.clave,
    nombre: input.nombre,
    tipoDato: input.tipoDato,
    ...(input.descripcion === undefined
      ? {}
      : { descripcion: input.descripcion }),
  })
}

const createAssignmentArgs = (input: CreateTypeAttributeAssignmentInput) => {
  if (
    !validOpaqueId(input.definicionAtributoId) ||
    !validOpaqueId(input.familiaRecursoId) ||
    !validOpaqueId(input.tipoRecursoId) ||
    !isOneOf(input.aplicabilidad, applicability) ||
    typeof input.participaIdentidad !== 'boolean' ||
    typeof input.activo !== 'boolean' ||
    typeof input.orden !== 'number' ||
    !Number.isFinite(input.orden)
  ) {
    return bad()
  }
  return Object.freeze({ ...input })
}

const updateAssignmentArgs = (input: UpdateTypeAttributeAssignmentInput) => {
  if (
    !validOpaqueId(input.atributoRecursoId) ||
    !validRevision(input.expectedRevision) ||
    (input.aplicabilidad !== undefined &&
      !isOneOf(input.aplicabilidad, applicability)) ||
    (input.participaIdentidad !== undefined &&
      typeof input.participaIdentidad !== 'boolean') ||
    (input.orden !== undefined &&
      (typeof input.orden !== 'number' || !Number.isFinite(input.orden)))
  ) {
    return bad()
  }
  return Object.freeze({
    atributoRecursoId: input.atributoRecursoId,
    expectedRevision: input.expectedRevision,
    ...(input.aplicabilidad === undefined
      ? {}
      : { aplicabilidad: input.aplicabilidad }),
    ...(input.participaIdentidad === undefined
      ? {}
      : { participaIdentidad: input.participaIdentidad }),
    ...(input.orden === undefined ? {} : { orden: input.orden }),
  })
}

const assignmentLifecycleArgs = (input: AttributeAssignmentLifecycleInput) => {
  if (
    !validOpaqueId(input.atributoRecursoId) ||
    !validRevision(input.expectedRevision)
  )
    return bad()
  return Object.freeze({
    atributoRecursoId: input.atributoRecursoId,
    expectedRevision: input.expectedRevision,
  })
}

const updateDefinitionArgs = (input: UpdateAttributeDefinitionInput) => {
  if (
    !validOpaqueId(input.definicionAtributoId) ||
    !validRevision(input.expectedRevision) ||
    (input.nombre !== undefined && typeof input.nombre !== 'string') ||
    (input.descripcion !== undefined &&
      typeof input.descripcion !== 'string') ||
    (input.tipoDato !== undefined && !isOneOf(input.tipoDato, dataTypes)) ||
    (input.unidadId !== undefined &&
      input.unidadId !== null &&
      !validOpaqueId(input.unidadId))
  ) {
    return bad()
  }
  return Object.freeze({
    definicionAtributoId: input.definicionAtributoId,
    expectedRevision: input.expectedRevision,
    ...(input.nombre === undefined ? {} : { nombre: input.nombre }),
    ...(input.descripcion === undefined
      ? {}
      : { descripcion: input.descripcion }),
    ...(input.tipoDato === undefined ? {} : { tipoDato: input.tipoDato }),
    ...(input.unidadId === undefined ? {} : { unidadId: input.unidadId }),
  })
}

const optionsArgs = (input: AttributeOptionsInput) => {
  if (
    !isOneOf(input.mode, modes) ||
    (input.definicionAtributoId !== undefined &&
      !validOpaqueId(input.definicionAtributoId)) ||
    (input.cursor !== undefined &&
      typeof input.cursor !== 'string' &&
      input.cursor !== null) ||
    (input.pageSize !== undefined &&
      (typeof input.pageSize !== 'number' || !Number.isFinite(input.pageSize)))
  ) {
    return bad()
  }
  return Object.freeze({
    modo: input.mode,
    ...(input.definicionAtributoId === undefined
      ? {}
      : { definicionAtributoId: input.definicionAtributoId }),
    ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
    ...(input.pageSize === undefined ? {} : { pageSize: input.pageSize }),
  })
}

const createOptionArgs = (input: CreateAttributeOptionInput) => {
  if (
    !validOpaqueId(input.definicionAtributoId) ||
    typeof input.clave !== 'string' ||
    typeof input.nombre !== 'string' ||
    typeof input.activo !== 'boolean' ||
    (input.descripcion !== undefined && typeof input.descripcion !== 'string')
  ) {
    return bad()
  }
  return Object.freeze({
    activo: input.activo,
    clave: input.clave,
    definicionAtributoId: input.definicionAtributoId,
    nombre: input.nombre,
    ...(input.descripcion === undefined
      ? {}
      : { descripcion: input.descripcion }),
  })
}

const updateOptionArgs = (input: UpdateAttributeOptionInput) => {
  if (
    !validOpaqueId(input.opcionAtributoId) ||
    !validRevision(input.expectedRevision) ||
    (input.nombre !== undefined && typeof input.nombre !== 'string') ||
    (input.descripcion !== undefined && typeof input.descripcion !== 'string')
  ) {
    return bad()
  }
  return Object.freeze({
    expectedRevision: input.expectedRevision,
    opcionAtributoId: input.opcionAtributoId,
    ...(input.nombre === undefined ? {} : { nombre: input.nombre }),
    ...(input.descripcion === undefined
      ? {}
      : { descripcion: input.descripcion }),
  })
}

const optionLifecycleArgs = (input: AttributeOptionLifecycleInput) => {
  if (
    !validOpaqueId(input.opcionAtributoId) ||
    !validRevision(input.expectedRevision)
  )
    return bad()
  return Object.freeze({
    expectedRevision: input.expectedRevision,
    opcionAtributoId: input.opcionAtributoId,
  })
}

const configuredUrl = (options: CatalogTypeAttributesConvexApiOptions) =>
  'url' in options ? options.url : import.meta.env.VITE_CONVEX_URL

const validHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.length > 0
    )
  } catch {
    return false
  }
}

const queryReference = (
  name: CatalogTypeAttributesOperation,
): CatalogTypeAttributesQueryReference =>
  makeFunctionReference<'query', Record<string, unknown>, unknown>(name)

const listAssignmentsReference = queryReference(
  'catalogoAdmin/atributos:listarAsignacionesAtributo',
)
const getDefinitionReference = queryReference(
  'catalogoAdmin/atributos:obtenerDefinicionAtributo',
)
const listDefinitionsReference = queryReference(
  'catalogoAdmin/atributos:listarDefinicionesAtributo',
)
const createDefinitionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:crearDefinicionAtributo',
) as CatalogTypeAttributesMutationReference
const createAssignmentReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:crearAsignacionAtributo',
) as CatalogTypeAttributesMutationReference
const updateAssignmentReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:actualizarAsignacionAtributo',
) as CatalogTypeAttributesMutationReference
const activateAssignmentReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:activarAsignacionAtributo',
) as CatalogTypeAttributesMutationReference
const deactivateAssignmentReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:desactivarAsignacionAtributo',
) as CatalogTypeAttributesMutationReference
const updateDefinitionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:actualizarDefinicionAtributo',
) as CatalogTypeAttributesMutationReference
const listOptionsReference = queryReference(
  'catalogoAdmin/atributos:listarOpcionesAtributo',
)
const createOptionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:crearOpcionAtributo',
) as CatalogTypeAttributesMutationReference
const updateOptionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:actualizarOpcionAtributo',
) as CatalogTypeAttributesMutationReference
const activateOptionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:activarOpcionAtributo',
) as CatalogTypeAttributesMutationReference
const deactivateOptionReference = makeFunctionReference<
  'mutation',
  Record<string, unknown>,
  unknown
>(
  'catalogoAdmin/atributos:desactivarOpcionAtributo',
) as CatalogTypeAttributesMutationReference

export function createCatalogTypeAttributesConvexApi(
  options: CatalogTypeAttributesConvexApiOptions = {},
): CatalogTypeAttributesApi {
  let client: ConvexHttpClient | undefined
  const transport: CatalogTypeAttributesTransport = {
    invoke: async (operation, args) => {
      const url = configuredUrl(options)
      if (!validHttpUrl(url))
        throw new Error('Catalog Type attributes transport unavailable')
      client ??= new ConvexHttpClient(url)
      switch (operation) {
        case 'catalogoAdmin/atributos:listarAsignacionesAtributo':
          return client.query(listAssignmentsReference, { ...args })
        case 'catalogoAdmin/atributos:listarDefinicionesAtributo':
          return client.query(listDefinitionsReference, { ...args })
        case 'catalogoAdmin/atributos:obtenerDefinicionAtributo':
          return client.query(getDefinitionReference, { ...args })
        case 'catalogoAdmin/atributos:crearDefinicionAtributo':
          return client.mutation(createDefinitionReference, { ...args })
        case 'catalogoAdmin/atributos:crearAsignacionAtributo':
          return client.mutation(createAssignmentReference, { ...args })
        case 'catalogoAdmin/atributos:actualizarAsignacionAtributo':
          return client.mutation(updateAssignmentReference, { ...args })
        case 'catalogoAdmin/atributos:activarAsignacionAtributo':
          return client.mutation(activateAssignmentReference, { ...args })
        case 'catalogoAdmin/atributos:desactivarAsignacionAtributo':
          return client.mutation(deactivateAssignmentReference, { ...args })
        case 'catalogoAdmin/atributos:actualizarDefinicionAtributo':
          return client.mutation(updateDefinitionReference, { ...args })
        case 'catalogoAdmin/atributos:listarOpcionesAtributo':
          return client.query(listOptionsReference, { ...args })
        case 'catalogoAdmin/atributos:crearOpcionAtributo':
          return client.mutation(createOptionReference, { ...args })
        case 'catalogoAdmin/atributos:actualizarOpcionAtributo':
          return client.mutation(updateOptionReference, { ...args })
        case 'catalogoAdmin/atributos:activarOpcionAtributo':
          return client.mutation(activateOptionReference, { ...args })
        case 'catalogoAdmin/atributos:desactivarOpcionAtributo':
          return client.mutation(deactivateOptionReference, { ...args })
      }
    },
  }
  return createCatalogTypeAttributesApi(transport)
}

export function createCatalogTypeAttributesApi(
  transport: CatalogTypeAttributesTransport,
): CatalogTypeAttributesApi {
  return {
    async listTypeAssignments(input) {
      return parseTypeAttributeAssignmentsPage(
        await transport.invoke(
          'catalogoAdmin/atributos:listarAsignacionesAtributo',
          assignmentArgs(input),
        ),
      )
    },
    async getAttributeDefinition(definicionAtributoId) {
      if (!validOpaqueId(definicionAtributoId)) return bad()
      const result = await transport.invoke(
        'catalogoAdmin/atributos:obtenerDefinicionAtributo',
        Object.freeze({ definicionAtributoId }),
      )
      return result === null ? null : parseAttributeDefinition(result)
    },
    async listAttributeDefinitions(input) {
      return parseAttributeDefinitionsPage(
        await transport.invoke(
          'catalogoAdmin/atributos:listarDefinicionesAtributo',
          definitionsArgs(input),
        ),
      )
    },
    async createAttributeDefinition(input) {
      return parseCreatedAttributeDefinition(
        await transport.invoke(
          'catalogoAdmin/atributos:crearDefinicionAtributo',
          createDefinitionArgs(input),
        ),
      )
    },
    async createTypeAttributeAssignment(input) {
      return parseCreatedTypeAttributeAssignment(
        await transport.invoke(
          'catalogoAdmin/atributos:crearAsignacionAtributo',
          createAssignmentArgs(input),
        ),
      )
    },
    async updateTypeAttributeAssignment(input) {
      return parseChangedTypeAttributeAssignment(
        await transport.invoke(
          'catalogoAdmin/atributos:actualizarAsignacionAtributo',
          updateAssignmentArgs(input),
        ),
      )
    },
    async activateTypeAttributeAssignment(input) {
      return parseChangedTypeAttributeAssignment(
        await transport.invoke(
          'catalogoAdmin/atributos:activarAsignacionAtributo',
          assignmentLifecycleArgs(input),
        ),
      )
    },
    async deactivateTypeAttributeAssignment(input) {
      return parseChangedTypeAttributeAssignment(
        await transport.invoke(
          'catalogoAdmin/atributos:desactivarAsignacionAtributo',
          assignmentLifecycleArgs(input),
        ),
      )
    },
    async updateAttributeDefinition(input) {
      return parseChangedAttributeDefinition(
        await transport.invoke(
          'catalogoAdmin/atributos:actualizarDefinicionAtributo',
          updateDefinitionArgs(input),
        ),
      )
    },
    async listAttributeOptions(input) {
      return parseAttributeOptionsPage(
        await transport.invoke(
          'catalogoAdmin/atributos:listarOpcionesAtributo',
          optionsArgs(input),
        ),
      )
    },
    async createAttributeOption(input) {
      return parseCreatedAttributeOption(
        await transport.invoke(
          'catalogoAdmin/atributos:crearOpcionAtributo',
          createOptionArgs(input),
        ),
      )
    },
    async updateAttributeOption(input) {
      return parseChangedAttributeOption(
        await transport.invoke(
          'catalogoAdmin/atributos:actualizarOpcionAtributo',
          updateOptionArgs(input),
        ),
      )
    },
    async activateAttributeOption(input) {
      return parseChangedAttributeOption(
        await transport.invoke(
          'catalogoAdmin/atributos:activarOpcionAtributo',
          optionLifecycleArgs(input),
        ),
      )
    },
    async deactivateAttributeOption(input) {
      return parseChangedAttributeOption(
        await transport.invoke(
          'catalogoAdmin/atributos:desactivarOpcionAtributo',
          optionLifecycleArgs(input),
        ),
      )
    },
  }
}

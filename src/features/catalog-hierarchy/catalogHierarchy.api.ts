import type {
  CatalogClassItem,
  CatalogFamilyItem,
  CatalogId,
  CatalogListPage,
  CatalogTypeItem,
  CatalogViolation,
} from './catalogHierarchy.types'

type CatalogRecord = Record<string, unknown>

const record = (value: unknown): value is CatalogRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const has = (value: CatalogRecord, key: string) => key in value

const bad = (): never => {
  throw new Error('Invalid catalog hierarchy response')
}

const base = (value: unknown) => {
  if (
    !record(value) ||
    typeof value.activo !== 'boolean' ||
    typeof value.clave !== 'string' ||
    typeof value.effective !== 'boolean' ||
    !Array.isArray(value.effectiveReasons) ||
    !value.effectiveReasons.every((reason) => typeof reason === 'string') ||
    value.id === undefined ||
    value.id === null ||
    typeof value.nombre !== 'string' ||
    value.revision === undefined ||
    value.revision === null ||
    (has(value, 'descripcion') &&
      value.descripcion !== undefined &&
      typeof value.descripcion !== 'string')
  ) {
    return bad()
  }

  const description = value.descripcion
  return {
    activo: value.activo,
    clave: value.clave,
    ...(description === undefined
      ? {}
      : { descripcion: description as string }),
    effective: value.effective,
    effectiveReasons: [...value.effectiveReasons],
    id: value.id,
    nombre: value.nombre,
    revision: value.revision,
  }
}

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

export function parseClassesPage(
  value: unknown,
): CatalogListPage<CatalogClassItem> {
  const result = page(value)
  return { ...result, items: result.items.map(base) }
}

export function parseFamiliesPage(
  value: unknown,
  parentId?: CatalogId,
): CatalogListPage<CatalogFamilyItem> {
  const result = page(value)
  return {
    ...result,
    items: result.items.map((item) => {
      const parsed = base(item)
      if (
        !record(item) ||
        item.claseRecursoId === undefined ||
        item.claseRecursoId === null ||
        (parentId !== undefined && !Object.is(item.claseRecursoId, parentId))
      ) {
        return bad()
      }
      return { ...parsed, claseRecursoId: item.claseRecursoId }
    }),
  }
}

const structuredViolation = (value: unknown): value is CatalogViolation =>
  record(value)

export function parseTypesPage(
  value: unknown,
  parentId?: CatalogId,
): CatalogListPage<CatalogTypeItem> {
  const result = page(value)
  return {
    ...result,
    items: result.items.map((item) => {
      const parsed = base(item)
      if (
        !record(item) ||
        typeof item.aggregateStatus !== 'string' ||
        item.familiaRecursoId === undefined ||
        item.familiaRecursoId === null ||
        !Array.isArray(item.violations) ||
        !item.violations.every(structuredViolation) ||
        (parentId !== undefined && !Object.is(item.familiaRecursoId, parentId))
      ) {
        return bad()
      }
      return {
        ...parsed,
        aggregateStatus: item.aggregateStatus,
        familiaRecursoId: item.familiaRecursoId,
        violations: [...item.violations],
      }
    }),
  }
}

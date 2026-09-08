export type AssignmentKey = string

export type SelectionBuckets<TSelection> = Readonly<{
  active: Readonly<Record<AssignmentKey, TSelection>>
  suspended: Readonly<Record<AssignmentKey, TSelection>>
  omitted: ReadonlySet<AssignmentKey>
}>

export const createSelectionBuckets = <
  TSelection,
>(): SelectionBuckets<TSelection> => ({
  active: {},
  suspended: {},
  omitted: new Set(),
})

const hasKey = <TSelection>(
  selections: Readonly<Record<AssignmentKey, TSelection>>,
  key: AssignmentKey,
) => Object.prototype.hasOwnProperty.call(selections, key)

const withoutKey = <TSelection>(
  selections: Readonly<Record<AssignmentKey, TSelection>>,
  key: AssignmentKey,
) => {
  const next = { ...selections }
  delete next[key]
  return next
}

export const confirmSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
  selection: TSelection,
): SelectionBuckets<TSelection> => {
  if (
    hasKey(buckets.active, key) &&
    buckets.active[key] === selection &&
    !hasKey(buckets.suspended, key) &&
    !buckets.omitted.has(key)
  )
    return buckets

  const omitted = new Set(buckets.omitted)
  omitted.delete(key)
  return {
    active: { ...buckets.active, [key]: selection },
    suspended: withoutKey(buckets.suspended, key),
    omitted,
  }
}

export const clearSelectionOmission = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
): SelectionBuckets<TSelection> => {
  if (!buckets.omitted.has(key)) return buckets

  const omitted = new Set(buckets.omitted)
  omitted.delete(key)
  return { ...buckets, omitted }
}

export const omitSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
): SelectionBuckets<TSelection> => {
  if (
    !hasKey(buckets.active, key) &&
    !hasKey(buckets.suspended, key) &&
    buckets.omitted.has(key)
  )
    return buckets

  return {
    active: withoutKey(buckets.active, key),
    suspended: withoutKey(buckets.suspended, key),
    omitted: new Set(buckets.omitted).add(key),
  }
}

export const suspendSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
): SelectionBuckets<TSelection> => {
  if (!hasKey(buckets.active, key)) return buckets

  return {
    active: withoutKey(buckets.active, key),
    suspended: { ...buckets.suspended, [key]: buckets.active[key] },
    omitted: buckets.omitted,
  }
}

export const restoreSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
  isAuthoritativelyApplicableAndValid: boolean,
): SelectionBuckets<TSelection> => {
  if (!isAuthoritativelyApplicableAndValid || !hasKey(buckets.suspended, key))
    return buckets

  const omitted = new Set(buckets.omitted)
  omitted.delete(key)
  return {
    active: { ...buckets.active, [key]: buckets.suspended[key] },
    suspended: withoutKey(buckets.suspended, key),
    omitted,
  }
}

export const keepSuspended = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
): SelectionBuckets<TSelection> => {
  if (!hasKey(buckets.suspended, key) || !hasKey(buckets.active, key))
    return buckets

  return { ...buckets, active: withoutKey(buckets.active, key) }
}

export const projectActiveSelections = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
): Readonly<Record<AssignmentKey, TSelection>> => ({ ...buckets.active })

export type AssignmentKey = string

export type SelectionBuckets<TSelection> = Readonly<{
  active: Readonly<Record<AssignmentKey, TSelection>>
  suspended: Readonly<Record<AssignmentKey, TSelection>>
  backendInvalid?: ReadonlySet<AssignmentKey>
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
    !buckets.backendInvalid?.has(key) &&
    !buckets.omitted.has(key)
  )
    return buckets

  const omitted = new Set(buckets.omitted)
  const backendInvalid = new Set(buckets.backendInvalid)
  omitted.delete(key)
  backendInvalid.delete(key)
  return {
    active: { ...buckets.active, [key]: selection },
    suspended: withoutKey(buckets.suspended, key),
    ...(backendInvalid.size ? { backendInvalid } : {}),
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
    !buckets.backendInvalid?.has(key) &&
    buckets.omitted.has(key)
  )
    return buckets

  const backendInvalid = new Set(buckets.backendInvalid)
  backendInvalid.delete(key)
  return {
    active: withoutKey(buckets.active, key),
    suspended: withoutKey(buckets.suspended, key),
    ...(backendInvalid.size ? { backendInvalid } : {}),
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
    ...(buckets.backendInvalid
      ? { backendInvalid: buckets.backendInvalid }
      : {}),
    omitted: buckets.omitted,
  }
}

export const suspendBackendInvalidSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
): SelectionBuckets<TSelection> => {
  if (!hasKey(buckets.active, key) && !hasKey(buckets.suspended, key))
    return buckets

  const suspended = suspendSelection(buckets, key)
  if (suspended.backendInvalid?.has(key)) return suspended
  return {
    ...suspended,
    backendInvalid: new Set(suspended.backendInvalid).add(key),
  }
}

export const restoreSelection = <TSelection>(
  buckets: SelectionBuckets<TSelection>,
  key: AssignmentKey,
  confirmedSelection: TSelection,
): SelectionBuckets<TSelection> => {
  if (
    !hasKey(buckets.suspended, key) ||
    buckets.backendInvalid?.has(key) ||
    buckets.suspended[key] !== confirmedSelection
  )
    return buckets

  const omitted = new Set(buckets.omitted)
  omitted.delete(key)
  return {
    active: { ...buckets.active, [key]: confirmedSelection },
    suspended: withoutKey(buckets.suspended, key),
    ...(buckets.backendInvalid
      ? { backendInvalid: buckets.backendInvalid }
      : {}),
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

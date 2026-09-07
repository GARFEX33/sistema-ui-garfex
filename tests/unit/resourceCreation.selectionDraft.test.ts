import { describe, expect, it } from 'vitest'
import {
  confirmSelection,
  createSelectionBuckets,
  keepSuspended,
  omitSelection,
  projectActiveSelections,
  restoreSelection,
  suspendSelection,
} from '../../src/features/resources-master/resourceCreation.selectionDraft'

const cable = { opaqueValue: 'cable' }
const fiber = { opaqueValue: 'fiber' }

describe('resource creation selection buckets', () => {
  it('keys opaque values by assignment ID rather than definition ID or position', () => {
    const buckets = confirmSelection(
      confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
      'assignment-2',
      fiber,
    )

    expect(projectActiveSelections(buckets)).toEqual({
      'assignment-1': cable,
      'assignment-2': fiber,
    })
  })

  it('keeps same-definition assignments at different indexes distinct and distinguishes omission from unanswered', () => {
    const assignments = [
      { assignmentId: 'assignment-1', definitionId: 'definition-1', index: 0 },
      { assignmentId: 'assignment-2', definitionId: 'definition-1', index: 1 },
    ]
    const selected = confirmSelection(
      confirmSelection(
        createSelectionBuckets(),
        assignments[0].assignmentId,
        cable,
      ),
      assignments[1].assignmentId,
      fiber,
    )
    const unanswered = createSelectionBuckets<typeof cable>()
    const omitted = omitSelection(unanswered, assignments[0].assignmentId)

    expect(projectActiveSelections(selected)).toEqual({
      'assignment-1': cable,
      'assignment-2': fiber,
    })
    expect(unanswered.omitted.has(assignments[0].assignmentId)).toBe(false)
    expect(omitted.omitted.has(assignments[0].assignmentId)).toBe(true)
  })

  it('confirms an active selection exclusively and clears its omission', () => {
    const suspended = suspendSelection(
      confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
      'assignment-1',
    )
    const omitted = omitSelection(suspended, 'assignment-1')
    const confirmed = confirmSelection(omitted, 'assignment-1', fiber)

    expect(confirmed).toEqual({
      active: { 'assignment-1': fiber },
      suspended: {},
      omitted: new Set(),
    })
  })

  it('confirms an opaque undefined value only when its active key is own', () => {
    const key = 'assignment-undefined'
    const buckets = {
      active: Object.create({ [key]: undefined }) as Record<string, undefined>,
      suspended: {},
      omitted: new Set<string>(),
    }
    const confirmed = confirmSelection(buckets, key, undefined)

    expect(confirmed).not.toBe(buckets)
    expect(Object.hasOwn(confirmed.active, key)).toBe(true)
    expect(projectActiveSelections(confirmed)).toEqual({ [key]: undefined })
  })

  it('omits a suspended selection exclusively', () => {
    const omitted = omitSelection(
      suspendSelection(
        confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
        'assignment-1',
      ),
      'assignment-1',
    )

    expect(omitted).toEqual({
      active: {},
      suspended: {},
      omitted: new Set(['assignment-1']),
    })
  })

  it('records an omission without fabricating a selection or eligibility', () => {
    const omitted = omitSelection(
      confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
      'assignment-1',
    )

    expect(omitted).toEqual({
      active: {},
      suspended: {},
      omitted: new Set(['assignment-1']),
    })
    expect(projectActiveSelections(omitted)).toEqual({})
  })

  it('suspends an active opaque value and only restores it when authorized', () => {
    const suspended = suspendSelection(
      confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
      'assignment-1',
    )

    expect(suspended).toEqual({
      active: {},
      suspended: { 'assignment-1': cable },
      omitted: new Set(),
    })
    expect(restoreSelection(suspended, 'assignment-1', false)).toBe(suspended)
    expect(restoreSelection(suspended, 'assignment-1', true)).toEqual({
      active: { 'assignment-1': cable },
      suspended: {},
      omitted: new Set(),
    })
  })

  it('keeps an invalid suspended selection out of the active-only projection', () => {
    const suspended = suspendSelection(
      confirmSelection(createSelectionBuckets(), 'assignment-1', cable),
      'assignment-1',
    )

    const conflicting = {
      active: { 'assignment-1': fiber },
      suspended: { 'assignment-1': cable },
      omitted: new Set<string>(),
    }

    expect(keepSuspended(suspended, 'assignment-1')).toBe(suspended)
    expect(keepSuspended(conflicting, 'assignment-1')).toEqual({
      active: {},
      suspended: { 'assignment-1': cable },
      omitted: new Set(),
    })
    expect(projectActiveSelections(suspended)).toEqual({})
  })
})

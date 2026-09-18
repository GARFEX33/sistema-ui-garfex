import { useCallback, useEffect, useRef, useState } from 'react'
import { hasRestActor } from '../../shared/api/restActor'
import {
  derivePresentationRows,
  type PresentationRow,
  type PresentationRows,
} from './catalogPresentationRows'
import type {
  CatalogPresentationAdminApi,
  CatalogPresentationListItem,
} from './catalogPresentationAdmin.api'
import type { CatalogAttributeCreationApi } from './catalogAttributeCreation.types'
import type { EffectiveAttribute } from '../../shared/catalog/effectiveAttributes.contract'

type Context = Readonly<{
  classCode?: string
  familyCode?: string
  typeCode?: string
}>
type Snapshot = Readonly<{
  classCode: string
  familyCode: string
  typeCode: string
}>
type ReadStatus = 'waiting-context' | 'loading' | 'ready' | 'error'
type CommandStatus = 'idle' | 'pending' | 'error'

type Options = Readonly<{
  presentationApi: CatalogPresentationAdminApi
  creationApi: Pick<
    CatalogAttributeCreationApi,
    | 'createPresentation'
    | 'resolveHierarchyReferences'
    | 'searchCharacteristics'
  >
  context: Context
  attributes: readonly EffectiveAttribute[]
  canSubmit?: () => boolean
}>

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const snapshotOf = (context: Context): Snapshot | null =>
  nonEmpty(context.classCode) &&
  nonEmpty(context.familyCode) &&
  nonEmpty(context.typeCode)
    ? {
        classCode: context.classCode,
        familyCode: context.familyCode,
        typeCode: context.typeCode,
      }
    : null

const errorOf = (value: unknown) =>
  value instanceof Error ? value : new Error('Request failed')

// Positions are not guaranteed to be a compact 0-based sequence (deactivated
// rows leave gaps, e.g. 1/2/3 instead of 0/1). Position uniqueness is
// enforced per Tipo regardless of active status — an inactive row still
// holds its position (confirmed live: PUTting another row to it 409s) — so
// the next free slot must clear every real record, not just the
// active/participating ones.
const nextPosition = (records: readonly CatalogPresentationListItem[]) =>
  String(
    records.reduce(
      (max, record) => Math.max(max, Number(record.position)),
      -1,
    ) + 1,
  )

// Reads real PRESENTACION rows (source of truth for the Presentación tab's
// editor) and drives toggling participation / reordering. Every write is
// its own immediate PUT/POST — there is no batch "save the whole order"
// endpoint for PRESENTACION, unlike the retired cosmetic order feature —
// so each action commits on its own and the list is refetched afterward
// rather than kept as an optimistic local draft.
export function useCatalogPresentationAdmin({
  presentationApi,
  creationApi,
  context,
  attributes,
  canSubmit = hasRestActor,
}: Options) {
  const snapshot = snapshotOf(context)
  const key = snapshot === null ? null : JSON.stringify(snapshot)
  const apiRef = useRef(presentationApi)
  const creationRef = useRef(creationApi)
  const attributesRef = useRef(attributes)
  apiRef.current = presentationApi
  creationRef.current = creationApi
  attributesRef.current = attributes

  const [status, setStatus] = useState<ReadStatus>(
    snapshot === null ? 'waiting-context' : 'loading',
  )
  const [presentations, setPresentations] = useState<
    readonly CatalogPresentationListItem[]
  >([])
  const [error, setError] = useState<Error | null>(null)
  const [commandStatus, setCommandStatus] = useState<CommandStatus>('idle')
  const [commandError, setCommandError] = useState<Error | null>(null)
  const generation = useRef(0)

  const load = useCallback(async (value: Snapshot) => {
    const gen = ++generation.current
    setStatus('loading')
    try {
      const page = await apiRef.current.listPresentations({
        classCode: value.classCode,
        familyCode: value.familyCode,
        typeCode: value.typeCode,
        offset: 0,
        limit: 50,
      })
      if (gen !== generation.current) return
      setPresentations(page.records)
      setStatus('ready')
      setError(null)
    } catch (caught) {
      if (gen !== generation.current) return
      setStatus('error')
      setError(errorOf(caught))
    }
  }, [])

  useEffect(() => {
    if (snapshot === null) {
      generation.current += 1
      setStatus('waiting-context')
      setPresentations([])
      setError(null)
      return
    }
    void load(snapshot)
    // key is the real dependency: it changes exactly when snapshot's
    // content changes, load reads the freshest snapshot value itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load])

  const retry = useCallback(() => {
    if (snapshot) void load(snapshot)
  }, [load, snapshot])

  const refresh = useCallback(() => {
    if (snapshot) void load(snapshot)
  }, [load, snapshot])

  const runCommand = async (action: () => Promise<unknown>) => {
    if (!canSubmit()) {
      setCommandStatus('error')
      setCommandError(new Error('A local REST actor is required'))
      return false
    }
    setCommandStatus('pending')
    setCommandError(null)
    try {
      await action()
      setCommandStatus('idle')
      refresh()
      return true
    } catch (caught) {
      setCommandStatus('error')
      setCommandError(errorOf(caught))
      refresh()
      return false
    }
  }

  const toggleParticipation = useCallback(
    (row: PresentationRow) => {
      if (snapshot === null) return Promise.resolve(false)
      const { classCode, familyCode, typeCode } = snapshot
      const turningOn = !row.active
      if (row.id === null) {
        const position = nextPosition(presentations)
        // createPresentation echoes back the backend-resolved reference and
        // rejects the response unless it matches the request byte for byte,
        // including id — so the request must carry the REAL ids (confirmed
        // live: sending the usual placeholder id:'0' throws "Invalid
        // presentation creation response" even though the row is created).
        // resolveHierarchyReferences + searchCharacteristics are the same
        // capabilities the attribute-creation flow already resolves through.
        return runCommand(async () => {
          const references =
            await creationRef.current.resolveHierarchyReferences({
              classCode,
              familyCode,
              typeCode,
            })
          const found = await creationRef.current.searchCharacteristics({
            scope: 'ACTIVE',
            text: row.characteristicCode,
            limit: 50,
            offset: 0,
          })
          const characteristic = found.records.find(
            (record) => record.code === row.characteristicCode,
          )
          if (!characteristic)
            throw new Error(
              `Characteristic not found: ${row.characteristicCode}`,
            )
          return creationRef.current.createPresentation({
            ...references,
            characteristic: {
              kind: 'REFERENCE',
              reference: {
                kind: 'CARACTERISTICA',
                id: characteristic.id,
                code: characteristic.code,
              },
            },
            position,
          })
        })
      }
      const position = turningOn
        ? nextPosition(presentations)
        : (row.position ?? '0')
      return runCommand(() =>
        apiRef.current.updatePresentation({
          id: row.id!,
          expectedRevision: row.revision!,
          active: turningOn,
          classCode,
          familyCode,
          typeCode,
          characteristicCode: row.characteristicCode,
          position,
        }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, presentations],
  )

  const swap = useCallback(
    (characteristicCode: string, direction: -1 | 1) => {
      if (snapshot === null) return Promise.resolve(false)
      const { classCode, familyCode, typeCode } = snapshot
      const { participating } = derivePresentationRows(
        attributesRef.current,
        presentations,
      )
      const index = participating.findIndex(
        (row) => row.characteristicCode === characteristicCode,
      )
      const targetIndex = index + direction
      if (
        index === -1 ||
        targetIndex < 0 ||
        targetIndex >= participating.length
      )
        return Promise.resolve(false)
      const current = participating[index]!
      const target = participating[targetIndex]!
      // A live position is unique per Tipo, and each PUT is checked and
      // committed independently — two concurrent updates that each target
      // the other's still-current position collide (confirmed live: both
      // requests come back 409 DUPLICATE). Route current through a scratch
      // position beyond every participating slot first, so no update ever
      // asks for a position another row still holds.
      const scratchPosition = nextPosition(presentations)
      return runCommand(async () => {
        const moved = await apiRef.current.updatePresentation({
          id: current.id!,
          expectedRevision: current.revision!,
          active: true,
          classCode,
          familyCode,
          typeCode,
          characteristicCode: current.characteristicCode,
          position: scratchPosition,
        })
        await apiRef.current.updatePresentation({
          id: target.id!,
          expectedRevision: target.revision!,
          active: true,
          classCode,
          familyCode,
          typeCode,
          characteristicCode: target.characteristicCode,
          position: current.position!,
        })
        await apiRef.current.updatePresentation({
          id: current.id!,
          expectedRevision: moved.revision,
          active: true,
          classCode,
          familyCode,
          typeCode,
          characteristicCode: current.characteristicCode,
          position: target.position!,
        })
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, presentations],
  )

  const moveUp = useCallback(
    (characteristicCode: string) => swap(characteristicCode, -1),
    [swap],
  )
  const moveDown = useCallback(
    (characteristicCode: string) => swap(characteristicCode, 1),
    [swap],
  )

  const rows: PresentationRows | null =
    status === 'ready'
      ? derivePresentationRows(attributes, presentations)
      : null

  return {
    status,
    rows,
    error,
    retry,
    commandStatus,
    commandError,
    canSave: canSubmit(),
    toggleParticipation,
    moveUp,
    moveDown,
  }
}

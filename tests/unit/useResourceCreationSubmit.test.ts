import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResourceCreationSubmit } from '../../src/features/resources-master/useResourceCreationSubmit'
import type {
  Resource,
  ResourceRestCreateInput,
} from '../../src/features/resources-master/resourcesMaster.types'

const input: ResourceRestCreateInput = {
  scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
  naturalUnit: 'PZA',
  attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'rojo' } }],
}

const resource: Resource = {
  id: 'resource-1',
  identityV1: 'CLASE-1-FAM-1-TIPO-1-ROJO',
  scope: { classCode: 'CLASE-1', familyCode: 'FAM-1', typeCode: 'TIPO-1' },
  naturalUnit: 'PZA',
  active: true,
  revision: 'rev-1',
  attributes: [{ code: 'color', value: { kind: 'TEXT', value: 'rojo' } }],
}

describe('useResourceCreationSubmit', () => {
  it('starts idle', () => {
    const createResource = vi.fn()
    const { result } = renderHook(() =>
      useResourceCreationSubmit({ createResource }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('goes idle -> submitting -> success and returns the created resource', async () => {
    let resolve!: (value: Resource) => void
    const createResource = vi.fn(
      () => new Promise<Resource>((res) => (resolve = res)),
    )
    const { result } = renderHook(() =>
      useResourceCreationSubmit({ createResource }),
    )

    act(() => {
      void result.current.submit(input)
    })
    await waitFor(() => expect(result.current.status).toBe('submitting'))

    await act(async () => resolve(resource))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.result).toEqual(resource)
    expect(createResource).toHaveBeenCalledTimes(1)
    expect(createResource).toHaveBeenCalledWith(input)
  })

  it('goes idle -> submitting -> error and exposes the thrown error', async () => {
    let reject!: (reason: unknown) => void
    const createResource = vi.fn(
      () => new Promise<Resource>((_res, rej) => (reject = rej)),
    )
    const { result } = renderHook(() =>
      useResourceCreationSubmit({ createResource }),
    )

    act(() => {
      void result.current.submit(input)
    })
    await waitFor(() => expect(result.current.status).toBe('submitting'))

    const failure = new Error('El código ya existe')
    await act(async () => reject(failure))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe(failure)
    expect((result.current.error as Error).message).toBe('El código ya existe')
  })

  it('calls createResource exactly once per submit() with no auto-retry', async () => {
    const createResource = vi.fn().mockResolvedValue(resource)
    const { result } = renderHook(() =>
      useResourceCreationSubmit({ createResource }),
    )

    await act(async () => result.current.submit(input))

    expect(createResource).toHaveBeenCalledTimes(1)
  })

  it('reset() returns to idle', async () => {
    const createResource = vi.fn().mockResolvedValue(resource)
    const { result } = renderHook(() =>
      useResourceCreationSubmit({ createResource }),
    )

    await act(async () => result.current.submit(input))
    await waitFor(() => expect(result.current.status).toBe('success'))

    act(() => result.current.reset())

    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })
})

import { describe, expect, it, vi } from 'vitest'
import {
  RestActorConfigurationError,
  resolveRestActor,
  withRestActor,
} from '../../src/shared/api/restActor'

describe('REST actor configuration', () => {
  it.each([
    ['absent', {}],
    ['empty', { VITE_REST_ACTOR: '' }],
    ['whitespace', { VITE_REST_ACTOR: ' \t\n' }],
  ])(
    'fails closed for a %s configured actor before a mutation runs',
    async (_, env) => {
      const request = vi.fn(async () => 'sent')

      await expect(withRestActor(request, {}, env)).rejects.toBeInstanceOf(
        RestActorConfigurationError,
      )

      expect(request).not.toHaveBeenCalled()
    },
  )

  it.each(['create', 'update', 'lifecycle'])(
    'does not invoke a direct %s mutation callback without an actor',
    async () => {
      const request = vi.fn(async () => 'sent')

      await expect(
        withRestActor(request, {}, { VITE_REST_ACTOR: undefined }),
      ).rejects.toBeInstanceOf(RestActorConfigurationError)

      expect(request).not.toHaveBeenCalled()
    },
  )

  it('uses an explicit test override without normalizing it', async () => {
    const request = vi.fn(async (actor: string) => actor)

    await expect(
      withRestActor(request, { actor: 'test actor' }, { VITE_REST_ACTOR: '' }),
    ).resolves.toBe('test actor')
    expect(resolveRestActor({ actor: 'test actor' })).toBe('test actor')
    expect(request).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith('test actor')
  })
})

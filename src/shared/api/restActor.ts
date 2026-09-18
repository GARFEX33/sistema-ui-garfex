export interface RestActorOptions {
  actor?: unknown
}

export interface RestActorEnvironment {
  readonly VITE_REST_ACTOR?: unknown
}

export class RestActorConfigurationError extends Error {
  constructor() {
    super('A non-empty local REST actor is required for mutations')
    this.name = 'RestActorConfigurationError'
  }
}

const configuredActor = (
  options: RestActorOptions,
  environment: RestActorEnvironment,
): unknown => ('actor' in options ? options.actor : environment.VITE_REST_ACTOR)

export const resolveRestActor = (
  options: RestActorOptions = {},
  environment: RestActorEnvironment = import.meta.env,
): string => {
  const actor = configuredActor(options, environment)
  if (typeof actor !== 'string' || actor.trim().length === 0)
    throw new RestActorConfigurationError()
  return actor
}

export const hasRestActor = (
  options: RestActorOptions = {},
  environment: RestActorEnvironment = import.meta.env,
): boolean => {
  try {
    resolveRestActor(options, environment)
    return true
  } catch {
    return false
  }
}

export const withRestActor = async <T>(
  mutation: (actor: string) => Promise<T>,
  options: RestActorOptions = {},
  environment: RestActorEnvironment = import.meta.env,
): Promise<T> => mutation(resolveRestActor(options, environment))

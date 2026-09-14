export type RestFailure =
  | { kind: 'configuration'; message: string }
  | { kind: 'contract-gap'; message: string }
  | { kind: 'http'; status: number; error?: string }
  | { kind: 'network'; message: string }
  | { kind: 'invalid-response'; message: string }

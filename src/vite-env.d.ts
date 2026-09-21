/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REST_ACTOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

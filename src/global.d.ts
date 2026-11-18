type PendoMetadata = Record<string, string | number | boolean | string[] | null | undefined>

interface PendoOptions {
  visitor?: PendoMetadata & { id: string }
  account?: PendoMetadata & { id: string }
  [key: string]: unknown
}

interface Pendo {
  initialize(options: PendoOptions): void
  identify(options: PendoOptions): void
  updateOptions(options: PendoOptions): void
  pageLoad(url?: string): void
  track(eventName: string, properties?: Record<string, unknown>): void
  clearSession(): void
}

declare let pendo: Pendo

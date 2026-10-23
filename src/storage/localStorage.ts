import { z } from 'zod'
export const storageKeys = {
  users: 'pramaansetu_users_v1',
  session: 'pramaansetu_session_v1',
  applications: 'pramaansetu_applications_v1',
  activity: 'pramaansetu_activity_v1',
  documents: 'pramaansetu_documents_v1',
  sequence: 'pramaansetu_reference_sequence_v1',
  analysisReports: 'pramaansetu_analysis_reports_v1',
  complianceEvaluations: 'pramaansetu_compliance_evaluations_v1',
  officerReviews: 'pramaansetu_officer_reviews_v1',
  investigations: 'pramaansetu_investigations_v1',
  simulationScenarios: 'pramaansetu_simulation_scenarios_v1',
  copilotConversations: 'pramaansetu_copilot_conversations_v1',
} as const
export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys]
export class StorageError extends Error {}
let revision = 0
const listeners = new Set<() => void>()
let transactionDepth = 0
function notify() {
  if (transactionDepth) return
  revision++
  listeners.forEach((listener) => listener())
}
function onStorage(event: StorageEvent) {
  if (
    event.key === null ||
    Object.values(storageKeys).some((key) => key === event.key)
  )
    notify()
}
export function subscribeStorage(listener: () => void) {
  if (!listeners.size && typeof window !== 'undefined')
    window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size && typeof window !== 'undefined')
      window.removeEventListener('storage', onStorage)
  }
}
export const getStorageRevision = () => revision
function store(): Storage {
  try {
    return globalThis.localStorage
  } catch {
    throw new StorageError(
      'Browser storage is unavailable. Enable site storage to use local accounts.',
    )
  }
}
export function readRaw(key: StorageKey) {
  try {
    return store().getItem(key)
  } catch {
    throw new StorageError(
      'Browser storage is unavailable. Enable site storage to use local accounts.',
    )
  }
}
export function readValue<T>(
  key: StorageKey,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  const raw = readRaw(key)
  if (raw === null) return fallback
  try {
    return schema.parse(JSON.parse(raw))
  } catch {
    throw new StorageError(
      `Stored ${key === storageKeys.users ? 'account' : key === storageKeys.applications ? 'application' : 'activity'} data is unreadable or uses an unsupported version. Nothing was overwritten. Clear local prototype data to start again.`,
    )
  }
}
export function readRecords<T>(key: StorageKey, schema: z.ZodType<T>): T[] {
  return readValue(
    key,
    z.object({ version: z.literal(1), data: z.array(schema) }),
    { version: 1, data: [] },
  ).data
}
export function writeValue(key: StorageKey, value: unknown) {
  try {
    store().setItem(key, JSON.stringify(value))
  } catch {
    throw new StorageError(
      'Could not save local data. Browser storage may be full or disabled. Your changes were not saved.',
    )
  }
  notify()
}
export function writeRecords<T>(
  key: StorageKey,
  schema: z.ZodType<T>,
  data: T[],
) {
  writeValue(key, { version: 1, data: z.array(schema).parse(data) })
}
export function removeValue(key: StorageKey) {
  try {
    store().removeItem(key)
  } catch {
    throw new StorageError(
      'Could not remove local data. Check your browser storage settings.',
    )
  }
  notify()
}
// Synchronous, best-effort rollback prevents partially saved local account operations.
// localStorage is not a concurrent database or a security boundary.
export function transaction<T>(operation: () => T): T {
  const entries = Object.values(storageKeys).map(
    (key) => [key, readRaw(key)] as const,
  )
  transactionDepth++
  try {
    return operation()
  } catch (error) {
    try {
      for (const [key, raw] of entries) {
        if (raw === null) store().removeItem(key)
        else store().setItem(key, raw)
      }
    } catch {
      throw new StorageError(
        'Browser storage failed during recovery. Reload to check your local data before continuing.',
      )
    }
    throw error
  } finally {
    transactionDepth--
    notify()
  }
}
export function clearPrototypeData() {
  transaction(() => {
    Object.values(storageKeys).forEach(removeValue)
  })
}

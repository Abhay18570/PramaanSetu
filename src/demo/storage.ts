import { StorageError, readRaw, storageKeys, writeValue } from '../storage/localStorage.ts'

type DemoWorkspace = Record<string, unknown> & { version: number; seedVersion: number }

function workspace(): DemoWorkspace {
  const raw = readRaw(storageKeys.demo)
  if (!raw) throw new StorageError('The demo workspace is unavailable. Restart the demo and try again.')
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid demo workspace')
    return parsed as DemoWorkspace
  } catch {
    throw new StorageError('The demo workspace is unreadable. Reset the demo data and try again.')
  }
}

export function isDemoSession() {
  try {
    return JSON.parse(readRaw(storageKeys.session) ?? '{}').isDemo === true
  } catch {
    return false
  }
}

export function readDemoCollection<T>(key: string): T[] {
  const value = workspace()[key]
  return Array.isArray(value) ? value as T[] : []
}

export function writeDemoCollection<T>(key: string, value: T[]) {
  writeValue(storageKeys.demo, { ...workspace(), [key]: value })
}

export function readDemoNumber(key: string, fallback: number) {
  const value = workspace()[key]
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback
}

export function writeDemoNumber(key: string, value: number) {
  writeValue(storageKeys.demo, { ...workspace(), [key]: value })
}

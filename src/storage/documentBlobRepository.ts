const databaseName = 'pramaansetu_documents_v1'
const storeName = 'files'
function failure(error?: DOMException | null) {
  return new Error(
    error?.name === 'QuotaExceededError'
      ? 'Document storage is full. Remove unused files and try again.'
      : 'Document storage is unavailable. Enable browser storage and retry.',
  )
}
async function open(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) throw failure()
  return new Promise((resolve, reject) => {
    let blocked = false
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(databaseName, 1)
    } catch {
      reject(failure())
      return
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName))
        request.result.createObjectStore(storeName)
    }
    request.onerror = () => reject(failure(request.error))
    request.onblocked = () => {
      blocked = true
      reject(
        new Error('Close other PramaanSetu tabs and retry document storage.'),
      )
    }
    request.onsuccess = () => {
      if (blocked) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}
async function operation<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode)
      let result: T
      const request = action(transaction.objectStore(storeName))
      request.onsuccess = () => {
        result = request.result
      }
      transaction.oncomplete = () => {
        db.close()
        resolve(result)
      }
      transaction.onabort = () => {
        db.close()
        reject(failure(transaction.error || request.error))
      }
      transaction.onerror = () => {} // onabort reports failures once the transaction settles.
    } catch (error) {
      db.close()
      reject(failure(error instanceof DOMException ? error : null))
    }
  })
}
export const documentBlobRepository = {
  async put(key: string, blob: Blob) {
    await operation('readwrite', (store) => store.put(blob, key))
  },
  async get(key: string): Promise<Blob | null> {
    const value = await operation('readonly', (store) => store.get(key))
    return value instanceof Blob ? value : null
  },
  async remove(key: string) {
    await operation('readwrite', (store) => store.delete(key))
  },
  async keys() {
    return (await operation('readonly', (store) => store.getAllKeys())).map(
      String,
    )
  },
}
let pending: Promise<unknown> = Promise.resolve()
// All application/file mutations, including reset, share a browser-origin lock.
export function withStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  if (globalThis.navigator?.locks)
    return navigator.locks.request('pramaansetu-data-mutation', operation)
  const next = pending.then(operation, operation)
  pending = next.catch(() => {})
  return next
}

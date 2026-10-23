import { useEffect, useState, useSyncExternalStore } from 'react'
import { getStorageRevision, subscribeStorage } from '../storage/localStorage'
import { documentService } from './service'
export default function FileRecovery() {
  const revision = useSyncExternalStore(
    subscribeStorage,
    getStorageRevision,
    () => 0,
  )
  const [warning, setWarning] = useState('')
  useEffect(() => {
    let active = true
    void documentService.recover().then((message) => {
      if (active) setWarning(message)
    })
    return () => {
      active = false
    }
  }, [revision])
  return warning ? (
    <div className="file-recovery" role="status">
      {warning}{' '}
      <button
        type="button"
        onClick={() => void documentService.recover().then(setWarning)}
      >
        Retry cleanup
      </button>
    </div>
  ) : null
}

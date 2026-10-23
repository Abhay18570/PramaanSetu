import { useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmAction({
  label,
  title,
  description,
  onConfirm,
}: {
  label: string
  title: string
  description: string
  onConfirm: () => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <>
      <button
        type="button"
        className="gov-btn gov-btn-danger-outline"
        onClick={() => {
          setError('')
          dialog.current?.showModal()
        }}
      >
        {label}
      </button>

      <dialog
        ref={dialog}
        className="gov-dialog gov-confirm-dialog"
        aria-label={title}
        onCancel={event => {
          if (busy) event.preventDefault()
        }}
      >
        <div className="gov-dialog-card">
          <div className="gov-confirm-header">
            <span className="gov-confirm-icon-box">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>

          {error && (
            <p className="gov-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="gov-confirm-actions">
            <button
              autoFocus
              type="button"
              className="gov-btn gov-btn-secondary"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="gov-btn gov-btn-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onConfirm()
                  dialog.current?.close()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not perform this action.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Processing…' : 'Confirm Action'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

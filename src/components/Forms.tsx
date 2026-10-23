import type { ReactNode } from 'react'
import { Info, LoaderCircle } from 'lucide-react'

export function FormField({
  id,
  label,
  error,
  children,
  required = true,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="gov-form-field">
      <label htmlFor={id} className="gov-form-label">
        <span>{label}</span>
        {required && <span className="gov-required-star" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="gov-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function LocalNotice() {
  return (
    <div className="gov-local-notice" role="status">
      <div className="gov-notice-icon-box">
        <Info size={18} />
      </div>
      <div className="gov-notice-body">
        <strong>Local Prototype Storage Notice</strong>
        <p>
          Accounts and submitted records are saved only in this browser's localStorage. No external credentials,
          passwords, or official endorsements are required.
        </p>
      </div>
    </div>
  )
}

export function SubmitButton({
  busy,
  children,
  className = '',
}: {
  busy: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      className={`gov-btn gov-btn-primary gov-btn-block ${className}`}
      type="submit"
      disabled={busy}
    >
      {busy && <LoaderCircle size={16} className="gov-spin-icon" />}
      <span>{busy ? 'Processing…' : children}</span>
    </button>
  )
}

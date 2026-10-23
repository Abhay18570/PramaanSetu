import { useEffect, useRef, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { documentService } from '../documents/service'
import { Link } from 'react-router-dom'

export default function EvidencePreview({
  applicationId,
  documentId,
  pageNumber,
  label = 'Open source',
  findingId,
}: {
  applicationId: string
  documentId: string
  pageNumber?: number | null
  label?: string
  findingId?: string
}) {
  const { user } = useAuth()
  const [preview, setPreview] = useState<{
    url: string
    type: string
    name: string
  } | null>(null)
  const [error, setError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (preview) dialog.current?.showModal()
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])
  async function open() {
    if (!user) return
    setError('')
    try {
      const { record, blob } = await documentService.read(
        user,
        applicationId,
        documentId,
      )
      const url = URL.createObjectURL(blob)
      setPreview({
        url:
          url +
          (record.mimeType === 'application/pdf' && pageNumber
            ? `#page=${pageNumber}`
            : ''),
        type: record.mimeType,
        name: record.fileName,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Source document is unavailable.',
      )
    }
  }
  return (
    <>
      {error && (
        <span className="analysis-inline-error" role="alert">
          {error}
        </span>
      )}
      {user?.role==='OFFICER'&&<Link className="gov-btn gov-btn-primary gov-btn-sm" to={`/officer/applications/${applicationId}/evidence?${new URLSearchParams({...findingId&&{findingId},documentId,...pageNumber&&{page:String(pageNumber)}})}`}><Eye size={14}/> Inspect Evidence</Link>}
      <button
        type="button"
        className="gov-btn gov-btn-secondary gov-btn-sm"
        onClick={() => void open()}
      >
        <Eye size={14} />
        {label}
      </button>
      <dialog
        ref={dialog}
        className="document-preview-dialog"
        aria-label="Analysis evidence source"
        onCancel={() => setPreview(null)}
      >
        <div className="document-preview-header">
          <strong>
            {preview?.name}
            {pageNumber ? ` · Page ${pageNumber}` : ''}
          </strong>
          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            onClick={() => {
              dialog.current?.close()
              setPreview(null)
            }}
          >
            <X size={16} />
            Close
          </button>
        </div>
        <p className="application-note">
          Source preview with extracted evidence reference. No pixel-level
          highlighting is claimed.
        </p>
        {preview &&
          (preview.type === 'application/pdf' ? (
            <iframe
              sandbox="allow-same-origin"
              title={preview.name}
              src={preview.url}
            />
          ) : (
            <img src={preview.url} alt={`Source ${preview.name}`} />
          ))}
      </dialog>
    </>
  )
}

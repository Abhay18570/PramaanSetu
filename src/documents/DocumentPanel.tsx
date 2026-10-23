import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Download, Eye, Upload, X } from 'lucide-react'
import { documentCategories } from '../applications/config'
import { documentMetadataRepository } from '../storage/documentMetadataRepository'
import { getStorageRevision, subscribeStorage } from '../storage/localStorage'
import { documentService } from './service'
import { useAuth } from '../auth/useAuth'
import ConfirmAction from '../components/ConfirmAction'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../i18n'
interface Props {
  applicationId: string
  editable?: boolean
  errors?: Record<string, string>
  onChange?: () => void
}
export default function DocumentPanel({
  applicationId,
  editable = false,
  errors = {},
  onChange,
}: Props) {
  useTranslation()
  const { user } = useAuth()
  useSyncExternalStore(subscribeStorage, getStorageRevision, () => 0)
  const [category, setCategory] = useState<string>(documentCategories[0].id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{
    url: string
    type: string
    name: string
  } | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (preview) dialog.current?.showModal()
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])
  let records: ReturnType<typeof documentMetadataRepository.list> = []
  let readError = ''
  try {
    records = documentMetadataRepository.forApplication(applicationId)
  } catch (err) {
    readError = err instanceof Error ? err.message : 'Cannot read documents.'
  }
  async function upload(file?: File, chosen = category) {
    if (!file || !user) return
    setBusy(true)
    setError('')
    setMessage('Saving document…')
    try {
      const result = await documentService.upload(
        user,
        applicationId,
        chosen,
        file,
      )
      setMessage(result.warning || 'Document saved in this browser.')
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setMessage('')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  async function open(id: string, download = false) {
    if (!user) return
    setError('')
    try {
      const { record, blob } = await documentService.read(
        user,
        applicationId,
        id,
      )
      const url = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement('a')
        a.href = url
        a.download = record.fileName
        document.body.append(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else setPreview({ url, type: record.mimeType, name: record.fileName })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File unavailable.')
    }
  }
  return (
    <section className="application-documents">
      <h2>Supporting Documents</h2>
      <p className="application-note">
        Prototype storage: documents remain in this browser. Use sample files
        only.
      </p>
      <p className="application-note">
        Representative prototype checklist, not an exhaustive official AICTE
        requirement list. PDF, JPG or PNG · 10 MB per file · One file per
        category.
      </p>
      {editable && (
        <div
          className="document-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            if (busy) return
            if (event.dataTransfer.files.length !== 1) {
              setError('Choose one file at a time.')
              return
            }
            void upload(event.dataTransfer.files[0])
          }}
        >
          <label htmlFor="document-category">Document type</label>
          <select
            id="document-category"
            value={category}
            disabled={busy}
            onChange={(event) => setCategory(event.target.value)}
          >
            {documentCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
                {item.required ? ' — Required' : ' — Optional'}
              </option>
            ))}
          </select>
          <div className="document-upload-control">
            <Upload size={22} />
            <p>Drop a file here or browse</p>
            <input
              ref={input}
              id="document-file"
              aria-label="Browse files"
              disabled={busy}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </div>
        </div>
      )}
      {(error || readError) && (
        <p role="alert" className="gov-form-error">
          {error || readError}
        </p>
      )}
      {message && (
        <p role="status" className="application-note">
          {message}
        </p>
      )}
      <ul className="document-checklist">
        {documentCategories.map((item) => {
          const record = records.find((row) => row.documentType === item.id)
          return (
            <li key={item.id}>
              <div>
                <h3>
                  {item.label}{' '}
                  <span className="requirement-label">
                    {item.required ? 'Required' : 'Optional'}
                  </span>
                </h3>
                <p>
                  {record
                    ? `${record.fileName} · ${formatNumber(record.fileSize / 1024, { maximumFractionDigits: 1 })} KB`
                    : 'Not Uploaded'}
                </p>
                <span
                  className={record ? 'document-uploaded' : 'document-missing'}
                >
                  {record ? 'Uploaded' : 'Not Uploaded'}
                </span>
                {errors[item.id] && (
                  <p className="gov-field-error" role="alert">
                    {errors[item.id]}
                  </p>
                )}
              </div>
              <div className="document-actions">
                {record && (
                  <>
                    <button
                      type="button"
                      className="gov-btn gov-btn-secondary gov-btn-sm"
                      onClick={() => void open(record.id)}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      type="button"
                      className="gov-btn gov-btn-secondary gov-btn-sm"
                      onClick={() => void open(record.id, true)}
                    >
                      <Download size={14} /> Download
                    </button>
                    {editable && (
                      <ConfirmAction
                        label="Remove"
                        title={`Remove ${item.label}?`}
                        description="This removes the uploaded file from this draft and this browser."
                        onConfirm={async () => {
                          if (!user) return
                          const warning = await documentService.remove(
                            user,
                            applicationId,
                            record.id,
                          )
                          setMessage(warning || 'Document removed.')
                          onChange?.()
                        }}
                      />
                    )}
                  </>
                )}
                {editable && record && (
                  <label className="document-replace">
                    Replace
                    <input
                      aria-label={`Replace ${item.label}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={busy}
                      onChange={(event) => {
                        void upload(event.target.files?.[0], item.id)
                        event.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <dialog
        ref={dialog}
        className="document-preview-dialog"
        aria-label="Document preview"
        onCancel={() => setPreview(null)}
      >
        <div className="document-preview-header">
          <strong>{preview?.name}</strong>
          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            onClick={() => {
              dialog.current?.close()
              setPreview(null)
            }}
          >
            <X size={16} /> Close
          </button>
        </div>
        <p className="application-note">
          Untrusted sample file preview. No document verification has been
          performed.
        </p>
        {preview &&
          (preview.type === 'application/pdf' ? (
            <iframe
              sandbox="allow-same-origin"
              title={preview.name}
              src={preview.url}
            />
          ) : (
            <img src={preview.url} alt={`Preview of ${preview.name}`} />
          ))}
      </dialog>
    </section>
  )
}

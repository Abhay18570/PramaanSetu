import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { applicationService } from './service'
import { applicationType, institutionTypes } from './config'
import { validateApplication } from './model'
import type { ApplicationRecord } from './model'
import { getApplication, documentService } from '../documents/service'
import DocumentPanel from '../documents/DocumentPanel'
import ApplicationSummary from './Summary'
import { userRepository } from '../storage/userRepository'
import { FormField } from '../components/Forms'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n'
export default function ApplicationWizard() {
  useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [docErrors, setDocErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [declaration, setDeclaration] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const creating = useRef<Promise<ApplicationRecord> | null>(null)
  const accountId = user?.id
  const demoSession = user?.isDemo === true
  useEffect(() => {
    let active = true
    const activeUser = user?.isDemo ? user : accountId ? userRepository.findById(accountId) : null
    if (!activeUser) {
      queueMicrotask(() => {
        if (active) setError('Unable to open a new application. Please try again.')
      })
      return () => { active = false }
    }
    if (id) {
      queueMicrotask(() => {
        if (!active) return
        setApplication(null)
        setError('')
        try {
          const record = getApplication(activeUser, id, true)
          setApplication(record)
          setDirty(false)
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Application unavailable.',
          )
        }
      })
    } else {
      creating.current ??= applicationService.create(activeUser)
      void creating.current
        .then((record) => {
          if (active)
            navigate(`/institution/applications/${record.id}/edit`, {
              replace: true,
            })
        })
        .catch((err) => {
          console.error('Draft initialization failed', err)
          creating.current = null
          if (active) setError('Unable to open a new application. Please try again.')
        })
    }
    return () => {
      active = false
    }
  }, [id, accountId, demoSession, navigate, retryVersion, user])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    const click = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a[href]')
      if (
        target &&
        !window.confirm('Leave without saving the latest changes?')
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', click, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', click, true)
    }
  }, [dirty])
  if (!user) return null
  if (!application)
    return (
      <div className="gov-card application-panel">
        <h1>New Application</h1>
        {error ? (
          <>
            <p className="gov-form-error" role="alert">{error}</p>
            <button type="button" className="gov-btn gov-btn-primary" onClick={() => { setError(''); setRetryVersion(value => value + 1) }}>
              Retry
            </button>
          </>
        ) : (
          <p role="status">Opening draft…</p>
        )}
        <Link to="/institution/applications">Back to applications</Link>
      </div>
    )
  const step = application.currentStep
  function change(path: string, value: string | number | undefined) {
    setApplication((current) => {
      if (!current) return current
      const [group, key] = path.split('.')
      if (group === 'institutionDetails')
        return {
          ...current,
          institutionDetails: { ...current.institutionDetails, [key]: value },
        }
      if (group === 'applicationDetails')
        return {
          ...current,
          applicationDetails: { ...current.applicationDetails, [key]: value },
        }
      return { ...current, [path]: value }
    })
    setDirty(true)
    setErrors((current) => ({ ...current, [path]: '' }))
    setNotice('')
  }
  async function save(nextStep = step, exit = false) {
    if (!application) return
    setBusy(true)
    setError('')
    try {
      const saved = await applicationService.save(user!, {
        ...application,
        currentStep: nextStep,
      })
      setApplication(saved)
      setDirty(false)
      setNotice('Draft saved.')
      if (exit) navigate('/institution/applications')
      return saved
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save. Your input is still here.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function advance() {
    if (!application) return
    const validation = validateApplication(application, step)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setError('Check the highlighted fields.')
      return
    }
    if (step === 3) {
      try {
        const issues = await documentService.checkRequired(
          user!,
          application.id,
        )
        setDocErrors(issues)
        if (Object.keys(issues).length) {
          setError('Complete the required document checklist.')
          return
        }
      } catch (err) {
        setError((err as Error).message)
        return
      }
    }
    await save(Math.min(4, step + 1))
  }
  function field(
    path: string,
    label: string,
    value: string | number | undefined,
    type = 'text',
    options?: string[],
  ) {
    return (
      <FormField
        key={path}
        id={path}
        label={label}
        required={!label.includes('(optional)')}
        error={errors[path]}
      >
        {options ? (
          <select
            id={path}
            value={value ?? ''}
            onChange={(event) => change(path, event.target.value)}
            aria-invalid={!!errors[path]}
            aria-describedby={errors[path] ? `${path}-error` : undefined}
          >
            <option value="">Select…</option>
            {options.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        ) : (
          <input
            id={path}
            type={type}
            value={value ?? ''}
            onChange={(event) =>
              change(
                path,
                type === 'number'
                  ? event.target.value === ''
                    ? undefined
                    : Number(event.target.value)
                  : event.target.value,
              )
            }
            aria-invalid={!!errors[path]}
            aria-describedby={errors[path] ? `${path}-error` : undefined}
          />
        )}
      </FormField>
    )
  }
  return (
    <div className="application-page">
      <div className="gov-page-heading">
        <h1>Institutional Application</h1>
        <p>{application.referenceNumber} · Draft</p>
      </div>
      <p className="application-note">
        Representative Extension of Approval workflow. Not an official AICTE
        checklist or approval application. Use sample information only.
      </p>
      <ol className="wizard-stepper">
        {[
          'Institution Information',
          'Application Details',
          'Supporting Documents',
          'Review & Submit',
        ].map((label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="gov-card application-panel">
        {error && (
          <p className="gov-form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="application-success">
            {notice}
          </p>
        )}
        <fieldset disabled={busy}>
          <legend className="sr-only">Application step {step}</legend>
          {step === 1 && (
            <>
              <h2>Institution Information</h2>
              <div className="application-fields">
                {field(
                  'institutionDetails.institutionName',
                  'Institution Name',
                  application.institutionDetails.institutionName,
                )}
                {field(
                  'institutionDetails.institutionType',
                  'Institution Type',
                  application.institutionDetails.institutionType,
                  'text',
                  institutionTypes,
                )}
                {field(
                  'institutionDetails.contactPerson',
                  'Contact Person',
                  application.institutionDetails.contactPerson,
                )}
                {field(
                  'institutionDetails.email',
                  'Email Address',
                  application.institutionDetails.email,
                  'email',
                )}
                {field(
                  'institutionDetails.phone',
                  'Phone Number',
                  application.institutionDetails.phone,
                  'tel',
                )}
                {field(
                  'institutionDetails.state',
                  'State',
                  application.institutionDetails.state,
                )}
                {field(
                  'institutionDetails.city',
                  'City',
                  application.institutionDetails.city,
                )}
                {field(
                  'institutionDetails.address',
                  'Full Address',
                  application.institutionDetails.address,
                )}
                {field(
                  'institutionDetails.pincode',
                  'PIN Code',
                  application.institutionDetails.pincode,
                )}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Application Details</h2>
              <div className="application-fields">
                <FormField
                  id="applicationType"
                  label="Application Type"
                  error={errors.applicationType}
                >
                  <select
                    id="applicationType"
                    value={application.applicationType}
                    onChange={(event) =>
                      change('applicationType', event.target.value)
                    }
                  >
                    <option value={applicationType.id}>
                      {applicationType.name}
                    </option>
                  </select>
                </FormField>
                {field(
                  'academicYear',
                  'Academic Year (YYYY-YYYY)',
                  application.academicYear,
                )}
                {field(
                  'applicationDetails.institutionCode',
                  'Institution Code (optional)',
                  application.applicationDetails.institutionCode,
                )}
                {field(
                  'applicationDetails.universityAffiliation',
                  'Affiliating University (optional)',
                  application.applicationDetails.universityAffiliation,
                )}
                {field(
                  'applicationDetails.establishmentYear',
                  'Year of Establishment (optional)',
                  application.applicationDetails.establishmentYear,
                )}
                {field(
                  'applicationDetails.existingApprovalReference',
                  'Existing Approval Reference (optional)',
                  application.applicationDetails.existingApprovalReference,
                )}
                {field(
                  'applicationDetails.proposedIntake',
                  'Proposed Student Intake (optional)',
                  application.applicationDetails.proposedIntake,
                  'number',
                )}
                <FormField
                  id="remarks"
                  label="Remarks (optional)"
                  required={false}
                >
                  <textarea
                    id="remarks"
                    maxLength={2000}
                    value={application.applicationDetails.remarks}
                    onChange={(event) =>
                      change('applicationDetails.remarks', event.target.value)
                    }
                  />
                </FormField>
              </div>
            </>
          )}
          {step === 3 && (
            <DocumentPanel
              applicationId={application.id}
              editable
              errors={docErrors}
              onChange={() => {
                setApplication(getApplication(user, application.id, true))
                setDocErrors({})
              }}
            />
          )}
          {step === 4 && (
            <>
              <h2>Review & Submit</h2>
              <ApplicationSummary application={application} />
              <DocumentPanel applicationId={application.id} />
              <label className="submission-declaration">
                <input
                  type="checkbox"
                  checked={declaration}
                  onChange={(event) => setDeclaration(event.target.checked)}
                />{' '}
                I confirm that these are sample documents and that I wish to
                submit this local prototype application. Submission locks
                institution editing and does not confer official approval.
              </label>
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                disabled={!declaration}
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Submit this application? You will no longer be able to edit it.',
                    )
                  )
                    return
                  setBusy(true)
                  setError('')
                  try {
                    await applicationService.submit(
                      user,
                      application.id,
                      declaration,
                    )
                    setDirty(false)
                    navigate(`/institution/applications/${application.id}`, {
                      replace: true,
                      state: { submitted: true },
                    })
                  } catch (err) {
                    setError((err as Error).message)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Submit Application
              </button>
            </>
          )}
        </fieldset>
        <div className="wizard-actions">
          <div>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              disabled={busy}
              onClick={() => void save(step, true)}
            >
              Save & Exit
            </button>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              disabled={busy}
              onClick={() => void save()}
            >
              Save Draft
            </button>
          </div>
          <div>
            {step > 1 && (
              <button
                type="button"
                className="gov-btn gov-btn-secondary"
                disabled={busy}
                onClick={() => void save(step - 1)}
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                disabled={busy}
                onClick={() => void advance()}
              >
                Continue
              </button>
            )}
          </div>
        </div>
        <p className="application-note">
          Last saved: {formatDate(application.updatedAt)}{' '}
          {dirty ? '· Unsaved changes' : ''}
        </p>
      </div>
    </div>
  )
}

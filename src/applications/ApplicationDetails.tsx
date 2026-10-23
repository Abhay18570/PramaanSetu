import { useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getApplication } from '../documents/service'
import { getStorageRevision, subscribeStorage } from '../storage/localStorage'
import { activityRepository } from '../storage/activityRepository'
import { applicationService } from './service'
import ApplicationSummary from './Summary'
import DocumentPanel from '../documents/DocumentPanel'
import { ActivityTimeline, StatusBadge } from '../portals/Widgets'
import { statuses, statusLabels } from '../portals/data'
import ConfirmAction from '../components/ConfirmAction'
import { useNavigate } from 'react-router-dom'
import AnalysisPanel from '../analysis/AnalysisPanel'
import '../analysis/analysis.css'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n'
import CompliancePanel from '../compliance/CompliancePanel'
export default function ApplicationDetails() {
  useTranslation()
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useSyncExternalStore(subscribeStorage, getStorageRevision, () => 0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!user) return null
  let application
  let events
  try {
    application = getApplication(user, id)
    events = activityRepository.forApplication(id)
  } catch (err) {
    return (
      <div className="gov-card application-panel">
        <h1>Application unavailable</h1>
        <p role="alert">{(err as Error).message}</p>
        <Link
          to={
            user.role === 'INSTITUTION'
              ? '/institution/applications'
              : '/officer/review-queue'
          }
        >
          Back to applications
        </Link>
      </div>
    )
  }
  return (
    <div className="application-page">
      <div className="gov-page-heading">
        <h1>{application.referenceNumber}</h1>
        <StatusBadge status={application.status} />
      </div>
      <p className="application-note">
        Local prototype summary. Not an official AICTE receipt or approval
        letter.
      </p>
      {error && (
        <p role="alert" className="gov-form-error">
          {error}
        </p>
      )}
      <div className="application-toolbar">
        {application.status !== 'DRAFT' && <Link className="gov-btn gov-btn-secondary" to={`${user.role==='OFFICER'?'/officer':'/institution'}/applications/${id}/assistant`}>Ask PramaanSetu AI</Link>}
        {user.role === 'INSTITUTION' && application.status !== 'DRAFT' && <Link className="gov-btn gov-btn-primary" to={`/institution/applications/${id}/simulator`}>Simulate Corrections</Link>}
        {user.role === 'OFFICER' && application.status !== 'DRAFT' && <Link className="gov-btn gov-btn-primary" to={`/officer/applications/${id}/evidence`}>Inspect Evidence</Link>}
        <button
          className="gov-btn gov-btn-secondary"
          onClick={() => window.print()}
        >
          Print Summary
        </button>
        {user.role === 'INSTITUTION' && application.status === 'DRAFT' && (
          <>
            <Link
              className="gov-btn gov-btn-primary"
              to={`/institution/applications/${id}/edit`}
            >
              Resume Draft
            </Link>
            <ConfirmAction
              label="Delete Draft"
              title="Delete this draft?"
              description="This removes the draft and its files from this browser. It cannot be undone."
              onConfirm={async () => {
                const warning = await applicationService.deleteDraft(user, id)
                navigate('/institution/applications', { state: { warning } })
              }}
            />
          </>
        )}
        {user.role === 'OFFICER' && application.status === 'SUBMITTED' && (
          <button
            className="gov-btn gov-btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await applicationService.startReview(user, id)
              } catch (err) {
                setError((err as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          >
            Start Review
          </button>
        )}
      </div>
      <section className="gov-card application-panel">
        <h2>Workflow Status</h2>
        <ol className="application-status-timeline">
          {statuses.map((status) => {
            const event = application.statusHistory.find(
              (item) => item.status === status,
            )
            return (
              <li key={status} className={event ? 'reached' : ''}>
                <strong>{statusLabels[status]}</strong>
                <span>
                  {event
                    ? formatDate(event.timestamp)
                    : application.status === status
                      ? 'Current state · timestamp unavailable'
                      : 'Not recorded'}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="application-note">
          Submitted:{' '}
          {application.submittedAt
            ? formatDate(application.submittedAt)
            : 'Not recorded'}
        </p>
      </section>
      <section className="gov-card application-panel">
        <ApplicationSummary application={application} />
      </section>
      <section className="gov-card application-panel">
        <DocumentPanel applicationId={id} />
      </section>
      {application.status !== 'DRAFT' && (
        <AnalysisPanel application={application} user={user} />
      )}
      {application.status !== 'DRAFT' && <CompliancePanel application={application} user={user} />}
      <section className="gov-card application-panel">
        <h2>Application Activity</h2>
        <ActivityTimeline entries={events} />
        <ul className="actor-history">
          {events
            .filter((event) => event.action === 'REVIEW_STARTED')
            .map((event) => (
              <li key={event.id}>
                Review started by local officer {event.actorUserId} at{' '}
                {formatDate(event.createdAt)}.
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  CircleCheck,
  FilePlus2,
  Files,
  Flag,
  AlertTriangle,
  X,
  Scale,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ActivityTimeline, DataTable, StatCard, StatusDistribution } from './Widgets'
import { useLocalData } from './useLocalData'
import { complianceRepository, reviewRepository } from '../storage/complianceRepository'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n'

export function RegistrationSuccess() {
  const location = useLocation()
  const [visible, setVisible] = useState(!!location.state?.registered)

  return visible ? (
    <div className="gov-success-banner" role="status">
      <div className="gov-banner-content">
        <CircleCheck size={18} />
        <div>
          <strong>Local Prototype Workspace Created Successfully</strong>
          <p>Your session and account records are active in this browser's local memory.</p>
        </div>
      </div>
      <button
        type="button"
        className="gov-banner-close"
        aria-label="Dismiss notification"
        onClick={() => setVisible(false)}
      >
        <X size={16} />
      </button>
    </div>
  ) : null
}

export function InstitutionDashboard() {
  const { user } = useAuth()
  const { applications, activity, error } = useLocalData()

  const total = applications.length
  const underReview = applications.filter(item => item.status === 'UNDER_REVIEW').length
  const actionRequired = applications.filter(item => item.status === 'ACTION_REQUIRED').length
  const reviewed = applications.filter(item => item.status === 'REVIEWED').length

  return (
    <div className="gov-dashboard-view">
      <RegistrationSuccess />

      <div className="gov-page-header">
        <div className="gov-page-title-block">
          <div className="gov-page-eyebrow">INSTITUTION PORTAL</div>
          <h1>Institution Dashboard</h1>
          <p className="gov-page-subtitle">
            {user?.institutionName} {user?.city && `· ${user.city}, ${user.state}`}
          </p>
        </div>

        <div className="gov-page-header-actions">
          <Link to="/institution/new-application" className="gov-btn gov-btn-primary">
            <FilePlus2 size={16} />
            <span>Create Application</span>
          </Link>
        </div>
      </div>

      {error ? (
        <DataError error={error} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="gov-stats-grid">
            <StatCard
              label="Total Applications"
              value={total}
              icon={Files}
              accentColor="blue"
            />
            <StatCard
              label="Under Review"
              value={underReview}
              icon={Activity}
              accentColor="amber"
            />
            <StatCard
              label="Action Required"
              value={actionRequired}
              icon={AlertTriangle}
              accentColor="red"
            />
            <StatCard
              label="Reviewed"
              value={reviewed}
              icon={CircleCheck}
              accentColor="green"
            />
          </div>

          {/* Recent Applications Table */}
          <DataTable
            records={applications}
            title="Recent Applications"
            action={
              <Link className="gov-btn gov-btn-primary gov-btn-sm" to="/institution/new-application">
                <FilePlus2 size={15} />
                <span>Create Application</span>
              </Link>
            }
          />

          {/* Bottom Grid: Status Distribution & Activity */}
          <div className={applications.length ? 'gov-portal-bottom-grid' : 'gov-activity-only'}>
            <StatusDistribution records={applications} />

            <section className="gov-card gov-activity-card">
              <div className="gov-card-header">
                <div className="gov-card-title-group">
                  <h2>Recent Activity</h2>
                  <span className="gov-count-badge">Audit Log</span>
                </div>
              </div>
              <ActivityTimeline entries={activity} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export function OfficerDashboard() {
  const { user } = useAuth()
  const { applications, activity, error } = useLocalData()

  // For officer: queue includes pending applications
  const queue = applications.filter(row => row.status !== 'REVIEWED')
  const pending = applications.filter(
    item => item.status === 'SUBMITTED'
  ).length
  const flagged = applications.filter(item => item.status === 'ACTION_REQUIRED').length
  const completed = applications.filter(item => item.status === 'REVIEWED').length
  const evaluations=complianceRepository.list()
  const awaiting=applications.filter(item=>item.status==='UNDER_REVIEW'&&!evaluations.some(evaluation=>evaluation.applicationId===item.id)).length
  const withIssues=applications.filter(item=>complianceRepository.latest(item.id)?.overallAssessment==='ISSUES_DETECTED').length
  const reviewDrafts=reviewRepository.list().filter(item=>!item.finalizedAt).length

  return (
    <div className="gov-dashboard-view">
      <RegistrationSuccess />

      <div className="gov-page-header">
        <div className="gov-page-title-block">
          <div className="gov-page-eyebrow">REGULATORY SCRUTINY CONSOLE</div>
          <h1>Officer Dashboard</h1>
          <p className="gov-page-subtitle">
            Officer: {user?.name} {user?.department && `· ${user.department}`}
          </p>
        </div>

        <div className="gov-page-header-actions">
          <Link to="/officer/review-queue" className="gov-btn gov-btn-primary">
            <span>Open Review Queue</span>
          </Link>
        </div>
      </div>

      <div className="gov-info-callout">
        <Scale size={16} />
        <p>
          <strong>Scrutiny Committee Scope:</strong> Reviewing institutional approval dossiers submitted in this
          browser workspace. Verify land, infrastructure, faculty ratios, and statutory fire clearances.
        </p>
      </div>

      {error ? (
        <DataError error={error} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="gov-stats-grid gov-officer-stats-grid">
            <StatCard
              label="Pending Reviews"
              value={pending}
              icon={Activity}
              accentColor="blue"
            />
            <StatCard
              label="Flagged Applications"
              value={flagged}
              icon={Flag}
              accentColor="red"
            />
            <StatCard
              label="Completed Reviews"
              value={completed}
              icon={CircleCheck}
              accentColor="green"
            />
          </div>
          <div className="gov-info-callout"><Scale size={16}/><p><strong>Compliance:</strong> {awaiting} awaiting evaluation · {withIssues} with issues · {reviewDrafts} review drafts awaiting finalization</p></div>

          {/* Review Queue Table */}
          <DataTable
            records={queue}
            officer
            title="Active Review Queue"
          />

          {/* Bottom Grid */}
          <div className={applications.length ? 'gov-portal-bottom-grid' : 'gov-activity-only'}>
            <StatusDistribution records={applications} />

            <section className="gov-card gov-activity-card">
              <div className="gov-card-header">
                <div className="gov-card-title-group">
                  <h2>Scrutiny Activity Log</h2>
                  <span className="gov-count-badge">System Events</span>
                </div>
              </div>
              <ActivityTimeline entries={activity} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export function ComplianceReportsPage(){
  const {t}=useTranslation();const {user}=useAuth();const {applications,error}=useLocalData()
  if(error)return <DataError error={error}/>
  const rows=applications.map(application=>({application,evaluation:complianceRepository.latest(application.id),review:reviewRepository.forApplication(application.id)[0]})).filter(item=>item.evaluation)
  return <div className="gov-dashboard-view"><div className="gov-page-header"><div className="gov-page-title-block"><div className="gov-page-eyebrow">MODULE 05</div><h1>{t('verificationReports')}</h1><p className="gov-page-subtitle">{t('complianceEvaluation')}</p></div></div><section className="gov-card"><div className="gov-card-header"><h2>{t('evaluationHistory')}</h2></div>{rows.length?<div className="gov-table-responsive"><table className="gov-data-table"><thead><tr><th>Application</th><th>Institution</th><th>{t('automatedAssessment')}</th><th>{t('reviewerAssessment')}</th><th>Date</th><th>Action</th></tr></thead><tbody>{rows.map(({application,evaluation,review})=><tr key={application.id}><td>{application.referenceNumber}</td><td>{application.institutionName}</td><td>{t(overallKeys[evaluation!.overallAssessment])}</td><td>{review?.finalizedAt?t('reviewFinalized'):review?t('saveReviewDraft'):t('humanReviewRequired')}</td><td>{formatDate(evaluation!.generatedAt)}</td><td><Link className="gov-btn gov-btn-secondary gov-btn-sm" to={`${user?.role==='OFFICER'?'/officer':'/institution'}/applications/${application.id}/compliance`}>{t('viewApplication')}</Link></td></tr>)}</tbody></table></div>:<div className="gov-empty-state"><h3>{t('complianceEvaluation')}</h3><p>No compliance evaluations are available.</p></div>}</section></div>
}

const overallKeys={NO_FAILURES_DETECTED:'noFailures',ISSUES_DETECTED:'issuesDetected',INCOMPLETE_EVALUATION:'incompleteEvaluation',EVALUATION_FAILED:'evaluationFailed'} as const

export function DataError({ error }: { error: string }) {
  const { user } = useAuth()
  return (
    <div className="gov-storage-alert" role="alert">
      <ShieldAlert size={20} />
      <div>
        <strong>Storage Error Encountered</strong>
        <p>{error}</p>
        <Link
          className="gov-btn gov-btn-secondary gov-btn-sm mt-3"
          to={`/${user?.role === 'OFFICER' ? 'officer' : 'institution'}/profile`}
        >
          Manage Local Data
        </Link>
      </div>
    </div>
  )
}

export function ApplicationsPage({
  mode,
}: {
  mode: 'institution' | 'queue' | 'flagged'
}) {
  const { applications, error } = useLocalData()
  const isInstitution = mode === 'institution'

  const title = isInstitution
    ? 'All Applications'
    : mode === 'queue'
    ? 'Scrutiny Review Queue'
    : 'Flagged Applications'

  const subtitle = isInstitution
    ? 'List of all institutional extension and approval dossiers registered in this workspace.'
    : mode === 'queue'
    ? 'Locally submitted applications available for inspection and review.'
    : 'Applications explicitly marked Action Required by a review workflow.'

  const records = isInstitution
    ? applications
    : applications.filter(row =>
        mode === 'queue' ? row.status !== 'REVIEWED' : row.status === 'ACTION_REQUIRED'
      )

  return (
    <div className="gov-dashboard-view">
      <div className="gov-page-header">
        <div className="gov-page-title-block">
          <div className="gov-page-eyebrow">
            {isInstitution ? 'APPLICATIONS REPOSITORY' : 'SCRUTINY DESK'}
          </div>
          <h1>{title}</h1>
          <p className="gov-page-subtitle">{subtitle}</p>
        </div>

        {isInstitution && (
          <div className="gov-page-header-actions">
            <Link to="/institution/new-application" className="gov-btn gov-btn-primary">
              <FilePlus2 size={16} />
              <span>Create Application</span>
            </Link>
          </div>
        )}
      </div>

      {error ? (
        <DataError error={error} />
      ) : (
        <DataTable
          records={records}
          officer={!isInstitution}
          title={title}
          action={
            isInstitution ? (
              <Link className="gov-btn gov-btn-primary gov-btn-sm" to="/institution/new-application">
                <FilePlus2 size={14} />
                <span>Create Application</span>
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  )
}

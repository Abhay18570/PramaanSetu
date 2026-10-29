import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ConfirmAction from '../components/ConfirmAction'
import { applicationService } from '../applications/service'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Search, RotateCcw, FileText, ArrowUpDown, Filter } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Application, Status } from './data'
import { filterApplications, statuses, statusLabels } from './data'
import type { Activity } from '../storage/models'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n'

export function StatCard({
  label,
  value,
  icon: Icon,
  accentColor = 'blue',
}: {
  label: string
  value: number
  icon: LucideIcon
  accentColor?: 'blue' | 'amber' | 'green' | 'red'
}) {
  return (
    <article className={`gov-stat-card gov-stat-accent-${accentColor}`}>
      <div className="gov-stat-card-inner">
        <div className="gov-stat-info">
          <span className="gov-stat-label">{label}</span>
          <strong className="gov-stat-value">{value}</strong>
        </div>
        <div className="gov-stat-icon-box">
          <Icon size={22} />
        </div>
      </div>
      <div className="gov-stat-bar" />
    </article>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  const statusClass = status.toLowerCase().replaceAll('_', '-')
  return (
    <span className={`gov-status-badge gov-badge-${statusClass}`}>
      <span className="gov-status-indicator-dot" />
      <span>{statusLabels[status]}</span>
    </span>
  )
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="gov-empty-state">
      <div className="gov-empty-icon">
        <FileText size={32} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div className="gov-empty-action">{action}</div>}
    </div>
  )
}

export function DataTable({
  records,
  officer = false,
  title = 'Recent Applications',
  action,
  statusFilter,
  onStatusFilterChange,
}: {
  records: Application[]
  officer?: boolean
  title?: string
  action?: ReactNode
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
}) {
  useTranslation()
  const { user } = useAuth()
  const [operationMessage, setOperationMessage] = useState('')
  const [query, setQuery] = useState('')
  const [internalStatus, setInternalStatus] = useState('All')
  const [sort, setSort] = useState('newest')

  const status = statusFilter !== undefined ? statusFilter : internalStatus
  const handleStatusChange = (val: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(val)
    } else {
      setInternalStatus(val)
    }
  }

  const filtered = filterApplications(records, query, status, sort)

  return (
    <section className="gov-card gov-table-card">
      {operationMessage && <p role="status">{operationMessage}</p>}
      <div className="gov-card-header">
        <div className="gov-card-title-group">
          <h2>{title}</h2>
          <span className="gov-count-badge">{records.length} Total</span>
        </div>
        {action && <div className="gov-card-header-action">{action}</div>}
      </div>

      {!records.length ? (
        <EmptyState
          title={
            officer
              ? 'No applications in the review queue.'
              : 'No applications yet.'
          }
          text={
            officer
              ? 'Applications submitted by institutions will appear here for scrutiny.'
              : 'Create an application and upload sample supporting documents.'
          }
          action={action}
        />
      ) : (
        <>
          {/* Filter Bar */}
          <div className="gov-table-filter-bar">
            <div className="gov-search-box">
              <Search size={16} className="gov-search-icon" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by ID, institution name, or type…"
                aria-label="Search applications"
                className="gov-search-input"
              />
            </div>

            <div className="gov-filter-selects">
              <div className="gov-select-wrapper">
                <Filter size={14} className="gov-select-icon" />
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="gov-filter-select"
                >
                  <option value="All">All Statuses</option>
                  {statuses
                    .filter((item) => !officer || item !== 'DRAFT')
                    .map((item) => (
                      <option key={item} value={item}>
                        {statusLabels[item]}
                      </option>
                    ))}
                </select>
              </div>

              <div className="gov-select-wrapper">
                <ArrowUpDown size={14} className="gov-select-icon" />
                <select
                  aria-label="Sort applications"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="gov-filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          {filtered.length ? (
            <div
              className="gov-table-wrapper"
              tabIndex={0}
              role="region"
              aria-label={`${title} data table`}
            >
              <table className="gov-data-table">
                <thead>
                  <tr>
                    <th scope="col">Application Ref</th>
                    {officer && <th scope="col">Institution</th>}
                    <th scope="col">Application Type</th>
                    <th scope="col">Academic Year</th>
                    <th scope="col">
                      {officer ? 'Submitted On' : 'Created On'}
                    </th>
                    <th scope="col">Documents</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong className="gov-app-id" title={row.id}>
                          {row.referenceNumber ?? row.id}
                        </strong>
                      </td>
                      {officer && (
                        <td className="gov-table-inst-name">
                          {row.institutionName}
                        </td>
                      )}
                      <td>
                        <span className="gov-app-type-tag">{row.type}</span>
                      </td>
                      <td>{row.academicYear || 'Not entered'}</td>
                      <td>
                        <time
                          dateTime={
                            (officer ? row.submittedAt : row.createdAt) ||
                            undefined
                          }
                          className="gov-table-date"
                        >
                          {officer && !row.submittedAt
                            ? 'Not recorded'
                            : formatDate((officer ? row.submittedAt : row.createdAt)!, {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                        </time>
                      </td>
                      <td>{row.documentIds?.length ?? 0}</td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td>
                        <div className="application-table-actions">
                          <Link
                            className="gov-btn gov-btn-secondary gov-btn-sm"
                            to={`${officer ? '/officer' : '/institution'}/applications/${row.id}`}
                          >
                            View Application
                          </Link>
                          {!officer && row.status === 'DRAFT' && (
                            <>
                              <Link
                                className="gov-btn gov-btn-secondary gov-btn-sm"
                                to={`/institution/applications/${row.id}/edit`}
                              >
                                Resume Draft
                              </Link>
                              <ConfirmAction
                                label="Delete Draft"
                                title="Delete this draft?"
                                description="This deletes the draft and its files. It cannot be undone."
                                onConfirm={async () => {
                                  if (user) {
                                    const warning =
                                      await applicationService.deleteDraft(
                                        user,
                                        row.id,
                                      )
                                    setOperationMessage(
                                      warning || 'Draft deleted.',
                                    )
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                        {row.submittedAt && (
                          <small>
                            Submitted{' '}
                            {formatDate(row.submittedAt, { dateStyle: 'medium' })}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No matching applications found"
              text="Try adjusting your search query or status filter."
              action={
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary gov-btn-sm"
                  onClick={() => {
                    setQuery('')
                    handleStatusChange('All')
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              }
            />
          )}

          <div className="gov-table-footer" aria-live="polite">
            Showing {filtered.length} of {records.length} application records
          </div>
        </>
      )}
    </section>
  )
}

export function ActivityTimeline({ entries }: { entries: Activity[] }) {
  useTranslation()
  return entries.length ? (
    <ol className="gov-timeline-list">
      {entries.map((entry) => (
        <li key={entry.id} className="gov-timeline-item">
          <div className="gov-timeline-marker-box">
            <span className="gov-timeline-marker" />
          </div>
          <div className="gov-timeline-content">
            <strong className="gov-timeline-title">{entry.message}</strong>
            <p className="gov-timeline-timestamp">
              <time dateTime={entry.createdAt}>
                {formatDate(entry.createdAt)}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <EmptyState
      title="No recent activity logged"
      text="Activity timestamps will be recorded as actions are taken."
    />
  )
}

const statusBadgeColors: Record<Status, string> = {
  DRAFT: '#64748B',
  SUBMITTED: '#0B4F92',
  UNDER_REVIEW: '#D97706',
  ACTION_REQUIRED: '#DC2626',
  REVIEWED: '#15803D',
}

export function StatusDistribution({ records }: { records: Application[] }) {
  if (!records.length) return null

  const counts = statuses.map(
    (status) => records.filter((row) => row.status === status).length,
  )
  const segments = statuses.map((status, index) => {
    const count = counts[index]
    const previous =
      (counts.slice(0, index).reduce((sum, value) => sum + value, 0) /
        records.length) *
      100
    const pct = (count / records.length) * 100
    return {
      status,
      count,
      pct: pct.toFixed(1),
      segment: `${statusBadgeColors[status]} ${previous}% ${previous + pct}%`,
    }
  })

  return (
    <section className="gov-card gov-distribution-card">
      <div className="gov-card-header">
        <div className="gov-card-title-group">
          <h2>Application Status Distribution</h2>
          <span className="gov-count-badge">{records.length} Total</span>
        </div>
      </div>

      <div className="gov-distribution-content">
        <div
          className="gov-donut-chart"
          aria-hidden="true"
          style={{
            background: `conic-gradient(${segments.map((item) => item.segment).join(',')})`,
          }}
        >
          <div className="gov-donut-center">
            <strong>{records.length}</strong>
            <span>Dossiers</span>
          </div>
        </div>

        <ul className="gov-legend-list">
          {segments
            .filter((item) => item.count > 0)
            .map((item) => (
              <li key={item.status} className="gov-legend-item">
                <span
                  className="gov-legend-color-dot"
                  style={{ backgroundColor: statusBadgeColors[item.status] }}
                />
                <span className="gov-legend-label">
                  {statusLabels[item.status]}
                </span>
                <span className="gov-legend-count">{item.count}</span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  )
}

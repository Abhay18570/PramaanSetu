import { LayoutDashboard, Files, FilePlus2, FileChartColumn, UserRound, ListChecks, Flag, Network } from 'lucide-react'
import type { Role } from '../auth/model'
import type { Application } from '../storage/models'
export { applicationStatuses as statuses } from '../storage/models'
export type { Application, ApplicationStatus as Status } from '../storage/models'
export const statusLabels = { DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', ACTION_REQUIRED: 'Action Required', REVIEWED: 'Reviewed' }
export function filterApplications(records: Application[], query: string, status: string, sort: string) {
  const term = query.trim().toLowerCase()
  return records.filter(row => (!term || `${row.id} ${row.referenceNumber ?? ''} ${row.institutionName} ${row.type}`.toLowerCase().includes(term)) && (status === 'All' || row.status === status)).sort((a, b) => sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))
}
export const portalNavigation = {
  INSTITUTION: [ { path: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }, { path: 'applications', title: 'Applications', icon: Files }, { path: 'new-application', title: 'New Application', icon: FilePlus2 }, { path: 'reports', title: 'Reports', icon: FileChartColumn }, { path: 'profile', title: 'Profile', icon: UserRound } ],
  OFFICER: [ { path: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }, { path: 'review-queue', title: 'Review Queue', icon: ListChecks }, { path: 'flagged', title: 'Flagged Cases', icon: Flag }, { path: 'intelligence', title: 'Document Intelligence', icon: Network }, { path: 'reports', title: 'Reports', icon: FileChartColumn }, { path: 'profile', title: 'Profile', icon: UserRound } ],
} satisfies Record<Role, { path: string; title: string; icon: typeof Files }[]>

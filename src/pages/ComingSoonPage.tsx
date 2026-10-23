import { ArrowLeft, ArrowRight, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { dashboardPath } from '../auth/model'
import { AuthLayout } from './AuthPages'

export default function ComingSoonPage({
  title,
  description,
  module = 'UPCOMING PIPELINE',
}: {
  title: string
  description: string
  module?: string
}) {
  const { user } = useAuth()

  return (
    <div className="gov-card gov-coming-soon-card">
      <div className="gov-coming-soon-icon">
        <Construction size={34} />
      </div>
      <span className="gov-eyebrow">{module}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="gov-coming-soon-actions">
        <Link className="gov-btn gov-btn-secondary" to={user ? dashboardPath(user.role) : '/'}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <AuthLayout>
      <div className="gov-auth-card gov-empty-state-card text-center">
        <span className="gov-eyebrow">404 ERROR</span>
        <h1>Page Not Found</h1>
        <p>The requested portal resource is not available or has moved.</p>
        <div className="gov-coming-soon-actions">
          <Link className="gov-btn gov-btn-primary" to="/select-role">
            <span>Select Portal Workspace</span>
            <ArrowRight size={16} />
          </Link>
          <Link className="gov-back-link justify-center mt-3" to="/">
            <ArrowLeft size={14} />
            <span>Return to Portal Home</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

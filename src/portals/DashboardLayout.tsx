import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Building,
  Home,
} from 'lucide-react'
import { Brand } from '../components/Shared'
import { useAuth } from '../auth/useAuth'
import { rolePath } from '../auth/model'
import { portalNavigation } from './data'
import LanguageSelector from '../components/LanguageSelector'

export function Sidebar({ close }: { close?: () => void }) {
  const { user } = useAuth()
  if (!user) return null

  const isInstitution = user.role === 'INSTITUTION'

  return (
    <div className="gov-sidebar-container">
      <div className="gov-sidebar-brand-box">
        <Brand />
        <span className="gov-sidebar-portal-tag">
          {isInstitution ? 'INSTITUTION WORKBENCH' : 'SCRUTINY OFFICER WORKBENCH'}
        </span>
      </div>

      <nav aria-label="Portal Navigation" className="gov-sidebar-nav">
        <span className="gov-sidebar-section-label">MAIN WORKSPACE</span>
        {portalNavigation[user.role].map(({ path, title, icon: Icon }) => (
          <NavLink
            key={path}
            to={`${rolePath(user.role)}/${path}`}
            onClick={close}
            className={({ isActive }) =>
              `gov-sidebar-link ${isActive ? 'gov-sidebar-link-active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="gov-sidebar-footer">
        <Link
          className="gov-sidebar-user-card"
          to={`${rolePath(user.role)}/profile`}
          onClick={close}
          aria-label="View user profile"
        >
          <div className="gov-avatar-circle">
            {user.name
              .split(' ')
              .slice(0, 2)
              .map(word => word[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="gov-sidebar-user-info">
            <strong>{user.institutionName || user.name}</strong>
            <span>{isInstitution ? 'Institution Coordinator' : user.department || 'Regulatory Officer'}</span>
          </div>
        </Link>
        <SignOut onDone={close} />
      </div>
    </div>
  )
}

function SignOut({ onDone }: { onDone?: () => void }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  return (
    <>
      <button
        type="button"
        className="gov-sidebar-logout-btn"
        onClick={async () => {
          try {
            await signOut()
            onDone?.()
            navigate('/login', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not sign out.')
          }
        }}
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
      {error && (
        <p className="gov-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

export function DashboardHeader({ openSidebar }: { openSidebar: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [])

  if (!user) return null

  const isInstitution = user.role === 'INSTITUTION'
  const activeNavItem = portalNavigation[user.role].find(item =>
    location.pathname.endsWith(`/${item.path}`)
  )

  return (
    <header
      className="gov-portal-header"
      ref={headerRef}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          buttonRef.current?.focus()
          setProfileOpen(false)
        }
      }}
    >
      <div className="gov-header-left">
        <button
          type="button"
          className="gov-portal-mobile-toggle"
          onClick={openSidebar}
          aria-label="Open sidebar navigation"
        >
          <Menu size={22} />
        </button>

        <div className="gov-portal-breadcrumbs">
          <Link to="/" className="gov-breadcrumb-home" title="Return to Portal Home">
            <Home size={15} />
            <span>PramaanSetu</span>
          </Link>
          <span className="gov-breadcrumb-separator">/</span>
          <span className="gov-breadcrumb-portal">
            {isInstitution ? 'Institution Portal' : 'Officer Scrutiny Console'}
          </span>
          <span className="gov-breadcrumb-separator">/</span>
          <span className="gov-breadcrumb-active">{activeNavItem?.title ?? 'Workspace'}</span>
        </div>
      </div>

      <div className="gov-header-right">
        <LanguageSelector compact />
        <div className="gov-portal-meta-badge">
          {isInstitution ? <Building size={14} /> : <Shield size={14} />}
          <span>{isInstitution ? 'Institution Workspace' : 'Scrutiny Officer'}</span>
        </div>

        <div className="gov-header-profile-menu">
          <button
            ref={buttonRef}
            type="button"
            className="gov-header-profile-btn"
            aria-label="User profile options"
            aria-expanded={profileOpen}
            aria-controls="gov-header-profile-popover"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="gov-portal-avatar-mini">
              {user.name
                .split(' ')
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className="gov-header-user-text">
              <strong>{user.institutionName || user.name}</strong>
              <small>{user.email}</small>
            </div>
            <ChevronDown size={14} className={`gov-profile-chevron ${profileOpen ? 'rotate' : ''}`} />
          </button>

          {profileOpen && (
            <div id="gov-header-profile-popover" className="gov-portal-popover" role="menu">
              <div className="gov-popover-user-block">
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <span className="gov-popover-role-tag">
                  {isInstitution ? 'Institution Coordinator' : user.department || 'Officer'}
                </span>
              </div>
              <div className="gov-popover-links">
                <Link
                  to={`${rolePath(user.role)}/profile`}
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <User size={15} />
                  <span>Edit Profile</span>
                </Link>
                <Link to="/" role="menuitem" onClick={() => setProfileOpen(false)}>
                  <Home size={15} />
                  <span>Public Portal Home</span>
                </Link>
              </div>
              <div className="gov-popover-footer">
                <SignOut onDone={() => setProfileOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const location = useLocation()

  useEffect(() => {
    dialogRef.current?.close()
  }, [location.pathname])

  return (
    <div className="gov-portal-shell">
      <a className="gov-skip-link" href="#portal-content">
        Skip to workspace content
      </a>

      {/* Desktop Sidebar */}
      <aside className="gov-portal-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      <dialog
        ref={dialogRef}
        className="gov-mobile-sidebar-dialog"
        aria-label="Workspace navigation"
        onClick={event => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
      >
        <div className="gov-mobile-sidebar-wrapper">
          <button
            autoFocus
            type="button"
            className="gov-mobile-sidebar-close"
            aria-label="Close sidebar"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={22} />
          </button>
          <Sidebar close={() => dialogRef.current?.close()} />
        </div>
      </dialog>

      {/* Main Workspace Area */}
      <div className="gov-portal-content-area">
        <DashboardHeader key={location.pathname} openSidebar={() => dialogRef.current?.showModal()} />
        <main className="gov-portal-main" id="portal-content">
          <Outlet />
        </main>
        <footer className="gov-portal-footer">
          <div className="gov-portal-footer-inner">
            <span>
              PramaanSetu · Institutional Verification System · Smart India Hackathon 2026 (SIH26261)
            </span>
            <span className="gov-portal-footer-note">
              Browser-scoped local prototype. Not an official Government of India or AICTE portal.
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
